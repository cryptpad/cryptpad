define([
    'jquery',
    '/common/cryptpad-common.js',
    '/customize/login.js',
    '/common/common-interface.js',
    '/common/common-realtime.js',
    '/common/common-feedback.js',
    '/common/outer/local-store.js',
    '/common/test.js',

    'less!/bower_components/components-font-awesome/css/font-awesome.min.css',
], function ($, Cryptpad, Login, UI, Realtime, Feedback, LocalStore, Test) {
    $(function () {
        var $main = $('#mainBlock');
        var $checkImport = $('#import-recent');
        var Messages = Cryptpad.Messages;

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

        var hashing = false;
        var test;
        $('button.login').click(function () {
            if (hashing) { return void console.log("hashing is already in progress"); }

            hashing = true;
            var shouldImport = $checkImport[0].checked;

            // setTimeout 100ms to remove the keyboard on mobile devices before the loading screen pops up
            window.setTimeout(function () {
                UI.addLoadingScreen({
                    loadingText: Messages.login_hashing,
                    hideTips: true,
                });
                // We need a setTimeout(cb, 0) otherwise the loading screen is only displayed after hashing the password
                window.setTimeout(function () {
                    loginReady(function () {
                        var uname = $uname.val();
                        var passwd = $passwd.val();
                        Login.loginOrRegister(uname, passwd, false, function (err, result) {
                            if (!err) {
                                var proxy = result.proxy;

                                // successful validation and user already exists
                                // set user hash in localStorage and redirect to drive
                                if (!proxy.login_name) {
                                    result.proxy.login_name = result.userName;
                                }

                                proxy.edPrivate = result.edPrivate;
                                proxy.edPublic = result.edPublic;

                                proxy.curvePrivate = result.curvePrivate;
                                proxy.curvePublic = result.curvePublic;

                                Feedback.send('LOGIN', true);
                                Realtime.whenRealtimeSyncs(result.realtime, function() {
                                    LocalStore.login(result.userHash, result.userName, function () {
                                        hashing = false;
                                        if (test) {
                                            localStorage.clear();
                                            test.pass();
                                            return;
                                        }
                                        if (shouldImport) {
                                            sessionStorage.migrateAnonDrive = 1;
                                        }
                                        if (sessionStorage.redirectTo) {
                                            var h = sessionStorage.redirectTo;
                                            var parser = document.createElement('a');
                                            parser.href = h;
                                            if (parser.origin === window.location.origin) {
                                                delete sessionStorage.redirectTo;
                                                window.location.href = h;
                                                return;
                                            }
                                        }
                                        window.location.href = '/drive/';
                                    });
                                });
                                return;
                            }
                            switch (err) {
                                case 'NO_SUCH_USER':
                                    UI.removeLoadingScreen(function () {
                                        UI.alert(Messages.login_noSuchUser, function () {
                                            hashing = false;
                                        });
                                    });
                                    break;
                                case 'INVAL_USER':
                                    UI.removeLoadingScreen(function () {
                                        UI.alert(Messages.login_invalUser, function () {
                                            hashing = false;
                                        });
                                    });
                                    break;
                                case 'INVAL_PASS':
                                    UI.removeLoadingScreen(function () {
                                        UI.alert(Messages.login_invalPass, function () {
                                            hashing = false;
                                        });
                                    });
                                    break;
                                default: // UNHANDLED ERROR
                                    UI.errorLoadingScreen(Messages.login_unhandledError);
                            }
                        });
                    });
                }, 0);
            }, 100);
        });
        $('#register').on('click', function () {
            if (sessionStorage) {
                if ($uname.val()) {
                    sessionStorage.login_user = $uname.val();
                }
                if ($passwd.val()) {
                    sessionStorage.login_pass = $passwd.val();
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
