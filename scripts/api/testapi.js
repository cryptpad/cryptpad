// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const Messages = require('../../src/messages');
const AppConfig = require('../../customize/application_config');
//const App = require('./_build/worker.bundle');
const Store = require('../../www/common/store-interface');
const Http = require('node:http');


let start = ApiConfig => {
    App.start(ApiConfig, AppConfig, Keys);
};

let getApi = (file, cb) => {
    Http.get(`http://localhost:3000/api/${file}`, res => {
        let body = '';
        res.on('data', data => { body += data; });
        res.on('end', () => {
            try {
                cb(JSON.parse(body.slice(27,-5)));
            } catch (e) {
                console.error(e);
            }
        });
    });
};


getApi('config', ApiConfig => {
    getApi('broadcast', Broadcast => {
        Store({
            AppConfig,
            ApiConfig,
            Messages,
            Broadcast
        }).then((store) => {
            console.log('API added to global "CP"');
            const api = globalThis.CP = store.api;
            const cfg = { channel: '0123456789abcdef0123456789abcedf' };
            api.pad.join(cfg, console.log);
        });
    });
});
