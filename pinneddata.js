/* jshint esversion: 6, node: true */
const Fs = require('fs');
const Semaphore = require('saferphore');
const nThen = require('nthen');

/*
    takes contents of a pinFile (UTF8 string)
    and the pin file's name
    returns an array of of channel ids which are pinned
*/
const hashesFromPinFile = (pinFile, fileName) => {
    var pins = {};
    pinFile.split('\n').filter((x)=>(x)).map((l) => JSON.parse(l)).forEach((l) => {
        switch (l[0]) {
            case 'RESET': {
                pins = {};
                if (l[1] && l[1].length) { l[1].forEach((x) => { pins[x] = 1; }); }
                break;
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
        if (typeof(s) !== 'object' || typeof(s.size) !== 'number') {
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

module.exports.load = function (config, cb) {
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

        Fs.readdir('./blob', waitFor((err, list) => {
            if (err) { throw err; }
            dirList = list;
        }));
    }).nThen((waitFor) => {
        dirList.forEach((f) => {
            sema.take((returnAfter) => {
                Fs.readdir('./blob/' + f, waitFor(returnAfter((err, list2) => {
                    if (err) { throw err; }
                    list2.forEach((ff) => { fileList.push('./blob/' + f + '/' + ff); });
                })));
            });
        });
    }).nThen((waitFor) => {
        fileList.forEach((f) => {
            sema.take((returnAfter) => {
                Fs.stat(f, waitFor(returnAfter((err, st) => {
                    if (err) { throw err; }
                    st.filename = f;
                    dsFileStats[f.replace(/^.*\/([^\/\.]*)(\.ndjson)?$/, (all, a) => (a))] = st;
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
                    if (config.unpinned) {
                        hashes.forEach((x) => { pinned[x] = 1; });
                    } else {
                        out.push([f, Math.floor(size / (1024 * 1024))]);
                    }
                })));
            });
        });
    }).nThen(() => {
        if (config.unpinned) {
            let before = Infinity;
            if (config.olderthan) {
                before = config.olderthan;
                if (isNaN(before)) {
                    return void cb('--olderthan error [' + config.olderthan + '] not a valid date');
                }
            }
            let blobsbefore = before;
            if (config.blobsolderthan) {
                blobsbefore = config.blobsolderthan;
                if (isNaN(blobsbefore)) {
                    return void cb('--blobsolderthan error [' + config.blobsolderthan + '] not a valid date');
                }
            }
            let files = [];
            Object.keys(dsFileStats).forEach((f) => {
                if (!(f in pinned)) {
                    const isBlob = dsFileStats[f].filename.indexOf('.ndjson') === -1;
                    if ((+dsFileStats[f].atime) >= ((isBlob) ? blobsbefore : before)) { return; }
                    files.push({
                        filename: dsFileStats[f].filename,
                        size: dsFileStats[f].size,
                        atime: dsFileStats[f].atime
                    });
                }
            });
            cb(null, files);
        } else {
            out.sort((a,b) => (a[1] - b[1]));
            cb(null, out.slice());
        }
    });
};

if (!module.parent) {
    let config = {};
    if (process.argv.indexOf('--unpinned') > -1) { config.unpinned = true; }
    const ot = process.argv.indexOf('--olderthan');
    if (ot > -1) {
        config.olderthan = Number(process.argv[ot+1]) ? new Date(Number(process.argv[ot+1]))
                                                      : new Date(process.argv[ot+1]);
    }
    const bot = process.argv.indexOf('--blobsolderthan');
    if (bot > -1) {
        config.blobsolderthan = Number(process.argv[bot+1]) ? new Date(Number(process.argv[bot+1]))
                                                      : new Date(process.argv[bot+1]);
    }
    config.blobsolderthan = bot > -1 && new Date(process.argv[bot+1]);
    module.exports.load(config, function (err, data) {
        if (err) { throw new Error(err); }
        if (!Array.isArray(data)) { return; }
        if (config.unpinned) {
            data.forEach((f) => { console.log(f.filename + " " + f.size + " " + (+f.atime)); });
        } else {
            data.forEach((x) => { console.log(x[0] + '  ' + x[1] + ' MB'); });
        }
    });
}
