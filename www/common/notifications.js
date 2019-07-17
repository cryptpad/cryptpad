define([
    'jquery',
    '/common/hyperscript.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/customize/messages.js',
], function ($, h, Hash, UI, UIElements, Messages) {

    var handlers = {};

    var defaultDismiss = function (common, data) {
        return function (e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            common.mailbox.dismiss(data, function (err) {
                if (err) { return void console.error(err); }
            });
        };
    };

    // Friend request

    handlers['FRIEND_REQUEST'] = function (common, data) {
        var content = data.content;
        var msg = content.msg;

        // Display the notification
        content.getFormatText = function () {
            return Messages._getKey('friendRequest_notification', [msg.content.displayName || Messages.anonymous]);
        };

        // Check authenticity
        if (msg.author !== msg.content.curvePublic) { return; }

        // if not archived, add handlers
        if (!content.archived) {
            content.handler = function () {
                UIElements.displayFriendRequestModal(common, data);
            };
            common.addFriendRequest(data);
        }
    };

    handlers['FRIEND_REQUEST_ACCEPTED'] = function (common, data) {
        var content = data.content;
        var msg = content.msg;
        content.getFormatText = function () {
            return Messages._getKey('friendRequest_accepted', [msg.content.name || Messages.anonymous]);
        };
        if (!content.archived) {
            content.dismissHandler = defaultDismiss(common, data);
        }
    };

    handlers['FRIEND_REQUEST_DECLINED'] = function (common, data) {
        var content = data.content;
        var msg = content.msg;
        content.getFormatText = function () {
            return Messages._getKey('friendRequest_declined', [msg.content.name || Messages.anonymous]);
        };
        if (!content.archived) {
            content.dismissHandler = defaultDismiss(common, data);
        }
    };

    // Share pad

    handlers['SHARE_PAD'] = function (common, data) {
        var content = data.content;
        var msg = content.msg;
        var type = Hash.parsePadUrl(msg.content.href).type;
        var key = type === 'drive' ? 'notification_folderShared' :
                    (type === 'file' ? 'notification_fileShared' :
                    'notification_padShared');
        content.getFormatText = function () {
            return Messages._getKey(key, [msg.content.name || Messages.anonymous, msg.content.title]);
        };
        content.handler = function () {
            var todo = function () {
                common.openURL(msg.content.href);
                defaultDismiss(common, data)();
            };
            if (!msg.content.password) { return void todo(); }
            common.getSframeChannel().query('Q_SESSIONSTORAGE_PUT', {
                key: 'newPadPassword',
                value: msg.content.password
            }, todo);
        };
        if (!content.archived) {
            content.dismissHandler = defaultDismiss(common, data);
        }
    };

    // New support message from the admins
    handlers['SUPPORT_MESSAGE'] = function (common, data) {
        var content = data.content;
        content.getFormatText = function () {
            return Messages.support_notification;
        };
        content.handler = function () {
            common.openURL('/support/');
            defaultDismiss(common, data)();
        };
    };

    handlers['REQUEST_PAD_ACCESS'] = function (common, data) {
        var content = data.content;
        var msg = content.msg;

        // Check authenticity
        if (msg.author !== msg.content.user.curvePublic) { return; }

        // Display the notification
        content.getFormatText = function () {
            return Messages._getKey('requestEdit_request', [msg.content.title, msg.content.displayName]);
        };

        // if not archived, add handlers
        content.handler = function () {
            var metadataMgr = common.getMetadataMgr();
            var priv = metadataMgr.getPrivateData();

            var link = h('a', {
                href: '#'
            }, Messages.requestEdit_viewPad);
            var verified = h('p.cp-notifications-requestedit-verified');

            if (priv.friends && priv.friends[msg.author]) {
                var f = priv.friends[msg.author];
                var $verified = $(verified);
                $verified.append(h('span.fa.fa-certificate'));
                var $avatar = $(h('span.cp-avatar')).appendTo($verified);
                $verified.append(h('p', Messages._getKey('requestEdit_verified', [f.displayName])));
                common.displayAvatar($avatar, f.avatar, f.displayName);
            }

            var div = h('div', [
                h('p', Messages._getKey('requestEdit_confirm', [msg.content.title, msg.content.displayName])),
                verified,
                link
            ]);
            $(link).click(function (e) {
                e.preventDefault();
                e.stopPropagation();
                common.openURL(msg.content.href);
            });
            UI.confirm(div, function (yes) {
                if (!yes) { return; }
                common.getSframeChannel().event('EV_GIVE_ACCESS', {
                    channel: msg.content.channel,
                    user: msg.content.user
                });
                defaultDismiss(common, data)();
            }, {
                ok: Messages.friendRequest_accept,
                cancel: Messages.requestEdit_later
            });
        };

        if (!content.archived) {
            content.dismissHandler = defaultDismiss(common, data);
        }
    };

    handlers['GIVE_PAD_ACCESS'] = function (common, data) {
        var content = data.content;
        var msg = content.msg;

        // Check authenticity
        if (msg.author !== msg.content.user.curvePublic) { return; }

        if (!msg.content.href) { return; }

        // Display the notification
        content.getFormatText = function () {
            return Messages._getKey('requestEdit_accepted', [msg.content.title, msg.content.displayName]);
        };

        // if not archived, add handlers
        content.handler = function () {
            common.openURL(msg.content.href);
            defaultDismiss(common, data)();
        };
    };

    return {
        add: function (common, data) {
            var type = data.content.msg.type;

            if (handlers[type]) {
                handlers[type](common, data);
                // add getters to access simply some informations
                data.content.isClickable = typeof data.content.handler === "function";
                data.content.isDismissible = typeof data.content.dismissHandler === "function";
            }
        },
        remove: function (common, data) {
            common.removeFriendRequest(data.hash);
        },
    };
});
