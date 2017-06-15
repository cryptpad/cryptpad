define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/common/toolbar2.js',
    '/common/cryptpad-common.js',
    '/common/visible.js',
    '/common/notify.js',
    '/file/file-crypto.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
    '/bower_components/file-saver/FileSaver.min.js',
], function ($, Crypto, realtimeInput, Toolbar, Cryptpad, Visible, Notify, FileCrypto) {
    var Messages = Cryptpad.Messages;
    var saveAs = window.saveAs;
    var Nacl = window.nacl;

    var APP = {};

    $(function () {

    var andThen = function () {
        var ifrw = $('#pad-iframe')[0].contentWindow;
        var $iframe = $('#pad-iframe').contents();
        var $form = $iframe.find('#upload-form');
        var $dlform = $iframe.find('#download-form');
        var $dlview = $iframe.find('#download-view');
        var $label = $form.find('label');
        var $progress = $iframe.find('#progress');
        var $body = $iframe.find('body');

        $body.on('dragover', function (e) { e.preventDefault(); });
        $body.on('drop', function (e) { e.preventDefault(); });

        Cryptpad.addLoadingScreen();

        var Title;

        var myFile;
        var myDataType;

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

        var getTitle = function () {
            var pad = Cryptpad.getRelativeHref(window.location.href);
            var fo = Cryptpad.getStore().getProxy().fo;
            var data = fo.getFileData(pad);
            return data ? data.title : undefined;
        };

        var exportFile = function () {
            var filename = Cryptpad.fixFileName(document.title);
            if (!(typeof(filename) === 'string' && filename)) { return; }
            var blob = new Blob([myFile], {type: myDataType});
            saveAs(blob, filename);
        };

        Title = Cryptpad.createTitle({}, function(){}, Cryptpad);

        var displayed = ['title', 'useradmin', 'newpad', 'limit', 'upgrade'];
        if (secret && hexFileName) {
            displayed.push('fileshare');
        }

        var configTb = {
            displayed: displayed,
            ifrw: ifrw,
            common: Cryptpad,
            title: Title.getTitleConfig(),
            hideDisplayName: true,
            $container: $bar
        };
        var toolbar = APP.toolbar = Toolbar.create(configTb);

        Title.setToolbar(toolbar);

        if (uploadMode) { toolbar.title.hide(); }

        var $rightside = toolbar.$rightside;

        var $export = Cryptpad.createButton('export', true, {}, exportFile);
        $rightside.append($export);

        Title.updateTitle(Cryptpad.initialName || getTitle() || Title.defaultTitle);

        if (!uploadMode) {
            var src = Cryptpad.getBlobPathFromHex(hexFileName);
            var cryptKey = secret.keys && secret.keys.fileKeyStr;
            var key = Nacl.util.decodeBase64(cryptKey);

            FileCrypto.fetchDecryptedMetadata(src, key, function (e, metadata) {
                if (e) { return void console.error(e); }
                var title = document.title = metadata.name;
                Title.updateTitle(title || Title.defaultTitle);

                var displayFile = function (ev) {
                    var $mt = $dlview.find('media-tag');
                    var cryptKey = secret.keys && secret.keys.fileKeyStr;
                    var hexFileName = Cryptpad.base64ToHex(secret.channel);
                    $mt.attr('src', '/blob/' + hexFileName.slice(0,2) + '/' + hexFileName);
                    $mt.attr('data-crypto-key', 'cryptpad:'+cryptKey);

                    $(window.document).on('decryption', function (e) {
                        var decrypted = e.originalEvent;
                        if (decrypted.callback) { decrypted.callback(); }
                        $dlview.show();
                        $dlform.hide();
                        if (ev) {
                            var $dlButton = $dlview.find('media-tag button');
                            $dlButton.click();
                        }
                        Cryptpad.removeLoadingScreen();
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
                    var decrypting = false;
                    var onClick = function () {
                        if (decrypting) { return; }
                        if (myFile) { return void exportFile(); }
                        decrypting = true;
                        displayFile();
                    };
                    if (sizeMb < 5) { return void onClick(); }
                    Cryptpad.removeLoadingScreen();
                    $dlform.find('#dl, #progress').click(onClick);
                };
                Cryptpad.getFileSize(window.location.href, function (e, data) {
                    if (e) { return void Cryptpad.errorLoadingScreen(e); }
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
            body: $body
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
