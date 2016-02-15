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

    var $textarea = $('textarea'),
        $run = $('#run');

    var rts = $textarea.toArray().map(function (e, i) {
        var rt = Realtime.start(e, // window
            Config.websocketURL, // websocketUrl
            Crypto.rand64(8), // userName
            key.channel, // channel
            key.cryptKey); // cryptKey
        return rt;
    });

    $run.click(function (e) {
        e.preventDefault();
        var content = $textarea.val();

        try {
            eval(content); // jshint ignore:line
        } catch (err) {
            // FIXME don't use alert, make an errorbox
            window.alert(err.message);
        }
    });
});
