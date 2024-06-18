// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// This file provides the API for the channel for talking to and from the sandbox iframe.
define([
    //'/common/sframe-protocol.js',
    '/common/common-util.js',
    '/api/config',
], function (/*SFrameProtocol,*/ Util, ApiConfig) {

    var mkTxid = function () {
        return Math.random().toString(16).replace('0.', '') + Math.random().toString(16).replace('0.', '');
    };

    var create = function (onMsg, postMsg, cb) {
        var chanLoaded;
        var waitingData = [];

        var evReady = Util.mkEvent(true);

        onMsg.reg(function (msg) {
            if (chanLoaded) { return; }
            var data = msg.data;
            if (data === '_READY') {
                postMsg('_READY');
                chanLoaded = true;
                evReady.fire();
                waitingData.forEach(function (d) {
                    onMsg.fire(d);
                });
                return;
            }
            waitingData.push(data);
        });

        var handlers = {};
        var queries = {};
        var acks = {};

        // list of handlers which are registered from the other side...
        var insideHandlers = [];
        var callWhenRegistered = {};

        var chan = {};

        // Send a query.  channel.query('Q_SOMETHING', { args: "whatever" }, function (reply) { ... });
        // We have a timeout for receiving an ACK, but unlimited time for receiving an answer to the query
        chan.query = function (q, content, cb, opts) {
            var txid = mkTxid();
            opts = opts || {};
            var to = opts.timeout || 30000;
            var timeout;
            if (to > 0) {
                timeout = setTimeout(function () {
                    delete queries[txid];
                    cb('TIMEOUT');
                }, to);
            }
            acks[txid] = function (err) {
                clearTimeout(timeout);
                delete acks[txid];
                if (err) {
                    delete queries[txid];
                    cb('UNHANDLED');
                }
            };
            queries[txid] = function (data, msg) {
                delete queries[txid];
                cb(undefined, data.content, msg);
            };
            evReady.reg(function () {
                var toSend = {
                    txid: txid,
                    content: content,
                    q: q,
                    raw: opts.raw
                };
                postMsg(opts.raw ? toSend : JSON.stringify(toSend));
            });
        };

        // Fire an event.  channel.event('EV_SOMETHING', { args: "whatever" });
        var event = chan.event = function (e, content, opts) {
            opts = opts || {};
            evReady.reg(function () {
                var toSend = {
                    content: content,
                    q: e,
                    raw: opts.raw
                };
                postMsg(opts.raw ? toSend : JSON.stringify(toSend));
            });
        };

        // Be notified on query or event.  channel.on('EV_SOMETHING', function (args, reply) { ... });
        // If the type is a query, your handler will be invoked with a reply function that takes
        // one argument (the content to reply with).
        chan.on = function (queryType, handler, quiet) {
            var h = function (data, msg, raw) {
                handler(data.content, function (replyContent) {
                    var toSend = {
                        txid: data.txid,
                        content: replyContent
                    };
                    postMsg(raw ? toSend : JSON.stringify(toSend));
                }, msg);
            };
            (handlers[queryType] = handlers[queryType] || []).push(h);
            if (!quiet) {
                event('EV_REGISTER_HANDLER', queryType);
            }
            return {
                stop: function () {
                    var idx = handlers[queryType].indexOf(h);
                    if (idx === -1) { return; }
                    handlers[queryType].splice(idx, 1);
                }
            };
        };

        // If a particular handler is registered, call the callback immediately, otherwise it will be called
        // when that handler is first registered.
        // channel.whenReg('Q_SOMETHING', function () { ...query Q_SOMETHING?... });
        chan.whenReg = function (queryType, cb, always) {
            var reg = always;
            if (insideHandlers.indexOf(queryType) > -1) {
                cb();
            } else {
                reg = true;
            }
            if (reg) {
                (callWhenRegistered[queryType] = callWhenRegistered[queryType] || []).push(cb);
            }
        };

        // Same as whenReg except it will invoke every time there is another registration, not just once.
        chan.onReg = function (queryType, cb) { chan.whenReg(queryType, cb, true); };

        chan.on('EV_REGISTER_HANDLER', function (content) {
            if (callWhenRegistered[content]) {
                callWhenRegistered[content].forEach(function (f) { f(); });
                delete callWhenRegistered[content];
            }
            insideHandlers.push(content);
        });
        //chan.whenReg('EV_REGISTER_HANDLER', evReady.fire);

        // Make sure both iframes are ready
        var isReady = false;
        chan.onReady = function (h) {
            if (isReady) {
                return void h();
            }
            if (typeof(h) !== "function") { return; }
            chan.on('EV_RPC_READY', function () { isReady = true; h(); });
        };
        chan.ready = function () {
            chan.whenReg('EV_RPC_READY', function () {
                chan.event('EV_RPC_READY');
            });
        };

        var trusted = [
            ApiConfig.httpUnsafeOrigin,
            ApiConfig.httpSafeOrigin,
            '', // sharedworkers
        ];

        onMsg.reg(function (msg) {
            if (!chanLoaded) { return; }
            if (!msg.data || msg.data === '_READY') { return; }
            if (!trusted.includes(msg.origin)) { return; }

            var data;
            // apparently some browser extensions send messages to random targets
            // which can trigger parse errors that interrupt normal behaviour
            // we therefore log a warning and ignore any messages we can't parse
            try {
                data = typeof(msg.data) === "object" ? msg.data : JSON.parse(msg.data);
            } catch (err) {
                console.warn(err);
                return;
            }
            if (typeof(data.ack) !== "undefined") {
                if (acks[data.txid]) { acks[data.txid](!data.ack); }
            } else if (typeof(data.q) === 'string') {
                if (handlers[data.q]) {
                    // If this is a "query", send an ack
                    if (data.txid) {
                        postMsg(JSON.stringify({
                            txid: data.txid,
                            ack: true
                        }));
                    }
                    handlers[data.q].forEach(function (f) {
                        f(data || JSON.parse(msg.data), msg, data && data.raw);
                        data = undefined;
                    });
                } else {
                    if (data.txid) {
                        postMsg(JSON.stringify({
                            txid: data.txid,
                            ack: false
                        }));
                    }
                }
            } else if (typeof(data.q) === 'undefined' && queries[data.txid]) {
                queries[data.txid](data, msg);
            } else {
                /*console.log("DROP Unhandled message");
                console.log(msg.data, window);
                console.log(msg);*/
            }
        });

        postMsg('_READY');

        cb(chan);
    };

    return { create: create };
});
