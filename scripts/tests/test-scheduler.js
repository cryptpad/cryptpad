/*  three types of actions:
    * read
    * write
    * append
    each of which take a random amount of time

*/
var Util = require("../../lib/common-util");
var schedule = require("../../lib/schedule")();
var nThen = require("nthen");

var rand = function (n) {
    return Math.floor(Math.random() * n);
};

var rand_time = function () {
    // between 51 and 151
    return rand(300) + 25;
};

var makeAction = function (type) {
    var i = 0;
    return function (time) {
        var j = i++;
        return function (next) {
            console.log("  Beginning action: %s#%s", type, j);
            setTimeout(function () {
                console.log("    Completed action: %s#%s", type, j);
                next();
            }, time);
            return j;
        };
    };
};

var TYPES = ['WRITE', 'READ', 'APPEND'];
var chooseAction = function () {
    var n = rand(100);

    if (n < 50) { return 'APPEND'; }
    if (n < 90) { return 'READ'; }
    return 'WRITE';

    //return TYPES[rand(3)];
};

var test = function (script, cb) {
    var uid = Util.uid();

    var TO_RUN = script.length;
    var total_run = 0;

    var parallel = 0;
    var last_run_ordered = -1;
    //var i = 0;

    var ACTIONS = {};
    TYPES.forEach(function (type) {
        ACTIONS[type] = makeAction(type);
    });

    nThen(function (w) {
        setTimeout(w(), 3000);
        // run scripted actions with assertions
        script.forEach(function (scene) {
            var type = scene[0];
            var time = typeof(scene[1]) === 'number'? scene[1]: rand_time();

            var action = ACTIONS[type](time);
            console.log("Queuing action of type: %s(%s)", type, time);

            var proceed = w();

            switch (type) {
                case 'APPEND':
                    return schedule.ordered(uid, w(function (next) {
                        parallel++;
                        var temp = action(function () {
                            parallel--;
                            total_run++;
                            proceed();
                            next();
                        });
                        if (temp !== (last_run_ordered + 1)) {
                            throw new Error("out of order");
                        }
                        last_run_ordered = temp;
                    }));
                case 'WRITE':
                    return schedule.blocking(uid, w(function (next) {
                        parallel++;
                        action(function () {
                            parallel--;
                            total_run++;
                            proceed();
                            next();
                        });
                        if (parallel > 1) {
                            console.log("parallelism === %s", parallel);
                            throw new Error("too much parallel");
                        }
                    }));
                case 'READ':
                    return schedule.unordered(uid, w(function (next) {
                        parallel++;
                        action(function () {
                            parallel--;
                            total_run++;
                            proceed();
                            next();
                        });
                    }));
                default:
                    throw new Error("wut");
            }
        });
    }).nThen(function () {
        // make assertions about the whole script
        if (total_run !== TO_RUN) {
            console.log("Ran %s / %s", total_run, TO_RUN);
            throw new Error("skipped tasks");
        }
        console.log("total_run === %s", total_run);

        cb();
    });
};


var randomScript = function () {
    var len = rand(15) + 10;
    var script = [];
    while (len--) {
        script.push([
            chooseAction(),
            rand_time(),
        ]);
    }
    return script;
};

var WRITE = function (t) {
    return ['WRITE', t];
};
var READ = function (t) {
    return ['READ', t];
};

var APPEND = function (t) {
    return ['APPEND', t];
};

nThen(function (w) {
    test([
        ['READ', 150],
        ['APPEND', 200],
        ['APPEND', 100],
        ['READ', 350],
        ['WRITE', 400],
        ['APPEND', 275],
        ['APPEND', 187],
        ['WRITE', 330],
        ['WRITE', 264],
        ['WRITE', 256],
    ], w(function () {
        console.log("finished pre-scripted test\n");
    }));
}).nThen(function (w) {
    test([
        WRITE(289),
        APPEND(281),
        READ(207),
        WRITE(225),
        READ(279),
        WRITE(300),
        READ(331),
        APPEND(341),
        APPEND(385),
        READ(313),
        WRITE(285),
        READ(304),
        APPEND(273),
        APPEND(150),
        WRITE(246),
        READ(244),
        WRITE(172),
        APPEND(253),
        READ(215),
        READ(296),
        APPEND(281),
        APPEND(296),
        WRITE(168),
    ], w(function () {
        console.log("finished 2nd pre-scripted test\n");
    }));
}).nThen(function () {
    var totalTests = 50;
    var randomTests = 1;

    var last = nThen(function () {
        console.log("beginning randomized tests");
    });

    var queueRandomTest = function (i) {
        last = last.nThen(function (w) {
            console.log("running random test script #%s\n", i);
            test(randomScript(), w(function () {
                console.log("finished random test #%s\n", i);
            }));
        });
    };

    while (randomTests <=totalTests) { queueRandomTest(randomTests++);  }

    last.nThen(function () {
        console.log("finished %s random tests", totalTests);
    });
});


