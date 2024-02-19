// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

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
    '/customize/pages.js',
], function ($, ApiConfig, h, UI, Hash, Util, Clipboard, UIElements, Messages, Pages) {

    var getDebuggingData = function (ctx, data) {
        var common = ctx.common;
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        var user = metadataMgr.getUserData();
        var teams = privateData.teams || {};
        data = data || {};
        if (data.sender) { return data; }

        data.sender = {
            name: user.name,
            accountName: privateData.accountName,
            drive: privateData.driveChannel,
            channel: privateData.support,
            curvePublic: user.curvePublic,
            edPublic: privateData.edPublic,
            notifications: user.notifications,
        };

        if (typeof(ctx.pinUsage) === 'object') {
            // pass pin.usage, pin.limit, and pin.plan if supplied
            data.sender.quota = ctx.pinUsage;
        }

        if (!ctx.isAdmin) {
            data.sender.userAgent = Util.find(window, ['navigator', 'userAgent']);
            data.sender.vendor = Util.find(window, ['navigator', 'vendor']);
            data.sender.appVersion = Util.find(window, ['navigator', 'appVersion']);
            data.sender.screenWidth = Util.find(window, ['screen', 'width']);
            data.sender.screenHeight = Util.find(window, ['screen', 'height']);
            data.sender.blockLocation = privateData.blockLocation || '';
            data.sender.teams = Object.keys(teams).map(function (key) {
                var team = teams[key];
                if (!team) { return; }
                var ret = {};
                ['channel', 'roster', 'numberPads', 'numberSf', 'edPublic', 'curvePublic', 'owner', 'viewer', 'hasSecondaryKey', 'validKeys'].forEach(function (k) {
                    ret[k] = team[k];
                });
                if (ctx.teamsUsage && ctx.teamsUsage[key]) {
                    ret.quota = ctx.teamsUsage[key];
                }
                return ret;
            }).filter(Boolean);
        }

        return data;
    };

    var send = function (ctx, id, type, data, dest) {
        var common = ctx.common;
        var supportKey = ApiConfig.supportMailbox;
        var supportChannel = Hash.getChannelIdFromKey(supportKey);
        var metadataMgr = common.getMetadataMgr();
        var user = metadataMgr.getUserData();
        var privateData = metadataMgr.getPrivateData();

        data = getDebuggingData(ctx, data);

        data.id = id;
        data.time = +new Date();

        if (!ctx.isAdmin) {
            // "dest" is the recipient that is not the admin support mailbox.
            // In the support page, make sure dest is always ourselves.
            dest.channel = privateData.support;
            dest.curvePublic = user.curvePublic;
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


    var getFormData = function (ctx, form) {
        var $form = $(form);
        var $cat = $form.find('.cp-support-form-category');
        var $title = $form.find('.cp-support-form-title');
        var $content = $form.find('.cp-support-form-msg');
        // TODO block submission until pending uploads are complete?
        var $attachments = $form.find('.cp-support-attachments');

        var category = $cat.val().trim();
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

        return getDebuggingData(ctx, {
            category: category,
            title: title,
            attachments: attachments,
            message: content,
        });
    };
    var sendForm = function (ctx, id, form, dest) {
        send(ctx, id, 'TICKET', getFormData(ctx, form), dest);
        return true;
    };

    var makeCategoryDropdown = function (ctx, container, onChange, all) {
        var categories = [
            // Msg.support_cat_data is left included because old tickets may still use it
            'account', // Msg.support_cat_account
            'drives', // Msg.support_cat_drives
            'document', // Msg.support_cat_document,
            Pages.customURLs.terms? 'abuse': undefined, // Msg.support_cat_abuse
            'bug', // Msg.support_cat_bug
            'other' // Msg.support_cat_other
        ];
        if (all) { categories.push('all'); } // Msg.support_cat_all

        categories = categories.map(function (key) {
            if (!key) { return; }
            return {
                tag: 'a',
                content: h('span', Messages['support_cat_'+key]),
                attributes: { 'data-value': key }
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
        $select.onChange.reg(onChange);
        return $select;
    };

    var documentIdDocs = Pages.localizeDocsLink('https://docs.cryptpad.org/en/user_guide/apps/general.html#properties');

    var warningLinks = {
        account: documentIdDocs,
        document: documentIdDocs,
        drives: documentIdDocs,
        abuse: Pages.customURLs.terms,
    };

    var makeForm = function (ctx, cb, title, hideNotice) {
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
        var notice;
        if (!(hideNotice || ctx.isAdmin)) {
            notice = h('div.alert.alert-info', Messages.support_warning_prompt);
        }

        var clickHandler = function (ev) {
            ev.preventDefault();
            var $link = $(this);
            var href = $link.attr('href');
            if (!href) { return; }
            ctx.common.openUnsafeURL(href);
        };

        makeCategoryDropdown(ctx, catContainer, function (text, key) {
            $(category).val(key);
            if (!notice) { return; }
            //console.log(key);
            // Msg.support_warning_abuse.support_warning_account.support_warning_bug.support_warning_document.support_warning_drives.support_warning_other
            var warning = Messages['support_warning_' + key] || '';
            var warningLink = warningLinks[key];
            if (!warningLink) {
                notice.innerText = warning;
                return;
            }
            notice.innerHTML = '';
            var content = UI.setHTML(h('span'), warning);
            var link = content.querySelector('a');
            if (link) {
                link.href = warningLink;
                link.onclick = clickHandler;
            }
            notice.appendChild(content);
        });

        var attachments, addAttachment;


        var content = [
            h('hr'),
            category,
            catContainer,
            notice,
            //h('br'),
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
            $(form).closest('.cp-support-list-ticket').find('.cp-support-list-actions').css('display', '');
            $(form).remove();
        });

        return form;
    };

    var makeTicket = function (ctx, id, content, onShow, onClose, onReply) {
        var common = ctx.common;
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();

        var answer = h('button.btn.btn-primary.cp-support-answer', Messages.support_answer);
        var close = h('button.btn.btn-danger.cp-support-close', Messages.support_close);
        var actions = h('div.cp-support-list-actions', [ answer, close ]);

        var adminActions;
        var adminClasses = '';
        if (ctx.isAdmin) {
            // Admin custom style
            let isPremium = content.premium ? '.cp-support-premium' : '';
            adminClasses = `.cp-not-loaded${isPremium}`;
            // Admin actions
            let show = h('button.btn.btn-primary.cp-support-expand', Messages.admin_support_open);
            let $show = $(show);
            let url = h('button.btn', { title: Messages.share_linkCopy, }, [
                h('i.fa.fa-link', {
                    'aria-hidden': true,
                }),
            ]);
            $(url).click(function (e) {
                e.stopPropagation();
                var link = privateData.origin + privateData.pathname + '#' + 'support-' + id;
                Clipboard.copy(link, (err) => {
                    if (!err) { UI.log(Messages.shareSuccess); }
                });
            });
            Util.onClickEnter($show, function () {
                $ticket.removeClass('cp-not-loaded');
                $show.remove();
                onShow(ticket, id, content);
            });
            adminActions = h('span.cp-support-title-buttons', [ url, show ])
        }

        var name = Util.fixHTML(content.author) || Messages.anonymous;
        var ticket = h(`div.cp-support-list-ticket${adminClasses}`, {
            'data-id': id
        }, [
            h('div.cp-support-ticket-header', [
                h('span', content.title),
                ctx.isAdmin ? UI.setHTML(h('span'), Messages._getKey('support_from', [name])) : '',
                h('span', new Date(content.time).toLocaleString()),
                adminActions,
            ]),
            actions
        ]);

        // Add button handlers
        var $ticket = $(ticket);
        UI.confirmButton(close, {
            classes: 'btn-danger'
        }, function() {
            $(close).remove();
            onClose(ticket, id, content);
        });
        $(answer).click(function () {
            $ticket.find('.cp-support-form-container').remove();
            $(actions).hide();
            var form = makeForm(ctx, function () {
                onReply(ticket, id, content, form, function () {
                    $(actions).css('display', '');
                    $(form).remove();
                });
            }, content.title, true);
            $ticket.append(form);
        });

        return ticket;
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
        var fromPremium = Boolean(content.sender.plan || Util.find(content, ['sender', 'quota', 'plan']));

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

        var displayed = content.message;
        var pre = h('pre.cp-support-message-content');
        var $pre = $(pre);
        var more;
        if (content.message.length >= 2000) {
            displayed = content.message.slice(0, 2000) + '...';
            var expand = h('button.btn.btn-secondary', Messages.admin_support_open);
            var collapse = h('button.btn.btn-secondary', Messages.admin_support_collapse);
            var $collapse = $(collapse).hide();
            var $expand = $(expand).click(function () {
                $pre.text(content.message);
                $expand.hide();
                $collapse.show();
            });
            $collapse.click(function () {
                $pre.text(displayed);
                $collapse.hide();
                $expand.show();
            });
            more = h('div', [expand, collapse]);
        }
        $pre.text(displayed);

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
            pre,
            more,
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

    var create = function (common, isAdmin, pinUsage, teamsUsage) {
        var ui = {};
        var ctx = {
            common: common,
            isAdmin: isAdmin,
            pinUsage: pinUsage || false,
            teamsUsage: teamsUsage || false,
            adminKeys: Array.isArray(ApiConfig.adminKeys)?  ApiConfig.adminKeys.slice(): [],
        };

        ctx.supportModule = common.makeUniversal('support');

        var fmConfig = {
            body: $('body'),
            noStore: true, // Don't store attachments into our drive
            onUploaded: function (ev, data) {
                if (ev.callback) {
                    ev.callback(data);
                }
            }
        };
        ctx.FM = common.createFileManager(fmConfig);

        ui.getFormData = function (form) {
            return getFormData(ctx, form);
        };
        ui.makeForm = function (cb, title, hideNotice) {
            return makeForm(ctx, cb, title, hideNotice);
        };
        ui.makeCategoryDropdown = function (container, onChange, all) {
            return makeCategoryDropdown(ctx, container, onChange, all);
        };
        ui.makeTicket = function (id, content, onShow, onClose, onReply) {
            return makeTicket(ctx, id, content, onShow, onClose, onReply);
        };
        ui.makeMessage = function (content, hash) {
            return makeMessage(ctx, content, hash);
        };
        ui.makeCloseMessage = function (content, hash) {
            return makeCloseMessage(ctx, content, hash);
        };
        ui.getDebuggingData = function (data) {
            return getDebuggingData(ctx, data);
        };

        return ui;
    };

    return {
        create: create
    };
});
