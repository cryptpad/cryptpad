// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
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
    '/common/rpc.js',
    'appconfigscreen.js',

    'css!/components/components-font-awesome/css/font-awesome.min.css',
], function ($, Login, Cryptpad, /*Test,*/ Cred, UI, Util, Realtime, Constants, Feedback, LocalStore, h, Pages, Rpc, AppConfigScreen) {
    if (window.top !== window) { return; }
    var Messages = Cryptpad.Messages;
    $(function () {
        // if (LocalStore.isLoggedIn()) {
        //     // already logged in, redirect to drive
        //     document.location.href = '/drive/';
        //     return;
        // }


        // text and password input fields
        var $token = $('#installtoken');
        var $uname = $('#username');
        var $passwd = $('#password');
        var $confirm = $('#password-confirm');

        [ $token, $uname, $passwd, $confirm]
        .some(function ($el) { if (!$el.val()) { $el.focus(); return true; } });

        // checkboxes
        var $register = $('button#register');

        var I_REALLY_WANT_TO_USE_MY_EMAIL_FOR_MY_USERNAME = false;
        var br = function () { return h('br'); };

        // If the token is provided in the URL, hide the field
        var token;
        if (window.location.hash) {
            var hash = window.location.hash.slice(1);
            if (hash.length === 64) {
                token = hash;
                $token.hide();
                console.log(`Install token: ${token}`);
            }
        }

        var registerClick = function () {

            AppConfigScreen.addConfigScreen()
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
    });
});
