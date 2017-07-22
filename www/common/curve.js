define([
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function () {
    var Nacl = window.nacl;
    var Curve = {};

    var concatenateUint8s = function (A) {
        var len = 0;
        var offset = 0;
        A.forEach(function (uints) {
            len += uints.length || 0;
        });
        var c = new Uint8Array(len);
        A.forEach(function (x) {
            c.set(x, offset);
            offset += x.length;
        });
        return c;
    };

    var encodeBase64 = Nacl.util.encodeBase64;
    var decodeBase64 = Nacl.util.decodeBase64;
    var decodeUTF8 = Nacl.util.decodeUTF8;
    var encodeUTF8 = Nacl.util.encodeUTF8;

    Curve.encrypt = function (message, secret) {
        var buffer = decodeUTF8(message);
        var nonce = Nacl.randomBytes(24);
        var box = Nacl.box.after(buffer, nonce, secret);
        return encodeBase64(nonce) + '|' + encodeBase64(box);
    };

    Curve.decrypt = function (packed, secret) {
        var unpacked = packed.split('|');
        var nonce = decodeBase64(unpacked[0]);
        var box = decodeBase64(unpacked[1]);
        var message = Nacl.box.open.after(box, nonce, secret);
        return encodeUTF8(message);
    };

    Curve.signAndEncrypt = function (msg, cryptKey, signKey) {
        var packed = Curve.encrypt(msg, cryptKey);
        return encodeBase64(Nacl.sign(decodeUTF8(packed), signKey));
    };

    Curve.openSigned = function (msg, cryptKey /*, validateKey STUBBED*/) {
        var content = decodeBase64(msg).subarray(64);
        return Curve.decrypt(encodeUTF8(content), cryptKey);
    };

    Curve.deriveKeys = function (theirs, mine) {
        var pub = decodeBase64(theirs);
        var secret = decodeBase64(mine);

        var sharedSecret = Nacl.box.before(pub, secret);
        var salt = decodeUTF8('CryptPad.signingKeyGenerationSalt');

        // 64 uint8s
        var hash = Nacl.hash(concatenateUint8s([salt, sharedSecret]));
        var signKp = Nacl.sign.keyPair.fromSeed(hash.subarray(0, 32));
        var cryptKey = hash.subarray(32, 64);

        return {
            cryptKey: encodeBase64(cryptKey),
            signKey: encodeBase64(signKp.secretKey),
            validateKey: encodeBase64(signKp.publicKey)
        };
    };

    Curve.createEncryptor = function (keys) {
        var cryptKey = decodeBase64(keys.cryptKey);
        var signKey = decodeBase64(keys.signKey);
        var validateKey = decodeBase64(keys.validateKey);

        return {
            encrypt: function (msg) {
                return Curve.signAndEncrypt(msg, cryptKey, signKey);
            },
            decrypt: function (packed) {
                return Curve.openSigned(packed, cryptKey, validateKey);
            }
        };
    };

    return Curve;
});
