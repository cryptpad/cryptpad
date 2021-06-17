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
    '/customize/pages.js',

    '/bower_components/tweetnacl/nacl-fast.min.js',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/checkup/app-checkup.less',
], function ($, ApiConfig, Assertions, h, Messages, DomReady,
            nThen, SFCommonO, Login, Hash, Util, Pinpad,
            NetConfig, Pages) {
    var Assert = Assertions();
    var trimSlashes = function (s) {
        if (typeof(s) !== 'string') { return s; }
        return s.replace(/\/+$/, '');
    };

    var assert = function (f, msg) {
        Assert(f, msg || h('span.advisory-text.cp-danger'));
    };

    var code = function (content) {
        return h('code', content);
    };

    var CONFIG_PATH = function () {
        return code('cryptpad/config/config.js');
    };
    var API_CONFIG_LINK = function () {
        return h('a', {
            href: '/api/config',
            target: '_blank',
        }, '/api/config');
    };

    var RESTART_WARNING = function () {
        return h('span', [
            'Changes to ',
            CONFIG_PATH(),
            ' will require a server restart in order for ',
            API_CONFIG_LINK(),
            ' to be updated.',
        ]);
    };

    var link = function (href, text) {
        return h('a', {
            href: href,
            rel: 'noopener noreferrer',
            target: '_blank',
        }, text);
    };

    var setWarningClass = function (msg) {
        $(msg).removeClass('cp-danger').addClass('cp-warning');
    };

    var cacheBuster = function (url) {
        return url + '?test=' + (+new Date());
    };

    var trimmedSafe = trimSlashes(ApiConfig.httpSafeOrigin);
    var trimmedUnsafe = trimSlashes(ApiConfig.httpUnsafeOrigin);

    assert(function (cb, msg) {
        msg.appendChild(h('span', [
            "CryptPad's sandbox requires that both ",
            code('httpUnsafeOrigin'),
            ' and ',
            code('httpSafeOrigin'),
            " be configured in ",
            CONFIG_PATH(),
            '. ',
            RESTART_WARNING(),
        ]));

        //console.error(trimmedSafe, trimmedUnsafe);
        cb(Boolean(trimmedSafe && trimmedUnsafe));
    });

    assert(function (cb, msg) {
        msg.appendChild(h('span', [
            code('httpUnsafeOrigin'),
            ' and ',
            code('httpSafeOrigin'),
            ' are equivalent. ',
            "In order for CryptPad's security features to be as effective as intended they must be different. ",
            "See ",
            CONFIG_PATH(),
            '. ',
            RESTART_WARNING(),
        ]));

        return void cb(trimmedSafe !== trimmedUnsafe);
    });

    assert(function (cb, msg) {
        msg.appendChild(h('span', [
            code('httpUnsafeOrigin'),
            ' and ',
            code('httpSafeOrigin'),
            ' must not contain trailing slashes. This can be configured in ',
            CONFIG_PATH(),
            '. ',
            RESTART_WARNING(),
        ]));
        cb(trimmedSafe === ApiConfig.httpSafeOrigin && trimmedUnsafe === ApiConfig.httpUnsafeOrigin);
    });

    assert(function (cb, msg) {
        msg.appendChild(h("span", [
            "It appears that you are trying to load this page via an origin other than its main domain (",
            code(ApiConfig.httpUnsafeOrigin),

            "). See the ",
            code('httpUnsafeOrigin'),
            " option in ",
            CONFIG_PATH(),
            " which is exposed via ",
            API_CONFIG_LINK(),
            '.',
        ]));
        var origin = window.location.origin;
        return void cb(ApiConfig.httpUnsafeOrigin === origin);
    });

    var checkAvailability = function (url, cb) {
        $.ajax({
            url: cacheBuster(url),
            data: {},
            complete: function (xhr) {
                cb(xhr.status === 200);
            },
        });
    };

    assert(function (cb, msg) {
        msg.appendChild(h('span', [
            "The main domain (configured via ",
            code('httpUnsafeOrigin'),
            ' as ',
            ApiConfig.httpUnsafeOrigin,
            ' in ',
            CONFIG_PATH(),
            ' and exposed via ',
            API_CONFIG_LINK(),
            ') could not be reached.',
        ]));

        checkAvailability(trimmedUnsafe, cb);
    });

    // Try loading an iframe on the safe domain
    assert(function (cb, msg) {
        msg.appendChild(h('span', [
            "Your browser was not able to load an iframe using the origin specified as ",
            code("httpSafeOrigin"),
            " (",
            ApiConfig.httpSafeOrigin,
            ") in ",
            CONFIG_PATH(),
            ". This can be caused by an invalid ",
            code('httpUnsafeDomain'),
            ', invalid CSP configuration in your reverse proxy, invalid SSL certificates, and many other factors. ',
            'More information about your particular error may be found in your browser console. ',
            RESTART_WARNING(),
        ]));

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
            console.log("removing sandbox iframe");
            $('iframe#sbox-iframe').remove();
            cb(true);
        });
    });

    var shared_websocket;
    // Test Websocket
    var evWSError = Util.mkEvent(true);
    assert(function (_cb, msg) {
        var timeoutErr = 'Could not connect to the websocket server within 5 seconds.';
        var cb = Util.once(Util.both(_cb, function (status) {
            if (status === true) { return; }
            msg.appendChild(h('span#websocket', [
                status || 'Unknown websocket error',
            ]));
        }));

        var ws = new WebSocket(NetConfig.getWebsocketURL());
        shared_websocket = ws;
        var to = setTimeout(function () {
            console.error('Websocket TIMEOUT');
            evWSError.fire();
            cb(timeoutErr);
        }, 5000);
        ws.onopen = function () {
            clearTimeout(to);
            cb(true);
        };
        ws.onerror = function (err) {
            clearTimeout(to);
            console.error('[Websocket error]', err);
            evWSError.fire();
            cb('Unable to connect to the websocket server. More information may be available in your browser console ([Websocket error]).');
        };
    });

    // Test login block
    var shared_realtime;
    assert(function (_cb, msg) {
        var websocketErr = "No WebSocket available";
        var cb = Util.once(Util.both(_cb, function (status) {
            if (status === true) { return; }
            if (status === websocketErr) {
                msg.appendChild(h('span', [
                    websocketErr,
                    ' See ',
                    h('a', {
                        href: '#websocket',
                    }, 'the related websocket error'),
                ]));
                return;
            }
            // else
            msg.appendChild(h('span', [
                "Unable to create, retrieve, or remove encrypted credentials from the server. ",
                "This is most commonly caused by a mismatch between the value of the  ",
                code('blockPath'),
                ' value configured in ',
                CONFIG_PATH(),
                " and the corresponding settings in your reverse proxy's configuration file,",
                " but it can also be explained by a websocket error. ",
                RESTART_WARNING(),
            ]));
        }));

        var bytes = new Uint8Array(Login.requiredBytes);

        var opt = Login.allocateBytes(bytes);

        var blockUrl = Login.Block.getBlockUrl(opt.blockKeys);
        var blockRequest = Login.Block.serialize("{}", opt.blockKeys);
        var removeRequest = Login.Block.remove(opt.blockKeys);
        console.warn('Testing block URL (%s). One 404 is normal.', blockUrl);

        var userHash = '/2/drive/edit/000000000000000000000000';
        var secret = Hash.getSecrets('drive', userHash);
        opt.keys = secret.keys;
        opt.channelHex = secret.channel;

        var RT, rpc, exists, restricted;

        nThen(function (waitFor) {
            Util.fetch(blockUrl, waitFor(function (err) {
                if (err) { return; } // No block found
                exists = true;
            }));
        }).nThen(function (waitFor) {
            // If WebSockets aren't working, don't wait forever here
            evWSError.reg(function () {
                waitFor.abort();
                cb(websocketErr);
            });
            // Create proxy
            Login.loadUserObject(opt, waitFor(function (err, rt) {
                if (err) {
                    waitFor.abort();
                    console.error("Can't create new channel. This may also be a websocket issue.");
                    return void cb(false);
                }
                shared_realtime = RT = rt;
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
                // we should tolerate restricted registration
                // and proceed to clean up after any data we've created
                if (e === 'E_RESTRICTED') {
                    restricted = true;
                    return void cb(true);
                }
                if (e) {
                    waitFor.abort();
                    console.error("Can't write login block", e);
                    return void cb(false);
                }
            }));
        }).nThen(function (waitFor) {
            if (restricted) { return; }
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
                if (restricted) { return; } // an ENOENT is expected in the case of restricted registration, but we call this anyway to clean up any mess from previous tests.
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
    });

    var sheetURL = '/common/onlyoffice/v4/web-apps/apps/spreadsheeteditor/main/index.html';

    assert(function (cb, msg) {
        msg.innerText = "Missing HTTP headers required for .xlsx export from sheets. ";
        var url = cacheBuster(sheetURL);
        var expect = {
            'cross-origin-resource-policy': 'cross-origin',
            'cross-origin-embedder-policy': 'require-corp',
            //'cross-origin-opener-policy': 'same-origin', // FIXME this is in our nginx config but not server.js
        };

        $.ajax(url, {
            complete: function (xhr) {
                cb(!Object.keys(expect).some(function (k) {
                    var response = xhr.getResponseHeader(k);
                    if (response !== expect[k]) {
                        msg.appendChild(h('span', [
                            'A value of ',
                            code(expect[k]),
                            ' was expected for the ',
                            code(k),
                            ' HTTP header, but instead a value of "',
                            code(response),
                            '" was received.',
                        ]));
                        return true; // returning true indicates that a value is incorrect
                    }
                }));
            },
        });
    });

    assert(function (cb, msg) {
        setWarningClass(msg);

        var printMessage = function (value) {
            msg.appendChild(h('span', [
                "This instance hasn't opted out of participation in Google's ",
                code('FLoC'),
                " targeted advertizing network. ",

                "This can be done by setting a ",
                code('permissions-policy'),
                " HTTP header with a value of ",
                code('"interest-cohort=()"'),
                " in the configuration of its reverse proxy instead of the current value (",
                code(value),
                "). See the provided NGINX configuration file for an example. ",

                h('p', [
                    link("https://www.eff.org/deeplinks/2021/04/am-i-floced-launch", 'Learn more'),
                ]),
            ]));
        };

        $.ajax('/?'+ (+new Date()), {
            complete: function (xhr) {
                var header = xhr.getResponseHeader('permissions-policy');
                printMessage(JSON.stringify(header));
                cb(header === 'interest-cohort=()' || header);
            },
        });
    });

    assert(function (cb, msg) {
        msg.appendChild(h('span', [
            code('/api/broadcast'),
            " could not be loaded. This can be caused by an outdated application server or an incorrectly configured reverse proxy. ",
            "Even if the most recent code has been downloaded it's possible the application server has not been restarted. ",
            "Your browser console may provide more details as to why this resource could not be loaded. ",
        ]));

        $.ajax(cacheBuster('/api/broadcast'), {
            dataType: 'text',
            complete: function (xhr) {
                cb(xhr.status === 200);
            },
        });
    });

    var checkAPIHeaders = function (url, msg, cb) {
        $.ajax(cacheBuster(url), {
            dataType: 'text',
            complete: function (xhr) {
                var allHeaders = xhr.getAllResponseHeaders();
                var headers = {};
                var duplicated = allHeaders.split('\n').some(function (header) {
                    var duplicate;
                    header.replace(/([^:]+):(.*)/, function (all, type, value) {
                        type = type.trim();
                        if (typeof(headers[type]) !== 'undefined') {
                            duplicate = true;
                        }
                        headers[type] = value.trim();
                    });
                    return duplicate;
                });

                var expect = {
                    'cross-origin-resource-policy': 'cross-origin',
                    'cross-origin-embedder-policy': 'require-corp',
                };
                var incorrect = false;

                Object.keys(expect).forEach(function (k) {
                    var response = xhr.getResponseHeader(k);
                    var expected = expect[k];
                    if (response !== expected) {
                        incorrect = true;
                        msg.appendChild(h('p', [
                            'The ',
                            code(k),
                            ' header for ',
                            code(url),
                            " is '",
                            code(response),
                            "' instead of '",
                            code(expected),
                            "' as expected.",
                        ]));

                    }
                });

                if (duplicated || incorrect) { console.debug(allHeaders); }
                cb(!duplicated && !incorrect);
            },
        });
    };

    var INCORRECT_HEADER_TEXT = ' was served with duplicated or incorrect headers. Compare your reverse-proxy configuration against the provided example.';

    assert(function (cb, msg) {
        var url = '/api/config';
        msg.innerText = url + INCORRECT_HEADER_TEXT;
        checkAPIHeaders(url, msg, cb);
    });

    assert(function (cb, msg) {
        var url = '/api/broadcast';
        msg.innerText = url + INCORRECT_HEADER_TEXT;
        checkAPIHeaders(url, msg, cb);
    });

    assert(function (cb, msg) {
        var email = ApiConfig.adminEmail;
        if (typeof(email) === 'string' && email && email !== 'i.did.not.read.my.config@cryptpad.fr') {
            return void cb(true);
        }

        setWarningClass(msg);
        msg.appendChild(h('span', [
            'This instance does not provide a valid ',
            code('adminEmail'),
            ' which can make it difficult to contact its adminstrator to report vulnerabilities or abusive content.',
            " This can be configured on your instance's admin panel. Use the provided ",
            code("Flush cache'"),
            " button for this change to take effect for all users.",
        ]));
        cb(email);
    });

    assert(function (cb, msg) {
        var support = ApiConfig.supportMailbox;
        setWarningClass(msg);
        msg.appendChild(h('span', [
            "This instance's encrypted support ticket functionality has not been enabled. This can make it difficult for its users to safely report issues that concern sensitive information. ",
            "This can be configured via the admin panel's ",
            code('Support'),
            " tab.",
        ]));
        cb(support && typeof(support) === 'string' && support.length === 44);
    });

    assert(function (cb, msg) {
        var adminKeys = ApiConfig.adminKeys;
        if (Array.isArray(adminKeys) && adminKeys.length >= 1 && typeof(adminKeys[0]) === 'string' && adminKeys[0].length === 44) {
            return void cb(true);
        }
        setWarningClass(msg);
        msg.appendChild(h('span', [
            "This instance has not been configured to support web administration. This can be enabled by adding a registered user's public signing key to the ",
            code('adminKeys'),
            ' array in ',
            CONFIG_PATH(),
            '. ',
            RESTART_WARNING(),
        ]));
        cb(false);
    });

    var response = Util.response(function (err) {
        console.error('SANDBOX_ERROR', err);
    });

    var sandboxIframe = h('iframe', {
        class: 'sandbox-test',
        src: cacheBuster(trimmedSafe + '/checkup/sandbox/index.html'),
    });
    document.body.appendChild(sandboxIframe);

    var sandboxIframeReady = Util.mkEvent(true);
    setTimeout(function () {
        sandboxIframeReady.fire("TIMEOUT");
    }, 10 * 1000);

    var postMessage = function (content, cb) {
        try {
            var txid = Util.uid();
            content.txid = txid;
            response.expect(txid, cb, 15000);
            sandboxIframe.contentWindow.postMessage(JSON.stringify(content), '*');
        } catch (err) {
            console.error(err);
        }
    };

    var deferredPostMessage = function (content, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));
        nThen(function (w) {
            sandboxIframeReady.reg(w(function (err) {
                if (!err) { return; }
                w.abort();
                cb(err);
            }));
        }).nThen(function () {
            postMessage(content, cb);
        });
    };

    window.addEventListener('message', function (event) {
        try {
            var msg = JSON.parse(event.data);
            if (msg.command === 'READY') { return void sandboxIframeReady.fire(); }
            if (msg.q === "READY") { return; } // ignore messages from the usual sandboxed iframe
            var txid = msg.txid;
            if (!txid) { return console.log("no handler for ", txid); }
            response.handle(txid, msg.content);
        } catch (err) {
            console.error(event);
            console.error(err);
        }
    });

    var parseCSP = function (CSP) {
        //console.error(CSP);
        var CSP_headers = {};
        CSP.split(";")
        .forEach(function (rule) {
            rule = (rule || "").trim();
            if (!rule) { return; }
            var parts = rule.split(/\s/);
                var first = parts[0];
                var rest = rule.slice(first.length + 1);
                CSP_headers[first] = rest;
                //console.error(rule.trim());
                //console.info("[%s] '%s'", first, rest);
            });
        return CSP_headers;
    };

    var hasUnsafeEval = function (CSP_headers) {
        return /unsafe\-eval/.test(CSP_headers['script-src']);
    };

    var hasUnsafeInline = function (CSP_headers) {
        return /unsafe\-inline/.test(CSP_headers['script-src']);
    };

    var hasOnlyOfficeHeaders = function (CSP_headers) {
        if (!hasUnsafeEval(CSP_headers)) {
            console.error("NO_UNSAFE_EVAL");
            console.log(CSP_headers);
            return false;
        }
        if (!hasUnsafeInline(CSP_headers)) {
            console.error("NO_UNSAFE_INLINE");
            return void false;
        }
        return true;
    };

    var CSP_WARNING = function (url) {
         return h('span', [
            code(url),
            ' does not have the required ',
            code("'content-security-policy'"),
            ' headers set. This is most often related to incorrectly configured sandbox domains or reverse proxies.',
        ]);
    };

    assert(function (_cb, msg) {
        var url = '/sheet/inner.html';
        var cb = Util.once(Util.mkAsync(_cb));
        msg.appendChild(CSP_WARNING(url));
        deferredPostMessage({
            command: 'GET_HEADER',
            content: {
                url: url,
                header: 'content-security-policy',
            },
        }, function (content) {
            var CSP_headers = parseCSP(content);
            cb(hasOnlyOfficeHeaders(CSP_headers));
        });
    });

    assert(function (cb, msg) {
        var url = '/common/onlyoffice/v4/web-apps/apps/spreadsheeteditor/main/index.html';
        msg.appendChild(CSP_WARNING(url));
        deferredPostMessage({
            command: 'GET_HEADER',
            content: {
                url: url,
                header: 'content-security-policy',
            },
        }, function (content) {
            var CSP_headers = parseCSP(content);
            cb(hasOnlyOfficeHeaders(CSP_headers));
        });
    });

    assert(function (cb, msg) {
        var url = '/sheet/inner.html';
        msg.appendChild(h('span', [
            code(url),
            ' does not have the required ',
            code("'cross-origin-opener-policy'"),
            ' headers set.',
        ]));
        deferredPostMessage({
            command: 'GET_HEADER',
            content: {
                url: url,
                header: 'cross-origin-opener-policy',
            },
        }, function (content) {
            cb(content === 'same-origin');
        });
    });

    var isHTTPS = function (host) {
        return /^https:\/\//.test(host);
    };

    var isOnion = function (host) {
        return /\.onion$/.test(host);
    };
    assert(function (cb, msg) {
        // provide an exception for development instances
        if (/http:\/\/localhost/.test(trimmedUnsafe)) { return void cb(true); }

        // if both the main and sandbox domains are onion addresses
        // then the HTTPS requirement is unnecessary
        if (isOnion(trimmedUnsafe) && isOnion(trimmedSafe)) { return void cb(true); }

        // otherwise expect that both inner and outer domains use HTTPS
        setWarningClass(msg);

        msg.appendChild(h('span', [
            "Both ",
            code('httpUnsafeOrigin'),
            ' and ',
            code('httpSafeOrigin'),
            ' should be accessed via HTTPS for production use. ',
            "This can be configured via ",
            CONFIG_PATH(),
            '. ',
            RESTART_WARNING(),
        ]));

        console.error("HTTPS?", trimmedUnsafe, trimmedSafe);
        cb(isHTTPS(trimmedUnsafe) && isHTTPS(trimmedSafe));
    });

    if (false) {
        assert(function (cb, msg) {
            msg.innerText = 'fake test to simulate failure';
            cb(false);
        });
    }

    var row = function (cells) {
        return h('tr', cells.map(function (cell) {
            return h('td', cell);
        }));
    };

    var failureReport = function (obj) {
        var printableValue = obj.output;
        try {
            printableValue = JSON.stringify(obj.output);
        } catch (err) {
            console.error(err);
        }

        return h('div.error', [
            h('h5', obj.message),
            h('table', [
                row(["Failed test number", obj.test + 1]),
                row(["Returned value", code(printableValue)]),
            ]),
        ]);
    };

    var completed = 0;
    var $progress = $('#cp-progress');

    var versionStatement = function () {
        return h('p', [
            "This instance is running ",
            h('span.cp-app-checkup-version',[
                "CryptPad",
                ' ',
                Pages.versionString,
            ]),
            '.',
        ]);
    };

    Assert.run(function (state) {
        var errors = state.errors;
        var failed = errors.length;

        Messages.assert_numberOfTestsPassed = "{0} / {1} tests passed.";

        var statusClass = failed? 'failure': 'success';

        var failedDetails = "Details found below";
        var successDetails = "This checkup only tests the most common configuration issues. You may still experience errors or incorrect behaviour.";
        var details = h('p', failed? failedDetails: successDetails);

        var summary = h('div.summary.' + statusClass, [
            versionStatement(),
            h('p', Messages._getKey('assert_numberOfTestsPassed', [
                state.passed,
                state.total
            ])),
            details,
        ]);

        var report = h('div.report', [
            summary,
            h('div.failures', errors.map(failureReport)),
        ]);

        $progress.remove();
        $('body').prepend(report);
        try {
            console.log('closing shared websocket');
            shared_websocket.close();
        } catch (err) { console.error(err); }
        try {
            console.log('closing shared realtime');
            shared_realtime.network.disconnect();
        } catch (err) { console.error(err); }
    }, function (i, total) {
        console.log('test '+ i +' completed');
        completed++;
        Messages.assert_numberOfTestsCompleted = "{0} / {1} tests completed.";
        $progress.html('').append(h('div.report.pending.summary', [
            versionStatement(),
            h('p', [
                h('i.fa.fa-spinner.fa-pulse'),
                h('span', Messages._getKey('assert_numberOfTestsCompleted', [completed, total]))
            ])
        ]));
    });
});
