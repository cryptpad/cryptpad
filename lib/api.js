// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const WebSocketServer = require('ws').Server;
const NetfluxSrv = require('chainpad-server');
const Decrees = require("./decrees");

const nThen = require("nthen");
const Fs = require("fs");
const Fse = require("fs-extra");
const Path = require("path");
const Nacl = require("tweetnacl/nacl-fast");
const Hash = require('./common-hash');

module.exports.create = function (Env) {
    var log = Env.Log;

nThen(function (w) {
    Decrees.load(Env, w(function (err) {
        Env.flushCache();
        if (err) {
            log.error('DECREES_LOADING', {
                error: err.code || err,
                message: err.message,
            });
            console.error(err);
        }
    }));
}).nThen(function (w) {
    let admins = Env.admins || [];

    // If we don't have any admin on this instance, print an onboarding link
    if (Array.isArray(admins) && admins.length) { return; }
    let token = Env.installToken;
    let printLink = () => {
        let url = `${Env.httpUnsafeOrigin}/install/#${token}`;
        console.log('=============================');
        console.log('Create your first admin account and customize your instance by visiting');
        console.log(url);
        console.log('=============================');

    };

    // If we already have a token, print it
    if (token) { return void printLink(); }

    // Otherwise create a new token
    let decreeName = Path.join(Env.paths.decree, 'decree.ndjson');
    token = Hash.createChannelId() + Hash.createChannelId();
    let decree = ["ADD_INSTALL_TOKEN",[token],"",+new Date()];
    Fs.appendFile(decreeName, JSON.stringify(decree) + '\n', w(function (err) {
        if (err) { console.log(err); return; }
        Env.installToken = token;
        Env.envUpdated.fire();
        printLink();
    }));
}).nThen(function () {
    if (!Env.admins.length) {
        Env.Log.info('NO_ADMIN_CONFIGURED', {
            message: `Your instance is not correctly configured for production usage. Review its checkup page for more information.`,
            details: new URL('/checkup/', Env.httpUnsafeOrigin).href,
        });
    }
}).nThen(function (w) {
    // we assume the server has generated a secret used to validate JWT tokens
    if (typeof(Env.bearerSecret) === 'string') { return; }
    // if one does not exist, then create one and remember it
    // 256 bits
    var bearerSecret = Nacl.util.encodeBase64(Nacl.randomBytes(32));
    Env.Log.info("GENERATING_BEARER_SECRET", {});
    Decrees.write(Env, [
        'SET_BEARER_SECRET',
        [bearerSecret],
        'INTERNAL',
        +new Date()
    ], w(function (err) {
        if (err) { throw err; }
    }));
}).nThen(function (w) {
    Fse.mkdirp(Env.paths.block, w(function (err) {
        if (err) {
            log.error("BLOCK_FOLDER_CREATE_FAILED", err);
        }
    }));
}).nThen(function (w) {
    var fullPath = Path.join(Env.paths.block, 'placeholder.txt');
    Fs.writeFile(fullPath, 'PLACEHOLDER\n', w(function (err) {
        if (err) {
            log.error('BLOCK_PLACEHOLDER_CREATE_FAILED', err);
        }
    }));
}).nThen(function () {
    // asynchronously create a historyKeeper and RPC together
    require('./historyKeeper.js').create(Env, function (err, historyKeeper) {
        if (err) { throw err; }


        var noop = function () {};

        var special_errors = {};
        ['EPIPE', 'ECONNRESET'].forEach(function (k) { special_errors[k] = noop; });
        special_errors.NF_ENOENT = function (error, label, info) {
            delete info.stack;
            log.error(label, {
                info: info,
            });
        };

        // spawn ws server and attach netflux event handlers
        let Server = Env.Server = NetfluxSrv.create(new WebSocketServer({ server: Env.httpServer}))
            .on('channelClose', historyKeeper.channelClose)
            .on('channelMessage', historyKeeper.channelMessage)
            .on('channelOpen', historyKeeper.channelOpen)
            .on('sessionClose', historyKeeper.sessionClose)
            .on('sessionOpen', historyKeeper.sessionOpen)
            .on('error', function (error, label, info) {
                if (!error) { return; }
                var code = error && (error.code || error.message);
                if (code) {
                    /*  EPIPE,ECONNERESET, NF_ENOENT */
                    if (typeof(special_errors[code]) === 'function') {
                        return void special_errors[code](error, label, info);
                    }
                }

                /* labels:
                    SEND_MESSAGE_FAIL, SEND_MESSAGE_FAIL_2, FAIL_TO_DISCONNECT,
                    FAIL_TO_TERMINATE, HANDLE_CHANNEL_LEAVE, NETFLUX_BAD_MESSAGE,
                    NETFLUX_WEBSOCKET_ERROR
                */
                log.error(label, {
                    code: error.code,
                    message: error.message,
                    stack: error.stack,
                    info: info,
                });
            })
            .register(historyKeeper.id, historyKeeper.directMessage);
        // Store max active WS during the last day (reset when sending ping if enabled)
        setInterval(() => {
            try {
                // Concurrent usage data
                let oldWs = Env.maxConcurrentWs || 0;
                let oldUniqueWs = Env.maxConcurrentUniqueWs || 0;
                let oldChans = Env.maxActiveChannels || 0;
                let oldUsers = Env.maxConcurrentRegUsers || 0;
                let stats = Server.getSessionStats();
                let chans = Server.getActiveChannelCount();
                let reg = 0;
                let regKeys = [];
                Object.keys(Env.netfluxUsers).forEach(id => {
                    let keys = Env.netfluxUsers[id];
                    let key = Object.keys(keys || {})[0];
                    if (!key) { return; }
                    if (regKeys.includes(key)) { return; }
                    reg++;
                    regKeys.push(key);
                });
                Env.maxConcurrentWs = Math.max(oldWs, stats.total);
                Env.maxConcurrentUniqueWs = Math.max(oldUniqueWs, stats.unique);
                Env.maxConcurrentRegUsers = Math.max(oldUsers, reg);
                Env.maxActiveChannels = Math.max(oldChans, chans);
            } catch (e) {}
        }, 10000);
        // Clean up active registered users and channels (possible memory leak)
        setInterval(() => {
            try {
                let users = Env.netfluxUsers || {};
                let online = Server.getOnlineUsers() || [];
                let removed = 0;
                Object.keys(users).forEach(id => {
                    if (!online.includes(id)) {
                        delete users[id];
                        removed++;
                    }
                });
                if (removed) {
                    Env.Log.info("CLEANED_ACTIVE_USERS_MAP", {removed});
                }
            } catch (e) {}
            try {
                let HK = require('./hk-utils');
                let chans = Env.channel_cache || {};
                let active = Server.getActiveChannels() || [];
                let removed = 0;
                Object.keys(chans).forEach(id => {
                    if (!active.includes(id)) {
                        HK.dropChannel(Env, id);
                        removed++;
                    }
                });
                if (Env.store) {
                    Env.store.closeInactiveChannels(active);
                }
                if (removed) {
                    Env.Log.info("CLEANED_ACTIVE_CHANNELS_MAP", {removed});
                }
            } catch (e) {}
        }, 30000);

    });
});

};
