/*jshint esversion: 6 */
const nThen = require("nthen");
const getFolderSize = require("get-folder-size");
const Util = require("../common-util");
const Ulimit = require("ulimit");

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


// CryptPad_AsyncStore.rpc.send('ADMIN', ['SET_DEFAULT_STORAGE_LIMIT', 1024 * 1024 * 1024 /* 1GB */], console.log)
var setDefaultStorageLimit = function (Env, Server, cb, data) {
    var value = Array.isArray(data) && data[1];
    if (typeof(value) !== 'number' || value <= 0) { return void cb('EINVAL'); }
    var previous = Env.defaultStorageLimit;
    var change = {
        previous: previous,
        current: value,
    };

    Env.defaultStorageLimit = value;
    Env.Log.info('DEFAULT_STORAGE_LIMIT_UPDATE', change);

    cb(void 0, change);
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
    SET_DEFAULT_STORAGE_LIMIT: setDefaultStorageLimit,
};

Admin.command = function (Env, safeKey, data, _cb, Server) {
    var cb = Util.once(Util.mkAsync(_cb));

    var admins = Env.admins;
    //var unsafeKey = Util.unescapeKeyCharacters(safeKey);
    if (admins.indexOf(safeKey) === -1) {
        return void cb("FORBIDDEN");
    }

    var command = commands[data[0]];

    if (typeof(command) === 'function') {
        return void command(Env, Server, cb, data);
    }

    return void cb('UNHANDLED_ADMIN_COMMAND');
};


