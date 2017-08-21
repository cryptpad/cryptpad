// Stage 0, this gets cached which means we can't change it. boot2-sframe.js is changable.
// Note that this file is meant to be executed only inside of a sandbox iframe.
;(function () {
var req = JSON.parse(decodeURIComponent(window.location.hash.substring(1)));
if (req.cfg) { require.config(req.cfg); }
if (req.pfx) {
    require.config({
        onNodeCreated: function (node, config, module, path) {
            node.setAttribute('src', req.pfx + node.getAttribute('src'));
        }
    });
}
if (req.req) { require(req.req, function () { }); }
window.addEventListener('message', function (msg) {
    var data = JSON.parse(msg.data);
    if (data.q !== 'INIT') { return; }
    msg.source.postMessage(JSON.stringify({ txid: data.txid, content: 'OK' }), '*');
    if (data.content && data.content.requireConf) { require.config(data.content.requireConf); }
    require(['/common/sframe-boot2.js'], function () { });
});
}());