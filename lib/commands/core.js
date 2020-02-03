/*jshint esversion: 6 */
/* globals process */
const Core = module.exports;
const Util = require("../common-util");
const escapeKeyCharacters = Util.escapeKeyCharacters;

/*  Use Nacl for checking signatures of messages */
const Nacl = require("tweetnacl/nacl-fast");


Core.DEFAULT_LIMIT = 50 * 1024 * 1024;
Core.SESSION_EXPIRATION_TIME = 60 * 1000;

Core.isValidId = function (chan) {
    return chan && chan.length && /^[a-zA-Z0-9=+-]*$/.test(chan) &&
        [32, 48].indexOf(chan.length) > -1;
};

var makeToken = Core.makeToken = function () {
    return Number(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))
        .toString(16);
};

Core.makeCookie = function (token) {
    var time = (+new Date());
    time -= time % 5000;

    return [
        time,
        process.pid,
        token
    ];
};

var parseCookie = function (cookie) {
    if (!(cookie && cookie.split)) { return null; }

    var parts = cookie.split('|');
    if (parts.length !== 3) { return null; }

    var c = {};
    c.time = new Date(parts[0]);
    c.pid = Number(parts[1]);
    c.seq = parts[2];
    return c;
};

Core.getSession = function (Sessions, key) {
    var safeKey = escapeKeyCharacters(key);
    if (Sessions[safeKey]) {
        Sessions[safeKey].atime = +new Date();
        return Sessions[safeKey];
    }
    var user = Sessions[safeKey] = {};
    user.atime = +new Date();
    user.tokens = [
        makeToken()
    ];
    return user;
};

Core.expireSession = function (Sessions, key, cb) {
    setTimeout(function () {
        var session = Sessions[key];
        if (!session) { return; }
        if (session.blobstage) {
            session.blobstage.close();
        }
        delete Sessions[key];
        cb(void 0, 'OK');
    });
};

var isTooOld = function (time, now) {
    return (now - time) > 300000;
};

Core.expireSessions = function (Sessions) {
    var now = +new Date();
    Object.keys(Sessions).forEach(function (key) {
        var session = Sessions[key];
        if (session && isTooOld(session.atime, now)) {
            Core.expireSession(Sessions, key);
        }
    });
};

var addTokenForKey = function (Sessions, publicKey, token) {
    if (!Sessions[publicKey]) { throw new Error('undefined user'); }

    var user = Core.getSession(Sessions, publicKey);
    user.tokens.push(token);
    user.atime = +new Date();
    if (user.tokens.length > 2) { user.tokens.shift(); }
};

Core.isValidCookie = function (Sessions, publicKey, cookie) {
    var parsed = parseCookie(cookie);
    if (!parsed) { return false; }

    var now = +new Date();

    if (!parsed.time) { return false; }
    if (isTooOld(parsed.time, now)) {
        return false;
    }

    // different process. try harder
    if (process.pid !== parsed.pid) {
        return false;
    }

    var user = Core.getSession(Sessions, publicKey);
    if (!user) { return false; }

    var idx = user.tokens.indexOf(parsed.seq);
    if (idx === -1) { return false; }

    if (idx > 0) {
        // make a new token
        addTokenForKey(Sessions, publicKey, Core.makeToken());
    }

    return true;
};

Core.checkSignature = function (Env, signedMsg, signature, publicKey) {
    if (!(signedMsg && publicKey)) { return false; }

    var signedBuffer;
    var pubBuffer;
    var signatureBuffer;

    try {
        signedBuffer = Nacl.util.decodeUTF8(signedMsg);
    } catch (e) {
        Env.Log.error('INVALID_SIGNED_BUFFER', signedMsg);
        return null;
    }

    try {
        pubBuffer = Nacl.util.decodeBase64(publicKey);
    } catch (e) {
        return false;
    }

    try {
        signatureBuffer = Nacl.util.decodeBase64(signature);
    } catch (e) {
        return false;
    }

    if (pubBuffer.length !== 32) {
        Env.Log.error('PUBLIC_KEY_LENGTH', publicKey);
        return false;
    }

    if (signatureBuffer.length !== 64) {
        return false;
    }

    return Nacl.sign.detached.verify(signedBuffer, signatureBuffer, pubBuffer);
};

// E_NO_OWNERS
Core.hasOwners = function (metadata) {
    return Boolean(metadata && Array.isArray(metadata.owners));
};

Core.hasPendingOwners = function (metadata) {
    return Boolean(metadata && Array.isArray(metadata.pending_owners));
};

// INSUFFICIENT_PERMISSIONS
Core.isOwner = function (metadata, unsafeKey) {
    return metadata.owners.indexOf(unsafeKey) !== -1;
};

Core.isPendingOwner = function (metadata, unsafeKey) {
    return metadata.pending_owners.indexOf(unsafeKey) !== -1;
};



