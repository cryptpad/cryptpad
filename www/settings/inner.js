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
    '/customize/messages.js',
    '/common/hyperscript.js',
    '/common/common-credential.js',
    '/customize/application_config.js',
    '/api/config',
    '/common/make-backup.js',
    '/common/common-feedback.js',
    '/common/common-constants.js',
    '/customize.dist/login.js',

    '/common/jscolor.js',
    '/components/file-saver/FileSaver.min.js',
    'css!/components/bootstrap/dist/css/bootstrap.min.css',
    'css!/components/components-font-awesome/css/font-awesome.min.css',
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
    Feedback,
    Constants,
    Login
) {
    var saveAs = window.saveAs;
    var APP = window.APP = {};

    var common;
    var metadataMgr;
    var privateData;
    var sframeChan;


    var categories = {
        'account': [ // Msg.settings_cat_account
            'cp-settings-own-drive',
            'cp-settings-info-block',
            'cp-settings-displayname',
            'cp-settings-language-selector',
            'cp-settings-mediatag-size',
            'cp-settings-delete'
        ],
        'security': [ // Msg.settings_cat_security
            'cp-settings-logout-everywhere',
            'cp-settings-mfa',
            'cp-settings-change-password',
            'cp-settings-safe-links',
            'cp-settings-userfeedback',
            'cp-settings-cache',
            'cp-settings-remove-owned'
        ],
        'style': [ // Msg.settings_cat_style
            'cp-settings-colortheme',
            'cp-settings-custom-theme',
        ],
        'drive': [
            'cp-settings-redirect',
            'cp-settings-resettips',
            'cp-settings-autostore',
            'cp-settings-drive-duplicate',
            'cp-settings-thumbnails',
            'cp-settings-drive-backup',
            'cp-settings-drive-import-local',
            'cp-settings-trim-history',
            //'cp-settings-drive-reset'
        ],
        'cursor': [ // Msg.settings_cat_cursor
            'cp-settings-cursor-color',
            'cp-settings-cursor-share',
            'cp-settings-cursor-show',
        ],
        'pad': [ // Msg.settings_cat_pad
            'cp-settings-pad-width',
            'cp-settings-pad-spellcheck',
            'cp-settings-pad-notif',
            'cp-settings-pad-openlink',
        ],
        'code': [ // Msg.settings_cat_code
            'cp-settings-code-indent-unit',
            'cp-settings-code-indent-type',
            'cp-settings-code-brackets',
            'cp-settings-code-font-size',
            'cp-settings-code-spellcheck',
        ],
        'kanban': [ // Msg.settings_cat_kanban
            'cp-settings-kanban-tags',
        ],
        'notifications': [
            'cp-settings-notif-calendar'
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
        var $label = $('<span>', { 'class': 'cp-default-label' }).text(Messages.user_accountName);
        var $name = $('<span>').text(accountName || '');
        if (!accountName) {
            $label.text('');
            $name.text(Messages.settings_anonymous);
        }
        $account.append($label).append($name);

        var publicKey = privateData.edPublic;
        if (publicKey) {
            var $key = $('<div>', { 'class': 'cp-sidebarlayout-element' }).appendTo($div);
            var userHref = Hash.getPublicSigningKeyString(privateData.origin, accountName, publicKey);
            var $pubLabel = $('<label>', { 'class': 'cp-default-label', 'for': 'publicKey' })
                .text(Messages.settings_publicSigningKey);
            var $pubInput = $('<input>', { 'type': 'text', 'value': userHref, 'id': 'publicKey' });
            $key.append($pubLabel).append($pubInput);
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

        $('<span>', { 'class': 'cp-default-label' }).text(Messages.settings_autostoreTitle).appendTo($div);

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
        var $div2 = $(h('div.cp-settings-radio-container', [
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

        $('<span>', { 'class': 'cp-default-label' }).text(Messages.settings_userFeedbackTitle).appendTo($div);

        $div.append(h('span.cp-sidebarlayout-description', [
            Messages.settings_userFeedbackHint1,
            Messages.settings_userFeedbackHint2,
        ]));

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

    makeBlock('cache', function (cb) { // Msg.settings_cacheHint, .settings_cacheTitle
        var store = window.cryptpadStore;
        var $cbox = $(UI.createCheckbox('cp-settings-cache-1',
            Messages.settings_cacheCheckbox,
            false, { label: { class: 'noTitle' } }));
        var spinner = UI.makeSpinner($cbox);

        // Checkbox: "Enable safe links"
        var $checkbox = $cbox.find('input').on('change', function() {
            spinner.spin();
            var val = !$checkbox.is(':checked') ? '1' : undefined;
            store.put('disableCache', val, function () {
                sframeChan.query('Q_CACHE_DISABLE', {
                    disabled: Boolean(val)
                }, function () {
                    spinner.done();
                });
            });
        });

        store.get('disableCache', function (val) {
            if (!val) {
                $checkbox.attr('checked', 'checked');
            }
        });

        var button = h('button.btn.btn-danger', [
            h('i.fa.fa-trash-o'),
            h('span', Messages.settings_cacheButton)
        ]);
        var buttonContainer = h('div.cp-settings-clear-cache', button);
        var spinner2 = UI.makeSpinner($(buttonContainer));
        UI.confirmButton(button, {
            classes: 'btn-danger'
        }, function () {
            spinner2.spin();
            sframeChan.query('Q_CLEAR_CACHE', null, function() {
                spinner2.done();
            });
        });

        cb([
            $cbox[0],
            buttonContainer
        ]);
    }, true);

    makeBlock('colortheme', function (cb) { // Msg.settings_colorthemeHint .settings_colorthemeTitle
        var theme = window.cryptpadStore.store['colortheme'] || 'default';
        var os = window.cryptpadStore.store['colortheme_default'] || 'light';
        var values = [
            'default', // Msg.settings_colortheme_default
            'light', // Msg.settings_colortheme_light
            'dark', // Msg.settings_colortheme_dark
            /* 'custom'*/ // Msg.settings_colortheme_custom
        ];

        var defaultTheme = Messages['settings_colortheme_'+os];
        var opts = h('div.cp-settings-radio-container', [
            values.map(function (key) {
                return UI.createRadio('cp-colortheme-radio', 'cp-colortheme-radio-'+key,
                    Messages._getKey('settings_colortheme_' + key, [defaultTheme]),
                    key === theme, {
                        input: { value: key },
                        label: { class: 'noTitle' }
                    });
            })
        ]);

        cb(opts);

        var spinner = UI.makeSpinner($(opts));
        $(opts).find('input[name="cp-colortheme-radio"]').change(function () {
            var val = this.value;
            if (values.indexOf(val) === -1) { return; }
            if (val === theme) { return; }
            spinner.spin();

            // Check if we need to flush cache
            var flush = false;
            if (val === "default" && os === theme) {
                // Switch from a theme to default without changing value: nothing to do
            } else if (theme === "default" && os === val) {
                // Switch from default to a selected value without any change: nothing to do
            } else {
                // The theme is different, flush cache
                flush = true;
            }

            if (val === 'default') { val = ''; }
            // browsers try to load iframes from cache if they have the same id as was previously seen
            // this seems to help?
            window.location.hash = '';
            if (flush && window.CryptPad_flushCacheInner) { window.CryptPad_flushCacheInner(); }
            sframeChan.query('Q_COLORTHEME_CHANGE', {
                theme: val,
                flush: flush
            }, function () {
                window.cryptpadStore.store['colortheme'] = val;
                theme = val || 'default';
                spinner.done();
            });
        });
    }, true);

    var deriveBytes = function (name, password, cb) {
        Cred.deriveFromPassphrase(name, password, Login.requiredBytes, cb);
    };

    makeBlock('remove-owned', function(cb) { // Msg.settings_removeOwnedHint, .settings_removeOwnedTitle
        if (!common.isLoggedIn()) { return cb(false); }

        var button = h('button.btn.btn-danger', [
            h('i.cptools.cptools-destroy'),
            Messages.settings_removeOwnedButton
        ]);
        var form = h('div', [
            button
        ]);
        var $button = $(button);

        UI.confirmButton(button, {
            classes: 'btn-danger',
            multiple: true
        }, function() {
            UI.addLoadingScreen({
                hideTips: true,
                loadingText: Messages.settings_removeOwnedText
            });
            sframeChan.query("Q_SETTINGS_REMOVE_OWNED_PADS", {}, function (err, data) {
                UI.removeLoadingScreen();
                $button.prop('disabled', '');
                if (data && data.error) {
                    console.error(data.error);
                    return void UI.warn(Messages.error);
                }
                UI.log(Messages.ui_success);
            });
        });

        cb(form);
    }, true);
    makeBlock('delete', function(cb) { // Msg.settings_deleteHint, .settings_deleteTitle
        if (!common.isLoggedIn()) { return cb(false); }

        var button = h('button.btn.btn-danger', Messages.settings_deleteButton);
        var form = h('div', [
            UI.passwordInput({
                id: 'cp-settings-delete-account',
                placeholder: Messages.settings_changePasswordCurrent,
                autocomplete: 'current-password',
            }, true),
            button
        ]);
        var $form = $(form);
        var $button = $(button);

        UI.confirmButton(button, {
            classes: 'btn-danger',
            multiple: true
        }, function() {
            nThen(function (waitFor) {
                $button.prop('disabled', 'disabled');
                var priv = metadataMgr.getPrivateData();
                // Check if subscriptions are enabled and you have a premium plan
                if (priv.plan && priv.plan !== "custom" && ApiConfig.allowSubscriptions) {
                    // Also make sure upgradeURL is defined
                    var url = priv.accounts && priv.accounts.upgradeURL;
                    if (!url) { return; }
                    url += '#mysubs';
                    var a = h('a', { href:url }, Messages.settings_deleteSubscription);
                    $(a).click(function (e) {
                        e.preventDefault();
                        common.openUnsafeURL(url);
                    });
                    UI.confirm(h('div', [
                        Messages.settings_deleteWarning, h('p', a)
                    ]), waitFor(function (yes) {
                        if (!yes) {
                            $button.prop('disabled', '');
                            waitFor.abort();
                        }
                    }), {
                        ok: Messages.settings_deleteContinue,
                        okClass: 'btn.btn-danger',
                        cancelClass: 'btn.btn-primary'
                    });
                }
            }).nThen(function () {
                var password = $form.find('#cp-settings-delete-account').val();
                if (!password) {
                    return void UI.warn(Messages.error);
                }

                UI.addLoadingScreen({
                    hideTips: true,
                    loadingText: Messages.settings_deleteTitle
                });
                setTimeout(function () {
                    var bytes;
                    var auth = {};
                    var ssoSeed;
                    nThen(function (w) {
                        sframeChan.query("Q_SETTINGS_GET_SSO_SEED", {
                        }, w(function (err, obj) {
                            if (!obj || !obj.seed) { return; } // Not an sso account?
                            ssoSeed = obj.seed;
                        }));
                    }).nThen(function (w) {
                        var name = ssoSeed || privateData.accountName;
                        deriveBytes(name, password, w(function (_bytes) {
                            bytes = _bytes;
                        }));
                    }).nThen(function (w) {
                        var result = Login.allocateBytes(bytes);
                        sframeChan.query("Q_SETTINGS_CHECK_PASSWORD", {
                            blockHash: result.blockHash,
                            userHash: result.userHash,
                        }, w(function (err, obj) {
                            if (!obj || !obj.correct) {
                                UI.warn(Messages.login_noSuchUser);
                                w.abort();
                                UI.removeLoadingScreen();
                            }
                        }));
                    }).nThen(function (w) {
                        // CHECK MFA
                        sframeChan.query('Q_SETTINGS_MFA_CHECK', {}, w(function (err, obj) {
                            // No block? no need for a code
                            if (err || !obj || (obj && obj.err === 'NOBLOCK')
                                    || !obj.mfa) { return; }
                            auth.type = obj.type;

                            if (auth.type === 'TOTP') {
                                UI.getOTPScreen(w(function (val) {
                                    UI.addLoadingScreen({ loadingText: Messages.settings_deleteTitle });
                                    auth.data = val;
                                }), function () {
                                    w.abort(); // On exit OTP screen
                                });
                            }
                        }));
                    }).nThen(function () {
                        window.CP_ownAccountDeletion = true;
                        sframeChan.query("Q_SETTINGS_DELETE_ACCOUNT", {
                            bytes: bytes,
                            auth: auth
                        }, function(err, data) {
                            if (err) { window.CP_ownAccountDeletion = false; }
                            UI.removeLoadingScreen();
                            if (data && data.error) {
                                $button.prop('disabled', '');
                                if (data.error === 'INVALID_PASSWORD') {
                                    return void UI.warn(Messages.drive_sfPasswordError);
                                }
                                if (data.error === 'INVALID_CODE') {
                                    return void UI.warn(Messages.settings_otp_invalid);
                                }
                                return void UI.warn(Messages.error);
                            }
                            // Owned drive
                            if (data.state === true) {
                                return void sframeChan.query('Q_SETTINGS_LOGOUT_PROPERLY', null, function() {
                                    UI.alert(Messages.settings_deleted, function() {
                                        common.gotoURL('/');
                                    });
                                });
                            }
                            // Not owned drive
                            var msg = h('div.cp-app-settings-delete-alert', [
                                h('p', Messages.settings_deleteModal),
                                h('pre', JSON.stringify(data, 0, 2))
                            ]);
                            UI.alert(msg);
                            $button.prop('disabled', '');
                        });
                    });
                });
            });
        });

        cb(form);
    }, true);

    create['change-password'] = function() {
        if (!common.isLoggedIn()) { return; }
        if (privateData.isSSO && ApiConfig.sso && ApiConfig.sso.password === 0) { return; }

        var $div = $('<div>', { 'class': 'cp-settings-change-password cp-sidebarlayout-element' });

        $('<span>', { 'class': 'cp-default-label' }).text(Messages.settings_changePasswordTitle).appendTo($div);

        $('<span>', { 'class': 'cp-sidebarlayout-description' })
            .append(Messages.settings_changePasswordHint).appendTo($div);

        // var publicKey = privateData.edPublic;
        var form = h('div', [
            UI.passwordInput({
                id: 'cp-settings-change-password-current',
                placeholder: Messages.settings_changePasswordCurrent,
                autocomplete: 'current-password',
            }, true),
            UI.passwordInput({
                id: 'cp-settings-change-password-new',
                placeholder: Messages.settings_changePasswordNew,
                autocomplete: 'new-password',
            }, true),
            UI.passwordInput({
                id: 'cp-settings-change-password-new2',
                placeholder: Messages.settings_changePasswordNewConfirm,
                autocomplete: 'new-password',
            }, true),
            h('button.btn.btn-primary', Messages.settings_changePasswordButton)
        ]);

        $(form).appendTo($div);

        var updateBlock = function(data, cb) {
            sframeChan.query('Q_CHANGE_USER_PASSWORD', data, function(err, obj) {
                if (err || obj.error) { return void cb({ error: err || obj.error }); }
                cb(obj);
            }, {raw: true});
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

                    UI.addLoadingScreen({ loadingText: Messages.settings_changePasswordPending });
                    // We're going to derive the bytes in inner in order to ask for the possible
                    // OTP code after the Scrypt execution. This will make it less likely to
                    // have the OTP code expire.
                    setTimeout(function () {
                        var oldBytes, newBytes;
                        var auth = {};
                        var ssoSeed;
                        nThen(function (w) {
                            sframeChan.query("Q_SETTINGS_GET_SSO_SEED", {
                            }, w(function (err, obj) {
                                if (!obj || !obj.seed) { return; } // Not an sso account?
                                ssoSeed = obj.seed;
                            }));
                        }).nThen(function (w) {
                            var name = ssoSeed || privateData.accountName;
                            deriveBytes(name, oldPassword, w(function (bytes) {
                                oldBytes = bytes;
                            }));
                            deriveBytes(name, newPassword, w(function (bytes) {
                                newBytes = bytes;
                            }));
                        }).nThen(function (w) {
                            var result = Login.allocateBytes(oldBytes);
                            sframeChan.query("Q_SETTINGS_CHECK_PASSWORD", {
                                blockHash: result.blockHash,
                                userHash: result.userHash,
                            }, w(function (err, obj) {
                                if (!obj || !obj.correct) {
                                    UI.warn(Messages.login_noSuchUser);
                                    w.abort();
                                    UI.removeLoadingScreen();
                                }
                            }));
                        }).nThen(function (w) {
                            // CHECK MFA
                            sframeChan.query('Q_SETTINGS_MFA_CHECK', {}, w(function (err, obj) {
                                // No block? no need for a code
                                if (err || !obj || (obj && obj.err === 'NOBLOCK')
                                        || !obj.mfa) { return; }
                                auth.type = obj.type;

                                if (auth.type === 'TOTP') {
                                    UI.getOTPScreen(w(function (val) {
                                        auth.data = val;
                                        UI.addLoadingScreen({ loadingText: Messages.settings_changePasswordPending });
                                    }), function () {
                                        w.abort(); // On exit OTP screen
                                    });
                                }
                            }));
                        }).nThen(function () {
                            updateBlock({
                                password: oldPassword,
                                newPassword: newPassword,
                                oldBytes: oldBytes,
                                newBytes: newBytes,
                                auth: auth
                            }, function(obj) {
                                UI.removeLoadingScreen();
                                if (obj && obj.error) {
                                    if (obj.error === 'INVALID_CODE') {
                                        return void UI.warn(Messages.settings_otp_invalid);
                                    }
                                    // TODO more specific error message?
                                    console.error(obj.error);
                                    UI.alert(Messages.settings_changePasswordError);
                                }
                            });
                        });
                    });
                }, {
                    ok: Messages.register_writtenPassword,
                    cancel: Messages.register_cancel,
                    okClass: 'btn.btn-danger.btn-confirm',
                    reverseOrder: true,
                    done: function($dialog) {
                        $dialog.find('> div').addClass('half');
                    },
                });
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

    makeBlock('own-drive', function(cb, $div) { // Msg.settings_ownDriveHint, .settings_ownDriveTitle
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

    makeBlock('mediatag-size', function(cb, $div) { // Msg.settings_mediatagSizeHint, .settings_mediatagSizeTitle
        var $inputBlock = $('<div>', {
            'class': 'cp-sidebarlayout-input-block',
        });

        var spinner;
        var $input = $(h('input#cp-automatic-download', {
            'min': -1,
            'max': 1000,
            type: 'number',
        })).appendTo($inputBlock);
        $div.find('label').attr('for', 'cp-automatic-download');

        var oldVal;

        var todo = function () {
            var val = parseInt($input.val());
            if (typeof(val) !== 'number' || isNaN(val)) { return UI.warn(Messages.error); }
            if (val === oldVal) { return; }
            spinner.spin();
            common.setAttribute(['general', 'mediatag-size'], val, function (err) {
                if (err) {
                    spinner.hide();
                    console.error(err);
                    return UI.warn(Messages.error);
                }
                oldVal = val;
                spinner.done();
                UI.log(Messages.saved);
            });
        };
        var $save = $(h('button.btn.btn-primary', Messages.settings_save)).appendTo($inputBlock);
        spinner = UI.makeSpinner($inputBlock);

        $save.click(todo);
        $input.on('keyup', function(e) {
            if (e.which === 13) { todo(); }
        });

        common.getAttribute(['general', 'mediatag-size'], function(e, val) {
            if (e) { return void console.error(e); }
            if (typeof(val) !== 'number' || isNaN(val)) {
                oldVal = 5;
                $input.val(5);
            } else {
                oldVal = val;
                $input.val(val);
            }
        });

        cb($inputBlock);
    }, true);


    // Account access

    makeBlock('mfa', function (cb) { // Msg.settings_mfaTitle, Msg.settings_mfaHint
        if (!common.isLoggedIn()) { return void cb(false); }

        var content = h('div');
        sframeChan.query('Q_SETTINGS_MFA_CHECK', {}, function (err, obj) {
            if (err || !obj || (obj && obj.err === 'NOBLOCK')) { return void cb(false); }
            var enabled = obj && obj.mfa && obj.type === 'TOTP';
            var config = {
                accountName: privateData.accountName,
                origin: privateData.origin
            };
            var draw = (state) => {
                common.totpSetup(config, content, state, (newState) => {
                    draw(newState);
                });
            };
            draw(Boolean(enabled));
            cb(content);
        });
    }, true);



    // Security

    makeBlock('safe-links', function(cb) { // Msg.settings_safeLinksTitle

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

    create['redirect'] = function () {
        if (!common.isLoggedIn()) { return; }
        var $div = $('<div>', { 'class': 'cp-settings-redirect cp-sidebarlayout-element' });

        $('<span>', { 'class': 'cp-default-label' }).text(Messages.settings_driveRedirectTitle).appendTo($div);

        $div.append(h('span', {
            class: 'cp-sidebarlayout-description',
        }, Messages.settings_driveRedirectHint));

        var $ok = $('<span>', { 'class': 'fa fa-check', title: Messages.saved });
        var $spinner = $('<span>', { 'class': 'fa fa-spinner fa-pulse' });

        var $cbox = $(UI.createCheckbox('cp-settings-redirect',
            Messages.settings_driveRedirect,
            false, { label: { class: 'noTitle' } }));
        var $checkbox = $cbox.find('input').on('change', function() {
            $spinner.show();
            $ok.hide();
            var val = $checkbox.is(':checked') || false;
            common.setAttribute(['general', Constants.prefersDriveRedirectKey], val, function() {
                $spinner.hide();
                $ok.show();
                sframeChan.query("Q_SET_DRIVE_REDIRECT_PREFERENCE", {
                    value: val,
                }, console.log);
            });
        });

        $cbox.appendTo($div);

        $ok.hide().appendTo($cbox);
        $spinner.hide().appendTo($cbox);

        if (privateData.prefersDriveRedirect === true) {
            $checkbox[0].checked = true;
        }
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
                var ui = Backup.createExportUI(privateData.origin);

                var bu = Backup.create(data, common.getPad, privateData.fileHost, function(blob, errors) {
                    saveAs(blob, filename);
                    sframeChan.event('EV_CRYPTGET_DISCONNECT');
                    ui.complete(function() {
                        Feedback.send('FULL_DRIVE_EXPORT_COMPLETE');
                        saveAs(blob, filename);
                    }, errors);
                }, ui.update, common.getCache(), common.getSframeChannel());
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
    makeBlock('trim-history', function(cb, $div) { // Msg.settings_trimHistoryHint, .settings_trimHistoryTitle
        if (!common.isLoggedIn()) { return void cb(false); }
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
        $('<span>', { 'class': 'cp-default-label' }).text(Messages.settings_padWidth).appendTo($div);

        $('<span>', { 'class': 'cp-sidebarlayout-description' })
            .text(Messages.settings_padWidthHint).appendTo($div);

        var $ok = $('<span>', { 'class': 'fa fa-check', title: Messages.saved });
        var $spinner = $('<span>', { 'class': 'fa fa-spinner fa-pulse' });

        var store = window.cryptpadStore;
        var key = 'pad-small-width';
        var isHidden = store.store[key] === '1';

        var $cbox = $(UI.createCheckbox('cp-settings-padwidth',
            Messages.settings_padWidthLabel,
            isHidden, { label: { class: 'noTitle' } }));
        var $checkbox = $cbox.find('input').on('change', function() {
            $spinner.show();
            $ok.hide();
            var val = $checkbox.is(':checked');
            store.put(key, val ? '1' : '0', function () {
                $spinner.hide();
                $ok.show();
            });
        });
        $cbox.appendTo($div);

        $ok.hide().appendTo($cbox);
        $spinner.hide().appendTo($cbox);

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

    makeBlock('pad-notif', function(cb) { // Msg.settings_padNotifHint, .settings_padNotifTitle
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

    create['pad-openlink'] = function() {
        var $div = $('<div>', {
            'class': 'cp-settings-pad-openlink cp-sidebarlayout-element'
        });
        $('<label>').text(Messages.settings_padOpenLinkTitle).appendTo($div);
        $('<span>', { 'class': 'cp-sidebarlayout-description' })
            .text(Messages.settings_padOpenLinkHint).appendTo($div);

        var $ok = $('<span>', { 'class': 'fa fa-check', title: Messages.saved });
        var $spinner = $('<span>', { 'class': 'fa fa-spinner fa-pulse' });

        var $cbox = $(UI.createCheckbox('cp-settings-pad-openlink',
            Messages.settings_padOpenLinkLabel,
            false, { label: { class: 'noTitle' } }));
        var $checkbox = $cbox.find('input').on('change', function() {
            $spinner.show();
            $ok.hide();
            var val = $checkbox.is(':checked');
            common.setAttribute(['pad', 'openLink'], val, function() {
                $spinner.hide();
                $ok.show();
            });
        });
        $cbox.appendTo($div);

        $ok.hide().appendTo($cbox);
        $spinner.hide().appendTo($cbox);

        common.getAttribute(['pad', 'openLink'], function(e, val) {
            if (e) { return void console.error(e); }
            if (val) {
                $checkbox.attr('checked', 'checked');
            }
        });
        return $div;
    };

    // Code settings

    create['code-indent-unit'] = function() {
        var $div = $('<div>', {
            'class': 'cp-settings-code-indent-unit cp-sidebarlayout-element'
        });
        $('<label>')
            .text(Messages.settings_codeIndentation)
            .attr('for', 'indent-unit')
            .appendTo($div);

        var $inputBlock = $('<div>', {
            'class': 'cp-sidebarlayout-input',
        }).appendTo($div);

        var $input = $('<input>', {
            'min': 1,
            'max': 8,
            type: 'number',
            id: 'indent-unit',
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
        $('<label>')
            .text(Messages.settings_codeFontSize)
            .attr('for', 'font-size')
            .appendTo($div);

        var $inputBlock = $('<div>', {
            'class': 'cp-sidebarlayout-input',
        }).appendTo($div);

        var $input = $('<input>', {
            'min': 8,
            'max': 30,
            type: 'number',
            id: 'font-size',
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


    makeBlock('kanban-tags', function(cb) { // Msg.settings_kanbanTagsHint, .settings_kanbanTagsTitle

        var opt1 = UI.createRadio('cp-settings-kanban-tags', 'cp-settings-kanban-tags-and',
            Messages.settings_kanbanTagsAnd, false, {
                input: { value: 1 },
                label: { class: 'noTitle' }
            });
        var opt2 = UI.createRadio('cp-settings-kanban-tags', 'cp-settings-kanban-tags-or',
            Messages.settings_kanbanTagsOr, true, {
                input: { value: 0 },
                label: { class: 'noTitle' }
            });
        var div = h('div.cp-settings-radio-container', [
            opt1,
            opt2,
        ]);
        var $d = $(div);

        var spinner = UI.makeSpinner($d);

        $d.find('input[type="radio"]').on('change', function() {
            spinner.spin();
            var val = $('input:radio[name="cp-settings-kanban-tags"]:checked').val();
            val = Number(val) || 0;
            common.setAttribute(['kanban', 'tagsAnd'], val, function() {
                spinner.done();
            });
        });


        common.getAttribute(['kanban', 'tagsAnd'], function(e, val) {
            if (e) { return void console.error(e); }
            if (val) {
                $(opt1).find('input').attr('checked', 'checked');
            }
        });

        cb($d);
    }, true);

    makeBlock('notif-calendar', function(cb) { // Msg.settings_notifCalendarHint, .settings_notifCalendarTitle

        var $cbox = $(UI.createCheckbox('cp-settings-cache-2',
            Messages.settings_notifCalendarCheckbox,
            false, { label: { class: 'noTitle' } }));
        var spinner = UI.makeSpinner($cbox);

        var $checkbox = $cbox.find('input').on('change', function() {
            spinner.spin();
            var val = !$checkbox.is(':checked');
            common.setAttribute(['general', 'calendar', 'hideNotif'], val, function(e) {
                if (e) {
                    console.error(e);
                    // error: restore previous value
                    if (val) { $checkbox.attr('checked', ''); }
                    else { $checkbox.attr('checked', 'checked'); }
                    spinner.hide();
                    return void console.error(e);
                }
                spinner.done();
            });
        });

        common.getAttribute(['general', 'calendar', 'hideNotif'], function(e, val) {
            if (e) { return void console.error(e); }
            if (!val) {
                $checkbox.attr('checked', 'checked');
            }
        });

        cb($cbox[0]);
    }, true);

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

    var SIDEBAR_ICONS = {
        account: 'fa fa-user-o',
        drive: 'fa fa-hdd-o',
        cursor: 'fa fa-i-cursor',
        code: 'fa fa-file-code-o',
        pad: 'cptools cptools-richtext',
        security: 'fa fa-lock',
        subscription: 'fa fa-star-o',
        kanban: 'cptools cptools-kanban',
        style: 'cptools cptools-palette',
        notifications: 'fa fa-bell'
    };

    Messages.settings_cat_notifications = Messages.notificationsPage;
    var createLeftside = function() {
        var $categories = $('<div>', { 'class': 'cp-sidebarlayout-categories' })
            .appendTo(APP.$leftside);
        APP.$usage = $('<div>', { 'class': 'usage' }).appendTo(APP.$leftside);
        var active = privateData.category || 'account';
        if (!categories[active]) { active = 'account'; }
        Object.keys(categories).forEach(function(key) {
            var iconClass = SIDEBAR_ICONS[key];
            var icon;
            if (iconClass) {
                icon = h('span', {
                    class: iconClass,
                });
            }

            var $category = $(h('div.cp-sidebarlayout-category', {
                'tabindex': 0,
                'data-category': key
            }, [
                icon,
                Messages['settings_cat_' + key] || key,
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

        common.setTabTitle(Messages.settings_title);
        UI.removeLoadingScreen();
    });
});
