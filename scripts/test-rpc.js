/* globals process */
var Client = require("../lib/client/");
var Mailbox = require("../www/bower_components/chainpad-crypto").Mailbox;
var Nacl = require("tweetnacl");

var makeKeys = function () {
    var pair = Nacl.box.keyPair();
    return {
        curvePrivate: Nacl.util.encodeBase64(pair.secretKey),
        curvePublic: Nacl.util.encodeBase64(pair.publicKey),
    };
};

Client.create(function (err, client) {
    if (err) {
        console.error(err);
        process.exit(1);
    }

    var channel = "d34ebe83931382fcad9fe2e2d0e2cb5f"; // channel
    var recipient = "e8jvf36S3chzkkcaMrLSW7PPrz7VDp85lIFNI26dTmw="; // curvePublic

    var keys = makeKeys();
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
