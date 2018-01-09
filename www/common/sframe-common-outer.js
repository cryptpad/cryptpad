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
        var FilePicker;
        var Messaging;
        var Notifier;
        var Utils = {};
        var AppConfig;
        var Test;

        nThen(function (waitFor) {
            // Load #2, the loading screen is up so grab whatever you need...
            require([
                '/common/sframe-chainpad-netflux-outer.js',
                '/common/cryptpad-common.js',
                '/bower_components/chainpad-crypto/crypto.js',
                '/common/cryptget.js',
                '/common/sframe-channel.js',
                '/filepicker/main.js',
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
            ], waitFor(function (_CpNfOuter, _Cryptpad, _Crypto, _Cryptget, _SFrameChannel,
            _FilePicker,  _Messaging, _Notifier, _Hash, _Util, _Realtime,
            _Constants, _Feedback, _LocalStore, _AppConfig, _Test) {
                CpNfOuter = _CpNfOuter;
                Cryptpad = _Cryptpad;
                Crypto = _Crypto;
                Cryptget = _Cryptget;
                SFrameChannel = _SFrameChannel;
                FilePicker = _FilePicker;
                Messaging = _Messaging;
                Notifier = _Notifier;
                Utils.Hash = _Hash;
                Utils.Util = _Util;
                Utils.Realtime = _Realtime;
                Utils.Constants = _Constants;
                Utils.Feedback = _Feedback;
                Utils.LocalStore = _LocalStore;
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
                var cache = {};
                var localStore = {};
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

                SFrameChannel.create($('#sbox-iframe')[0].contentWindow, waitFor(function (sfc) {
                    sframeChan = sfc;
                }), false, { cache: cache, localStore: localStore, language: Cryptpad.getLanguage() });
                Cryptpad.ready(waitFor(), {
                    messenger: cfg.messaging,
                    driveEvents: cfg.driveEvents
                });
            }));
        }).nThen(function (waitFor) {
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

            if (cfg.getSecrets) {
                var w = waitFor();
                cfg.getSecrets(Cryptpad, Utils, waitFor(function (err, s) {
                    secret = s;
                    Cryptpad.getShareHashes(secret, function (err, h) {
                        hashes = h;
                        w();
                    });
                }));
            } else {
                secret = Utils.Hash.getSecrets();
                if (!secret.channel) {
                    // New pad: create a new random channel id
                    secret.channel = Utils.Hash.createChannelId();
                }
                Cryptpad.getShareHashes(secret, waitFor(function (err, h) { hashes = h; }));
            }
        }).nThen(function (waitFor) {
            // Check if the pad exists on server
            if (!window.location.hash) { isNewFile = true; return; }

            Cryptpad.isNewChannel(window.location.href, waitFor(function (e, isNew) {
                if (e) { return console.error(e); }
                isNewFile = Boolean(isNew);
            }));
        }).nThen(function () {
            var readOnly = secret.keys && !secret.keys.editKeyStr;
            var isNewHash = true;
            if (!secret.keys) {
                isNewHash = false;
                secret.keys = secret.key;
                readOnly = false;
            }
            var parsed = Utils.Hash.parsePadUrl(window.location.href);
            if (!parsed.type) { throw new Error(); }
            var defaultTitle = Utils.Hash.getDefaultName(parsed);
            var edPublic;
            var updateMeta = function () {
                //console.log('EV_METADATA_UPDATE');
                var metaObj, isTemplate;
                nThen(function (waitFor) {
                    Cryptpad.getMetadata(waitFor(function (err, m) {
                        if (err) { console.log(err); }
                        metaObj = m;
                        edPublic = metaObj.priv.edPublic; // needed to create an owned pad
                    }));
                    Cryptpad.isTemplate(window.location.href, waitFor(function (err, t) {
                        if (err) { console.log(err); }
                        isTemplate = t;
                    }));
                }).nThen(function (/*waitFor*/) {
                    metaObj.doc = {
                        defaultTitle: defaultTitle,
                        type: parsed.type
                    };
                    var additionalPriv = {
                        accountName: Utils.LocalStore.getAccountName(),
                        origin: window.location.origin,
                        pathname: window.location.pathname,
                        fileHost: ApiConfig.fileHost,
                        readOnly: readOnly,
                        availableHashes: hashes,
                        isTemplate: isTemplate,
                        feedbackAllowed: Utils.Feedback.state,
                        isPresent: parsed.hashData && parsed.hashData.present,
                        isEmbed: parsed.hashData && parsed.hashData.embed,
                        accounts: {
                            donateURL: Cryptpad.donateURL,
                            upgradeURL: Cryptpad.upgradeURL
                        },
                        isNewFile: isNewFile,
                        isDeleted: window.location.hash.length > 0
                    };
                    for (var k in additionalPriv) { metaObj.priv[k] = additionalPriv[k]; }

                    if (cfg.addData) {
                        cfg.addData(metaObj.priv, Cryptpad);
                    }

                    sframeChan.event('EV_METADATA_UPDATE', metaObj);
                });
            };
            Cryptpad.onMetadataChanged(updateMeta);
            sframeChan.onReg('EV_METADATA_UPDATE', updateMeta);

            Utils.LocalStore.onLogout(function () {
                sframeChan.event('EV_LOGOUT');
            });

            Test.registerOuter(sframeChan);

            // Put in the following function the RPC queries that should also work in filepicker
            var addCommonRpc = function (sframeChan) {
                sframeChan.on('Q_ANON_RPC_MESSAGE', function (data, cb) {
                    Cryptpad.anonRpcMsg(data.msg, data.content, function (err, response) {
                        cb({error: err, response: response});
                    });
                });

                sframeChan.on('Q_GET_PIN_LIMIT_STATUS', function (data, cb) {
                    Cryptpad.isOverPinLimit(function (e, overLimit, limits) {
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

            };
            addCommonRpc(sframeChan);

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
            sframeChan.on('Q_SET_PAD_TITLE_IN_DRIVE', function (newTitle, cb) {
                currentTitle = newTitle;
                setDocumentTitle();
                Cryptpad.setPadTitle(newTitle, undefined, undefined, function (err) {
                    cb(err);
                });
            });
            sframeChan.on('EV_SET_TAB_TITLE', function (newTabTitle) {
                currentTabTitle = newTabTitle;
                setDocumentTitle();
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

            sframeChan.on('EV_NOTIFY', function () {
                Notifier.notify();
            });

            sframeChan.on('Q_SET_LOGIN_REDIRECT', function (data, cb) {
                sessionStorage.redirectTo = window.location.href;
                cb();
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

            sframeChan.on('Q_SEND_FRIEND_REQUEST', function (netfluxId, cb) {
                Cryptpad.inviteFromUserlist(netfluxId, cb);
            });
            Cryptpad.messaging.onFriendRequest.reg(function (confirmText, cb) {
                sframeChan.query('Q_INCOMING_FRIEND_REQUEST', confirmText, function (err, data) {
                    cb(data);
                });
            });
            Cryptpad.messaging.onFriendComplete.reg(function (data) {
                sframeChan.event('EV_FRIEND_REQUEST', data);
            });

            sframeChan.on('Q_GET_FULL_HISTORY', function (data, cb) {
                var crypto = Crypto.createEncryptor(secret.keys);
                Cryptpad.getFullHistory({
                    channel: secret.channel,
                    validateKey: secret.keys.validateKey
                }, function (encryptedMsgs) {
                    cb(encryptedMsgs.map(function (msg) {
                        return crypto.decrypt(msg, true);
                    }));
                });
            });

            sframeChan.on('Q_GET_PAD_ATTRIBUTE', function (data, cb) {
                Cryptpad.getPadAttribute(data.key, function (e, data) {
                    cb({
                        error: e,
                        data: data
                    });
                });
            });
            sframeChan.on('Q_SET_PAD_ATTRIBUTE', function (data, cb) {
                Cryptpad.setPadAttribute(data.key, data.value, function (e) {
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

            sframeChan.on('Q_SESSIONSTORAGE_PUT', function (data, cb) {
                sessionStorage[data.key] = data.value;
                cb();
            });


            // Present mode URL
            sframeChan.on('Q_PRESENT_URL_GET_VALUE', function (data, cb) {
                var parsed = Utils.Hash.parsePadUrl(window.location.href);
                cb(parsed.hashData && parsed.hashData.present);
            });
            sframeChan.on('EV_PRESENT_URL_SET_VALUE', function (data) {
                var parsed = Utils.Hash.parsePadUrl(window.location.href);
                window.location.href = parsed.getUrl({
                    embed: parsed.hashData.embed,
                    present: data
                });
            });


            // File upload
            var onFileUpload = function (sframeChan, data, cb) {
                require(['/common/outer/upload.js'], function (Files) {
                    var sendEvent = function (data) {
                        sframeChan.event("EV_FILE_UPLOAD_STATE", data);
                    };
                    var updateProgress = function (progressValue) {
                        sendEvent({
                            progress: progressValue
                        });
                    };
                    var onComplete = function (href) {
                        sendEvent({
                            complete: true,
                            href: href
                        });
                    };
                    var onError = function (e) {
                        sendEvent({
                            error: e
                        });
                    };
                    var onPending = function (cb) {
                        sframeChan.query('Q_CANCEL_PENDING_FILE_UPLOAD', null, function (err, data) {
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

            // File picker
            var FP = {};
            var initFilePicker = function (cfg) {
                if (!FP.$iframe) {
                    var config = {};
                    config.onFilePicked = function (data) {
                        sframeChan.event('EV_FILE_PICKED', data);
                    };
                    config.onClose = function () {
                        FP.$iframe.hide();
                    };
                    config.onFileUpload = onFileUpload;
                    config.types = cfg;
                    config.addCommonRpc = addCommonRpc;
                    config.modules = {
                        Cryptpad: Cryptpad,
                        SFrameChannel: SFrameChannel,
                        Utils: Utils
                    };
                    FP.$iframe = $('<iframe>', {id: 'sbox-filePicker-iframe'}).appendTo($('body'));
                    FP.picker = FilePicker.create(config);
                } else {
                    FP.$iframe.show();
                    FP.picker.refresh(cfg);
                }
                if (cfg.hidden) {
                    FP.$iframe.hide();
                    return;
                }
                FP.$iframe.focus();
            };
            sframeChan.on('EV_FILE_PICKER_OPEN', function (data) {
                initFilePicker(data);
            });

            sframeChan.on('Q_TEMPLATE_USE', function (href, cb) {
                Cryptpad.useTemplate(href, Cryptget, cb);
            });
            sframeChan.on('Q_TEMPLATE_EXIST', function (type, cb) {
                Cryptpad.listTemplates(type, function (err, templates) {
                    cb(templates.length > 0);
                });
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

            sframeChan.on('Q_TAGS_GET', function (data, cb) {
                Cryptpad.getPadTags(data, function (err, data) {
                    cb({
                        error: err,
                        data: data
                    });
                });
            });

            sframeChan.on('EV_TAGS_SET', function (data) {
                Cryptpad.resetTags(data.href, data.tags);
            });

            sframeChan.on('Q_PIN_GET_USAGE', function (data, cb) {
                Cryptpad.isOverPinLimit(function (err, overLimit, data) {
                    cb({
                        error: err,
                        data: data
                    });
                });
            });

            sframeChan.on('Q_LANGUAGE_SET', function (data, cb) {
                Cryptpad.setLanguage(data, cb);
            });

            if (cfg.addRpc) {
                cfg.addRpc(sframeChan, Cryptpad, Utils);
            }

            if (cfg.messaging) {
                sframeChan.on('Q_CONTACTS_GET_FRIEND_LIST', function (data, cb) {
                    Cryptpad.messenger.getFriendList(cb);
                });
                sframeChan.on('Q_CONTACTS_GET_MY_INFO', function (data, cb) {
                    Cryptpad.messenger.getMyInfo(cb);
                });
                sframeChan.on('Q_CONTACTS_GET_FRIEND_INFO', function (curvePublic, cb) {
                    Cryptpad.messenger.getFriendInfo(curvePublic, cb);
                });
                sframeChan.on('Q_CONTACTS_REMOVE_FRIEND', function (curvePublic, cb) {
                    Cryptpad.messenger.removeFriend(curvePublic, cb);
                });

                sframeChan.on('Q_CONTACTS_OPEN_FRIEND_CHANNEL', function (curvePublic, cb) {
                    Cryptpad.messenger.openFriendChannel(curvePublic, cb);
                });

                sframeChan.on('Q_CONTACTS_GET_STATUS', function (curvePublic, cb) {
                    Cryptpad.messenger.getFriendStatus(curvePublic, cb);
                });

                sframeChan.on('Q_CONTACTS_GET_MORE_HISTORY', function (opt, cb) {
                    Cryptpad.messenger.getMoreHistory(opt, cb);
                });

                sframeChan.on('Q_CONTACTS_SEND_MESSAGE', function (opt, cb) {
                    Cryptpad.messenger.sendMessage(opt, cb);
                });
                sframeChan.on('Q_CONTACTS_SET_CHANNEL_HEAD', function (opt, cb) {
                    Cryptpad.messenger.setChannelHead(opt, cb);
                });
                sframeChan.on('Q_CONTACTS_CLEAR_OWNED_CHANNEL', function (channel, cb) {
                    Cryptpad.clearOwnedChannel(channel, cb);
                });

                Cryptpad.messenger.onMessageEvent.reg(function (data) {
                    sframeChan.event('EV_CONTACTS_MESSAGE', data);
                });
                Cryptpad.messenger.onJoinEvent.reg(function (data) {
                    sframeChan.event('EV_CONTACTS_JOIN', data);
                });
                Cryptpad.messenger.onLeaveEvent.reg(function (data) {
                    sframeChan.event('EV_CONTACTS_LEAVE', data);
                });
                Cryptpad.messenger.onUpdateEvent.reg(function (data) {
                    sframeChan.event('EV_CONTACTS_UPDATE', data);
                });
                Cryptpad.messenger.onFriendEvent.reg(function (data) {
                    sframeChan.event('EV_CONTACTS_FRIEND', data);
                });
                Cryptpad.messenger.onUnfriendEvent.reg(function (data) {
                    sframeChan.event('EV_CONTACTS_UNFRIEND', data);
                });
            }



            // Join the netflux channel
            var rtStarted = false;
            var startRealtime = function (rtConfig) {
                rtConfig = rtConfig || {};
                rtStarted = true;
                var replaceHash = function (hash) {
                    if (window.history && window.history.replaceState) {
                        if (!/^#/.test(hash)) { hash = '#' + hash; }
                        void window.history.replaceState({}, window.document.title, hash);
                        if (typeof(window.onhashchange) === 'function') {
                            window.onhashchange();
                        }
                        return;
                    }
                    window.location.hash = hash;
                };

                var cfg = {
                    sframeChan: sframeChan,
                    channel: secret.channel,
                    padRpc: Cryptpad.padRpc,
                    validateKey: secret.keys.validateKey || undefined,
                    isNewHash: isNewHash,
                    readOnly: readOnly,
                    crypto: Crypto.createEncryptor(secret.keys),
                    onConnect: function (wc) {
                        if (window.location.hash && window.location.hash !== '#') {
                            window.location = parsed.getUrl({
                                present: parsed.hashData.present,
                                embed: parsed.hashData.embed
                            });
                            return;
                        }
                        if (readOnly || cfg.noHash) { return; }
                        replaceHash(Utils.Hash.getEditHashFromKeys(wc, secret.keys));
                    }
                };
                Object.keys(rtConfig).forEach(function (k) {
                    cfg[k] = rtConfig[k];
                });
                CpNfOuter.start(cfg);
            };

            sframeChan.on('Q_CREATE_PAD', function (data, cb) {
                if (!isNewFile || rtStarted) { return; }
                // Create a new hash
                var newHash = Utils.Hash.createRandomHash();
                secret = Utils.Hash.getSecrets(parsed.type, newHash);

                // Update the hash in the address bar
                var ohc = window.onhashchange;
                window.onhashchange = function () {};
                window.location.hash = newHash;
                window.onhashchange = ohc;
                ohc({reset: true});

                // Update metadata values and send new metadata inside
                parsed = Utils.Hash.parsePadUrl(window.location.href);
                defaultTitle = Utils.Hash.getDefaultName(parsed);
                readOnly = false;
                updateMeta();

                var rtConfig = {};
                if (data.owned) {
                    rtConfig.owners = [edPublic];
                }
                if (data.expire) {
                    rtConfig.expire = data.expire;
                }
                if (data.template) {
                    // Pass rtConfig to useTemplate because Cryptput will create the file and
                    // we need to have the owners and expiration time in the first line on the
                    // server
                    Cryptpad.useTemplate(data.template, Cryptget, function () {
                        startRealtime();
                        cb();
                    }, rtConfig);
                    return;
                }
                // Start realtime outside the iframe and callback
                startRealtime(rtConfig);
                cb();
            });

            sframeChan.ready();

            Utils.Feedback.reportAppUsage();

            if (!realtime) { return; }
            if (isNewFile && Utils.LocalStore.isLoggedIn()
                && AppConfig.displayCreationScreen && cfg.useCreationScreen) { return; }

            startRealtime();
        });
    };

    return common;
});

