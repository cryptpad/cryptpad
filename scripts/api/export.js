// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Export a drive to a directory, see src/node/export.js for the formats.
//
// Usage: npm run api && node scripts/api/export.js <username> <directory>
// The password is read from CRYPTPAD_PASSWORD. See cli.js for the other
// environment variables.

const Fs = require('node:fs');
const { out, err, call, login, run } = require('./cli');

const [ uname, dir ] = process.argv.slice(2);
if (!uname || !dir) {
    out('Usage: CRYPTPAD_PASSWORD=... node scripts/api/export.js <username> <directory>');
    process.exit(1);
}

run(async () => {
    if (Fs.existsSync(dir) && Fs.readdirSync(dir).length) {
        throw new Error(`${dir} is not empty`);
    }
    const api = await login(uname);
    const res = await call(api.drive.exportTo, {
        dir,
        onProgress: path => err(`  ${path}`)
    });
    if (res.error) { throw new Error(`Export failed: ${res.error}`); }
    out(`Exported ${res.documents} documents, ${res.files} files and ${res.links} links in ${res.folders} folders to ${dir}`);
    res.errors.forEach(e => err(`Not exported: ${e.path} (${e.error})`));
    await call(api.account.close);
    if (res.errors.length) { process.exitCode = 2; }
});
