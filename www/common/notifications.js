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
            return 'Edit access request: ' + msg.content.title + ' - ' + msg.content.user.displayName;
        }; // XXX

        // if not archived, add handlers
        content.handler = function () {
            UI.confirm("Give edit rights?", function (yes) {
                if (!yes) { return; }
                common.getSframeChannel().event('EV_GIVE_ACCESS', {
                    channel: msg.content.channel,
                    user: msg.content.user
                });
                defaultDismiss(common, data)();
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
            return 'Edit access received: ' + msg.content.title + ' from ' + msg.content.user.displayName;
        }; // XXX

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
