define([
    'jquery',
    '/common/hyperscript.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/common-util.js',
    '/common/common-constants.js',
    '/customize/messages.js',
    '/bower_components/nthen/index.js'
], function($, h, Hash, UI, UIElements, Util, Constants, Messages, nThen) {

    var handlers = {};

    var defaultDismiss = function(common, data) {
        return function(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            common.mailbox.dismiss(data, function(err) {
                if (err) { return void console.error(err); }
            });
        };
    };

    // Friend request

    handlers['FRIEND_REQUEST'] = function(common, data) {
        var content = data.content;
        var msg = content.msg;
        var userData = msg.content.user || msg.content;
        var name = Util.fixHTML(userData.displayName) || Messages.anonymous;
        msg.content = { user: userData };

        // Display the notification
        content.getFormatText = function() {
            return Messages._getKey('friendRequest_notification', [name]);
        };

        // Check authenticity
        if (msg.author !== userData.curvePublic) { return; }

        // if not archived, add handlers
        if (!content.archived) {
            content.handler = function() {
                UIElements.displayFriendRequestModal(common, data);
            };
            common.addFriendRequest(data);
        }
    };

    handlers['FRIEND_REQUEST_ACCEPTED'] = function(common, data) {
        var content = data.content;
        var msg = content.msg;
        var userData = typeof(msg.content.user) === "object" ? msg.content.user : {
            displayName: msg.content.name,
            curvePublic: msg.content.user
        };
        var name = Util.fixHTML(userData.displayName) || Messages.anonymous;
        content.getFormatText = function() {
            return Messages._getKey('friendRequest_accepted', [name]);
        };
        if (!content.archived) {
            content.dismissHandler = defaultDismiss(common, data);
        }
    };

    handlers['FRIEND_REQUEST_DECLINED'] = function(common, data) {
        var content = data.content;
        var msg = content.msg;
        var userData = typeof(msg.content.user) === "object" ? msg.content.user : {
            displayName: msg.content.name,
            curvePublic: msg.content.user
        };
        var name = Util.fixHTML(userData.displayName) || Messages.anonymous;
        content.getFormatText = function() {
            return Messages._getKey('friendRequest_declined', [name]);
        };
        if (!content.archived) {
            content.dismissHandler = defaultDismiss(common, data);
        }
    };

    // Share pad

    handlers['SHARE_PAD'] = function(common, data) {
        var content = data.content;
        var msg = content.msg;
        var type = Hash.parsePadUrl(msg.content.href).type;
        var key = type === 'drive' ? 'notification_folderShared' :
            (type === 'file' ? 'notification_fileShared' :
                'notification_padShared');
        var name = Util.fixHTML(msg.content.name) || Messages.anonymous;
        var title = Util.fixHTML(msg.content.title);
        content.getFormatText = function() {
            return Messages._getKey(key, [name, title]);
        };
        content.handler = function() {
            var todo = function() {
                common.openURL(msg.content.href);
                defaultDismiss(common, data)();
            };
            nThen(function(waitFor) {
                if (msg.content.isTemplate) {
                    common.sessionStorage.put(Constants.newPadPathKey, ['template'], waitFor());
                }
                common.sessionStorage.put('newPadPassword', msg.content.password || '', waitFor());
            }).nThen(function() {
                todo();
            });
        };
        if (!content.archived) {
            content.dismissHandler = defaultDismiss(common, data);
        }
    };

    // New support message from the admins
    handlers['SUPPORT_MESSAGE'] = function(common, data) {
        var content = data.content;
        content.getFormatText = function() {
            return Messages.support_notification;
        };
        content.handler = function() {
            common.openURL('/support/');
            defaultDismiss(common, data)();
        };
        if (!content.archived) {
            content.dismissHandler = defaultDismiss(common, data);
        }
    };

    handlers['REQUEST_PAD_ACCESS'] = function(common, data) {
        var content = data.content;
        var msg = content.msg;

        // Check authenticity
        if (msg.author !== msg.content.user.curvePublic) { return; }

        // Display the notification
        var name = Util.fixHTML(msg.content.user.displayName) || Messages.anonymous;
        var title = Util.fixHTML(msg.content.title);
        content.getFormatText = function() {
            return Messages._getKey('requestEdit_request', [title, name]);
        };

        // if not archived, add handlers
        if (!content.archived) {
            content.handler = function() {
                var link = h('a', {
                    href: '#'
                }, Messages.requestEdit_viewPad);

                var name = Util.fixHTML(msg.content.user.displayName) || Messages.anonymous;
                var title = Util.fixHTML(msg.content.title);
                var verified = UIElements.getVerifiedFriend(common, msg.author, name);

                var div = h('div', [
                    UI.setHTML(h('p'), Messages._getKey('requestEdit_confirm', [title, name])),
                    verified,
                    link
                ]);
                $(link).click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    common.openURL(msg.content.href);
                });
                UI.confirm(div, function(yes) {
                    if (!yes) { return; }
                    common.getSframeChannel().event('EV_GIVE_ACCESS', {
                        channel: msg.content.channel,
                        user: msg.content.user
                    });
                    defaultDismiss(common, data)();
                }, {
                    ok: Messages.friendRequest_accept,
                    cancel: Messages.later
                });
            };

            content.dismissHandler = defaultDismiss(common, data);
        }
    };

    handlers['GIVE_PAD_ACCESS'] = function(common, data) {
        var content = data.content;
        var msg = content.msg;

        // Check authenticity
        if (msg.author !== msg.content.user.curvePublic) { return; }

        if (!msg.content.href) { return; }

        var name = Util.fixHTML(msg.content.user.displayName) || Messages.anonymous;
        var title = Util.fixHTML(msg.content.title);

        // Display the notification
        content.getFormatText = function() {
            return Messages._getKey('requestEdit_accepted', [title, name]);
        };

        // if not archived, add handlers
        content.handler = function() {
            common.openURL(msg.content.href);
            defaultDismiss(common, data)();
        };
    };


    handlers['ADD_OWNER'] = function(common, data) {
        var content = data.content;
        var msg = content.msg;

        // Display the notification
        var name = Util.fixHTML(msg.content.user.displayName) || Messages.anonymous;
        var title = Util.fixHTML(msg.content.title);
        content.getFormatText = function() {
            return Messages._getKey('owner_request', [name, title]);
        };

        // Check authenticity
        if (msg.author !== msg.content.user.curvePublic) { return; }

        // if not archived, add handlers
        if (!content.archived) {
            content.handler = function() {
                if (msg.content.teamChannel) {
                    return void UIElements.displayAddTeamOwnerModal(common, data);
                }
                UIElements.displayAddOwnerModal(common, data);
            };
        }
    };

    handlers['ADD_OWNER_ANSWER'] = function(common, data) {
        var content = data.content;
        var msg = content.msg;

        // Display the notification
        var name = Util.fixHTML(msg.content.user.displayName) || Messages.anonymous;
        var title = Util.fixHTML(msg.content.title);
        var key = 'owner_request_' + (msg.content.answer ? 'accepted' : 'declined');
        content.getFormatText = function() {
            return Messages._getKey(key, [name, title]);
        };
        if (!content.archived) {
            content.dismissHandler = defaultDismiss(common, data);
        }
    };

    handlers['RM_OWNER'] = function(common, data) {
        var content = data.content;
        var msg = content.msg;

        // Display the notification
        var name = Util.fixHTML(msg.content.user.displayName) || Messages.anonymous;
        var title = Util.fixHTML(msg.content.title);
        var key = 'owner_removed' + (msg.content.pending ? 'Pending' : '');
        content.getFormatText = function() {
            return Messages._getKey(key, [name, title]);
        };
        if (!content.archived) {
            content.dismissHandler = defaultDismiss(common, data);
        }
    };

    handlers['INVITE_TO_TEAM'] = function(common, data) {
        var content = data.content;
        var msg = content.msg;

        // Display the notification
        var name = Util.fixHTML(msg.content.user.displayName) || Messages.anonymous;
        var teamName = Util.fixHTML(Util.find(msg, ['content', 'team', 'metadata', 'name'])  || '');
        content.getFormatText = function() {
            var text = Messages._getKey('team_invitedToTeam', [name, teamName]);
            return text;
        };
        if (!content.archived) {
            content.handler = function() {
                UIElements.displayInviteTeamModal(common, data);
            };
        }
    };

    handlers['KICKED_FROM_TEAM'] = function(common, data) {
        var content = data.content;
        var msg = content.msg;

        // Display the notification
        var name = Util.fixHTML(msg.content.user.displayName) || Messages.anonymous;
        var teamName = Util.fixHTML(Util.find(msg, ['content', 'teamName'])  || '');
        content.getFormatText = function() {
            var text = Messages._getKey('team_kickedFromTeam', [name, teamName]);
            return text;
        };
        if (!content.archived) {
            content.dismissHandler = defaultDismiss(common, data);
        }
    };

    handlers['INVITE_TO_TEAM_ANSWER'] = function(common, data) {
        var content = data.content;
        var msg = content.msg;

        // Display the notification
        var name = Util.fixHTML(msg.content.user.displayName) || Messages.anonymous;
        var teamName = Util.fixHTML(Util.find(msg, ['content', 'team', 'metadata', 'name'])  || '') ||
            Util.fixHTML(Util.find(msg, ['content', 'teamName']));
        var key = 'team_' + (msg.content.answer ? 'accept' : 'decline') + 'Invitation';
        content.getFormatText = function() {
            return Messages._getKey(key, [name, teamName]);
        };
        if (!content.archived) {
            content.dismissHandler = defaultDismiss(common, data);
        }
    };

    handlers['COMMENT_REPLY'] = function(common, data) {
        var content = data.content;
        var msg = content.msg;

        // Display the notification
        //var name = Util.fixHTML(msg.content.user.displayName) || Messages.anonymous;
        var comment = Util.fixHTML(msg.content.comment).slice(0, 20).trim();
        if (msg.content.comment.length > 20) {
            comment += '...';
        }
        var title = Util.fixHTML(msg.content.title || Messages.unknownPad);
        var href = msg.content.href;

        content.getFormatText = function() {
            return Messages._getKey('comments_notification', [comment, title]);
        };
        if (href) {
            content.handler = function() {
                common.openURL(href);
                defaultDismiss(common, data)();
            };
        }
        if (!content.archived) {
            content.dismissHandler = defaultDismiss(common, data);
        }
    };

    handlers['MENTION'] = function(common, data) {
        var content = data.content;
        var msg = content.msg;

        // Display the notification
        var name = Util.fixHTML(msg.content.user.displayName) || Messages.anonymous;
        var title = Util.fixHTML(msg.content.title || Messages.unknownPad);
        var href = msg.content.href;

        content.getFormatText = function() {
            return Messages._getKey('mentions_notification', [name, title]);
        };
        if (href) {
            content.handler = function() {
                common.openURL(href);
                defaultDismiss(common, data)();
            };
        }
        if (!content.archived) {
            content.dismissHandler = defaultDismiss(common, data);
        }
    };

    handlers['MOVE_TODO'] = function(common, data) {
        var content = data.content;
        var msg = content.msg;

        // Display the notification
        var title = Util.fixHTML(Messages.type.todo);
        var href = msg.content.href;

        content.getFormatText = function() {
            return Messages._getKey('todo_move', [title]);
        };
        if (href) {
            content.handler = function() {
                common.openURL(href);
                defaultDismiss(common, data)();
            };
        }
        if (!content.archived) {
            content.dismissHandler = defaultDismiss(common, data);
        }
    };


    // NOTE: don't forget to fixHTML everything returned by "getFormatText"

    return {
        add: function(common, data) {
            var type = data.content.msg.type;

            if (handlers[type]) {
                handlers[type](common, data);
                // add getters to access simply some informations
                data.content.isClickable = typeof data.content.handler === "function";
                data.content.isDismissible = typeof data.content.dismissHandler === "function";
            } else {
                data.content.dismissHandler = defaultDismiss(common, data);
                data.content.isDismissible = typeof data.content.dismissHandler === "function";
            }
        },
        remove: function(common, data) {
            common.removeFriendRequest(data.hash);
        },
        allowed: Object.keys(handlers)
    };
});
