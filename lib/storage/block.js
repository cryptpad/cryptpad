/*jshint esversion: 6 */
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

Block.archive = function (Env, publicKey, _cb) {
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

    Fse.move(currentPath, archivePath, {
        overwrite: true,
    }, cb);
};

Block.check = function (Env, publicKey, _cb) { // 'check' because 'exists' implies boolean
    var cb = Util.once(Util.mkAsync(_cb));
    var path = Block.mkPath(Env, publicKey);
    Fs.access(path, Fs.constants.F_OK, cb);
};

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
        Block.archive(Env, publicKey, w(function (/* err */) {
    /*
        we proceed even if there are errors.
        it might be ENOENT (there is no file to archive)
        or EACCES (bad filesystem permissions for the existing archived block?)
        or lots of other things, none of which justify preventing the write
    */
        }));
    }).nThen(function () {
        Fs.writeFile(path, buffer, { encoding: 'binary' }, cb);
    });
};

