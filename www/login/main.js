define([
    '/common/cryptpad-common.js',
    '/customize/languageSelector.js',
    '/common/login.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Cryptpad, LS, Login) {
    var $ = window.$;

    var APP = window.APP = {
        Cryptpad: Cryptpad,
    };

    $(function () {
        var $main = $('#mainBlock');

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
            // already logged in, redirect to drive
            document.location.href = '/drive/';
            return;
        } else {
            $main.find('#userForm').removeClass('hidden');
        }

        /* Log in UI */
        // deferred execution to avoid unnecessary asset loading
        var loginReady = function (cb) {
            if (Login) {
                if (typeof(cb) === 'function') { cb(); }
                return;
            }
            require([
            ], function (_Login) {
                Login = Login || _Login;
                if (typeof(cb) === 'function') { cb(); }
            });
        };
        loginReady();

        var $uname = $('#name');

        var $passwd = $('#password')
        // background loading of login assets
        // enter key while on password field clicks signup
        .on('keyup', function (e) {
            if (e.which !== 13) { return; } // enter
            $('button.login').click();
        });

        $('button.login').click(function (e) {
            loginReady(function () {
                var uname = $uname.val();
                var passwd = $passwd.val();

                Login.loginOrRegister(uname, passwd, false, function (err, result) {
                    if (!err) {
                        // successful validation and user already exists
                        // set user hash in localStorage and redirect to drive
                        localStorage.User_hash = result.userHash;
                        document.location.href = '/drive/';

                        return;
                    }
                    switch (err) {
                        case 'NO_SUCH_USER':
                            Cryptpad.alert('Invalid username or password. Try again, or sign up'); // XXX
                            break;
                        case 'INVAL_USER':
                            Cryptpad.alert('Username required'); // XXX
                            break;
                        case 'INVAL_PASS':
                            Cryptpad.alert('Password required'); // XXX
                            break;
                        default: // UNHANDLED ERROR
                    }
                });
            });
        });
    });
});

