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

    var ifrw = $('#pad-iframe')[0].contentWindow;
    var $iframe = $('#pad-iframe').contents();
    var $form = $iframe.find('#upload-form');
    var $progress = $form.find('#progress');
    var $label = $form.find('label');

    Cryptpad.addLoadingScreen();

    var Title;

    var myFile;
    var myDataType;

    var upload = function (blob, metadata) {
        console.log(metadata);
        var u8 = new Uint8Array(blob);

        var key = Nacl.randomBytes(32);
        var next = FileCrypto.encrypt(u8, metadata, key);

        var estimate = FileCrypto.computeEncryptedSize(blob.byteLength, metadata);
        var chunks = [];

        var sendChunk = function (box, cb) {
            var enc = Nacl.util.encodeBase64(box);

            chunks.push(box);
            Cryptpad.rpc.send('UPLOAD', enc, function (e, msg) {
                console.log(box);
                cb(e, msg);
            });
        };

        var actual = 0;
        var again = function (err, box) {
            if (err) { throw new Error(err); }
            if (box) {
                actual += box.length;
                var progress = (actual / estimate * 100) + '%';
                console.log(progress);

                return void sendChunk(box, function (e) {
                    if (e) { return console.error(e); }
                    $progress.css({
                        width: progress,
                    });

                    next(again);
                });
            }

            if (actual !== estimate) {
                console.error('Estimated size does not match actual size');
            }

            // if not box then done
            Cryptpad.uploadComplete(function (e, id) {
                if (e) { return void console.error(e); }
                var uri = ['', 'blob', id.slice(0,2), id].join('/');
                console.log("encrypted blob is now available as %s", uri);

                var b64Key = Nacl.util.encodeBase64(key);
                Cryptpad.replaceHash(Cryptpad.getFileHashFromKeys(id, b64Key));

                $form.hide();

                APP.toolbar.addElement(['fileshare'], {});

                var title = document.title = metadata.name;
                myFile = blob;
                myDataType = metadata.type;
                var defaultName = Cryptpad.getDefaultName(Cryptpad.parsePadUrl(window.location.href));
                Title.updateTitle(title || defaultName);
                APP.toolbar.title.show();
                console.log(title);
                Cryptpad.alert(Messages._getKey('upload_success', [title]));
            });
        };

        Cryptpad.uploadStatus(estimate, function (e, pending) {
            if (e) {
                console.error(e);
                return void Cryptpad.alert(Messages.upload_serverError);
            }

            if (pending) {
                // TODO queue uploads... ?
                return void Cryptpad.confirm(Messages.upload_uploadPending, function (yes) {
                    if (!yes) { return; }
                    Cryptpad.uploadCancel(function (e, res) {
                        if (e) { return void console.error(e); }
                        console.log(res);
                        next(again);
                    });
                });
            }
            next(again);
        });
    };

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
            var suggestion = document.title;
            Cryptpad.prompt(Messages.exportPrompt,
                Cryptpad.fixFileName(suggestion), function (filename) {
                if (!(typeof(filename) === 'string' && filename)) { return; }
                var blob = new Blob([myFile], {type: myDataType});
                saveAs(blob, filename);
            });
        };

        Title = Cryptpad.createTitle({}, function(){}, Cryptpad);

        var displayed = ['title', 'useradmin', 'newpad', 'limit'];
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
            return Cryptpad.fetch(src, function (e, u8) {
                if (e) { return void Cryptpad.alert(e); }
                // now decrypt the u8
                var cryptKey = secret.keys && secret.keys.fileKeyStr;
                var key = Nacl.util.decodeBase64(cryptKey);

                if (!u8 || !u8.length) {
                    return void Cryptpad.errorLoadingScreen(e);
                }

                FileCrypto.decrypt(u8, key, function (e, data) {
                    if (e) {
                        Cryptpad.removeLoadingScreen();
                        return console.error(e);
                    }
                    console.log(data);
                    var title = document.title = data.metadata.name;
                    myFile = data.content;
                    myDataType = data.metadata.type;
                    Title.updateTitle(title || Title.defaultTitle);
                    Cryptpad.removeLoadingScreen();
                });
            });
        }

        if (!Cryptpad.isLoggedIn()) {
            return Cryptpad.alert("You must be logged in to upload files");
        }

        $form.css({
            display: 'block',
        });

        var handleFile = function (file) {
            console.log(file);
            var reader = new FileReader();
            reader.onloadend = function () {
                upload(this.result, {
                    name: file.name,
                    type: file.type,
                });
            };
            reader.readAsArrayBuffer(file);
        };

        $form.find("#file").on('change', function (e) {
            var file = e.target.files[0];
            handleFile(file);
        });

        var counter = 0;
        $label
        .on('dragenter', function (e) {
            e.preventDefault();
            e.stopPropagation();
            counter++;
            $label.addClass('hovering');
        })
        .on('dragleave', function (e) {
            e.preventDefault();
            e.stopPropagation();
            counter--;
            if (counter <= 0) {
                $label.removeClass('hovering'); // FIXME Can get stuck...
            }
        });

        $form
        .on('drag dragstart dragend dragover drop dragenter dragleave', function (e) {
            e.preventDefault();
            e.stopPropagation();
        })
        .on('drop', function (e) {
            var dropped = e.originalEvent.dataTransfer.files;
            handleFile(dropped[0]);
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
