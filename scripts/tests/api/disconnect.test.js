// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Disconnect a store connected to a server

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { noServer, startStore, call } = require('./helpers');

test('DISCONNECT answers when connected', async t => {
    const skip = await noServer();
    if (skip) { return void t.skip(skip); }
    const api = await startStore();

    const res = await call(api.account.load, { driveEvents: false }, 20000);
    assert.equal(res?.error, undefined);
    assert.equal(res.loggedIn, false);

    assert.equal(await call(api.account.disconnect), undefined);
});
