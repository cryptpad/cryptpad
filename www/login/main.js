define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/cryptpad-common.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
    '/bower_components/scrypt-async/scrypt-async.min.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Config, Listmap, Crypto, Cryptpad) {
    var $ = window.jQuery;
    var Scrypt = window.scrypt;
    var Nacl = window.nacl;

    Cryptpad.styleAlerts();

    var secret = {};

    var module = window.APP = {
        Cryptpad: Cryptpad,
    };

    var print = function (S, t) {
        $('body').append($('<' + (t || 'p') + '>').text(S));
    };

    var getInputs = function (cb) {
        Cryptpad.prompt("What is your username?", "", function (name) {
            if (!name || typeof(name) !== 'string') { return cb('no name'); }
            setTimeout(function () {
                Cryptpad.prompt("What is your password?", "", function (pw) {
                    if (!pw || typeof(pw) !== 'string') { return cb('no password'); }
                    cb(void 0, {
                        password: pw,
                        salt: name,
                    });
                }, {
                    sensitive: true,
                });
            }, 1000);
        });
    };

    var login = function (cb) {
        getInputs(function (err, input) {
            if (err) {
                Cryptpad.alert(err);
                return;
            }

            var time = +new Date();
            Scrypt(input.password,
                input.salt,
                8, // memoryCost (n)
                1024, // block size parameter (r)
                128, // dkLen
                undefined && 200, // interruptStep
                function (S) {
                    print("Login took " + ((+new Date()) -time )+ "ms");
                    cb(S);
                },
                'base64');
        });
    };

    var read = function (proxy) {
        console.log("Proxy ready!");

        var otime = +new Date(proxy.atime);

        var atime = proxy.atime = ('' + new Date());

        if (otime) {
            print("Last visit was " +
                (((+new Date(atime)) - otime) / 1000) +
                " seconds ago");
        }

        proxy.ctime = proxy.ctime || atime;
        proxy.schema = proxy.schema || 'login_data';
        print(JSON.stringify(proxy, null, 2), 'pre');
    };

    var change = function (o, n, p) {
        console.log("change at [%s] %s => %s", p.join(","), o, n);
    };

    var remove = function (o, p, root) {
        console.log("removal at [%s]", p.join(','));
    };

    var ready = function (proxy, next) {
        //console.log("umm");
        proxy.on('ready', function (info) {
            read(proxy);

            proxy.on('change', [], change)
            .on('remove', [], remove);
            next();
        })
        .on('disconnect', function (info) {

        });
    };

    var authenticated = function (password, next) {
        console.log("Authenticated!");
        var secret = {};

        secret.channel = password.slice(0, 32);
        secret.key = password.slice(32, 48);
        secret.junk = password.slice(48, 64); // consider reordering things
        secret.curve = password.slice(64, 96);
        secret.ed = password.slice(96, 128);

        print(JSON.stringify(secret, null, 2), 'pre');

        var config = {
            websocketURL: Config.websocketURL,
            channel: secret.channel,
            data: {},
            crypto: Crypto.createEncryptor(secret.key),
            loglevel: 0,
        };

        console.log("creating proxy!");
        var rt = module.rt = Listmap.create(config);

        next(rt.proxy, function () {
            Cryptpad.log("Ready!");
        });
    };

    $('#login').click(function () {
        login(function (hash) {
            print('Your Key', 'h1');
            print(hash, 'pre');
            authenticated(hash, ready);
        });
    });
});
