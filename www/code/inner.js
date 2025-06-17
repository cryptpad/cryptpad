// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/common/diffMarked.js',
    '/components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/hyperscript.js',
    '/common/sframe-app-framework.js',
    '/common/sframe-common-codemirror.js',
    '/common/common-interface.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/code/markers.js',
    '/common/visible.js',
    '/common/TypingTests.js',
    '/customize/messages.js',
    'cm/lib/codemirror',
    '/common/common-ui-elements.js',


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

    'css!/customize/src/print.css',
    'less!/code/app-code.less'

], function (
    $,
    DiffMd,
    nThen,
    SFCommon,
    h,
    Framework,
    SFCodeMirror,
    UI,
    Util,
    Hash,
    Markers,
    Visible,
    TypingTest,
    Messages,
    CMeditor,
    UIElements)
{
    window.CodeMirror = CMeditor;

    var MEDIA_TAG_MODES = Object.freeze([
        'markdown',
        'gfm',
        'html',
        'asciidoc',
        'htmlembedded',
        'htmlmixed',
        'index.html',
        'php',
        'velocity',
        'xml',
    ]);

    var mkThemeButton = function (framework) {
        const $drawer = UIElements.createDropdown({
            text: Messages.toolbar_theme,
            options: [],
            common: framework._.sfCommon,
            iconCls: 'cptools cptools-palette'
        });
        framework._.toolbar.$theme = $drawer.find('ul.cp-dropdown-content');
        framework._.toolbar.$bottomL.append($drawer);
        $drawer.addClass('cp-toolbar-appmenu');
    };

    var mkCbaButton = function (framework, markers) {
        var $showAuthorColorsButton = framework._.sfCommon.createButton('', true, {
            text: Messages.cba_hide,
            name: 'authormarks',
            icon: 'fa-paint-brush',
        }).hide();
        var $showAuthorColors = UIElements.getEntryFromButton($showAuthorColorsButton).hide();
        $showAuthorColors.find('span').addClass('cp-toolbar-name cp-toolbar-drawer-element');
        framework._.toolbar.$theme.append($showAuthorColors);
        markers.setButton($showAuthorColors);
    };
    var mkPrintButton = function (framework, $content, $print) {
        var $printButton = framework._.sfCommon.createButton('print', true);
        $printButton.click(function () {
            $print.html($content.html());
            window.focus();
            window.print();
            framework.feedback('PRINT_CODE');
            UI.clearTooltipsDelay();
        });
        var $dropdownEntry = UIElements.getEntryFromButton($printButton);
        framework._.toolbar.$drawer.append($dropdownEntry);
    };
    var mkMarkdownTb = function (editor, framework) {
        var $codeMirrorContainer = $('#cp-app-code-container');
        var markdownTb = framework._.sfCommon.createMarkdownToolbar(editor);
        $codeMirrorContainer.prepend(markdownTb.toolbar);

        framework._.toolbar.$bottomL.append(markdownTb.button);

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
        var helpMenu = framework._.sfCommon.createHelpMenu(['text', 'code']);
        $codeMirrorContainer.prepend(helpMenu.menu);

        var $helpMenuButton = UIElements.getEntryFromButton(helpMenu.button);
        framework._.toolbar.$drawer.append($helpMenuButton);
    };

    var previews = {};
    previews['gfm'] = function (val, $div, common) {
        DiffMd.apply(DiffMd.render(val), $div, common);
    };
    previews['markdown'] = previews['gfm'];
    previews['htmlmixed'] = function (val, $div, common) {
        DiffMd.apply(val, $div, common);
    };
    previews['asciidoc'] = function (val, $div, common) {
        require([
            'asciidoctor',
            '/lib/highlight/highlight.pack.js',
            'css!/lib/highlight/styles/' + (window.CryptPad_theme === 'dark' ? 'dark.css' : 'github.css')
        ], function (asciidoctor) {
            var reg = asciidoctor.Extensions.create();
            var Highlight = window.hljs;

            reg.inlineMacro('media-tag', function () {
                var t = this;
                t.process(function (parent, target) {
                    var d = target.split('|');
                    return t.createInline(parent, 'quoted', `<media-tag src="${d[0]}" data-crypto-key="${d[1]}"></media-tag>`).convert();
                });
            });

            var html = asciidoctor.convert(val, { attributes: 'showtitle', extension_registry: reg });

            DiffMd.apply(html, $div, common);
            $div.find('pre code').each(function (i, el) {
                Highlight.highlightBlock(el);
            });
        });
    };


    var isSmallScreen = () => window.innerWidth <= 600;
    var mkPreviewPane = function (editor, CodeMirror, framework, isPresentMode) {
        var $previewContainer = $('#cp-app-code-preview');
        var $preview = $('#cp-app-code-preview-content');
        var $editorContainer = $('#cp-app-code-editor');
        var $codeMirrorContainer = $('#cp-app-code-container');
        var $codeMirror = $('.CodeMirror');

        $('<img>', {
            src: '/customize/CryptPad_logo_grey.svg',
            alt: '',
            class: 'cp-app-code-preview-empty'
        }).appendTo($previewContainer);

        var $previewButton = framework._.sfCommon.createButton('preview', true);
        var forceDrawPreview = function () {
            var f = previews[CodeMirror.highlightMode];
            if (!f) { return; }
            try {
                if (editor.getValue() === '') {
                    $previewContainer.addClass('cp-app-code-preview-isempty');
                    return;
                }
                $previewContainer.removeClass('cp-app-code-preview-isempty');
                f(editor.getValue(), $preview, framework._.sfCommon);
            } catch (e) { console.error(e); }
        };
        var drawPreview = Util.throttle(function () {
            if (!previews[CodeMirror.highlightMode]) { return; }
            if (!$previewButton.is('.cp-toolbar-button-active')) { return; }
            forceDrawPreview();
        }, 400);

        var previewTo;

        var togglePreview = function (show) {
            if (show && previews[CodeMirror.highlightMode]) {
                $previewContainer.show();
                $codeMirrorContainer.hide();
                $previewButton.addClass('cp-toolbar-button-active');
                drawPreview();
            } else {
                $previewContainer.hide();
                $codeMirrorContainer.show();
                $previewButton.removeClass('cp-toolbar-button-active');
            }
            framework._.sfCommon.setPadAttribute('previewMode', show);
        };

        var isVisible = function () {
            return $previewContainer.is(':visible');
        };

        var handleResize = function () {
            var wasPreviewVisible = isVisible(); // Capture preview state before resize

            // Present mode: always draw preview
            if (isPresentMode && previews[CodeMirror.highlightMode]) {
                $previewContainer.show();
                $codeMirrorContainer.hide();
                $previewButton.hide();
                return drawPreview();
            }
            // Small screen: toggle between editor and preview
            if (isSmallScreen()) {
                return togglePreview(wasPreviewVisible);
            }
            // Normal screen: split view to editor only
            if (wasPreviewVisible) {
                $previewContainer.show();
                $codeMirrorContainer.show();
                $codeMirrorContainer.removeClass('cp-app-code-fullpage');
                $previewButton.addClass('cp-toolbar-button-active');
                return drawPreview();
            }
            // Normal screen: editor only to split view
            $previewContainer.hide();
            $codeMirrorContainer.addClass('cp-app-code-fullpage');
            $previewButton.removeClass('cp-toolbar-button-active');
        };


        $previewButton.click(function () {
            clearTimeout(previewTo);
            $codeMirror.addClass('transition');
            previewTo = setTimeout(function () {
                $codeMirror.removeClass('transition');
            }, 500);

            var show = !isVisible();

            // Small screen: toggle between editor and preview
            if (isSmallScreen()) {
                return togglePreview(show);
            } 
            
            if (!previews[CodeMirror.highlightMode]) {
                $previewContainer.show();
            }
            $previewContainer.toggle();
            //Normal screen: split view to editor only
            if (isVisible()) {
                $codeMirrorContainer.removeClass('cp-app-code-fullpage');
                $previewButton.addClass('cp-toolbar-button-active');
                framework._.sfCommon.setPadAttribute('previewMode', true, function (e) {
                    if (e) { return console.log(e); }
                });
                return forceDrawPreview();
            }

            // Normal screen: editor only to split view
            $codeMirrorContainer.addClass('cp-app-code-fullpage');
            $previewButton.removeClass('cp-toolbar-button-active');
            framework._.sfCommon.setPadAttribute('previewMode', false, function (e) {
                if (e) { return console.log(e); }
            });
        });

        framework._.toolbar.$bottomM.append($previewButton);

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
            if (previews[mode]) {
                $previewButton.show();
                if(isSmallScreen()) {
                    return togglePreview(false);
                }
                framework._.sfCommon.getPadAttribute('previewMode', function (e, data) {
                    if (e) { return void console.error(e); }
                    if (data !== false && data !== undefined) {
                        $previewContainer.show();
                        $previewButton.addClass('cp-toolbar-button-active');
                        $codeMirrorContainer.removeClass('cp-app-code-fullpage');
                        if (isPresentMode) {
                            $editorContainer.addClass('cp-app-code-present');
                            $previewButton.hide();
                        }
                    }
                });
                return;
            }
            $editorContainer.removeClass('cp-app-code-present');
            $previewButton.hide();
            $previewContainer.hide();
            $previewButton.removeClass('active');
            $codeMirrorContainer.show();
            $codeMirrorContainer.addClass('cp-app-code-fullpage');
        };


        framework.onReady(function () {
            handleResize();
            window.addEventListener('resize', handleResize);

            // add the splitter
            var splitter = $('<div>', {
                'class': 'cp-splitter'
            }).appendTo($previewContainer);

            $previewContainer.on('scroll', function() {
                splitter.css('top', $previewContainer.scrollTop() + 'px');
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
                if (!previews[CodeMirror.highlightMode]) { return void clear(); }
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

        DiffMd.onPluginLoaded(drawPreview);

        return {
            forceDraw: forceDrawPreview,
            draw: drawPreview,
            modeChange: modeChange,
            isVisible: isVisible
        };
    };

    var mkColorByAuthor = function (framework, markers) {
        var common = framework._.sfCommon;
        var $cbaButton = framework._.sfCommon.createButton(null, true, {
            icon: 'fa-paint-brush',
            text: Messages.cba_title,
            name: 'cba'
        }, function () {
            var div = h('div');
            var $div = $(div);
            var content = h('div', [
                h('h4', Messages.cba_properties),
                h('p', Messages.cba_hint),
                div
            ]);
            var setButton = function (state) {
                var button = h('button.btn');
                var $button = $(button);
                $div.html('').append($button);
                if (state) {
                    // Add "enable" button
                    $button.addClass('btn-secondary').text(Messages.cba_enable);
                    UI.confirmButton(button, {
                        classes: 'btn-primary'
                    }, function () {
                        $button.remove();
                        markers.setState(true);
                        common.setAttribute(['code', 'enableColors'], true);
                        setButton(false);
                    });
                    return;
                }
                // Add "disable" button
                $button.addClass('btn-danger-alt').text(Messages.cba_disable);
                UI.confirmButton(button, {
                    classes: 'btn-danger'
                }, function () {
                    $button.remove();
                    markers.setState(false);
                    common.setAttribute(['code', 'enableColors'], false);
                    setButton(true);
                });
            };
            setButton(!markers.getState());
            UI.alert(content);
        });
        var $cba = UIElements.getEntryFromButton($cbaButton);
        framework._.toolbar.$theme.prepend($cba);
    };

    var mkFilePicker = function (framework, editor, evModeChange) {
        evModeChange.reg(function (mode) {
            if (MEDIA_TAG_MODES.indexOf(mode) !== -1) {
                // Embedding is enabled
                framework.setMediaTagEmbedder(function (mt, d) {
                    editor.focus();
                    var txt = $(mt)[0].outerHTML;
                    if (editor.getMode().name === "asciidoc") {
                        if (d.static) {
                            txt = d.href + `[${d.name}]`;
                        } else {
                            txt = `media-tag:${d.src}|${d.key}[]`;
                        }
                    }
                    editor.replaceSelection(txt);
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

        mkThemeButton(framework);

        var markers = Markers.create({
            common: common,
            framework: framework,
            CodeMirror: CodeMirror,
            devMode: privateData.devMode,
            editor: editor
        });
        mkCbaButton(framework, markers);

        var $print = $('#cp-app-code-print');
        var $content = $('#cp-app-code-preview-content');
        mkPrintButton(framework, $content, $print);

        if (!privateData.isEmbed) {
            mkHelpMenu(framework);
        }

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

        framework.onContentUpdate(function (newContent) {
            var highlightMode = newContent.highlightMode;
            if (highlightMode && highlightMode !== CodeMirror.highlightMode) {
                CodeMirror.setMode(highlightMode, evModeChange.fire);
            }

            // Fix the markers offsets
            markers.checkMarks(newContent);

            // Apply the text content
            CodeMirror.contentUpdate(newContent);
            previewPane.draw();

            // Apply the markers
            markers.setMarks();

            framework.localChange();
        });

        framework.setContentGetter(function () {
            CodeMirror.removeCursors();
            var content = CodeMirror.getContent();
            content.highlightMode = CodeMirror.highlightMode;
            previewPane.draw();

            markers.updateAuthorMarks();
            content.authormarks = markers.getAuthorMarks();

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

        editor.setOption("extraKeys", {
            "Esc": function(cm, event) {
                event.preventDefault();
                document.body.focus();
            }
        });
        
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

            markers.ready();
            common.getPadMetadata(null, function (md) {
                if (md && md.error) { return; }
                if (!Array.isArray(md.owners)) { return void markers.setState(false); }
                if (!common.isOwned(md.owners)) { return; }
                // We're the owner: add the button and enable the colors if needed
                mkColorByAuthor(framework, markers);
                if (newPad && Util.find(privateData, ['settings', 'code', 'enableColors'])) {
                    markers.setState(true);
                }
            });


            var fmConfig = {
                dropArea: $('.CodeMirror'),
                body: $('body'),
                onUploaded: function (ev, data) {
                    var parsed = Hash.parsePadUrl(data.url);
                    var secret = Hash.getSecrets('file', parsed.hash, data.password);
                    var fileHost = privateData.fileHost || privateData.origin;
                    var src = fileHost + Hash.getBlobPathFromHex(secret.channel);
                    var key = Hash.encodeBase64(secret.keys.cryptKey);
                    var mt = UI.mediaTag(src, key).outerHTML;
                    editor.replaceSelection(mt);
                }
            };
            common.createFileManager(fmConfig);
        });

        framework.onDefaultContentNeeded(function () {
             editor.setValue('');
        });

        framework.setFileExporter(CodeMirror.getContentExtension, CodeMirror.fileExporter);
        framework.setFileImporter({}, function () {
            /*  setFileImporter currently takes a function with the following signature:
                (content, file) => {}
                I used 'apply' with 'arguments' to avoid breaking things if this API ever changes.
            */
            var ret = CodeMirror.fileImporter.apply(null, Array.prototype.slice.call(arguments));
            previewPane.modeChange(ret.highlightMode);
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
            markers.localChange(change, framework.localChange);
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
                skipLink: '.CodeMirror',
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

            $('#cp-app-code-editor').append([
                h('div#cp-app-code-container', h('textarea#editor1', {name:'editor1'})),
                h('div#cp-app-code-preview', [
                    h('div#cp-app-code-preview-content'),
                    h('div#cp-app-code-print')
                ])
            ]);

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
