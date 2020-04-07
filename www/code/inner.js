define([
    'jquery',
    '/common/diffMarked.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/sframe-app-framework.js',
    '/common/sframe-common-codemirror.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/modes.js',
    '/common/visible.js',
    '/common/TypingTests.js',
    '/customize/messages.js',
    'cm/lib/codemirror',

    'css!cm/lib/codemirror.css',
    'css!cm/addon/dialog/dialog.css',
    'css!cm/addon/fold/foldgutter.css',

    'cm/mode/gfm/gfm',
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

    'less!/code/app-code.less'

], function (
    $,
    DiffMd,
    nThen,
    SFCommon,
    Framework,
    SFCodeMirror,
    Util,
    Hash,
    Modes,
    Visible,
    TypingTest,
    Messages,
    CMeditor)
{
    window.CodeMirror = CMeditor;

    var MEDIA_TAG_MODES = Object.freeze([
        'markdown',
        'gfm',
        'html',
        'htmlembedded',
        'htmlmixed',
        'index.html',
        'php',
        'velocity',
        'xml',
    ]);

    var mkPrintButton = function (framework, $content, $print) {
        var $printButton = framework._.sfCommon.createButton('print', true);
        $printButton.click(function () {
            $print.html($content.html());
            window.focus();
            window.print();
            framework.feedback('PRINT_CODE');
        });
        framework._.toolbar.$drawer.append($printButton);
    };
    var mkMarkdownTb = function (editor, framework) {
        var $codeMirrorContainer = $('#cp-app-code-container');
        var markdownTb = framework._.sfCommon.createMarkdownToolbar(editor);
        $codeMirrorContainer.prepend(markdownTb.toolbar);

        framework._.toolbar.$rightside.append(markdownTb.button);

        var modeChange = function (mode) {
            if (['markdown', 'gfm'].indexOf(mode) !== -1) { return void markdownTb.setState(true); }
            markdownTb.setState(false);
        };

        return {
            modeChange: modeChange
        };
    };
    var mkHelpMenu = function (framework) {
        var $codeMirrorContainer = $('#cp-app-code-container');
        $codeMirrorContainer.prepend(framework._.sfCommon.getBurnAfterReadingWarning());
        var helpMenu = framework._.sfCommon.createHelpMenu(['text', 'code']);
        $codeMirrorContainer.prepend(helpMenu.menu);

        framework._.toolbar.$drawer.append(helpMenu.button);
    };
    var mkPreviewPane = function (editor, CodeMirror, framework, isPresentMode) {
        var $previewContainer = $('#cp-app-code-preview');
        var $preview = $('#cp-app-code-preview-content');
        var $editorContainer = $('#cp-app-code-editor');
        var $codeMirrorContainer = $('#cp-app-code-container');
        var $codeMirror = $('.CodeMirror');

        $('<img>', {
            src: '/customize/main-favicon.png',
            alt: '',
            class: 'cp-app-code-preview-empty'
        }).appendTo($previewContainer);

        var $previewButton = framework._.sfCommon.createButton('preview', true);
        var forceDrawPreview = function () {
            try {
                if (editor.getValue() === '') {
                    $previewContainer.addClass('cp-app-code-preview-isempty');
                    return;
                }
                $previewContainer.removeClass('cp-app-code-preview-isempty');
                DiffMd.apply(DiffMd.render(editor.getValue()), $preview, framework._.sfCommon);
            } catch (e) { console.error(e); }
        };
        var drawPreview = Util.throttle(function () {
            if (['markdown', 'gfm'].indexOf(CodeMirror.highlightMode) === -1) { return; }
            if (!$previewButton.is('.cp-toolbar-button-active')) { return; }
            forceDrawPreview();
        }, 400);

        var previewTo;
        $previewButton.click(function () {
            clearTimeout(previewTo);
            $codeMirror.addClass('transition');
            previewTo = setTimeout(function () {
                $codeMirror.removeClass('transition');
            }, 500);
            if (['markdown', 'gfm'].indexOf(CodeMirror.highlightMode) === -1) {
                $previewContainer.show();
            }
            $previewContainer.toggle();
            if ($previewContainer.is(':visible')) {
                forceDrawPreview();
                $codeMirrorContainer.removeClass('cp-app-code-fullpage');
                $previewButton.addClass('cp-toolbar-button-active');
                framework._.sfCommon.setPadAttribute('previewMode', true, function (e) {
                    if (e) { return console.log(e); }
                });
            } else {
                $codeMirrorContainer.addClass('cp-app-code-fullpage');
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
                if (/^\/[^\/]/.test(href)) {
                    var privateData = framework._.cpNfInner.metadataMgr.getPrivateData();
                    href = privateData.origin + href;
                } else if (/^#/.test(href)) {
                    var target = document.getElementById('cp-md-0-'+href.slice(1));
                    if (target) { target.scrollIntoView(); }
                    return;
                }
                framework._.sfCommon.openUnsafeURL(href);
            }
        });

        var modeChange = function (mode) {
            if (['markdown', 'gfm'].indexOf(mode) !== -1) {
                $previewButton.show();
                framework._.sfCommon.getPadAttribute('previewMode', function (e, data) {
                    if (e) { return void console.error(e); }
                    if (data !== false) {
                        $previewContainer.show();
                        $previewButton.addClass('cp-toolbar-button-active');
                        $codeMirrorContainer.removeClass('cp-app-code-fullpage');
                        if (isPresentMode) {
                            $editorContainer.addClass('cp-app-code-present');
                        }
                    }
                });
                return;
            }
            $editorContainer.removeClass('cp-app-code-present');
            $previewButton.hide();
            $previewContainer.hide();
            $previewButton.removeClass('active');
            $codeMirrorContainer.addClass('cp-app-code-fullpage');
        };

        var isVisible = function () {
            return $previewContainer.is(':visible');
        };

        framework.onReady(function () {
            // add the splitter
            var splitter = $('<div>', {
                'class': 'cp-splitter'
            }).appendTo($previewContainer);

            $preview.on('scroll', function() {
                splitter.css('top', $preview.scrollTop() + 'px');
            });

            var $target = $codeMirrorContainer;

            splitter.on('mousedown', function (e) {
                e.preventDefault();
                var x = e.pageX;
                var w = $target.width();
                var handler = function (evt) {
                    if (evt.type === 'mouseup') {
                        $(window).off('mouseup mousemove', handler);
                        return;
                    }
                    $target.css('width', (w - x + evt.pageX) + 'px');
                    editor.refresh();
                };
                $(window).off('mouseup mousemove', handler);
                $(window).on('mouseup mousemove', handler);
            });

            var previewInt;
            var clear = function () { clearInterval(previewInt); };

            // keep trying to draw until you're confident it has been drawn
            previewInt = setInterval(function () {
                // give up if it's not a valid preview mode
                if (['markdown', 'gfm'].indexOf(CodeMirror.highlightMode) === -1) { return void clear(); }
                // give up if content has been drawn
                if ($preview.text()) { return void clear(); }
                // only draw if there is actually content to display
                if (editor && !editor.getValue().trim()) { return void clear(); }
                forceDrawPreview();
            }, 1000);
        });

        framework._.sfCommon.getPadAttribute('previewMode', function (e, data) {
            if (e) { return void console.error(e); }
            if (data === false && $previewButton) {
                $previewButton.click();
            }
        });

        Visible.onChange(function (visible) {
            if (visible) {
                drawPreview();
            }
        });

        return {
            forceDraw: forceDrawPreview,
            draw: drawPreview,
            modeChange: modeChange,
            isVisible: isVisible
        };
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

    var andThen2 = function (editor, CodeMirror, framework, isPresentMode) {

        var common = framework._.sfCommon;
        var privateData = common.getMetadataMgr().getPrivateData();

        var previewPane = mkPreviewPane(editor, CodeMirror, framework, isPresentMode);
        var markdownTb = mkMarkdownTb(editor, framework);

        var $removeAuthorColorsButton = framework._.sfCommon.createButton('removeauthorcolors', true, {icon: 'fa-paint-brush', title: 'Autorenfarben entfernen'});
        framework._.toolbar.$rightside.append($removeAuthorColorsButton);
        $removeAuthorColorsButton.click(function() {
            var selfrom = editor.getCursor("from");
            var selto = editor.getCursor("to");
            if (!editor.somethingSelected() || selfrom === selto) {
                editor.getAllMarks().forEach(function (marker) {
                    marker.clear();
                });
            } else {
                editor.findMarks(selfrom, selto).forEach(function (marker) {
                    marker.clear();
                });
            }
            framework.localChange();
        });

        var authormarksLocal = [];
        var authormarksUpdate = [];

        var $print = $('#cp-app-code-print');
        var $content = $('#cp-app-code-preview-content');
        mkPrintButton(framework, $content, $print);

        mkHelpMenu(framework);

        var evModeChange = Util.mkEvent();
        evModeChange.reg(previewPane.modeChange);
        evModeChange.reg(markdownTb.modeChange);

        CodeMirror.mkIndentSettings(framework._.cpNfInner.metadataMgr);
        CodeMirror.init(framework.localChange, framework._.title, framework._.toolbar);
        mkFilePicker(framework, editor, evModeChange);

        if (!framework.isReadOnly()) {
            CodeMirror.configureTheme(common, function () {
                CodeMirror.configureLanguage(common, null, evModeChange.fire);
            });
        } else {
            CodeMirror.configureTheme(common);
        }
        
        // get user color for author marks
        var authorcolor = framework._.sfCommon.getMetadataMgr().getUserData().color;
        var authorcolor_r = parseInt("0x" + authorcolor.slice(1,3));
        var authorcolor_g = parseInt("0x" + authorcolor.slice(3,5));
        var authorcolor_b = parseInt("0x" + authorcolor.slice(5,7));
        var authorcolor_min = Math.min(authorcolor_r, authorcolor_g, authorcolor_b);

        // set minimal brightness for author marks and calculate color
        var tarMinColorVal = 180;
        if (authorcolor_min < tarMinColorVal) {
            var facColor = (255-tarMinColorVal)/(255-authorcolor_min);
            authorcolor_r = Math.floor(255-facColor*(255-authorcolor_r));
            authorcolor_g = Math.floor(255-facColor*(255-authorcolor_g));
            authorcolor_b = Math.floor(255-facColor*(255-authorcolor_b));
            authorcolor = "#" + authorcolor_r.toString(16) + authorcolor_g.toString(16) + authorcolor_b.toString(16);
        }

        ////

        framework.onContentUpdate(function (newContent) {
            var highlightMode = newContent.highlightMode;
            if (highlightMode && highlightMode !== CodeMirror.highlightMode) {
                CodeMirror.setMode(highlightMode, evModeChange.fire);
            }

            // author marks will be updated in onChange-Handler
            authormarksUpdate = newContent.authormarks;

            CodeMirror.contentUpdate(newContent, authormarksUpdate, authormarksLocal);
            previewPane.draw();
        });

        framework.setContentGetter(function () {
            CodeMirror.removeCursors();
            var content = CodeMirror.getContent();
            content.highlightMode = CodeMirror.highlightMode;
            previewPane.draw();

            // get author marks
            var authormarks = [];
            editor.getAllMarks().forEach(function (mark) {
                var pos = mark.find();
                var css = mark.css;
                if (pos !== undefined && css !== undefined) {
                    var color = css.replace("background-color:", "").trim();
                    if (pos.from.line === pos.to.line) {
                        if ((pos.from.ch + 1) === pos.to.ch) {
                            authormarks.push([pos.from.line, pos.from.ch, color]);
                        } else {
                            authormarks.push([pos.from.line, pos.from.ch, pos.to.ch, color]);
                        }
                    } else {
                        authormarks.push([pos.from.line, pos.from.ch, pos.to.line, pos.to.ch, color]);
                    }
                }
            });
            content.authormarks = authormarks;
            authormarksLocal = authormarks.slice();

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

        framework.setTitleRecommender(CodeMirror.getHeadingText);

        framework.onReady(function (newPad) {
            editor.focus();

            if (newPad && !CodeMirror.highlightMode) {
                CodeMirror.setMode('gfm', evModeChange.fire);
                //console.log("%s => %s", CodeMirror.highlightMode, CodeMirror.$language.val());
            }

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
             editor.setValue(''); //Messages.codeInitialState);
        });

        framework.setFileExporter(CodeMirror.getContentExtension, CodeMirror.fileExporter);
        framework.setFileImporter({}, function () {
            /*  setFileImporter currently takes a function with the following signature:
                (content, file) => {}
                I used 'apply' with 'arguments' to avoid breaking things if this API ever changes.
            */
            var ret = CodeMirror.fileImporter.apply(null, Array.prototype.slice.call(arguments));
            previewPane.modeChange(ret.mode);
            return ret;
        });

        framework.setNormalizer(function (c) {
            return {
                content: c.content,
                highlightMode: c.highlightMode,
                authormarks: c.authormarks
            };
        });

        editor.on('change', function( cm, change ) {
            if (change.origin !== undefined && change.text !== undefined && (change.origin === "+input" || change.origin === "paste")) {
                // add new author mark if text is added. marks from removed text are removed automatically
                var to_ch_add;
                if (change.text.length > 1) {
                    to_ch_add = change.text[change.text.length-1].length; 
                } else {
                    to_ch_add = change.from.ch + change.text[change.text.length-1].length;                
                }
                editor.markText({line: change.from.line, ch: change.from.ch}, {line: change.from.line + change.text.length-1, ch: to_ch_add}, {css: "background-color: " + authorcolor});
            } else if (change.origin === "setValue") {
                // on remote update: remove all marks, add new marks
                editor.getAllMarks().forEach(function (marker) {
                    marker.clear();
                });
                authormarksUpdate.forEach(function (mark) {
                    var from_line;
                    var to_line;
                    var from_ch;
                    var to_ch;
                    var mark_color;
                    if (mark.length === 3)  {
                        from_line = mark[0];
                        to_line = mark[0];
                        from_ch = mark[1];
                        to_ch = mark[1]+1;
                        mark_color = mark[2];
                    } else if (mark.length === 4) {
                        from_line = mark[0];
                        to_line = mark[0];
                        from_ch = mark[1];
                        to_ch = mark[2];
                        mark_color = mark[3];
                    } else if (mark.length === 5) {
                        from_line = mark[0];
                        to_line = mark[2];
                        from_ch = mark[1];
                        to_ch = mark[3];
                        mark_color = mark[4];
                    }
                    editor.markText({line: from_line, ch: from_ch}, {line: to_line, ch: to_ch}, {css: "background-color: " + mark_color});
                });
            }
            framework.localChange();
        });

        framework.start();


        window.easyTest = function () {
            var test = TypingTest.testCode(editor);
            return test;
        };
    };

    var getThumbnailContainer = function () {
        var $preview = $('#cp-app-code-preview-content');
        if ($preview.length && $preview.is(':visible')) {
            return $preview[0];
        }
    };

    var main = function () {
        var CodeMirror;
        var editor;
        var framework;

        nThen(function (waitFor) {

            Framework.create({
                toolbarContainer: '#cme_toolbox',
                contentContainer: '#cp-app-code-editor',
                thumbnail: {
                    getContainer: getThumbnailContainer,
                    filter: function (el, before) {
                        if (before) {
                            //$(el).parents().css('overflow', 'visible');
                            $(el).css('max-height', Math.max(600, $(el).width()) + 'px');
                            return;
                        }
                        $(el).parents().css('overflow', '');
                        $(el).css('max-height', '');
                        editor.refresh();
                    }
                }
            }, waitFor(function (fw) { framework = fw; }));

            nThen(function (waitFor) {
                $(waitFor());
            }).nThen(function () {
                CodeMirror = SFCodeMirror.create(null, CMeditor);
                $('#cp-app-code-container').addClass('cp-app-code-fullpage');
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
