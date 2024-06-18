// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/api/config',
    'jquery',
    '/common/hyperscript.js',
    '/common/cryptpad-common.js',
    '/customize/login.js',
    '/common/common-interface.js',
    '/common/common-realtime.js',
    '/common/common-feedback.js',
    '/common/outer/local-store.js',
    //'/common/test.js',

    'css!/components/components-font-awesome/css/font-awesome.min.css',
], function (Config, $, h, Cryptpad, Login, UI, Realtime, Feedback, LocalStore /*, Test */) {
    if (window.top !== window) { return; }
    $(function () {
        var $checkImport = $('#import-recent');
        if (LocalStore.isLoggedIn()) {
            // already logged in, redirect to drive
            document.location.href = '/drive/';
            return;
        }

        if (Config.sso) {
            // TODO
            // Config.sso.force => no legacy login allowed
            // Config.sso.password => cp password required or forbidden
            // Config.sso.list => list of configured identity providers
            var $sso = $('div.cp-login-sso');
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
