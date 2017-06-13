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
// TODO race condition with contents() here
    var ifrw = $('#pad-iframe')[0].contentWindow;
    var $iframe = $('#pad-iframe').contents();
    var $form = $iframe.find('#upload-form');
    var $dlform = $iframe.find('#download-form');
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

    var andThen = function () {
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
            $dlform.show();
            var src = Cryptpad.getBlobPathFromHex(hexFileName);
            var cryptKey = secret.keys && secret.keys.fileKeyStr;
            var key = Nacl.util.decodeBase64(cryptKey);

            FileCrypto.fetchDecryptedMetadata(src, key, function (e, metadata) {
                if (e) { return void console.error(e); }
                var title = document.title = metadata.name;
                Title.updateTitle(title || Title.defaultTitle);

                Cryptpad.removeLoadingScreen();
                var decrypting = false;
                $dlform.find('#dl, #progress').click(function () {
                    if (decrypting) { return; }
                    if (myFile) { return void exportFile(); }
                    decrypting = true;

                    return Cryptpad.fetch(src, function (e, u8) {
                        if (e) {
                            decrypting = false;
                            return void Cryptpad.alert(e);
                        }

                        // now decrypt the u8
                        if (!u8 || !u8.length) {
                            return void Cryptpad.errorLoadingScreen(e);
                        }

                        FileCrypto.decrypt(u8, key, function (e, data) {
                            if (e) {
                                decrypting = false;
                                return console.error(e);
                            }
                            console.log(data);
                            var title = document.title = data.metadata.name;
                            myFile = data.content;
                            myDataType = data.metadata.type;
                            Title.updateTitle(title || Title.defaultTitle);
                            exportFile();
                            decrypting = false;
                        }, function (progress) {
                            var p = progress * 100 +'%';
                            $progress.width(p);
                            console.error(progress);
                        });
                    });
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

        var FM = Cryptpad.createFileManager();

        $form.find("#file").on('change', function (e) {
            var file = e.target.files[0];
            FM.handleFile(file);
        });

        //FM.createDropArea($form, $label, handleFile);
        FM.createUploader($form, $label, $body);

        // we're in upload mode
        Cryptpad.removeLoadingScreen();
    };

    Cryptpad.ready(function () {
        andThen();
        Cryptpad.reportAppUsage();
    });

    });
});
