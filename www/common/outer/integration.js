// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/common/common-util.js',
    '/common/common-constants.js',
    '/customize/messages.js',
    '/customize/application_config.js',
    '/components/chainpad-crypto/crypto.js',
], function (Util, Constants, Messages, AppConfig, Crypto) {
    var Integration = {};

    var convertToUint8 = function (obj) {
        var l = Object.keys(obj).length;
        var u = new Uint8Array(l);
        for (var i = 0; i<l; i++) {
            u[i] = obj[i];
        }
        return u;
    };

    var sendMsg = function (ctx, data, client, cb) {
        var c = ctx.clients[client];
        if (!c) { return void cb({error: 'NO_CLIENT'}); }
        var chan = ctx.channels[c.channel];
        if (!chan) { return void cb({error: 'NO_CHAN'}); }
        var obj = {
            id: client,
            msg: data.msg,
            uid: data.uid,
        };
        chan.sendMsg(JSON.stringify(obj), cb);
        ctx.emit('MESSAGE', obj, chan.clients.filter(function (cl) {
            return cl !== client;
        }));

    };

    var initIntegration = function (ctx, obj, client, cb) {
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
                channel: channel
            };
        } else {
            return void cb();
        }

        var chan = ctx.channels[channel];
        if (chan) {
            // This channel is already open in another tab

            // ==> Set the ID to our client object
            if (!c.id) { c.id = chan.wc.myID + '-' + client; }

            // ==> And push the new tab to the list
            chan.clients.push(client);

            return void cb();
        }

        var onOpen = function (wc) {

            ctx.channels[channel] = ctx.channels[channel] || {};

            var chan = ctx.channels[channel];
            chan.padChan = padChan;

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

            wc.on('message', function (cryptMsg) {
                var msg = chan.encryptor.decrypt(cryptMsg, secret.keys && secret.keys.validateKey);
                var parsed;
                try {
                    parsed = JSON.parse(msg);
                    ctx.emit('MESSAGE', parsed, chan.clients);
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

        var onReconnect = function () {
            if (!ctx.channels[channel]) { console.log("cant reconnect", channel); return; }
            network.join(channel).then(onOpen, function (err) {
                console.error(err);
            });
        };
        ctx.channels[channel] = ctx.channels[channel] || {};
        ctx.channels[channel].onReconnect = onReconnect;
        network.on('reconnect', onReconnect);
    };

    var leaveChannel = function (ctx, padChan) {
        // Leave channel and prevent reconnect when we leave a pad
        Object.keys(ctx.channels).some(function (cursorChan) {
            var channel = ctx.channels[cursorChan];
            if (channel.padChan !== padChan) { return; }
            if (channel.wc) { channel.wc.leave(); }
            if (channel.onReconnect) {
                var network = ctx.store.network;
                network.off('reconnect', channel.onReconnect);
            }
            delete ctx.channels[cursorChan];
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
                if (chan.onReconnect) {
                    var network = ctx.store.network;
                    network.off('reconnect', chan.onReconnect);
                }
                delete ctx.channels[k];
            }
        }

        delete ctx.clients[clientId];
    };

    Integration.init = function (cfg, waitFor, emit) {
        var integration = {};

        // Already initialized by a "noDrive" tab?
        if (cfg.store && cfg.store.modules && cfg.store.modules['integration']) {
            return cfg.store.modules['integration'];
        }

        var ctx = {
            store: cfg.store,
            emit: emit,
            channels: {},
            clients: {}
        };

        integration.removeClient = function (clientId) {
            removeClient(ctx, clientId);
        };
        integration.leavePad = function (padChan) {
            leaveChannel(ctx, padChan);
        };
        integration.execCommand = function (clientId, obj, cb) {
            var cmd = obj.cmd;
            var data = obj.data;
            if (cmd === 'INIT') {
                return void initIntegration(ctx, data, clientId, cb);
            }
            if (cmd === 'SEND') {
                return void sendMsg(ctx, data, clientId, cb);
            }
        };

        return integration;
    };

    return Integration;
});
