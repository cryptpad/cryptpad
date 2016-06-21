define([
    '/bower_components/chainpad-crypto/crypto.js'
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

    var rememberPad = common.rememberPad = window.rememberPad = function () {
        // bail out early
        if (!/#/.test(window.location.hash)) { return; }

        var storageKey = 'CryptPad_RECENTPADS';

        var recentPadsStr = localStorage[storageKey];

        var recentPads = [];
        if (recentPadsStr) {
            try {
                recentPads = JSON.parse(recentPadsStr);
            } catch (err) {
                // couldn't parse the localStorage?
                // just overwrite it.
            }
        }

        var now = new Date();
        var timeframe = 1000 * 60 * 60 * 24 * 30;

        var out = recentPads.filter(function (pad) {
            return (pad && pad[0] !== window.location.href &&
                (now.getTime() - new Date(pad[1]).getTime()) < timeframe);
        });

        out.push([window.location.href, now]);
        localStorage[storageKey] = JSON.stringify(out);
    };

    return common;
});
