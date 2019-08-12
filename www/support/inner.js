define([
    'jquery',
    '/common/toolbar3.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/customize/messages.js',
    '/common/hyperscript.js',
    '/support/ui.js',
    '/api/config',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
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
    ApiConfig
    )
{
    var APP = window.APP = {};

    var common;
    var metadataMgr;
    var privateData;

    var categories = {
        'tickets': [
            'cp-support-list',
        ],
        'new': [
            'cp-support-form',
        ],
    };

    var supportKey = ApiConfig.supportMailbox;
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
        $('<span>', {'class': 'cp-sidebarlayout-description'})
            .text(Messages['support_'+safeKey+'Hint'] || 'Coming soon...').appendTo($div);
        if (addButton) {
            $('<button>', {
                'class': 'btn btn-primary'
            }).text(Messages['support_'+safeKey+'Button'] || safeKey).appendTo($div);
        }
        return $div;
    };



    // List existing (open?) tickets
    create['list'] = function () {
        var key = 'list';
        var $div = makeBlock(key);
        $div.addClass('cp-support-container');
        var hashesById = {};

        // Register to the "support" mailbox
        common.mailbox.subscribe(['support'], {
            onMessage: function (data) {
                /*
                    Get ID of the ticket
                    If we already have a div for this ID
                        Push the message to the end of the ticket
                    If it's a new ticket ID
                        Make a new div for this ID
                */
                var msg = data.content.msg;
                var hash = data.content.hash;
                var content = msg.content;
                var id = content.id;
                var $ticket = $div.find('.cp-support-list-ticket[data-id="'+id+'"]');

                hashesById[id] = hashesById[id] || [];
                if (hashesById[id].indexOf(hash) === -1) {
                    hashesById[id].push(data);
                }

                if (msg.type === 'CLOSE') {
                    // A ticket has been closed by the admins...
                    if (!$ticket.length) { return; }
                    $ticket.addClass('cp-support-list-closed');
                    $ticket.append(APP.support.makeCloseMessage(content, hash));
                    return;
                }
                if (msg.type !== 'TICKET') { return; }

                if (!$ticket.length) {
                    $ticket = APP.support.makeTicket($div, content, function () {
                        var error = false;
                        hashesById[id].forEach(function (d) {
                            common.mailbox.dismiss(d, function (err) {
                                if (err) {
                                    error = true;
                                    console.error(err);
                                }
                            });
                        });
                        if (!error) { $ticket.remove(); }
                    });
                }
                $ticket.append(APP.support.makeMessage(content, hash));
            }
        });
        return $div;
    };

    // Create a new tickets
    create['form'] = function () {
        var key = 'form';
        var $div = makeBlock(key, true);

        var form = APP.support.makeForm();

        $div.find('button').before(form);

        var id = Util.uid();

        $div.find('button').click(function () {
            var metadataMgr = common.getMetadataMgr();
            var privateData = metadataMgr.getPrivateData();
            var user = metadataMgr.getUserData();
            var sent = APP.support.sendForm(id, form, {
                channel: privateData.support,
                curvePublic: user.curvePublic
            });
            id = Util.uid();
            if (sent) {
                $('.cp-sidebarlayout-category[data-category="tickets"]').click();
            }
        });
        return $div;
    };

    // Support is disabled...
    create['disabled'] = function () {
        var key = 'disabled';
        var $div = makeBlock(key);
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
        var active = privateData.category || 'tickets';
        common.setHash(active);
        Object.keys(categories).forEach(function (key) {
            var $category = $('<div>', {
                'class': 'cp-sidebarlayout-category',
                'data-category': key
            }).appendTo($categories);
            if (key === 'tickets') { $category.append($('<span>', {'class': 'fa fa-envelope-o'})); }
            if (key === 'new') { $category.append($('<span>', {'class': 'fa fa-life-ring'})); }

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
    }).nThen(function (/*waitFor*/) {
        createToolbar();
        metadataMgr = common.getMetadataMgr();
        privateData = metadataMgr.getPrivateData();
        common.setTabTitle(Messages.supportPage);

        APP.origin = privateData.origin;
        APP.readOnly = privateData.readOnly;
        APP.support = Support.create(common, false);

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
