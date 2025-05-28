// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/common/common-util.js',
    '/components/tweetnacl/nacl-fast.min.js',
], function (Util) {
    var Nacl = window.nacl;
    //var PARANOIA = true;

    var plainChunkLength = 128 * 1024;
    var cypherChunkLength = 131088;

    var computeEncryptedSize = function (bytes, meta) {
        var metasize = Util.decodeUTF8(JSON.stringify(meta)).length;
        var chunks = Math.ceil(bytes / plainChunkLength);
        return metasize + 18 + (chunks * 16) + bytes;
    };

    var encodePrefix = function (p) {
        return [
            65280, // 255 << 8
            255,
        ].map(function (n, i) {
            return (p & n) >> ((1 - i) * 8);
        });
    };
    var decodePrefix = function (A) {
        return (A[0] << 8) | A[1];
    };

    var slice = function (A) {
        return Array.prototype.slice.call(A);
    };

    var createNonce = function () {
        return new Uint8Array(new Array(24).fill(0));
    };

    // New version of "increment" from @ansuz
    const increment = N => {
        // start from the last element directly without relying on confusing post-decrement behaviour
        let l = N.length - 1;
        while (l >= 0) {
            // increment the least significant byte unless it's already at its maximum
            if (N[l] !== 255) {
                N[l] += 1;
                return;
            }
            // if the loop reaches the most significant byte and the above block fails to return
            // then the nonce's state-space has been exhausted
            if (l === 0) {
                throw new Error("E_NONCE_TOO_LARGE");
            }
            // otherwise reset the lesser bytes to zero
            N[l] = 0;
            // and proceed to the next more significant byte
            l -= 1;
        }
        // the loop body will never be executed if a zero-length nonce is supplied
        // this handles that case
        throw new Error("E_EMPTY_NONCE");
    };

    var joinChunks = function (chunks) {
        return new Blob(chunks);
    };

    var decrypt = function (u8, key, done, progress) {
        var MAX = u8.length;
        var _progress = function (offset) {
            if (typeof(progress) !== 'function') { return; }
            progress(Math.min(1, offset / MAX));
        };

        var nonce = createNonce();
        var i = 0;

        var prefix = u8.subarray(0, 2);
        var metadataLength = decodePrefix(prefix);

        var res = {
            metadata: undefined,
        };

        var cancelled = false;
        var cancel = function () {
            cancelled = true;
        };

        var metaBox = new Uint8Array(u8.subarray(2, 2 + metadataLength));

        var metaChunk = Nacl.secretbox.open(metaBox, nonce, key);
        increment(nonce);

        try {
            res.metadata = JSON.parse(Util.encodeUTF8(metaChunk));
        } catch (e) {
            return window.setTimeout(function () {
                done('E_METADATA_DECRYPTION');
            });
        }

        if (!res.metadata) {
            return void setTimeout(function () {
                done('NO_METADATA');
            });
        }

        var takeChunk = function (cb) {
            setTimeout(function () {
                var start = i * cypherChunkLength + 2 + metadataLength;
                var end = start + cypherChunkLength;
                i++;
                var box = new Uint8Array(u8.subarray(start, end));

                // decrypt the chunk
                var plaintext = Nacl.secretbox.open(box, nonce, key);
                increment(nonce);

                if (!plaintext) { return cb('DECRYPTION_ERROR'); }

                _progress(end);
                cb(void 0, plaintext);
            });
        };

        var chunks = [];

        var again = function () {
            if (cancelled) { return; }
            takeChunk(function (e, plaintext) {
                if (e) {
                    return setTimeout(function () {
                        done(e);
                    });
                }
                if (plaintext) {
                    if ((2 + metadataLength + i * cypherChunkLength) < u8.length) { // not done
                        chunks.push(plaintext);
                        return setTimeout(again);
                    }
                    chunks.push(plaintext);
                    res.content = joinChunks(chunks);
                    return done(void 0, res);
                }
                done('UNEXPECTED_ENDING');
            });
        };

        again();

        return {
            cancel: cancel
        };
    };

    // metadata
    /* { filename: 'raccoon.jpg', type: 'image/jpeg' } */
    var encrypt = function (u8, metadata, key) {
        var nonce = createNonce();

        // encode metadata
        var plaintext = Util.decodeUTF8(JSON.stringify(metadata));

        // if metadata is too large, drop the thumbnail.
        if (plaintext.length > 65535) {
            var temp = JSON.parse(JSON.stringify(metadata));
            delete temp.thumbnail;
            plaintext = Util.decodeUTF8(JSON.stringify(temp));
        }

        var i = 0;

        var state = 0;
        var next = function (cb) {
            if (state === 2) { return void setTimeout(cb); }

            var start;
            var end;
            var part;
            var box;

            if (state === 0) { // metadata...
                part = new Uint8Array(plaintext);
                box = Nacl.secretbox(part, nonce, key);
                increment(nonce);

                if (box.length > 65535) {
                    return void cb('METADATA_TOO_LARGE');
                }
                var prefixed = new Uint8Array(encodePrefix(box.length)
                    .concat(slice(box)));
                state++;

                return void setTimeout(function () {
                    cb(void 0, prefixed);
                });
            }

            // encrypt the rest of the file...
            start = i * plainChunkLength;
            end = start + plainChunkLength;

            part = u8.subarray(start, end);
            box = Nacl.secretbox(part, nonce, key);
            increment(nonce);
            i++;

            // regular data is done
            if (i * plainChunkLength >= u8.length) { state = 2; }

            setTimeout(function () {
                cb(void 0, box);
            });
        };

        return next;
    };

    return {
        decrypt: decrypt,
        encrypt: encrypt,
        joinChunks: joinChunks,
        computeEncryptedSize: computeEncryptedSize,
    };
});
