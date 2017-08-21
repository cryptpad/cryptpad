define([
    '/api/config',
    'jquery',
    '/common/requireconfig.js'
], function (ApiConfig, $, RequireConfig) {
    $(function () {
        var req = {
            cfg: RequireConfig,
            req: [ '/common/loading.js' ],
        };
        $('#sbox-iframe').attr('src',
            ApiConfig.httpSafeOrigin + '/pad2/inner.html?' + ApiConfig.requireConf.urlArgs +
                '#' + encodeURIComponent(JSON.stringify(req)));
    });
    require([
        '/common/sframe-channel.js',
        '/common/sframe-chainpad-netflux-outer.js',
        '/bower_components/nthen/index.js',
        '/common/cryptpad-common.js',
        '/bower_components/chainpad-crypto/crypto.js'
    ], function (SFrameChannel, CpNfOuter, nThen, Cryptpad, Crypto) {
        console.log('xxx');
        var sframeChan;
        var hashes;
        nThen(function (waitFor) {
            $(waitFor());
        }).nThen(function (waitFor) {
            SFrameChannel.create($('#sbox-iframe')[0].contentWindow, waitFor(function (sfc) {
                sframeChan = sfc;
                console.log('sframe initialized');
            }));
            Cryptpad.ready(waitFor());
        }).nThen(function (waitFor) {
            Cryptpad.getShareHashes(waitFor(function (err, h) { hashes = h; }));
        }).nThen(function (waitFor) {
            var secret = Cryptpad.getSecrets();
            var readOnly = secret.keys && !secret.keys.editKeyStr;
            if (!secret.keys) { secret.keys = secret.key; }
            
            var parsed = Cryptpad.parsePadUrl(window.location.href);
            parsed.type = parsed.type.replace('pad2', 'pad');
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
                }).nThen(function (waitFor) {
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
                            availableHashes: hashes
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
});
