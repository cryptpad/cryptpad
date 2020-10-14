/*jshint esversion: 6 */
/* globals process */
const nThen = require("nthen");
const getFolderSize = require("get-folder-size");
const Util = require("../common-util");
const Ulimit = require("ulimit");
const Decrees = require("../decrees");

var Fs = require("fs");

var Admin = module.exports;

var getFileDescriptorCount = function (Env, server, cb) {
    Fs.readdir('/proc/self/fd', function(err, list) {
        if (err) { return void cb(err); }
        cb(void 0, list.length);
    });
};

var getFileDescriptorLimit = function (env, server, cb) {
    Ulimit(cb);
};

var getCacheStats = function (env, server, cb) {
    var metaSize = 0;
    var channelSize = 0;
    var metaCount = 0;
    var channelCount = 0;

    try {
        var meta = env.metadata_cache;
        for (var x in meta) {
            if (meta.hasOwnProperty(x)) {
                metaCount++;
                metaSize += JSON.stringify(meta[x]).length;
            }
        }

        var channels = env.channel_cache;
        for (var y in channels) {
            if (channels.hasOwnProperty(y)) {
                channelCount++;
                channelSize += JSON.stringify(channels[y]).length;
            }
        }
    } catch (err) {
        return void cb(err && err.message);
    }

    cb(void 0, {
        metadata: metaCount,
        metaSize: metaSize,
        channel: channelCount,
        channelSize: channelSize,
        memoryUsage: process.memoryUsage(),
    });
};

var getActiveSessions = function (Env, Server, cb) {
    var stats = Server.getSessionStats();
    cb(void 0, [
        stats.total,
        stats.unique
    ]);
};

var shutdown = function (Env, Server, cb) {
    if (true) {
        return void cb('E_NOT_IMPLEMENTED');
    }

    // disconnect all users and reject new connections
    Server.shutdown();

    // stop all intervals that may be running
    Object.keys(Env.intervals).forEach(function (name) {
        clearInterval(Env.intervals[name]);
    });

    // set a flag to prevent incoming database writes
    // wait until all pending writes are complete
    // then process.exit(0);
    // and allow system functionality to restart the server
};

var getRegisteredUsers = function (Env, Server, cb) {
    Env.batchRegisteredUsers('', cb, function (done) {
        var dir = Env.paths.pin;
        var folders;
        var users = 0;
        nThen(function (waitFor) {
            Fs.readdir(dir, waitFor(function (err, list) {
                if (err) {
                    waitFor.abort();
                    return void done(err);
                }
                folders = list;
            }));
        }).nThen(function (waitFor) {
            folders.forEach(function (f) {
                var dir = Env.paths.pin + '/' + f;
                Fs.readdir(dir, waitFor(function (err, list) {
                    if (err) { return; }
                    users += list.length;
                }));
            });
        }).nThen(function () {
            done(void 0, users);
        });
    });
};

var getDiskUsage = function (Env, Server, cb) {
    Env.batchDiskUsage('', cb, function (done) {
        var data = {};
        nThen(function (waitFor) {
            getFolderSize('./', waitFor(function(err, info) {
                data.total = info;
            }));
            getFolderSize(Env.paths.pin, waitFor(function(err, info) {
                data.pin = info;
            }));
            getFolderSize(Env.paths.blob, waitFor(function(err, info) {
                data.blob = info;
            }));
            getFolderSize(Env.paths.staging, waitFor(function(err, info) {
                data.blobstage = info;
            }));
            getFolderSize(Env.paths.block, waitFor(function(err, info) {
                data.block = info;
            }));
            getFolderSize(Env.paths.data, waitFor(function(err, info) {
                data.datastore = info;
            }));
        }).nThen(function () {
            done(void 0, data);
        });
    });
};

var getActiveChannelCount = function (Env, Server, cb) {
    cb(void 0, Server.getActiveChannelCount());
};

var flushCache = function (Env, Server,  cb) {
    Env.flushCache();
    cb(void 0, true);
};

// CryptPad_AsyncStore.rpc.send('ADMIN', ['ARCHIVE_DOCUMENT', documentID], console.log)
var archiveDocument = function (Env, Server, cb, data) {
    var id = Array.isArray(data) && data[1];
    if (typeof(id) !== 'string' || id.length < 32) { return void cb("EINVAL"); }

    switch (id.length) {
        case 32:
        // TODO disconnect users from active sessions
            return void Env.msgStore.archiveChannel(id, cb);
        case 48:
            return void Env.blobStore.archive.blob(id, cb);
        default:
            return void cb("INVALID_ID_LENGTH");
    }

    // archival for blob proofs isn't automated, but evict-inactive.js will
    // clean up orpaned blob proofs
    // Env.blobStore.archive.proof(userSafeKey, blobId, cb)
};

var restoreArchivedDocument = function (Env, Server, cb) {
    // Env.msgStore.restoreArchivedChannel(channelName, cb)
    // Env.blobStore.restore.blob(blobId, cb)
    // Env.blobStore.restore.proof(userSafekey, blobId, cb)

    cb("NOT_IMPLEMENTED");
};

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['RESTRICT_REGISTRATION', [true]]], console.log)
var adminDecree = function (Env, Server, cb, data, unsafeKey) {
    var value = data[1];
    if (!Array.isArray(value)) { return void cb('INVALID_DECREE'); }

    var command = value[0];
    var args = value[1];

/*

The admin should have sent a command to be run:

the server adds two pieces of information to the supplied decree:

* the unsafeKey of the admin who uploaded it
* the current time

1. test the command to see if it's valid and will result in a change
2. if so, apply it and write it to the log for persistence
3. respond to the admin with an error or nothing

*/

    var decree = [command, args, unsafeKey, +new Date()];
    var changed;
    try {
        changed = Decrees.handleCommand(Env, decree) || false;
    } catch (err) {
        return void cb(err);
    }

    if (!changed) { return void cb(); }
    Env.Log.info('ADMIN_DECREE', decree);
    Decrees.write(Env, decree, cb);
};

// CryptPad_AsyncStore.rpc.send('ADMIN', ['INSTANCE_STATUS], console.log)
var instanceStatus = function (Env, Server, cb) {
    cb(void 0, {
        restrictRegistration: Env.restrictRegistration,
        launchTime: Env.launchTime,
        currentTime: +new Date(),

        inactiveTime: Env.inactiveTime,
        accountRetentionTime: Env.accountRetentionTime,
        archiveRetentionTime: Env.archiveRetentionTime,

        defaultStorageLimit: Env.defaultStorageLimit,

        lastEviction: Env.lastEviction,
        // FIXME eviction is run in a worker and this isn't returned
        //knownActiveAccounts: Env.knownActiveAccounts,
        disableIntegratedEviction: Env.disableIntegratedEviction,
        disableIntegratedTasks: Env.disableIntegratedTasks,

        maxUploadSize: Env.maxUploadSize,
        premiumUploadSize: Env.premiumUploadSize,
    });
};

// CryptPad_AsyncStore.rpc.send('ADMIN', ['GET_LIMITS'], console.log)
var getLimits = function (Env, Server, cb) {
    cb(void 0, Env.limits);
};

var commands = {
    ACTIVE_SESSIONS: getActiveSessions,
    ACTIVE_PADS: getActiveChannelCount,
    REGISTERED_USERS: getRegisteredUsers,
    DISK_USAGE: getDiskUsage,
    FLUSH_CACHE: flushCache,
    SHUTDOWN: shutdown,
    GET_FILE_DESCRIPTOR_COUNT: getFileDescriptorCount,
    GET_FILE_DESCRIPTOR_LIMIT: getFileDescriptorLimit,
    GET_CACHE_STATS: getCacheStats,

    ARCHIVE_DOCUMENT: archiveDocument,
    RESTORE_ARCHIVED_DOCUMENT: restoreArchivedDocument,

    ADMIN_DECREE: adminDecree,
    INSTANCE_STATUS: instanceStatus,
    GET_LIMITS: getLimits,
};

Admin.command = function (Env, safeKey, data, _cb, Server) {
    var cb = Util.once(Util.mkAsync(_cb));

    var admins = Env.admins;

    var unsafeKey = Util.unescapeKeyCharacters(safeKey);
    if (admins.indexOf(unsafeKey) === -1) {
        return void cb("FORBIDDEN");
    }

    var command = commands[data[0]];

    if (typeof(command) === 'function') {
        return void command(Env, Server, cb, data, unsafeKey);
    }

    return void cb('UNHANDLED_ADMIN_COMMAND');
};

