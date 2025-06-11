// SPDX-FileCopyrightText: 2025 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const { parentPort } = require('node:worker_threads');
const Path = require('node:path');
const Fs = require('node:fs');
const nThen = require("nthen");
const Semaphore = require("saferphore");
const Logger = require("../../lib/log");
const BlobStorage = require("../../lib/storage/blob");
let config = require("../../lib/load-config");


const blobPath = config.blobPath || './blob';
let Log = {};

// NOTE: in cleaning mode, we DON'T migrate
// (we suppose data has already been migrated)
const start = (clean, dry, cb) => {
    const DRY_RUN = dry;

    let dirList = [];
    let blobStore;
    nThen(w => {
        Logger.create(config, w(function (_log) {
            Log = _log;
        }));
    }).nThen(w => {
        config.getSession = function () {};
        BlobStorage.create(config, w(function (err, _store) {
            if (err) {
                w.abort();
                return void Log.error("ERR_BLOB_STORE", err);
            }
            blobStore = _store;
        }));
    }).nThen(w => {
        Fs.readdir(blobPath, w((err, list) => {
            if (err) {
                w.abort();
                return void Log.error("ERR_READING_ROOT", err);
            }
            dirList = list;
        }));
    }).nThen(() => {
        let n = nThen;
        dirList.forEach(dir => {
            if (dir.length !== 3) { return; }
            // ./blob/abc
            const nestedDirPath = Path.join(blobPath, dir);

            if (clean) {
                n = n(ww => {
                    Log.info("REMOVING_DIR", nestedDirPath);
                    if (DRY_RUN) { return; }
                    Fs.rm(nestedDirPath, {
                        recursive: true, force: true
                    }, ww(err => {
                        if (err) {
                            Log.error("ERR_REMOVE_DIR", {
                                path: nestedDirPath,
                                err
                            });
                        }
                    }));
                }).nThen;
                return;
            }

            n = n(w => {
                // One user at a time
                const sema = Semaphore.create(1);
                let nestedDirList = [];
                nThen(ww => {
                    Fs.readdir(nestedDirPath, ww((err, list) => {
                        if (err) {
                            w.abort();
                            ww.abort();
                            return Log.error("ERR_READING_DIR", {
                                path: nestedDirPath,
                                err
                            });
                        }
                        nestedDirList = list;
                    }));
                }).nThen(ww => {
                    nestedDirList.forEach(key => {
                        // ./blob/abc/abcdefg...
                        const keyPath = Path.join(nestedDirPath, key);
                        sema.take(give => {
                        let edPublic = key.replace(/\-/g, '/');
                        let md = JSON.stringify({ owners: [edPublic] });
                        Log.info("START_USER", edPublic);
                        Fs.readdir(keyPath, ww((err, list) => {
                            if (err) {
                                w.abort();
                                ww.abort();
                                return Log.error("ERR_READING_DIR", {
                                    path: keyPath,
                                    err
                                });
                            }
                            let blobs = [];
                            nThen(www => {
                                list.forEach(dir => {
                                    // ./blob/abc/abcdefg.../01
                                    const path = Path.join(keyPath, dir);
                                    Fs.readdir(path, www((err, blobsList) => {
                                        if (err) {
                                            w.abort();
                                            ww.abort();
                                            www.abort();
                                            return Log.error("ERR_READING_DIR", {
                                                path, err
                                            });
                                        }
                                        Array.prototype.push.apply(blobs, blobsList);
                                    }));
                                });
                            }).nThen(www => {
                                // migrate 20 blobs at a time for a given user
                                const sema = Semaphore.create(20);
                                blobs.forEach(blobId => {
                                    sema.take(ggive => {
                                        blobStore.isBlobAvailable(blobId, www((err, blobExists) => {
                                        blobStore.hasMetadata(blobId, www((err, exists) => {
                                            // If blob is not available or metadata already
                                            // exists, don't write md file
                                            if (!blobExists || exists) { return void ggive(); }
                                            Log.info('WRITE_METADATA', blobId);
                                            if (DRY_RUN) { return void ggive(); }
                                            blobStore.writeMetadata(blobId, md, www(e => {
                                                if (e) {
                                                    w.abort();
                                                    ww.abort();
                                                    www.abort();
                                                    return Log.error("ERR_WRITING_MD", { blobId });
                                                }
                                                ggive();
                                            }));

                                        }));
                                        }));
                                    });
                                });
                            }).nThen(ww(give(() => {
                                Log.info("END_USER", edPublic);
                            })));
                        }));
                        });

                    });
                }).nThen(w());
            }).nThen;
        });
        n(() => {
            Log.info("DONE");
            cb();
        });
    });
};

if (parentPort) {
    // Loaded as worker script
    config = JSON.parse(JSON.stringify(config));
    config.logToStdout = false;
    parentPort.on('message', (message) => {
        let parsed = message; //JSON.parse(message);
        if (!parsed?.start) { return; }
        // Migrate
        start(false, false, () => {
            parentPort.postMessage('MIGRATED');
            // If success, clean
            start(true, false, () => {
                parentPort.postMessage('CLEANED');
            });
        });
    });
    parentPort.postMessage('READY');
} else if (require.main === module) {
    // Loaded from command-line
    let dry = false;
    let clean = false;
    process.argv.forEach(key => {
        if (key === '--dry') {
            dry = true;
            return;
        }
        if (key === '--clean') {
            clean = true;
            return;
        }
    });
    start(clean, dry, () => {
        process.exit(0);
    });
}
