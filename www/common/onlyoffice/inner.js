define([
    'jquery',
    '/common/toolbar3.js',
    'json.sortify',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-interface.js',
    '/api/config',
    '/customize/messages.js',
    '/customize/application_config.js',
    '/bower_components/chainpad/chainpad.dist.js',

    '/bower_components/file-saver/FileSaver.min.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'less!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less2/main.less',
], function (
    $,
    Toolbar,
    JSONSortify,
    nThen,
    SFCommon,
    UI,
    ApiConfig,
    Messages,
    AppConfig,
    ChainPad)
{
    var saveAs = window.saveAs;

    /*
    var ooReady = window.frames[0] && window.frames[0].frames[0] && window.frames[0].frames[0].editor;
    window.onOOReady = function () {
        console.log('ready!');
        ooReady = true;
    };
    */

    var APP = window.APP = {
        $: $
    };

    var stringify = function (obj) {
        return JSONSortify(obj);
    };

    var toolbar;

    var andThen = function (common) {
        var config = {};

        var emitResize = APP.emitResize = function () {
            var cw = $('#ooframe')[0].contentWindow;

            var evt = cw.document.createEvent('UIEvents');
            evt.initUIEvent('resize', true, false, cw, 0);
            cw.dispatchEvent(evt);
        };

        var saveToServer = APP.saveToServer = function () {
            config.onLocal();
        }

        var callRemote = APP.callRemote = function() {
            config.onRemote();
        }

        var saveDocument = APP.saveDocument = function () {
            var defaultName = "text.oot";
            UI.prompt(Messages.exportPrompt, defaultName, function (filename) {
                if (!(typeof(filename) === 'string' && filename)) { return; }
                    console.log("In saveDocument");
                    var content = window.frames[0].frames[0].editor.asc_nativeGetFile();
                    var blob = new Blob([content], {type: "text/plain;charset=utf-8"});
                    saveAs(blob, filename);
            });
        };

        var loadDocument = APP.loadDocument = function (content, file) {
             console.log("Read " + content); 
             return;
             /*
             // TODO: load a document from server here
             window.frames[0].frames[0].editor.asc_CloseFile();
             var openResult = {bSerFormat: true, data: content, url: "http://localhost:3000/onlyoffice/", changes: null};
             window.frames[0].frames[0].editor.openDocument(openResult);
             */
        };

        var readOnly = false;
        var initializing = true;
        var $bar = $('#cp-toolbar');
        var Title;
        var cpNfInner;
        var metadataMgr = common.getMetadataMgr();

        config = {
            readOnly: readOnly,
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

        var stringifyInner = function (textValue) {
            var obj = {
                content: textValue,
                metadata: metadataMgr.getMetadataLazy()
            };
            // stringify the json and send it into chainpad
            return stringify(obj);
        };

        APP.onLocal = config.onLocal = function () {
            if (initializing) { return; }
            if (readOnly) { return; }

            if (!window.frames[0].frames[0] || !window.frames[0].frames[0].editor) {
                console.log("Cannot access editor");
                return;
            }
            var data = window.frames[0].frames[0].editor.asc_nativeGetFile();
            console.log('onLocal, data avalable');
            data = '';
            var content = stringifyInner(data);
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


            /* add an export button */
            var $export = common.createButton('export', true, {}, saveDocument);
            $rightside.append($export);
            var $import = common.createButton('import', true, {}, loadDocument);
            $rightside.append($import);
            var $save = common.createButton('save', true, {}, saveToServer);
            $rightside.append($save);
            var $remote = common.createButton('remote', true, {}, callRemote);
            $remote.attr('title', 'call onRemote');
            $rightside.append($remote);

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

            if (!window.frames[0].frames[0] || !window.frames[0].frames[0].editor) {
                console.log("Cannot access editor");
                return;
            }

            var userDoc = APP.realtime.getUserDoc();
            var isNew = false;
            var newDoc = '';
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
                newDoc = hjson.content;
            } else {
                Title.updateTitle(Title.defaultTitle);
            }

            loadDocument(newDoc);
            initializing = false;
            setEditable(!readOnly);
            UI.removeLoadingScreen();
        };

        config.onRemote = function () {
            if (initializing) { return; }
            if (!window.frames[0].frames[0] || !window.frames[0].frames[0].editor) {
                console.log("Cannot access editor");
                return;
            }

            // force readonly to prevent interlacing
            readOnly = true;

            var previousData = window.frames[0].frames[0].editor.asc_nativeGetFile();
            var userDoc = APP.realtime.getUserDoc();

            var json = JSON.parse(userDoc);
            if (json.metadata) {
                metadataMgr.updateMetadata(json.metadata);
            }
            var remoteDoc = json.content;
            if (remoteDoc!=previousData) {
                console.log("Remote content is different")
                console.log("Remote content hjson: " + remoteDoc);
                loadDocument(remoteDoc);
                common.notify();
            } else {
                console.log("Data is unchanged");
            }

            readOnly = false;
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
            /*
            if (!ooReady) {
                window.onOOReady = waitFor();
            }
            */
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
