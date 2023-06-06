define([
    'jquery',
    '/common/cryptpad-common.js',
    '/customize/login.js',
    '/common/common-interface.js',
    '/common/common-realtime.js',
    '/common/common-feedback.js',
    '/common/outer/local-store.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
    //'/common/test.js',

    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
], function ($, Cryptpad, Login, UI, Realtime, Feedback, LocalStore, h, Msg /*, Test */) {
    if (window.top !== window) { return; }
    $(function () {
        var $checkImport = $('#import-recent');
        if (LocalStore.isLoggedIn()) {
            // already logged in, redirect to drive
            document.location.href = '/drive/';
            return;
        }

    Msg.settings_totp_code = "OTP code"; // XXX KEY ALREADY ADDED IN www/settings/inner.js
    Msg.login_enter_totp = "This account is protected with MFA. Please enter your OTP code."; // XXX
    Msg.login_invalid_otp = "Invalid OTP code";


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

        var onOTP = function (err, cb) {
            var btn, input;
            var error;
            if (err) {
                console.error(err);
                error = h('p.cp-password-error', Msg.login_invalid_otp);
            }
            var block = h('div#cp-loading-password-prompt', [
                error,
                h('p.cp-password-info', Msg.login_enter_totp),
                h('p.cp-password-form', [
                    input = h('input', {
                        placeholder: Msg.settings_totp_code,
                        autocomplete: 'off',
                        autocorrect: 'off',
                        autocapitalize: 'off',
                        spellcheck: false,
                    }),
                    btn = h('button.btn.btn-primary', Msg.ui_confirm)
                ])
            ]);
            var $input = $(input);
            var $btn = $(btn).click(function () {
                var val = $input.val();
                if (!val) { return void onOTP('INVALID_CODE', cb); }
                cb(val);
            });
            $(input).on('keydown', function (e) {
                if (e.which !== 13) { return; } // enter
                $btn.click();
            });
            UI.errorLoadingScreen(block, false, false);
        };


        //var test;
        $('button.login').click(function () {
            var shouldImport = $checkImport[0].checked;
            var uname = $uname.val();
            var passwd = $passwd.val();
            Login.loginOrRegisterUI(uname, passwd, false, shouldImport, onOTP, /*Test.testing */ false, function () {
                /*
                if (test) {
                    localStorage.clear();
                    //test.pass();
                    return true;
                }
                */
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
