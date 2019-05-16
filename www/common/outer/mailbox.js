// jshint ignore: start
define([
    '/common/common-util.js',
    '/common/common-constants.js',
    '/common/common-realtime.js',
    '/customize/messages.js',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/bower_components/chainpad-crypto/crypto.js',
], function (Util, Constants, Realtime, Messages, CpNetflux, Crypto) {
    var Mailbox = {};

    var TYPES = [
        'notifications'
    ];
    var BLOCKING_TYPES = [
    ];

/*
proxy.mailboxes = {
    friends: {
        keys: '',
        channel: '',
        hash: '',
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

    var openChannel = function (ctx, type, m, onReady) {
        var box = ctx.boxes[type] = {
            queue: [],
            history: [],
            sendMessage: function (msg) { // To send a message to our box
                try {
                    msg = JSON.stringify(msg);
                } catch (e) {
                    console.error(e);
                }
                box.queue.push(msg);
            }
        };
        /*
        // XXX
        if (!Crypto.Mailbox) {
            return void console.error("chainpad-crypto is outdated and doesn't support mailboxes.");
        }
        var crypto = Crypto.Mailbox.createEncryptor();
        */
        var crypto = {
            encrypt: function (x) { return x; },
            decrypt: function (x) { return x; }
        };
        var cfg = {
            network: ctx.store.network,
            channel: m.channel, // TODO
            noChainPad: true,
            crypto: crypto,
            owners: [ctx.store.proxy.edPublic],
            lastKnownHash: m.lastKnownHash
        };
        cfg.onConnect = function (wc, sendMessage) {
            // Send a message to our box?
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
                });
            };
            box.queue.forEach(function (msg) {
                box.sendMessage(msg);
            });
            box.queue = [];
        };
        cfg.onMessage = function (msg, user, vKey, isCpi, hash) {
            // TODO
            try {
                msg = JSON.parse(msg);
            } catch (e) {
                console.error(e);
            }
            if (isMessageNew(hash, m)) {
                // Message should be displayed
                var message = {
                    msg: msg,
                    hash: hash
                };
                box.history.push(message);
                showMessage(ctx, type, message);
            } else {
                // Message has already been viewer by the user
                if (history.length === 0) {
                    m.lastKnownHash = hash;
                }
                console.log(hash + ' is not new');
            }
        };
        cfg.onReady = function () {
            onReady();
        };
        CpNetflux.start(cfg);
    };

    // Send a message to someone else
    var sendTo = function () {
        
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
            if (hash === el.hash) {
                idx = i;
                return true;
            }
        })) {
            if (idx === 0) {
                m.lastKnownHash = hash;
            } else if (m.viewed.indexOf(hash) === -1) {
                m.viewed.push(hash);
            }
        }

        // Check the "viewed" array to see if we're able to bump lastKnownhash more
        var sliceIdx;
        box.history.some(function (el, i) {
            var isViewed = m.viewed.indexOf(el.hash);
            if (isViewed !== -1) {
                sliceIdx = i + 1;
                m.viewed.splice(isViewed, 1);
                return false;
            }
            return true;
        });
        if (sliceIdx) {
            box.history = box.history.slice(sliceIdx);
        }

        Realtime.whenRealtimeSyncs(ctx.store.realtime, function () {
            cb();
        });
    };

    var subscribe = function (ctx, data, cId, cb) {
        // Get existing notifications
        Object.keys(ctx.boxes).forEach(function (type) {
            ctx.boxes[type].history.forEach(function (obj) {
                showMessage(ctx, type, obj, cId);
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

        var mailboxes = store.proxy.mailboxes || {};
        Object.keys(mailboxes).forEach(function (key) {
            if (TYPES.indexOf(key) === -1) { return; }
            var m = mailboxes[key];

            if (BLOCKING_TYPES.indexOf(key) === -1) {
                openChannel(ctx, key, m, function () {
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
        };

        return mailbox;
    };

    return Mailbox;
});

