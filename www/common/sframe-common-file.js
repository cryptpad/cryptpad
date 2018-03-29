define([
    'jquery',
    '/file/file-crypto.js',
    '/common/common-thumbnail.js',
    '/common/common-interface.js',
    '/common/common-util.js',
    '/customize/messages.js',

    '/bower_components/tweetnacl/nacl-fast.min.js',
], function ($, FileCrypto, Thumb, UI, Util, Messages) {
    var Nacl = window.nacl;
    var module = {};

    var blobToArrayBuffer = function (blob, cb) {
        var reader = new FileReader();
        reader.onloadend = function () {
            cb(void 0, this.result);
        };
        reader.readAsArrayBuffer(blob);
    };

    module.uploadFile = function (common, data, cb) {
        var sframeChan = common.getSframeChannel();
        sframeChan.query('Q_UPLOAD_FILE', data, cb);
    };

    module.create = function (common, config) {
        var File = {};

        var queue = File.queue = {
            queue: [],
            inProgress: false
        };

        var uid = function () {
            return 'cp-fileupload-element-' + String(Math.random()).substring(2);
        };

        var $table = File.$table = $('<table>', { id: 'cp-fileupload-table' });
        var $thead = $('<tr>').appendTo($table);
        $('<td>').text(Messages.upload_name).appendTo($thead);
        $('<td>').text(Messages.upload_size).appendTo($thead);
        $('<td>').text(Messages.upload_progress).appendTo($thead);
        $('<td>').text(Messages.cancel).appendTo($thead);

        var createTableContainer = function ($body) {
            File.$container = $('<div>', { id: 'cp-fileupload' }).append($table).appendTo($body);
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

        var sframeChan = common.getSframeChannel();
        var onError = $.noop,
            onComplete = $.noop,
            updateProgress = $.noop,
            onPending = $.noop;
        sframeChan.on('EV_FILE_UPLOAD_STATE', function (data) {
            if (data.error) {
                return void onError(data.error);
            }
            if (data.complete && data.href) {
                return void onComplete(data.href);
            }
            if (typeof data.progress !== "undefined") {
                return void updateProgress(data.progress);
            }
        });
        sframeChan.on('Q_CANCEL_PENDING_FILE_UPLOAD', function (data, cb) {
            onPending(cb);
        });
        var upload = function (file) {
            var blob = file.blob; // This is not a blob but an array buffer
            var u8 = new Uint8Array(blob);
            var metadata = file.metadata;
            var id = file.id;
            var dropEvent = file.dropEvent;
            delete file.dropEvent;
            if (dropEvent && dropEvent.path) { file.path = dropEvent.path; }
            if (queue.inProgress) { return; }
            queue.inProgress = true;

            var $row = $table.find('tr[id="'+id+'"]');

            $row.find('.cp-fileupload-table-cancel').html('-');
            var $pv = $row.find('.cp-fileupload-table-progress-value');
            var $pb = $row.find('.cp-fileupload-table-progress-container');
            var $pc = $row.find('.cp-fileupload-table-progress');
            var $link = $row.find('.cp-fileupload-table-link');

            updateProgress = function (progressValue) {
                $pv.text(Math.round(progressValue*100)/100 + '%');
                $pb.css({
                    width: (progressValue/100)*$pc.width()+'px'
                });
            };

            onComplete = function (href) {
                var mdMgr = common.getMetadataMgr();
                var origin = mdMgr.getPrivateData().origin;
                $link.prepend($('<span>', {'class': 'fa fa-external-link'}));
                $link.attr('href', href)
                    .click(function (e) {
                        e.preventDefault();
                        window.open(origin + $link.attr('href'), '_blank');
                    });
                var title = metadata.name;
                if (!config.noStore) {
                    UI.log(Messages._getKey('upload_success', [title]));
                }
                common.prepareFeedback('upload')();

                if (config.onUploaded) {
                    var data = getData(file, href);
                    config.onUploaded(dropEvent, data);
                }

                queue.inProgress = false;
                queue.next();
            };

            onError = function (e) {
                queue.inProgress = false;
                queue.next();
                if (e === 'TOO_LARGE') {
                    $pv.text(Messages.upload_tooLargeBrief);
                    return void UI.alert(Messages.upload_tooLarge);
                }
                if (e === 'NOT_ENOUGH_SPACE') {
                    $pv.text(Messages.upload_notEnoughSpaceBrief);
                    return void UI.alert(Messages.upload_notEnoughSpace);
                }
                console.error(e);
                return void UI.alert(Messages.upload_serverError);
            };

            onPending = function (cb) {
                UI.confirm(Messages.upload_uploadPending, cb);
            };

            file.noStore = config.noStore;
            try {
                file.blob = Nacl.util.encodeBase64(u8);
                common.uploadFile(file, function () {
                    console.log('Upload started...');
                });
            } catch (e) {
                UI.alert(Messages.upload_serverError);
            }
        };

        var prettySize = function (bytes) {
            var kB = Util.bytesToKilobytes(bytes);
            if (kB < 1024) { return kB + Messages.KB; }
            var mB = Util.bytesToMegabytes(bytes);
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
            // setTimeout to fix a firefox error 'NS_ERROR_NOT_AVAILABLE'
            window.setTimeout(function () { File.$container.show(); });
            var file = queue.queue.shift();
            upload(file);
        };
        queue.push = function (obj) {
            var id = uid();
            obj.id = id;
            queue.queue.push(obj);

            // setTimeout to fix a firefox error 'NS_ERROR_NOT_AVAILABLE'
            window.setTimeout(function () { $table.show(); });
            var estimate = FileCrypto.computeEncryptedSize(obj.blob.byteLength, obj.metadata);

            var $progressBar = $('<div>', {'class':'cp-fileupload-table-progress-container'});
            var $progressValue = $('<span>', {'class':'cp-fileupload-table-progress-value'}).text(Messages.upload_pending);

            var $tr = $('<tr>', {id: id}).appendTo($table);

            var $cancel = $('<span>', {'class': 'cp-fileupload-table-cancel-button fa fa-times'}).click(function () {
                queue.queue = queue.queue.filter(function (el) { return el.id !== id; });
                $cancel.remove();
                $tr.find('.cp-fileupload-table-cancel').text('-');
                $tr.find('.cp-fileupload-table-progress-value').text(Messages.upload_cancelled);
            });

            var $link = $('<a>', {
                'class': 'cp-fileupload-table-link',
                'rel': 'noopener noreferrer'
            }).text(obj.metadata.name);

            $('<td>').append($link).appendTo($tr);
            $('<td>').text(prettySize(estimate)).appendTo($tr);
            $('<td>', {'class': 'cp-fileupload-table-progress'}).append($progressBar).append($progressValue).appendTo($tr);
            $('<td>', {'class': 'cp-fileupload-table-cancel'}).append($cancel).appendTo($tr);

            queue.next();
        };

        // Don't show the rename prompt if we don't want to store the file in the drive (avatar)
        var showNamePrompt = !config.noStore;

        var promptName = function (file, cb) {
            var extIdx = file.name.lastIndexOf('.');
            var name = extIdx !== -1 ? file.name.slice(0,extIdx) : file.name;
            var ext = extIdx !== -1 ? file.name.slice(extIdx) : "";
            var msg = Messages._getKey('upload_rename', [
                Util.fixHTML(file.name),
                Util.fixHTML(ext)
            ]);
            UI.prompt(msg, name, function (newName) {
                if (newName === null) {
                    showNamePrompt = false;
                    return void cb (file.name);
                }
                if (!newName || !newName.trim()) { return void cb (file.name); }
                var newExtIdx = newName.lastIndexOf('.');
                var newExt = newExtIdx !== -1 ? newName.slice(newExtIdx) : "";
                if (newExt !== ext) { newName += ext; }
                cb(newName);
            }, {cancel: Messages.doNotAskAgain}, true);
        };
        var handleFileState = {
            queue: [],
            inProgress: false
        };
        var handleFile = File.handleFile = function (file, e) {
            if (handleFileState.inProgress) { return void handleFileState.queue.push([file, e]); }
            handleFileState.inProgress = true;

            var thumb;
            var file_arraybuffer;
            var name = file.name;
            var finish = function () {
                var metadata = {
                    name: name,
                    type: file.type,
                };
                if (thumb) { metadata.thumbnail = thumb; }
                queue.push({
                    blob: file_arraybuffer,
                    metadata: metadata,
                    dropEvent: e
                });
                handleFileState.inProgress = false;
                if (handleFileState.queue.length) {
                    var next = handleFileState.queue.shift();
                    handleFile(next[0], next[1]);
                }
            };
            var getName = function () {
                if (!showNamePrompt) { return void finish(); }
                promptName(file, function (newName) {
                    name = newName;
                    finish();
                });
            };

            blobToArrayBuffer(file, function (e, buffer) {
                if (e) { console.error(e); }
                file_arraybuffer = buffer;
                if (!Thumb.isSupportedType(file.type)) { return getName(); }
                // make a resized thumbnail from the image..
                Thumb.fromBlob(file, function (e, thumb64) {
                    if (e) { console.error(e); }
                    if (!thumb64) { return getName(); }
                    thumb = thumb64;
                    getName();
                });
            });
        };

        var onFileDrop = File.onFileDrop = function (file, e) {
            if (!common.isLoggedIn()) {
                return UI.alert(common.Messages.upload_mustLogin);
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
                $hoverArea.addClass('cp-fileupload-hovering');
            })
            .on('dragleave', function (e) {
                e.preventDefault();
                e.stopPropagation();
                counter--;
                if (counter <= 0) {
                    $hoverArea.removeClass('cp-fileupload-hovering');
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
                $hoverArea.removeClass('cp-fileupload-hovering');
                onFileDrop(dropped, e);
            });
        };
        var createCkeditorDropHandler = function () {
            var editor = config.ckeditor;
            editor.document.on('drop', function (ev) {
                var dropped = ev.data.$.dataTransfer.files;
                onFileDrop(dropped, ev);
                ev.data.preventDefault(true);
            });
        };

        var createUploader = function ($area, $hover, $body) {
            if (!config.noHandlers) {
                if (config.ckeditor) {
                    createCkeditorDropHandler();
                } else {
                    createAreaHandlers($area, null);
                }
            }
            createTableContainer($body);
        };

        createUploader(config.dropArea, config.hoverArea, config.body);

        return File;
    };

    return module;
});
