define([
    '/json/api.js',
    '/common/crypto.js',
    '/common/cryptpad-common.js',
    //'/customize/pad.js'
], function (RtListMap, Crypto, Common) {
    var $ = window.jQuery;

    var secret = Common.getSecrets();

    var config = {
        channel: secret.channel,
        cryptKey: secret.key,
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
        window.location.hash = info.channel + secret.key;
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

    // debugging TODO remove
    //rt.proxy.on('change', 'u', (o, n) => console.log("'u' changed!", o,n));
    //rt.proxy.on('change', ['u', 2], (o, n) => (console.log("'u[2]' changed!", o, n), true));
});
