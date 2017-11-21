define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/curve.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/common/common-realtime.js',
], function ($, Crypto, Curve, Hash, Util, Realtime) {
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
            displayName: proxy['cryptpad.username'],
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
            return message[0] === sig;
        });
    };

    Msg.messenger = function (common) {
        var messenger = {
            handlers: {
                message: [],
                join: [],
                leave: [],
                update: [],
                friend: [],
                unfriend: [],
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
        var network = common.getNetwork();
        var proxy = common.getProxy();
        var realtime = common.getRealtime();
        Msg.hk = network.historyKeeper;
        var friends = getFriendList(proxy);

        var getChannel = function (curvePublic) {
            var friend = friends[curvePublic];
            if (!friend) { return; }
            var chanId = friend.channel;
            if (!chanId) { return; }
            return channels[chanId];
        };

        var initRangeRequest = function (txid, curvePublic, sig, cb) {
            messenger.range_requests[txid] = {
                messages: [],
                cb: cb,
                curvePublic: curvePublic,
                sig: sig,
            };
        };

        var getRangeRequest = function (txid) {
            return messenger.range_requests[txid];
        };

        var deleteRangeRequest = function (txid) {
            delete messenger.range_requests[txid];
        };

        messenger.getMoreHistory = function (curvePublic, hash, count, cb) {
            if (typeof(cb) !== 'function') { return; }

            if (typeof(hash) !== 'string') {
                // FIXME hash is not necessarily defined.
                // What does this mean?
                console.error("not sure what to do here");
                return;
            }

            var chan = getChannel(curvePublic);
            if (typeof(chan) === 'undefined') {
                console.error("chan is undefined. we're going to have a problem here");
                return;
            }

            var txid = Util.uid();
            initRangeRequest(txid, curvePublic, hash, cb);
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

        var getCurveForChannel = function (id) {
            var channel = channels[id];
            if (!channel) { return; }
            return channel.curve;
        };

        messenger.getChannelHead = function (curvePublic, cb) {
            var friend = friends[curvePublic];
            if (!friend) { return void cb('NO_SUCH_FRIEND'); }
            cb(void 0, friend.lastKnownHash);
        };

        messenger.setChannelHead = function (curvePublic, hash, cb) {
            var friend = friends[curvePublic];
            if (!friend) { return void cb('NO_SUCH_FRIEND'); }
            friend.lastKnownHash = hash;
            cb();
        };

        // Id message allows us to map a netfluxId with a public curve key
        var onIdMessage = function (msg, sender) {
            var channel;
            var isId = Object.keys(channels).some(function (chanId) {
                if (channels[chanId].userList.indexOf(sender) !== -1) {
                    channel = channels[chanId];
                    return true;
                }
            });

            if (!isId) { return; }

            var decryptedMsg = channel.encryptor.decrypt(msg);

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
            eachHandler('join', function (f) {
                f(parsed[1], channel.id);
            });

            if (parsed[0] !== Types.mapId) { return; } // Don't send your key if it's already an ACK
            // Answer with your own key
            var rMsg = [Types.mapIdAck, proxy.curvePublic, channel.wc.myID];
            var rMsgStr = JSON.stringify(rMsg);
            var cryptMsg = channel.encryptor.encrypt(rMsgStr);
            network.sendto(sender, cryptMsg);
        };

        var orderMessages = function (curvePublic, new_messages /*, sig */) {
            var channel = getChannel(curvePublic);
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
            var msg = channel.encryptor.decrypt(cryptMsg);
            var sig = cryptMsg.slice(0, 64);
            if (msgAlreadyKnown(channel, sig)) { return; }

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
                    // this makes debugging a whole lot easier
                    curve: getCurveForChannel(channel.id),
                };

                channel.messages.push(res);
                eachHandler('message', function (f) {
                    f(res);
                });

                return true;
            }
            if (parsedMsg[0] === Types.update) {
                if (parsedMsg[1] === proxy.curvePublic) { return; }
                curvePublic = parsedMsg[1];
                var newdata = parsedMsg[3];
                var data = getFriend(proxy, parsedMsg[1]);
                var types = [];
                Object.keys(newdata).forEach(function (k) {
                    if (data[k] !== newdata[k]) {
                        types.push(k);
                        data[k] = newdata[k];
                    }
                });

                eachHandler('update', function (f) {
                    f(clone(newdata), curvePublic);
                });
                return;
            }
            if (parsedMsg[0] === Types.unfriend) {
                curvePublic = parsedMsg[1];
                delete friends[curvePublic];

                removeFromFriendList(parsedMsg[1], function () {
                    channel.wc.leave(Types.unfriend);
                    eachHandler('unfriend', function (f) {
                        f(curvePublic);
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
                    f(myData, myData.curvePublic);
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

                if (type === 'HISTORY_RANGE') {
                    req.messages.push(parsed[2]);
                } else if (type === 'HISTORY_RANGE_END') {
                    // process all the messages (decrypt)
                    var curvePublic = req.curvePublic;
                    var channel = getChannel(curvePublic);

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
                        return decrypted;
                    }).map(function (O) {
                        return {
                            type: O.d[0],
                            sig: O.sig,
                            author: O.d[1],
                            time: O.d[2],
                            text: O.d[3],
                            curve: curvePublic,
                        };
                    });

                    orderMessages(curvePublic, decrypted, req.sig);
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
            if (parsed.state && parsed.state === 1 && parsed.channel) {
                if (channels[parsed.channel]) {
                    // parsed.channel is Ready
                    // channel[parsed.channel].ready();
                    channels[parsed.channel].ready = true;
                    onChannelReady(parsed.channel);
                    var updateTypes = channels[parsed.channel].updateOnReady;
                    if (updateTypes) {

                        //channels[parsed.channel].updateUI(updateTypes);
                    }
                }
                return;
            }
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
                return;
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

            // TODO emit remove_friend event?
            try {
                channel.wc.bcast(cryptMsg).then(function () {
                    delete friends[curvePublic];
                    delete channels[curvePublic];
                    Realtime.whenRealtimeSyncs(realtime, function () {
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
            console.log('Fetching [%s] messages since [%s]', data.curvePublic, data.lastKnownHash || '');
            var cfg = {
                validateKey: keys.validateKey,
                owners: [proxy.edPublic, data.edPublic],
                lastKnownHash: data.lastKnownHash
            };
            var msg = ['GET_HISTORY', chan.id, cfg];
            network.sendto(network.historyKeeper, JSON.stringify(msg))
              .then($.noop, function (err) {
                throw new Error(err);
            });
        };

        var openFriendChannel = function (data, f) {
            var keys = Curve.deriveKeys(data.curvePublic, proxy.curvePrivate);
            var encryptor = Curve.createEncryptor(keys);
            network.join(data.channel).then(function (chan) {
                var channel = channels[data.channel] = {
                    id: data.channel,
                    sending: false,
                    friendEd: f,
                    keys: keys,
                    curve: data.curvePublic,
                    encryptor: encryptor,
                    messages: [],
                    wc: chan,
                    userList: [],
                    mapId: {},
                    send: function (payload, cb) {
                        if (!network.webChannels.some(function (wc) {
                            if (wc.id === channel.wc.id) { return true; }
                        })) {
                            return void cb('NO_SUCH_CHANNEL');
                        }

                        var msg = [Types.message, proxy.curvePublic, +new Date(), payload];
                        var msgStr = JSON.stringify(msg);
                        var cryptMsg = channel.encryptor.encrypt(msgStr);

                        channel.wc.bcast(cryptMsg).then(function () {
                            pushMsg(channel, cryptMsg);
                            cb();
                        }, function (err) {
                            cb(err);
                        });
                    }
                };
                chan.on('message', function (msg, sender) {
                    onMessage(msg, sender, chan);
                });

                var onJoining = function (peer) {
                    if (peer === Msg.hk) { return; }
                    if (channel.userList.indexOf(peer) !== -1) { return; }

                    channel.userList.push(peer);
                    var msg = [Types.mapId, proxy.curvePublic, chan.myID];
                    var msgStr = JSON.stringify(msg);
                    var cryptMsg = channel.encryptor.encrypt(msgStr);
                    network.sendto(peer, cryptMsg);
                };
                chan.members.forEach(function (peer) {
                    if (peer === Msg.hk) { return; }
                    if (channel.userList.indexOf(peer) !== -1) { return; }
                    channel.userList.push(peer);
                });
                chan.on('join', onJoining);
                chan.on('leave', function (peer) {
                    var curvePublic = channel.mapId[peer];
                    var i = channel.userList.indexOf(peer);
                    while (i !== -1) {
                        channel.userList.splice(i, 1);
                        i = channel.userList.indexOf(peer);
                    }
                    // update status
                    if (!curvePublic) { return; }
                    eachHandler('leave', function (f) {
                        f(curvePublic, channel.id);
                    });
                });

                // FIXME don't subscribe to the channel implicitly
                getChannelMessagesSince(chan, data, keys);
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

        messenger.openFriendChannel = function (curvePublic, cb) {
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
        };

        messenger.sendMessage = function (curvePublic, payload, cb) {
            var channel = getChannel(curvePublic);
            if (!channel) { return void cb('NO_CHANNEL'); }
            if (!network.webChannels.some(function (wc) {
                if (wc.id === channel.wc.id) { return true; }
            })) {
                return void cb('NO_SUCH_CHANNEL');
            }

            var msg = [Types.message, proxy.curvePublic, +new Date(), payload];
            var msgStr = JSON.stringify(msg);
            var cryptMsg = channel.encryptor.encrypt(msgStr);

            channel.wc.bcast(cryptMsg).then(function () {
                pushMsg(channel, cryptMsg);
                cb();
            }, function (err) {
                cb(err);
            });
        };

        messenger.getStatus = function (curvePublic, cb) {
            var channel = getChannel(curvePublic);
            if (!channel) { return void cb('NO_SUCH_CHANNEL'); }
            var online = channel.userList.some(function (nId) {
                return channel.mapId[nId] === curvePublic;
            });
            cb(void 0, online);
        };

        messenger.getFriendInfo = function (curvePublic, cb) {
            setTimeout(function () {
                var friend = friends[curvePublic];
                if (!friend) { return void cb('NO_SUCH_FRIEND'); }
                // this clone will be redundant when ui uses postmessage
                cb(void 0, clone(friend));
            });
        };

        messenger.getMyInfo = function (cb) {
            cb(void 0, {
                curvePublic: proxy.curvePublic,
                displayName: common.getDisplayName(),
            });
        };

        messenger.clearOwnedChannel = function (channel, cb) {
            common.clearOwnedChannel(channel, function (e) {
                if (e) { return void cb(e); }
                cb();
            });
        };

        // TODO listen for changes to your friend list
        // emit 'update' events for clients

        //var update = function (curvePublic
        proxy.on('change', ['friends'], function (o, n, p) {
            var curvePublic;
            if (o === undefined) {
                // new friend added
                curvePublic = p.slice(-1)[0];
                eachHandler('friend', function (f) {
                    f(curvePublic, clone(n));
                });
                return;
            }

            console.error(o, n, p);
        }).on('remove', ['friends'], function (o, p) {
            eachHandler('unfriend', function (f) {
                f(p[1]); // TODO
            });
        });

        Object.freeze(messenger);

        return messenger;
    };

    return Msg;
});
