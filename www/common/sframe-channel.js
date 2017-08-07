// This file provides the internal API for talking from inside of the sandbox iframe
// The external API is in sframe-ctrl.js
define([], function () {
    var iframe;
    var handlers = {};
    var queries = {};
    var module = { exports: {} };

    var mkTxid = function () {
        return Math.random().toString(16).replace('0.', '') + Math.random().toString(16).replace('0.', '');
    };

    module.exports.query = function (q, content, cb) {
        if (!iframe) { throw new Error('not yet initialized'); }
        var txid = mkTxid();
        var timeout = setTimeout(function () {
            delete queries[txid];
            cb("Timeout making query " + q);
        });
        queries[txid] = function (data, msg) {
            clearTimeout(timeout);
            delete queries[txid];
            cb(undefined, data.content, msg);
        };
        iframe.contentWindow.postMessage(JSON.stringify({
            txid: txid,
            content: content,
            q: q
        }), '*');
    };

    module.exports.registerHandler = function (queryType, handler) {
        if (typeof(handlers[queryType]) !== 'undefined') { throw new Error('already registered'); }
        handlers[queryType] = function (msg) {
            var data = JSON.parse(msg.data);
            handler(data.content, function (replyContent) {
                msg.source.postMessage(JSON.stringify({
                    txid: data.txid,
                    content: replyContent
                }), '*');
            }, msg);
        };
    };

    return module.exports;
});