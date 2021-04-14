define([
    'jquery',
    '/api/config',
    '/assert/assertions.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/common/dom-ready.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common-outer.js',
    '/customize/login.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/common/pinpad.js',
    '/common/outer/network-config.js',

    '/bower_components/tweetnacl/nacl-fast.min.js',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less2/pages/page-checkup.less',
], function ($, ApiConfig, Assertions, h, Messages, DomReady,
            nThen, SFCommonO, Login, Hash, Util, Pinpad,
            NetConfig) {
    var assert = Assertions();

    var trimSlashes = function (s) {
        if (typeof(s) !== 'string') { return s; }
        return s.replace(/\/+$/, '');
    };

    var _alert = function (content) {
        return h('span.advisory-text', content);
    };

    var trimmedSafe = trimSlashes(ApiConfig.httpSafeOrigin);
    var trimmedUnsafe = trimSlashes(ApiConfig.httpUnsafeOrigin);

    assert(function (cb) {
        //console.error(trimmedSafe, trimmedUnsafe);
        cb(Boolean(trimmedSafe && trimmedUnsafe));
    }, _alert("Sandbox configuration: ensure that both httpUnsafeOrigin and httpSafeOrigin are defined"));

    assert(function (cb) {
        return void cb(trimmedSafe !== trimmedUnsafe);
    }, _alert('Sandbox configuration: httpUnsafeOrigin !== httpSafeOrigin'));

    assert(function (cb) {
        cb(trimmedSafe === ApiConfig.httpSafeOrigin);
    }, "httpSafeOrigin must not have a trailing slash");

    assert(function (cb) {
        var origin = window.location.origin;
        return void cb(ApiConfig.httpUnsafeOrigin === origin);
    }, _alert('Sandbox configuration: loading via httpUnsafeOrigin'));


    var checkAvailability = function (url, cb) {
        $.ajax({
            url: url,
            data: {},
            complete: function (xhr) {
                cb(xhr.status === 200);
            },
        });
    };

    assert(function (cb) {
        checkAvailability(trimmedUnsafe, cb);
    }, _alert("Main domain is not available"));

    // Try loading an iframe on the safe domain
    assert(function (cb) {
        var to;
        nThen(function (waitFor) {
            DomReady.onReady(waitFor());
        }).nThen(function (waitFor) {
            to = setTimeout(function () {
                console.error('TIMEOUT loading iframe on the safe domain');
                cb(false);
            }, 5000);
            SFCommonO.initIframe(waitFor);
        }).nThen(function () {
            // Iframe is loaded
            clearTimeout(to);
            cb(true);
        });
    }, _alert("Sandbox domain is not available"));

    // Test Websocket
    var evWSError = Util.mkEvent(true);
    assert(function (cb) {
        var ws = new WebSocket(NetConfig.getWebsocketURL());
        var to = setTimeout(function () {
            console.error('Websocket TIMEOUT');
            evWSError.fire();
            cb('TIMEOUT (5 seconds)');
        }, 5000);
        ws.onopen = function () {
            clearTimeout(to);
            cb(true);
        };
        ws.onerror = function (err) {
            clearTimeout(to);
            console.error('Websocket error', err);
            evWSError.fire();
            cb('WebSocket error: check your console');
        };
    }, _alert("Websocket is not available"));

    // Test login block
    assert(function (cb) {
        var bytes = new Uint8Array(Login.requiredBytes);

        var opt = Login.allocateBytes(bytes);

        var blockUrl = Login.Block.getBlockUrl(opt.blockKeys);
        var blockRequest = Login.Block.serialize("{}", opt.blockKeys);
        var removeRequest = Login.Block.remove(opt.blockKeys);
        console.log('Test block URL:', blockUrl);

        var userHash = '/2/drive/edit/000000000000000000000000';
        var secret = Hash.getSecrets('drive', userHash);
        opt.keys = secret.keys;
        opt.channelHex = secret.channel;

        var RT, rpc, exists;

        nThen(function (waitFor) {
            Util.fetch(blockUrl, waitFor(function (err) {
                if (err) { return; } // No block found
                exists = true;
            }));
        }).nThen(function (waitFor) {
            // If WebSockets aren't working, don't wait forever here
            evWSError.reg(function () {
                waitFor.abort();
                cb("No WebSocket (test number 6)");
            });
            // Create proxy
            Login.loadUserObject(opt, waitFor(function (err, rt) {
                if (err) {
                    waitFor.abort();
                    console.error("Can't create new channel. This may also be a websocket issue.");
                    return void cb(false);
                }
                RT = rt;
                var proxy = rt.proxy;
                proxy.edPublic = opt.edPublic;
                proxy.edPrivate = opt.edPrivate;
                proxy.curvePublic = opt.curvePublic;
                proxy.curvePrivate = opt.curvePrivate;
                rt.realtime.onSettle(waitFor());
            }));
        }).nThen(function (waitFor) {
            // Init RPC
            Pinpad.create(RT.network, RT.proxy, waitFor(function (e, _rpc) {
                if (e) {
                    waitFor.abort();
                    console.error("Can't initialize RPC", e); // INVALID_KEYS
                    return void cb(false);
                }
                rpc = _rpc;
            }));
        }).nThen(function (waitFor) {
            // Write block
            if (exists) { return; }
            rpc.writeLoginBlock(blockRequest, waitFor(function (e) {
                if (e) {
                    waitFor.abort();
                    console.error("Can't write login block", e);
                    return void cb(false);
                }
            }));
        }).nThen(function (waitFor) {
            // Read block
            Util.fetch(blockUrl, waitFor(function (e) {
                if (e) {
                    waitFor.abort();
                    console.error("Can't read login block", e);
                    return void cb(false);
                }
            }));
        }).nThen(function (waitFor) {
            // Remove block
            rpc.removeLoginBlock(removeRequest, waitFor(function (e) {
                if (e) {
                    waitFor.abort();
                    console.error("Can't remove login block", e);
                    console.error(blockRequest);
                    return void cb(false);
                }
            }));
        }).nThen(function (waitFor) {
            rpc.removeOwnedChannel(secret.channel, waitFor(function (e) {
                if (e) {
                    waitFor.abort();
                    console.error("Can't remove channel", e);
                    return void cb(false);
                }
            }));
        }).nThen(function () {
            cb(true);
        });

    }, _alert("Login block is not working (write/read/remove)"));

    assert(function (cb) {
        var url = '/common/onlyoffice/v4/web-apps/apps/spreadsheeteditor/main/index.html';
        var expect = {
            'cross-origin-resource-policy': 'cross-origin',
            'cross-origin-embedder-policy': 'require-corp',
        };

        $.ajax(url, {
            complete: function (xhr) {
                cb(!Object.keys(expect).some(function (k) {
                    var response = xhr.getResponseHeader(k);
                    console.log(k, response);
                    return response !== expect[k];
                }));
            },
        });
    }, _alert("Missing HTTP headers required for XLSX export"));

    assert(function (cb) {
        cb(true);
        $.ajax('/api/broadcast', {
            dataType: 'text',
            complete: function (xhr) {
                console.log(xhr);
                cb(xhr.status === 200);
            },
        });
    }, _alert("/api/broadcast is not available"));

    var row = function (cells) {
        return h('tr', cells.map(function (cell) {
            return h('td', cell);
        }));
    };

    var failureReport = function (obj) {
        return h('div.error', [
            h('h5', obj.message),
            h('table', [
                row(["Failed test number", obj.test + 1]),
                row(["Returned value", obj.output]),
            ]),
        ]);
    };

    var completed = 0;
    var $progress = $('#cp-progress');
    assert.run(function (state) {
        var errors = state.errors;
        var failed = errors.length;

        Messages.assert_numberOfTestsPassed = "{0} / {1} tests passed.";

        var statusClass = failed? 'failure': 'success';

        var summary = h('div.summary.' + statusClass, [
            h('p', Messages._getKey('assert_numberOfTestsPassed', [
                state.passed,
                state.total
            ])),
            h('p', "Details found below"),
        ]);

        var report = h('div.report', [
            summary,
            h('div.failures', errors.map(failureReport)),
        ]);

        $progress.remove();
        $('body').prepend(report);
    }, function (i, total) {
        console.log('test '+ i +' completed');
        completed++;
        Messages.assert_numberOfTestsCompleted = "{0} / {1} tests completed.";
        $progress.html('').append(h('div.report.pending.summary', [
            h('p', [
                h('i.fa.fa-spinner.fa-pulse'),
                h('span', Messages._getKey('assert_numberOfTestsCompleted', [completed, total]))
            ])
        ]));
    });
});
