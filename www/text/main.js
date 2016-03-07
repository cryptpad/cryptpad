define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/common/realtime-input.js',
    '/common/messages.js',
    '/common/crypto.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/customize/pad.js'
], function (Config, Realtime, Messages, Crypto) { 
    var $ = window.jQuery;
    $(window).on('hashchange', function() {
        window.location.reload();
    });
    if (window.location.href.indexOf('#') === -1) {
        window.location.href = window.location.href + '#' + Crypto.genKey();
        return;
    }

    var key = Crypto.parseKey(window.location.hash.substring(1));
    var initializing = true;
    var $textarea = $('textarea');

    var config = {
        websocketURL: Config.websocketURL,
        userName: Crypto.rand64(8),
        channel: key.channel,
        cryptKey: key.cryptKey
    };

    var onInit = config.onInit = function (info) { };

    var onRemote = config.onRemote = function (contents) {
        if (initializing) { return; }
        // TODO...
    };

    var onReady = config.onReady = function (info) {
        initializing = false;
        $textarea.attr('disabled', false);
    };

    var onAbort = config.onAbort = function (info) {
        $textarea.attr('disabled', true);
        window.alert("Server Connection Lost");
    };

    var rt = Realtime.start(config);
});
