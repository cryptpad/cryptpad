define([
    'jquery',
    '/common/cryptpad-common.js',
    '/customize/login.js',
    '/common/common-interface.js',
    '/common/common-realtime.js',
    '/common/common-feedback.js',
    '/common/outer/local-store.js',
    '/common/test.js',

    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
], function ($, Cryptpad, Login, UI, Realtime, Feedback, LocalStore, Test) {
    $(function () {
        var $main = $('#mainBlock');
        var $checkImport = $('#import-recent');

        // main block is hidden in case javascript is disabled
        $main.removeClass('hidden');

        // Make sure we don't display non-translated content (empty button)
        $main.find('#data').removeClass('hidden');

        if (LocalStore.isLoggedIn()) {
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

        var $uname = $('#name').focus();

        var $passwd = $('#password')
        // background loading of login assets
        // enter key while on password field clicks signup
        .on('keyup', function (e) {
            if (e.which !== 13) { return; } // enter
            $('button.login').click();
        });

        var test;
        $('button.login').click(function () {
            var shouldImport = $checkImport[0].checked;
            var uname = $uname.val();
            var passwd = $passwd.val();
            Login.loginOrRegisterUI(uname, passwd, false, shouldImport, Test.testing, function () {
                if (test) {
                    localStorage.clear();
                    test.pass();
                    return true;
                }
            });
        });
        $('#register').on('click', function () {
            if (sessionStorage) {
                if ($uname.val()) {
                    sessionStorage.login_user = $uname.val();
                }
            }
            window.location.href = '/register/';
        });

        Test(function (t) {
            $uname.val('testuser');
            $passwd.val('testtest');
            test = t;
            $('button.login').click();
        });
    });
});
