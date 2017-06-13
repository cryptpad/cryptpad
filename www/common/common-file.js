define([
    'jquery',
    '/file/file-crypto.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function ($, FileCrypto) {
    var Nacl = window.nacl;
    var module = {};

    module.create = function (common, config) {
        var File = {};

        var Messages = common.Messages;

        var queue = File.queue = {
            queue: [],
            inProgress: false
        };

        var uid = function () {
            return 'file-' + String(Math.random()).substring(2);
        };

        var $table = File.$table = $('<table>', { id: 'uploadStatus' });
        var $thead = $('<tr>').appendTo($table);
        $('<td>').text(Messages.upload_name).appendTo($thead);
        $('<td>').text(Messages.upload_size).appendTo($thead);
        $('<td>').text(Messages.upload_progress).appendTo($thead);
        $('<td>').text(Messages.cancel).appendTo($thead);

        var createTableContainer = function ($body) {
            File.$container = $('<div>', { id: 'uploadStatusContainer' }).append($table).appendTo($body);
            return File.$container;
        };

        var getData = function (file, href) {
            var data = {};

            data.name = file.metadata.name;
            data.url = href;
            if (file.metadata.type.slice(0,6) === 'image/') {
                data.mediatag = true;
            }

            return data;
        };

        var upload = function (file) {
            var blob = file.blob;
            var metadata = file.metadata;
            var id = file.id;
            if (queue.inProgress) { return; }
            queue.inProgress = true;

            var $row = $table.find('tr[id="'+id+'"]');

            $row.find('.upCancel').html('-');
            var $pv = $row.find('.progressValue');
            var $pb = $row.find('.progressContainer');
            var $link = $row.find('.upLink');

            var updateProgress = function (progressValue) {
                $pv.text(Math.round(progressValue*100)/100 + '%');
                $pb.css({
                    width: (progressValue/100)*188+'px'
                });
            };

            var u8 = new Uint8Array(blob);

            var key = Nacl.randomBytes(32);
            var next = FileCrypto.encrypt(u8, metadata, key);

            var estimate = FileCrypto.computeEncryptedSize(blob.byteLength, metadata);

            var sendChunk = function (box, cb) {
                var enc = Nacl.util.encodeBase64(box);
                common.rpc.send.unauthenticated('UPLOAD', enc, function (e, msg) {
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
                    updateProgress(progressValue);

                    return void sendChunk(box, function (e) {
                        if (e) { return console.error(e); }
                        next(again);
                    });
                }

                if (actual !== estimate) {
                    console.error('Estimated size does not match actual size');
                }

                // if not box then done
                common.uploadComplete(function (e, id) {
                    if (e) { return void console.error(e); }
                    var uri = ['', 'blob', id.slice(0,2), id].join('/');
                    console.log("encrypted blob is now available as %s", uri);

                    var b64Key = Nacl.util.encodeBase64(key);

                    var hash = common.getFileHashFromKeys(id, b64Key);
                    var href = '/file/#' + hash;
                    $link.attr('href', href)
                        .click(function (e) {
                            e.preventDefault();
                            window.open($link.attr('href'), '_blank');
                        });

                    // TODO add button to table which copies link to clipboard?
                    //APP.toolbar.addElement(['fileshare'], {});

                    var title = metadata.name;

                    common.renamePad(title || "", href, function (err) {
                        if (err) { return void console.error(err); } // TODO
                        console.log(title);
                        common.log(Messages._getKey('upload_success', [title]));

                        if (config.onUploaded) {
                            var data = getData(file, href);
                            config.onUploaded(file.dropEvent, data);
                        }

                        queue.inProgress = false;
                        queue.next();
                    });
                    //Title.updateTitle(title || "", href);
                    //APP.toolbar.title.show();
                });
            };

            common.uploadStatus(estimate, function (e, pending) {
                if (e) {
                    queue.inProgress = false;
                    queue.next();
                    if (e === 'TOO_LARGE') {
                        // TODO update table to say too big?
                        return void common.alert(Messages.upload_tooLarge);
                    }
                    if (e === 'NOT_ENOUGH_SPACE') {
                        // TODO update table to say not enough space?
                        return void common.alert(Messages.upload_notEnoughSpace);
                    }
                    console.error(e);
                    return void common.alert(Messages.upload_serverError);
                }

                if (pending) {
                    // TODO keep this message in case of pending files in another window?
                    return void common.confirm(Messages.upload_uploadPending, function (yes) {
                        if (!yes) { return; }
                        common.uploadCancel(function (e, res) {
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
            var kB = common.bytesToKilobytes(bytes);
            if (kB < 1024) { return kB + Messages.KB; }
            var mB = common.bytesToMegabytes(bytes);
            return mB + Messages.MB;
        };

        queue.next = function () {
            if (queue.queue.length === 0) {
                queue.to = window.setTimeout(function () {
                    File.$container.fadeOut();
                }, 3000);
                return;
            }
            if (queue.inProgress) { return; }
            File.$container.show();
            var file = queue.queue.shift();
            upload(file);
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

            var $link = $('<a>', {
                'class': 'upLink',
                'rel': 'noopener noreferrer'
            }).text(obj.metadata.name);

            $('<td>').append($link).appendTo($tr);
            $('<td>').text(prettySize(estimate)).appendTo($tr);
            $('<td>', {'class': 'upProgress'}).append($progressBar).append($progressValue).appendTo($tr);
            $('<td>', {'class': 'upCancel'}).append($cancel).appendTo($tr);

            queue.next();
        };

        var handleFile = File.handleFile = function (file, e) {
            console.log(file);
            var reader = new FileReader();
            reader.onloadend = function () {
                queue.push({
                    blob: this.result,
                    metadata: {
                        name: file.name,
                        type: file.type,
                    },
                    dropEvent: e
                });
            };
            reader.readAsArrayBuffer(file);
        };

        var createAreaHandlers = File.createDropArea = function ($area, $hoverArea, todo) {
            var counter = 0;
            if (!$hoverArea) { $hoverArea = $area; }
            $hoverArea
            .on('dragenter', function (e) {
                e.preventDefault();
                e.stopPropagation();
                counter++;
                $hoverArea.addClass('hovering');
            })
            .on('dragleave', function (e) {
                e.preventDefault();
                e.stopPropagation();
                counter--;
                if (counter <= 0) {
                    $hoverArea.removeClass('hovering');
                }
            });

            $area
            .on('drag dragstart dragend dragover drop dragenter dragleave', function (e) {
                e.preventDefault();
                e.stopPropagation();
            })
            .on('drop', function (e) {
                e.stopPropagation();
                var dropped = e.originalEvent.dataTransfer.files;
                counter = 0;
                $hoverArea.removeClass('hovering');

                Array.prototype.slice.call(dropped).forEach(function (d) {
                    todo(d, e);
                });
            });
        };

        var createUploader = function ($area, $hover, $body) {
            createAreaHandlers($area, null, handleFile);
            createTableContainer($body);
        };

        createUploader(config.dropArea, config.hoverArea, config.body);

        return File;
    };

    return module;
});
