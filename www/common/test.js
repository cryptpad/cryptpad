define([], function () {
    var out = function () { };
    out.passed = out;
    var mkReport = function (list, pass) {
        var rpt = document.createElement('div');
        rpt.textContent = JSON.stringify(list);
        rpt.setAttribute('class', 'report ' + (pass ? 'success' : 'failure'));
        rpt.setAttribute('style', 'display:none;');
        document.body.appendChild(rpt);
    }
    if (window.location.hash.indexOf("?test=test") > -1) {
        window.onerror = function (msg, url, lineNo, columnNo, e) {
            mkReport([
                msg,
                url,
                lineNo,
                columnNo,
                e ? e.message : null,
                e ? e.stack : null
            ]);
        };
        require.onError = function (e) {
            mkReport([
                e ? e.message : null,
                e ? e.stack : null
            ]);
        };
        out = function (f) { f(); };
        out.passed = function () { mkReport("Test Passed", true); };

        var cpt = window.__CRYPTPAD_TEST__ = {
            logs: [],
            getLogs: function () {
                var logs = JSON.stringify(cpt.logs);
                cpt.logs = [];
                return logs;
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
            window.__CRYPTPAD_TEST__.logs.push(out);
        };

        window.console._error = window.console.error;
        window.console._log = window.console.log;
        window.console.error = function (e) { window.console._error(e); doLog(e); };
        window.console.log = function (l) { window.console._log(l); doLog(l); };
    }
    return out;
});