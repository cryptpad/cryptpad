define([
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/common/common-realtime.js',
    '/common/common-messaging.js',
    '/common/common-constants.js',
    '/customize/messages.js',
    '/customize/application_config.js',

    '/bower_components/nthen/index.js',
], function (Crypto, Hash, Util, Realtime, Messaging, Constants, Messages, AppConfig, nThen) {
    'use strict';
    var Curve = Crypto.Curve;

    var Msg = {};

    var Types = {
        message: 'MSG',
        unfriend: 'UNFRIEND',
        mapId: 'MAP_ID',
        mapIdAck: 'MAP_ID_ACK'
    };

    var clone = function (o) {
        return JSON.parse(JSON.stringify(o));
    };

    var convertToUint8 = function (obj) {
        var l = Object.keys(obj).length;
        var u = new Uint8Array(l);
        for (var i = 0; i<l; i++) {
            u[i] = obj[i];
        }
        return u;
    };

    var createData = Messaging.createData;

    var getFriend = function (proxy, pubkey) {
        if (pubkey === proxy.curvePublic) {
            var data = createData(proxy);
            delete data.channel;
            return data;
        }
        return proxy.friends ? proxy.friends[pubkey] : undefined;
    };

    var getFriendList = Msg.getFriendList = function (proxy) {
        if (!proxy.friends) { proxy.friends = {}; }
        return proxy.friends;
    };

    var msgAlreadyKnown = function (channel, sig) {
        return channel.messages.some(function (message) {
            return message.sig === sig;
        });
    };

    var getFriendFromChannel = function (ctx, id) {
        var proxy = ctx.store.proxy;
        var friends = getFriendList(proxy);
        var friend;
        for (var k in friends) {
            if (friends[k].channel === id) {
                friend = friends[k];
                break;
            }
        }
        return friend;
    };

    var initRangeRequest = function (ctx, txid, chanId, cb) {
        if (!ctx.range_requests) { ctx.range_requests = {}; }
        ctx.range_requests[txid] = {
            messages: [],
            cb: cb,
            chanId: chanId,
        };
    };
    var getRangeRequest = function (ctx, txid) {
        return ctx.range_requests[txid];
    };
    var deleteRangeRequest = function (ctx, txid) {
        delete ctx.range_requests[txid];
    };

    // History
    var getMoreHistory = function (ctx, chanId, hash, count, cb) {
        if (typeof(cb) !== 'function') { return; }

        if (typeof(hash) !== 'string') {
            // Channel is empty!
            return void cb([]);
        }

        var chan = ctx.channels[chanId];
        if (typeof(chan) === 'undefined') {
            console.error("chan is undefined. we're going to have a problem here");
            return;
        }

        var txid = Util.uid();
        initRangeRequest(ctx, txid, chanId, cb);
        var msg = [ 'GET_HISTORY_RANGE', chan.id, {
                from: hash,
                count: count,
                txid: txid,
            }
        ];

        var network = ctx.store.network;
        network.sendto(network.historyKeeper, JSON.stringify(msg)).then(function () {
        }, function (err) {
            console.error(err);
        });
    };

    var getChannelMessagesSince = function (ctx, channel, data, keys) {
        var network = ctx.store.network;
        console.log('Fetching [%s] messages since [%s]', channel.id, data.lastKnownHash || '');

        if (channel.isPadChat || channel.isTeamChat) {
            // We need to use GET_HISTORY_RANGE to make sure we won't get the full history
            var txid = Util.uid();
            initRangeRequest(ctx, txid, channel.id, undefined);
            var msg0 = ['GET_HISTORY_RANGE', channel.id, {
                    //from: hash,
                    count: 10,
                    txid: txid,
                }
            ];
            network.sendto(network.historyKeeper, JSON.stringify(msg0)).then(function () {
            }, function (err) {
                console.error(err);
            });
            return;
        }

        // Friend chat, intial history
        var proxy = ctx.store.proxy;
        var friend = getFriendFromChannel(ctx, channel.id) || {};
        var cfg = {
            metadata: {
                validateKey: keys ? keys.validateKey : undefined,
                owners: [proxy.edPublic, friend.edPublic],
            },
            lastKnownHash: data.lastKnownHash
        };
        var msg = ['GET_HISTORY', channel.id, cfg];
        network.sendto(network.historyKeeper, JSON.stringify(msg))
          .then(function () {}, function (err) {
            console.error(err);
        });
    };


    var setChannelHead = function (ctx, id, hash, cb) {
        var channel = ctx.channels[id];
        if (channel.isFriendChat) {
            var friend = getFriendFromChannel(ctx, id);
            if (!friend) { return void cb({error: 'NO_SUCH_FRIEND'}); }
            friend.lastKnownHash = hash;
        } else if (channel.isPadChat) {
            // Nothing to do
        } else if (channel.isTeamChat) {
            // Nothing to do
        } else {
            // TODO room
            return void cb({error: 'NOT_IMPLEMENTED'});
        }
        cb();
    };

    var onChannelReady = function (ctx, chanId) {
        var channel = ctx.channels[chanId];
        if (!channel) { return; }
        channel.ready = true;
        channel.onReady.fire();
    };

    // Id message allows us to map a netfluxId with a public curve key
    var onIdMessage = function (ctx, msg, sender) {
        // Parse the history message and make sure it is related to an existing channel
        var channel, parsed0;
        try {
            parsed0 = JSON.parse(msg);
            channel = ctx.channels[parsed0.channel];
            if (!channel || channel.wc.members.indexOf(sender) === -1) { return; }
        } catch (e) {
            return void console.error(e, msg);
        }

        // Decrypt and parse its content...
        var decryptedMsg = channel.decrypt(parsed0.msg);
        if (!decryptedMsg) { return void console.error("Failed to decrypt message"); }
        var parsed = Util.tryParse(decryptedMsg);
        if (!parsed) { return void console.error(decryptedMsg); }

        // Keep only ID messages here
        if (parsed[0] !== Types.mapId && parsed[0] !== Types.mapIdAck) { return; }

        // check that the responding peer's encrypted netflux id matches
        // the sender field. This is to prevent replay attacks.
        if (parsed[2] !== sender || !parsed[1]) { return; }
        channel.mapId[sender] = parsed[1];
        ctx.emit('JOIN', {
            info: parsed[1],
            id: channel.id
        }, channel.clients);

        if (channel.readOnly) { return; } // Don't send your key if you're a reader
        if (parsed[0] !== Types.mapId) { return; } // Don't send your key if it's already an ACK

        // Answer with your own key
        var proxy = ctx.store.proxy;
        var myData = createData(proxy);
        delete myData.channel;
        var rMsg = [Types.mapIdAck, myData, channel.wc.myID];
        var rMsgStr = JSON.stringify(rMsg);
        var cryptMsg = channel.encrypt(rMsgStr);
        var data = {
            channel: channel.id,
            msg: cryptMsg
        };
        var network = ctx.store.network;
        network.sendto(sender, JSON.stringify(data));
    };

    var orderMessages = function (channel, new_messages) {
        var messages = channel.messages;
        // TODO improve performance, guarantee correct ordering
        new_messages.reverse().forEach(function (msg) {
            messages.unshift(msg);
        });
    };

    var removeFromFriendList = function (ctx, curvePublic, cb) {
        var proxy = ctx.store.proxy;
        var friends = proxy.friends;
        if (!friends) { return; }
        delete friends[curvePublic];
        Realtime.whenRealtimeSyncs(ctx.store.realtime, function () {
            ctx.updateMetadata();
            cb();
        });
    };

    var pushMsg = function (ctx, channel, cryptMsg) {
        var sig = cryptMsg.slice(0, 64);
        if (msgAlreadyKnown(channel, sig)) { return; }
        var msg = channel.decrypt(cryptMsg);

        var parsedMsg = JSON.parse(msg);
        var curvePublic;
        // Chat message
        if (parsedMsg[0] === Types.message) {
            var res = {
                type: parsedMsg[0],
                sig: sig,
                author: parsedMsg[1],
                time: parsedMsg[2],
                text: parsedMsg[3],
                channel: channel.id,
                name: parsedMsg[4] // Display name for multi-user rooms
            };

            channel.messages.push(res);
            if (channel.ready) { ctx.emit('MESSAGE', res, channel.clients); }

            return true;
        }
        var proxy = ctx.store.proxy;
        if (parsedMsg[0] === Types.unfriend) {
            curvePublic = parsedMsg[1];

            // If this a removal from our part in another tab, do nothing.
            // The channel is already closed in the proxy.on('remove') part
            if (curvePublic === proxy.curvePublic) { return; }

            removeFromFriendList(ctx, curvePublic, function () {
                channel.wc.leave(Types.unfriend);
                var network = ctx.store.network;
                if (channel.onReconnect) { network.off('reconnect', channel.onReconnect); }
                delete ctx.channels[channel.id];
                ctx.emit('UNFRIEND', {
                    curvePublic: curvePublic,
                    fromMe: false
                }, channel.clients);
            });
            return;
        }
    };

    var onDirectMessage = function (ctx, msg, sender) {
        var hk = ctx.store.network.historyKeeper;
        if (sender !== hk) { return void onIdMessage(ctx, msg, sender); }
        var parsed = JSON.parse(msg);

        if ((parsed.validateKey || parsed.owners) && parsed.channel) {
            // Metadata message
            return;
        }

        var channel;

        if (/HISTORY_RANGE/.test(parsed[0])) {
            var txid = parsed[1];
            var req = getRangeRequest(ctx, txid);
            var type = parsed[0];
            if (!req) { return; }
            channel = ctx.channels[req.chanId];
            if (!channel) { return; }

            if (!req.cb) { // This is the initial history for a pad chat
                if (type === 'HISTORY_RANGE') {
                    if (!Array.isArray(parsed[2])) { return; }
                    pushMsg(ctx, channel, parsed[2][4]);
                } else if (type === 'HISTORY_RANGE_END') {
                    onChannelReady(ctx, req.chanId);
                    return deleteRangeRequest(ctx, txid);
                }
                return;
            }

            // "More history": we need to store all the messages and cb all of them at once
            // to make sure we won't display them in the wrong order (we receive the oldest first...)
            if (type === 'HISTORY_RANGE') {
                req.messages.push(parsed[2]);
            } else if (type === 'HISTORY_RANGE_END') {
                // process all the messages (decrypt)
                var decrypted = req.messages.map(function (msg) {
                    if (msg[2] !== 'MSG') { return; }
                    try {
                        return {
                            d: JSON.parse(channel.decrypt(msg[4])),
                            sig: msg[4].slice(0, 64),
                        };
                    } catch (e) {
                        return void console.log('failed to decrypt');
                    }
                }).filter(function (decrypted) {
                    if (!decrypted || !decrypted.d || decrypted.d[0] !== Types.message) { return; }
                    if (msgAlreadyKnown(channel, decrypted.sig)) { return; }
                    return decrypted;
                }).map(function (O) {
                    return {
                        type: O.d[0],
                        sig: O.sig,
                        author: O.d[1],
                        time: O.d[2],
                        text: O.d[3],
                        channel: req.chanId,
                        name: O.d[4]
                    };
                });

                orderMessages(channel, decrypted);
                req.cb(decrypted);
                return deleteRangeRequest(ctx, txid);
            } else {
                console.log(parsed);
            }
            return;
        }

        if (parsed.channel && ctx.channels[parsed.channel]) {
            channel = ctx.channels[parsed.channel];
            // Error in initial history
            // History cleared while we're in the channel
            if (parsed.error === 'ECLEARED') {
                setChannelHead(ctx, parsed.channel, '', function () {});
                channel.messages = [];
                ctx.emit('CLEAR_CHANNEL', parsed.channel, channel.clients);
                return;
            }
            // History cleared while we were offline
            // ==> we asked for an invalid last known hash
            if (parsed.error && parsed.error === "EINVAL") {
                setChannelHead(ctx, parsed.channel, '', function () {
                    getChannelMessagesSince(ctx, channel, {}, {});
                });
                return;
            }

            // End of initial history
            if (parsed.state && parsed.state === 1 && parsed.channel) {
                return void onChannelReady(ctx, parsed.channel);
            }
        }

        // Initial history message
        channel = ctx.channels[parsed[3]];
        if (!channel) { return; }
        pushMsg(ctx, channel, parsed[4]);
    };

    var onMessage = function (ctx, msg, sender, chan) {
        var channel = ctx.channels[chan.id];
        if (!channel) { return; }
        pushMsg(ctx, channel, msg);
    };

    var onFriendRemoved = function (ctx, curvePublic, chanId) {
        var channel = ctx.channels[chanId];
        if (!channel) { return; }
        if (channel.wc) {
            channel.wc.leave(Types.unfriend);
        }
        var network = ctx.store.network;
        if (channel.onReconnect) { network.off('reconnect', channel.onReconnect); }
        delete ctx.channels[channel.id];
        ctx.emit('UNFRIEND', {
            curvePublic: curvePublic,
            fromMe: true
        }, ctx.friendsClients);
    };
    var removeFriend = function (ctx, curvePublic, _cb) {
        var cb = Util.once(_cb);
        if (typeof(cb) !== 'function') { return void console.error('NO_CALLBACK'); }
        var proxy = ctx.store.proxy;
        var data = getFriend(proxy, curvePublic);

        if (!data) {
            // friend is not valid
            console.error('friend is not valid');
            return void cb({error: 'INVALID_FRIEND'});
        }

        var channel = ctx.channels[data.channel];
        if (!channel) {
            return void cb({error: "NO_SUCH_CHANNEL"});
        }

        // Unfriend with mailbox
        if (ctx.store.mailbox && data.curvePublic && data.notifications) {
            Messaging.removeFriend(ctx.store, curvePublic, function (obj) {
                if (obj && obj.error) { return void cb({error:obj.error}); }
                cb(obj);
            });
            return;
        }

        // Unfriend with channel
        try {
            var msg = [Types.unfriend, proxy.curvePublic, +new Date()];
            var msgStr = JSON.stringify(msg);
            var cryptMsg = channel.encrypt(msgStr);
            channel.wc.bcast(cryptMsg).then(function () {}, function (err) {
                if (err) { return void cb({error:err}); }
                onFriendRemoved(ctx, curvePublic, data.channel);
                removeFromFriendList(ctx, curvePublic, function () {
                    cb();
                });
            });
        } catch (e) {
            cb({error: e});
        }
    };

    var openChannel = function (ctx, data) {
        var proxy = ctx.store.proxy;
        var network = ctx.store.network;
        var hk = network.historyKeeper;

        var keys = data.keys;
        var encryptor = data.encryptor || Curve.createEncryptor(keys);
        var channel = {
            id: data.channel,
            isFriendChat: data.isFriendChat,
            isPadChat: data.isPadChat,
            isTeamChat: data.isTeamChat,
            padChan: data.padChan, // Channel ID of the pad linked to this pad chat
            readOnly: data.readOnly,
            ready: false,
            onReady: Util.mkEvent(true),
            sending: false,
            messages: [],
            clients: data.clients || [],
            mapId: {},
        };

        if (data.onReady) { channel.onReady.reg(data.onReady); }

        channel.encrypt = function (msg) {
            if (channel.readOnly) { return; }
            return encryptor.encrypt(msg);
        };
        channel.decrypt = data.decrypt || function (msg) {
            return encryptor.decrypt(msg);
        };

        var onJoining = function (peer) {
            if (peer === hk) { return; }
            if (channel.readOnly) { return; }

            // Join event will be sent once we are able to ID this peer
            var myData = createData(proxy);
            delete myData.channel;
            var msg = [Types.mapId, myData, channel.wc.myID];
            var msgStr = JSON.stringify(msg);
            var cryptMsg = channel.encrypt(msgStr);
            var data = {
                channel: channel.id,
                msg: cryptMsg
            };
            network.sendto(peer, JSON.stringify(data));
        };

        var onLeaving = function (peer) {
            if (peer === hk) { return; }

            // update status
            var otherData = channel.mapId[peer];
            if (!otherData) { return; }

            // Make sure the leaving user is not connected with another netflux id
            if (channel.wc.members.some(function (nId) {
                return channel.mapId[nId]
                        && channel.mapId[nId].curvePublic === otherData.curvePublic;
            })) { return; }

            // Send the notification
            ctx.emit('LEAVE', {
                info: otherData,
                id: channel.id
            }, channel.clients);
        };

        var onOpen = function (chan) {
            channel.wc = chan;
            ctx.channels[data.channel] = channel;

            chan.on('message', function (msg, sender) {
                onMessage(ctx, msg, sender, chan);
            });

            chan.on('join', onJoining);
            chan.on('leave', onLeaving);

            getChannelMessagesSince(ctx, channel, data, keys);
        };
        network.join(data.channel).then(onOpen, function (err) {
            console.error(err);
        });
        channel.onReconnect = function () {
            if (channel && channel.stopped) { return; }
            if (!ctx.channels[data.channel]) { return; }

            network.join(data.channel).then(onOpen, function (err) {
                console.error(err);
            });
        };
        network.on('reconnect', channel.onReconnect);
    };

    var sendMessage = function (ctx, id, payload, cb) {
        var channel = ctx.channels[id];
        if (!channel) { return void cb({error: 'NO_CHANNEL'}); }
        if (channel.readOnly) { return void cb({error: 'FORBIDDEN'}); }

        var network = ctx.store.network;
        if (!network.webChannels.some(function (wc) {
            if (wc.id === channel.wc.id) { return true; }
        })) {
            return void cb({error: 'NO_SUCH_CHANNEL'});
        }

        var proxy = ctx.store.proxy;
        var msg = [Types.message, proxy.curvePublic, +new Date(), payload];
        if (!channel.isFriendChat) {
            var name = proxy[Constants.displayNameKey] ||
                        Messages.anonymous + '#' + proxy.uid.slice(0,5);
            msg.push(name);
        }
        var msgStr = JSON.stringify(msg);
        var cryptMsg = channel.encrypt(msgStr);

        channel.wc.bcast(cryptMsg).then(function () {
            pushMsg(ctx, channel, cryptMsg);
            cb();
        }, function (err) {
            cb({error: err});
        });
    };

    // Display green status if one member is not me
    var getStatus = function (ctx, chanId, cb) {
        var channel = ctx.channels[chanId];
        if (!channel) { return void cb('NO_SUCH_CHANNEL'); }
        var proxy = ctx.store.proxy;
        var online = channel.wc.members.some(function (nId) {
            if (nId === ctx.store.network.historyKeeper) { return; }
            var data = channel.mapId[nId] || undefined;
            if (!data) { return false; }
            return data.curvePublic !== proxy.curvePublic;
        });
        cb(online);
    };

    var getMyInfo = function (ctx, cb) {
        var proxy = ctx.store.proxy;
        cb({
            curvePublic: proxy.curvePublic,
            displayName: proxy[Constants.displayNameKey]
        });
    };

    var loadFriend = function (ctx, clientId, friend, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));

        var chanId = friend.channel;
        var channel = ctx.channels[chanId];
        if (channel) {
            // Fired instantly if already ready
            return void channel.onReady.reg(function () {
                if (channel.clients.indexOf(clientId) === -1) {
                    channel.clients.push(clientId);
                }
                cb();
            });
        }

        var proxy = ctx.store.proxy;
        var keys = Curve.deriveKeys(friend.curvePublic, proxy.curvePrivate);
        var data = {
            keys: keys,
            channel: friend.channel,
            lastKnownHash: friend.lastKnownHash,
            owners: [proxy.edPublic, friend.edPublic],
            isFriendChat: true,
            clients: clientId ? [clientId] : ctx.friendsClients,
            onReady: cb
        };
        openChannel(ctx, data);
    };

    var initFriends = function (ctx, clientId, cb) {
        var friends = getFriendList(ctx.store.proxy);

        nThen(function (waitFor) {
            // Load or get all friends channels
            Object.keys(friends).forEach(function (key) {
                if (key === 'me') { return; }
                var friend = clone(friends[key]);
                if (typeof(friend) !== 'object') { return; }
                if (!friend.channel) { return; }
                loadFriend(ctx, clientId, friend, waitFor());
            });
        }).nThen(function () {
            if (ctx.friendsClients.indexOf(clientId) === -1) {
                ctx.friendsClients.push(clientId);
            }
            cb();
        });
    };

    var getRooms = function (ctx, data, cb) {
        var proxy = ctx.store.proxy;

        // Get a single friend's room (on friend added)
        if (data && data.curvePublic) {
            var curvePublic = data.curvePublic;
            // We need to get data about a new friend's room
            var friend = getFriend(proxy, curvePublic);
            if (!friend) { return void cb({error: 'NO_SUCH_FRIEND'}); }
            var channel = ctx.channels[friend.channel];
            if (!channel) { return void cb({error: 'NO_SUCH_CHANNEL'}); }
            return void cb([{
                id: channel.id,
                isFriendChat: true,
                name: friend.displayName,
                lastKnownHash: friend.lastKnownHash,
                curvePublic: friend.curvePublic,
                messages: channel.messages
            }]);
        }

        // Pad chat room
        if (data && data.padChat) {
            var pCChannel = ctx.channels[data.padChat];
            if (!pCChannel) { return void cb({error: 'NO_SUCH_CHANNEL'}); }
            return void cb([{
                id: pCChannel.id,
                isPadChat: true,
                messages: pCChannel.messages
            }]);
        }

        // Team chat room
        if (data && data.teamChat) {
            var tCChannel = ctx.channels[data.teamChat];
            if (!tCChannel) { return void cb({error: 'NO_SUCH_CHANNEL'}); }
            return void cb([{
                id: tCChannel.id,
                isTeamChat: true,
                messages: tCChannel.messages
            }]);
        }

        // Existing friends...
        var rooms = Object.keys(ctx.channels).map(function (id) {
            var r = ctx.channels[id];
            var name, lastKnownHash, curvePublic;
            if (r.isFriendChat) {
                var friend = getFriendFromChannel(ctx, id);
                if (!friend) { return null; }
                name = friend.displayName;
                lastKnownHash = friend.lastKnownHash;
                curvePublic = friend.curvePublic;
            } else if (r.isPadChat) {
                return;
            } else if (r.isTeamChat) {
                return;
            } else {
                // TODO room get metadata (name) && lastKnownHash
            }
            return {
                id: r.id,
                isFriendChat: r.isFriendChat,
                name: name,
                lastKnownHash: lastKnownHash,
                curvePublic: curvePublic,
                messages: r.messages
            };
        }).filter(function (x) { return x; });
        cb(rooms);
    };

    // Gte the static userlist of a room (eveyrone who has accessed to the room)
    var getUserList = function (ctx, data, cb) {
        var room = ctx.channels[data.id];
        if (!room) { return void cb({error: 'NO_SUCH_CHANNEL'}); }
        if (room.isFriendChat) {
            var friend = getFriendFromChannel(ctx, data.id);
            if (!friend) { return void cb({error: 'NO_SUCH_FRIEND'}); }
            cb([friend]);
        } else {
            // TODO room userlist in rooms...
            // (this is the static userlist, not the netflux one)
            cb([]);
        }
    };

    var openPadChat = function (ctx, clientId, data, _cb) {
        var chanId = data.channel;

        var cb = Util.once(Util.mkAsync(function () {
            ctx.emit('PADCHAT_READY', chanId, [clientId]);
            _cb();
        }));

        var channel = ctx.channels[chanId];
        if (channel) {
            return void channel.onReady.reg(function () {
                if (channel.clients.indexOf(clientId) === -1) {
                    channel.clients.push(clientId);
                }
                cb();
            });
        }

        var secret = data.secret;
        if (secret.keys.cryptKey) {
            secret.keys.cryptKey = convertToUint8(secret.keys.cryptKey);
        }
        var encryptor = Crypto.createEncryptor(secret.keys);
        var vKey = (secret.keys && secret.keys.validateKey) || ctx.validateKeys[secret.channel];
        var chanData = {
            padChan: data.secret && data.secret.channel,
            readOnly: typeof(secret.keys) === "object" && !secret.keys.validateKey,
            encryptor: encryptor,
            channel: data.channel,
            isPadChat: true,
            decrypt: function (msg) {
                return encryptor.decrypt(msg, vKey);
            },
            clients: [clientId],
            onReady: cb
        };
        openChannel(ctx, chanData);
    };

    var openTeamChat = function (ctx, clientId, data, _cb) {
        var chatData = data;
        var chanId = chatData.channel;
        var secret = chatData.secret;

        if (!chanId || !secret) { return void _cb({error: 'EINVAL'}); }

        var cb = Util.once(Util.mkAsync(function () {
            ctx.emit('TEAMCHAT_READY', chanId, [clientId]);
            _cb({
                channel: chanId
            });
        }));

        var channel = ctx.channels[chanId];
        if (channel) {
            return void channel.onReady.reg(function () {
                if (channel.clients.indexOf(clientId) === -1) {
                    channel.clients.push(clientId);
                }
                cb();
            });
        }

        if (secret.keys.cryptKey) {
            secret.keys.cryptKey = convertToUint8(secret.keys.cryptKey);
        }
        var encryptor = Crypto.createEncryptor(secret.keys);
        var vKey = (secret.keys && secret.keys.validateKey) || chatData.validateKey;
        var chanData = {
            teamId: data.teamId,
            readOnly: typeof(secret.keys) === "object" && !secret.keys.validateKey,
            encryptor: encryptor,
            channel: chanId,
            isTeamChat: true,
            decrypt: function (msg) {
                return encryptor.decrypt(msg, vKey);
            },
            clients: [clientId],
            onReady: cb
        };
        openChannel(ctx, chanData);
    };

    var clearOwnedChannel = function (ctx, id, cb) {
        var channel = ctx.clients[id];
        if (!channel) { return void cb({error: 'NO_CHANNEL'}); }
        if (!ctx.store.rpc) { return void cb({error: 'RPC_NOT_READY'}); }
        ctx.store.rpc.clearOwnedChannel(id, function (err) {
            cb({error:err});
            if (!err) {
                channel.messages = [];
                ctx.emit('CLEAR_CHANNEL', id, channel.clients);
            }
        });
    };

    // Remove a client from all the team they're subscribed to
    var removeClient = function (ctx, cId) {
        var friendsIdx = ctx.friendsClients.indexOf(cId);
        if (friendsIdx !== -1) {
            ctx.friendsClients.splice(friendsIdx, 1);
        }
        Object.keys(ctx.channels).forEach(function (id) {
            var channel = ctx.channels[id];
            var clients = channel.clients;
            var idx = clients.indexOf(cId);
            if (idx !== -1) { clients.splice(idx, 1); }

            if (clients.length === 0) {
                if (channel.wc) { channel.wc.leave(); }
                var network = ctx.store.network;
                if (channel.onReconnect) { network.off('reconnect', channel.onReconnect); }
                channel.stopped = true;
                delete ctx.channels[id];
                return true;
            }

        });
    };

    var getAllClients = function (ctx) {
        var all = [];
        Array.prototype.push.apply(all, ctx.friendsClients);
        Object.keys(ctx.channels).forEach(function (id) {
            Array.prototype.push.apply(all, ctx.channels[id].clients);
        });
        return Util.deduplicateString(all);
    };

    Msg.init = function (cfg, waitFor, emit) {
        var messenger = {};
        var store = cfg.store;
        if (AppConfig.availablePadTypes.indexOf('contacts') === -1) { return; }
        if (!store.loggedIn || !store.proxy.edPublic) { return; }
        var ctx = {
            store: store,
            updateMetadata: cfg.updateMetadata,
            pinPads: cfg.pinPads,
            emit: emit,
            friendsClients: [],
            channels: {},
            validateKeys: {}
        };


        ctx.store.network.on('message', function(msg, sender) {
            onDirectMessage(ctx, msg, sender);
        });
        ctx.store.network.on('disconnect', function () {
            ctx.emit('DISCONNECT', null, getAllClients(ctx));
        });
        ctx.store.network.on('reconnect', function () {
            ctx.emit('RECONNECT', null, getAllClients(ctx));
        });

        messenger.onFriendUpdate = function (curve) {
            var friend = getFriend(store.proxy, curve);
            if (!friend || !friend.channel) { return; }
            var chan = ctx.channels[friend.channel];
            if (chan) {
                ctx.emit('UPDATE_DATA', {
                    info: clone(friend),
                    channel: friend.channel
                }, chan.clients);
            }
        };
        // Friend added in our contacts in the current worker
        messenger.onFriendAdded = function (friendData) {
            if (!ctx.friendsClients.length) { return; }

            var friend = getFriend(ctx.store.proxy, friendData.curvePublic);
            if (typeof(friend) !== 'object') { return; }
            var channel = friend.channel;
            if (!channel) { return; }

            loadFriend(ctx, null, friend, function () {
                emit('FRIEND', {
                    curvePublic: friend.curvePublic,
                }, ctx.friendsClients);
            });
        };
        messenger.onFriendRemoved = function (curvePublic, chanId) {
            onFriendRemoved(ctx, curvePublic, chanId);
        };

        messenger.storeValidateKey = function (chan, key) {
            ctx.validateKeys[chan] = key;
        };
        messenger.leavePad = function (padChan) {
            // Leave chat and prevent reconnect when we leave a pad
            delete ctx.validateKeys[padChan];
            Object.keys(ctx.channels).some(function (chatChan) {
                var channel = ctx.channels[chatChan];
                if (channel.padChan !== padChan) { return; }
                if (channel.wc) { channel.wc.leave(); }
                var network = ctx.store.network;
                if (channel.onReconnect) { network.off('reconnect', channel.onReconnect); }
                channel.stopped = true;
                delete ctx.channels[chatChan];
                return true;
            });
        };

        messenger.openTeamChat = function (data, cId, cb) {
            openTeamChat(ctx, cId, data, cb);
        };

        messenger.removeClient = function (clientId) {
            removeClient(ctx, clientId);
        };
        messenger.execCommand = function (clientId, obj, cb) {
            var cmd = obj.cmd;
            var data = obj.data;
            if (cmd === 'INIT_FRIENDS') {
                return void initFriends(ctx, clientId, cb);
            }
            if (cmd === 'GET_ROOMS') {
                return void getRooms(ctx, data, cb);
            }
            if (cmd === 'GET_USERLIST') {
                return void getUserList(ctx, data, cb);
            }
            if (cmd === 'OPEN_TEAM_CHAT') {
                return void openTeamChat(ctx, clientId, data, cb);
            }
            if (cmd === 'OPEN_PAD_CHAT') {
                return void openPadChat(ctx, clientId, data, cb);
            }
            if (cmd === 'GET_MY_INFO') {
                return void getMyInfo(ctx, cb);
            }
            if (cmd === 'REMOVE_FRIEND') {
                return void removeFriend(ctx, data, cb);
            }
            if (cmd === 'GET_STATUS') {
                return void getStatus(ctx, data, cb);
            }
            if (cmd === 'GET_MORE_HISTORY') {
                return void getMoreHistory(ctx, data.id, data.sig, data.count, cb);
            }
            if (cmd === 'SEND_MESSAGE') {
                return void sendMessage(ctx, data.id, data.content, cb);
            }
            if (cmd === 'SET_CHANNEL_HEAD') {
                return void setChannelHead(ctx, data.id, data.sig, cb);
            }
            if (cmd === 'CLEAR_OWNED_CHANNEL') {
                return void clearOwnedChannel(ctx, data, cb);
            }
        };

        return messenger;
    };

    return Msg;
});
