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

    setEditable(false);

    var rt = module.rt = RtListMap.create(config);
    rt.proxy.on('create', function (info) {
        console.log("initializing!");
        window.location.hash = info.channel + secret.key;
        console.log(info);
    }).on('ready', function (info) {
        console.log("ready");

        console.log(info);

        rt.proxy
            // on(event, path, cb)
            .on('change', [], function (o, n, p) {
                console.log("root change event firing for path [%s]: %s => %s", p.join(','), o, n);
            }).on('change', ['a', 'b', 'c'], function (o, n, p) {
                console.log("Deeper change event at [%s]: %s => %s", p.join(','), o, n);
                console.log("preventing propogation...");
                return false;
            });

        rt.proxy.on('disconnect', function (info) {
            setEditable(false);
            console.log(info);
            window.alert("Network connection lost");
        });

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

        setEditable(true);
    });
});
