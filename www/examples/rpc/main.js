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
            var proxy = Cryptpad.getStore().getProxy().proxy;

            var edPrivate = proxy.edPrivate;
            var edPublic = proxy.edPublic;

            var payload = {
                a: Math.floor(Math.random() * 1000),
                b: 7,
            };

            RPC.create(network, edPrivate, edPublic, function (e, rpc) {
                // console.log(payload);
                rpc.send('ECHO', payload, function (e, msg) {
                    if (e) { return void console.error(e); }
                    console.log(msg);
                });

                // test a non-existent RPC call
                rpc.send('PEWPEW', ['pew'], function (e, msg) {
                    if (e) {
                        if (e === 'UNSUPPORTED_RPC_CALL') { return; }
                        return void console.error(e);
                    }
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
                    if (e) {
                        if (e === 'INVALID_CHAN') { return; }
                        return void console.error(e);
                    }
                    console.log(msg);
                });

                rpc.send('GET_FILE_SIZE', '26f014b2ab959418605ea37a6785f317', function (e, msg) {
                    if (e) {
                        if (e === 'ENOENT') { return; }
                        return void console.error(e);
                    }
                    console.error("EXPECTED ENOENT");
                    console.log(msg);
                });

                (function () {
                    // compute what you think the hash should be

                    // then ask the server if what it has matches your records
                    rpc.send('GET_HASH', edPublic, function (e, hash) {
                        if (e) { return void console.error(e); }


                        console.log("user pins hash is [%s]", hash);
                        // if it does, awesome!
                        // you should be able to pin and unpin things easily

                        // if it doesn't, send a reset, and start re-pinning



                    });
                }());

                if (false) {
                (function () {
                    var bytes = 0;
                    list.forEach(function (chan) {
                        rpc.send('GET_FILE_SIZE', chan, function (e, msg) {
                            if (e) {
                                if (e === 'ENOENT') {
                                    return void console.log(e, chan);
                                }
                                return void console.error(e);
                            }
                            if (msg && msg[0] && typeof(msg[0]) === 'number') {
                                bytes += msg[0];
                                console.log(bytes);
                            } else {
                                console.log(msg);
                            }
                        });
                    });
                }());
                }
            });
        });
    });
});
