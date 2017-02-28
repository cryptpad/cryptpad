define([
    '/common/cryptpad-common.js',
    '/common/login.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Cryptpad, Login) {
    var $ = window.$;

    var APP = window.APP = {
        Cryptpad: Cryptpad,
    };

    $(function () {
        var $main = $('#mainBlock');
        var Messages = Cryptpad.Messages;

        // Language selector
        var $sel = $('#language-selector');
        Cryptpad.createLanguageSelector(undefined, $sel);
        $sel.find('button').addClass('btn').addClass('btn-secondary');
        $sel.show();

        $(window).click(function () {
            $('.cryptpad-dropdown').hide();
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

        var $uname = $('#name');

        var $passwd = $('#password')
        // background loading of login assets
        // enter key while on password field clicks signup
        .on('keyup', function (e) {
            if (e.which !== 13) { return; } // enter
            $('button.login').click();
        });

        $('button.login').click(function (e) {
            Cryptpad.addLoadingScreen(Messages.login_hashing);
            // We need a setTimeout(cb, 0) otherwise the loading screen is only displayed after hashing the password
            window.setTimeout(function () {
                loginReady(function () {
                    var uname = $uname.val();
                    var passwd = $passwd.val();
                    Login.loginOrRegister(uname, passwd, false, function (err, result) {
                        if (!err) {
                            // successful validation and user already exists
                            // set user hash in localStorage and redirect to drive
                            if (result.proxy && !result.proxy.login_name) {
                                result.proxy.login_name = result.userName;
                            }
                            Cryptpad.login(result.userHash, result.userName, function () {
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
                            return;
                        }
                        switch (err) {
                            case 'NO_SUCH_USER':
                                Cryptpad.removeLoadingScreen(function () {
                                    Cryptpad.alert(Messages.login_noSuchUser);
                                });
                                break;
                            case 'INVAL_USER':
                                Cryptpad.removeLoadingScreen(function () {
                                    Cryptpad.alert(Messages.login_invalUser);
                                });
                                break;
                            case 'INVAL_PASS':
                                Cryptpad.removeLoadingScreen(function () {
                                    Cryptpad.alert(Messages.login_invalPass);
                                });
                                break;
                            default: // UNHANDLED ERROR
                                Cryptpad.errorLoadingScreen(Messages.login_unhandledError);
                        }
                    });
                });
            }, 0);
        });
    });
});

