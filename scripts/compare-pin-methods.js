/* jshint esversion: 6, node: true */
const nThen = require("nthen");
const Pins = require("../lib/pins");
const Assert = require("assert");

const config = require("../lib/load-config");

var compare = function () {
    console.log(config);
    var conf = {
        pinPath: config.pinPath,
    };

    var list, load;

    nThen(function (w) {
        Pins.list(w(function (err, p) {
            if (err) { throw err; }
            list = p;
            console.log(p);
            console.log(list);
            console.log();
        }), conf);
    }).nThen(function (w) {
        Pins.load(w(function (err, p) {
            if (err) { throw err; }
            load = p;
            console.log(load);
            console.log();
        }), conf);
    }).nThen(function () {
        console.log({
            listLength: Object.keys(list).length,
            loadLength: Object.keys(load).length,
        });

        Assert.deepEqual(list, load);
        console.log("methods are equivalent");
    });
};

compare();
