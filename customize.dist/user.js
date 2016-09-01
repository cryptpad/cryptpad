define([
    '/api/config?cb=' + Math.random().toString().slice(2),
    '/customize/messages.js',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/customize/store.js',

    '/bower_components/scrypt-async/scrypt-async.min.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function (Config, Messages, Listmap, Crypto, Store) {
    var Scrypt = window.scrypt;
    var Nacl = window.nacl;

    var User = {};
    var localKey = User.localKey = 'cryptpad_user_session';
    var store;

    Store.ready(function (err, s) {
        if (err) {
            console.error(err);
            return;
        }
        store = s;
    });

    var isArray = function (o) { return Object.prototype.toString.call(o) === '[object Array]'; };

    var session = User.session = function (secret, cb) {
        if (secret) {
            store.set(localKey, secret, cb);
            return;
        }
        if (secret === null) {
            store.remove(localKey, cb);
        }

        store.get(localKey, cb);
    };

    /*  64 uint8s symmetric keys
          32 b64 channel
            16 b64 key
            16 b64 junk
        32 uint8s ed signing key
        32 uint8s curve public key */
    var parse128 = function (A) {
        if (A.length !== 128) {
            throw new Error("Expected 128 uint8s!");
        }
        var symmetric = Nacl.util.encodeBase64(A.slice(0, 36));
        return {
            ed: A.slice(96),
            curve: A.slice(64, 96),
            channel: symmetric.slice(0, 32),
            key: symmetric.slice(32),
            extra: A.slice(36, 64),
        };
    };

    var initialize = User.initialize = function (proxy, secret, cb) {
        proxy.on('ready', function (info) {
            var now = ''+new Date();
            // old atime
            var otime = proxy.atime;

            var atime = proxy.atime = now;

            // creation time
            proxy.ctime = proxy.ctime || now;

            proxy.username = proxy.username || secret.username;
            proxy.schema = proxy.schema || 'login_data-v0';

            proxy.documents = proxy.documents || [];
            cb(void 0, proxy);
        });
    };

    /*
        cb(proxy);
    */
    var connect = User.connect = function (secret, cb) {
        if (!secret) {
            // FIXME
            return;
        }
        var config = {
            websocketURL: Config.websocketURL,
            channel: secret.channel,
            data: {},
            crypto: Crypto.createEncryptor(secret.key),
            logLevel: 0,
        };
        var rt = Listmap.create(config);
        initialize(rt.proxy, secret, cb);
    };

    var disconnect = User.disconnect = function (cb) {
        var err = "User.disconnect is not implemented yet";
        cb(err);
    };

    var genSecret = User.genSecret = function (uname, pw, cb) {
        Scrypt(pw,
            uname,
            15, // memory cost parameter
            8, // block size parameter
            128, // derived key length
            200, // interruptStep
            function (bytes) {
                var secret = parse128(bytes);
                secret.username = uname;
                cb(void 0, secret);
        });
    };

    /*  Asynchronously derive 128 random uint8s given a uname and password

        cb(proxy, secret)
    */
    var login = User.login = function (uname, pw, cb) {
        genSecret(uname, pw, function (err, secret) {
            session(secret, function (err) {
                connect(secret, cb);
            });
        });
    };

    var prepareStore = User.prepareStore = function (proxy) {
        var store = {};

        var ps = proxy.store = proxy.store || {};

        var set = store.set = function (key, val, cb) {
            ps[key] = val;
            cb();
        };

        var batchset = store.setBatch = function (map, cb) {
            if (isArray(map) || typeof(map) !== 'object') {
                cb('[setBatch.TypeError] expected key-value pairs to set');
                return;
            }
            Object.keys(map).forEach(function (k) {
                ps[k] = map[k];
            });
            cb();
        };

        var get = store.get = function (key, cb) {
            cb(void 0, ps[key]);
        };

        var batchget = store.getBatch = function (keys, cb) {
            if (!isArray(keys)) {
                cb('[getBatch.TypeError] expected array of keys to return');
                return;
            }
            var map = {};
            keys.forEach(function (k) {
                map[k] = ps[k];
            });
            cb(void 0, map);
        };

        var remove = store.remove = function (key, cb) {
            ps[key] = undefined;
            cb();
        };

        var batchremove = store.removeBatch = function (keys, cb) {
            if (!isArray(keys)) {
                cb('[batchremove.TypeError] expected array of keys to remove');
                return;
            }
            keys.forEach(function (k) {
                ps[k] = undefined;
            });
            cb();
        };

        var keys = store.keys = function (cb) {
            cb(void 0, Object.keys(ps));
        };

        return store;
    };

    return User;
});
