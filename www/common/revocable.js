(function (window) {
var factory = function (Nacl) {
    var Revocable = window.CryptPad_Revocable = {};

    // Authentication

    var addSlashes = function (str) {
        return str.replace(/\-/g, '/');
    };
    var u8_concat = function (A) {
        // expect a list of uint8Arrays
        var length = 0;
        A.forEach(function (a) { length += a.length; });
        var total = new Uint8Array(length);

        var offset = 0;
        A.forEach(function (a) {
            total.set(a, offset);
            offset += a.length;
        });
        return total;
    };


    Revocable.creatorAuth = function (channel, userId, edPrivate) { // XXX DEPRECATED
        var msg = channel + userId;

        // Get encrypted content
        var msgBytes = Nacl.util.decodeUTF8(msg);
        var myKey = Nacl.util.decodeBase64(edPrivate);

        var cipher = Nacl.box(msgBytes, nonce, theirKey, myKey);

        // Bundle with nonce
        var bundle = u8_concat([nonce, cipher]);

        // Return results as base64
        return Nacl.util.encodeBase64(bundle);
    };
    Revocable.creatorCheck = function (channel, userId, bundle, myPrivate, theirPublic) { // XXX DEPRECATED
        var expected = channel + userId;

        // Get encrypted content
        var bundleBytes = Nacl.util.decodeBase64(bundle);
        var nonce = bundleBytes.subarray(0, 24);
        var cipher = bundleBytes.subarray(24, bundle.length);
        var myKey = myPrivate;
        var theirKey = Nacl.util.decodeBase64(addSlashes(theirPublic)); // theirPublic = chanId
        var content = Nacl.box.open(cipher, nonce, theirKey, myKey);

        // Compare with expected result
        console.error(channel, Nacl.util.encodeUTF8(content) === expected);
        return Nacl.util.encodeUTF8(content) === expected;
    };

    // Log

    Revocable.firstLog = function (modEd) {
        return ['ADD', modEd];
    };
    Revocable.addLog = function (modEd, prevHash) {
        return ['ADD', modEd, prevHash];
    };
    Revocable.rotateLog = function (keyHash, validateKey, prevHash) {
        return ['ROTATE', keyHash, validateKey, prevHash];
    };
    Revocable.signLog = function (msg, edPrivate) {
        try {
            var msgBytes = Nacl.util.decodeUTF8(JSON.stringify(msg));
            var key = Nacl.util.decodeBase64(edPrivate);
            var sig = Nacl.sign.detached(msgBytes, key);
            console.error(sig);
            console.error(msg, msgBytes);
            return Nacl.util.encodeBase64(Nacl.sign.detached(msgBytes, key));
        } catch(e) {
            console.error(e);
            return;
        }
    };
    Revocable.checkLog = function (msg, edPublic, signature) {
        try {
            var sig = Nacl.util.decodeBase64(signature);
            console.error(sig);
            var msgBytes = Nacl.util.decodeUTF8(JSON.stringify(msg));
            console.error(msg, msgBytes);
            var key = Nacl.util.decodeBase64(addSlashes(edPublic));
            return Nacl.sign.detached.verify(msgBytes, sig, key);
        } catch (e) {
            console.error(e);
            return;
        }
    };

    // Util

    Revocable.hashBytes = function (bytes) {
        try {
            var hash = Nacl.hash(bytes);
            return Nacl.util.encodeBase64(hash);
        } catch (e) {
            return;
        }
    };
    Revocable.hashMsg = function (msg) {
        try {
            return Revocable.hashBytes(Nacl.util.decodeUTF8(JSON.stringify(msg)));
        } catch (e) {
            return;
        }
    };


    return Revocable;
};

    if (typeof(module) !== 'undefined' && module.exports) {
        module.exports = factory(
            require("tweetnacl/nacl-fast")
        );
    } else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
        define([
            '/bower_components/tweetnacl/nacl-fast.min.js'
        ], function () {
            return factory(window.nacl);
        });
    } else {
        // unsupported initialization
    }
}(typeof(window) !== 'undefined'? window : {}));
