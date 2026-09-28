// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Commands of the NodeJS API (www/common/store-interface.js) that run in
// NodeJS instead of the store: login, file transfers, export and import.
// Like the other commands, they take (data, cb) and call cb with the
// result or { error }.

const Hash = require('../common/common-hash');
const LoginCore = require('../common/login-core');
const FileCrypto = require('../../www/file/file-crypto');
const Upload = require('./upload');
const Export = require('./export');
const Office = require('./office');

const callback = cb => typeof(cb) === 'function' ? cb : () => {};

// Run an async function and report its result or error to cb
const toCallback = (promise, cb) => {
    promise.then(res => cb(res), e => {
        if (!/^[A-Z0-9_]+$/.test(e?.message || '')) { console.error(e); }
        cb({ error: e?.message || String(e) });
    });
};

const extend = (api, { AppConfig, ApiConfig }) => {
    LoginCore.setCustomize({ AppConfig, ApiConfig });

    // Log in with a username and password and load the user's drive:
    // api.account.login({ uname, passwd, onOTP, session }, cb)
    // onOTP(cb, info) is only needed for accounts with two-factor
    // authentication, see LoginCore.getUserHash. The result has a
    // `session` token for such accounts: pass it to the next login
    // to skip the code while the session is valid.
    // The store holds a single account: log in only once.
    let loginState; // undefined, 'pending' or 'done'
    api.account.login = (credentials, _cb) => {
        const cb = callback(_cb);
        if (loginState) { return void cb({ error: 'ALREADY_LOGGED_IN' }); }
        loginState = 'pending';
        const fail = error => {
            loginState = undefined;
            cb({ error });
        };
        LoginCore.getUserHash(credentials, (err, res) => {
            if (err) { return void fail(err); }
            api.account.load({
                userHash: res.userHash,
                driveEvents: false
            }, loaded => {
                if (loaded?.error) { return void fail(loaded.error); }
                // The store was already connected (to another
                // account or anonymously) by account.load
                if (loaded?.state === 'ALREADY_INIT') {
                    return void fail('ALREADY_LOGGED_IN');
                }
                loginState = 'done';
                cb(Object.assign({}, loaded, {
                    session: res.auth_token?.bearer
                }));
            });
        });
    };

    // Wait for pending changes to be stored, then disconnect:
    // api.account.close(data, cb) like the other commands, or
    // api.account.close(cb)
    // The realtime objects of the drive keep timers running, so
    // scripts should exit the process after closing.
    api.account.close = (data, cb) => {
        if (typeof(data) === 'function') { cb = data; }
        cb = callback(cb);
        api.account.sync({}, () => {
            api.account.disconnect({}, cb);
        });
    };

    // Download and decrypt an uploaded file, from its id in the drive
    // or its href (and password):
    // api.drive.getFile({ id } or { href, password }, cb)
    // cb({ metadata, content }), content is a Uint8Array
    api.drive.getFile = (data, _cb) => {
        const cb = callback(_cb);
        const download = (href, password) => {
            const parsed = Hash.parsePadUrl(href);
            if (!parsed?.hash) { return void cb({ error: 'EINVAL' }); }
            if (parsed.hashData?.type !== 'file') { return void cb({ error: 'NOT_A_FILE' }); }
            const secret = Hash.getSecrets('file', parsed.hash, password);
            const key = secret.keys?.cryptKey;
            const url = Upload.getBlobUrl(ApiConfig, secret.channel);
            fetch(url).then(res => {
                if (res.status === 404) { return void cb({ error: 'ENOENT' }); }
                if (!res.ok) { return void cb({ error: 'SERVER_ERROR' }); }
                return res.arrayBuffer().then(buffer => {
                    FileCrypto.decrypt(new Uint8Array(buffer), key, (err, file) => {
                        if (err) { return void cb({ error: err }); }
                        file.content.arrayBuffer().then(content => {
                            cb({ metadata: file.metadata, content: new Uint8Array(content) });
                        });
                    });
                });
            }).catch(() => {
                cb({ error: 'NETWORK_ERROR' });
            });
        };
        if (typeof(data?.href) === 'string') { return void download(data.href, data.password); }
        if (data?.id === undefined) { return void cb({ error: 'EINVAL' }); }
        api.drive.getPadData(data.id, padData => {
            const href = padData?.href || padData?.roHref;
            if (!href) { return void cb({ error: 'ENOENT' }); }
            download(href, padData.password);
        });
    };

    // Upload an encrypted file, without adding it to the drive:
    // api.drive.uploadFile({ data, metadata: { name, type }, owned, linked, password }, cb)
    // cb({ href, channel }), see src/node/upload.js
    api.drive.uploadFile = (data, _cb) => {
        toCallback(Upload.uploadFile(api, ApiConfig, data || {}).then(res => ({
            href: res.href,
            channel: res.channel
        })), callback(_cb));
    };

    // Export the drive to a directory:
    // api.drive.exportTo({ dir, onProgress }, cb)
    // cb({ folders, documents, files, links, errors }), see src/node/export.js
    api.drive.exportTo = (data, _cb) => {
        const cb = callback(_cb);
        if (typeof(data?.dir) !== 'string') { return void cb({ error: 'EINVAL' }); }
        toCallback(Export.exportDrive(api, data.dir, data), cb);
    };

    // Import an office file into an office document, as a new checkpoint:
    // api.office.importFile({ href or id, password, data, fileName }, cb)
    // cb({ checkpoint, file, images }), see src/node/office.js
    api.office = api.office || {};
    api.office.importFile = (data, _cb) => {
        toCallback(Office.importFile(api, ApiConfig, data || {}), callback(_cb));
    };
};

module.exports = { extend };
