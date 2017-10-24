define([
    'jquery',
    '/file/file-crypto.js',
    '/common/common-thumbnail.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function ($, FileCrypto, Thumb) {
    var Nacl = window.nacl;
    var module = {};

    var blobToArrayBuffer = module.blobToArrayBuffer = function (blob, cb) {
        var reader = new FileReader();
        reader.onloadend = function () {
            cb(void 0, this.result);
        };
        reader.readAsArrayBuffer(blob);
    };

    var arrayBufferToString = function (AB) {
        try {
            return Nacl.util.encodeBase64(new Uint8Array(AB));
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    module.upload = function (file, noStore, common, updateProgress, onComplete, onError, onPending) {
        var u8 = file.blob; // This is not a blob but a uint8array
        var metadata = file.metadata;

        // if it exists, dropEvent contains the new pad location in the drive
        var dropEvent = file.dropEvent;

        var key = Nacl.randomBytes(32);
        var next = FileCrypto.encrypt(u8, metadata, key);

        var estimate = FileCrypto.computeEncryptedSize(u8.length, metadata);

        var sendChunk = function (box, cb) {
            var enc = Nacl.util.encodeBase64(box);
            common.rpc.send.unauthenticated('UPLOAD', enc, function (e, msg) {
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

                var title = metadata.name;

                if (noStore) { return void onComplete(href); }

                common.initialPath = dropEvent && dropEvent.path;
                common.renamePad(title || "", href, function (err) {
                    if (err) { return void console.error(err); }
                    onComplete(href);
                    common.setPadAttribute('fileType', metadata.type, null, href);
                });
            });
        };

        common.uploadStatus(estimate, function (e, pending) {
            if (e) {
                console.error(e);
                onError(e);
                return;
            }

            if (pending) {
                return void onPending(function () {
                    // if the user wants to cancel the pending upload to execute that one
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
            var blob = file.blob; // This is not a blob but an array buffer
            var u8 = new Uint8Array(blob);
            var metadata = file.metadata;
            var id = file.id;
            if (queue.inProgress) { return; }
            queue.inProgress = true;

            var $row = $table.find('tr[id="'+id+'"]');

            $row.find('.upCancel').html('-');
            var $pv = $row.find('.progressValue');
            var $pb = $row.find('.progressContainer');
            var $pc = $row.find('.upProgress');
            var $link = $row.find('.upLink');

            var updateProgress = function (progressValue) {
                $pv.text(Math.round(progressValue*100)/100 + '%');
                $pb.css({
                    width: (progressValue/100)*$pc.width()+'px'
                });
            };

            var onComplete = function (href) {
                $link.attr('href', href)
                    .click(function (e) {
                        e.preventDefault();
                        window.open($link.attr('href'), '_blank');
                    });
                var title = metadata.name;
                common.log(Messages._getKey('upload_success', [title]));
                common.prepareFeedback('upload')();

                if (config.onUploaded) {
                    var data = getData(file, href);
                    config.onUploaded(file.dropEvent, data);
                }

                queue.inProgress = false;
                queue.next();
            };

            var onError = function (e) {
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
            };

            var onPending = function (cb) {
                common.confirm(Messages.upload_uploadPending, function (yes) {
                    if (!yes) { return; }
                    cb();
                });
            };

            file.blob = u8;
            module.upload(file, config.noStore, common, updateProgress, onComplete, onError, onPending);
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
                    if (config.keepTable) { return; }
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

        var handleFile = File.handleFile = function (file, e, thumbnail) {
            var thumb;
            var file_arraybuffer;
            var finish = function () {
                var metadata = {
                    name: file.name,
                    type: file.type,
                };
                if (thumb) { metadata.thumbnail = thumb; }
                queue.push({
                    blob: file_arraybuffer,
                    metadata: metadata,
                    dropEvent: e
                });
            };

            blobToArrayBuffer(file, function (e, buffer) {
                if (e) { console.error(e); }
                file_arraybuffer = buffer;
                if (thumbnail) { // there is already a thumbnail
                    return blobToArrayBuffer(thumbnail, function (e, buffer) {
                        if (e) { console.error(e); }
                        thumb = arrayBufferToString(buffer);
                        finish();
                    });
                }

                if (!Thumb.isSupportedType(file.type)) { return finish(); }
                // make a resized thumbnail from the image..
                Thumb.fromBlob(file, function (e, thumb_blob) {
                    if (e) { console.error(e); }
                    if (!thumb_blob) { return finish(); }

                    blobToArrayBuffer(thumb_blob, function (e, buffer) {
                        if (e) {
                            console.error(e);
                            return finish();
                        }
                        thumb = arrayBufferToString(buffer);
                        finish();
                    });
                });
            });
        };

        var onFileDrop = File.onFileDrop = function (file, e) {
            if (!common.isLoggedIn()) {
                return common.alert(common.Messages.upload_mustLogin);
            }

            Array.prototype.slice.call(file).forEach(function (d) {
                handleFile(d, e);
            });
        };

        var createAreaHandlers = File.createDropArea = function ($area, $hoverArea) {
            var counter = 0;
            if (!$hoverArea) { $hoverArea = $area; }
            if (!$area) { return; }
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
                onFileDrop(dropped, e);
            });
        };

        var createUploader = function ($area, $hover, $body) {
            if (!config.noHandlers) {
                createAreaHandlers($area, null);
            }
            createTableContainer($body);
        };

        createUploader(config.dropArea, config.hoverArea, config.body);

        return File;
    };

    return module;
});
