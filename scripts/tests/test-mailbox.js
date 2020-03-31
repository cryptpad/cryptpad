/* globals process */

var Client = require("../../lib/client/");
var Crypto = require("../../www/bower_components/chainpad-crypto");
var Mailbox = Crypto.Mailbox;
var Nacl = require("tweetnacl/nacl-fast");
var nThen = require("nthen");
var Pinpad = require("../../www/common/pinpad");
var Rpc = require("../../www/common/rpc");
var Hash = require("../../www/common/common-hash");
var CpNetflux = require("../../www/bower_components/chainpad-netflux");
var Util = require("../../lib/common-util");

var createMailbox = function (config, cb) {
    var webchannel;

    CpNetflux.start({
        network: config.network,
        channel: config.channel,
        crypto: config.crypto,
        owners: [ config.edPublic ],

        noChainPad: true,
        onConnect: function (wc /*, sendMessage */) {
            webchannel = wc;
        },
        onMessage: function (/* msg, user, vKey, isCp, hash, author */) {

        },
        onReady: function () {
            cb(void 0, webchannel);
        },
    });
};

process.on('unhandledRejection', function (err) {
    console.error(err);
});

var makeCurveKeys = function () {
    var pair = Nacl.box.keyPair();
    return {
        curvePrivate: Nacl.util.encodeBase64(pair.secretKey),
        curvePublic: Nacl.util.encodeBase64(pair.publicKey),
    };
};

var makeEdKeys = function () {
    var keys = Nacl.sign.keyPair.fromSeed(Nacl.randomBytes(Nacl.sign.seedLength));
    return {
        edPrivate: Nacl.util.encodeBase64(keys.secretKey),
        edPublic: Nacl.util.encodeBase64(keys.publicKey),
    };
};

var createUser = function (config, cb) {
    // config should contain keys for a team rpc (ed)
        // teamEdKeys
        // rosterHash

    var user;
    nThen(function (w) {
        Client.create(w(function (err, client) {
            if (err) {
                w.abort();
                return void cb(err);
            }
            user = client;
            user.destroy = Util.mkEvent(true);
            user.destroy.reg(function () {
                user.network.disconnect();
            });
        }));
    }).nThen(function (w) {
        // make all the parameters you'll need

        var network = user.network = user.config.network;
        user.edKeys = makeEdKeys();

        user.curveKeys = makeCurveKeys();
        user.mailbox = Mailbox.createEncryptor(user.curveKeys);
        user.mailboxChannel = Hash.createChannelId();

        // create an anon rpc for alice
        Rpc.createAnonymous(network, w(function (err, rpc) {
            if (err) {
                w.abort();
                user.shutdown();
                return void console.error('ANON_RPC_CONNECT_ERR');
            }
            user.anonRpc = rpc;
            user.destroy.reg(function () {
                user.anonRpc.destroy();
            });
        }));

        Pinpad.create(network, user.edKeys, w(function (err, rpc) {
            if (err) {
                w.abort();
                user.shutdown();
                console.error(err);
                return console.log('RPC_CONNECT_ERR');
            }
            user.rpc = rpc;
            user.destroy.reg(function () {
                user.rpc.destroy();
            });
        }));
    }).nThen(function (w) {
        // create and subscribe to your mailbox
        createMailbox({
            network: user.network,
            channel: user.mailboxChannel,
            crypto: user.mailbox,
            edPublic: user.edKeys.edPublic,
        }, w(function (err /*, wc*/) {
            if (err) {
                w.abort();
                console.error("Mailbox creation error");
                process.exit(1);
            }
            //wc.leave();
        }));
    }).nThen(function () {
        user.cleanup = function (cb) {
            //console.log("Destroying user");
            // TODO remove your mailbox
            user.destroy.fire();
            cb = cb;
        };

        cb(void 0, user);
    });
};

var alice;

var sharedConfig = {
    teamEdKeys: makeEdKeys(),
    teamCurveKeys: makeCurveKeys(),
    rosterSeed: Crypto.Team.createSeed(),
};

nThen(function  (w) {
    createUser(sharedConfig, w(function (err, _alice) {
        if (err) {
            w.abort();
            return void console.log(err);
        }
        alice = _alice;
        alice.name = 'alice';
    }));
    /*
    createUser(sharedConfig, w(function (err, _bob) {
        if (err) {
            w.abort();
            return void console.log(err);
        }
        bob = _bob;
        bob.name = 'bob';
    }));*/
}).nThen(function (w) {
    var i = 0;
    var next = w();

    var send = function () {
        if (i++ >= 300) { return next(); }

        var msg = alice.mailbox.encrypt(JSON.stringify({
            pewpew: 'bangbang',
        }), alice.curveKeys.curvePublic);

        alice.anonRpc.send('WRITE_PRIVATE_MESSAGE', [
            alice.mailboxChannel,
            msg
            //Nacl.util.encodeBase64(Nacl.randomBytes(128))
        ], w(function (err) {
            if (err) { throw new Error(err); }
            console.log('message %s written successfully', i);
            setTimeout(send, 250);
        }));
    };
    send();
}).nThen(function () {
    alice.cleanup();
    //bob.cleanup();
});

