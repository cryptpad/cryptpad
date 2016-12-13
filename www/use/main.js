define([
    '/api/config?cb=' + Math.random().toString(16).slice(2),
    '/customize/messages.js',
    '/common/cryptpad-common.js',
    '/bower_components/chainpad-crypto/crypto.js',

], function (Config, Messages, Cryptpad, Crypto) {
    var $ = window.jQuery;


    var APP = window.APP = {
        Cryptpad: Cryptpad,
        spinner: Cryptpad.spinner(document.body),
    };

    var login = function (uname, passwd, cb) {
        Cryptpad.User.genSecret(uname, passwd, function (err, secret) {
            if (err) {
                console.error(err);
            }
            Cryptpad.User.session(secret, function (err, data) {
                if (err) {
                    console.log(err);
                }
                cb(err, secret);
            });
        });
    };

    var $uname = $('#uname');
    var $passwd = $('#password');
    var $login = $('#login');

    var lockInputs = function (bool) {
        [$uname, $passwd].forEach(function ($e) {
            $e.attr('disabled', bool);
        });
    };

    var ready = function (loggedIn) {
        APP.loggedIn = loggedIn;

        $login
        .text(loggedIn?'log out': 'log in')
        .click(function () {
            if (APP.loggedIn) {
                Cryptpad.User.session(null, function (err) {
                    $login.text('log in');
                });
                return;
            }

            var uname = $uname.val();
            var passwd = $passwd.val();

            if (!uname) {
                console.log("expected a username");
                return;
            }
            if (!passwd) {
                console.log("expected a password");
                return;
            }

            login(uname, passwd, function (err, secret) {
                console.log(secret);
                if (secret) {
                    $login.text('log out');
                    APP.loggedIn = true;
                    lockInputs(true);
                }
            });
        });

        lockInputs(loggedIn);
        [$uname, $passwd]
        .forEach(function ($e, i) {
            $e.on('keyup', function (e) {
                if (!(e.which === 13 && $e.val())) { return; }
                if (i === 0) {
                    $passwd.focus();
                    return;
                }
                $login.click();
            });
        });

        var change = Cryptpad.find(Cryptpad, ['store','change']);
        if (typeof(change) === 'function') {
            change(function (data) {
                if (data.key === Cryptpad.User.localKey) {
                    // HERE
                    console.log("Login data modified");

                }
            });
        }
    };

    Cryptpad.ready(function (err, env) {
        console.log("Cryptpad is ready!");
        console.log(env);

        if (err) {
            console.error(err);
        }

        if (env.userStore) {
            console.log("You're logged in!");
            ready(true);
        } else {
            ready(false);
            console.log("Not logged in");
        }
    });
});
