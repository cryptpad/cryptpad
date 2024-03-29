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
            curvePublic: user.curvePublic,
            edPublic: privateData.edPublic,
            notifications: user.notifications
        };

        if (ctx.isAdmin && ctx.anonymous) {
            data.sender = {
                name: Messages.support_team,
                accountName: 'support'
                // XXX send edPublic? or keep it private
            };
        }

        if (typeof(ctx.pinUsage) === 'object') {
            // pass pin.usage, pin.limit, and pin.plan if supplied
            data.sender.quota = ctx.pinUsage;
        }

        if (!ctx.isAdmin) {
            data.sender.drive = privateData.driveChannel;
            data.sender.accountName = privateData.accountName;
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

    var getFormData = function (ctx, form, restore) {
        var $form = $(form);
        var $cat = $form.find('.cp-support-form-category');
        var $title = $form.find('.cp-support-form-title');
        var $content = $form.find('.cp-support-form-msg');
        // TODO block submission until pending uploads are complete?
        var $attachments = $form.find('.cp-support-attachments');

        var category = $cat.val().trim();
        var title = $title.val().trim();
        if (!title && !restore) {
            return void UI.alert(Messages.support_formTitleError);
        }
        var content = $content.val().trim();
        if (!content && !restore) {
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
        }).filter(Boolean);
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

    var getAnswerAs = function (ctx) {
        var common = ctx.common;
        var metadataMgr = common.getMetadataMgr();
        var user = metadataMgr.getUserData();
        var answerName = Util.fixHTML(ctx.anonymous ? Messages.support_team : user.name);
        return Messages._getKey('support_answerAs', [answerName]);
    };

    var makeForm = function (ctx, opts, cb) {
        let { oldData, recorded, title, hideNotice } = opts || {};
        var button;

        if (typeof(cb) === "function") {
            button = h('button.btn.btn-primary.cp-support-list-send', Messages.contacts_send);
            $(button).click(cb);
        }

        var cancel = title ? h('button.btn.btn-secondary.cp-support-reply-cancel', Messages.cancel)
                        : undefined;

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


        var answerAs = UI.setHTML(h('span.cp-support-answeras'), getAnswerAs(ctx));

        let textarea = h('textarea.cp-support-form-msg', {
            placeholder: Messages.support_formMessage
        }, (oldData && oldData.message) || '');

        let insertText = (text) => {
            let start = textarea.selectionStart;
            let end = textarea.selectionEnd;
            if (start > end) {
                let _end = end;
                end = start;
                start = _end;
            }
            let oldVal = $(textarea).val();
            let before = oldVal.slice(0, start);
            let after = oldVal.slice(end);
            $(textarea).val(`${before}${text}${after}`);
            setTimeout(() => { $(textarea).focus(); });
        };

        let recordedContent = h('div.cp-support-recorded');
        let $recorded = $(recordedContent);

        let updateRecorded = (recorded) => {
            $recorded.empty();
            if (!recorded || !Object.keys(recorded.all).length) { return; }
            $recorded.append(h('span.cp-support-recorded-insert',
                                    Messages.support_insertRecorded));
            let $span = $(h('span')).appendTo($recorded);
            let $fakeMore = $(h('button.btn.btn-secondary.fa.fa-ellipsis-h.cp-fake-dropdown')).appendTo($recorded);
            let opts = [];

            let all = recorded.all;
            let sort = (a, b) => {
                let diff = all[b].count - all[a].count;
                if (diff !== 0) { return diff; }
                return a - b;
            };
            let overflow = false;
            let $label = $recorded.find('.cp-support-recorded-insert');
            let maxWidth = $recorded.width() - $label.outerWidth(true)
                                            - $fakeMore.outerWidth(true);
            Object.keys(all).sort(sort).forEach(id => {
                let action = () => {
                    insertText(all[id].content);
                    if (typeof(recorded.onClick) === "function") { recorded.onClick(id); }
                };

                // Add one-click button until the list would overflow
                // On overflow, use a dropdown instead
                if (!overflow) {
                    let button = h('button.btn.btn-secondary', id);
                    $span.append(button);
                    let current = $span.width();
                    if (current < maxWidth) {
                        return Util.onClickEnter($(button), action);
                    }
                    $(button).remove();
                    overflow = true;
                }

                opts.push({
                    tag: 'a',
                    content: h('span', id),
                    action: () => {
                        action();
                        return true;
                    }
                });
            });
            let dropdownConfig = {
                //buttonContent: [ h('i.fa.fa-ellipsis-h') ],
                buttonCls: 'btn btn-secondary fa fa-ellipsis-h',
                options: opts, // Entries displayed in the menu
                left: true, // Open to the left of the button
                common: ctx.common
            };
            let $more = UIElements.createDropdown(dropdownConfig);

            $fakeMore.remove();
            if (opts.length) { $recorded.append($more); }
        };
        setTimeout(() => { updateRecorded(recorded); });

        var content = [
            h('hr'),
            category,
            !ctx.isAdmin ? catContainer : undefined,
            notice,
            //h('br'),
            h('input.cp-support-form-title' + (title ? '.cp-hidden' : ''), {
                placeholder: Messages.support_formTitle,
                type: 'text',
                value: title || ''
            }),
            cb ? undefined : h('br'),
            textarea,
            recordedContent,
            h('label', Messages.support_attachments),
            attachments = h('div.cp-support-attachments'),
            addAttachment = h('button.btn', Messages.support_addAttachment),
            h('hr'),
            button,
            cancel,
            ctx.isAdmin? answerAs : undefined
        ];

        var _addAttachment = (name, href) => {
            var x, a;
            var span = h('span', {
                'data-name': name,
                'data-href': href
            }, [
                x = h('i.fa.fa-times'),
                a = h('a', {
                    href: '#'
                }, name)
            ]);
            $(x).click(function () {
                $(span).remove();
            });
            $(a).click(function (e) {
                e.preventDefault();
                ctx.common.openURL(href);
            });

            $(attachments).append(span);
        };
        if (oldData && Array.isArray(oldData.attachments)) {
            oldData.attachments.forEach((data) => {
                _addAttachment(data.name, data.href);
            });
        }
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
                        _addAttachment(data.name, data.url);
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

        form.updateRecorded = updateRecorded;
        return form;
    };

    var makeTicket = function (ctx, opts) {
        let { id, content, form, recorded,
              onShow, onHide, onClose, onReply, onMove, onDelete, onTag } = opts;
        var common = ctx.common;
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();

        var answer = h('button.btn.btn-primary.cp-support-answer', Messages.support_answer);
        var close = h('button.btn.btn-danger.cp-support-close', Messages.support_close);
        var remove = h('button.btn.btn-danger.cp-support-hide', Messages.support_remove);
        var _actions = [answer, close];

        if (content.closed && !ctx.isAdmin) {
            _actions = [remove]; // XXX update key to "Delete permanently" ?
        }

        let linkId =  Util.hexToBase64(id).slice(0,10);
        var actions = h('div.cp-support-list-actions', _actions);

        var adminActions;
        var adminClasses = '';
        var adminOpen;
        var ticket;
        let tagsContainer, tagsList;
        let visible = false;
        if (ctx.isAdmin) {
            // Admin custom style
            adminClasses = `.cp-not-loaded`;
            // Admin actions

            // Copy URL
            let url = h('button.btn.fa.fa-link', { title: Messages.share_linkCopy, });
            $(url).click(function (e) {
                e.stopPropagation();
                let cat = content.category === 'closed' ? 'closed' : 'open';
                var link = privateData.origin + privateData.pathname + `#${cat}-${linkId}`;
                Clipboard.copy(link, (err) => {
                    if (!err) { UI.log(Messages.shareSuccess); }
                });
            });
            if (content.category === 'legacy') { url = undefined; }


            // Load & open ticket
            let show = h('button.btn.btn-primary.cp-support-expand', Messages.admin_support_open);
            let $show = $(show);
            adminOpen = function (force, cb) {
                var $ticket = $(ticket);
                $show.prop('disabled', 'disabled');
                if (visible && !force) {
                    return onHide(ticket, id, content, function () {
                        $(tagsContainer).hide();
                        $(tagsList).show();
                        $ticket.toggleClass('cp-not-loaded', true);
                        visible = false;
                        $(ticket).find('.cp-support-reply-cancel').click();
                        $show.text(Messages.admin_support_open);
                        $show.prop('disabled', '');
                    });
                }
                onShow(ticket, id, content, function () {
                    $ticket.toggleClass('cp-not-loaded', false);
                    visible = true;
                    $show.text(Messages.admin_support_collapse);
                    $show.prop('disabled', '');
                    if (typeof(cb) === "function") { cb(); }
                });
            };
            Util.onClickEnter($show, () => { adminOpen(); });
            if (!onShow) { show = undefined; }

            // Move active/pending
            let move;
            if (onMove && !onMove.disableMove) {
                let text = onMove.isTicketActive ? Messages.support_movePending
                                                 : Messages.support_moveActive;
                move = h('button.btn.btn-secondary.fa.fa-archive', { title: text });
                Util.onClickEnter($(move), function () {
                    onMove(ticket, id, content);
                });
            }

            let tag;
            if (onTag && onTag.getAllTags) {
                tag = h('button.btn.btn-secondary.fa.fa-tags', {
                    title: Messages.fm_tagsName
                });
                if (onTag.readOnly) { tag = undefined; }
                tagsContainer = h('div.cp-support-ticket-tags');
                tagsList = h('div.cp-tags-list');
                let $list = $(tagsList);
                let redrawTags = (tags) => {
                    $list.empty();
                    (tags || []).forEach(tag => {
                        $list.append(h('span', tag));
                    });
                };
                redrawTags(content.tags);

                let $tags = $(tagsContainer).hide();
                let input = UI.dialog.textInput({id: `cp-${Util.uid()}`});
                $tags.append(input);
                let existing = onTag.getAllTags();
                let _field = UI.tokenField(input, existing).preventDuplicates(function (val) {
                    UI.warn(Messages._getKey('tags_duplicate', [val]));
                });
                _field.setTokens(content.tags || []);
                $tags.find('.token').off('click');

                let commitTags = function () {
                    setTimeout(() => {
                        let newTags = Util.deduplicateString(_field.getTokens().map(function (t) {
                            return t.toLowerCase();
                        }));
                        $tags.find('.token').off('click');
                        redrawTags(newTags);
                        onTag(id, newTags);
                    });
                };
                _field.tokenfield.on('tokenfield:createdtoken', commitTags);
                _field.tokenfield.on('tokenfield:editedoken', commitTags);
                _field.tokenfield.on('tokenfield:removedtoken', commitTags);

                $(tagsContainer).click(e => {
                    e.stopPropagation();
                });
                Util.onClickEnter($(tag), () => {
                    $list.toggle();
                    $tags.toggle();
                });
                let close = h('button.btn.btn-secondary.cp-token-close', [
                    h('i.fa.fa-times'),
                    h('span', Messages.filePicker_close)
                ]);
                Util.onClickEnter($(close), () => {
                    $list.toggle(true);
                    $tags.toggle(false);
                });
                setTimeout(() => {
                    $tags.find('.cp-tokenfield-form').append(close);
                });
            }

            adminActions = h('span.cp-support-title-buttons', [ url, move, tag, show ]);
        }

        let isPremium = content.premium ? '.cp-support-ispremium' : '';
        let title = content.title + ` (#${linkId})`;
        var name = Util.fixHTML(content.author) || Messages.anonymous;
        ticket = h(`div.cp-support-list-ticket${adminClasses}`, {
            'data-link-id': linkId,
            'data-id': id
        }, [
            h('div.cp-support-ticket-header', [
                h('div.cp-support-header-data', [
                    h('span.cp-support-ticket-title', title),
                    ctx.isAdmin ? UI.setHTML(h(`span${isPremium}`), Messages._getKey('support_from', [name])) : '',
                    h('span', new Date(content.time).toLocaleString()),
                    tagsList
                ]),
                adminActions,
            ]),
            tagsContainer,
            actions
        ]);
        ticket.open = adminOpen;

        // Add button handlers
        var $ticket = $(ticket);

        if (adminOpen) {
            $ticket.click(function (e) {
                if ($(e.target).is('button')) { return; }
                e.preventDefault();
                e.stopPropagation();
                if (!visible) { adminOpen(true); }
            });
        }

        UI.confirmButton(close, {
            classes: 'btn-danger'
        }, function() {
            $(close).remove();
            onClose(ticket, id, content);
        });
        if (!onClose) { $(close).remove(); }

        UI.confirmButton(remove, {
            classes: 'btn-danger'
        }, function() {
            $(remove).remove();
            onDelete(ticket, id, content);
        });

        var addForm = function () {
            $ticket.find('.cp-support-form-container').remove();
            $(actions).hide();

            var oldData = form ? getFormData(ctx, form, true) : {};
            form = undefined;
            var newForm = makeForm(ctx, {
                oldData,
                recorded,
                title: content.title,
                hideNotice: true
            }, function () {
                onReply(ticket, id, content, newForm);
            });
            $(newForm).attr('data-id', id);
            $ticket.append(newForm);
        };
        if (form) { addForm(); }
        Util.onClickEnter($(answer), addForm);
        if (!onReply) { $(answer).remove(); }

        return ticket;
    };

    var makeMessage = function (ctx, content) {
        var common = ctx.common;
        var isAdmin = ctx.isAdmin;
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();

        // Check content.sender to see if it comes from us or from an admin
        var senderKey = content.sender && content.sender.edPublic;
        var fromMe = senderKey === privateData.edPublic;
        var fromAdmin = ctx.moderatorKeys.indexOf(senderKey) !== -1
                        || (!senderKey && content.sender.accountName === 'support'); // XXX anon key?
        var fromPremium = Boolean(content.sender.plan || Util.find(content, ['sender', 'quota', 'plan']));

        var copyUser = h('button.btn.btn-secondary.fa.fa-clipboard.cp-support-copydata', {
            title: Messages.support_copyUserData
        });
        Util.onClickEnter($(copyUser), () => {
            let data = JSON.stringify({
                name: content.sender.name,
                curvePublic: content.sender.curvePublic,
                notifications: content.sender.notifications
            });
            Clipboard.copy(data, (err) => {
                if (!err) { UI.log(Messages.genericCopySuccess); }
            });
        });
        var userData = h('div.cp-support-showdata', [
            Messages.support_showData,
            h('pre.cp-support-message-data', [copyUser, JSON.stringify(content.sender, 0, 2)])
        ]);
        $(userData).click(function () {
            $(userData).find('.cp-support-message-data').toggle();
        }).find('*').click(function (ev) {
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
        var premiumClass = (ctx.isAdmin && fromPremium && !fromAdmin? '.cp-support-frompremium': '');
        var name = Util.fixHTML(content.sender.name) || Messages.anonymous;
        return h('div.cp-support-list-message' + adminClass + premiumClass, {}, [
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

    var makeCloseMessage = function (ctx, content) {
        var common = ctx.common;
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();

        var senderKey = content.sender && content.sender.edPublic;
        var fromMe = senderKey === privateData.edPublic;
        var fromAdmin = ctx.moderatorKeys.indexOf(senderKey) !== -1;
        var adminClass = (fromAdmin? '.cp-support-fromadmin': '');

        var name = Util.fixHTML(content.sender.name) || Messages.anonymous;
        return h('div.cp-support-list-message' + adminClass, {}, [
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
            moderatorKeys: Array.isArray(ApiConfig.moderatorKeys)?  ApiConfig.moderatorKeys.slice(): [],
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

        ui.setAnonymous = function (val) {
            ctx.anonymous = ctx.isAdmin && val;
            $('.cp-support-answeras').html(getAnswerAs(ctx));
        };
        ui.getFormData = function (form) {
            return getFormData(ctx, form);
        };
        ui.makeForm = function (opts, cb) {
            return makeForm(ctx, opts, cb);
        };
        ui.makeCategoryDropdown = function (container, onChange, all) {
            return makeCategoryDropdown(ctx, container, onChange, all);
        };
        ui.makeTicket = function (opts) {
            return makeTicket(ctx, opts);
        };
        ui.makeMessage = function (content) {
            return makeMessage(ctx, content);
        };
        ui.makeCloseMessage = function (content) {
            return makeCloseMessage(ctx, content);
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
