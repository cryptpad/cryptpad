// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/bower_components/nthen/index.js',
    '/api/config',
    'jquery',
    '/common/requireconfig.js'
], function (nThen, ApiConfig, $, RequireConfig) {
    var requireConfig = RequireConfig();

    // Loaded in load #2
    var CpNfOuter;
    var Cryptpad;
    var Crypto;
    var Cryptget;

    var sframeChan;
    var secret;
    var hashes;

    nThen(function (waitFor) {
        $(waitFor());
    }).nThen(function (waitFor) {
        var req = {
            cfg: requireConfig,
            req: [ '/common/loading.js' ],
            pfx: window.location.origin
        };
        window.rc = requireConfig;
        window.apiconf = ApiConfig;
        $('#sbox-iframe').attr('src',
            ApiConfig.httpSafeOrigin + '/pad/inner.html?' + requireConfig.urlArgs +
                '#' + encodeURIComponent(JSON.stringify(req)));

        // This is a cheap trick to avoid loading sframe-channel in parallel with the
        // loading screen setup.
        var done = waitFor();
        var onMsg = function (msg) {
            var data = JSON.parse(msg.data);
            if (data.q !== 'READY') { return; }
            window.removeEventListener('message', onMsg);
            var _done = done;
            done = function () { };
            _done();
        };
        window.addEventListener('message', onMsg);

    }).nThen(function (waitFor) {
        // Load #2, the loading screen is up so grab whatever you need...
        require([
            '/common/sframe-chainpad-netflux-outer.js',
            '/common/cryptpad-common.js',
            '/bower_components/chainpad-crypto/crypto.js',
            '/common/cryptget.js',
            '/common/sframe-channel.js',
        ], waitFor(function (_CpNfOuter, _Cryptpad, _Crypto, _Cryptget, SFrameChannel) {
            CpNfOuter = _CpNfOuter;
            Cryptpad = _Cryptpad;
            Crypto = _Crypto;
            Cryptget = _Cryptget;
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
    }).nThen(function (/*waitFor*/) {
        var readOnly = secret.keys && !secret.keys.editKeyStr;
        if (!secret.keys) { secret.keys = secret.key; }
        var parsed = Cryptpad.parsePadUrl(window.location.href);
        if (!parsed.type) { throw new Error(); }
        var defaultTitle = Cryptpad.getDefaultName(parsed);
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
                        curvePublic: Cryptpad.getProxy().curvePublic,
                        netfluxId: Cryptpad.getNetwork().webChannels[0].myID,
                    },
                    priv: {
                        accountName: Cryptpad.getAccountName(),
                        origin: window.location.origin,
                        pathname: window.location.pathname,
                        readOnly: readOnly,
                        availableHashes: hashes,
                        isTemplate: Cryptpad.isTemplate(window.location.href),
                        feedbackAllowed: Cryptpad.isFeedbackAllowed()
                    }
                });
            });
        };
        Cryptpad.onDisplayNameChanged(updateMeta);
        sframeChan.onReg('EV_METADATA_UPDATE', updateMeta);

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
            Cryptpad.renamePad(newTitle, undefined, function (err) {
                if (err) { cb('ERROR'); } else { cb(); }
            });
        });

        sframeChan.on('Q_SETTINGS_SET_DISPLAY_NAME', function (newName, cb) {
            Cryptpad.setAttribute('username', newName, function (err) {
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

        CpNfOuter.start({
            sframeChan: sframeChan,
            channel: secret.channel,
            network: Cryptpad.getNetwork(),
            validateKey: secret.keys.validateKey || undefined,
            readOnly: readOnly,
            crypto: Crypto.createEncryptor(secret.keys),
            onConnect: function (wc) {
                if (readOnly) { return; }
                Cryptpad.replaceHash(Cryptpad.getEditHashFromKeys(wc.id, secret.keys));
            }
        });
    });
});
