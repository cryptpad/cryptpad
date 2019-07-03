define([
    'jquery',
    '/common/hyperscript.js',
    '/common/common-hash.js',
    '/common/common-ui-elements.js',
    '/customize/messages.js',
], function ($, h, Hash, UIElements, Messages) {

    var handlers = {};

    // Friend request

    handlers['FRIEND_REQUEST'] = function (common, data, el) {
        var content = data.content;
        var msg = content.msg;

        // Check authenticity
        if (msg.author !== msg.content.curvePublic) { return; }

        common.addFriendRequest(data);

        // Display the notification
        $(el).find('.cp-notification-content p')
            .html(Messages._getKey('friendRequest_notification', [msg.content.displayName || Messages.anonymous]));
        $(el).find('.cp-notification-content').addClass("cp-clickable")
            .click(function () {
                UIElements.displayFriendRequestModal(common, data);
            });
    };

    handlers['FRIEND_REQUEST_ACCEPTED'] = function (common, data, el) {
        var content = data.content;
        var msg = content.msg;
        $(el).find('.cp-notification-content p')
            .html(Messages._getKey('friendRequest_accepted', [msg.content.name || Messages.anonymous]));
        $(el).find('.cp-notification-dismiss').css('display', 'flex');
    };

    handlers['FRIEND_REQUEST_DECLINED'] = function (common, data, el) {
        var content = data.content;
        var msg = content.msg;
        $(el).find('.cp-notification-content p')
            .html(Messages._getKey('friendRequest_declined', [msg.content.name || Messages.anonymous]));
        $(el).find('.cp-notification-dismiss').css('display', 'flex');
    };

    // Share pad

    handlers['SHARE_PAD'] = function (common, data, el) {
        var content = data.content;
        var msg = content.msg;
        var type = Hash.parsePadUrl(msg.content.href).type;
        var key = type === 'drive' ? 'notification_folderShared' :
                    (type === 'file' ? 'notification_fileShared' :
                      'notification_padShared');
        $(el).find('.cp-notification-content p')
            .html(Messages._getKey(key, [msg.content.name || Messages.anonymous, msg.content.title]));
        $(el).find('.cp-notification-content').addClass("cp-clickable")
            .click(function () {
                var todo = function () { common.openURL(msg.content.href); };
                if (!msg.content.password) { return void todo(); }
                common.getSframeChannel().query('Q_SESSIONSTORAGE_PUT', {
                    key: 'newPadPassword',
                    value: msg.content.password
                }, todo);
            });
        $(el).find('.cp-notification-dismiss').css('display', 'flex');
    };

    return {
        add: function (common, data, el) {
            var type = data.content.msg.type;

            if (handlers[type]) {
                handlers[type](common, data, el);
            } else {
                $(el).find('.cp-notification-dismiss').css('display', 'flex');
            }
        },
        remove: function (common, data) {
            common.removeFriendRequest(data.hash);
        },
    };
});
