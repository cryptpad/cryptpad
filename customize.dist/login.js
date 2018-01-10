define([
    'jquery',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/common-util.js',
    '/common/outer/network-config.js',
    '/customize/credential.js',
    '/bower_components/chainpad/chainpad.dist.js',

    '/bower_components/tweetnacl/nacl-fast.min.js',
    '/bower_components/scrypt-async/scrypt-async.min.js', // better load speed
], function ($, Listmap, Crypto, Util, NetConfig, Cred, ChainPad) {
    var Exports = {
        Cred: Cred,
    };

    var Nacl = window.nacl;
    var allocateBytes = function (bytes) {
        var dispense = Cred.dispenser(bytes);

        var opt = {};

        // dispense 18 bytes of entropy for your encryption key
        var encryptionSeed = dispense(18);
        // 16 bytes for a deterministic channel key
        var channelSeed = dispense(16);
        // 32 bytes for a curve key
        var curveSeed = dispense(32);

        var curvePair = Nacl.box.keyPair.fromSecretKey(new Uint8Array(curveSeed));
        opt.curvePrivate = Nacl.util.encodeBase64(curvePair.secretKey);
        opt.curvePublic = Nacl.util.encodeBase64(curvePair.publicKey);

        // 32 more for a signing key
        var edSeed = opt.edSeed = dispense(32);

        // derive a private key from the ed seed
        var signingKeypair = Nacl.sign.keyPair.fromSeed(new Uint8Array(edSeed));

        opt.edPrivate = Nacl.util.encodeBase64(signingKeypair.secretKey);
        opt.edPublic = Nacl.util.encodeBase64(signingKeypair.publicKey);

        var keys = opt.keys = Crypto.createEditCryptor(null, encryptionSeed);

        // 24 bytes of base64
        keys.editKeyStr = keys.editKeyStr.replace(/\//g, '-');

        // 32 bytes of hex
        var channelHex = opt.channelHex = Util.uint8ArrayToHex(channelSeed);

        // should never happen
        if (channelHex.length !== 32) { throw new Error('invalid channel id'); }

        opt.channel64 = Util.hexToBase64(channelHex);

        opt.userHash = '/1/edit/' + [opt.channel64, opt.keys.editKeyStr].join('/');

        return opt;
    };

    var loadUserObject = function (opt, cb) {
        var config = {
            websocketURL: NetConfig.getWebsocketURL(),
            channel: opt.channelHex,
            data: {},
            validateKey: opt.keys.validateKey, // derived validation key
            crypto: Crypto.createEncryptor(opt.keys),
            logLevel: 1,
            classic: true,
            ChainPad: ChainPad,
        };

        var rt = opt.rt = Listmap.create(config);
        rt.proxy
        .on('ready', function () {
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
        if (isRegister && !Cred.isLongEnoughPassword(passwd)) {
            return void cb('PASS_TOO_SHORT');
        }

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

                // they're registering...
                res.userHash = opt.userHash;
                res.userName = uname;

                // export their signing key
                res.edPrivate = opt.edPrivate;
                res.edPublic = opt.edPublic;

                res.curvePrivate = opt.curvePrivate;
                res.curvePublic = opt.curvePublic;

                // they tried to just log in but there's no such user
                if (!isRegister && isProxyEmpty(rt.proxy)) {
                    rt.network.disconnect(); // clean up after yourself
                    return void cb('NO_SUCH_USER', res);
                }

                // they tried to register, but those exact credentials exist
                if (isRegister && !isProxyEmpty(rt.proxy)) {
                    rt.network.disconnect();
                    return void cb('ALREADY_REGISTERED', res);
                }

                setTimeout(function () { cb(void 0, res); });
            });
        });
    };

    return Exports;
});
