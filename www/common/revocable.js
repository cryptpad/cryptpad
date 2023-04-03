(function (window) {
var factory = function (Hash, Nacl) {
    var Revocable = window.CryptPad_Revocable = {};

    // Log

    Revocable.firstLog = function (modEdPublic) {
        return ['ADD', undefined, modEdPublic];
    };
    Revocable.addLog = function (modEdPublic, prevHash) {
        return ['ADD', prevHash, modEdPublic];
    };
    Revocable.rotateLog = function (keyHash, validateKey, uid, prevHash) {
        return ['ROTATE', prevHash, keyHash, validateKey, uid];
    };
    Revocable.signLog = function (msg, edPrivate) {
        try {
            var msgBytes = Nacl.util.decodeUTF8(JSON.stringify(msg));
            var key = Nacl.util.decodeBase64(edPrivate);
            var sig = Nacl.sign.detached(msgBytes, key);
            return Nacl.util.encodeBase64(Nacl.sign.detached(msgBytes, key));
        } catch(e) {
            console.error(e);
            return;
        }
    };
    Revocable.checkLog = function (msg, edPublic, signature) {
        try {
            var sig = Nacl.util.decodeBase64(signature);
            var msgBytes = Nacl.util.decodeUTF8(JSON.stringify(msg));
            var key = Nacl.util.decodeBase64(addSlashes(edPublic));
            var check = Nacl.sign.detached.verify(msgBytes, sig, key);
            if (!check) { return false; }
            var checked = msg.slice();
            checked.push(signature);
            checked.push(edPublic);
            return checked;
        } catch (e) {
            console.error(e);
            return;
        }
    };


    Revocable.getSanitizedLog = function (md) {
        var log = md.moderatorsLog;
        var result = [];
        if (!Array.isArray(log) || !log.length) { return result; }
        var prevHash;

        // Read the log and preserve all messages where the "prevHash"
        // value matches the hash of the previous valid message
        // Also reject messages coming from non-moderators
        var moderators = [];
        log.forEach(function (msg, i) {
            var hash = Revocable.hashMsg(msg);
            if (!i) {
                prevHash = hash;
                result.push(msg);
                if (msg[0] === 'ADD') { moderators.push(msg[2]); } // Add moderator key
                return;
            }
            if (msg[1] !== prevHash) { return; } // Invalid: ignore

            // Check moderator key and signature
            var _msg = msg.slice(0,-2);
            var edPublic = msg[msg.length-1];
            var signature = msg[msg.length-2];
            if (!moderators.includes(edPublic)) { return; }
            var check = Revocable.checkLog(_msg, edPublic, signature);
            if (!check) { return; }

            // Update moderators keys from "ADD" and "REMOVE" log
            if (msg[0] === 'ADD' && !moderators.includes(msg[2])) { moderators.push(msg[2]); }
            if (msg[0] === 'REMOVE' && moderators.includes(msg[2])) {
                moderators.splice(moderators.indexOf(msg[2]), 1);
            }

            prevHash = hash;
            result.push(msg);
        });

        return result;
    };


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

    var checkAccess = function (channel, userId, signature, md, type) {
        if (!md.access) { return true; }
        var edPublic = signature.key;
        var access = md.access[edPublic];
        // Reject if key is not allowed
        if (!access || !access.rights.includes(type)) {
            return false;
        }
        // If allowed, check signature
        return Revocable.checkLog([channel, userId], signature.key, signature.sig);
    };
    Revocable.checkRead = function (channel, userId, signature, md) {
        return checkAccess(channel, userId, signature, md, 'r');
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
            require("../../www/common/common-hash"),
            require("tweetnacl/nacl-fast")
        );
    } else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
        define([
            '/common/common-hash.js',
            '/bower_components/tweetnacl/nacl-fast.min.js'
        ], function (Hash) {
            return factory(Hash, window.nacl);
        });
    } else {
        // unsupported initialization
    }
}(typeof(window) !== 'undefined'? window : {}));
