(function () {
var factory = function (Util, Cred, nThen) {
    nThen = nThen; // XXX
    var Invite = {};

/* 
    TODO key derivation

    scrypt(seed, passwd) => {
        curve: {
            private,
            public,
        },
        ed: {
            private,
            public,
        }
        cryptKey,
        channel
    }
*/

    var BYTES_REQUIRED = 256;

    Invite.deriveKeys = function (seed, passwd, cb) {
        cb = cb; // XXX
        // TODO validate has cb
        // TODO onceAsync the cb
        // TODO cb with err if !(seed && passwd)

        Cred.deriveFromPassphrase(seed, passwd, BYTES_REQUIRED, function (bytes) {
            var dispense = Cred.dispenser(bytes);
            dispense = dispense; // XXX

            // edPriv => edPub
            // curvePriv => curvePub
            // channel
            // cryptKey
        });
    };

    Invite.createSeed = function () {
        // XXX
        // return a seed
    };

    Invite.create = function (cb) {
        cb = cb; // XXX
        // TODO validate has cb
        // TODO onceAsync the cb
        // TODO cb with err if !(seed && passwd)



        // required
            // password
            // validateKey
            // creatorEdPublic
                // for owner
        // ephemeral
            // signingKey
                // for owner to write invitation
        // derived
            // edPriv
                // edPublic
                    // for invitee ownership
            // curvePriv
                // curvePub
                    // for acceptance OR
                    // authenticated decline message via mailbox
            // channel
                // for owned deletion
                // for team pinning
            // cryptKey
                // for protecting channel content
    };

    return Invite;
};
    if (typeof(module) !== 'undefined' && module.exports) {
        module.exports = factory(
            require("../common-util"),
            require("../common-credential.js"),
            require("nthen")
        );
    } else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
        define([
            '/common/common-util.js',
            '/common/common-credential.js',
            '/bower_components/nthen/index.js',
        ], function (Util, Cred, nThen) {
            return factory(Util, nThen);
        });
    }
}());
