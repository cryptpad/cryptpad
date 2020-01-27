/* jshint esversion: 6 */
const nThen = require("nthen");
const WebSocketServer = require('ws').Server;
const NetfluxSrv = require('chainpad-server/NetfluxWebsocketSrv');

module.exports.create = function (config) {
    var historyKeeper;
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
        // XXX historyKeeper exports a `setConfig` method
        historyKeeper = HK.create(hkConfig);
    }).nThen(function () {
        var wsSrv = new WebSocketServer(wsConfig);
        // XXX NetfluxSrv shares some internal functions with historyKeeper
        // by passing them to setConfig
        NetfluxSrv.run(wsSrv, config, historyKeeper);
    });
};
