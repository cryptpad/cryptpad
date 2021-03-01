define([
    'jquery',
    '/api/config',
    '/assert/assertions.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/common/sframe-common-outer.js',


    '/bower_components/tweetnacl/nacl-fast.min.js',
    'less!/customize/src/less2/pages/page-checkup.less',
], function ($, ApiConfig, Assertions, h, Messages /*, SFCommonO*/) {
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
        cb((window.location.origin + '/') === ApiConfig.httpUnsafeOrigin);
    }, _alert('Sandbox configuration: loading via httpUnsafeOrigin'));


    var checkAvailability = function (url, cb) {
        $.ajax({
            url: url,
            date: {},
            complete: function (xhr) {
                cb(xhr.status === 200);
            },
        });
    };

    assert(function (cb) {
        checkAvailability(trimmedUnsafe, cb);
    }, _alert("Main domain is not available"));

    assert(function (cb) {
        console.log(trimmedSafe);
        checkAvailability(trimmedSafe, cb);
    }, _alert("Sandbox domain is not available")); // FIXME Blocked by CSP. try loading it via sframe ?

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

        $('body').prepend(report);
    });
});
