define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/common/realtime-input.js',
    '/common/crypto.js',
    '/bower_components/marked/marked.min.js',
    '/common/convert.js',
    '/common/rainbow.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/customize/pad.js'
], function (Config, Realtime, Crypto, Marked, Convert, Rainbow) { 
    var $ = window.jQuery;

    var Vdom = Convert.core.vdom,
        Hyperjson = Convert.core.hyperjson,
        Hyperscript = Convert.core.hyperscript;

    var key;
    var channel = '';
    var hash = false;
    if (!/#/.test(window.location.href)) {
        key = Crypto.genKey();
    } else {
        hash = window.location.hash.slice(1);
        channel = hash.slice(0, 32);
        key = hash.slice(32);
    }

    // set markdown rendering options :: strip html to prevent XSS
    Marked.setOptions({
        sanitize: true
    });

    var module = window.APP = {
        Vdom: Vdom,
        Hyperjson: Hyperjson,
        Hyperscript: Hyperscript
    };

    var $target = module.$target = $('#target');

    var config = {
        websocketURL: Config.websocketURL,
        userName: Crypto.rand64(8),
        channel: channel,
        cryptKey: key,
        crypto: Crypto
    };

    var draw = window.draw = (function () {
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

    var colour = module.colour = Rainbow();

    var $inner = $('#inner');

    window.makeRainbow = false;
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
        if (redrawTimeout) { clearTimeout(redrawTimeout); }
        redrawTimeout = setTimeout(function () {
            draw(md);
            if (window.makeRainbow) { makeRainbows(); }
        }, 450);
    };

    var initializing = true;

    var onInit = config.onInit = function (info) {
        window.location.hash = info.channel + key;
        module.realtime = info.realtime;
    };

    // when your editor is ready
    var onReady = config.onReady = function (info) {
        //if (info.userList) { console.log("Userlist: [%s]", info.userList.join(',')); }
        console.log("Realtime is ready!");

        var userDoc = module.realtime.getUserDoc();
        lazyDraw(userDoc);

        initializing = false;
    };

    // when remote editors do things...
    var onRemote = config.onRemote = function () {
        if (initializing) { return; }
        var userDoc = module.realtime.getUserDoc();
        lazyDraw(userDoc);
    };

    var onLocal = config.onLocal = function () {
        // we're not really expecting any local events for this editor...
        /*  but we might add a second pane in the future so that you don't need
            a second window to edit your markdown */
        if (initializing) { return; }
        var userDoc = module.realtime.getUserDoc();
        lazyDraw(userDoc);
    };

    var onAbort = config.onAbort = function () {
        window.alert("Network Connection Lost");
    };

    var rts = Realtime.start(config);
});
