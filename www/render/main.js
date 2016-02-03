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

    window.Vdom = Vdom;
    window.Hyperjson = Hyperjson;
    window.Hyperscript = Hyperscript;
    
    $(window).on('hashchange', function() {
        window.location.reload();
    });
    if (window.location.href.indexOf('#') === -1) {
        window.location.href = window.location.href + '#' + Crypto.genKey();
        return;
    }

    var key = Crypto.parseKey(window.location.hash.substring(1));

    var $textarea = $('textarea').first(),
        $target = $('#target');

    window.$textarea = $textarea;

    // set markdown rendering options :: strip html to prevent XSS
    Marked.setOptions({
        sanitize: true
    });

    window.draw = (function () {
        var target = $target[0],
            inner = $target.find('#inner')[0];

        if (!target) { throw new Error(); }

        var Previous = Convert.dom.to.vdom(inner);
        return function (md) {
            var rendered = Marked(md||"");
            // make a dom
            var R = $('<div id="inner">'+rendered+'</div>')[0];
            var New = Convert.dom.to.vdom(R);
            var patches = Vdom.diff(Previous, New);
            Vdom.patch(inner, patches);
            Previous = New;
            return patches;
        };
    }());

    window.colour = (function () {
        var r = 0.6,
            n = 24,
            i = 0,
            t = [],
            rgb = [0,2,4];

        while(i<n)t.push(i++);

        var colours = t.map(function (c, I) {
            return '#'+ rgb.map(function (j) {
                var x = ((Math.sin(r*(I+22)+j)*127+128) *0x01<<0)
                    .toString(16);
                return x.length<2?"0"+x:x;
            }).join("");
        });

        var J = 0;
        return function () {
            var j = J++;
            if (colours[j]) {
                return colours[j];
            }
            J = 0;
            return colours[0];
        };
    }());

    var $inner = $('#inner');

    window.makeRainbow = false
    var makeRainbows = function () {
        $inner
            .find('*:not(.untouched)')
            .css({
                'border': '5px solid '+colour(),
                margin: '5px'
            })
            .addClass('untouched');
    };

    var redrawTimeout;
    var lazyDraw = function (md) {
        redrawTimeout && clearTimeout(redrawTimeout);
        redrawTimeout = setTimeout(function () {
            draw(md);
            makeRainbow && makeRainbows();
        }, 450);
    };

    var rts = Realtime.start($textarea[0], // window
            Config.websocketURL, // websocketUrl
            Crypto.rand64(8), // userName
            key.channel, // channel
            key.cryptKey, // cryptkey
            {
                // when remote editors do things...
                onRemote: function () {
                    lazyDraw($textarea.val());
                },
                // when your editor is ready
                onReady: function (info) {
                    info.userList && console.log("Userlist: [%s]", info.userList.join(','));
                    console.log("Realtime is ready!");
                    $textarea.trigger('keyup');
                }
            });

    $textarea.on('change keyup keydown', function () {
        redrawTimeout && clearTimeout(redrawTimeout);
        redrawTimeout = setTimeout(function () {
            lazyDraw($textarea.val());
        }, 500);
    });
});
