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
        var channels = {};
        var getPropChannels = function () {
            return channels;
        };
        var addRpc = function (sframeChan, Cryptpad, Utils) {
            sframeChan.on('Q_OO_SAVE', function (data, cb) {
                // Legacy, we keep lastCpHash to compute history size
                // from drive
                // XXX server can find the last checkpoint
                Cryptpad.setPadAttribute('lastVersion', data.url, cb);
                channels.lastVersion = data.url;
                Cryptpad.setPadAttribute('lastCpHash', data.hash, cb);
                if (data.hash) { channels.lastCpHash = data.hash; }
            });

            sframeChan.on('Q_OO_OPENCHANNEL', function (data, cb) {
                const other = Cryptpad.otherPadAttrs = {
                    rtChannel: data.channel
                };
                if (channels.lastVersion) {
                    other.lastVersion = channels.lastVersion;
                }
                other.lastCpHash = channels.lastCpHash;
                channels.rtChannel = data.channel;

                // XXX mark as migrated? and clean existing data
                if (channels?.lastVersion && !channels?.lastCpHash) {
                    Cryptpad.setPadAttribute('v', 2, function () {});
                    Cryptpad.setPadAttribute('rtChannel', void 0, () => {});
                    Cryptpad.setPadAttribute('lastVersion', void 0, () => {});
                    Cryptpad.setPadAttribute('lastCpHash', void 0, () => {});
                }

                var owners, expire;
                nThen(function (waitFor) {
                    if (Utils.rtConfig) {
                        owners = Utils.Util.find(Utils.rtConfig, ['metadata', 'owners']);
                        expire = Utils.Util.find(Utils.rtConfig, ['metadata', 'expire']);
                        return;
                    }
                    Cryptpad.getPadAttribute('owners', waitFor(function (err, res) {
                        owners = res;
                    }));
                    Cryptpad.getPadAttribute('expire', waitFor(function (err, res) {
                        expire = res;
                    }));
                }).nThen(function () {
                    Cryptpad.onlyoffice.execCommand({
                        cmd: 'OPEN_CHANNEL',
                        data: {
                            owners: owners,
                            expire: expire,
                            channel: data.channel,
                            lastCpHash: data.lastCpHash,
                            padChan: Utils.secret.channel,
                            validateKey: Utils.secret.keys.validateKey
                        }
                    }, cb);
                });
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
