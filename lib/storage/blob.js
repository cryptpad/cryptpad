/* globals Buffer */
var Fs = require("fs");
var Fse = require("fs-extra");
var Path = require("path");

var BlobStore = module.exports;
var nThen = require("nthen");
var Semaphore = require("saferphore");
var Util = require("../common-util");

var isValidSafeKey = function (safeKey) {
    return typeof(safeKey) === 'string' && !/\//.test(safeKey) && safeKey.length === 44;
};

var isValidId = function (id) {
    return typeof(id) === 'string' && id.length === 48 && !/[^a-f0-9]/.test(id);
};

// helpers

var prependArchive = function (Env, path) {
    return Path.join(Env.archivePath, path);
};

// /blob/<safeKeyPrefix>/<safeKey>/<blobPrefix>/<blobId>
var makeBlobPath = function (Env, blobId) {
    return Path.join(Env.blobPath, blobId.slice(0, 2), blobId);
};

// /blobstate/<safeKeyPrefix>/<safeKey>
var makeStagePath = function (Env, safeKey) {
    return Path.join(Env.blobStagingPath, safeKey.slice(0, 2), safeKey);
};

// /blob/<safeKeyPrefix>/<safeKey>/<blobPrefix>/<blobId>
var makeProofPath = function (Env, safeKey, blobId) {
    return Path.join(Env.blobPath, safeKey.slice(0, 3), safeKey, blobId.slice(0, 2), blobId);
};

var parseProofPath = function (path) {
    var parts = path.split('/');
    return {
        blobId: parts[parts.length -1],
        safeKey: parts[parts.length - 3],
    };
};

// getUploadSize: used by
    // getFileSize
var getUploadSize = function (Env, blobId, cb) {
    var path = makeBlobPath(Env, blobId);
    if (!path) { return cb('INVALID_UPLOAD_ID'); }
    Fs.stat(path, function (err, stats) {
        if (err) {
            // if a file was deleted, its size is 0 bytes
            if (err.code === 'ENOENT') { return cb(void 0, 0); }
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

/**********  METHODS **************/

var upload = function (Env, safeKey, content, cb) {
    var dec;

    try { dec = Buffer.from(content, 'base64'); }
    catch (e) { return void cb('DECODE_BUFFER'); }
    var len = dec.length;

    var session = Env.getSession(safeKey);

    if (typeof(session.currentUploadSize) !== 'number' ||
        typeof(session.pendingUploadSize) !== 'number') {
        // improperly initialized... maybe they didn't check before uploading?
        // reject it, just in case
        return cb('NOT_READY');
    }

    if (session.currentUploadSize > session.pendingUploadSize) {
        return cb('E_OVER_LIMIT');
    }

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
    var session = Env.getSession(safeKey);

    if (session.blobstage && session.blobstage.close) {
        session.blobstage.close();
        delete session.blobstage;
    }

    var oldPath = makeStagePath(Env, safeKey);
    var newPath = makeBlobPath(Env, id);

    nThen(function (w) {
        // make sure the path to your final location exists
        Fse.mkdirp(Path.dirname(newPath), function (e) {
            if (e) {
                w.abort();
                return void cb('RENAME_ERR');
            }
        });
    }).nThen(function (w) {
        // make sure there's not already something in that exact location
        isFile(newPath, function (e, yes) {
            if (e) {
                w.abort();
                return void cb(e);
            }
            if (yes) {
                w.abort();
                return void cb('RENAME_ERR');
            }
            cb(void 0, newPath, id);
        });
    }).nThen(function () {
        // finally, move the old file to the new path
        // FIXME we could just move and handle the EEXISTS instead of the above block
        Fse.move(oldPath, newPath, function (e) {
            if (e) { return void cb('RENAME_ERR'); }
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
var owned_upload_complete = function (Env, safeKey, id, cb) {
    var session = Env.getSession(safeKey);

    // the file has already been uploaded to the staging area
    // close the pending writestream
    if (session.blobstage && session.blobstage.close) {
        session.blobstage.close();
        delete session.blobstage;
    }

    if (!isValidId(id)) {
        return void cb('EINVAL_ID');
    }

    var oldPath = makeStagePath(Env, safeKey);
    if (typeof(oldPath) !== 'string') {
        return void cb('EINVAL_CONFIG');
    }

    var finalPath = makeBlobPath(Env, id);

    var finalOwnPath = makeProofPath(Env, safeKey, id);

    // the user wants to move it into blob and create a empty file with the same id
    // in their own space:
    // /blob/safeKeyPrefix/safeKey/blobPrefix/blobID

    nThen(function (w) {
        // make the requisite directory structure using Mkdirp
        Fse.mkdirp(Path.dirname(finalPath), w(function (e /*, path */) {
            if (e) { // does not throw error if the directory already existed
                w.abort();
                return void cb(e.code);
            }
        }));
        Fse.mkdirp(Path.dirname(finalOwnPath), w(function (e /*, path */) {
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
        // Create the empty file proving ownership
        Fs.writeFile(finalOwnPath, '', w(function (e) {
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
                // if there's an error putting the file into its final location...
                // ... you should remove the ownership file
                Fs.unlink(finalOwnPath, function () {
                    // but if you can't, it's not catestrophic
                    // we can clean it up later
                });
                w.abort();
                return void cb(e.code);
            }
            // otherwise it worked...
        }));
    }).nThen(function () {
        // clean up their session when you're done
        // call back with the blob id...
        cb(void 0, id);
    });
};

// removeBlob
var remove = function (Env, blobId, cb) {
    var blobPath = makeBlobPath(Env, blobId);
    Fs.unlink(blobPath, cb); // TODO COLDSTORAGE
};

// removeProof
var removeProof = function (Env, safeKey, blobId, cb) {
    var proofPath = makeProofPath(Env, safeKey, blobId);
    Fs.unlink(proofPath, cb);
};

// isOwnedBy(id, safeKey)
var isOwnedBy = function (Env, safeKey, blobId, cb) {
    var proofPath = makeProofPath(Env, safeKey, blobId);
    isFile(proofPath, cb);
};


// archiveBlob
var archiveBlob = function (Env, blobId, cb) {
    var blobPath = makeBlobPath(Env, blobId);
    var archivePath = prependArchive(Env, blobPath);
    Fse.move(blobPath, archivePath, { overwrite: true }, cb);
};

var removeArchivedBlob = function (Env, blobId, cb) {
    var archivePath = prependArchive(Env, makeBlobPath(Env, blobId));
    Fs.unlink(archivePath, cb);
};

// restoreBlob
var restoreBlob = function (Env, blobId, cb) {
    var blobPath = makeBlobPath(Env, blobId);
    var archivePath = prependArchive(Env, blobPath);
    Fse.move(archivePath, blobPath, cb);
};

// archiveProof
var archiveProof = function (Env, safeKey, blobId, cb) {
    var proofPath = makeProofPath(Env, safeKey, blobId);
    var archivePath = prependArchive(Env, proofPath);
    Fse.move(proofPath, archivePath, { overwrite: true }, cb);
};

var removeArchivedProof = function (Env, safeKey, blobId, cb) {
    var archivedPath = prependArchive(Env, makeProofPath(Env, safeKey, blobId));
    Fs.unlink(archivedPath, cb);
};

// restoreProof
var restoreProof = function (Env, safeKey, blobId, cb) {
    var proofPath = makeProofPath(Env, safeKey, blobId);
    var archivePath = prependArchive(Env, proofPath);
    Fse.move(archivePath, proofPath, cb);
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

    var recurse = function (path) {
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
                        return void handleChild(void 0, path, next);
                    }
                    // fall through
                }));
            }).nThen(function () {
                // handle directories
                Fs.readdir(path, function (err, dir) {
                    if (err) { return next(); }
                    // everything is fine and it's a directory...
                    dir.forEach(function (d) {
                        recurse(Path.join(path, d));
                    });
                    next();
                });
            });
        });
    };

    return recurse;
};

var listProofs = function (root, handler, cb) {
    Fs.readdir(root, function (err, dir) {
        if (err) { return void cb(err); }

        var walk = makeWalker(20, function (err, path, next) {
            // path is the path to a child node on the filesystem

            // next handles the next job in a queue

                // iterate over proofs
                // check for presence of corresponding files
            Fs.stat(path, function (err, stats) {
                if (err) {
                    return void handler(err, void 0, next);
                }

                var parsed = parseProofPath(path);
                handler(void 0, {
                    path: path,
                    blobId: parsed.blobId,
                    safeKey: parsed.safeKey,
                    atime: stats.atime,
                    ctime: stats.ctime,
                    mtime: stats.mtime,
                }, next);
            });
        }, function () {
            // called when there are no more directories or children to process
            cb();
        });

        dir.forEach(function (d) {
            // ignore directories that aren't 3 characters long...
            if (d.length !== 3) { return; }
            walk(Path.join(root, d));
        });
    });
};

var listBlobs = function (root, handler, cb) {
    // iterate over files
    Fs.readdir(root, function (err, dir) {
        if (err) { return void cb(err); }
        var walk = makeWalker(20, function (err, path, next) {
            Fs.stat(path, function (err, stats) {
                if (err) {
                    return void handler(err, void 0, next);
                }

                handler(void 0, {
                    blobId: Path.basename(path),
                    atime: stats.atime,
                    ctime: stats.ctime,
                    mtime: stats.mtime,
                }, next);
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

        Fse.mkdirp(Path.join(Env.archivePath, Env.blobPath), w(function (e) {
            if (e) { CB(e); }
        }));
    }).nThen(function () {
        var methods = {
            isFileId: isValidId,
            status: function (safeKey, _cb) {
                // TODO check if the final destination is a file
                // because otherwise two people can try to upload to the same location
                // and one will fail, invalidating their hard work
                var cb = Util.once(Util.mkAsync(_cb));
                if (!isValidSafeKey(safeKey)) { return void cb('INVALID_SAFEKEY'); }
                isFile(makeStagePath(Env, safeKey), cb);
            },
            upload: function (safeKey, content, _cb) {
                var cb = Util.once(Util.mkAsync(_cb));
                if (!isValidSafeKey(safeKey)) { return void cb('INVALID_SAFEKEY'); }
                upload(Env, safeKey, content, Util.once(Util.mkAsync(cb)));
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

            remove: {
                blob: function (blobId, _cb) {
                    var cb = Util.once(Util.mkAsync(_cb));
                    if (!isValidId(blobId)) { return void cb("INVALID_ID"); }
                    remove(Env, blobId, cb);
                },
                proof: function (safeKey, blobId, _cb) {
                    var cb = Util.once(Util.mkAsync(_cb));
                    if (!isValidSafeKey(safeKey)) { return void cb('INVALID_SAFEKEY'); }
                    if (!isValidId(blobId)) { return void cb("INVALID_ID"); }
                    removeProof(Env, safeKey, blobId, cb);
                },
                archived: {
                    blob: function (blobId, _cb) {
                        var cb = Util.once(Util.mkAsync(_cb));
                        if (!isValidId(blobId)) { return void cb("INVALID_ID"); }
                        removeArchivedBlob(Env, blobId, cb);
                    },
                    proof:  function (safeKey, blobId, _cb) {
                        var cb = Util.once(Util.mkAsync(_cb));
                        if (!isValidSafeKey(safeKey)) { return void cb('INVALID_SAFEKEY'); }
                        if (!isValidId(blobId)) { return void cb("INVALID_ID"); }
                        removeArchivedProof(Env, safeKey, blobId, cb);
                    },
                },
            },

            archive: {
                blob: function (blobId, _cb) {
                    var cb = Util.once(Util.mkAsync(_cb));
                    if (!isValidId(blobId)) { return void cb("INVALID_ID"); }
                    archiveBlob(Env, blobId, cb);
                },
                proof: function (safeKey, blobId, _cb) {
                    var cb = Util.once(Util.mkAsync(_cb));
                    if (!isValidSafeKey(safeKey)) { return void cb('INVALID_SAFEKEY'); }
                    if (!isValidId(blobId)) { return void cb("INVALID_ID"); }
                    archiveProof(Env, safeKey, blobId, cb);
                },
            },

            restore: {
                blob: function (blobId, _cb) {
                    var cb = Util.once(Util.mkAsync(_cb));
                    if (!isValidId(blobId)) { return void cb("INVALID_ID"); }
                    restoreBlob(Env, blobId, cb);
                },
                proof: function (safeKey, blobId, _cb) {
                    var cb = Util.once(Util.mkAsync(_cb));
                    if (!isValidSafeKey(safeKey)) { return void cb('INVALID_SAFEKEY'); }
                    if (!isValidId(blobId)) { return void cb("INVALID_ID"); }
                    restoreProof(Env, safeKey, blobId, cb);
                },
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

            list: {
                blobs: function (handler, _cb) {
                    var cb = Util.once(Util.mkAsync(_cb));
                    listBlobs(Env.blobPath, handler, cb);
                },
                proofs: function (handler, _cb) {
                    var cb = Util.once(Util.mkAsync(_cb));
                    listProofs(Env.blobPath, handler, cb);
                },
                archived: {
                    proofs: function (handler, _cb) {
                        var cb = Util.once(Util.mkAsync(_cb));
                        listProofs(prependArchive(Env, Env.blobPath), handler, cb);
                    },
                    blobs: function (handler, _cb) {
                        var cb = Util.once(Util.mkAsync(_cb));
                        listBlobs(prependArchive(Env, Env.blobPath), handler, cb);
                    },
                }
            },
        };

        cb(void 0, methods);
    });
};

