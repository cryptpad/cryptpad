// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// bg #e7e7e7
// blue #0087FF
// text #3F4141
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
    '/common/common-signing-keys.js',
    '/common/hyperscript.js',
    '/common/clipboard.js',
    'json.sortify',
    '/customize/application_config.js',
    '/api/config',
    '/api/instance',
    '/lib/datepicker/flatpickr.js',
    '/common/hyperscript.js',
    'css!/lib/datepicker/flatpickr.min.css',
    '/customize/messages.js',


    '/customize/messages.js',
    'less!/customize/src/less2/include/loading.less'
], function ($,
    Toolbar,
    nThen,
    SFCommon,
    UI,
    UIElements,
    Util,
    Hash,
    Sidebar,
    Messages,
    Keys,
    h,
    Clipboard,
    Sortify,
    AppConfig,
    ApiConfig,
    Instance,
    Flatpickr,
    Messages) {


    //XXX 
    Messages.admin_appSelection = 'App configuration saved'
    Messages.admin_appsTitle = "Choose your applications"
    Messages.admin_appsHint = "Choose which apps are available to users on your instance."
    Messages.admin_cat_apps = "Apps"

    var APP = window.APP = {};

    var Nacl = window.nacl;
    var common;
    var sFrameChan;

    var andThen = function (common, $container) {
        const sidebar = Sidebar.create(common, 'admin', $container);

        var categories = {
            'apps': { // Msg.admin_cat_apps
                icon: 'fa fa-cog',
                content: [
                    'apps',
                ]
            },
            
        };

        const blocks = sidebar.blocks;

        const flushCache = (cb) => {
            cb = cb || function () {};
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'FLUSH_CACHE',
            }, cb);
        };

        sidebar.addItem('apps', function (cb) {

        const grid = blocks.block([], 'cp-admin-customize-apps-grid');

        const allApps = ['pad', 'code', 'kanban', 'slide', 'sheet', 'form', 'whiteboard', 'diagram'];
        const availableApps = []
        
        function select(app) {
            if (availableApps.indexOf(app) === -1) {
                availableApps.push(app);
                $(`#${app}-block`).attr('class', 'active-app') 
            } else {
                availableApps.splice(availableApps.indexOf(app), 1)
                $(`#${app}-block`).attr('class', 'inactive-app')
            } 
        }

        allApps.forEach(app => { 
            let appBlock = h('div', {class: 'inactive-app', id: `${app}-block`}, app)
            $(appBlock).addClass('cp-app-drive-element-grid')
            $(grid).append(appBlock);
            $(appBlock).on('click', () => select(app))
        }); 

        var save = blocks.activeButton('primary', '', Messages.settings_save, function (done) {
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ADMIN_DECREE',
                data: ['DISABLE_APPS', availableApps]
            }, function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    $input.val('');
                    console.error(e, response);
                    done(false);
                    return;
                }
                flushCache();
                done(true);
                UI.log(Messages._getKey('ui_saved', [Messages.admin_appSelection]));
            });
        });
        
        let form = blocks.form([
            grid 
        ], blocks.nav([save]));

        cb(form);
        }); 

        sidebar.makeLeftside(categories);
    };


    var updateStatus = APP.updateStatus = function (cb) {
        sFrameChan.query('Q_ADMIN_RPC', {
            cmd: 'INSTANCE_STATUS',
        }, function (e, data) {
            if (e) { console.error(e); return void cb(e); }
            if (!Array.isArray(data)) { return void cb('EINVAL'); }
            APP.instanceStatus = data[0];
            console.log("Status", APP.instanceStatus);
            cb();
        });
    };

    var createToolbar = function () {
        var displayed = ['useradmin', 'newpad', 'limit', 'pageTitle', 'notifications'];
        var configTb = {
            displayed: displayed,
            sfCommon: common,
            $container: APP.$toolbar,
            pageTitle: Messages.adminPage || 'Admin',
            metadataMgr: common.getMetadataMgr(),
        };
        APP.toolbar = Toolbar.create(configTb);
        APP.toolbar.$rightside.hide();
    };

    nThen(function(waitFor) {
    //     $(waitFor(UI.addLoadingScreen));
        SFCommon.create(waitFor(function(c) { APP.common = common = c; }));
    }).nThen(function(waitFor) {
        APP.$container = $('#cp-sidebarlayout-container');
        APP.$toolbar = $('#cp-toolbar');
        sFrameChan = common.getSframeChannel();
        sFrameChan.onReady(waitFor());
    })
    .nThen(function (waitFor) {
        if (!common.isAdmin()) { return; }
        updateStatus(waitFor());
    })
    .nThen(function( /*waitFor*/ ) {
        common.setTabTitle(Messages.adminPage || 'Administration');

        createToolbar();

        APP.supportModule = common.makeUniversal('support');

    //     // Content
        andThen(common, APP.$container);

    //     UI.removeLoadingScreen();
    });

    var urlArgs = window.location.href.replace(/^.*\?([^\?]*)$/, function (all, x) { return x; });
    var elem = document.createElement('div');
    elem.setAttribute('id', 'cp-loading');

    elem.innerHTML = [
        '<div class="cp-loading-logo">',
            '<img class="cp-loading-cryptofist" src="/api/logo?' + urlArgs + '" alt="' + Messages.label_logo + '">',
        '</div>',
        '<div class="cp-loading-container">',
            '<div class="cp-loading-spinner-container">',
                '<span class="cp-spinner"></span>',
            '</div>',
            '<div class="cp-loading-progress">',
                '<div class="cp-loading-progress-list"></div>',
                '<div class="cp-loading-progress-container"></div>',
            '</div>',
            '<p id="cp-loading-message"></p>',
        '</div>'
    ].join('');
    var built = false;



    return function () {
        built = true;
        var intr;
        var append = function () {
            if (!document.body) { return; }
            clearInterval(intr);
            document.body.appendChild(elem);
        };
        intr = setInterval(append, 100);
        append();
    };
});

