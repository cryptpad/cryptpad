var Client = require("../../lib/client/");
var Mailbox = require("../../www/bower_components/chainpad-crypto").Mailbox;
var Nacl = require("tweetnacl");
var nThen = require("nthen");

var makeCurveKeys = function () {
    var pair = Nacl.box.keyPair();
    return {
        curvePrivate: Nacl.util.encodeBase64(pair.secretKey),
        curvePublic: Nacl.util.encodeBase64(pair.publicKey),
    };
};

Client.create(function (err, client) {
    if (err) { return void console.error(err); }

    nThen(function () { // BASIC KEY MANAGEMENT
        // generate keys with login
            // signing keys
            // curve keys
            // drive
    }).nThen(function () {
        // make a drive
            // pin it
    }).nThen(function () { // MAILBOXES
        // write to your mailbox
            // pin your mailbox
    }).nThen(function () {
        // create an owned pad
            // pin the pad
        // write to it
    }).nThen(function () {
        // get pinned usage
            // remember the usage
    }).nThen(function () {
        // upload a file
            // remember its size
    }).nThen(function () {
        // get pinned usage
            // check that it is consistent with the size of your uploaded file
    }).nThen(function () {
        // delete your uploaded file
        // unpin your owned file
    }).nThen(function () { // EDITABLE METADATA
        // 
    }).nThen(function () {

    });

    var channel = "d34ebe83931382fcad9fe2e2d0e2cb5f"; // channel
    var recipient = "e8jvf36S3chzkkcaMrLSW7PPrz7VDp85lIFNI26dTmw="; // curvePublic

    // curve keys
    var keys = makeCurveKeys();
    var cryptor = Mailbox.createEncryptor(keys);

    var message = cryptor.encrypt(JSON.stringify({
        type: "CHEESE",
        author: keys.curvePublic,
        content: {
            text: "CAMEMBERT",
        }
    }), recipient);

    client.anonRpc.send('WRITE_PRIVATE_MESSAGE', [channel, message], function (err, response) {
        if (err) {
            return void console.error(err);
        }

        response = response;
        // shutdown doesn't work, so we need to do this instead
        client.shutdown();
    });
});
