define([
    'jquery',
    '/common/cryptpad-common.js',
    '/common/login.js',

    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less/loading.less',
], function ($, Cryptpad, Login) {
    $(function () {
        var $main = $('#mainBlock');
        var Messages = Cryptpad.Messages;

        // Language selector
        var $sel = $('#language-selector');
        Cryptpad.createLanguageSelector(undefined, $sel);
        $sel.find('button').addClass('btn').addClass('btn-secondary');
        $sel.show();

        // User admin menu
        var $userMenu = $('#user-menu');
        var userMenuCfg = {
            $initBlock: $userMenu
        };
        var $userAdmin = Cryptpad.createUserAdminMenu(userMenuCfg);
        $userAdmin.find('button').addClass('btn').addClass('btn-secondary');

        $(window).click(function () {
            $('.cp-dropdown-content').hide();
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

        var $uname = $('#name').focus();

        var $passwd = $('#password')
        // background loading of login assets
        // enter key while on password field clicks signup
        .on('keyup', function (e) {
            if (e.which !== 13) { return; } // enter
            $('button.login').click();
        });

        var hashing = false;
        $('button.login').click(function () {
            if (hashing) { return void console.log("hashing is already in progress"); }

            hashing = true;

            // setTimeout 100ms to remove the keyboard on mobile devices before the loading screen pops up
            window.setTimeout(function () {
                Cryptpad.addLoadingScreen({
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

                                Cryptpad.feedback('LOGIN', true);
                                Cryptpad.whenRealtimeSyncs(result.realtime, function() {
                                    Cryptpad.login(result.userHash, result.userName, function () {
                                        hashing = false;
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
                                    Cryptpad.removeLoadingScreen(function () {
                                        Cryptpad.alert(Messages.login_noSuchUser, function () {
                                            hashing = false;
                                        });
                                    });
                                    break;
                                case 'INVAL_USER':
                                    Cryptpad.removeLoadingScreen(function () {
                                        Cryptpad.alert(Messages.login_invalUser, function () {
                                            hashing = false;
                                        });
                                    });
                                    break;
                                case 'INVAL_PASS':
                                    Cryptpad.removeLoadingScreen(function () {
                                        Cryptpad.alert(Messages.login_invalPass, function () {
                                            hashing = false;
                                        });
                                    });
                                    break;
                                default: // UNHANDLED ERROR
                                    Cryptpad.errorLoadingScreen(Messages.login_unhandledError);
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
    });
});
