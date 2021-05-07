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

Block.validateAncestorProof = function (Env, proof, _cb) {
    var cb = Util.once(Util.mkAsync(_cb));
/* prove that you own an existing block by signing for its publicKey */
    try {
        var parsed = JSON.parse(proof);
        var pub = parsed[0];
        var u8_pub = Nacl.util.decodeBase64(pub);
        var sig = parsed[1];
        var u8_sig = Nacl.util.decodeBase64(sig);
        var valid = false;
        nThen(function (w) {
            valid = Nacl.sign.detached.verify(u8_pub, u8_sig, u8_pub);
            if (!valid) {
                w.abort();
                return void cb('E_INVALID_ANCESTOR_PROOF');
            }
            // else fall through to next step
        }).nThen(function (w) {
            var path = createLoginBlockPath(Env, pub);
            Fs.access(path, Fs.constants.F_OK, w(function (err) {
                if (!err) { return; }
                w.abort(); // else
                return void cb("E_MISSING_ANCESTOR");
            }));
        }).nThen(function () {
            cb(void 0, pub);
        });
    } catch (err) {
        return void cb(err);
    }
};

Block.writeLoginBlock = function (Env, safeKey, msg, _cb) { // FIXME BLOCKS
    var cb = Util.once(Util.mkAsync(_cb));
    //console.log(msg);
    var publicKey = msg[0];
    var signature = msg[1];
    var block = msg[2];
    var registrationProof = msg[3];
    var previousKey;

    var validatedBlock, parsed, path;
    nThen(function (w) {
        if (Util.escapeKeyCharacters(publicKey) !== safeKey) {
            w.abort();
            return void cb("INCORRECT_KEY");
        }
    }).nThen(function (w) {
        if (!Env.restrictRegistration) { return; }
        if (!registrationProof) {
            // we allow users with existing blocks to create new ones
            // call back with error if registration is restricted and no proof of an existing block was provided
            w.abort();
            Env.Log.info("BLOCK_REJECTED_REGISTRATION", {
                safeKey: safeKey,
                publicKey: publicKey,
            });
            return cb("E_RESTRICTED");
        }
        Env.validateAncestorProof(registrationProof, w(function (err, provenKey) {
            if (err || !provenKey) { // double check that a key was validated
                w.abort();
                Env.Log.warn('BLOCK_REJECTED_INVALID_ANCESTOR', {
                    error: err,
                });
                return void cb("E_RESTRICTED");
            }
            previousKey = provenKey;
        }));
    }).nThen(function (w) {
        validateLoginBlock(Env, publicKey, signature, block, w(function (e, _validatedBlock) {
            if (e) {
                w.abort();
                return void cb(e);
            }
            if (!(_validatedBlock instanceof Uint8Array)) {
                w.abort();
                return void cb('E_INVALID_BLOCK');
            }

            validatedBlock = _validatedBlock;

            // derive the filepath
            path = createLoginBlockPath(Env, publicKey);

            // make sure the path is valid
            if (typeof(path) !== 'string') {
                return void cb('E_INVALID_BLOCK_PATH');
            }

            parsed = Path.parse(path);
            if (!parsed || typeof(parsed.dir) !== 'string') {
                w.abort();
                return void cb("E_INVALID_BLOCK_PATH_2");
            }
        }));
    }).nThen(function (w) {
        // make sure the path to the file exists
        Fse.mkdirp(parsed.dir, w(function (e) {
            if (e) {
                w.abort();
                cb(e);
            }
        }));
    }).nThen(function () {
        // actually write the block
        Fs.writeFile(path, Buffer.from(validatedBlock), { encoding: "binary", }, function (err) {
            if (err) { return void cb(err); }
            Env.Log.info('BLOCK_WRITE_BY_OWNER', {
                safeKey: safeKey,
                blockId: publicKey,
                isChange: Boolean(registrationProof),
                previousKey: previousKey,
                path: path,
            });
            cb();
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

    nThen(function (w) {
        if (Util.escapeKeyCharacters(publicKey) !== safeKey) {
            w.abort();
            return void cb("INCORRECT_KEY");
        }
    }).nThen(function () {
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
    });
};

