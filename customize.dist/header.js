define([
    'jquery',
    '/customize/application_config.js',
    '/common/cryptpad-common.js',
    '/api/config',
], function ($, Config, Cryptpad, ApiConfig) {

    window.APP = {
        Cryptpad: Cryptpad,
    };

    var Messages = Cryptpad.Messages;

    $(function () {
        // Language selector
        var $sel = $('#language-selector');
        Cryptpad.createLanguageSelector(undefined, $sel);
        $sel.find('button').addClass('btn').addClass('btn-secondary');
        $sel.show();

        var $upgrade = $('#upgrade');

        var showUpgrade = function (text, feedback, url) {
            if (ApiConfig.removeDonateButton) { return; }
            if (localStorage.plan) { return; }
            if (!text) { return; }
            $upgrade.text(text).show();
            $upgrade.click(function () {
                Cryptpad.feedback(feedback);
                window.open(url,'_blank');
            });
        };

        // User admin menu
        var $userMenu = $('#user-menu');
        var userMenuCfg = {
            $initBlock: $userMenu,
            'static': true
        };
        var $userAdmin = Cryptpad.createUserAdminMenu(userMenuCfg);
        $userAdmin.find('button').addClass('btn').addClass('btn-secondary');

        $(window).click(function () {
            $('.cp-dropdown-content').hide();
        });

        if (Cryptpad.isLoggedIn() && ApiConfig.allowSubscriptions) {
            showUpgrade(Messages.upgradeAccount, "HOME_UPGRADE_ACCOUNT", Cryptpad.upgradeURL);
        } else {
            showUpgrade(Messages.supportCryptpad, "HOME_SUPPORT_CRYPTPAD", Cryptpad.donateURL);
        }
    });
});

