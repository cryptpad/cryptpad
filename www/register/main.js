// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/api/config',
    'jquery',
    '/customize/login.js',
    '/common/cryptpad-common.js',
    '/common/common-credential.js',
    '/common/common-interface.js',
    '/common/common-util.js',
    '/common/common-realtime.js',
    '/common/common-constants.js',
    '/common/common-feedback.js',
    '/common/outer/local-store.js',
    '/common/hyperscript.js',
    '/customize/pages.js',

    'css!/components/components-font-awesome/css/font-awesome.min.css',
], function (Config, $, Login, Cryptpad, Cred, UI, Util, Realtime, Constants, Feedback, LocalStore, h, Pages) {
    if (window.top !== window) { return; }
    var Messages = Cryptpad.Messages;
    $(function () {
        if (LocalStore.isLoggedIn()) {
            // already logged in, redirect to drive
            document.location.href = '/drive/';
            return;
        }

        // If the token is provided in the URL, hide the field
        var token;
        if (window.location.hash) {
            var hash = window.location.hash.slice(1);
            token = hash;
            $('body').removeClass('cp-register-closed');
        } else if (Config.sso && Config.restrictRegistration && !Config.restrictSsoRegistration) {
            $('body').find('.cp-register-det').css('display', 'flex');
            $('body').find('#data').hide();
            $('body').find('#userForm').hide();
        }

        // text and password input fields
        var $uname = $('#username');
        var $passwd = $('#password');
        var $confirm = $('#password-confirm');

        if (localStorage.login_user) {
            $uname.val(localStorage.login_user);
            delete localStorage.login_user;
        }

        [ $uname, $passwd, $confirm]
        .some(function ($el) { if (!$el.val()) { $el.focus(); return true; } });

        // checkboxes
        var $checkImport = $('#import-recent');
        var $checkAcceptTerms = $('#accept-terms');

        var $register = $('button#register');

        var I_REALLY_WANT_TO_USE_MY_EMAIL_FOR_MY_USERNAME = false;
        var br = function () { return h('br'); };

        if (Config.sso) {
            // TODO
            // Config.sso.force => no legacy login allowed
            // Config.sso.password => cp password required or forbidden
            // Config.sso.list => list of configured identity providers
            var $sso = $('div.cp-register-sso');
            var list = Config.sso.list.map(function (name) {
                var b = h('button.btn.btn-secondary', name);
                var $b = $(b).click(function () {
                    $b.prop('disabled', 'disabled');
                    Login.ssoAuth(name, function (err, data) {
                        if (data.url) {
                            window.location.href = data.url;
                        }
                    });
                });
                return b;
            });
            $sso.append(list);

            // Disable bfcache (back/forward cache) to prevent SSO button
            // being disabled when using the browser "back" feature on the SSO page
            $(window).on('unload', () => {});
        }

        var registerClick = function () {
            var uname = $uname.val().trim();
    // trim whitespace surrounding the username since it is otherwise included in key derivation
    // most people won't realize that its presence is significant
            $uname.val(uname);
            if (uname.length > Cred.MAXIMUM_NAME_LENGTH) {
                let nameWarning = Messages._getKey('register_nameTooLong', [ Cred.MAXIMUM_NAME_LENGTH ]);
                return void UI.alert(nameWarning);
            }

            var passwd = $passwd.val();
            var confirmPassword = $confirm.val();

            var shouldImport = $checkImport[0].checked;
            var doesAccept;
            try {
                // if this throws there's either a horrible bug (which someone will report)
                // or the instance admins did not configure a terms page.
                doesAccept = $checkAcceptTerms.length && $checkAcceptTerms[0].checked;
            } catch (err) {
                console.error(err);
            }

            if (Cred.isEmail(uname) && !I_REALLY_WANT_TO_USE_MY_EMAIL_FOR_MY_USERNAME) {
                var emailWarning = [
                    Messages.register_emailWarning0,
                    br(), br(),
                    Messages.register_emailWarning1,
                    br(), br(),
                    Messages.register_emailWarning2,
                    br(), br(),
                    Messages.register_emailWarning3,
                ];

                Feedback.send("EMAIL_USERNAME_WARNING", true);

                return void UI.confirm(emailWarning, function (yes) {
                    if (!yes) { return; }
                    I_REALLY_WANT_TO_USE_MY_EMAIL_FOR_MY_USERNAME = true;
                    registerClick();
                });
            }

            /* basic validation */
            if (!Cred.isLongEnoughPassword(passwd)) {
                var warning = Messages._getKey('register_passwordTooShort', [
                    Cred.MINIMUM_PASSWORD_LENGTH
                ]);
                return void UI.alert(warning);
            }

            if (passwd !== confirmPassword) { // do their passwords match?
                return void UI.alert(Messages.register_passwordsDontMatch);
            }

            if (Pages.customURLs.terms && !doesAccept) { // do they accept the terms of service? (if they exist)
                return void UI.alert(Messages.register_mustAcceptTerms);
            }

            setTimeout(function () {
                var span = h('span', [
                    h('h2', [
                        h('i.fa.fa-warning'),
                        ' ',
                        Messages.register_warning,
                    ]),
                    Messages.register_warning_note
                ]);

            UI.confirm(span,
            function (yes) {
                if (!yes) { return; }

                Login.loginOrRegisterUI({
                    uname,
                    passwd,
                    token,
                    isRegister: true,
                    shouldImport,
                    onOTP: UI.getOTPScreen
                });
            }, {
                ok: Messages.register_writtenPassword,
                cancel: Messages.register_cancel,
/*  If we're certain that we aren't using these "*Class" APIs
    anywhere else then we can deprecate them and make this a
    custom modal in common-interface (or here).  */
                cancelClass: 'btn.btn-cancel.btn-register',
                okClass: 'btn.btn-danger.btn-register.btn-confirm',
                reverseOrder: true,
                done: function ($dialog) {
                    $dialog.find('> div').addClass('half');
                },
            });
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

/*
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
        }); */
    });
});
