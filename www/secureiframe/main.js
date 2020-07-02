// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/bower_components/nthen/index.js',
    '/api/config',
    'jquery',
    '/common/requireconfig.js',
], function (nThen, ApiConfig, $, RequireConfig) {
    var requireConfig = RequireConfig();

    var ready = false;

    var create = function (config) {
        // Loaded in load #2
        var sframeChan;
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
            $('#sbox-secure-iframe').attr('src',
                ApiConfig.httpSafeOrigin + '/secureiframe/inner.html?' + requireConfig.urlArgs +
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
            var Cryptpad = config.modules.Cryptpad;
            var Utils = config.modules.Utils;

            nThen(function (waitFor) {
                // The inner iframe tries to get some data from us every ms (cache, store...).
                // It will send a "READY" message and wait for our answer with the correct txid.
                // First, we have to answer to this message, otherwise we're going to block
                // sframe-boot.js. Then we can start the channel.
                var msgEv = Utils.Util.mkEvent();
                var iframe = $('#sbox-secure-iframe')[0].contentWindow;
                var postMsg = function (data) {
                    iframe.postMessage(data, '*');
                };
                var w = waitFor();
                var whenReady = function (msg) {
                    if (msg.source !== iframe) { return; }
                    var data = JSON.parse(msg.data);
                    if (!data.txid) { return; }
                    // Remove the listener once we've received the READY message
                    window.removeEventListener('message', whenReady);
                    // Answer with the requested data
                    postMsg(JSON.stringify({ txid: data.txid, language: Cryptpad.getLanguage(), localStore: window.localStore, cache: window.cpCache }));

                    // Then start the channel
                    window.addEventListener('message', function (msg) {
                        if (msg.source !== iframe) { return; }
                        msgEv.fire(msg);
                    });
                    config.modules.SFrameChannel.create(msgEv, postMsg, waitFor(function (sfc) {
                        sframeChan = sfc;
                    }));
                    w();
                };
                window.addEventListener('message', whenReady);
            }).nThen(function () {
                var updateMeta = function () {
                    //console.log('EV_METADATA_UPDATE');
                    var metaObj;
                    nThen(function (waitFor) {
                        Cryptpad.getMetadata(waitFor(function (err, n) {
                            if (err) {
                                waitFor.abort();
                                return void console.log(err);
                            }
                            metaObj = n;
                        }));
                    }).nThen(function (/*waitFor*/) {
                        metaObj.doc = {};
                        var additionalPriv = {
                            app: config.data.app,
                            fileHost: ApiConfig.fileHost,
                            loggedIn: Utils.LocalStore.isLoggedIn(),
                            origin: window.location.origin,
                            pathname: window.location.pathname,
                            feedbackAllowed: Utils.Feedback.state,
                            hashes: config.data.hashes,
                            password: config.data.password,
                            isTemplate: config.data.isTemplate,
                            file: config.data.file,
                        };
                        for (var k in additionalPriv) { metaObj.priv[k] = additionalPriv[k]; }

                        sframeChan.event('EV_METADATA_UPDATE', metaObj);
                    });
                };
                Cryptpad.onMetadataChanged(updateMeta);
                sframeChan.onReg('EV_METADATA_UPDATE', updateMeta);

                config.addCommonRpc(sframeChan, true);

                Cryptpad.padRpc.onMetadataEvent.reg(function (data) {
                    sframeChan.event('EV_RT_METADATA', data);
                });

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

                sframeChan.on('Q_GET_FILES_LIST', function (types, cb) {
                    Cryptpad.getSecureFilesList(types, function (err, data) {
                        cb({
                            error: err,
                            data: data
                        });
                    });
                });

                sframeChan.on('EV_SECURE_ACTION', function (data) {
                    config.onAction(data);
                });
                sframeChan.on('Q_UPLOAD_FILE', function (data, cb) {
                    config.onFileUpload(sframeChan, data, cb);
                });

                sframeChan.on('EV_SECURE_IFRAME_CLOSE', function () {
                    config.onClose();
                });

                sframeChan.onReady(function () {
                    if (ready === true) { return; }
                    if (typeof ready === "function") {
                        ready();
                    }
                    ready = true;
                });
            });
        });
        var refresh = function (data, cb) {
            if (!ready) {
                ready = function () {
                    refresh(data, cb);
                };
                return;
            }
            sframeChan.event('EV_REFRESH', data);
            cb();
        };
        return {
            refresh: refresh
        };
    };
    return {
        create: create
    };
});
