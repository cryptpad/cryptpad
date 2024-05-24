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
    '/common/inner/sidebar-layout.js',

    'css!/components/components-font-awesome/css/font-awesome.min.css',
], function ($, Login, Cryptpad, /*Test,*/ Cred, UI, Util, Realtime, Constants, Feedback, LocalStore, h, Pages, Rpc, AppConfigScreen, Sidebar) {
    if (window.top !== window) { return; }
    var Messages = Cryptpad.Messages;
    $(function () {

        Messages.admin_appSelection = 'App configuration saved'
        Messages.admin_appsTitle = "Choose your applications"
        Messages.admin_appsHint = "Choose which apps are available to users on your instance."
        Messages.admin_cat_apps = "Apps"
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

        var bloop = function (sendAdminDecree) {

            const blocks = Sidebar.blocks;
            var grid = AppConfigScreen
            
            var save = blocks.activeButton('primary', '', Messages.settings_save, function (done) {
                console.log('hello!');
                console.log(sendAdminDecree)
                sendAdminDecree()
                UI.log('Messages._getKey(, [Messages.admin_appSelection])');
            });

            
            let form = blocks.form([
                grid 
            ], blocks.nav([save]));

            var elem = document.createElement('div');
            elem.setAttribute('id', 'cp-loading');
            let frame = h('div.configscreen',  {style: 'width: 70%; height: 75%; background-color: white'}, form)
            elem.append(frame)

            built = true;
        var intr;
        var append = function () {
            if (!document.body) { return; }
            clearInterval(intr);
            document.body.appendChild(elem);
        };
        intr = setInterval(append, 100);
        append();


            // return function () {
            //     built = true;
            //     var intr;
            //     var append = function () {
            //         if (!document.body) { return; }
            //         clearInterval(intr);
            //         document.body.appendChild(elem);
            //     };
            //     intr = setInterval(append, 100);
            //     append();
            // };
        }

        var registerClick = function () {
        // AppConfigScreen
        // console.log(AppConfigScreen)
            // var sendAdminDecree = 'bleeop'
                            let sendAdminDecree = function (command, data, callback) {
                            console.log('belp')
                    // var params = ['ADMIN_DECREE', [command, data]];  
                    // rpc.send('ADMIN', params, callback)
                };
            bloop(sendAdminDecree)

            // AppConfigScreen
            // console.log(AppConfigScreen)
            // console.log(AppConfigScreen)

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
