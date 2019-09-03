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
    var verbose = function (x) { console.log(x); };
    verbose = function () {}; // comment out to enable verbose logging

    var unBencode = function (str) { return str.replace(/^\d+:/, ''); };

    var start = function (conf) {
        var channel = conf.channel;
        var Crypto = conf.crypto;
        var isNewHash = conf.isNewHash;
        var readOnly = conf.readOnly || false;
        var padRpc = conf.padRpc;
        var sframeChan = conf.sframeChan;
        var metadata= conf.metadata || {};
        var validateKey = metadata.validateKey;
        var onConnect = conf.onConnect || function () { };
        conf = undefined;

        padRpc.onReadyEvent.reg(function () {
            sframeChan.event('EV_RT_READY', null);
        });

        // shim between chainpad and netflux
        var msgIn = function (peer, msg) {
            try {
                var isHk = peer.length !== 32;
                var key = isNewHash ? validateKey : false;
                var decryptedMsg = Crypto.decrypt(msg, key, isHk);
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
                if (msg.indexOf('[4') === 0) {
                    var id = '';
                    if (window.nacl) {
                        var hash = window.nacl.hash(window.nacl.util.decodeUTF8(msg));
                        id = window.nacl.util.encodeBase64(hash.subarray(0, 8)) + '|';
                    } else {
                        console.log("Checkpoint sent without an ID. Nacl is missing.");
                    }
                    cmsg = 'cp|' + id + cmsg;
                }
                return cmsg;
            } catch (err) {
                console.log(msg);
                throw err;
            }
        };

        sframeChan.on('Q_RT_MESSAGE', function (message, cb) {
            var msg = msgOut(message);
            if (!msg) { return; }
            padRpc.sendPadMsg(msg, cb);
        });

        var onMessage = function(msgObj) {
            if (msgObj.validateKey && !validateKey) {
                validateKey = msgObj.validateKey;
            }
            var message = msgIn(msgObj.user, msgObj.msg);

            verbose(message);

            // slice off the bencoded header
            // Why are we getting bencoded stuff to begin with?
            // FIXME this shouldn't be necessary
            message = unBencode(message);//.slice(message.indexOf(':[') + 1);

            // pass the message into Chainpad
            sframeChan.query('Q_RT_MESSAGE', message, function () { });
        };

        var firstConnection = true;
        var onOpen = function(data) {
            // Add the existing peers in the userList
            onConnect(data.id);
            onConnect = function () {};

            sframeChan.event('EV_RT_CONNECT', { myID: data.myID, members: data.members, readOnly: readOnly });

            if (firstConnection) {
                firstConnection = false;
                // Add the handlers to the WebChannel
                padRpc.onMessageEvent.reg(function (msg) { onMessage(msg); });
                padRpc.onJoinEvent.reg(function (m) { sframeChan.event('EV_RT_JOIN', m); });
                padRpc.onLeaveEvent.reg(function (m) { sframeChan.event('EV_RT_LEAVE', m); });
            }
        };

        padRpc.onDisconnectEvent.reg(function (permanent) {
            sframeChan.event('EV_RT_DISCONNECT', permanent);
        });

        padRpc.onConnectEvent.reg(function (data) {
            onOpen(data);
        });

        padRpc.onMetadataEvent.reg(function (data) {
            sframeChan.event('EV_RT_METADATA', data);
        });

        padRpc.onErrorEvent.reg(function (err) {
            sframeChan.event('EV_RT_ERROR', err);
        });

        // join the netflux network, promise to handle opening of the channel
        padRpc.joinPad({
            channel: channel || null,
            readOnly: readOnly,
            metadata: metadata
        });
    };

    return {
        start: function (config) {
            config.sframeChan.whenReg('EV_RT_READY', function () {
                start(config);
            });
        }
    };
});
