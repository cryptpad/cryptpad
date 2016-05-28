define([
    '/common/crypto.js',
], function (Crypto) {
    var common = {};

    var getSecrets = common.getSecrets = function () {
        var secret = {};
        if (!/#/.test(window.location.href)) {
            secret.key = Crypto.genKey();
        } else {
            var hash = window.location.hash.slice(1);
            secret.channel = hash.slice(0, 32);
            secret.key = hash.slice(32);
        }
        return secret;
    };

    return common;
});
