// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/bower_components/nthen/index.js',
    '/api/config',
    '/common/dom-ready.js',
    '/common/sframe-common-outer.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function (nThen, ApiConfig, DomReady, SFCommonO) {
    var Nacl = window.nacl;

    var href, hash;
    // Loaded in load #2
    nThen(function (waitFor) {
        DomReady.onReady(waitFor());
    }).nThen(function (waitFor) {
        var obj = SFCommonO.initIframe(waitFor, true);
        href = obj.href;
        hash = obj.hash;
    }).nThen(function (/*waitFor*/) {
        var privateKey, publicKey;
        var channels = {};
        var getPropChannels = function () {
            return channels;
        };
        var addData = function (meta, CryptPad, user, Utils) {
            var keys = Utils.secret && Utils.secret.keys;

            var parsed = Utils.Hash.parseTypeHash('pad', hash.slice(1));
            if (parsed && parsed.auditorKey) {
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
            var _parsed = Utils.Hash.parseTypeHash('pad', auditorHash);
            meta.form_auditorHash = _parsed.getHash({auditorKey: privateKey});

        };
        var addRpc = function (sframeChan, Cryptpad, Utils) {
            sframeChan.on('EV_FORM_PIN', function (data) {
                channels.answersChannel = data.channel;
                Cryptpad.getPadAttribute('answersChannel', function (err, res) {
                    // If already stored, don't pin it again
                    if (res && res === data.channel) { return; }
                    Cryptpad.pinPads([data.channel], function () {
                        Cryptpad.setPadAttribute('answersChannel', data.channel, function () {});
                    });
                });

            });
            var getAnonymousKeys = function (formSeed, channel) {
                var array = Nacl.util.decodeBase64(formSeed + channel);
                var hash = Nacl.hash(array);
                var secretKey = Nacl.util.encodeBase64(hash.subarray(32));
                var publicKey = Utils.Hash.getCurvePublicFromPrivate(secretKey);
                return {
                    curvePrivate: secretKey,
                    curvePublic: publicKey,
                };
            };
            var u8_slice = function (A, start, end) {
                return new Uint8Array(Array.prototype.slice.call(A, start, end));
            };
            var u8_concat = function (A) {
                var length = 0;
                A.forEach(function (a) { length += a.length; });
                var total = new Uint8Array(length);

                var offset = 0;
                A.forEach(function (a) {
                    total.set(a, offset);
                    offset += a.length;
                });
                return total;
            };
            var anonProof = function (channel, theirPub, anonKeys) {
                var u8_plain = Nacl.util.decodeUTF8(channel);
                var u8_nonce = Nacl.randomBytes(Nacl.box.nonceLength);
                var u8_cipher = Nacl.box(
                    u8_plain,
                    u8_nonce,
                    Nacl.util.decodeBase64(theirPub),
                    Nacl.util.decodeBase64(anonKeys.curvePrivate)
                );
                var u8_bundle = u8_concat([
                    u8_nonce, // 24 uint8s
                    u8_cipher, // arbitrary length
                ]);
                return {
                    key: anonKeys.curvePublic,
                    proof: Nacl.util.encodeBase64(u8_bundle)
                };
            };
            var checkAnonProof = function (proofObj, channel, curvePrivate) {
                var pub = proofObj.key;
                var proofTxt = proofObj.proof;
                try {
                    var u8_bundle = Nacl.util.decodeBase64(proofTxt);
                    var u8_nonce = u8_slice(u8_bundle, 0, Nacl.box.nonceLength);
                    var u8_cipher = u8_slice(u8_bundle, Nacl.box.nonceLength);
                    var u8_plain = Nacl.box.open(
                        u8_cipher,
                        u8_nonce,
                        Nacl.util.decodeBase64(pub),
                        Nacl.util.decodeBase64(curvePrivate)
                    );
                } catch (e) { console.error(e); }
                return channel === Nacl.util.encodeUTF8(u8_plain);
            };
            sframeChan.on('Q_FORM_FETCH_ANSWERS', function (data, _cb) {
                var cb = Utils.Util.once(_cb);
                var myKeys = {};
                var myFormKeys;
                var accessKeys;
                var CPNetflux, Pinpad;
                var network;
                nThen(function (w) {
                    require([
                        '/bower_components/chainpad-netflux/chainpad-netflux.js',
                        '/common/pinpad.js',
                    ], w(function (_CPNetflux, _Pinpad) {
                        CPNetflux = _CPNetflux;
                        Pinpad = _Pinpad;
                    }));
                    Cryptpad.getAccessKeys(w(function (_keys) {
                        if (!Array.isArray(_keys)) { return; }
                        accessKeys = _keys;

                        _keys.some(function (_k) {
                            if ((!Cryptpad.initialTeam && !_k.id) || Cryptpad.initialTeam === _k.id) {
                                myKeys = _k;
                                return true;
                            }
                        });
                    }));
                    Cryptpad.getFormKeys(w(function (keys) {
                        myFormKeys = keys;
                    }));
                    Cryptpad.makeNetwork(w(function (err, nw) {
                        network = nw;
                    }));
                }).nThen(function () {
                    if (!network) { return void cb({error: "E_CONNECT"}); }

                    if (myFormKeys.formSeed) {
                        myFormKeys = getAnonymousKeys(myFormKeys.formSeed, data.channel);
                    }

                    var keys = Utils.secret && Utils.secret.keys;

                    var curvePrivate = privateKey || data.privateKey;
                    var crypto = Utils.Crypto.Mailbox.createEncryptor({
                        curvePrivate: curvePrivate,
                        curvePublic: publicKey || data.publicKey,
                        validateKey: data.validateKey
                    });
                    var config = {
                        network: network,
                        channel: data.channel,
                        noChainPad: true,
                        validateKey: keys.secondaryValidateKey,
                        owners: [myKeys.edPublic],
                        crypto: crypto,
                        // XXX Cache
                    };
                    var results = {};
                    config.onError = function (info) {
                        cb({ error: info.type });
                    };
                    config.onRejected = function (data, cb) {
                        if (!Array.isArray(data) || !data.length || data[0].length !== 16) {
                            return void cb(true);
                        }
                        if (!Array.isArray(accessKeys)) { return void cb(true); }
                        network.historyKeeper = data[0];
                        nThen(function (waitFor) {
                            accessKeys.forEach(function (obj) {
                                Pinpad.create(network, obj, waitFor(function (e) {
                                    console.log('done', obj);
                                    if (e) { console.error(e); }
                                }));
                            });
                        }).nThen(function () {
                            cb();
                        });
                    };
                    config.onReady = function () {
                        var myKey;
                        // If we have submitted an anonymous answer, retrieve it
                        if (myFormKeys.curvePublic && results[myFormKeys.curvePublic]) {
                            myKey = myFormKeys.curvePublic;
                        }
                        cb({
                            myKey: myKey,
                            results: results
                        });
                        network.disconnect();
                    };
                    config.onMessage = function (msg, peer, vKey, isCp, hash, senderCurve, cfg) {
                        var parsed = Utils.Util.tryParse(msg);
                        if (!parsed) { return; }
                        if (parsed._proof) {
                            var check = checkAnonProof(parsed._proof, data.channel, curvePrivate)
                            if (check) {
                                delete results[parsed._proof.key];
                            }
                        }
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
                }).nThen(function () {
                    if (answer.anonymous) {
                        if (!myKeys.formSeed) { return void cb({ error: "ANONYMOUS_ERROR" }); }
                        myKeys = getAnonymousKeys(myKeys.formSeed, data.channel);
                    }
                    Cryptpad.getHistoryRange({
                        channel: data.channel,
                        lastKnownHash: answer.hash,
                        toHash: answer.hash,
                    }, function (obj) {
                        if (obj && obj.error) { return void cb(obj); }
                        var messages = obj.messages;
                        var res = Utils.Crypto.Mailbox.openOwnSecretLetter(messages[0].msg, {
                            validateKey: data.validateKey,
                            ephemeral_private: Nacl.util.decodeBase64(answer.curvePrivate),
                            my_private: Nacl.util.decodeBase64(myKeys.curvePrivate),
                            their_public: Nacl.util.decodeBase64(data.publicKey)
                        });
                        res.content._isAnon = answer.anonymous;
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
                }).nThen(function () {
                    // XXX if we are a registered user (myKeys.curvePrivate exists), we may
                    // have already answered anonymously. We should send a "proof" to show
                    // that the existing anonymous answer are ours (using myKeys.formSeed).
                    // Even if we never answered anonymously, the keyPair would be unique to
                    // the current channel so it wouldn't leak anything.
                    var myAnonymousKeys;
                    if (data.anonymous) {
                        if (!myKeys.formSeed) { return void cb({ error: "ANONYMOUS_ERROR" }); }
                        myKeys = getAnonymousKeys(myKeys.formSeed, box.channel);
                    } else {
                        myAnonymousKeys = getAnonymousKeys(myKeys.formSeed, box.channel);
                    }
                    var keys = Utils.secret && Utils.secret.keys;
                    myKeys.signingKey = keys.secondarySignKey;

                    var ephemeral_keypair = Nacl.box.keyPair();
                    var ephemeral_private = Nacl.util.encodeBase64(ephemeral_keypair.secretKey);
                    myKeys.ephemeral_keypair = ephemeral_keypair;

                    if (myAnonymousKeys) {
                        var proof = anonProof(box.channel, box.publicKey, myAnonymousKeys);
                        data.results._proof = proof;
                    }

                    var crypto = Utils.Crypto.Mailbox.createEncryptor(myKeys);
                    var text = JSON.stringify(data.results);
                    var ciphertext = crypto.encrypt(text, box.publicKey);

                    var hash = ciphertext.slice(0,64);
                    Cryptpad.anonRpcMsg("WRITE_PRIVATE_MESSAGE", [
                        box.channel,
                        ciphertext
                    ], function (err, response) {
                        Cryptpad.storeFormAnswer({
                            channel: box.channel,
                            hash: hash,
                            curvePrivate: ephemeral_private,
                            anonymous: Boolean(data.anonymous)
                        });
                        cb({error: err, response: response, hash: hash});
                    });
                });
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
            messaging: true,
            getPropChannels: getPropChannels
        });
    });
});
