define([
    '/api/config?cb=' + Math.random().toString().slice(2),
    '/customize/messages.js?app=fs',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/textpatcher/TextPatcher.amd.js',
    '/common/fileObject.js'
], function (Config, Messages, Listmap, Crypto, TextPatcher, FO) {
    /*
        This module uses localStorage, which is synchronous, but exposes an
        asyncronous API. This is so that we can substitute other storage
        methods.

        To override these methods, create another file at:
        /customize/storage.js
    */

    var Store = {};
    var storeObj;
    var ready = false;
    var filesOp;
    var exp = {};

    var safeSet = function (key, val) {
        storeObj[key] = val;
    };

    // Store uses nodebacks...
    Store.set = function (key, val, cb) {
        safeSet(key, val);
        cb();
    };

    // implement in alternative store
    Store.setBatch = function (map, cb) {
        Object.keys(map).forEach(function (key) {
            safeSet(key, map[key]);
        });
        cb(void 0, map);
    };

    var safeGet = window.safeGet = function (key) {
        return storeObj[key];
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

    var safeRemove = function (key) {
        delete storeObj[key];
    };

    Store.remove = function (key, cb) {
        safeRemove(key);
        cb();
    };

    // implement in alternative store
    Store.removeBatch = function (keys, cb) {
        keys.forEach(function (key) {
            safeRemove(key);
        });
        cb();
    };

    Store.keys = function (cb) {
        cb(void 0, Object.keys(storeObj));
    };

    Store.addPad = function (href, path, name) {
        filesOp.addPad(href, path, name);
    };

    Store.forgetPad = function (href, cb) {
        filesOp.forgetPad(href);
        cb();
    };

    Store.addTemplate = function (href) {
        filesOp.addTemplate(href);
    };

    Store.listTemplates = function () {
        return filesOp.listTemplates();
    };

    Store.getProxy = function () {
        return exp;
    };

    var changeHandlers = Store.changeHandlers = [];

    Store.change = function (f) {
        if (typeof(f) !== 'function') {
            throw new Error('[Store.change] callback must be a function');
        }
        changeHandlers.push(f);

        if (changeHandlers.length === 1) {
            // start listening for changes
/* TODO: listen for changes in the proxy
            window.addEventListener('storage', function (e) {
                changeHandlers.forEach(function (f) {
                    f({
                        key: e.key,
                        oldValue: e.oldValue,
                        newValue: e.newValue,
                    });
                });
            });
*/
        }
    };

    var onReady = function (f, proxy, storageKey) {
        filesOp = FO.init(proxy, {
            storageKey: storageKey
        });
        storeObj = proxy;
        ready = true;
        if (typeof(f) === 'function') {
            f(void 0, Store);
        }
    };

    var initialized = false;

    var init = function (f, Cryptpad) {
        if (!Cryptpad || initialized) { return; }
        initialized = true;
        var hash = Cryptpad.getUserHash() || localStorage.FS_hash;
        var secret = Cryptpad.getSecrets(hash);
        var listmapConfig = {
            data: {},
            websocketURL: Cryptpad.getWebsocketURL(),
            channel: secret.channel,
            readOnly: false,
            validateKey: secret.keys.validateKey || undefined,
            crypto: Crypto.createEncryptor(secret.keys),
            userName: 'fs',
            logLevel: 1,
        };

        var rt = window.rt = Listmap.create(listmapConfig);
        exp.proxy = rt.proxy;
        rt.proxy.on('create', function (info) {
            exp.info = info;
            if (!Cryptpad.getUserHash()) {
                localStorage.FS_hash = Cryptpad.getEditHashFromKeys(info.channel, secret.keys);
            }
        }).on('ready', function () {
        if (ready) { return; }
            if (!rt.proxy[Cryptpad.storageKey] || !Cryptpad.isArray(rt.proxy[Cryptpad.storageKey])) {
                var oldStore = Cryptpad.getStore(true);
                oldStore.get(Cryptpad.storageKey, function (err, s) {
                    rt.proxy[Cryptpad.storageKey] = s;
                    onReady(f, rt.proxy, Cryptpad.storageKey);
                });
                return;
            }
            onReady(f, rt.proxy, Cryptpad.storageKey);
        })
        .on('disconnect', function (info) {
            //setEditable(false);
            if (info.error) {
                //Cryptpad.alert(Messages.websocketError);
                if (typeof Cryptpad.storeError === "function") {
                    Cryptpad.storeError();
                }
                return;
            }
            //Cryptpad.alert(Messages.common_connectionLost);
        });

    };

    Store.ready = function (f, Cryptpad) {
        /*if (Cryptpad.parsePadUrl(window.location.href).type === "file") {
            if (typeof(f) === 'function') {
                f(void 0, Cryptpad.getStore(true));
            }
            return;
        }*/
        if (ready) {
            if (typeof(f) === 'function') {
                f(void 0, Store);
            }
        } else {
            init(f, Cryptpad);
        }
    };

    return Store;
});
