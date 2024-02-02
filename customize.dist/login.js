// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    'chainpad-listmap',
    '/components/chainpad-crypto/crypto.js',
    '/common/common-util.js',
    '/common/outer/network-config.js',
    '/common/common-login.js',
    '/common/common-credential.js',
    '/components/chainpad/chainpad.dist.js',
    '/common/common-realtime.js',
    '/common/common-constants.js',
    '/common/common-interface.js',
    '/common/common-feedback.js',
    '/common/hyperscript.js',
    '/common/outer/local-store.js',
    '/customize/messages.js',
    '/components/nthen/index.js',
    '/common/outer/login-block.js',
    '/common/common-hash.js',
    '/common/outer/http-command.js',

    '/components/tweetnacl/nacl-fast.min.js',
    '/components/scrypt-async/scrypt-async.min.js', // better load speed
], function ($, Listmap, Crypto, Util, NetConfig, Login, Cred, ChainPad, Realtime, Constants, UI,
            Feedback, h, LocalStore, Messages, nThen, Block, Hash, ServerCommand) {
    var Exports = {
        Cred: Cred,
        Block: Block,
        // this is depended on by non-customizable files
        // be careful when modifying login.js
        requiredBytes: Login.requiredBytes,
    };

    var Nacl = window.nacl;

    var redirectTo = '/drive/';
    var setRedirectTo = function () {
        var parsed = Hash.parsePadUrl(window.location.href);
        if (parsed.hashData && parsed.hashData.newPadOpts) {
            var newPad = Hash.decodeDataOptions(parsed.hashData.newPadOpts);
            redirectTo = newPad.href;
        }
    };
    if (window.location.hash) { setRedirectTo(); }

    Exports.ssoAuth = function (provider, cb) {
        var keys = Nacl.sign.keyPair();
        var inviteToken = window.location.hash.slice(1);
        localStorage.CP_sso_auth = JSON.stringify({
            s: Nacl.util.encodeBase64(keys.secretKey),
            p: Nacl.util.encodeBase64(keys.publicKey),
            token: inviteToken
        });
        ServerCommand(keys, {
            command: 'SSO_AUTH',
            provider: provider,
            register: true
        }, cb);
    };
    Exports.ssoLogin = function () {

    };

    Exports.allocateBytes = Login.allocateBytes;
    Exports.loadUserObject = Login.loadUserObject;

    var setMergeAnonDrive = function (value) {
        Exports.mergeAnonDrive = Boolean(value);
    };

    Exports.redirect = function () {
        if (redirectTo) {
            var h = redirectTo;
            var loginOpts = {};
            if (Exports.mergeAnonDrive) {
                loginOpts.mergeAnonDrive = 1;
            }
            h = Hash.getLoginURL(h, loginOpts);

            var parser = document.createElement('a');
            parser.href = h;
            if (parser.origin === window.location.origin) {
                window.location.href = h;
                return;
            }
        }
        window.location.href = '/drive/';
    };

    var hashing;

    Exports.loginOrRegisterUI = function (config) {
        let { uname, token, shouldImport, cb } = config;
        if (hashing) { return void console.log("hashing is already in progress"); }
        hashing = true;

        setMergeAnonDrive(shouldImport);

        var proceed = function (result) {
            hashing = false;
            if (cb && typeof cb === "function" && cb(result)) { return; }
            LocalStore.clearLoginToken();
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
                Login.loginOrRegister(config, function (err, result) {
                    var proxy = {};
                    if (result) { proxy = result.proxy; }

                    if (err) {
                        console.warn(err);
                        switch (err) {
                            case 'NO_SUCH_USER':
                                UI.removeLoadingScreen(function () {
                                    UI.alert(Messages.login_noSuchUser, function () {
                                        hashing = false;
                                        $('#password').focus();
                                    });
                                });
                                break;
                            case 'INVAL_USER':
                                UI.removeLoadingScreen(function () {
                                    UI.alert(Messages.login_notFilledUser , function () {
                                        hashing = false;
                                        $('#password').focus();
                                    });
                                });
                                break;
/*
                            case 'HAS_PLACEHOLDER':
                                UI.errorLoadingScreen('UNAVAILABLE', true, true);
                                break;
*/
                            case 'DELETED_USER':
                                UI.errorLoadingScreen(
                                    UI.getDestroyedPlaceholder(result.reason, true), true, () => {
                                        window.location.reload();
                                    });
                                break;
                            case 'INVAL_PASS':
                                UI.removeLoadingScreen(function () {
                                    UI.alert(Messages.login_notFilledPass, function () {
                                        hashing = false;
                                        $('#password').focus();
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
                                        $('#password').focus();
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

                                        var block = result.blockHash;
                                        var user = block ? undefined : result.userHash;
                                        LocalStore.login(user, block, result.userName, function () {
                                            setTimeout(function () { proceed(result); });
                                        });
                                    });
                                });
                                break;
                            case 'E_RESTRICTED':
                                if (token) {
                                    return UI.errorLoadingScreen(Messages.register_invalidToken);
                                }
                                UI.errorLoadingScreen(Messages.register_registrationIsClosed);
                                break;
                            default: // UNHANDLED ERROR
                                hashing = false;
                                UI.errorLoadingScreen(Messages.login_unhandledError);
                        }
                        return;
                    }

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
