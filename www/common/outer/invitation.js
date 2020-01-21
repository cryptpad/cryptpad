(function () {
var factory = function (Util, Cred, Nacl) {
    var Invite = {};

    var encode64 = Nacl.util.encodeBase64;
    var decode64 = Nacl.util.decodeBase64;

    // ed and curve keys can be random...
    Invite.generateKeys = function () {
        var ed = Nacl.sign.keyPair();
        var curve = Nacl.box.keyPair();
        return {
            edPublic: encode64(ed.publicKey),
            edPrivate: encode64(ed.secretKey),
            curvePublic: encode64(curve.publicKey),
            curvePrivate: encode64(curve.secretKey),
        };
    };

    Invite.generateSignPair = function () {
        var ed = Nacl.sign.keyPair();
        return {
            validateKey: encode64(ed.publicKey),
            signKey: encode64(ed.secretKey),
        };
    };

    var b64ToChannelKeys = function (b64) {
        var dispense = Cred.dispenser(decode64(b64));
        return {
            channel: Util.uint8ArrayToHex(dispense(16)),
            cryptKey: dispense(Nacl.secretbox.keyLength),
        };
    };

    // the secret invite values (cryptkey and channel) can be derived
    // from the link seed and (optional) password
    Invite.deriveInviteKeys = b64ToChannelKeys;

    // the preview values (cryptkey and channel) are less sensitive than the invite values
    // as they cannot be leveraged to access any further content on their own
    // unless the message contains secrets.
    // derived from the link seed alone.
    Invite.derivePreviewKeys = b64ToChannelKeys;

    Invite.createRosterEntry = function (roster, data, cb) {
        var toInvite = {};
        toInvite[data.curvePublic] = data.content;
        roster.invite(toInvite, cb);
    };

/*  INPUTS

    * password (for scrypt)
    * message (personal note)
    * link hash
    * bytes64 (scrypt output)
    * preview_hash

*/

/*  IO / FUNCTIONALITY

    * creator
      * generate a random signKey (prevent writes to preview channel)
      * encrypt and upload the preview content
        * via CryptGet
        * owned by:
          * the ephemeral edPublic
          * the invite creator
      * create a roster entry for the invitation
        * with encrypted notes for the creator
    * redeemer
      * get the preview content
      * redeem the invite
        * add yourself to the roster
        * add the team to your proxy-manager

*/

    return Invite;
};
    if (typeof(module) !== 'undefined' && module.exports) {
        module.exports = factory(
            require("../common-util"),
            require("../common-credential.js"),
            require("nthen"),
            require("tweetnacl/nacl-fast")
        );
    } else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
        define([
            '/common/common-util.js',
            '/common/common-credential.js',
            '/bower_components/tweetnacl/nacl-fast.min.js',
        ], function (Util, Cred) {
            return factory(Util, Cred, window.nacl);
        });
    }
}());
