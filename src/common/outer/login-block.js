// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

(() => {
const factory = (Util, ApiConfig = {}, ServerCommand, Nacl, Crypto) => {

    var Block = {};

    Block.setCustomize = data => {
        ApiConfig = data.ApiConfig;
        ServerCommand.setCustomize(data);
    };

    Block.join = Util.uint8ArrayJoin;

    // publickey <base64 string>

    // signature <base64 string>

    // block <base64 string>

    // [b64_public, b64_sig, b64_block [version, nonce, content]]

    Block.seed = function () {
        return Crypto.CryptoAgility.createHash(Util.decodeUTF8('pewpewpew'));
    };

    // should be deterministic from a seed...
    Block.genkeys = function (seed) {
        if (!(seed instanceof Uint8Array)) {
            throw new Error('INVALID_SEED_FORMAT');
        }
        if (!seed || typeof(seed.length) !== 'number' || seed.length < 64) {
            throw new Error('INVALID_SEED_LENGTH');
        }

        var signSeed = seed.subarray(0, Crypto.CryptoAgility.signSeedLength());
        var symmetric = seed.subarray(Crypto.CryptoAgility.signSeedLength(),
            Crypto.CryptoAgility.signSeedLength() + Crypto.CryptoAgility.secretboxKeyLength());

        // Generate standard keys using the existing method
        var sign = Crypto.CryptoAgility.signKeyPairFromSeed(signSeed);

        // Store the post-quantum keys separately for future use (no server validation issues)
        var pqSignPair = null;
        var hybridCapable = !!Crypto.PQC && !!Crypto.PQC.ml_dsa;

        if (hybridCapable) {
            try {
                // Use separate seed for PQ keys derived from original seed
                // ML-DSA requires a 32-byte seed, so we hash the seed to get a consistent 32-byte value
                var pqSeed = Nacl.hash(seed).subarray(0, 32);

                // Generate post-quantum keypair using the 32-byte hash
                pqSignPair = Crypto.CryptoAgility.generateDsaKeypair(pqSeed);
            } catch (err) {
                console.error("Failed to generate post-quantum keys:", err);
                pqSignPair = null;
            }
        }

        return {
            sign: sign,
            pqSignPair: pqSignPair,
            symmetric: symmetric,
            // Store whether we have post-quantum capability
            hasPQ: pqSignPair !== null
        };
    };

    Block.keysToRPCFormat = function (keys) {
        try {
            var sign = keys.sign;
            var pqSignPair = keys.pqSignPair;

            // Basic format with classical and pqc keys
            var result = {
                edPrivate: Util.encodeBase64(sign.secretKey),
                edPublic: Util.encodeBase64(sign.publicKey),
                dsaPrivate: Util.encodeBase64(pqSignPair.secretKey),
                dsaPublic: Util.encodeBase64(pqSignPair.publicKey),
            };

            return result;
        } catch (err) {
            console.error(err);
            return;
        }
    };

    // (UTF8 content, keys object) => Uint8Array block
    Block.encrypt = function (version, content, keys) {
        var u8 = Util.decodeUTF8(content);
        var nonce = Crypto.CryptoAgility.bytes(Crypto.CryptoAgility.secretboxNonceLength());
        return Block.join([
            [0],
            nonce,
            Crypto.CryptoAgility.secretbox(u8, nonce, keys.symmetric)
        ]);
    };

    // (uint8Array block) => payload object
    // src/common/outer/login-block.js
    Block.decrypt = function (u8_content, keys) {
        // version is currently ignored since there is only one
        var nonceLength = Crypto.CryptoAgility.secretboxNonceLength();
        var nonce = u8_content.subarray(1, 1 + nonceLength);
        var box = u8_content.subarray(1 + nonceLength);

        var plaintext = Crypto.CryptoAgility.secretboxOpen(box, nonce, keys.symmetric);
        try {
            return JSON.parse(Util.encodeUTF8(plaintext));
        } catch (e) {
            console.error(e);
            return;
        }
    };

    // (Uint8Array block) => signature
    Block.sign = function (ciphertext, keys) {
        var hash = Crypto.CryptoAgility.createHash(ciphertext);

        // Generate hybrid signature if post-quantum capabilities are available
        if (keys.hasPQ && keys.pqSignPair) {
            try {
                // Generate classical signature (always required for server compatibility)
                var classicalSig = Crypto.CryptoAgility.signDetached(hash, keys.sign.secretKey);

                // Generate post-quantum signature
                var pqSig = Crypto.PQC.ml_dsa.ml_dsa44.internal.sign(keys.pqSignPair.secretKey, hash);

                console.log("Hybrid signature created successfully:");
                // Create a hybrid signature with format:
                // [1-byte type][64-byte classical sig][4-byte PQ sig length][PQ sig bytes]
                var hybridSig = new Uint8Array(1 + classicalSig.length + 4 + pqSig.length);
                hybridSig[0] = 1; // Type 1 indicates hybrid signature
                hybridSig.set(classicalSig, 1);

                // Set PQ signature length as 4-byte integer (big endian)
                var view = new DataView(hybridSig.buffer);
                view.setUint32(1 + classicalSig.length, pqSig.length, false);

                // Add the PQ signature
                hybridSig.set(pqSig, 1 + classicalSig.length + 4);

                return hybridSig;
            } catch (e) {
                console.error("PQ signing failed, falling back to classical:", e);
            }
        }

        // Classical signature with a type marker
        classicalSig = Crypto.CryptoAgility.signDetached(hash, keys.sign.secretKey);
        var taggedSig = new Uint8Array(classicalSig.length + 1);
        taggedSig[0] = 0; // Type 0 indicates classical only
        taggedSig.set(classicalSig, 1);
        return taggedSig;
    };

    Block.serialize = function (content, keys) {
        // encrypt the content
        var ciphertext = Block.encrypt(0, content, keys);

        // generate a detached signature
        var sig = Block.sign(ciphertext, keys);

        // serialize {publickey, sig, ciphertext}
        var result = {
            publicKey: Util.encodeBase64(keys.sign.publicKey),
            pqPublicKey: Util.encodeBase64(keys.pqSignPair.publicKey),
            signature: Util.encodeBase64(sig),
            ciphertext: Util.encodeBase64(ciphertext),
        };

        return result;
    };

    Block.proveAncestor = function (O /* oldBlockKeys, N, newBlockKeys */) {
        var u8_pub = Util.find(O, ['sign', 'publicKey']);
        try {
            // Use Block.sign to create a hybrid signature if available
            var hybridSig = Block.sign(u8_pub, O);
            let result = [u8_pub, hybridSig].map(Util.encodeBase64);

            if (O.pqSignPair && O.pqSignPair.publicKey) {
                result.push(Util.encodeBase64(O.pqSignPair.publicKey));
            }

            // Return an array with the signature and the pubkey
            return JSON.stringify(result);
        } catch (err) {
            return void console.error(err);
        }
    };

    var urlSafeB64 = function (u8) {
        return Util.encodeBase64(u8).replace(/\//g, '-');
    };

    Block.getBlockUrl = function (keys) {
        // Use classical keys for backward compatibility with URL structure
        var publicKey = urlSafeB64(keys.sign.publicKey);
        // 'block/' here is hardcoded because it's hardcoded on the server
        // if we want to make CryptPad work in server subfolders, we'll need
        // to update this path derivation
        return (ApiConfig.fileHost || ApiConfig.httpUnsafeOrigin || window.location.origin)
            + '/block/' + publicKey.slice(0, 2) + '/' +  publicKey;
    };

    Block.getBlockHash = function (keys) {
        var absolute = Block.getBlockUrl(keys);
        var symmetric = urlSafeB64(keys.symmetric);
        return absolute + '#' + symmetric;
    };

    var decodeSafeB64 = function (b64) {
        try {
            return Util.decodeBase64(b64.replace(/\-/g, '/'));
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

    Block.checkRights = function (data, _cb) {
        const cb = Util.mkAsync(_cb);
        const { blockKeys, auth } = data;

        var command = 'MFA_CHECK';
        if (auth && auth.type) { command = `${auth.type.toUpperCase()}_` + command; }

        ServerCommand(blockKeys.sign, {
            command: command,
            auth: auth && auth.data,
        }, cb);
    };

    Block.writeLoginBlock = function (data, cb) {
        const { content, blockKeys, oldBlockKeys, auth, pw, session, token, userData } = data;

        var command = 'WRITE_BLOCK';
        if (auth && auth.type) { command = `${auth.type.toUpperCase()}_` + command; }

        var block = Block.serialize(JSON.stringify(content), blockKeys);
        block.auth = auth && auth.data;
        block.hasPassword = pw;
        block.registrationProof = oldBlockKeys && Block.proveAncestor(oldBlockKeys);
        if (token) { block.inviteToken = token; }
        if (userData) { block.userData = userData; }

        ServerCommand(blockKeys.sign, {
            command: command,
            content: block,
            session: session, // sso session
        }, cb);
    };

    Block.removeLoginBlock = function (data, cb) {
        const { reason, blockKeys, auth, edPublic } = data;

        var command = 'REMOVE_BLOCK';
        if (auth && auth.type) { command = `${auth.type.toUpperCase()}_` + command; }

        ServerCommand(blockKeys.sign, {
            command: command,
            auth: auth && auth.data,
            edPublic: edPublic,
            reason: reason,
        }, cb);
    };

    Block.updateSSOBlock = function (data, cb) {
        const { blockKeys, oldBlockKeys } = data;
        var oldProof = oldBlockKeys && Block.proveAncestor(oldBlockKeys);

        ServerCommand(blockKeys.sign, {
            command: 'SSO_UPDATE_BLOCK',
            ancestorProof: oldProof,
        }, cb);

    };

    return Block;
};

if (typeof(module) !== 'undefined' && module.exports) {
    module.exports = factory(
        require('../common-util'),
        undefined,
        require('./http-command'),
        require('tweetnacl/nacl-fast'),
        require('chainpad-crypto/crypto')
    );
} else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
    define([
        '/common/common-util.js',
        '/api/config',
        '/common/outer/http-command.js',
        '/components/tweetnacl/nacl-fast.min.js',
        '/components/chainpad-crypto/crypto.js',
    ], (Util, ApiConfig, ServerCommand, Nacl, Crypto) => {
        return factory(Util, ApiConfig, ServerCommand, window.nacl, Crypto);
    });
} else {
    // unsupported initialization
}

})();
