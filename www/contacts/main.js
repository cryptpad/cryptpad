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
        SFCommonO.start({
            noRealtime: true,
            messaging: true,
        });
    });
});
