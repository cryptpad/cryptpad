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
    '/slide/slide.js',

    'cm/lib/codemirror',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'less!/bower_components/components-font-awesome/css/font-awesome.min.css',
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
    Slide,
    CMeditor)
{
    window.CodeMirror = CMeditor;
    var Messages = Cryptpad.Messages;

    var APP = window.APP = {
        Cryptpad: Cryptpad,
    };
    var SLIDE_BACKCOLOR_ID = "cp-app-slide-toolbar-backcolor";
    var SLIDE_COLOR_ID = "cp-app-slide-toolbar-color";

    var stringify = function (obj) {
        return JSONSortify(obj);
    };

    var toolbar;
    var isPresentMode;

    var onConnectError = function () {
        Cryptpad.errorLoadingScreen(Messages.websocketError);
    };

    var andThen = function (editor, CodeMirror, common) {
        var readOnly = false;
        var cpNfInner;
        var metadataMgr;
        var $bar = $('#cme_toolbox');

        var isHistoryMode = false;

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

        var $contentContainer = $('#cp-app-slide-editor');
        var $modal = $('#cp-app-slide-modal');
        var $content = $('#cp-app-slide-modal-content');
        var $print = $('#cp-app-slide-print');
        var slideOptions = {};
        var initialState = Messages.slideInitialState;
        var textColor;
        var backColor;

        $content.click(function (e) {
            if (!e.target) { return; }
            var $t = $(e.target);
            if ($t.is('a') || $t.parents('a').length) {
                e.preventDefault();
                var $a = $t.is('a') ? $t : $t.parents('a').first();
                var href = $a.attr('href');
                window.open(href);
            }
        });

        Slide.setModal(common, $modal, $content, slideOptions, initialState);

        var enterPresentationMode = function (shouldLog) {
            Slide.show(true, editor.getValue());
            if (shouldLog) {
                Cryptpad.log(Messages.presentSuccess);
            }
        };

        if (isPresentMode) {
            enterPresentationMode(true);
        }

        CommonRealtime.onInfiniteSpinner(function () { setEditable(false); });

        setEditable(false);
        var initializing = true;

        var stringifyInner = function (textValue) {
            var obj = {
                content: textValue,
                metadata: metadataMgr.getMetadataLazy()
            };

            // stringify the json and send it into chainpad
            return stringify(obj);
        };

        var onLocal = config.onLocal = function () {
            if (initializing) { return; }
            if (isHistoryMode) { return; }
            if (readOnly) { return; }

            editor.save();

            var textValue = canonicalize(CodeMirror.$textarea.val());
            var shjson = stringifyInner(textValue);

            APP.patchText(shjson);
            Slide.update(textValue);

            if (APP.realtime.getUserDoc() !== shjson) {
                console.error("realtime.getUserDoc() !== shjson");
            }
        };

        var updateSlideOptions = function (newOpt) {
            if (stringify(newOpt) !== stringify(slideOptions)) {
                $.extend(slideOptions, newOpt);
                // TODO: manage realtime + cursor in the "options" modal ??
                Slide.updateOptions();
            }
        };
        var updateLocalOptions = function (newOpt) {
            updateSlideOptions(newOpt);
            var metadata = JSON.parse(JSON.stringify(metadataMgr.getMetadata()));
            metadata.slideOptions = slideOptions;
            metadataMgr.updateMetadata(metadata);
            onLocal();
        };
        var updateColors = function (text, back) {
            if (text) {
                textColor = text;
                $modal.css('color', text);
                $modal.css('border-color', text);
                $('#' + SLIDE_COLOR_ID).css('color', text);
            }
            if (back) {
                backColor = back;
                $modal.css('background-color', back);
                $('#' + SLIDE_BACKCOLOR_ID).css('color', back);
            }
        };
        var updateLocalColors = function (text, back) {
            updateColors(text, back);
            var metadata = JSON.parse(JSON.stringify(metadataMgr.getMetadata()));
            if (backColor) { metadata.backColor = backColor; }
            if (textColor) { metadata.color = textColor; }
            metadataMgr.updateMetadata(metadata);
            onLocal();
            console.log(metadataMgr.getMetadata());
        };

        var createPrintDialog = function () {
            var slideOptionsTmp = {
                title: false,
                slide: false,
                date: false,
                transition: true,
                style: ''
            };

            $.extend(slideOptionsTmp, slideOptions);
            var $container = $('<div class="alertify">');
            var $container2 = $('<div class="dialog">').appendTo($container);
            var $div = $('<div id="printOptions">').appendTo($container2);
            var $p = $('<p>', {'class': 'msg'}).appendTo($div);
            $('<b>').text(Messages.printOptions).appendTo($p);
            $p.append($('<br>'));
            // Slide number
            $('<input>', {
                type: 'checkbox',
                id: 'cp-app-slide-options-number',
                checked: slideOptionsTmp.slide
            }).on('change', function () {
                var c = this.checked;
                slideOptionsTmp.slide = c;
            }).appendTo($p).css('width', 'auto');
            $('<label>', {'for': 'cp-app-slide-options-number'}).text(Messages.printSlideNumber)
                .appendTo($p);
            $p.append($('<br>'));
            // Date
            $('<input>', {
                type: 'checkbox',
                id: 'cp-app-slide-options-date',
                checked: slideOptionsTmp.date
            }).on('change', function () {
                var c = this.checked;
                slideOptionsTmp.date = c;
            }).appendTo($p).css('width', 'auto');
            $('<label>', {'for': 'cp-app-slide-options-date'}).text(Messages.printDate)
                .appendTo($p);
            $p.append($('<br>'));
            // Title
            $('<input>', {
                type: 'checkbox',
                id: 'cp-app-slide-options-title',
                checked: slideOptionsTmp.title
            }).on('change', function () {
                var c = this.checked;
                slideOptionsTmp.title = c;
            }).appendTo($p).css('width', 'auto');
            $('<label>', {'for': 'cp-app-slide-options-title'}).text(Messages.printTitle)
                .appendTo($p);
            $p.append($('<br>'));
            // Transition
            $('<input>', {
                type: 'checkbox',
                id: 'cp-app-slide-options-transition',
                checked: slideOptionsTmp.transition
            }).on('change', function () {
                var c = this.checked;
                slideOptionsTmp.transition = c;
            }).appendTo($p).css('width', 'auto');
            $('<label>', {'for': 'cp-app-slide-options-transition'}).text(Messages.printTransition)
                .appendTo($p);
            $p.append($('<br>'));
            // CSS
            $('<label>', {'for': 'cp-app-slide-options-css'}).text(Messages.printCSS).appendTo($p);
            $p.append($('<br>'));
            var $textarea = $('<textarea>', {'id':'cp-app-slide-options-css'})
                .css({'width':'100%', 'height':'100px'}).appendTo($p)
                .on('keydown keyup', function (e) {
                    e.stopPropagation();
                });
            $textarea.val(slideOptionsTmp.style);
            window.setTimeout(function () { $textarea.focus(); }, 0);

            var h;

            var todo = function () {
                slideOptionsTmp.style = $textarea.val();
                updateLocalOptions(slideOptionsTmp);
                $container.remove();
                Cryptpad.stopListening(h);
            };
            var todoCancel = function () {
                $container.remove();
                Cryptpad.stopListening(h);
            };

            h = Cryptpad.listenForKeys(todo, todoCancel);

            var $nav = $('<nav>').appendTo($div);
            $('<button>', {'class': 'cancel'}).text(Messages.cancelButton).appendTo($nav).click(todoCancel);
            $('<button>', {'class': 'ok'}).text(Messages.settings_save).appendTo($nav).click(todo);

            return $container;
        };

        config.onInit = function (info) {
            readOnly = metadataMgr.getPrivateData().readOnly;

            var titleCfg = { getHeadingText: CodeMirror.getHeadingText };
            Title = common.createTitle(titleCfg, config.onLocal);
            Slide.setTitle(Title);

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
                var $c = $contentContainer;
                if ($c.hasClass('cp-app-slide-preview')) {
                    common.setPadAttribute('previewMode', false, function (e) {
                        if (e) { return console.log(e); }
                    });
                    $previewButton.removeClass('cp-toolbar-button-active');
                    return void $c.removeClass('cp-app-slide-preview');
                }
                common.setPadAttribute('previewMode', true, function (e) {
                    if (e) { return console.log(e); }
                });
                $c.addClass('cp-app-slide-preview');
                $previewButton.addClass('cp-toolbar-button-active');
                Slide.updateFontSize();
            });
            $rightside.append($previewButton);

            var $printButton = $('<button>', {
                title: Messages.printButtonTitle,
                'class': 'cp-toolbar-rightside-button fa fa-print',
                style: 'font-size: 17px'
            }).click(function () {
                Slide.update(editor.getValue(), true);
                $print.html($content.html());
                // TODO use translation key
                Cryptpad.confirm("Are you sure you want to print?", function (yes) {
                    if (yes) {
                        window.focus();
                        window.print();
                    }
                }, {ok: Messages.printButton});
                common.feedback('PRINT_SLIDES');
            }).append($('<span>', {'class': 'cp-toolbar-drawer-element'}).text(Messages.printText));
            $drawer.append($printButton);

            var $slideOptions = $('<button>', {
                title: Messages.slideOptionsTitle,
                'class': 'cp-toolbar-rightside-button fa fa-cog',
                style: 'font-size: 17px'
            }).click(function () {
                $('body').append(createPrintDialog());
            }).append($('<span>', {'class': 'cp-toolbar-drawer-element'}).text(Messages.slideOptionsText));
            $drawer.append($slideOptions);

            var $present = common.createButton('present', true)
                .click(function () {
                enterPresentationMode(true);
            });
            $rightside.append($present);

            var configureColors = function () {
                var $back = $('<button>', {
                    id: SLIDE_BACKCOLOR_ID,
                    'class': 'fa fa-square cp-toolbar-rightside-button',
                    'style': 'font-family: FontAwesome; color: #000;',
                    title: Messages.backgroundButtonTitle
                });
                var $text = $('<button>', {
                    id: SLIDE_COLOR_ID,
                    'class': 'fa fa-i-cursor cp-toolbar-rightside-button',
                    'style': 'font-family: FontAwesome; font-weight: bold; color: #fff;',
                    title: Messages.colorButtonTitle
                });
                var $testColor = $('<input>', { type: 'color', value: '!' });
                var $check = $("#cp-app-slide-colorpicker");
                if ($testColor.attr('type') !== "color" || $testColor.val() === '!') { return; }
                $back.on('click', function() {
                    var $picker = $('<input>', { type: 'color', value: backColor })
                        .css({ display: 'none', })
                        .on('change', function() {
                            updateLocalColors(undefined, this.value);
                            $check.html('');
                        });
                    $check.append($picker);
                    setTimeout(function() {
                        $picker.click();
                    }, 0);
                });
                $text.on('click', function() {
                    var $picker = $('<input>', { type: 'color', value: textColor })
                        .css({ display: 'none', })
                        .on('change', function() {
                            updateLocalColors(this.value, undefined);
                            $check.html('');
                        });
                    $check.append($picker);
                    setTimeout(function() {
                        $picker.click();
                    }, 0);
                });

                $rightside.append($back).append($text);
            };
            configureColors();

            CodeMirror.configureTheme();

            if (!readOnly) {
                var fileDialogCfg = {
                    onSelect: function (data) {
                        if (data.type === 'file') {
                            var mt = '<media-tag src="' + data.src + '" data-crypto-key="cryptpad:' + data.key + '"></media-tag>';
                            editor.replaceSelection(mt);
                            return;
                        }
                    }
                };
                common.initFilePicker(fileDialogCfg);
                APP.$mediaTagButton = $('<button>', {
                    title: Messages.filePickerButton,
                    'class': 'cp-toolbar-rightside-button fa fa-picture-o',
                    style: 'font-size: 17px'
                }).click(function () {
                    var pickerCfg = {
                        types: ['file'],
                        where: ['root']
                    };
                    common.openFilePicker(pickerCfg);
                }).appendTo($rightside);

                var $tags = common.createButton('hashtag', true);
                $rightside.append($tags);
            }

            metadataMgr.onChange(function () {
                var md = metadataMgr.getMetadata();
                if (md.color || md.backColor) {
                    updateLocalColors(md.color, md.backColor);
                }
                if (md.slideOptions) {
                    updateLocalOptions(md.slideOptions);
                }
            });
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
                    (hjson.metadata && typeof(hjson.metadata.type) !== 'undefined' &&
                     hjson.metadata.type !== 'slide')) {
                    var errorText = Messages.typeError;
                    Cryptpad.errorLoadingScreen(errorText);
                    throw new Error(errorText);
                }

                newDoc = hjson.content;

                if (hjson.highlightMode) {
                    CodeMirror.setMode(hjson.highlightMode);
                }
            } else {
                Title.updateTitle(Cryptpad.initialName || Title.defaultTitle);
            }

            if (!CodeMirror.highlightMode) {
                CodeMirror.setMode('markdown');
            }

            editor.setValue(newDoc || initialState);

            if (Cryptpad.initialName && Title.isDefaultTitle()) {
                Title.updateTitle(Cryptpad.initialName);
            }

            common.getPadAttribute('previewMode', function (e, data) {
                if (e) { return void console.error(e); }
                if (data !== false && APP.$previewButton) {
                    APP.$previewButton.click();
                }
            });

            Slide.onChange(function (o, n, l) {
                var slideNumber = '';
                if (n !== null) {
                    if (Slide.shown) {
                        slideNumber = ' (' + (++n) + '/' + l + ')';
                    }
                }
                common.setTabTitle('{title}' + slideNumber);
            });

            setEditable(!readOnly);
            initializing = false;

            onLocal(); // push local state to avoid parse errors later.
            Slide.update(editor.getValue());
            Cryptpad.removeLoadingScreen();

            if (readOnly) {
                config.onRemote();
                return;
            }

            if (isNew) {
                common.openTemplatePicker();
            }

            var fmConfig = {
                dropArea: $('.CodeMirror'),
                body: $('body'),
                onUploaded: function (ev, data) {
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

            var hjson = JSON.parse(shjson);
            var remoteDoc = hjson.content;

            if (hjson.metadata) {
                metadataMgr.updateMetadata(hjson.metadata);
            }

            var highlightMode = hjson.highlightMode;
            if (highlightMode && highlightMode !== APP.highlightMode) {
                CodeMirror.setMode(highlightMode);
            }

            CodeMirror.setValueAndCursor(oldDoc, remoteDoc, TextPatcher);

            if (!readOnly) {
                var textValue = canonicalize(CodeMirror.$textarea.val());
                var shjson2 = stringifyInner(textValue);
                if (shjson2 !== shjson) {
                    console.error("shjson2 !== shjson");
                    TextPatcher.log(shjson, TextPatcher.diff(shjson, shjson2));
                    APP.patchText(shjson2);
                }
            }
            Slide.update(remoteDoc);
            if (oldDoc !== remoteDoc) { common.notify(); }
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

        cpNfInner.onInfiniteSpinner(function () {
            setEditable(false);
            Cryptpad.confirm(Messages.realtime_unrecoverableError, function (yes) {
                if (!yes) { return; }
                common.gotoURL();
            });
        });

        editor.on('change', onLocal);

        Cryptpad.onLogout(function () { setEditable(false); });
    };

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
            CodeMirror = common.initCodeMirrorApp(null, CM);
            $('.CodeMirror').addClass('fullPage');
            editor = CodeMirror.editor;
            Cryptpad.onError(function (info) {
                if (info && info.type === "store") {
                    onConnectError();
                }
            });
            common.getSframeChannel().onReady(function () {
                common.isPresentUrl(function (err, val) {
                    isPresentMode = val;
                    andThen(editor, CodeMirror, common);
                });
            });
        });
    };
    main();
});
