require.config({ paths: { 'json.sortify': '/bower_components/json.sortify/dist/JSON.sortify' } });
define([
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/bower_components/textpatcher/TextPatcher.amd.js',
    '/common/toolbar.js',
    'json.sortify',
    '/bower_components/chainpad-json-validator/json-ot.js',
    '/common/cryptpad-common.js',
    '/common/modes.js',
    '/common/themes.js',
    '/common/visible.js',
    '/common/notify.js',
    '/bower_components/file-saver/FileSaver.min.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Crypto, Realtime, TextPatcher, Toolbar, JSONSortify, JsonOT, Cryptpad, Modes, Themes, Visible, Notify) {
    var $ = window.jQuery;
    var saveAs = window.saveAs;
    var Messages = Cryptpad.Messages;

    var module = window.APP = {
        Cryptpad: Cryptpad,
    };

    $(function () {
        Cryptpad.styleAlerts();
        Cryptpad.addLoadingScreen();

        var ifrw = module.ifrw = $('#pad-iframe')[0].contentWindow;
        var stringify = function (obj) {
            return JSONSortify(obj);
        };

        var toolbar;

        var secret = Cryptpad.getSecrets();
        var readOnly = secret.keys && !secret.keys.editKeyStr;
        if (!secret.keys) {
            secret.keys = secret.key;
        }

        var onConnectError = function (info) {
            Cryptpad.errorLoadingScreen(Messages.websocketError);
        };

        var andThen = function (CMeditor) {
            var CodeMirror = module.CodeMirror = CMeditor;
            CodeMirror.modeURL = "/bower_components/codemirror/mode/%N/%N.js";
            var $pad = $('#pad-iframe');
            var $textarea = $pad.contents().find('#editor1');

            var $bar = $('#pad-iframe')[0].contentWindow.$('#cme_toolbox');
            var parsedHash = Cryptpad.parsePadUrl(window.location.href);
            var defaultName = Cryptpad.getDefaultName(parsedHash);

            var editor = module.editor = CMeditor.fromTextArea($textarea[0], {
                lineNumbers: true,
                lineWrapping: true,
                autoCloseBrackets: true,
                matchBrackets : true,
                showTrailingSpace : true,
                styleActiveLine : true,
                search: true,
                highlightSelectionMatches: {showToken: /\w+/},
                extraKeys: {"Ctrl-Q": function(cm){ cm.foldCode(cm.getCursor()); }},
                foldGutter: true,
                gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
                mode: "javascript",
                readOnly: true
            });
            editor.setOption('placeholder', Messages.codeInitialState);

            var setMode = module.setMode = function (mode, $select) {
                module.highlightMode = mode;
                if (mode === 'text') {
                    editor.setOption('mode', 'text');
                    return;
                }
                CodeMirror.autoLoadMode(editor, mode);
                editor.setOption('mode', mode);
                if ($select) {
                    var name = $select.find('a[data-value="' + mode + '"]').text() || 'Mode';
                    $select.find('.buttonTitle').text(name);
                }
            };

            editor.setValue('');

            var setTheme = module.setTheme = (function () {
                var path = '/common/theme/';

                var $head = $(ifrw.document.head);

                var themeLoaded = module.themeLoaded = function (theme) {
                    return $head.find('link[href*="'+theme+'"]').length;
                };

                var loadTheme = module.loadTheme = function (theme) {
                    $head.append($('<link />', {
                        rel: 'stylesheet',
                        href: path + theme + '.css',
                    }));
                };

                return function (theme, $select) {
                    if (!theme) {
                        editor.setOption('theme', 'default');
                    } else {
                        if (!themeLoaded(theme)) {
                            loadTheme(theme);
                        }
                        editor.setOption('theme', theme);
                    }
                    if ($select) { $select.find('.buttonTitle').text(theme || 'Theme'); }
                };
            }());

            var setEditable = module.setEditable = function (bool) {
                if (readOnly && bool) { return; }
                editor.setOption('readOnly', !bool);
            };

            var userData = module.userData = {}; // List of pretty name of all users (mapped with their server ID)
            var userList; // List of users still connected to the channel (server IDs)
            var addToUserData = function(data) {
                var users = module.users;
                for (var attrname in data) { userData[attrname] = data[attrname]; }

                if (users && users.length) {
                    for (var userKey in userData) {
                        if (users.indexOf(userKey) === -1) {
                            delete userData[userKey];
                        }
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
              myUserName = myID;
            };

            var config = {
                initialState: '{}',
                websocketURL: Cryptpad.getWebsocketURL(),
                channel: secret.channel,
                // our public key
                validateKey: secret.keys.validateKey || undefined,
                readOnly: readOnly,
                crypto: Crypto.createEncryptor(secret.keys),
                setMyID: setMyID,
                network: Cryptpad.getNetwork(),
                transformFunction: JsonOT.validate,
            };

            var canonicalize = function (t) { return t.replace(/\r\n/g, '\n'); };

            var isDefaultTitle = function () {
                var parsed = Cryptpad.parsePadUrl(window.location.href);
                return Cryptpad.isDefaultName(parsed, document.title);
            };

            var initializing = true;

            var stringifyInner = function (textValue) {
                var obj = {
                    content: textValue,
                    metadata: {
                        users: userData,
                        defaultTitle: defaultName
                    }
                };
                if (!initializing) {
                    obj.metadata.title = document.title;
                }
                // set mode too...
                obj.highlightMode = module.highlightMode;

                // stringify the json and send it into chainpad
                return stringify(obj);
            };

            var onLocal = config.onLocal = function () {
                if (initializing) { return; }
                if (readOnly) { return; }

                editor.save();

                var textValue = canonicalize($textarea.val());
                var shjson = stringifyInner(textValue);

                module.patchText(shjson);

                if (module.realtime.getUserDoc() !== shjson) {
                    console.error("realtime.getUserDoc() !== shjson");
                }
            };

            var setName = module.setName = function (newName) {
                if (typeof(newName) !== 'string') { return; }
                var myUserNameTemp = newName.trim();
                if(newName.trim().length > 32) {
                  myUserNameTemp = myUserNameTemp.substr(0, 32);
                }
                myUserName = myUserNameTemp;
                myData[myID] = {
                   name: myUserName
                };
                addToUserData(myData);
                Cryptpad.setAttribute('username', myUserName, function (err, data) {
                    if (err) {
                        console.log("Couldn't set username");
                        console.error(err);
                        return;
                    }
                    onLocal();
                });
            };

            var getHeadingText = function () {
                var lines = editor.getValue().split(/\n/);

                var text = '';
                lines.some(function (line) {
                    // lisps?
                    var lispy = /^\s*(;|#\|)(.*?)$/;
                    if (lispy.test(line)) {
                        line.replace(lispy, function (a, one, two) {
                            text = two;
                        });
                        return true;
                    }

                    // lines beginning with a hash are potentially valuable
                    // works for markdown, python, bash, etc.
                    var hash = /^#(.*?)$/;
                    if (hash.test(line)) {
                        line.replace(hash, function (a, one) {
                            text = one;
                        });
                        return true;
                    }

                    // lines including a c-style comment are also valuable
                    var clike = /^\s*(\/\*|\/\/)(.*)?(\*\/)*$/;
                    if (clike.test(line)) {
                        line.replace(clike, function (a, one, two) {
                            if (!(two && two.replace)) { return; }
                            text = two.replace(/\*\/\s*$/, '').trim();
                        });
                        return true;
                    }

                    // TODO make one more pass for multiline comments
                });

                return text.trim();
            };

            var suggestName = function (fallback) {
                if (document.title === defaultName) {
                    return getHeadingText() || fallback || "";
                } else {
                    return document.title || getHeadingText() || defaultName;
                }
            };

            var exportText = module.exportText = function () {
                var text = editor.getValue();

                var ext = Modes.extensionOf(module.highlightMode);

                var title = Cryptpad.fixFileName(suggestName('cryptpad')) + (ext || '.txt');

                Cryptpad.prompt(Messages.exportPrompt, title, function (filename) {
                        if (filename === null) { return; }
                        var blob = new Blob([text], {
                            type: 'text/plain;charset=utf-8'
                        });
                        saveAs(blob, filename);
                    });
            };
            var importText = function (content, file) {
                var $bar = $('#pad-iframe')[0].contentWindow.$('#cme_toolbox');
                var mode;
                var mime = CodeMirror.findModeByMIME(file.type);

                if (!mime) {
                    var ext = /.+\.([^.]+)$/.exec(file.name);
                    if (ext[1]) {
                        mode = CodeMirror.findModeByExtension(ext[1]);
                    }
                } else {
                    mode = mime && mime.mode || null;
                }

                if (mode && Modes.list.some(function (o) { return o.mode === mode; })) {
                    setMode(mode);
                    $bar.find('#language-mode').val(mode);
                } else {
                    console.log("Couldn't find a suitable highlighting mode: %s", mode);
                    setMode('text');
                    $bar.find('#language-mode').val('text');
                }

                editor.setValue(content);
                onLocal();
            };

            var renameCb = function (err, title) {
                if (err) { return; }
                document.title = title;
                onLocal();
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
                var json = (shjson === "") ? "" : JSON.parse(shjson);
                var titleUpdated = false;
                if (json && json.metadata) {
                    if (json.metadata.users) {
                        var userData = json.metadata.users;
                        // Update the local user data
                        addToUserData(userData);
                    }
                    if (json.metadata.defaultTitle) {
                        updateDefaultTitle(json.metadata.defaultTitle);
                    }
                    if (typeof json.metadata.title !== "undefined") {
                        updateTitle(json.metadata.title || defaultName);
                        titleUpdated = true;
                    }
                }
                if (!titleUpdated) {
                    updateTitle(defaultName);
                }
            };

             var onInit = config.onInit = function (info) {
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
                toolbar = module.toolbar = Toolbar.create($bar, info.myID, info.realtime, info.getLag, userList, config);

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

                /* add an export button */
                var $export = Cryptpad.createButton('export', true, {}, exportText);
                $rightside.append($export);

                if (!readOnly) {
                    /* add an import button */
                    var $import = Cryptpad.createButton('import', true, {}, importText);
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
                }
                if (viewHash) {
                    /* add a 'links' button */
                    $viewShare.append(Cryptpad.createButton('viewshare', false, {viewHash: viewHash}));
                    if (!readOnly) {
                        $viewShare.append(Cryptpad.createButton('viewopen', false, {viewHash: viewHash}));
                    }
                }

                var configureLanguage = function (cb) {
                    // FIXME this is async so make it happen as early as possible
                    var options = [];
                    Modes.list.forEach(function (l) {
                        options.push({
                            tag: 'a',
                            attributes: {
                                'data-value': l.mode,
                                'href': '#',
                            },
                            content: l.language // Pretty name of the language value
                        });
                    });
                    var dropdownConfig = {
                        text: 'Mode', // Button initial text
                        options: options, // Entries displayed in the menu
                        left: true, // Open to the left of the button
                    };
                    var $block = module.$language = Cryptpad.createDropdown(dropdownConfig);
                    var $button = $block.find('.buttonTitle');

                    $block.find('a').click(function (e) {
                        setMode($(this).attr('data-value'));
                        $button.text($(this).text());
                    });

                    $rightside.append($block);
                    cb();
                };

                var configureTheme = function () {
                    /*  Remember the user's last choice of theme using localStorage */
                    var themeKey = 'CRYPTPAD_CODE_THEME';
                    var lastTheme = localStorage.getItem(themeKey) || 'default';

                    var options = [];
                    Themes.forEach(function (l) {
                        options.push({
                            tag: 'a',
                            attributes: {
                                'data-value': l.name,
                                'href': '#',
                            },
                            content: l.name // Pretty name of the language value
                        });
                    });
                    var dropdownConfig = {
                        text: 'Theme', // Button initial text
                        options: options, // Entries displayed in the menu
                        left: true, // Open to the left of the button
                    };
                    var $block = module.$theme = Cryptpad.createDropdown(dropdownConfig);
                    var $button = $block.find('.buttonTitle');

                    setTheme(lastTheme, $block);

                    $block.find('a').click(function (e) {
                        var theme = $(this).attr('data-value');
                        setTheme(theme, $block);
                        $button.text($(this).text());
                        localStorage.setItem(themeKey, theme);
                    });

                    $rightside.append($block);
                };

                if (!readOnly) {
                    configureLanguage(function () {
                        configureTheme();
                    });
                }
                else {
                    configureTheme();
                }

                // set the hash
                if (!readOnly) { Cryptpad.replaceHash(editHash); }

                Cryptpad.onDisplayNameChanged(setName);
            };

            var unnotify = module.unnotify = function () {
                if (module.tabNotification &&
                    typeof(module.tabNotification.cancel) === 'function') {
                    module.tabNotification.cancel();
                }
            };

            var notify = module.notify = function () {
                if (Visible.isSupported() && !Visible.currently()) {
                    unnotify();
                    module.tabNotification = Notify.tab(1000, 10);
                }
            };

            var onReady = config.onReady = function (info) {
                var realtime = module.realtime = info.realtime;
                module.users = info.userList.users;
                module.patchText = TextPatcher.create({
                    realtime: realtime,
                    //logging: true
                });

                var userDoc = module.realtime.getUserDoc();


                var newDoc = "";
                if(userDoc !== "") {
                    var hjson = JSON.parse(userDoc);

                    if (typeof (hjson) !== 'object' || Array.isArray(hjson)) {
                        var errorText = Messages.typeError;
                        Cryptpad.errorLoadingScreen(errorText);
                        throw new Error(errorText);
                    }

                    newDoc = hjson.content;

                    if (hjson.highlightMode) {
                        setMode(hjson.highlightMode, module.$language);
                    }
                }

                if (!module.highlightMode) {
                    setMode('javascript', module.$language);
                    console.log("%s => %s", module.highlightMode, module.$language.val());
                }

                // Update the user list (metadata) from the hyperjson
                updateMetadata(userDoc);

                editor.setValue(newDoc || '');

                if (Cryptpad.initialName && document.title === defaultName) {
                    updateTitle(Cryptpad.initialName);
                    onLocal();
                }

                if (Visible.isSupported()) {
                    Visible.onChange(function (yes) {
                        if (yes) { unnotify(); }
                    });
                }

                Cryptpad.removeLoadingScreen();
                setEditable(true);
                initializing = false;
                //Cryptpad.log("Your document is ready");

                onLocal(); // push local state to avoid parse errors later.
                Cryptpad.getLastName(function (err, lastName) {
                    if (err) {
                        console.log("Could not get previous name");
                        console.error(err);
                        return;
                    }
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
                        onLocal();
                        module.$userNameButton.click();
                    }
                });
            };

            var cursorToPos = function(cursor, oldText) {
                var cLine = cursor.line;
                var cCh = cursor.ch;
                var pos = 0;
                var textLines = oldText.split("\n");
                for (var line = 0; line <= cLine; line++) {
                    if(line < cLine) {
                        pos += textLines[line].length+1;
                    }
                    else if(line === cLine) {
                        pos += cCh;
                    }
                }
                return pos;
            };

            var posToCursor = function(position, newText) {
                var cursor = {
                    line: 0,
                    ch: 0
                };
                var textLines = newText.substr(0, position).split("\n");
                cursor.line = textLines.length - 1;
                cursor.ch = textLines[cursor.line].length;
                return cursor;
            };

            var onRemote = config.onRemote = function (info) {
                if (initializing) { return; }
                var scroll = editor.getScrollInfo();

                var oldDoc = canonicalize($textarea.val());
                var shjson = module.realtime.getUserDoc();

                // Update the user list (metadata) from the hyperjson
                updateMetadata(shjson);

                var hjson = JSON.parse(shjson);
                var remoteDoc = hjson.content;

                var highlightMode = hjson.highlightMode;
                if (highlightMode && highlightMode !== module.highlightMode) {
                    setMode(highlightMode, module.$language);
                }

                //get old cursor here
                var oldCursor = {};
                oldCursor.selectionStart = cursorToPos(editor.getCursor('from'), oldDoc);
                oldCursor.selectionEnd = cursorToPos(editor.getCursor('to'), oldDoc);

                editor.setValue(remoteDoc);
                editor.save();

                var op = TextPatcher.diff(oldDoc, remoteDoc);
                var selects = ['selectionStart', 'selectionEnd'].map(function (attr) {
                    return TextPatcher.transformCursor(oldCursor[attr], op);
                });

                if(selects[0] === selects[1]) {
                    editor.setCursor(posToCursor(selects[0], remoteDoc));
                }
                else {
                    editor.setSelection(posToCursor(selects[0], remoteDoc), posToCursor(selects[1], remoteDoc));
                }

                editor.scrollTo(scroll.left, scroll.top);

                if (!readOnly) {
                    var textValue = canonicalize($textarea.val());
                    var shjson2 = stringifyInner(textValue);
                    if (shjson2 !== shjson) {
                        console.error("shjson2 !== shjson");
                        TextPatcher.log(shjson, TextPatcher.diff(shjson, shjson2));
                        module.patchText(shjson2);
                    }
                }
                if (oldDoc !== remoteDoc) {
                    notify();
                }
            };

            var onAbort = config.onAbort = function (info) {
                // inform of network disconnect
                setEditable(false);
                toolbar.failed();
                Cryptpad.alert(Messages.common_connectionLost);
            };

            var onConnectionChange = config.onConnectionChange = function (info) {
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

            var onError = config.onError = onConnectError;

            var realtime = module.realtime = Realtime.start(config);

            editor.on('change', onLocal);

            Cryptpad.onLogout(function () { setEditable(false); });
        };

        var interval = 100;

        var second = function (CM) {
            Cryptpad.ready(function (err, env) {
                // TODO handle error
                andThen(CM);
            });
            Cryptpad.onError(function (info) {
                if (info && info.type === "store") {
                    onConnectError();
                }
            });
        };

        var first = function () {
            if (ifrw.CodeMirror) {
                // it exists, call your continuation
                //andThen(ifrw.CodeMirror);
                second(ifrw.CodeMirror);
            } else {
                console.log("CodeMirror was not defined. Trying again in %sms", interval);
                // try again in 'interval' ms
                setTimeout(first, interval);
            }
        };

        first();
    });
});
