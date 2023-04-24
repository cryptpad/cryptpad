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
    '../form/condorcet.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
    'less!/customize/src/less2/pages/page-assert.less',
], function ($, Hyperjson, Sortify, Drive, /*Test,*/ Hash, Util, Thumb, Wire, Flat, MediaTag, Block, ApiConfig, Assertions, h, Messages, Form, Condorcet) {
    
    // NOTE: This page will only run correctly if the Framework.create block at the bottom of '../form/inner.js' is commented out.
    
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
        var days = Form.getWeekDays();

        var result = days.includes('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'); 
      
        cb(result);
    }, "getWeekDays: Checks all weekdays retrieved");  

    assert(function (cb) {
        var array = [0, 0, 1];

        var result = Form.arrayMax(array) === 1;
      
        cb(result);
    }, "arrayMax: Checks the max value of an array");  

    assert(function (cb) {
        var array = [20021, 0, -1, 0.9];

        var result = Form.arrayMax(array) === 20021;
      
        cb(result);
    }, "arrayMax: Checks the max value of an array"); 

    assert(function (cb) {
        var array = [0, 0, 0];

        var result = Form.arrayMax(array) === 0;
      
        cb(result);
    }, "arrayMax: Checks the max value of an array if all values the same");  

    assert(function (cb) {
        var array = ['example', 'text'];

        var result = String(Form.arrayMax(array)) === String(NaN);
      
        cb(result);
    }, "arrayMax: Checks that NaN is returned if values are not numerical");  

    assert(function (cb) {
        var array = [];

        var result = String(Form.arrayMax(array)) === String(-Infinity);
        //add error catch block in case empty array passed as argument?
      
        cb(result);
    }, "arrayMax: Checks that -Infinity is returned if array is empty");  

    assert(function (cb) {
        var object = { uid: "1rrtjll2sl4", v: 1680688800000 };

        var result = Form.getOptionValue(object) === 1680688800000;

        cb(result);
    }, "getOptionValue: Checks selected option value");  

    assert(function (cb) {
        var object = { uid: "1rrtjll2sl4", v: 'example text' };

        var result = Form.getOptionValue(object) === 'example text';

        cb(result);
    }, "getOptionValue: Checks selected option value (type: text)");  

    assert(function (cb) {
        var object = [{uid: "1rrtjll2sl4"}, {v: 'example text' }];

        var result = Form.getOptionValue(object) === object;

        cb(result);
    }, "getOptionValue: Checks if non-object rejected");  

    assert(function (cb) {
        var values = [{ uid: "1rrtjll2sl4", v: 1680688800000 }, { uid: "7dehmmrmac9", v: 'example text' }];

        var result = JSON.stringify(Form.extractValues(values)) === JSON.stringify([1680688800000,'example text']);

        cb(result);
    }, "extractValues: Checks if option value array generated");  

    assert(function (cb) {
        var values = { uid: "1rrtjll2sl4", v: 1680688800000 };

        var result = JSON.stringify(Form.extractValues(values)) === JSON.stringify([]);

        cb(result);
    }, "extractValues: Checks if non-array rejected");  

    assert(function (cb) {
        var values = [{ uid: "1rrtjll2sl4", v: 1680688800000 }];

        var result = JSON.stringify(Form.extractValues(values)) === JSON.stringify([1680688800000]);

        cb(result);
    }, "extractValues: Checks if option value array generated with only one value");  

    assert(function (cb) {
        var values = [];

        var result = JSON.stringify(Form.extractValues(values)) === JSON.stringify([]);

        cb(result);
    }, "extractValues: Checks if option value array generated with only one value");  

    
    assert(function (cb) {
        var answers = {"WenuyjXqytwp4RvjOnkqL2mL+Z1OUOGwzKAFqD++2FM=|6ic6tr4cio3":{"msg":{"4cdnfi0j2fa":"answer3","4qt5cp2e5rv":"Option 1","_uid":"6ic6tr4cio3","_time":1681914626141,"_hash":"zjRZuLldOGGDiMDADt+9RHTvEhRFMmllPLRpx0TrAClqvXlp34wOBm2Td/Wzi5Wd"},"hash":"zjRZuLldOGGDiMDADt+9RHTvEhRFMmllPLRpx0TrAClqvXlp34wOBm2Td/Wzi5Wd","time":1681914626141},
        "3yqquxm647TlFfCj0BlYnWgWLTa+YwvUP3WNBR/1RV0=|129h2op1sb7":{"msg":{"4cdnfi0j2fa":"answer2","4qt5cp2e5rv":"Option 1","_uid":"129h2op1sb7","_time":1681914593908,"_hash":"zAe3Fu+WNsn0vDJypAkMAvhVi2pKNVFICnM07jWHWNNu1TFm5MXFdfUMnL3TdxWx"},"hash":"zAe3Fu+WNsn0vDJypAkMAvhVi2pKNVFICnM07jWHWNNu1TFm5MXFdfUMnL3TdxWx","time":1681914593908},
        "Si2A3iC2Z4rcghpAPrh6vc/Bish5HZ0RGryqMljJyjo=|fhs3rsq5ef":{"msg":{"4cdnfi0j2fa":"answer1","4qt5cp2e5rv":"Option 2","_uid":"fhs3rsq5ef","_time":1681914418756,"_hash":"LxqKNj8HD3Jp9B8OVnmkPAzolM9H2Fa4TW2KrbwYZoy1PFGrrham9ftuZxesUE0i"},"hash":"LxqKNj8HD3Jp9B8OVnmkPAzolM9H2Fa4TW2KrbwYZoy1PFGrrham9ftuZxesUE0i","time":1681914418756}};
        
        var result = JSON.stringify(Form.getSortedKeys(answers)) === JSON.stringify(["Si2A3iC2Z4rcghpAPrh6vc/Bish5HZ0RGryqMljJyjo=|fhs3rsq5ef","3yqquxm647TlFfCj0BlYnWgWLTa+YwvUP3WNBR/1RV0=|129h2op1sb7","WenuyjXqytwp4RvjOnkqL2mL+Z1OUOGwzKAFqD++2FM=|6ic6tr4cio3"]);

        cb(result);
    }, "getSortedKeys: Checks if answer key array generated in correct order (by date)");  

 
    assert(function (cb) {
        var dateToday = new Date(1681202916647);

        var result = String(Form.getDay(dateToday)) === "Tue Apr 11 2023 00:00:00 GMT+0200 (Central European Summer Time)";

        cb(result);
    }, "getDay: Checks if correct day extracted from datetime");  

    assert(function (cb) {
        var dateOne = new Date('2023-01-23');
        var dateTwo = new Date('2023-01-27');

        var result = JSON.stringify(Form.getDayArray(dateOne, dateTwo)) === JSON.stringify([1674428400000,1674514800000,1674601200000,1674687600000,1674774000000]);

        cb(result);
    }, "getDayArray: Checks if day array generated in correct order");  
 

    assert(function (cb) {
        var answers = {"NixYYkVPFCYUBh8LOQ1VchV7lfaTW4vgNiAKq89y+j0=":{"4oril7f8on3":{"msg":{"2":"Option 1","6v52hnop75":"text answer1","_uid":"4oril7f8on3","_time":1681813029990,"_hash":"Q6NjRGHWbmIIvEJ8RoLcTzfM+d/4NgHnT6xltkjK7Il8v6iIWSyS97gUHVKnRfZb"},"hash":"Q6NjRGHWbmIIvEJ8RoLcTzfM+d/4NgHnT6xltkjK7Il8v6iIWSyS97gUHVKnRfZb","time":1681813029990}},"Sf2e5dvPYQZYOcIhr4jxeO+fDvXiytggDtGx8Uan4mE=":{"2bpmiu5vbqu":{"msg":{"2":"Option 2","6v52hnop75":"text answer2","_userdata":{"name":"name1"},"_uid":"2bpmiu5vbqu","_time":1681813111981,"_hash":"hVYUczHSRsNr0lNqrqx7AYpV0eyDB2WK0ozVV482DMwdGU0BPLIBUmK6kkYhP71J"},"hash":"hVYUczHSRsNr0lNqrqx7AYpV0eyDB2WK0ozVV482DMwdGU0BPLIBUmK6kkYhP71J","time":1681813111981}}};

        var result = JSON.stringify(Form.parseAnswers(answers)) === JSON.stringify({"NixYYkVPFCYUBh8LOQ1VchV7lfaTW4vgNiAKq89y+j0=|4oril7f8on3":{"msg":{"2":"Option 1","6v52hnop75":"text answer1","_uid":"4oril7f8on3","_time":1681813029990,"_hash":"Q6NjRGHWbmIIvEJ8RoLcTzfM+d/4NgHnT6xltkjK7Il8v6iIWSyS97gUHVKnRfZb"},"hash":"Q6NjRGHWbmIIvEJ8RoLcTzfM+d/4NgHnT6xltkjK7Il8v6iIWSyS97gUHVKnRfZb","time":1681813029990},"Sf2e5dvPYQZYOcIhr4jxeO+fDvXiytggDtGx8Uan4mE=|2bpmiu5vbqu":{"msg":{"2":"Option 2","6v52hnop75":"text answer2","_userdata":{"name":"name1"},"_uid":"2bpmiu5vbqu","_time":1681813111981,"_hash":"hVYUczHSRsNr0lNqrqx7AYpV0eyDB2WK0ozVV482DMwdGU0BPLIBUmK6kkYhP71J"},"hash":"hVYUczHSRsNr0lNqrqx7AYpV0eyDB2WK0ozVV482DMwdGU0BPLIBUmK6kkYhP71J","time":1681813111981}});

        cb(result);
    }, "parseAnswers: Checks if answers parsed correctly");  


    assert(function (cb) {
        var answers = {"NixYYkVPFCYUBh8LOQ1VchV7lfaTW4vgNiAKq89y+j0=":{"4oril7f8on3":{"msg":{"2":"","6v52hnop75":"","_uid":"4oril7f8on3","_time":1681813029990,"_hash":"Q6NjRGHWbmIIvEJ8RoLcTzfM+d/4NgHnT6xltkjK7Il8v6iIWSyS97gUHVKnRfZb"},"hash":"Q6NjRGHWbmIIvEJ8RoLcTzfM+d/4NgHnT6xltkjK7Il8v6iIWSyS97gUHVKnRfZb","time":1681813029990}},"Sf2e5dvPYQZYOcIhr4jxeO+fDvXiytggDtGx8Uan4mE=":{"2bpmiu5vbqu":{"msg":{"2":"","6v52hnop75":"","_userdata":{"name":"name1"},"_uid":"2bpmiu5vbqu","_time":1681813111981,"_hash":"hVYUczHSRsNr0lNqrqx7AYpV0eyDB2WK0ozVV482DMwdGU0BPLIBUmK6kkYhP71J"},"hash":"hVYUczHSRsNr0lNqrqx7AYpV0eyDB2WK0ozVV482DMwdGU0BPLIBUmK6kkYhP71J","time":1681813111981}}};

        var result = JSON.stringify(Form.parseAnswers(answers)) === JSON.stringify({"NixYYkVPFCYUBh8LOQ1VchV7lfaTW4vgNiAKq89y+j0=|4oril7f8on3":{"msg":{"2":"","6v52hnop75":"","_uid":"4oril7f8on3","_time":1681813029990,"_hash":"Q6NjRGHWbmIIvEJ8RoLcTzfM+d/4NgHnT6xltkjK7Il8v6iIWSyS97gUHVKnRfZb"},"hash":"Q6NjRGHWbmIIvEJ8RoLcTzfM+d/4NgHnT6xltkjK7Il8v6iIWSyS97gUHVKnRfZb","time":1681813029990},"Sf2e5dvPYQZYOcIhr4jxeO+fDvXiytggDtGx8Uan4mE=|2bpmiu5vbqu":{"msg":{"2":"","6v52hnop75":"","_userdata":{"name":"name1"},"_uid":"2bpmiu5vbqu","_time":1681813111981,"_hash":"hVYUczHSRsNr0lNqrqx7AYpV0eyDB2WK0ozVV482DMwdGU0BPLIBUmK6kkYhP71J"},"hash":"hVYUczHSRsNr0lNqrqx7AYpV0eyDB2WK0ozVV482DMwdGU0BPLIBUmK6kkYhP71J","time":1681813111981}});

        cb(result);
    }, "parseAnswers: Checks if blank answers parsed correctly");  

    assert(function (cb) {
        var answers = {"NixYYkVPFCYUBh8LOQ1VchV7lfaTW4vgNiAKq89y+j0=":{"4oril7f8on3":{"msg":{"2":"Option 1","6v52hnop75":"text answer1","_uid":"4oril7f8on3","_time":1681813029990,"_hash":"Q6NjRGHWbmIIvEJ8RoLcTzfM+d/4NgHnT6xltkjK7Il8v6iIWSyS97gUHVKnRfZb"},"hash":"Q6NjRGHWbmIIvEJ8RoLcTzfM+d/4NgHnT6xltkjK7Il8v6iIWSyS97gUHVKnRfZb","time":1681813029990}},"Sf2e5dvPYQZYOcIhr4jxeO+fDvXiytggDtGx8Uan4mE=":{"2bpmiu5vbqu":{"msg":{"2":"Option 2","6v52hnop75":"text answer2","_userdata":{"name":""},"_uid":"2bpmiu5vbqu","_time":1681813111981,"_hash":"hVYUczHSRsNr0lNqrqx7AYpV0eyDB2WK0ozVV482DMwdGU0BPLIBUmK6kkYhP71J"},"hash":"hVYUczHSRsNr0lNqrqx7AYpV0eyDB2WK0ozVV482DMwdGU0BPLIBUmK6kkYhP71J","time":1681813111981}}};

        var result = JSON.stringify(Form.parseAnswers(answers)) === JSON.stringify({"NixYYkVPFCYUBh8LOQ1VchV7lfaTW4vgNiAKq89y+j0=|4oril7f8on3":{"msg":{"2":"Option 1","6v52hnop75":"text answer1","_uid":"4oril7f8on3","_time":1681813029990,"_hash":"Q6NjRGHWbmIIvEJ8RoLcTzfM+d/4NgHnT6xltkjK7Il8v6iIWSyS97gUHVKnRfZb"},"hash":"Q6NjRGHWbmIIvEJ8RoLcTzfM+d/4NgHnT6xltkjK7Il8v6iIWSyS97gUHVKnRfZb","time":1681813029990},"Sf2e5dvPYQZYOcIhr4jxeO+fDvXiytggDtGx8Uan4mE=|2bpmiu5vbqu":{"msg":{"2":"Option 2","6v52hnop75":"text answer2","_userdata":{"name":""},"_uid":"2bpmiu5vbqu","_time":1681813111981,"_hash":"hVYUczHSRsNr0lNqrqx7AYpV0eyDB2WK0ozVV482DMwdGU0BPLIBUmK6kkYhP71J"},"hash":"hVYUczHSRsNr0lNqrqx7AYpV0eyDB2WK0ozVV482DMwdGU0BPLIBUmK6kkYhP71J","time":1681813111981}});

        cb(result);
    }, "parseAnswers: Checks if anonymous answers parsed correctly");  

    assert(function (cb) {
        var answers = {"dnD12ORDDrY/tyN84dhBDznuJMxyPbXTk9qDygrqnmg=":{"726f3f4ulmd":{"msg":{"2":"Option 1","7mkcosm2rt0":"answer text","_uid":"726f3f4ulmd","_time":1681300220930,"_hash":"0n6I/4EK2yln5mVngTMXSYSCZSIY0CZwdLcgQqwQgyEvIWen7GrcFOfGNlY8+eIF"},"hash":"0n6I/4EK2yln5mVngTMXSYSCZSIY0CZwdLcgQqwQgyEvIWen7GrcFOfGNlY8+eIF","time":1681300220930}},"p6GuFDW8MBFm08qk8wYQtXHdKGhSBsdR5NgphX3dIyA=":{"ofu17vk29q":{"msg":{"2":"Option 2","7mkcosm2rt0":"example text","_uid":"ofu17vk29q","_time":1681300240916,"_hash":"Af7QrdwMPTdiGK8GmVgHxHDzMwDqqyVj0nhT/ZlIrIwTLDtdRmgAuL69EEU7VIWJ"},"hash":"Af7QrdwMPTdiGK8GmVgHxHDzMwDqqyVj0nhT/ZlIrIwTLDtdRmgAuL69EEU7VIWJ","time":1681300240916}},"O6+R4oi9CN2PIK/G9CcvZGWPaOnp+wdPnT4C87XLu0E=":{"7gvtagjf10j":{"msg":{"7mkcosm2rt0":"","_userdata":{"name":"example name"},"_uid":"7gvtagjf10j","_time":1681300260886,"_hash":"ViJDNNV7ZzS0u15REcRh+IUyImfN0rAzNpa2KONuZRyj3+eOTxeBppTmlYaC2uXj"},"hash":"ViJDNNV7ZzS0u15REcRh+IUyImfN0rAzNpa2KONuZRyj3+eOTxeBppTmlYaC2uXj","time":1681300260886}}};

        var result = Form.getAnswersLength(answers) === 3;

        cb(result);
    }, "getAnswersLength: Checks if answers length correct");  

    assert(function (cb) {
        var answers = {"dnD12ORDDrY/tyN84dhBDznuJMxyPbXTk9qDygrqnmg=":{"726f3f4ulmd":{"msg":{"2":"","7mkcosm2rt0":"","_uid":"726f3f4ulmd","_time":1681300220930,"_hash":"0n6I/4EK2yln5mVngTMXSYSCZSIY0CZwdLcgQqwQgyEvIWen7GrcFOfGNlY8+eIF"},"hash":"0n6I/4EK2yln5mVngTMXSYSCZSIY0CZwdLcgQqwQgyEvIWen7GrcFOfGNlY8+eIF","time":1681300220930}},"p6GuFDW8MBFm08qk8wYQtXHdKGhSBsdR5NgphX3dIyA=":{"ofu17vk29q":{"msg":{"2":"","7mkcosm2rt0":"","_uid":"ofu17vk29q","_time":1681300240916,"_hash":"Af7QrdwMPTdiGK8GmVgHxHDzMwDqqyVj0nhT/ZlIrIwTLDtdRmgAuL69EEU7VIWJ"},"hash":"Af7QrdwMPTdiGK8GmVgHxHDzMwDqqyVj0nhT/ZlIrIwTLDtdRmgAuL69EEU7VIWJ","time":1681300240916}},"O6+R4oi9CN2PIK/G9CcvZGWPaOnp+wdPnT4C87XLu0E=":{"7gvtagjf10j":{"msg":{"7mkcosm2rt0":"","_userdata":{"name":"example name"},"_uid":"7gvtagjf10j","_time":1681300260886,"_hash":"ViJDNNV7ZzS0u15REcRh+IUyImfN0rAzNpa2KONuZRyj3+eOTxeBppTmlYaC2uXj"},"hash":"ViJDNNV7ZzS0u15REcRh+IUyImfN0rAzNpa2KONuZRyj3+eOTxeBppTmlYaC2uXj","time":1681300260886}}};

        var result = Form.getAnswersLength(answers) === 3;

        cb(result);
    }, "getAnswersLength: Checks if blank answers length correct");  

    assert(function (cb) {
        var uid = "66gk9ne3plg";
        var items = [{ uid: "6v52hnop75", v: "Item 2" }, { uid: "66gk9ne3plg", v: "Item 1" }];
        
        var result = Form.findItem(items, uid) === 'Item 1';

        cb(result);
    }, "findItem: Checks if correct answer value identified in object (by uid)");  

    assert(function (cb) {

        var content = {"answers":{"anonymous":true,"channel":"f0c618aafe7071f8c239834793643d66","publicKey":"82gx8xzoV6bgHBQ1zoic57b2cjgxZ9zO2V67c2486ng=","validateKey":"in4+E1sKdZ+MHayQ5O2gJdMqi4Tvmk35/z/1HEqTr4M=","version":2},"form":{"1q086i8iuv0":{"opts":{"type":"text"},"type":"input"},"2de53antgns":{"opts":{"type":"text"},"type":"input"},"3nqrkethqre":{"opts":{"questions":["2de53antgns"],"when":[]},"type":"section"},"489ghit6aa6":{"opts":{"type":"text"},"type":"input"},"5l43527l18c":{"opts":{"maxLength":1000},"type":"textarea"},"5satfltfm3u":{"opts":{"type":"text"},"type":"input"}},"order":["5l43527l18c","489ghit6aa6","1q086i8iuv0","5satfltfm3u","3nqrkethqre"],"version":1};

        var result = JSON.stringify(Form.getSections(content)) === JSON.stringify(["3nqrkethqre"]);

        cb(result);
    }, "getSections: Checks if section question type correctly identified (by uid)");  

    assert(function (cb) {
        var content = {"answers":{"anonymous":true,"channel":"dd879143bd4a49fd7e68f6c5109e4d9f","publicKey":"Ja4U/ESMGx/BjTTChbAZD+SFG0P+93o3F4XW6CJR0DA=","validateKey":"swNQf0LqJFWThBSE+iw8VryY2xId+QVcbn9XFeLNfXU=","version":2},"form":{"3e81recgc5g":{"opts":{"type":"text"},"type":"input"},"60tij442l02":{"opts":{"questions":["3e81recgc5g"],"when":[]},"type":"section"},"6bbmju7i65i":{"opts":{"type":"text"},"type":"input"}},"order":["6bbmju7i65i","60tij442l02"],"version":1};
        
        var result = JSON.stringify(Form.getSections(content)) === JSON.stringify([ "60tij442l02" ]);

        cb(result);
    }, "getSections: Checks if section question type correctly identified (by uid)");  

    assert(function (cb) {
        var content = {"answers":{"anonymous":true,"channel":"f0c618aafe7071f8c239834793643d66","publicKey":"82gx8xzoV6bgHBQ1zoic57b2cjgxZ9zO2V67c2486ng=","validateKey":"in4+E1sKdZ+MHayQ5O2gJdMqi4Tvmk35/z/1HEqTr4M=","version":2},"form":{"1q086i8iuv0":{"opts":{"type":"text"},"type":"input"},"2de53antgns":{"opts":{"type":"text"},"type":"input"},"489ghit6aa6":{"opts":{"type":"text"},"type":"input"},"5l43527l18c":{"opts":{"maxLength":1000},"type":"textarea"},"5satfltfm3u":{"opts":{"type":"text"},"type":"input"}},"order":["5l43527l18c","489ghit6aa6","1q086i8iuv0","5satfltfm3u","3nqrkethqre"],"version":1};

        var result = JSON.stringify(Form.getSections(content)) === JSON.stringify([]);

        cb(result);
    }, "getSections: Checks if lack of section question type correctly identified");  

    assert(function (cb) {
        var content = {"answers":{"anonymous":true,"channel":"f0c618aafe7071f8c239834793643d66","publicKey":"82gx8xzoV6bgHBQ1zoic57b2cjgxZ9zO2V67c2486ng=","validateKey":"in4+E1sKdZ+MHayQ5O2gJdMqi4Tvmk35/z/1HEqTr4M=","version":2},"form":{"1q086i8iuv0":{"opts":{"type":"text"},"type":"input"},"2de53antgns":{"opts":{"type":"text"},"type":"input"},"3nqrkethqre":{"opts":{"questions":["2de53antgns"],"when":[]},"type":"section"},"489ghit6aa6":{"opts":{"type":"text"},"type":"input"},"5l43527l18c":{"opts":{"maxLength":1000},"type":"textarea"},"5satfltfm3u":{"opts":{"type":"text"},"type":"input"}},"order":["5l43527l18c","489ghit6aa6","1q086i8iuv0","5satfltfm3u","3nqrkethqre"],"version":1};

        var result = JSON.stringify(Form.getFullOrder(content)) === JSON.stringify([ "5l43527l18c", "489ghit6aa6", "1q086i8iuv0", "5satfltfm3u", "3nqrkethqre", "2de53antgns" ]);

        cb(result);
    }, "getFullOrder: Checks if array of answer uids generated in correct order (by date)"); 
    
    assert(function (cb) {
        var content = {"answers":{"anonymous":true,"channel":"dd879143bd4a49fd7e68f6c5109e4d9f","publicKey":"Ja4U/ESMGx/BjTTChbAZD+SFG0P+93o3F4XW6CJR0DA=","validateKey":"swNQf0LqJFWThBSE+iw8VryY2xId+QVcbn9XFeLNfXU=","version":2},"form":{"3e81recgc5g":{"opts":{"type":"text"},"type":"input"},"53g43utbomt":{"opts":{"type":"text"},"type":"input"},"60tij442l02":{"opts":{"questions":["3e81recgc5g"],"when":[]},"type":"section"},"78uh4r9n10u":{"opts":{"values":[{"uid":"384h23hpkcm","v":"Option 1"},{"uid":"3nnb01frfvl","v":"Option 2"}]},"type":"radio"},"3s5hqske4pc":{"opts":{"type":"text"},"type":"input"}},"order":["60tij442l02","78uh4r9n10u","53g43utbomt","3s5hqske4pc"],"version":1};
        var uid = "60tij442l02";
        Form.removeQuestion(content, uid);

        var result = JSON.stringify(content.order) === JSON.stringify(["78uh4r9n10u", "53g43utbomt", "3s5hqske4pc"]);

        cb(result);
    }, "removeQuestion: Checks if correct answer removed");  

    assert(function (cb) {
        APP.formBlocks = [{"tag":{},"uid":"24g47h86dse"},{"tag":{"jQuery36000305062174891187481":{"events":{"keypress":[{"type":"keypress","origType":"keypress","guid":57,"namespace":""}],"change":[{"type":"change","origType":"change","guid":57,"namespace":""}]}}},"uid":"10uqm9r35h9"}];
        var block = {"opts":{"questions":["10uqm9r35h9"],"when":[[{"is":1,"q":"24g47h86dse","uid":"7kiq9598am8","v":"Option 1"}]]},"type":"section"};
        
        var result = Form.checkCondition(block) === false;

        cb(result);
    }, "checkCondition: Checks if conditional section visible -- condition not fulfilled (radio)");

    assert(function (cb) {
        APP.formBlocks = [{"tag":{"jQuery360026175703682165851":{"events":{"keypress":[{"type":"keypress","origType":"keypress","guid":62,"namespace":""}],"change":[{"type":"change","origType":"change","guid":62,"namespace":""}]}}},"uid":"10uqm9r35h9"}];
        var block = {"opts":{"questions":["10uqm9r35h9"],"when":[]},"type":"section"};
        
        var result = Form.checkCondition(block) === true;

        cb(result);
    }, "checkCondition: Checks if conditional section visible -- condition not fulfilled (no condition question present)");

    assert(function (cb) {
        APP.formBlocks = [{"tag":{},"uid":"h0h248nrpk"},{"tag":{"jQuery360047141651260228671":{"events":{"keypress":[{"type":"keypress","origType":"keypress","guid":59,"namespace":""}],"change":[{"type":"change","origType":"change","guid":59,"namespace":""}]}}},"uid":"10uqm9r35h9"}];
        var block = {"opts":{"questions":["10uqm9r35h9"],"when":[[{"is":1,"q":"h0h248nrpk","uid":"4ir5d5er545","v":"Option 1"}],[{"is":1,"q":"h0h248nrpk","uid":"1ggrinpholq","v":"Option 2"}]]},"type":"section"};
        
        var result = Form.checkCondition(block) === false;

        cb(result);
    }, "checkCondition: Checks if conditional section hidden -- multiple (OR) conditions fulfilled (checkbox)");  

    assert(function (cb) {
        var answers = {"PIZkFh+x41UdYNXEEAAhzNRG2juhlH6bbvX9xw+KO0c=|2fkkqujbog4":{"msg":{"7bnj9a8okpn":{"values":{"Option 1":"1","Option 2":"0","Option 3":"0"}},"_uid":"2fkkqujbog4","_time":1681411078436,"_hash":"FbIr34E1A88dX9QXflyxwa/uLIKmucq0XYvuRQyNxfoJSN7fO4oh/KxxVekDXqAk"},"hash":"FbIr34E1A88dX9QXflyxwa/uLIKmucq0XYvuRQyNxfoJSN7fO4oh/KxxVekDXqAk","time":1681411078436}};
        var uid = "7bnj9a8okpn";
        var result = JSON.stringify(Form.getBlockAnswers(answers, uid)) === JSON.stringify([{"curve":"PIZkFh+x41UdYNXEEAAhzNRG2juhlH6bbvX9xw+KO0c=","results":{"values":{"Option 1":"1","Option 2":"0","Option 3":"0"}},"time":1681411078436}]);

        cb(result);
    }, "getBlockAnswers: Check if block answers parsed correctly (anonymous user)");  

    assert(function (cb) {
        var answers = {"m/512rQ+TIOyLPmmlU2vQmdlrvAUw+aTVC5Jqu8JRWs=|1ggkp31dnnm":{"msg":{"6ep01jd30on":{"values":{"Option 1":"1","Option 2":"0","Option 3":"0"}},"_userdata":{"name":"maria","notifications":"07ea0832a1dbe2d4b1f8aa4fa943461c","curvePublic":"m/512rQ+TIOyLPmmlU2vQmdlrvAUw+aTVC5Jqu8JRWs=","profile":"/2/profile/view/6INXtxenl5uTvnf6Z7jYro8laeZLmq2qPGgNx+fZe+c/"},"_proof":{"key":"ezXdh5z9QEA0kiG32EyxL6QOVqNj2bsOuIMzF9hBoEM=","proof":"zDRfpkb2yWwCj/Gm0P58195/JwsxAdtbhNKilDPmQ0INYRPORAZokeWK8NrkNXXyXfYvnnOiL6VtNOHlHOmnkrjJMFqCGgc4"},"_uid":"1ggkp31dnnm","_time":1682017859867,"_hash":"AYbmLIObWTXlebjUZ3OPcrbjaMdwve3BIicFKbzt0ThfKFHR8WIoV29rv8m69J30"},"hash":"AYbmLIObWTXlebjUZ3OPcrbjaMdwve3BIicFKbzt0ThfKFHR8WIoV29rv8m69J30","time":1682017859867}};
        var uid = "6ep01jd30on";
        var editable = true;
        var filterCurve = "m/512rQ+TIOyLPmmlU2vQmdlrvAUw+aTVC5Jqu8JRWs=";

        var result = JSON.stringify(Form.getBlockAnswers(answers, uid, !editable && filterCurve)) === JSON.stringify([{"curve":"m/512rQ+TIOyLPmmlU2vQmdlrvAUw+aTVC5Jqu8JRWs=","user":{"name":"maria","notifications":"07ea0832a1dbe2d4b1f8aa4fa943461c","curvePublic":"m/512rQ+TIOyLPmmlU2vQmdlrvAUw+aTVC5Jqu8JRWs=","profile":"/2/profile/view/6INXtxenl5uTvnf6Z7jYro8laeZLmq2qPGgNx+fZe+c/"},"results":{"values":{"Option 1":"1","Option 2":"0","Option 3":"0"}},"time":1682017859867}]);

        cb(result);
    }, "getBlockAnswers: Check if block answers parsed correctly (registered user)");  

    assert(function (cb) {
        var content = {"answers":{"anonymous":true,"channel":"8d5fa589851278caf1dde96573f3217e","publicKey":"rh1PZ5aCUhc3qe9w7OUMjLMvpNVi2Tz7b3CUV2DOnTA=","validateKey":"d73YpYxsGiuOsELJCzc1BveZhZq+6tb3xaq89ldfV5A=","version":2},"form":{"5tk7ip4n1qp":{"opts":{"type":"text"},"type":"input"},"69hrg9rnvut":{"opts":{"max":3,"required":true,"values":[{"uid":"1dgo4l7iqgq","v":"Option 1"},{"uid":"26t62c0jclc","v":"Option 2"},{"uid":"7dd8di8tmel","v":"Option 3"}]},"type":"checkbox"},"7vhuq03d8ps":{"opts":{"questions":["5tk7ip4n1qp"],"when":[[{"is":1,"q":"69hrg9rnvut","uid":"7bl8lt9840o","v":"Option 1"}]]},"type":"section"}},"order":["69hrg9rnvut","7vhuq03d8ps"],"version":1};
        var uid = "69hrg9rnvut";

        var result = JSON.stringify(Form.getSectionFromQ(content, uid)) === JSON.stringify({"arr":["69hrg9rnvut","7vhuq03d8ps"],"idx":0});

        cb(result);
    }, "getSectionFromQ: Check if correct uid array generated when conditional section present (one conditional question)");  

    assert(function (cb) {
        var content = {"answers":{"anonymous":true,"channel":"8d5fa589851278caf1dde96573f3217e","publicKey":"rh1PZ5aCUhc3qe9w7OUMjLMvpNVi2Tz7b3CUV2DOnTA=","validateKey":"d73YpYxsGiuOsELJCzc1BveZhZq+6tb3xaq89ldfV5A=","version":2},"form":{"5tk7ip4n1qp":{"opts":{"type":"text"},"type":"input"},"69hrg9rnvut":{"opts":{"max":3,"required":true,"values":[{"uid":"1dgo4l7iqgq","v":"Option 1"},{"uid":"26t62c0jclc","v":"Option 2"},{"uid":"7dd8di8tmel","v":"Option 3"}]},"q":"question2","type":"checkbox"},"6r9qdlr0u2":{"opts":{"values":[{"uid":"16macuje6iq","v":"Option 1"},{"uid":"4hpacdfnvid","v":"Option 2"}]},"q":"question1","type":"radio"},"7vhuq03d8ps":{"opts":{"questions":["5tk7ip4n1qp"],"when":[[{"is":1,"q":"69hrg9rnvut","uid":"7bl8lt9840o","v":"Option 1"}],[{"is":1,"q":"6r9qdlr0u2","uid":"7icugfhfi2d","v":"Option 2"}]]},"type":"section"}},"order":["6r9qdlr0u2","69hrg9rnvut","7vhuq03d8ps"],"version":1};
        var uid = "69hrg9rnvut";

        var result = JSON.stringify(Form.getSectionFromQ(content, uid)) === JSON.stringify({"arr":["6r9qdlr0u2","69hrg9rnvut","7vhuq03d8ps"],"idx":1});

        cb(result);
    }, "getSectionFromQ: Check if correct uid array generated when conditional section present (two conditional questions)");  

    assert(function (cb) {
        var _answers = {"vy9HAs3lHjjdD6dob8azENP7J8F52/GfTdBGZP89LVo=|6ge8ff4tlob":{"msg":{"5nlo2d3vik2":["H","I","J","K"],"_uid":"6ge8ff4tlob","_time":1682023994086,"_hash":"vSFODg+ERjSNzluFBkTtNFWKwRX4VyNLaIoWHGdX/mdwEAJhYec37ezQ1NrSobTJ"},"hash":"vSFODg+ERjSNzluFBkTtNFWKwRX4VyNLaIoWHGdX/mdwEAJhYec37ezQ1NrSobTJ","time":1682023994086},"ojccyFYZAagrgbl2SeYK6flY3s6k49GLRC+95uE6vmU=|55q1cfmol3":{"msg":{"5nlo2d3vik2":["H","I","J","K"],"_uid":"55q1cfmol3","_time":1682024029120,"_hash":"mNMXSsj7+oQ41CUwmBDEkX5NItqRmhErFY6PynjF1n1qhdc13wCxlcs7geC3D9TR"},"hash":"mNMXSsj7+oQ41CUwmBDEkX5NItqRmhErFY6PynjF1n1qhdc13wCxlcs7geC3D9TR","time":1682024029120},"tzhcg6al6/bSBlusJsbMeULEr57UiUw2J3pgJcYFzi8=|7fr3t26hgpd":{"msg":{"5nlo2d3vik2":["H","I","J","K"],"_uid":"7fr3t26hgpd","_time":1682024076603,"_hash":"imVXZLoCT65lkuDh57kZ3cdr16/+d78Dx6R3Fu/ObmRkvdsBoc2t/j4w48Pcz28w"},"hash":"imVXZLoCT65lkuDh57kZ3cdr16/+d78Dx6R3Fu/ObmRkvdsBoc2t/j4w48Pcz28w","time":1682024076603}};
        var opts = {"values":[{"uid":"2vvgb1hudfb","v":"H"},{"uid":"1n3scu8at0d","v":"I"},{"uid":"6o1eie3pr73","v":"J"},{"uid":"77hl1brl9ot","v":"K"}]};
        var uid = "5nlo2d3vik2";
        var form = {"5nlo2d3vik2":{"opts":{"values":[{"uid":"2vvgb1hudfb","v":"H"},{"uid":"1n3scu8at0d","v":"I"},{"uid":"6o1eie3pr73","v":"J"},{"uid":"77hl1brl9ot","v":"K"}]},"type":"sort","condorcetmethod":"schulze"}};
        var optionArray = ["H","I","J","K"];
        var listOfLists = [["H","I","J","K"],["H","I","J","K"],["H","I","J","K"]];

        var result = JSON.stringify(Condorcet.showCondorcetWinner(_answers, opts, uid, form, optionArray, listOfLists)[0]) === JSON.stringify(["H"]);

        cb(result);
    }, "showCondorcetWinner: Check if correct winner calculated with 4 candidates, 3 votes - Schulze");  

    assert(function (cb) {
        var _answers = {"vy9HAs3lHjjdD6dob8azENP7J8F52/GfTdBGZP89LVo=|6ge8ff4tlob":{"msg":{"5nlo2d3vik2":["H","I","J","K"],"_uid":"6ge8ff4tlob","_time":1682023994086,"_hash":"vSFODg+ERjSNzluFBkTtNFWKwRX4VyNLaIoWHGdX/mdwEAJhYec37ezQ1NrSobTJ"},"hash":"vSFODg+ERjSNzluFBkTtNFWKwRX4VyNLaIoWHGdX/mdwEAJhYec37ezQ1NrSobTJ","time":1682023994086},"ojccyFYZAagrgbl2SeYK6flY3s6k49GLRC+95uE6vmU=|55q1cfmol3":{"msg":{"5nlo2d3vik2":["H","I","J","K"],"_uid":"55q1cfmol3","_time":1682024029120,"_hash":"mNMXSsj7+oQ41CUwmBDEkX5NItqRmhErFY6PynjF1n1qhdc13wCxlcs7geC3D9TR"},"hash":"mNMXSsj7+oQ41CUwmBDEkX5NItqRmhErFY6PynjF1n1qhdc13wCxlcs7geC3D9TR","time":1682024029120},"tzhcg6al6/bSBlusJsbMeULEr57UiUw2J3pgJcYFzi8=|7fr3t26hgpd":{"msg":{"5nlo2d3vik2":["H","I","J","K"],"_uid":"7fr3t26hgpd","_time":1682024076603,"_hash":"imVXZLoCT65lkuDh57kZ3cdr16/+d78Dx6R3Fu/ObmRkvdsBoc2t/j4w48Pcz28w"},"hash":"imVXZLoCT65lkuDh57kZ3cdr16/+d78Dx6R3Fu/ObmRkvdsBoc2t/j4w48Pcz28w","time":1682024076603}};
        var opts = {"values":[{"uid":"2vvgb1hudfb","v":"H"},{"uid":"1n3scu8at0d","v":"I"},{"uid":"6o1eie3pr73","v":"J"},{"uid":"77hl1brl9ot","v":"K"}]};
        var uid = "5nlo2d3vik2";
        var form = {"5nlo2d3vik2":{"opts":{"values":[{"uid":"2vvgb1hudfb","v":"H"},{"uid":"1n3scu8at0d","v":"I"},{"uid":"6o1eie3pr73","v":"J"},{"uid":"77hl1brl9ot","v":"K"}]},"type":"sort","condorcetmethod":"ranked"}};
        var optionArray = ["H","I","J","K"];
        var listOfLists = [["H","I","J","K"],["H","I","J","K"],["H","I","J","K"]];

        var result = JSON.stringify(Condorcet.showCondorcetWinner(_answers, opts, uid, form, optionArray, listOfLists)[0]) === JSON.stringify(["H"]);

        cb(result);
    }, "showCondorcetWinner: Check if correct winner calculated with 4 candidates, 3 votes - Ranked Pairs");  

    assert(function (cb) {
        var _answers = {"BrRYeNfSyqahil0srSq01Y8iARtnyfXWYVIClnkk50Y=|2a862o47naf":{"msg":{"65r2p8gh5qf":["L","K","J","H","I"],"_uid":"2a862o47naf","_time":1681729438126,"_hash":"hlwB+VCYvtZk0qDS0fq1Gdy7owebExsmiko6EGNkt2kgEhb6nDSpHYCP2q3WvIy5"},"hash":"hlwB+VCYvtZk0qDS0fq1Gdy7owebExsmiko6EGNkt2kgEhb6nDSpHYCP2q3WvIy5","time":1681729438126},
        "4MzNy/ngg+eD3lkzNjUkd+LLZuZQjqlVYGQSoPR5FFI=|48bl2bcqnt":{"msg":{"65r2p8gh5qf":["L","K","J","H","I"],"_uid":"48bl2bcqnt","_time":1681729479742,"_hash":"jgsfd4vtX3jsw6g71xYUaf9DdWTSb2v4UPgHG9fBZpjAp0JSYaH2pUC/koMbe4p3"},"hash":"jgsfd4vtX3jsw6g71xYUaf9DdWTSb2v4UPgHG9fBZpjAp0JSYaH2pUC/koMbe4p3","time":1681729479742},
        "fFYzog7ADT2GzUfORIAuhCzntnHpKY2oRn0RlUnLEUY=|3cvbde3nhs7":{"msg":{"65r2p8gh5qf":["K","L","I","J","H"],"_uid":"3cvbde3nhs7","_time":1681729514124,"_hash":"KYqp7mc2MWYoHsFeI0x1z2MI7hGC8B/tYW0Bmxr/nKGGRnyWsNSEn2jkjMxtA/fR"},"hash":"KYqp7mc2MWYoHsFeI0x1z2MI7hGC8B/tYW0Bmxr/nKGGRnyWsNSEn2jkjMxtA/fR","time":1681729514124},
        "/OGbAfIH5H/3DpaVLWPqpu5D326uLGZM42mkEmNq4js=|fcdvvu3mfo":{"msg":{"65r2p8gh5qf":["L","K","J","I","H"],"_uid":"fcdvvu3mfo","_time":1681729554074,"_hash":"H+pYz0PfMWPNDhu6x2SdAv+t4INyhuWrYEKwVnhlTf1cyNaaa2mg8WpgDFDwGr2H"},"hash":"H+pYz0PfMWPNDhu6x2SdAv+t4INyhuWrYEKwVnhlTf1cyNaaa2mg8WpgDFDwGr2H","time":1681729554074},
        "S1v4WXaJ08I77ESVApP25wPO4pMpL3cmjDzXff9lXng=|156bst1uoie":{"msg":{"65r2p8gh5qf":["I","K","L","J","H"],"_uid":"156bst1uoie","_time":1681729592875,"_hash":"DcQ/+/bnCm5Gb/dc8kwcARO7H9bdnYVNF/la9HKp79bCDvwBenJ8gaMij7slunME"},"hash":"DcQ/+/bnCm5Gb/dc8kwcARO7H9bdnYVNF/la9HKp79bCDvwBenJ8gaMij7slunME","time":1681729592875},
        "8K4aWZP1Mp/yL2p43R/VHl+PS1JIAEE5ioKOKlM2tzU=|1f5g4r4lcnb":{"msg":{"65r2p8gh5qf":["I","H","L","K","J"],"_uid":"1f5g4r4lcnb","_time":1681729633223,"_hash":"nthzCJW22uWQYQSzRmYcBkRusaB3kCI5F+uY8GilzhutXZ+4rwpu1h4ulixxPTts"},"hash":"nthzCJW22uWQYQSzRmYcBkRusaB3kCI5F+uY8GilzhutXZ+4rwpu1h4ulixxPTts","time":1681729633223},
        "SQMP2n/pancHJ0dNBDO9sVkVgC5Lfg5lDDp1gXrwNjI=|4mrbrvtdjr2":{"msg":{"65r2p8gh5qf":["L","J","H","K","I"],"_uid":"4mrbrvtdjr2","_time":1681729673738,"_hash":"mgcfHEyk9TonLA9xoH73Ve0K2kKU5ERKCp+cKsD8j8Mo6W0vd/cUXOSwhQRKbldZ"},"hash":"mgcfHEyk9TonLA9xoH73Ve0K2kKU5ERKCp+cKsD8j8Mo6W0vd/cUXOSwhQRKbldZ","time":1681729673738},
        "JebFB/gqx7jbQ1yASx2n/eRoCyj7EoqrkQaXi9Tt+Ag=|12sa31aoc89":{"msg":{"65r2p8gh5qf":["L","I","K","J","H"],"_uid":"12sa31aoc89","_time":1681729716164,"_hash":"nL4K2tEPhKTlNsy4uQay0aeGGHp1CN2WtWm8n3NMv7pjs8VxH8XJz6bTiVA+LS3W"},"hash":"nL4K2tEPhKTlNsy4uQay0aeGGHp1CN2WtWm8n3NMv7pjs8VxH8XJz6bTiVA+LS3W","time":1681729716164},
        "l/GvVeqbpncsO7XBaT1wiawH7VCTbXp3gkgd0vsTTjI=|3kss4pjduva":{"msg":{"65r2p8gh5qf":["K","L","H","I","J"],"_uid":"3kss4pjduva","_time":1681729778475,"_hash":"xhP22oNoQGHyYxCSQVokr5G5f2aIgyFeMhPsE92vt75ZRbDNpGYxQSE0j/OYcvvU"},"hash":"xhP22oNoQGHyYxCSQVokr5G5f2aIgyFeMhPsE92vt75ZRbDNpGYxQSE0j/OYcvvU","time":1681729778475},
        "V4o2zbWb/BxI1FN9A99y9yVHl1rvtvGHoU7qGfYwzHw=|18d1q89hnru":{"msg":{"65r2p8gh5qf":["J","I","K","L","H"],"_uid":"18d1q89hnru","_time":1681729810956,"_hash":"Jhv25IP/1CqPcoEJQGr2GgJVR0OH5BBHT8zbCCN5xM+4vJF6T06ZP2T/B3pwkzIb"},"hash":"Jhv25IP/1CqPcoEJQGr2GgJVR0OH5BBHT8zbCCN5xM+4vJF6T06ZP2T/B3pwkzIb","time":1681729810956}};
        var opts = {"values":[{"uid":"2vvgb1hudfb","v":"H"},{"uid":"1n3scu8at0d","v":"I"},{"uid":"6o1eie3pr73","v":"J"},{"uid":"77hl1brl9ot","v":"K"}, {"uid":"77hl1brl9ot","v":"L"}]};
        var uid = "5nlo2d3vik2";
        var form = {"5nlo2d3vik2":{"opts":{"values":[{"uid":"2vvgb1hudfb","v":"H"},{"uid":"1n3scu8at0d","v":"I"},{"uid":"6o1eie3pr73","v":"J"},{"uid":"77hl1brl9ot","v":"K"}]},"type":"sort","condorcetmethod":"schulze"}};
        var optionArray = ["H","I","J","K", "L"];
        var listOfLists = [["L","K","J","H","I"],["L","K","J","H","I"],["K","L","I","J","H"],["L","K","J","I","H"],["I","K","L","J","H"],["I","H","L","K","J"],["L","J","H","K","I"],["L","I","K","J","H"],["K","L","H","I","J"],["J","I","K","L","H"]];

        var result = JSON.stringify(Condorcet.showCondorcetWinner(_answers, opts, uid, form, optionArray, listOfLists)[0]) === JSON.stringify(["L"]);
        cb(result);
    }, "showCondorcetWinner: Check if correct winner calculated with 5 candidates, 10 votes - Schulze");  

    assert(function (cb) {
        var _answers = {"BrRYeNfSyqahil0srSq01Y8iARtnyfXWYVIClnkk50Y=|2a862o47naf":{"msg":{"65r2p8gh5qf":["L","K","J","H","I"],"_uid":"2a862o47naf","_time":1681729438126,"_hash":"hlwB+VCYvtZk0qDS0fq1Gdy7owebExsmiko6EGNkt2kgEhb6nDSpHYCP2q3WvIy5"},"hash":"hlwB+VCYvtZk0qDS0fq1Gdy7owebExsmiko6EGNkt2kgEhb6nDSpHYCP2q3WvIy5","time":1681729438126},
        "4MzNy/ngg+eD3lkzNjUkd+LLZuZQjqlVYGQSoPR5FFI=|48bl2bcqnt":{"msg":{"65r2p8gh5qf":["L","K","J","H","I"],"_uid":"48bl2bcqnt","_time":1681729479742,"_hash":"jgsfd4vtX3jsw6g71xYUaf9DdWTSb2v4UPgHG9fBZpjAp0JSYaH2pUC/koMbe4p3"},"hash":"jgsfd4vtX3jsw6g71xYUaf9DdWTSb2v4UPgHG9fBZpjAp0JSYaH2pUC/koMbe4p3","time":1681729479742},
        "fFYzog7ADT2GzUfORIAuhCzntnHpKY2oRn0RlUnLEUY=|3cvbde3nhs7":{"msg":{"65r2p8gh5qf":["K","L","I","J","H"],"_uid":"3cvbde3nhs7","_time":1681729514124,"_hash":"KYqp7mc2MWYoHsFeI0x1z2MI7hGC8B/tYW0Bmxr/nKGGRnyWsNSEn2jkjMxtA/fR"},"hash":"KYqp7mc2MWYoHsFeI0x1z2MI7hGC8B/tYW0Bmxr/nKGGRnyWsNSEn2jkjMxtA/fR","time":1681729514124},
        "/OGbAfIH5H/3DpaVLWPqpu5D326uLGZM42mkEmNq4js=|fcdvvu3mfo":{"msg":{"65r2p8gh5qf":["L","K","J","I","H"],"_uid":"fcdvvu3mfo","_time":1681729554074,"_hash":"H+pYz0PfMWPNDhu6x2SdAv+t4INyhuWrYEKwVnhlTf1cyNaaa2mg8WpgDFDwGr2H"},"hash":"H+pYz0PfMWPNDhu6x2SdAv+t4INyhuWrYEKwVnhlTf1cyNaaa2mg8WpgDFDwGr2H","time":1681729554074},
        "S1v4WXaJ08I77ESVApP25wPO4pMpL3cmjDzXff9lXng=|156bst1uoie":{"msg":{"65r2p8gh5qf":["I","K","L","J","H"],"_uid":"156bst1uoie","_time":1681729592875,"_hash":"DcQ/+/bnCm5Gb/dc8kwcARO7H9bdnYVNF/la9HKp79bCDvwBenJ8gaMij7slunME"},"hash":"DcQ/+/bnCm5Gb/dc8kwcARO7H9bdnYVNF/la9HKp79bCDvwBenJ8gaMij7slunME","time":1681729592875},
        "8K4aWZP1Mp/yL2p43R/VHl+PS1JIAEE5ioKOKlM2tzU=|1f5g4r4lcnb":{"msg":{"65r2p8gh5qf":["I","H","L","K","J"],"_uid":"1f5g4r4lcnb","_time":1681729633223,"_hash":"nthzCJW22uWQYQSzRmYcBkRusaB3kCI5F+uY8GilzhutXZ+4rwpu1h4ulixxPTts"},"hash":"nthzCJW22uWQYQSzRmYcBkRusaB3kCI5F+uY8GilzhutXZ+4rwpu1h4ulixxPTts","time":1681729633223},
        "SQMP2n/pancHJ0dNBDO9sVkVgC5Lfg5lDDp1gXrwNjI=|4mrbrvtdjr2":{"msg":{"65r2p8gh5qf":["L","J","H","K","I"],"_uid":"4mrbrvtdjr2","_time":1681729673738,"_hash":"mgcfHEyk9TonLA9xoH73Ve0K2kKU5ERKCp+cKsD8j8Mo6W0vd/cUXOSwhQRKbldZ"},"hash":"mgcfHEyk9TonLA9xoH73Ve0K2kKU5ERKCp+cKsD8j8Mo6W0vd/cUXOSwhQRKbldZ","time":1681729673738},
        "JebFB/gqx7jbQ1yASx2n/eRoCyj7EoqrkQaXi9Tt+Ag=|12sa31aoc89":{"msg":{"65r2p8gh5qf":["L","I","K","J","H"],"_uid":"12sa31aoc89","_time":1681729716164,"_hash":"nL4K2tEPhKTlNsy4uQay0aeGGHp1CN2WtWm8n3NMv7pjs8VxH8XJz6bTiVA+LS3W"},"hash":"nL4K2tEPhKTlNsy4uQay0aeGGHp1CN2WtWm8n3NMv7pjs8VxH8XJz6bTiVA+LS3W","time":1681729716164},
        "l/GvVeqbpncsO7XBaT1wiawH7VCTbXp3gkgd0vsTTjI=|3kss4pjduva":{"msg":{"65r2p8gh5qf":["K","L","H","I","J"],"_uid":"3kss4pjduva","_time":1681729778475,"_hash":"xhP22oNoQGHyYxCSQVokr5G5f2aIgyFeMhPsE92vt75ZRbDNpGYxQSE0j/OYcvvU"},"hash":"xhP22oNoQGHyYxCSQVokr5G5f2aIgyFeMhPsE92vt75ZRbDNpGYxQSE0j/OYcvvU","time":1681729778475},
        "V4o2zbWb/BxI1FN9A99y9yVHl1rvtvGHoU7qGfYwzHw=|18d1q89hnru":{"msg":{"65r2p8gh5qf":["J","I","K","L","H"],"_uid":"18d1q89hnru","_time":1681729810956,"_hash":"Jhv25IP/1CqPcoEJQGr2GgJVR0OH5BBHT8zbCCN5xM+4vJF6T06ZP2T/B3pwkzIb"},"hash":"Jhv25IP/1CqPcoEJQGr2GgJVR0OH5BBHT8zbCCN5xM+4vJF6T06ZP2T/B3pwkzIb","time":1681729810956}};
        var opts = {"values":[{"uid":"2vvgb1hudfb","v":"H"},{"uid":"1n3scu8at0d","v":"I"},{"uid":"6o1eie3pr73","v":"J"},{"uid":"77hl1brl9ot","v":"K"}, {"uid":"77hl1brl9ot","v":"L"}]};
        var uid = "5nlo2d3vik2";
        var form = {"5nlo2d3vik2":{"opts":{"values":[{"uid":"2vvgb1hudfb","v":"H"},{"uid":"1n3scu8at0d","v":"I"},{"uid":"6o1eie3pr73","v":"J"},{"uid":"77hl1brl9ot","v":"K"}]},"type":"sort","condorcetmethod":"ranked"}};
        var optionArray = ["H","I","J","K", "L"];
        var listOfLists = [["L","K","J","H","I"],["L","K","J","H","I"],["K","L","I","J","H"],["L","K","J","I","H"],["I","K","L","J","H"],["I","H","L","K","J"],["L","J","H","K","I"],["L","I","K","J","H"],["K","L","H","I","J"],["J","I","K","L","H"]];

        var result = JSON.stringify(Condorcet.showCondorcetWinner(_answers, opts, uid, form, optionArray, listOfLists)[0]) === JSON.stringify(["L"]);

        cb(result);
    }, "showCondorcetWinner: Check if correct winner calculated with 5 candidates, 10 votes - Ranked Pairs");  

    assert(function (cb) {
        var _answers = {"AtqEIJD75kH0JNnubl9DyF8A3ygeUuCArKobfj1hMAo=|3nv303ppc9n":{"msg":{"1jb9rrcvoc2":["H","I","J","K"],"_uid":"3nv303ppc9n","_time":1681691174852,"_hash":"uj1gv3wDiYci/HnTQy1/kdqWR1WJbSGK96pjaEd1K6VCeFX+Q9rg/hex5tVOvWUh"},"hash":"uj1gv3wDiYci/HnTQy1/kdqWR1WJbSGK96pjaEd1K6VCeFX+Q9rg/hex5tVOvWUh","time":1681691174852}, "cUc1IgcyiworYhYg4HRux6lUBh/Do2pkWzj4L+og/RQ=|1snqaj863vt":{"msg":{"1jb9rrcvoc2":["I","H","J","K"],"_uid":"1snqaj863vt","_time":1681691214226,"_hash":"KKj7l8MFEjkboTeBrFc5xa4w8384PGedxer1VXt6d55wE4l3Okpy6fRhRinWnjNq"},"hash":"KKj7l8MFEjkboTeBrFc5xa4w8384PGedxer1VXt6d55wE4l3Okpy6fRhRinWnjNq","time":1681691214226}, "2FRwA83fQmnfQQWZdDP0XZPSsdm3GXjSe+83tEMheSw=|6o5mdpjn3kg":{"msg":{"1jb9rrcvoc2":["J","H","I","K"],"_uid":"6o5mdpjn3kg","_time":1681691249979,"_hash":"K5qthAGHeU+Ap4nBE/i5VeMUefnxS0pyFDrBLFvEvMGJ4JCslGS5Ny3Y0wqncHJJ"},"hash":"K5qthAGHeU+Ap4nBE/i5VeMUefnxS0pyFDrBLFvEvMGJ4JCslGS5Ny3Y0wqncHJJ","time":1681691249979},
        "6BCq4pys/NolQOtcBflOcYtmP1huKfvM+Z61fQ0Gn1M=|rdc3epmuh7":{"msg":{"1jb9rrcvoc2":["K","H","I","J"],"_uid":"rdc3epmuh7","_time":1681691294180,"_hash":"ClCx83SXaAjHsNJ+OEALxsMwKvMWvysNcnMYMqTU7j/F/7IWvrO3Yp6CIlAyXSz/"},"hash":"ClCx83SXaAjHsNJ+OEALxsMwKvMWvysNcnMYMqTU7j/F/7IWvrO3Yp6CIlAyXSz/","time":1681691294180},
        "U4SSHuTrrPTAKIIbZ31yN9uwEYfrFO0hd24sEoCatW0=|5c0gsctlfa3":{"msg":{"1jb9rrcvoc2":["J","K","I","H"],"_uid":"5c0gsctlfa3","_time":1681691329715,"_hash":"Sin191I6D3nEqR1WbKFLqANlHSBO/G79g8sx4KYRGfdwrQrzrYMN3CmgJfKkJmH1"},"hash":"Sin191I6D3nEqR1WbKFLqANlHSBO/G79g8sx4KYRGfdwrQrzrYMN3CmgJfKkJmH1","time":1681691329715},
        "HQdIprb544HD5r90txGofCfN/ixylbVYgrusFGXkDU4=|14fbfb8hb29":{"msg":{"1jb9rrcvoc2":["K","I","H","J"],"_uid":"14fbfb8hb29","_time":1681691363758,"_hash":"TNrqKd9bsewsDWYlYHSH1ojEUj+qUABXVycgk3VnK29FY/1Mic+NF/aOM1UCyHHV"},"hash":"TNrqKd9bsewsDWYlYHSH1ojEUj+qUABXVycgk3VnK29FY/1Mic+NF/aOM1UCyHHV","time":1681691363758},
        "Pxy28SkQA+ii90aj6OsocG47Z3tq/7timwZPlDVnSzU=|17i15n4stru":{"msg":{"1jb9rrcvoc2":["J","H","K","I"],"_uid":"17i15n4stru","_time":1681691458380,"_hash":"x3wMejkzQ3dWjV/DZacAusFhBz47Zr6wAzIRJPP4CJWStxq0EB9iQPoyKVoTiNH4"},"hash":"x3wMejkzQ3dWjV/DZacAusFhBz47Zr6wAzIRJPP4CJWStxq0EB9iQPoyKVoTiNH4","time":1681691458380},
        "MhX8MY3Vl4ZWhN6zu8T29QaU5Uxc29h0XBuqIt6PKnE=|76mbjm31shk":{"msg":{"1jb9rrcvoc2":["I","K","J","H"],"_uid":"76mbjm31shk","_time":1681691646905,"_hash":"jbJJ6jd4yJL5WXgbO4Wn9sUY2HKXAflLXU1Aahmr2aNZatyyWeX6vX4D19VB3z+j"},"hash":"jbJJ6jd4yJL5WXgbO4Wn9sUY2HKXAflLXU1Aahmr2aNZatyyWeX6vX4D19VB3z+j","time":1681691646905},
        "fDlnRZoxOC1P+pq8vgTn529jQfgl6arr5yhlLMXF7Us=|9nunhvjc3d":{"msg":{"1jb9rrcvoc2":["I","K","J","H"],"_uid":"9nunhvjc3d","_time":1681691706061,"_hash":"4XsvGVemRt1+jRjgN2hphMaw03YpM4Hip49aJDPWBdEGwhKica1gmJMDTp07L79i"},"hash":"4XsvGVemRt1+jRjgN2hphMaw03YpM4Hip49aJDPWBdEGwhKica1gmJMDTp07L79i","time":1681691706061}, 
        "f+/uzRwTUMck51HyqTN8s8QtETO7cqjhD80j/HNO7Bc=|1le2eskh2bc":{"msg":{"1jb9rrcvoc2":["I","J","K","H"],"_uid":"1le2eskh2bc","_time":1681691742592,"_hash":"bMzuEN6LDY2Hj2CRU0ITdlz8/cJRFNWgdTwE28nv0GYYG7TzP89bWWxnRg3FLgb5"},"hash":"bMzuEN6LDY2Hj2CRU0ITdlz8/cJRFNWgdTwE28nv0GYYG7TzP89bWWxnRg3FLgb5","time":1681691742592}};
        var opts = {"values":[{"uid":"343p2rnve50","v":"H"},{"uid":"7rgol8gpe2m","v":"I"},{"uid":"3u0id5u18db","v":"J"},{"uid":"5ghoh24cpjl","v":"K"}]};
        var uid = "1jb9rrcvoc2";
        var form = {"1jb9rrcvoc2":{"opts":{"values":[{"uid":"343p2rnve50","v":"H"},{"uid":"7rgol8gpe2m","v":"I"},{"uid":"3u0id5u18db","v":"J"},{"uid":"5ghoh24cpjl","v":"K"}]},"type":"sort","condorcetmethod":"schulze"}};
        var optionArray = ["H","I","J","K"];
        var listOfLists = [["H","I","J","K"],["I","H","J","K"],["J","H","I","K"],["K","H","I","J"],["J","K","I","H"],["K","I","H","J"],["J","H","K","I"],["I","K","J","H"],["I","K","J","H"],["I","J","K","H"]];

        var result = JSON.stringify(Condorcet.showCondorcetWinner(_answers, opts, uid, form, optionArray, listOfLists)[0]) === JSON.stringify(["I"]);

        cb(result);
    }, "showCondorcetWinner: Check if correct winner calculated with 4 candidates, 10 votes - Schulze");  

    assert(function (cb) {
        var _answers = {"AtqEIJD75kH0JNnubl9DyF8A3ygeUuCArKobfj1hMAo=|3nv303ppc9n":{"msg":{"1jb9rrcvoc2":["H","I","J","K"],"_uid":"3nv303ppc9n","_time":1681691174852,"_hash":"uj1gv3wDiYci/HnTQy1/kdqWR1WJbSGK96pjaEd1K6VCeFX+Q9rg/hex5tVOvWUh"},"hash":"uj1gv3wDiYci/HnTQy1/kdqWR1WJbSGK96pjaEd1K6VCeFX+Q9rg/hex5tVOvWUh","time":1681691174852}, "cUc1IgcyiworYhYg4HRux6lUBh/Do2pkWzj4L+og/RQ=|1snqaj863vt":{"msg":{"1jb9rrcvoc2":["I","H","J","K"],"_uid":"1snqaj863vt","_time":1681691214226,"_hash":"KKj7l8MFEjkboTeBrFc5xa4w8384PGedxer1VXt6d55wE4l3Okpy6fRhRinWnjNq"},"hash":"KKj7l8MFEjkboTeBrFc5xa4w8384PGedxer1VXt6d55wE4l3Okpy6fRhRinWnjNq","time":1681691214226}, "2FRwA83fQmnfQQWZdDP0XZPSsdm3GXjSe+83tEMheSw=|6o5mdpjn3kg":{"msg":{"1jb9rrcvoc2":["J","H","I","K"],"_uid":"6o5mdpjn3kg","_time":1681691249979,"_hash":"K5qthAGHeU+Ap4nBE/i5VeMUefnxS0pyFDrBLFvEvMGJ4JCslGS5Ny3Y0wqncHJJ"},"hash":"K5qthAGHeU+Ap4nBE/i5VeMUefnxS0pyFDrBLFvEvMGJ4JCslGS5Ny3Y0wqncHJJ","time":1681691249979},
        "6BCq4pys/NolQOtcBflOcYtmP1huKfvM+Z61fQ0Gn1M=|rdc3epmuh7":{"msg":{"1jb9rrcvoc2":["K","H","I","J"],"_uid":"rdc3epmuh7","_time":1681691294180,"_hash":"ClCx83SXaAjHsNJ+OEALxsMwKvMWvysNcnMYMqTU7j/F/7IWvrO3Yp6CIlAyXSz/"},"hash":"ClCx83SXaAjHsNJ+OEALxsMwKvMWvysNcnMYMqTU7j/F/7IWvrO3Yp6CIlAyXSz/","time":1681691294180},
        "U4SSHuTrrPTAKIIbZ31yN9uwEYfrFO0hd24sEoCatW0=|5c0gsctlfa3":{"msg":{"1jb9rrcvoc2":["J","K","I","H"],"_uid":"5c0gsctlfa3","_time":1681691329715,"_hash":"Sin191I6D3nEqR1WbKFLqANlHSBO/G79g8sx4KYRGfdwrQrzrYMN3CmgJfKkJmH1"},"hash":"Sin191I6D3nEqR1WbKFLqANlHSBO/G79g8sx4KYRGfdwrQrzrYMN3CmgJfKkJmH1","time":1681691329715},
        "HQdIprb544HD5r90txGofCfN/ixylbVYgrusFGXkDU4=|14fbfb8hb29":{"msg":{"1jb9rrcvoc2":["K","I","H","J"],"_uid":"14fbfb8hb29","_time":1681691363758,"_hash":"TNrqKd9bsewsDWYlYHSH1ojEUj+qUABXVycgk3VnK29FY/1Mic+NF/aOM1UCyHHV"},"hash":"TNrqKd9bsewsDWYlYHSH1ojEUj+qUABXVycgk3VnK29FY/1Mic+NF/aOM1UCyHHV","time":1681691363758},
        "Pxy28SkQA+ii90aj6OsocG47Z3tq/7timwZPlDVnSzU=|17i15n4stru":{"msg":{"1jb9rrcvoc2":["J","H","K","I"],"_uid":"17i15n4stru","_time":1681691458380,"_hash":"x3wMejkzQ3dWjV/DZacAusFhBz47Zr6wAzIRJPP4CJWStxq0EB9iQPoyKVoTiNH4"},"hash":"x3wMejkzQ3dWjV/DZacAusFhBz47Zr6wAzIRJPP4CJWStxq0EB9iQPoyKVoTiNH4","time":1681691458380},
        "MhX8MY3Vl4ZWhN6zu8T29QaU5Uxc29h0XBuqIt6PKnE=|76mbjm31shk":{"msg":{"1jb9rrcvoc2":["I","K","J","H"],"_uid":"76mbjm31shk","_time":1681691646905,"_hash":"jbJJ6jd4yJL5WXgbO4Wn9sUY2HKXAflLXU1Aahmr2aNZatyyWeX6vX4D19VB3z+j"},"hash":"jbJJ6jd4yJL5WXgbO4Wn9sUY2HKXAflLXU1Aahmr2aNZatyyWeX6vX4D19VB3z+j","time":1681691646905},
        "fDlnRZoxOC1P+pq8vgTn529jQfgl6arr5yhlLMXF7Us=|9nunhvjc3d":{"msg":{"1jb9rrcvoc2":["I","K","J","H"],"_uid":"9nunhvjc3d","_time":1681691706061,"_hash":"4XsvGVemRt1+jRjgN2hphMaw03YpM4Hip49aJDPWBdEGwhKica1gmJMDTp07L79i"},"hash":"4XsvGVemRt1+jRjgN2hphMaw03YpM4Hip49aJDPWBdEGwhKica1gmJMDTp07L79i","time":1681691706061}, 
        "f+/uzRwTUMck51HyqTN8s8QtETO7cqjhD80j/HNO7Bc=|1le2eskh2bc":{"msg":{"1jb9rrcvoc2":["I","J","K","H"],"_uid":"1le2eskh2bc","_time":1681691742592,"_hash":"bMzuEN6LDY2Hj2CRU0ITdlz8/cJRFNWgdTwE28nv0GYYG7TzP89bWWxnRg3FLgb5"},"hash":"bMzuEN6LDY2Hj2CRU0ITdlz8/cJRFNWgdTwE28nv0GYYG7TzP89bWWxnRg3FLgb5","time":1681691742592}};
        var opts = {"values":[{"uid":"343p2rnve50","v":"H"},{"uid":"7rgol8gpe2m","v":"I"},{"uid":"3u0id5u18db","v":"J"},{"uid":"5ghoh24cpjl","v":"K"}]};
        var uid = "1jb9rrcvoc2";
        var form = {"1jb9rrcvoc2":{"opts":{"values":[{"uid":"343p2rnve50","v":"H"},{"uid":"7rgol8gpe2m","v":"I"},{"uid":"3u0id5u18db","v":"J"},{"uid":"5ghoh24cpjl","v":"K"}]},"type":"sort","condorcetmethod":"ranked"}};
        var optionArray = ["H","I","J","K"];
        var listOfLists = [["H","I","J","K"],["I","H","J","K"],["J","H","I","K"],["K","H","I","J"],["J","K","I","H"],["K","I","H","J"],["J","H","K","I"],["I","K","J","H"],["I","K","J","H"],["I","J","K","H"]];

        var result = JSON.stringify(Condorcet.showCondorcetWinner(_answers, opts, uid, form, optionArray, listOfLists)[0]) === JSON.stringify(["I"]);

        cb(result);
    }, "showCondorcetWinner: Check if correct winner calculated with 4 candidates, 10 votes - Ranked Pairs");  

    assert(function (cb) {
        var _answers = {"BwFNlRhW3AJ6QoZpWBu7ftHNtNWk0haprwH3NFbRTm0=|npg0bseejf":{"msg":{"67h4dnpga2u":["H","I","J","K"],"_uid":"npg0bseejf","_time":1681683945756,"_hash":"KLyDtbc8djGStL+4BlbI+O3ZZ+VQPiLCShBZrfF7UpbwgowL4tfUUNwCt00JXmPA"},"hash":"KLyDtbc8djGStL+4BlbI+O3ZZ+VQPiLCShBZrfF7UpbwgowL4tfUUNwCt00JXmPA","time":1681683945756}, 
        "xH+s8g8LQX96ROrfNWiHbnZQJwDr/9tyeHIEaBOHbFk=|3mc41g9vm2":{"msg":{"67h4dnpga2u":["H","I","K","J"],"_uid":"3mc41g9vm2","_time":1681683980059,"_hash":"MEDDfYVEVWityy3M3GSTx8wOEkzIATf8rA0ovKOuCS7+U0ZlIWdBvwBITRWFGRkX"},"hash":"MEDDfYVEVWityy3M3GSTx8wOEkzIATf8rA0ovKOuCS7+U0ZlIWdBvwBITRWFGRkX","time":1681683980059},
        "supWCR2B/1dycFXkj8qD8OGDGHwKJ2CEAof8Sm/RkEI=|5k61emebluc":{"msg":{"67h4dnpga2u":["H","I","K","J"],"_uid":"5k61emebluc","_time":1681684008298,"_hash":"Zb/oTSYiAAOGzGjvcax52SVioX+2BRbElvwYkugCZRAPk2DNJE6lNZRa5tle2m/i"},"hash":"Zb/oTSYiAAOGzGjvcax52SVioX+2BRbElvwYkugCZRAPk2DNJE6lNZRa5tle2m/i","time":1681684008298},
        "ih11i7GE/bp/GHaB/1KRVns+06NWyrlXoPBdmVF48hI=|1i7ttfaldgf":{"msg":{"67h4dnpga2u":["H","I","J","K"],"_uid":"1i7ttfaldgf","_time":1681684047183,"_hash":"HkBBM/qn/uEFCl9dRpVZJ0gkCzckojenHj0bwwoguRM1QVBXbpNQORkSYHcDgzq3"},"hash":"HkBBM/qn/uEFCl9dRpVZJ0gkCzckojenHj0bwwoguRM1QVBXbpNQORkSYHcDgzq3","time":1681684047183},
        "iDElng/HcmiHOryTGq5kz5SE9hTcMVM1MJYjiHbnLzw=|479j9agkcrr":{"msg":{"67h4dnpga2u":["I","H","J","K"],"_uid":"479j9agkcrr","_time":1681684083988,"_hash":"thR9o+mwCE/1USx7ltar8XjVZleLUR4V4pL9P8iq3Zdc3vZSuQp8IDtsCObK9Hl1"},"hash":"thR9o+mwCE/1USx7ltar8XjVZleLUR4V4pL9P8iq3Zdc3vZSuQp8IDtsCObK9Hl1","time":1681684083988},
        "Jc9p8GqjTqn5yBRGxTrD9bKjCPLFYT01UlAOMF9SKkY=|12e79jk9up6":{"msg":{"67h4dnpga2u":["J","H","I","K"],"_uid":"12e79jk9up6","_time":1681684108805,"_hash":"oeCXA7/emTP7J7EtOthxl1KbmPAck1LFYMyPju5ymzshfeXhaUKB4jExQXp7L9cH"},"hash":"oeCXA7/emTP7J7EtOthxl1KbmPAck1LFYMyPju5ymzshfeXhaUKB4jExQXp7L9cH","time":1681684108805},
        "lBcd667EdQdPmm+40wQFh6urLRYoz4oJHn1QEg7AHGk=|49ibtfuhns8":{"msg":{"67h4dnpga2u":["K","H","I","J"],"_uid":"49ibtfuhns8","_time":1681684135097,"_hash":"w7g+OmtNwbo+4kUp++hcQx5ecI0gTvQvRY1vAfQfEqiNvW7ymNPQObm8IsQQA1yN"},"hash":"w7g+OmtNwbo+4kUp++hcQx5ecI0gTvQvRY1vAfQfEqiNvW7ymNPQObm8IsQQA1yN","time":1681684135097},
        "sBHJDrJsCl3uEM0MaID9AW+z+c9RNaaeMq28wW41on8=|5nii53nilin":{"msg":{"67h4dnpga2u":["J","K","I","H"],"_uid":"5nii53nilin","_time":1681684187952,"_hash":"V0rYAG/QyBXFSl7w3aaI45uu4pplq93Ym4vYbgXMQA/hXstgyMvAjKrWF6ZsAZOO"},"hash":"V0rYAG/QyBXFSl7w3aaI45uu4pplq93Ym4vYbgXMQA/hXstgyMvAjKrWF6ZsAZOO","time":1681684187952},
        "Fb+PF0OoDZVkcm6LRwDrn/hQlbI2NBEEd5htvCvaD1E=|4hcirvtqmb4":{"msg":{"67h4dnpga2u":["K","I","H","J"],"_uid":"4hcirvtqmb4","_time":1681684215849,"_hash":"OL7o/qOdMCnCXVU+N+RZufraqH4/rmcvhEsARcmaXaCXXhEf3RrtiJtPoDlE9YJH"},"hash":"OL7o/qOdMCnCXVU+N+RZufraqH4/rmcvhEsARcmaXaCXXhEf3RrtiJtPoDlE9YJH","time":1681684215849},
        "RkfhULdUpYuHvMSkYpTH4wEfNoKEdDQAh4KNRqY//gY=|5b6pccgc5nc":{"msg":{"67h4dnpga2u":["J","H","K","I"],"_uid":"5b6pccgc5nc","_time":1681684240353,"_hash":"D06d3o18nJQIVh4MxmKUoVLxAPHnv8FpRIpXVJqvB5i5GeFwjqS+0ci802q9LReg"},"hash":"D06d3o18nJQIVh4MxmKUoVLxAPHnv8FpRIpXVJqvB5i5GeFwjqS+0ci802q9LReg","time":1681684240353},
        "jccOnPAwGNvijYp30HuiNV36TXOEgpFJjbie4X6gihY=|ie5e4tdnlr":{"msg":{"67h4dnpga2u":["I","K","J","H"],"_uid":"ie5e4tdnlr","_time":1681684305411,"_hash":"mnCcDKV5U8jPdFE0V/ZcKIrm8XiBntTdzE90mSjoW1Uu4cvfgNHZ0qFpobig8jXh"},"hash":"mnCcDKV5U8jPdFE0V/ZcKIrm8XiBntTdzE90mSjoW1Uu4cvfgNHZ0qFpobig8jXh","time":1681684305411},
        "qQk/Qf62A7RPKElBOVX6WrhMoJcR15QC93t7AjT05lA=|ic51icvcbq":{"msg":{"67h4dnpga2u":["I","K","J","H"],"_uid":"ic51icvcbq","_time":1681684326463,"_hash":"6v0pQapT4J+D6NwW5INI8lmXh8HMptNBPNB5mDtVq+6QWIu0R2gvWgdRdJTJZiSp"},"hash":"6v0pQapT4J+D6NwW5INI8lmXh8HMptNBPNB5mDtVq+6QWIu0R2gvWgdRdJTJZiSp","time":1681684326463},
        "QcJq5/CEaQ+8b2NPB6nnZMYHPDVAGySTtJEDF7CCnyE=|2feftir9d2h":{"msg":{"67h4dnpga2u":["I","J","K","H"],"_uid":"2feftir9d2h","_time":1681684348001,"_hash":"HbETuw3JeFnKSVGzsfeKOyx4lim1MIwaDwkG66HPb+AHpqiEglf3yfhQPBTQfQAt"},"hash":"HbETuw3JeFnKSVGzsfeKOyx4lim1MIwaDwkG66HPb+AHpqiEglf3yfhQPBTQfQAt","time":1681684348001}};
        var opts = {"values":[{"uid":"1h7i5i6e3kl","v":"H"},{"uid":"5k30663hga6","v":"I"},{"uid":"29t5n7nn8dv","v":"J"},{"uid":"3du0483fuih","v":"K"}]};
        var uid = "67h4dnpga2u";
        var form = {"67h4dnpga2u":{"condorcetmethod":"schulze","opts":{"values":[{"uid":"1h7i5i6e3kl","v":"H"},{"uid":"5k30663hga6","v":"I"},{"uid":"29t5n7nn8dv","v":"J"},{"uid":"3du0483fuih","v":"K"}]},"type":"sort"}};
        var optionArray = ["H","I","J","K"];
        var listOfLists = [["H","I","J","K"],["H","I","K","J"],["H","I","K","J"],["H","I","J","K"],["I","H","J","K"],["J","H","I","K"],["K","H","I","J"],["J","K","I","H"],["K","I","H","J"],["J","H","K","I"],["I","K","J","H"],["I","K","J","H"],["I","J","K","H"]];
        var result = JSON.stringify(Condorcet.showCondorcetWinner(_answers, opts, uid, form, optionArray, listOfLists)[0]) === JSON.stringify(["H"]);

        cb(result);
    }, "showCondorcetWinner: Check if correct winner calculated with 4 candidates, 13 votes - Schulze");  

    assert(function (cb) {
        var _answers = {"BwFNlRhW3AJ6QoZpWBu7ftHNtNWk0haprwH3NFbRTm0=|npg0bseejf":{"msg":{"67h4dnpga2u":["H","I","J","K"],"_uid":"npg0bseejf","_time":1681683945756,"_hash":"KLyDtbc8djGStL+4BlbI+O3ZZ+VQPiLCShBZrfF7UpbwgowL4tfUUNwCt00JXmPA"},"hash":"KLyDtbc8djGStL+4BlbI+O3ZZ+VQPiLCShBZrfF7UpbwgowL4tfUUNwCt00JXmPA","time":1681683945756}, 
        "xH+s8g8LQX96ROrfNWiHbnZQJwDr/9tyeHIEaBOHbFk=|3mc41g9vm2":{"msg":{"67h4dnpga2u":["H","I","K","J"],"_uid":"3mc41g9vm2","_time":1681683980059,"_hash":"MEDDfYVEVWityy3M3GSTx8wOEkzIATf8rA0ovKOuCS7+U0ZlIWdBvwBITRWFGRkX"},"hash":"MEDDfYVEVWityy3M3GSTx8wOEkzIATf8rA0ovKOuCS7+U0ZlIWdBvwBITRWFGRkX","time":1681683980059},
        "supWCR2B/1dycFXkj8qD8OGDGHwKJ2CEAof8Sm/RkEI=|5k61emebluc":{"msg":{"67h4dnpga2u":["H","I","K","J"],"_uid":"5k61emebluc","_time":1681684008298,"_hash":"Zb/oTSYiAAOGzGjvcax52SVioX+2BRbElvwYkugCZRAPk2DNJE6lNZRa5tle2m/i"},"hash":"Zb/oTSYiAAOGzGjvcax52SVioX+2BRbElvwYkugCZRAPk2DNJE6lNZRa5tle2m/i","time":1681684008298},
        "ih11i7GE/bp/GHaB/1KRVns+06NWyrlXoPBdmVF48hI=|1i7ttfaldgf":{"msg":{"67h4dnpga2u":["H","I","J","K"],"_uid":"1i7ttfaldgf","_time":1681684047183,"_hash":"HkBBM/qn/uEFCl9dRpVZJ0gkCzckojenHj0bwwoguRM1QVBXbpNQORkSYHcDgzq3"},"hash":"HkBBM/qn/uEFCl9dRpVZJ0gkCzckojenHj0bwwoguRM1QVBXbpNQORkSYHcDgzq3","time":1681684047183},
        "iDElng/HcmiHOryTGq5kz5SE9hTcMVM1MJYjiHbnLzw=|479j9agkcrr":{"msg":{"67h4dnpga2u":["I","H","J","K"],"_uid":"479j9agkcrr","_time":1681684083988,"_hash":"thR9o+mwCE/1USx7ltar8XjVZleLUR4V4pL9P8iq3Zdc3vZSuQp8IDtsCObK9Hl1"},"hash":"thR9o+mwCE/1USx7ltar8XjVZleLUR4V4pL9P8iq3Zdc3vZSuQp8IDtsCObK9Hl1","time":1681684083988},
        "Jc9p8GqjTqn5yBRGxTrD9bKjCPLFYT01UlAOMF9SKkY=|12e79jk9up6":{"msg":{"67h4dnpga2u":["J","H","I","K"],"_uid":"12e79jk9up6","_time":1681684108805,"_hash":"oeCXA7/emTP7J7EtOthxl1KbmPAck1LFYMyPju5ymzshfeXhaUKB4jExQXp7L9cH"},"hash":"oeCXA7/emTP7J7EtOthxl1KbmPAck1LFYMyPju5ymzshfeXhaUKB4jExQXp7L9cH","time":1681684108805},
        "lBcd667EdQdPmm+40wQFh6urLRYoz4oJHn1QEg7AHGk=|49ibtfuhns8":{"msg":{"67h4dnpga2u":["K","H","I","J"],"_uid":"49ibtfuhns8","_time":1681684135097,"_hash":"w7g+OmtNwbo+4kUp++hcQx5ecI0gTvQvRY1vAfQfEqiNvW7ymNPQObm8IsQQA1yN"},"hash":"w7g+OmtNwbo+4kUp++hcQx5ecI0gTvQvRY1vAfQfEqiNvW7ymNPQObm8IsQQA1yN","time":1681684135097},
        "sBHJDrJsCl3uEM0MaID9AW+z+c9RNaaeMq28wW41on8=|5nii53nilin":{"msg":{"67h4dnpga2u":["J","K","I","H"],"_uid":"5nii53nilin","_time":1681684187952,"_hash":"V0rYAG/QyBXFSl7w3aaI45uu4pplq93Ym4vYbgXMQA/hXstgyMvAjKrWF6ZsAZOO"},"hash":"V0rYAG/QyBXFSl7w3aaI45uu4pplq93Ym4vYbgXMQA/hXstgyMvAjKrWF6ZsAZOO","time":1681684187952},
        "Fb+PF0OoDZVkcm6LRwDrn/hQlbI2NBEEd5htvCvaD1E=|4hcirvtqmb4":{"msg":{"67h4dnpga2u":["K","I","H","J"],"_uid":"4hcirvtqmb4","_time":1681684215849,"_hash":"OL7o/qOdMCnCXVU+N+RZufraqH4/rmcvhEsARcmaXaCXXhEf3RrtiJtPoDlE9YJH"},"hash":"OL7o/qOdMCnCXVU+N+RZufraqH4/rmcvhEsARcmaXaCXXhEf3RrtiJtPoDlE9YJH","time":1681684215849},
        "RkfhULdUpYuHvMSkYpTH4wEfNoKEdDQAh4KNRqY//gY=|5b6pccgc5nc":{"msg":{"67h4dnpga2u":["J","H","K","I"],"_uid":"5b6pccgc5nc","_time":1681684240353,"_hash":"D06d3o18nJQIVh4MxmKUoVLxAPHnv8FpRIpXVJqvB5i5GeFwjqS+0ci802q9LReg"},"hash":"D06d3o18nJQIVh4MxmKUoVLxAPHnv8FpRIpXVJqvB5i5GeFwjqS+0ci802q9LReg","time":1681684240353},
        "jccOnPAwGNvijYp30HuiNV36TXOEgpFJjbie4X6gihY=|ie5e4tdnlr":{"msg":{"67h4dnpga2u":["I","K","J","H"],"_uid":"ie5e4tdnlr","_time":1681684305411,"_hash":"mnCcDKV5U8jPdFE0V/ZcKIrm8XiBntTdzE90mSjoW1Uu4cvfgNHZ0qFpobig8jXh"},"hash":"mnCcDKV5U8jPdFE0V/ZcKIrm8XiBntTdzE90mSjoW1Uu4cvfgNHZ0qFpobig8jXh","time":1681684305411},
        "qQk/Qf62A7RPKElBOVX6WrhMoJcR15QC93t7AjT05lA=|ic51icvcbq":{"msg":{"67h4dnpga2u":["I","K","J","H"],"_uid":"ic51icvcbq","_time":1681684326463,"_hash":"6v0pQapT4J+D6NwW5INI8lmXh8HMptNBPNB5mDtVq+6QWIu0R2gvWgdRdJTJZiSp"},"hash":"6v0pQapT4J+D6NwW5INI8lmXh8HMptNBPNB5mDtVq+6QWIu0R2gvWgdRdJTJZiSp","time":1681684326463},
        "QcJq5/CEaQ+8b2NPB6nnZMYHPDVAGySTtJEDF7CCnyE=|2feftir9d2h":{"msg":{"67h4dnpga2u":["I","J","K","H"],"_uid":"2feftir9d2h","_time":1681684348001,"_hash":"HbETuw3JeFnKSVGzsfeKOyx4lim1MIwaDwkG66HPb+AHpqiEglf3yfhQPBTQfQAt"},"hash":"HbETuw3JeFnKSVGzsfeKOyx4lim1MIwaDwkG66HPb+AHpqiEglf3yfhQPBTQfQAt","time":1681684348001}};
        var opts = {"values":[{"uid":"1h7i5i6e3kl","v":"H"},{"uid":"5k30663hga6","v":"I"},{"uid":"29t5n7nn8dv","v":"J"},{"uid":"3du0483fuih","v":"K"}]};
        var uid = "67h4dnpga2u";
        var form = {"67h4dnpga2u":{"condorcetmethod":"ranked","opts":{"values":[{"uid":"1h7i5i6e3kl","v":"H"},{"uid":"5k30663hga6","v":"I"},{"uid":"29t5n7nn8dv","v":"J"},{"uid":"3du0483fuih","v":"K"}]},"type":"sort"}};
        var optionArray = ["H","I","J","K"];
        var listOfLists = [["H","I","J","K"],["H","I","K","J"],["H","I","K","J"],["H","I","J","K"],["I","H","J","K"],["J","H","I","K"],["K","H","I","J"],["J","K","I","H"],["K","I","H","J"],["J","H","K","I"],["I","K","J","H"],["I","K","J","H"],["I","J","K","H"]];
        var result = JSON.stringify(Condorcet.showCondorcetWinner(_answers, opts, uid, form, optionArray, listOfLists)[0]) === JSON.stringify(["H"]);

        cb(result);
    }, "showCondorcetWinner: Check if correct winner calculated with 4 candidates, 13 votes - Ranked Pairs");  

    assert(function (cb) {
        var _answers = {"44Yf9JjdL+25xyVrlv13SQab3Llx1Edyh0h4W8yFRGk=|4i1a0d8besa":{"msg":{"51nu46q526s":["H","I","J","K"],"_uid":"4i1a0d8besa","_time":1680643521926,"_hash":"WcmdpB3iDjHaVCiR844SLNcXNN6z8SOqzDCt9QbhoxhyLsP1CcNDmaGWhndVWnT2"},"hash":"WcmdpB3iDjHaVCiR844SLNcXNN6z8SOqzDCt9QbhoxhyLsP1CcNDmaGWhndVWnT2","time":1680643521926},"qhSqj2iIyFKA2UiipLxyWsybBbUu5sKWyIrUo/q5YDw=|3id6qekiv1h":{"msg":{"_uid":"3id6qekiv1h","_time":1680643559420,"_hash":"QR4mxsQoKb6SkaZZAbxZ4YyGK5yu2xqc8Z8MPFlTxQSUhg6XSGZzi4bNA+Q5I8A/"},"hash":"QR4mxsQoKb6SkaZZAbxZ4YyGK5yu2xqc8Z8MPFlTxQSUhg6XSGZzi4bNA+Q5I8A/","time":1680643559420},"mlRxie7OEDkqbF1X1c178p4yPh/g0+ZpUfhCXiYkqVY=|44r89gc710q":{"msg":{"51nu46q526s":["I","K","H","J"],"_uid":"44r89gc710q","_time":1680643771614,"_hash":"gCAVdvMr+ftWida0Au5QhM3Hr6DY37InIyeCwlo+hXHHEs75AZ47jS5ETgg+0nTC"},"hash":"gCAVdvMr+ftWida0Au5QhM3Hr6DY37InIyeCwlo+hXHHEs75AZ47jS5ETgg+0nTC","time":1680643771614},"TKmxMFaeKmHbSn5logEAzUnmNFA29XCoS58WQ+CjUgk=|ip2sjdk0d5":{"msg":{"51nu46q526s":["H","I","J","K"],"_uid":"ip2sjdk0d5","_time":1680643819623,"_hash":"UcFaJZKsj9P03iUv3r4k27tb+cC7suVH9hnL6YkTo3W9OftaCIYLnWhm4WdZ5n7q"},"hash":"UcFaJZKsj9P03iUv3r4k27tb+cC7suVH9hnL6YkTo3W9OftaCIYLnWhm4WdZ5n7q","time":1680643819623},"ZtOsJo23EAw2G/cB+jLHyLx5BfHw3RDVc8LDOv834R8=|1npd8sjbkts":{"msg":{"_uid":"1npd8sjbkts","_time":1680644213562,"_hash":"Tryu1aEbgkjjfS3w87KvonEvkuQ8iLyQ1/H1NTrapDRRe2Wy8AN1u2waEMY3D19P"},"hash":"Tryu1aEbgkjjfS3w87KvonEvkuQ8iLyQ1/H1NTrapDRRe2Wy8AN1u2waEMY3D19P","time":1680644213562},"bUPOx08ja9qh5G88o0OvHqH34UIfozKBdABbMM0Gll8=|3dt1klghi39":{"msg":{"51nu46q526s":["J","K","I","H"],"_uid":"3dt1klghi39","_time":1680692970797,"_hash":"zcWZPHsfRENVDvsHO7AtKfy9JwlX4JZ4vAXj7zHq8JncEDE3tRJCBFg9DfFrXUaQ"},"hash":"zcWZPHsfRENVDvsHO7AtKfy9JwlX4JZ4vAXj7zHq8JncEDE3tRJCBFg9DfFrXUaQ","time":1680692970797}};
        var opts = {"values":[{"uid":"3vkp036vl76","v":"H"},{"uid":"1mtirujeook","v":"I"},{"uid":"5n31irpab5p","v":"J"},{"uid":"4cqdkqe0tad","v":"K"}]};
        var uid = "51nu46q526s";
        var form ={"51nu46q526s":{"condorcetmethod":"schulze","opts":{"values":[{"uid":"3vkp036vl76","v":"H"},{"uid":"1mtirujeook","v":"I"},{"uid":"5n31irpab5p","v":"J"},{"uid":"4cqdkqe0tad","v":"K"}]},"q":"Your question here?","type":"sort"}};
        var optionArray = ["H","I","J","K"];
        var listOfLists =[["H","I","J","K"],["I","K","H","J"],["H","I","J","K"],["J","K","I","H"]];
        var result = JSON.stringify(Condorcet.showCondorcetWinner(_answers, opts, uid, form, optionArray, listOfLists)[0]) === JSON.stringify(["H", "I"]);

        cb(result);
    }, "showCondorcetWinner: Check if correct winner calculated with 4 candidates, 4 votes - Schulze");  

    assert(function (cb) {
        var _answers = {"44Yf9JjdL+25xyVrlv13SQab3Llx1Edyh0h4W8yFRGk=|4i1a0d8besa":{"msg":{"51nu46q526s":["H","I","J","K"],"_uid":"4i1a0d8besa","_time":1680643521926,"_hash":"WcmdpB3iDjHaVCiR844SLNcXNN6z8SOqzDCt9QbhoxhyLsP1CcNDmaGWhndVWnT2"},"hash":"WcmdpB3iDjHaVCiR844SLNcXNN6z8SOqzDCt9QbhoxhyLsP1CcNDmaGWhndVWnT2","time":1680643521926},"qhSqj2iIyFKA2UiipLxyWsybBbUu5sKWyIrUo/q5YDw=|3id6qekiv1h":{"msg":{"_uid":"3id6qekiv1h","_time":1680643559420,"_hash":"QR4mxsQoKb6SkaZZAbxZ4YyGK5yu2xqc8Z8MPFlTxQSUhg6XSGZzi4bNA+Q5I8A/"},"hash":"QR4mxsQoKb6SkaZZAbxZ4YyGK5yu2xqc8Z8MPFlTxQSUhg6XSGZzi4bNA+Q5I8A/","time":1680643559420},"mlRxie7OEDkqbF1X1c178p4yPh/g0+ZpUfhCXiYkqVY=|44r89gc710q":{"msg":{"51nu46q526s":["I","K","H","J"],"_uid":"44r89gc710q","_time":1680643771614,"_hash":"gCAVdvMr+ftWida0Au5QhM3Hr6DY37InIyeCwlo+hXHHEs75AZ47jS5ETgg+0nTC"},"hash":"gCAVdvMr+ftWida0Au5QhM3Hr6DY37InIyeCwlo+hXHHEs75AZ47jS5ETgg+0nTC","time":1680643771614},"TKmxMFaeKmHbSn5logEAzUnmNFA29XCoS58WQ+CjUgk=|ip2sjdk0d5":{"msg":{"51nu46q526s":["H","I","J","K"],"_uid":"ip2sjdk0d5","_time":1680643819623,"_hash":"UcFaJZKsj9P03iUv3r4k27tb+cC7suVH9hnL6YkTo3W9OftaCIYLnWhm4WdZ5n7q"},"hash":"UcFaJZKsj9P03iUv3r4k27tb+cC7suVH9hnL6YkTo3W9OftaCIYLnWhm4WdZ5n7q","time":1680643819623},"ZtOsJo23EAw2G/cB+jLHyLx5BfHw3RDVc8LDOv834R8=|1npd8sjbkts":{"msg":{"_uid":"1npd8sjbkts","_time":1680644213562,"_hash":"Tryu1aEbgkjjfS3w87KvonEvkuQ8iLyQ1/H1NTrapDRRe2Wy8AN1u2waEMY3D19P"},"hash":"Tryu1aEbgkjjfS3w87KvonEvkuQ8iLyQ1/H1NTrapDRRe2Wy8AN1u2waEMY3D19P","time":1680644213562},"bUPOx08ja9qh5G88o0OvHqH34UIfozKBdABbMM0Gll8=|3dt1klghi39":{"msg":{"51nu46q526s":["J","K","I","H"],"_uid":"3dt1klghi39","_time":1680692970797,"_hash":"zcWZPHsfRENVDvsHO7AtKfy9JwlX4JZ4vAXj7zHq8JncEDE3tRJCBFg9DfFrXUaQ"},"hash":"zcWZPHsfRENVDvsHO7AtKfy9JwlX4JZ4vAXj7zHq8JncEDE3tRJCBFg9DfFrXUaQ","time":1680692970797}};
        var opts = {"values":[{"uid":"3vkp036vl76","v":"H"},{"uid":"1mtirujeook","v":"I"},{"uid":"5n31irpab5p","v":"J"},{"uid":"4cqdkqe0tad","v":"K"}]};
        var uid = "51nu46q526s";
        var form ={"51nu46q526s":{"condorcetmethod":"schulze","opts":{"values":[{"uid":"3vkp036vl76","v":"H"},{"uid":"1mtirujeook","v":"I"},{"uid":"5n31irpab5p","v":"J"},{"uid":"4cqdkqe0tad","v":"K"}]},"q":"Your question here?","type":"sort"}};
        var optionArray = ["H","I","J","K"];
        var listOfLists =[["H","I","J","K"],["I","K","H","J"],["H","I","J","K"],["J","K","I","H"]];
        var result = JSON.stringify(Condorcet.showCondorcetWinner(_answers, opts, uid, form, optionArray, listOfLists)[0]) === JSON.stringify(["H", "I"]);

        cb(result);
    }, "showCondorcetWinner: Check if correct winner calculated with 4 candidates, 4 votes - Ranked Pairs");  

    assert(function (cb) {
        var _answers = {"3W07F9jVam8MiaX0NZZTI66GxClsdL5mOO+TJ8JJxWc=|6n9v5b0tgoe":{"msg":{"47nvphi67mf":["I","J","H","K"],"_uid":"6n9v5b0tgoe","_time":1680713369905,"_hash":"SF6yPOMHFAtJakkQLJNCnZKOaizUBzZQ8LHGk49/HakUxmiACal2Zk/eHZXWSCWl"},"hash":"SF6yPOMHFAtJakkQLJNCnZKOaizUBzZQ8LHGk49/HakUxmiACal2Zk/eHZXWSCWl","time":1680713369905},"igIpdO4t+3NUz71Lro0rak/vnETfjJdgewzNB2HpQAw=|55t8n89ht6p":{"msg":{"47nvphi67mf":["H","K","J","I"],"_uid":"55t8n89ht6p","_time":1681042330253,"_hash":"7aLd5yPtbmtJlaiRz2/vydel882KwC8DTwhD0aitI/AduyyI8A/zm0AQ3805GwGg"},"hash":"7aLd5yPtbmtJlaiRz2/vydel882KwC8DTwhD0aitI/AduyyI8A/zm0AQ3805GwGg","time":1681042330253},"xmjNpxMoy5hmdBh8qeeffeBT2X0dSahoIQUOimW39RI=|6h53t3s92ui":{"msg":{"47nvphi67mf":["H","J","K","I"],"_uid":"6h53t3s92ui","_time":1681042535649,"_hash":"3hbcSb+HmenP3zO+zXkzalHkfs3M2cg1UoFfArgHHru2OIznhAwKgN7veXc7dOnQ"},"hash":"3hbcSb+HmenP3zO+zXkzalHkfs3M2cg1UoFfArgHHru2OIznhAwKgN7veXc7dOnQ","time":1681042535649},"apFfNxra9Qd0gHx4wDoBIDT/aBnb3Rqzc+kaxRD8EBs=|4u27266gqp8":{"msg":{"47nvphi67mf":["K","J","I","H"],"_uid":"4u27266gqp8","_time":1681042567437,"_hash":"AXSlah8a2m+s/IQK9poMmg32vBQFExz8GqweUtQ86kFfJX5w9vmenkSmJTIPmmCQ"},"hash":"AXSlah8a2m+s/IQK9poMmg32vBQFExz8GqweUtQ86kFfJX5w9vmenkSmJTIPmmCQ","time":1681042567437},"RuYP2XRGujxTy1CDWPJTOfPokSqFY/5U6JT2nv83HwE=|7q94ctdudpr":{"msg":{"47nvphi67mf":["I","K","J","H"],"_uid":"7q94ctdudpr","_time":1681042678047,"_hash":"OGEOeu+W5fN7OIFeNilqfzf5tspIp5u3MkJM0mrntEhJRbR7aZfyE4RlRgNOp84J"},"hash":"OGEOeu+W5fN7OIFeNilqfzf5tspIp5u3MkJM0mrntEhJRbR7aZfyE4RlRgNOp84J","time":1681042678047}};
        var opts = {"values":[{"uid":"6hggv459em6","v":"H"},{"uid":"2komjrerjjc","v":"I"},{"uid":"12d7pshc5ip","v":"J"},{"uid":"4u9jihh9u8k","v":"K"}]};
        var uid = "47nvphi67mf";
        var optionArray = ["H","I","J","K"];
        var form = {"47nvphi67mf":{"opts":{"values":[{"uid":"6hggv459em6","v":"H"},{"uid":"2komjrerjjc","v":"I"},{"uid":"12d7pshc5ip","v":"J"},{"uid":"4u9jihh9u8k","v":"K"}]},"type":"sort","condorcetmethod":"schulze"}};
        var listOfLists = [["I","J","H","K"],["H","K","J","I"],["H","J","K","I"],["K","J","I","H"],["I","K","J","H"]];
        var result = JSON.stringify(Condorcet.showCondorcetWinner(_answers, opts, uid, form, optionArray, listOfLists)[0]) === JSON.stringify([]);

        cb(result);
    }, "showCondorcetWinner: Check if correct winner calculated with 4 candidates, 5 votes - Schulze");  

    assert(function (cb) {
        var _answers = {"3W07F9jVam8MiaX0NZZTI66GxClsdL5mOO+TJ8JJxWc=|6n9v5b0tgoe":{"msg":{"47nvphi67mf":["I","J","H","K"],"_uid":"6n9v5b0tgoe","_time":1680713369905,"_hash":"SF6yPOMHFAtJakkQLJNCnZKOaizUBzZQ8LHGk49/HakUxmiACal2Zk/eHZXWSCWl"},"hash":"SF6yPOMHFAtJakkQLJNCnZKOaizUBzZQ8LHGk49/HakUxmiACal2Zk/eHZXWSCWl","time":1680713369905},"igIpdO4t+3NUz71Lro0rak/vnETfjJdgewzNB2HpQAw=|55t8n89ht6p":{"msg":{"47nvphi67mf":["H","K","J","I"],"_uid":"55t8n89ht6p","_time":1681042330253,"_hash":"7aLd5yPtbmtJlaiRz2/vydel882KwC8DTwhD0aitI/AduyyI8A/zm0AQ3805GwGg"},"hash":"7aLd5yPtbmtJlaiRz2/vydel882KwC8DTwhD0aitI/AduyyI8A/zm0AQ3805GwGg","time":1681042330253},"xmjNpxMoy5hmdBh8qeeffeBT2X0dSahoIQUOimW39RI=|6h53t3s92ui":{"msg":{"47nvphi67mf":["H","J","K","I"],"_uid":"6h53t3s92ui","_time":1681042535649,"_hash":"3hbcSb+HmenP3zO+zXkzalHkfs3M2cg1UoFfArgHHru2OIznhAwKgN7veXc7dOnQ"},"hash":"3hbcSb+HmenP3zO+zXkzalHkfs3M2cg1UoFfArgHHru2OIznhAwKgN7veXc7dOnQ","time":1681042535649},"apFfNxra9Qd0gHx4wDoBIDT/aBnb3Rqzc+kaxRD8EBs=|4u27266gqp8":{"msg":{"47nvphi67mf":["K","J","I","H"],"_uid":"4u27266gqp8","_time":1681042567437,"_hash":"AXSlah8a2m+s/IQK9poMmg32vBQFExz8GqweUtQ86kFfJX5w9vmenkSmJTIPmmCQ"},"hash":"AXSlah8a2m+s/IQK9poMmg32vBQFExz8GqweUtQ86kFfJX5w9vmenkSmJTIPmmCQ","time":1681042567437},"RuYP2XRGujxTy1CDWPJTOfPokSqFY/5U6JT2nv83HwE=|7q94ctdudpr":{"msg":{"47nvphi67mf":["I","K","J","H"],"_uid":"7q94ctdudpr","_time":1681042678047,"_hash":"OGEOeu+W5fN7OIFeNilqfzf5tspIp5u3MkJM0mrntEhJRbR7aZfyE4RlRgNOp84J"},"hash":"OGEOeu+W5fN7OIFeNilqfzf5tspIp5u3MkJM0mrntEhJRbR7aZfyE4RlRgNOp84J","time":1681042678047}};
        var opts = {"values":[{"uid":"6hggv459em6","v":"H"},{"uid":"2komjrerjjc","v":"I"},{"uid":"12d7pshc5ip","v":"J"},{"uid":"4u9jihh9u8k","v":"K"}]};
        var uid = "47nvphi67mf";
        var optionArray = ["H","I","J","K"];
        var form = {"47nvphi67mf":{"opts":{"values":[{"uid":"6hggv459em6","v":"H"},{"uid":"2komjrerjjc","v":"I"},{"uid":"12d7pshc5ip","v":"J"},{"uid":"4u9jihh9u8k","v":"K"}]},"type":"sort","condorcetmethod":"ranked"}};
        var listOfLists = [["I","J","H","K"],["H","K","J","I"],["H","J","K","I"],["K","J","I","H"],["I","K","J","H"]];
        var result = JSON.stringify(Condorcet.showCondorcetWinner(_answers, opts, uid, form, optionArray, listOfLists)[0]) === JSON.stringify([]);

        cb(result);
    }, "showCondorcetWinner: Check if correct winner calculated with 4 candidates, 5 votes - Ranked Pairs");  

    assert(function (cb) {
        var _answers = {"HPGnFy2rrs6jnYcrwFV8ZzovC9wd9aWC1qg0uZ2O22U=|1atgtclbsf4":{"msg":{"3lfhpn08d91":["H","I","J","K","L","M","N"],"_uid":"1atgtclbsf4","_time":1681568806873,"_hash":"OpVK4UksFvVnRgsuYWgAK4OeT9MR5c189T9yuj3Itr+Q+wTZ0tLz0GaffQD2qQh4"},"hash":"OpVK4UksFvVnRgsuYWgAK4OeT9MR5c189T9yuj3Itr+Q+wTZ0tLz0GaffQD2qQh4","time":1681568806873},"v1JFwzjvxt3X8LrGv8bZXBOZwM98jxD2Tw87UrfexD8=|1g2ctgtffv6":{"msg":{"3lfhpn08d91":["N","M","J","K","H","I","L"],"_uid":"1g2ctgtffv6","_time":1681568926600,"_hash":"teOmfTUb0cYE8qfYktdxNaUHN4XkufGrAXWLuAMT+3qRr/krq1r1Y65M+RVaESae"},"hash":"teOmfTUb0cYE8qfYktdxNaUHN4XkufGrAXWLuAMT+3qRr/krq1r1Y65M+RVaESae","time":1681568926600},"i2YTGH7TvopuxOVHyDTzRmZbHsUtlJ/A3nVgZ+yavm8=|43e2h29aedb":{"msg":{"3lfhpn08d91":["K","L","M","N","I","J","H"],"_uid":"43e2h29aedb","_time":1681568964692,"_hash":"H5Qj5h4ObrHKKROICuuydFvMEnlsINPX+bicqWWbr+7mYYJr46fMOWpKW9vr4dQ1"},"hash":"H5Qj5h4ObrHKKROICuuydFvMEnlsINPX+bicqWWbr+7mYYJr46fMOWpKW9vr4dQ1","time":1681568964692},"WUrMHAvDx+he11SMp0Q8ELqh1I6bW2IC5nSdnbhUD2U=|30asm3vlu55":{"msg":{"3lfhpn08d91":["H","M","L","K","I","J","N"],"_uid":"30asm3vlu55","_time":1681569094752,"_hash":"sHJQ805YDqEFclLLmDnZRrp4syeUIOWqdeem1ShObVtLeCkZ99k68b9a+uHGvYVb"},"hash":"sHJQ805YDqEFclLLmDnZRrp4syeUIOWqdeem1ShObVtLeCkZ99k68b9a+uHGvYVb","time":1681569094752}};
        var opts = {"values":[{"uid":"674sg3t7hpg","v":"H"},{"uid":"7fcgpg9iqga","v":"I"},{"uid":"2uqjmi2nsro","v":"J"},{"uid":"5gg447a5r5h","v":"K"},{"uid":"1i868f9au90","v":"L"},{"uid":"4t8g7f8dm3v","v":"M"},{"uid":"6ukb93ghagr","v":"N"}]};
        var uid = "3lfhpn08d91";
        var form = {"3lfhpn08d91":{"condorcetmethod":"schulze","opts":{"values":[{"uid":"674sg3t7hpg","v":"H"},{"uid":"7fcgpg9iqga","v":"I"},{"uid":"2uqjmi2nsro","v":"J"},{"uid":"5gg447a5r5h","v":"K"},{"uid":"1i868f9au90","v":"L"},{"uid":"4t8g7f8dm3v","v":"M"},{"uid":"6ukb93ghagr","v":"N"}]},"type":"sort"}};
        var listOfLists = [["H","I","J","K","L","M","N"],["N","M","J","K","H","I","L"],["K","L","M","N","I","J","H"],["H","M","L","K","I","J","N"]];
        var optionArray = ["H","I","J","K","L","M","N"];
        var result = JSON.stringify(Condorcet.showCondorcetWinner(_answers, opts, uid, form, optionArray, listOfLists)[0]) === JSON.stringify(["H", "K", "M"]);

        cb(result);
    }, "showCondorcetWinner: Check if correct winner calculated with 7 candidates, 4 votes - Schulze");  

    assert(function (cb) {
        var _answers = {"HPGnFy2rrs6jnYcrwFV8ZzovC9wd9aWC1qg0uZ2O22U=|1atgtclbsf4":{"msg":{"3lfhpn08d91":["H","I","J","K","L","M","N"],"_uid":"1atgtclbsf4","_time":1681568806873,"_hash":"OpVK4UksFvVnRgsuYWgAK4OeT9MR5c189T9yuj3Itr+Q+wTZ0tLz0GaffQD2qQh4"},"hash":"OpVK4UksFvVnRgsuYWgAK4OeT9MR5c189T9yuj3Itr+Q+wTZ0tLz0GaffQD2qQh4","time":1681568806873},"v1JFwzjvxt3X8LrGv8bZXBOZwM98jxD2Tw87UrfexD8=|1g2ctgtffv6":{"msg":{"3lfhpn08d91":["N","M","J","K","H","I","L"],"_uid":"1g2ctgtffv6","_time":1681568926600,"_hash":"teOmfTUb0cYE8qfYktdxNaUHN4XkufGrAXWLuAMT+3qRr/krq1r1Y65M+RVaESae"},"hash":"teOmfTUb0cYE8qfYktdxNaUHN4XkufGrAXWLuAMT+3qRr/krq1r1Y65M+RVaESae","time":1681568926600},"i2YTGH7TvopuxOVHyDTzRmZbHsUtlJ/A3nVgZ+yavm8=|43e2h29aedb":{"msg":{"3lfhpn08d91":["K","L","M","N","I","J","H"],"_uid":"43e2h29aedb","_time":1681568964692,"_hash":"H5Qj5h4ObrHKKROICuuydFvMEnlsINPX+bicqWWbr+7mYYJr46fMOWpKW9vr4dQ1"},"hash":"H5Qj5h4ObrHKKROICuuydFvMEnlsINPX+bicqWWbr+7mYYJr46fMOWpKW9vr4dQ1","time":1681568964692},"WUrMHAvDx+he11SMp0Q8ELqh1I6bW2IC5nSdnbhUD2U=|30asm3vlu55":{"msg":{"3lfhpn08d91":["H","M","L","K","I","J","N"],"_uid":"30asm3vlu55","_time":1681569094752,"_hash":"sHJQ805YDqEFclLLmDnZRrp4syeUIOWqdeem1ShObVtLeCkZ99k68b9a+uHGvYVb"},"hash":"sHJQ805YDqEFclLLmDnZRrp4syeUIOWqdeem1ShObVtLeCkZ99k68b9a+uHGvYVb","time":1681569094752}};
        var opts = {"values":[{"uid":"674sg3t7hpg","v":"H"},{"uid":"7fcgpg9iqga","v":"I"},{"uid":"2uqjmi2nsro","v":"J"},{"uid":"5gg447a5r5h","v":"K"},{"uid":"1i868f9au90","v":"L"},{"uid":"4t8g7f8dm3v","v":"M"},{"uid":"6ukb93ghagr","v":"N"}]};
        var uid = "3lfhpn08d91";
        var form = {"3lfhpn08d91":{"condorcetmethod":"ranked","opts":{"values":[{"uid":"674sg3t7hpg","v":"H"},{"uid":"7fcgpg9iqga","v":"I"},{"uid":"2uqjmi2nsro","v":"J"},{"uid":"5gg447a5r5h","v":"K"},{"uid":"1i868f9au90","v":"L"},{"uid":"4t8g7f8dm3v","v":"M"},{"uid":"6ukb93ghagr","v":"N"}]},"type":"sort"}};
        var listOfLists = [["H","I","J","K","L","M","N"],["N","M","J","K","H","I","L"],["K","L","M","N","I","J","H"],["H","M","L","K","I","J","N"]];
        var optionArray = ["H","I","J","K","L","M","N"];
        var result = JSON.stringify(Condorcet.showCondorcetWinner(_answers, opts, uid, form, optionArray, listOfLists)[0]) === JSON.stringify(["H", "K", "M"]);

        cb(result);
    }, "showCondorcetWinner: Check if correct winner calculated with 7 candidates, 4 votes - Ranked Pairs");  

    assert(function (cb) {
        var _answers = {"3K9S8kV6tYGDtp5NUiQgXJPsCIEpbxZCbCLYIZSTgxg=|7i1lrkeg6n3":{"msg":{"2n3csc2haf9":["H","I","J","K","L","M"],"_uid":"7i1lrkeg6n3","_time":1681509031399,"_hash":"uWt5gUwaspvFWBOmA6dKfjUq6nHHb6BVq1/Y541CMPJd80NbHz5Q5vnrX/uyjQw/"},"hash":"uWt5gUwaspvFWBOmA6dKfjUq6nHHb6BVq1/Y541CMPJd80NbHz5Q5vnrX/uyjQw/","time":1681509031399},"oxnt14eIo9cKCXNkOMVxpCTpYXVs2WH4Lkvtsac0pwg=|59a717ashf3":{"msg":{"2n3csc2haf9":["H","J","I","M","L","K"],"_uid":"59a717ashf3","_time":1681509073345,"_hash":"wiQzaQNzR40kNNpiinET5rPskPUtEWk2VrBK0wCWt7apBKZ6VV4gjHXgMQjYgbAi"},"hash":"wiQzaQNzR40kNNpiinET5rPskPUtEWk2VrBK0wCWt7apBKZ6VV4gjHXgMQjYgbAi","time":1681509073345},"eJTxizgyVY/iuKlWfnoz8qkDCHJzSR6OJ3Ei51KhPVI=|29st9udvpc5":{"msg":{"2n3csc2haf9":["K","L","M","I","J","H"],"_uid":"29st9udvpc5","_time":1681509117027,"_hash":"WYZaIWbAvdN9n6NmlGv5IwGG/uspJApaM8HVOITDFw1SenzhhuCzjSi8K1myELLd"},"hash":"WYZaIWbAvdN9n6NmlGv5IwGG/uspJApaM8HVOITDFw1SenzhhuCzjSi8K1myELLd","time":1681509117027},"On0atQCvGd8Wq5AN16MlLarZGI8KHevWGpLACHl6vl8=|7jhhupqfjca":{"msg":{"2n3csc2haf9":["L","I","M","J","H","K"],"_uid":"7jhhupqfjca","_time":1681509152917,"_hash":"keshjQFnWyBV3zMlZlqmMDmyc3gve8qg6Marta4ScWl9N4VVvg92RoYXWAM8jpp5"},"hash":"keshjQFnWyBV3zMlZlqmMDmyc3gve8qg6Marta4ScWl9N4VVvg92RoYXWAM8jpp5","time":1681509152917}};
        var opts = {"values":[{"uid":"31p0hol7tcr","v":"H"},{"uid":"3gu1lju1gbe","v":"I"},{"uid":"6hjcpk4oj49","v":"J"},{"uid":"e446uhqb6t","v":"K"},{"uid":"4pimmkrv0rk","v":"L"},{"uid":"5emh1hr9i6e","v":"M"}]};
        var uid = "2n3csc2haf9";
        var form = {"2n3csc2haf9":{"opts":{"values":[{"uid":"31p0hol7tcr","v":"H"},{"uid":"3gu1lju1gbe","v":"I"},{"uid":"6hjcpk4oj49","v":"J"},{"uid":"e446uhqb6t","v":"K"},{"uid":"4pimmkrv0rk","v":"L"},{"uid":"5emh1hr9i6e","v":"M"}]},"type":"sort","condorcetmethod":"schulze"}};
        var listOfLists = [["H","I","J","K","L","M"],["H","J","I","M","L","K"],["K","L","M","I","J","H"],["L","I","M","J","H","K"]];
        var optionArray = ["H","I","J","K","L","M"];
        var result = JSON.stringify(Condorcet.showCondorcetWinner(_answers, opts, uid, form, optionArray, listOfLists)[0]) === JSON.stringify(["H", "I", "L"]);

        cb(result);
    }, "showCondorcetWinner: Check if correct winner calculated with 6 candidates, 4 votes - Schulze");  

    assert(function (cb) {
        var _answers = {"3K9S8kV6tYGDtp5NUiQgXJPsCIEpbxZCbCLYIZSTgxg=|7i1lrkeg6n3":{"msg":{"2n3csc2haf9":["H","I","J","K","L","M"],"_uid":"7i1lrkeg6n3","_time":1681509031399,"_hash":"uWt5gUwaspvFWBOmA6dKfjUq6nHHb6BVq1/Y541CMPJd80NbHz5Q5vnrX/uyjQw/"},"hash":"uWt5gUwaspvFWBOmA6dKfjUq6nHHb6BVq1/Y541CMPJd80NbHz5Q5vnrX/uyjQw/","time":1681509031399},"oxnt14eIo9cKCXNkOMVxpCTpYXVs2WH4Lkvtsac0pwg=|59a717ashf3":{"msg":{"2n3csc2haf9":["H","J","I","M","L","K"],"_uid":"59a717ashf3","_time":1681509073345,"_hash":"wiQzaQNzR40kNNpiinET5rPskPUtEWk2VrBK0wCWt7apBKZ6VV4gjHXgMQjYgbAi"},"hash":"wiQzaQNzR40kNNpiinET5rPskPUtEWk2VrBK0wCWt7apBKZ6VV4gjHXgMQjYgbAi","time":1681509073345},"eJTxizgyVY/iuKlWfnoz8qkDCHJzSR6OJ3Ei51KhPVI=|29st9udvpc5":{"msg":{"2n3csc2haf9":["K","L","M","I","J","H"],"_uid":"29st9udvpc5","_time":1681509117027,"_hash":"WYZaIWbAvdN9n6NmlGv5IwGG/uspJApaM8HVOITDFw1SenzhhuCzjSi8K1myELLd"},"hash":"WYZaIWbAvdN9n6NmlGv5IwGG/uspJApaM8HVOITDFw1SenzhhuCzjSi8K1myELLd","time":1681509117027},"On0atQCvGd8Wq5AN16MlLarZGI8KHevWGpLACHl6vl8=|7jhhupqfjca":{"msg":{"2n3csc2haf9":["L","I","M","J","H","K"],"_uid":"7jhhupqfjca","_time":1681509152917,"_hash":"keshjQFnWyBV3zMlZlqmMDmyc3gve8qg6Marta4ScWl9N4VVvg92RoYXWAM8jpp5"},"hash":"keshjQFnWyBV3zMlZlqmMDmyc3gve8qg6Marta4ScWl9N4VVvg92RoYXWAM8jpp5","time":1681509152917}};
        var opts = {"values":[{"uid":"31p0hol7tcr","v":"H"},{"uid":"3gu1lju1gbe","v":"I"},{"uid":"6hjcpk4oj49","v":"J"},{"uid":"e446uhqb6t","v":"K"},{"uid":"4pimmkrv0rk","v":"L"},{"uid":"5emh1hr9i6e","v":"M"}]};
        var uid = "2n3csc2haf9";
        var form = {"2n3csc2haf9":{"opts":{"values":[{"uid":"31p0hol7tcr","v":"H"},{"uid":"3gu1lju1gbe","v":"I"},{"uid":"6hjcpk4oj49","v":"J"},{"uid":"e446uhqb6t","v":"K"},{"uid":"4pimmkrv0rk","v":"L"},{"uid":"5emh1hr9i6e","v":"M"}]},"type":"sort","condorcetmethod":"ranked"}};
        var listOfLists = [["H","I","J","K","L","M"],["H","J","I","M","L","K"],["K","L","M","I","J","H"],["L","I","M","J","H","K"]];
        var optionArray = ["H","I","J","K","L","M"];
        var result = JSON.stringify(Condorcet.showCondorcetWinner(_answers, opts, uid, form, optionArray, listOfLists)[0]) === JSON.stringify(["H", "I", "L"]);

        cb(result);
    }, "showCondorcetWinner: Check if correct winner calculated with 6 candidates, 4 votes - Ranked Pairs");  

    assert(function (cb) {
        var _answers = {"uPsKCBZm459szjSk8QAFRv8/e8PPqUMlMO/5gsBL+RI=|9mh5cm44gf":{"msg":{"476l5onou7b":["I","H","K","J"],"_uid":"9mh5cm44gf","_time":1680621761370,"_hash":"f10mYauOvfHV/m9q+hLdXSq1ITGl5MTknJDoDVaDv1Vi5FwkBEl+dQJ2M6bsyoXH"},"hash":"f10mYauOvfHV/m9q+hLdXSq1ITGl5MTknJDoDVaDv1Vi5FwkBEl+dQJ2M6bsyoXH","time":1680621761370}, "CD3En5UdODx1H2ta2zter4OPwqbjWMaN1vj0HYne4j4=|2q0ad65qe37":{"msg":{"476l5onou7b":["I","H","J","K"],"_uid":"2q0ad65qe37","_time":1680621787994,"_hash":"d09chIZWk12/eY8qQO7q9tLhTKjXYrxVPBqhN665XPt/wrsnRuL1OBuPWnUytlMB"},"hash":"d09chIZWk12/eY8qQO7q9tLhTKjXYrxVPBqhN665XPt/wrsnRuL1OBuPWnUytlMB","time":1680621787994},
        "yJgU1jOZaTHYrzQM+/4ax8xBzsR2RMzdQZdMyHO1Mns=|4s5t7bctcgg":{"msg":{"476l5onou7b":["I","K","H","J"],"_uid":"4s5t7bctcgg","_time":1680621809265,"_hash":"+Ez/hNKKVXpH2gasPFaOGMufJuQlPZ2S/T52CB4SRw3Yhu3pJGKl5aEIvtz+2pgs"},"hash":"+Ez/hNKKVXpH2gasPFaOGMufJuQlPZ2S/T52CB4SRw3Yhu3pJGKl5aEIvtz+2pgs","time":1680621809265},
        "l7PXaqBvntgkAEAZ9+aq8GBZQ3NQUE1GJxdPk2RrAF4=|1sglk81ikjr":{"msg":{"476l5onou7b":["K","H","J","I"],"_uid":"1sglk81ikjr","_time":1680622487781,"_hash":"6lexIq9xczLYa0uDGMRJmKSNusnLt9AAXVnUHcxZlXJy40nRtZ28EejvHtGUl1Q9"},"hash":"6lexIq9xczLYa0uDGMRJmKSNusnLt9AAXVnUHcxZlXJy40nRtZ28EejvHtGUl1Q9","time":1680622487781},
        "Iap8s5QBbrHhaR9hdn2l+WQiR4iRQhUtSep1HOkKLTw=|4v7r9d1gcau":{"msg":{"476l5onou7b":["K","J","H","I"],"_uid":"4v7r9d1gcau","_time":1680622514478,"_hash":"8eGwVmQqVWqHw+s2Cs7XEwdNkyA0R16Q/yHPsmpHp74+Zg+tfzwwlX9jqSVim9Mo"},"hash":"8eGwVmQqVWqHw+s2Cs7XEwdNkyA0R16Q/yHPsmpHp74+Zg+tfzwwlX9jqSVim9Mo","time":1680622514478},"bqD+83Sn0IkiNEIlmM2EG+lVHlfUWx4hXaASoyDn1xI=|4klohvjblv2":{"msg":{"476l5onou7b":["J","H","K","I"],"_uid":"4klohvjblv2","_time":1680622548988,"_hash":"SZbW7QFgYohF9ub/5nDZeiqK+Va9dYXbeKB8rn+resk/Ve66Vxpcj7yqm97fQHLn"},"hash":"SZbW7QFgYohF9ub/5nDZeiqK+Va9dYXbeKB8rn+resk/Ve66Vxpcj7yqm97fQHLn","time":1680622548988},"nC6qxNHT3w+HnRvB5BDLZvtLMKEug9EhXqwM+dgIpU4=|4bubr63ibdn":{"msg":{"476l5onou7b":["H","J","K","I"],"_uid":"4bubr63ibdn","_time":1680622577520,"_hash":"scBlg49DR7nW8vWeGn83qLNwSTyuC7qNTRwtfkC2tMwV5Zl3/H2fiVlUyvGIDZlx"},"hash":"scBlg49DR7nW8vWeGn83qLNwSTyuC7qNTRwtfkC2tMwV5Zl3/H2fiVlUyvGIDZlx","time":1680622577520},"g2GArwQ5P+Vi6AY1oxCWOTcPeJGcYz5ev6HTiyyP5FU=|70k27gjpvpp":{"msg":{"476l5onou7b":["H","K","J","I"],"_uid":"70k27gjpvpp","_time":1680635562832,"_hash":"sVHbb/S76dOqL27uy/ey7FQSZyPq4RGm2kxBzCOpr0WsGlClRtgq/j/jnwegYRP7"},"hash":"sVHbb/S76dOqL27uy/ey7FQSZyPq4RGm2kxBzCOpr0WsGlClRtgq/j/jnwegYRP7","time":1680635562832},"a1/8NHm3pOB0/wcs4DKKVegazxFx1gfzqfSL85s9xl0=|lgpdkas2c5":{"msg":{"476l5onou7b":["I","K","J","H"],"_uid":"lgpdkas2c5","_time":1680635589325,"_hash":"ftOs2WlCSOvaiqEfHoVPUdNZEkfpuf/qWUfHUlLov6KbS9ymLIIL++DPpy7010JA"},"hash":"ftOs2WlCSOvaiqEfHoVPUdNZEkfpuf/qWUfHUlLov6KbS9ymLIIL++DPpy7010JA","time":1680635589325},"i6nCrDCEEiLWcXTw0BsNjYVg0/utkFPGZxDGd6kRY3Q=|1t88pndrhqf":{"msg":{"476l5onou7b":["I","J","H","K"],"_uid":"1t88pndrhqf","_time":1680635610185,"_hash":"ry2PbM79VhVD9CZ5FIOQLSI+9nRC4SNbd4FbfywATxO2UcvmnWxPZIf2w6sbj/Y8"},"hash":"ry2PbM79VhVD9CZ5FIOQLSI+9nRC4SNbd4FbfywATxO2UcvmnWxPZIf2w6sbj/Y8","time":1680635610185},"T2xSs09f38m7vozpeJ6YgNYdcE83FznG1joqk2VHziw=|1i65duks12f":{"msg":{"476l5onou7b":["J","I","H","K"],"_uid":"1i65duks12f","_time":1680639763149,"_hash":"JJJmEuZ2hGh06LvnpPmnzlkf/WGlm1nNbmgfjLWESUxHUV5+6I1B3ul/xqDYF27X"},"hash":"JJJmEuZ2hGh06LvnpPmnzlkf/WGlm1nNbmgfjLWESUxHUV5+6I1B3ul/xqDYF27X","time":1680639763149}};
        var opts = {"values":[{"uid":"14apbm7kkt9","v":"H"},{"uid":"3ehkepemfpl","v":"I"},{"uid":"5tp3iphk3rt","v":"J"},{"uid":"134okbmdltd","v":"K"}]};
        var uid = "476l5onou7b";
        var form = {"476l5onou7b":{"condorcetmethod":"schulze","opts":{"values":[{"uid":"14apbm7kkt9","v":"H"},{"uid":"3ehkepemfpl","v":"I"},{"uid":"5tp3iphk3rt","v":"J"},{"uid":"134okbmdltd","v":"K"}]},"type":"sort"}};
        var listOfLists = [["I","H","K","J"],["I","H","J","K"],["I","K","H","J"],["K","H","J","I"],["K","J","H","I"],["J","H","K","I"],["H","J","K","I"],["H","K","J","I"],["I","K","J","H"],["I","J","H","K"],["J","I","H","K"]];
        var optionArray = ["H","I","J","K"];
        var result = JSON.stringify(Condorcet.showCondorcetWinner(_answers, opts, uid, form, optionArray, listOfLists)[0]) === JSON.stringify(["H", "I", "J"]);

        cb(result);
    }, "showCondorcetWinner: Check if correct winner calculated with 4 candidates, 11 votes - Schulze");  

    assert(function (cb) {
        var _answers = {"uPsKCBZm459szjSk8QAFRv8/e8PPqUMlMO/5gsBL+RI=|9mh5cm44gf":{"msg":{"476l5onou7b":["I","H","K","J"],"_uid":"9mh5cm44gf","_time":1680621761370,"_hash":"f10mYauOvfHV/m9q+hLdXSq1ITGl5MTknJDoDVaDv1Vi5FwkBEl+dQJ2M6bsyoXH"},"hash":"f10mYauOvfHV/m9q+hLdXSq1ITGl5MTknJDoDVaDv1Vi5FwkBEl+dQJ2M6bsyoXH","time":1680621761370}, "CD3En5UdODx1H2ta2zter4OPwqbjWMaN1vj0HYne4j4=|2q0ad65qe37":{"msg":{"476l5onou7b":["I","H","J","K"],"_uid":"2q0ad65qe37","_time":1680621787994,"_hash":"d09chIZWk12/eY8qQO7q9tLhTKjXYrxVPBqhN665XPt/wrsnRuL1OBuPWnUytlMB"},"hash":"d09chIZWk12/eY8qQO7q9tLhTKjXYrxVPBqhN665XPt/wrsnRuL1OBuPWnUytlMB","time":1680621787994},
        "yJgU1jOZaTHYrzQM+/4ax8xBzsR2RMzdQZdMyHO1Mns=|4s5t7bctcgg":{"msg":{"476l5onou7b":["I","K","H","J"],"_uid":"4s5t7bctcgg","_time":1680621809265,"_hash":"+Ez/hNKKVXpH2gasPFaOGMufJuQlPZ2S/T52CB4SRw3Yhu3pJGKl5aEIvtz+2pgs"},"hash":"+Ez/hNKKVXpH2gasPFaOGMufJuQlPZ2S/T52CB4SRw3Yhu3pJGKl5aEIvtz+2pgs","time":1680621809265},
        "l7PXaqBvntgkAEAZ9+aq8GBZQ3NQUE1GJxdPk2RrAF4=|1sglk81ikjr":{"msg":{"476l5onou7b":["K","H","J","I"],"_uid":"1sglk81ikjr","_time":1680622487781,"_hash":"6lexIq9xczLYa0uDGMRJmKSNusnLt9AAXVnUHcxZlXJy40nRtZ28EejvHtGUl1Q9"},"hash":"6lexIq9xczLYa0uDGMRJmKSNusnLt9AAXVnUHcxZlXJy40nRtZ28EejvHtGUl1Q9","time":1680622487781},
        "Iap8s5QBbrHhaR9hdn2l+WQiR4iRQhUtSep1HOkKLTw=|4v7r9d1gcau":{"msg":{"476l5onou7b":["K","J","H","I"],"_uid":"4v7r9d1gcau","_time":1680622514478,"_hash":"8eGwVmQqVWqHw+s2Cs7XEwdNkyA0R16Q/yHPsmpHp74+Zg+tfzwwlX9jqSVim9Mo"},"hash":"8eGwVmQqVWqHw+s2Cs7XEwdNkyA0R16Q/yHPsmpHp74+Zg+tfzwwlX9jqSVim9Mo","time":1680622514478},"bqD+83Sn0IkiNEIlmM2EG+lVHlfUWx4hXaASoyDn1xI=|4klohvjblv2":{"msg":{"476l5onou7b":["J","H","K","I"],"_uid":"4klohvjblv2","_time":1680622548988,"_hash":"SZbW7QFgYohF9ub/5nDZeiqK+Va9dYXbeKB8rn+resk/Ve66Vxpcj7yqm97fQHLn"},"hash":"SZbW7QFgYohF9ub/5nDZeiqK+Va9dYXbeKB8rn+resk/Ve66Vxpcj7yqm97fQHLn","time":1680622548988},"nC6qxNHT3w+HnRvB5BDLZvtLMKEug9EhXqwM+dgIpU4=|4bubr63ibdn":{"msg":{"476l5onou7b":["H","J","K","I"],"_uid":"4bubr63ibdn","_time":1680622577520,"_hash":"scBlg49DR7nW8vWeGn83qLNwSTyuC7qNTRwtfkC2tMwV5Zl3/H2fiVlUyvGIDZlx"},"hash":"scBlg49DR7nW8vWeGn83qLNwSTyuC7qNTRwtfkC2tMwV5Zl3/H2fiVlUyvGIDZlx","time":1680622577520},"g2GArwQ5P+Vi6AY1oxCWOTcPeJGcYz5ev6HTiyyP5FU=|70k27gjpvpp":{"msg":{"476l5onou7b":["H","K","J","I"],"_uid":"70k27gjpvpp","_time":1680635562832,"_hash":"sVHbb/S76dOqL27uy/ey7FQSZyPq4RGm2kxBzCOpr0WsGlClRtgq/j/jnwegYRP7"},"hash":"sVHbb/S76dOqL27uy/ey7FQSZyPq4RGm2kxBzCOpr0WsGlClRtgq/j/jnwegYRP7","time":1680635562832},"a1/8NHm3pOB0/wcs4DKKVegazxFx1gfzqfSL85s9xl0=|lgpdkas2c5":{"msg":{"476l5onou7b":["I","K","J","H"],"_uid":"lgpdkas2c5","_time":1680635589325,"_hash":"ftOs2WlCSOvaiqEfHoVPUdNZEkfpuf/qWUfHUlLov6KbS9ymLIIL++DPpy7010JA"},"hash":"ftOs2WlCSOvaiqEfHoVPUdNZEkfpuf/qWUfHUlLov6KbS9ymLIIL++DPpy7010JA","time":1680635589325},"i6nCrDCEEiLWcXTw0BsNjYVg0/utkFPGZxDGd6kRY3Q=|1t88pndrhqf":{"msg":{"476l5onou7b":["I","J","H","K"],"_uid":"1t88pndrhqf","_time":1680635610185,"_hash":"ry2PbM79VhVD9CZ5FIOQLSI+9nRC4SNbd4FbfywATxO2UcvmnWxPZIf2w6sbj/Y8"},"hash":"ry2PbM79VhVD9CZ5FIOQLSI+9nRC4SNbd4FbfywATxO2UcvmnWxPZIf2w6sbj/Y8","time":1680635610185},"T2xSs09f38m7vozpeJ6YgNYdcE83FznG1joqk2VHziw=|1i65duks12f":{"msg":{"476l5onou7b":["J","I","H","K"],"_uid":"1i65duks12f","_time":1680639763149,"_hash":"JJJmEuZ2hGh06LvnpPmnzlkf/WGlm1nNbmgfjLWESUxHUV5+6I1B3ul/xqDYF27X"},"hash":"JJJmEuZ2hGh06LvnpPmnzlkf/WGlm1nNbmgfjLWESUxHUV5+6I1B3ul/xqDYF27X","time":1680639763149}};
        var opts = {"values":[{"uid":"14apbm7kkt9","v":"H"},{"uid":"3ehkepemfpl","v":"I"},{"uid":"5tp3iphk3rt","v":"J"},{"uid":"134okbmdltd","v":"K"}]};
        var uid = "476l5onou7b";
        var form = {"476l5onou7b":{"condorcetmethod":"ranked","opts":{"values":[{"uid":"14apbm7kkt9","v":"H"},{"uid":"3ehkepemfpl","v":"I"},{"uid":"5tp3iphk3rt","v":"J"},{"uid":"134okbmdltd","v":"K"}]},"type":"sort"}};
        var listOfLists = [["I","H","K","J"],["I","H","J","K"],["I","K","H","J"],["K","H","J","I"],["K","J","H","I"],["J","H","K","I"],["H","J","K","I"],["H","K","J","I"],["I","K","J","H"],["I","J","H","K"],["J","I","H","K"]];
        var optionArray = ["H","I","J","K"];
        var result = JSON.stringify(Condorcet.showCondorcetWinner(_answers, opts, uid, form, optionArray, listOfLists)[0]) === JSON.stringify(["H", "I", "J"]);

        cb(result);
    }, "showCondorcetWinner: Check if correct winner calculated with 4 candidates, 11 votes - Ranked Pairs");  

    assert(function (cb) {
        var _answers = {"nrWK2ao8+eOx2bH5eiRN/IEjISVyhGr/EOex5v75+zs=|775f8d6bpkk":{"msg":{"6k68uh55sje":["H","I","J"],"_uid":"775f8d6bpkk","_time":1681564571134,"_hash":"/Cpcp5XwZkpn0to3655jwfbeupdA2yfo0kxELTNcdkmBZSaOtpIs6GlHrFdRKilW"},"hash":"/Cpcp5XwZkpn0to3655jwfbeupdA2yfo0kxELTNcdkmBZSaOtpIs6GlHrFdRKilW","time":1681564571134}, "BKrBVKFcaj9puuzVm9ywFRprbyy5umzurZaAxB1gQ1o=|69h0imbpl68":{"msg":{"6k68uh55sje":["H","J","I"],"_uid":"69h0imbpl68","_time":1681564632044,"_hash":"en55cbanIJaMhfDKKaqjBZtwcT1fvZ0bZ7qAjVNxCYQpWIjLF2QvQ+8ttYRl3gvY"},"hash":"en55cbanIJaMhfDKKaqjBZtwcT1fvZ0bZ7qAjVNxCYQpWIjLF2QvQ+8ttYRl3gvY","time":1681564632044}, "o266rAZYYcndkql7+ewiz8J21l/khFhXcTEzqF3P70c=|2h678cjj3ge":{"msg":{"6k68uh55sje":["H","I","J"],"_uid":"2h678cjj3ge","_time":1681564668863,"_hash":"5bCwP2dcdJkvbMKVJrSMSWihZWk5LbgU3zEWM7KAgVh0n0FvbEuyU1UTeS/pVo/p"},"hash":"5bCwP2dcdJkvbMKVJrSMSWihZWk5LbgU3zEWM7KAgVh0n0FvbEuyU1UTeS/pVo/p","time":1681564668863}, "zmg/CjC3F7To5ljzXdiPM3wDuxW80+NAVd8iW3uJQhA=|5temr60s2ge":{"msg":{"6k68uh55sje":["J","H","I"],"_uid":"5temr60s2ge","_time":1681564706064,"_hash":"VEzxSCkwa156XAT0iAOaZs+Ou/gCpIYTAmtcTuUAVgnGt7wOGyu1BYQYd+9zopwv"},"hash":"VEzxSCkwa156XAT0iAOaZs+Ou/gCpIYTAmtcTuUAVgnGt7wOGyu1BYQYd+9zopwv","time":1681564706064}, "4p9p1hSTNo9YX7ICz5AzU15FDU13jaid67hzvqRuKXs=|1pfkdksafhc":{"msg":{"6k68uh55sje":["J","I","H"],"_uid":"1pfkdksafhc","_time":1681564731280,"_hash":"IVeb2gNNolQx2+eSzbFRe6UpHQw5k3pPTMXMVke8QNWlkGg+CBNbT97QgnO8gt2l"},"hash":"IVeb2gNNolQx2+eSzbFRe6UpHQw5k3pPTMXMVke8QNWlkGg+CBNbT97QgnO8gt2l","time":1681564731280},"+O8QZwcKU+xLpN60zrjhZtu0U3MFfG5/RH6Nk1xeHjw=|7o3rrpd2qut":{"msg":{"6k68uh55sje":["J","I","H"],"_uid":"7o3rrpd2qut","_time":1681564867941,"_hash":"/NqkTRwcc3+uXuLwCc0KGk8KmgZAuRgpM1IhOHzPq6X0zBVVstRNwCZSKae6YvCA"},"hash":"/NqkTRwcc3+uXuLwCc0KGk8KmgZAuRgpM1IhOHzPq6X0zBVVstRNwCZSKae6YvCA","time":1681564867941},
        "kVmHV8AkKawlisyJ+7lpqV11IaSJN/fVQMrGQwRYJGo=|75uupriags3":{"msg":{"6k68uh55sje":["I","H","J"],"_uid":"75uupriags3","_time":1681564968983,"_hash":"nIckNlsRDiK9R4wyODah7kL9AcUDGn6+ybI26egRJN3FQo1EDNs4mHZQK5QgiQat"},"hash":"nIckNlsRDiK9R4wyODah7kL9AcUDGn6+ybI26egRJN3FQo1EDNs4mHZQK5QgiQat","time":1681564968983},"z0iE55YP3VOwa8PDfTvbKjPIP6W6zYeH5b+cvnwrejM=|12enpq7b72o":{"msg":{"6k68uh55sje":["I","J","H"],"_uid":"12enpq7b72o","_time":1681565031185,"_hash":"VvqT4umCeszARxIKyEFiwsI/Xi4OXPxDnwmZaIp8NYtqxfIkryaawmR4W8NRoYRH"},"hash":"VvqT4umCeszARxIKyEFiwsI/Xi4OXPxDnwmZaIp8NYtqxfIkryaawmR4W8NRoYRH","time":1681565031185}};
        var opts = {"values":[{"uid":"7a5jt4jdn59","v":"H"},{"uid":"297t8tg4rme","v":"I"},{"uid":"43ae8cssfk8","v":"J"}]};
        var uid = "6k68uh55sje";
        var form = {"6k68uh55sje":{"opts":{"values":[{"uid":"7a5jt4jdn59","v":"H"},{"uid":"297t8tg4rme","v":"I"},{"uid":"43ae8cssfk8","v":"J"}]},"type":"sort","condorcetmethod":"schulze"}};
        var listOfLists = [["H","I","J"],["H","J","I"],["H","I","J"],["J","H","I"],["J","I","H"],["J","I","H"],["I","H","J"],["I","J","H"]];
        var optionArray = ["H","I","J"];
        var result = JSON.stringify(Condorcet.showCondorcetWinner(_answers, opts, uid, form, optionArray, listOfLists)[0]) === JSON.stringify([]);

        cb(result);
    }, "showCondorcetWinner: Check if correct winner calculated with 3 candidates, 8 votes - Schulze");  

    assert(function (cb) {
        var _answers = {"nrWK2ao8+eOx2bH5eiRN/IEjISVyhGr/EOex5v75+zs=|775f8d6bpkk":{"msg":{"6k68uh55sje":["H","I","J"],"_uid":"775f8d6bpkk","_time":1681564571134,"_hash":"/Cpcp5XwZkpn0to3655jwfbeupdA2yfo0kxELTNcdkmBZSaOtpIs6GlHrFdRKilW"},"hash":"/Cpcp5XwZkpn0to3655jwfbeupdA2yfo0kxELTNcdkmBZSaOtpIs6GlHrFdRKilW","time":1681564571134}, "BKrBVKFcaj9puuzVm9ywFRprbyy5umzurZaAxB1gQ1o=|69h0imbpl68":{"msg":{"6k68uh55sje":["H","J","I"],"_uid":"69h0imbpl68","_time":1681564632044,"_hash":"en55cbanIJaMhfDKKaqjBZtwcT1fvZ0bZ7qAjVNxCYQpWIjLF2QvQ+8ttYRl3gvY"},"hash":"en55cbanIJaMhfDKKaqjBZtwcT1fvZ0bZ7qAjVNxCYQpWIjLF2QvQ+8ttYRl3gvY","time":1681564632044}, "o266rAZYYcndkql7+ewiz8J21l/khFhXcTEzqF3P70c=|2h678cjj3ge":{"msg":{"6k68uh55sje":["H","I","J"],"_uid":"2h678cjj3ge","_time":1681564668863,"_hash":"5bCwP2dcdJkvbMKVJrSMSWihZWk5LbgU3zEWM7KAgVh0n0FvbEuyU1UTeS/pVo/p"},"hash":"5bCwP2dcdJkvbMKVJrSMSWihZWk5LbgU3zEWM7KAgVh0n0FvbEuyU1UTeS/pVo/p","time":1681564668863}, "zmg/CjC3F7To5ljzXdiPM3wDuxW80+NAVd8iW3uJQhA=|5temr60s2ge":{"msg":{"6k68uh55sje":["J","H","I"],"_uid":"5temr60s2ge","_time":1681564706064,"_hash":"VEzxSCkwa156XAT0iAOaZs+Ou/gCpIYTAmtcTuUAVgnGt7wOGyu1BYQYd+9zopwv"},"hash":"VEzxSCkwa156XAT0iAOaZs+Ou/gCpIYTAmtcTuUAVgnGt7wOGyu1BYQYd+9zopwv","time":1681564706064}, "4p9p1hSTNo9YX7ICz5AzU15FDU13jaid67hzvqRuKXs=|1pfkdksafhc":{"msg":{"6k68uh55sje":["J","I","H"],"_uid":"1pfkdksafhc","_time":1681564731280,"_hash":"IVeb2gNNolQx2+eSzbFRe6UpHQw5k3pPTMXMVke8QNWlkGg+CBNbT97QgnO8gt2l"},"hash":"IVeb2gNNolQx2+eSzbFRe6UpHQw5k3pPTMXMVke8QNWlkGg+CBNbT97QgnO8gt2l","time":1681564731280},"+O8QZwcKU+xLpN60zrjhZtu0U3MFfG5/RH6Nk1xeHjw=|7o3rrpd2qut":{"msg":{"6k68uh55sje":["J","I","H"],"_uid":"7o3rrpd2qut","_time":1681564867941,"_hash":"/NqkTRwcc3+uXuLwCc0KGk8KmgZAuRgpM1IhOHzPq6X0zBVVstRNwCZSKae6YvCA"},"hash":"/NqkTRwcc3+uXuLwCc0KGk8KmgZAuRgpM1IhOHzPq6X0zBVVstRNwCZSKae6YvCA","time":1681564867941},
        "kVmHV8AkKawlisyJ+7lpqV11IaSJN/fVQMrGQwRYJGo=|75uupriags3":{"msg":{"6k68uh55sje":["I","H","J"],"_uid":"75uupriags3","_time":1681564968983,"_hash":"nIckNlsRDiK9R4wyODah7kL9AcUDGn6+ybI26egRJN3FQo1EDNs4mHZQK5QgiQat"},"hash":"nIckNlsRDiK9R4wyODah7kL9AcUDGn6+ybI26egRJN3FQo1EDNs4mHZQK5QgiQat","time":1681564968983},"z0iE55YP3VOwa8PDfTvbKjPIP6W6zYeH5b+cvnwrejM=|12enpq7b72o":{"msg":{"6k68uh55sje":["I","J","H"],"_uid":"12enpq7b72o","_time":1681565031185,"_hash":"VvqT4umCeszARxIKyEFiwsI/Xi4OXPxDnwmZaIp8NYtqxfIkryaawmR4W8NRoYRH"},"hash":"VvqT4umCeszARxIKyEFiwsI/Xi4OXPxDnwmZaIp8NYtqxfIkryaawmR4W8NRoYRH","time":1681565031185}};
        var opts = {"values":[{"uid":"7a5jt4jdn59","v":"H"},{"uid":"297t8tg4rme","v":"I"},{"uid":"43ae8cssfk8","v":"J"}]};
        var uid = "6k68uh55sje";
        var form = {"6k68uh55sje":{"opts":{"values":[{"uid":"7a5jt4jdn59","v":"H"},{"uid":"297t8tg4rme","v":"I"},{"uid":"43ae8cssfk8","v":"J"}]},"type":"sort","condorcetmethod":"ranked"}};
        var listOfLists = [["H","I","J"],["H","J","I"],["H","I","J"],["J","H","I"],["J","I","H"],["J","I","H"],["I","H","J"],["I","J","H"]];
        var optionArray = ["H","I","J"];
        var result = JSON.stringify(Condorcet.showCondorcetWinner(_answers, opts, uid, form, optionArray, listOfLists)[0]) === JSON.stringify([]);

        cb(result);
    }, "showCondorcetWinner: Check if correct winner calculated with 3 candidates, 8 votes - Ranked Pairs");  


    assert.run(function (state) {
        var errors = state.errors;
        var failed = errors.length;
        answers = '';
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


/*
        if (failed) {
            Test.failed();
        } else {
            Test.passed();
        }*/
    });

});

