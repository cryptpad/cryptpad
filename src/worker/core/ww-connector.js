// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const Interface = require('./interface');
let start = (setConfig) => {
    let onMsg;
    let ready = false;
    const closeStore = () => {
        globalThis.close();
    };
    const postMsg = (data) => { postMessage(data); };

    globalThis.window = globalThis;
    onmessage = function (e) {
        if (e.data?.type === 'INIT') {
            // Initialize build
            let cfg = e.data.cfg;
            if (ready) { return; }
            setConfig(cfg);
            Interface.init(closeStore);
            ready = true;
            Interface.initClient({
                postMsg
            }, function (_onMsg) {
                onMsg = _onMsg;
                postMsg('WW_READY');
            });
            return;
        }
        if (!onMsg) { return; }
        onMsg.fire(e);
    };
};

module.exports = { start };


