define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/common/toolbar2.js',
    '/common/cryptpad-common.js',
    '/common/visible.js',
    '/common/notify.js',
    '/file/file-crypto.js',
    '/bower_components/file-saver/FileSaver.min.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',

    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less/cryptpad.less',
], function ($, Crypto, realtimeInput, Toolbar, Cryptpad, Visible, Notify, FileCrypto) {
    var Messages = Cryptpad.Messages;
    var saveAs = window.saveAs;
    var Nacl = window.nacl;

    var APP = window.APP = {};

    $(function () {

    var andThen = function () {
        var ifrw = $('#pad-iframe')[0].contentWindow;
        var $iframe = $('#pad-iframe').contents();
        var $appContainer = $iframe.find('#app');
        var $form = $iframe.find('#upload-form');
        var $dlform = $iframe.find('#download-form');
        var $dlview = $iframe.find('#download-view');
        var $label = $form.find('label');
        var $dllabel = $dlform.find('label span');
        var $progress = $iframe.find('#progress');
        var $body = $iframe.find('body');

        $body.on('dragover', function (e) { e.preventDefault(); });
        $body.on('drop', function (e) { e.preventDefault(); });

        Cryptpad.addLoadingScreen();

        var Title;

        var uploadMode = false;

        var $bar = $iframe.find('.toolbar-container');

        var secret;
        var hexFileName;
        if (window.location.hash) {
            secret = Cryptpad.getSecrets();
            if (!secret.keys) { throw new Error("You need a hash"); } // TODO
            hexFileName = Cryptpad.base64ToHex(secret.channel);
        } else {
            uploadMode = true;
        }

        Title = Cryptpad.createTitle({}, function(){}, Cryptpad);

        var displayed = ['useradmin', 'newpad', 'limit', 'upgrade'];
        if (secret && hexFileName) {
            displayed.push('fileshare');
        }

        var configTb = {
            displayed: displayed,
            ifrw: ifrw,
            common: Cryptpad,
            hideDisplayName: true,
            $container: $bar
        };
        var toolbar = APP.toolbar = Toolbar.create(configTb);
        toolbar.$rightside.html(''); // Remove the drawer if we don't use it to hide the toolbar


        if (!uploadMode) {
            var src = Cryptpad.getBlobPathFromHex(hexFileName);
            var cryptKey = secret.keys && secret.keys.fileKeyStr;
            var key = Nacl.util.decodeBase64(cryptKey);

            FileCrypto.fetchDecryptedMetadata(src, key, function (e, metadata) {
                if (e) { return void console.error(e); }
                var title = document.title = metadata.name;
                Title.updateTitle(title || Title.defaultTitle);

                var displayFile = function (ev, sizeMb) {
                    var $mt = $dlview.find('media-tag');
                    var cryptKey = secret.keys && secret.keys.fileKeyStr;
                    var hexFileName = Cryptpad.base64ToHex(secret.channel);
                    $mt.attr('src', '/blob/' + hexFileName.slice(0,2) + '/' + hexFileName);
                    $mt.attr('data-crypto-key', 'cryptpad:'+cryptKey);

                    $(window.document).on('decryption', function (e) {
                        var decrypted = e.originalEvent;
                        if (decrypted.callback) {
                            var cb = decrypted.callback;
                            decrypted.callback = undefined;
                            cb();
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

                        toolbar.$rightside.append(Cryptpad.createButton('export', true, {}, function () {
                            saveAs(decrypted.blob, decrypted.metadata.name);
                        }))
                        .append(Cryptpad.createButton('forget', true, {}, function () {
                            // not sure what to do here
                        }));

                        // make pdfs big
                        $iframe.find('media-tag iframe').css({
                            'height': 'calc(100vh - 64px)',
                            width: 'calc(100vw - 15px)',
                        });
                    })
                    .on('decryptionError', function (e) {
                        var error = e.originalEvent;
                        Cryptpad.alert(error.message);
                    })
                    .on('decryptionProgress', function (e) {
                        var progress = e.originalEvent;
                        var p = progress.percent +'%';
                        $progress.width(p);
                        console.log(progress.percent);
                    });

                    require(['/common/media-tag.js'], function (MediaTag) {
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
                    });
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
                        displayFile(ev, sizeMb);
                    };
                    if (typeof(sizeMb) === 'number' && sizeMb < 5) { return void onClick(); }
                    $dlform.find('#dl, #progress').click(onClick);
                };
                Cryptpad.getFileSize(window.location.href, function (e, data) {
                    if (e) {
                        return void Cryptpad.errorLoadingScreen(e);
                    }
                    var size = Cryptpad.bytesToMegabytes(data);
                    return void todoBigFile(size);
                });
            });
            return;
        }

        if (!Cryptpad.isLoggedIn()) {
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

        var FM = Cryptpad.createFileManager(fmConfig);

        $form.find("#file").on('change', function (e) {
            var file = e.target.files[0];
            FM.handleFile(file);
        });

        // we're in upload mode
        Cryptpad.removeLoadingScreen();
    };

    Cryptpad.ready(function () {
        andThen();
        Cryptpad.reportAppUsage();
    });

    });
});
