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
    'less!/newadmin/app-admin.less',
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
    var sFrameChan;

    var flushCacheNotice = function () {
        var notice = UIElements.setHTML(h('p'), Messages.admin_reviewCheckupNotice);
        $(notice).find('a').attr({
            href: new URL('/checkup/', ApiConfig.httpUnsafeOrigin).href,
        }).click(function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            common.openURL('/checkup/');
        });
        var content = h('span', [
            UIElements.setHTML(h('p'), Messages.admin_cacheEvictionRequired),
            notice,
        ]);
        UI.alert(content);
    };

    var andThen = function (common, $container) {
        const sidebar = Sidebar.create(common, 'admin', $container);
        var categories = {
            'general': {
                icon: 'fa fa-user-o',
                content: [
                    'flush-cache',
                    'update-limit',
                    'enableembeds',
                    'forcemfa',
                    'email',

                    'instance-info-notice',

                    'name',
                    'description',
                    'jurisdiction',
                    'notice',
                ]
            },
            'users' : {
                icon : 'fa fa-address-card-o',
                content : [
                'registration',
                'invitation',
                'users'
                ]
            },
            'quota': {
                icon: 'fa fa-hdd-o',
                content: [
                    'defaultlimit',
                    'setlimit',
                    'getlimits',
                ]
            },
            'database' : {
                icon : 'fa fa-database',
                content : [
                    'account-metadata',
                    'document-metadata',
                    'block-metadata',
                    'totp-recovery',

                ]
            },
            'stats' : {
                icon : 'fa fa-line-chart',
                content : [
                    'refresh-stats',
                    'uptime',
                    'active-sessions',
                    'active-pads',
                    'open-files',
                    'registered',
                    'disk-usage',
                ]
            },
            'support' : {
                icon : 'fa fa-life-ring',
                content : [
                    'support-list',
                    'support-init',
                    'support-priv',
                ]
            },
            'broadcast' : {
                icon: 'fa fa-bullhorn',
                content : [
                    'maintenance',
                    'survey',
                    'broadcast',
                ]
            },
            'performance' : {
                icon : 'fa fa-heartbeat',
                content : [
                    'refresh-performance',
                    'performance-profiling',
                    'enable-disk-measurements',
                    'bytes-written',
                ]
            },
            'network' : {
                icon : 'fa fa-sitemap',
                content : [
                    'update-available',
                    'checkup',
                    'block-daily-check',
                    'provide-aggregate-statistics',
                    'list-my-instance',

                    'consent-to-contact',
                    'remove-donate-button',
                    'instance-purpose',
                ]
            }
        };
        const blocks = sidebar.blocks;
        var makeAdminCheckbox = function (sidebar, data) {
            return function () { 
                var state = data.getState();
                var key = data.key;
              
                sidebar.addItem(key, function (cb) {
                    var labelKey = 'admin_' + keyToCamlCase(key) + 'Label';
                    var titleKey = 'admin_' + keyToCamlCase(key) + 'Title';
                    var label = Messages[labelKey] || Messages[titleKey];
                    var box = blocks.checkbox(key, label, state, { spinner: true });
                    var $cbox = $(box);
                    var spinner = box.spinner;
                    var $checkbox = $cbox.find('input').on('change', function() {
                        spinner.spin();
                        var val = $checkbox.is(':checked') || false;
                        $checkbox.attr('disabled', 'disabled');
                        data.query(val, function (state) {
                            spinner.done();
                            $checkbox[0].checked = state;
                            $checkbox.removeAttr('disabled');
                        });  
                    });  
                    cb(box);
                });
            };
        }; 
        //general blocks
        sidebar.addItem('flush-cache', function (cb) {
            var button = blocks.button('primary', '', Messages.admin_flushCacheButton);
            var called = false;
            Util.onClickEnter($(button), function () {
                if (called) { return; }
                called = true;
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'FLUSH_CACHE',
                }, function (e, data) {
                    called = false;
                    UI.alert(data ? Messages.admin_flushCacheDone || 'done' : 'error' + e);
                });
            });
            cb(button);
        });

        sidebar.addItem('update-limit', function (cb) {
            var button = blocks.button('primary', '',  Messages.admin_updateLimitButton);
            var called = false;
            Util.onClickEnter($(button), function () {
                if (called) { return; }
                called = true;
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'Q_UPDATE_LIMIT',
                }, function (e, data) {
                    called = false;
                    UI.alert(data ? Messages.admin_updateLimitDone  || 'done' : 'error' + e);
                });
            });
            cb(button);
        });
        //enableembedss
        sidebar.addCheckboxItem({
            key: 'enableembeds',
            getState: function () {
                return APP.instanceStatus.enableEmbedding;
            },
            query: function (val, setState) {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['ENABLE_EMBEDDING', [val]]
                }, function (e, response) {
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        console.error(e, response);
                    }
                    APP.updateStatus(function () {
                        setState(APP.instanceStatus.enableEmbedding);
                        flushCacheNotice();
                    });
                });
            },
        });

        //2fa
        sidebar.addCheckboxItem({
            key: 'forcemfa',
            getState: function () {
                return APP.instanceStatus.enforceMFA;
            },
            query: function (val, setState) {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['EENFORCE_MFA', [val]]
                }, function (e, response) {
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        console.error(e, response);
                    }
                    APP.updateStatus(function () {
                        setState(APP.instanceStatus.enforceMFA);
                        flushCacheNotice();
                    });
                });
            },
        });

       
        var getInstanceString = function (attr) {
        var val = APP.instanceStatus[attr];
        var type = typeof(val);
        switch (type) {
            case 'string': return val || '';
            case 'object': return val.default || '';
            default: return '';
        }
        };
        //admin email
        sidebar.addItem('email', function (cb) {
            // create input
            var input = blocks.input({
                type: 'email',
                value: ApiConfig.adminEmail || '',
                'aria-labelledby': 'cp-admin-email'
            });
            var $input = $(input);
            // create button
            var button = blocks.button('primary', '',Messages.settings_save);
            var $button = $(button);
            var nav = blocks.nav([button]);
            // create current value text
    
            // add these items in a form
            var form = blocks.form([
                input,
            ], nav);
            
            var spinner = UI.makeSpinner($(form));//does not put the spinner in the right position
            
            Util.onClickEnter($(button), function () {
                if (!$input.val()) { return; }
                spinner.spin();
                $button.attr('disabled', 'disabled');
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['SET_ADMIN_EMAIL', [$input.val()]]
                }, function (e, response) {
                    $button.removeAttr('disabled');
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        $input.val('');
                        console.error(e, response);
                        spinner.hide();
                        return;
                    }
                    spinner.done();
                    UI.log(Messages.saved);
                });
            });

            cb(form);
        });
        //info notice
        sidebar.addItem('instance-info-notice', function(cb){
            var key = 'instance-info-notice';
            var notice = blocks.alert( 'info', key, [Messages.admin_infoNotice1, ' ', Messages.admin_infoNotice2]);
            cb(notice);
        });
        //instance name
        sidebar.addItem('name', function(cb){
             // create button
             var button = blocks.button('primary', '',Messages.settings_save);
             var $button = $(button);
             var nav = blocks.nav([button]);

             var inputName = blocks.input({
                type: 'text',
                value: getInstanceString('instanceName') || ApiConfig.httpUnsafeOrigin || '',
                placeholder: ApiConfig.httpUnsafeOrigin,
                'aria-labelledby': 'cp-admin-name'
            });
            var $input = $(inputName);

            var form = blocks.form([
                inputName,
            ], nav);
            
            var spinner = UI.makeSpinner($(form));

            Util.onClickEnter($(button), function () {
                if (!$input.val()) { return; }
                spinner.spin();
                $button.attr('disabled', 'disabled');
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['SET_INSTANCE_NAME', [$input.val().trim()]]
                }, function (e, response) {
                    $button.removeAttr('disabled');
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        $input.val('');
                        console.error(e, response);
                        spinner.hide();
                        return;
                    }
                    spinner.done();
                    UI.log(Messages._getKey('ui_saved', [Messages.admin_nameTitle]));
                });
            });

            cb(form);
        });
        //instance description
        sidebar.addItem('description', function(cb){

            var textarea = blocks.textArea('cp-admin-description-text', {
                placeholder: Messages.home_host || '',
                'aria-labelledby': 'cp-admin-description'
            }, getInstanceString('instanceDescription'));
            var $input = $(textarea);

            var button = blocks.button('primary', '', Messages.settings_save);
            var $button = $(button);
            var nav = blocks.nav([button]);

            var form = blocks.form([
                textarea,
            ], nav); 

            var spinner = UI.makeSpinner($(form));

            Util.onClickEnter($(button), function () {
                spinner.spin();
                $button.attr('disabled', 'disabled');
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['SET_INSTANCE_DESCRIPTION', [$input.val().trim()]]
                }, function (e, response) {
                    $button.removeAttr('disabled');
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        $input.val('');
                        console.error(e, response);
                        spinner.hide();
                        return;
                    }
                    spinner.done();
                    console.log("am salvat");
                    UI.log(Messages._getKey('ui_saved', [Messages.admin_descriptionTitle]));
                });
            });
            cb(form);
        });

        sidebar.addItem('jurisdiction', function (cb){

            var button = blocks.button('primary', '', Messages.settings_save);
            var $button = $(button);
            var nav = blocks.nav([button]);

            var input = blocks.input({
                type: 'text',
                value: getInstanceString('instanceJurisdiction'),
                placeholder: Messages.owner_unknownUser || '',
                'aria-labelledby': 'cp-admin-jurisdiction'
            });
            var $input = $(input);

            var form = blocks.form([
                input,
            ], nav); 

            var spinner = UI.makeSpinner($(form));

            Util.onClickEnter($(button), function () {
                spinner.spin();
                $button.attr('disabled', 'disabled');
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['SET_INSTANCE_JURISDICTION', [$input.val().trim()]]
                }, function (e, response) {
                    $button.removeAttr('disabled');
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        $input.val('');
                        console.error(e, response);
                        spinner.hide();
                        return;
                    }
                    spinner.done();
                    console.log("am salvat");
                    UI.log(Messages._getKey('ui_saved', [Messages.admin_jurisdictionTitle]));
                });
            });
            cb(form);
        });

        sidebar.addItem('notice', function (cb){

            var button = blocks.button('primary', '', Messages.settings_save);
            var $button = $(button);
            var nav = blocks.nav([button]);

            var input = blocks.input({
                type: 'text',
                value: getInstanceString('instanceNotice'),
                placeholder: '',
                'aria-labelledby': 'cp-admin-notice'
            });
            var $input = $(input);

            var form = blocks.form([
                input,
            ], nav); 

            var spinner = UI.makeSpinner($(form));

            Util.onClickEnter($(button), function () {
                spinner.spin();
                $button.attr('disabled', 'disabled');
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['SET_INSTANCE_NOTICE', [$input.val().trim()]]
                }, function (e, response) {
                    $button.removeAttr('disabled');
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        $input.val('');
                        console.error(e, response);
                        spinner.hide();
                        return;
                    }
                    spinner.done();
                    console.log("am salvat");
                    UI.log(Messages._getKey('ui_saved', [Messages.admin_noticeTitle]));
                });
            });
            cb(form);
        });

        var getPrettySize = UIElements.prettySize;
        //user blocks
        //storage blocks
        sidebar.addItem('defaultlimit', function (cb) {

            var _limit = APP.instanceStatus.defaultStorageLimit;
            var _limitMB = Util.bytesToMegabytes(_limit);
            var limit = getPrettySize(_limit);

            // create input
            var newLimit = blocks.input({
                type: 'number',
                min: 0,
                value: _limitMB,
                'aria-labelledby': 'cp-admin-defaultlimit'
            });
            // create button
            var button = blocks.button('primary', '', Messages.admin_setlimitButton);
            var nav = blocks.nav([button]);
            // create current value text
            var text = blocks.text(Messages._getKey('admin_limit', [limit]));
            // add these items in a form
            var form = blocks.form([
                text,
                newLimit
            ], nav);

            // Add button handler
            UI.confirmButton(button, {
                classes: 'btn-primary',
                multiple: true,
                validate: function () {
                    var l = parseInt($(newLimit).val());
                    if (isNaN(l)) { return false; }
                    return true;
                }
            }, function () {
                var lMB = parseInt($(newLimit).val()); // Megabytes
                var l = lMB * 1024 * 1024; // Bytes
                var data = [l];
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['UPDATE_DEFAULT_STORAGE', data]
                }, function (e, response) {
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        return void console.error(e, response);
                    }
                    var limit = getPrettySize(l);
                    $(text).text(Messages._getKey('admin_limit', [limit]));
                });
            });

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
        $(waitFor(UI.addLoadingScreen));
        SFCommon.create(waitFor(function(c) { APP.common = common = c; }));
    }).nThen(function(waitFor) {
        APP.$container = $('#cp-sidebarlayout-container');
        APP.$toolbar = $('#cp-toolbar');
        sFrameChan = common.getSframeChannel();
        sFrameChan.onReady(waitFor());
    }).nThen(function (waitFor) {
        if (!common.isAdmin()) { return; }
        updateStatus(waitFor());
    }).nThen(function( /*waitFor*/ ) {
        metadataMgr = common.getMetadataMgr();
        privateData = metadataMgr.getPrivateData();
        common.setTabTitle(Messages.adminPage || 'Administration');

        if (!common.isAdmin()) {
            return void UI.errorLoadingScreen(Messages.admin_authError || '403 Forbidden');
        }

        // Add toolbar
        createToolbar();

        // Content
        andThen(common, APP.$container);

        common.setTabTitle(Messages.settings_title);
        UI.removeLoadingScreen();
    });
});
