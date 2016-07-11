define(function () {
    var Email = {};
    var patt = /./g;
    var each = function (d) {
        d = d || 1;
        return function (c, i) {
            return String.fromCharCode((c.charCodeAt(0) + d));
        };
    };

    Email.makeScrambler = function (n) {
        return {
            encrypt: function (S) {
                return S.replace(patt, each(n));
            },
            decrypt: function (S) {
                return S.replace(patt, each(-n));
            }
        };
    };

    return Email;
});
