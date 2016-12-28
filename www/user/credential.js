define([
    '/bower_components/scrypt-async/scrypt-async.min.js',
], function () {
    var Cred = {};
    var Scrypt = window.scrypt;

    var isString = Cred.isString = function (x) {
        return typeof(x) === 'string';
    };

    var isValidUsername = Cred.isValidUsername = function (name) {
        return !!(name && isString(name));
    };

    var isValidPassword = Cred.isValidPassword = function (passwd) {
        return !!(passwd && isString(passwd));
    };

    var passwordsMatch = Cred.passwordsMatch = function (a, b) {
        return isString(a) && isString(b) && a === b;
    };

    var deriveFromPassphrase = Cred.deriveFromPassphrase = function 
    (username, password, len, cb) {
        Scrypt(password,
            username,
            8, // memoryCost (n)
            1024, // block size parameter (r)
            len || 128, // dkLen
            200, // interruptStep
            cb,
            undefined); // format, could be 'base64'
    };

    var dispenser = Cred.dispenser = function (bytes) {
        var entropy = {
            used: 0,
        };

        // crypto hygeine
        var consume = function (n) {
            // explode if you run out of bytes
            if (entropy.used + n > bytes.length) {
                throw new Error('exceeded available entropy');
            }
            if (typeof(n) !== 'number') { throw new Error('expected a number'); }
            if (n <= 0) {
                throw new Error('expected to consume a positive number of bytes');
            }

            // grab an unused slice of the entropy
            var A = bytes.slice(entropy.used, entropy.used + n);

            // account for the bytes you used so you don't reuse bytes
            entropy.used += n;

            //console.info("%s bytes of entropy remaining", bytes.length - entropy.used);
            return A;
        };

        return consume;
    };

    return Cred;
});
