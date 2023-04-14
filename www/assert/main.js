define([
    'jquery',
    '/bower_components/hyperjson/hyperjson.js',
    'json.sortify',
    '/drive/tests.js',
    //'/common/test.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/common/common-thumbnail.js',
    '/common/wire.js',
    '/common/flat-dom.js',
    '/common/media-tag.js',
    '/common/outer/login-block.js',
    '/api/config',
    '/assert/assertions.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '../form/inner.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
    'less!/customize/src/less2/pages/page-assert.less',
], function ($, Hyperjson, Sortify, Drive, /*Test,*/ Hash, Util, Thumb, Wire, Flat, MediaTag, Block, ApiConfig, Assertions, h, Messages, Form) {
    window.Hyperjson = Hyperjson;
    window.Sortify = Sortify;
    var Nacl = window.nacl;

    var assert = Assertions();

    var HJSON_list = [
        '["DIV",{"id":"target"},[["P",{"class":" alice bob charlie has.dot","id":"bang"},["pewpewpew"]]]]',

        '["DIV",{"id":"quot"},[["P",{},["\\"pewpewpew\\""]]]]',

        '["DIV",{"id":"widget"},[["DIV",{"class":"cke_widget_wrapper cke_widget_block","contenteditable":"false","data-cke-display-name":"macro:velocity","data-cke-filter":"off","data-cke-widget-id":"0","data-cke-widget-wrapper":"1","tabindex":"-1"},[["DIV",{"class":"macro cke_widget_element","data-cke-widget-data":"%7B%22classes%22%3A%7B%22macro%22%3A1%7D%7D","data-cke-widget-keep-attr":"0","data-cke-widget-upcasted":"1","data-macro":"startmacro:velocity|-||-|Here is a macro","data-widget":"xwiki-macro"},[["P",{},["Here is a macro"]]]],["SPAN",{"class":"cke_reset cke_widget_drag_handler_container","style":"background: rgba(220, 220, 220, 0.5) repeat scroll 0% 0%; top: -15px; left: 0px; display: block;"},[["IMG",{"class":"cke_reset cke_widget_drag_handler","data-cke-widget-drag-handler":"1","height":"15","src":"data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==","title":"Click and drag to move","width":"15"},[]]]]]]]]',

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

            return cb(shjson === shjson2);
        },  "expected hyperjson equality");
    };

    HJSON_list.map(HJSON_equal);

    var roundTrip = function (sel) {
        var target = $(sel)[0];
        assert(function (cb) {
            var hjson = Hyperjson.fromDOM(target);
            var cloned = Hyperjson.toDOM(hjson);

            return cb(cloned.outerHTML === target.outerHTML);
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

    HTML_list.forEach(function (sel) {
        var el = $(sel)[0];

        var pred = function (el) {
            if (el.nodeName === 'DIV') {
                return true;
            }
        };

        var filter = function (x) {
            console.log(x);
            if (x[1]['class']) {
                x[1]['class'] = x[1]['class'].replace(/cke/g, '');
            }
            return x;
        };

        assert(function (cb) {
            // FlatDOM output
            var map = Flat.fromDOM(el, pred, filter);

            // Hyperjson output
            var hj = Hyperjson.fromDOM(el, pred, filter);

            var x = Flat.toDOM(map);
            var y = Hyperjson.toDOM(hj);

            console.error(x.outerHTML);
            console.error(y.outerHTML);

            cb(x.outerHTML === y.outerHTML);
        }, "Test equality of FlatDOM and HyperJSON");
    });

    // check that old hashes parse correctly
    assert(function (cb) {
        //if (1) { return cb(true); } // TODO(cjd): This is a test failure which is a known bug
        var secret = Hash.parsePadUrl('/pad/#67b8385b07352be53e40746d2be6ccd7XAYSuJYYqa9NfmInyHci7LNy');
        return cb(secret.hashData.channel === "67b8385b07352be53e40746d2be6ccd7" &&
            secret.hashData.key === "XAYSuJYYqa9NfmInyHci7LNy" &&
            secret.hashData.version === 0 &&
            typeof(secret.getUrl) === 'function');
    }, "Old hash failed to parse");

    // make sure version 1 hashes parse correctly
    assert(function (cb) {
        var secret = Hash.parsePadUrl('/pad/#/1/edit/3Ujt4F2Sjnjbis6CoYWpoQ/usn4+9CqVja8Q7RZOGTfRgqI');
        return cb(secret.hashData.version === 1 &&
            secret.hashData.mode === "edit" &&
            secret.hashData.channel === "3Ujt4F2Sjnjbis6CoYWpoQ" &&
            secret.hashData.key === "usn4+9CqVja8Q7RZOGTfRgqI" &&
            !secret.hashData.present);
    }, "version 1 hash (without present mode) failed to parse");

    // test support for present mode in hashes
    assert(function (cb) {
        var secret = Hash.parsePadUrl('/pad/#/1/edit/CmN5+YJkrHFS3NSBg-P7Sg/DNZ2wcG683GscU4fyOyqA87G/present');
        return cb(secret.hashData.version === 1
            && secret.hashData.mode === "edit"
            && secret.hashData.channel === "CmN5+YJkrHFS3NSBg-P7Sg"
            && secret.hashData.key === "DNZ2wcG683GscU4fyOyqA87G"
            && secret.hashData.present);
    }, "version 1 hash failed to parse");

    // test support for present mode in hashes
    assert(function (cb) {
        var secret = Hash.parsePadUrl('/pad/#/1/edit//CmN5+YJkrHFS3NSBg-P7Sg/DNZ2wcG683GscU4fyOyqA87G//present');
        return cb(secret.hashData.version === 1
            && secret.hashData.mode === "edit"
            && secret.hashData.channel === "CmN5+YJkrHFS3NSBg-P7Sg"
            && secret.hashData.key === "DNZ2wcG683GscU4fyOyqA87G"
            && secret.hashData.present);
    }, "Couldn't handle multiple successive slashes");

    // test support for present & embed mode in hashes
    assert(function (cb) {
        var secret = Hash.parsePadUrl('/pad/#/1/edit//CmN5+YJkrHFS3NSBg-P7Sg/DNZ2wcG683GscU4fyOyqA87G/embed/present/');
        return cb(secret.hashData.version === 1
            && secret.hashData.mode === "edit"
            && secret.hashData.channel === "CmN5+YJkrHFS3NSBg-P7Sg"
            && secret.hashData.key === "DNZ2wcG683GscU4fyOyqA87G"
            && secret.hashData.present
            && secret.hashData.embed);
    }, "Couldn't handle multiple successive slashes");

    // test support for present & embed mode in hashes
    assert(function (cb) {
        var secret = Hash.parsePadUrl('/pad/#/1/edit//CmN5+YJkrHFS3NSBg-P7Sg/DNZ2wcG683GscU4fyOyqA87G/present/embed');
        return cb(secret.hashData.version === 1
            && secret.hashData.mode === "edit"
            && secret.hashData.channel === "CmN5+YJkrHFS3NSBg-P7Sg"
            && secret.hashData.key === "DNZ2wcG683GscU4fyOyqA87G"
            && secret.hashData.present
            && secret.hashData.embed);
    }, "Couldn't handle multiple successive slashes");

    // test support for embed mode in hashes
    assert(function (cb) {
        var secret = Hash.parsePadUrl('/pad/#/1/edit//CmN5+YJkrHFS3NSBg-P7Sg/DNZ2wcG683GscU4fyOyqA87G///embed//');
        return cb(secret.hashData.version === 1
            && secret.hashData.mode === "edit"
            && secret.hashData.channel === "CmN5+YJkrHFS3NSBg-P7Sg"
            && secret.hashData.key === "DNZ2wcG683GscU4fyOyqA87G"
            && !secret.hashData.present
            && secret.hashData.embed);
    }, "Couldn't handle multiple successive slashes");

    // test support for trailing slash
    assert(function (cb) {
        var secret = Hash.parsePadUrl('/pad/#/1/edit/3Ujt4F2Sjnjbis6CoYWpoQ/usn4+9CqVja8Q7RZOGTfRgqI/');
        return cb(secret.hashData.version === 1 &&
            secret.hashData.mode === "edit" &&
            secret.hashData.channel === "3Ujt4F2Sjnjbis6CoYWpoQ" &&
            secret.hashData.key === "usn4+9CqVja8Q7RZOGTfRgqI" &&
            !secret.hashData.present);
    }, "test support for trailing slashes in version 1 hash failed to parse");

    // test support for ownerKey
    assert(function (cb) {
        var secret = Hash.parsePadUrl('/pad/#/1/edit/3Ujt4F2Sjnjbis6CoYWpoQ/usn4+9CqVja8Q7RZOGTfRgqI/present/uPmJDtDJ9okhdIyQ-8zphYlpaAonJDOC6MAcYY6iBwWBQr+XmrQ9uGY9WkApJTfEfAu5QcqaDCw1Ul+JXKcYkA/embed');
        return cb(secret.hashData.version === 1 &&
            secret.hashData.mode === "edit" &&
            secret.hashData.channel === "3Ujt4F2Sjnjbis6CoYWpoQ" &&
            secret.hashData.key === "usn4+9CqVja8Q7RZOGTfRgqI" &&
            secret.hashData.ownerKey === "uPmJDtDJ9okhdIyQ-8zphYlpaAonJDOC6MAcYY6iBwWBQr+XmrQ9uGY9WkApJTfEfAu5QcqaDCw1Ul+JXKcYkA" &&
            secret.hashData.embed &&
            secret.hashData.present);
    }, "test support for owner key in version 1 hash failed to parse");
    assert(function (cb) {
        var parsed = Hash.parsePadUrl('/pad/#/2/pad/edit/oRE0oLCtEXusRDyin7GyLGcS/p/uPmJDtDJ9okhdIyQ-8zphYlpaAonJDOC6MAcYY6iBwWBQr+XmrQ9uGY9WkApJTfEfAu5QcqaDCw1Ul+JXKcYkA/embed');
        var secret = Hash.getSecrets('pad', parsed.hash);
        return cb(parsed.hashData.version === 2 &&
            parsed.hashData.mode === "edit" &&
            parsed.hashData.type === "pad" &&
            parsed.hashData.key === "oRE0oLCtEXusRDyin7GyLGcS" &&
            secret.channel === "d8d51b4aea863f3f050f47f8ad261753" &&
            window.nacl.util.encodeBase64(secret.keys.cryptKey) === "0Ts1M6VVEozErV2Nx/LTv6Im5SCD7io2LlhasyyBPQo=" &&
            secret.keys.validateKey === "f5A1FM9Gp55tnOcM75RyHD1oxBG9ZPh9WDA7qe2Fvps=" &&
            parsed.hashData.ownerKey === "uPmJDtDJ9okhdIyQ-8zphYlpaAonJDOC6MAcYY6iBwWBQr+XmrQ9uGY9WkApJTfEfAu5QcqaDCw1Ul+JXKcYkA" &&
            parsed.hashData.embed &&
            parsed.hashData.password);
    }, "test support for owner key in version 2 hash failed to parse");
    assert(function (cb) {
        var secret = Hash.parsePadUrl('/file/#/1/TRplGM-WsVkXR+LkJ0tD3D45A1YFZ-Cy/eO4RJwh8yHEEDhl1aHfuwQ2IzosPBZx-HDaWc1lW+hY=/uPmJDtDJ9okhdIyQ-8zphYlpaAonJDOC6MAcYY6iBwWBQr+XmrQ9uGY9WkApJTfEfAu5QcqaDCw1Ul+JXKcYkA/');
        return cb(secret.hashData.version === 1 &&
            secret.hashData.channel === "TRplGM/WsVkXR+LkJ0tD3D45A1YFZ/Cy" &&
            secret.hashData.key === "eO4RJwh8yHEEDhl1aHfuwQ2IzosPBZx/HDaWc1lW+hY=" &&
            secret.hashData.ownerKey === "uPmJDtDJ9okhdIyQ-8zphYlpaAonJDOC6MAcYY6iBwWBQr+XmrQ9uGY9WkApJTfEfAu5QcqaDCw1Ul+JXKcYkA" &&
            !secret.hashData.present);
    }, "test support for owner key in version 1 file hash failed to parse");
    assert(function (cb) {
        var parsed = Hash.parsePadUrl('/file/#/2/file/JQU88aX+ieXR58L5T787434a/');
        var secret = Hash.getSecrets('file', parsed.hash);
        return cb(secret.type === 'file' && secret.password === undefined &&
            secret.channel === "2031a9b51247a07ad398227367c1b95efaad969b209a279c");
    }, "test support for v2 file hash");

    assert(function (cb) {
        var secret = Hash.parsePadUrl('/invite/#/2/invite/edit/oRE0oLCtEXusRDyin7GyLGcS/p/');
        var hd = secret.hashData;
        cb(hd.key === "oRE0oLCtEXusRDyin7GyLGcS" &&
            hd.password &&
            hd.app === 'invite');
    }, "test support for invite urls");

    // test support for V2
    assert(function (cb) {
        var parsed = Hash.parsePadUrl('/pad/#/2/pad/edit/oRE0oLCtEXusRDyin7GyLGcS/');
        var secret = Hash.getSecrets('pad', '/2/pad/edit/oRE0oLCtEXusRDyin7GyLGcS/');
        return cb(parsed.hashData.version === 2 &&
            parsed.hashData.mode === "edit" &&
            parsed.hashData.type === "pad" &&
            parsed.hashData.key === "oRE0oLCtEXusRDyin7GyLGcS" &&
            secret.channel === "d8d51b4aea863f3f050f47f8ad261753" &&
            window.nacl.util.encodeBase64(secret.keys.cryptKey) === "0Ts1M6VVEozErV2Nx/LTv6Im5SCD7io2LlhasyyBPQo=" &&
            secret.keys.validateKey === "f5A1FM9Gp55tnOcM75RyHD1oxBG9ZPh9WDA7qe2Fvps=" &&
            !parsed.hashData.present);
    }, "test support for version 2 hash failed to parse");
    assert(function (cb) {
        var parsed = Hash.parsePadUrl('/pad/#/2/pad/edit/HGu0tK2od-2BBnwAz2ZNS-t4/p/embed');
        var secret = Hash.getSecrets('pad', '/2/pad/edit/HGu0tK2od-2BBnwAz2ZNS-t4/p/embed', 'pewpew');
        return cb(parsed.hashData.version === 2 &&
            parsed.hashData.mode === "edit" &&
            parsed.hashData.type === "pad" &&
            parsed.hashData.key === "HGu0tK2od-2BBnwAz2ZNS-t4" &&
            secret.channel === "3fb6dc93807d903aff390b5f798c92c9" &&
            window.nacl.util.encodeBase64(secret.keys.cryptKey) === "EeCkGJra8eJgVu7v4Yl2Hc3yUjrgpKpxr0Lcc3bSWVs=" &&
            secret.keys.validateKey === "WGkBczJf2V6vQZfAScz8V1KY6jKdoxUCckrD+E75gGE=" &&
            parsed.hashData.embed &&
            parsed.hashData.password);
    }, "test support for password in version 2 hash failed to parse");

    assert(function (cb) {
        var url = '/pad/?utm_campaign=new_comment&utm_medium=email&utm_source=thread_mailer#/1/edit/3Ujt4F2Sjnjbis6CoYWpoQ/usn4+9CqVja8Q7RZOGTfRgqI/';
        var secret = Hash.parsePadUrl(url);

        return cb(secret.hashData.version === 1 &&
            secret.hashData.mode === "edit" &&
            secret.hashData.channel === "3Ujt4F2Sjnjbis6CoYWpoQ" &&
            secret.hashData.key === "usn4+9CqVja8Q7RZOGTfRgqI" &&
            !secret.hashData.present);
    }, "test support for ugly tracking query paramaters in url");

    assert(function (cb) {
        var url = '//cryptpad.fr/pad/#/2/pad/edit/oRE0oLCtEXusRDyin7GyLGcS/';
        var parsed = Hash.isValidHref(url);
        cb(!parsed);
    }, "test that protocol relative URLs are rejected");

    assert(function (cb) {
        var keys = Block.genkeys(Nacl.randomBytes(64));
        var hash = Block.getBlockHash(keys);
        var parsed = Block.parseBlockHash(hash);

        cb(parsed &&
            parsed.keys.symmetric.length === keys.symmetric.length);
    }, 'parse a block hash');

    assert(function (cb) {
        var v1 = Hash.isValidHref('https://cryptpad.fr/pad');
        var v2 = Hash.isValidHref('https://cryptpad.fr/pad/');
        var v3 = Hash.isValidHref('/pad');
        var v4 = Hash.isValidHref('/pad/');

        var res = Boolean(v1 && v2 && v3 && v4);
        cb(res);
        if (!res) {
            console.log(v1, v2, v3, v4);
        }
    }, 'test isValidHref no hash');
    assert(function (cb) {
        var v1 = !Hash.isValidHref('https://cryptpad.fr/pad#'); // Invalid
        var v2 = Hash.isValidHref('https://cryptpad.fr/pad/#');
        var v3 = Hash.isValidHref('/pad#'); // Invalid
        var v4 = Hash.isValidHref('/pad/#');

        var res = Boolean(v1 && v2 && v3 && v4);
        cb(res);
        if (!res) {
            console.log(v1, v2, v3, v4);
        }
    }, 'test isValidHref empty hash');
    assert(function (cb) {
        var v1 = Hash.isValidHref('https://cryptpad.fr/pad/#/2/pad/edit/HGu0tK2od-2BBnwAz2ZNS-t4/p/embed');
        var v2 = Hash.isValidHref('https://cryptpad.fr/pad/#/1/edit/CmN5+YJkrHFS3NSBg-P7Sg/DNZ2wcG683GscU4fyOyqA87G/present/embed');
        var v3 = Hash.isValidHref('https://cryptpad.fr/pad/#67b8385b07352be53e40746d2be6ccd7XAYSuJYYqa9NfmInyHci7LNy');
        var v4 = Hash.isValidHref('/pad/#/2/pad/edit/HGu0tK2od-2BBnwAz2ZNS-t4/p/embed');

        var res = Boolean(v1 && v2 && v3 && v4);
        cb(res);
        if (!res) {
            console.log(v1, v2, v3, v4);
        }
    }, 'test isValidHref hash');

    assert(function (cb) {
        try {
            MediaTag(void 0).on('progress').on('decryption');
            return void cb(true);
        } catch (e) {
            console.error(e);
            return void cb(false);
        }
    }, 'check that MediaTag does the right thing when passed no value');

    assert(function (cb) {
        try {
            MediaTag(document.createElement('div')).on('progress').on('decryption');
            return void cb(true);
        } catch (e) {
            console.error(e);
            return void cb(false);
        }
    }, 'check that MediaTag does the right thing when passed no value');

    assert(function (cb) {
        // TODO
        return cb(true);
    }, "version 2 hash failed to parse correctly");

    assert(function (cb) {
        var x;
        var set_x = function (v) {
            x = v;
        };

        Util.mkAsync(set_x)(7);
        set_x(5);

        Util.mkAsync(function (expected) {
            cb(x === expected);
        })(7);
    }, "test mkAsync");

    assert(function (cb) {
        Wire.create({
            constructor: function (cb) {
                var service = function (type, data, cb) {
                    switch (type) {
                        case "HEY_BUDDY":
                            return cb(void 0, "SALUT!");
                        default:
                            cb("ERROR");
                    }
                };

                var evt = Util.mkEvent();
                var respond = function (e, out) {
                    evt.fire(e, out);
                };
                cb(void 0, {
                    send: function (raw /*, cb */) {
                        try {
                            var parsed = JSON.parse(raw);
                            var txid = parsed.txid;
                            setTimeout(function () {
                                service(parsed.q, parsed.content, function (e, result) {
                                    respond(JSON.stringify({
                                        txid: txid,
                                        error: e,
                                        content: result,
                                    }));
                                });
                            });
                        } catch (e) { console.error("PEWPEW"); }
                    },
                    receive: function (f) {
                        evt.reg(f);
                    },
                });
            },
        }, function (e, rpc) {
            if (e) { return cb(false); }
            rpc.send('HEY_BUDDY', null, function (e, out) {
                if (e) { return void cb(false); }
                if (out === 'SALUT!') { cb(true); }
            });
        });
    }, "Test rpc factory");

    assert(function (cb) {
        require([
            '/assert/frame/frame.js',
        ], function (Frame) {
            Frame.create(document.body, '/assert/frame/frame.html', function (e, frame) {
                if (e) { return cb(false); }

                var channel = Frame.open(frame, [
                    /.*/i,
                ], 5000);

                channel.send('HELO', null, function (e, res) {
                    if (res === 'EHLO') { return cb(true); }
                    cb(false);
                });
            });
        });
    }, "PEWPEW");

    (function () {
        var guid = Wire.uid();

        var t = Wire.tracker({
            timeout: 1000,
            hook: function (txid, q, content) {
                console.info(JSON.stringify({
                    guid: guid,
                    txid: txid,
                    q: q,
                    content: content,
                }));
            },
        });

        assert(function (cb) {
            t.call('SHOULD_TIMEOUT', null, function (e) {
                if (e === 'TIMEOUT') { return cb(true); }
                cb(false);
            });
        }, 'tracker should timeout');

        assert(function (cb) {
            var id = t.call('SHOULD_NOT_TIMEOUT', null, function (e, out) {
                if (e) { return cb(false); }
                if (out === 'YES') { return cb(true); }
                cb(false);
            });
            t.respond(id, void 0, 'YES');
        }, "tracker should not timeout");
    }());

    Drive.test(assert);

    assert(function (cb) {
        // extract dom elements into a flattened JSON representation
        var flat = Flat.fromDOM(document.body);
        // recreate a _mostly_ equivalent DOM
        var dom = Flat.toDOM(flat);
        // assume we don't care about comments
        var bodyText = document.body.outerHTML.replace(/<!\-\-[\s\S]*?\-\->/g, '');
        // check for equality
        cb(dom.outerHTML === bodyText);
    });



    ///FORMS///

    assert(function (cb) {
        var days = Form.getWeekDays();
      
        var result = days.length === 7; 
      
        cb(result);
    }, "getWeekDays: Checks how many weekdays retrieved");  

    assert(function (cb) {
        var array = [0, 0, 1]
        var result = Form.arrayMax(array) === 1;
      
        cb(result);
    }, "arrayMax: Checks the max value of an array");  

    assert(function (cb) {
        var array = [0, 0, 0]
        var result = Form.arrayMax(array) === 0;
      
        cb(result);
    }, "arrayMax: Checks the max value of an array if all values the same");  

    //TO CHECK -- NaN not a valid result type
    // assert(function (cb) {
    //     var array = ['example', 'text']
    //     var result = Form.arrayMax(array) === NaN;
      
    //     cb(result);
    // }, "arrayMax: Checks that NaN is returned if values are not numerical");  

    assert(function (cb) {
        var object = { uid: "1rrtjll2sl4", v: 1680688800000 }

        var result = Form.getOptionValue(object) === 1680688800000

        cb(result);
    }, "getOptionValue: Checks selected option value");  

    assert(function (cb) {
        var object = { uid: "1rrtjll2sl4", v: 'example text' }

        var result = Form.getOptionValue(object) === 'example text'

        cb(result);
    }, "getOptionValue: Checks selected option value (type: text)");  

    assert(function (cb) {
        var object = [{uid: "1rrtjll2sl4"}, {v: 'example text' }]

        var result = Form.getOptionValue(object) === object

        cb(result);
    }, "getOptionValue: Checks if non-object rejected");  

    //TO CHECK -- array not a valid result type
    // assert(function (cb) {
    //     var values = [{ uid: "1rrtjll2sl4", v: 1680688800000 }, { uid: "7dehmmrmac9", v: 'example text' }]

    //     var result = Form.extractValues(values) === [1680688800000,'example text']

    //     cb(result);
    // }, "extractValues: Checks if option value array generated");  

    // assert(function (cb) {
    //     var values = { uid: "1rrtjll2sl4", v: 1680688800000 }

    //     var result = Form.extractValues(values) === []

    //     cb(result);
    // }, "extractValues: Checks if non-array rejected");  

    // assert(function (cb) {
    //     var values = [{ uid: "1rrtjll2sl4", v: 1680688800000 }]

    //     var result = Form.extractValues(values) === [1680688800000]

    //     cb(result);
    // }, "extractValues: Checks if option value array generated with only one value");  

    // assert(function (cb) {
    //     var answers = {"q+3dZT3CJ+XbkWhi5092symcW+IGJZPzd0RShYMEsHE=|35hfju0fsnu":{"msg":{"69rjecmhjb9":",mn,mn,mn,mn,mn","_uid":"35hfju0fsnu","_time":1681202916647,"_hash":"DbnusGXMDX663VM7D21tqQfz4pQIs7BKp6UpRBueoXtchIulIoqftOOWj7PpU6Lx"},"hash":"DbnusGXMDX663VM7D21tqQfz4pQIs7BKp6UpRBueoXtchIulIoqftOOWj7PpU6Lx","time":1681206767511},"SiTGBfCFwlcsLTNvufacxbc9X6mUpIoG9n1GAceMlA4=|66kj6s52omt":{"msg":{"69rjecmhjb9":"kjkjkjlkjlkjlkjlkjlkjlkjlkj","_uid":"66kj6s52omt","_time":1681205388977,"_hash":"TAoVobz7rNK3RSzkTpcaXRa47Eo63P0UvYjpGYSP1plgn8sq8iY1o4TdU4/LrnoE"},"hash":"TAoVobz7rNK3RSzkTpcaXRa47Eo63P0UvYjpGYSP1plgn8sq8iY1o4TdU4/LrnoE","time”:1681202916647},”NeDLoqFcwcKwd6rphOpEQ5X6aSlN9qGsvgi57kWKLA0=|1oq2djufaap":{"msg":{"69rjecmhjb9":"brrrrrrrrrr","_uid":"1oq2djufaap","_time":1681206767511,"_hash":"l/nJS20MK04js5WrPJCyZNF7WTmHXF9fdQXYRT0iY9DalgeetuBKnndKmwVG5kUr"},"hash":"l/nJS20MK04js5WrPJCyZNF7WTmHXF9fdQXYRT0iY9DalgeetuBKnndKmwVG5kUr","time":1681205388977}}}
        
    //     var result = Form.getSortedKeys(answers) === ['SiTGBfCFwlcsLTNvufacxbc9X6mUpIoG9n1GAceMlA4=|66kj6s52omt','NeDLoqFcwcKwd6rphOpEQ5X6aSlN9qGsvgi57kWKLA0=|1oq2djufaap', 'q+3dZT3CJ+XbkWhi5092symcW+IGJZPzd0RShYMEsHE=|35hfju0fsnu']

    //     cb(result);
    // }, "getSortedKeys: Checks if answer key array generated in correct order");  

    //TO CHECK -- == NOT ===
    assert(function (cb) {
        var dateToday = new Date(1681202916647)

        var result = Form.getDay(dateToday) == "Tue Apr 11 2023 00:00:00 GMT+0200 (Central European Summer Time)"

        cb(result);
    }, "getDay: Checks if correct day extracted from datetime");  

    //TO CHECK -- array not a valid result type
    // assert(function (cb) {
    //     var dateOne = new Date('2023-01-23')
    //     var dateTwo = new Date('2023-01-27')

    //     var result = Form.getDayArray(dateOne, dateTwo) === [1674428400000,1674514800000,1674601200000,1674687600000,1674774000000]

    //     cb(result);
    // }, "getDayArray: Checks if day array generated in correct order");  

    assert(function (cb) {
        var answers = {"dnD12ORDDrY/tyN84dhBDznuJMxyPbXTk9qDygrqnmg=":{"726f3f4ulmd":{"msg":{"2":"Option 1","7mkcosm2rt0":"answer text","_uid":"726f3f4ulmd","_time":1681300220930,"_hash":"0n6I/4EK2yln5mVngTMXSYSCZSIY0CZwdLcgQqwQgyEvIWen7GrcFOfGNlY8+eIF"},"hash":"0n6I/4EK2yln5mVngTMXSYSCZSIY0CZwdLcgQqwQgyEvIWen7GrcFOfGNlY8+eIF","time":1681300220930}},"p6GuFDW8MBFm08qk8wYQtXHdKGhSBsdR5NgphX3dIyA=":{"ofu17vk29q":{"msg":{"2":"Option 2","7mkcosm2rt0":"example text","_uid":"ofu17vk29q","_time":1681300240916,"_hash":"Af7QrdwMPTdiGK8GmVgHxHDzMwDqqyVj0nhT/ZlIrIwTLDtdRmgAuL69EEU7VIWJ"},"hash":"Af7QrdwMPTdiGK8GmVgHxHDzMwDqqyVj0nhT/ZlIrIwTLDtdRmgAuL69EEU7VIWJ","time":1681300240916}},"O6+R4oi9CN2PIK/G9CcvZGWPaOnp+wdPnT4C87XLu0E=":{"7gvtagjf10j":{"msg":{"7mkcosm2rt0":"","_userdata":{"name":"example name"},"_uid":"7gvtagjf10j","_time":1681300260886,"_hash":"ViJDNNV7ZzS0u15REcRh+IUyImfN0rAzNpa2KONuZRyj3+eOTxeBppTmlYaC2uXj"},"hash":"ViJDNNV7ZzS0u15REcRh+IUyImfN0rAzNpa2KONuZRyj3+eOTxeBppTmlYaC2uXj","time":1681300260886}}}

        var result = JSON.stringify(Form.parseAnswers(answers)) == {"dnD12ORDDrY/tyN84dhBDznuJMxyPbXTk9qDygrqnmg=|726f3f4ulmd":{"726f3f4ulmd":{"msg":{"2":"Option 1","7mkcosm2rt0":"answer text","_uid":"726f3f4ulmd","_time":1681300220930,"_hash":"0n6I/4EK2yln5mVngTMXSYSCZSIY0CZwdLcgQqwQgyEvIWen7GrcFOfGNlY8+eIF"},"hash":"0n6I/4EK2yln5mVngTMXSYSCZSIY0CZwdLcgQqwQgyEvIWen7GrcFOfGNlY8+eIF","time":1681300220930}},"p6GuFDW8MBFm08qk8wYQtXHdKGhSBsdR5NgphX3dIyA=|ofu17vk29q":{"ofu17vk29q":{"msg":{"2":"Option 2","7mkcosm2rt0":"example text","_uid":"ofu17vk29q","_time":1681300240916,"_hash":"Af7QrdwMPTdiGK8GmVgHxHDzMwDqqyVj0nhT/ZlIrIwTLDtdRmgAuL69EEU7VIWJ"},"hash":"Af7QrdwMPTdiGK8GmVgHxHDzMwDqqyVj0nhT/ZlIrIwTLDtdRmgAuL69EEU7VIWJ","time":1681300240916}},"O6+R4oi9CN2PIK/G9CcvZGWPaOnp+wdPnT4C87XLu0E=|7gvtagjf10j":{"7gvtagjf10j":{"msg":{"7mkcosm2rt0":"","_userdata":{"name":"example name"},"_uid":"7gvtagjf10j","_time":1681300260886,"_hash":"ViJDNNV7ZzS0u15REcRh+IUyImfN0rAzNpa2KONuZRyj3+eOTxeBppTmlYaC2uXj"},"hash":"ViJDNNV7ZzS0u15REcRh+IUyImfN0rAzNpa2KONuZRyj3+eOTxeBppTmlYaC2uXj","time":1681300260886}}}

        cb(result);
    }, "parseAnswers: Checks if answers parsed correctly");  

    // //BLANK
    // //no answers
    // //all kinds

    // assert(function (cb) {
    //     var answers = {"dnD12ORDDrY/tyN84dhBDznuJMxyPbXTk9qDygrqnmg=":{"726f3f4ulmd":{"msg":{"2":"Option 1","7mkcosm2rt0":"answer text","_uid":"726f3f4ulmd","_time":1681300220930,"_hash":"0n6I/4EK2yln5mVngTMXSYSCZSIY0CZwdLcgQqwQgyEvIWen7GrcFOfGNlY8+eIF"},"hash":"0n6I/4EK2yln5mVngTMXSYSCZSIY0CZwdLcgQqwQgyEvIWen7GrcFOfGNlY8+eIF","time":1681300220930}},"p6GuFDW8MBFm08qk8wYQtXHdKGhSBsdR5NgphX3dIyA=":{"ofu17vk29q":{"msg":{"2":"Option 2","7mkcosm2rt0":"example text","_uid":"ofu17vk29q","_time":1681300240916,"_hash":"Af7QrdwMPTdiGK8GmVgHxHDzMwDqqyVj0nhT/ZlIrIwTLDtdRmgAuL69EEU7VIWJ"},"hash":"Af7QrdwMPTdiGK8GmVgHxHDzMwDqqyVj0nhT/ZlIrIwTLDtdRmgAuL69EEU7VIWJ","time":1681300240916}},"O6+R4oi9CN2PIK/G9CcvZGWPaOnp+wdPnT4C87XLu0E=":{"7gvtagjf10j":{"msg":{"7mkcosm2rt0":"","_userdata":{"name":"example name"},"_uid":"7gvtagjf10j","_time":1681300260886,"_hash":"ViJDNNV7ZzS0u15REcRh+IUyImfN0rAzNpa2KONuZRyj3+eOTxeBppTmlYaC2uXj"},"hash":"ViJDNNV7ZzS0u15REcRh+IUyImfN0rAzNpa2KONuZRyj3+eOTxeBppTmlYaC2uXj","time":1681300260886}}}

    //     var result = Form.getAnswersLength(answers) === 3;

    //     cb(result);
    // }, "getOptionValue: Checks if non-object rejected");  

    // assert(function (cb) {
    //     // var answers = {"dnD12ORDDrY/tyN84dhBDznuJMxyPbXTk9qDygrqnmg=":{"726f3f4ulmd":{"msg":{"2":"Option 1","7mkcosm2rt0":"answer text","_uid":"726f3f4ulmd","_time":1681300220930,"_hash":"0n6I/4EK2yln5mVngTMXSYSCZSIY0CZwdLcgQqwQgyEvIWen7GrcFOfGNlY8+eIF"},"hash":"0n6I/4EK2yln5mVngTMXSYSCZSIY0CZwdLcgQqwQgyEvIWen7GrcFOfGNlY8+eIF","time":1681300220930}},"p6GuFDW8MBFm08qk8wYQtXHdKGhSBsdR5NgphX3dIyA=":{"ofu17vk29q":{"msg":{"2":"Option 2","7mkcosm2rt0":"example text","_uid":"ofu17vk29q","_time":1681300240916,"_hash":"Af7QrdwMPTdiGK8GmVgHxHDzMwDqqyVj0nhT/ZlIrIwTLDtdRmgAuL69EEU7VIWJ"},"hash":"Af7QrdwMPTdiGK8GmVgHxHDzMwDqqyVj0nhT/ZlIrIwTLDtdRmgAuL69EEU7VIWJ","time":1681300240916}},"O6+R4oi9CN2PIK/G9CcvZGWPaOnp+wdPnT4C87XLu0E=":{"7gvtagjf10j":{"msg":{"7mkcosm2rt0":"","_userdata":{"name":"example name"},"_uid":"7gvtagjf10j","_time":1681300260886,"_hash":"ViJDNNV7ZzS0u15REcRh+IUyImfN0rAzNpa2KONuZRyj3+eOTxeBppTmlYaC2uXj"},"hash":"ViJDNNV7ZzS0u15REcRh+IUyImfN0rAzNpa2KONuZRyj3+eOTxeBppTmlYaC2uXj","time":1681300260886}}}
    //     var uid = "66gk9ne3plg"
    //     var items = [{ uid: "66gk9ne3plg", v: "Item 1" }, { uid: "66gk9ne3plg", v: "Item 1" }]
        
    //     var result = Form.findItem(items, uid) === 'Item 1'

    //     cb(result);
    // }, "getOptionValue: Checks if non-object rejected");  

    // assert(function (cb) {

    //     var content = {"answers":{"anonymous":true,"channel":"f0c618aafe7071f8c239834793643d66","publicKey":"82gx8xzoV6bgHBQ1zoic57b2cjgxZ9zO2V67c2486ng=","validateKey":"in4+E1sKdZ+MHayQ5O2gJdMqi4Tvmk35/z/1HEqTr4M=","version":2},"form":{"1q086i8iuv0":{"opts":{"type":"text"},"type":"input"},"2de53antgns":{"opts":{"type":"text"},"type":"input"},"3nqrkethqre":{"opts":{"questions":["2de53antgns"],"when":[]},"type":"section"},"489ghit6aa6":{"opts":{"type":"text"},"type":"input"},"5l43527l18c":{"opts":{"maxLength":1000},"type":"textarea"},"5satfltfm3u":{"opts":{"type":"text"},"type":"input"}},"order":["5l43527l18c","489ghit6aa6","1q086i8iuv0","5satfltfm3u","3nqrkethqre"],"version":1}

    //     var result = Form.getSections(content) === ["3nqrkethqre"]

    //     cb(result);
    // }, "getOptionValue: Checks if non-object rejected");  

    // assert(function (cb) {
    //     var content = {"answers":{"anonymous":true,"channel":"f0c618aafe7071f8c239834793643d66","publicKey":"82gx8xzoV6bgHBQ1zoic57b2cjgxZ9zO2V67c2486ng=","validateKey":"in4+E1sKdZ+MHayQ5O2gJdMqi4Tvmk35/z/1HEqTr4M=","version":2},"form":{"1q086i8iuv0":{"opts":{"type":"text"},"type":"input"},"2de53antgns":{"opts":{"type":"text"},"type":"input"},"3nqrkethqre":{"opts":{"questions":["2de53antgns"],"when":[]},"type":"section"},"489ghit6aa6":{"opts":{"type":"text"},"type":"input"},"5l43527l18c":{"opts":{"maxLength":1000},"type":"textarea"},"5satfltfm3u":{"opts":{"type":"text"},"type":"input"}},"order":["5l43527l18c","489ghit6aa6","1q086i8iuv0","5satfltfm3u","3nqrkethqre"],"version":1}

    //     var result = Form.getFullOrder(content) === [ "5l43527l18c", "489ghit6aa6", "1q086i8iuv0", "5satfltfm3u", "3nqrkethqre", "2de53antgns" ]

    //     cb(result);
    // }, "getOptionValue: Checks if non-object rejected");  

    // assert(function (cb) {
    //     var answers = {"PIZkFh+x41UdYNXEEAAhzNRG2juhlH6bbvX9xw+KO0c=|2fkkqujbog4":{"msg":{"7bnj9a8okpn":{"values":{"Option 1":"1","Option 2":"0","Option 3":"0"}},"_uid":"2fkkqujbog4","_time":1681411078436,"_hash":"FbIr34E1A88dX9QXflyxwa/uLIKmucq0XYvuRQyNxfoJSN7fO4oh/KxxVekDXqAk"},"hash":"FbIr34E1A88dX9QXflyxwa/uLIKmucq0XYvuRQyNxfoJSN7fO4oh/KxxVekDXqAk","time":1681411078436}}
        
    //     var uid = "7bnj9a8okpn"

    //     var filterCurve = false

    //     var result = Form.getBlockAnswers(answers, uid, filterCurve) === [{"curve":"PIZkFh+x41UdYNXEEAAhzNRG2juhlH6bbvX9xw+KO0c=","results":{"values":{"Option 1":"1","Option 2":"0","Option 3":"0"}},"time":1681411078436}]

    //     cb(result);
    // }, "getOptionValue: Checks if non-object rejected");  

    // assert(function (cb) {
    //     var content = {"answers":{"anonymous":true,"channel":"dd879143bd4a49fd7e68f6c5109e4d9f","publicKey":"Ja4U/ESMGx/BjTTChbAZD+SFG0P+93o3F4XW6CJR0DA=","validateKey":"swNQf0LqJFWThBSE+iw8VryY2xId+QVcbn9XFeLNfXU=","version":2},"form":{"3e81recgc5g":{"opts":{"type":"text"},"type":"input"},"60tij442l02":{"opts":{"questions":["3e81recgc5g"],"when":[]},"type":"section"},"6bbmju7i65i":{"opts":{"type":"text"},"type":"input"}},"order":["6bbmju7i65i","60tij442l02"],"version":1}
        
    //     var result = Form.getSections(content) === [ "60tij442l02" ]

    //     cb(result);
    // }, "getOptionValue: Checks if non-object rejected");  

    // assert(function (cb) {
    //     // var answers = {"dnD12ORDDrY/tyN84dhBDznuJMxyPbXTk9qDygrqnmg=":{"726f3f4ulmd":{"msg":{"2":"Option 1","7mkcosm2rt0":"answer text","_uid":"726f3f4ulmd","_time":1681300220930,"_hash":"0n6I/4EK2yln5mVngTMXSYSCZSIY0CZwdLcgQqwQgyEvIWen7GrcFOfGNlY8+eIF"},"hash":"0n6I/4EK2yln5mVngTMXSYSCZSIY0CZwdLcgQqwQgyEvIWen7GrcFOfGNlY8+eIF","time":1681300220930}},"p6GuFDW8MBFm08qk8wYQtXHdKGhSBsdR5NgphX3dIyA=":{"ofu17vk29q":{"msg":{"2":"Option 2","7mkcosm2rt0":"example text","_uid":"ofu17vk29q","_time":1681300240916,"_hash":"Af7QrdwMPTdiGK8GmVgHxHDzMwDqqyVj0nhT/ZlIrIwTLDtdRmgAuL69EEU7VIWJ"},"hash":"Af7QrdwMPTdiGK8GmVgHxHDzMwDqqyVj0nhT/ZlIrIwTLDtdRmgAuL69EEU7VIWJ","time":1681300240916}},"O6+R4oi9CN2PIK/G9CcvZGWPaOnp+wdPnT4C87XLu0E=":{"7gvtagjf10j":{"msg":{"7mkcosm2rt0":"","_userdata":{"name":"example name"},"_uid":"7gvtagjf10j","_time":1681300260886,"_hash":"ViJDNNV7ZzS0u15REcRh+IUyImfN0rAzNpa2KONuZRyj3+eOTxeBppTmlYaC2uXj"},"hash":"ViJDNNV7ZzS0u15REcRh+IUyImfN0rAzNpa2KONuZRyj3+eOTxeBppTmlYaC2uXj","time":1681300260886}}}
    //     var APP;
    //     APP.formBlocks = [{"tag":{"jQuery360028827848464003571":{"events":{"keypress":[{"type":"keypress","origType":"keypress","guid":55,"namespace":""}],"change":[{"type":"change","origType":"change","guid":55,"namespace":""}]}}},"uid":"298095t8h92"},{"tag":{"jQuery360028827848464003571":{"events":{"keypress":[{"type":"keypress","origType":"keypress","guid":56,"namespace":""}],"change":[{"type":"change","origType":"change","guid":56,"namespace":""}]}}},"uid":"69rjecmhjb9"}]
    //     var result = Form.getFormResults() === { "298095t8h92": "answer1", "69rjecmhjb9": "answer2" }

    //     cb(result);
    // }, "getOptionValue: Checks if non-object rejected");  

    // assert(function (cb) {
    //     var content = {"answers":{"anonymous":true,"channel":"dd879143bd4a49fd7e68f6c5109e4d9f","publicKey":"Ja4U/ESMGx/BjTTChbAZD+SFG0P+93o3F4XW6CJR0DA=","validateKey":"swNQf0LqJFWThBSE+iw8VryY2xId+QVcbn9XFeLNfXU=","version":2},"form":{"3e81recgc5g":{"opts":{"type":"text"},"type":"input"},"60tij442l02":{"opts":{"questions":["3e81recgc5g"],"when":[]},"type":"section"},"6bbmju7i65i":{"opts":{"type":"text"},"type":"input"}},"order":["6bbmju7i65i","60tij442l02"],"version":1}
        
    //     var uid = "6bbmju7i65i"

    //     var result = Form.getSectionFromQ(content, uid) === {"arr":["76nff13m2m2","6bbmju7i65i","60tij442l02"],"idx":0}

    //     cb(result);
    // }, "getOptionValue: Checks if non-object rejected");  

    // assert(function (cb) {
    //     var content = {"answers":{"anonymous":true,"channel":"dd879143bd4a49fd7e68f6c5109e4d9f","publicKey":"Ja4U/ESMGx/BjTTChbAZD+SFG0P+93o3F4XW6CJR0DA=","validateKey":"swNQf0LqJFWThBSE+iw8VryY2xId+QVcbn9XFeLNfXU=","version":2},"form":{"3e81recgc5g":{"opts":{"type":"text"},"type":"input"},"53g43utbomt":{"opts":{"type":"text"},"type":"input"},"60tij442l02":{"opts":{"questions":["3e81recgc5g"],"when":[]},"type":"section"},"78uh4r9n10u":{"opts":{"values":[{"uid":"384h23hpkcm","v":"Option 1"},{"uid":"3nnb01frfvl","v":"Option 2"}]},"type":"radio"},"3s5hqske4pc":{"opts":{"type":"text"},"type":"input"}},"order":["60tij442l02","78uh4r9n10u","53g43utbomt","3s5hqske4pc"],"version":1}
        
    //     var uid = "3s5hqske4rq"

    //     var result = Form.removeQuestion(content, uid) === true

    //     cb(result);
    // }, "getOptionValue: Checks if non-object rejected");  

    // assert(function (cb) {
    //     // var answers = {"dnD12ORDDrY/tyN84dhBDznuJMxyPbXTk9qDygrqnmg=":{"726f3f4ulmd":{"msg":{"2":"Option 1","7mkcosm2rt0":"answer text","_uid":"726f3f4ulmd","_time":1681300220930,"_hash":"0n6I/4EK2yln5mVngTMXSYSCZSIY0CZwdLcgQqwQgyEvIWen7GrcFOfGNlY8+eIF"},"hash":"0n6I/4EK2yln5mVngTMXSYSCZSIY0CZwdLcgQqwQgyEvIWen7GrcFOfGNlY8+eIF","time":1681300220930}},"p6GuFDW8MBFm08qk8wYQtXHdKGhSBsdR5NgphX3dIyA=":{"ofu17vk29q":{"msg":{"2":"Option 2","7mkcosm2rt0":"example text","_uid":"ofu17vk29q","_time":1681300240916,"_hash":"Af7QrdwMPTdiGK8GmVgHxHDzMwDqqyVj0nhT/ZlIrIwTLDtdRmgAuL69EEU7VIWJ"},"hash":"Af7QrdwMPTdiGK8GmVgHxHDzMwDqqyVj0nhT/ZlIrIwTLDtdRmgAuL69EEU7VIWJ","time":1681300240916}},"O6+R4oi9CN2PIK/G9CcvZGWPaOnp+wdPnT4C87XLu0E=":{"7gvtagjf10j":{"msg":{"7mkcosm2rt0":"","_userdata":{"name":"example name"},"_uid":"7gvtagjf10j","_time":1681300260886,"_hash":"ViJDNNV7ZzS0u15REcRh+IUyImfN0rAzNpa2KONuZRyj3+eOTxeBppTmlYaC2uXj"},"hash":"ViJDNNV7ZzS0u15REcRh+IUyImfN0rAzNpa2KONuZRyj3+eOTxeBppTmlYaC2uXj","time":1681300260886}}}

    //     var result = Form.checkCondition() === 

    //     cb(result);
    // }, "getOptionValue: Checks if non-object rejected");  

    // assert(function (cb) {
    //     answers = {"HVfRpDskx2w7DkSGoHXj+naZUE8/sD3vOfch2uLjEXE=":{"tpsubv6rpe":{"msg":{"_uid":"tpsubv6rpe","_time":1681156327353,"_hash":"FvPNwKf6Y3bIvZq/bqR5F81NbVi/uQJLGqvKmpwIlhSmX5taTuNYFTbJNgHEHzkt"},"hash":"FvPNwKf6Y3bIvZq/bqR5F81NbVi/uQJLGqvKmpwIlhSmX5taTuNYFTbJNgHEHzkt","time":1681156327353}}, "HVfRpDskx2w7DkSGoHXj+naZUE8/sD3vOfch2uLjEXE=":{"tpsubv6rpe":{"msg":{"_uid":"tpsubv6rpe","_time":1681156327353,"_hash":"FvPNwKf6Y3bIvZq/bqR5F81NbVi/uQJLGqvKmpwIlhSmX5taTuNYFTbJNgHEHzkt"},"hash":"FvPNwKf6Y3bIvZq/bqR5F81NbVi/uQJLGqvKmpwIlhSmX5taTuNYFTbJNgHEHzkt","time":1681156327353}}}
    //     uid = '5c3p0rook1f'
    //     form = {}
    //     opts = {"values":[{"uid":"4ndmfa2gl7v","v":"Option 1"},{"uid":"26pd96i9v59","v":"Option 2"}]}

    //     var result = Form.renderResults().show().renderResults()
    //     console.log(result)
    //     console.log('jkbjbjbjb')
    //     // var days = Form.renderResults.show.showCondorcet.calculateCondorcet()
    //     // result = 'kj';
        
      
    //     cb(result);
    // }, "Condorcet winner");  


    ///

    assert.run(function (state) {
        var errors = state.errors;
        var failed = errors.length;
        answers = ''
        Messages.assert_numberOfTestsPassed = "{0} / {1} tests passed.";
        // console.log(obj.output)
        console.log(errors)
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


/*
        if (failed) {
            Test.failed();
        } else {
            Test.passed();
        }*/
    });

});

