(function () {
var factory = function () {
    var Keys = {};

    var unescape = function (s) {
        return s.replace(/-/g, '/');
    };

/*  Parse the new format of "Signing Public Keys".
    If anything about the input is found to be invalid, return;
    this will fall back to the old parsing method


*/
    var parseNewUser = function (userString) {
        if (!/^\[.*?@.*\]$/.test(userString)) { return; }
        var temp = userString.slice(1, -1);
        var domain, username, pubkey;

        temp = temp
        .replace(/\/([a-zA-Z0-9+-]{43}=)$/, function (all, k) {
            pubkey = unescape(k);
            return '';
        });
        if (!pubkey) { return; }

        var index = temp.lastIndexOf('@');
        if (index < 1) { return; }

        domain = temp.slice(index + 1);
        username = temp.slice(0, index);

        return {
            domain: domain,
            user: username,
            pubkey: pubkey
        };
    };

    var isValidUser = function (parsed) {
        if (!parsed) { return; }
        if (!(parsed.domain && parsed.user && parsed.pubkey)) { return; }
        return true;
    };

    Keys.parseUser = function (user) {
        var parsed = parseNewUser(user);
        if (isValidUser(parsed)) { return parsed; }

        var domain, username, pubkey;
        user.replace(/^https*:\/\/([^\/]+)\/user\/#\/1\/([^\/]+)\/([a-zA-Z0-9+-]{43}=)$/,
                        function (a, d, u, k) {
            domain = d;
            username = u;
            pubkey = unescape(k);
            return '';
        });
        if (!domain) { throw new Error("Could not parse user id [" + user + "]"); }
        return {
            domain: domain,
            user: username,
            pubkey: pubkey
        };
    };

/*

0. usernames may contain spaces or many other wacky characters, so enclose the whole thing in square braces so we know its boundaries. If the formatted string does not include these we know it is either a _v1 public key string_ or _an incomplete string_. Start parsing by removing them.
1. public keys should have a fixed length, so slice them off of the end of the string.
2. domains cannot include `@`, so find the last occurence of it in the signing key and slice everything thereafter.
3. the username is everything before the `@`.

*/
    Keys.serialize = function (origin, username, pubkey) {
        return '[' +
            username +
            '@' +
            origin.replace(/https*:\/\//, '') +
            '/' +
            pubkey.replace(/\//g, '-') +
        ']';
        // return origin + '/user/#/1/' + username + '/' + pubkey.replace(/\//g, '-');
    };

    Keys.canonicalize = function (input) {
        if (typeof(input) !== 'string') { return; }
        // key is already in simple form. ensure that it is an 'unsafeKey'
        if (input.length === 44) {
            return unescape(input);
        }
        try {
            return Keys.parseUser(input).pubkey;
        } catch (err) {
            return;
        }
    };

    return Keys;
};

    if (typeof(module) !== 'undefined' && module.exports) {
        module.exports = factory();
    } else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
        define([], factory);
    }
}());
