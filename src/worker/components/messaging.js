// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

(() => {
const factory = (Crypto, Hash, Util, Constants, Realtime) => {
    var Msg = {};

    var createData = Msg.createData = function (proxy, hash) {
        var data = {
            channel: hash || Hash.createChannelId(),
            displayName: proxy['cryptpad.username'],
            profile: proxy.profile && proxy.profile.view,
            edPublic: proxy.edPublic,
            curvePublic: proxy.curvePublic,
            notifications: Util.find(proxy, ['mailboxes', 'notifications', 'channel']),
            avatar: proxy.profile && proxy.profile.avatar,
            badge: proxy.profile && proxy.profile.badge,
            uid: proxy.uid,
        };
        if (hash === false) { delete data.channel; }
        return data;
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

    Msg.declineFriendRequest = function (store, data, cb) {
        store.mailbox.sendTo('DECLINE_FRIEND_REQUEST', {}, {
            channel: data.notifications,
            curvePublic: data.curvePublic
        }, function (obj) {
            cb(obj);
        });
    };
    Msg.acceptFriendRequest = function (store, data, cb) {
        var friend = getFriend(store.proxy, data.curvePublic) || {};
        var myData = createData(store.proxy, friend.channel || data.channel);
        store.mailbox.sendTo('ACCEPT_FRIEND_REQUEST', { user: myData }, {
            channel: data.notifications,
            curvePublic: data.curvePublic
        }, function (obj) {
            cb(obj);
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

    Msg.updateMyData = function (store, curve) {
        var myData = createData(store.proxy, false);
        if (store.proxy.friends) {
            store.proxy.friends.me = Util.clone(myData);
            delete store.proxy.friends.me.channel;
        }
        if (store.modules['team']) {
            store.modules['team'].updateMyData(myData);
        }
        var todo = function (friend) {
            if (!friend || !friend.notifications) { return; }
            delete friend.user;
            myData.channel = friend.channel;
            store.mailbox.sendTo('UPDATE_DATA', myData, {
                channel: friend.notifications,
                curvePublic: friend.curvePublic
            }, function (obj) {
                if (obj && obj.error) { console.error(obj); }
            });
        };
        if (curve) {
            var friend = getFriend(store.proxy, curve);
            return void todo(friend);
        }
        eachFriend(store.proxy.friends || {}, todo);
    };

    Msg.removeFriend = function (store, curvePublic, cb) {
        var proxy = store.proxy;
        var friend = proxy.friends[curvePublic];
        if (!friend) { return void cb({error: 'ENOENT'}); }
        if (!friend.notifications) { return void cb({error: 'EINVAL'}); }

        store.mailbox.sendTo('UNFRIEND', {
            curvePublic: proxy.curvePublic
        }, {
            channel: friend.notifications,
            curvePublic: friend.curvePublic
        }, function (obj) {
            if (obj && obj.error) {
                return void cb(obj);
            }
            store.messenger.onFriendRemoved(curvePublic, friend.channel);
            delete proxy.friends[curvePublic];
            Realtime.whenRealtimeSyncs(store.realtime, function () {
                cb(obj);
            });
        });
    };

    return Msg;
};

if (typeof(module) !== 'undefined' && module.exports) {
    module.exports = factory(
        require('chainpad-crypto'),
        require('../../common/common-hash'),
        require('../../common/common-util'),
        require('../../common/common-constants'),
        require('../../common/common-realtime')
    );
} else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
    define([
        '/components/chainpad-crypto/crypto.js',
        '/common/common-hash.js',
        '/common/common-util.js',
        '/common/common-constants.js',
        '/common/common-realtime.js',
    ], factory);
} else {
    // unsupported initialization
}
})();
