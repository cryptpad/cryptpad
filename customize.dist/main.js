define([
    'jquery',
    '/customize/application_config.js',
    '/common/cryptpad-common.js',
    '/common/common-interface.js',
    '/common/common-realtime.js',
    '/customize/messages.js',
], function ($, Config, Cryptpad, UI, Realtime, Messages) {

    window.APP = {
        Cryptpad: Cryptpad,
    };

    $(function () {
        var $main = $('#mainBlock');

        $(window).click(function () {
            $('.cp-dropdown-content').hide();
        });

        // main block is hidden in case javascript is disabled
        $main.removeClass('hidden');

        // Make sure we don't display non-translated content (empty button)
        $main.find('#data').removeClass('hidden');

        if (Cryptpad.isLoggedIn()) {
            if (window.location.pathname === '/') {
                window.location = '/drive/';
                return;
            }

            $main.find('a[href="/drive/"] div.pad-button-text h4')
                .text(Messages.main_yourCryptDrive);

            var name = localStorage[Cryptpad.userNameKey] || sessionStorage[Cryptpad.userNameKey];
            var $loggedInBlock = $main.find('#loggedIn');
            var $hello = $loggedInBlock.find('#loggedInHello');
            var $logout = $loggedInBlock.find('#loggedInLogOut');

            if (name) {
                $hello.text(Messages._getKey('login_hello', [name]));
            } else {
                $hello.text(Messages.login_helloNoName);
            }
            $('#buttons').find('.nologin').hide();

            $logout.click(function () {
                Cryptpad.logout(function () {
                    window.location.reload();
                });
            });

            $loggedInBlock.removeClass('hidden');
        }
        else {
            $main.find('#userForm').removeClass('hidden');
            $('#name').focus();
        }

        /* Log in UI */
        var Login;
        // deferred execution to avoid unnecessary asset loading
        var loginReady = function (cb) {
            if (Login) {
                if (typeof(cb) === 'function') { cb(); }
                return;
            }
            require([
                '/common/login.js',
            ], function (_Login) {
                Login = Login || _Login;
                if (typeof(cb) === 'function') { cb(); }
            });
        };

        var $uname = $('#name').on('focus', loginReady);

        var $passwd = $('#password')
        // background loading of login assets
        .on('focus', loginReady)
        // enter key while on password field clicks signup
        .on('keyup', function (e) {
            if (e.which !== 13) { return; } // enter
            $('button.login').click();
        });

        $('button.login').click(function () {
            // setTimeout 100ms to remove the keyboard on mobile devices before the loading screen pops up
            window.setTimeout(function () {
                UI.addLoadingScreen({loadingText: Messages.login_hashing});
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
                                if (proxy && !proxy.login_name) {
                                    proxy.login_name = result.userName;
                                }

                                proxy.edPrivate = result.edPrivate;
                                proxy.edPublic = result.edPublic;

                                Realtime.whenRealtimeSyncs(result.realtime, function () {
                                    Cryptpad.login(result.userHash, result.userName, function () {
                                        document.location.href = '/drive/';
                                    });
                                });
                                return;
                            }
                            switch (err) {
                                case 'NO_SUCH_USER':
                                    UI.removeLoadingScreen(function () {
                                        UI.alert(Messages.login_noSuchUser);
                                    });
                                    break;
                                case 'INVAL_USER':
                                    UI.removeLoadingScreen(function () {
                                        UI.alert(Messages.login_invalUser);
                                    });
                                    break;
                                case 'INVAL_PASS':
                                    UI.removeLoadingScreen(function () {
                                        UI.alert(Messages.login_invalPass);
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
        /* End Log in UI */
        console.log("ready");
    });
});
