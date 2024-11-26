(() => {
const factory = function () {
    // XXX TODO
    // Support NodeJS
    // Support WebWorker
    // Return a usable API instead of postMsg/msgEv
    // XXX handle AppConfig, ApiConfig, MEssages and Broadcast in this file directly?
    // --> pull them using require if browser or... ?

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
        let todo = (resolve, reject) => {
            if (called) { return; }
            called = true;

            if (!noWorker && !noSharedWorker && typeof(SharedWorker) !== "undefined") {
                worker = new SharedWorker('/common/worker.bundle.js?' + urlArgs);
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
                    worker.port.postMessage(JSON.parse(JSON.stringify(data)));
                };
                postMsg({
                    type: 'INIT',
                    cfg: {
                        AppConfig,
                        ApiConfig,
                        Messages,
                        Broadcast
                    }
                });
                window.addEventListener('unload', function () {
                    postMsg('CLOSE');
                });
                return void resolve({postMsg, msgEv});
            }

            // eslint-disable-next-line no-constant-condition
            if (!noWorker && typeof(Worker) !== "undefined") {
                worker = new Worker('/common/worker.bundle.js?' + urlArgs);
                worker.onerror = function (e) {
                    console.error(e.message);
                };
                worker.onmessage = function (ev) {
                    msgEv.fire(ev);
                };
                postMsg = function (data) {
                    worker.postMessage(data);
                };
                return void resolve({postMsg, msgEv});
            }

            // Use the async store in the main thread if workers
            // aren't available
            //if (typeof(require) === "undefined") { return; }
            require(['/common/worker.bundle.js'], function (Store) {
                let store = Store?.store
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
            let store = Store?.store
            if (!store) {
                reject('NOSTORE');
                return void console.error("No store");
            }
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
                    worker = new Worker('/common/outer/testworker.js?' + urlArgs);
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
    module.exports = factory();
} else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
    define([], factory);
}
})();
