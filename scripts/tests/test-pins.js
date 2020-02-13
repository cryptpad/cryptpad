/*jshint esversion: 6 */
const Pins = require("../../lib/pins");

var stats = {
    users: 0,
    lines: 0,
    pinned: 0,
    events: 0,
};

Pins.list(function (err, pinned) {
    for (var id in pinned) {
        console.log(id);
        stats.pinned++;
    }
    console.log(stats);
}, {
    pinPath: require("../../lib/load-config").pinPath
});

/*
function (ref, safeKey, pinned) {
    stats.users++;
    stats.lines += ref.index;

    Object.keys(ref.pins).forEach(function (id) {
        if (!pinned[id]) {
            pinned[id] = true;
            stats.pinned++;
        }
    });
    //console.log("pin", stats.events++);
    //console.log(ref, safeKey);
}*/
