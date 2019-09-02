define([
], function () {
    var OO = {};

    var openChannel = function (ctx, obj, client, cb) {
        var channel = obj.channel;
        var padChan = obj.padChan;
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

            // ==> Use our netflux ID to create our client ID
            if (!c.id) { c.id = chan.wc.myID + '-' + client; }

            chan.history.forEach(function (msg) {
                ctx.emit('MESSAGE', {
                    msg: msg,
                    validateKey: chan.validateKey
                }, [client]);
            });

            // ==> And push the new tab to the list
            chan.clients.push(client);
            return void cb();
        }

        var onOpen = function (wc) {

            ctx.channels[channel] = ctx.channels[channel] || {
                history: [],
                validateKey: obj.validateKey
            };

            chan = ctx.channels[channel];

            // Create our client ID using the netflux ID
            if (!c.id) { c.id = wc.myID + '-' + client; }

            // If this is a reconnect, we have a new netflux ID so we're going to fix
            // all our client IDs.
            if (chan.clients) {
                chan.clients.forEach(function (cl) {
                    if (ctx.clients[cl] && !ctx.clients[cl].id) {
                        ctx.clients[cl].id = wc.myID + '-' + cl;
                    }
                });
            }

            wc.on('join', function () {
            });
            wc.on('leave', function () {
            });
            wc.on('message', function (msg) {
                chan.history.push(msg);
                ctx.emit('MESSAGE', {
                    msg: msg,
                    validateKey: chan.validateKey
                }, chan.clients);
            });

            chan.wc = wc;
            chan.sendMsg = function (msg, cb) {
                cb = cb || function () {};
                wc.bcast(msg).then(function () {
                    chan.history.push(msg);
                    cb();
                }, function (err) {
                    cb({error: err});
                });
            };

            if (first) {
                chan.clients = [client];
                chan.lastCpHash = obj.lastCpHash;
                first = false;
                cb();
            }

            var hk = network.historyKeeper;
            var cfg = {
                lastKnownHash: chan.lastKnownHash || chan.lastCpHash,
                metadata: {
                    validateKey: obj.validateKey,
                    owners: obj.owners,
                    expire: obj.expire
                }
            };
            var msg = ['GET_HISTORY', wc.id, cfg];
            // Add the validateKey if we are the channel creator and we have a validateKey
            if (hk) {
                network.sendto(hk, JSON.stringify(msg)).then(function () {
                }, function (err) {
                    console.error(err);
                });
            }

        };

        network.on('message', function (msg, sender) {
            if (!ctx.channels[channel]) { return; }
            var hk = network.historyKeeper;
            if (sender !== hk) { return; }

            // Parse the message
            var parsed;
            try {
                parsed = JSON.parse(msg);
            } catch (e) {}
            if (!parsed) { return; }


            // Keep only metadata messages for the current channel
            if (parsed.channel && parsed.channel !== channel) { return; }
            // Ignore the metadata message
            if (parsed.validateKey && parsed.channel) {
                if (!chan.validateKey) {
                    chan.validateKey = parsed.validateKey;
                }
                return;
            }
            // End of history: emit READY
            if (parsed.state && parsed.state === 1 && parsed.channel) {
                ctx.emit('READY', '', chan.clients);
                return;
            }
            if (parsed.error && parsed.channel) { return; }

            msg = parsed[4];

            // Keep only the history for our channel
            if (parsed[3] !== channel) { return; }

            var hash = msg.slice(0,64);
            if (hash === chan.lastKnownHash || hash === chan.lastCpHash) { return; }

            chan.lastKnownHash = hash;
            ctx.emit('MESSAGE', {
                msg: msg,
            }, chan.clients);
            chan.history.push(msg);
        });

        network.join(channel).then(onOpen, function (err) {
            return void cb({error: err});
        });

        network.on('reconnect', function () {
            if (!ctx.channels[channel]) { return; }
            network.join(channel).then(onOpen, function (err) {
                console.error(err);
            });
        });
    };

    var updateHash = function (ctx, data, clientId, cb) {
        var c = ctx.clients[clientId];
        if (!c) { return void cb({ error: 'NOT_IN_CHANNEL' }); }
        var chan = ctx.channels[c.channel];
        if (!chan) { return void cb({ error: 'INVALID_CHANNEL' }); }
        var hash = data;
        var index = -1;
        chan.history.some(function (msg, idx) {
            if (msg.slice(0,64) === hash) {
                index = idx + 1;
                return true;
            }
        });
        if (index !== -1) {
            chan.history = chan.history.slice(index);
        }
        cb();
    };

    var sendMessage = function (ctx, data, clientId, cb) {
        var c = ctx.clients[clientId];
        if (!c) { return void cb({ error: 'NOT_IN_CHANNEL' }); }
        var chan = ctx.channels[c.channel];
        if (!chan) { return void cb({ error: 'INVALID_CHANNEL' }); }
        if (data.isCp) {
            return void chan.sendMsg(data.isCp, cb);
        }
        chan.sendMsg(data.msg, cb);
        ctx.emit('MESSAGE', {
            msg: data.msg
        }, chan.clients.filter(function (cl) {
            return cl !== clientId;
        }));
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

        if (ctx.clients[clientId]) {
            var oldChannel = ctx.clients[clientId].channel;
            var oldChan = ctx.channels[oldChannel];
            if (oldChan) {
                ctx.emit('LEAVE', {id: clientId}, [oldChan.clients[0]]);
            }
            delete ctx.clients[clientId];
        }
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
            if (cmd === 'SEND_MESSAGE') {
                return void sendMessage(ctx, data, clientId, cb);
            }
            if (cmd === 'UPDATE_HASH') {
                return void updateHash(ctx, data, clientId, cb);
            }
            if (cmd === 'OPEN_CHANNEL') {
                return void openChannel(ctx, data, clientId, cb);
            }
        };

        return oo;
    };

    return OO;
});
