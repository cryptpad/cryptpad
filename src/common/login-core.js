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

    // Network failures are Error objects, HTTP errors status numbers
    const isNetworkError = err => err instanceof Error || err?.name === 'TypeError';

    // Fetch and decrypt the login block. Errors: the HTTP status (401 and 404
    // with the server's explanation), NETWORK_ERROR or BLOCK_ERROR.
    const fetchBlock = (blockUrl, blockKeys, authToken, _cb) => {
        const cb = Util.once(_cb);
        Util.getBlock(blockUrl, authToken || {}, (err, response) => {
            if (err === 401 || err === 404) { return void cb(err, response); }
            if (isNetworkError(err)) { return void cb('NETWORK_ERROR'); }
            if (err) { return void cb('BLOCK_ERROR'); }
            response.arrayBuffer().then(arraybuffer => {
                let decrypted;
                try {
                    decrypted = Block.decrypt(new Uint8Array(arraybuffer), blockKeys);
                } catch (e) {
                    console.error(e);
                }
                if (!decrypted) { return void cb('BLOCK_DECRYPTION_ERROR'); }
                cb(void 0, decrypted);
            }, () => cb('NETWORK_ERROR'));
        });
    };

    // Codes from authenticator apps are often shown as "123 456"
    const normalizeOTP = code => String(code).replace(/\s+/g, '');
    const isValidOTP = code => /^\d{6}$/.test(code);

    /*  Find the drive of an existing account from its credentials, without
        a browser: derive the keys, then fetch and decrypt the login block.

        config:
          - uname, passwd: the username is used in lowercase but otherwise
            as given (not trimmed), like in the web app
          - onOTP(cb, info): asks for a TOTP code when the account uses
            two-factor authentication. Call cb(code), or cb() to cancel.
            info.attempt counts from 1; info.error is 'INVALID_OTP' when the
            previous code was rejected. Up to OTP_ATTEMPTS codes are asked
            for. It may also return a promise; a rejection cancels.
          - session: optional bearer token from an earlier login
            (res.auth_token.bearer); if it is still valid, no code is needed
        cb(err, { userHash, blockHash, edPublic, auth_token })
        auth_token is only set for accounts with two-factor authentication.

        Errors: INVAL_USER, INVAL_PASS, NO_SUCH_USER, DELETED_USER,
        SSO_NOT_SUPPORTED, TOTP_REQUIRED (no onOTP), TOTP_CANCELLED,
        TOTP_ATTEMPTS_EXHAUSTED, NETWORK_ERROR, SERVER_ERROR (unexpected answer
        to a code), BLOCK_ERROR, BLOCK_DECRYPTION_ERROR, INTERNAL_ERROR.

        Accounts without a login block (created before blocks existed) are
        not supported: logging in to them with wrong credentials can't be
        told apart from an empty account.
    */
    LoginCore.OTP_ATTEMPTS = 3;
    LoginCore.getUserHash = (config, _cb) => {
        const cb = Util.once(Util.mkAsync(typeof(_cb) === 'function' ? _cb : () => {}));
        const { passwd, onOTP, session } = config || {};
        // Usernames are all lowercase
        const uname = typeof(config?.uname) === 'string' ? config.uname.toLowerCase() : '';
        if (!Cred.isValidUsername(uname)) { return void cb('INVAL_USER'); }
        if (!Cred.isValidPassword(passwd)) { return void cb('INVAL_PASS'); }

        // Report exceptions (e.g. a missing instance configuration) as an
        // error instead of throwing them from a callback
        const safe = f => (...args) => {
            try {
                f(...args);
            } catch (e) {
                console.error(e);
                cb('INTERNAL_ERROR');
            }
        };

        Cred.deriveFromPassphrase(uname, passwd, LoginCore.requiredBytes, safe(bytes => {
            const opt = LoginCore.allocateBytes(bytes);
            const blockKeys = opt.blockKeys;
            const blockUrl = Block.getBlockUrl(blockKeys);

            const done = authToken => safe((err, blockInfo) => {
                if (err === 401 || err === 404) { return void cb('BLOCK_ERROR'); }
                if (err) { return void cb(err); }
                if (!blockInfo?.User_hash) { return void cb('BLOCK_ERROR'); }
                cb(void 0, {
                    userHash: blockInfo.User_hash,
                    blockHash: opt.blockHash,
                    edPublic: blockInfo.edPublic,
                    auth_token: authToken
                });
            });

            // Ask for a code and exchange it for a session token
            const askOTP = (attempt, error) => {
                if (attempt > LoginCore.OTP_ATTEMPTS) { return void cb('TOTP_ATTEMPTS_EXHAUSTED'); }
                const answer = Util.once(safe(code => {
                    if (code === undefined || code === null || code === '') {
                        return void cb('TOTP_CANCELLED');
                    }
                    code = normalizeOTP(code);
                    // The server only accepts six digits: don't ask it
                    if (!isValidOTP(code)) { return void askOTP(attempt + 1, 'INVALID_OTP'); }
                    ServerCommand(blockKeys.sign, {
                        command: 'TOTP_VALIDATE',
                        code: code,
                        session: ''
                    }, safe((err, response) => {
                        if (isNetworkError(err)) { return void cb('NETWORK_ERROR'); }
                        // The server answers a wrong code with an INVALID_OTP error
                        if (err && response?.error === 'INVALID_OTP') {
                            return void askOTP(attempt + 1, 'INVALID_OTP');
                        }
                        if (err || !response?.bearer) { return void cb('SERVER_ERROR'); }
                        const authToken = { bearer: response.bearer };
                        fetchBlock(blockUrl, blockKeys, authToken, done(authToken));
                    }));
                }));
                let returned;
                try {
                    returned = onOTP(answer, { attempt, error });
                } catch (e) {
                    console.error(e);
                    return void answer();
                }
                // An async onOTP that fails cancels the login
                if (typeof(returned?.then) === 'function') {
                    returned.then(undefined, e => {
                        console.error(e);
                        answer();
                    });
                }
            };

            const onTOTP = () => {
                if (typeof(onOTP) !== 'function') { return void cb('TOTP_REQUIRED'); }
                askOTP(1);
            };

            fetchBlock(blockUrl, blockKeys, undefined, safe((err, res) => {
                if (err === 404 && res?.reason) { return void cb('DELETED_USER'); }
                if (err === 404) { return void cb('NO_SUCH_USER'); }
                if (err === 401 && res?.sso) { return void cb('SSO_NOT_SUPPORTED'); }
                if (err === 401 && res?.method === 'TOTP') {
                    if (!session) { return void onTOTP(); }
                    // Try the session of an earlier login before asking for a code
                    const authToken = { bearer: session };
                    return void fetchBlock(blockUrl, blockKeys, authToken, safe((err, res) => {
                        if (err === 401) { return void onTOTP(); }
                        done(authToken)(err, res);
                    }));
                }
                done()(err, res);
            }));
        }));
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
