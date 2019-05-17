define([
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-realtime.js',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/bower_components/chainpad-crypto/crypto.js',
], function (Util, Hash, Realtime, CpNetflux, Crypto) {
    var Mailbox = {};

    var TYPES = [
        'notifications',
        'test'
    ];
    var BLOCKING_TYPES = [
    ];

    var initializeMailboxes = function (mailboxes) {
        if (!mailboxes['notifications']) {
            mailboxes.notifications = {
                channel: Hash.createChannelId(),
                lastKnownHash: '',
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

    var showMessage = function (ctx, type, msg, cId) {
        ctx.emit('MESSAGE', {
            type: type,
            content: msg
        }, cId ? [cId] : ctx.clients);
    };

    var getMyKeys = function (ctx) {
        var proxy = ctx.store && ctx.store.proxy;
        if (!proxy.curvePrivate || !proxy.curvePublic) { return; }
        return {
            curvePrivate: proxy.curvePrivate,
            curvePublic: proxy.curvePublic
        };
    };

    var openChannel = function (ctx, type, m, onReady) {
        var box = ctx.boxes[type] = {
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
        Crypto = Crypto;
        if (!Crypto.Mailbox) {
            return void console.error("chainpad-crypto is outdated and doesn't support mailboxes.");
        }
        var keys = getMyKeys(ctx);
        if (!keys) { return void console.error("missing asymmetric encryption keys"); }
        var crypto = Crypto.Mailbox.createEncryptor(keys);
        // XXX remove 'test'
        if (type === 'test') {
            crypto = {
                encrypt: function (x) { return x; },
                decrypt: function (x) { return x; }
            };
        }
        var cfg = {
            network: ctx.store.network,
            channel: m.channel,
            noChainPad: true,
            crypto: crypto,
            owners: [ctx.store.proxy.edPublic],
            lastKnownHash: m.lastKnownHash
        };
        cfg.onConnect = function (wc, sendMessage) {
            // Send a message to our box?
            // NOTE: we use our own curvePublic so that we can decrypt our own message :)
            box.sendMessage = function (msg) {
                try {
                    msg = JSON.stringify(msg);
                } catch (e) {
                    console.error(e);
                }
                sendMessage(msg, function (err, hash) {
                    if (m.viewed.indexOf(hash) === -1) {
                        m.viewed.push(hash);
                    }
                }, keys.curvePublic);
            };
            box.queue.forEach(function (msg) {
                box.sendMessage(msg);
            });
            box.queue = [];
        };
        cfg.onMessage = function (msg, user, vKey, isCp, hash, author) {
            try {
                msg = JSON.parse(msg);
                console.log(msg);
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
                box.content[hash] = msg;
                showMessage(ctx, type, message);
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
            ctx.store.proxy.on('change', ['mailboxes', type], function () {
                // Check everything!
                // XXX
            });
            // Continue
            onReady();
        };
        CpNetflux.start(cfg);
    };

    // Send a message to someone else
    var sendTo = function (ctx, type, msg, user, cb) {
        if (!Crypto.Mailbox) {
            return void cb({error: "chainpad-crypto is outdated and doesn't support mailboxes."});
        }
        var keys = getMyKeys(ctx);
        if (!keys) { return void cb({error: "missing asymmetric encryption keys"}); }
        if (!user || !user.channel || !user.curvePublic) { return void cb({error: "no notification channel"}); }

        var crypto = Crypto.Mailbox.createEncryptor(keys);
        var network = ctx.store.network;

        var ciphertext = crypto.encrypt(JSON.stringify({
            type: type,
            content: msg
        }), user.curvePublic);

        network.join(user.channel).then(function (wc) {
            wc.bcast(ciphertext).then(function () {
                cb();
            });
        }, function (err) {
            cb({error: err});
        });
    };

    var updateLastKnownHash = function (ctx, type) {
        var m = Util.find(ctx, ['store', 'proxy', 'mailboxes', type]);
        if (!m) { return; }
        var box = ctx.boxes[type];
        if (!box) { return; }

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
                delete box.content[hash];
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
                delete box.content[h];
            }
        });

        Realtime.whenRealtimeSyncs(ctx.store.realtime, function () {
            cb();
            ctx.emit('VIEWED', {
                type: type,
                hash: hash
            }, ctx.clients.filter(function (clientId) {
                return clientId !== cId;
            }));
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

    Mailbox.init = function (store, waitFor, emit) {
        var mailbox = {};
        var ctx = {
            store: store,
            emit: emit,
            clients: [],
            boxes: {}
        };

        var mailboxes = store.proxy.mailboxes = store.proxy.mailboxes || {};

        initializeMailboxes(mailboxes);

        Object.keys(mailboxes).forEach(function (key) {
            if (TYPES.indexOf(key) === -1) { return; }
            var m = mailboxes[key];

            if (BLOCKING_TYPES.indexOf(key) === -1) {
                openChannel(ctx, key, m, function () {
                    updateLastKnownHash(ctx, key);
                    console.log(key + ' mailbox is ready');
                });
            } else {
                openChannel(ctx, key, m, waitFor(function () {
                    console.log(key + ' mailbox is ready');
                }));
            }
        });

        // XXX test function used to populate a mailbox, should be removed in prod
        mailbox.post = function (box, type, content) {
            var b = ctx.boxes[box];
            if (!b) { return; }
            b.sendMessage({
                type: type,
                content: content,
                sender: store.proxy.curvePublic
            });
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
        };

        return mailbox;
    };

    return Mailbox;
});

