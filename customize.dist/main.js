define([
    '/customize/messages.js',
    '/customize/application_config.js',
    '/common/cryptpad-common.js',
    '/bower_components/lil-uri/uri.min.js',
    '/customize/languageSelector.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Messages, Config, Cryptpad, LilUri, LS) {
    var $ = window.$;
    var $main = $('#mainBlock');

    var APP = window.APP = {
        Cryptpad: Cryptpad,
    };

    // Language selector
    var $sel = $('#language-selector');
    Cryptpad.createLanguageSelector(undefined, $sel);
    $sel.find('button').addClass('btn').addClass('btn-secondary');
    $sel.show();

    $(window).click(function () {
        $('.cryptpad-dropdown').hide();
    });

    // main block is hidden in case javascript is disabled
    $main.removeClass('hidden');

    // Make sure we don't display non-translated content (empty button)
    $main.find('#data').removeClass('hidden');

    if (Cryptpad.isLoggedIn()) {
        var name = localStorage[Cryptpad.userNameKey] || sessionStorage[Cryptpad.userNameKey];
        var $loggedInBlock = $main.find('#loggedIn');
        var $hello = $loggedInBlock.find('#loggedInHello');
        var $logout = $loggedInBlock.find('#loggedInLogOut');

        $hello.text(Messages._getKey('login_hello', [name]));
        $('#buttons').find('.nologin').hide();

        $logout.click(function () {
            Cryptpad.logout(function () {
                window.location.reload();
            });
        });

        $loggedInBlock.removeClass('hidden');
        //return;
    } else {
        $main.find('#userForm').removeClass('hidden');
    }

    var displayCreateButtons = function () {
        var $parent = $('#buttons');
        var options = [];
        Config.availablePadTypes.forEach(function (el) {
            if (el === 'drive') { return; }
            options.push({
                tag: 'a',
                attributes: {
                    'class': 'newdoc',
                    'href': '/' + el,
                    'target': '_blank'
                },
                content: Messages['button_new' + el] // Pretty name of the language value
            });
        });
        var dropdownConfig = {
            text: Messages.makeAPad, // Button initial text
            options: options, // Entries displayed in the menu
        };
        var $block = Cryptpad.createDropdown(dropdownConfig);
        $block.find('button').addClass('btn').addClass('btn-success');
        $block.appendTo($parent);
    };
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

