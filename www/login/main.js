define([
    'jquery',
    '/common/cryptpad-common.js',
    '/customize/login.js',
    '/common/common-interface.js',
    '/common/common-realtime.js',
    '/common/common-feedback.js',
    '/common/outer/local-store.js',
    //'/common/test.js',

    'css!/components/components-font-awesome/css/font-awesome.min.css',
], function ($, Cryptpad, Login, UI, Realtime, Feedback, LocalStore /*, Test */) {
    if (window.top !== window) { return; }
    $(function () {
        var $checkImport = $('#import-recent');
        if (LocalStore.isLoggedIn()) {
            // already logged in, redirect to drive
            document.location.href = '/drive/';
            return;
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
        .on('keydown', function (e) {
            if (e.which !== 13) { return; } // enter
            $('button.login').click();
        });

        //var test;
        $('button.login').click(function () {
            var shouldImport = $checkImport[0].checked;
            var uname = $uname.val();
            var passwd = $passwd.val();
            Login.loginOrRegisterUI({
                uname,
                passwd,
                shouldImport,
                onOTP: UI.getOTPScreen
            });
        });
        $('#register').on('click', function () {
            if ($uname.val()) {
                localStorage.login_user = $uname.val();
            }
            var hash = (window.location.hash || '').replace(/\/login\//, '/register/');
            window.location.href = '/register/' + hash;
        });

/*
        Test(function (t) {
            $uname.val('testuser');
            $passwd.val('testtest');
            test = t;
            $('button.login').click();
        });
        */
    });
});
