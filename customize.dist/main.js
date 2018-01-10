define([
    'jquery',
    '/common/outer/local-store.js',
    '/customize/messages.js',
], function ($, LocalStore, Messages) {

    $(function () {
        var $main = $('#mainBlock');

        // main block is hidden in case javascript is disabled
        $main.removeClass('hidden');

        // Make sure we don't display non-translated content (empty button)
        $main.find('#data').removeClass('hidden');

        if (LocalStore.isLoggedIn()) {
            if (window.location.pathname === '/') {
                window.location = '/drive/';
                return;
            }

            $main.find('a[href="/drive/"] div.pad-button-text h4')
                .text(Messages.main_yourCryptDrive);
        }
        $(window).click(function () {
            $('.cp-dropdown-content').hide();
        });
    });
});
