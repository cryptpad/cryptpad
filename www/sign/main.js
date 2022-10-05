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
        hash = obj.hash.replace("/sign/", "/file/   ");
        console.log("hash: " + hash);
    }).nThen(function (/*waitFor*/) {
        var addData = function (meta, Cryptpad, user, Utils) {
            console.log("filehash: " + Utils.currentPad.hash);
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
            sframeChan.on('Q_SIGN_DOCUMENT', function (data, cb) {
                    window.signDocCB = function(data) {
                      console.log("SIGNDOCUMENT: sign CB");
                      cb(data);
                    }
                    window.postMessage({ type: "CRYPTPAD_SIGN", data: data.data, passphrase: data.passphrase }, "*");
            });
            sframeChan.on('Q_GET_CERTIFICATE', function (data, cb) {
                    window.getCertificateCB = function(data) {
                      console.log("SIGNDOCUMENT: getCertificate CB ", data);
                      cb(data);
                    }
                    window.postMessage({ type: "CRYPTPAD_CERTIFICATE", data: "", passphrase: data.passphrase }, "*");
            });
        };
        console.log("sfcommon hash: " + hash);
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
