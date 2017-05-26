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
    var $dlform = $iframe.find('#download-form');
    var $label = $form.find('label');
    var $table = $iframe.find('#status');
    var $progress = $iframe.find('#progress');

    $iframe.find('body').on('dragover', function (e) { e.preventDefault(); });
    $iframe.find('body').on('drop', function (e) { e.preventDefault(); });

    Cryptpad.addLoadingScreen();

    var Title;

    var myFile;
    var myDataType;

    var queue = {
        queue: [],
        inProgress: false
    };

    var uid = function () {
        return 'file-' + String(Math.random()).substring(2);
    };

    var upload = function (blob, metadata, id) {
        console.log(metadata);
        if (queue.inProgress) { return; }
        queue.inProgress = true;

        var $cancelCell = $table.find('tr[id="'+id+'"]').find('.upCancel');
        $cancelCell.html('-');

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
                var progressValue = (actual / estimate * 100);

                return void sendChunk(box, function (e) {
                    if (e) { return console.error(e); }
                    var $pv = $table.find('tr[id="'+id+'"]').find('.progressValue');
                    $pv.text(Math.round(progressValue*100)/100 + '%');
                    var $pb = $table.find('tr[id="'+id+'"]').find('.progressContainer');
                    $pb.css({
                        width: (progressValue/100)*188+'px'
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

                APP.toolbar.addElement(['fileshare'], {});

                var title = document.title = metadata.name;
                myFile = blob;
                myDataType = metadata.type;
                var defaultName = Cryptpad.getDefaultName(Cryptpad.parsePadUrl(window.location.href));
                Title.updateTitle(title || defaultName);
                APP.toolbar.title.show();
                console.log(title);
                Cryptpad.alert(Messages._getKey('upload_success', [title]));
                queue.inProgress = false;
                queue.next();
            });
        };

        Cryptpad.uploadStatus(estimate, function (e, pending) {
            if (e) {
                queue.inProgress = false;
                queue.next();
                if (e === 'TOO_LARGE') {
                    return void Cryptpad.alert(Messages.upload_tooLarge);
                }
                if (e === 'NOT_ENOUGH_SPACE') {
                    return void Cryptpad.alert(Messages.upload_notEnoughSpace);
                }
                console.error(e);
                return void Cryptpad.alert(Messages.upload_serverError);
            }

            if (pending) {
                // TODO keep this message in case of pending files in another window?
                return void Cryptpad.confirm(Messages.upload_uploadPending, function (yes) {
                    if (!yes) { return; }
                    Cryptpad.uploadCancel(function (e, res) {
                        if (e) {
                            return void console.error(e);
                        }
                        console.log(res);
                        next(again);
                    });
                });
            }
            next(again);
        });
    };

    var prettySize = function (bytes) {
        var kB = Cryptpad.bytesToKilobytes(bytes);
        if (kB < 1024) { return kB + Messages.KB; }
        var mB = Cryptpad.bytesToMegabytes(bytes);
        return mB + Messages.MB;
    };

    queue.next = function () {
        if (queue.queue.length === 0) { return; }
        if (queue.inProgress) { return; }
        var file = queue.queue.shift();
        upload(file.blob, file.metadata, file.id);
    };
    queue.push = function (obj) {
        var id = uid();
        obj.id = id;
        queue.queue.push(obj);

        $table.show();
        var estimate = FileCrypto.computeEncryptedSize(obj.blob.byteLength, obj.metadata);

        var $progressBar = $('<div>', {'class':'progressContainer'});
        var $progressValue = $('<span>', {'class':'progressValue'}).text(Messages.upload_pending);

        var $tr = $('<tr>', {id: id}).appendTo($table);

        var $cancel = $('<span>', {'class': 'cancel fa fa-times'}).click(function () {
            queue.queue = queue.queue.filter(function (el) { return el.id !== id; });
            $cancel.remove();
            $tr.find('.upCancel').text('-');
            $tr.find('.progressValue').text(Messages.upload_cancelled);
        });

        $('<td>').text(obj.metadata.name).appendTo($tr);
        $('<td>').text(prettySize(estimate)).appendTo($tr);
        $('<td>', {'class': 'upProgress'}).append($progressBar).append($progressValue).appendTo($tr);
        $('<td>', {'class': 'upCancel'}).append($cancel).appendTo($tr);

        queue.next();
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
            var filename = Cryptpad.fixFileName(document.title);
            if (!(typeof(filename) === 'string' && filename)) { return; }
            var blob = new Blob([myFile], {type: myDataType});
            saveAs(blob, filename);
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
            return Cryptpad.alert("You must be logged in to upload files");
        }

        $form.css({
            display: 'block',
        });

        var handleFile = function (file) {
            console.log(file);
            var reader = new FileReader();
            reader.onloadend = function () {
                queue.push({
                    blob: this.result,
                    metadata: {
                        name: file.name,
                        type: file.type,
                    }
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
                $label.removeClass('hovering');
            }
        });

        $form
        .on('drag dragstart dragend dragover drop dragenter dragleave', function (e) {
            e.preventDefault();
            e.stopPropagation();
        })
        .on('drop', function (e) {
            e.stopPropagation();
            var dropped = e.originalEvent.dataTransfer.files;
            counter = 0;
            $label.removeClass('hovering');
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
