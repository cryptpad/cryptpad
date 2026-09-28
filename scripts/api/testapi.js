// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Smoke test for the NodeJS API: log in and list the root of the drive.
//
// Usage: npm run api && node scripts/api/testapi.js <username> [<password>]
// See cli.js for the environment variables (instance, password, session).

const { out, call, login, run } = require('./cli');

const [ uname, passwd ] = process.argv.slice(2);
if (!uname) {
    out('Usage: node scripts/api/testapi.js <username> [<password>]');
    process.exit(1);
}

run(async () => {
    const api = await login(uname, passwd);
    out(`Logged in as ${uname}`);

    const { drive, error } = await call(api.drive.get, {});
    if (error) { throw new Error(`Can't load the drive: ${error}`); }
    const root = drive.root || {};
    const names = Object.keys(root).map(key => {
        const id = root[key];
        if (typeof(id) === 'object') { return `${key}/`; }
        const data = drive.filesData?.[id] || drive.sharedFolders?.[id];
        return data?.title || data?.lastTitle || key;
    });
    out(`Drive root (${names.length}):`);
    names.forEach(name => out(`  ${name}`));

    await call(api.account.close);
});
