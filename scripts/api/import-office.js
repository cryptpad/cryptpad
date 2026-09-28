// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Import an office file into an existing office document (presentation,
// document or spreadsheet), like File > Import in the web app. The document
// keeps its link and history; editors that have it open reload it.
//
// Usage: npm run api && node scripts/api/import-office.js <username> <document link> <file>
// The link must be an edit link, e.g. https://cryptpad.fr/presentation/#/2/presentation/edit/...
// The password is read from CRYPTPAD_PASSWORD. See cli.js for the other
// environment variables. The converter is installed by install-office.sh.

const Fs = require('node:fs');
const Path = require('node:path');
const { out, call, login, run } = require('./cli');

const [ uname, link, file ] = process.argv.slice(2);
if (!uname || !link || !file) {
    out('Usage: CRYPTPAD_PASSWORD=... node scripts/api/import-office.js <username> <document link> <file>');
    process.exit(1);
}

run(async () => {
    const data = new Uint8Array(Fs.readFileSync(file));
    const api = await login(uname);
    const res = await call(api.office.importFile, {
        href: link,
        data,
        fileName: Path.basename(file),
        password: process.env.CRYPTPAD_DOCUMENT_PASSWORD
    });
    if (res.error) { throw new Error(`Import failed: ${res.error}`); }
    out(`Imported ${Path.basename(file)} as checkpoint ${res.checkpoint} (${res.images} images)`);
    await call(api.account.close);
});
