// SPDX-FileCopyrightText: 2024 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const Nacl = require('tweetnacl/nacl-fast');
const CPCrypto = module.exports;
const plugins = require('./plugin-manager');

CPCrypto.init = (cb) => {
    const crypto = {};
    crypto.open = (signedMsg, validateKey) => {
        return Nacl.sign.open(signedMsg, validateKey);
    };
    crypto.detachedVerify = (signedBuffer, signatureBuffer, validateKey) => {
        return Nacl.sign.detached.verify(signedBuffer, signatureBuffer, validateKey);
    };
    if (plugins.SODIUM && plugins.SODIUM.crypto) {
        let c = plugins.SODIUM.crypto;
        if (c.open) { crypto.open = c.open; }
        if (c.detachedVerify) { crypto.detachedVerify = c.detachedVerify; }
    }

    // Make async because we might need it later with libsodium's promise
    // libsodium.ready.then(() => {});
    setTimeout(() => {
        cb(void 0, crypto);
    });
};
