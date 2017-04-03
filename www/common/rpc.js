define([
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function () {
    var MAX_LAG_BEFORE_TIMEOUT = 30000;
    var Nacl = window.nacl;

    var uid = function () {
        return Number(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))
            .toString(32).replace(/\./g, '');
    };

    var signMsg = function (data, signKey) {
        var buffer = Nacl.util.decodeUTF8(JSON.stringify(data));
        return Nacl.util.encodeBase64(Nacl.sign.detached(buffer, signKey));
    };

/*
types of messages:
    pin -> hash
    unpin -> hash
    getHash -> hash
    getTotalSize -> bytes
    getFileSize -> bytes
*/

    var sendMsg = function (ctx, data, cb) {
        var network = ctx.network;
        var hkn = network.historyKeeper;
        var txid = uid();

        ctx.pending[txid] = cb;
        return network.sendto(hkn, JSON.stringify([txid, data]));
    };

    var parse = function (msg) {
        try {
            return JSON.parse(msg);
        } catch (e) {
            return null;
        }
    };

    var onMsg = function (ctx, msg) {
        var parsed = parse(msg);

        if (!parsed) {
            return void console.error(new Error('could not parse message: %s', msg));
        }

        var txid = parsed[0];
        var pending = ctx.pending[txid];

        if (!(parsed && parsed.slice)) {
            return void console.error('MALFORMED_RPC_RESPONSE');
        }

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

    var create = function (network, edPrivateKey, edPublicKey, cb) {
        var signKey;

        try {
            signKey = Nacl.util.decodeBase64(edPrivateKey);
            if (signKey.length !== 64) {
                throw new Error('private key did not match expected length of 64');
            }
        } catch (err) {
            return void cb(err);
        }

        var pubBuffer;
        try {
            pubBuffer = Nacl.util.decodeBase64(edPublicKey);
            if (pubBuffer.length !== 32) {
                return void cb('expected public key to be 32 uint');
            }
        } catch (err) {
            return void cb(err);
        }

        var ctx = {
            seq: new Date().getTime(),
            network: network,
            timeouts: {}, // timeouts
            pending: {}, // callbacks
            cookie: null,
        };

        var send = function (type, msg, cb) {
            // construct a signed message...
            var data = [type, msg];
            var sig = signMsg(data, signKey);

            if (ctx.cookie && ctx.cookie.join) {
                data.unshift(ctx.cookie.join('|')); //
            } else {
                data.unshift(ctx.cookie);
            }

            data.unshift(edPublicKey);
            data.unshift(sig);

            // [sig, edPublicKey, cookie, type, msg]
            return sendMsg(ctx, data, cb);
        };

        network.on('message', function (msg, sender) {
            onMsg(ctx, msg);
        });

        send('COOKIE', "", function (e, msg) {
            if (e) { return void cb(e); }

            console.log(msg); // DO something with the returned cookie
            ctx.cookie = msg;

            cb(void 0, {
                send: send,
            });
        });

    };

    return { create: create };
});
