(function () {
var factory = function (Util, Nacl) {
    // we will send messages with a unique id for each RPC
    // that id is returned with each response, indicating which call it was in response to
    var uid = Util.uid;

    // safely parse json messages, because they might cause parse errors
    var tryParse = Util.tryParse;

    // we will sign various message with our edPrivate keys
    // this handles that in a generic way
    var signMsg = function (data, signKey) {
        var buffer = Nacl.util.decodeUTF8(JSON.stringify(data));
        return Nacl.util.encodeBase64(Nacl.sign.detached(buffer, signKey));
    };

    // sendMsg takes a pre-formed message, does a little validation
    // adds a transaction id to the message and stores its callback
    // and finally sends it off to the historyKeeper, which delegates its
    // processing to the RPC submodule
    var sendMsg = function (ctx, data, cb) {
        if (typeof(cb) !== 'function') { throw new Error('expected callback'); }

        var network = ctx.network;
        var hkn = network.historyKeeper;
        if (typeof(hkn) !== 'string') { return void cb("NO_HISTORY_KEEPER"); }

        var txid = uid();

        var pending = ctx.pending[txid] = function (err, response) {
            cb(err, response);
        };
        pending.data = data;
        pending.called = 0;

        return network.sendto(hkn, JSON.stringify([txid, data]));
    };

    var matchesAnon = function (ctx, txid) {
        if (!ctx.anon) { return false; }
        if (typeof(ctx.anon.pending[txid]) !== 'function') { return false; }
        return true;
    };

    var handleAnon = function (ctx /* anon_ctx */, txid, body /* parsed messages without txid */) {
        // if anon is handling it we know there's a pending callback
        var pending = ctx.pending[txid];
        if (body[0] === 'ERROR') { pending(body[1]); }
        else { pending(void 0, body.slice(1)); }
        delete ctx.pending[txid];
    };

    var onMsg = function (ctx /* network context */, msg /* string message */) {
        if (typeof(msg) !== 'string') {
            console.error("received non-string message [%s]", msg);
        }

        var parsed = tryParse(msg);
        if (!parsed) {
            return void console.error(new Error('could not parse message: %s', msg));
        }

        // RPC messages are always arrays.
        if (!Array.isArray(parsed)) { return; }
        // ignore FULL_HISTORY messages
        if (/(FULL_HISTORY|HISTORY_RANGE)/.test(parsed[0])) { return; }

        var txid = parsed[0];

        // txid must be a string, or this message is not meant for us
        if (typeof(txid) !== 'string') { return; }

        if (matchesAnon(ctx, txid)) {
            return void handleAnon(ctx.anon, txid, parsed.slice(1));
        }

        // iterate over authenticated rpc contexts and check if they are expecting
        // a message with this txid
        if (ctx.authenticated.some(function (rpc_ctx) {
            var pending = rpc_ctx.pending[txid];
            // not meant for you
            if (typeof(pending) !== 'function') { return false; }

            // if you're here, the message is for you...

            if (parsed[1] !== 'ERROR') {
                // if the server sent you a new cookie, replace the old one
                if (/\|/.test(parsed[1]) && rpc_ctx.cookie !== parsed[1]) {
                    rpc_ctx.cookie = parsed[1];
                }
                pending(void 0, parsed.slice(2));

                // if successful, delete the callback...
                delete rpc_ctx.pending[txid];
                // prevent further iteration
                return true;
            }

            // NO_COOKIE errors mean you failed to authenticate.
            // request a new cookie and resend the query
            if (parsed[2] === 'NO_COOKIE') {
                rpc_ctx.send('COOKIE', "", function (e) {
                    if (e) {
                        console.error(e);
                        return void pending(e);
                    }

                    // resend the same command again
                    // give up if you've already tried resending
                    if (rpc_ctx.resend(txid)) { delete rpc_ctx.pending[txid]; }
                });
                // prevent further iteration
                return true;
            }

            // if you're here then your RPC passed authentication but had some other error
            // call back with the error message
            pending(parsed[2]);
            // and delete the pending callback
            delete rpc_ctx.pending[txid];

            // prevent further iteration
            return true;
        })) {
            // the message was handled, so stop here
            return;
        }

        console.error("UNHANDLED RPC MESSAGE", msg);
    };

    var networks = [];
    var contexts = [];

    var initNetworkContext = function (network) {
        var ctx = {
            network: network,
            connected: true,
            anon: undefined,
            authenticated: [],
        };
        networks.push(network);
        contexts.push(ctx);

        // add listeners...
        network.on('message', function (msg, sender) {
            if (sender !== network.historyKeeper) { return; }
            onMsg(ctx, msg);
        });

        network.on('disconnect', function () {
            ctx.connected = false;
            if (ctx.anon) { ctx.anon.connected = false; }
            ctx.authenticated.forEach(function (ctx) {
                ctx.connected = false;
            });
        });

        network.on('reconnect', function () {
            if (ctx.anon) { ctx.anon.connected = true; }
            ctx.authenticated.forEach(function (ctx) {
                ctx.connected = true;
            });
        });
        return ctx;
    };

    var getNetworkContext = function (network) {
        var i;
        networks.some(function (current, j) {
            if (network !== current) { return false; }
            i = j;
            return true;
        });

        if (contexts[i]) { return contexts[i]; }
        return initNetworkContext(network);
    };

    var initAuthenticatedRpc = function (networkContext, keys) {
        var ctx = {
            network: networkContext.network,
            publicKey: keys.publicKeyString,
            timeouts: {},
            pending: {},
            cookie: null,
            connected: true,
        };

        var send = ctx.send = function (type, msg, _cb) {
            var cb = Util.mkAsync(_cb);

            if (!ctx.connected && type !== 'COOKIE') {
                return void cb("DISCONNECTED");
            }

            // construct a signed message...

            var data = [type, msg];
            if (ctx.cookie && ctx.cookie.join) {
                data.unshift(ctx.cookie.join('|'));
            } else {
                data.unshift(ctx.cookie);
            }

            var sig = signMsg(data, keys.signKey);

            data.unshift(keys.publicKeyString);
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
            pending.data[0] = signMsg(pending.data.slice(2), keys.signKey);

            // store the callback with a new txid
            var new_txid = uid();
            ctx.pending[new_txid] = pending;
            // and delete the old one
            delete ctx.pending[txid];

            try {
                return ctx.network.sendto(ctx.network.historyKeeper,
                    JSON.stringify([new_txid, pending.data]));
            } catch (e) {
                console.log("failed to resend");
                console.error(e);
            }
        };

        send.unauthenticated = function (type, msg, _cb) {
            var cb = Util.mkAsync(_cb);
            if (!ctx.connected) { return void cb('DISCONNECTED'); }

            // construct an unsigned message
            var data = [null, keys.publicKeyString, null, type, msg];
            if (ctx.cookie && ctx.cookie.join) {
                data[2] = ctx.cookie.join('|');
            } else {
                data[2] = ctx.cookie;
            }

            return sendMsg(ctx, data, cb);
        };

        ctx.destroy = function () {
            // clear all pending timeouts
            Object.keys(ctx.timeouts).forEach(function (to) {
                clearTimeout(to);
            });

            // remove the ctx from the network's stack
            var idx = networkContext.authenticated.indexOf(ctx);
            if (idx === -1) { return; }
            networkContext.authenticated.splice(idx, 1);
        };

        networkContext.authenticated.push(ctx);
        return ctx;
    };

    var getAuthenticatedContext = function (networkContext, keys) {
        if (!networkContext) { throw new Error('expected network context'); }

        var publicKey = keys.publicKeyString;

        var i;
        networkContext.authenticated.some(function (ctx, j) {
            if (ctx.publicKey !== publicKey) { return false; }
            i = j;
            return true;
        });

        if (networkContext.authenticated[i]) { return networkContext.authenticated[i]; }

        return initAuthenticatedRpc(networkContext, keys);
    };

    var create = function (network, edPrivateKey, edPublicKey, _cb) {
        if (typeof(_cb) !== 'function') { throw new Error("expected callback"); }

        var cb = Util.mkAsync(_cb);

        var signKey;

        try {
            signKey = Nacl.util.decodeBase64(edPrivateKey);
            if (signKey.length !== 64) {
                throw new Error('private key did not match expected length of 64');
            }
        } catch (err) {
            return void cb(err);
        }

        try {
            if (Nacl.util.decodeBase64(edPublicKey).length !== 32) {
                return void cb('expected public key to be 32 uint');
            }
        } catch (err) { return void cb(err); }

        if (!network) { return void cb('NO_NETWORK'); }

        // get or create a context for the provided network
        var net_ctx = getNetworkContext(network);

        var rpc_ctx = getAuthenticatedContext(net_ctx, {
            publicKeyString: edPublicKey,
            signKey: signKey,
        });

        rpc_ctx.send('COOKIE', "", function (e) {
            if (e) { return void cb(e); }
            // callback to provide 'send' method to whatever needs it
            cb(void 0, {
                send: rpc_ctx.send,
                destroy: rpc_ctx.destroy,
            });
        });
    };

    var initAnonRpc = function (networkContext) {
        var ctx = {
            network: networkContext.network,
            timeouts: {},
            pending: {},
            connected: true,
        };

        // any particular network will only ever need one anonymous rpc
        networkContext.anon = ctx;

        ctx.send = function (type, msg, _cb) {
            var cb = Util.mkAsync(_cb);
            if (!ctx.connected) { return void cb('DISCONNECTED'); }

            // construct an unsigned message...
            var data = [type, msg];

            // [type, msg]
            return sendMsg(ctx, data, cb);
        };

        ctx.resend = function (txid) {
            var pending = ctx.pending[txid];
            if (pending.called) {
                console.error("[%s] called too many times", txid);
                return true;
            }
            pending.called++;

            try {
                return ctx.network.sendto(ctx.network.historyKeeper,
                    JSON.stringify([txid, pending.data]));
            } catch (e) {
                console.log("failed to resend");
                console.error(e);
            }
        };

        ctx.destroy = function () {
            // clear all pending timeouts
            Object.keys(ctx.timeouts).forEach(function (to) {
                clearTimeout(to);
            });

            networkContext.anon = undefined;
        };

        return ctx;
    };

    var getAnonContext = function (networkContext) {
        return networkContext.anon || initAnonRpc(networkContext);
    };

    var createAnonymous = function (network, _cb) {
        // enforce asynchrony
        var cb = Util.mkAsync(_cb);

        if (typeof(cb) !== 'function') { throw new Error("expected callback"); }
        if (!network) { return void cb('NO_NETWORK'); }

        // get or create a context for the provided network
        var ctx = getAnonContext(getNetworkContext(network));

        cb(void 0, {
            send: ctx.send,
            destroy: ctx.destroy,
        });
    };

    return { create: create, createAnonymous: createAnonymous };
};

    if (typeof(module) !== 'undefined' && module.exports) {
        module.exports = factory(require("./common-util"), require("tweetnacl"));
    } else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
        define([
            '/common/common-util.js',
            '/bower_components/tweetnacl/nacl-fast.min.js',
        ], function (Util) {
            return factory(Util, window.nacl);
        });
    } else {
        // I'm not gonna bother supporting any other kind of instanciation
    }
}());
