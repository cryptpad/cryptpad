define([
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function () {
    var Nacl = window.nacl;
    var module = { exports: {} };

    var encryptStr = function (str, key) {
        var array = Nacl.util.decodeUTF8(str);
        var nonce = Nacl.randomBytes(24);
        var packed = Nacl.secretbox(array, nonce, key);
        if (!packed) { throw new Error(); }
        return Nacl.util.encodeBase64(nonce) + "|" + Nacl.util.encodeBase64(packed);
    };

    var decryptStr = function (str, key) {
        var arr = str.split('|');
        if (arr.length !== 2) { throw new Error(); }
        var nonce = Nacl.util.decodeBase64(arr[0]);
        var packed = Nacl.util.decodeBase64(arr[1]);
        var unpacked = Nacl.secretbox.open(packed, nonce, key);
        if (!unpacked) { throw new Error(); }
        return Nacl.util.encodeUTF8(unpacked);
    };

    var encrypt = module.exports.encrypt = function (msg, key) {
        return encryptStr(msg, key);
    };

    var decrypt = module.exports.decrypt = function (msg, key) {
        return decryptStr(msg, key);
    };

    var parseKey = module.exports.parseKey = function (str) {
        var array = Nacl.util.decodeBase64(str);
        var hash = Nacl.hash(array);
        var lk = hash.subarray(32);
        return {
            lookupKey: lk,
            cryptKey: hash.subarray(0,32),
            channel: Nacl.util.encodeBase64(lk).substring(0,10)
        };
    };

    var rand64 = module.exports.rand64 = function (bytes) {
        return Nacl.util.encodeBase64(Nacl.randomBytes(bytes));
    };

    var genKey = module.exports.genKey = function () {
        return rand64(18);
    };

    return module.exports;
});
