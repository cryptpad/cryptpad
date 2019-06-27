define([
    'jquery',
    '/api/config',
    '/common/hyperscript.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/customize/messages.js',
], function ($, ApiConfig, h, Hash, Util, Messages) {

    var showError = function (form, msg) {
        if (!msg) {
            return void $(form).find('.cp-support-form-error').text('').hide();
        }
        $(form).find('.cp-support-form-error').text(msg).show();
    };

    var send = function (common, id, type, data, dest) {
        var supportKey = ApiConfig.supportMailbox;
        var supportChannel = Hash.getChannelIdFromKey(supportKey);
        var metadataMgr = common.getMetadataMgr();
        var user = metadataMgr.getUserData();
        var privateData = metadataMgr.getPrivateData();

        data = data || {};

        data.sender = {
            name: user.name,
            channel: privateData.support,
            curvePublic: user.curvePublic,
            edPublic: privateData.edPublic
        };
        data.id = id;
        data.time = +new Date();

        // Send the message to the admin mailbox and to the user mailbox
        common.mailbox.sendTo(type, data, {
            channel: supportChannel,
            curvePublic: supportKey
        });
        common.mailbox.sendTo(type, data, {
            channel: dest.channel,
            curvePublic: dest.curvePublic
        });
    };

    var sendForm = function (common, id, form, dest) {
        var $title = $(form).find('.cp-support-form-title');
        var $content = $(form).find('.cp-support-form-msg');

        var title = $title.val();
        if (!title) {
            return void showError(form, Messages.support_formTitleError || 'title error'); // XXX
        }
        var content = $content.val();
        if (!content) {
            return void showError(form, Messages.support_formContentError || 'content error'); // XXX
        }
        // Success: hide any error
        showError(form, null);
        $content.val('');
        $title.val('');

        send(common, id, 'TICKET', {
            title: title,
            message: content,
        }, dest);

        return true;
    };

    var makeForm = function (cb, title) {
        var button;

        if (typeof(cb) === "function") {
            button = h('button.btn.btn-primary.cp-support-list-send', Messages.support_send || 'Send'); // XXX
            $(button).click(cb);
        }

        var cancel = title ? h('button.btn.btn-secondary', Messages.cancel) : undefined;

        var content = [
            h('hr'),
            h('div.cp-support-form-error'),
            h('label' + (title ? '.cp-hidden' : ''), Messages.support_formTitle || 'title...'), // XXX
            h('input.cp-support-form-title' + (title ? '.cp-hidden' : ''), {
                placeholder: Messages.support_formTitlePlaceholder || 'title here...', // XXX
                value: title || ''
            }),
            cb ? undefined : h('br'),
            h('label', Messages.support_formMessage || 'content...'), // XXX
            h('textarea.cp-support-form-msg', {
                placeholder: Messages.support_formMessagePlaceholder || 'describe your problem here...' // XXX
            }),
            h('hr'),
            button,
            cancel
        ];

        var form = h('div.cp-support-form-container', content);

        $(cancel).click(function () {
            $(form).closest('.cp-support-list-ticket').find('.cp-support-list-actions').show();
            $(form).remove();
        });

        return form;
    };

    var makeTicket = function ($div, common, content, onHide) {
        var ticketTitle = content.id + ' - ' + content.title;
        var answer = h('button.btn.btn-primary.cp-support-answer', Messages.support_answer || 'Answer'); // XXX
        var close = h('button.btn.btn-danger.cp-support-close', Messages.support_close || 'Close'); // XXX
        var hide = h('button.btn.btn-danger.cp-support-hide', Messages.support_remove || 'Remove'); // XXX

        var actions = h('div.cp-support-list-actions', [
            answer,
            close,
            hide
        ]);

        var $ticket = $(h('div.cp-support-list-ticket', {
            'data-id': content.id
        }, [
            h('h2', ticketTitle),
            actions
        ]));

        $(close).click(function () {
            send(common, content.id, 'CLOSE', {}, content.sender);
        });

        $(hide).click(function () {
            if (typeof(onHide) !== "function") { return; }
            onHide();
        });

        $(answer).click(function () {
            $ticket.find('.cp-support-form-container').remove();
            $(actions).hide();
            var form = makeForm(function () {
                var sent = sendForm(common, content.id, form, content.sender);
                if (sent) {
                    $(actions).show();
                    $(form).remove();
                }
            }, content.title);
            $ticket.append(form);
        });

        $div.append($ticket);
        return $ticket;
    };

    var makeMessage = function (common, content, hash, isAdmin) {
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();

        // Check content.sender to see if it comes from us or from an admin
        // XXX admins should send their personal public key?
        var fromMe = content.sender && content.sender.edPublic === privateData.edPublic;

        var userData = h('div.cp-support-showdata', [
            Messages.support_showData || 'Show/hide data', // XXX
            h('pre.cp-support-message-data', JSON.stringify(content.sender, 0, 2))
        ]);
        $(userData).click(function () {
            $(userData).find('pre').toggle();
        });

        return h('div.cp-support-list-message', {
            'data-hash': hash
        }, [
            h('div.cp-support-message-from' + (fromMe ? '.cp-support-fromme' : ''),
                //Messages._getKey('support_from', [content.sender.name, new Date(content.time)])), // XXX
                [h('b', 'From: '), content.sender.name, h('span.cp-support-message-time', content.time ? new Date(content.time).toLocaleString() : '')]),
            h('pre.cp-support-message-content', content.message),
            isAdmin ? userData : undefined,
        ]);
    };

    var makeCloseMessage = function (common, content, hash) {
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        var fromMe = content.sender && content.sender.edPublic === privateData.edPublic;

        return h('div.cp-support-list-message', {
            'data-hash': hash
        }, [
            h('div.cp-support-message-from' + (fromMe ? '.cp-support-fromme' : ''),
                //Messages._getKey('support_from', [content.sender.name, new Date(content.time)])), // XXX
                [h('b', 'From: '), content.sender.name, h('span.cp-support-message-time', content.time ? new Date(content.time).toLocaleString() : '')]),
            h('pre.cp-support-message-content', Messages.support_closed || 'Ticket closed...') // XXX
        ]);
    };

    return {
        sendForm: sendForm,
        makeForm: makeForm,
        makeTicket: makeTicket,
        makeMessage: makeMessage,
        makeCloseMessage: makeCloseMessage
    };
});
