define([
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-realtime.js',
    '/common/outer/network-config.js',
    '/bower_components/chainpad/chainpad.dist.js',
], function (Crypto, CPNetflux, Util, Hash, Realtime, NetConfig) {
    var finish = function (S, err, doc) {
        if (S.done) { return; }
        S.cb(err, doc);
        S.done = true;

        if (!S.hasNetwork) {
            var disconnect = Util.find(S, ['network', 'disconnect']);
            if (typeof(disconnect) === 'function') { disconnect(); }
        }
        if (S.realtime && S.realtime.stop) {
            try {
                S.realtime.stop();
            } catch (e) { console.error(e); }
        }
        var abort = Util.find(S, ['session', 'realtime', 'abort']);
        if (typeof(abort) === 'function') {
            S.session.realtime.sync();
            abort();
        }
    };

    var makeConfig = function (hash, opt) {
        // We can't use cryptget with a file or a user so we can use 'pad' as hash type
        var secret = Hash.getSecrets('pad', hash, opt.password);
        if (!secret.keys) { secret.keys = secret.key; } // support old hashses
        var config = {
            websocketURL: NetConfig.getWebsocketURL(),
            channel: secret.channel,
            validateKey: secret.keys.validateKey || undefined,
            crypto: Crypto.createEncryptor(secret.keys),
            logLevel: 0,
            initialState: opt.initialState
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

    var get = function (hash, cb, opt, progress) {
        if (typeof(cb) !== 'function') {
            throw new Error('Cryptget expects a callback');
        }
        opt = opt || {};
        progress = progress || function () {};

        var config = makeConfig(hash, opt);
        var Session = { cb: cb, hasNetwork: Boolean(opt.network) };

        config.onReady = function (info) {
            var rt = Session.session = info.realtime;
            Session.network = info.network;
            progress(1);
            finish(Session, void 0, rt.getUserDoc());
        };

        config.onChannelError = function (info) {
            finish(Session, info.error);
        };

        // We use the new onMessage handler to compute the progress:
        // we should receive 2 checkpoints max, so 100 messages max
        // We're going to consider that 1 message = 1%, and we'll send 100%
        // at the end
        var i = 0;
        config.onMessage = function () {
            i++;
            progress(Math.min(0.99, i/100));
        };

        overwrite(config, opt);

        Session.realtime = CPNetflux.start(config);
    };

    var put = function (hash, doc, cb, opt) {
        if (typeof(cb) !== 'function') {
            throw new Error('Cryptput expects a callback');
        }
        opt = opt || {};

        var config = makeConfig(hash, opt);
        var Session = { cb: cb, };

        config.onReady = function (info) {
            var realtime = Session.session = info.realtime;
            Session.network = info.network;

            realtime.contentUpdate(doc);

            var to = setTimeout(function () {
                cb(new Error("Timeout"));
            }, 5000);

            Realtime.whenRealtimeSyncs(realtime, function () {
                clearTimeout(to);
                realtime.abort();
                finish(Session, void 0);
            });
        };
        overwrite(config, opt);

        Session.session = CPNetflux.start(config);
    };

    return {
        get: get,
        put: put,
    };
});
