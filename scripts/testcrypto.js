// SPDX-FileCopyrightText: 2024 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

let SodiumNative = require('sodium-native');
let Nacl = require('tweetnacl/nacl-fast');
let LibSodium = require('libsodium-wrappers');


let msgStr = "This is a test";
let keys = Nacl.sign.keyPair();
let pub = keys.publicKey;

let msg = Nacl.util.decodeUTF8(msgStr);
let signedMsg = Nacl.sign(msg, keys.secretKey);
let sig = signedMsg.subarray(0, 64);

LibSodium.ready.then(() => {

/*
console.log('tweetnacl open');
console.log(!!Nacl.sign.open(signedMsg, pub));
console.log('tweetnacl detached');
console.log(Nacl.sign.detached.verify(msg, sig, pub));
console.log('sodium-native open');
console.log(SodiumNative.crypto_sign_open(msg, signedMsg, pub));
console.log('sodium-native detached');
console.log(SodiumNative.crypto_sign_verify_detached(sig, msg, pub));
LibSodium.ready.then(() => {
console.log('libsodium open');
console.log(!!LibSodium.crypto_sign_open(signedMsg, pub));
console.log('libsodium detached');
console.log(LibSodium.crypto_sign_verify_detached(sig, msg, pub));
});
*/

    const n = 10000;
    let a;

    console.log('start sodium-native');
    a = +new Date();
    for (let i = 0; i < n; i++) {
        SodiumNative.crypto_sign_open(msg, signedMsg, pub);
        SodiumNative.crypto_sign_verify_detached(sig, msg, pub);
    }
    console.log('end sodium-native ', (+new Date() - a), ' ms');

    console.log('start libsodium');
    a = +new Date();
    for (let i = 0; i < n; i++) {
        LibSodium.crypto_sign_open(signedMsg, pub);
        LibSodium.crypto_sign_verify_detached(sig, msg, pub);
    }
    console.log('end libsodium ', (+new Date() - a), ' ms');

    console.log('start tweetnacl');
    a = +new Date();
    for (let i = 0; i < n; i++) {
        Nacl.sign.open(signedMsg, pub);
        Nacl.sign.detached.verify(msg, sig, pub);
    }

    console.log('end tweetnacl ', (+new Date() - a), ' ms');
});

