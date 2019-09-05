define([
    'jquery',
    '/common/cryptpad-common.js',
    '/common/common-constants.js',
    '/common/outer/local-store.js',
    '/common/test.js',
    '/bower_components/nthen/index.js',
    '/bower_components/tweetnacl/nacl-fast.min.js'
], function ($, Cryptpad, Constants, LocalStore, Test, nThen) {
    var Nacl = window.nacl;

    var signMsg = function (msg, privKey) {
        var signKey = Nacl.util.decodeBase64(privKey);
        var buffer = Nacl.util.decodeUTF8(msg);
        return Nacl.util.encodeBase64(Nacl.sign(buffer, signKey));
    };

    // TODO: Allow authing for any domain as long as the user clicks an "accept" button
    //       inside of the iframe.
    var AUTHORIZED_DOMAINS = [
        /\.cryptpad\.fr$/,
        /^http(s)?:\/\/localhost\:/
    ];

    // Safari is weird about localStorage in iframes but seems to let sessionStorage slide.
    localStorage[Constants.userHashKey] = localStorage[Constants.userHashKey] ||
                                          sessionStorage[Constants.userHashKey];

    var proxy;

    var whenReady = function (cb) {
        if (proxy) { return void cb(); }
        console.log('CryptPad not ready...');
        setTimeout(function () {
            whenReady(cb);
        }, 100);
    };

    $(window).on("message", function (jqe) {
        var evt = jqe.originalEvent;
        var data = JSON.parse(evt.data);
        var domain = evt.origin;
        var srcWindow = evt.source;
        var ret = { txid: data.txid };
        console.log('CP receiving', data);
        if (data.cmd === 'PING') {
            ret.res = 'PONG';
        } else if (data.cmd === 'SIGN') {
            if (!AUTHORIZED_DOMAINS.filter(function (x) { return x.test(domain); }).length) {
                ret.error = "UNAUTH_DOMAIN";
            } else if (!LocalStore.isLoggedIn()) {
                ret.error = "NOT_LOGGED_IN";
            } else {
                return void whenReady(function () {
                    var sig = signMsg(data.data, proxy.edPrivate);
                    ret.res = {
                        uname: proxy.login_name,
                        edPublic: proxy.edPublic,
                        sig: sig
                    };
                    srcWindow.postMessage(JSON.stringify(ret), domain);
                });
            }
        } else if (data.cmd === 'UPDATE_LIMIT') {
            return void whenReady(function () {
                Cryptpad.updatePinLimit(function (e, limit, plan, note) {
                    ret.res = [limit, plan, note];
                    srcWindow.postMessage(JSON.stringify(ret), domain);
                });
            });
        } else {
            ret.error = "UNKNOWN_CMD";
        }
        srcWindow.postMessage(JSON.stringify(ret), domain);
    });

    nThen(function (waitFor) {
        Cryptpad.ready(waitFor());
    }).nThen(function (waitFor) {
        Cryptpad.getUserObject(null, waitFor(function (obj) {
            proxy = obj;
        }));
    }).nThen(function () {
        console.log('IFRAME READY');
        Test(function () {
            // This is only here to maybe trigger an error.
            window.drive = proxy['drive'];
            Test.passed();
        });
    });
});
