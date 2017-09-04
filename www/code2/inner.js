define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/textpatcher/TextPatcher.js',
    '/common/toolbar3.js',
    'json.sortify',
    '/bower_components/chainpad-json-validator/json-ot.js',
    '/common/cryptpad-common.js',
    '/common/cryptget.js',
    '/common/diffMarked.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/api/config',
    '/common/common-realtime.js',

    'cm/lib/codemirror',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less2/main.less',

    'css!cm/lib/codemirror.css',
    'css!cm/addon/dialog/dialog.css',
    'css!cm/addon/fold/foldgutter.css',

    'cm/mode/markdown/markdown',
    'cm/addon/mode/loadmode',
    'cm/mode/meta',
    'cm/addon/mode/overlay',
    'cm/addon/mode/multiplex',
    'cm/addon/mode/simple',
    'cm/addon/edit/closebrackets',
    'cm/addon/edit/matchbrackets',
    'cm/addon/edit/trailingspace',
    'cm/addon/selection/active-line',
    'cm/addon/search/search',
    'cm/addon/search/match-highlighter',
    'cm/addon/search/searchcursor',
    'cm/addon/dialog/dialog',
    'cm/addon/fold/foldcode',
    'cm/addon/fold/foldgutter',
    'cm/addon/fold/brace-fold',
    'cm/addon/fold/xml-fold',
    'cm/addon/fold/markdown-fold',
    'cm/addon/fold/comment-fold',
    'cm/addon/display/placeholder',

], function (
    $,
    Crypto,
    TextPatcher,
    Toolbar,
    JSONSortify,
    JsonOT,
    Cryptpad,
    Cryptget,
    DiffMd,
    nThen,
    SFCommon,
    ApiConfig,
    CommonRealtime,
    CMeditor)
{
    window.CodeMirror = CMeditor;
    var Messages = Cryptpad.Messages;

    var APP = window.APP = {
        Cryptpad: Cryptpad,
    };

    var stringify = function (obj) {
        return JSONSortify(obj);
    };

    var toolbar;

    var onConnectError = function () {
        Cryptpad.errorLoadingScreen(Messages.websocketError);
    };

    var andThen = function (editor, CodeMirror, common) {
        var readOnly = false;
        var cpNfInner;
        var metadataMgr;
        var $bar = $('#cme_toolbox');

        var isHistoryMode = false;

        var $contentContainer = $('#cp-app-code-editor');
        var $previewContainer = $('#cp-app-code-preview');
        var $preview = $('#cp-app-code-preview-content');
        $preview.click(function (e) {
            if (!e.target) { return; }
            var $t = $(e.target);
            if ($t.is('a') || $t.parents('a').length) {
                e.preventDefault();
                var $a = $t.is('a') ? $t : $t.parents('a').first();
                var href = $a.attr('href');
                window.open(href);
            }
        });

        var setIndentation = APP.setIndentation = function (units, useTabs) {
            if (typeof(units) !== 'number') { return; }
            editor.setOption('indentUnit', units);
            editor.setOption('tabSize', units);
            editor.setOption('indentWithTabs', useTabs);
        };

        var indentKey = 'indentUnit';
        var useTabsKey = 'indentWithTabs';
        var updateIndentSettings = function () {
            if (!metadataMgr) { return; }
            var data = metadataMgr.getPrivateData().settings;
            var indentUnit = data[indentKey];
            var useTabs = data[useTabsKey];
            setIndentation(
                typeof(indentUnit) === 'number'? indentUnit: 2,
                typeof(useTabs) === 'boolean'? useTabs: false);
        };

        var setEditable = APP.setEditable = function (bool) {
            if (readOnly && bool) { return; }
            editor.setOption('readOnly', !bool);
        };

        var Title;

        var config = {
            readOnly: readOnly,
            transformFunction: JsonOT.validate,
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

        var canonicalize = function (t) { return t.replace(/\r\n/g, '\n'); };

        var setHistory = function (bool, update) {
            isHistoryMode = bool;
            setEditable(!bool);
            if (!bool && update) {
                config.onRemote();
            }
        };

        CommonRealtime.onInfiniteSpinner(function () { setEditable(false); });

        setEditable(false);
        var initializing = true;

        var stringifyInner = function (textValue) {
            var obj = {
                content: textValue,
                metadata: metadataMgr.getMetadataLazy()
            };
            /*    metadata: {
                    users: UserList.userData,
                    defaultTitle: Title.defaultTitle
                }
            };
            if (!initializing) {
                obj.metadata.title = Title.title;
            }*/
            // set mode too...
            obj.highlightMode = CodeMirror.highlightMode;

            // stringify the json and send it into chainpad
            return stringify(obj);
        };

        var forceDrawPreview = function () {
            try {
                DiffMd.apply(DiffMd.render(editor.getValue()), $preview);
            } catch (e) { console.error(e); }
        };

        var drawPreview = Cryptpad.throttle(function () {
            if (CodeMirror.highlightMode !== 'markdown') { return; }
            if (!$previewContainer.is(':visible')) { return; }
            forceDrawPreview();
        }, 150);

        var onLocal = config.onLocal = function () {
            if (initializing) { return; }
            if (isHistoryMode) { return; }
            if (readOnly) { return; }

            editor.save();

            drawPreview();

            var textValue = canonicalize(CodeMirror.$textarea.val());
            var shjson = stringifyInner(textValue);

            APP.patchText(shjson);

            if (APP.realtime.getUserDoc() !== shjson) {
                console.error("realtime.getUserDoc() !== shjson");
            }
        };

        var mediaTagModes = [
            'markdown',
            'html',
            'htmlembedded',
            'htmlmixed',
            'index.html',
            'php',
            'velocity',
            'xml',
        ];

        var onModeChanged = function (mode) {
            var $codeMirror = $('.CodeMirror');
            window.clearTimeout(APP.previewTo);
            $codeMirror.addClass('transition');
            APP.previewTo = window.setTimeout(function () {
                $codeMirror.removeClass('transition');
            }, 500);
            if (mediaTagModes.indexOf(mode) !== -1) {
                APP.$mediaTagButton.show();
            } else { APP.$mediaTagButton.hide(); }

            if (mode === "markdown") {
                APP.$previewButton.show();
                common.getPadAttribute('previewMode', function (e, data) {
                    if (e) { return void console.error(e); }
                    if (data !== false) {
                        $previewContainer.show();
                        APP.$previewButton.addClass('active');
                        $codeMirror.removeClass('fullPage');
                    }
                });
                return;
            }
            APP.$previewButton.hide();
            $previewContainer.hide();
            APP.$previewButton.removeClass('active');
            $codeMirror.addClass('fullPage');
        };

        config.onInit = function (info) {
            metadataMgr.onChangeLazy(updateIndentSettings);
            updateIndentSettings();

            readOnly = metadataMgr.getPrivateData().readOnly;

            var titleCfg = { getHeadingText: CodeMirror.getHeadingText };
            Title = common.createTitle(titleCfg, config.onLocal, common, metadataMgr);

            var configTb = {
                displayed: ['title', 'useradmin', 'spinner', 'share', 'userlist', 'newpad', 'limit'],
                title: Title.getTitleConfig(),
                metadataMgr: metadataMgr,
                readOnly: readOnly,
                ifrw: window,
                realtime: info.realtime,
                common: Cryptpad,
                sfCommon: common,
                $container: $bar,
                $contentContainer: $contentContainer
            };
            toolbar = APP.toolbar = Toolbar.create(configTb);
            Title.setToolbar(toolbar);
            CodeMirror.init(config.onLocal, Title, toolbar);

            var $rightside = toolbar.$rightside;
            var $drawer = toolbar.$drawer;

            /* add a history button */
            var histConfig = {
                onLocal: config.onLocal,
                onRemote: config.onRemote,
                setHistory: setHistory,
                applyVal: function (val) {
                    var remoteDoc = JSON.parse(val || '{}').content;
                    editor.setValue(remoteDoc || '');
                    editor.save();
                },
                $toolbar: $bar
            };
            var $hist = common.createButton('history', true, {histConfig: histConfig});
            $drawer.append($hist);

            /* save as template */
            if (!metadataMgr.getPrivateData().isTemplate) {
                var templateObj = {
                    rt: info.realtime,
                    getTitle: function () { return metadataMgr.getMetadata().title; }
                };
                var $templateButton = common.createButton('template', true, templateObj);
                $rightside.append($templateButton);
            }

            /* add an export button */
            var $export = common.createButton('export', true, {}, CodeMirror.exportText);
            $drawer.append($export);

            if (!readOnly) {
                /* add an import button */
                var $import = common.createButton('import', true, {}, CodeMirror.importText);
                $drawer.append($import);
            }

            /* add a forget button */
            var forgetCb = function (err) {
                if (err) { return; }
                setEditable(false);
            };
            var $forgetPad = common.createButton('forget', true, {}, forgetCb);
            $rightside.append($forgetPad);

            var $previewButton = APP.$previewButton = common.createButton(null, true);
            $previewButton.removeClass('fa-question').addClass('fa-eye');
            $previewButton.attr('title', Messages.previewButtonTitle);
            $previewButton.click(function () {
                var $codeMirror = $('.CodeMirror');
                window.clearTimeout(APP.previewTo);
                $codeMirror.addClass('transition');
                APP.previewTo = window.setTimeout(function () {
                    $codeMirror.removeClass('transition');
                }, 500);
                if (CodeMirror.highlightMode !== 'markdown') {
                    $previewContainer.show();
                }
                $previewContainer.toggle();
                if ($previewContainer.is(':visible')) {
                    forceDrawPreview();
                    $codeMirror.removeClass('fullPage');
                    $previewButton.addClass('active');
                    common.setPadAttribute('previewMode', true, function (e) {
                        if (e) { return console.log(e); }
                    });
                } else {
                    $codeMirror.addClass('fullPage');
                    $previewButton.removeClass('active');
                    common.setPadAttribute('previewMode', false, function (e) {
                        if (e) { return console.log(e); }
                    });
                }
            });
            $rightside.append($previewButton);

            if (!readOnly) {
                CodeMirror.configureTheme(function () {
                    CodeMirror.configureLanguage(null, onModeChanged);
                });
            }
            else {
                CodeMirror.configureTheme();
            }

            var fileDialogCfg = {
                onSelect: function (data) {
                    var mt = '<media-tag src="' + data.src + '" data-crypto-key="cryptpad:' + data.key + '"></media-tag>';
                    editor.replaceSelection(mt);
                }
            };
            common.initFilePicker(common, fileDialogCfg);
            APP.$mediaTagButton = $('<button>', {
                title: Messages.filePickerButton,
                'class': 'cp-toolbar-rightside-button fa fa-picture-o',
                style: 'font-size: 17px'
            }).click(function () {
                common.openFilePicker(common);
            }).appendTo($rightside);

        };

        config.onReady = function (info) {
            console.log('onready');
            if (APP.realtime !== info.realtime) {
                var realtime = APP.realtime = info.realtime;
                APP.patchText = TextPatcher.create({
                    realtime: realtime,
                    //logging: true
                });
            }

            var userDoc = APP.realtime.getUserDoc();

            var isNew = false;
            if (userDoc === "" || userDoc === "{}") { isNew = true; }

            var newDoc = "";
            if (userDoc !== "") {
                var hjson = JSON.parse(userDoc);

                if (hjson && hjson.metadata) {
                    metadataMgr.updateMetadata(hjson.metadata);
                }
                if (typeof (hjson) !== 'object' || Array.isArray(hjson) ||
                    (typeof(hjson.type) !== 'undefined' && hjson.type !== 'code')) {
                    var errorText = Messages.typeError;
                    Cryptpad.errorLoadingScreen(errorText);
                    throw new Error(errorText);
                }

                newDoc = hjson.content;

                if (hjson.highlightMode) {
                    CodeMirror.setMode(hjson.highlightMode, onModeChanged);
                }
            }

            if (!CodeMirror.highlightMode) {
                CodeMirror.setMode('markdown', onModeChanged);
                //console.log("%s => %s", CodeMirror.highlightMode, CodeMirror.$language.val());
            }

            // Update the user list (metadata) from the hyperjson
            //Metadata.update(userDoc);

            if (newDoc) {
                editor.setValue(newDoc);
            }

            if (Cryptpad.initialName && Title.isDefaultTitle()) {
                Title.updateTitle(Cryptpad.initialName);
            }


            common.getPadAttribute('previewMode', function (e, data) {
                if (e) { return void console.error(e); }
                if (data === false && APP.$previewButton) {
                    APP.$previewButton.click();
                }
            });


/*
            // add the splitter
            if (!$iframe.has('.cp-splitter').length) {
                var $preview = $iframe.find('#previewContainer');
                var splitter = $('<div>', {
                    'class': 'cp-splitter'
                }).appendTo($preview);

                $preview.on('scroll', function() {
                    splitter.css('top', $preview.scrollTop() + 'px');
                });

                var $target = $iframe.find('.CodeMirror');

                splitter.on('mousedown', function (e) {
                    e.preventDefault();
                    var x = e.pageX;
                    var w = $target.width();

                    $iframe.on('mouseup mousemove', function handler(evt) {
                        if (evt.type === 'mouseup') {
                            $iframe.off('mouseup mousemove', handler);
                            return;
                        }
                        $target.css('width', (w - x + evt.pageX) + 'px');
                    });
                });
            }
*/

            Cryptpad.removeLoadingScreen();
            setEditable(!readOnly);
            initializing = false;

            onLocal(); // push local state to avoid parse errors later.

            if (readOnly) {
                config.onRemote();
                return;
            }
            //UserList.getLastName(toolbar.$userNameButton, isNew);

            var fmConfig = {
                dropArea: $('.CodeMirror'),
                body: $('body'),
                onUploaded: function (ev, data) {
                    //var cursor = editor.getCursor();
                    //var cleanName = data.name.replace(/[\[\]]/g, '');
                    //var text = '!['+cleanName+']('+data.url+')';
                    var parsed = Cryptpad.parsePadUrl(data.url);
                    var hexFileName = Cryptpad.base64ToHex(parsed.hashData.channel);
                    var src = '/blob/' + hexFileName.slice(0,2) + '/' + hexFileName;
                    var mt = '<media-tag src="' + src + '" data-crypto-key="cryptpad:' + parsed.hashData.key + '"></media-tag>';
                    editor.replaceSelection(mt);
                }
            };
            APP.FM = common.createFileManager(fmConfig);
        };

        config.onRemote = function () {
            if (initializing) { return; }
            if (isHistoryMode) { return; }

            var oldDoc = canonicalize(CodeMirror.$textarea.val());
            var shjson = APP.realtime.getUserDoc();

            // Update the user list (metadata) from the hyperjson
            //Metadata.update(shjson);

            var hjson = JSON.parse(shjson);
            var remoteDoc = hjson.content;

            if (hjson.metadata) {
                metadataMgr.updateMetadata(hjson.metadata);
            }

            var highlightMode = hjson.highlightMode;
            if (highlightMode && highlightMode !== APP.highlightMode) {
                CodeMirror.setMode(highlightMode, onModeChanged);
            }

            CodeMirror.setValueAndCursor(oldDoc, remoteDoc, TextPatcher);
            drawPreview();

            if (!readOnly) {
                var textValue = canonicalize(CodeMirror.$textarea.val());
                var shjson2 = stringifyInner(textValue);
                if (shjson2 !== shjson) {
                    console.error("shjson2 !== shjson");
                    TextPatcher.log(shjson, TextPatcher.diff(shjson, shjson2));
                    APP.patchText(shjson2);
                }
            }
            if (oldDoc !== remoteDoc) { Cryptpad.notify(); }
        };

        config.onAbort = function () {
            // inform of network disconnect
            setEditable(false);
            toolbar.failed();
            Cryptpad.alert(Messages.common_connectionLost, undefined, true);
        };

        config.onConnectionChange = function (info) {
            setEditable(info.state);
            //toolbar.failed();
            if (info.state) {
                initializing = true;
                //toolbar.reconnecting(info.myId);
                Cryptpad.findOKButton().click();
            } else {
                Cryptpad.alert(Messages.common_connectionLost, undefined, true);
            }
        };

        config.onError = onConnectError;

        cpNfInner = common.startRealtime(config);
        metadataMgr = cpNfInner.metadataMgr;

        editor.on('change', onLocal);

        Cryptpad.onLogout(function () { setEditable(false); });
    };
/*
    var interval = 100;
    var second = function (CM) {
        Cryptpad.ready(function () {
            andThen(CM);
            Cryptpad.reportAppUsage();
        });
        Cryptpad.onError(function (info) {
            if (info && info.type === "store") {
                onConnectError();
            }
        });
    };

    var first = function () {
        if (ifrw.CodeMirror) {
            second(ifrw.CodeMirror);
        } else {
            console.log("CodeMirror was not defined. Trying again in %sms", interval);
            setTimeout(first, interval);
        }
    };

    first();*/
    var CMEDITOR_CHECK_INTERVAL = 100;
    var cmEditorAvailable = function (cb) {
        var intr;
        var check = function () {
            if (window.CodeMirror) {
                clearTimeout(intr);
                cb(window.CodeMirror);
            }
        };
        intr = setInterval(function () {
            console.log("CodeMirror was not defined. Trying again in %sms", CMEDITOR_CHECK_INTERVAL);
            check();
        }, CMEDITOR_CHECK_INTERVAL);
        check();
    };
    var main = function () {
        var CM;
        var CodeMirror;
        var editor;
        var common;

        nThen(function (waitFor) {
            cmEditorAvailable(waitFor(function (cm) {
                CM = cm;
            }));
            $(waitFor(function () {
                Cryptpad.addLoadingScreen();
            }));
            SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
        }).nThen(function (/*waitFor*/) {
            CodeMirror = Cryptpad.createCodemirror(window, Cryptpad, null, CM);
            $('.CodeMirror').addClass('fullPage');
            editor = CodeMirror.editor;
            Cryptpad.onError(function (info) {
                if (info && info.type === "store") {
                    onConnectError();
                }
            });
            andThen(editor, CodeMirror, common);
        });
    };
    main();
});
