require.config({ paths: { 'json.sortify': '/bower_components/json.sortify/dist/JSON.sortify' } });
define([
    '/common/cryptpad-common.js',
    '/common/rpc.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Cryptpad, RPC) {
    var $ = window.jQuery;
    var APP = window.APP = {
        Cryptpad: Cryptpad,
    };

    $(function () {
        Cryptpad.ready(function (err, env) {
            var network = Cryptpad.getNetwork();
            var rpc = RPC.create(network); // TODO signing key

            var payload = {
                a: Math.floor(Math.random() * 1000),
                b: 7,
            };

            // console.log(payload);
            rpc.send('ECHO', payload, function (e, msg) {
                if (e) { return void console.error(e); }
                console.log(msg);
            });

            // test a non-existent RPC call
            rpc.send('PEWPEW', ['pew'], function (e, msg) {
                if (e) { return void console.error(e); }
                console.log(msg);
            });

            var list = Cryptpad.getUserChannelList();
            if (list.length) {
                rpc.send('GET_FILE_SIZE', list[0], function (e, msg) {
                    if (e) {
                        return void console.error(e);
                    }
                    console.log(msg);
                });
            }
            rpc.send('GET_FILE_SIZE', 'pewpew', function (e, msg) {
                if (e) { return void console.error(e); }
                console.log(msg);
            });
        });
    });
});
