// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/bower_components/nthen/index.js',
    '/api/config',
    'jquery',
    '/common/requireconfig.js',
], function (nThen, ApiConfig, $, RequireConfig) {
    var requireConfig = RequireConfig();

    // Loaded in load #2
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
            ApiConfig.httpSafeOrigin + '/filepicker/inner.html?' + requireConfig.urlArgs +
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
    }).nThen(function (/*waitFor*/) {
        var Cryptpad;
        var Crypto;
        var Cryptget;
        var sframeChan;

        nThen(function (waitFor) {
            // Load #2, the loading screen is up so grab whatever you need...
            require([
                '/common/cryptpad-common.js',
                '/bower_components/chainpad-crypto/crypto.js',
                '/common/cryptget.js',
                '/common/sframe-channel.js',
            ], waitFor(function (_Cryptpad, _Crypto, _Cryptget, SFrameChannel) {
                Cryptpad = _Cryptpad;
                Crypto = _Crypto;
                Cryptget = _Cryptget;
                SFrameChannel.create($('#sbox-iframe')[0].contentWindow, waitFor(function (sfc) {
                    sframeChan = sfc;
                }));
                Cryptpad.ready(waitFor());
            }));
        }).nThen(function () {
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
                        doc: {},
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
                            feedbackAllowed: Cryptpad.isFeedbackAllowed(),
                            friends: proxy.friends || {},
                            settings: proxy.settings || {}
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

            sframeChan.on('Q_GET_PIN_LIMIT_STATUS', function (data, cb) {
                Cryptpad.isOverPinLimit(function (e, overLimit, limits) {
                    cb({
                        error: e,
                        overLimit: overLimit,
                        limits: limits
                    });
                });
            });

            sframeChan.on('Q_GET_FILES_LIST', function (data, cb) {
                Cryptpad.getSecureFilesList(function (err, data) {
                    cb({
                        error: err,
                        data: data
                    });
                });
            });
        });
    });
});
