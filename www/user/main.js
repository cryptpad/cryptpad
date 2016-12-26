define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/cryptpad-common.js',
    'credential.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
    '/bower_components/scrypt-async/scrypt-async.min.js', // better load speed
    '/bower_components/jquery/dist/jquery.min.js',
], function (Config, Listmap, Crypto, Cryptpad, Cred) {
    var $ = window.jQuery;
    var Nacl = window.nacl;

    var secret = {};

    var APP = window.APP = {
        Cryptpad: Cryptpad,
        Crypto: Crypto,
    };

    var $warning = $('#warning');

    // login elements
    var $loginBox = $('#login-box');
    var $login = $('#login');
    var $username = $('#username');
    var $password = $('#password');
    var $confirm = $('#confirm');
    var $remember = $('#remember');

    // log out elements
    var $logoutBox = $('#logout-box');
    var $logout = $('#logout');

    var revealer = function ($el) {
        return function (bool) { $el[bool?'slideDown': 'slideUp'](); };
    };

    var revealLogin = APP.revealLogin = revealer($loginBox);
    var revealLogout = APP.revealLogout= revealer($logoutBox);
    var revealConfirm = APP.revealConfirm = revealer($confirm);

    var $register = $('#register').click(function () {
        if (!$register.length) { return; }
        var e = $register[0];
        if (e.checked) {
            revealConfirm(true);
            $login.text(Cryptpad.Messages._getKey('login_register'));
        }
        else {
            revealConfirm(false);
            $login.text(Cryptpad.Messages._getKey('login_login'));
        }
    });

    var resetUI = APP.resetUI = function () {
        $username.val("");
        $password.val("");
        $confirm.val("");
        $remember[0].checked = false;
        $register[0].checked = false;
    };

    APP.logout = function () {
        Cryptpad.logout(function () {
            revealLogout(false);
            revealLogin(true);
        });
    };

    $logout.click(function () {
        APP.logout();
    });

    var Events = APP.Events = {};
    var alreadyExists = Events.alreadyExists = function () {
        Cryptpad.alert("user account already exists.");
    };
    var mismatchedPasswords = Events.mismatchedPasswords = function () {
        Cryptpad.alert("passwords don't match!");
    };

    var useBytes = function (bytes, opt) {
        opt = opt || {};
        if (opt.remember) {
            console.log("user would like to stay logged in");
        } else {
            console.log("user would like to be forgotten");
        }

        var dispense = Cred.dispenser(bytes);

        // dispense 18 bytes of entropy for your encryption key
        var encryptionSeed = dispense(18);
        // 16 bytes for a deterministic channel key
        var channelSeed = dispense(16);
        // 32 bytes for a curve key
        var curveSeed = dispense(32);
        // 32 more for a signing key
        var edSeed = dispense(32);

        var seed = {};
        var keys = seed.keys = Crypto.createEditCryptor(null, encryptionSeed);

        // 24 bytes of base64
        keys.editKeyStr = keys.editKeyStr.replace(/\//g, '-');

        // 32 bytes of hex
        seed.channel = Cryptpad.uint8ArrayToHex(channelSeed);

        var channelHex = seed.channel;

        if (channelHex.length !== 32) {
            throw new Error('invalid channel id');
        }

        var channel64 = Cryptpad.hexToBase64(channelHex);

        seed.editHash = Cryptpad.getEditHashFromKeys(channelHex, keys.editKeyStr);
        //console.log("edithash: %s", seed.editHash);

        var secret = Cryptpad.getSecrets(seed.editHash);

        var config = {
            websocketURL: Cryptpad.getWebsocketURL(),
            channel: channelHex,
            data: {},
            validateKey: keys.validateKey, // derived validation key
            crypto: Crypto.createEncryptor(seed.keys),
        };

        var rt = APP.rt = Listmap.create(config);

        rt.proxy.on('create', function (info) {
            console.log("loading user profile");
        })
        .on('ready', function (info) {
            console.log(info);
            console.log('ready');
            var proxy = rt.proxy;

/*  if the user is registering, we expect that the userDoc will be empty
*/
            var proxyKeys = Object.keys(proxy);

            if (opt.register) {
                if (proxyKeys.length) {
                    // user is trying to register, but the userDoc is not empty
                    // tell them they are already registered.


                    alreadyExists();
                } else {
                    // trying to register, and the object is empty, as expected
                }
            } else {
                if (proxyKeys.length) {
                    // user has already initialized the object, as expected
                } else {
                    // user has logged in, but there is no object here
                    // they should confirm their password
                    // basically this means registering
                }
            }

            var now = +(new Date());
            if (!proxy.atime) {
                console.log("first time visiting!");
                proxy.atime = now;

                var name = proxy['cryptpad.username'] = opt.name;
                console.log("setting name to %s", name);
            } else {
                console.log("last visit was %ss ago", (now - proxy.atime) / 1000);
                proxy.atime = now;
            }

            var userHash = '/1/edit/' + [channel64, keys.editKeyStr].join('/');

            console.log("remembering your userhash");
            Cryptpad.login(userHash, opt.remember);
            console.log(userHash);
            APP.revealLogin(false);
            $('div#logout-box').slideDown();
            //console.log(proxy);
        })
        .on('disconnect', function (info) {
            console.log('disconnected');
            console.log(info);
        });
    };
    Cryptpad.ready(function () {
        if (Cryptpad.getUserHash()) {
            //Cryptpad.alert("You are already logged in!");
            $logoutBox.slideDown();
        } else {
            revealLogin(true);
        }

        $login.click(function () {
            var uname = $username.val();
            var passwd = $password.val();
            var confirm = $confirm.val();
            var remember = $remember[0].checked;
            var register = $register[0].checked;

            if (!Cred.isValidUsername(uname)) {
                return void Cryptpad.alert('invalid username');
            }
            if (!Cred.isValidPassword(passwd)) {
                return void Cryptpad.alert('invalid password');
            }
            if (register && !Cred.passwordsMatch(passwd, confirm)) {
                return mismatchedPasswords();
            }

            resetUI();

            // dispense 128 bytes, to be divided later
            // we can safely increase this size, but we don't need much right now
            Cred.deriveFromPassphrase(uname, passwd, 128, function (bytes) {
                useBytes(bytes, {
                    remember: remember,
                    register: register,
                    name: uname,
                });
            });
        });
    });
});
