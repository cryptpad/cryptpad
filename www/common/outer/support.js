// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-realtime.js',
    '/components/nthen/index.js',
    '/components/chainpad-crypto/crypto.js',
    'chainpad-listmap',
    '/components/chainpad/chainpad.dist.js',
    'chainpad-netflux'
], function (Util, Hash, Realtime, nThen, Crypto, Listmap, ChainPad, CpNetflux) {
    var Support = {};

    var getKeys = function (ctx, cb) {
        require(['/api/config?' + (+new Date())], function (NewConfig) {
            var supportKey = NewConfig.newSupportMailbox;
            if (!supportKey) { return void cb('E_NOT_INIT'); }
            var myCurve = ctx.store.proxy.curvePrivate;
            cb(null, {
                supportKey,
                myCurve
            });
        });
    };

    // Get the content of a mailbox and close it
    // Used for support tickets
    var getContent = function (ctx, data, _cb) {
        var cb = Util.once(Util.both(close, Util.mkAsync(_cb)));
        var supportKey, myCurve;
        nThen((waitFor) => {
            // Send ticket to the admins and call back
            getKeys(ctx, waitFor((err, obj) => {
                if (err) {
                    waitFor.abort();
                    return void cb({error: err});
                }
                supportKey = obj.supportKey;
                myCurve = obj.myCurve;
            }));
        }).nThen((waitFor) => {
            var keys = Crypto.Curve.deriveKeys(supportKey, myCurve);
            var crypto = Crypto.Curve.createEncryptor(keys);
            var cfg = {
                network: ctx.store.network,
                channel: data.channel,
                noChainPad: true,
                crypto: crypto,
                owners: []
            };
            var all = [];
            var cpNf;
            var close = function () {
                if (!cpNf) { return; }
                if (typeof(cpNf.stop) !== "function") { return; }
                cpNf.stop();
            };
            cfg.onMessage = function (msg, user, vKey, isCp, hash, author, data) {
                var time = data && data.time;
                try {
                    msg = JSON.parse(msg);
                } catch (e) {
                    console.error(e);
                }
                if (author) { msg.author = author; }
                console.log(msg);
                all.push(msg);
            };
            cfg.onError = cb;
            cfg.onChannelError = cb;
            cfg.onReady = function () {
                cb(null, all);
            };
            cpNf = CpNetflux.start(cfg);
        });
    };

    var loadAdminDoc = function (ctx, hash, cb) {
        var secret = Hash.getSecrets('support', hash);
        var listmapConfig = {
            data: {},
            channel: secret.channel,
            crypto: Crypto.createEncryptor(secret.keys),
            userName: 'support',
            ChainPad: ChainPad,
            classic: true,
            network: ctx.store.network,
            //Cache: Cache, // XXX XXX XXX
            metadata: {
                validateKey: secret.keys.validateKey || undefined,
            },
        };
        var rt = ctx.adminDoc = Listmap.create(listmapConfig);
        // XXX on change, tell current user that support has changed?
        rt.onReady = Util.mkEvent(true);
        rt.proxy.on('ready', function () {
            var doc = rt.proxy;
            doc.tickets = doc.tickets || {};
            doc.tickets.active = doc.tickets.active || {};
            doc.tickets.closed = doc.tickets.closed || {};
            rt.onReady.fire();
            cb();
        });
    };

/*

{
    tickets: {
        active: {},
        closed: {}
    }
}

*/

    var addAdminTicket = function (ctx, data, cb) {
        console.error(data);
        if (!ctx.adminDoc) {
            if (ctx.admin) {
                return void setTimeout(() => { addAdminTicket(ctx, data, cb); }, 200);
            }
            // XXX You have an admin mailbox but wrong keys ==> delete the mailbox?
            return void cb(false);
        }
        // Wait for the chainpad to be ready before adding the data
        ctx.adminDoc.onReady.reg(() => {
            // random timeout to avoid duplication wiht multiple admins
            var rdmTo = Math.floor(Math.random() * 2000); // Between 0 and 2000ms
            console.warn(rdmTo);
            setTimeout(() => {
                var doc = ctx.adminDoc.proxy;
                console.warn(data.channel, doc.tickets.active);
                if (doc.tickets.active[data.channel] || doc.tickets.closed[data.channel]) {
                    console.warn('already there');
                    return void cb(true); }
                doc.tickets.active[data.channel] = {
                    title: data.title,
                    author: data.user && data.user.curvePublic
                };
                Realtime.whenRealtimeSyncs(ctx.adminDoc.realtime, function () {
                    console.warn('synced');
                    cb(true);
                });
            });
        });
    };
    var initializeSupportAdmin = function (ctx) {
        let proxy = ctx.store.proxy;
        let supportKey = Util.find(proxy, ['mailboxes', 'support2', 'keys', 'curvePublic']);
        let privateKey = Util.find(proxy, ['mailboxes', 'support2', 'keys', 'curvePrivate']);
        nThen((waitFor) => {
            getKeys(ctx, waitFor((err, obj) => {
                if (err) { return void waitFor.abort(); }
                if (obj.supportKey !== supportKey) {
                    // Deprecated support key: no longer an admin!
                    ctx.admin = false;
                    // XXX delete the mailbox?
                    return void waitFor.abort();
                }
            }));
        }).nThen((waitFor) => {
            ctx.admin = true;
            let seed = privateKey.slice(0,24); // XXX better way to get seed?
            let hash = Hash.getEditHashFromKeys({
                version: 2,
                type: 'support',
                keys: {
                    editKeyStr: seed
                }
            });
            loadAdminDoc(ctx, hash, waitFor());
        }).nThen(() => {
            console.log(ctx.store.mailbox)
        });

    };

    var makeTicket = function (ctx, data, cId, cb) {
        var mailbox = Util.find(ctx, [ 'store', 'mailbox' ]);
        var anonRpc = Util.find(ctx, [ 'store', 'anon_rpc' ]);
        if (!mailbox) { return void cb({error: 'E_NOT_READY'}); }
        if (!anonRpc) { return void cb({error: "anonymous rpc session not ready"}); }

        var channel = data.channel;
        var title = data.title;
        var ticket = data.ticket;
        var supportKey, myCurve;
        nThen((waitFor) => {
            // Send ticket to the admins and call back
            getKeys(ctx, waitFor((err, obj) => {
                if (err) {
                    waitFor.abort();
                    return void cb({error: err});
                }
                supportKey = obj.supportKey;
                myCurve = obj.myCurve;
            }));
        }).nThen((waitFor) => {
            // Create ticket mailbox
            var keys = Crypto.Curve.deriveKeys(supportKey, myCurve);
            var crypto = Crypto.Curve.createEncryptor(keys);
            var text = JSON.stringify(ticket);
            var ciphertext = crypto.encrypt(text);
            anonRpc.send("WRITE_PRIVATE_MESSAGE", [
                channel,
                ciphertext
            ], waitFor((err) => {
                if (err) {
                    waitFor.abort();
                    return void cb({error: err});
                }
            }));
        }).nThen((waitFor) => {
            // Store in our worker
            console.error(channel);
            ctx.supportData[channel] = {
                time: +new Date(),
                title: title,
                curvePublic: supportKey // XXX Should we store this value or delete the ticket on key rotation?
            };
            ctx.Store.onSync(null, waitFor());
        }).nThen(() => {
            var supportChannel = Hash.getChannelIdFromKey(supportKey);
            console.error(supportChannel);
            mailbox.sendTo('NEW_TICKET', {
                title: title,
                channel: channel
            }, {
                channel: supportChannel,
                curvePublic: supportKey
            }, (obj) => {
                // Don't store the ticket in case of error
                if (obj && obj.error) { delete ctx.supportData[channel]; }
                cb(obj);
            });
        });
    };

    var getMyTickets = function (ctx, data, cId, cb) {
        var all = [];
        var n = nThen;
        Object.keys(ctx.supportData).forEach(function (ticket) {
            n = n((waitFor) => {
                var t = Util.clone(ctx.supportData[ticket]);
                getContent(ctx, {
                    channel: ticket,
                }, waitFor((err, messages) => {
                    if (err) { t.error = err; }
                    else { t.messages = messages; }
                    t.id = ticket;
                    all.push(t);
                }));
            }).nThen;
        });
        n(() => {
            cb({tickets: all});
        });
    };

    Support.init = function (cfg, waitFor, emit) {
        var support = {};

        // Already initialized by a "noDrive" tab?
        if (cfg.store && cfg.store.modules && cfg.store.modules['support']) {
            return cfg.store.modules['support'];
        }

        var store = cfg.store;
        var proxy = store.proxy.support = store.proxy.support || {};

        var ctx = {
            supportData: proxy,
            store: cfg.store,
            Store: cfg.Store,
            emit: emit,
            channels: {},
            clients: {}
        };

        if (Util.find(store, ['proxy', 'mailboxes', 'support2'])) {
            initializeSupportAdmin(ctx);

        }

        support.ctx = ctx;
        support.removeClient = function (clientId) {
            // XXX TODO
        };
        support.leavePad = function (padChan) {
            // XXX TODO
        };
        support.addAdminTicket = function (content, cb) {
            addAdminTicket(ctx, content, cb);
        };
        support.execCommand = function (clientId, obj, cb) {
            var cmd = obj.cmd;
            var data = obj.data;
            if (cmd === 'MAKE_TICKET') {
                return void makeTicket(ctx, data, clientId, cb);
            }
            if (cmd === 'GET_MY_TICKETS') {
                return void getMyTickets(ctx, data, clientId, cb);
            }
        };

        return support;
    };

    return Support;
});
