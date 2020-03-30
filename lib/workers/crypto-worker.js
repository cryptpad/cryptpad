/* jshint esversion: 6 */
/* global process */
const Nacl = require('tweetnacl/nacl-fast');

const COMMANDS = {};

COMMANDS.INLINE = function (data, cb) {
    var signedMsg;
    try {
        signedMsg = Nacl.util.decodeBase64(data.msg);
    } catch (e) {
        return void cb('E_BAD_MESSAGE');
    }

    var validateKey;
    try {
        validateKey = Nacl.util.decodeBase64(data.key);
    } catch (e) {
        return void cb("E_BADKEY");
    }
    // validate the message
    const validated = Nacl.sign.open(signedMsg, validateKey);
    if (!validated) {
        return void cb("FAILED");
    }
    cb();
};

const checkDetachedSignature = function (signedMsg, signature, publicKey) {
    if (!(signedMsg && publicKey)) { return false; }

    var signedBuffer;
    var pubBuffer;
    var signatureBuffer;

    try {
        signedBuffer = Nacl.util.decodeUTF8(signedMsg);
    } catch (e) {
        throw new Error("INVALID_SIGNED_BUFFER");
    }

    try {
        pubBuffer = Nacl.util.decodeBase64(publicKey);
    } catch (e) {
        throw new Error("INVALID_PUBLIC_KEY");
    }

    try {
        signatureBuffer = Nacl.util.decodeBase64(signature);
    } catch (e) {
        throw new Error("INVALID_SIGNATURE");
    }

    if (pubBuffer.length !== 32) {
        throw new Error("INVALID_PUBLIC_KEY_LENGTH");
    }

    if (signatureBuffer.length !== 64) {
        throw new Error("INVALID_SIGNATURE_LENGTH");
    }

    if (Nacl.sign.detached.verify(signedBuffer, signatureBuffer, pubBuffer) !== true) {
        throw new Error("FAILED");
    }
};

COMMANDS.DETACHED = function (data, cb) {
    try {
        checkDetachedSignature(data.msg, data.sig, data.key);
    } catch (err) {
        return void cb(err && err.message);
    }
    cb();
};

COMMANDS.HASH_CHANNEL_LIST = function (data, cb) {
    var channels = data.channels;
    if (!Array.isArray(channels)) { return void cb('INVALID_CHANNEL_LIST'); }
    var uniques = [];

    channels.forEach(function (a) {
        if (uniques.indexOf(a) === -1) { uniques.push(a); }
    });
    uniques.sort();

    var hash = Nacl.util.encodeBase64(Nacl.hash(Nacl
        .util.decodeUTF8(JSON.stringify(uniques))));

    cb(void 0, hash);
};

process.on('message', function (data) {
    if (!data || !data.txid) {
        return void process.send({
            error:'E_INVAL'
        });
    }

    const cb = function (err, value) {
        process.send({
            txid: data.txid,
            error: err,
            value: value,
        });
    };

    const command = COMMANDS[data.command];
    if (typeof(command) !== 'function') {
        return void cb("E_BAD_COMMAND");
    }

    command(data, cb);
});
