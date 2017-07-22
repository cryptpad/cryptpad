define([
    'jquery',
    '/common/cryptpad-common.js',
    '/common/pinpad.js'
], function ($, Cryptpad, Pinpad) {
    window.APP = {
        Cryptpad: Cryptpad,
    };

    var synchronize = function (call) {
        // provide a sorted list of unique channels
        var list = Cryptpad.getCanonicalChannelList();

        var localHash = call.hashChannelList(list);
        var serverHash;

        call.getFileListSize(function (e, bytes) {
            if (e) { return void console.error(e); }
            console.log("total %sK bytes used", bytes / 1000);
        });

        call.getServerHash(function (e, hash) {
            if (e) { return void console.error(e); }
            serverHash = hash;

            if (serverHash === localHash) {
                return console.log("all your pads are pinned. There is nothing to do");
            }

            call.reset(list, function (e, response) {
                if (e) { return console.error(e); }
                else {
                    return console.log('reset pin list. new hash is [%s]', response);
                }
            });
        });
    };

    $(function () {
        Cryptpad.ready(function () {
            var network = Cryptpad.getNetwork();
            var proxy = Cryptpad.getStore().getProxy().proxy;

            Pinpad.create(network, proxy, function (e, call) {
                if (e) { return void console.error(e); }
                synchronize(call);
            });
        });
    });
});
