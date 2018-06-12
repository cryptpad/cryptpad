// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/bower_components/nthen/index.js',
    '/common/config.js',
    '/common/dom-ready.js',
    '/common/sframe-common-outer.js',
    '/common/boot2.js#manifest'
], function (nThen, ApiConfig, DomReady, SFCommonO, Manifest) {
    var padType = window.location.pathname.replace(/\//g, '');
    var hash = Manifest.files[padType]['inner.html'];
    var url = ApiConfig.httpSafeOrigin + window.location.pathname +
        'inner.html?ver=' + encodeURIComponent(hash);
    nThen(function (waitFor) {
        DomReady.onReady(waitFor());
        // IE doesn't support integrity or fetch, so no security with IE
        if (window.fetch) {
            fetch(url, { integrity: 'sha256-' + hash }).then(waitFor()).catch(function (e) {
                throw e;
            });
        }
    }).nThen(function (waitFor) {
        var req = {
            cfg: ApiConfig.requireConf,
            req: [ '/common/loading.js' ],
            pfx: window.location.origin,
            apiConfS: JSON.stringify(ApiConfig),
            requireHash: Manifest.files.bower_components.requirejs['require.js']
        };
        window.rc = ApiConfig.requireConf;
        window.apiconf = ApiConfig;
        var ifr = document.getElementById('sbox-iframe');
        ifr.setAttribute('src',
            ApiConfig.httpSafeOrigin + window.location.pathname + 'inner.html?ver=' +
                encodeURIComponent(hash) + '#' + encodeURIComponent(JSON.stringify(req)));
        ifr.setAttribute('integrity', hash);

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
        SFCommonO.start({
            useCreationScreen: true
        });
    });
});
