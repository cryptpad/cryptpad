define([
    'jquery',
    '/common/cryptpad-common.js',
], function ($, Cryptpad) {

    var APP = window.APP = {
        Cryptpad: Cryptpad,
        _onRefresh: []
    };

    var Messages = Cryptpad.Messages;

    var comingSoon = function () {
        var $div = $('<div>', { 'class': 'coming-soon' })
            .text(Messages.comingSoon)
            .append('<br>');
            console.log($div);
        return $div;
    };

    var andThen = function () {
        console.log(APP.$container);
        APP.$container.append(comingSoon());
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

            //var storeObj = Cryptpad.getStore().getProxy && Cryptpad.getStore().getProxy().proxy
            //               ? Cryptpad.getStore().getProxy() : undefined;

            //andThen(storeObj);
            andThen();
            Cryptpad.reportAppUsage();
        });
    });

});
