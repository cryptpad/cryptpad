(function () {
var factory = function () {
    var Keys = {};

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
            pubkey = k.replace(/-/g, '/');
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
            pubkey = k.replace(/-/g, '/');
            return '';
        });
        if (!domain) { throw new Error("Could not parse user id [" + user + "]"); }
        return {
            domain: domain,
            user: username,
            pubkey: pubkey
        };
    };

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

    return Keys;
};

    if (typeof(module) !== 'undefined' && module.exports) {
        module.exports = factory();
    } else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
        define([], factory);
    }
}());
