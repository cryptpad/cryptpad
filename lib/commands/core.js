/*jshint esversion: 6 */
/* globals process */
const Core = module.exports;
const Util = require("../common-util");
const escapeKeyCharacters = Util.escapeKeyCharacters;
//const { fork } = require('child_process');

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

Core.expireSession = function (Sessions, safeKey) {
    var session = Sessions[safeKey];
    if (!session) { return; }
    if (session.blobstage) {
        session.blobstage.close();
    }
    delete Sessions[safeKey];
};

Core.expireSessionAsync = function (Env, safeKey, cb) {
    setTimeout(function () {
        Core.expireSession(Env.Sessions, safeKey);
        cb(void 0, 'OK');
    });
};

var isTooOld = function (time, now) {
    return (now - time) > 300000;
};

Core.expireSessions = function (Sessions) {
    var now = +new Date();
    Object.keys(Sessions).forEach(function (safeKey) {
        var session = Sessions[safeKey];
        if (session && isTooOld(session.atime, now)) {
            Core.expireSession(Sessions, safeKey);
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

Core.haveACookie = function (Env, safeKey, cb) {
    cb();
};

