// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/* global importScripts */

const Interface = require('./interface');


let start = () => {
    Interface.init();
    addEventListener('connect', (e) => {
        console.error("TEST");
        console.debug('New SharedWorker client');
        const port = e.ports[0];
        const postMsg = (data) => { port.postMessage(data); };
        let init = false;
        let onMsg;
        let onClose = () => {};

        port.onmessage = function (e) {
            if (e.data === "INIT") {
                if (init) { return; }
                init = true;
                Interface.initClient({
                    onMsg
                }, function (_onMsg, _onClose) {
                    onMsg = _onMsg;
                    onClose = _onClose;
                    postMsg('SW_READY');
                });
            } else if (e.data === "CLOSE") {
                console.debug('leave');
                onClose();
            } else if (onMsg) {
                onMsg.fire(e);
            }
        };
    });
}

module.exports = start;

