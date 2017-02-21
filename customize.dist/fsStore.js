define([
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad-crypto/crypto.js?v=0.1.5',
    '/bower_components/textpatcher/TextPatcher.amd.js',
    '/common/fileObject.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Listmap, Crypto, TextPatcher, FO) {
    /*
        This module uses localStorage, which is synchronous, but exposes an
        asyncronous API. This is so that we can substitute other storage
        methods.

        To override these methods, create another file at:
        /customize/storage.js
    */
    var $ = window.jQuery;

    var Store = {};
    var store;

    var initStore = function (filesOp, storeObj, exp) {
        var ret = {};

        var safeSet = function (key, val) {
            storeObj[key] = val;
        };

        // Store uses nodebacks...
        ret.set = function (key, val, cb) {
            safeSet(key, val);
            cb();
        };

        // implement in alternative store
        ret.setBatch = function (map, cb) {
            Object.keys(map).forEach(function (key) {
                safeSet(key, map[key]);
            });
            cb(void 0, map);
        };

        ret.setDrive = function (key, val, cb) {
            storeObj.drive[key] = val;
            cb();
        };

        var safeGet = function (key) {
            return storeObj[key];
        };

        ret.get = function (key, cb) {
            cb(void 0, safeGet(key));
        };

        // implement in alternative store
        ret.getBatch = function (keys, cb) {
            var res = {};
            keys.forEach(function (key) {
                res[key] = safeGet(key);
            });
            cb(void 0, res);
        };

        ret.getDrive = function (key, cb) {
            cb(void 0, storeObj.drive[key]);
        };

        var safeRemove = function (key) {
            delete storeObj[key];
        };

        ret.remove = function (key, cb) {
            safeRemove(key);
            cb();
        };

        // implement in alternative store
        ret.removeBatch = function (keys, cb) {
            keys.forEach(function (key) {
                safeRemove(key);
            });
            cb();
        };

        ret.keys = function (cb) {
            cb(void 0, Object.keys(storeObj));
        };

        ret.addPad = function (href, path, name) {
            filesOp.addPad(href, path, name);
        };

        ret.forgetPad = function (href, cb) {
            filesOp.forgetPad(href);
            cb();
        };

        ret.addTemplate = function (href) {
            filesOp.addTemplate(href);
        };

        ret.listTemplates = function () {
            return filesOp.listTemplates();
        };

        ret.getProxy = function () {
            return exp;
        };

        ret.getLoginName = function () {
            return storeObj.login_name;
        };

        ret.repairDrive = function () {
            filesOp.fixFiles();
        };

        ret.getEmptyObject = function () {
            return filesOp.getStructure();
        };

        var changeHandlers = ret.changeHandlers = [];

        ret.change = function (f) {};

        return ret;
    };

    var onReady = function (f, proxy, Cryptpad, exp) {
        var fo = FO.init(proxy.drive, {
            Cryptpad: Cryptpad
        });
        //storeObj = proxy;
        store = initStore(fo, proxy, exp);
        if (typeof(f) === 'function') {
            f(void 0, store);
        }
        proxy.on('change', [Cryptpad.displayNameKey], function (o, n, p) {
            if (typeof(n) !== "string") { return; }
            Cryptpad.changeDisplayName(n);
        });
    };

    var initialized = false;

    var init = function (f, Cryptpad) {
        if (!Cryptpad || initialized) { return; }
        initialized = true;
        var hash = Cryptpad.getUserHash() || localStorage.FS_hash || Cryptpad.createRandomHash();
        if (!hash) {
            throw new Error('[Store.init] Unable to find or create a drive hash. Aborting...');
        }
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

        var exp = {};

        window.addEventListener('storage', function (e) {
            var key = e.key;
            if (e.key !== Cryptpad.userHashKey) { return; }
            var o = e.oldValue;
            var n = e.newValue;
            if (!o && n) {
                window.location.reload();
            } else if (o && !n) {
                $(window).on('keyup', function (e) {
                    if (e.keyCode === 27) {
                        Cryptpad.removeLoadingScreen();
                    }
                });
                Cryptpad.logout();
                Cryptpad.addLoadingScreen();
                Cryptpad.errorLoadingScreen(Cryptpad.Messages.onLogout, true);
                if (exp.info) {
                    exp.info.network.disconnect();
                }
            }
        });

        var rt = window.rt = Listmap.create(listmapConfig);

        exp.proxy = rt.proxy;
        rt.proxy.on('create', function (info) {
            exp.info = info;
            if (!Cryptpad.getUserHash()) {
                localStorage.FS_hash = Cryptpad.getEditHashFromKeys(info.channel, secret.keys);
            }
        }).on('ready', function () {
            if (store) { return; } // the store is already ready, it is a reconnection
            if (!rt.proxy.drive || typeof(rt.proxy.drive) !== 'object') { rt.proxy.drive = {}; }
            var drive = rt.proxy.drive;
            // Creating a new anon drive: import anon pads from localStorage
            if (!drive[Cryptpad.storageKey] || !Cryptpad.isArray(drive[Cryptpad.storageKey])) {
                Cryptpad.getLegacyPads(function (err, data) {
                    drive[Cryptpad.storageKey] = data;
                    onReady(f, rt.proxy, Cryptpad, exp);
                });
                return;
            }
            // Drive already exist: return the existing drive, don't load data from legacy store
            onReady(f, rt.proxy, Cryptpad, exp);
        })
        .on('disconnect', function (info) {
            // We only manage errors during the loading screen here. Other websocket errors are handled by the apps
            if (info.error) {
                if (typeof Cryptpad.storeError === "function") {
                    Cryptpad.storeError();
                }
                return;
            }
        });

    };

    Store.ready = function (f, Cryptpad) {
        if (store) { // Store.ready probably called twice, store already ready
            if (typeof(f) === 'function') {
                f(void 0, store);
            }
        } else {
            init(f, Cryptpad);
        }
    };

    return Store;
});
