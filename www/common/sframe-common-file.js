define([
    'jquery',
    '/file/file-crypto.js',
    '/common/common-thumbnail.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/hyperscript.js',
    '/customize/messages.js',

    '/bower_components/file-saver/FileSaver.min.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function ($, FileCrypto, Thumb, UI, UIElements, Util, Hash, h, Messages) {
    var Nacl = window.nacl;
    var saveAs = window.saveAs;
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
        var origin = common.getMetadataMgr().getPrivateData().origin;

        var queue = File.queue = {
            queue: [],
            inProgress: false
        };

        var uid = function () {
            return 'cp-fileupload-element-' + String(Math.random()).substring(2);
        };

        var $table = File.$table = $('<table>', { id: 'cp-fileupload-table' });
        var $thead = $('<tr>').appendTo($table);
        $('<td>').text(Messages.upload_type).appendTo($thead);
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
            data.password = file.password;
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
                clearTimeout(queue.to);
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
            if (file.dl) { return void file.dl(file); }
            upload(file);
        };
        queue.push = function (obj) {
            var id = uid();
            obj.id = id;
            queue.queue.push(obj);

            // setTimeout to fix a firefox error 'NS_ERROR_NOT_AVAILABLE'
            window.setTimeout(function () { $table.show(); });
            var estimate = obj.dl ? obj.size : FileCrypto.computeEncryptedSize(obj.blob.byteLength, obj.metadata);

            var $progressBar = $('<div>', {'class':'cp-fileupload-table-progress-container'});
            var $progressValue = $('<span>', {'class':'cp-fileupload-table-progress-value'}).text(Messages.upload_pending);

            var $tr = $('<tr>', {id: id}).appendTo($table);
            var $lines = $table.find('tr[id]');
            if ($lines.length > 5) {
                $lines.slice(0, $lines.length - 5).remove();
            }

            var $cancel = $('<span>', {'class': 'cp-fileupload-table-cancel-button fa fa-times'}).click(function () {
                queue.queue = queue.queue.filter(function (el) { return el.id !== id; });
                $cancel.remove();
                $tr.find('.cp-fileupload-table-cancel').text('-');
                $tr.find('.cp-fileupload-table-progress-value').text(Messages.upload_cancelled);
            });

            var $link = $('<a>', {
                'class': 'cp-fileupload-table-link',
                'rel': 'noopener noreferrer'
            }).text(obj.dl ? obj.name : obj.metadata.name);

            $('<td>').text(obj.dl ? Messages.download_dl : Messages.upload_up).appendTo($tr);
            $('<td>').append($link).appendTo($tr);
            $('<td>').text(prettySize(estimate)).appendTo($tr);
            $('<td>', {'class': 'cp-fileupload-table-progress'}).append($progressBar).append($progressValue).appendTo($tr);
            $('<td>', {'class': 'cp-fileupload-table-cancel'}).append($cancel).appendTo($tr);

            queue.next();
        };

        // Get the upload options
        var modalState = {
            owned: true,
            store: true
        };
        var fileUploadModal = function (file, cb) {
            var extIdx = file.name.lastIndexOf('.');
            var name = extIdx !== -1 ? file.name.slice(0,extIdx) : file.name;
            var ext = extIdx !== -1 ? file.name.slice(extIdx) : "";

            var createHelper = function (href, text) {
                var q = h('a.fa.fa-question-circle', {
                    style: 'text-decoration: none !important;',
                    title: text,
                    href: origin + href,
                    target: "_blank",
                    'data-tippy-placement': "right"
                });
                return q;
            };

            var privateData = common.getMetadataMgr().getPrivateData();
            var autoStore = Util.find(privateData, ['settings', 'general', 'autostore']) || 0;
            var initialState = modalState.owned || modalState.store;
            var initialDisabled = modalState.owned ? { disabled: true } : {};
            var manualStore = autoStore === 1 ? undefined :
                UI.createCheckbox('cp-upload-store', Messages.autostore_forceSave, initialState, {
                    input: initialDisabled
                });

            // Ask for name, password and owner
            var content = h('div', [
                h('h4', Messages.upload_modal_title),
                UIElements.setHTML(h('label', {for: 'cp-upload-name'}),
                                   Messages._getKey('upload_modal_filename', [ext])),
                h('input#cp-upload-name', {type: 'text', placeholder: name}),
                h('label', {for: 'cp-upload-password'}, Messages.creation_passwordValue),
                UI.passwordInput({id: 'cp-upload-password'}),
                h('span', {
                    style: 'display:flex;align-items:center;justify-content:space-between'
                }, [
                    UI.createCheckbox('cp-upload-owned', Messages.upload_modal_owner, modalState.owned),
                    createHelper('/faq.html#keywords-owned', Messages.creation_owned1)
                ]),
                manualStore
            ]);

            $(content).find('#cp-upload-owned').on('change', function () {
                var val = $(content).find('#cp-upload-owned').is(':checked');
                if (val) {
                    $(content).find('#cp-upload-store').prop('checked', true).prop('disabled', true);
                } else {
                    $(content).find('#cp-upload-store').prop('disabled', false);
                }
            });

            UI.confirm(content, function (yes) {
                if (!yes) { return void cb(); }

                // Get the values
                var newName = $(content).find('#cp-upload-name').val();
                var password = $(content).find('#cp-upload-password').val() || undefined;
                var owned = $(content).find('#cp-upload-owned').is(':checked');
                var forceSave = owned || $(content).find('#cp-upload-store').is(':checked');

                modalState.owned = owned;
                modalState.store = forceSave;

                // Add extension to the name if needed
                if (!newName || !newName.trim()) { newName = file.name; }
                var newExtIdx = newName.lastIndexOf('.');
                var newExt = newExtIdx !== -1 ? newName.slice(newExtIdx) : "";
                if (newExt !== ext) { newName += ext; }

                cb({
                    name: newName,
                    password: password,
                    owned: owned,
                    forceSave: forceSave
                });
            });
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
            var password;
            var owned = true;
            var forceSave;
            var finish = function (abort) {
                if (!abort) {
                    var metadata = {
                        name: name,
                        type: file.type,
                    };
                    if (thumb) { metadata.thumbnail = thumb; }
                    queue.push({
                        blob: file_arraybuffer,
                        metadata: metadata,
                        password: password,
                        owned: owned,
                        forceSave: forceSave,
                        dropEvent: e
                    });
                }
                handleFileState.inProgress = false;
                if (handleFileState.queue.length) {
                    var next = handleFileState.queue.shift();
                    handleFile(next[0], next[1]);
                }
            };
            var getName = function () {
                // If "noStore", it means we don't want to store this file in our drive (avatar)
                // In this case, we don't want a password or a filename, and we own the file
                if (config.noStore) { return void finish(); }

                // Otherwise, ask for password, name and ownership
                fileUploadModal(file, function (obj) {
                    if (!obj) { return void finish(true); }
                    name = obj.name;
                    password = obj.password;
                    owned = obj.owned;
                    forceSave = obj.forceSave;
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
                editor.document.focus();
                if (!dropped || !dropped.length) { return; }
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

        File.downloadFile = function (fData, cb) {
            var parsed = Hash.parsePadUrl(fData.href || fData.roHref);
            var hash = parsed.hash;
            var name = fData.filename || fData.title;
            var secret = Hash.getSecrets('file', hash, fData.password);
            var src = Hash.getBlobPathFromHex(secret.channel);
            var key = secret.keys && secret.keys.cryptKey;
            common.getFileSize(secret.channel, function (e, data) {
                var todo = function (file) {
                    if (queue.inProgress) { return; }
                    queue.inProgress = true;
                    var id = file.id;

                    var $row = $table.find('tr[id="'+id+'"]');
                    var $pv = $row.find('.cp-fileupload-table-progress-value');
                    var $pb = $row.find('.cp-fileupload-table-progress-container');
                    var $pc = $row.find('.cp-fileupload-table-progress');
                    var $link = $row.find('.cp-fileupload-table-link');

                    var done = function () {
                        $row.find('.cp-fileupload-table-cancel').text('-');
                        queue.inProgress = false;
                        queue.next();
                    };

                    var updateDLProgress = function (progressValue) {
                        var text = Math.round(progressValue*100) + '%';
                        text += ' ('+ Messages.download_step1 +'...)';
                        $pv.text(text);
                        $pb.css({
                            width: progressValue * $pc.width()+'px'
                        });
                    };
                    var updateProgress = function (progressValue) {
                        var text = Math.round(progressValue*100) + '%';
                        text += progressValue === 1 ? '' : ' ('+ Messages.download_step2 +'...)';
                        $pv.text(text);
                        $pb.css({
                            width: progressValue * $pc.width()+'px'
                        });
                    };

                    var dl = module.downloadFile(fData, function (err, obj) {
                        $link.prepend($('<span>', {'class': 'fa fa-external-link'}))
                            .attr('href', '#')
                            .click(function (e) {
                            e.preventDefault();
                            obj.download();
                        });
                        done();
                        if (obj) { obj.download(); }
                        cb(err, obj);
                    }, {
                        src: src,
                        key: key,
                        name: name,
                        progress: updateDLProgress,
                        progress2: updateProgress,
                    });

                    var $cancel = $('<span>', {'class': 'cp-fileupload-table-cancel-button fa fa-times'}).click(function () {
                        dl.cancel();
                        $cancel.remove();
                        $row.find('.cp-fileupload-table-progress-value').text(Messages.upload_cancelled);
                        done();
                    });
                    $row.find('.cp-fileupload-table-cancel').html('').append($cancel);
                };
                queue.push({
                    dl: todo,
                    size: data,
                    name: name
                });
            });
        };

        return File;
    };

    module.downloadFile = function (fData, cb, obj) {
        var cancelled = false;
        var cancel = function () {
            cancelled = true;
        };
        var src, key, name;
        if (obj && obj.src && obj.key && obj.name) {
            src = obj.src;
            key = obj.key;
            name = obj.name;
        } else {
            var parsed = Hash.parsePadUrl(fData.href || fData.roHref);
            var hash = parsed.hash;
            name = fData.filename || fData.title;
            var secret = Hash.getSecrets('file', hash, fData.password);
            src = Hash.getBlobPathFromHex(secret.channel);
            key = secret.keys && secret.keys.cryptKey;
        }
        Util.fetch(src, function (err, u8) {
            if (cancelled) { return; }
            if (err) { return void cb('E404'); }
            FileCrypto.decrypt(u8, key, function (err, res) {
                if (cancelled) { return; }
                if (err) { return void cb(err); }
                if (!res.content) { return void cb('EEMPTY'); }
                var dl = function () {
                    saveAs(res.content, name || res.metadata.name);
                };
                cb(null, {
                    metadata: res.metadata,
                    content: res.content,
                    download: dl
                });
            }, obj && obj.progress2);
        }, obj && obj.progress);
        return {
            cancel: cancel
        };
    };

    return module;
});
