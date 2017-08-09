// This file provides the API for the channel for talking to and from the sandbox iframe.
define([
    '/common/sframe-protocol.js'
], function (SFrameProtocol) {
    var otherWindow;
    var handlers = {};
    var queries = {};

    // list of handlers which are registered from the other side...
    var insideHandlers = [];
    var callWhenRegistered = {};

    var module = { exports: {} };

    var mkTxid = function () {
        return Math.random().toString(16).replace('0.', '') + Math.random().toString(16).replace('0.', '');
    };

    module.exports.init = function (ow, cb) {
        if (otherWindow) { throw new Error('already initialized'); }
        var intr;
        var txid;
        window.addEventListener('message', function (msg) {
            var data = JSON.parse(msg.data);
            if (ow !== msg.source) {
                console.log("DROP Message from unexpected source");
                console.log(msg);
            } else if (!otherWindow) {
                if (data.txid !== txid) {
                    console.log("DROP Message with weird txid");
                    return;
                }
                clearInterval(intr);
                otherWindow = ow;
                cb();
            } else if (typeof(data.q) === 'string' && handlers[data.q]) {
                handlers[data.q](data, msg);
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
        if (window !== window.top) {
            // we're in the sandbox
            otherWindow = ow;
            cb();
        } else {
            require(['/common/requireconfig.js'], function (RequireConfig) {
                txid = mkTxid();
                intr = setInterval(function () {
                    ow.postMessage(JSON.stringify({
                        txid: txid,
                        content: { requireConf: RequireConfig },
                        q: 'INIT'
                    }), '*');
                });
            });
        }
    };

    module.exports.query = function (q, content, cb) {
        if (!otherWindow) { throw new Error('not yet initialized'); }
        if (!SFrameProtocol[q]) {
            throw new Error('please only make queries are defined in sframe-protocol.js');
        }
        var txid = mkTxid();
        var timeout = setTimeout(function () {
            delete queries[txid];
            console.log("Timeout making query " + q);
        }, 30000);
        queries[txid] = function (data, msg) {
            clearTimeout(timeout);
            delete queries[txid];
            cb(undefined, data.content, msg);
        };
        otherWindow.postMessage(JSON.stringify({
            txid: txid,
            content: content,
            q: q
        }), '*');
    };

    var event = module.exports.event = function (e, content) {
        if (!otherWindow) { throw new Error('not yet initialized'); }
        if (!SFrameProtocol[e]) {
            throw new Error('please only fire events that are defined in sframe-protocol.js');
        }
        if (e.indexOf('EV_') !== 0) {
            throw new Error('please only use events (starting with EV_) for event messages');
        }
        otherWindow.postMessage(JSON.stringify({ content: content, q: e }), '*');
    };

    module.exports.on = function (queryType, handler) {
        if (!otherWindow) { throw new Error('not yet initialized'); }
        if (typeof(handlers[queryType]) !== 'undefined') { throw new Error('already registered'); }
        if (!SFrameProtocol[queryType]) {
            throw new Error('please only register handlers which are defined in sframe-protocol.js');
        }
        handlers[queryType] = function (data, msg) {
            handler(data.content, function (replyContent) {
                msg.source.postMessage(JSON.stringify({
                    txid: data.txid,
                    content: replyContent
                }), '*');
            }, msg);
        };
        event('EV_REGISTER_HANDLER', queryType);
    };

    module.exports.whenReg = function (queryType, handler) {
        if (!otherWindow) { throw new Error('not yet initialized'); }
        if (!SFrameProtocol[queryType]) {
            throw new Error('please only register handlers which are defined in sframe-protocol.js');
        }
        if (insideHandlers.indexOf(queryType) > -1) {
            handler();
        } else {
            (callWhenRegistered[queryType] = callWhenRegistered[queryType] || []).push(handler);
        }
    };

    handlers['EV_REGISTER_HANDLER'] = function (data) {
        if (callWhenRegistered[data.content]) {
            callWhenRegistered[data.content].forEach(function (f) { f(); });
            delete callWhenRegistered[data.content];
        }
        insideHandlers.push(data.content);
    };

    return module.exports;
});
