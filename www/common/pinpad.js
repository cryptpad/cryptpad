define([
    '/common/cryptpad-common.js',
    '/common/rpc.js',

    '/bower_components/tweetnacl/nacl-fast.min.js'
], function (Cryptpad, Rpc) {
    var Nacl = window.nacl;

    var uniqueChannelList = function (list) {
        list = list || Cryptpad.getUserChannelList();
        return Cryptpad.deduplicateString(list).sort();
    };

    var localChannelsHash = function (fileList) {
        var uniqueList = uniqueChannelList(fileList);
        var hash = Nacl.util.encodeBase64(Nacl
            .hash(Nacl.util.decodeUTF8( JSON.stringify(uniqueList) )));
        return hash;
    };

    var getServerHash = function (rpc, edPublic, cb) {
        rpc.send('GET_HASH', edPublic, function (e, hash) {
            cb(e, hash[0]);
        });
    };

    var getFileSize = function (rpc, file, cb) {
        rpc.send('GET_FILE_SIZE', file, cb);
    };

    var getFileListSize = function (rpc, list, cb) {
        var bytes = 0;

        var left = list.length;

        list.forEach(function (chan) {
            getFileSize(rpc, chan, function (e, msg) {
                if (e) {
                    if (e === 'ENOENT') {

                        // these channels no longer exists on the server
                        console.log(e, chan);
                    } else {
                        console.error(e);
                    }
                } else if (msg && msg[0] && typeof(msg[0]) === 'number') {
                    bytes += msg[0];
                    //console.log(bytes);
                } else {
                    console.log("returned message was not a number: ", msg);
                }

                --left;
                if (left === 0) {
                    cb(void 0, bytes);
                }
            });
        });
    };

    var pinChannel = function (rpc, channel, cb) {
        rpc.send('PIN', channel, cb);
    };

    var unpinChannel = function (rpc, channel, cb) {
        rpc.send('UNPIN', channel, cb);
    };

    var reset = function (rpc, cb) {
        rpc.send('RESET', undefined, cb);
    };

            /*
1. every time you want to pin or unpid a pad you send a message to the server
2. the server sends back a hash of the sorted list of your pinned pads
3. you hash your sorted list of pinned pads that you should have according to your drive
4. compare them, if same
    AWESOME
  if they are not
    UNPIN all, send all
            */


    // Don't use create until Cryptpad is ready
    // (use Cryptpad.ready)
    var create = function (cb) {
        // you will need to communicate with the server
        // use an already established
        var network = Cryptpad.getNetwork();

        // your user proxy contains credentials you will need to make RPC calls
        var proxy = Cryptpad.getStore().getProxy().proxy;

        var edPrivate = proxy.edPrivate;
        var edPublic = proxy.edPublic;

        if (!(edPrivate && edPublic)) { return void cb('INVALID_KEYS'); }

        Rpc.create(network, edPrivate, edPublic, function (e, rpc) {
            if (e) { return void cb(e); }

            var exp = {};
            exp.publicKey = edPublic;
            exp.send = rpc.send;

            exp.uniqueChannelList = uniqueChannelList;

            exp.getFileSize = function (file, cb) {
                getFileSize(rpc, file, cb);
            };
            exp.getFileListSize = function (list, cb) {
                getFileListSize(rpc, list, cb);
            };
            exp.getServerHash = function (cb) {
                getServerHash(rpc, edPublic, cb);
            };

            exp.pin = function (channel, cb) {
                pinChannel(rpc, channel, cb);
            };
            exp.unpin = function (channel, cb) {
                unpinChannel(rpc, channel, cb);
            };
            exp.reset = function (cb) {
                reset(rpc, cb);
            };

            exp.localChannelsHash = localChannelsHash;

            cb(e, exp);
        });
    };

    return { create: create };
});
