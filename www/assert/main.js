require.config({ paths: { 'json.sortify': '/bower_components/json.sortify/dist/JSON.sortify' } });
define([
    '/bower_components/jquery/dist/jquery.min.js',
    '/common/hyperjson.js', // serializing classes as an attribute
    '/common/hyperscript.js', // using setAttribute
    '/bower_components/textpatcher/TextPatcher.amd.js',
    'json.sortify',
], function (jQuery, Hyperjson, Hyperscript, TextPatcher, Sortify) {
    var $ = window.jQuery;
    window.Hyperjson = Hyperjson;
    window.Hyperscript = Hyperscript;
    window.TextPatcher = TextPatcher;
    window.Sortify = Sortify;

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
            var returned = test();
            if (returned === true) {
                assertions++;
            } else {
                failed = true;
                failedOn = assertions;
                failMessages.push({
                    test: i,
                    message: msg,
                    output: returned,
                });
            }
        });
    };

    var $body = $('body');

    var HJSON_list = [
        '["DIV#target",{},[["P#bang",{"class":" alice bob charlie has.dot"},["pewpewpew"]]]]',

        '["DIV#quot",{},[["P",{},["\\"pewpewpew\\""]]]]',

        '["DIV#widget",{},[["DIV",{"class":"cke_widget_wrapper cke_widget_block","contenteditable":"false","data-cke-display-name":"macro:velocity","data-cke-filter":"off","data-cke-widget-id":"0","data-cke-widget-wrapper":"1","tabindex":"-1"},[["DIV",{"class":"macro cke_widget_element","data-cke-widget-data":"%7B%22classes%22%3A%7B%22macro%22%3A1%7D%7D","data-cke-widget-keep-attr":"0","data-cke-widget-upcasted":"1","data-macro":"startmacro:velocity|-||-|Here is a macro","data-widget":"xwiki-macro"},[["P",{},["Here is a macro"]]]],["SPAN",{"class":"cke_reset cke_widget_drag_handler_container","style":"background: rgba(220, 220, 220, 0.5) url(\\"/customize/cryptofist_small.png\\") repeat scroll 0% 0%; top: -15px; left: 0px; display: block;"},[["IMG",{"class":"cke_reset cke_widget_drag_handler","data-cke-widget-drag-handler":"1","height":"15","src":"data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==","title":"Click and drag to move","width":"15"},[]]]]]]]]',

    ];

    var elementFilter = function () {
        // pass everything
        return true;
    };

    var attributeFilter = function (h) {
        // don't filter anything
        return h;
    };

    var HJSON_equal = function (shjson) {
        assert(function () {
            // parse your stringified Hyperjson
            var hjson;

            try {
                hjson = JSON.parse(shjson);
            } catch (e) {
                console.log(e);
                return false;
            }

            // turn it into a DOM
            var DOM = Hyperjson.callOn(hjson, Hyperscript);

            // turn it back into stringified Hyperjson, but apply filters
            var shjson2 = Sortify(Hyperjson.fromDOM(DOM, elementFilter, attributeFilter));

            var success = shjson === shjson2;

            var op = TextPatcher.diff(shjson, shjson2);
            //console.log(TextPatcher.format(shjson, op));

            var diff = TextPatcher.format(shjson, op);

            if (success) {
                return true;
            } else {
                return  '<br><br>insert: ' + diff.insert + '<br><br>' +
                        'remove: ' + diff.remove + '<br><br>';
            }
        },  "expected hyperjson equality");
    };

    HJSON_list.map(HJSON_equal);

    /*  FIXME
        This test is not correct. It passes in Firefox, but fails in Chrome,
        even though for our purposes the produced code is valid. Passing
        `<p class="bob" id="alice"></p>` through the function yields
        `<p id="alice" class="bob"></p>`. This is the same element, but string
        equality is not a correct metric.  */
    var roundTrip = function (sel) {
        var target = $(sel)[0];
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
                //console.log(JSON.stringify(window.DEBUG, null, 2));
                console.log("DIFF:");
                TextPatcher.log(target.outerHTML, op);
            }

            return success;
        }, "Round trip serialization introduced artifacts.");
    };

    var HTML_list = [
        '#target',
        '#widget', // fails in Firefox 19?
        '#quot',
    ];

    HTML_list.forEach(roundTrip);

    var strungJSON = function (orig) {
        var result;
        assert(function () {
            result = JSON.stringify(JSON.parse(orig));
            return result === orig;
        }, "expected result (" + result + ") to equal original (" + orig + ")");
    };

    [   '{"border":"1","style":{"width":"500px"}}',
        '{"style":"width: 500px;","border":"1"}',
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
<p class="error">
Failed on test number {{test}} with error message:
"{{message}}"

</p>
<p>
The test returned:
{{output}}
</p>

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
