// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/bower_components/nthen/index.js',
    '/api/config',
    'jquery',
], function (nThen, ApiConfig, $) {
    var common = {};

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
        var Messaging;
        var Notifier;
        var Utils = {
            nThen: nThen
        };
        var AppConfig;
        var Test;
        var password;
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
                '/bower_components/chainpad-crypto/crypto.js',
                '/common/cryptget.js',
                '/common/outer/worker-channel.js',
                '/secureiframe/main.js',
                '/common/common-messaging.js',
                '/common/common-notifier.js',
                '/common/common-hash.js',
                '/common/common-util.js',
                '/common/common-realtime.js',
                '/common/common-constants.js',
                '/common/common-feedback.js',
                '/common/outer/local-store.js',
                '/customize/application_config.js',
                '/common/test.js',
                '/common/userObject.js',
            ], waitFor(function (_CpNfOuter, _Cryptpad, _Crypto, _Cryptget, _SFrameChannel,
            _SecureIframe, _Messaging, _Notifier, _Hash, _Util, _Realtime,
            _Constants, _Feedback, _LocalStore, _AppConfig, _Test, _UserObject) {
                CpNfOuter = _CpNfOuter;
                Cryptpad = _Cryptpad;
                Crypto = Utils.Crypto = _Crypto;
                Cryptget = _Cryptget;
                SFrameChannel = _SFrameChannel;
                SecureIframe = _SecureIframe;
                Messaging = _Messaging;
                Notifier = _Notifier;
                Utils.Hash = _Hash;
                Utils.Util = _Util;
                Utils.Realtime = _Realtime;
                Utils.Constants = _Constants;
                Utils.Feedback = _Feedback;
                Utils.LocalStore = _LocalStore;
                Utils.UserObject = _UserObject;
                AppConfig = _AppConfig;
                Test = _Test;

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
                    iframe.postMessage(data, '*');
                };
                var whenReady = waitFor(function (msg) {
                    if (msg.source !== iframe) { return; }
                    var data = JSON.parse(msg.data);
                    if (!data.txid) { return; }
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
                    }));
                });
                window.addEventListener('message', whenReady);

                Cryptpad.loading.onDriveEvent.reg(function (data) {
                    if (sframeChan) { sframeChan.event('EV_LOADING_INFO', data); }
                });

                Cryptpad.ready(waitFor(function () {
                    if (sframeChan) {
                        sframeChan.event('EV_LOADING_INFO', {
                            state: -1
                        });
                    }
                }), {
                    driveEvents: cfg.driveEvents,
                    currentPad: currentPad
                });

                if (window.history && window.history.replaceState && currentPad.hash) {
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
                    localStorage['CRYPTPAD_CACHE|' + k] = x[k];
                });
            });
            sframeChan.on('EV_LOCALSTORE_PUT', function (x) {
                Object.keys(x).forEach(function (k) {
                    if (typeof(x[k]) === "undefined") {
                        delete localStorage['CRYPTPAD_STORE|' + k];
                        return;
                    }
                    localStorage['CRYPTPAD_STORE|' + k] = x[k];
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
                            var ohc = window.onhashchange;
                            window.onhashchange = function () {};
                            window.location.href = renderedParsed.getUrl(opts);
                            window.onhashchange = ohc;
                            ohc({reset: true});
                        }
                    }));
                };

                if (!parsed.hashData) { // No hash, no need to check for a password
                    return void todo();
                }

                // We now need to check if there is a password and if we know the correct password.
                // We'll use getFileSize and isNewChannel to detect incorrect passwords.

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
                                cb(false);
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
                                cb(true);
                            }
                        };
                        if (parsed.type === "file") {
                            // `isNewChannel` doesn't work for files (not a channel)
                            // `getFileSize` is not adapted to channels because of metadata
                            Cryptpad.getFileSize(currentPad.href, password, function (e, size) {
                                next(e, size === 0);
                            });
                            return;
                        }
                        // Not a file, so we can use `isNewChannel`
                        Cryptpad.isNewChannel(currentPad.href, password, next);
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
                        if (edit && !res.href) {
                            newHref = res.roHref;
                        }
                        expire = res.expire;
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
                    Cryptpad.getPadAttribute('title', w(function (err, data) {
                        stored = (!err && typeof (data) === "string");
                    }));
                    Cryptpad.getPadAttribute('password', w(function (err, val) {
                        password = val;
                    }), parsed.getUrl());
                }).nThen(function (w) {
                    if (!password && !stored && sessionStorage.newPadPassword) {
                        passwordCfg.value = sessionStorage.newPadPassword;
                        delete sessionStorage.newPadPassword;
                    }

                    if (parsed.type === "file") {
                        // `isNewChannel` doesn't work for files (not a channel)
                        // `getFileSize` is not adapted to channels because of metadata
                        Cryptpad.getFileSize(currentPad.href, password, w(function (e, size) {
                            if (size !== 0) { return void todo(); }
                            // Wrong password or deleted file?
                            askPassword(true, passwordCfg);
                        }));
                        return;
                    }
                    // Not a file, so we can use `isNewChannel`
                    Cryptpad.isNewChannel(currentPad.href, password, w(function(e, isNew) {
                        if (isNew && expire && expire < (+new Date())) {
                            sframeChan.event("EV_EXPIRED_ERROR");
                            waitFor.abort();
                            return;
                        }
                        if (!isNew) { return void todo(); }
                        if (parsed.hashData.mode === 'view' && (password || !parsed.hashData.password)) {
                            // Error, wrong password stored, the view seed has changed with the password
                            // password will never work
                            sframeChan.event("EV_PAD_PASSWORD_ERROR");
                            waitFor.abort();
                            return;
                        }
                        if (!stored && !parsed.hashData.password) {
                            // We've received a link without /p/ and it doesn't work without a password: abort
                            return void todo();
                        }
                        // Wrong password or deleted file?
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
                // (we use isNewChannel to test the password...)
                Cryptpad.isNewChannel(currentPad.href, password, waitFor(function (e, isNew) {
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
            var forceCreationScreen = cfg.useCreationScreen &&
                                      sessionStorage[Utils.Constants.displayPadCreationScreen];
            delete sessionStorage[Utils.Constants.displayPadCreationScreen];
            var isSafe = ['debug', 'profile', 'drive', 'teams'].indexOf(currentPad.app) !== -1;
            var updateMeta = function () {
                //console.log('EV_METADATA_UPDATE');
                var metaObj;
                nThen(function (waitFor) {
                    Cryptpad.getMetadata(waitFor(function (err, m) {
                        if (err) { console.log(err); }
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
                    var additionalPriv = {
                        app: parsed.type,
                        loggedIn: Utils.LocalStore.isLoggedIn(),
                        origin: window.location.origin,
                        pathname: window.location.pathname,
                        fileHost: ApiConfig.fileHost,
                        readOnly: readOnly,
                        isTemplate: isTemplate,
                        feedbackAllowed: Utils.Feedback.state,
                        isPresent: parsed.hashData && parsed.hashData.present,
                        isEmbed: parsed.hashData && parsed.hashData.embed,
                        isHistoryVersion: parsed.hashData && parsed.hashData.versionHash,
                        accounts: {
                            donateURL: Cryptpad.donateURL,
                            upgradeURL: Cryptpad.upgradeURL
                        },
                        isNewFile: isNewFile,
                        isDeleted: isNewFile && currentPad.hash.length > 0,
                        forceCreationScreen: forceCreationScreen,
                        password: password,
                        channel: secret.channel,
                        enableSF: localStorage.CryptPad_SF === "1", // TODO to remove when enabled by default
                        devMode: localStorage.CryptPad_dev === "1",
                        fromFileData: Cryptpad.fromFileData ? {
                            title: Cryptpad.fromFileData.title
                        } : undefined,
                        burnAfterReading: burnAfterReading,
                        storeInTeam: Cryptpad.initialTeam || (Cryptpad.initialPath ? -1 : undefined)
                    };
                    if (window.CryptPad_newSharedFolder) {
                        additionalPriv.newSharedFolder = window.CryptPad_newSharedFolder;
                    }
                    if (Utils.Constants.criticalApps.indexOf(parsed.type) === -1 &&
                          AppConfig.availablePadTypes.indexOf(parsed.type) === -1) {
                        additionalPriv.disabledApp = true;
                    }
                    if (!Utils.LocalStore.isLoggedIn() &&
                        AppConfig.registeredOnlyTypes.indexOf(parsed.type) !== -1 &&
                        parsed.type !== "file") {
                        additionalPriv.registeredOnly = true;
                    }

                    if (isSafe) {
                        additionalPriv.hashes = hashes;
                    }

                    for (var k in additionalPriv) { metaObj.priv[k] = additionalPriv[k]; }

                    if (cfg.addData) {
                        cfg.addData(metaObj.priv, Cryptpad, metaObj.user);
                    }

                    sframeChan.event('EV_METADATA_UPDATE', metaObj);
                });
            };
            Cryptpad.onMetadataChanged(updateMeta);
            sframeChan.onReg('EV_METADATA_UPDATE', updateMeta);

            Utils.LocalStore.onLogin(function () {
                var ohc = window.onhashchange;
                window.onhashchange = function () {};
                window.location.hash = currentPad.hash;
                window.onhashchange = ohc;
                ohc({reset: true});
            });
            Utils.LocalStore.onLogout(function () {
                var ohc = window.onhashchange;
                window.onhashchange = function () {};
                window.location.hash = currentPad.hash;
                window.onhashchange = ohc;
                ohc({reset: true});
                sframeChan.event('EV_LOGOUT');
            });

            Test.registerOuter(sframeChan);

            Cryptpad.onNewVersionReconnect.reg(function () {
                sframeChan.event("EV_NEW_VERSION");
            });



            // Put in the following function the RPC queries that should also work in filepicker
            var addCommonRpc = function (sframeChan, safe) {
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

                sframeChan.on('Q_SET_LOGIN_REDIRECT', function (data, cb) {
                    sessionStorage.redirectTo = currentPad.href;
                    cb();
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

                sframeChan.on('EV_OPEN_URL', function (url) {
                    if (url) {
                        window.open(url);
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
                        if (metadata) { return; }

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

                // REQUEST_ACCESS is used both to check IF we can contact an owner (send === false)
                // AND also to send the request if we want (send === true)
                sframeChan.on('Q_REQUEST_ACCESS', function (data, cb) {
                    if (readOnly && hashes.editHash) {
                        return void cb({error: 'ALREADYKNOWN'});
                    }
                    var send = data.send;
                    var metadata = data.metadata;
                    var owner, owners;
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
                        // If it's is an older owned pad, check if the owner is a friend
                        // or an acquaintance (from async-store directly in requestAccess)
                        var todo = function (obj) {
                            owners = obj.owners;

                            var mailbox;
                            // Get the first available mailbox (the field can be an string or an object)
                            // TODO maybe we should send the request to all the owners?
                            if (typeof (obj.mailbox) === "string") {
                                mailbox = obj.mailbox;
                            } else if (obj.mailbox && obj.owners && obj.owners.length) {
                                mailbox = obj.mailbox[obj.owners[0]];
                            }
                            if (mailbox) {
                                try {
                                    var dataStr = crypto.decrypt(mailbox, true, true);
                                    var data = JSON.parse(dataStr);
                                    if (!data.notifications || !data.curvePublic) { return; }
                                    owner = data;
                                } catch (e) { console.error(e); }
                            }
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
                        // If there is no mailbox, we'll have to check if an owner is a friend in the worker
                        if (!send) { return void cb({state: Boolean(owner)}); }

                        Cryptpad.padRpc.requestAccess({
                            send: send,
                            channel: _secret.channel,
                            owner: owner,
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
            };
            addCommonRpc(sframeChan, isSafe);

            var currentTitle;
            var currentTabTitle;
            var setDocumentTitle = function () {
                if (!currentTabTitle) {
                    document.title = currentTitle || 'CryptPad';
                    return;
                }
                var title = currentTabTitle.replace(/\{title\}/g, currentTitle || 'CryptPad');
                document.title = title;
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
                    forceSave: true
                };
                setPadTitle(data, cb);
            });
            sframeChan.on('Q_IS_PAD_STORED', function (data, cb) {
                Cryptpad.getPadAttribute('title', function (err, data) {
                    cb (!err && typeof (data) === "string");
                });
            });

            sframeChan.on('Q_ACCEPT_OWNERSHIP', function (data, cb) {
                var parsed = Utils.Hash.parsePadUrl(data.href);
                if (parsed.type === 'drive') {
                    // Shared folder
                    var secret = Utils.Hash.getSecrets(parsed.type, parsed.hash, data.password);
                    Cryptpad.addSharedFolder(null, secret, cb);
                } else {
                    var _data = {
                        password: data.password,
                        href: data.href,
                        channel: data.channel,
                        title: data.title,
                        owners: data.metadata.owners,
                        expire: data.metadata.expire,
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
                Cryptpad.logoutFromAll(Utils.Util.bake(Utils.LocalStore.logout, cb));
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
                Cryptpad.saveAsTemplate(Cryptget.put, data, cb);
            });

            sframeChan.on('EV_MAKE_A_COPY', function () {
                var data = {
                    channel: secret.channel,
                    href: currentPad.href,
                    password: password,
                    title: currentTitle
                };
                sessionStorage[Utils.Constants.newPadFileData] = JSON.stringify(data);
                window.open(window.location.pathname);
                setTimeout(function () {
                    delete sessionStorage[Utils.Constants.newPadFileData];
                }, 100);
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
            sframeChan.on('Q_GET_HISTORY_RANGE', function (data, cb) {
                var nSecret = secret;
                if (cfg.isDrive) {
                    // Shared folder or user hash or fs hash
                    var hash = Utils.LocalStore.getUserHash() || Utils.LocalStore.getFSHash();
                    if (data.sharedFolder) { hash = data.sharedFolder.hash; }
                    if (hash) {
                        var password = (data.sharedFolder && data.sharedFolder.password) || undefined;
                        nSecret = Utils.Hash.getSecrets('drive', hash, password);
                    }
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

            // Store
            sframeChan.on('Q_DRIVE_GETDELETED', function (data, cb) {
                Cryptpad.getDeletedPads(data, function (err, obj) {
                    if (err) { return void console.error(err); }
                    cb(obj);
                });
            });

            sframeChan.on('Q_SESSIONSTORAGE_PUT', function (data, cb) {
                if (typeof (data.value) === "undefined") {
                    delete sessionStorage[data.key];
                } else {
                    sessionStorage[data.key] = data.value;
                }
                cb();
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
                var ohc = window.onhashchange;
                window.onhashchange = function () {};
                window.location.href = hiddenParsed.getUrl(opts);
                window.onhashchange = ohc;
                ohc({reset: true});
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
            var SecureModal = {};
            // Create or display the iframe and modal
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
                        hashes: hashes,
                        password: password,
                        isTemplate: isTemplate
                    };
                    config.addCommonRpc = addCommonRpc;
                    config.modules = {
                        Cryptpad: Cryptpad,
                        SFrameChannel: SFrameChannel,
                        Utils: Utils
                    };
                    SecureModal.$iframe = $('<iframe>', {id: 'sbox-secure-iframe'}).appendTo($('body'));
                    SecureModal.modal = SecureIframe.create(config);
                }
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

            sframeChan.on('Q_TEMPLATE_USE', function (data, cb) {
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
                        cb({data: res});
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

            sframeChan.on('Q_PIN_GET_USAGE', function (teamId, cb) {
                Cryptpad.isOverPinLimit(teamId, function (err, overLimit, data) {
                    cb({
                        error: err,
                        data: data
                    });
                });
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

            sframeChan.on('Q_WRITE_LOGIN_BLOCK', function (data, cb) {
                Cryptpad.writeLoginBlock(data, cb);
            });

            sframeChan.on('Q_REMOVE_LOGIN_BLOCK', function (data, cb) {
                Cryptpad.removeLoginBlock(data, cb);
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
                var todo = function () {
                    data.opts.network = cgNetwork;
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
            sframeChan.on('EV_CRYPTGET_DISCONNECT', function () {
                if (!cgNetwork) { return; }
                cgNetwork.disconnect();
                cgNetwork = undefined;
            });

            if (cfg.addRpc) {
                cfg.addRpc(sframeChan, Cryptpad, Utils);
            }

            sframeChan.on('Q_CURSOR_OPENCHANNEL', function (data, cb) {
                Cryptpad.cursor.execCommand({
                    cmd: 'INIT_CURSOR',
                    data: {
                        channel: data,
                        secret: secret
                    }
                }, cb);
            });
            Cryptpad.cursor.onEvent.reg(function (data) {
                sframeChan.event('EV_CURSOR_EVENT', data);
            });
            sframeChan.on('Q_CURSOR_COMMAND', function (data, cb) {
                Cryptpad.cursor.execCommand(data, cb);
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

            if (cfg.messaging) {
                Notifier.getPermission();

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
                            localStorage.CryptPad_chrome68 = "1";
                        });
                    }
                }
            } catch (e) {}

            // If our channel was deleted from all of our drives, sitch back to full hash
            // in the address bar
            Cryptpad.padRpc.onChannelDeleted.reg(function (channel) {
                if (channel !== secret.channel) { return; }
                var ohc = window.onhashchange;
                window.onhashchange = function () {};
                window.location.href = currentPad.href;
                window.onhashchange = ohc;
                ohc({reset: true});
            });

            // Join the netflux channel
            var rtStarted = false;
            var startRealtime = function (rtConfig) {
                rtConfig = rtConfig || {};
                rtStarted = true;

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
                var cpNfCfg = {
                    sframeChan: sframeChan,
                    channel: secret.channel,
                    versionHash: parsed.hashData && parsed.hashData.versionHash,
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
                    }
                };

                nThen(function (waitFor) {
                    if (isNewFile && cfg.owned && !currentPad.hash) {
                        Cryptpad.getMetadata(waitFor(function (err, m) {
                            cpNfCfg.owners = [m.priv.edPublic];
                        }));
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

            sframeChan.on('Q_CREATE_PAD', function (data, cb) {
                if (!isNewFile || rtStarted) { return; }
                // Create a new hash
                password = data.password;
                var newHash = Utils.Hash.createRandomHash(parsed.type, password);
                secret = Utils.secret = Utils.Hash.getSecrets(parsed.type, newHash, password);
                Utils.crypto = Utils.Crypto.createEncryptor(Utils.secret.keys);

                // Update the hash in the address bar
                var ohc = window.onhashchange;
                window.onhashchange = function () {};
                window.location.hash = newHash;
                currentPad.hash = newHash;
                currentPad.href = '/' + parsed.type + '/#' + newHash;
                window.onhashchange = ohc;
                ohc({reset: true});

                // Update metadata values and send new metadata inside
                parsed = Utils.Hash.parsePadUrl(currentPad.href);
                defaultTitle = Utils.UserObject.getDefaultName(parsed);
                hashes = Utils.Hash.getHashes(secret);
                readOnly = false;
                updateMeta();

                var rtConfig = {
                    metadata: {}
                };
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
                nThen(function(waitFor) {
                    if (data.templateId) {
                        if (data.templateId === -1) {
                            initialPathInDrive = ['template'];
                            return;
                        }
                        Cryptpad.getPadData(data.templateId, waitFor(function (err, d) {
                            data.template = d.href;
                        }));
                    }
                }).nThen(function () {
                    var cryptputCfg = $.extend(true, {}, rtConfig, {password: password});
                    if (data.template) {
                        // Pass rtConfig to useTemplate because Cryptput will create the file and
                        // we need to have the owners and expiration time in the first line on the
                        // server
                        Cryptpad.useTemplate({
                            href: data.template
                        }, Cryptget, function (err) {
                            if (err) {
                                // TODO: better messages in case of expired, deleted, etc.?
                                if (err === 'ERESTRICTED') {
                                    sframeChan.event('EV_RESTRICTED_ERROR');
                                } else {
                                    sframeChan.query("EV_LOADING_ERROR", "DELETED");
                                }
                                return;
                            }
                            startRealtime();
                            cb();
                        }, cryptputCfg);
                        return;
                    }
                    // if we open a new code from a file
                    if (Cryptpad.fromFileData) {
                        Cryptpad.useFile(Cryptget, function (err) {
                            if (err) {
                                // TODO: better messages in case of expired, deleted, etc.?
                                if (err === 'ERESTRICTED') {
                                    sframeChan.event('EV_RESTRICTED_ERROR');
                                } else {
                                    sframeChan.query("EV_LOADING_ERROR", "DELETED");
                                }
                                return;
                            }
                            startRealtime();
                            cb();
                        }, cryptputCfg);
                        return;
                    }
                    // Start realtime outside the iframe and callback
                    startRealtime(rtConfig);
                    cb();
                });
            });

            sframeChan.on('EV_BURN_AFTER_READING', function () {
                startRealtime();
            });

            sframeChan.ready();

            Utils.Feedback.reportAppUsage();

            if (!realtime && !Test.testing) { return; }
            if (isNewFile && cfg.useCreationScreen && !Test.testing) { return; }
            if (burnAfterReading) { return; }
            //if (isNewFile && Utils.LocalStore.isLoggedIn()
            //    && AppConfig.displayCreationScreen && cfg.useCreationScreen) { return; }

            startRealtime();
        });
    };

    return common;
});

