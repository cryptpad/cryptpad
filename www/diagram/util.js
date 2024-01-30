// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/common/common-util.js',
    '/file/file-crypto.js',
    '/common/outer/cache-store.js',
], function (
    Util,
    FileCrypto,
    Cache
) {
    const Nacl = window.nacl;

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

    return {
        parseCryptPadUrl,
        getCryptPadUrl,

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
