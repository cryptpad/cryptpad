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

            var parsed = Utils.Hash.parseTypeHash('pad', hash.slice(1));
            if (parsed.auditorKey) {
                meta.form_auditorKey = parsed.auditorKey;
                meta.form_auditorHash = hash;
            }

            var secondary = keys && keys.secondaryKey;
            if (!secondary) { return; }
            var curvePair = Nacl.box.keyPair.fromSecretKey(Nacl.util.decodeUTF8(secondary).slice(0,32));
            var validateKey = keys.secondaryValidateKey;
            meta.form_answerValidateKey = validateKey;

            publicKey = meta.form_public = Nacl.util.encodeBase64(curvePair.publicKey);
            privateKey = meta.form_private = Nacl.util.encodeBase64(curvePair.secretKey);

            var auditorHash = Utils.Hash.getViewHashFromKeys({
                version: 1,
                channel: Utils.secret.channel,
                keys: { viewKeyStr: Nacl.util.encodeBase64(keys.cryptKey) }
            });
            var parsed = Utils.Hash.parseTypeHash('pad', auditorHash);
            meta.form_auditorHash = parsed.getHash({auditorKey: privateKey});

        };
        var addRpc = function (sframeChan, Cryptpad, Utils) {
            sframeChan.on('Q_FORM_FETCH_ANSWERS', function (data, cb) {
                var myKeys = {};
                var CPNetflux;
                var network;
                nThen(function (w) {
                    require([
                        '/bower_components/chainpad-netflux/chainpad-netflux.js',
                    ], w(function (_CPNetflux, _Crypto) {
                        CPNetflux = _CPNetflux;
                    }));
                    Cryptpad.getAccessKeys(w(function (_keys) {
                        if (!Array.isArray(_keys)) { return; }

                        _keys.some(function (_k) {
                            if ((!Cryptpad.initialTeam && !_k.id) || Cryptpad.initialTeam === _k.id) {
                                myKeys = _k;
                                return true;
                            }
                        });
                    }));
                    Cryptpad.makeNetwork(w(function (err, nw) {
                        network = nw;
                    }));
                }).nThen(function (w) {
                    if (!network) { return void cb({error: "E_CONNECT"}); }

                    var keys = Utils.secret && Utils.secret.keys;

                    var crypto = Utils.Crypto.Mailbox.createEncryptor({
                        curvePrivate: privateKey || data.privateKey,
                        curvePublic: publicKey || data.publicKey,
                        validateKey: data.validateKey
                    });
                    var config = {
                        network: network,
                        channel: data.channel,
                        noChainPad: true,
                        validateKey: keys.secondaryValidateKey,
                        owners: [myKeys.edPublic], // XXX add pad owner
                        crypto: crypto,
                        // XXX Cache
                    };
                    var results = {};
                    config.onReady = function () {
                        cb(results);
                        network.disconnect();
                    };
                    config.onMessage = function (msg, peer, vKey, isCp, hash, senderCurve, cfg) {
                        var parsed = Utils.Util.tryParse(msg);
                        if (!parsed) { return; }
                        results[senderCurve] = {
                            msg: parsed,
                            hash: hash,
                            time: cfg.time
                        };
                    };
                    CPNetflux.start(config);
                });
            });
            sframeChan.on("Q_FETCH_MY_ANSWERS", function (data, cb) {
                var keys;
                var CPNetflux;
                var network;
                var answer;
                var myKeys;
                nThen(function (w) {
                    Cryptpad.getFormKeys(w(function (keys) {
                        myKeys = keys;
                    }));
                    Cryptpad.getFormAnswer({channel: data.channel}, w(function (obj) {
                        if (!obj || obj.error) {
                            w.abort();
                            return void cb(obj);
                        }
                        answer = obj;
                    }));
                }).nThen(function (w) {
                    Cryptpad.getHistoryRange({
                        channel: data.channel,
                        lastKnownHash: answer.hash,
                        toHash: answer.hash,
                    }, function (obj) {
                        if (obj && obj.error) { return void cb(obj); }
                        var messages = obj.messages;
                        var ephemeral_priv = answer.curvePrivate;
                        var res = Utils.Crypto.Mailbox.openOwnSecretLetter(messages[0].msg, {
                            validateKey: data.validateKey,
                            ephemeral_private: Nacl.util.decodeBase64(answer.curvePrivate),
                            my_private: Nacl.util.decodeBase64(myKeys.curvePrivate),
                            their_public: Nacl.util.decodeBase64(data.publicKey)
                        });
                        cb(JSON.parse(res.content));
                    });

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

                    var ephemeral_keypair = Nacl.box.keyPair();
                    var ephemeral_private = Nacl.util.encodeBase64(ephemeral_keypair.secretKey);
                    myKeys.ephemeral_keypair = ephemeral_keypair;

                    var crypto = Utils.Crypto.Mailbox.createEncryptor(myKeys);
                    var text = JSON.stringify(data.results);
                    var ciphertext = crypto.encrypt(text, box.publicKey);

                    var hash = ciphertext.slice(0,64); // XXX use this to recover our previous answers
                    Cryptpad.anonRpcMsg("WRITE_PRIVATE_MESSAGE", [
                        box.channel,
                        ciphertext
                    ], function (err, response) {
                        Cryptpad.storeFormAnswer({
                            channel: box.channel,
                            hash: hash,
                            curvePrivate: ephemeral_private
                        });
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
