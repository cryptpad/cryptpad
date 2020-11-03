define([
    '/bower_components/localforage/dist/localforage.min.js',
], function (localForage) {
    var S = {};

    var cache = localForage.createInstance({
        name: "cp_cache"
    });

    // id: channel ID or blob ID
    // returns array of messages
    S.getChannelCache = function (id, cb) {
        cache.getItem(id, function (err, obj) {
            if (err || !obj || !Array.isArray(obj.c)) {
                return void cb(err || 'EINVAL');
            }
            cb(null, obj);
        });
    };

    var checkCheckpoints = function (array) {
        if (!Array.isArray(array)) { return; }
        var cp = 0;
        for (var i = array.length - 1; i >= 0; i--) {
            if (array[i].isCheckpoint) { cp++; }
            if (cp === 2) {
                array.splice(0, i);
                break;
            }
        }
    };

    S.storeCache = function (id, validateKey, val, cb) {
        cb = cb || function () {};
        if (!Array.isArray(val) || !validateKey) { return void cb('EINVAL'); }
        checkCheckpoints(val);
        cache.setItem(id, {
            k: validateKey,
            c: val
        }, function (err) {
            cb(err);
        });
    };

    S.clearChannel = function (id, cb) {
        cb = cb || function () {};
        cache.removeItem(id, cb);
    };

    S.clear = function () {
        cache.clear();
    };

    return S;
});
