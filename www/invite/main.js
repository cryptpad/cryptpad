define([
    'jquery',
    '/common/cryptpad-common.js',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/common/curve.js',
    'less!/invite/main.less',
], function ($, Cryptpad, Listmap, Curve) {
    var APP = window.APP = {};

    var Nacl = window.nacl;

    var alice = Nacl.box.keyPair();
    var bob = Nacl.box.keyPair();

    var packed = Curve.encrypt('pewpew', bob.publicKey, alice.secretKey);
    console.log(packed);

    var message = Curve.decrypt(packed, alice.publicKey, bob.secretKey);

    console.log(message);

    Cryptpad.removeLoadingScreen();
    Cryptpad.alert(message);

    return {};

    //var Messages = Cryptpad.Messages;
    var onReady = function () {

        if (!APP.initialized) {
            APP.initialized = true;
        }
    };

    var onInit = function () {};

    var onDisconnect = function () {};
    var onChange = function () {};

    var andThen = function (profileHash) {
        var secret = Cryptpad.getSecrets('profile', profileHash);
        var readOnly = APP.readOnly = secret.keys && !secret.keys.editKeyStr;
        var listmapConfig = {
            data: {},
            websocketURL: Cryptpad.getWebsocketURL(),
            channel: secret.channel,
            readOnly: readOnly,
            validateKey: secret.keys.validateKey || undefined,
            crypto: Crypto.createEncryptor(secret.keys),
            userName: 'profile',
            logLevel: 1,
        };
        var lm = APP.lm = Listmap.create(listmapConfig);
        lm.proxy.on('create', onInit)
                .on('ready', onReady)
                .on('disconnect', onDisconnect)
                .on('change', [], onChange);
    };

    $(function () {
        var $main = $('#mainBlock');
        // Language selector
        var $sel = $('#language-selector');
        Cryptpad.createLanguageSelector(undefined, $sel);
        $sel.find('button').addClass('btn').addClass('btn-secondary');
        $sel.show();

        // User admin menu
        var $userMenu = $('#user-menu');
        var userMenuCfg = {
            $initBlock: $userMenu
        };
        var $userAdmin = Cryptpad.createUserAdminMenu(userMenuCfg);
        $userAdmin.find('button').addClass('btn').addClass('btn-secondary');

        $(window).click(function () {
            $('.cryptpad-dropdown').hide();
        });

        // main block is hidden in case javascript is disabled
        $main.removeClass('hidden');

        APP.$container = $('#container');

        Cryptpad.ready(function () {
            Cryptpad.reportAppUsage();

            if (window.location.hash) {
                return void andThen(window.location.hash.slice(1));
            }
        });
    });

});
