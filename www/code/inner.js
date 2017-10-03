define([
    'jquery',
    '/bower_components/textpatcher/TextPatcher.js',
    '/common/cryptpad-common.js',
    '/common/diffMarked.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/sframe-app-framework.js',
    '/common/common-util.js',
    '/common/modes.js',
    'cm/lib/codemirror',

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
    TextPatcher,
    Cryptpad,
    DiffMd,
    nThen,
    SFCommon,
    Framework,
    Util,
    Modes,
    CMeditor)
{
    window.CodeMirror = CMeditor;
    var Messages = Cryptpad.Messages;

    var MEDIA_TAG_MODES = Object.freeze([
        'markdown',
        'html',
        'htmlembedded',
        'htmlmixed',
        'index.html',
        'php',
        'velocity',
        'xml',
    ]);

    var mkPreviewPane = function (editor, CodeMirror, framework) {
        var $previewContainer = $('#cp-app-code-preview');
        var $preview = $('#cp-app-code-preview-content');
        var $codeMirror = $('.CodeMirror');
        var forceDrawPreview = function () {
            try {
                DiffMd.apply(DiffMd.render(editor.getValue()), $preview);
            } catch (e) { console.error(e); }
        };
        var drawPreview = Util.throttle(function () {
            if (CodeMirror.highlightMode !== 'markdown') { return; }
            if (!$previewContainer.is(':visible')) { return; }
            forceDrawPreview();
        }, 150);

        var $previewButton = framework._.sfCommon.createButton(null, true);
        $previewButton.removeClass('fa-question').addClass('fa-eye');
        $previewButton.attr('title', Messages.previewButtonTitle);
        var previewTo;
        $previewButton.click(function () {
            clearTimeout(previewTo);
            $codeMirror.addClass('transition');
            previewTo = setTimeout(function () {
                $codeMirror.removeClass('transition');
            }, 500);
            if (CodeMirror.highlightMode !== 'markdown') {
                $previewContainer.show();
            }
            $previewContainer.toggle();
            if ($previewContainer.is(':visible')) {
                forceDrawPreview();
                $codeMirror.removeClass('cp-ap-code-fullpage');
                $previewButton.addClass('cp-toolbar-button-active');
                framework._.sfCommon.setPadAttribute('previewMode', true, function (e) {
                    if (e) { return console.log(e); }
                });
            } else {
                $codeMirror.addClass('cp-app-code-fullpage');
                $previewButton.removeClass('cp-toolbar-button-active');
                framework._.sfCommon.setPadAttribute('previewMode', false, function (e) {
                    if (e) { return console.log(e); }
                });
            }
        });
        framework._.toolbar.$rightside.append($previewButton);

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

        var modeChange = function (mode) {
            if (mode === "markdown") {
                $previewButton.show();
                framework._.sfCommon.getPadAttribute('previewMode', function (e, data) {
                    if (e) { return void console.error(e); }
                    if (data !== false) {
                        $previewContainer.show();
                        $previewButton.addClass('active');
                        $codeMirror.removeClass('cp-app-code-fullpage');
                    }
                });
                return;
            }
            $previewButton.hide();
            $previewContainer.hide();
            $previewButton.removeClass('active');
            $codeMirror.addClass('cp-app-code-fullpage');
        };

        framework.onReady(function () {
            // add the splitter
            var splitter = $('<div>', {
                'class': 'cp-splitter'
            }).appendTo($previewContainer);

            $preview.on('scroll', function() {
                splitter.css('top', $preview.scrollTop() + 'px');
            });

            var $target = $('.CodeMirror');

            splitter.on('mousedown', function (e) {
                e.preventDefault();
                var x = e.pageX;
                var w = $target.width();

                $(window).on('mouseup mousemove', function handler(evt) {
                    if (evt.type === 'mouseup') {
                        $(window).off('mouseup mousemove', handler);
                        return;
                    }
                    $target.css('width', (w - x + evt.pageX) + 'px');
                    editor.refresh();
                });
            });
        });

        framework._.sfCommon.getPadAttribute('previewMode', function (e, data) {
            if (e) { return void console.error(e); }
            if (data === false && $previewButton) {
                $previewButton.click();
            }
        });

        return {
            forceDraw: forceDrawPreview,
            draw: drawPreview,
            modeChange: modeChange
        };
    };

    var mkIndentSettings = function (editor, metadataMgr) {
        var setIndentation = function (units, useTabs) {
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
            data = data.codemirror || {};
            var indentUnit = data[indentKey];
            var useTabs = data[useTabsKey];
            setIndentation(
                typeof(indentUnit) === 'number'? indentUnit: 2,
                typeof(useTabs) === 'boolean'? useTabs: false);
        };
        metadataMgr.onChangeLazy(updateIndentSettings);
        updateIndentSettings();
    };

    var mkFilePicker = function (framework, editor, evModeChange) {
        evModeChange.reg(function (mode) {
            if (MEDIA_TAG_MODES.indexOf(mode) !== -1) {
                // Embedding is endabled
                framework.setMediaTagEmbedder(function (mt) {
                    editor.replaceSelection($(mt)[0].outerHTML);
                });
            } else {
                // Embedding is disabled
                framework.setMediaTagEmbedder();
            }
        });
    };

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////

    var andThen2 = function (editor, CodeMirror, framework) {

        var common = framework._.sfCommon;

        var previewPane = mkPreviewPane(editor, CodeMirror, framework);
        var evModeChange = Util.mkEvent();
        evModeChange.reg(previewPane.modeChange);

        mkIndentSettings(editor, framework._.cpNfInner.metadataMgr);
        CodeMirror.init(framework.localChange, framework._.title, framework._.toolbar);
        mkFilePicker(framework, editor, evModeChange);

        if (!framework.isReadOnly()) {
            CodeMirror.configureTheme(function () {
                CodeMirror.configureLanguage(null, evModeChange.fire);
            });
        } else {
            CodeMirror.configureTheme();
        }

        ////

        framework.onContentUpdate(function (newContent) {
            CodeMirror.contentUpdate(newContent);
            var highlightMode = newContent.highlightMode;
            if (highlightMode && highlightMode !== CodeMirror.highlightMode) {
                CodeMirror.setMode(highlightMode, evModeChange.fire);
            }
            previewPane.draw();
        });

        framework.setContentGetter(function () {
            var content = CodeMirror.getContent();
            content.highlightMode = CodeMirror.highlightMode;
            previewPane.draw();
            return content;
        });

        framework.onEditableChange(function () {
            editor.setOption('readOnly', framework.isLocked() || framework.isReadOnly());
        });

        framework.setTitleRecommender(CodeMirror.getHeadingText);

        framework.onReady(function (newPad) {
            if (newPad && !CodeMirror.highlightMode) {
                CodeMirror.setMode('markdown', evModeChange.fire);
                //console.log("%s => %s", CodeMirror.highlightMode, CodeMirror.$language.val());
            }

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
            common.createFileManager(fmConfig);
        });

        framework.onDefaultContentNeeded(function () {
             editor.setValue(Messages.codeInitialState);
        });

        framework.setFileExporter(CodeMirror.getContentExtension, CodeMirror.fileExporter);
        framework.setFileImporter({}, CodeMirror.fileImporter);

        framework.setNormalizer(function (c) {
            return {
                content: c.content,
                highlightMode: c.highlightMode
            };
        });

        editor.on('change', framework.localChange);

        framework.start();
    };

    var main = function () {
        var CodeMirror;
        var editor;
        var common;
        var framework;

        nThen(function (waitFor) {

            Framework.create({
                toolbarContainer: '#cme_toolbox',
                contentContainer: '#cp-app-code-editor'
            }, waitFor(function (fw) { framework = fw; }));

            nThen(function (waitFor) {
                $(waitFor());
                // TODO(cjd): This is crap but we cannot bring up codemirror until after
                //            the CryptPad Common is up and we can't bring up framework
                //            without codemirror.
                SFCommon.create(waitFor(function (c) { common = c; }));
            }).nThen(function () {
                CodeMirror = common.initCodeMirrorApp(null, CMeditor);
                $('.CodeMirror').addClass('cp-app-code-fullpage');
                editor = CodeMirror.editor;
            }).nThen(waitFor());

        }).nThen(function (/*waitFor*/) {
            console.log('hi');
            andThen2(editor, CodeMirror, framework);
        });
    };
    main();
});
