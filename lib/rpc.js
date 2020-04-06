/*jshint esversion: 6 */
const Util = require("./common-util");

const Core = require("./commands/core");
const Admin = require("./commands/admin-rpc");
const Pinning = require("./commands/pin-rpc");
const Quota = require("./commands/quota");
const Block = require("./commands/block");
const Metadata = require("./commands/metadata");
const Channel = require("./commands/channel");
const Upload = require("./commands/upload");
const HK = require("./hk-util");

var RPC = module.exports;

const UNAUTHENTICATED_CALLS = {
    GET_FILE_SIZE: Pinning.getFileSize,
    GET_MULTIPLE_FILE_SIZE: Pinning.getMultipleFileSize,
    GET_DELETED_PADS: Pinning.getDeletedPads,
    IS_CHANNEL_PINNED: Pinning.isChannelPinned, // FIXME drop this RPC
    IS_NEW_CHANNEL: Channel.isNewChannel,
    WRITE_PRIVATE_MESSAGE: Channel.writePrivateMessage,
    GET_METADATA: Metadata.getMetadata,
};

var isUnauthenticateMessage = function (msg) {
    return msg && msg.length === 2 && typeof(UNAUTHENTICATED_CALLS[msg[0]]) === 'function';
};

var handleUnauthenticatedMessage = function (Env, msg, respond, Server, netfluxId) {
    Env.Log.silly('LOG_RPC', msg[0]);

    var method = UNAUTHENTICATED_CALLS[msg[0]];
    method(Env, msg[1], function (err, value) {
        if (err) {
            Env.WARN(err, msg[1]);
            return void respond(err);
        }
        respond(err, [null, value, null]);
    }, Server, netfluxId);
};

const AUTHENTICATED_USER_TARGETED = {
    RESET: Pinning.resetUserPins,
    PIN: Pinning.pinChannel,
    UNPIN: Pinning.unpinChannel,
    CLEAR_OWNED_CHANNEL: Channel.clearOwnedChannel,
    REMOVE_OWNED_CHANNEL: Channel.removeOwnedChannel,
    TRIM_HISTORY: Channel.trimHistory,
    UPLOAD_STATUS: Upload.status,
    UPLOAD: Upload.upload,
    UPLOAD_COMPLETE: Upload.complete,
    UPLOAD_CANCEL: Upload.cancel,
    OWNED_UPLOAD_COMPLETE: Upload.complete_owned,
    WRITE_LOGIN_BLOCK: Block.writeLoginBlock,
    REMOVE_LOGIN_BLOCK: Block.removeLoginBlock,
    ADMIN: Admin.command,
    SET_METADATA: Metadata.setMetadata,
};

const AUTHENTICATED_USER_SCOPED = {
    GET_HASH: Pinning.getHash,
    GET_TOTAL_SIZE: Pinning.getTotalSize,
    UPDATE_LIMITS: Quota.getUpdatedLimit,
    GET_LIMIT: Pinning.getLimit,
    EXPIRE_SESSION: Core.expireSessionAsync,
    REMOVE_PINS: Pinning.removePins,
    TRIM_PINS: Pinning.trimPins,
    COOKIE: Core.haveACookie,
};

var isAuthenticatedCall = function (call) {
    if (call === 'UPLOAD') { return false; }
    return typeof(AUTHENTICATED_USER_TARGETED[call] || AUTHENTICATED_USER_SCOPED[call]) === 'function';
};

var handleAuthenticatedMessage = function (Env, unsafeKey, msg, respond, Server) {
    /*  If you have gotten this far, you have signed the message with the
        public key which you provided.
    */

    var safeKey = Util.escapeKeyCharacters(unsafeKey);

    var Respond = function (e, value) {
        var session = Env.Sessions[safeKey];
        var token = session? session.tokens.slice(-1)[0]: '';
        var cookie = Core.makeCookie(token).join('|');
        respond(e ? String(e): e, [cookie].concat(typeof(value) !== 'undefined' ?value: []));
    };

    msg.shift();
    // discard validated cookie from message
    if (!msg.length) {
        return void Respond('INVALID_MSG');
    }

    var TYPE = msg[0];

    Env.Log.silly('LOG_RPC', TYPE);

    if (typeof(AUTHENTICATED_USER_TARGETED[TYPE]) === 'function') {
        return void AUTHENTICATED_USER_TARGETED[TYPE](Env, safeKey, msg[1], function (e, value) {
            Env.WARN(e, value);
            return void Respond(e, value);
        }, Server);
    }

    if (typeof(AUTHENTICATED_USER_SCOPED[TYPE]) === 'function') {
        return void AUTHENTICATED_USER_SCOPED[TYPE](Env, safeKey, function (e, value) {
            if (e) {
                Env.WARN(e, safeKey);
                return void Respond(e);
            }
            Respond(e, value);
        });
    }

    return void Respond('UNSUPPORTED_RPC_CALL', msg);
};

var rpc = function (Env, Server, userId, data, respond) {
    if (!Array.isArray(data)) {
        Env.Log.debug('INVALID_ARG_FORMET', data);
        return void respond('INVALID_ARG_FORMAT');
    }

    if (!data.length) {
        return void respond("INSUFFICIENT_ARGS");
    } else if (data.length !== 1) {
        Env.Log.debug('UNEXPECTED_ARGUMENTS_LENGTH', data);
    }

    var msg = data[0].slice(0);

    if (!Array.isArray(msg)) {
        return void respond('INVALID_ARG_FORMAT');
    }

    if (isUnauthenticateMessage(msg)) {
        return handleUnauthenticatedMessage(Env, msg, respond, Server, userId);
    }

    var signature = msg.shift();
    var publicKey = msg.shift();

    // make sure a user object is initialized in the cookie jar
    var session;
    if (publicKey) {
        session = Core.getSession(Env.Sessions, publicKey);
    } else {
        Env.Log.debug("NO_PUBLIC_KEY_PROVIDED", publicKey);
    }

    var cookie = msg[0];
    if (!Core.isValidCookie(Env.Sessions, publicKey, cookie)) {
        // no cookie is fine if the RPC is to get a cookie
        if (msg[1] !== 'COOKIE') {
            return void respond('NO_COOKIE');
        }
    }

    var serialized = JSON.stringify(msg);

    if (!(serialized && typeof(publicKey) === 'string')) {
        return void respond('INVALID_MESSAGE_OR_PUBLIC_KEY');
    }

    var command = msg[1];

    if (command === 'UPLOAD') {
        // UPLOAD is a special case that skips signature validation
        // intentional fallthrough behaviour
        return void handleAuthenticatedMessage(Env, publicKey, msg, respond, Server);
    }
    if (isAuthenticatedCall(command)) {
        // check the signature on the message
        // refuse the command if it doesn't validate
        return void Env.checkSignature(serialized, signature, publicKey, function (err) {
            if (err) {
                return void respond("INVALID_SIGNATURE_OR_PUBLIC_KEY");
            }
            HK.authenticateNetfluxSession(Env, userId, publicKey);
            return void handleAuthenticatedMessage(Env, publicKey, msg, respond, Server);
        });
    }
    Env.Log.warn('INVALID_RPC_CALL', command);
    return void respond("INVALID_RPC_CALL");
};

RPC.create = function (Env, cb) {
    var Sessions = Env.Sessions;
    var updateLimitDaily = function () {
        Quota.updateCachedLimits(Env, function (e) {
            if (e) {
                Env.WARN('limitUpdate', e);
            }
        });
    };
    Quota.applyCustomLimits(Env);
    updateLimitDaily();
    Env.intervals.dailyLimitUpdate = setInterval(updateLimitDaily, 24*3600*1000);

    // expire old sessions once per minute
    Env.intervals.sessionExpirationInterval = setInterval(function () {
        Core.expireSessions(Sessions);
    }, Core.SESSION_EXPIRATION_TIME);

    cb(void 0, function (Server, userId, data, respond) {
        try {
            return rpc(Env, Server, userId, data, respond);
        } catch (e) {
            console.log("Error from RPC with data " + JSON.stringify(data));
            console.log(e.stack);
        }
    });
};
