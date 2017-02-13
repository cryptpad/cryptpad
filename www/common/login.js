define([
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/cryptpad-common.js',
    '/common/credential.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
    '/bower_components/scrypt-async/scrypt-async.min.js', // better load speed
    '/bower_components/jquery/dist/jquery.min.js',
], function (Listmap, Crypto, Cryptpad, Cred) {
    var Exports = {
        Cred: Cred,
    };

    var allocateBytes = function (bytes) {
        var dispense = Cred.dispenser(bytes);

        var opt = {};

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
        var channelHex = opt.channelHex = Cryptpad.uint8ArrayToHex(channelSeed);

        // should never happen
        if (channelHex.length !== 32) { throw new Error('invalid channel id'); }

        var channel64 = opt.channel64 = Cryptpad.hexToBase64(channelHex);

        var userHash = opt.userHash = '/1/edit/' + [opt.channel64, opt.keys.editKeyStr].join('/');

        return opt;
    };

    var loadUserObject = function (opt, cb) {
        var config = {
            websocketURL: Cryptpad.getWebsocketURL(),
            channel: opt.channelHex,
            data: {},
            validateKey: opt.keys.validateKey, // derived validation key
            crypto: Crypto.createEncryptor(opt.keys),
            logLevel: 1,
        };

        var rt = opt.rt = Listmap.create(config);
        rt.proxy
        .on('ready', function (info) {
            cb(void 0, rt);
        })
        .on('disconnect', function (info) {
            cb('E_DISCONNECT', info);
        });
    };

    var isProxyEmpty = function (proxy) {
        return Object.keys(proxy).length === 0;
    };

    Exports.loginOrRegister = function (uname, passwd, isRegister, cb) {
        if (typeof(cb) !== 'function') { return; }

        // Usernames are all lowercase. No going back on this one
        uname = uname.toLowerCase();

        // validate inputs
        if (!Cred.isValidUsername(uname)) { return void cb('INVAL_USER'); }
        if (!Cred.isValidPassword(passwd)) { return void cb('INVAL_PASS'); }

        Cred.deriveFromPassphrase(uname, passwd, 128, function (bytes) {
            // results...
            var res = {
                register: isRegister,
            };

            // run scrypt to derive the user's keys
            var opt = res.opt = allocateBytes(bytes);

            // use the derived key to generate an object
            loadUserObject(opt, function (err, rt) {
                if (err) { return void cb(err); }

                res.proxy = rt.proxy;
                res.realtime = rt.realtime;
                res.network = rt.network;

                // they tried to just log in but there's no such user
                if (!isRegister && isProxyEmpty(rt.proxy)) {
                    rt.network.disconnect(); // clean up after yourself
                    return void cb('NO_SUCH_USER', res);
                }

                // they're registering...

                res.userHash = opt.userHash;
                res.userName = uname;
                //res.displayName // TODO

                cb(void 0, res);
            });
        });
    };

    return Exports;
});
