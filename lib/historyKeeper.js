/* jshint esversion: 6 */

const nThen = require('nthen');
const Crypto = require('crypto');
const WriteQueue = require("./write-queue");
const BatchRead = require("./batch-read");
const RPC = require("./rpc");
const HK = require("./hk-util.js");
const Core = require("./commands/core");

const Store = require("./storage/file");
const BlobStore = require("./storage/blob");
const Workers = require("./workers/index");

module.exports.create = function (config, cb) {
    const Log = config.log;
    var WARN = function (e, output) {
        if (e && output) {
            Log.warn(e, {
                output: output,
                message: String(e),
                stack: new Error(e).stack,
            });
        }
    };

    Log.silly('HK_LOADING', 'LOADING HISTORY_KEEPER MODULE');

    // TODO populate Env with everything that you use from config
    // so that you can stop passing around your raw config
    // and more easily share state between historyKeeper and rpc
    const Env = {
        Log: Log,
        // store
        id: Crypto.randomBytes(8).toString('hex'),

        metadata_cache: {},
        channel_cache: {},
        queueStorage: WriteQueue(),
        queueDeletes: WriteQueue(),
        queueValidation: WriteQueue(),

        batchIndexReads: BatchRead("HK_GET_INDEX"),
        batchMetadata: BatchRead('GET_METADATA'),
        batchRegisteredUsers: BatchRead("GET_REGISTERED_USERS"),
        batchDiskUsage: BatchRead('GET_DISK_USAGE'),
        batchUserPins: BatchRead('LOAD_USER_PINS'),
        batchTotalSize: BatchRead('GET_TOTAL_SIZE'),

        //historyKeeper: config.historyKeeper,
        intervals: config.intervals || {},
        maxUploadSize: config.maxUploadSize || (20 * 1024 * 1024),
        premiumUploadSize: false, // overridden below...
        Sessions: {},
        paths: {},
        //msgStore: config.store,

        netfluxUsers: {},

        pinStore: undefined,
        pinnedPads: {},
        pinsLoaded: false,
        pendingPinInquiries: {},
        pendingUnpins: {},
        pinWorkers: 5,

        limits: {},
        admins: [],
        WARN: WARN,
        flushCache: config.flushCache,
        adminEmail: config.adminEmail,
        allowSubscriptions: config.allowSubscriptions === true,
        blockDailyCheck: config.blockDailyCheck === true,

        myDomain: config.myDomain,
        mySubdomain: config.mySubdomain, // only exists for the accounts integration
        customLimits: config.customLimits || {},
        // FIXME this attribute isn't in the default conf
        // but it is referenced in Quota
        domain: config.domain
    };

    (function () {
        var pes = config.premiumUploadSize;
        if (!isNaN(pes) && pes >= Env.maxUploadSize) {
            Env.premiumUploadSize = pes;
        }
    }());

    var paths = Env.paths;

    var keyOrDefaultString = function (key, def) {
        return typeof(config[key]) === 'string'? config[key]: def;
    };

    var pinPath = paths.pin = keyOrDefaultString('pinPath', './pins');
    paths.block = keyOrDefaultString('blockPath', './block');
    paths.data = keyOrDefaultString('filePath', './datastore');
    paths.staging = keyOrDefaultString('blobStagingPath', './blobstage');
    paths.blob = keyOrDefaultString('blobPath', './blob');

    Env.defaultStorageLimit = typeof(config.defaultStorageLimit) === 'number' && config.defaultStorageLimit >= 0?
        config.defaultStorageLimit:
        Core.DEFAULT_LIMIT;

    try {
        Env.admins = (config.adminKeys || []).map(function (k) {
            k = k.replace(/\/+$/, '');
            var s = k.split('/');
            return s[s.length-1];
        });
    } catch (e) {
        console.error("Can't parse admin keys. Please update or fix your config.js file!");
    }

    config.historyKeeper = Env.historyKeeper = {
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

    nThen(function (w) {
        // create a pin store
        Store.create({
            filePath: pinPath,
        }, w(function (err, s) {
            if (err) { throw err; }
            Env.pinStore = s;
        }));

        // create a channel store
        Store.create(config, w(function (err, _store) {
            if (err) { throw err; }
            config.store = _store;
            Env.msgStore = _store; // API used by rpc
            Env.store = _store; // API used by historyKeeper
        }));

        // create a blob store
        BlobStore.create({
            blobPath: config.blobPath,
            blobStagingPath: config.blobStagingPath,
            archivePath: config.archivePath,
            getSession: function (safeKey) {
                return Core.getSession(Env.Sessions, safeKey);
            },
        }, w(function (err, blob) {
            if (err) { throw new Error(err); }
            Env.blobStore = blob;
        }));
    }).nThen(function (w) {
        Workers.initialize(Env, {
            blobPath: config.blobPath,
            blobStagingPath: config.blobStagingPath,
            taskPath: config.taskPath,
            pinPath: pinPath,
            filePath: config.filePath,
            archivePath: config.archivePath,
            channelExpirationMs: config.channelExpirationMs,
            verbose: config.verbose,
            openFileLimit: config.openFileLimit,

            maxWorkers: config.maxWorkers,
        }, w(function (err) {
            if (err) {
                throw new Error(err);
            }
        }));
    }).nThen(function () {
        if (config.disableIntegratedTasks) { return; }
        config.intervals = config.intervals || {};

        var tasks_running;
        config.intervals.taskExpiration = setInterval(function () {
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
        RPC.create(Env, function (err, _rpc) {
            if (err) { throw err; }

            Env.rpc = _rpc;
            cb(void 0, config.historyKeeper);
        });
    });
};
