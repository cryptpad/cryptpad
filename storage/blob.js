/* globals Buffer */
var Fs = require("fs");
var Fse = require("fs-extra");
var Path = require("path");

var BlobStore = module.exports;
var nThen = require("nthen");
var Util = require("../lib/common-util");

var isValidSafeKey = function (safeKey) {
    return typeof(safeKey) === 'string' && !/\//.test(safeKey) && safeKey.length === 44;
};

var isValidId = function (id) {
    return typeof(id) === 'string' && id.length === 48 && !/[^a-f0-9]/.test(id);
};

// helpers

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

var makeFileStream = function (dir, full, cb) {
    Fse.mkdirp(dir, function (e) {
        if (e || !full) { // !full for pleasing flow, it's already checked
            //WARN('makeFileStream', e);
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
            stream.on('error', function (/* e */) {
                //console.error("MAKE_FILE_STREAM", full);
                // XXX ERROR
                //WARN('stream error', e);
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
        makeFileStream(Path.dirname(stagePath), stagePath, function (e, stream) {
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
    if (session.blobstage) { session.blobstage.close(); }

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
            //WARN('ownedUploadComplete', 'id is already used '+ id);
            return void cb('EEXISTS');
        } else if (e.code === 'ENOENT') {
            // no entry, so it's safe for us to proceed
            return void cb();
        } else {
            // it failed in an unexpected way. log it
            //WARN('ownedUploadComplete', e);
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
        //WARN('ownedUploadComplete', "id is invalid");
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

var listFiles = function (Env, handler, cb) {
    cb("NOT_IMPLEMENTED");
};

BlobStore.create = function (config, _cb) {
    var cb = Util.once(Util.mkAsync(_cb));
    if (typeof(config.getSession) !== 'function') {
        return void cb("getSession method required");
    }

    var Env = {
        blobPath: config.blobPath || './blob',
        blobStagingPath: config.blobStagingPath || './blobstage',
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
    }).nThen(function () {
        cb(void 0, {
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

            remove: function (blobId, _cb) {
                var cb = Util.once(Util.mkAsync(_cb));
                if (!isValidId(blobId)) { return void cb("INVALID_ID"); }
                remove(Env, blobId, cb);
            },

            removeProof: function (safeKey, blobId, _cb) {
                var cb = Util.once(Util.mkAsync(_cb));
                if (!isValidSafeKey(safeKey)) { return void cb('INVALID_SAFEKEY'); }
                if (!isValidId(blobId)) { return void cb("INVALID_ID"); }
                removeProof(Env, safeKey, blobId, cb);
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

            list: function (handler, _cb) {
                var cb = Util.once(Util.mkAsync(_cb));
                listFiles(Env, handler, cb);
            },
        });
    });
};

