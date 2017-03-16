/*  Use Nacl for checking signatures of messages

*/
var Nacl = require("tweetnacl");

var RPC = module.exports;

var pin = function (ctx, cb) { };
var unpin = function (ctx, cb) { };
var getHash = function (ctx, cb) { };
var getTotalSize = function (ctx, cb) { };
var getFileSize = function (ctx, cb) { };

var isValidChannel = function (chan) {
    return /^[a-fA-F0-9]/.test(chan);
};

var checkSignature = function (signedMsg, publicKey) {
    if (!(signedMsg && publicKey)) { return null; }

    try {
        var signedBuffer = Nacl.util.decodeBase64(signedMsg);
        var pubBuffer = Nacl.util.decodeBase64(publicKey);
    } catch (e) {
        return null;
    }

    var opened = Nacl.sign.open(signedBuffer, pubBuffer);

    if (opened) {
        var decoded = Nacl.util.encodeUTF8(opened);
        try {
            return JSON.parse(decoded);
        } catch (e) { } // fall through to return
    }
    return null;
};

RPC.create = function (config, cb) {
    // load pin-store...

    console.log('loading rpc module...');
    var rpc = function (ctx, args, respond) {
        if (args.length < 2) {
            return void respond("INSUFFICIENT_ARGS");
        }

        var signed = args[0];
        var publicKey = args[1];

        var msg = checkSignature(signed, publicKey);
        if (!msg) {
            return void respond("INVALID_SIGNATURE_OR_PUBLIC_KEY");
        }

        if (typeof(msg) !== 'object') {
            return void respond('INVALID_MSG');
        }

        switch (msg[0]) {
            case 'ECHO':
                return void respond(void 0, msg);
            case 'RESET':
                return void respond('NOT_IMPLEMENTED', msg);
            case 'PIN':
                return void respond('NOT_IMPLEMENTED', msg);
            case 'UNPIN':
                return void respond('NOT_IMPLEMENTED', msg);
            case 'GET_HASH':
                return void respond('NOT_IMPLEMENTED', msg);
            case 'GET_TOTAL_SIZE':
                return void respond('NOT_IMPLEMENTED', msg);
            case 'GET_FILE_SIZE':
                if (!isValidChannel(msg[1])) {
                    return void respond('INVALID_CHAN');
                }

                return void ctx.store.getChannelSize(msg[1], function (e, size) {
                    if (e) { return void respond(e.code); }
                    respond(void 0, size);
                });
            default:
                return void respond('UNSUPPORTED_RPC_CALL', msg);
        }
    };

    cb(void 0, rpc);
};

