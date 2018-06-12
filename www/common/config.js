/*@flow*/
/*::const define = (x,y)=>{};*/
(function () {
    var requireConf = {
        // fix up locations so that relative urls work.
        baseUrl: window.location.pathname,
        paths: { 
            // jquery declares itself as literally "jquery" so it cannot be pulled by path :(
            "jquery": "/bower_components/jquery/dist/jquery.min",
            // json.sortify same
            "json.sortify": "/bower_components/json.sortify/dist/JSON.sortify",
            //"pdfjs-dist/build/pdf": "/bower_components/pdfjs-dist/build/pdf",
            //"pdfjs-dist/build/pdf.worker": "/bower_components/pdfjs-dist/build/pdf.worker"
            cm: '/bower_components/codemirror'
        },
        map: {
            '*': {
                'css': '/bower_components/require-css/css.js',
                'less': '/common/RequireLess.js',
                'json': '/common/RequireJson.js'
            }
        }
    };
    var extendRequireConf = function (ApiConfig) {
        var out = JSON.parse(JSON.stringify(requireConf));
        Object.keys(ApiConfig.requireConf).forEach(function (k) { out[k] = ApiConfig.requireConf[k]; });
        ApiConfig.requireConf = Object.freeze(out);
    };
    var apiConf = window.CRYPTPAD_APICONF;
    var manHash = window.CRYPTPAD_MANIFEST_HASH;
    if (!apiConf) {
        return define(['json!/api/config.json'], function (x) {
            extendRequireConf(x);
            return Object.freeze(x);
        });
    }
    define(function () {
        apiConf = apiConf || window.CRYPTPAD_APICONF;
        manHash = manHash || window.CRYPTPAD_MANIFEST_HASH;
        var cfg = JSON.parse(apiConf);
        cfg.manifestHash = cfg.manifestHash || manHash;
        if (!cfg.httpSafeOrigin) {
            if (cfg.httpSafePort) {
                cfg.httpSafeOrigin =
                    window.location.origin.replace(/\:[0-9]+$/, ':' +  cfg.httpSafePort);
            }
            cfg.httpSafeOrigin = window.location.origin;
        }
        extendRequireConf(cfg);
        return Object.freeze(cfg);
    });
 }());
