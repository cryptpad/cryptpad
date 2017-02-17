define([
    '/common/cryptpad-common.js',
    '/common/cryptget.js',
    '/bower_components/file-saver/FileSaver.min.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Cryptpad, Crypt) {
    var $ = window.jQuery;
    var saveAs = window.saveAs;

    var USERNAME_KEY = 'cryptpad.username';

    var APP = {
        Cryptpad: Cryptpad,
        _onRefresh: []
    };

    var Messages = Cryptpad.Messages;

    var redirectToMain = function () {
        window.location.href = '/';
    };

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

        var accountName = obj.login_name;
        if (!accountName) { return; }
        var $label = $('<span>', {'class': 'label'}).text(Messages.user_accountName + ':');
        var $name = $('<span>').text(accountName);
        $div.append($label).append($name);

        return $div;
    };

    // Create the block containing the display name field
    var createDisplayNameInput = function (store) {
        var obj = store.proxy;
        var $div = $('<div>', {'class': 'displayName'});
        var $label = $('<label>', {'for' : 'displayName'}).text(Messages.user_displayName).appendTo($div);
        $('<br>').appendTo($div);
        var $input = $('<input>', {
            'type': 'text',
            'id': 'displayName',
            'placeholder': Messages.anonymous}).appendTo($div);
        var $save = $('<button>', {'class': 'btn btn-primary'}).text(Messages.settings_save).appendTo($div);
        var $ok = $('<span>', {'class': 'fa fa-check'}).appendTo($div);
        var $spinner = $('<span>', {'class': 'fa fa-spinner fa-pulse'}).appendTo($div);

        $spinner.hide();
        var displayName = obj[USERNAME_KEY] || '';
        $input.val(displayName);

        // When the display name is changed (enter or button clicked)
        var todo = function () {
            displayName = $input.val();
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
        var $label = $('<label>', {'for' : 'resetTips'}).text(Messages.settings_resetTips).appendTo($div);
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
            var suggestion = obj.login_name + '-' + new Date().toDateString();
            Cryptpad.prompt(Cryptpad.Messages.exportPrompt,
                Cryptpad.fixFileName(suggestion) + '.json', function (filename) {
                if (!(typeof(filename) === 'string' && filename)) { return; }
                var blob = new Blob([sjson], {type: "application/json;charset=utf-8"});
                saveAs(blob, filename);
            });
        };
        var importFile = function (content, file) {
            var $spinner = $('<span>', {'class': 'fa fa-spinner fa-pulse'}).appendTo($div);
            Crypt.put(Cryptpad.getUserHash(), content, function (e) {
                if (e) { console.error(e); }
                $spinner.remove();
            });
        };

        var $label = $('<label>', {'for' : 'exportDrive'}).text(Messages.settings_backupTitle).appendTo($div);
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
        var $label = $('<label>', {'for' : 'resetDrive'}).text(Messages.settings_resetTitle).appendTo($div);
        $('<br>').appendTo($div);
        var $button = $('<button>', {'id': 'resetDrive', 'class': 'btn btn-danger'})
            .text(Messages.settings_reset).appendTo($div);

        $button.click(function () {
            Cryptpad.prompt(Messages.settings_resetPrompt, "", function (val) {
                if (val !== "I love CryptPad") { return; }
                obj.proxy.drive = Cryptpad.getStore().getEmptyObject();
                Cryptpad.alert(Messages.settings_resetDone);
            });
        });

        return $div;
    };

    var andThen = function (obj) {
        APP.$container.append(createTitle());
        APP.$container.append(createInfoBlock(obj));
        APP.$container.append(createDisplayNameInput(obj));
        APP.$container.append(createResetTips());
        APP.$container.append(createBackupDrive(obj));
        APP.$container.append(createResetDrive(obj));
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
            if (!Cryptpad.getUserHash()) { return redirectToMain(); }

            var storeObj = Cryptpad.getStore().getProxy && Cryptpad.getStore().getProxy().proxy
                           ? Cryptpad.getStore().getProxy() : undefined;

            andThen(storeObj);
        });
    });

    window.addEventListener('storage', function (e) {
        var key = e.key;
        if (e.key !== Cryptpad.userHashKey) { return; }
        var o = e.oldValue;
        var n = e.newValue;
        if (o && !n) { // disconnect
            redirectToMain();
        }
    });
});

