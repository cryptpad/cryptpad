// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/api/config',
    '/customize/application_config.js',
    '/common/toolbar.js',
    '/components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/inner/sidebar-layout.js',
    '/support/ui.js',

    '/components/file-saver/FileSaver.min.js',

    'css!/components/components-font-awesome/css/font-awesome.min.css',
    'less!/moderation/app-moderation.less',
], function (
    $,
    ApiConfig,
    AppConfig,
    Toolbar,
    nThen,
    SFCommon,
    h,
    Messages,
    UI,
    UIElements,
    Util,
    Hash,
    Sidebar,
    Support
    )
{
    var APP = {};
    var saveAs = window.saveAs;

    var common;
    var sframeChan;
    var events = {
        NEW_TICKET: Util.mkEvent(),
        UPDATE_TICKET: Util.mkEvent(),
        UPDATE_RIGHTS: Util.mkEvent(),
        RECORDED_CHANGE: Util.mkEvent(),
        REFRESH_FILTER: Util.mkEvent(),
        REFRESH_TAGS: Util.mkEvent()
    };

    // XXX
    Messages.support_pending = "Pending tickets:";
    /*
    Messages.support_activeListTitle = "Active tickets";
    Messages.support_pendingListTitle = "Pending tickets";
    Messages.support_activeListHint = "List of tickets that are in an active state";
    Messages.support_pendingListHint = "List of tickets that may not be updated for a while but should not be closed";
    */

    Messages.support_privacyTitle = "Answer anonymously";
    Messages.support_privacyHint = "Check this option to reply as 'The Support Team' instead of your own username";

    Messages.support_notificationsTitle = "Disable notifications";
    Messages.support_notificationsHint = "Check this option to disable notifications on new or updated ticket";

    Messages.support_openTicketTitle = "Open a ticket for a user";
    Messages.support_openTicketHint = "Create a ticket for a user. They will receive a CryptPad notification to warn them. You can copy their user data from an existing support ticket, using the Copy button in the user data.";
    Messages.support_userChannel = "User's notifications channel ID";
    Messages.support_userKey = "User's curvePublic key";
    Messages.support_invalChan = "Invalid notifications channel";

    Messages.support_pasteUserData = "Paste user data here";

    Messages.support_recordedTitle = "Prerecorded messages";
    Messages.support_recordedHint = "You can store prerecorded message in order to insert them with one click in a support ticket.";
    Messages.support_recordedList = "List of recorded messages";
    Messages.support_recordedEmpty = "No recorded messages";
    Messages.support_recordedId = "Unique Identifier";
    Messages.support_recordedContent = "Content";

    Messages.support_legacyTitle = "View old support data";
    Messages.support_legacyHint = "View tickets from the legacy system. You'll be able to recreate thse tickets on the new support system.";
    Messages.support_legacyButton = "Get active";
    Messages.support_legacyDump = "Export all";
    Messages.support_legacyClear = "Delete from my account";

    var andThen = function (common, $container, linkedTicket) {
        const sidebar = Sidebar.create(common, 'support', $container);
        const blocks = sidebar.blocks;
        APP.recorded = {};
        APP.allTags = [];
        APP.openTicketCategory = Util.mkEvent();

        // Support panel functions
        let open = [];
        let refreshAll = function () {};
        let refresh = ($container, type, _cb) => {
            let cb = Util.mkAsync(_cb || function () {});
            APP.module.execCommand('LIST_TICKETS_ADMIN', {
                type: type
            }, (tickets) => {
                console.error(tickets);
                if (tickets.error) {
                    cb();
                    if (tickets.error === 'EFORBIDDEN') {
                        return void UI.errorLoadingScreen(Messages.admin_authError || '403 Forbidden');
                    }
                    return void UI.errorLoadingScreen(tickets.error);
                }
                open = open.filter(chan => {
                    // Remove deleted tickets from memory
                    return tickets[chan];
                });
                UI.removeLoadingScreen();

                let activeForms = {};
                $container.find('.cp-support-form-container').each((i, el) => {
                    let id = $(el).attr('data-id');
                    if (!id) { return; }
                    activeForms[id] = el;
                });
                $container.empty();
                var col1 = h('div.cp-support-column', h('h1', [
                    h('span', Messages.admin_support_premium),
                    h('span.cp-support-count'),
                ]));
                var col2 = h('div.cp-support-column', h('h1', [
                    h('span', Messages.admin_support_normal),
                    h('span.cp-support-count'),
                ]));
                var col3 = h('div.cp-support-column', h('h1', [
                    h('span', Messages.admin_support_answered),
                    h('span.cp-support-count'),
                ]));
                var col4 = h('div.cp-support-column', h('h1', [
                    h('span', Messages.admin_support_closed),
                    h('span.cp-support-count'),
                ]));
                var col5 = h('div.cp-support-column', h('h1', [
                    h('span', Messages.support_pending),
                    h('span.cp-support-count'),
                ]));
                if (type === 'closed') {
                    // Only one column
                    col1 = col2 = col3 = col4;
                }
                if (type === 'pending') {
                    // Only one column
                    col1 = col2 = col3 = col5;
                }
                $container.append([col1, col2, col3]);
                var sortTicket = function (c1, c2) {
                    return tickets[c2].time - tickets[c1].time;
                };

                const onShow = function (ticket, channel, data, done) {
                    APP.module.execCommand('LOAD_TICKET_ADMIN', {
                        channel: channel,
                        curvePublic: data.authorKey,
                        supportKey: data.supportKey
                    }, function (obj) {
                        if (!Array.isArray(obj)) {
                            console.error(obj && obj.error);
                            done();
                            return void UI.warn(Messages.error);
                        }
                        var $ticket = $(ticket);
                        obj.forEach(function (msg) {
                            // Only add notifications channel if this is coming from the other user
                            if (!data.notifications && msg.sender.drive) {
                                data.notifications = Util.find(msg, ['sender', 'notifications']);
                            }
                            if (msg.close) {
                                $ticket.addClass('cp-support-list-closed');
                                return $ticket.append(APP.support.makeCloseMessage(msg));
                            }
                            if (msg.legacy && msg.messages) {
                                msg.messages.forEach(c => {
                                    $ticket.append(APP.support.makeMessage(c));
                                });
                                return;
                            }
                            $ticket.append(APP.support.makeMessage(msg));
                        });
                        if (!open.includes(channel)) { open.push(channel); }
                        done();
                    });
                };
                const onHide = function (ticket, channel, data, done) {
                    $(ticket).find('.cp-support-list-message').remove();
                    open = open.filter((chan) => {
                        return chan !== channel;
                    });
                    done();
                };
                const onReply = function (ticket, channel, data, form) {
                    var formData = APP.support.getFormData(form);
                    APP.module.execCommand('REPLY_TICKET_ADMIN', {
                        channel: channel,
                        curvePublic: data.authorKey,
                        notifChannel: data.notifications,
                        supportKey: data.supportKey,
                        ticket: formData
                    }, function (obj) {
                        if (obj && obj.error) {
                            console.error(obj && obj.error);
                            return void UI.warn(Messages.error);
                        }
                        $(ticket).find('.cp-support-list-message').remove();
                        $(ticket).find('.cp-support-form-container').remove();
                        refresh($container, type);
                    });
                };
                const onClose = function (ticket, channel, data) {
                    APP.module.execCommand('CLOSE_TICKET_ADMIN', {
                        channel: channel,
                        curvePublic: data.authorKey,
                        notifChannel: data.notifications,
                        supportKey: data.supportKey,
                        ticket: APP.support.getDebuggingData({
                            close: true
                        })
                    }, function (obj) {
                        if (obj && obj.error) {
                            console.error(obj && obj.error);
                            return void UI.warn(Messages.error);
                        }
                        refreshAll();
                    });
                };
                const onMove = function (ticket, channel) {
                    APP.module.execCommand('MOVE_TICKET_ADMIN', {
                        channel: channel,
                        from: type,
                        to: onMove.isTicketActive ? 'pending' : 'active'
                    }, function (obj) {
                        if (obj && obj.error) {
                            console.error(obj && obj.error);
                            return void UI.warn(Messages.error);
                        }
                        refreshAll();
                    });
                };
                onMove.isTicketActive = type === 'active';

                const onTag = (channel, tags) => {
                    APP.module.execCommand('SET_TAGS_ADMIN', {
                        channel, tags
                    }, function (obj) {
                        if (obj && obj.error) {
                            console.error(obj && obj.error);
                            return void UI.warn(Messages.error);
                        }
                        // XXX check deleted tags
                        (tags || []).forEach(tag => {
                            if (!APP.allTags.includes(tag)) { APP.allTags.push(tag); }
                        });
                        events.REFRESH_TAGS.fire();
                        //UI.log(Messags.saved);
                        //refreshAll();
                    });
                };
                onTag.getAllTags = () => {
                    return APP.allTags || [];
                };

                // Show tickets, reload the previously open ones and cal back
                // once everything is loaded
                let n = nThen;
                Object.keys(tickets).sort(sortTicket).forEach(function (channel) {
                    // Update allTags
                    var d = tickets[channel];
                    (d.tags || []).forEach(tag => {
                        if (!APP.allTags.includes(tag)) { APP.allTags.push(tag); }
                    });
                    // Make ticket
                    var ticket = APP.support.makeTicket({
                        id: channel,
                        content: d,
                        form: activeForms[channel],
                        recorded: APP.recorded,
                        onShow, onHide, onClose, onReply, onMove, onTag
                    });

                    var container;
                    if (d.lastAdmin) { container = col3; }
                    else if (d.premium) { container = col1; }
                    else { container = col2; }
                    $(container).append(ticket);

                    if (open.includes(channel)) {
                        n = n(waitFor => {
                            ticket.open(true, waitFor());
                        }).nThen;
                    }
                });
                // Wait for all open tickets to be loaded before calling back
                // otherwise we may have a wrong scroll position
                n(() => {
                    cb();
                });
            });
        };
        let onFilter = () => {
            let tags = APP.filterTags || [];
            APP.module.execCommand('FILTER_TAGS_ADMIN', { tags }, function (obj) {
                if (!obj || obj.error) { return; }
                $container.find('.cp-support-list-ticket').toggleClass('cp-filtered', false);
                if (obj.all || !obj.tickets || !obj.tickets.length) { return; }
                obj.tickets.forEach(id => {
                    $container.find(`.cp-support-list-ticket[data-id="${id}"]`)
                        .toggleClass('cp-filtered', true);
                });
            });
        };

        let activeContainer, pendingContainer, closedContainer;
        refreshAll = function () {
            let $rightside = sidebar.$rightside;
            let s = $rightside.scrollTop();
            nThen(waitFor => {
                APP.module.execCommand('GET_RECORDED', {}, waitFor(function (obj) {
                    if (obj && obj.error) {
                        APP.recorded = {};
                        return;
                    }
                    APP.recorded = {
                        all: obj.messages,
                        onClick: id => {
                            APP.module.execCommand('USE_RECORDED', {id}, () => {});
                        }
                    };
                }));
            }).nThen(waitFor => {
                APP.allTags = [];
                refresh($(activeContainer), 'active', waitFor());
                refresh($(pendingContainer), 'pending', waitFor());
                refresh($(closedContainer), 'closed', waitFor());
            }).nThen(() => {
                onFilter();
                events.REFRESH_TAGS.fire();
            }).nThen(waitFor => {
                if (!linkedTicket) { return; }
                let $ticket = $container.find(`[data-link-id="${linkedTicket}"]`);
                linkedTicket = undefined;
                if ($ticket.length) {
                    let ticket = $ticket[0];
                    if (typeof(ticket.open) === "function") {
                        waitFor.abort();
                        ticket.open(true, () => {
                            ticket.scrollIntoView();
                        });
                    }
                }
            }).nThen(() => {
                $rightside.scrollTop(s);
            });
        };
        let _refresh = Util.throttle(refreshAll, 500);
        events.NEW_TICKET.reg(_refresh);
        events.UPDATE_TICKET.reg(_refresh);
        events.RECORDED_CHANGE.reg(_refresh);
        events.UPDATE_RIGHTS.reg(_refresh);
        events.REFRESH_FILTER.reg(onFilter);

        // Make sidebar layout
        const categories = {
            'open': {
                icon: undefined,
                content: [
                    'privacy',
                    'filter',
                    'active-list',
                    'pending-list',
                ]
            },
            'closed': {
                icon: undefined,
                content: [
                    'filter',
                    'closed-list'
                ]
            },
            'settings': {
                icon: undefined,
                content: [
                    'notifications',
                    'recorded'
                ]
            },
            'ticket': {
                icon: undefined,
                content: [
                    'open-ticket'
                ],
                onOpen: () => {
                    APP.openTicketCategory.fire();
                }
            },
            'legacy': {
                icon: undefined,
                content: [
                    'legacy'
                ]
            },
            'refresh': {
                icon: undefined,
                onClick: () => { refreshAll(); }
            }
        };

        if (!APP.privateKey) { delete categories.legacy; }

        sidebar.addCheckboxItem({
            key: 'privacy',
            getState: () => false,
            query: (val, setState) => {
                APP.support.setAnonymous(val);
                setState(val);
            }
        });
        sidebar.addItem('active-list', cb => {
            activeContainer = h('div.cp-support-container'); // XXX block
            cb(activeContainer);
        }, { noTitle: true, noHint: true });
        sidebar.addItem('pending-list', cb => {
            pendingContainer = h('div.cp-support-container');
            cb(pendingContainer);
        }, { noTitle: true, noHint: true });
        sidebar.addItem('closed-list', cb => {
            closedContainer = h('div.cp-support-container');
            cb(closedContainer);
        }, { noTitle: true, noHint: true });
        refreshAll();

        sidebar.addCheckboxItem({
            key: 'notifications',
            getState: () => APP.disableSupportNotif,
            query: (val, setState) => {
                common.setAttribute(['general', 'disableSupportNotif'], val, function (err) {
                    if (err) { val = APP.disableSupportNotif; }
                    APP.disableSupportNotif = val;
                    setState(val);
                });
            }
        });

        sidebar.addItem('filter', cb => {
            let container = blocks.box([], 'cp-support-filter-container');
            let $container = $(container);
            let redrawTags = () => {
                $container.empty();
                var existing = APP.allTags;
                var list = h('div.cp-tags-list');
                var reset = h('button.btn.btn-cancel.cp-tags-filter-reset', [
                    h('i.fa.fa-times'),
                    Messages.kanban_clearFilter
                ]);
                var hint = h('span', Messages.kanban_tags);
                var tags = h('div.cp-tags-filter', [
                    h('span.cp-tags-filter-toggle', [
                        hint,
                        reset,
                    ]),
                    list,
                ]);
                var $reset = $(reset);
                var $list = $(list);
                var $hint = $(hint);
                var setTagFilterState = function (bool) {
                    $hint.css('visibility', bool? 'hidden': 'visible');
                    $reset.css('visibility', bool? 'visible': 'hidden');
                };

                var getTags = function () {
                    return $list.find('span.active').map(function () {
                        return String($(this).data('tag'));
                    }).get();
                };
                var commitTags = function () {
                    var t = getTags();
                    setTagFilterState(t.length);
                    APP.filterTags = t;
                    events.REFRESH_FILTER.fire();
                };
                APP.filterTags = (APP.filterTags || []).filter(tag => {
                    return existing.includes(tag);
                });

                var redrawList = function (allTags) {
                    if (!Array.isArray(allTags)) { return; }
                    $list.empty();
                    $list.removeClass('cp-empty');
                    if (!allTags.length) {
                        $list.addClass('cp-empty');
                        $list.append(h('em', Messages.kanban_noTags));
                        return;
                    }
                    allTags.forEach(function (t) {
                        let active = APP.filterTags.includes(t) ? '.active' : '';
                        var $tag = $(h('span'+active, {'data-tag':t}, t)).appendTo($list);
                        Util.onClickEnter($tag, function () {
                            $tag.toggleClass('active');
                            commitTags();
                        });
                    });
                };
                redrawList(existing);
                commitTags();

                Util.onClickEnter($reset, function () {
                    $list.find('span').removeClass('active');
                    commitTags();
                });

                $container.append(tags);
            };
            events.REFRESH_TAGS.reg(redrawTags);
            cb(container);
        }, { noTitle: true, noHint: true });

        sidebar.addItem('recorded', cb => {
            let empty = blocks.text(Messages.support_recordedEmpty);
            let list = blocks.list([
                Messages.support_recordedId,
                Messages.support_recordedContent,
                Messages.kanban_delete
            ], []);
            let labelledList = blocks.labelledInput(Messages.support_recordedList, list);
            let inputId = blocks.input({type:'text', maxlength: 20 });
            let inputContent = blocks.textArea();
            let labelId = blocks.labelledInput(Messages.support_recordedId, inputId);
            let labelContent = blocks.labelledInput(Messages.support_recordedContent, inputContent);

            let create = blocks.button('primary', 'fa-plus', Messages.tag_add);
            let nav = blocks.nav([create]);

            let form = blocks.form([
                empty,
                labelledList,
                labelId,
                labelContent,
            ], nav);

            let $empty = $(empty);
            let $list = $(labelledList).hide();
            let $create = $(create);
            let $inputId = $(inputId).on('input', () => {
                let val = $inputId.val().toLowerCase().replace(/ /g, '-').replace(/[^a-z-_]/g, '');
                $inputId.val(val);
            });

            let refresh = function () {};
            let edit = (id, content, remove) => {
                APP.module.execCommand('SET_RECORDED', {id, content, remove}, function (obj) {
                    $create.removeAttr('disabled');
                    if (obj && obj.error) {
                        console.error(obj.error);
                        return void UI.warn(Messages.error);
                    }
                    $(inputId).val('');
                    $(inputContent).val('');
                    events.RECORDED_CHANGE.fire();
                });
            };
            refresh = () => {
                APP.module.execCommand('GET_RECORDED', {}, function (obj) {
                    if (obj && obj.error) {
                        console.error(obj.error);
                        return void UI.warn(Messages.error);
                    }
                    let lines = [];
                    let messages = obj.messages;
                    Object.keys(messages).forEach(id => {
                        let del = blocks.button('danger-alt', 'fa-trash-o', Messages.kanban_delete);
                        Util.onClickEnter($(del), () => {
                            edit(id, '', true);
                        });
                        lines.push([id, h('pre', messages[id].content), del]);
                    });
                    list.updateContent(lines);
                    if (!lines.length) {
                        $list.hide();
                        $empty.show();
                        return;
                    }
                    $list.show();
                    $empty.hide();
                });
            };

            Util.onClickEnter($create, function () {
                $create.attr('disabled', 'disabled');
                let id = $(inputId).val().trim();
                let content = $(inputContent).val().trim();
                edit(id, content, false);
            });

            events.RECORDED_CHANGE.reg(refresh);

            refresh();
            cb(form);
        });

        sidebar.addItem('open-ticket', cb => {
            let form = APP.support.makeForm({});

            let updateRecorded = () => {
                APP.module.execCommand('GET_RECORDED', {}, function (obj) {
                    if (obj && obj.error) { return; }
                    form.updateRecorded({
                        all: obj.messages,
                        onClick: id => {
                            APP.module.execCommand('USE_RECORDED', {id}, () => {});
                        }
                    });
                });
            };
            events.RECORDED_CHANGE.reg(updateRecorded);
            APP.openTicketCategory.reg(updateRecorded);

            let inputName = blocks.input({type: 'text', readonly: true});
            let inputChan = blocks.input({type: 'text', readonly: true});
            let inputKey = blocks.input({type: 'text', readonly: true});
            let labelName = blocks.labelledInput(Messages.login_username, inputName);
            let labelChan = blocks.labelledInput(Messages.support_userChannel, inputChan);
            let labelKey = blocks.labelledInput(Messages.support_userKey, inputKey);

            let send = blocks.button('primary', 'fa-paper-plane', Messages.support_formButton);
            let nav = blocks.nav([send]);

            let reset = blocks.button('danger-alt', 'fa-times', Messages.form_reset);

            let paste = blocks.textArea({
                placeholder: Messages.support_pasteUserData
            });
            let inputs = h('div.cp-moderation-userdata-inputs', [ labelName, labelChan, labelKey ]);
            let userData = h('div.cp-moderation-userdata', [inputs , paste, reset]);

            let $reset = $(reset).hide();
            let $paste = $(paste).on('input', () => {
                let text = $paste.val().trim();
                let parsed = Util.tryParse(text);
                $paste.val('');
                if (!parsed || !parsed.name || !parsed.notifications || !parsed.curvePublic) {
                    return void UI.warn(Messages.error);
                }
                $(inputName).val(parsed.name);
                $(inputChan).val(parsed.notifications);
                $(inputKey).val(parsed.curvePublic);
                $paste.hide();
                $reset.show();
            });
            Util.onClickEnter($reset, () => {
                $(inputName).val('');
                $(inputChan).val('');
                $(inputKey).val('');
                $reset.hide();
                $paste.show();
                setTimeout(() => { $paste.focus(); });
            });
            [inputName, inputChan, inputKey].forEach(input => {
                $(input).on('input', () => { $paste.show(); });
            });

            let $send = $(send);
            Util.onClickEnter($send, function () {
                let name = $(inputName).val().trim();
                let chan = $(inputChan).val().trim();
                let key = $(inputKey).val().trim();
                let data = APP.support.getFormData(form);

                if (!name) { return void UI.warn(Messages.login_invalUser); }
                if (!Hash.isValidChannel(chan)) { return void UI.warn(Messages.support_invalChan); }
                if (key.length !== 44) { return void UI.warn(Messages.admin_invalKey); }

                $send.attr('disabled', 'disabled');
                APP.module.execCommand('MAKE_TICKET_ADMIN', {
                    name: name,
                    notifications: chan,
                    curvePublic: key,
                    channel: Hash.createChannelId(),
                    title: data.title,
                    ticket: data
                }, function (obj) {
                    if (obj && obj.error) {
                        console.error(obj.error);
                        return void UI.warn(Messages.error);
                    }
                    refreshAll();
                    sidebar.openCategory('open');
                });
            });

            let div = blocks.form([userData, form], nav);
            cb(div);
        });

        sidebar.addItem('legacy', cb => {
            if (!APP.privateKey) { return void cb(false); }

            let start = blocks.button('primary', 'fa-paper-plane', Messages.support_legacyButton);
            let dump = blocks.button('secondary', 'fa-database', Messages.support_legacyDump);
            let clean = blocks.button('danger', 'fa-trash-o', Messages.support_legacyClear);
            let content = h('div.cp-support-container');
            let nav = blocks.nav([start, dump, clean]);

            let sortLegacyTickets = contentByHash => {
                let all = {};
                Object.keys(contentByHash).forEach(key => {
                    let data = contentByHash[key];
                    let content = data.content;
                    let id = content.id;
                    content.hash = key;
                    if (data.ctime) { content.time = data.ctime; }
                    if (content.sender && content.sender.curvePublic !== data.author) { return; }
                    all[id] = all[id] || [];
                    all[id].push(content);
                    all[id].sort((c1, c2) => {
                        return c1.time - c2.time;
                    });
                });
                // sort
                let sorted = Object.keys(all).sort((t1, t2) => {
                    let a = t1[0];
                    let b = t2[0];
                    return (a.time || 0) - (b.time || 0);
                });
                return sorted.map(id => {
                    return all[id];
                });
            };
            UI.confirmButton(dump, { classes: 'btn-secondary' }, function () {
                APP.module.execCommand('DUMP_LEGACY', {}, contentByHash => {
                    // group by ticket id
                    let sorted = sortLegacyTickets(contentByHash);
                    let dump = '';
                    sorted.forEach((t,i) => {
                        if (!Array.isArray(t) || !t.length) { return; }
                        let first = t[0];
if (i) { dump += '\n\n'; }
dump += `================================
================================
ID: #${first.id}
Title: ${first.title}
User: ${first.sender.name}
Date: ${new Date(first.time).toISOString()}`;
                        t.forEach(msg => {
                            if (!msg.message) {
dump += `
--------------------------------
CLOSED: ${new Date(msg.time).toISOString()}`;
                                return;
                            }
dump += `
--------------------------------
From: ${msg.sender.name}
Date: ${new Date(msg.time).toISOString()}
---
${msg.message}
---
Attachments:${JSON.stringify(msg.attachments, 0, 2)}`;
                        });
                    });
                    saveAs(new Blob([dump], {type: 'text/plain'}), "cryptpad-support-dump.txt");
                });
            });
            UI.confirmButton(clean, { classes: 'btn-danger' }, function () {
                APP.module.execCommand('CLEAR_LEGACY', {}, () => {
                    delete APP.privateKey;
                    sidebar.deleteCategory('legacy');
                    sidebar.openCategory('open');
                });
            });
            let run = () => {
                let $div = $(content);
                $div.empty();
                APP.module.execCommand('GET_LEGACY', {}, contentByHash => {
                    // group by ticket id
                    let sorted = sortLegacyTickets(contentByHash);
                    sorted.forEach(ticket => {
                        if (!Array.isArray(ticket) || !ticket.length) { return; }
                        ticket.forEach(content => {
                            var id = content.id;
                            var $ticket = $div.find('.cp-support-list-ticket[data-id="'+id+'"]');

                            if (!content.message) {
                                // A ticket has been closed by the admins...
                                if (!$ticket.length) { return; }
                                $ticket.hide();
                                $ticket.append(APP.support.makeCloseMessage(content));
                                return;
                            }
                            $ticket.show();

                            const onMove = function () {
                                let hashes = [];
                                let messages = [];
                                ticket.forEach(content => {
                                    hashes.push(content.hash);
                                    let clone = Util.clone(content);
                                    delete clone.hash;
                                    messages.push(clone);
                                });
                                APP.module.execCommand('RESTORE_LEGACY', {
                                    messages, hashes
                                }, obj => {
                                    if (obj && obj.error) {
                                        console.error(obj.error);
                                        return void UI.warn(Messages.error);
                                    }
                                });
                            };
                            if (!$ticket.length) {
                                $ticket = APP.support.makeTicket({id, content, onMove});
                                $div.append($ticket);
                            }
                            $ticket.append(APP.support.makeMessage(content));
                        });
                    });
                });
            };
            Util.onClickEnter($(start), run);



            let div = blocks.form([content], nav);
            cb(div);
        });

        sidebar.makeLeftside(categories);
    };

    var createToolbar = function () {
        var displayed = ['useradmin', 'newpad', 'limit', 'pageTitle', 'notifications'];
        var configTb = {
            displayed: displayed,
            sfCommon: common,
            $container: APP.$toolbar,
            pageTitle: Messages.supportPage,
            metadataMgr: common.getMetadataMgr(),
        };
        APP.toolbar = Toolbar.create(configTb);
        APP.toolbar.$rightside.hide();
    };

    nThen(function (waitFor) {
        $(waitFor(UI.addLoadingScreen));
        SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
    }).nThen(function (waitFor) {
        APP.$container = $('#cp-sidebarlayout-container');
        APP.$toolbar = $('#cp-toolbar');
        sframeChan = common.getSframeChannel();
        sframeChan.onReady(waitFor());
    }).nThen(function (waitFor) {
        common.getAttribute(['general', 'disableSupportNotif'], waitFor(function (err, value) {
            APP.disableSupportNotif = !!value;
        }));
    }).nThen(function (/*waitFor*/) {
        createToolbar();
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        common.setTabTitle(Messages.supportPage);

        if (!ApiConfig.supportMailboxKey) {
            return void UI.errorLoadingScreen(Messages.support_disabledTitle);
        }

        APP.privateKey = privateData.supportPrivateKey;
        APP.origin = privateData.origin;
        APP.readOnly = privateData.readOnly;
        APP.module = common.makeUniversal('support', {
            onEvent: (obj) => {
                let cmd = obj.ev;
                let data = obj.data;
                if (!events[cmd]) { return; }
                events[cmd].fire(data);
            }
        });
        APP.support = Support.create(common, true);

        let active = privateData.category || 'active';
        let linkedTicket;
        if (active.indexOf('-') !== -1) {
            linkedTicket = active.split('-')[1];
            active = active.split('-')[0];
        }

        andThen(common, APP.$container, linkedTicket);
        UI.removeLoadingScreen();

    });
});
