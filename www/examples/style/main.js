define([
    'jquery',
    '/api/config',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/textpatcher/TextPatcher.amd.js',
    '/common/cryptpad-common.js'
], function ($, Config, Realtime, Crypto, TextPatcher, Cryptpad) {
    // TODO consider adding support for less.js

    var $style = $('style').first(),
        $edit = $('#edit');

    var module = window.APP = {};

    var secret = Cryptpad.getSecrets();
    var config = {
        websocketURL: Config.websocketURL,
        channel: secret.channel,
        crypto: Crypto.createEncryptor(secret.key),
    };

    var lazyDraw = (function () {
        var to,
            delay = 500;
        return function (content) {
            if (to) { clearTimeout(to); }
            to = setTimeout(function () {
                $style.text(content);
            },delay);
        };
    }());

    var draw = function (content) { lazyDraw(content); };

    var initializing = true;

    config.onInit = function (info) {
        window.location.hash = info.channel + secret.key;
        var realtime = module.realtime = info.realtime;
        module.patchText = TextPatcher.create({
            realtime: realtime,
            logging: true,
        });

        $(window).on('hashchange', function() {
            window.location.reload();
        });
    };

    config.onReady = function () {
        var userDoc = module.realtime.getUserDoc();
        draw(userDoc);
        console.log("Ready");
        initializing = false;
    };

    config.onRemote = function () {
        draw(module.realtime.getUserDoc());
    };

    config.onAbort = function () {
        // notify the user of the abort
        window.alert("Network Connection Lost");
    };

    config.onLocal = function () {
        // nope
    };


    $edit.attr('href', '/examples/text/'+ window.location.hash);

    Realtime.start(config);
});
