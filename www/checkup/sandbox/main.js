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
    var assert = function (f, msg) {
        Assert(f, msg || h('span.advisory-text.cp-danger'));
    };

    var code = function (content) {
        return h('code', content);
    };

    var getHeaders = function (url, cb) {
        $.ajax(url + "?test=" + (+new Date()), {
            dataType: 'text',
            complete: function (xhr) {
                var allHeaders = xhr.getAllResponseHeaders();
                return void cb(void 0, allHeaders, xhr);
            },
        });
    };
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
                console.info("[%s] '%s'", first, rest);
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

    // XXX run these from /checkup/inner.js and report to /checkup/main.js
    assert(function (cb, msg) {
        var url = '/sheet/inner.html';
        msg.appendChild(h('span', [
            code(url),
            ' has the wrong headers.',
        ]));
        getHeaders(url, function (err, headers, xhr) {
            var CSP_headers = parseCSP(xhr.getResponseHeader('content-security-policy'));
            cb(hasOnlyOfficeHeaders(CSP_headers));
        });
    });

    assert(function (cb, msg) {
        var url = '/common/onlyoffice/v4/web-apps/apps/spreadsheeteditor/main/index.html';
        msg.appendChild(h('span', [
            code(url),
            ' has the wrong headers.',
        ]));
        getHeaders(url, function (err, headers, xhr) {
            var CSP_headers = parseCSP(xhr.getResponseHeader('content-security-policy'));
            cb(hasOnlyOfficeHeaders(CSP_headers));
        });
    });

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
