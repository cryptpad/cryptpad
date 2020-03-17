/*@flow*/
/* jshint esversion: 6 */
/* global Buffer */
var Fs = require("fs");
var Fse = require("fs-extra");
var Path = require("path");
var nThen = require("nthen");
var Semaphore = require("saferphore");
var Util = require("../common-util");
var Meta = require("../metadata");
var Extras = require("../hk-util");

const readFileBin = require("../stream-file").readFileBin;

const Schedule = require("../schedule");
const isValidChannelId = function (id) {
    return typeof(id) === 'string' &&
        id.length >= 32 && id.length < 50 &&
        /^[a-zA-Z0-9=+-]*$/.test(id);
};

// 511 -> octal 777
// read, write, execute permissions flag
const PERMISSIVE = 511;

var mkPath = function (env, channelId) {
    return Path.join(env.root, channelId.slice(0, 2), channelId) + '.ndjson';
};

var mkArchivePath = function (env, channelId) {
    return Path.join(env.archiveRoot, 'datastore', channelId.slice(0, 2), channelId) + '.ndjson';
};

var mkMetadataPath = function (env, channelId) {
    return Path.join(env.root, channelId.slice(0, 2), channelId) + '.metadata.ndjson';
};

var mkArchiveMetadataPath = function (env, channelId) {
    return Path.join(env.archiveRoot, 'datastore', channelId.slice(0, 2), channelId) + '.metadata.ndjson';
};

var mkTempPath = function (env, channelId) {
    return mkPath(env, channelId) + '.temp';
};

// pass in the path so we can reuse the same function for archived files
var channelExists = function (filepath, cb) {
    Fs.stat(filepath, function (err, stat) {
        if (err) {
            if (err.code === 'ENOENT') {
                // no, the file doesn't exist
                return void cb(void 0, false);
            }
            return void cb(err);
        }
        if (!stat.isFile()) { return void cb("E_NOT_FILE"); }
        return void cb(void 0, true);
    });
};

// readMessagesBin asynchronously iterates over the messages in a channel log
// the handler for each message must call back to read more, which should mean
// that this function has a lower memory profile than our classic method
// of reading logs line by line.
// it also allows the handler to abort reading at any time
const readMessagesBin = (env, id, start, msgHandler, cb) => {
    const stream = Fs.createReadStream(mkPath(env, id), { start: start });
    return void readFileBin(stream, msgHandler, function (err) {
        try { stream.close(); } catch (err2) { }
        cb(err);
    });
};

// reads classic metadata from a channel log and aborts
// returns undefined if the first message was not an object (not an array)
var getMetadataAtPath = function (Env, path, _cb) {
    const stream = Fs.createReadStream(path, { start: 0 });

    // cb implicitly destroys the stream, if it exists
    // and calls back asynchronously no more than once
    /*
    var cb = Util.once(Util.both(function () {
        try {
            stream.destroy();
        } catch (err) {
            return err;
        }
    }, Util.mkAsync(_cb)));
    */

    var cb = Util.once(Util.mkAsync(_cb), function () {
        throw new Error("Multiple Callbacks");
    });

    var i = 0;
    return readFileBin(stream, function (msgObj, readMore, abort) {
        const line = msgObj.buff.toString('utf8');

        if (!line) {
            return readMore();
        }

        // metadata should always be on the first line or not exist in the channel at all
        if (i++ > 0) {
            console.log("aborting");
            abort();
            return void cb();
        }
        var metadata;
        try {
            metadata = JSON.parse(line);
            // if it parses, is a truthy object, and is not an array
            // then it's what you were looking for
            if (metadata && typeof(metadata) === 'object' && !Array.isArray(metadata)) {
                return void cb(void 0, metadata);
            } else { // it parsed, but isn't metadata
                return void cb(); // call back without an error or metadata
            }
        } catch (err) {
            // if you can't parse, that's bad
            return void cb("INVALID_METADATA");
        }
        readMore();
    }, function (err) {
        cb(err);
    });
};

var closeChannel = function (env, channelName, cb) {
    if (!env.channels[channelName]) { return void cb(); }
    try {
        if (typeof(Util.find(env, [ 'channels', channelName, 'writeStream', 'close'])) === 'function') {
            env.channels[channelName].writeStream.close();
        }
        delete env.channels[channelName];
        env.openFiles--;
        cb();
    } catch (err) {
        cb(err);
    }
};

// truncates a file to the end of its metadata line
// TODO write the metadata in a dedicated file
var clearChannel = function (env, channelId, _cb) {
    var cb = Util.once(Util.mkAsync(_cb));

    var path = mkPath(env, channelId);
    getMetadataAtPath(env, path, function (e, metadata) {
        if (e) { return cb(new Error(e)); }
        if (!metadata) { return void Fs.truncate(path, 0, cb); }

        var len = JSON.stringify(metadata).length + 1;

        // as long as closeChannel is synchronous, this should not cause
        // any race conditions. truncate ought to return faster than a channel
        // can be opened and read by another user. if that turns out not to be
        // the case, we'll need to implement locking.
        closeChannel(env, channelId, function (err) {
            if (err) { cb(err); }
            Fs.truncate(path, len, function (err) {
                if (err) { return cb(err); }
                cb();
            });
        });
    });
};

/*  readMessages is our classic method of reading messages from the disk
    notably doesn't provide a means of aborting if you finish early.
    Internally it uses readFileBin: to avoid duplicating code and to use less memory
*/
var readMessages = function (path, msgHandler, _cb) {
    var stream = Fs.createReadStream(path, { start: 0});
    var cb = Util.once(Util.mkAsync(_cb));
    return readFileBin(stream, function (msgObj, readMore) {
        msgHandler(msgObj.buff.toString('utf8'));
        readMore();
    }, cb);
};

/*  getChannelMetadata
    reads only the metadata embedded in the first line of a channel log.
    does not necessarily provide the most up to date metadata, as it
    could have been amended
*/
var getChannelMetadata = function (Env, channelId, cb) {
    var path = mkPath(Env, channelId);

    // gets metadata embedded in a file
    getMetadataAtPath(Env, path, cb);
};

// low level method for getting just the dedicated metadata channel
var getDedicatedMetadata = function (env, channelId, handler, cb) {
    var metadataPath = mkMetadataPath(env, channelId);
    var stream = Fs.createReadStream(metadataPath, {start: 0});
    readFileBin(stream, function (msgObj, readMore) {
        var line = msgObj.buff.toString('utf8');
        try {
            var parsed = JSON.parse(line);
            handler(null, parsed);
        } catch (err) {
            handler(err, line);
        }
        readMore();
    }, function (err) {
        // ENOENT => there is no metadata log
        if (!err || err.code === 'ENOENT') { return void cb(); }
        // otherwise stream errors?
        cb(err);
    });
};

/*  readMetadata
    fetches the classic format of the metadata from the channel log
    if it is present, otherwise load the log of metadata amendments.
    Requires a handler to process successive lines.
*/
var readMetadata = function (env, channelId, handler, cb) {
/*

Possibilities

    1. there is no metadata because it's an old channel
    2. there is metadata in the first line of the channel, but nowhere else
    3. there is metadata in the first line of the channel as well as in a dedicated log
    4. there is no metadata in the first line of the channel. Everything is in the dedicated log

How to proceed

    1. load the first line of the channel and treat it as a metadata message if applicable
    2. load the dedicated log and treat it as an update

*/

    nThen(function (w) {
        // returns the first line of a channel, parsed...
        getChannelMetadata(env, channelId, w(function (err, data) {
            if (err) {
                // 'INVALID_METADATA' if it can't parse
                // stream errors if anything goes wrong at a lower level
                    // ENOENT (no channel here)
                return void handler(err, data);
            }
            // disregard anything that isn't a map
            if (!data || typeof(data) !== 'object' || Array.isArray(data)) { return; }

            // otherwise it's good.
            handler(null, data);
        }));
    }).nThen(function () {
        getDedicatedMetadata(env, channelId, handler, function (err) {
            if (err) {
                // stream errors?
                return void cb(err);
            }
            cb();
        });
    });
};

//  writeMetadata appends to the dedicated log of metadata amendments
var writeMetadata = function (env, channelId, data, cb) {
    var path = mkMetadataPath(env, channelId);

    Fse.mkdirp(Path.dirname(path), PERMISSIVE, function (err) {
        if (err && err.code !== 'EEXIST') { return void cb(err); }

        // TODO see if we can make this any faster by using something other than appendFile
        Fs.appendFile(path, data + '\n', cb);
    });
};


// check if a file exists at $path
var checkPath = function (path, callback) {
    Fs.stat(path, function (err) {
        if (!err) {
            callback(undefined, true);
            return;
        }
        if (err.code !== 'ENOENT') {
            callback(err);
            return;
        }
        Fse.mkdirp(Path.dirname(path), PERMISSIVE, function (err) {
            if (err && err.code !== 'EEXIST') {
                callback(err);
                return;
            }
            callback(undefined, false);
        });
    });
};

var labelError = function (label, err) {
    return label + (err.code ? "_" +  err.code: '');
};

/*  removeChannel
    fully deletes a channel log and any associated metadata
*/
var removeChannel = function (env, channelName, cb) {
    var channelPath = mkPath(env, channelName);
    var metadataPath = mkMetadataPath(env, channelName);

    var CB = Util.once(cb);

    var errors = 0;
    nThen(function (w) {
        Fs.unlink(channelPath, w(function (err) {
            if (err) {
                if (err.code === 'ENOENT') {
                    errors++;
                    return;
                }
                w.abort();
                CB(labelError("E_CHANNEL_REMOVAL", err));
            }
        }));
        Fs.unlink(metadataPath, w(function (err) {
            if (err) {
                if (err.code === 'ENOENT') {
                    errors++;
                    return;
                } // proceed if there's no metadata to delete
                w.abort();
                CB(labelError("E_METADATA_REMOVAL", err));
            }
        }));
    }).nThen(function () {
        if (errors === 2) {
            return void CB(labelError('E_REMOVE_CHANNEL', new Error("ENOENT")));
        }

        CB();
    });
};

/*  removeArchivedChannel
    fully removes an archived channel log and any associated metadata
*/
var removeArchivedChannel = function (env, channelName, cb) {
    var channelPath = mkArchivePath(env, channelName);
    var metadataPath = mkArchiveMetadataPath(env, channelName);

    var CB = Util.once(cb);

    nThen(function (w) {
        Fs.unlink(channelPath, w(function (err) {
            if (err) {
                w.abort();
                CB(labelError("E_ARCHIVED_CHANNEL_REMOVAL", err));
            }
        }));
        Fs.unlink(metadataPath, w(function (err) {
            if (err) {
                if (err.code === "ENOENT") { return; }
                w.abort();
                CB(labelError("E_ARCHIVED_METADATA_REMOVAL", err));
            }
        }));
    }).nThen(function () {
        CB();
    });
};

// TODO use ../plan.js for a smaller memory footprint
var listChannels = function (root, handler, cb) {
    // do twenty things at a time
    var sema = Semaphore.create(20);

    var dirList = [];

    nThen(function (w) {
        // the root of your datastore contains nested directories...
        Fs.readdir(root, w(function (err, list) {
            if (err) {
                w.abort();
                // TODO check if we normally return strings or errors
                return void cb(err);
            }
            dirList = list;
        }));
    }).nThen(function (w) {
        // search inside the nested directories
        // stream it so you don't put unnecessary data in memory
        var wait = w();
        dirList.forEach(function (dir) {
            sema.take(function (give) {
    // TODO modify the asynchronous bits here to keep less in memory at any given time
    // list a directory -> process its contents with semaphores until less than N jobs are running
    // then list the next directory...
                var nestedDirPath = Path.join(root, dir);
                Fs.readdir(nestedDirPath, w(give(function (err, list) {
                    if (err) { return void handler(err); } // Is this correct?

                    list.forEach(function (item) {
                        // ignore hidden files
                        if (/^\./.test(item)) { return; }
                        // ignore anything that isn't channel or metadata
                        if (!/^[0-9a-fA-F]{32}(\.metadata?)*\.ndjson$/.test(item)) { return; }

                        var isLonelyMetadata = false;
                        var channelName;
                        var metadataName;

                        // if the current file is not the channel data, then it must be metadata
                        if (!/^[0-9a-fA-F]{32}\.ndjson$/.test(item)) {
                            metadataName = item;

                            channelName = item.replace(/\.metadata/, '');

                            // if there is a corresponding channel present in the list,
                            // then we should stop here and handle everything when we get to the channel
                            if (list.indexOf(channelName) !== -1) { return; }
                            // otherwise set a flag indicating that we should
                            // handle the metadata on its own
                            isLonelyMetadata = true;
                        } else {
                            channelName = item;
                            metadataName = channelName.replace(/\.ndjson$/, '.metadata.ndjson');
                        }

                        var filePath = Path.join(nestedDirPath, channelName);
                        var metadataPath = Path.join(nestedDirPath, metadataName);
                        var channel = metadataName.replace(/\.metadata.ndjson$/, '');
                        if ([32, 34].indexOf(channel.length) === -1) { return; }

                        // otherwise throw it on the pile
                        sema.take(function (give) {
                            var next = w(give());

                            var metaStat, channelStat;
                            var metaErr, channelErr;
                            nThen(function (ww) {
                                // get the stats for the metadata
                                Fs.stat(metadataPath, ww(function (err, stats) {
                                    if (err) {
                                        metaErr = err;
                                        return;
                                    }
                                    metaStat = stats;
                                }));

                                if (isLonelyMetadata) { return; }

                                Fs.stat(filePath, ww(function (err, stats) {
                                    if (err) {
                                        channelErr = err;
                                        return;
                                    }
                                    channelStat = stats;
                                }));
                            }).nThen(function () {
                                if (channelErr && metaErr) {
                                    return void handler(channelErr, void 0, next);
                                }

                                var data = {
                                    channel: channel,
                                };

                                if (metaStat && channelStat) {
                                // take max of times returned by either stat
                                    data.atime = Math.max(channelStat.atime, metaStat.atime);
                                    data.mtime = Math.max(channelStat.mtime, metaStat.mtime);
                                    data.ctime = Math.max(channelStat.ctime, metaStat.ctime);
                                // return the sum of the size of the two files
                                    data.size = channelStat.size + metaStat.size;
                                } else if (metaStat) {
                                    data.atime = metaStat.atime;
                                    data.mtime = metaStat.mtime;
                                    data.ctime = metaStat.ctime;
                                    data.size = metaStat.size;
                                } else if (channelStat) {
                                    data.atime = channelStat.atime;
                                    data.mtime = channelStat.mtime;
                                    data.ctime = channelStat.ctime;
                                    data.size = channelStat.size;
                                } else {
                                    return void handler('NO_DATA', void 0, next);
                                }

                                handler(void 0, data, next);
                            });
                        });
                    });
                })));
            });
        });
        wait();
    }).nThen(function () {
        cb();
    });
};

// move a channel's log file from its current location
// to an equivalent location in the cold storage directory
var archiveChannel = function (env, channelName, cb) {
    // TODO close channels before archiving them?

    // ctime is the most reliable indicator of when a file was archived
    // because it is used to indicate changes to the files metadata
    // and not its contents
    // if we find that this is not reliable in production, we can update it manually
    // https://nodejs.org/api/fs.html#fs_fs_utimes_path_atime_mtime_callback

    // check what the channel's path should be (in its current location)
    var currentPath = mkPath(env, channelName);

    // construct a parallel path in the new location
    var archivePath = mkArchivePath(env, channelName);

    // use Fse.move to move it, Fse makes paths to the directory when you use it.
    // https://github.com/jprichardson/node-fs-extra/blob/HEAD/docs/move.md
    nThen(function (w) {
        // move the channel log and abort if anything goes wrong
        Fse.move(currentPath, archivePath, { overwrite: true }, w(function (err) {
            if (err) {
                // proceed to the next block to remove metadata even if there's no channel
                if (err.code === 'ENOENT') { return; }
                // abort and callback for other types of errors
                w.abort();
                return void cb(err);
            }
        }));
    }).nThen(function (w) {
        // archive the dedicated metadata channel
        var metadataPath = mkMetadataPath(env, channelName);
        var archiveMetadataPath = mkArchiveMetadataPath(env, channelName);

        Fse.move(metadataPath, archiveMetadataPath, { overwrite: true, }, w(function (err) {
            // there's no metadata to archive, so you're done!
            if (err && err.code === "ENOENT") {
                return void cb();
            }

            // there was an error archiving the metadata
            if (err) {
                return void cb(labelError("E_METADATA_ARCHIVAL", err));
            }

            // it was archived successfully
            cb();
        }));
    });
};

// restore a channel and its metadata from the archive
// to the appropriate location in the live database
var unarchiveChannel = function (env, channelName, cb) {
    // very much like 'archiveChannel' but in the opposite direction

    // the file is currently archived
    var channelPath = mkPath(env, channelName);
    var metadataPath = mkMetadataPath(env, channelName);

    // don't call the callback multiple times
    var CB = Util.once(cb);

    // if a file exists in the unarchived path, you probably don't want to clobber its data
    // so unlike 'archiveChannel' we won't overwrite.
    // Fse.move will call back with EEXIST in such a situation

    nThen(function (w) {
        // if either metadata or a file exist in prod, abort
        channelExists(channelPath, w(function (err, exists) {
            if (err) {
                w.abort();
                return void CB(err);
            }
            if (exists) {
                w.abort();
                return CB('UNARCHIVE_CHANNEL_CONFLICT');
            }
        }));
        channelExists(metadataPath, w(function (err, exists) {
            if (err) {
                w.abort();
                return void CB(err);
            }
            if (exists) {
                w.abort();
                return CB("UNARCHIVE_METADATA_CONFLICT");
            }
        }));
    }).nThen(function (w) {
        // construct archive paths
        var archiveChannelPath = mkArchivePath(env, channelName);
        // restore the archived channel
        Fse.move(archiveChannelPath, channelPath, w(function (err) {
            if (err) {
                w.abort();
                return void CB(err);
            }
        }));
    }).nThen(function (w) {
        var archiveMetadataPath = mkArchiveMetadataPath(env, channelName);
        // TODO validate that it's ok to move metadata non-atomically

        // restore the metadata log
        Fse.move(archiveMetadataPath, metadataPath, w(function (err) {
            // if there's nothing to move, you're done.
            if (err && err.code === 'ENOENT') {
                return CB();
            }
            // call back with an error if something goes wrong
            if (err) {
                w.abort();
                return void CB(labelError("E_METADATA_RESTORATION", err));
            }
            // otherwise it was moved successfully
            CB();
        }));
    });
};

var flushUnusedChannels = function (env, cb, frame) {
    var currentTime = +new Date();

    var expiration = typeof(frame) === 'undefined'?  env.channelExpirationMs: frame;
    Object.keys(env.channels).forEach(function (chanId) {
        var chan = env.channels[chanId];
        if (typeof(chan.atime) !== 'number') { return; }
        if (currentTime >= expiration + chan.atime) {
            closeChannel(env, chanId, function (err) {
                if (err) {
                    console.error(err);
                    return;
                }
                if (env.verbose) {
                    console.log("Closed channel [%s]", chanId);
                }
            });
        }
    });
    cb();
};

/*  channelBytes
    calls back with an error or the size (in bytes) of a channel and its metadata
*/
var channelBytes = function (env, chanName, cb) {
    var channelPath = mkPath(env, chanName);
    var dataPath = mkMetadataPath(env, chanName);

    var CB = Util.once(cb);

    var channelSize = 0;
    var dataSize = 0;
    nThen(function (w) {
        Fs.stat(channelPath, w(function (err, stats) {
            if (err) {
                if (err.code === 'ENOENT') { return; }
                return void CB(err);
            }
            channelSize = stats.size;
        }));
        Fs.stat(dataPath, w(function (err, stats) {
            if (err) {
                if (err.code === 'ENOENT') { return; }
                return void CB(err);
            }
            dataSize = stats.size;
        }));
    }).nThen(function () {
        CB(void 0, channelSize + dataSize);
    });
};

/*::
export type ChainPadServer_ChannelInternal_t = {
    atime: number,
    writeStream: typeof(process.stdout),
    whenLoaded: ?Array<(err:?Error, chan:?ChainPadServer_ChannelInternal_t)=>void>,
    onError: Array<(?Error)=>void>,
    path: string
};
*/
var getChannel = function (
    env,
    id,
    _callback /*:(err:?Error, chan:?ChainPadServer_ChannelInternal_t)=>void*/
) {
    var callback = Util.once(Util.mkAsync(_callback));
    if (env.channels[id]) {
        var chan = env.channels[id];
        chan.atime = +new Date();
        if (chan.whenLoaded) {
            chan.whenLoaded.push(callback);
        } else {
            callback(undefined, chan);
        }
        return;
    }

    if (env.openFiles >= env.openFileLimit) {
        // FIXME warn if this is the case?
        // alternatively use graceful-fs to handle lots of concurrent reads
        // if you're running out of open files, asynchronously clean up expired files
        // do it on a shorter timeframe, though (half of normal)
        setTimeout(function () {
            flushUnusedChannels(env, function () {
                if (env.verbose) {
                    console.log("Approaching open file descriptor limit. Cleaning up");
                }
            }, env.channelExpirationMs / 2);
        });
    }
    var path = mkPath(env, id);
    var channel /*:ChainPadServer_ChannelInternal_t*/ = env.channels[id] = {
        atime: +new Date(),
        writeStream: (undefined /*:any*/),
        whenLoaded: [ callback ],
        onError: [ ],
        path: path
    };
    var complete = function (err) {
        var whenLoaded = channel.whenLoaded;
        // no guarantee stream.on('error') will not cause this to be called multiple times
        if (!whenLoaded) { return; }
        channel.whenLoaded = undefined;
        if (err) {
            delete env.channels[id];
        }
        if (!channel.writeStream) {
            throw new Error("getChannel() complete called without channel writeStream"); // XXX
        }
        whenLoaded.forEach(function (wl) { wl(err, (err) ? undefined : channel); });
    };
    var fileExists;
    nThen(function (waitFor) {
        checkPath(path, waitFor(function (err, exists) {
            if (err) {
                waitFor.abort();
                return void complete(err);
            }
            fileExists = exists;
        }));
    }).nThen(function (waitFor) {
        var stream = channel.writeStream = Fs.createWriteStream(path, { flags: 'a' });
        env.openFiles++;
        stream.on('open', waitFor());
        stream.on('error', function (err /*:?Error*/) {
            env.openFiles--;
            // this might be called after this nThen block closes.
            if (channel.whenLoaded) {
                complete(err);
            } else {
                channel.onError.forEach(function (handler) {
                    handler(err);
                });
            }
        });
    }).nThen(function () {
        complete();
    });
};

// write a message to the disk as raw bytes
const messageBin = (env, chanName, msgBin, cb) => {
    var complete = Util.once(cb);
    getChannel(env, chanName, function (err, chan) {
        if (!chan) { return void complete(err); }
        chan.onError.push(complete);
        chan.writeStream.write(msgBin, function () {
            chan.onError.splice(chan.onError.indexOf(complete), 1);
            chan.atime = +new Date();
            complete();
        });
    });
};

// append a string to a channel's log as a new line
var message = function (env, chanName, msg, cb) {
    messageBin(env, chanName, Buffer.from(msg + '\n', 'utf8'), cb);
};

// stream messages from a channel log
// TODO replace getMessages with readFileBin
var getMessages = function (env, chanName, handler, cb) {
    getChannel(env, chanName, function (err, chan) {
        if (!chan) {
            cb(err);
            return;
        }
        var errorState = false;
        readMessages(chan.path, function (msg) {
            if (!msg || errorState) { return; }
            //console.log(msg);
            try {
                handler(msg);
            } catch (e) {
                errorState = true;
                return void cb(err);
            }
        }, function (err) {
            if (err) {
                errorState = true;
                return void cb(err);
            }
            // is it really, though? what if we hit the limit of open channels
            // and 'clean up' in the middle of reading a massive file?
            // certainly unlikely
            if (!chan) { throw new Error("impossible, flow checking"); }
            chan.atime = +new Date();
            cb();
        });
    });
};

var trimChannel = function (env, channelName, hash, _cb) {
    var cb = Util.once(Util.mkAsync(_cb));
    // this function is queued as a blocking action for the relevant channel

    // derive temporary file paths for metadata and log buffers
    var tempChannelPath = mkTempPath(env, channelName);

    // derive production db paths
    var channelPath = mkPath(env, channelName);
    var metadataPath = mkMetadataPath(env, channelName);

    // derive archive paths
    var archiveChannelPath = mkArchivePath(env, channelName);
    var archiveMetadataPath = mkArchiveMetadataPath(env, channelName);

    var metadataReference = {};

    var tempStream;
    var ABORT;

    var cleanUp = function (cb) {
        if (tempStream && !tempStream.closed) {
            try {
                tempStream.close();
            } catch (err) { }
        }

        Fse.unlink(tempChannelPath, function (err) {
            // proceed if deleted or if there was nothing to delete
            if (!err || err.code === 'ENOENT') { return cb(); }
            // else abort and call back with the error
            cb(err);
        });
    };

    nThen(function (w) {
        // close the file descriptor if it is open
        closeChannel(env, channelName, w(function (err) {
            if (err) {
                w.abort();
                return void cb(err);
            }
        }));
    }).nThen(function (w) {
        cleanUp(w(function (err) {
            if (err) {
                w.abort();
                cb(err);
            }
        }));
    }).nThen(function (w) {
        // eat errors since loading the logger here would create a cyclical dependency
        var lineHandler = Meta.createLineHandler(metadataReference, Util.noop);

        readMetadata(env, channelName, lineHandler, w(function (err) {
            if (err) {
                w.abort();
                return void cb(err);
            }
            // if there were no errors just fall through to the next block
        }));
    }).nThen(function (w) {
        // create temp buffer writeStream
        tempStream = Fs.createWriteStream(tempChannelPath, {
            flags: 'a',
        });
        tempStream.on('open', w());
        tempStream.on('error', function (err) {
            w.abort();
            ABORT = true;
            cleanUp(function () {
                cb(err);
            });
        });
    }).nThen(function (w) {
        var i = 0;
        var retain = false;

        var handler = function (msgObj, readMore, abort) {
            if (ABORT) { return void abort(); } // XXX
            // the first message might be metadata... ignore it if so
            if (i++ === 0 && msgObj.buff.indexOf('{') === 0) {
                return readMore();
            }

            var s_msg = msgObj.buff.toString('utf8');
            if (retain) {
                // if this flag is set then you've already found
                // the message you were looking for.
                // write it to your temp buffer and keep going
                return void tempStream.write(s_msg + '\n', function () {
                    readMore();
                });
            }

            var msg = Util.tryParse(s_msg);
            if (!msg) { return void readMore(); }
            var msgHash = Extras.getHash(msg[4]);

            if (msgHash === hash) {
                // everything from this point on should be retained
                retain = true;
                return void tempStream.write(s_msg + '\n', function () {
                    readMore();
                });
            }
            readMore();
        };

        readMessagesBin(env, channelName, 0, handler, w(function (err) {
            if (err) {
                w.abort();
                return void cleanUp(function () {
                    // intentionally call back with main error
                    // not the cleanup error
                    cb(err);
                });
            }

            if (!retain) {
                // you never found the message you were looking for
                // this whole operation is invalid...
                // clean up, abort, and call back with an error

                w.abort();
                cleanUp(function () {
                    // intentionally call back with main error
                    // not the cleanup error
                    cb('HASH_NOT_FOUND');
                });
            }
        }));
    }).nThen(function (w) {
        // copy existing channel to the archive
        Fse.copy(channelPath, archiveChannelPath, w(function (err) {
            if (!err || err.code === 'ENOENT') { return; }
            w.abort();
            cleanUp(function () {
                cb(err);
            });
        }));

        // copy existing metadaata to the archive
        Fse.copy(metadataPath, archiveMetadataPath, w(function (err) {
            if (!err || err.code === 'ENOENT') { return; }
            w.abort();
            cleanUp(function () {
                cb(err);
            });
        }));
    }).nThen(function (w) {
        // overwrite the existing metadata log with the current metadata state
        Fs.writeFile(metadataPath, JSON.stringify(metadataReference.meta) + '\n', w(function (err) {
            // this shouldn't happen, but if it does your channel might be messed up :(
            if (err) {
                w.abort();
                cb(err);
            }
        }));

        // overwrite the existing channel with the temp log
        Fse.move(tempChannelPath, channelPath, {
            overwrite: true,
        }, w(function (err) {
            // this shouldn't happen, but if it does your channel might be messed up :(
            if (err) {
                w.abort();
                cb(err);
            }
        }));
    }).nThen(function () {
        // clean up and call back with no error
        // triggering a historyKeeper index cache eviction...
        cleanUp(function () {
            cb();
        });
    });
};

module.exports.create = function (conf, cb) {
    var env = {
        root: conf.filePath || './datastore',
        archiveRoot: conf.archivePath || './data/archive',
        channels: { },
        channelExpirationMs: conf.channelExpirationMs || 30000,
        verbose: conf.verbose,
        openFiles: 0,
        openFileLimit: conf.openFileLimit || 2048,
    };
    var it;

    /*  our scheduler prioritizes and executes tasks with respect
        to all other tasks invoked with an identical key
        (typically the id of the concerned channel)

        it assumes that all tasks can be categorized into three types

        1. unordered tasks such as streaming reads which can take
           a long time to complete.

        2. ordered tasks such as appending to a file which does not
           take very long, but where priority is important.

        3. blocking tasks such as rewriting a file where it would be
           dangerous to perform any other task concurrently.

    */
    var schedule = env.schedule = Schedule();

    nThen(function (w) {
        // make sure the store's directory exists
        Fse.mkdirp(env.root, PERMISSIVE, w(function (err) {
            if (err && err.code !== 'EEXIST') {
                throw err;
            }
        }));
        // make sure the cold storage directory exists
        Fse.mkdirp(env.archiveRoot, PERMISSIVE, w(function (err) {
            if (err && err.code !== 'EEXIST') {
                throw err;
            }
        }));
    }).nThen(function () {
        cb({
        // OLDER METHODS
            // write a new message to a log
            message: function (channelName, content, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                schedule.ordered(channelName, function (next) {
                    message(env, channelName, content, Util.both(cb, next));
                });
            },
            // iterate over all the messages in a log
            getMessages: function (channelName, msgHandler, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                schedule.unordered(channelName, function (next) {
                    getMessages(env, channelName, msgHandler, Util.both(cb, next));
                });
            },

        // NEWER IMPLEMENTATIONS OF THE SAME THING
            // write a new message to a log
            messageBin: (channelName, content, cb) => {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                schedule.ordered(channelName, function (next) {
                    messageBin(env, channelName, content, Util.both(cb, next));
                });
            },
            // iterate over the messages in a log
            readMessagesBin: (channelName, start, asyncMsgHandler, cb) => {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
// FIXME there is a race condition here
// historyKeeper reads the file to find the byte offset of the first interesting message
// then calls this function again to read from that point.
// If this task is in the queue already when the file is read again
// then that byte offset will have been invalidated
// and the resulting stream probably won't align with message boundaries.
// We can evict the cache in the callback but by that point it will be too late.
// Presumably we'll need to bury some of historyKeeper's logic into a filestore method
// in order to make index/read sequences atomic.
// Otherwise, we can add a new task type to the scheduler to take invalidation into account...
// either method introduces significant complexity.
                schedule.unordered(channelName, function (next) {
                    readMessagesBin(env, channelName, start, asyncMsgHandler, Util.both(cb, next));
                });
            },

        // METHODS for deleting data
            // remove a channel and its associated metadata log if present
            removeChannel: function (channelName, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
// FIXME there's another race condition here...
// when a remove and an append are scheduled in that order
// the remove will delete the channel's metadata (including its validateKey)
// then the append will recreate the channel and insert a message.
// clients that are connected to the channel via historyKeeper should be kicked out
// however, anyone that connects to that channel in the future will be able to read the
// signed message, but will not find its validate key...
// resulting in a junk/unusable document
                schedule.ordered(channelName, function (next) {
                    removeChannel(env, channelName, Util.both(cb, next));
                });
            },
            // remove a channel and its associated metadata log from the archive directory
            removeArchivedChannel: function (channelName, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                schedule.ordered(channelName, function (next) {
                    removeArchivedChannel(env, channelName, Util.both(cb, next));
                });
            },
            // clear all data for a channel but preserve its metadata
            clearChannel: function (channelName, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                schedule.ordered(channelName, function (next) {
                    clearChannel(env, channelName, Util.both(cb, next));
                });
            },
            trimChannel: function (channelName, hash, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                schedule.blocking(channelName, function (next) {
                    trimChannel(env, channelName, hash, Util.both(cb, next));
                });
            },

            // check if a channel exists in the database
            isChannelAvailable: function (channelName, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                // construct the path
                var filepath = mkPath(env, channelName);
// (ansuz) I'm uncertain whether this task should be unordered or ordered.
// there's a round trip to the client (and possibly the user) before they decide
// to act on the information of whether there is already content present in this channel.
// so it's practically impossible to avoid race conditions where someone else creates
// some content before you.
// if that's the case, it's basically impossible that you'd generate the same signing key,
// and thus historykeeper should reject the signed messages of whoever loses the race.
// thus 'unordered' seems appropriate.
                schedule.unordered(channelName, function (next) {
                    channelExists(filepath, Util.both(cb, next));
                });
            },
            // check if a channel exists in the archive
            isChannelArchived: function (channelName, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                // construct the path
                var filepath = mkArchivePath(env, channelName);
// as with the method above, somebody might remove, restore, or overwrite an archive
// in the time that it takes to answer this query and to execute whatever follows.
// since it's impossible to win the race every time let's just make this 'unordered'
                schedule.unordered(channelName, function (next) {
                    channelExists(filepath, Util.both(cb, next));
                });
            },
            // move a channel from the database to the archive, along with its metadata
            archiveChannel: function (channelName, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
// again, the semantics around archiving and appending are really muddy.
// so I'm calling this 'unordered' again
                schedule.unordered(channelName, function (next) {
                    archiveChannel(env, channelName, Util.both(cb, next));
                });
            },
            // restore a channel from the archive to the database, along with its metadata
            restoreArchivedChannel: function (channelName, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
// archive restoration will fail if either a file or its metadata exists in the live db.
// so I'm calling this 'ordered' to give writes a chance to flush out.
// accidental conflicts are extremely unlikely since clients check the status
// of a previously known channel before joining.
                schedule.ordered(channelName, function (next) {
                    unarchiveChannel(env, channelName, Util.both(cb, next));
                });
            },

        // METADATA METHODS
            // fetch the metadata for a channel
            getChannelMetadata: function (channelName, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
// The only thing that can invalid this method's results are channel archival, removal, or trimming.
// We want it to be fast, so let's make it unordered.
                schedule.unordered(channelName, function (next) {
                    getChannelMetadata(env, channelName, Util.both(cb, next));
                });
            },
            // iterate over lines of metadata changes from a dedicated log
            readDedicatedMetadata: function (channelName, handler, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
// Everything that modifies metadata also updates clients, so this can be 'unordered'
                schedule.unordered(channelName, function (next) {
                    getDedicatedMetadata(env, channelName, handler, Util.both(cb, next));
                });
            },

            // iterate over multiple lines of metadata changes
            readChannelMetadata: function (channelName, handler, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
// same logic as 'readDedicatedMetadata
                schedule.unordered(channelName, function (next) {
                    readMetadata(env, channelName, handler, Util.both(cb, next));
                });
            },
            // write a new line to a metadata log
            writeMetadata: function (channelName, data, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
// metadata writes are fast and should be applied in order
                schedule.ordered(channelName, function (next) {
                    writeMetadata(env, channelName, data, Util.both(cb, next));
                });
            },

        // CHANNEL ITERATION
            listChannels: function (handler, cb) {
                listChannels(env.root, handler, cb);
            },
            listArchivedChannels: function (handler, cb) {
                listChannels(Path.join(env.archiveRoot, 'datastore'), handler, cb);
            },

            getChannelSize: function (channelName, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
// this method should be really fast and it probably doesn't matter much
// if we get the size slightly before or after somebody writes a few hundred bytes to it.
                schedule.ordered(channelName, function (next) {
                    channelBytes(env, channelName, Util.both(cb, next));
                });
            },
        // OTHER DATABASE FUNCTIONALITY
            // remove a particular channel from the cache
            closeChannel: function (channelName, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
// It is most likely the case that the channel is inactive if we are trying to close it,
// thus it doesn't make much difference whether it's ordered or not.
// In any case, it will be re-opened if anyone tries to write to it.
                schedule.ordered(channelName, function (next) {
                    closeChannel(env, channelName, Util.both(cb, next));
                });
            },
            // iterate over open channels and close any that are not active
            flushUnusedChannels: function (cb) {
                flushUnusedChannels(env, cb);
            },
            // write to a log file
            log: function (channelName, content, cb) {
// you probably want the events in your log to be in the correct order.
                schedule.ordered(channelName, function (next) {
                    message(env, channelName, content, Util.both(cb, next));
                });
            },
            // shut down the database
            shutdown: function () {
                clearInterval(it);
            }
        });
    });
    it = setInterval(function () {
        flushUnusedChannels(env, function () { });
    }, 5000);
};
