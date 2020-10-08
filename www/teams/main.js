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
            ApiConfig.httpSafeOrigin + '/teams/inner.html?' + requireConfig.urlArgs +
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
        var teamId;
        var addRpc = function (sframeChan, Cryptpad, Utils) {
            sframeChan.on('Q_SET_TEAM', function (data, cb) {
                teamId = data;
                cb();
            });

            sframeChan.on('Q_DRIVE_USEROBJECT', function (data, cb) {
                if (!teamId) { return void cb({error: 'EINVAL'}); }
                data.teamId = teamId;
                Cryptpad.userObjectCommand(data, cb);
            });
            sframeChan.on('Q_DRIVE_GETOBJECT', function (data, cb) {
                if (!teamId) { return void cb({error: 'EINVAL'}); }
                if (data && data.sharedFolder) {
                    Cryptpad.getSharedFolder({
                        teamId: teamId,
                        id: data.sharedFolder
                    }, function (obj) {
                        cb(obj);
                    });
                    return;
                }
                Cryptpad.getUserObject(teamId, function (obj) {
                    cb(obj);
                });
            });
            Cryptpad.onNetworkDisconnect.reg(function () {
                sframeChan.event('EV_NETWORK_DISCONNECT');
            });
            Cryptpad.onNetworkReconnect.reg(function () {
                sframeChan.event('EV_NETWORK_RECONNECT');
            });
            Cryptpad.universal.onEvent.reg(function (obj) {
                // Intercept events for the team drive and send them the required way
                if (obj.type !== 'team') { return; }
                if (['DRIVE_CHANGE', 'DRIVE_LOG', 'DRIVE_REMOVE'].indexOf(obj.data.ev) !== -1) {
                    sframeChan.event('EV_'+obj.data.ev, obj.data.data);
                }
                if (obj.data.ev === 'NETWORK_RECONNECT') {
                    sframeChan.event('EV_NETWORK_RECONNECT');
                }
                if (obj.data.ev === 'NETWORK_DISCONNECT') {
                    sframeChan.event('EV_NETWORK_DISCONNECT');
                }
            });

            sframeChan.on('Q_SETTINGS_DRIVE_GET', function (d, cb) {
                Cryptpad.getUserObject(teamId, function (obj) {
                    if (obj.error) { return void cb(obj); }
                    if (d === "full") {
                        // We want shared folders too
                        var result = {
                            uo: obj,
                            sf: {}
                        };
                        if (!obj.drive || !obj.drive.sharedFolders) { return void cb(result); }
                        Utils.nThen(function (waitFor) {
                            Object.keys(obj.drive.sharedFolders).forEach(function (id) {
                                Cryptpad.getSharedFolder({
                                    id: id,
                                    teamId: teamId
                                }, waitFor(function (obj) {
                                    result.sf[id] = obj;
                                }));
                            });
                        }).nThen(function () {
                            cb(result);
                        });
                        return;
                    }
                    // We want only the user object
                    cb(obj);
                });
            });
        };
        var getSecrets = function (Cryptpad, Utils, cb) {
            var Hash = Utils.Hash;
            var hash = Hash.createRandomHash('profile');
            var secret = Hash.getSecrets('team', hash);
            cb(null, secret);
        };
        var addData = function (meta) {
            if (!hash) { return; }
            meta.teamInviteHash = hash.slice(1);
        };
        SFCommonO.start({
            getSecrets: getSecrets,
            hash: hash,
            href: href,
            noHash: true,
            noRealtime: true,
            //driveEvents: true,
            addRpc: addRpc,
            addData: addData,
            isDrive: true, // Used for history...
        });
    });
});
