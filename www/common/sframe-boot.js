// Stage 0, this gets cached which means we can't change it. boot2-sframe.js is changable.
// Note that this file is meant to be executed only inside of a sandbox iframe.
window.addEventListener('message', function (msg) {
    var data = JSON.parse(msg.data);
    if (data.q !== 'INIT') { return; }
    msg.source.postMessage({ txid: data.txid, content: 'OK' }, '*');
    if (data.content && data.content.requireConf) { require.config(data.content.requireConf); }
    require(['/common/sframe-boot2.js'], function () { });
});