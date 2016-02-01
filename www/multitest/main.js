define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/common/realtime-input.js',
    '/common/messages.js',
    '/common/crypto.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/customize/pad.js'
], function (Config, Realtime, Messages, Crypto) { 
    var $ = jQuery;
    $(window).on('hashchange', function() {
        window.location.reload();
    });
    if (window.location.href.indexOf('#') === -1) {
        window.location.href = window.location.href + '#' + Crypto.genKey();
        return;
    }

    var key = Crypto.parseKey(window.location.hash.substring(1));

    var rts = $('textarea').toArray().map(function (e, i) {
        var rt = Realtime.start(e, // window
            Config.websocketURL, // websocketUrl
            Crypto.rand64(8), // userName
            key.channel, // channel
            key.cryptKey); // cryptKey
        return rt;
    });
});
