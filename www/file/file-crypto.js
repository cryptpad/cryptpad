define([
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function () {
    var Nacl = window.nacl;
    var PARANOIA = true;

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
            if (PARANOIA) {
                if (typeof(N[l]) !== 'number') {
                    throw new Error('E_UNSAFE_TYPE');
                }
                if (N[l] > 255) {
                    throw new Error('E_OUT_OF_BOUNDS');
                }
            }
        /*  jshint probably suspects this is unsafe because we lack types
            but as long as this is only used on nonces, it should be safe  */
            if (N[l] !== 255) { return void N[l]++; } // jshint ignore:line
            N[l] = 0;

            // you don't need to worry about this running out.
            // you'd need a REAAAALLY big file
            if (l === 0) {
                throw new Error('E_NONCE_TOO_LARGE');
            }
        }
    };

    var joinChunks = function (chunks) {
        return new Uint8Array(chunks.reduce(function (A, B) {
            return slice(A).concat(slice(B));
        }, []));
    };

    var decrypt = function (u8, key, cb) {
        var fail = function (e) {
            cb(e || "DECRYPTION_ERROR");
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
            return fail('E_METADATA_DECRYPTION');
        }

        if (!res.metadata) {
            return void setTimeout(function () {
                cb('NO_METADATA');
            });
        }

        var takeChunk = function () {
            var start = i * cypherChunkLength + 2 + metadataLength;
            var end = start + cypherChunkLength;
            i++;
            var box = new Uint8Array(u8.subarray(start, end));

            // decrypt the chunk
            var plaintext = Nacl.secretbox.open(box, nonce, key);
            increment(nonce);
            return plaintext;
        };

        var chunks = [];
        // decrypt file contents
        var chunk;
        for (;i * cypherChunkLength < u8.length;) {
            chunk = takeChunk();
            if (!chunk) {
                return window.setTimeout(fail);
            }
            chunks.push(chunk);
        }

        // send chunks
        res.content = joinChunks(chunks);

        cb(void 0, res);
    };

    // metadata
    /* { filename: 'raccoon.jpg', type: 'image/jpeg' } */
    var encrypt = function (u8, metadata, key) {
        var nonce = createNonce();

        // encode metadata
        var metaBuffer = Array.prototype.slice
            .call(Nacl.util.decodeUTF8(JSON.stringify(metadata)));

        var plaintext = new Uint8Array(metaBuffer);

        var i = 0;

        var state = 0;
        var next = function (cb) {
            if (state === 2) { return void cb(); }

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

                return void cb(void 0, prefixed);
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

            return void cb(void 0, box);
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
