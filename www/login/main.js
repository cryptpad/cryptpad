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

    var APP = window.APP = {
        Cryptpad: Cryptpad,
        Crypto: Crypto,
    };

    var print = function (S, t) {
        $('body').append($('<' + (t || 'p') + '>').text(S));
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

    var useBytes = function (bytes) {
        var firstSeed = bytes.slice(0, 18);
        var secondSeed = bytes.slice(18, 35);

        var remainder = bytes.slice(34);

        var seed = {};
        seed.keys = Crypto.createEditCryptor(null, firstSeed);

        seed.keys.editKeyStr = seed.keys.editKeyStr.replace(/\//g, '-');

        seed.channel = Cryptpad.uint8ArrayToHex(secondSeed);

        console.log(seed);

        var channelHex = seed.channel;
        var channel64 = Cryptpad.hexToBase64(channelHex);

        console.log(seed.keys.editKeyStr);

        seed.editHash = Cryptpad.getEditHashFromKeys(channelHex, seed.keys.editKeyStr);

        var secret = Cryptpad.getSecrets(seed.editHash);
        console.log(secret);

        console.log(seed.editHash);

        //return;

        var config = {
            websocketURL: Cryptpad.getWebsocketURL(),
            channel: channelHex,
            data: {},
            validateKey: seed.keys.validateKey || undefined,
            readOnly: seed.keys && !seed.keys.editKeyStr,
            crypto: Crypto.createEncryptor(seed.keys),
        };

        var rt = APP.rt = Listmap.create(config);

        rt.proxy.on('create', function (info) {
            console.log('created');
            //console.log(info);
        })
        .on('ready', function (info) {
            console.log('ready');
            //console.log(info);

            var proxy = rt.proxy;

            var now = +(new Date());
            if (!proxy.atime) {
                console.log("first time visiting!");
                proxy.atime = now;
            } else {
                console.log("last visit was %ss ago", (now - proxy.atime) / 1000);
                proxy.atime = now;
            }

            console.log(proxy);
        })
        .on('disconnect', function (info) {
            console.log('disconnected');
            console.log(info);
        });
    };

    var isValidUsername = function (name) {
        return !!name;
    };

    var isValidPassword = function (passwd) {
        return !!passwd;
    };

    var $username = $('#username');
    var $password = $('#password');

    0 && hashFromCreds('ansuz', 'pewpewpew', 128, useBytes);

    $('#login').click(function () {
        var uname = $username.val();
        var passwd = $password.val();

        if (!isValidUsername(uname)) {
            return void Cryptpad.alert('invalid username');
        }

        if (!isValidPassword(passwd)) {
            return void Cryptpad.alert('invalid password');
        }

        $username.val("");
        $password.val("");

        // we need 18 bytes for the regular crypto
        hashFromCreds(uname, passwd, 128, function (bytes) {
            //console.log(bytes);
            useBytes(bytes);
        });
    });
});
