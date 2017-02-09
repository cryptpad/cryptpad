define([
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/cryptpad-common.js',
    '/common/credential.js',
    '/common/login.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
    '/bower_components/scrypt-async/scrypt-async.min.js', // better load speed
    '/bower_components/jquery/dist/jquery.min.js',
], function (Listmap, Crypto, Cryptpad, Cred, Login) {
    var $ = window.jQuery;
    var Nacl = window.nacl;

    var USERNAME_KEY = 'cryptpad.username';

    var APP = window.APP = {
        Cryptpad: Cryptpad,
        Crypto: Crypto,
        Login: Login,
    };

    // login elements
    var $loginBox = $('#login-panel');
    var $login = $('#login');
    var $login_register = $('#login_register');
    var $username = $('#username');
    var $password = $('#password');
    var $password_register = $('#confirm_register');

    // hashing elements
    var $noticeBox = $('#notice-panel');
    var $notice = $('#notice');

    APP.setNotice = function (s) {
        $notice.text(s);
    };

    APP.redirectToDrive = function () {
        document.location.href = '/drive/';
    };

    // confirm elements
    var $confirmBox = $('#confirm-panel');
    var $confirm = $('#confirm');
    var $cancelRegister = $('#cancel-register');
    var $register = $('#register');

    // log out elements
    var $logoutBox = $('#logout-panel');
    var $logout = $('#logout');

    // user elements
    var $userBox = $('#user-panel');
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
                //$username.focus();
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

        Cryptpad.login(opt.userHash, getAccountName(proxy));
        APP.revealLogin(false);
        APP.redirectToDrive();
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
    addEnterListener($password_register, function () {
        $login.click();
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

    var handleNewUser = function (proxy, opt, force) {
        // could not find a profile for that username/password
        var todo = function () {
            APP.confirming = false;
            APP.setAccountName((proxy.login_name = opt.name));
            APP.setDisplayName(APP.getDisplayName(proxy));

            // remember your curve key
            proxy.curve = Cryptpad.uint8ArrayToHex(opt.curveSeed);

            // remember your ed seed
            proxy.ed = Cryptpad.uint8ArrayToHex(opt.edSeed);

            // remember the first time you visited
            proxy.ctime = opt.now;

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

                        var whenSynced = function () {
                            if (!proxy[USERNAME_KEY]) {
                                proxy[USERNAME_KEY] = opt.name;
                            }
                            next();
                        };

                        // Make sure the migration is synced in chainpad before continuing otherwise
                        // we may leave that page too early or trigger a reload in another tab before
                        // the migration is complete
                        var check = function () {
                            if (APP.realtime.getUserDoc() === APP.realtime.getAuthDoc()) {
                                whenSynced();
                                return;
                            }
                            window.setTimeout(check, 300);
                        };
                        check();
                    });
                });
            });
        };
        if (force) {
            todo();
            return;
        }
        confirmPassword(proxy, opt.password, todo);
    };

    var handleUser = function (proxy, opt) {
        var proxyKeys = Object.keys(proxy);
        var now = opt.now = +(new Date());

        if (!proxyKeys.length) {
            if (opt.register) {
                return handleNewUser(proxy, opt, true);
            }
            return handleNewUser(proxy, opt);
        }
        handleRegisteredUser(proxy, opt);
    };

    var useBytes = function (bytes, opt) {
        opt = opt || {};

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
            logLevel: 1,
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

    var showUserInfo = function () {
        /*  TODO use something like this for a user preferences page

            revealLogout(true);
            var proxy = Cryptpad.getStore().getProxy().proxy;

            APP.setAccountName(proxy.login_name);
            APP.setDisplayName(getDisplayName(proxy));
            return;
            revealUser(true);
        */
    };

    Cryptpad.ready(function () {
        // If the user is already logged in...
        // TODO show user preferences
        if (Cryptpad.getUserHash()) { return APP.redirectToDrive(); }

        $login.click(function () {
            var uname = $username.val().trim();
            var passwd = $password.val();
            var passwd_confirm = $password_register.val();
            var confirm = $confirm.val();

            var register = document.location.hash.slice(1) === 'register';

            if (passwd !== passwd_confirm && register) {
                return void Cryptpad.alert("Passwords are not the same");
            }
            if (!Cred.isValidUsername(uname)) {
                return void Cryptpad.alert('invalid username');
            }
            if (!Cred.isValidPassword(passwd)) {
                return void Cryptpad.alert('invalid password');
            }

            APP.setNotice(Cryptpad.Messages.login_hashing);

            // inform the user that we're hashing their password
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
                                register: register,
                                name: uname,
                                password: passwd,
                            });
                        }, 75);
                    });
                }, 75);
            });
        });

        // if the user is not logged in...
        if (sessionStorage.register || document.location.hash.slice(1) === 'register') {
            Cryptpad.replaceHash('register');
            $login.text(Cryptpad.Messages.login_register);
            $('#login-panel .register').show();
        }

        $username.focus();

        if (sessionStorage.login || sessionStorage.register) {
            $username.val(sessionStorage.login_user);
            $password.val(sessionStorage.login_pass);
        }

        if (sessionStorage.login) {
            APP.setNotice(Cryptpad.Messages.login_hashing);
            APP.revealNotice(true, function () {
                $login.click();
                Cryptpad.eraseTempSessionValues();
            });
            return;
        }
        revealLogin(true, function () {
            if (sessionStorage.register) { $password_register.focus(); }
            Cryptpad.eraseTempSessionValues();
        });
    });
});

