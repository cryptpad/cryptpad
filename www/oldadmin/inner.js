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

    '/lib/datepicker/flatpickr.js',
    '/components/tweetnacl/nacl-fast.min.js',

    'css!/lib/datepicker/flatpickr.min.css',
    'css!/components/bootstrap/dist/css/bootstrap.min.css',
    'css!/components/components-font-awesome/css/font-awesome.min.css',
    'less!/admin/app-admin.less',
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
    Sortify,
    Flatpickr
    )
{
    var APP = {
        'instanceStatus': {}
    };

    var Nacl = window.nacl;
    var common;
    var sFrameChan;

    var categories = {
        'general': [ // Msg.admin_cat_general
            'cp-admin-flush-cache',
            'cp-admin-update-limit',
            'cp-admin-enableembeds',
            'cp-admin-forcemfa',
            'cp-admin-email',

            'cp-admin-instance-info-notice',

            'cp-admin-name',
            'cp-admin-description',
            'cp-admin-jurisdiction',
            'cp-admin-notice',
        ],
        'users': [ // Msg.admin_cat_quota
            'cp-admin-registration',
            'cp-admin-invitation',
            'cp-admin-users',
        ],
        'quota': [ // Msg.admin_cat_quota
            'cp-admin-defaultlimit',
            'cp-admin-setlimit',
            'cp-admin-getlimits',
        ],
        'database': [ // Msg.admin_cat_database
            'cp-admin-account-metadata',
            'cp-admin-document-metadata',
            'cp-admin-block-metadata',
            'cp-admin-totp-recovery',
        ],
        'stats': [ // Msg.admin_cat_stats
            'cp-admin-refresh-stats',
            'cp-admin-uptime',
            'cp-admin-active-sessions',
            'cp-admin-active-pads',
            'cp-admin-open-files',
            'cp-admin-registered',
            'cp-admin-disk-usage',
        ],
        'support': [ // Msg.admin_cat_support
            'cp-admin-support-list',
            'cp-admin-support-init',
            'cp-admin-support-priv',
        ],
        'broadcast': [ // Msg.admin_cat_broadcast
            'cp-admin-maintenance',
            'cp-admin-survey',
            'cp-admin-broadcast',
        ],
        'performance': [ // Msg.admin_cat_performance
            'cp-admin-refresh-performance',
            'cp-admin-performance-profiling',
            'cp-admin-enable-disk-measurements',
            'cp-admin-bytes-written',
        ],
        'network': [ // Msg.admin_cat_network
            'cp-admin-update-available',
            'cp-admin-checkup',
            'cp-admin-block-daily-check',
            'cp-admin-provide-aggregate-statistics',
            'cp-admin-list-my-instance',

            'cp-admin-consent-to-contact',
            'cp-admin-remove-donate-button',
            'cp-admin-instance-purpose',
        ],
    };

    var create = {};

    var keyToCamlCase = function (key) {
        return key.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
    };

    var makeBlock = function (key, addButton) { // Title, Hint, maybeButton
        // Convert to camlCase for translation keys
        var safeKey = keyToCamlCase(key);
        var $div = $('<div>', {'class': 'cp-admin-' + key + ' cp-sidebarlayout-element'});
        $('<label>', {'id': 'cp-admin-' + key, 'class':'cp-admin-label'}).text(Messages['admin_'+safeKey+'Title'] || key).appendTo($div);
        $('<span>', {'class': 'cp-sidebarlayout-description'})
            .text(Messages['admin_'+safeKey+'Hint'] || 'Coming soon...').appendTo($div);
        if (addButton) {
            $('<button>', {
                'class': 'btn btn-primary'
            }).text(Messages['admin_'+safeKey+'Button'] || safeKey).appendTo($div);
        }
        return $div;
    };
    create['update-limit'] = function () {
        var key = 'update-limit';
        var $div = makeBlock(key, true); // Msg.admin_updateLimitHint, .admin_updateLimitTitle, .admin_updateLimitButton
        $div.find('button').click(function () {
            sFrameChan.query('Q_UPDATE_LIMIT', null, function (e, res) {
                if (e || (res && res.error)) { return void console.error(e || res.error); }
                UI.alert(Messages.admin_updateLimitDone || 'done');
            });
        });
        return $div;
    };
    create['flush-cache'] = function () {
        var key = 'flush-cache';
        var $div = makeBlock(key, true); // Msg.admin_flushCacheHint, .admin_flushCacheTitle, .admin_flushCacheButton
        var called = false;
        $div.find('button').click(function () {
            if (called) { return; }
            called = true;
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'FLUSH_CACHE',
            }, function (e, data) {
                called = false;
                UI.alert(data ? Messages.admin_flushCacheDone || 'done' : 'error' + e);
            });
        });
        return $div;
    };

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

    var customButton = function (cls, text, handler, opt) {
        var btn = h(`button.btn.btn-${cls}`, opt, text);
        if (handler) { $(btn).click(handler); }
        return btn;
    };

    var primary = (text, handler, opt) => customButton('primary', text, handler, opt);
    var danger = (text, handler, opt) => customButton('danger', text, handler, opt);

    var copyToClipboard = (content) => {
        var button = primary(Messages.copyToClipboard, () => {
            var toCopy = JSON.stringify(content, null, 2);
            Clipboard.copy(toCopy, (err) => {
                if (err) { return UI.warn(Messages.error); }
                UI.log(Messages.genericCopySuccess);
            });
        });
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
                button = primary(Messages.admin_accountReportFull, () => {
                    $(button).remove();
                    $(pre).html(JSON.stringify(data.archiveReport, 0, 2));
                })
            ]));
        }


    // actions
        if (data.archived && data.live === false && data.archiveReport) {
            row(Messages.admin_restoreAccount, primary(Messages.ui_restore, function () {
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
            }));
        }

        if (data.live === true) {
            var getPins = () => {
                sframeCommand('GET_PIN_LIST', data.key, (err, pins) => {
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
            row(Messages.admin_getPinList, primary(Messages.ui_fetch, getPins));

            // get full pin history
            var getHistoryHandler = () => {
                sframeCommand('GET_PIN_HISTORY', data.key, (err, history) => {
                    if (err) {
                        console.error(err);
                        return void UI.warn(Messages.error);
                    }
                    UI.alert(history); // TODO NOT_IMPLEMENTED
                });
            };
            var pinHistoryButton =  primary(Messages.ui_fetch, getHistoryHandler);
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
                        console.error(err);
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
            row(archiveAccountLabel, danger(Messages.admin_archiveButton, archiveHandler));

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

    create['account-metadata'] = function () {
        var key = 'account-metadata';
        var $div = makeBlock(key, true); // Msg.admin_accountMetadataHint.admin_accountMetadataTitle

        // input field for edPublic or user string
        var input = h('input', {
            placeholder: Messages.admin_accountMetadataPlaceholder,
            type: 'text',
            value: '',
        });
        var $input = $(input);

        var box = h('div.cp-admin-setter', [
            input, 
        ]);

        $div.find('.cp-sidebarlayout-description').after(box);

        var results = h('span');

        $div.append(results);

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

        var $btn = $div.find('.btn');
        $btn.text(Messages.ui_generateReport);
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

        $btn.click(function (/* ev */) {
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

        return $div;
    };

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
            var metadataHistoryButton = primary(Messages.ui_fetch, function () {
                sframeCommand('GET_METADATA_HISTORY', data.id, (err, result) => {
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
            let restoreButton = danger(Messages.admin_unarchiveButton, function () {
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
            });

            let archiveButton = danger(Messages.admin_archiveButton, function () {
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
            });

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
            var archiveDocumentButton = danger(Messages.admin_archiveButton, function () {
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
            });
            row(Messages.admin_archiveDocument, h('span', [
                archiveDocumentButton,
                h('small', Messages.admin_archiveHint),
            ]));
        } else if (data.archived) {
            var restoreDocumentButton = primary(Messages.admin_unarchiveButton, function () {
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
            });
            row(Messages.admin_restoreDocument, h('span', [
                restoreDocumentButton,
                h('small', Messages.admin_unarchiveHint),
            ]));
        }

        row(reportContentLabel, copyToClipboard(data));

        return tableObj.table;
    };

    create['document-metadata'] = function () {
        var key = 'document-metadata';
        var $div = makeBlock(key, true); // Msg.admin_documentMetadataHint.admin_documentMetadataTitle

        var input = h('input', {
            placeholder: Messages.admin_documentMetadataPlaceholder,
            type: 'text',
            value: '',
        });

        var passwordContainer = UI.passwordInput({
            id: 'cp-database-document-pw',
            placeholder: Messages.login_password,
        });
        var $passwordContainer = $(passwordContainer);

        var $input = $(input);
        var $password = $(passwordContainer).find('input');
        $password.attr('placeholder', Messages.admin_archiveInput2);

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

        $passwordContainer.hide();
        var box = h('div.cp-admin-setter', [
            input,
            passwordContainer,
        ]);
        $div.find('.cp-sidebarlayout-description').after(box);
        var results = h('span');

        $div.append(results);

        var $btn = $div.find('.btn');
        $btn.text(Messages.ui_generateReport);
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

        $btn.click(function () {
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

        return $div;
    };

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
            var archiveButton = danger(Messages.ui_archive, function () {
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
            });
            row(Messages.admin_archiveBlock, archiveButton);
        }
        if (data.placeholder) {
            console.warn('Placeholder code', data.placeholder);
            row(Messages.admin_channelPlaceholder, UI.getDestroyedPlaceholderMessage(data.placeholder, true));
        }
        if (data.archived && !data.live) {
            var restoreButton = danger(Messages.ui_restore, function () {
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
            });
            row(Messages.admin_restoreBlock, restoreButton);
        }

        row(reportContentLabel, copyToClipboard(data));

        return tableObj.table;
    };

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

    create['block-metadata'] = function () {
        var key = 'block-metadata';
        var $div = makeBlock(key, true); // Msg.admin_blockMetadataHint.admin_blockMetadataTitle

        var input = h('input', {
            placeholder: Messages.admin_blockMetadataPlaceholder,
            value: '',
        });
        var $input = $(input);

        var box = h('div.cp-admin-setter', [
            input,
        ]);

        $div.find('.cp-sidebarlayout-description').after(box);

        var results = h('span');
        $div.append(results);
        var $btn = $div.find('.btn');
        $btn.text(Messages.ui_generateReport);
        disable($btn);

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

        $btn.click(function () {
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

        return $div;
    };

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
        var disableButton = h('button.btn.btn-danger', Messages.admin_totpDisableButton);
        UI.confirmButton(disableButton, { classes: 'btn-danger' }, function () {
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

    create['totp-recovery'] = function () {
        var key = 'totp-recovery';
        var $div = makeBlock(key, true); // Msg.admin_totpRecoveryHint.totpRecoveryTitle

        var textarea = h('textarea', {
            id: 'textarea-input',
            'aria-labelledby': 'cp-admin-totp-recovery'
        });
        var $input = $(textarea);

        var box = h('div.cp-admin-setter', textarea);

        $div.find('.cp-sidebarlayout-description').after(box);

        var results = h('span');
        $div.append(results);
        var $btn = $div.find('.btn');
        $btn.text(Messages.admin_totpDisable);
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
/*
Example
{
  "intent": "Disable TOTP",
  "date": "2023-05-15T15:38:40.916Z",
  "blockId": "+0PdpTuQi9/O2qjoJ8FLcvPEwChLfDWJrYXyPdVGzOo=",
  "proof": "iDcHy6+ymiyWzK/oYNPQ1ItFNCiTmmJuAyYmcEXNha2U1nUxyBWAf0o7ZXWhygS6XI5BLrjH+DDcbWitfO3bCg=="
}
*/

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
        $btn.click(function () {
            if (pending) { return; }
            var state = getInputState();
            if (!state.value) { return; }
            pending = true;
            setInterfaceState();
            getBlockData(state.key, (err, data) => {
                pending = false;
                setInterfaceState();
                console.warn(data);
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

        return $div;
    };

    var makeAdminCheckbox = function (data) {
        return function () {
            var state = data.getState();
            var key = data.key;
            var $div = makeBlock(key); //sidebar.addItem(data.key);
            var $hint;
            if (data.hintElement) {
                $hint = $div.find('.cp-sidebarlayout-description');
                $hint.html('');
                $hint.append(data.hintElement);
            }

            var labelKey = 'admin_' + keyToCamlCase(key) + 'Label';
            var titleKey = 'admin_' + keyToCamlCase(key) + 'Title';
            var $cbox = $(UI.createCheckbox('cp-admin-' + key,
                Messages[labelKey] || Messages[titleKey],
                state, { label: { class: 'noTitle' } }));
            var spinner = UI.makeSpinner($cbox);
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
            $cbox.appendTo($div);
            return $div;
        };
    };

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

    // Msg.admin_registrationHint, .admin_registrationTitle
    // Msg.admin_registrationSsoTitle
    create['registration'] = function () {
        var refresh = function () {};

        var $div = makeAdminCheckbox({
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
                        flushCacheNotice();
                    });
                });
            }
        })();

        var $sso = makeAdminCheckbox({
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
                        flushCacheNotice();
                    });
                });
            }
        })();
        var ssoEnabled = ApiConfig.sso && ApiConfig.sso.list && ApiConfig.sso.list.length;
        if (ssoEnabled) {
            $sso.find('#cp-admin-registration-sso').hide();
            $sso.find('> span.cp-sidebarlayout-description').hide();
            $div.append($sso);
        }

        refresh = () => {
            var closed = APP.instanceStatus.restrictRegistration;
            if (closed) {
                $sso.show();
            } else {
                $sso.hide();
            }
        };
        refresh();


        return $div;
    };

    create['invitation'] = function () {
        var key = 'invitation';
        var $div = makeBlock(key); // Msg.admin_invitationHint, admin_invitationTitle

        var list = h('table.cp-admin-all-limits');
        var input = h('input#cp-admin-invitation-alias');
        var inputEmail = h('input#cp-admin-invitation-email');
        var button = h('button.btn.btn-primary', Messages.admin_invitationCreate);
        var $b = $(button);


        var refreshInvite = function () {};
        var refresh = h('button.btn.btn-secondary', Messages.oo_refresh);
        Util.onClickEnter($(refresh), function () {
            refreshInvite();
        });

        var add = h('div', [
            h('label', { for: 'cp-admin-invitation-alias' }, Messages.admin_invitationAlias),
            input,
            h('label', { for: 'cp-admin-invitation-email' }, Messages.admin_invitationEmail),
            inputEmail,
            h('nav', [button, refresh])
        ]);

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
        var $list = $(list);
        refreshInvite = function () {
            $list.empty();
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
                Object.keys(all).forEach(function (key, i) {
                    if (!i) { // First item: add header to table
                        var trHead = h('tr', [
                            h('th', Messages.admin_invitationLink),
                            h('th', Messages.admin_invitationAlias),
                            h('th', Messages.admin_invitationEmail),
                            h('th', Messages.admin_documentCreationTime),
                            h('th')
                        ]);
                        $list.append(trHead);
                    }
                    var data = all[key];
                    var url = privateData.origin + Hash.hashToHref(key, 'register');

                    var del = h('button.btn.btn-danger', [
                        h('i.fa.fa-trash'),
                        h('span', Messages.kanban_delete)
                    ]);
                    var $del = $(del);
                    Util.onClickEnter($del, function () {
                        $del.attr('disabled', 'disabled');
                        UI.confirm(Messages.admin_invitationDeleteConfirm, function (yes) {
                            $del.attr('disabled', '');
                            if (!yes) { return; }
                            deleteInvite(key);
                        });
                    });
                    var copy = h('button.btn.btn-secondary', [
                        h('i.fa.fa-clipboard'),
                        h('span', Messages.admin_invitationCopy)
                    ]);
                    Util.onClickEnter($(copy), function () {
                        Clipboard.copy(url, () => {
                            UI.log(Messages.genericCopySuccess);
                        });
                    });
                    var line = h('tr', [
                        h('td', UI.dialog.selectable(url)),
                        h('td', data.alias),
                        h('td', data.email),
                        h('td', new Date(data.time).toLocaleString()),
                        //h('td', data.createdBy),
                        h('td', [
                            copy,
                            del
                        ])
                    ]);
                    $list.append(line);
                });
            });
        };
        refreshInvite();

        $b.on('click', () => {
            var alias = $(input).val().trim();
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
                $(input).val('').focus();
                $(inputEmail).val('');
                refreshInvite();
            });
        });

        $div.append([add, list]);
        return $div;
    };

    create['users'] = function () {
        var key = 'users';
        var $div = makeBlock(key); // Msg.admin_usersHint, admin_usersTitle

        var list = h('table.cp-admin-all-limits');
        var userAlias = h('input#cp-admin-users-alias');
        var userEmail = h('input#cp-admin-users-email');
        var userEdPublic = h('input#cp-admin-users-key');
        var userBlock = h('input#cp-admin-users-block');
        var button = h('button.btn.btn-primary', Messages.admin_usersAdd);
        var $b = $(button);

        var refreshUsers = function () {};

        var refresh = h('button.btn.btn-secondary', Messages.oo_refresh);
        Util.onClickEnter($(refresh), function () {
            refreshUsers();
        });

        var add = h('div', [
            h('label', { for: 'cp-admin-users-alias' }, Messages.admin_invitationAlias),
            userAlias,
            h('label', { for: 'cp-admin-users-email' }, Messages.admin_invitationEmail),
            userEmail,
            h('label', { for: 'cp-admin-users-key' }, Messages.admin_limitUser),
            userEdPublic,
            h('label', { for: 'cp-admin-users-block' }, Messages.admin_usersBlock),
            userBlock,
            h('nav', [button, refresh])
        ]);

        var $invited = makeAdminCheckbox({
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
                        flushCacheNotice();
                    });
                });
            }
        })();
        $invited.find('#cp-admin-store-invited').hide();
        $invited.find('> span.cp-sidebarlayout-description').hide();
        $div.append($invited);
        var $sso = makeAdminCheckbox({
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
                        flushCacheNotice();
                    });
                });
            }
        })();
        var ssoEnabled = ApiConfig.sso && ApiConfig.sso.list && ApiConfig.sso.list.length;
        if (ssoEnabled) {
            $sso.find('#cp-admin-store-sso').hide();
            $sso.find('> span.cp-sidebarlayout-description').hide();
            $div.append($sso);
        }

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
        var $list = $(list);
        refreshUsers = function () {
            $list.empty();
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
                Object.keys(all).forEach(function (key, i) {
                    if (!i) { // First item: add header to table
                        var trHead = h('tr', [
                            h('th', Messages.admin_invitationAlias),
                            h('th', Messages.admin_invitationEmail),
                            h('th', Messages.admin_limitUser),
                            h('th', Messages.admin_documentCreationTime),
                            h('th')
                        ]);
                        $list.append(trHead);
                    }
                    var data = all[key];
                    var editUser = () => {};
                    var del = h('button.btn.btn-danger', [
                        h('i.fa.fa-trash'),
                        Messages.admin_usersRemove
                    ]);
                    var $del = $(del);
                    Util.onClickEnter($del, function () {
                        $del.attr('disabled', 'disabled');
                        UI.confirm(Messages.admin_usersRemoveConfirm, function (yes) {
                            $del.attr('disabled', '');
                            if (!yes) { return; }
                            deleteUser(key);
                        });
                    });
                    var edit = h('button.btn.btn-secondary', [
                        h('i.fa.fa-pencil'),
                        h('span', Messages.tag_edit)
                    ]);
                    Util.onClickEnter($(edit), function () {
                        editUser();
                    });

                    var alias = h('td', data.alias);
                    var email = h('td', data.email);
                    var actions = h('td', [edit, del]);
                    var $alias = $(alias);
                    var $email = $(email);
                    var $actions = $(actions);

                    editUser = () => {
                        var aliasInput = h('input');
                        var emailInput = h('input');
                        $(aliasInput).val(data.alias);
                        $(emailInput).val(data.email);
                        var save = h('button.btn.btn-primary', Messages.settings_save);
                        var cancel = h('button.btn.btn-secondary', Messages.cancel);
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
                        console.warn(alias, email, $alias, $email, aliasInput);
                    };

                    var infoButton = h('button.btn.primary.cp-report', {
                        style: 'margin-left: 10px; cursor: pointer;',
                    }, [
                        h('i.fa.fa-database'),
                        h('span', Messages.admin_diskUsageButton)
                    ]);
                    $(infoButton).click(() => {
                         getAccountData(key, (err, data) => {
                             if (err) { return void console.error(err); }
                             var table = renderAccountData(data);
                             UI.alert(table, () => {

                             }, {
                                wide: true,
                             });
                         });
                    });

                    var line = h('tr', [
                        alias,
                        email,
                        h('td', [
                            h('code', key),
                            infoButton
                        ]),
                        h('td', new Date(data.time).toLocaleString()),
                        //h('td', data.createdBy),
                        actions
                    ]);
                    $list.append(line);
                });
            });
        };
        refreshUsers();

        $b.on('click', () => {
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

        $div.append([add, list]);
        return $div;
    };

    // Msg.admin_enableembedsHint, .admin_enableembedsTitle
    create['enableembeds'] = makeAdminCheckbox({
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

    // Msg.admin_forcemfaHint, .admin_forcemfaTitle
    create['forcemfa'] = makeAdminCheckbox({
        key: 'forcemfa',
        getState: function () {
            return APP.instanceStatus.enforceMFA;
        },
        query: function (val, setState) {
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ADMIN_DECREE',
                data: ['ENFORCE_MFA', [val]]
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

    create['email'] = function () {
        var key = 'email';
        var $div = makeBlock(key, true); // Msg.admin_emailHint, Msg.admin_emailTitle
        var $button = $div.find('button').text(Messages.settings_save);

        var input = h('input', {
            type: 'email',
            value: ApiConfig.adminEmail || '',
            'aria-labelledby': 'cp-admin-email'
        });
        var $input = $(input);

        var innerDiv = h('div.cp-admin-setter.cp-admin-setlimit-form', input);

        var spinner = UI.makeSpinner($(innerDiv));

        $button.click(function () {
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

        $button.before(innerDiv);

        return $div;
    };

    var getInstanceString = function (attr) {
        var val = APP.instanceStatus[attr];
        var type = typeof(val);
        switch (type) {
            case 'string': return val || '';
            case 'object': return val.default || '';
            default: return '';
        }
    };

    create['jurisdiction'] = function () { // TODO make translateable
        var key = 'jurisdiction';
        var $div = makeBlock(key, true); // Msg.admin_jurisdictionHint, Msg.admin_jurisdictionTitle, Msg.admin_jurisdictionButton
        var $button = $div.find('button').addClass('cp-listing-action').text(Messages.settings_save);

        var input = h('input', {
            type: 'text',
            value: getInstanceString('instanceJurisdiction'),
            placeholder: Messages.owner_unknownUser || '',
            'aria-labelledby': 'cp-admin-jurisdiction'
        });
        var $input = $(input);
        var innerDiv = h('div.cp-admin-setter', input);
        var spinner = UI.makeSpinner($(innerDiv));

        $button.click(function () {
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
                UI.log(Messages._getKey('ui_saved', [Messages.admin_jurisdictionTitle]));
            });
        });

        $button.before(innerDiv);

        return $div;
    };


    create['notice'] = function () { // TODO make translateable
        var key = 'notice';
        var $div = makeBlock(key, true); // Messages.admin_noticeHint

        var $button = $div.find('button').addClass('cp-listing-action').text(Messages.settings_save);

        var input = h('input', {
            type: 'text',
            value: getInstanceString('instanceNotice'),
            placeholder: '',
            'aria-labelledby': 'cp-admin-notice'
        });

        var $input = $(input);
        var innerDiv = h('div.cp-admin-setter', input);
        var spinner = UI.makeSpinner($(innerDiv));

        $button.click(function () {
            spinner.spin();
            $button.attr('disabled', 'disabled');
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ADMIN_DECREE',
                data: ['SET_INSTANCE_NOTICE', [$input.val().trim()]]
            }, function (e, response) {
                $button.removeAttr('disabled');
                spinner.hide();
                if (e || response.error) {
                    UI.warn(Messages.error);
                    $input.val('');
                    console.error(e, response);
                    return;
                }
                UI.log(Messages._getKey('ui_saved', [Messages.admin_noticeTitle]));
            });
        });

        $button.before(innerDiv);

        return $div;
    };

    create['instance-info-notice'] = function () {
        return $(h('div.cp-admin-instance-info-notice.cp-sidebarlayout-element',
            h('div.alert.alert-info.cp-admin-bigger-alert', [
                Messages.admin_infoNotice1,
                ' ',
                Messages.admin_infoNotice2,
            ])
        ));
    };

    create['name'] = function () { // TODO make translateable
        var key = 'name';
        var $div = makeBlock(key, true);
        // Msg.admin_nameHint, Msg.admin_nameTitle, Msg.admin_nameButton
        var $button = $div.find('button').addClass('cp-listing-action').text(Messages.settings_save);

        var input = h('input', {
            type: 'text',
            value: getInstanceString('instanceName') || ApiConfig.httpUnsafeOrigin || '',
            placeholder: ApiConfig.httpUnsafeOrigin,
            'aria-labelledby': 'cp-admin-name'
        });
        var $input = $(input);
        var innerDiv = h('div.cp-admin-setter', input);
        var spinner = UI.makeSpinner($(innerDiv));

        $button.click(function () {
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

        $button.before(innerDiv);

        return $div;
    };

    create['description'] = function () { // TODO support translation
        var key = 'description';
        var $div = makeBlock(key, true); // Msg.admin_descriptionHint

        var textarea = h('textarea.cp-admin-description-text', {
            placeholder: Messages.home_host || '',
            'aria-labelledby': 'cp-admin-description'
        }, getInstanceString('instanceDescription'));

        var $button = $div.find('button').text(Messages.settings_save);

        $button.addClass('cp-listing-action');

        var innerDiv = h('div.cp-admin-setter', [
            textarea,
        ]);
        $button.before(innerDiv);

        var $input = $(textarea);
        var spinner = UI.makeSpinner($(innerDiv));

        $button.click(function () {
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
                UI.log(Messages._getKey('ui_saved', [Messages.admin_descriptionTitle]));
            });
        });

        return $div;
    };

    create['defaultlimit'] = function () {
        var key = 'defaultlimit';
        var $div = makeBlock(key); // Msg.admin_defaultlimitHint, .admin_defaultlimitTitle
        var _limit = APP.instanceStatus.defaultStorageLimit;
        var _limitMB = Util.bytesToMegabytes(_limit);
        var limit = getPrettySize(_limit);
        var newLimit = h('input', {
            type: 'number',
            min: 0,
            value: _limitMB,
            'aria-labelledby': 'cp-admin-defaultlimit'
        });
        var set = h('button.btn.btn-primary', Messages.admin_setlimitButton);

        $div.append(h('div', [
            h('span.cp-admin-defaultlimit-value', Messages._getKey('admin_limit', [limit])),
            h('div.cp-admin-setlimit-form', [
                newLimit,
                h('nav', [set])
            ])
        ]));




        UI.confirmButton(set, {
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
                $div.find('.cp-admin-defaultlimit-value').text(Messages._getKey('admin_limit', [limit]));
            });
        });
        return $div;
    };
    create['getlimits'] = function () {
        var key = 'getlimits';
        var $div = makeBlock(key); // Msg.admin_getlimitsHint, .admin_getlimitsTitle
        APP.refreshLimits = function () {
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'GET_LIMITS',
            }, function (e, data) {
                if (e) { return; }
                if (!Array.isArray(data) || !data[0]) { return; }

                $div.find('.cp-admin-all-limits').remove();

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
                    var title = Messages._getKey('admin_limit', [limit]) + ', ' +
                                Messages._getKey('admin_limitPlan', [user.plan]) + ', ' +
                                Messages._getKey('admin_limitNote', [user.note]);

                    var infoButton = h('button.btn.primary.cp-report', {
                        style: 'margin-left: 10px; cursor: pointer;',
                    }, Messages.admin_diskUsageButton);

                    $(infoButton).click(() => {
                         console.log(key);
                         getAccountData(key, (err, data) => {
                             if (err) { return void console.error(err); }
                             console.log(data);
                             var table = renderAccountData(data);
                             UI.alert(table, () => {

                             }, {
                                wide: true,
                             });
                         });
                    });

                    var keyEl = h('code.cp-limit-key', key);
                    $(keyEl).click(function () {
                        $('.cp-admin-setlimit-form').find('.cp-setlimit-key').val(key);
                        $('.cp-admin-setlimit-form').find('.cp-setlimit-quota').val(Math.floor(user.limit / 1024 / 1024));
                        $('.cp-admin-setlimit-form').find('.cp-setlimit-note').val(user.note);
                    });

                    var attr = { title: title };
                    return h('tr.cp-admin-limit', [
                        h('td', [
                            keyEl,
                            infoButton,
                        ]),
                        h('td.limit', attr, limit),
                        h('td.plan', attr, user.plan),
                        h('td.note', attr, user.note)
                    ]);
                });
                return $div.append(h('table.cp-admin-all-limits', [
                    h('tr', [
                        h('th', Messages.settings_publicSigningKey),
                        h('th.limit', Messages.admin_planlimit),
                        h('th.plan', Messages.admin_planName),
                        h('th.note', Messages.admin_note)
                    ]),
                ].concat(content)));
            });
        };
        APP.refreshLimits();
        return $div;
    };

    create['setlimit'] = function () {
        var key = 'setlimit';
        var $div = makeBlock(key); // Msg.admin_setlimitHint, .admin_setlimitTitle

        var user = h('input.cp-setlimit-key#cp-admin-setlimit-user');
        var $key = $(user);
        var limit = h('input.cp-setlimit-quota#cp-admin-setlimit-value', {
            type: 'number',
            min: 0,
            value: 0
        });
        var note = h('input.cp-setlimit-note#cp-admin-setlimit-note');
        var remove = h('button.btn.btn-danger', Messages.fc_remove);
        var set = h('button.btn.btn-primary', Messages.admin_setlimitButton);

        var form = h('div.cp-admin-setlimit-form', [
            h('label', { for: 'cp-admin-setlimit-user' }, Messages.admin_limitUser),
            user,
            h('label', { for: 'cp-admin-setlimit-value' }, Messages.admin_limitMB),
            limit,
            h('label', { for: 'cp-admin-setlimit-note' }, Messages.admin_limitSetNote),
            note,
            h('nav', [set, remove])
        ]);

        var $note = $(note);

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

        $(set).click(function () {
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

        $div.append(form);
        return $div;
    };

    var onRefreshStats = Util.mkEvent();

    create['refresh-stats'] = function () {
        var key = 'refresh-stats';
        var $div = $('<div>', {'class': 'cp-admin-' + key + ' cp-sidebarlayout-element'});
        var $btn = $(h('button.btn.btn-primary', Messages.oo_refresh));
        $btn.click(function () {
            onRefreshStats.fire();
        });
        $div.append($btn);
        return $div;
    };

    create['uptime'] = function () {
        var key = 'uptime';
        var $div = makeBlock(key); // Msg.admin_uptimeTitle, .admin_uptimeHint
        var pre = h('pre');

        var set = function () {
            var uptime = APP.instanceStatus.launchTime;
            if (typeof(uptime) !== 'number') { return; }
            pre.innerText = new Date(uptime);
        };

        set();

        $div.append(pre);
        onRefreshStats.reg(function () {
            APP.updateStatus(set);
        });
        return $div;
    };

    create['active-sessions'] = function () {
        var key = 'active-sessions';
        var $div = makeBlock(key); // Msg.admin_activeSessionsHint, .admin_activeSessionsTitle
        var onRefresh = function () {
            $div.find('pre').remove();
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ACTIVE_SESSIONS',
            }, function (e, data) {
                var total = data[0];
                var ips = data[1];
                $div.find('pre').remove();
                $div.append(h('pre', total + ' (' + ips + ')'));
            });
        };
        onRefresh();
        onRefreshStats.reg(onRefresh);
        return $div;
    };
    create['active-pads'] = function () {
        var key = 'active-pads';
        var $div = makeBlock(key); // Msg.admin_activePadsHint, .admin_activePadsTitle
        var onRefresh = function () {
            $div.find('pre').remove();
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ACTIVE_PADS',
            }, function (e, data) {
                //console.log(e, data);
                $div.find('pre').remove();
                $div.append(h('pre', String(data)));
            });
        };
        onRefresh();
        onRefreshStats.reg(onRefresh);
        return $div;
    };
    create['open-files'] = function () {
        var key = 'open-files';
        var $div = makeBlock(key); // Msg.admin_openFilesHint, .admin_openFilesTitle
        var onRefresh = function () {
            $div.find('pre').remove();
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'GET_FILE_DESCRIPTOR_COUNT',
            }, function (e, data) {
                if (e || (data && data.error)) {
                    console.error(e, data);
                    $div.append(h('pre', {
                        style: 'text-decoration: underline',
                    }, String(e || data.error)));
                    return;
                }
                //console.log(e, data);
                $div.find('pre').remove();
                $div.append(h('pre', String(data)));
            });
        };
        onRefresh();
        onRefreshStats.reg(onRefresh);
        return $div;
    };
    create['registered'] = function () {
        var key = 'registered';
        var $div = makeBlock(key); // Msg.admin_registeredHint, .admin_registeredTitle
        var onRefresh = function () {
            $div.find('pre').remove();
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'REGISTERED_USERS',
            }, function (e, data) {
                //console.log(e, data);
                $div.find('pre').remove();
                $div.append(h('pre', String(data)));
            });
        };
        onRefresh();
        onRefreshStats.reg(onRefresh);
        return $div;
    };

    create['disk-usage'] = function () {
        var key = 'disk-usage';
        var $div = makeBlock(key, true); // Msg.admin_diskUsageHint, .admin_diskUsageTitle, .admin_diskUsageButton
        var called = false;

        $div.find('button').click(function () {
        UI.confirm(Messages.admin_diskUsageWarning, function (yes) {
            if (!yes) { return; }
            $div.find('button').hide();
            if (called) { return; }
            called = true;
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'DISK_USAGE',
            }, function (e, data) {
                console.log(e, data);
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
                $div.append(h('ul', Object.keys(obj).map(function (k) {
                    return h('li', [
                        h('strong', k === 'total' ? k : '/' + k),
                        ' : ',
                        obj[k]
                    ]);
                })));
            });
        });
        });

        return $div;
    };

    var supportKey = ApiConfig.supportMailbox;
    var checkAdminKey = function (priv) {
        if (!supportKey) { return; }
        return Hash.checkBoxKeyPair(priv, supportKey);
    };

    create['support-list'] = function () {
        if (!supportKey || !APP.privateKey || !checkAdminKey(APP.privateKey)) { return; }
        var $container = makeBlock('support-list'); // Msg.admin_supportListHint, .admin_supportListTitle
        var $div = $(h('div.cp-support-container')).appendTo($container);

        var catContainer = h('div.cp-dropdown-container');
        var col1 = h('div.cp-support-column', h('h1', [
            h('span', Messages.admin_support_premium),
            h('span.cp-support-count'),
            h('button.btn.cp-support-column-button', Messages.admin_support_collapse)
        ]));
        var col2 = h('div.cp-support-column', h('h1', [
            h('span', Messages.admin_support_normal),
            h('span.cp-support-count'),
            h('button.btn.cp-support-column-button', Messages.admin_support_collapse)
        ]));
        var col3 = h('div.cp-support-column', h('h1', [
            h('span', Messages.admin_support_answered),
            h('span.cp-support-count'),
            h('button.btn.cp-support-column-button', Messages.admin_support_collapse)
        ]));
        var col4 = h('div.cp-support-column', h('h1', [
            h('span', Messages.admin_support_closed),
            h('span.cp-support-count'),
            h('button.btn.cp-support-column-button', Messages.admin_support_collapse)
        ]));
        var $col1 = $(col1), $col2 = $(col2), $col3 = $(col3), $col4 = $(col4);
        $div.append([
            //catContainer
            col1,
            col2,
            col3,
            col4
        ]);
        $div.find('.cp-support-column-button').click(function () {
            var $col = $(this).closest('.cp-support-column');
            $col.toggleClass('cp-support-column-collapsed');
            if ($col.hasClass('cp-support-column-collapsed')) {
                $(this).text(Messages.admin_support_open);
                $(this).toggleClass('btn-primary');
            } else {
                $(this).text(Messages.admin_support_collapse);
                $(this).toggleClass('btn-primary');
            }
        });
        var category = 'all';
        var $drop = APP.support.makeCategoryDropdown(catContainer, function (key) {
            category = key;
            if (key === 'all') {
                $div.find('.cp-support-list-ticket').show();
                return;
            }
            $div.find('.cp-support-list-ticket').hide();
            $div.find('.cp-support-list-ticket[data-cat="'+key+'"]').show();
        }, true);
        $drop.setValue('all');

        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        var cat = privateData.category || '';
        var linkedId = cat.indexOf('-') !== -1 && cat.slice(8);

        var hashesById = {};

        var getTicketData = function (id) {
            var t = hashesById[id];
            if (!Array.isArray(t) || !t.length) { return; }
            var ed = Util.find(t[0], ['content', 'msg', 'content', 'sender', 'edPublic']);
            // If one of their ticket was sent as a premium user, mark them as premium
            var premium = t.some(function (msg) {
                var _ed = Util.find(msg, ['content', 'msg', 'content', 'sender', 'edPublic']);
                if (ed !== _ed) { return; }
                return Util.find(msg, ['content', 'msg', 'content', 'sender', 'plan']) ||
                       Util.find(msg, ['content', 'msg', 'content', 'sender', 'quota', 'plan']);
            });
            var lastMsg = t[t.length - 1];
            var lastMsgEd = Util.find(lastMsg, ['content', 'msg', 'content', 'sender', 'edPublic']);
            return {
                lastMsg: lastMsg,
                time: Util.find(lastMsg, ['content', 'msg', 'content', 'time']),
                lastMsgEd: lastMsgEd,
                lastAdmin: lastMsgEd !== ed && ApiConfig.adminKeys.indexOf(lastMsgEd) !== -1,
                premium: premium,
                authorEd: ed,
                closed: Util.find(lastMsg, ['content', 'msg', 'type']) === 'CLOSE'
            };
        };

        var addClickHandler = function ($ticket) {
            $ticket.on('click', function () {
                $ticket.toggleClass('cp-support-open', true);
                $ticket.off('click');
            });
        };
        var makeOpenButton = function ($ticket) {
            var button = h('button.btn.btn-primary.cp-support-expand', Messages.admin_support_open);
            var collapse = h('button.btn.cp-support-collapse', Messages.admin_support_collapse);
            $(button).click(function () {
                $ticket.toggleClass('cp-support-open', true);
            });
            addClickHandler($ticket);
            $(collapse).click(function (e) {
                $ticket.toggleClass('cp-support-open', false);
                e.stopPropagation();
                setTimeout(function () {
                    addClickHandler($ticket);
                });
            });
            $ticket.find('.cp-support-title-buttons').prepend([button, collapse]);
            $ticket.append(h('div.cp-support-collapsed'));
        };
        var updateTicketDetails = function ($ticket, isPremium) {
            var $first = $ticket.find('.cp-support-message-from').first();
            var user = $first.find('span').first().html();
            var time = $first.find('.cp-support-message-time').text();
            var last = $ticket.find('.cp-support-message-from').last().find('.cp-support-message-time').text();
            var $c = $ticket.find('.cp-support-collapsed');
            var txtClass = isPremium ? ".cp-support-ispremium" : "";
            $c.html('').append([
                UI.setHTML(h('span'+ txtClass), user),
                h('span', [
                    h('b', Messages.admin_support_first),
                    h('span', time)
                ]),
                h('span', [
                    h('b', Messages.admin_support_last),
                    h('span', last)
                ])
            ]);

        };

        var sort = function (id1, id2) {
            var t1 = getTicketData(id1);
            var t2 = getTicketData(id2);
            if (!t1) { return 1; }
            if (!t2) { return -1; }
            /*
            // If one is answered and not the other, put the unanswered first
            if (t1.lastAdmin && !t2.lastAdmin) { return 1; }
            if (!t1.lastAdmin && t2.lastAdmin) { return -1; }
            */
            // Otherwise, sort them by time
            return t1.time - t2.time;
        };

        var _reorder = function () {
            var orderAnswered = [];
            var orderPremium = [];
            var orderNormal = [];
            var orderClosed = [];

            Object.keys(hashesById).forEach(function (id) {
                var d = getTicketData(id);
                if (!d) { return; }
                if (d.closed) {
                    return void orderClosed.push(id);
                }
                if (d.lastAdmin /* && !d.closed */) {
                    return void orderAnswered.push(id);
                }
                if (d.premium /* && !d.lastAdmin && !d.closed */) {
                    return void orderPremium.push(id);
                }
                orderNormal.push(id);
                //if (!d.premium && !d.lastAdmin && !d.closed) { return void orderNormal.push(id); }
            });

            var cols = [$col1, $col2, $col3, $col4];
            [orderPremium, orderNormal, orderAnswered, orderClosed].forEach(function (list, j) {
                list.sort(sort);
                list.forEach(function (id, i) {
                    var $t = $div.find('[data-id="'+id+'"]');
                    var d = getTicketData(id);
                    $t.css('order', i).appendTo(cols[j]);
                    updateTicketDetails($t, d.premium);
                });
                var len;
                try {
                    len = cols[j].find('div.cp-support-list-ticket').length;
                } catch (err) {
                    UI.warn(Messages.error);
                    return void console.error(err);
                }
                if (!len) {
                    cols[j].hide();
                } else {
                    cols[j].show();
                    cols[j].find('.cp-support-count').text(len);
                }
            });
        };
        var reorder = Util.throttle(_reorder, 150);

        var to = Util.throttle(function () {
            var $ticket = $div.find('.cp-support-list-ticket[data-id="'+linkedId+'"]');
            $ticket.addClass('cp-support-open');
            $ticket[0].scrollIntoView();
            linkedId = undefined;
        }, 200);

        // Register to the "support" mailbox
        common.mailbox.subscribe(['supportadmin'], {
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
                    reorder();
                    return;
                }
                if (msg.type !== 'TICKET') { return; }
                $ticket.removeClass('cp-support-list-closed');

                if (!$ticket.length) {
                    $ticket = APP.support.makeTicket($div, content, function (hideButton) {
                        // the ticket will still be displayed until the worker confirms its deletion
                        // so make it unclickable in the meantime
                        hideButton.setAttribute('disabled', true);
                        var error = false;
                        nThen(function (w) {
                            hashesById[id].forEach(function (d) {
                                common.mailbox.dismiss(d, w(function (err) {
                                    if (err) {
                                        error = true;
                                        console.error(err);
                                    }
                                }));
                            });
                        }).nThen(function () {
                            if (!error) {
                                $ticket.remove();
                                delete hashesById[id];
                                reorder();
                                return;
                            }
                            // if deletion failed then reactivate the button and warn
                            hideButton.removeAttribute('disabled');
                            // and show a generic error message
                            UI.alert(Messages.error);
                        });
                    });
                    makeOpenButton($ticket);
                    if (category !== 'all' && $ticket.attr('data-cat') !== category) {
                        $ticket.hide();
                    }
                }
                $ticket.append(APP.support.makeMessage(content, hash));
                reorder();

                if (linkedId) { to(); }
            }
        });
        return $container;
    };

    create['support-priv'] = function () {
        if (!supportKey || !APP.privateKey || !checkAdminKey(APP.privateKey)) { return; }

        var $div = makeBlock('support-priv', true); // Msg.admin_supportPrivHint, .admin_supportPrivTitle, .admin_supportPrivButton
        var $button = $div.find('button').click(function () {
            $button.remove();
            var $selectable = $(UI.dialog.selectable(APP.privateKey)).css({ 'max-width': '28em' });
            $div.append($selectable);
        });
        return $div;
    };
    create['support-init'] = function () {
        var $div = makeBlock('support-init'); // Msg.admin_supportInitHint, .admin_supportInitTitle
        if (!supportKey) {
            (function () {
                $div.append(h('p', Messages.admin_supportInitHelp));
                var button = h('button.btn.btn-primary', Messages.admin_supportInitGenerate);
                var $button = $(button).appendTo($div);
                $div.append($button);
                var spinner = UI.makeSpinner($div);
                $button.click(function () {
                    spinner.spin();
                    $button.attr('disabled', 'disabled');
                    var keyPair = Nacl.box.keyPair();
                    var pub = Nacl.util.encodeBase64(keyPair.publicKey);
                    var priv = Nacl.util.encodeBase64(keyPair.secretKey);
                    // Store the private key first. It won't be used until the decree is accepted.
                    sFrameChan.query("Q_ADMIN_MAILBOX", priv, function (err, obj) {
                        if (err || (obj && obj.error)) {
                            console.error(err || obj.error);
                            UI.warn(Messages.error);
                            spinner.hide();
                            return;
                        }
                        // Then send the decree
                        sFrameChan.query('Q_ADMIN_RPC', {
                            cmd: 'ADMIN_DECREE',
                            data: ['SET_SUPPORT_MAILBOX', [pub]]
                        }, function (e, response) {
                            $button.removeAttr('disabled');
                            if (e || response.error) {
                                UI.warn(Messages.error);
                                console.error(e, response);
                                spinner.hide();
                                return;
                            }
                            spinner.done();
                            UI.log(Messages.saved);
                            supportKey = pub;
                            APP.privateKey = priv;
                            $('.cp-admin-support-init').hide();
                            APP.$rightside.append(create['support-list']());
                            APP.$rightside.append(create['support-priv']());
                        });
                    });
                });
            })();
            return $div;
        }
        if (!APP.privateKey || !checkAdminKey(APP.privateKey)) {
            $div.append(h('p', Messages.admin_supportInitPrivate));

            var error = h('div.cp-admin-support-error');
            var input = h('input.cp-admin-add-private-key');
            var button = h('button.btn.btn-primary', Messages.admin_supportAddKey);

            if (APP.privateKey && !checkAdminKey(APP.privateKey)) {
                $(error).text(Messages.admin_supportAddError);
            }

            $div.append(h('div', [
                error,
                input,
                button
            ]));

            $(button).click(function () {
                var key = $(input).val();
                if (!checkAdminKey(key)) {
                    $(input).val('');
                    return void $(error).text(Messages.admin_supportAddError);
                }
                sFrameChan.query("Q_ADMIN_MAILBOX", key, function () {
                    APP.privateKey = key;
                    $('.cp-admin-support-init').hide();
                    APP.$rightside.append(create['support-list']());
                    APP.$rightside.append(create['support-priv']());
                });
            });
            return $div;
        }
        return;
    };

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

    // Update the lastBroadcastHash in /api/broadcast if we can do it.
    // To do so, find the last "BROADCAST_CUSTOM" in the current history and use the previous
    // message's hash.
    // If the last BROADCAST_CUSTOM has been deleted by an admin, we can use the most recent
    // message's hash.
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

    create['broadcast'] = function () {
        var key = 'broadcast';
        var $div = makeBlock(key); // Msg.admin_broadcastHint, admin_broadcastTitle

        var form = h('div.cp-admin-broadcast-form');
        var $form = $(form).appendTo($div);

        var refresh = getApi(function (Broadcast) {
            var button = h('button.btn.btn-primary', Messages.admin_broadcastButton);
            var $button = $(button);
            var removeButton = h('button.btn.btn-danger', Messages.admin_broadcastCancel);
            var active = h('div.cp-broadcast-active', h('p', Messages.admin_broadcastActive));
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
                    var table = h('table.cp-broadcast-delete');
                    var $table = $(table);
                    var uid = Util.find(data, ['content', 'msg', 'uid']);
                    var time = Util.find(data, ['content', 'msg', 'content', 'time']);
                    var tr = h('tr', { 'data-uid': uid }, [
                        h('td', 'ID: '+uid),
                        h('td', new Date(time || 0).toLocaleString()),
                        h('td', el),
                        h('td.delete', removeButton),
                    ]);
                    $table.append(tr);
                    $active.append(table);
                    activeUid = uid;

                    return true;
                });
                if (!activeUid) { $active.hide(); }
            });

            // Custom message
            var container = h('div.cp-broadcast-container');
            var $container = $(container);
            var languages = Messages._languages;
            var keys = Object.keys(languages).sort();

            // Always keep the textarea ordered by language code
            var reorder = function () {
                $container.find('.cp-broadcast-lang').each(function (i, el) {
                    var $el = $(el);
                    var l = $el.attr('data-lang');
                    $el.css('order', keys.indexOf(l));
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
                var preview = h('button.btn.btn-secondary', Messages.broadcast_preview);
                $(preview).click(function () {
                    onPreview(l);
                });
                var bcastDefault = Messages.broadcast_defaultLanguage;
                var first = !$container.find('.cp-broadcast-lang').length;
                var radio = UI.createRadio('broadcastDefault', null, bcastDefault, first, {
                    'data-lang': l,
                    label: {class: 'noTitle'}
                });

                var label = h('label', { for: 'kanban-body' }, Messages.kanban_body);
                var textarea = h('textarea', { id: 'kanban-body' });

                $container.append(h('div.cp-broadcast-lang', { 'data-lang': l }, [
                    h('h4', languages[l]),
                    label,
                    textarea,
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
                h('label', Messages.broadcast_translations),
                h('div.cp-broadcast-languages', boxes),
                container,
                h('div.cp-broadcast-form-submit', [
                    h('br'),
                    button
                ])
            ]);
        });
        refresh();

        return $div;
    };

    create['maintenance'] = function () {
        var key = 'maintenance';
        var $div = makeBlock(key); // Msg.admin_maintenanceHint, admin_maintenanceTitle

        var form = h('div.cp-admin-broadcast-form');
        var $form = $(form).appendTo($div);

        var refresh = getApi(function (Broadcast) {
            var button = h('button.btn.btn-primary', Messages.admin_maintenanceButton);
            var $button = $(button);
            var removeButton = h('button.btn.btn-danger', Messages.admin_maintenanceCancel);
            var active;

            if (Broadcast && Broadcast.maintenance) {
                var m = Broadcast.maintenance;
                if (m.start && m.end && m.end >= (+new Date())) {
                    active = h('div.cp-broadcast-active', [
                        UI.setHTML(h('p'), Messages._getKey('broadcast_maintenance', [
                            new Date(m.start).toLocaleString(),
                            new Date(m.end).toLocaleString(),
                        ])),
                        removeButton
                    ]);
                }
            }

            // Start and end date pickers
            var start = h('input#cp-admin-start-input');
            var end = h('input#cp-admin-end-input');
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
                $button.prop('disabled', 'disabled');
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['SET_MAINTENANCE', [data]]
                }, function (e, response) {
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
            $button.click(function () {
                var data = getData();
                if (data === false) { return void UI.warn(Messages.error); }
                send(data);
            });
            UI.confirmButton(removeButton, {
                classes: 'btn-danger',
            }, function () {
                send("");
            });

            $form.empty().append([
                active,
                h('label', { for: 'cp-admin-start-input' }, Messages.broadcast_start),
                start,
                h('label', { for: 'cp-admin-end-input' }, Messages.broadcast_end),
                end,
                h('br'),
                h('div.cp-broadcast-form-submit', [
                    button
                ])
            ]);
        });
        refresh();

        common.makeUniversal('broadcast', {
            onEvent: function (obj) {
                var cmd = obj.ev;
                if (cmd !== "MAINTENANCE") { return; }
                refresh();
            }
        });

        return $div;
    };
    create['survey'] = function () {
        var key = 'survey';
        var $div = makeBlock(key); // Msg.admin_surveyHint, admin_surveyTitle

        var form = h('div.cp-admin-broadcast-form');
        var $form = $(form).appendTo($div);

        var refresh = getApi(function (Broadcast) {
            var button = h('button.btn.btn-primary', Messages.admin_surveyButton);
            var $button = $(button);
            var removeButton = h('button.btn.btn-danger', Messages.admin_surveyCancel);
            var active;

            if (Broadcast && Broadcast.surveyURL) {
                var a = h('a', {href: Broadcast.surveyURL}, Messages.admin_surveyActive);
                $(a).click(function (e) {
                    e.preventDefault();
                    common.openUnsafeURL(Broadcast.surveyURL);
                });
                active = h('div.cp-broadcast-active', [
                    h('p', a),
                    removeButton
                ]);
            }

            // Survey form
            var label = h('label', { for: 'cp-admin-survey-url-input' }, Messages.broadcast_surveyURL);
            var input = h('input#cp-admin-survey-url-input');
            var $input = $(input);

            // Extract form data
            var getData = function () {
                var url = $input.val();
                if (!Util.isValidURL(url)) {
                    console.error('Invalid URL', url);
                    return false;
                }
                return url;
            };

            var send = function (data) {
                $button.prop('disabled', 'disabled');
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['SET_SURVEY_URL', [data]]
                }, function (e, response) {
                    if (e || response.error) {
                        $button.prop('disabled', '');
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
            $button.click(function () {
                var data = getData();
                if (data === false) { return void UI.warn(Messages.error); }
                send(data);
            });
            UI.confirmButton(removeButton, {
                classes: 'btn-danger',
            }, function () {
                send("");
            });

            $form.empty().append([
                active,
                label,
                input,
                h('br'),
                h('div.cp-broadcast-form-submit', [
                    button
                ])
            ]);
        });
        refresh();

        common.makeUniversal('broadcast', {
            onEvent: function (obj) {
                var cmd = obj.ev;
                if (cmd !== "SURVEY") { return; }
                refresh();
            }
        });

        return $div;
    };

    var onRefreshPerformance = Util.mkEvent();

    create['refresh-performance'] = function () {
        var key = 'refresh-performance';
        var btn = h('button.btn.btn-primary', Messages.oo_refresh);
        var div = h('div.cp-admin-' + key + '.cp-sidebarlayout-element', btn);
        $(btn).click(function () {
            onRefreshPerformance.fire();
        });
        return $(div);
    };

    create['performance-profiling'] = function () {
        var $div = makeBlock('performance-profiling'); // Msg.admin_performanceProfilingHint, .admin_performanceProfilingTitle

        var onRefresh = function () {
            var createBody = function () {
                 return h('div#profiling-chart.cp-charts.cp-bar-table', [
                    h('span.cp-charts-row.heading', [
                        h('span', Messages.admin_performanceKeyHeading),
                        h('span', Messages.admin_performanceTimeHeading),
                        h('span', Messages.admin_performancePercentHeading),
                        //h('span', ''), //Messages.admin_performancePercentHeading),
                    ]),
                ]);
            };

            var body = createBody();
            var appendRow = function (key, time, percent, scaled) {
                //console.log("[%s] %ss running time (%s%)", key, time, percent);
                body.appendChild(h('span.cp-charts-row', [
                    h('span', key),
                    h('span', time),
                    //h('span', percent),
                    h('span.cp-bar-container', [
                        h('span.cp-bar.profiling-percentage', {
                            style: 'width: ' + scaled + '%',
                        }, ' ' ),
                        h('span.profiling-label', percent + '%'),
                    ]),
                ]));
            };
            var process = function (_o) {
                $('#profiling-chart').remove();
                body = createBody();
                var o = _o[0];
                var sorted = Object.keys(o).sort(function (a, b) {
                  if (o[b] - o[a] <= 0) { return -1; }
                  return 1;
                });

                var values = sorted.map(function (k) { return o[k]; });
                var total = 0;
                values.forEach(function (value) { total += value; });
                var max = Math.max.apply(null, values);

                sorted.forEach(function (k) {
                    var percent = Math.floor((o[k] / total) * 1000) / 10;
                    appendRow(k, o[k], percent, (o[k] / max) * 100);
                });
                $div.append(h('div.width-constrained', body));
            };

            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'GET_WORKER_PROFILES',
            }, function (e, data) {
                if (e || data.error) {
                    UI.warn(Messages.error);
                    return void console.error(e, data);
                }
                process(data);
            });
        };

        onRefresh();
        onRefreshPerformance.reg(onRefresh);

        return $div;
    };

    create['enable-disk-measurements'] = makeAdminCheckbox({ // Msg.admin_enableDiskMeasurementsTitle.admin_enableDiskMeasurementsHint
        hintElement: UIElements.setHTML(h('span'), Messages.admin_enableDiskMeasurementsHint),
        key: 'enable-disk-measurements',
        getState: function () {
            return APP.instanceStatus.enableProfiling;
        },
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
        },
    });

    var isPositiveInteger = function (n) {
        return n && typeof(n) === 'number'  && n % 1 === 0 && n > 0;
    };

    create['bytes-written'] = function () {
        var key = 'bytes-written';
        var $div = makeBlock(key); // Msg.admin_bytesWrittenTitle.admin_bytesWrittenHint

        var duration = APP.instanceStatus.profilingWindow;
        if (!isPositiveInteger(duration)) { duration = 10000; }
        var newDuration = h('input#cp-admin-duration-input', { type: 'number', min: 0, value: duration });
        var set = h('button.btn.btn-primary', Messages.admin_setDuration);

        var label = h('label', { for: 'cp-admin-duration-input' }, Messages.ui_ms);

        $div.append(h('div', [
            h('div.cp-admin-setlimit-form', [
                label,
                newDuration,
                h('nav', [set])
            ])
        ]));


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
                $div.find('.cp-admin-bytes-written-duration').text(Messages._getKey('admin_bytesWrittenDuration', [d]));
            });
        });

        return $div;
    };

    create['update-available'] = function () { // Messages.admin_updateAvailableTitle.admin_updateAvailableHint.admin_updateAvailableLabel.admin_updateAvailableButton
        if (!APP.instanceStatus.updateAvailable) { return; }
        var $div = makeBlock('update-available', true);

        var updateURL = 'https://github.com/cryptpad/cryptpad/releases/latest';
        if (typeof(APP.instanceStatus.updateAvailable) === 'string') {
            updateURL = APP.instanceStatus.updateAvailable;
        }

        $div.find('button').click(function () {
            common.openURL(updateURL);
        });

        return $div;
    };

    create['checkup'] = function () {
        var $div = makeBlock('checkup', true); // Messages.admin_checkupButton.admin_checkupHint.admin_checkupTitle
        $div.find('button').click(function () {
            common.openURL('/checkup/');
        });
        return $div;
    };

    create['consent-to-contact'] = makeAdminCheckbox({ // Messages.admin_consentToContactTitle.admin_consentToContactHint.admin_consentToContactLabel
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
        },
    });

    create['list-my-instance'] = makeAdminCheckbox({ // Messages.admin_listMyInstanceTitle.admin_listMyInstanceHint.admin_listMyInstanceLabel
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
        },
    });

    create['provide-aggregate-statistics'] = makeAdminCheckbox({ // Messages.admin_provideAggregateStatisticsTitle.admin_provideAggregateStatisticsHint.admin_provideAggregateStatisticsLabel
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
        },
    });

    create['remove-donate-button'] = makeAdminCheckbox({ // Messages.admin_removeDonateButtonTitle.admin_removeDonateButtonHint.admin_removeDonateButtonLabel
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
        },
    });

    create['block-daily-check'] = makeAdminCheckbox({ // Messages.admin_blockDailyCheckTitle.admin_blockDailyCheckHint.admin_blockDailyCheckLabel
        key: 'block-daily-check',
        getState: function () {
            return APP.instanceStatus.blockDailyCheck;
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
        },
    });

    var sendDecree = function (data, cb) {
        sFrameChan.query('Q_ADMIN_RPC', {
            cmd: 'ADMIN_DECREE',
            data: data,
        }, cb);
    };

    create['instance-purpose'] = function () {
        var key = 'instance-purpose';
        var $div = makeBlock(key); // Messages.admin_instancePurposeTitle.admin_instancePurposeHint

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

        var opts = h('div.cp-admin-radio-container', [
            values.map(function (key) {
                var full_key = 'admin_purpose_' + key;
                return UI.createRadio('cp-instance-purpose-radio', 'cp-instance-purpose-radio-'+key,
                    Messages[full_key] || Messages._getKey(full_key, [defaultPurpose]),
                    key === purpose, {
                        input: { value: key },
                        label: { class: 'noTitle' }
                    });
            })
        ]);

        var $opts = $(opts);
        //var $br = $(h('br',));
        //$div.append($br);

        $div.append(opts);

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

    var SIDEBAR_ICONS = {
        general: 'fa fa-user-o',
        stats: 'fa fa-line-chart',
        users: 'fa fa-address-card-o',
        quota: 'fa fa-hdd-o',
        support: 'fa fa-life-ring',
        broadcast: 'fa fa-bullhorn',
        performance: 'fa fa-heartbeat',
        network: 'fa fa-sitemap', // or fa-university ?
        database: 'fa fa-database',
    };

    var createLeftside = function () {
        var $categories = $('<div>', {'class': 'cp-sidebarlayout-categories'})
                            .appendTo(APP.$leftside);
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        var active = privateData.category || 'general';
        if (active.indexOf('-') !== -1) {
            active = active.split('-')[0];
        }
        if (!categories[active]) { active = 'general'; }
        common.setHash(active);
        Object.keys(categories).forEach(function (key) {
            var iconClass = SIDEBAR_ICONS[key];
            var icon;
            if (iconClass) {
                icon = h('span', { class: iconClass });
            }
            var $category = $(h('div', {
                'tabindex': 0,
                'class': 'cp-sidebarlayout-category'
            }, [
                icon,
                Messages['admin_cat_'+key] || key,
            ])).appendTo($categories);
            if (key === active) {
                $category.addClass('cp-leftside-active');
            }

            $category.on('click keypress', function (event) {
                if (event.type === 'click' || (event.type === 'keypress' && event.which === 13)) {
                    if (!Array.isArray(categories[key]) && categories[key].onClick) {
                        categories[key].onClick();
                        return;
                    }
                    active = key;
                    common.setHash(key);
                    $categories.find('.cp-leftside-active').removeClass('cp-leftside-active');
                    $category.addClass('cp-leftside-active');
                    showCategories(categories[key]);
                }
            });

        });
        showCategories(categories[active]);
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
    }).nThen(function (waitFor) {
        if (!common.isAdmin()) { return; }
        updateStatus(waitFor());
    }).nThen(function (/*waitFor*/) {
        createToolbar();
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        common.setTabTitle(Messages.adminPage || 'Administration');

        if (!common.isAdmin()) {
            return void UI.errorLoadingScreen(Messages.admin_authError || '403 Forbidden');
        }

        APP.privateKey = privateData.supportPrivateKey;
        APP.origin = privateData.origin;
        APP.readOnly = privateData.readOnly;
        APP.support = Support.create(common, true);


        // Content
        var $rightside = APP.$rightside;
        var addItem = function (cssClass) {
            var item = cssClass.slice(9); // remove 'cp-settings-'
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
