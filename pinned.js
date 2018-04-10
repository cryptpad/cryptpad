/* jshint esversion: 6, node: true */
const Fs = require('fs');
const Semaphore = require('saferphore');
const nThen = require('nthen');

const sema = Semaphore.create(20);

let dirList;
const fileList = [];
const pinned = {};

const hashesFromPinFile = (pinFile, fileName) => {
    var pins = {};
    pinFile.split('\n').filter((x)=>(x)).map((l) => JSON.parse(l)).forEach((l) => {
        switch (l[0]) {
            case 'RESET': {
                pins = {};
                if (l[1] && l[1].length) { l[1].forEach((x) => { pins[x] = 1; }); }
                //jshint -W086
                // fallthrough
            }
            case 'PIN': {
                l[1].forEach((x) => { pins[x] = 1; });
                break;
            }
            case 'UNPIN': {
                l[1].forEach((x) => { delete pins[x]; });
                break;
            }
            default: throw new Error(JSON.stringify(l) + '  ' + fileName);
        }
    });
    return Object.keys(pins);
};

module.exports.load = function (cb, config) {
    nThen((waitFor) => {
        Fs.readdir('./pins', waitFor((err, list) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    dirList = [];
                    return;
                }
                throw err;
            }
            dirList = list;
        }));
    }).nThen((waitFor) => {
        dirList.forEach((f) => {
            sema.take((returnAfter) => {
                Fs.readdir('./pins/' + f, waitFor(returnAfter((err, list2) => {
                    if (err) { throw err; }
                    list2.forEach((ff) => {
                        if (config && config.exclude && config.exclude.indexOf(ff) > -1) { return; }
                        fileList.push('./pins/' + f + '/' + ff);
                    });
                })));
            });
        });
    }).nThen((waitFor) => {
        fileList.forEach((f) => {
            sema.take((returnAfter) => {
                Fs.readFile(f, waitFor(returnAfter((err, content) => {
                    if (err) { throw err; }
                    const hashes = hashesFromPinFile(content.toString('utf8'), f);
                    hashes.forEach((x) => {
                        (pinned[x] = pinned[x] || {})[f.replace(/.*\/([^/]*).ndjson$/, (x, y)=>y)] = 1;
                    });
                })));
            });
        });
    }).nThen(() => {
        cb(pinned);
    });
};

if (!module.parent) {
    module.exports.load(function (data) {
        Object.keys(data).forEach(function (x) {
            console.log(x + ' ' + JSON.stringify(data[x]));
        });
    });
}
