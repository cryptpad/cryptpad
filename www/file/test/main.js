define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/common/toolbar.js',
    '/common/cryptpad-common.js',
    '/common/visible.js',
    '/common/notify.js',
    '/file/file-crypto.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
    '/bower_components/file-saver/FileSaver.min.js',
], function ($, Crypto, realtimeInput, Toolbar, Cryptpad, Visible, Notify, FileCrypto) {
    var Nacl = window.nacl;

    $(function () {

    var filesAreSame = function (a, b) {
        var l = a.length;
        if (l !== b.length) { return false; }

        var i = 0;
        for (; i < l; i++) { if (a[i] !== b[i]) { return false; } }
        return true;
    };

    var metadataIsSame = function (A, B) {
        return !Object.keys(A).some(function (k) {
            return A[k] !== B[k];
        });
    };

    var upload = function (blob, metadata) {
        var u8 = new Uint8Array(blob);

        var key = Nacl.randomBytes(32);
        var next = FileCrypto.encrypt(u8, metadata, key);

        var chunks = [];
        var sendChunk = function (box, cb) {
            chunks.push(box);
            cb();
        };

        var again = function (state, box) {
            switch (state) {
                case 0:
                    sendChunk(box, function (e) {
                        if (e) { return console.error(e); }
                        next(again);
                    });
                    break;
                case 1:
                    sendChunk(box, function (e) {
                        if (e) { return console.error(e); }
                        next(again);
                    });
                    break;
                case 2:
                    sendChunk(box, function (e) {
                        if (e) { return console.error(e); }

                        // check if the uploaded file can be decrypted
                        var newU8 = FileCrypto.joinChunks(chunks);
                        FileCrypto.decrypt(newU8, key, function (e, res) {
                            if (e) { return Cryptpad.alert(e); }

                            if (filesAreSame(blob, res.content) &&
                                metadataIsSame(res.metadata, metadata)) {
                                Cryptpad.alert("successfully uploaded");
                            } else {
                                Cryptpad.alert('encryption failure!');
                            }
                        });
                    });
                    break;
                default:
                    throw new Error("E_INVAL_STATE");
            }
        };
        next(again);
    };

    var andThen = function () {
        var src = '/customize/cryptofist_mini.png';
        Cryptpad.fetch(src, function (e, file) {
            console.log(file);
            upload(file, {
                pew: 'pew',
                bang: 'bang',
            });
        });
    };

    andThen();

    });
});
