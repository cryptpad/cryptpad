// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/components/nthen/index.js',
    '/api/config',
    '/common/dom-ready.js',
    '/common/common-hash.js',
    '/common/sframe-common-outer.js'
], function (nThen, ApiConfig, DomReady, Hash, SFCommonO) {

    var isIntegration = Boolean(window.CP_integration_outer);
    var integration = window.CP_integration_outer || {};

    // Loaded in load #2
    var hash, href, version;
    nThen(function (waitFor) {
        DomReady.onReady(waitFor());
    }).nThen(function (waitFor) {
        var obj = SFCommonO.initIframe(waitFor, true, integration.pathname);
        href = obj.href;
        hash = obj.hash;
        var parsed = Hash.parsePadUrl(href);
        if (parsed && parsed.hashData) {
            var opts = parsed.getOptions();
            version = opts.versionHash;
        }
        if (isIntegration) {
            href = integration.href;
            hash = integration.hash;
        }
    }).nThen(function (/*waitFor*/) {
        var addData = function (obj) {
            let path = (integration && integration.pathname) || window.location.pathname;
            obj.ooType = path.replace(/^\//, '').replace(/\/$/, '');
            obj.ooVersionHash = version;
            obj.ooForceVersion = localStorage.CryptPad_ooVersion || "";
        };
        const channels = {};
        var getPropChannels = function () {
            return channels;
        };
        var addRpc = function (sframeChan, Cryptpad, Utils) {
            Cryptpad.otherPadAttrs = channels;

            sframeChan.on('Q_OO_SAVE', function (data, cb) {
                // Only called onReady when loading legacy checkpoints
                channels.rtChannel = data.channel;
                channels.lastVersion = data.url;
                if (data.hash) { channels.lastCpHash = data.hash; }
                Cryptpad.setPadAttribute('lastCpHash', data.hash, cb);
                Cryptpad.setPadAttribute('lastVersion', data.url, cb);
            });

            sframeChan.on('Q_OO_OPENCHANNEL', function (data, cb) {
                // If we don't have "channels" values, it means we're not
                // loading an "old" checkpoint so we can clean attributes
                if (!channels?.lastVersion) {
                    channels.linked = true;
                    Cryptpad.setPadAttribute('linked', true, () => {});
                    Cryptpad.setPadAttribute('rtChannel', void 0, () => {});
                    Cryptpad.setPadAttribute('lastVersion', void 0, () => {});
                    Cryptpad.setPadAttribute('lastCpHash', void 0, () => {});
                }

                Cryptpad.onlyoffice.execCommand({
                    cmd: 'OPEN_CHANNEL',
                    data: {
                        channel: data.channel,
                        lastCpHash: data.lastCpHash,
                        padChan: Utils.secret.channel, // metadata inherited from this pad
                        validateKey: Utils.secret.keys.validateKey
                    }
                }, cb);
            });
            sframeChan.on('EV_OO_PIN_IMAGES', function (list) {
                Cryptpad.getPadAttribute('ooImages', function (err, res) {
                    if (err) { return; }
                    if (!res || !Array.isArray(res)) { res = []; }
                    var toPin = [];
                    var toUnpin = [];
                    res.forEach(function (id) {
                        if (list.indexOf(id) === -1) {
                            toUnpin.push(id);
                        }
                    });
                    list.forEach(function (id) {
                        if (res.indexOf(id) === -1) {
                            toPin.push(id);
                        }
                    });
                    toPin = Utils.Util.deduplicateString(toPin);
                    toUnpin = Utils.Util.deduplicateString(toUnpin);
                    if (toPin.length) { Cryptpad.pinPads(toPin, function () {}); }
                    if (toUnpin.length) { Cryptpad.unpinPads(toUnpin, function () {}); }
                    if (!toPin.length && !toUnpin.length) { return; }
                    Cryptpad.setPadAttribute('ooImages', list, function (err) {
                        if (err) { console.error(err); }
                    });
                });
            });
            sframeChan.on('Q_OO_COMMAND', function (obj, cb) {
                if (obj.cmd === 'SEND_MESSAGE') {
                    obj.data.msg = Utils.crypto.encrypt(JSON.stringify(obj.data.msg));
                    var hash = obj.data.msg.slice(0,64);
                    var _cb = cb;
                    cb = function () {
                        _cb(hash);
                    };
                }
                Cryptpad.onlyoffice.execCommand(obj, cb);
            });
            sframeChan.on('EV_OO_OPENVERSION', function (obj) {
                if (!obj || !obj.hash) { return; }
                var parsed = Hash.parsePadUrl(window.location.href);
                var opts = parsed.getOptions();
                opts.versionHash = obj.hash;
                window.open(parsed.getUrl(opts));
            });
            Cryptpad.onlyoffice.onEvent.reg(function (obj) {
                if (obj.ev === 'MESSAGE' && !/^cp\|/.test(obj.data)) {
                    try {
                        var validateKey = obj.data.validateKey || true;
                        var skipCheck = validateKey === true;
                        var msg = obj.data.msg;
                        obj.data = {
                            msg: JSON.parse(Utils.crypto.decrypt(msg, validateKey, skipCheck)),
                            hash: msg.slice(0,64)
                        };
                    } catch (e) {
                        console.error(e);
                    }
                }
                sframeChan.event('EV_OO_EVENT', obj);
            });

            // X2T
            sframeChan.on('Q_OO_CONVERT', function (obj, cb) {
                obj.modal = 'x2t';
                Utils.initUnsafeIframe(obj, cb);
            });

        };
        SFCommonO.start({
            hash: hash,
            href: href,
            type: 'oo',
            addData: addData,
            addRpc: addRpc,
            getPropChannels: getPropChannels, // XXX TODO
            messaging: true,
            useCreationScreen: !isIntegration,
            noDrive: true,
            integration: isIntegration,
            integrationUtils: integration.utils,
            integrationConfig: integration.config || {},
            initialState: integration.initialState || undefined
        });
    });
});
