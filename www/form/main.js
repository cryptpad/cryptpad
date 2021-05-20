// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/bower_components/nthen/index.js',
    '/api/config',
    '/common/dom-ready.js',
    '/common/sframe-common-outer.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function (nThen, ApiConfig, DomReady, SFCommonO) {
    var Nacl = window.nacl;

    // Loaded in load #2
    nThen(function (waitFor) {
        DomReady.onReady(waitFor());
    }).nThen(function (waitFor) {
        var obj = SFCommonO.initIframe(waitFor, true);
        href = obj.href;
        hash = obj.hash;
    }).nThen(function (/*waitFor*/) {
        var privateKey, publicKey;
        var addData = function (meta, CryptPad, user, Utils) {
            var keys = Utils.secret && Utils.secret.keys;
            var secondary = keys && keys.secondaryKey;
            if (!secondary) { return; }
            var curvePair = Nacl.box.keyPair.fromSecretKey(Nacl.util.decodeUTF8(secondary).slice(0,32));
            publicKey = meta.form_public = Nacl.util.encodeBase64(curvePair.publicKey);
            privateKey = Nacl.util.encodeBase64(curvePair.secretKey);
        };
        var addRpc = function (sframeChan, Cryptpad, Utils) {
            sframeChan.on('Q_FORM_FETCH_ANSWERS', function (data, cb) {
                var keys;
                var CPNetflux;
                var network;
                nThen(function (w) {
                    require([
                        '/bower_components/chainpad-netflux/chainpad-netflux.js',
                    ], w(function (_CPNetflux, _Crypto) {
                        CPNetflux = _CPNetflux;
                    }));
                    Cryptpad.getAccessKeys(w(function (_keys) {
                        keys = _keys;
                    }));
                    Cryptpad.makeNetwork(w(function (err, nw) {
                        network = nw;
                    }));
                }).nThen(function (w) {
                    if (!network) { return void cb({error: "E_CONNECT"}); }

                    var keys = Utils.secret && Utils.secret.keys;

                    var crypto = Utils.Crypto.Mailbox.createEncryptor({
                        curvePrivate: privateKey,
                        curvePublic: publicKey || data.publicKey
                    });
                    var config = {
                        network: network,
                        channel: data.channel,
                        noChainPad: true,
                        validateKey: keys.secondaryValidateKey,
                        owners: [], // XXX add pad owner
                        crypto: crypto,
                        // XXX Cache
                    };
                    config.onReady = function () {
                        cb();
                        // XXX
                        network.disconnect();
                    };
                    config.onMessage = function () {
                        // XXX
                    };
                    CPNetflux.start(config);
                });
            });
            sframeChan.on("Q_FORM_SUBMIT", function (data, cb) {
                var box = data.mailbox;
                var myKeys;
                nThen(function (w) {
                    Cryptpad.getFormKeys(w(function (keys) {
                        myKeys = keys;
                    }));
                }).nThen(function (w) {

                    var keys = Utils.secret && Utils.secret.keys;
                    myKeys.signingKey = keys.secondarySignKey;

                    var crypto = Utils.Crypto.Mailbox.createEncryptor(myKeys);
                    var text = JSON.stringify(data.results);
                    var ciphertext = crypto.encrypt(text, box.publicKey);

                    var hash = ciphertext.slice(0,64); // XXX use this to recover our previous answers
                    Cryptpad.anonRpcMsg("WRITE_PRIVATE_MESSAGE", [
                        box.channel,
                        ciphertext
                    ], function (err, response) {
                        cb({error: err, response: response, hash: hash});
                    });
                });
            });
            sframeChan.on('EV_FORM_MAILBOX', function (data) {
                var curvePair = Nacl.box.keyPair();
                publicKey = Nacl.util.encodeBase64(curvePair.publicKey);
                privateKey = Nacl.util.encodeBase64(curvePair.secretKey);
            });
        };
        SFCommonO.start({
            addData: addData,
            addRpc: addRpc,
            cache: true,
            noDrive: true,
            hash: hash,
            href: href,
            useCreationScreen: true,
            messaging: true
        });
    });
});
