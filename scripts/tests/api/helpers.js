// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Helpers for the tests of the store in NodeJS (www/common/store-interface.js).
//
// The store runs from the worker bundle: run "npm run api" after changing
// src/worker. Tests that need a server run against a running instance, by
// default the dev server (CRYPTPAD_URL, default http://localhost:3000), and
// are skipped when there is none.

const Fs = require('node:fs');
const Path = require('node:path');

const ROOT = Path.join(__dirname, '../../..');
const ORIGIN = (process.env.CRYPTPAD_URL || 'http://localhost:3000').replace(/\/$/, '');

// /api/config and /api/broadcast are AMD modules returning an object literal
const getApi = async file => {
    const res = await fetch(`${ORIGIN}/api/${file}`);
    if (!res.ok) { throw new Error(`GET /api/${file}: ${res.status}`); }
    const body = await res.text();
    return JSON.parse(body.replace(/^define\(function\(\)\{;?\s*return\s*/, '')
                          .replace(/;?\s*\}\);?\s*$/, ''));
};

const noBundle = () => {
    if (Fs.existsSync(Path.join(ROOT, 'www/common/worker.bundle.js'))) { return false; }
    return 'the worker bundle is missing, run "npm run api" first';
};

// Reason to skip the tests that need a server, or false when they can run
const noServer = async () => {
    if (noBundle()) { return noBundle(); }
    try {
        if ((await fetch(`${ORIGIN}/api/config`)).ok) { return false; }
    } catch { /* not running */ }
    return `no CryptPad instance at ${ORIGIN} (start one with "npm run dev")`;
};

const getAppConfig = () => {
    const customConfig = Path.join(ROOT, 'customize/application_config.js');
    return require(Fs.existsSync(customConfig) ? customConfig :
        Path.join(ROOT, 'customize.dist/application_config.js'));
};

// Configuration of the running instance, or of an unreachable one
const getConfig = async ({ offline } = {}) => ({
    AppConfig: getAppConfig(),
    ApiConfig: offline ? {
        httpUnsafeOrigin: 'http://127.0.0.1:1',
        websocketPath: '/cryptpad_websocket'
    } : await getApi('config'),
    Broadcast: offline ? {} : await getApi('broadcast'),
    Messages: require(Path.join(ROOT, 'src/messages'))
});

// The store is a single instance per process: each test file (run in its
// own process by node --test) can start it only once
const startStore = async opts => {
    const Store = require(Path.join(ROOT, 'www/common/store-interface'));
    const { api } = await Store(await getConfig(opts));
    return api;
};

// Call a callback-style API function; reject if it doesn't answer in time
const call = (f, data, timeout = 5000) => new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('NO_ANSWER')), timeout);
    f(data, res => {
        clearTimeout(t);
        resolve(res);
    });
});

module.exports = { ROOT, ORIGIN, noBundle, noServer, getConfig, startStore, call };
