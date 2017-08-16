define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/curve.js',
    '/common/common-hash.js',
    '/common/common-realtime.js'
//  '/bower_components/marked/marked.min.js'
], function ($, Crypto, Curve, Hash, Realtime) {
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

    // TODO
    // - mute a channel (hide notifications or don't open it?)

    var ready = [];
    var pending = {};
    var pendingRequests = [];

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

    var removeFromFriendList = function (proxy, realtime, curvePublic, cb) {
        if (!proxy.friends) { return; }
        var friends = proxy.friends;
        delete friends[curvePublic];
        Realtime.whenRealtimeSyncs(realtime, cb);
    };

    var getFriendList = Msg.getFriendList = function (proxy) {
        if (!proxy.friends) { proxy.friends = {}; }
        return proxy.friends;
    };

    var eachFriend = function (friends, cb) {
        Object.keys(friends).forEach(function (id) {
            if (id === 'me') { return; }
            cb(friends[id], id, friends);
        });
    };

    Msg.getFriendChannelsList = function (proxy) {
        var list = [];
        eachFriend(proxy, function (friend) {
            list.push(friend.channel);
        });
        return list;
    };

    var msgAlreadyKnown = function (channel, sig) {
        return channel.messages.some(function (message) {
            return message[0] === sig;
        });
    };

    var getMoreHistory = function (network, chan, hash, count) {
        var msg = [ 'GET_HISTORY_RANGE', chan.id, {
                from: hash,
                count: count,
            }
        ];

        network.sendto(network.historyKeeper, JSON.stringify(msg)).then(function () {
        }, function (err) {
            throw new Error(err);
        });
    };

    var getChannelMessagesSince = function (network, proxy, chan, data, keys) {
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

    Msg.messenger = function (common) {
        var messenger = {};

        var DEBUG = function (label) {
            console.log('event:' + label);
        };

        var channels = messenger.channels = {};

        // declare common variables
        var network = common.getNetwork();
        var proxy = common.getProxy();
        var realtime = common.getRealtime();
        Msg.hk = network.historyKeeper;
        var friends = getFriendList(proxy);

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
                // console.error('unable to decrypt message');
                // console.error('potentially meant for yourself');

                // message failed to parse, meaning somebody sent it to you but
                // encrypted it with the wrong key, or you're sending a message to
                // yourself in a different tab.
                return;
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

            channel.updateStatus();

            if (parsed[0] !== Types.mapId) { return; } // Don't send your key if it's already an ACK
            // Answer with your own key
            var rMsg = [Types.mapIdAck, proxy.curvePublic, channel.wc.myID];
            var rMsgStr = JSON.stringify(rMsg);
            var cryptMsg = channel.encryptor.encrypt(rMsgStr);
            network.sendto(sender, cryptMsg);
        };

        var pushMsg = function (channel, cryptMsg) {
            var msg = channel.encryptor.decrypt(cryptMsg);

            // TODO emit new message event or something
            // extension point for other apps
            console.log(msg);

            var sig = cryptMsg.slice(0, 64);
            if (msgAlreadyKnown(channel, sig)) { return; }

            var parsedMsg = JSON.parse(msg);
            if (parsedMsg[0] === Types.message) {
                // TODO validate messages here
                var res = {
                    type: parsedMsg[0],
                    sig: sig,
                    channel: parsedMsg[1],
                    time: parsedMsg[2],
                    text: parsedMsg[3],
                };

                channel.messages.push(res);
                return true;
            }
            if (parsedMsg[0] === Types.update) {
                if (parsedMsg[1] === proxy.curvePublic) { return; }
                var newdata = parsedMsg[3];
                var data = getFriend(proxy, parsedMsg[1]);
                var types = [];
                Object.keys(newdata).forEach(function (k) {
                    if (data[k] !== newdata[k]) {
                        types.push(k);
                        data[k] = newdata[k];
                    }
                });
                channel.updateUI(types);
                return;
            }
            if (parsedMsg[0] === Types.unfriend) {
                removeFromFriendList(proxy, realtime, channel.friendEd, function () {
                    channel.wc.leave(Types.unfriend);
                    channel.removeUI();
                });
                return;
            }
        };

        /*  Broadcast a display name, profile, or avatar change to all contacts
        */
        var updateMyData = function (proxy) {
            var friends = getFriendList(proxy);
            var mySyncData = friends.me;
            var myData = createData(proxy);
            if (!mySyncData || mySyncData.displayName !== myData.displayName
                 || mySyncData.profile !== myData.profile
                 || mySyncData.avatar !== myData.avatar) {
                delete myData.channel;
                Object.keys(channels).forEach(function (chan) {
                    var channel = channels[chan];
                    var msg = [Types.update, myData.curvePublic, +new Date(), myData];
                    var msgStr = JSON.stringify(msg);
                    var cryptMsg = channel.encryptor.encrypt(msgStr);
                    channel.wc.bcast(cryptMsg).then(function () {
                        channel.refresh();
                    }, function (err) {
                        console.error(err);
                    });
                });
                friends.me = myData;
            }
        };

        var onChannelReady = function (proxy, chanId) {
            if (ready.indexOf(chanId) !== -1) { return; }
            ready.push(chanId);
            channels[chanId].updateStatus(); // c'est quoi?
            var friends = getFriendList(proxy);
            if (ready.length === Object.keys(friends).length) {
                // All channels are ready
                updateMyData(proxy);
            }
            return ready.length;
        };

        var onDirectMessage = function (common, msg, sender) {
            if (sender !== Msg.hk) { return void onIdMessage(msg, sender); }
            var parsed = JSON.parse(msg);
            if ((parsed.validateKey || parsed.owners) && parsed.channel) {
                return;
            }
            if (parsed.state && parsed.state === 1 && parsed.channel) {
                if (channels[parsed.channel]) {
                    // parsed.channel is Ready
                    // TODO: call a function that shows that the channel is ready? (remove a spinner, ...)
                    // channel[parsed.channel].ready();
                    channels[parsed.channel].ready = true;
                    onChannelReady(proxy, parsed.channel);
                    var updateTypes = channels[parsed.channel].updateOnReady;
                    if (updateTypes) {
                        channels[parsed.channel].updateUI(updateTypes);
                    }
                }
                return;
            }
            var chan = parsed[3];
            if (!chan || !channels[chan]) { return; }
            pushMsg(channels[chan], parsed[4]);
            channels[chan].refresh();
        };

        var onMessage = function (common, msg, sender, chan) {
            if (!channels[chan.id]) { return; }

            var realtime = common.getRealtime();
            var proxy = common.getProxy();

            var isMessage = pushMsg(channels[chan.id], msg);
            if (isMessage) {
                // Don't notify for your own messages
                if (channels[chan.id].wc.myID !== sender) {
                    channels[chan.id].notify();
                }
                channels[chan.id].refresh();
            }
        };

        // listen for messages...
        network.on('message', function(msg, sender) {
            onDirectMessage(common, msg, sender);
        });

        // Refresh the active channel
        // TODO extract into UI method
        var refresh = function (/*curvePublic*/) {
            return;
            /*
            if (messenger.active !== curvePublic) { return; }
            var data = friends[curvePublic];
            if (!data) { return; }
            var channel = channels[data.channel];
            if (!channel) { return; }

            var $chat = ui.getChannel(curvePublic);

            if (!$chat) { return; }

            // Add new messages
            var messages = channel.messages;
            var $messages = $chat.find('.messages');
            var msg, name;
            var last = typeof(channel.lastDisplayed) === 'number'? channel.lastDisplayed: -1;
            for (var i = last + 1; i<messages.length; i++) {
                msg = messages[i];
                name = (msg.channel !== channel.lastSender)?
                    getFriend(proxy, msg.channel).displayName: undefined;

                ui.createMessage(msg, name).appendTo($messages);
                channel.lastSender = msg.channel;
            }
            $messages.scrollTop($messages[0].scrollHeight);
            channel.lastDisplayed = i-1;
            channel.unnotify();

            // return void channel.notify();
            if (messages.length > 10) {
                var lastKnownMsg = messages[messages.length - 11];
                channel.setLastMessageRead(lastKnownMsg.sig);
            }*/
        };
        // Display a new channel
        // TODO extract into UI method
        //var display = function (curvePublic) {
            //curvePublic = curvePublic;
            /*
            ui.hideInfo();
            var $chat = ui.getChannel(curvePublic);
            if (!$chat) {
                $chat = ui.createChat(curvePublic);
                ui.createChatBox(proxy, $chat, curvePublic);
            }
            // Show the correct div
            ui.hideChat();
            $chat.show();

            // TODO set this attr per-messenger
            messenger.setActive(curvePublic);
            // TODO don't mark messages as read unless you have displayed them

            refresh(curvePublic);*/
        //};

        // TODO take a callback
        var remove = function (curvePublic) {
            var data = getFriend(proxy, curvePublic);
            var channel = channels[data.channel];
            var msg = [Types.unfriend, proxy.curvePublic, +new Date()];
            var msgStr = JSON.stringify(msg);
            var cryptMsg = channel.encryptor.encrypt(msgStr);
            channel.wc.bcast(cryptMsg).then(function () {
                removeFromFriendList(common, curvePublic, function () {
                    channel.wc.leave(Types.unfriend);
                    channel.removeUI();
                });
            }, function (err) {
                console.error(err);
            });
        };

        // Open the channels
        var openFriendChannel = function (data, f) {
            var keys = Curve.deriveKeys(data.curvePublic, proxy.curvePrivate);
            var encryptor = Curve.createEncryptor(keys);
            network.join(data.channel).then(function (chan) {
                var channel = channels[data.channel] = {
                    sending: false,
                    friendEd: f,
                    keys: keys,
                    encryptor: encryptor,
                    messages: [],
                    unfriend: function () {
                        DEBUG('unfriend');
                        remove(data.curvePublic);
                    },
                    refresh: function () {
                        DEBUG('refresh');
                        refresh(data.curvePublic);
                    },
                    notify: function () {
                        //ui.notify(data.curvePublic);
                        DEBUG('notify');
                        common.notify(); // HERE
                    },
                    unnotify: function () {
                        DEBUG('unnotify');
                        //ui.unnotify(data.curvePublic);
                    },
                    removeUI: function () {
                        DEBUG('remove-ui');
                        //ui.remove(data.curvePublic);
                    },
                    updateUI: function (/*types*/) {
                        DEBUG('update-ui');
                        //ui.update(data.curvePublic, types);
                    },
                    updateStatus: function () {
                        DEBUG('update-status');
                        //ui.updateStatus(data.curvePublic,
                            //channel.getStatus(data.curvePublic));
                    },
                    setLastMessageRead: function (hash) {
                        DEBUG('updateLastKnownHash');
                        data.lastKnownHash = hash;
                    },
                    getLastMessageRead: function () {
                        return data.lastKnownHash;
                    },
                    isActive: function () {
                        return data.curvePublic === messenger.active;
                    },
                    getMessagesSinceDisconnect: function () {
                        getChannelMessagesSince(network, proxy, chan, data, keys);
                    },
                    wc: chan,
                    userList: [],
                    mapId: {},
                    getStatus: function (curvePublic) {
                        return channel.userList.some(function (nId) {
                            return channel.mapId[nId] === curvePublic;
                        });
                    },
                    getPreviousMessages: function () {
                        var history = channel.messages;
                        if (!history || !history.length) {
                            // TODO ask for default history?
                            return;
                        }

                        var oldestMessage = history[0];
                        if (!oldestMessage) {
                            return; // nothing to fetch
                        }

                        var messageHash = oldestMessage[0];
                        getMoreHistory(network, chan, messageHash, 10);
                    },
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
                    },
                };
                chan.on('message', function (msg, sender) {
                    onMessage(common, msg, sender, chan);
                });

                var onJoining = function (peer) {
                    if (peer === Msg.hk) { return; }
                    if (channel.userList.indexOf(peer) !== -1) { return; }
                    channel.userList.push(peer);
                    var msg = [Types.mapId, proxy.curvePublic, chan.myID];
                    var msgStr = JSON.stringify(msg);
                    var cryptMsg = channel.encryptor.encrypt(msgStr);
                    network.sendto(peer, cryptMsg);
                    channel.updateStatus();
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
                    channel.updateStatus();
                });

                getChannelMessagesSince(network, proxy, chan, data, keys);
            }, function (err) {
                console.error(err);
            });
        };

        messenger.getLatestMessages = function () {
            Object.keys(channels).forEach(function (id) {
                if (id === 'me') { return; }
                var friend = channels[id];
                friend.getMessagesSinceDisconnect();
                friend.refresh();
            });
        };

        messenger.cleanFriendChannels = function () {
            Object.keys(channels).forEach(function (id) {
                delete channels[id];
            });
        };

        var openFriendChannels = messenger.openFriendChannels = function () {
            eachFriend(friends, openFriendChannel);
        };

        //messenger.setEditable = ui.setEditable;

        openFriendChannels();

        // TODO split loop innards into ui methods
        var checkNewFriends = function () {
            eachFriend(friends, function (friend, id) {
                if (!channels[id]) {
                    openFriendChannel(friend, id);
                }
            });
        };

        common.onDisplayNameChanged(function () {
            checkNewFriends();
            updateMyData(proxy);
        });

        return messenger;
    };

    // Invitation
    // FIXME there are too many functions with this name
    var addToFriendList = Msg.addToFriendList = function (common, data, cb) {
        var proxy = common.getProxy();
        var friends = getFriendList(proxy);
        var pubKey = data.curvePublic;

        if (pubKey === proxy.curvePublic) { return void cb("E_MYKEY"); }

        friends[pubKey] = data;

        Realtime.whenRealtimeSyncs(common.getRealtime(), function () {
            cb();
            common.pinPads([data.channel]);
        });
        common.changeDisplayName(proxy[common.displayNameKey]);
    };

    /*  Used to accept friend requests within apps other than /contacts/ */
    Msg.addDirectMessageHandler = function (common) {
        var network = common.getNetwork();
        var proxy = common.getProxy();
        if (!network) { return void console.error('Network not ready'); }
        network.on('message', function (message, sender) {
            var msg;
            if (sender === network.historyKeeper) { return; }
            try {
                var parsed = common.parsePadUrl(window.location.href);
                if (!parsed.hashData) { return; }
                var chan = parsed.hashData.channel;
                // Decrypt
                var keyStr = parsed.hashData.key;
                var cryptor = Crypto.createEditCryptor(keyStr);
                var key = cryptor.cryptKey;
                var decryptMsg;
                try {
                    decryptMsg = Crypto.decrypt(message, key);
                } catch (e) {
                    // If we can't decrypt, it means it is not a friend request message
                }
                if (!decryptMsg) { return; }
                // Parse
                msg = JSON.parse(decryptMsg);
                if (msg[1] !== parsed.hashData.channel) { return; }
                var msgData = msg[2];
                var msgStr;
                if (msg[0] === "FRIEND_REQ") {
                    msg = ["FRIEND_REQ_NOK", chan];
                    var todo = function (yes) {
                        if (yes) {
                            pending[sender] = msgData;
                            msg = ["FRIEND_REQ_OK", chan, createData(common, msgData.channel)];
                        }
                        msgStr = Crypto.encrypt(JSON.stringify(msg), key);
                        network.sendto(sender, msgStr);
                    };
                    var existing = getFriend(proxy, msgData.curvePublic);
                    if (existing) {
                        todo(true);
                        return;
                    }
                    var confirmMsg = common.Messages._getKey('contacts_request', [
                        common.fixHTML(msgData.displayName)
                    ]);
                    common.confirm(confirmMsg, todo, null, true);
                    return;
                }
                if (msg[0] === "FRIEND_REQ_OK") {
                    var idx = pendingRequests.indexOf(sender);
                    if (idx !== -1) { pendingRequests.splice(idx, 1); }

                    // FIXME clarify this function's name
                    addToFriendList(common, msgData, function (err) {
                        if (err) {
                            return void common.log(common.Messages.contacts_addError);
                        }
                        common.log(common.Messages.contacts_added);
                        var msg = ["FRIEND_REQ_ACK", chan];
                        var msgStr = Crypto.encrypt(JSON.stringify(msg), key);
                        network.sendto(sender, msgStr);
                    });
                    return;
                }
                if (msg[0] === "FRIEND_REQ_NOK") {
                    var i = pendingRequests.indexOf(sender);
                    if (i !== -1) { pendingRequests.splice(i, 1); }
                    common.log(common.Messages.contacts_rejected);
                    common.changeDisplayName(proxy[common.displayNameKey]);
                    return;
                }
                if (msg[0] === "FRIEND_REQ_ACK") {
                    var data = pending[sender];
                    if (!data) { return; }
                    addToFriendList(common, data, function (err) {
                        if (err) {
                            return void common.log(common.Messages.contacts_addError);
                        }
                        common.log(common.Messages.contacts_added);
                    });
                    return;
                }
                // TODO: timeout ACK: warn the user
            } catch (e) {
                console.error("Cannot parse direct message", msg || message, "from", sender, e);
            }
        });
    };

    Msg.getPending = function () {
        return pendingRequests;
    };

    Msg.inviteFromUserlist = function (common, netfluxId) {
        var network = common.getNetwork();
        var parsed = common.parsePadUrl(window.location.href);
        if (!parsed.hashData) { return; }
        // Message
        var chan = parsed.hashData.channel;
        var myData = createData(common);
        var msg = ["FRIEND_REQ", chan, myData];
        // Encryption
        var keyStr = parsed.hashData.key;
        var cryptor = Crypto.createEditCryptor(keyStr);
        var key = cryptor.cryptKey;
        var msgStr = Crypto.encrypt(JSON.stringify(msg), key);
        // Send encrypted message
        if (pendingRequests.indexOf(netfluxId) === -1) {
            pendingRequests.push(netfluxId);
            var proxy = common.getProxy();
            // this redraws the userlist after a change has occurred
            // TODO rename this function to reflect its purpose
            common.changeDisplayName(proxy[common.displayNameKey]);
        }
        network.sendto(netfluxId, msgStr);
    };

    return Msg;
});
