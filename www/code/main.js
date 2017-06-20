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
    '/common/diffMarked.js',
    '/bower_components/tweetnacl/nacl-fast.min.js', // needed for media-tag
], function ($, Crypto, Realtime, TextPatcher, Toolbar, JSONSortify, JsonOT, Cryptpad,
             Cryptget, DiffMd) {
    var Messages = Cryptpad.Messages;

    var APP = window.APP = {
        Cryptpad: Cryptpad,
    };

    $(function () {
        Cryptpad.addLoadingScreen();

        var ifrw = APP.ifrw = $('#pad-iframe')[0].contentWindow;
        var stringify = function (obj) {
            return JSONSortify(obj);
        };

        var toolbar;
        var editor;

        var secret = Cryptpad.getSecrets();
        var readOnly = secret.keys && !secret.keys.editKeyStr;
        if (!secret.keys) {
            secret.keys = secret.key;
        }

        var onConnectError = function () {
            Cryptpad.errorLoadingScreen(Messages.websocketError);
        };

        var andThen = function (CMeditor) {
            var $iframe = $('#pad-iframe').contents();
            var $previewContainer = $iframe.find('#previewContainer');
            var $preview = $iframe.find('#preview');
            $preview.click(function (e) {
                if (!e.target) { return; }
                var $t = $(e.target);
                if ($t.is('a') || $t.parents('a').length) {
                    e.preventDefault();
                    var $a = $t.is('a') ? $t : $t.parents('a').first();
                    var href = $a.attr('href');
                    window.open(href);
                }
            });

            var CodeMirror = Cryptpad.createCodemirror(CMeditor, ifrw, Cryptpad);
            $iframe.find('.CodeMirror').addClass('fullPage');
            editor = CodeMirror.editor;

            var $bar = $('#pad-iframe')[0].contentWindow.$('#cme_toolbox');

            var isHistoryMode = false;

            var setEditable = APP.setEditable = function (bool) {
                if (readOnly && bool) { return; }
                editor.setOption('readOnly', !bool);
            };

            var Title;
            var UserList;
            var Metadata;

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

            var initializing = true;

            var stringifyInner = function (textValue) {
                var obj = {
                    content: textValue,
                    metadata: {
                        users: UserList.userData,
                        defaultTitle: Title.defaultTitle
                    }
                };
                if (!initializing) {
                    obj.metadata.title = Title.title;
                }
                // set mode too...
                obj.highlightMode = CodeMirror.highlightMode;

                // stringify the json and send it into chainpad
                return stringify(obj);
            };

            var forceDrawPreview = function () {
                try {
                    DiffMd.apply(DiffMd.render(editor.getValue()), $preview);
                } catch (e) { console.error(e); }
            };

            var drawPreview = Cryptpad.throttle(function () {
                if (CodeMirror.highlightMode !== 'markdown') { return; }
                if (!$previewContainer.is(':visible')) { return; }
                forceDrawPreview();
            }, 150);

            var onLocal = config.onLocal = function () {
                if (initializing) { return; }
                if (isHistoryMode) { return; }
                if (readOnly) { return; }

                editor.save();

                drawPreview();

                var textValue = canonicalize(CodeMirror.$textarea.val());
                var shjson = stringifyInner(textValue);

                APP.patchText(shjson);

                if (APP.realtime.getUserDoc() !== shjson) {
                    console.error("realtime.getUserDoc() !== shjson");
                }
            };

            var onModeChanged = function (mode) {
                var $codeMirror = $iframe.find('.CodeMirror');
                window.clearTimeout(APP.previewTo);
                $codeMirror.addClass('transition');
                APP.previewTo = window.setTimeout(function () {
                    $codeMirror.removeClass('transition');
                }, 500);
                if (mode === "markdown") {
                    APP.$previewButton.show();
                    Cryptpad.getPadAttribute('previewMode', function (e, data) {
                        if (e) { return void console.error(e); }
                        if (data !== false) {
                            $previewContainer.show();
                            $codeMirror.removeClass('fullPage');
                        }
                    });
                    return;
                }
                APP.$previewButton.hide();
                $previewContainer.hide();
                $codeMirror.addClass('fullPage');
            };

            config.onInit = function (info) {
                UserList = Cryptpad.createUserList(info, config.onLocal, Cryptget, Cryptpad);

                var titleCfg = { getHeadingText: CodeMirror.getHeadingText };
                Title = Cryptpad.createTitle(titleCfg, config.onLocal, Cryptpad);

                Metadata = Cryptpad.createMetadata(UserList, Title);

                var configTb = {
                    displayed: ['title', 'useradmin', 'spinner', 'lag', 'state', 'share', 'userlist', 'newpad', 'limit', 'upgrade'],
                    userList: UserList.getToolbarConfig(),
                    share: {
                        secret: secret,
                        channel: info.channel
                    },
                    title: Title.getTitleConfig(),
                    common: Cryptpad,
                    readOnly: readOnly,
                    ifrw: ifrw,
                    realtime: info.realtime,
                    network: info.network,
                    $container: $bar
                };
                toolbar = APP.toolbar = Toolbar.create(configTb);

                Title.setToolbar(toolbar);
                CodeMirror.init(config.onLocal, Title, toolbar);

                var $rightside = toolbar.$rightside;

                var editHash;
                if (!readOnly) {
                    editHash = Cryptpad.getEditHashFromKeys(info.channel, secret.keys);
                }

                /* add a history button */
                var histConfig = {
                    onLocal: config.onLocal,
                    onRemote: config.onRemote,
                    setHistory: setHistory,
                    applyVal: function (val) {
                        var remoteDoc = JSON.parse(val || '{}').content;
                        editor.setValue(remoteDoc || '');
                        editor.save();
                    },
                    $toolbar: $bar
                };
                var $hist = Cryptpad.createButton('history', true, {histConfig: histConfig});
                $rightside.append($hist);

                /* save as template */
                if (!Cryptpad.isTemplate(window.location.href)) {
                    var templateObj = {
                        rt: info.realtime,
                        Crypt: Cryptget,
                        getTitle: Title.getTitle
                    };
                    var $templateButton = Cryptpad.createButton('template', true, templateObj);
                    $rightside.append($templateButton);
                }

                /* add an export button */
                var $export = Cryptpad.createButton('export', true, {}, CodeMirror.exportText);
                $rightside.append($export);

                if (!readOnly) {
                    /* add an import button */
                    var $import = Cryptpad.createButton('import', true, {}, CodeMirror.importText);
                    $rightside.append($import);
                }

                /* add a forget button */
                var forgetCb = function (err) {
                    if (err) { return; }
                    setEditable(false);
                };
                var $forgetPad = Cryptpad.createButton('forget', true, {}, forgetCb);
                $rightside.append($forgetPad);

                var $previewButton = APP.$previewButton = Cryptpad.createButton(null, true);
                $previewButton.removeClass('fa-question').addClass('fa-eye');
                $previewButton.attr('title', Messages.previewButtonTitle);
                $previewButton.click(function () {
                    var $codeMirror = $iframe.find('.CodeMirror');
                    window.clearTimeout(APP.previewTo);
                    $codeMirror.addClass('transition');
                    APP.previewTo = window.setTimeout(function () {
                        $codeMirror.removeClass('transition');
                    }, 500);
                    if (CodeMirror.highlightMode !== 'markdown') {
                        $previewContainer.show();
                    }
                    $previewContainer.toggle();
                    if ($previewContainer.is(':visible')) {
                        forceDrawPreview();
                        $codeMirror.removeClass('fullPage');
                        Cryptpad.setPadAttribute('previewMode', true, function (e) {
                            if (e) { return console.log(e); }
                        });
                    } else {
                        $codeMirror.addClass('fullPage');
                        Cryptpad.setPadAttribute('previewMode', false, function (e) {
                            if (e) { return console.log(e); }
                        });
                    }
                });
                $rightside.append($previewButton);

                if (!readOnly) {
                    CodeMirror.configureTheme(function () {
                        CodeMirror.configureLanguage(null, onModeChanged);
                    });
                }
                else {
                    CodeMirror.configureTheme();
                }


                // set the hash
                if (!readOnly) { Cryptpad.replaceHash(editHash); }
            };

            config.onReady = function (info) {
                if (APP.realtime !== info.realtime) {
                    var realtime = APP.realtime = info.realtime;
                    APP.patchText = TextPatcher.create({
                        realtime: realtime,
                        //logging: true
                    });
                }

                var userDoc = APP.realtime.getUserDoc();

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
                        CodeMirror.setMode(hjson.highlightMode, onModeChanged);
                    }
                }

                if (!CodeMirror.highlightMode) {
                    CodeMirror.setMode('markdown', onModeChanged);
                    console.log("%s => %s", CodeMirror.highlightMode, CodeMirror.$language.val());
                }

                // Update the user list (metadata) from the hyperjson
                Metadata.update(userDoc);

                if (newDoc) {
                    editor.setValue(newDoc);
                }

                if (Cryptpad.initialName && Title.isDefaultTitle()) {
                    Title.updateTitle(Cryptpad.initialName);
                }

                Cryptpad.getPadAttribute('previewMode', function (e, data) {
                    if (e) { return void console.error(e); }
                    if (data === false && APP.$previewButton) {
                        APP.$previewButton.click();
                    }
                });

                Cryptpad.removeLoadingScreen();
                setEditable(true);
                initializing = false;

                onLocal(); // push local state to avoid parse errors later.

                if (readOnly) {
                    config.onRemote();
                    return;
                }
                UserList.getLastName(toolbar.$userNameButton, isNew);
            };

            config.onRemote = function () {
                if (initializing) { return; }
                if (isHistoryMode) { return; }

                var oldDoc = canonicalize(CodeMirror.$textarea.val());
                var shjson = APP.realtime.getUserDoc();

                // Update the user list (metadata) from the hyperjson
                Metadata.update(shjson);

                var hjson = JSON.parse(shjson);
                var remoteDoc = hjson.content;

                var highlightMode = hjson.highlightMode;
                if (highlightMode && highlightMode !== APP.highlightMode) {
                    CodeMirror.setMode(highlightMode, onModeChanged);
                }

                CodeMirror.setValueAndCursor(oldDoc, remoteDoc, TextPatcher);
                drawPreview();

                if (!readOnly) {
                    var textValue = canonicalize(CodeMirror.$textarea.val());
                    var shjson2 = stringifyInner(textValue);
                    if (shjson2 !== shjson) {
                        console.error("shjson2 !== shjson");
                        TextPatcher.log(shjson, TextPatcher.diff(shjson, shjson2));
                        APP.patchText(shjson2);
                    }
                }
                if (oldDoc !== remoteDoc) { Cryptpad.notify(); }
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

            APP.realtime = Realtime.start(config);

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
