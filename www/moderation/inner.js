// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/api/config',
    '/customize/application_config.js',
    '/components/chainpad-crypto/crypto.js',
    '/common/toolbar.js',
    '/components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-signing-keys.js',
    '/support/ui.js',
    '/common/clipboard.js',
    'json.sortify',

    'css!/lib/datepicker/flatpickr.min.css',
    'css!/components/bootstrap/dist/css/bootstrap.min.css',
    'css!/components/components-font-awesome/css/font-awesome.min.css',
    'less!/moderation/app-moderation.less',
], function (
    $,
    ApiConfig,
    AppConfig,
    Crypto,
    Toolbar,
    nThen,
    SFCommon,
    h,
    Messages,
    UI,
    UIElements,
    Util,
    Hash,
    Keys,
    Support,
    Clipboard,
    Sortify
    )
{
    var APP = {
        'instanceStatus': {}
    };

    var Nacl = window.nacl;
    var common;
    var sFrameChan;

    var andThen = function () {
        var $body = $('#cp-content-container');
        var button = h('button.btn.btn-primary', 'refresh'); // XXX
        $body.append(h('div', button));
        var $container = $(h('div.cp-support-container')).appendTo($body);


        var refresh = () => {
            APP.module.execCommand('LIST_TICKETS_ADMIN', {}, (tickets) => {
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
                $container.append([col1, col2, col3]);
                var sortTicket = function (c1, c2) {
                    return tickets[c2].time - tickets[c1].time;
                };

                const onLoad = function (ticket, channel, data) {
                    APP.module.execCommand('LOAD_TICKET_ADMIN', {
                        channel: channel,
                        curvePublic: data.authorKey
                    }, function (obj) {
                        if (!Array.isArray(obj)) {
                            console.error(obj && obj.error);
                            return void UI.warn(Messages.error);
                        }
                        obj.forEach(function (msg) {
                            console.error(msg);
                            if (!data.notifications) {
                                data.notifications = Util.find(msg, ['sender', 'notifications']);
                            }
                            $(ticket).append(APP.support.makeMessage(msg));
                        });
                    });
                };
                const onClose = function (ticket, channel, data) {
                    APP.module.execCommand('CLOSE_TICKET_ADMIN', {
                        channel: channel,
                        curvePublic: data.authorKey
                    }, function (obj) {
                        // XXX TODO
                    });
                };
                const onReply = function (ticket, channel, data, form, cb) {
                    // XXX TODO
                    var formData = APP.support.getFormData(form);
                    APP.module.execCommand('REPLY_TICKET_ADMIN', {
                        channel: channel,
                        curvePublic: data.authorKey,
                        notifChannel: data.notifications,
                        ticket: formData
                    }, function (obj) {
                        if (obj && obj.error) {
                            console.error(obj && obj.error);
                            return void UI.warn(Messages.error);
                        }
                        $(ticket).find('.cp-support-list-message').remove();
                        refresh(); // XXX RE-open this ticket and scroll to?
                    });
                };


                Object.keys(tickets).sort(sortTicket).forEach(function (channel) {
                    var d = tickets[channel];
                    var ticket = APP.support.makeTicket(channel, d, onLoad, onClose, onReply);
                    var container;
                    if (d.lastAdmin) { container = col3; }
                    else if (d.premium) { container = col1; }
                    else { container = col2; }
                    $(container).append(ticket);
                });
                console.log(tickets);
            });
        };
        Util.onClickEnter($(button), function () {
            refresh();
        });
        refresh();
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
        APP.$container = $('#cp-content-container');
        APP.$toolbar = $('#cp-toolbar');
        sFrameChan = common.getSframeChannel();
        sFrameChan.onReady(waitFor());
    }).nThen(function (/*waitFor*/) {
        createToolbar();
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        common.setTabTitle(Messages.supportPage);

        if (!common.isAdmin()) {
            return void UI.errorLoadingScreen(Messages.admin_authError || '403 Forbidden');
        }

        APP.privateKey = privateData.supportPrivateKey;
        APP.origin = privateData.origin;
        APP.readOnly = privateData.readOnly;
        APP.module = common.makeUniversal('support');
        APP.support = Support.create(common, true);

        andThen();
        UI.removeLoadingScreen();

    });
});
