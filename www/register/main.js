define([
    '/common/login.js',
    '/common/cryptpad-common.js',
    '/common/cryptget.js',
    '/common/credential.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Login, Cryptpad, Crypt) {
    var $ = window.jQuery;

    var APP = window.APP = {
        Login: Login,
    };

    var Messages = Cryptpad.Messages;

    $(function () {
        var $main = $('#mainBlock');

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

        // text and password input fields
        var $uname = $('#username');
        var $passwd = $('#password');
        var $confirm = $('#password-confirm');

        if (sessionStorage.login_user) {
            $uname.val(sessionStorage.login_user);
        }
        if (sessionStorage.login_pass) {
            $passwd.val(sessionStorage.login_pass);
        }

        [ $uname, $passwd, $confirm]
        .some(function ($el) { if (!$el.val()) { $el.focus(); return true; } });

        // checkboxes
        var $checkImport = $('#import-recent');
        var $checkAcceptTerms = $('#accept-terms');
        var $checkPromise = $('#promise');

        var $register = $('button#register');

        $register.click(function () {
            var uname = $uname.val();
            var passwd = $passwd.val();
            var confirmPassword = $confirm.val();

            var shouldImport = $checkImport[0].checked;
            var doesAccept = $checkAcceptTerms[0].checked;
            var doesPromise = $checkPromise[0].checked;

            /* basic validation */
            if (passwd !== confirmPassword) { // do their passwords match?
                return void Cryptpad.alert(Messages.register_passwordsDontMatch);
            }

            if (!doesAccept) { // do they accept the terms of service?
                return void Cryptpad.alert(Messages.register_mustAcceptTerms);
            }

            if (!doesPromise) { // do they promise to remember their password?
                return void Cryptpad.alert(Messages.register_mustRememberPass);
            }

            Cryptpad.addLoadingScreen(Messages.login_hashing);
            Login.loginOrRegister(uname, passwd, true, function (err, result) {
                if (err) {
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
                }
                var proxy = result.proxy;

                localStorage.User_hash = result.userHash;

                Cryptpad.eraseTempSessionValues();
                if (shouldImport) {
                    sessionStorage.migrateAnonDrive = 1;
                }

                proxy.login_name = uname;
                proxy[Cryptpad.displayNameKey] = uname;
                proxy.initializing = true;

                Cryptpad.whenRealtimeSyncs(result.realtime, function () {
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
                });
            });
        });
    });
});
