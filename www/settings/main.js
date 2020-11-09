// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/bower_components/nthen/index.js',
    '/api/config',
    '/common/dom-ready.js',
    '/common/sframe-common-outer.js'
], function (nThen, ApiConfig, DomReady, SFCommonO) {

    // Loaded in load #2
    nThen(function (waitFor) {
        DomReady.onReady(waitFor());
    }).nThen(function (waitFor) {
        SFCommonO.initIframe(waitFor);
    }).nThen(function (/*waitFor*/) {
        var addRpc = function (sframeChan, Cryptpad, Utils) {
            sframeChan.on('Q_THUMBNAIL_CLEAR', function (d, cb) {
                Utils.LocalStore.clearThumbnail(function (err, data) {
                    cb({err:err, data:data});
                });
            });
            sframeChan.on('Q_SETTINGS_DRIVE_GET', function (d, cb) {
                Cryptpad.getUserObject(null, function (obj) {
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
                                    id: id
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
            sframeChan.on('Q_SETTINGS_DRIVE_SET', function (data, cb) {
                if (data && data.uo) { data = data.uo; }
                var sjson = JSON.stringify(data);
                require([
                    '/common/cryptget.js',
                ], function (Crypt) {
                    var k = Utils.LocalStore.getUserHash() || Utils.LocalStore.getFSHash();
                    Crypt.put(k, sjson, function (err) {
                        cb(err);
                    });
                });
            });
            sframeChan.on('Q_SETTINGS_DRIVE_RESET', function (data, cb) {
                Cryptpad.resetDrive(cb);
            });
            sframeChan.on('Q_SETTINGS_LOGOUT', function (data, cb) {
                Cryptpad.logoutFromAll(cb);
            });
            sframeChan.on('Q_SETTINGS_IMPORT_LOCAL', function (data, cb) {
                Cryptpad.mergeAnonDrive(cb);
            });
            sframeChan.on('Q_SETTINGS_DELETE_ACCOUNT', function (data, cb) {
                Cryptpad.deleteAccount(cb);
            });
        };
        var category;
        if (window.location.hash) {
            category = window.location.hash.slice(1);
            window.location.hash = '';
        }
        var addData = function (obj) {
            if (category) { obj.category = category; }
        };
        SFCommonO.start({
            noRealtime: true,
            addRpc: addRpc,
            addData: addData
        });
    });
});
