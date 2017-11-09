define([
    '/file/file-crypto.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function (FileCrypto) {
    var Nacl = window.nacl;
    var module = {};

    module.upload = function (file, noStore, common, updateProgress, onComplete, onError, onPending) {
        var u8 = file.blob; // This is not a blob but a uint8array
        var metadata = file.metadata;

        // if it exists, path contains the new pad location in the drive
        var path = file.path;

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

                common.initialPath = path;
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
    return module;
});
