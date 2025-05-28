// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

(() => {
const factory = (Util, Constants, Messages = {},
                    AppConfig = {}, Crypto) => {
    var Cursor = {};

    Cursor.setCustomize = data => {
        Messages = data.Messages;
        AppConfig = data.AppConfig;
    };

    var convertToUint8 = function (obj) {
        var l = Object.keys(obj).length;
        var u = new Uint8Array(l);
        for (var i = 0; i<l; i++) {
            u[i] = obj[i];
        }
        return u;
    };

    // Send the client's cursor to their channel when we receive an update
    var sendMyCursor = function (ctx, clientId) {
        var client = ctx.clients[clientId];
        if (!client || !client.cursor) { return; }
        var chan = ctx.channels[client.channel];
        if (!chan) { return; }
        if (chan.degraded) { return; }
        if (!chan.sendMsg) { return; } // Store not synced yet, we're running with the cache
        var data = {
            id: client.id,
            cursor: client.cursor
        };
        chan.sendMsg(JSON.stringify(data));
        ctx.emit('MESSAGE', data, chan.clients.filter(function (cl) {
            return cl !== clientId;
        }));
    };

    // Send all our cursors data when someone remote joins the channel
    var sendOurCursors = function (ctx, chan) {
        if (chan.degraded) { return; }
        chan.clients.forEach(function (c) {
            var client = ctx.clients[c];
            if (!client) { return; }
            var data = {
                id: client.id,
                cursor: client.cursor
            };
            // Send our data to the other users (NOT including the other tabs of the same worker)
            chan.sendMsg(JSON.stringify(data));
        });
    };

    var updateDegraded = function (ctx, wc, chan) {
        var m = wc.members;
        var DEGRADED = AppConfig.degradedLimit || 8;
        chan.degraded = (m.length-1) >= DEGRADED;
        ctx.emit('DEGRADED', { degraded: chan.degraded }, chan.clients);
    };

    var initCursor = function (ctx, obj, client, cb) {
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
                cursor: {}
            };
        } else {
            return void cb();
        }

        var chan = ctx.channels[channel];
        if (chan) {
            // This channel is already open in another tab

            // ==> Set the ID to our client object
            if (!c.id) { c.id = chan.wc.myID + '-' + client; }

            // ==> Send the cursor position of the other tabs
            chan.clients.forEach(function (cl) {
                var clientObj = ctx.clients[cl];
                if (chan.degraded) { return; }
                if (!clientObj) { return; }
                ctx.emit('MESSAGE', {
                    id: clientObj.id,
                    cursor: clientObj.cursor
                }, [client]);
            });
            chan.sendMsg(JSON.stringify({join: true, id: c.id}));

            // ==> And push the new tab to the list
            chan.clients.push(client);
            updateDegraded(ctx, chan.wc, chan);
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

            wc.on('join', function () {
                sendOurCursors(ctx, chan);
                updateDegraded(ctx, wc, chan);
            });
            wc.on('leave', function (peer) {
                ctx.emit('MESSAGE', {leave: true, id: peer}, chan.clients);
                updateDegraded(ctx, wc, chan);
            });
            wc.on('message', function (cryptMsg) {
                if (chan.degraded) { return; }
                var msg = chan.encryptor.decrypt(cryptMsg, secret.keys && secret.keys.validateKey);
                var parsed;
                try {
                    parsed = JSON.parse(msg);
                    if (parsed && parsed.join) {
                        return void sendOurCursors(ctx, chan);
                    }
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

            updateDegraded(ctx, wc, chan);
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

    var updateCursor = function (ctx, data, client, cb) {
        var c = ctx.clients[client];
        if (!c) { return void cb({error: 'NO_CLIENT'}); }
        var proxy = ctx.store.proxy || {};
        data.color = Util.find(proxy, ['settings', 'general', 'cursor', 'color']);
        data.name = proxy[Constants.displayNameKey] || ctx.store.noDriveName || Messages.anonymous;
        data.avatar = Util.find(proxy, ['profile', 'avatar']);
        data.uid = Util.find(proxy, ['uid']) || ctx.store.noDriveUid;
        c.cursor = data;
        sendMyCursor(ctx, client);
        cb();
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

    Cursor.init = function (cfg, waitFor, emit) {
        var cursor = {};

        // Already initialized by a "noDrive" tab?
        if (cfg.store && cfg.store.modules && cfg.store.modules['cursor']) {
            return cfg.store.modules['cursor'];
        }

        var ctx = {
            store: cfg.store,
            emit: emit,
            channels: {},
            clients: {}
        };

        cursor.removeClient = function (clientId) {
            removeClient(ctx, clientId);
        };
        cursor.leavePad = function (padChan) {
            leaveChannel(ctx, padChan);
        };
        cursor.execCommand = function (clientId, obj, cb) {
            var cmd = obj.cmd;
            var data = obj.data;
            if (cmd === 'INIT_CURSOR') {
                return void initCursor(ctx, data, clientId, cb);
            }
            if (cmd === 'UPDATE') {
                return void updateCursor(ctx, data, clientId, cb);
            }
        };

        return cursor;
    };

    return Cursor;
};

if (typeof(module) !== 'undefined' && module.exports) {
    // Code from customize can't be laoded directly in the build
    module.exports = factory(
        require('../../common/common-util'),
        require('../../common/common-constants'),
        undefined,
        undefined,
        require('chainpad-crypto')
    );
} else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
    define([
        '/common/common-util.js',
        '/common/common-constants.js',
        '/customize/messages.js',
        '/customize/application_config.js',
        '/components/chainpad-crypto/crypto.js',
    ], factory);
} else {
    // unsupported initialization
}

})();
