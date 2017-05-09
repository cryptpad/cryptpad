define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/common/toolbar.js',
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

    Cryptpad.addLoadingScreen();

    var fetch = function (src, cb) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", src, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = function () {
            return void cb(void 0, new Uint8Array(xhr.response));
        };
        xhr.send(null);
    };

    var myFile;
    var myDataType;

    var upload = function (blob, metadata) {
        console.log(metadata);
        var u8 = new Uint8Array(blob);

        var key = Nacl.randomBytes(32);
        var next = FileCrypto.encrypt(u8, metadata, key);

        var chunks = [];

        var sendChunk = function (box, cb) {
            var enc = Nacl.util.encodeBase64(box);

            chunks.push(box);
            Cryptpad.rpc.send('UPLOAD', enc, function (e, msg) {
                cb(e, msg);
            });
        };

        var again = function (state, box) {
            switch (state) {
                case 0:
                    sendChunk(box, function (e) {
                        if (e) { return console.error(e); }
                        next(again);
                    });
                    break;
                case 1:
                    sendChunk(box, function (e) {
                        if (e) { return console.error(e); }
                        next(again);
                    });
                    break;
                case 2:
                    sendChunk(box, function (e) {
                        if (e) { return console.error(e); }
                        Cryptpad.rpc.send('UPLOAD_COMPLETE', '', function (e, res) {
                            if (e) { return void console.error(e); }
                            var id = res[0];
                            var uri = ['', 'blob', id.slice(0,2), id].join('/');
                            console.log("encrypted blob is now available as %s", uri);

                            window.location.hash = [
                                '',
                                2,
                                Cryptpad.hexToBase64(id).replace(/\//g, '-'),
                                Nacl.util.encodeBase64(key).replace(/\//g, '-'),
                                ''
                            ].join('/');

                            $form.hide();

                            var newU8 = FileCrypto.joinChunks(chunks);
                            FileCrypto.decrypt(newU8, key, function (e, res) {
                                if (e) { return console.error(e); }
                                var title = document.title = res.metadata.name;
                                myFile = res.content;
                                myDataType = res.metadata.type;

                                var defaultName = Cryptpad.getDefaultName(Cryptpad.parsePadUrl(window.location.href));
                                APP.updateTitle(title || defaultName);

                            });
                        });
                    });
                    break;
                default:
                    throw new Error("E_INVAL_STATE");
            }
        };

        Cryptpad.rpc.send('UPLOAD_STATUS', '', function (e, pending) {
            if (e) {
                console.error(e);
                return void Cryptpad.alert("something went wrong");
            }

            if (pending[0]) {
                return void Cryptpad.confirm('upload pending, abort?', function (yes) {
                    if (!yes) { return; }
                    Cryptpad.rpc.send('UPLOAD_CANCEL', '', function (e, res) {
                        if (e) { return void console.error(e); }
                        console.log(res);
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

        var parsed = Cryptpad.parsePadUrl(window.location.href);
        var defaultName = Cryptpad.getDefaultName(parsed);

        var getTitle = function () {
            var pad = Cryptpad.getRelativeHref(window.location.href);
            var fo = Cryptpad.getStore().getProxy().fo;
            var data = fo.getFileData(pad);
            return data ? data.title : undefined;
        };

        var updateTitle = APP.updateTitle = function (newTitle) {
            Cryptpad.renamePad(newTitle, function (err, data) {
                if (err) {
                    console.log("Couldn't set pad title");
                    console.error(err);
                    return;
                }
                document.title = newTitle;
                $bar.find('.' + Toolbar.constants.title).find('span.title').text(data);
                $bar.find('.' + Toolbar.constants.title).find('input').val(data);
            });
        };

        var suggestName = function () {
            return document.title || getTitle() || '';
        };

        var renameCb = function (err, title) {
            document.title = title;
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

        var displayed = ['useradmin', 'newpad', 'limit'];
        if (secret && hexFileName) {
            displayed.push('share');
        }

        var configTb = {
            displayed: displayed,
            ifrw: ifrw,
            common: Cryptpad,
            title: {
                onRename: renameCb,
                defaultName: defaultName,
                suggestName: suggestName
            },
            share: {
                secret: secret,
                channel: hexFileName
            },
            hideDisplayName: true
        };
        Toolbar.create($bar, null, null, null, null, configTb);
        var $rightside = $bar.find('.' + Toolbar.constants.rightside);

        var $export = Cryptpad.createButton('export', true, {}, exportFile);
        $rightside.append($export);

        updateTitle(Cryptpad.initialName || getTitle() || defaultName);

        if (!uploadMode) {
            var src = Cryptpad.getBlobPathFromHex(hexFileName);
            return fetch(src, function (e, u8) {
                // now decrypt the u8
                if (e) { return window.alert('error'); }
                var cryptKey = secret.keys && secret.keys.fileKeyStr;
                var key = Nacl.util.decodeBase64(cryptKey);

                FileCrypto.decrypt(u8, key, function (e, data) {
                    if (e) {
                        Cryptpad.removeLoadingScreen();
                        return console.error(e);
                    }
                    console.log(data);
                    var title = document.title = data.metadata.name;
                    myFile = data.content;
                    myDataType = data.metadata.type;
                    updateTitle(title || defaultName);
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

        $form
        .on('drag dragstart dragend dragover dragenter dragleave drop', function (e) {
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
