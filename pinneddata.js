/* jshint esversion: 6, node: true */
const Fs = require('fs');
const Semaphore = require('saferphore');
const nThen = require('nthen');

/*
    takes contents of a pinFile (UTF8 string)
    and the pin file's name
    returns an array of of channel ids which are pinned

    throw errors on pin logs with invalid pin data
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

/*
    takes an array of pinned file names
    and a global map of stats indexed by public keys
    returns the sum of the size of those pinned files
*/
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

// do twenty things at a time
const sema = Semaphore.create(20);

let dirList;
const fileList = []; // array which we reuse for a lot of things
const dsFileStats = {}; // map of stats
const out = []; // what we return at the end
const pinned = {}; // map of pinned files

// define a function: 'load' which takes a config
// and a callback
module.exports.load = function (config, cb) {
    nThen((waitFor) => {
        // read the subdirectories in the datastore
        Fs.readdir('./datastore', waitFor((err, list) => {
            if (err) { throw err; }
            dirList = list;
        }));
    }).nThen((waitFor) => {
        // iterate over all subdirectories
        dirList.forEach((f) => {
            // process twenty subdirectories simultaneously
            sema.take((returnAfter) => {
                // get the list of files in every subdirectory
                // and push them to 'fileList'
                Fs.readdir('./datastore/' + f, waitFor(returnAfter((err, list2) => {
                    if (err) { throw err; }
                    list2.forEach((ff) => { fileList.push('./datastore/' + f + '/' + ff); });
                })));
            });
        });
    }).nThen((waitFor) => {
        // read the subdirectories in 'blob'
        Fs.readdir('./blob', waitFor((err, list) => {
            if (err) { throw err; }
            // overwrite dirList
            dirList = list;
        }));
    }).nThen((waitFor) => {
        // iterate over all subdirectories
        dirList.forEach((f) => {
            // process twenty subdirectories simultaneously
            sema.take((returnAfter) => {
                // get the list of files in every subdirectory
                // and push them to 'fileList'
                Fs.readdir('./blob/' + f, waitFor(returnAfter((err, list2) => {
                    if (err) { throw err; }
                    list2.forEach((ff) => { fileList.push('./blob/' + f + '/' + ff); });
                })));
            });
        });
    }).nThen((waitFor) => {
        // iterate over the fileList
        fileList.forEach((f) => {
            // process twenty files simultaneously
            sema.take((returnAfter) => {
                // get the stats of each files
                Fs.stat(f, waitFor(returnAfter((err, st) => {
                    if (err) { throw err; }
                    st.filename = f;
                    // push them to a big map of stats
                    dsFileStats[f.replace(/^.*\/([^\/\.]*)(\.ndjson)?$/, (all, a) => (a))] = st;
                })));
            });
        });
    }).nThen((waitFor) => {
        // read the subdirectories in the pinstore
        Fs.readdir('./pins', waitFor((err, list) => {
            if (err) { throw err; }
            dirList = list;
        }));
    }).nThen((waitFor) => {
        // set file list to an empty array
        // fileList = [] ??
        fileList.splice(0, fileList.length);
        dirList.forEach((f) => {
            // process twenty directories at a time
            sema.take((returnAfter) => {
                // get the list of files in every subdirectory
                // and push them to 'fileList' (which is empty because we keep reusing it)
                Fs.readdir('./pins/' + f, waitFor(returnAfter((err, list2) => {
                    if (err) { throw err; }
                    list2.forEach((ff) => { fileList.push('./pins/' + f + '/' + ff); });
                })));
            });
        });
    }).nThen((waitFor) => {
        // iterate over the list of pin logs
        fileList.forEach((f) => {
            // twenty at a time
            sema.take((returnAfter) => {
                // read the full content
                Fs.readFile(f, waitFor(returnAfter((err, content) => {
                    if (err) { throw err; }
                    // get the list of channels pinned by this log
                    const hashes = hashesFromPinFile(content.toString('utf8'), f);
                    if (config.unpinned) {
                        hashes.forEach((x) => { pinned[x] = 1; });
                    } else {
                        // get the size of files pinned by this log
                        // but only if we're gonna use it
                        let size = sizeForHashes(hashes, dsFileStats);
                        // we will return a list of values
                        // [user_public_key, size_of_files_they_have_pinned]
                        out.push([f, Math.floor(size / (1024 * 1024))]);
                    }
                })));
            });
        });
    }).nThen(() => {
        // handle all the information you've processed so far
        if (config.unpinned) {
            // the user wants data about what has not been pinned

            // by default we concern ourselves with pads and files older than infinity (everything)
            let before = Infinity;

            // but you can override this with config
            if (config.olderthan) {
                before = config.olderthan;
                // FIXME validate inputs before doing the heavy lifting
                if (isNaN(before)) { // make sure the supplied value is a number
                    return void cb('--olderthan error [' + config.olderthan + '] not a valid date');
                }
            }

            // you can specify a different time for blobs...
            let blobsbefore = before;
            if (config.blobsolderthan) {
                // use the supplied date if it exists
                blobsbefore = config.blobsolderthan;
                if (isNaN(blobsbefore)) {
                    return void cb('--blobsolderthan error [' + config.blobsolderthan + '] not a valid date');
                }
            }
            let files = [];
            // iterate over all the stats that you've saved
            Object.keys(dsFileStats).forEach((f) => {
                // we only care about files which are not in the pin map
                if (!(f in pinned)) {
                    // check if it's a blob or a 'pad'
                    const isBlob = dsFileStats[f].filename.indexOf('.ndjson') === -1;

                    // if the atime is newer than the specified value for its file type, ignore this file

                    // TODO consider using mtime instead of atime
                    if ((+dsFileStats[f].atime) >= ((isBlob) ? blobsbefore : before)) { return; }

                    // otherwise push it to the list of files, with its filename, size, and atime
                    files.push({
                        filename: dsFileStats[f].filename,
                        size: dsFileStats[f].size,
                        atime: dsFileStats[f].atime
                    });
                }
            });

            // return the list of files
            cb(null, files);
        } else {
            // if you're not in 'unpinned' mode, sort by size (ascending)
            out.sort((a,b) => (a[1] - b[1]));
            // and return the sorted data
            cb(null, out.slice());
        }
    });
};


// This script can be called directly on its own
// or required as part of another script
if (!module.parent) {
    // if no parent, it is being invoked directly
    let config = {}; // build the config from command line arguments...

    // --unpinned gets the list of unpinned files
    // if you don't pass this, it will list the size of pinned data per user
    if (process.argv.indexOf('--unpinned') > -1) { config.unpinned = true; }

    // '--olderthan' must be used in conjunction with '--unpinned'
    // if you pass '--olderthan' with a string date or number, it will limit
    // results only to pads older than the supplied time
    // it defaults to 'infinity', or no filter at all
    const ot = process.argv.indexOf('--olderthan');
    if (ot > -1) {
        config.olderthan = Number(process.argv[ot+1]) ? new Date(Number(process.argv[ot+1]))
                                                      : new Date(process.argv[ot+1]);
    }

    // '--blobsolderthan' must be used in conjunction with '--unpinned'
    // if you pass '--blobsolderthan with a string date or number, it will limit
    // results only to blobs older than the supplied time
    // it defaults to using the same value passed '--olderthan'
    const bot = process.argv.indexOf('--blobsolderthan');
    if (bot > -1) {
        config.blobsolderthan = Number(process.argv[bot+1]) ? new Date(Number(process.argv[bot+1]))
                                                      : new Date(process.argv[bot+1]);
    }

    // call our big function directly
    // pass our constructed configuration and a callback
    module.exports.load(config, function (err, data) {
        if (err) { throw new Error(err); } // throw errors
        if (!Array.isArray(data)) { return; } // if the returned value is not an array, you're done
        if (config.unpinned) {
            // display the list of unpinned files with their size and atime
            data.forEach((f) => { console.log(f.filename + " " + f.size + " " + (+f.atime)); });
        } else {
            // display the list of public keys and the size of the data they have pinned in megabytes
            data.forEach((x) => { console.log(x[0] + '  ' + x[1] + ' MB'); });
        }
    });
}


/* Example usage of this script...

# display the list of public keys and the size of the data the have pinned in megabytes
node pinneddata.js

# display the list of unpinned pads and blobs with their size and atime
node pinneddata.js --unpinned

# display the list of unpinned pads and blobs older than 12345 with their size and atime
node pinneddata.js --unpinned --olderthan 12345


# display the list of unpinned pads older than 12345 and unpinned blobs older than 123
# each with their size and atime
node pinneddata.js --unpinned --olderthan 12345 --blobsolderthan 123

*/
