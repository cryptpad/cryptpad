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

RPC.create = function (config, cb) {
    // load pin-store...

    console.log('loading rpc module...');
    var rpc = function (ctx, msg, respond) {
        switch (msg[0]) {
            case 'ECHO':
                respond(void 0, msg);
                break;
            case 'PIN':
            case 'UNPIN':
            case 'GET_HASH':
            case 'GET_TOTAL_SIZE':
            case 'GET_FILE_SIZE':
                if (!isValidChannel(msg[1])) {
                    return void respond('INVALID_CHAN');
                }

                return void ctx.store.getChannelSize(msg[1], function (e, size) {
                    if (e) { return void respond(e.code); }
                    respond(void 0, size);
                });
            default:
                respond('UNSUPPORTED_RPC_CALL', msg);
                break;
        }
    };

    cb(void 0, rpc);
};

