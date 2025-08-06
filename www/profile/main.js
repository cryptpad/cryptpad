// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/components/nthen/index.js',
    '/api/config',
    '/common/dom-ready.js',
    '/common/sframe-common-outer.js',
], function (nThen, ApiConfig, DomReady, SFCommonO) {

    // Loaded in load #2
    nThen(function (waitFor) {
        DomReady.onReady(waitFor());
    }).nThen(function (waitFor) {
        SFCommonO.initIframe(waitFor);
    }).nThen(function (/*waitFor*/) {
        var getSecrets = function (Cryptpad, Utils, cb) {
            var Hash = Utils.Hash;
            // hash in the URL: visit someone else's profile
            if (window.location.hash) {
                // No password for profiles
                const hash = window.location.hash.slice(1);
                return cb(null, Hash.getSecrets('profile', hash));
            }
            // open our own profile
            Cryptpad.getProfileViewUrl(function (hash) {
                cb(null, Hash.getSecrets('profile', hash));
            });
        };
        var addData = function (meta, Cryptpad, user) {
            meta.isOwnProfile = !window.location.hash ||
                window.location.hash.slice(1) === user.profile;
        };
        var addRpc = function (sframeChan, Cryptpad, Utils) {

            sframeChan.on('EV_PROFILE_CORRUPTED_CACHE', function () {
                Utils.Cache.clearChannel(Utils.secret.channel, function () {
                    window.location.reload();
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
