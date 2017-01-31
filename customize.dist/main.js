define([
    '/customize/messages.js',
    '/customize/application_config.js',
    '/common/cryptpad-common.js',
    '/bower_components/lil-uri/uri.min.js',
    '/customize/languageSelector.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Messages, Config, Cryptpad, LilUri, LS) {
    if (Cryptpad.isLoggedIn()) {
        document.location.href = '/drive';
        return;
    }

    var $ = window.$;

    var USE_TABLE = Config.USE_HOMEPAGE_TABLE;
    var USE_FS_STORE = Config.USE_FS_STORE;

    var APP = window.APP = {
        Cryptpad: Cryptpad,
    };

    // main block is hidden in case javascript is disabled
    $('#mainBlock').removeClass('hidden');

    var padTypes = {
        '/pad/': Messages.type.pad,
        '/code/': Messages.type.code,
        '/poll/': Messages.type.poll,
        '/slide/': Messages.type.slide,
    };

    var now = new Date();
    var hasRecent = false;

    var displayCreateButtons = function () {
        var $parent = $('#buttons');
        Config.availablePadTypes.forEach(function (el) {
            $('#create-' + el).attr('target', '_blank').show();
        });
    };

    // Language selector
    var $sel = $('#language-selector');
    Cryptpad.createLanguageSelector(undefined, $sel);
    $sel.find('button').addClass('btn').addClass('btn-secondary');
    $sel.show();

    $(window).click(function () {
        $sel.find('.cryptpad-dropdown').hide();
    });

    var addButtonHandlers = function () {
        $('button.login').click(function (e) {
            var username = $('#name').val();
            var passwd = $('#password').val();
            var remember = $('#rememberme').is(':checked');
            sessionStorage.login_user = username;
            sessionStorage.login_pass = passwd;
            sessionStorage.login_rmb = remember;
            sessionStorage.login = 1;
            document.location.href = '/user';
        });
        $('button.register').click(function (e) {
            var username = $('#name').val();
            var passwd = $('#password').val();
            var remember = $('#rememberme').is(':checked');
            sessionStorage.login_user = username;
            sessionStorage.login_pass = passwd;
            sessionStorage.login_rmb = remember;
            sessionStorage.register = 1;
            document.location.href = '/user';
        });
        $('button.nologin').click(function (e) {
            document.location.href = '/drive';
        });
        $('button.knowmore').click(function (e) {
            e.preventDefault();

            $('html, body').animate({
                scrollTop: $('#knowmore').offset().top
            }, 500);
        });
        $('button.tryit').click(function (e) {
            e.preventDefault();

            $('html, body').animate({
                scrollTop: $('#tryit').offset().top
            }, 500);
        });

        var $passwd = $('#password');
        $passwd.on('keyup', function (e) {
            if (e.which !== 13) { return; } // enter
            $('button.login').click();
        });
    };

    displayCreateButtons();

    addButtonHandlers();
    console.log("ready");
});

