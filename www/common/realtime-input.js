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
        
        var messagesHistory = [];
        
        var options = {
          signaling: websocketUrl,
          // signaling: 'ws://localhost:8000',
          key: channel
          // topology: 'StarTopologyService',
          // protocol: 'WebSocketProtocolService',
          // connector: 'WebSocketService',
          // openWebChannel: true
        };
        console.log(options);
        var realtime;

        // Add the Facade's peer messages handler
        // Netflux._onPeerMessage = onPeerMessage;
        
        function getParameterByName(name, url) {
            if (!url) url = window.location.href;
            name = name.replace(/[\[\]]/g, "\\$&");
            var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                results = regex.exec(url);
            if (!results) return null;
            if (!results[2]) return '';
            return decodeURIComponent(results[2].replace(/\+/g, " "));
        }

        if(getParameterByName("server")) {
          console.log('SERVER');
          console.log(channel);
        var webchannel = Netflux.create();
        webchannel.openForJoining(options).then(function(data) {
        
        // console.log('resolved');
        
          onOpen(webchannel);
        
        }, function(err) {
          console.log('rejected');
          console.error(err);
        });
        }
        else {
          console.log('CLIENT');
          console.log(channel);
          // Connect to the WebSocket server
          Netflux.join(channel, options).then(function(wc) {
              onOpen(wc);
          }, function(error) {
              warn(error);
          });
        }
        
        var onOpen = function(wc) {
          
              console.log('joined the channel');
              console.log(wc.myID);

              wc.onmessage = onMessage; // On receiving message
              wc.onJoining = onJoining; // On user joining the session
              wc.onLeaving = onLeaving; // On user leaving the session
              wc.onPeerMessage = function(peerId, type) {
                onPeerMessage(peerId, wc); // On user leaving the session
              }

              // Open a Chainpad session
              realtime = createRealtime();
              
              // we're fully synced
              initializing = false;

              // execute an onReady callback if one was supplied
              if (config.onReady) {
                  config.onReady();
              }
              
              // On sending message
              realtime.onMessage(function(message) {
                // TODO: put in ChaindpadAdapter
                // Do not send authentication messages since it is handled by Netflux
                var parsed = parseMessage(message);
                if (parsed.content[0] !== 0) {
                  console.log('ENVOI '+message);
                  message = Crypto.encrypt(message, cryptKey);
                  wc.send(message).then(function() {
                    onMessage('', message);
                  });
                }
                // END-TODO
              });
              
              var hc;
              for (let c of wc.channels) { hc = c; break; }
              if(hc) {
                console.log('history keeper :');
                console.log(hc);
                console.log('onPeer '+hc.peerID)
                wc.getHistory(hc.peerID);
              }
              // Get the channel history
              // var hc;
              // wc.peers.forEach(function (p) { if (!hc || p.linkQuality > hc.linkQuality) { hc = p; } });
              // hc.send(JSON.stringify(['GET_HISTORY', wc.id]));

              // Check the connection to the channel
              //checkConnection(wc);

              bindAllEvents(textarea, doc, onEvent, false);

              sharejs.attach(textarea, realtime);
              bump = realtime.bumpSharejs;

              realtime.start();
          
        } 

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
        
        var onPeerMessage = function(peerID, wc) {
          console.log(messagesHistory);
          console.log('RTsendTo '+peerID);
            messagesHistory.forEach(function(msg) {
              console.log(msg);
              //var message = Crypto.encrypt('1:y'+msg, cryptKey);
              wc.sendTo(peerID, msg);
            });
        };

        var onMessage = function(peer, msg) {
          
          // TODO : put in ChainpadAdapter

            // remove the password
            messagesHistory.push(msg);
            var passLen = msg.substring(0,msg.indexOf(':'));
            var message = msg.substring(passLen.length+1 + Number(passLen));
            
            message = Crypto.decrypt(message, cryptKey);
            
            console.log('RECOIS '+message);
            
          // END-TODO ChainpadAdapter
            
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
        
        var onJoining = function(peer, channel) {
          console.log('Someone joined : '+peer)
        }

        var onLeaving = function(peer, channel) {
          console.log('Someone left : '+peer)
        }

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
        }

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

        return {
            onEvent: function () {
                onEvent();
            },
            bumpSharejs: function () { bump(); }
        };
    };
    return module.exports;
});
