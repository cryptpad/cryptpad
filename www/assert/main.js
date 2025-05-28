// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/components/hyper-json/hyperjson.js',
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

    '/components/tweetnacl/nacl-fast.min.js',
    'less!/customize/src/less2/pages/page-assert.less',
], function ($, Hyperjson, Sortify, Drive, /*Test,*/ Hash, Util, Thumb, Wire, Flat, MediaTag, Block, ApiConfig, Assertions, h, Messages) {
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
            Util.encodeBase64(secret.keys.cryptKey) === "0Ts1M6VVEozErV2Nx/LTv6Im5SCD7io2LlhasyyBPQo=" &&
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
            Util.encodeBase64(secret.keys.cryptKey) === "0Ts1M6VVEozErV2Nx/LTv6Im5SCD7io2LlhasyyBPQo=" &&
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
            Util.encodeBase64(secret.keys.cryptKey) === "EeCkGJra8eJgVu7v4Yl2Hc3yUjrgpKpxr0Lcc3bSWVs=" &&
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

/*
        if (failed) {
            Test.failed();
        } else {
            Test.passed();
        }*/
    });

});
