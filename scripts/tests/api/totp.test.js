// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// NodeJS API: log in to an account with two-factor authentication (TOTP).
// The tests enable TOTP on CRYPTPAD_TEST_TOTP_USER and disable it at the end.
// Usage: npm run test:api (see helpers.js for the requirements)

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const Path = require('node:path');
const OTPAuth = require('otpauth');
const H = require('./helpers');

const Cred = require(Path.join(H.ROOT, 'src/common/common-credential'));
const ServerCommand = require(Path.join(H.ROOT, 'src/common/outer/http-command'));

const serverCommand = (keys, data) => new Promise((resolve, reject) => {
    ServerCommand(keys, data, (err, res) => err ? reject(new Error(`${data.command}: ${err}`)) : resolve(res));
});

describe('NodeJS API: two-factor authentication', async () => {
    let skip = await H.noServer();
    let LoginCore, blockKeys, secret, api, login;
    const code = () => H.totp(secret);
    const account = H.TOTP_USER;

    before(async () => {
        if (skip) { return; }
        LoginCore = await H.getLoginCore();
        // Don't touch an account that already uses two-factor authentication
        const { err } = await H.getUserHash(LoginCore, account);
        if (err) {
            skip = `${account.uname} can't be used for this test: ${err}`;
            return;
        }
        const bytes = await new Promise(resolve => {
            Cred.deriveFromPassphrase(account.uname, account.passwd, LoginCore.requiredBytes, resolve);
        });
        blockKeys = LoginCore.allocateBytes(bytes).blockKeys;
        secret = new OTPAuth.Secret().base32;
        await serverCommand(blockKeys.sign, {
            command: 'TOTP_SETUP', secret, code: code(), contact: 'secret:api-test', session: ''
        });
    });

    after(async () => {
        if (login && !login.error) { await H.call(api.account.close); }
        if (!secret) { return; }
        await serverCommand(blockKeys.sign, { command: 'TOTP_REVOKE', code: code() });
        const { err } = await H.getUserHash(LoginCore, account);
        assert.equal(err, undefined, 'two-factor authentication is disabled again');
    });

    // `it` options are evaluated before `before` runs, so check `skip` in each test
    const test = (name, fn) => it(name, async t => {
        if (skip) { return void t.skip(skip); }
        await fn();
    });

    test('requires a code when no onOTP callback is given', async () => {
        const { err } = await H.getUserHash(LoginCore, account);
        assert.equal(err, 'TOTP_REQUIRED');
    });

    test('can be cancelled', async () => {
        const { err } = await H.getUserHash(LoginCore, { ...account, onOTP: cb => cb() });
        assert.equal(err, 'TOTP_CANCELLED');
    });

    test('asks again after a wrong code, up to three times', async () => {
        const calls = [];
        const { err } = await H.getUserHash(LoginCore, {
            ...account,
            onOTP: (cb, info) => { calls.push(info); cb('000000'); }
        });
        assert.equal(err, 'TOTP_ATTEMPTS_EXHAUSTED');
        assert.deepEqual(calls, [
            { attempt: 1, error: undefined },
            { attempt: 2, error: 'INVALID_OTP' },
            { attempt: 3, error: 'INVALID_OTP' }
        ]);
    });

    let session;
    test('logs in with a correct code after a wrong one', async () => {
        const codes = ['000000', code()];
        const { err, res } = await H.getUserHash(LoginCore, {
            ...account, onOTP: cb => cb(codes.shift())
        });
        assert.equal(err, undefined);
        assert.equal(codes.length, 0);
        assert.match(res.userHash, /^\/\d\/drive\/edit\//);
        assert.equal(typeof(res.auth_token?.bearer), 'string');
        session = res.auth_token.bearer;
    });

    test('reuses a session without asking for a code', async () => {
        const { err, res } = await H.getUserHash(LoginCore, {
            ...account, session, onOTP: () => assert.fail('asked for a code')
        });
        assert.equal(err, undefined);
        assert.equal(res.auth_token.bearer, session);
    });

    test('asks for a code when the session is invalid', async () => {
        let asked = 0;
        const { err } = await H.getUserHash(LoginCore, {
            ...account, session: 'invalid', onOTP: cb => { asked++; cb(code()); }
        });
        assert.equal(err, undefined);
        assert.equal(asked, 1);
    });

    test('logs in through api.account.login and returns the session', async () => {
        api = await H.startStore();
        login = await H.call(api.account.login, { ...account, onOTP: cb => cb(code()) });
        assert.equal(login.error, undefined);
        assert.equal(login.loggedIn, true);
        assert.equal(typeof(login.session), 'string');
    });
});
