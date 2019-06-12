/* jshint esversion: 6, node: true */
const Fs = require("fs");
const nThen = require("nthen");
const Saferphore = require("saferphore");
const PinnedData = require('./pinneddata');
const config = require("../lib/load-config");

if (!config.inactiveTime || typeof(config.inactiveTime) !== "number") { return; }

/*  Instead of this script you should probably use
    evict-inactive.js which moves things to an archive directory
    in case the data that would have been deleted turns out to be important.
    it also handles removing that archived data after a set period of time

    it only works for channels at the moment, though, and nothing else.
*/

let inactiveTime = +new Date() - (config.inactiveTime * 24 * 3600 * 1000);
let inactiveConfig = {
    unpinned: true,
    olderthan: inactiveTime,
    blobsolderthan: inactiveTime,

    filePath: config.filePath,
    blobPath: config.blobPath,
    pinPath: config.pinPath,
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
                console.log(f.filename + " " + f.size + " " + (+f.mtime) + " " + (+new Date()));
            }));
        });
    });
});
