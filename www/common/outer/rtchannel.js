// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/components/nthen/index.js',
    '/api/config',
], function (nThen, ApiConfig) {
    const RTC = {};

    RTC.addRpc = (sframeChan, Cryptpad, Utils, channels) => {

        const execCommand = (obj, cb) => {
            Cryptpad.universal.execCommand({
                type: 'rtchannel',
                data: obj,
            }, cb);
        };

        sframeChan.on('Q_RTC_OPENCHANNEL', function (data, cb) {
            // If we don't have "channels" values, it means we're not
            // loading an "old" checkpoint so we can clean attributes
            if (!channels?.lastVersion) {
                channels.linked = true;
                Cryptpad.setPadAttribute('linked', true, () => {});
                Cryptpad.setPadAttribute('rtChannel', void 0, () => {});
                Cryptpad.setPadAttribute('lastVersion', void 0, () => {});
                Cryptpad.setPadAttribute('lastCpHash', void 0, () => {});
            }

            execCommand({
                cmd: 'OPEN_CHANNEL',
                data: {
                    channel: data.channel,
                    lastCpHash: data.lastCpHash,
                    padChan: Utils.secret.channel, // metadata inherited
                    validateKey: Utils.secret.keys.validateKey
                }
            }, cb);
        });

        sframeChan.on('Q_RTC_COMMAND', function (obj, cb) {
            if (obj.cmd === 'SEND_MESSAGE') {
                obj.data.msg = Utils.crypto.encrypt(JSON.stringify(obj.data.msg));
                var hash = obj.data.msg.slice(0,64);
                var _cb = cb;
                cb = function () {
                    _cb(hash);
                };
            }
            execCommand(obj, cb);
        });

        Cryptpad.universal.onEvent.reg(function (data) {
            if (data?.type !== 'rtchannel') { return; }
            const obj = data?.data || {};
            if (obj.ev === 'MESSAGE' && !/^cp\|/.test(obj.data)) {
                try {
                    let validateKey = obj.data.validateKey || true;
                    let skipCheck = validateKey === true;
                    let msg = obj.data.msg;
                    let str = Utils.crypto.decrypt(msg, validateKey, skipCheck);
                    obj.data = {
                        msg: JSON.parse(str),
                        hash: msg.slice(0,64)
                    };
                } catch (e) {
                    console.error(e);
                }
            }
            sframeChan.event('EV_UNIVERSAL_EVENT', data);
        });

        sframeChan.on('EV_RTC_OPENVERSION', function (obj) {
            if (!obj || !obj.hash) { return; }
            var parsed = Hash.parsePadUrl(window.location.href);
            var opts = parsed.getOptions();
            opts.versionHash = obj.hash;
            window.open(parsed.getUrl(opts));
        });

        sframeChan.on('EV_RTC_PIN_IMAGES', function (list) {
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
    };

    return RTC;
});

