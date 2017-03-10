/*  Use Nacl for checking signatures of messages

*/
var Nacl = require("tweetnacl");

var RPC = module.exports;

var pin = function (ctx, cb) { };
var unpin = function (ctx, cb) { };
var getHash = function (ctx, cb) { };
var getTotalSize = function (ctx, cb) { };
var getFileSize = function (ctx, cb) { };

RPC.create = function (config, cb) {
    // load pin-store...

    console.log('loading rpc module...');
    rpc = function (msg, respond) {
        switch (msg[0]) {
            case 'ECHO':
                respond(void 0, msg);
                break;
            case 'PIN':
            case 'UNPIN':
            case 'GET_HASH':
            case 'GET_TOTAL_SIZE':
            case 'GET_FILE_SIZE':

            default:
                respond('UNSUPPORTED_RPC_CALL', msg);
                break;
        }
    };

    cb(void 0, rpc);
};

