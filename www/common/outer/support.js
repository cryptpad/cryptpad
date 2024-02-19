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

    // UTILS

    var getKeys = function (ctx, isAdmin, data, _cb) {
        var cb = Util.mkAsync(_cb);
        if (isAdmin && !ctx.adminRdyEvt) { return void cb('EFORBIDDEN'); }
        require(['/api/config?' + (+new Date())], function (NewConfig) {
            var supportKey = NewConfig.newSupportMailbox;
            if (!supportKey) { return void cb('E_NOT_INIT'); }

            // If admin, check key
            if (isAdmin && Util.find(ctx.store.proxy, [
                'mailboxes', 'support2', 'keys', 'curvePublic']) !== supportKey) {
                return void cb('EFORBIDDEN');
            }

            if (isAdmin) {
                return ctx.adminRdyEvt.reg(() => {
                    cb(null, {
                        myCurve: data.adminCurvePrivate || Util.find(ctx.store.proxy, [
                                    'mailboxes', 'support2', 'keys', 'curvePrivate']),
                        theirPublic: data.curvePublic,
                        notifKey: data.curvePublic
                    });
                });
            }

            cb(null, {
                theirPublic: data.curvePublic || supportKey, // old tickets may use deprecated key
                myCurve: ctx.store.proxy.curvePrivate,
                notifKey: supportKey
            });
        });
    };

    // Get the content of a ticket mailbox and close it
    var getContent = function (ctx, data, isAdmin, _cb) {
        var cb = Util.once(Util.both(close, Util.mkAsync(_cb)));
        var theirPublic, myCurve;
        nThen((waitFor) => {
            getKeys(ctx, isAdmin, data, waitFor((err, obj) => {
                if (err) {
                    waitFor.abort();
                    return void cb({error: err});
                }
                theirPublic = obj.theirPublic;
                myCurve = obj.myCurve;
            }));
        }).nThen((waitFor) => {
            var keys = Crypto.Curve.deriveKeys(theirPublic, myCurve);
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
                msg.time = time;
                if (author) { msg.author = author; }
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
            getKeys(ctx, false, data, waitFor((err, obj) => {
                if (err) {
                    waitFor.abort();
                    return void cb({error: err});
                }
                supportKey = obj.theirPublic;
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
            ctx.supportData[channel] = {
                time: +new Date(),
                title: title,
                curvePublic: supportKey // XXX Should we store this value or delete the ticket on key rotation?
            };
            ctx.Store.onSync(null, waitFor());
        }).nThen(() => {
            var supportChannel = Hash.getChannelIdFromKey(supportKey);
            // XXX isAdmin
            mailbox.sendTo('NEW_TICKET', {
                title: title,
                channel: channel,
                premium: Util.find(ctx, ['store', 'account', 'plan'])
            }, {
                channel: supportChannel,
                curvePublic: supportKey
            }, (obj) => {
                // Don't store the ticket in case of error
                if (obj && obj.error) { delete ctx.supportData[channel]; }
                cb(obj);
            });
            // XXX isAdmin
            mailbox.sendTo('NOTIF_TICKET', {
                title: title,
                channel: channel,
            }, {
                channel: supportChannel,
                curvePublic: supportKey
            }, () => {});
        });
    };

    var replyTicket = function (ctx, data, isAdmin, cb) {
        var mailbox = Util.find(ctx, [ 'store', 'mailbox' ]);
        var anonRpc = Util.find(ctx, [ 'store', 'anon_rpc' ]);
        if (!mailbox) { return void cb('E_NOT_READY'); }
        if (!anonRpc) { return void cb("anonymous rpc session not ready"); }
        var theirPublic, myCurve, notifKey;
        nThen((waitFor) => {
            // Get correct keys
            getKeys(ctx, isAdmin, data, waitFor((err, obj) => {
                if (err) {
                    waitFor.abort();
                    return void cb({error: err});
                }
                theirPublic = obj.theirPublic;
                myCurve = obj.myCurve;
                notifKey = obj.notifKey;
            }));
        }).nThen((waitFor) => {
            // Send message
            var keys = Crypto.Curve.deriveKeys(theirPublic, myCurve);
            var crypto = Crypto.Curve.createEncryptor(keys);
            var text = JSON.stringify(data.ticket);
            var ciphertext = crypto.encrypt(text);
            anonRpc.send("WRITE_PRIVATE_MESSAGE", [
                data.channel,
                ciphertext
            ], waitFor((err) => {
                if (err) {
                    waitFor.abort();
                    return void cb(err);
                }
                cb();
            }));
        }).nThen(() => {
            // On success, notify
            var notifChannel = isAdmin ? data.notifChannel : Hash.getChannelIdFromKey(notifKey);
            if (!notifChannel) { return; }
            mailbox.sendTo('NOTIF_TICKET', {
                isAdmin: isAdmin,
                title: data.ticket.title,
                channel: data.channel,
            }, {
                channel: notifChannel,
                curvePublic: notifKey
            }, () => {
                // Do nothing, not a problem if notifications fail
            });
        });
    };

    // USER COMMANDS

    var getMyTickets = function (ctx, data, cId, cb) {
        var all = [];
        var n = nThen;
        Object.keys(ctx.supportData).forEach(function (ticket) {
            n = n((waitFor) => {
                var t = Util.clone(ctx.supportData[ticket]);
                getContent(ctx, {
                    channel: ticket,
                }, false, waitFor((err, messages) => {
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
    var replyMyTicket = function (ctx, data, cId, cb) {
        replyTicket(ctx, data, false, (err) => {
            if (err) { return void cb({error: err}); }
            cb({sent: true});
        });
    };

    // ADMIN COMMANDS

    var listTicketsAdmin = function (ctx, data, cId, cb) {
        if (!ctx.adminRdyEvt) { return void cb({ error: 'EFORBIDDEN' }); }
        ctx.adminRdyEvt.reg(() => {
            var doc = ctx.adminDoc.proxy;
            cb(Util.clone(doc.tickets.active));
        });
    };

    var loadTicketAdmin = function (ctx, data, cId, cb) {
        getContent(ctx, data, true, function (err, res) {
            if (err) { return void cb({error: err}); }
            ctx.adminRdyEvt.reg(() => {
                var doc = ctx.adminDoc.proxy;
                if (Array.isArray(res) && res.length) {
                    res.sort((t1, t2) => { return t1.time - t2.time; });
                    let last = res[res.length - 1];
                    var entry = doc.tickets.active[data.channel];
                    if (entry) { entry.time = last.time; }
                }
                cb(res);
            });
        });
    };

    var replyTicketAdmin = function (ctx, data, cId, cb) {
        if (!ctx.adminRdyEvt) { return void cb({ error: 'EFORBIDDEN' }); }
        replyTicket(ctx, data, true, (err) => {
            if (err) { return void cb({error: err}); }
            ctx.adminRdyEvt.reg(() => {
                var doc = ctx.adminDoc.proxy;
                var entry = doc.tickets.active[data.channel] || doc.tickets.pending[data.channel];
                entry.time = +new Date();
                entry.lastAdmin = true;
            });
            cb({sent: true});
        });
    };

    // Mailbox events

    var addAdminTicket = function (ctx, data, cb) {
        // Wait for the chainpad to be ready before adding the data
        if (!ctx.adminRdyEvt) { return void cb(false); } // XXX not an admin, delete mailbox?

        ctx.adminRdyEvt.reg(() => {
            // random timeout to avoid duplication wiht multiple admins
            var rdmTo = Math.floor(Math.random() * 2000); // Between 0 and 2000ms
            setTimeout(() => {
                var doc = ctx.adminDoc.proxy;
                if (doc.tickets.active[data.channel] || doc.tickets.closed[data.channel]
                    || doc.tickets.pending[data.channel]) {
                    return void cb(false); }
                doc.tickets.active[data.channel] = {
                    title: data.title,
                    premium: data.premium,
                    time: data.time,
                    author: data.user && data.user.displayName,
                    authorKey: data.user && data.user.curvePublic
                };
                Realtime.whenRealtimeSyncs(ctx.adminDoc.realtime, function () {
                    cb(false);
                });
            });
        });
    };
    var updateAdminTicket = function (ctx, data) {
        // Wait for the chainpad to be ready before adding the data
        if (!ctx.adminRdyEvt) { return void cb(false); } // XXX not an admin, delete mailbox?

        ctx.adminRdyEvt.reg(() => {
            // random timeout to avoid duplication wiht multiple admins
            var rdmTo = Math.floor(Math.random() * 2000); // Between 0 and 2000ms
            setTimeout(() => {
                var doc = ctx.adminDoc.proxy;
                if (!doc.tickets.active[data.channel] && !doc.tickets.pending[data.channel]) {
                    return; }
                let t = doc.tickets.active[data.channel] || doc.tickets.pending[data.channel];
                t.time = data.time;
            });
        });
    };

    // INITIALIZE ADMIN

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
        rt.proxy.on('ready', function () {
            var doc = rt.proxy;
            doc.tickets = doc.tickets || {};
            doc.tickets.active = doc.tickets.active || {};
            doc.tickets.closed = doc.tickets.closed || {};
            ctx.adminRdyEvt.fire();
            cb();
        });
    };


    var initializeSupportAdmin = function (ctx, waitFor) {
        let unlock = waitFor();
        let proxy = ctx.store.proxy;
        let supportKey = Util.find(proxy, ['mailboxes', 'support2', 'keys', 'curvePublic']);
        let privateKey = Util.find(proxy, ['mailboxes', 'support2', 'keys', 'curvePrivate']);
        ctx.adminRdyEvt = Util.mkEvent(true);
        nThen((waitFor) => {
            getKeys(ctx, false, {}, waitFor((err, obj) => {
                setTimeout(unlock); // Unlock loading process
                if (err) { return void waitFor.abort(); }
                if (obj.theirPublic !== supportKey) {
                    // Deprecated support key: no longer an admin!
                    // XXX delete the mailbox?
                    return void waitFor.abort();
                }
            }));
        }).nThen((waitFor) => {
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
            console.log('Support admin loaded')
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
            initializeSupportAdmin(ctx, waitFor);
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
        support.updateAdminTicket = function (content) {
            updateAdminTicket(ctx, content);
        };
        support.execCommand = function (clientId, obj, cb) {
            var cmd = obj.cmd;
            var data = obj.data;
            if (cmd === 'MAKE_TICKET') {
                return void makeTicket(ctx, data, clientId, cb);
            }
            if (cmd === 'LIST_TICKETS_ADMIN') {
                return void listTicketsAdmin(ctx, data, clientId, cb);
            }
            if (cmd === 'LOAD_TICKET_ADMIN') {
                return void loadTicketAdmin(ctx, data, clientId, cb);
            }
            if (cmd === 'REPLY_TICKET_ADMIN') {
                return void replyTicketAdmin(ctx, data, clientId, cb);
            }
            if (cmd === 'GET_MY_TICKETS') {
                return void getMyTickets(ctx, data, clientId, cb);
            }
            if (cmd === 'REPLY_TICKET') {
                return void replyMyTicket(ctx, data, clientId, cb);
            }
            cb({error: 'NOT_SUPPORTED'});
        };

        return support;
    };

    return Support;
});
