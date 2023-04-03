define([
    '/api/config',
    'chainpad-netflux',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/revocable.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/nthen/index.js',
], function (ApiConfig, CPNetflux, Util, Hash, Revocable, Crypto, nThen) {
    var Rev = {};

    /*
                ctx.emit('MESSAGE', {
                    id: clientObj.id,
                    cursor: clientObj.cursor
                }, [client]);
    */
    var getPadMetadata = function (ctx, channel, cb) {
        ctx.Store.getPadMetadata(null, {
            channel: channel
        }, function (md) {
            cb(md);
        });
    };

    var isValidRotateMessage = function (ctx, log, newSeeds, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));

        var rotateUid = newSeeds.uid;
        var expectedKeys = {};
        log.some(function (logMsg) {
            if (logMsg[0] !== 'ROTATE') { return; }
            if (rotateUid === logMsg[4]) {
                expectedKeys.authorEd = logMsg[logMsg.length-1]; // XXX
                expectedKeys.hash = logMsg[2];
                expectedKeys.validate = logMsg[3];
                return true;
            }
        });
        if (!expectedKeys.hash) { return void cb(false); } // Invalid "uid"


        var check = function (pw) {
            var secret = Hash.getRevocableSecret({
                channel: '', // Not used here
                viewerSeedStr: newSeeds.viewer,
                editorSeedStr: newSeeds.editor,
            }, pw);

            var c = secret.keys.cryptKey;
            var v = secret.keys.validateKey;
            var h = Revocable.hashBytes(c);

            var valid = h === expectedKeys.hash && (!newSeeds.editor || v === expectedKeys.validate);
            if (valid) { return void cb(true, pw); }
            return void cb(false);
            /*
            // XXX check last password from drive
            // XXX then start asking passwords to the user
            // XXX if we store the password hash somewhere (with a salt!), we could easily
            //     check if the password is wrong or if it's the seed which is wrong
            //     ==> but optional: we can keep displaying the password prompt


            // TODO since we need to support old pads, we may have to move all the password logic to the worker, even for old pads, to avoid duplicate code
            askPassword(ctx, function (pw) {
                check(pw);
            });
            */
        };
        check();
    };


    var getChannelFromBox = function (messages) {
        if (!Array.isArray(messages) || !messages.length) { return void cb('EEMPTY'); }
        var init = messages[0];
        if (init.type !== 'INIT') { return; }
        var content = init.content;
        return content && content.doc && content.doc.channel;
    };
    var getMailboxParser = function (ctx, onNewKeys) {
        var data = {};
        var channel;

        var MAILBOX_COMMANDS = {
            // Only the INIT message can add a private key AND must be line 0
            INIT: function (msg, log, i, waitFor) {
                if (i || !msg.content || !msg.content.doc || !msg.content.edPrivate) { return; }
                isValidRotateMessage(ctx, log, msg.content.doc, waitFor(function (valid, password) {
                    if (!valid) { return; }
                    data = JSON.parse(JSON.stringify(msg.content));
                    data.password = password;
                }));
            },
            ROTATE: function (msg, log, i, waitFor) {
                if (!i || !data.doc) { return; }
                // Trust that all the keys you need are there
                // Make sure it was sent by the same moderator than in the moderators log
                isValidRotateMessage(ctx, log, msg, waitFor(function (valid, password) {
                    if (!valid) { return; }
                    data.doc = msg.content
                    data.password = password;
                }));
            }
        };


        var n = nThen;

        // Messages can be pushed anytime but
        // we handle one set of messages at a time
        var addMessages = function (messages) {
            if (!channel) {
                channel = getChannelFromBox(messages);
                if (!channel) { return; }
            }

            n = n(function (waitFor) {
                // Get latest metadata and parse incoming messsages
                getPadMetadata(ctx, channel, waitFor(function (md) {
                    console.warn(channel, md);
                    if (md && md.error) { return; }
                    var log = Revocable.getSanitizedLog(md);
                    console.warn(log);

                    var nn = nThen;

                    messages.forEach(function (msg, i) {
                        nn = nn(function (w) {
                            var type = msg.type;
                            var f = MAILBOX_COMMANDS[type];
                            if (!f) { return; }
                            f(msg, log, i, w);
                        }).nThen;
                    });

                    nn(waitFor(function () {
                        data.channel = channel;
                        onNewKeys(Util.clone(data));
                        // XXX once messages handled, emit to client
                        // XXX password change or keys rotation
                        // XXX make sure only one notication per pad (in case of multiple mailboxes)
                    }));
                }));
            }).nThen;

        };

        var getContent = function () {
            return JSON.parse(JSON.stringify(data));
        };
        var getChannel = function () {
            return channel;
        };

        return {
            getContent: getContent,
            getChannel: getChannel,
            addMessages: addMessages,
        };
    };

    var loadMailbox = function (ctx, clientId, seed, onNewKeys, cb) {
        // XXX ADD TO CTX


        var secret = Hash.getRevocable('pad', seed);

        if (ctx.mailboxes[secret.channel]) {
            // XXX return existing box
        }

        var box = ctx.mailboxes[secret.channel] = {
            messages: [],
            clients: [clientId],
            ready: false
        };

        var crypto = Crypto.Mailbox.createEncryptor({
            curvePrivate: secret.curvePrivate,
            curvePublic: secret.curvePublic
        });
        var config = {
            network: ctx.store.network,
            channel: secret.channel,
            noChainPad: true,
            crypto: crypto,
            //Cache: Cache // TODO ???
        };
        var first = true;
        config.onError = function (info) {
            first = false;
            cb({ error: info.type });
        };

        box.parse = getMailboxParser(ctx, function (keys) {
            if (first) { cb(keys); }
            first = false;
            onNewKeys(keys);
        });


        config.onReady = function () {
            if (box.ready) { return; }
            box.ready = true;

            var padChan = getChannelFromBox(box.messages);
            if (!padChan) { return void cb({error: 'ENOCHAN'}); }

            box.padChan = padChan;
            console.warn(padChan);

            box.parse.addMessages(box.messages);
        };
        config.onMessage = function (msg, peer, vKey, isCp, hash, senderCurve, cfg) {
            var parsed = Util.tryParse(msg);
            if (!parsed) { return; }

            console.warn(parsed);
            parsed._time = cfg && cfg.time;
            box.messages.push(parsed);
            if (box.ready) { box.parse.addMessages([parsed]); }
        };
        CPNetflux.start(config);

    };

    // XXX password history?
    // OR keep deleting history on password change (easier)

    /* We're going to load a pad from a mailbox.
     * 1. Load the mailbox and get the keys
     * 2. Look in your stores if the document channel is there
     *    - No: Send the keys history to outer and follow with password prompt
     *    - Yes: * Check if we have other related mailboxes for this pad and load them all.
     *           * Get our best mailboxes BUT make sure it's using the latest keys (compare with moderators log hash)
     */
    var loadPadFromBox = function (ctx, data, clientId, cb) {
        var seed = data.seed;

        loadMailbox(ctx, clientId, seed, function (obj) {
            // XXX called when we received new keys in real time
        }, function (obj) {
            if (obj && obj.error) { return void cb(obj); }
            console.error(obj);
            cb(obj);
        });
    };

    var leaveChannel = function (ctx, padChan) {
        // Leave channel and prevent reconnect when we leave a pad
        Object.keys(ctx.mailboxes).some(function (boxChannel) {
            var box = ctx.mailboxes[boxChannel];
            if (box.padChan !== padChan) { return; }
            if (box.wc) { box.wc.leave(); }
            if (box.onReconnect) {
                var network = ctx.store.network;
                network.off('reconnect', box.onReconnect);
            }
            delete ctx.mailboxes[boxChannel];
            return true;
        });
    };
    // Remove the client from all its channels when a tab is closed
    // One pad can use multiple mailboxes
    var removeClient = function (ctx, clientId) {
        var filter = function (c) {
            return c !== clientId;
        };

        // Remove the client from our channels
        var box;
        for (var k in ctx.mailboxes) {
            box = ctx.mailboxes[k];
            box.clients = box.clients.filter(filter);
            if (box.clients.length === 0) {
                if (box.wc) { box.wc.leave(); }
                if (box.onReconnect) {
                    var network = ctx.store.network;
                    network.off('reconnect', box.onReconnect);
                }
                delete ctx.mailboxes[k];
            }
        }
    };

    Rev.init = function (cfg, waitFor, emit) {
        var revocation = {};

        // Already initialized by a "noDrive" tab?
        if (cfg.store && cfg.store.modules && cfg.store.modules['revocation']) {
            return cfg.store.modules['revocation'];
        }

        var ctx = {
            store: cfg.store,
            Store: cfg.Store,
            emit: emit,
            mailboxes: {},
        };

        revocation.removeClient = function (clientId) {
            removeClient(ctx, clientId);
        };
        revocation.leavePad = function (padChan) {
            leaveChannel(ctx, padChan);
        };
        revocation.execCommand = function (clientId, obj, cb) {
            var cmd = obj.cmd;
            var data = obj.data;
            if (cmd === 'LOAD_PAD') {
                return void loadPadFromBox(ctx, data, clientId, cb);
            }
        };

        return revocation;
    };

    return Rev;
});
