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

    var common;
    var sframeChan;
    var events = {
        'NEW_TICKET': Util.mkEvent(),
        'UPDATE_TICKET': Util.mkEvent(),
        'UPDATE_RIGHTS': Util.mkEvent()
    };

    // XXX
    Messages.support_activeListTitle = "Active tickets";
    Messages.support_activeListHint = "List of tickets that are in an active state";
    Messages.support_pendingListTitle = "Pending tickets";
    Messages.support_pendingListHint = "List of tickets that may not be updated for a while but should not be closed";

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

    var andThen = function (common, $container, linkedTicket) {
        const sidebar = Sidebar.create(common, 'support', $container);
        const blocks = sidebar.blocks;

        // Support panel functions
        let open = [];
        let refreshAll = function () {};
        let refresh = ($container, type) => {
            APP.module.execCommand('LIST_TICKETS_ADMIN', {
                type: type
            }, (tickets) => {
                if (tickets.error) {
                    if (tickets.error === 'EFORBIDDEN') {
                        return void UI.errorLoadingScreen(Messages.admin_authError || '403 Forbidden');
                    }
                    return void UI.errorLoadingScreen(tickets.error);
                }
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
                if (type === 'closed') {
                    // Only one column
                    col1 = col2 = col3 = col4;
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
                            if (!data.notifications) {
                                data.notifications = Util.find(msg, ['sender', 'notifications']);
                            }
                            if (msg.close) {
                                $ticket.addClass('cp-support-list-closed');
                                return $ticket.append(APP.support.makeCloseMessage(msg));
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

                Object.keys(tickets).sort(sortTicket).forEach(function (channel) {
                    var d = tickets[channel];
                    var ticket = APP.support.makeTicket({
                        id: channel,
                        content: d,
                        form: activeForms[channel],
                        onShow, onHide, onClose, onReply, onMove
                    });

                    var container;
                    if (d.lastAdmin) { container = col3; }
                    else if (d.premium) { container = col1; }
                    else { container = col2; }
                    $(container).append(ticket);

                    if (open.includes(channel)) { return void ticket.open(); }
                    if (linkedTicket === channel) {
                        linkedTicket = undefined;
                        ticket.open();
                        ticket.scrollIntoView();
                    }
                });
                open = [];
                console.log(type, tickets);
            });
        };

        let activeContainer, pendingContainer, closedContainer;
        refreshAll = function () {
            refresh($(activeContainer), 'active');
            refresh($(pendingContainer), 'pending');
            refresh($(closedContainer), 'closed');
        };
        let _refresh = Util.throttle(refreshAll, 500);
        events.NEW_TICKET.reg(_refresh);
        events.UPDATE_TICKET.reg(_refresh);
        events.UPDATE_RIGHTS.reg(_refresh);

        // Make sidebar layout
        const categories = {
            'open': {
                icon: undefined,
                content: [
                    'privacy',
                    'active-list',
                    'pending-list',
                ]
            },
            'closed': {
                icon: undefined,
                content: [
                    'closed-list'
                ]
            },
            'settings': {
                icon: undefined,
                content: [
                    'notifications'
                ]
            },
            'ticket': {
                icon: undefined,
                content: [
                    'open-ticket'
                ]
            },
            'refresh': {
                icon: undefined,
                onClick: refreshAll
            }
        };


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
        });
        sidebar.addItem('pending-list', cb => {
            pendingContainer = h('div.cp-support-container');
            cb(pendingContainer);
        });
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

        sidebar.addItem('open-ticket', cb => {
            let form = APP.support.makeForm();
            let inputName = blocks.input({type: 'text', readonly: true});
            let inputChan = blocks.input({type: 'text', readonly: true});
            let inputKey = blocks.input({type: 'text', readonly: true});
            let labelName = blocks.labelledInput(Messages.login_username, inputName);
            let labelChan = blocks.labelledInput(Messages.support_userChannel, inputChan);
            let labelKey = blocks.labelledInput(Messages.support_userKey, inputKey);

            let send = blocks.button('primary', 'fa-paper-plane', Messages.support_formButton);
            let nav = blocks.nav([send]);

            let paste = blocks.textArea({
                placeholder: Messages.support_pasteUserData
            });
            let inputs = h('div.cp-moderation-userdata-inputs', [ labelName, labelChan, labelKey ]);
            let userData = h('div.cp-moderation-userdata', [inputs , paste]);


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
