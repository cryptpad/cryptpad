define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/toolbar3.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-realtime.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/customize/messages.js',

    '/file/file-crypto.js',
    '/common/media-tag.js',

    '/bower_components/file-saver/FileSaver.min.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/file/app-file.less',

], function (
    $,
    Crypto,
    Toolbar,
    nThen,
    SFCommon,
    CommonRealtime,
    Util,
    Hash,
    UI,
    Messages,
    FileCrypto,
    MediaTag)
{
    var saveAs = window.saveAs;
    var Nacl = window.nacl;

    var APP = window.APP = {};
    MediaTag.setDefaultConfig('download', {
        text: Messages.download_mt_button
    });

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
        var metadataMgr = common.getMetadataMgr();
        var priv = metadataMgr.getPrivateData();
        var fileHost = priv.fileHost || priv.origin || '';

        if (!priv.filehash) {
            uploadMode = true;
        } else {
            secret = Hash.getSecrets('file', priv.filehash, priv.password);
            if (!secret.keys) { throw new Error("You need a hash"); }
        }

        var Title = common.createTitle({});
        var displayed = ['useradmin', 'newpad', 'limit', 'upgrade'];
        if (!uploadMode) {
            displayed.push('fileshare');
        }
        var configTb = {
            displayed: displayed,
            //hideDisplayName: true,
            $container: $bar,
            metadataMgr: metadataMgr,
            sfCommon: common,
        };
        if (uploadMode) {
            displayed.push('pageTitle');
            configTb.pageTitle = Messages.upload_title;
        }
        var toolbar = APP.toolbar = Toolbar.create(configTb);
        toolbar.$rightside.html('');

        if (!uploadMode) {
            var hexFileName = secret.channel;
            var src = fileHost + Hash.getBlobPathFromHex(hexFileName);
            var key = secret.keys && secret.keys.cryptKey;
            var cryptKey = Nacl.util.encodeBase64(key);

            FileCrypto.fetchDecryptedMetadata(src, key, function (e, metadata) {
                if (e) {
                    if (e === 'XHR_ERROR') {
                        return void UI.errorLoadingScreen(Messages.download_resourceNotAvailable, false, function () {
                            common.gotoURL('/file/');
                        });
                    }
                    return void console.error(e);
                }

                // Add pad attributes when the file is saved in the drive
                Title.onTitleChange(function () {
                    var owners = metadata.owners;
                    if (owners) {
                        common.setPadAttribute('owners', owners);
                    }
                    common.setPadAttribute('fileType', metadata.type);
                });

                // Save to the drive or update the acces time
                var title = document.title = metadata.name;
                Title.updateTitle(title || Title.defaultTitle);

                var owners = metadata.owners;
                if (owners) {
                    common.setPadAttribute('owners', owners);
                }
                if (metadata.type) {
                    common.setPadAttribute('fileType', metadata.type);
                }

                toolbar.addElement(['pageTitle'], {
                    pageTitle: title,
                    title: Title.getTitleConfig(),
                });
                toolbar.$rightside.append(common.createButton('forget', true));
                toolbar.$rightside.append(common.createButton('properties', true));
                if (common.isLoggedIn()) {
                    toolbar.$rightside.append(common.createButton('hashtag', true));
                }

                var displayFile = function (ev, sizeMb, CB) {
                    var called_back;
                    var cb = function (e) {
                        if (called_back) { return; }
                        called_back = true;
                        if (CB) { CB(e); }
                    };

                    var $mt = $dlview.find('media-tag');
                    $mt.attr('src', src);
                    $mt.attr('data-crypto-key', 'cryptpad:'+cryptKey);

                    var rightsideDisplayed = false;

                    MediaTag($mt[0]).on('complete', function (decrypted) {
                        $dlview.show();
                        $dlform.hide();
                        var $dlButton = $dlview.find('media-tag button');
                        if (ev) { $dlButton.click(); }

                        if (!rightsideDisplayed) {
                            toolbar.$rightside
                            .append(common.createButton('export', true, {}, function () {
                                saveAs(decrypted.content, decrypted.metadata.name);
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
                    }).on('progress', function (data) {
                        var p = data.progress +'%';
                        $progress.width(p);
                    }).on('error', function (err) {
                        console.error(err);
                    });
                };

                var todoBigFile = function (sizeMb) {
                    $dlform.show();
                    UI.removeLoadingScreen();
                    $dllabel.append($('<br>'));
                    $dllabel.append(Util.fixHTML(metadata.name));

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
                            $appContainer.css('background-color',
                                              common.getAppConfig().appBackgroundColor);
                            if (err) { UI.alert(err); }
                        });
                    };
                    if (typeof(sizeMb) === 'number' && sizeMb < 5) { return void onClick(); }
                    $dlform.find('#cp-app-file-dlfile, #cp-app-file-dlprogress').click(onClick);
                };
                common.getFileSize(hexFileName, function (e, data) {
                    if (e) {
                        return void UI.errorLoadingScreen(e);
                    }
                    var size = Util.bytesToMegabytes(data);
                    return void todoBigFile(size);
                });
            });
            return;
        }

        // we're in upload mode
        if (!common.isLoggedIn()) {
            UI.removeLoadingScreen();
            return UI.alert(Messages.upload_mustLogin, function () {
                common.setLoginRedirect(function () {
                    common.gotoURL('/login/');
                });
            });
        }

        $form.css({
            display: 'block',
        });

        var fmConfig = {
            dropArea: $form,
            hoverArea: $label,
            body: $body,
            keepTable: true // Don't fadeOut the table with the uploaded files
        };

        var FM = common.createFileManager(fmConfig);

        $form.find("#cp-app-file-upfile").on('change', function (e) {
            var file = e.target.files[0];
            FM.handleFile(file);
        });

        UI.removeLoadingScreen();
    };

    var main = function () {
        var common;

        nThen(function (waitFor) {
            $(waitFor(function () {
                UI.addLoadingScreen();
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
