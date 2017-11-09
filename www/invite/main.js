define([
    'jquery',
    '/common/cryptpad-common.js',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    //'/common/curve.js',
    'less!/invite/main.less',
], function ($, Cryptpad /*, Listmap, Curve*/) {
    var Messages = Cryptpad.Messages;
    var comingSoon = function () {
        return $('<div>', {
            'class': 'coming-soon',
        })
        .text(Messages.comingSoon)
        .append('<br>');
    };

    $(function () {
        Cryptpad.removeLoadingScreen();
        console.log("wut");
        $('body #mainBlock').append(comingSoon());
    });
    return;

    /* jshint ignore:start */
    var APP = window.APP = {};

    //var Messages = Cryptpad.Messages;
    var onInit = function () {};

    var onDisconnect = function () {};
    var onChange = function () {};

    var andThen = function () {
        var hash = window.location.hash.slice(1);

        var info = Cryptpad.parseTypeHash('invite', hash);
        console.log(info);

        if (!info.pubkey) {
            Cryptpad.removeLoadingScreen();
            Cryptpad.alert('invalid invite');
            return;
        }

        var proxy = Cryptpad.getProxy();
        var mySecret = proxy.curvePrivate;

        var keys = Curve.deriveKeys(info.pubkey, mySecret);
        var encryptor = Curve.createEncryptor(keys);

        Cryptpad.removeLoadingScreen();

        var listmapConfig = {
            data: {},
            network: Cryptpad.getNetwork(),
            channel: info.channel,
            readOnly: false,
            validateKey: keys.validateKey,
            crypto: encryptor,
            userName: 'profile',
            logLevel: 1,
        };
        var lm = APP.lm = Listmap.create(listmapConfig);
        lm.proxy.on('create', onInit)
                .on('ready', function () {
                    APP.initialized = true;
                    console.log(JSON.stringify(lm.proxy));
                })
                .on('disconnect', onDisconnect)
                .on('change', [], onChange);
    };

    $(function () {
        var $main = $('#mainBlock');

        // main block is hidden in case javascript is disabled
        $main.removeClass('hidden');

        APP.$container = $('#container');

        Cryptpad.ready(function () {
            Cryptpad.reportAppUsage();
            andThen();
        });
    });
    /* jshint ignore:end */
});
