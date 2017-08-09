
define([
    '/common/sframe-channel.js',
    'jquery',
    '/common/sframe-chainpad-netflux-outer.js',
    '/bower_components/nthen/index.js',
    '/common/cryptpad-common.js',
    '/bower_components/chainpad-crypto/crypto.js'
], function (SFrameChannel, $, CpNfOuter, nThen, Cryptpad, Crypto) {
    console.log('xxx');
    nThen(function (waitFor) {
        $(waitFor());
    }).nThen(function (waitFor) {
        SFrameChannel.init($('#sbox-iframe')[0].contentWindow, waitFor(function () {
            console.log('sframe initialized');
        }));
        Cryptpad.ready(waitFor());
    }).nThen(function (waitFor) {
        Cryptpad.onError(function (info) {
            console.log('error');
            console.log(info);
            if (info && info.type === "store") {
                //onConnectError();
            }
        });
    }).nThen(function (waitFor) {
        var secret = Cryptpad.getSecrets();
        var readOnly = secret.keys && !secret.keys.editKeyStr;
        if (!secret.keys) { secret.keys = secret.key; }

        var outer = CpNfOuter.start({
            channel: secret.channel,
            network: Cryptpad.getNetwork(),
            validateKey: secret.keys.validateKey || undefined,
            readOnly: readOnly,
            crypto: Crypto.createEncryptor(secret.keys),
        });
    });
});