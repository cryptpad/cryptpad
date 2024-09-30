// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/common/common-util.js',
    '/file/file-crypto.js',
    '/common/outer/cache-store.js',
    '/components/x2js/x2js.js',
], function (
    Util,
    FileCrypto,
    Cache,
    X2JS,
) {
    const Nacl = window.nacl;
    const x2js = new X2JS();

    const parseCryptPadUrl = function(href) {
        const url = new URL(href);
        const protocol = url.searchParams.get('protocol');
        const key = url.hash.substring(1);  // remove leading '#'
        const type = url.searchParams.get('type');
        url.search = '';
        url.hash = '';
        return { src: url.href.replace(/cryptpad?:\/\//, `${protocol}//`), key, type };
    };

    const getCryptPadUrl = function(src, key, type) {
        const url = new URL(src);
        const params = new URLSearchParams();
        params.set('type', type);
        params.set('protocol', url.protocol);
        url.search = params.toString();
        url.hash = key;
        return url.href.replace(/https?:\/\//, 'cryptpad://');
    };

    const setBlobType = (blob, mimeType) => {
        const fixedBlob = new Blob([blob], {type: mimeType});
        return fixedBlob;
    };

    const jsonContentAsXML = (content) => {

        // Sometimes `content` has additional fiels, that break the XML output. Only grab mxfile here.
        const cleaned = { mxfile: content.mxfile };

        return x2js.js2xml(cleaned);
    };

    return {
        parseCryptPadUrl,
        getCryptPadUrl,
        jsonContentAsXML,

        loadImage: function(href) {
            return new Promise((resolve, reject) => {
                const { src, key, type } = parseCryptPadUrl(href);
                Util.fetch(src, function (err, u8) {
                    if (err) {
                        console.error(err);
                        return void reject(err);
                    }
                    try {
                        FileCrypto.decrypt(u8, Nacl.util.decodeBase64(key), (err, res) => {
                            if (err || !res.content) {
                                console.error("Decrypting failed");
                                return void reject(err);
                            }

                            resolve(setBlobType(res.content, type));
                        });
                    } catch (e) {
                        console.error(e);
                        reject(err);
                    }
                }, void 0, Cache);
            });
        }
    };
});
