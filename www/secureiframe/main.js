// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/components/nthen/index.js',
    '/api/config',
    'jquery',
    '/common/requireconfig.js',
    '/common/common-util.js',
    '/customize/messages.js',
], function (nThen, ApiConfig, $, RequireConfig, Util, Messages) {
    var requireConfig = RequireConfig();

    var readyEvt = Util.mkEvent(true);

    var create = function (config) {
        // Loaded in load #2
        var sframeChan;
        nThen(function (waitFor) {
            $(waitFor());
        }).nThen(function (waitFor) {
            var lang = Messages._languageUsed;
            var themeKey = 'CRYPTPAD_STORE|colortheme';
            var req = {
                cfg: requireConfig,
                req: [ '/common/loading.js' ],
                pfx: window.location.origin,
                theme: localStorage[themeKey],
                themeOS: localStorage[themeKey+'_default'],
                lang: lang
            };
            window.rc = requireConfig;
            window.apiconf = ApiConfig;
            // FIXME extra sandboxing features are temporarily disabled as I suspect this is the cause of a regression in Safari
            $('#sbox-secure-iframe')/*.attr('sandbox', 'allow-scripts allow-popups allow-modals')*/.attr('src',
                ApiConfig.httpSafeOrigin + '/secureiframe/inner.html?' + requireConfig.urlArgs +
                    '#' + encodeURIComponent(JSON.stringify(req)));

            // This is a cheap trick to avoid loading sframe-channel in parallel with the
            // loading screen setup.
            var done = waitFor();
            var onMsg = function (msg) {
                var data = typeof(msg.data) === "object" ? msg.data : JSON.parse(msg.data);
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
                    iframe.postMessage(data, ApiConfig.httpSafeOrigin);
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
                var isTemplate = config.data.isTemplate;
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
                            channel: config.data.channel,
                            hashes: config.data.hashes,
                            password: config.data.password,
                            propChannels: config.data.getPropChannels(),
                            isTemplate: isTemplate,
                            file: config.data.file,
                            devMode: localStorage.CryptPad_dev === '1',
                            secureIframe: true,
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
                    readyEvt.fire();
                });
            });
        });
        var refresh = function (data, cb) {
            readyEvt.reg(() => {
                sframeChan.event('EV_REFRESH', data);
                cb();
            });
        };
        var setTitle = function (title) {
            readyEvt.reg(() => {
                sframeChan.event('EV_IFRAME_TITLE', title);
            });
        };
        return {
            refresh: refresh,
            setTitle: setTitle
        };
    };
    return {
        create: create
    };
});
