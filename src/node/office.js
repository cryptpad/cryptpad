// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Import an office file (.pptx, .docx, .xlsx, ...) into an existing office
// document, like File > Import in the web app (www/common/onlyoffice/inner.js):
// the file is converted to OnlyOffice's internal format with x2t, its images
// and the converted document are uploaded encrypted, and the document gets a
// new checkpoint pointing to them. Editors that have the document open
// reload it.

const Util = require('../common/common-util');
const Hash = require('../common/common-hash');
const CurrentVersion = require('../common/onlyoffice/current-version');
const X2T = require('./x2t');
const Upload = require('./upload');

const call = (f, data) => new Promise(resolve => f(data, resolve));

// Formats that can be imported into each type of office document, and the
// format the web app uses for the name of the checkpoint file
const FORMATS = {
    presentation: { name: 'pptx', import: ['pptx', 'ppt', 'odp', 'bin'] },
    doc: { name: 'docx', import: ['docx', 'doc', 'odt', 'txt', 'rtf', 'bin'] },
    sheet: { name: 'xlsx', import: ['xlsx', 'xls', 'ods', 'csv', 'bin'] }
};

const IMAGE_TYPES = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
    svg: 'image/svg+xml', webp: 'image/webp', bmp: 'image/bmp', emf: 'image/emf', wmf: 'image/wmf' };
const imageType = name => IMAGE_TYPES[name.split('.').pop().toLowerCase()] || 'application/octet-stream';

// Checkpoint indexes are numbers stored as keys
const lastIndex = hashes => Object.keys(hashes || {})
    .map(Number).filter(n => !isNaN(n)).reduce((a, b) => Math.max(a, b), 0);

// Links from the "safe links" setting (/3/) only contain the channel: the
// keys are in the drive of the account
const resolveSafeLink = async (api, parsed) => {
    const data = await call(api.drive.getPadDataFromChannel, {
        channel: parsed.hashData.channel,
        edit: true
    });
    if (!data?.href) { throw new Error(data?.roHref ? 'READ_ONLY' : 'ENOENT'); }
    return data;
};

/*  opts:
      href      edit link of the office document (or `id` in the drive);
                "safe links" (/3/) are looked up in the drive
      password  password of the document, if any
      data      Uint8Array with the file to import
      fileName  its name, used for the format (e.g. "slides.pptx")
    Resolves to { checkpoint, file, images }: the index of the new
    checkpoint, the link of its file and the number of uploaded images.
    Rejects with an Error whose message is an error code.
*/
const importFile = async (api, ApiConfig, opts) => {
    const { data, fileName = '' } = opts;
    if (!(data instanceof Uint8Array) || !data.length) { throw new Error('EINVAL'); }

    let href = opts.href;
    let password = opts.password;
    if (!href && opts.id !== undefined) {
        const padData = await call(api.drive.getPadData, opts.id);
        href = padData?.href;
        password = padData?.password;
        if (!href) { throw new Error(padData?.roHref ? 'READ_ONLY' : 'ENOENT'); }
    }
    let parsed = typeof(href) === 'string' && Hash.parsePadUrl(href);
    if (!parsed?.hash || parsed.hashData?.type !== 'pad') { throw new Error('EINVAL'); }
    if (parsed.hashData.version === 3) {
        ({ href, password } = await resolveSafeLink(api, parsed));
        parsed = Hash.parsePadUrl(href);
    }
    const format = FORMATS[parsed.type];
    if (!format) { throw new Error('NOT_AN_OFFICE_DOCUMENT'); }
    if (parsed.hashData.mode !== 'edit') { throw new Error('READ_ONLY'); }
    const ext = fileName.split('.').pop().toLowerCase();
    if (!format.import.includes(ext)) { throw new Error('UNSUPPORTED_FORMAT'); }
    const secret = Hash.getSecrets(parsed.type, parsed.hash, password);

    // Current content of the document
    const current = await call(api.drive.getPadContent, { href, password });
    if (current?.error) { throw new Error(current.error); }
    const doc = Util.tryParse(current.content);
    // Documents that were never opened don't have their initial content yet
    if (!doc?.content) { throw new Error('NOT_INITIALIZED'); }
    const content = doc.content;

    // Convert
    let bin = data, images = [];
    if (ext !== 'bin') {
        ({ bin, images } = await X2T.toBin(data, fileName));
    }

    // Upload the images; the converted document refers to them by name
    content.mediasSources = content.mediasSources || {};
    for (const image of images) {
        const uploaded = await Upload.uploadFile(api, ApiConfig, {
            data: image.data,
            metadata: { name: image.name, type: imageType(image.name) }
        });
        content.mediasSources[image.name] = {
            name: image.name,
            src: Upload.getBlobUrl(ApiConfig, uploaded.channel),
            key: Util.encodeBase64(uploaded.key)
        };
    }

    // Upload the converted document as a new checkpoint
    const title = doc.metadata?.title || doc.metadata?.defaultTitle || 'document';
    const file = await Upload.uploadFile(api, ApiConfig, {
        data: bin,
        metadata: { name: `${title}.${format.name}`, type: 'plain/text' },
        linked: secret.channel
    });
    const index = lastIndex(content.hashes) + 1;
    const checkpoint = {
        file: file.href,
        rtChannel: Hash.createChannelId(),
        version: CurrentVersion.currentVersionNumber
    };
    content.hashes = content.hashes || {};
    content.hashes[index] = checkpoint;
    // The editors of the previous checkpoint are gone
    content.locks = {};
    content.ids = {};
    delete content.saveLock;
    // The whole document is now in the current format: older documents
    // would otherwise be opened with an older editor to migrate them
    content.version = CurrentVersion.currentVersionNumber;
    delete content.migration;

    const saved = await call(api.drive.setPadContent, {
        href, password, content: JSON.stringify(doc)
    });
    if (saved?.error) { throw new Error(saved.error); }

    // Register the checkpoint with the server, like the web app. Failures are
    // not fatal there either.
    const linked = await call(api.universal.execCommand, {
        type: 'linked-doc',
        data: {
            cmd: 'ADD_LINKED_DATA',
            data: {
                channel: secret.channel,
                signKey64: secret.keys.signKey,
                content: {
                    type: 'checkpoints',
                    data: { rtChannel: checkpoint.rtChannel, blob: file.channel }
                }
            }
        }
    });
    if (linked?.error) { console.error('ADD_LINKED_DATA', linked.error); }

    return { checkpoint: index, file: file.href, images: images.length };
};

module.exports = { importFile, FORMATS };
