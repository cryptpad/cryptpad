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
    'less!/bower_components/components-font-awesome/css/font-awesome.min.css',
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
                            }))
                            .append(common.createButton('hashtag', true));
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

        // we're in upload mode

        if (!common.isLoggedIn()) {
            return Cryptpad.alert(Messages.upload_mustLogin, function () {
                Cryptpad.errorLoadingScreen(Messages.upload_mustLogin);
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
            keepTable: true // Don't fadeOut the tbale with the uploaded files
        };

        var FM = common.createFileManager(fmConfig);

        $form.find("#cp-app-file-upfile").on('change', function (e) {
            var file = e.target.files[0];
            FM.handleFile(file);
        });

        Cryptpad.removeLoadingScreen();
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
