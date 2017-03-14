define([], function () {
    var exports = {};

    var hexToUint8Array = exports.hexToUint8Array = function (s) {
        // if not hex or odd number of characters
        if (!/[a-fA-F0-9]+/.test(s) || s.length % 2) { throw new Error("string is not hex"); }
        return s.split(/([0-9a-fA-F]{2})/)
            .filter(function (x) { return x; })
            .map(function (x) { return Number('0x' + x); });
    };

    var uint8ArrayToHex = exports.uint8ArrayToHex = function (a) {
        return a.reduce(function(memo, i) {
            return memo + ((i < 16) ? '0' : '') + i.toString(16);
        }, '');
    };

    return exports;
});
