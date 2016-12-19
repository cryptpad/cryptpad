define([
    '/customize/messages.js?app=read',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/common/cryptpad-common.js',
], function (Messages, Crypto, Realtime, Cryptpad) {
    var Crypt = {};

    var finish = function (Session, err, doc) {
        if (Session.done) { return; }
        Session.cb(err, doc);
        Session.done = true;

        var abort = Cryptpad.find(Session,
            ['realtime', 'realtime', 'abort']);
        if (typeof(abort) === 'function') { abort(); }
    };

    var get = Crypt.get = function (hash, cb, opt) {
        if (typeof(cb) !== 'function') {
            throw new Error('Crypt.get expects a callback');
        }

        var Session = {
            cb: cb,
        };
        opt = opt || {};
        var secret = Session.secret = Cryptpad.getSecrets(hash);

        var config = {
            websocketURL: Cryptpad.getWebsocketURL(),
            channel: secret.channel,
            crypto: Crypto.createEncryptor(secret.keys),
            logLevel: 0,
        };

        var onError = config.onError = function () {
            finish(Session, Messages.websocketError);
        };
        var onAbort = config.onAbort = function () {
            finish(Session, Messages.disconnectAlert);
        };

        var onReady = config.onReady = function (info) {
            var realtime = Session.realtime = info.realtime;
            finish(Session, void 0, realtime.getUserDoc());
        };

        var onConnectionChange = config.onConnectionChange = function (info) {
            if (info.state) { return; }
            finish(Session, Messages.disconnectAlert);
        };
        Object.keys(opt).forEach(function (k) { config[k] = opt[k]; });

        return (Session.realtime = Realtime.start(config));
    };

    return Crypt;
});
