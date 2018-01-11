define([], function () {
    if (window.__CRYPTPAD_TEST_OBJ_) { return window.__CRYPTPAD_TEST_OBJ_; }

    var locks = [];
    var tests = [];
    var failed = false;
    var totalTests = 0;
    var out = window.__CRYPTPAD_TEST_OBJ__ = function (f) {
        if (!out.testing) { return; }
        tests.push(f);
        totalTests++;
        var runLock = function (lock) {
            lock(function () { setTimeout(function () { runLock(locks.shift()); }); });
        };
        f({
            pass: function () {
                if (failed) { return; }
                var i = tests.indexOf(f);
                if (i === -1) {
                    throw new Error("Pass called on an unknown test (called multiple times?)");
                }
                tests.splice(i, 1);
                if (!tests.length) {
                    console.log("Completed " + totalTests + " successfully");
                    out.passed();
                }
            },
            fail: function (reason) {
                failed = true;
                out.failed(reason);
            },
            lock: function (f) {
                locks.push(f);
                if (locks.length === 1) {
                    runLock(locks.shift());
                }
            },
            assert: function (expr) {
                if (expr || failed) { return; }
                failed = true;
                out.failed("Failed assertion");
            }
        });
    };

    out.passed = out.failed = out;
    var enableAuto = function () {
        console.log("Enable auto testing 1 " + window.origin);
        if (window.__CRYPTPAD_TEST__) { return; }
        var cpt = window.__CRYPTPAD_TEST__ = {
            data: [],
            getData: function () {
                var data = JSON.stringify(cpt.data);
                cpt.data = [];
                return data;
            }
        };

        // jshint -W103
        var errProto = (new Error()).__proto__;
        var doLog = function (o) {
            var s;
            if (typeof(o) === 'object' && o.__proto__ === errProto) {
                s = JSON.stringify([ o.message, o.stack ]);
            } else if (typeof(s) !== 'string') {
                try {
                    s = JSON.stringify(o);
                } catch (e) {
                    s = String(o);
                }
            }
            var out = [s];
            try { throw new Error(); } catch (e) { out.push(e.stack.split('\n')[3]); }
            cpt.data.push({ type: 'log', val: out.join('') });
        };

        window.console._error = window.console.error;
        window.console._log = window.console.log;
        window.console.error = function (e) { window.console._error(e); doLog(e); };
        window.console.log = function (l) { window.console._log(l); doLog(l); };

        window.onerror = function (msg, url, lineNo, columnNo, e) {
            cpt.data.push({
                type: 'report',
                val: 'failed',
                error: {
                    message: e ? e.message : msg,
                    stack: e ? e.stack : (url + ":" + lineNo)
                }
            });
        };
        require.onError = function (e) {
            cpt.data.push({
                type: 'report',
                val: 'failed',
                error: { message: e.message, stack: e.stack }
            });
        };
        out.testing = 'auto';
        out.passed = function () {
            cpt.data.push({
                type: 'report',
                val: 'passed'
            });
        };
        out.failed = function (reason) {
            var e;
            try { throw new Error(reason); } catch (err) { e = err; }
            cpt.data.push({
                type: 'report',
                val: 'failed',
                error: { message: e.message, stack: e.stack }
            });
        };

        out.registerInner = function (sframeChan) {
            sframeChan.whenReg('EV_TESTDATA', function () {
                cpt.data.forEach(function (x) { sframeChan.event('EV_TESTDATA', x); });
                // override cpt.data.push() with a function which will send the content to the
                // outside where it will go on the outer window cpt.data array.
                cpt = window.__CRYPTPAD_TEST__ = {
                    data: {
                        push: function (elem) {
                            sframeChan.event('EV_TESTDATA', elem);
                        }
                    },
                    getData: function () {
                        throw new Error('getData should never be called from the inside');
                    }
                };
            });
        };
        out.registerOuter = function (sframeChan) {
            sframeChan.on('EV_TESTDATA', function (data) { cpt.data.push(data); });
        };
    };
    var enableManual = function () {
        out.testing = 'manual';
        console.log('manual testing enabled');
        out.passed = function () {
            window.alert("Test passed");
        };
        out.failed = function (reason) {
            try { throw new Error(reason); } catch (err) { console.log(err.stack); }
            window.alert("Test failed [" + reason + "]");
        };
        out.registerInner = function () { };
        out.registerOuter = function () { };
    };

    out.options = {};
    out.testing = false;
    out.registerInner = function () { };
    out.registerOuter = function () { };

    if (document.cookie.indexOf('test=') === 0) {
        try {
            var x = JSON.parse(decodeURIComponent(document.cookie.replace('test=', '')));
            if (x.test === 'auto') {
                out.options = x.opts;
                enableAuto('auto');
                console.log("Enable auto testing " + window.origin);
            } else if (x.test === 'manual') {
                out.options = x.opts;
                enableManual();
                console.log("Enable manual testing " + window.origin);
            }
        } catch (e) { }
    }

    return out;
});
