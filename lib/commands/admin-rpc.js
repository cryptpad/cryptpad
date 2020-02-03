/*jshint esversion: 6 */
const BatchRead = require("../batch-read");
const nThen = require("nthen");
const getFolderSize = require("get-folder-size");
var Fs = require("fs");

var Admin = module.exports;

var getActiveSessions = function (Env, Server, cb) {
    var stats = Server.getSessionStats();
    cb(void 0, [
        stats.total,
        stats.unique
    ]);
};

var shutdown = function (Env, Server, cb) {
    return void cb('E_NOT_IMPLEMENTED');
    //clearInterval(Env.sessionExpirationInterval);
    // XXX set a flag to prevent incoming database writes
    // XXX disconnect all users and reject new connections
    // XXX wait until all pending writes are complete
    // then process.exit(0);
    // and allow system functionality to restart the server
};

const batchRegisteredUsers = BatchRead("GET_REGISTERED_USERS");
var getRegisteredUsers = function (Env, cb) {
    batchRegisteredUsers('', cb, function (done) {
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

const batchDiskUsage = BatchRead("GET_DISK_USAGE");
var getDiskUsage = function (Env, cb) {
    batchDiskUsage('', cb, function (done) {
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

Admin.command = function (Env, Server, publicKey, data, cb) {
    var admins = Env.admins;
    if (admins.indexOf(publicKey) === -1) {
        return void cb("FORBIDDEN");
    }

    // Handle commands here
    switch (data[0]) {
        case 'ACTIVE_SESSIONS':
            return getActiveSessions(Env, Server, cb);
        case 'ACTIVE_PADS':
            return cb(void 0, Server.getActiveChannelCount());
        case 'REGISTERED_USERS':
            return getRegisteredUsers(Env, cb);
        case 'DISK_USAGE':
            return getDiskUsage(Env, cb);
        case 'FLUSH_CACHE':
            Env.flushCache();
            return cb(void 0, true);
        case 'SHUTDOWN':
            return shutdown(Env, Server, cb);
        default:
            return cb('UNHANDLED_ADMIN_COMMAND');
    }
};


