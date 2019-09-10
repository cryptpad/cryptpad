/* globals process */

var Client = require("../../lib/client/");
var Mailbox = require("../../www/bower_components/chainpad-crypto").Mailbox;
var Nacl = require("tweetnacl");
var nThen = require("nthen");
var Rpc = require("../../www/common/rpc");
var Hash = require("../../www/common/common-hash");
var CpNetflux = require("../../www/bower_components/chainpad-netflux");

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

var EMPTY_ARRAY_HASH = 'slspTLTetp6gCkw88xE5BIAbYBXllWvQGahXCx/h1gQOlE7zze4W0KRlA8puZZol8hz5zt3BPzUqPJgTjBXWrw==';

var createUser = function (config, cb) {
    // config should contain keys for a team rpc (ed)
        // teamEdKeys

    var user;
    nThen(function (w) {
        Client.create(w(function (err, client) {
            if (err) {
                w.abort();
                return void cb(err);
            }
            user = client;
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
        }));

        Rpc.create(network, user.edKeys.edPrivate, user.edKeys.edPublic, w(function (err, rpc) {
            if (err) {
                w.abort();
                user.shutdown();
                console.error(err);
                return console.log('RPC_CONNECT_ERR');
            }
            user.rpc = rpc;
        }));

        Rpc.create(network, config.teamEdKeys.edPrivate, config.teamEdKeys.edPublic, w(function (err, rpc) {
            if (err) {
                w.abort();
                user.shutdown();
                return console.log('RPC_CONNECT_ERR');
            }
            user.team_rpc = rpc;
        }));
    }).nThen(function (w) {
        // some basic sanity checks...
        user.rpc.send('GET_HASH', user.edKeys.edPublic, w(function (err, hash) {
            if (err) {
                w.abort();
                return void cb(err);
            }

            if (!hash || hash[0] !== EMPTY_ARRAY_HASH) {
                console.error("EXPECTED EMPTY ARRAY HASH");
                process.exit(1);
            }
        }));
    }).nThen(function (w) {
        // create and subscribe to your mailbox
        createMailbox({
            network: user.network,
            channel: user.mailboxChannel,
            crypto: user.mailbox,
            edPublic: user.edKeys.edPublic,
        }, w(function (err, wc) {
            if (err) {
                w.abort();
                console.error("Mailbox creation error");
                process.exit(1);
            }
            wc.leave();
        }));
    }).nThen(function (w) {
        // confirm that you own your mailbox
        user.anonRpc.send("GET_METADATA", user.mailboxChannel, w(function (err, data) {
            if (err) {
                w.abort();
                return void cb(err);
            }
            try {
                if (data[0].owners[0] !== user.edKeys.edPublic) {
                    throw new Error("INCORRECT MAILBOX OWNERSHIP METADATA");
                }
            } catch (err2) {
                w.abort();
                return void cb(err2);
            }
        }));
    }).nThen(function (w) {
        // pin your mailbox
        user.rpc.send('PIN', [user.mailboxChannel], w(function (err, data) {
            if (err) {
                w.abort();
                return void cb(err);
            }
            try {
                if (data[0] === EMPTY_ARRAY_HASH) { throw new Error("PIN_DIDNT_WORK"); }
                user.latestPinHash = data[0];
            } catch (err2) {
                w.abort();
                return void cb(err2);
            }
        }));
    }).nThen(function (w) {
        user.team_rpc.send('GET_HASH', config.teamEdKeys.edPublic, w(function (err, hash) {
            if (err) {
                w.abort();
                return void cb(err);
            }
            if (!hash || hash[0] !== EMPTY_ARRAY_HASH) {
                console.error("EXPECTED EMPTY ARRAY HASH");
                process.exit(1);
            }
        }));
    }).nThen(function () {
        // TODO check your quota usage

    }).nThen(function (w) {
        user.rpc.send('UNPIN', [user.mailboxChannel], w(function (err, data) {
            if (err) {
                w.abort();
                return void cb(err);
            }
            try {
                if (data[0] !== EMPTY_ARRAY_HASH) { throw new Error("UNPIN_DIDNT_WORK"); }
                user.latestPinHash = data[0];
            } catch (err2) {
                w.abort();
                return void cb(err2);
            }
        }));
    }).nThen(function (w) {
        // clean up the pin list to avoid lots of accounts on the server
        user.rpc.send("REMOVE_PINS", undefined, w(function (err, data) {
            if (err) {
                w.abort();
                return void cb(err);
            }
            if (!data || data[0] !== 'OK') {
                w.abort();
                return void cb("REMOVE_PINS_DIDNT_WORK");
            }
        }));
    }).nThen(function () {
        user.cleanup = function (cb) {
            // TODO remove your mailbox

            cb = cb;
        };




        cb(void 0, user);
    });
};

var alice, bob;

nThen(function (w) {
    var sharedConfig = {
        teamEdKeys: makeEdKeys(),
    };

    createUser(sharedConfig, w(function (err, _alice) {
        if (err) {
            w.abort();
            return void console.log(err);
        }
        alice = _alice;
    }));
    createUser(sharedConfig, w(function (err, _bob) {
        if (err) {
            w.abort();
            return void console.log(err);
        }
        bob = _bob;
    }));
}).nThen(function (w) {
    var message = alice.mailbox.encrypt(JSON.stringify({
        type: "CHEESE",
        author: alice.curveKeys.curvePublic,
        content: {
            text: "CAMEMBERT",
        }
    }), bob.curveKeys.curvePublic);

    alice.anonRpc.send('WRITE_PRIVATE_MESSAGE', [bob.mailboxChannel, message], w(function (err, response) {
        if (err) {
            return void console.error(err);
        }

        // TODO validate that the write was actually successful by checking its size
        response = response;
        // shutdown doesn't work, so we need to do this instead
    }));
}).nThen(function () {

    nThen(function () {

    }).nThen(function () {
        // make a drive
            // pin it
    }).nThen(function () { // MAILBOXES
        // write to your mailbox
            // pin your mailbox
    }).nThen(function () {
        // create an owned pad
            // pin the pad
        // write to it
    }).nThen(function () {
        // get pinned usage
            // remember the usage
    }).nThen(function () {
        // upload a file
            // remember its size
    }).nThen(function () {
        // get pinned usage
            // check that it is consistent with the size of your uploaded file
    }).nThen(function () {
        // delete your uploaded file
        // unpin your owned file
    }).nThen(function () { // EDITABLE METADATA
        // 
    }).nThen(function () {

    });
}).nThen(function () {
    alice.shutdown();
    bob.shutdown();
});


