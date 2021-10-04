define([
    'jquery',
    '/api/config',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/toolbar.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/common/common-interface.js',

    '/bower_components/file-saver/FileSaver.min.js',
    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/convert/app-convert.less',
], function (
    $,
    ApiConfig,
    Crypto,
    Toolbar,
    nThen,
    SFCommon,
    h,
    Messages,
    UI
    )
{
    var APP = {};

    var common;
    var sFrameChan;

    var x2tConverter = function (typeSrc, typeTarget) {
        return function (data, name, cb) {
            var sframeChan = common.getSframeChannel();
            sframeChan.query('Q_OO_CONVERT', {
                data: data,
                fileName: name,
                outputFormat: typeTarget,
            }, function (err, obj) {
                if (err || !obj || !obj.data) {
                    UI.warn(Messages.error);
                    cb();
                }
                cb(obj.data, obj.images);
            }, {
                raw: true
            });
        };
    };

    var CONVERTERS = {
        xlsx: {
            //pdf: x2tConverter('xlsx', 'pdf'),
            ods: x2tConverter('xlsx', 'ods'),
            bin: x2tConverter('xlsx', 'bin'),
        },
        ods: {
            //pdf: x2tConverter('ods', 'pdf'),
            xlsx: x2tConverter('ods', 'xlsx'),
            bin: x2tConverter('ods', 'bin'),
        },
        odt: {
            docx: x2tConverter('odt', 'docx'),
            txt: x2tConverter('odt', 'txt'),
            bin: x2tConverter('odt', 'bin'),
        },
        docx: {
            odt: x2tConverter('docx', 'odt'),
            txt: x2tConverter('docx', 'txt'),
            bin: x2tConverter('docx', 'bin'),
        },
        txt: {
            odt: x2tConverter('txt', 'odt'),
            docx: x2tConverter('txt', 'docx'),
            bin: x2tConverter('txt', 'bin'),
        },
        odp: {
            pptx: x2tConverter('odp', 'pptx'),
            bin: x2tConverter('odp', 'bin'),
        },
        pptx: {
            odp: x2tConverter('pptx', 'odp'),
            bin: x2tConverter('pptx', 'bin'),
        },
    };

    Messages.convertPage = "Convert"; // XXX 4.11.0
    Messages.convert_hint = "Pick the file you want to convert. The list of output format will be visible afterward."; // XXX 4.11.0

    var createToolbar = function () {
        var displayed = ['useradmin', 'newpad', 'limit', 'pageTitle', 'notifications'];
        var configTb = {
            displayed: displayed,
            sfCommon: common,
            $container: APP.$toolbar,
            pageTitle: Messages.convertPage,
            metadataMgr: common.getMetadataMgr(),
        };
        APP.toolbar = Toolbar.create(configTb);
        APP.toolbar.$rightside.hide();
    };

    nThen(function (waitFor) {
        $(waitFor(UI.addLoadingScreen));
        SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
    }).nThen(function (waitFor) {
        APP.$container = $('#cp-sidebarlayout-container');
        APP.$toolbar = $('#cp-toolbar');
        APP.$leftside = $('<div>', {id: 'cp-sidebarlayout-leftside'}).appendTo(APP.$container);
        APP.$rightside = $('<div>', {id: 'cp-sidebarlayout-rightside'}).appendTo(APP.$container);
        sFrameChan = common.getSframeChannel();
        sFrameChan.onReady(waitFor());
    }).nThen(function (/*waitFor*/) {
        createToolbar();

        var hint = h('p.cp-convert-hint', Messages.convert_hint);

        var picker = h('input', {
            type: 'file'
        });
        APP.$rightside.append([hint, picker]);

        $(picker).on('change', function () {
            var file = picker.files[0];
            var name = file && file.name;
            var reader = new FileReader();
            var parsed = file && file.name && /.+\.([^.]+)$/.exec(file.name);
            var ext = parsed && parsed[1];
            reader.onload = function (e) {
                if (CONVERTERS[ext]) {
                    Object.keys(CONVERTERS[ext]).forEach(function (to) {
                        var button = h('button.btn', to);
                        $(button).click(function () {
                            CONVERTERS[ext][to](new Uint8Array(e.target.result), name, function (a) {
                                var n = name.slice(0, -ext.length) + to;
                                var blob = new Blob([a], {type: "application/bin;charset=utf-8"});
                                window.saveAs(blob, n);
                            });

                        }).appendTo(APP.$rightside);
                    });
                }
            };
            reader.readAsArrayBuffer(file, 'application/octet-stream');
        });

        UI.removeLoadingScreen();

    });
});
