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
    '/common/metadata-manager.js',
    '/bower_components/chainpad/chainpad.dist.js'
], function (MetadataMgr) {
    var ChainPad = window.ChainPad;
    var module = { exports: {} };

    var verbose = function (x) { console.log(x); };
    verbose = function () {}; // comment out to enable verbose logging

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
        var sframeChan = config.sframeChan;
        config = undefined;

        var chainpad;
        var myID;
        var isReady = false;

        var metadataMgr = MetadataMgr.create(sframeChan);

        sframeChan.on('EV_RT_DISCONNECT', function () {
            isReady = false;
            onConnectionChange({ state: false });
        });
        sframeChan.on('EV_RT_CONNECT', function (content) {
            //content.members.forEach(userList.onJoin);
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
                sframeChan.query('Q_RT_MESSAGE', message, cb);
            });
            chainpad.onPatch(function () {
                onRemote({ realtime: chainpad });
            });
            onInit({
                myID: myID,
                realtime: chainpad,
                readOnly: readOnly
            });
        });
        sframeChan.on('Q_RT_MESSAGE', function (content, cb) {
            if (isReady) {
                onLocal(); // should be onBeforeMessage
            }
            chainpad.message(content);
            cb('OK');
        });
        sframeChan.on('EV_RT_READY', function () {
            if (isReady) { return; }
            isReady = true;
            chainpad.start();
            setMyID({ myID: myID });
            onReady({ realtime: chainpad });
        });
        return Object.freeze({
            getMyID: function () { return myID; },
            metadataMgr: metadataMgr
        });
    };
    return Object.freeze(module.exports);
});