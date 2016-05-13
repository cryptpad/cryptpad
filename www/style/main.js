define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/common/realtime-input.js',
    '/common/crypto.js',
    '/bower_components/textpatcher/TextPatcher.amd.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/customize/pad.js'
], function (Config, Realtime, Crypto, TextPatcher) { 
    // TODO consider adding support for less.js
    var $ = window.jQuery;

    var $style = $('style').first(),
        $edit = $('#edit');

    var module = window.APP = {};

    var key;
    var channel = '';
    if (!/#/.test(window.location.href)) {
        key = Crypto.genKey();    
    } else {
        var hash = window.location.hash.slice(1);
        channel = hash.slice(0, 32);
        key = hash.slice(32);
    }

    var config = {
        websocketURL: Config.websocketURL,
        channel: channel,
        cryptKey: key,
        crypto: Crypto,
    };

    var userName = module.userName = config.userName = Crypto.rand64(8);

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

    var onInit = config.onInit = function (info) {
        window.location.hash = info.channel + key;
        var realtime = module.realtime = info.realtime;
        module.patchText = TextPatcher.create({
            realtime: realtime,
            logging: true,
        });

        $(window).on('hashchange', function() {
            window.location.reload();
        });
    };

    var onReady = config.onReady = function (info) {
        var userDoc = module.realtime.getUserDoc();
        draw(userDoc);
        console.log("Ready");
        initializing = false;
    };

    var onRemote = config.onRemote = function () {
        draw(module.realtime.getUserDoc());
    };

    var onAbort = config.onAbort = function (info) {
        // notify the user of the abort
        window.alert("Network Connection Lost");
    };

    var onLocal = config.onLocal = function () {
        // nope
    };


    $edit.attr('href', '/text/'+ window.location.hash);

    var rt = Realtime.start(config);
});
