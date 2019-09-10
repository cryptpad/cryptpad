define([
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-realtime.js',
    '/common/notify.js',
    '/common/outer/mailbox-handlers.js',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/bower_components/chainpad-crypto/crypto.js',
], function (Util, Hash, Realtime, Notify, Handlers, CpNetflux, Crypto) {
    var Mailbox = {};

    var TYPES = [
        'notifications',
        'supportadmin',
        'support'
    ];
    var BLOCKING_TYPES = [
    ];

    var initializeMailboxes = function (ctx, mailboxes) {
        if (!mailboxes['notifications']) {
            mailboxes.notifications = {
                channel: Hash.createChannelId(),
                lastKnownHash: '',
                viewed: []
            };
            ctx.pinPads([mailboxes.notifications.channel], function (res) {
                if (res.error) { console.error(res); }
            });
        }
        if (!mailboxes['support']) {
            mailboxes.support = {
                channel: Hash.createChannelId(),
                lastKnownHash: '',
                viewed: []
            };
            ctx.pinPads([mailboxes.support.channel], function (res) {
                if (res.error) { console.error(res); }
            });
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
        var cb = _cb || function (obj) {
            if (obj && obj.error) {
                console.error(obj.error);
            }
        };
        if (!Crypto.Mailbox) {
            return void cb({error: "chainpad-crypto is outdated and doesn't support mailboxes."});
        }
        var keys = getMyKeys(ctx);
        if (!keys) { return void cb({error: "missing asymmetric encryption keys"}); }
        if (!user || !user.channel || !user.curvePublic) { return void cb({error: "no notification channel"}); }

        var anonRpc = Util.find(ctx, [ 'store', 'anon_rpc', ]);
        if (!anonRpc) { return void cb({error: "anonymous rpc session not ready"}); }

        var crypto = Crypto.Mailbox.createEncryptor(keys);

        var text = JSON.stringify({
            type: type,
            content: msg
        });
        var ciphertext = crypto.encrypt(text, user.curvePublic);

        anonRpc.send("WRITE_PRIVATE_MESSAGE", [
            user.channel,
            ciphertext
        ], function (err /*, response */) {
            if (err) {
                return void cb({
                    error: err,
                });
            }
            return void cb();
        });
    };

    // Mark a message as read
    var dismiss = function (ctx, data, cId, cb) {
        var type = data.type;
        var hash = data.hash;
        var m = Util.find(ctx, ['store', 'proxy', 'mailboxes', type]);
        if (!m) { return void cb({error: 'NOT_FOUND'}); }
        var box = ctx.boxes[type];
        if (!box) { return void cb({error: 'NOT_LOADED'}); }

        // If the hash in in our history, get the index from the history:
        // - if the index is 0, we can change our lastKnownHash
        // - otherwise, just push to view
        var idx;
        if (box.history.some(function (el, i) {
            if (hash === el) {
                idx = i;
                return true;
            }
        })) {
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
        box.history.some(function (hash, i) {
            var isViewed = m.viewed.indexOf(hash);
            if (isViewed !== -1) {
                sliceIdx = i + 1;
                m.viewed.splice(isViewed, 1);
                lastKnownHash = hash;
                return false;
            }
            return true;
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


    var openChannel = function (ctx, type, m, onReady) {
        var box = ctx.boxes[type] = {
            channel: m.channel,
            type: type,
            queue: [], // Store the messages to send when the channel is ready
            history: [], // All the hashes loaded from the server in corretc order
            content: {}, // Content of the messages that should be displayed
            sendMessage: function (msg) { // To send a message to our box
                try {
                    msg = JSON.stringify(msg);
                } catch (e) {
                    console.error(e);
                }
                box.queue.push(msg);
            }
        };
        if (!Crypto.Mailbox) {
            return void console.error("chainpad-crypto is outdated and doesn't support mailboxes.");
        }
        var keys = m.keys || getMyKeys(ctx);
        if (!keys) { return void console.error("missing asymmetric encryption keys"); }
        var crypto = Crypto.Mailbox.createEncryptor(keys);
        box.encryptor = crypto;
        var cfg = {
            network: ctx.store.network,
            channel: m.channel,
            noChainPad: true,
            crypto: crypto,
            owners: [ctx.store.proxy.edPublic],
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
                    box.content[hash] = _msg;
                    var message = {
                        msg: _msg,
                        hash: hash
                    };
                    showMessage(ctx, type, message);
                    cb();
                }, keys.curvePublic);
            };
            box.queue.forEach(function (msg) {
                box.sendMessage(msg);
            });
            box.queue = [];
        };
        var lastReceivedHash; // Don't send a duplicate of the last known hash on reconnect
        box.onMessage = cfg.onMessage = function (msg, user, vKey, isCp, hash, author) {
            if (hash === m.lastKnownHash) { return; }
            if (hash === lastReceivedHash) { return; }
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
                    hash: hash
                };
                Handlers.add(ctx, box, message, function (dismissed, toDismiss) {
                    if (dismissed) { // This message should be removed
                        dismiss(ctx, {
                            type: type,
                            hash: hash
                        }, '', function () {
                            console.log('Notification handled automatically');
                        });
                        return;
                    }
                    if (toDismiss) { // List of other messages to remove
                        dismiss(ctx, toDismiss, '', function () {
                            console.log('Notification handled automatically');
                        });
                    }
                    box.content[hash] = msg;
                    showMessage(ctx, type, message, null, function (obj) {
                        if (!box.ready) { return; }
                        if (!obj || !obj.msg) { return; }
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
            onReady();
        };
        CpNetflux.start(cfg);
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
                try {
                    var decrypted = box.encryptor.decrypt(_msg[4]);
                    message = JSON.parse(decrypted.content);
                    message.author = decrypted.author;
                } catch (e) {
                    console.log(e);
                }
                ctx.emit('HISTORY', {
                    txid: txid,
                    time: _msg[5],
                    message: message,
                    hash: _msg[4].slice(0,64)
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
                showMessage(ctx, type, message, cId);
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
        var ctx = {
            store: store,
            pinPads: cfg.pinPads,
            updateMetadata: cfg.updateMetadata,
            emit: emit,
            clients: [],
            boxes: {},
            req: {}
        };

        var mailboxes = store.proxy.mailboxes = store.proxy.mailboxes || {};

        initializeMailboxes(ctx, mailboxes);
        initializeHistory(ctx);

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

        mailbox.post = function (box, type, content) {
            var b = ctx.boxes[box];
            if (!b) { return; }
            b.sendMessage({
                type: type,
                content: content,
                sender: store.proxy.curvePublic
            });
        };

        mailbox.open = function (key, m, cb) {
            if (TYPES.indexOf(key) === -1) { return; }
            openChannel(ctx, key, m, cb);
        };

        mailbox.dismiss = function (data, cb) {
            dismiss(ctx, data, '', cb);
        };

        mailbox.sendTo = function (type, msg, user, cb) {
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

