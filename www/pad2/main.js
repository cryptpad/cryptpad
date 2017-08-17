console.log('one');
define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/hyperjson/hyperjson.js',
    '/common/toolbar3.js',
    '/common/cursor.js',
    '/bower_components/chainpad-json-validator/json-ot.js',
    '/common/TypingTests.js',
    'json.sortify',
    '/bower_components/textpatcher/TextPatcher.js',
    '/common/cryptpad-common.js',
    '/common/cryptget.js',
    '/pad/links.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',

    '/bower_components/file-saver/FileSaver.min.js',
    '/bower_components/diff-dom/diffDOM.js',

    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less/cryptpad.less',
    'less!/customize/src/less/toolbar.less'
], function ($, Crypto, Hyperjson,
    Toolbar, Cursor, JsonOT, TypingTest, JSONSortify, TextPatcher, Cryptpad, Cryptget, Links, nThen, SFCommon) {
    var saveAs = window.saveAs;
    var Messages = Cryptpad.Messages;
    var DiffDom = window.diffDOM;

    var stringify = function (obj) { return JSONSortify(obj); };

    window.Toolbar = Toolbar;
    window.Hyperjson = Hyperjson;

    var slice = function (coll) {
        return Array.prototype.slice.call(coll);
    };

    var removeListeners = function (root) {
        slice(root.attributes).map(function (attr) {
            if (/^on/.test(attr.name)) {
                root.attributes.removeNamedItem(attr.name);
            }
        });
        slice(root.children).forEach(removeListeners);
    };

    var hjsonToDom = function (H) {
        var dom = Hyperjson.toDOM(H);
        removeListeners(dom);
        return dom;
    };

    var module = window.REALTIME_MODULE = window.APP = {
        Hyperjson: Hyperjson,
        TextPatcher: TextPatcher,
        logFights: true,
        fights: [],
        Cryptpad: Cryptpad,
        Cursor: Cursor,
    };

    var emitResize = module.emitResize = function () {
        var evt = window.document.createEvent('UIEvents');
        evt.initUIEvent('resize', true, false, window, 0);
        window.dispatchEvent(evt);
    };

    var toolbar;

    var isNotMagicLine = function (el) {
        return !(el && typeof(el.getAttribute) === 'function' &&
            el.getAttribute('class') &&
            el.getAttribute('class').split(' ').indexOf('non-realtime') !== -1);
    };

    /* catch `type="_moz"` before it goes over the wire */
    var brFilter = function (hj) {
        if (hj[1].type === '_moz') { hj[1].type = undefined; }
        return hj;
    };

    var onConnectError = function () {
        Cryptpad.errorLoadingScreen(Messages.websocketError);
    };

    var domFromHTML = function (html) {
        return new DOMParser().parseFromString(html, 'text/html');
    };

    var forbiddenTags = [
        'SCRIPT',
        'IFRAME',
        'OBJECT',
        'APPLET',
        'VIDEO',
        'AUDIO'
    ];

    var openLink = function (e) {
        var el = e.currentTarget;
        if (!el || el.nodeName !== 'A') { return; }
        var href = el.getAttribute('href');
        if (href) { window.open(href, '_blank'); }
    };

    var getHTML = function (inner) {
        return ('<!DOCTYPE html>\n' + '<html>\n' + inner.innerHTML);
    };

    var CKEDITOR_CHECK_INTERVAL = 100;
    var ckEditorAvailable = function (cb) {
        var intr;
        var check = function () {
            if (window.CKEDITOR) {
                clearTimeout(intr);
                cb(window.CKEDITOR);
            }
        };
        intr = setInterval(function () {
            console.log("Ckeditor was not defined. Trying again in %sms", CKEDITOR_CHECK_INTERVAL);
            check();
        }, CKEDITOR_CHECK_INTERVAL);
        check();
    };

    var mkDiffOptions = function (cursor, readOnly) {
        return {
            preDiffApply: function (info) {
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

                if (info.node && info.node.tagName === 'BODY') {
                    if (info.diff.action === 'removeAttribute' &&
                        ['class', 'spellcheck'].indexOf(info.diff.name) !== -1) {
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
                    if (info.diff.action === 'removeElement') {
                        // and you're about to remove it...
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

                // Do not change the contenteditable value in view mode
                if (readOnly && info.node && info.node.tagName === 'BODY' &&
                    info.diff.action === 'modifyAttribute' && info.diff.name === 'contenteditable') {
                    return true;
                }

                // no use trying to recover the cursor if it doesn't exist
                if (!cursor.exists()) { return; }

                /*  frame is either 0, 1, 2, or 3, depending on which
                    cursor frames were affected: none, first, last, or both
                */
                var frame = info.frame = cursor.inNode(info.node);

                if (!frame) { return; }

                if (typeof info.diff.oldValue === 'string' && typeof info.diff.newValue === 'string') {
                    var pushes = cursor.pushDelta(info.diff.oldValue, info.diff.newValue);

                    if (frame & 1) {
                        // push cursor start if necessary
                        if (pushes.commonStart < cursor.Range.start.offset) {
                            cursor.Range.start.offset += pushes.delta;
                        }
                    }
                    if (frame & 2) {
                        // push cursor end if necessary
                        if (pushes.commonStart < cursor.Range.end.offset) {
                            cursor.Range.end.offset += pushes.delta;
                        }
                    }
                }
            },
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
        };
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////

    var andThen = function (editor, Ckeditor, common) {
        //var $iframe = $('#pad-iframe').contents();
        //var secret = Cryptpad.getSecrets();
        //var readOnly = secret.keys && !secret.keys.editKeyStr;
        //if (!secret.keys) {
        //    secret.keys = secret.key;
        //}
        var readOnly = false; // TODO
        var cpNfInner;


        var $bar = $('#cke_1_toolbox');

        var $html = $bar.closest('html');
        var $faLink = $html.find('head link[href*="/bower_components/components-font-awesome/css/font-awesome.min.css"]');
        if ($faLink.length) {
            $html.find('iframe').contents().find('head').append($faLink.clone());
        }
        var isHistoryMode = false;

        if (readOnly) {
            $('#cke_1_toolbox > .cke_toolbox_main').hide();
        }

        /* add a class to the magicline plugin so we can pick it out more easily */

        var ml = Ckeditor.instances.editor1.plugins.magicline.backdoor.that.line.$;
        [ml, ml.parentElement].forEach(function (el) {
            el.setAttribute('class', 'non-realtime');
        });

        var documentBody = $html.find('iframe')[0].contentWindow.document.body;

        var inner = window.inner = documentBody;

        var cursor = module.cursor = Cursor(inner);

        var setEditable = module.setEditable = function (bool) {
            if (bool) {
                $(inner).css({
                    color: '#333',
                });
            }
            if (!readOnly || !bool) {
                inner.setAttribute('contenteditable', bool);
            }
        };

        // don't let the user edit until the pad is ready
        setEditable(false);

        var initializing = true;

        var Title;
        //var UserList;
        //var Metadata;

        var getHeadingText = function () {
            var text;
            if (['h1', 'h2', 'h3'].some(function (t) {
                var $header = $(inner).find(t + ':first-of-type');
                if ($header.length && $header.text()) {
                    text = $header.text();
                    return true;
                }
            })) { return text; }
        };

        var DD = new DiffDom(mkDiffOptions(cursor, readOnly));

        // apply patches, and try not to lose the cursor in the process!
        var applyHjson = function (shjson) {
            var userDocStateDom = hjsonToDom(JSON.parse(shjson));

            if (!readOnly && !initializing) {
                userDocStateDom.setAttribute("contenteditable", "true"); // lol wtf
            }
            var patch = (DD).diff(inner, userDocStateDom);
            (DD).apply(inner, patch);
            if (readOnly) {
                var $links = $(inner).find('a');
                // off so that we don't end up with multiple identical handlers
                $links.off('click', openLink).on('click', openLink);
            }
        };

        var stringifyDOM = module.stringifyDOM = function (dom) {
            var hjson = Hyperjson.fromDOM(dom, isNotMagicLine, brFilter);
            hjson[3] = {
                metadata: cpNfInner.metadataMgr.getMetadataLazy()
            };
            /*hjson[3] = { TODO
                    users: UserList.userData,
                    defaultTitle: Title.defaultTitle,
                    type: 'pad'
                }
            };*/
            if (!initializing) {
                hjson[3].metadata.title = Title.title;
            } else if (Cryptpad.initialName && !hjson[3].metadata.title) {
                hjson[3].metadata.title = Cryptpad.initialName;
            }
            return stringify(hjson);
        };

        var realtimeOptions = {
            readOnly: readOnly,
            // really basic operational transform
            transformFunction : JsonOT.validate,
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

        var setHistory = function (bool, update) {
            isHistoryMode = bool;
            setEditable(!bool);
            if (!bool && update) {
                realtimeOptions.onRemote();
            }
        };

        realtimeOptions.onRemote = function () {
            if (initializing) { return; }
            if (isHistoryMode) { return; }

            var oldShjson = stringifyDOM(inner);

            var shjson = module.realtime.getUserDoc();

            // remember where the cursor is
            cursor.update();

            // Update the user list (metadata) from the hyperjson
            // TODO Metadata.update(shjson);

            var newInner = JSON.parse(shjson);
            var newSInner;
            if (newInner.length > 2) {
                newSInner = stringify(newInner[2]);
            }

            if (newInner[3]) {
                cpNfInner.metadataMgr.updateMetadata(newInner[3].metadata);
            }

            // build a dom from HJSON, diff, and patch the editor
            applyHjson(shjson);

            if (!readOnly) {
                var shjson2 = stringifyDOM(inner);

                // TODO
                //shjson = JSON.stringify(JSON.parse(shjson).slice(0,3));

                if (shjson2 !== shjson) {
                    console.error("shjson2 !== shjson");
                    module.patchText(shjson2);

                    /*  pushing back over the wire is necessary, but it can
                        result in a feedback loop, which we call a browser
                        fight */
                    if (module.logFights) {
                        // what changed?
                        var op = TextPatcher.diff(shjson, shjson2);
                        // log the changes
                        TextPatcher.log(shjson, op);
                        var sop = JSON.stringify(TextPatcher.format(shjson, op));

                        var index = module.fights.indexOf(sop);
                        if (index === -1) {
                            module.fights.push(sop);
                            console.log("Found a new type of browser disagreement");
                            console.log("You can inspect the list in your " +
                                "console at `REALTIME_MODULE.fights`");
                            console.log(module.fights);
                        } else {
                            console.log("Encountered a known browser disagreement: " +
                                "available at `REALTIME_MODULE.fights[%s]`", index);
                        }
                    }
                }
            }

            // Notify only when the content has changed, not when someone has joined/left
            var oldSInner = stringify(JSON.parse(oldShjson)[2]);
            if (newSInner && newSInner !== oldSInner) {
                Cryptpad.notify();
            }
        };

        var exportFile = function () {
            var html = getHTML(inner);
            var suggestion = Title.suggestTitle('cryptpad-document');
            Cryptpad.prompt(Messages.exportPrompt,
                Cryptpad.fixFileName(suggestion) + '.html', function (filename) {
                if (!(typeof(filename) === 'string' && filename)) { return; }
                var blob = new Blob([html], {type: "text/html;charset=utf-8"});
                saveAs(blob, filename);
            });
        };
        var importFile = function (content) {
            var shjson = stringify(Hyperjson.fromDOM(domFromHTML(content).body));
            applyHjson(shjson);
            realtimeOptions.onLocal();
        };

        realtimeOptions.onInit = function (info) {
            console.log('onInit');
            var titleCfg = { getHeadingText: getHeadingText };
            Title = common.createTitle(titleCfg, realtimeOptions.onLocal, common, cpNfInner.metadataMgr);
            var configTb = {
                displayed: ['userlist', 'title'],
                title: Title.getTitleConfig(),
                userList: cpNfInner.metadataMgr,
                readOnly: readOnly,
                ifrw: window,
                realtime: info.realtime,
                common: Cryptpad,
                sfCommon: common,
                $container: $bar,
                $contentContainer: $('#cke_1_contents'),
            };
            toolbar = info.realtime.toolbar = Toolbar.create(configTb);
            Title.setToolbar(toolbar);

            var $rightside = toolbar.$rightside;

            $bar.find('#cke_1_toolbar_collapser').hide();
            if (!readOnly) {
                // Expand / collapse the toolbar
                var $collapse = Cryptpad.createButton(null, true);
                $collapse.removeClass('fa-question');
                var updateIcon = function () {
                    $collapse.removeClass('fa-caret-down').removeClass('fa-caret-up');
                    var isCollapsed = !$bar.find('.cke_toolbox_main').is(':visible');
                    if (isCollapsed) {
                        if (!initializing) { Cryptpad.feedback('HIDETOOLBAR_PAD'); }
                        $collapse.addClass('fa-caret-down');
                    }
                    else {
                        if (!initializing) { Cryptpad.feedback('SHOWTOOLBAR_PAD'); }
                        $collapse.addClass('fa-caret-up');
                    }
                };
                updateIcon();
                $collapse.click(function () {
                    $(window).trigger('resize');
                    $('.cke_toolbox_main').toggle();
                    $(window).trigger('cryptpad-ck-toolbar');
                    updateIcon();
                });
                $rightside.append($collapse);
            }

            // TODO

            return;

            // TODO UserList not needed anymore?
            // --> selectTemplate
            // --> select username on first visit
            //UserList = Cryptpad.createUserList(info, realtimeOptions.onLocal, Cryptget, Cryptpad);

            //var titleCfg = { getHeadingText: getHeadingText };
            //Title = Cryptpad.createTitle(titleCfg, realtimeOptions.onLocal, Cryptpad);

            // Metadata not needed anymore?
            // Title and defaultTitle handled by metadataMgr.onChange in sframe-common-title
            //Metadata = Cryptpad.createMetadata(UserList, Title, null, Cryptpad);

            /*var configTb = {
                displayed: [
                    'title', 'useradmin', 'spinner', 'lag', 'state', 'share', 'userlist', 'newpad', 'limit', 'upgrade'],
                userList: UserList.getToolbarConfig(),
                share: {
                    secret: secret,
                    channel: info.channel
                },
                title: Title.getTitleConfig(),
                common: Cryptpad,
                readOnly: readOnly,
                ifrw: window,
                realtime: info.realtime,
                network: info.network,
                $container: $bar,
                $contentContainer: $('#cke_1_contents'),
            };
            toolbar = info.realtime.toolbar = Toolbar.create(configTb);
*/
            var src = 'less!/customize/src/less/toolbar.less';
            require([
                src
            ], function () {
                var $html = $bar.closest('html');
                $html
                    .find('head style[data-original-src="' + src.replace(/less!/, '') + '"]')
                    .appendTo($html.find('head'));
            });

            //Title.setToolbar(toolbar);

            //var $rightside = toolbar.$rightside;
            var $drawer = toolbar.$drawer;

            var editHash;

            if (!readOnly) {
                editHash = Cryptpad.getEditHashFromKeys(info.channel, secret.keys);
            }

            //$bar.find('#cke_1_toolbar_collapser').hide();
            /*if (!readOnly) {
                // Expand / collapse the toolbar
                var $collapse = Cryptpad.createButton(null, true);
                $collapse.removeClass('fa-question');
                var updateIcon = function () {
                    $collapse.removeClass('fa-caret-down').removeClass('fa-caret-up');
                    var isCollapsed = !$bar.find('.cke_toolbox_main').is(':visible');
                    if (isCollapsed) {
                        if (!initializing) { Cryptpad.feedback('HIDETOOLBAR_PAD'); }
                        $collapse.addClass('fa-caret-down');
                    }
                    else {
                        if (!initializing) { Cryptpad.feedback('SHOWTOOLBAR_PAD'); }
                        $collapse.addClass('fa-caret-up');
                    }
                };
                updateIcon();
                $collapse.click(function () {
                    $(window).trigger('resize');
                    $('.cke_toolbox_main').toggle();
                    $(window).trigger('cryptpad-ck-toolbar');
                    updateIcon();
                });
                $rightside.append($collapse);
            }*/

            /* add a history button */
            var histConfig = {
                onLocal: realtimeOptions.onLocal,
                onRemote: realtimeOptions.onRemote,
                setHistory: setHistory,
                applyVal: function (val) { applyHjson(val || '["BODY",{},[]]'); },
                $toolbar: $bar
            };
            var $hist = Cryptpad.createButton('history', true, {histConfig: histConfig});
            $drawer.append($hist);

            /* save as template */
            if (!Cryptpad.isTemplate(window.location.href)) {
                var templateObj = {
                    rt: info.realtime,
                    Crypt: Cryptget,
                    getTitle: function () { return document.title; }
                };
                var $templateButton = Cryptpad.createButton('template', true, templateObj);
                $rightside.append($templateButton);
            }

            /* add an export button */
            var $export = Cryptpad.createButton('export', true, {}, exportFile);
            $drawer.append($export);

            if (!readOnly) {
                /* add an import button */
                var $import = Cryptpad.createButton('import', true, {
                    accept: 'text/html'
                }, importFile);
                $drawer.append($import);
            }

            /* add a forget button */
            var forgetCb = function (err) {
                if (err) { return; }
                setEditable(false);
            };
            var $forgetPad = Cryptpad.createButton('forget', true, {}, forgetCb);
            $rightside.append($forgetPad);

            // set the hash
            if (!readOnly) { Cryptpad.replaceHash(editHash); }
        };

        // this should only ever get called once, when the chain syncs
        realtimeOptions.onReady = function (info) {
            console.log('onReady');
            if (!module.isMaximized) {
                module.isMaximized = true;
                $('iframe.cke_wysiwyg_frame').css('width', '');
                $('iframe.cke_wysiwyg_frame').css('height', '');
            }
            $('body').addClass('app-pad');

            if (module.realtime !== info.realtime) {
                module.patchText = TextPatcher.create({
                    realtime: info.realtime,
                    //logging: true,
                });
            }

            module.realtime = info.realtime;

            var shjson = module.realtime.getUserDoc();

            var newPad = false;
            if (shjson === '') { newPad = true; }

            if (!newPad) {
                applyHjson(shjson);

                // Update the user list (metadata) from the hyperjson
                // XXX Metadata.update(shjson);
                var parsed = JSON.parse(shjson);
                if (parsed[3] && parsed[3].metadata) {
                    cpNfInner.metadataMgr.updateMetadata(parsed[3].metadata);
                }

                if (!readOnly) {
                    var shjson2 = stringifyDOM(inner);
                    var hjson2 = JSON.parse(shjson2).slice(0,3);
                    var hjson = JSON.parse(shjson).slice(0,3);
                    if (stringify(hjson2) !== stringify(hjson)) {
                        console.log('err');
                        console.error("shjson2 !== shjson");
                        console.log(stringify(hjson2));
                        console.log(stringify(hjson));
                        Cryptpad.errorLoadingScreen(Messages.wrongApp);
                        throw new Error();
                    }
                }
            } else {
                Title.updateTitle(Cryptpad.initialName || Title.defaultTitle);
                documentBody.innerHTML = Messages.initialState;
            }

            Cryptpad.removeLoadingScreen(emitResize);
            setEditable(!readOnly);
            initializing = false;

            if (readOnly) { return; }
            //TODO UserList.getLastName(toolbar.$userNameButton, newPad);
            onLocal();
            editor.focus();
            if (newPad) {
                cursor.setToEnd();
            } else {
                cursor.setToStart();
            }
        };

        realtimeOptions.onConnectionChange = function (info) {
            setEditable(info.state);
            //toolbar.failed(); TODO
            if (info.state) {
                initializing = true;
                //toolbar.reconnecting(info.myId); // TODO
                Cryptpad.findOKButton().click();
            } else {
                Cryptpad.alert(Messages.common_connectionLost, undefined, true);
            }
        };

        realtimeOptions.onError = onConnectError;

        var onLocal = realtimeOptions.onLocal = function () {
            if (initializing) { return; }
            if (isHistoryMode) { return; }
            if (readOnly) { return; }

            // stringify the json and send it into chainpad
            var shjson = stringifyDOM(inner);

            module.patchText(shjson);
            if (module.realtime.getUserDoc() !== shjson) {
                console.error("realtime.getUserDoc() !== shjson");
            }
        };

        cpNfInner = common.startRealtime(realtimeOptions);

        Cryptpad.onLogout(function () { setEditable(false); });

        /* hitting enter makes a new line, but places the cursor inside
            of the <br> instead of the <p>. This makes it such that you
            cannot type until you click, which is rather unnacceptable.
            If the cursor is ever inside such a <br>, you probably want
            to push it out to the parent element, which ought to be a
            paragraph tag. This needs to be done on keydown, otherwise
            the first such keypress will not be inserted into the P. */
        inner.addEventListener('keydown', cursor.brFix);

        editor.on('change', onLocal);

        // export the typing tests to the window.
        // call like `test = easyTest()`
        // terminate the test like `test.cancel()`
        window.easyTest = function () {
            cursor.update();
            var start = cursor.Range.start;
            var test = TypingTest.testInput(inner, start.el, start.offset, onLocal);
            onLocal();
            return test;
        };

        $bar.find('.cke_button').click(function () {
            var e = this;
            var classString = e.getAttribute('class');
            var classes = classString.split(' ').filter(function (c) {
                return /cke_button__/.test(c);
            });

            var id = classes[0];
            if (typeof(id) === 'string') {
                Cryptpad.feedback(id.toUpperCase());
            }
        });
    };

    var main = function () {
        var Ckeditor;
        var editor;
        var common;

        nThen(function (waitFor) {
            ckEditorAvailable(waitFor(function (ck) { Ckeditor = ck; }));
            $(waitFor(function () {
                Cryptpad.addLoadingScreen();
            }));
            SFCommon.create(waitFor(function (c) { module.common = common = c; }));
        }).nThen(function (waitFor) {
            Ckeditor.config.toolbarCanCollapse = true;
            if (screen.height < 800) {
                Ckeditor.config.toolbarStartupExpanded = false;
                $('meta[name=viewport]').attr('content', 'width=device-width, initial-scale=1.0, user-scalable=no');
            } else {
                $('meta[name=viewport]').attr('content', 'width=device-width, initial-scale=1.0, user-scalable=yes');
            }
            editor = Ckeditor.replace('editor1', {
                customConfig: '/customize/ckeditor-config.js',
            });
            editor.on('instanceReady', waitFor());
        }).nThen(function (waitFor) {
            Links.addSupportForOpeningLinksInNewTab(Ckeditor);
            Cryptpad.onError(function (info) {
                if (info && info.type === "store") {
                    onConnectError();
                }
            });
            andThen(editor, Ckeditor, common);
        });
    };
    main();
});
