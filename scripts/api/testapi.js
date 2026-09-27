// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Smoke test for the NodeJS API: log in and list the root of the drive.
//
// Usage: npm run api && node scripts/api/testapi.js <username> <password>
// The instance defaults to http://localhost:3000, set CRYPTPAD_URL to change it.
// Accounts with two-factor authentication are asked for a code; the session
// token printed after logging in can be passed as CRYPTPAD_SESSION to skip it.

const Fs = require('node:fs');
const Path = require('node:path');
const Readline = require('node:readline/promises');
const Messages = require('../../src/messages');
const Store = require('../../www/common/store-interface');

// Use the instance's customized application config if there is one
const customConfig = Path.join(__dirname, '../../customize/application_config.js');
const AppConfig = require(Fs.existsSync(customConfig) ? customConfig :
    '../../customize.dist/application_config');

const origin = process.env.CRYPTPAD_URL || 'http://localhost:3000';
const [ uname, passwd ] = process.argv.slice(2);
if (!uname || !passwd) {
    console.error('Usage: node scripts/api/testapi.js <username> <password>');
    process.exit(1);
}

// /api/config and /api/broadcast are AMD modules returning an object literal
const getApi = async (file) => {
    const res = await fetch(`${origin}/api/${file}`);
    if (!res.ok) { throw new Error(`GET /api/${file}: ${res.status}`); }
    const body = await res.text();
    const json = body.replace(/^define\(function\(\)\{;?\s*return\s*/, '')
                     .replace(/;?\s*\}\);?\s*$/, '');
    return JSON.parse(json);
};

const promisify = f => data => new Promise(resolve => f(data, resolve));

// Read codes line by line; the iterator buffers lines, so piped input works too
let rl, lines;
const onOTP = async (cb, { error }) => {
    if (!rl) {
        rl = Readline.createInterface({ input: process.stdin });
        lines = rl[Symbol.asyncIterator]();
    }
    if (error) { console.log('Invalid code, try again.'); }
    process.stdout.write('TOTP code (empty to cancel): ');
    const { value } = await lines.next();
    cb(value?.trim());
};

(async () => {
    const ApiConfig = await getApi('config');
    const Broadcast = await getApi('broadcast');
    const { api } = await Store({ AppConfig, ApiConfig, Messages, Broadcast });

    const session = process.env.CRYPTPAD_SESSION;
    const res = await promisify(api.account.login)({ uname, passwd, onOTP, session });
    rl?.close();
    if (res?.error) { throw new Error(`Login failed: ${res.error}`); }
    console.log(`Logged in as ${uname}`);
    if (res.session && res.session !== session) {
        console.log(`Session token: CRYPTPAD_SESSION=${res.session}`);
    }

    const { drive, error } = await promisify(api.drive.get)({});
    if (error) { throw new Error(`Can't load the drive: ${error}`); }
    const root = drive.root || {};
    const names = Object.keys(root).map(key => {
        const id = root[key];
        if (typeof(id) === 'object') { return `${key}/`; }
        const data = drive.filesData?.[id] || drive.sharedFolders?.[id];
        return data?.title || data?.lastTitle || key;
    });
    console.log(`Drive root (${names.length}):`);
    names.forEach(name => console.log(`  ${name}`));

    await new Promise(resolve => api.account.close(resolve));
    process.exit(0);
})().catch(err => {
    console.error(err.message || err);
    process.exit(1);
});
