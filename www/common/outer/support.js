// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/api/config',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-realtime.js',
    '/common/pinpad.js',
    '/common/cryptget.js',
    '/components/nthen/index.js',
    '/components/chainpad-crypto/crypto.js',
    'chainpad-listmap',
    '/components/chainpad/chainpad.dist.js',
    'chainpad-netflux'
], function (ApiConfig, Util, Hash, Realtime, Pinpad, Crypt,
            nThen, Crypto, Listmap, ChainPad, CpNetflux) {
    var Support = {};

    var Nacl = Crypto.Nacl;

    // UTILS

    var notifyClient = function (ctx, admin, type, channel) {
        let notifyList = Object.keys(ctx.clients).filter((cId) => {
            return Boolean(ctx.clients[cId].admin) === admin;
        });
        if (!notifyList.length) { return; }
        ctx.emit(type, { channel }, [notifyList]);
    };

    var getKeys = function (ctx, isAdmin, data, _cb) {
        var cb = Util.mkAsync(_cb);
        if (isAdmin && !ctx.adminRdyEvt) { return void cb('EFORBIDDEN'); }
        require(['/api/config?' + (+new Date())], function (NewConfig) {
            ctx.moderatorKeys = NewConfig.moderatorKeys; // Update moderator keys
            ctx.adminKeys = NewConfig.adminKeys; // Update moderator keys

            var supportKey = NewConfig.supportMailboxKey;
            if (!supportKey) { return void cb('E_NOT_INIT'); }

            // If admin, check key
            if (isAdmin && Util.find(ctx.store.proxy, [
                'mailboxes', 'supportteam', 'keys', 'curvePublic']) !== supportKey) {
                return void cb('EFORBIDDEN');
            }

            if (isAdmin) {
                return ctx.adminRdyEvt.reg(() => {
                    cb(null, {
                        supportKey: supportKey,
                        myCurve: data.adminCurvePrivate || Util.find(ctx.store.proxy, [
                                    'mailboxes', 'supportteam', 'keys', 'curvePrivate']),
                        theirPublic: data.curvePublic,
                        notifKey: data.curvePublic
                    });
                });
            }

            cb(null, {
                supportKey: supportKey,
                myCurve: ctx.store.proxy.curvePrivate,
                theirPublic: data.curvePublic || supportKey, // old tickets may use deprecated key
                notifKey: supportKey
            });
        });
    };

    // Get the content of a ticket mailbox and close it
    var getContent = function (ctx, data, isAdmin, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));
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
        }).nThen(() => {
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
            cb = Util.both(close, cb);
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

    var makeTicket = function (ctx, data, isAdmin, cb) {
        var mailbox = Util.find(ctx, [ 'store', 'mailbox' ]);
        var anonRpc = Util.find(ctx, [ 'store', 'anon_rpc' ]);
        if (!mailbox) { return void cb({error: 'E_NOT_READY'}); }
        if (!anonRpc) { return void cb({error: "anonymous rpc session not ready"}); }

        var channel = data.channel;
        var title = data.title;
        var ticket = data.ticket;
        var supportKey, theirPublic, myCurve;
        var time = +new Date();
        nThen((waitFor) => {
            // Send ticket to the admins and call back
            getKeys(ctx, isAdmin, data, waitFor((err, obj) => {
                if (err) {
                    waitFor.abort();
                    return void cb({error: err});
                }
                supportKey = obj.supportKey;
                theirPublic = obj.theirPublic;
                myCurve = obj.myCurve;
                // No need for notifKey here: users can only create tickets for the
                // currently used key
            }));
        }).nThen((waitFor) => {
            // Create ticket mailbox
            var keys = Crypto.Curve.deriveKeys(theirPublic, myCurve);
            var crypto = Crypto.Curve.createEncryptor(keys);
            var text = JSON.stringify(ticket);
            var ciphertext = crypto.encrypt(text);
            anonRpc.send("WRITE_PRIVATE_MESSAGE", [
                channel,
                ciphertext
            ], waitFor((err, res) => {
                if (err) {
                    waitFor.abort();
                    return void cb({error: err});
                }
                time = res && res[0];
            }));
        }).nThen((waitFor) => {
            if (!isAdmin) { return; }
            // ADMIN: Store in chainpad
            var doc = ctx.adminDoc.proxy;
            var active = doc.tickets.active;
            if (active[channel]) {
                waitFor.abort();
                return void cb({error: 'EEXISTS'});
            }
            active[channel] = {
                title: ticket.title,
                restored: ticket.legacy,
                premium: false,
                time: time,
                author: data.name,
                supportKey: supportKey, // Store current support key
                lastAdmin: true,
                authorKey: data.curvePublic,
                notifications: data.notifications // Ticket created as admin, add user chan
            };
        }).nThen((waitFor) => {
            if (isAdmin) { return; }
            // USER: Store in my worker
            ctx.supportData[channel] = {
                time: +new Date(),
                title: title,
                curvePublic: supportKey // Old tickets still use previous keys
            };
            ctx.Store.onSync(null, waitFor());
        }).nThen(() => {
            var notifChannel = isAdmin ? data.notifications
                                    : Hash.getChannelIdFromKey(supportKey);
            // First message to deal with the new ticket (store it in the list)
            mailbox.sendTo('NEW_TICKET', {
                title: title,
                channel: channel,
                time,
                isAdmin,
                supportKey: supportKey, // Store current support key
                premium: isAdmin ? '' : Util.find(ctx, ['store', 'account', 'plan']),
                user: Util.find(data.ticket, ['sender', 'curvePublic']) ? undefined : {
                    supportTeam: true
                }
            }, {
                channel: notifChannel,
                curvePublic: theirPublic
            }, (obj) => {
                console.error(obj);
                // Don't store the ticket in case of error
                if (obj && obj.error) { delete ctx.supportData[channel]; }
                cb(obj);
            });
            // Second message is only a notification to warn the user/admins
            mailbox.sendTo('NOTIF_TICKET', {
                title: title,
                channel: channel,
                time,
                isAdmin,
                isNewTicket: true,
                user: Util.find(data.ticket, ['sender', 'curvePublic']) ? undefined : {
                    supportTeam: true
                }
            }, {
                channel: notifChannel,
                curvePublic: theirPublic
            }, () => {});
        });
    };

    var replyTicket = function (ctx, data, isAdmin, cb) {
        var mailbox = Util.find(ctx, [ 'store', 'mailbox' ]);
        var anonRpc = Util.find(ctx, [ 'store', 'anon_rpc' ]);
        if (!mailbox) { return void cb('E_NOT_READY'); }
        if (!anonRpc) { return void cb("anonymous rpc session not ready"); }
        var theirPublic, myCurve, notifKey;
        var time;
        nThen((waitFor) => {
            // Get correct keys
            getKeys(ctx, isAdmin, data, waitFor((err, obj) => {
                if (err) {
                    waitFor.abort();
                    return void cb(err);
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
            ], waitFor((err, res) => {
                if (err) {
                    waitFor.abort();
                    return void cb(err);
                }
                time = res && res[0];
                cb(void 0, time);
            }));
        }).nThen(() => {
            // On success, notify
            var notifChannel = isAdmin ? data.notifChannel : Hash.getChannelIdFromKey(notifKey);
            if (!notifChannel) { return; }
            mailbox.sendTo('NOTIF_TICKET', {
                isAdmin: isAdmin,
                title: data.ticket.title,
                isClose: data.ticket.close,
                channel: data.channel,
                time: time,
                user: Util.find(data.ticket, ['sender', 'curvePublic']) ? undefined : {
                    supportTeam: true
                }
            }, {
                channel: notifChannel,
                curvePublic: notifKey
            }, () => {
                // Do nothing, not a problem if notifications fail
            });
        });
    };

    // INITIALIZE ADMIN

    var getPinList = function (ctx) {
        if (!ctx.adminDoc || !ctx.supportRpc) { return; }
        let adminChan = ctx.adminDoc.metadata && ctx.adminDoc.metadata.channel;
        let doc = ctx.adminDoc.proxy;
        let t = doc.tickets;
        let list = [
            adminChan,
            ...Object.keys(t.active),
            ...Object.keys(t.pending),
            ...Object.keys(t.closed)
        ];
        return Util.deduplicateString(list).sort();
    };
    var initAdminRpc = function (ctx, _cb) {
        let cb = Util.mkAsync(_cb);
        let proxy = ctx.store.proxy;
        let curvePrivate = Util.find(proxy, ['mailboxes', 'supportteam', 'keys', 'curvePrivate']);
        if (!curvePrivate) { return void cb('EFORBIDDEN'); }
        let edPrivate, edPublic;
        try {
            let pair = Nacl.sign.keyPair.fromSeed(Nacl.util.decodeBase64(curvePrivate));
            edPrivate = Nacl.util.encodeBase64(pair.secretKey);
            edPublic = Nacl.util.encodeBase64(pair.publicKey);
        } catch (e) {
            return void cb(e);
        }
        Pinpad.create(ctx.store.network, {
            edPublic: edPublic,
            edPrivate: edPrivate
        }, (e, call) => {
            if (e) { return void cb(e); }
            console.log("Support RPC ready, public key is ", edPublic);
            ctx.supportRpc = call;
            cb();
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
            metadata: {
                validateKey: secret.keys.validateKey || undefined,
            },
        };
        var rt = ctx.adminDoc = Listmap.create(listmapConfig);
        rt.proxy.on('ready', function () {
            var doc = rt.proxy;
            doc.tickets = doc.tickets || {};
            doc.tickets.active = doc.tickets.active || {};
            doc.tickets.closed = doc.tickets.closed || {};
            doc.tickets.pending = doc.tickets.pending || {};
            ctx.adminRdyEvt.fire();
            cb();

            if (!ctx.supportRpc) { return; }
            // Check pin list
            let list = getPinList(ctx);
            let local = Hash.hashChannelList(list);
            ctx.supportRpc.getServerHash(function (e, hash) {
                if (e) { return void console.warn(e); }
                if (hash !== local) {
                    ctx.supportRpc.reset(list, function (e) {
                        if (e) { console.warn(e); }
                    });
                }
            });
        });
        rt.proxy.on('change', ['recorded'], function () {
            notifyClient(ctx, true, 'RECORDED_CHANGE', '');
        });
        rt.proxy.on('remove', ['recorded'], function () {
            notifyClient(ctx, true, 'RECORDED_CHANGE', '');
        });
    };


    var initializeSupportAdmin = function (ctx, isReset, waitFor) {
        let unlock = waitFor();
        let proxy = ctx.store.proxy;
        let supportKey = Util.find(proxy, ['mailboxes', 'supportteam', 'keys', 'curvePublic']);
        let privateKey = Util.find(proxy, ['mailboxes', 'supportteam', 'keys', 'curvePrivate']);
        if (!isReset) { ctx.adminRdyEvt = Util.mkEvent(true); }
        nThen((waitFor) => {
            getKeys(ctx, false, {}, waitFor((err, obj) => {
                setTimeout(unlock); // Unlock loading process
                if (err) { return void waitFor.abort(); }
                if (obj.theirPublic !== supportKey) {
                    try {
                        delete proxy.mailboxes.supportteam;
                        ctx.store.mailbox.close('supportteam');
                    } catch (e) {}
                    delete ctx.adminRdyEvt;
                    return void waitFor.abort();
                }
            }));
        }).nThen((waitFor) => {
            initAdminRpc(ctx, waitFor((err) => {
                if (err) { console.error('Support RPC not ready', err); }
            }));
        }).nThen((waitFor) => {
            let seed = privateKey.slice(0,24); // also in admin/inner.js
            let hash = Hash.getEditHashFromKeys({
                version: 2,
                type: 'support',
                keys: {
                    editKeyStr: seed
                }
            });
            loadAdminDoc(ctx, hash, waitFor());
        }).nThen(() => {
            console.log('Support admin loaded');
        });

    };

    // USER COMMANDS

    var getMyTickets = function (ctx, data, cId, cb) {
        var all = [];
        var n = nThen;
        if (!ctx.clients[cId]) {
            ctx.clients[cId] = {
                admin: false
            };
        }
        Object.keys(ctx.supportData).forEach(function (ticket) {
            n = n((waitFor) => {
                var t = Util.clone(ctx.supportData[ticket]);
                getContent(ctx, {
                    channel: ticket,
                    curvePublic: t.curvePublic
                }, false, waitFor((err, messages) => {
                    if (err) {
                        if (err.type === 'EDELETED') {
                            delete ctx.supportData[ticket];
                            return;
                        }
                        t.error = err;
                    } else {
                        t.messages = messages;
                        if (messages.length && messages[messages.length -1].close) {
                            ctx.supportData[ticket].closed = true;
                            t.closed = true;
                        }
                    }

                    t.id = ticket;
                    all.push(t);
                }));
            }).nThen;
        });


        n(() => {
            all.sort((t1, t2) => {
                if (t1.closed && t2.closed) { return t1.time - t2.time; }
                if (t1.closed) { return 1; }
                if (t2.closed) { return -1; }
                return t1.time - t2.time;
            });
            cb({tickets: all});
        });
    };
    var makeMyTicket = function (ctx, data, cId, cb) {
        makeTicket(ctx, data, false, cb);
    };
    var replyMyTicket = function (ctx, data, cId, cb) {
        replyTicket(ctx, data, false, (err) => {
            if (err) { return void cb({error: err}); }
            cb({sent: true});
        });
    };
    var closeMyTicket = function (ctx, data, cId, cb) {
        replyTicket(ctx, data, false, (err) => {
            if (err) { return void cb({error: err}); }
            cb({closed: true});
        });
    };
    var deleteMyTicket = function (ctx, data, cId, cb) {
        let support = ctx.supportData;
        let channel = data.channel;
        if (!support[channel] || !support[channel].closed) { return void cb({error: 'ENOTCLOSED'}); }
        delete support[channel];
        cb({deleted: true});
    };

    // MODERATOR COMMANDS

    var listTicketsAdmin = function (ctx, data, cId, cb) {
        if (!ctx.adminRdyEvt) { return void cb({ error: 'EFORBIDDEN' }); }
        if (!ctx.clients[cId]) {
            ctx.clients[cId] = {
                admin: true
            };
        }
        ctx.adminRdyEvt.reg(() => {
            var doc = ctx.adminDoc.proxy;
            if (data.type === 'pending') { return cb(Util.clone(doc.tickets.pending)); }
            if (data.type === 'closed') { return cb(Util.clone(doc.tickets.closed)); }
            cb(Util.clone(doc.tickets.active));
        });
    };

    var loadTicketAdmin = function (ctx, data, cId, cb) {
        let supportKey = data.supportKey;
        ctx.adminRdyEvt.reg(() => {
            let doc = ctx.adminDoc.proxy;
            // If this ticket was created with an older support key, use the old one
            if (doc.oldKeys && doc.oldKeys[supportKey]) {
                data.adminCurvePrivate = doc.oldKeys[supportKey].curvePrivate;
            }

            getContent(ctx, data, true, function (err, res) {
                if (err) { return void cb({error: err}); }
                var doc = ctx.adminDoc.proxy;
                if (!Array.isArray(res) || !res.length) { return void cb(res); }

                // Sort messages by server time
                res.sort((t1, t2) => { return t1.time - t2.time; });
                let last = res[res.length - 1];
                let premium = res.some((msg) => {
                    let curve = Util.find(msg, ['sender', 'curvePublic']);
                    if (data.curvePublic !== curve) { return; }
                    return Util.find(msg, ['sender', 'quota', 'plan']);
                });

                // Update ChainPad with latest ticket data
                var entry = doc.tickets.active[data.channel];
                if (entry) {
                    if (last.legacy) {
                        let lastMsg = Array.isArray(last.messages)
                                    && last.messages[last.messages.length - 1];
                        last = lastMsg;
                    }
                    entry.time = last.time;
                    entry.premium = premium;
                    if (last.sender) {
                        entry.lastAdmin = !last.sender.blockLocation;
                    }
                    /*
                    let senderKey = last.sender && last.sender.edPublic;
                    if (senderKey) {
                        entry.lastAdmin = ctx.moderatorKeys.indexOf(senderKey) !== -1;
                    }
                    */
                }
                cb(res);
            });
        });
    };

    var makeTicketAdmin = function (ctx, data, cId, cb) {
        if (!ctx.adminRdyEvt) { return void cb({ error: 'EFORBIDDEN' }); }
        ctx.adminRdyEvt.reg(() => {
            makeTicket(ctx, data, true, cb);
        });
    };

    var replyTicketAdmin = function (ctx, data, cId, cb) {
        if (!ctx.adminRdyEvt) { return void cb({ error: 'EFORBIDDEN' }); }
        let supportKey = data.supportKey;
        ctx.adminRdyEvt.reg(() => {
            let doc = ctx.adminDoc.proxy;
            // If this ticket was created with an older support key, use the old one
            if (doc.oldKeys && doc.oldKeys[supportKey]) {
                data.adminCurvePrivate = doc.oldKeys[supportKey].curvePrivate;
            }
            replyTicket(ctx, data, true, (err, time) => {
                if (err) { return void cb({error: err}); }
                var doc = ctx.adminDoc.proxy;
                var entry = doc.tickets.active[data.channel] || doc.tickets.pending[data.channel];
                entry.time = time;
                entry.lastAdmin = true;
                cb({sent: true});
            });
        });
    };

    var closeTicketAdmin = function (ctx, data, cId, cb) {
        if (!ctx.adminRdyEvt) { return void cb({ error: 'EFORBIDDEN' }); }
        // Reply with `data.ticket.close = true`
        let supportKey = data.supportKey;
        ctx.adminRdyEvt.reg(() => {
            let doc = ctx.adminDoc.proxy;
            // If this ticket was created with an older support key, use the old one
            if (doc.oldKeys && doc.oldKeys[supportKey]) {
                data.adminCurvePrivate = doc.oldKeys[supportKey].curvePrivate;
            }
            replyTicket(ctx, data, true, (err) => {
                if (err) { return void cb({error: err}); }
                var doc = ctx.adminDoc.proxy;
                var entry = doc.tickets.active[data.channel] || doc.tickets.pending[data.channel];
                entry.time = +new Date();
                entry.lastAdmin = true;
                doc.tickets.closed[data.channel] = entry;
                delete doc.tickets.active[data.channel];
                delete doc.tickets.pending[data.channel];
                cb({closed: true});
            });
        });
    };

    var moveTicketAdmin = function (ctx, data, cId, cb) {
        if (!ctx.adminRdyEvt) { return void cb({ error: 'EFORBIDDEN' }); }
        let ticketId = data.channel;
        let from = data.from;
        let to = data.to;
        ctx.adminRdyEvt.reg(() => {
            let doc = ctx.adminDoc.proxy;
            let fromDoc = doc.tickets[from];
            let toDoc = doc.tickets[to];
            if (!from || !to) { return void cb({ error: 'EINVAL' }); }
            let ticket = fromDoc[ticketId];
            if (!ticket || toDoc[ticketId]) { return void cb({ error: 'CANT_MOVE' }); }
            toDoc[ticketId] = ticket;
            delete fromDoc[ticketId];
            Realtime.whenRealtimeSyncs(ctx.adminDoc.realtime, function () {
                cb({ moved: true });
            });
        });
    };

    var getRecorded = function (ctx, data, cId, cb) {
        if (!ctx.adminRdyEvt) { return void cb({ error: 'EFORBIDDEN' }); }
        ctx.adminRdyEvt.reg(() => {
            let doc = ctx.adminDoc.proxy;
            let recorded = doc.recorded = doc.recorded || {};
            cb({messages: Util.clone(recorded)});
        });
    };
    var setRecorded = function (ctx, data, cId, cb) {
        if (!ctx.adminRdyEvt) { return void cb({ error: 'EFORBIDDEN' }); }
        let id = data.id;
        let content = data.content;
        let remove = Boolean(data.remove);
        ctx.adminRdyEvt.reg(() => {
            let doc = ctx.adminDoc.proxy;
            let recorded = doc.recorded = doc.recorded || {};
            if (remove) {
                delete recorded[id];
            } else {
                recorded[id] = {
                    content,
                    count: 0
                };
            }
            Realtime.whenRealtimeSyncs(ctx.adminDoc.realtime, function () {
                cb({done:true});
            });
        });
    };
    var useRecorded = function (ctx, data, cId, cb) {
        if (!ctx.adminRdyEvt) { return void cb({ error: 'EFORBIDDEN' }); }
        let id = data.id;
        ctx.adminRdyEvt.reg(() => {
            let doc = ctx.adminDoc.proxy;
            let recorded = doc.recorded = doc.recorded || {};
            let entry = recorded[id];
            if (entry) {
                entry.count = (entry.count || 0) + 1;
            }
            cb();
        });
    };

    var searchAdmin = (ctx, data, cId, cb) => {
        if (!ctx.adminRdyEvt) { return void cb({ error: 'EFORBIDDEN' }); }
        let tags = data.tags || [];
        let text = (data.text || '').toLowerCase();
        ctx.adminRdyEvt.reg(() => {
            let doc = ctx.adminDoc.proxy;
            let t = doc.tickets;

            let all = {};
            let add = (id, data, category) => {
                let clone = Util.clone(data);
                clone.category = category;
                all[id] = clone;
            };
            ['active', 'pending', 'closed'].some(cat => {
                let tickets = t[cat];
                return Object.keys(tickets).some(id => {
                    let ticket = tickets[id];
                    // Check if this ticket uses at least one selected tag
                    let hasTag = !tags.length || (ticket.tags || []).some(tag => {
                        return tags.includes(tag);
                    });
                    if (!hasTag) { return; }
                    // Filter by searched text within these tags
                    let id64 = Util.hexToBase64(id).slice(0,10);
                    if (text === id64) { // If ticket ID found, stop search and return result
                        all = {};
                        add(id, ticket, cat);
                        return true;
                    }
                    let hasText = !text || ticket.title.toLowerCase().includes(text);
                    if (!hasText) { return; }
                    add(id, ticket, cat);
                });
            });
            cb({ tickets: all });
        });
    };
    var setTagsAdmin = (ctx, data, cId, cb) => {
        if (!ctx.adminRdyEvt) { return void cb({ error: 'EFORBIDDEN' }); }
        ctx.adminRdyEvt.reg(() => {
            let doc = ctx.adminDoc.proxy;
            let t = doc.tickets;
            let chan = data.channel;

            let ticket = t.active[chan] || t.pending[chan] || t.closed[chan];
            ticket.tags = data.tags || [];
            Realtime.whenRealtimeSyncs(ctx.adminDoc.realtime, function () {
                let allTags = [];
                ['active', 'pending', 'closed'].forEach(cat => {
                    let tickets = t[cat];
                    Object.keys(tickets).forEach(id => {
                        let ticket = tickets[id];
                        (ticket.tags || []).forEach(tag => {
                            if (!allTags.includes(tag)) { allTags.push(tag); }
                        });
                    });
                });
                cb({done:true, allTags});
            });
        });
    };
    var filterTagsAdmin = (ctx, data, cId, cb) => {
        if (!ctx.adminRdyEvt) { return void cb({ error: 'EFORBIDDEN' }); }
        let tags = data.tags || [];
        ctx.adminRdyEvt.reg(() => {
            let doc = ctx.adminDoc.proxy;
            let t = doc.tickets;

            if (!tags.length) { return void cb({ all: true }); }
            let all = [];
            ['active', 'pending', 'closed'].forEach(cat => {
                let tickets = t[cat];
                Object.keys(tickets).forEach(id => {
                    let ticket = tickets[id];
                    // Check if this ticket uses at least one selected tag
                    let hasTag = (ticket.tags || []).some(tag => {
                        return tags.includes(tag);
                    });
                    if (!hasTag) { all.push(id); }
                });
            });
            cb({ tickets: all });
        });
    };

    var clearLegacy = function (ctx, data, cId, cb) {
        let proxy = ctx.store.proxy;
        ctx.store.mailbox.close('supportadmin', function () {
            delete proxy.mailboxes.supportadmin;
            ctx.Store.onSync(null, function () {
                cb({done: true});
            });
        });
    };

    var dumpLegacy = function (ctx, data, cId, cb) {
        let proxy = ctx.store.proxy;
        let _legacy = Util.find(proxy, ['mailboxes', 'supportadmin']);
        if (!_legacy) { return void cb({error: 'ENOENT'}); }
        let legacy = Util.clone(_legacy);
        legacy.lastKnownHash = undefined;
        legacy.viewed = [];
        ctx.store.mailbox.open('supportadmin', legacy, function (contentByHash) {
            ctx.store.mailbox.close('supportadmin', function () {});
            cb(contentByHash);
        }, true, { // Opts
            dump: true
        });
    };
    let findLegacy = (ctx, author, title) => {
        let doc = ctx.adminDoc.proxy;
        return ['active', 'pending', 'closed'].some(k => {
            let all = doc.tickets[k];
            return Object.keys(all).some(id => {
                let ticket = all[id];
                return ticket.authorKey === author && ticket.title === title && ticket.restored;
            });
        });
    };
    var getLegacy = function (ctx, data, cId, cb) {
        let proxy = ctx.store.proxy;
        let legacy = Util.find(proxy, ['mailboxes', 'supportadmin']);
        if (!legacy) { return void cb({error: 'ENOENT'}); }
        ctx.store.mailbox.open('supportadmin', legacy, function (contentByHash) {
            ctx.store.mailbox.close('supportadmin', function () {});
            let c = Util.clone(contentByHash || {});
            let toFilter = [];
            Object.keys(c).forEach(h => {
                let msg = c[h];
                if (msg.type === 'CLOSE') {
                    if (!toFilter.includes(msg.content.id)) {
                        toFilter.push(msg.content.id);
                    }
                    return;
                }
                let author = msg.author;
                let title = msg.content && msg.content.title;
                if (findLegacy(ctx, author, title)) {
                    if (!toFilter.includes(msg.content.id)) {
                        toFilter.push(msg.content.id);
                    }
                }
            });
            Object.keys(c).forEach(h => {
                let msg = c[h];
                if (msg.content && toFilter.includes(msg.content.id)) {
                    delete c[h];
                }
            });
            cb(c);
        }, true, { // Opts
            dump: true
        });
    };
    var restoreLegacy = function (ctx, data, cId, cb) {
        let proxy = ctx.store.proxy;
        let legacy = Util.find(proxy, ['mailboxes', 'supportadmin']);
        if (!legacy) { return void cb({error: 'ENOENT'}); }
        if (!ctx.adminRdyEvt) { return void cb({ error: 'EFORBIDDEN' }); }
        let messages = data.messages;
        let hashes = data.hashes;
        let first = messages[0];
        let last = messages[messages.length - 1];
        if (!first) { return void cb({error: 'EINVAL'}); }
        ctx.adminRdyEvt.reg(() => {
            let ticketData = {
                name: Util.find(first, ['sender', 'name']),
                notifications: Util.find(first, ['sender', 'notifications']),
                curvePublic: Util.find(first, ['sender', 'curvePublic']),
                channel: Hash.createChannelId(),
                title: first.title,
                time: last.time,
                ticket: {
                    legacy: true,
                    title: first.title,
                    sender: first.sender,
                    messages: messages
                }
            };
            makeTicket(ctx, ticketData, true, obj => {
                if (obj && obj.error) { return void cb(obj); }
                hashes.forEach(hash => {
                    legacy.viewed.push(hash);
                });
                ctx.Store.onSync(null, function () {
                    cb({done: true});
                });
            });
        });
    };

    // Mailbox events

    var addAdminTicket = function (ctx, data, cb) {
        // Wait for the chainpad to be ready before adding the data
        if (!ctx.adminRdyEvt) { return void cb(true); }

        ctx.adminRdyEvt.reg(() => {
            let supportKey;
            nThen((waitFor) => {
                // Send ticket to the admins and call back
                getKeys(ctx, true, data, waitFor((err, obj) => {
                    if (err) {
                        waitFor.abort();
                        return void cb(true);
                    }
                    supportKey = obj.supportKey;
                }));
            }).nThen(() => {
                // random timeout to avoid duplication wiht multiple admins
                var rdmTo = Math.floor(Math.random() * 2000); // Between 0 and 2000ms
                setTimeout(() => {
                    var doc = ctx.adminDoc.proxy;
                    if (doc.tickets.active[data.channel] || doc.tickets.closed[data.channel]
                        || doc.tickets.pending[data.channel]) {
                        return void cb(true); }
                    doc.tickets.active[data.channel] = {
                        title: data.title,
                        premium: data.premium,
                        time: data.time,
                        author: data.user && data.user.displayName,
                        supportKey: data.supportKey || supportKey, // Store current support key
                        authorKey: data.user && data.user.curvePublic
                    };
                    Realtime.whenRealtimeSyncs(ctx.adminDoc.realtime, function () {
                        // Call back only when synced. That way we can handle the mailbox message
                        // later in case of network issues.
                        cb(true);
                    });
                    notifyClient(ctx, true, 'NEW_TICKET', data.channel);
                    if (ctx.supportRpc) { ctx.supportRpc.pin([data.channel], () => {}); }
                }, rdmTo);
            });
        });
    };
    var updateAdminTicket = function (ctx, data) {
        // Wait for the chainpad to be ready before adding the data
        if (!ctx.adminRdyEvt) { return; }

        ctx.adminRdyEvt.reg(() => {
            // random timeout to avoid duplication wiht multiple admins
            var rdmTo = Math.floor(Math.random() * 2000); // Between 0 and 2000ms
            setTimeout(() => {
                var doc = ctx.adminDoc.proxy;
                let t = doc.tickets.active[data.channel] || doc.tickets.pending[data.channel];
                if (!t) { return; }
                if (data.time <= t.time) { return; }
                if (data.isClose) {
                    doc.tickets.closed[data.channel] = t;
                    delete doc.tickets.active[data.channel];
                    delete doc.tickets.pending[data.channel];
                }

                t.time = data.time;
                t.lastAdmin = false;
                notifyClient(ctx, true, 'UPDATE_TICKET', data.channel);
            }, rdmTo);
        });
    };
    var checkAdminTicket = function (ctx, data, cb) {
        if (!ctx.adminRdyEvt) { return void cb(true); }

        ctx.adminRdyEvt.reg(() => {
            let doc = ctx.adminDoc.proxy;
            let exists = doc.tickets.active[data.channel] || doc.tickets.pending[data.channel];
            cb(exists);
        });
    };

    var addUserTicket = function (ctx, data, cb) {
        if (!ctx.supportData) { return void cb(true); }
        let channel = data.channel;
        ctx.supportData[channel] = {
            time: data.time,
            title: data.title,
            curvePublic: data.supportKey // Old tickets still use previous keys
        };
        ctx.Store.onSync(null, function () {
            cb(true);
        });
    };
    var updateUserTicket = function (ctx, data) {
        notifyClient(ctx, false, 'UPDATE_TICKET', data.channel);
        if (data.isClose) {
            let ticket = ctx.supportData[data.channel];
            if (!ticket) { return; }
            ticket.closed = true;
        }
    };

    var updateAdminKey = (ctx, data, cb) => {
        let newKey = data.supportKey;
        let newKeyPub = Hash.getBoxPublicFromSecret(newKey);

        let proxy = ctx.store.proxy;
        const oldKey = Util.find(proxy, ['mailboxes', 'supportteam', 'keys', 'curvePrivate']);
        const oldKeyPub = Util.find(proxy, ['mailboxes', 'supportteam', 'keys', 'curvePublic']);

        getKeys(ctx, false, {}, (err, obj) => {
            if (err) { return void cb(true); }
            // already deprecated? abort
            if (newKeyPub !== obj.theirPublic) { return void cb(true); }
            // already known? abort
            if (oldKey === newKey || oldKeyPub === newKeyPub) { return void cb(true); }

            // Close old data
            let mailbox = Util.find(ctx, [ 'store', 'mailbox' ]);
            try {
                if (ctx.adminDoc) { ctx.adminDoc.stop(); }
                if (mailbox) { mailbox.close('supportteam'); }
                if (ctx.supportRpc) { ctx.supportRpc.destroy(); }
                ctx.adminRdyEvt = Util.mkEvent(true);
            } catch (e) { console.error(e); }

            // Store new key
            ctx.Store.addAdminMailbox(null, {
                version: 2,
                priv: newKey
            }, (obj) => {
                if (obj && obj.error) { return void cb(true); }
                // Reload moderator data
                nThen((waitFor) => {
                    initializeSupportAdmin(ctx, true, waitFor);
                    ctx.adminRdyEvt.reg(() => {
                        notifyClient(ctx, true, 'UPDATE_RIGHTS');
                        cb(false);
                    });
                });
            });
        });
    };


    // ADMIN COMMANDS

    let updateServerKey = (ctx, curvePublic, curvePrivate, cb) => {
        let edPublic;
        try {
            let pair = Nacl.sign.keyPair.fromSeed(Nacl.util.decodeBase64(curvePrivate));
            edPublic = Nacl.util.encodeBase64(pair.publicKey);
        } catch (e) {
            return void cb(e);
        }
        ctx.Store.adminRpc(null, {
            cmd: 'ADMIN_DECREE',
            data: ['SET_SUPPORT_KEYS', [curvePublic, edPublic]]
        }, cb);
    };
    let getModerators = (ctx, data, cId, cb) => {
        ctx.Store.adminRpc(null, {
            cmd: 'GET_MODERATORS',
            data: {}
        }, cb);
    };
    let rotateKeys = function (ctx, data, cId, _cb) {
        let cb = Util.once(Util.mkAsync(_cb));
        let oldSupportKey;
        let proxy = ctx.store.proxy;
        let edPublic = proxy.edPublic;

        const keyPair = Nacl.box.keyPair();
        const newKeyPub = Nacl.util.encodeBase64(keyPair.publicKey);
        const newKey = Nacl.util.encodeBase64(keyPair.secretKey);

        const oldKey = Util.find(proxy, ['mailboxes', 'supportteam', 'keys', 'curvePrivate']);
        const oldKeyPub = Util.find(proxy, ['mailboxes', 'supportteam', 'keys', 'curvePublic']);

        if (!newKey || !newKeyPub) { return void cb({ error: 'INVALID_KEY' }); }
        let oldAdminChan;
        nThen((waitFor) => {
            // Check if support was already enabled
            getKeys(ctx, false, {}, waitFor((err, obj) => {
                if (err === 'E_NOT_INIT') { return; } // We're going to set up a support key
                if (err) {
                    cb({error: err});
                    return void waitFor.abort();
                }
                oldSupportKey = obj.theirPublic;
            }));
        }).nThen((waitFor) => {
            // Only admins can rotate the keys
            if (!ctx.adminKeys.includes(edPublic)) {
                waitFor.abort();
                return void cb({error: 'EFORBIDDEN'});
            }
        }).nThen((waitFor) => {
            // If support is enabled, only current moderators can rotate keys.
            // Other admins can only delete the support
            if (!oldSupportKey) { return; } // support disabled
            if (!ctx.moderatorKeys.includes(edPublic)) {
                waitFor.abort();
                return void cb({error: 'EINVAL'});
            }
            if (oldKeyPub !== oldSupportKey) {
                waitFor.abort();
                return void cb({error: 'EFORBIDDEN'});
            }
        }).nThen((waitFor) => {
            // If support was enabled, migrate old chainpad
            if (!oldSupportKey) { return; } // No old doc to copy
            ctx.adminRdyEvt.reg(() => {
                let oldDoc = ctx.adminDoc.proxy;
                oldAdminChan = ctx.adminDoc.metadata && ctx.adminDoc.metadata.channel;

                let seed = newKey.slice(0,24);
                let hash = Hash.getEditHashFromKeys({
                    version: 2,
                    type: 'support',
                    keys: {
                        editKeyStr: seed
                    }
                });
                let cfg = {
                    network: ctx.store.network,
                    initialState: '{}'
                };
                var oldKeys = oldDoc.oldKeys = oldDoc.oldKeys || {};
                oldKeys[oldKeyPub] = {
                    curvePrivate: oldKey,
                    rotatedOn: +new Date(),
                    rotatedBy: edPublic
                };
                Crypt.put(hash, JSON.stringify(oldDoc), waitFor((err) => {
                    if (err) {
                        waitFor.abort();
                        return void cb({error: err});
                    }
                }), cfg);
            });
        }).nThen((waitFor) => {
            // Send new key to server
            updateServerKey(ctx, newKeyPub, newKey, waitFor((obj) => {
                if (obj && obj.error) {
                    waitFor.abort();
                    return void cb(obj);
                }
            }));
        }).nThen(() => {
            // From now on, each error may cause issue because
            // the server has already stored the new key

            // Disconnect old doc and mailbox
            if (!oldSupportKey) { return; } // support disabled

            if (ctx.adminDoc) { ctx.adminDoc.stop(); }

            let mailbox = Util.find(ctx, [ 'store', 'mailbox' ]);
            if (mailbox) { mailbox.close('supportteam'); }

            if (ctx.supportRpc) { ctx.supportRpc.destroy(); }

            ctx.adminRdyEvt = Util.mkEvent(true);
        }).nThen((waitFor) => {
            // Add key to my proxy
            ctx.Store.addAdminMailbox(null, {
                version: 2,
                priv: newKey
            }, waitFor((obj) => {
                if (obj && obj.error) { // Should never happen with the previous checks
                    waitFor.abort();
                    if (oldSupportKey) {
                        // If we weren't able to store the new key, abort and restore old keys
                        return updateServerKey(ctx, oldKeyPub, oldKey, () => {
                            return void cb(obj);
                        });
                    }
                    return void cb(obj);
                }
            }));
        }).nThen((waitFor) => {
            // Notify other moderators
            if (!oldSupportKey) { return; }
            let mailbox = Util.find(ctx, [ 'store', 'mailbox' ]);
            getModerators(ctx, null, null, waitFor((obj) => {
                if (obj && obj.error) {
                    return void cb({
                        success: true,
                        noNotify: true
                    });
                }
                let all = obj && obj[0];
                Object.keys(all || {}).forEach((modEdPub) => {
                    let modData = all[modEdPub];
                    mailbox.sendTo('MODERATOR_NEW_KEY', {
                        supportKey: newKey
                    }, {
                        channel: modData.mailbox,
                        curvePublic: modData.curvePublic
                    }, () => {});
                });
            }));
        }).nThen((waitFor) => {
            // Initialize new chainpad
            initializeSupportAdmin(ctx, true, waitFor);
        }).nThen((waitFor) => {
            // Clean old data
            if (!oldAdminChan) { return; }
            ctx.Store.adminRpc(null, {
                cmd: 'ARCHIVE_DOCUMENT',
                data: {
                    id: oldAdminChan,
                    reason: 'Deprecated support pad'
                }
            }, waitFor());
        }).nThen(() => {
            // Call back
            cb({success: true});
        });
    };
    let disableSupport = function (ctx, data, cId, _cb) {
        let cb = Util.once(Util.mkAsync(_cb));
        let proxy = ctx.store.proxy;
        let edPublic = proxy.edPublic;

        let moderators;
        nThen((waitFor) => {
            // Check if support is enabled
            // and update ctx.adminKeys
            getKeys(ctx, false, {}, waitFor((err) => {
                if (err) {
                    cb({error: err});
                    return void waitFor.abort();
                }
            }));
        }).nThen((waitFor) => {
            // Only admins can disable support
            if (!ctx.adminKeys.includes(edPublic)) {
                waitFor.abort();
                return void cb({error: 'EFORBIDDEN'});
            }
        }).nThen((waitFor) => {
            // Archive ChainPad and all the tickets (from pin log)
            ctx.Store.adminRpc(null, {
                cmd: 'ARCHIVE_SUPPORT',
                data: {}
            }, waitFor((obj) => {
                if (obj && obj.error) {
                    waitFor.abort();
                    return void cb(obj);
                }
            }));
        }).nThen((waitFor) => {
            ctx.Store.adminRpc(null, {
                cmd: 'ADMIN_DECREE',
                data: ['SET_SUPPORT_KEYS', ['', '']]
            }, waitFor(function (obj) {
                if (obj && obj.error) {
                    waitFor.abort();
                    return void cb(obj);
                }
            }));
        }).nThen((waitFor) => {
            getModerators(ctx, null, null, waitFor((obj) => {
                if (!obj || obj.error) {
                    waitFor.abort();
                    return void cb();
                }
                moderators = obj[0] || {};
            }));
        }).nThen(() => {
            let n = nThen;
            Object.keys(moderators).forEach((ed) => {
                n = n((waitFor) => {
                    ctx.Store.adminRpc(null, {
                        cmd: 'REMOVE_MODERATOR',
                        data: ed
                    }, waitFor(obj => {
                        if (obj && obj.error) {
                            console.error('Error removing moderator data', ed, obj.error);
                        }
                    }));
                }).nThen;
            });
            n(() => {
                cb();
            });
        });
    };

    var getAdminKey = function (ctx, data, cId, cb) {
        let proxy = ctx.store.proxy;
        let supportKey = Util.find(proxy, ['mailboxes', 'supportteam', 'keys', 'curvePublic']);
        let privateKey = Util.find(proxy, ['mailboxes', 'supportteam', 'keys', 'curvePrivate']);
        getKeys(ctx, false, {}, (err, obj) => {
            if (err) { return void cb({error: err}); }
            if (supportKey && obj.theirPublic !== supportKey) {
                privateKey = undefined;
            }
            cb({
                curvePrivate: privateKey,
                curvePublic: obj.theirPublic
            });
        });
    };
    var addModerator = function (ctx, data, cId, cb) {
        let proxy = ctx.store.proxy;
        var mailbox = Util.find(ctx, [ 'store', 'mailbox' ]);

        let supportKey = Util.find(proxy, ['mailboxes', 'supportteam', 'keys', 'curvePublic']);
        let privateKey = Util.find(proxy, ['mailboxes', 'supportteam', 'keys', 'curvePrivate']);
        let lastKnownHash = Util.find(proxy, ['mailboxes', 'supportteam', 'lastKnownHash']);
        let edPublic = proxy.edPublic;

        // Confirm that I know the latest private key
        getKeys(ctx, false, {}, (err, obj) => {
            if (err) { return void cb({error: err}); }
            if (obj.theirPublic !== supportKey) { return void cb({ error: 'EFORBIDDEN' }); }
            if (!ctx.moderatorKeys.includes(edPublic)) { return void cb({ error: 'EFORBIDDEN' }); }
            // Send this private key to the selected user
            mailbox.sendTo('ADD_MODERATOR', {
                supportKey: privateKey,
                lastKnownHash
            }, {
                channel: data.mailbox,
                curvePublic: data.curvePublic
            }, () => {
                cb();
            });
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
            moderatorKeys: ApiConfig.moderatorKeys,
            adminKeys: ApiConfig.adminKeys,
            supportData: proxy,
            store: cfg.store,
            Store: cfg.Store,
            emit: emit,
            clients: {}
        };

        if (Util.find(store, ['proxy', 'mailboxes', 'supportteam'])) {
            initializeSupportAdmin(ctx, false, waitFor);
            window.CryptPad_SupportCtx = ctx;
        }

        support.ctx = ctx;
        support.removeClient = function (clientId) {
            delete ctx.clients[clientId];
        };
        support.leavePad = function () {};
        support.addAdminTicket = function (content, cb) {
            addAdminTicket(ctx, content, cb);
        };
        support.updateAdminTicket = function (content) {
            updateAdminTicket(ctx, content);
        };
        support.updateAdminKey = function (content, cb) {
            updateAdminKey(ctx, content, cb);
        };
        support.checkAdminTicket = function (content, cb) {
            checkAdminTicket(ctx, content, cb);
        };
        support.addUserTicket = function (content, cb) {
            addUserTicket(ctx, content, cb);
        };
        support.updateUserTicket = function (content) {
            updateUserTicket(ctx, content);
        };
        support.execCommand = function (clientId, obj, cb) {
            var cmd = obj.cmd;
            var data = obj.data;
            // User commands
            if (cmd === 'MAKE_TICKET') {
                return void makeMyTicket(ctx, data, clientId, cb);
            }
            if (cmd === 'GET_MY_TICKETS') {
                return void getMyTickets(ctx, data, clientId, cb);
            }
            if (cmd === 'REPLY_TICKET') {
                return void replyMyTicket(ctx, data, clientId, cb);
            }
            if (cmd === 'CLOSE_TICKET') {
                return void closeMyTicket(ctx, data, clientId, cb);
            }
            if (cmd === 'DELETE_TICKET') {
                return void deleteMyTicket(ctx, data, clientId, cb);
            }
            // Moderator commands
            if (cmd === 'MAKE_TICKET_ADMIN') {
                return void makeTicketAdmin(ctx, data, clientId, cb);
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
            if (cmd === 'CLOSE_TICKET_ADMIN') {
                return void closeTicketAdmin(ctx, data, clientId, cb);
            }
            if (cmd === 'MOVE_TICKET_ADMIN') {
                return void moveTicketAdmin(ctx, data, clientId, cb);
            }
            if (cmd === 'GET_RECORDED') {
                return void getRecorded(ctx, data, clientId, cb);
            }
            if (cmd === 'SET_RECORDED') {
                return void setRecorded(ctx, data, clientId, cb);
            }
            if (cmd === 'USE_RECORDED') {
                return void useRecorded(ctx, data, clientId, cb);
            }
            if (cmd === 'SEARCH_ADMIN') {
                return void searchAdmin(ctx, data, clientId, cb);
            }
            if (cmd === 'FILTER_TAGS_ADMIN') {
                return void filterTagsAdmin(ctx, data, clientId, cb);
            }
            if (cmd === 'SET_TAGS_ADMIN') {
                return void setTagsAdmin(ctx, data, clientId, cb);
            }
            if (cmd === 'GET_LEGACY') {
                return void getLegacy(ctx, data, clientId, cb);
            }
            if (cmd === 'DUMP_LEGACY') {
                return void dumpLegacy(ctx, data, clientId, cb);
            }
            if (cmd === 'CLEAR_LEGACY') {
                return void clearLegacy(ctx, data, clientId, cb);
            }
            if (cmd === 'RESTORE_LEGACY') {
                return void restoreLegacy(ctx, data, clientId, cb);
            }
            // Admin commands
            if (cmd === 'GET_PRIVATE_KEY') {
                return void getAdminKey(ctx, data, clientId, cb);
            }
            if (cmd === 'DISABLE_SUPPORT') {
                return void disableSupport(ctx, data, clientId, cb);
            }
            if (cmd === 'ROTATE_KEYS') {
                return void rotateKeys(ctx, data, clientId, cb);
            }
            if (cmd === 'ADD_MODERATOR') {
                return void addModerator(ctx, data, clientId, cb);
            }
            cb({error: 'NOT_SUPPORTED'});
        };

        return support;
    };

    return Support;
});
