define([
    'jquery',
    '/common/cryptpad-common.js',
    '/common/cryptget.js',
    '/common/mergeDrive.js',
    '/common/toolbar2.js',
    '/bower_components/file-saver/FileSaver.min.js',

    'less!/customize/src/less/cryptpad.less',
    'less!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'less!/customize/src/less/toolbar.less',
    'less!/settings/main.less',
], function ($, Cryptpad, Crypt, Merge, Toolbar) {
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

    var categories = {
        'account': [
            'infoBlock',
            'displayName',
            'languageSelector',
            'logoutEverywhere',
            'resetTips',
            'userFeedback'
        ],
        'drive': [
            'backupDrive',
            'importLocalPads',
            'resetDrive'
        ],
        'code': [
            'indentUnit',
            'indentType'
        ]
    };

    var createInfoBlock = function (store) {
        var obj = store.proxy;
        var $div = $('<div>', {'class': 'infoBlock'});

        var $account = $('<div>', {'class': 'element'}).appendTo($div);
        var accountName = obj.login_name || localStorage[Cryptpad.userNameKey];
        var $label = $('<span>', {'class': 'label'}).text(Messages.user_accountName);
        var $name = $('<span>').text(accountName || '');
        if (!accountName) {
            $label.text('');
            $name.text(Messages.settings_anonymous);
        }
        $account.append($label).append($name);

        var publicKey = obj.edPublic;
        if (publicKey) {
            var $key = $('<div>', {'class': 'element'}).appendTo($div);
            var userHref = Cryptpad.getUserHrefFromKeys(accountName, publicKey);
            var $pubLabel = $('<span>', {'class': 'label'})
                .text(Messages.settings_publicSigningKey);
            $key.append($pubLabel).append(Cryptpad.dialog.selectable(userHref));
        }

        return $div;
    };

    // Create the block containing the display name field
    var createDisplayNameInput = function (store) {
        var obj = store.proxy;
        var $div = $('<div>', {'class': 'displayName element'});
        $('<label>', {'for' : 'displayName'}).text(Messages.user_displayName).appendTo($div);
        var $inputBlock = $('<div>', {'class': 'inputBlock'}).appendTo($div);
        var $input = $('<input>', {
            'type': 'text',
            'id': 'displayName',
            'placeholder': Messages.anonymous}).appendTo($inputBlock);
        var $save = $('<button>', {'class': 'btn btn-primary'}).text(Messages.settings_save).appendTo($inputBlock);
        var $ok = $('<span>', {'class': 'fa fa-check', title: Messages.saved}).hide().appendTo($div);
        var $spinner = $('<span>', {'class': 'fa fa-spinner fa-pulse'}).hide().appendTo($div);

        var displayName = obj[USERNAME_KEY] || '';
        $input.val(displayName);

        // When the display name is changed (enter or button clicked)
        var todo = function () {
            displayName = $input.val();
            if (displayName === obj[USERNAME_KEY]) { return; }
            obj[USERNAME_KEY] = displayName;
            Cryptpad.changeDisplayName(displayName);
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
    var createIndentUnitSelector = function (obj) {
        var proxy = obj.proxy;
        proxy.settings = proxy.settings || {};

        var $div = $('<div>', {
            'class': 'indentUnit element'
        });
        $('<label>').text(Messages.settings_codeIndentation).appendTo($div);

        var $inputBlock = $('<div>', {
            'class': 'inputBlock',
        }).appendTo($div);

        var $input = $('<input>', {
            'min': 1,
            'max': 8,
            type: 'number',
        }).on('change', function () {
            var val = parseInt($input.val());
            if (typeof(val) !== 'number') { return; }
            Cryptpad.setAttribute(['codemirror', 'indentUnit'], val);
        }).appendTo($inputBlock);

        proxy.on('change', [ 'settings', 'codemirror', 'indentUnit', ], function (o, n) {
            $input.val(n);
        });

        Cryptpad.getAttribute(['codemirror', 'indentUnit'], function (e, val) {
            if (e) { return void console.error(e); }
            if (typeof(val) !== 'number') {
                $input.val(2);
            } else {
                $input.val(val);
            }
        });
        return $div;
    };

    var createIndentTypeSelector = function (obj) {
        var proxy = obj.proxy;
        proxy.settings = proxy.settings || {};

        var key = 'indentWithTabs';

        var $div = $('<div>', {
            'class': 'indentType element'
        });
        $('<label>').text(Messages.settings_codeUseTabs).appendTo($div);

        var $inputBlock = $('<div>', {
            'class': 'inputBlock',
        }).css('flex-flow', 'column')
        .appendTo($div);

        var $input = $('<input>', {
            type: 'checkbox',
        }).on('change', function () {
            var val = $input.is(':checked');
            if (typeof(val) !== 'boolean') { return; }
            Cryptpad.setAttribute(['codemirror', key], val);
        }).appendTo($inputBlock);

        $input[0].checked = !!proxy.settings[key];
        proxy.on('change', ['settings', 'codemirror', key], function (o, n) {
            $input[0].checked = !!n;
        });

        Cryptpad.getAttribute(['codemirror', key], function (e, val) {
            if (e) { return void console.error(e); }
            $input[0].checked = !!val;
        });
        return $div;
    };

    var createResetTips = function () {
        var $div = $('<div>', {'class': 'resetTips element'});
        $('<label>', {'for' : 'resetTips'}).text(Messages.settings_resetTips).appendTo($div);
        $('<span>', {'class': 'description'})
            .text(Messages.settings_resetTipsButton).appendTo($div);
        var $button = $('<button>', {'id': 'resetTips', 'class': 'btn btn-primary'})
            .text(Messages.settings_resetTipsAction).appendTo($div);

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
        var $div = $('<div>', {'class': 'backupDrive element'});

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

        $('<label>', {'for' : 'exportDrive'}).text(Messages.settings_backupCategory).appendTo($div);
        $('<span>', {'class': 'description'})
            .text(Messages.settings_backupTitle).appendTo($div);
        /* add an export button */
        var $export = Cryptpad.createButton('export', true, {}, exportFile);
        $export.attr('class', 'btn btn-success').text(Messages.settings_backup);
        $div.append($export);

        /* add an import button */
        var $import = Cryptpad.createButton('import', true, {}, importFile);
        $import.attr('class', 'btn btn-success').text(Messages.settings_restore);
        $div.append($import);

        return $div;
    };

    var createResetDrive = function (obj) {
        var $div = $('<div>', {'class': 'resetDrive element'});
        $('<label>', {'for' : 'resetDrive'}).text(Messages.settings_resetNewTitle).appendTo($div);
        $('<span>', {'class': 'description'})
            .text(Messages.settings_reset).appendTo($div);
        var $button = $('<button>', {'id': 'resetDrive', 'class': 'btn btn-danger'})
            .text(Messages.settings_resetButton).appendTo($div);

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
        var $div = $('<div>', { 'class': 'userFeedback element'});

        $('<span>', {'class': 'label'}).text(Messages.settings_userFeedbackTitle).appendTo($div);

        var $label = $('<label>', { 'for': 'userFeedback', 'class': 'noTitle' })
            .text(Messages.settings_userFeedback);

        $('<span>', {'class': 'description'})
            .append(Messages.settings_userFeedbackHint1)
            .append(Messages.settings_userFeedbackHint2).appendTo($div);

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

    var createUsageButton = function () {
        Cryptpad.createUsageBar(function (err, $bar) {
            if (err) { return void console.error(err); }
            APP.$usage.html('').append($bar);
        }, true);
    };

    var createLogoutEverywhere = function (obj) {
        var proxy = obj.proxy;
        var $div = $('<div>', { 'class': 'logoutEverywhere element'});
        $('<label>', { 'for': 'logoutEverywhere'})
            .text(Messages.settings_logoutEverywhereTitle).appendTo($div);
        $('<span>', {'class': 'description'})
            .text(Messages.settings_logoutEverywhere).appendTo($div);
        var $button = $('<button>', { id: 'logoutEverywhere', 'class': 'btn btn-primary' })
            .text(Messages.settings_logoutEverywhereButton)
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
        var $div = $('<div>', {'class': 'importLocalPads element'});
        $('<label>', {'for' : 'importLocalPads'}).text(Messages.settings_import).appendTo($div);
        $('<span>', {'class': 'description'})
            .text(Messages.settings_importTitle).appendTo($div);
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
        var $div = $('<div>', {'class': 'languageSelector element'});
        $('<label>').text(Messages.language).appendTo($div);
        var $b = Cryptpad.createLanguageSelector().appendTo($div);
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
        var $categories = $('<div>', {'class': 'categories'}).appendTo(APP.$leftside);
        APP.$usage = $('<div>', {'class': 'usage'}).appendTo(APP.$leftside);
        var active = 'account';
        Object.keys(categories).forEach(function (key) {
            var $category = $('<div>', {'class': 'category'}).appendTo($categories);
            if (key === 'account') { $category.append($('<span>', {'class': 'fa fa-user-o'})); }
            if (key === 'drive') { $category.append($('<span>', {'class': 'fa fa-hdd-o'})); }
            if (key === 'code') { $category.append($('<span>', {'class': 'fa fa-file-code-o' })); }

            if (key === active) {
                $category.addClass('active');
            }

            $category.click(function () {
                active = key;
                $categories.find('.active').removeClass('active');
                $category.addClass('active');
                showCategories(categories[key]);
            });

            $category.append(Messages['settings_cat_'+key]);
        });
        showCategories(categories[active]);
    };

    var createToolbar = function () {
        var displayed = ['useradmin', 'newpad', 'limit', 'upgrade', 'pageTitle'];
        var configTb = {
            displayed: displayed,
            ifrw: window,
            common: Cryptpad,
            $container: APP.$toolbar,
            pageTitle: Messages.settings_title
        };
        var toolbar = APP.toolbar = Toolbar.create(configTb);
        toolbar.$rightside.html(''); // Remove the drawer if we don't use it to hide the toolbar
    };

    var andThen = function (obj) {
        APP.$leftside = $('<div>', {id: 'leftSide'}).appendTo(APP.$container);
        var $rightside = APP.$rightside = $('<div>', {id: 'rightSide'}).appendTo(APP.$container);

        createToolbar();

        //$rightside.append(createTitle());
        $rightside.append(createInfoBlock(obj));
        $rightside.append(createDisplayNameInput(obj));
        $rightside.append(createLanguageSelector());
        $rightside.append(createIndentUnitSelector(obj));
        $rightside.append(createIndentTypeSelector(obj));

        if (Cryptpad.isLoggedIn()) {
            $rightside.append(createLogoutEverywhere(obj));
        }
        $rightside.append(createResetTips());
        $rightside.append(createBackupDrive(obj));
        $rightside.append(createImportLocalPads(obj));
        $rightside.append(createResetDrive(obj));
        $rightside.append(createUserFeedbackToggle(obj));

        obj.proxy.on('change', [], refresh);
        obj.proxy.on('remove', [], refresh);
        Cryptpad.onDisplayNameChanged(refresh);

        createLeftside();
        createUsageButton();

        Cryptpad.removeLoadingScreen();
    };

    $(function () {
        $(window).click(function () {
            $('.cp-dropdown-content').hide();
        });

        APP.$container = $('#container');
        APP.$toolbar = $('#toolbar');

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
