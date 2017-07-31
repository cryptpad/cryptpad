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
    '/slide/slide.js',

    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less/cryptpad.less',
], function ($, Crypto, Realtime, TextPatcher, Toolbar, JSONSortify, JsonOT, Cryptpad, Cryptget, Slide) {
    var Messages = Cryptpad.Messages;

    var module = window.APP = {
        Cryptpad: Cryptpad,
        TextPatcher: TextPatcher,
        Slide: Slide,
    };
    var APP = window.APP;

    var SLIDE_BACKCOLOR_ID = "cryptpad-backcolor";
    var SLIDE_COLOR_ID = "cryptpad-color";


    $(function () {
        Cryptpad.addLoadingScreen();

        var stringify = function (obj) {
            return JSONSortify(obj);
        };
        var ifrw = module.ifrw = $('#pad-iframe')[0].contentWindow;
        var toolbar;
        var editor;

        var secret = Cryptpad.getSecrets();
        var readOnly = secret.keys && !secret.keys.editKeyStr;
        Slide.readOnly = readOnly;
        if (!secret.keys) {
            secret.keys = secret.key;
        }

        var presentMode = Slide.isPresentURL();

        var onConnectError = function () {
            Cryptpad.errorLoadingScreen(Messages.websocketError);
        };

        var andThen = function (CMeditor) {
            var $iframe = $('#pad-iframe').contents();
            var $contentContainer = $iframe.find('#editorContainer');
            var CodeMirror = Cryptpad.createCodemirror(ifrw, Cryptpad, null, CMeditor);
            editor = CodeMirror.editor;

            var $bar = $('#pad-iframe')[0].contentWindow.$('#cme_toolbox');
            var $pad = $('#pad-iframe');

            var isHistoryMode = false;

            var setEditable = module.setEditable = function (bool) {
                if (readOnly && bool) { return; }
                editor.setOption('readOnly', !bool);
            };

            var Title;
            var UserList;
            var Metadata;

            var setTabTitle = function (title) {
                var slideNumber = '';
                if (Slide.shown) { //Slide.index && Slide.content.length) {
                    slideNumber = ' (' + Slide.index + '/' + Slide.content.length + ')';
                }
                document.title = title + slideNumber;
            };

            var initialState = Messages.slideInitialState;

            var $modal = $pad.contents().find('#modal');
            var $content = $pad.contents().find('#content');
            var $print = $pad.contents().find('#print');
            var slideOptions = {};

            $content.click(function (e) {
                if (!e.target) { return; }
                var $t = $(e.target);
                if ($t.is('a') || $t.parents('a').length) {
                    e.preventDefault();
                    var $a = $t.is('a') ? $t : $t.parents('a').first();
                    var href = $a.attr('href');
                    window.open(href);
                }
            });

            Slide.setModal(APP, $modal, $content, $pad, ifrw, slideOptions, initialState);

            var enterPresentationMode = function (shouldLog) {
                Slide.show(true, editor.getValue());
                if (shouldLog) {
                    Cryptpad.log(Messages.presentSuccess);
                }
            };

            if (presentMode) {
                enterPresentationMode(true);
            }

            var textColor;
            var backColor;

            var config = {
                initialState: '{}',
                websocketURL: Cryptpad.getWebsocketURL(),
                channel: secret.channel,
                // our public key
                validateKey: secret.keys.validateKey || undefined,
                readOnly: readOnly,
                crypto: Crypto.createEncryptor(secret.keys),
                transformFunction: JsonOT.validate,
                network: Cryptpad.getNetwork()
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
                        defaultTitle: Title.defaultTitle,
                        slideOptions: slideOptions
                    }
                };
                if (!initializing) {
                    obj.metadata.title = Title.title;
                }
                if (textColor) {
                    obj.metadata.color = textColor;
                }
                if (backColor) {
                    obj.metadata.backColor = backColor;
                }
                // stringify the json and send it into chainpad
                return stringify(obj);
            };

            var onLocal = config.onLocal = function () {
                if (initializing) { return; }
                if (isHistoryMode) { return; }
                if (readOnly) { return; }

                editor.save();

                var textValue = canonicalize(CodeMirror.$textarea.val());
                var shjson = stringifyInner(textValue);

                module.patchText(shjson);
                Slide.update(textValue);

                if (module.realtime.getUserDoc() !== shjson) {
                    console.error("realtime.getUserDoc() !== shjson");
                }
            };

            var metadataCfg = {
                slideOptions: function (newOpt) {
                    if (stringify(newOpt) !== stringify(slideOptions)) {
                        $.extend(slideOptions, newOpt);
                        // TODO: manage realtime + cursor in the "options" modal ??
                        Slide.updateOptions();
                    }
                }
            };
            var updateColors = metadataCfg.slideColors = function (text, back) {
                if (text) {
                    textColor = text;
                    $modal.css('color', text);
                    $modal.css('border-color', text);
                    $pad.contents().find('#' + SLIDE_COLOR_ID).css('color', text);
                }
                if (back) {
                    backColor = back;
                    $modal.css('background-color', back);
                    //$pad.contents().find('#' + SLIDE_COLOR_ID).css('background', back);
                    $pad.contents().find('#' + SLIDE_BACKCOLOR_ID).css('color', back);
                }
            };

            var createFileDialog = function () {
                var $body = $iframe.find('body');
                var $block = $body.find('#fileDialog');
                if (!$block.length) {
                    $block = $('<div>', {id: "fileDialog"}).appendTo($body);
                }
                $block.html('');
                $('<span>', {
                    'class': 'close fa fa-times',
                    'title': Messages.filePicker_close
                }).click(function () {
                    $block.hide();
                }).appendTo($block);
                var $description = $('<p>').text(Messages.filePicker_description);
                $block.append($description);
                var $filter = $('<p>').appendTo($block);
                var $container = $('<span>', {'class': 'fileContainer'}).appendTo($block);
                var updateContainer = function () {
                    $container.html('');
                    var filter = $filter.find('.filter').val().trim();
                    var list = Cryptpad.getUserFilesList();
                    var fo = Cryptpad.getFO();
                    list.forEach(function (id) {
                        var data = fo.getFileData(id);
                        var name = fo.getTitle(id);
                        if (filter && name.toLowerCase().indexOf(filter.toLowerCase()) === -1) {
                            return;
                        }
                        var $span = $('<span>', {'class': 'element'}).appendTo($container);
                        var $inner = $('<span>').text(name);
                        $span.append($inner).click(function () {
                            var parsed = Cryptpad.parsePadUrl(data.href);
                            var hexFileName = Cryptpad.base64ToHex(parsed.hashData.channel);
                            var src = '/blob/' + hexFileName.slice(0,2) + '/' + hexFileName;
                            var mt = '<media-tag src="' + src + '" data-crypto-key="cryptpad:' + parsed.hashData.key + '"></media-tag>';
                            editor.replaceSelection(mt);
                            //var cleanName = name.replace(/[\[\]]/g, '');
                            //var text = '!['+cleanName+']('+data.href+')';
                            //editor.replaceSelection(text);
                            $block.hide();
                        });
                    });
                };
                var to;
                $('<input>', {
                    type: 'text',
                    'class': 'filter',
                    'placeholder': Messages.filePicker_filter
                }).appendTo($filter).on('keypress', function () {
                    if (to) { window.clearTimeout(to); }
                    to = window.setTimeout(updateContainer, 300);
                });
                $filter.append(' '+Messages.or+' ');
                var data = {FM: APP.FM};
                $filter.append(Cryptpad.createButton('upload', false, data, function () {
                    $block.hide();
                }));
                updateContainer();
                $body.keydown(function (e) {
                    if (e.which === 27) { $block.hide(); }
                });
                $block.show();
            };

            var createPrintDialog = function () {
                var slideOptionsTmp = {
                    title: false,
                    slide: false,
                    date: false,
                    transition: true,
                    style: ''
                };

                $.extend(slideOptionsTmp, slideOptions);
                var $container = $('<div class="alertify">');
                var $container2 = $('<div class="dialog">').appendTo($container);
                var $div = $('<div id="printOptions">').appendTo($container2);
                var $p = $('<p>', {'class': 'msg'}).appendTo($div);
                $('<b>').text(Messages.printOptions).appendTo($p);
                $p.append($('<br>'));
                // Slide number
                $('<input>', {type: 'checkbox', id: 'checkNumber', checked: slideOptionsTmp.slide}).on('change', function () {
                    var c = this.checked;
                    console.log(c);
                    slideOptionsTmp.slide = c;
                }).appendTo($p).css('width', 'auto');
                $('<label>', {'for': 'checkNumber'}).text(Messages.printSlideNumber).appendTo($p);
                $p.append($('<br>'));
                // Date
                $('<input>', {type: 'checkbox', id: 'checkDate', checked: slideOptionsTmp.date}).on('change', function () {
                    var c = this.checked;
                    slideOptionsTmp.date = c;
                }).appendTo($p).css('width', 'auto');
                $('<label>', {'for': 'checkDate'}).text(Messages.printDate).appendTo($p);
                $p.append($('<br>'));
                // Title
                $('<input>', {type: 'checkbox', id: 'checkTitle', checked: slideOptionsTmp.title}).on('change', function () {
                    var c = this.checked;
                    slideOptionsTmp.title = c;
                }).appendTo($p).css('width', 'auto');
                $('<label>', {'for': 'checkTitle'}).text(Messages.printTitle).appendTo($p);
                $p.append($('<br>'));
                // Transition
                $('<input>', {type: 'checkbox', id: 'checkTransition', checked: slideOptionsTmp.transition}).on('change', function () {
                    var c = this.checked;
                    slideOptionsTmp.transition = c;
                }).appendTo($p).css('width', 'auto');
                $('<label>', {'for': 'checkTransition'}).text(Messages.printTransition).appendTo($p);
                $p.append($('<br>'));
                // CSS
                $('<label>', {'for': 'cssPrint'}).text(Messages.printCSS).appendTo($p);
                $p.append($('<br>'));
                var $textarea = $('<textarea>', {'id':'cssPrint'}).css({'width':'100%', 'height':'100px'}).appendTo($p)
                    .on('keydown keyup', function (e) {
                        e.stopPropagation();
                    });
                $textarea.val(slideOptionsTmp.style);
                window.setTimeout(function () { $textarea.focus(); }, 0);

                var h;

                var todo = function () {
                    $.extend(slideOptions, slideOptionsTmp);
                    slideOptions.style = $textarea.val();
                    onLocal();
                    $container.remove();
                    Cryptpad.stopListening(h);
                };
                var todoCancel = function () {
                    $container.remove();
                    Cryptpad.stopListening(h);
                };

                h = Cryptpad.listenForKeys(todo, todoCancel);

                var $nav = $('<nav>').appendTo($div);
                $('<button>', {'class': 'cancel'}).text(Messages.cancelButton).appendTo($nav).click(todoCancel);
                $('<button>', {'class': 'ok'}).text(Messages.settings_save).appendTo($nav).click(todo);

                return $container;
            };

            config.onInit = function (info) {
                UserList = Cryptpad.createUserList(info, config.onLocal, Cryptget, Cryptpad);

                var titleCfg = {
                    updateLocalTitle: setTabTitle,
                    getHeadingText: CodeMirror.getHeadingText
                };
                Title = Cryptpad.createTitle(titleCfg, config.onLocal, Cryptpad);

                Metadata = Cryptpad.createMetadata(UserList, Title, metadataCfg, Cryptpad);

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
                    $container: $bar,
                    $contentContainer: $contentContainer
                };
                toolbar = module.toolbar = Toolbar.create(configTb);

                Title.setToolbar(toolbar);
                CodeMirror.init(config.onLocal, Title, toolbar);

                var $rightside = toolbar.$rightside;
                var $drawer = toolbar.$drawer;

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
                var $export = Cryptpad.createButton('export', true, {}, CodeMirror.exportText);
                $drawer.append($export);

                if (!readOnly) {
                    /* add an import button */
                    var $import = Cryptpad.createButton('import', true, {}, CodeMirror.importText);
                    $drawer.append($import);
                }

                /* add a forget button */
                var forgetCb = function (err) {
                    if (err) { return; }
                    setEditable(false);
                };
                var $forgetPad = Cryptpad.createButton('forget', true, {}, forgetCb);
                $rightside.append($forgetPad);

                $('<button>', {
                    title: Messages.filePickerButton,
                    'class': 'rightside-button fa fa-picture-o',
                    style: 'font-size: 17px'
                }).click(function () {
                    $('body').append(createFileDialog());
                }).appendTo($rightside);

                var $previewButton = APP.$previewButton = Cryptpad.createButton(null, true);
                $previewButton.removeClass('fa-question').addClass('fa-eye');
                $previewButton.attr('title', Messages.previewButtonTitle);
                $previewButton.click(function () {
                    var $c = $iframe.find('#editorContainer');
                    if ($c.hasClass('preview')) {
                        Cryptpad.setPadAttribute('previewMode', false, function (e) {
                            if (e) { return console.log(e); }
                        });
                        $previewButton.removeClass('active');
                        return void $c.removeClass('preview');
                    }
                    Cryptpad.setPadAttribute('previewMode', true, function (e) {
                        if (e) { return console.log(e); }
                    });
                    $c.addClass('preview');
                    $previewButton.addClass('active');
                    Slide.updateFontSize();
                });
                $rightside.append($previewButton);

                var $printButton = $('<button>', {
                    title: Messages.printButtonTitle,
                    'class': 'rightside-button fa fa-print',
                    style: 'font-size: 17px'
                }).click(function () {
                    Slide.update(editor.getValue(), true);
                    $print.html($content.html());
                    Cryptpad.confirm("Are you sure you want to print?", function (yes) {
                        if (yes) {
                            window.frames["pad-iframe"].focus();
                            window.frames["pad-iframe"].print();
                        }
                    }, {ok: Messages.printButton});
                    Cryptpad.feedback('PRINT_SLIDES');
                    //$('body').append(createPrintDialog());
                }).append($('<span>', {'class': 'drawer'}).text(Messages.printText));

                // TODO reenable this when it is working again
                $printButton = $printButton;
                //$drawer.append($printButton);

                var $slideOptions = $('<button>', {
                    title: Messages.slideOptionsTitle,
                    'class': 'rightside-button fa fa-cog',
                    style: 'font-size: 17px'
                }).click(function () {
                    $('body').append(createPrintDialog());
                }).append($('<span>', {'class': 'drawer'}).text(Messages.slideOptionsText));
                $drawer.append($slideOptions);

                var $present = Cryptpad.createButton('present', true)
                    .click(function () {
                    enterPresentationMode(true);
                });
                if (presentMode) {
                    $present.hide();
                }
                $rightside.append($present);

                var configureColors = function () {
                    var $back = $('<button>', {
                        id: SLIDE_BACKCOLOR_ID,
                        'class': 'fa fa-square rightside-button',
                        'style': 'font-family: FontAwesome; color: #000;',
                        title: Messages.backgroundButtonTitle
                    });
                    var $text = $('<button>', {
                        id: SLIDE_COLOR_ID,
                        'class': 'fa fa-i-cursor rightside-button',
                        'style': 'font-family: FontAwesome; font-weight: bold; color: #fff;',
                        title: Messages.colorButtonTitle
                    });
                    var $testColor = $('<input>', { type: 'color', value: '!' });
                    var $check = $pad.contents().find("#colorPicker_check");
                    if ($testColor.attr('type') !== "color" || $testColor.val() === '!') { return; }
                    $back.on('click', function() {
                        var $picker = $('<input>', { type: 'color', value: backColor })
                            .css({ display: 'none', })
                            .on('change', function() {
                                updateColors(undefined, this.value);
                                onLocal();
                            });
                        $check.append($picker);
                        setTimeout(function() {
                            $picker.click();
                        }, 0);
                    });
                    $text.on('click', function() {
                        var $picker = $('<input>', { type: 'color', value: textColor })
                            .css({ display: 'none', })
                            .on('change', function() {
                                updateColors(this.value, undefined);
                                onLocal();
                                $check.html('');
                            });
                        $check.append($picker);
                        setTimeout(function() {
                            $picker.click();
                        }, 0);
                    });

                    $rightside.append($back).append($text);
                };

                configureColors();
                CodeMirror.configureTheme();

                if (presentMode) {
                    $('#top-bar').hide();
                }

                // set the hash
                if (!window.location.hash || window.location.hash === '#') {
                    Cryptpad.replaceHash(editHash);
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
                    newDoc = hjson.content;

                    if (typeof (hjson) !== 'object' || Array.isArray(hjson) ||
                        (typeof(hjson.type) !== 'undefined' && hjson.type !== 'slide')) {
                        var errorText = Messages.typeError;
                        Cryptpad.errorLoadingScreen(errorText);
                        throw new Error(errorText);
                    }

                    if (hjson.highlightMode) {
                        CodeMirror.setMode(hjson.highlightMode);
                    }
                }
                if (!CodeMirror.highlightMode) {
                    CodeMirror.setMode('markdown');
                }

                // Update the user list (metadata) from the hyperjson
                Metadata.update(userDoc);
                editor.setValue(newDoc || initialState);

                if (Cryptpad.initialName && Title.isDefaultTitle()) {
                    Title.updateTitle(Cryptpad.initialName);
                }

                Cryptpad.getPadAttribute('previewMode', function (e, data) {
                    if (e) { return void console.error(e); }
                    if ([true, undefined].indexOf(data) !== -1 && APP.$previewButton) {
                        APP.$previewButton.click();
                    }
                });

                Slide.onChange(function (o, n, l) {
                    var slideNumber = '';
                    if (n !== null) {
                        if (Slide.shown) { //Slide.index && Slide.content.length) {
                            slideNumber = ' (' + (++n) + '/' + l + ')';
                        }
                    }
                    document.title = Title.title + slideNumber;
                });

                Cryptpad.removeLoadingScreen();
                setEditable(true);
                initializing = false;

                onLocal(); // push local state to avoid parse errors later.
                Slide.update(editor.getValue());

                if (readOnly) { return; }
                UserList.getLastName(toolbar.$userNameButton, isNew);

                var fmConfig = {
                    dropArea: $iframe.find('.CodeMirror'),
                    body: $iframe.find('body'),
                    onUploaded: function (ev, data) {
                        //var cursor = editor.getCursor();
                        //var cleanName = data.name.replace(/[\[\]]/g, '');
                        //var text = '!['+cleanName+']('+data.url+')';
                        var parsed = Cryptpad.parsePadUrl(data.url);
                        var hexFileName = Cryptpad.base64ToHex(parsed.hashData.channel);
                        var src = '/blob/' + hexFileName.slice(0,2) + '/' + hexFileName;
                        var mt = '<media-tag src="' + src + '" data-crypto-key="cryptpad:' + parsed.hashData.key + '"></media-tag>';
                        editor.replaceSelection(mt);
                    }
                };
                APP.FM = Cryptpad.createFileManager(fmConfig);
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

                var highlightMode = hjson.highlightMode;
                if (highlightMode && highlightMode !== CodeMirror.highlightMode) {
                    CodeMirror.setMode(highlightMode);
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
                Slide.update(remoteDoc);

                if (oldDoc !== remoteDoc) {
                    Cryptpad.notify();
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
