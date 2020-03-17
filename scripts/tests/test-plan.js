/*jshint esversion: 6 */
const Plan = require("../../lib/plan");

var rand_delay = function (f) {
    setTimeout(f, Math.floor(Math.random() * 1500) + 250);
};

var plan = Plan(6).job(1, function (next) {
    [1,2,3,4,5,6,7,8,9,10,11,12].forEach(function (n) {
        plan.job(0, function (next) {
            rand_delay(function () {
                console.log("finishing job %s", n);
                next();
            });
        });
    });
    console.log("finishing job 0");
    next();
}).job(2, function (next) {
    console.log("finishing job 13");

    [
        100,
        200,
        300,
        400
    ].forEach(function (n) {
        plan.job(3, function (next) {
            rand_delay(function () {
                console.log("finishing job %s", n);
                next();
            });
        });
    });

    next();
}).done(function () { console.log("DONE"); }).start();

//console.log(plan);

//plan.start();
