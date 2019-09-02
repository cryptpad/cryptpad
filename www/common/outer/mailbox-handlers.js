define([
    '/common/common-messaging.js',
    '/common/common-hash.js',
], function (Messaging, Hash) {

    var getRandomTimeout = function (ctx) {
        var lag = ctx.store.realtime.getLag().lag || 0;
        return (Math.max(0, lag) + 300) * 20 * (0.5 +  Math.random());
    };

    var handlers = {};
    var removeHandlers = {};

    // Store the friend request displayed to avoid duplicates
    var friendRequest = {};
    handlers['FRIEND_REQUEST'] = function (ctx, box, data, cb) {

        // Check if the request is valid (send by the correct user)
        if (data.msg.author !== data.msg.content.curvePublic) {
            return void cb(true);
        }

        // Don't show duplicate friend request: if we already have a friend request
        // in memory from the same user, dismiss the new one
        if (friendRequest[data.msg.author]) { return void cb(true); }

        friendRequest[data.msg.author] = true;

        // If the user is already in our friend list, automatically accept the request
        if (Messaging.getFriend(ctx.store.proxy, data.msg.author) ||
            ctx.store.proxy.friends_pending[data.msg.author]) {
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
        if (friendRequest[data.content.curvePublic]) {
            delete friendRequest[data.content.curvePublic];
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
        ctx.updateMetadata();
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
                // If you have a profile page open, update it
                if (ctx.store.modules['profile']) { ctx.store.modules['profile'].update(); }
                if (friendRequestAccepted[data.msg.author]) { return; }
                // Display the "accepted" state in the UI
                box.sendMessage({
                    type: 'FRIEND_REQUEST_ACCEPTED',
                    content: {
                        user: data.msg.author,
                        name: data.msg.content.displayName
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
        ctx.updateMetadata();
        if (friendRequestAccepted[data.msg.content.user]) { return void cb(true); }
        friendRequestAccepted[data.msg.content.user] = true;
        cb();
    };
    removeHandlers['FRIEND_REQUEST_ACCEPTED'] = function (ctx, box, data) {
        if (friendRequestAccepted[data.content.user]) {
            delete friendRequestAccepted[data.content.user];
        }
    };

    handlers['UNFRIEND'] = function (ctx, box, data, cb) {
        var curve = data.msg.content.curvePublic;
        var friend = Messaging.getFriend(ctx.store.proxy, curve);
        if (!friend) { return void cb(true); }
        delete ctx.store.proxy.friends[curve];
        if (ctx.store.messenger) {
            ctx.store.messenger.onFriendRemoved(curve, friend.channel);
        }
        ctx.updateMetadata();
        cb(true);
    };

    handlers['UPDATE_DATA'] = function (ctx, box, data, cb) {
        var msg = data.msg;
        var curve = msg.author;
        var friend = ctx.store.proxy.friends && ctx.store.proxy.friends[curve];
        if (!friend || typeof msg.content !== "object") { return void cb(true); }
        Object.keys(msg.content).forEach(function (key) {
            friend[key] = msg.content[key];
        });
        if (ctx.store.messenger) {
            ctx.store.messenger.onFriendUpdate(curve, friend);
        }
        ctx.updateMetadata();
        cb(true);
    };

    // Hide duplicates when receiving a SHARE_PAD notification:
    // Keep only one notification per channel: the stronger and more recent one
    var channels = {};
    handlers['SHARE_PAD'] = function (ctx, box, data, cb) {
        var msg = data.msg;
        var hash = data.hash;
        var content = msg.content;
        // content.name, content.title, content.href, content.password

        var channel = Hash.hrefToHexChannelId(content.href, content.password);
        var parsed = Hash.parsePadUrl(content.href);
        var mode = parsed.hashData && parsed.hashData.mode || 'n/a';

        var old = channels[channel];
        var toRemove;
        if (old) {
            // New hash is weaker, ignore
            if (old.mode === 'edit' && mode === 'view') {
                return void cb(true);
            }
            // New hash is not weaker, clear the old one
            toRemove = old.data;
        }

        // Update the data
        channels[channel] = {
            mode: mode,
            data: {
                type: box.type,
                hash: hash
            }
        };

        cb(false, toRemove);
    };
    removeHandlers['SHARE_PAD'] = function (ctx, box, data, hash) {
        var content = data.content;
        var channel = Hash.hrefToHexChannelId(content.href, content.password);
        var old = channels[channel];
        if (old && old.data && old.data.hash === hash) {
            delete channels[channel];
        }
    };

    // Hide duplicates when receiving a SUPPORT_MESSAGE notification
    var supportMessage = false;
    handlers['SUPPORT_MESSAGE'] = function (ctx, box, data, cb) {
        if (supportMessage) { return void cb(true); }
        supportMessage = true;
        cb();
    };

    // Incoming edit rights request: add data before sending it to inner
    handlers['REQUEST_PAD_ACCESS'] = function (ctx, box, data, cb) {
        var msg = data.msg;
        var content = msg.content;

        if (msg.author !== content.user.curvePublic) { return void cb(true); }

        var channel = content.channel;
        var res = ctx.store.manager.findChannel(channel);

        if (!res.length) { return void cb(true); }

        var edPublic = ctx.store.proxy.edPublic;
        var title, href;
        if (!res.some(function (obj) {
            if (obj.data &&
                Array.isArray(obj.data.owners) && obj.data.owners.indexOf(edPublic) !== -1 &&
                obj.data.href) {
                    href = obj.data.href;
                    title = obj.data.filename || obj.data.title;
                    return true;
            }
        })) { return void cb(true); }

        content.title = title;
        content.href = href;
        cb(false);
    };

    handlers['GIVE_PAD_ACCESS'] = function (ctx, box, data, cb) {
        var msg = data.msg;
        var content = msg.content;

        if (msg.author !== content.user.curvePublic) { return void cb(true); }

        var channel = content.channel;
        var res = ctx.store.manager.findChannel(channel);

        var title;
        res.forEach(function (obj) {
            if (obj.data && !obj.data.href) {
                if (!title) { title = obj.data.filename || obj.data.title; }
                obj.data.href = content.href;
            }
        });

        content.title = title || content.title;
        cb(false);
    };

    // Hide duplicates when receiving an ADD_OWNER notification:
    var addOwners = {};
    handlers['ADD_OWNER'] = function (ctx, box, data, cb) {
        var msg = data.msg;
        var content = msg.content;

        if (msg.author !== content.user.curvePublic) { return void cb(true); }
        if (!content.href || !content.title || !content.channel) {
            console.log('Remove invalid notification');
            return void cb(true);
        }

        var channel = content.channel;

        if (addOwners[channel]) { return void cb(true); }
        addOwners[channel] = {
            type: box.type,
            hash: data.hash
        };

        cb(false);
    };
    removeHandlers['ADD_OWNER'] = function (ctx, box, data) {
        var channel = data.content.channel;
        if (addOwners[channel]) {
            delete addOwners[channel];
        }
    };

    handlers['RM_OWNER'] = function (ctx, box, data, cb) {
        var msg = data.msg;
        var content = msg.content;

        if (msg.author !== content.user.curvePublic) { return void cb(true); }
        if (!content.channel) {
            console.log('Remove invalid notification');
            return void cb(true);
        }

        var channel = content.channel;

        if (addOwners[channel] && content.pending) {
            return void cb(false, addOwners[channel]);
        }
        cb(false);
    };

    return {
        add: function (ctx, box, data, cb) {
            /**
             *  data = {
                    msg: {
                        type: 'STRING',
                        author: 'curvePublicString',
                        content: {} (depend on the "type")
                    },
                    hash: 'string'
                }
             */
            if (!data.msg) { return void cb(true); }
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

