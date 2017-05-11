define([
    'jquery',
    '/common/cryptpad-common.js',
    '/common/cryptget.js',
    '/common/mergeDrive.js',
    '/bower_components/file-saver/FileSaver.min.js'
], function ($, Cryptpad, Crypt, Merge) {
    var saveAs = window.saveAs;

    var USERNAME_KEY = 'cryptpad.username';

    var APP = window.APP = {
        Cryptpad: Cryptpad,
        _onRefresh: []
    };

    var Messages = Cryptpad.Messages;

    // Manage changes in the realtime object made from another page
    var onRefresh = function (h) {
        if (typeof(h) !== "function") { return; }
        if (APP._onRefresh.indexOf(h) !== -1) { return; }
        APP._onRefresh.push(h);
    };
    var refresh = APP.refresh = function () {
        APP._onRefresh.forEach(function (h) {
            h();
        });
    };

    // Title block
    var createTitle = function () {
        return $('<h1>').text(Messages.settings_title);
    };

    var createInfoBlock = function (store) {
        var obj = store.proxy;
        var $div = $('<div>', {'class': 'infoBlock'});

        var accountName = obj.login_name || localStorage[Cryptpad.userNameKey];
        var $label = $('<span>', {'class': 'label'}).text(Messages.user_accountName + ':');
        var $name = $('<span>').text(accountName || '');
        if (!accountName) {
            $label.text('');
            $name.text(Messages.settings_anonymous);
        }

        $div.append($label).append($name);

        var publicKey = obj.edPublic;
        if (publicKey) {
            var $pubLabel = $('<span>', {'class': 'label'})
                .text(Messages.settings_publicSigningKey + ':');
            var $pubKey = $('<input>', {type: 'text', readonly: true})
                .css({
                    width: '28em'
                })
                .val(publicKey);
            $div.append('<br>').append($pubLabel).append($pubKey);
        }


        return $div;
    };

    // Create the block containing the display name field
    var createDisplayNameInput = function (store) {
        var obj = store.proxy;
        var $div = $('<div>', {'class': 'displayName'});
        $('<label>', {'for' : 'displayName'}).text(Messages.user_displayName).appendTo($div);
        $('<br>').appendTo($div);
        var $input = $('<input>', {
            'type': 'text',
            'id': 'displayName',
            'placeholder': Messages.anonymous}).appendTo($div);
        var $save = $('<button>', {'class': 'btn btn-primary'}).text(Messages.settings_save).appendTo($div);
        var $ok = $('<span>', {'class': 'fa fa-check', title: Messages.saved}).hide().appendTo($div);
        var $spinner = $('<span>', {'class': 'fa fa-spinner fa-pulse'}).hide().appendTo($div);

        var displayName = obj[USERNAME_KEY] || '';
        $input.val(displayName);

        // When the display name is changed (enter or button clicked)
        var todo = function () {
            displayName = $input.val();
            if (displayName === obj[USERNAME_KEY]) { return; }
            obj[USERNAME_KEY] = displayName;
            $spinner.show();
            Cryptpad.whenRealtimeSyncs(store.info.realtime, function () {
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
            if (obj[USERNAME_KEY] !== $input.val()) {
                $input.val(obj[USERNAME_KEY]);
                $input.focusout();
            }
        };
        onRefresh(onChange);

        return $div;
    };
    var createResetTips = function () {
        var $div = $('<div>', {'class': 'resetTips'});
        $('<label>', {'for' : 'resetTips'}).text(Messages.settings_resetTips).appendTo($div);
        $('<br>').appendTo($div);
        var $button = $('<button>', {'id': 'resetTips', 'class': 'btn btn-primary'})
            .text(Messages.settings_resetTipsButton).appendTo($div);

        $button.click(function () {
            Object.keys(localStorage).forEach(function (k) {
                if(k.slice(0, 9) === "hide-info") {
                    delete localStorage[k];
                }
            });
            Cryptpad.alert(Messages.settings_resetTipsDone);
        });

        return $div;
    };
    var createBackupDrive = function (store) {
        var obj = store.proxy;
        var $div = $('<div>', {'class': 'backupDrive'});

        var exportFile = function () {
            var sjson = JSON.stringify(obj);
            var name = obj.login_name || obj[USERNAME_KEY] || Messages.anonymous;
            var suggestion = name + '-' + new Date().toDateString();
            Cryptpad.prompt(Cryptpad.Messages.exportPrompt,
                Cryptpad.fixFileName(suggestion) + '.json', function (filename) {
                if (!(typeof(filename) === 'string' && filename)) { return; }
                var blob = new Blob([sjson], {type: "application/json;charset=utf-8"});
                saveAs(blob, filename);
            });
        };
        var importFile = function (content) {
            var $spinner = $('<span>', {'class': 'fa fa-spinner fa-pulse'}).appendTo($div);
            Crypt.put(Cryptpad.getUserHash() || localStorage[Cryptpad.fileHashKey], content, function (e) {
                if (e) { console.error(e); }
                $spinner.remove();
            });
        };

        $('<label>', {'for' : 'exportDrive'}).text(Messages.settings_backupTitle).appendTo($div);
        $('<br>').appendTo($div);
        /* add an export button */
        var $export = Cryptpad.createButton('export', true, {}, exportFile);
        $export.addClass('btn').addClass('btn-success').append(Messages.settings_backup);
        $div.append($export);

        /* add an import button */
        var $import = Cryptpad.createButton('import', true, {}, importFile);
        $import.addClass('btn').addClass('btn-warning').append(Messages.settings_restore);
        $div.append($import);

        return $div;
    };

    var createResetDrive = function (obj) {
        var $div = $('<div>', {'class': 'resetDrive'});
        $('<label>', {'for' : 'resetDrive'}).text(Messages.settings_resetTitle).appendTo($div);
        $('<br>').appendTo($div);
        var $button = $('<button>', {'id': 'resetDrive', 'class': 'btn btn-danger'})
            .text(Messages.settings_reset).appendTo($div);

        $button.click(function () {
            Cryptpad.prompt(Messages.settings_resetPrompt, "", function (val) {
                if (val !== "I love CryptPad") {
                    Cryptpad.alert(Messages.settings_resetError);
                    return;
                }
                obj.proxy.drive = Cryptpad.getStore().getEmptyObject();
                Cryptpad.alert(Messages.settings_resetDone);
            }, undefined, true);
        });

        return $div;
    };

    var createUserFeedbackToggle = function (obj) {
        var $div = $('<div>', { 'class': 'userFeedback', });
        var $label = $('<label>', { 'for': 'userFeedback'})
            .text(Messages.settings_userFeedback);

        $div.html('<hr />' + Messages.settings_userFeedbackHint1 + '<br />' +
            Messages.settings_userFeedbackHint2).appendTo($div);

        $('<br>').appendTo($div);

        var $ok = $('<span>', {'class': 'fa fa-check', title: Messages.saved});
        var $spinner = $('<span>', {'class': 'fa fa-spinner fa-pulse'});

        var $checkbox = $('<input>', {
            'type': 'checkbox',
        }).on('change', function () {
            $spinner.show();
            $ok.hide();
            obj.proxy.allowUserFeedback = $checkbox.is(':checked') || false;
            Cryptpad.whenRealtimeSyncs(obj.info.realtime, function () {
                $spinner.hide();
                $ok.show();
            });
        });

        $checkbox.appendTo($div);
        $label.appendTo($div);

        $ok.hide().appendTo($div);
        $spinner.hide().appendTo($div);

        if (obj.proxy.allowUserFeedback) {
            $checkbox[0].checked = true;
        }
        return $div;
    };

    var createUsageButton = function (obj) {
        var proxy = obj.proxy;

        var $div = $('<div>', { 'class': 'pinned-usage' })
            .text(Messages.settings_usageTitle)
            .append('<br>');

        $('<button>', {
            'class': 'btn btn-primary', // fa fa-hdd-o ?
        })
        .text(Messages.settings_usage)
        .click(function () {
            if (!(proxy.edPublic && proxy.edPrivate)) {
                // suggest that they login/register
                Cryptpad.alert(Messages.settings_pinningNotAvailable);
                return;
            }
            Cryptpad.getPinnedUsage(function (e, bytes) {
                if (e) {
                    Cryptpad.alert(Messages.settings_pinningError);
                    return;
                }
                Cryptpad.alert(Messages._getKey('settings_usageAmount', [Cryptpad.bytesToMegabytes(bytes)]));
            });
        })
        .appendTo($div);

        return $div;
    };

    var createLogoutEverywhere = function (obj) {
        var proxy = obj.proxy;
        var $div = $('<div>', { 'class': 'logoutEverywhere', });
        $('<label>', { 'for': 'logoutEverywhere'})
            .text(Messages.settings_logoutEverywhereTitle).appendTo($div);
        $('<br>').appendTo($div);
        var $button = $('<button>', { id: 'logoutEverywhere', 'class': 'btn btn-primary' })
            .text(Messages.settings_logoutEverywhere)
            .appendTo($div);
        var $ok = $('<span>', {'class': 'fa fa-check', title: Messages.saved}).hide().appendTo($div);
        var $spinner = $('<span>', {'class': 'fa fa-spinner fa-pulse'}).hide().appendTo($div);

        $button.click(function () {
            var realtime = obj.info.realtime;
            console.log(realtime);

            Cryptpad.confirm(Messages.settings_logoutEverywhereConfirm, function (yes) {
                if (!yes) { return; }
                $spinner.show();
                $ok.hide();

                var token = Math.floor(Math.random()*Number.MAX_SAFE_INTEGER);
                localStorage.setItem('loginToken', token);
                proxy.loginToken = token;

                Cryptpad.whenRealtimeSyncs(realtime, function () {
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

    var createImportLocalPads = function (obj) {
        if (!Cryptpad.isLoggedIn()) { return; }
        var $div = $('<div>', {'class': 'importLocalPads'});
        $('<label>', {'for' : 'importLocalPads'}).text(Messages.settings_importTitle).appendTo($div);
        $('<br>').appendTo($div);
        var $button = $('<button>', {'id': 'importLocalPads', 'class': 'btn btn-primary'})
            .text(Messages.settings_import).appendTo($div);
        var $ok = $('<span>', {'class': 'fa fa-check', title: Messages.saved}).hide().appendTo($div);
        var $spinner = $('<span>', {'class': 'fa fa-spinner fa-pulse'}).hide().appendTo($div);

        $button.click(function () {
            Cryptpad.confirm(Messages.settings_importConfirm, function (yes) {
                if (!yes) { return; }
                $spinner.show();
                $ok.hide();
                Merge.anonDriveIntoUser(obj.proxy, function () {
                    $spinner.hide();
                    $ok.show();
                    Cryptpad.alert(Messages.settings_importDone);
                });
            }, undefined, true);
        });

        return $div;
    };

    var createLanguageSelector = function () {
        var $div = $('<div>', {'class': 'importLocalPads'});
        $('<label>').text(Messages.language).appendTo($div);
        $('<br>').appendTo($div);
        var $b = Cryptpad.createLanguageSelector().appendTo($div);
        $b.find('button').addClass('btn btn-secondary');
        return $div;
    };

    var andThen = function (obj) {
        APP.$container.append(createTitle());
        APP.$container.append(createInfoBlock(obj));
        APP.$container.append(createDisplayNameInput(obj));
        APP.$container.append(createLanguageSelector());

        if (Cryptpad.isLoggedIn()) {
            APP.$container.append(createLogoutEverywhere(obj));
        }
        APP.$container.append(createResetTips());
        APP.$container.append(createBackupDrive(obj));
        APP.$container.append(createImportLocalPads(obj));
        APP.$container.append(createResetDrive(obj));
        APP.$container.append(createUsageButton(obj));
        APP.$container.append(createUserFeedbackToggle(obj));
        obj.proxy.on('change', [], refresh);
        obj.proxy.on('remove', [], refresh);
    };

    $(function () {
        var $main = $('#mainBlock');
        // Language selector
        var $sel = $('#language-selector');
        Cryptpad.createLanguageSelector(undefined, $sel);
        $sel.find('button').addClass('btn').addClass('btn-secondary');
        $sel.show();

        // User admin menu
        var $userMenu = $('#user-menu');
        var userMenuCfg = {
            $initBlock: $userMenu
        };
        var $userAdmin = Cryptpad.createUserAdminMenu(userMenuCfg);
        $userAdmin.find('button').addClass('btn').addClass('btn-secondary');

        $(window).click(function () {
            $('.cryptpad-dropdown').hide();
        });

        // main block is hidden in case javascript is disabled
        $main.removeClass('hidden');

        APP.$container = $('#container');

        Cryptpad.ready(function () {
            //if (!Cryptpad.getUserHash()) { return redirectToMain(); }

            var storeObj = Cryptpad.getStore().getProxy && Cryptpad.getStore().getProxy().proxy
                           ? Cryptpad.getStore().getProxy() : undefined;

            andThen(storeObj);
            Cryptpad.reportAppUsage();
        });
    });

    window.addEventListener('storage', function (e) {
        if (e.key !== Cryptpad.userHashKey) { return; }
        var o = e.oldValue;
        var n = e.newValue;
        window.location.reload();
        if (o && !n) { // disconnect
            //redirectToMain();
        }
    });
});
