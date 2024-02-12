// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/common/common-util.js',
    '/common/common-hash.js',
    '/components/nthen/index.js',
    '/components/chainpad-crypto/crypto.js',
    'chainpad-netflux'
], function (Util, Hash, nThen, Crypto, CpNetflux) {
    var Support = {};

    var getKeys = function (ctx, cb) {
        require(['/api/config?' + (+new Date())], function (NewConfig) {
            supportKey = NewConfig.newSupportMailbox;
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
            var cb = Util.once(Util.both(close, Util.mkAsync(_cb)));
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

        support.removeClient = function (clientId) {
            removeClient(ctx, clientId);
        };
        support.leavePad = function (padChan) {
            leaveChannel(ctx, padChan);
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
