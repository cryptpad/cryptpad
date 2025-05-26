// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

var Fs = require("fs");
var Fse = require("fs-extra");
var Path = require("path");

var BlobStore = module.exports;
var nThen = require("nthen");
var Semaphore = require("saferphore");
var Util = require("../common-util");
const Crypto = require('crypto');

const PERMISSIVE = 511;

const readFileBin = require("../stream-file").readFileBin;

const BLOB_LENGTH = 48;

var isValidSafeKey = function (safeKey) {
    return typeof(safeKey) === 'string' && !/\//.test(safeKey) && safeKey.length === 44;
};

var isValidId = function (id) {
    return typeof(id) === 'string' && id.length === BLOB_LENGTH && !/[^a-f0-9]/.test(id);
};

// helpers

var prependArchive = function (Env, path) {
    // Env has an absolute path to the blob storage
    // we want the path to the blob relative to that
    var relativePathToBlob = Path.relative(Env.blobPath, path);
    // the new path structure is the same, but relative to the blob archive root
    return Path.join(Env.archivePath, 'blob', relativePathToBlob);
};

// /blob/<blobPrefix>/<blobId>
var makeBlobPath = function (Env, blobId) {
    return Path.join(Env.blobPath, blobId.slice(0, 2), blobId);
};


var makeActivityPath = function (Env, blobId) {
    return makeBlobPath(Env, blobId) + '.activity';
};

// /blob/<blobPrefix>/<blobId>.metadata.ndjson
var mkMetadataPath = function (Env, blobId) {
    return Path.join(Env.blobPath, blobId.slice(0, 2), blobId) + '.metadata.ndjson';
};

// /blobstate/<safeKeyPrefix>/<safeKey>
var makeStagePath = function (Env, safeKey) {
    return Path.join(Env.blobStagingPath, safeKey.slice(0, 2), safeKey);
};

var mkPlaceholderPath = function (Env, blobId) {
    return makeBlobPath(Env, blobId) + '.placeholder';
};

// Placeholder for deleted files
var addPlaceholder = function (Env, blobId, reason, cb) {
    if (!reason) { return cb(); }
    var path = mkPlaceholderPath(Env, blobId);
    var s_data = typeof(reason) === "string" ? reason : `${reason.code}:${reason.txt}`;
    Fs.writeFile(path, s_data, cb);
};
var clearPlaceholder = function (Env, blobId, cb) {
    var path = mkPlaceholderPath(Env, blobId);
    Fs.unlink(path, cb);
};
var readPlaceholder = function (Env, blobId, cb) {
    var path = mkPlaceholderPath(Env, blobId);
    Fs.readFile(path, function (err, content) {
        if (err) { return void cb(); }
        cb(content.toString('utf8'));
    });
};


// getUploadSize: used by
    // getFileSize
var getUploadSize = function (Env, blobId, cb) {
    var path = makeBlobPath(Env, blobId);
    if (!path) { return cb('INVALID_UPLOAD_ID'); }
    Fs.stat(path, function (err, stats) {
        if (err) {
            // if a file was deleted, its size is 0 bytes
            if (err.code === 'ENOENT') {
                return readPlaceholder(Env, blobId, (content) => {
                    if (!content) { return cb(void 0, 0); }
                    cb({
                        code: err.code,
                        reason: content
                    });

                });
            }
            return void cb(err.code);
        }
        cb(void 0, stats.size);
    });
};

// isFile: used by
    // removeOwnedBlob
    // uploadComplete
    // uploadStatus
var isFile = function (filePath, cb) {
    Fs.stat(filePath, function (e, stats) {
        if (e) {
            if (e.code === 'ENOENT') { return void cb(void 0, false); }
            return void cb(e.message);
        }
        return void cb(void 0, stats.isFile());
    });
};

// PROOFS
// DEPRECATED, keep for compatibility
// /blob/<safeKeyPrefix>/<safeKey>/<blobPrefix>/<blobId>
var makeProofPath = function (Env, safeKey, blobId) {
    return Path.join(Env.blobPath, safeKey.slice(0, 3), safeKey, blobId.slice(0, 2), blobId);
};
// isOwnedBy(id, safeKey)
var isOwnedBy = function (Env, safeKey, blobId, cb) {
    var proofPath = makeProofPath(Env, safeKey, blobId);
    isFile(proofPath, cb);
};

var makeFileStream = function (full, _cb) {
    var cb = Util.once(Util.mkAsync(_cb));
    Fse.mkdirp(Path.dirname(full), function (e) {
        if (e || !full) { // !full for pleasing flow, it's already checked
            return void cb(e ? e.message : 'INTERNAL_ERROR');
        }

        try {
            var stream = Fs.createWriteStream(full, {
                flags: 'a',
                encoding: 'binary',
                highWaterMark: Math.pow(2, 16),
            });
            stream.on('open', function () {
                cb(void 0, stream);
            });
            stream.on('error', function (err) {
                cb(err);
            });
        } catch (err) {
            cb('BAD_STREAM');
        }
    });
};

var clearActivity = function (Env, blobId, cb) {
    var path = makeActivityPath(Env, blobId);
    // if we fail to delete the activity file, it can still be removed later by the eviction script
    Fs.unlink(path, cb);
};
var updateActivity = function (Env, blobId, cb) {
    var path = makeActivityPath(Env, blobId);
    var blobPath = makeBlobPath(Env, blobId);
    isFile(blobPath, (err, state) => {
        if (err || !state) { return void cb(); }
        var s_data = String(+new Date());
        Fs.writeFile(path, s_data, cb);
    });
};

var archiveActivity = function (Env, blobId, cb) {
    var path = makeActivityPath(Env, blobId);
    var archivePath = prependArchive(Env, path);
    // if we fail to delete the activity file, it can still be removed later by the eviction script
    Fse.move(path, archivePath, { overwrite: true }, cb);
};
var removeArchivedActivity = function (Env, blobId, cb) {
    var path = makeActivityPath(Env, blobId);
    var archivePath = prependArchive(Env, path);
    Fs.unlink(archivePath, cb);
};
var restoreActivity = function (Env, blobId, cb) {
    var path = makeActivityPath(Env, blobId);
    var archivePath = prependArchive(Env, path);
    Fse.move(archivePath, path, cb);
};

var getActivity = function (Env, blobId, cb) {
    var path = makeActivityPath(Env, blobId);
    Fs.readFile(path, function (err, content) {
        if (err) { return void cb(err); }
        try {
            var date = new Date(+content);
            cb(void 0, date);
        } catch (err2) {
            cb(err2);
        }
    });
};

// destroyStream && createIdleStreamCollector
// copied from lib/storage/file.js
// see comments there
const STREAM_CLOSE_TIMEOUT = 120000;
const STREAM_DESTROY_TIMEOUT = 30000;
const destroyStream = function (stream) {
    if (!stream) { return; }
    try {
        stream.close();
        if (stream.closed && stream.fd === null) { return; }
    } catch (err) {
        console.error(err);
    }
    setTimeout(function () {
        try { stream.destroy(); } catch (err) { console.error(err); }
    }, STREAM_DESTROY_TIMEOUT);
};
const createIdleStreamCollector = function (stream) {
    var collector = Util.once(Util.mkAsync(Util.bake(destroyStream, [stream])));
    collector.keepAlive = Util.throttle(collector, STREAM_CLOSE_TIMEOUT);
    collector.keepAlive();
    return collector;
};

//  writeMetadata appends to the dedicated log of metadata amendments
var writeMetadata = function (env, channelId, data, cb) {
    var path = mkMetadataPath(env, channelId);

    Fse.mkdirp(Path.dirname(path), PERMISSIVE, function (err) {
        if (err && err.code !== 'EEXIST') { return void cb(err); }
        Fs.appendFile(path, data + '\n', cb);
    });
};
var archiveMetadata = (Env, blobId, cb) => {
    var path = mkMetadataPath(Env, blobId);
    var archivePath = prependArchive(Env, path);
    // TODO eviction clean lone md files
    // if we fail to delete the metadata file, it can still be removed later by the eviction script
    Fse.move(path, archivePath, { overwrite: true }, cb);
};
var restoreMetadata = function (Env, blobId, cb) {
    var path = mkMetadataPath(Env, blobId);
    var archivePath = prependArchive(Env, path);
    Fse.move(archivePath, path, cb);
};
var readBlobMetadata = function (env, blobId, handler, _cb) {
    var metadataPath = mkMetadataPath(env, blobId);
    var stream = Fs.createReadStream(metadataPath, {start: 0});

    const collector = createIdleStreamCollector(stream);
    var cb = Util.both(_cb, collector);

    readFileBin(stream, function (msgObj, readMore) {
        collector.keepAlive();
        var line = msgObj.buff.toString('utf8');
        try {
            var parsed = JSON.parse(line);
            handler(null, parsed);
        } catch (err) {
            handler(err, line);
        }
        readMore();
    }, function (err) {
        // ENOENT => there is no metadata log
        if (!err || err.code === 'ENOENT') { return void cb(); }
        // otherwise stream errors?
        cb(err);
    });
};

/**********  METHODS **************/

var uploadWs = function (Env, safeKey, content, cb) {
    var dec;

    try { dec = Buffer.from(content, 'base64'); }
    catch (e) { return void cb('DECODE_BUFFER'); }

    var len = dec.length;

    var session = Env.getSession(safeKey);

    /*
    if (typeof(session.currentUploadSize) !== 'number' ||
        typeof(session.pendingUploadSize) !== 'number') {
        // improperly initialized... maybe they didn't check before uploading?
        // reject it, just in case
        return cb('NOT_READY');
    }

    if (session.currentUploadSize > session.pendingUploadSize) {
        return cb('E_OVER_LIMIT');
    }
    */

    var stagePath = makeStagePath(Env, safeKey);

    if (!session.blobstage) {
        makeFileStream(stagePath, function (e, stream) {
            if (!stream) { return void cb(e); }

            var blobstage = session.blobstage = stream;
            blobstage.write(dec);
            session.currentUploadSize += len;
            cb(void 0, dec.length);
        });
    } else {
        session.blobstage.write(dec);
        session.currentUploadSize += len;
        cb(void 0, dec.length);
    }
};
var upload = function (Env, safeKey, content, cb) {
    var dec;

    try { dec = Buffer.from(content, 'base64'); }
    catch (e) { return void cb('DECODE_BUFFER'); }

    var path = makeStagePath(Env, safeKey);
    Fs.appendFile(path, dec, cb);
};
const getRandomCookie = function () {
    return Crypto.randomBytes(16).toString('hex');
};
var uploadCookie = function (Env, safeKey, cb) {
    var stagePath = makeStagePath(Env, safeKey);
    var cookiePath = stagePath + '.cookie';
    const cookie = getRandomCookie();

    Fse.mkdirp(Path.dirname(cookiePath), PERMISSIVE, function (err) {
        if (err && err.code !== 'EEXIST') { return void cb(err); }
        Fs.writeFile(cookiePath, cookie, err => {
            cb(err, cookie);
        });
    });
};
var checkUploadCookie = function (Env, safeKey, cb) {
    var stagePath = makeStagePath(Env, safeKey);
    var cookiePath = stagePath + '.cookie';

    Fs.readFile(cookiePath, function (err, content) {
        if (err) { return void cb(); }
        let expireTime = +new Date() - (5*60*1000);
        Fs.stat(cookiePath, function (err, stats) {
            if (stats.mtime < expireTime) { return void cb(); }
            cb(content.toString('utf8'));
        });
    });
};

var closeBlobstage = function (Env, safeKey) {
    var session = Env.getSession(safeKey);
    if (!(session && session.blobstage && typeof(session.blobstage.close) === 'function')) {
        return;
    }
    session.blobstage.close();
    delete session.blobstage;
};

// upload_cancel
var upload_cancel = function (Env, safeKey, fileSize, cb) {
    var session = Env.getSession(safeKey);
    session.pendingUploadSize = fileSize;
    session.currentUploadSize = 0;
    if (session.blobstage) {
        session.blobstage.close();
        delete session.blobstage;
    }

    var path = makeStagePath(Env, safeKey);

    Fs.unlink(path, function (e) {
        if (e) { return void cb('E_UNLINK'); }
        cb(void 0);
    });
};

// upload_complete
var upload_complete = function (Env, safeKey, id, cb) {
    closeBlobstage(Env, safeKey);

    var oldPath = makeStagePath(Env, safeKey);
    var newPath = makeBlobPath(Env, id);

    nThen(function (w) {
        // make sure the path to your final location exists
        Fse.mkdirp(Path.dirname(newPath), w(function (e) {
            if (e) {
                w.abort();
                return void cb('RENAME_ERR');
            }
        }));
    }).nThen(function (w) {
        // make sure there's not already something in that exact location
        isFile(newPath, w(function (e, yes) {
            if (e) {
                w.abort();
                return void cb(e);
            }
            if (yes) {
                w.abort();
                return void cb('RENAME_ERR');
            }
            cb(void 0, id);
        }));
    }).nThen(function () {
        // finally, move the old file to the new path
        // FIXME we could just move and handle the EEXISTS instead of the above block
        Fse.move(oldPath, newPath, function (e) {
            if (e) { return void cb('RENAME_ERR'); }

            // clear upload cookie
            Fs.unlink(oldPath+'.cookie', function () {});

            cb(void 0, id);
        });
    });
};

var tryId = function (path, cb) {
    Fs.access(path, Fs.constants.R_OK | Fs.constants.W_OK, function (e) {
        if (!e) {
            // generate a new id (with the same prefix) and recurse
            return void cb('EEXISTS');
        } else if (e.code === 'ENOENT') {
            // no entry, so it's safe for us to proceed
            return void cb();
        } else {
            // it failed in an unexpected way. log it
            return void cb(e.code);
        }
    });
};

// owned_upload_complete
let unescapeKeyCharacters = function (key) {
    return key.replace(/\-/g, '/');
};
var owned_upload_complete = function (Env, safeKey, id, cb) {
    closeBlobstage(Env, safeKey);
    if (!isValidId(id)) {
        return void cb('EINVAL_ID');
    }

    var oldPath = makeStagePath(Env, safeKey);
    if (typeof(oldPath) !== 'string') {
        return void cb('EINVAL_CONFIG');
    }

    var finalPath = makeBlobPath(Env, id);
    let unsafeKey = unescapeKeyCharacters(safeKey);

    // the user wants to move it into blob and create a metadata log with an owner

    nThen(function (w) {
        // make the requisite directory structure using Mkdirp
        Fse.mkdirp(Path.dirname(finalPath), w(function (e /*, path */) {
            if (e) { // does not throw error if the directory already existed
                w.abort();
                return void cb(e.code);
            }
        }));
    }).nThen(function (w) {
        // make sure the id does not collide with another
        tryId(finalPath, w(function (e) {
            if (e) {
                w.abort();
                return void cb(e);
            }
        }));
    }).nThen(function (w) {
        // Write the metadata
        let md = JSON.stringify({
            owners: [unsafeKey]
        });
        writeMetadata(Env, id, md, w((e) => {
            if (e) {
                w.abort();
                return void cb(e.code);
            }
            // otherwise it worked...
        }));
    }).nThen(function (w) {
        // move the existing file to its new path
        Fse.move(oldPath, finalPath, w(function (e) {
            if (e) {
                w.abort();
                return void cb(e.code);
            }
            // otherwise it worked...
        }));
    }).nThen(function () {
        // clear upload cookie
        Fs.unlink(oldPath+'.cookie', function () {});

        // clean up their session when you're done
        // call back with the blob id...
        cb(void 0, id);
    });
};


// removeBlob
var remove = function (Env, blobId, cb) {
    var blobPath = makeBlobPath(Env, blobId);
    Fs.unlink(blobPath, cb);
    clearActivity(Env, blobId, () => {});
};

// archiveBlob
var archiveBlob = function (Env, blobId, reason, cb) {
    var blobPath = makeBlobPath(Env, blobId);
    var archivePath = prependArchive(Env, blobPath);
    Fse.move(blobPath, archivePath, { overwrite: true }, cb);
    archiveMetadata(Env, blobId, () => {});
    archiveActivity(Env, blobId, () => {});
    addPlaceholder(Env, blobId, reason, () => {});
};

var removeArchivedBlob = function (Env, blobId, cb) {
    var CB = Util.once(cb);
    var archivePath = prependArchive(Env, makeBlobPath(Env, blobId));
    var metadataPath = prependArchive(Env, mkMetadataPath(Env, blobId));
    Fs.unlink(archivePath, cb);
    nThen(function (w) {
        Fs.unlink(archivePath, w(function (err) {
            if (err) {
                if (err.code === "ENOENT") { return; }
                w.abort();
                CB("E_ARCHIVED_BLOB_REMOVAL_"+ err.code);
            }
        }));
        Fs.unlink(metadataPath, w(function (err) {
            if (err) {
                if (err.code === "ENOENT") { return; }
                w.abort();
                CB("E_ARCHIVED_BLOBMD_REMOVAL_"+ err.code);
            }
        }));
        removeArchivedActivity(Env, blobId, () => {});
    }).nThen(function () {
        CB();
    });
};

// restoreBlob
var restoreBlob = function (Env, blobId, cb) {
    var blobPath = makeBlobPath(Env, blobId);
    var archivePath = prependArchive(Env, blobPath);
    Fse.move(archivePath, blobPath, cb);
    restoreMetadata(Env, blobId, () => {});
    restoreActivity(Env, blobId, () => {});
    clearPlaceholder(Env, blobId, () => {});
};

var makeWalker = function (n, handleChild, done) {
    if (!n || typeof(n) !== 'number' || n < 2) { n = 2; }

    var W;
    nThen(function (w) {
        // this asynchronous bit defers the completion of this block until
        // synchronous execution has completed. This means you must create
        // the walker and start using it synchronously or else it will call back
        // prematurely
        setTimeout(w());
        W = w;
    }).nThen(function () {
        done();
    });

    // do no more than 20 jobs at a time
    var tasks = Semaphore.create(n);

    var recurse = function (path, dir) {
        tasks.take(function (give) {
            var next = give(W());

            nThen(function (w) {
                // check if the path is a directory...
                Fs.stat(path, w(function (err, stats) {
                    if (err) {
                        w.abort();
                        return next();
                    }
                    if (!stats.isDirectory()) {
                        w.abort();
                       if (/\.activity$/.test(path)) {
                            // NOTE: some activity files were created for deleted blobs due to
                            // a bug. We're going to detect them here in order to be able to clean
                            // them.
                            if (!dir.includes(Path.basename(path.replace(/\.activity$/, '')))) {
                                return void handleChild(void 0, path, next, true);
                            }
                            // Ignore valid activity files
                            return next();
                        }
                        // Ignore placeholder files
                        if (/\.placeholder$/.test(path)) { return next(); }
                        return void handleChild(void 0, path, next, false);
                    }
                    // fall through
                }));
            }).nThen(function () {
                // handle directories
                Fs.readdir(path, function (err, dir) {
                    if (err) { return next(); }
                    // everything is fine and it's a directory...
                    dir.forEach(function (d) {
                        recurse(Path.join(path, d), dir);
                    });
                    next();
                });
            });
        });
    };

    return recurse;
};

var getActivityStat = function (path, base, cb) {
    var suffix = base ? '' : '.activity';
    Fs.stat(path+suffix, function (err, stats) {
        if (err && err.code === 'ENOENT' && !base) { return getActivityStat(path, true, cb); }
        cb(err, stats);
    });
};
var getStats = function (Env, blobId, cb) {
    var path = makeBlobPath(Env, blobId);
    getActivityStat(path, false, cb);
};

let blobRegex = /^[0-9a-fA-F]{48}(\.metadata)*(\.ndjson)*$/;
var listBlobs = function (root, handler, fast, cb) {
    var dirList = [];

    nThen(function (w) {
        // the root of your datastore contains nested directories...
        Fs.readdir(root, w(function (err, list) {
            if (err) {
                w.abort();
                // TODO check if we normally return strings or errors
                return void cb(err);
            }
            dirList = list;
        }));
    }).nThen(function (waitFor) {
        // search inside the nested directories
        // stream it so you don't put unnecessary data in memory
        var n = nThen;
        dirList.forEach(function (dir) {
            if (dir.length !== 2) { return; }
            // Handle one directory at a time to save some memory
            n = n(function (w) {
                // do twenty things at a time
                var sema = Semaphore.create(20);
                var nestedDirPath = Path.join(root, dir);
                Fs.readdir(nestedDirPath, w(function (err, list) {
                    if (err) { return void handler(err); } // Is this correct?
                    list.forEach(function (item) {
                        // ignore hidden files
                        if (/^\./.test(item)) { return; }
                        // ignore anything that isn't channel or metadata
                        if (!blobRegex.test(item)) { return; }

                        var isLonelyMetadata = false;
                        var blobName;

                        // if the current file is not the channel data, then it must be metadata
                        if (!/^[0-9a-fA-F]{48}$/.test(item)) {
                            blobName = item.replace(/\.metadata\.ndjson/, '');
                            // check if blob already exists
                            if (list.indexOf(blobName) !== -1) { return; }
                            // otherwise set a flag indicating that we should
                            // handle the metadata on its own
                            isLonelyMetadata = true;
                        } else {
                            blobName = item;
                        }
                        if (blobName.length !== 48) { return; }

                        sema.take(function (give) {
                            var next = w(give());

                            if (fast) {
                                return void handler(void 0, {
                                    blobId: blobName
                                }, next);
                            }

                            var filePath = Path.join(nestedDirPath, blobName);
                            if (isLonelyMetadata) {
                                // Set time to 0 to delete this
                                // lonely metadata file
                                return void handler(void 0, {
                                    blobId: blobName,
                                    mtime: 0,
                                    atime: 0,
                                    ctime: 0
                                }, next);
                            }
                            return void getActivityStat(filePath, false, (err, data) => {
                                data.blobId = blobName;
                                handler(err, data, next);
                            });
                        });
                    });
                }));
            }).nThen;
        });
        n(waitFor());
    }).nThen(function () {
        cb();
    });
};

var cleanLoneActivity = function (root, cb) {
    // iterate over files
    Fs.readdir(root, function (err, dir) {
        if (err) { return void cb(err); }
        var walk = makeWalker(20, function (err, path, next, loneActivity) {
            if (!loneActivity) { return void next(); }
            Fs.unlink(path, function (err) {
                if (err) {
                    return console.error('ERROR', path, err);
                }
                console.log('DELETED', path);
                next();
            });
        }, function () {
            cb();
        });

        dir.forEach(function (d) {
            if (d.length !== 2) { return; }
            walk(Path.join(root, d));
        });
    });
};

BlobStore.create = function (config, _cb) {
    var cb = Util.once(Util.mkAsync(_cb));
    if (typeof(config.getSession) !== 'function') {
        return void cb("getSession method required");
    }

    var Env = {
        blobPath: config.blobPath || './blob',
        blobStagingPath: config.blobStagingPath || './blobstage',
        archivePath: config.archivePath || './data/archive',
        getSession: config.getSession,
    };

    nThen(function (w) {
        var CB = Util.both(w.abort, cb);
        Fse.mkdirp(Env.blobPath, w(function (e) {
            if (e) { CB(e); }
        }));
        Fse.mkdirp(Env.blobStagingPath, w(function (e) {
            if (e) { CB(e); }
        }));

        Fse.mkdirp(Path.join(Env.archivePath, './blob'), w(function (e) {
            if (e) { CB(e); }
        }));
    }).nThen(function (w) {
        // make a placeholder file in the root of the blob path
        // so that the checkup page always has a resource it can check
        var fullPath = Path.join(Env.blobPath, 'placeholder.txt');
        Fse.writeFile(fullPath, 'PLACEHOLDER\n', w());
    }).nThen(function () {
        var methods = {
            BLOB_LENGTH: BLOB_LENGTH,
            isFileId: isValidId,
            status: function (safeKey, _cb) {
                // TODO check if the final destination is a file
                // because otherwise two people can try to upload to the same location
                // and one will fail, invalidating their hard work
                var cb = Util.once(Util.mkAsync(_cb));
                if (!isValidSafeKey(safeKey)) { return void cb('INVALID_SAFEKEY'); }
                isFile(makeStagePath(Env, safeKey), cb);
            },
            uploadWs: function (safeKey, content, _cb) {
                var cb = Util.once(Util.mkAsync(_cb));
                if (!isValidSafeKey(safeKey)) { return void cb('INVALID_SAFEKEY'); }
                uploadWs(Env, safeKey, content, Util.once(Util.mkAsync(cb)));
            },
            upload: function (safeKey, content, _cb) {
                var cb = Util.once(Util.mkAsync(_cb));
                if (!isValidSafeKey(safeKey)) { return void cb('INVALID_SAFEKEY'); }
                upload(Env, safeKey, content, Util.once(Util.mkAsync(cb)));
            },
            uploadCookie: function (safeKey, _cb) {
                var cb = Util.once(Util.mkAsync(_cb));
                if (!isValidSafeKey(safeKey)) { return void cb('INVALID_SAFEKEY'); }
                uploadCookie(Env, safeKey, Util.once(Util.mkAsync(cb)));
            },
            checkUploadCookie: function (safeKey, _cb) {
                var cb = Util.once(Util.mkAsync(_cb));
                if (!isValidSafeKey(safeKey)) { return void cb('INVALID_SAFEKEY'); }
                checkUploadCookie(Env, safeKey, Util.once(Util.mkAsync(cb)));
            },

            cancel: function (safeKey, fileSize, _cb) {
                var cb = Util.once(Util.mkAsync(_cb));
                if (!isValidSafeKey(safeKey)) { return void cb('INVALID_SAFEKEY'); }
                if (typeof(fileSize) !== 'number' || isNaN(fileSize) || fileSize <= 0) { return void cb("INVALID_FILESIZE"); }
                upload_cancel(Env, safeKey, fileSize, cb);
            },

            isOwnedBy: function (safeKey, blobId, _cb) {
                var cb = Util.once(Util.mkAsync(_cb));
                if (!isValidSafeKey(safeKey)) { return void cb('INVALID_SAFEKEY'); }
                isOwnedBy(Env, safeKey, blobId, cb);
            },
            readMetadata: (blobId, handler, cb) => {
                if (!isValidId(blobId)) { return void cb("INVALID_ID"); }
                readBlobMetadata(Env, blobId, handler, cb);
            },
            writeMetadata: (blobId, data, cb) => {
                if (!isValidId(blobId)) { return void cb("INVALID_ID"); }
                writeMetadata(Env, blobId, data, cb);
            },
            hasMetadata: (blobId, _cb) => {
                var cb = Util.once(Util.mkAsync(_cb));
                if (!isValidId(blobId)) { return void cb("INVALID_ID"); }
                var path = mkMetadataPath(Env, blobId);
                isFile(path, cb);
            },

            remove: {
                blob: function (blobId, _cb) {
                    var cb = Util.once(Util.mkAsync(_cb));
                    if (!isValidId(blobId)) { return void cb("INVALID_ID"); }
                    remove(Env, blobId, cb);
                },
                archived: {
                    blob: function (blobId, _cb) {
                        var cb = Util.once(Util.mkAsync(_cb));
                        if (!isValidId(blobId)) { return void cb("INVALID_ID"); }
                        removeArchivedBlob(Env, blobId, cb);
                    },
                },
                loneActivity: function (_cb) {
                    var cb = Util.once(Util.mkAsync(_cb));
                    cleanLoneActivity(Env.blobPath, cb);
                }
            },

            archive: {
                blob: function (blobId, reason, _cb) {
                    var cb = Util.once(Util.mkAsync(_cb));
                    if (!isValidId(blobId)) { return void cb("INVALID_ID"); }
                    archiveBlob(Env, blobId, reason, cb);
                },
            },

            restore: {
                blob: function (blobId, _cb) {
                    var cb = Util.once(Util.mkAsync(_cb));
                    if (!isValidId(blobId)) { return void cb("INVALID_ID"); }
                    restoreBlob(Env, blobId, cb);
                },
            },

            isBlobAvailable: function (blobId, _cb) {
                var cb = Util.once(Util.mkAsync(_cb));
                if (!isValidId(blobId)) { return void cb("INVALID_ID"); }
                var path = makeBlobPath(Env, blobId);
                isFile(path, cb);
            },
            isBlobArchived: function (blobId, _cb) {
                var cb = Util.once(Util.mkAsync(_cb));
                if (!isValidId(blobId)) { return void cb("INVALID_ID"); }
                var path = prependArchive(Env, makeBlobPath(Env, blobId));
                isFile(path, cb);
            },
            getPlaceholder: function (blobId, cb) {
                readPlaceholder(Env, blobId, cb);
            },

            closeBlobstage: function (safeKey) {
                closeBlobstage(Env, safeKey);
            },
            complete: function (safeKey, id, _cb) {
                var cb = Util.once(Util.mkAsync(_cb));
                if (!isValidSafeKey(safeKey)) { return void cb('INVALID_SAFEKEY'); }
                if (!isValidId(id)) { return void cb("INVALID_ID"); }
                upload_complete(Env, safeKey, id, cb);
            },
            completeOwned: function (safeKey, id, _cb) {
                var cb = Util.once(Util.mkAsync(_cb));
                if (!isValidSafeKey(safeKey)) { return void cb('INVALID_SAFEKEY'); }
                if (!isValidId(id)) { return void cb("INVALID_ID"); }
                owned_upload_complete(Env, safeKey, id, cb);
            },
            size: function (id, _cb) {
                var cb = Util.once(Util.mkAsync(_cb));
                if (!isValidId(id)) { return void cb("INVALID_ID"); }
                getUploadSize(Env, id, cb);
            },

            // ACTIVITY
            updateActivity: function (id, _cb) {
                var cb = Util.once(Util.mkAsync(_cb));
                if (!isValidId(id)) { return void cb("INVALID_ID"); }
                updateActivity(Env, id, cb);
            },
            getActivity: function (id, _cb) {
                var cb = Util.once(Util.mkAsync(_cb));
                if (!isValidId(id)) { return void cb("INVALID_ID"); }
                getActivity(Env, id, cb);
            },
            getStats: function (id, _cb) {
                var cb = Util.once(Util.mkAsync(_cb));
                if (!isValidId(id)) { return void cb("INVALID_ID"); }
                getStats(Env, id, cb);
            },

            list: {
                blobs: function (handler, _cb, fast) {
                    var cb = Util.once(Util.mkAsync(_cb));
                    listBlobs(Env.blobPath, handler, fast, cb);
                },
                archived: {
                    blobs: function (handler, _cb, fast) {
                        var cb = Util.once(Util.mkAsync(_cb));
                        listBlobs(prependArchive(Env, Env.blobPath), handler, fast, cb);
                    },
                }
            },
        };

        cb(void 0, methods);
    });
};

