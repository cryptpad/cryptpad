define([
    '/common/encode.js',

    '/bower_components/tweetnacl/nacl-fast.min.js',
], function (Encode) {

    var getHistoryKeeperName = function (network) {
        var wc = network.webChannels[0];
        if (!wc) {
            throw new Error("ERROR: no joined webchannels so we can't get the history keeper name");
        }
        if (!wc.history_keeper) { throw new Error("ERROR: no history keeper"); }
        return wc.history_keeper;
    };

    var sendMsg = function (ctx, cb) {
        var hkn = getHistoryKeeperName(ctx.network);
    };

    var onMsg = function (ctx, msg) {
        console.log(msg);
    };

    var cookie = function (ctx, cb) {
        // TODO
    };

    var signMsg = function (msg, secKey) {
        // TODO
    };

    var create = function (network, edPrivateKey) {
        if (!/[0-9a-f]{64}/.test(edPrivateKey)) {
            throw new Error("private signing key is not valid");
        }
        var ctx = {
            privateKey: Encode.hexToUint8Array(edPrivateKey),
            seq: new Date().getTime(),
            network: network
        };
        network.on('message', function (msg) { onMsg(ctx, msg); });
        return {
            cookie: function (cb) { cookie(ctx, cb); },
        };
    };

    return { create: create };
});
