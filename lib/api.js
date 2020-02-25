/* jshint esversion: 6 */
const WebSocketServer = require('ws').Server;
const NetfluxSrv = require('chainpad-server');

module.exports.create = function (config) {
    // asynchronously create a historyKeeper and RPC together
    require('./historyKeeper.js').create(config, function (err, historyKeeper) {
        if (err) { throw err; }

        var log = config.log;

        // spawn ws server and attach netflux event handlers
        NetfluxSrv.create(new WebSocketServer({ server: config.httpServer}))
            .on('channelClose', historyKeeper.channelClose)
            .on('channelMessage', historyKeeper.channelMessage)
            .on('channelOpen', historyKeeper.channelOpen)
            .on('sessionClose', function (userId, reason) {
                if (['BAD_MESSAGE', 'SOCKET_ERROR', 'SEND_MESSAGE_FAIL_2'].indexOf(reason) !== -1) {
                    if (reason && reason.code === 'ECONNRESET') { return; }
                    return void log.error('SESSION_CLOSE_WITH_ERROR', {
                        userId: userId,
                        reason: reason,
                    });
                }

                if (['SOCKET_CLOSED', 'SOCKET_ERROR'].indexOf(reason)) { return; }
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
};
