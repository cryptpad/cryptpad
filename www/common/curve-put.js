define([
    '/common/curve.js',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
], function (Curve, Listmap) {
    var Edit = {};

    Edit.create = function (network, channel, theirs, mine, cb) {
        try {
            var encryptor = Curve.createEncryptor(theirs, mine);
            var lm = Listmap.create({
                network: network,
                data: {},
                channel: channel,
                readOnly: false,
                validateKey: undefined,
                crypto: encryptor,
                userName: 'lol',
                logLevel: 1,
            });

            var done = function () {
                // TODO make this abort and disconnect the session after the
                // user has finished making changes to the object, and they
                // have propagated.
            };

            lm.proxy
            .on('create', function () {
                console.log('created');
            })
            .on('ready', function () {
                console.log('ready');
                cb(lm, done);
            })
            .on('disconnect', function () {
                console.log('disconnected');
            })
            .on('change', [], function (o, n, p) {
                console.log(o, n, p);
            });
        } catch (e) {
            console.error(e);
        }
    };

    return Edit;
});
