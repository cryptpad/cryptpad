define([], function () {
    var out = function () { };
    out.passed = out.failed = out;
    if (window.location.hash.indexOf("test=auto") > -1) {
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
        out = function (f) { f(); };
        out.testing = true;
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
                cpt.data.forEach(function (x) { sframeChan.fire('EV_TESTDATA', x); });
                // override cpt.data.push() with a function which will send the content to the
                // outside where it will go on the outer window cpt.data array.
                cpt = window.__CRYPTPAD_TEST__ = {
                    data: {
                        push: function (elem) {
                            sframeChan.fire('EV_TESTDATA', elem);
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

    } else if (window.location.hash.indexOf("test=manual") > -1) {
        out = function (f) { f(); };
        out.testing = true;
        out.passed = function () {
            window.alert("Test passed");
        };
        out.failed = function (reason) {
            window.alert("Test failed [" + reason + "]");
        };
        out.registerInner = function () { };
        out.registerOuter = function () { };
    } else {
        out.testing = false;
        out.registerInner = function () { };
        out.registerOuter = function () { };
    }
    return out;
});
