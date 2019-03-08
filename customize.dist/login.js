define([
    'jquery',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/common-util.js',
    '/common/outer/network-config.js',
    '/customize/credential.js',
    '/bower_components/chainpad/chainpad.dist.js',
    '/common/common-realtime.js',
    '/common/common-constants.js',
    '/common/common-interface.js',
    '/common/common-feedback.js',
    '/common/outer/local-store.js',
    '/customize/messages.js',
    '/bower_components/nthen/index.js',
    '/common/outer/login-block.js',
    '/common/common-hash.js',

    '/bower_components/tweetnacl/nacl-fast.min.js',
    '/bower_components/scrypt-async/scrypt-async.min.js', // better load speed
], function ($, Listmap, Crypto, Util, NetConfig, Cred, ChainPad, Realtime, Constants, UI,
            Feedback, LocalStore, Messages, nThen, Block, Hash) {
    var Exports = {
        Cred: Cred,
        // this is depended on by non-customizable files
        // be careful when modifying login.js
        requiredBytes: 192,
    };

    var Nacl = window.nacl;
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


    var loginOptionsFromBlock = function (blockInfo) {
        var opt = {};
        var parsed = Hash.getSecrets('pad', blockInfo.User_hash);
        opt.channelHex = parsed.channel;
        opt.keys = parsed.keys;
        opt.edPublic = blockInfo.edPublic;
        opt.User_name = blockInfo.User_name;
        return opt;
    };

    var loadUserObject = function (opt, cb) {
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
        .on('disconnect', function (info) {
            cb('E_DISCONNECT', info);
        });
    };

    var isProxyEmpty = function (proxy) {
        var l = Object.keys(proxy).length;
        return l === 0 || (l === 2 && proxy._events && proxy.on);
    };

    var setMergeAnonDrive = function () {
        sessionStorage.migrateAnonDrive = 1;
    };

    var setCreateReadme = function () {
        sessionStorage.createReadme = 1;
    };

    Exports.loginOrRegister = function (uname, passwd, isRegister, shouldImport, cb) {
        if (typeof(cb) !== 'function') { return; }

        // Usernames are all lowercase. No going back on this one
        uname = uname.toLowerCase();

        // validate inputs
        if (!Cred.isValidUsername(uname)) { return void cb('INVAL_USER'); }
        if (!Cred.isValidPassword(passwd)) { return void cb('INVAL_PASS'); }
        if (isRegister && !Cred.isLongEnoughPassword(passwd)) {
            return void cb('PASS_TOO_SHORT');
        }

        // results...
        var res = {
            register: isRegister,
        };

        var RT, blockKeys, blockHash, Pinpad, rpc, userHash;

        nThen(function (waitFor) {
            // derive a predefined number of bytes from the user's inputs,
            // and allocate them in a deterministic fashion
            Cred.deriveFromPassphrase(uname, passwd, Exports.requiredBytes, waitFor(function (bytes) {
                res.opt = allocateBytes(bytes);
                blockHash = res.opt.blockHash;
                blockKeys = res.opt.blockKeys;
            }));
        }).nThen(function (waitFor) {
            // the allocated bytes can be used either in a legacy fashion,
            // or in such a way that a previously unused byte range determines
            // the location of a layer of indirection which points users to
            // an encrypted block, from which they can recover the location of
            // the rest of their data

            // determine where a block for your set of keys would be stored
            var blockUrl = Block.getBlockUrl(res.opt.blockKeys);

            // Check whether there is a block at that location
            Util.fetch(blockUrl, waitFor(function (err, block) {
                // if users try to log in or register, we must check
                // whether there is a block.

                // the block is only useful if it can be decrypted, though
                if (err) {
                    console.log("no block found");
                    return;
                }

                var decryptedBlock = Block.decrypt(block, blockKeys);
                if (!decryptedBlock) {
                    console.error("Found a login block but failed to decrypt");
                    return;
                }

                console.error(decryptedBlock);
                res.blockInfo = decryptedBlock;
            }));
        }).nThen(function (waitFor) {
            // we assume that if there is a block, it was created in a valid manner
            // so, just proceed to the next block which handles that stuff
            if (res.blockInfo) { return; }

            var opt = res.opt;

            // load the user's object using the legacy credentials
            loadUserObject(opt, waitFor(function (err, rt) {
                if (err) {
                    waitFor.abort();
                    return void cb(err);
                }

                // if a proxy is marked as deprecated, it is because someone had a non-owned drive
                // but changed their password, and couldn't delete their old data.
                // if they are here, they have entered their old credentials, so we should not
                // allow them to proceed. In time, their old drive should get deleted, since
                // it will should be pinned by anyone's drive.
                if (rt.proxy[Constants.deprecatedKey]) {
                    waitFor.abort();
                    return void cb('NO_SUCH_USER', res);
                }

                if (isRegister && isProxyEmpty(rt.proxy)) {
                    // If they are trying to register,
                    // and the proxy is empty, then there is no 'legacy user' either
                    // so we should just shut down this session and disconnect.
                    rt.network.disconnect();
                    return; // proceed to the next async block
                }

                // they tried to just log in but there's no such user
                // and since we're here at all there is no modern-block
                if (!isRegister && isProxyEmpty(rt.proxy)) {
                    rt.network.disconnect(); // clean up after yourself
                    waitFor.abort();
                    return void cb('NO_SUCH_USER', res);
                }

                // they tried to register, but those exact credentials exist
                if (isRegister && !isProxyEmpty(rt.proxy)) {
                    rt.network.disconnect();
                    waitFor.abort();
                    Feedback.send('LOGIN', true);
                    return void cb('ALREADY_REGISTERED', res);
                }

                // if you are here, then there is no block, the user is trying
                // to log in. The proxy is **not** empty. All values assigned here
                // should have been deterministically created using their credentials
                // so setting them is just a precaution to keep things in good shape
                res.proxy = rt.proxy;
                res.realtime = rt.realtime;

                // they're registering...
                res.userHash = opt.userHash;
                res.userName = uname;

                // export their signing key
                res.edPrivate = opt.edPrivate;
                res.edPublic = opt.edPublic;

                // export their encryption key
                res.curvePrivate = opt.curvePrivate;
                res.curvePublic = opt.curvePublic;

                if (shouldImport) { setMergeAnonDrive(); }

                // don't proceed past this async block.
                waitFor.abort();

                // We have to call whenRealtimeSyncs asynchronously here because in the current
                // version of listmap, onLocal calls `chainpad.contentUpdate(newValue)`
                // asynchronously.
                // The following setTimeout is here to make sure whenRealtimeSyncs is called after
                // `contentUpdate` so that we have an update userDoc in chainpad.
                setTimeout(function () {
                    Realtime.whenRealtimeSyncs(rt.realtime, function () {
                        // the following stages are there to initialize a new drive
                        // if you are registering
                        LocalStore.login(res.userHash, res.userName, function () {
                            setTimeout(function () { cb(void 0, res); });
                        });
                    });
                });
            }));
        }).nThen(function (waitFor) { // MODERN REGISTRATION / LOGIN
            var opt;
            if (res.blockInfo) {
                opt = loginOptionsFromBlock(res.blockInfo);
                userHash = res.blockInfo.User_hash;
                console.error(opt, userHash);
            } else {
                console.log("allocating random bytes for a new user object");
                opt = allocateBytes(Nacl.randomBytes(Exports.requiredBytes));
                // create a random v2 hash, since we don't need backwards compatibility
                userHash = opt.userHash = Hash.createRandomHash('drive');
                var secret = Hash.getSecrets('drive', userHash);
                opt.keys = secret.keys;
                opt.channelHex = secret.channel;
            }

            // according to the location derived from the credentials which you entered
            loadUserObject(opt, waitFor(function (err, rt) {
                if (err) {
                    waitFor.abort();
                    return void cb('MODERN_REGISTRATION_INIT');
                }

                console.error(JSON.stringify(rt.proxy));

                // export the realtime object you checked
                RT = rt;

                var proxy = rt.proxy;
                if (isRegister && !isProxyEmpty(proxy) && (!proxy.edPublic || !proxy.edPrivate)) {
                    console.error("INVALID KEYS");
                    console.log(JSON.stringify(proxy));
                    return;
                }

                res.proxy = rt.proxy;
                res.realtime = rt.realtime;

                // they're registering...
                res.userHash = userHash;
                res.userName = uname;

                // somehow they have a block present, but nothing in the user object it specifies
                // this shouldn't happen, but let's send feedback if it does
                if (!isRegister && isProxyEmpty(rt.proxy)) {
                    // this really shouldn't happen, but let's handle it anyway
                    Feedback.send('EMPTY_LOGIN_WITH_BLOCK');

                    rt.network.disconnect(); // clean up after yourself
                    waitFor.abort();
                    return void cb('NO_SUCH_USER', res);
                }

                // they tried to register, but those exact credentials exist
                if (isRegister && !isProxyEmpty(rt.proxy)) {
                    rt.network.disconnect();
                    waitFor.abort();
                    res.blockHash = blockHash;
                    if (shouldImport) {
                        setMergeAnonDrive();
                    }

                    return void cb('ALREADY_REGISTERED', res);
                }

                if (!isRegister && !isProxyEmpty(rt.proxy)) {
                    LocalStore.setBlockHash(blockHash);
                    waitFor.abort();
                    if (shouldImport) {
                        setMergeAnonDrive();
                    }
                    return void LocalStore.login(userHash, uname, function () {
                        cb(void 0, res);
                    });
                }

                if (isRegister && isProxyEmpty(rt.proxy)) {
                    proxy.edPublic = opt.edPublic;
                    proxy.edPrivate = opt.edPrivate;
                    proxy.curvePublic = opt.curvePublic;
                    proxy.curvePrivate = opt.curvePrivate;
                    proxy.login_name = uname;
                    proxy[Constants.displayNameKey] = uname;
                    setCreateReadme();
                    if (shouldImport) {
                        setMergeAnonDrive();
                    } else {
                        proxy.version = 6;
                    }

                    Feedback.send('REGISTRATION', true);
                } else {
                    Feedback.send('LOGIN', true);
                }

                setTimeout(waitFor(function () {
                    Realtime.whenRealtimeSyncs(rt.realtime, waitFor());
                }));
            }));
        }).nThen(function (waitFor) {
            require(['/common/pinpad.js'], waitFor(function (_Pinpad) {
                console.log("loaded rpc module");
                Pinpad = _Pinpad;
            }));
        }).nThen(function (waitFor) {
            // send an RPC to store the block which you created.
            console.log("initializing rpc interface");

            Pinpad.create(RT.network, RT.proxy, waitFor(function (e, _rpc) {
                if (e) {
                    waitFor.abort();
                    console.error(e); // INVALID_KEYS
                    return void cb('RPC_CREATION_ERROR');
                }
                rpc = _rpc;
                console.log("rpc initialized");
            }));
        }).nThen(function (waitFor) {
            console.log("creating request to publish a login block");

            // Finally, create the login block for the object you just created.
            var toPublish = {};

            toPublish[Constants.userNameKey] = uname;
            toPublish[Constants.userHashKey] = userHash;
            toPublish.edPublic = RT.proxy.edPublic;

            var blockRequest = Block.serialize(JSON.stringify(toPublish), res.opt.blockKeys);

            rpc.writeLoginBlock(blockRequest, waitFor(function (e) {
                if (e) { return void console.error(e); }

                console.log("blockInfo available at:", blockHash);
                LocalStore.setBlockHash(blockHash);
                LocalStore.login(userHash, uname, function () {
                    cb(void 0, res);
                });
            }));
        });
    };
    Exports.redirect = function () {
        if (sessionStorage.redirectTo) {
            var h = sessionStorage.redirectTo;
            var parser = document.createElement('a');
            parser.href = h;
            if (parser.origin === window.location.origin) {
                delete sessionStorage.redirectTo;
                window.location.href = h;
                return;
            }
        }
        window.location.href = '/drive/';
    };

    var hashing;
    Exports.loginOrRegisterUI = function (uname, passwd, isRegister, shouldImport, testing, test) {
        if (hashing) { return void console.log("hashing is already in progress"); }
        hashing = true;

        var proceed = function (result) {
            hashing = false;
            if (test && typeof test === "function" && test()) { return; }
            Realtime.whenRealtimeSyncs(result.realtime, function () {
                Exports.redirect();
            });
        };

        // setTimeout 100ms to remove the keyboard on mobile devices before the loading screen
        // pops up
        window.setTimeout(function () {
            UI.addLoadingScreen({
                loadingText: Messages.login_hashing,
                hideTips: true,
            });

            // We need a setTimeout(cb, 0) otherwise the loading screen is only displayed
            // after hashing the password
            window.setTimeout(function () {
                Exports.loginOrRegister(uname, passwd, isRegister, shouldImport, function (err, result) {
                    var proxy;
                    if (result) { proxy = result.proxy; }

                    if (err) {
                        switch (err) {
                            case 'NO_SUCH_USER':
                                UI.removeLoadingScreen(function () {
                                    UI.alert(Messages.login_noSuchUser, function () {
                                        hashing = false;
                                    });
                                });
                                break;
                            case 'INVAL_USER':
                                UI.removeLoadingScreen(function () {
                                    UI.alert(Messages.login_invalUser, function () {
                                        hashing = false;
                                    });
                                });
                                break;
                            case 'INVAL_PASS':
                                UI.removeLoadingScreen(function () {
                                    UI.alert(Messages.login_invalPass, function () {
                                        hashing = false;
                                    });
                                });
                                break;
                            case 'PASS_TOO_SHORT':
                                UI.removeLoadingScreen(function () {
                                    var warning = Messages._getKey('register_passwordTooShort', [
                                        Cred.MINIMUM_PASSWORD_LENGTH
                                    ]);
                                    UI.alert(warning, function () {
                                        hashing = false;
                                    });
                                });
                                break;
                            case 'ALREADY_REGISTERED':
                                UI.removeLoadingScreen(function () {
                                    UI.confirm(Messages.register_alreadyRegistered, function (yes) {
                                        if (!yes) {
                                            hashing = false;
                                            return;
                                        }
                                        proxy.login_name = uname;

                                        if (!proxy[Constants.displayNameKey]) {
                                            proxy[Constants.displayNameKey] = uname;
                                        }
                                        LocalStore.eraseTempSessionValues();


                                        if (result.blockHash) {
                                            LocalStore.setBlockHash(result.blockHash);
                                        }

                                        LocalStore.login(result.userHash, result.userName, function () {
                                            setTimeout(function () { proceed(result); });
                                        });
                                    });
                                });
                                break;
                            default: // UNHANDLED ERROR
                                hashing = false;
                                UI.errorLoadingScreen(Messages.login_unhandledError);
                        }
                        return;
                    }

                    if (testing) { return void proceed(result); }

                    if (!(proxy.curvePrivate && proxy.curvePublic &&
                          proxy.edPrivate && proxy.edPublic)) {

                        console.log("recovering derived public/private keypairs");
                        // **** reset keys ****
                        proxy.curvePrivate = result.curvePrivate;
                        proxy.curvePublic  = result.curvePublic;
                        proxy.edPrivate    = result.edPrivate;
                        proxy.edPublic     = result.edPublic;
                    }

                    setTimeout(function () {
                        Realtime.whenRealtimeSyncs(result.realtime, function () {
                            proceed(result);
                        });
                    });
                });
            }, 500);
        }, 200);
    };

    return Exports;
});
