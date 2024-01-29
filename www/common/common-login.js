// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'chainpad-listmap',
    '/components/chainpad-crypto/crypto.js',
    '/common/common-util.js',
    '/common/outer/network-config.js',
    '/common/common-credential.js',
    '/components/chainpad/chainpad.dist.js',
    '/common/common-realtime.js',
    '/common/common-constants.js',
    '/common/common-interface.js',
    '/common/common-feedback.js',
    '/common/outer/local-store.js',
    '/customize/messages.js',
    '/components/nthen/index.js',
    '/common/outer/login-block.js',
    '/common/common-hash.js',
    '/common/outer/http-command.js',

    '/components/tweetnacl/nacl-fast.min.js',
    '/components/scrypt-async/scrypt-async.min.js', // better load speed
], function (Listmap, Crypto, Util, NetConfig, Cred, ChainPad, Realtime, Constants, UI,
            Feedback, LocalStore, Messages, nThen, Block, Hash, ServerCommand) {
    var Nacl = window.nacl;

    var Exports = {
        requiredBytes: 192,
    };

    var allocateBytes = Exports.allocateBytes = function (bytes) {
        var dispense = Cred.dispenser(bytes);

        var opt = {};

        // dispense 18 bytes of entropy for your encryption key
        var encryptionSeed = dispense(18);
        // 16 bytes for a deterministic channel key
        var channelSeed = dispense(16);
        // 32 bytes for a curve key
        var curveSeed = dispense(32);

        var curvePair = Nacl.box.keyPair.fromSecretKey(new Uint8Array(curveSeed));
        opt.curvePrivate = Nacl.util.encodeBase64(curvePair.secretKey);
        opt.curvePublic = Nacl.util.encodeBase64(curvePair.publicKey);

        // 32 more for a signing key
        var edSeed = opt.edSeed = dispense(32);

        // 64 more bytes to seed an additional signing key
        var blockKeys = opt.blockKeys = Block.genkeys(new Uint8Array(dispense(64)));
        opt.blockHash = Block.getBlockHash(blockKeys);

        // derive a private key from the ed seed
        var signingKeypair = Nacl.sign.keyPair.fromSeed(new Uint8Array(edSeed));

        opt.edPrivate = Nacl.util.encodeBase64(signingKeypair.secretKey);
        opt.edPublic = Nacl.util.encodeBase64(signingKeypair.publicKey);

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

    var loginOptionsFromBlock = Exports.loginOptionsFromBlock = function (blockInfo) {
        var opt = {};
        var parsed = Hash.getSecrets('pad', blockInfo.User_hash);
        opt.channelHex = parsed.channel;
        opt.keys = parsed.keys;
        opt.edPublic = blockInfo.edPublic;
        return opt;
    };

    var loadUserObject = Exports.loadUserObject = function (opt, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));
        var config = {
            websocketURL: NetConfig.getWebsocketURL(),
            channel: opt.channelHex,
            data: {},
            validateKey: opt.keys.validateKey, // derived validation key
            crypto: Crypto.createEncryptor(opt.keys),
            logLevel: 1,
            classic: true,
            ChainPad: ChainPad,
            owners: [opt.edPublic]
        };

        var rt = opt.rt = Listmap.create(config);
        rt.proxy
        .on('ready', function () {
            setTimeout(function () { cb(void 0, rt); });
        })
        .on('error', function (info) {
            cb(info.type, {reason: info.message});
        })
        .on('disconnect', function (info) {
            cb('E_DISCONNECT', info);
        });
    };

    var isProxyEmpty = Exports.isProxyEmpty = function (proxy) {
        var l = Object.keys(proxy).length;
        return l === 0 || (l === 2 && proxy._events && proxy.on);
    };

    var legacyLogin = function (opt, isRegister, cb, res) {
        res = res || {};
        loadUserObject(opt, function (err, rt) {
            if (err) { return void cb(err); }

            // if a proxy is marked as deprecated, it is because someone had a non-owned drive
            // but changed their password, and couldn't delete their old data.
            // if they are here, they have entered their old credentials, so we should not
            // allow them to proceed. In time, their old drive should get deleted, since
            // it will should be pinned by anyone's drive.
            if (rt.proxy[Constants.deprecatedKey]) {
                return void cb('NO_SUCH_USER');
            }

            if (isRegister && isProxyEmpty(rt.proxy)) {
                // If they are trying to register,
                // and the proxy is empty, then there is no 'legacy user' either
                // so we should just shut down this session and disconnect.
                //rt.network.disconnect();
                return void cb(); // proceed to the next async block
            }

            // they tried to just log in but there's no such user
            // and since we're here at all there is no modern-block
            if (!isRegister && isProxyEmpty(rt.proxy)) {
                return void cb('NO_SUCH_USER');
            }

            // they tried to register, but those exact credentials exist
            if (isRegister && !isProxyEmpty(rt.proxy)) {
                Feedback.send('LOGIN', true);
                return void cb('ALREADY_REGISTERED');
            }

            // if you are here, then there is no block, the user is trying
            // to log in. The proxy is **not** empty. All values assigned here
            // should have been deterministically created using their credentials
            // so setting them is just a precaution to keep things in good shape
            res.proxy = rt.proxy;
            res.realtime = rt.realtime;
            res.network = rt.network;

            // they're registering...
            res.userHash = opt.userHash;
            res.userName = res.uname;

            // export their signing key
            res.edPrivate = opt.edPrivate;
            res.edPublic = opt.edPublic;

            // export their encryption key
            res.curvePrivate = opt.curvePrivate;
            res.curvePublic = opt.curvePublic;

            // don't proceed past this async block.

            // We have to call whenRealtimeSyncs asynchronously here because in the current
            // version of listmap, onLocal calls `chainpad.contentUpdate(newValue)`
            // asynchronously.
            // The following setTimeout is here to make sure whenRealtimeSyncs is called after
            // `contentUpdate` so that we have an update userDoc in chainpad.
            setTimeout(function () {
                Realtime.whenRealtimeSyncs(rt.realtime, function () {
                    // the following stages are there to initialize a new drive
                    // if you are registering
                    LocalStore.login(res.userHash, undefined, res.userName, function () {
                        setTimeout(function () { cb(void 0, res); });
                    });
                });
            });
        });
    };

    var getProxyOpt = function (blockInfo) {
        var opt;
        if (blockInfo) {
            opt = loginOptionsFromBlock(blockInfo);
            opt.userHash = blockInfo.User_hash;
        } else {
            console.log("allocating random bytes for a new user object");
            opt = allocateBytes(Nacl.randomBytes(Exports.requiredBytes));
            // create a random v2 hash, since we don't need backwards compatibility
            opt.userHash = Hash.createRandomHash('drive');
            var secret = Hash.getSecrets('drive', opt.userHash);
            opt.keys = secret.keys;
            opt.channelHex = secret.channel;
        }

        console.warn(opt);
        return opt;
    };

    var modernLoginRegister = function (opt, isRegister, cb, res) {
        res = res || {};
        // according to the location derived from the credentials which you entered
        loadUserObject(opt, function (err, rt) {
            if (err) { return void cb('MODERN_REGISTRATION_INIT'); }

            // export the realtime object you checked
            var RT = rt;

            var proxy = rt.proxy;
            if (isRegister && !isProxyEmpty(proxy) && (!proxy.edPublic || !proxy.edPrivate)) {
                console.error("INVALID KEYS");
                console.log(JSON.stringify(proxy));
                return void cb(void 0, void 0, RT);
            }

            res.proxy = rt.proxy;
            res.realtime = rt.realtime;
            res.network = rt.network;

            // they're registering...
            res.userHash = opt.userHash;
            res.userName = res.uname;

            // somehow they have a block present, but nothing in the user object it specifies
            // this shouldn't happen, but let's send feedback if it does
            if (!isRegister && isProxyEmpty(rt.proxy)) {
                // this really shouldn't happen, but let's handle it anyway
                Feedback.send('EMPTY_LOGIN_WITH_BLOCK');
                return void cb('NO_SUCH_USER');
            }

            if (!isProxyEmpty(rt.proxy) && res.auth_token && res.auth_token.bearer) {
                LocalStore.setSessionToken(res.auth_token.bearer);
            }

            // they tried to register, but those exact credentials exist
            if (isRegister && !isProxyEmpty(rt.proxy)) {
                //rt.network.disconnect();
                return void cb('ALREADY_REGISTERED');
            }

            if (!isRegister && !isProxyEmpty(rt.proxy)) {
                var l = Util.find(rt.proxy, ['settings', 'general', 'language']);
                var LS_LANG = "CRYPTPAD_LANG";
                if (l) { localStorage.setItem(LS_LANG, l); }

                return void LocalStore.login(undefined, res.blockHash, res.uname, function () {
                    cb(void 0, res, RT);
                });
            }

            if (isRegister && isProxyEmpty(rt.proxy)) {
                proxy.edPublic = opt.edPublic;
                proxy.edPrivate = opt.edPrivate;
                proxy.curvePublic = opt.curvePublic;
                proxy.curvePrivate = opt.curvePrivate;
                proxy.login_name = res.uname;
                proxy[Constants.displayNameKey] = res.uname;
                proxy.version = 11;

                Feedback.send('REGISTRATION', true);
            } else {
                Feedback.send('LOGIN', true);
            }

            setTimeout(function () {
                Realtime.whenRealtimeSyncs(rt.realtime, function () {
                    cb(void 0, void 0, RT);
                });
            });
        });
    };

    Exports.loginOrRegister = function (config, cb) {
        let { uname, passwd, token, isRegister, onOTP, ssoAuth } = config;
        if (typeof(cb) !== 'function') { return; }

        // Usernames are all lowercase. No going back on this one
        uname = uname.toLowerCase();

        // validate inputs
        if (!Cred.isValidUsername(uname)) { return void cb('INVAL_USER'); }
        if (!Cred.isValidPassword(passwd) && !ssoAuth) { return void cb('INVAL_PASS'); }
        if (isRegister && !ssoAuth && !Cred.isLongEnoughPassword(passwd)) {
            return void cb('PASS_TOO_SHORT');
        }

        // results...
        var res = {
            register: isRegister,
            uname: uname,
            auth_token: {}
        };

        var RT, blockKeys, blockUrl;

        nThen(function (waitFor) {
            // derive a predefined number of bytes from the user's inputs,
            // and allocate them in a deterministic fashion
            Cred.deriveFromPassphrase(uname, passwd, Exports.requiredBytes, waitFor(function (bytes) {
                res.opt = allocateBytes(bytes);
                res.blockHash = res.opt.blockHash;
                blockKeys = res.opt.blockKeys;
                if (ssoAuth && ssoAuth.name) { uname = res.uname = ssoAuth.name; }
            }));
        }).nThen(function (waitFor) {
            // the allocated bytes can be used either in a legacy fashion,
            // or in such a way that a previously unused byte range determines
            // the location of a layer of indirection which points users to
            // an encrypted block, from which they can recover the location of
            // the rest of their data

            // determine where a block for your set of keys would be stored
            blockUrl = Block.getBlockUrl(res.opt.blockKeys);

            var TOTP_prompt = function (err, ssoSession, cb) {
                onOTP(function (code) {
                    ServerCommand(res.opt.blockKeys.sign, {
                        command: 'TOTP_VALIDATE',
                        code: code,
                        session: ssoSession
                        // TODO optionally allow the user to specify a lifetime for this session?
                        // this will require a little bit of server work
                        // and more UI/UX:
                        // ie. just a simple "remember me" checkbox?
                        // allow them to specify a lifetime for the session?
                        // "log me out after one day"?
                    }, cb);
                }, false, err);
            };

            var done = waitFor();
            var responseToDecryptedBlock = function (response, cb) {
                response.arrayBuffer().then(arraybuffer => {
                    arraybuffer = new Uint8Array(arraybuffer);
                    var decryptedBlock =  Block.decrypt(arraybuffer, blockKeys);
                    if (!decryptedBlock) {
                        console.error("BLOCK DECRYPTION ERROR");
                        return void cb("BLOCK_DECRYPTION_ERROR");
                    }
                    cb(void 0, decryptedBlock);
                });
            };

            var missingAuth;
            var missingSSO;
            nThen(function (w) {
                Util.getBlock(blockUrl, {
                // request the block without credentials
                }, w(function (err, response) {
                    if (err === 401) {
                        missingSSO = response && response.sso;
                        missingAuth = response && response.method;
                        return void console.log("Block requires 2FA");
                    }

                    if (err === 404 && response && response.reason) {
                        waitFor.abort();
                        w.abort();
                        /*
                        // the following block prevent users from re-using an old password
                        if (isRegister) { return void cb('HAS_PLACEHOLDER'); }
                        */
                        return void cb('DELETED_USER', response);
                    }

                    // Some other error?
                    if (err) {
                        console.error(err);
                        w.abort();
                        return void done();
                    }

                    // If the block was returned without requiring authentication
                    // then we can abort the subsequent steps of this nested nThen
                    w.abort();

                    // decrypt the response and continue the normal procedure with its payload
                    responseToDecryptedBlock(response, function (err, decryptedBlock) {
                        if (err) {
                            // if a block was present but you were not able to decrypt it...
                            console.error(err);
                            waitFor.abort();
                            return void cb(err);
                        }
                        res.blockInfo = decryptedBlock;
                        done();
                    });
                }));
            }).nThen(function (w) {
                if (!missingSSO) { return; }
                // SSO session should always be applied before the OTP one
                // because we can't transform an account into an SSO account later
                // so we probably don't need to recover the OTP session here
                ServerCommand(res.opt.blockKeys.sign, {
                    command: 'SSO_VALIDATE',
                    jwt: ssoAuth.data,
                }, w(function (err, response) {
                    if (err) {
                        console.error(err);
                        w.abort();
                        waitFor.abort();
                        return void cb(err);
                    }
                    res.auth_token = response;
                }));
            }).nThen(function (w) {
                if (missingAuth !== 'TOTP') { return; }
                // if you're here then you need to request a JWT
                var done = w();
                var tries = 3;
                var ask = function () {
                    if (!tries) {
                        w.abort();
                        waitFor.abort();
                        return void cb('TOTP_ATTEMPTS_EXHAUSTED');
                    }
                    tries--;
                    // If we have an SSO account, provide the SSO session to update it with OTP
                    var ssoSession = (res.auth_token && res.auth_token.bearer) || '';
                    TOTP_prompt(tries !== 2, ssoSession, function (err, response) {
                        // ask again until your number of tries are exhausted
                        if (err) {
                            console.error(err);
                            console.log("Normal failure. Asking again...");
                            return void ask();
                        }
                        if (!response || !response.bearer) {
                            console.log(response);
                            console.log("Unexpected failure. No bearer token. Asking again");
                            return void ask();
                        }
                        console.log("Successfully retrieved a bearer token");
                        res.auth_token = response;
                        done();
                    });
                };
                ask();
            }).nThen(function (w) {
                Util.getBlock(blockUrl, res.auth_token, function (err, response) {
                    if (err) {
                        w.abort();
                        console.error(err);
                        return void cb('BLOCK_ERROR_3');
                    }

                    responseToDecryptedBlock(response, function (err, decryptedBlock) {
                        if (err) {
                            waitFor.abort();
                            return void cb(err);
                        }
                        res.blockInfo = decryptedBlock;
                        done();
                    });
                });
            });
        }).nThen(function (waitFor) {

            // we assume that if there is a block, it was created in a valid manner
            // so, just proceed to the next block which handles that stuff
            if (res.blockInfo) { return; }

            var opt = res.opt;

            // load the user's object using the legacy credentials
            legacyLogin(opt, isRegister, waitFor(function (err, data) {
                if (err) {
                    waitFor.abort();
                    return void cb(err, res);
                }
                if (!data) { return; } // Go to next block (modern registration)

                // No error and data: success legacy login
                waitFor.abort();
                cb(void 0, data);
            }), res);
        }).nThen(function (waitFor) { // MODERN REGISTRATION / LOGIN
            var opt = getProxyOpt(res.blockInfo);

            LocalStore.setSessionToken('');
            modernLoginRegister(opt, isRegister, waitFor(function (err, data, _RT) {
                if (err) {
                    waitFor.abort();
                    return void cb(err, res);
                }
                RT = _RT;
                if (!data) { return; } // Go to next block (modern registration)

                // No error and data: success modern login
                waitFor.abort();
                cb(void 0, data);
            }), res);
        }).nThen(function (waitFor) {
            console.log("creating request to publish a login block");

            // Finally, create the login block for the object you just created.
            var toPublish = {};
            toPublish[Constants.userHashKey] = res.userHash;
            toPublish.edPublic = RT.proxy.edPublic;

            // FIXME We currently can't create an account with OTP by default
            // NOTE If we ever want to do that for SSO accounts it will require major changes
            //      because writeLoginBlock only supports one type of authentication at a time

            // XXX Get server config to know if the user data should be sent or not
            // Only SSO users and invited users can be stored by the server and it needs to be configured
            var userData = (token || ssoAuth) ? [uname, RT.proxy.edPublic] : undefined;
            Block.writeLoginBlock({
                pw: Boolean(passwd),
                auth: ssoAuth,
                blockKeys: blockKeys,
                token: token,
                content: toPublish,
                userData
            }, waitFor(function (e, res) {
                if (e === 'SSO_NO_SESSION') { return; } // account created, need re-login
                if (e) {
                    console.error(e, res);
                    waitFor.abort();
                    return void cb(res ? (res.errorCode || res.error) : e);
                }
                if (res && res.bearer) {
                    LocalStore.setSessionToken(res.bearer);
                }
            }));
        }).nThen(function (waitFor) {
            // confirm that the block was actually written before considering registration successful
            Util.getBlock(blockUrl, {}, waitFor(function (err /*, block */) {
                if (err && err !== 401) { // 401 is fine
                    console.error(err);
                    waitFor.abort();
                    return void cb(err);
                }

                console.log("blockInfo available at:", res.blockHash);
                LocalStore.login(undefined, res.blockHash, uname, function () {
                    cb(void 0, res);
                });
            }));
        });
    };

    return Exports;
});
