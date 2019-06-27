define([
    'jquery',
    '/common/hyperscript.js',
    '/common/common-hash.js',
    '/common/common-ui-elements.js',
    '/customize/messages.js',
], function ($, h, Hash, UIElements, Messages) {

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
        content.handler = function () {
            UIElements.displayFriendRequestModal(common, data);
        };

        // Check authenticity
        if (msg.author !== msg.content.curvePublic) { return; }

        common.addFriendRequest(data);

        // Display the notification
        content.getFormatText = function () {
            return Messages._getKey('friendRequest_notification', [msg.content.displayName || Messages.anonymous]);
        };
    };

    handlers['FRIEND_REQUEST_ACCEPTED'] = function (common, data) {
        var content = data.content;
        var msg = content.msg;
        content.dismissHandler = defaultDismiss(common, data);
        content.getFormatText = function () {
            return Messages._getKey('friendRequest_accepted', [msg.content.name || Messages.anonymous]);
        };
    };

    handlers['FRIEND_REQUEST_DECLINED'] = function (common, data) {
        var content = data.content;
        var msg = content.msg;
        content.dismissHandler = defaultDismiss(common, data);
        content.getFormatText = function () {
            return Messages._getKey('friendRequest_declined', [msg.content.name || Messages.anonymous]);
        };
    };

    // Share pad

    handlers['SHARE_PAD'] = function (common, data) {
        var content = data.content;
        var msg = content.msg;
        var type = Hash.parsePadUrl(msg.content.href).type;
        var key = type === 'drive' ? 'notification_folderShared' :
                    (type === 'file' ? 'notification_fileShared' :
                    'notification_padShared');
        content.handler = function () {
            common.openURL(msg.content.href);
        };
        content.dismissHandler = defaultDismiss(common, data);
        content.getFormatText = function () {
            return Messages._getKey(key, [msg.content.name || Messages.anonymous, msg.content.title]);
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
            } else {
                // $(el).find('.cp-notification-dismiss').css('display', 'flex'); // XXX
            }
        },
        remove: function (common, data) {
            common.removeFriendRequest(data.hash);
        },
    };
});
