// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Login steps that don't depend on the browser, shared by the web app
// (common-login.js) and the NodeJS API (store-interface.js).
(() => {
const factory = (Util, Cred, Block, ServerCommand, Crypto, Nacl) => {
    const LoginCore = {
        requiredBytes: 192,
    };

    LoginCore.setCustomize = data => {
        Cred.setCustomize?.(data);
        Block.setCustomize?.(data);
    };

    // Deterministically allocate the bytes derived from the credentials
    LoginCore.allocateBytes = function (bytes) {
        var dispense = Cred.dispenser(bytes);

        var opt = {};

        // dispense 18 bytes of entropy for your encryption key
        var encryptionSeed = dispense(18);
        // 16 bytes for a deterministic channel key
        var channelSeed = dispense(16);
        // 32 bytes for a curve key
        var curveSeed = dispense(32);

        var curvePair = Nacl.box.keyPair.fromSecretKey(new Uint8Array(curveSeed));
        opt.curvePrivate = Util.encodeBase64(curvePair.secretKey);
        opt.curvePublic = Util.encodeBase64(curvePair.publicKey);

        // 32 more for a signing key
        var edSeed = opt.edSeed = dispense(32);

        // 64 more bytes to seed an additional signing key
        var blockKeys = opt.blockKeys = Block.genkeys(new Uint8Array(dispense(64)));
        opt.blockHash = Block.getBlockHash(blockKeys);

        // derive a private key from the ed seed
        var signingKeypair = Nacl.sign.keyPair.fromSeed(new Uint8Array(edSeed));

        opt.edPrivate = Util.encodeBase64(signingKeypair.secretKey);
        opt.edPublic = Util.encodeBase64(signingKeypair.publicKey);

        var keys = opt.keys = Crypto.createEditCryptor(null, encryptionSeed);

        // 24 bytes of base64
        keys.editKeyStr = keys.editKeyStr.replace(/\//g, '-');

        // 32 bytes of hex
        var channelHex = opt.channelHex = Util.uint8ArrayToHex(channelSeed);

        // should never happen
        if (channelHex.length !== 32) { throw new Error('invalid channel id'); }

        var channel64 = Util.hexToBase64(channelHex);

        // we still generate a v1 hash because this function needs to deterministically
        // derive the same values as it always has. New accounts will generate their own
        // userHash values
        opt.userHash = '/1/edit/' + [channel64, opt.keys.editKeyStr].join('/') + '/';

        return opt;
    };

    const fetchBlock = (blockUrl, blockKeys, authToken, cb) => {
        Util.getBlock(blockUrl, authToken || {}, (err, response) => {
            if (err) { return void cb(err, response); }
            response.arrayBuffer().then(arraybuffer => {
                const decrypted = Block.decrypt(new Uint8Array(arraybuffer), blockKeys);
                if (!decrypted) { return void cb('BLOCK_DECRYPTION_ERROR'); }
                cb(void 0, decrypted);
            }, cb);
        });
    };

    /*  Find the drive of an existing account from its credentials, without
        a browser: derive the keys, then fetch and decrypt the login block.

        config:
          - uname, passwd
          - onOTP(cb, info): asks for a TOTP code when the account uses
            two-factor authentication. Call cb(code), or cb() to cancel.
            info.attempt counts from 1; info.error is set when the previous
            code was rejected. Up to OTP_ATTEMPTS codes are asked for.
          - session: optional bearer token from an earlier login
            (res.auth_token.bearer); if it is still valid, no code is needed
        cb(err, { userHash, blockHash, edPublic, auth_token })

        TOTP errors: TOTP_REQUIRED (no onOTP), TOTP_CANCELLED,
        TOTP_ATTEMPTS_EXHAUSTED.

        Accounts without a login block (created before blocks existed) are
        not supported: logging in to them with wrong credentials can't be
        told apart from an empty account.
    */
    LoginCore.OTP_ATTEMPTS = 3;
    LoginCore.getUserHash = (config, cb) => {
        cb = Util.once(Util.mkAsync(cb));
        const { passwd, onOTP, session } = config;
        // Usernames are all lowercase
        const uname = String(config.uname || '').toLowerCase();
        if (!Cred.isValidUsername(uname)) { return void cb('INVAL_USER'); }
        if (!Cred.isValidPassword(passwd)) { return void cb('INVAL_PASS'); }

        Cred.deriveFromPassphrase(uname, passwd, LoginCore.requiredBytes, bytes => {
            const opt = LoginCore.allocateBytes(bytes);
            const blockKeys = opt.blockKeys;
            const blockUrl = Block.getBlockUrl(blockKeys);

            const done = (authToken) => (err, blockInfo) => {
                if (err) { return void cb(err); }
                if (!blockInfo?.User_hash) { return void cb('BLOCK_ERROR'); }
                cb(void 0, {
                    userHash: blockInfo.User_hash,
                    blockHash: opt.blockHash,
                    edPublic: blockInfo.edPublic,
                    auth_token: authToken
                });
            };

            // Ask for a code and exchange it for a session token
            const askOTP = (attempt, error) => {
                if (attempt > LoginCore.OTP_ATTEMPTS) { return void cb('TOTP_ATTEMPTS_EXHAUSTED'); }
                onOTP(code => {
                    if (!code) { return void cb('TOTP_CANCELLED'); }
                    ServerCommand(blockKeys.sign, {
                        command: 'TOTP_VALIDATE',
                        code: String(code).trim(),
                        session: ''
                    }, (err, response) => {
                        // The server answers an invalid code with an error
                        if (err || !response?.bearer) {
                            return void askOTP(attempt + 1, 'INVALID_OTP');
                        }
                        fetchBlock(blockUrl, blockKeys, response, done(response));
                    });
                }, { attempt, error });
            };

            const authToken = session ? { bearer: session } : undefined;
            fetchBlock(blockUrl, blockKeys, authToken, (err, res) => {
                if (err === 404 && res?.reason) { return void cb('DELETED_USER'); }
                if (err === 404) { return void cb('NO_SUCH_USER'); }
                if (err === 401 && res?.sso) { return void cb('SSO_NOT_SUPPORTED'); }
                if (err === 401 && res?.method === 'TOTP') {
                    if (typeof(onOTP) !== 'function') { return void cb('TOTP_REQUIRED'); }
                    return void askOTP(1);
                }
                done(authToken)(err, res);
            });
        });
    };

    return LoginCore;
};

if (typeof(module) !== 'undefined' && module.exports) {
    module.exports = factory(
        require('./common-util'),
        require('./common-credential'),
        require('./outer/login-block'),
        require('./outer/http-command'),
        require('chainpad-crypto'),
        require('tweetnacl/nacl-fast')
    );
} else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
    define([
        '/common/common-util.js',
        '/common/common-credential.js',
        '/common/outer/login-block.js',
        '/common/outer/http-command.js',
        '/components/chainpad-crypto/crypto.js',
        '/components/tweetnacl/nacl-fast.min.js',
    ], (Util, Cred, Block, ServerCommand, Crypto) => {
        return factory(Util, Cred, Block, ServerCommand, Crypto, window.nacl);
    });
} else {
    // unsupported initialization
}
})();
