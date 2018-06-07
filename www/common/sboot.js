/*@flow*/
// The hash of this file is stored directly in the html
// YOU MUST NOT CHANGE THIS FILE
(function () {
    var PUBLIC_KEY = "MYaWgwAcOHIp3sZFGXeWsQX3u7U8PZrqIDaM2jNhXWY=";
    var NACL_HASH = "kcvFQQilxR1viAWvO4PrBTfQylz8bJTlYTpKQ6XeGtw=";
    var load = function (url, cb) {
        var req = new XMLHttpRequest();
        req.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) { cb(req.responseText); }
        };
        req.open("GET", url);
        req.send();
    };
    var script = function (path, hash, done) {
        var scr = document.createElement('script');
        scr.async = true;
        scr.charset = 'utf-8';
        scr.type = 'text/javascript';
        scr.src = path;
        if (done) { scr.addEventListener('load', done, false); }
        scr.setAttribute('integrity', 'sha256-' + hash);
        document.getElementsByTagName('head')[0].appendChild(scr);
    };
    var ConfigS;
    var Config;
    var Nacl;
    var three = function (manifest) {
        delete window.defineManifest;
        var requireHash = manifest.files.bower_components.requirejs['require.js'];
        script(
            '/bower_components/requirejs/require.js?ver=' + encodeURIComponent(requireHash),
            requireHash,
            function () {
                var rcfg = Config.requireConf || {};
                rcfg.onNodeCreated = function (node /*, config, module, path*/) {
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
                    node.setAttribute('src', newSrc);
                    node.setAttribute('integrity', 'sha256-' + hash);
                };
                window.require.config(Config.requireConf);
                window.define('/api/config', function () { return JSON.parse(ConfigS); });
                window.require(['/common/boot2.js']);
            }
        );
    };
    var two = function () {
        if (!(Nacl && ConfigS)) { return; }
        Config = JSON.parse(ConfigS);
        var key = Nacl.util.decodeBase64(PUBLIC_KEY);
        var buf = Nacl.util.decodeBase64(Config.versionSig);
        var opened = Nacl.sign.open(buf, key);
        var openedS = Nacl.util.encodeUTF8(opened);
        var data = JSON.parse(openedS);
        var lastVer = Number(localStorage.CRYPTPAD_SBOOT_VERSION || -1);
        if (!lastVer) {
        } else if (lastVer > data[0]) {
            window.alert("Cryptpad secure bootloader failed because version number is lower than last version");
            throw new Error(lastVer + " > " + data[0]);
        }
        localStorage['CRYPTPAD_SBOOT_VERSION'] = data[0];
        window.defineManifest = three;
        script("/customize/manifest.js?ver=" + encodeURIComponent(data[1]), data[1]);
    };
    script(
        '/bower_components/tweetnacl/nacl-fast.min.js?ver=' + encodeURIComponent(NACL_HASH),
        NACL_HASH,
        function () { Nacl = window.nacl; delete window.nacl; two(); }
    );
    load("/api/config.json?ver=" + (+new Date()), function (v) { ConfigS = v; two(); });
}());