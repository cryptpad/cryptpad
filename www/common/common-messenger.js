define([
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/curve.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/common/common-realtime.js',
    '/common/common-constants.js',

    '/bower_components/nthen/index.js',
], function (Crypto, Curve, Hash, Util, Realtime, Constants, nThen) {
    'use strict';
    var Msg = {
        inputs: [],
    };

    var Types = {
        message: 'MSG',
        update: 'UPDATE',
        unfriend: 'UNFRIEND',
        mapId: 'MAP_ID',
        mapIdAck: 'MAP_ID_ACK'
    };

    var clone = function (o) {
        return JSON.parse(JSON.stringify(o));
    };

    // TODO
    // - mute a channel (hide notifications or don't open it?)
    var createData = Msg.createData = function (proxy, hash) {
        return {
            channel: hash || Hash.createChannelId(),
            displayName: proxy[Constants.displayNameKey],
            profile: proxy.profile && proxy.profile.view,
            edPublic: proxy.edPublic,
            curvePublic: proxy.curvePublic,
            avatar: proxy.profile && proxy.profile.avatar
        };
    };

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

    Msg.messenger = function (store) {
        var messenger = {
            handlers: {
                message: [],
                join: [],
                leave: [],
                update: [],
                friend: [],
                unfriend: [],
                event: []
            },
            range_requests: {},
        };

        var eachHandler = function (type, g) {
            messenger.handlers[type].forEach(g);
        };

        messenger.on = function (type, f) {
            var stack = messenger.handlers[type];
            if (!Array.isArray(stack)) {
                return void console.error('unsupported message type');
            }
            if (typeof(f) !== 'function') {
                return void console.error('expected function');
            }
            stack.push(f);
        };

        var channels = messenger.channels = {};

        var joining = {};

        // declare common variables
        var network = store.network;
        var proxy = store.proxy;
        var realtime = store.realtime;
        Msg.hk = network.historyKeeper;
        var friends = getFriendList(proxy);

        var getChannel = function (chanId) {
            return channels[chanId];
        };

        var getFriendFromChannel = function (id) {
            var friend;
            for (var k in friends) {
                if (friends[k].channel === id) {
                    friend = friends[k];
                    break;
                }
            }
            return friend;
        };

        var initRangeRequest = function (txid, chanId, cb) {
            messenger.range_requests[txid] = {
                messages: [],
                cb: cb,
                chanId: chanId,
            };
        };

        var getRangeRequest = function (txid) {
            return messenger.range_requests[txid];
        };

        var deleteRangeRequest = function (txid) {
            delete messenger.range_requests[txid];
        };

        messenger.getMoreHistory = function (chanId, hash, count, cb) {
            if (typeof(cb) !== 'function') { return; }

            if (typeof(hash) !== 'string') {
                // Channel is empty!
                return void cb(void 0, []);
            }

            var chan = getChannel(chanId);
            if (typeof(chan) === 'undefined') {
                console.error("chan is undefined. we're going to have a problem here");
                return;
            }

            var txid = Util.uid();
            initRangeRequest(txid, chanId, cb);
            var msg = [ 'GET_HISTORY_RANGE', chan.id, {
                    from: hash,
                    count: count,
                    txid: txid,
                }
            ];

            network.sendto(network.historyKeeper, JSON.stringify(msg)).then(function () {
            }, function (err) {
                throw new Error(err);
            });
        };

        /*var getCurveForChannel = function (id) {
            var channel = channels[id];
            if (!channel) { return; }
            return channel.curve;
        };*/

        /*messenger.getChannelHead = function (id, cb) {
            var channel = getChannel(id);
            if (channel.isFriendChat) {
                var friend;
                for (var k in friends) {
                    if (friends[k].channel === id) {
                        friend = friends[k];
                        break;
                    }
                }
                if (!friend) { return void cb('NO_SUCH_FRIEND'); }
                cb(void 0, friend.lastKnownHash);
            } else {
                // TODO room
                cb('NOT_IMPLEMENTED');
            }
        };*/

        messenger.setChannelHead = function (id, hash, cb) {
            var channel = getChannel(id);
            if (channel.isFriendChat) {
                var friend = getFriendFromChannel(id);
                if (!friend) { return void cb('NO_SUCH_FRIEND'); }
                friend.lastKnownHash = hash;
            } else if (channel.isPadChat) {
                // Nothing to do
            } else {
                // TODO room
                return void cb('NOT_IMPLEMENTED');
            }
            cb();
        };

        // Make sure the data we have about our friends are up-to-date when we see them online
        var checkFriendData = function (curve, data) {
            if (curve === proxy.curvePublic) { return; }
            var friend = getFriend(proxy, curve);
            if (!friend) { return; }
            var types = [];
            Object.keys(data).forEach(function (k) {
                if (friend[k] !== data[k]) {
                    types.push(k);
                    friend[k] = data[k];
                }
            });

            eachHandler('update', function (f) {
                f(clone(data), types);
            });
        };

        // Id message allows us to map a netfluxId with a public curve key
        var onIdMessage = function (msg, sender) {
            var channel, parsed0;

            try {
                parsed0 = JSON.parse(msg);
                channel = channels[parsed0.channel];
                if (!channel) { return; }
                if (channel.userList.indexOf(sender) === -1) { return; }
            } catch (e) {
                console.log(msg);
                console.error(e);
                // Not an ID message
                return;
            }

            var decryptedMsg = channel.encryptor.decrypt(parsed0.msg);

            if (decryptedMsg === null) {
                return void console.error("Failed to decrypt message");
            }

            if (!decryptedMsg) {
                console.error('decrypted message was falsey but not null');
                return;
            }

            var parsed;
            try {
                parsed = JSON.parse(decryptedMsg);
            } catch (e) {
                console.error(decryptedMsg);
                return;
            }
            if (parsed[0] !== Types.mapId && parsed[0] !== Types.mapIdAck) { return; }

            // check that the responding peer's encrypted netflux id matches
            // the sender field. This is to prevent replay attacks.
            if (parsed[2] !== sender || !parsed[1]) { return; }
            channel.mapId[sender] = parsed[1];
            checkFriendData(parsed[1].curvePublic, parsed[1]);
            eachHandler('join', function (f) {
                f(parsed[1], channel.id);
            });

            if (parsed[0] !== Types.mapId) { return; } // Don't send your key if it's already an ACK
            // Answer with your own key
            var myData = createData(proxy);
            delete myData.channel;
            var rMsg = [Types.mapIdAck, myData, channel.wc.myID];
            var rMsgStr = JSON.stringify(rMsg);
            var cryptMsg = channel.encryptor.encrypt(rMsgStr);
            var data = {
                channel: channel.id,
                msg: cryptMsg
            };
            network.sendto(sender, JSON.stringify(data));
        };

        var orderMessages = function (channel, new_messages) {
            var messages = channel.messages;

            // TODO improve performance, guarantee correct ordering
            new_messages.reverse().forEach(function (msg) {
                messages.unshift(msg);
            });
        };

        var removeFromFriendList = function (curvePublic, cb) {
            if (!proxy.friends) { return; }
            var friends = proxy.friends;
            delete friends[curvePublic];
            Realtime.whenRealtimeSyncs(realtime, cb);
        };

        var pushMsg = function (channel, cryptMsg) {
            var sig = cryptMsg.slice(0, 64);
            if (msgAlreadyKnown(channel, sig)) { return; }
            var msg = channel.encryptor.decrypt(cryptMsg);

            var parsedMsg = JSON.parse(msg);
            var curvePublic;
            if (parsedMsg[0] === Types.message) {
                // TODO validate messages here
                var res = {
                    type: parsedMsg[0],
                    sig: sig,
                    author: parsedMsg[1],
                    time: parsedMsg[2],
                    text: parsedMsg[3],
                    channel: channel.id,
                    name: parsedMsg[4] // Display name for multi-user rooms
                    // this makes debugging a whole lot easier
                    //curve: getCurveForChannel(channel.id),
                };

                channel.messages.push(res);
                if (!joining[channel.id]) {
                    // Channel is ready
                    eachHandler('message', function (f) {
                        f(res);
                    });
                }

                return true;
            }
            if (parsedMsg[0] === Types.update) {
                checkFriendData(parsedMsg[1], parsedMsg[3]);
                return;
            }
            if (parsedMsg[0] === Types.unfriend) {
                curvePublic = parsedMsg[1];

                // If this a removal from our part by in another tab, do nothing.
                // The channel is already closed in the proxy.on('remove') part
                if (curvePublic === proxy.curvePublic) { return; }

                removeFromFriendList(curvePublic, function () {
                    channel.wc.leave(Types.unfriend);
                    delete channels[channel.id];
                    eachHandler('unfriend', function (f) {
                        f(curvePublic, false);
                    });
                });
                return;
            }
        };

        /*  Broadcast a display name, profile, or avatar change to all contacts
        */

        // TODO send event...
        messenger.updateMyData = function () {
            var friends = getFriendList(proxy);
            var mySyncData = friends.me;
            var myData = createData(proxy);
            if (!mySyncData || mySyncData.displayName !== myData.displayName
                 || mySyncData.profile !== myData.profile
                 || mySyncData.avatar !== myData.avatar) {
                delete myData.channel;
                Object.keys(channels).forEach(function (chan) {
                    var channel = channels[chan];

                    if (!channel) {
                        return void console.error('NO_SUCH_CHANNEL');
                    }


                    var msg = [Types.update, myData.curvePublic, +new Date(), myData];
                    var msgStr = JSON.stringify(msg);
                    var cryptMsg = channel.encryptor.encrypt(msgStr);
                    channel.wc.bcast(cryptMsg).then(function () {
                        // TODO send event
                        //channel.refresh();
                    }, function (err) {
                        console.error(err);
                    });
                });
                eachHandler('update', function (f) {
                    f(myData, ['displayName', 'profile', 'avatar']);
                });
                friends.me = myData;
            }
        };

        var onChannelReady = function (chanId) {
            var cb = joining[chanId];
            if (typeof(cb) !== 'function') {
                return void console.error('channel ready without callback');
            }
            delete joining[chanId];
            return cb();
        };

        var onDirectMessage = function (msg, sender) {
            if (sender !== Msg.hk) { return void onIdMessage(msg, sender); }
            var parsed = JSON.parse(msg);

            if (/HISTORY_RANGE/.test(parsed[0])) {
                //console.log(parsed);
                var txid = parsed[1];
                var req = getRangeRequest(txid);
                var type = parsed[0];
                if (!req) {
                    return void console.error("received response to unknown request");
                }

                if (!req.cb) {
                    // This is the initial history for a pad chat
                    if (type === 'HISTORY_RANGE') {
                        if (!getChannel(req.chanId)) { return; }
                        if (!Array.isArray(parsed[2])) { return; }
                        pushMsg(getChannel(req.chanId), parsed[2][4]);
                    } else if (type === 'HISTORY_RANGE_END') {
                        if (!getChannel(req.chanId)) { return; }
                        getChannel(req.chanId).ready = true;
                        onChannelReady(req.chanId);
                        return;
                    }
                    return;
                }

                if (type === 'HISTORY_RANGE') {
                    req.messages.push(parsed[2]);
                } else if (type === 'HISTORY_RANGE_END') {
                    // process all the messages (decrypt)
                    var channel = getChannel(req.chanId);

                    var decrypted = req.messages.map(function (msg) {
                        if (msg[2] !== 'MSG') { return; }
                        try {
                            return {
                                d: JSON.parse(channel.encryptor.decrypt(msg[4])),
                                sig: msg[4].slice(0, 64),
                            };
                        } catch (e) {
                            console.log('failed to decrypt');
                            return null;
                        }
                    }).filter(function (decrypted) {
                        if (!decrypted.d || decrypted.d[0] !== Types.message) { return; }
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
                    req.cb(void 0, decrypted);
                    return deleteRangeRequest(txid);
                } else {
                    console.log(parsed);
                }
                return;
            }

            if ((parsed.validateKey || parsed.owners) && parsed.channel) {
                return;
            }
            // End of initial history
            if (parsed.state && parsed.state === 1 && parsed.channel) {
                if (channels[parsed.channel]) {
                    // parsed.channel is Ready
                    // channel[parsed.channel].ready();
                    channels[parsed.channel].ready = true;
                    onChannelReady(parsed.channel);
                }
                return;
            }
            // Initial history message
            var chan = parsed[3];
            if (!chan || !channels[chan]) { return; }
            pushMsg(channels[chan], parsed[4]);
        };

        var onMessage = function (msg, sender, chan) {
            if (!channels[chan.id]) { return; }

            var isMessage = pushMsg(channels[chan.id], msg);
            if (isMessage) {
                if (channels[chan.id].wc.myID !== sender) {
                    // Don't notify for your own messages
                    //channels[chan.id].notify();
                }
                //channels[chan.id].refresh();
                // TODO emit message event
            }
        };

        // listen for messages...
        network.on('message', function(msg, sender) {
            onDirectMessage(msg, sender);
        });

        messenger.removeFriend = function (curvePublic, cb) {
            if (typeof(cb) !== 'function') { throw new Error('NO_CALLBACK'); }
            var data = getFriend(proxy, curvePublic);

            if (!data) {
                // friend is not valid
                console.error('friend is not valid');
                return void cb('INVALID_FRIEND');
            }

            var channel = channels[data.channel];
            if (!channel) {
                return void cb("NO_SUCH_CHANNEL");
            }

            if (!network.webChannels.some(function (wc) {
                return wc.id === channel.id;
            })) {
                console.error('bad channel: ', curvePublic);
            }

            var msg = [Types.unfriend, proxy.curvePublic, +new Date()];
            var msgStr = JSON.stringify(msg);
            var cryptMsg = channel.encryptor.encrypt(msgStr);

            try {
                channel.wc.bcast(cryptMsg).then(function () {
                    removeFromFriendList(curvePublic, function () {
                        delete channels[channel.id];
                        eachHandler('unfriend', function (f) {
                            f(curvePublic, true);
                        });
                        cb();
                    });
                }, function (err) {
                    console.error(err);
                    cb(err);
                });
            } catch (e) {
                cb(e);
            }
        };

        var getChannelMessagesSince = function (chan, data, keys) {
            console.log('Fetching [%s] messages since [%s]', chan.id, data.lastKnownHash || '');

            if (chan.isPadChat) {
                // We need to use GET_HISTORY_RANGE to make sure we won't get the full history
                var txid = Util.uid();
                initRangeRequest(txid, chan.id, undefined);
                var msg0 = ['GET_HISTORY_RANGE', chan.id, {
                        //from: hash,
                        count: 10,
                        txid: txid,
                    }
                ];
                network.sendto(network.historyKeeper, JSON.stringify(msg0)).then(function () {
                }, function (err) {
                    throw new Error(err);
                });
                return;
            }

            var cfg = {
                validateKey: keys ? keys.validateKey : undefined,
                owners: [proxy.edPublic, data.edPublic],
                lastKnownHash: data.lastKnownHash
            };
            var msg = ['GET_HISTORY', chan.id, cfg];
            network.sendto(network.historyKeeper, JSON.stringify(msg))
              .then(function () {}, function (err) {
                throw new Error(err);
            });
        };

        var openChannel = function (data) {
            var keys = data.keys;
            var encryptor = data.encryptor || Curve.createEncryptor(keys);
            network.join(data.channel).then(function (chan) {
                var channel = channels[data.channel] = {
                    id: data.channel,
                    isFriendChat: data.isFriendChat,
                    isPadChat: data.isPadChat,
                    sending: false,
                    encryptor: encryptor,
                    messages: [],
                    wc: chan,
                    userList: [],
                    mapId: {},
                };
                chan.on('message', function (msg, sender) {
                    onMessage(msg, sender, chan);
                });

                var onJoining = function (peer) {
                    if (peer === Msg.hk) { return; }
                    if (channel.userList.indexOf(peer) !== -1) { return; }
                    channel.userList.push(peer);

                    // Join event will be sent once we are able to ID this peer
                    var myData = createData(proxy);
                    delete myData.channel;
                    var msg = [Types.mapId, myData, chan.myID];
                    var msgStr = JSON.stringify(msg);
                    var cryptMsg = channel.encryptor.encrypt(msgStr);
                    var data = {
                        channel: channel.id,
                        msg: cryptMsg
                    };
                    network.sendto(peer, JSON.stringify(data));
                };
                chan.members.forEach(function (peer) {
                    if (peer === Msg.hk) { return; }
                    if (channel.userList.indexOf(peer) !== -1) { return; }
                    channel.userList.push(peer);
                });
                chan.on('join', onJoining);
                chan.on('leave', function (peer) {
                    var i = channel.userList.indexOf(peer);
                    while (i !== -1) {
                        channel.userList.splice(i, 1);
                        i = channel.userList.indexOf(peer);
                    }
                    // update status
                    var otherData = channel.mapId[peer];
                    if (!otherData) { return; }

                    // Make sure the leaving user is not connected with another netflux id
                    if (channel.userList.some(function (nId) {
                        return channel.mapId[nId]
                                && channel.mapId[nId].curvePublic === otherData.curvePublic;
                    })) { return; }

                    // Send the notification
                    eachHandler('leave', function (f) {
                        f(otherData, channel.id);
                    });
                });

                // FIXME don't subscribe to the channel implicitly
                getChannelMessagesSince(channel, data, keys);
            }, function (err) {
                console.error(err);
            });
        };

        messenger.getFriendList = function (cb) {
            var friends = proxy.friends;
            if (!friends) { return void cb(void 0, []); }

            cb(void 0, Object.keys(proxy.friends).filter(function (k) {
                return k !== 'me';
            }));
        };

        /*messenger.openFriendChannel = function (curvePublic, cb) {
            if (typeof(curvePublic) !== 'string') { return void cb('INVALID_ID'); }
            if (typeof(cb) !== 'function') { throw new Error('expected callback'); }

            var friend = clone(friends[curvePublic]);
            if (typeof(friend) !== 'object') {
                return void cb('NO_FRIEND_DATA');
            }
            var channel = friend.channel;
            if (!channel) { return void cb('E_NO_CHANNEL'); }
            joining[channel] = cb;
            openFriendChannel(friend, curvePublic);
        };*/

        messenger.sendMessage = function (id, payload, cb) {
            var channel = getChannel(id);
            if (!channel) { return void cb('NO_CHANNEL'); }
            if (!network.webChannels.some(function (wc) {
                if (wc.id === channel.wc.id) { return true; }
            })) {
                return void cb('NO_SUCH_CHANNEL');
            }

            var msg = [Types.message, proxy.curvePublic, +new Date(), payload];
            if (!channel.isFriendChat) {
                msg.push(proxy[Constants.displayNameKey]);
            }
            var msgStr = JSON.stringify(msg);
            var cryptMsg = channel.encryptor.encrypt(msgStr);

            channel.wc.bcast(cryptMsg).then(function () {
                pushMsg(channel, cryptMsg);
                cb();
            }, function (err) {
                cb(err);
            });
        };

        messenger.getStatus = function (chanId, cb) {
            // Display green status if one member is not me
            var channel = getChannel(chanId);
            if (!channel) { return void cb('NO_SUCH_CHANNEL'); }
            var online = channel.userList.some(function (nId) {
                var data = channel.mapId[nId] || undefined;
                if (!data) { return false; }
                return data.curvePublic !== proxy.curvePublic;
            });
            cb(void 0, online);
        };

        messenger.getFriendInfo = function (channel, cb) {
            setTimeout(function () {
                var friend;
                for (var k in friends) {
                    if (friends[k].channel === channel) {
                        friend = friends[k];
                        break;
                    }
                }
                if (!friend) { return void cb('NO_SUCH_FRIEND'); }
                // this clone will be redundant when ui uses postmessage
                cb(void 0, clone(friend));
            });
        };

        messenger.getMyInfo = function (cb) {
            cb(void 0, {
                curvePublic: proxy.curvePublic,
                displayName: proxy[Constants.displayNameKey]
            });
        };

        var loadFriend = function (friend, cb) {
            var channel = friend.channel;
            if (getChannel(channel)) { return void cb(); }

            joining[channel] = cb;
            var keys = Curve.deriveKeys(friend.curvePublic, proxy.curvePrivate);
            var data = {
                keys: keys,
                channel: friend.channel,
                lastKnownHash: friend.lastKnownHash,
                owners: [proxy.edPublic, friend.edPublic],
                isFriendChat: true
            };
            openChannel(data);
        };

        // Detect friends changes made in another worker
        proxy.on('change', ['friends'], function (o, n, p) {
            var curvePublic;
            if (o === undefined) {
                // new friend added
                curvePublic = p.slice(-1)[0];

                // Load channel
                var friend = friends[curvePublic];
                if (typeof(friend) !== 'object') { return; }
                var channel = friend.channel;
                if (!channel) { return; }
                loadFriend(friend, function () {
                    eachHandler('friend', function (f) {
                        f(curvePublic);
                    });
                });
                return;
            }

            if (typeof(n) === 'undefined') {
                // Handled by .on('remove')
                return;
            }
        }).on('remove', ['friends'], function (o, p) {
            var curvePublic = p[1];
            if (!curvePublic) { return; }
            if (p[2] !== 'channel') { return; }
            var channel = channels[o];
            channel.wc.leave(Types.unfriend);
            delete channels[channel.id];
            eachHandler('unfriend', function (f) {
                f(curvePublic, true);
            });
        });

        // Friend added in our contacts in the current worker
        messenger.onFriendAdded = function (friendData) {
            var friend = friends[friendData.curvePublic];
            if (typeof(friend) !== 'object') { return; }
            var channel = friend.channel;
            if (!channel) { return; }
            loadFriend(friend, function () {
                eachHandler('friend', function (f) {
                    f(friend.curvePublic);
                });
            });
        };

        var ready = false;
        var init = function () {
            var friends = getFriendList(proxy);

            nThen(function (waitFor) {
                Object.keys(friends).forEach(function (key) {
                    if (key === 'me') { return; }
                    var friend = clone(friends[key]);
                    if (typeof(friend) !== 'object') { return; }
                    var channel = friend.channel;
                    if (!channel) { return; }
                    loadFriend(friend, waitFor());
                });
                // TODO load rooms
            }).nThen(function () {
                ready = true;
                eachHandler('event', function (f) {
                    f('READY');
                });
            });
        };
        init();

        var getRooms = function (data, cb) {
            if (data && data.curvePublic) {
                var curvePublic = data.curvePublic;
                // We need to get data about a new friend's room
                var friend = getFriend(proxy, curvePublic);
                if (!friend) { return void cb({error: 'NO_SUCH_FRIEND'}); }
                var channel = getChannel(friend.channel);
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

            if (data && data.padChat) {
                var pCChannel = getChannel(data.padChat);
                if (!pCChannel) { return void cb({error: 'NO_SUCH_CHANNEL'}); }
                return void cb([{
                    id: pCChannel.id,
                    isPadChat: true,
                    messages: pCChannel.messages
                }]);
            }

            var rooms = Object.keys(channels).map(function (id) {
                var r = getChannel(id);
                var name, lastKnownHash, curvePublic;
                if (r.isFriendChat) {
                    var friend = getFriendFromChannel(id);
                    if (!friend) { return null; }
                    name = friend.displayName;
                    lastKnownHash = friend.lastKnownHash;
                    curvePublic = friend.curvePublic;
                } else if (r.isPadChat) {
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

        var getUserList = function (data, cb) {
            var room = getChannel(data.id);
            if (!room) { return void cb({error: 'NO_SUCH_CHANNEL'}); }
            if (room.isFriendChat) {
                var friend = getFriendFromChannel(data.id);
                if (!friend) { return void cb({error: 'NO_SUCH_FRIEND'}); }
                cb([friend]);
            } else {
                // TODO room userlist in rooms...
                // (this is the static userlist, not the netflux one)
                cb([]);
            }
        };

        var openPadChat = function (data, cb) {
            var channel = data.channel;
            if (getChannel(channel)) {
                eachHandler('event', function (f) {
                    f('PADCHAT_READY', channel);
                });
                return void cb();
            }
            var keys = data.secret && data.secret.keys;
            var cryptKey = keys.viewKeyStr ? Crypto.b64AddSlashes(keys.viewKeyStr) : data.secret.key;
            var encryptor = Crypto.createEncryptor(cryptKey);
            var chanData = {
                encryptor: encryptor,
                channel: data.channel,
                isPadChat: true,
                //lastKnownHash: friend.lastKnownHash,
                //owners: [proxy.edPublic, friend.edPublic],
                //isFriendChat: true
            };
            openChannel(chanData);
            joining[channel] = function () {
                eachHandler('event', function (f) {
                    f('PADCHAT_READY', channel);
                });
            };
            cb();
        };

        messenger.execCommand = function (obj, cb) {
            var cmd = obj.cmd;
            var data = obj.data;
            if (cmd === 'IS_READY') {
                return void cb(ready);
            }
            if (cmd === 'GET_ROOMS') {
                return void getRooms(data, cb);
            }
            if (cmd === 'GET_USERLIST') {
                return void getUserList(data, cb);
            }
            if (cmd === 'OPEN_PAD_CHAT') {
                return void openPadChat(data, cb);
            }
        };

        Object.freeze(messenger);

        return messenger;
    };

    return Msg;
});
