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

    var isBencoded = function (msg) {
        return /^\d+:/;
    };

    // this is crap because of bencoding messages... it should go away....
    var splitMessage = function (msg, sending) {
        var idx = 0;
        var nl;
        for (var i = ((sending) ? 0 : 1); i < 3; i++) {
            nl = msg.indexOf(':',idx);
            idx = nl + Number(msg.substring(idx,nl)) + 1;
        }
        return [ msg.substring(0,idx), msg.substring(msg.indexOf(':',idx) + 1) ];
    };

    var encrypt = module.exports.encrypt = function (msg, key) {
        if (!isBencoded(msg)) {
            return encryptStr(msg, key);
        }

        /*  Currently this fails because messages have already been tampered
            with before they get here.  */

        var spl = splitMessage(msg, true);
        var json = JSON.parse(spl[1]);
        // non-patches are not encrypted.
        if (json[0] !== 2) { return msg; }
        json[1] = encryptStr(JSON.stringify(json[1]), key);
        var res = JSON.stringify(json);
        return spl[0] + res.length + ':' + res;
    };

    var decrypt = module.exports.decrypt = function (msg, key) {
        if (!isBencoded(msg)) {
            return decryptStr(msg, key);
        }
        var spl = splitMessage(msg, false);
        var json = JSON.parse(spl[1]);
        // non-patches are not encrypted.
        if (json[0] !== 2) { return msg; }
        if (typeof(json[1]) !== 'string') { throw new Error(); }
        json[1] = JSON.parse(decryptStr(json[1], key));
        var res = JSON.stringify(json);
        return spl[0] + res.length + ':' + res;
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
