// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/components/nthen/index.js',
    '/api/config',
    '/common/requireconfig.js',
    '/customize/messages.js',
    'jquery',
], function (nThen, ApiConfig, RequireConfig, Messages, $) {
    var common = {};

    var embeddableApps = [
        'code',
        'form',
        'kanban',
        'pad',
        'slide',
        'whiteboard',
        'integration'
    ].map(function (x) {
        return `/${x}/`;
    });

    common.initIframe = function (waitFor, isRt, pathname) {
        if (window.top !== window) {
            // this is triggered if the intance's HTTP headers have permitted the app
            // to be loaded within an iframe, but the instance admin has not explicitly
            // enabled embedding via the admin panel. Their checkup page should tell them
            // how to correct this (Access-Control-Allow-Origin and CSP frame-ancestors).
            if (!ApiConfig.enableEmbedding) {
                return void window.alert(Messages.error_embeddingDisabled);
            }
            // even where embedding is not forbidden it should still be limited
            // to apps that are explicitly permitted
            if (!embeddableApps.includes(window.location.pathname)) {
                return void window.alert(Messages.error_embeddingDisabledSpecific);
            }
        }
        // this is triggered in two situations:
        // 1. a user has somehow loaded the page via an unexpected origin
        // 2. the admin has configured their httpUnsafeOrigin incorrectly
        // in case #2 the checkup page will advise them on correct configuration
        if (window.location.origin !== ApiConfig.httpUnsafeOrigin) {
            return void window.alert(Messages._getKey('error_incorrectAccess', [ApiConfig.httpUnsafeOrigin]));
        }

        var requireConfig = RequireConfig();
        var lang = Messages._languageUsed;
        var themeKey = 'CRYPTPAD_STORE|colortheme';
        var req = {
            cfg: requireConfig,
            req: [ '/common/loading.js' ],
            pfx: window.location.origin,
            theme: localStorage[themeKey],
            themeOS: localStorage[themeKey+'_default'],
            lang: lang,
            time: window.CP_preloadingTime
        };
        window.rc = requireConfig;
        window.apiconf = ApiConfig;

        var hash, href;
        if (isRt) {
            // Hidden hash
            hash = window.location.hash;
            href = window.location.href;
            if (window.history && window.history.replaceState && hash) {
                window.history.replaceState({}, window.document.title, '#');
            }
        }


        var $i = $('<iframe>').attr('id', 'sbox-iframe').attr('src',
            ApiConfig.httpSafeOrigin + (pathname || window.location.pathname) + 'inner.html?' +
                requireConfig.urlArgs + '#' + encodeURIComponent(JSON.stringify(req)));
        $i.attr('allowfullscreen', 'true');
        $i.attr('allow', 'clipboard-write');
        $i.attr('title', 'iframe');
        $('iframe-placeholder').after($i).remove();

        // This is a cheap trick to avoid loading sframe-channel in parallel with the
        // loading screen setup.
        var done = waitFor();
        var onMsg = function (msg) {
            var data = typeof(msg.data) === "string" ? JSON.parse(msg.data) : msg.data;
            if (!data || data.q !== 'READY') { return; }
            window.removeEventListener('message', onMsg);
            var _done = done;
            done = function () { };
            _done();
        };
        window.addEventListener('message', onMsg);

        return {
            hash: hash,
            href: href
        };
    };

    common.start = function (cfg) {
        cfg = cfg || {};
        var realtime = !cfg.noRealtime;
        var secret;
        var hashes;
        var isNewFile;
        var CpNfOuter;
        var Cryptpad;
        var Crypto;
        var Cryptget;
        var SFrameChannel;
        var sframeChan;
        var SecureIframe;
        var UnsafeIframe;
        var OOIframe;
        var Notifier;
        var Utils = {
            nThen: nThen
        };
        var AppConfig;
        //var Test;
        var password, newPadPassword, newPadPasswordForce;
        var initialPathInDrive;
        var burnAfterReading;

        var currentPad = window.CryptPad_location = {
            app: '',
            href: cfg.href || window.location.href,
            hash: cfg.hash || window.location.hash
        };

        nThen(function (waitFor) {
            // Load #2, the loading screen is up so grab whatever you need...
            require([
                '/common/sframe-chainpad-netflux-outer.js',
                '/common/cryptpad-common.js',
                '/components/chainpad-crypto/crypto.js',
                '/common/cryptget.js',
                '/common/outer/worker-channel.js',
                '/secureiframe/main.js',
                '/unsafeiframe/main.js',
                '/common/onlyoffice/ooiframe.js',
                '/common/common-notifier.js',
                '/common/common-hash.js',
                '/common/common-util.js',
                '/common/common-realtime.js',
                '/common/notify.js',
                '/common/common-constants.js',
                '/common/common-feedback.js',
                '/common/outer/local-store.js',
                '/common/outer/login-block.js',
                '/common/outer/cache-store.js',
                '/customize/application_config.js',
                //'/common/test.js',
                '/common/userObject.js',
                'optional!/api/instance',
                '/common/pad-types.js',
            ], waitFor(function (_CpNfOuter, _Cryptpad, _Crypto, _Cryptget, _SFrameChannel,
            _SecureIframe, _UnsafeIframe, _OOIframe, _Notifier, _Hash, _Util, _Realtime, _Notify,
            _Constants, _Feedback, _LocalStore, _Block, _Cache, _AppConfig, /* _Test,*/ _UserObject,
            _Instance, _PadTypes) {
                CpNfOuter = _CpNfOuter;
                Cryptpad = _Cryptpad;
                Crypto = Utils.Crypto = _Crypto;
                Cryptget = _Cryptget;
                SFrameChannel = _SFrameChannel;
                SecureIframe = _SecureIframe;
                UnsafeIframe = _UnsafeIframe;
                OOIframe = _OOIframe;
                Notifier = _Notifier;
                Utils.Hash = _Hash;
                Utils.Util = _Util;
                Utils.Realtime = _Realtime;
                Utils.Constants = _Constants;
                Utils.Feedback = _Feedback;
                Utils.LocalStore = _LocalStore;
                Utils.Cache = _Cache;
                Utils.UserObject = _UserObject;
                Utils.Notify = _Notify;
                Utils.currentPad = currentPad;
                Utils.Instance = _Instance;
                Utils.Block = _Block;
                Utils.PadTypes = _PadTypes;
                AppConfig = _AppConfig;
                //Test = _Test;

                if (localStorage.CRYPTPAD_URLARGS !== ApiConfig.requireConf.urlArgs) {
                    console.log("New version, flushing cache");
                    Object.keys(localStorage).forEach(function (k) {
                        if (k.indexOf('CRYPTPAD_CACHE|') !== 0) { return; }
                        delete localStorage[k];
                    });
                    localStorage.CRYPTPAD_URLARGS = ApiConfig.requireConf.urlArgs;
                }
                var cache = window.cpCache = {};
                var localStore = window.localStore = {};
                Object.keys(localStorage).forEach(function (k) {
                    if (k.indexOf('CRYPTPAD_CACHE|') === 0) {
                        cache[k.slice(('CRYPTPAD_CACHE|').length)] = localStorage[k];
                        return;
                    }
                    if (k.indexOf('CRYPTPAD_STORE|') === 0) {
                        localStore[k.slice(('CRYPTPAD_STORE|').length)] = localStorage[k];
                        return;
                    }
                });

                // The inner iframe tries to get some data from us every ms (cache, store...).
                // It will send a "READY" message and wait for our answer with the correct txid.
                // First, we have to answer to this message, otherwise we're going to block
                // sframe-boot.js. Then we can start the channel.
                var msgEv = _Util.mkEvent();
                var iframe = $('#sbox-iframe')[0].contentWindow;
                var postMsg = function (data) {
                    try {
                        iframe.postMessage(data, ApiConfig.httpSafeOrigin || window.location.origin);
                    } catch (err) {
                        console.error(err, data);
                        if (data && data.error && data.error instanceof Error) {
                            data.error = _Util.serializeError(data.error);
                            try {
                                iframe.postMessage(data, '*');
                            } catch (err2) {
                                console.error("impossible serialization");
                                throw err2;
                            }
                        } else {
                             throw err;
                        }
                    }
                };

                var addFirstHandlers = () => {
                    sframeChan.on('Q_SETTINGS_CHECK_PASSWORD', function (data, cb) {
                        var blockHash = Utils.LocalStore.getBlockHash();
                        var userHash = Utils.LocalStore.getUserHash();
                        var correct = (blockHash && blockHash === data.blockHash) ||
                                      (!blockHash && userHash === data.userHash);
                        cb({correct: correct});
                    });
                    sframeChan.on('Q_SETTINGS_TOTP_SETUP', function (obj, cb) {
                        require([
                            '/common/outer/http-command.js',
                        ], function (ServerCommand) {
                            var data = obj.data;
                            data.command = 'TOTP_SETUP';
                            data.session = Utils.LocalStore.getSessionToken();
                            ServerCommand(obj.key, data, function (err, response) {
                                cb({ success: Boolean(!err && response && response.bearer) });
                                if (response && response.bearer) {
                                    Utils.LocalStore.setSessionToken(response.bearer);
                                }
                            });
                        });
                    });
                    sframeChan.on('Q_SETTINGS_TOTP_REVOKE', function (obj, cb) {
                        require([
                            '/common/outer/http-command.js',
                        ], function (ServerCommand) {
                            ServerCommand(obj.key, obj.data, function (err, response) {
                                cb({ success: Boolean(!err && response && response.success) });
                                if (response && response.success) {
                                    Utils.LocalStore.setSessionToken('');
                                }
                            });
                        });
                    });
                    sframeChan.on('Q_SETTINGS_GET_SSO_SEED', function (obj, _cb) {
                        var cb = Utils.Util.mkAsync(_cb);
                        cb({
                            seed: Utils.LocalStore.getSSOSeed()
                        });
                    });
                    Cryptpad.loading.onMissingMFAEvent.reg((data) => {
                        var cb = data.cb;
                        if (!sframeChan) { return void cb('EINVAL'); }
                        sframeChan.query('Q_LOADING_MISSING_AUTH', {
                            accountName: Utils.LocalStore.getAccountName(),
                            origin: window.location.origin,
                        }, (err, obj) => {
                            if (obj && obj.state) { return void cb(true); }
                            console.error(err || obj);
                        });
                    });
                };

                var whenReady = waitFor(function (msg) {
                    if (msg.source !== iframe) { return; }
                    var data = typeof(msg.data) === "string" ? JSON.parse(msg.data) : msg.data;
                    if (!data || !data.txid) { return; }
                    // Remove the listener once we've received the READY message
                    window.removeEventListener('message', whenReady);
                    // Answer with the requested data
                    postMsg(JSON.stringify({ txid: data.txid, cache: cache, localStore: localStore, language: Cryptpad.getLanguage() }));

                    // Then start the channel
                    window.addEventListener('message', function (msg) {
                        if (msg.source !== iframe) { return; }
                        msgEv.fire(msg);
                    });
                    SFrameChannel.create(msgEv, postMsg, waitFor(function (sfc) {
                        Utils.sframeChan = sframeChan = sfc;
                        addFirstHandlers();
                        window.CryptPad_loadingError = function (e) {
                            sfc.event('EV_LOADING_ERROR', e);
                        };
                    }));
                });
                window.addEventListener('message', whenReady);

                Cryptpad.loading.onDriveEvent.reg(function (data) {
                    if (sframeChan) { sframeChan.event('EV_LOADING_INFO', data); }
                });

                try {
                    var parsed = Utils.Hash.parsePadUrl(currentPad.href);
                    var options = parsed.getOptions();
                    if (options.loginOpts) {
                        var loginOpts = Utils.Hash.decodeDataOptions(options.loginOpts);
                        if (loginOpts.mergeAnonDrive) { Cryptpad.migrateAnonDrive = true; }
                        // Remove newPadOpts from the hash
                        delete options.loginOpts;
                        currentPad.href = parsed.getUrl(options);
                        currentPad.hash = parsed.hashData.getHash ? parsed.hashData.getHash(options)
                                                                  : '';
                    }
                } catch (e) { console.error(e); }


                // NOTE: Driveless mode should only work for existing pads, but we can't check that
                // before creating the worker because we need the anon RPC to do so.
                // We're only going to check if a hash exists in the URL or not.
                Cryptpad.ready(waitFor((err) => {
                    if (err) {
                        waitFor.abort();
                        if (err.code === 404) {
                            sframeChan.on('EV_SET_LOGIN_REDIRECT', function (page) {
                                var href = Utils.Hash.hashToHref('', page);
                                var url = Utils.Hash.getNewPadURL(href, { href: currentPad.href });
                                window.location.href = url;
                            });
                            return void sframeChan.event("EV_DRIVE_DELETED", err.reason);
                        }
                        sframeChan.event('EV_LOADING_ERROR', 'ACCOUNT');
                    }
                }), {
                    noDrive: cfg.noDrive && AppConfig.allowDrivelessMode && currentPad.hash,
                    neverDrive: cfg.integration,
                    driveEvents: cfg.driveEvents,
                    cache: Boolean(cfg.cache),
                    currentPad: currentPad,
                });

                // Remove the login hash if needed
                if (window.history && window.history.replaceState && (currentPad.hash || window.location.hash)) {
                    var nHash = currentPad.hash;
                    if (!/^#/.test(nHash)) { nHash = '#' + nHash; }
                    window.history.replaceState({}, window.document.title, nHash);
                }
            }));
        }).nThen(function (waitFor) {
            if (!Utils.Hash.isValidHref(window.location.href)) {
                waitFor.abort();
                return void sframeChan.event('EV_LOADING_ERROR', 'INVALID_HASH');
            }

            $('#sbox-iframe').focus();

            sframeChan.on('EV_CACHE_PUT', function (x) {
                Object.keys(x).forEach(function (k) {
                    try {
                        localStorage['CRYPTPAD_CACHE|' + k] = x[k];
                    } catch (err) {
                        console.error(err);
                    }
                });
            });
            sframeChan.on('EV_LOCALSTORE_PUT', function (x) {
                Object.keys(x).forEach(function (k) {
                    if (typeof(x[k]) === "undefined") {
                        delete localStorage['CRYPTPAD_STORE|' + k];
                        return;
                    }
                    try {
                        localStorage['CRYPTPAD_STORE|' + k] = x[k];
                    } catch (err) {
                        console.error(err);
                    }
                });
            });

            var parsed = Utils.Hash.parsePadUrl(currentPad.href);
            burnAfterReading = parsed && parsed.hashData && parsed.hashData.ownerKey;

            currentPad.app = parsed.type;
            if (cfg.getSecrets) {
                var w = waitFor();
                // No password for drive, profile and todo
                cfg.getSecrets(Cryptpad, Utils, waitFor(function (err, s) {
                    secret = Utils.secret = s;
                    Cryptpad.getShareHashes(secret, function (err, h) {
                        hashes = h;
                        w();
                    });
                }));
            } else {
                var todo = function () {
                    secret = Utils.secret = Utils.Hash.getSecrets(parsed.type, parsed.hash, password);
                    Cryptpad.getShareHashes(secret, waitFor(function (err, h) {
                        hashes = h;
                        // Update the rendered hash and the full hash with the "password" settings
                        if (password && !parsed.hashData.password) {
                            var opts = parsed.getOptions();
                            opts.password = true;

                            // Full hash
                            currentPad.href = parsed.getUrl(opts);
                            if (parsed.hashData) {
                                currentPad.hash = parsed.hashData.getHash(opts);
                            }
                            // Rendered (maybe hidden) hash
                            var renderedParsed = Utils.Hash.parsePadUrl(window.location.href);
                            Cryptpad.setTabHref(renderedParsed.getUrl(opts));
                        }
                    }));
                };

                if (sessionStorage.CP_formExportSheet && parsed.type === 'sheet') {
                    try {
                        Cryptpad.fromContent = JSON.parse(sessionStorage.CP_formExportSheet);
                    } catch (e) { console.error(e); }
                    delete sessionStorage.CP_formExportSheet;
                }

                // New integrated pad
                if (cfg.initialState) {
                    currentPad.href = cfg.href;
                    currentPad.hash = cfg.hash;
                    return void todo();
                }

                // New pad options
                var options = parsed.getOptions();
                if (options.newPadOpts) {
                    try {
                        var newPad = Utils.Hash.decodeDataOptions(options.newPadOpts);
                        Cryptpad.initialTeam = newPad.t;
                        Cryptpad.initialPath = newPad.p;
                        if (newPad.pw) {
                            try {
                                var uHash = Utils.LocalStore.getBlockHash();
                                var uSecret = Utils.Block.parseBlockHash(uHash);
                                var uKey = uSecret.keys.symmetric;
                                newPadPassword = Crypto.decrypt(newPad.pw, uKey);
                            } catch (e) { console.error(e); }
                        }
                        if (newPad.f) { newPadPasswordForce = 1; }
                        if (newPad.d) {
                            Cryptpad.fromFileData = newPad.d;
                            var _parsed1 = Utils.Hash.parsePadUrl(Cryptpad.fromFileData.href);
                            if (_parsed1.hashData.type === 'pad' &&  _parsed1.type !== parsed.type) {
                                delete Cryptpad.fromFileData;
                            }
                        }

                    } catch (e) {
                        console.error(e, parsed.hashData.newPadOpts);
                    }
                    delete options.newPadOpts;

                    currentPad.href = parsed.getUrl(options);
                    currentPad.hash = parsed.hashData.getHash ? parsed.hashData.getHash(options)
                                                              : '';
                    var version = parsed.hashData.version;
                    parsed = Utils.Hash.parsePadUrl(currentPad.href);
                    Cryptpad.setTabHash(currentPad.hash);

                    // If it's a new pad, don't check password
                    if (version === 4) {
                        return void todo();
                    }
                    // Otherwise, continue
                }
                // FIXME Backward compatibility
                if (sessionStorage.newPadPassword && !newPadPassword) {
                    newPadPassword = sessionStorage.newPadPassword;
                    delete sessionStorage.newPadPassword;
                }


                if (!parsed.hashData) { // No hash, no need to check for a password
                    return void todo();
                }

                var isViewer = parsed.hashData.mode === 'view';

                // We now need to check if there is a password and if we know the correct password.
                // We'll use getFileSize and hasChannelHistory to detect incorrect passwords.

                // First we'll get the password value from our drive (getPadAttribute), and we'll check
                // if the channel is valid. If the pad is not stored in our drive, we'll test with an
                // empty password instead.

                // If this initial check returns a valid channel, open the pad.
                // If the channel is invalid:
                // Option 1: this is a password-protected pad not stored in our drive --> password prompt
                // Option 2: this is a pad stored in our drive
                //        2a: 'edit' pad or file --> password-prompt
                //        2b: 'view' pad no '/p/' --> the seed is incorrect
                //        2c: 'view' pad and '/p/' and a wrong password stored --> the seed is incorrect
                //        2d: 'view' pad and '/p/' and password never stored (security feature) --> password-prompt

                var askPassword = function (wrongPasswordStored, cfg) {
                    // Ask for the password and check if the pad exists
                    // If the pad doesn't exist, it means the password isn't correct
                    // or the pad has been deleted
                    var correctPassword = waitFor();
                    sframeChan.on('Q_PAD_PASSWORD_VALUE', function (data, cb) {
                        password = data;
                        var next = function (e, isNew) {
                            if (Boolean(isNew)) {
                                // Ask again in the inner iframe
                                // We should receive a new Q_PAD_PASSWORD_VALUE
                                cb({
                                    state: false,
                                    view: isViewer,
                                    reason: e
                                });
                            } else {
                                todo();
                                if (wrongPasswordStored) {
                                    // Store the correct password
                                    nThen(function (w) {
                                        Cryptpad.setPadAttribute('password', password, w(), parsed.getUrl());
                                        Cryptpad.setPadAttribute('channel', secret.channel, w(), parsed.getUrl());
                                        if (parsed.hashData.mode === 'edit') {
                                            var href = window.location.pathname + '#' + Utils.Hash.getEditHashFromKeys(secret);
                                            Cryptpad.setPadAttribute('href', href, w(), parsed.getUrl());
                                            var roHref = window.location.pathname + '#' + Utils.Hash.getViewHashFromKeys(secret);
                                            Cryptpad.setPadAttribute('roHref', roHref, w(), parsed.getUrl());
                                        }
                                    }).nThen(correctPassword);
                                } else {
                                    correctPassword();
                                }
                                cb({
                                    state: true
                                });
                            }
                        };
                        if (parsed.type === "file") {
                            // `hasChannelHistory` doesn't work for files (not a channel)
                            // `getFileSize` is not adapted to channels because of metadata
                            Cryptpad.getFileSize(currentPad.href, password, function (e, size) {
                                if (e && e !== "PASSWORD_CHANGE") {
                                    return sframeChan.event("EV_DELETED_ERROR", e);
                                }
                                next(e, size === 0);
                            });
                            return;
                        }
                        // Not a file, so we can use `hasChannelHistory`
                        Cryptpad.hasChannelHistory(currentPad.href, password, (e, isNew, reason) => {
                            if (isNew && reason && reason !== "PASSWORD_CHANGE") {
                                return sframeChan.event("EV_DELETED_ERROR", reason);
                            }
                            next(reason, isNew);
                        });
                    });
                    sframeChan.event("EV_PAD_PASSWORD", cfg);
                };

                var done = waitFor();
                var stored = false;
                var passwordCfg = {
                    value: ''
                };

                // Hidden hash: can't find the channel in our drives: abort
                var noPadData = function (err) {
                    sframeChan.event("EV_PAD_NODATA", err);
                };

                var newHref;
                var expire;
                nThen(function (w) {
                    // If we're using an unsafe link, get pad attribute
                    if (parsed.hashData.key || !parsed.hashData.channel) {
                        Cryptpad.getPadAttribute('expire', w(function (err, data) {
                            if (err) { return; }
                            expire = data;
                        }));
                        return;
                    }
                    // Otherwise, get pad data from channel id
                    var edit = parsed.hashData.mode === 'edit';
                    Cryptpad.getPadDataFromChannel({
                        channel: parsed.hashData.channel,
                        edit: edit,
                        file: parsed.hashData.type === 'file'
                    }, w(function (err, res) {
                        // Error while getting data? abort
                        if (err || !res || res.error) {
                            w.abort();
                            return void noPadData(err || (!res ? 'EINVAL' : res.error));
                        }
                        // No data found? abort
                        if (!Object.keys(res).length) {
                            w.abort();
                            return void noPadData('NO_RESULT');
                        }
                        // Data found but weaker? warn
                        expire = res.expire;
                        if (edit && !res.href) {
                            newHref = res.roHref;
                            return;
                        }
                        // We have good data, keep the hash in memory
                        newHref = edit ? res.href : (res.roHref || res.href);
                    }));
                }).nThen(function (w) {
                    if (newHref) {
                        // Get the options (embed, present, etc.) of the hidden hash
                        // Use the same options in the full hash
                        var opts = parsed.getOptions();
                        parsed = Utils.Hash.parsePadUrl(newHref);
                        currentPad.href = parsed.getUrl(opts);
                        currentPad.hash = parsed.hashData && parsed.hashData.getHash(opts);
                    }
                    Cryptpad.getPadAttribute('channel', w(function (err, data) {
                        stored = (!err && typeof (data) === "string");
                    }));
                    Cryptpad.getPadAttribute('password', w(function (err, val) {
                        password = val;
                    }), parsed.getUrl());
                }).nThen(function (w) {
                    // If we've already tested this password and this is a redirect, force
                    if (typeof(newPadPassword) !== "undefined" && newPadPasswordForce) {
                        password = newPadPassword;
                        return void todo();
                    }

                    // If the pad is not stored and we have a newPadPassword, it probably
                    // comes from a notification: password prompt pre-filled
                    if (!password && !stored && newPadPassword) {
                        passwordCfg.value = newPadPassword;
                    }

                    // Pad not stored && password required: always ask for the password
                    if (!stored && parsed.hashData.password && !newPadPasswordForce) {
                        return void askPassword(true, passwordCfg);
                    }

                    if (parsed.type === "file") {
                        // `hasChannelHistory` doesn't work for files (not a channel)
                        // `getFileSize` is not adapted to channels because of metadata
                        Cryptpad.getFileSize(currentPad.href, password, w(function (e, size) {
                            if (e && e !== "PASSWORD_CHANGE") {
                                sframeChan.event("EV_DELETED_ERROR", e);
                                waitFor.abort();
                                return;
                            }
                            if (!e && size !== 0) { return void todo(); }
                            // Wrong password or deleted file?
                            passwordCfg.legacy = !e; // Legacy means we don't know if it's a deletion or pw change
                            askPassword(true, passwordCfg);
                        }));
                        return;
                    }
                    // Not a file, so we can use `hasChannelHistory`
                    Cryptpad.hasChannelHistory(currentPad.href, password, w(function(e, isNew, reason) {
                        if (isNew && expire && expire < (+new Date())) {
                            sframeChan.event("EV_EXPIRED_ERROR");
                            waitFor.abort();
                            return;
                        }
                        if (!e && !isNew) { return void todo(); }
                        // NOTE: Legacy mode ==> no reason may indicate a password change
                        if (isNew && reason && (reason !== "PASSWORD_CHANGE" || isViewer)) {
                            sframeChan.event("EV_DELETED_ERROR", {
                                reason: reason,
                                viewer: isViewer
                            });
                            waitFor.abort();
                            return;
                        }
                        if (isViewer && (password || !parsed.hashData.password)) {
                            // Error, wrong password stored, the view seed has changed with the password
                            // password will never work
                            sframeChan.event("EV_PAD_PASSWORD_ERROR");
                            waitFor.abort();
                            return;
                        }
                        // Wrong password or deleted file?
                        passwordCfg.legacy = !reason; // Legacy means we don't know if it's a deletion or pw change
                        askPassword(true, passwordCfg);
                    }));
                }).nThen(done);
            }
        }).nThen(function (waitFor) {
            if (!burnAfterReading) { return; }

            // This is a burn after reading URL: make sure our owner key is still valid
            try {
                var publicKey = Utils.Hash.getSignPublicFromPrivate(burnAfterReading);
                Cryptpad.getPadMetadata({
                    channel: secret.channel
                }, waitFor(function (md) {
                    if (md && md.error) { return console.error(md.error); }
                    // If our key is not valid anymore, don't show BAR warning
                    if (!(md && Array.isArray(md.owners)) || md.owners.indexOf(publicKey) === -1) {
                        burnAfterReading = null;
                    }
                }));
            } catch (e) {
                console.error(e);
            }
        }).nThen(function (waitFor) {
            if (cfg.afterSecrets) {
                cfg.afterSecrets(Cryptpad, Utils, secret, waitFor(), sframeChan);
            }
        }).nThen(function (waitFor) {
            // Check if the pad exists on server
            if (!currentPad.hash) { isNewFile = true; return; }

            if (realtime) {
                // TODO we probably don't need to check again for password-protected pads
                Cryptpad.hasChannelHistory(currentPad.href, password, waitFor(function (e, isNew) {
                    if (e) { return console.error(e); }
                    isNewFile = Boolean(isNew);
                }));
            }
        }).nThen(function () {
            var readOnly = secret.keys && !secret.keys.editKeyStr;
            var isNewHash = true;
            if (!secret.keys) {
                isNewHash = false;
                secret.keys = secret.key;
                readOnly = false;
            }
            Utils.crypto = Utils.Crypto.createEncryptor(Utils.secret.keys);
            var parsed = Utils.Hash.parsePadUrl(currentPad.href);
            if (!parsed.type) { throw new Error(); }
            var defaultTitle = Utils.UserObject.getDefaultName(parsed);
            var edPublic, curvePublic, notifications, isTemplate;
            var settings = {};
            var isSafe = ['debug', 'profile', 'drive', 'teams', 'calendar', 'file'].indexOf(currentPad.app) !== -1;
            var isOO = ['sheet', 'doc', 'presentation'].indexOf(parsed.type) !== -1;
            var ooDownloadData = {};

            var isDeleted = isNewFile && currentPad.hash.length > 0;
            if (isDeleted) {
                Utils.Cache.clearChannel(secret.channel);
            }

            var updateMeta = function () {
                //console.log('EV_METADATA_UPDATE');
                var metaObj;
                nThen(function (waitFor) {
                    Cryptpad.getMetadata(waitFor(function (err, m) {
                        if (err) {
                            waitFor.abort();
                            return void console.log(err);
                        }
                        metaObj = m;
                        edPublic = metaObj.priv.edPublic; // needed to create an owned pad
                        curvePublic = metaObj.user.curvePublic;
                        notifications = metaObj.user.notifications;
                        settings = metaObj.priv.settings;
                    }));
                    if (typeof(isTemplate) === "undefined") {
                        Cryptpad.isTemplate(currentPad.href, waitFor(function (err, t) {
                            if (err) { console.log(err); }
                            isTemplate = t;
                        }));
                    }
                }).nThen(function (/*waitFor*/) {
                    metaObj.doc = {
                        defaultTitle: defaultTitle,
                        type: cfg.type || parsed.type
                    };
                    var notifs = Utils.Notify.isSupported() && Utils.Notify.hasPermission();
                    var additionalPriv = {
                        app: parsed.type,
                        loggedIn: Utils.LocalStore.isLoggedIn(),
                        origin: window.location.origin,
                        pathname: window.location.pathname,
                        fileHost: ApiConfig.fileHost,
                        readOnly: readOnly,
                        isTemplate: isTemplate,
                        newTemplate: Array.isArray(Cryptpad.initialPath)
                                        && Cryptpad.initialPath[0] === "template",
                        feedbackAllowed: Utils.Feedback.state,
                        prefersDriveRedirect: Utils.LocalStore.getDriveRedirectPreference(),
                        isPresent: parsed.hashData && parsed.hashData.present,
                        isEmbed: parsed.hashData && parsed.hashData.embed || cfg.integration,
                        isTop: window.top === window,
                        canEdit: Boolean(hashes && hashes.editHash),
                        oldVersionHash: parsed.hashData && parsed.hashData.version < 2, // password
                        isHistoryVersion: parsed.hashData && parsed.hashData.versionHash,
                        notifications: notifs,
                        accounts: {
                            donateURL: Cryptpad.donateURL,
                            upgradeURL: Cryptpad.upgradeURL
                        },
                        isNewFile: isNewFile,
                        isDeleted: isDeleted,
                        channel: secret.channel,
                        enableSF: localStorage.CryptPad_SF === "1", // TODO to remove when enabled by default
                        devMode: localStorage.CryptPad_dev === "1",
                        fromFileData: Cryptpad.fromFileData ? (isOO ? Cryptpad.fromFileData : {
                            title: Cryptpad.fromFileData.title
                        }) : undefined,
                        fromContent: Cryptpad.fromContent,
                        burnAfterReading: burnAfterReading,
                        storeInTeam: Cryptpad.initialTeam || (Cryptpad.initialPath ? -1 : undefined),
                        supportsWasm: Utils.Util.supportsWasm(),
                    };
                    if (window.CryptPad_newSharedFolder) {
                        additionalPriv.newSharedFolder = window.CryptPad_newSharedFolder;
                    }
                    if (Utils.Constants.criticalApps.indexOf(parsed.type) === -1 &&
                            !Utils.PadTypes.isAvailable(parsed.type)) {
                        additionalPriv.disabledApp = true;
                    }
                    if (!Utils.LocalStore.isLoggedIn() &&
                        AppConfig.registeredOnlyTypes.indexOf(parsed.type) !== -1 &&
                        parsed.type !== "file") {
                        additionalPriv.registeredOnly = true;
                    }

                    if (metaObj.priv && Array.isArray(metaObj.priv.mutedChannels)
                            && metaObj.priv.mutedChannels.includes(secret.channel)) {
                        delete metaObj.priv.mutedChannes;
                        additionalPriv.isChannelMuted = true;
                    }

                    // Integration
                    additionalPriv.integration = cfg.integration;
                    additionalPriv.integrationConfig = cfg.integrationConfig;
                    additionalPriv.initialState = cfg.initialState instanceof Blob ?
                                                    cfg.initialState : undefined;

                    // Early access
                    var priv = metaObj.priv;
                    var _plan = typeof(priv.plan) === "undefined" ? Utils.LocalStore.getPremium() : priv.plan;
                    var p = Utils.Util.checkRestrictedApp(parsed.type, AppConfig,
                              Utils.Constants.earlyAccessApps, _plan, additionalPriv.loggedIn);
                    if (p === 0 || p === -1) {
                        additionalPriv.premiumOnly = true;
                    }
                    if (p === -2) {
                        additionalPriv.earlyAccessBlocked = true;
                    }

                    // Safe apps
                    if (isSafe) {
                        additionalPriv.hashes = hashes;
                        additionalPriv.password = password;
                    }

                    for (var k in additionalPriv) { metaObj.priv[k] = additionalPriv[k]; }

                    if (cfg.addData) {
                        cfg.addData(metaObj.priv, Cryptpad, metaObj.user, Utils);
                    }

                    if (metaObj && metaObj.priv && typeof(metaObj.priv.plan) === "string") {
                        Utils.LocalStore.setPremium(metaObj.priv.plan);
                    }

                    sframeChan.event('EV_METADATA_UPDATE', metaObj, {raw: true});
                });
            };
            Cryptpad.onMetadataChanged(updateMeta);
            sframeChan.onReg('EV_METADATA_UPDATE', updateMeta);

            Utils.LocalStore.onLogin(function () {
                Cryptpad.setTabHash(currentPad.hash);
            });
            Utils.LocalStore.onLogout(function () {
                Cryptpad.setTabHash(currentPad.hash);
                sframeChan.event('EV_LOGOUT');
            });

            //Test.registerOuter(sframeChan);

            Cryptpad.drive.onDeleted.reg(function (message) {
                sframeChan.event("EV_DRIVE_DELETED", message);
            });
            Cryptpad.onNewVersionReconnect.reg(function () {
                sframeChan.event("EV_NEW_VERSION");
            });



            // Put in the following function the RPC queries that should also work in filepicker
            var _sframeChan = sframeChan;
            var addCommonRpc = function (sframeChan, safe) {
                // Send UI.log and UI.warn commands from the secureiframe to the normal iframe
                sframeChan.on('EV_ALERTIFY_LOG', function (msg) {
                    _sframeChan.event('EV_ALERTIFY_LOG', msg);
                });
                sframeChan.on('EV_ALERTIFY_WARN', function (msg) {
                    _sframeChan.event('EV_ALERTIFY_WARN', msg);
                });

                Cryptpad.universal.onEvent.reg(function (data) {
                    sframeChan.event('EV_UNIVERSAL_EVENT', data);
                });
                sframeChan.on('Q_UNIVERSAL_COMMAND', function (data, cb) {
                    Cryptpad.universal.execCommand(data, cb);
                });

                sframeChan.on('Q_ANON_RPC_MESSAGE', function (data, cb) {
                    Cryptpad.anonRpcMsg(data.msg, data.content, function (err, response) {
                        cb({error: err, response: response});
                    });
                });

                sframeChan.on('Q_GET_PINNED_USAGE', function (data, cb) {
                    Cryptpad.getPinnedUsage({}, function (e, used) {
                        cb({
                            error: e,
                            quota: used
                        });
                    });
                });
                sframeChan.on('Q_GET_PIN_LIMIT_STATUS', function (data, cb) {
                    Cryptpad.isOverPinLimit(null, function (e, overLimit, limits) {
                        cb({
                            error: e,
                            overLimit: overLimit,
                            limits: limits
                        });
                    });
                });

                sframeChan.on('Q_THUMBNAIL_GET', function (data, cb) {
                    Utils.LocalStore.getThumbnail(data.key, function (e, data) {
                        cb({
                            error: e,
                            data: data
                        });
                    });
                });
                sframeChan.on('Q_THUMBNAIL_SET', function (data, cb) {
                    Utils.LocalStore.setThumbnail(data.key, data.value, function (e) {
                        cb({error:e});
                    });
                });

                sframeChan.on('Q_GET_BLOB_CACHE', function (data, cb) {
                    if (!Utils.Cache) { return void cb({error: 'NOCACHE'}); }
                    Utils.Cache.getBlobCache(data.id, function (err, obj) {
                        if (err) { return void cb({error: err}); }
                        cb(obj);
                    });
                });
                sframeChan.on('Q_SET_BLOB_CACHE', function (data, cb) {
                    if (!Utils.Cache) { return void cb({error: 'NOCACHE'}); }
                    if (!data || !data.u8 || typeof(data.u8) !== "object") { return void cb({error: 'EINVAL'}); }
                    Utils.Cache.setBlobCache(data.id, data.u8, function (err) {
                        if (err) { return void cb({error: err}); }
                        cb();
                    });
                });

                sframeChan.on('Q_GET_ATTRIBUTE', function (data, cb) {
                    Cryptpad.getAttribute(data.key, function (e, data) {
                        cb({
                            error: e,
                            data: data
                        });
                    });
                });
                sframeChan.on('Q_SET_ATTRIBUTE', function (data, cb) {
                    Cryptpad.setAttribute(data.key, data.value, function (e) {
                        cb({error:e});
                    });
                });

                Cryptpad.mailbox.onEvent.reg(function (data, cb) {
                    sframeChan.query('EV_MAILBOX_EVENT', data, function (err, obj) {
                        if (!cb) { return; }
                        if (err) { return void cb({error: err}); }
                        cb(obj);
                    });
                });
                sframeChan.on('Q_MAILBOX_COMMAND', function (data, cb) {
                    Cryptpad.mailbox.execCommand(data, cb);
                });

                sframeChan.on('EV_SET_LOGIN_REDIRECT', function (page) {
                    var href = Utils.Hash.hashToHref('', page);
                    var url = Utils.Hash.getNewPadURL(href, { href: currentPad.href });
                    window.location.href = url;
                });

                sframeChan.on('Q_STORE_IN_TEAM', function (data, cb) {
                    Cryptpad.storeInTeam(data, cb);
                });

                sframeChan.on('EV_GOTO_URL', function (url) {
                    if (url) {
                        window.location.href = url;
                    } else {
                        window.location.reload();
                    }
                });

                var openURL = function (url) {
                    if (!url) { return; }
                    var a = window.open(url);
                    if (!a) {
                        sframeChan.event('EV_POPUP_BLOCKED');
                    }
                };

                sframeChan.on('EV_OPEN_URL_DIRECTLY', function () {
                    var url = currentPad.href;
                    openURL(url);
                });
                sframeChan.on('EV_OPEN_URL', openURL);

                sframeChan.on('EV_OPEN_UNSAFE_URL', function (url) {
                    if (url) {
                        window.open(ApiConfig.httpSafeOrigin + '/bounce/#' + encodeURIComponent(url));
                    }
                });

                sframeChan.on('Q_GET_PAD_METADATA', function (data, cb) {
                    if (!data || !data.channel) {
                        data = {
                            channel: secret.channel
                        };
                    }
                    Cryptpad.getPadMetadata(data, cb);
                });
                sframeChan.on('Q_SET_PAD_METADATA', function (data, cb) {
                    Cryptpad.setPadMetadata(data, cb);
                });

                sframeChan.on('Q_GET_PAD_ATTRIBUTE', function (data, cb) {
                    var href;
                    if (readOnly && hashes.editHash) {
                        // If we have a stronger hash, use it for pad attributes
                        href = window.location.pathname + '#' + hashes.editHash;
                    }
                    if (data.href) { href = data.href; }
                    Cryptpad.getPadAttribute(data.key, function (e, data) {
                        if (!safe && data) {
                            // Remove unsafe data for the unsafe iframe
                            delete data.href;
                            delete data.roHref;
                            delete data.password;
                        }
                        cb({
                            error: e,
                            data: data
                        });
                    }, href);
                });
                sframeChan.on('Q_SET_PAD_ATTRIBUTE', function (data, cb) {
                    var href;
                    if (readOnly && hashes.editHash) {
                        // If we have a stronger hash, use it for pad attributes
                        href = window.location.pathname + '#' + hashes.editHash;
                    }
                    if (data.href) { href = data.href; }
                    Cryptpad.setPadAttribute(data.key, data.value, function (e) {
                        cb({error:e});
                    }, href);
                });

                sframeChan.on('Q_ACCEPT_OWNERSHIP', function (data, cb) {
                    var parsed = Utils.Hash.parsePadUrl(data.href);
                    if (parsed.type === 'drive') {
                        // Shared folder
                        var secret = Utils.Hash.getSecrets(parsed.type, parsed.hash, data.password);
                        Cryptpad.addSharedFolder(null, secret, cb);
                    } else {
                        var _data = {
                            password: data.pw || data.password,
                            href: data.href,
                            channel: data.channel,
                            title: data.title,
                            owners: data.metadata ? data.metadata.owners : data.owners,
                            expire: data.metadata ? data.metadata.expire : data.expire,
                            forceSave: true
                        };
                        Cryptpad.setPadTitle(_data, function (err) {
                            cb({error: err});
                        });
                    }

                    // Also add your mailbox to the metadata object
                    var padParsed = Utils.Hash.parsePadUrl(data.href);
                    var padSecret = Utils.Hash.getSecrets(padParsed.type, padParsed.hash, data.password);
                    var padCrypto = Utils.Crypto.createEncryptor(padSecret.keys);
                    try {
                        var value = {};
                        value[edPublic] = padCrypto.encrypt(JSON.stringify({
                            notifications: notifications,
                            curvePublic: curvePublic
                        }));
                        var msg = {
                            channel: data.channel,
                            command: 'ADD_MAILBOX',
                            value: value
                        };
                        Cryptpad.setPadMetadata(msg, function (res) {
                            if (res.error) { console.error(res.error); }
                        });
                    } catch (err) {
                        return void console.error(err);
                    }
                });

                // Add or remove our mailbox from the list if we're an owner
                sframeChan.on('Q_UPDATE_MAILBOX', function (data, cb) {
                    var metadata = data.metadata;
                    var add = data.add;
                    var _secret = secret;
                    if (metadata && (metadata.href || metadata.roHref)) {
                        var _parsed = Utils.Hash.parsePadUrl(metadata.href || metadata.roHref);
                        _secret = Utils.Hash.getSecrets(_parsed.type, _parsed.hash, metadata.password);
                    }
                    if (_secret.channel.length !== 32) {
                        return void cb({error: 'EINVAL'});
                    }
                    var crypto = Crypto.createEncryptor(_secret.keys);
                    nThen(function (waitFor) {
                        // If we already have metadata, use it, otherwise, try to get it
                        if (metadata && metadata.owners) { return; }

                        Cryptpad.getPadMetadata({
                            channel: secret.channel
                        }, waitFor(function (obj) {
                            obj = obj || {};
                            if (obj.error) {
                                waitFor.abort();
                                return void cb(obj);
                            }
                            metadata = obj;
                        }));
                    }).nThen(function () {
                        // Get and maybe migrate the existing mailbox object
                        var owners = metadata.owners;
                        if (!Array.isArray(owners) || owners.indexOf(edPublic) === -1) {
                            return void cb({ error: 'INSUFFICIENT_PERMISSIONS' });
                        }

                        // Remove a mailbox
                        if (!add) {
                            // Old format: this is the mailbox of the first owner
                            if (typeof (metadata.mailbox) === "string" && metadata.mailbox) {
                                // Not our mailbox? abort
                                if (owners[0] !== edPublic) {
                                    return void cb({ error: 'INSUFFICIENT_PERMISSIONS' });
                                }
                                // Remove it
                                return void Cryptpad.setPadMetadata({
                                    channel: _secret.channel,
                                    command: 'RM_MAILBOX',
                                    value: []
                                }, cb);
                            } else if (metadata.mailbox) { // New format
                                return void Cryptpad.setPadMetadata({
                                    channel: _secret.channel,
                                    command: 'RM_MAILBOX',
                                    value: [edPublic]
                                }, cb);
                            }
                            return void cb({
                                error: 'NO_MAILBOX'
                            });
                        }
                        // Add a mailbox
                        var toAdd = {};
                        toAdd[edPublic] = crypto.encrypt(JSON.stringify({
                            notifications: notifications,
                            curvePublic: curvePublic
                        }));
                        Cryptpad.setPadMetadata({
                            channel: _secret.channel,
                            command: 'ADD_MAILBOX',
                            value: toAdd
                        }, cb);
                    });
                });

                // CONTACT_OWNER is used both to check IF we can contact an owner (send === false)
                // AND also to send the request if we want (send === true)
                sframeChan.on('Q_CONTACT_OWNER', function (data, cb) {
                    if (readOnly && hashes.editHash) {
                        return void cb({error: 'ALREADYKNOWN'});
                    }
                    var send = data.send;
                    var metadata = data.metadata;
                    var owners = [];
                    var _secret = secret;
                    if (metadata && metadata.roHref) {
                        var _parsed = Utils.Hash.parsePadUrl(metadata.roHref);
                        _secret = Utils.Hash.getSecrets(_parsed.type, _parsed.hash, metadata.password);
                    }
                    if (_secret.channel.length !== 32) {
                        return void cb({error: 'EINVAL'});
                    }
                    var crypto = Crypto.createEncryptor(_secret.keys);
                    nThen(function (waitFor) {
                        // Try to get the owner's mailbox from the pad metadata first.
                        var todo = function (obj) {
                            var decrypt = function (mailbox) {
                                try {
                                    var dataStr = crypto.decrypt(mailbox, true, true);
                                    var data = JSON.parse(dataStr);
                                    if (!data.notifications || !data.curvePublic) { return; }
                                    return data;
                                } catch (e) { console.error(e); }
                            };
                            if (typeof (obj.mailbox) === "string") {
                                owners = [decrypt(obj.mailbox)];
                                return;
                            }
                            if (!obj.mailbox || !obj.owners || !obj.owners.length) { return; }
                            owners = obj.owners.map(function (edPublic) {
                                var mailbox = obj.mailbox[edPublic];
                                if (typeof(mailbox) !== "string") { return; }
                                return decrypt(mailbox);
                            }).filter(Boolean);
                        };

                        // If we already have metadata, use it, otherwise, try to get it
                        if (metadata) { return void todo(metadata); }

                        Cryptpad.getPadMetadata({
                            channel: _secret.channel
                        }, waitFor(function (obj) {
                            obj = obj || {};
                            if (obj.error) { return; }
                            todo(obj);
                        }));
                    }).nThen(function () {
                        // If we are just checking (send === false) and there is a mailbox field, cb state true
                        if (!send) { return void cb({state: Boolean(owners.length)}); }

                        Cryptpad.padRpc.contactOwner({
                            send: send,
                            anon: data.anon,
                            query: data.query,
                            msgData: data.msgData,
                            channel: _secret.channel,
                            owners: owners
                        }, cb);
                    });
                });

                sframeChan.on('Q_BLOB_PASSWORD_CHANGE', function (data, cb) {
                    data.href = data.href || currentPad.href;
                    var onPending = function (cb) {
                        sframeChan.query('Q_BLOB_PASSWORD_CHANGE_PENDING', null, function (err, obj) {
                            if (obj && obj.cancel) { cb(); }
                        });
                    };
                    var updateProgress = function (p) {
                        sframeChan.event('EV_BLOB_PASSWORD_CHANGE_PROGRESS', p);
                    };
                    Cryptpad.changeBlobPassword(data, {
                        onPending: onPending,
                        updateProgress: updateProgress
                    }, cb);
                });

                sframeChan.on('Q_OO_PASSWORD_CHANGE', function (data, cb) {
                    data.href = data.href;
                    Cryptpad.changeOOPassword(data, cb);
                });

                sframeChan.on('Q_PAD_PASSWORD_CHANGE', function (data, cb) {
                    data.href = data.href;
                    Cryptpad.changePadPassword(Cryptget, Crypto, data, cb);
                });

                sframeChan.on('Q_DELETE_OWNED', function (data, cb) {
                    Cryptpad.userObjectCommand({
                        cmd: 'deleteOwned',
                        teamId: data.teamId,
                        data: {
                            channel: data.channel
                        }
                    }, cb);
                });
                sframeChan.on('Q_GET_HISTORY_RANGE', function (data, cb) {
                    var nSecret = secret;
                    if (cfg.isDrive) {
                        // Shared folder or user hash or fs hash
                        var hash = Cryptpad.userHash || Utils.LocalStore.getFSHash();
                        if (data.sharedFolder) { hash = data.sharedFolder.hash; }
                        if (hash) {
                            var password = (data.sharedFolder && data.sharedFolder.password) || undefined;
                            nSecret = Utils.Hash.getSecrets('drive', hash, password);
                        }
                    }
                    if (data.href) {
                        var _parsed = Utils.Hash.parsePadUrl(data.href);
                        nSecret = Utils.Hash.getSecrets(_parsed.type, _parsed.hash, data.password);
                    }
                    if (data.isDownload && ooDownloadData[data.isDownload]) {
                        var ooData = ooDownloadData[data.isDownload];
                        delete ooDownloadData[data.isDownload];
                        nSecret = Utils.Hash.getSecrets('sheet', ooData.hash, ooData.password);
                    }
                    var channel = nSecret.channel;
                    var validate = nSecret.keys.validateKey;
                    var crypto = Crypto.createEncryptor(nSecret.keys);
                    Cryptpad.getHistoryRange({
                        channel: data.channel || channel,
                        validateKey: validate,
                        toHash: data.toHash,
                        lastKnownHash: data.lastKnownHash
                    }, function (data) {
                        cb({
                            isFull: data.isFull,
                            messages: data.messages.map(function (obj) {
                                // The 3rd parameter "true" means we're going to skip signature validation.
                                // We don't need it since the message is already validated serverside by hk
                                return {
                                    msg: crypto.decrypt(obj.msg, true, true),
                                    serverHash: obj.serverHash,
                                    author: obj.author,
                                    time: obj.time
                                };
                            }),
                            lastKnownHash: data.lastKnownHash
                        });
                    });
                });

                sframeChan.on('Q_PIN_GET_USAGE', function (teamId, cb) {
                    Cryptpad.isOverPinLimit(teamId, function (err, overLimit, data) {
                        cb({
                            error: err,
                            data: data
                        });
                    });
                });

                sframeChan.on('Q_PASSWORD_CHECK', function (pw, cb) {
                    Cryptpad.isNewChannel(currentPad.href, pw, function (e, isNew) {
                        if (isNew === false) {
                            nThen(function (w) {
                                // If the pad is stored, update its data
                                var _secret = Utils.Hash.getSecrets(parsed.type, parsed.hash, pw);
                                var chan = _secret.channel;
                                var editH = Utils.Hash.getEditHashFromKeys(_secret);
                                var viewH = Utils.Hash.getViewHashFromKeys(_secret);
                                var href = Utils.Hash.hashToHref(editH, parsed.type);
                                var roHref = Utils.Hash.hashToHref(viewH, parsed.type);
                                Cryptpad.setPadAttribute('password', pw, w(), parsed.getUrl());
                                Cryptpad.setPadAttribute('channel', chan, w(), parsed.getUrl());
                                Cryptpad.setPadAttribute('href', href, w(), parsed.getUrl());
                                Cryptpad.setPadAttribute('roHref', roHref, w(), parsed.getUrl());
                            }).nThen(function () {
                                // Get redirect URL
                                var uHash = Utils.LocalStore.getBlockHash();
                                var uSecret = Utils.Block.parseBlockHash(uHash);
                                var uKey = uSecret.keys.symmetric;
                                var url = Utils.Hash.getNewPadURL(currentPad.href, {
                                    pw: Crypto.encrypt(pw, uKey),
                                    f: 1
                                });
                                // redirect
                                window.location.href = url;
                                document.location.reload();
                            });

                            return;
                        }
                        cb({
                            error: e
                        });
                    });
                });
            };
            addCommonRpc(sframeChan, isSafe);

            var SecureModal = {};

            var currentTitle;
            var currentTabTitle;
            var titleSuffix = (Utils.Util.find(Utils, ['Instance','name','default']) || '').trim();
            if (!titleSuffix || titleSuffix === ApiConfig.httpUnsafeOrigin) {
                titleSuffix = window.location.hostname;
            }
            var setDocumentTitle = function () {
                var newTitle;
                if (!currentTabTitle) {
                    newTitle = currentTitle || 'CryptPad';
                } else {
                    var title = currentTabTitle.replace(/\{title\}/g, currentTitle || 'CryptPad');
                    newTitle = title + ' - ' + titleSuffix;
                }
                document.title = newTitle;
                sframeChan.event('EV_IFRAME_TITLE', newTitle);
                if (SecureModal.modal) { SecureModal.modal.setTitle(newTitle); }
            };

            var setPadTitle = function (data, cb) {
                Cryptpad.setPadTitle(data, function (err, obj) {
                    if (!err && !(obj && obj.notStored)) {
                        // No error and the pad was correctly stored
                        // hide the hash
                        var opts = parsed.getOptions();
                        var hash = Utils.Hash.getHiddenHashFromKeys(parsed.type, secret, opts);
                        var useUnsafe = Utils.Util.find(settings, ['security', 'unsafeLinks']);
                        if (useUnsafe !== true && window.history && window.history.replaceState) {
                            if (!/^#/.test(hash)) { hash = '#' + hash; }
                            window.history.replaceState({}, window.document.title, hash);
                        }
                    }
                    cb({error: err});
                });
            };

            sframeChan.on('Q_SET_PAD_TITLE_IN_DRIVE', function (newData, cb) {
                var newTitle = newData.title || newData.defaultTitle;
                currentTitle = newTitle;
                setDocumentTitle();
                var data = {
                    password: password,
                    title: newTitle,
                    channel: secret.channel,
                    path: initialPathInDrive // Where to store the pad if we don't have it in our drive
                };
                setPadTitle(data, cb);
            });
            sframeChan.on('EV_SET_TAB_TITLE', function (newTabTitle) {
                currentTabTitle = newTabTitle;
                setDocumentTitle();
            });

            sframeChan.on('EV_SET_HASH', function (hash) {
                // In this case, we want to set the hash for the next page reload
                // This hash is a category for the sidebar layout apps
                // No need to store it in memory
                window.location.hash = hash;
            });

            Cryptpad.autoStore.onStoreRequest.reg(function (data) {
                sframeChan.event("EV_AUTOSTORE_DISPLAY_POPUP", data);
            });
            sframeChan.on('Q_AUTOSTORE_STORE', function (obj, cb) {
                var data = {
                    password: password,
                    title: currentTitle,
                    channel: secret.channel,
                    path: initialPathInDrive, // Where to store the pad if we don't have it in our drive
                    forceSave: true,
                    forceOwnDrive: obj && obj.forceOwnDrive
                };
                setPadTitle(data, cb);
            });
            sframeChan.on('Q_IS_PAD_STORED', function (data, cb) {
                Cryptpad.getPadAttribute('title', function (err, data) {
                    cb (!err && typeof (data) === "string");
                });
            });

            sframeChan.on('Q_IMPORT_MEDIATAG', function (obj, cb) {
                var key = obj.key;
                var channel = obj.channel;
                var hash = Utils.Hash.getFileHashFromKeys({
                    version: 1,
                    channel: channel,
                    keys: {
                        fileKeyStr: key
                    }
                });
                var href = '/file/#' + hash;
                var data = {
                    title: obj.name,
                    href: href,
                    channel: channel,
                    owners: obj.owners,
                    forceSave: true,
                };
                Cryptpad.setPadTitle(data, function (err) {
                    Cryptpad.setPadAttribute('fileType', obj.type, null, href);
                    cb(err);
                });
            });

            sframeChan.on('Q_SETTINGS_SET_DISPLAY_NAME', function (newName, cb) {
                Cryptpad.setDisplayName(newName, function (err) {
                    if (err) {
                        console.log("Couldn't set username");
                        console.error(err);
                        cb('ERROR');
                        return;
                    }
                    Cryptpad.changeMetadata();
                    cb();
                });
            });

            sframeChan.on('Q_LOGOUT', function (data, cb) {
                Utils.LocalStore.logout(cb);
            });

            sframeChan.on('Q_LOGOUT_EVERYWHERE', function (data, cb) {
                Cryptpad.logoutFromAll(Utils.Util.bake(Utils.LocalStore.logout, function () {
                    Cryptpad.stopWorker();
                    cb();
                }));
            });

            sframeChan.on('EV_NOTIFY', function (data) {
                Notifier.notify(data);
            });

            sframeChan.on('Q_MOVE_TO_TRASH', function (data, cb) {
                cb = cb || $.noop;
                if (readOnly && hashes.editHash) {
                    var appPath = window.location.pathname;
                    Cryptpad.moveToTrash(cb, appPath + '#' + hashes.editHash);
                    return;
                }
                Cryptpad.moveToTrash(cb);
            });

            sframeChan.on('Q_SAVE_AS_TEMPLATE', function (data, cb) {
                data.teamId = Cryptpad.initialTeam;
                Cryptpad.saveAsTemplate(Cryptget.put, data, cb);
            });

            sframeChan.on('EV_MAKE_A_COPY', function () {
                var data = {
                    channel: secret.channel,
                    href: currentPad.href,
                    password: password,
                    title: currentTitle
                };
                var obj = { d: data };
                var href = window.location.pathname;
                var url = Utils.Hash.getNewPadURL(href, obj);
                window.open(url);
            });

            // Messaging
            sframeChan.on('Q_SEND_FRIEND_REQUEST', function (data, cb) {
                Cryptpad.messaging.sendFriendRequest(data, cb);
            });
            sframeChan.on('Q_ANSWER_FRIEND_REQUEST', function (data, cb) {
                Cryptpad.messaging.answerFriendRequest(data, cb);
            });

            sframeChan.on('Q_ANON_GET_PREVIEW_CONTENT', function (data, cb) {
                Cryptpad.anonGetPreviewContent(data, cb);
            });

            // History
            sframeChan.on('Q_GET_FULL_HISTORY', function (data, cb) {
                var crypto = Crypto.createEncryptor(secret.keys);
                Cryptpad.getFullHistory({
                    debug: data && data.debug,
                    channel: secret.channel,
                    validateKey: secret.keys.validateKey
                }, function (encryptedMsgs) {
                    var nt = nThen;
                    var decryptedMsgs = [];
                    var total = encryptedMsgs.length;
                    encryptedMsgs.forEach(function (_msg, i) {
                        nt = nt(function (waitFor) {
                            // The 3rd parameter "true" means we're going to skip signature validation.
                            // We don't need it since the message is already validated serverside by hk
                            if (typeof(_msg) === "object") {
                                decryptedMsgs.push({
                                    author: _msg.author,
                                    serverHash: _msg.serverHash,
                                    time: _msg.time,
                                    msg: crypto.decrypt(_msg.msg, true, true)
                                });
                            } else {
                                decryptedMsgs.push(crypto.decrypt(_msg, true, true));
                            }
                            setTimeout(waitFor(function () {
                                sframeChan.event('EV_FULL_HISTORY_STATUS', (i+1)/total);
                            }));
                        }).nThen;
                    });
                    nt(function () {
                        cb(decryptedMsgs);
                    });
                });
            });

            // Store
            sframeChan.on('Q_DRIVE_GETDELETED', function (data, cb) {
                Cryptpad.getDeletedPads(data, function (err, obj) {
                    if (err) { return void console.error(err); }
                    cb(obj);
                });
            });

            sframeChan.on('Q_IS_ONLY_IN_SHARED_FOLDER', function (data, cb) {
                Cryptpad.isOnlyInSharedFolder(secret.channel, function (err, t) {
                    if (err) { return void cb({error: err}); }
                    cb(t);
                });
            });

            // Present mode URL
            sframeChan.on('Q_PRESENT_URL_GET_VALUE', function (data, cb) {
                var parsed = Utils.Hash.parsePadUrl(currentPad.href);
                cb(parsed.hashData && parsed.hashData.present);
            });
            sframeChan.on('EV_PRESENT_URL_SET_VALUE', function (data) {
                // Update the rendered hash and the full hash with the "present" settings
                var opts = parsed.getOptions();
                opts.present = data;
                // Full hash
                currentPad.href = parsed.getUrl(opts);
                if (parsed.hashData) { currentPad.hash = parsed.hashData.getHash(opts); }
                // Rendered (maybe hidden) hash
                var hiddenParsed = Utils.Hash.parsePadUrl(window.location.href);

                // Update the hash in the address bar
                Cryptpad.setTabHref(hiddenParsed.getUrl(opts));
            });


            // File upload
            var onFileUpload = function (sframeChan, data, cb) {
                require(['/common/outer/upload.js'], function (Files) {
                    var sendEvent = function (data) {
                        sframeChan.event("EV_FILE_UPLOAD_STATE", data);
                    };
                    var updateProgress = function (progressValue) {
                        sendEvent({
                            uid: data.uid,
                            progress: progressValue
                        });
                    };
                    var onComplete = function (href) {
                        sendEvent({
                            complete: true,
                            uid: data.uid,
                            href: href
                        });
                    };
                    var onError = function (e) {
                        sendEvent({
                            uid: data.uid,
                            error: e
                        });
                    };
                    var onPending = function (cb) {
                        sframeChan.query('Q_CANCEL_PENDING_FILE_UPLOAD', {
                            uid: data.uid
                        }, function (err, data) {
                            if (data) {
                                cb();
                            }
                        });
                    };
                    data.blob = Crypto.Nacl.util.decodeBase64(data.blob);
                    Files.upload(data, data.noStore, Cryptpad, updateProgress, onComplete, onError, onPending);
                    cb();
                });
            };
            sframeChan.on('Q_UPLOAD_FILE', function (data, cb) {
                onFileUpload(sframeChan, data, cb);
            });

            // Secure modal
            // Create or display the iframe and modal
            var getPropChannels = function () {
                var channels = {};
                if (cfg.getPropChannels) {
                    channels = Utils.Util.clone(cfg.getPropChannels());
                }
                channels.channel = secret.channel;
                return channels;
            };
            var initSecureModal = function (type, cfg, cb) {
                cfg.modal = type;
                SecureModal.cb = cb;
                // cfg.hidden means pre-loading the iframe while keeping it hidden.
                // if cfg.hidden is true and the iframe already exists, do nothing
                if (!SecureModal.$iframe) {
                    var config = {};
                    config.onAction = function (data) {
                        if (typeof(SecureModal.cb) !== "function") { return; }
                        SecureModal.cb(data);
                    };
                    config.onFileUpload = onFileUpload;
                    config.onClose = function () {
                        SecureModal.$iframe.hide();
                    };
                    config.data = {
                        app: parsed.type,
                        channel: secret.channel,
                        hashes: hashes,
                        password: password,
                        isTemplate: isTemplate,
                        getPropChannels: getPropChannels
                    };
                    config.addCommonRpc = addCommonRpc;
                    config.modules = {
                        Cryptpad: Cryptpad,
                        SFrameChannel: SFrameChannel,
                        Utils: Utils
                    };
                    SecureModal.$iframe = $('<iframe>', {
                        id: 'sbox-secure-iframe',
                        allow: 'clipboard-write'
                    }).appendTo($('body'));
                    SecureModal.modal = SecureIframe.create(config);
                }
                setDocumentTitle();
                if (!cfg.hidden) {
                    SecureModal.modal.refresh(cfg, function () {
                        SecureModal.$iframe.show();
                    });
                } else {
                    SecureModal.$iframe.hide();
                    return;
                }
                SecureModal.$iframe.focus();
            };

            sframeChan.on('Q_FILE_PICKER_OPEN', function (data, cb) {
                initSecureModal('filepicker', data || {}, cb);
            });

            sframeChan.on('EV_PROPERTIES_OPEN', function (data) {
                initSecureModal('properties', data || {});
            });

            sframeChan.on('EV_ACCESS_OPEN', function (data) {
                initSecureModal('access', data || {});
            });

            sframeChan.on('EV_SHARE_OPEN', function (data) {
                initSecureModal('share', data || {});
            });

            // Unsafe iframe
            var UnsafeObject = {};
            Utils.initUnsafeIframe = function (cfg, cb) {
                if (!UnsafeObject.$iframe) {
                    var config = {};
                    config.addCommonRpc = addCommonRpc;
                    config.modules = {
                        Cryptpad: Cryptpad,
                        SFrameChannel: SFrameChannel,
                        Utils: Utils
                    };
                    UnsafeObject.$iframe = $('<iframe>', {
                        id: 'sbox-unsafe-iframe',
                        allow: 'clipboard-write'
                    }).appendTo($('body')).hide();
                    UnsafeObject.modal = UnsafeIframe.create(config);
                }
                UnsafeObject.modal.refresh(cfg, function (data) {
                    console.error(data);
                    cb(data);
                });
            };

            // OO iframe
            var OOIframeObject = {};
            var initOOIframe = function (cfg, cb) {
                if (!OOIframeObject.$iframe) {
                    var config = {};
                    config.addCommonRpc = addCommonRpc;
                    config.modules = {
                        Cryptpad: Cryptpad,
                        SFrameChannel: SFrameChannel,
                        Utils: Utils
                    };
                    OOIframeObject.$iframe = $('<iframe>', {
                        id: 'sbox-oo-iframe',
                        allow: 'clipboard-write'
                    }).appendTo($('body')).hide();
                    OOIframeObject.modal = OOIframe.create(config);
                }
                OOIframeObject.modal.refresh(cfg, function (data) {
                    cb(data);
                });
            };

            sframeChan.on('Q_OOIFRAME_OPEN', function (data, cb) {
                if (!data) { return void cb(); }

                // Extract unsafe data (href and password) before sending it to onlyoffice
                var padData = data.padData;
                delete data.padData;
                var uid = Utils.Util.uid();
                ooDownloadData[uid] = padData;
                data.downloadId = uid;

                initOOIframe(data || {}, cb);
            });

            sframeChan.on('Q_TEMPLATE_USE', function (data, cb) {
                Cryptpad.useTemplate(data, Cryptget, cb);
            });
            sframeChan.on('Q_OO_TEMPLATE_USE', function (data, cb) {
                data.oo = true;
                Cryptpad.useTemplate(data, Cryptget, cb);
            });
            sframeChan.on('Q_TEMPLATE_EXIST', function (type, cb) {
                Cryptpad.listTemplates(type, function (err, templates) {
                    cb(templates.length > 0);
                });
            });
            var getKey = function (href, channel) {
                var parsed = Utils.Hash.parsePadUrl(href);
                return 'thumbnail-' + parsed.type + '-' + channel;
            };
            sframeChan.on('Q_CREATE_TEMPLATES', function (type, cb) {
                var templates;
                nThen(function (waitFor) {
                    var next = waitFor();
                    require([
                        '/'+type+'/templates.js'
                    ], function (Templates) {
                        templates = Templates;
                        next();
                    }, function () {
                        next();
                    });
                }).nThen(function () {
                    Cryptpad.getSecureFilesList({
                        types: [type],
                        where: ['template']
                    }, function (err, data) {
                        // NOTE: Never return data directly!
                        if (err) { return void cb({error: err}); }
                        var res = [];
                        nThen(function (waitFor) {
                            Object.keys(data).map(function (el) {
                                var k = getKey(data[el].href, data[el].channel);
                                Utils.LocalStore.getThumbnail(k, waitFor(function (e, thumb) {
                                    res.push({
                                        id: el,
                                        name: data[el].filename || data[el].title || '?',
                                        thumbnail: thumb,
                                        used: data[el].used || 0
                                    });
                                }));
                            });
                        }).nThen(function () {
                            if (Array.isArray(templates)) {
                                templates.forEach(function (obj) {
                                    res.push(obj);
                                });
                            }
                            cb({data: res});
                        });
                    });
                });
            });

            sframeChan.on('Q_GET_FILE_THUMBNAIL', function (data, cb) {
                if (!Cryptpad.fromFileData || !Cryptpad.fromFileData.href) {
                    return void cb({
                        error: "EINVAL",
                    });
                }
                var key = getKey(Cryptpad.fromFileData.href, Cryptpad.fromFileData.channel);
                Utils.LocalStore.getThumbnail(key, function (e, data) {
                    if (data === "EMPTY") { data = null; }
                    cb({
                        error: e,
                        data: data
                    });
                });
            });

            sframeChan.on('Q_CACHE_DISABLE', function (data, cb) {
                if (data.disabled) {
                    Utils.Cache.clear(function () {
                        Utils.Cache.disable();
                    });
                    Cryptpad.disableCache(true, cb);
                    return;
                }
                Utils.Cache.enable();
                Cryptpad.disableCache(false, cb);
            });
            sframeChan.on('Q_CLEAR_CACHE', function (data, cb) {
                Utils.Cache.clear(cb);
            });
            sframeChan.on('Q_CLEAR_CACHE_CHANNELS', function (channels, cb) {
                if (!Array.isArray(channels)) { return void cb({error: "NOT_AN_ARRAY"}); }
                nThen(function (waitFor) {
                    channels.forEach(function (chan) {
                        if (chan === "chainpad") { chan = secret.channel; }
                        console.error(chan);
                        Utils.Cache.clearChannel(chan, waitFor());
                    });
                }).nThen(cb);
            });

            sframeChan.on('Q_LANGUAGE_SET', function (data, cb) {
                Cryptpad.setLanguage(data, cb);
            });

            sframeChan.on('Q_GET_ALL_TAGS', function (data, cb) {
                Cryptpad.listAllTags(function (err, tags) {
                    cb({
                        error: err,
                        tags: tags
                    });
                });
            });

            sframeChan.on('Q_CHANGE_USER_PASSWORD', function (data, cb) {
                Cryptpad.changeUserPassword(Cryptget, edPublic, data, cb);
            });

            // It seems we have performance issues when we open and close a lot of channels over
            // the same network, maybe a memory leak. To fix this, we kill and create a new
            // network every 30 cryptget calls (1 call = 1 channel)
            var cgNetwork;
            var whenCGReady = function (cb) {
                if (cgNetwork && cgNetwork !== true) { console.log(cgNetwork); return void cb(); }
                setTimeout(function () {
                    whenCGReady(cb);
                }, 500);
            };
            var i = 0;
            sframeChan.on('Q_CRYPTGET', function (data, cb) {
                var keys;
                var todo = function () {
                    data.opts.network = cgNetwork;
                    data.opts.accessKeys = keys;
                    Cryptget.get(data.hash, function (err, val) {
                        cb({
                            error: err,
                            data: val
                        });
                    }, data.opts, function (progress) {
                        sframeChan.event("EV_CRYPTGET_PROGRESS", {
                            hash: data.hash,
                            progress: progress,
                        });
                    });
                };
                //return void todo();
                if (i > 30) {
                    i = 0;
                    cgNetwork = undefined;
                }
                i++;

                Cryptpad.getAccessKeys(function (_keys) {
                    keys = _keys;
                    if (!cgNetwork) {
                        cgNetwork = true;
                        return void Cryptpad.makeNetwork(function (err, nw) {
                            console.log(nw);
                            cgNetwork = nw;
                            todo();
                        });
                    } else if (cgNetwork === true) {
                        return void whenCGReady(todo);
                    }
                    todo();
                });
            });
            sframeChan.on('EV_CRYPTGET_DISCONNECT', function () {
                if (!cgNetwork) { return; }
                cgNetwork.disconnect();
                cgNetwork = undefined;
            });

            if (cfg.addRpc) {
                cfg.addRpc(sframeChan, Cryptpad, Utils);
            }

            sframeChan.on('Q_INTEGRATION_OPENCHANNEL', function (data, cb) {
                Cryptpad.universal.execCommand({
                    type: 'integration',
                    data: {
                        cmd: 'INIT',
                        data: {
                            channel: data,
                            secret: secret
                        }
                    }
                }, cb);
            });
            sframeChan.on('Q_CURSOR_OPENCHANNEL', function (data, cb) {
                Cryptpad.universal.execCommand({
                    type: 'cursor',
                    data: {
                        cmd: 'INIT_CURSOR',
                        data: {
                            channel: data,
                            secret: secret
                        }
                    }
                }, cb);
            });

            Cryptpad.onTimeoutEvent.reg(function () {
                sframeChan.event('EV_WORKER_TIMEOUT');
            });

            sframeChan.on('EV_GIVE_ACCESS', function (data, cb) {
                Cryptpad.padRpc.giveAccess(data, cb);
            });

            sframeChan.on('EV_BURN_PAD', function (channel) {
                if (!burnAfterReading) { return; }
                Cryptpad.burnPad({
                    channel: channel,
                    ownerKey: burnAfterReading
                });
            });

            sframeChan.on('Q_GET_LAST_HASH', function (data, cb) {
                Cryptpad.padRpc.getLastHash({
                    channel: secret.channel
                }, cb);
            });
            sframeChan.on('Q_GET_SNAPSHOT', function (data, cb) {
                var crypto = Crypto.createEncryptor(secret.keys);
                Cryptpad.padRpc.getSnapshot({
                    channel: secret.channel,
                    hash: data.hash
                }, function (obj) {
                    if (obj && obj.error) { return void cb(obj); }
                    var messages = obj.messages || [];
                    messages.forEach(function (patch) {
                        patch.msg = crypto.decrypt(patch.msg, true, true);
                    });
                    cb(messages);
                });
            });

            sframeChan.on('Q_ASK_NOTIFICATION', function (data, cb) {
                if (!Utils.Notify.isSupported()) { return void cb(false); }
                // eslint-disable-next-line compat/compat
                Notification.requestPermission(function (s) {
                    cb(s === "granted");
                });
            });

            sframeChan.on('Q_COPY_VIEW_URL', function (data, cb) {
                require(['/common/clipboard.js'], function (Clipboard) {
                    var url = window.location.origin +
                                Utils.Hash.hashToHref(hashes.viewHash, 'form');
                    Clipboard.copy(url, (err) => {
                        cb(!err);
                    });
                });
            });
            sframeChan.on('EV_OPEN_VIEW_URL', function () {
                var url = Utils.Hash.hashToHref(hashes.viewHash, 'form');
                var a = window.open(url);
                if (!a) {
                    sframeChan.event('EV_POPUP_BLOCKED');
                }
            });

            var integrationSave = function () {};
            if (cfg.integration) {
                sframeChan.on('Q_INTEGRATION_SAVE', function (obj, cb) {
                    if (cfg.integrationUtils && cfg.integrationUtils.save) {
                        cfg.integrationUtils.save(obj, cb);
                    }
                });
                sframeChan.on('EV_INTEGRATION_READY', function () {
                    if (cfg.integrationUtils && cfg.integrationUtils.onReady) {
                        cfg.integrationUtils.onReady();
                    }
                });
                sframeChan.on('EV_INTEGRATION_ON_DOWNLOADAS', function (obj) {
                    if (cfg.integrationUtils && cfg.integrationUtils.onDownloadAs) {
                        cfg.integrationUtils.onDownloadAs(obj);
                    }
                });
                sframeChan.on('Q_INTEGRATION_HAS_UNSAVED_CHANGES', function (obj, cb) {
                    if (cfg.integrationUtils && cfg.integrationUtils.onHasUnsavedChanges) {
                        cfg.integrationUtils.onHasUnsavedChanges(obj, cb);
                    }
                });
                sframeChan.on('Q_INTEGRATION_ON_INSERT_IMAGE', function (data, cb) {
                    if (cfg.integrationUtils && cfg.integrationUtils.onInsertImage) {
                        cfg.integrationUtils.onInsertImage(data, cb);
                    }
                });
                integrationSave = function (cb) {
                    sframeChan.query('Q_INTEGRATION_NEEDSAVE', null, cb);
                };

                if (cfg.integrationUtils) {
                    if (cfg.integrationUtils.setDownloadAs) {
                        cfg.integrationUtils.setDownloadAs(format => {
                            sframeChan.event('EV_INTEGRATION_DOWNLOADAS', format);
                        });
                    }
                }

            }

            if (cfg.messaging) {
                sframeChan.on('Q_CHAT_OPENPADCHAT', function (data, cb) {
                    Cryptpad.universal.execCommand({
                        type: 'messenger',
                        data: {
                            cmd: 'OPEN_PAD_CHAT',
                            data: {
                                channel: data,
                                secret: secret
                            }
                        }
                    }, cb);
                });
            }

            // Chrome 68 on Mac contains a bug resulting in the page turning white after a few seconds
            try {
                if (navigator.platform.toUpperCase().indexOf('MAC') >= 0 &&
                    !localStorage.CryptPad_chrome68) {
                    var isChrome = !!window.chrome && !!window.chrome.webstore;
                    var getChromeVersion = function () {
                        var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
                        return raw ? parseInt(raw[2], 10) : false;
                    };
                    if (isChrome && getChromeVersion() === 68) {
                        sframeChan.whenReg('EV_CHROME_68', function () {
                            sframeChan.event("EV_CHROME_68");
                            try {
                                localStorage.CryptPad_chrome68 = "1";
                            } catch (err) {
                                console.error(err);
                            }
                        });
                    }
                }
            } catch (e) {}

            // If our channel was deleted from all of our drives, sitch back to full hash
            // in the address bar
            Cryptpad.padRpc.onChannelDeleted.reg(function (channel) {
                if (channel !== secret.channel) { return; }
                Cryptpad.setTabHref(currentPad.href);
            });

            // Join the netflux channel
            var rtStarted = false;
            var startRealtime = function (rtConfig) {
                rtConfig = rtConfig || {};
                rtStarted = true;

                // Remove the outer placeholder once iframe overwrites it for sure
                var placeholder = document.querySelector('#placeholder');
                if (placeholder && typeof(placeholder.remove) === 'function') {
                    placeholder.remove();
                }



                var replaceHash = function (hash) {
                    // The pad has just been created but is not stored yet. We'll switch
                    // to hidden hash once the pad is stored
                    if (window.history && window.history.replaceState) {
                        if (!/^#/.test(hash)) { hash = '#' + hash; }
                        window.history.replaceState({}, window.document.title, hash);
                        if (typeof(window.onhashchange) === 'function') {
                            window.onhashchange();
                        }
                        return;
                    }
                    window.location.hash = hash;
                };

                if (burnAfterReading) {
                    Cryptpad.padRpc.onReadyEvent.reg(function () {
                        Cryptpad.burnPad({
                            password: password,
                            href: currentPad.href,
                            channel: secret.channel,
                            ownerKey: burnAfterReading
                        });
                    });
                }

                // Make sure we add the validateKey to channel metadata when we don't use
                // the pad creation screen
                if (!rtConfig.metadata && secret.keys.validateKey) {
                    rtConfig.metadata = {
                        validateKey: secret.keys.validateKey
                    };
                }
                if (cfg.integration) {
                    rtConfig.metadata = rtConfig.metadata || {};
                    rtConfig.metadata.selfdestruct = true;
                }


                var ready = false;
                var cpNfCfg = {
                    sframeChan: sframeChan,
                    channel: secret.channel,
                    versionHash: cfg.type !== 'oo' && parsed.hashData && parsed.hashData.versionHash,
                    padRpc: Cryptpad.padRpc,
                    validateKey: secret.keys.validateKey || undefined,
                    isNewHash: isNewHash,
                    readOnly: readOnly,
                    crypto: Crypto.createEncryptor(secret.keys),
                    onConnect: function () {
                        if (currentPad.hash && currentPad.hash !== '#') {
                            /*window.location = parsed.getUrl({
                                present: parsed.hashData.present,
                                embed: parsed.hashData.embed
                            });*/
                            return;
                        }
                        if (readOnly || cfg.noHash) { return; }
                        replaceHash(Utils.Hash.getEditHashFromKeys(secret));
                    },
                    onReady: function () {
                        ready = true;
                    },
                    onError: function () {
                        if (!cfg.integration) { return; }

                        var reload = function () {
                            if (cfg.integrationUtils && cfg.integrationUtils.reload) {
                                cfg.integrationUtils.reload();
                            }
                        };

                        // on server crash, try to save to Nextcloud
                        if (ready) { return integrationSave(reload); }

                        // if error during loading, reload without saving
                        reload();
                    }
                };

                nThen(function (waitFor) {
                    if (isNewFile && cfg.owned && !currentPad.hash) {
                        Cryptpad.getMetadata(waitFor(function (err, m) {
                            cpNfCfg.owners = [m.priv.edPublic];
                        }));
                    } else if (isNewFile && !cfg.useCreationScreen && cfg.initialState) {
                        console.log('new file with initial state provided');
                    } else if (isNewFile && !cfg.useCreationScreen && currentPad.hash) {
                        console.log("new file with hash in the address bar in an app without pcs and which requires owners");
                        sframeChan.onReady(function () {
                            sframeChan.query("EV_LOADING_ERROR", "DELETED");
                        });
                        waitFor.abort();
                    }
                }).nThen(function () {
                    Object.keys(rtConfig).forEach(function (k) {
                        cpNfCfg[k] = rtConfig[k];
                    });
                    CpNfOuter.start(cpNfCfg);
                });
            };

            sframeChan.on('EV_CORRUPTED_CACHE', function () {
                Cryptpad.onCorruptedCache(secret.channel);
            });

            sframeChan.on('Q_CREATE_PAD', function (data, cb) {
                if (!isNewFile || rtStarted) { return; }
                let feedbackKey = 'APP_' + parsed.type.toUpperCase() + '_CREATE';
                Utils.Feedback.send(feedbackKey);
                // Create a new hash
                password = data.password;
                var newHash = Utils.Hash.createRandomHash(parsed.type, password);
                secret = Utils.secret = Utils.Hash.getSecrets(parsed.type, newHash, password);
                Utils.crypto = Utils.Crypto.createEncryptor(Utils.secret.keys);

                // Update the hash in the address bar
                currentPad.hash = newHash;
                currentPad.href = '/' + parsed.type + '/#' + newHash;
                Cryptpad.setTabHash(newHash);

                // Update metadata values and send new metadata inside
                parsed = Utils.Hash.parsePadUrl(currentPad.href);
                defaultTitle = Utils.UserObject.getDefaultName(parsed);
                hashes = Utils.Hash.getHashes(secret);
                readOnly = false;
                updateMeta();

                var rtConfig = {
                    metadata: {}
                };

                if (cfg.integration) { rtConfig.metadata.selfdestruct = true; }

                if (data.team) {
                    Cryptpad.initialTeam = data.team.id;
                }
                if (data.owned && data.team && data.team.edPublic) {
                    rtConfig.metadata.owners = [data.team.edPublic];
                } else if (data.owned) {
                    rtConfig.metadata.owners = [edPublic];
                    rtConfig.metadata.mailbox = {};
                    rtConfig.metadata.mailbox[edPublic] = Utils.crypto.encrypt(JSON.stringify({
                        notifications: notifications,
                        curvePublic: curvePublic
                    }));
                }
                if (data.expire) {
                    rtConfig.metadata.expire = data.expire;
                }
                rtConfig.metadata.validateKey = (secret.keys && secret.keys.validateKey) || undefined;

                Utils.rtConfig = rtConfig;
                var templatePw;
                nThen(function(waitFor) {
                    if (data.templateContent) { return; }
                    if (data.templateId) {
                        if (data.templateId === -1) {
                            isTemplate = true;
                            initialPathInDrive = ['template'];
                            return;
                        }
                        Cryptpad.getPadData(data.templateId, waitFor(function (err, d) {
                            data.template = d.href;
                            templatePw = d.password;
                        }));
                    }
                }).nThen(function () {
                    var cryptputCfg = $.extend(true, {}, rtConfig, {password: password});
                    if (data.templateContent) {
                        Cryptget.put(currentPad.hash, JSON.stringify(data.templateContent), function () {
                            startRealtime();
                            cb();
                        }, cryptputCfg);
                        return;
                    }
                    if (Cryptpad.fromFileData && isOO && Cryptpad.fromFileData.href) {
                        var d = Cryptpad.fromFileData;
                        var _p = Utils.Hash.parsePadUrl(d.href);
                        if (_p.type === currentPad.app) {
                            data.template = d.href;
                            templatePw = d.password;
                        }
                    }
                    if (data.template) {
                        // Start OO with a template...
                        // Cryptget and give href, password and content to inner
                        if (isOO) {
                            var then = function () {
                                startRealtime(rtConfig);
                                cb();
                            };
                            var _parsed = Utils.Hash.parsePadUrl(data.template);
                            Cryptget.get(_parsed.hash, function (err, val) {
                                if (err || !val) { return void then(); }
                                try {
                                    var parsed = JSON.parse(val);
                                    sframeChan.event('EV_OO_TEMPLATE', {
                                        href: data.template,
                                        password: templatePw,
                                        content: parsed
                                    });
                                } catch (e) { console.error(e); }
                                then();
                            }, {password: templatePw});
                            return;
                        }
                        // Pass rtConfig to useTemplate because Cryptput will create the file and
                        // we need to have the owners and expiration time in the first line on the
                        // server
                        Cryptpad.useTemplate({
                            href: data.template
                        }, Cryptget, function (err, errData) {
                            if (err) {
                                // TODO: better messages in case of expired, deleted, etc.?
                                if (err === 'ERESTRICTED') {
                                    sframeChan.event('EV_RESTRICTED_ERROR');
                                } else {
                                    sframeChan.query("EV_LOADING_ERROR", errData || 'DELETED');
                                }
                                return;
                            }
                            startRealtime();
                            cb();
                        }, cryptputCfg);
                        return;
                    }
                    // if we open a new code from a file
                    if (Cryptpad.fromFileData && !isOO) {
                        Cryptpad.useFile(Cryptget, function (err, errData) {
                            if (err) {
                                // TODO: better messages in case of expired, deleted, etc.?
                                if (err === 'ERESTRICTED') {
                                    sframeChan.event('EV_RESTRICTED_ERROR');
                                } else {
                                    sframeChan.query("EV_LOADING_ERROR", errData || 'DELETED');
                                }
                                return;
                            }
                            startRealtime();
                            cb();
                        }, cryptputCfg, function (progress) {
                            sframeChan.event('EV_LOADING_INFO', {
                                type: 'pad',
                                progress: progress
                            });
                        });
                        return;
                    }
                    // Start realtime outside the iframe and callback
                    startRealtime(rtConfig);
                    cb();
                });
            });

            sframeChan.on('EV_BURN_AFTER_READING', function () {
                startRealtime();
                // feedback fails for users in noDrive mode
                Utils.Feedback.send("BURN_AFTER_READING", Boolean(cfg.noDrive));
            });

            sframeChan.ready();

            Utils.Feedback.reportAppUsage();

            if (!realtime /*&& !Test.testing*/) { return; }
            if (isNewFile && cfg.useCreationScreen /* && !Test.testing */) { return; }
            if (burnAfterReading) { return; }
            //if (isNewFile && Utils.LocalStore.isLoggedIn()
            //    && AppConfig.displayCreationScreen && cfg.useCreationScreen) { return; }

            startRealtime();
        });
    };

    return common;
});

