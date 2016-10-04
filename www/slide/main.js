require.config({ paths: { 'json.sortify': '/bower_components/json.sortify/dist/JSON.sortify' } });
define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/customize/messages.js?app=code',
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
    '/slide/slide.js',
    '/common/clipboard.js',
    '/bower_components/file-saver/FileSaver.min.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/customize/pad.js'
], function (Config, /*RTCode,*/ Messages, Crypto, Realtime, TextPatcher, Toolbar, JSONSortify, JsonOT, Cryptpad, Modes, Themes, Visible, Notify, Slide, Clipboard) {
    var $ = window.jQuery;
    var saveAs = window.saveAs;

    var module = window.APP = {
        Cryptpad: Cryptpad,
        spinner: Cryptpad.spinner(document.body),
        TextPatcher: TextPatcher,
        Slide: Slide,
    };

    Cryptpad.styleAlerts();

    module.spinner.show();

    var ifrw = module.ifrw = $('#pad-iframe')[0].contentWindow;
    var stringify = function (obj) {
        return JSONSortify(obj);
    };

    var setTabTitle = function () {
        var slideNumber = '';
        if (Slide.index && Slide.content.length) {
            slideNumber = ' (' + Slide.index + '/' + Slide.content.length + ')';
        }
        document.title = APP.title + slideNumber;
    };

    $(function () {
        var toolbar;

        var secret = Cryptpad.getSecrets();
        var readOnly = secret.keys && !secret.keys.editKeyStr;
        Slide.readOnly = readOnly;
        if (!secret.keys) {
            secret.keys = secret.key;
        }

        var presentMode = Slide.isPresentURL();

        var andThen = function (CMeditor) {
            var CodeMirror = module.CodeMirror = CMeditor;
            CodeMirror.modeURL = "/bower_components/codemirror/mode/%N/%N.js";

            var $pad = $('#pad-iframe');
            var $textarea = $pad.contents().find('#editor1');

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

            var setMode = module.setMode = function (mode, $select) {
                module.highlightMode = mode;
                if (mode === 'text') {
                    editor.setOption('mode', 'text');
                    return;
                }
                CodeMirror.autoLoadMode(editor, mode);
                editor.setOption('mode', mode);
                if ($select && $select.val) { $select.val(mode); }
            };
            setMode('markdown');

            editor.setValue(Messages.slideInitialState); // HERE

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
                    if ($select && $select.val) { $select.val(theme || 'default'); }
                };
            }());

            var $modal = $pad.contents().find('#modal');
            var $content = $pad.contents().find('#content');

            Slide.setModal($modal, $content, $pad);

            var enterPresentationMode = function (shouldLog) {
                Slide.show(true, $textarea.val());
                if (shouldLog) {
                    Cryptpad.log(Messages.presentSuccess);
                }
            };
            var leavePresentationMode = function () {
                Slide.show(false);
            };

            if (presentMode) {
                enterPresentationMode(true);
            }

            var setEditable = module.setEditable = function (bool) {
                if (readOnly && bool) { return; }
                editor.setOption('readOnly', !bool);
            };

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
              myUserName = myID;
            };

            var config = {
                //initialState: Messages.codeInitialState,
                initialState: '{}',
                websocketURL: Config.websocketURL,
                channel: secret.channel,
                // our public key
                validateKey: secret.keys.validateKey || undefined,
                readOnly: readOnly,
                crypto: Crypto.createEncryptor(secret.keys),
                setMyID: setMyID,
                transformFunction: JsonOT.validate
            };

            var canonicalize = function (t) { return t.replace(/\r\n/g, '\n'); };

            var initializing = true;

            var onLocal = config.onLocal = function () {
                if (initializing) { return; }
                if (readOnly) { return; }

                editor.save();
                var textValue = canonicalize($textarea.val());
                var obj = {content: textValue};

                // append the userlist to the hyperjson structure
                obj.metadata = {
                    users: userList
                };
                if (!isDefaultTitle()) {
                    obj.metadata.title = APP.title;
                }
                // stringify the json and send it into chainpad
                var shjson = stringify(obj);

                module.patchText(shjson);
                Slide.update(textValue);

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
                addToUserList(myData);
                Cryptpad.setAttribute('username', myUserName, function (err, data) {
                    if (err) {
                        console.log("Couldn't set username");
                        console.error(err);
                        return;
                    }
                    onLocal();
                });
            };

            var getLastName = function (cb) {
                Cryptpad.getAttribute('username', function (err, userName) {
                    cb(err, userName || '');
                });
            };

            var getHeadingText = function () {
                var lines = editor.getValue().split(/\n/);

                var text = '';
                lines.some(function (line) {
                    // lines beginning with a hash are potentially valuable
                    // works for markdown, python, bash, etc.
                    var hash = /^#(.*?)$/;
                    if (hash.test(line)) {
                        line.replace(hash, function (a, one) {
                            text = one;
                        });
                        return true;
                    }
                });

                return text.trim();
            };

            var isDefaultTitle = function () {
                var parsed = Cryptpad.parsePadUrl(window.location.href);
                return Cryptpad.isDefaultName(parsed, APP.title);
            };
            var suggestName = function () {
                var parsed = Cryptpad.parsePadUrl(window.location.href);
                var name = Cryptpad.getDefaultName(parsed, []);

                if (Cryptpad.isDefaultName(parsed, APP.title)) {
                    return getHeadingText() || APP.title;
                } else {
                    return APP.title || getHeadingText() || name;
                }
            };

            var exportText = module.exportText = function () {
                var text = editor.getValue();

                var ext = Modes.extensionOf(module.highlightMode);

                var title = Cryptpad.fixFileName(suggestName()) + ext;

                Cryptpad.prompt(Messages.exportPrompt, title, function (filename) {
                        if (filename === null) { return; }
                        var blob = new Blob([text], {
                            type: 'text/plain;charset=utf-8'
                        });
                        saveAs(blob, filename);
                    });
            };

            var onInit = config.onInit = function (info) {
                var $bar = $('#pad-iframe')[0].contentWindow.$('#cme_toolbox');
                toolbarList = info.userList;
                var config = {
                    userData: userList,
                    readOnly: readOnly
                };
                if (readOnly) {delete config.changeNameID; }
                toolbar = module.toolbar = Toolbar.create($bar, info.myID, info.realtime, info.getLag, info.userList, config);

                var $rightside = $bar.find('.' + Toolbar.constants.rightside);

                var editHash;
                var viewHash = Cryptpad.getViewHashFromKeys(info.channel, secret.keys);

                if (!readOnly) {
                    editHash = Cryptpad.getEditHashFromKeys(info.channel, secret.keys);
                }

                getLastName(function (err, lastName) {
                    var $username = Cryptpad.createButton('username', true)
                        .click(function() {
                        Cryptpad.prompt(Messages.changeNamePrompt, lastName, function (newName) {
                            setName(newName);
                        });
                    });
                    $rightside.append($username);
                });

                /* add an export button */
                var $export = Cryptpad.createButton('export', true).click(exportText);
                $rightside.append($export);

                if (!readOnly) {
                    /* add an import button */
                    var $import = Cryptpad.createButton('import', true)
                        .click(Cryptpad.importContent('text/plain', function (content, file) {
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
                        }));
                    $rightside.append($import);

                    /* add a rename button */
                    var $setTitle = Cryptpad.createButton('rename', true)
                        .click(function () {
                            var suggestion = suggestName();

                            Cryptpad.prompt(Messages.renamePrompt,
                                suggestion, function (title, ev) {
                                    if (title === null) { return; }

                                    Cryptpad.causesNamingConflict(title, function (err, conflicts) {
                                        if (err) {
                                            console.log("Unable to determine if name caused a conflict");
                                            console.error(err);
                                            return;
                                        }

                                        if (conflicts) {
                                            Cryptpad.alert(Messages.renameConflict);
                                            return;
                                        }

                                        Cryptpad.setPadTitle(title, function (err, data) {
                                            if (err) {
                                                console.log("unable to set pad title");
                                                console.log(err);
                                                return;
                                            }
                                            APP.title = title;
                                            setTabTitle();
                                            onLocal();
                                        });
                                    });
                                });
                        });
                    $rightside.append($setTitle);
                }

                /* add a forget button */
                var $forgetPad = Cryptpad.createButton('forget', true)
                    .click(function () {
                        var href = window.location.href;
                        Cryptpad.confirm(Messages.forgetPrompt, function (yes) {
                            if (!yes) { return; }
                            Cryptpad.forgetPad(href, function (err, data) {
                                if (err) {
                                    console.log("unable to forget pad");
                                    console.error(err);
                                    return;
                                }
                                var parsed = Cryptpad.parsePadUrl(href);
                                APP.title = Cryptpad.getDefaultName(parsed, []);
                                setTabTitle();
                            });
                        });
                    });
                $rightside.append($forgetPad);

                if (!readOnly && viewHash) {
                    /* add a 'links' button */
                    var $links = Cryptpad.createButton('readonly', true)
                        .click(function () {
                            var baseUrl = window.location.origin + window.location.pathname + '#';
                            var url = baseUrl + viewHash + '/present';
                            var content = '<b>' + Messages.readonlyUrl + '</b><br><a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + '</a><br>';
                            Cryptpad.alert(content);
                        });
                    $rightside.append($links);
                }

                var $present = Cryptpad.createButton('present', true)
                    .click(function () {
                    enterPresentationMode(true);
                });
                if (presentMode) {
                    $present.hide();
                }
                $rightside.append($present);

                var $leavePresent = Cryptpad.createButton('source', true)
                    .click(leavePresentationMode);
                if (!presentMode) {
                    $leavePresent.hide();
                }
                $rightside.append($leavePresent);

                $language = $('<span>', {
                    'style': "margin-right: 10px;"
                }).text(Messages.type.slide + " (Markdown)");
                $rightside.append($language);


                var configureTheme = function () {
                    /*  Remember the user's last choice of theme using localStorage */
                    var themeKey = 'CRYPTPAD_CODE_THEME';
                    var lastTheme = localStorage.getItem(themeKey) || 'default';

                    /*  Let the user select different themes */
                    var $themeDropdown = $('<select>', {
                        title: 'color theme',
                        id: 'display-theme',
                    });
                    Themes.forEach(function (o) {
                        $themeDropdown.append($('<option>', {
                            selected: o.name === lastTheme,
                        }).val(o.name).text(o.name));
                    });


                    $rightside.append($themeDropdown);

                    var $theme = $bar.find('select#display-theme');

                    setTheme(lastTheme, $theme);

                    $theme.on('change', function () {
                        var theme = $theme.val();
                        console.log("Setting theme to %s", theme);
                        setTheme(theme, $theme);
                        // remember user choices
                        localStorage.setItem(themeKey, theme);
                    });
                };

                configureTheme();

                if (presentMode) {
                    $('#top-bar').hide();
                }

                // set the hash
                if (!window.location.hash || window.location.hash === '#') {
                    window.location.hash = editHash;
                }

                Cryptpad.getPadTitle(function (err, title) {
                    if (err) {
                        console.log("Unable to get pad title");
                        console.error(err);
                        return;
                    }
                    document.title = APP.title = title || info.channel.slice(0, 8);
                    Cryptpad.setPadTitle(title, function (err, data) {
                        if (err) {
                            console.log("Unable to set pad title");
                            console.error(err);
                            return;
                        }
                    });
                });
            };

            var updateTitle = function (newTitle) {
                if (newTitle === APP.title) { return; }
                // Change the title now, and set it back to the old value if there is an error
                var oldTitle = APP.title;
                APP.title = newTitle;
                setTabTitle();
                Cryptpad.setPadTitle(newTitle, function (err, data) {
                    if (err) {
                        console.log("Couldn't set pad title");
                        console.error(err);
                        APP.title = oldTitle;
                        setTabTitle();
                        return;
                    }
                });
            };

            var updateMetadata = function(shjson) {
                // Extract the user list (metadata) from the hyperjson
                var json = (shjson === "") ? "" : JSON.parse(shjson);
                if (json && json.metadata) {
                    if (json.metadata.users) {
                        var userData = json.metadata.users;
                        // Update the local user data
                        addToUserList(userData);
                    }
                    if (json.metadata.title) {
                        updateTitle(json.metadata.title);
                    }
                }
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
                module.patchText = TextPatcher.create({
                    realtime: realtime,
                    //logging: true
                });

                var userDoc = module.realtime.getUserDoc();

                var newDoc = "";
                if(userDoc !== "") {
                    var hjson = JSON.parse(userDoc);
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

                editor.setValue(newDoc || Messages.slideInitialState);
                Slide.update(newDoc);

                if (Visible.isSupported()) {
                    Visible.onChange(function (yes) {
                        if (yes) { unnotify(); }
                    });
                }

                Slide.onChange(function (o, n, l) {
                    if (n !== null) {
                        document.title = APP.title + ' (' + (++n) + '/' + l +  ')';
                        return;
                    }
                    console.log("Exiting presentation mode");
                    document.title = APP.title;
                });

                $(module.spinner.get().el).fadeOut(750);
                setEditable(true);
                initializing = false;
                //Cryptpad.log("Your document is ready");

                onLocal(); // push local state to avoid parse errors later.
                getLastName(function (err, lastName) {
                    if (err) {
                        console.log("Could not get previous name");
                        console.error(err);
                        return;
                    }
                    // Update the toolbar list:
                    // Add the current user in the metadata if he has edit rights
                    if (readOnly) { return; }
                    myData[myID] = {
                        name: ""
                    };
                    addToUserList(myData);
                    if (typeof(lastName) === 'string' && lastName.length) {
                        setName(lastName);
                    }
                    onLocal();
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
                    var localDoc = canonicalize($textarea.val());
                    var hjson2 = {
                      content: localDoc,
                      metadata: {
                          users: userList
                      },
                      highlightMode: highlightMode,
                    };
                    if (!isDefaultTitle()) {
                        hjson2.metadata.title = APP.title;
                    }
                    var shjson2 = stringify(hjson2);
                    if (shjson2 !== shjson) {
                        console.error("shjson2 !== shjson");
                        TextPatcher.log(shjson, TextPatcher.diff(shjson, shjson2));
                        module.patchText(shjson2);
                    }
                }
                Slide.update(remoteDoc);

                notify();
            };

            var onAbort = config.onAbort = function (info) {
                // inform of network disconnect
                setEditable(false);
                toolbar.failed();
                Cryptpad.alert(Messages.disconnectAlert);
            };

            var onConnectionChange = config.onConnectionChange = function (info) {
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

            var realtime = module.realtime = Realtime.start(config);

            editor.on('change', onLocal);
        };

        var interval = 100;

        var second = function (CM) {
            Cryptpad.ready(function (err, env) {
                // TODO handle error
                andThen(CM);
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
