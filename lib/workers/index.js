/* jshint esversion: 6 */
/* global process */
const Util = require("../common-util");
const nThen = require('nthen');
const OS = require("os");
const numCPUs = OS.cpus().length;
const { fork } = require('child_process');
const Workers = module.exports;
const PID = process.pid;

const CRYPTO_PATH = 'lib/workers/crypto-worker';
const DB_PATH = 'lib/workers/db-worker';

Workers.initializeValidationWorkers = function (Env) {
    if (typeof(Env.validateMessage) !== 'undefined') {
        return void console.error("validation workers are already initialized");
    }

    // Create our workers
    const workers = [];
    for (let i = 0; i < numCPUs; i++) {
        workers.push(fork(CRYPTO_PATH));
    }

    const response = Util.response(function (errLabel, info) {
        Env.Log.error('HK_VALIDATE_WORKER__' + errLabel, info);
    });

    var initWorker = function (worker) {
        worker.on('message', function (res) {
            if (!res || !res.txid) { return; }
            response.handle(res.txid, [res.error, res.value]);
        });

        var substituteWorker = Util.once( function () {
            Env.Log.info("SUBSTITUTE_VALIDATION_WORKER", '');
            var idx = workers.indexOf(worker);
            if (idx !== -1) {
                workers.splice(idx, 1);
            }
            // Spawn a new one
            var w = fork(CRYPTO_PATH);
            workers.push(w);
            initWorker(w);
        });

        // Spawn a new process in one ends
        worker.on('exit', substituteWorker);
        worker.on('close', substituteWorker);
        worker.on('error', function (err) {
            substituteWorker();
            Env.Log.error('VALIDATION_WORKER_ERROR', {
                error: err,
            });
        });
    };
    workers.forEach(initWorker);

    var nextWorker = 0;
    const send = function (msg, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));
        // let's be paranoid about asynchrony and only calling back once..
        nextWorker = (nextWorker + 1) % workers.length;
        if (workers.length === 0 || typeof(workers[nextWorker].send) !== 'function') {
            return void cb("INVALID_WORKERS");
        }

        var txid = msg.txid = Util.uid();

        // expect a response within 45s
        response.expect(txid, cb, 60000);

        // Send the request
        workers[nextWorker].send(msg);
    };

    Env.validateMessage = function (signedMsg, key, cb) {
        send({
            msg: signedMsg,
            key: key,
            command: 'INLINE',
        }, cb);
    };

    Env.checkSignature = function (signedMsg, signature, publicKey, cb) {
        send({
            command: 'DETACHED',
            sig: signature,
            msg: signedMsg,
            key: publicKey,
        }, cb);
    };

    Env.hashChannelList = function (channels, cb) {
        send({
            command: 'HASH_CHANNEL_LIST',
            channels: channels,
        }, cb);
    };
};

Workers.initializeIndexWorkers = function (Env, config, _cb) {
    var cb = Util.once(Util.mkAsync(_cb));

    const workers = [];

    const response = Util.response(function (errLabel, info) {
        Env.Log.error('HK_DB_WORKER__' + errLabel, info);
    });

    const Log = Env.Log;
    const handleLog = function (level, label, info) {
        if (typeof(Log[level]) !== 'function') { return; }
        Log[level](label, info);
    };

    var isWorker = function (value) {
        return value && value.worker && typeof(value.worker.send) === 'function';
    };

    // pick ids that aren't already in use...
    const guid = function () {
        var id = Util.uid();
        return response.expected(id)? guid(): id;
    };

    var workerIndex = 0;
    var sendCommand = function (msg, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));

        workerIndex = (workerIndex + 1) % workers.length;
        if (!isWorker(workers[workerIndex])) {
            return void cb("NO_WORKERS");
        }

        var state = workers[workerIndex];

        const txid = guid();
        msg.txid = txid;
        msg.pid = PID;

        // track which worker is doing which jobs
        state.tasks[txid] = msg;
        response.expect(txid, function (err, value) {
            // clean up when you get a response
            delete state[txid];
            cb(err, value);
        }, 60000);
        state.worker.send(msg);
    };

    const initWorker = function (worker, cb) {
        const txid = guid();

        const state = {
            worker: worker,
            tasks: {},
        };

        response.expect(txid, function (err) {
            if (err) { return void cb(err); }
            workers.push(state);
            cb(void 0, state);
        }, 15000);

        worker.send({
            pid: PID,
            txid: txid,
            config: config,
        });

        worker.on('message', function (res) {
            if (!res) { return; }
            // handle log messages before checking if it was addressed to your PID
            // it might still be useful to know what happened inside an orphaned worker
            if (res.log) {
                return void handleLog(res.log, res.label, res.info);
            }
            // but don't bother handling things addressed to other processes
            // since it's basically guaranteed not to work
            if (res.pid !== PID) {
                return void Log.error("WRONG_PID", res);
            }

            response.handle(res.txid, [res.error, res.value]);
        });

        var substituteWorker = Util.once(function () {
            Env.Log.info("SUBSTITUTE_DB_WORKER", '');
            var idx = workers.indexOf(state);
            if (idx !== -1) {
                workers.splice(idx, 1);
            }

            Object.keys(state.tasks).forEach(function (txid) {
                const cb = response.expectation(txid);
                if (typeof(cb) !== 'function') { return; }
                const task = state.tasks[txid];
                if (!task && task.msg) { return; }
                response.clear(txid);
                Log.info('DB_WORKER_RESEND', task.msg);
                sendCommand(task.msg, cb);
            });

            var w = fork(DB_PATH);
            initWorker(w, function (err, state) {
                if (err) {
                    throw new Error(err);
                }
                workers.push(state);
            });
        });

        worker.on('exit', substituteWorker);
        worker.on('close', substituteWorker);
        worker.on('error', function (err) {
            substituteWorker();
            Env.Log.error("DB_WORKER_ERROR", {
                error: err,
            });
        });
    };

    nThen(function (w) {
        OS.cpus().forEach(function () {
            initWorker(fork(DB_PATH), w(function (err) {
                if (!err) { return; }
                w.abort();
                return void cb(err);
            }));
        });
    }).nThen(function () {
        Env.computeIndex = function (Env, channel, cb) {
            Env.store.getWeakLock(channel, function (next) {
                sendCommand({
                    channel: channel,
                    command: 'COMPUTE_INDEX',
                }, function (err, index) {
                    next();
                    cb(err, index);
                });
            });
        };

        Env.computeMetadata = function (channel, cb) {
            Env.store.getWeakLock(channel, function (next) {
                sendCommand({
                    channel: channel,
                    command: 'COMPUTE_METADATA',
                }, function (err, metadata) {
                    next();
                    cb(err, metadata);
                });
            });
        };

        Env.getOlderHistory = function (channel, oldestKnownHash, cb) {
            Env.store.getWeakLock(channel, function (next) {
                sendCommand({
                    channel: channel,
                    command: "GET_OLDER_HISTORY",
                    hash: oldestKnownHash,
                }, Util.both(next, cb));
            });
        };

        Env.getPinState = function (safeKey, cb) {
            Env.pinStore.getWeakLock(safeKey, function (next) {
                sendCommand({
                    key: safeKey,
                    command: 'GET_PIN_STATE',
                }, Util.both(next, cb));
            });
        };

        Env.getFileSize = function (channel, cb) {
            sendCommand({
                command: 'GET_FILE_SIZE',
                 channel: channel,
            }, cb);
        };

        Env.getDeletedPads = function (channels, cb) {
            sendCommand({
                command: "GET_DELETED_PADS",
                channels: channels,
            }, cb);
        };

        Env.getTotalSize = function (channels, cb) {
            // we could take out locks for all of these channels,
            // but it's OK if the size is slightly off
            sendCommand({
                command: 'GET_TOTAL_SIZE',
                channels: channels,
            }, cb);
        };

        Env.getMultipleFileSize = function (channels, cb) {
            sendCommand({
                command: "GET_MULTIPLE_FILE_SIZE",
                channels: channels,
            }, cb);
        };

        Env.getHashOffset = function (channel, hash, cb) {
            Env.store.getWeakLock(channel, function (next) {
                sendCommand({
                    command: 'GET_HASH_OFFSET',
                    channel: channel,
                    hash: hash,
                }, Util.both(next, cb));
            });
        };

        Env.removeOwnedBlob = function (blobId, safeKey, cb) {
            sendCommand({
                command: 'REMOVE_OWNED_BLOB',
                blobId: blobId,
                safeKey: safeKey,
            }, cb);
        };

        Env.runTasks = function (cb) {
            sendCommand({
                command: 'RUN_TASKS',
            }, cb);
        };

        cb(void 0);
    });
};

Workers.initialize = function (Env, config, cb) {
    Workers.initializeValidationWorkers(Env);
    Workers.initializeIndexWorkers(Env, config, cb);
};
