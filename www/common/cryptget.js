define([
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/common/cryptpad-common.js',
    '/bower_components/textpatcher/TextPatcher.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Crypto, Realtime, Cryptpad, TextPatcher) {
    var Messages = Cryptpad.Messages;
    var noop = function () {};
    var finish = function (S, err, doc) {
        if (S.done) { return; }
        S.cb(err, doc);
        S.done = true;

        var abort = Cryptpad.find(S, ['realtime', 'realtime', 'abort']);
        if (typeof(abort) === 'function') {
            S.realtime.realtime.sync();
            abort();
        }
    };

    var makeConfig = function (hash) {
        var secret = Cryptpad.getSecrets(hash);
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

        var onReady = config.onReady = function (info) {
            var rt = Session.session = info.realtime;
            finish(Session, void 0, rt.getUserDoc());
        };
        overwrite(config, opt);

        var realtime = Session.realtime = Realtime.start(config);
    };

    var put = function (hash, doc, cb, opt) {
        if (typeof(cb) !== 'function') {
            throw new Error('Cryptput expects a callback');
        }

        var config = makeConfig(hash);
        var Session = { cb: cb, };
        config.onReady = function (info) {
            var realtime = Session.session = info.realtime;

            TextPatcher.create({
                realtime: realtime,
            })(doc);
            realtime.sync();
            realtime.abort();

            finish(Session, void 0);
        };
        overwrite(config, opt);

        var realtime = Session.session = Realtime.start(config);
    };

    return {
        get: get,
        put: put,
    };
});
