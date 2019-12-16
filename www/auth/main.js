define([
    'jquery',
    '/common/cryptget.js',
    '/common/pinpad.js',
    '/common/common-constants.js',
    '/common/outer/local-store.js',
    '/common/outer/login-block.js',
    '/common/outer/network-config.js',
    '/customize/login.js',
    '/common/test.js',
    '/bower_components/nthen/index.js',
    '/bower_components/netflux-websocket/netflux-client.js',
    '/bower_components/tweetnacl/nacl-fast.min.js'
], function ($, Crypt, Pinpad, Constants, LocalStore, Block, NetConfig, Login, Test, nThen, Netflux) {
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
    var rpc;
    var network;
    var rpcError;

    var loadProxy = function (hash) {
        nThen(function (waitFor) {
            var wsUrl = NetConfig.getWebsocketURL();
            var w = waitFor();
            Netflux.connect(wsUrl).then(function (_network) {
                network = _network;
                w();
            }, function (err) {
                rpcError = err;
                console.error(err);
            });
        }).nThen(function (waitFor) {
            Crypt.get(hash, waitFor(function (err, val) {
                if (err) {
                    waitFor.abort();
                    console.error(err);
                    return;
                }
                try {
                    var parsed = JSON.parse(val);
                    proxy = parsed;
                } catch (e) {
                    console.log("Can't parse user drive", e);
                }
            }), {
                network: network
            });
        }).nThen(function (waitFor) {
            if (!network) { return void waitFor.abort(); }
            Pinpad.create(network, proxy, waitFor(function (e, call) {
                if (e) {
                    rpcError = e;
                    return void waitFor.abort();
                }
                rpc = call;
            }));
        }).nThen(function () {
            Test(function () {
                // This is only here to maybe trigger an error.
                window.drive = proxy['drive'];
                Test.passed();
            });
        });
    };

    var whenReady = function (cb) {
        if (proxy && (rpc || rpcError)) { return void cb(); }
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
        } else if (data.cmd === 'LOGIN') {
            Login.loginOrRegister(data.data.name, data.data.password, false, false, function (err) {
                if (err) {
                    ret.error = 'LOGIN_ERROR';
                    srcWindow.postMessage(JSON.stringify(ret), domain);
                    return;
                }
                loadProxy(LocalStore.getUserHash());
                srcWindow.postMessage(JSON.stringify(ret), domain);
            });
            return;
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
                if (rpcError) {
                    // Tell the user on accounts that there was an issue and they need to wait maximum 24h or contact an admin
                    ret.warning = true;
                    srcWindow.postMessage(JSON.stringify(ret), domain);
                    return;
                }
                rpc.updatePinLimits(function (e, limit, plan, note) {
                    if (e) {
                        ret.warning = true;
                    }
                    ret.res = [limit, plan, note];
                    srcWindow.postMessage(JSON.stringify(ret), domain);
                });
            });
        } else {
            ret.error = "UNKNOWN_CMD";
        }
        srcWindow.postMessage(JSON.stringify(ret), domain);
    });

    var userHash = LocalStore.getUserHash();
    if (userHash) {
        loadProxy(userHash);
    }
});
