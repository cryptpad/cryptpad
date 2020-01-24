/*jshint esversion: 6 */
const Core = module.exports;
const Util = require("../common-util");
const escapeKeyCharacters = Util.escapeKeyCharacters;

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



// getChannelList
// getSession
// getHash
// getMultipleFileSize
// sumChannelSizes
// getFreeSpace
// getLimit

