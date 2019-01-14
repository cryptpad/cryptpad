define([
    '/common/common-util.js',
    '/common/common-constants.js',
    '/customize/messages.js',
    '/bower_components/chainpad-crypto/crypto.js',
], function (Util, Constants, Messages, Crypto) {
    var OO = {};

    var convertToUint8 = function (obj) {
        var l = Object.keys(obj).length;
        var u = new Uint8Array(l);
        for (var i = 0; i<l; i++) {
            u[i] = obj[i];
        }
        return u;
    };

    var openChannel = function (ctx, obj, client, cb) {
        var channel = obj.channel;
        var secret = obj.secret;
        if (secret.keys.cryptKey) {
            secret.keys.cryptKey = convertToUint8(secret.keys.cryptKey);
        }

        var padChan = secret.channel;
        var network = ctx.store.network;
        var first = true;

        var c = ctx.clients[client];
        if (!c) {
            c = ctx.clients[client] = {
                channel: channel,
                padChan: padChan,
            };
        } else {
            return void cb();
        }

        var chan = ctx.channels[channel];
        if (chan) {
            // This channel is already open in another tab

            // ==> Set the ID to our client object
            if (!c.id) { c.id = chan.wc.myID + '-' + client; }

            // ==> Send the join message to the other members of the channel
            // XXX bcast a "join" message to the channel?

            // ==> And push the new tab to the list
            chan.clients.push(client);
            return void cb();
        }

        var onOpen = function (wc) {

            ctx.channels[channel] = ctx.channels[channel] || {};

            var chan = ctx.channels[channel];
            if (!c.id) { c.id = wc.myID + '-' + client; }
            if (chan.clients) {
                // If 2 tabs from the same worker have been opened at the same time,
                // we have to fix both of them
                chan.clients.forEach(function (cl) {
                    if (ctx.clients[cl] && !ctx.clients[cl].id) {
                        ctx.clients[cl].id = wc.myID + '-' + cl;
                    }
                });
            }


            if (!chan.encryptor) { chan.encryptor = Crypto.createEncryptor(secret.keys); }

            wc.on('join', function () {
                // XXX
            });
            wc.on('leave', function (peer) {
                // XXX
            });
            wc.on('message', function (cryptMsg) {
                var msg = chan.encryptor.decrypt(cryptMsg, secret.keys && secret.keys.validateKey);
                var parsed;
                try {
                    parsed = JSON.parse(msg);
                    // XXX
                } catch (e) { console.error(e); }
            });

            chan.wc = wc;
            chan.sendMsg = function (msg, cb) {
                cb = cb || function () {};
                var cmsg = chan.encryptor.encrypt(msg);
                wc.bcast(cmsg).then(function () {
                    cb();
                }, function (err) {
                    cb({error: err});
                });
            };

            if (!first) { return; }
            chan.clients = [client];
            first = false;
            cb();
        };

        network.join(channel).then(onOpen, function (err) {
            return void cb({error: err});
        });

        network.on('reconnect', function () {
            if (!ctx.channels[channel]) { console.log("cant reconnect", channel); return; }
            network.join(channel).then(onOpen, function (err) {
                console.error(err);
            });
        });
    };


    var leaveChannel = function (ctx, padChan) {
        // Leave channel and prevent reconnect when we leave a pad
        Object.keys(ctx.channels).some(function (ooChan) {
            var channel = ctx.channels[ooChan];
            if (channel.padChan !== padChan) { return; }
            if (channel.wc) { channel.wc.leave(); }
            delete ctx.channels[ooChan];
            return true;
        });
    };

    // Remove the client from all its channels when a tab is closed
    var removeClient = function (ctx, clientId) {
        var filter = function (c) {
            return c !== clientId;
        };

        // Remove the client from our channels
        var chan;
        for (var k in ctx.channels) {
            chan = ctx.channels[k];
            chan.clients = chan.clients.filter(filter);
            if (chan.clients.length === 0) {
                if (chan.wc) { chan.wc.leave(); }
                delete ctx.channels[k];
            }
        }

        // Send the leave message to the channel we were in
        if (ctx.clients[clientId]) {
            var leaveMsg = {
                leave: true,
                id: ctx.clients[clientId].id
            };
            chan = ctx.channels[ctx.clients[clientId].channel];
            if (chan) {
                chan.sendMsg(JSON.stringify(leaveMsg));
                ctx.emit('MESSAGE', leaveMsg, chan.clients);
            }
        }

        delete ctx.clients[clientId];
    };



    OO.init = function (store, emit) {
        var oo = {};
        var ctx = {
            store: store,
            emit: emit,
            channels: {},
            clients: {}
        };

        oo.removeClient = function (clientId) {
            removeClient(ctx, clientId);
        };
        oo.leavePad = function (padChan) {
            leaveChannel(ctx, padChan);
        };
        oo.execCommand = function (clientId, obj, cb) {
            var cmd = obj.cmd;
            var data = obj.data;
            if (cmd === 'OPEN_CHANNEL') {
                return void openChannel(ctx, data, clientId, cb);
            }
        };

        return cursor;
    };

    return OO;
});
