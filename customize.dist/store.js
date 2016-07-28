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
        localStorage.setItem(key, val);
        cb(void 0, val);
    };

    // implement in alternative store
    Store.setBatch = function (map, cb) {
        Object.keys(map).forEach(function (key) {
            localStorage.setItem(key, map[key]);
        });
        cb(void 0, map);
    };

    Store.get = function (key, cb) {
        cb(void 0, localStorage.getItem(key));
    };

    // implement in alternative store
    Store.getBatch = function (keys, cb) {
        var res = {};
        keys.forEach(function (key) {
            res[key] = localStorage.getItem(key);
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

    // implement in alternative store...
    Store.dump = function (cb) {
        var map = {};
        Object.keys(localStorage).forEach(function (key) {
            map[key] = localStorage.getItem(key);
        });
        cb(void 0, map);
    };

    return Store;
});
