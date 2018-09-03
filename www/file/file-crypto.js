define([
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function () {
    var Nacl = window.nacl;
    //var PARANOIA = true;

    var plainChunkLength = 128 * 1024;
    var cypherChunkLength = 131088;

    var computeEncryptedSize = function (bytes, meta) {
        var metasize = Nacl.util.decodeUTF8(JSON.stringify(meta)).length;
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

    var increment = function (N) {
        var l = N.length;
        while (l-- > 1) {
        /*  our linter suspects this is unsafe because we lack types
            but as long as this is only used on nonces, it should be safe  */
            if (N[l] !== 255) { return void N[l]++; } // jshint ignore:line
            if (l === 0) { throw new Error('E_NONCE_TOO_LARGE'); }
            N[l] = 0;
        }
    };

    var joinChunks = function (chunks) {
        return new Blob(chunks);
    };

    var concatBuffer = function (a, b) { // TODO make this not so ugly
        return new Uint8Array(slice(a).concat(slice(b)));
    };

    var fetchMetadata = function (src, cb) {
        var done = false;
        var CB = function (err, res) {
            if (done) { return; }
            done = true;
            cb(err, res);
        };

        var xhr = new XMLHttpRequest();
        xhr.open("GET", src, true);
        xhr.setRequestHeader('Range', 'bytes=0-1');
        xhr.responseType = 'arraybuffer';

        xhr.onerror= function () { return CB('XHR_ERROR'); };
        xhr.onload = function () {
            if (/^4/.test('' + this.status)) { return CB('XHR_ERROR'); }
            var res = new Uint8Array(xhr.response);
            var size = decodePrefix(res);
            var xhr2 = new XMLHttpRequest();

            xhr2.open("GET", src, true);
            xhr2.setRequestHeader('Range', 'bytes=2-' + (size + 2));
            xhr2.responseType = 'arraybuffer';
            xhr2.onload = function () {
                if (/^4/.test('' + this.status)) { return CB('XHR_ERROR'); }
                var res2 = new Uint8Array(xhr2.response);
                var all = concatBuffer(res, res2);
                CB(void 0, all);
            };
            xhr2.send(null);
        };
        xhr.send(null);
    };

    var decryptMetadata = function (u8, key) {
        var prefix = u8.subarray(0, 2);
        var metadataLength = decodePrefix(prefix);

        var metaBox = new Uint8Array(u8.subarray(2, 2 + metadataLength));
        var metaChunk = Nacl.secretbox.open(metaBox, createNonce(), key);

        try {
            return JSON.parse(Nacl.util.encodeUTF8(metaChunk));
        }
        catch (e) { return null; }
    };

    var fetchDecryptedMetadata = function (src, key, cb) {
        if (typeof(src) !== 'string') {
            return window.setTimeout(function () {
                cb('NO_SOURCE');
            });
        }
        fetchMetadata(src, function (e, buffer) {
            if (e) { return cb(e); }
            cb(void 0, decryptMetadata(buffer, key));
        });
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

        var metaBox = new Uint8Array(u8.subarray(2, 2 + metadataLength));

        var metaChunk = Nacl.secretbox.open(metaBox, nonce, key);
        increment(nonce);

        try {
            res.metadata = JSON.parse(Nacl.util.encodeUTF8(metaChunk));
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
    };

    // metadata
    /* { filename: 'raccoon.jpg', type: 'image/jpeg' } */
    var encrypt = function (u8, metadata, key) {
        var nonce = createNonce();

        // encode metadata
        var plaintext = Nacl.util.decodeUTF8(JSON.stringify(metadata));

        // if metadata is too large, drop the thumbnail.
        if (plaintext.length > 65535) {
            var temp = JSON.parse(JSON.stringify(metadata));
            delete metadata.thumbnail;
            plaintext = Nacl.util.decodeUTF8(JSON.stringify(temp));
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
        decryptMetadata: decryptMetadata,
        fetchMetadata: fetchMetadata,
        fetchDecryptedMetadata: fetchDecryptedMetadata,
    };
});
