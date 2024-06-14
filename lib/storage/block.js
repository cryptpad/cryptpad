// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const Block = module.exports;
const Util = require("../common-util");
const Path = require("path");
const Fs = require("fs");
const Fse = require("fs-extra");
const nThen = require("nthen");

Block.mkPath = function (Env, publicKey) {
    // prepare publicKey to be used as a file name
    var safeKey = Util.escapeKeyCharacters(publicKey);

    // validate safeKey
    if (typeof(safeKey) !== 'string') { return; }

    // derive the full path
    // /home/cryptpad/cryptpad/block/fg/fg32kefksjdgjkewrjksdfksjdfsdfskdjfsfd
    return Path.join(Env.paths.block, safeKey.slice(0, 2), safeKey);
};

Block.mkArchivePath = function (Env, publicKey) {
    // prepare publicKey to be used as a file name
    var safeKey = Util.escapeKeyCharacters(publicKey);

    // validate safeKey
    if (typeof(safeKey) !== 'string') {
        return;
    }

    // derive the full path
    // /home/cryptpad/cryptpad/block/fg/fg32kefksjdgjkewrjksdfksjdfsdfskdjfsfd
    return Path.join(Env.paths.archive, 'block', safeKey.slice(0, 2), safeKey);
};

var mkPlaceholderPath = function (Env, publicKey) {
    return Block.mkPath(Env, publicKey) + '.placeholder';
};
var addPlaceholder = function (Env, publicKey, reason, cb) {
    if (!reason) { return cb(); }
    var path = mkPlaceholderPath(Env, publicKey);
    var s_data = typeof(reason) === "string" ? reason : `${reason.code}:${reason.txt}`;
    Fs.writeFile(path, s_data, cb);
};
var clearPlaceholder = function (Env, publicKey, cb) {
    var path = mkPlaceholderPath(Env, publicKey);
    Fs.unlink(path, cb);
};
Block.readPlaceholder = function (Env, publicKey, cb) {
    var path = mkPlaceholderPath(Env, publicKey);
    Fs.readFile(path, function (err, content) {
        if (err) { return void cb(); }
        cb(content.toString('utf8'));
    });
};

Block.archive = function (Env, publicKey, reason, _cb) {
    var cb = Util.once(Util.mkAsync(_cb));

    // derive the filepath
    var currentPath = Block.mkPath(Env, publicKey);

    // make sure the path is valid
    if (typeof(currentPath) !== 'string') {
        return void cb('E_INVALID_BLOCK_PATH');
    }

    var archivePath = Block.mkArchivePath(Env, publicKey);
    // make sure the path is valid
    if (typeof(archivePath) !== 'string') {
        return void cb('E_INVALID_BLOCK_ARCHIVAL_PATH');
    }

    // TODO Env.incrementBytesWritten
    Fse.move(currentPath, archivePath, {
        overwrite: true,
    }, (err) => {
        cb(err);
        if (!err && reason) { addPlaceholder(Env, publicKey, reason, () => {}); }
    });
};

Block.restore = function (Env, publicKey, _cb) {
    var cb = Util.once(Util.mkAsync(_cb));

    // derive the filepath
    var livePath = Block.mkPath(Env, publicKey);

    // make sure the path is valid
    if (typeof(livePath) !== 'string') {
        return void cb('E_INVALID_BLOCK_PATH');
    }

    var archivePath = Block.mkArchivePath(Env, publicKey);
    // make sure the path is valid
    if (typeof(archivePath) !== 'string') {
        return void cb('E_INVALID_BLOCK_ARCHIVAL_PATH');
    }

    // TODO Env.incrementBytesWritten
    Fse.move(archivePath, livePath, {
        //overwrite: true,
    }, (err) => {
        cb(err);
        if (!err) { clearPlaceholder(Env, publicKey, () => {}); }
    });
};

var isValidKey = Block.isValidKey = function (publicKey) {
    return typeof(publicKey) === 'string' && publicKey.length === 44;
};

var exists = function (path, cb) {
    Fs.stat(path, function (err, stat) {
        if (err) {
            if (err.code === 'ENOENT') {
                return void cb(void 0, false);
            }
            return void cb(err);
        }
        if (!stat.isFile()) { return void cb('E_NOT_FILE'); }
        return  void cb(void 0, true);
    });
};

var checkPath = function (Env, publicKey, pathFunction, _cb) {
    var cb = Util.once(Util.mkAsync(_cb));
    if (!isValidKey(publicKey)) { return void cb("INVALID_ARGS"); }
    var path = pathFunction(Env, publicKey);
    exists(path, cb);
};

Block.isAvailable = function (Env, publicKey, _cb) {
    checkPath(Env, publicKey, Block.mkPath, _cb);
};

Block.isArchived = function (Env, publicKey, _cb) {
    checkPath(Env, publicKey, Block.mkArchivePath, _cb);
};

Block.check = function (Env, publicKey, _cb) { // 'check' because 'exists' implies boolean
    var cb = Util.once(Util.mkAsync(_cb));
    var path = Block.mkPath(Env, publicKey);
    Fs.access(path, Fs.constants.F_OK, cb);
};

Block.MAX_SIZE = 256;

Block.write = function (Env, publicKey, buffer, _cb) {
    var cb = Util.once(Util.mkAsync(_cb));
    var path = Block.mkPath(Env, publicKey);
    if (typeof(path) !== 'string') { return void cb('INVALID_PATH'); }
    var parsed = Path.parse(path);

    nThen(function (w) {
        Fse.mkdirp(parsed.dir, w(function (err) {
            if (!err) { return; }
            w.abort();
            cb(err);
        }));
    }).nThen(function (w) {
        Block.archive(Env, publicKey, 'PASSWORD_CHANGE', w(function (/* err */) {
    /*
        we proceed even if there are errors.
        it might be ENOENT (there is no file to archive)
        or EACCES (bad filesystem permissions for the existing archived block?)
        or lots of other things, none of which justify preventing the write
    */
        }));
    }).nThen(function () {
        Fs.writeFile(path, buffer, { encoding: 'binary' }, cb);
        Env.incrementBytesWritten(buffer && buffer.length);
    });
};

