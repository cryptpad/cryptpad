define([], function () {
    return function () {
        var failMessages = [];
        var passed = 0;
        var ASSERTS = [];
        var MESSAGES = [];
        var assert = function (test, msg) {
            MESSAGES.push(msg || false);
            ASSERTS.push(function (cb, i) {
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
