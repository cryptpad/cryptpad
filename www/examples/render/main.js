define([
    'jquery',
    '/api/config',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/marked/marked.min.js',
    '/bower_components/hyperjson/hyperjson.js',
    '/common/cryptpad-common.js',
    '/bower_components/diff-dom/diffDOM.js',
], function ($, Config, Realtime, Crypto, Marked, Hyperjson, Cryptpad) {
    var DiffDom = window.diffDOM;

    var secret = Cryptpad.getSecrets();

    // set markdown rendering options :: strip html to prevent XSS
    Marked.setOptions({
        sanitize: true
    });

    var module = window.APP = { };

    var $target = module.$target = $('#target');

    var config = {
        websocketURL: Config.websocketURL,
        channel: secret.channel,
        crypto: Crypto.createEncryptor(secret.key)
    };

    var draw = window.draw = (function () {
        var target = $target[0],
            inner = $target.find('#inner')[0];

        if (!target) { throw new Error(); }
        var DD = new DiffDom({});

        return function (md) {
            var rendered = Marked(md||"");
            // make a dom
            var New = $('<div id="inner">'+rendered+'</div>')[0];

            var patches = (DD).diff(inner, New);
            DD.apply(inner, patches);
            return patches;
        };
    }());

    var redrawTimeout;
    var lazyDraw = function (md) {
        if (redrawTimeout) { clearTimeout(redrawTimeout); }
        redrawTimeout = setTimeout(function () {
            draw(md);
        }, 450);
    };

    var initializing = true;

    config.onInit = function (info) {
        window.location.hash = info.channel + secret.key;
        module.realtime = info.realtime;
    };

    var getContent = function (userDoc) {
        try {
            var parsed = JSON.parse(userDoc);
            if (typeof(parsed.content) !== 'string') {
                throw new Error();
            }
            return parsed.content;
        } catch (err) {
            return userDoc;
        }
    };

    // when your editor is ready
    config.onReady = function () {
        console.log("Realtime is ready!");
        var userDoc = module.realtime.getUserDoc();
        lazyDraw(getContent(userDoc));
        initializing = false;
    };

    // when remote editors do things...
    config.onRemote = function () {
        if (initializing) { return; }
        var userDoc = module.realtime.getUserDoc();
        lazyDraw(getContent(userDoc));
    };

    config.onLocal = function () {
        // we're not really expecting any local events for this editor...
        /*  but we might add a second pane in the future so that you don't need
            a second window to edit your markdown */
        if (initializing) { return; }
        var userDoc = module.realtime.getUserDoc();
        lazyDraw(userDoc);
    };

    config.onAbort = function () {
        window.alert("Network Connection Lost");
    };

    Realtime.start(config);
});
