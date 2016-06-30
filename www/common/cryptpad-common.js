define([
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Crypto) {
    var $ = window.jQuery;
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

    var storageKey = common.storageKey = 'CryptPad_RECENTPADS';
    var timeframe = common.timeframe = 1000 * 60 * 60 * 24 * 30;

    var getRecentPads = function () {
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
        return recentPads;
    };

    var setRecentPads = function (pads) {
        localStorage[storageKey] = JSON.stringify(pads);
    };

    var rememberPad = common.rememberPad = window.rememberPad = function (title) {
        // bail out early
        if (!/#/.test(window.location.hash)) { return; }

        var recentPads = getRecentPads();

        var now = new Date();

        var out = recentPads.filter(function (pad) {
            return (pad && pad[0] !== window.location.href &&
                (now.getTime() - new Date(pad[1]).getTime()) < timeframe);
        });

        // href, atime, name
        out.push([window.location.href, now, title || '']);
        setRecentPads(out);
    };

    var setPadTitle = common.setPadTitle = function (name) {
        var href = window.location.href;
        var recent = getRecentPads();

        var renamed = recent.map(function (pad) {
            if (pad[0] === href) {
                // update the atime
                pad[1] = new Date().toISOString();

                // set the name
                pad[2] = name;
            }
            //console.log(pad);
            return pad;
        });

        setRecentPads(renamed);
    };

    var getPadTitle = common.getPadTitle = function () {
        var href = window.location.href;
        var hashSlice = window.location.hash.slice(1,9);
        var title = '';
        getRecentPads().some(function (pad) {
            if (pad[0] === href) {
                title = pad[2] || hashSlice;
                return true;
            }
        });
        return title;
    };

    var importContent = common.importContent = function (type, f) {
        return function () {
            var $files = $('<input type="file">').click();
            $files.on('change', function (e) {
                var file = e.target.files[0];
                var reader = new FileReader();
                reader.onload = function (e) { f(e.target.result, file); };
                reader.readAsText(file, type);
            });
        };
    };

    return common;
});
