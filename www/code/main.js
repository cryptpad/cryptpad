define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/bower_components/textpatcher/TextPatcher.js',
    '/common/toolbar2.js',
    'json.sortify',
    '/bower_components/chainpad-json-validator/json-ot.js',
    '/common/cryptpad-common.js',
    '/common/cryptget.js',
    '/common/modes.js',
    '/common/themes.js',
    '/common/visible.js',
    '/common/notify.js',
    '/bower_components/file-saver/FileSaver.min.js'
], function ($, Crypto, Realtime, TextPatcher, Toolbar, JSONSortify, JsonOT, Cryptpad, Cryptget, Modes, Themes, Visible, Notify) {
    var saveAs = window.saveAs;
    var Messages = Cryptpad.Messages;

    var module = window.APP = {
        Cryptpad: Cryptpad,
    };

    $(function () {
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

        var onConnectError = function () {
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

            var isHistoryMode = false;

            var editor = module.editor = CMeditor.fromTextArea($textarea[0], {
                lineNumbers: true,
                lineWrapping: true,
                autoCloseBrackets: true,
                matchBrackets : true,
                showTrailingSpace : true,
                styleActiveLine : true,
                search: true,
                highlightSelectionMatches: {showToken: /\w+/},
                extraKeys: {"Shift-Ctrl-R": undefined},
                foldGutter: true,
                gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
                mode: "javascript",
                readOnly: true
            });
            editor.setValue(Messages.codeInitialState);

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
                    $select.setValue(name);
                }
            };

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
                    if ($select) {
                        $select.setValue(theme || 'Theme');
                    }
                };
            }());

            var setEditable = module.setEditable = function (bool) {
                if (readOnly && bool) { return; }
                editor.setOption('readOnly', !bool);
            };

            var UserList;

            var config = {
                initialState: '{}',
                websocketURL: Cryptpad.getWebsocketURL(),
                channel: secret.channel,
                // our public key
                validateKey: secret.keys.validateKey || undefined,
                readOnly: readOnly,
                crypto: Crypto.createEncryptor(secret.keys),
                network: Cryptpad.getNetwork(),
                transformFunction: JsonOT.validate,
            };

            var canonicalize = function (t) { return t.replace(/\r\n/g, '\n'); };

            var setHistory = function (bool, update) {
                isHistoryMode = bool;
                setEditable(!bool);
                if (!bool && update) {
                    config.onRemote();
                }
            };

/*          var isDefaultTitle = function () {
                var parsed = Cryptpad.parsePadUrl(window.location.href);
                return Cryptpad.isDefaultName(parsed, document.title);
            };*/

            var initializing = true;

            var stringifyInner = function (textValue) {
                var obj = {
                    content: textValue,
                    metadata: {
                        users: UserList.userData,
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
                if (isHistoryMode) { return; }
                if (readOnly) { return; }

                editor.save();

                var textValue = canonicalize($textarea.val());
                var shjson = stringifyInner(textValue);

                module.patchText(shjson);

                if (module.realtime.getUserDoc() !== shjson) {
                    console.error("realtime.getUserDoc() !== shjson");
                }
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
                        UserList.addToUserData(userData);
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

             config.onInit = function (info) {
                UserList = Cryptpad.createUserList(info, config.onLocal, Cryptpad);

                var configTb = {
                    displayed: ['title', 'useradmin', 'spinner', 'lag', 'state', 'share', 'userlist', 'newpad', 'limit'],
                    userList: UserList.getToolbarConfig(),
                    share: {
                        secret: secret,
                        channel: info.channel
                    },
                    title: {
                        onRename: renameCb,
                        defaultName: defaultName,
                        suggestName: suggestName
                    },
                    common: Cryptpad,
                    readOnly: readOnly,
                    ifrw: ifrw,
                    realtime: info.realtime,
                    network: info.network,
                    $container: $bar
                };
                toolbar = module.toolbar = Toolbar.create(configTb);

                var $rightside = toolbar.$rightside;

                var editHash;
                if (!readOnly) {
                    editHash = Cryptpad.getEditHashFromKeys(info.channel, secret.keys);
                }

                /* add a history button */
                var histConfig = {};
                histConfig.onRender = function (val) {
                    if (typeof val === "undefined") { return; }
                    try {
                        var hjson = JSON.parse(val || '{}');
                        var remoteDoc = hjson.content;
                        editor.setValue(remoteDoc || '');
                        editor.save();
                    } catch (e) {
                        // Probably a parse error
                        console.error(e);
                    }
                };
                histConfig.onClose = function () {
                    // Close button clicked
                    setHistory(false, true);
                };
                histConfig.onRevert = function () {
                    // Revert button clicked
                    setHistory(false, false);
                    config.onLocal();
                    config.onRemote();
                };
                histConfig.onReady = function () {
                    // Called when the history is loaded and the UI displayed
                    setHistory(true);
                };
                histConfig.$toolbar = $bar;
                var $hist = Cryptpad.createButton('history', true, {histConfig: histConfig});
                $rightside.append($hist);

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
                var forgetCb = function (err) {
                    if (err) { return; }
                    setEditable(false);
                };
                var $forgetPad = Cryptpad.createButton('forget', true, {}, forgetCb);
                $rightside.append($forgetPad);

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
                        isSelect: true,
                    };
                    var $block = module.$language = Cryptpad.createDropdown(dropdownConfig);
                    $block.find('a').click(function () {
                        setMode($(this).attr('data-value'), $block);
                        onLocal();
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
                        isSelect: true,
                        initialValue: lastTheme
                    };
                    var $block = module.$theme = Cryptpad.createDropdown(dropdownConfig);

                    setTheme(lastTheme, $block);

                    $block.find('a').click(function () {
                        var theme = $(this).attr('data-value');
                        setTheme(theme, $block);
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

            config.onReady = function (info) {
                if (module.realtime !== info.realtime) {
                    var realtime = module.realtime = info.realtime;
                    module.patchText = TextPatcher.create({
                        realtime: realtime,
                        //logging: true
                    });
                }

                var userDoc = module.realtime.getUserDoc();

                var isNew = false;
                if (userDoc === "" || userDoc === "{}") { isNew = true; }

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

                if (newDoc) {
                    editor.setValue(newDoc);
                }

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

                if (readOnly) { return; }
                UserList.getLastName(toolbar.$userNameButton, isNew);
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

            config.onRemote = function () {
                if (initializing) { return; }
                if (isHistoryMode) { return; }
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

            config.onAbort = function () {
                // inform of network disconnect
                setEditable(false);
                toolbar.failed();
                Cryptpad.alert(Messages.common_connectionLost, undefined, true);
            };

            config.onConnectionChange = function (info) {
                setEditable(info.state);
                toolbar.failed();
                if (info.state) {
                    initializing = true;
                    toolbar.reconnecting(info.myId);
                    Cryptpad.findOKButton().click();
                } else {
                    Cryptpad.alert(Messages.common_connectionLost, undefined, true);
                }
            };

            config.onError = onConnectError;

            module.realtime = Realtime.start(config);

            editor.on('change', onLocal);

            Cryptpad.onLogout(function () { setEditable(false); });
        };

        var interval = 100;

        var second = function (CM) {
            Cryptpad.ready(function () {
                andThen(CM);
                Cryptpad.reportAppUsage();
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
