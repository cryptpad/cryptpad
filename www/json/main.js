define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/common/chainpad-listmap.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/cryptpad-common.js',
    '/bower_components/jquery/dist/jquery.min.js',
    //'/customize/pad.js'
], function (Config, RtListMap, Crypto, Common) {
    var $ = window.jQuery;

    var secret = Common.getSecrets();

    var config = {
        websocketURL: Config.websocketURL,
        channel: secret.channel,
        cryptKey: secret.key,
        data: {},
        crypto: Crypto
    };

    var module = window.APP = {};

    var $repl = $('[name="repl"]');

    var setEditable = module.setEditable = function (bool) {
        [$repl].forEach(function ($el) {
            $el.attr('disabled', !bool);
        });
    };

    var initializing = true;

    setEditable(false);

    var rt = module.rt = RtListMap.create(config);
    rt.proxy.on('create', function (info) {
        console.log("initializing...");
        window.location.hash = info.channel + secret.key;
    }).on('ready', function (info) {
        console.log("...your realtime object is ready");

        rt.proxy
            // on(event, path, cb)
            .on('change', [], function (o, n, p) {
                console.log("root change event firing for path [%s]: %s => %s", p.join(','), o, n);
            })
            .on('remove', [], function (o, p, root) {
                console.log("Removal of value [%s] at path [%s]", o, p.join(','));
            })
            .on('change', ['a', 'b', 'c'], function (o, n, p) {
                console.log("Deeper change event at [%s]: %s => %s", p.join(','), o, n);
                console.log("preventing propogation...");
                return false;
            })
            // on(event, cb)
            .on('disconnect', function (info) {
                setEditable(false);
                window.alert("Network connection lost");
            });

        // set up user interface hooks
        $repl.on('keyup', function (e) {
            if (e.which === 13 /* enter keycode */) {
                var value = $repl.val();

                if (!value.trim()) { return; }

                console.log("evaluating `%s`", value);
                var x = rt.proxy;

                console.log('> ', eval(value)); // jshint ignore:line
                console.log();
                $repl.val('');
            }
        });

        setEditable(true);
    });
});
