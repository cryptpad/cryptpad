define([
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/common/common-constants.js',
    '/customize/messages.js',

    '/common/common-realtime.js',
], function (Crypto, Hash, Util, Constants, Messages, Realtime) {
    var Msg = {
        inputs: [],
    };

    // TODO
    // - mute a channel (hide notifications or don't open it?)
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
        eachFriend(proxy.friends, function (friend) {
            list.push(friend.channel);
        });
        return list;
    };

    // TODO make this internal to the messenger
    var channels = Msg.channels = {};

    Msg.getLatestMessages = function () {
        Object.keys(channels).forEach(function (id) {
            if (id === 'me') { return; }
            var friend = channels[id];
            friend.getMessagesSinceDisconnect();
            friend.refresh();
        });
    };

    // Invitation
    // FIXME there are too many functions with this name
    var addToFriendList = Msg.addToFriendList = function (cfg, data, cb) {
        var proxy = cfg.proxy;
        var friends = getFriendList(proxy);
        var pubKey = data.curvePublic; // todo validata data

        if (pubKey === proxy.curvePublic) { return void cb("E_MYKEY"); }

        friends[pubKey] = data;

        Realtime.whenRealtimeSyncs(cfg.realtime, function () {
            cb();
            cfg.pinPads([data.channel], function (res) {
                if (res.error) { console.error(res.error); }
            });
        });
        cfg.updateMetadata();
    };

    /*  Used to accept friend requests within apps other than /contacts/ */
    Msg.addDirectMessageHandler = function (cfg) {
        var network = cfg.network;
        var proxy = cfg.proxy;
        if (!network) { return void console.error('Network not ready'); }
        network.on('message', function (message, sender) {
            var msg;
            if (sender === network.historyKeeper) { return; }
            try {
                var parsed = Hash.parsePadUrl(window.location.href);
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
                            msg = ["FRIEND_REQ_OK", chan, createData(proxy, msgData.channel)];
                        }
                        msgStr = Crypto.encrypt(JSON.stringify(msg), key);
                        network.sendto(sender, msgStr);
                    };
                    var existing = getFriend(proxy, msgData.curvePublic);
                    if (existing) {
                        todo(true);
                        return;
                    }
                    var confirmMsg = Messages._getKey('contacts_request', [
                        Util.fixHTML(msgData.displayName)
                    ]);
                    cfg.friendRequest(confirmMsg, todo);
                    return;
                }
                if (msg[0] === "FRIEND_REQ_OK") {
                    var idx = pendingRequests.indexOf(sender);
                    if (idx !== -1) { pendingRequests.splice(idx, 1); }

                    // FIXME clarify this function's name
                    addToFriendList(cfg, msgData, function (err) {
                        if (err) {
                            return void cfg.friendComplete({
                                logText: Messages.contacts_addError,
                                netfluxId: sender
                            });
                        }
                        cfg.friendComplete({
                            logText: Messages.contacts_added,
                            netfluxId: sender
                        });
                        var msg = ["FRIEND_REQ_ACK", chan];
                        var msgStr = Crypto.encrypt(JSON.stringify(msg), key);
                        network.sendto(sender, msgStr);
                    });
                    return;
                }
                if (msg[0] === "FRIEND_REQ_NOK") {
                    var i = pendingRequests.indexOf(sender);
                    if (i !== -1) { pendingRequests.splice(i, 1); }
                    cfg.friendComplete({
                        logText: Messages.contacts_rejected,
                        netfluxId: sender
                    });
                    cfg.updateMetadata();
                    return;
                }
                if (msg[0] === "FRIEND_REQ_ACK") {
                    var data = pending[sender];
                    if (!data) { return; }
                    addToFriendList(cfg, data, function (err) {
                        if (err) {
                            return void cfg.friendComplete({
                                logText: Messages.contacts_addError,
                                netfluxId: sender
                            });
                        }
                        cfg.friendComplete({
                            logText: Messages.contacts_added,
                            netfluxId: sender
                        });
                    });
                    return;
                }
                // TODO: timeout ACK: warn the user
            } catch (e) {
                console.error("Cannot parse direct message", msg || message, "from", sender, e);
            }
        });
    };

    Msg.inviteFromUserlist = function (cfg, data, cb) {
        var network = cfg.network;
        var netfluxId = data.netfluxId;
        var parsed = Hash.parsePadUrl(data.href);
        if (!parsed.hashData) { return; }
        // Message
        var chan = parsed.hashData.channel;
        var myData = createData(cfg.proxy);
        var msg = ["FRIEND_REQ", chan, myData];
        // Encryption
        var keyStr = parsed.hashData.key;
        var cryptor = Crypto.createEditCryptor(keyStr);
        var key = cryptor.cryptKey;
        var msgStr = Crypto.encrypt(JSON.stringify(msg), key);
        // Send encrypted message
        if (pendingRequests.indexOf(netfluxId) === -1) {
            pendingRequests.push(netfluxId);
            cfg.updateMetadata(); // redraws the userlist in pad
        }
        network.sendto(netfluxId, msgStr);
        cb();
    };

    return Msg;
});
