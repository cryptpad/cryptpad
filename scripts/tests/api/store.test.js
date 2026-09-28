// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Queries to a store that isn't connected: they must answer

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { noBundle, startStore, call } = require('./helpers');

test('store queries answer', { skip: noBundle() }, async t => {
    const api = await startStore({ offline: true });

    await t.test('DISCONNECT answers without a network', async () => {
        assert.equal(await call(api.account.disconnect), undefined);
    });
});
