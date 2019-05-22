define([
    'jquery',
    '/common/hyperscript.js',
    '/common/common-ui-elements.js'
], function ($, h, UIElements) {

    var handlers = {};

    handlers['FRIEND_REQUEST'] = function (common, data, el) {
        var content = data.content;
        var msg = content.msg;

        // Check authenticity
        if (msg.author !== msg.content.curvePublic) { return; }

        common.addFriendRequest(data);

        // Display the notification
        $(el).find('.cp-notification-dismiss').attr('title', 'IGNORE').css('display', 'flex'); // XXX
        $(el).find('.cp-notification-content').addClass("cp-clickable");
        $(el).find('.cp-notification-content p')
            .html('New friend request: <b>'+msg.content.displayName+'</b>') // XXX
            .click(function () {
                UIElements.displayFriendRequestModal(common, data);
            });
    };

    handlers['ACCEPT_FRIEND_REQUEST'] = function (common, data, el) {
        var content = data.content;
        var msg = content.msg;
        $(el).find('.cp-notification-content p')
            .html('Friend request accepted: <b>'+msg.content.displayName+'</b>');
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
