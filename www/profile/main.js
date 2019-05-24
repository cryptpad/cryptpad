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
            ApiConfig.httpSafeOrigin + '/profile/inner.html?' + requireConfig.urlArgs +
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
            var Hash = Utils.Hash;
            // 1st case: visiting someone else's profile with hash in the URL
            if (window.location.hash) {
                // No password for profiles
                return void cb(null, Hash.getSecrets('profile', window.location.hash.slice(1)));
            }
            nThen(function (waitFor) {
                // 2nd case: visiting our own existing profile
                Cryptpad.getProfileEditUrl(waitFor(function (hash) {
                    waitFor.abort();
                    return void cb(null, Hash.getSecrets('profile', hash));
                }));
            }).nThen(function () {
                if (!Utils.LocalStore.isLoggedIn()) {
                    // Unregistered users can't create a profile
                    window.location.href = '/drive/';
                    return void cb();
                }
                // No password for profile
                var hash = Hash.createRandomHash('profile');
                var secret = Hash.getSecrets('profile', hash);
                Cryptpad.pinPads([secret.channel], function (e) {
                    if (e) {
                        if (e === 'E_OVER_LIMIT') {
                            // TODO
                        }
                        return;
                        //return void UI.log(Messages._getKey('profile_error', [e])) // TODO
                    }
                    var profile = {};
                    profile.edit = Utils.Hash.getEditHashFromKeys(secret);
                    profile.view = Utils.Hash.getViewHashFromKeys(secret);
                    Cryptpad.setNewProfile(profile);
                });
                cb(null, secret);
            });
        };
        var addData = function (meta, Cryptad, user) {
            meta.isOwnProfile = !window.location.hash ||
                window.location.hash.slice(1) === user.profile;
        };
        var addRpc = function (sframeChan, Cryptpad, Utils) {
            // Adding a new avatar from the profile: pin it and store it in the object
            sframeChan.on('Q_PROFILE_AVATAR_ADD', function (data, cb) {
                var chanId = Utils.Hash.hrefToHexChannelId(data, null);
                Cryptpad.pinPads([chanId], function (e) {
                    if (e) { return void cb(e); }
                    Cryptpad.setAvatar(data, cb);
                });
            });
            // Removing the avatar from the profile: unpin it
            sframeChan.on('Q_PROFILE_AVATAR_REMOVE', function (data, cb) {
                var chanId = Utils.Hash.hrefToHexChannelId(data, null);
                Cryptpad.unpinPads([chanId], function () {
                    Cryptpad.setAvatar(undefined, cb);
                });
            });
        };
        SFCommonO.start({
            getSecrets: getSecrets,
            noHash: true, // Don't add the hash in the URL if it doesn't already exist
            addRpc: addRpc,
            addData: addData,
            owned: true
        });
    });
});
