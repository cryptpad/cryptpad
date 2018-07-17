define([
    '/common/common-util.js',
    '/api/config',
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function (Util, ApiConfig) {
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
        if (!(seed instanceof Uint8Array)) {
            throw new Error('INVALID_SEED_FORMAT');
        }
        if (!seed || typeof(seed.length) !== 'number' || seed.length < 64) {
            throw new Error('INVALID_SEED_LENGTH');
        }

        var signSeed = seed.subarray(0, Nacl.sign.seedLength);
        var symmetric = seed.subarray(Nacl.sign.seedLength,
            Nacl.sign.seedLength + Nacl.secretbox.keyLength);

        return {
            sign: Nacl.sign.keyPair.fromSeed(signSeed), // 32 bytes
            symmetric: symmetric, // 32 bytes ...
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
        var box = u8_content.subarray(1 + Nacl.secretbox.nonceLength);

        var plaintext = Nacl.secretbox.open(box, nonce, keys.symmetric);
        try {
            return JSON.parse(Nacl.util.encodeUTF8(plaintext));
        } catch (e) {
            console.error(e);
            return;
        }
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

    Block.remove = function (keys) {
        // sign the hash of the text 'DELETE_BLOCK'
        var sig = Nacl.sign.detached(Nacl.hash(
            Nacl.util.decodeUTF8('DELETE_BLOCK')), keys.sign.secretKey);

        return {
            publicKey: Nacl.util.encodeBase64(keys.sign.publicKey),
            signature: Nacl.util.encodeBase64(sig),
        };
    };

    var urlSafeB64 = function (u8) {
        return Nacl.util.encodeBase64(u8).replace(/\//g, '-');
    };

    Block.getBlockUrl = function (keys) {
        var publicKey = urlSafeB64(keys.sign.publicKey);
        // 'block/' here is hardcoded because it's hardcoded on the server
        // if we want to make CryptPad work in server subfolders, we'll need
        // to update this path derivation
        return (ApiConfig.fileHost || window.location.origin)
            + '/block/' + publicKey.slice(0, 2) + '/' +  publicKey;
    };

    Block.getBlockHash = function (keys) {
        var absolute = Block.getBlockUrl(keys);
        var symmetric = urlSafeB64(keys.symmetric);
        return absolute + '#' + symmetric;
    };

    var decodeSafeB64 = function (b64) {
        try {
            return Nacl.util.decodeBase64(b64.replace(/\-/g, '/'));
        } catch (e) {
            console.error(e);
            return;
        }
    };

    Block.parseBlockHash = function (hash) {
        if (typeof(hash) !== 'string') { return; }
        var parts = hash.split('#');
        if (parts.length !== 2) { return; }

        try {
            return {
                href: parts[0],
                keys: {
                    symmetric: decodeSafeB64(parts[1]),
                }
            };
        } catch (e) {
            console.error(e);
            return;
        }
    };

    return Block;
});
