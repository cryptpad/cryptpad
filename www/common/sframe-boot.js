// Stage 0, this gets cached which means we can't change it. boot2-sframe.js is changable.
// Note that this file is meant to be executed only inside of a sandbox iframe.
//
// IF YOU EDIT THIS FILE, bump the version (replace 1.3 in the following command with the next version.)
// grep -nr '/common/sframe-boot.js?ver=' | sed 's/:.*$//' | grep -v 'sframe-boot.js' | while read x; do \
//    sed -i -e 's@/common/sframe-boot.js?ver=[^"]*@/common/sframe-boot.js?ver=1.3@' $x; done
;(function () {

var _alert = function (cb) {
    return void require([
        '/common/requireconfig.js',
    ], function (RequireConfig) {
        require.config(RequireConfig());
        require([
            '/common/common-interface.js',
            '/common/hyperscript.js',
            '/customize/messages.js',

            'less!/customize/src/less2/include/alertify.less',

            //'less!/customize/src/less2/pages/page-boot.less',
        ], cb);
    });
};

if (window === window.top) {
    return void _alert(function (UI, h) {
        var s = `sframe-boot.js must only be loaded in a nested context`;
        UI.alert(h('p', s));
    });
}
if (typeof(Promise) !== 'function') {
    return void _alert(function (UI, h) {
        var s = "Internet Explorer is not supported anymore, including by Microsoft.\n\nMost of CryptPad's collaborative functionality requires a modern browser to work.\n\nWe recommend Mozilla Firefox.";
        UI.alert(h('p', {
            style: 'white-space: break-spaces;',
        }, s));
    });
}

var caughtEval;
console.log("Testing if CSP correctly blocks an 'eval' call");
try {
    eval('true'); // jshint ignore:line
} catch (err) { caughtEval = true; }

if (!/^\/(sheet|doc|presentation|unsafeiframe)/.test(window.location.pathname) && !caughtEval) {
    console.error('eval panic location:', window.location.pathname, caughtEval);
    return void _alert(function (UI, h, Msg) {
        UI.alert(h('p', {
            style: 'white-space: break-spaces',
        }, Msg.error_evalPermitted));
    });
}

let PROTESTWARE_TESTING = true;
// this 'if' condition is hardcoded for testing purposes.
// in practice it should only be displayed if the bad API is defined
if (PROTESTWARE_TESTING || (navigator && typeof(navigator.getEnvironmentIntegrity) !== 'undefined')) {
    // the 'return' here prevents the rest of the app from loading
    return void _alert(function (UI, h /*, Msg */) {
        // the placeholder interferes with the display of the alert, so I removed it
        try { document.querySelector('#placeholder').remove(); } catch (err) { }

        // a better message should replace this, and it should probably be translated
        var protestMessage = h('span', [
            h('p', [
                `Your browser supports a technology called "Web Environment Integrity". `,
                `This "feature" was proposed by Google to prevent users from modifying their web browser in ways that go against Google interests,
such as by blocking ads or invasive tracking scripts. `
            ]),
            h('p', [
                `Unless resisted, this could become a mandatory part of the web. `,
                `The most effective way to protest this is to switch to a browser which does not implement this restrictive behaviour, like `,
                h('a', {
                    href: 'https://www.mozilla.org/firefox/browsers/',
                }, 'Firefox'),
                // maybe propose multiple options, not just firefox?
                '.',
            ]),
            h('p', [
                'Read more on ',
                h('a', {
                    // point to an actual blog post, or a better resource if one existss
                    href: 'https://blog.cryptpad.org/#blog-post',
                }, 'our blog'),
                '.',
            ]),
        ]);

        UI.alert(protestMessage, {
            wide: true,
        }, function () {
            // optionally set a flag in localStorage so that the user isn't
            // completely blocked from accessing CryptPad?
        });

        // clicking 'OK' doesn't actually do anything, so I just hid the button
        try { document.querySelector('button').remove(); } catch (err) {}
    });
}

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
    window.cryptpadLanguage = req.lang;
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
