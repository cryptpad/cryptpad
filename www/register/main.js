define([
    'jquery',
    '/customize/login.js',
    '/common/cryptpad-common.js',
    '/common/test.js',
    '/customize/credential.js', // preloaded for login.js
    '/common/common-interface.js',
    '/common/common-util.js',
    '/common/common-realtime.js',
    '/common/common-constants.js',
    '/common/common-feedback.js',
    '/common/outer/local-store.js',

    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
], function ($, Login, Cryptpad, Test, Cred, UI, Util, Realtime, Constants, Feedback, LocalStore) {
    var Messages = Cryptpad.Messages;

    $(function () {
        var $main = $('#mainBlock');

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

        // text and password input fields
        var $uname = $('#username');
        var $passwd = $('#password');
        var $confirm = $('#password-confirm');

        if (sessionStorage.login_user) {
            delete sessionStorage.login_user;
            $uname.val(sessionStorage.login_user);
        }

        [ $uname, $passwd, $confirm]
        .some(function ($el) { if (!$el.val()) { $el.focus(); return true; } });

        // checkboxes
        var $checkImport = $('#import-recent');
        var $checkAcceptTerms = $('#accept-terms');

        var $register = $('button#register');

        var registering = false;
        var test;

        var I_REALLY_WANT_TO_USE_MY_EMAIL_FOR_MY_USERNAME = false;

        var registerClick = function () {
            var uname = $uname.val();
            var passwd = $passwd.val();
            var confirmPassword = $confirm.val();

            var shouldImport = $checkImport[0].checked;
            var doesAccept = $checkAcceptTerms[0].checked;

            if (Cred.isEmail(uname) && !I_REALLY_WANT_TO_USE_MY_EMAIL_FOR_MY_USERNAME) {
                var emailWarning = [
                    Messages.register_emailWarning0,
                    Messages.register_emailWarning1,
                    Messages.register_emailWarning2,
                    Messages.register_emailWarning3,
                ].join('<br><br>');

                Feedback.send("EMAIL_USERNAME_WARNING", true);

                return void UI.confirm(emailWarning, function (yes) {
                    if (!yes) { return; }
                    I_REALLY_WANT_TO_USE_MY_EMAIL_FOR_MY_USERNAME = true;
                    registerClick();
                }, {}, true);
            }

            /* basic validation */
            if (!Cred.isLongEnoughPassword(passwd)) {
                var warning = Messages._getKey('register_passwordTooShort', [
                    Cred.MINIMUM_PASSWORD_LENGTH
                ]);
                return void UI.alert(warning, function () {
                    registering = false;
                });
            }

            if (passwd !== confirmPassword) { // do their passwords match?
                return void UI.alert(Messages.register_passwordsDontMatch);
            }

            if (!doesAccept) { // do they accept the terms of service?
                return void UI.alert(Messages.register_mustAcceptTerms);
            }

            setTimeout(function () {
            UI.confirm("<h2 class='bright msg'>" + Messages.register_warning + "</h2>",
            function (yes) {
                if (!yes) { return; }

                Login.loginOrRegisterUI(uname, passwd, true, shouldImport, Test.testing, function () {
                    if (test) {
                        localStorage.clear();
                        test.pass();
                        return true;
                    }
                });
                registering = true;
            }, {
                ok: Messages.register_writtenPassword,
                cancel: Messages.register_cancel,
                cancelClass: 'safe',
                okClass: 'danger',
                reverseOrder: true,
                done: function ($dialog) {
                    $dialog.find('> div').addClass('half');
                },
            }, true);
            }, 150);
        };

        $register.click(registerClick);

        var clickRegister = Util.notAgainForAnother(function () {
            $register.click();
        }, 500);

        $register.on('keypress', function (e) {
            if (e.which === 13) {
                e.preventDefault();
                e.stopPropagation();
                return clickRegister();
            }
        });

        Test(function (t) {
            test = t;
            $uname.val('testuser');
            $passwd.val('testtest');
            $confirm.val('testtest');
            $checkImport[0].checked = true;
            $checkAcceptTerms[0].checked = true;
            $register.click();

            window.setTimeout(function () {
                UI.findOKButton().click();
            }, 1000);
        });
    });
});
