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
        var validateKey = conf.validateKey;
        var readOnly = conf.readOnly || false;
        var padRpc = conf.padRpc;
        var sframeChan = conf.sframeChan;
        var password = conf.password;
        var owners = conf.owners;
        var expire = conf.expire;
        var onConnect = conf.onConnect || function () { };
        conf = undefined;

        padRpc.onReadyEvent.reg(function () {
            sframeChan.event('EV_RT_READY', null);
        });

        // shim between chainpad and netflux
        var msgIn = function (msg) {
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

        sframeChan.on('Q_RT_MESSAGE', function (message, cb) {
            var msg = msgOut(message);
            if (!msg) { return; }
            padRpc.sendPadMsg(msg, cb);
        });

        var onMessage = function(msg) {
            var message = msgIn(msg);

            verbose(message);

            // slice off the bencoded header
            // Why are we getting bencoded stuff to begin with?
            // FIXME this shouldn't be necessary
            message = unBencode(message);//.slice(message.indexOf(':[') + 1);

            // pass the message into Chainpad
            sframeChan.query('Q_RT_MESSAGE', message, function () { });
        };

        var onOpen = function(data) {
            // Add the existing peers in the userList
            onConnect(data.id);
            onConnect = function () {};

            sframeChan.event('EV_RT_CONNECT', { myID: data.myID, members: data.members, readOnly: readOnly });

            // Add the handlers to the WebChannel
            padRpc.onMessageEvent.reg(function (msg) { onMessage(msg); });
            padRpc.onJoinEvent.reg(function (m) { sframeChan.event('EV_RT_JOIN', m); });
            padRpc.onLeaveEvent.reg(function (m) { sframeChan.event('EV_RT_LEAVE', m); });
        };

        padRpc.onDisconnectEvent.reg(function () {
            sframeChan.event('EV_RT_DISCONNECT');
        });

        // join the netflux network, promise to handle opening of the channel
        padRpc.joinPad({
            channel: channel || null,
            validateKey: validateKey,
            readOnly: readOnly,
            owners: owners,
            password: password,
            expire: expire
        }, function(data) {
            onOpen(data);
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
