define([
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function () {
    var Nacl = window.nacl;

    var chunkLength = 131088;

    var slice = function (A) {
        return Array.prototype.slice.call(A);
    };

    var increment = function (N) {
        var l = N.length;
        while (l-- > 1) {
            if (N[l] !== 255) { return void N[l]++; }
            N[l] = 0;
            if (l === 0) { return true; }
        }
    };

    var joinChunks = function (B) {
        return new Uint8Array(chunks.reduce(function (A, B) {
            return slice(A).concat(slice(B));
        }, []));
    };

    var decrypt = function (u8, key, cb) {
        var nonce = new Uint8Array(new Array(24).fill(0));
        var i = 0;
        var takeChunk = function () {
            let start = i * chunkLength;
            let end = start + chunkLength;
            i++;
            let box = new Uint8Array(u8.subarray(start, end));

            // decrypt the chunk
            let plaintext = Nacl.secretbox.open(box, nonce, key);
            increment(nonce);
            return plaintext;
        };

        var buffer = '';

        var res = {
            metadata: undefined,
        };

        // decrypt metadata
        for (; !res.metadata && i * chunkLength < u8.length;) {
            var chunk = takeChunk();
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

        var chunks = [];
        // decrypt file contents
        for (;i * chunkLength < u8.length;) {
            let chunk = takeChunk();
            if (!chunk) {
                return void window.setTimeout(function () {
                    cb('DECRYPTION_ERROR');
                });
                //throw new Error('failed to parse');
            }
            chunks.push(chunk);
        }

        // send chunks
        res.content = joinChunks(chunks);

        cb(void 0, res);
    };

    return {
        decrypt: decrypt,
    };
});
