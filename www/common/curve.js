define([
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function () {
    var Nacl = window.nacl;

    var Curve = {};

    // nacl.box(message, nonce, theirPublicKey, mySecretKey)
    Curve.encrypt = function (message, theirPub, mySecret) {
        var buffer = Nacl.util.decodeUTF8(message);

        var nonce = Nacl.randomBytes(24);

        var box = Nacl.box(buffer, nonce, theirPub, mySecret);

        return [Nacl.util.encodeBase64(nonce), Nacl.util.encodeBase64(box)].join('|');
    };

    // nacl.box.open(box, nonce, theirPublicKey, mySecretKey)
    Curve.decrypt = function (packed, theirPub, mySecret) {
        var unpacked = packed.split('|');
        var nonce = Nacl.util.decodeBase64(unpacked[0]);

        var box = Nacl.util.decodeBase64(unpacked[1]);

        var message = Nacl.box.open(box, nonce, theirPub, mySecret);

        return Nacl.util.encodeUTF8(message);
    };

    Curve.createEncryptor = function () {
        console.log("PEWPEW");
        throw new Error("E_NOT_IMPL");
    };

    return Curve;
});
