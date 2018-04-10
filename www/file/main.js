// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/bower_components/nthen/index.js',
    '/api/config',
    '/common/dom-ready.js',
    '/common/requireconfig.js',
    '/common/sframe-common-outer.js'
], function (nThen, ApiConfig, DomReady, RequireConfig, SFCommonO) {
    var requireConfig = RequireConfig();

    // Loaded in load #2
    nThen(function (waitFor) {
        DomReady.onReady(waitFor());
    }).nThen(function (waitFor) {
        var req = {
            cfg: requireConfig,
            req: [ '/common/loading.js' ],
            pfx: window.location.origin
        };
        window.rc = requireConfig;
        window.apiconf = ApiConfig;
        document.getElementById('sbox-iframe').setAttribute('src',
            ApiConfig.httpSafeOrigin + '/file/inner.html?' + requireConfig.urlArgs +
                '#' + encodeURIComponent(JSON.stringify(req)));

        // This is a cheap trick to avoid loading sframe-channel in parallel with the
        // loading screen setup.
        var done = waitFor();
        var onMsg = function (msg) {
            var data = JSON.parse(msg.data);
            if (data.q !== 'READY') { return; }
            window.removeEventListener('message', onMsg);
            var _done = done;
            done = function () { };
            _done();
        };
        window.addEventListener('message', onMsg);
    }).nThen(function (/*waitFor*/) {
        var addData = function (meta) {
            meta.filehash = window.location.hash;
        };
        SFCommonO.start({
            noRealtime: true,
            addData: addData
        });
    });
});
