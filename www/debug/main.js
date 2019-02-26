// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/bower_components/nthen/index.js',
    '/api/config',
    'jquery',
    '/common/requireconfig.js',
    '/common/sframe-common-outer.js',
    '/common/cryptpad-common.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-realtime.js',
    '/common/common-constants.js',
    '/common/common-interface.js',
], function (nThen, ApiConfig, $, RequireConfig, SFCommonO,
    Cryptpad, Util, Hash, Realtime, Constants, UI) {

    window.Cryptpad = {
        Common: Cryptpad,
        Util: Util,
        Hash: Hash,
        Realtime: Realtime,
        Constants: Constants,
        UI: UI
    };

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
            ApiConfig.httpSafeOrigin + '/debug/inner.html?' + requireConfig.urlArgs +
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
        var hash = localStorage[Constants.userHashKey];
        var drive = hash && ('#'+hash === window.location.hash);
        if (!window.location.hash) {
            if (!hash) {
                sessionStorage.redirectTo = '/debug/';
                window.location.href = '/login/';
                return;
            }
            drive = true;
            window.location.hash = hash;
        } else {
            var p = Hash.parsePadUrl('/debug/'+window.location.hash);
            if (p && p.hashData && p.hashData.app === 'drive') {
                drive = true;
            }
        }
        var addData = function (meta) {
            meta.debugDrive = drive;
        };
        SFCommonO.start({
            addData:addData
        });
    });
});
