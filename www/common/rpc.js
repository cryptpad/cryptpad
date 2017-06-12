define([
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function () {
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

        var pending = ctx.pending[txid] = function (err, response) {
            cb(err, response);
        };
        pending.data = data;
        pending.called = 0;
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

        // RPC messages are always arrays.
        if (!Array.isArray(parsed)) { return; }
        var txid = parsed[0];
        // txid must be a string, or this message is not meant for us
        if (typeof(txid) !== 'string') { return; }
        var cookie = parsed[1];

        var pending = ctx.pending[txid];

        if (!(parsed && parsed.slice)) {
            // RPC responses are arrays. this message isn't meant for us.
            return;
        }

        var response = parsed.slice(2);

        if (typeof(pending) === 'function') {
            if (parsed[1] === 'ERROR') {
                if (parsed[2] === 'NO_COOKIE') {
                    return void ctx.send('COOKIE', "", function (e) {
                        if (e) {
                            console.error(e);
                            return void pending(e);
                        }

                        // resend the same command again
                        // give up if you've already tried resending
                        if (ctx.resend(txid)) { delete ctx.pending[txid]; }
                    });
                }

                pending(parsed[2]);
                delete ctx.pending[txid];
                return;
            } else {
                // update the cookie
                if (/\|/.test(cookie)) {
                    if (ctx.cookie !== cookie) {
                        ctx.cookie = cookie;
                    }
                }
            }
            pending(void 0, response);

            // if successful, delete the callback...
            delete ctx.pending[txid];
            return;
        }
        console.error("received message for txid[%s] with no callback", txid);
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
            network: network,
            timeouts: {}, // timeouts
            pending: {}, // callbacks
            cookie: null,
            connected: true,
        };

        var send = ctx.send = function (type, msg, cb) {
            if (!ctx.connected && type !== 'COOKIE') {
                return void window.setTimeout(function () {
                    cb('DISCONNECTED');
                });
            }

            // construct a signed message...

            var data = [type, msg];
            if (ctx.cookie && ctx.cookie.join) {
                data.unshift(ctx.cookie.join('|'));
            } else {
                data.unshift(ctx.cookie);
            }

            var sig = signMsg(data, signKey);

            data.unshift(edPublicKey);
            data.unshift(sig);

            // [sig, edPublicKey, cookie, type, msg]
            return sendMsg(ctx, data, cb);
        };

        ctx.resend = function (txid) {
            var pending = ctx.pending[txid];
            if (pending.called) {
                console.error("[%s] called too many times", txid);
                return true;
            }
            pending.called++;

            // update the cookie and signature...
            pending.data[2] = ctx.cookie;
            pending.data[0] = signMsg(pending.data.slice(2), signKey);
            try {
                return ctx.network.sendto(ctx.network.historyKeeper,
                    JSON.stringify([txid, pending.data]));
            } catch (e) {
                console.log("failed to resend");
                console.error(e);
            }
        };

        send.unauthenticated = function (type, msg, cb) {
            if (!ctx.connected) {
                return void window.setTimeout(function () {
                    cb('DISCONNECTED');
                });
            }

            // construct an unsigned message
            var data = [null, edPublicKey, null, type, msg];
            if (ctx.cookie && ctx.cookie.join) {
                data[2] = ctx.cookie.join('|');
            } else {
                data[2] = ctx.cookie;
            }

            return sendMsg(ctx, data, cb);
        };

        network.on('message', function (msg) {
            onMsg(ctx, msg);
        });

        network.on('disconnect', function () {
            ctx.connected = false;
        });

        network.on('reconnect', function () {
            send('COOKIE', "", function (e) {
                if (e) { return void cb(e); }
                ctx.connected = true;
            });
        });

        send('COOKIE', "", function (e) {
            if (e) { return void cb(e); }
            // callback to provide 'send' method to whatever needs it
            cb(void 0, { send: send, });
        });
    };

    return { create: create };
});
