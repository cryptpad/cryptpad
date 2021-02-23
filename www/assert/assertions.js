define([], function () {
    return function () {
        var failMessages = [];
        var passed = 0;
        var ASSERTS = [];

        var assert = function (test, msg) {
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
                });
            });
        };

        assert.run = function (cb) {
            var count = ASSERTS.length;
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
                    done(err, index);
                }, index);
            });
        };

        return assert;
    };
});
