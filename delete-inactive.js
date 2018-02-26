/* jshint esversion: 6, node: true */
const Fs = require("fs");
const nThen = require("nthen");
const Saferphore = require("saferphore");
const PinnedData = require('./pinneddata');
let config;
try {
    config = require('./config');
} catch (e) {
    config = require('./config.example');
}

if (!config.inactiveTime || typeof(config.inactiveTime) !== "number") { return; }

let inactiveTime = +new Date() - (config.inactiveTime * 24 * 3600 * 1000);
let inactiveConfig = {
    unpinned: true,
    olderthan: inactiveTime,
    blobsolderthan: inactiveTime
};
let toDelete;
nThen(function (waitFor) {
    PinnedData.load(inactiveConfig, waitFor(function (err, data) {
        if (err) {
            waitFor.abort();
            throw new Error(err);
        }
        toDelete = data;
    }));
}).nThen(function () {
    var sem = Saferphore.create(10);
    toDelete.forEach(function (f) {
        sem.take(function (give) {
            Fs.unlink(f.filename, give(function (err) {
                if (err) { return void console.error(err + " " + f.filename); }
                console.log(f.filename + " " + f.size + " " + (+f.atime) + " " + (+new Date()));
            }));
        });
    });
});
