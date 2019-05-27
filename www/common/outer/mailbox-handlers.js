define([
    '/common/common-messaging.js',
], function (Messaging) {

    var getRandomTimeout = function (ctx) {
        var lag = ctx.store.realtime.getLag().lag || 0;
        return (Math.max(0, lag) + 300) * 20 * (0.5 +  Math.random());
    };

    var handlers = {};

    handlers['FRIEND_REQUEST'] = function (ctx, data, cb) {
        // Check if the request is valid (send by the correct user)
        if (data.msg.author !== data.msg.content.curvePublic) { return void cb(true); }

        // If the user is already in our friend list, automatically accept the request
        if (Messaging.getFriend(ctx.store.proxy, data.msg.author)) {
            Messaging.acceptFriendRequest(ctx.store, data.msg.content, function (obj) {
                if (obj && obj.error) { return void cb(); }
                cb(true);
            });
            return;
        }
        cb();
    };
    handlers['DECLINE_FRIEND_REQUEST'] = function (ctx, box, data, cb) {
        setTimeout(function () {
            // Our friend request was declined.
            if (!ctx.store.proxy.friends_pending[data.msg.author]) { return; }

            // Remove the pending message and display the "declined" state in the UI
            delete ctx.store.proxy.friends_pending[data.msg.author];
            ctx.updateMetadata();
            box.sendMessage({
                type: 'FRIEND_REQUEST_DECLINED',
                content: {
                    user: data.msg.author,
                    name: data.msg.content.displayName
                }
            });
        }, getRandomTimeout(ctx));
        cb(true);
    };
    handlers['ACCEPT_FRIEND_REQUEST'] = function (ctx, box, data, cb) {
        // Our friend request was accepted.
        setTimeout(function () {
            // Make sure we really sent it
            if (!ctx.store.proxy.friends_pending[data.msg.author]) { return; }
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
                // Display the "accepted" state in the UI
                box.sendMessage({
                    type: 'FRIEND_REQUEST_ACCEPTED',
                    content: {
                        curvePublic: data.msg.author,
                        displayName: data.msg.content.displayName
                    }
                });
            });
        }, getRandomTimeout(ctx));
        cb(true);
    };

    return function (ctx, box, data, cb) {
        var type = data.msg.type;

        if (handlers[type]) {
            try {
                handlers[type](ctx, box, data, cb);
            } catch (e) {
                console.error(e);
                cb();
            }
        } else {
            cb();
        }
    };
});

