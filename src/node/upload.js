// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Encrypted file upload for the NodeJS API, like www/common/outer/upload.js
// in the web app: the file is encrypted with a new random key, sent in
// chunks to /upload-blob/ and pinned to the account.

const Nacl = require('tweetnacl/nacl-fast');
const Util = require('../common/common-util');
const Hash = require('../common/common-hash');
const ServerCommand = require('../common/outer/http-command');
const FileCrypto = require('../../www/file/file-crypto');

const call = (f, data) => new Promise(resolve => f(data, resolve));

// Origin of the blob store of the instance
const getFileHost = ApiConfig => {
    return new URL(ApiConfig.fileHost || ApiConfig.httpUnsafeOrigin).origin;
};

const serverCommand = (keys, data) => new Promise((resolve, reject) => {
    ServerCommand(keys, data, (err, res) => {
        if (err) { return void reject(new Error(res?.error || String(err))); }
        resolve(res);
    });
});

/*  Upload a file:
      data      Uint8Array with the content
      metadata  { name, type }: file name and MIME type, stored encrypted
      owned     make the account an owner of the file (default true)
      linked    channel of the document the file belongs to (checkpoints)
      password  optional password for the file link
    Resolves to { href, channel, key } where key is the encryption key.
    Rejects with an Error whose message is an error code.
*/
const uploadFile = async (api, ApiConfig, opts) => {
    const { data, owned = true, linked, password } = opts;
    if (!(data instanceof Uint8Array)) { throw new Error('EINVAL'); }
    const metadata = Object.assign({}, opts.metadata);

    // A new random link whose blob doesn't exist yet
    let hash, secret, href;
    for (let i = 0; ; i++) {
        if (i === 5) { throw new Error('NO_FREE_ID'); }
        hash = Hash.createRandomHash('file', password);
        secret = Hash.getSecrets('file', hash, password);
        href = '/file/#' + hash;
        const res = await call(api.drive.getFileSize, { href, password });
        if (res?.error) { throw new Error(res.error); }
        if (res?.size === 0) { break; }
    }
    const id = secret.channel;
    const key = secret.keys.cryptKey;

    const edPublic = await call(api.account.get, { key: ['edPublic'] });
    const edPrivate = await call(api.account.get, { key: ['edPrivate'] });
    if (!edPublic || !edPrivate) { throw new Error('NOT_LOGGED_IN'); }
    const keys = {
        publicKey: Util.decodeBase64(edPublic),
        secretKey: Util.decodeBase64(edPrivate)
    };
    if (owned) { metadata.owners = [edPublic]; }

    const size = FileCrypto.computeEncryptedSize(data.length, metadata);
    const status = await call(api.upload.status, { id, linked, size });
    if (status?.error) { throw new Error(status.error); }
    // A pending upload (e.g. from an interrupted script) blocks new ones
    if (status === true || status?.[0] === true) {
        const cancelled = await call(api.upload.cancel, { id, size });
        if (cancelled?.error) { throw new Error(cancelled.error); }
    }

    // Each chunk is sent with a signature of the cookie from the previous answer
    let { cookie } = await serverCommand(keys, { command: 'UPLOAD_COOKIE', id });
    if (!cookie) { throw new Error('NOCOOKIE'); }
    const url = `${getFileHost(ApiConfig)}/upload-blob/${id.slice(0, 2)}/${id}`;
    const sendChunk = async box => {
        const sig = Nacl.sign(Util.decodeUTF8(cookie), keys.secretKey);
        let res;
        try {
            res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chunk: Util.encodeBase64(box),
                    sig: Util.encodeBase64(sig),
                    edPublic
                })
            });
        } catch {
            throw new Error('NETWORK_ERROR');
        }
        const json = await res.json().catch(() => ({ error: `HTTP_${res.status}` }));
        if (json?.error) { throw new Error(json.error); }
        cookie = json.cookie;
    };

    const next = FileCrypto.encrypt(data, metadata, key);
    for (;;) {
        const box = await new Promise((resolve, reject) => {
            next((err, box) => err ? reject(new Error(err)) : resolve(box));
        });
        if (!box) { break; }
        await sendChunk(box);
    }

    const complete = await call(api.upload.complete, { id, owned });
    if (complete?.error) { throw new Error(complete.error); }
    return { href, channel: id, key };
};

// URL of the encrypted file, as stored in the "mediasSources" of office documents
const getBlobUrl = (ApiConfig, channel) => getFileHost(ApiConfig) + Hash.getBlobPathFromHex(channel);

module.exports = { uploadFile, getBlobUrl, getFileHost };
