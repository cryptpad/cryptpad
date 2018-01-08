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
        var validateKey = conf.validateKey;
        var readOnly = conf.readOnly || false;
        var network = conf.network;
        var onConnect = conf.onConnect || function () { };
        var onMessage = conf.onMessage;
        var onJoin = conf.onJoin;
        var onLeave = conf.onLeave;
        var onReady = conf.onReady;
        var onDisconnect = conf.onDisconnect;
        var owners = conf.owners;
        var password = conf.password;
        var expire = conf.expire;
        var padData;
        conf = undefined;

        var initializing = true;
        var lastKnownHash;

        var messageFromOuter = function () {};

        var onRdy = function (padData) {
            // Trigger onReady only if not ready yet. This is important because the history keeper sends a direct
            // message through "network" when it is synced, and it triggers onReady for each channel joined.
            if (!initializing) { return; }
            onReady(padData);
            //sframeChan.event('EV_RT_READY', null);
            // we're fully synced
            initializing = false;
        };

        // shim between chainpad and netflux
        var msgIn = function (peerId, msg) {
            return msg.replace(/^cp\|/, '');

            /*try {
                var decryptedMsg = Crypto.decrypt(msg, validateKey);
                return decryptedMsg;
            } catch (err) {
                console.error(err);
                return msg;
            }*/
        };

        var msgOut = function (msg) {
            if (readOnly) { return; }
            return msg;
            /*try {
                var cmsg = Crypto.encrypt(msg);
                if (msg.indexOf('[4') === 0) { cmsg = 'cp|' + cmsg; }
                return cmsg;
            } catch (err) {
                console.log(msg);
                throw err;
            }*/
        };

        var onMsg = function(peer, msg, wc, network, direct) {
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
                    padData = parsed;
                    // We have to return even if it is not the current channel:
                    // we don't want to continue with other channels messages here
                    return;
                }
                if (parsed.state && parsed.state === 1 && parsed.channel) {
                    if (parsed.channel === wc.id) {
                        onRdy(padData);
                    }
                    // We have to return even if it is not the current channel:
                    // we don't want to continue with other channels messages here
                    return;
                }
            }
            if (peer === hk) {
                // if the peer is the 'history keeper', extract their message
                var parsed1 = JSON.parse(msg);
                msg = parsed1[4];
                // Check that this is a message for our channel
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
            onMessage(message);
            //sframeChan.query('Q_RT_MESSAGE', message, function () { });
        };

        // We use an object to store the webchannel so that we don't have to push new handlers to chainpad
        // and remove the old ones when reconnecting and keeping the same 'realtime' object
        // See realtime.onMessage below: we call wc.bcast(...) but wc may change
        var wcObject = {};
        var onOpen = function(wc, network, firstConnection) {
            wcObject.wc = wc;
            channel = wc.id;

            // Add the existing peers in the userList
            //TODO sframeChan.event('EV_RT_CONNECT', { myID: wc.myID, members: wc.members, readOnly: readOnly });

            // Add the handlers to the WebChannel
            wc.on('message', function (msg, sender) { //Channel msg
                onMsg(sender, msg, wc, network);
            });
            wc.on('join', function (m) { onJoin(m); /*sframeChan.event('EV_RT_JOIN', m);*/ });
            wc.on('leave', function (m) { onLeave(m); /*sframeChan.event('EV_RT_LEAVE', m);*/ });

            if (firstConnection) {
                // Sending a message...
                 messageFromOuter = function(message, cb) {
                    // Filter messages sent by Chainpad to make it compatible with Netflux
                    message = msgOut(message);
                    if (message) {
                        // Do not remove wcObject, it allows us to use a new 'wc' without changing the handler if we
                        // want to keep the same chainpad (realtime) object
                        try {
                            wcObject.wc.bcast(message).then(function() {
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
            }

            onConnect(wc, messageFromOuter);

            // Get the channel history
            if (USE_HISTORY) {
                var hk;

                wc.members.forEach(function (p) {
                    if (p.length === 16) { hk = p; }
                });
                network.historyKeeper = hk;

                var cfg = {
                    validateKey: validateKey,
                    lastKnownHash: lastKnownHash,
                    owners: owners,
                    expire: expire,
                    password: password
                };
                padData = cfg;
                var msg = ['GET_HISTORY', wc.id, cfg];
                // Add the validateKey if we are the channel creator and we have a validateKey
                if (hk) { network.sendto(hk, JSON.stringify(msg)); }
            } else {
                onRdy();
            }
        };

        /*var isIntentionallyLeaving = false;
        window.addEventListener("beforeunload", function () {
            isIntentionallyLeaving = true;
        });*/

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
            //if (isIntentionallyLeaving) { return; }
            if (reason === "network.disconnect() called") { return; }
            onDisconnect();
            //sframeChan.event('EV_RT_DISCONNECT');
        });

        network.on('reconnect', function () {
            initializing = true;
            connectTo(network, false);
        });

        network.on('message', function (msg, sender) { // Direct message
            var wchan = findChannelById(network.webChannels, channel);
            if (wchan) {
                onMsg(sender, msg, wchan, network, true);
            }
        });

        connectTo(network, true);
    };

    return {
        start: start
        /*function (config) {
            config.sframeChan.whenReg('EV_RT_READY', function () {
                start(config);
            });
        }*/
    };
});

