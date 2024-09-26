// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/common/toolbar.js',
    '/common/pad-types.js',
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
    '/api/config',
    '/api/instance',
    '/lib/datepicker/flatpickr.js',
    '/install/onboardscreen.js',

    'css!/lib/datepicker/flatpickr.min.css',
    'css!/components/bootstrap/dist/css/bootstrap.min.css',
    'css!/components/components-font-awesome/css/font-awesome.min.css',
    'less!/admin/app-admin.less',
], function(
    $,
    Toolbar,
    PadTypes,
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
    ApiConfig,
    Instance,
    Flatpickr,
    Onboarding,
) {

    var APP = window.APP = {};

    var Nacl = window.nacl;
    var common;
    var sFrameChan;

    var andThen = function (common, $container) {
        const sidebar = Sidebar.create(common, 'admin', $container);
        // UNUSED-TRANSLATIONS:START
        var categories = {
            'general': { // Msg.admin_cat_general
                icon: 'fa fa-user-o',
                content: [
                    'instance-info-notice',
                    'name',
                    'description',
                    'email',
                    'jurisdiction',
                    'flush-cache'
                ]
            },
            'customize': { // Msg.admin_cat_customize
                icon: 'fa fa-paint-brush',
                content: [
                    'logo',
                    'color',
                ]
            },
            'broadcast' : { // Msg.admin_cat_broadcast
                icon: 'fa fa-bullhorn',
                content : [
                    'notice',
                    'maintenance',
                    'survey',
                    'broadcast'
                ]
            },
            'security': { // Msg.admin_cat_security
                icon: 'fa fa-lock',
                content: [
                    'enableembeds',
                    'forcemfa',
                ]
            },
            'apps': { // Msg.admin_cat_apps
                icon: 'fa  fa-wrench',
                content: [
                    'apps',
                ]
            },
            'users' : { // Msg.admin_cat_users
                icon : 'fa fa-address-card-o',
                content : [
                'registration',
                'invitation',
                'users'
                ]
            },
            'quota': { // Msg.admin_cat_quota
                icon: 'fa fa-hdd-o',
                content: [
                    'defaultlimit',
                    'setlimit',
                    'getlimits',
                ]
            },
            'database' : { // Msg.admin_cat_database
                icon : 'fa fa-database',
                content : [
                    'account-metadata',
                    'document-metadata',
                    'block-metadata',
                    'totp-recovery',

                ]
            },
            'support' : { // Msg.admin_cat_support
                icon : 'fa fa-ambulance',
                content : [
                    'support-setup',
                    'support-team',
                ]
            },
            'stats' : { // Msg.admin_cat_stats
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
            'performance' : { // Msg.admin_cat_performance
                icon : 'fa fa-heartbeat',
                content : [
                    'refresh-performance',
                    'performance-profiling',
                    'enable-disk-measurements',
                    'bytes-written',
                ]
            },
            'network' : { // Msg.admin_cat_network
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

        // EXTENSION_POINT:ADMIN_CATEGORY
        common.getExtensions('ADMIN_CATEGORY').forEach(ext => {
            if (!ext || !ext.id || !ext.name || !ext.content) {
                return console.error('Invalid extension point', 'ADMIN_CATEGORY', ext);
            }
            if (categories[ext.id]) {
                return console.error('Extension point ID already used', ext);
            }
            console.error(ext);
            categories[ext.id] = {
                icon: ext.icon,
                name: ext.name,
                content: ext.content
            };
        });

        const flushCache = (cb) => {
            cb = cb || function () {};
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'FLUSH_CACHE',
            }, cb);
        };
        /*
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
        */

        //general blocks

        // Msg.admin_flushCacheHint, .admin_flushCacheTitle, .admin_flushCacheButton
        sidebar.addItem('flush-cache', function (cb) {
            var button = blocks.activeButton('primary', '',
                    Messages.admin_flushCacheButton, done => {
                flushCache(function (e, data) {
                    done(!!data);
                    UI.alert(data ? Messages.admin_flushCacheDone || 'done' : 'error' + e);
                });
            });
            cb(button);
        });

        var isHex = s => !/[^0-9a-f]/.test(s);

        var sframeCommand = function (command, data, cb) {
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: command,
                data: data,
            }, function (err, response) {
                if (err) { return void cb(err); }
                if (response && response.error) { return void cb(response.error); }
                try {
                    cb(void 0, response);
                } catch (err2) {
                    console.error(err2);
                }
            });
        };

        // XXX make this use blocks
        var makeMetadataTable = function (cls) {
            var table = h(`table.${cls || 'cp-account-stats'}`);
            var row = (label, value) => {
                table.appendChild(h('tr', [
                    h('td', h('strong', label)),
                    h('td', value)
                ]));
            };

            return {
                row: row,
                table: table,
            };
        };

        var getPrettySize = UIElements.prettySize;

        var localizeState = state => {
            var o = {
                'true': Messages.ui_true,
                'false': Messages.ui_false,
                'undefined': Messages.ui_undefined,
            };
            return o[state] || Messages.error;
        };

        var disable = $el => $el.attr('disabled', 'disabled');
        var enable = $el => $el.removeAttr('disabled');

        var maybeDate = function (d) {
            return d? new Date(d): Messages.ui_undefined;
        };

        var justifyDialog = (message, suggestion, implicit, explicit) => {
            UI.prompt(message, suggestion, result => {
                if (result === null) { return; }
                if (typeof(result) !== 'string') { result = ''; }
                else { result = result.trim(); }
                implicit(result); // remember the justification for next time
                explicit(result); // follow up with the action
            }, {
                ok: Messages.ui_confirm,
                inputOpts: {
                    placeholder: Messages.admin_archiveNote || '',
                },
            });
        };

        var archiveReason = "";
        var justifyArchivalDialog = (customMessage, action) => {
            var message = customMessage || Messages.admin_archiveReason;
            justifyDialog(message, archiveReason, reason => { archiveReason = reason; }, action);
        };

        var restoreReason = "";
        var justifyRestorationDialog = (customMessage, action) => {
            var message = customMessage || Messages.admin_restoreReason;
            justifyDialog(message, restoreReason, reason => { restoreReason = reason; }, action);
        };

        var copyToClipboard = (content) => {
            var button = blocks.activeButton('primary','', Messages.copyToClipboard, () => {
                var toCopy = JSON.stringify(content, null, 2);
                Clipboard.copy(toCopy, (err) => {
                    if (err) { return UI.warn(Messages.error); }
                    UI.log(Messages.genericCopySuccess);
                });
            }, true);
            return button;
        };

        var reportContentLabel = () => {
            return h('span', [
                Messages.admin_reportContent,
                ' (JSON) ',
                h('br'),
                h('small', Messages.ui_experimental),
            ]);
        };

        var DOCUMENT_TYPES = {
            32: 'channel',
            48: 'file',
            33: 'ephemeral',
            34: 'broadcast',
        };

        var inferDocumentType = id => {
            return DOCUMENT_TYPES[typeof(id) === 'string' && id.length] || 'unknown';
        };

        var renderAccountData = function (data) {
            var tableObj = makeMetadataTable('cp-account-stats');
            var row = tableObj.row;

            // info
            row(Messages.admin_generatedAt, new Date(data.generated));

            // signing key
            if (data.key === data.safeKey) {
                row(Messages.settings_publicSigningKey, h('code', data.key));
            } else {
                row(Messages.settings_publicSigningKey, h('span', [
                    h('code', data.key),
                    ', ',
                    h('br'),
                    h('code', data.safeKey),
                ]));
            }

            if (data.first || data.latest) {
                // First pin activity time
                row(Messages.admin_firstPinTime, maybeDate(data.first));

                // last pin activity time
                row(Messages.admin_lastPinTime, maybeDate(data.latest));
            }

            // currently online
            row(Messages.admin_currentlyOnline, localizeState(data.currentlyOnline));

            // plan name
            row(Messages.admin_planName, data.plan || Messages.ui_none);

            // plan note
            row(Messages.admin_note, data.note || Messages.ui_none);

            // storage limit
            if (data.limit) { row(Messages.admin_planlimit, getPrettySize(data.limit)); }

            // data stored
            if (data.usage) { row(Messages.admin_storageUsage, getPrettySize(data.usage)); }

            // number of channels
            if (typeof(data.channel) === "number") {
                row(Messages.admin_channelCount, data.channels);
            }

            // number of files pinned
            if (typeof(data.channel) === "number") {
                row(Messages.admin_fileCount, data.files);
            }

            row(Messages.admin_pinLogAvailable, localizeState(data.live));

            // pin log archived
            row(Messages.admin_pinLogArchived, localizeState(data.archived));

            if (data.archiveReport) {
                row(Messages.admin_accountSuspended, localizeState(Boolean(data.archiveReport)));
            }
            if (data.archiveReport_formatted) {
                let button, pre;
                row(Messages.admin_accountReport, h('div', [
                    pre = h('pre', data.archiveReport_formatted),
                    button = blocks.activeButton('primary', '',
                            Messages.admin_accountReportFull, () => {
                        $(button).remove();
                        $(pre).html(JSON.stringify(data.archiveReport, 0, 2));
                    }, true)
                ]));
            }


            // actions
            if (data.archived && data.live === false && data.archiveReport) {
                let button = blocks.activeButton('primary', '',
                        Messages.ui_restore, () => {
                    justifyRestorationDialog('', reason => {
                        sframeCommand('RESTORE_ACCOUNT', {
                            key: data.key,
                            reason: reason,
                        }, function (err) {
                            if (err) {
                                console.error(err);
                                return void UI.warn(Messages.error);
                            }
                            UI.log(Messages.ui_success);
                        });
                    });
                }, true);
                row(Messages.admin_restoreAccount, button);
            }

            if (data.live === true) {
                var getPins = (done) => {
                    sframeCommand('GET_PIN_LIST', data.key, (err, pins) => {
                        done(!err && Array.isArray(pins));
                        if (err || !Array.isArray(pins)) {
                            console.error(err);
                            return void UI.warn(Messages.error);
                        }

                        var table = makeMetadataTable('cp-pin-list').table;
                        var row = id => {
                            var type = inferDocumentType(id);
                            table.appendChild(h('tr', [
                                h('td', h('code', id)),
                                h('td', type),
                            ]));
                        };

                        var P = pins.slice().sort((a, b) => a.length - b.length);
                        P.map(row);

                        UI.confirm(table, yes => {
                            if (!yes) { return; }
                            var content = P.join('\n');
                            Clipboard.copy(content, (err) => {
                                if (err) { return UI.warn(Messages.error); }
                                UI.log(Messages.genericCopySuccess);
                            });
                        }, {
                            wide: true,
                            ok: Messages.copyToClipboard,
                        });
                    });
                };

                // get full pin list
                row(Messages.admin_getPinList, blocks.activeButton('primary', '', Messages.ui_fetch, getPins));

                // get full pin history
                var getHistoryHandler = (done) => {
                    sframeCommand('GET_PIN_HISTORY', data.key, (err, history) => {
                        done(!err);
                        if (err) {
                            console.error('Error retrieving pin history:', err);
                            return void UI.warn(Messages.error);
                        }
                        UI.alert(history); // TODO NOT_IMPLEMENTED
                    });
                };
                var pinHistoryButton = blocks.activeButton('primary', '', Messages.ui_fetch, getHistoryHandler);
                disable($(pinHistoryButton));

                // TODO pin history is not implemented
                //row(Messages.admin_getFullPinHistory, pinHistoryButton);

                // archive pin log
                var archiveHandler = () => {
                    justifyArchivalDialog(Messages.admin_archiveAccountConfirm, reason => {
                        sframeCommand('ARCHIVE_ACCOUNT', {
                            key: data.key,
                            block: data.blockId,
                            reason: reason,
                        }, (err /*, response */) => {
                            //console.error(err);
                            if (err) {
                                console.error(err);
                                return void UI.warn(Messages.error);
                            }
                            UI.log(Messages.ui_success);
                        });
                    });
                };

                var archiveAccountLabel = h('span', [
                    Messages.admin_archiveAccount,
                    h('br'),
                    h('small', Messages.admin_archiveAccountInfo)
                ]);
                let archiveAccountButton = blocks.activeButton('danger', '',
                                Messages.admin_archiveButton, archiveHandler, true);
                row(archiveAccountLabel, archiveAccountButton);

                // archive owned documents
                /* // TODO not implemented
                var archiveDocuments = () => {
                    justifyRestorationDialog(Messages.admin_archiveDocumentsConfirm, reason => {
                        sframeCommand('ARCHIVE_OWNED_DOCUMENTS', {
                            key: data.key,
                            reason: reason,
                        }, (err, response) => {
                            if (err) { return void UI.warn(err); }
                            UI.log(response);
                        });
                    });
                };

                var archiveDocumentsButton = danger(Messages.admin_archiveButton, archiveDocuments);
                disable($(archiveDocumentsButton));
                row(Messages.admin_archiveOwnedAccountDocuments, archiveDocumentsButton);
             */
            }

            row(reportContentLabel, copyToClipboard(data));

            return tableObj.table;
        };

        // Msg.admin_updateLimitHint, .admin_updateLimitTitle, .admin_updateLimitButton
        sidebar.addItem('update-limit', function (cb) {
            var button = blocks.activeButton('primary', '',
                    Messages.admin_updateLimitButton, done => {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'Q_UPDATE_LIMIT',
                }, function (e, data) {
                    done(!!data);
                    UI.alert(data ? Messages.admin_updateLimitDone  || 'done' : 'error' + e);
                });
            });
            cb(button);
        });

        // Msg.admin_enableembedsHint, .admin_enableembedsTitle
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
                        flushCache();
                    });
                });
            },
        });

        // Msg.admin_forcemfaHint, .admin_forcemfaTitle
        sidebar.addCheckboxItem({
            key: 'forcemfa',
            getState: function () {
                return APP.instanceStatus.enforceMFA;
            },
            query: function (val, setState) {
                var isChecked = APP.instanceStatus.enforceMFA;
                function showConfirmation(isChecked, setState) {
                    const confirmationContent = isChecked ? Messages.admin_mfa_confirm_disable : Messages.admin_mfa_confirm_enable;
                    UI.confirm(confirmationContent, function (confirmed) {
                        if (!confirmed) {
                            // User canceled their changes, restore the checkbox value
                            setState(isChecked);
                            return;
                        }
                        // User confirmed their changes, call the command and update the state
                        sFrameChan.query('Q_ADMIN_RPC', {
                            cmd: 'ADMIN_DECREE',
                            data: ['ENFORCE_MFA', [val]]
                        }, function (e, response) {
                            if (e || response.error) {
                                UI.warn(Messages.error);
                                console.error(e, response);
                            } else {
                                APP.updateStatus(function () {
                                    setState(APP.instanceStatus.enforceMFA);
                                    flushCache();
                                });
                            }
                        });
                    });
                }
                showConfirmation(isChecked, setState);
            }
        });



        var getInstanceString = function (attr) {
            var val = APP.instanceStatus[attr];
            var type = typeof(val);
            switch (type) {
                case 'string':
                    return val || '';
                case 'object':
                    return val.default || '';
                default:
                    return '';
            }
        };

        // Msg.admin_emailHint, Msg.admin_emailTitle
        sidebar.addItem('email', function (cb){
            var input = blocks.input({
                type: 'email',
                value: ApiConfig.adminEmail || '',
                'aria-labelledby': 'cp-admin-email'
            });
            var $input = $(input);

            var button = blocks.activeButton('primary', '', Messages.settings_save, function (done) {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['SET_ADMIN_EMAIL', [$input.val().trim()]]
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
                    UI.log(Messages._getKey('ui_saved', [Messages.admin_emailTitle]));
                });
            });
            var nav = blocks.nav([button]);

            var form = blocks.form([
                input,
            ], nav);

            $(nav).append(button.spinner);

            cb(form);
        });

        sidebar.addItem('apps', function (cb) {
            const appsToDisable = ApiConfig.appsToDisable || [];
            const grid = Onboarding.createAppsGrid(appsToDisable);

            var save = blocks.activeButton('primary', '', Messages.settings_save, function (done) {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['DISABLE_APPS', appsToDisable]
                }, function (e, response) {
                    if (e || response.error) {
                        UI.warn(Messages.error);
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


        sidebar.addItem('instance-info-notice', function(cb){
            var key = 'instance-info-notice';
            var notice = blocks.alert('info', key, [Messages.admin_infoNotice1, ' ', Messages.admin_infoNotice2]);
            cb(notice);
        },  {
            noTitle: true,
            noHint: true
        });

        // Msg.admin_nameHint, Msg.admin_nameTitle, Msg.admin_nameButton
        sidebar.addItem('name', function (cb){
            var input = blocks.input({
                type: 'text',
                value: getInstanceString('instanceName')|| ApiConfig.httpUnsafeOrigin || '',
                placeholder: ApiConfig.httpUnsafeOrigin,
                'aria-labelledby': 'cp-admin-name'
            });
            var $input = $(input);

            var button = blocks.activeButton('primary', '', Messages.settings_save, function (done) {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['SET_INSTANCE_NAME', [$input.val().trim()]]
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
                    UI.log(Messages._getKey('ui_saved', [Messages.admin_nameTitle]));
                });
            });

            var nav = blocks.nav([button]);
            var form = blocks.form([
                input,
            ], nav);

            $(nav).append(button.spinner);

            cb(form);
        });

        // Msg.admin_descriptionHint, Msg.admin_descriptionTitle
        sidebar.addItem('description', function (cb){
            var textarea = blocks.textarea({
                placeholder: Messages.home_host || '',
                'aria-labelledby': 'cp-admin-description'
            }, getInstanceString('instanceDescription'));
            var $input = $(textarea);
            var button = blocks.activeButton('primary', '', Messages.settings_save, function (done) {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['SET_INSTANCE_DESCRIPTION', [$input.val().trim()]]
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
                    UI.log(Messages._getKey('ui_saved', [Messages.admin_descriptionTitle]));
                });
            });

            var nav = blocks.nav([button]);
            $(nav).append(button.spinner);

            var form = blocks.form([
                textarea,
            ], nav);

            cb(form);
        });

        // Msg.admin_jurisdictionHint, Msg.admin_jurisdictionTitle
        sidebar.addItem('jurisdiction', function (cb){
            var input = blocks.input({
                type: 'text',
                value: getInstanceString('instanceJurisdiction'),
                placeholder: Messages.owner_unknownUser || '',
                'aria-labelledby': 'cp-admin-jurisdiction'
            });
            var $input = $(input);

            var button = blocks.activeButton('primary', '', Messages.settings_save, function (done) {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['SET_INSTANCE_JURISDICTION', [$input.val().trim()]]
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
                    UI.log(Messages._getKey('ui_saved', [Messages.admin_jurisdictionTitle]));
                });
            });

            var nav = blocks.nav([button]);
            $(nav).append(button.spinner);

            var form = blocks.form([
                input,
            ], nav);

            cb(form);
        });

        // Messages.admin_noticeHint, Messages.admin_noticeTitle
        sidebar.addItem('notice', function (cb){
            var input = blocks.input({
                type: 'text',
                value: getInstanceString('instanceNotice'),
                placeholder: '',
                'aria-labelledby': 'cp-admin-notice'
            });
            var $input = $(input);

            var button = blocks.activeButton('primary', '', Messages.settings_save, function (done) {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['SET_INSTANCE_NOTICE', [$input.val().trim()]]
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
                    UI.log(Messages._getKey('ui_saved', [Messages.admin_noticeTitle]));
                });
            });

            var nav = blocks.nav([button]);
            $(nav).append(button.spinner);

            var form = blocks.form([
                input,
            ], nav);

            cb(form);
        });

        // Msg.admin_logoHint, Msg.admin_logoTitle
        sidebar.addItem('logo', (cb) => {

            let input = blocks.input({
                type: 'file',
                accept: 'image/*',
                'aria-labelledby': 'cp-admin-logo'
            });

            var currentContainer = blocks.block([], 'cp-admin-customize-logo');
            let redraw = () => {
                var current = h('img', {src: '/api/logo?'+(+new Date()),alt:'Custom logo'}); // XXX
                $(currentContainer).empty().append(current);
            };
            redraw();

            var upload = blocks.button('primary', '', Messages.admin_logoButton);
            var remove = blocks.button('danger', '', Messages.admin_logoRemoveButton);

            let spinnerBlock = blocks.inline();
            let spinner = UI.makeSpinner($(spinnerBlock));
            let form = blocks.form([
                currentContainer,
                blocks.block(input),
                blocks.nav([upload, remove, spinnerBlock])
            ]);

            let $button = $(upload);
            let $remove = $(remove);

            Util.onClickEnter($button, function () {
                let files = input.files;
                if (files.length !== 1) {
                    UI.warn(Messages.error);
                    return;
                }
                spinner.spin();
                $button.attr('disabled', 'disabled');
                let reader = new FileReader();
                reader.onloadend = function () {
                    let dataURL = this.result;
                    sframeCommand('UPLOAD_LOGO', {dataURL}, (err, response) => {
                        $button.removeAttr('disabled');
                        if (err) {
                            UI.warn(Messages.error);
                            $(input).val('');
                            console.error(err, response);
                            spinner.hide();
                            return;
                        }
                        redraw();
                        spinner.done();
                        UI.log(Messages.saved);
                    });
                };
                reader.readAsDataURL(files[0]);
            });
            UI.confirmButton($remove, {
                classes: 'btn-danger',
                multiple: true
            }, function () {
                spinner.spin();
                $remove.attr('disabled', 'disabled');
                sframeCommand('REMOVE_LOGO', {}, (err, response) => {
                    $remove.removeAttr('disabled');
                    if (err) {
                        UI.warn(Messages.error);
                        console.error(err, response);
                        spinner.hide();
                        return;
                    }
                    redraw();
                    spinner.done();
                    UI.log(Messages.saved);
                });
            });

            cb(form);
        });

        // Msg.admin_colorHint, Msg.admin_colorTitle
        sidebar.addItem('color', cb => {
            let input = blocks.input({
                type: 'color',
                value: (Instance && Instance.color) || '#0087FF'
            });
            let label = blocks.labelledInput(Messages.admin_colorPick, input);
            let current = blocks.block([], 'cp-admin-color-current');
            let labelCurrent = blocks.labelledInput(Messages.admin_colorCurrent, current);
            let preview = blocks.block([
                blocks.block([
                    blocks.link('CryptPad', '/admin/#customize'),
                    blocks.button('primary', 'fa-floppy-o', Messages.settings_save),
                    blocks.button('secondary', 'fa-floppy-o', Messages.settings_save)
                ], 'cp-admin-color-preview-dark cp-sidebar-flex-block'),
                blocks.block([
                    blocks.link('CryptPad', '/admin/#customize'),
                    blocks.button('primary', 'fa-floppy-o', Messages.settings_save),
                    blocks.button('secondary', 'fa-floppy-o', Messages.settings_save)
                ], 'cp-admin-color-preview-light cp-sidebar-flex-block')
            ], 'cp-admin-color-preview');
            let labelPreview = blocks.labelledInput(Messages.admin_colorPreview, preview);
            let $preview = $(preview);

            let remove = blocks.button('danger', '', Messages.admin_logoRemoveButton);
            let $remove = $(remove);

            let setColor = (color, done) => {
                sframeCommand('CHANGE_COLOR', {color}, (err, response) => {
                    if (err) {
                        UI.warn(Messages.error);
                        console.error(err, response);
                        done(false);
                        return;
                    }
                    done(true);
                    UI.log(Messages.saved);
                });
            };

            let btn = blocks.activeButton('primary', '',
              Messages.admin_colorChange, (done) => {
                let color = $input.val();
                setColor(color, done);
            });

            let onColorPicked = () => {
                require(['/lib/less.min.js'], (Less) => {
                    let color = $input.val();
                    let lColor = Less.color(color.slice(1));
                    let lighten = Less.functions.functionRegistry._data.lighten;
                    let lightColor = lighten(lColor, {value:30}).toRGB();
                    $preview.find('.btn-primary').css({
                        'background-color': color
                    });
                    $preview.find('.cp-admin-color-preview-dark .btn-secondary').css({
                        'border-color': lightColor,
                        'color': lightColor,
                    });
                    $preview.find('.cp-admin-color-preview-light .btn-secondary').css({
                        'border-color': color,
                        'color': color,
                    });
                    $preview.find('.cp-admin-color-preview-dark a').attr('style', `color: ${lightColor} !important`);
                    $preview.find('.cp-admin-color-preview-light a').attr('style', `color: ${color} !important`);
                });
            };
            let $input = $(input).on('change', onColorPicked).addClass('cp-admin-color-picker');

            UI.confirmButton($remove, {
                classes: 'btn-danger',
                multiple: true
            }, function () {
                $remove.attr('disabled', 'disabled');
                setColor('', () => {});
            });

            var colors = UIElements.makePalette(4, (color, $color) => {
                // onselect
                let rgb = $color.css('background-color');
                let hex = Util.rgbToHex(rgb);
                $input.val(hex);
                onColorPicked();
            });

            $(label).append(colors);
            let form = blocks.form([
                labelCurrent,
                label,
            ], blocks.nav([btn, remove, btn.spinner]));

            cb([form, labelPreview]);
        });

        // Msg.admin_registrationHint, .admin_registrationTitle
        // Msg.admin_registrationSsoTitle
        sidebar.addItem('registration', function(cb){
            var refresh = function () {};

            var restrict = blocks.activeCheckbox({
                key: 'registration',
                getState: function () {
                    return APP.instanceStatus.restrictRegistration;
                },
                query: function (val, setState) {
                    sFrameChan.query('Q_ADMIN_RPC', {
                        cmd: 'ADMIN_DECREE',
                        data: ['RESTRICT_REGISTRATION', [val]]
                    }, function (e, response) {
                        if (e || response.error) {
                            UI.warn(Messages.error);
                            console.error(e, response);
                        }
                        APP.updateStatus(function () {
                            setState(APP.instanceStatus.restrictRegistration);
                            refresh();
                            flushCache();
                        });
                    });
                },
            });

            var restrictSSO = blocks.activeCheckbox({
                key: 'registration-sso',
                getState: function () {
                    return APP.instanceStatus.restrictSsoRegistration;
                },
                query: function (val, setState) {
                    sFrameChan.query('Q_ADMIN_RPC', {
                        cmd: 'ADMIN_DECREE',
                        data: ['RESTRICT_SSO_REGISTRATION', [val]]
                    }, function (e, response) {
                        if (e || response.error) {
                            UI.warn(Messages.error);
                            console.error(e, response);
                        }
                        APP.updateStatus(function () {
                            setState(APP.instanceStatus.restrictSsoRegistration);
                            flushCache();
                        });
                    });
                }
            });
            var ssoEnabled = ApiConfig.sso && ApiConfig.sso.list && ApiConfig.sso.list.length;
            if (!ssoEnabled) { restrictSSO = undefined; }

            var $sso = $(restrictSSO);
            refresh = () => {
                var closed = APP.instanceStatus.restrictRegistration;
                if (closed) {
                    $sso.show();
                } else {
                    $sso.hide();
                }
            };
            refresh();

            cb(blocks.form([restrict, restrictSSO], []));
        });

        // Msg.admin_invitationHint, admin_invitationTitle
        sidebar.addItem('invitation', function(cb){
            var button = blocks.button('primary', '', Messages.admin_invitationCreate);
            var $b = $(button);

            var inputAlias = blocks.input({
                type: 'text'
            });
            var blockAlias = blocks.labelledInput(Messages.admin_invitationAlias, inputAlias);

            var inputEmail = blocks.input({
                type: 'email'
            });
            var blockEmail = blocks.labelledInput(Messages.admin_invitationEmail, inputEmail);

            var refreshInvite = function () {};
            var refreshButton = blocks.button('secondary', '', Messages.oo_refresh);
            Util.onClickEnter($(refreshButton), function () {
                refreshInvite();
            });

            var header = [
                Messages.admin_invitationLink,
                Messages.admin_invitationAlias,
                Messages.admin_invitationEmail,
                Messages.admin_documentCreationTime,
                ""
            ];
            var list = blocks.table(header, []);
            list.setAttribute('id', 'cp-admin-table');
            let div = blocks.block([list]);
            div.setAttribute('id', 'cp-admin-table-container');

            var nav = blocks.nav([button, refreshButton]);
            var form = blocks.form([
                blockAlias,
                blockEmail
            ], nav);

            var metadataMgr = common.getMetadataMgr();
            var privateData = metadataMgr.getPrivateData();

            var deleteInvite = function (id) {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'DELETE_INVITATION',
                    data: id
                }, function (e, response) {
                    $b.prop('disabled', false);
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        return void console.error(e, response);
                    }
                    refreshInvite();
                });
            };

            let sort = all => {
                return (k1, k2) => {
                    return all[k1].time - all[k2].time;
                };
            };
            refreshInvite = function () {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'GET_ALL_INVITATIONS',
                }, function (e, response) {
                    if (e || response.error) {
                        if (!response || response.error !== "ENOENT") { UI.warn(Messages.error); }
                        console.error(e, response);
                        return;
                    }
                    if (!Array.isArray(response)) { return; }
                    var all = response[0];
                    var newEntries = [];

                    Object.keys(all).sort(sort(all)).forEach(function (key) {
                        var data = all[key];
                        var url = privateData.origin + Hash.hashToHref(key, 'register');

                        var del = blocks.button('danger', 'fa-trash', Messages.kanban_delete );
                        var $del = $(del);
                        Util.onClickEnter($del, function () {
                            $del.attr('disabled', 'disabled');
                            UI.confirm(Messages.admin_invitationDeleteConfirm, function (yes) {
                                $del.attr('disabled', '');
                                if (!yes) { return; }
                                deleteInvite(key);
                            });
                        });
                        var copy = blocks.button('secondary', 'fa-clipboard', Messages.admin_invitationCopy);
                        Util.onClickEnter($(copy), function () {
                            Clipboard.copy(url, () => {
                                UI.log(Messages.genericCopySuccess);
                            });
                        });

                        newEntries.push([
                            UI.dialog.selectable(url),
                            data.alias,
                            data.email,
                            new Date(data.time).toLocaleString(),
                            [copy, del]
                        ]);
                    });
                    list.updateContent(newEntries);

                });

            };
            refreshInvite();

            Util.onClickEnter($b, function () {
                var alias = $(inputAlias).val().trim();
                if (!alias) { return void UI.warn(Messages.error); } // FIXME better error message
                $b.prop('disabled', true);
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'CREATE_INVITATION',
                    data: {
                        alias,
                        email: $(inputEmail).val()
                    }
                }, function (e, response) {
                    $b.prop('disabled', false);
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        return void console.error(e, response);
                    }
                    $(inputAlias).val('').focus();
                    $(inputEmail).val('');
                    refreshInvite();
                });
            });

            cb([form, div]);
        });

        var getBlockId = (val) => {
            var url;
            try {
                url = new URL(val, ApiConfig.httpUnsafeOrigin);
            } catch (err) { }
            var getKey = function () {
                var parts = val.split('/');
                return parts[parts.length - 1];
            };
            var isValidBlockURL = function (url) {
                if (!url) { return; }
                return /* url.origin === ApiConfig.httpUnsafeOrigin && */ /^\/block\/.*/.test(url.pathname) && getKey().length === 44;
            };
            if (isValidBlockURL(url)) {
                return getKey();
            }
            return;
        };

        var getAccountData = function (key, _cb) {
            var cb = Util.once(Util.mkAsync(_cb));
            var data = {
                generated: +new Date(),
                key: key,
                safeKey: Util.escapeKeyCharacters(key),
            };

            return void nThen(function (w) {
                sframeCommand('GET_PIN_ACTIVITY', key, w((err, response) => {
                    if (err === 'ENOENT') { return; }
                    if (err || !response || !response[0]) {
                        console.error(err);
                        console.error(response);
                        UI.warn(Messages.error);
                    } else {
                        data.first = response[0].first;
                        data.latest = response[0].latest;
                        console.info(err, response);
                    }
                }));
            }).nThen(function (w) {
                sframeCommand('IS_USER_ONLINE', key, w((err, response) => {
                    console.log('online', err, response);
                    if (!Array.isArray(response) || typeof(response[0]) !== 'boolean') { return; }
                    data.currentlyOnline = response[0];
                }));
            }).nThen(function (w) {
                if (!data.first) { return; }
                sframeCommand('GET_USER_QUOTA', key, w((err, response) => {
                    if (err || !response) {
                        return void console.error('quota', err, response);
                    } else {
                        data.plan = response[1];
                        data.note = response[2];
                        data.limit = response[0];
                    }
                }));
            }).nThen(function (w) {
                if (!data.first) { return; }
                // storage used
                sframeCommand('GET_USER_TOTAL_SIZE', key, w((err, response) => {
                    if (err || !Array.isArray(response)) {
                        //console.error('size', err, response);
                    } else {
                        //console.info('size', response);
                        data.usage = response[0];
                    }
                }));
            }).nThen(function (w) {
                if (!data.first) { return; }
                // channels pinned
                // files pinned
                sframeCommand('GET_USER_STORAGE_STATS', key, w((err, response) => {
                    if (err || !Array.isArray(response) || !response[0]) {
                        UI.warn(Messages.error);
                        return void console.error('storage stats', err, response);
                    } else {
                        data.channels = response[0].channels;
                        data.files = response[0].files;
                    }
                }));
            }).nThen(function (w) { // pin log status (live, archived, unknown)
                sframeCommand('GET_PIN_LOG_STATUS', key, w((err, response) => {
                    if (err || !Array.isArray(response) || !response[0]) {
                        console.error('pin log status', err, response);
                        return void UI.warn(Messages.error);
                    } else {
                        console.info('pin log status', response);
                        data.live = response[0].live;
                        data.archived = response[0].archived;
                    }
                }));
            }).nThen(function (w) {
                if (data.first) { return; }
                // Account is probably deleted
                sframeCommand('GET_ACCOUNT_ARCHIVE_STATUS', {key}, w((err, response) => {
                    if (err || !Array.isArray(response) || !response[0]) {
                        console.error('account status', err, response);
                    } else {
                        console.info('account status', response);
                        data.archiveReport = response[0];
                    }
                }));
            }).nThen(function () {
                //console.log(data);
                try {
                    ['generated', 'first', 'latest'].forEach(k => {
                        var val = data[k];
                        if (typeof(val) !== 'number') { return; }
                        data[`${k}_formatted`] = new Date(val);
                    });
                    ['limit', 'usage'].forEach(k => {
                        var val = data[k];
                        if (typeof(val) !== 'number') { return; }
                        data[`${k}_formatted`] = getPrettySize(val);
                    });
                    if (data.archiveReport) {
                        let formatted = Util.clone(data.archiveReport);
                        formatted.channels = data.archiveReport.channels.length;
                        formatted.blobs = data.archiveReport.blobs.length;
                        data['archiveReport_formatted'] = JSON.stringify(formatted, 0, 2);
                    }
                } catch (err) {
                    console.error(err);
                }

                cb(void 0, data);
            });
        };

        // Msg.admin_usersHint, admin_usersTitle
        // Msg.admin_storeInvitedLabel
        // Msg.admin_storeSsoLabel
        sidebar.addItem('users', function(cb){

            var invited = blocks.activeCheckbox({
                key: 'store-invited',
                getState: function () {
                    return !APP.instanceStatus.dontStoreInvitedUsers;
                },
                query: function (val, setState) {
                    sFrameChan.query('Q_ADMIN_RPC', {
                        cmd: 'ADMIN_DECREE',
                        data: ['DISABLE_STORE_INVITED_USERS', [!val]]
                    }, function (e, response) {
                        if (e || response.error) {
                            UI.warn(Messages.error);
                            console.error(e, response);
                        }
                        APP.updateStatus(function () {
                            setState(!APP.instanceStatus.dontStoreInvitedUsers);
                            flushCache();
                        });
                    });
                }
            });

            var sso = blocks.activeCheckbox({
                key: 'store-sso',
                getState: function () {
                    return !APP.instanceStatus.dontStoreSSOUsers;
                },
                query: function (val, setState) {
                    sFrameChan.query('Q_ADMIN_RPC', {
                        cmd: 'ADMIN_DECREE',
                        data: ['DISABLE_STORE_SSO_USERS', [!val]]
                    }, function (e, response) {
                        if (e || response.error) {
                            UI.warn(Messages.error);
                            console.error(e, response);
                        }
                        APP.updateStatus(function () {
                            setState(!APP.instanceStatus.dontStoreSSOUsers);
                            flushCache();
                        });
                    });
                }
            });
            var ssoEnabled = ApiConfig.sso && ApiConfig.sso.list && ApiConfig.sso.list.length;

            var button = blocks.button('primary', '', Messages.admin_usersAdd);
            var $b = $(button);

            var userAlias = blocks.input({ type: 'text' });
            var blockAlias = blocks.labelledInput(Messages.admin_invitationAlias, userAlias);

            var userEmail = blocks.input({ type: 'email' });
            var blockEmail = blocks.labelledInput(Messages.admin_invitationEmail, userEmail);

            var userEdPublic = blocks.input({ type: 'key' });
            var blockEdPublic = blocks.labelledInput(Messages.admin_limitUser, userEdPublic);

            var userBlock = blocks.input({ type: 'text' });
            var blockUser = blocks.labelledInput(Messages.admin_usersBlock, userBlock);

            var refreshUsers = function () {};
            var refreshButton = blocks.button('secondary', '', Messages.oo_refresh);
            Util.onClickEnter($(refreshButton), function () {
                refreshUsers();
            });

            var header = [
                Messages.admin_invitationAlias,
                Messages.admin_invitationEmail,
                Messages.admin_limitUser,
                Messages.admin_documentCreationTime,
                ""
            ];
            var list = blocks.table(header, []);
            list.setAttribute('id', 'cp-admin-table');
            let div = blocks.block([list]);
            div.setAttribute('id', 'cp-admin-table-container');

            var nav = blocks.nav([button, refreshButton]);

            if (!ssoEnabled) { sso = undefined; }
            var form = blocks.form([
                invited,
                sso,
                blockAlias,
                blockEmail,
                blockEdPublic,
                blockUser
            ], nav);

            var deleteUser = function (id) {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'DELETE_KNOWN_USER',
                    data: id
                }, function (e, response) {
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        return void console.error(e, response);
                    }
                    refreshUsers();
                });
            };

            var updateUser = function (key, changes) {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'UPDATE_KNOWN_USER',
                    data: {
                        edPublic: key,
                        changes: changes
                    }
                }, function (e, response) {
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        return void console.error(e, response);
                    }
                    refreshUsers();
                });
            };
            let sort = all => {
                return (k1, k2) => {
                    return all[k2].time - all[k1].time;
                };
            };
            refreshUsers = function () {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'GET_ALL_USERS',
                }, function (e, response) {
                    if (e || response.error) {
                        if (!response || response.error !== "ENOENT") { UI.warn(Messages.error); }
                        console.error(e, response);
                        return;
                    }
                    if (!Array.isArray(response)) { return; }
                    var all = response[0];
                    var newEntries = [];
                    Object.keys(all).sort(sort(all)).forEach(function (key) {
                        var data = all[key];
                        var editUser = () => {};
                        var del = blocks.button('danger', 'fa fa-trash', Messages.admin_usersRemove);
                        var $del = $(del);
                        Util.onClickEnter($del, function () {
                            $del.attr('disabled', 'disabled');
                            UI.confirm(Messages.admin_usersRemoveConfirm, function (yes) {
                                $del.attr('disabled', '');
                                if (!yes) { return; }
                                deleteUser(key);
                            });
                        });
                        var edit = blocks.activeButton('secondary', 'fa fa-pencil',
                                    Messages.tag_edit, () => { editUser(); }, true);

                        let aliasCell = blocks.inline(data.alias);
                        let emailCell = blocks.inline(data.email);
                        var actions = blocks.nav([edit, del]);

                        let $alias = $(aliasCell);
                        let $email = $(emailCell);
                        var $actions = $(actions);

                        editUser = () => {
                            var aliasInput = h('input');
                            var emailInput = h('input');
                            $(aliasInput).val(data.alias);
                            $(emailInput).val(data.email);
                            var save = blocks.button('primary', '', Messages.settings_save);
                            var cancel = blocks.button('secondary', '', Messages.cancel);
                            Util.onClickEnter($(save), function () {
                                var aliasVal = $(aliasInput).val().trim();
                                if (!aliasVal) { return void UI.warn(Messages.error); }
                                var changes = {
                                    alias: aliasVal,
                                    email: $(emailInput).val().trim()
                                };
                                updateUser(key, changes);
                            });
                            Util.onClickEnter($(cancel), function () {
                                refreshUsers();
                            });
                            $alias.html('').append(aliasInput);
                            $email.html('').append(emailInput);
                            $actions.html('').append([save, cancel]);
                        };

                        let infoBtn = blocks.activeButton('primary', 'fa fa-database',
                                Messages.admin_diskUsageButton, function (done) {
                            getAccountData(key, (err, data) => {
                                done(!err);
                                if (err) { return void console.error(err); }
                                var table = renderAccountData(data);
                                UI.alert(table, () => {}, {
                                    wide: true,
                                });
                            });
                        });
                        newEntries.push([
                            aliasCell,
                            emailCell,
                            [blocks.code(key), infoBtn],
                            new Date(data.time).toLocaleString(),
                            actions
                        ]);
                    });
                    list.updateContent(newEntries);
                });
            };
            refreshUsers();
            Util.onClickEnter($b, function () {
                var alias = $(userAlias).val().trim();
                if (!alias) { return void UI.warn(Messages.error); }
                $b.prop('disabled', true);

                var done = () => { $b.prop('disabled', false); };
                // TODO Get "block" from pin log?

                var keyStr = $(userEdPublic).val().trim();
                var edPublic = keyStr && Keys.canonicalize(keyStr);
                if (!edPublic) {
                    done();
                    return void UI.warn(Messages.admin_invalKey);
                }
                var block = getBlockId($(userBlock).val());

                var obj = {
                    alias,
                    email: $(userEmail).val(),
                    block: block,
                    edPublic: edPublic,
                };
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADD_KNOWN_USER',
                    data: obj
                }, function (e, response) {
                    done();
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        return void console.error(e, response);
                    }
                    $(userAlias).val('').focus();
                    $(userEmail).val('');
                    $(userBlock).val('');
                    $(userEdPublic).val('');
                    refreshUsers();
                });
            });

            cb([form, div]);
        });

        // Msg.admin_defaultlimitHint, .admin_defaultlimitTitle
        sidebar.addItem('defaultlimit', function (cb) {
            var _limit = APP.instanceStatus.defaultStorageLimit;
            var _limitMB = Util.bytesToMegabytes(_limit);
            var limit = getPrettySize(_limit);

            var newLimit = blocks.input({
                type: 'number',
                min: 0,
                value: _limitMB,
                'aria-labelledby': 'cp-admin-defaultlimit'
            });
            var button = blocks.button('primary', '', Messages.admin_setlimitButton);
            var nav = blocks.nav([button]);
            var text = blocks.inline(Messages._getKey('admin_limit', [limit]));

            var form = blocks.form([
                text,
                newLimit
            ], nav);

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

        // Msg.admin_setlimitHint, .admin_setlimitTitle
        sidebar.addItem('setlimit', function(cb){
            var user = blocks.input({ type:'text', class: 'cp-setlimit-user'});
            var userBlock = blocks.labelledInput(Messages.admin_limitUser, user);
            var $key = $(user);
            var limit = blocks.input({
                type: 'number',
                min: 0,
                value: 0,
                class: 'cp-setlimit-limit'
            });
            var limitBlock = blocks.labelledInput(Messages.admin_limitMB, limit);
            var note = blocks.input({ type: 'text', class: 'cp-setlimit-note' });
            var noteBlock = blocks.labelledInput(Messages.admin_limitSetNote, note);
            var $note = $(note);

            var remove = blocks.button('danger', '', Messages.fc_remove );
            var set = blocks.button('primary', '', Messages.admin_setlimitButton);

            var nav = blocks.nav([set, remove]);
            var form = blocks.form([
                userBlock,
                limitBlock,
                noteBlock
            ], nav);

            var getValues = function () {
                var key = $key.val();
                var _limit = parseInt($(limit).val());
                if (key.length !== 44) {
                    try {
                        var u = Keys.parseUser(key);
                        if (!u.domain || !u.user || !u.pubkey) {
                            return void UI.warn(Messages.admin_invalKey);
                        }
                    } catch (e) {
                        return void UI.warn(Messages.admin_invalKey);
                    }
                }
                if (isNaN(_limit) || _limit < 0) {
                    return void UI.warn(Messages.admin_invalLimit);
                }
                var _note = ($note.val() || "").trim();
                return {
                    key: key,
                    data: {
                        limit: _limit * 1024 * 1024,
                        note: _note,
                        plan: 'custom'
                    }
                };
            };
            UI.confirmButton(remove, {
                classes: 'btn-danger',
                multiple: true,
                validate: function () {
                    var obj = getValues();
                    if (!obj || !obj.key) { return false; }
                    return true;
                }
            }, function () {
                var obj = getValues();
                var data = [obj.key];
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['RM_QUOTA', data]
                }, function (e, response) {
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        console.error(e, response);
                        return;
                    }
                    APP.refreshLimits();
                    $key.val('');
                });
            });

            Util.onClickEnter($(set), function () {
                var obj = getValues();
                if (!obj || !obj.key) { return; }
                var data = [obj.key, obj.data];
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['SET_QUOTA', data]
                }, function (e, response) {
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        console.error(e, response);
                        return;
                    }
                    APP.refreshLimits();
                    $key.val('');
                    $note.val('');
                });
            });

            cb(form);
        });

        // Msg.admin_getlimitsHint, .admin_getlimitsTitle
        sidebar.addItem('getlimits', function(cb){
            var header = [
                Messages.settings_publicSigningKey,
                Messages.admin_planlimit,
                Messages.admin_planName,
                Messages.admin_note
            ];
            var table = blocks.table(header, []);
            table.setAttribute('id', 'cp-admin-table');
            let div = blocks.block([table]);
            div.setAttribute('id', 'cp-admin-table-container');
            let $table = $(table).hide();

            APP.refreshLimits = function () {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'GET_LIMITS',
                }, function (e, data) {
                    $table.hide();
                    if (e) { return; }
                    if (!Array.isArray(data) || !data[0]) { return; }
                    $table.show();

                    var obj = data[0];
                    if (obj && (obj.message || obj.location)) {
                        delete obj.message;
                        delete obj.location;
                    }
                    var list = Object.keys(obj).sort(function (a, b) {
                        return obj[a].limit > obj[b].limit;
                    });

                    var content = list.map(function (key) {
                        var user = obj[key];
                        var limit = getPrettySize(user.limit);
                        var infoButton = blocks.button('primary','',  Messages.admin_diskUsageButton);
                        Util.onClickEnter($(infoButton), function () {
                             getAccountData(key, (err, data) => {
                                 if (err) { return void console.error(err); }
                                 var table = renderAccountData(data);
                                 UI.alert(table, () => {

                                 }, {
                                    wide: true,
                                 });
                             });
                        });

                        var keyEl = h('code.cp-limit-key', key);
                        $(keyEl).click(function () {
                            $('[data-item="setlimit"]').find('.cp-setlimit-user').val(key);
                            $('[data-item="setlimit"]').find('.cp-setlimit-limit').val(Math.floor(user.limit / 1024 / 1024));
                            $('[data-item="setlimit"]').find('.cp-setlimit-note').val(user.note);
                        });
                        var title = Messages._getKey('admin_limit', [limit]) + ', ' +
                            Messages._getKey('admin_limitPlan', [user.plan]) + ', ' +
                            Messages._getKey('admin_limitNote', [user.note]);
                        var attr = { title: title };
                        return [
                            [keyEl, infoButton],
                            {attr, content: limit},
                            {attr, content: user.plan},
                            {attr, content: user.note}
                        ];
                    });
                    table.updateContent(content);
                });
            };
            APP.refreshLimits();
            cb(div);
        });

        // Msg.admin_accountMetadataHint.admin_accountMetadataTitle
        sidebar.addItem('account-metadata', function(cb) {
            var input = blocks.input({
                type: 'text',
                placeholder: Messages.admin_accountMetadataPlaceholder,
                value: '',
            });
            var $input = $(input);

            var btn = blocks.button('primary', '', Messages.ui_generateReport);
            var $btn = $(btn);

            var nav = blocks.nav([btn]);
            var results = blocks.inline([]);

            var form = blocks.form([
                input
            ], nav);

            form.append(results);

            var pending = false;
            var getInputState = function () {
                var val = $input.val().trim();
                var key = Keys.canonicalize(val);
                var state = {
                    value: val,
                    key: key,
                    valid: Boolean(key),
                    pending: pending,
                };

                return state;
            };

            disable($btn);

            var setInterfaceState = function (state) {
                state = state || getInputState();
                var both = [$input, $btn];
                if (state.pending) {
                    both.forEach(disable);
                } else if (state.valid) {
                    both.forEach(enable);
                } else {
                    enable($input);
                    disable($btn);
                }
            };

            $input.on('keypress keyup change paste', function () {
                setTimeout(setInterfaceState);
            });

            Util.onClickEnter($btn, function () {
                if (pending) { return; }
                var state = getInputState();
                if (!state.valid) {
                    results.innerHTML = '';
                    return void UI.warn(Messages.error);
                }
                var key = state.key;
                pending = true;
                setInterfaceState();

                getAccountData(key, (err, data) => {
                    pending = false;
                    setInterfaceState();
                    if (!data) {
                        results.innerHTML = '';
                        return UI.warn(Messages.error);
                    }
                    var table = renderAccountData(data);
                    results.innerHTML = '';
                    results.appendChild(table);
                });
            });

            cb(form);

        });

        var getDocumentData = function (id, cb) {
            var data = {
                generated: +new Date(),
                id: id,
            };
            data.type = inferDocumentType(id);

            nThen(function (w) {
                if (data.type !== 'channel') { return; }
                sframeCommand('GET_STORED_METADATA', id, w(function (err, res) {
                    if (err) { return void console.error(err); }
                    if (!(Array.isArray(res) && res[0])) { return void console.error("NO_METADATA"); }
                    var metadata = res[0];
                    data.metadata = metadata;
                    data.created = Util.find(data, ['metadata', 'created']);
                }));
            }).nThen(function (w) {
                sframeCommand("GET_DOCUMENT_SIZE", id, w(function (err, res) {
                    if (err) { return void console.error(err); }
                    if (!(Array.isArray(res) && typeof(res[0]) === 'number')) {
                        return void console.error("NO_SIZE");
                    }
                    data.size = res[0];
                }));
            }).nThen(function (w) {
                if (data.type !== 'channel') { return; }
                sframeCommand('GET_LAST_CHANNEL_TIME', id, w(function (err, res) {
                    if (err) { return void console.error(err); }
                    if (!Array.isArray(res) || typeof(res[0]) !== 'number') { return void console.error(res); }
                    data.lastModified = res[0];
                }));
            }).nThen(function (w) {
                // whether currently open
                if (data.type !== 'channel') { return; }
                sframeCommand('GET_CACHED_CHANNEL_METADATA', id, w(function (err, res) {
                    //console.info("cached channel metadata", err, res);
                    if (err === 'ENOENT') {
                        data.currentlyOpen = false;
                        return;
                    }

                    if (err) { return void console.error(err); }
                    if (!Array.isArray(res) || !res[0]) { return void console.error(res); }
                    data.currentlyOpen = true;
                }));
            }).nThen(function (w) {
                // status (live, archived, unknown)
                if (!['channel', 'file'].includes(data.type)) { return; }
                sframeCommand('GET_DOCUMENT_STATUS', id, w(function (err, res) {
                    if (err) { return void console.error(err); }
                    if (!Array.isArray(res) || !res[0]) {
                        UI.warn(Messages.error);
                        return void console.error(err, res);
                    }
                    data.live = res[0].live;
                    data.archived = res[0].archived;
                    data.placeholder = res[0].placeholder;
                    //console.error("get channel status", err, res);
                }));
            }).nThen(function () {
                // for easy readability when copying to clipboard
                try {
                    ['generated', 'created', 'lastModified'].forEach(k => {
                        data[`${k}_formatted`] = new Date(data[k]);
                    });
                } catch (err) {
                    console.error(err);
                }

                cb(void 0, data);
            });
        };

        /* FIXME
            Messages.admin_getFullPinHistory = 'Pin history';
            Messages.admin_archiveOwnedAccountDocuments = "Archive this account's owned documents (not implemented)";
            Messages.admin_archiveOwnedDocumentsConfirm = "All content owned exclusively by this user will be archived. This means their documents, drive, and accounts will be made inaccessible.  This action cannot be undone. Please save the full pin list before proceeding to ensure individual documents can be restored.";
        */

        var localizeType = function (type) {
            var o = {
                channel: Messages.type.doc,
                file: Messages.type.file,
            };
            return o[type] || Messages.ui_undefined;
        };

        var renderDocumentData = function (data) {
            var tableObj = makeMetadataTable('cp-document-stats');
            var row = tableObj.row;

            row(Messages.admin_generatedAt, maybeDate(data.generated));
            row(Messages.documentID, h('code', data.id));
            row(Messages.admin_documentType, localizeType(data.type));
            row(Messages.admin_documentSize, data.size? getPrettySize(data.size): Messages.ui_undefined);

            if (data.type === 'channel') {
                try {
                    row(Messages.admin_documentMetadata, h('pre', JSON.stringify(data.metadata || {}, null, 2)));
                } catch (err2) {
                    UI.warn(Messages.error);
                    console.error(err2);
                }

                // actions
                // get raw metadata history
                var metadataHistoryButton = blocks.activeButton('primary', '', Messages.ui_fetch, done => {
                    sframeCommand('GET_METADATA_HISTORY', data.id, (err, result) => {
                        done(!err);
                        if (err) {
                            UI.warn(Messages.error);
                            return void console.error(err);
                        }
                        if (!Array.isArray(result)) {
                            UI.warn(Messages.error);
                            return void console.error("Expected an array");
                        }
                        var tableObj = makeMetadataTable('cp-metadata-history');
                        var row = items => {
                            tableObj.table.appendChild(h('tr', items.map(item => {
                                return h('td', item);
                            })));
                        };
                        var scroll = el => h('div.scroll', el);
                        result.forEach(item => {
                            var raw = JSON.stringify(item);
                            var time;
                            var last;
                            if (Array.isArray(item)) {
                                last = item[item.length - 1];
                                if (typeof(last) === 'number') { time = last; }
                            } else if (item && typeof(item) === 'object') {
                                time = item.created;
                            }
                            row([
                                h('small', maybeDate(time)), // time
                                scroll(h('code', raw)), // Raw
                            ]);
                        });

                        UI.confirm(tableObj.table, (yes) => {
                            if (!yes) { return; }
                            var content = result.map(line => JSON.stringify(line)).join('\n');
                            Clipboard.copy(content, (err) => {
                                if (err) { return UI.warn(Messages.error); }
                                UI.log(Messages.genericCopySuccess);
                            });
                        }, {
                            wide: true,
                            ok: Messages.copyToClipboard,
                        });
                    });
                });
                row(Messages.admin_getRawMetadata, metadataHistoryButton);

                row(Messages.admin_documentCreationTime, maybeDate(data.created));
                row(Messages.admin_documentModifiedTime, maybeDate(data.lastModified));
                row(Messages.admin_currentlyOpen, localizeState(data.currentlyOpen));
            }
            if (['file', 'channel'].includes(data.type)) {
                row(Messages.admin_channelAvailable, localizeState(data.live));
                row(Messages.admin_channelArchived, localizeState(data.archived));
            }

            if (data.type === 'file') {
                // TODO what to do for files?

            }

            if (data.placeholder) {
                console.warn('Placeholder code', data.placeholder);
                row(Messages.admin_channelPlaceholder, UI.getDestroyedPlaceholderMessage(data.placeholder));
            }

            if (data.live && data.archived) {
                let disableButtons;
                let restoreButton = blocks.activeButton('danger', '', Messages.admin_unarchiveButton, function () {
                    justifyRestorationDialog('', reason => {
                        nThen(function (w) {
                            sframeCommand('REMOVE_DOCUMENT', {
                                id: data.id,
                                reason: reason,
                            }, w(err => {
                                if (err) {
                                    w.abort();
                                    return void UI.warn(Messages.error);
                                }
                            }));
                        }).nThen(function () {
                            sframeCommand("RESTORE_ARCHIVED_DOCUMENT", {
                                id: data.id,
                                reason: reason,
                            }, (err /*, response */) => {
                                if (err) {
                                    console.error(err);
                                    return void UI.warn(Messages.error);
                                }
                                UI.log(Messages.restoredFromServer);
                                disableButtons();
                            });
                        });
                    });
                }, true);

                let archiveButton = blocks.activeButton('danger', '',Messages.admin_archiveButton, function () {
                    justifyArchivalDialog('', result => {
                        sframeCommand('ARCHIVE_DOCUMENT', {
                            id: data.id,
                            reason: result,
                        }, (err /*, response */) => {
                            if (err) {
                                console.error(err);
                                return void UI.warn(Messages.error);
                            }
                            UI.log(Messages.archivedFromServer);
                            disableButtons();
                        });
                    });
                }, true);

                disableButtons = function () {
                    [archiveButton, restoreButton].forEach(el => {
                        disable($(el));
                    });
                };

                row(h('span', [
                    Messages.admin_documentConflict,
                    h('br'),
                    h('small', Messages.ui_experimental),
                ]), h('span', [
                    h('div.alert.alert-danger.cp-admin-bigger-alert', [
                        Messages.admin_conflictExplanation,
                    ]),
                    h('p', [
                        restoreButton,
                        archiveButton,
                    ]),
                ]));
            } else if (data.live) {
            // archive
                var archiveDocumentButton = blocks.activeButton('danger', '' ,Messages.admin_archiveButton, function () {
                    justifyArchivalDialog('', result => {
                        sframeCommand('ARCHIVE_DOCUMENT', {
                            id: data.id,
                            reason: result,
                        }, (err /*, response */) => {
                            if (err) {
                                console.error(err);
                                return void UI.warn(Messages.error);
                            }
                            UI.log(Messages.archivedFromServer);
                            disable($(archiveDocumentButton));
                        });
                    });
                }, true);
                row(Messages.admin_archiveDocument, h('span', [
                    archiveDocumentButton,
                    h('small', Messages.admin_archiveHint),
                ]));
            } else if (data.archived) {
                var restoreDocumentButton = blocks.activeButton('primary', '',Messages.admin_unarchiveButton, function () {
                    justifyRestorationDialog('', reason => {
                        sframeCommand("RESTORE_ARCHIVED_DOCUMENT", {
                            id: data.id,
                            reason: reason,
                        }, (err /*, response */) => {
                            if (err) {
                                console.error(err);
                                return void UI.warn(Messages.error);
                            }
                            UI.log(Messages.restoredFromServer);
                            disable($(restoreDocumentButton));
                        });
                    });
                }, true);
                row(Messages.admin_restoreDocument, h('span', [
                    restoreDocumentButton,
                    h('small', Messages.admin_unarchiveHint),
                ]));
            }

            row(reportContentLabel, copyToClipboard(data));

            return tableObj.table;
        };


        // Msg.admin_documentMetadataHint.admin_documentMetadataTitle
        sidebar.addItem('document-metadata', function(cb){
            var input = blocks.input({
                type: 'text',
                placeholder: Messages.admin_documentMetadataPlaceholder,
                value: ''
            });
            var $input = $(input);
            var passwordContainer = UI.passwordInput({
                id: 'cp-database-document-pw',
                placeholder: Messages.admin_archiveInput2,
            });
            var $passwordContainer = $(passwordContainer);
            var $password = $(passwordContainer).find('input');

            var getBlobId = pathname => {
                var parts;
                try {
                    if (typeof(pathname) !== 'string') { return; }
                    parts = pathname.split('/').filter(Boolean);
                    if (parts.length !== 3) { return; }
                    if (parts[0] !== 'blob') { return; }
                    if (parts[1].length !== 2) { return; }
                    if (parts[2].length !== 48) { return; }
                    if (!parts[2].startsWith(parts[1])) { return; }
                } catch (err) { return false; }
                return parts[2];
            };

            var pending = false;
            var getInputState = function () {
                var val = $input.val().trim();
                var state = {
                    valid: false,
                    passwordRequired: false,
                    id: undefined,
                    input: val,
                    password: $password.val().trim(),
                    pending: false,
                };

                if (!val) { return state; }
                if (isHex(val) && [32, 48].includes(val.length)) {
                    state.valid = true;
                    state.id = val;
                    return state;
                }

                var url;
                try {
                    url = new URL(val, ApiConfig.httpUnsafeOrigin);
                } catch (err) {}

                if (!url) { return state; } // invalid

                // recognize URLs of the form: /blob/f1/f1338921fe8a73ed5401780d2147f725deeb9e3329f0f01e
                var blobId = getBlobId(url.pathname);
                if (blobId) {
                    state.valid = true;
                    state.id = blobId;
                    return state;
                }

                var parsed = Hash.isValidHref(val);
                if (!parsed || !parsed.hashData) { return state; }
                if (parsed.hashData.version === 3) {
                    state.id = parsed.hashData.channel;
                    state.valid = true;
                    return state;
                }

                var secret;
                if (parsed.hashData.password) {
                    state.passwordRequired = true;
                    secret = Hash.getSecrets(parsed.type, parsed.hash, state.password);
                } else {
                    secret = Hash.getSecrets(parsed.type, parsed.hash);
                }
                if (secret && secret.channel) {
                    state.id = secret.channel;
                    state.valid = true;
                    return state;
                }
                return state;
            };

            var results = blocks.inline([]);

            var btn = blocks.button('primary', '', Messages.ui_generateReport);
            var $btn = $(btn);

            var nav = blocks.nav([btn]);
            var form = blocks.form([
                input,
                passwordContainer
            ], nav);
            form.append(results);
            $passwordContainer.hide();
            disable($btn);

            var setInterfaceState = function () {
                var state = getInputState();
                var all = [ $btn, $password, $input ];
                var text = [$password, $input];

                if (state.pending) {
                    all.forEach(disable);
                } else if (state.valid) {
                    all.forEach(enable);
                } else {
                    text.forEach(enable);
                    disable($btn);
                }
                if (state.passwordRequired) {
                    $passwordContainer.show();
                } else {
                    $passwordContainer.hide();
                }
            };

            $input.on('keypress keyup change paste', function () {
                setTimeout(setInterfaceState);
            });

            Util.onClickEnter($btn, function () {
                if (pending) { return; }
                pending = true;
                var state = getInputState();
                setInterfaceState(state);
                getDocumentData(state.id, function (err, data) {
                    pending = false;
                    setInterfaceState();
                    if (err) {
                        results.innerHTML = '';
                        return void UI.warn(err);
                    }
                    var table = renderDocumentData(data);
                    results.innerHTML = '';
                    results.appendChild(table);
                });
            });

            cb(form);
        });

        var getBlockData = function (key, _cb) {
            var cb = Util.once(Util.mkAsync(_cb));
            var data = {
                generated: +new Date(),
                key: key,
            };

            nThen(function (w) {
                sframeCommand('GET_DOCUMENT_STATUS', key, w((err, res) => {
                    if (err) {
                        console.error(err);
                        return void UI.warn(Messages.error);
                    }
                    if (!Array.isArray(res) || !res[0]) {
                        UI.warn(Messages.error);
                        return void console.error(err, res);
                    }
                    data.live = res[0].live;
                    data.archived = res[0].archived;
                    data.totp = res[0].totp;
                    data.placeholder = res[0].placeholder;
                }));
            }).nThen(function () {
                try {
                    ['generated'].forEach(k => {
                        data[`${k}_formatted`] = new Date(data[k]);
                    });
                } catch (err) {
                    console.error(err);
                }

                cb(void 0, data);
            });
        };

        var renderBlockData  = function (data) {
            var tableObj = makeMetadataTable('cp-block-stats');
            var row = tableObj.row;

            row(Messages.admin_generatedAt, maybeDate(data.generated));
            row(Messages.admin_blockKey, h('code', data.key));
            row(Messages.admin_blockAvailable, localizeState(data.live));
            row(Messages.admin_blockArchived, localizeState(data.archived));

            row(Messages.admin_totpEnabled, localizeState(Boolean(data.totp.enabled)));
            row(Messages.admin_totpRecoveryMethod, data.totp.recovery);

            if (data.live) {
                var archiveButton = blocks.activeButton('danger', '', Messages.ui_archive, function () {
                    justifyArchivalDialog('', reason => {
                        sframeCommand('ARCHIVE_BLOCK', {
                            key: data.key,
                            reason: reason,
                        }, (err, res) => {
                            if (err) {
                                console.error(err);
                                return void UI.warn(Messages.error);
                            }
                            disable($(archiveButton));
                            UI.log(Messages.ui_success);
                            console.log('archive block', err, res);
                        });
                    });
                }, true);
                row(Messages.admin_archiveBlock, archiveButton);
            }
            if (data.placeholder) {
                console.warn('Placeholder code', data.placeholder);
                row(Messages.admin_channelPlaceholder, UI.getDestroyedPlaceholderMessage(data.placeholder, true));
            }
            if (data.archived && !data.live) {
                var restoreButton = blocks.activeButton('danger', '', Messages.ui_restore, function () {
                    justifyRestorationDialog('', reason => {
                        sframeCommand('RESTORE_ARCHIVED_BLOCK', {
                            key: data.key,
                            reason: reason,
                        }, (err, res) => {
                            if (err) {
                                console.error(err);
                                return void UI.warn(Messages.error);
                            }
                            disable($(restoreButton));
                            console.log('restore archived block', err, res);
                            UI.log(Messages.ui_success);
                        });
                    });
                }, true);
                row(Messages.admin_restoreBlock, restoreButton);
            }

            row(reportContentLabel, copyToClipboard(data));

            return tableObj.table;
        };

        // Msg.admin_blockMetadataHint.admin_blockMetadataTitle
        sidebar.addItem('block-metadata', function(cb){
            var input = blocks.input({
                type: 'text',
                placeholder: Messages.admin_blockMetadataPlaceholder,
                value: ''
            });
            var $input = $(input);
            var btn = blocks.button('primary', '', Messages.ui_generateReport);
            var $btn = $(btn);
            disable($btn);

            var results = blocks.inline([]);
            var nav = blocks.nav([btn]);
            var form = blocks.form([
                input
            ], nav);
            form.append(results);

            var pending = false;
            var getInputState = function () {
                var val = $input.val().trim();
                var state = {
                    pending: pending,
                    valid: false,
                    value: val,
                    key: '',
                };

                var key = getBlockId(val);
                if (key) {
                    state.valid = true;
                    state.key = key;
                }
                return state;
            };
            var setInterfaceState = function () {
                var state = getInputState();
                var all = [$btn, $input];

                if (state.pending) {
                    all.forEach(disable);
                } else if (state.valid) {
                    all.forEach(enable);
                } else {
                    enable($input);
                    disable($btn);
                }
            };

            $input.on('keypress keyup change paste', function () {
                setTimeout(setInterfaceState);
            });

            Util.onClickEnter($btn, function () {
                if (pending) { return; }
                var state = getInputState();
                pending = true;
                setInterfaceState();
                getBlockData(state.key, (err, data) => {
                    pending = false;
                    setInterfaceState();
                    if (err || !data) {
                        results.innerHTML = '';
                        console.log(err, data);
                        return UI.warn(Messages.error);
                    }
                    var table = renderBlockData(data);
                    results.innerHTML = '';
                    results.appendChild(table);
                });
            });

            cb(form);

        });

        var renderTOTPData  = function (data) {
            var tableObj = makeMetadataTable('cp-block-stats');
            var row = tableObj.row;

            row(Messages.admin_generatedAt, maybeDate(data.generated));
            row(Messages.admin_blockKey, h('code', data.key));
            row(Messages.admin_blockAvailable, localizeState(data.live));

            if (!data.live || !data.totp) { return tableObj.table; }

            row(Messages.admin_totpCheck, localizeState(data.totpCheck));

            if (!data.totpCheck) { return tableObj.table; }

            row(Messages.admin_totpEnabled, localizeState(Boolean(data.totp.enabled)));
            if (data.totp && data.totp.enabled) {
                row(Messages.admin_totpRecoveryMethod, data.totp.recovery);
            }

            if (!data.totpCheck || !data.totp.enabled) { return tableObj.table; }

            // TOTP is enabled and the signature is correct: display "disable TOTP" button
            var disableButton = blocks.button('danger', '', Messages.admin_totpDisableButton);
            UI.confirmButton(disableButton, { classes: 'btn-danger' }, () => {
                sframeCommand('DISABLE_MFA', data.key, (err, res) => {
                    if (err) {
                        console.error(err);
                        return void UI.warn(Messages.error);
                    }
                    if (!Array.isArray(res) || !res[0] || !res[0].success) {
                        return UI.warn(Messages.error);
                    }
                    UI.log(Messages.ui_success);
                });

            });
            row(Messages.admin_totpDisable, disableButton);

            return tableObj.table;
        };

        var checkTOTPRequest = function (json) {
            var clone = Util.clone(json);
            delete clone.proof;

            var msg = Nacl.util.decodeUTF8(Sortify(clone));
            var sig = Nacl.util.decodeBase64(json.proof);
            var pub = Nacl.util.decodeBase64(json.blockId);
            return Nacl.sign.detached.verify(msg, sig, pub);
        };

        // Msg.admin_totpRecoveryHint.admin_totpRecoveryTitle
        sidebar.addItem('totp-recovery', function(cb){
            var textarea = blocks.textarea({
                id: 'textarea-input',
                'aria-labelledby': 'cp-admin-totp-recovery'
            });
            var $input = $(textarea);
            var btn = blocks.button('primary','', Messages.admin_totpDisable);
            var $btn = $(btn);
            var results = blocks.inline([]);

            var nav = blocks.nav([btn]);
            var form = blocks.form([
                textarea
            ], nav);
            form.append(results);
            disable($btn);

            var pending = false;
            var getInputState = function () {
                var val = $input.val().trim();
                var state = {
                    pending: pending,
                    value: undefined,
                    key: '',
                };

                var json;
                try { json = JSON.parse(val); } catch (err) { }
                if (!json || json.intent !== "Disable TOTP" || !json.blockId || json.blockId.length !== 44 ||
                !json.date || !json.proof) { return state; }

                state.value = json;
                state.key = json.blockId.replace(/\//g, '-');
                return state;
            };
            var setInterfaceState = function () {
                var state = getInputState();
                var all = [$btn, $input];

                if (state.pending) {
                    all.forEach(disable);
                } else {
                    all.forEach(enable);
                }
            };

            setInterfaceState();
            Util.onClickEnter($btn, function () {
                if (pending) { return; }
                var state = getInputState();
                if (!state.value) { return; }
                pending = true;
                setInterfaceState();
                getBlockData(state.key, (err, data) => {
                    pending = false;
                    setInterfaceState();
                    if (err || !data) {
                        results.innerHTML = '';
                        console.log(err, data);
                        return UI.warn(Messages.error);
                    }
                    var check = checkTOTPRequest(state.value);
                    if (!check) { UI.warn(Messages.admin_totpFailed); }
                    data.totpCheck = check;
                    var table = renderTOTPData(data);
                    results.innerHTML = '';
                    results.appendChild(table);
                });
            });

            cb(form);
        });

        var onRefreshStats = Util.mkEvent();

        sidebar.addItem('refresh-stats', function(cb){
            var btn = blocks.button('primary', '',  Messages.oo_refresh);
            var $btn = $(btn);
            Util.onClickEnter($btn, function () {
                onRefreshStats.fire();
            });
            cb(btn);
        }, {
            noTitle: true,
            noHint: true
        });

        // Msg.admin_uptimeTitle, .admin_uptimeHint
        sidebar.addItem('uptime', function(cb){
            var pre = blocks.pre(Messages.admin_uptimeTitle);
            var set = function () {
                var uptime = APP.instanceStatus.launchTime;
                if (typeof(uptime) !== 'number') { return; }
                pre.innerText = '';
                pre.innerText = new Date(uptime);
            };

            set();
            onRefreshStats.reg(function () {
                APP.updateStatus(set);
            });

            cb(pre);
        });

        // Msg.admin_activeSessionsHint, .admin_activeSessionsTitle
        sidebar.addItem('active-sessions', function(cb){
            var pre = blocks.pre('');
            var onRefresh = function () {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ACTIVE_SESSIONS',
                }, function (e, data) {
                    pre.innerText = '';
                    var total = data[0];
                    var ips = data[1];
                    pre.append(total + ' (' + ips + ')');
                });
            };
            onRefresh();
            onRefreshStats.reg(onRefresh);

            cb(pre);
        });

        // Msg.admin_activePadsHint, .admin_activePadsTitle
        sidebar.addItem('active-pads', function(cb){
            var pre = blocks.pre('');
            var onRefresh = function () {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ACTIVE_PADS',
                }, function (e, data) {
                    pre.innerText = '';
                    pre.append(String(data));
                });
            };
            onRefresh();
            onRefreshStats.reg(onRefresh);

            cb(pre);
        });

        // Msg.admin_openFilesHint, .admin_openFilesTitle
        sidebar.addItem('open-files', function(cb){
            var pre = blocks.pre('');
            var onRefresh = function () {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'GET_FILE_DESCRIPTOR_COUNT',
                }, function (e, data) {
                    if (e || (data && data.error)) {
                        console.error(e, data);
                        pre.innerText = '';
                        pre.append(String(e || data.error));
                        return;
                    }
                    pre.innerText='';
                    pre.append(String(data));
                });
            };
            onRefresh();
            onRefreshStats.reg(onRefresh);

            cb(pre);
        });

        // Msg.admin_registeredHint, .admin_registeredTitle
        sidebar.addItem('registered', function(cb){
            var pre = blocks.pre('');
            var onRefresh = function () {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'REGISTERED_USERS',
                }, function (e, arr) {
                    pre.innerText = '';
                    let data = arr[0];
                    pre.append(String(data.users));
                });
            };
            onRefresh();
            onRefreshStats.reg(onRefresh);

            cb(pre);
        });

        // Msg.admin_diskUsageHint, .admin_diskUsageTitle, .admin_diskUsageButton
        sidebar.addItem('disk-usage', function(cb){
            var button = blocks.button('primary', '', Messages.admin_diskUsageButton);
            var $button = $(button);
            var called = false;
            var nav = blocks.nav([button]);
            var content = blocks.table([], []);
            var form = blocks.form([
                content
            ], nav);

            Util.onClickEnter($button, function() {
                UI.confirm(Messages.admin_diskUsageWarning, function (yes) {
                    if (!yes) { return; }
                    $button.hide();
                    if (called) { return; }
                    called = true;
                    sFrameChan.query('Q_ADMIN_RPC', {
                        cmd: 'DISK_USAGE',
                    }, function (e, data) {
                        if (e) { return void console.error(e); }
                        var obj = data[0];
                        Object.keys(obj).forEach(function (key) {
                            var val = obj[key];
                            var unit = Util.magnitudeOfBytes(val);
                            if (unit === 'GB') {
                                obj[key] = Util.bytesToGigabytes(val) + ' GB';
                            } else if (unit === 'MB') {
                                obj[key] = Util.bytesToMegabytes(val) + ' MB';
                            } else {
                                obj[key] = Util.bytesToKilobytes(val) + ' KB';
                            }
                        });
                        let attr = {'class': 'cp-strong'};
                        let entries = Object.keys(obj).map(function (k) {
                            return [
                                {attr, content: (k === 'total' ? k : '/' + k)},
                                obj[k]
                            ];
                        });
                        content.updateContent(entries);
                    });
                });
            });
            cb(form);
        });

        let onRefreshSupportEvt = Util.mkEvent();
        let refreshSupport = () => {
            let moderators, supportKey;
            nThen((waitFor) => {
                APP.supportModule.execCommand('GET_PRIVATE_KEY', {}, waitFor((obj) => {
                    supportKey = obj && obj.curvePublic;
                }));
            }).nThen((waitFor) => {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'GET_MODERATORS',
                    data: {}
                }, waitFor((e, response) => {
                    if (e || response.error) {
                        console.error(e || response.error);
                        UI.warn(Messages.error);
                        return;
                    }
                    moderators = response[0];
                }));
            }).nThen(() => {
                onRefreshSupportEvt.fire({moderators, supportKey});
            });
        };
        const getMyData = () => {
            let metadataMgr = common.getMetadataMgr();
            let priv = metadataMgr.getPrivateData();
            let user = metadataMgr.getUserData();
            return {
                name: user.name,
                edPublic: priv.edPublic,
                curvePublic: user.curvePublic,
                mailbox: user.notifications,
                profile: user.profile
            };
        };
        const getContactData = (curve) => {
            if (!curve) { return getMyData(); }
            let friends = common.getFriends(true);
            let f = friends[curve];
            return {
                name: f.displayName,
                edPublic: f.edPublic,
                curvePublic: f.curvePublic,
                mailbox: f.notifications,
                profile: f.profile
            };
        };
        let generateSupportKey = (moderatorsData, supportKey, cb) => {
            let edPublic = common.getMetadataMgr().getPrivateData().edPublic;
            if (supportKey && !moderatorsData[edPublic]) {
                UI.alert("A support key already exists. You must be a moderator to generate a new one or delete the existing support data.");
                return;
            }
            cb = cb || function () {};
            const onError = (waitFor, err, res) => {
                if (waitFor) { waitFor.abort(); }
                console.error(err, res);
                UI.warn(Messages.error);
                cb(err);
            };

            nThen((waitFor) => {
                // Add myself to moderator role if not already there
                let me = getContactData();
                if (moderatorsData[me.edPublic]) { return; }
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADD_MODERATOR',
                    data: me
                }, waitFor((e, response) => {
                    if (e) { console.error(e, response); }
                }));
            }).nThen((waitFor) => {
                // Copy chainpad doc and pin
                APP.supportModule.execCommand('ROTATE_KEYS', {}, waitFor((obj) => {
                    if (obj && obj.error) { return void onError(waitFor, obj.error); }
                    if (obj && obj.success && obj.noNotify) {
                        UI.alert(Messages.admin_supportRotateNotify);
                        onError(waitFor, 'NOTIFY_ERROR', obj);
                        return;
                    }
                    UI.log(Messages.saved);
                }));
            }).nThen(() => {
                refreshSupport();
            });
        };
        // Msg.admin_supportSetupHint, .admin_supportSetupTitle
        sidebar.addItem('support-setup', function (cb) {
            let content = blocks.block();
            const $div = $(content);
            const redraw = function (moderatorsData, supportKey) {
                $div.empty();

                const state = blocks.block([], 'cp-admin-support-state');
                const $state = $(state).appendTo($div);
                const button = blocks.activeButton('primary', '',
                                    Messages.admin_supportInit, done => {
                    generateSupportKey(moderatorsData, supportKey, (err) => {
                        done(!err);
                    });
                });
                const $button = $(button).appendTo($div);

                const delButton = blocks.activeButton('danger', '',
                                    Messages.admin_supportDelete, done => {
                    UI.confirm(Messages.admin_supportConfirm, function (yes) {
                        if (!yes) { return void done(false); }
                        // Send the decree, don't delete data locally, we just want to remove
                        // the support UI for the clients
                        APP.supportModule.execCommand('DISABLE_SUPPORT', {}, (obj) => {
                            done(!(obj && obj.error));
                            if (obj && obj.error) {
                                console.error(obj.error);
                                return void UI.warn(Messages.error);
                            }
                            UI.log(Messages.saved);
                            refreshSupport();
                        });
                    });
                });
                const $delButton = $(delButton).hide();

                const openButton = blocks.button('primary', '', Messages.admin_supportOpen);
                const $openButton = $(openButton).hide();
                Util.onClickEnter($(openButton), () => {
                    common.openURL('/moderation/');
                });

                let nav = blocks.nav([button, openButton, delButton,
                                      button.spinner, delButton.spinner]);
                $div.append(nav);

                const setState = function () {
                    $state.html('');
                    if (supportKey) {
                        $button.hide();
                        $delButton.show();
                        $openButton.show();
                        return $state.append([
                            blocks.icon('fa-check'),
                            blocks.inline(Messages.admin_supportEnabled)
                        ]);
                    }
                    $state.append([
                        blocks.icon('fa-times'),
                        blocks.inline(Messages.admin_supportDisabled)
                    ]);
                };
                setState();
            };
            onRefreshSupportEvt.reg(obj => {
                redraw(obj.moderators, obj.supportKey);
            });
            cb(content);
        });

        // Msg.admin_supportTeamHint, .admin_supportTeamTitle
        sidebar.addItem('support-team', function (cb) {
            let edPublic = common.getMetadataMgr().getPrivateData().edPublic; // My edPublic
            let content = blocks.block();
            const $div = $(content);
            const redraw = function (moderatorsData, supportKey) {
                $div.empty();

                const addModerator = (curve, _cb) => {
                    let cb = Util.mkAsync(_cb);
                    let userData = getContactData(curve);
                    if (!userData) { return void cb('INVALID_USER'); }
                    sFrameChan.query('Q_ADMIN_RPC', {
                        cmd: 'ADD_MODERATOR',
                        data: userData
                    }, (e, response) => {
                        if (e || (response && response.error)) {
                            return void cb(e || response.error);
                        }

                        // User added to support team in database, send them the keys
                        APP.supportModule.execCommand('ADD_MODERATOR', userData, cb);
                    });
                };
                const removeModerator = (ed) => {
                    sFrameChan.query('Q_ADMIN_RPC', {
                        cmd: 'REMOVE_MODERATOR',
                        data: ed
                    }, (e, response) => {
                        if (e || (response && response.error)) {
                            console.error(e || response.error);
                            return void UI.warn(Messages.error);
                        }
                        generateSupportKey(moderatorsData, supportKey);
                    });
                };

                const drawModerators = () => {
                    if (!supportKey) {
                        const list = blocks.block([
                            blocks.icon('fa-times'),
                            blocks.inline(Messages.admin_supportDisabled)
                        ], 'cp-admin-support-state');
                        $div.append(list);
                        return;
                    }
                    const members = {};
                    const friends = Util.clone(common.getFriends(false));
                    Object.keys(moderatorsData).forEach((ed) => {
                        let m = moderatorsData[ed];
                        members[m.curvePublic] = {
                            displayName: m.name,
                            edPublic: m.edPublic,
                            profile: m.profile,
                            curvePublic: m.curvePublic,
                            notificatons: m.mailbox
                        };
                    });
                    Object.keys(friends).forEach((curve) => {
                        if (members[curve]) { delete friends[curve]; }
                    });
                    let currentList = UIElements.getUserGrid(Messages.admin_supportMembers, {
                        common: common,
                        list: true,
                        large: true,
                        noSelect: true,
                        data: members,
                        remove: (el) => {
                            let ed = $(el).attr('data-ed');
                            removeModerator(ed);
                        }
                    });
                    let contactsGrid = UIElements.getUserGrid(Messages.admin_supportAdd, {
                        common: common,
                        list: true,
                        large: true,
                        data: friends
                    }, function () {});

                    let addBtn = blocks.button('primary', '', Messages.tag_add);
                    Util.onClickEnter($(addBtn), () => {
                        var $sel = $(contactsGrid.div).find('.cp-usergrid-user.cp-selected');
                        nThen((waitFor) => {
                            $sel.each((i, el) => {
                                let curve = $(el).attr('data-curve');
                                if (!curve) {
                                    console.error('Missing data on selected user', el);
                                    return void UI.warn(Messages.error);
                                }
                                addModerator(curve, waitFor());
                            });
                        }).nThen(() => {
                            refreshSupport();
                        });
                    });
                    // Only moderators can add new moderators
                    if (!moderatorsData[edPublic]) {
                        contactsGrid.div = undefined;
                        addBtn = undefined;
                    }

                    const list = blocks.block([
                        currentList.div,
                        contactsGrid.div,
                        blocks.nav([addBtn])
                    ]);
                    $div.append(list);
                };
                drawModerators();
            };
            onRefreshSupportEvt.reg(obj => {
                redraw(obj.moderators, obj.supportKey);
            });
            cb(content);
        });
        setTimeout(refreshSupport);

        var getApi = function (cb) {
            return function () {
                require(['/api/broadcast?'+ (+new Date())], function (Broadcast) {
                    cb(Broadcast);
                    setTimeout(function () {
                        try {
                            var ctx = require.s.contexts._;
                            var defined = ctx.defined;
                            Object.keys(defined).forEach(function (href) {
                                if (/^\/api\/broadcast\?[0-9]{13}/.test(href)) {
                                    delete defined[href];
                                    return;
                                }
                            });
                        } catch (e) {}
                    });
                });
            };
        };
        var checkLastBroadcastHash = function (cb) {
            var deleted = [];

            require(['/api/broadcast?'+ (+new Date())], function (BCast) {
                var hash = BCast.lastBroadcastHash || '1'; // Truthy value if no lastKnownHash
                common.mailbox.getNotificationsHistory('broadcast', null, hash, function (e, msgs) {
                    if (e) { console.error(e); return void cb(e); }

                    // No history, nothing to change
                    if (!Array.isArray(msgs)) { return void cb(); }
                    if (!msgs.length) { return void cb(); }

                    var lastHash;
                    var next = false;

                    // Start from the most recent messages until you find a CUSTOM message and
                    // check if it has been deleted
                    msgs.reverse().some(function (data) {
                        var c = data.content;

                        // This is the hash we want to keep
                        if (next) {
                            if (!c || !c.hash) { return; }
                            lastHash = c.hash;
                            next = false;
                            return true;
                        }

                        // initialize with the most recent hash
                        if (!lastHash && c && c.hash) { lastHash = c.hash; }

                        var msg = c && c.msg;
                        if (!msg) { return; }

                        // Remember all deleted messages
                        if (msg.type === "BROADCAST_DELETE") {
                            deleted.push(Util.find(msg, ['content', 'uid']));
                        }

                        // Only check custom messages
                        if (msg.type !== "BROADCAST_CUSTOM") { return; }

                        // If the most recent CUSTOM message has been deleted, it means we don't
                        // need to keep any message and we can continue with lastHash as the most
                        // recent broadcast message.
                        if (deleted.indexOf(msg.uid) !== -1) { return true; }

                        // We just found the oldest message we want to keep, move one iteration
                        // further into the loop to get the next message's hash.
                        // If this is the end of the loop, don't bump lastBroadcastHash at all.
                        next = true;
                    });

                    // If we don't have to bump our lastBroadcastHash, abort
                    if (next) { return void cb(); }

                    // Otherwise, bump to lastHash
                    console.warn('Updating last broadcast hash to', lastHash);
                    sFrameChan.query('Q_ADMIN_RPC', {
                        cmd: 'ADMIN_DECREE',
                        data: ['SET_LAST_BROADCAST_HASH', [lastHash]]
                    }, function (e, response) {
                        if (e || response.error) {
                            UI.warn(Messages.error);
                            console.error(e, response);
                            return;
                        }
                        console.log('lastBroadcastHash updated');
                        if (typeof(cb) === "function") { cb(); }
                    });
                });
            });

        };
        // Msg.admin_maintenanceHint, admin_maintenanceTitle
        sidebar.addItem('maintenance', function(cb){
            var button = blocks.button('primary', '', Messages.admin_maintenanceButton);
            var $button = $(button);
            var start = blocks.input({
                type: 'date',
                id: 'cp-admin-start-input',
                class: 'flatpickr-input'
            });
            var end = blocks.input({
                type: 'date',
                id: 'cp-admin-end-input',
                class: 'flatpickr-input'
            });
            var labelStart = blocks.labelledInput(Messages.broadcast_start, start);
            var labelEnd = blocks.labelledInput(Messages.broadcast_end, end);
            let active = blocks.block([], 'cp-broadcast-active');
            let $active = $(active);

            var form = blocks.form([
                active,
                labelStart,
                labelEnd,
            ], blocks.nav([button]));

            var refresh = getApi(function (Broadcast) {
                $active.empty();
                var removeButton = blocks.button('danger', '', Messages.admin_maintenanceCancel);

                if (Broadcast && Broadcast.maintenance) {
                    var m = Broadcast.maintenance;
                    if (m.start && m.end && m.end >= (+new Date())) {
                        $active.append([
                            UI.setHTML(h('div'), Messages._getKey('broadcast_maintenance', [
                                new Date(m.start).toLocaleString(),
                                new Date(m.end).toLocaleString(),
                            ])),
                            blocks.nav([removeButton])
                        ]);
                    }
                }
                UI.confirmButton(removeButton, {
                    classes: 'btn-danger',
                }, function () {
                    send("");
                });

            });
            refresh();

            var $start = $(start);
            var $end = $(end);
            var is24h = UIElements.is24h();
            var dateFormat = "Y-m-d H:i";
            if (!is24h) { dateFormat = "Y-m-d h:i K"; }

            var endPickr = Flatpickr(end, {
                enableTime: true,
                time_24hr: is24h,
                dateFormat: dateFormat,
                minDate: new Date()
            });
            Flatpickr(start, {
                enableTime: true,
                time_24hr: is24h,
                minDate: new Date(),
                dateFormat: dateFormat,
                onChange: function () {
                    endPickr.set('minDate', new Date($start.val()));
                }
            });

            // Extract form data
            var getData = function () {
                var start = +new Date($start.val());
                var end = +new Date($end.val());
                if (isNaN(start) || isNaN(end)) {
                    console.error('Invalid dates');
                    return false;
                }
                return {
                    start: start,
                    end: end
                };
            };

            var send = function (data) {
                disable($button);
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['SET_MAINTENANCE', [data]]
                }, function (e, response) {
                    enable($button);
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        console.error(e, response);
                        $button.prop('disabled', '');
                        return;
                    }
                    // Maintenance applied, send notification
                    common.mailbox.sendTo('BROADCAST_MAINTENANCE', {}, {}, function () {
                        checkLastBroadcastHash(function () {
                            setTimeout(refresh, 300);
                        });
                    });
                });

            };
            Util.onClickEnter($(button), function () {
                var data = getData();
                if (data === false) { return void UI.warn(Messages.error); }
                send(data);
            });

            common.makeUniversal('broadcast', {
                onEvent: function (obj) {
                    var cmd = obj.ev;
                    if (cmd !== "MAINTENANCE") { return; }
                    refresh();
                }
            });

            cb(form);

        });

        // Msg.admin_surveyHint, admin_surveyTitle
        sidebar.addItem('survey', function(cb){
            var button = blocks.button('primary', '', Messages.admin_surveyButton);
            var $button = $(button);
            let nav = blocks.nav([button]);
            let active = blocks.block([], 'cp-sidebar-flex-block');
            let $active = $(active);

            var input = blocks.input({
                type: 'text',
                id: 'cp-admin-survey-url-input'
            });
            var labelledInput = blocks.labelledInput(Messages.broadcast_surveyURL, input);
            var $input = $(input);

            let send = function () {};
            var refresh = getApi(function (Broadcast) {
                var removeButton = blocks.button('danger', '', Messages.admin_surveyCancel);
                UI.confirmButton(removeButton, {
                    classes: 'btn-danger',
                }, function () {
                    send("");
                });

                $active.empty();
                if (Broadcast && Broadcast.surveyURL) {
                    var a = blocks.link(Messages.admin_surveyActive, Broadcast.surveyURL);
                    $active.append([a, removeButton]);
                }
            });
            refresh();

            send = function (data) {
                $button.prop('disabled', 'disabled');
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['SET_SURVEY_URL', [data]]
                }, function (e, response) {
                    $button.prop('disabled', '');
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        console.error(e, response);
                        return;
                    }
                    // Maintenance applied, send notification
                    common.mailbox.sendTo('BROADCAST_SURVEY', {
                        url: data
                    }, {}, function () {
                        checkLastBroadcastHash(function () {
                            setTimeout(refresh, 300);
                        });
                    });
                });
            };
            // Extract form data
            var getData = function () {
                var url = $input.val();
                if (!Util.isValidURL(url)) {
                    console.error('Invalid URL', url);
                    return false;
                }
                return url;
            };
            Util.onClickEnter($(button), function () {
                var data = getData();
                if (data === false) { return void UI.warn(Messages.error); }
                send(data);
            });

            common.makeUniversal('broadcast', {
                onEvent: function (obj) {
                    var cmd = obj.ev;
                    if (cmd !== "SURVEY") { return; }
                    refresh();
                }
            });

            var form = blocks.form([active, labelledInput], nav);
            cb(form);
        });

        // Msg.admin_broadcastHint, admin_broadcastTitle
        sidebar.addItem('broadcast', function(cb) {
            var form = blocks.block([], 'cp-admin-broadcast-form');
            var $form = $(form);
            var refresh = getApi(function(Broadcast) {
                var button = blocks.button('primary', '', Messages.admin_broadcastButton);
                var $button = $(button);
                var removeButton = blocks.button('danger', '', Messages.admin_broadcastCancel);
                var activeContent = Messages.admin_broadcastActive;
                var active = blocks.block(blocks.inline(activeContent), 'cp-broadcast-active');
                var $active = $(active);
                var activeUid;
                var deleted = [];

                // Render active message (if there is one)
                var hash = Broadcast.lastBroadcastHash || '1'; // Truthy value if no lastKnownHash
                common.mailbox.getNotificationsHistory('broadcast', null, hash, function (e, msgs) {
                    if (e) { return void console.error(e); }
                    if (!Array.isArray(msgs)) { return; }
                    if (!msgs.length) {
                        $active.hide();
                    }
                    msgs.reverse().some(function (data) {
                        var c = data.content;
                        var msg = c && c.msg;
                        if (!msg) { return; }
                        if (msg.type === "BROADCAST_DELETE") {
                            deleted.push(Util.find(msg, ['content', 'uid']));
                        }
                        if (msg.type !== "BROADCAST_CUSTOM") { return; }
                        if (deleted.indexOf(msg.uid) !== -1) { return true; }

                        // We found an active custom message, show it
                        var el = common.mailbox.createElement(data);

                        var uid = Util.find(data, ['content', 'msg', 'uid']);
                        var time = Util.find(data, ['content', 'msg', 'content', 'time']);

                        var formattedTime = new Date(time || 0).toLocaleString();
                        var rowContent = [
                            'ID: ' + uid,
                            formattedTime,
                            $(el).find('.cp-notification-content').text(),
                            removeButton
                        ];
                        var table = blocks.table([], [rowContent]);
                        $active.append(table);
                        activeUid = uid;
                        return true;
                    });
                    if (!activeUid) { $active.hide(); }
                });

                // Custom message
                var container = blocks.block([], 'cp-broadcast-container');
                var $container = $(container);
                var languages = Messages._languages;
                var keys = Object.keys(languages).sort();

                // Always keep the textarea ordered by language code
                var reorder = function () {
                    $container.find('.cp-broadcast-lang').each(function (i, el) {
                        var $el = $(el);
                        var l = $el.attr('data-lang');
                        var index = keys.indexOf(l);
                        if (index !== -1) {
                            $el.css('order', index * 2);
                        } else {
                            console.error('Language key not found:', l);
                        }
                    });
                };
                // Remove a textarea
                var removeLang = function (l) {
                    $container.find('.cp-broadcast-lang[data-lang="'+l+'"]').remove();

                    var hasDefault = $container.find('.cp-broadcast-lang .cp-checkmark input:checked').length;
                    if (!hasDefault) {
                        $container.find('.cp-broadcast-lang').first().find('.cp-checkmark input').prop('checked', 'checked');
                    }
                };

                var getData = function () { return false; };
                var onPreview = function (l) {
                    var data = getData();
                    if (data === false) { return void UI.warn(Messages.error); }

                    var msg = {
                        uid: Util.uid(),
                        type: 'BROADCAST_CUSTOM',
                        content: data
                    };
                    common.mailbox.onMessage({
                        lang: l,
                        type: 'broadcast',
                        content: {
                            msg: msg,
                            hash: 'LOCAL|' + JSON.stringify(msg).slice(0,58)
                        }
                    }, function () {
                        UI.log(Messages.saved);
                    });
                };

                // Add a textarea
                var addLang = function (l) {
                    if ($container.find('.cp-broadcast-lang[data-lang="'+l+'"]').length) { return; }
                    var preview = blocks.button('secondary', '', Messages.broadcast_preview);
                    $(preview).click(function () {
                        onPreview(l);
                    });
                    var bcastDefault = Messages.broadcast_defaultLanguage;
                    var first = !$container.find('.cp-broadcast-lang').length;
                    var radio = UI.createRadio('broadcastDefault', null, bcastDefault, first, {
                        'data-lang': l,
                        label: {class: 'noTitle'}
                    });

                    var textarea = blocks.textarea();
                    var label = blocks.labelledInput(Messages.kanban_body, textarea);

                    $container.append(h('div.cp-broadcast-lang', { 'data-lang': l }, [
                        h('h4', languages[l]),
                        label,
                        radio,
                        preview
                    ]));

                    reorder();
                };
                 // Checkboxes to select translations
                var boxes = keys.map(function (l) {
                    var $cbox = $(UI.createCheckbox('cp-broadcast-custom-lang-'+l,
                        languages[l], false, { label: { class: 'noTitle' } }));
                    var $check = $cbox.find('input').on('change', function () {
                        var c = $check.is(':checked');
                        if (c) { return void addLang(l); }
                        removeLang(l);
                    });
                    if (l === 'en') {
                        setTimeout(function () {
                            $check.click();
                        });
                    }
                    return $cbox[0];
                });

                 // Extract form data
                getData = function () {
                    var map = {};
                    var defaultLanguage;
                    var error = false;
                    $container.find('.cp-broadcast-lang').each(function (i, el) {
                        var $el = $(el);
                        var l = $el.attr('data-lang');
                        if (!l) { error = true; return; }
                        var text = $el.find('textarea').val();
                        if (!text.trim()) { error = true; return; }
                        if ($el.find('.cp-checkmark input').is(':checked')) {
                            defaultLanguage = l;
                        }
                        map[l] = text;
                    });
                    if (!Object.keys(map).length) {
                        console.error('You must select at least one language');
                        return false;
                    }
                    if (error) {
                        console.error('One of the selected languages has no data');
                        return false;
                    }
                    return {
                        defaultLanguage: defaultLanguage,
                        content: map
                    };
                };

                var send = function (data) {
                    $button.prop('disabled', 'disabled');
                    //data.time = +new Date(); // FIXME not used anymore?
                    common.mailbox.sendTo('BROADCAST_CUSTOM', data, {}, function (err) {
                        if (err) {
                            $button.prop('disabled', '');
                            console.error(err);
                            return UI.warn(Messages.error);
                        }
                        UI.log(Messages.saved);
                        checkLastBroadcastHash(function () {
                            setTimeout(refresh, 300);
                        });
                    });
                };

                $button.click(function () {
                    var data = getData();
                    if (data === false) { return void UI.warn(Messages.error); }
                    send(data);
                });

                UI.confirmButton(removeButton, {
                    classes: 'btn-danger',
                }, function () {
                    if (!activeUid) { return; }
                    common.mailbox.sendTo('BROADCAST_DELETE', {
                        uid: activeUid
                    }, {}, function (err) {
                        if (err) { return UI.warn(Messages.error); }
                        UI.log(Messages.saved);
                        checkLastBroadcastHash(function () {
                            setTimeout(refresh, 300);
                        });
                    });
                });

                // Make the form
                $form.empty().append([
                    active,
                    h('div', Messages.broadcast_translations),
                    h('div.cp-broadcast-languages', boxes),
                    container,
                    h('div.cp-broadcast-form-submit', [
                        button
                    ])
                ]);
            });
            refresh();
            cb(form);

        });

        var onRefreshPerformance = Util.mkEvent();

        sidebar.addItem('refresh-performance', function(cb){
            var btn = blocks.button('primary', '', Messages.oo_refresh);
            Util.onClickEnter($(btn), function () {
                onRefreshPerformance.fire();
            });
            cb(btn);
        }, {
            noTitle: true,
            noHint: true
        });

        // Msg.admin_performanceProfilingHint, .admin_performanceProfilingTitle
        sidebar.addItem('performance-profiling', function(cb){
            var header = [
                Messages.admin_performanceKeyHeading,
                Messages.admin_performanceTimeHeading,
                Messages.admin_performancePercentHeading
            ];

            var table = blocks.table(header, []);
            table.setAttribute('id', 'cp-admin-table');
            let div = blocks.block([table]);
            div.setAttribute('id', 'cp-admin-table-container');

            const onRefresh = function () {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'GET_WORKER_PROFILES',
                }, function (e, data) {
                    if (e || data.error) {
                        UI.warn(Messages.error);
                        console.error(e, data);
                        return;
                    }

                    var o = data[0];
                    var sorted = Object.keys(o).sort(function (a, b) {
                        if (o[b] - o[a] <= 0) { return -1; }
                        return 1;
                    });

                    var total = 0;
                    sorted.forEach(function (key) { total += o[key]; });

                    const newRows = sorted.map(function (key) {
                        var percent = Math.floor((o[key] / total) * 1000) / 10;
                        return [key, o[key], percent + '%'];
                    });

                    table.updateContent(newRows);
                });
            };

            onRefresh();
            onRefreshPerformance.reg(onRefresh);

            cb(div);
        });


        // Msg.admin_enableDiskMeasurementsTitle.admin_enableDiskMeasurementsHint
        sidebar.addCheckboxItem({
            getState: function () {
                return APP.instanceStatus.enableProfiling;
            },
            key: 'enable-disk-measurements',
            options: { htmlHint: true },
            query: function (val, setState) {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['ENABLE_PROFILING', [val]]
                }, function (e, response) {
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        console.error(e, response);
                    }
                    APP.updateStatus(function () {
                        setState(APP.instanceStatus.enableProfiling);
                    });
                });
            }
        });

        var isPositiveInteger = function (n) {
            return n && typeof(n) === 'number'  && n % 1 === 0 && n > 0;
        };

        // Msg.admin_bytesWrittenTitle.admin_bytesWrittenHint
        sidebar.addItem('bytes-written', function(cb){
            var duration = APP.instanceStatus.profilingWindow;
            if (!isPositiveInteger(duration)) { duration = 10000; }
            var newDuration = blocks.input({
                type:'number',
                min: 0,
                value: duration
            });
            var set = blocks.button('primary', '', Messages.admin_setDuration);
            var label = blocks.labelledInput( Messages.ui_ms, newDuration);
            var nav = blocks.nav([set]);
            var form = blocks.form([
                label
            ], nav);
            UI.confirmButton(set, {
                classes: 'btn-primary',
                multiple: true,
                validate: function () {
                    var l = parseInt($(newDuration).val());
                    if (isNaN(l)) { return false; }
                    return true;
                }
            }, function () {
                var d = parseInt($(newDuration).val());
                if (!isPositiveInteger(d)) { return void UI.warn(Messages.error); }

                var data = [d];
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['SET_PROFILING_WINDOW', data]
                }, function (e, response) {
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        return void console.error(e, response);
                    }
                    $(form).find('.cp-admin-bytes-written-duration').text(Messages._getKey('admin_bytesWrittenDuration', [d]));
                });
            });
            cb(form);
        });

        // Messages.admin_updateAvailableTitle.admin_updateAvailableHint.admin_updateAvailableLabel.admin_updateAvailableButton
        sidebar.addItem('update-available', function(cb){
            if (!APP.instanceStatus.updateAvailable) { return; }

            var updateURL = 'https://github.com/cryptpad/cryptpad/releases/latest';
            if (typeof(APP.instanceStatus.updateAvailable) === 'string') {
                updateURL = APP.instanceStatus.updateAvailable;
            }
            var button = blocks.button('primary', '', Messages.admin_updateAvailableButton);
            Util.onClickEnter($(button), function () {
                common.openURL(updateURL);
            });

            cb(button);
        });

        // Messages.admin_checkupButton.admin_checkupHint.admin_checkupTitle
        sidebar.addItem('checkup', function(cb){
            var button = blocks.button('primary', '', Messages.admin_checkupButton);
            Util.onClickEnter($(button), function () {
                common.openURL('/checkup/');
            });

            cb(button);
        });


        // Messages.admin_blockDailyCheckTitle.admin_blockDailyCheckHint.admin_blockDailyCheckLabel
        sidebar.addCheckboxItem({
            key: 'block-daily-check',
            getState: function () {
                return  APP.instanceStatus.blockDailyCheck;
            },
            query: function (val, setState) {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['BLOCK_DAILY_CHECK', [val]]
                }, function (e, response) {
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        console.error(e, response);
                    }
                    APP.updateStatus(function () {
                        setState(APP.instanceStatus.blockDailyCheck);
                    });
                });
            }
        });

        // Messages.admin_provideAggregateStatisticsTitle.admin_provideAggregateStatisticsHint.admin_provideAggregateStatisticsLabel
        sidebar.addCheckboxItem({
            key: 'provide-aggregate-statistics',
            getState: function () {
                return APP.instanceStatus.provideAggregateStatistics;
            },
            query: function (val, setState) {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['PROVIDE_AGGREGATE_STATISTICS', [val]]
                }, function (e, response) {
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        console.error(e, response);
                    }
                    APP.updateStatus(function () {
                        setState(APP.instanceStatus.provideAggregateStatistics);
                    });
                });
            }
        });

        // Messages.admin_listMyInstanceTitle.admin_listMyInstanceHint.admin_listMyInstanceLabel
        sidebar.addCheckboxItem({
            key: 'list-my-instance',
            getState: function () {
                return APP.instanceStatus.listMyInstance;
            },
            query: function (val, setState) {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['LIST_MY_INSTANCE', [val]]
                }, function (e, response) {
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        console.error(e, response);
                    }
                    APP.updateStatus(function () {
                        setState(APP.instanceStatus.listMyInstance);
                    });
                });
            }
        });

        // Messages.admin_consentToContactTitle.admin_consentToContactHint.admin_consentToContactLabel
        sidebar.addCheckboxItem({
            key: 'consent-to-contact',
            getState: function () {
                return APP.instanceStatus.consentToContact;
            },
            query: function (val, setState) {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['CONSENT_TO_CONTACT', [val]]
                }, function (e, response) {
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        console.error(e, response);
                    }
                    APP.updateStatus(function () {
                        setState(APP.instanceStatus.consentToContact);
                    });
                });
            }
        });

        // Messages.admin_removeDonateButtonTitle.admin_removeDonateButtonHint.admin_removeDonateButtonLabel
        sidebar.addCheckboxItem({
            key: 'remove-donate-button',
            getState: function () {
                return APP.instanceStatus.removeDonateButton;
            },
            query: function (val, setState) {
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['REMOVE_DONATE_BUTTON', [val]]
                }, function (e, response) {
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        console.error(e, response);
                    }
                    APP.updateStatus(function () {
                        setState(APP.instanceStatus.removeDonateButton);
                    });
                });
            }
        });


        var sendDecree = function (data, cb) {
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ADMIN_DECREE',
                data: data,
            }, cb);
        };

        // Messages.admin_instancePurposeTitle.admin_instancePurposeHint
        sidebar.addItem('instance-purpose', function(cb){
            var values = [
                'noanswer', // Messages.admin_purpose_noanswer
                'experiment', // Messages.admin_purpose_experiment
                'personal', // Messages.admin_purpose_personal
                'education', // Messages.admin_purpose_education
                'org', // Messages.admin_purpose_org
                'business', // Messages.admin_purpose_business
                'public', // Messages.admin_purpose_public
            ];
            var defaultPurpose = 'noanswer';
            var purpose = APP.instanceStatus.instancePurpose || defaultPurpose;

            var opts = values.map(function (key) {
                var full_key = 'admin_purpose_' + key;
                return UI.createRadio('cp-instance-purpose-radio', 'cp-instance-purpose-radio-'+key,
                    Messages[full_key] || Messages._getKey(full_key, [defaultPurpose]),
                    key === purpose, {
                        input: { value: key },
                        //label: { class: 'noTitle' }
                    });
            });

            var $opts = $(opts);

            var setPurpose = function (value, cb) {
                sendDecree([
                    'SET_INSTANCE_PURPOSE',
                    [ value]
                ], cb);
            };

            $opts.on('change', function () {
                var val = $opts.find('input:radio:checked').val();
                console.log(val);
                //spinner.spin();
                setPurpose(val, function (e, response) {
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        //spinner.hide();
                        return;
                    }
                    //spinner.done();
                    UI.log(Messages.saved);
                });
            });

            cb(opts);
        });

        // EXTENSION_POINT:ADMIN_ITEM
        let utils = {
            h, Util, Hash
        };
        common.getExtensions('ADMIN_ITEM').forEach(ext => {
            if (!ext || !ext.id || typeof(ext.getContent) !== "function") {
                return console.error('Invalid extension point', 'ADMIN_CATEGORY', ext);
            }
            if (sidebar.hasItem(ext.id)) {
                return console.error('Extension point ID already used', ext);
            }

            sidebar.addItem(ext.id, cb => {
                ext.getContent(common, blocks, utils, content => {
                    cb(content);
                });
            }, {
                noTitle: !ext.title,
                noHint: !ext.description,
                title: ext.title,
                hint: ext.description
            });
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
        common.setTabTitle(Messages.adminPage || 'Administration');

        if (!common.isAdmin()) {
            return void UI.errorLoadingScreen(Messages.admin_authError || '403 Forbidden');
        }

        // Add toolbar
        createToolbar();

        APP.supportModule = common.makeUniversal('support');

        // Content
        andThen(common, APP.$container);

        UI.removeLoadingScreen();
    });
});
