// jshint ignore: start
define([
    '/common/common-util.js',
    '/common/common-constants.js',
    '/customize/messages.js',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/bower_components/chainpad-crypto/crypto.js',
], function (Util, Constants, Messages, CpNetflux, Crypto) {
    var Mailbox = {};

    Mailbox.init = function (store, waitFor, emit) {
        var mailbox = {};
        var ctx = {
            store: store,
            emit: emit,
        };

        mailbox.removeClient = function (clientId) {
            // TODO
            //removeClient(ctx, clientId);
        };
        mailbox.leavePad = function (padChan) {
            // TODO
            //leaveChannel(ctx, padChan);
        };
        mailbox.execCommand = function (clientId, obj, cb) {
            var cmd = obj.cmd;
            var data = obj.data;
        };

        return mailbox;
    };

    return Mailbox;
});

