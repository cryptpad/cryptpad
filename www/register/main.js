define([
    '/common/login.js',
    '/common/credential.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Login) {
    var $ = window.jQuery;

    // text and password input fields
    var $uname = $('#username');
    var $passwd = $('#password');
    var $confirm = $('#password-confirm');

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

        // do their passwords match?

        if (passwd !== confirmPassword) {
            alert('invalid password');
            return;
        }

        Login.loginOrRegister(uname, passwd, true, function (err, out) {
            if (err) { alert(err); }
            console.log(out);
        })
    });
});
