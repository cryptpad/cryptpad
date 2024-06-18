// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/api/config',
    '/components/chainpad-crypto/crypto.js',
    '/common/toolbar.js',
    '/components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/common/common-interface.js',
    '/common/common-util.js',
    '/common/outer/worker-channel.js',
    '/common/outer/x2t.js',
    '/components/file-saver/FileSaver.min.js',
    'css!/components/bootstrap/dist/css/bootstrap.min.css',
    'css!/components/components-font-awesome/css/font-awesome.min.css',
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
    Util,
    Channel,
    X2T
    )
{
    var APP = window.APP = {};
    var CURRENT_VERSION = X2T.CURRENT_VERSION;

    var common;
    var sFrameChan;

    var getFileType = function (type) {
        var file = {};
        switch(type) {
            case 'doc':
                file.type = 'docx';
                file.title = 'document.docx';
                file.doc = 'text';
                break;
            case 'sheet':
                file.type = 'xlsx';
                file.title = 'spreadsheet.xlsx';
                file.doc = 'spreadsheet';
                break;
            case 'slide':
                file.type = 'pptx';
                file.title = 'presentation.pptx';
                file.doc = 'presentation';
                break;
        }
        return file;
    };

    APP.getImageURL = function(name, callback) {
        if (name && /^data:image/.test(name)) { return void callback(''); }

        if (!Array.isArray(APP.images)) { return void callback(''); }

        APP.images.some(function (obj) {
            if (obj.name !== name) { return; }
            var blob = new Blob([obj.data], {type: "application/bin;charset=utf-8"});
            var blobUrl = URL.createObjectURL(blob);
            callback(blobUrl);
            return true;
        });
    };

    var ooChannel = {};
    var makeChannel = function () {
        var msgEv = Util.mkEvent();
        var iframe = $('#cp-sidebarlayout-rightside > iframe')[0].contentWindow;
        window.addEventListener('message', function (msg) {
            if (msg.source !== iframe) { return; }
            msgEv.fire(msg);
        });
        var postMsg = function (data) { iframe.postMessage(data, '*'); };
        Channel.create(msgEv, postMsg, function (chan) {
            var send = ooChannel.send = function (obj) { chan.event('CMD', obj); };

            chan.on('CMD', function (obj) {
                if (obj.type !== "auth") { return; }
                send({
                    type: "authChanges",
                    changes: []
                });
                send({
                    type: "auth",
                    result: 1,
                    sessionId: 'cryptpad',
                    participants:[],
                    locks: [],
                    changes: [],
                    changesIndex: 0,
                    indexUser: 0,
                    buildVersion: "5.2.6",
                    buildNumber: 2,
                    licenseType: 3,
                });
                send({
                    type: "documentOpen",
                    data: {"type":"open","status":"ok","data":{"Editor.bin":obj.openCmd.url}}
                });
            });
        });
    };

    var loadOO = function (blob, type, name, cb) {
        var s = h('script', {
            type:'text/javascript',
            src: '/common/onlyoffice/dist/'+CURRENT_VERSION+'/web-apps/apps/api/documents/api.js'
        });
        var file = getFileType(type);
        APP.$rightside.append(s);
        var url = URL.createObjectURL(blob);

        var getWindow = function () {
            return window.frames && window.frames[0];
        };
        var getEditor = function () {
            var w = getWindow();
            if (!w) { return; }
            return w.editor || w.editorCell;
        };
        var getContent = function () {
            try {
                return getEditor().asc_nativeGetFile();
            } catch (e) {
                console.error(e);
                return;
            }
        };

        var ooconfig = {
            "document": {
                "fileType": file.type,
                "key": "fresh",
                "title": file.title,
                "url": url,
                "permissions": { "print": true, }
            },
            "documentType": file.doc,
            "editorConfig": {
                "user": {
                    "id": "0",
                    "firstname": Messages.anonymous,
                    "name": Messages.anonymous,
                },
                "mode": "view",
                "lang": "en"
            },
            "events": {
                "onDocumentReady": function () {
                    console.error('READY');
                    var e = getEditor();

                    var x2tConvertData = function (data, name, typeTarget, cb) {
                        var fonts = e && e.FontLoader.fontInfos;
                        var files = e && e.FontLoader.fontFiles.map(function (f) {
                            return { 'Id': f.Id, };
                        });
                        var sframeChan = common.getSframeChannel();
                        sframeChan.query('Q_OO_CONVERT', {
                            data: data,
                            fileName: name,
                            outputFormat: typeTarget,
                            images: (e && window.frames[0].AscCommon.g_oDocumentUrls.urls) || {},
                            fonts: fonts,
                            fonts_files: files,
                        }, cb, {
                            raw: true
                        });
                    };
                    APP.printPdf = function (obj) {
                        var bin = getContent();
                        x2tConvertData({
                            buffer: obj.data,
                            bin: bin
                        }, 'output.bin', 'pdf', function (err, obj) {
                            if (!obj || !obj.data) { return; }
                            var blob = new Blob([obj.data], {type: "application/pdf"});
                            cb(blob);
                        });
                    };

                    setTimeout(function () {
                        if (file.type === "xlsx") {
                            var d = e.asc_nativePrint(undefined, undefined, 0x101).ImData;
                            APP.printPdf({
                                data: d.data
                            });
                            return;
                        }
                        return void e.asc_Print({});
                    });
                }
            }
        };

        APP.docEditor = new window.DocsAPI.DocEditor("cp-oo-placeholder", ooconfig);
        makeChannel();
    };

    var convertData = function (data, name, typeTarget, cb) {
        var sframeChan = common.getSframeChannel();
        sframeChan.query('Q_OO_CONVERT', {
            data: data,
            fileName: name,
            outputFormat: typeTarget,
        }, cb, {
            raw: true
        });

    };
    var x2tConverter = function (typeSrc, typeTarget, type) {
        return function (data, name, cb) {
            if (typeTarget === 'pdf') {
                // Converting to PDF? we need to load OO from a bin
                var next = function () {
                    var blob = new Blob([data], {type: "application/bin;charset=utf-8"});
                    loadOO(blob, type, name, function (blob) {
                        cb(blob);
                    });
                };
                if (typeSrc === 'bin') { return next(); }
                convertData(data, name, 'bin', function (err, obj) {
                    if (err || !obj || !obj.data) {
                        UI.warn(Messages.error);
                        return void cb();
                    }
                    name += '.bin';
                    data = obj.data;
                    APP.images = obj.images;
                    next();
                });
                return;
            }
            convertData(data, name, typeTarget, function (err, obj) {
                if (err || !obj || !obj.data) {
                    UI.warn(Messages.error);
                    return void cb();
                }
                cb(obj.data, obj.images);
            });
        };
    };

    var CONVERTERS = {
        xlsx: {
            pdf: x2tConverter('xlsx', 'pdf', 'sheet'),
            ods: x2tConverter('xlsx', 'ods', 'sheet'),
            bin: x2tConverter('xlsx', 'bin', 'sheet'),
        },
        ods: {
            pdf: x2tConverter('ods', 'pdf', 'sheet'),
            xlsx: x2tConverter('ods', 'xlsx', 'sheet'),
            bin: x2tConverter('ods', 'bin', 'sheet'),
        },
        odt: {
            docx: x2tConverter('odt', 'docx', 'doc'),
            txt: x2tConverter('odt', 'txt', 'doc'),
            bin: x2tConverter('odt', 'bin', 'doc'),
            pdf: x2tConverter('odt', 'pdf', 'doc'),
        },
        docx: {
            odt: x2tConverter('docx', 'odt', 'doc'),
            txt: x2tConverter('docx', 'txt', 'doc'),
            bin: x2tConverter('docx', 'bin', 'doc'),
            pdf: x2tConverter('docx', 'pdf', 'doc'),
        },
        txt: {
            odt: x2tConverter('txt', 'odt', 'doc'),
            docx: x2tConverter('txt', 'docx', 'doc'),
            bin: x2tConverter('txt', 'bin', 'doc'),
            pdf: x2tConverter('txt', 'pdf', 'doc'),
        },
        odp: {
            pptx: x2tConverter('odp', 'pptx', 'slide'),
            bin: x2tConverter('odp', 'bin', 'slide'),
            pdf: x2tConverter('odp', 'pdf', 'slide'),
        },
        pptx: {
            odp: x2tConverter('pptx', 'odp', 'slide'),
            bin: x2tConverter('pptx', 'bin', 'slide'),
            pdf: x2tConverter('pptx', 'pdf', 'slide'),
        },
    };

    Messages.convertPage = "Convert"; // TODO: hard-coded text since 4.11.0
    Messages.convert_hint = "Pick the file you want to convert. The list of output format will be visible afterwards.";
    Messages.convert_unsupported = "UNSUPPORTED FILE TYPE :(";

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
        $(h('div#cp-oo-placeholder')).appendTo(APP.$rightside);
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
            APP.$rightside.find('button, div.notice').remove();
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
                } else {
                    var notice = h('div.notice', Messages.convert_unsupported);
                    APP.$rightside.append(notice);
                }
            };
            if (ext === 'bin') {
                var reader2 = new FileReader();
                reader2.onload = function (e) {
                    var str = e.target.result;
                    var type = str.slice(0,4);
                    var c = CONVERTERS['bin'] = {};

                    if (type === "XLSY") {
                        c.ods = x2tConverter('bin', 'ods', 'sheet');
                        c.xlsx = x2tConverter('bin', 'xlsx', 'sheet');
                        c.pdf = x2tConverter('bin', 'pdf', 'sheet');
                    } else if (type === "PPTY") {
                        c.odp = x2tConverter('bin', 'odp', 'slide');
                        c.pptx = x2tConverter('bin', 'pptx', 'slide');
                        c.pdf = x2tConverter('bin', 'pdf', 'slide');
                    } else if (type === "DOCY") {
                        c.odt = x2tConverter('bin', 'odt', 'doc');
                        c.docx = x2tConverter('bin', 'docx', 'doc');
                        c.pdf = x2tConverter('bin', 'pdf', 'doc');
                    } else {
                        return void console.error('Unsupported');
                    }

                    reader.readAsArrayBuffer(file, 'application/octet-stream');
                };
                return void reader2.readAsText(file);
            }
            reader.readAsArrayBuffer(file, 'application/octet-stream');
        });

        UI.removeLoadingScreen();

    });
});
