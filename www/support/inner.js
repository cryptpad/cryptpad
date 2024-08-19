// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/common/toolbar.js',
    '/components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/customize/messages.js',
    '/common/hyperscript.js',
    '/support/ui.js',
    '/api/config',
    '/customize/application_config.js',
    '/customize/pages.js',

    'css!/components/bootstrap/dist/css/bootstrap.min.css',
    'css!/components/components-font-awesome/css/font-awesome.min.css',
    'less!/support/app-support.less',
], function (
    $,
    Toolbar,
    nThen,
    SFCommon,
    UI,
    UIElements,
    Util,
    Hash,
    Messages,
    h,
    Support,
    ApiConfig,
    AppConfig,
    Pages
    )
{
    var APP = window.APP = {};

    var common;
    var metadataMgr;
    var privateData;

    var categories = {
        'tickets': [ // Msg.support_cat_tickets
            'cp-support-list',
        ],
        'new': [ // Msg.support_cat_new
            'cp-support-subscribe',
            'cp-support-language',
            'cp-support-form',
        ],
        'debugging': [ // Msg.support_cat_debugging
            'cp-support-debugging-data',
        ],
    };

    var supportKey = ApiConfig.supportMailboxKey;
    var supportChannel = Hash.getChannelIdFromKey(supportKey);
    if (!supportKey || !supportChannel) {
        categories = {
            'tickets': [
                'cp-support-disabled'
            ]
        };
    }

    var create = {};

    var makeBlock = function (key, addButton) {
        // Convert to camlCase for translation keys
        var safeKey = key.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });

        var $div = $('<div>', {'class': 'cp-support-' + key + ' cp-sidebarlayout-element'});
        $('<label>').text(Messages['support_'+safeKey+'Title'] || key).appendTo($div);
        var $hintSpan = $('<span>', {'class': 'cp-sidebarlayout-description'}).appendTo($div);
        var hintContent = Messages['support_'+safeKey+'Hint'] || 'Coming soon...';
        if (safeKey === 'form') {
            $hintSpan.html(hintContent);
        } else {
            $hintSpan.text(hintContent);
        }
        if (addButton) {
            $('<button>', {
                'class': 'btn btn-primary'
            }).text(Messages['support_'+safeKey+'Button'] || safeKey).appendTo($div);
        }
        return $div;
    };

    var events = {
        'UPDATE_TICKET': Util.mkEvent()
    };
    create['list'] = function () {
        var key = 'list';
        var $div = makeBlock(key); // Msg.support_listHint, .support_listTitle
        var list = h('div.cp-support-container');
        var $list = $(list);

        let refresh = function () {
            const onClose = function (ticket, channel, data) {
                APP.supportModule.execCommand('CLOSE_TICKET', {
                    channel: channel,
                    curvePublic: data.curvePublic, // Support curve public for this ticket
                    ticket: APP.support.getDebuggingData({ close: true })
                }, function (obj) {
                    if (obj && obj.error) { return void UI.warn(Messages.error); }
                    refresh();
                });
            };
            const onReply = function (ticket, channel, data, form) {
                var formData = APP.support.getFormData(form);
                APP.supportModule.execCommand('REPLY_TICKET', {
                    channel: channel,
                    curvePublic: data.curvePublic, // Support curve public for this ticket
                    ticket: formData
                }, function (obj) {
                    if (obj && obj.error) { return void UI.warn(Messages.error); }
                    $(ticket).find('.cp-support-form-container').remove();
                    refresh();
                });
            };
            const onDelete = function (ticket, channel) {
                APP.supportModule.execCommand('DELETE_TICKET', {
                    channel: channel
                }, function (obj) {
                    console.error(obj);
                    if (obj && obj.error) { return void UI.warn(Messages.error); }
                    refresh();
                });
            };

            APP.supportModule.execCommand('GET_MY_TICKETS', {}, function (obj) {
                if (obj && obj.error) {
                    return void UI.warn(Messages.error);
                }
                if (!Array.isArray(obj.tickets)) { return void UI.warn(Messages.error); }

                // Recover forms
                let activeForms = {};
                $list.find('.cp-support-form-container').each((i, el) => {
                    let id = $(el).attr('data-id');
                    if (!id) { return; }
                    activeForms[id] = el;
                });

                $list.empty();
                obj.tickets.forEach((data) => {
                    var messages = data.messages;
                    var first = messages[0];
                    first.id = data.id;
                    var ticket = APP.support.makeTicket({
                        id: data.id,
                        content: data,
                        form: activeForms[data.id],
                        onClose, onReply, onDelete
                    });
                    $list.append(ticket);
                    let $ticket = $(ticket);
                    messages.forEach(msg => {
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

                });
            });

        };
        let _refresh = Util.throttle(refresh, 500);
        events.UPDATE_TICKET.reg(_refresh);
        refresh();
        $div.append(list);
        return $div;
    };

    create['language'] = function () {
        if (!Array.isArray(AppConfig.supportLanguages)) { return $(h('div')); }
        var languages = AppConfig.supportLanguages;

        var list = h('span.cp-support-language-list', languages
            .map(function (lang) {
                return Messages._languages[lang];
            })
            .filter(Boolean)
            .map(function (lang) {
                return h('span.cp-support-language', lang);
            })
        );

        var $div = $(
            h('div.cp-support-language', [
                Messages.support_languagesPreamble,
                list,
            ])
        );
        return $div;
    };

    create['subscribe'] = function () {
        if (!Pages.areSubscriptionsAllowed()) { return; }
        try {
            if (common.getMetadataMgr().getPrivateData().plan) { return; }
        } catch (err) {}

        var url = Pages.accounts.upgradeURL;
        var accountsLink = h('a', {
            href: url,
        }, Messages.support_premiumLink);
        $(accountsLink).click(function (ev) {
            ev.preventDefault();
            common.openURL(url);
        });

        return $(h('div.cp-support-subscribe.cp-sidebarlayout-element', [
            h('div.alert.alert-info', [
                Messages.support_premiumPriority,
                ' ',
                accountsLink,
            ]),
        ]));
    };

    // Create a new tickets
    create['form'] = function () {
        var key = 'form';
        var $div = makeBlock(key, true); // Msg.support_formHint, .support_formTitle, .support_formButton
        Pages.documentationLink($div.find('a')[0], 'https://docs.cryptpad.org/en/user_guide/index.html');

        var form = APP.support.makeForm();

        $div.find('button').click(function () {
            var data = APP.support.getFormData(form);
            APP.supportModule.execCommand('MAKE_TICKET', {
                channel: Hash.createChannelId(),
                title: data.title,
                ticket: data
            }, function (obj) {
                if (obj && obj.error) {
                    console.error(obj.error);
                    return void UI.warn(Messages.error);
                }
                events.UPDATE_TICKET.fire();
                $('.cp-sidebarlayout-category[data-category="tickets"]').click();
            });
        });
        $div.find('button').before(form);
        return $div;
    };

    // Support is disabled...
    create['disabled'] = function () {
        var key = 'disabled';
        var $div = makeBlock(key); // Msg.support_disabledHint, .support_disabledTitle
        return $div;
    };

    create['debugging-data'] = function () {
        var key = 'debugging-data';
        var $div = makeBlock(key); // Msg.support_debuggingDataTitle.support_debuggingDataHint;
        var data = APP.support.getDebuggingData().sender;

        var content = h('pre.debug-data', JSON.stringify(data, null, 2));
        $div.append(content);

        return $div;
    };

    var hideCategories = function () {
        APP.$rightside.find('> div').hide();
    };
    var showCategories = function (cat) {
        hideCategories();
        if (!Array.isArray(cat)) { return void console.error("invalid category"); }
        cat.forEach(function (c) {
            APP.$rightside.find('.'+c).show();
        });
    };

    var icons = {
        tickets: 'fa-envelope-o',
        new: 'fa-life-ring',
        debugging: 'fa-wrench',
    };

    var createLeftside = function () {
        var $categories = $('<div>', {'class': 'cp-sidebarlayout-categories'})
                            .appendTo(APP.$leftside);
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        var active = privateData.category || 'tickets';
        if (!categories[active]) { active = 'tickets'; }
        common.setHash(active);
        Object.keys(categories).forEach(function (key) {
            var $category = $('<div>', {
                'class': 'cp-sidebarlayout-category',
                'data-category': key
            }).appendTo($categories);
            var iconClass = icons[key];
            if (iconClass) {
                $category.append(h('span', {
                    class: 'fa ' + iconClass,
                }));
            }

            if (key === active) {
                $category.addClass('cp-leftside-active');
            }

            $category.click(function () {
                if (!Array.isArray(categories[key]) && categories[key].onClick) {
                    categories[key].onClick();
                    return;
                }
                active = key;
                common.setHash(key);
                $categories.find('.cp-leftside-active').removeClass('cp-leftside-active');
                $category.addClass('cp-leftside-active');
                showCategories(categories[key]);
            });

            $category.append(Messages['support_cat_'+key] || key);
        });
        showCategories(categories[active]);
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
        APP.$leftside = $('<div>', {id: 'cp-sidebarlayout-leftside'}).appendTo(APP.$container);
        APP.$rightside = $('<div>', {id: 'cp-sidebarlayout-rightside'}).appendTo(APP.$container);
        var sFrameChan = common.getSframeChannel();
        sFrameChan.onReady(waitFor());
    }).nThen(function (waitFor) {
        metadataMgr = common.getMetadataMgr();
        privateData = metadataMgr.getPrivateData();
        common.getPinUsage(null, waitFor(function (err, data) {
            if (err) { return void console.error(err); }
            APP.pinUsage = data;
        }));
        APP.teamsUsage = {};
        Object.keys(privateData.teams).forEach(function (teamId) {
            common.getPinUsage(teamId, waitFor(function (err, data) {
                if (err) { return void console.error(err); }
                APP.teamsUsage[teamId] = data;
            }));
        });
    }).nThen(function (/*waitFor*/) {
        createToolbar();
        common.setTabTitle(Messages.supportPage);

        APP.origin = privateData.origin;
        APP.readOnly = privateData.readOnly;
        APP.support = Support.create(common, false, APP.pinUsage, APP.teamsUsage);
        APP.supportModule = common.makeUniversal('support', {
            onEvent: (obj) => {
                let cmd = obj.ev;
                let data = obj.data;
                if (!events[cmd]) { return; }
                events[cmd].fire(data);
            }
        });

        // Content
        var $rightside = APP.$rightside;
        var addItem = function (cssClass) {
            var item = cssClass.slice(11); // remove 'cp-support-'
            if (typeof (create[item]) === "function") {
                $rightside.append(create[item]());
            }
        };
        for (var cat in categories) {
            if (!Array.isArray(categories[cat])) { continue; }
            categories[cat].forEach(addItem);
        }

        createLeftside();

        UI.removeLoadingScreen();

    });
});
