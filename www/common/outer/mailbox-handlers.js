define([
    '/common/common-messaging.js',
    '/common/common-hash.js',
    '/common/common-util.js',
], function (Messaging, Hash, Util) {

    // Random timeout between 10 and 30 times your sync time (lag + chainpad sync)
    var getRandomTimeout = function (ctx) {
        var lag = ctx.store.realtime.getLag().lag || 0;
        return (Math.max(0, lag) + 300) * 20 * (0.5 +  Math.random());
    };

    var handlers = {};
    var removeHandlers = {};

    var isMuted = function (ctx, data) {
        var muted = ctx.store.proxy.mutedUsers || {};
        var curvePublic = Util.find(data, ['msg', 'author']);
        if (!curvePublic) { return false; }
        return Boolean(muted[curvePublic]);
    };

    // Store the friend request displayed to avoid duplicates
    var friendRequest = {};
    handlers['FRIEND_REQUEST'] = function (ctx, box, data, cb) {
        // Old format: data was stored directly in "content"
        var userData = data.msg.content.user || data.msg.content;

        if (isMuted(ctx, data)) { return void cb(true); }

        // Don't show duplicate friend request: if we already have a friend request
        // in memory from the same user, dismiss the new one
        if (friendRequest[data.msg.author]) { return void cb(true); }

        friendRequest[data.msg.author] = true;

        // If the user is already in our friend list, automatically accept the request
        if (Messaging.getFriend(ctx.store.proxy, data.msg.author) ||
            ctx.store.proxy.friends_pending[data.msg.author]) {
            delete ctx.store.proxy.friends_pending[data.msg.author];

            Messaging.acceptFriendRequest(ctx.store, userData, function (obj) {
                if (obj && obj.error) {
                    return void cb();
                }
                Messaging.addToFriendList({
                    proxy: ctx.store.proxy,
                    realtime: ctx.store.realtime,
                    pinPads: ctx.pinPads
                }, userData, function (err) {
                    if (err) { return void console.error(err); }
                    if (ctx.store.messenger) {
                        ctx.store.messenger.onFriendAdded(userData);
                    }
                });
                ctx.updateMetadata();
                cb(true);
            });
            return;
        }

        cb();
    };
    removeHandlers['FRIEND_REQUEST'] = function (ctx, box, data) {
        var userData = data.content.user || data.content;
        if (friendRequest[userData.curvePublic]) {
            delete friendRequest[userData.curvePublic];
        }
    };

    // The DECLINE and ACCEPT messages act on the contacts data
    // They are processed with a random timeout to avoid having
    // multiple workers trying to add or remove the contacts at
    // the same time. Once processed, they are dismissed.
    // We must dismiss them and send another message to our own
    // mailbox for the UI part otherwise it would automatically
    // accept or decline future requests from the same user
    // until the message is manually dismissed.

    var friendRequestDeclined = {};
    handlers['DECLINE_FRIEND_REQUEST'] = function (ctx, box, data, cb) {
        // Old format: data was stored directly in "content"
        var userData = data.msg.content.user || data.msg.content;
        if (!userData.curvePublic) { userData.curvePublic = data.msg.author; }

        // Our friend request was declined.
        setTimeout(function () {
            // Only dismissed once in the timeout to make sure we won't lose
            // the data if we close the worker before adding the friend
            cb(true);

            // Make sure we really sent it
            if (!ctx.store.proxy.friends_pending[data.msg.author]) { return; }
            // Remove the pending message and display the "declined" state in the UI
            delete ctx.store.proxy.friends_pending[data.msg.author];

            ctx.updateMetadata();
            if (friendRequestDeclined[data.msg.author]) { return; }
            friendRequestDeclined[data.msg.author] = true;
            box.sendMessage({
                type: 'FRIEND_REQUEST_DECLINED',
                content: { user: userData }
            }, function () {});
        }, getRandomTimeout(ctx));
    };
    // UI for declined friend request
    handlers['FRIEND_REQUEST_DECLINED'] = function (ctx, box, data, cb) {
        ctx.updateMetadata();
        var curve = data.msg.content.user.curvePublic || data.msg.content.user;
        if (friendRequestDeclined[curve]) { return void cb(true); }
        friendRequestDeclined[curve] = true;
        cb();
    };
    removeHandlers['FRIEND_REQUEST_DECLINED'] = function (ctx, box, data) {
        var curve = data.content.user.curvePublic || data.content.user;
        if (friendRequestDeclined[curve]) { delete friendRequestDeclined[curve]; }
    };

    var friendRequestAccepted = {};
    handlers['ACCEPT_FRIEND_REQUEST'] = function (ctx, box, data, cb) {
        // Old format: data was stored directly in "content"
        var userData = data.msg.content.user || data.msg.content;

        // Our friend request was accepted.
        setTimeout(function () {
            // Only dismissed once in the timeout to make sure we won't lose
            // the data if we close the worker before adding the friend
            cb(true);

            // Make sure we really sent it
            if (!ctx.store.proxy.friends_pending[data.msg.author]) { return; }
            // Remove the pending state. It will also us to send a new request in case of error
            delete ctx.store.proxy.friends_pending[data.msg.author];

            // And add the friend
            Messaging.addToFriendList({
                proxy: ctx.store.proxy,
                realtime: ctx.store.realtime,
                pinPads: ctx.pinPads
            }, userData, function (err) {
                if (err) { return void console.error(err); }
                // Load the chat if contacts app loaded
                if (ctx.store.messenger) { ctx.store.messenger.onFriendAdded(userData); }
                // Update the userlist
                ctx.updateMetadata();
                // If you have a profile page open, update it
                if (ctx.store.modules['profile']) { ctx.store.modules['profile'].update(); }
                // Display the "accepted" state in the UI
                if (friendRequestAccepted[data.msg.author]) { return; }
                friendRequestAccepted[data.msg.author] = true;
                box.sendMessage({
                    type: 'FRIEND_REQUEST_ACCEPTED',
                    content: { user: userData }
                }, function () {});
            });
        }, getRandomTimeout(ctx));
    };
    // UI for accepted friend request
    handlers['FRIEND_REQUEST_ACCEPTED'] = function (ctx, box, data, cb) {
        ctx.updateMetadata();
        var curve = data.msg.content.user.curvePublic || data.msg.content.user;
        if (friendRequestAccepted[curve]) { return void cb(true); }
        friendRequestAccepted[curve] = true;
        cb();
    };
    removeHandlers['FRIEND_REQUEST_ACCEPTED'] = function (ctx, box, data) {
        var curve = data.content.user.curvePublic || data.content.user;
        if (friendRequestAccepted[curve]) { delete friendRequestAccepted[curve]; }
    };

    handlers['UNFRIEND'] = function (ctx, box, data, cb) {
        var curve = data.msg.author;
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
            ctx.store.messenger.onFriendUpdate(curve);
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

        if (isMuted(ctx, data)) { return void cb(true); }

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
    removeHandlers['SUPPORT_MESSAGE'] = function () {
        supportMessage = false;
    };

    // Incoming edit rights request: add data before sending it to inner
    handlers['REQUEST_PAD_ACCESS'] = function (ctx, box, data, cb) {
        var msg = data.msg;
        var content = msg.content;

        if (isMuted(ctx, data)) { return void cb(true); }

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

        var channel = content.channel;
        var res = ctx.store.manager.findChannel(channel, true);

        var title;
        res.forEach(function (obj) {
            if (obj.data && !obj.data.href) {
                if (!title) { title = obj.data.filename || obj.data.title; }
                obj.userObject.setHref(channel, null, content.href);
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

        if (isMuted(ctx, data)) { return void cb(true); }

        if (!content.teamChannel && !(content.href && content.title && content.channel)) {
            console.log('Remove invalid notification');
            return void cb(true);
        }

        var channel = content.channel || content.teamChannel;

        if (addOwners[channel]) { return void cb(true); }
        addOwners[channel] = {
            type: box.type,
            hash: data.hash
        };

        cb(false);
    };
    removeHandlers['ADD_OWNER'] = function (ctx, box, data) {
        var channel = data.content.channel || data.content.teamChannel;
        if (addOwners[channel]) {
            delete addOwners[channel];
        }
    };

    handlers['RM_OWNER'] = function (ctx, box, data, cb) {
        var msg = data.msg;
        var content = msg.content;

        if (!content.channel && !content.teamChannel) {
            console.log('Remove invalid notification');
            return void cb(true);
        }

        var channel = content.channel || content.teamChannel;

        // If our ownership rights for a team have been removed, update the owner flag
        if (content.teamChannel) {
            var teams = ctx.store.proxy.teams || {};
            Object.keys(teams).some(function (id) {
                if (teams[id].channel === channel) {
                    teams[id].owner = false;
                    return true;
                }
            });
        }

        if (addOwners[channel] && content.pending) {
            return void cb(false, addOwners[channel]);
        }
        cb(false);
    };

    var invitedTo = {};
    handlers['INVITE_TO_TEAM'] = function (ctx, box, data, cb) {
        var msg = data.msg;
        var content = msg.content;

        if (isMuted(ctx, data)) { return void cb(true); }

        if (!content.team) {
            console.log('Remove invalid notification');
            return void cb(true);
        }

        var invited = invitedTo[content.team.channel];
        if (invited) {
            console.log('removing old invitation');
            cb(false, invited);
            invitedTo[content.team.channel] = {
                type: box.type,
                hash: data.hash
            };
            return;
        }

        var myTeams = Util.find(ctx, ['store', 'proxy', 'teams']) || {};
        var alreadyMember = Object.keys(myTeams).some(function (k) {
            var team = myTeams[k];
            return team.channel === content.team.channel;
        });
        if (alreadyMember) { return void cb(true); }

        invitedTo[content.team.channel] = {
            type: box.type,
            hash: data.hash
        };

        cb(false);
    };
    removeHandlers['INVITE_TO_TEAM'] = function (ctx, box, data) {
        var channel = Util.find(data, ['content', 'team', 'channel']);
        delete invitedTo[channel];
    };

    handlers['KICKED_FROM_TEAM'] = function (ctx, box, data, cb) {
        var msg = data.msg;
        var content = msg.content;

        if (!content.teamChannel) {
            console.log('Remove invalid notification');
            return void cb(true);
        }

        if (invitedTo[content.teamChannel] && content.pending) {
            return void cb(true, invitedTo[content.teamChannel]);
        }

        cb(false);
    };

    handlers['INVITE_TO_TEAM_ANSWER'] = function (ctx, box, data, cb) {
        var msg = data.msg;
        var content = msg.content;

        if (!content.teamChannel) {
            console.log('Remove invalid notification');
            return void cb(true);
        }

        var myTeams = Util.find(ctx, ['store', 'proxy', 'teams']) || {};
        var teamId;
        var team;
        Object.keys(myTeams).some(function (k) {
            var _team = myTeams[k];
            if (_team.channel === content.teamChannel) {
                teamId = k;
                team = _team;
                return true;
            }
        });
        if (!teamId) { return void cb(true); }

        content.team = team;

        if (!content.answer) {
            // If they declined the invitation, remove them from the roster (as a pending member)
            try {
                var module = ctx.store.modules['team'];
                module.removeFromTeam(teamId, msg.author);
            } catch (e) { console.error(e); }
        }

        cb(false);
    };

    handlers['TEAM_EDIT_RIGHTS'] = function (ctx, box, data, cb) {
        var msg = data.msg;
        var content = msg.content;

        if (!content.teamData) {
            console.log('Remove invalid notification');
            return void cb(true);
        }

        // Make sure we are a member of this team
        var myTeams = Util.find(ctx, ['store', 'proxy', 'teams']) || {};
        var teamId;
        var team;
        Object.keys(myTeams).some(function (k) {
            var _team = myTeams[k];
            if (_team.channel === content.teamData.channel) {
                teamId = k;
                team = _team;
                return true;
            }
        });
        if (!teamId) { return void cb(true); }

        try {
            var module = ctx.store.modules['team'];
            // changeMyRights returns true if we can't change our rights
            module.changeMyRights(teamId, content.state, content.teamData, function (done) {
                if (!done) { console.error("Can't update team rights"); }
                cb(true);
            });
        } catch (e) { console.error(e); }
    };

    handlers['OWNED_PAD_REMOVED'] = function (ctx, box, data, cb) {
        var msg = data.msg;
        var content = msg.content;

        if (!content.channel) {
            console.log('Remove invalid notification');
            return void cb(true);
        }

        var channel = content.channel;
        var res = ctx.store.manager.findChannel(channel);

        res.forEach(function (obj) {
            var paths = ctx.store.manager.findFile(obj.id);
            ctx.store.manager.delete({
                paths: paths
            }, function () {
                ctx.updateDrive();
            });
        });

        cb(true);
    };

    // Make sure "todo migration" notifications are from yourself
    handlers['MOVE_TODO'] = function (ctx, box, data, cb) {
        var curve = ctx.store.proxy.curvePublic;
        if (data.msg.author !== curve) { return void cb(true); }
        cb();
    };

    // Hide duplicates when receiving a SHARE_PAD notification:
    // Keep only one notification per channel: the stronger and more recent one
    var comments = {};
    handlers['COMMENT_REPLY'] = function (ctx, box, data, cb) {
        var msg = data.msg;
        var hash = data.hash;
        var content = msg.content;

        if (Util.find(ctx.store.proxy, ['settings', 'pad', 'disableNotif'])) {
            return void cb(true);
        }

        var channel = content.channel;
        if (!channel) { return void cb(true); }

        var title, href;
        ctx.Store.getAllStores().some(function (s) {
            var res = s.manager.findChannel(channel);
            // Check if the pad is in our drive
            return res.some(function (obj) {
                if (!obj.data) { return; }
                if (href && !obj.data.href) { return; } // We already have the VIEW url, we need EDIT
                href = obj.data.href || obj.data.roHref;
                title = obj.data.filename || obj.data.title;
                if (obj.data.href) { return true; } // Abort only if we have the EDIT url
            });
        });

        // If we don't have the edit url, ignore this notification
        if (!href) { return void cb(true); }

        // Add the title
        content.href = href;
        content.title = title;

        // Remove duplicates
        var old = comments[channel];
        var toRemove = old ? old.data : undefined;

        // Update the data
        comments[channel] = {
            data: {
                type: box.type,
                hash: hash
            }
        };

        cb(false, toRemove);
    };
    removeHandlers['COMMENT_REPLY'] = function (ctx, box, data, hash) {
        var content = data.content;
        var channel = content.channel;
        var old = comments[channel];
        if (old && old.data && old.data.hash === hash) {
            delete comments[channel];
        }
    };

    // Hide duplicates when receiving a SHARE_PAD notification:
    // Keep only one notification per channel: the stronger and more recent one
    var mentions = {};
    handlers['MENTION'] = function (ctx, box, data, cb) {
        var msg = data.msg;
        var hash = data.hash;
        var content = msg.content;

        if (isMuted(ctx, data)) { return void cb(true); }

        var channel = content.channel;
        if (!channel) { return void cb(true); }

        var title, href;
        ctx.Store.getAllStores().some(function (s) {
            var res = s.manager.findChannel(channel);
            // Check if the pad is in our drive
            return res.some(function (obj) {
                if (!obj.data) { return; }
                if (href && !obj.data.href) { return; } // We already have the VIEW url, we need EDIT
                href = obj.data.href || obj.data.roHref;
                title = obj.data.filename || obj.data.title;
                if (obj.data.href) { return true; } // Abort only if we have the EDIT url
            });
        });

        // Add the title
        content.href = href;
        content.title = title;

        // Remove duplicates
        var old = mentions[channel];
        var toRemove = old ? old.data : undefined;

        // Update the data
        mentions[channel] = {
            data: {
                type: box.type,
                hash: hash
            }
        };

        cb(false, toRemove);
    };
    removeHandlers['MENTION'] = function (ctx, box, data, hash) {
        var content = data.content;
        var channel = content.channel;
        var old = mentions[channel];
        if (old && old.data && old.data.hash === hash) {
            delete mentions[channel];
        }
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

            // Check if the request is valid (sent by the correct user)
            var curve = Util.find(data, ['msg', 'content', 'user', 'curvePublic']) ||
                        Util.find(data, ['msg', 'content', 'curvePublic']);
            if (curve && data.msg.author !== curve) { console.error('blocked'); return void cb(true); }

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

