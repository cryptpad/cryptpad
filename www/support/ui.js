define([
    'jquery',
    '/api/config',
    '/common/hyperscript.js',
    '/common/common-interface.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/common/clipboard.js',
    '/common/common-ui-elements.js',
    '/customize/messages.js',
], function ($, ApiConfig, h, UI, Hash, Util, Clipboard, UIElements, Messages) {

    var send = function (ctx, id, type, data, dest) {
        var common = ctx.common;
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
            edPublic: privateData.edPublic,
            notifications: user.notifications,
        };

        if (typeof(ctx.pinUsage) === 'object') {
            // pass pin.usage, pin.limit, and pin.plan if supplied
            Object.keys(ctx.pinUsage).forEach(function (k) {
                data.sender[k] = ctx.pinUsage[k];
            });
        }

        data.id = id;
        data.time = +new Date();

        var teams = privateData.teams || {};
        if (!ctx.isAdmin) {
            data.sender.userAgent = window.navigator && window.navigator.userAgent;
            data.sender.blockLocation = privateData.blockLocation || '';
            data.sender.teams = Object.keys(teams).map(function (key) {
                var team = teams[key];
                if (!teams) { return; }
                var ret = {};
                ['edPublic', 'owner', 'viewer', 'hasSecondaryKey', 'validKeys'].forEach(function (k) {
                    ret[k] = team[k];
                });
                return ret;
            }).filter(Boolean);
        }

        // Send the message to the admin mailbox and to the user mailbox
        common.mailbox.sendTo(type, data, {
            channel: supportChannel,
            curvePublic: supportKey
        });
        common.mailbox.sendTo(type, data, {
            channel: dest.channel,
            curvePublic: dest.curvePublic
        });

        if (ctx.isAdmin) {
            common.mailbox.sendTo('SUPPORT_MESSAGE', {}, {
                channel: dest.notifications,
                curvePublic: dest.curvePublic
            });
        }
    };

    var sendForm = function (ctx, id, form, dest) {
        var $form = $(form);
        var $cat = $form.find('.cp-support-form-category');
        var $title = $form.find('.cp-support-form-title');
        var $content = $form.find('.cp-support-form-msg');
        // TODO block submission until pending uploads are complete?
        var $attachments = $form.find('.cp-support-attachments');

        var category = $cat.val().trim();
        /*
        // || ($form.closest('.cp-support-list-ticket').data('cat') || "").trim();
        // Messages.support_formCategoryError = "Error: category is empty"; // TODO ensure this is translated before use

        if (!category) {
            console.log($cat);
            return void UI.alert(Messages.support_formCategoryError);
        }
        */

        var title = $title.val().trim();
        if (!title) {
            return void UI.alert(Messages.support_formTitleError);
        }
        var content = $content.val().trim();
        if (!content) {
            return void UI.alert(Messages.support_formContentError);
        }
        $cat.val('');
        $content.val('');
        $title.val('');

        var attachments = [];
        $attachments.find('> span').each(function (i, el) {
            var $el = $(el);
            attachments.push({
                href: $el.attr('data-href'),
                name: $el.attr('data-name')
            });
        });
        $attachments.html('');

        send(ctx, id, 'TICKET', {
            category: category,
            title: title,
            attachments: attachments,
            message: content,
        }, dest);

        return true;
    };

    var makeCategoryDropdown = function (ctx, container, onChange, all) {
        var categories = ['account', 'data', 'bug', 'other'];
        if (all) { categories.push('all'); }
        categories = categories.map(function (key) {
            return {
                tag: 'a',
                content: h('span', Messages['support_cat_'+key]),
                action: function () {
                    onChange(key);
                }
            };
        });
        var dropdownCfg = {
            text: Messages.support_category,
            angleDown: 1,
            options: categories,
            container: $(container),
            isSelect: true
        };
        var $select = UIElements.createDropdown(dropdownCfg);
        $select.find('button').addClass('btn');
        return $select;
    };

    var makeForm = function (ctx, cb, title) {
        var button;

        if (typeof(cb) === "function") {
            button = h('button.btn.btn-primary.cp-support-list-send', Messages.contacts_send);
            $(button).click(cb);
        }

        var cancel = title ? h('button.btn.btn-secondary', Messages.cancel) : undefined;

        var category = h('input.cp-support-form-category', {
            type: 'hidden',
            value: ''
        });
        var catContainer = h('div.cp-dropdown-container' + (title ? '.cp-hidden': ''));
        makeCategoryDropdown(ctx, catContainer, function (key) {
            $(category).val(key);
        });

        var attachments, addAttachment;

        var content = [
            h('hr'),
            category,
            catContainer,
            h('br'),
            h('input.cp-support-form-title' + (title ? '.cp-hidden' : ''), {
                placeholder: Messages.support_formTitle,
                type: 'text',
                value: title || ''
            }),
            cb ? undefined : h('br'),
            h('textarea.cp-support-form-msg', {
                placeholder: Messages.support_formMessage
            }),
            h('label', Messages.support_attachments),
            attachments = h('div.cp-support-attachments'),
            addAttachment = h('button.btn', Messages.support_addAttachment),
            h('hr'),
            button,
            cancel
        ];

        $(addAttachment).click(function () {
            var $input = $('<input>', {
                'type': 'file',
                'style': 'display: none;',
                'multiple': 'multiple',
                'accept': 'image/*'
            }).on('change', function (e) {
                var files = Util.slice(e.target.files);
                files.forEach(function (file) {
                    var ev = {};
                    ev.callback = function (data) {
                        var x, a;
                        var span = h('span', {
                            'data-name': data.name,
                            'data-href': data.url
                        }, [
                            x = h('i.fa.fa-times'),
                            a = h('a', {
                                href: '#'
                            }, data.name)
                        ]);
                        $(x).click(function () {
                            $(span).remove();
                        });
                        $(a).click(function (e) {
                            e.preventDefault();
                            ctx.common.openURL(data.url);
                        });

                        $(attachments).append(span);
                    };
                    // The empty object allows us to bypass the file upload modal
                    ctx.FM.handleFile(file, ev, {});
                });
            });
            $input.click();
        });

        var form = h('div.cp-support-form-container', content);

        $(cancel).click(function () {
            $(form).closest('.cp-support-list-ticket').find('.cp-support-list-actions').show();
            $(form).remove();
        });

        return form;
    };

    var makeTicket = function (ctx, $div, content, onHide) {
        var common = ctx.common;
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();

        var ticketTitle = content.title + ' (#' + content.id + ')';
        var ticketCategory;
        var answer = h('button.btn.btn-primary.cp-support-answer', Messages.support_answer);
        var close = h('button.btn.btn-danger.cp-support-close', Messages.support_close);
        var hide = h('button.btn.btn-danger.cp-support-hide', Messages.support_remove);

        var actions = h('div.cp-support-list-actions', [
            answer,
            close,
            hide
        ]);

        var url;
        if (ctx.isAdmin) {
            ticketCategory = Messages['support_cat_'+(content.category || 'all')] + ' - ';
            url = h('button.btn.btn-primary.fa.fa-clipboard');
            $(url).click(function () {
                var link = privateData.origin + privateData.pathname + '#' + 'support-' + content.id;
                var success = Clipboard.copy(link);
                if (success) { UI.log(Messages.shareSuccess); }
            });
        }

        var $ticket = $(h('div.cp-support-list-ticket', {
            'data-cat': content.category,
            'data-id': content.id
        }, [
            h('h2', [ticketCategory, ticketTitle, url]),
            actions
        ]));

        /*
        $(close).click(function () {
            send(ctx, content.id, 'CLOSE', {}, content.sender);
        });

        $(hide).click(function () {
            if (typeof(onHide) !== "function") { return; }
            onHide();
        });
        */

        UI.confirmButton(close, {
            classes: 'btn-danger'
        }, function() {
            send(ctx, content.id, 'CLOSE', {}, content.sender);
            $(close).hide();
        });
        UI.confirmButton(hide, {
            classes: 'btn-danger'
        }, function() {
            if (typeof(onHide) !== "function") { return; }
            onHide(hide);
        });

        $(answer).click(function () {
            $ticket.find('.cp-support-form-container').remove();
            $(actions).hide();
            var form = makeForm(ctx, function () {
                var sent = sendForm(ctx, content.id, form, content.sender);
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

    var makeMessage = function (ctx, content, hash) {
        var common = ctx.common;
        var isAdmin = ctx.isAdmin;
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();

        // Check content.sender to see if it comes from us or from an admin
        var senderKey = content.sender && content.sender.edPublic;
        var fromMe = senderKey === privateData.edPublic;
        var fromAdmin = ctx.adminKeys.indexOf(senderKey) !== -1;
        var fromPremium = Boolean(content.sender.plan);

        var userData = h('div.cp-support-showdata', [
            Messages.support_showData,
            h('pre.cp-support-message-data', JSON.stringify(content.sender, 0, 2))
        ]);
        $(userData).click(function () {
            $(userData).find('pre').toggle();
        }).find('pre').click(function (ev) {
            ev.stopPropagation();
        });

        var attachments = (content.attachments || []).map(function (obj) {
            if (!obj || !obj.name || !obj.href) { return; }
            // only support files explicitly beginning with /file/ so that users can't link outside of the instance
            if (!/^\/file\//.test(obj.href)) { return; }
            var a = h('a', {
                href: '#'
            }, obj.name);
            $(a).click(function (e) {
                e.preventDefault();
                ctx.common.openURL(obj.href);
            });
            return h('span', [
                a
            ]);
        });

        var adminClass = (fromAdmin? '.cp-support-fromadmin': '');
        var premiumClass = (fromPremium && !fromAdmin? '.cp-support-frompremium': '');
        var name = Util.fixHTML(content.sender.name) || Messages.anonymous;
        return h('div.cp-support-list-message' + adminClass + premiumClass, {
            'data-hash': hash
        }, [
            h('div.cp-support-message-from' + (fromMe ? '.cp-support-fromme' : ''), [
                UI.setHTML(h('span'), Messages._getKey('support_from', [name])),
                h('span.cp-support-message-time', content.time ? new Date(content.time).toLocaleString() : '')
            ]),
            h('pre.cp-support-message-content', content.message),
            h('div.cp-support-attachments', attachments),
            isAdmin ? userData : undefined,
        ]);
    };

    var makeCloseMessage = function (ctx, content, hash) {
        var common = ctx.common;
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        var fromMe = content.sender && content.sender.edPublic === privateData.edPublic;

        var name = Util.fixHTML(content.sender.name) || Messages.anonymous;
        return h('div.cp-support-list-message', {
            'data-hash': hash
        }, [
            h('div.cp-support-message-from' + (fromMe ? '.cp-support-fromme' : ''), [
                UI.setHTML(h('span'), Messages._getKey('support_from', [name])),
                h('span.cp-support-message-time', content.time ? new Date(content.time).toLocaleString() : '')
            ]),
            h('pre.cp-support-message-content', Messages.support_closed)
        ]);
    };

    var create = function (common, isAdmin, pinUsage) {
        var ui = {};
        var ctx = {
            common: common,
            isAdmin: isAdmin,
            pinUsage: pinUsage || false,
            adminKeys: Array.isArray(ApiConfig.adminKeys)?  ApiConfig.adminKeys.slice(): [],
        };

        var fmConfig = {
            body: $('body'),
            onUploaded: function (ev, data) {
                if (ev.callback) {
                    ev.callback(data);
                }
            }
        };
        ctx.FM = common.createFileManager(fmConfig);

        ui.sendForm = function (id, form, dest) {
            return sendForm(ctx, id, form, dest);
        };
        ui.makeForm = function (cb, title) {
            return makeForm(ctx, cb, title);
        };
        ui.makeCategoryDropdown = function (container, onChange, all) {
            return makeCategoryDropdown(ctx, container, onChange, all);
        };
        ui.makeTicket = function ($div, content, onHide) {
            return makeTicket(ctx, $div, content, onHide);
        };
        ui.makeMessage = function (content, hash) {
            return makeMessage(ctx, content, hash);
        };
        ui.makeCloseMessage = function (content, hash) {
            return makeCloseMessage(ctx, content, hash);
        };
        return ui;
    };

    return {
        create: create
    };
});
