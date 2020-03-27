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
            .on('sessionClose', historyKeeper.sessionClose)
            .on('error', function (error, label, info) {
                if (!error) { return; }
                if (['EPIPE', 'ECONNRESET'].indexOf(error && error.code) !== -1) { return; }
                /* labels:
                    SEND_MESSAGE_FAIL, SEND_MESSAGE_FAIL_2, FAIL_TO_DISCONNECT,
                    FAIL_TO_TERMINATE, HANDLE_CHANNEL_LEAVE, NETFLUX_BAD_MESSAGE,
                    NETFLUX_WEBSOCKET_ERROR, NF_ENOENT
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
