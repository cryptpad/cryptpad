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

    var then = function (call) {
        call.getFileSize('26f014b2ab959418605ea37a6785f317', function (e, msg) {
            if (e) {
                if (e === 'ENOENT') { return; }
                return void console.error(e);
            }
            console.error("EXPECTED ENOENT");
            console.log(msg);
        });

        call.getFileSize('pewpew', function (e, msg) {
            if (e) {
                if (e === 'INVALID_CHAN') { return; }
                return void console.error(e);
            }
            console.log(msg);
        });

        var list = Cryptpad.getUserChannelList();
        if (list.length) {
            call.getFileSize(list[0], function (e, msg) {
                if (e) {
                    return void console.error(e);
                }
                console.log(msg);
            });
        }
        call.getServerHash(function (e, hash) {
            if (e) { return void console.error(e); }
            console.log("the server believes your user hash is [%s]", hash);
        });
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

/*
            console.log(JSON.stringify({
                local: localHash,
                remote: serverHash,
            }, null, 2));*/
        });
    };

    $(function () {
        Cryptpad.ready(function (err, env) {
            Pinpad.create(function (e, call) {
                if (e) { return void console.error(e); }
                // then(call);
                synchronize(call);
            });
        });
    });
});
