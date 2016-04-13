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
    var failed = false;
    var failedOn;
    var failMessage;

    var assert = function (test, msg) {
        if (test()) {
            assertions++;
        } else {
            failed = true;
            failedOn = assertions;
            failMessage = msg;
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

    [   '#target',
        '#widget',
    ].forEach(function (sel) {
        roundTrip($(sel)[0]);
    });

    var strungJSON = function (orig) {
        var result;
        assert(function () {
            result = JSON.stringify(JSON.parse(orig));
            return result === orig;
        }, "expected result (" + result + ") to equal original (" + orig + ")");
    };

    [   '{"border":"1","style":{"width":"500px"}}',
        '{"style":{"width":"500px"},"border":"1"}',
    ].forEach(function (orig) {
        strungJSON(orig);
    });

    /*  TODO Test how browsers handle weird elements
        like "_moz-resizing":"true"

        and anything else you can think of.

        Start with Hyperjson, turn it into a DOM and come back
    */


    // report successes

    var swap = function (str, dict) {
        return str.replace(/\{\{(.*?)\}\}/g, function (all, key) {
            return dict[key] || all;
        });
    };

    var multiline = function (f) {
        var str;
        f.toString().replace(/\/\*(.*)\*\\/g, function (all, out) {
            str = out;
        });
        return str;
    };

    $("body").html(function (i, val) {
        var dict = {
            previous: val,
            passedAssertions: assertions,
            plural: (assertions === 1? '' : 's'),
        };

        var SUCCESS = swap(multiline(function(){/*
<h3 class="report">{{passedAssertions}} test{{plural}} passed.</h3>

{{previous}}
        */}), dict);

        var FAILURE = swap(


        return report;
    });

    console.log(report);
});
