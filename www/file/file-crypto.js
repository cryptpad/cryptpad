define([
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function () {
    var Nacl = window.nacl;
    var PARANOIA = true;

    var plainChunkLength = 128 * 1024;
    var cypherChunkLength = 131088;

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
            if (l === 0) { return true; }
        }
    };

    var joinChunks = function (chunks) {
        return new Uint8Array(chunks.reduce(function (A, B) {
            return slice(A).concat(slice(B));
        }, []));
    };

    var padChunk = function (A) {
        var padding;
        if (A.length === plainChunkLength) { return A; }
        if (A.length < plainChunkLength) {
            padding = new Array(plainChunkLength - A.length).fill(32);
            return A.concat(padding);
        }
        if (A.length > plainChunkLength) {
            // how many times larger is it?
            var chunks = Math.ceil(A.length / plainChunkLength);
            padding = new Array((plainChunkLength * chunks) - A.length).fill(32);
            return A.concat(padding);
        }
    };

    var decrypt = function (u8, key, cb) {
        var nonce = createNonce();
        var i = 0;

        var takeChunk = function () {
            var start = i * cypherChunkLength;
            var end = start + cypherChunkLength;
            i++;
            var box = new Uint8Array(u8.subarray(start, end));

            // decrypt the chunk
            var plaintext = Nacl.secretbox.open(box, nonce, key);
            // TODO handle nonce-too-large-error
            increment(nonce);
            return plaintext;
        };

        var buffer = '';

        var res = {
            metadata: undefined,
        };

        // decrypt metadata
        var chunk;
        for (; !res.metadata && i * cypherChunkLength < u8.length;) {
            chunk = takeChunk();
            buffer += Nacl.util.encodeUTF8(chunk);
            try {
                res.metadata = JSON.parse(buffer);
                //console.log(res.metadata);
            } catch (e) {
                console.log('buffering another chunk for metadata');
            }
        }

        if (!res.metadata) {
            return void setTimeout(function () {
                cb('NO_METADATA');
            });
        }

        var fail = function () {
            cb("DECRYPTION_ERROR");
        };

        var chunks = [];
        // decrypt file contents
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


    /*  TODO
        in your callback, return an object which you can iterate...


    */

    var encrypt = function (u8, metadata, key, cb) {
        var nonce = createNonce();

        // encode metadata
        var metaBuffer = Array.prototype.slice
            .call(Nacl.util.decodeUTF8(JSON.stringify(metadata)));

        var plaintext = new Uint8Array(padChunk(metaBuffer));

        var chunks = [];
        var j = 0;

        var start;
        var end;

        var part;
        var box;

        // prepend some metadata
        for (;j * plainChunkLength < plaintext.length; j++) {
            start = j * plainChunkLength;
            end = start + plainChunkLength;

            part = plaintext.subarray(start, end);
            box = Nacl.secretbox(part, nonce, key);
            chunks.push(box);
            increment(nonce);
        }

        // append the encrypted file chunks
        var i = 0;
        for (;i * plainChunkLength < u8.length; i++) {
            start = i * plainChunkLength;
            end = start + plainChunkLength;

            part = new Uint8Array(u8.subarray(start, end));
            box = Nacl.secretbox(part, nonce, key);
            chunks.push(box);
            increment(nonce);
        }


        // TODO do something with the chunks...
    };

    return {
        decrypt: decrypt,
        encrypt: encrypt,
    };
});
