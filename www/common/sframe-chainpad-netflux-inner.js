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
    '/common/sframe-channel.js',
    '/bower_components/chainpad/chainpad.dist.js',
], function (SFrameChannel) {
    var ChainPad = window.ChainPad;
    var module = { exports: {} };

    var verbose = function (x) { console.log(x); };
    verbose = function () {}; // comment out to enable verbose logging

    var mkUserList = function () {
        var userList = Object.freeze({
            change : [],
            onChange : function(newData) {
                userList.change.forEach(function (el) {
                    el(newData);
                });
            },
            users: []
        });

        var onJoining = function (peer) {
            if(peer.length !== 32) { return; }
            var list = userList.users;
            var index = list.indexOf(peer);
            if(index === -1) {
                userList.users.push(peer);
            }
            userList.onChange();
        };

        // update UI components to show that one of the other peers has left
        var onLeaving = function (peer) {
            var list = userList.users;
            var index = list.indexOf(peer);
            if(index !== -1) {
                userList.users.splice(index, 1);
            }
            userList.onChange();
        };

        var onReset = function () {
            userList.users.forEach(onLeaving);
        };

        return Object.freeze({
            list: userList,
            onJoin: onJoining,
            onLeave: onLeaving,
            onReset: onReset
        });
    };

    module.exports.start = function (config) {
        var onConnectionChange = config.onConnectionChange || function () { };
        var onRemote = config.onRemote || function () { };
        var onInit = config.onInit || function () { };
        var onLocal = config.onLocal || function () { };
        var setMyID = config.setMyID || function () { };
        var onReady = config.onReady || function () { };
        var userName = config.userName;
        var initialState = config.initialState;
        var transformFunction = config.transformFunction;
        var validateContent = config.validateContent;
        var avgSyncMilliseconds = config.avgSyncMilliseconds;
        var logLevel = typeof(config.logLevel) !== 'undefined'? config.logLevel : 1;
        var readOnly = config.readOnly || false;
        config = undefined;

        var chainpad;
        var userList = mkUserList();
        var myID;
        var isReady = false;

        SFrameChannel.on('EV_RT_JOIN', userList.onJoin);
        SFrameChannel.on('EV_RT_LEAVE', userList.onLeave);
        SFrameChannel.on('EV_RT_DISCONNECT', function () {
            isReady = false;
            userList.onReset();
            onConnectionChange({ state: false });
        });
        SFrameChannel.on('EV_RT_CONNECT', function (content) {
            content.members.forEach(userList.onJoin);
            myID = content.myID;
            isReady = false;
            if (chainpad) {
                // it's a reconnect
                onConnectionChange({ state: true, myId: myID });
                return;
            }
            chainpad = ChainPad.create({
                userName: userName,
                initialState: initialState,
                transformFunction: transformFunction,
                validateContent: validateContent,
                avgSyncMilliseconds: avgSyncMilliseconds,
                logLevel: logLevel
            });
            chainpad.onMessage(function(message, cb) {
                SFrameChannel.query('Q_RT_MESSAGE', message, cb);
            });
            chainpad.onPatch(function () {
                onRemote({ realtime: chainpad });
            });
            onInit({
                myID: content.myID,
                realtime: chainpad,
                userList: userList,
                readOnly: readOnly
            });
        });
        SFrameChannel.on('Q_RT_MESSAGE', function (content, cb) {
            if (isReady) {
                onLocal(); // should be onBeforeMessage
            }
            chainpad.message(content);
            cb('OK');
        });
        SFrameChannel.on('EV_RT_READY', function () {
            if (isReady) { return; }
            isReady = true;
            chainpad.start();
            setMyID({ myID: myID });
            // Trigger onJoining with our own Cryptpad username to tell the toolbar that we are synced
            if (!readOnly) { userList.onJoin(myID); }
            onReady({ realtime: chainpad });
        });
        return;
    };
    return module.exports;
});