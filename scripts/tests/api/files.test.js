// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// NodeJS API: document content, file upload and download, and the export of
// the drive.
// Usage: npm run test:api (see helpers.js for the requirements)

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const Fs = require('node:fs');
const Os = require('node:os');
const Path = require('node:path');
const H = require('./helpers');

const Hash = require(Path.join(H.ROOT, 'src/common/common-hash'));

describe('NodeJS API: content, files and export', async () => {
    const skip = await H.noServer();
    let api, drive, tmp;
    const findDoc = type => Object.entries(drive.filesData)
        .find(([, d]) => Hash.parsePadUrl(d.href || d.roHref).type === type);

    before(async () => {
        if (skip) { return; }
        api = await H.startStore();
        const login = await H.call(api.account.login, H.USER);
        assert.equal(login.error, undefined);
        ({ drive } = await H.call(api.drive.get, {}));
        tmp = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'cryptpad-api-'));
    });
    after(async () => {
        if (api) { await H.call(api.account.close); }
        if (tmp) { Fs.rmSync(tmp, { recursive: true, force: true }); }
    });

    describe('document content', { skip }, () => {
        it('reads the content of a document from its id', async () => {
            const [id] = findDoc('code');
            const res = await H.call(api.drive.getPadContent, { id: +id });
            assert.equal(res.error, undefined);
            assert.equal(typeof(JSON.parse(res.content).content), 'string');
        });

        it('reads the content of a document from its link', async () => {
            const [, data] = findDoc('kanban');
            const res = await H.call(api.drive.getPadContent, { href: data.href });
            assert.equal(res.error, undefined);
            assert.ok(JSON.parse(res.content).metadata);
        });

        it('reads a document through a safe link', async () => {
            const [, data] = findDoc('kanban');
            const channel = Hash.getSecrets('kanban', Hash.parsePadUrl(data.href).hash).channel;
            const safe = await H.call(api.drive.getPadContent, { href: `/kanban/#/3/kanban/edit/${channel}/` });
            const direct = await H.call(api.drive.getPadContent, { href: data.href });
            assert.equal(safe.error, undefined);
            assert.equal(safe.content, direct.content);
            const unknown = await H.call(api.drive.getPadContent, {
                href: `/kanban/#/3/kanban/edit/${Hash.createChannelId()}/`
            });
            assert.equal(unknown.error, 'ENOENT');
        });

        it('rejects unknown ids, invalid links and files', async () => {
            assert.equal((await H.call(api.drive.getPadContent, { id: 1 })).error, 'ENOENT');
            assert.equal((await H.call(api.drive.getPadContent, { href: 'nonsense' })).error, 'EINVAL');
            assert.equal((await H.call(api.drive.getPadContent, {})).error, 'EINVAL');
            const file = Hash.createRandomHash('file');
            assert.equal((await H.call(api.drive.getPadContent, { href: '/file/#' + file })).error, 'NOT_A_PAD');
        });

        it('refuses to write with a view link', async () => {
            const [, data] = findDoc('code');
            const res = await H.call(api.drive.setPadContent, { href: data.roHref, content: '{}' });
            assert.equal(res.error, 'READ_ONLY');
        });
    });

    describe('files', { skip }, () => {
        let uploaded;
        const bytes = new TextEncoder().encode(`Uploaded by the NodeJS API tests at ${new Date().toISOString()}`);

        it('uploads an encrypted file', async () => {
            uploaded = await H.call(api.drive.uploadFile, {
                data: bytes,
                metadata: { name: 'api-test.txt', type: 'text/plain' }
            });
            assert.equal(uploaded.error, undefined);
            assert.match(uploaded.href, /^\/file\/#\/2\/file\//);
            assert.match(uploaded.channel, /^[0-9a-f]{48}$/);
        });

        it('downloads and decrypts it', async () => {
            const file = await H.call(api.drive.getFile, { href: uploaded.href });
            assert.equal(file.error, undefined);
            assert.deepEqual(file.content, bytes);
            assert.equal(file.metadata.name, 'api-test.txt');
            assert.equal(file.metadata.type, 'text/plain');
            assert.deepEqual(file.metadata.owners, [await H.call(api.account.get, { key: ['edPublic'] })]);
        });

        it('stores an encrypted blob on the server', async () => {
            const secret = Hash.getSecrets('file', Hash.parsePadUrl(uploaded.href).hash);
            const res = await fetch(H.ORIGIN + Hash.getBlobPathFromHex(secret.channel));
            const blob = new Uint8Array(await res.arrayBuffer());
            assert.equal(res.ok, true);
            assert.equal(Buffer.from(blob).includes(Buffer.from(bytes.slice(0, 20))), false);
        });

        it('rejects invalid uploads and downloads', async () => {
            assert.equal((await H.call(api.drive.uploadFile, { data: 'text' })).error, 'EINVAL');
            assert.equal((await H.call(api.drive.getFile, {})).error, 'EINVAL');
            const [, code] = findDoc('code');
            assert.equal((await H.call(api.drive.getFile, { href: code.href })).error, 'NOT_A_FILE');
            const missing = '/file/#' + Hash.createRandomHash('file');
            assert.equal((await H.call(api.drive.getFile, { href: missing })).error, 'ENOENT');
        });
    });

    describe('export', { skip }, () => {
        it('exports the documents of the drive', async () => {
            const dir = Path.join(tmp, 'export');
            const res = await H.call(api.drive.exportTo, { dir });
            assert.equal(res.error, undefined);
            // Documents deleted on the server (e.g. by the end-to-end tests)
            // are reported, not exported
            assert.deepEqual(res.errors.filter(e => e.error !== 'EDELETED'), []);
            const exported = res.documents + res.files + res.links;
            // Documents in the folder tree (not in the trash)
            const count = folder => Object.values(folder).reduce((n, v) =>
                n + (v && typeof(v) === 'object' ? count(v) : (drive.filesData[v] ? 1 : 0)), 0);
            assert.equal(exported + res.errors.length, count(drive.root));
            const names = Fs.readdirSync(dir);
            assert.equal(names.length, exported);
            // Code as text with the extension of its language, other documents as JSON
            assert.ok(names.includes('test code.md'), names.join(', '));
            // Rich text is stored as an array (hyperjson)
            const pad = JSON.parse(Fs.readFileSync(Path.join(dir, 'test pad.pad.json'), 'utf8'));
            assert.ok(Array.isArray(pad));
        });

        it('requires a directory', async () => {
            assert.equal((await H.call(api.drive.exportTo, {})).error, 'EINVAL');
        });
    });
});
