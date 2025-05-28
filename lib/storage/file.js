// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/*@flow*/
var Fs = require("fs");
var Fse = require("fs-extra");
var Path = require("path");
var nThen = require("nthen");
var Semaphore = require("saferphore");
var Util = require("../common-util");
var Meta = require("../metadata");
var Extras = require("../hk-util");

const readFileBin = require("../stream-file").readFileBin;
const BatchRead = require("../batch-read");

const Schedule = require("../schedule");

/*  Each time you write to a channel it will either use an open file descriptor
    for that channel or open a new descriptor if one is not available. These are
    automatically closed after this window to prevent a file descriptor leak, so
    writes that take longer than this time may be dropped! */
const CHANNEL_WRITE_WINDOW = 300000;

/*  Each time you read a channel it will have this many milliseconds to complete
    otherwise it will be closed to prevent a file descriptor leak. The server will
    lock up if it uses all available file descriptors, so it's important to close
    them. The tradeoff with this timeout is that some functions, the stream, and
    and the timeout itself are stored in memory. A longer timeout uses more memory
    and running out of memory will also kill the server. */
const STREAM_CLOSE_TIMEOUT = 120000;

/*  The above timeout closes the stream, but apparently that doesn't always work.
    We set yet another timeout to allow the runtime to gracefully close the stream
    (flushing all pending writes/reads and doing who knows what else). After this timeout
    it will be MERCILESSLY DESTROYED. This isn't graceful, but again, file descriptor
    leaks are bad. */
const STREAM_DESTROY_TIMEOUT = 30000;

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
    return Path.join(env.archiveRoot, env.volumeId, channelId.slice(0, 2), channelId) + '.ndjson';
};

var mkMetadataPath = function (env, channelId) {
    return Path.join(env.root, channelId.slice(0, 2), channelId) + '.metadata.ndjson';
};

var mkArchiveMetadataPath = function (env, channelId) {
    return Path.join(env.archiveRoot, env.volumeId, channelId.slice(0, 2), channelId) + '.metadata.ndjson';
};

var mkTempPath = function (env, channelId) {
    return mkPath(env, channelId) + '.temp';
};

var mkOffsetPath = function (env, channelId) {
    return mkPath(env, channelId) + '.offset';
};

var mkPlaceholderPath = function (env, channelId) {
    return mkPath(env, channelId) + '.placeholder';
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

var isChannelAvailable = function (env, channelName, cb) {
    // construct the path
    var filepath = mkPath(env, channelName);
    var metapath = mkMetadataPath(env, channelName);

// (ansuz) I'm uncertain whether this task should be unordered or ordered.
// there's a round trip to the client (and possibly the user) before they decide
// to act on the information of whether there is already content present in this channel.
// so it's practically impossible to avoid race conditions where someone else creates
// some content before you.
// if that's the case, it's basically impossible that you'd generate the same signing key,
// and thus historykeeper should reject the signed messages of whoever loses the race.
// thus 'unordered' seems appropriate.
    env.schedule.unordered(channelName, function (next) {
        var done = Util.once(Util.mkAsync(Util.both(cb, next)));
        var exists = false;
        var handler = function (err, _exists) {
            if (err) { return void done(err); }
            exists = exists || _exists;
        };

        nThen(function (w) {
            channelExists(filepath, w(handler));
            channelExists(metapath, w(handler));
        }).nThen(function () {
            done(void 0, exists);
        });
    });
};

var isChannelArchived = function (env, channelName, cb) {
    // construct the path
    var filepath = mkArchivePath(env, channelName);
    var metapath = mkArchiveMetadataPath(env, channelName);

// as with the method above, somebody might remove, restore, or overwrite an archive
// in the time that it takes to answer this query and to execute whatever follows.
// since it's impossible to win the race every time let's just make this 'unordered'

    env.schedule.unordered(channelName, function (next) {
        var done = Util.once(Util.mkAsync(Util.both(cb, next)));
        var exists = false;
        var handler = function (err, _exists) {
            if (err) { return void done(err); }
            exists = exists || _exists;
        };

        nThen(function (w) {
            channelExists(filepath, w(handler));
            channelExists(metapath, w(handler));
        }).nThen(function () {
            done(void 0, exists);
        });
    });
};

var addPlaceholder = function (env, channelId, reason, cb) {
    if (!reason) { return cb(); }
    var path = mkPlaceholderPath(env, channelId);
    var s_data = typeof(reason) === "string" ? reason : `${reason.code}:${reason.txt}`;
    Fs.writeFile(path, s_data, cb);
};
var clearPlaceholder = function (env, channelId, cb) {
    var path = mkPlaceholderPath(env, channelId);
    Fs.unlink(path, cb);
};
var readPlaceholder = function (env, channelId, cb) {
    var path = mkPlaceholderPath(env, channelId);
    Fs.readFile(path, function (err, content) {
        if (err) { return void cb(); }
        cb(content.toString('utf8'));
    });
};


const destroyStream = function (stream) {
    if (!stream) { return; }
    try {
        stream.close();
        if (stream.closed && stream.fd === null) { return; }
    } catch (err) {
        console.error(err);
    }
    setTimeout(function () {
        try { stream.destroy(); } catch (err) { console.error(err); }
    }, STREAM_DESTROY_TIMEOUT);
};

/*  createIdleStreamCollector

Takes a stream and returns a function to asynchronously close that stream.
Successive calls to the function will be ignored.

If the function is not called for a period of STREAM_CLOSE_TIMEOUT it will
be called automatically unless its `keepAlive` method has been invoked
in the meantime. Used to prevent file descriptor leaks in the case of
abandoned streams while closing streams which are being read very very
slowly.

XXX inform the stream consumer when it has been closed prematurely
by calling back with a TIMEOUT error or something

*/
const createIdleStreamCollector = function (stream) {
    // create a function to close the stream which takes no arguments
    // and will do nothing after being called the first time
    var collector = Util.once(Util.mkAsync(Util.bake(destroyStream, [stream])));

    // create a second function which will execute the first function after a delay
    // calling this function will reset the delay and thus keep the stream 'alive'
    collector.keepAlive = Util.throttle(collector, STREAM_CLOSE_TIMEOUT);
    collector.keepAlive();
    return collector;
};

// readMessagesBin asynchronously iterates over the messages in a channel log
// the handler for each message must call back to read more, which should mean
// that this function has a lower memory profile than our classic method
// of reading logs line by line.
// it also allows the handler to abort reading at any time
const readMessagesBin = (env, id, start, msgHandler, cb) => {
    const stream = Fs.createReadStream(mkPath(env, id), { start: start });
    const collector = createIdleStreamCollector(stream);
    const handleMessageAndKeepStreamAlive = Util.both(msgHandler, collector.keepAlive);
    const done = Util.both((err) => {
        if (err && err.code === 'ENOENT') {
            // If the channel doesn't exists, look for a placeholder.
            // If a placeholder exists, call back with its content in addition to the original error
            return readPlaceholder(env, id, (content) => {
                cb(err, content);
            });
        }
        cb(err);
    }, collector);
    return void readFileBin(stream, handleMessageAndKeepStreamAlive, done, {
        offset: start,
    });
};

// reads classic metadata from a channel log and aborts
// returns undefined if the first message was not an object (not an array)
var getMetadataAtPath = function (Env, path, _cb) {
    const stream = Fs.createReadStream(path, { start: 0 });
    const collector = createIdleStreamCollector(stream);
    var cb = Util.once(Util.mkAsync(Util.both(_cb, collector)));
    var i = 0;

    return readFileBin(stream, function (msgObj, readMore, abort) {
        collector.keepAlive();
        const line = msgObj.buff.toString('utf8');

        if (!line) {
            return readMore();
        }

        // metadata should always be on the first line or not exist in the channel at all
        if (i++ > 0) {
            //console.log("aborting");
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
        readMore(); // eslint-disable-line no-unreachable
    }, function (err) {
        cb(err);
    });
};

var closeChannel = function (env, channelName, cb) {
    if (!env.channels[channelName]) { return void cb(); }
    try {
        if (typeof(Util.find(env, [ 'channels', channelName, 'writeStream', 'close'])) === 'function') {
            var stream = env.channels[channelName].writeStream;
            destroyStream(stream, channelName);
        }
        delete env.channels[channelName];
        cb();
    } catch (err) {
        cb(err);
    }
};

var closeInactiveChannels = function (env, schedule, active) {
    Object.keys(env.channels).forEach(channelName => {
        if (!active.includes(channelName)) {
            schedule.ordered(channelName, function (next) {
                closeChannel(env, channelName, next);
            });
        }
    });
};

var clearOffset = function (env, channelId, cb) {
    var path = mkOffsetPath(env, channelId);
    // we should always be able to recover from invalid offsets, so failure to delete them
    // is not catastrophic. Anything calling this function can optionally ignore errors it might report
    Fs.unlink(path, cb);
};

var writeOffset = function (env, channelId, data, cb) {
    var path = mkOffsetPath(env, channelId);
    var s_data;
    try {
        s_data = JSON.stringify(data);
    } catch (err) {
        return void cb(err);
    }
    Fs.writeFile(path, s_data, cb);
};

var getOffset = function (env, channelId, cb) {
    var path = mkOffsetPath(env, channelId);
    Fs.readFile(path, function (err, content) {
        if (err) { return void cb(err); }
        try {
            var json = JSON.parse(content);
            cb(void 0, json);
        } catch (err2) {
            cb(err2);
        }
    });
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
        clearOffset(env, channelId, function () {});
    });
};

/*  readMessages is our classic method of reading messages from the disk
    notably doesn't provide a means of aborting if you finish early.
    Internally it uses readFileBin: to avoid duplicating code and to use less memory
*/
var readMessages = function (path, msgHandler, _cb) {
    var stream = Fs.createReadStream(path, { start: 0});
    var collector = createIdleStreamCollector(stream);
    var cb = Util.once(Util.mkAsync(Util.both(_cb, collector)));

    return readFileBin(stream, function (msgObj, readMore) {
        collector.keepAlive();
        msgHandler(msgObj.buff.toString('utf8'));
        setTimeout(readMore);
    }, function (err) {
        cb(err);
    });
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
var getDedicatedMetadata = function (env, channelId, handler, _cb) {
    var metadataPath = mkMetadataPath(env, channelId);
    var stream = Fs.createReadStream(metadataPath, {start: 0});

    const collector = createIdleStreamCollector(stream);
    var cb = Util.both(_cb, collector);

    readFileBin(stream, function (msgObj, readMore) {
        collector.keepAlive();
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
        if (!err || err.code === 'ENOENT') {
            if (err && err.code === 'ENOENT') {
                return readPlaceholder(env, channelId, (content) => {
                    cb(content);
                });
            }
            return void cb();
        }
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

    let requiresChannel = true;
    let all = [];
    nThen(function (w) {
        let first = true;
        getDedicatedMetadata(env, channelId, (err, line) => {
            if (first && !err) {
                if (!Array.isArray(line)) {
                    requiresChannel = false;
                }
                first = false;
            }
            all.push({err, line});
        }, w(function (err) {
            if (err) {
                // stream errors?
                w.abort();
                return void cb(err);
            }
        }));
    }).nThen(function (w) {
        if (!requiresChannel) { return; }
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
        all.forEach(({err, line}) => {
            handler(err, line);
        });
        cb();
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
var checkPath = function (path, callback) { // callback's second arg is never used...
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
        clearOffset(env, channelName, w());
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
                if (err.code === "ENOENT") { return; }
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

var _getStats = function (metadataPath, filePath, channel, cb, isLonelyMetadata) {
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
            return void cb(channelErr);
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
            return void cb('NO_DATA');
        }
        cb(void 0, data);
    });
};

var getStats = function (env, channelName, cb) {
    var metadataPath = mkMetadataPath(env, channelName);
    var filePath = mkPath(env, channelName);
    _getStats(metadataPath, filePath, channelName, cb);
};

// TODO use ../plan.js for a smaller memory footprint
var listChannels = function (root, handler, cb, fast) {

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
    }).nThen(function (waitFor) {
        // search inside the nested directories
        // stream it so you don't put unnecessary data in memory
        //var wait = w();
        var n = nThen;
        dirList.forEach(function (dir) {
            // Handle one directory at a time to save some memory
            n = n(function (w) {
                // do twenty things at a time
                var sema = Semaphore.create(20);
                var nestedDirPath = Path.join(root, dir);
                Fs.readdir(nestedDirPath, w(function (err, list) {
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
                        if (!/^[0-9a-fA-F]{32,33}\.ndjson$/.test(item)) {
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

                        var channel = metadataName.replace(/\.metadata.ndjson$/, '');
                        if ([32, 33, 34, 44].indexOf(channel.length) === -1) { return; }

                        // otherwise throw it on the pile
                        sema.take(function (give) {
                            var next = w(give());

                            if (fast) {
                                return void handler(void 0, { channel: channel, }, next);
                            }

                            var filePath = Path.join(nestedDirPath, channelName);
                            var metadataPath = Path.join(nestedDirPath, metadataName);
                            return void _getStats(metadataPath, filePath, channel, function (err, data) {
                                if (err) {
                                    return void handler(err, void 0, next);
                                }
                                handler(void 0, data, next);
                            }, isLonelyMetadata);
                        });
                    });
                }));
            }).nThen;
        });
        n(waitFor());
    }).nThen(function () {
        cb();
    });
};

// move a channel's log file from its current location
// to an equivalent location in the cold storage directory
var archiveChannel = function (env, channelName, reason, cb) {
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
        clearOffset(env, channelName, w());
    }).nThen(function (w) {
        if (!reason) { return; }
        addPlaceholder(env, channelName, reason, w());
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

    var ENOENT = false;
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
            if (err && err.code === 'ENOENT') {
                ENOENT = true;
                return;
            }
            if (err) {
                w.abort();
                return void CB(err);
            }
        }));
    }).nThen(function (w) {
        clearPlaceholder(env, channelName, w());
    }).nThen(function (w) {
        var archiveMetadataPath = mkArchiveMetadataPath(env, channelName);
        // TODO validate that it's ok to move metadata non-atomically

        // restore the metadata log
        Fse.move(archiveMetadataPath, metadataPath, w(function (err) {
            // if there's nothing to move, you're done.
            if (err && err.code === 'ENOENT') {
                if (ENOENT) {
                    // nothing was deleted? the client probably wants to know about that.
                    return void cb("ENOENT");
                }
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

var getChannel = function (env, id, _callback) {
    var cb = Util.once(Util.mkAsync(_callback));

    // if the channel is in memory
    if (env.channels[id]) {
        var chan = env.channels[id];
        // delay its pending close a little longer
        chan.delayClose();
        // and return its writeStream
        return void cb(void 0, chan);
    }

    // otherwise you need to open it or wait until its pending open completes
    return void env.batchGetChannel(id, cb, function (done) {
        var path = mkPath(env, id);
        var channel = {
            onError: [],
        };
        nThen(function (w) {
            // create the path to the file if it doesn't exist
            checkPath(path, w(function (err) {
                if (err) {
                    w.abort();
                    return void done(err);
                }
            }));
        }).nThen(function (w) {
            var stream = channel.writeStream = Fs.createWriteStream(path, { flags: 'a' });
            stream.on('open', w());
            stream.on('error', function (err) {
                w.abort();
                // this might be called after this nThen block closes.
                channel.onError.forEach(function (handler) {
                    handler(err);
                });
            });
        }).nThen(function () {
            channel.delayClose = Util.throttle(Util.once(function () {
                delete env.channels[id];
                destroyStream(channel.writeStream, path);
                //console.log("closing writestream");
            }), CHANNEL_WRITE_WINDOW);
            channel.delayClose();
            env.channels[id] = channel;
            done(void 0, channel);
        });
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
            complete();
// It seems like this reintroduces a file descriptor leak
            if (chan.onError.length) { return; }
            if (chan.delayClose && chan.delayClose.clear) {
                chan.delayClose.clear();
                destroyStream(chan.writeStream, chanName);
                delete env.channels[chanName];
            }
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
    var errorState = false;
    var path = mkPath(env, chanName);
    readMessages(path, function (msg) {
        if (!msg || errorState) { return; }
        try {
            handler(msg);
        } catch (e) {
            errorState = true;
            return void cb(e);
        }
    }, function (err) {
        if (err) {
            errorState = true;
            return void cb(err);
        }
        cb();
    });
};

var filterMessages = function (env, channelName, check, filterHandler, _cb) {
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
        destroyStream(tempStream);
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
        clearOffset(env, channelName, w());
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
        // If we want to delete a signle line of the file, make sure this pad allows it
        if (typeof(check) !== "function") { return; }
        if (!metadataReference.meta || !check(metadataReference.meta)) {
            w.abort();
            return void cb("EFORBIDDEN");
        }
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
            if (ABORT) { return void abort(); }
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

            var remove = function () { readMore(); };
            var preserve = function () {
                tempStream.write(s_msg + '\n', function () {
                    readMore();
                });
            };
            var preserveRemaining = function () { retain = true; };

            filterHandler(msg, msgHash, abort, remove, preserve, preserveRemaining);
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
var deleteChannelLine = function (env, channelName, hash, checkRights, _cb) {
    var check = function (meta) { return Boolean(meta.deleteLines); };
    var handler = function (msg, msgHash, abort, remove, preserve, preserveRemaining) {
        if (msgHash === hash) {
            if (typeof(checkRights) === "function" && !checkRights(msg[4])) {
                // Not allowed: abort
                return void abort();
            }
            // Line found: remove it and preserve all remaining lines
            preserveRemaining();
            return void remove();
        }
        // Continue until we find the correct hash
        preserve();
    };
    filterMessages(env, channelName, check, handler, _cb);
};
var trimChannel = function (env, channelName, hash, _cb) {
    var handler = function (msg, msgHash, abort, remove, preserve, preserveRemaining) {
        if (msgHash === hash) {
            // Everything from this point on should be retained
            preserveRemaining();
            return void preserve();
        }
        // Remove until we find our hash
        remove();
    };
    filterMessages(env, channelName, null, handler, _cb);
};

module.exports.create = function (conf, _cb) {
    var cb = Util.once(Util.mkAsync(_cb));

    var env = {
        root: Path.resolve(conf.filePath || './datastore'),
        archiveRoot: Path.resolve(conf.archivePath || './data/archive'),
        // supply a volumeId if you want a store to archive channels to and from
        // to its own subpath within the archive directory
        volumeId: conf.volumeId || 'datastore',
        channels: { },
        batchGetChannel: BatchRead('store_batch_channel'),
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
                w.abort();
                return void cb(err);
            }
        }));
        // make sure the cold storage directory exists
        Fse.mkdirp(Path.join(env.archiveRoot, env.volumeId), PERMISSIVE, w(function (err) {
            if (err && err.code !== 'EEXIST') {
                w.abort();
                return void cb(err);
            }
        }));
    }).nThen(function () {
        cb(void 0, {
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

            getWeakLock: function (channelName, _cb) {
                var cb = Util.once(Util.mkAsync(_cb));
                schedule.unordered(channelName, cb);
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
            deleteChannelLine: function (channelName, hash, checkRights, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                schedule.blocking(channelName, function (next) {
                    deleteChannelLine(env, channelName, hash, checkRights, Util.both(cb, next));
                });
            },

            // check if a channel exists in the database
            isChannelAvailable: function (channelName, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                isChannelAvailable(env, channelName, cb);
            },
            // check if a channel exists in the archive
            isChannelArchived: function (channelName, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                isChannelArchived(env, channelName, cb);
            },
            // move a channel from the database to the archive, along with its metadata
            archiveChannel: function (channelName, reason, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
// again, the semantics around archiving and appending are really muddy.
// so I'm calling this 'unordered' again
                schedule.unordered(channelName, function (next) {
                    archiveChannel(env, channelName, reason, Util.both(cb, next));
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

        // OFFSETS
// these exist strictly as an optimization
// you can always remove them without data loss
            clearOffset: function (channelName, _cb) {
                var cb = Util.once(Util.mkAsync(_cb));
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                clearOffset(env, channelName, cb);
            },
            writeOffset: function (channelName, data, _cb) {
                var cb = Util.once(Util.mkAsync(_cb));
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                writeOffset(env, channelName, data, cb);
            },
            getOffset: function (channelName, _cb) {
                var cb = Util.once(Util.mkAsync(_cb));
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                getOffset(env, channelName, cb);
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
            listChannels: function (handler, cb, fastMode) {
                listChannels(env.root, handler, cb, fastMode);
            },
            listArchivedChannels: function (handler, cb, fastMode) {
                listChannels(Path.join(env.archiveRoot, 'datastore'), handler, cb, fastMode);
            },

            getChannelStats: function (channelName, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
                getStats(env, channelName, cb);
            },
            getChannelSize: function (channelName, cb) {
                if (!isValidChannelId(channelName)) { return void cb(new Error('EINVAL')); }
// this method should be really fast and it probably doesn't matter much
// if we get the size slightly before or after somebody writes a few hundred bytes to it.
                schedule.ordered(channelName, function (next) {
                    channelBytes(env, channelName, Util.both(cb, next));
                });
            },
            getPlaceholder: function (channelName, cb) {
                readPlaceholder(env, channelName, cb);
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
            closeInactiveChannels: function (active) {
                closeInactiveChannels(env, schedule, active);
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
};
