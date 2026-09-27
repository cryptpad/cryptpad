// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Helpers for the tests of the store in NodeJS (www/common/store-interface.js).
//
// The store runs from the worker bundle: run "npm run api" after changing
// src/worker. Tests that need a server run against a running instance with
// the seed data of the end-to-end test suite
// (https://github.com/cryptpad/e2e-test-suite), by default the dev server,
// and are skipped when there is none. Environment variables:
//   CRYPTPAD_URL                  instance (default http://localhost:3000)
//   CRYPTPAD_TEST_USER/_PASSWORD  account with documents at the root of its
//                                 drive (default test-user / password)
//   CRYPTPAD_TEST_TOTP_USER/_PASSWORD  account on which the tests enable and
//                                 then disable 2FA (default test-user3 / password)
// Don't run them at the same time as the end-to-end suite, which uses the same
// accounts.

const Fs = require('node:fs');
const Path = require('node:path');
const OTPAuth = require('otpauth');

const ROOT = Path.join(__dirname, '../../..');
const ORIGIN = (process.env.CRYPTPAD_URL || 'http://localhost:3000').replace(/\/$/, '');

const USER = {
    uname: process.env.CRYPTPAD_TEST_USER || 'test-user',
    passwd: process.env.CRYPTPAD_TEST_PASSWORD || 'password'
};
const TOTP_USER = {
    uname: process.env.CRYPTPAD_TEST_TOTP_USER || 'test-user3',
    passwd: process.env.CRYPTPAD_TEST_TOTP_PASSWORD || 'password'
};

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

// The store is a single instance per process and holds a single account:
// each test file (run in its own process by node --test) can start it and
// log in only once
const startStore = async opts => {
    const Store = require(Path.join(ROOT, 'www/common/store-interface'));
    const { api } = await Store(await getConfig(opts));
    return api;
};

// LoginCore with the instance's configuration
const getLoginCore = async () => {
    const LoginCore = require(Path.join(ROOT, 'src/common/login-core'));
    const { AppConfig, ApiConfig } = await getConfig();
    LoginCore.setCustomize({ AppConfig, ApiConfig });
    return LoginCore;
};

// Call a callback-style API function; reject if it doesn't answer in time
// (logging in and loading a drive can take a while)
const call = (f, data, timeout = 60000) => new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('NO_ANSWER')), timeout);
    f(data, res => {
        clearTimeout(t);
        resolve(res);
    });
});
const getUserHash = (LoginCore, config) => new Promise(resolve => {
    LoginCore.getUserHash(config, (err, res) => resolve({ err, res }));
});

const totp = secret => new OTPAuth.TOTP({ secret }).generate();

module.exports = {
    ROOT, ORIGIN, USER, TOTP_USER,
    noBundle, noServer, getConfig, startStore, getLoginCore, call, getUserHash, totp
};
