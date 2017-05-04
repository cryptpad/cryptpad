define([
    'jquery',
    '/common/login.js',
    '/common/cryptpad-common.js',
    '/common/credential.js' // preloaded for login.js
], function ($, Login, Cryptpad) {
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

        var $register = $('button#register');

        var logMeIn = function (result) {
            localStorage.User_hash = result.userHash;

            var proxy = result.proxy;
            proxy.edPublic = result.edPublic;
            proxy.edPrivate = result.edPrivate;

            Cryptpad.feedback('REGISTRATION', true);

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
        };

        $register.click(function () {
            var uname = $uname.val();
            var passwd = $passwd.val();
            var confirmPassword = $confirm.val();

            var shouldImport = $checkImport[0].checked;
            var doesAccept = $checkAcceptTerms[0].checked;

            /* basic validation */
            if (passwd !== confirmPassword) { // do their passwords match?
                return void Cryptpad.alert(Messages.register_passwordsDontMatch);
            }

            if (!doesAccept) { // do they accept the terms of service?
                return void Cryptpad.alert(Messages.register_mustAcceptTerms);
            }

            Cryptpad.confirm("<h2 class='bright'>" + Messages.register_warning + "</h2>",
            function (yes) {
                if (!yes) { return; }

                Cryptpad.addLoadingScreen(Messages.login_hashing);
                Login.loginOrRegister(uname, passwd, true, function (err, result) {
                    var proxy = result.proxy;

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
                            case 'ALREADY_REGISTERED':
                                Cryptpad.removeLoadingScreen(function () {
                                    Cryptpad.confirm(Messages.register_alreadyRegistered, function (yes) {
                                        if (!yes) { return; }
                                        proxy.login_name = uname;

                                        if (!proxy[Cryptpad.displayNameKey]) {
                                            proxy[Cryptpad.displayNameKey] = uname;
                                        }
                                        Cryptpad.eraseTempSessionValues();
                                        logMeIn(result);
                                    });
                                });
                                break;
                            default: // UNHANDLED ERROR
                                Cryptpad.errorLoadingScreen(Messages.login_unhandledError);
                        }
                        return;
                    }
                    Cryptpad.eraseTempSessionValues();
                    if (shouldImport) {
                        sessionStorage.migrateAnonDrive = 1;
                    }

                    proxy.login_name = uname;
                    proxy[Cryptpad.displayNameKey] = uname;
                    sessionStorage.createReadme = 1;

                    logMeIn(result);
                });
            }, {
                ok: Messages.register_writtenPassword,
                cancel: Messages.register_cancel,
                cancelClass: 'safe',
                okClass: 'danger',
                reverseOrder: true,
            }, true, function ($dialog) {
                $dialog.find('> div').addClass('half');
            });
        });
    });
});
