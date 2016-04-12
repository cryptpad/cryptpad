define([
    '/bower_components/jquery/dist/jquery.min.js',
    '/assert/hyperjson.js', // serializing classes as an attribute
    '/assert/hyperscript.js', // using setAttribute
    '/common/TextPatcher.js'
], function (jQuery, Hyperjson, Hyperscript, TextPatcher) {
    var $ = window.jQuery;
    window.Hyperjson = Hyperjson;
    window.Hyperscript = Hyperscript;
    window.TextPatcher = TextPatcher;

    var assertions = 0;

    var assert = function (test, msg) {
        if (test()) {
            assertions++;
        } else {
            throw new Error(msg || '');
        }
    };

    var $body = $('body');

    var roundTrip = function (target) {
        assert(function () {
            var hjson = Hyperjson.fromDOM(target);
            var cloned = Hyperjson.callOn(hjson, Hyperscript);

            var success = cloned.outerHTML === target.outerHTML;

            if (!success) {
                window.DEBUG = {
                    error: "Expected equality between A and B",
                    A: target.outerHTML,
                    B: cloned.outerHTML,
                    target: target,
                    diff: TextPatcher.diff(target.outerHTML, cloned.outerHTML)
                };
                console.log(JSON.stringify(window.DEBUG, null, 2));
            }

            return success;
        }, "Round trip serialization introduced artifacts.");
    };

    roundTrip($('#target')[0]);
    roundTrip($('#widget')[0]);

    console.log("%s test%s passed", assertions, assertions === 1? '':'s');
});
