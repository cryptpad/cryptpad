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
    '/customize/application_config.js',
    '/api/config',

    '/bower_components/file-saver/FileSaver.min.js',
    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'less!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less2/main.less',
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
    AppConfig,
    ApiConfig
    )
{
    var saveAs = window.saveAs;
    var APP = window.APP = {};

    var common;
    var metadataMgr;
    var privateData;
    var sframeChan;

    var categories = {
        'account': [
            'cp-settings-info-block',
            'cp-settings-displayname',
            'cp-settings-language-selector',
            'cp-settings-logout-everywhere',
            'cp-settings-resettips',
            'cp-settings-thumbnails',
            'cp-settings-userfeedback',
            'cp-settings-delete'
        ],
        'creation': [
            'cp-settings-creation-owned',
            'cp-settings-creation-expire',
            'cp-settings-creation-skip',
            'cp-settings-creation-template'
        ],
        'drive': [
            'cp-settings-drive-backup',
            'cp-settings-drive-import-local',
            'cp-settings-drive-reset'
        ],
        'pad': [
            'cp-settings-pad-width',
        ],
        'code': [
            'cp-settings-code-indent-unit',
            'cp-settings-code-indent-type'
        ],
        'subscription': {
            onClick: function () {
                var urls = common.getMetadataMgr().getPrivateData().accounts;
                window.open(urls.upgradeURL);
            }
        }
    };

    if (!AppConfig.displayCreationScreen) {
        delete categories.creation;
    }
    if (AppConfig.disableFeedback) {
        var feedbackIdx = categories.account.indexOf('cp-settings-userfeedback');
        categories.account.splice(feedbackIdx, 1);
    }
    if (AppConfig.disableProfile) {
        var displaynameIdx = categories.account.indexOf('cp-settings-displayname');
        categories.account.splice(displaynameIdx, 1);
    }
    if (!ApiConfig.allowSubscriptions) {
        delete categories.subscription;
    }

    var create = {};

    // Account settings

    create['info-block'] = function () {
        var $div = $('<div>', {'class': 'cp-settings-info-block'});

        var $account = $('<div>', {'class': 'cp-sidebarlayout-element'}).appendTo($div);
        var accountName = privateData.accountName;
        var $label = $('<span>', {'class': 'label'}).text(Messages.user_accountName);
        var $name = $('<span>').text(accountName || '');
        if (!accountName) {
            $label.text('');
            $name.text(Messages.settings_anonymous);
        }
        $account.append($label).append($name);

        var publicKey = privateData.edPublic;
        if (publicKey) {
            var $key = $('<div>', {'class': 'cp-sidebarlayout-element'}).appendTo($div);
            var userHref = Hash.getUserHrefFromKeys(privateData.origin, accountName, publicKey);
            var $pubLabel = $('<span>', {'class': 'label'})
                .text(Messages.settings_publicSigningKey);
            $key.append($pubLabel).append(UI.dialog.selectable(userHref));
        }

        return $div;
    };

    // Create the block containing the display name field
    create['displayname'] = function () {
        var $div = $('<div>', {'class': 'cp-settings-displayname cp-sidebarlayout-element'});
        $('<label>', {'for' : 'cp-settings-displayname'}).text(Messages.user_displayName).appendTo($div);
        var $inputBlock = $('<div>', {'class': 'cp-sidebarlayout-input-block'}).appendTo($div);
        var $input = $('<input>', {
            'type': 'text',
            'id': 'cp-settings-displayname',
            'placeholder': Messages.anonymous}).appendTo($inputBlock);
        var $save = $('<button>', {'class': 'btn btn-primary'}).text(Messages.settings_save).appendTo($inputBlock);
        var $ok = $('<span>', {'class': 'fa fa-check', title: Messages.saved}).hide().appendTo($div);
        var $spinner = $('<span>', {'class': 'fa fa-spinner fa-pulse'}).hide().appendTo($div);

        var displayName = metadataMgr.getUserData().name || '';
        $input.val(displayName);

        // When the display name is changed (enter or button clicked)
        var todo = function () {
            displayName = $input.val();
            if (displayName === metadataMgr.getUserData().name) { return; }
            $spinner.show();
            common.setDisplayName(displayName, function () {
                $spinner.hide();
                $ok.show();
            });
        };
        $input.on('keyup', function (e) {
            if ($input.val() !== displayName) { $ok.hide(); }
            if (e.which === 13) { todo(); }
        });
        $save.click(todo);

        // On remote change
        var onChange = function () {
            if (metadataMgr.getUserData().name !== $input.val()) {
                $input.val(metadataMgr.getUserData().name);
                $input.focusout();
            }
        };
        metadataMgr.onChange(onChange);

        return $div;
    };

    create['language-selector'] = function () {
        var $div = $('<div>', {'class': 'cp-settings-language-selector cp-sidebarlayout-element'});
        $('<label>').text(Messages.language).appendTo($div);
        var $b = common.createLanguageSelector($div);
        $b.find('button').addClass('btn btn-secondary');
        return $div;
    };

    create['logout-everywhere'] = function () {
        if (!common.isLoggedIn()) { return; }
        var $div = $('<div>', { 'class': 'cp-settings-logout-everywhere cp-sidebarlayout-element'});
        $('<label>').text(Messages.settings_logoutEverywhereTitle).appendTo($div);
        $('<span>', {'class': 'cp-sidebarlayout-description'})
            .text(Messages.settings_logoutEverywhere).appendTo($div);
        var $button = $('<button>', {
            id: 'cp-settings-logout-everywhere',
            'class': 'btn btn-primary'
        }).text(Messages.settings_logoutEverywhereButton)
            .appendTo($div);
        var $ok = $('<span>', {'class': 'fa fa-check', title: Messages.saved}).hide().appendTo($div);
        var $spinner = $('<span>', {'class': 'fa fa-spinner fa-pulse'}).hide().appendTo($div);

        $button.click(function () {

            UI.confirm(Messages.settings_logoutEverywhereConfirm, function (yes) {
                if (!yes) { return; }
                $spinner.show();
                $ok.hide();

                sframeChan.query('Q_SETTINGS_LOGOUT', null, function () {
                    $spinner.hide();
                    $ok.show();
                    window.setTimeout(function () {
                        $ok.fadeOut(1500);
                    }, 2500);
                });
            });
        });
        return $div;
    };

    create['resettips'] = function () {
        var $div = $('<div>', {'class': 'cp-settings-resettips cp-sidebarlayout-element'});
        $('<label>').text(Messages.settings_resetTips).appendTo($div);
        $('<span>', {'class': 'cp-sidebarlayout-description'})
            .text(Messages.settings_resetTipsButton).appendTo($div);
        var $button = $('<button>', {'id': 'cp-settings-resettips', 'class': 'btn btn-primary'})
            .text(Messages.settings_resetTipsAction).appendTo($div);

        var localStore = window.cryptpadStore;
        $button.click(function () {
            Object.keys(localStore).forEach(function (k) {
                if(k.slice(0, 9) === "hide-info") {
                    localStore.put(k, undefined);
                }
            });
            UI.alert(Messages.settings_resetTipsDone);
        });

        return $div;
    };

    create['thumbnails'] = function () {
        var $div = $('<div>', {'class': 'cp-settings-thumbnails cp-sidebarlayout-element'});
        $('<label>').text(Messages.settings_thumbnails).appendTo($div);

        // Disable
        $('<span>', {'class': 'cp-sidebarlayout-description'})
            .text(Messages.settings_disableThumbnailsDescription).appendTo($div);
        var $label = $('<label>', { 'for': 'disableThumbnails', 'class': 'noTitle' })
            .text(Messages.settings_disableThumbnailsAction);

        var $ok = $('<span>', {'class': 'fa fa-check', title: Messages.saved});
        var $spinner = $('<span>', {'class': 'fa fa-spinner fa-pulse'});

        var $checkbox = $('<input>', {
            'type': 'checkbox',
            id: 'disableThumbnails'
        }).on('change', function () {
            $spinner.show();
            $ok.hide();
            var val = $checkbox.is(':checked') || false;
            common.setAttribute(['general', 'disableThumbnails'], val, function () {
                $spinner.hide();
                $ok.show();
            });
        });

        $checkbox.appendTo($div);
        $label.appendTo($div);

        $ok.hide().appendTo($div);
        $spinner.hide().appendTo($div);

        common.getAttribute(['general', 'disableThumbnails'], function (e, val) {
            $checkbox[0].checked = val;
        });

        // Reset
        $('<span>', {'class': 'cp-sidebarlayout-description'})
            .text(Messages.settings_resetThumbnailsDescription).appendTo($div);
        var $button = $('<button>', {'id': 'resetThumbnails', 'class': 'btn btn-primary'})
            .text(Messages.settings_resetThumbnailsAction).appendTo($div);

        $button.click(function () {
            sframeChan.query("Q_THUMBNAIL_CLEAR", null, function (err) {
                if (err) { return void console.error("Cannot clear localForage"); }
                UI.alert(Messages.settings_resetThumbnailsDone);
            });
        });

        return $div;
    };

    create['userfeedback'] = function () {
        var $div = $('<div>', { 'class': 'cp-settings-userfeedback cp-sidebarlayout-element'});

        $('<span>', {'class': 'label'}).text(Messages.settings_userFeedbackTitle).appendTo($div);

        var $label = $('<label>', { 'for': 'cp-settings-userfeedback', 'class': 'noTitle' })
            .text(Messages.settings_userFeedback);

        $('<span>', {'class': 'cp-sidebarlayout-description'})
            .append(Messages.settings_userFeedbackHint1)
            .append(Messages.settings_userFeedbackHint2).appendTo($div);

        var $ok = $('<span>', {'class': 'fa fa-check', title: Messages.saved});
        var $spinner = $('<span>', {'class': 'fa fa-spinner fa-pulse'});

        var $checkbox = $('<input>', {
            'type': 'checkbox',
            id: 'cp-settings-userfeedback'
        }).on('change', function () {
            $spinner.show();
            $ok.hide();
            var val = $checkbox.is(':checked') || false;
            common.setAttribute(['general', 'allowUserFeedback'], val, function () {
                $spinner.hide();
                $ok.show();
            });
        });

        $checkbox.appendTo($div);
        $label.appendTo($div);

        $ok.hide().appendTo($div);
        $spinner.hide().appendTo($div);

        if (privateData.feedbackAllowed) {
            $checkbox[0].checked = true;
        }
        return $div;
    };

    create['delete'] = function () {
        var $div = $('<div>', { 'class': 'cp-settings-delete cp-sidebarlayout-element'});

        $('<span>', {'class': 'label'}).text(Messages.settings_deleteTitle).appendTo($div);

        $('<span>', {'class': 'cp-sidebarlayout-description'})
            .append(Messages.settings_deleteHint).appendTo($div);

        var $ok = $('<span>', {'class': 'fa fa-check', title: Messages.saved});
        var $spinner = $('<span>', {'class': 'fa fa-spinner fa-pulse'});

        var $button = $('<button>', {'id': 'cp-settings-delete', 'class': 'btn btn-danger'})
            .text(Messages.settings_deleteButton).appendTo($div);

        $button.click(function () {
            $spinner.show();
            UI.confirm(Messages.settings_deleteConfirm, function (yes) {
                sframeChan.query("Q_SETTINGS_DELETE_ACCOUNT", null, function (err, data) {
                    // Owned drive
                    if (data.state === true) {
                        sframeChan.query('Q_SETTINGS_LOGOUT', null, function () {});
                        UI.alert(Messages.settings_deleted, function () {
                            common.gotoURL('/');
                        });
                        $ok.show();
                        $spinner.hide();
                        return;
                    }
                    // Not owned drive
                    var msg = h('div.cp-app-settings-delete-alert', [
                        h('p', Messages.settings_deleteModal),
                        h('pre', JSON.stringify(data, 0, 2))
                    ]);
                    UI.alert(msg);
                    $spinner.hide();
                });
            });
            // TODO
            /*
            UI.confirm("Are you sure?", function (yes) {
                // Logout everywhere
                // Disconnect other tabs
                // Remove owned pads
                // Remove owned drive
                // Remove pinstore
                // Alert: "Account deleted", press OK to be redirected to the home page
                $spinner.hide();
            });*/
        });

        $spinner.hide().appendTo($div);
        $ok.hide().appendTo($div);

        return $div;
    };

    // Pad Creation settings

    var setHTML = function (e, html) {
        e.innerHTML = html;
        return e;
    };
    create['creation-owned'] = function () {
        if (!common.isLoggedIn()) { return; }
        var owned = h('div.cp-settings-creation-owned.cp-sidebarlayout-element', [
            h('label', [
                Messages.creation_ownedTitle
            ]),
            setHTML(h('p.cp-sidebarlayout-description'),
                    Messages.creation_owned1 + '<br>' + Messages.creation_owned2),
            h('input#cp-creation-owned-true.cp-creation-owned-value', {
                type: 'radio',
                name: 'cp-creation-owned',
                value: 1,
                checked: 'checked'
            }),
            h('label', { 'for': 'cp-creation-owned-true' }, Messages.creation_ownedTrue),
            h('input#cp-creation-owned-false.cp-creation-owned-value', {
                type: 'radio',
                name: 'cp-creation-owned',
                value: 0,
            }),
            h('label', { 'for': 'cp-creation-owned-false' }, Messages.creation_ownedFalse),
            h('span.fa.fa-check', {title: Messages.saved}),
            h('span.fa.fa-spinner.fa-pulse'),
        ]);

        var $owned = $(owned);

        var $ok = $owned.find('.fa-check').hide();
        var $spinner = $owned.find('.fa-spinner').hide();

        $owned.find('input').change(function () {
            $spinner.show();
            $ok.hide();
            var val = parseInt($owned.find('[name="cp-creation-owned"]:checked').val());
            common.setAttribute(['general', 'creation', 'owned'], val, function (e) {
                if (e) { return void console.error(e); }
                $spinner.hide();
                $ok.show();
            });
        });
        common.getAttribute(['general', 'creation', 'owned'], function (e, val) {
            if (!val && typeof val !== "undefined") {
                $owned.find('#cp-creation-owned-false').attr('checked', true);
            }
        });

        return $owned;
    };
    create['creation-expire'] = function () {
        if (!common.isLoggedIn()) { return; }
        var expire = h('div.cp-settings-creation-expire.cp-sidebarlayout-element', [
            h('label', [
                Messages.creation_expireTitle
            ]),
            setHTML(h('p.cp-sidebarlayout-description'),
                    Messages.creation_expire1 + '<br>' + Messages.creation_expire2),
            h('input#cp-creation-expire-false.cp-creation-expire-value', {
                type: 'radio',
                name: 'cp-creation-expire',
                value: 0,
                checked: 'checked'
            }),
            h('label', { 'for': 'cp-creation-expire-false' }, Messages.creation_expireFalse),
            h('input#cp-creation-expire-true.cp-creation-expire-value', {
                type: 'radio',
                name: 'cp-creation-expire',
                value: 1
            }),
            h('label', { 'for': 'cp-creation-expire-true' }, [
                Messages.creation_expireTrue,
                h('span.cp-creation-expire-picker', [
                    h('input#cp-creation-expire-val', {
                        type: "number",
                        min: 1,
                        max: 100,
                        value: 3
                    }),
                    h('select#cp-creation-expire-unit', [
                        h('option', { value: 'hour' }, Messages.creation_expireHours),
                        h('option', { value: 'day' }, Messages.creation_expireDays),
                        h('option', {
                            value: 'month',
                            selected: 'selected'
                        }, Messages.creation_expireMonths)
                    ])
                ])
            ]),
            h('span.fa.fa-check', {title: Messages.saved}),
            h('span.fa.fa-spinner.fa-pulse'),
        ]);

        var $expire = $(expire);

        var $ok = $expire.find('.fa-check').hide();
        var $spinner = $expire.find('.fa-spinner').hide();

        var getValue = function () {
            if(!parseInt($expire.find('[name="cp-creation-expire"]:checked').val())) { return 0; }
            var unit = 0;
            switch ($expire.find('#cp-creation-expire-unit').val()) {
                case "hour" : unit = 3600;           break;
                case "day"  : unit = 3600 * 24;      break;
                case "month": unit = 3600 * 24 * 30; break;
                default: unit = 0;
            }
            return ($expire.find('#cp-creation-expire-val').val() || 0) * unit;
        };
        $expire.find('input, select').change(function () {
            $spinner.show();
            $ok.hide();
            common.setAttribute(['general', 'creation', 'expire'], getValue(), function (e) {
                if (e) { return void console.error(e); }
                $spinner.hide();
                $ok.show();
            });
        });
        common.getAttribute(['general', 'creation', 'expire'], function (e, val) {
            UIElements.setExpirationValue(val, $expire);
        });

        return $expire;
    };
    create['creation-skip'] = function () {
        if (!common.isLoggedIn()) { return; }
        var skip = h('div.cp-settings-creation-skip.cp-sidebarlayout-element', [
            h('label', [
                Messages.settings_creationSkip
            ]),
            setHTML(h('p.cp-sidebarlayout-description'), Messages.settings_creationSkipHint),
            h('input#cp-creation-skip-true.cp-creation-skip-value', {
                type: 'radio',
                name: 'cp-creation-skip',
                value: 1,
            }),
            h('label', { 'for': 'cp-creation-skip-true' }, Messages.settings_creationSkipTrue),
            h('input#cp-creation-skip-false.cp-creation-skip-value', {
                type: 'radio',
                name: 'cp-creation-skip',
                value: 0,
                checked: 'checked'
            }),
            h('label', { 'for': 'cp-creation-skip-false' }, Messages.settings_creationSkipFalse),
            h('span.fa.fa-check', {title: Messages.saved}),
            h('span.fa.fa-spinner.fa-pulse'),
        ]);

        var $div = $(skip);

        var $ok = $div.find('.fa-check').hide();
        var $spinner = $div.find('.fa-spinner').hide();

        $div.find('input').change(function () {
            $spinner.show();
            $ok.hide();
            var val = parseInt($div.find('[name="cp-creation-skip"]:checked').val());
            // If we don't skip the pad creation screen, we dont' need settings to hide the templates
            // modal
            if (!val) {
                $('.cp-settings-creation-template').addClass('cp-settings-creation-skipped');
            } else {
                $('.cp-settings-creation-template').removeClass('cp-settings-creation-skipped');
            }
            common.setAttribute(['general', 'creation', 'skip'], val, function (e) {
                if (e) { return void console.error(e); }
                $spinner.hide();
                $ok.show();
            });
        });
        common.getAttribute(['general', 'creation', 'skip'], function (e, val) {
            if (val) {
                $div.find('#cp-creation-skip-true').attr('checked', true);
                return;
            }
            // If we don't skip the pad creation screen, we dont' need settings to hide the templates
            // modal
            $('.cp-settings-creation-template').addClass('cp-settings-creation-skipped');
        });

        return $div;
    };
    create['creation-template'] = function () {
        var skip = h('div.cp-settings-creation-template.cp-sidebarlayout-element', [
            h('label', [
                Messages.settings_templateSkip
            ]),
            setHTML(h('p.cp-sidebarlayout-description'), Messages.settings_templateSkipHint),
            h('input#cp-creation-template-true.cp-creation-template-value', {
                type: 'radio',
                name: 'cp-creation-template',
                value: 1,
            }),
            h('label', { 'for': 'cp-creation-template-true' }, Messages.settings_creationSkipTrue),
            h('input#cp-creation-template-false.cp-creation-template-value', {
                type: 'radio',
                name: 'cp-creation-template',
                value: 0,
                checked: 'checked'
            }),
            h('label', { 'for': 'cp-creation-template-false' }, Messages.settings_creationSkipFalse),
            h('span.fa.fa-check', {title: Messages.saved}),
            h('span.fa.fa-spinner.fa-pulse'),
        ]);

        var $div = $(skip);

        var $ok = $div.find('.fa-check').hide();
        var $spinner = $div.find('.fa-spinner').hide();

        $div.find('input').change(function () {
            $spinner.show();
            $ok.hide();
            var val = parseInt($div.find('[name="cp-creation-template"]:checked').val());
            common.setAttribute(['general', 'creation', 'noTemplate'], val, function (e) {
                if (e) { return void console.error(e); }
                $spinner.hide();
                $ok.show();
            });
        });
        common.getAttribute(['general', 'creation', 'noTemplate'], function (e, val) {
            if (val) {
                $div.find('#cp-creation-template-true').attr('checked', true);
            }
        });

        return $div;
    };




    // Drive settings

    create['drive-backup'] = function () {
        var $div = $('<div>', {'class': 'cp-settings-drive-backup cp-sidebarlayout-element'});

        var accountName = privateData.accountName;
        var displayName = metadataMgr.getUserData().name || '';

        var exportFile = function () {
            sframeChan.query("Q_SETTINGS_DRIVE_GET", null, function (err, data) {
                if (err) { return void console.error(err); }
                var sjson = JSON.stringify(data);
                var name = displayName || accountName || Messages.anonymous;
                var suggestion = name + '-' + new Date().toDateString();
                UI.prompt(Messages.exportPrompt,
                    Util.fixFileName(suggestion) + '.json', function (filename) {
                    if (!(typeof(filename) === 'string' && filename)) { return; }
                    var blob = new Blob([sjson], {type: "application/json;charset=utf-8"});
                    saveAs(blob, filename);
                });
            });
        };
        var importFile = function (content) {
            var $spinner = $('<span>', {'class': 'fa fa-spinner fa-pulse'}).appendTo($div);
            try {
                var data = JSON.parse(content);
                sframeChan.query("Q_SETTINGS_DRIVE_SET", data, function (e) {
                    if (e) { console.error(e); }
                    $spinner.remove();
                });
            } catch (e) {
                console.error(e);
            }
        };

        $('<label>', {'for' : 'exportDrive'}).text(Messages.settings_backupCategory).appendTo($div);
        $('<span>', {'class': 'cp-sidebarlayout-description'})
            .text(Messages.settings_backupTitle).appendTo($div);
        /* add an export button */
        var $export = common.createButton('export', true, {}, exportFile);
        $export.attr('class', 'btn btn-success').text(Messages.settings_backup);
        $div.append($export);

        /* add an import button */
        var $import = common.createButton('import', true, {}, importFile);
        $import.attr('class', 'btn btn-success').text(Messages.settings_restore);
        $div.append($import);

        return $div;
    };

    create['drive-import-local'] = function () {
        if (!common.isLoggedIn()) { return; }
        var $div = $('<div>', {'class': 'cp-settings-drive-import-local cp-sidebarlayout-element'});
        $('<label>', {'for' : 'cp-settings-import-local-pads'})
            .text(Messages.settings_import).appendTo($div);
        $('<span>', {'class': 'cp-sidebarlayout-description'})
            .text(Messages.settings_importTitle).appendTo($div);
        var $button = $('<button>', {
            'id': 'cp-settings-import-local-pads',
            'class': 'btn btn-primary'
        }).text(Messages.settings_import).appendTo($div);
        var $ok = $('<span>', {'class': 'fa fa-check', title: Messages.saved}).hide().appendTo($div);
        var $spinner = $('<span>', {'class': 'fa fa-spinner fa-pulse'}).hide().appendTo($div);

        $button.click(function () {
            UI.confirm(Messages.settings_importConfirm, function (yes) {
                if (!yes) { return; }
                $spinner.show();
                $ok.hide();
                sframeChan.query('Q_SETTINGS_IMPORT_LOCAL', null, function () {
                    $spinner.hide();
                    $ok.show();
                    UI.alert(Messages.settings_importDone);
                });
            }, undefined, true);
        });

        return $div;
    };

    create['drive-reset'] = function () {
        var $div = $('<div>', {'class': 'cp-settings-drive-reset cp-sidebarlayout-element'});
        $('<label>').text(Messages.settings_resetNewTitle).appendTo($div);
        $('<span>', {'class': 'cp-sidebarlayout-description'})
            .text(Messages.settings_reset).appendTo($div);
        var $button = $('<button>', {'id': 'cp-settings-reset-drive', 'class': 'btn btn-danger'})
            .text(Messages.settings_resetButton).appendTo($div);

        $button.click(function () {
            UI.prompt(Messages.settings_resetPrompt, "", function (val) {
                if (val !== "I love CryptPad") {
                    UI.alert(Messages.settings_resetError);
                    return;
                }
                sframeChan.query("Q_SETTINGS_DRIVE_RESET", null, function (err) {
                    if (err) { return void console.error(err); }
                    UI.alert(Messages.settings_resetDone);
                });
            }, undefined, true);
        });

        return $div;
    };

    // Rich text pads settings

    create['pad-width'] = function () {
        var $div = $('<div>', {
            'class': 'cp-settings-pad-width cp-sidebarlayout-element'
        });
        $('<span>', {'class': 'label'}).text(Messages.settings_padWidth).appendTo($div);

        $('<span>', {'class': 'cp-sidebarlayout-description'})
            .text(Messages.settings_padWidthHint).appendTo($div);

        var $ok = $('<span>', {'class': 'fa fa-check', title: Messages.saved});
        var $spinner = $('<span>', {'class': 'fa fa-spinner fa-pulse'});

        var $label = $('<label>', { 'for': 'cp-settings-padwidth', 'class': 'noTitle' })
                    .text(Messages.settings_padWidthLabel);
        var $input = $('<input>', {
            type: 'checkbox',
            id: 'cp-settings-padwidth'
        }).on('change', function () {
            $spinner.show();
            $ok.hide();
            var val = $input.is(':checked');
            common.setAttribute(['pad', 'width'], val, function () {
                $spinner.hide();
                $ok.show();
            });
        }).appendTo($div);
        $label.appendTo($div);

        $ok.hide().appendTo($div);
        $spinner.hide().appendTo($div);


        common.getAttribute(['pad', 'width'], function (e, val) {
            if (e) { return void console.error(e); }
            if (val) {
                $input.attr('checked', 'checked');
            }
        });
        return $div;
    };

    // Code settings

    create['code-indent-unit'] = function () {
        var $div = $('<div>', {
            'class': 'cp-settings-code-indent-unit cp-sidebarlayout-element'
        });
        $('<label>').text(Messages.settings_codeIndentation).appendTo($div);

        var $inputBlock = $('<div>', {
            'class': 'cp-sidebarlayout-input-block',
        }).appendTo($div);

        var $input = $('<input>', {
            'min': 1,
            'max': 8,
            type: 'number',
        }).on('change', function () {
            var val = parseInt($input.val());
            if (typeof(val) !== 'number') { return; }
            common.setAttribute(['codemirror', 'indentUnit'], val);
        }).appendTo($inputBlock);

        common.getAttribute(['codemirror', 'indentUnit'], function (e, val) {
            if (e) { return void console.error(e); }
            if (typeof(val) !== 'number') {
                $input.val(2);
            } else {
                $input.val(val);
            }
        });
        return $div;
    };

    create['code-indent-type'] = function () {
        var key = 'indentWithTabs';

        var $div = $('<div>', {
            'class': 'cp-settings-code-indent-type cp-sidebarlayout-element'
        });
        $('<label>').text(Messages.settings_codeUseTabs).appendTo($div);

        var $inputBlock = $('<div>', {
            'class': 'cp-sidebarlayout-input-block',
        }).css('flex-flow', 'column')
        .appendTo($div);

        var $input = $('<input>', {
            type: 'checkbox',
        }).on('change', function () {
            var val = $input.is(':checked');
            if (typeof(val) !== 'boolean') { return; }
            common.setAttribute(['codemirror', key], val);
        }).appendTo($inputBlock);

        /*proxy.on('change', ['settings', 'codemirror', key], function (o, n) {
            $input[0].checked = !!n;
        });*/

        common.getAttribute(['codemirror', key], function (e, val) {
            if (e) { return void console.error(e); }
            $input[0].checked = !!val;
        });
        return $div;
    };

    // Settings app

    var createUsageButton = function () {
        common.createUsageBar(function (err, $bar) {
            if (err) { return void console.error(err); }
            APP.$usage.html('').append($bar);
        }, true);
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
        APP.$usage = $('<div>', {'class': 'usage'}).appendTo(APP.$leftside);
        var active = privateData.category || 'account';
        Object.keys(categories).forEach(function (key) {
            var $category = $('<div>', {'class': 'cp-sidebarlayout-category'}).appendTo($categories);
            if (key === 'account') { $category.append($('<span>', {'class': 'fa fa-user-o'})); }
            if (key === 'drive') { $category.append($('<span>', {'class': 'fa fa-hdd-o'})); }
            if (key === 'code') { $category.append($('<span>', {'class': 'fa fa-file-code-o' })); }
            if (key === 'pad') { $category.append($('<span>', {'class': 'fa fa-file-word-o' })); }
            if (key === 'creation') { $category.append($('<span>', {'class': 'fa fa-plus-circle' })); }
            if (key === 'subscription') { $category.append($('<span>', {'class': 'fa fa-star-o' })); }

            if (key === active) {
                $category.addClass('cp-leftside-active');
            }

            $category.click(function () {
                if (!Array.isArray(categories[key]) && categories[key].onClick) {
                    categories[key].onClick();
                    return;
                }
                active = key;
                $categories.find('.cp-leftside-active').removeClass('cp-leftside-active');
                $category.addClass('cp-leftside-active');
                showCategories(categories[key]);
            });

            $category.append(Messages['settings_cat_'+key]);
        });
        showCategories(categories[active]);
    };



    nThen(function (waitFor) {
        $(waitFor(UI.addLoadingScreen));
        SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
    }).nThen(function (waitFor) {
        APP.$container = $('#cp-sidebarlayout-container');
        APP.$toolbar = $('#cp-toolbar');
        APP.$leftside = $('<div>', {id: 'cp-sidebarlayout-leftside'}).appendTo(APP.$container);
        APP.$rightside = $('<div>', {id: 'cp-sidebarlayout-rightside'}).appendTo(APP.$container);
        sframeChan = common.getSframeChannel();
        sframeChan.onReady(waitFor());
    }).nThen(function (/*waitFor*/) {
        metadataMgr = common.getMetadataMgr();
        privateData = metadataMgr.getPrivateData();

        // Toolbar
        var displayed = ['useradmin', 'newpad', 'limit', 'pageTitle'];
        var configTb = {
            displayed: displayed,
            sfCommon: common,
            $container: APP.$toolbar,
            pageTitle: Messages.settings_title,
            metadataMgr: common.getMetadataMgr(),
        };
        APP.toolbar = Toolbar.create(configTb);
        APP.toolbar.$rightside.hide();

        // Content
        var $rightside = APP.$rightside;
        for (var f in create) {
            if (typeof create[f] !== "function") { continue; }
            $rightside.append(create[f]());
        }

        // TODO RPC
        //obj.proxy.on('change', [], refresh);
        //obj.proxy.on('remove', [], refresh);
        //Cryptpad.onDisplayNameChanged(refresh);

        createLeftside();
        createUsageButton();

        UI.removeLoadingScreen();
    });
});
