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
    '/common/common-util.js',
    '/customize/application_config.js',
    '/bower_components/chainpad/chainpad.dist.js'
], function (Util, AppConfig, ChainPad) {
    var module = { exports: {} };

    var badStateTimeout = typeof(AppConfig.badStateTimeout) === 'number' ?
        AppConfig.badStateTimeout : 30000;

    var verbose = function (x) { console.log(x); };
    verbose = function () {}; // comment out to enable verbose logging

    module.exports.start = function (config) {
        var onConnectionChange = config.onConnectionChange || function () { };
        var onRemote = config.onRemote || function () { };
        var onInit = config.onInit || function () { };
        var onLocal = config.onLocal || function () { };
        var setMyID = config.setMyID || function () { };
        var onReady = config.onReady || function () { };
        var onError = config.onError || function () { };
        var userName = config.userName;
        var initialState = config.initialState;
        if (config.transformFunction) { throw new Error("transformFunction is nolonger allowed"); }
        var patchTransformer = config.patchTransformer;
        var validateContent = config.validateContent;
        var avgSyncMilliseconds = config.avgSyncMilliseconds;
        var logLevel = typeof(config.logLevel) !== 'undefined'? config.logLevel : 1;
        var readOnly = config.readOnly || false;
        var sframeChan = config.sframeChan;
        var metadataMgr = config.metadataMgr;
        var updateLoadingProgress = config.updateLoadingProgress;
        config = undefined;

        var chainpad = ChainPad.create({
            userName: userName,
            initialState: initialState,
            patchTransformer: patchTransformer,
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

        var myID;
        var isReady = false;
        var isHistory = 1;
        var evConnected = Util.mkEvent(true);
        var evInfiniteSpinner = Util.mkEvent(true);

        window.setInterval(function () {
            if (!chainpad || !myID) { return; }
            var l;
            try {
                l = chainpad.getLag();
            } catch (e) {
                throw new Error("ChainPad.getLag() does not exist, please `bower update`");
            }
            if (l.lag < badStateTimeout) { return; }
            evInfiniteSpinner.fire();
        }, 2000);

        sframeChan.on('EV_RT_DISCONNECT', function (isPermanent) {
            isReady = false;
            chainpad.abort();
            // Permanent flag is here to choose if we wnat to display
            // "reconnecting" or "disconnected" in the toolbar state
            onConnectionChange({ state: false, permanent: isPermanent });
        });
        sframeChan.on('EV_RT_ERROR', function (err) {
            isReady = false;
            chainpad.abort();
            onError(err);
        });
        sframeChan.on('EV_RT_CONNECT', function (content) {
            //content.members.forEach(userList.onJoin);
            isReady = false;
            if (myID) {
                // it's a reconnect
                myID = content.myID;
                chainpad.start();
                onConnectionChange({ state: true, myId: myID });
                return;
            }
            myID = content.myID;
            onInit({
                myID: myID,
                realtime: chainpad,
                readOnly: readOnly
            });
            evConnected.fire();
        });
        sframeChan.on('Q_RT_MESSAGE', function (content, cb) {
            if (isReady) {
                onLocal(true); // should be onBeforeMessage
            }
            chainpad.message(content);
            if (isHistory && updateLoadingProgress) {
                updateLoadingProgress({
                    state: 2,
                    progress: isHistory
                }, false);
                isHistory++;
            }
            cb('OK');
        });
        sframeChan.on('EV_RT_READY', function () {
            if (isReady) { return; }
            isReady = true;
            isHistory = false;
            chainpad.start();
            setMyID({ myID: myID });
            onReady({ realtime: chainpad });
        });

        var whenRealtimeSyncs = function (cb) {
            evConnected.reg(function () {
                if (chainpad.getAuthDoc() === chainpad.getUserDoc()) {
                    return void cb();
                } else {
                    chainpad.onSettle(cb);
                }
            });
        };

        return Object.freeze({
            getMyID: function () { return myID; },
            metadataMgr: metadataMgr,
            whenRealtimeSyncs: whenRealtimeSyncs,
            onInfiniteSpinner: evInfiniteSpinner.reg,
            chainpad: chainpad,
        });
    };
    return Object.freeze(module.exports);
});
