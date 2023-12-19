// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([], function () {
    return function () {
        var failMessages = [];
        var passed = 0;
        var ASSERTS = [];
        var MESSAGES = [];
        var assert = function (test, msg) {
            MESSAGES.push(msg || false);
            ASSERTS.push(function (_cb, i) {
                var called = false;
                var to;
                var cb = function (arg) {
                    if (to) {
                        clearTimeout(to);
                        to = undefined;
                    }

                    if (called) { return; }
                    if (msg && !msg.innerText) {
                        msg.innerText = "An unexpected error occurred. See your browser's console for more details";
                    }

                    called = true;
                    _cb(arg);
                };

                to = setTimeout(function () {
                    cb({
                        test: i,
                        message: msg,
                        output: "TIMEOUT",
                    });
                }, 25000);

                try {
                    test(function (result) {
                        if (result === true) {
                            passed++;
                            cb();
                        } else {
                            cb({
                                test: i,
                                message: msg,
                                output: result,
                            });
                        }
                    }, msg);
                } catch (err) {
                    console.error(err);
                    msg.innerText = `Synchronous error thrown (${(err.message || err)}). See console for more details.`;

                    //from ${err.fileName} line ${err.lineNumber}`;
                    cb({
                        test: i,
                        message: msg,
                        output: {
                            message: err.message,
                            file: err.fileName,
                            line: err.lineNumber,
                            stack: typeof(err.stack) === 'string'?
                                err.stack.split('\n'):
                                err.stack,
                        },
                    });
                }
            });
        };

        assert.run = function (cb, progress) {
            progress = progress || function () {};
            var count = ASSERTS.length;
            var total = ASSERTS.length;
            var done = function (err) {
                count--;
                if (err) { failMessages.push(err); }
                if (count === 0) {
                    cb({
                        total: ASSERTS.length,
                        passed: passed,
                        errors: failMessages,
                    });
                }
            };

            ASSERTS.forEach(function (f, index) {
                f(function (err) {
                    //console.log("test " + index);
                    progress(index, total);
                    done(err, index);
                }, index);
            });
        };

        return assert;
    };
});
