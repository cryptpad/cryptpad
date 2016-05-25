require.config({ paths: { 'json.sortify': '/bower_components/json.sortify/dist/JSON.sortify' } });
define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/common/crypto.js',
    '/common/realtime-input.js',
    '/json/listmap.js',
    '/common/json-ot.js',
    'json.sortify',
    '/bower_components/textpatcher/TextPatcher.amd.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Config, Crypto, Realtime, ListMap, JsonOT, Sortify, TextPatcher) {
    var api = {};

    api.ListMap = ListMap;

    var key;
    var channel = '';
    var hash = false;
    if (!/#/.test(window.location.href)) {
        key = Crypto.genKey();
    } else {
        hash = window.location.hash.slice(1);
        channel = hash.slice(0,32);
        key = hash.slice(32);
    }

    var module = window.APP = {
        TextPatcher: TextPatcher,
        Sortify: Sortify,
    };

    var $repl = $('[name="repl"]');

    var Map = module.Map = {};

    var initializing = true;

    var config = module.config = {
        initialState: Sortify(Map) || '{}',
        websocketURL: Config.websocketURL,
        userName: Crypto.rand64(8),
        channel: channel,
        cryptKey: key,
        crypto: Crypto,
        transformFunction: JsonOT.validate
    };

    var setEditable = module.setEditable = function (bool) {
        /* (dis)allow editing */
        [$repl].forEach(function ($el) {
            $el.attr('disabled', !bool);
        });
    };

    setEditable(false);

    var onInit = config.onInit = function (info) {
        var realtime = module.realtime = info.realtime;
        window.location.hash = info.channel + key;

        // create your patcher
        module.patchText = TextPatcher.create({
            realtime: realtime,
            logging: true,
        });
    };

    /*  we still need to pass in the function that bumps to ListMap.
        this is no good. FIXME */
    var onLocal = config.onLocal = ListMap.onLocal = module.bump = function () {
        if (initializing) { return; }

        var strung = Sortify(Map);

        console.log(strung);

        /* serialize local changes */
        module.patchText(strung);

        if (module.realtime.getUserDoc !== strung) {
            module.patchText(strung);
        }
    };

    var onRemote = config.onRemote = function (info) {
        if (initializing) { return; }
        /* integrate remote changes */

        var proxy = module.proxy;

        var userDoc = module.realtime.getUserDoc();
        var parsed = JSON.parse(userDoc);

        ListMap.update(proxy, parsed);
    };

    var onReady = config.onReady = function (info) {
        console.log("READY");

        var userDoc = module.realtime.getUserDoc();
        var parsed = JSON.parse(userDoc);

        Object.keys(parsed).forEach(function (key) {
            module.proxy[key] = ListMap.recursiveProxies(parsed[key]);
        });

        setEditable(true);
        initializing = false;
    };

    var onAbort = config.onAbort = function (info) {
        window.alert("Network Connection Lost");
    };

    var rt = Realtime.start(config);

    var proxy = module.proxy = ListMap.makeProxy(Map);

    $repl.on('keyup', function (e) {
        if (e.which === 13) {
            var value = $repl.val();

            if (!value.trim()) { return; }

            console.log("evaluating `%s`", value);

            var x = proxy;
            console.log('> ', eval(value)); // jshint ignore:line
            console.log();
            $repl.val('');
        }
    });

    var create = api.create = function (config) {
        /* validate your inputs before proceeding */

        if (['object', 'array'].indexOf(ListMap.type(config.data))) {
            throw new Error('unsupported datatype');
        }

        var Config = {
            initialState: Sortify(config.data),
            transformFunction: JsonOT.validate,
            userName: userName,
            channel: channel,
            cryptKey: cryptKey,
            crypto: crypto,
        };

        var rt;

        var onInit = Config.onInit = function (info) {
            // onInit
            config.onInit(info);
        };

        var onReady = Config.onReady = function (info) {
            // onReady
            config.onReady(info);
        };

        var onLocal = Config.onLocal = function () {
            // onLocal
            config.onLocal();
        };

        var onRemote = Config.onRemote = function (info) {
            // onRemote
            config.onRemote(info);
        };

        var onAbort = Config.onAbort = function (info) {
            // onAbort
            config.onAbort(info);
        };

        rt =Realtime.start(Config);
        var proxy = rt.proxy = ListMap.makeProxy(data);

        return rt;
    };

    return api;
});
