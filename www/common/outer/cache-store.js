// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/common/common-util.js',
    '/components/localforage/dist/localforage.min.js',
], function (Util, localForage) {
    var S = window.CryptPad_Cache = {};
    var onReady = Util.mkEvent(true);

    // Check if indexedDB is allowed
    var allowed = false;
    var disabled = false;
    var supported = false;

    try {
        var request = window.indexedDB.open('test_db', 1);
        request.onsuccess = function () {
            supported = true;
            allowed = supported && !disabled;
            onReady.fire();
        };
        request.onerror = function () {
            onReady.fire();
        };
    } catch (e) {
        onReady.fire();
    }

    S.enable = function () {
        disabled = false;
        allowed = supported && !disabled;
    };
    S.disable = function () {
        disabled = true;
        allowed = supported && !disabled;
    };

    var cache = localForage.createInstance({
        driver: localForage.INDEXEDDB,
        name: "cp_cache"
    });

    S.getBlobCache = function (id, cb) {
        cb = Util.once(Util.mkAsync(cb || function () {}));

        onReady.reg(function () {
            if (!allowed) { return void cb('NOCACHE'); }
            cache.getItem(id, function (err, obj) {
                if (err || !obj || !obj.c) {
                    return void cb(Util.serializeError(err || 'EINVAL'));
                }
                cb(null, obj.c);
                obj.t = +new Date();
                cache.setItem(id, obj, function (err) {
                    if (!err) { return; }
                    console.error(err);
                });
            });
        });
    };
    S.setBlobCache = function (id, u8, cb) {
        cb = Util.once(Util.mkAsync(cb || function () {}));

        onReady.reg(function () {
            if (!allowed) { return void cb('NOCACHE'); }
            if (!u8) { return void cb('EINVAL'); }
            cache.setItem(id, {
                c: u8,
                t: (+new Date()) // 't' represent the "lastAccess" of this cache (get or set)
            }, function (err) {
                cb(Util.serializeError(err));
            });
        });
    };

    // id: channel ID or blob ID
    // returns array of messages
    S.getChannelCache = function (id, cb) {
        cb = Util.once(Util.mkAsync(cb || function () {}));

        onReady.reg(function () {
            if (!allowed) { return void cb('NOCACHE'); }
            cache.getItem(id, function (err, obj) {
                if (err || !obj || !Array.isArray(obj.c)) {
                    return void cb(Util.serializeError(err || 'EINVAL'));
                }
                cb(null, obj);
                obj.t = +new Date();
                cache.setItem(id, obj, function (err) {
                    if (!err) { return; }
                    console.error(err);
                });
            });
        });
    };

    // Keep the last two checkpoint + any checkpoint that may exist in the last 100 messages
    // FIXME: duplicate system with sliceCpIndex from lib/hk-util.js
    var checkCheckpoints = function (array) {
        if (!Array.isArray(array)) { return; }
        // Keep the last 100 messages
        if (array.length > 100) { // FIXME this behaviour is only valid for chainpad-style documents
            array.splice(0, array.length - 100);
        }
        // Remove every message before the first checkpoint
        var firstCpIdx;
        array.some(function (el, i) {
            if (!el.isCheckpoint) { return; }
            firstCpIdx = i;
            return true;
        });
        array.splice(0, firstCpIdx);
    };

    var t = {};
    S.storeCache = function (id, validateKey, val, onError) {
        onError = Util.once(Util.mkAsync(onError || function () {}));

        onReady.reg(function () {

            // Make a throttle or use the existing one to avoid calling
            // storeCache with the same array multiple times
            t[id] = t[id] || Util.throttle(function (validateKey, val, onError) {
                if (!allowed) { return void onError('NOCACHE'); }
                if (!Array.isArray(val) || !validateKey) { return void onError('EINVAL'); }
                checkCheckpoints(val);
                cache.setItem(id, {
                    k: validateKey,
                    c: val,
                    t: (+new Date()) // 't' represent the "lastAccess" of this cache (get or set)
                }, function (err) {
                    if (err) { onError(Util.serializeError(err)); }
                });

            }, 50);
            t[id](validateKey, val, onError);

        });
    };

    S.leaveChannel = function (id) {
        delete t[id];
    };

    S.clearChannel = function (id, cb) {
        cb = Util.once(Util.mkAsync(cb || function () {}));

        onReady.reg(function () {
            if (!allowed) { return void cb('NOCACHE'); }
            cache.removeItem(id, function () {
                cb();
            });
        });
    };

    S.clear = function (cb) {
        cb = Util.once(Util.mkAsync(cb || function () {}));

        onReady.reg(function () {
            if (!allowed) { return void cb('NOCACHE'); }
            cache.clear(cb);
        });
    };

    S.getKeys = function (cb) {
        cb = Util.once(Util.mkAsync(cb || function () {}));
        onReady.reg(function () {
            if (!allowed) { return void cb('NOCACHE'); }
            cache.keys().then(function (keys) {
                cb(null, keys);
            }).catch(function (err) {
                cb(err);
            });
        });
    };
    S.getTime = function (id, cb) {
        cb = Util.once(Util.mkAsync(cb || function () {}));
        onReady.reg(function () {
            if (!allowed) { return void cb('NOCACHE'); }
            cache.getItem(id, function (err, obj) {
                if (err || !obj || !obj.c) {
                    return void cb(Util.serializeError(err || 'EINVAL'));
                }
                cb(null, obj.t);
            });
        });
    };

    self.CryptPad_clearIndexedDB = S.clear;

    return S;
});
