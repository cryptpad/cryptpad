/* jshint esversion: 6, node: true */
const Fs = require('fs');
const Path = require("path");
const Semaphore = require('saferphore');
const Once = require("../lib/once");
const nThen = require('nthen');
const Pins = require("../lib/pins");

const sema = Semaphore.create(20);

let dirList;
const fileList = [];
const pinned = {};

module.exports.load = function (cb, config) {
    var pinPath = config.pinPath || './pins';
    var done = Once(cb);

    nThen((waitFor) => {
        // recurse over the configured pinPath, or the default
        Fs.readdir(pinPath, waitFor((err, list) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    dirList = [];
                    return; // this ends up calling back with an empty object
                }
                waitFor.abort();
                return void done(err);
            }
            dirList = list;
        }));
    }).nThen((waitFor) => {
        dirList.forEach((f) => {
            sema.take((returnAfter) => {
                // iterate over all the subdirectories in the pin store
                Fs.readdir(Path.join(pinPath, f), waitFor(returnAfter((err, list2) => {
                    if (err) {
                        waitFor.abort();
                        return void done(err);
                    }
                    list2.forEach((ff) => {
                        if (config && config.exclude && config.exclude.indexOf(ff) > -1) { return; }
                        fileList.push(Path.join(pinPath, f, ff));
                    });
                })));
            });
        });
    }).nThen((waitFor) => {
        fileList.forEach((f) => {
            sema.take((returnAfter) => {
                Fs.readFile(f, waitFor(returnAfter((err, content) => {
                    if (err) {
                        waitFor.abort();
                        return void done(err);
                    }
                    const hashes = Pins.calculateFromLog(content.toString('utf8'), f);
                    hashes.forEach((x) => {
                        (pinned[x] = pinned[x] || {})[f.replace(/.*\/([^/]*).ndjson$/, (x, y)=>y)] = 1;
                    });
                })));
            });
        });
    }).nThen(() => {
        done(void 0, pinned);
    });
};

if (!module.parent) {
    module.exports.load(function (err, data) {
        if (err) {
            return void console.error(err);
        }

        Object.keys(data).forEach(function (x) {
            console.log(x + ' ' + JSON.stringify(data[x]));
        });
    }, {
        pinPath: require("../lib/load-config").pinPath
    });
}
