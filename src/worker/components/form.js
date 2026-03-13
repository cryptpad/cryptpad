// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const factory = (Util, Nacl, CPNetflux, Crypto) => {
    const Form = {};

    const u8_slice = (A, start, end) => {
        return new Uint8Array(Array.prototype.slice.call(A, start, end));
    };
    const checkAnonProof = (proofObj, channel, curvePrivate) => {
        const pub = proofObj.key;
        const proofTxt = proofObj.proof;
        try {
            let u8_bundle = Util.decodeBase64(proofTxt);
            let u8_nonce = u8_slice(u8_bundle, 0, Nacl.box.nonceLength);
            let u8_cipher = u8_slice(u8_bundle, Nacl.box.nonceLength);
            let u8_plain = Nacl.box.open(
                u8_cipher,
                u8_nonce,
                Util.decodeBase64(pub),
                Util.decodeBase64(curvePrivate)
            );
            return channel === Util.encodeUTF8(u8_plain);
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const getResponses = (ctx, data, cb) => {
        const { store, Store } = ctx;
        const {
            cryptoKeys, // encryptor keys
            channel, // form responses channel id
            edPublic, // my edPublic
            validateKey, // form responses secondaryValidateKey
            deleteLines,
            cantEdit
        } = data;

        const curvePrivate = cryptoKeys.curvePrivate;
        const crypto = Crypto.Mailbox.createEncryptor(cryptoKeys);

        let config = {
            network: store.network,
            channel,
            noChainPad: true,
            validateKey,
            owners: [edPublic],
            crypto: crypto,
            metadata: {
                deleteLines: true
            }
        };

        let cpNf;
        let results = {};

        config.onError = (info) => {
            cb({ error: info.type });
            cpNf?.stop();
        };
        config.onRejected = Store.onRejected;

        config.onReady = function () {
            cb({ results });
            cpNf?.stop();
        };

        config.onMessage = (msg, peer, vKey, isCp, hash, senderCurve, cfg) => {
            let parsed = Util.tryParse(msg);
            if (!parsed) { return; }
            let uid = parsed._uid || '000';

            // If we have a "non-anonymous" answer, it may be the edition of a
            // previous anonymous answer. Check if a previous anonymous answer exists
            // with the same uid and delete it.
            if (parsed._proof) {
                const check = checkAnonProof(parsed._proof, channel, curvePrivate);
                const theirAnonKey = parsed._proof.key;
                if (check && results[theirAnonKey] && results[theirAnonKey][uid]) {
                    delete results[theirAnonKey][uid];
                }
            }

            parsed._time = cfg && cfg.time;
            if (deleteLines) { parsed._hash = hash; }

            if (cantEdit && results[senderCurve]
                         && results[senderCurve][uid]) { return; }
            results[senderCurve] = results[senderCurve] || {};
            results[senderCurve][uid] = {
                msg: parsed,
                hash: hash,
                time: cfg && cfg.time
            };
        };
        cpNf = CPNetflux.start(config);
    };

    Form.init = (config) => {
        const { store, Store } = config;

        const ctx = { store, Store };
        const form = {};

        form.getResponses = (cId, data, cb) => {
            return getResponses(ctx, data, cb);
        };

        return form;
    };

    return Form;
};
module.exports = factory(
    require("../../common/common-util"),
    require('tweetnacl/nacl-fast'),
    require("chainpad-netflux"),
    require("chainpad-crypto")
);
