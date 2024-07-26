// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/common/hyperscript.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/common-util.js',
    '/common/common-constants.js',
    '/customize/messages.js',
    '/customize/pages.js',
    'tui-date-picker'
], function($, h, Hash, UI, UIElements, Util, Constants, Messages, Pages, DatePicker) {

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
        var key = type === 'drive' ? 'notification_folderShared' : // Msg.notification_folderSharedTeam
            (type === 'file' ? 'notification_fileShared' :  // Msg.notification_fileSharedTeam
                'notification_padShared'); // Msg.notification_padSharedTeam

        if (msg.content.isStatic) {
            key = 'notification_linkShared'; // Msg.notification_linkShared;
        }

        var teamNotification = /^team-/.test(data.type) && Number(data.type.slice(5));
        var teamName = '';
        if (teamNotification) {
            var privateData = common.getMetadataMgr().getPrivateData();
            var teamsData = Util.tryParse(JSON.stringify(privateData.teams)) || {};
            var team = teamsData[teamNotification];
            if (!team || !team.name) { return; }
            key += "Team";
            teamName = Util.fixHTML(team.name);
        }

        var name = Util.fixHTML(msg.content.name) || Messages.anonymous;
        var title = Util.fixHTML(msg.content.title);
        content.getFormatText = function() {
            return Messages._getKey(key, [name, title, teamName]);
        };
        content.handler = function() {
            if (msg.content.isStatic) {
                UIElements.displayOpenLinkModal(common, {
                    curve: msg.author,
                    href: msg.content.href,
                    name: name,
                    title: title
                }, defaultDismiss(common, data));
                return;
            }
            var obj = {
                p: msg.content.isTemplate ? ['template'] : undefined,
                t: teamNotification || undefined,
                f: 1,
                pw: msg.content.password || ''
            };
            common.openURL(Hash.getNewPadURL(msg.content.href, obj));
            defaultDismiss(common, data)();
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
            return Messages._getKey('owner_request', [name, title]); // Msg.owner_request_accepted, .owner_request_declined
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
        var key = 'owner_removed' + (msg.content.pending ? 'Pending' : ''); // Msg.owner_removed, owner_removedPending
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

    handlers['INVITE_TO_TEAM_ANSWERED'] = function(common, data) {
        var content = data.content;
        var msg = content.msg;

        // Display the notification
        var name = Util.fixHTML(msg.content.user.displayName) || Messages.anonymous;
        var teamName = Util.fixHTML(Util.find(msg, ['content', 'team', 'metadata', 'name'])  || '') ||
            Util.fixHTML(Util.find(msg, ['content', 'teamName']));
        var key = 'team_' + (msg.content.answer ? 'accept' : 'decline') + 'Invitation'; // Msg.team_acceptInvitation, team_declineInvitation
        content.getFormatText = function() {
            return Messages._getKey(key, [name, teamName]);
        };
        if (!content.archived) {
            content.dismissHandler = defaultDismiss(common, data);
        }
    };

    handlers['FORM_RESPONSE'] = function(common, data) {
        var content = data.content;
        var msg = content.msg;

        // Display the notification
        var title = Util.fixHTML(msg.content.title || Messages.unknownPad);
        var href = msg.content.href;

        content.getFormatText = function() {
            return Messages._getKey('form_responseNotification', [title]);
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

    handlers['SF_DELETED'] = function(common, data) {
        var content = data.content;
        var msg = content.msg;

        // Display the notification
        var title = Util.fixHTML(msg.content.title);
        var teamName = Util.fixHTML(msg.content.teamName);

        content.getFormatText = function() {
            if (teamName) {
                return Messages._getKey('dph_sf_destroyed_team', [title, teamName]);
            }
            return Messages._getKey('dph_sf_destroyed', [title]);
        };
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

    handlers['SAFE_LINKS_DEFAULT'] = function (common, data) {
        var content = data.content;
        content.getFormatText = function () {
            var msg = Pages.setHTML(h('span'), Messages.settings_safeLinkDefault);
            var i = msg.querySelector('i');
            if (i) { i.classList = 'fa fa-shhare-alt'; }
            return msg.innerHTML;
        };

        content.handler = function () {
            common.openURL('/settings/#security');
        };
        if (!content.archived) {
            content.dismissHandler = defaultDismiss(common, data);
        }
    };

    handlers['BROADCAST_SURVEY'] = function (common, data) {
        var content = data.content;
        var msg = content.msg.content;
        content.getFormatText = function () {
            return Messages.broadcast_newSurvey;
        };
        content.handler = function () {
            common.openUnsafeURL(msg.url);
            defaultDismiss(common, data)();
        };
        if (!content.archived) {
            content.dismissHandler = defaultDismiss(common, data);
        }
    };

    handlers['NOTIF_TICKET'] = function (common, data) {
        var content = data.content;
        var msg = content.msg.content;
        content.getFormatText = function () {
            let title = Util.fixHTML(msg.title);
            let text = msg.isAdmin ? Messages.support_notification :
                        Messages._getKey('support_userNotification', [title]);
            return text;
        };
        content.handler = function () {
            let id =  Util.hexToBase64(msg.channel).slice(0,10);
            let url = msg.isAdmin ? '/support/#tickets' : `/moderation/#open-${id}`;
            common.openURL(url);
            defaultDismiss(common, data)();
        };
        if (!content.archived) {
            content.dismissHandler = defaultDismiss(common, data);
        }
    };
    handlers['ADD_MODERATOR'] = function (common, data) {
        var content = data.content;
        content.getFormatText = function () {
            return Messages.support_moderatorNotification;
        };
        content.handler = function () {
            common.openURL('/moderation/');
            defaultDismiss(common, data)();
        };
        if (!content.archived) {
            content.dismissHandler = defaultDismiss(common, data);
        }
    };

    handlers['BROADCAST_CUSTOM'] = function (common, data) {
        var content = data.content;
        var msg = content.msg.content;
        var text = msg.content;
        var defaultL = msg.defaultLanguage;
        var myLang = data.lang || Messages._languageUsed;
        // Check if our language is available
        var toShow = text[myLang];
        // Otherwise, fallback to the default language if it exists
        if (!toShow && defaultL) { toShow = text[defaultL]; }
        // No translation available, dismiss
        if (!toShow) { return defaultDismiss(common, data)(); }

        var slice = toShow.length > 200;
        var unsafe = toShow;
        toShow = Util.fixHTML(toShow);

        content.getFormatText = function () {
            if (slice) {
                return toShow.slice(0, 200) + '...';
            }
            return toShow;
        };
        if (slice) {
            content.handler = function () {
                var content = h('div', [
                    h('h4', Messages.broadcast_newCustom),
                    h('div.cp-admin-message', unsafe) // Use unsafe string, hyperscript is safe
                ]);
                UI.alert(content);
            };
        }
        if (!content.archived) {
            content.dismissHandler = defaultDismiss(common, data);
        }
    };

    handlers['REMINDER'] = function (common, data) {
        var content = data.content;
        var msg = content.msg.content;
        var missed = content.msg.missed;
        var start = msg.start;
        var title = Util.fixHTML(msg.title);
        content.handler = function () {
            var priv = common.getMetadataMgr().getPrivateData();
            var time = Util.find(data, ['content', 'msg', 'content', 'start']);
            if (priv.app === "calendar" && window.APP && window.APP.moveToDate) {
                return void window.APP.moveToDate(time);
            }
            var url = Hash.hashToHref('', 'calendar');
            var optsUrl = Hash.getNewPadURL(url, {
                time: time
            });
            common.openURL(optsUrl);
        };
        content.getFormatText = function () {
            var now = +new Date();

            // Events that have already started
            var wasRefresh = content.autorefresh;
            content.autorefresh = false;

            var nowDateStr = new Date().toLocaleDateString();
            var startDate = new Date(start);
            if (msg.isAllDay && msg.startDay) {
                startDate = DatePicker.parseDate(msg.startDay);
            }

            // Missed events
            if (start < now && missed) {
                return Messages._getKey('reminder_missed', [title, startDate.toLocaleString()]);
            }
            // Starting now
            if (start < now && wasRefresh) {
                return Messages._getKey('reminder_now', [title]);
            }
            // In progress, is all day
            if (start < now && msg.isAllDay) {
                return Messages._getKey('reminder_inProgressAllDay', [title]);
            }
            // In progress, normal event
            if (start < now) {
                return Messages._getKey('reminder_inProgress', [title, startDate.toLocaleString()]);
            }

            // Not started yet

            // No precise time for allDay events
            if (msg.isAllDay) {
                return Messages._getKey('reminder_date', [title, startDate.toLocaleDateString()]);
            }

            // In less than an hour: show countdown in minutes
            if ((start - now) < 3600000) {
                var minutes = Math.round((start - now) / 60000);
                content.autorefresh = true;
                return Messages._getKey('reminder_minutes', [title, minutes]);
            }

            // Not today: show full date
            if (nowDateStr !== startDate.toLocaleDateString()) {
                return Messages._getKey('reminder_date', [title, startDate.toLocaleString()]);
            }

            // Today: show time
            return Messages._getKey('reminder_time', [title, startDate.toLocaleTimeString()]);
        };
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
