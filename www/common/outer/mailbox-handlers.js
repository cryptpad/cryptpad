define([
    '/common/common-messaging.js',
], function (Messaging) {

    var handlers = {};

    handlers['FRIEND_REQUEST'] = function (ctx, data, cb) {
        if (data.msg.author === data.msg.content.curvePublic &&
            Messaging.getFriend(ctx.store.proxy, data.msg.author)) {
            Messaging.acceptFriendRequest(ctx.store, data.msg.content, function (obj) {
                if (obj && obj.error) { return void cb(); }
                cb(true);
            });
            return;
        }
        cb();
    };
    handlers['DECLINE_FRIEND_REQUEST'] = function (ctx, box, data, cb) {
        // Our friend request was declined.
        if (!ctx.store.proxy.friends_pending[data.msg.author]) { return void cb(); }
        delete ctx.store.proxy.friends_pending[data.msg.author];
        ctx.updateMetadata();
        cb();
    };
    handlers['ACCEPT_FRIEND_REQUEST'] = function (ctx, box, data, cb) {
        // Our friend request was accepted.
        // Make sure we really sent it
        if (!ctx.store.proxy.friends_pending[data.msg.author]) { return void cb(); }
        // And add the friend
        Messaging.addToFriendList({
            proxy: ctx.store.proxy,
            realtime: ctx.store.realtime,
            pinPads: ctx.pinPads
        }, data.msg.content, function (err) {
            if (err) { console.error(err); }
            delete ctx.store.proxy.friends_pending[data.msg.author];
            if (ctx.store.messenger) {
                ctx.store.messenger.onFriendAdded(data.msg.content);
            }
            ctx.updateMetadata();
        });
        cb();
    };

    return function (ctx, box, data, cb) {
        var type = data.msg.type;

        if (handlers[type]) {
            try {
                handlers[type](ctx, box, data, cb);
            } catch (e) {
                cb();
            }
        } else {
            cb();
        }
    };
});

