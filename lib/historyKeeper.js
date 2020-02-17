/* jshint esversion: 6 */

const nThen = require('nthen');
const Crypto = require('crypto');
const WriteQueue = require("./write-queue");
const BatchRead = require("./batch-read");
const RPC = require("./rpc");
const HK = require("./hk-util.js");

module.exports.create = function (config, cb) {
    const Log = config.log;

    Log.silly('HK_LOADING', 'LOADING HISTORY_KEEPER MODULE');

    // TODO populate Env with everything that you use from config
    // so that you can stop passing around your raw config
    // and more easily share state between historyKeeper and rpc
    const Env = {
        Log: Log,
        // tasks
        // store
        id: Crypto.randomBytes(8).toString('hex'),

        metadata_cache: {},
        channel_cache: {},
        queueStorage: WriteQueue(),
        batchIndexReads: BatchRead("HK_GET_INDEX"),
    };

    config.historyKeeper = {
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
        channelOpen: function (Server, channelName, userId) {
            Env.channel_cache[channelName] = {};
            Server.send(userId, [
                0,
                Env.id,
                'JOIN',
                channelName
            ]);
        },
        directMessage: function (Server, seq, userId, json) {
            // netflux-server allows you to register an id with a handler
            // this handler is invoked every time someone sends a message to that id
            HK.onDirectMessage(Env, Server, seq, userId, json);
        },
    };

    Log.verbose('HK_ID', 'History keeper ID: ' + Env.id);

    nThen(function (w) {
        require('./storage/file').create(config, w(function (_store) {
            config.store = _store;
            Env.store = _store;
        }));
    }).nThen(function (w) {
        require("./storage/tasks").create(config, w(function (e, tasks) {
            if (e) {
                throw e;
            }
            Env.tasks = tasks;
            config.tasks = tasks;
            if (config.disableIntegratedTasks) { return; }

            config.intervals = config.intervals || {};
            config.intervals.taskExpiration = setInterval(function () {
                tasks.runAll(function (err) {
                    if (err) {
                        // either TASK_CONCURRENCY or an error with tasks.list
                        // in either case it is already logged.
                    }
                });
            }, 1000 * 60 * 5); // run every five minutes
        }));
    }).nThen(function () {
        RPC.create(config, function (err, _rpc) {
            if (err) { throw err; }

            Env.rpc = _rpc;
            cb(void 0, config.historyKeeper);
        });
    });
};
