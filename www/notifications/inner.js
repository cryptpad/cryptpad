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
    '/common/common-util.js',

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
    UI,
    Util
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
            'cp-notifications-friend-requests',
        ],
        'pads': [
            'cp-notifications-shared-app',
        ],
    };

    var create = {};

    var makeBlock = function (key, addButton) {
        // Convert to camlCase for translation keys
        var safeKey = key.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });

        var $div = $('<div>', {'class': 'cp-notifications-' + key + ' cp-sidebarlayout-element'});
        $('<label>').text(Messages['notification_'+safeKey+'Title'] || key).appendTo($div);
        $('<span>', {'class': 'cp-sidebarlayout-description'})
            .text(Messages['notification_'+safeKey+'Hint'] || 'Coming soon...').appendTo($div);
        if (addButton) {
            $('<button>', {
                'class': 'btn btn-primary'
            }).text(Messages['notification_'+safeKey+'Button'] || safeKey).appendTo($div);
        }
        return $div;
    };
    create['all'] = function () {
        var key = 'all';
        var $div = makeBlock(key);
        var notifsTitlebar = h('div.cp-app-notifications-panel-titlebar', [
            h("span.cp-app-notifications-panel-title", (Messages.notifications || "Notifications") + " - " + key),
            h("div.cp-app-notifications-panel-titlebar-buttons")
        ]);
        var notifsList = h("div.cp-app-notifications-panel-list");
        var notifsPanel = h("div.cp-app-notifications-panel", [
            notifsTitlebar,
            notifsList
        ]);
        $(notifsPanel).append(notifsList);
        $div.append(notifsPanel);
        common.mailbox.subscribe(["notifications"], {
            onMessage: function (data, el) {
                console.log("data : ", data);
                if (el) {
                    $(notifsList).prepend(el);
                }
            },
            onViewed: function () {}
        });
        // common.mailbox.dismiss(data)
        return $div;
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
            if (key === 'friends') { $category.append($('<span>', {'class': 'fa fa-user-plus'})); }
            if (key === 'pads') { $category.append($('<span>', {'class': 'cptools cptools-pad'})); }

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
