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
    '/common/netflux-client.js',
    '/common/crypto.js',
    '/common/TextPatcher.js',
    '/common/es6-promise.min.js',
    '/common/chainpad.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Messages, Netflux, Crypto, TextPatcher) {
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

    var start = module.exports.start =
        function (config)
    {
        var websocketUrl = config.websocketURL;
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
        var recoverableErrorCount = 0; // unused
        var toReturn = {};
        var messagesHistory = [];
        var chainpadAdapter = {};
        var realtime;

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

        var userList = {
            onChange : function() {},
            users: []
        };

        var onJoining = function(peer) {
            if(peer.length !== 32) { return; }
            var list = userList.users;
            var index = list.indexOf(peer);
            if(index === -1) {
                userList.users.push(peer);
            }
            userList.onChange();
        };

        var onReady = function(wc, network) {
            if(config.onInit) {
                config.onInit({
                    myID: wc.myID,
                    realtime: realtime,
                    getLag: network.getLag,
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
        };

        var onMessage = function(peer, msg, wc, network) {
            // unpack the history keeper from the webchannel
            var hc = (wc && wc.history_keeper) ? wc.history_keeper : null;

            if(wc && (msg === 0 || msg === '0')) {
                onReady(wc, network);
                return;
            }
            if (peer === hc){
                // if the peer is the 'history keeper', extract their message
                msg = JSON.parse(msg)[4];
            }
            var message = chainpadAdapter.msgIn(peer, msg);

            verbose(message);
            allMessages.push(message);

            if (!initializing) {
                if (toReturn.onLocal) {
                    toReturn.onLocal();
                }
            }
            // pass the message into Chainpad
            realtime.message(message);
        };

        // update UI components to show that one of the other peers has left
        var onLeaving = function(peer) {
          var list = userList.users;
          var index = list.indexOf(peer);
          if(index !== -1) {
            userList.users.splice(index, 1);
          }
          userList.onChange();
        };

        // shim between chainpad and netflux
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
                    console.error(err);
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
                    // wc.sendPing();
                    return;
                }
                return Crypto.encrypt(msg, cryptKey);
            }
        };

        var createRealtime = function(chan) {
            return ChainPad.create(userName,
                                        passwd,
                                        channel,
                                        config.initialState || {},
                                        {
                                        transformFunction: config.transformFunction
                                        });
        };


        var onOpen = function(wc, network) {
            channel = wc.id;
            window.location.hash = channel + '|' + chanKey;

            // Add the existing peers in the userList
            wc.members.forEach(onJoining);

            // Add the handlers to the WebChannel
            wc.on('message', function (msg, sender) { //Channel msg
                onMessage(sender, msg, wc, network);
            });
            wc.on('join', onJoining);
            wc.on('leave', onLeaving);


            if(config.setMyID) {
                config.setMyID({
                    myID: wc.myID
                });
            }
            // Open a Chainpad session
            realtime = createRealtime();

            toReturn.onEvent = function (newText) {
                // assert to show that we're not out of sync
                if (realtime.getUserDoc() !== newText) {
                    warn("realtime.getUserDoc() !== newText");
                }
            };

            // Sending a message...
            realtime.onMessage(function(message) {
                // Filter messages sent by Chainpad to make it compatible with Netflux
                message = chainpadAdapter.msgOut(message, wc);
                if(message) {
                  wc.bcast(message).then(function() {
                    // Send the message back to Chainpad once it is sent to the recipients.
                    onMessage(wc.myID, message);
                  }, function(err) {
                    // The message has not been sent, display the error.
                    console.error(err);
                  });
                }
            });

            realtime.onPatch(function () {
                if (config.onRemote) {
                    config.onRemote({
                        realtime: realtime
                    });
                }
            });

            // Get the channel history
            var hc;
            wc.members.forEach(function (p) { 
              if (p.length === 16) { hc = p; } 
            });
            wc.history_keeper = hc;
            if (hc) { network.sendto(hc, JSON.stringify(['GET_HISTORY', wc.id])); }


            toReturn.patchText = TextPatcher.create({
                realtime: realtime
            });

            realtime.start();
        };

        var findChannelById = function(webChannels, channelId) {
            var webChannel;

            // Array.some terminates once a truthy value is returned
            // best case is faster than forEach, though webchannel arrays seem
            // to consistently have a length of 1
            webChannels.some(function(chan) {
                if(chan.id === channelId) { webChannel = chan; return true;}
            });
            return webChannel;
        };

        // Connect to the WebSocket channel
        Netflux.connect(websocketUrl).then(function(network) {
            // pass messages that come out of netflux into our local handler

            network.on('message', function (msg, sender) { // Direct message
                var wchan = findChannelById(network.webChannels, channel);
                if(wchan) {
                  onMessage(sender, msg, wchan, network);
                }
            });

            // join the netflux network, promise to handle opening of the channel
            network.join(channel || null).then(function(wc) {
                onOpen(wc, network);
            }, function(error) {
                console.error(error);
            });
        }, function(error) {
            warn(error);
        });

        return toReturn;
    };
    return module.exports;
});
