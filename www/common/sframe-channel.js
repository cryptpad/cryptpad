// This file provides the API for the channel for talking to and from the sandbox iframe.
define([
    '/common/sframe-protocol.js',
    '/common/common-util.js'
], function (SFrameProtocol, Util) {

    var mkTxid = function () {
        return Math.random().toString(16).replace('0.', '') + Math.random().toString(16).replace('0.', '');
    };

    var create = function (ow, cb, isSandbox, sendData) {
        var otherWindow;
        var evReady = Util.mkEvent(true);
        var handlers = {};
        var queries = {};

        // list of handlers which are registered from the other side...
        var insideHandlers = [];
        var callWhenRegistered = {};

        var chan = {};

        // Send a query.  channel.query('Q_SOMETHING', { args: "whatever" }, function (reply) { ... });
        chan.query = function (q, content, cb, opts) {
            if (!otherWindow) { throw new Error('not yet initialized'); }
            if (!SFrameProtocol[q]) {
                throw new Error('please only make queries are defined in sframe-protocol.js');
            }
            opts = opts || {};
            var txid = mkTxid();
            var to = opts.timeout || 30000;
            var timeout = setTimeout(function () {
                delete queries[txid];
                console.log("Timeout making query " + q);
            }, to);
            queries[txid] = function (data, msg) {
                clearTimeout(timeout);
                delete queries[txid];
                cb(undefined, data.content, msg);
            };
            evReady.reg(function () {
                otherWindow.postMessage(JSON.stringify({
                    txid: txid,
                    content: content,
                    q: q
                }), '*');
            });
        };

        // Fire an event.  channel.event('EV_SOMETHING', { args: "whatever" });
        var event = chan.event = function (e, content) {
            if (!SFrameProtocol[e]) {
                throw new Error('please only fire events that are defined in sframe-protocol.js');
            }
            if (e.indexOf('EV_') !== 0) {
                throw new Error('please only use events (starting with EV_) for event messages');
            }
            evReady.reg(function () {
                otherWindow.postMessage(JSON.stringify({ content: content, q: e }), '*');
            });
        };

        // Be notified on query or event.  channel.on('EV_SOMETHING', function (args, reply) { ... });
        // If the type is a query, your handler will be invoked with a reply function that takes
        // one argument (the content to reply with).
        chan.on = function (queryType, handler, quiet) {
            if (!SFrameProtocol[queryType]) {
                throw new Error('please only register handlers which are defined in sframe-protocol.js');
            }
            (handlers[queryType] = handlers[queryType] || []).push(function (data, msg) {
                handler(data.content, function (replyContent) {
                    if (queryType.indexOf('Q_') !== 0) { throw new Error("replies to events are invalid"); }
                    msg.source.postMessage(JSON.stringify({
                        txid: data.txid,
                        content: replyContent
                    }), '*');
                }, msg);
            });
            if (!quiet) {
                event('EV_REGISTER_HANDLER', queryType);
            }
        };

        // If a particular handler is registered, call the callback immediately, otherwise it will be called
        // when that handler is first registered.
        // channel.whenReg('Q_SOMETHING', function () { ...query Q_SOMETHING?... });
        chan.whenReg = function (queryType, cb, always) {
            if (!SFrameProtocol[queryType]) {
                throw new Error('please only register handlers which are defined in sframe-protocol.js');
            }
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
        chan.whenReg('EV_REGISTER_HANDLER', evReady.fire);

        // Make sure both iframes are ready
        var isReady  =false;
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

        var txid;
        window.addEventListener('message', function (msg) {
            var data = JSON.parse(msg.data);
            if (ow !== msg.source) {
                return;
                //console.log("DROP Message from unexpected source");
                //console.log(msg);
            } else if (!otherWindow) {
                otherWindow = ow;
                sendData = sendData || {};
                sendData.txid = data.txid;
                ow.postMessage(JSON.stringify(sendData), '*');
                cb(chan);
            } else if (typeof(data.q) === 'string' && handlers[data.q]) {
                handlers[data.q].forEach(function (f) {
                    f(data || JSON.parse(msg.data), msg);
                    data = undefined;
                });
            } else if (typeof(data.q) === 'undefined' && queries[data.txid]) {
                queries[data.txid](data, msg);
            } else if (data.txid === txid) {
                // stray message from init
                return;
            } else {
                console.log("DROP Unhandled message");
                console.log(msg);
            }
        });
        if (isSandbox) {
            // we're in the sandbox
            otherWindow = ow;
            evReady.fire();
            cb(chan);
        }
    };

    return { create: create };
});
