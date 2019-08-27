define([
    '/file/file-crypto.js',
    '/common/common-hash.js',
    '/bower_components/nthen/index.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function (FileCrypto, Hash, nThen) {
    var Nacl = window.nacl;
    var module = {};

    module.upload = function (file, noStore, common, updateProgress, onComplete, onError, onPending) {
        var u8 = file.blob; // This is not a blob but a uint8array
        var metadata = file.metadata;

        var owned = file.owned;

        // if it exists, path contains the new pad location in the drive
        var path = file.path;

        var password = file.password;
        var forceSave = file.forceSave;
        var hash, secret, key, id, href;

        var getNewHash = function () {
            hash = Hash.createRandomHash('file', password);
            secret = Hash.getSecrets('file', hash, password);
            key = secret.keys.cryptKey;
            id = secret.channel;
            href = '/file/#' + hash;
        };

        var getValidHash = function (cb) {
            getNewHash();
            common.getFileSize(href, password, function (err, size) {
                if (err || typeof(size) !== "number") {  throw new Error(err || "Invalid size!"); }
                if (size === 0) { return void cb(); }
                getValidHash();
            });
        };

        var edPublic;
        nThen(function (waitFor) {
            // Generate a hash and check if the resulting id is valid (not already used)
            getValidHash(waitFor());
        }).nThen(function (waitFor) {
            if (!owned) { return; }
            common.getMetadata(waitFor(function (err, m) {
                edPublic = m.priv.edPublic;
                metadata.owners = [edPublic];
            }));
        }).nThen(function () {
            var next = FileCrypto.encrypt(u8, metadata, key);

            var estimate = FileCrypto.computeEncryptedSize(u8.length, metadata);

            var sendChunk = function (box, cb) {
                var enc = Nacl.util.encodeBase64(box);
                common.uploadChunk(enc, function (e, msg) {
                    cb(e, msg);
                });
            };

            var actual = 0;
            var again = function (err, box) {
                if (err) { throw new Error(err); }
                if (box) {
                    actual += box.length;
                    var progressValue = (actual / estimate * 100);
                    progressValue = Math.min(progressValue, 100);
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
                common.uploadComplete(id, owned, function (e) {
                    if (e) { return void console.error(e); }
                    var uri = ['', 'blob', id.slice(0,2), id].join('/');
                    console.log("encrypted blob is now available as %s", uri);


                    var title = metadata.name;

                    if (noStore) { return void onComplete(href); }

                    var data = {
                        title: title || "",
                        href: href,
                        path: path,
                        password: password,
                        channel: id,
                        owners: metadata.owners,
                        forceSave: forceSave
                    };
                    common.setPadTitle(data, function (err) {
                        if (err) { return void console.error(err); }
                        onComplete(href);
                        common.setPadAttribute('fileType', metadata.type, null, href);
                        common.setPadAttribute('owners', metadata.owners, null, href);
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
                        common.uploadCancel(estimate, function (e) {
                            if (e) {
                                return void console.error(e);
                            }
                            next(again);
                        });
                    });
                }
                next(again);
            });
        });

    };
    return module;
});
