define([
    'jquery',
    '/common/toolbar3.js',
    'json.sortify',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-interface.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/api/config',
    '/customize/messages.js',
    '/customize/application_config.js',
    '/bower_components/chainpad/chainpad.dist.js',
    '/file/file-crypto.js',
    '/common/onlyoffice/oocell_base.js',
    '/common/onlyoffice/oodoc_base.js',
    '/common/onlyoffice/ooslide_base.js',

    '/bower_components/tweetnacl/nacl-fast.min.js',
    '/bower_components/file-saver/FileSaver.min.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'less!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/common/onlyoffice/app-oo.less',
], function (
    $,
    Toolbar,
    JSONSortify,
    nThen,
    SFCommon,
    UI,
    Hash,
    Util,
    ApiConfig,
    Messages,
    AppConfig,
    ChainPad,
    FileCrypto,
    EmptyCell,
    EmptyDoc,
    EmptySlide)
{
    var saveAs = window.saveAs;
    var Nacl = window.nacl;

    var APP = window.APP = {
        $: $
    };

    var stringify = function (obj) {
        return JSONSortify(obj);
    };

    var toolbar;

    var andThen = function (common) {
        var readOnly = false;
        var locked = false;
        var config = {};
        var hashes = [];

        var getFileType = function () {
            var type = common.getMetadataMgr().getPrivateData().ooType;
            var title = common.getMetadataMgr().getMetadataLazy().title;
            var file = {};
            switch(type) {
                case 'oodoc':
                    file.type = 'docx';
                    file.title = title + '.docx' || 'document.docx';
                    file.doc = 'text';
                    break;
                case 'oocell':
                    file.type = 'xlsx';
                    file.title = title + '.xlsx' || 'spreadsheet.xlsx';
                    file.doc = 'spreadsheet';
                    break;
                case 'ooslide':
                    file.type = 'pptx';
                    file.title = title + '.pptx' || 'presentation.pptx';
                    file.doc = 'presentation';
                    break;
            }
            return file;
        };

        var startOO = function (blob, file) {
            if (APP.ooconfig) { return void console.error('already started'); }
            var url = URL.createObjectURL(blob);
            var lock = locked !== common.getMetadataMgr().getNetfluxId() ||
                       !common.isLoggedIn();

            // Config
            APP.ooconfig = {
                "document": {
                    "fileType": file.type,
                    "key": "fresh",
                    "title": file.title,
                    "url": url,
                    "permissions": {
                        "download": false, // FIXME: download/export is not working, so we use false
                                           // to remove the button
                    }
                },
                "documentType": file.doc,
                "editorConfig": {
                    customization: {
                        chat: false,
                        logo: {
                            url: "/bounce/#" + encodeURIComponent('https://www.onlyoffice.com')
                        }
                    },
                    "user": {
                        "id": "", //"c0c3bf82-20d7-4663-bf6d-7fa39c598b1d",
                        "name": "", //"John Smith"
                    },
                    "mode": readOnly || lock ? "view" : "edit"
                },
                "events": {
                    "onDocumentStateChange": function (evt) {
                        if (evt.data) {
                            console.log('in change (local)');
                            return;
                        }
                        console.log("in change (remote)");
                    },
                    "onReady": function(/*evt*/) {
                        var $tb = $('iframe[name="frameEditor"]').contents().find('head');
                        var css = '#id-toolbar-full .toolbar-group:nth-child(2), #id-toolbar-full .separator:nth-child(3) { display: none; }' +
                                  '#fm-btn-save { display: none !important; }' +
                                  '#header { display: none !important; }';
                        $('<style>').text(css).appendTo($tb);
                        if (UI.findOKButton().length) {
                            UI.findOKButton().on('focusout', function () {
                                window.setTimeout(function () { UI.findOKButton().focus(); });
                            });
                        }
                    },
                    "onAppReady": function(/*evt*/) { console.log("in onAppReady"); },
                    "onDownloadAs": function (evt) { console.log("in onDownloadAs", evt); }
                }
            };
            window.onbeforeunload = function () {
                var ifr = document.getElementsByTagName('iframe')[0];
                if (ifr) { ifr.remove(); }
            };
            APP.docEditor = new DocsAPI.DocEditor("cp-app-oo-placeholder", APP.ooconfig);
        };

        var getContent = APP.getContent = function () {
            try {
                return window.frames[0].editor.asc_nativeGetFile();
            } catch (e) {
                console.error(e);
                return;
            }
        };

        var fmConfig = {
            noHandlers: true,
            noStore: true,
            body: $('body'),
            onUploaded: function (ev, data) {
                if (!data || !data.url) { return; }
                common.getSframeChannel().query('Q_OO_SAVE', data, function (err) {
                    if (err) {
                        console.error(err);
                        return void UI.alert(Messages.oo_saveError);
                    }
                    hashes.push(data.url);
                    UI.log(Messages.saved);
                    APP.onLocal();
                });
            }
        };
        APP.FM = common.createFileManager(fmConfig);

        var saveToServer = function () {
            var text = getContent();
            var blob = new Blob([text], {type: 'plain/text'});
            var file = getFileType();
            blob.name = (metadataMgr.getMetadataLazy().title || file.doc) + '.' + file.type;
            APP.FM.handleFile(blob);
        };

        var loadLastDocument = function () {
            if (!hashes || !hashes.length) { return; }
            var last = hashes.slice().pop();
            var parsed = Hash.parsePadUrl(last);
            var secret = Hash.getSecrets('file', parsed.hash);
            if (!secret || !secret.channel) { return; }
            var hexFileName = secret.channel;
            var src = Hash.getBlobPathFromHex(hexFileName);
            var key = secret.keys && secret.keys.cryptKey;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', src, true);
            xhr.responseType = 'arraybuffer';
            xhr.onload = function () {
                if (/^4/.test('' + this.status)) {
                    return void console.error('XHR error', this.status);
                }
                var arrayBuffer = xhr.response;
                if (arrayBuffer) {
                    var u8 = new Uint8Array(arrayBuffer);
                    FileCrypto.decrypt(u8, key, function (err, decrypted) {
                        if (err) { return void console.error(err); }
                        var blob = new Blob([decrypted.content], {type: 'plain/text'});
                        startOO(blob, getFileType());
                    });
                }
            };
            xhr.send(null);
        };
        var loadDocument = function (newPad) {
            var type = common.getMetadataMgr().getPrivateData().ooType;
            var file = getFileType();
            console.log(newPad);
            if (!newPad) {
                return void loadLastDocument();
            }
            var newText;
            switch (type) {
                case 'oocell' :
                    newText = EmptyCell();
                    break;
                case 'oodoc':
                    newText = EmptyDoc();
                    break;
                case 'ooslide':
                    newText = EmptySlide();
                    break;
                default:
                    newText = '';
            }
            var blob = new Blob([newText], {type: 'text/plain'});
            startOO(blob, file);
        };

        var initializing = true;
        var $bar = $('#cp-toolbar');
        var Title;
        var cpNfInner;
        var metadataMgr = common.getMetadataMgr();

        config = {
            patchTransformer: ChainPad.NaiveJSONTransformer,
            // cryptpad debug logging (default is 1)
            // logLevel: 0,
            validateContent: function (content) {
                try {
                    JSON.parse(content);
                    return true;
                } catch (e) {
                    console.log("Failed to parse, rejecting patch");
                    return false;
                }
            }
        };

        var setEditable = function (state) {
            console.log(state);
        };

        var stringifyInner = function () {
            var obj = {
                content: {
                    hashes: hashes || [],
                    locked: locked
                },
                metadata: metadataMgr.getMetadataLazy()
            };
            // stringify the json and send it into chainpad
            return stringify(obj);
        };

        APP.onLocal = config.onLocal = function () {
            if (initializing) { return; }
            if (readOnly) { return; }

            console.log('onLocal, data avalable');
            // Update metadata
            var content = stringifyInner();
            APP.realtime.contentUpdate(content);
        };

        config.onInit = function (info) {
            readOnly = metadataMgr.getPrivateData().readOnly;

            Title = common.createTitle({});

            var configTb = {
                displayed: [
                    'userlist',
                    'title',
                    'useradmin',
                    'spinner',
                    'newpad',
                    'share',
                    'limit',
                    'unpinnedWarning'
                ],
                title: Title.getTitleConfig(),
                metadataMgr: metadataMgr,
                readOnly: readOnly,
                realtime: info.realtime,
                sfCommon: common,
                $container: $bar,
                $contentContainer: $('#cp-app-oo-container')
            };
            toolbar = APP.toolbar = Toolbar.create(configTb);
            Title.setToolbar(toolbar);

            var $rightside = toolbar.$rightside;

            var $save = common.createButton('save', true, {}, saveToServer);
            $save.appendTo($rightside);

            if (common.isLoggedIn()) {
                common.createButton('hashtag', true).appendTo($rightside);
            }

            var $forget = common.createButton('forget', true, {}, function (err) {
                if (err) { return; }
                setEditable(false);
            });
            $rightside.append($forget);
        };

        config.onReady = function (info) {
            if (APP.realtime !== info.realtime) {
                APP.realtime = info.realtime;
            }

            var userDoc = APP.realtime.getUserDoc();
            console.log(userDoc);
            var isNew = false;
            var newDoc = true;
            if (userDoc === "" || userDoc === "{}") { isNew = true; }

            if (userDoc !== "") {
                var hjson = JSON.parse(userDoc);

                if (hjson && hjson.metadata) {
                    metadataMgr.updateMetadata(hjson.metadata);
                }
                if (typeof (hjson) !== 'object' || Array.isArray(hjson) ||
                    (hjson.metadata && typeof(hjson.metadata.type) !== 'undefined' &&
                     hjson.metadata.type !== 'oo')) {
                    var errorText = Messages.typeError;
                    UI.errorLoadingScreen(errorText);
                    throw new Error(errorText);
                }
                hashes = hjson.content && hjson.content.hashes;
                locked = hjson.content && hjson.content.locked;
                newDoc = !hashes || hashes.length === 0;
            } else {
                Title.updateTitle(Title.defaultTitle);
            }

            if (!readOnly) {
                // Check if the editor has left
                var me = common.getMetadataMgr().getNetfluxId();
                var members = common.getMetadataMgr().getChannelMembers();
                if (locked) {
                    if (members.indexOf(locked) === -1) {
                        locked = me;
                        APP.onLocal();
                    }
                } else {
                    locked = me;
                    APP.onLocal();
                }

                if (!common.isLoggedIn()) {
                    UI.alert(Messages.oo_locked + Messages.oo_locked_unregistered);
                } else if (locked !== me) {
                    UI.alert(Messages.oo_locked + Messages.oo_locked_edited);
                }
            }


            loadDocument(newDoc);

            initializing = false;
            setEditable(!readOnly);
            UI.removeLoadingScreen();
        };

        var reloadDisplayed = false;
        config.onRemote = function () {
            if (initializing) { return; }
            var userDoc = APP.realtime.getUserDoc();
            var json = JSON.parse(userDoc);
            if (json.metadata) {
                metadataMgr.updateMetadata(json.metadata);
            }
            var newHashes = (json.content && json.content.hashes) || [];
            if (newHashes.length !== hashes.length ||
                stringify(newHashes) !== stringify(hashes)) {
                hashes = newHashes;
                if (reloadDisplayed) { return; }
                reloadDisplayed = true;
                UI.confirm(Messages.oo_newVersion, function (yes) {
                    reloadDisplayed = false;
                    if (!yes) { return; }
                    common.gotoURL();
                });
            }
        };

        config.onAbort = function () {
            // inform of network disconnect
            setEditable(false);
            toolbar.failed();
            UI.alert(Messages.common_connectionLost, undefined, true);
        };

        config.onConnectionChange = function (info) {
            setEditable(info.state);
            if (info.state) {
                initializing = true;
                UI.findOKButton().click();
            } else {
                UI.alert(Messages.common_connectionLost, undefined, true);
            }
        };

        cpNfInner = common.startRealtime(config);

        cpNfInner.onInfiniteSpinner(function () {
            setEditable(false);
            UI.confirm(Messages.realtime_unrecoverableError, function (yes) {
                if (!yes) { return; }
                common.gotoURL();
            });
        });

        common.onLogout(function () { setEditable(false); });
    };

    var main = function () {
        var common;

        nThen(function (waitFor) {
            $(waitFor(function () {
                UI.addLoadingScreen();
            }));
            SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
        }).nThen(function (/*waitFor*/) {
            andThen(common);
        });
    };
    main();
});
