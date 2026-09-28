// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// NodeJS API: import an office file into an office document.
// The tests import into the first presentation of CRYPTPAD_TEST_USER and
// restore its content at the end. They need x2t, installed by
// install-office.sh.
// Usage: npm run test:api (see helpers.js for the requirements)

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const Fs = require('node:fs');
const Path = require('node:path');
const H = require('./helpers');

const Hash = require(Path.join(H.ROOT, 'src/common/common-hash'));
const Util = require(Path.join(H.ROOT, 'src/common/common-util'));
const FileCrypto = require(Path.join(H.ROOT, 'www/file/file-crypto'));
const X2T = require(Path.join(H.ROOT, 'src/node/x2t'));
const CurrentVersion = require(Path.join(H.ROOT, 'src/common/onlyoffice/current-version'));

const fixture = new Uint8Array(Fs.readFileSync(Path.join(__dirname, 'fixtures/two-slides.pptx')));

const decryptBlob = async (url, key) => {
    const res = await fetch(url);
    assert.equal(res.ok, true, `GET ${url}`);
    const u8 = new Uint8Array(await res.arrayBuffer());
    const file = await new Promise((resolve, reject) => {
        FileCrypto.decrypt(u8, key, (err, file) => err ? reject(new Error(err)) : resolve(file));
    });
    return new Uint8Array(await file.content.arrayBuffer());
};

describe('NodeJS API: import office files', async () => {
    const skip = await H.noServer() ||
        (!X2T.isAvailable() && 'x2t is not installed (run install-office.sh)');
    let api, presentation, original;
    const getContent = async () => JSON.parse((await H.call(api.drive.getPadContent, { href: presentation.href })).content);

    before(async () => {
        if (skip) { return; }
        api = await H.startStore();
        const login = await H.call(api.account.login, H.USER);
        assert.equal(login.error, undefined);
        const { drive } = await H.call(api.drive.get, {});
        presentation = Object.values(drive.filesData)
            .find(d => d.href && Hash.parsePadUrl(d.href).type === 'presentation');
        assert.ok(presentation, `${H.USER.uname} has a presentation`);
        original = (await H.call(api.drive.getPadContent, { href: presentation.href })).content;
    });

    after(async () => {
        if (original) {
            const res = await H.call(api.drive.setPadContent, { href: presentation.href, content: original });
            assert.equal(res.error, undefined, 'restored the presentation');
        }
        if (api) { await H.call(api.account.close); }
    });

    let result, before_;
    it('imports a .pptx file as a new checkpoint', { skip }, async () => {
        before_ = (await getContent()).content;
        result = await H.call(api.office.importFile, {
            href: presentation.href, data: fixture, fileName: 'two-slides.pptx'
        });
        assert.equal(result.error, undefined);
        const previous = Math.max(0, ...Object.keys(before_.hashes || {}).map(Number));
        assert.equal(result.checkpoint, previous + 1);
        assert.equal(result.images, 1);
    });

    it('updates the document', { skip }, async () => {
        const content = (await getContent()).content;
        const cp = content.hashes[result.checkpoint];
        assert.equal(cp.file, result.file);
        assert.match(cp.rtChannel, /^[0-9a-f]{32}$/);
        assert.equal(cp.version, CurrentVersion.currentVersionNumber);
        assert.equal(content.version, CurrentVersion.currentVersionNumber);
        assert.deepEqual(content.locks, {});
        assert.deepEqual(content.ids, {});
        // The realtime channel of the document itself doesn't change
        assert.equal(content.channel, before_.channel);
    });

    it('stores the converted document encrypted', { skip }, async () => {
        const secret = Hash.getSecrets('file', Hash.parsePadUrl(result.file).hash);
        const bin = await decryptBlob(H.ORIGIN + Hash.getBlobPathFromHex(secret.channel), secret.keys.cryptKey);
        // OnlyOffice's internal format for presentations
        assert.equal(Buffer.from(bin.slice(0, 5)).toString('latin1'), 'PPTY;');
    });

    it('stores the images encrypted', { skip }, async () => {
        const content = (await getContent()).content;
        const sources = Object.values(content.mediasSources);
        const image = sources.find(s => /^image\d*\.png$/.test(s.name));
        assert.ok(image, JSON.stringify(sources.map(s => s.name)));
        const png = await decryptBlob(image.src, Util.decodeBase64(image.key));
        assert.deepEqual([...png.slice(1, 4)], [...Buffer.from('PNG')]);
    });

    it('registers the checkpoint with the server', { skip }, async () => {
        const content = (await getContent()).content;
        const cp = content.hashes[result.checkpoint];
        const secret = Hash.getSecrets('presentation', Hash.parsePadUrl(presentation.href).hash);
        const linked = await H.call(api.universal.execCommand, {
            type: 'linked-doc',
            data: { cmd: 'GET_LINKED_DATA', data: { channel: secret.channel } }
        });
        const blob = Hash.getSecrets('file', Hash.parsePadUrl(cp.file).hash).channel;
        assert.ok(linked.checkpoints?.some(c => c.rtChannel === cp.rtChannel && c.blob === blob),
            JSON.stringify(linked));
    });

    it('accepts a safe link', { skip }, async () => {
        const channel = Hash.getSecrets('presentation', Hash.parsePadUrl(presentation.href).hash).channel;
        const res = await H.call(api.office.importFile, {
            href: `/presentation/#/3/presentation/edit/${channel}/`, data: fixture, fileName: 'two-slides.pptx'
        });
        assert.equal(res.error, undefined);
        assert.equal(res.checkpoint, result.checkpoint + 1);
    });

    it('rejects invalid imports', { skip }, async () => {
        const importFile = data => H.call(api.office.importFile, data);
        const base = { href: presentation.href, data: fixture, fileName: 'two-slides.pptx' };
        assert.equal((await importFile({ ...base, data: new Uint8Array() })).error, 'EINVAL');
        assert.equal((await importFile({ ...base, fileName: 'notes.txt' })).error, 'UNSUPPORTED_FORMAT');
        assert.equal((await importFile({ ...base, href: presentation.roHref })).error, 'READ_ONLY');
        const { drive } = await H.call(api.drive.get, {});
        const code = Object.values(drive.filesData).find(d => Hash.parsePadUrl(d.href).type === 'code');
        assert.equal((await importFile({ ...base, href: code.href })).error, 'NOT_AN_OFFICE_DOCUMENT');
        const unknown = '/presentation/#/3/presentation/edit/' + Hash.createChannelId() + '/';
        assert.equal((await importFile({ ...base, href: unknown })).error, 'ENOENT');
    });

    it('reports a file that can\'t be converted', { skip }, async () => {
        const res = await H.call(api.office.importFile, {
            href: presentation.href, data: new TextEncoder().encode('not a presentation'), fileName: 'broken.pptx'
        });
        assert.equal(res.error, 'CONVERSION_FAILED');
    });
});
