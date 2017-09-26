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
define([], function () {
    var USE_HISTORY = true;

    var verbose = function (x) { console.log(x); };
    verbose = function () {}; // comment out to enable verbose logging

    var unBencode = function (str) { return str.replace(/^\d+:/, ''); };

    var start = function (conf) {
        var channel = conf.channel;
        var Crypto = conf.crypto;
        var validateKey = conf.validateKey;
        var readOnly = conf.readOnly || false;
        var network = conf.network;
        var sframeChan = conf.sframeChan;
        var onConnect = conf.onConnect || function () { };
        conf = undefined;

        var initializing = true;
        var lastKnownHash;

        var queue = [];
        var messageFromInner = function (m, cb) { queue.push([ m, cb ]); };
        sframeChan.on('Q_RT_MESSAGE', function (message, cb) {
            console.log(message);
            messageFromInner(message, cb);
        });        

        var onReady = function () {
            // Trigger onReady only if not ready yet. This is important because the history keeper sends a direct
            // message through "network" when it is synced, and it triggers onReady for each channel joined.
            if (!initializing) { return; }
            sframeChan.event('EV_RT_READY', null);
            // we're fully synced
            initializing = false;
        };

        // shim between chainpad and netflux
        var msgIn = function (peerId, msg) {
            msg = msg.replace(/^cp\|/, '');
            try {
                var decryptedMsg = Crypto.decrypt(msg, validateKey);
                return decryptedMsg;
            } catch (err) {
                console.error(err);
                return msg;
            }
        };

        var msgOut = function (msg) {
            if (readOnly) { return; }
            try {
                var cmsg = Crypto.encrypt(msg);
                if (msg.indexOf('[4') === 0) { cmsg = 'cp|' + cmsg; }
                return cmsg;
            } catch (err) {
                console.log(msg);
                throw err;
            }
        };

        var onMessage = function(peer, msg, wc, network, direct) {
            // unpack the history keeper from the webchannel
            var hk = network.historyKeeper;

            if (direct && peer !== hk) {
                return;
            }
            if (direct) {
                var parsed = JSON.parse(msg);
                if (parsed.validateKey && parsed.channel) {
                    if (parsed.channel === wc.id && !validateKey) {
                        validateKey = parsed.validateKey;
                    }
                    // We have to return even if it is not the current channel:
                    // we don't want to continue with other channels messages here
                    return;
                }
                if (parsed.state && parsed.state === 1 && parsed.channel) {
                    if (parsed.channel === wc.id) {
                        onReady(wc);
                    }
                    // We have to return even if it is not the current channel:
                    // we don't want to continue with other channels messages here
                    return;
                }
            }
            // The history keeper is different for each channel :
            // no need to check if the message is related to the current channel
            if (peer === hk) {
                // if the peer is the 'history keeper', extract their message
                var parsed1 = JSON.parse(msg);
                msg = parsed1[4];
                // Check that this is a message for us
                if (parsed1[3] !== wc.id) { return; }
            }

            lastKnownHash = msg.slice(0,64);
            var message = msgIn(peer, msg);

            verbose(message);

            // slice off the bencoded header
            // Why are we getting bencoded stuff to begin with?
            // FIXME this shouldn't be necessary
            message = unBencode(message);//.slice(message.indexOf(':[') + 1);

            // pass the message into Chainpad
            sframeChan.query('Q_RT_MESSAGE', message, function () { });
        };

        // We use an object to store the webchannel so that we don't have to push new handlers to chainpad
        // and remove the old ones when reconnecting and keeping the same 'realtime' object
        // See realtime.onMessage below: we call wc.bcast(...) but wc may change
        var wcObject = {};
        var onOpen = function(wc, network, firstConnection) {
            wcObject.wc = wc;
            channel = wc.id;

            onConnect(wc);
            onConnect = function () { };

            // Add the existing peers in the userList
            sframeChan.event('EV_RT_CONNECT', { myID: wc.myID, members: wc.members, readOnly: readOnly });

            // Add the handlers to the WebChannel
            wc.on('message', function (msg, sender) { //Channel msg
                onMessage(sender, msg, wc, network);
            });
            wc.on('join', function (m) { sframeChan.event('EV_RT_JOIN', m); });
            wc.on('leave', function (m) { sframeChan.event('EV_RT_LEAVE', m); });

            if (firstConnection) {
                // Sending a message...
                messageFromInner = function(message, cb) {
                    // Filter messages sent by Chainpad to make it compatible with Netflux
                    message = msgOut(message);
                    if (message) {
                        // Do not remove wcObject, it allows us to use a new 'wc' without changing the handler if we
                        // want to keep the same chainpad (realtime) object
                        try {
                            if (window.Cryptpad_SUPPRESS_MSG) { return; }
                            wcObject.wc.bcast(message).then(function() {
                                if (window.Cryptpad_SUPPRESS_ACK) { return; }
                                cb();
                            }, function(err) {
                                // The message has not been sent, display the error.
                                console.error(err);
                            });
                        } catch (e) {
                            console.log(e);
                            // Just skip calling back and it will fail on the inside.
                        }
                    }
                };
                queue.forEach(function (arr) { messageFromInner(arr[0], arr[1]); });
            }

            // Get the channel history
            if (USE_HISTORY) {
                var hk;

                wc.members.forEach(function (p) {
                    if (p.length === 16) { hk = p; }
                });
                network.historyKeeper = hk;

                var msg = ['GET_HISTORY', wc.id];
                // Add the validateKey if we are the channel creator and we have a validateKey
                msg.push(validateKey);
                msg.push(lastKnownHash);
                if (hk) { network.sendto(hk, JSON.stringify(msg)); }
            } else {
                onReady(wc);
            }
        };

        var isIntentionallyLeaving = false;
        window.addEventListener("beforeunload", function () {
            isIntentionallyLeaving = true;
        });

        var findChannelById = function (webChannels, channelId) {
            var webChannel;

            // Array.some terminates once a truthy value is returned
            // best case is faster than forEach, though webchannel arrays seem
            // to consistently have a length of 1
            webChannels.some(function(chan) {
                if(chan.id === channelId) { webChannel = chan; return true;}
            });
            return webChannel;
        };

        var connectTo = function (network, firstConnection) {
            // join the netflux network, promise to handle opening of the channel
            network.join(channel || null).then(function(wc) {
                onOpen(wc, network, firstConnection);
            }, function(error) {
                console.error(error);
            });
        };

        network.on('disconnect', function (reason) {
            console.log('disconnect');
            if (isIntentionallyLeaving) { return; }
            if (reason === "network.disconnect() called") { return; }
            sframeChan.event('EV_RT_DISCONNECT');
        });

        network.on('reconnect', function () {
            initializing = true;
            connectTo(network, false);
        });

        network.on('message', function (msg, sender) { // Direct message
            var wchan = findChannelById(network.webChannels, channel);
            if (wchan) {
                onMessage(sender, msg, wchan, network, true);
            }
        });

        connectTo(network, true);
    };

    return {
        start: function (config) {
            config.sframeChan.whenReg('EV_RT_READY', function () {
                start(config);
            });
        }
    };
});
