define([
    '/common/cryptget.js',
    '/common/userObject.js',
    '/common/common-hash.js',
    '/common/common-realtime.js',
], function (Crypt, FO, Hash, Realtime) {
    var exp = {};

    exp.anonDriveIntoUser = function (proxyData, fsHash, cb) {
        // Make sure we have an FS_hash and we don't use it, otherwise just stop the migration and cb
        if (!fsHash || !proxyData.loggedIn) {
            if (typeof(cb) === "function") { return void cb(); }
        }
        // Get the content of FS_hash and then merge the objects, remove the migration key and cb
        var todo = function (err, doc) {
            if (err) { console.error("Cannot migrate recent pads", err); return; }
            var parsed;
            if (!doc) {
                if (typeof(cb) === "function") { cb(); }
                return;
            }
            try { parsed = JSON.parse(doc); } catch (e) {
                if (typeof(cb) === "function") { cb(); }
                console.error("Cannot parsed recent pads", e);
                return;
            }
            if (parsed) {
                var proxy = proxyData.proxy;
                var oldFo = FO.init(parsed.drive, {
                    loggedIn: true,
                    outer: true
                });
                var onMigrated = function () {
                    oldFo.fixFiles(true);
                    var manager = proxyData.manager;
                    var oldFiles = oldFo.getFiles([oldFo.FILES_DATA]);
                    oldFiles.forEach(function (id) {
                        var data = oldFo.getFileData(id);
                        var channel = data.channel;

                        var datas = manager.findChannel(channel, true);
                        // Do not migrate a pad if we already have it, it would create a duplicate
                        // in the drive
                        if (datas.length !== 0) {
                            // We want to merge a read-only pad: it can't be stronger than what
                            // we already have so abort
                            if (!data.href) { return; }

                            // We want to merge an edit pad: check if we have the same channel
                            // but read-only and upgrade it in that case
                            datas.forEach(function (pad) {
                                if (pad.data && !pad.data.href) { pad.data.href = data.href; }
                            });
                            return;
                        }
                        // Here it means we have a new href, so we should add it to the drive
                        if (data) {
                            manager.addPad(null, data, function (err) {
                                if (err) {
                                    return void console.error("Cannot import file:", data, err);
                                }
                            });
                        }
                    });
                    if (!proxy.FS_hashes || !Array.isArray(proxy.FS_hashes)) {
                        proxy.FS_hashes = [];
                    }
                    if (proxy.FS_hashes.indexOf(fsHash) === -1) {
                        proxy.FS_hashes.push(fsHash);
                    }
                    if (typeof(cb) === "function") {
                        Realtime.whenRealtimeSyncs(proxyData.realtime, cb);
                    }
                };
                if (oldFo && typeof(oldFo.migrate) === 'function') {
                    oldFo.migrate(onMigrated);
                } else {
                    console.log('oldFo.migrate is not a function');
                    onMigrated();
                }
                return;
            }
            if (typeof(cb) === "function") { cb(); }
        };
        Crypt.get(fsHash, todo);
    };

    return exp;
});
