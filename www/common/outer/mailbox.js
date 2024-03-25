// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/api/config',
    '/api/broadcast',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-realtime.js',
    '/common/common-messaging.js',
    '/common/notify.js',
    '/common/outer/mailbox-handlers.js',
    'chainpad-netflux',
    '/components/chainpad-crypto/crypto.js',
], function (Config, BCast, Util, Hash, Realtime, Messaging, Notify, Handlers, CpNetflux, Crypto) {
    var Mailbox = {};

    var TYPES = [
        'notifications',
        'supportteam',
        'broadcast'
    ];
    var BLOCKING_TYPES = [
    ];

    var BROADCAST_CHAN = '000000000000000000000000000000000'; // Admin channel, 33 characters

    var initializeMailboxes = function (ctx, mailboxes) {
        if (!mailboxes['notifications'] && ctx.loggedIn) {
            mailboxes.notifications = {
                channel: Hash.createChannelId(),
                lastKnownHash: '',
                viewed: []
            };
            ctx.pinPads([mailboxes.notifications.channel], function (res) {
                if (res.error) { console.error(res); }
            });
        }

        // no need for the "support" mailbox anymore
        if (mailboxes.support) {
            delete mailboxes.support;
        }

        if (!mailboxes['broadcast']) {
            mailboxes.broadcast = {
                channel: BROADCAST_CHAN,
                lastKnownHash: BCast.lastBroadcastHash,
                decrypted: true,
                viewed: []
            };
        }
    };

/*
proxy.mailboxes = {
    friends: {
        channel: '',
        lastKnownHash: '',
        viewed: []
    }
};

*/

    var isMessageNew = function (hash, m) {
        return (m.viewed || []).indexOf(hash) === -1 && hash !== m.lastKnownHash;
    };

    var showMessage = function (ctx, type, msg, cId, cb) {
        ctx.emit('MESSAGE', {
            type: type,
            content: msg
        }, cId ? [cId] : ctx.clients, cb);
    };
    var hideMessage = function (ctx, type, hash, clients) {
        ctx.emit('VIEWED', {
            type: type,
            hash: hash
        }, clients || ctx.clients);
    };

    var getMyKeys = function (ctx) {
        var proxy = ctx.store && ctx.store.proxy;
        if (!proxy.curvePrivate || !proxy.curvePublic) { return; }
        return {
            curvePrivate: proxy.curvePrivate,
            curvePublic: proxy.curvePublic
        };
    };

    // Send a message to someone else
    var sendTo = Mailbox.sendTo = function (ctx, type, msg, user, _cb) {
        user = user || {};
        var cb = _cb || function (obj) {
            if (obj && obj.error) {
                console.error(obj.error);
            }
        };

        if (!Crypto.Mailbox) {
            return void cb({error: "chainpad-crypto is outdated and doesn't support mailboxes."});
        }

        var anonRpc = Util.find(ctx, [ 'store', 'anon_rpc', ]);
        if (!anonRpc) { return void cb({error: "anonymous rpc session not ready"}); }

        // Broadcast mailbox doesn't use encryption. Sending messages there is restricted
        // to admins in the server directly
        var crypto = { encrypt: function (x) { return x; } };
        var channel = BROADCAST_CHAN;
        var obj = {
            uid: Util.uid(), // add uid at the beginning to have a unique server hash
            type: type,
            content: msg
        };

        if (!/^BROADCAST/.test(type)) {
            var keys = getMyKeys(ctx);
            if (!keys) { return void cb({error: "missing asymmetric encryption keys"}); }
            if (!user || !user.channel || !user.curvePublic) { return void cb({error: "no notification channel"}); }
            channel = user.channel;
            crypto = Crypto.Mailbox.createEncryptor(keys);

            // Always send your data
            if (typeof(msg) === "object" && !msg.user) {
                var myData = Messaging.createData(ctx.store.proxy, false);
                msg.user = myData;
            }
            obj = {
                type: type,
                content: msg
            };
        }

        var text = JSON.stringify(obj);
        var ciphertext = crypto.encrypt(text, user.curvePublic);

        // If we've sent this message to one of our teams' mailbox, we may want to "dismiss" it
        // automatically
        if (user.viewed) {
            var team = Util.find(ctx, ['store', 'proxy', 'teams', user.viewed]);
            if (team) {
                var hash = ciphertext.slice(0,64);
                var viewed = Util.find(team, ['keys', 'mailbox', 'viewed']);
                if (Array.isArray(viewed)) { viewed.push(hash); }
            }
        }

        anonRpc.send("WRITE_PRIVATE_MESSAGE", [
            channel,
            ciphertext
        ], function (err /*, response */) {
            if (err) {
                return void cb({
                    error: err,
                });
            }
            return void cb({
                hash: ciphertext.slice(0,64)
            });
        });
    };
    Mailbox.sendToAnon = function (anonRpc, type, msg, user, cb) {
        var Nacl = Crypto.Nacl;
        var curveSeed = Nacl.randomBytes(32);
        var curvePair = Nacl.box.keyPair.fromSecretKey(new Uint8Array(curveSeed));
        var curvePrivate = Nacl.util.encodeBase64(curvePair.secretKey);
        var curvePublic = Nacl.util.encodeBase64(curvePair.publicKey);
        sendTo({
            store: {
                anon_rpc: anonRpc,
                proxy: {
                    curvePrivate: curvePrivate,
                    curvePublic: curvePublic
                }
            }
        }, type, msg, user, cb);
    };

    // Mark a message as read
    var dismiss = function (ctx, data, cId, cb) {
        var type = data.type;
        var hash = data.hash;

        // Reminder messages don't persist
        if (/^REMINDER\|/.test(hash)) {
            cb();
            delete ctx.boxes.reminders.content[hash];
            hideMessage(ctx, type, hash, ctx.clients.filter(function (clientId) {
                return clientId !== cId;
            }));

            var uid = hash.slice(9).split('-')[0];
            var d = Util.find(ctx, ['store', 'proxy', 'hideReminders', uid]);
            if (!d) {
                var h = ctx.store.proxy.hideReminders = ctx.store.proxy.hideReminders || {};
                d = h[uid] = h[uid] || [];
            }
            var delay = hash.split('-')[1];
            if (delay && !d.includes(delay)) { d.push(Number(delay)); }
            return;
        }


        var box = ctx.boxes[type];
        if (!box) { return void cb({error: 'NOT_LOADED'}); }
        var m = box.data || {};

        // If the hash in in our history, get the index from the history:
        // - if the index is 0, we can change our lastKnownHash
        // - otherwise, just push to view
        var idx = box.history.indexOf(hash);
        if (idx !== -1) {
            if (idx === 0) {
                m.lastKnownHash = hash;
                box.history.shift();
            } else if (m.viewed.indexOf(hash) === -1) {
                m.viewed.push(hash);
            }
        }

        // Clear data in memory if needed
        // Check the "viewed" array to see if we're able to bump lastKnownhash more
        var sliceIdx;
        var lastKnownHash;
        var toForget = [];
        box.history.some(function (hash, i) {
            // naming here is confusing... isViewed implies it's a boolean
            // when in fact it's an index
            var isViewed = m.viewed.indexOf(hash);

            // iterate over your history until you hit an element you haven't viewed
            if (isViewed === -1) { return true; }
            // update the index that you'll use to slice off viewed parts of history
            sliceIdx = i + 1;
            // keep track of which hashes you should remove from your 'viewed' array
            toForget.push(hash);
            // prevent fetching dismissed messages on (re)connect
            lastKnownHash = hash;
        });

        // remove all elements in 'toForget' from the 'viewed' array in one step
        m.viewed = m.viewed.filter(function (hash) {
            return toForget.indexOf(hash) === -1;
        });

        if (sliceIdx) {
            box.history = box.history.slice(sliceIdx);
            m.lastKnownHash = lastKnownHash;
        }

        // Make sure we remove data about dismissed messages
        Object.keys(box.content).forEach(function (h) {
            if (box.history.indexOf(h) === -1 || m.viewed.indexOf(h) !== -1) {
                Handlers.remove(ctx, box, box.content[h], h);
                delete box.content[h];
            }
        });

        Realtime.whenRealtimeSyncs(ctx.store.realtime, function () {
            cb();
            hideMessage(ctx, type, hash, ctx.clients.filter(function (clientId) {
                return clientId !== cId;
            }));
        });
    };


    var leaveChannel = function (ctx, type, cb) {
        cb = cb || function () {};
        var box = ctx.boxes[type];
        if (!box) { return void cb(); }
        if (!box.cpNf || typeof(box.cpNf.stop) !== "function") { return void cb('EINVAL'); }
        box.cpNf.stop();
        Object.keys(box.content).forEach(function (h) {
            Handlers.remove(ctx, box, box.content[h], h);
            hideMessage(ctx, type, h, ctx.clients);
        });
        delete ctx.boxes[type];
    };
    var openChannel = function (ctx, type, m, onReady, opts) {
        opts = opts || {};
        var box = ctx.boxes[type] = {
            channel: m.channel,
            type: type,
            queue: [], // Store the messages to send when the channel is ready
            history: [], // All the hashes loaded from the server in corretc order
            content: {}, // Content of the messages that should be displayed
            sendMessage: function (msg) { // To send a message to our box
                // Always send your data
                if (typeof(msg) === "object" && !msg.user) {
                    var myData = Messaging.createData(ctx.store.proxy, false);
                    msg.user = myData;
                }
                try {
                    msg = JSON.stringify(msg);
                } catch (e) {
                    console.error(e);
                }
                box.queue.push(msg);
            },
            data: m
        };
        if (!Crypto.Mailbox) {
            return void console.error("chainpad-crypto is outdated and doesn't support mailboxes.");
        }
        var keys = m.keys || getMyKeys(ctx);
        if (!keys && !m.decrypted) { return void console.error("missing asymmetric encryption keys"); }
        var crypto = m.decrypted ? {
            encrypt: function (x) { return x; },
            decrypt: function (x) { return x; }
        } : Crypto.Mailbox.createEncryptor(keys);
        box.encryptor = crypto;
        var cfg = {
            network: ctx.store.network,
            channel: m.channel,
            noChainPad: true,
            crypto: crypto,
            owners: type === 'broadcast' ? [] : (opts.owners || [ctx.store.proxy.edPublic]),
            lastKnownHash: m.lastKnownHash
        };
        cfg.onConnectionChange = function () {}; // Allow reconnections in chainpad-netflux
        cfg.onConnect = function (wc, sendMessage) {
            // Send a message to our box?
            // NOTE: we use our own curvePublic so that we can decrypt our own message :)
            box.sendMessage = function (_msg, cb) {
                cb = cb || function () {};
                var msg;
                try {
                    msg = JSON.stringify(_msg);
                } catch (e) {
                    console.error(e);
                }
                sendMessage(msg, function (err, hash) {
                    if (err) { return void console.error(err); }
                    box.history.push(hash);
                    _msg.ctime = +new Date();
                    box.content[hash] = _msg;
                    var message = {
                        msg: _msg,
                        hash: hash
                    };
                    showMessage(ctx, type, message);
                    cb(hash);
                }, keys.curvePublic);
            };
            box.queue.forEach(function (msg) {
                box.sendMessage(msg);
            });
            box.queue = [];
        };
        var lastReceivedHash; // Don't send a duplicate of the last known hash on reconnect
        box.onMessage = cfg.onMessage = function (msg, user, vKey, isCp, hash, author, data) {
            if (hash === m.lastKnownHash) { return; }
            if (hash === lastReceivedHash) { return; }
            var time = data && data.time;
            lastReceivedHash = hash;
            try {
                msg = JSON.parse(msg);
            } catch (e) {
                console.error(e);
            }
            if (author) { msg.author = author; }
            box.history.push(hash);
            if (isMessageNew(hash, m)) {
                // Message should be displayed
                var message = {
                    msg: msg,
                    hash: hash,
                    time: time
                };
                var notify = box.ready;
                Handlers.add(ctx, box, message, function (dismissed, toDismiss, invalid) {
                    if (toDismiss) { // List of other messages to remove
                        dismiss(ctx, toDismiss, '', function () {
                            console.log('Notification handled automatically');
                        });
                    }
                    if (invalid || dismissed) { // This message should be removed
                        dismiss(ctx, {
                            type: type,
                            hash: hash
                        }, '', function () {
                            console.log('Notification handled automatically');
                        });
                        return;
                    }
                    msg.ctime = time || 0;
                    box.content[hash] = msg;
                    if (opts.dump) { return; }
                    showMessage(ctx, type, message, null, function (obj) {
                        if (!obj || !obj.msg || !notify) { return; }
                        Notify.system(undefined, obj.msg);
                    });
                });
            } else {
                // Message has already been viewed by the user
                if (Object.keys(box.content).length === 0) {
                    // If nothing is displayed yet, we can bump our lastKnownHash and remove this hash
                    // from our "viewed" array
                    m.lastKnownHash = hash;
                    box.history = [];
                    var idxViewed = m.viewed.indexOf(hash);
                    if (idxViewed !== -1) { m.viewed.splice(idxViewed, 1); }
                }
            }
        };
        cfg.onReady = function () {
            // Clean the "viewed" array: make sure all the "viewed" hashes are
            // in history
            var toClean = [];
            m.viewed.forEach(function (h, i) {
                if (box.history.indexOf(h) === -1) {
                    toClean.push(i);
                }
            });
            for (var i = toClean.length-1; i>=0; i--) {
                m.viewed.splice(toClean[i], 1);
            }
            // Listen for changes in the "viewed" and lastKnownHash values
            var view = function (h) {
                Handlers.remove(ctx, box, box.content[h], h);
                delete box.content[h];
                hideMessage(ctx, type, h);
            };
            ctx.store.proxy.on('change', ['mailboxes', type], function (o, n, p) {
                if (p[2] === 'lastKnownHash') {
                    // Hide everything up to this hash
                    var sliceIdx;
                    box.history.some(function (h, i) {
                        sliceIdx = i + 1;
                        view(h);
                        if (h === n) { return true; }
                    });
                    box.history = box.history.slice(sliceIdx);
                }
                if (p[2] === 'viewed') {
                    // Hide this message
                    view(n);
                }
            });
            box.ready = true;
            // Continue
            onReady(box.content);
        };
        box.cpNf = CpNetflux.start(cfg);
    };

    var initializeHistory = function (ctx) {
        var network = ctx.store.network;
        network.on('message', function (msg, sender) {
            if (sender !== network.historyKeeper) { return; }
            var parsed = JSON.parse(msg);
            if (!/HISTORY_RANGE/.test(parsed[0])) { return; }

            var txid = parsed[1];
            var req = ctx.req[txid];
            if (!req) { return; }
            var type = parsed[0];
            var _msg = parsed[2];
            var box = req.box;

            if (type === 'HISTORY_RANGE') {
                if (!Array.isArray(_msg)) { return; }
                var message;
                if (req.box.type === 'broadcast') {
                    message = Util.tryParse(_msg[4]);
                } else {
                    try {
                        var decrypted = box.encryptor.decrypt(_msg[4]);
                        message = JSON.parse(decrypted.content);
                        message.author = decrypted.author;
                    } catch (e) {
                        console.log(e);
                    }
                }
                var hash = _msg[4].slice(0,64);
                ctx.emit('HISTORY', {
                    txid: txid,
                    time: _msg[5],
                    message: message,
                    hash: hash
                }, [req.cId]);
            } else if (type === 'HISTORY_RANGE_END') {
                ctx.emit('HISTORY', {
                    txid: txid,
                    complete: true
                }, [req.cId]);
                delete ctx.req[txid];
            }
        });
    };
    var loadHistory = function (ctx, clientId, data, cb) {
        var box = ctx.boxes[data.type];
        if (!box) { return void cb({error: 'ENOENT'}); }
        var msg = [ 'GET_HISTORY_RANGE', box.channel, {
                from: data.lastKnownHash,
                count: data.count,
                txid: data.txid
            }
        ];
        if (data.type === 'broadcast') {
            msg = [ 'GET_HISTORY_RANGE', box.channel, {
                    to: data.lastKnownHash,
                    txid: data.txid
                }
            ];
        }
        ctx.req[data.txid] = {
            cId: clientId,
            box: box
        };
        var network = ctx.store.network;
        network.sendto(network.historyKeeper, JSON.stringify(msg)).then(function () {
        }, function (err) {
            console.error(err);
        });
    };

    var subscribe = function (ctx, data, cId, cb) {
        // Get existing notifications
        Object.keys(ctx.boxes).forEach(function (type) {
            Object.keys(ctx.boxes[type].content).forEach(function (h) {
                var message = {
                    msg: ctx.boxes[type].content[h],
                    hash: h
                };
                showMessage(ctx, type, message, cId, function (obj) {
                    if (obj.error) { return; }
                    // Notify only if "requiresNotif" is true
                    if (!message.msg || !message.msg.requiresNotif) { return; }
                    Notify.system(undefined, obj.msg);
                    delete message.msg.requiresNotif;
                });
            });
        });
        // Subscribe to new notifications
        var idx = ctx.clients.indexOf(cId);
        if (idx === -1) {
            ctx.clients.push(cId);
        }
        cb();
    };

    var removeClient = function (ctx, cId) {
        var idx = ctx.clients.indexOf(cId);
        ctx.clients.splice(idx, 1);
    };

    Mailbox.init = function (cfg, waitFor, emit) {
        var mailbox = {};
        var store = cfg.store;
        var mailboxes = store.proxy.mailboxes = store.proxy.mailboxes || {};

        var ctx = {
            Store: cfg.Store,
            store: store,
            pinPads: cfg.pinPads,
            updateMetadata: cfg.updateMetadata,
            updateDrive: cfg.updateDrive,
            mailboxes: mailboxes,
            emit: emit,
            clients: [],
            boxes: {},
            req: {},
            loggedIn: store.loggedIn && store.proxy.edPublic
        };

        initializeMailboxes(ctx, mailboxes);
        if (ctx.loggedIn) {
            initializeHistory(ctx);
        }

        ctx.boxes.reminders = {
            content: {}
        };

        Object.keys(mailboxes).forEach(function (key) {
            if (TYPES.indexOf(key) === -1) { return; }
            var m = mailboxes[key];

            if (BLOCKING_TYPES.indexOf(key) === -1) {
                openChannel(ctx, key, m, function () {
                    //console.log(key + ' mailbox is ready');
                });
            } else {
                openChannel(ctx, key, m, waitFor(function () {
                    //console.log(key + ' mailbox is ready');
                }));
            }
        });

        if (ctx.loggedIn) {
            Object.keys(store.proxy.teams || {}).forEach(function (teamId) {
                var team = store.proxy.teams[teamId];
                if (!team) { return; }
                var teamMailbox = team.keys.mailbox || {};
                if (!teamMailbox.channel) { return; }
                var opts = {
                    owners: [Util.find(team, ['keys', 'drive', 'edPublic'])]
                };
                openChannel(ctx, 'team-'+teamId, teamMailbox, function () {
                    //console.log('Mailbox team', teamId);
                }, opts);
            });
        }

        mailbox.post = function (box, type, content) {
            var b = ctx.boxes[box];
            if (!b) { return; }
            b.sendMessage({
                type: type,
                content: content,
                sender: store.proxy.curvePublic
            });
        };

        mailbox.hideMessage = function (type, msg) {
            hideMessage(ctx, type, msg.hash, ctx.clients);
        };
        mailbox.showMessage = function (type, msg, cId, cb) {
            if (type === "reminders" && msg) {
                ctx.boxes.reminders.content[msg.hash] = msg.msg;
                if (!ctx.clients.length) {
                    ctx.boxes.reminders.content[msg.hash].requiresNotif = true;
                }
                // Hide existing messages for this event
                hideMessage(ctx, type, msg.hash, ctx.clients);
            }
            showMessage(ctx, type, msg, cId, function (obj) {
                Notify.system(undefined, obj.msg);
                if (cb) { cb(); }
            });
        };

        mailbox.open = function (key, m, cb, team, opts) {
            if (TYPES.indexOf(key) === -1 && !team) { return; }
            openChannel(ctx, key, m, cb, opts);
        };
        mailbox.close = function (key, cb) {
            leaveChannel(ctx, key, cb);
        };

        mailbox.dismiss = function (data, cb) {
            dismiss(ctx, data, '', cb);
        };

        mailbox.sendTo = function (type, msg, user, cb) {
            if (!ctx.loggedIn) { return void cb({error:'NOT_LOGGED_IN'}); }
            sendTo(ctx, type, msg, user, cb);
        };

        mailbox.removeClient = function (clientId) {
            removeClient(ctx, clientId);
        };
        mailbox.execCommand = function (clientId, obj, cb) {
            var cmd = obj.cmd;
            var data = obj.data;
            if (cmd === 'SUBSCRIBE') {
                return void subscribe(ctx, data, clientId, cb);
            }
            if (cmd === 'DISMISS') {
                return void dismiss(ctx, data, clientId, cb);
            }
            if (cmd === 'SENDTO') {
                return void sendTo(ctx, data.type, data.msg, data.user, cb);
            }
            if (cmd === 'LOAD_HISTORY') {
                return void loadHistory(ctx, clientId, data, cb);
            }
        };

        return mailbox;
    };

    return Mailbox;
});

