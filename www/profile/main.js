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
                return void cb(null, Hash.getSecrets('profile', window.location.hash.slice(1)));
            }
            var editHash;
            nThen(function (waitFor) {
                // 2nd case: visiting our own existing profile
                Cryptpad.getProfileEditUrl(waitFor(function (hash) {
                    editHash = hash;
                }));
            }).nThen(function () {
                if (!editHash) {
                    return void cb(null, Hash.getSecrets('profile', editHash));
                }
                // 3rd case: profile creation (create a new random hash, store it later if needed)
                if (!Utils.LocalStore.isLoggedIn()) { return void cb(); }
                var hash = Hash.createRandomHash();
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
                    profile.edit = Utils.Hash.getEditHashFromKeys(secret.channel, secret.keys);
                    profile.view = Utils.Hash.getViewHashFromKeys(secret.channel, secret.keys);
                    Cryptpad.setNewProfile(profile);
                });
                cb(null, secret);
            });
        };
        var addRpc = function (sframeChan, Cryptpad, Utils) {
            // Adding a new avatar from the profile: pin it and store it in the object
            sframeChan.on('Q_PROFILE_AVATAR_ADD', function (data, cb) {
                var chanId = Utils.Hash.hrefToHexChannelId(data);
                Cryptpad.pinPads([chanId], function (e) {
                    if (e) { return void cb(e); }
                    Cryptpad.setAvatar(data, cb);
                });
            });
            // Removing the avatar from the profile: unpin it
            sframeChan.on('Q_PROFILE_AVATAR_REMOVE', function (data, cb) {
                var chanId = Utils.Hash.hrefToHexChannelId(data);
                Cryptpad.unpinPads([chanId], function () {
                    Cryptpad.setAvatar(undefined, cb);
                });
            });
        };
        SFCommonO.start({
            getSecrets: getSecrets,
            noHash: true, // Don't add the hash in the URL if it doesn't already exist
            addRpc: addRpc,
            noRealtime: !localStorage.User_hash
        });
    });
});
