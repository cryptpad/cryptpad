require.config({ paths: { 'json.sortify': '/bower_components/json.sortify/dist/JSON.sortify' } });
define([
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/bower_components/hyperjson/hyperjson.js',
    '/common/toolbar.js',
    '/common/cursor.js',
    '/bower_components/chainpad-json-validator/json-ot.js',
    '/common/TypingTests.js',
    'json.sortify',
    '/bower_components/textpatcher/TextPatcher.amd.js',
    '/common/cryptpad-common.js',
    '/common/visible.js',
    '/common/notify.js',
    '/bower_components/file-saver/FileSaver.min.js',
    '/bower_components/diff-dom/diffDOM.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Crypto, realtimeInput, Hyperjson,
    Toolbar, Cursor, JsonOT, TypingTest, JSONSortify, TextPatcher, Cryptpad,
    Visible, Notify) {
    var $ = window.jQuery;
    var saveAs = window.saveAs;
    var Messages = Cryptpad.Messages;

    $(function () {

    var ifrw = $('#pad-iframe')[0].contentWindow;
    var Ckeditor; // to be initialized later...
    var DiffDom = window.diffDOM;

    Cryptpad.styleAlerts();
    Cryptpad.addLoadingScreen();

    var stringify = function (obj) {
        return JSONSortify(obj);
    };

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
    };

    var emitResize = module.emitResize = function () {
        var cw = $('#pad-iframe')[0].contentWindow;

        var evt = cw.document.createEvent('UIEvents');
        evt.initUIEvent('resize', true, false, cw, 0);
        cw.dispatchEvent(evt);
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

    var onConnectError = function (info) {
        Cryptpad.errorLoadingScreen(Messages.websocketError);
    };

    var andThen = function (Ckeditor) {
        var secret = Cryptpad.getSecrets();
        var readOnly = secret.keys && !secret.keys.editKeyStr;
        if (!secret.keys) {
            secret.keys = secret.key;
        }

        var editor = window.editor = Ckeditor.replace('editor1', {
            customConfig: '/customize/ckeditor-config.js',
        });

        editor.on('instanceReady', function (Ckeditor) {
            var $bar = $('#pad-iframe')[0].contentWindow.$('#cke_1_toolbox');
            var parsedHash = Cryptpad.parsePadUrl(window.location.href);
            var defaultName = Cryptpad.getDefaultName(parsedHash);

            if (readOnly) {
                $('#pad-iframe')[0].contentWindow.$('#cke_1_toolbox > .cke_toolbar').hide();
            }

            /* add a class to the magicline plugin so we can pick it out more easily */

            var ml = $('iframe')[0].contentWindow.CKEDITOR.instances.editor1.plugins.magicline
                .backdoor.that.line.$;

            [ml, ml.parentElement].forEach(function (el) {
                el.setAttribute('class', 'non-realtime');
            });

            var documentBody = ifrw.$('iframe')[0].contentDocument.body;

            var inner = window.inner = documentBody;

            // hide all content until the realtime doc is ready
            $(inner).css({
                color: '#fff',
            });
            documentBody.innerHTML = Messages.initialState;

            var cursor = window.cursor = Cursor(inner);

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

            var forbiddenTags = [
                'SCRIPT',
                'IFRAME',
                'OBJECT',
                'APPLET',
                'VIDEO',
                'AUDIO'
            ];

            var diffOptions = {
                preDiffApply: function (info) {
                    /*
                        Don't accept attributes that begin with 'on'
                        these are probably listeners, and we don't want to
                        send scripts over the wire.
                    */
                    if (['addAttribute', 'modifyAttribute'].indexOf(info.diff.action) !== -1) {
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

            var initializing = true;
            var userData = module.userData = {}; // List of pretty names for all users (mapped with their ID)
            var userList; // List of users still connected to the channel (server IDs)
            var addToUserData = function(data) {
                var users = module.users;
                for (var attrname in data) { userData[attrname] = data[attrname]; }

                if (users && users.length) {
                    for (var userKey in userData) {
                        if (users.indexOf(userKey) === -1) { delete userData[userKey]; }
                    }
                }

                if(userList && typeof userList.onChange === "function") {
                    userList.onChange(userData);
                }
            };

            var myData = {};
            var myUserName = ''; // My "pretty name"
            var myID; // My server ID

            var setMyID = function(info) {
                myID = info.myID || null;
            };

            var setName = module.setName = function (newName) {
                if (typeof(newName) !== 'string') { return; }
                var myUserNameTemp = Cryptpad.fixHTML(newName.trim());
                if(myUserNameTemp.length > 32) {
                    myUserNameTemp = myUserNameTemp.substr(0, 32);
                }
                myUserName = myUserNameTemp;
                myData[myID] = {
                    name: myUserName
                };
                addToUserData(myData);
                Cryptpad.setAttribute('username', newName, function (err, data) {
                    if (err) {
                        console.error("Couldn't set username");
                        return;
                    }
                    editor.fire('change');
                });
            };

            var isDefaultTitle = function () {
                var parsed = Cryptpad.parsePadUrl(window.location.href);
                return Cryptpad.isDefaultName(parsed, document.title);
            };

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

            var suggestName = function (fallback) {
                if (document.title === defaultName) {
                    return getHeadingText() || fallback || "";
                } else {
                    return document.title || getHeadingText() || defaultName;
                }
            };

            var DD = new DiffDom(diffOptions);

            // apply patches, and try not to lose the cursor in the process!
            var applyHjson = function (shjson) {
                var userDocStateDom = hjsonToDom(JSON.parse(shjson));

                if (!readOnly) {
                    userDocStateDom.setAttribute("contenteditable", "true"); // lol wtf
                }
                var patch = (DD).diff(inner, userDocStateDom);
                (DD).apply(inner, patch);
            };

            var stringifyDOM = module.stringifyDOM = function (dom) {
                var hjson = Hyperjson.fromDOM(dom, isNotMagicLine, brFilter);
                hjson[3] = {
                    metadata: {
                        users: userData,
                        defaultTitle: defaultName
                    }
                };
                if (!initializing) {
                    hjson[3].metadata.title = document.title;
                } else if (Cryptpad.initialName) {
                    hjson[3].metadata.title = Cryptpad.initialName;
                }
                return stringify(hjson);
            };

            var realtimeOptions = {
                // provide initialstate...
                initialState: stringifyDOM(inner) || '{}',

                // the websocket URL
                websocketURL: Cryptpad.getWebsocketURL(),

                // the channel we will communicate over
                channel: secret.channel,

                // the nework used for the file store if it exists
                network: Cryptpad.getNetwork(),

                // our public key
                validateKey: secret.keys.validateKey || undefined,
                readOnly: readOnly,

                // method which allows us to get the id of the user
                setMyID: setMyID,

                // Pass in encrypt and decrypt methods
                crypto: Crypto.createEncryptor(secret.keys),

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

            var updateTitle = function (newTitle) {
                if (newTitle === document.title) { return; }
                // Change the title now, and set it back to the old value if there is an error
                var oldTitle = document.title;
                document.title = newTitle;
                Cryptpad.renamePad(newTitle, function (err, data) {
                    if (err) {
                        console.log("Couldn't set pad title");
                        console.error(err);
                        document.title = oldTitle;
                        return;
                    }
                    document.title = data;
                    $bar.find('.' + Toolbar.constants.title).find('span.title').text(data);
                    $bar.find('.' + Toolbar.constants.title).find('input').val(data);
                });
            };

            var updateDefaultTitle = function (defaultTitle) {
                defaultName = defaultTitle;
                $bar.find('.' + Toolbar.constants.title).find('input').attr("placeholder", defaultName);
            };

            var updateMetadata = function(shjson) {
                // Extract the user list (metadata) from the hyperjson
                var hjson = JSON.parse(shjson);
                var peerMetadata = hjson[3];
                var titleUpdated = false;
                if (peerMetadata && peerMetadata.metadata) {
                    if (peerMetadata.metadata.users) {
                        var userData = peerMetadata.metadata.users;
                        // Update the local user data
                        addToUserData(userData);
                    }
                    if (peerMetadata.metadata.defaultTitle) {
                        updateDefaultTitle(peerMetadata.metadata.defaultTitle);
                    }
                    if (typeof peerMetadata.metadata.title !== "undefined") {
                        updateTitle(peerMetadata.metadata.title || defaultName);
                        titleUpdated = true;
                    }
                }
                if (!titleUpdated) {
                    updateTitle(defaultName);
                }
            };

            var unnotify = function () {
                if (module.tabNotification &&
                    typeof(module.tabNotification.cancel) === 'function') {
                    module.tabNotification.cancel();
                }
            };

            var notify = function () {
                if (Visible.isSupported() && !Visible.currently()) {
                    unnotify();
                    module.tabNotification = Notify.tab(1000, 10);
                }
            };

            var onRemote = realtimeOptions.onRemote = function (info) {
                if (initializing) { return; }

                var oldShjson = stringifyDOM(inner);

                var shjson = info.realtime.getUserDoc();

                // remember where the cursor is
                cursor.update();

                // Update the user list (metadata) from the hyperjson
                updateMetadata(shjson);

                var newInner = JSON.parse(shjson);
                var newSInner;
                if (newInner.length > 2) {
                    newSInner = stringify(newInner[2]);
                }

                // build a dom from HJSON, diff, and patch the editor
                applyHjson(shjson);

                if (!readOnly) {
                    var shjson2 = stringifyDOM(inner);
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
                    notify();
                }
            };

            var getHTML = function (Dom) {
                var data = inner.innerHTML;
                Dom = Dom || (new DOMParser()).parseFromString(data,"text/html");
                return ('<!DOCTYPE html>\n' +
                    '<html>\n' +
                    (typeof(Hyperjson.toString) === 'function'?
                        Hyperjson.toString(Hyperjson.fromDOM(Dom.body)):
                        Dom.head.outerHTML) + '\n');
            };

            var domFromHTML = function (html) {
                return new DOMParser().parseFromString(html, 'text/html');
            };

            var exportFile = function () {
                var html = getHTML();
                var suggestion = suggestName('cryptpad-document');
                Cryptpad.prompt(Messages.exportPrompt,
                    Cryptpad.fixFileName(suggestion) + '.html', function (filename) {
                    if (!(typeof(filename) === 'string' && filename)) { return; }
                    var blob = new Blob([html], {type: "text/html;charset=utf-8"});
                    saveAs(blob, filename);
                });
            };
            var importFile = function (content, file) {
                var shjson = stringify(Hyperjson.fromDOM(domFromHTML(content).body));
                applyHjson(shjson);
                realtimeOptions.onLocal();
            };

            var renameCb = function (err, title) {
                if (err) { return; }
                document.title = title;
                editor.fire('change');
            };

            var onInit = realtimeOptions.onInit = function (info) {
                userList = info.userList;

                var config = {
                    displayed: ['useradmin', 'language', 'spinner', 'lag', 'state', 'share', 'userlist', 'newpad'],
                    userData: userData,
                    readOnly: readOnly,
                    ifrw: ifrw,
                    title: {
                        onRename: renameCb,
                        defaultName: defaultName,
                        suggestName: suggestName
                    },
                    common: Cryptpad
                };
                if (readOnly) {delete config.changeNameID; }
                toolbar = info.realtime.toolbar = Toolbar.create($bar, info.myID, info.realtime, info.getLag, userList, config);

                var $rightside = $bar.find('.' + Toolbar.constants.rightside);
                var $userBlock = $bar.find('.' + Toolbar.constants.username);
                var $editShare = $bar.find('.' + Toolbar.constants.editShare);
                var $viewShare = $bar.find('.' + Toolbar.constants.viewShare);
                var $usernameButton = module.$userNameButton = $($bar.find('.' + Toolbar.constants.changeUsername));

                var editHash;
                var viewHash = Cryptpad.getViewHashFromKeys(info.channel, secret.keys);

                if (!readOnly) {
                    editHash = Cryptpad.getEditHashFromKeys(info.channel, secret.keys);
                }

                // Expand / collapse the toolbar
                var $existingButton = $bar.find('#cke_1_toolbar_collapser');
                var $collapse = Cryptpad.createButton(null, true);
                $existingButton.hide();
                $collapse.removeClass('fa-question');
                var updateIcon = function () {
                    $collapse.removeClass('fa-caret-down').removeClass('fa-caret-up');
                    var isCollapsed = !$bar.find('.cke_toolbox_main').is(':visible');
                    if (isCollapsed) { $collapse.addClass('fa-caret-down'); }
                    else { $collapse.addClass('fa-caret-up'); }
                };
                updateIcon();
                $collapse.click(function () {
                    $existingButton.click();
                    updateIcon();
                });
                $rightside.append($collapse);

                /* add an export button */
                var $export = Cryptpad.createButton('export', true, {}, exportFile);
                $rightside.append($export);

                if (!readOnly) {
                    /* add an import button */
                    var $import = Cryptpad.createButton('import', true, {}, importFile);
                    $rightside.append($import);

                    /* add a rename button */
                    //var $setTitle = Cryptpad.createButton('rename', true, {suggestName: suggestName}, renameCb);
                    //$rightside.append($setTitle);
                }

                /* add a forget button */
                var forgetCb = function (err, title) {
                    if (err) { return; }
                    document.title = title;
                };
                var $forgetPad = Cryptpad.createButton('forget', true, {}, forgetCb);
                $rightside.append($forgetPad);

                if (!readOnly) {
                    $editShare.append(Cryptpad.createButton('editshare', false, {editHash: editHash}));
                    if (viewHash) {
                        $editShare.append($('<hr>'));
                    }
                }
                if (viewHash) {
                    /* add a 'links' button */
                    $viewShare.append(Cryptpad.createButton('viewshare', false, {viewHash: viewHash}));
                    if (!readOnly) {
                        $viewShare.append(Cryptpad.createButton('viewopen', false, {viewHash: viewHash}));
                    }
                }

                // set the hash
                if (!readOnly) { Cryptpad.replaceHash(editHash); }

                Cryptpad.onDisplayNameChanged(setName);
            };

            // this should only ever get called once, when the chain syncs
            var onReady = realtimeOptions.onReady = function (info) {
                if (!module.isMaximized) {
                    editor.execCommand('maximize');
                    module.isMaximized = true;
                    // We have to call it 3 times in Safari
                    // in order to have the editor fully maximized -_-
                    if ((''+window.navigator.vendor).indexOf('Apple') !== -1) {
                        editor.execCommand('maximize');
                        editor.execCommand('maximize');
                    }
                }

                module.patchText = TextPatcher.create({
                    realtime: info.realtime,
                    //logging: true,
                });

                module.users = info.userList.users;
                module.realtime = info.realtime;

                var shjson = info.realtime.getUserDoc();
                applyHjson(shjson);

                // Update the user list (metadata) from the hyperjson
                updateMetadata(shjson);

                if (Visible.isSupported()) {
                    Visible.onChange(function (yes) {
                        if (yes) { unnotify(); }
                    });
                }

                Cryptpad.getLastName(function (err, lastName) {
                    console.log("Unlocking editor");
                    setEditable(true);
                    initializing = false;
                    Cryptpad.removeLoadingScreen(emitResize);

                    // Update the toolbar list:
                    // Add the current user in the metadata if he has edit rights
                    if (readOnly) { return; }
                    if (typeof(lastName) === 'string') {
                        setName(lastName);
                    } else {
                        myData[myID] = {
                            name: ""
                        };
                        addToUserData(myData);
                        realtimeOptions.onLocal();
                        module.$userNameButton.click();
                    }
                });
            };

            var onAbort = realtimeOptions.onAbort = function (info) {
                console.log("Aborting the session!");
                // stop the user from continuing to edit
                setEditable(false);
                // TODO inform them that the session was torn down
                toolbar.failed();
                Cryptpad.alert(Messages.common_connectionLost);
            };

            var onConnectionChange = realtimeOptions.onConnectionChange = function (info) {
                setEditable(info.state);
                toolbar.failed();
                if (info.state) {
                    initializing = true;
                    toolbar.reconnecting(info.myId);
                    Cryptpad.findOKButton().click();
                } else {
                    Cryptpad.alert(Messages.common_connectionLost);
                }
            };

            var onError = realtimeOptions.onError = onConnectError;

            var onLocal = realtimeOptions.onLocal = function () {
                if (initializing) { return; }
                if (readOnly) { return; }

                // stringify the json and send it into chainpad
                var shjson = stringifyDOM(inner);

                module.patchText(shjson);
                if (module.realtime.getUserDoc() !== shjson) {
                    console.error("realtime.getUserDoc() !== shjson");
                }
            };

            var rti = module.realtimeInput = realtimeInput.start(realtimeOptions);

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
            var easyTest = window.easyTest = function () {
                cursor.update();
                var start = cursor.Range.start;
                var test = TypingTest.testInput(inner, start.el, start.offset, onLocal);
                onLocal();
                return test;
            };
        });
    };

    var interval = 100;
    var second = function (Ckeditor) {
        Cryptpad.ready(function (err, env) {
            // TODO handle error
            andThen(Ckeditor);
        });
        Cryptpad.onError(function (info) {
            if (info && info.type === "store") {
                onConnectError();
            }
        });
    };

    var first = function () {
        Ckeditor = ifrw.CKEDITOR;
        if (Ckeditor) {
            //andThen(Ckeditor);
            // mobile configuration
            Ckeditor.config.toolbarCanCollapse = true;
            Ckeditor.config.height = '72vh';
            if (screen.height < 800) {
              Ckeditor.config.toolbarStartupExpanded = false;
              $('meta[name=viewport]').attr('content', 'width=device-width, initial-scale=1.0, user-scalable=no');
            } else {
              $('meta[name=viewport]').attr('content', 'width=device-width, initial-scale=1.0, user-scalable=yes');
            }
            second(Ckeditor);
        } else {
            console.log("Ckeditor was not defined. Trying again in %sms",interval);
            setTimeout(first, interval);
        }
    };

    $(first);

    });
});
