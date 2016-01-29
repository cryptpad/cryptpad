define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/common/realtime-input.js',
    '/common/messages.js',
    '/common/crypto.js',
    '/common/marked.js',
    '/common/convert.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/customize/pad.js'
], function (Config, Realtime, Messages, Crypto, Marked, Convert) { 
    var $ = jQuery;

    var Vdom = Convert.core.vdom,
        Hyperjson = Convert.core.hyperjson,
        Hyperscript = Convert.core.hyperscript;
    
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

/*
    var draw = function (content) {
        // draw stuff
        $target.html(Marked(content));
    };  */

    window.draw = (function () {
        var target = $target[0],
            inner = $target.find('#inner')[0];

        if (!target) { throw new Error(); }

        var Previous = Convert.dom.to.vdom(inner);
        return function (md) {
            var rendered = Marked(md);

            // make a dom
            var R = $('<div id="inner">'+rendered+'</div>')[0];

            var New = Convert.dom.to.vdom(R);

            var patches = Vdom.diff(Previous, New);

            Vdom.patch(inner, patches);
            
            Previous = New;
        };
    }());

    var redrawTimeout;

    var rts = $textarea.toArray().map(function (e, i) {
        var rt = Realtime.start(e, // window
            Config.websocketURL, // websocketUrl
            Crypto.rand64(8), // userName
            key.channel, // channel
            key.cryptKey,
            null,
            function (){
                redrawTimeout && clearTimeout(redrawTimeout);
                setTimeout(function () {
                    draw($textarea.val());
                }, 500);
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
