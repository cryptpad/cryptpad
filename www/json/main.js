require.config({ paths: { 'json.sortify': '/bower_components/json.sortify/dist/JSON.sortify' } });
define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/common/realtime-input.js',
    '/common/crypto.js',
    '/bower_components/textpatcher/TextPatcher.amd.js',
    'json.sortify',
    '/common/json-ot.js',
    '/json/compare.js',
    '/bower_components/proxy-polyfill/proxy.min.js', // https://github.com/GoogleChrome/proxy-polyfill
    '/bower_components/jquery/dist/jquery.min.js',
    '/customize/pad.js'
], function (Config, Realtime, Crypto, TextPatcher, Sortify, JsonOT, Compare) {
    // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Proxy#A_complete_traps_list_example
    // https://github.com/xwiki-labs/RealtimeJSON
    // https://github.com/xwiki-labs/ChainJSON
    var $ = window.jQuery;
    var Proxy = window.Proxy;

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

    var onLocal = config.onLocal = module.bump = function () {
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

        if (Compare.isArray(parsed)) {
            // what's different about arrays?
        } else if (Compare.type(parsed) === 'object') { /*
            don't use native typeof because 'null' is an object, but you can't
            proxy it, so you need to distinguish */
            Compare.objects(Map, parsed, function (obj) {
                console.log("constructing new proxy for type [%s]", Compare.type(obj));
                return module.makeProxy(obj);
            }, []);
        } else {
            throw new Error("unsupported realtime datatype");
        }

    };

    var onReady = config.onReady = function (info) {
        console.log("READY");

        var userDoc = module.realtime.getUserDoc();
        var parsed = JSON.parse(userDoc);

        //Compare.objects(module.proxy, parsed, module.makeProxy, []);
        Object.keys(parsed).forEach(function (key) {
            Map[key] = module.recursiveProxies(parsed[key]);
        });

        setEditable(true);
        initializing = false;
    };

    var onAbort = config.onAbort = function (info) {
        window.alert("Network Connection Lost");
    };

    var rt = Realtime.start(config);

    var handler = {
        get: function (obj, prop) {
            // FIXME magic?
            if (prop === 'length' && typeof(obj.length) === 'number') {
                return obj.length;
            }

            //console.log("Getting [%s]", prop);
            return obj[prop];
        },
        set: function (obj, prop, value) {
            if (prop === 'on') {
                throw new Error("'on' is a reserved attribute name for realtime lists and maps");
            }
            if (obj[prop] === value) { return value; }

            var t_value = Compare.type(value);
            if (['array', 'object'].indexOf(t_value) !== -1) {
                console.log("Constructing new proxy for value with type [%s]", t_value);
                var proxy = obj[prop] = module.makeProxy(value);
                //onLocal();
                //return proxy;
            } else {
                console.log("Setting [%s] to [%s]", prop, value);
                obj[prop] = value;
            }

            onLocal();
            return obj[prop];
        }
    };

    var makeProxy = module.makeProxy = function (obj) {
        return new Proxy(obj, handler);
    };

    var recursiveProxies = module.recursiveProxies = function (obj) {
        var t_obj = Compare.type(obj);

        var proxy;

        switch (t_obj) {
            case 'object':
                proxy = makeProxy({});
                Compare.objects(proxy, obj, makeProxy, []);
                return proxy;
            case 'array':
                proxy = makeProxy([]);
                Compare.arrays(proxy, obj, makeProxy, []);
                return proxy;
            default:
                return obj;
        }
    };

    var proxy = module.proxy = makeProxy(Map);

    $repl.on('keyup', function (e) {
        if (e.which === 13) {
            var value = $repl.val();

            if (!value.trim()) { return; }

            console.log("evaluating `%s`", value);

            var x = proxy;
            console.log('> ', eval(value)); // jshint ignore:line
            //console.log(Sortify(proxy));
            console.log();
            $repl.val('');
        }
    });
});
