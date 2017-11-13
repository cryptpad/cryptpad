define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/curve.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/customize/messages.js',

    '/bower_components/marked/marked.min.js',
    '/common/common-realtime.js',
], function ($, Crypto, Curve, Hash, Util, Messages, Marked, Realtime) {
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

    Msg.getFriendChannelsList = function (common) {
        var list = [];
        var proxy = common.getProxy();
        eachFriend(proxy.friends, function (friend) {
            list.push(friend.channel);
        });
        return list;
    };

    // TODO make this internal to the messenger
    var channels = Msg.channels  = window.channels = {};

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
    var addToFriendList = Msg.addToFriendList = function (common, data, cb) {
        var proxy = common.getProxy();
        var friends = getFriendList(proxy);
        var pubKey = data.curvePublic; // todo validata data

        if (pubKey === proxy.curvePublic) { return void cb("E_MYKEY"); }

        friends[pubKey] = data;

        Realtime.whenRealtimeSyncs(common.getRealtime(), function () {
            cb();
            common.pinPads([data.channel], function (e) {
                if (e) { console.error(e); }
            });
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
                    common.onFriendRequest(confirmMsg, todo);
                    //UI.confirm(confirmMsg, todo, null, true);
                    return;
                }
                if (msg[0] === "FRIEND_REQ_OK") {
                    var idx = pendingRequests.indexOf(sender);
                    if (idx !== -1) { pendingRequests.splice(idx, 1); }

                    // FIXME clarify this function's name
                    addToFriendList(common, msgData, function (err) {
                        if (err) {
                            return void common.onFriendComplete({
                                logText: Messages.contacts_addError,
                                netfluxId: sender
                            });
                        }
                        common.onFriendComplete({
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
                    common.onFriendComplete({
                        logText: Messages.contacts_rejected,
                        netfluxId: sender
                    });
                    common.changeDisplayName(proxy[common.displayNameKey]);
                    return;
                }
                if (msg[0] === "FRIEND_REQ_ACK") {
                    var data = pending[sender];
                    if (!data) { return; }
                    addToFriendList(common, data, function (err) {
                        if (err) {
                            return void common.onFriendComplete({
                                logText: Messages.contacts_addError,
                                netfluxId: sender
                            });
                        }
                        common.onFriendComplete({
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

    Msg.getPending = function () {
        return pendingRequests;
    };

    Msg.inviteFromUserlist = function (common, netfluxId) {
        var network = common.getNetwork();
        var parsed = Hash.parsePadUrl(window.location.href);
        if (!parsed.hashData) { return; }
        // Message
        var chan = parsed.hashData.channel;
        var myData = createData(common.getProxy());
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
