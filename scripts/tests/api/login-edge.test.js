// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Edge cases of LoginCore.getUserHash (src/common/login-core.js) against a
// fake server: invalid input, network and server errors, and the TOTP prompt.
// These tests don't need a CryptPad instance.

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const Http = require('node:http');
const Path = require('node:path');
const H = require('./helpers');

const LoginCore = require(Path.join(H.ROOT, 'src/common/login-core'));
const AppConfig = require(Path.join(H.ROOT, 'customize.dist/application_config'));

// A server whose answers to block requests (GET /block/...) and server
// commands (POST /api/auth/) are set by each test
const fakeServer = async () => {
    const server = {
        block: (req, res) => { res.writeHead(404); res.end('{}'); },
        auth: (req, res) => { res.writeHead(502); res.end('<html>Bad gateway</html>'); },
        requests: []
    };
    const http = Http.createServer((req, res) => {
        server.requests.push({ method: req.method, url: req.url, authorization: req.headers.authorization });
        req.resume();
        req.on('end', () => {
            if (req.method === 'GET' && req.url.startsWith('/block/')) { return void server.block(req, res); }
            if (req.method === 'POST' && req.url.startsWith('/api/auth')) { return void server.auth(req, res); }
            res.writeHead(404);
            res.end();
        });
    });
    await new Promise(resolve => http.listen(0, '127.0.0.1', resolve));
    server.origin = `http://127.0.0.1:${http.address().port}`;
    server.close = () => new Promise(resolve => http.close(resolve));
    server.count = (method, prefix) => server.requests.filter(r => r.method === method && r.url.startsWith(prefix)).length;
    return server;
};

const json = (status, body) => (req, res) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
};
const totpRequired = json(401, { method: 'TOTP' });

const useOrigin = origin => LoginCore.setCustomize({
    AppConfig,
    ApiConfig: { httpUnsafeOrigin: origin, websocketPath: '/cryptpad_websocket' }
});

const credentials = { uname: 'edge-case-user', passwd: 'edge-case-password' };
const getUserHash = config => H.getUserHash(LoginCore, config);

describe('LoginCore.getUserHash edge cases', () => {
    let server;
    before(async () => {
        server = await fakeServer();
        useOrigin(server.origin);
    });
    after(async () => { await server.close(); });

    describe('invalid input', () => {
        it('rejects a missing config', async () => {
            assert.equal((await getUserHash(undefined)).err, 'INVAL_USER');
        });

        it('rejects a username that is not a string', async () => {
            assert.equal((await getUserHash({ uname: 42, passwd: 'x' })).err, 'INVAL_USER');
        });

        it('rejects a password that is not a string', async () => {
            assert.equal((await getUserHash({ uname: 'x', passwd: 42 })).err, 'INVAL_PASS');
        });

        it('accepts a missing callback', () => {
            assert.doesNotThrow(() => LoginCore.getUserHash({ uname: 'x', passwd: '' }));
        });
    });

    describe('network and server errors', () => {
        it('reports an unreachable server', async () => {
            const down = await fakeServer();
            await down.close();
            useOrigin(down.origin);
            try {
                assert.equal((await getUserHash(credentials)).err, 'NETWORK_ERROR');
            } finally {
                useOrigin(server.origin);
            }
        });

        it('reports a missing instance configuration instead of throwing', async () => {
            LoginCore.setCustomize({ AppConfig, ApiConfig: {} });
            try {
                assert.equal((await getUserHash(credentials)).err, 'INTERNAL_ERROR');
            } finally {
                useOrigin(server.origin);
            }
        });

        it('reports a server error for the block', async () => {
            server.block = (req, res) => { res.writeHead(500); res.end('<html>Error</html>'); };
            assert.equal((await getUserHash(credentials)).err, 'BLOCK_ERROR');
        });

        it('reports a block that can\'t be decrypted', async () => {
            server.block = (req, res) => { res.writeHead(200); res.end(Buffer.alloc(100, 7)); };
            assert.equal((await getUserHash(credentials)).err, 'BLOCK_DECRYPTION_ERROR');
        });

        it('reports an unknown user', async () => {
            server.block = json(404, {});
            assert.equal((await getUserHash(credentials)).err, 'NO_SUCH_USER');
        });

        it('reports a deleted user', async () => {
            server.block = json(404, { reason: 'ARCHIVED' });
            assert.equal((await getUserHash(credentials)).err, 'DELETED_USER');
        });

        it('refuses accounts using single sign-on', async () => {
            server.block = json(401, { sso: true });
            assert.equal((await getUserHash(credentials)).err, 'SSO_NOT_SUPPORTED');
        });
    });

    describe('two-factor authentication', () => {
        before(() => { server.block = totpRequired; });

        it('requires onOTP', async () => {
            assert.equal((await getUserHash(credentials)).err, 'TOTP_REQUIRED');
        });

        it('counts codes that are not six digits as wrong without asking the server', async () => {
            const before = server.count('POST', '/api/auth');
            const infos = [];
            const { err } = await getUserHash({
                ...credentials,
                onOTP: (cb, info) => { infos.push(info.error); cb('abc'); }
            });
            assert.equal(err, 'TOTP_ATTEMPTS_EXHAUSTED');
            assert.deepEqual(infos, [undefined, 'INVALID_OTP', 'INVALID_OTP']);
            assert.equal(server.count('POST', '/api/auth'), before);
        });

        it('asks again when the server rejects a code', async () => {
            server.auth = json(500, { error: 'INVALID_OTP' });
            const before = server.count('POST', '/api/auth');
            const { err } = await getUserHash({ ...credentials, onOTP: cb => cb('123 456') });
            assert.equal(err, 'TOTP_ATTEMPTS_EXHAUSTED');
            assert.equal(server.count('POST', '/api/auth') - before, 3);
        });

        it('stops on an unexpected server answer that is not JSON', async () => {
            server.auth = (req, res) => { res.writeHead(502); res.end('<html>Bad gateway</html>'); };
            const { err } = await getUserHash({ ...credentials, onOTP: cb => cb('123456') });
            assert.equal(err, 'SERVER_ERROR');
        });

        it('stops when the server can\'t be reached for the code', async () => {
            server.auth = req => { req.socket.destroy(); };
            const { err } = await getUserHash({ ...credentials, onOTP: cb => cb('123456') });
            assert.equal(err, 'NETWORK_ERROR');
        });

        it('cancels when onOTP throws', async () => {
            const { err } = await getUserHash({ ...credentials, onOTP: () => { throw new Error('no terminal'); } });
            assert.equal(err, 'TOTP_CANCELLED');
        });

        it('cancels when an async onOTP rejects', async () => {
            const { err } = await getUserHash({ ...credentials, onOTP: async () => { throw new Error('closed'); } });
            assert.equal(err, 'TOTP_CANCELLED');
        });

        it('uses only the first answer when onOTP answers twice', async () => {
            server.auth = json(500, { error: 'INVALID_OTP' });
            const before = server.count('POST', '/api/auth');
            let calls = 0;
            const { err } = await getUserHash({
                ...credentials,
                onOTP: cb => { calls++; cb('123456'); cb('654321'); }
            });
            assert.equal(err, 'TOTP_ATTEMPTS_EXHAUSTED');
            assert.equal(calls, 3);
            assert.equal(server.count('POST', '/api/auth') - before, 3);
        });

        it('tries the session before asking for a code', async () => {
            const start = server.requests.length;
            let asked = 0;
            const { err } = await getUserHash({
                ...credentials, session: 'old-session', onOTP: cb => { asked++; cb(); }
            });
            assert.equal(err, 'TOTP_CANCELLED');
            assert.equal(asked, 1);
            const blockRequests = server.requests.slice(start).filter(r => r.url.startsWith('/block/'));
            assert.deepEqual(blockRequests.map(r => r.authorization), [undefined, 'Bearer old-session']);
        });
    });
});
