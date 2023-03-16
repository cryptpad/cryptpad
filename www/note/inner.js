define([
    'jquery',
    '/common/diffMarked.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/hyperscript.js',
    '/common/sframe-app-framework.js',
    '/common/sframe-common-codemirror.js',
    '/common/common-interface.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/note/markers.js',
    '/common/visible.js',
    '/common/TypingTests.js',
    '/customize/messages.js',
    '/bower_components/revealjs/dist/reveal.js',
    '/bower_components/revealjs/plugin/markdown/markdown.js',
    '/bower_components/revealjs/plugin/highlight/highlight.js',
    '/lib/cm6.js',


    /*
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
*/

    'css!/bower_components/revealjs/dist/reveal.css',
    'css!/bower_components/revealjs/dist/theme/' + (window.CryptPad_theme === 'dark' ?
                                                    'black.css' : 'white.css'),
    'css!/customize/src/print.css',
    'less!/note/app-note.less'

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
    Reveal,
    RevealMd,
    RevealH)
{


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
        var $theme = $(h('button.cp-toolbar-appmenu', [
            h('i.cptools.cptools-palette'),
            h('span.cp-button-name', Messages.toolbar_theme)
        ]));
        var $content = $(h('div.cp-toolbar-drawer-content', {
            tabindex: 1
        })).hide();

        // set up all the necessary events
        UI.createDrawer($theme, $content);

        framework._.toolbar.$theme = $content;
        framework._.toolbar.$bottomL.append($theme);
    };

    var mkCbaButton = function (framework, markers) {
        var $showAuthorColorsButton = framework._.sfCommon.createButton('', true, {
            text: Messages.cba_hide,
            name: 'authormarks',
            icon: 'fa-paint-brush',
        }).hide();
        framework._.toolbar.$theme.append($showAuthorColorsButton);
        markers.setButton($showAuthorColorsButton);
    };
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
    var mkMarkdownTb = function (CodeMirror, framework) {
        var $codeMirrorContainer = $('#cp-app-code-container');
        var markdownTb = framework._.sfCommon.createMarkdownToolbar(CodeMirror);
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

        framework._.toolbar.$drawer.append(helpMenu.button);
    };

    var previews = {};
    previews['gfm'] = function (val, $div, common) {
        DiffMd.apply(DiffMd.render(val), $div, common);
    };
    previews['html'] = function (val, $div, common) {
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

    var inlines = {};
    inlines['gfm'] = function () {

    };

    var presents = {};
    var currentReveal;
    presents['gfm'] = function (value, $container, common) {
        var el = h('div.reveal', [
            h('div.slides', [
                h('section', {
                    'data-markdown':'',
                    'data-separator-vertical': '^\r?\n--\r?\n$'
                }, [
                    h('textarea', {'data-template':true}, value)
                ])
            ])
        ]);
        $container.empty().append(el);
        var state;
        if (currentReveal) { state = currentReveal.getState(); }
        var deck = new Reveal( el, {
            plugins: [ RevealMd, RevealH ],
            embedded: true,
            keyboardCondition: 'focused',
            slideNumber: 'c/t',
            markdown: {
                renderer: DiffMd.getRenderer()
            }
        } );
        currentReveal = deck;
        deck.initialize();

        var getAttrs = function (el) {
            var map = {};
            var attrs = el.attributes;
            var att;
            for (var i = 0; i < attrs.length; i++){
                att = attrs[i];
                map[att.nodeName] = att.nodeValue;
            }
            return map;
        };
        var setAttrs = function (el, map) {
            Object.keys(map).forEach(function (k) {
                $(el).attr(k, map[k]);
            });
        };

        deck.on('ready', function () {
            $container.find('[data-markdown-parsed]').each(function (i, el) {
                var id = 'cp_'+Util.uid();
                var $el = $(el).attr('id', id);
                var html = el.innerHTML;
                $el.empty();
                var attrs = getAttrs(el);
                $el.addClass('present').removeClass('future');
                DiffMd.apply(html, $el, common, 'section');
                setAttrs(el, attrs);
            });
            deck.sync();
        });

        try {
            deck.setState(state);
        } catch (e) {}
    };

    var mkPreviewPane = function (CodeMirror, framework, isPresentMode) {
        var $previewContainer = $('#cp-app-code-preview');
        var $presentContainer = $('#cp-app-code-present');

        var $preview = $('#cp-app-code-preview-content');
        var $present = $('#cp-app-code-present-content');
        var $editorContainer = $('#cp-app-code-editor');
        var $codeMirrorContainer = $('#cp-app-code-container');

        $('<img>', {
            src: '/customize/CryptPad_logo_grey.svg',
            alt: '',
            class: 'cp-app-code-preview-empty'
        }).appendTo($previewContainer);

        var $previewButton = framework._.sfCommon.createButton('preview', true);
        var $presentButton = framework._.sfCommon.createButton('present', true);
        var $inlineButton = framework._.sfCommon.createButton('', true, {
            drawer: false,
            icon: "fa-i-cursor",
            text: "Inline" // XXX
        });

        var modes = {
            inline: {
                button: $inlineButton,
                container: $(),
                contentContainer: $(),
                handlers: inlines,
                handler: function () {
                    $codeMirrorContainer.toggleClass('cp-app-code-halfpage', true);
                }
            },
            preview: {
                button: $previewButton,
                container: $previewContainer,
                contentContainer: $preview,
                handlers: previews,
                handler: function (f) {
                    f(CodeMirror.getValue(), $preview, framework._.sfCommon);
                }
            },
            present: {
                button: $presentButton,
                container: $presentContainer,
                contentContainer: $present,
                handlers: presents,
                handler: function (f) {
                    f(CodeMirror.getValue(), $present, framework._.sfCommon);
                }
            }
        };

        var current = false;

        var forceDrawPreview = function () {
            var mode = modes[current];
            if (!mode) { return; }
            var f = mode.handlers[CodeMirror.highlightMode];
            if (!f) { return; }
            try {
                if (CodeMirror.getValue() === '' && current !== 'inline') {
                    mode.container.addClass('cp-app-code-preview-isempty');
                    return;
                }
                mode.container.removeClass('cp-app-code-preview-isempty');
                mode.handler(f);
            } catch (e) { console.error(e); }
        };
        var drawPreview = Util.throttle(function () {
            var mode = modes[current];
            if (!mode) { return; }
            if (!mode.handlers[CodeMirror.highlightMode]) { return; }
            if (!mode.button.is('.cp-toolbar-button-active')) { return; }
            forceDrawPreview();
        }, 400);

        var hideAll = function () {
            Object.keys(modes).forEach(function (id) {
                modes[id].container.hide();
                modes[id].button.removeClass('cp-toolbar-button-active');
            });
            $codeMirrorContainer.toggleClass('cp-app-code-halfpage', false);
            $codeMirrorContainer.toggleClass('cp-app-code-fullpage', true);
            $editorContainer.toggleClass('cp-app-code-present', false);
            current = false;
        };
        var setViewMode = function (language, id) {
            hideAll();
            var mode = modes[id];
            var state = mode && mode.handlers[language];
            if (!state) { return false; }

            CodeMirror.setInline(id === 'inline');

            mode.container.show();
            mode.button.toggleClass('cp-toolbar-button-active', true);
            if (id !== "inline") { $codeMirrorContainer.removeClass('cp-app-code-fullpage'); }
            if (isPresentMode) {
                $editorContainer.toggleClass('cp-app-code-present', true);
                //$previewButton.hide();
            }
            current = id;
            forceDrawPreview();
            return true;
        };

        Object.keys(modes).forEach(function (id) {
            var mode = modes[id];
            mode.button.click(function () {
                var newState = current !== id;
                if (newState) { setViewMode(CodeMirror.highlightMode, id); }
                else {
                    CodeMirror.setInline(false);
                    hideAll();
                }

                framework._.sfCommon.setPadAttribute('previewMode', current, function (e) {
                    if (e) { return console.log(e); }
                });
            });
            framework._.toolbar.$bottomM.append(mode.button);

            // Protect links in the content container
            mode.contentContainer.click(function (e) {
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

        });

        $('button.cp-app-code-present-fullscreen').click(function () {
            if (current !== 'present') { return; }
            if (!currentReveal) { return; }
            currentReveal.configure({ keyboardCondition: null });
            currentReveal.triggerKey(70);
            currentReveal.configure({ keyboardCondition: 'focused' });
        });

        // XXX handle present mode...
        // XXX and present+embed
        // ==> what mode to use? should we keep the button in present mode?
        // ==> default mode? can we show editor in present?
        var modeChange = function (language) {
            var todo = function (savedMode) {
                var allowed = {};
                Object.keys(modes).forEach(function (id) {
                    var mode = modes[id];
                    var state = mode.handlers[language];
                    if (state) {
                        allowed[id] = mode;
                        mode.button.show();
                        return;
                    }
                    mode.button.hide();
                });

                if (!savedMode) { return void hideAll(); }

                // Try to display prefered mode or switch to others
                var show = setViewMode(language, savedMode);
                if (!show) {
                    // Try other view modes
                    Object.keys(allowed).some(function (id) {
                        if (id === savedMode) { return false; }
                        return setViewMode(language, id);
                    });
                }
            };

            framework._.sfCommon.getPadAttribute('previewMode', function (e, data) {
                todo(data);
            });
        };

        framework.onReady(function () {
            // add the splitter
            Object.keys(modes).forEach(function (id) {
                var mode = modes[id];
                var splitter = $('<div>', {
                    'class': 'cp-splitter'
                }).appendTo(mode.container);

                mode.container.on('scroll', function() {
                    splitter.css('top', mode.container.scrollTop() + 'px');
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
                    };
                    $(window).off('mouseup mousemove', handler);
                    $(window).on('mouseup mousemove', handler);
                });

            });

            var previewInt;
            var clear = function () { clearInterval(previewInt); };

            // keep trying to draw until you're confident it has been drawn
            previewInt = setInterval(function () {
                if (!current) { return void clear(); }
                // give up if it's not a valid preview mode
                if (!modes[current][CodeMirror.highlightMode]) { return void clear(); }
                // give up if content has been drawn
                var mode = modes[current][CodeMirror.highlightMode];
                if (mode.contentContainer.text()) { return void clear(); }
                // only draw if there is actually content to display
                if (CodeMirror && !CodeMirror.getValue().trim()) { return void clear(); }
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
        framework._.toolbar.$theme.append($cbaButton);
    };

    var mkFilePicker = function (framework, CodeMirror, evModeChange) {
        evModeChange.reg(function (mode) {
            if (MEDIA_TAG_MODES.indexOf(mode) !== -1) {
                // Embedding is enabled
                framework.setMediaTagEmbedder(function (mt, d) {
                    CodeMirror.focus();
                    var txt = $(mt)[0].outerHTML;
                    if (CodeMirror.getMode().name === "asciidoc") {
                        if (d.static) {
                            txt = d.href + `[${d.name}]`;
                        } else {
                            txt = `media-tag:${d.src}|${d.key}[]`;
                        }
                    }
                    CodeMirror.replaceSelection(txt);
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

    var andThen2 = function (CodeMirror, framework, isPresentMode) {

        var common = framework._.sfCommon;
        var privateData = common.getMetadataMgr().getPrivateData();

        var previewPane = mkPreviewPane(CodeMirror, framework, isPresentMode);
        var markdownTb = mkMarkdownTb(CodeMirror, framework);

        mkThemeButton(framework);

        var markers = Markers.create({
            common: common,
            framework: framework,
            CodeMirror: CodeMirror,
            devMode: privateData.devMode,
            editor: CodeMirror.editor
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
        mkFilePicker(framework, CodeMirror, evModeChange);

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
            cursorTo = setTimeout(function () {
                framework.updateCursor();
            }, 500); // 500ms to make sure it is sent after chainpad sync
        };
        framework.onCursorUpdate(CodeMirror.setRemoteCursor);
        framework.setCursorGetter(CodeMirror.getCursor);
        CodeMirror.on('cursorActivity', updateCursor);

        framework.onEditableChange(function () {
            CodeMirror.setOption('readOnly', framework.isLocked() || framework.isReadOnly());
        });

        framework.setTitleRecommender(CodeMirror.getHeadingText);

            window.CP_CM_MT = function (el) {
                var id = 'cp_'+Util.uid();
                var $el = $(el).attr('id', id);
                var html = el.innerHTML;
                $el.empty();
                DiffMd.apply(html, $el, common, 'media-container');
            };

            var inlineCache = {};
            window.CP_CM_ext = function (el, src) {
                var MutationObserver = window.MutationObserver;
                var id = 'cp_'+Util.uid();
                var $el = $(el).attr('id', id);
                $el.attr('class', 'cp-ext');
                if (inlineCache[src]) {
                    return $el.append(inlineCache[src].clone(true));
                }

                // If new elements, compute it and add to cache
                var observer = new MutationObserver(function(mutations) {
                    mutations.some(function(mutation) {
                        if (mutation.type === 'childList') {
                            if ($el.find('pre > svg').length) {
                                inlineCache[src] = $el.find('pre').clone(true);
                                observer.disconnect();
                                return true;
                            }
                        }
                    });
                });
                observer.observe(el, {
                    attributes: false,
                    childList: true,
                    subtree: true,
                    characterData: false
                });

                $el.attr('class', 'cp-ext');
                DiffMd.apply(DiffMd.render(src), $el, common, 'media-container');
                $el.attr('class', 'cp-ext');
            };
            window.CP_CM_clear = function (images) {
                // Clear from cache SVGs that are not needed anymore
                Object.keys(inlineCache).forEach(function (src) {
                    if (!images.some(function (img) {
                        return img.src === src;
                    })) {
                        delete inlineCache[src];
                    }
                });
            };

        framework.onReady(function (newPad) {
            CodeMirror.focus();

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
                dropArea: $('.cm-editor'),
                body: $('body'),
                onUploaded: function (ev, data) {
                    var parsed = Hash.parsePadUrl(data.url);
                    var secret = Hash.getSecrets('file', parsed.hash, data.password);
                    var fileHost = privateData.fileHost || privateData.origin;
                    var src = fileHost + Hash.getBlobPathFromHex(secret.channel);
                    var key = Hash.encodeBase64(secret.keys.cryptKey);
                    var mt = UI.mediaTag(src, key).outerHTML;
                    CodeMirror.replaceSelection(mt);
                }
            };
            common.createFileManager(fmConfig);
        });

        framework.onDefaultContentNeeded(function () {
             CodeMirror.setValue('');
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

        CodeMirror.on('change', function( change ) {
            markers.localChange(change, framework.localChange);
        });

        framework.start();


        window.easyTest = function () {
            var test = TypingTest.testCode(CodeMirror);
            return test;
        };
    };

    var getThumbnailContainer = function () {
        var $preview = $('#cp-app-code-preview-content');
        if ($preview.length && $preview.is(':visible')) {
            return $preview[0]; // XXX
        }
    };

    var main = function () {
        var CodeMirror;
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
                    }
                }
            }, waitFor(function (fw) { framework = fw; }));

            $('#cp-app-code-editor').append([
                h('div#cp-app-code-container', h('textarea#editor1', {name:'editor1'})),
                h('div#cp-app-code-present', [
                    h('button.cp-app-code-present-fullscreen.fa.fa-arrows-alt'),
                    h('div#cp-app-code-present-content'),
                ]),
                h('div#cp-app-code-preview', [
                    h('div#cp-app-code-preview-content'),
                    h('div#cp-app-code-print')
                ])
            ]);

            nThen(function (waitFor) {
                $(waitFor());
            }).nThen(function () {
                var cmeditor = window.CP_createEditor();
                CodeMirror = SFCodeMirror.create(null, cmeditor);
                $('#cp-app-code-container').addClass('cp-app-code-fullpage');
                $('#cp-app-code-container').append(CodeMirror.editor.dom);
            }).nThen(waitFor());

        }).nThen(function (/*waitFor*/) {
            framework._.sfCommon.isPresentUrl(function (err, val) {
                andThen2(CodeMirror, framework, val);
            });
        });
    };
    main();
});
