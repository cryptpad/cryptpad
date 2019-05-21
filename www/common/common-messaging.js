define([
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/common/common-constants.js',
    '/customize/messages.js',

    '/common/common-realtime.js',
], function (Crypto, Hash, Util, Constants, Messages, Realtime) {
    var Msg = {};

    var createData = Msg.createData = function (proxy, hash) {
        return {
            channel: hash || Hash.createChannelId(),
            displayName: proxy['cryptpad.username'],
            profile: proxy.profile && proxy.profile.view,
            edPublic: proxy.edPublic,
            curvePublic: proxy.curvePublic,
            notifications: Util.find(proxy, ['mailboxes', 'notifications', 'channel']),
            avatar: proxy.profile && proxy.profile.avatar
        };
    };

    var getFriend = Msg.getFriend = function (proxy, pubkey) {
        if (!pubkey) { return; }
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

    Msg.acceptFriendRequest = function (store, data, cb) {
        var friend = getFriend(store.proxy, data.curvePublic) || {};
        var myData = createData(store.proxy, friend.channel || data.channel);
        store.mailbox.sendTo('ACCEPT_FRIEND_REQUEST', myData, {
            channel: data.notifications,
            curvePublic: data.curvePublic
        }, function (obj) {
            cb(obj);
            if (obj && obj.error) { return void cb(obj); }
        });
    };
    Msg.addToFriendList = function (cfg, data, cb) {
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
    };

    return Msg;
});
