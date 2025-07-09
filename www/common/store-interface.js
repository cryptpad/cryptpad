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
            load: 'CONNECT'
        },
        drive: {
            migrateAnon: 'MIGRATE_ANON_DRIVE'
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
