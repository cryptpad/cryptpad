require.config({ paths: { 'json.sortify': '/bower_components/json.sortify/dist/JSON.sortify' } });
define([
    '/bower_components/jquery/dist/jquery.min.js',
    '/common/hyperjson.js', // serializing classes as an attribute
    '/common/hyperscript.js', // using setAttribute
    '/common/TextPatcher.js',
    'json.sortify',
], function (jQuery, Hyperjson, Hyperscript, TextPatcher, JSONSortify) {
    var $ = window.jQuery;
    window.Hyperjson = Hyperjson;
    window.Hyperscript = Hyperscript;
    window.TextPatcher = TextPatcher;

    var assertions = 0;
    var failed = false;
    var failedOn;
    var failMessages = [];

    var ASSERTS = [];
    var runASSERTS = function () {
        ASSERTS.forEach(function (f, index) {
            f(index);
        });
    };

    var assert = function (test, msg) {
        ASSERTS.push(function (i) {
            if (test()) {
                assertions++;
            } else {
                failed = true;
                failedOn = assertions;
                failMessages.push({
                    test: i,
                    message: msg
                });
            }
        });
    };

    var $body = $('body');

    /*  FIXME
        Chrome reorganizes your HTML such that id and class are in a opposite
        orders. We need to do an equality check on the hyperjson, outerHTML
        differences are not informative. */
    var roundTrip = function (target) {
        assert(function () {
            var hjson = Hyperjson.fromDOM(target);
            var cloned = Hyperjson.callOn(hjson, Hyperscript);

            var success = cloned.outerHTML === target.outerHTML;

            if (!success) {
                var op = TextPatcher.diff(target.outerHTML, cloned.outerHTML);
                window.DEBUG = {
                    error: "Expected equality between A and B",
                    A: target.outerHTML,
                    B: cloned.outerHTML,
                    diff: op
                };
                console.log(JSON.stringify(window.DEBUG, null, 2));
                TextPatcher.log(op);
            }

            return success;
        }, "Round trip serialization introduced artifacts.");
    };

    [   '#target',
        '#widget',
        '#quot',
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

    //assert(function () { }, "this is expected to fail");

    /*  TODO Test how browsers handle weird elements
        like "_moz-resizing":"true"

        and anything else you can think of.

        Start with Hyperjson, turn it into a DOM and come back
    */

    var swap = function (str, dict) {
        return str.replace(/\{\{(.*?)\}\}/g, function (all, key) {
            return typeof dict[key] !== 'undefined'? dict[key] : all;
        });
    };

    var multiline = function (f) {
        var str;
        f.toString().replace(/\/\*([\s\S]*)\*\//g, function (all, out) {
            str = out;
        });
        return str || '';
    };

    var formatFailures = function () {
        var template = multiline(function () { /*
<pre class="error">
Failed on test number {{test}} with error:
> "{{message}}"
</pre>
<br>

*/});
        return failMessages.map(function (obj) {
            console.log(obj);
            return swap(template, obj);
        }).join("\n");
    };

    runASSERTS();

    $("body").html(function (i, val) {
        var dict = {
            previous: val,
            totalAssertions: ASSERTS.length,
            passedAssertions: assertions,
            plural: (assertions === 1? '' : 's'),
            failMessages: formatFailures()
        };

        var SUCCESS = swap(multiline(function(){/*
<div class="report">{{passedAssertions}} / {{totalAssertions}} test{{plural}} passed.

{{failMessages}}

</div>


{{previous}}
        */}), dict);

        var report = SUCCESS;

        return report;
    });

    var $report = $('.report');
    $report.addClass(failed?'failure':'success');

});
