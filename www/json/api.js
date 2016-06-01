require.config({ paths: { 'json.sortify': '/bower_components/json.sortify/dist/JSON.sortify' } });
define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/common/crypto.js',
    '/common/realtime-input.js',
    '/common/json-ot.js',
    'json.sortify',
    '/bower_components/textpatcher/TextPatcher.amd.js',
    '/json/deep-proxy.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Config, Crypto, Realtime, JsonOT, Sortify, TextPatcher, DeepProxy) {
    var api = {};

    var create = api.create = function (cfg) {
        /* validate your inputs before proceeding */

        if (!DeepProxy.isProxyable(cfg.data)) {
            throw new Error('unsupported datatype: '+ DeepProxy.type(cfg.data));
        }

        var config = {
            initialState: Sortify(cfg.data),
            transformFunction: JsonOT.validate,
            userName: Crypto.rand64(8),
            channel: cfg.channel,
            cryptKey: cfg.cryptKey,
            crypto: Crypto,
            websocketURL: Config.websocketURL,
            logLevel: 0
        };

        var rt;
        var realtime;

        var proxy;

        var onLocal = config.onLocal = function () {
            var strung = Sortify(proxy);

            realtime.patchText(strung);

            // try harder
            if (realtime.getUserDoc() !== strung) {
                realtime.patchText(strung);
            }

            // onLocal
            if (cfg.onLocal) {
                cfg.onLocal();
            }
        };

        proxy = DeepProxy.create(cfg.data, onLocal, true);

        var onInit = config.onInit = function (info) {
            realtime = info.realtime;
            // create your patcher
            realtime.patchText = TextPatcher.create({
                realtime: realtime,
                logging: config.logging || false,
            });

            proxy._events.create.forEach(function (handler) {
                handler.cb(info);
            });
        };

        var initializing = true;

        var onReady = config.onReady = function (info) {
            var userDoc = realtime.getUserDoc();
            var parsed = JSON.parse(userDoc);

            DeepProxy.update(proxy, parsed, onLocal);

            proxy._events.ready.forEach(function (handler) {
                handler.cb(info);
            });

            initializing = false;
        };

        var onRemote = config.onRemote = function (info) {
            if (initializing) { return; }
            var userDoc = realtime.getUserDoc();
            var parsed = JSON.parse(userDoc);

            DeepProxy.update(proxy, parsed, onLocal);
        };

        var onAbort = config.onAbort = function (info) {
            proxy._events.disconnect.forEach(function (handler) {
                handler.cb(info);
            });
        };

        rt = Realtime.start(config);

        rt.proxy = proxy;
        rt.realtime = realtime;
        return rt;
    };

    return api;
});
