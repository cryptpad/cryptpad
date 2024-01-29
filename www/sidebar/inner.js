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
    '/common/inner/sidebar-layout.js',
    '/customize/messages.js',
    '/common/hyperscript.js',
    '/customize/application_config.js',
    '/api/config',

    'css!/components/bootstrap/dist/css/bootstrap.min.css',
    'css!/components/components-font-awesome/css/font-awesome.min.css',
    'less!/sidebar/app-sidebar.less',
], function(
    $,
    Toolbar,
    nThen,
    SFCommon,
    UI,
    UIElements,
    Util,
    Hash,
    Sidebar,
    Messages,
    h,
    AppConfig,
    ApiConfig,
) {
    var APP = window.APP = {};

    var common;
    var metadataMgr;
    var privateData;
    var sframeChan;

    var andThen = function (common, $leftside, $rightside) {
        const sidebar = Sidebar.create(common, 'sidebar', $leftside, $rightside);
        var categories = {
            'users': {
                icon: 'fa fa-users',
                content: [
                    'invitations',
                    'directory'
                ]
            },
            'test': {
                icon: 'fa fa-bell',
                content: [
                ]
            },
            'click': {
                icon: 'fa fa-file',
                onClick: () => {
                    common.openUnsafeURL('https://cryptpad.fr');
                }
            }
        };

        const blocks = sidebar.blocks;
        sidebar.addItem('invitations', function (cb) {
            var input = h('input', {type:'number'});
            var label = blocks.labelledInput('Test Input label', input);
            var button = blocks.button('secondary', 'fa-question', "My Button text");
            var content = blocks.form(label, blocks.nav(button));
            cb(content);
        });

        sidebar.makeLeftside(categories);
    };


    nThen(function(waitFor) {
        $(waitFor(UI.addLoadingScreen));
        SFCommon.create(waitFor(function(c) { APP.common = common = c; }));
    }).nThen(function(waitFor) {
        APP.$container = $('#cp-sidebarlayout-container');
        APP.$toolbar = $('#cp-toolbar');
        APP.$leftside = $('<div>', { id: 'cp-sidebarlayout-leftside' }).appendTo(APP.$container);
        APP.$rightside = $('<div>', { id: 'cp-sidebarlayout-rightside' }).appendTo(APP.$container);
        sframeChan = common.getSframeChannel();
        sframeChan.onReady(waitFor());
    }).nThen(function( /*waitFor*/ ) {
        metadataMgr = common.getMetadataMgr();
        privateData = metadataMgr.getPrivateData();

        // Toolbar
        var displayed = ['useradmin', 'newpad', 'limit', 'pageTitle', 'notifications'];
        var configTb = {
            displayed: displayed,
            sfCommon: common,
            $container: APP.$toolbar,
            pageTitle: 'TEST SIDEBAR',
            metadataMgr: common.getMetadataMgr(),
        };
        APP.toolbar = Toolbar.create(configTb);
        APP.toolbar.$rightside.hide();
        APP.history = common.makeUniversal('history');

        // Content
        var $rightside = APP.$rightside;
        /*
        var addItem = function(cssClass) {
            var item = cssClass.slice(12); // remove 'cp-settings-'
            if (typeof(create[item]) === "function") {
                $rightside.append(create[item]());
            }
        };
        for (var cat in categories) {
            if (!Array.isArray(categories[cat])) { continue; }
            categories[cat].forEach(addItem);
        }


        createLeftside();
        createUsageButton();
        */
        andThen(common, APP.$leftside, APP.$rightside);

        common.setTabTitle(Messages.settings_title);
        UI.removeLoadingScreen();
    });
});
