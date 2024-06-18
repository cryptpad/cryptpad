// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/components/nthen/index.js',
    '/api/config',
    '/common/dom-ready.js',
    '/common/sframe-common-outer.js',
    '/components/tweetnacl/nacl-fast.min.js',
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

            var formData = Utils.Hash.getFormData(Utils.secret);
            if (!formData) { return; }

            var validateKey = keys.secondaryValidateKey;
            meta.form_answerValidateKey = validateKey;

            publicKey = meta.form_public = formData.form_public;
            privateKey = meta.form_private = formData.form_private;
            meta.form_auditorHash = formData.form_auditorHash;
        };
        var addRpc = function (sframeChan, Cryptpad, Utils) {
            sframeChan.on('EV_FORM_PIN', function (data) {
                channels.answersChannel = data.channel;
                Cryptpad.changeMetadata();
                Cryptpad.getPadAttribute('answersChannel', function (err, res) {
                    // If already stored, don't pin it again
                    if (res && res === data.channel) { return; }
                    Cryptpad.pinPads([data.channel], function () {
                        Cryptpad.setPadAttribute('answersChannel', data.channel, function () {});
                    });
                });
            });
            sframeChan.on('EV_EXPORT_SHEET', function (data) {
                if (!data || !Array.isArray(data.content)) { return; }
                sessionStorage.CP_formExportSheet = JSON.stringify(data);
                var href = Utils.Hash.hashToHref('', 'sheet');
                var a = window.open(href);
                if (!a) { sframeChan.event('EV_POPUP_BLOCKED'); }
                delete sessionStorage.CP_formExportSheet;
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
                    return channel === Nacl.util.encodeUTF8(u8_plain);
                } catch (e) {
                    console.error(e);
                    return false;
                }
            };

            var deleteLines = false; // "false" to support old forms
            sframeChan.on('Q_FORM_FETCH_ANSWERS', function (data, _cb) {
                var cb = Utils.Util.once(_cb);
                var myKeys = {};
                var myFormKeys;
                var accessKeys;
                var CPNetflux, Pinpad;
                var network;
                var noDriveAnswered = false;
                nThen(function (w) {
                    require([
                        'chainpad-netflux',
                        '/common/pinpad.js',
                    ], w(function (_CPNetflux, _Pinpad) {
                        CPNetflux = _CPNetflux;
                        Pinpad = _Pinpad;
                    }));
                    var personalDrive = !Cryptpad.initialTeam || Cryptpad.initialTeam === -1;
                    Cryptpad.getAccessKeys(w(function (_keys) {
                        if (!Array.isArray(_keys)) { return; }
                        accessKeys = _keys;

                        _keys.some(function (_k) {
                            if ((personalDrive && !_k.id) || Cryptpad.initialTeam === Number(_k.id)) {
                                myKeys = _k;
                                return true;
                            }
                        });
                    }));
                    Cryptpad.getFormKeys(w(function (keys) {
                        if (!keys.curvePublic && !keys.formSeed) {
                            // No drive mode
                            var answered = JSON.parse(localStorage.CP_formAnswered || "[]");
                            noDriveAnswered = answered.indexOf(data.channel) !== -1;
                        }
                        myFormKeys = keys;
                    }));
                    Cryptpad.makeNetwork(w(function (err, nw) {
                        network = nw;
                    }));
                    Cryptpad.getPadMetadata({channel: data.channel}, w(function (md) {
                        if (md && md.deleteLines) { deleteLines = true; }
                    }));
                }).nThen(function () {
                    if (!network) { return void cb({error: "E_CONNECT"}); }

                    if (myFormKeys.formSeed) {
                        myFormKeys = getAnonymousKeys(myFormKeys.formSeed, data.channel);
                    }

                    var keys = Utils.secret && Utils.secret.keys;

                    var curvePrivate = privateKey || data.privateKey;
                    if (!curvePrivate) { return void cb({error: 'EFORBIDDEN'}); }
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
                        metadata: {
                            deleteLines: true
                        }
                        //Cache: Utils.Cache // TODO enable cache for form responses when the cache stops evicting old answers
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
                            noDriveAnswered: noDriveAnswered,
                            myKey: myKey,
                            results: results
                        });
                        network.disconnect();
                    };
                    config.onMessage = function (msg, peer, vKey, isCp, hash, senderCurve, cfg) {
                        var parsed = Utils.Util.tryParse(msg);
                        if (!parsed) { return; }
                        var uid = parsed._uid || '000';

                        // If we have a "non-anonymous" answer, it may be the edition of a
                        // previous anonymous answer. Check if a previous anonymous answer exists
                        // with the same uid and delete it.
                        if (parsed._proof) {
                            var check = checkAnonProof(parsed._proof, data.channel, curvePrivate);
                            var theirAnonKey = parsed._proof.key;
                            if (check && results[theirAnonKey] && results[theirAnonKey][uid]) {
                                delete results[theirAnonKey][uid];
                            }
                        }

                        parsed._time = cfg && cfg.time;
                        if (deleteLines) { parsed._hash = hash; }

                        if (data.cantEdit && results[senderCurve]
                                          && results[senderCurve][uid]) { return; }
                        results[senderCurve] = results[senderCurve] || {};
                        results[senderCurve][uid] = {
                            msg: parsed,
                            hash: hash,
                            time: cfg && cfg.time
                        };
                    };
                    CPNetflux.start(config);
                });
            });
            sframeChan.on("Q_FETCH_MY_ANSWERS", function (data, cb) {
                var answers = [];
                var myKeys;
                nThen(function (w) {
                    Cryptpad.getFormKeys(w(function (keys) {
                        myKeys = keys;
                    }));
                    Cryptpad.getFormAnswer({channel: data.channel}, w(function (obj) {
                        if (!obj || obj.error) {
                            if (obj && obj.error === "ENODRIVE") {
                                var answered = JSON.parse(localStorage.CP_formAnswered || "[]");
                                if (answered.indexOf(data.channel) !== -1) {
                                    cb({error:'EANSWERED'});
                                } else {
                                    cb();
                                }
                                return void w.abort();
                            }
                            w.abort();
                            return void cb(obj);
                        }
                        // Get the latest edit per uid
                        var temp = {};
                        obj.forEach(function (ans) {
                            var uid = ans.uid || '000';
                            temp[uid] = ans;
                        });
                        answers = Object.values(temp);
                    }));
                    Cryptpad.getPadMetadata({channel: data.channel}, w(function (md) {
                        if (md && md.deleteLines) { deleteLines = true; }
                    }));
                }).nThen(function () {
                    var n = nThen;
                    var err;
                    var all = {};
                    answers.forEach(function (answer) {
                        n = n(function(waitFor) {
                            var finalKeys = myKeys;
                            if (answer.anonymous) {
                                if (!myKeys.formSeed) {
                                    err = 'ANONYMOUS_ERROR';
                                    console.error('ANONYMOUS_ERROR', answer);
                                    return;
                                }
                                finalKeys = getAnonymousKeys(myKeys.formSeed, data.channel);
                            }
                            Cryptpad.getHistoryRange({
                                channel: data.channel,
                                lastKnownHash: answer.hash,
                                toHash: answer.hash,
                            }, waitFor(function (obj) {
                                if (obj && obj.error) { err = obj.error; return; }
                                var messages = obj.messages;
                                if (!messages.length) {
                                    // TODO delete from drive.forms?
                                    return;
                                }
                                if (obj.lastKnownHash !== answer.hash) { return; }
                                try {
                                    var res = Utils.Crypto.Mailbox.openOwnSecretLetter(messages[0].msg, {
                                        validateKey: data.validateKey,
                                        ephemeral_private: Nacl.util.decodeBase64(answer.curvePrivate),
                                        my_private: Nacl.util.decodeBase64(finalKeys.curvePrivate),
                                        their_public: Nacl.util.decodeBase64(data.publicKey)
                                    });
                                    var parsed = JSON.parse(res.content);
                                    parsed._isAnon = answer.anonymous;
                                    parsed._time = messages[0].time;
                                    if (deleteLines) { parsed._hash = answer.hash; }
                                    var uid = parsed._uid || '000';
                                    if (all[uid] && !all[uid]._isAnon) { parsed._isAnon = false; }
                                    all[uid] = parsed;
                                } catch (e) {
                                    err = e;
                                }
                            }));
                        }).nThen;
                    });
                    n(function () {
                        if (err) { return void cb({error: err}); }
                        cb(all);
                    });
                });

            });
            var noDriveSeed = Utils.Hash.createChannelId();
            sframeChan.on("Q_FORM_SUBMIT", function (data, cb) {
                var box = data.mailbox;
                var myKeys;
                nThen(function (w) {
                    Cryptpad.getFormKeys(w(function (keys) {
                        // If formSeed doesn't exists, it means we're probably in noDrive mode.
                        // We can create a seed in localStorage.
                        if (!keys.formSeed) {
                            // No drive mode
                            keys = { formSeed: noDriveSeed };
                        }
                        myKeys = keys;
                    }));
                }).nThen(function () {
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
                    var uid = data.results._uid || Utils.Util.uid();
                    data.results._uid = uid;
                    var text = JSON.stringify(data.results);
                    var ciphertext = crypto.encrypt(text, box.publicKey);

                    var hash = ciphertext.slice(0,64);
                    Cryptpad.anonRpcMsg("WRITE_PRIVATE_MESSAGE", [
                        box.channel,
                        ciphertext
                    ], function (err, response) {
                        Cryptpad.storeFormAnswer({
                            uid: uid,
                            channel: box.channel,
                            hash: hash,
                            curvePrivate: ephemeral_private,
                            anonymous: Boolean(data.anonymous)
                        }, function () {
                            var res = data.results;
                            res._isAnon = data.anonymous;
                            res._time = +new Date();
                            if (deleteLines) { res._hash = hash; }
                            cb({
                                error: err,
                                response: response,
                                results: res
                            });
                        });
                    });
                });
            });
            sframeChan.on("Q_FORM_DELETE_ALL_ANSWERS", function (data, cb) {
                if (!data || !data.channel) { return void cb({error: 'EINVAL'}); }
                Cryptpad.clearOwnedChannel(data, cb);
            });
            sframeChan.on("Q_FORM_DELETE_ANSWER", function (data, cb) {
                if (!deleteLines) {
                    return void cb({error: 'EFORBIDDEN'});
                }
                Cryptpad.deleteFormAnswers(data, cb);
            });
            sframeChan.on("Q_FORM_MUTE", function (data, cb) {
                if (!Utils.secret) { return void cb({error: 'EINVAL'}); }
                Cryptpad.muteChannel(Utils.secret.channel, data.muted, cb);
            });
        };
        SFCommonO.start({
            addData: addData,
            addRpc: addRpc,
            //cache: true,
            noDrive: true,
            hash: hash,
            href: href,
            useCreationScreen: true,
            messaging: true,
            getPropChannels: getPropChannels
        });
    });
});
