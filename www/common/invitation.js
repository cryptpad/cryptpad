(function () {
var factory = function (Hash, Nacl/*, Util, Cred, nThen */) {
    var Invite = {};

    /* XXX ansuz
        inner invitation components

        * create an invitation link
          * derive secrets from a v2 link and password
            * split hash into two preseeds
            * preseed1 => preview hash
            * scrypt(scrypt_seed) => b64_bytes
        * preview an invitation link
          * get preview hash from invitation link
        * decrypt an invitation link
          * (slowly) get b64_bytes from hash

    */

    Invite.deriveSeeds = function (key) {
        var seeds = {};

/*
        var preview_channel;
        var preview_cryptKey;
*/
        var preview_secrets;
        (function () {
            var b64_seed = key;
            if (typeof(b64_seed) !== 'string') {
                return console.error('invite seed is not a string');
            }

            var u8_seed = Nacl.util.decodeBase64(b64_seed);
            var step1 = Nacl.hash(u8_seed);
            seeds.scrypt = Nacl.util.encodeBase64(step1.subarray(0, 32));

            var preview_hash = '#/2/invite/view/' +
                Nacl.util.encodeBase64(step1.subarray(32, 50)).replace('/', '-')
                + '/';

            preview_secrets = Hash.getSecrets('pad', preview_hash);
        }());
        return seeds;
    };

    // seed => bytes64
    Invite.deriveBytes = function (scrypt_seed, cb) {
        // XXX do scrypt stuff...
        cb = cb;
    };

    Invite.derivePreviewHash = function (preview_seed) {
        preview_seed = preview_seed;
    };

    return Invite;
};
    if (typeof(module) !== 'undefined' && module.exports) {
        module.exports = factory(
            require("../common-hash"),
            require("tweetnacl/nacl-fast"),
            require("../common-util"),
            require("../common-credential.js"),
            require("nthen")
        );
    } else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
        define([
            '/common/common-hash.js',
            '/common/common-util.js',
            '/common/common-credential.js',
            '/bower_components/nthen/index.js',
            '/bower_components/tweetnacl/nacl-fast.min.js',
        ], function (Hash, Util, Cred, nThen) {
            return factory(Hash, window.nacl, Util, Cred, nThen);
        });
    }
}());
