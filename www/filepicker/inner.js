define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/textpatcher/TextPatcher.js',
    '/bower_components/chainpad-json-validator/json-ot.js',
    '/common/cryptpad-common.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less/cryptpad.less',
    'less!/customize/src/less/toolbar.less',
    'less!/common/file-dialog.less',
], function (
    $,
    Crypto,
    TextPatcher,
    JsonOT,
    Cryptpad,
    nThen,
    SFCommon)
{
    var Messages = Cryptpad.Messages;

    var APP = window.APP = {
        Cryptpad: Cryptpad,
    };

    var onConnectError = function () {
        Cryptpad.errorLoadingScreen(Messages.websocketError);
    };

    var andThen = function (common) {
        //var metadataMgr = common.getMetadataMgr();
        var $body = $('body');
        var sframeChan = common.getSframeChannel();

        var onFilePicked = function (data) {
            var parsed = Cryptpad.parsePadUrl(data.url);
            var hexFileName = Cryptpad.base64ToHex(parsed.hashData.channel);
            var src = '/blob/' + hexFileName.slice(0,2) + '/' + hexFileName;
            sframeChan.event("EV_FILE_PICKED", {
                src: src,
                key: parsed.hashData.key
            });
        };

        var fmConfig = {
            body: $('body'),
            noHandlers: true,
            onUploaded: function (ev, data) {
                onFilePicked(data);
            }
        };
        APP.FM = common.createFileManager(fmConfig);
        var cfg = {
            $body: $body,
            common: common,
            onSelect: function (url) {
                onFilePicked({url: url});
            },
            data: {
                FM: APP.FM
            }
        };
        common.createFileDialog(cfg);
        Cryptpad.removeLoadingScreen();
    };

    var main = function () {
        var common;

        nThen(function (waitFor) {
            $(waitFor(function () {
                Cryptpad.addLoadingScreen();
            }));
            SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
        }).nThen(function (/*waitFor*/) {
            Cryptpad.onError(function (info) {
                if (info && info.type === "store") {
                    onConnectError();
                }
            });
            andThen(common);
        });
    };
    main();
});
