// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/components/nthen/index.js',
    '/api/config',
    'jquery',
    '/common/requireconfig.js',
    '/customize/messages.js',
], function (nThen, ApiConfig, $, RequireConfig, Messages) {
    var requireConfig = RequireConfig();

    var ready = false;
    var currentCb;
    var queue = [];

    var create = function (config) {
        // Loaded in load #2
        var sframeChan;
        var Util = config.modules.Utils.Util;
        var _onReadyEvt = Util.mkEvent(true);
        var refresh = function (data, cb) {
            if (currentCb) {
                queue.push({data: data, cb: cb});
                return;
            }
            if (!ready) {
                _onReadyEvt.reg(function () {
                    refresh(data, cb);
                });
                return;
            }
            currentCb = cb;
            sframeChan.event('EV_OOIFRAME_REFRESH', data);
        };
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
            $('#sbox-oo-iframe').attr('src',
                ApiConfig.httpSafeOrigin + '/sheet/inner.html?' + requireConfig.urlArgs +
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
                var iframe = $('#sbox-oo-iframe')[0].contentWindow;
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
                            fileHost: ApiConfig.fileHost,
                            loggedIn: Utils.LocalStore.isLoggedIn(),
                            origin: window.location.origin,
                            pathname: window.location.pathname,
                            feedbackAllowed: Utils.Feedback.state,
                            secureIframe: true,
                            supportsWasm: Utils.Util.supportsWasm()
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

                sframeChan.on('EV_OOIFRAME_DONE', function (data) {
                    if (queue.length) {
                        setTimeout(function () {
                            var first = queue.shift();
                            refresh(first.data, first.cb);
                        });
                    }
                    if (!currentCb) { return; }
                    currentCb(data);
                    currentCb = undefined;
                });

                // X2T
                sframeChan.on('Q_OO_CONVERT', function (obj, cb) {
                    obj.modal = 'x2t';
                    Utils.initUnsafeIframe(obj, cb);
                });

                sframeChan.onReady(function () {
                    if (ready === true) { return; }
                    ready = true;
                    _onReadyEvt.fire();
                });
            });
        });
        return {
            refresh: refresh
        };
    };
    return {
        create: create
    };
});
