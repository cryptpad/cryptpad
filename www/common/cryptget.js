define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/common/cryptpad-common.js',
], function ($, Crypto, Realtime, Cryptpad) {
    //var Messages = Cryptpad.Messages;
    //var noop = function () {};
    var finish = function (S, err, doc) {
        if (S.done) { return; }
        S.cb(err, doc);
        S.done = true;

        var disconnect = Cryptpad.find(S, ['network', 'disconnect']);
        if (typeof(disconnect) === 'function') { disconnect(); }
        var abort = Cryptpad.find(S, ['realtime', 'realtime', 'abort']);
        if (typeof(abort) === 'function') {
            S.realtime.realtime.sync();
            abort();
        }
    };

    var makeConfig = function (hash) {
        // We can't use cryptget with a file or a user so we can use 'pad' as hash type
        var secret = Cryptpad.getSecrets('pad', hash);
        if (!secret.keys) { secret.keys = secret.key; } // support old hashses
        var config = {
            websocketURL: Cryptpad.getWebsocketURL(),
            channel: secret.channel,
            validateKey: secret.keys.validateKey || undefined,
            crypto: Crypto.createEncryptor(secret.keys),
            logLevel: 0,
        };
        return config;
    };

    var isObject = function (o) {
        return typeof(o) === 'object';
    };

    var overwrite = function (a, b) {
        if (!(isObject(a) && isObject(b))) { return; }
        Object.keys(b).forEach(function (k) { a[k] = b[k]; });
    };

    var get = function (hash, cb, opt) {
        if (typeof(cb) !== 'function') {
            throw new Error('Cryptget expects a callback');
        }
        var Session = { cb: cb, };
        var config = makeConfig(hash);

        config.onReady = function (info) {
            var rt = Session.session = info.realtime;
            Session.network = info.network;
            finish(Session, void 0, rt.getUserDoc());
        };
        overwrite(config, opt);

        Session.realtime = Realtime.start(config);
    };

    var put = function (hash, doc, cb, opt) {
        if (typeof(cb) !== 'function') {
            throw new Error('Cryptput expects a callback');
        }

        var config = makeConfig(hash);
        var Session = { cb: cb, };
        config.onReady = function (info) {
            var realtime = Session.session = info.realtime;
            Session.network = info.network;

            realtime.contentUpdate(doc);

            var to = window.setTimeout(function () {
                cb(new Error("Timeout"));
            }, 5000);

            Cryptpad.whenRealtimeSyncs(realtime, function () {
                window.clearTimeout(to);
                realtime.abort();
                finish(Session, void 0);
            });
        };
        overwrite(config, opt);

        Session.session = Realtime.start(config);
    };

    return {
        get: get,
        put: put,
    };
});
