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
    '/common/netflux.js',
    '/common/crypto.js',
    '/common/toolbar.js',
    '/common/sharejs_textarea.js',
    '/common/chainpad.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Messages, Netflux, Crypto, Toolbar, sharejs) {
    var $ = window.jQuery;
    var ChainPad = window.ChainPad;
    var PARANOIA = true;
    var module = { exports: {} };

    var debug = function (x) { console.log(x); },
        warn = function (x) { console.error(x); },
        verbose = function (x) {
            if (window.verboseLogging) {
                console.log(x);
            }
        };
    // verbose = function () {}; // comment out to enable verbose logging

    // ------------------ Trapping Keyboard Events ---------------------- //

    var bindEvents = function (element, events, callback, unbind) {
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

    var bindAllEvents = function (textarea, docBody, onEvent, unbind)
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
        bindEvents(textarea,
                   ['mousedown','mouseup','click','change'],
                   onEvent,
                   unbind);
    };

    var start = module.exports.start =
        function (config)
    {
        var textarea = config.textarea;
        var websocketUrl = config.websocketURL;
        var userName = config.userName;
        var channel = config.channel;
        var cryptKey = config.cryptKey;

        var passwd = 'y';

        // make sure configuration is defined
        config = config || {};

        var doc = config.doc || null;

        // trying to deprecate onRemote, prefer loading it via the conf
        onRemote = config.onRemote || null;

        transformFunction = config.transformFunction || null;

        // define this in case it gets called before the rest of our stuff is ready.
        var onEvent = function () { };

        var allMessages = [];
        var initializing = true;

        var bump = function () {};

        var options = {
          signaling: websocketUrl,
          topology: 'StarTopologyService',
          protocol: 'WebSocketProtocolService',
          connector: 'WebSocketService',
          openWebChannel: true
        };
        var realtime;

        // Connect to the WebSocket server
        Netflux.join(channel, options).then(function(wc) {
            wc.onMessage = onMessage; // On receiving message
            wc.onJoining = onJoining; // On user joining the session

            // Open a Chainpad session
            realtime = createRealtime();
            realtime.onUserListChange(function (userList) {
                var opt = {userList : userList};
                // TODO : onJoining should only a a "newPeer" parameter
                wc.onJoining(opt);
            });
            // On sending message
            realtime.onMessage(function(message) {
                message = Crypto.encrypt(message, cryptKey);
                wc.send(message);
            });

            // Check the connection to the channel
            //checkConnection(wc);

            bindAllEvents(textarea, doc, onEvent, false);

            sharejs.attach(textarea, realtime);
            bump = realtime.bumpSharejs;

            realtime.start();
        }, function(error) {
            warn(error);
        });

        var createRealtime = function() {
            return ChainPad.create(userName,
                                        passwd,
                                        channel,
                                        $(textarea).val(),
                                        {
                                        transformFunction: config.transformFunction
                                        });
        }

        var whoami = new RegExp(userName.replace(/[\/\+]/g, function (c) {
            return '\\' +c;
        }));

        var onMessage = function(user, message) {

            message = Crypto.decrypt(message, cryptKey);

            verbose(message);
            allMessages.push(message);
            if (!initializing) {
                if (PARANOIA) {
                    onEvent();
                }
            }
            realtime.message(message);
            if (/\[5,/.test(message)) { verbose("pong"); }

            if (!initializing) {
                if (/\[2,/.test(message)) {
                    //verbose("Got a patch");
                    if (whoami.test(message)) {
                        //verbose("Received own message");
                    } else {
                        //verbose("Received remote message");
                        // obviously this is only going to get called if
                        if (onRemote) { onRemote(realtime.getUserDoc()); }
                    }
                }
            }
        }
        var onJoining = function(optionnalData) {
            var userList = optionnalData.userList || [];
            if (!initializing || userList.indexOf(userName) === -1) {
                return;
            }
            // if we spot ourselves being added to the document, we'll switch
            // 'initializing' off because it means we're fully synced.
            initializing = false;

            // execute an onReady callback if one was supplied
            // pass an object so we can extend this later
            if (config.onReady) {
                config.onReady({
                    userList: userList
                });
            }
        }

        var checkConnection = function(wc) {
          //TODO
            /*var socketChecker = setInterval(function () {
                if (netflux.checkSocket(realtime)) {
                    warn("Socket disconnected!");

                    recoverableErrorCount += 1;

                    if (recoverableErrorCount >= MAX_RECOVERABLE_ERRORS) {
                        warn("Giving up!");
                        realtime.abort();
                        wc.leave()
                            .then(null, function(err) {
                                warn(err);
                            });
                        if (config.onAbort) {
                            config.onAbort({
                                socket: socket
                            });
                        }
                        if (socketChecker) { clearInterval(socketChecker); }
                    }
                } else {
                    // it's working as expected, continue
                }
            }, 200);*/
        }

        return {
            onEvent: function () {
                onEvent();
            },
            bumpSharejs: function () { bump(); }
        };
    };
    return module.exports;
});
