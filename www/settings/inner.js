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
    '/common/common-credential.js',
    '/customize/application_config.js',
    '/api/config',
    '/common/make-backup.js',
    '/common/common-feedback.js',

    '/common/jscolor.js',
    '/bower_components/file-saver/FileSaver.min.js',
    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/settings/app-settings.less',
], function(
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
    Cred,
    AppConfig,
    ApiConfig,
    Backup,
    Feedback
) {
    var saveAs = window.saveAs;
    var APP = window.APP = {};

    var common;
    var metadataMgr;
    var privateData;
    var sframeChan;

    var categories = {
        'account': [
            'cp-settings-own-drive',
            'cp-settings-info-block',
            'cp-settings-displayname',
            'cp-settings-language-selector',
            'cp-settings-resettips',
            'cp-settings-change-password',
            'cp-settings-delete'
        ],
        'security': [
            'cp-settings-logout-everywhere',
            'cp-settings-autostore',
            'cp-settings-safe-links',
            'cp-settings-userfeedback',
        ],
        'drive': [
            'cp-settings-drive-duplicate',
            'cp-settings-thumbnails',
            'cp-settings-drive-backup',
            'cp-settings-drive-import-local',
            'cp-settings-trim-history'
            //'cp-settings-drive-reset'
        ],
        'cursor': [
            'cp-settings-cursor-color',
            'cp-settings-cursor-share',
            'cp-settings-cursor-show',
        ],
        'pad': [
            'cp-settings-pad-width',
            'cp-settings-pad-spellcheck',
            'cp-settings-pad-notif',
        ],
        'code': [
            'cp-settings-code-indent-unit',
            'cp-settings-code-indent-type',
            'cp-settings-code-brackets',
            'cp-settings-code-font-size',
            'cp-settings-code-spellcheck',
        ],
        'subscription': {
            onClick: function() {
                var urls = common.getMetadataMgr().getPrivateData().accounts;
                window.open(urls.upgradeURL);
                Feedback.send('SUBSCRIPTION_BUTTON');
            }
        }
    };

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

    var SPECIAL_HINTS_HANDLER = {
        safeLinks: function() {
            return $('<span>', { 'class': 'cp-sidebarlayout-description' })
                .html(Messages._getKey('settings_safeLinksHint', ['<span class="fa fa-shhare-alt"></span>']));
        },
    };

    var DEFAULT_HINT_HANDLER = function(safeKey) {
        return $('<span>', { 'class': 'cp-sidebarlayout-description' })
            .text(Messages['settings_' + safeKey + 'Hint'] || 'Coming soon...');
    };

    var makeBlock = function(key, getter, full) {
        var safeKey = key.replace(/-([a-z])/g, function(g) { return g[1].toUpperCase(); });

        create[key] = function() {
            var $div = $('<div>', { 'class': 'cp-settings-' + key + ' cp-sidebarlayout-element' });
            if (full) {
                $('<label>').text(Messages['settings_' + safeKey + 'Title'] || key).appendTo($div);

                // if this block's hint needs a special renderer, then create it in SPECIAL_HINTS_HANLDER
                // otherwise the default will be used
                var hintFunction = (typeof(SPECIAL_HINTS_HANDLER[safeKey]) === 'function') ?
                    SPECIAL_HINTS_HANDLER[safeKey] :
                    DEFAULT_HINT_HANDLER;

                hintFunction(safeKey).appendTo($div);
            }
            getter(function(content) {
                if (content === false) {
                    $div.remove();
                    $div = undefined;
                    return;
                }
                $div.append(content);
            }, $div);
            return $div;
        };
    };


    // Account settings

    create['info-block'] = function() {
        var $div = $('<div>', { 'class': 'cp-settings-info-block' });

        var $account = $('<div>', { 'class': 'cp-sidebarlayout-element' }).appendTo($div);
        var accountName = privateData.accountName;
        var $label = $('<span>', { 'class': 'label' }).text(Messages.user_accountName);
        var $name = $('<span>').text(accountName || '');
        if (!accountName) {
            $label.text('');
            $name.text(Messages.settings_anonymous);
        }
        $account.append($label).append($name);

        var publicKey = privateData.edPublic;
        if (publicKey) {
            var $key = $('<div>', { 'class': 'cp-sidebarlayout-element' }).appendTo($div);
            var userHref = Hash.getUserHrefFromKeys(privateData.origin, accountName, publicKey);
            var $pubLabel = $('<span>', { 'class': 'label' })
                .text(Messages.settings_publicSigningKey);
            $key.append($pubLabel).append(UI.dialog.selectable(userHref));
        }

        return $div;
    };

    // Create the block containing the display name field
    create['displayname'] = function() {
        var $div = $('<div>', { 'class': 'cp-settings-displayname cp-sidebarlayout-element' });
        $('<label>', { 'for': 'cp-settings-displayname' }).text(Messages.user_displayName).appendTo($div);
        var $inputBlock = $('<div>', { 'class': 'cp-sidebarlayout-input-block' }).appendTo($div);
        var $input = $('<input>', {
            'type': 'text',
            'id': 'cp-settings-displayname',
            'placeholder': Messages.anonymous
        }).appendTo($inputBlock);
        var $save = $('<button>', { 'class': 'btn btn-primary' }).text(Messages.settings_save).appendTo($inputBlock);
        var $ok = $('<span>', { 'class': 'fa fa-check', title: Messages.saved }).hide().appendTo($div);
        var $spinner = $('<span>', { 'class': 'fa fa-spinner fa-pulse' }).hide().appendTo($div);

        var displayName = metadataMgr.getUserData().name || '';
        $input.val(displayName);

        // When the display name is changed (enter or button clicked)
        var todo = function() {
            displayName = $input.val();
            if (displayName === metadataMgr.getUserData().name) { return; }
            $spinner.show();
            common.setDisplayName(displayName, function() {
                $spinner.hide();
                $ok.show();
            });
        };
        $input.on('keyup', function(e) {
            if ($input.val() !== displayName) { $ok.hide(); }
            if (e.which === 13) { todo(); }
        });
        $save.click(todo);

        // On remote change
        var onChange = function() {
            if (metadataMgr.getUserData().name !== $input.val()) {
                $input.val(metadataMgr.getUserData().name);
                $input.focusout();
            }
        };
        metadataMgr.onChange(onChange);

        return $div;
    };

    create['language-selector'] = function() {
        var $div = $('<div>', { 'class': 'cp-settings-language-selector cp-sidebarlayout-element' });
        $('<label>').text(Messages.language).appendTo($div);
        var $b = common.createLanguageSelector($div);
        $b.find('button').addClass('btn btn-secondary');
        return $div;
    };

    create['logout-everywhere'] = function() {
        if (!common.isLoggedIn()) { return; }
        var $div = $('<div>', { 'class': 'cp-settings-logout-everywhere cp-sidebarlayout-element' });
        $('<label>').text(Messages.settings_logoutEverywhereTitle).appendTo($div);
        $('<span>', { 'class': 'cp-sidebarlayout-description' })
            .text(Messages.settings_logoutEverywhere).appendTo($div);
        var $button = $('<button>', {
                id: 'cp-settings-logout-everywhere',
                'class': 'btn btn-primary'
            }).text(Messages.settings_logoutEverywhereButton)
            .appendTo($div);
        var $ok = $('<span>', { 'class': 'fa fa-check', title: Messages.saved }).hide().appendTo($div);
        var $spinner = $('<span>', { 'class': 'fa fa-spinner fa-pulse' }).hide().appendTo($div);

        $button.click(function() {

            UI.confirm(Messages.settings_logoutEverywhereConfirm, function(yes) {
                if (!yes) { return; }
                $spinner.show();
                $ok.hide();

                Feedback.send('LOGOUT_EVERYWHERE');
                sframeChan.query('Q_SETTINGS_LOGOUT', null, function() {
                    $spinner.hide();
                    $ok.show();
                    window.setTimeout(function() {
                        $ok.fadeOut(1500);
                    }, 2500);
                });
            });
        });
        return $div;
    };

    create['autostore'] = function() {
        var $div = $('<div>', { 'class': 'cp-settings-autostore cp-sidebarlayout-element' });

        $('<span>', { 'class': 'label' }).text(Messages.settings_autostoreTitle).appendTo($div);

        $('<span>', { 'class': 'cp-sidebarlayout-description' })
            .append(Messages.settings_autostoreHint).appendTo($div);

        var $ok = $('<span>', { 'class': 'fa fa-check', title: Messages.saved });
        var $spinner = $('<span>', { 'class': 'fa fa-spinner fa-pulse' });

        var opt1 = UI.createRadio('cp-settings-autostore', 'cp-settings-autostore-no',
            Messages.settings_autostoreNo, false, {
                input: { value: -1 },
                label: { class: 'noTitle' }
            });
        var opt2 = UI.createRadio('cp-settings-autostore', 'cp-settings-autostore-maybe',
            Messages.settings_autostoreMaybe, true, {
                input: { value: 0 },
                label: { class: 'noTitle' }
            });
        var opt3 = UI.createRadio('cp-settings-autostore', 'cp-settings-autostore-yes',
            Messages.settings_autostoreYes, false, {
                input: { value: 1 },
                label: { class: 'noTitle' }
            });
        var $div2 = $(h('div.cp-settings-autostore-radio', [
            opt3,
            opt2,
            opt1
        ])).appendTo($div);

        $div.find('input[type="radio"]').on('change', function() {
            $spinner.show();
            $ok.hide();
            var val = $('input:radio[name="cp-settings-autostore"]:checked').val();
            val = Number(val) || 0;
            common.setAttribute(['general', 'autostore'], val, function() {
                $spinner.hide();
                $ok.show();
            });
        });

        $ok.hide().appendTo($div2);
        $spinner.hide().appendTo($div2);

        common.getAttribute(['general', 'autostore'], function(err, val) {
            if (val === 1) { return void $('#cp-settings-autostore-yes').prop('checked', true); }
            if (val === -1) { return void $('#cp-settings-autostore-no').prop('checked', true); }
            $('#cp-settings-autostore-maybe').prop('checked', true);
        });

        return $div;
    };

    create['userfeedback'] = function() {
        var $div = $('<div>', { 'class': 'cp-settings-userfeedback cp-sidebarlayout-element' });

        $('<span>', { 'class': 'label' }).text(Messages.settings_userFeedbackTitle).appendTo($div);

        $('<span>', { 'class': 'cp-sidebarlayout-description' })
            .append(Messages.settings_userFeedbackHint1)
            .append(Messages.settings_userFeedbackHint2).appendTo($div);

        var $ok = $('<span>', { 'class': 'fa fa-check', title: Messages.saved });
        var $spinner = $('<span>', { 'class': 'fa fa-spinner fa-pulse' });

        var $cbox = $(UI.createCheckbox('cp-settings-userfeedback',
            Messages.settings_userFeedback,
            false, { label: { class: 'noTitle' } }));
        var $checkbox = $cbox.find('input').on('change', function() {
            $spinner.show();
            $ok.hide();
            var val = $checkbox.is(':checked') || false;
            common.setAttribute(['general', 'allowUserFeedback'], val, function() {
                $spinner.hide();
                $ok.show();
            });
        });

        $cbox.appendTo($div);

        $ok.hide().appendTo($cbox);
        $spinner.hide().appendTo($cbox);

        if (privateData.feedbackAllowed) {
            $checkbox[0].checked = true;
        }
        return $div;
    };

    create['delete'] = function() {
        if (!common.isLoggedIn()) { return; }
        var $div = $('<div>', { 'class': 'cp-settings-delete cp-sidebarlayout-element' });

        $('<span>', { 'class': 'label' }).text(Messages.settings_deleteTitle).appendTo($div);

        $('<span>', { 'class': 'cp-sidebarlayout-description' })
            .append(Messages.settings_deleteHint).appendTo($div);

        var $ok = $('<span>', { 'class': 'fa fa-check', title: Messages.saved });
        var $spinner = $('<span>', { 'class': 'fa fa-spinner fa-pulse' });

        var $button = $('<button>', { 'id': 'cp-settings-delete', 'class': 'btn btn-danger' })
            .text(Messages.settings_deleteButton).appendTo($div);

        $button.click(function() {
            $spinner.show();
            UI.confirm(Messages.settings_deleteConfirm, function(yes) {
                if (!yes) { return; }
                sframeChan.query("Q_SETTINGS_DELETE_ACCOUNT", null, function(err, data) {
                    // Owned drive
                    if (data.state === true) {
                        sframeChan.query('Q_SETTINGS_LOGOUT', null, function() {});
                        UI.alert(Messages.settings_deleted, function() {
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

    create['change-password'] = function() {
        if (!common.isLoggedIn()) { return; }

        var $div = $('<div>', { 'class': 'cp-settings-change-password cp-sidebarlayout-element' });

        $('<span>', { 'class': 'label' }).text(Messages.settings_changePasswordTitle).appendTo($div);

        $('<span>', { 'class': 'cp-sidebarlayout-description' })
            .append(Messages.settings_changePasswordHint).appendTo($div);

        // var publicKey = privateData.edPublic;

        var form = h('div', [
            UI.passwordInput({
                id: 'cp-settings-change-password-current',
                placeholder: Messages.settings_changePasswordCurrent
            }, true),
            h('br'),
            UI.passwordInput({
                id: 'cp-settings-change-password-new',
                placeholder: Messages.settings_changePasswordNew
            }, true),
            UI.passwordInput({
                id: 'cp-settings-change-password-new2',
                placeholder: Messages.settings_changePasswordNewConfirm
            }, true),
            h('button.btn.btn-primary', Messages.settings_changePasswordButton)
        ]);

        $(form).appendTo($div);

        var updateBlock = function(data, cb) {
            sframeChan.query('Q_CHANGE_USER_PASSWORD', data, function(err, obj) {
                if (err || obj.error) { return void cb({ error: err || obj.error }); }
                cb(obj);
            });
        };

        var todo = function() {
            var oldPassword = $(form).find('#cp-settings-change-password-current').val();
            var newPassword = $(form).find('#cp-settings-change-password-new').val();
            var newPasswordConfirm = $(form).find('#cp-settings-change-password-new2').val();

            /* basic validation */
            if (!Cred.isLongEnoughPassword(newPassword)) {
                var warning = Messages._getKey('register_passwordTooShort', [
                    Cred.MINIMUM_PASSWORD_LENGTH
                ]);
                return void UI.alert(warning);
            }

            if (newPassword !== newPasswordConfirm) {
                UI.alert(Messages.register_passwordsDontMatch);
                return;
            }

            if (oldPassword === newPassword) {
                return void UI.alert(Messages.settings_changePasswordNewPasswordSameAsOld);
            }

            UI.confirm(Messages.settings_changePasswordConfirm,
                function(yes) {
                    if (!yes) { return; }

                    UI.addLoadingScreen({
                        hideTips: true,
                        loadingText: Messages.settings_changePasswordPending,
                    });
                    updateBlock({
                        password: oldPassword,
                        newPassword: newPassword
                    }, function(obj) {
                        UI.removeLoadingScreen();
                        if (obj && obj.error) {
                            // TODO
                            UI.alert(Messages.settings_changePasswordError);
                        }
                    });
                }, {
                    ok: Messages.register_writtenPassword,
                    cancel: Messages.register_cancel,
                    cancelClass: 'safe',
                    okClass: 'danger',
                    reverseOrder: true,
                    done: function($dialog) {
                        $dialog.find('> div').addClass('half');
                    },
                }, true);
        };

        $(form).find('button').click(function() {
            todo();
        });
        $(form).find('input').keydown(function(e) {
            // Save on Enter
            if (e.which === 13) {
                e.preventDefault();
                e.stopPropagation();
                todo();
            }
        });

        return $div;
    };

    makeBlock('own-drive', function(cb, $div) {
        if (privateData.isDriveOwned || !common.isLoggedIn()) {
            return void cb(false);
        }

        $div.addClass('alert alert-warning');

        var form = h('div', [
            UI.passwordInput({
                id: 'cp-settings-migrate-password',
                placeholder: Messages.settings_changePasswordCurrent
            }, true),
            h('button.btn.btn-primary', Messages.settings_ownDriveButton)
        ]);
        var $form = $(form);
        var spinner = UI.makeSpinner($form);

        var todo = function() {
            var password = $form.find('#cp-settings-migrate-password').val();
            if (!password) { return; }
            spinner.spin();
            UI.confirm(Messages.settings_ownDriveConfirm, function(yes) {
                if (!yes) { return; }
                var data = {
                    password: password,
                    newPassword: password
                };
                UI.addLoadingScreen({
                    hideTips: true,
                    loadingText: Messages.settings_ownDrivePending,
                });
                sframeChan.query('Q_CHANGE_USER_PASSWORD', data, function(err, obj) {
                    UI.removeLoadingScreen();
                    if (err || obj.error) { return UI.alert(Messages.settings_changePasswordError); }
                    spinner.done();
                });
            });
        };

        $form.find('button').click(function() {
            todo();
        });
        $form.find('input').keydown(function(e) {
            // Save on Enter
            if (e.which === 13) {
                e.preventDefault();
                e.stopPropagation();
                todo();
            }
        });


        cb(form);
    }, true);

    // Security

    makeBlock('safe-links', function(cb) {

        var $cbox = $(UI.createCheckbox('cp-settings-safe-links',
            Messages.settings_safeLinksCheckbox,
            false, { label: { class: 'noTitle' } }));

        var spinner = UI.makeSpinner($cbox);

        // Checkbox: "Enable safe links"
        var $checkbox = $cbox.find('input').on('change', function() {
            spinner.spin();
            var val = !$checkbox.is(':checked');
            common.setAttribute(['security', 'unsafeLinks'], val, function() {
                spinner.done();
            });
        });

        common.getAttribute(['security', 'unsafeLinks'], function(e, val) {
            if (e) { return void console.error(e); }
            if (val === false) {
                $checkbox.attr('checked', 'checked');
            }
        });

        cb($cbox);
    }, true);

    // Drive settings

    create['drive-duplicate'] = function() {
        if (!common.isLoggedIn()) { return; }
        var $div = $('<div>', {
            'class': 'cp-settings-drive-duplicate cp-sidebarlayout-element'
        });
        $('<label>').text(Messages.settings_driveDuplicateTitle).appendTo($div);
        $('<span>', { 'class': 'cp-sidebarlayout-description' })
            .text(Messages.settings_driveDuplicateHint).appendTo($div);

        var $ok = $('<span>', { 'class': 'fa fa-check', title: Messages.saved });
        var $spinner = $('<span>', { 'class': 'fa fa-spinner fa-pulse' });

        var $cbox = $(UI.createCheckbox('cp-settings-drive-duplicate',
            Messages.settings_driveDuplicateLabel,
            false, { label: { class: 'noTitle' } }));
        var $checkbox = $cbox.find('input').on('change', function() {
            $spinner.show();
            $ok.hide();
            var val = $checkbox.is(':checked');
            common.setAttribute(['drive', 'hideDuplicate'], val, function() {
                $spinner.hide();
                $ok.show();
            });
        });
        $cbox.appendTo($div);

        $ok.hide().appendTo($cbox);
        $spinner.hide().appendTo($cbox);

        common.getAttribute(['drive', 'hideDuplicate'], function(e, val) {
            if (e) { return void console.error(e); }
            if (val) {
                $checkbox.attr('checked', 'checked');
            }
        });
        return $div;
    };


    create['resettips'] = function() {
        var $div = $('<div>', { 'class': 'cp-settings-resettips cp-sidebarlayout-element' });
        $('<label>').text(Messages.settings_resetTips).appendTo($div);
        $('<span>', { 'class': 'cp-sidebarlayout-description' })
            .text(Messages.settings_resetTipsButton).appendTo($div);
        var $button = $('<button>', { 'id': 'cp-settings-resettips', 'class': 'btn btn-primary' })
            .text(Messages.settings_resetTipsAction).appendTo($div);

        var localStore = window.cryptpadStore;
        $button.click(function() {
            Object.keys(localStore.store).forEach(function(k) {
                if (/^(hide-(info|alert))/.test(k)) {
                    localStore.put(k, null);
                }
            });
            UI.alert(Messages.settings_resetTipsDone);
        });

        return $div;
    };

    create['thumbnails'] = function() {
        var $div = $('<div>', { 'class': 'cp-settings-thumbnails cp-sidebarlayout-element' });
        $('<label>').text(Messages.settings_thumbnails).appendTo($div);

        // Disable
        $('<span>', { 'class': 'cp-sidebarlayout-description' })
            .text(Messages.settings_disableThumbnailsDescription).appendTo($div);

        var $ok = $('<span>', { 'class': 'fa fa-check', title: Messages.saved });
        var $spinner = $('<span>', { 'class': 'fa fa-spinner fa-pulse' });

        var $cbox = $(UI.createCheckbox('disableThumbnails',
            Messages.settings_disableThumbnailsAction,
            false, { label: { class: 'noTitle' } }));
        var $checkbox = $cbox.find('input').on('change', function() {
            $spinner.show();
            $ok.hide();
            var val = $checkbox.is(':checked') || false;
            common.setAttribute(['general', 'disableThumbnails'], val, function() {
                $spinner.hide();
                $ok.show();
            });
        });

        $cbox.appendTo($div);

        $ok.hide().appendTo($cbox);
        $spinner.hide().appendTo($cbox);

        common.getAttribute(['general', 'disableThumbnails'], function(e, val) {
            $checkbox[0].checked = typeof(val) === "undefined" || val;
        });

        // Reset
        $('<span>', { 'class': 'cp-sidebarlayout-description' })
            .text(Messages.settings_resetThumbnailsDescription).appendTo($div);
        var $button = $('<button>', { 'id': 'resetThumbnails', 'class': 'btn btn-primary' })
            .text(Messages.settings_resetThumbnailsAction).appendTo($div);

        $button.click(function() {
            sframeChan.query("Q_THUMBNAIL_CLEAR", null, function(err) {
                if (err) { return void console.error("Cannot clear localForage"); }
                UI.alert(Messages.settings_resetThumbnailsDone);
            });
        });

        return $div;
    };


    var createExportUI = function() {
        var progress = h('div.cp-export-progress');
        var actions = h('div.cp-export-actions');
        var errors = h('div.cp-export-errors', [
            h('p', Messages.settings_exportErrorDescription)
        ]);
        var exportUI = h('div#cp-export-container', [
            h('div.cp-export-block', [
                h('h3', Messages.settings_exportTitle),
                h('p', [
                    Messages.settings_exportDescription,
                    h('br'),
                    Messages.settings_exportFailed,
                    h('br'),
                    h('strong', Messages.settings_exportWarning),
                ]),
                progress,
                actions,
                errors
            ])
        ]);
        $('body').append(exportUI);
        $('#cp-sidebarlayout-container').hide();

        var close = function() {
            $(exportUI).remove();
            $('#cp-sidebarlayout-container').show();
        };

        var _onCancel = [];
        var onCancel = function(h) {
            if (typeof(h) !== "function") { return; }
            _onCancel.push(h);
        };
        var cancel = h('button.btn.btn-default', Messages.cancel);
        $(cancel).click(function() {
            UI.confirm(Messages.settings_exportCancel, function(yes) {
                if (!yes) { return; }
                Feedback.send('FULL_DRIVE_EXPORT_CANCEL');
                _onCancel.forEach(function(h) { h(); });
            });
        }).appendTo(actions);

        var error = h('button.btn.btn-danger', Messages.settings_exportError);
        var translateErrors = function(err) {
            if (err === 'EEMPTY') {
                return Messages.settings_exportErrorEmpty;
            }
            if (['E404', 'EEXPIRED', 'EDELETED'].indexOf(err) !== -1) {
                return Messages.settings_exportErrorMissing;
            }
            return Messages._getKey('settings_exportErrorOther', [err]);
        };
        var addErrors = function(errs) {
            if (!errs.length) { return; }
            var onClick = function() {
                console.error('clicked?');
                $(errors).toggle();
            };
            $(error).click(onClick).appendTo(actions);
            var list = h('div.cp-export-errors-list');
            $(list).appendTo(errors);
            errs.forEach(function(err) {
                if (!err.data) { return; }
                var href = (err.data.href && err.data.href.indexOf('#') !== -1) ? err.data.href : err.data.roHref;
                $(h('div', [
                    h('div.title', err.data.filename || err.data.title),
                    h('div.link', [
                        h('a', {
                            href: href,
                            target: '_blank'
                        }, privateData.origin + href)
                    ]),
                    h('div.reason', translateErrors(err.error))
                ])).appendTo(list);
            });
        };

        var download = h('button.btn.btn-primary', Messages.download_mt_button);
        var completed = false;
        var complete = function(h, err) {
            if (completed) { return; }
            completed = true;
            $(progress).find('.fa-square-o').removeClass('fa-square-o')
                .addClass('fa-check-square-o');
            $(cancel).text(Messages.filePicker_close).off('click').click(function() {
                _onCancel.forEach(function(h) { h(); });
            });
            $(download).click(h).appendTo(actions);
            addErrors(err);
        };

        var done = {};
        var update = function(step, state) {
            console.log(step, state);
            console.log(done[step]);
            if (done[step] && done[step] === -1) { return; }


            // New step
            if (!done[step]) {
                $(progress).find('.fa-square-o').removeClass('fa-square-o')
                    .addClass('fa-check-square-o');
                $(progress).append(h('p', [
                    h('span.fa.fa-square-o'),
                    h('span.text', Messages['settings_export_' + step] || step)
                ]));
                done[step] = state; // -1 if no bar, object otherwise
                if (state !== -1) {
                    var bar = h('div.cp-export-progress-bar');
                    $(progress).append(h('div.cp-export-progress-bar-container', [
                        bar
                    ]));
                    done[step] = { bar: bar };
                }
                return;
            }

            // Updating existing step
            if (typeof state !== "object") { return; }
            var b = done[step].bar;
            var w = (state.current / state.max) * 100;
            $(b).css('width', w + '%');
            if (!done[step].text) {
                done[step].text = h('div.cp-export-progress-text');
                $(done[step].text).appendTo(b);
            }
            $(done[step].text).text(state.current + ' / ' + state.max);
            if (state.current === state.max) { done[step] = -1; }
        };

        return {
            close: close,
            update: update,
            complete: complete,
            onCancel: onCancel
        };
    };

    create['drive-backup'] = function() {
        var $div = $('<div>', { 'class': 'cp-settings-drive-backup cp-sidebarlayout-element' });

        var accountName = privateData.accountName;
        var displayName = metadataMgr.getUserData().name || '';
        var name = displayName || accountName || Messages.anonymous;
        var suggestion = name + '-' + new Date().toDateString();

        var exportFile = function() {
            sframeChan.query("Q_SETTINGS_DRIVE_GET", null, function(err, data) {
                if (err) { return void console.error(err); }
                var sjson = JSON.stringify(data);
                UI.prompt(Messages.exportPrompt,
                    Util.fixFileName(suggestion) + '.json',
                    function(filename) {
                        if (!(typeof(filename) === 'string' && filename)) { return; }
                        var blob = new Blob([sjson], { type: "application/json;charset=utf-8" });
                        saveAs(blob, filename);
                    });
            });
        };
        var importFile = function(content) {
            var $spinner = $('<span>', { 'class': 'fa fa-spinner fa-pulse' }).appendTo($div);
            try {
                var data = JSON.parse(content);
                sframeChan.query("Q_SETTINGS_DRIVE_SET", data, function(e) {
                    if (e) { console.error(e); }
                    $spinner.remove();
                });
            } catch (e) {
                console.error(e);
            }
        };

        $('<label>', { 'for': 'exportDrive' }).text(Messages.settings_backupCategory).appendTo($div);
        $('<span>', { 'class': 'cp-sidebarlayout-description' })
            .text(Messages.settings_backupHint || Messages.settings_backupTitle).appendTo($div);
        /* add an export button */
        var $export = common.createButton('export', true, {}, exportFile);
        $export.attr('class', 'btn btn-success').text(Messages.settings_backup);
        $div.append($export);

        /* add an import button */
        var $import = common.createButton('import', true, {}, importFile);
        $import.attr('class', 'btn btn-success').text(Messages.settings_restore);
        $div.append($import);

        // Backup all the pads
        var exportDrive = function() {
            Feedback.send('FULL_DRIVE_EXPORT_START');
            var todo = function(data, filename) {
                var ui = createExportUI();

                var bu = Backup.create(data, common.getPad, privateData.fileHost, function(blob, errors) {
                    saveAs(blob, filename);
                    sframeChan.event('EV_CRYPTGET_DISCONNECT');
                    ui.complete(function() {
                        Feedback.send('FULL_DRIVE_EXPORT_COMPLETE');
                        saveAs(blob, filename);
                    }, errors);
                }, ui.update);
                ui.onCancel(function() {
                    ui.close();
                    bu.stop();
                });
            };
            sframeChan.query("Q_SETTINGS_DRIVE_GET", "full", function(err, data) {
                if (err) { return void console.error(err); }
                if (data.error) { return void console.error(data.error); }
                UI.prompt(Messages.settings_backup2Confirm,
                    Util.fixFileName(suggestion) + '.zip',
                    function(filename) {
                        if (!(typeof(filename) === 'string' && filename)) { return; }
                        todo(data, filename);
                    });
            });
        };
        $('<span>', { 'class': 'cp-sidebarlayout-description' })
            .text(Messages.settings_backupHint2).appendTo($div);
        var $export2 = common.createButton('export', true, {}, exportDrive);
        $export2.attr('class', 'btn btn-success').text(Messages.settings_backup2);
        $div.append($export2);

        return $div;
    };

    create['drive-import-local'] = function() {
        if (!common.isLoggedIn()) { return; }
        var $div = $('<div>', { 'class': 'cp-settings-drive-import-local cp-sidebarlayout-element' });
        $('<label>').text(Messages.settings_import).appendTo($div);
        $('<span>', { 'class': 'cp-sidebarlayout-description' })
            .text(Messages.settings_importTitle).appendTo($div);
        var $button = $('<button>', {
            'id': 'cp-settings-import-local-pads',
            'class': 'btn btn-primary'
        }).text(Messages.settings_import).appendTo($div);
        var $ok = $('<span>', { 'class': 'fa fa-check', title: Messages.saved }).hide().appendTo($div);
        var $spinner = $('<span>', { 'class': 'fa fa-spinner fa-pulse' }).hide().appendTo($div);

        $button.click(function() {
            UI.confirm(Messages.settings_importConfirm, function(yes) {
                if (!yes) { return; }
                $spinner.show();
                $ok.hide();
                sframeChan.query('Q_SETTINGS_IMPORT_LOCAL', null, function() {
                    $spinner.hide();
                    $ok.show();
                    UI.alert(Messages.settings_importDone);
                });
            }, undefined, true);
        });

        return $div;
    };

    var redrawTrimHistory = function(cb, $div) {
        var spinner = UI.makeSpinner();
        var button = h('button.btn.btn-danger-alt', {
            disabled: 'disabled'
        }, Messages.trimHistory_button);
        var currentSize = h('p', $(spinner.spinner).clone()[0]);
        var content = h('div#cp-settings-trim-container', [
            currentSize,
            button,
            spinner.ok,
            spinner.spinner
        ]);

        if (!privateData.isDriveOwned) {
            var href = privateData.origin + privateData.pathname + '#' + 'account';
            $(currentSize).html(Messages.trimHistory_needMigration);
            $(currentSize).find('a').prop('href', href).click(function(e) {
                e.preventDefault();
                $('.cp-sidebarlayout-category[data-category="account"]').click();
            });
            return void cb(content);
        }


        var $button = $(button);
        var size;
        var channels = [];
        nThen(function(waitFor) {
            APP.history.execCommand('GET_HISTORY_SIZE', {
                account: true,
                channels: []
            }, waitFor(function(obj) {
                if (obj && obj.error) {
                    waitFor.abort();
                    var error = h('div.alert.alert-danger', Messages.trimHistory_getSizeError);
                    $(content).empty().append(error);
                    return;
                }
                channels = obj.channels;
                size = Number(obj.size);
            }));
        }).nThen(function() {
            if (!size || size < 1024) {
                $(currentSize).html(Messages.trimHistory_noHistory);
                return;
            }
            $(currentSize).html(Messages._getKey('trimHistory_currentSize', [UIElements.prettySize(size)]));
            $button.prop('disabled', '');
            UI.confirmButton(button, {
                classes: 'btn-danger'
            }, function() {
                $button.remove();
                spinner.spin();
                APP.history.execCommand('TRIM_HISTORY', {
                    channels: channels
                }, function(obj) {
                    if (obj && obj.error)  {
                        var error = h('div.alert.alert-danger', Messages.trimHistory_error);
                        $(content).empty().append(error);
                        return;
                    }
                    spinner.hide();
                    redrawTrimHistory(cb, $div);
                });
            });
        });

        $div.find('#cp-settings-trim-container').remove();
        cb(content);
    };
    makeBlock('trim-history', function(cb, $div) {
        if (!common.isLoggedIn()) { return; }
        redrawTrimHistory(cb, $div);
    }, true);

    /*
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
    */

    // Cursor settings

    create['cursor-color'] = function() {
        var $div = $('<div>', {
            'class': 'cp-settings-cursor-color cp-sidebarlayout-element'
        });
        $('<label>').text(Messages.settings_cursorColorTitle).appendTo($div);
        $('<span>', { 'class': 'cp-sidebarlayout-description' })
            .text(Messages.settings_cursorColorHint).appendTo($div);

        var $inputBlock = $('<div>').appendTo($div);

        var $colorPicker = $("<div>", { class: "cp-settings-cursor-color-picker" });
        var $ok = $('<span>', { 'class': 'fa fa-check', title: Messages.saved });
        var $spinner = $('<span>', { 'class': 'fa fa-spinner fa-pulse' });

        // when jscolor picker value change
        var _onchange = function(colorL) {
            var val = "#" + colorL.toString();
            if (!/^#[0-9a-fA-F]{6}$/.test(val)) { return; }
            common.setAttribute(['general', 'cursor', 'color'], val, function() {
                $spinner.hide();
                $ok.show();
            });
        };
        var to;
        var onchange = function(colorL) {
            $spinner.show();
            $ok.hide();

            if (to) { clearTimeout(to); }
            to = setTimeout(function() {
                _onchange(colorL);
            }, 300);
        };

        // jscolor picker
        var jscolorL = new window.jscolor($colorPicker[0], { showOnClick: false, onFineChange: onchange, valueElement: undefined });
        $colorPicker.click(function() {
            jscolorL.show();
        });

        // set default color
        common.getAttribute(['general', 'cursor', 'color'], function(e, val) {
            if (e) { return void console.error(e); }
            val = val || "#000";
            jscolorL.fromString(val);
        });

        $colorPicker.appendTo($inputBlock);
        $ok.hide().appendTo($inputBlock);
        $spinner.hide().appendTo($inputBlock);

        return $div;
    };

    create['cursor-share'] = function() {
        var $div = $('<div>', {
            'class': 'cp-settings-cursor-share cp-sidebarlayout-element'
        });
        $('<label>').text(Messages.settings_cursorShareTitle).appendTo($div);
        $('<span>', { 'class': 'cp-sidebarlayout-description' })
            .text(Messages.settings_cursorShareHint).appendTo($div);

        var $ok = $('<span>', { 'class': 'fa fa-check', title: Messages.saved });
        var $spinner = $('<span>', { 'class': 'fa fa-spinner fa-pulse' });

        var $cbox = $(UI.createCheckbox('cp-settings-cursor-share',
            Messages.settings_cursorShareLabel,
            false, { label: { class: 'noTitle' } }));
        var $checkbox = $cbox.find('input').on('change', function() {
            $spinner.show();
            $ok.hide();
            var val = $checkbox.is(':checked');
            common.setAttribute(['general', 'cursor', 'share'], val, function() {
                $spinner.hide();
                $ok.show();
            });
        });
        $cbox.appendTo($div);

        $ok.hide().appendTo($cbox);
        $spinner.hide().appendTo($cbox);

        common.getAttribute(['general', 'cursor', 'share'], function(e, val) {
            if (e) { return void console.error(e); }
            if (val !== false) {
                $checkbox.attr('checked', 'checked');
            }
        });
        return $div;
    };

    create['cursor-show'] = function() {
        var $div = $('<div>', {
            'class': 'cp-settings-cursor-show cp-sidebarlayout-element'
        });
        $('<label>').text(Messages.settings_cursorShowTitle + ' (BETA)').appendTo($div);
        $('<span>', { 'class': 'cp-sidebarlayout-description' })
            .text(Messages.settings_cursorShowHint).appendTo($div);

        var $ok = $('<span>', { 'class': 'fa fa-check', title: Messages.saved });
        var $spinner = $('<span>', { 'class': 'fa fa-spinner fa-pulse' });

        var $cbox = $(UI.createCheckbox('cp-settings-cursor-show',
            Messages.settings_cursorShowLabel,
            false, { label: { class: 'noTitle' } }));
        var $checkbox = $cbox.find('input').on('change', function() {
            $spinner.show();
            $ok.hide();
            var val = $checkbox.is(':checked');
            common.setAttribute(['general', 'cursor', 'show'], val, function() {
                $spinner.hide();
                $ok.show();
            });
        });
        $cbox.appendTo($div);

        $ok.hide().appendTo($cbox);
        $spinner.hide().appendTo($cbox);

        common.getAttribute(['general', 'cursor', 'show'], function(e, val) {
            if (e) { return void console.error(e); }
            if (val !== false) {
                $checkbox.attr('checked', 'checked');
            }
        });
        return $div;
    };

    // Rich text pads settings

    create['pad-width'] = function() {
        var $div = $('<div>', {
            'class': 'cp-settings-pad-width cp-sidebarlayout-element'
        });
        $('<span>', { 'class': 'label' }).text(Messages.settings_padWidth).appendTo($div);

        $('<span>', { 'class': 'cp-sidebarlayout-description' })
            .text(Messages.settings_padWidthHint).appendTo($div);

        var $ok = $('<span>', { 'class': 'fa fa-check', title: Messages.saved });
        var $spinner = $('<span>', { 'class': 'fa fa-spinner fa-pulse' });

        var $cbox = $(UI.createCheckbox('cp-settings-padwidth',
            Messages.settings_padWidthLabel,
            false, { label: { class: 'noTitle' } }));
        var $checkbox = $cbox.find('input').on('change', function() {
            $spinner.show();
            $ok.hide();
            var val = $checkbox.is(':checked');
            common.setAttribute(['pad', 'width'], val, function() {
                $spinner.hide();
                $ok.show();
            });
        });
        $cbox.appendTo($div);

        $ok.hide().appendTo($cbox);
        $spinner.hide().appendTo($cbox);


        common.getAttribute(['pad', 'width'], function(e, val) {
            if (e) { return void console.error(e); }
            if (val) {
                $checkbox.attr('checked', 'checked');
            }
        });
        return $div;
    };

    create['pad-spellcheck'] = function() {
        var $div = $('<div>', {
            'class': 'cp-settings-pad-spellcheck cp-sidebarlayout-element'
        });
        $('<label>').text(Messages.settings_padSpellcheckTitle).appendTo($div);
        $('<span>', { 'class': 'cp-sidebarlayout-description' })
            .text(Messages.settings_padSpellcheckHint).appendTo($div);

        var $ok = $('<span>', { 'class': 'fa fa-check', title: Messages.saved });
        var $spinner = $('<span>', { 'class': 'fa fa-spinner fa-pulse' });

        var $cbox = $(UI.createCheckbox('cp-settings-pad-spellcheck',
            Messages.settings_padSpellcheckLabel,
            false, { label: { class: 'noTitle' } }));
        var $checkbox = $cbox.find('input').on('change', function() {
            $spinner.show();
            $ok.hide();
            var val = $checkbox.is(':checked');
            common.setAttribute(['pad', 'spellcheck'], val, function() {
                $spinner.hide();
                $ok.show();
            });
        });
        $cbox.appendTo($div);

        $ok.hide().appendTo($cbox);
        $spinner.hide().appendTo($cbox);

        common.getAttribute(['pad', 'spellcheck'], function(e, val) {
            if (e) { return void console.error(e); }
            if (val) {
                $checkbox.attr('checked', 'checked');
            }
        });
        return $div;
    };

    makeBlock('pad-notif', function(cb) {
        var $cbox = $(UI.createCheckbox('cp-settings-pad-notif',
            Messages.settings_padNotifCheckbox,
            false, { label: { class: 'noTitle' } }));

        var spinner = UI.makeSpinner($cbox);

        // Checkbox: "Enable safe links"
        var $checkbox = $cbox.find('input').on('change', function() {
            spinner.spin();
            var val = $checkbox.is(':checked');
            common.setAttribute(['pad', 'disableNotif'], val, function() {
                spinner.done();
            });
        });

        common.getAttribute(['pad', 'disableNotif'], function(e, val) {
            if (e) { return void console.error(e); }
            if (val === true) {
                $checkbox.attr('checked', 'checked');
            }
        });

        cb($cbox);
    }, true);

    // Code settings

    create['code-indent-unit'] = function() {
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
        }).on('change', function() {
            var val = parseInt($input.val());
            if (typeof(val) !== 'number') { return; }
            common.setAttribute(['codemirror', 'indentUnit'], val);
        }).appendTo($inputBlock);

        common.getAttribute(['codemirror', 'indentUnit'], function(e, val) {
            if (e) { return void console.error(e); }
            if (typeof(val) !== 'number') {
                $input.val(2);
            } else {
                $input.val(val);
            }
        });
        return $div;
    };

    create['code-indent-type'] = function() {
        var key = 'indentWithTabs';

        var $div = $('<div>', {
            'class': 'cp-settings-code-indent-type cp-sidebarlayout-element'
        });
        $('<label>').text(Messages.settings_codeUseTabs).appendTo($div);

        var $inputBlock = $('<div>', {
                'class': 'cp-sidebarlayout-input-block',
            }).css('flex-flow', 'column')
            .appendTo($div);


        var $cbox = $(UI.createCheckbox('cp-settings-codeindent'));
        var $checkbox = $cbox.find('input').on('change', function() {
            var val = $checkbox.is(':checked');
            if (typeof(val) !== 'boolean') { return; }
            common.setAttribute(['codemirror', key], val);
        });
        $cbox.appendTo($inputBlock);

        /*proxy.on('change', ['settings', 'codemirror', key], function (o, n) {
            $input[0].checked = !!n;
        });*/

        common.getAttribute(['codemirror', key], function(e, val) {
            if (e) { return void console.error(e); }
            $checkbox[0].checked = !!val;
        });
        return $div;
    };

    create['code-brackets'] = function() {
        var key = 'brackets';

        var $div = $('<div>', {
            'class': 'cp-settings-code-brackets cp-sidebarlayout-element'
        });
        $('<label>').text(Messages.settings_codeBrackets).appendTo($div);

        var $inputBlock = $('<div>', {
                'class': 'cp-sidebarlayout-input-block',
            }).css('flex-flow', 'column')
            .appendTo($div);


        var $cbox = $(UI.createCheckbox('cp-settings-codebrackets'));
        var $checkbox = $cbox.find('input').on('change', function() {
            var val = $checkbox.is(':checked');
            if (typeof(val) !== 'boolean') { return; }
            common.setAttribute(['codemirror', key], val);
        });
        $cbox.appendTo($inputBlock);

        common.getAttribute(['codemirror', key], function(e, val) {
            if (e) { return void console.error(e); }
            $checkbox[0].checked = typeof(val) !== "boolean" || val;
        });
        return $div;
    };

    create['code-font-size'] = function() {
        var key = 'fontSize';

        var $div = $('<div>', {
            'class': 'cp-settings-code-font-size cp-sidebarlayout-element'
        });
        $('<label>').text(Messages.settings_codeFontSize).appendTo($div);

        var $inputBlock = $('<div>', {
            'class': 'cp-sidebarlayout-input-block',
        }).appendTo($div);

        var $input = $('<input>', {
            'min': 8,
            'max': 30,
            type: 'number',
        }).on('change', function() {
            var val = parseInt($input.val());
            if (typeof(val) !== 'number') { return; }
            common.setAttribute(['codemirror', key], val);
        }).appendTo($inputBlock);

        common.getAttribute(['codemirror', key], function(e, val) {
            if (e) { return void console.error(e); }
            if (typeof(val) !== 'number') {
                $input.val(12);
            } else {
                $input.val(val);
            }
        });
        return $div;
    };

    create['code-spellcheck'] = function() {
        var $div = $('<div>', {
            'class': 'cp-settings-code-spellcheck cp-sidebarlayout-element'
        });
        $('<label>').text(Messages.settings_codeSpellcheckTitle).appendTo($div);
        //$('<span>', {'class': 'cp-sidebarlayout-description'})
        //    .text(Messages.settings_padSpellcheckHint).appendTo($div);

        var $ok = $('<span>', { 'class': 'fa fa-check', title: Messages.saved });
        var $spinner = $('<span>', { 'class': 'fa fa-spinner fa-pulse' });

        var $cbox = $(UI.createCheckbox('cp-settings-code-spellcheck',
            Messages.settings_codeSpellcheckLabel,
            false, { label: { class: 'noTitle' } }));
        var $checkbox = $cbox.find('input').on('change', function() {
            $spinner.show();
            $ok.hide();
            var val = $checkbox.is(':checked');
            common.setAttribute(['codemirror', 'spellcheck'], val, function() {
                $spinner.hide();
                $ok.show();
            });
        });
        $cbox.appendTo($div);

        $ok.hide().appendTo($cbox);
        $spinner.hide().appendTo($cbox);

        common.getAttribute(['codemirror', 'spellcheck'], function(e, val) {
            if (e) { return void console.error(e); }
            if (val) {
                $checkbox.attr('checked', 'checked');
            }
        });
        return $div;
    };


    // Settings app

    var createUsageButton = function() {
        common.createUsageBar(null, function(err, $bar) {
            if (err) { return void console.error(err); }
            APP.$usage.html('').append($bar);
        }, true);
    };

    var hideCategories = function() {
        APP.$rightside.find('> div').hide();
    };
    var showCategories = function(cat) {
        hideCategories();
        cat.forEach(function(c) {
            APP.$rightside.find('.' + c).show();
        });
    };

    var createLeftside = function() {
        var $categories = $('<div>', { 'class': 'cp-sidebarlayout-categories' })
            .appendTo(APP.$leftside);
        APP.$usage = $('<div>', { 'class': 'usage' }).appendTo(APP.$leftside);
        var active = privateData.category || 'account';
        Object.keys(categories).forEach(function(key) {
            var $category = $('<div>', {
                'class': 'cp-sidebarlayout-category',
                'data-category': key
            }).appendTo($categories);
            if (key === 'account') { $category.append($('<span>', { 'class': 'fa fa-user-o' })); }
            if (key === 'drive') { $category.append($('<span>', { 'class': 'fa fa-hdd-o' })); }
            if (key === 'cursor') { $category.append($('<span>', { 'class': 'fa fa-i-cursor' })); }
            if (key === 'code') { $category.append($('<span>', { 'class': 'fa fa-file-code-o' })); }
            if (key === 'pad') { $category.append($('<span>', { 'class': 'fa fa-file-word-o' })); }
            if (key === 'security') { $category.append($('<span>', { 'class': 'fa fa-lock' })); }
            if (key === 'subscription') { $category.append($('<span>', { 'class': 'fa fa-star-o' })); }

            if (key === active) {
                $category.addClass('cp-leftside-active');
            }

            $category.click(function() {
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

            $category.append(Messages['settings_cat_' + key] || key);
        });
        showCategories(categories[active]);
        common.setHash(active);
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
            pageTitle: Messages.settings_title,
            metadataMgr: common.getMetadataMgr(),
        };
        APP.toolbar = Toolbar.create(configTb);
        APP.toolbar.$rightside.hide();
        APP.history = common.makeUniversal('history');

        // Content
        var $rightside = APP.$rightside;
        /*for (var f in create) {
            if (typeof create[f] !== "function") { continue; }
            $rightside.append(create[f]());
        }*/
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


        // TODO RPC
        //obj.proxy.on('change', [], refresh);
        //obj.proxy.on('remove', [], refresh);
        //Cryptpad.onDisplayNameChanged(refresh);

        createLeftside();
        createUsageButton();

        UI.removeLoadingScreen();
    });
});
