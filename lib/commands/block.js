/*jshint esversion: 6 */
/* globals Buffer*/
var Block = module.exports;

const Fs = require("fs");
const Fse = require("fs-extra");
const Path = require("path");
const Nacl = require("tweetnacl/nacl-fast");
const nThen = require("nthen");

const Util = require("../common-util");

/*
    We assume that the server is secured against MitM attacks
    via HTTPS, and that malicious actors do not have code execution
    capabilities. If they do, we have much more serious problems.

    The capability to replay a block write or remove results in either
    a denial of service for the user whose block was removed, or in the
    case of a write, a rollback to an earlier password.

    Since block modification is destructive, this can result in loss
    of access to the user's drive.

    So long as the detached signature is never observed by a malicious
    party, and the server discards it after proof of knowledge, replays
    are not possible. However, this precludes verification of the signature
    at a later time.

    Despite this, an integrity check is still possible by the original
    author of the block, since we assume that the block will have been
    encrypted with xsalsa20-poly1305 which is authenticated.
*/
var validateLoginBlock = function (Env, publicKey, signature, block, cb) { // FIXME BLOCKS
    // convert the public key to a Uint8Array and validate it
    if (typeof(publicKey) !== 'string') { return void cb('E_INVALID_KEY'); }

    var u8_public_key;
    try {
        u8_public_key = Nacl.util.decodeBase64(publicKey);
    } catch (e) {
        return void cb('E_INVALID_KEY');
    }

    var u8_signature;
    try {
        u8_signature = Nacl.util.decodeBase64(signature);
    } catch (e) {
        Env.Log.error('INVALID_BLOCK_SIGNATURE', e);
        return void cb('E_INVALID_SIGNATURE');
    }

    // convert the block to a Uint8Array
    var u8_block;
    try {
        u8_block = Nacl.util.decodeBase64(block);
    } catch (e) {
        return void cb('E_INVALID_BLOCK');
    }

    // take its hash
    var hash = Nacl.hash(u8_block);

    // validate the signature against the hash of the content
    var verified = Nacl.sign.detached.verify(hash, u8_signature, u8_public_key);

    // existing authentication ensures that users cannot replay old blocks

    // call back with (err) if unsuccessful
    if (!verified) { return void cb("E_COULD_NOT_VERIFY"); }

    return void cb(null, u8_block);
};

var createLoginBlockPath = function (Env, publicKey) { // FIXME BLOCKS
    // prepare publicKey to be used as a file name
    var safeKey = Util.escapeKeyCharacters(publicKey);

    // validate safeKey
    if (typeof(safeKey) !== 'string') {
        return;
    }

    // derive the full path
    // /home/cryptpad/cryptpad/block/fg/fg32kefksjdgjkewrjksdfksjdfsdfskdjfsfd
    return Path.join(Env.paths.block, safeKey.slice(0, 2), safeKey);
};

Block.writeLoginBlock = function (Env, safeKey, msg, cb) { // FIXME BLOCKS
    //console.log(msg);
    var publicKey = msg[0];
    var signature = msg[1];
    var block = msg[2];

    validateLoginBlock(Env, publicKey, signature, block, function (e, validatedBlock) {
        if (e) { return void cb(e); }
        if (!(validatedBlock instanceof Uint8Array)) { return void cb('E_INVALID_BLOCK'); }

        // derive the filepath
        var path = createLoginBlockPath(Env, publicKey);

        // make sure the path is valid
        if (typeof(path) !== 'string') {
            return void cb('E_INVALID_BLOCK_PATH');
        }

        var parsed = Path.parse(path);
        if (!parsed || typeof(parsed.dir) !== 'string') {
            return void cb("E_INVALID_BLOCK_PATH_2");
        }

        nThen(function (w) {
            // make sure the path to the file exists
            Fse.mkdirp(parsed.dir, w(function (e) {
                if (e) {
                    w.abort();
                    cb(e);
                }
            }));
        }).nThen(function () {
            // actually write the block

            // flow is dumb and I need to guard against this which will never happen
            /*:: if (typeof(validatedBlock) === 'undefined') { throw new Error('should never happen'); } */
            /*:: if (typeof(path) === 'undefined') { throw new Error('should never happen'); } */
            Fs.writeFile(path, Buffer.from(validatedBlock), { encoding: "binary", }, function (err) {
                if (err) { return void cb(err); }
                cb();
            });
        });
    });
};

/*
    When users write a block, they upload the block, and provide
    a signature proving that they deserve to be able to write to
    the location determined by the public key.

    When removing a block, there is nothing to upload, but we need
    to sign something. Since the signature is considered sensitive
    information, we can just sign some constant and use that as proof.

*/
Block.removeLoginBlock = function (Env, safeKey, msg, cb) { // FIXME BLOCKS
    var publicKey = msg[0];
    var signature = msg[1];
    var block = Nacl.util.decodeUTF8('DELETE_BLOCK'); // clients and the server will have to agree on this constant

    validateLoginBlock(Env, publicKey, signature, block, function (e /*::, validatedBlock */) {
        if (e) { return void cb(e); }
        // derive the filepath
        var path = createLoginBlockPath(Env, publicKey);

        // make sure the path is valid
        if (typeof(path) !== 'string') {
            return void cb('E_INVALID_BLOCK_PATH');
        }

        // FIXME COLDSTORAGE
        Fs.unlink(path, function (err) {
            Env.Log.info('DELETION_BLOCK_BY_OWNER_RPC', {
                publicKey: publicKey,
                path: path,
                status: err? String(err): 'SUCCESS',
            });

            if (err) { return void cb(err); }
            cb();
        });
    });
};

