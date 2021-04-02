// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/bower_components/nthen/index.js',
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
            // XXX open calendar from URL
        };
        var addData = function (meta, Cryptpad, user) {
            // XXX flag when opening URL
            meta.isOwnProfile = !window.location.hash ||
                window.location.hash.slice(1) === user.profile;
        };
        SFCommonO.start({
            //getSecrets: getSecrets,
            //noHash: true, // Don't add the hash in the URL if it doesn't already exist
            //addRpc: addRpc,
            //addData: addData,
            //owned: true,
            noRealtime: true
        });
    });
});
