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

    var userName = Crypto.rand64(8);

    if (window.location.href.indexOf('#') === -1) {
        window.location.href = window.location.href + '#' + Crypto.genKey();
        return;
    }

    var key = Crypto.parseKey(window.location.hash.slice(1));

    var $style = $('style').eq(1),
        $css = $('#css'),
        $edit = $('#edit');

    $edit.attr('href', '/text/'+ window.location.hash);

    var lazyDraw = (function () {
        var to,
            delay = 500;
        return function (content) {
            to && clearTimeout(to);
            to = setTimeout(function () {
                $style.text(content);
            },delay);
        };
    }());

    var draw = function () {
        lazyDraw($css.val());
    };

    $css // set the initial value
        .val($style.text())
        .on('change', draw);

    var rts = $('textarea').toArray().map(function (e, i) {
        var rt = Realtime.start(e, // window
            Config.websocketURL, // websocketUrl
            userName, // userName
            key.channel, // channel
            key.cryptKey, // cryptKey
            {
                onRemote: draw,
                onInit: draw,
                onReady: draw
            });
        return rt;
    });
});
