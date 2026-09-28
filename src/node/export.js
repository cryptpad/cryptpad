// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Export a drive to a directory with the NodeJS API: the folder tree of the
// drive (with its shared folders) becomes directories, and each document a
// file:
// - code documents: their text, with the extension of their language
// - markdown slides: .md
// - other documents: their content in CryptPad's format (.<type>.json).
//   Converting them (e.g. rich text to HTML) needs the web app.
// - uploaded files: their decrypted content, with their original name
// - links: .url files
// The trash is not exported.

const Fs = require('node:fs/promises');
const FsSync = require('node:fs');
const Path = require('node:path');
const Util = require('../common/common-util');
const Hash = require('../common/common-hash');

const call = (f, data) => new Promise(resolve => f(data, resolve));

// File extensions of the languages of the code app, from www/common/modes.js
let codeExtensions;
const getCodeExtension = mode => {
    if (!codeExtensions) {
        codeExtensions = {};
        const source = FsSync.readFileSync(Path.join(__dirname, '../../www/common/modes.js'), 'utf8');
        for (const [, m, ext] of source.matchAll(/^\s*"\S+ (\S+) ?(\S*)",?/gm)) {
            codeExtensions[m] = ext === '_' ? '' : ext;
        }
    }
    const ext = codeExtensions[mode || 'gfm'];
    return ext === undefined ? '.txt' : ext;
};

const sanitize = name => (String(name || '').replace(/[\\/?%*:|"<>\x00-\x1f]/g, '_').trim() || 'untitled').slice(0, 200);

// A name that is not used yet in a directory (case insensitive)
const uniqueName = (used, name, ext) => {
    let candidate = name + ext;
    for (let i = 1; used.has(candidate.toLowerCase()); i++) {
        candidate = `${name} (${i})${ext}`;
    }
    used.add(candidate.toLowerCase());
    return candidate;
};

// Content and extension of a document in the export
const convertPad = (type, content) => {
    const doc = Util.tryParse(content);
    if (type === 'code' && typeof(doc?.content) === 'string') {
        return { ext: getCodeExtension(doc.highlightMode), data: doc.content };
    }
    if (type === 'slide' && typeof(doc?.content) === 'string') {
        return { ext: '.md', data: doc.content };
    }
    return { ext: `.${type}.json`, data: content };
};

/*  Export the drive of the logged-in account to `dir`.
    opts.onProgress(path) is called before each document.
    Resolves to { folders, documents, files, links, errors }, where errors
    lists { path, error } for the documents that could not be exported.
*/
const exportDrive = async (api, dir, opts = {}) => {
    const onProgress = opts.onProgress || (() => {});
    const summary = { folders: 0, documents: 0, files: 0, links: 0, errors: [] };

    const { drive, error } = await call(api.drive.get, {});
    if (error) { throw new Error(error); }

    const exportEntry = async (data, dirPath, used) => {
        const href = data.href || data.roHref;
        const parsed = Hash.parsePadUrl(href);
        const title = sanitize(data.filename || data.title);
        const shown = Path.join(dirPath, title);
        onProgress(shown);
        try {
            if (parsed.type === 'file') {
                const file = await call(api.drive.getFile, { href, password: data.password });
                if (file.error) { throw new Error(file.error); }
                const name = sanitize(file.metadata?.name || data.title);
                const ext = Path.extname(name);
                const target = uniqueName(used, name.slice(0, name.length - ext.length), ext);
                await Fs.writeFile(Path.join(dirPath, target), file.content);
                summary.files++;
                return;
            }
            if (parsed.hashData?.type !== 'pad') {
                // A link to an external website
                if (/^https?:/.test(href) && !parsed.hash) {
                    const target = uniqueName(used, title, '.url');
                    await Fs.writeFile(Path.join(dirPath, target), `[InternetShortcut]\nURL=${href}\n`);
                    summary.links++;
                    return;
                }
                throw new Error('UNKNOWN_TYPE');
            }
            const res = await call(api.drive.getPadContent, { href, password: data.password });
            if (res.error) { throw new Error(res.error); }
            const { ext, data: out } = convertPad(parsed.type, res.content);
            const target = uniqueName(used, title, ext);
            await Fs.writeFile(Path.join(dirPath, target), out);
            summary.documents++;
        } catch (e) {
            summary.errors.push({ path: Path.relative(dir, shown) || shown, error: e.message });
        }
    };

    // folder: { name: subfolder object | id }
    // filesData: data of the documents of this drive or shared folder
    const exportFolder = async (folder, dirPath, filesData, sharedFolders) => {
        await Fs.mkdir(dirPath, { recursive: true });
        summary.folders++;
        const used = new Set();
        for (const [key, value] of Object.entries(folder || {})) {
            if (value && typeof(value) === 'object') {
                const name = uniqueName(used, sanitize(key), '');
                await exportFolder(value, Path.join(dirPath, name), filesData, sharedFolders);
                continue;
            }
            // A shared folder
            if (sharedFolders?.[value]) {
                const sf = await call(api.drive.getSharedFolder, { id: value });
                const name = uniqueName(used, sanitize(sharedFolders[value].lastTitle || key), '');
                if (!sf?.root) {
                    summary.errors.push({ path: Path.relative(dir, Path.join(dirPath, name)), error: sf?.error || 'SHARED_FOLDER' });
                    continue;
                }
                await exportFolder(sf.root, Path.join(dirPath, name), sf.filesData || {}, {});
                continue;
            }
            const data = filesData?.[value];
            if (!data) { continue; }
            await exportEntry(data, dirPath, used);
        }
    };

    await exportFolder(drive.root, dir, drive.filesData, drive.sharedFolders);
    return summary;
};

module.exports = { exportDrive, convertPad, getCodeExtension };
