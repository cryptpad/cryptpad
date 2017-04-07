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

    var getFileListSize = function (rpc, cb) {
        return rpc.send('GET_TOTAL_SIZE', undefined, cb);
    };

    var pinChannel = function (rpc, channel, cb) {
        rpc.send('PIN', channel, cb);
    };

    var unpinChannel = function (rpc, channel, cb) {
        rpc.send('UNPIN', channel, cb);
    };

    var reset = function (rpc, cb) {
        var list = uniqueChannelList();
        rpc.send('RESET', list, cb);
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
            exp.getFileListSize = function (cb) {
                getFileListSize(rpc, cb);
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
