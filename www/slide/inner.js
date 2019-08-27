define([
    'jquery',
    'json.sortify',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/slide/slide.js',
    '/common/sframe-app-framework.js',
    '/common/sframe-common-codemirror.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/customize/messages.js',
    'cm/lib/codemirror',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/slide/app-slide.less',

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
    JSONSortify,
    nThen,
    SFCommon,
    Slide,
    Framework,
    SFCodeMirror,
    Util,
    Hash,
    UI,
    Messages,
    CMeditor)
{
    window.CodeMirror = CMeditor;

    var SLIDE_BACKCOLOR_ID = "cp-app-slide-toolbar-backcolor";
    var SLIDE_COLOR_ID = "cp-app-slide-toolbar-color";

    var mkLess = function (less) { 
        return (
            '#cp-app-slide-print .cp-app-slide-frame, ' +
            '#cp-app-slide-modal #cp-app-slide-modal-content .cp-app-slide-frame {\r\n' +
                less +
            '\r\n}'
        );
    };

    var mkSlidePreviewPane = function (framework, $contentContainer) {
        var $previewButton = framework._.sfCommon.createButton('preview', true);
        $previewButton.click(function () {
            var $c = $contentContainer;
            if ($c.hasClass('cp-app-slide-preview')) {
                framework._.sfCommon.setPadAttribute('previewMode', false, function (e) {
                    if (e) { return console.log(e); }
                });
                $previewButton.removeClass('cp-toolbar-button-active');
                return void $c.removeClass('cp-app-slide-preview');
            }
            framework._.sfCommon.setPadAttribute('previewMode', true, function (e) {
                if (e) { return console.log(e); }
            });
            $c.addClass('cp-app-slide-preview');
            $previewButton.addClass('cp-toolbar-button-active');
            Slide.updateFontSize();
        });
        framework._.toolbar.$rightside.append($previewButton);

        framework._.sfCommon.getPadAttribute('previewMode', function (e, data) {
            if (e) { return void console.error(e); }
            if (data !== false && $previewButton) {
                $previewButton.click();
            }
        });
    };

    var mkPrintButton = function (framework, editor, $content, $print) {
        var $printButton = framework._.sfCommon.createButton('print', true);
        $printButton.click(function () {
            Slide.update(editor.getValue(), true);
            $print.html($content.html());
            window.focus();
            window.print();
            framework.feedback('PRINT_SLIDES');
        });
        framework._.toolbar.$drawer.append($printButton);
    };

    // Flag to check if a file from the filepicker is a mediatag for the slides or a background image
    var Background = {
        isBackground: false
    };

    var mkSlideOptionsButton = function (framework, slideOptions) {
        var metadataMgr = framework._.cpNfInner.metadataMgr;
        var updateSlideOptions = function (newOpt) {
            if (JSONSortify(newOpt) !== JSONSortify(slideOptions)) {
                $.extend(true, slideOptions, newOpt);
                // TODO: manage realtime + cursor in the "options" modal ??
                Slide.updateOptions();
            }
        };
        var updateLocalOptions = function (newOpt) {
            updateSlideOptions(newOpt);
            var metadata = JSON.parse(JSON.stringify(metadataMgr.getMetadata()));
            metadata.slideOptions = slideOptions;
            metadataMgr.updateMetadata(metadata);
            framework.localChange();
        };
        var common = framework._.sfCommon;
        var createPrintDialog = function (invalidStyle) {
            var slideOptionsTmp = {
                title: false,
                slide: false,
                date: false,
                background: false,
                transition: true,
                style: '',
                styleLess: ''
            };

            $.extend(true, slideOptionsTmp, slideOptions);
            var $container = $('<div class="alertify">');
            var $container2 = $('<div class="dialog">').appendTo($container);
            var $div = $('<div id="printOptions">').appendTo($container2);
            var $p = $('<p>', {'class': 'msg'}).appendTo($div);
            $('<b>').text(Messages.printOptions).appendTo($p);
            $p.append($('<br>'));
            // Slide number
            var cbox = UI.createCheckbox('cp-app-slide-options-number', Messages.printSlideNumber,
                                         slideOptionsTmp.slide);
            $(cbox).appendTo($p).find('input').on('change', function () {
                var c = this.checked;
                slideOptionsTmp.slide = c;
            }).css('width', 'auto');
            // Date
            var cboxDate = UI.createCheckbox('cp-app-slide-options-date', Messages.printDate,
                                         slideOptionsTmp.date);
            $(cboxDate).appendTo($p).find('input').on('change', function () {
                var c = this.checked;
                slideOptionsTmp.date = c;
            }).css('width', 'auto');
            // Title
            var cboxTitle = UI.createCheckbox('cp-app-slide-options-title', Messages.printTitle,
                                         slideOptionsTmp.title);
            $(cboxTitle).appendTo($p).find('input').on('change', function () {
                var c = this.checked;
                slideOptionsTmp.title = c;
            }).css('width', 'auto');
            // Transition
            var cboxTransition = UI.createCheckbox('cp-app-slide-options-transition', Messages.printTransition,
                                         slideOptionsTmp.transition);
            $(cboxTransition).appendTo($p).find('input').on('change', function () {
                var c = this.checked;
                slideOptionsTmp.transition = c;
            }).css('width', 'auto');
            $p.append($('<br>'));
            // Background image
            $('<label>', {'for': 'cp-app-slide-options-bg'}).text(Messages.printBackground)
                .appendTo($p);
            if (common.isLoggedIn()) {
                $p.append($('<br>'));
                $('<button>', {
                    title: Messages.filePickerButton,
                    'class': '',
                    style: 'font-size: 17px',
                    id: 'cp-app-slide-options-bg'
                }).click(function () {
                    Background.isBackground = true;
                    var pickerCfg = {
                        types: ['file'],
                        where: ['root'],
                        filter: {
                            fileType: ['image/']
                        }
                    };
                    common.openFilePicker(pickerCfg);
                }).text(Messages.printBackgroundButton).appendTo($p);
            }
            $p.append($('<br>'));
            var $bgValue = $('<div>').appendTo($p);
            var refreshValue = function () {
                $bgValue.html('');
                if (slideOptionsTmp.background && slideOptionsTmp.background.name) {
                    $bgValue.append(Messages._getKey("printBackgroundValue", [slideOptionsTmp.background.name]));
                    $('<button>', {
                        'class': 'fa fa-times',
                        title: Messages.printBackgroundRemove
                    }).click(function () {
                        slideOptionsTmp.background = false;
                        refreshValue();
                    }).appendTo($bgValue);
                } else {
                    $bgValue.append(Messages.printBackgroundNoValue);
                }
            };
            refreshValue();
            if (common.isLoggedIn()) {
                Background.todo = function (newData) {
                    slideOptionsTmp.background = newData;
                    refreshValue();
                };
            }
            $p.append($('<br>'));
            $p.append($('<br>'));
            // CSS
            $('<label>', {'for': 'cp-app-slide-options-css'}).text(Messages.printCSS).appendTo($p);
            $p.append($('<br>'));
            var $textarea = $('<textarea>', {'id':'cp-app-slide-options-css'})
                .css({'width':'100%', 'height':'100px'}).appendTo($p)
                .on('keydown keyup', function (e) {
                    e.stopPropagation();
                });
            $textarea.val(invalidStyle || slideOptionsTmp.styleLess || slideOptionsTmp.style);
            window.setTimeout(function () { $textarea.focus(); }, 0);

            require(['/bower_components/less/dist/less.min.js'], function () { });
            var parseLess = function (less, cb) {
                require(['/bower_components/less/dist/less.min.js'], function (Less) {
                    Less.render(less, {}, function(err, css) {
                        if (err) { return void cb(err); }
                        cb(undefined, css.css);
                    }, window.less);
                });
            };

            var h;
            var todo = function () {
                if ($textarea.val() !== slideOptionsTmp.styleLess) {
                    var less = slideOptionsTmp.styleLess = $textarea.val();
                    slideOptionsTmp.style = '';
                    parseLess(mkLess(less), function (err, css) {
                        if (err) {
                            UI.alert(
                                '<strong>' + Messages.slide_invalidLess + '</strong>' +
                                '<br>' +
                                '<pre class="cp-slide-css-error">' + Util.fixHTML(
                                    'Line: ' + (err.line - 1) + '\n' +
                                    err.extract[err.line - 1] + '\n' +
                                    new Array(err.column+1).join(' ') +
                                    '^--- ' + err.message
                                ) + '</pre>'
                                /*Messages.slide_badLess*/, function () {
                                $('body').append(createPrintDialog(less));
                            }, true);
                        } else {
                            slideOptionsTmp.style = css;
                            updateLocalOptions(slideOptionsTmp);
                        }
                    });
                } else {
                    updateLocalOptions(slideOptionsTmp);
                }
                $container.remove();
                UI.stopListening(h);
            };
            var todoCancel = function () {
                $container.remove();
                UI.stopListening(h);
            };

            h = UI.listenForKeys(todo, todoCancel);

            var $nav = $('<nav>').appendTo($div);
            $('<button>', {'class': 'cancel'}).text(Messages.cancelButton).appendTo($nav).click(todoCancel);
            $('<button>', {'class': 'ok'}).text(Messages.settings_save).appendTo($nav).click(todo);

            return $container;
        };

        var $optionsButton = framework._.sfCommon.createButton(null, true, {
            icon: 'fa-cog',
            title: Messages.slideOptionsTitle,
            hiddenReadOnly: true,
            text: Messages.slideOptionsText,
            name: 'options'
        });
        $optionsButton.click(function () {
            $('body').append(createPrintDialog());
        });
        framework._.toolbar.$drawer.append($optionsButton);

        metadataMgr.onChange(function () {
            var md = metadataMgr.getMetadata();
            if (md.slideOptions) {
                updateLocalOptions(md.slideOptions);
            }
        });
    };

    var mkColorConfiguration = function (framework, $modal) {
        var textColor;
        var backColor;
        var metadataMgr = framework._.cpNfInner.metadataMgr;

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
            framework.localChange();
        };

        var $back = framework._.sfCommon.createButton(null, true, {
            icon: 'fa-square',
            title: Messages.backgroundButtonTitle,
            hiddenReadOnly: true,
            name: 'background',
            style: 'color: #000;',
            id: SLIDE_BACKCOLOR_ID
        });
        var $text = framework._.sfCommon.createButton(null, true, {
            icon: 'fa-i-cursor',
            title: Messages.colorButtonTitle,
            hiddenReadOnly: true,
            name: 'color',
            style: 'font-weight: bold; color: #FFF;',
            id: SLIDE_COLOR_ID
        });
        var $testColor = $('<input>', { type: 'color', value: '!' });
        var $check = $("#cp-app-slide-colorpicker");
        if ($testColor.attr('type') !== "color" || $testColor.val() === '!') { return; }

        var $backgroundPicker = $('<input>', { type: 'color', value: backColor })
            .css({ display: 'none', })
            .on('change', function() { updateLocalColors(undefined, this.value); });
        $check.append($backgroundPicker);
        $back.on('click', function() {
            $backgroundPicker.val(backColor);
            $backgroundPicker.click();
        });

        var $foregroundPicker = $('<input>', { type: 'color', value: textColor })
            .css({ display: 'none', })
            .on('change', function() { updateLocalColors(this.value, undefined); });
        $check.append($foregroundPicker);
        $text.on('click', function() {
            $foregroundPicker.val(textColor);
            $foregroundPicker.click();
        });

        framework._.toolbar.$rightside.append($text).append($back);

        metadataMgr.onChange(function () {
            var md = metadataMgr.getMetadata();
            if (md.color || md.backColor) {
                updateLocalColors(md.color, md.backColor);
            }
        });
    };

    var mkFilePicker = function (framework, editor) {
        framework.setMediaTagEmbedder(function (mt, data) {
            if (Background.isBackground) {
                if (data.type === 'file') {
                    data.mt = mt[0].outerHTML;
                    Background.todo(data);
                }
                Background.isBackground = false;
                return;
            }
            editor.replaceSelection($(mt)[0].outerHTML);
        });
    };

    var mkMarkdownToolbar = function (framework, editor) {
        var $codeMirrorContainer = $('#cp-app-slide-editor-container');
        var markdownTb = framework._.sfCommon.createMarkdownToolbar(editor);
        $codeMirrorContainer.prepend(markdownTb.toolbar);
        framework._.toolbar.$rightside.append(markdownTb.button);
    };

    var mkHelpMenu = function (framework) {
        var $codeMirrorContainer = $('#cp-app-slide-editor-container');
        var helpMenu = framework._.sfCommon.createHelpMenu(['text', 'slide']);
        $codeMirrorContainer.prepend(helpMenu.menu);

        framework._.toolbar.$drawer.append(helpMenu.button);
    };

    var activateLinks = function ($content, framework) {
        $content.click(function (e) {
            if (!e.target) { return; }
            var $t = $(e.target);
            if ($t.is('a') || $t.parents('a').length) {
                e.preventDefault();
                var $a = $t.is('a') ? $t : $t.parents('a').first();
                var href = $a.attr('href');
                framework._.sfCommon.openUnsafeURL(href);
            }
        });
    };

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////


    var andThen2 = function (editor, CodeMirror, framework, isPresentMode) {

        var common = framework._.sfCommon;
        var privateData = common.getMetadataMgr().getPrivateData();

        var $contentContainer = $('#cp-app-slide-editor');
        var $modal = $('#cp-app-slide-modal');
        var $content = $('#cp-app-slide-modal-content');
        var $print = $('#cp-app-slide-print');
        var slideOptions = {};

        var $toolbarDrawer = framework._.toolbar.$drawer;

        activateLinks($content, framework);
        Slide.setModal(framework._.sfCommon, $modal, $content, slideOptions, Messages.slideInitialState);
        mkPrintButton(framework, editor, $content, $print);
        mkSlideOptionsButton(framework, slideOptions, $toolbarDrawer);
        mkColorConfiguration(framework, $modal);
        mkFilePicker(framework, editor);
        mkSlidePreviewPane(framework, $contentContainer);
        mkMarkdownToolbar(framework, editor);
        mkHelpMenu(framework);

        CodeMirror.mkIndentSettings(framework._.cpNfInner.metadataMgr);
        CodeMirror.init(framework.localChange, framework._.title, framework._.toolbar);
        CodeMirror.configureTheme(common);

        framework.onContentUpdate(function (newContent) {
            CodeMirror.contentUpdate(newContent);
            Slide.update(newContent.content);
        });

        framework.setContentGetter(function () {
            CodeMirror.removeCursors();
            var content = CodeMirror.getContent();
            Slide.update(content.content);
            return content;
        });

        var cursorTo;
        var updateCursor = function () {
            if (cursorTo) { clearTimeout(cursorTo); }
            if (editor._noCursorUpdate) { return; }
            cursorTo = setTimeout(function () {
                framework.updateCursor();
            }, 500); // 500ms to make sure it is sent after chainpad sync
        };
        framework.onCursorUpdate(CodeMirror.setRemoteCursor);
        framework.setCursorGetter(CodeMirror.getCursor);
        editor.on('cursorActivity', updateCursor);

        framework.onEditableChange(function () {
            editor.setOption('readOnly', framework.isLocked() || framework.isReadOnly());
        });

        framework.setTitleRecommender(function () {
            console.log('titleRecommender');
            return CodeMirror.getHeadingText();
        });

        framework.onReady(function (/*newPad*/) {
            editor.focus();

            CodeMirror.setMode('markdown', function () { });
            Slide.onChange(function (o, n, l) {
                var slideNumber = '';
                if (n !== null) {
                    if (Slide.shown) {
                        slideNumber = ' (' + (++n) + '/' + l + ')';
                    }
                }
                framework._.sfCommon.setTabTitle('{title}' + slideNumber);
            });
            Slide.update(editor.getValue());

            var fmConfig = {
                dropArea: $('.CodeMirror'),
                body: $('body'),
                onUploaded: function (ev, data) {
                    var parsed = Hash.parsePadUrl(data.url);
                    var secret = Hash.getSecrets('file', parsed.hash, data.password);
                    var fileHost = privateData.fileHost || privateData.origin;
                    var src = fileHost + Hash.getBlobPathFromHex(secret.channel);
                    var key = Hash.encodeBase64(secret.keys.cryptKey);
                    var mt = '<media-tag src="' + src + '" data-crypto-key="cryptpad:' + key + '"></media-tag>';
                    editor.replaceSelection(mt);
                }
            };
            common.createFileManager(fmConfig);
        });

        framework.onDefaultContentNeeded(function () {
            CodeMirror.contentUpdate({ content: '' });
        });

        Slide.setTitle(framework._.title);

        var enterPresentationMode = function () { Slide.show(true, editor.getValue()); };
        framework._.toolbar.$rightside.append(
            framework._.sfCommon.createButton('present', true).click(enterPresentationMode)
        );
        if (isPresentMode) { enterPresentationMode(); }

        editor.on('change', framework.localChange);

        framework.setFileExporter(".md", CodeMirror.fileExporter);
        framework.setFileImporter({}, CodeMirror.fileImporter);

        framework.start();
    };

    var getThumbnailContainer = function () {
        var $c = $('#cp-app-slide-editor');
        if ($c.hasClass('cp-app-slide-preview')) {
            return $('.cp-app-slide-frame').first()[0];
        }
    };

    var main = function () {
        var CodeMirror;
        var editor;
        var framework;

        nThen(function (waitFor) {
            Framework.create({
                toolbarContainer: '#cme_toolbox',
                contentContainer: '#cp-app-slide-editor',
                thumbnail: {
                    getContainer: getThumbnailContainer,
                    filter: function (el, before) {
                        var metadataMgr = framework._.cpNfInner.metadataMgr;
                        var metadata = metadataMgr.getMetadata();
                        if (before) {
                            $(el).css('background-color', metadata.backColor || '#000');
                            return;
                        }
                        $(el).css('background-color', '');
                    }
                }
            }, waitFor(function (fw) { framework = fw; }));

            nThen(function (waitFor) {
                $(waitFor());
            }).nThen(function () {
                CodeMirror = SFCodeMirror.create(null, CMeditor);
                $('.CodeMirror').addClass('fullPage');
                editor = CodeMirror.editor;
            }).nThen(waitFor());

        }).nThen(function (/*waitFor*/) {
            framework._.sfCommon.isPresentUrl(function (err, val) {
                andThen2(editor, CodeMirror, framework, val);
            });
        });
    };
    main();
});
