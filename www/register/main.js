define([
    '/common/login.js',
    '/common/cryptpad-common.js',
    '/common/credential.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Login, Cryptpad) {
    var $ = window.jQuery;

    var APP = window.APP = {
        Login: Login,
    };

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
    .some(function ($el) { if (!$el.val()) { return ($el.focus(), true); } });

    // checkboxes
    var $checkImport = $('#import-recent');
    var $checkAcceptTerms = $('#accept-terms');
    var $checkPromise = $('#promise');

    var $register = $('button#register');

    var proxyIsSynced = function (realtime, cb) {
        realtime.sync();
        var interval = 300;
        var check = function () {
            if (realtime.getAuthDoc() !== realtime.getUserDoc()) {
                return window.setTimeout(check, interval);
            }
            cb();
        };
        window.setTimeout(check, interval);
    };

    $register.click(function () {
        var uname = $uname.val();
        var passwd = $passwd.val();
        var confirmPassword = $confirm.val();

        var shouldImport = $checkImport[0].checked;
        var doesAccept = $checkAcceptTerms[0].checked;
        var doesPromise = $checkPromise[0].checked;

        /* basic validation */
        if (passwd !== confirmPassword) { // do their passwords match?
            return void Cryptpad.alert('passwords do not match!'); // XXX
        }

        if (!doesAccept) { // do they accept the terms of service?
            return void Cryptpad.alert('you must accept the terms of service'); // XXX
        }

        if (!doesPromise) { // do they promise to remember their password?
            return void Cryptpad.alert("We cannot reset your password if you forget it. It's very important that you remember it!"); // XXX
        }

        Login.loginOrRegister(uname, passwd, true, function (err, result) {
            if (err) { return void Cryptpad.alert(err); }
            console.log(result);
            var proxy = result.proxy;

            localStorage.User_hash = result.userHash;

            Cryptpad.eraseTempSessionValues();
            if (shouldImport) {
                sessionStorage.migrateAnonDrive = 1;
            }

            proxy.login_name = uname;

            proxyIsSynced(result.realtime, function () {
                document.location.href = '/drive/';
            });
        });
    });
});
