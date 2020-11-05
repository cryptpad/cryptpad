define([
    '/common/common-util.js',
    '/bower_components/localforage/dist/localforage.min.js',
], function (Util, localForage) {
    var S = {};

    var cache = localForage.createInstance({
        name: "cp_cache"
    });

    // id: channel ID or blob ID
    // returns array of messages
    S.getChannelCache = function (id, cb) {
        cb = Util.once(Util.mkAsync(cb || function () {}));
        cache.getItem(id, function (err, obj) {
            if (err || !obj || !Array.isArray(obj.c)) {
                return void cb(err || 'EINVAL');
            }
            cb(null, obj);
            obj.t = +new Date();
            cache.setItem(id, obj);
        });
    };

    // Keep the last two checkpoint + any checkpoint that may exist in the last 100 messages
    // FIXME: duplicate system with sliceCpIndex from lib/hk-util.js
    var checkCheckpoints = function (array) {
        if (!Array.isArray(array)) { return; }
        // Keep the last 100 messages
        if (array.length > 100) {
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

    S.storeCache = function (id, validateKey, val, cb) {
        cb = Util.once(Util.mkAsync(cb || function () {}));
        if (!Array.isArray(val) || !validateKey) { return void cb('EINVAL'); }
        checkCheckpoints(val);
        cache.setItem(id, {
            k: validateKey,
            c: val,
            t: (+new Date()) // 't' represent the "lastAccess" of this cache (get or set)
        }, function (err) {
            cb(err);
        });
    };

    S.clearChannel = function (id, cb) {
        cb = Util.once(Util.mkAsync(cb || function () {}));
        cache.removeItem(id, cb);
    };

    S.clear = function () {
        cache.clear();
    };

    return S;
});
