// This file provides the external API for launching the sandboxed iframe.
define([
    '/common/requireconfig.js'
], function (RequireConfig) {
    var iframe;
    var handlers = {};
    var queries = {};
    var module = { exports: {} };

    var mkTxid = function () {
        return Math.random().toString(16).replace('0.', '') + Math.random().toString(16).replace('0.', '');
    };

    var init = module.exports.init = function (frame, cb) {
        if (iframe) { throw new Error('already initialized'); }
        var txid = mkTxid();
        var intr = setInterval(function () {
            frame.contentWindow.postMessage({
                txid: txid,
                requireConf: RequireConfig,
                q: 'INIT'
            }, '*');
        });
        window.addEventListener('message', function (msg) {
            console.log('recv');
            console.log(msg.origin);
            var data = msg.data;
            if (data.txid !== txid) { return; }
            clearInterval(intr);
            iframe = frame;
            cb();
        });
    };
    var query = module.exports.query = function (msg, cb) {
        if (!iframe) { throw new Error('not yet initialized'); }
        var txid = mkTxid();
        queries[txid] = {
            txid: txid,
            timeout: setTimeout(function () {
                delete queries[txid];
                console.log("Error")
            })
        };
    };
    var registerHandler = module.exports.registerHandler = function (queryType, handler) {
        if (typeof(handlers[queryType]) !== 'undefined') { throw new Error('already registered'); }
        handlers[queryType] = handler;
    };

    return module.exports;
});
