require.config({ paths: { 'json.sortify': '/bower_components/json.sortify/dist/JSON.sortify' } });
define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/customize/messages.js',
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
    '/customize/pad.js'
], function (Config, Messages, Crypto, realtimeInput, Hyperjson,
    Toolbar, Cursor, JsonOT, TypingTest, JSONSortify, TextPatcher, Cryptpad,
    Visible, Notify) {
    var $ = window.jQuery;
    var saveAs = window.saveAs;
    var ifrw = $('#pad-iframe')[0].contentWindow;
    var Ckeditor; // to be initialized later...
    var DiffDom = window.diffDOM;

    Cryptpad.styleAlerts();

    var stringify = function (obj) {
        return JSONSortify(obj);
    };

    window.Toolbar = Toolbar;
    window.Hyperjson = Hyperjson;

    var hjsonToDom = function (H) {
        return Hyperjson.toDOM(H); //callOn(H, Hyperscript);
    };

    var module = window.REALTIME_MODULE = window.APP = {
        Hyperjson: Hyperjson,
        TextPatcher: TextPatcher,
        logFights: true,
        fights: [],
        Cryptpad: Cryptpad,
        spinner: Cryptpad.spinner(document.body),
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

    var andThen = function (Ckeditor) {
        var secret = Cryptpad.getSecrets();

        var fixThings = false;

        var editor = window.editor = Ckeditor.replace('editor1', {
            // https://dev.ckeditor.com/ticket/10907
            needsBrFiller: fixThings,
            needsNbspFiller: fixThings,
            removeButtons: 'Source,Maximize',
            // magicline plugin inserts html crap into the document which is not part of the
            // document itself and causes problems when it's sent across the wire and reflected back
            removePlugins: 'resize',
            extraPlugins: 'autolink,colorbutton,colordialog,font',
            //skin: 'moono',
        });

        editor.on('instanceReady', function (Ckeditor) {

            /* add a class to the magicline plugin so we can pick it out more easily */

            var ml = $('iframe')[0].contentWindow.CKEDITOR.instances.editor1.plugins.magicline
                .backdoor.that.line.$;

            [ml, ml.parentElement].forEach(function (el) {
                el.setAttribute('class', 'non-realtime');
            });

            editor.execCommand('maximize');
            var documentBody = ifrw.$('iframe')[0].contentDocument.body;

            var inner = window.inner = documentBody;

            // hide all content until the realtime doc is ready
            $(inner).css({
                color: 'white',
                'background-color': 'white',
            });
            documentBody.innerHTML = Messages.initialState;

            var cursor = window.cursor = Cursor(inner);

            var setEditable = module.setEditable = function (bool) {
                if (bool) {
                    $(inner).css({
                        color: 'unset',
                        'background-color': 'unset',
                    });
                    $(module.spinner.get().el).fadeOut(750);
                } else {
                    module.spinner.show();
                }

                inner.setAttribute('contenteditable', bool);
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
            var userList = {}; // List of pretty name of all users (mapped with their server ID)
            var toolbarList; // List of users still connected to the channel (server IDs)
            var addToUserList = function(data) {
                for (var attrname in data) { userList[attrname] = data[attrname]; }
                if(toolbarList && typeof toolbarList.onChange === "function") {
                    toolbarList.onChange(userList);
                }
            };

            var myData = {};
            var myUserName = ''; // My "pretty name"
            var myID; // My server ID

            var setMyID = function(info) {
                myID = info.myID || null;
            };

            var getLastName = function (cb) {
                Cryptpad.getPadAttribute('username', function (err, userName) {
                    cb(err, userName || '');
                });
            };

            var setName = module.setName = function (newName) {
                if (!(typeof(newName) === 'string' && newName.trim())) { return; }
                var myUserNameTemp = Cryptpad.fixHTML(newName.trim());
                if(myUserNameTemp.length > 32) {
                    myUserNameTemp = myUserNameTemp.substr(0, 32);
                }
                myUserName = myUserNameTemp;
                myData[myID] = {
                    name: myUserName
                };
                addToUserList(myData);
                editor.fire('change');

                Cryptpad.setPadAttribute('username', newName, function (err, data) {
                    if (err) {
                        console.error("Couldn't set username");
                    }
                });
            };

            var createChangeName = function(id, $container) {
                var buttonElmt = $container.find('#'+id)[0];
                //var lastName = getLastName();
                getLastName(function (err, lastName) {
                    buttonElmt.addEventListener("click", function() {
                        Cryptpad.prompt(Messages.changeNamePrompt, lastName, function (newName) {
                            setName(newName);
                        });
                    });
                });
            };

            var DD = new DiffDom(diffOptions);

            // apply patches, and try not to lose the cursor in the process!
            var applyHjson = function (shjson) {
                var userDocStateDom = hjsonToDom(JSON.parse(shjson));

                userDocStateDom.setAttribute("contenteditable", "true"); // lol wtf
                var patch = (DD).diff(inner, userDocStateDom);
                (DD).apply(inner, patch);
            };

            var stringifyDOM = module.stringifyDOM = function (dom) {
                var hjson = Hyperjson.fromDOM(dom, isNotMagicLine, brFilter);
                hjson[3] = {
                    metadata: {
                        users: userList,
                        title: document.title
                    }
                };
                return stringify(hjson);
            };

            var realtimeOptions = {
                // provide initialstate...
                initialState: stringifyDOM(inner) || '{}',

                // the websocket URL
                websocketURL: Config.websocketURL,

                // the channel we will communicate over
                channel: secret.channel,

                // our encryption key
                cryptKey: secret.key,

                // method which allows us to get the id of the user
                setMyID: setMyID,

                // Pass in encrypt and decrypt methods
                crypto: Crypto.createEncryptor(secret.key),

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
                Cryptpad.setPadTitle(newTitle, function (err, data) {
                    if (err) {
                        console.log("Couldn't set pad title");
                        console.error(err);
                        document.title = oldTitle;
                        return;
                    }
                });
            };

            var updateMetadata = function(shjson) {
                // Extract the user list (metadata) from the hyperjson
                var hjson = JSON.parse(shjson);
                var peerMetadata = hjson[3];
                if (peerMetadata && peerMetadata.metadata) {
                    if (peerMetadata.metadata.users) {
                        var userData = peerMetadata.metadata.users;
                        // Update the local user data
                        addToUserList(userData);
                    }
                    if (peerMetadata.metadata.title) {
                        updateTitle(peerMetadata.metadata.title);
                    }
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
                    module.tabNotification = Notify.tab(document.title, 1000, 10);
                }
            };

            var onRemote = realtimeOptions.onRemote = function (info) {
                if (initializing) { return; }

                var shjson = info.realtime.getUserDoc();

                // remember where the cursor is
                cursor.update();

                // Update the user list (metadata) from the hyperjson
                updateMetadata(shjson);

                // build a dom from HJSON, diff, and patch the editor
                applyHjson(shjson);

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
                notify();
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

            var suggestName = module.suggestName = function () {
                var parsed = Cryptpad.parsePadUrl(window.location.href);
                var name = Cryptpad.getDefaultName(parsed, []);

                if (document.title.slice(0, name.length) === name) {
                    return getHeadingText() || document.title;
                } else {
                    return document.title || getHeadingText() || name;
                }
            };

            var exportFile = function () {
                var html = getHTML();
                var suggestion = suggestName();
                Cryptpad.prompt(Messages.exportPrompt,
                    Cryptpad.fixFileName(suggestion) + '.html', function (filename) {
                    if (!(typeof(filename) === 'string' && filename)) { return; }
                    var blob = new Blob([html], {type: "text/html;charset=utf-8"});
                    saveAs(blob, filename);
                });
            };

            var onInit = realtimeOptions.onInit = function (info) {
                var $bar = $('#pad-iframe')[0].contentWindow.$('#cke_1_toolbox');
                toolbarList = info.userList;
                var config = {
                    userData: userList,
                    changeNameID: Toolbar.constants.changeName,
                };
                toolbar = info.realtime.toolbar = Toolbar.create($bar, info.myID, info.realtime, info.getLag, info.userList, config);
                createChangeName(Toolbar.constants.changeName, $bar);

                var $rightside = $bar.find('.' + Toolbar.constants.rightside);

                /* add an export button */
                var $export = $('<button>', {
                    title: Messages.exportButtonTitle,
                })
                    .text(Messages.exportButton)
                    .addClass('rightside-button')
                    .click(exportFile);

                /* add an import button */
                var $import = $('<button>', {
                    title: Messages.importButtonTitle
                })
                    .text(Messages.importButton)
                    .addClass('rightside-button')
                    .click(Cryptpad.importContent('text/plain', function (content) {
                        var shjson = stringify(Hyperjson.fromDOM(domFromHTML(content).body));
                        applyHjson(shjson);
                        realtimeOptions.onLocal();
                    }));
                $rightside.append($export).append($import);

                /* add a rename button */
                var $rename = $('<button>', {
                        id: 'name-pad',
                        title: Messages.renameButtonTitle,
                    })
                    .addClass('cryptpad-rename rightside-button')
                    .text(Messages.renameButton)
                    .click(function () {
                        var suggestion = suggestName();

                        Cryptpad.prompt(Messages.renamePrompt, suggestion, function (title) {
                            if (title === null) { return; }
                            Cryptpad.causesNamingConflict(title, function (err, conflicts) {
                                if (conflicts) {
                                    Cryptpad.alert(Messages.renameConflict);
                                    return;
                                }

                                Cryptpad.setPadTitle(title, function (err, data) {
                                    if (err) {
                                        console.log("Couldn't set pad title");
                                        console.error(err);
                                        return;
                                    }
                                    document.title = title;
                                    editor.fire('change');
                                });
                            });
                        });
                    });
                $rightside.append($rename);

                /* add a forget button */
                var $forgetPad = $('<button>', {
                        id: 'cryptpad-forget',
                        title: Messages.forgetButtonTitle,
                    })
                    .text(Messages.forgetButton)
                    .addClass('cryptpad-forget rightside-button')
                    .click(function () {
                        var href = window.location.href;
                        Cryptpad.confirm(Messages.forgetPrompt, function (yes) {
                            if (!yes) { return; }
                            Cryptpad.forgetPad(href, function (err, data) {
                                var parsed = Cryptpad.parsePadUrl(href);
                                document.title = Cryptpad.getDefaultName(parsed, []);
                            });
                        });
                    });
                $rightside.append($forgetPad);

                // set the hash
                window.location.hash = Cryptpad.getHashFromKeys(info.channel, secret.key);

                Cryptpad.getPadTitle(function (err, title) {
                    if (err) {
                        console.error(err);
                        console.log("Couldn't get pad title");
                        return;
                    }
                    document.title = title || info.channel.slice(0, 8);
                    Cryptpad.rememberPad(title, function (err, data) {
                        if (err) {
                            console.log("Couldn't remember pad");
                            console.error(err);
                        }
                    });
                });
            };

            // this should only ever get called once, when the chain syncs
            var onReady = realtimeOptions.onReady = function (info) {
                module.patchText = TextPatcher.create({
                    realtime: info.realtime,
                    //logging: true,
                });

                module.realtime = info.realtime;

                var shjson = info.realtime.getUserDoc();
                applyHjson(shjson);

                if (Visible.isSupported()) {
                    Visible.onChange(function (yes) {
                        if (yes) { unnotify(); }
                    });
                }

                getLastName(function (err, lastName) {
                    if (typeof(lastName) === 'string' && lastName.length) {
                        setName(lastName);
                    }
                    console.log("Unlocking editor");
                    setEditable(true);
                    initializing = false;
                });
            };

            var onAbort = realtimeOptions.onAbort = function (info) {
                console.log("Aborting the session!");
                // stop the user from continuing to edit
                setEditable(false);
                // TODO inform them that the session was torn down
                toolbar.failed();
                Cryptpad.alert(Messages.disconnectAlert);
            };

            var onConnectionChange = realtimeOptions.onConnectionChange = function (info) {
                setEditable(info.state);
                toolbar.failed();
                if (info.state) {
                    initializing = true;
                    toolbar.reconnecting(info.myId);
                    Cryptpad.findOKButton().click();
                } else {
                    Cryptpad.alert(Messages.disconnectAlert);
                }
            };

            var onLocal = realtimeOptions.onLocal = function () {
                if (initializing) { return; }

                // stringify the json and send it into chainpad
                var shjson = stringifyDOM(inner);

                module.patchText(shjson);
                if (module.realtime.getUserDoc() !== shjson) {
                    console.error("realtime.getUserDoc() !== shjson");
                }
            };

            var rti = module.realtimeInput = realtimeInput.start(realtimeOptions);

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
    };

    var first = function () {
        Ckeditor = ifrw.CKEDITOR;

        if (Ckeditor) {
            //andThen(Ckeditor);
            second(Ckeditor);
        } else {
            console.log("Ckeditor was not defined. Trying again in %sms",interval);
            setTimeout(first, interval);
        }
    };

    $(first);
});
