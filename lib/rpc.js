/*jshint esversion: 6 */
const nThen = require("nthen");

const Util = require("./common-util");
const mkEvent = Util.mkEvent;

const Core = require("./commands/core");
const Admin = require("./commands/admin-rpc");
const Pinning = require("./commands/pin-rpc");
const Quota = require("./commands/quota");
const Block = require("./commands/block");
const Metadata = require("./commands/metadata");
const Channel = require("./commands/channel");
const Upload = require("./commands/upload");

var RPC = module.exports;

const Store = require("../storage/file");
const BlobStore = require("../storage/blob");

var isUnauthenticatedCall = function (call) {
    return [
        'GET_FILE_SIZE',
        'GET_METADATA',
        'GET_MULTIPLE_FILE_SIZE',
        'IS_CHANNEL_PINNED',
        'IS_NEW_CHANNEL',
        'GET_HISTORY_OFFSET',
        'GET_DELETED_PADS',
        'WRITE_PRIVATE_MESSAGE',
    ].indexOf(call) !== -1;
};

var isAuthenticatedCall = function (call) {
    return [
        'COOKIE',
        'RESET',
        'PIN',
        'UNPIN',
        'GET_HASH',
        'GET_TOTAL_SIZE',
        'UPDATE_LIMITS',
        'GET_LIMIT',
        'UPLOAD_STATUS',
        'UPLOAD_COMPLETE',
        'OWNED_UPLOAD_COMPLETE',
        'UPLOAD_CANCEL',
        'EXPIRE_SESSION',
        'TRIM_OWNED_CHANNEL_HISTORY',
        'CLEAR_OWNED_CHANNEL',
        'REMOVE_OWNED_CHANNEL',
        'REMOVE_PINS',
        'TRIM_PINS',
        'WRITE_LOGIN_BLOCK',
        'REMOVE_LOGIN_BLOCK',
        'ADMIN',
        'SET_METADATA'
    ].indexOf(call) !== -1;
};

RPC.create = function (config, cb) {
    var Log = config.log;

    // load pin-store...
    Log.silly('LOADING RPC MODULE');

    var keyOrDefaultString = function (key, def) {
        return typeof(config[key]) === 'string'? config[key]: def;
    };

    var WARN = function (e, output) {
        if (e && output) {
            Log.warn(e, {
                output: output,
                message: String(e),
                stack: new Error(e).stack,
            });
        }
    };

    var Env = {
        defaultStorageLimit: config.defaultStorageLimit,
        maxUploadSize: config.maxUploadSize || (20 * 1024 * 1024),
        Sessions: {},
        paths: {},
        msgStore: config.store,
        pinStore: undefined,
        pinnedPads: {},
        evPinnedPadsReady: mkEvent(true),
        limits: {},
        admins: [],
        sessionExpirationInterval: undefined,
        Log: Log,
        WARN: WARN,
    };

    try {
        Env.admins = (config.adminKeys || []).map(function (k) {
            k = k.replace(/\/+$/, '');
            var s = k.split('/');
            return s[s.length-1];
        });
    } catch (e) {
        console.error("Can't parse admin keys. Please update or fix your config.js file!");
    }

    var Sessions = Env.Sessions;
    var paths = Env.paths;
    var pinPath = paths.pin = keyOrDefaultString('pinPath', './pins');
    paths.block = keyOrDefaultString('blockPath', './block');
    paths.data = keyOrDefaultString('filePath', './datastore');
    paths.staging = keyOrDefaultString('blobStagingPath', './blobstage');
    paths.blob = keyOrDefaultString('blobPath', './blob');

    var isUnauthenticateMessage = function (msg) {
        return msg && msg.length === 2 && isUnauthenticatedCall(msg[0]);
    };

    var handleUnauthenticatedMessage = function (msg, respond, nfwssCtx) {
        Log.silly('LOG_RPC', msg[0]);
        switch (msg[0]) {
            case 'GET_HISTORY_OFFSET': {
                if (typeof(msg[1]) !== 'object' || typeof(msg[1].channelName) !== 'string') {
                    return respond('INVALID_ARG_FORMAT', msg);
                }
                const msgHash = typeof(msg[1].msgHash) === 'string' ? msg[1].msgHash : undefined;
                nfwssCtx.getHistoryOffset(nfwssCtx, msg[1].channelName, msgHash, (e, ret) => {
                    if (e) {
                        if (e.code !== 'ENOENT') {
                            WARN(e.stack, msg);
                        }
                        return respond(e.message);
                    }
                    respond(e, [null, ret, null]);
                });
                break;
            }
            case 'GET_FILE_SIZE':
                return void Pinning.getFileSize(Env, msg[1], function (e, size) {
                    WARN(e, msg[1]);
                    respond(e, [null, size, null]);
                });
            case 'GET_METADATA':
                return void Metadata.getMetadata(Env, msg[1], function (e, data) {
                    WARN(e, msg[1]);
                    respond(e, [null, data, null]);
                });
            case 'GET_MULTIPLE_FILE_SIZE':
                return void Pinning.getMultipleFileSize(Env, msg[1], function (e, dict) {
                    if (e) {
                        WARN(e, dict);
                        return respond(e);
                    }
                    respond(e, [null, dict, null]);
                });
            case 'GET_DELETED_PADS':
                return void Pinning.getDeletedPads(Env, msg[1], function (e, list) {
                    if (e) {
                        WARN(e, msg[1]);
                        return respond(e);
                    }
                    respond(e, [null, list, null]);
                });
            case 'IS_CHANNEL_PINNED':
                return void Pinning.isChannelPinned(Env, msg[1], function (isPinned) {
                    respond(null, [null, isPinned, null]);
                });
            case 'IS_NEW_CHANNEL':
                return void Channel.isNewChannel(Env, msg[1], function (e, isNew) {
                    respond(e, [null, isNew, null]);
                });
            case 'WRITE_PRIVATE_MESSAGE':
                return void Channel.writePrivateMessage(Env, msg[1], nfwssCtx, function (e, output) {
                    respond(e, output);
                });
            default:
                Log.warn("UNSUPPORTED_RPC_CALL", msg);
                return respond('UNSUPPORTED_RPC_CALL', msg);
        }
    };

    var rpc0 = function (ctx, data, respond) {
        if (!Array.isArray(data)) {
            Log.debug('INVALID_ARG_FORMET', data);
            return void respond('INVALID_ARG_FORMAT');
        }

        if (!data.length) {
            return void respond("INSUFFICIENT_ARGS");
        } else if (data.length !== 1) {
            Log.debug('UNEXPECTED_ARGUMENTS_LENGTH', data);
        }

        var msg = data[0].slice(0);

        if (!Array.isArray(msg)) {
            return void respond('INVALID_ARG_FORMAT');
        }

        if (isUnauthenticateMessage(msg)) {
            return handleUnauthenticatedMessage(msg, respond, ctx);
        }

        var signature = msg.shift();
        var publicKey = msg.shift();

        // make sure a user object is initialized in the cookie jar
        if (publicKey) {
            Core.getSession(Sessions, publicKey);
        } else {
            Log.debug("NO_PUBLIC_KEY_PROVIDED", publicKey);
        }

        var cookie = msg[0];
        if (!Core.isValidCookie(Sessions, publicKey, cookie)) {
            // no cookie is fine if the RPC is to get a cookie
            if (msg[1] !== 'COOKIE') {
                return void respond('NO_COOKIE');
            }
        }

        var serialized = JSON.stringify(msg);

        if (!(serialized && typeof(publicKey) === 'string')) {
            return void respond('INVALID_MESSAGE_OR_PUBLIC_KEY');
        }

        if (isAuthenticatedCall(msg[1])) {
            if (Core.checkSignature(Env, serialized, signature, publicKey) !== true) {
                return void respond("INVALID_SIGNATURE_OR_PUBLIC_KEY");
            }
        } else if (msg[1] !== 'UPLOAD') {
            Log.warn('INVALID_RPC_CALL', msg[1]);
            return void respond("INVALID_RPC_CALL");
        }

        var safeKey = Util.escapeKeyCharacters(publicKey);
        /*  If you have gotten this far, you have signed the message with the
            public key which you provided.

            We can safely modify the state for that key

            OR it's an unauthenticated call, which must not modify the state
            for that key in a meaningful way.
        */

        // discard validated cookie from message
        msg.shift();

        var Respond = function (e, msg) {
            var session = Sessions[safeKey];
            var token = session? session.tokens.slice(-1)[0]: '';
            var cookie = Core.makeCookie(token).join('|');
            respond(e ? String(e): e, [cookie].concat(typeof(msg) !== 'undefined' ?msg: []));
        };

        if (typeof(msg) !== 'object' || !msg.length) {
            return void Respond('INVALID_MSG');
        }

        var handleMessage = function () {
            Log.silly('LOG_RPC', msg[0]);
        switch (msg[0]) {
            case 'COOKIE': return void Respond(void 0);
            case 'RESET':
                return Pinning.resetUserPins(Env, safeKey, msg[1], function (e, hash) {
                    //WARN(e, hash);
                    return void Respond(e, hash);
                });
            case 'PIN':
                return Pinning.pinChannel(Env, safeKey, msg[1], function (e, hash) {
                    WARN(e, hash);
                    Respond(e, hash);
                });
            case 'UNPIN':
                return Pinning.unpinChannel(Env, safeKey, msg[1], function (e, hash) {
                    WARN(e, hash);
                    Respond(e, hash);
                });
            case 'GET_HASH':
                return void Pinning.getHash(Env, safeKey, function (e, hash) {
                    WARN(e, hash);
                    Respond(e, hash);
                });
            case 'GET_TOTAL_SIZE': // TODO cache this, since it will get called quite a bit
                return Pinning.getTotalSize(Env, safeKey, function (e, size) {
                    if (e) {
                        WARN(e, safeKey);
                        return void Respond(e);
                    }
                    Respond(e, size);
                });
            case 'UPDATE_LIMITS':
                return void Quota.updateLimits(Env, config, safeKey, function (e, limit) {
                    if (e) {
                        WARN(e, limit);
                        return void Respond(e);
                    }
                    Respond(void 0, limit);
                });
            case 'GET_LIMIT':
                return void Pinning.getLimit(Env, safeKey, function (e, limit) {
                    if (e) {
                        WARN(e, limit);
                        return void Respond(e);
                    }
                    Respond(void 0, limit);
                });
            case 'EXPIRE_SESSION':
                return void setTimeout(function () {
                    Core.expireSession(Sessions, safeKey);
                    Respond(void 0, "OK");
                });
            case 'CLEAR_OWNED_CHANNEL':
                return void Channel.clearOwnedChannel(Env, msg[1], publicKey, function (e, response) {
                    if (e) { return void Respond(e); }
                    Respond(void 0, response);
                });

            case 'REMOVE_OWNED_CHANNEL':
                return void Channel.removeOwnedChannel(Env, msg[1], publicKey, function (e) {
                    if (e) { return void Respond(e); }
                    Respond(void 0, "OK");
                });
            case 'TRIM_OWNED_CHANNEL_HISTORY':
                return void Channel.removeOwnedChannelHistory(Env, msg[1], publicKey, msg[2], function (e) {
                    if (e) { return void Respond(e); }
                    Respond(void 0, 'OK');
                });
            case 'REMOVE_PINS':
                return void Pinning.removePins(Env, safeKey, function (e) {
                    if (e) { return void Respond(e); }
                    Respond(void 0, "OK");
                });
            case 'TRIM_PINS':
                return void Pinning.trimPins(Env, safeKey, function (e) {
                    if (e) { return void Respond(e); }
                    Respond(void 0, "OK");
                });
            case 'UPLOAD':
                return void Env.blobStore.upload(safeKey, msg[1], function (e, len) {
                    WARN(e, len);
                    Respond(e, len);
                });
            case 'UPLOAD_STATUS':
                var filesize = msg[1];
                return void Upload.upload_status(Env, safeKey, filesize, function (e, yes) {
                    if (!e && !yes) {
                        // no pending uploads, set the new size
                        var user = Core.getSession(Sessions, safeKey);
                        user.pendingUploadSize = filesize;
                        user.currentUploadSize = 0;
                    }
                    Respond(e, yes);
                });
            case 'UPLOAD_COMPLETE':
                return void Env.blobStore.complete(safeKey, msg[1], function (e, hash) {
                    WARN(e, hash);
                    Respond(e, hash);
                });
            case 'OWNED_UPLOAD_COMPLETE':
                return void Env.blobStore.completeOwned(safeKey, msg[1], function (e, blobId) {
                    WARN(e, blobId);
                    Respond(e, blobId);
                });
            case 'UPLOAD_CANCEL':
                // msg[1] is fileSize
                // if we pass it here, we can start an upload right away without calling
                // UPLOAD_STATUS again
                return void Env.blobStore.cancel(safeKey, msg[1], function (e) {
                    WARN(e, 'UPLOAD_CANCEL');
                    Respond(e);
                });
            case 'WRITE_LOGIN_BLOCK':
                return void Block.writeLoginBlock(Env, msg[1], function (e) {
                    if (e) {
                        WARN(e, 'WRITE_LOGIN_BLOCK');
                        return void Respond(e);
                    }
                    Respond(e);
                });
            case 'REMOVE_LOGIN_BLOCK':
                return void Block.removeLoginBlock(Env, msg[1], function (e) {
                    if (e) {
                        WARN(e, 'REMOVE_LOGIN_BLOCK');
                        return void Respond(e);
                    }
                    Respond(e);
                });
            case 'ADMIN':
                return void Admin.command(Env, ctx, safeKey, config, msg[1], function (e, result) {
                    if (e) {
                        WARN(e, result);
                        return void Respond(e);
                    }
                    Respond(void 0, result);
                });
            case 'SET_METADATA':
                return void Metadata.setMetadata(Env, msg[1], publicKey, function (e, data) {
                    if (e) {
                        WARN(e, data);
                        return void Respond(e);
                    }
                    Respond(void 0, data);
                });
            default:
                return void Respond('UNSUPPORTED_RPC_CALL', msg);
        }
        };

        handleMessage(true);
    };

    var rpc = function (ctx, data, respond) {
        try {
            return rpc0(ctx, data, respond);
        } catch (e) {
            console.log("Error from RPC with data " + JSON.stringify(data));
            console.log(e.stack);
        }
    };

    var updateLimitDaily = function () {
        Quota.updateLimits(Env, config, undefined, function (e) {
            if (e) {
                WARN('limitUpdate', e);
            }
        });
    };
    Quota.applyCustomLimits(Env, config);
    updateLimitDaily();
    setInterval(updateLimitDaily, 24*3600*1000);

    Pinning.loadChannelPins(Env);

    nThen(function (w) {
        Store.create({
            filePath: pinPath,
        }, w(function (s) {
            Env.pinStore = s;
        }));
        BlobStore.create({
            blobPath: config.blobPath,
            blobStagingPath: config.blobStagingPath,
            archivePath: config.archivePath,
            getSession: function (safeKey) {
                return Core.getSession(Sessions, safeKey);
            },
        }, w(function (err, blob) {
            if (err) { throw new Error(err); }
            Env.blobStore = blob;
        }));
    }).nThen(function () {
        cb(void 0, rpc);
        // expire old sessions once per minute
        // XXX allow for graceful shutdown
        Env.sessionExpirationInterval = setInterval(function () {
            Core.expireSessions(Sessions);
        }, Core.SESSION_EXPIRATION_TIME);
    });
};
