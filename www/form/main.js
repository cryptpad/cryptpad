define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/common/RealtimeTextarea.js',
    '/common/messages.js',
    '/common/crypto.js',
    '/common/TextPatcher.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/customize/pad.js'
], function (Config, Realtime, Messages, Crypto, TextPatcher) { 
    var $ = window.jQuery;
    $(window).on('hashchange', function() {
        window.location.reload();
    });
    if (window.location.href.indexOf('#') === -1) {
        window.location.href = window.location.href + '#' + Crypto.genKey();
        return;
    }

    var module = window.APP = {};
    var key = Crypto.parseKey(window.location.hash.substring(1));
    var initializing = true;

    /* elements that we need to listen to */
    /*
        * text
        * password
        * radio
        * checkbox
        * number
        * range
        * select
        * textarea
    */

    var $textarea = $('textarea');

    var config = module.config = {
        websocketURL: Config.websocketURL + '_old',
        userName: Crypto.rand64(8),
        channel: key.channel,
        cryptKey: key.cryptKey
    };

    var setEditable = function (bool) {/* allow editing */};
    var canonicalize = function (text) {/* canonicalize all the things */};

    setEditable(false);

    var onInit = config.onInit = function (info) { };

    var onRemote = config.onRemote = function (info) {
        if (initializing) { return; }
        /* integrate remote changes */
    };

    var onLocal = config.onLocal = function () {
        if (initializing) { return; }
        /* serialize local changes */
    };

    var onReady = config.onReady = function (info) {
        var realtime = module.realtime = info.realtime;

        // create your patcher
        module.patchText = TextPatcher.create({
            realtime: realtime
        });

        // get ready

        setEditable(true);
        initializing = false;
    };

    var onAbort = config.onAbort = function (info) {};

    var rt = Realtime.start(config);

    // bind to events...
});
