// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/bower_components/nthen/index.js',
    '/api/config',
    'jquery',
    '/common/requireconfig.js',
    '/common/sframe-common-outer.js'
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
            ApiConfig.httpSafeOrigin + '/settings/inner.html?' + requireConfig.urlArgs +
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
    /* TODO
    window.addEventListener('storage', function (e) {
        if (e.key !== Cryptpad.userHashKey) { return; }
        var o = e.oldValue;
        var n = e.newValue;
        window.location.reload();
        if (o && !n) { // disconnect
            //redirectToMain();
        }
    });
    */
        var addRpc = function (sframeChan, Cryptpad, Utils) {
            sframeChan.on('Q_THUMBNAIL_CLEAR', function (d, cb) {
                Cryptpad.clearThumbnail(function (err, data) {
                    cb({err:err, data:data});
                });
            });
            sframeChan.on('Q_SETTINGS_DRIVE_GET', function (d, cb) {
                cb(Cryptpad.getProxy());
            });
            sframeChan.on('Q_SETTINGS_DRIVE_SET', function (data, cb) {
                var sjson = JSON.stringify(data);
                var k = Cryptpad.getUserHash() || localStorage[Cryptpad.fileHashKey];
                require(['/common/cryptget.js'], function (Crypt) {
                    Crypt.put(k, sjson, function (err) {
                        cb(err);
                    });
                });
            });
            sframeChan.on('Q_SETTINGS_DRIVE_RESET', function (data, cb) {
                var proxy = Cryptpad.getProxy();
                var realtime = Cryptpad.getRealtime();
                proxy.drive = Cryptpad.getStore().getEmptyObject();
                Utils.Realtime.whenRealtimeSyncs(realtime, cb);
            });
            sframeChan.on('Q_SETTINGS_LOGOUT', function (data, cb) {
                var proxy = Cryptpad.getProxy();
                var realtime = Cryptpad.getRealtime();
                var token = Math.floor(Math.random()*Number.MAX_SAFE_INTEGER);
                localStorage.setItem('loginToken', token);
                proxy.loginToken = token;
                Utils.Realtime.whenRealtimeSyncs(realtime, cb);
            });
            sframeChan.on('Q_SETTINGS_IMPORT_LOCAL', function (data, cb) {
                var proxyData = Cryptpad.getStore().getProxy();
                require(['/common/mergeDrive.js'], function (Merge) {
                    Merge.anonDriveIntoUser(proxyData, localStorage.FS_hash, cb);
                });
            });
        };
        SFCommonO.start({
            noRealtime: true,
            addRpc: addRpc
        });
    });
});
