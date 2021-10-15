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
        SFCommonO.initIframe(waitFor, true);
    }).nThen(function (/*waitFor*/) {
        var category;
        if (window.location.hash) {
            category = window.location.hash.slice(1);
            window.location.hash = '';
        }
        var addRpc = function (sframeChan) {
            // X2T
            var x2t;
            var onConvert = function (obj, cb) {
                x2t.convert(obj, cb);
            };
            sframeChan.on('Q_OO_CONVERT', function (obj, cb) {
                if (x2t) { return void onConvert(obj, cb); }
                require(['/common/outer/x2t.js'], function (X2T) {
                    x2t = X2T.start();
                    onConvert(obj, cb);
                });
            });
        };
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
