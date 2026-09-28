// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// src/common/outer/http-command.js against a local server that answers
// with errors

const { test } = require('node:test');
const assert = require('node:assert/strict');
const Http = require('node:http');
const Path = require('node:path');
const Nacl = require('tweetnacl/nacl-fast');
const { ROOT } = require('./helpers');

const ServerCommand = require(Path.join(ROOT, 'src/common/outer/http-command'));

// Answers to the first (with a nonce) and second (with a signature) request
let answers;
const server = Http.createServer((req, res) => {
    let body = '';
    req.on('data', d => { body += d; });
    req.on('end', () => {
        const [status, text] = JSON.parse(body).sig ? answers[1] : answers[0];
        res.writeHead(status, { 'Content-Type': 'text/plain' });
        res.end(text);
    });
});

const run = (first, second) => new Promise((resolve, reject) => {
    answers = [first, second];
    const t = setTimeout(() => reject(new Error('NO_ANSWER')), 5000);
    ServerCommand(Nacl.sign.keyPair(), { command: 'TEST' }, (err, data) => {
        clearTimeout(t);
        resolve({ err, data });
    });
});

test('http-command', async t => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    ServerCommand.setCustomize({ ApiConfig: {
        httpUnsafeOrigin: origin,
        websocketPath: '/cryptpad_websocket'
    } });
    t.after(() => server.close());

    const challenge = [200, JSON.stringify({ date: Date.now(), txid: 'txid' })];

    await t.test('success', async () => {
        const res = await run(challenge, [200, '{"success":true}']);
        assert.deepEqual(res, { err: undefined, data: { success: true } });
    });

    await t.test('JSON error to the request', async () => {
        const res = await run([400, '{"error":"E_TEST"}']);
        assert.deepEqual(res, { err: 400, data: { error: 'E_TEST' } });
    });

    await t.test('error to the request that is not JSON', async () => {
        const res = await run([502, '<html>Bad Gateway</html>']);
        assert.deepEqual(res, { err: 502, data: undefined });
    });

    await t.test('JSON error to the signed request', async () => {
        const res = await run(challenge, [500, '{"error":"INVALID_OTP"}']);
        assert.deepEqual(res, { err: 'RESPONSE_REJECTED', data: { error: 'INVALID_OTP' } });
    });

    await t.test('error to the signed request that is not JSON', async () => {
        const res = await run(challenge, [502, 'Bad Gateway']);
        assert.deepEqual(res, { err: 'RESPONSE_REJECTED', data: undefined });
    });
});
