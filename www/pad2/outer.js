
define([
    '/common/sframe-channel.js',
    'jquery',
    '/common/sframe-chainpad-netflux-outer.js',
    '/bower_components/nthen/index.js',
    '/common/cryptpad-common.js',
    '/bower_components/chainpad-crypto/crypto.js'
], function (SFrameChannel, $, CpNfOuter, nThen, Cryptpad, Crypto) {
    console.log('xxx');
    var sframeChan;
    nThen(function (waitFor) {
        $(waitFor());
    }).nThen(function (waitFor) {
        SFrameChannel.create($('#sbox-iframe')[0].contentWindow, waitFor(function (sfc) {
            sframeChan = sfc;
            console.log('sframe initialized');
        }));
        Cryptpad.ready(waitFor());
    }).nThen(function (waitFor) {
        var parsed = Cryptpad.parsePadUrl(window.location.href);
        if (!parsed.type) { throw new Error(); }
        var defaultTitle = Cryptpad.getDefaultName(parsed);
        var updateMeta = function () {
            console.log('EV_METADATA_UPDATE');
            var name;
            nThen(function (waitFor) {
                Cryptpad.getLastName(waitFor(function (n) { name = n }));
            }).nThen(function (waitFor) {
                sframeChan.event('EV_METADATA_UPDATE', {
                    doc: {
                        defaultTitle: defaultTitle,
                        type: parsed.type
                    },
                    myID: Cryptpad.getNetwork().webChannels[0].myID,
                    user: {
                        name: name,
                        uid: Cryptpad.getUid(),
                        avatar: Cryptpad.getAvatarUrl(),
                        profile: Cryptpad.getProfileUrl(),
                        curvePublic: Cryptpad.getProxy().curvePublic
                    }
                });
            });
        };
        Cryptpad.onDisplayNameChanged(updateMeta);
        sframeChan.onReg('EV_METADATA_UPDATE', updateMeta);

        Cryptpad.onError(function (info) {
            console.log('error');
            console.log(info);
            if (info && info.type === "store") {
                //onConnectError();
            }
        });

        var secret = Cryptpad.getSecrets();
        var readOnly = secret.keys && !secret.keys.editKeyStr;
        if (!secret.keys) { secret.keys = secret.key; }

        CpNfOuter.start({
            sframeChan: sframeChan,
            channel: secret.channel,
            network: Cryptpad.getNetwork(),
            validateKey: secret.keys.validateKey || undefined,
            readOnly: readOnly,
            crypto: Crypto.createEncryptor(secret.keys),
        });
    });
});