define([
    '/common/encode.js',

    '/bower_components/tweetnacl/nacl-fast.min.js',
], function (Encode) {
    var MAX_LAG_BEFORE_TIMEOUT = 30000;

    var uid = function () {
        return Number(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))
            .toString(32).replace(/\./g, '');
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
    var sendMsg = function (ctx, type, msg, cb) {
        var network = ctx.network;
        var hkn = network.historyKeeper;
        var txid = uid();

        ctx.pending[txid] = cb;

        return network.sendto(hkn, JSON.stringify([txid, type, msg]));
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

    var cookie = function (ctx, cb) {
        // TODO txid
    };

    var signMsg = function (msg, secKey) {
        // TODO
    };

    var create = function (network, edPrivateKey) {
        if (!/[0-9a-f]{64}/.test(edPrivateKey)) {
            //throw new Error("private signing key is not valid");
        }
        var ctx = {
            //privateKey: Encode.hexToUint8Array(edPrivateKey),
            seq: new Date().getTime(),
            network: network,
            timeouts: {}, // timeouts
            pending: {}, // callbacks
        };

        var pin = function (channel, cb) { };

        var send = function (type, msg, cb) {
            return sendMsg(ctx, type, msg, cb);
        };
        network.on('message', function (msg, sender) {
            onMsg(ctx, msg);
        });
        return {
            cookie: function (cb) { cookie(ctx, cb); },
            send: send,
        };
    };

    return { create: create };
});
