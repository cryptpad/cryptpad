// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/* global importScripts */

const Interface = require('./interface');
let start = (setConfig) => {
    let ready = false;
    let closeStore = () => {
        globalThis.close();
    };
    let initBuild = (cfg) => {
        if (ready) { return; }
        setConfig(cfg);
        Interface.init(closeStore);
        ready = true;
    };
    globalThis.window = globalThis;
    addEventListener('connect', (e) => {
        console.error("TEST");
        console.debug('New SharedWorker client');
        const port = e.ports[0];
        const postMsg = (data) => { port.postMessage(data); };
        console.error(port);
        let connected = false;
        let onMsg;
        let onClose = () => {};

        port.onmessage = function (e) {
            if (e.data?.type === 'INIT') {
                // Initialize build
                let cfg = e.data.cfg;
                initBuild(cfg);
                // Initialize client
                if (connected) { return; }
                connected = true;
                Interface.initClient({
                    postMsg
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

module.exports = { start };

