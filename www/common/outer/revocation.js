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

    /*
id: {
    channel: channelId,
    atime: 0,
    ctime: 0,
    title: '',
    r: 1,
    href: '', 
    accesses: [] // list of hrefs
}

// XXX PROPOSAL 1
//     Use HREF for pad "shared directlywith you"
//     Use other field for URLs shared with you

// XXX "href" and "accesses" subject to change
// many parts of CryptPad require "href", here we need all of them
// let's consider for now that we have one href and a list of other accesses consisting of other hrefs
// try to store our moderator access there for the prototype?
    */


    var getStoredPadPasswords = function (ctx, padChan) {
        var pw = [''];
        ctx.Store.getAllStores().forEach(function (s) {
            // we may have multiple occurences in each team because of shared folders
            var pads = s.manager.findChannel(padChan);
            pads.forEach(function (obj) {
                var padData = obj.data;
                if (!padData || !padData.password) { return; }
                if (pw.includes(padData.password)) { return; }
                pw.push(padData.password);
            });
        });
        return pw;
    };

    var getPadMetadata = function (ctx, channel, cb, keys) {
    // XXX authenticate here too
    // XXX in order to get your subtree labels
        ctx.Store.getPadMetadata(null, {
            channel: channel
        }, function (md) {
            if (!keys || !md || md.error) { return void cb(md); }

            var secret = Hash.getRevocableSecret({
                channel: '',
                viewerSeedStr: keys.doc.viewer,
                editorSeedStr: keys.doc.editor,
            }, keys.password);
            var crypto = Crypto.createEncryptor(secret.keys);

            Object.keys(md.access || {}).forEach(function (ed) {
                var a = md.access[ed];
                if (a.mailbox) {
                    try {
                        a.mailbox = crypto.decrypt(a.mailbox, true, true);
                    } catch (e) { console.error(e); }
                }
                if (a.notes) { // XXX use moderator keys!
                    try {
                        a.notes = JSON.parse(crypto.decrypt(a.notes, true, true));
                    } catch (e) { console.error(e); }
                }
            });
            cb(md);
        });
    };


    var askPassword = function (ctx, clients, cb) {
        var uid = Util.uid();
        ctx.passwords.expect(uid, cb)
        ctx.emit('ASK_PASSWORD', {
            uid: uid
        }, clients);
    };
    var onPassword = function (ctx, data) {
        var uid = data.uid;
        var pw = data.pw;
        ctx.passwords.handle(uid, pw);
    };

    var isValidRotateMessage = function (ctx, clients, log, newSeeds, channel, _cb) {
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


        var knownPasswords = getStoredPadPasswords(ctx, channel); // XXX CACHE THIS VALUE WHEN MULTIPLE BOXES LOADED FOR A SINGLE PAD


        var isValidPw = function (pw) {
            var secret = Hash.getRevocableSecret({
                channel: '', // Not used here
                viewerSeedStr: newSeeds.viewer,
                editorSeedStr: newSeeds.editor,
            }, pw);

            var c = secret.keys.cryptKey;
            var v = secret.keys.validateKey;
            var h = Revocable.hashBytes(c);

            var valid = h === expectedKeys.hash && (!newSeeds.editor || v === expectedKeys.validate);
            return valid;
        };

        var check = function (pw) {
            var valid;
            if (pw === false) {
                valid = knownPasswords.some(function (password) {
                    var v = isValidPw(password);
                    if (!v) { return; }
                    pw = password;
                    return true;
                });
            } else {
                valid = isValidPw(pw);
            }
            if (valid) {
                if (!knownPasswords.includes(pw)) {
                    return ctx.Store.setPadAttribute(null, {
                        channel: channel,
                        attr: 'password',
                        value: pw
                    }, function () {
                        console.error('stored');
                        cb(true, pw);
                    });
                }
                return void cb(true, pw);
            }
            //return void cb(false);
            /*
            // XXX check last password from drive
            // XXX then start asking passwords to the user
            // XXX if we store the password hash somewhere (with a salt!), we could easily
            //     check if the password is wrong or if it's the seed which is wrong
            //     ==> but optional: we can keep displaying the password prompt


            // TODO since we need to support old pads, we may have to move all the password logic to the worker, even for old pads, to avoid duplicate code
            */
            askPassword(ctx, clients, function (pw) {
                console.error(pw);
                check(pw);
            });
        };
        check(false);
    };


    var getChannelFromBox = function (messages) {
        if (!Array.isArray(messages) || !messages.length) { return; }
        var init = messages[0];
        if (init.type !== 'INIT') { return; }
        var content = init.content;
        return content && content.doc && content.doc.channel;
    };
    var getMailboxParser = function (ctx, clients, onNewKeys) {
        var data = {
            doc: {}
        };
        var channel;

        var MAILBOX_COMMANDS = {
            // Only the INIT message can add a private key AND must be line 0
            INIT: function (msg, log, channel, i, waitFor) {
                if (i || !msg.content || !msg.content.doc || !msg.content.edPrivate) { return; }
                isValidRotateMessage(ctx, clients, log, msg.content.doc, channel,
                                        waitFor(function (valid, password) {
                    if (!valid) { return; }
                    data = JSON.parse(JSON.stringify(msg.content));
                    data.password = password;
                }));
            },
            ROTATE: function (msg, log, channel, i, waitFor) {
                if (!i || !data.doc) { return; }
                // Trust that all the keys you need are there
                // Make sure it was sent by the same moderator than in the moderators log
                isValidRotateMessage(ctx, clients, log, msg.content, channel, waitFor(function (valid, password) {
                    if (!valid) { return; }
                    data.doc = msg.content
                    data.password = password;
                }));
            },
            UPDATE: function (msg, log, channel, i, waitFor) {
                if (!data || !data.doc) { return; }
                var doc = data.doc;
                var content = msg.content;
                if (content.uid !== doc.uid) { return; } // doesn't match our viewer key version
                if (content.editor && !doc.editor) {
                    doc.editor = content.editor;
                }
                if (content.moderator && !doc.moderator) {
                    doc.moderator = content.moderator;
                }
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
                    if (md && md.error) { return; }
                    var log = Revocable.getSanitizedLog(md); // XXX CACHE WHEN LOADING MULTIPLE BOXES

                    var nn = nThen;

                    messages.forEach(function (msg, i) {
                        nn = nn(function (w) {
                            var type = msg.type;
                            var f = MAILBOX_COMMANDS[type];
                            if (!f) { return; }
                            f(msg, log, channel, i, w);
                        }).nThen;
                    });


                    nn(waitFor(function () {
                        data.channel = channel;
                        var clone = Util.clone(data);
                        var myAccess = md.access && md.access[data.edPublic];
                        //if (!myAccess) { return void onNewKeys(false); }
                        if (!Revocable.isModerator(myAccess)) { delete data.doc.moderator; }
                        if (!Revocable.isEditor(myAccess)) { delete data.doc.editor; }
                        onNewKeys(clone);
                        // XXX once messages handled, emit to client
                        // XXX password change or keys rotation
                        // XXX make sure only one notication per pad (in case of multiple mailboxes)
                    }));
                }));
            }).nThen;

        };

        var getContent = function () {
            return Util.clone(data);
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

    var loadMailbox = function (ctx, clientId, boxData, onNewKeys, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));

        var seed = boxData.seed;
console.error(seed);

        var secret = Hash.getRevocable('pad', seed);

        var box = ctx.mailboxes[secret.channel];
        if (box) {
            if (box.revoked) { return void cb({error: 'EFORBIDDEN'}); }
            if (!box.clients.includes(clientId)) { box.clients.push(clientId); }
            return void cb(box.parse.getContent());
        }

        box = ctx.mailboxes[secret.channel] = {
            messages: [],
            clients: [clientId],
            secret: secret,
            ready: false
        };

        if (boxData.link || !boxData.store) {
            box.origin = 'URL ' + seed; // XXX
        } else if (boxData.fId) {
            box.origin = 'SF ' + boxData.fId; // XXX
        } else if (boxData.store) {
            box.origin = boxData.store.id ? ('Team ' + boxdata.store.id) // XXX
                                          : 'My Drive'; // XXX
        }

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

        box.parse = getMailboxParser(ctx, box.clients, function (keys) {
            if (keys === false) {
                // XXX revoked
                // XXX close mailbox, etc.
                box.revoked = true;
                cb({error: 'EFORBIDDEN'});
            }
            if (first) {
                cb(keys);
                first = false;
                return;
            }
            onNewKeys(keys);
        });


        // XXX
        // box.wc = webChannel;
        // box.onReconnect

        config.onReady = function () {
            if (box.ready) { return; }
            box.ready = true;

            console.error(box.messages);
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
        config.onConnectionChange = function (info) {
            console.warn(secret.channel, info.state, info.myID, ctx.store.network.myID);
        };

        box.cpNf = CPNetflux.start(config);

    };

    var findMailboxesForPad = function (ctx, padChan) {
        return Object.keys(ctx.mailboxes).filter(function (id) {
            return ctx.mailboxes[id].padChan === padChan;
        }).map(function (id) {
            return ctx.mailboxes[id];
        });
    };

    var getBestKeysForPad = function (ctx, padChan) {
        var boxes = findMailboxesForPad(ctx, padChan);
        var best;
        boxes.some(function (box) {
            // XXX when a box doesn't receive new keys, find a way to know it's deprecated
            // XXX one option is to store the last key hash for each channel somewhere
            // XXX another option is to send a message to mailboxes when we revoke their access
            var keys = box.parse && box.parse.getContent();
            if (keys.doc.moderator) { // if we have moderator, we won't find better, abort
                best = keys;
                return true;
            }
            if (best && best.doc.editor) { return; } // we already had editor, next
            if (keys.doc.editor) { // we had at most viewer and now editor, update best
                best = keys;
            }
            if (best && best.doc.viewer) { return; } // we already had viewer, next
            best = keys; // We had nothing, preserve
        });
        return best;
    };

    var getSeedFromHref = function (href) {
        var p = Hash.parsePadUrl(href);
        if (!p.revocable) { return; }
        return p.hashData && p.hashData.key;
    };
    var loadMailboxesFromChannel = function (ctx, data, clientId, cb) {
        // Compute list of mailboxes to load for this channel
        var accesses = [];
        var addSeed = function (seedData) {
            if (!seedData || !seedData.seed) { return; }
            if (!accesses.some(function (obj) {
                return obj.seed === seedData.seed;
            })) { accesses.push(seedData); }
        };
        ctx.Store.getAllStores().forEach(function (s) {
            // we may have multiple occurences in each team because of shared folders
            var pads = s.manager.findChannel(data.channel);
            pads.forEach(function (obj) {
                var padData = obj.data;
                if (!padData) { return; }
                if (padData.href) {
                    addSeed({
                        seed: getSeedFromHref(padData.href),
                        store: s,
                        password: padData.password,
                        fId: obj.fId,
                        id: obj.id
                    });
                }
                if (Array.isArray(padData.accesses)) {
                    padData.accesses.forEach(function (href) {
                        addSeed({
                            seed: getSeedFromHref(href),
                            store: s,
                            password: padData.password,
                            link: true, // XXX only link in data.accesses?
                            id: obj.id
                        });
                    });
                }
            });
        });

        var n = nThen;
        accesses.map(function (obj) {
            n = n(function (waitFor) {
                loadMailbox(ctx, clientId, obj, function (newKeys) {
                    data.onNewKeysEvt.fire(newKeys);
                }, waitFor(function () {

                }));
            }).nThen;
        });

        n(function () {
            var keys = getBestKeysForPad(ctx, data.channel);
            cb(keys || {error: 'ENOENT'});
        });
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

        loadMailbox(ctx, clientId, {
            seed: seed
        }, function (newKeys) {
            data.onNewKeysEvt.fire(newKeys);
        }, function (obj) {
            if (obj && obj.error) { return void cb(obj); }
            console.error(obj);
            var chan = obj.channel;
            loadMailboxesFromChannel(ctx, {
                channel: chan,
                onNewKeysEvt: data.onNewKeysEvt
            }, clientId, function (bestKeys) {
                cb(bestKeys);
            });
        });
    };

    var loadPad = function (ctx, data, clientId, cb) {
        var seed = data.seed;
        var chan = data.chan;
        var onNewKeysEvt = Util.mkEvent();
        onNewKeysEvt.reg(function (newKeys) {
            // XXX REVOCATION all mailboxes can fire at once
            console.error('NEW KEYS', newKeys);
        });


        if (chan) {
            loadMailboxesFromChannel(ctx, {
                channel: chan,
                onNewKeysEvt: onNewKeysEvt
            }, clientId, function (bestKeys) {
                cb(bestKeys);
            });
            return;
        }

        loadPadFromBox(ctx, {
            seed: seed,
            onNewKeysEvt: onNewKeysEvt
        }, clientId, function (bestKeys) {
            cb(bestKeys);
        });


    };



    var listPadAccess = function (ctx, data, clientId, cb) {
        var channel = data.channel;
        var teamId = data.teamId;
        if (!channel) { return void cb({error: 'EINVAL'}); }

        var boxes = findMailboxesForPad(ctx, channel);

        nThen(function (waitFor) {
            // Either the pad is stored and we can get a mailbox from our drive
            // or it isn't stored but ti means it's already loaded (share modal from the pad)
            if (boxes.length) { return; }
            loadMailboxesFromChannel(ctx, data, clientId, waitFor());
        }).nThen(function (waitFor) {
            var best = getBestKeysForPad(ctx, data.channel);
            if (!best) { return void cb({error: 'ENOENT'}); }

            var myKeys = findMailboxesForPad(ctx, data.channel).map(function (box) {
                var c = box.parse.getContent();
                return {
                    key: c.edPublic,
                    origin: box.origin,
                    moderator: Boolean(c.doc.moderator)
                };
            });

            getPadMetadata(ctx, channel, waitFor(function (md) {
                if (md && md.error) { return; }
                var access = md.access;
                cb({
                    list: access,
                    myKeys: myKeys,
                });
            }), best);
        });

    };


/*
updateAccess({
    channel: channel,
    value: {
        user: userKey,
        access: newAccess,
        signature: signature
    },
    from: myAccessKey (in case I have multiple accesses for this pad)
}
*/

    var getNetfluxId = function (ctx) {
        try {
            return ctx.store.network.webChannels[0].myID;
        } catch (e) { console.error(e); return; }
    };
    var findBoxFromKey = function (ctx, edPublic) {
        var _box;
        Object.keys(ctx.mailboxes).some(function (key) {
            var box = ctx.mailboxes[key];
            var c = box.parse && box.parse.getContent();
            if (c.edPublic === edPublic) {
                console.error('ok');
                _box = box;
                return true;
            }
        });
        return _box;
    };


    var sendMailboxMsg = function (ctx, type, content, to, from, cb) {
        if (!ctx.store.mailbox) { return void cb({error: 'NOT_READY'}); }
        ctx.store.mailbox.sendAs(type, content, to, from, cb);
    };
    var sendInitMsg = function (ctx, data, cb) {
        sendMailboxMsg(ctx, data.type, data.msg, data.user, data.keys, cb)
    };

    /*
    ctx.Store.anonRpcMsg(clientId, {
        msg: 'SET_REVOCATION_METADATA',
        data: {
            data: {
                command: 'UPDATE_ACCESS',
                channel: channel,
                value: {
                    user: edPublic,
                    access: newAccess,
                    signature: signedModeratorLog (add or remove)
                }
            },
            signature: sign(data),
            key: key
        }
    }, cb);
    */

    var sendUpdateMsg = function (ctx, target, newAccess, box, md, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));

        var oldAccess = md.access[target];
        var keys = box.parse.getContent();
        var toSend = Revocable.getUpgradeMessage(keys.doc, newAccess, oldAccess);
        if (!toSend) { return void cb(false); }

        toSend.uid = keys.doc.uid;
        var sendTo = {
            channel: oldAccess.mailbox, // decrypted from getPadMetadata
            curvePublic: oldAccess.curvePublic
        };
        var sendFrom = {
            curvePrivate: box.secret.curvePrivate,
            curvePublic: box.secret.curvePublic
        };
        sendMailboxMsg(ctx, 'UPDATE', toSend, sendTo, sendFrom, cb);
    };

    var updateAccess = function (ctx, obj, clientId, cb) {
        var key = obj.from;
        var box = findBoxFromKey(ctx, key);
        if (!box) { return void cb({error: 'EINVAL'}); }
        var keys = box.parse.getContent();

        getPadMetadata(ctx, obj.channel, function (md) {
            if (md && md.error) { return void cb(md); }
            var edPrivate = keys.edPrivate;
            var log = Revocable.getSanitizedLog(md);
            var last = log[log.length-1];

            // Sign an "add" or "remove" log in case this user was or will be a moderator
            var value = obj.value; // {user, access}
            var newRights = value && value.access;
            var toSign;
            if (!Revocable.isModerator(newRights)) {
                toSign = Revocable.removeLog(value.user, Revocable.hashMsg(last));
            } else {
                toSign = Revocable.addLog(value.user, Revocable.hashMsg(last));
            }
            var logSig = Revocable.signLog(toSign, edPrivate);
            value.signature = logSig;

            var data = {
                channel: obj.channel,
                command: 'UPDATE_ACCESS',
                value: value
            };

            var netfluxId = getNetfluxId(ctx);
            var sig = Revocable.signLog([JSON.stringify(data), netfluxId], edPrivate);

            ctx.Store.anonRpcMsg(clientId, {
                msg: 'SET_REVOCATION_METADATA',
                data: {
                    data: data,
                    signature: sig,
                    key: key
                }
            }, function (res) {
                if (obj.add) { return void cb(res); }

                sendUpdateMsg(ctx, value.user, newRights, box, md, function (sent) {
                    if (sent === false) { return; }
                    console.log('UPDATE message sent');
                });
                cb(res);
            });

        }, keys);
    };

    var addAccess = function (ctx, obj, clientId, cb) {
        var key = obj.from;
        var box = findBoxFromKey(ctx, key);
        if (!box) { return void cb({error: 'EINVAL'}); }
        var keys = box.parse.getContent();

        var type = obj.type;
        var rights = obj.rights;
        var note = obj.note;

        var doc = Hash.getRevocableSecret({
            channel: keys.channel,
            viewerSeedStr: keys.doc.viewer,
            editorSeedStr: keys.doc.editor,
            moderatorSeedStr: keys.doc.moderator
        }, keys.password);
        var crypto = Crypto.createEncryptor(doc.keys);
        var cryptoSym = crypto.encrypt; // XXX WRONG ==> DONT SIGN THE NOTES? ONLY ENCRYPT
        var cryptoAsym = crypto.encrypt; // XXX

        var mailboxData = Revocable.createMailbox(type, box.secret, keys.doc, rights);
        var access = Revocable.createAccess(type, mailboxData, note, cryptoSym, cryptoAsym);
console.error('NEW HASH', Hash.getRevocableHashFromKeys(type, mailboxData.mailbox)); // XXX

        sendInitMsg(ctx, mailboxData.initMsg, function (sendObj) {
            if (sendObj && sendObj.error) { return void cb(sendObj); }
            updateAccess(ctx, {
                add: true,
                channel: keys.channel,
                value: {
                    user: mailboxData.edPublic,
                    access: access
                },
                from: obj.from,
            }, clientId, function (accessObj) {
                if (accessObj && accessObj.error) {
                    // XXX delete mailbox? or let it be deleted after 3 months
                    return void cb(accessObj);
                }
                cb({
                    seed: mailboxData.mailbox.keys.seed
                });
            });
        });
    };

    var createPad = function (ctx, obj, clientId, cb) {
        var type = obj.type;
        var password = obj.password;
        var edPublic = obj.edPublic;

        // random curve keyPair for the first mailbox
        var randomKeys = Hash.getRevocable(type);

        var doc = Hash.getRevocableSecret(undefined, password); // generate document keys
        var docKeys = {
            uid: Util.uid(),
            viewer: doc.keys.viewerSeed,
            editor: doc.keys.editorSeed,
            moderator: doc.keys.moderatorSeed,
            moderatorCurve: doc.keys.moderatorCurvePublic,
            channel: doc.channel
        };

        var moderator = Revocable.createMailbox(type, randomKeys, docKeys, 'rwmd');
        var editor = Revocable.createMailbox(type, moderator.mailbox, docKeys, 'rw');

console.error('MODERATOR HASH', Hash.getRevocableHashFromKeys(type, moderator.mailbox)); // XXX

        var crypto = Crypto.createEncryptor(doc.keys);

        var cryptoSym = crypto.encrypt;
        var cryptoAsym = crypto.encrypt; // XXX

        var access = {};
        var modNote = {
            type: edPublic ? 'user' : 'link',
            note: 'Document creator' // XXX
        };
        if (edPublic) { modNote.edPublic = edPublic; }
        access[moderator.edPublic] = Revocable.createAccess(type, moderator, modNote, cryptoSym, cryptoAsym);
        var editNote = {
            type: 'link',
            note: 'Initial editor access' // XXX
        };
        access[editor.edPublic] = Revocable.createAccess(type, editor, editNote, cryptoSym, cryptoAsym);

        // Get a hash of the cryptKey for initial moderators log
        var keyHashStr = Revocable.hashBytes(doc.keys.cryptKey);

        var first = Revocable.firstLog(moderator.edPublic);
        var prevHash = Revocable.hashMsg(first);
        var rotateMsg = Revocable.rotateLog(keyHashStr, doc.keys.validateKey, docKeys.uid, prevHash);
        var signature = Revocable.signLog(rotateMsg, moderator.mailbox.edPrivate);

        var data = {
            // displayed hash
            newHash: Hash.getRevocableHashFromKeys(type, editor.mailbox),
            modHash: Hash.getRevocableHashFromKeys(type, moderator.mailbox),
            docKeys: docKeys,
            crypto: crypto,
            seeds: {
                moderator: moderator.mailbox.keys.seed,
                editor: editor.mailbox.keys.seed
            },
            rtConfig: {
                creation: {
                    creatorEdPrivate: doc.keys.creator,
                },
                authentication: {
                    edPublic: moderator.mailbox.edPublic,
                    edPrivate: moderator.mailbox.edPrivate
                },
                metadata: {
                    validateKey: (doc.keys && doc.keys.validateKey) || undefined,
                    access: access,
                    revocableData: {
                        creatorKey: moderator.mailbox.curvePublic,
                        creatorVKey: moderator.mailbox.edPublic,
                        rotate: {
                            uid: docKeys.uid,
                            hash: keyHashStr,
                            validateKey: doc.keys.validateKey,
                            signature: signature,
                        }
                    }
                }


            }
        };

console.error(doc);
console.error(moderator);
console.error(editor);
console.error(access);
console.error(keyHashStr);

        nThen(function (waitFor) {
            sendInitMsg(ctx, moderator.initMsg, waitFor());
            sendInitMsg(ctx, editor.initMsg, waitFor());
            // XXX handle errors
        }).nThen(function (waitFor) {
            cb(data);
        });
    };

    var joinCreatedPad = function (ctx, seeds, clientId, cb) {
        nThen(function (waitFor) {
            loadMailbox(ctx, clientId, { seed: seeds.moderator }, function (newKeys) {
                // XXX new keys received
            }, waitFor());
            loadMailbox(ctx, clientId, { seed: seeds.editor }, function (newKeys) {
                // XXX new keys received
            }, waitFor());
        }).nThen(function (waitFor) {
            cb();
        });
    };


    var leaveBox = function (ctx, box, boxChannel) {
        if (box.cpNf) { box.cpNf.stop(); }
        delete ctx.mailboxes[boxChannel];
    };
    var leaveChannel = function (ctx, padChan) {
        // Leave channel and prevent reconnect when we leave a pad
        Object.keys(ctx.mailboxes).some(function (boxChannel) {
            var box = ctx.mailboxes[boxChannel];
            if (box.padChan !== padChan) { return; }
            leaveBox(ctx, box, boxChannel);
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
            if (box.clients.length === 0) { leaveBox(ctx, box, k); }
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
            passwords: Util.response(function (l, i) { console.error('REV_PW_' + l, i); }),
            mailboxes: {},
        };

revocation.ctx = ctx; // debug

        revocation.removeClient = function (clientId) {
            removeClient(ctx, clientId);
        };
        revocation.leavePad = function (padChan) {
            leaveChannel(ctx, padChan);
        };
        revocation.execCommand = function (clientId, obj, cb) {
            var cmd = obj.cmd;
            var data = obj.data;
            if (cmd === 'LIST_ACCESS') {
                return void listPadAccess(ctx, data, clientId, cb);
            }
            if (cmd === 'UPDATE_ACCESS') {
                return void updateAccess(ctx, data, clientId, cb);
            }
            if (cmd === 'ADD_ACCESS') {
                return void addAccess(ctx, data, clientId, cb);
            }
            if (cmd === 'LOAD_PAD') {
                return void loadPad(ctx, data, clientId, cb);
            }
            if (cmd === 'JOIN_CREATED_PAD') {
                return void joinCreatedPad(ctx, data, clientId, cb);
            }
            if (cmd === 'CREATE_PAD') {
                return void createPad(ctx, data, clientId, cb);
            }
            if (cmd === 'PASSWORD') {
                return void onPassword(ctx, data, clientId, cb);
            }
        };

        return revocation;
    };

    return Rev;
});
