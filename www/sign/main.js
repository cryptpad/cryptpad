// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/bower_components/nthen/index.js',
    '/api/config',
    '/common/dom-ready.js',
    '/common/sframe-common-outer.js'
], function (nThen, ApiConfig, DomReady, SFCommonO) {

    // Loaded in load #2
    var hash, href;
    nThen(function (waitFor) {
        DomReady.onReady(waitFor());
    }).nThen(function (waitFor) {
        var obj = SFCommonO.initIframe(waitFor, true);
        href = obj.href;
        hash = obj.hash;
    }).nThen(function (/*waitFor*/) {
        var addData = function (meta, Cryptpad, user, Utils) {
            meta.filehash = Utils.currentPad.hash;
        };
        var addRpc = function (sframeChan, Cryptpad, Utils) {
            sframeChan.on('Q_SIGNCOLLECTIONS_SET', function (data, cb) {
                var chanIds = []
                //  Utils.Hash.hrefToHexChannelId(data, null);
                Cryptpad.pinPads(chanIds, function (e) {
                    if (e) { return void cb(e); }
                    Cryptpad.setSignCollections(data, cb);
                });
            });
            sframeChan.on('Q_SIGNCOLLECTIONS_GET', function (data, cb) {
                    Cryptpad.getSignCollections(cb);
            });
        };
        SFCommonO.start({
            cache: true,
            hash: hash,
            href: href,
            noRealtime: true,
            addRpc: addRpc,
            addData: addData
        });
    });
});
