// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([], function () {
    // Based on https://gist.github.com/bellbind/871b145110c458e83077a718aef9fa0e

    // base32 elements
    //RFC4648: why include 2? Z and 2 looks similar than 8 and O
    const b32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    console.assert(b32.length === 32, b32.length);
    const b32r = new Map(Array.from(b32, (ch, i) => [ch, i])).set("=", 0);
    //[constants derived from character table size]
    //cbit = 5 (as 32 == 2 ** 5), ubit = 8 (as byte)
    //ccount = 8 (= cbit / gcd(cbit, ubit)), ucount = 5 (= ubit / gcd(cbit, ubit))
    //cmask = 0x1f (= 2 ** cbit - 1), umask = 0xff (= 2 ** ubit - 1)
    //const b32pad = [0, 6, 4, 3, 1];
    const b32pad = Array.from(Array(5), (_, i) => (8 - i * 8 / 5 | 0) % 8);

    function b32e5(u1, u2 = 0, u3 = 0, u4 = 0, u5 = 0) {
        const u40 = u1 * 2 ** 32 + u2 * 2 ** 24 + u3 * 2 ** 16 + u4 * 2 ** 8 + u5;
        return [b32[u40 / 2 ** 35 & 0x1f], b32[u40 / 2 ** 30 & 0x1f],
                b32[u40 / 2 ** 25 & 0x1f], b32[u40 / 2 ** 20 & 0x1f],
                b32[u40 / 2 ** 15 & 0x1f], b32[u40 / 2 ** 10 & 0x1f],
                b32[u40 / 2 ** 5 & 0x1f], b32[u40 & 0x1f]];
    }
    function b32d8(b1, b2, b3, b4, b5, b6, b7, b8) {
        const u40 = b32r.get(b1) * 2 ** 35 + b32r.get(b2) * 2 ** 30 +
              b32r.get(b3) * 2 ** 25 + b32r.get(b4) * 2 ** 20 +
              b32r.get(b5) * 2 ** 15 + b32r.get(b6) * 2 ** 10 +
              b32r.get(b7) * 2 ** 5 + b32r.get(b8);
        return [u40 / 2 ** 32 & 0xff, u40 / 2 ** 24 & 0xff, u40 / 2 ** 16 & 0xff,
                u40 / 2 ** 8 & 0xff, u40 & 0xff];
    }

    // base32 encode/decode: Uint8Array <=> string
    function b32e(u8a) {
        console.assert(u8a instanceof Uint8Array, u8a.constructor);
        const len = u8a.length, rem = len % 5;
        const u5s = Array.from(Array((len - rem) / 5),
                               (_, i) => u8a.subarray(i * 5, i * 5 + 5));
        const pad = b32pad[rem];
        const br = rem === 0 ? [] : b32e5(...u8a.subarray(-rem)).slice(0, 8 - pad);
        return [].concat(...u5s.map(u5 => b32e5(...u5)),
                         br, ["=".repeat(pad)]).join("");
    }
    function b32d(bs) {
        const len = bs.length;
        if (len === 0) { return new Uint8Array([]); }
        //console.assert(len % 8 === 0, len);
        const pad = len - bs.indexOf("="), rem = b32pad.indexOf(pad);
        //console.assert(rem >= 0, pad);
        console.assert(/^[A-Z2-7+\/]*$/.test(bs.slice(0, len - pad)), bs);
        const u8s = [].concat(...bs.match(/.{8}/g).map(b8 => b32d8(...b8)));
        return new Uint8Array(rem > 0 ? u8s.slice(0, rem - 5) : u8s);
    }

    return {
        encode: b32e,
        decode: b32d,
        characters: b32,
    };
});
