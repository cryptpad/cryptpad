/*@flow*/
/*::const define = (x)=>{};*/
(function () {
    var apiConf = window.CRYPTPAD_APICONF;
    var manHash = window.CRYPTPAD_MANIFEST_HASH;
    if (!apiConf) {
        return void define(['/api/config'], function (x) { return x; });
    }
    define(function () {
        console.log('x');
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
        return cfg;
    });
}());
