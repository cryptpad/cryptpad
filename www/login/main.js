define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/cryptpad-common.js',
    '/login/credential.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
    '/bower_components/scrypt-async/scrypt-async.min.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Config, Listmap, Crypto, Cryptpad, Cred) {
    var $ = window.jQuery;
    var Scrypt = window.scrypt;
    var Nacl = window.nacl;

    Cryptpad.styleAlerts();

    var secret = {};

    var APP = window.APP = {
        Cryptpad: Cryptpad,
        Crypto: Crypto,
    };

    var hashFromCreds = function (username, password, len, cb) {
        Scrypt(password,
            username,
            8, // memoryCost (n)
            1024, // block size parameter (r)
            len || 128, // dkLen
            200, // interruptStep
            cb,
            undefined); // format, could be 'base64'
    };

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

        var entropy = {
            used: 0,
        };

        // crypto hygeine
        var consume = function (n) {
            // explode if you run out of bytes
            if (entropy.used + n > bytes.length) {
                throw new Error('exceeded available entropy');
            }
            if (typeof(n) !== 'number') { throw new Error('expected a number'); }
            if (n <= 0) {
                throw new Error('expected to consume a positive number of bytes');
            }

            // grab an unused slice of the entropy
            var A = bytes.slice(entropy.used, entropy.used + n);

            // account for the bytes you used so you don't reuse bytes
            entropy.used += n;

            //console.info("%s bytes of entropy remaining", bytes.length - entropy.used);
            return A;
        };

        // consume 18 bytes of entropy for your encryption key
        var encryptionSeed = consume(18);
        // 16 bytes for a deterministic channel key
        var channelSeed = consume(16);
        // 32 bytes for a curve key
        var curveSeed = consume(32);
        // 32 more for a signing key
        var edSeed = consume(32);

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
            if (opt.register) {
                if (Object.keys(proxy).length) {
                    alreadyExists();
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
            //console.log(userHash);
            //console.log(proxy);
        })
        .on('disconnect', function (info) {
            console.log('disconnected');
            console.log(info);
        });
    };

    var $warning = $('#warning');
    var $login = $('#login');
    var $username = $('#username');
    var $password = $('#password');
    var $confirm = $('#confirm');
    var $remember = $('#remember');

    var revealLogin = function () {
        $('.box').slideDown();
    };

    var $logoutBox = $('div.logout');
    var $logout = $('#logout').click(function () {
        Cryptpad.logout(function () {
            // noop?
            $logout.slideUp();
            revealLogin();
        });
    });

    var $register = $('#register').click(function () {
        if (!$register.length) { return; }
        var e = $register[0];
        if (e.checked) {
            $confirm.slideDown();
            $login.text(Cryptpad.Messages._getKey('login_register'));
        }
        else {
            $confirm.slideUp();
            $login.text(Cryptpad.Messages._getKey('login_login'));
        }
    });

    var resetUI = function () {
        $username.val("");
        $password.val("");
        $confirm.val("");
        $remember[0].checked = false;
        $register[0].checked = false;
    };

    if (Cryptpad.getUserHash()) {
        //Cryptpad.alert("You are already logged in!");
        $logoutBox.slideDown();
    } else {
        revealLogin();
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

        // consume 128 bytes, to be divided later
        // we can safely increase this size, but we don't need much right now
        hashFromCreds(uname, passwd, 128, function (bytes) {
            useBytes(bytes, {
                remember: remember,
                register: register,
                name: uname,
            });
        });
    });
});
