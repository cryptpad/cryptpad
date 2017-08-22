// Stage 0, this gets cached which means we can't change it. boot2-sframe.js is changable.
// Note that this file is meant to be executed only inside of a sandbox iframe.
;(function () {
var req = JSON.parse(decodeURIComponent(window.location.hash.substring(1)));
req.cfg = req.cfg || {};
if (req.pfx) {
    req.cfg.onNodeCreated = function (node, config, module, path) {
        node.setAttribute('src', req.pfx + node.getAttribute('src'));
    };
}
require.config(req.cfg);
if (req.req) { require(req.req, function () { }); }
window.addEventListener('message', function (msg) {
    var data = JSON.parse(msg.data);
    if (data.q !== 'INIT') { return; }
    msg.source.postMessage(JSON.stringify({ txid: data.txid, content: 'OK' }), '*');
    require(['/common/sframe-boot2.js'], function () { });
});
}());