/*jshint esversion: 6 */
const Pins = require("../../lib/pins");

var stats = {
    users: 0,
    lines: 0, // how many lines did you iterate over
    surplus: 0, // how many of those lines were not needed?
    pinned: 0, // how many files are pinned?
    duplicated: 0,
};

var handler = function (ref, id /* safeKey */, pinned) {
    if (ref.surplus) {
        //console.log("%s has %s trimmable lines", id, ref.surplus);
        stats.surplus += ref.surplus;
    }

    for (var item in ref.pins) {
        if (!pinned.hasOwnProperty(item)) {
            //console.log("> %s is pinned", item);
            stats.pinned++;
        } else {
            //console.log("> %s was already pinned", item);
            stats.duplicated++;
        }
    }

    stats.users++;
    stats.lines += ref.index;
    //console.log(ref, id);
};

Pins.list(function (err) {
    if (err) { return void console.error(err); }
/*
    for (var id in pinned) {
        console.log(id);
        stats.pinned++;
    }
*/
    console.log(stats);
}, {
    pinPath: require("../../lib/load-config").pinPath,
    handler: handler,
});

