define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/toolbar3.js',
    '/common/cryptpad-common.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-realtime.js',

    '/file/file-crypto.js',
    '/common/media-tag.js',

    '/bower_components/file-saver/FileSaver.min.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less2/main.less',

], function (
    $,
    Crypto,
    Toolbar,
    Cryptpad,
    nThen,
    SFCommon,
    CommonRealtime,
    FileCrypto,
    MediaTag)
{
    var Messages = Cryptpad.Messages;
    var saveAs = window.saveAs;
    var Nacl = window.nacl;

    var APP = window.APP = {
        Cryptpad: Cryptpad,
    };

    var andThen = function (common) {
        var $appContainer = $('#cp-app-file-content');
        var $form = $('#cp-app-file-upload-form');
        var $dlform = $('#cp-app-file-download-form');
        var $dlview = $('#cp-app-file-download-view');
        var $label = $form.find('label');
        var $dllabel = $dlform.find('label span');
        var $progress = $('#cp-app-file-dlprogress');
        var $bar = $('.cp-toolbar-container');
        var $body = $('body');

        $body.on('dragover', function (e) { e.preventDefault(); });
        $body.on('drop', function (e) { e.preventDefault(); });

        var uploadMode = false;
        var secret;
        var hexFileName;
        var metadataMgr = common.getMetadataMgr();
        var priv = metadataMgr.getPrivateData();

        if (!priv.filehash) {
            uploadMode = true;
        } else {
            secret = Cryptpad.getSecrets('file', priv.filehash);
            if (!secret.keys) { throw new Error("You need a hash"); }
            hexFileName = Cryptpad.base64ToHex(secret.channel);
        }

        var Title = common.createTitle({});
        var displayed = ['useradmin', 'newpad', 'limit', 'upgrade'];
        if (!uploadMode) {
            displayed.push('fileshare');
        }
        var configTb = {
            displayed: displayed,
            common: Cryptpad,
            //hideDisplayName: true,
            $container: $bar,
            metadataMgr: metadataMgr,
            sfCommon: common,
        };
        if (uploadMode) {
            displayed.push('pageTitle'); //TODO in toolbar
            configTb.pageTitle = Messages.upload_title;
        }
        var toolbar = APP.toolbar = Toolbar.create(configTb);
        toolbar.$rightside.html('');

        if (!uploadMode) {
            var src = Cryptpad.getBlobPathFromHex(hexFileName);
            var cryptKey = secret.keys && secret.keys.fileKeyStr;
            var key = Nacl.util.decodeBase64(cryptKey);

            FileCrypto.fetchDecryptedMetadata(src, key, function (e, metadata) {
                if (e) { return void console.error(e); }
                var title = document.title = metadata.name;
                Title.updateTitle(title || Title.defaultTitle);
                toolbar.addElement(['pageTitle'], {pageTitle: title});

                var displayFile = function (ev, sizeMb, CB) {
                    var called_back;
                    var cb = function (e) {
                        if (called_back) { return; }
                        called_back = true;
                        if (CB) { CB(e); }
                    };

                    var $mt = $dlview.find('media-tag');
                    var cryptKey = secret.keys && secret.keys.fileKeyStr;
                    var hexFileName = Cryptpad.base64ToHex(secret.channel);
                    $mt.attr('src', '/blob/' + hexFileName.slice(0,2) + '/' + hexFileName);
                    $mt.attr('data-crypto-key', 'cryptpad:'+cryptKey);

                    var rightsideDisplayed = false;

                    $(window.document).on('decryption', function (e) {
                        var decrypted = e.originalEvent;
                        if (decrypted.callback) {
                            decrypted.callback();
                        }

                        console.log(decrypted);
                        $dlview.show();
                        $dlform.hide();
                        var $dlButton = $dlview.find('media-tag button');
                        if (ev) { $dlButton.click(); }
                        if (!$dlButton.length) {
                            $appContainer.css('background', 'white');
                        }
                        $dlButton.addClass('btn btn-success');
                        var text = Messages.download_mt_button + '<br>';
                        text += '<b>' + Cryptpad.fixHTML(title) + '</b><br>';
                        text += '<em>' + Messages._getKey('formattedMB', [sizeMb]) + '</em>';
                        $dlButton.html(text);

                        if (!rightsideDisplayed) {
                            toolbar.$rightside
                            .append(common.createButton('export', true, {}, function () {
                                saveAs(decrypted.blob, decrypted.metadata.name);
                            }))
                            .append(common.createButton('forget', true, {}, function () {
                                // not sure what to do here
                            }));
                            rightsideDisplayed = true;
                        }

                        // make pdfs big
                        var toolbarHeight = $('#cp-toolbar').height();
                        var $another_iframe = $('media-tag iframe').css({
                            'height': 'calc(100vh - ' + toolbarHeight + 'px)',
                            'width': '100vw',
                            'position': 'absolute',
                            'bottom': 0,
                            'left': 0,
                            'border': 0
                        });

                        if ($another_iframe.length) {
                            $another_iframe.load(function () {
                                cb();
                            });
                        } else {
                            cb();
                        }
                    })
                    .on('decryptionError', function (e) {
                        var error = e.originalEvent;
                        //Cryptpad.alert(error.message);
                        cb(error.message);
                    })
                    .on('decryptionProgress', function (e) {
                        var progress = e.originalEvent;
                        var p = progress.percent +'%';
                        $progress.width(p);
                        console.log(progress.percent);
                    });

                    /**
                     * Allowed mime types that have to be set for a rendering after a decryption.
                     *
                     * @type       {Array}
                     */
                    var allowedMediaTypes = [
                        'image/png',
                        'image/jpeg',
                        'image/jpg',
                        'image/gif',
                        'audio/mp3',
                        'audio/ogg',
                        'audio/wav',
                        'audio/webm',
                        'video/mp4',
                        'video/ogg',
                        'video/webm',
                        'application/pdf',
                        'application/dash+xml',
                        'download'
                    ];
                    MediaTag.CryptoFilter.setAllowedMediaTypes(allowedMediaTypes);

                    MediaTag($mt[0]);
                };

                var todoBigFile = function (sizeMb) {
                    $dlform.show();
                    Cryptpad.removeLoadingScreen();
                    $dllabel.append($('<br>'));
                    $dllabel.append(Cryptpad.fixHTML(metadata.name));

                    // don't display the size if you don't know it.
                    if (typeof(sizeM) === 'number') {
                        $dllabel.append($('<br>'));
                        $dllabel.append(Messages._getKey('formattedMB', [sizeMb]));
                    }
                    var decrypting = false;
                    var onClick = function (ev) {
                        if (decrypting) { return; }
                        decrypting = true;
                        displayFile(ev, sizeMb, function (err) {
                            if (err) { Cryptpad.alert(err); }
                        });
                    };
                    if (typeof(sizeMb) === 'number' && sizeMb < 5) { return void onClick(); }
                    $dlform.find('#cp-app-file-dlfile, #cp-app-file-dlprogress').click(onClick);
                };
                var href = priv.origin + priv.pathname + priv.filehash;
                common.getFileSize(href, function (e, data) {
                    if (e) {
                        return void Cryptpad.errorLoadingScreen(e);
                    }
                    var size = Cryptpad.bytesToMegabytes(data);
                    return void todoBigFile(size);
                });
            });
            return;
        }

        if (!common.isLoggedIn()) {
            // TODO
            return Cryptpad.alert(Messages.upload_mustLogin, function () {
                if (sessionStorage) {
                    sessionStorage.redirectTo = window.location.href;
                }
                window.location.href = '/login/';
            });
        }

        $form.css({
            display: 'block',
        });

        var fmConfig = {
            dropArea: $form,
            hoverArea: $label,
            body: $body,
            keepTable: true // Don't fadeOut the tbale with the uploaded files
        };

        var FM = common.createFileManager(fmConfig);

        $form.find("#cp-app-file-upfile").on('change', function (e) {
            var file = e.target.files[0];
            FM.handleFile(file);
        });

        // we're in upload mode
        Cryptpad.removeLoadingScreen();








        return;
        //===========================================================================
        var readOnly = false;
        var cpNfInner;
        var metadataMgr;
        var $bar = $('#cme_toolbox');

        var isHistoryMode = false;

        var setEditable = APP.setEditable = function (bool) {
            if (readOnly && bool) { return; }
            editor.setOption('readOnly', !bool);
        };

        var Title;

        var config = {
            readOnly: readOnly,
            transformFunction: JsonOT.validate,
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

        var canonicalize = function (t) { return t.replace(/\r\n/g, '\n'); };

        var setHistory = function (bool, update) {
            isHistoryMode = bool;
            setEditable(!bool);
            if (!bool && update) {
                config.onRemote();
            }
        };

        var $contentContainer = $('#cp-app-code-editor');
        var $previewContainer = $('#cp-app-code-preview');
        var $preview = $('#cp-app-code-preview-content');
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

        var setIndentation = APP.setIndentation = function (units, useTabs) {
            if (typeof(units) !== 'number') { return; }
            editor.setOption('indentUnit', units);
            editor.setOption('tabSize', units);
            editor.setOption('indentWithTabs', useTabs);
        };

        var indentKey = 'indentUnit';
        var useTabsKey = 'indentWithTabs';
        var updateIndentSettings = function () {
            if (!metadataMgr) { return; }
            var data = metadataMgr.getPrivateData().settings;
            data = data.codemirror || {};
            var indentUnit = data[indentKey];
            var useTabs = data[useTabsKey];
            setIndentation(
                typeof(indentUnit) === 'number'? indentUnit: 2,
                typeof(useTabs) === 'boolean'? useTabs: false);
        };

        CommonRealtime.onInfiniteSpinner(function () { setEditable(false); });

        setEditable(false);
        var initializing = true;

        var stringifyInner = function (textValue) {
            var obj = {
                content: textValue,
                metadata: metadataMgr.getMetadataLazy()
            };
            /*    metadata: {
                    users: UserList.userData,
                    defaultTitle: Title.defaultTitle
                }
            };
            if (!initializing) {
                obj.metadata.title = Title.title;
            }*/
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

        var mediaTagModes = [
            'markdown',
            'html',
            'htmlembedded',
            'htmlmixed',
            'index.html',
            'php',
            'velocity',
            'xml',
        ];

        var onModeChanged = function (mode) {
            var $codeMirror = $('.CodeMirror');
            window.clearTimeout(APP.previewTo);
            $codeMirror.addClass('transition');
            APP.previewTo = window.setTimeout(function () {
                $codeMirror.removeClass('transition');
            }, 500);
            if (mediaTagModes.indexOf(mode) !== -1) {
                $(APP.$mediaTagButton).show();
            } else { $(APP.$mediaTagButton).hide(); }

            if (mode === "markdown") {
                APP.$previewButton.show();
                common.getPadAttribute('previewMode', function (e, data) {
                    if (e) { return void console.error(e); }
                    if (data !== false) {
                        $previewContainer.show();
                        APP.$previewButton.addClass('active');
                        $codeMirror.removeClass('fullPage');
                    }
                });
                return;
            }
            APP.$previewButton.hide();
            $previewContainer.hide();
            APP.$previewButton.removeClass('active');
            $codeMirror.addClass('fullPage');
        };

        config.onInit = function (info) {
            metadataMgr.onChangeLazy(updateIndentSettings);
            updateIndentSettings();

            readOnly = metadataMgr.getPrivateData().readOnly;

            var titleCfg = { getHeadingText: CodeMirror.getHeadingText };
            Title = common.createTitle(titleCfg, config.onLocal);

            var configTb = {
                displayed: ['title', 'useradmin', 'spinner', 'share', 'userlist', 'newpad', 'limit'],
                title: Title.getTitleConfig(),
                metadataMgr: metadataMgr,
                readOnly: readOnly,
                ifrw: window,
                realtime: info.realtime,
                common: Cryptpad,
                sfCommon: common,
                $container: $bar,
                $contentContainer: $contentContainer
            };
            toolbar = APP.toolbar = Toolbar.create(configTb);
            Title.setToolbar(toolbar);
            CodeMirror.init(config.onLocal, Title, toolbar);

            var $rightside = toolbar.$rightside;
            var $drawer = toolbar.$drawer;

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
            var $hist = common.createButton('history', true, {histConfig: histConfig});
            $drawer.append($hist);

            /* save as template */
            if (!metadataMgr.getPrivateData().isTemplate) {
                var templateObj = {
                    rt: info.realtime,
                    getTitle: function () { return metadataMgr.getMetadata().title; }
                };
                var $templateButton = common.createButton('template', true, templateObj);
                $rightside.append($templateButton);
            }

            /* add an export button */
            var $export = common.createButton('export', true, {}, CodeMirror.exportText);
            $drawer.append($export);

            if (!readOnly) {
                /* add an import button */
                var $import = common.createButton('import', true, {}, CodeMirror.importText);
                $drawer.append($import);
            }

            /* add a forget button */
            var forgetCb = function (err) {
                if (err) { return; }
                setEditable(false);
            };
            var $forgetPad = common.createButton('forget', true, {}, forgetCb);
            $rightside.append($forgetPad);

            var $previewButton = APP.$previewButton = common.createButton(null, true);
            $previewButton.removeClass('fa-question').addClass('fa-eye');
            $previewButton.attr('title', Messages.previewButtonTitle);
            $previewButton.click(function () {
                var $codeMirror = $('.CodeMirror');
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
                    $codeMirror.removeClass('cp-ap-code-fullpage');
                    $previewButton.addClass('cp-toolbar-button-active');
                    common.setPadAttribute('previewMode', true, function (e) {
                        if (e) { return console.log(e); }
                    });
                } else {
                    $codeMirror.addClass('cp-app-code-fullpage');
                    $previewButton.removeClass('cp-toolbar-button-active');
                    common.setPadAttribute('previewMode', false, function (e) {
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

            if (!readOnly) {
                var fileDialogCfg = {
                    onSelect: function (data) {
                        if (data.type === 'file') {
                            var mt = '<media-tag src="' + data.src + '" data-crypto-key="cryptpad:' + data.key + '"></media-tag>';
                            editor.replaceSelection(mt);
                            return;
                        }
                    }
                };
                common.initFilePicker(fileDialogCfg);
                APP.$mediaTagButton = $('<button>', {
                    title: Messages.filePickerButton,
                    'class': 'cp-toolbar-rightside-button fa fa-picture-o',
                    style: 'font-size: 17px'
                }).click(function () {
                    var pickerCfg = {
                        types: ['file'],
                        where: ['root']
                    };
                    common.openFilePicker(pickerCfg);
                }).appendTo($rightside);
            }
        };

        config.onReady = function (info) {
            console.log('onready');
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
            if (userDoc !== "") {
                var hjson = JSON.parse(userDoc);

                if (hjson && hjson.metadata) {
                    metadataMgr.updateMetadata(hjson.metadata);
                }
                if (typeof (hjson) !== 'object' || Array.isArray(hjson) ||
                    (typeof(hjson.type) !== 'undefined' && hjson.type !== 'code')) {
                    var errorText = Messages.typeError;
                    Cryptpad.errorLoadingScreen(errorText);
                    throw new Error(errorText);
                }

                newDoc = hjson.content;

                if (hjson.highlightMode) {
                    CodeMirror.setMode(hjson.highlightMode, onModeChanged);
                }
            } else {
                Title.updateTitle(Cryptpad.initialName || Title.defaultTitle);
            }

            if (!CodeMirror.highlightMode) {
                CodeMirror.setMode('markdown', onModeChanged);
                //console.log("%s => %s", CodeMirror.highlightMode, CodeMirror.$language.val());
            }

            // Update the user list (metadata) from the hyperjson
            //Metadata.update(userDoc);

            if (newDoc) {
                editor.setValue(newDoc);
            }

            if (Cryptpad.initialName && Title.isDefaultTitle()) {
                Title.updateTitle(Cryptpad.initialName);
            }


            common.getPadAttribute('previewMode', function (e, data) {
                if (e) { return void console.error(e); }
                if (data === false && APP.$previewButton) {
                    APP.$previewButton.click();
                }
            });


/*
            // add the splitter
            if (!$iframe.has('.cp-splitter').length) {
                var $preview = $iframe.find('#previewContainer');
                var splitter = $('<div>', {
                    'class': 'cp-splitter'
                }).appendTo($preview);

                $preview.on('scroll', function() {
                    splitter.css('top', $preview.scrollTop() + 'px');
                });

                var $target = $iframe.find('.CodeMirror');

                splitter.on('mousedown', function (e) {
                    e.preventDefault();
                    var x = e.pageX;
                    var w = $target.width();

                    $iframe.on('mouseup mousemove', function handler(evt) {
                        if (evt.type === 'mouseup') {
                            $iframe.off('mouseup mousemove', handler);
                            return;
                        }
                        $target.css('width', (w - x + evt.pageX) + 'px');
                    });
                });
            }
*/

            Cryptpad.removeLoadingScreen();
            setEditable(!readOnly);
            initializing = false;

            onLocal(); // push local state to avoid parse errors later.

            if (readOnly) {
                config.onRemote();
                return;
            }

            if (isNew) {
                common.openTemplatePicker();
            }

            var fmConfig = {
                dropArea: $('.CodeMirror'),
                body: $('body'),
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
            APP.FM = common.createFileManager(fmConfig);
        };

        config.onRemote = function () {
            if (initializing) { return; }
            if (isHistoryMode) { return; }

            var oldDoc = canonicalize(CodeMirror.$textarea.val());
            var shjson = APP.realtime.getUserDoc();

            // Update the user list (metadata) from the hyperjson
            //Metadata.update(shjson);

            var hjson = JSON.parse(shjson);
            var remoteDoc = hjson.content;

            if (hjson.metadata) {
                metadataMgr.updateMetadata(hjson.metadata);
            }

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
            //toolbar.failed();
            if (info.state) {
                initializing = true;
                //toolbar.reconnecting(info.myId);
                Cryptpad.findOKButton().click();
            } else {
                Cryptpad.alert(Messages.common_connectionLost, undefined, true);
            }
        };

        config.onError = onConnectError;

        cpNfInner = common.startRealtime(config);
        metadataMgr = cpNfInner.metadataMgr;

        cpNfInner.onInfiniteSpinner(function () {
            setEditable(false);
            Cryptpad.confirm(Messages.realtime_unrecoverableError, function (yes) {
                if (!yes) { return; }
                common.gotoURL();
            });
        });

        editor.on('change', onLocal);

        Cryptpad.onLogout(function () { setEditable(false); });
    };

    var main = function () {
        var common;

        nThen(function (waitFor) {
            $(waitFor(function () {
                Cryptpad.addLoadingScreen();
            }));
            SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
        }).nThen(function (/*waitFor*/) {
            common.getSframeChannel().onReady(function () {
                andThen(common);
            });
        });
    };
    main();
});
