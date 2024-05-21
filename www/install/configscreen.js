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
    // '/install/configscreen.css',
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
    // SFCommon.create(waitFor(function(c) { APP.common = common = c; }));

    // sFrameChan = common.getSframeChannel();
    // sFrameChan.onReady(waitFor());

    const blocks = Sidebar.blocks;
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
    // 'width: 50%; height: 80px; margin: 5px'
    // width:200px;height:20px;float:left;border:1px solid red
        let appBlock = h('div',  {style: 'width:50%;height:20px;float:left;border:1px solid red'}, {class: 'inactive-app', id: `${app}-block`}, app)
        $(appBlock).addClass('cp-app-drive-element-grid')
        $(appBlock).addClass('cp-app-drive-element-row')
        $(appBlock).addClass('cp-app-drive-new-doc')


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

    var elem = document.createElement('div');
    elem.setAttribute('id', 'cp-loading');

    let frame = h('div.configscreen',  {style: 'width: 70%; height: 75%; background-color: white'}, form)

    elem.append(frame)

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

