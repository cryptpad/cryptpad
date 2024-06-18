// Copyright 2014 XWiki SAS
// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

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
        var versionHash = conf.versionHash;
        var validateKey = metadata.validateKey;
        var onConnect = conf.onConnect || function () { };
        var onError = conf.onError || function () { };
        var onReady = conf.onReady || function () { };
        var lastTime; // Time of last patch (if versioned link);
        conf = undefined;

        if (versionHash) { readOnly = true; }

        padRpc.onReadyEvent.reg(function () {
            sframeChan.event('EV_RT_READY', null);
            onReady();
            if (lastTime && versionHash) {
                sframeChan.event('EV_VERSION_TIME', lastTime);
            }
        });

        // shim between chainpad and netflux
        var msgIn = function (peer, msg) {
            try {
                if (/^\[/.test(msg)) { return msg; } // Already decrypted
                var isHk = peer.length !== 32;
                var key = isNewHash ? validateKey : false;
                var decryptedMsg = Crypto.decrypt(msg, key, isHk);
                return decryptedMsg;
            } catch (err) {
                console.error(err);
                console.warn(peer, msg);
                return false;
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
            if (!message) { return; }
            lastTime = msgObj.time;

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
                padRpc.onJoinEvent.reg(function (m) { sframeChan.event('EV_RT_JOIN', m); });
                padRpc.onLeaveEvent.reg(function (m) { sframeChan.event('EV_RT_LEAVE', m); });
            }
        };

        padRpc.onMessageEvent.reg(function (msg) { onMessage(msg); });

        padRpc.onDisconnectEvent.reg(function (permanent) {
            sframeChan.event('EV_RT_DISCONNECT', permanent);
        });

        padRpc.onCacheReadyEvent.reg(function () {
            sframeChan.event('EV_RT_CACHE_READY');
        });

        padRpc.onCacheEvent.reg(function () {
            sframeChan.event('EV_RT_CACHE');
        });

        padRpc.onConnectEvent.reg(function (data) {
            onOpen(data);
        });

        padRpc.onMetadataEvent.reg(function (data) {
            sframeChan.event('EV_RT_METADATA', data);
        });

        padRpc.onErrorEvent.reg(function (err) {
            onError(err);
            sframeChan.event('EV_RT_ERROR', err);
        });

        // join the netflux network, promise to handle opening of the channel
        padRpc.joinPad({
            channel: channel || null,
            readOnly: readOnly,
            versionHash: versionHash,
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
