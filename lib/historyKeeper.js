// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

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

        channelMessage: function (Server, channel, msgStruct, cb) {
            // netflux-server emits 'channelMessage' events whenever someone broadcasts to a channel
            // historyKeeper stores these messages if the channel id indicates that they are
            // a channel type with permanent history
            HK.onChannelMessage(Env, Server, channel, msgStruct, cb);
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

                if (metadata && metadata.selfdestruct && metadata.selfdestruct !== Env.id) {
                    HK.expireChannel(Env, channelName);
                    return void cb('ESELFDESTRUCT');
                }

                if (Env.selfDestructTo && Env.selfDestructTo[channelName]) {
                    clearTimeout(Env.selfDestructTo[channelName]);
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

                // If the channel is restricted, send the history keeper ID so that they
                // can try to authenticate
                allowed.unshift(Env.id);

                // otherwise they're not allowed.
                // respond with a special error that includes the list of keys
                // which would be allowed...
                // FIXME RESTRICT bonus points if you hash the keys to limit data exposure
                cb("ERESTRICTED", allowed);
            });
        },
        sessionClose: function (userId, reason) {
            HK.closeNetfluxSession(Env, userId);
            if (Env.logIP && !['SOCKET_CLOSED', 'INACTIVITY'].includes(reason)) {
                return void Log.info('USER_DISCONNECTED_ERROR', {
                    userId: userId,
                    reason: reason
                });
            }
            if (['BAD_MESSAGE', 'SEND_MESSAGE_FAIL_2'].indexOf(reason) !== -1) {
                if (reason && reason.code === 'ECONNRESET') { return; }
                return void Log.error('SESSION_CLOSE_WITH_ERROR', {
                    userId: userId,
                    reason: reason,
                });
            }

            if (['SOCKET_CLOSED', 'SOCKET_ERROR'].includes(reason)) { return; }
            Log.verbose('SESSION_CLOSE_ROUTINE', {
                userId: userId,
                reason: reason,
            });
        },
        sessionOpen: function (userId, ip) {
            if (!Env.logIP) { return; }
            Log.info('USER_CONNECTION', {
                userId: userId,
                ip: ip,
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
            archivePath: Env.paths.archive,
            // indicate that archives should be put in a 'pins' archvie folder
            volumeId: 'pins',
        }, w(function (err, s) {
            if (err) { throw err; }
            Env.pinStore = s;
        }));

        // create a channel store
        Store.create({
            filePath: Env.paths.data,
            archivePath: Env.paths.archive,
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
            blockPath: Env.paths.block,

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
            Env.evictInactive(function (err, report) {
                if (err) {
                    // NO_INACTIVE_TIME
                    Log.error('EVICT_INACTIVE_MAIN_ERROR', err);
                }
                active = false;
                Env.lastEviction = now;
                if (report) {
                    Log.info('EVICT_INACTIVE_REPORT', report);
                }
                Env.evictionReport = report || {};
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
