define([
    'jquery',
    '/customize/share/frame.js'
], function ($, Frame) {

    var domain = 'https://beta.cryptpad.fr';

    var path = '/customize/share/frame.html';

    var acceptResponseFrom = [
        /cryptpad.fr$/
    ];

    var lock = 0;

    var unlock = function (i) {
        lock--;
        console.log("Test #%s passed", i + 1);
        if (!lock) { $('#status').addClass('working'); }
    };

    var runTest = function (test, i) {
        lock++;
        test(i);
    };

    var randInt = function () {
        return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    };

    var handleErr = function (err) {
        if (err) {
            console.error(err);
            return true;
        }
    };

    var areNull = function (keys, data) {
        return !keys.some(function (k) { return data[k] !== null; });
    };

    Frame.create(document.body, domain + path, function (err, iframe) {
        if (handleErr(err)) { return; }
        console.log("Created iframe");

        // open a channel into the frame, accept messages from (sub)domain(s)
        var frame = window.Beta = Frame.open(iframe, acceptResponseFrom);

        /* Run your actual tests */

        [function (i) { // test #1
            var pew = randInt();
            frame.set('pew', pew, function (err) {
                if (handleErr(err)) { return; }
                frame.get('pew', function (err, num) {
                    if (handleErr(err)) { return; }
                    if (pew === num) {
                        frame.remove('pew', function (err) {
                            if (handleErr(err)) { return; }

                            frame.get('pew', function (err, data) {
                                if (handleErr(err)) { return; }
                                if (data !== null) { return; }
                                unlock(i);
                            });
                        });
                    }
                });
            });
        }, function (i) { // test #2
            var map = {
                bang: randInt(),
                pow: randInt(),
                lol: randInt(),
            };

            var keys = Object.keys(map);

            frame.setBatch(map, function (err) {
                if (handleErr(err)) { return; }
                frame.getBatch(keys, function (err) {
                    if (handleErr(err)) { return; }
                    frame.removeBatch(Object.keys(map), function (err) {
                        if (handleErr(err)) { return; }

                        frame.getBatch(keys, function (err, data) {
                            if (areNull(keys, data)) { unlock(i); }
                        });
                    });
                });
            });
        }, function (i) { // test #3
            var map = {
                bang2: true,
                pow2: true,
                lol2: true,
            };

            var keys = Object.keys(map);

            // set some keys to arbitrary values
            frame.setBatch(map, function (err) {
                if (handleErr(err)) { return; }

                // remove those values
                frame.removeBatch(keys, function (err) {
                    if (handleErr(err)) { return; }

                    // check that they were actually removed
                    frame.getBatch(keys, function (err, data) {
                        if (handleErr(err)) { return; }

                        // all keys should be null after you've removed them
                        if (areNull(keys, data)) {
                            unlock(i);
                            return;
                        }
                        console.log("Expected all keys to return null");
                    });
                });
            });
        }].forEach(runTest);
    });
});
