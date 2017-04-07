require.config({ paths: { 'json.sortify': '/bower_components/json.sortify/dist/JSON.sortify' } });
define([
    '/common/cryptpad-common.js',
    '/common/pinpad.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Cryptpad, Pinpad) {
    var $ = window.jQuery;
    var APP = window.APP = {
        Cryptpad: Cryptpad,
    };

    var synchronize = function (call) {
        var localHash = call.localChannelsHash();
        var serverHash;

        call.getFileListSize(function (e, bytes) {
            if (e) { return void console.error(e); }
            console.log("%s total bytes used", bytes);
        });

        call.getServerHash(function (e, hash) {
            if (e) { return void console.error(e); }
            serverHash = hash;

            if (serverHash === localHash) {
                return console.log("all your pads are pinned. There is nothing to do");
            }

            call.reset(function (e, response) {
                if (e) { return console.error(e); }
                else {
                    return console.log('reset pin list. new hash is [%s]', response);
                }
            });
        });
    };

    $(function () {
        Cryptpad.ready(function (err, env) {
            Pinpad.create(function (e, call) {
                if (e) { return void console.error(e); }
                synchronize(call);
            });
        });
    });
});
