define([
    'jquery',
    '/common/toolbar3.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-interface.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/customize/messages.js',

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
    Util,
    Hash,
    Messages
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
            'cp-settings-userfeedback'
        ],
        'drive': [
            'cp-settings-backup-drive',
            'cp-settings-import-local-pads',
            'cp-settings-reset-drive'
        ],
        'pad': [
            'cp-settings-pad-width',
        ],
        'code': [
            'cp-settings-indent-unit',
            'cp-settings-indent-type'
        ]
    };

    var createInfoBlock = function () {
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
    var createDisplayNameInput = function () {
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

    var createIndentUnitSelector = function () {
        var $div = $('<div>', {
            'class': 'cp-settings-indent-unit cp-sidebarlayout-element'
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

    var createIndentTypeSelector = function () {
        var key = 'indentWithTabs';

        var $div = $('<div>', {
            'class': 'cp-settings-indent-type cp-sidebarlayout-element'
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

    var createPadWidthSelector = function () {
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

    var createResetTips = function () {
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

    var createThumbnails = function () {
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

    var createBackupDrive = function () {
        var $div = $('<div>', {'class': 'cp-settings-backup-drive cp-sidebarlayout-element'});

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

    var createResetDrive = function () {
        var $div = $('<div>', {'class': 'cp-settings-reset-drive cp-sidebarlayout-element'});
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

    var createUserFeedbackToggle = function () {
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

    var createUsageButton = function () {
        common.createUsageBar(function (err, $bar) {
            if (err) { return void console.error(err); }
            APP.$usage.html('').append($bar);
        }, true);
    };

    var createLogoutEverywhere = function () {
        var $div = $('<div>', { 'class': 'cp-settings-logout-everywhere cp-sidebarlayout-element'});
        $('<label>', { 'for': 'cp-settings-logout-everywhere'})
            .text(Messages.settings_logoutEverywhereTitle).appendTo($div);
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

    var createImportLocalPads = function () {
        if (!common.isLoggedIn()) { return; }
        var $div = $('<div>', {'class': 'cp-settings-import-local-pads cp-sidebarlayout-element'});
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

    var createLanguageSelector = function () {
        var $div = $('<div>', {'class': 'cp-settings-language-selector cp-sidebarlayout-element'});
        $('<label>').text(Messages.language).appendTo($div);
        var $b = common.createLanguageSelector($div);
        $b.find('button').addClass('btn btn-secondary');
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
        APP.$usage = $('<div>', {'class': 'usage'}).appendTo(APP.$leftside);
        var active = 'account';
        Object.keys(categories).forEach(function (key) {
            var $category = $('<div>', {'class': 'cp-sidebarlayout-category'}).appendTo($categories);
            if (key === 'account') { $category.append($('<span>', {'class': 'fa fa-user-o'})); }
            if (key === 'drive') { $category.append($('<span>', {'class': 'fa fa-hdd-o'})); }
            if (key === 'code') { $category.append($('<span>', {'class': 'fa fa-file-code-o' })); }
            if (key === 'pad') { $category.append($('<span>', {'class': 'fa fa-file-word-o' })); }

            if (key === active) {
                $category.addClass('cp-leftside-active');
            }

            $category.click(function () {
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
        $rightside.append(createInfoBlock());
        $rightside.append(createDisplayNameInput());
        $rightside.append(createLanguageSelector());
        $rightside.append(createIndentUnitSelector());
        $rightside.append(createIndentTypeSelector());

        if (common.isLoggedIn()) {
            $rightside.append(createLogoutEverywhere());
        }
        $rightside.append(createResetTips());
        $rightside.append(createThumbnails());
        $rightside.append(createBackupDrive());
        $rightside.append(createImportLocalPads());
        $rightside.append(createResetDrive());
        $rightside.append(createUserFeedbackToggle());
        $rightside.append(createPadWidthSelector());

        // TODO RPC
        //obj.proxy.on('change', [], refresh);
        //obj.proxy.on('remove', [], refresh);
        //Cryptpad.onDisplayNameChanged(refresh);

        createLeftside();
        createUsageButton();

        UI.removeLoadingScreen();
    });
});
