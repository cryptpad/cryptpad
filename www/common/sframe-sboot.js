// Stage 0, this gets cached which means we can't change it. boot2-sframe.js is changable.
// Note that this file is meant to be executed only inside of a sandbox iframe.
//
// IF YOU EDIT THIS FILE, bump the version (replace 1.3 in the following command with the next version.)
// grep -nr '/common/sframe-boot.js?ver=' | sed 's/:.*$//' | grep -v 'sframe-boot.js' | while read x; do \
//    sed -i -e 's@/common/sframe-boot.js?ver=[^"]*@/common/sframe-boot.js?ver=1.3@' $x; done
;(function () {
var afterLoaded = function (req) {
    req.cfg = req.cfg || {};
    window.CRYPTPAD_APICONF = req.apiConfS;
    var apiConfig = JSON.parse(req.apiConfS);
    window.CRYPTPAD_MANIFEST_HASH = apiConfig.manifestHash;
    var manifest = { files: { customize: { "manifest.js": apiConfig.manifestHash } } };
    req.cfg.onNodeCreated = function (node /*, config, module, path*/) {
        var src = node.getAttribute('src');
        var hash = manifest.files;
        var path = src.replace(/\?.*$/, '').split('/');
        path.shift(); // leading /
        for (var i = 0; i < path.length; i++) {
            var next = hash[path[i]];
            if (!next) { throw new Error("no entry in manifest for " + src); }
            hash = next;
        }
        if (typeof(hash) !== 'string') { throw new Error("no entry in manifest for " + src); }
        var newSrc = src.replace(/([\?\&])ver=[^\?\&]*([\?\&])?/, function (all, begin, end) {
            return begin + 'ver=' + encodeURIComponent(hash) + (end || '');
        });
        if (req.pfx) { newSrc = req.pfx + newSrc; }
        node.setAttribute('src', newSrc);
        node.setAttribute('integrity', 'sha256-' + hash);
    };
    var txid = Math.random().toString(16).replace('0.', '');
    var intr;
    var ready = function () {
        intr = setInterval(function () {
            if (typeof(txid) !== 'string') { return; }
            window.parent.postMessage(JSON.stringify({ q: 'READY', txid: txid }), '*');
        }, 1);
    };
    var hasRequire = function () {
        require.config(req.cfg);
        window.defineManifest = function (m) {
            manifest = m;
            delete window.defineManifest;
            if (req.req) { require(req.req, ready); } else { ready(); }
        };
        require(['/customize/manifest.js'], function () { });
    };
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
    var scr = document.createElement('script');
    scr.setAttribute('integrity', 'sha256-' + req.requireHash);
    scr.src = '/bower_components/requirejs/require.js?ver=' + encodeURIComponent(req.requireHash);
    scr.async = true;
    scr.charset = 'utf-8';
    scr.type = 'text/javascript';
    scr.addEventListener('load', hasRequire, false);
    document.getElementsByTagName('head')[0].appendChild(scr);
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
