// Stage 0, this gets cached which means we can't change it. boot2-sframe.js is changable.
// Note that this file is meant to be executed only inside of a sandbox iframe.
//
// IF YOU EDIT THIS FILE, bump the version (replace 1.3 in the following command with the next version.)
// grep -nr '/common/sframe-boot.js?ver=' | sed 's/:.*$//' | grep -v 'sframe-boot.js' | while read x; do \
//    sed -i -e 's@/common/sframe-boot.js?ver=[^"]*@/common/sframe-boot.js?ver=1.3@' $x; done
;(function () {
var afterLoaded = function (req) {
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
        data.cache = data.cache || {};
        var updated = {};
        window.cryptpadCache = {
            get: function (k, cb) {
                setTimeout(function () { cb(data.cache[k]); });
            },
            put: function (k, v, cb) {
                cb = cb || function () { };
                updated[k] = v;
                setTimeout(function () { data.cache[k] = v; cb(); });
            },
            updated: updated,
            cache: data.cache
        };
        data.localStore = data.localStore || {};
        var lsUpdated = {};
        window.cryptpadStore = {
            get: function (k, cb) {
                setTimeout(function () { cb(data.localStore[k]); });
            },
            getAll: function (cb) {
                setTimeout(function () {
                    cb(JSON.parse(JSON.stringify(data.localStore)));
                });
            },
            put: function (k, v, cb) {
                cb = cb || function () { };
                lsUpdated[k] = v;
                setTimeout(function () { data.localStore[k] = v; cb(); });
            },
            updated: lsUpdated,
            store: data.localStore
        };
        window.cryptpadLanguage = data.language;
        require(['/common/sframe-boot2.js'], function () { });
    };
    window.addEventListener('message', onReply);
};

var load0 = function () {
    try {
        var req = JSON.parse(decodeURIComponent(window.location.hash.substring(1)));
        afterLoaded(req);
    } catch (e) {
        console.error(e);
        setTimeout(load0, 100);
    }
};
load0();

}());
