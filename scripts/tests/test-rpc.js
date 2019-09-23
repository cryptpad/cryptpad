/* globals process */

var Client = require("../../lib/client/");
var Crypto = require("../../www/bower_components/chainpad-crypto");
var Mailbox = Crypto.Mailbox;
var Nacl = require("tweetnacl");
var nThen = require("nthen");
var Pinpad = require("../../www/common/pinpad");
var Rpc = require("../../www/common/rpc");
var Hash = require("../../www/common/common-hash");
var CpNetflux = require("../../www/bower_components/chainpad-netflux");
var Roster = require("./roster");
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

var EMPTY_ARRAY_HASH = 'slspTLTetp6gCkw88xE5BIAbYBXllWvQGahXCx/h1gQOlE7zze4W0KRlA8puZZol8hz5zt3BPzUqPJgTjBXWrw==';

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

        Pinpad.create(network, config.teamEdKeys, w(function (err, rpc) {
            if (err) {
                w.abort();
                user.shutdown();
                return console.log('RPC_CONNECT_ERR');
            }
            user.team_rpc = rpc;
            user.destroy.reg(function () {
                user.team_rpc.destroy();
            });
        }));
    }).nThen(function (w) {
        user.rpc.reset([], w(function (err, hash) {
            if (err) {
                w.abort();
                user.shutdown();
                return console.log("RESET_ERR");
            }
            if (!hash || hash !== EMPTY_ARRAY_HASH) {
                throw new Error("EXPECTED EMPTY ARRAY HASH");
            }
        }));
    }).nThen(function (w) {
        // some basic sanity checks...
        user.rpc.getServerHash(w(function (err, hash) {
            if (err) {
                w.abort();
                return void cb(err);
            }
            if (hash !== EMPTY_ARRAY_HASH) {
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
        user.rpc.pin([user.mailboxChannel], w(function (err, hash) {
            if (err) {
                w.abort();
                return void cb(err);
            }

            //console.log('PIN_RESPONSE', hash);

            if (hash[0] === EMPTY_ARRAY_HASH) { throw new Error("PIN_DIDNT_WORK"); }
            user.latestPinHash = hash;
        }));
    }).nThen(function () {
/*
        // FIXME race condition because both users try to pin things...
        user.team_rpc.getServerHash(w(function (err, hash) {
            if (err) {
                w.abort();
                return void cb(err);
            }
/*
            if (!hash || hash[0] !== EMPTY_ARRAY_HASH) {
                console.error("EXPECTED EMPTY ARRAY HASH");
                process.exit(1);
            }
        }));
*/
    }).nThen(function () {
        // TODO check your quota usage

    }).nThen(function (w) {
        user.rpc.unpin([user.mailboxChannel], w(function (err, hash) {
            if (err) {
                w.abort();
                return void cb(err);
            }

            if (hash[0] !== EMPTY_ARRAY_HASH) {
                //console.log('UNPIN_RESPONSE', hash);
                throw new Error("UNPIN_DIDNT_WORK");
            }
            user.latestPinHash = hash[0];
        }));
    }).nThen(function (w) {
        // clean up the pin list to avoid lots of accounts on the server
        user.rpc.removePins(w(function (err) {
            if (err) {
                w.abort();
                return void cb(err);
            }
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

var alice, bob, oscar;

var sharedConfig = {
    teamEdKeys: makeEdKeys(),
    teamCurveKeys: makeCurveKeys(),
    rosterSeed: Crypto.Team.createSeed(),
};

nThen(function  (w) {
    // oscar will be the owner of the team
    createUser(sharedConfig, w(function (err, _oscar) {
        if (err) {
            w.abort();
            return void console.log(err);
        }
        oscar = _oscar;
        oscar.name = 'oscar';
    }));
}).nThen(function (w) {
    // TODO oscar creates the team roster

    // user edPublic (for ownership)
    // user curve keys (for encryption and authentication)

    // roster curve keys (for encryption and decryption)
    // roster signing/validate keys (ed)

    // channel
    // network
    // owners:

    var rosterKeys = Crypto.Team.deriveMemberKeys(sharedConfig.rosterSeed, oscar.curveKeys);

    Roster.create({
        network: oscar.network,
        channel: rosterKeys.channel,
        owners: [
            oscar.edKeys.edPublic
        ],
        keys: rosterKeys,
        anon_rpc: oscar.anonRpc,
        lastKnownHash: void 0,
    }, w(function (err, roster) {
        if (err) {
            w.abort();
            return void console.trace(err);
        }
        oscar.roster = roster;
        oscar.destroy.reg(function () {
            roster.stop();
        });
    }));
}).nThen(function (w) {
    var roster = oscar.roster;

    oscar.lastKnownHash = -1;

    roster.on('change', function () {
        oscar.currentRoster = roster.getState();
        //console.log("new state = %s\n", JSON.stringify(oscar.currentRoster));
    }).on('checkpoint', function (hash) {
        console.log("updating lastKnownHash to [%s]", hash);
        oscar.lastKnownHash = hash;
    });

    //var state = roster.getState();
    //console.log("CURRENT ROSTER STATE:", state);

    roster.init({
        displayName: oscar.name,

        //profile: '',
        // mailbox: '',
        //title: '',
    }, w(function (err) {
        if (err) { return void console.error(err); }
        //console.log("INITIALIZED");
    }));
}).nThen(function (w) {
    //console.log("ALICE && BOB");
    createUser(sharedConfig, w(function (err, _alice) {
        if (err) {
            w.abort();
            return void console.log(err);
        }
        alice = _alice;
        alice.name = 'alice';
        //console.log("Initialized Alice");
    }));
    createUser(sharedConfig, w(function (err, _bob) {
        if (err) {
            w.abort();
            return void console.log(err);
        }
        bob = _bob;
        bob.name = 'bob';
        //console.log("Initialized Bob");
    }));
}).nThen(function () {
    //setTimeout(w(), 500);

}).nThen(function (w) {
    // Alice loads the roster...
    var rosterKeys = Crypto.Team.deriveMemberKeys(sharedConfig.rosterSeed, alice.curveKeys);

    Roster.create({
        network: alice.network,
        channel: rosterKeys.channel,
        //owners: [], // Alice doesn't know who the owners might be...
        keys: rosterKeys,
        anon_rpc: alice.anonRpc,
        lastKnownHash: void 0, // alice should fetch everything from the beginning of time...
    }, w(function (err, roster) {
        if (err) {
            w.abort();
            return void console.error(err);
        }
        alice.roster = roster;
        alice.destroy.reg(function () {
            roster.stop();
        });

        if (JSON.stringify(alice.roster.getState()) !== JSON.stringify(oscar.roster.getState())) {
            console.error("Alice and Oscar have different roster states!");
            throw new Error();
        } else {
            console.log("Alice and Oscar have the same roster state");
        }
    }));
}).nThen(function (w) {
    // TODO oscar adds alice and bob to the team as members
    var roster = oscar.roster;

    var data = {};
    data[alice.curveKeys.curvePublic] = {
        displayName: alice.name,
        // role: 'MEMBER', // MEMBER is implicit
        notifications: '',
    };
    data[bob.curveKeys.curvePublic] = {
        displayName: bob.name,
        //role: 'MEMBER',
        notifications: '',
    };

    roster.add(data, w(function (err) {
        if (err) { return void console.error(err); }
    }));
}).nThen(function (w) {
    console.log("STATE =", JSON.stringify(oscar.roster.getState(), null, 2));

    // oscar describes the team
    oscar.roster.metadata({
        name: "THE DREAM TEAM",
        topic: "pewpewpew",
    }, w(function (err) {
        if (err) { return void console.log(err); }
        console.log("STATE =", JSON.stringify(oscar.roster.getState(), null, 2));
    }));
}).nThen(function () {



}).nThen(function (w) {
    // oscar sends a checkpoint
    oscar.roster.checkpoint(w(function (err) {
        if (err) {
            w.abort();
            return void console.error(err);
        }
        console.log("Checkpoint sent successfully");
    }));
    // TODO alice and bob describe themselves...
}).nThen(function (w) {
    // TODO Oscar promotes Alice to 'ADMIN'
    var members = {};
    members[alice.curveKeys.curvePublic] = {
        role: "ADMIN",
    };

    oscar.roster.describe(members, w(function (err) {
        if (err) {
            w.abort();
            return void console.error(err);
        }
        console.log("Promoted Alice to ADMIN");
    }));
}).nThen(function (w) {
    // bob finally connects, this time with the lastKnownHash provided by oscar
    var rosterKeys = Crypto.Team.deriveMemberKeys(sharedConfig.rosterSeed, bob.curveKeys);

    Roster.create({
        network: bob.network,
        channel: rosterKeys.channel,
        keys: rosterKeys,
        anon_rpc: bob.anonRpc,
        lastKnownHash: oscar.lastKnownHash,
    }, w(function (err, roster) {
        if (err) {
            w.abort();
            return void console.trace(err);
        }


        bob.roster = roster;
        if (JSON.stringify(bob.roster.getState()) !== JSON.stringify(oscar.roster.getState())) {
            console.log("BOB AND OSCAR DO NOT HAVE THE SAME STATE");
            console.log("BOB =", JSON.stringify(bob.roster.getState(), null, 2));
            console.log("OSCAR =", JSON.stringify(oscar.roster.getState(), null, 2));
        }

        bob.destroy.reg(function () {
            roster.stop();
        });
    }));
}).nThen(function (w) {
    bob.roster.remove([
        oscar.curveKeys.curvePublic,
        alice.curveKeys.curvePublic
    ], w(function (err) {
        if (err) { return void console.log("command failed as expected"); }
        w.abort();
        console.log("Expected command to fail!");
        process.exit(1);
    }));
}).nThen(function (w) {
    alice.roster.remove([bob.curveKeys.curvePublic], w(function (err) {
        if (err) {
            w.abort();
            return void console.error(err);
        }
        console.log("Alice successfully removed Bob from the roster");
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
    //alice.shutdown();
    //bob.shutdown();
    alice.cleanup();
    bob.cleanup();
    oscar.cleanup();
});


