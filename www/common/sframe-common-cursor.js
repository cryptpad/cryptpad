// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/common/common-util.js',
], function (Util) {
    var module = {};

    module.create = function (Common, onLocal) {
        var exp = {};
        var metadataMgr = Common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        var share = Util.find(privateData, ['settings', 'general', 'cursor', 'share']);
        var show = Util.find(privateData, ['settings', 'general', 'cursor', 'show']);

        var messageHandlers = [];
        exp.onCursorUpdate = function (handler) {
            messageHandlers.push(handler);
        };
        var onMessage = function (data) {
            if (show === false) { return; }
            messageHandlers.forEach(function (h) {
                try {
                    h(data);
                } catch (e) {
                    console.error(e);
                }
            });
        };

        var onDegraded = function (data) {
            if (data.degraded) {
                // Enter degraded mode
                onMessage({
                    reset: true
                });
                metadataMgr.setDegraded(true);
                return void metadataMgr.refresh();
            }

            setTimeout(function () {
                metadataMgr.setDegraded(false);
                metadataMgr.refresh();
                setTimeout(onLocal);
            });
        };

        var onEvent = function (obj) {
            var cmd = obj.ev;
            var data = obj.data;
            if (cmd === 'DEGRADED') {
                onDegraded(data);
                return;
            }
            if (cmd === 'MESSAGE') {
                onMessage(data);
                return;
            }
        };

        var module = Common.makeUniversal('cursor', {
            onEvent: onEvent
        });
        var execCommand = module.execCommand;

        exp.updateCursor = function (obj) {
            if (share === false) { return; }
            execCommand('UPDATE', obj, function (err) {
                if (err) { console.error(err); }
            });
        };

        return exp;
    };

    return module;
});


