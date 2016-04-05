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
window.Reflect = { has: (x,y) => { return (y in x); } };
define([
    '/common/messages.js',
    '/common/netflux.js',
    '/common/crypto.js',
    '/common/toolbar.js',
    '/_socket/text-patcher.js',
    '/common/chainpad.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Messages, Netflux, Crypto, Toolbar, TextPatcher) {
    var $ = window.jQuery;
    var ChainPad = window.ChainPad;
    var PARANOIA = true;
    var module = { exports: {} };

    /**
     * If an error is encountered but it is recoverable, do not immediately fail
     * but if it keeps firing errors over and over, do fail.
     */
    var MAX_RECOVERABLE_ERRORS = 15;

    var debug = function (x) { console.log(x); },
        warn = function (x) { console.error(x); },
        verbose = function (x) { console.log(x); };
    verbose = function () {}; // comment out to enable verbose logging

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

    var getParameterByName = function (name, url) {
        if (!url) { url = window.location.href; }
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) { return null; }
        if (!results[2]) { return ''; }
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    };

    var start = module.exports.start =
        function (config)
    {
        var websocketUrl = config.websocketURL;
        var webrtcUrl = config.webrtcURL;
        var userName = config.userName;
        var channel = config.channel;
        var chanKey = config.cryptKey;
        var cryptKey = Crypto.parseKey(chanKey).cryptKey;
        var passwd = 'y';

        // make sure configuration is defined
        config = config || {};

        var doc = config.doc || null;

        var allMessages = [];
        var initializing = true;
        var recoverableErrorCount = 0;
        var toReturn = {};
        var messagesHistory = [];
        var chainpadAdapter = {};
        var realtime;

        // define this in case it gets called before the rest of our stuff is ready.
        var onEvent = toReturn.onEvent = function (newText) { };

        var parseMessage = function (msg) {
            var res ={};
            // two or more? use a for
            ['pass','user','channelId','content'].forEach(function(attr){
                var len=msg.slice(0,msg.indexOf(':')),
                // taking an offset lets us slice out the prop
                // and saves us one string copy
                    o=len.length+1,
                    prop=res[attr]=msg.slice(o,Number(len)+o);
                // slice off the property and its descriptor
                msg = msg.slice(prop.length+o);
            });
            // content is the only attribute that's not a string
            res.content=JSON.parse(res.content);
            return res;
        };

        var mkMessage = function (user, chan, content) {
            content = JSON.stringify(content);
            return user.length + ':' + user +
                chan.length + ':' + chan +
                content.length + ':' + content;
        };

        var onPeerMessage = function(toId, type, wc) {
            if(type === 6) {
                messagesHistory.forEach(function(msg) {
                    wc.sendTo(toId, '1:y'+msg);
                });
                wc.sendTo(toId, '0');
            }
        };

        var whoami = new RegExp(userName.replace(/[\/\+]/g, function (c) {
            return '\\' +c;
        }));

        var onMessage = function(peer, msg, wc) {

            if(msg === 0 || msg === '0') {
                onReady(wc);
                return;
            }
            var message = chainpadAdapter.msgIn(peer, msg);

            verbose(message);
            allMessages.push(message);
            // if (!initializing) {
                // if (toReturn.onLocal) {
                    // toReturn.onLocal();
                // }
            // }
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
                        if (config.onRemote) {
                            config.onRemote({
                                realtime: realtime
                            });
                        }
                    }
                }
            }
        };

        var userList = {
          onChange : function() {},
          users: []
        };
        var onJoining = function(peer) {
          var list = userList.users;
          if(list.indexOf(peer) === -1) {
            userList.users.push(peer);
          }
          userList.onChange();
        };

        var onLeaving = function(peer) {
          var list = userList.users;
          var index = list.indexOf(peer);
          if(index !== -1) {
            userList.users.splice(index, 1);
          }
          userList.onChange();
        };

        chainpadAdapter = {
            msgIn : function(peerId, msg) {
                var parsed = parseMessage(msg);
                // Remove the password from the message
                var passLen = msg.substring(0,msg.indexOf(':'));
                var message = msg.substring(passLen.length+1 + Number(passLen));
                try {
                    var decryptedMsg = Crypto.decrypt(message, cryptKey);
                    messagesHistory.push(decryptedMsg);
                    return decryptedMsg;
                } catch (err) {
                    return message;
                }

            },
            msgOut : function(msg, wc) {
                var parsed = parseMessage(msg);
                if(parsed.content[0] === 0) { // We're registering : send a REGISTER_ACK to Chainpad
                    onMessage('', '1:y'+mkMessage('', channel, [1,0]));
                    return;
                }
                if(parsed.content[0] === 4) { // PING message from Chainpad
                    parsed.content[0] = 5;
                    onMessage('', '1:y'+mkMessage(parsed.user, parsed.channelId, parsed.content));
                    wc.sendPing();
                    return;
                }
                return Crypto.encrypt(msg, cryptKey);
            }
        };

        var options = {
          key: ''
        };

        var rtc = true;

        if(!getParameterByName("webrtc") || !webrtcUrl) {
          rtc = false;
          options.signaling = websocketUrl;
          options.topology = 'StarTopologyService';
          options.protocol = 'WebSocketProtocolService';
          options.connector = 'WebSocketService';
          options.openWebChannel = true;
        }
        else {
          options.signaling = webrtcUrl;
        }

        var createRealtime = function(chan) {
            return ChainPad.create(userName,
                                        passwd,
                                        channel,
                                        config.initialState || {},
                                        {
                                        transformFunction: config.transformFunction
                                        });
        };

        var onReady = function(wc) {
            if(config.onInit) {
                config.onInit({
                    myID: wc.myID,
                    realtime: realtime,
                    webChannel: wc,
                    userList: userList
                });
            }
            // Trigger onJoining with our own Cryptpad username to tell the toolbar that we are synced
            onJoining(wc.myID);

            // we're fully synced
            initializing = false;

            // execute an onReady callback if one was supplied
            if (config.onReady) {
                config.onReady({
                    realtime: realtime
                });
            }
        }

        var onOpen = function(wc) {
            channel = wc.id;
            window.location.hash = channel + '|' + chanKey;
            // Add the handlers to the WebChannel
            wc.onmessage = function(peer, msg) { // On receiving message
                onMessage(peer, msg, wc);
            };
            wc.onJoining = onJoining; // On user joining the session
            wc.onLeaving = onLeaving; // On user leaving the session
            wc.onPeerMessage = function(peerId, type) {
              onPeerMessage(peerId, type, wc);
            };
            if(config.setMyID) {
                config.setMyID({
                    myID: wc.myID
                });
            }
            // Open a Chainpad session
            realtime = createRealtime();

            // On sending message
            realtime.onMessage(function(message) {
                // Prevent Chainpad from sending authentication messages since it is handled by Netflux
                message = chainpadAdapter.msgOut(message, wc);
                if(message) {
                  wc.send(message).then(function() {
                    // Send the message back to Chainpad once it is sent to all peers if using the WebRTC protocol
                    if(rtc) { onMessage(wc.myID, message); }
                  });
                }
            });

            // Get the channel history
            var hc;
            if(rtc) {
              wc.channels.forEach(function (c) { if(!hc) { hc = c; } });
              if(hc) {
                wc.getHistory(hc.peerID);
              }
            }
            else {
              // TODO : Improve WebSocket service to use the latest Netflux's API
              wc.peers.forEach(function (p) { if (!hc || p.linkQuality > hc.linkQuality) { hc = p; } });
              hc.send(JSON.stringify(['GET_HISTORY', wc.id]));
            }


            toReturn.patchText = TextPatcher.create({
                realtime: realtime
            });

            realtime.start();
        };

        var createRTCChannel = function () {
            // Check if the WebRTC channel exists and create it if necessary
            var webchannel = Netflux.create();
            webchannel.openForJoining(options).then(function(data) {
                onOpen(webchannel);
                onReady(webchannel);
            }, function(error) {
                warn(error);
            });
        };

        var joinChannel = function() {
            // Connect to the WebSocket/WebRTC channel
            Netflux.join(channel, options).then(function(wc) {
                onOpen(wc);
            }, function(error) {
                if(rtc && error.code === 1008) {// Unexisting RTC channel
                    createRTCChannel();
                }
                else { warn(error); }
            });
        };
        joinChannel();

        var checkConnection = function(wc) {
            if(wc.channels && wc.channels.size > 0) {
                var channels = Array.from(wc.channels);
                var channel = channels[0];

                var socketChecker = setInterval(function () {
                    if (channel.checkSocket(realtime)) {
                        warn("Socket disconnected!");

                        recoverableErrorCount += 1;

                        if (recoverableErrorCount >= MAX_RECOVERABLE_ERRORS) {
                            warn("Giving up!");
                            realtime.abort();
                            try { channel.close(); } catch (e) { warn(e); }
                            if (config.onAbort) {
                                config.onAbort({
                                    socket: channel
                                });
                            }
                            if (socketChecker) { clearInterval(socketChecker); }
                        }
                    } else {
                        // it's working as expected, continue
                    }
                }, 200);
            }
        };

        return toReturn;
    };
    return module.exports;
});
