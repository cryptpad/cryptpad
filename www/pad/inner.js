// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

require(['/api/config'], function(ApiConfig) {
    // see ckeditor_base.js getUrl()
    window.CKEDITOR_GETURL = function(resource) {
        if (resource.indexOf('/') === 0) {
            resource = window.CKEDITOR.basePath.replace(/\/components\/.*/, '') + resource;
        } else if (resource.indexOf(':/') === -1) {
            resource = window.CKEDITOR.basePath + resource;
        }
        if (resource[resource.length - 1] !== '/' && resource.indexOf('ver=') === -1) {
            var args = ApiConfig.requireConf.urlArgs;
            resource += (resource.indexOf('?') >= 0 ? '&' : '?') + args;
        }
        return resource;
    };

    window.MathJax = {
        "HTML-CSS": {
        },
        TeX: {
        }
    };

    require(['/components/ckeditor/ckeditor.js']);
});
define([
    'jquery',
    '/components/hyper-json/hyperjson.js',
    '/common/sframe-app-framework.js',
    '/common/cursor.js',
    //'/common/TypingTests.js',
    '/customize/messages.js',
    '/pad/links.js',
    '/pad/comments.js',
    '/pad/export.js',
    '/pad/cursor.js',
    '/components/nthen/index.js',
    '/common/media-tag.js',
    '/api/config',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/hyperscript.js',
    '/components/chainpad/chainpad.dist.js',
    //'/customize/application_config.js',
    //'/common/test.js',

    '/lib/diff-dom/diffDOM.js',
    '/components/file-saver/FileSaver.min.js',

    'css!/customize/src/print.css',
    'css!/components/bootstrap/dist/css/bootstrap.min.css',
    'css!/components/components-font-awesome/css/font-awesome.min.css',
    'less!/pad/app-pad.less'
], function(
    $,
    Hyperjson,
    Framework,
    Cursor,
    //TypingTest,
    Messages,
    Links,
    Comments,
    Exporter,
    Cursors,
    nThen,
    MediaTag,
    ApiConfig,
    Hash,
    Util,
    UI,
    UIElements,
    h,
    ChainPad/*,
    AppConfig,
    Test */
) {
    var DiffDom = window.diffDOM;

    var slice = function(coll) {
        return Array.prototype.slice.call(coll);
    };

    var removeListeners = function(root) {
        slice(root.attributes).map(function(attr) {
            if (/^on/.test(attr.name)) {
                root.attributes.removeNamedItem(attr.name);
            }
        });
        slice(root.children).forEach(removeListeners);
    };

    var hjsonToDom = function(H) {
        var dom = Hyperjson.toDOM(H);
        removeListeners(dom);
        return dom;
    };

    var module = window.REALTIME_MODULE = window.APP = {
        Hyperjson: Hyperjson,
        logFights: true,
        fights: [],
        Cursor: Cursor,
        mobile: $('body').width() <= 600
    };

    // MEDIATAG: Filter elements to serialize
    // * Remove the drag&drop and resizers from the hyperjson
    var isWidget = function(el) {
        return typeof(el.getAttribute) === "function" &&
            (el.getAttribute('data-cke-hidden-sel') || el.getAttribute('data-cke-temp') ||
                (el.getAttribute('class') &&
                    (/cke_widget_drag/.test(el.getAttribute('class')) ||
                        /cke_image_resizer/.test(el.getAttribute('class')))
                )
            );
    };

    var isNotMagicLine = function(el) {
        return !(el && typeof(el.getAttribute) === 'function' &&
            el.getAttribute('class') &&
            el.getAttribute('class').split(' ').indexOf('non-realtime') !== -1);
    };

    var isCursor = Cursors.isCursor;

    var shouldSerialize = function(el) {
        return isNotMagicLine(el) && !isWidget(el) && !isCursor(el);
    };

    // MEDIATAG: Filter attributes in the serialized elements
    var widgetFilter = function(hj) {
        // Send a widget ID == 0 to avoid a fight between browsers and
        // prevent the container from having the "selected" class (blue border)
        if (hj[1].class) {
            var split = hj[1].class.split(' ');
            if (split.indexOf('cke_widget_wrapper') !== -1 &&
                split.indexOf('cke_widget_block') !== -1) {
                hj[1].class = "cke_widget_wrapper cke_widget_block";
                hj[1]['data-cke-widget-id'] = "0";
            }
            if (split.indexOf('cke_widget_wrapper') !== -1 &&
                split.indexOf('cke_widget_inline') !== -1) {
                hj[1].class = "cke_widget_wrapper cke_widget_inline";
                delete hj[1]['data-cke-widget-id'];
                //hj[1]['data-cke-widget-id'] = "0";
            }
            // Remove the title attribute of the drag&drop icons (translation conflicts)
            if (split.indexOf('cke_widget_drag_handler') !== -1 ||
                split.indexOf('cke_image_resizer') !== -1) {
                hj[1].title = undefined;
            }
        }
        return hj;
    };

    var hjsonFilters = function(hj) {
        /* catch `type="_moz"` before it goes over the wire */
        var brFilter = function(hj) {
            if (hj[1].type === '_moz') { hj[1].type = undefined; }
            return hj;
        };
        var mediatagContentFilter = function(hj) {
            if (hj[0] === 'MEDIA-TAG') { hj[2] = []; }
            return hj;
        };
        var commentActiveFilter = function(hj) {
            if (hj[0] === 'COMMENT') { delete(hj[1] || {}).class; }
            return hj;
        };
        brFilter(hj);
        mediatagContentFilter(hj);
        commentActiveFilter(hj);
        widgetFilter(hj);
        return hj;
    };

    var domFromHTML = function(html) {
        return new DOMParser().parseFromString(html, 'text/html');
    };

    var forbiddenTags = [
        'SCRIPT',
        //'IFRAME',
        'OBJECT',
        'APPLET',
        //'VIDEO',
        //'AUDIO'
    ];

    var CKEDITOR_CHECK_INTERVAL = 100;
    var ckEditorAvailable = function(cb) {
        var intr;
        var check = function() {
            if (window.CKEDITOR) {
                clearTimeout(intr);
                cb(window.CKEDITOR);
            }
        };
        intr = setInterval(function() {
            console.log("Ckeditor was not defined. Trying again in %sms", CKEDITOR_CHECK_INTERVAL);
            check();
        }, CKEDITOR_CHECK_INTERVAL);
        check();
    };

    var mkSettingsMenu = function(framework) {
        var getSettings = function () {
            var $d = $(h('div.cp-pad-settings-dialog'));
            var common = framework._.sfCommon;
            var metadataMgr = common.getMetadataMgr();
            var md = Util.clone(metadataMgr.getMetadata());

            var set = function (key, val, spinner) {
                var md = Util.clone(metadataMgr.getMetadata());
                if (typeof(val) === "undefined") { delete md[key]; }
                else { md[key] = val; }
                metadataMgr.updateMetadata(md);
                framework.localChange();
                framework._.cpNfInner.whenRealtimeSyncs(spinner.done);
            };

            // Pad width
            var opt1 = UI.createRadio('cp-pad-settings-width', 'cp-pad-settings-width-small',
                Messages.pad_settings_width_small, md.defaultWidth === 0, {
                    input: { value: 0 },
                    label: { class: 'noTitle' }
                });
            var opt2 = UI.createRadio('cp-pad-settings-width', 'cp-pad-settings-width-large',
                Messages.pad_settings_width_large, md.defaultWidth === 1, {
                    input: { value: 1 },
                    label: { class: 'noTitle' }
                });
            var delWidth = h('button.btn.btn-default.fa.fa-times');
            var width = h('div.cp-pad-settings-radio-container', [
                opt1,
                opt2,
                delWidth
            ]);
            var $width = $(width);
            var spinner = UI.makeSpinner($width);

            $(delWidth).click(function () {
                spinner.spin();
                $width.find('input[type="radio"]').prop('checked', false);
                set('defaultWidth', undefined, spinner);
            });
            $width.find('input[type="radio"]').on('change', function() {
                spinner.spin();
                var val = $('input:radio[name="cp-pad-settings-width"]:checked').val();
                val = Number(val) || 0;
                set('defaultWidth', val, spinner);
            });

            // Outline
            var opt3 = UI.createRadio('cp-pad-settings-outline', 'cp-pad-settings-outline-false',
                Messages.pad_settings_hide, md.defaultOutline === 0, {
                    input: { value: 0 },
                    label: { class: 'noTitle' }
                });
            var opt4 = UI.createRadio('cp-pad-settings-outline', 'cp-pad-settings-outline-true',
                Messages.pad_settings_show, md.defaultOutline === 1, {
                    input: { value: 1 },
                    label: { class: 'noTitle' }
                });
            var delOutline = h('button.btn.btn-default.fa.fa-times');
            var outline = h('div.cp-pad-settings-radio-container', [
                opt3,
                opt4,
                delOutline
            ]);
            var $outline = $(outline);
            var spinner2 = UI.makeSpinner($outline);

            $(delOutline).click(function () {
                spinner2.spin();
                $outline.find('input[type="radio"]').prop('checked', false);
                set('defaultOutline', undefined, spinner2);
            });
            $outline.find('input[type="radio"]').on('change', function() {
                spinner2.spin();
                var val = $('input:radio[name="cp-pad-settings-outline"]:checked').val();
                val = Number(val) || 0;
                set('defaultOutline', val, spinner2);
            });

            // Comments
            var opt5 = UI.createRadio('cp-pad-settings-comments', 'cp-pad-settings-comments-false',
                Messages.pad_settings_hide, md.defaultComments === 0, {
                    input: { value: 0 },
                    label: { class: 'noTitle' }
                });
            var opt6 = UI.createRadio('cp-pad-settings-comments', 'cp-pad-settings-comments-true',
                Messages.pad_settings_show, md.defaultComments === 1, {
                    input: { value: 1 },
                    label: { class: 'noTitle' }
                });
            var delComments = h('button.btn.btn-default.fa.fa-times');
            var comments = h('div.cp-pad-settings-radio-container', [
                opt5,
                opt6,
                delComments
            ]);
            var $comments = $(comments);
            var spinner3 = UI.makeSpinner($comments);

            $(delComments).click(function () {
                spinner3.spin();
                $comments.find('input[type="radio"]').prop('checked', false);
                set('defaultComments', undefined, spinner3);
            });
            $comments.find('input[type="radio"]').on('change', function() {
                spinner3.spin();
                var val = $('input:radio[name="cp-pad-settings-comments"]:checked').val();
                val = Number(val) || 0;
                set('defaultComments', val, spinner3);
            });

            $d.append([
                h('h5', Messages.pad_settings_title),
                h('p.cp-app-prop-content', h('p', Messages.pad_settings_info)),
                h('label', Messages.settings_padWidth),
                h('p.cp-app-prop-content', Messages.settings_padWidthHint),
                $width[0],
                h('label', Messages.markdown_toc),
                h('p.cp-app-prop-content', Messages.pad_settings_outline),
                $outline[0],
                h('label', Messages.poll_comment_list),
                h('p.cp-app-prop-content', Messages.pad_settings_comments),
                $comments[0],
            ]);

            return $d[0];
        };

        var $settingsButton = framework._.sfCommon.createButton('', true, {
            drawer: true,
            text: Messages.pad_settings_title,
            name: 'pad-settings',
            icon: 'fa-cog',
        }, function () {
            UI.alert(getSettings());
        });

        var $settings = UIElements.getEntryFromButton($settingsButton);
        framework._.toolbar.$drawer.append($settings);

    };

    var mkHelpMenu = function(framework) {
        var $toolbarContainer = $('.cke_toolbox_main');
        var helpMenu = framework._.sfCommon.createHelpMenu(['text', 'pad']);
        var $helpMenuButton = UIElements.getEntryFromButton(helpMenu.button);

        $toolbarContainer.before(helpMenu.menu);
        framework._.toolbar.$drawer.append($helpMenuButton);
    };

    var mkDiffOptions = function(cursor, readOnly) {
        return {
            preDiffApply: function(info) {
                /*
                    Don't accept attributes that begin with 'on'
                    these are probably listeners, and we don't want to
                    send scripts over the wire.
                */
                if (['addAttribute', 'modifyAttribute'].indexOf(info.diff.action) !== -1) {
                    if (info.diff.name === 'href') {
                        // console.log(info.diff);
                        //var href = info.diff.newValue;

                        // TODO normalize HTML entities
                        if (/javascript *: */.test(info.diff.newValue)) {
                            // TODO remove javascript: links
                        }
                    }

                    if (/^on/.test(info.diff.name)) {
                        console.log("Rejecting forbidden element attribute with name (%s)", info.diff.name);
                        return true;
                    }
                }

                // Other users cursor
                if (Cursors.preDiffApply(info)) {
                    return true;
                }

                if (info.node && info.node.tagName === 'DIV' &&
                    info.node.getAttribute('class') &&
                    /cp-link-clicked/.test(info.node.getAttribute('class'))) {
                    if (info.diff.action === 'removeElement') {
                        return true;
                    }
                }

                // MEDIATAG
                // Never modify widget ids
                if (info.node && info.node.tagName === 'SPAN' && info.diff.name === 'data-cke-widget-id') {
                    return true;
                }
                if (info.node && info.node.tagName === 'SPAN' &&
                    info.node.getAttribute('class') &&
                    /cke_widget_wrapper/.test(info.node.getAttribute('class'))) {
                    if (info.diff.action === 'modifyAttribute' && info.diff.name === 'class') {
                        return true;
                    }
                    //console.log(info);
                }
                // CkEditor drag&drop icon container
                if (info.node && info.node.tagName === 'SPAN' &&
                    info.node.getAttribute('class') &&
                    info.node.getAttribute('class').split(' ').indexOf('cke_widget_drag_handler_container') !== -1) {
                    return true;
                }
                // CkEditor drag&drop title (language fight)
                if (info.node && info.node.getAttribute &&
                    info.node.getAttribute('class') &&
                    (info.node.getAttribute('class').split(' ').indexOf('cke_widget_drag_handler') !== -1 ||
                        info.node.getAttribute('class').split(' ').indexOf('cke_image_resizer') !== -1)) {
                    return true;
                }
                // CkEditor temporary data (used when copy-paste large chunks for instance)
                if (info.node && (info.node.tagName === 'SPAN' || info.node.tagName === 'DIV') && info.diff.name === 'data-cke-temp') {
                    return true;
                }


                /*
                    Also reject any elements which would insert any one of
                    our forbidden tag types: script, iframe, object,
                        applet, video, or audio
                */
                if (['addElement', 'replaceElement'].indexOf(info.diff.action) !== -1) {
                    if (info.diff.element && forbiddenTags.indexOf(info.diff.element.nodeName) !== -1) {
                        console.log("Rejecting forbidden tag of type (%s)", info.diff.element.nodeName);
                        return true;
                    } else if (info.diff.newValue && forbiddenTags.indexOf(info.diff.newValue.nodeType) !== -1) {
                        console.log("Rejecting forbidden tag of type (%s)", info.diff.newValue.nodeName);
                        return true;
                    }
                }

                // Don't remote the "active" class of our comments
                if (info.node && info.node.tagName === 'COMMENT') {
                    if (info.diff.action === 'removeAttribute' && ['class'].indexOf(info.diff.name) !== -1) {
                        return true;
                    }
                }

                if (info.node && info.node.tagName === 'BODY') {
                    if (info.diff.action === 'removeAttribute' && ['class', 'spellcheck'].indexOf(info.diff.name) !== -1) {
                        return true;
                    }
                }

                /* DiffDOM will filter out magicline plugin elements
                    in practice this will make it impossible to use it
                    while someone else is typing, which could be annoying.

                    we should check when such an element is going to be
                    removed, and prevent that from happening. */
                if (info.node && info.node.tagName === 'SPAN' &&
                    info.node.getAttribute('contentEditable') === "false") {
                    // it seems to be a magicline plugin element...
                    // but it can also be a widget (MEDIATAG), in which case the removal was
                    // probably intentional

                    if (info.diff.action === 'removeElement') {
                        // and you're about to remove it...
                        if (!info.node.getAttribute('class') ||
                            !/cke_widget_wrapper/.test(info.node.getAttribute('class'))) {
                            // This element is not a widget!
                            // this probably isn't what you want
                            /*
                                I have never seen this in the console, but the
                                magic line is still getting removed on remote
                                edits. This suggests that it's getting removed
                                by something other than diffDom.
                            */
                            console.log("preventing removal of the magic line!");

                            // return true to prevent diff application
                            return true;
                        }
                    }
                }

                // Do not change the spellcheck value in view mode
                if (readOnly && info.node && info.node.tagName === 'BODY' &&
                    info.diff.action === 'modifyAttribute' && info.diff.name === 'spellcheck') {
                    return true;
                }
                // Do not change the contenteditable value in view mode
                if (readOnly && info.node && info.node.tagName === 'BODY' &&
                    info.diff.action === 'modifyAttribute' && info.diff.name === 'contenteditable') {
                    return true;
                }

                /*
                                cursor.update();

                                // no use trying to recover the cursor if it doesn't exist
                                if (!cursor.exists()) { return; }

                                /*  frame is either 0, 1, 2, or 3, depending on which
                                    cursor frames were affected: none, first, last, or both
                                */
                /*
                                var frame = info.frame = cursor.inNode(info.node);

                                if (!frame) { return; }

                                if (frame && typeof info.diff.oldValue === 'string' && typeof info.diff.newValue === 'string') {
                                    //var pushes = cursor.pushDelta(info.diff.oldValue, info.diff.newValue);
                                    var ops = ChainPad.Diff.diff(info.diff.oldValue, info.diff.newValue);

                                    if (frame & 1) {
                                        // push cursor start if necessary
                                        cursor.transformRange(cursor.Range.start, ops);
                                    }
                                    if (frame & 2) {
                                        // push cursor end if necessary
                                        cursor.transformRange(cursor.Range.end, ops);
                                    }
                                }
                */
            },
            /*
                        postDiffApply: function (info) {
                            if (info.frame) {
                                if (info.node) {
                                    if (info.frame & 1) { cursor.fixStart(info.node); }
                                    if (info.frame & 2) { cursor.fixEnd(info.node); }
                                } else { console.error("info.node did not exist"); }

                                var sel = cursor.makeSelection();
                                var range = cursor.makeRange();

                                cursor.fixSelection(sel, range);
                            }
                        }
            */
        };
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////

    var addToolbarHideBtn = function(framework, $bar) {
        // Expand / collapse the toolbar
        var cfg = {
            element: $bar
        };
        var onClick = function(visible) {
            framework._.sfCommon.setAttribute(['pad', 'showToolbar'], visible);
        };
        framework._.sfCommon.getAttribute(['pad', 'showToolbar'], function(err, data) {
            var state = false;
            if (($(window).height() >= 800 || $(window).width() >= 800) &&
                (typeof(data) === "undefined" || data)) {
                state = true;
                $('.cke_toolbox_main').show();
            } else {
                $('.cke_toolbox_main').hide();
            }
            var $collapse = framework._.sfCommon.createButton('toggle', true, cfg, onClick);
            framework._.toolbar.$bottomL.append($collapse);
            if (state) {
                $collapse.addClass('cp-toolbar-button-active');
            }
        });
    };

    var displayMediaTags = function(framework, dom, mediaTagMap) {
        setTimeout(function() { // Just in case
            var tags = dom.querySelectorAll('media-tag:empty');
            Array.prototype.slice.call(tags).forEach(function(el) {
                var mediaObject = MediaTag(el, {
                    body: dom
                });
                $(el).on('keydown', function(e) {
                    if ([8, 46].indexOf(e.which) !== -1) {
                        $(el).remove();
                        framework.localChange();
                    }
                });
                var observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.type === 'childList') {
                            var list_values = slice(el.children)
                                                .map(function (el) { return el.outerHTML; })
                                                .join('');
                            mediaTagMap[el.getAttribute('src')] = list_values;
                            if (mediaObject.complete) { observer.disconnect(); }
                        }
                    });
                });
                observer.observe(el, {
                    attributes: false,
                    subtree: true,
                    childList: true,
                    characterData: false
                });
            });
        });
    };

    var restoreMediaTags = function(tempDom, mediaTagMap) {
        var tags = tempDom.querySelectorAll('media-tag:empty');
        Array.prototype.slice.call(tags).forEach(function(tag) {
            var src = tag.getAttribute('src');
            if (mediaTagMap[src]) {
                tag.innerHTML = mediaTagMap[src];
                /*mediaTagMap[src].forEach(function(n) {
                    tag.appendChild(n.cloneNode(true));
                });*/
            }
        });
    };

    var mkPrintButton = function (framework, editor) {
        var $printButton = framework._.sfCommon.createButton('print', true);
        $printButton.click(function () {
            /*
            // NOTE: alternative print system in case we keep having more issues on Firefox
            var $iframe = $('html').find('iframe');
            var iframe = $iframe[0].contentWindow;
            iframe.print();
            */
            editor.execCommand('print');
            framework.feedback('PRINT_PAD');
            UI.clearTooltipsDelay();
        });
        var $print = UIElements.getEntryFromButton($printButton);
        framework._.toolbar.$drawer.append($print);
    };

    var andThen2 = function(editor, Ckeditor, framework) {
        var mediaTagMap = {};
        var $contentContainer = $('#cke_1_contents');
        var $html = $('html');
        var $faLink = $html.find('head link[href*="/components/components-font-awesome/css/font-awesome.min.css"]');
        if ($faLink.length) {
            $html.find('iframe').contents().find('head').append($faLink.clone());
        }

        var ml = editor._.magiclineBackdoor.that.line.$;
        [ml, ml.parentElement].forEach(function(el) {
            el.setAttribute('class', 'non-realtime');
        });

        window.editor = editor;

        var $iframe = $('html').find('iframe').contents();
        var ifrWindow = $html.find('iframe')[0].contentWindow;

        var customCss = '/customize/ckeditor-contents.css?' + window.CKEDITOR.CRYPTPAD_URLARGS;
        $iframe.find('head').append('<link href="' + customCss + '" type="text/css" rel="stylesheet" _fcktemp="true"/>');

        framework._.sfCommon.addShortcuts(ifrWindow);

        mkPrintButton(framework, editor, Ckeditor);

        var documentBody = ifrWindow.document.body;
        var inner = window.inner = documentBody;
        var $inner = $(inner);
        $inner.attr('contenteditable', 'false');

        var observer = new MutationObserver(function(muts) {
            muts.forEach(function(mut) {
                if (mut.type === 'childList') {
                    var $a;
                    for (var i = 0; i < mut.addedNodes.length; i++) {
                        $a = $(mut.addedNodes[i]);
                        if ($a.is('p') && $a.find('> span:empty').length &&
                            $a.find('> br').length && $a.children().length === 2) {
                            $a.find('> span').append($a.find('> br'));
                        }
                    }
                }
            });
        });
        observer.observe(documentBody, {
            childList: true
        });

        var metadataMgr = framework._.sfCommon.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        var common = framework._.sfCommon;
        var APP = window.APP;

        var comments = Comments.create({
            framework: framework,
            metadataMgr: metadataMgr,
            common: common,
            editor: editor,
            ifrWindow: ifrWindow,
            $iframe: $iframe,
            $inner: $inner,
            $contentContainer: $contentContainer,
            $container: $(APP.commentsEl),
            modal: APP.mobile && APP.comments,
            mobile: APP.mobile
        });

        var $resize = $('#cp-app-pad-resize');
        if (module.mobile) { $resize.hide(); }
        var $toc = $('#cp-app-pad-toc');
        $toc.show();

        // My cursor
        var cursor = module.cursor = Cursor(inner);

        // Display other users cursor
        var cursors = Cursors.create(inner, hjsonToDom, cursor);

        var openLink = function(e) {
            var el = e.currentTarget;
            if (!el || el.nodeName !== 'A') { return; }
            var href = el.getAttribute('href');
            if (/^#/.test(href)) {
                try {
                    $inner.find('.cke_anchor[data-cke-realelement]').each(function (j, el) {
                        var i = editor.restoreRealElement($(el));
                        var node = i.$;
                        if (node.id === href.slice(1)) {
                            el.scrollIntoView();
                        }
                    });
                } catch (err) {}
                return;
            }
            if (href) {
                framework._.sfCommon.openUnsafeURL(href);
            }
        };

        if (!privateData.isEmbed) {
            mkHelpMenu(framework);
        }

        /*
        framework._.sfCommon.getAttribute(['pad', 'width'], function(err, data) {
            var active = data || typeof(data) === "undefined";
            if (active) {
                $contentContainer.addClass('cke_body_width');
            } else {
                editor.execCommand('pagemode');
            }
        });
        */

        framework.onEditableChange(function(unlocked) {
            if (!framework.isReadOnly()) {
                $inner.attr('contenteditable', '' + Boolean(unlocked));
            }
            $inner.css({ background: unlocked ? '#fff' : '#eee' });
        });

        framework.setMediaTagEmbedder(function($mt) {
            $mt.attr('contenteditable', 'false');
            //$mt.attr('tabindex', '1');
            //MEDIATAG
            var element = new window.CKEDITOR.dom.element($mt[0]);
            editor.insertElement(element);
            editor.widgets.initOn(element, 'mediatag');
        });

        framework.setTitleRecommender(function() {
            var text;
            if (['h1', 'h2', 'h3'].some(function(t) {
                    var $header = $inner.find(t + ':first-of-type');
                    if ($header.length && $header.text()) {
                        text = $header.text();
                        return true;
                    }
                })) { return text; }
        });

        var DD = new DiffDom(mkDiffOptions(cursor, framework.isReadOnly()));

        var cursorStopped = false;
        var cursorTo;
        var updateCursor = function() {
            if (cursorTo) { clearTimeout(cursorTo); }

            // If we're receiving content
            if (cursorStopped) { return void setTimeout(updateCursor, 100); }

            cursorTo = setTimeout(function() {
                framework.updateCursor();
            }, 500); // 500ms to make sure it is sent after chainpad sync
        };

        var isAnchor = function (el) { return el.nodeName === 'A'; };
        var getAnchorName = function (el) {
            return el.getAttribute('id') ||
                el.getAttribute('data-cke-saved-name') ||
                el.getAttribute('name') ||
                Util.stripTags($(el).text());
        };

        var updatePageMode = function () {
            var md = Util.clone(metadataMgr.getMetadata());
            var store = window.cryptpadStore;
            var key = 'pad-small-width';

            var hideBtn = h('button.btn.btn-default.cp-pad-hide.fa.fa-compress');
            var showBtn = h('button.btn.btn-default.cp-pad-show.fa.fa-expand');

            var localHide;
            $(hideBtn).click(function () { // Expand
                $contentContainer.addClass('cke_body_width');
                $resize.addClass('hidden');
                localHide = true;
                if (store) { store.put(key, '1'); }
            });
            $(showBtn).click(function () {
                $contentContainer.removeClass('cke_body_width');
                $resize.removeClass('hidden');
                localHide = false;
                if (store) { store.put(key, '0'); }
            });

            var content = [
                hideBtn,
                showBtn,
            ];
            $resize.html('').append(content);

            // Hidden or visible? check pad settings first, then browser otherwise hide
            var hide = false;
            if (typeof(md.defaultWidth) === "undefined") {
                if (typeof(store.store[key]) === 'undefined') {
                    hide = true;
                } else {
                    hide = store.store[key] === '1';
                }
            } else {
                hide = md.defaultWidth === 0;
            }

            // If we've clicked on the show/hide buttons, always use our last value
            if (typeof(localHide) === "boolean") { hide = localHide; }

            if (window.APP.mobile) {
                hide = false;
            }

            $contentContainer.removeClass('cke_body_width');
            $resize.removeClass('hidden');
            if (hide) {
                $resize.addClass('hidden');
                $contentContainer.addClass('cke_body_width');
            }

        };
        updatePageMode();
        var updateTOC = Util.throttle(function () {
            var md = Util.clone(metadataMgr.getMetadata());

            var toc = [];
            $inner.find('h1, h2, h3, a[id][data-cke-saved-name]').each(function (i, el) {
                if (isAnchor(el)) {
                    return void toc.push({
                        level: 2,
                        el: el,
                        title: getAnchorName(el),
                    });
                }

                toc.push({
                    level: Number(el.tagName.slice(1)),
                    el: el,
                    title: Util.stripTags($(el).text())
                });
            });
            var hideBtn = h('button.btn.btn-default.cp-pad-hide.fa.fa-chevron-left');
            var showBtn = h('button.btn.btn-default.cp-pad-show', {
                title: Messages.pad_tocHide
            }, [
                h('i.fa.fa-list-ul')
            ]);
            var content = [
                hideBtn,
                showBtn,
                h('h2', Messages.markdown_toc)
            ];
            var store = window.cryptpadStore;
            var key = 'hide-pad-toc';

            // Hidden or visible? check pad settings first, then browser otherwise hide
            var hide = false;
            var localHide;
            if (typeof(md.defaultOutline) === "undefined") {
                if (typeof(store.store[key]) === 'undefined') {
                    hide = true;
                } else {
                    hide = store.store[key] === '1';
                }
            } else {
                hide = md.defaultOutline === 0;
            }
            // If we've clicked on the show/hide buttons, always use our last value
            if (typeof(localHide) === "boolean") { hide = localHide; }

            $toc.removeClass('hidden');
            if (hide) { $toc.addClass('hidden'); }

            $(hideBtn).click(function () {
                $toc.addClass('hidden');
                localHide = true;
                if (store) { store.put(key, '1'); }

                if (APP.tocScroll) {
                    APP.tocScroll();
                }
            });
            $(showBtn).click(function () {
                $toc.removeClass('hidden');
                localHide = false;
                if (store) { store.put(key, '0'); }
            });
            toc.forEach(function (obj) {
                var title = (obj.title || "").trim();
                if (!title) { return; }
                // Only include level 2 headings
                var level = obj.level;
                var a = h('a.cp-pad-toc-link', {
                    href: '#',
                });
                $(a).click(function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!obj.el || UIElements.isVisible(obj.el, $contentContainer)) { return; }
                    obj.el.scrollIntoView();
                    var $iframe = $('iframe').contents();
                    var onScroll = function () {
                        APP.tocScrollOff();
                    };
                    APP.tocScrollOff = function () {
                        delete APP.tocScroll;
                        delete APP.tocScrollOff;
                        $iframe.off('scroll', onScroll);
                    };
                    APP.tocScroll = function () {
                        obj.el.scrollIntoView();
                        APP.tocScrollOff();
                    };
                    //$(window).on('scroll', onScroll);
                    setTimeout(function () {
                        $iframe.on('scroll', onScroll);
                    });
                });
                a.innerHTML = title;
                content.push(h('p.cp-pad-toc-'+level, a));
            });
            $toc.html('').append(content);
        }, 400);

        // apply patches, and try not to lose the cursor in the process!
        framework.onContentUpdate(function(hjson) {
            if (!Array.isArray(hjson)) { throw new Error(Messages.typeError); }
            var userDocStateDom = hjsonToDom(hjson);
            cursorStopped = true;

            userDocStateDom.setAttribute("contenteditable",
                inner.getAttribute('contenteditable'));

            restoreMediaTags(userDocStateDom, mediaTagMap);

            cursors.removeCursors(inner);

            // Deal with adjasent text nodes
            userDocStateDom.normalize();
            inner.normalize();

            $(userDocStateDom).find('span[data-cke-display-name="media-tag"]:empty').each(function(i, el) {
                $(el).remove();
            });

            // Get cursor position
            cursor.offsetUpdate();
            var oldText = inner.outerHTML;

            // Get scroll position
            var sTop = $iframe.scrollTop();
            var sTopMax = $iframe.innerHeight() - $('iframe').innerHeight();
            var scrollMax = Math.abs(sTop - sTopMax) < 1 && sTop;

            // Apply the changes
            var patch = (DD).diff(inner, userDocStateDom);
            (DD).apply(inner, patch);

            editor.fire('cp-wc'); // Update word count

            // Restore cursor position
            var newText = inner.outerHTML;
            var ops = ChainPad.Diff.diff(oldText, newText);
            cursor.restoreOffset(ops);

            setTimeout(function() {
                cursorStopped = false;
                updateCursor();
            }, 200);

            // MEDIATAG: Migrate old mediatags to the widget system
            $inner.find('media-tag:not(.cke_widget_element)').each(function(i, el) {
                var element = new window.CKEDITOR.dom.element(el);
                editor.widgets.initOn(element, 'mediatag');
            });

            displayMediaTags(framework, inner, mediaTagMap);

            // MEDIATAG: Initialize mediatag widgets inserted in the document by other users
            try {
                editor.widgets.checkWidgets();
            } catch (e) {
                console.error(e);
            }

            if (framework.isReadOnly()) {
                var $links = $inner.find('a');
                // off so that we don't end up with multiple identical handlers
                $links.off('click', openLink).on('click', openLink);
            }

            comments.onContentUpdate();

            updateTOC();

            if (scrollMax) {
                $iframe.scrollTop($iframe.innerHeight());
            }

            if (APP.tocScrollOff) { APP.tocScrollOff(); }
        });

        framework.setTextContentGetter(function() {
            var innerCopy = inner.cloneNode(true);
            displayMediaTags(framework, innerCopy, mediaTagMap);
            innerCopy.normalize();
            $(innerCopy).find('*').each(function(i, el) {
                $(el).append(' ');
            });
            var str = $(innerCopy).text();
            str = str.replace(/\s\s+/g, ' ');
            return str;
        });
        framework.setContentGetter(function() {
            if (APP.tocScrollOff) { APP.tocScrollOff(); }

            $inner.find('span[data-cke-display-name="media-tag"]:empty').each(function(i, el) {
                $(el).remove();
            });

            // We have to remove the cursors before getting the content because they split
            // the text nodes and OT/ChainPad would freak out
            cursors.removeCursors(inner);

            comments.onContentUpdate();

            displayMediaTags(framework, inner, mediaTagMap);
            inner.normalize();
            var hjson = Hyperjson.fromDOM(inner, shouldSerialize, hjsonFilters);

            return hjson;
        });

        if (!framework.isReadOnly()) {
            addToolbarHideBtn(framework, $('.cke_toolbox_main'));
        } else {
            $('.cke_toolbox_main').hide();
        }

        framework.onReady(function(newPad) {
            editor.focus();

            if (!module.isMaximized) {
                module.isMaximized = true;
                $('iframe.cke_wysiwyg_frame').css('width', '');
                $('iframe.cke_wysiwyg_frame').css('height', '');
            }
            $('body').addClass('app-pad');

            if (newPad) {
                cursor.setToEnd();
            } else if (framework.isReadOnly()) {
                cursor.setToStart();
            }

            if (framework.isReadOnly()) {
                $inner.attr('contenteditable', 'false');
            }

            common.getPadMetadata(null, function (md) {
                if (md && md.error) { return; }
                if (!common.isOwned(md.owners)) { return; }
                mkSettingsMenu(framework);
            });

            var fmConfig = {
                ckeditor: editor,
                dropArea: $inner,
                body: $('body'),
                onUploaded: function(ev, data) {
                    var parsed = Hash.parsePadUrl(data.url);
                    var secret = Hash.getSecrets('file', parsed.hash, data.password);
                    var fileHost = privateData.fileHost || privateData.origin;
                    var src = fileHost + Hash.getBlobPathFromHex(secret.channel);
                    var key = Hash.encodeBase64(secret.keys.cryptKey);
                    var mt = '<media-tag contenteditable="false" src="' + src + '" data-crypto-key="cryptpad:' + key + '"></media-tag>';
                    // MEDIATAG
                    var element = window.CKEDITOR.dom.element.createFromHtml(mt);
                    if (ev && ev.insertElement) {
                        ev.insertElement(element);
                    } else {
                        editor.insertElement(element);
                    }
                    editor.widgets.initOn(element, 'mediatag');
                }
            };
            var FM = window.APP.FM = framework._.sfCommon.createFileManager(fmConfig);

            editor.on('paste', function (ev) {
                try {
                    var files = ev.data.dataTransfer._.files;
                    files.forEach(function (f) {
                        FM.handleFile(f);
                    });
                    // If the paste data contains files, don't use the ckeditor default handlers
                    // ==> they would try to include either a remote image URL or a base64 image
                    if (files.length) {
                        ev.cancel();
                        ev.preventDefault();
                    }
                } catch (e) {
                    console.error(e);
                }
            });

            framework._.sfCommon.getAttribute(['pad', 'spellcheck'], function(err, data) {
                if (framework.isReadOnly()) { return; }
                if (data) {
                    $iframe.find('body').attr('spellcheck', true);
                }
            });

            framework._.sfCommon.isPadStored(function(err, val) {
                if (!val) { return; }
                var b64images = $inner.find('img[src^="data:image"]:not(.cke_reset), img[src^="data:application/octet-stream"]:not(.cke_reset)');
                if (b64images.length && framework._.sfCommon.isLoggedIn()) {
                    var no = h('button.cp-corner-cancel', Messages.cancel);
                    var yes = h('button.cp-corner-primary', Messages.ok);
                    var actions = h('div', [no, yes]);
                    var modal = UI.cornerPopup(Messages.pad_base64, actions, '', { big: true });
                    $(no).click(function() {
                        modal.delete();
                    });
                    $(yes).click(function() {
                        modal.delete();
                        b64images.each(function(i, el) {
                            var src = $(el).attr('src');
                            var blob = Util.dataURIToBlob(src);
                            var ext = '.' + (blob.type.split('/')[1] || 'png');
                            var name = (framework._.title.getTitle() || 'Pad') + '_image';
                            blob.name = name + ext;
                            var ev = {
                                insertElement: function(newEl) {
                                    var element = new window.CKEDITOR.dom.element(el);
                                    newEl.replace(element);
                                    setTimeout(framework.localChange);
                                }
                            };
                            window.APP.FM.handleFile(blob, ev);
                        });
                    });
                }
            });

            updateTOC();
            updatePageMode();
            comments.ready();

            /*setTimeout(function () {
                $('iframe.cke_wysiwyg_frame').focus();
                editor.focus();
                console.log(editor);
                console.log(editor.focusManager);
                $(window).trigger('resize');
            });*/
        });

        framework.onDefaultContentNeeded(function() {
            inner.innerHTML = '<p></p>';
        });

        var importMediaTags = function(dom, cb) {
            var $dom = $(dom);
            $dom.find('media-tag').each(function(i, el) {
                $(el).empty();
            });
            cb($dom[0]);
        };
        framework.setFileImporter({ accept: ['.md', 'text/html'] }, function(content, f, cb) {
            if (!f) { return; }
            if (/\.md$/.test(f.name)) {
                var mdDom = Exporter.importMd(content, framework._.sfCommon);
                return importMediaTags(mdDom, function(dom) {
                    cb(Hyperjson.fromDOM(dom));
                });
            }
            importMediaTags(domFromHTML(content).body, function(dom) {
                cb(Hyperjson.fromDOM(dom));
            });
        }, true);

        framework.setFileExporter(Exporter.exts, function(cb, ext) {
            Exporter.main(inner, cb, ext);
        }, true);

        framework.setNormalizer(function(hjson) {
            return [
                'BODY',
                {
                    "class": "cke_editable cke_editable_themed cke_contents_ltr cke_show_borders",
                    "contenteditable": "true",
                    "spellcheck": "false"
                },
                hjson[2]
            ];
        });

        /* Display the cursor of other users and send our cursor */
        framework.setCursorGetter(cursors.cursorGetter);
        framework.onCursorUpdate(cursors.onCursorUpdate);
        inner.addEventListener('click', updateCursor);
        inner.addEventListener('keyup', updateCursor);


        /* hitting enter makes a new line, but places the cursor inside
            of the <br> instead of the <p>. This makes it such that you
            cannot type until you click, which is rather unnacceptable.
            If the cursor is ever inside such a <br>, you probably want
            to push it out to the parent element, which ought to be a
            paragraph tag. This needs to be done on keydown, otherwise
            the first such keypress will not be inserted into the P. */
        inner.addEventListener('keydown', cursor.brFix);

        /*
            CkEditor emits a change event when it detects new content in the editable area.
            Our problem is that this event is sent asynchronously and late after a keystroke.
            The result is that between the keystroke and the change event, chainpad may
            receive remote changes and so it can wipe the newly inserted content (because
            chainpad work synchronously), and the merged text is missing a few characters.
            To fix this, we have to call `framework.localChange` sooner. We can't listen for
            the "keypress" event because it is trigger before the character is inserted.
            The solution is the "input" event, triggered by the browser as soon as the
            character is inserted.
        */
        inner.addEventListener('input', function() {
            framework.localChange();
            updateCursor();
            editor.fire('cp-wc'); // Update word count
            updateTOC();
        });
        editor.on('change', function () {
            framework.localChange();
            updateTOC();
        });

        var wordCount = h('span.cp-app-pad-wordCount');
        $('.cke_toolbox_main').append(wordCount);
        editor.on('cp-wc-update', function() {
            if (!editor.wordCount || typeof(editor.wordCount.wordCount) === "undefined") {
                wordCount.innerText = '';
                return;
            }
            wordCount.innerText = Messages._getKey('pad_wordCount', [editor.wordCount.wordCount]);
        });

        // export the typing tests to the window.
        // call like `test = easyTest()`
        // terminate the test like `test.cancel()`
        /*
        window.easyTest = function() {
            cursor.update();
            //var start = cursor.Range.start;
            //var test = TypingTest.testInput(inner, start.el, start.offset, framework.localChange);
            var test = TypingTest.testPad(editor, framework.localChange);
            framework.localChange();
            return test;
        };
        */


        // Fix the scrollbar if it's reset when clicking on a button (firefox only?)
        var buttonScrollTop;
        $('.cke_toolbox_main').find('.cke_button, .cke_combo_button').mousedown(function() {
            buttonScrollTop = $('iframe').contents().scrollTop();
            setTimeout(function() {
                $('iframe').contents().scrollTop(buttonScrollTop);
            });
        });


        $('.cke_toolbox_main').find('.cke_button').click(function() {
            var e = this;
            var classString = e.getAttribute('class');
            var classes = classString.split(' ').filter(function(c) {
                return /cke_button__/.test(c);
            });

            var id = classes[0];
            if (typeof(id) === 'string') {
                framework.feedback(id.toUpperCase());
            }
        });

        framework.start();
    };

    var main = function() {
        var Ckeditor;
        var editor;
        var framework;

        nThen(function(waitFor) {
            Framework.create({
                toolbarContainer: '#cp-app-pad-toolbar',
                contentContainer: '#cp-app-pad-editor',
                patchTransformer: ChainPad.NaiveJSONTransformer,
                /*thumbnail: {
                    getContainer: function () { return $('iframe').contents().find('html')[0]; },
                    filter: function (el, before) {
                        if (before) {
                            module.cursor.update();
                            $(el).parents().css('overflow', 'visible');
                            $(el).css('max-width', '1200px');
                            $(el).css('max-height', Math.max(600, $(el).width()) + 'px');
                            $(el).css('overflow', 'hidden');
                            $(el).find('body').css('background-color', 'transparent');
                            return;
                        }
                        $(el).parents().css('overflow', '');
                        $(el).css('max-width', '');
                        $(el).css('max-height', '');
                        $(el).css('overflow', '');
                        $(el).find('body').css('background-color', '#fff');
                        var sel = module.cursor.makeSelection();
                        var range = module.cursor.makeRange();
                        module.cursor.fixSelection(sel, range);
                    }
                }*/
            }, waitFor(function(fw) { window.APP.framework = framework = fw; }));

            nThen(function(waitFor) {
                ckEditorAvailable(waitFor(function(ck) {
                    Ckeditor = ck;
                    require(['/pad/wysiwygarea-plugin.js'], waitFor());
                }));
                $(waitFor());
            }).nThen(function(waitFor) {
                // TODO this breaks users' ability to tab out of the editor
                // but that's a problem in other editors and nobody has complained so far
                // so we'll include this as-is for now while we search for a good pattern
                // addresses this issue more generally
                Ckeditor.config.tabSpaces = 4;
                Ckeditor.config.toolbarCanCollapse = true;
                Ckeditor.config.language = Messages._getLanguage();
                if (screen.height < 800) {
                    Ckeditor.config.toolbarStartupExpanded = false;
                    $('meta[name=viewport]').attr('content',
                        'width=device-width, initial-scale=1.0, user-scalable=no');
                } else {
                    $('meta[name=viewport]').attr('content',
                        'width=device-width, initial-scale=1.0, user-scalable=yes');
                }
                // Used in ckeditor-config.js
                Ckeditor.CRYPTPAD_URLARGS = ApiConfig.requireConf.urlArgs;
                Ckeditor._mediatagTranslations = {
                    title: Messages.pad_mediatagTitle,
                    width: Messages.pad_mediatagWidth,
                    height: Messages.pad_mediatagHeight,
                    ratio: Messages.pad_mediatagRatio,
                    border: Messages.pad_mediatagBorder,
                    preview: Messages.pad_mediatagPreview,
                    'import': Messages.pad_mediatagImport,
                    download: Messages.download_mt_button,
                    share: Messages.pad_mediatagShare,
                    open: Messages.pad_mediatagOpen,
                    options: Messages.pad_mediatagOptions
                };
                Ckeditor._commentsTranslations = {
                    comment: Messages.comments_comment,
                };
                Ckeditor.plugins.addExternal('mediatag', '/pad/', 'mediatag-plugin.js');
                Ckeditor.plugins.addExternal('blockbase64', '/pad/', 'disable-base64.js');
                Ckeditor.plugins.addExternal('comments', '/pad/', 'comment.js');
                Ckeditor.plugins.addExternal('wordcount', '/pad/wordcount/', 'plugin.js');

/*  CKEditor4 is, by default, incompatible with strong CSP settings due to the
    way it loads a variety of resources and event handlers by injecting HTML
    via the innerHTML API.

    In most cases those handlers just call a function with an id, so there's no
    strong case for why it should be done this way except that lots of code depends
    on this behaviour. These handlers all stop working when we enable our default CSP,
    but fortunately the code is simple enough that we can use regex to grab the id
    from the inline code and call the relevant function directly, preserving the
    intended behaviour while preventing malicious code injection.

    Unfortunately, as long as the original code is still present the console
    fills up with CSP warnings saying that inline scripts were blocked.
    The code below overrides CKEditor's default `setHtml` method to include
    a string.replace call which will rewrite various inline event handlers from
    onevent to oonevent.. rendering them invalid as scripts and preventing
    some needless noise from showing up in the console.

    YAY!
*/
                Ckeditor.dom.element.prototype.setHtml = function(a){
                    if (/callFunction/.test(a)) {
                        a = a.replace(/[^o]on(mousedown|blur|keydown|focus|click|dragstart|mouseover|mouseout)/g, function (value) {
                            return value.slice(0,1) + 'o' + value.slice(1);
                        });
                    }
                    this.$.innerHTML = a;
                    return a;
                };

                module.ckeditor = editor = Ckeditor.replace('editor1', {
                    customConfig: '/customize/ckeditor-config.js',
                });

                editor.on('instanceReady', waitFor());
            }).nThen(function() {
                var _getPath = Ckeditor.plugins.getPath;
                Ckeditor.plugins.getPath = function (name) {
                    if (name === 'preview') {
                        return window.location.origin + "/components/ckeditor/plugins/preview/";
                    }
                    return _getPath(name);
                };
                window.__defineGetter__('_cke_htmlToLoad', function() {});
                editor.plugins.mediatag.import = function($mt) {
                    framework._.sfCommon.importMediaTag($mt);
                };
                editor.plugins.mediatag.download = function($mt) {
                    var media = Util.find($mt, [0, '_mediaObject']);
                    if (!media) { return void console.error('no media'); }
                    if (!media.complete) { return void UI.warn(Messages.mediatag_notReady); }
                    if (!(media && media._blob)) { return void console.error($mt); }
                    window.saveAs(media._blob.content, media.name);
                };
                editor.plugins.mediatag.open = function($mt) {
                    var hash = framework._.sfCommon.getHashFromMediaTag($mt);
                    framework._.sfCommon.openURL(Hash.hashToHref(hash, 'file'));
                };
                editor.plugins.mediatag.share = function($mt) {
                    var data = {
                        file: true,
                        pathname: '/file/',
                        hashes: {
                            fileHash: framework._.sfCommon.getHashFromMediaTag($mt)
                        },
                        title: Util.find($mt[0], ['_mediaObject', 'name']) || ''
                    };
                    framework._.sfCommon.getSframeChannel().event('EV_SHARE_OPEN', data);
                };

                var CKEDITOR = window.CKEDITOR;

                // remove selected formatting with ctrl-space
                editor.addCommand('deformat', {
                    exec: function (edt) {
                        edt.execCommand( 'removeFormat', editor.selection );
                    },
                });
                editor.setKeystroke(CKEDITOR.CTRL + 32, 'deformat');

                // Add keybindings for CTRL+ALT+n to set headings 1-6 on selected text
                var styleKeys = {
                    h1: 49, // 1
                    h2: 50, // 2
                    h3: 51, // 3
                    h4: 52, // 4
                    h5: 53, // 5
                    h6: 54, // 6
                    // 7 unassigned
                    div: 56,// 8
                    pre: 57, // 9
                    p: 48, // 0
                };
                Object.keys(styleKeys).forEach(function (tag) {
                    editor.addCommand(tag, new CKEDITOR.styleCommand(new CKEDITOR.style({ element: tag })));
                    editor.setKeystroke( CKEDITOR.CTRL + CKEDITOR.ALT + styleKeys[tag], tag);
                });
            }).nThen(function() {
                // Move ckeditor parts to have a structure like the other apps
                var $contentContainer = $('#cke_1_contents');
                var $mainContainer = $('#cke_editor1 > .cke_inner');
                var $ckeToolbar = $('#cke_1_top').find('.cke_toolbox_main');
                $mainContainer.prepend($ckeToolbar.addClass('cke_reset_all'));
                $contentContainer.append(h('div#cp-app-pad-resize'));

                var comments = h('div#cp-app-pad-comments');
                var APP = window.APP;

                APP.commentsEl = comments;
                if (APP.mobile) {
                    APP.comments = UI.dialog.customModal(comments, {
                        buttons: [{
                            name: Messages.filePicker_close,
                            onClick: function () {}
                        }]
                    });
                    $(APP.comments).addClass('cp-app-pad-comments-modal');
                } else {
                    $contentContainer.append(comments);
                }
                $contentContainer.prepend(h('div#cp-app-pad-toc'));
                $ckeToolbar.find('.cke_button__image_icon').parent().hide();

                var $iframe = $('iframe').contents();
                /*if (window.CryptPad_theme === 'dark') {
                    $iframe.find('html').addClass('cp-dark').css({
                        'background-color': '#323232', // grey_850
                        'color': '#EEEEEE' // dark text_col
                    });
                } else {
                    $iframe.find('html').css({
                        'background-color': '#FFF'
                    });
                }*/
                $iframe.find('html').css({
                    'background-color': '#FFF'
                });
            }).nThen(waitFor());

        }).nThen(function(waitFor) {
            var privateData = framework._.cpNfInner.metadataMgr.getPrivateData();
            var openLinkSetting = Util.find(privateData, ['settings', 'pad', 'openLink']);
            Links.init(Ckeditor, editor, openLinkSetting);
            require(['/pad/csp.js'], waitFor());
        }).nThen(function( /*waitFor*/ ) {
            /*

            function launchAnchorTest(test) {
                // -------- anchor test: make sure the exported anchor contains <a name="...">  -------
                console.log('---- anchor test: make sure the exported anchor contains <a name="...">  -----.');

                function tryAndTestExport() {
                    console.log("Starting tryAndTestExport.");
                    editor.on('dialogShow', function(evt) {
                        console.log("Anchor dialog detected.");
                        var dialog = evt.data;
                        $(dialog.parts.contents.$).find("input").val('xx-' + Math.round(Math.random() * 1000));
                        dialog.click(window.CKEDITOR.dialog.okButton(editor).id);
                    });
                    var existingText = editor.getData();
                    editor.insertText("A bit of text");
                    console.log("Launching anchor command.");
                    editor.execCommand(editor.ui.get('Anchor').command);
                    console.log("Anchor command launched.");

                    var waitH = window.setInterval(function() {
                        console.log("Waited 2s for the dialog to appear");
                        var anchors = window.CKEDITOR.plugins["link"].getEditorAnchors(editor);
                        if (!anchors || anchors.length === 0) {
                            test.fail("No anchors found. Please adjust document");
                        } else {
                            console.log(anchors.length + " anchors found.");
                            var exported = Exporter.getHTML(window.inner);
                            console.log("Obtained exported: " + exported);
                            var allFound = true;
                            for (var i = 0; i < anchors.length; i++) {
                                var anchor = anchors[i];
                                console.log("Anchor " + anchor.name);
                                var expected = "<a id=\"" + anchor.id + "\" name=\"" + anchor.name + "\" ";
                                var found = exported.indexOf(expected) >= 0;
                                console.log("Found " + expected + " " + found + ".");
                                allFound = allFound && found;
                            }

                            console.log("Cleaning up.");
                            if (allFound) {
                                // clean-up
                                editor.execCommand('undo');
                                editor.execCommand('undo');
                                var nint = window.setInterval(function() {
                                    console.log("Waiting for undo to yield same result.");
                                    if (existingText === editor.getData()) {
                                        window.clearInterval(nint);
                                        test.pass();
                                    }
                                }, 500);
                            } else {
                                test.fail("Not all expected a elements found for document at " + window.top.location + ".");
                            }
                        }
                        window.clearInterval(waitH);
                    }, 2000);


                }
                var intervalHandle = window.setInterval(function() {
                    if (editor.status === "ready") {
                        window.clearInterval(intervalHandle);
                        console.log("Editor is ready.");
                        tryAndTestExport();
                    } else {
                        console.log("Waiting for editor to be ready.");
                    }
                }, 100);
            }
            /*
            Test(function(test) {

                launchAnchorTest(test);
            });*/
            andThen2(editor, Ckeditor, framework);
        });
    };
    main();
});
