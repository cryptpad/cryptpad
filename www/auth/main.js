define([
    'jquery',
    '/common/cryptpad-common.js',
    '/bower_components/tweetnacl/nacl-fast.min.js'
], function ($, Cryptpad) {
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
    localStorage.User_hash = localStorage.User_hash || sessionStorage.User_hash;

    Cryptpad.ready(function () {
        console.log('IFRAME READY');
        $(window).on("message", function (jqe) {
            var evt = jqe.originalEvent;
            var data = JSON.parse(evt.data);
            var domain = evt.origin;
            var srcWindow = evt.source;
            var ret = { txid: data.txid };
            if (data.cmd === 'PING') {
                ret.res = 'PONG';
            } else if (data.cmd === 'SIGN') {
                if (!AUTHORIZED_DOMAINS.filter(function (x) { return x.test(domain); }).length) {
                    ret.error = "UNAUTH_DOMAIN";
                } else if (!Cryptpad.isLoggedIn()) {
                    ret.error = "NOT_LOGGED_IN";
                } else {
                    var proxy = Cryptpad.getStore().getProxy().proxy;
                    var sig = signMsg(data.data, proxy.edPrivate);
                    ret.res = {
                        uname: proxy.login_name,
                        edPublic: proxy.edPublic,
                        sig: sig
                    };
                }
            } else if (data.cmd === 'UPDATE_LIMIT') {
                return Cryptpad.updatePinLimit(function (e, limit, plan, note) {
                    ret.res = [limit, plan, note];
                    srcWindow.postMessage(JSON.stringify(ret), domain);
                });
            } else {
                ret.error = "UNKNOWN_CMD";
            }
            srcWindow.postMessage(JSON.stringify(ret), domain);
        });
    });
});
