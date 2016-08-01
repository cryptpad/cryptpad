define(function () {
    /*
        This module uses localStorage, which is synchronous, but exposes an
        asyncronous API. This is so that we can substitute other storage
        methods.

        To override these methods, create another file at:
        /customize/storage.js
    */

    var Store = {};

    // Store uses nodebacks...
    Store.set = function (key, val, cb) {
        localStorage.setItem(key, JSON.stringify(val));
        cb();
    };

    // implement in alternative store
    Store.setBatch = function (map, cb) {
        Object.keys(map).forEach(function (key) {
            localStorage.setItem(key, JSON.stringify(map[key]));
        });
        cb(void 0, map);
    };

    var safeGet = window.safeGet = function (key) {
        var val = localStorage.getItem(key);
        try {
            return JSON.parse(val);
        } catch (err) {
            console.log(val);
            console.error(err);
            return val;
        }
    };

    Store.get = function (key, cb) {
        cb(void 0, safeGet(key));
    };

    // implement in alternative store
    Store.getBatch = function (keys, cb) {
        var res = {};
        keys.forEach(function (key) {
            res[key] = safeGet(key);
        });
        cb(void 0, res);
    };

    Store.remove = function (key, cb) {
        localStorage.removeItem(key);
        cb();
    };

    // implement in alternative store
    Store.removeBatch = function (keys, cb) {
        keys.forEach(function (key) {
            localStorage.removeItem(key);
        });
        cb();
    };

    Store.keys = function (cb) {
        cb(void 0, Object.keys(localStorage));
    };

    return Store;
});
