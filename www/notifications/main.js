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
            addData: addData
        });
    });
});
