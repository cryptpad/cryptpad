// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/bower_components/nthen/index.js',
    '/api/config',
    'jquery',
    '/common/requireconfig.js',
    '/common/sframe-common-outer.js',
], function (nThen, ApiConfig, $, RequireConfig, SFCommonO) {
    var requireConfig = RequireConfig();

    // Loaded in load #2
    nThen(function (waitFor) {
        $(waitFor());
    }).nThen(function (waitFor) {
        var req = {
            cfg: requireConfig,
            req: [ '/common/loading.js' ],
            pfx: window.location.origin
        };
        window.rc = requireConfig;
        window.apiconf = ApiConfig;
        $('#sbox-iframe').attr('src',
            ApiConfig.httpSafeOrigin + '/drive/inner.html?' + requireConfig.urlArgs +
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
        var getSecrets = function (Cryptpad, Utils, cb) {
            var hash = window.location.hash.slice(1) || Utils.LocalStore.getUserHash() ||
                        Utils.LocalStore.getFSHash();
            cb(null, Utils.Hash.getSecrets('drive', hash));
        };
        var addRpc = function (sframeChan, Cryptpad, Utils) {
            sframeChan.on('EV_BURN_ANON_DRIVE', function () {
                if (Utils.LocalStore.isLoggedIn()) { return; }
                Utils.LocalStore.setFSHash('');
                Utils.LocalStore.clearThumbnail();
                window.location.reload();
            });
        };
        //Netflux.connect(NetConfig.getWebsocketURL()).then(function (network) {
            SFCommonO.start({
                getSecrets: getSecrets,
                //newNetwork: network,
                noHash: true,
                addRpc: addRpc
            });
        //}, function (err) { console.error(err); });
    });
});
