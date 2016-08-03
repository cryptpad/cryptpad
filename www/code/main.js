require.config({ paths: { 'json.sortify': '/bower_components/json.sortify/dist/JSON.sortify' } });
define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/customize/messages.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/bower_components/textpatcher/TextPatcher.amd.js',
    '/common/toolbar.js',
    'json.sortify',
    '/bower_components/chainpad-json-validator/json-ot.js',
    '/common/cryptpad-common.js',
    '/code/modes.js',
    '/code/themes.js',
    '/common/visible.js',
    '/common/notify.js',
    '/bower_components/file-saver/FileSaver.min.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/customize/pad.js'
], function (Config, /*RTCode,*/ Messages, Crypto, Realtime, TextPatcher, Toolbar, JSONSortify, JsonOT, Cryptpad, Modes, Themes, Visible, Notify) {
    var $ = window.jQuery;
    var saveAs = window.saveAs;
    var module = window.APP = {
        Cryptpad: Cryptpad,
    };
    var ifrw = module.ifrw = $('#pad-iframe')[0].contentWindow;
    var stringify = function (obj) {
        return JSONSortify(obj);
    };

    $(function () {
        var userName = Crypto.rand64(8),
            toolbar;

        var secret = Cryptpad.getSecrets();

        var andThen = function (CMeditor) {
            var CodeMirror = module.CodeMirror = CMeditor;
            CodeMirror.modeURL = "/code/codemirror-5.16.0/mode/%N/%N.js";

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

            editor.setValue(Messages.codeInitialState); // HERE

            var setTheme = module.setTheme = (function () {
                var path = './theme/';

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

            var setEditable = module.setEditable = function (bool) {
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
                userName: userName,
                websocketURL: Config.websocketURL,
                channel: secret.channel,
                //cryptKey: key,
                crypto: Crypto.createEncryptor(secret.key),
                setMyID: setMyID,
                transformFunction: JsonOT.validate
            };

            var canonicalize = function (t) { return t.replace(/\r\n/g, '\n'); };

            var initializing = true;

            var onLocal = config.onLocal = function () {
                if (initializing) { return; }

                editor.save();
                var textValue = canonicalize($textarea.val());
                var obj = {content: textValue};

                // append the userlist to the hyperjson structure
                obj.metadata = userList;

                // stringify the json and send it into chainpad
                var shjson = stringify(obj);

                module.patchText(shjson);

                if (module.realtime.getUserDoc() !== shjson) {
                    console.error("realtime.getUserDoc() !== shjson");
                }
            };

            var setName = module.setName = function (newName) {
                if (!(typeof(newName) === 'string' && newName.trim())) { return; }
                var myUserNameTemp = newName.trim();
                if(newName.trim().length > 32) {
                  myUserNameTemp = myUserNameTemp.substr(0, 32);
                }
                myUserName = myUserNameTemp;
                myData[myID] = {
                   name: myUserName
                };
                addToUserList(myData);
                Cryptpad.setPadAttribute('username', myUserName, function (err, data) {
                    if (err) {
                        console.log("Couldn't set username");
                        console.error(err);
                        return;
                    }
                    onLocal();
                });
            };

            var getLastName = function (cb) {
                Cryptpad.getPadAttribute('username', function (err, userName) {
                    cb(err, userName || '');
                });
            };

            var createChangeName = function(id, $container) {
                var buttonElmt = $container.find('#'+id)[0];

                getLastName(function (err, lastName) {
                    buttonElmt.addEventListener("click", function() {
                        Cryptpad.prompt(Messages.changeNamePrompt, lastName, function (newName) {
                            setName(newName);
                        });
                    });
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
                    var clike = /^\s*(\/\*|\/\/)(.*?)(\*\/)$/;
                    if (clike.test(line)) {
                        line.replace(clike, function (a, one, two) {
                            text = two;
                        });
                        return true;
                    }
                });

                return text.trim();
            };

            var suggestName = function () {
                var hash = window.location.hash.slice(1, 9);

                if (document.title === hash) {
                    return getHeadingText() || hash;
                } else {
                    return document.title || getHeadingText() || hash;
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
                    changeNameID: Toolbar.constants.changeName,
                };
                toolbar = module.toolbar = Toolbar.create($bar, info.myID, info.realtime, info.getLag, info.userList, config);
                createChangeName(Toolbar.constants.changeName, $bar);

                var $rightside = $bar.find('.' + Toolbar.constants.rightside);

                /* add an export button */
                var $export = $('<button>', {
                    title: Messages.exportButtonTitle,
                })
                    .text(Messages.exportButton)
                    .addClass('rightside-button')
                    .click(exportText);
                $rightside.append($export);

                /* add an import button */
                var $import = $('<button>',{
                    title: Messages.importButtonTitle
                })
                    .text(Messages.importButton)
                    .addClass('rightside-button')
                    .click(Cryptpad.importContent('text/plain', function (content, file) {
                        var mime = CodeMirror.findModeByMIME(file.type);

                        var mode = mime && mime.mode || null;

                        if (Modes.list.some(function (o) { return o.mode === mode; })) {
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
                var $setTitle = $('<button>', {
                        id: 'name-pad',
                        title: Messages.renameButtonTitle,
                    })
                    .addClass('rightside-button')
                    .text(Messages.renameButton)
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
                                        document.title = title;
                                    });
                                });
                            });
                    });
                $rightside.append($setTitle);

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
                                if (err) {
                                    console.log("unable to forget pad");
                                    console.error(err);
                                    return;
                                }
                                document.title = window.location.hash.slice(1,9);
                            });
                        });
                    });
                $rightside.append($forgetPad);

                // TODO use cb
                var configureLanguage = function (cb) {
                    // FIXME this is async so make it happen as early as possible
                    Cryptpad.getPadAttribute('language', function (err, lastLanguage) {
                        if (err) {
                            console.log("Unable to get pad language");
                        }

                        lastLanguage = lastLanguage || 'javascript';

                        /*  Let the user select different syntax highlighting modes */
                        var syntaxDropdown = '<select title="syntax highlighting" id="language-mode">\n' +
                            Modes.list.map(function (o) {
                                var selected = o.mode === lastLanguage? ' selected="selected"' : '';
                                return '<option value="' + o.mode + '"'+selected+'>' + o.language + '</option>';
                            }).join('\n') +
                            '</select>';

                        setMode(lastLanguage);

                        $rightside.append(syntaxDropdown);

                        var $language = module.$language = $bar.find('#language-mode').on('change', function () {
                            var mode = $language.val();
                            setMode(mode);
                            Cryptpad.setPadAttribute('language', mode, function (err, data) {
                                // TODO
                            });
                        });
                        cb();
                    });
                };


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

                configureLanguage(function () {
                    configureTheme();
                });

                window.location.hash = info.channel + secret.key;
                Cryptpad.getPadTitle(function (err, title) {
                    if (err) {
                        console.log("Unable to get pad title");
                        console.error(err);
                        return;
                    }
                    document.title = title || window.location.hash.slice(1,9);
                    Cryptpad.rememberPad(title, function (err, data) {
                        if (err) {
                            console.log("Unable to set pad title");
                            console.error(err);
                            return;
                        }
                    });
                });
            };

            var updateUserList = function(shjson) {
                // Extract the user list (metadata) from the hyperjson
                var hjson = (shjson === "") ? "" : JSON.parse(shjson);
                if(hjson && hjson.metadata) {
                  var userData = hjson.metadata;
                  // Update the local user data
                  addToUserList(userData);
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
                    module.tabNotification = Notify.tab(document.title, 1000, 10);
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
                }

                // Update the user list (metadata) from the hyperjson
                //updateUserList(shjson);

                editor.setValue(newDoc || Messages.codeInitialState);

                if (Visible.isSupported()) {
                    Visible.onChange(function (yes) {
                        if (yes) { unnotify(); }
                    });
                }


                setEditable(true);
                initializing = false;
                //Cryptpad.log("Your document is ready");

                getLastName(function (err, lastName) {
                    if (err) {
                        console.log("Could not get previous name");
                        console.error(err);
                        return;
                    }
                    if (typeof(lastName) === 'string' && lastName.length) {
                        setName(lastName);
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
                updateUserList(shjson);

                var hjson = JSON.parse(shjson);
                var remoteDoc = hjson.content;

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

                var localDoc = canonicalize($textarea.val());
                var hjson2 = {
                  content: localDoc,
                  metadata: userList
                };
                var shjson2 = stringify(hjson2);
                if (shjson2 !== shjson) {
                    console.error("shjson2 !== shjson");
                    module.patchText(shjson2);
                }

                notify();
            };

            var onAbort = config.onAbort = function (info) {
                // inform of network disconnect
                setEditable(false);
                Cryptpad.alert(Messages.disconnectAlert);
            };

            Cryptpad.styleAlerts();
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
