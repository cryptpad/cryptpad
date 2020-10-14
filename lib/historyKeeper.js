/* jshint esversion: 6 */

const nThen = require('nthen');
const RPC = require("./rpc");
const HK = require("./hk-util.js");
const Store = require("./storage/file");
const BlobStore = require("./storage/blob");
const Workers = require("./workers/index");
const Core = require("./commands/core");

module.exports.create = function (Env, cb) {
    const Log = Env.Log;
    Log.silly('HK_LOADING', 'LOADING HISTORY_KEEPER MODULE');

    Env.historyKeeper = {
        metadata_cache: Env.metadata_cache,
        channel_cache: Env.channel_cache,

        id: Env.id,

        channelMessage: function (Server, channel, msgStruct) {
            // netflux-server emits 'channelMessage' events whenever someone broadcasts to a channel
            // historyKeeper stores these messages if the channel id indicates that they are
            // a channel type with permanent history
            HK.onChannelMessage(Env, Server, channel, msgStruct);
        },
        channelClose: function (channelName) {
            // netflux-server emits 'channelClose' events whenever everyone leaves a channel
            // we drop cached metadata and indexes at the same time
            HK.dropChannel(Env, channelName);
        },
        channelOpen: function (Server, channelName, userId, wait) {
            Env.channel_cache[channelName] = Env.channel_cache[channelName] || {};

            var sendHKJoinMessage = function () {
                Server.send(userId, [
                    0,
                    Env.id,
                    'JOIN',
                    channelName
                ]);
            };

            // a little backwards compatibility in case you don't have the latest server
            // allow lists won't work unless you update, though
            if (typeof(wait) !== 'function') { return void sendHKJoinMessage(); }

            var next = wait();
            var cb = function (err, info) {
                next(err, info, sendHKJoinMessage);
            };

            // only conventional channels can be restricted
            if ((channelName || "").length !== HK.STANDARD_CHANNEL_LENGTH) {
                return void cb();
            }

            // gets and caches the metadata...
            HK.getMetadata(Env, channelName, function (err, metadata) {
                if (err) {
                    Log.error('HK_METADATA_ERR', {
                        channel: channelName,
                        error: err,
                    });
                }
                if (!metadata || (metadata && !metadata.restricted)) {
                    // the channel doesn't have metadata, or it does and it's not restricted
                    // either way, let them join.
                    return void cb();
                }

                // this channel is restricted. verify that the user in question is in the allow list

                // construct a definitive list (owners + allowed)
                var allowed = HK.listAllowedUsers(metadata);
                // and get the list of keys for which this user has already authenticated
                var session = HK.getNetfluxSession(Env, userId);

                if (HK.isUserSessionAllowed(allowed, session)) {
                    return void cb();
                }

                // otherwise they're not allowed.
                // respond with a special error that includes the list of keys
                // which would be allowed...
                // FIXME RESTRICT bonus points if you hash the keys to limit data exposure
                cb("ERESTRICTED", allowed);
            });
        },
        sessionClose: function (userId, reason) {
            HK.closeNetfluxSession(Env, userId);
            if (['BAD_MESSAGE', 'SEND_MESSAGE_FAIL_2'].indexOf(reason) !== -1) {
                if (reason && reason.code === 'ECONNRESET') { return; }
                return void Log.error('SESSION_CLOSE_WITH_ERROR', {
                    userId: userId,
                    reason: reason,
                });
            }

            if (['SOCKET_CLOSED', 'SOCKET_ERROR'].indexOf(reason)) { return; }
            Log.verbose('SESSION_CLOSE_ROUTINE', {
                userId: userId,
                reason: reason,
            });
        },
        directMessage: function (Server, seq, userId, json) {
            // netflux-server allows you to register an id with a handler
            // this handler is invoked every time someone sends a message to that id
            HK.onDirectMessage(Env, Server, seq, userId, json);
        },
    };

    Log.verbose('HK_ID', 'History keeper ID: ' + Env.id);

    var pinPath = Env.paths.pin;

    nThen(function (w) {
        // create a pin store
        Store.create({
            filePath: pinPath,
        }, w(function (err, s) {
            if (err) { throw err; }
            Env.pinStore = s;
        }));

        // create a channel store
        Store.create({
            filePath: Env.paths.data,
            archivepath: Env.paths.archive,
        }, w(function (err, _store) {
            if (err) { throw err; }
            Env.msgStore = _store; // API used by rpc
            Env.store = _store; // API used by historyKeeper
        }));

        // create a blob store
        BlobStore.create({
            blobPath: Env.paths.blob,
            blobStagingPath: Env.paths.staging,
            archivePath: Env.paths.archive,
            getSession: function (safeKey) {
                return Core.getSession(Env.Sessions, safeKey);
            },
        }, w(function (err, blob) {
            if (err) { throw new Error(err); }
            Env.blobStore = blob;
        }));
    }).nThen(function (w) {
        Workers.initialize(Env, {
            blobPath: Env.paths.blob,
            blobStagingPath: Env.paths.staging,
            taskPath: Env.paths.task,
            pinPath: Env.paths.pin,
            filePath: Env.paths.data,
            archivePath: Env.paths.archive,

            inactiveTime: Env.inactiveTime,
            archiveRetentionTime: Env.archiveRetentionTime,
            accountRetentionTime: Env.accountRetentionTime,

            maxWorkers: Env.maxWorkers,
        }, w(function (err) {
            if (err) {
                throw new Error(err);
            }
        }));
    }).nThen(function () {
        var tasks_running;
        Env.intervals.taskExpiration = setInterval(function () {
            if (Env.disableIntegratedTasks) { return; }
            if (tasks_running) { return; }
            tasks_running = true;
            Env.runTasks(function (err) {
                if (err) {
                    Log.error('TASK_RUNNER_ERR', err);
                }
                tasks_running = false;
            });
        }, 1000 * 60 * 5); // run every five minutes
    }).nThen(function () {
        const ONE_DAY = 24 * 1000 * 60 * 60;
        // setting the time of the last eviction to "now"
        // effectively makes it so that we'll start evicting after the server
        // has been up for at least one day

        var active = false;
        Env.intervals.eviction = setInterval(function () {
            if (Env.disableIntegratedEviction) { return; }
            if (active) { return; }
            var now = +new Date();
            // evict inactive data once per day
            if ((now - ONE_DAY) < Env.lastEviction) { return; }
            active = true;
            Env.evictInactive(function (err) {
                if (err) {
                    // NO_INACTIVE_TIME
                    Log.error('EVICT_INACTIVE_MAIN_ERROR', err);
                }
                active = false;
                Env.lastEviction = now;
            });
        }, 60 * 1000);
    }).nThen(function () {

        RPC.create(Env, function (err, _rpc) {
            if (err) { throw err; }

            Env.rpc = _rpc;
            cb(void 0, Env.historyKeeper);
        });
    });
};
