// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// NodeJS API: log in with a password and read the drive.
// Usage: npm run test:api (see helpers.js for the requirements)

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');

describe('NodeJS API: login and drive', async () => {
    const skip = await H.noServer();
    let LoginCore, api, login;

    before(async () => {
        if (skip) { return; }
        LoginCore = await H.getLoginCore();
        api = await H.startStore();
    });
    after(async () => {
        if (login && !login.error) { await H.call(api.account.close); }
    });

    describe('LoginCore.getUserHash errors', { skip }, () => {
        it('rejects an empty username', async () => {
            const { err } = await H.getUserHash(LoginCore, { uname: '', passwd: 'password' });
            assert.equal(err, 'INVAL_USER');
        });

        it('rejects an empty password', async () => {
            const { err } = await H.getUserHash(LoginCore, { uname: H.USER.uname, passwd: '' });
            assert.equal(err, 'INVAL_PASS');
        });

        it('rejects a wrong password as an unknown user', async () => {
            const { err } = await H.getUserHash(LoginCore, { ...H.USER, passwd: H.USER.passwd + 'x' });
            assert.equal(err, 'NO_SUCH_USER');
        });

        it('rejects an unknown user', async () => {
            const { err } = await H.getUserHash(LoginCore, {
                uname: `nobody-${Date.now()}`, passwd: 'password'
            });
            assert.equal(err, 'NO_SUCH_USER');
        });

        it('ignores a session for an account without two-factor authentication', async () => {
            const { err, res } = await H.getUserHash(LoginCore, { ...H.USER, session: 'unused' });
            assert.equal(err, undefined);
            assert.equal(res.auth_token, undefined);
        });

        it('treats usernames as lowercase', async () => {
            const { err, res } = await H.getUserHash(LoginCore, {
                ...H.USER, uname: H.USER.uname.toUpperCase()
            });
            assert.equal(err, undefined);
            assert.match(res.userHash, /^\/\d\/drive\/edit\//);
        });
    });

    describe('api.account and api.drive', { skip }, () => {
        it('refuses a second login while one is running', async () => {
            // The first login fails (wrong password), the second is refused
            const [first, second] = await Promise.all([
                H.call(api.account.login, { ...H.USER, passwd: H.USER.passwd + 'x' }),
                H.call(api.account.login, H.USER)
            ]);
            assert.equal(first.error, 'NO_SUCH_USER');
            assert.equal(second.error, 'ALREADY_LOGGED_IN');
        });

        it('logs in and loads the drive after a failed login', async () => {
            login = await H.call(api.account.login, H.USER);
            assert.equal(login.error, undefined);
            assert.equal(login.loggedIn, true);
            assert.equal(typeof(login.edPublic), 'string');
            // Only accounts with two-factor authentication get a session
            assert.equal(login.session, undefined);
        });

        it('refuses to log in again in the same process', async () => {
            const again = await H.call(api.account.login, H.USER);
            assert.equal(again.error, 'ALREADY_LOGGED_IN');
        });

        it('reads values of the user object', async () => {
            const edPublic = await H.call(api.account.get, { key: ['edPublic'] });
            assert.equal(edPublic, login.edPublic);
        });

        it('reports that the drive exists', async () => {
            assert.deepEqual(await H.call(api.drive.exists, {}), { state: true });
        });

        it('lists the documents of the drive', async () => {
            const { drive, error } = await H.call(api.drive.get, {});
            assert.equal(error, undefined);
            const ids = Object.values(drive.root).filter(id => typeof(id) !== 'object');
            assert.ok(ids.length > 0, 'the drive of the test user has documents');
            ids.forEach(id => {
                assert.ok(drive.filesData[id] || drive.sharedFolders?.[id], `data for ${id}`);
            });
        });

        it('returns the data of a document', async () => {
            const { drive } = await H.call(api.drive.get, {});
            const id = Object.values(drive.root).find(id => drive.filesData[id]);
            const data = await H.call(api.drive.getPadData, id);
            assert.equal(data.href, drive.filesData[id].href);
            assert.equal(data.title, drive.filesData[id].title);
        });

        it('answers with an error when a command fails', async () => {
            // GET_PAD_DATA throws for an unknown id
            const res = await H.call(api.drive.getPadData, undefined);
            assert.equal(res?.error, 'EXCEPTION');
        });

        it('returns nothing for an unknown shared folder', async () => {
            const res = await H.call(api.drive.getSharedFolder, { id: 123456789 });
            assert.deepEqual(res, {});
        });

        it('waits for pending changes and disconnects', async () => {
            assert.equal(await H.call(api.account.sync, {}), undefined);
            await H.call(api.account.close);
            login = undefined;
        });
    });
});
