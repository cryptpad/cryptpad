// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const Util = require("../common-util");
const nThen = require('nthen');
const OS = require("os");
const { fork } = require('child_process');
const Workers = module.exports;
const PID = process.pid;
const Block = require("../storage/block");

const DB_PATH = 'lib/workers/db-worker';
const MAX_JOBS = 16;
const DEFAULT_QUERY_TIMEOUT = 60000 * 15; // increased from three to fifteen minutes because queries for very large files were taking as long as seven minutes

Workers.initialize = function (Env, config, _cb) {
    var cb = Util.once(Util.mkAsync(_cb));

    var incrementTime = function (command, start) {
        if (!command) { return; }
        var end = +new Date();
        var T = Env.commandTimers;
        var diff = (end - start);
        T[command] = (T[command] || 0) + (diff / 1000);
    };

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

    const countWorkerTasks = function (/* index */) {
        return 0; // FIXME this disables all queueing until it can be proven correct
        //return Object.keys(workers[index].tasks || {}).length;
    };

    var workerOffset = -1;
    var queue = [];
    var getAvailableWorkerIndex = function () {
//  If there is already a backlog of tasks you can avoid some work
//  by going to the end of the line
        if (queue.length) { return -1; }

        var L = workers.length;
        if (L === 0) {
            Log.error('NO_WORKERS_AVAILABLE', {
                queue: queue.length,
            });
            return -1;
        }

        // cycle through the workers once
        // start from a different offset each time
        // return -1 if none are available

        workerOffset = (workerOffset + 1) % L;

        var temp;
        for (let i = 0; i < L; i++) {
            temp = (workerOffset + i) % L;
/*  I'd like for this condition to be more efficient
    (`Object.keys` is sub-optimal) but I found some bugs in my initial
    implementation stemming from a task counter variable going out-of-sync
    with reality when a worker crashed and its tasks were re-assigned to
    its substitute. I'm sure it can be done correctly and efficiently,
    but this is a relatively easy way to make sure it's always up to date.
    We'll see how it performs in practice before optimizing.
*/

            if (workers[temp] && countWorkerTasks(temp) <= MAX_JOBS) {
                return temp;
            }
        }
        return -1;
    };

    var drained = true;
    var sendCommand = function (msg, _cb, opt) {
        if (!_cb) {
            return void Log.error('WORKER_COMMAND_MISSING_CB', {
                msg: msg,
                opt: opt,
            });
        }

        opt = opt || {};
        var index = getAvailableWorkerIndex();

        var state = workers[index];
        // if there is no worker available:
        if (!isWorker(state)) {
            // queue the message for when one becomes available
            queue.push({
                msg: msg,
                cb: _cb,
            });
            if (drained) {
                drained = false;
                Log.error('WORKER_QUEUE_BACKLOG', {
                    workers: workers.length,
                });
            }

            return;
        }

        const txid = guid();
        var start = +new Date();
        var cb = Util.once(Util.mkAsync(Util.both(_cb, function (err /*, value */) {
            incrementTime(msg && msg.command, start);
            if (err !== 'TIMEOUT') { return; }
            Log.debug("WORKER_TIMEOUT_CAUSE", msg);
            // in the event of a timeout the user will receive an error
            // but the state used to resend a query in the event of a worker crash
            // won't be cleared. This also leaks a slot that could be used to keep
            // an upper bound on the amount of parallelism for any given worker.
            // if you run out of slots then the worker locks up.
            delete state.tasks[txid];
        })));

        if (!msg) {
            return void cb('ESERVERERR');
        }

        msg.txid = txid;
        msg.pid = PID;
        // include the relevant worker process id in messages so that it will be logged
        // in the event that the message times out or fails in other ways.
        msg.worker = state.pid;

        // track which worker is doing which jobs
        state.tasks[txid] = msg;

        // default to timing out affter 180s if no explicit timeout is passed
        var timeout = typeof(opt.timeout) !== 'undefined'? opt.timeout: DEFAULT_QUERY_TIMEOUT;
        response.expect(txid, cb, timeout);
        state.worker.send(msg);
    };

    var handleResponse = function (state, res) {
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

        if (!res.txid) { return; }
        response.handle(res.txid, [res.error, res.value]);
        delete state.tasks[res.txid];
        if (!queue.length) {
            if (!drained) {
                drained = true;
                Log.debug('WORKER_QUEUE_DRAINED', {
                    workers: workers.length,
                });
            }
            return;
        }

        var nextMsg = queue.shift();

        if (!nextMsg || !nextMsg.msg) {
            return void Log.error('WORKER_QUEUE_EMPTY_MESSAGE', {
                item: nextMsg,
            });
        }

/*  `nextMsg` was at the top of the queue.
    We know that a job just finished and all of this code
    is synchronous, so calling `sendCommand` should take the worker
    which was just freed up. This is somewhat fragile though, so
    be careful if you want to modify this block. The risk is that
    we take something that was at the top of the queue and push it
    to the back because the following msg took its place. OR, in an
    even worse scenario, we cycle through the queue but don't run anything.
*/
        sendCommand(nextMsg.msg, nextMsg.cb);
    };

    const initWorker = function (worker, cb) {
        const txid = guid();

        const state = {
            worker: worker,
            tasks: {},
            pid: worker.pid, // store the child process's id in an easily accessible location
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
            handleResponse(state, res);
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
                if (!(task && task.msg)) { return; }
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
        var limit = Env.maxWorkers;
        var logged;

        OS.cpus().forEach(function (cpu, index) {
            if (limit && index >= limit) {
                if (!logged) {
                    logged = true;
                    Log.info('WORKER_LIMIT', "(Opting not to use available CPUs beyond " + index + ')');
                }
                return;
            }

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

        Env.getOlderHistory = function (channel, oldestKnownHash, toHash, desiredMessages, desiredCheckpoint, cb) {
            Env.store.getWeakLock(channel, function (next) {
                sendCommand({
                    channel: channel,
                    command: "GET_OLDER_HISTORY",
                    hash: oldestKnownHash,
                    toHash: toHash,
                    desiredMessages: desiredMessages,
                    desiredCheckpoint: desiredCheckpoint,
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

        Env.getPinActivity = function (safeKey, cb) {
            Env.pinStore.getWeakLock(safeKey, function (next) {
                sendCommand({
                    key: safeKey,
                    command: 'GET_PIN_ACTIVITY',
                }, Util.both(next, cb));
            });
        };

        Env.getLastChannelTime = function (channel, cb) {
            sendCommand({
                command: 'GET_LAST_CHANNEL_TIME',
                channel: channel,
            }, cb);
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

        Env.removeOwnedBlob = function (blobId, safeKey, reason, cb) {
            sendCommand({
                command: 'REMOVE_OWNED_BLOB',
                blobId: blobId,
                safeKey: safeKey,
                reason: reason
            }, cb);
        };

        Env.evictInactive = function (cb) {
            sendCommand({
                command: 'EVICT_INACTIVE',
            }, cb, {
                timeout: 1000 * 60 * 300, // time out after 300 minutes (5 hours)
            });
        };

        Env.runTasks = function (cb) {
            sendCommand({
                command: 'RUN_TASKS',
            }, cb, {
                timeout: 1000 * 60 * 10, // time out after 10 minutes
            });
        };

        Env.writeTask = function (time, command, args, cb) {
            sendCommand({
                command: 'WRITE_TASK',
                time: time,
                task_command: command,
                args: args,
            }, cb);
        };

        // Synchronous crypto functions
        Env.validateMessage = function (signedMsg, key, cb) {
            sendCommand({
                msg: signedMsg,
                key: key,
                command: 'INLINE',
            }, cb);
        };

        Env.checkSignature = function (signedMsg, signature, publicKey, cb) {
            sendCommand({
                command: 'DETACHED',
                sig: signature,
                msg: signedMsg,
                key: publicKey,
            }, cb);
        };

        Env.hashChannelList = function (channels, cb) {
            sendCommand({
                command: 'HASH_CHANNEL_LIST',
                channels: channels,
            }, cb);
        };

        Env.completeUpload = function (safeKey, arg, owned, size, cb) {
            sendCommand({
                command: "COMPLETE_UPLOAD",
                owned: owned, // Boolean
                safeKey: safeKey, // String (public key)
                arg: arg, // String (file id)
                size: size, // Number || undefined
            }, cb);
        };

        Env.validateAncestorProof = function (proof, cb) {
            sendCommand({
                command: 'VALIDATE_ANCESTOR_PROOF',
                proof: proof,
            }, cb);
        };

        Env.validateLoginBlock = function (publicKey, signature, block, cb) {
            if (!block || !block.length || block.length > Block.MAX_SIZE) {
                return void setTimeout(function () {
                    Env.Log.error('E_INVALID_BLOCK_SIZE', {
                        size: block.length,
                    });

                    cb('E_INVALID_BLOCK_SIZE');
                });
            }

            sendCommand({
                command: 'VALIDATE_LOGIN_BLOCK',
                publicKey: publicKey,
                signature: signature,
                block: block,
            }, cb);
        };

        cb(void 0);
    });
};


