/*
 * Copyright 2014 XWiki SAS
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
define([
    '/common/messages.js',
    '/bower_components/reconnectingWebsocket/reconnecting-websocket.js',
    '/common/crypto.js',
    '/common/chainpad.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Messages, ReconnectingWebSocket, Crypto) {
    var $ = window.jQuery;
    var ChainPad = window.ChainPad;
    var PARANOIA = true;
    var module = { exports: {} };

    /**
     * If an error is encountered but it is recoverable, do not immediately fail
     * but if it keeps firing errors over and over, do fail.
     */
    var MAX_RECOVERABLE_ERRORS = 15;

    /** Maximum number of milliseconds of lag before we fail the connection. */
    var MAX_LAG_BEFORE_DISCONNECT = 20000;

    var warn = function (x) { console.error(x); };

    /* websocket stuff */
    var isSocketDisconnected = function (socket, realtime) {
        var sock = socket._socket;
        return sock.readyState === sock.CLOSING
            || sock.readyState === sock.CLOSED
            || (realtime.getLag().waiting && realtime.getLag().lag > MAX_LAG_BEFORE_DISCONNECT);
    };

    // this differs from other functions with similar names in that
    // you are expected to pass a socket into it.
    var checkSocket = function (socket) {
        if (isSocketDisconnected(socket, socket.realtime) &&
            !socket.intentionallyClosing) {
            return true;
        } else {
            return false;
        }
    };

    // TODO before removing websocket implementation
    // bind abort to onLeaving
    var abort = function (socket, realtime) {
        realtime.abort();
        try { socket._socket.close(); } catch (e) { warn(e); }
    };

    var makeWebsocket = function (url) {
        var socket = new ReconnectingWebSocket(url);
        var out = {
            onOpen: [],
            onClose: [],
            onError: [],
            onMessage: [],
            send: function (msg) { socket.send(msg); },
            close: function () { socket.close(); },
            _socket: socket
        };
        var mkHandler = function (name) {
            return function (evt) {
                for (var i = 0; i < out[name].length; i++) {
                    if (out[name][i](evt) === false) {
                        console.log(name +"Handler");
                        return;
                    }
                }
            };
        };
        socket.onopen = mkHandler('onOpen');
        socket.onclose = mkHandler('onClose');
        socket.onerror = mkHandler('onError');
        socket.onmessage = mkHandler('onMessage');
        return out;
    };
    /* end websocket stuff */

    var start = module.exports.start = function (config) { 

        var websocketUrl = config.websocketURL;
        var userName = config.userName;
        var channel = config.channel;
        var cryptKey = config.cryptKey;
        var passwd = 'y';

        var toReturn = {};

        var socket = makeWebsocket(websocketUrl);

        var allMessages = [];
        var isErrorState = false;
        var initializing = true;
        var recoverableErrorCount = 0;

        socket.onOpen.push(function (evt) {
            var realtime = socket.realtime = ChainPad.create(userName,
                                passwd,
                                channel,
                                config.initialState || '',
                                {
                                    transformFunction: config.transformFunction
                                });

            if (config.onInit) {
                // extend as you wish
                config.onInit({
                    realtime: realtime
                });
            }

            realtime.onUserListChange(function (userList) {
                if (!initializing || userList.indexOf(userName) === -1) {
                    return;
                }
                // if we spot ourselves being added to the document, we'll switch
                // 'initializing' off because it means we're fully synced.
                initializing = false;

                // execute an onReady callback if one was supplied
                // pass an object so we can extend this later
                if (config.onReady) {
                    // extend as you wish
                    config.onReady({
                        userList: userList,
                        realtime: realtime
                    });
                }
            });

            // when you receive a message...
            socket.onMessage.push(function (evt) {
                if (isErrorState) { return; }

                var message = Crypto.decrypt(evt.data, cryptKey);
                allMessages.push(message);

                // super important step that avoids us having
                // the 'backspace bug'
                if (config.onLocal) {
                    config.onLocal();
                }

                realtime.message(message);
            });

            // when you receive a patch
            realtime.onPatch(function () {
                if (config.onRemote) {
                    config.onRemote({
                        realtime: realtime
                    });
                }
            });

            // when a message is ready to send
            realtime.onMessage(function (message) {
                if (isErrorState) { return; }
                message = Crypto.encrypt(message, cryptKey);
                try {
                    socket.send(message);
                } catch (e) {
                    warn(e);
                }
            });

            var socketChecker = setInterval(function () {
                if (checkSocket(socket)) {
                    warn("Socket disconnected!");

                    recoverableErrorCount += 1;

                    if (recoverableErrorCount >= MAX_RECOVERABLE_ERRORS) {
                        warn("Giving up!");
                        abort(socket, realtime);
                        if (config.onAbort) {
                            config.onAbort({
                                realtime: realtime
                            });
                        }
                        if (socketChecker) { clearInterval(socketChecker); }
                    }
                }
            },200);

            realtime.start();
        });
        return toReturn;
    };
    return module.exports;
});
