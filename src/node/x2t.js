// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// File conversion with x2t, OnlyOffice's converter compiled to WebAssembly,
// in NodeJS. It is installed with the office editors by install-office.sh
// into www/common/onlyoffice/dist/x2t/. The web app runs the same module in
// the browser, see www/common/outer/x2t.js.

const Fs = require('node:fs');
const Path = require('node:path');

const X2T_DIR = Path.join(__dirname, '../../www/common/onlyoffice/dist/x2t');

let loading;
const load = () => {
    if (loading) { return loading; }
    const file = Path.join(X2T_DIR, 'x2t.js');
    if (!Fs.existsSync(file)) {
        return Promise.reject(new Error('X2T_NOT_INSTALLED'));
    }
    loading = new Promise(resolve => {
        const x2t = require(file);
        const init = () => {
            ['/working', '/working/media', '/working/fonts', '/working/themes'].forEach(dir => {
                try { x2t.FS.mkdir(dir); } catch { /* exists */ }
            });
            resolve(x2t);
        };
        if (x2t.calledRun) { return void init(); }
        x2t.onRuntimeInitialized = init;
    });
    return loading;
};

const isAvailable = () => Fs.existsSync(Path.join(X2T_DIR, 'x2t.js'));

// Remove the files of the previous conversion
const clean = (x2t, dir) => {
    x2t.FS.readdir(dir).forEach(name => {
        if (name === '.' || name === '..') { return; }
        const path = `${dir}/${name}`;
        if (x2t.FS.isDir(x2t.FS.stat(path).mode)) { return; }
        x2t.FS.unlink(path);
    });
};

const run = (x2t, fileName, data, outputFormat) => {
    x2t.FS.writeFile(`/working/${fileName}`, data);
    const output = `/working/${fileName}.${outputFormat}`;
    const params = '<?xml version="1.0" encoding="utf-8"?>' +
        '<TaskQueueDataConvert xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
        'xmlns:xsd="http://www.w3.org/2001/XMLSchema">' +
        `<m_sFileFrom>/working/${fileName}</m_sFileFrom>` +
        '<m_sThemeDir>/working/themes</m_sThemeDir>' +
        `<m_sFileTo>${output}</m_sFileTo>` +
        '<m_bIsNoBase64>false</m_bIsNoBase64>' +
        '</TaskQueueDataConvert>';
    x2t.FS.writeFile('/working/params.xml', params);
    x2t.ccall('main1', 'number', ['string'], ['/working/params.xml']);
    try {
        return x2t.FS.readFile(output);
    } catch {
        throw new Error('CONVERSION_FAILED');
    }
};

// Open Document files are converted to the Microsoft Office format first,
// like in the web app
const INTERMEDIATE = { odt: 'docx', ods: 'xlsx', odp: 'pptx' };

/*  Convert an office file to OnlyOffice's internal format (.bin), which is
    what CryptPad stores in the checkpoints of office documents.
    Resolves to { bin, images }: images are the media files of the document
    as { name, data } (Uint8Array).
*/
const toBin = async (data, fileName) => {
    const x2t = await load();
    clean(x2t, '/working');
    clean(x2t, '/working/media');
    let name = fileName.replace(/[/\\?<>:*|"&'%!{}[\]\x00-\x1f]/g, '') || 'file';
    let ext = name.split('.').pop().toLowerCase();
    if (INTERMEDIATE[ext]) {
        data = run(x2t, name, data, INTERMEDIATE[ext]);
        name = `${name}.${INTERMEDIATE[ext]}`;
    }
    const bin = run(x2t, name, data, 'bin');
    if (!bin?.length) { throw new Error('CONVERSION_FAILED'); }
    const images = x2t.FS.readdir('/working/media')
        .filter(file => file !== '.' && file !== '..')
        .map(file => ({ name: file, data: x2t.FS.readFile(`/working/media/${file}`) }));
    return { bin, images };
};

module.exports = { toBin, isAvailable, X2T_DIR };
