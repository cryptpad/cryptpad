// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/common/common-util.js',
    '/api/config',
    '/common/outer/http-command.js',
    '/components/tweetnacl/nacl-fast.min.js',
], function (Util, ApiConfig, ServerCommand) {
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

    Block.keysToRPCFormat = function (keys) {
        try {
            var sign = keys.sign;
            return {
                edPrivate: Nacl.util.encodeBase64(sign.secretKey),
                edPublic: Nacl.util.encodeBase64(sign.publicKey),
            };
        } catch (err) {
            console.error(err);
            return;
        }
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

    Block.proveAncestor = function (O /* oldBlockKeys, N, newBlockKeys */) {
        var u8_pub = Util.find(O, ['sign', 'publicKey']);
        var u8_secret = Util.find(O, ['sign', 'secretKey']);
        try {
        // sign your old publicKey with your old privateKey
            var u8_sig = Nacl.sign.detached(u8_pub, u8_secret);
        // return an array with the sig and the pubkey
            return JSON.stringify([u8_pub, u8_sig].map(Nacl.util.encodeBase64));
        } catch (err) {
            return void console.error(err);
        }
    };

    var urlSafeB64 = function (u8) {
        return Nacl.util.encodeBase64(u8).replace(/\//g, '-');
    };

    Block.getBlockUrl = function (keys) {
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

    Block.checkRights = function (data, _cb) {
        const cb = Util.mkAsync(_cb);
        const { blockKeys, auth } = data;

        var command = 'MFA_CHECK';
        if (auth && auth.type) { command = `${auth.type.toUpperCase()}_` + command; }

        ServerCommand(blockKeys.sign, {
            command: command,
            auth: auth && auth.data
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
            session: session // sso session
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
            reason: reason
        }, cb);
    };

    Block.updateSSOBlock = function (data, cb) {
        const { blockKeys, oldBlockKeys } = data;
        var oldProof = oldBlockKeys && Block.proveAncestor(oldBlockKeys);

        ServerCommand(blockKeys.sign, {
            command: 'SSO_UPDATE_BLOCK',
            ancestorProof: oldProof
        }, cb);

    };

    return Block;
});
