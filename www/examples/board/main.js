define([
    'jquery',
    '/api/config',
    '/customize/messages.js',
    'board.js',
    '/bower_components/textpatcher/TextPatcher.js',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/cryptpad-common.js',
    //'/common/visible.js',
    //'/common/notify.js',
    '/bower_components/file-saver/FileSaver.min.js'
], function ($, Config, Messages, Board, TextPatcher, Listmap, Crypto, Cryptpad /*, Visible, Notify*/) {

    // var saveAs = window.saveAs;

    Cryptpad.styleAlerts();
    console.log("Initializing your realtime session...");

    var secret = Cryptpad.getSecrets();

    var module = window.APP = {
        Board: Board,
    };

/*
    var unnotify = function () {
        if (!(module.tabNotification &&
            typeof(module.tabNotification.cancel) === 'function')) { return; }
        module.tabNotification.cancel();
    };
    var notify = function () {
        if (!(Visible.isSupported() && !Visible.currently())) { return; }
        unnotify();
        module.tabNotification = Notify.tab(1000, 10);
    };
*/

    var setEditable = function (bool) {
        bool = bool;
    };

    setEditable(false);

    var $lists = $('#lists');

    $('#create-list').click(function () {
        Board.List.draw($lists);
    });

    var firstUser = function () {
        UI.log("You are the first user to visit this board");
    };

    var whenReady = function () {
        var rt = module.rt;
        var proxy = rt.proxy;

        var first = Board.initialize(proxy);

        //var board = module.board = Board.create(proxy);

        Board.Draw($lists);

        if (first) { firstUser(); }
    };

    var config = {
        websocketURL: Config.websocketURL,
        channel: secret.channel,
        data: {},
        crypto: Crypto.createEncryptor(secret.key),
    };

    Cryptpad.ready(function () {
        var rt = module.rt = Listmap.create(config);
        var proxy = rt.proxy;
        proxy
        .on('create', function (info) {
            module.realtime = info.realtime;
            window.location.hash = info.channel + secret.key;
        })
        .on('ready', function () {
            UI.log("Ready!");
            whenReady({

            });
        })
        .on('disconnect', function () {
            Cryptpad.warn("Disconnected!");
        });
    });
});
