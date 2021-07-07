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
    '/common/common-util.js',

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
    UI,
    Util
    )
{
    var APP = {};

    var common;
    var sFrameChan;

    var debug = console.debug;

    var x2tReady = Util.mkEvent(true);
    var x2tInitialized = false;
    var x2tInit = function(x2t) {
        debug("x2t mount");
        // x2t.FS.mount(x2t.MEMFS, {} , '/');
        x2t.FS.mkdir('/working');
        x2t.FS.mkdir('/working/media');
        x2t.FS.mkdir('/working/fonts');
        x2tInitialized = true;
        x2tReady.fire();
        //fetchFonts(x2t);
        debug("x2t mount done");
    };
    var getX2t = function (cb) {
        require(['/common/onlyoffice/x2t/x2t.js'], function() { // FIXME why does this fail without an access-control-allow-origin header?
            var x2t = window.Module;
            x2t.run();
            if (x2tInitialized) {
                debug("x2t runtime already initialized");
                return void x2tReady.reg(function () {
                    cb(x2t);
                });
            }

            x2t.onRuntimeInitialized = function() {
                debug("x2t in runtime initialized");
                // Init x2t js module
                x2tInit(x2t);
                x2tReady.reg(function () {
                    cb(x2t);
                });
            };
        });
    };
        /*
            Converting Data

            This function converts a data in a specific format to the outputformat
            The filename extension needs to represent the input format
            Example: fileName=cryptpad.bin outputFormat=xlsx
        */
        var getFormatId = function (ext) {
            // Sheets
            if (ext === 'xlsx') { return 257; }
            if (ext === 'xls') { return 258; }
            if (ext === 'ods') { return 259; }
            if (ext === 'csv') { return 260; }
            if (ext === 'pdf') { return 513; }
            // Docs
            if (ext === 'docx') { return 65; }
            if (ext === 'doc') { return 66; }
            if (ext === 'odt') { return 67; }
            if (ext === 'txt') { return 69; }
            if (ext === 'html') { return 70; }

            // Slides
            if (ext === 'pptx') { return 129; }
            if (ext === 'ppt') { return 130; }
            if (ext === 'odp') { return 131; }

            return;
        };
        var getFromId = function (ext) {
            var id = getFormatId(ext);
            if (!id) { return ''; }
            return '<m_nFormatFrom>'+id+'</m_nFormatFrom>';
        };
        var getToId = function (ext) {
            var id = getFormatId(ext);
            if (!id) { return ''; }
            return '<m_nFormatTo>'+id+'</m_nFormatTo>';
        };
    var x2tConvertDataInternal = function(x2t, data, fileName, outputFormat) {
        debug("Converting Data for " + fileName + " to " + outputFormat);

        var inputFormat = fileName.split('.').pop();

        x2t.FS.writeFile('/working/' + fileName, data);
        var params =  "<?xml version=\"1.0\" encoding=\"utf-8\"?>"
                    + "<TaskQueueDataConvert xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\">"
                    + "<m_sFileFrom>/working/" + fileName + "</m_sFileFrom>"
                    + "<m_sFileTo>/working/" + fileName + "." + outputFormat + "</m_sFileTo>"
                    + getFromId(inputFormat)
                    + getToId(outputFormat)
                    + "<m_bIsNoBase64>false</m_bIsNoBase64>"
                    + "</TaskQueueDataConvert>";
        // writing params file to mounted working disk (in memory)
        x2t.FS.writeFile('/working/params.xml', params);
        // running conversion
        x2t.ccall("runX2T", ["number"], ["string"], ["/working/params.xml"]);
        // reading output file from working disk (in memory)
        var result;
        try {
            result = x2t.FS.readFile('/working/' + fileName + "." + outputFormat);
        } catch (e) {
            console.error(e, x2t.FS);
            debug("Failed reading converted file");
            UI.warn(Messages.error);
            return "";
        }
        return result;
    };
    var x2tConverter = function (typeSrc, typeTarget) {
        return function (data, name, cb) {
            getX2t(function (x2t) {
                if (typeSrc === 'ods') {
                    data = x2tConvertDataInternal(x2t, data, name, 'xlsx');
                    name += '.xlsx';
                }
                if (typeSrc === 'odt') {
                    data = x2tConvertDataInternal(x2t, data, name, 'docx');
                    name += '.docx';
                }
                if (typeSrc === 'odp') {
                    data = x2tConvertDataInternal(x2t, data, name, 'pptx');
                    name += '.pptx';
                }
                cb(x2tConvertDataInternal(x2t, data, name, typeTarget));
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

    Messages.convertPage = "Convert"; // XXX
    Messages.convert_hint = "Pick the file you want to convert. The list of output format will be visible afterward."; // XXX

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
