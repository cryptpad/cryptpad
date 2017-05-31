/* jshint esversion: 6 */
const Fs = require('fs');
const Semaphore = require('saferphore');
const nThen = require('nthen');

const hashesFromPinFile = (pinFile, fileName) => {
    var pins = {};
    pinFile.split('\n').filter((x)=>(x)).map((l) => JSON.parse(l)).forEach((l) => {
        switch (l[0]) {
            case 'RESET': {
                pins = {};
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

const sizeForHashes = (hashes, dsFileStats) => {
    let sum = 0;
    hashes.forEach((h) => {
        const s = dsFileStats[h];
        if (typeof(s) !== 'number') {
            //console.log('missing ' + h + '  ' + typeof(s));
        } else {
            sum += s.size;
        }
    });
    return sum;
};

const sema = Semaphore.create(20);

let dirList;
const fileList = [];
const dsFileStats = {};
const out = [];
const pinned = {};

nThen((waitFor) => {
    Fs.readdir('./datastore', waitFor((err, list) => {
        if (err) { throw err; }
        dirList = list;
    }));
}).nThen((waitFor) => {
    dirList.forEach((f) => {
        sema.take((returnAfter) => {
            Fs.readdir('./datastore/' + f, waitFor(returnAfter((err, list2) => {
                if (err) { throw err; }
                list2.forEach((ff) => { fileList.push('./datastore/' + f + '/' + ff); });
            })));
        });
    });
}).nThen((waitFor) => {
    fileList.forEach((f) => {
        sema.take((returnAfter) => {
            Fs.stat(f, waitFor(returnAfter((err, st) => {
                if (err) { throw err; }
                dsFileStats[f.replace(/^.*\/([^\/]*)\.ndjson$/, (all, a) => (a))] = st;
            })));
        });
    });
}).nThen((waitFor) => {
    Fs.readdir('./pins', waitFor((err, list) => {
        if (err) { throw err; }
        dirList = list;
    }));
}).nThen((waitFor) => {
    fileList.splice(0, fileList.length);
    dirList.forEach((f) => {
        sema.take((returnAfter) => {
            Fs.readdir('./pins/' + f, waitFor(returnAfter((err, list2) => {
                if (err) { throw err; }
                list2.forEach((ff) => { fileList.push('./pins/' + f + '/' + ff); });
            })));
        });
    });
}).nThen((waitFor) => {
    fileList.forEach((f) => {
        sema.take((returnAfter) => {
            Fs.readFile(f, waitFor(returnAfter((err, content) => {
                if (err) { throw err; }
                const hashes = hashesFromPinFile(content.toString('utf8'), f);
                const size = sizeForHashes(hashes, dsFileStats);
                if (process.argv.indexOf('--unpinned') > -1) {
                    hashes.forEach((x) => { pinned[x] = 1; });
                } else {
                    out.push([f, Math.floor(size / (1024 * 1024))]);
                }
            })));
        });
    });
}).nThen(() => {
    if (process.argv.indexOf('--unpinned') > -1) {
        Object.keys(dsFileStats).forEach((f) => {
            if (!(f in pinned)) {
                console.log("./datastore/" + f.slice(0,2) + "/" + f + ".ndjson " +
                    dsFileStats[f].size + " " + (+dsFileStats[f].mtime));
            }
        });
    } else {
        out.sort((a,b) => (a[1] - b[1]));
        out.forEach((x) => { console.log(x[0] + '  ' + x[1] + ' MB'); });
    }
});
