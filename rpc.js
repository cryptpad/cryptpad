/*  Use Nacl for checking signatures of messages */
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

var makeCookie = function (seq) {
    return [
        Math.floor(new Date() / (1000*60*60*24)),
        process.pid, // jshint ignore:line
        seq
    ].join('|');
};

var parseCookie = function (cookie) {
    if (!(cookie && cookie.split)) { return null; }

    var parts = cookie.split('|');
    if (parts.length !== 3) { return null; }

    var c = {};
    c.time = new Date(parts[0]);
    c.pid = parts[1];
    c.seq = parts[2];
    return c;
};

var isValidCookie = function (ctx, cookie) {
    var now = +new Date();
    if (now - cookie.time > 300000) { // 5 minutes
        return false;
    }

    // different process. try harder
    if (process.pid !== cookie.pid) { // jshint ignore:line
        return false;
    }

    //if (cookie.seq !==

    return true;
};

var checkSignature = function (signedMsg, signature, publicKey) {
    if (!(signedMsg && publicKey)) { return false; }

    var signedBuffer;
    var pubBuffer;
    var signatureBuffer;

    try {
        signedBuffer = Nacl.util.decodeUTF8(signedMsg);
    } catch (e) {
        console.log('invalid signedBuffer');
        console.log(signedMsg);
        return null;
    }

    try {
        pubBuffer = Nacl.util.decodeBase64(publicKey);
    } catch (e) {
        return false;
    }

    try {
        signatureBuffer = Nacl.util.decodeBase64(signature);
    } catch (e) {
        return false;
    }

    if (pubBuffer.length !== 32) {
        console.log('public key length: ' + pubBuffer.length);
        console.log(publicKey);
        return false;
    }

    if (signatureBuffer.length !== 64) {
        return false;
    }

    return Nacl.sign.detached.verify(signedBuffer, signatureBuffer, pubBuffer);
};

RPC.create = function (config, cb) {
    // load pin-store...

    console.log('loading rpc module...');

    var Cookies = {};



    var rpc = function (ctx, data, respond) {
        if (!data.length) {
            return void respond("INSUFFICIENT_ARGS");
        } else if (data.length !== 1) {
            console.log(data.length);
        }

        var msg = data[0].slice(0);
        var signature = msg.shift();
        var publicKey = msg.shift();
        var cookie = parseCookie(msg.shift());

        if (!cookie) {
            // no cookie is fine if the RPC is to get a cookie
            if (msg[0] !== 'COOKIE') {
                return void respond('NO_COOKIE');
            }
        } else if (!isValidCookie(cookie)) { // is it a valid cookie?
            return void respond('INVALID_COOKIE');
        }

        var serialized = JSON.stringify(msg);

        if (!(serialized && publicKey)) {
            return void respond('INVALID_MESSAGE_OR_PUBLIC_KEY');
        }

        if (checkSignature(serialized, signature, publicKey) !== true) {
            return void respond("INVALID_SIGNATURE_OR_PUBLIC_KEY");
        }

        if (!msg.length) {
            return void respond("INVALID_SIGNATURE_OR_PUBLIC_KEY");
        }

        if (typeof(msg) !== 'object') {
            return void respond('INVALID_MSG');
        }

        switch (msg[0]) {
            case 'COOKIE':
                return void respond(void 0, makeCookie());
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

