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
], function ($, Crypto, Realtime, TextPatcher, Toolbar, JSONSortify, JsonOT, Cryptpad,
             Cryptget, DiffMd) {
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
        var editor;
        var $iframe = $('#pad-iframe').contents();
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

        var secret = Cryptpad.getSecrets();
        var readOnly = secret.keys && !secret.keys.editKeyStr;
        if (!secret.keys) {
            secret.keys = secret.key;
        }

        var onConnectError = function () {
            Cryptpad.errorLoadingScreen(Messages.websocketError);
        };

        var andThen = function (CMeditor) {
            var CodeMirror = Cryptpad.createCodemirror(CMeditor, ifrw, Cryptpad);
            editor = CodeMirror.editor;

            var $bar = $('#pad-iframe')[0].contentWindow.$('#cme_toolbox');

            var isHistoryMode = false;

            var setEditable = module.setEditable = function (bool) {
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

            var onLocal = config.onLocal = function () {
                if (initializing) { return; }
                if (isHistoryMode) { return; }
                if (readOnly) { return; }

                editor.save();

                DiffMd.apply(DiffMd.render(editor.getValue()), $preview);

                var textValue = canonicalize(CodeMirror.$textarea.val());
                var shjson = stringifyInner(textValue);

                module.patchText(shjson);

                if (module.realtime.getUserDoc() !== shjson) {
                    console.error("realtime.getUserDoc() !== shjson");
                }
            };

            var onModeChanged = function (mode) {
            if (mode === "markdown") {
                    APP.$previewButton.show();
                    $preview.show();
                    return;
                }
                APP.$previewButton.hide();
                $preview.hide();
            };

            config.onInit = function (info) {
                UserList = Cryptpad.createUserList(info, config.onLocal, Cryptget, Cryptpad);

                var titleCfg = { getHeadingText: CodeMirror.getHeadingText };
                Title = Cryptpad.createTitle(titleCfg, config.onLocal, Cryptpad);

                Metadata = Cryptpad.createMetadata(UserList, Title);

                var configTb = {
                    displayed: ['title', 'useradmin', 'spinner', 'lag', 'state', 'share', 'userlist', 'newpad', 'limit'],
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
                toolbar = module.toolbar = Toolbar.create(configTb);

                Title.setToolbar(toolbar);
                CodeMirror.init(config.onLocal, Title, toolbar);

                var $rightside = toolbar.$rightside;

                var editHash;
                if (!readOnly) {
                    editHash = Cryptpad.getEditHashFromKeys(info.channel, secret.keys);
                }

                /* add a history button */
                var histConfig = {
                    onLocal: config.onLocal(),
                    onRemote: config.onRemote(),
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
                $previewButton.attr('title', 'TODO Preview'); //TODO
                $previewButton.click(function () {
                    if (CodeMirror.highlightMode !== 'markdown') {
                        return void $preview.hide();
                    }
                    $preview.toggle();
                });
                $rightside.append($previewButton);

                if (!readOnly) {
                    CodeMirror.configureLanguage(CodeMirror.configureTheme, onModeChanged);
                }
                else {
                    CodeMirror.configureTheme();
                }

                // set the hash
                if (!readOnly) { Cryptpad.replaceHash(editHash); }
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

                Cryptpad.removeLoadingScreen();
                setEditable(true);
                initializing = false;

                onLocal(); // push local state to avoid parse errors later.

                if (readOnly) { return; }
                UserList.getLastName(toolbar.$userNameButton, isNew);
            };

            config.onRemote = function () {
                if (initializing) { return; }
                if (isHistoryMode) { return; }

                var oldDoc = canonicalize(CodeMirror.$textarea.val());
                var shjson = module.realtime.getUserDoc();

                // Update the user list (metadata) from the hyperjson
                Metadata.update(shjson);

                var hjson = JSON.parse(shjson);
                var remoteDoc = hjson.content;

                DiffMd.apply(DiffMd.render(remoteDoc), $preview);

                var highlightMode = hjson.highlightMode;
                if (highlightMode && highlightMode !== module.highlightMode) {
                    CodeMirror.setMode(highlightMode, onModeChanged);
                }

                CodeMirror.setValueAndCursor(oldDoc, remoteDoc, TextPatcher);

                if (!readOnly) {
                    var textValue = canonicalize(CodeMirror.$textarea.val());
                    var shjson2 = stringifyInner(textValue);
                    if (shjson2 !== shjson) {
                        console.error("shjson2 !== shjson");
                        TextPatcher.log(shjson, TextPatcher.diff(shjson, shjson2));
                        module.patchText(shjson2);
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
