// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/bower_components/nthen/index.js',
    '/api/config',
    'jquery',
], function (nThen, ApiConfig, $) {
    var common = {};

    common.start = function () {
        var secret;
        var hashes;
        var CpNfOuter;
        var Cryptpad;
        var Crypto;
        var Cryptget;
        var sframeChan;
        var FilePicker;

        nThen(function (waitFor) {
            // Load #2, the loading screen is up so grab whatever you need...
            require([
                '/common/sframe-chainpad-netflux-outer.js',
                '/common/cryptpad-common.js',
                '/bower_components/chainpad-crypto/crypto.js',
                '/common/cryptget.js',
                '/common/sframe-channel.js',
                '/filepicker/main.js',
            ], waitFor(function (_CpNfOuter, _Cryptpad, _Crypto, _Cryptget, SFrameChannel,
            _FilePicker) {
                CpNfOuter = _CpNfOuter;
                Cryptpad = _Cryptpad;
                Crypto = _Crypto;
                Cryptget = _Cryptget;
                FilePicker = _FilePicker;
                SFrameChannel.create($('#sbox-iframe')[0].contentWindow, waitFor(function (sfc) {
                    sframeChan = sfc;
                }));
                Cryptpad.ready(waitFor());
            }));
        }).nThen(function (waitFor) {
            secret = Cryptpad.getSecrets();
            if (!secret.channel) {
                // New pad: create a new random channel id
                secret.channel = Cryptpad.createChannelId();
            }
            Cryptpad.getShareHashes(secret, waitFor(function (err, h) { hashes = h; }));
        }).nThen(function () {
            var readOnly = secret.keys && !secret.keys.editKeyStr;
            if (!secret.keys) { secret.keys = secret.key; }
            var parsed = Cryptpad.parsePadUrl(window.location.href);
            if (!parsed.type) { throw new Error(); }
            var defaultTitle = Cryptpad.getDefaultName(parsed);
            var proxy = Cryptpad.getProxy();
            var updateMeta = function () {
                //console.log('EV_METADATA_UPDATE');
                var name;
                nThen(function (waitFor) {
                    Cryptpad.getLastName(waitFor(function (err, n) {
                        if (err) { console.log(err); }
                        name = n;
                    }));
                }).nThen(function (/*waitFor*/) {
                    sframeChan.event('EV_METADATA_UPDATE', {
                        doc: {
                            defaultTitle: defaultTitle,
                            type: parsed.type
                        },
                        user: {
                            name: name,
                            uid: Cryptpad.getUid(),
                            avatar: Cryptpad.getAvatarUrl(),
                            profile: Cryptpad.getProfileUrl(),
                            curvePublic: proxy.curvePublic,
                            netfluxId: Cryptpad.getNetwork().webChannels[0].myID,
                        },
                        priv: {
                            accountName: Cryptpad.getAccountName(),
                            origin: window.location.origin,
                            pathname: window.location.pathname,
                            readOnly: readOnly,
                            availableHashes: hashes,
                            isTemplate: Cryptpad.isTemplate(window.location.href),
                            feedbackAllowed: Cryptpad.isFeedbackAllowed(),
                            friends: proxy.friends || {},
                            settings: proxy.settings || {},
                            isPresent: parsed.hashData && parsed.hashData.present,
                            isEmbed: parsed.hashData && parsed.hashData.embed,
                        }
                    });
                });
            };
            Cryptpad.onDisplayNameChanged(updateMeta);
            sframeChan.onReg('EV_METADATA_UPDATE', updateMeta);
            proxy.on('change', 'settings', updateMeta);

            Cryptpad.onError(function (info) {
                console.log('error');
                console.log(info);
                if (info && info.type === "store") {
                    //onConnectError();
                }
            });

            sframeChan.on('Q_ANON_RPC_MESSAGE', function (data, cb) {
                Cryptpad.anonRpcMsg(data.msg, data.content, function (err, response) {
                    cb({error: err, response: response});
                });
            });

            sframeChan.on('Q_SET_PAD_TITLE_IN_DRIVE', function (newTitle, cb) {
                document.title = newTitle;
                Cryptpad.renamePad(newTitle, undefined, function (err) {
                    if (err) { cb('ERROR'); } else { cb(); }
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
                    Cryptpad.changeDisplayName(newName, true);
                    cb();
                });
            });

            sframeChan.on('Q_LOGOUT', function (data, cb) {
                Cryptpad.logout(cb);
            });

            sframeChan.on('EV_NOTIFY', function () {
                Cryptpad.notify();
            });

            sframeChan.on('Q_SET_LOGIN_REDIRECT', function (data, cb) {
                sessionStorage.redirectTo = window.location.href;
                cb();
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

            sframeChan.on('Q_MOVE_TO_TRASH', function (data, cb) {
                Cryptpad.moveToTrash(cb);
            });

            sframeChan.on('Q_SAVE_AS_TEMPLATE', function (data, cb) {
                Cryptpad.saveAsTemplate(Cryptget.put, data, cb);
            });

            sframeChan.on('Q_SEND_FRIEND_REQUEST', function (netfluxId, cb) {
                Cryptpad.inviteFromUserlist(Cryptpad, netfluxId);
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
                var network = Cryptpad.getNetwork();
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
                var onMsg = function (msg) {
                    var parsed = parse(msg);
                    if (parsed[0] === 'FULL_HISTORY_END') {
                        console.log('END');
                        cb();
                        return;
                    }
                    if (parsed[0] !== 'FULL_HISTORY') { return; }
                    if (parsed[1] && parsed[1].validateKey) { // First message
                        secret.keys.validateKey = parsed[1].validateKey;
                        return;
                    }
                    msg = parsed[1][4];
                    if (msg) {
                        msg = msg.replace(/^cp\|/, '');
                        var decryptedMsg = crypto.decrypt(msg, secret.keys.validateKey);
                        sframeChan.event('EV_RT_HIST_MESSAGE', decryptedMsg);
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


            var onFileUpload = function (sframeChan, data, cb) {
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
                Cryptpad.uploadFileSecure(data, data.noStore, Cryptpad, updateProgress, onComplete, onError, onPending);
                cb();
            };
            sframeChan.on('Q_UPLOAD_FILE', function (data, cb) {
                onFileUpload(sframeChan, data, cb);
            });

            var FP = {};
            var initFilePicker = function (types) {
                var config = {};
                config.onFilePicked = function (data) {
                    sframeChan.event('EV_FILE_PICKED', data);
                };
                config.onClose = function () {
                    FP.$iframe.hide();
                };
                config.onFileUpload = onFileUpload;
                config.types = types;
                if (!FP.$iframe) {
                    FP.$iframe = $('<iframe>', {id: 'sbox-filePicker-iframe'}).appendTo($('body'));
                    FP.picker = FilePicker.create(config);
                } else {
                    FP.$iframe.show();
                    FP.picker.refresh(types);
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
                var hasTemplate = Cryptpad.listTemplates(type).length > 0;
                cb(hasTemplate);
            });

            CpNfOuter.start({
                sframeChan: sframeChan,
                channel: secret.channel,
                network: Cryptpad.getNetwork(),
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
                    if (readOnly) { return; }
                    Cryptpad.replaceHash(Cryptpad.getEditHashFromKeys(wc.id, secret.keys));
                }
            });
            Cryptpad.reportAppUsage();
        });
    };

    return common;
});

