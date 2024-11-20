// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/* global importScripts */

const Interface = require('./interface');
const Util = require('../../common/common-util');
let start = (setConfig) => {
    let ready = false;
    let closed = false;
    let onMsg;
    const sendMsgEv = Util.mkEvent();
    const closeStore = () => { closed = true; };
    const onMessage = (f) => {
        sendMsgEv.reg((data) => {
            setTimeout(() => {
                f(data);
            });
        });
    };
    const postMsg = (data) => {
        if (closed) { return; }
        sendMsgEv.fire(data);
    };
    const query = (data) => {
        if (!onMsg || closed) { return; }
        onMsg.fire({data, origin:''});
    };

    let init = (cfg) => {
        if (ready) { return; }
        setConfig(cfg);
        Interface.init(closeStore);
        ready = true;
        Interface.initClient({
            postMsg
        }, function (_onMsg) {
            onMsg = _onMsg;
            postMsg('STORE_READY');
        });
    };
    return {
        init,
        onMessage,
        query
    };
};

module.exports = { start };


