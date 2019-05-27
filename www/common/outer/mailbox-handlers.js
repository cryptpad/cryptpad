define([
    '/common/common-messaging.js',
], function (Messaging) {

    var getRandomTimeout = function (ctx) {
        var lag = ctx.store.realtime.getLag().lag || 0;
        return (Math.max(0, lag) + 300) * 20 * (0.5 +  Math.random());
    };

    var handlers = {};
    var removeHandlers = {};

    // Store the friend request displayed to avoid duplicates
    var friendRequest = {};
    handlers['FRIEND_REQUEST'] = function (ctx, data, cb) {
        // Check if the request is valid (send by the correct user)
        if (data.msg.author !== data.msg.content.curvePublic) { return void cb(true); }

        // Don't show duplicate friend request: if we already have a friend request
        // in memory from the same user, dismiss the new one
        if (friendRequest[data.msg.author]) { return void cb(true); }

        friendRequest[data.msg.author] = true;

        // If the user is already in our friend list, automatically accept the request
        if (Messaging.getFriend(ctx.store.proxy, data.msg.author)) {
            Messaging.acceptFriendRequest(ctx.store, data.msg.content, function (obj) {
                if (obj && obj.error) {
                    return void cb();
                }
                cb(true);
            });
            return;
        }

        cb();
    };
    removeHandlers['FRIEND_REQUEST'] = function (ctx, box, data) {
        if (friendRequest[data.curvePublic]) {
            delete friendRequest[data.curvePublic];
        }
    };

    var friendRequestDeclined = {};
    handlers['DECLINE_FRIEND_REQUEST'] = function (ctx, box, data, cb) {
        setTimeout(function () {
            // Our friend request was declined.
            if (!ctx.store.proxy.friends_pending[data.msg.author]) { return; }

            // Remove the pending message and display the "declined" state in the UI
            delete ctx.store.proxy.friends_pending[data.msg.author];
            ctx.updateMetadata();
            if (friendRequestDeclined[data.msg.author]) { return; }
            box.sendMessage({
                type: 'FRIEND_REQUEST_DECLINED',
                content: {
                    user: data.msg.author,
                    name: data.msg.content.displayName
                }
            }, function () {
                if (friendRequestDeclined[data.msg.author]) {
                    // TODO remove our message because another one was sent first?
                }
                friendRequestDeclined[data.msg.author] = true;
            });
        }, getRandomTimeout(ctx));
        cb(true);
    };
    handlers['FRIEND_REQUEST_DECLINED'] = function (ctx, box, data, cb) {
        if (friendRequestDeclined[data.msg.content.user]) { return void cb(true); }
        friendRequestDeclined[data.msg.content.user] = true;
        cb();
    };
    removeHandlers['FRIEND_REQUEST_DECLINED'] = function (ctx, box, data) {
        if (friendRequestDeclined[data.content.user]) {
            delete friendRequestDeclined[data.content.user];
        }
    };

    var friendRequestAccepted = {};
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
                }, function () {
                    if (friendRequestAccepted[data.msg.author]) {
                        // TODO remove our message because another one was sent first?
                    }
                    friendRequestAccepted[data.msg.author] = true;
                });
            });
        }, getRandomTimeout(ctx));
        cb(true);
    };
    handlers['FRIEND_REQUEST_ACCEPTED'] = function (ctx, box, data, cb) {
        if (friendRequestAccepted[data.msg.content.user]) { return void cb(true); }
        friendRequestAccepted[data.msg.content.user] = true;
        cb();
    };
    removeHandlers['FRIEND_REQUEST_ACCEPTED'] = function (ctx, box, data) {
        if (friendRequestAccepted[data.content.user]) {
            delete friendRequestAccepted[data.content.user];
        }
    };


    return {
        add: function (ctx, box, data, cb) {
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
        },
        remove: function (ctx, box, data, h) {
            // We sometimes try to delete non-existant data (with "delete box.content[h]")
            // In this case, we don't have the data in memory so we don't need to call
            // any "remove" handler
            if (!data) { return; }
            var type = data.type;

            if (removeHandlers[type]) {
                try {
                    removeHandlers[type](ctx, box, data, h);
                } catch (e) {
                    console.error(e);
                }
            }
        }
    };
});

