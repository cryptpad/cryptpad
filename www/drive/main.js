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
    var hash, href;
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

        // Hidden hash
        hash = window.location.hash;
        href = window.location.href;
        if (window.history && window.history.replaceState && hash) {
            window.history.replaceState({}, window.document.title, '#');
        }

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
        var afterSecrets = function (Cryptpad, Utils, secret, cb, sframeChan) {
            var _hash = hash.slice(1);
            if (_hash && Utils.LocalStore.isLoggedIn()) {
                // Add a shared folder!
                Cryptpad.addSharedFolder(null, secret, function (id) {
                    if (id && typeof(id) === "object" && id.error) {
                        sframeChan.event("EV_RESTRICTED_ERROR");
                        return;
                    }

                    window.CryptPad_newSharedFolder = id;

                    // Clear the hash now that the secrets have been generated
                    if (window.history && window.history.replaceState && hash) {
                        window.history.replaceState({}, window.document.title, '#');
                    }

                    cb();
                });
                return;
            } else if (_hash) {
                var id = Utils.Util.createRandomInteger();
                window.CryptPad_newSharedFolder = id;
                var data = {
                    href: Utils.Hash.getRelativeHref(Cryptpad.currentPad.href),
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
                    Cryptpad.getSharedFolder({
                        id: data.sharedFolder
                    }, function (obj) {
                        cb(obj);
                    });
                    return;
                }
                Cryptpad.getUserObject(null, function (obj) {
                    cb(obj);
                });
            });
            Cryptpad.onNetworkDisconnect.reg(function () {
                sframeChan.event('EV_NETWORK_DISCONNECT');
            });
            Cryptpad.onNetworkReconnect.reg(function () {
                sframeChan.event('EV_NETWORK_RECONNECT');
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
        var addData = function (meta, Cryptpad) {
            if (!window.CryptPad_newSharedFolder) { return; }
            meta.anonSFHref = Cryptpad.currentPad.href;
        };
        SFCommonO.start({
            hash: hash,
            href: href,
            afterSecrets: afterSecrets,
            noHash: true,
            noRealtime: true,
            driveEvents: true,
            addRpc: addRpc,
            addData: addData,
            isDrive: true,
        });
    });
});
