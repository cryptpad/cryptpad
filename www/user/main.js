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

    var USERNAME_KEY = 'cryptpad.username';

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
    var $remember = $('#remember');

    // hashing elements
    var $noticeBox = $('#notice-box');
    var $notice = $('#notice');

    APP.setNotice = function (s) {
        $notice.text(s);
    };

    // confirm elements
    var $confirmBox = $('#confirm-box');
    var $confirm = $('#confirm');
    var $cancelRegister = $('#cancel-register');
    var $register = $('#register');

    // log out elements
    var $logoutBox = $('#logout-box');
    var $logout = $('#logout');

    // user elements
    var $userBox = $('#user-box');
    var $displayNameLabel = $('#display-name');
    var $userNameLabel = $('#user-name');

    var revealer = function ($el) {
        return function (bool, cb) {
            $el[bool?'slideDown': 'slideUp'](400, cb);
        };
    };

    var revealLogin = APP.revealLogin = revealer($loginBox);
    var revealNotice = APP.revealNotice = revealer($noticeBox);
    var revealConfirm = APP.revealConfirm = revealer($confirmBox);

    var revealLogout = APP.revealLogout= revealer($logoutBox);
    var revealUser = APP.revealUser = revealer($userBox);

    var getDisplayName = APP.getDisplayName = function (proxy) {
        return proxy['cryptpad.username'];
    };

    var getAccountName = APP.getAccountName = function (proxy) {
        return proxy.login_name;
    };

    APP.setAccountName = function (user) {
        $userNameLabel.text(user || 'unknown');
    };
    APP.setDisplayName = function (display) {
        $displayNameLabel.text(display || 'anonymous');
    };

    var resetUI = APP.resetUI = function () {
        $username.val("");
        $password.val("");
        $confirm.val("");
        APP.setAccountName('');
        APP.setDisplayName('');
    };

    APP.abort = function () {
        if (!(APP.realtime && APP.realtime.abort)) { return; }
        console.log('aborting realtime session');
        APP.realtime.abort();
    };

    APP.logout = function () {
        Cryptpad.confirm("Are you sure?", function (yes) {
            if (!yes) { return; }
            Cryptpad.logout(function () {
                revealLogout(false);
                revealLogin(true);
                revealUser(false);
                APP.abort();
                $username.focus();
            });
        });
    };

    $logout.click(function () {
        APP.logout();
    });

    var handleRegisteredUser = function (proxy, opt) {
        if (!proxy.atime) {
            console.log("first time visiting!");
        }
        else {
            console.log("last login was %ss ago", (opt.now - proxy.atime) / 1000);
        }

        // welcome back
        proxy.atime = opt.now;

        APP.setAccountName(getAccountName(proxy));
        APP.setDisplayName(getDisplayName(proxy));

        Cryptpad.login(opt.userHash, opt.remember);
        APP.revealLogin(false);
        APP.revealUser(true);
        APP.revealLogout(true);
    };

    var abortRegistration = function () {
        if (!APP.confirming) { return; }
        APP.abort();
        APP.revealConfirm(false);
        APP.revealLogin(true);
    };

    $cancelRegister.click(function () {
        abortRegistration();
    });

    $register.click(function () {
        if (!APP.confirming) { return; }

        if (typeof(APP.register) === 'function') {
            APP.register();
        }
    });

    var addEnterListener = function ($el, f) {
        $el.on('keyup', function (e) {
            if (e.which !== 13) { return; } // enter
            window.clearTimeout(APP.to);
            APP.to = window.setTimeout(function () {
                f();
                window.clearTimeout(APP.to);
            });
        });
    };

    addEnterListener($confirm, function () {
        $register.click();
    });
    addEnterListener($password, function () {
        $login.click();
    });

    var confirmPassword = function (proxy, passwd, cb) {
        APP.confirming = true;

        revealLogin(false);
        // reveal confirm box
        revealConfirm(true);

        $confirm.focus();

        APP.register = function () {
            if ($confirm.val() === passwd) {
                return void Cryptpad.alert(Cryptpad.Messages.login_registerSuccess, cb);
            }
            Cryptpad.alert(Cryptpad.Messages.login_passwordMismatch, function (e) {
                e.preventDefault();
                window.setTimeout(function () { $confirm.focus(); }, 75);
            });
        };
    };

    var handleNewUser = function (proxy, opt) {
        // could not find a profile for that username/password
        confirmPassword(proxy, opt.password, function () {
            APP.confirming = false;
            APP.setAccountName((proxy.login_name = opt.name));
            APP.setDisplayName(APP.getDisplayName(proxy));

            // remember your curve key
            proxy.curve = Cryptpad.uint8ArrayToHex(opt.curveSeed);

            // remember your ed seed
            proxy.ed = Cryptpad.uint8ArrayToHex(opt.edSeed);

            var next = function () {
                revealConfirm(false);
                handleRegisteredUser(proxy, opt);
            };

            Cryptpad.confirm(Cryptpad.Messages.login_migrate, function (yes) {
                if (!yes) { return next(); }

                Cryptpad.store.keys(function (e, keys) {
                    if (e) { return void console.error(e); }
                    Cryptpad.store.getBatch(keys, function (e, map) {
                        if (e) { return void console.error(e); }
                        keys.forEach(function (k) {
                            console.log("migrating %s from existing store", k);
                            proxy[k] = map[k];
                        });

                        delete localStorage.FS_hash;

                        if (!proxy[USERNAME_KEY]) {
                            proxy[USERNAME_KEY] = opt.name;
                        }

                        next();
                    });
                });
            });
        });
    };

    var handleUser = function (proxy, opt) {
        var proxyKeys = Object.keys(proxy);
        var now = opt.now = +(new Date());

        if (!proxyKeys.length) {
            return handleNewUser(proxy, opt);
        }
        handleRegisteredUser(proxy, opt);
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
        var curveSeed = opt.curveSeed = dispense(32);
        // 32 more for a signing key
        var edSeed = opt.edSeed = dispense(32);

        var keys = opt.keys = Crypto.createEditCryptor(null, encryptionSeed);

        // 24 bytes of base64
        keys.editKeyStr = keys.editKeyStr.replace(/\//g, '-');

        // 32 bytes of hex
        opt.channel = Cryptpad.uint8ArrayToHex(channelSeed);

        var channelHex = opt.channel;

        if (channelHex.length !== 32) { throw new Error('invalid channel id'); }

        var channel64 = opt.channel64 = Cryptpad.hexToBase64(channelHex);

        var userHash = opt.userHash = '/1/edit/' + [opt.channel64, opt.keys.editKeyStr].join('/');

        var config = {
            websocketURL: Cryptpad.getWebsocketURL(),
            channel: channelHex,
            data: {},
            validateKey: keys.validateKey, // derived validation key
            crypto: Crypto.createEncryptor(opt.keys),
        };

        var rt = APP.rt = Listmap.create(config);

        rt.proxy.on('create', function (info) {
            APP.realtime = info.realtime;
        })
        .on('ready', function (info) {
            console.log('ready');
            handleUser(rt.proxy, opt);
        })
        .on('disconnect', function (info) {
            console.log('disconnected');
            console.log(info);
        });
    };
    Cryptpad.ready(function () {
        if (Cryptpad.getUserHash()) {
            revealLogout(true);
            var proxy = Cryptpad.getStore().getProxy().proxy;

            APP.setAccountName(proxy.login_name);
            APP.setDisplayName(getDisplayName(proxy));

            revealUser(true);
        } else {
            revealLogin(true);
        }

        $username.focus();

        $login.click(function () {
            var uname = $username.val().trim();
            var passwd = $password.val();
            var confirm = $confirm.val();
            var remember = $remember[0].checked;

            if (!Cred.isValidUsername(uname)) {
                return void Cryptpad.alert('invalid username');
            }
            if (!Cred.isValidPassword(passwd)) {
                return void Cryptpad.alert('invalid password');
            }

            APP.setNotice(Cryptpad.Messages.login_hashing);

            revealNotice(true);
            revealLogin(false, function () {
            window.setTimeout(function () {
                resetUI();
                // dispense 128 bytes, to be divided later
                // we can safely increase this size, but we don't need much right now
                Cred.deriveFromPassphrase(uname, passwd, 128, function (bytes) {
                    revealNotice(false);
                    window.setTimeout(function () {
                        useBytes(bytes, {
                            remember: remember,
                            //register: register,
                            name: uname,
                            password: passwd,
                        });
                    }, 75);
                });
            }, 75);
            });
        });
    });
});
