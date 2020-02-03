/* jshint esversion: 6 */
const nThen = require("nthen");
const WebSocketServer = require('ws').Server;
const NetfluxSrv = require('chainpad-server');

module.exports.create = function (config) {
    var rpc;
    const log = config.log;
    const wsConfig = {
        server: config.httpServer,
    };

    nThen(function (w) {
        require('../storage/file').create(config, w(function (_store) {
            config.store = _store;
        }));
    }).nThen(function (w) {
        require("../storage/tasks").create(config, w(function (e, tasks) {
            if (e) {
                throw e;
            }
            config.tasks = tasks;
            if (config.disableIntegratedTasks) { return; }

            // XXX support stopping this interval
            setInterval(function () {
                tasks.runAll(function (err) {
                    if (err) {
                        // either TASK_CONCURRENCY or an error with tasks.list
                        // in either case it is already logged.
                    }
                });
            }, 1000 * 60 * 5); // run every five minutes
        }));
    }).nThen(function (w) {
        require("./rpc").create(config, w(function (e, _rpc) {
            if (e) {
                w.abort();
                throw e;
            }
            rpc = _rpc;
        }));
    }).nThen(function () {
        var HK = require('./historyKeeper.js');
        var hkConfig = {
            tasks: config.tasks,
            rpc: rpc,
            store: config.store,
            log: log,
        };

        var historyKeeper = HK.create(hkConfig);

        NetfluxSrv.create(new WebSocketServer(wsConfig))
            .on('channelClose', historyKeeper.channelClose)
            .on('channelMessage', historyKeeper.channelMessage)
            .on('channelOpen', historyKeeper.channelOpen)
            .on('sessionClose', function (userId, reason) {
                reason = reason; // XXX
            })
            .on('error', function (error, label, info) {
                info = info; // XXX
            })
            .register(historyKeeper.id, historyKeeper.directMessage);
    });
};
