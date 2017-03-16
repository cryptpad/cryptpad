define([
    '/common/cryptpad-common.js',
    '/common/rpc.js',

    '/bower_components/tweetnacl/nacl-fast.min.js'
], function (Cryptpad, Rpc) {

    var Nacl = window.nacl;

    var create = function (network, ed) {
        var exp = {};
        var rpc = Rpc.create(network, ed);

        var checkHash = exp.checkHash = function (fileList) {
            fileList = fileList || Cryptpad.getUserChannelList();

            var channelIdList = [];
            fileList.forEach(function (href) {
                var parsedHref = Cryptpad.parsePadUrl(href);
                if (!parsedHref || !parsedHref.hash) { return; }
                var parsedHash = Cryptpad.parseHash(parsedHref.hash);
                if (!parsedHash || !parsedHash.channel) { return; }
                channelIdList.push(Cryptpad.base64ToHex(parsedHash.channel));
            });
            var uniqueList = Cryptpad.deduplicateString(channelIdList).sort();

            /*
1. every time you want to pin or unpid a pad you send a message to the server
2. the server sends back a hash of the sorted list of your pinned pads
3. you hash your sorted list of pinned pads that you should have according to your drive
4. compare them, if same
    AWESOME
  if they are not
    UNPIN all, send all
            */

            var hash = Nacl.util.encodeBase64(Nacl.hash(Nacl.util.decodeUTF8( JSON.stringify(uniqueList) )));

            return hash;
        };

        return exp;
    };

    return { create: create };
});
