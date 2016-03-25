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
    '/_socket/toolbar.js',
    '/_socket/sharejs_textarea-transport-only.js',
    '/common/chainpad.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Messages,/*FIXME*/ ReconnectingWebSocket, Crypto, Toolbar, sharejs) {
    var $ = window.jQuery;
    var ChainPad = window.ChainPad;
    var PARANOIA = true;
    var module = { exports: {} };

    /**
     * If an error is encountered but it is recoverable, do not immediately fail
     * but if it keeps firing errors over and over, do fail.
     */
    var MAX_RECOVERABLE_ERRORS = 15;

    var recoverableErrors = 0;

    /** Maximum number of milliseconds of lag before we fail the connection. */
    var MAX_LAG_BEFORE_DISCONNECT = 20000;

    var debug = function (x) { console.log(x); };
    var warn = function (x) { console.error(x); };
    var verbose = function (x) { /*console.log(x);*/ };
    var error = function (x) {
        console.error(x);
        recoverableErrors++;
        if (recoverableErrors >= MAX_RECOVERABLE_ERRORS) {
            alert("FAIL");
        }
    };

    // ------------------ Trapping Keyboard Events ---------------------- //

    var _unused_bindEvents = function (element, events, callback, unbind) {
        for (var i = 0; i < events.length; i++) {
            var e = events[i];
            if (element.addEventListener) {
                if (unbind) {
                    element.removeEventListener(e, callback, false);
                } else {
                    element.addEventListener(e, callback, false);
                }
            } else {
                if (unbind) {
                    element.detachEvent('on' + e, callback);
                } else {
                    element.attachEvent('on' + e, callback);
                }
            }
        }
    };

    var _unused_bindAllEvents = function (textarea, docBody, onEvent, unbind)
    {
        /*
            we use docBody for the purposes of CKEditor.
            because otherwise special keybindings like ctrl-b and ctrl-i
            would open bookmarks and info instead of applying bold/italic styles
        */
        if (docBody) {
            bindEvents(docBody,
               ['textInput', 'keydown', 'keyup', 'select', 'cut', 'paste'],
               onEvent,
               unbind);
        }
        if (textarea) {
            bindEvents(textarea,
               ['mousedown','mouseup','click','change'],
               onEvent,
               unbind);
        }
    };

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

    var handleError = function (socket, realtime, err, docHTML, allMessages) {
        // var internalError = createDebugInfo(err, realtime, docHTML, allMessages);
        abort(socket, realtime);
    };

    var makeWebsocket = function (url) {
        var socket = new ReconnectingWebSocket(url);
        /* create a set of handlers to use instead of the native socket handler
            these handlers will iterate over all of the functions pushed to the
            arrays bearing their name.

            The first such function to return `false` will prevent subsequent
            functions from being executed. */
        var out = {
            onOpen: [], // takes care of launching the post-open logic
            onClose: [], // takes care of cleanup
            onError: [], // in case of error, socket will close, and fire this
            onMessage: [], // used for the bulk of our logic
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

        // bind your new handlers to the important listeners on the socket
        socket.onopen = mkHandler('onOpen');
        socket.onclose = mkHandler('onClose');
        socket.onerror = mkHandler('onError');
        socket.onmessage = mkHandler('onMessage');
        return out;
    };
    /* end websocket stuff */

    var start = module.exports.start = function (config) {
        //var textarea = config.textarea;
        var websocketUrl = config.websocketURL;
        var userName = config.userName;
        var channel = config.channel;
        var cryptKey = config.cryptKey;
        var passwd = 'y';
        var doc = config.doc || null;

        // wrap up the reconnecting websocket with our additional stack logic
        var socket = makeWebsocket(websocketUrl);

        var allMessages = window.chainpad_allMessages = [];
        var isErrorState = false;
        var initializing = true;
        var recoverableErrorCount = 0;

        var toReturn = { socket: socket };

        socket.onOpen.push(function (evt) {
            if (!initializing) {
                console.log("Starting");
                // realtime is passed around as an attribute of the socket
                // FIXME??
                socket.realtime.start();
                return;
            }

            var realtime = toReturn.realtime = socket.realtime =
                // everybody has a username, and we assume they don't collide
                // usernames are used to determine whether a message is remote
                // or local in origin. This could mess with expected behaviour
                // if someone spoofed.
                ChainPad.create(userName,
                    passwd, // password, to be deprecated (maybe)
                    channel, // the channel we're to connect to

                    // initialState argument. (optional)
                    config.initialState || '',

                    // transform function (optional), which handles conflicts
                    { transformFunction: config.transformFunction });

            var onEvent = toReturn.onEvent = function (newText) {
                if (isErrorState || initializing) { return; }
                // assert things here...
                if (realtime.getUserDoc() !== newText) {
                    // this is a problem
                    warn("realtime.getUserDoc() !== newText");
                }
                //try{throw new Error();}catch(e){console.log(e.stack);}
            };

            // pass your shiny new realtime into initialization functions
            if (config.onInit) {
                // extend as you wish
                config.onInit({
                    realtime: realtime
                });
            }

            /* UI hints on userList changes are handled within the toolbar
                so we don't actually need to do anything here except confirm
                whether we've successfully joined the session, and call our
                'onReady' function */
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

            // when a message is ready to send
            // Don't confuse this onMessage with socket.onMessage
            realtime.onMessage(function (message) {
                if (isErrorState) { return; }
                message = Crypto.encrypt(message, cryptKey);
                try {
                    socket.send(message);
                } catch (e) {
                    warn(e);
                }
            });

            realtime.onPatch(function () {
                if (config.onRemote) {
                    config.onRemote({
                        realtime: realtime
                        //realtime.getUserDoc()
                    });
                }
            });

            // when you receive a message...
            socket.onMessage.push(function (evt) {
                verbose(evt.data);
                if (isErrorState) { return; }

                var message = Crypto.decrypt(evt.data, cryptKey);
                verbose(message);
                allMessages.push(message);
                if (!initializing) {
                    // FIXME this is out of sync with the application logic
                    window.cryptpad_propogate();
                }
                realtime.message(message);
                if (/\[5,/.test(message)) { verbose("pong"); }

                if (!initializing) {
                    if (/\[2,/.test(message)) {
                        //verbose("Got a patch");

//TODO clean this all up

                    }
                }
            });

            // actual socket bindings
            socket.onmessage = function (evt) {
                for (var i = 0; i < socket.onMessage.length; i++) {
                    if (socket.onMessage[i](evt) === false) { return; }
                }
            };
            socket.onclose = function (evt) {
                for (var i = 0; i < socket.onMessage.length; i++) {
                    if (socket.onClose[i](evt) === false) { return; }
                }
            };

            socket.onerror = warn;

            var socketChecker = setInterval(function () {
                if (checkSocket(socket)) {
                    warn("Socket disconnected!");

                    recoverableErrorCount += 1;

                    if (recoverableErrorCount >= MAX_RECOVERABLE_ERRORS) {
                        warn("Giving up!");
                        abort(socket, realtime);
                        if (config.onAbort) {
                            config.onAbort({
                                socket: socket
                            });
                        }
                        if (socketChecker) { clearInterval(socketChecker); }
                    }
                } // it's working as expected, continue
            }, 200);

            // TODO maybe push this out to the application layer.
            //bindAllEvents(null, doc, onEvent, false);

            // TODO rename 'sharejs.attach' to imply what we want to do
            var genOp = toReturn.propogate = sharejs.attach({
                realtime: realtime
            });

            realtime.start();
            debug('started');
        });

        return toReturn;
    };
    return module.exports;
});
