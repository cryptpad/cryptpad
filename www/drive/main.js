// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/bower_components/nthen/index.js',
    '/api/config',
    '/common/dom-ready.js',
    '/common/requireconfig.js',
    '/common/sframe-common-outer.js',
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
        var afterSecrets = function (Cryptpad, Utils, secret, cb) {
            var hash = window.location.hash.slice(1);
            if (hash && Utils.LocalStore.isLoggedIn()) {
                // Add a shared folder!
                Cryptpad.addSharedFolder(secret, function (id) {
                    window.CryptPad_newSharedFolder = id;
                    cb();
                });
                return;
            } else if (hash) {
                var id = Utils.Util.createRandomInteger();
                window.CryptPad_newSharedFolder = id;
                var data = {
                    href: Utils.Hash.getRelativeHref(window.location.href),
                    password: secret.password
                };
                return void Cryptpad.loadSharedFolder(id, data, cb);
            }
            cb();
        };
        var addRpc = function (sframeChan, Cryptpad, Utils) {
            sframeChan.on('EV_BURN_ANON_DRIVE', function () {
                if (Utils.LocalStore.isLoggedIn()) { return; }
                Utils.LocalStore.setFSHash('');
                Utils.LocalStore.clearThumbnail();
                window.location.reload();
            });
            sframeChan.on('Q_DRIVE_USEROBJECT', function (data, cb) {
                Cryptpad.userObjectCommand(data, cb);
            });
            sframeChan.on('Q_DRIVE_RESTORE', function (data, cb) {
                Cryptpad.restoreDrive(data, cb);
            });
            sframeChan.on('Q_DRIVE_GETOBJECT', function (data, cb) {
                if (data && data.sharedFolder) {
                    Cryptpad.getSharedFolder(data.sharedFolder, function (obj) {
                        cb(obj);
                    });
                    return;
                }
                Cryptpad.getUserObject(function (obj) {
                    cb(obj);
                });
            });
            sframeChan.on('EV_DRIVE_SET_HASH', function (hash) {
                // Update the hash in the address bar
                if (!Utils.LocalStore.isLoggedIn()) { return; }
                var ohc = window.onhashchange;
                window.onhashchange = function () {};
                window.location.hash = hash || '';
                window.onhashchange = ohc;
                ohc({reset:true});
            });
            Cryptpad.onNetworkDisconnect.reg(function () {
                sframeChan.event('EV_NETWORK_DISCONNECT');
            });
            Cryptpad.onNetworkReconnect.reg(function (data) {
                sframeChan.event('EV_NETWORK_RECONNECT', data);
            });
            Cryptpad.drive.onLog.reg(function (msg) {
                sframeChan.event('EV_DRIVE_LOG', msg);
            });
            Cryptpad.drive.onChange.reg(function (data) {
                sframeChan.event('EV_DRIVE_CHANGE', data);
            });
            Cryptpad.drive.onRemove.reg(function (data) {
                sframeChan.event('EV_DRIVE_REMOVE', data);
            });
        };
        SFCommonO.start({
            afterSecrets: afterSecrets,
            noHash: true,
            noRealtime: true,
            driveEvents: true,
            addRpc: addRpc,
            isDrive: true,
        });
    });
});
