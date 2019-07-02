define([
    'jquery',
    '/api/config',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/toolbar3.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/common/common-interface.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/notifications/app-notifications.less',
], function (
    $,
    ApiConfig,
    Crypto,
    Toolbar,
    nThen,
    SFCommon,
    h,
    Messages,
    UI
    )
{
    var APP = {};

    var common;
    var sFrameChan;

    var categories = {
        'all': [
            'cp-notifications-all',
        ],
        'friends': [
            'cp-notifications-friends',
        ],
        'pads': [
            'cp-notifications-pads',
        ],
        'archived': [
            'cp-notifications-archived',
        ],
    };

    var create = {};

    var unreadData;

    // create the list of notifications
    // show only notifs with type in filterTypes array. If filterTypes empty, don't filter.
    var makeNotificationList = function (key, filterTypes) {
        filterTypes = filterTypes || [];
        var safeKey = key.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
        var categoryName = Messages['notification_cat_' + safeKey] || safeKey;

        var notifsData = [];
        if (key === "all") {
            unreadData = notifsData;
        }
        var $div = $('<div>', {'class': 'cp-notifications-' + key + ' cp-sidebarlayout-element'});
        var notifsPanel, notifsList, dismissAll;
        notifsPanel = h("div.cp-app-notifications-panel", [
            h('div.cp-app-notifications-panel-titlebar', [
                h("span.cp-app-notifications-panel-title",
                    (Messages.notificationsPage || "Notifications") + " - " + categoryName),
                h("div.cp-app-notifications-panel-titlebar-buttons", [
                    dismissAll = h("div.cp-app-notifications-dismissall.cp-clickable", { title: Messages.dismissAll || "Dismiss All" }, h("span.fa.fa-trash")),
                ]),
            ]),
            notifsList = h("div.cp-app-notifications-panel-list", [
                h("div.cp-notification.no-notifications", Messages.notifications_empty),
            ]),
        ]);

        // add notification
        var addNotification = function (data, el) {
            // if the type of notification correspond
            if (filterTypes.length === 0 || filterTypes.indexOf(data.content.msg.type) !== -1) {
                notifsData.push(data);
                $(notifsList).prepend(el);
            }
        };
        var addArchivedNotification = function (data) {
            var isDataUnread = unreadData.findIndex(function (ud) {
                return ud.content.hash === data.content.hash;
            }) === -1;
            if (data.content.archived && isDataUnread) {
                notifsData.push(data);
                var el = common.mailbox.createElement(data);
                var time = new Date(data.content.time);
                $(el).find(".cp-notification-content").append(h("span.notification-time", time.toLocaleDateString() + " - " + time.toLocaleTimeString()));
                $(el).addClass("cp-app-notification-archived");
                $(notifsList).prepend(el);
            }
        };

        $div.append(notifsPanel);

        if (key === "archived") {
            var loadmore;
            var lastKnownHash;
            $(dismissAll).remove();
            loadmore = h("div.cp-app-notification-loadmore.cp-clickable", Messages.loadMore || "Load more ...");
            $(loadmore).click(function () {
                common.mailbox.getNotificationsHistory('notifications', 5, lastKnownHash, function (err, messages) {
                    console.log(messages);
                    messages.forEach(function (data) {
                        data.content.archived = true;
                        addArchivedNotification(data);
                    });
                    lastKnownHash = messages[0].content.hash;
                });
            });
            notifsList.before(loadmore);
            $(loadmore).click();
        }

        common.mailbox.subscribe(["notifications"], {
            onMessage: function (data, el) {
                console.log(data);
                addNotification(data, el);
            },
            onViewed: function () {}
        });

        $(dismissAll).click(function () {
            notifsData.forEach(function (data) {
                if (data.content.isDismissible) {
                    data.content.dismissHandler();
                }
            });
        });

        return $div;
    };

    create['all'] = function () {
        var key = 'all';
        return makeNotificationList(key);
    };

    create['friends'] = function () {
        var key = 'friends';
        var filter = ["FRIEND_REQUEST", "FRIEND_REQUEST_ACCEPTED", "FRIEND_REQUEST_DECLINED"];
        return makeNotificationList(key, filter);
    };

    create['pads'] = function () {
        var key = 'pads';
        var filter = ["SHARE_PAD"];
        return makeNotificationList(key, filter);
    };

    create['archived'] = function () {
        var key = 'archived';
        var filter = ["ARCHIVED"];
        return makeNotificationList(key, filter);
    };


    var hideCategories = function () {
        APP.$rightside.find('> div').hide();
    };
    var showCategories = function (cat) {
        hideCategories();
        cat.forEach(function (c) {
            APP.$rightside.find('.'+c).show();
        });
    };
    var createLeftside = function () {
        var $categories = $('<div>', {'class': 'cp-sidebarlayout-categories'})
                            .appendTo(APP.$leftside);
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        var active = privateData.category || 'all';
        common.setHash(active);
        Object.keys(categories).forEach(function (key) {
            var $category = $('<div>', {'class': 'cp-sidebarlayout-category'}).appendTo($categories);
            if (key === 'all') { $category.append($('<span>', {'class': 'fa fa-bars'})); }
            if (key === 'friends') { $category.append($('<span>', {'class': 'fa fa-user'})); }
            if (key === 'pads') { $category.append($('<span>', {'class': 'cptools cptools-pad'})); }
            if (key === 'archived') { $category.append($('<span>', {'class': 'fa fa-archive'})); }

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

            $category.append(Messages['notification_cat_'+key] || key);
        });
        showCategories(categories[active]);
    };

    var createToolbar = function () {
        var displayed = ['useradmin', 'newpad', 'limit', 'pageTitle', 'notifications'];
        var configTb = {
            displayed: displayed,
            sfCommon: common,
            $container: APP.$toolbar,
            pageTitle: Messages.notificationsPage || 'Notifications',
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
        sFrameChan = common.getSframeChannel();
        sFrameChan.onReady(waitFor());
    }).nThen(function (/*waitFor*/) {
        createToolbar();
        common.setTabTitle(Messages.notificationsPage || 'Notifications');


        // Content
        var $rightside = APP.$rightside;
        var addItem = function (cssClass) {
            var item = cssClass.slice(17); // remove 'cp-notifications-'
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
