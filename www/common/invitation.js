(function () {
var factory = function (Hash, Nacl, Scrypt/*, Util, Cred, nThen */) {
    var Invite = {};

    Invite.deriveSeeds = function (seed) {
        // take the hash of the provided seed
        var u8_seed = Nacl.hash(Nacl.util.decodeBase64(seed));

        // hash the first half again for scrypt's input
        var subseed1 = Nacl.hash(u8_seed.subarray(0, 32));
        // hash the remainder for the invite content
        var subseed2 = Nacl.hash(u8_seed.subarray(32));

        return {
            scrypt: Nacl.util.encodeBase64(subseed1),
            preview: Nacl.util.encodeBase64(subseed2),
        };
    };

    Invite.derivePreviewHash = function (seeds) {
        return '#/2/invite/view/' +
            Nacl.util.encodeBase64(seeds.preview.slice(0, 18)).replace('/', '-')
            + '/';
    };

    Invite.derivePreviewSecrets = function (seeds) {
        return Hash.getSecrets('pad', Invite.derivePreviewHash(seeds));
    };

    Invite.deriveSalt = function (password, instance_salt) {
        return (password || '') + (instance_salt || '');
    };

    // seed => bytes64
    Invite.deriveBytes = function (scrypt_seed, salt, cb) {
        Scrypt(scrypt_seed,
            salt,
            8, // memoryCost (n)
            1024, // block size parameter (r)
            192, // dkLen
            200, // interruptStep
            cb,
            'base64'); // format, could be 'base64'
    };
    return Invite;
};
    if (typeof(module) !== 'undefined' && module.exports) {
        module.exports = factory(
            require("../common-hash"),
            require("tweetnacl/nacl-fast"),
            require("scrypt-async")
        );
    } else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
        define([
            '/common/common-hash.js',
            '/bower_components/tweetnacl/nacl-fast.min.js',
            '/bower_components/scrypt_async/scrypt-async.min.js',
        ], function (Hash /*, Nacl, Scrypt */) {
            return factory(Hash, window.nacl, window.Scrypt);
        });
    }
}());
