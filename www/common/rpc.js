define([
    '/common/encode.js',

    '/bower_components/tweetnacl/nacl-fast.min.js',
], function (Encode) {
    var MAX_LAG_BEFORE_TIMEOUT = 30000;
    var Nacl = window.nacl;

    var uid = function () {
        return Number(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))
            .toString(32).replace(/\./g, '');
    };

    var signMsg = function (type, msg, signKey) {
        var toSign = JSON.stringify([type, msg]);
        var buffer = Nacl.util.decodeUTF8(toSign);
        return Nacl.util.encodeBase64(Nacl.sign(buffer, signKey));
    };

    /*
types of messages:
    pin -> hash
    unpin -> hash
    getHash -> hash
    getTotalSize -> bytes
    getFileSize -> bytes

    */

/*  RPC communicates only with the history keeper
    messages have the format:
        [TYPE, txid, msg]
*/
    var sendMsg = function (ctx, type, signed, id, cb) {
        var network = ctx.network;
        var hkn = network.historyKeeper;
        var txid = uid();

        ctx.pending[txid] = cb;

        return network.sendto(hkn, JSON.stringify([txid, signed, id]));
    };

    var parse = function (msg) {
        try {
            return JSON.parse(msg);
        } catch (e) {
            return null;
        }
    };

/*  Returning messages have the format:
    [txid, {}]
*/
    var onMsg = function (ctx, msg) {
        var parsed = parse(msg);

        if (!parsed) {
            // TODO handle error
            console.log(msg);
            return;
        }

        var txid = parsed[0];
        var pending = ctx.pending[txid];
        var response = parsed.slice(1);

        if (typeof(pending) === 'function') {
            if (response[0] === 'ERROR') {
                return void pending(response[1]);
            }
            pending(void 0, response);
        } else {
            console.log("No callback provided");
        }
    };

    var create = function (network, edPrivateKey, edPublicKey) {
        var signKey = Nacl.util.decodeBase64(edPrivateKey);

        try {
            if (signKey.length !== 64) {
                throw new Error('private key did not match expected length of 64');
            }
        } catch (err) {
            throw new Error("private signing key is not valid");
        }

        // TODO validate public key as well

        var ctx = {
            //privateKey: Encode.hexToUint8Array(edPrivateKey),
            seq: new Date().getTime(),
            network: network,
            timeouts: {}, // timeouts
            pending: {}, // callbacks
        };

        var pin = function (channel, cb) { };

        var send = function (type, msg, cb) {
            // construct a signed message...
            var signed = signMsg(type, msg, signKey);

            return sendMsg(ctx, type, signed, edPublicKey, cb);
        };
        network.on('message', function (msg, sender) {
            onMsg(ctx, msg);
        });
        return {
            send: send,
        };
    };

    return { create: create };
});
