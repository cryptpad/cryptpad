/* globals process */
var Client = require("../../lib/client");
var Nacl = require("tweetnacl/nacl-fast");
var nThen = require("nthen");
var CPNetflux = require("../../www/bower_components/chainpad-netflux/chainpad-netflux");
var Hash = require("../../www/common/common-hash");
var Rpc = require("../../www/common/rpc");
var HK = require("../../lib/hk-util");


var identity = function (x) {
    return x;
};
var crypto = {
    encrypt: identity,
    decrypt: identity,
};

var N = 2;
var BREAK;

BREAK = 1;

var client;
nThen(function (w) {
    //console.log("Creating client");
    Client.create(w(function (err, _client) {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        client = _client;
    }));
}).nThen(function (w) {
    //console.log("Creating RPC module");
    Rpc.createAnonymous(client.config.network, w(function (err, rpc) {
        if (err) {
            w.abort();
            return void console.error('ANON_RPC_CONNECT_ERR');
        }
        client.anonRpc = rpc;
    }));
}).nThen(function (w) {
    var done = w();

    //console.log("sending random messages");

    client.channel = Hash.createChannelId();

    if (BREAK) {
        CPNetflux.start({
            //lastKnownHash: HK.getHash(client.sent[0]),
            network: client.config.network,
            channel: client.channel,
            crypto: crypto,
            noChainPad: true,
            onReady: w(),
            //onMessage: onMessage,
        });
    }

    // send a few random messages to a channel
    client.sent = [];
    var i = N;
    var send = function () {
        //console.log(i);
        if (i-- <= 0) { return void done(); }

        var ciphertext = Nacl.util.encodeBase64(Nacl.randomBytes(256));

        client.anonRpc.send('WRITE_PRIVATE_MESSAGE', [
            client.channel,
            ciphertext
        ], function (err) {
            if (err) { 
                console.error(err);
                process.exit(1);
            }
            client.sent.push(ciphertext);
            console.log("sent: %s", ciphertext);
            //setTimeout(send, 500);
            send();
        });
    };
    send();
}).nThen(function () {
    //process.exit(1);
    // connect to that channel with a lastKnownHash
    // check if the first message received has the hash that you asked for

    console.log();

    var lkh = HK.getHash(client.sent[0]);

    var i = 0;
    var onMessage = function (msg, user, vKey, isCp, hash /*, author */) {
        if (i === 0 && hash !== lkh) {
            console.error('incorrect hash: [%s]', hash);
            process.exit(1);
        }
        console.log(msg);
        if (++i >= N) {
            process.exit(1);
        }
    };

    CPNetflux.start({
        lastKnownHash: lkh,
        network: client.config.network,
        channel: client.channel,
        crypto: crypto,
        noChainPad: true,
        onMessage: onMessage,
    });
});

