define([
    '/common/common-util.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function (Util) {
    var Nacl = window.nacl;

    var Block = {};

    Block.join = Util.uint8ArrayJoin;

    // publickey <base64 string>

    // signature <base64 string>

    // block <base64 string>

    // [b64_public, b64_sig, b64_block [version, nonce, content]]

    Block.seed = function () {
        return Nacl.hash(Nacl.util.decodeUTF8('pewpewpew'));
    };

    // should be deterministic from a seed...
    Block.genkeys = function (seed) {
        if (!seed || typeof(seed.length) !== 'number' || seed.length < 64) {
            throw new Error('INVALID_SEED_LENGTH');
        }

        var signSeed = seed.subarray(0, Nacl.sign.seedLength);
        var symmetric = seed.subarray(Nacl.sign.seedLength,
            Nacl.sign.seedLength + Nacl.secretbox.keyLength);

        return {
            sign: Nacl.sign.keyPair.fromSeed(signSeed), // 32 bytes
            symmetric: symmetric,
        };
    };

    // (UTF8 content, keys object) => Uint8Array block
    Block.encrypt = function (version, content, keys) {
        var u8 = Nacl.util.decodeUTF8(content);
        var nonce = Nacl.randomBytes(Nacl.secretbox.nonceLength);
        return Block.join([
            [0],
            nonce,
            Nacl.secretbox(u8, nonce, keys.symmetric)
        ]);
    };

    // (uint8Array block) => payload object
    Block.decrypt = function (u8_content, keys) {
        // version is currently ignored since there is only one
        var nonce = u8_content.subarray(1, 1 + Nacl.secretbox.nonceLength);
        var box = content.subarray(1 + Nacl.secretbox.nonceLength);
        return Nacl.secretbox.open(box, nonce, keys.symmetric);
    };

    // (Uint8Array block) => signature
    Block.sign = function (ciphertext, keys) {
        return Nacl.sign.detached(Nacl.hash(ciphertext), keys.sign.secretKey);
    };

    Block.serialize = function (content, keys) {
        // encrypt the content
        var ciphertext = Block.encrypt(0, content, keys);

        // generate a detached signature
        var sig = Block.sign(ciphertext, keys);

        // serialize {publickey, sig, ciphertext}
        return {
            publicKey: Nacl.util.encodeBase64(keys.sign.publicKey),
            signature: Nacl.util.encodeBase64(sig),
            ciphertext: Nacl.util.encodeBase64(ciphertext),
        };
    };

    return Block;
});
