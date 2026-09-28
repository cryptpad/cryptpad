// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Shared code of the command line scripts of the NodeJS API: load the store
// with the configuration of the instance and log in.
//
// Environment variables:
//   CRYPTPAD_URL       instance (default http://localhost:3000)
//   CRYPTPAD_PASSWORD  password, if it isn't given on the command line
//   CRYPTPAD_SESSION   session token of an earlier login with a TOTP code
//   CRYPTPAD_DEBUG=1   show the log messages of the store

const Fs = require('node:fs');
const Path = require('node:path');
const Readline = require('node:readline/promises');

const ROOT = Path.join(__dirname, '../..');
const origin = (process.env.CRYPTPAD_URL || 'http://localhost:3000').replace(/\/$/, '');

// Stop quietly when the output is closed early, e.g. piped into head
process.stdout.on('error', e => { if (e.code === 'EPIPE') { process.exit(0); } });

// The store logs to the console; keep the output of the scripts readable
const out = (...args) => process.stdout.write(args.join(' ') + '\n');
const err = (...args) => process.stderr.write(args.join(' ') + '\n');
if (process.env.CRYPTPAD_DEBUG !== '1') {
    ['log', 'debug', 'info', 'warn', 'error'].forEach(level => { console[level] = () => {}; });
}

// /api/config and /api/broadcast are AMD modules returning an object literal
const getApi = async (file) => {
    let res;
    try {
        res = await fetch(`${origin}/api/${file}`);
    } catch {
        throw new Error(`Can't reach ${origin}`);
    }
    if (!res.ok) { throw new Error(`GET ${origin}/api/${file}: ${res.status}`); }
    const body = await res.text();
    return JSON.parse(body.replace(/^define\(function\(\)\{;?\s*return\s*/, '')
                          .replace(/;?\s*\}\);?\s*$/, ''));
};

const call = (f, data) => new Promise(resolve => f(data, resolve));

// Read TOTP codes line by line; the iterator buffers lines, so piped input works too
let rl, lines;
const onOTP = async (cb, { error }) => {
    if (!rl) {
        rl = Readline.createInterface({ input: process.stdin });
        lines = rl[Symbol.asyncIterator]();
    }
    if (error) { err('Invalid code, try again.'); }
    process.stderr.write('TOTP code (empty to cancel): ');
    const { value } = await lines.next();
    cb(value?.trim());
};

const start = async () => {
    const customConfig = Path.join(ROOT, 'customize/application_config.js');
    const AppConfig = require(Fs.existsSync(customConfig) ? customConfig :
        Path.join(ROOT, 'customize.dist/application_config.js'));
    const Messages = require(Path.join(ROOT, 'src/messages'));
    if (!Fs.existsSync(Path.join(ROOT, 'www/common/worker.bundle.js'))) {
        throw new Error('The worker bundle is missing, run "npm run api" first');
    }
    const Store = require(Path.join(ROOT, 'www/common/store-interface'));
    const { api } = await Store({
        AppConfig,
        ApiConfig: await getApi('config'),
        Broadcast: await getApi('broadcast'),
        Messages
    });
    return api;
};

// Start the store and log in; exits with a message on errors
const login = async (uname, passwd) => {
    passwd = passwd || process.env.CRYPTPAD_PASSWORD;
    const api = await start();
    const session = process.env.CRYPTPAD_SESSION;
    const res = await call(api.account.login, { uname, passwd, onOTP, session });
    rl?.close();
    if (res?.error) { throw new Error(`Login failed: ${res.error}`); }
    if (res.session && res.session !== session) {
        err(`Session token: CRYPTPAD_SESSION=${res.session}`);
    }
    return api;
};

// Run a script: report errors and exit (the store keeps timers running)
const run = async (main) => {
    try {
        await main();
        process.exit(process.exitCode || 0);
    } catch (e) {
        err(e.message || e);
        process.exit(1);
    }
};

module.exports = { ROOT, origin, out, err, call, start, login, run };
