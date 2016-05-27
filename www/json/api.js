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

        if (['object', 'array'].indexOf(DeepProxy.type(cfg.data))) {
            throw new Error('unsupported datatype');
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

            // TODO actually emit 'change' events, or something like them
        };

        proxy = DeepProxy.create(cfg.data, onLocal, true);

        var onInit = config.onInit = function (info) {
            realtime = info.realtime;
            // create your patcher
            realtime.patchText = TextPatcher.create({
                realtime: realtime,
                logging: config.logging || false,
            });

            // onInit
            cfg.onInit(info);
        };

        var onReady = config.onReady = function (info) {
            var userDoc = realtime.getUserDoc();
            var parsed = JSON.parse(userDoc);

            DeepProxy.update(proxy, parsed);

            // onReady
            cfg.onReady(info);
        };


        var onRemote = config.onRemote = function (info) {
            var userDoc = realtime.getUserDoc();
            var parsed = JSON.parse(userDoc);

            DeepProxy.update(proxy, parsed, onLocal);

            // onRemote
            if (cfg.onRemote) {
                cfg.onRemote(info);
            }
        };

        var onAbort = config.onAbort = function (info) {
            // onAbort
            cfg.onAbort(info);
        };

        rt = Realtime.start(config);

        rt.proxy = proxy;
        rt.realtime = realtime;
        return rt;
    };

    return api;
});
