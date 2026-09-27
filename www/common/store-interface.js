// SPDX-FileCopyrightText: 2025 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

(() => {
const factory = function (Channel, NodeWS) {
    let USE_MIN = true;
    if (typeof(localStorage) !== "undefined" &&
        localStorage.CryptPad_noMin === "1") { USE_MIN = false; }

    let path = '/common/worker.bundle.js?';
    if (USE_MIN) { path = '/common/worker.bundle.min.js?'; }


    const commands = {
        account: {
            load: 'CONNECT',
            disconnect: 'DISCONNECT',
            sync: 'SYNC',
            get: 'GET'
        },
        drive: {
            migrateAnon: 'MIGRATE_ANON_DRIVE',
            exists: 'HAS_DRIVE',
            get: 'GET_DRIVE',
            getSharedFolder: 'GET_SHARED_FOLDER',
            getPadData: 'GET_PAD_DATA'
        },
        pad: {
            join: 'JOIN_PAD',
            leave: 'LEAVE_PAD',
            sendMsg: 'SEND_PAD_MSG',
            destroy: 'REMOVE_OWNED_CHANNEL',
            clear: 'CLEAR_OWNED_CHANNEL',
            setMetadata: 'SET_PAD_METADATA',
            getMetadata: 'GET_PAD_METADATA'
        }
    };

    const makeApi = (postMsg, msgEv, cb) => {
        Channel.create(msgEv, postMsg, chan => {
            const postMessage = (cmd, data, cb, opts) => {
                cb ||= () => {};
                chan.query(cmd, data, (err, res) => {
                    if (err) { return void cb ({error: err}); }
                    cb(res);
                }, opts);
            };
            const api = {};
            const make = (base, cmd) => {
                Object.keys(cmd).forEach(k => {
                    const v = cmd[k];
                    if (!v) { return; }
                    if (typeof(v) === "string") {
                        base[k] = (data, cb, opts) => {
                            postMessage(v, data, cb, opts);
                        };
                        return;
                    }
                    base[k] = {};
                    make(base[k], v);
                });
            };
            make(api, commands);
            cb(api);
        });
    };

    let create = function (cfg = {}) {
        let { noWorker, noSharedWorker, AppConfig,
                ApiConfig, Messages, Broadcast } = cfg;

        let urlArgs = ApiConfig?.requireConf?.urlArgs;
        const mkEvent = function () {
            var handlers = [];
            return {
                reg: function (cb) {
                    handlers.push(cb);
                },
                unreg: function (cb) {
                    if (handlers.indexOf(cb) === -1) { return; }
                    handlers.splice(handlers.indexOf(cb), 1);
                },
                fire: function () {
                    var args = Array.prototype.slice.call(arguments);
                    handlers.forEach(function (h) {
                        h.apply(null, args);
                    });
                }
            };
        };

        let called = false;
        let msgEv = mkEvent();
        let todo = (resolve/*, reject*/) => {
            if (called) { return; }
            called = true;

            let worker, postMsg;
            if (!noWorker && !noSharedWorker && typeof(SharedWorker) !== "undefined") {
                worker = new SharedWorker(path + urlArgs);
                worker.onerror = function (e) {
                    console.error(e.message);
                };
                worker.port.onmessage = function (ev) {
                    if (ev.data === "SW_READY") {
                        return;
                    }
                    msgEv.fire(ev);
                };
                postMsg = function (data) {
                    worker.port.postMessage(data);
                };
                postMsg(JSON.parse(JSON.stringify({
                    type: 'INIT',
                    cfg: {
                        AppConfig,
                        ApiConfig,
                        Messages,
                        Broadcast
                    }
                })));
                window.addEventListener('unload', function () {
                    postMsg('CLOSE');
                });
                return void resolve({postMsg, msgEv});
            }

            if (!noWorker && typeof(Worker) !== "undefined") {
                worker = new Worker(path + urlArgs);
                worker.onerror = function (e) {
                    console.error(e.message);
                };
                worker.onmessage = function (ev) {
                    msgEv.fire(ev);
                };
                postMsg = function (data) {
                    worker.postMessage(data);
                };
                postMsg(JSON.parse(JSON.stringify({
                    type: 'INIT',
                    cfg: {
                        AppConfig,
                        ApiConfig,
                        Messages,
                        Broadcast
                    }
                })));
                return void resolve({postMsg, msgEv});
            }

            // Use the async store in the main thread if workers
            // aren't available
            //if (typeof(require) === "undefined") { return; }
            require([path], function (Store) {
                let store = Store?.store;
                if (!store) { return void console.error("No store"); }
                store.onMessage(function (data) {
                    if (data === "STORE_READY") { return; }
                    msgEv.fire({data: data, origin: ''});
                });
                postMsg = function (d) {
                    setTimeout(function () {
                        store.query(d);
                    });
                };
                store.init({
                    AppConfig,
                    ApiConfig,
                    Messages,
                    Broadcast
                });
                resolve({postMsg, msgEv});
            });
        };
        let todoNode = (resolve, reject) => {
            const Store = require('./worker.bundle');
            let store = Store?.store;
            if (!store) {
                reject('NOSTORE');
                return void console.error("No store");
            }
            store.onMessage(function (data) {
                if (data === "STORE_READY") { return; }
                msgEv.fire({data: data, origin: ''});
            });
            let postMsg = function (d) {
                setTimeout(function () {
                    store.query(d);
                });
            };
            store.init({
                AppConfig,
                ApiConfig,
                Messages,
                Broadcast
            });

            globalThis.WebSocket = NodeWS.WebSocket;

            makeApi(postMsg, msgEv, api => {
                // Log in with a username and password and load the user's drive:
                // api.account.login({ uname, passwd, onOTP, session }, cb)
                // onOTP(cb, info) is only needed for accounts with two-factor
                // authentication, see LoginCore.getUserHash. The result has a
                // `session` token for such accounts: pass it to the next login
                // to skip the code while the session is valid.
                const LoginCore = require('../../src/common/login-core');
                LoginCore.setCustomize({ AppConfig, ApiConfig });
                // The store holds a single account: log in only once
                let loginState; // undefined, 'pending' or 'done'
                api.account.login = (credentials, _cb) => {
                    const cb = typeof(_cb) === 'function' ? _cb : () => {};
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
                    cb = typeof(cb) === 'function' ? cb : () => {};
                    api.account.sync({}, () => {
                        api.account.disconnect({}, cb);
                    });
                };
                resolve({api});
            });
        };

        return new Promise((resolve, reject) => {
            if (typeof (module) !== "undefined" && typeof(module.exports) !== "undefined") {
                return void todoNode(resolve, reject);
            }
            if (typeof(SharedWorker) !== "undefined") {
                try {
                    new SharedWorker('');
                } catch (e) {
                    noSharedWorker = true;
                    console.log('Disabling SharedWorker because of privacy settings.');
                }
            }
            if (typeof(Worker) !== "undefined") {
                try {
                    let worker = new Worker('/common/testworker.js?' + urlArgs);
                    worker.onerror = function (errEv) {
                        errEv.preventDefault();
                        errEv.stopPropagation();
                        noWorker = true;
                        worker.terminate();
                        todo(resolve, reject);
                    };
                    worker.onmessage = function (ev) {
                        if (ev.data === "OK") {
                            worker.terminate();
                            todo(resolve, reject);
                        }
                    };
                } catch (e) {
                    noWorker = true;
                    todo(resolve, reject);
                }
            }
        });
    };

    return create;
};


if (typeof(module) !== 'undefined' && module.exports) {
    module.exports = factory(
        require('../../src/common/events-channel'),
        require('ws')
    );
} else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
    define(['/common/events-channel.js'], factory);
}
})();
