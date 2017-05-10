define([
    'jquery',
    '/bower_components/hyperjson/hyperjson.js',
    '/bower_components/textpatcher/TextPatcher.amd.js',
    'json.sortify',
    '/common/cryptpad-common.js',
], function ($, Hyperjson, TextPatcher, Sortify, Cryptpad) {
    window.Hyperjson = Hyperjson;
    window.TextPatcher = TextPatcher;
    window.Sortify = Sortify;

    var assertions = 0;
    var failed = false;
    var failedOn;
    var failMessages = [];

    var ASSERTS = [];
    var runASSERTS = function (cb) {
        var count = ASSERTS.length;
        var successes = 0;

        var done = function (err) {
            count--;
            if (err) { failMessages.push(err); }
            else { successes++; }
            if (count === 0) { cb(); }
        };

        ASSERTS.forEach(function (f, index) {
            f(function (err) {
                done(err, index);
            }, index);
        });
    };

    var assert = function (test, msg) {
        ASSERTS.push(function (cb, i) {
            test(function (result) {
                if (result === true) {
                    assertions++;
                    cb();
                } else {
                    failed = true;
                    failedOn = assertions;
                    cb({
                        test: i,
                        message: msg,
                        output: result,
                    });
                }
            });
        });
    };

    var HJSON_list = [
        '["DIV",{"id":"target"},[["P",{"class":" alice bob charlie has.dot","id":"bang"},["pewpewpew"]]]]',

        '["DIV",{"id":"quot"},[["P",{},["\\"pewpewpew\\""]]]]',

        '["DIV",{"id":"widget"},[["DIV",{"class":"cke_widget_wrapper cke_widget_block","contenteditable":"false","data-cke-display-name":"macro:velocity","data-cke-filter":"off","data-cke-widget-id":"0","data-cke-widget-wrapper":"1","tabindex":"-1"},[["DIV",{"class":"macro cke_widget_element","data-cke-widget-data":"%7B%22classes%22%3A%7B%22macro%22%3A1%7D%7D","data-cke-widget-keep-attr":"0","data-cke-widget-upcasted":"1","data-macro":"startmacro:velocity|-||-|Here is a macro","data-widget":"xwiki-macro"},[["P",{},["Here is a macro"]]]],["SPAN",{"class":"cke_reset cke_widget_drag_handler_container","style":"background: rgba(220, 220, 220, 0.5) url(\\"/customize/cryptofist_small.png\\") repeat scroll 0% 0%; top: -15px; left: 0px; display: block;"},[["IMG",{"class":"cke_reset cke_widget_drag_handler","data-cke-widget-drag-handler":"1","height":"15","src":"data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==","title":"Click and drag to move","width":"15"},[]]]]]]]]',

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
        assert(function (cb) {
            // parse your stringified Hyperjson
            var hjson;

            try {
                hjson = JSON.parse(shjson);
            } catch (e) {
                console.log(e);
                return false;
            }

            // turn it into a DOM
            var DOM = Hyperjson.toDOM(hjson);

            // turn it back into stringified Hyperjson, but apply filters
            var shjson2 = Sortify(Hyperjson.fromDOM(DOM, elementFilter, attributeFilter));

            var success = shjson === shjson2;

            var op = TextPatcher.diff(shjson, shjson2);

            var diff = TextPatcher.format(shjson, op);

            if (success) {
                return cb(true);
            } else {
                return  cb('<br><br>insert: ' + diff.insert + '<br><br>' +
                        'remove: ' + diff.remove + '<br><br>');
            }
        },  "expected hyperjson equality");
    };

    HJSON_list.map(HJSON_equal);

    var roundTrip = function (sel) {
        var target = $(sel)[0];
        assert(function (cb) {
            var hjson = Hyperjson.fromDOM(target);
            var cloned = Hyperjson.toDOM(hjson);
            var success = cloned.outerHTML === target.outerHTML;

            if (!success) {
                var op = TextPatcher.diff(target.outerHTML, cloned.outerHTML);
                window.DEBUG = {
                    error: "Expected equality between A and B",
                    A: target.outerHTML,
                    B: cloned.outerHTML,
                    diff: op
                };
                console.log("DIFF:");
                TextPatcher.log(target.outerHTML, op);
            }

            return cb(success);
        }, "Round trip serialization introduced artifacts.");
    };

    var HTML_list = [
        '#target',
        '#widget',
        '#quot',
    ];

    HTML_list.forEach(roundTrip);

    var strungJSON = function (orig) {
        var result;
        assert(function (cb) {
            result = JSON.stringify(JSON.parse(orig));
            return cb(result === orig);
        }, "expected result (" + result + ") to equal original (" + orig + ")");
    };

    [   '{"border":"1","style":{"width":"500px"}}',
        '{"style":"width: 500px;","border":"1"}',
    ].forEach(function (orig) {
        strungJSON(orig);
    });

    // check that old hashes parse correctly
    assert(function (cb) {
        var secret = Cryptpad.parseHash('67b8385b07352be53e40746d2be6ccd7XAYSuJYYqa9NfmInyHci7LNy');
        return cb(secret.channel === "67b8385b07352be53e40746d2be6ccd7" &&
            secret.key === "XAYSuJYYqa9NfmInyHci7LNy" &&
            secret.version === 0);
    }, "Old hash failed to parse");

    // make sure version 1 hashes parse correctly
    assert(function (cb) {
        var secret = Cryptpad.parseHash('/1/edit/3Ujt4F2Sjnjbis6CoYWpoQ/usn4+9CqVja8Q7RZOGTfRgqI');
        return cb(secret.version === 1 &&
            secret.mode === "edit" &&
            secret.channel === "3Ujt4F2Sjnjbis6CoYWpoQ" &&
            secret.key === "usn4+9CqVja8Q7RZOGTfRgqI" &&
            !secret.present);
    }, "version 1 hash failed to parse");

    // test support for present mode in hashes
    assert(function (cb) {
        var secret = Cryptpad.parseHash('/1/edit/CmN5+YJkrHFS3NSBg-P7Sg/DNZ2wcG683GscU4fyOyqA87G/present');
        return cb(secret.version === 1
            && secret.mode === "edit"
            && secret.channel === "CmN5+YJkrHFS3NSBg-P7Sg"
            && secret.key === "DNZ2wcG683GscU4fyOyqA87G"
            && secret.present);
    }, "version 1 hash failed to parse");

    // test support for present mode in hashes
    assert(function (cb) {
        var secret = Cryptpad.parseHash('/1/edit//CmN5+YJkrHFS3NSBg-P7Sg/DNZ2wcG683GscU4fyOyqA87G//present');
        return cb(secret.version === 1
            && secret.mode === "edit"
            && secret.channel === "CmN5+YJkrHFS3NSBg-P7Sg"
            && secret.key === "DNZ2wcG683GscU4fyOyqA87G"
            && secret.present);
    }, "Couldn't handle multiple successive slashes");

    // test support for trailing slash
    assert(function (cb) {
        var secret = Cryptpad.parseHash('/1/edit/3Ujt4F2Sjnjbis6CoYWpoQ/usn4+9CqVja8Q7RZOGTfRgqI/');
        return cb(secret.version === 1 &&
            secret.mode === "edit" &&
            secret.channel === "3Ujt4F2Sjnjbis6CoYWpoQ" &&
            secret.key === "usn4+9CqVja8Q7RZOGTfRgqI" &&
            !secret.present);
    }, "test support for trailing slashes in version 1 hash failed to parse");

    assert(function (cb) {
        // TODO
        return cb(true);
    }, "version 2 hash failed to parse correctly");

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

    runASSERTS(function () {
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

});
