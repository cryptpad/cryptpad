// Stage 0, this gets cached which means we can't change it. boot2-sframe.js is changable.
// Note that this file is meant to be executed only inside of a sandbox iframe.
;(function () {
var req = JSON.parse(decodeURIComponent(window.location.hash.substring(1)));
req.cfg = req.cfg || {};
if (req.pfx) {
    req.cfg.onNodeCreated = function (node /*, config, module, path*/) {
        node.setAttribute('src', req.pfx + node.getAttribute('src'));
    };
}
require.config(req.cfg);
var txid = Math.random().toString(16).replace('0.', '');
var intr;
var ready = function () {
    intr = setInterval(function () {
        if (typeof(txid) !== 'string') { return; }
        window.parent.postMessage(JSON.stringify({ q: 'READY', txid: txid }), '*');
    }, 1);
};
if (req.req) { require(req.req, ready); } else { ready(); }
var onReply = function (msg) {
    var data = JSON.parse(msg.data);
    if (data.txid !== txid) { return; }
    clearInterval(intr);
    txid = {};
    window.removeEventListener('message', onReply);
    require(['/common/sframe-boot2.js'], function () { });
};
window.addEventListener('message', onReply);
}());