/* jshint esversion: 6 */
const nThen = require("nthen");
const WebSocketServer = require('ws').Server;
const NetfluxSrv = require('chainpad-server');

module.exports.create = function (config) {
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
    }).nThen(function () {
        // asynchronously create a historyKeeper and RPC together
        require('./historyKeeper.js').create(config, function (err, historyKeeper) {
            if (err) { throw err; }

            var log = config.log;

            // spawn ws server and attach netflux event handlers
            NetfluxSrv.create(new WebSocketServer(wsConfig))
                .on('channelClose', historyKeeper.channelClose)
                .on('channelMessage', historyKeeper.channelMessage)
                .on('channelOpen', historyKeeper.channelOpen)
                .on('sessionClose', function (userId, reason) {
                    if (['BAD_MESSAGE', 'SOCKET_ERROR', 'SEND_MESSAGE_FAIL_2'].indexOf(reason) !== -1) {
                        return void log.error('SESSION_CLOSE_WITH_ERROR', {
                            userId: userId,
                            reason: reason,
                        });
                    }
                    log.verbose('SESSION_CLOSE_ROUTINE', {
                        userId: userId,
                        reason: reason,
                    });
                })
                .on('error', function (error, label, info) {
                    if (!error) { return; }
                    /* labels:
                        SEND_MESSAGE_FAIL, SEND_MESSAGE_FAIL_2, FAIL_TO_DISCONNECT,
                        FAIL_TO_TERMINATE, HANDLE_CHANNEL_LEAVE, NETFLUX_BAD_MESSAGE,
                        NETFLUX_WEBSOCKET_ERROR
                    */
                    log.error(label, {
                        code: error.code,
                        message: error.message,
                        stack: error.stack,
                        info: info,
                    });
                })
                .register(historyKeeper.id, historyKeeper.directMessage);
        });
    });
};
