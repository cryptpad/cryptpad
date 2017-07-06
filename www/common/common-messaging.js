define([
    '/bower_components/chainpad-crypto/crypto.js',
], function (Crypto) {
    var Msg = {};

    var pending = {};

    Msg.removeFromFriendList = function (common, edPublic, cb) {
        var proxy = common.getProxy();
        if (!proxy.friends) {
            return;
        }
        var friends = proxy.friends;
        delete friends[edPublic];
        common.whenRealtimeSyncs(common.getRealtime(), cb);
    };

    var addToFriendList = Msg.addToFriendList = function (common, data, cb) {
        var proxy = common.getProxy();
        if (!proxy.friends) {
            proxy.friends = {};
        }
        var friends = proxy.friends;
        var pubKey = data.edPublic;

        if (pubKey === proxy.edPublic) { return void cb("E_MYKEY"); }
        if (friends[pubKey]) { return void cb("E_EXISTS"); }

        friends[pubKey] = data;
        common.whenRealtimeSyncs(common.getRealtime(), cb);
    };

    var createData = function (common, hash) {
        var proxy = common.getProxy();
        return {
            channelHash: hash || common.createRandomHash(),
            displayName: proxy[common.displayNameKey],
            profile: proxy.profile.view,
            edPublic: proxy.edPublic,
            curvePublic: proxy.curvePublic
        };
    };

    Msg.addDirectMessageHandler = function (common) {
        var network = common.getNetwork();
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
                var decryptMsg = Crypto.decrypt(message, key);
                // Parse
                msg = JSON.parse(decryptMsg);
                if (msg[1] !== parsed.hashData.channel) { return; }
                var msgData = msg[2];
                if (msg[0] === "FRIEND_REQ") {
                    common.confirm("Accept friend?", function (yes) { // XXX
                        var msg = ["FRIEND_REQ_NOK", chan];
                        if (yes) {
                            pending[sender] = msgData;
                            msg = ["FRIEND_REQ_OK", chan, createData(common, msgData.channelHash)];
                        }
                        var msgStr = Crypto.encrypt(JSON.stringify(msg), key);
                        // Send encrypted message
                        network.sendto(sender, msgStr);
                    });
                    return;
                }
                if (msg[0] === "FRIEND_REQ_OK") {
                    // XXX
                    addToFriendList(common, msgData, function (err) {
                        if (err) {
                            return void common.log('Error while adding that friend to the list');
                        }
                        common.log('Friend invite accepted.');
                        var msg = ["FRIEND_REQ_ACK", chan];
                        var msgStr = Crypto.encrypt(JSON.stringify(msg), key);
                        network.sendto(sender, msgStr);
                    });
                    return;
                }
                if (msg[0] === "FRIEND_REQ_NOK") {
                    // XXX
                    common.log('Friend invite rejected');
                    return;
                }
                if (msg[0] === "FRIEND_REQ_ACK") {
                    // XXX
                    var data = pending[sender];
                    if (!data) { return; }
                    addToFriendList(common, data, function (err) {
                        if (err) {
                            return void common.log('Error while adding that friend to the list');
                        }
                        common.log('Friend added to the list.');
                    });
                    return;
                }
                // TODO: timeout ACK: warn the user
            } catch (e) {
                console.error("Cannot parse direct message", msg || message, "from", sender, e);
            }
        });
    };

    Msg.inviteFromUserlist = function (common, netfluxId) {
        var network = common.getNetwork();
        var parsed = common.parsePadUrl(window.location.href);
        if (!parsed.hashData) { return; } // TODO
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
        network.sendto(netfluxId, msgStr);
    };

    return Msg;
});
