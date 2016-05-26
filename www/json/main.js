define([
    '/json/api.js',
    '/common/crypto.js',
    //'/customize/pad.js'
], function (RtListMap, Crypto) {
    var $ = window.jQuery;

    var key;
    var channel = '';
    var hash = false;
    if (!/#/.test(window.location.href)) {
        key = Crypto.genKey();
    } else {
        hash = window.location.hash.slice(1);
        channel = hash.slice(0,32);
        key = hash.slice(32);
    }

    var config = {
        channel: channel,
        cryptKey: key,
        data: {},
    };

    var module = window.APP = {};

    var $repl = $('[name="repl"]');

    var setEditable = module.setEditable = function (bool) {
        [$repl].forEach(function ($el) {
            $el.attr('disabled', !bool);
        });
    };

    var initializing = true;

    // TODO replace with `proxy.on('init'` ?
    // or just remove?
    var onInit = config.onInit = function (info) {
        console.log("initializing!");
        window.location.hash = info.channel + key;
    };

    // TODO replace with `proxy.on('ready'` ?
    var onReady = config.onReady = function (info) {
        setEditable(true);
    };

    setEditable(false);

    // TODO replace with `proxy.on('disconnect'` ?
    var onAbort = config.onAbort = function (info) {
        setEditable(false);
        window.alert("Network connection lost");
    };

    var rt = module.rt = RtListMap.create(config);

    // set up user interface hooks
    $repl.on('keyup', function (e) {
        if (e.which === 13) {
            var value = $repl.val();

            if (!value.trim()) { return; }

            console.log("evaluating `%s`", value);
            var x = rt.proxy;

            console.log('> ', eval(value)); // jshint ignore:line
            console.log();
            $repl.val('');
        }
    });
});
