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
        var network;
        var secret;
        var hashes;
        var CpNfOuter;
        var Cryptpad;
        var Crypto;
        var Cryptget;
        var SFrameChannel;
        var sframeChan;
        var FilePicker;
        //var Messenger;
        var Messaging;
        var Notifier;
        var Utils = {};

        nThen(function (waitFor) {
            // Load #2, the loading screen is up so grab whatever you need...
            require([
                '/common/sframe-chainpad-netflux-outer.js',
                '/common/cryptpad-common.js',
                '/bower_components/chainpad-crypto/crypto.js',
                '/common/cryptget.js',
                '/common/sframe-channel.js',
                '/filepicker/main.js',
                //'/common/common-messenger.js',
                '/common/common-messaging.js',
                '/common/common-notifier.js',
                '/common/common-hash.js',
                '/common/common-util.js',
                '/common/common-realtime.js',
                '/common/common-constants.js',
                '/common/common-feedback.js',
                '/common/outer/local-store.js',
                '/common/outer/network-config.js',
                '/bower_components/netflux-websocket/netflux-client.js',
            ], waitFor(function (_CpNfOuter, _Cryptpad, _Crypto, _Cryptget, _SFrameChannel,
            _FilePicker, /*_Messenger,*/ _Messaging, _Notifier, _Hash, _Util, _Realtime,
            _Constants, _Feedback, _LocalStore, NetConfig, Netflux) {
                CpNfOuter = _CpNfOuter;
                Cryptpad = _Cryptpad;
                Crypto = _Crypto;
                Cryptget = _Cryptget;
                SFrameChannel = _SFrameChannel;
                FilePicker = _FilePicker;
                //Messenger = _Messenger;
                Messaging = _Messaging;
                Notifier = _Notifier;
                Utils.Hash = _Hash;
                Utils.Util = _Util;
                Utils.Realtime = _Realtime;
                Utils.Constants = _Constants;
                Utils.Feedback = _Feedback;
                Utils.LocalStore = _LocalStore;

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
                Cryptpad.ready(waitFor());

                if (!cfg.newNetwork) {
                    Netflux.connect(NetConfig.getWebsocketURL()).then(waitFor(function (nw) {
                        network = nw;
                    }));
                }
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
                cfg.getSecrets(Cryptpad, Utils, waitFor(function (err, s) {
                    secret = s;
                }));
            } else {
                secret = Utils.Hash.getSecrets();
                if (!secret.channel) {
                    // New pad: create a new random channel id
                    secret.channel = Utils.Hash.createChannelId();
                }
            }
            Cryptpad.getShareHashes(secret, waitFor(function (err, h) { hashes = h; }));

        }).nThen(function () {
            var readOnly = secret.keys && !secret.keys.editKeyStr;
            if (!secret.keys) { secret.keys = secret.key; }
            var parsed = Utils.Hash.parsePadUrl(window.location.href);
            if (!parsed.type) { throw new Error(); }
            var defaultTitle = Utils.Hash.getDefaultName(parsed);
            var updateMeta = function () {
                //console.log('EV_METADATA_UPDATE');
                var metaObj, isTemplate;
                nThen(function (waitFor) {
                    Cryptpad.getMetadata(waitFor(function (err, m) {
                        if (err) { console.log(err); }
                        metaObj = m;
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
                        }
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
                Cryptpad.renamePad(newTitle, undefined, function (err) {
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
                    Cryptpad.changeDisplayName(newName, true);
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
                Messaging.inviteFromUserlist(Cryptpad, netfluxId);
                cb();
            });
            Cryptpad.onFriendRequest = function (confirmText, cb) {
                sframeChan.query('Q_INCOMING_FRIEND_REQUEST', confirmText, function (err, data) {
                    cb(data);
                });
            };
            Cryptpad.onFriendComplete = function (data) {
                sframeChan.event('EV_FRIEND_REQUEST', data);
            };

            sframeChan.on('Q_GET_FULL_HISTORY', function (data, cb) {
                var hkn = network.historyKeeper;
                var crypto = Crypto.createEncryptor(secret.keys);
                // Get the history messages and send them to the iframe
                var parse = function (msg) {
                    try {
                        return JSON.parse(msg);
                    } catch (e) {
                        return null;
                    }
                };
                var msgs = [];
                var onMsg = function (msg) {
                    var parsed = parse(msg);
                    if (parsed[0] === 'FULL_HISTORY_END') {
                        cb(msgs);
                        return;
                    }
                    if (parsed[0] !== 'FULL_HISTORY') { return; }
                    if (parsed[1] && parsed[1].validateKey) { // First message
                        return;
                    }
                    msg = parsed[1][4];
                    if (msg) {
                        msg = msg.replace(/^cp\|/, '');
                        var decryptedMsg = crypto.decrypt(msg, true);
                        msgs.push(decryptedMsg);
                    }
                };
                network.on('message', onMsg);
                network.sendto(hkn, JSON.stringify(['GET_FULL_HISTORY', secret.channel, secret.keys.validateKey]));
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
                // TODO make messenger work with async store
                /*var messenger = Messenger.messenger(Cryptpad);

                sframeChan.on('Q_CONTACTS_GET_FRIEND_LIST', function (data, cb) {
                    messenger.getFriendList(function (e, keys) {
                        cb({
                            error: e,
                            data: keys,
                        });
                    });
                });
                sframeChan.on('Q_CONTACTS_GET_MY_INFO', function (data, cb) {
                    messenger.getMyInfo(function (e, info) {
                        cb({
                            error: e,
                            data: info,
                        });
                    });
                });
                sframeChan.on('Q_CONTACTS_GET_FRIEND_INFO', function (curvePublic, cb) {
                    messenger.getFriendInfo(curvePublic, function (e, info) {
                        cb({
                            error: e,
                            data: info,
                        });
                    });
                });
                sframeChan.on('Q_CONTACTS_REMOVE_FRIEND', function (curvePublic, cb) {
                    messenger.removeFriend(curvePublic, function (e, info) {
                        cb({
                            error: e,
                            data: info,
                        });
                    });
                });

                sframeChan.on('Q_CONTACTS_OPEN_FRIEND_CHANNEL', function (curvePublic, cb) {
                    messenger.openFriendChannel(curvePublic, function (e) {
                        cb({ error: e, });
                    });
                });

                sframeChan.on('Q_CONTACTS_GET_STATUS', function (curvePublic, cb) {
                    messenger.getStatus(curvePublic, function (e, online) {
                        cb({
                            error: e,
                            data: online,
                        });
                    });
                });

                sframeChan.on('Q_CONTACTS_GET_MORE_HISTORY', function (opt, cb) {
                    messenger.getMoreHistory(opt.curvePublic, opt.sig, opt.count, function (e, history) {
                        cb({
                            error: e,
                            data: history,
                        });
                    });
                });

                sframeChan.on('Q_CONTACTS_SEND_MESSAGE', function (opt, cb) {
                    messenger.sendMessage(opt.curvePublic, opt.content, function (e) {
                        cb({
                            error: e,
                        });
                    });
                });
                sframeChan.on('Q_CONTACTS_SET_CHANNEL_HEAD', function (opt, cb) {
                    messenger.setChannelHead(opt.curvePublic, opt.sig, function (e) {
                        cb({
                            error: e
                        });
                    });
                });
                sframeChan.on('Q_CONTACTS_CLEAR_OWNED_CHANNEL', function (channel, cb) {
                    messenger.clearOwnedChannel(channel, function (e) {
                        cb({
                            error: e,
                        });
                    });
                });

                messenger.on('message', function (message) {
                    sframeChan.event('EV_CONTACTS_MESSAGE', message);
                });
                messenger.on('join', function (curvePublic, channel) {
                    sframeChan.event('EV_CONTACTS_JOIN', {
                        curvePublic: curvePublic,
                        channel: channel,
                    });
                });
                messenger.on('leave', function (curvePublic, channel) {
                    sframeChan.event('EV_CONTACTS_LEAVE', {
                        curvePublic: curvePublic,
                        channel: channel,
                    });
                });
                messenger.on('update', function (info, curvePublic) {
                    sframeChan.event('EV_CONTACTS_UPDATE', {
                        curvePublic: curvePublic,
                        info: info,
                    });
                });
                messenger.on('friend', function (curvePublic) {
                    sframeChan.event('EV_CONTACTS_FRIEND', {
                        curvePublic: curvePublic,
                    });
                });
                messenger.on('unfriend', function (curvePublic) {
                    sframeChan.event('EV_CONTACTS_UNFRIEND', {
                        curvePublic: curvePublic,
                    });
                });*/
            }

            sframeChan.ready();

            Utils.Feedback.reportAppUsage();

            if (!realtime) { return; }

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

            CpNfOuter.start({
                sframeChan: sframeChan,
                channel: secret.channel,
                network: cfg.newNetwork || network,
                validateKey: secret.keys.validateKey || undefined,
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
                    replaceHash(Utils.Hash.getEditHashFromKeys(wc.id, secret.keys));
                }
            });
        });
    };

    return common;
});

