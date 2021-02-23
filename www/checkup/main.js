define([
    'jquery',
    '/api/config',
    '/assert/assertions.js',
    '/common/hyperscript.js',
    '/customize/messages.js',

    '/bower_components/tweetnacl/nacl-fast.min.js',
    'less!/customize/src/less2/pages/page-assert.less',
], function ($, ApiConfig, Assertions, h, Messages) {
    var assert = Assertions();

    assert(function (cb) {
        var c = ApiConfig;
        cb(Boolean(c.httpUnsafeOrigin && c.httpSafeOrigin));
    }, "Sandbox configuration: ensure that both httpUnsafeOrigin and httpSafeOrigin are defined"); // XXX

    assert(function (cb) {
        var c = ApiConfig;
        return void cb(c.httpUnsafeOrigin !== c.httpSafeOrigin);
    }, 'Sandbox configuration: httpUnsafeOrigin !== httpSafeOrigin'); // XXX

    assert(function (cb) {
        cb((window.location.origin + '/') === ApiConfig.httpUnsafeOrigin);
    }, 'Sandbox configuration: loading via httpUnsafeOrigin'); // XXX

    assert.run(function (state) {
        var errors = state.errors;
        var failed = errors.length;

        Messages.assert_numberOfTestsPassed = "{0} / {1} tests passed.";

        var statusClass = failed? 'failure': 'success';
        $('body').prepend(h('div.report.' + statusClass, [
            Messages._getKey('assert_numberOfTestsPassed', [
                state.passed,
                state.total
            ]),
            h('div.failures', errors.map(function (obj) {
                return h('p.error', [
                    h('p', "Test number: " + obj.test),
                    h('p', "Error message: " + obj.message),
                    h('p', "Returned value: " + obj.output),
                    h('br'),
                ]);
            })),
        ]));
    });
});
