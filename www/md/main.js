define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/common/realtime-input.js',
    '/common/messages.js',
    '/common/crypto.js',
    '/common/marked.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/customize/pad.js'
], function (Config, Realtime, Messages, Crypto, Marked) { 
    var $ = jQuery;
    $(window).on('hashchange', function() {
        window.location.reload();
    });
    if (window.location.href.indexOf('#') === -1) {
        window.location.href = window.location.href + '#' + Crypto.genKey();
        return;
    }

    var key = Crypto.parseKey(window.location.hash.substring(1));


    var $textarea = $('textarea'),
        $target = $('#target');

    var draw = function (content) {
        // draw stuff
        $target.html(Marked(content));
    };

    var rts = $textarea.toArray().map(function (e, i) {
        var rt = Realtime.start(e, // window
            Config.websocketURL, // websocketUrl
            Crypto.rand64(8), // userName
            key.channel, // channel
            key.cryptKey,
            null,
            function (){
                draw($textarea.val());
            }); // cryptKey
        return rt;
    })[0];

    //rts.onEvent
    window.rts = rts;

    $textarea.on('change keyup keydown', function () {
        //console.log("pewpew");
        draw($textarea.val());
    });
});
