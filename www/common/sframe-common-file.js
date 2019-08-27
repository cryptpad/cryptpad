define([
    'jquery',
    '/file/file-crypto.js',
    '/common/make-backup.js',
    '/common/common-thumbnail.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/hyperscript.js',
    '/customize/messages.js',

    '/bower_components/file-saver/FileSaver.min.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function ($, FileCrypto, MakeBackup, Thumb, UI, UIElements, Util, Hash, h, Messages) {
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
        var origin = common.getMetadataMgr().getPrivateData().origin;

        var queue = File.queue = {
            queue: [],
            inProgress: false
        };

        var uid = function () {
            return 'cp-fileupload-element-' + String(Math.random()).substring(2);
        };

        var tableHeader = h('div.cp-fileupload-header', [
            h('div.cp-fileupload-header-title', h('span', Messages.fileuploadHeader || 'Uploaded files')),
            h('div.cp-fileupload-header-close', h('span.fa.fa-times')),
        ]);


        var $table = File.$table = $('<table>', { id: 'cp-fileupload-table' });

        var createTableContainer = function ($body) {
            File.$container = $('<div>', { id: 'cp-fileupload' }).append(tableHeader).append($table).appendTo($body);
            $('.cp-fileupload-header-close').click(function () {
                File.$container.fadeOut();
            });
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

            $row.find('.cp-fileupload-table-cancel').addClass('success').html('').append(h('span.fa.fa-minus'));
            var $pv = $row.find('.cp-fileupload-table-progress-value');
            var $pb = $row.find('.cp-fileupload-table-progressbar');
            var $link = $row.find('.cp-fileupload-table-link');

            /**
             * Update progress in the download panel, for uploading a file
             * @param {number} progressValue Progression of download, between 0 and 100
             */
            updateProgress = function (progressValue) {
                $pv.text(Math.round(progressValue * 100) / 100 + '%');
                $pb.css({
                    width: progressValue + '%'
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
                    // don't hide panel if mouse over
                    if (File.$container.is(":hover")) {
                        File.$container.one("mouseleave", function () { File.$container.fadeOut(); });
                    }
                    else {
                        File.$container.fadeOut();
                    }
                }, 60000);
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

            var $progressContainer = $('<div>', {'class':'cp-fileupload-table-progress-container'});
            $('<div>', {'class':'cp-fileupload-table-progressbar'}).appendTo($progressContainer);
            $('<span>', {'class':'cp-fileupload-table-progress-value'}).text(Messages.upload_pending).appendTo($progressContainer);

            var $tr = $('<tr>', {id: id}).appendTo($table);
            var $lines = $table.find('tr[id]');
            if ($lines.length > 5) {
                $lines.slice(0, $lines.length - 5).remove();
            }

            var $cancel = $('<span>', {'class': 'cp-fileupload-table-cancel-button fa fa-times'}).click(function () {
                queue.queue = queue.queue.filter(function (el) { return el.id !== id; });
                $cancel.remove();
                $tr.find('.cp-fileupload-table-cancel').addClass('cancelled').html('').append(h('span.fa.fa-minus'));
                $tr.find('.cp-fileupload-table-progress-value').text(Messages.upload_cancelled);
            });

            var $link = $('<a>', {
                'class': 'cp-fileupload-table-link',
                'rel': 'noopener noreferrer'
            }).append(h('span.cp-fileupload-table-name', obj.dl ? obj.name : obj.metadata.name));

            var typeIcon;
            if (obj.dl) { typeIcon = h('span.fa.fa-arrow-down', { title: Messages.download_dl }); }
            else { typeIcon = h('span.fa.fa-arrow-up', { title: Messages.upload_up }); }

            // type (download / upload)
            $('<td>', {'class': 'cp-fileupload-table-type'}).append(typeIcon).appendTo($tr);
            // name
            $('<td>').append($link).appendTo($tr);
            // size
            $('<td>').text(prettySize(estimate)).appendTo($tr);
            // progress
            $('<td>', {'class': 'cp-fileupload-table-progress'}).append($progressContainer).appendTo($tr);
            // cancel
            $('<td>', {'class': 'cp-fileupload-table-cancel'}).append($cancel).appendTo($tr);

            queue.next();
        };

        // Get the upload options
        var modalState = {
            owned: true,
            store: true
        };
        var createHelper = function (href, text) {
            return UI.createHelper(origin + href, text);
        };
        var createManualStore = function (isFolderUpload) {
            var privateData = common.getMetadataMgr().getPrivateData();
            var autoStore = Util.find(privateData, ['settings', 'general', 'autostore']) || 0;
            var initialState = modalState.owned || modalState.store;
            var initialDisabled = modalState.owned ? { disabled: true } : {};
            var manualStore = autoStore === 1 ? undefined :
            UI.createCheckbox('cp-upload-store', isFolderUpload ? (Messages.uploadFolder_modal_forceSave) : Messages.autostore_forceSave, initialState, {
                input: initialDisabled
            });
            return manualStore;
        };
        var fileUploadModal = function (defaultFileName, cb) {
            var parsedName = /^(\.?.+?)(\.[^.]+)?$/.exec(defaultFileName) || [];
            var ext = parsedName[2] || "";

            var manualStore = createManualStore();

            // Ask for name, password and owner
            var content = h('div', [
                h('h4', Messages.upload_modal_title),
                UIElements.setHTML(h('label', {for: 'cp-upload-name'}),
                                   Messages._getKey('upload_modal_filename', [ext])),
                h('input#cp-upload-name', {type: 'text', placeholder: defaultFileName, value: defaultFileName}),
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
                var val = Util.isChecked($(content).find('#cp-upload-owned'));
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
                var owned = Util.isChecked($(content).find('#cp-upload-owned'));
                var forceSave = owned || Util.isChecked($(content).find('#cp-upload-store'));

                modalState.owned = owned;
                modalState.store = forceSave;

                // Add extension to the name if needed
                if (!newName || !newName.trim()) { newName = defaultFileName; }
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

        File.showFolderUploadModal = function (foldername, cb) {
            var manualStore = createManualStore(true);

            // Ask for name, password and owner
            var content = h('div', [
                h('h4', Messages.uploadFolder_modal_title),
                UIElements.setHTML(h('label', {for: 'cp-upload-name'}), Messages.fm_folderName),
                h('input#cp-upload-foldername', {type: 'text', placeholder: foldername, value: foldername}),
                h('label', {for: 'cp-upload-password'}, Messages.uploadFolder_modal_filesPassword),
                UI.passwordInput({id: 'cp-upload-password'}),
                h('span', {
                    style: 'display:flex;align-items:center;justify-content:space-between'
                }, [
                    UI.createCheckbox('cp-upload-owned', Messages.uploadFolder_modal_owner, modalState.owned),
                    createHelper('/faq.html#keywords-owned', Messages.creation_owned1)
                ]),
                manualStore
            ]);

            $(content).find('#cp-upload-owned').on('change', function () {
                var val = Util.isChecked($(content).find('#cp-upload-owned'));
                if (val) {
                    $(content).find('#cp-upload-store').prop('checked', true).prop('disabled', true);
                } else {
                    $(content).find('#cp-upload-store').prop('disabled', false);
                }
            });

            UI.confirm(content, function (yes) {
                if (!yes) { return void cb(); }

                // Get the values
                var newName = $(content).find('#cp-upload-foldername').val();
                var password = $(content).find('#cp-upload-password').val() || undefined;
                var owned = Util.isChecked($(content).find('#cp-upload-owned'));
                var forceSave = owned || Util.isChecked($(content).find('#cp-upload-store'));

                modalState.owned = owned;
                modalState.store = forceSave;

                if (!newName || !newName.trim()) { newName = foldername; }

                cb({
                    folderName: newName,
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
        /* if defaultOptions is passed, the function does not show the upload options modal, and directly save the file with the specified options */
        var handleFile = File.handleFile = function (file, e, defaultOptions) {
            if (handleFileState.inProgress) { return void handleFileState.queue.push([file, e, defaultOptions]); }
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
                    handleFile(next[0], next[1], next[2]);
                }
            };
            var getName = function () {
                // If "noStore", it means we don't want to store this file in our drive (avatar)
                // In this case, we don't want a password or a filename, and we own the file
                if (config.noStore) { return void finish(); }

                // Otherwise, ask for password, name and ownership
                // if default options were passed, upload file immediately
                if (defaultOptions && typeof defaultOptions === "object") {
                    name = defaultOptions.name || file.name;
                    password = defaultOptions.password || undefined;
                    owned = !!defaultOptions.owned;
                    forceSave = !!defaultOptions.forceSave;
                    return void finish();
                }
                // if no default options were passed, ask the user
                else {
                    fileUploadModal(file.name, function (obj) {
                        if (!obj) { return void finish(true); }
                        name = obj.name;
                        password = obj.password;
                        owned = obj.owned;
                        forceSave = obj.forceSave;
                        finish();
                    });
                }
            };

            blobToArrayBuffer(file, function (e, buffer) {
                if (e) { console.error(e); }
                file_arraybuffer = buffer;
                if (!Thumb.isSupportedType(file)) { return getName(); }
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

        // TODO implement the ability to cancel downloads :D
        var updateProgressbar = function (file, data, downloadFunction, cb) {
            if (queue.inProgress) { return; }
            queue.inProgress = true;
            var id = file.id;

            var $row = $table.find('tr[id="'+id+'"]');
            var $pv = $row.find('.cp-fileupload-table-progress-value');
            var $pb = $row.find('.cp-fileupload-table-progressbar');
            var $link = $row.find('.cp-fileupload-table-link');

            var done = function () {
                $row.find('.cp-fileupload-table-cancel').addClass('success').html('').append(h('span.fa.fa-check'));
                queue.inProgress = false;
                queue.next();
            };

            /*
            var cancelled = function () {
                $row.find('.cp-fileupload-table-cancel').addClass('cancelled').html('').append(h('span.fa.fa-minus'));
                queue.inProgress = false;
                queue.next();
            };*/

            /**
             * Update progress in the download panel, for downloading a file
             * @param {number} progressValue Progression of download, between 0 and 1
             */
            var updateDLProgress = function (progressValue) {
                var text = Math.round(progressValue * 100) + '%';
                text += ' ('+ Messages.download_step1 + '...)';
                $pv.text(text);
                $pb.css({
                    width: (progressValue * 100) + '%'
                });
            };

            /**
             * Update progress in the download panel, for decrypting a file (after downloading it)
             * @param {number} progressValue Progression of download, between 0 and 1
             */
            var updateDecryptProgress = function (progressValue) {
                var text = Math.round(progressValue * 100) + '%';
                text += progressValue === 1 ? '' : ' (' + Messages.download_step2 + '...)';
                $pv.text(text);
                $pb.css({
                    width: (progressValue * 100) + '%'
                });
            };

            /**
             * As updateDLProgress but for folders
             * @param {number} progressValue Progression of download, between 0 and 1
             */
            var updateProgress = function (progressValue) {
                var text = Math.round(progressValue*100) + '%';
                $pv.text(text);
                $pb.css({
                    width: (progressValue * 100) + '%'
                });
            };

            var privateData = common.getMetadataMgr().getPrivateData();
            var ctx = {
                fileHost: privateData.fileHost,
                get: common.getPad,
                sframeChan: sframeChan,
            };
            downloadFunction(ctx, data, function (err, obj) {
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
                progress: updateDLProgress,
                progress2: updateDecryptProgress,
                folderProgress: updateProgress,
            });

/*
            var $cancel = $('<span>', {'class': 'cp-fileupload-table-cancel-button fa fa-times'}).click(function () {
                dl.cancel();
                $cancel.remove();
                $row.find('.cp-fileupload-table-progress-value').text(Messages.upload_cancelled);
                cancelled();
            });
*/

            $row.find('.cp-fileupload-table-cancel')
                .html('')
                .append(h('span.fa.fa-minus'));
                //.append($cancel);
        };

        File.downloadFile = function (fData, cb) {
            var name = fData.filename || fData.title;
            common.getFileSize(fData.channel, function (e, data) {
                queue.push({
                    dl: function (file) { updateProgressbar(file, fData, MakeBackup.downloadFile, cb); },
                    size: data,
                    name: name
                });
            });
        };

        File.downloadPad = function (pData, cb) {
            queue.push({
                dl: function (file) { updateProgressbar(file, pData, MakeBackup.downloadPad, cb); },
                size: 0,
                name: pData.title,
            });
        };

        File.downloadFolder = function (data, cb) {
            queue.push({
                dl: function (file) { updateProgressbar(file, data, MakeBackup.downloadFolder, cb); },
                size: 0,
                name: data.folderName,
            });
        };

        return File;
    };


    return module;
});
