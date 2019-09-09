/*@flow*/
/* jshint esversion: 6 */
/* global Buffer */
var Fs = require("fs");
var Fse = require("fs-extra");
var Path = require("path");
var nThen = require("nthen");
var Semaphore = require("saferphore");
var Once = require("../lib/once");
const ToPull = require('stream-to-pull-stream');
const Pull = require('pull-stream');

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

// reads classic metadata from a channel log and aborts
var getMetadataAtPath = function (Env, path, cb) {
    var remainder = '';
    var stream = Fs.createReadStream(path, { encoding: 'utf8' });
    var complete = function (err, data) {
        var _cb = cb;
        cb = undefined;
        if (_cb) { _cb(err, data); }
    };
    stream.on('data', function (chunk) {
        if (!/\n/.test(chunk)) {
            remainder += chunk;
            return;
        }
        stream.close();
        var metadata = chunk.split('\n')[0];

        var parsed = null;
        try {
            parsed = JSON.parse(metadata);
            complete(undefined, parsed);
        }
        catch (e) {
            console.log("getMetadataAtPath");
            console.error(e);
            complete('INVALID_METADATA', metadata);
        }
    });
    stream.on('end', function () {
        complete();
    });
    stream.on('error', function (e) { complete(e); });
};

var closeChannel = function (env, channelName, cb) {
    if (!env.channels[channelName]) { return void cb(); }
    try {
        env.channels[channelName].writeStream.close();
        delete env.channels[channelName];
        env.openFiles--;
        cb();
    } catch (err) {
        cb(err);
    }
};

// truncates a file to the end of its metadata line
var clearChannel = function (env, channelId, cb) {
    var path = mkPath(env, channelId);
    getMetadataAtPath(env, path, function (e, metadata) {
        if (e) { return cb(new Error(e)); }
        if (!metadata) {
            return void Fs.truncate(path, 0, function (err) {
                if (err) {
                    return cb(err);
                }
                cb(void 0);
            });
        }

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
    notably doesn't provide a means of aborting if you finish early
*/
var readMessages = function (path, msgHandler, cb) {
    var remainder = '';
    var stream = Fs.createReadStream(path, { encoding: 'utf8' });
    var complete = function (err) {
        var _cb = cb;
        cb = undefined;
        if (_cb) { _cb(err); }
    };
    stream.on('data', function (chunk) {
        var lines = chunk.split('\n');
        lines[0] = remainder + lines[0];
        remainder = lines.pop();
        lines.forEach(msgHandler);
    });
    stream.on('end', function () {
        msgHandler(remainder);
        complete();
    });
    stream.on('error', function (e) { complete(e); });
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
    readMessages(metadataPath, function (line) {
        if (!line) { return; }
        try {
            var parsed = JSON.parse(line);
            handler(null, parsed);
        } catch (e) {
            handler(e, line);
        }
    }, function (err) {
        if (err) {
            // ENOENT => there is no metadata log
            if (err.code === 'ENOENT') { return void cb(); }
            // otherwise stream errors?
            return void cb(err);
        }
        cb();
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
                return void handler(err);
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


// transform a stream of arbitrarily divided data
// into a stream of buffers divided by newlines in the source stream
// TODO see if we could improve performance by using libnewline
const NEWLINE_CHR = ('\n').charCodeAt(0);
const mkBufferSplit = () => {
    let remainder = null;
    return Pull((read) => {
        return (abort, cb) => {
            read(abort, function (end, data) {
                if (end) {
                    if (data) { console.log("mkBufferSplit() Data at the end"); }
                    cb(end, remainder ? [remainder, data] : [data]);
                    remainder = null;
                    return;
                }
                const queue = [];
                for (;;) {
                    const offset = data.indexOf(NEWLINE_CHR);
                    if (offset < 0) {
                        remainder = remainder ? Buffer.concat([remainder, data]) : data;
                        break;
                    }
                    let subArray = data.slice(0, offset);
                    if (remainder) {
                        subArray = Buffer.concat([remainder, subArray]);
                        remainder = null;
                    }
                    queue.push(subArray);
                    data = data.slice(offset + 1);
                }
                cb(end, queue);
            });
        };
    }, Pull.flatten());
};

// return a streaming function which transforms buffers into objects
// containing the buffer and the offset from the start of the stream
const mkOffsetCounter = () => {
    let offset = 0;
    return Pull.map((buff) => {
        const out = { offset: offset, buff: buff };
        // +1 for the eaten newline
        offset += buff.length + 1;
        return out;
    });
};

// readMessagesBin asynchronously iterates over the messages in a channel log
// the handler for each message must call back to read more, which should mean
// that this function has a lower memory profile than our classic method
// of reading logs line by line.
// it also allows the handler to abort reading at any time
const readMessagesBin = (env, id, start, msgHandler, cb) => {
    const stream = Fs.createReadStream(mkPath(env, id), { start: start });
    let keepReading = true;
    Pull(
        ToPull.read(stream),
        mkBufferSplit(),
        mkOffsetCounter(),
        Pull.asyncMap((data, moreCb) => {
            msgHandler(data, moreCb, () => { keepReading = false; moreCb(); });
        }),
        Pull.drain(() => (keepReading), (err) => {
            cb((keepReading) ? err : undefined);
        })
    );
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

    var CB = Once(cb);

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

    var CB = Once(cb);

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
    if (!env.retainData) {
        return void cb("ARCHIVES_DISABLED");
    }

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
    var CB = Once(cb);

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

    var CB = Once(cb);

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
    callback /*:(err:?Error, chan:?ChainPadServer_ChannelInternal_t)=>void*/
) {
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
            throw new Error("getChannel() complete called without channel writeStream");
        }
        whenLoaded.forEach(function (wl) { wl(err, (err) ? undefined : channel); });
    };
    var fileExists;
    var errorState;
    nThen(function (waitFor) {
        checkPath(path, waitFor(function (err, exists) {
            if (err) {
                errorState = true;
                complete(err);
                return;
            }
            fileExists = exists;
        }));
    }).nThen(function (waitFor) {
        if (errorState) { return; }
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
        if (errorState) { return; }
        complete();
    });
};

// write a message to the disk as raw bytes
const messageBin = (env, chanName, msgBin, cb) => {
    getChannel(env, chanName, function (err, chan) {
        if (!chan) {
            cb(err);
            return;
        }
        let called = false;
        var complete = function (err) {
            if (called) { return; }
            called = true;
            cb(err);
        };
        chan.onError.push(complete);
        chan.writeStream.write(msgBin, function () {
            /*::if (!chan) { throw new Error("Flow unreachable"); }*/
            chan.onError.splice(chan.onError.indexOf(complete), 1);
            chan.atime = +new Date();
            if (!cb) { return; }
            complete();
        });
    });
};

// append a string to a channel's log as a new line
var message = function (env, chanName, msg, cb) {
    messageBin(env, chanName, new Buffer(msg + '\n', 'utf8'), cb);
};

// stream messages from a channel log
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

/*::
export type ChainPadServer_MessageObj_t = { buff: Buffer, offset: number };
export type ChainPadServer_Storage_t = {
    readMessagesBin: (
        channelName:string,
        start:number,
        asyncMsgHandler:(msg:ChainPadServer_MessageObj_t, moreCb:()=>void, abortCb:()=>void)=>void,
        cb:(err:?Error)=>void
    )=>void,
    message: (channelName:string, content:string, cb:(err:?Error)=>void)=>void,
    messageBin: (channelName:string, content:Buffer, cb:(err:?Error)=>void)=>void,
    getMessages: (channelName:string, msgHandler:(msg:string)=>void, cb:(err:?Error)=>void)=>void,
    removeChannel: (channelName:string, cb:(err:?Error)=>void)=>void,
    closeChannel: (channelName:string, cb:(err:?Error)=>void)=>void,
    flushUnusedChannels: (cb:()=>void)=>void,
    getChannelSize: (channelName:string, cb:(err:?Error, size:?number)=>void)=>void,
    getChannelMetadata: (channelName:string, cb:(err:?Error|string, data:?any)=>void)=>void,
    clearChannel: (channelName:string, (err:?Error)=>void)=>void
};
export type ChainPadServer_Config_t = {
    verbose?: boolean,
    filePath?: string,
    channelExpirationMs?: number,
    openFileLimit?: number
};
*/
module.exports.create = function (
    conf /*:ChainPadServer_Config_t*/,
    cb /*:(store:ChainPadServer_Storage_t)=>void*/
) {
    var env = {
        root: conf.filePath || './datastore',
        archiveRoot: conf.archivePath || './data/archive',
        retainData: conf.retainData,
        channels: { },
        channelExpirationMs: conf.channelExpirationMs || 30000,
        verbose: conf.verbose,
        openFiles: 0,
        openFileLimit: conf.openFileLimit || 2048,
    };
    var it;

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
                message(env, channelName, content, cb);
            },
            // iterate over all the messages in a log
            getMessages: function (channelName, msgHandler, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                getMessages(env, channelName, msgHandler, cb);
            },

        // NEWER IMPLEMENTATIONS OF THE SAME THING
            // write a new message to a log
            messageBin: (channelName, content, cb) => {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                messageBin(env, channelName, content, cb);
            },
            // iterate over the messages in a log
            readMessagesBin: (channelName, start, asyncMsgHandler, cb) => {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                readMessagesBin(env, channelName, start, asyncMsgHandler, cb);
            },

        // METHODS for deleting data
            // remove a channel and its associated metadata log if present
            removeChannel: function (channelName, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                removeChannel(env, channelName, function (err) {
                    cb(err);
                });
            },
            // remove a channel and its associated metadata log from the archive directory
            removeArchivedChannel: function (channelName, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                removeArchivedChannel(env, channelName, cb);
            },
            // clear all data for a channel but preserve its metadata
            clearChannel: function (channelName, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                clearChannel(env, channelName, cb);
            },

            // check if a channel exists in the database
            isChannelAvailable: function (channelName, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                // construct the path
                var filepath = mkPath(env, channelName);
                channelExists(filepath, cb);
            },
            // check if a channel exists in the archive
            isChannelArchived: function (channelName, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                // construct the path
                var filepath = mkArchivePath(env, channelName);
                channelExists(filepath, cb);
            },
            // move a channel from the database to the archive, along with its metadata
            archiveChannel: function (channelName, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                archiveChannel(env, channelName, cb);
            },
            // restore a channel from the archive to the database, along with its metadata
            restoreArchivedChannel: function (channelName, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                unarchiveChannel(env, channelName, cb);
            },

        // METADATA METHODS
            // fetch the metadata for a channel
            getChannelMetadata: function (channelName, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                getChannelMetadata(env, channelName, cb);
            },
            // iterate over lines of metadata changes from a dedicated log
            readDedicatedMetadata: function (channelName, handler, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                getDedicatedMetadata(env, channelName, handler, cb);
            },

            // iterate over multiple lines of metadata changes
            readChannelMetadata: function (channelName, handler, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                readMetadata(env, channelName, handler, cb);
            },
            // write a new line to a metadata log
            writeMetadata: function (channelName, data, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                writeMetadata(env, channelName, data, cb);
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
                channelBytes(env, channelName, cb);
            },
        // OTHER DATABASE FUNCTIONALITY
            // remove a particular channel from the cache
            closeChannel: function (channelName, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                closeChannel(env, channelName, cb);
            },
            // iterate over open channels and close any that are not active
            flushUnusedChannels: function (cb) {
                flushUnusedChannels(env, cb);
            },
            // write to a log file
            log: function (channelName, content, cb) {
                message(env, channelName, content, cb);
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
