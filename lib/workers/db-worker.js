// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const HK = require("../hk-util");
const Store = require("../storage/file");
const BlobStore = require("../storage/blob");
const Block = require("../commands/block");
const Util = require("../common-util");
const nThen = require("nthen");
const Meta = require("../metadata");
const Pins = require("../pins");
const Core = require("../commands/core");
const Saferphore = require("saferphore");
const Logger = require("../log");
const Tasks = require("../storage/tasks");
const Nacl = require('tweetnacl/nacl-fast');
const Eviction = require("../eviction");

const Env = {
    Log: {},
};

// support the usual log API but pass it to the main process
Logger.levels.forEach(function (level) {
    Env.Log[level] = function (label, info) {
        process.send({
            log: level,
            label: label,
            info: info,
        });
    };
});

var DETAIL = 1000;
var round = function (n) {
    return Math.floor(n * DETAIL) / DETAIL;
};

var ready = false;
var store;
var pinStore;
var blobStore;
const init = function (config, _cb) {
    const cb = Util.once(Util.mkAsync(_cb));
    if (!config) {
        return void cb('E_INVALID_CONFIG');
    }

    Env.paths = {
        pin: config.pinPath,
        block: config.blockPath,
    };

    Env.inactiveTime = config.inactiveTime;
    Env.archiveRetentionTime = config.archiveRetentionTime;
    Env.accountRetentionTime = config.accountRetentionTime;

    nThen(function (w) {
        Store.create(config, w(function (err, _store) {
            if (err) {
                w.abort();
                return void cb(err);
            }
            Env.store = store = _store;
        }));
        Store.create({
            filePath: config.pinPath,
            archivePath: config.archivePath,
            // important to initialize the pinstore with its own volume id
            // otherwise archived pin logs will get mixed in with channels
            volumeId: 'pins',
        }, w(function (err, _pinStore) {
            if (err) {
                w.abort();
                return void cb(err);
            }
            Env.pinStore = pinStore = _pinStore;
        }));
        BlobStore.create({
            blobPath: config.blobPath,
            blobStagingPath: config.blobStagingPath,
            archivePath: config.archivePath,
            getSession: function () {},
        }, w(function (err, blob) {
            if (err) {
                w.abort();
                return void cb(err);
            }
            Env.blobStore = blobStore = blob;
        }));
    }).nThen(function (w) {
        Tasks.create({
            log: Env.Log,
            taskPath: config.taskPath,
            store: store,
        }, w(function (err, tasks) {
            if (err) {
                w.abort();
                return void cb(err);
            }
            Env.tasks = tasks;
        }));
    }).nThen(function () {
        cb();
    });
};

/*  computeIndex
    can call back with an error or a computed index which includes:
        * cpIndex:
            * array including any checkpoints pushed within the last 100 messages
            * processed by 'sliceCpIndex(cpIndex, line)'
        * offsetByHash:
            * a map containing message offsets by their hash
            * this is for every message in history, so it could be very large...
                * except we remove offsets from the map if they occur before the oldest relevant checkpoint
        * size: in bytes
        * metadata:
            * validationKey
            * expiration time
            * owners
            * ??? (anything else we might add in the future)
        * line
            * the number of messages in history
            * including the initial metadata line, if it exists

*/

const OPEN_CURLY_BRACE = Buffer.from('{');
const CHECKPOINT_PREFIX = Buffer.from('cp|');
const isValidOffsetNumber = function (n) {
    return typeof(n) === 'number' && n >= 0;
};

const computeIndexFromOffset = function (channelName, offset, cb) {
    let cpIndex = [];
    let messageBuf = [];
    let i = 0;

    const CB = Util.once(cb);

    const offsetByHash = {};
    let offsetCount = 0;
    let size = offset || 0;
    var start = offset || 0;
    let unconventional = false;

    nThen(function (w) {
        // iterate over all messages in the channel log
        // old channels can contain metadata as the first message of the log
        // skip over metadata as that is handled elsewhere
        // otherwise index important messages in the log
        store.readMessagesBin(channelName, start, (msgObj, readMore, abort) => {
            let msg;
            // keep an eye out for the metadata line if you haven't already seen it
            // but only check for metadata on the first line
            if (i) {
                // fall through intentionally because the following blocks are invalid
                // for all but the first message
            } else if (msgObj.buff.includes(OPEN_CURLY_BRACE)) {
                msg = HK.tryParse(Env, msgObj.buff.toString('utf8'));
                if (typeof msg === "undefined") {
                    i++; // always increment the message counter
                    return readMore();
                }

                // validate that the current line really is metadata before storing it as such
                // skip this, as you already have metadata...
                if (HK.isMetadataMessage(msg)) {
                    i++; // always increment the message counter
                    return readMore();
                }
            } else if (!(msg = HK.tryParse(Env, msgObj.buff.toString('utf8')))) {
                w.abort();
                abort();
                return CB("OFFSET_ERROR");
            }
            i++;
            if (msgObj.buff.includes(CHECKPOINT_PREFIX)) {
                msg = msg || HK.tryParse(Env, msgObj.buff.toString('utf8'));
                if (typeof msg === "undefined") { return readMore(); }
                // cache the offsets of checkpoints if they can be parsed
                if (msg[2] === 'MSG' && msg[4].indexOf('cp|') === 0) {
                    cpIndex.push({
                        offset: msgObj.offset,
                        line: i
                    });
                    // we only want to store messages since the latest checkpoint
                    // so clear the buffer every time you see a new one
                    messageBuf = [];
                }
            } else if (messageBuf.length > 100 && cpIndex.length === 0) {
                // take the last 50 messages
                unconventional = true;
                messageBuf = messageBuf.slice(-50);
            }
            // if it's not metadata or a checkpoint then it should be a regular message
            // store it in the buffer
            messageBuf.push(msgObj);
            return readMore();
        }, w((err) => {
            if (err && err.code !== 'ENOENT') {
                w.abort();
                return void CB(err);
            }

            // once indexing is complete you should have a buffer of messages since the latest checkpoint
            // or the 50-100 latest messages if the channel is of a type without checkpoints.
            // map the 'hash' of each message to its byte offset in the log, to be used for reconnecting clients
            messageBuf.forEach((msgObj) => {
                const msg = HK.tryParse(Env, msgObj.buff.toString('utf8'));
                if (typeof msg === "undefined") { return; }
                if (msg[0] === 0 && msg[2] === 'MSG' && typeof(msg[4]) === 'string') {
                    // msgObj.offset is API guaranteed by our storage module
                    // it should always be a valid positive integer
                    offsetByHash[HK.getHash(msg[4])] = msgObj.offset;
                    offsetCount++;
                }
                // There is a trailing \n at the end of the file
                size = msgObj.offset + msgObj.buff.length + 1;
            });
        }));
    }).nThen(function (w) {
        cpIndex = HK.sliceCpIndex(cpIndex, i);

        var new_start;
        if (cpIndex.length) {
            new_start = cpIndex[0].offset;
        } else if (unconventional && messageBuf.length && isValidOffsetNumber(messageBuf[0].offset)) {
            new_start = messageBuf[0].offset;
        }

        if (new_start === start) { return; }
        if (!isValidOffsetNumber(new_start)) { return; }

        // store the offset of the earliest relevant line so that you can start from there next time...
        store.writeOffset(channelName, {
            start: new_start,
            created: +new Date(),
        }, w(function () {
            var diff = new_start - start;
            Env.Log.info('WORKER_OFFSET_UPDATE', {
                channel: channelName,
                start: start,
                startMB: round(start / 1024 / 1024),
                update: new_start,
                updateMB: round(new_start / 1024 / 1024),
                diff: diff,
                diffMB: round(diff / 1024 / 1024),
            });
        }));
    }).nThen(function () {
        // return the computed index
        CB(null, {
            // Only keep the checkpoints included in the last 100 messages
            cpIndex: cpIndex,
            offsetByHash: offsetByHash,
            offsets: offsetCount,
            size: size,
            //metadata: metadata,
            line: i
        });
    });
};

const computeIndex = function (data, cb) {
    if (!data || !data.channel) {
        return void cb('E_NO_CHANNEL');
    }

    const channelName = data.channel;
    const CB = Util.once(cb);

    var start = 0;
    nThen(function (w) {
        store.getOffset(channelName, w(function (err, obj) {
            if (err) { return; }
            if (obj && typeof(obj.start) === 'number' && obj.start > 0) {
                start = obj.start;
                Env.Log.verbose('WORKER_OFFSET_RECOVERY', {
                    channel: channelName,
                    start: start,
                    startMB: round(start / 1024 / 1024),
                });
            }
        }));
    }).nThen(function (w) {
        computeIndexFromOffset(channelName, start, w(function (err, index) {
            if (err === 'OFFSET_ERROR') {
                return Env.Log.error("WORKER_OFFSET_ERROR", {
                    channel: channelName,
                });
            }
            w.abort();
            CB(err, index);
        }));
    }).nThen(function (w) {
        // if you're here there was an OFFSET_ERROR..
        // first remove the offset that caused the problem to begin with
        store.clearOffset(channelName, w());
    }).nThen(function () {
        // now get the history as though it were the first time
        computeIndexFromOffset(channelName, 0, CB);
    });
};

const computeMetadata = function (data, cb) {
    const ref = {};
    const lineHandler = Meta.createLineHandler(ref, Env.Log.error);
    return void store.readChannelMetadata(data.channel, lineHandler, function (err) {
        if (err) {
            // stream errors?
            return void cb(err);
        }
        cb(void 0, ref.meta);
    });
};

/*  getOlderHistory
    * allows clients to query for all messages until a known hash is read
    * stores all messages in history as they are read
      * can therefore be very expensive for memory
      * should probably be converted to a streaming interface

    Used by:
    * GET_HISTORY_RANGE
*/

const getOlderHistory = function (data, cb) {
    const oldestKnownHash = data.hash;
    const untilHash = data.toHash;
    const channelName = data.channel;
    const desiredMessages = data.desiredMessages;
    const desiredCheckpoint = data.desiredCheckpoint;

    var messages = [];
    var found = false;
    store.getMessages(channelName, function (msgStr) {
        if (found) { return; }

        let parsed = HK.tryParse(Env, msgStr);
        if (typeof parsed === "undefined") { return; }

        // identify classic metadata messages by their inclusion of a channel.
        // and don't send metadata, since:
        // 1. the user won't be interested in it
        // 2. this metadata is potentially incomplete/incorrect
        if (HK.isMetadataMessage(parsed)) { return; }

        var content = parsed[4];
        if (typeof(content) !== 'string') { return; }

        var hash = HK.getHash(content);
        if (hash === oldestKnownHash) {
            found = true;
        }
        messages.push(parsed);
    }, function (err) {
        var toSend = [];
        if (typeof (desiredMessages) === "number") {
            toSend = messages.slice(-desiredMessages);
        } else if (untilHash) {
            for (var j = messages.length - 1; j >= 0; j--) {
                toSend.unshift(messages[j]);
                if (Array.isArray(messages[j]) && HK.getHash(messages[j][4]) === untilHash) {
                    break;
                }
            }
        } else {
            let cpCount = 0;
            for (var i = messages.length - 1; i >= 0; i--) {
                if (/^cp\|/.test(messages[i][4]) && i !== (messages.length - 1)) {
                    cpCount++;
                }
                toSend.unshift(messages[i]);
                if (cpCount >= desiredCheckpoint) { break; }
            }
        }
        cb(err, toSend);
    });
};

const getPinState = function (data, cb) {
    if (typeof(data.key) !== 'string') { return void cb('INVALID_KEY'); }
    const safeKey = Util.escapeKeyCharacters(data.key);
    var ref = {};
    var lineHandler = Pins.createLineHandler(ref, Env.Log.error);

    // if channels aren't in memory. load them from disk
    pinStore.readMessagesBin(safeKey, 0, (msgObj, readMore) => {
        lineHandler(msgObj.buff.toString('utf8'));
        readMore();
    }, function () {
        cb(void 0, ref.pins); // FIXME no error handling?
    });
};

const _getFileSize = function (channel, _cb) {
    var cb = Util.once(Util.mkAsync(_cb));
    if (!Core.isValidId(channel)) { return void cb('INVALID_CHAN'); }
    if (channel.length === HK.STANDARD_CHANNEL_LENGTH ||
        channel.length === HK.ADMIN_CHANNEL_LENGTH) {
        return void store.getChannelSize(channel, function (e, size) {
            if (e) {
                if (e.code === 'ENOENT') { return void cb(void 0, 0); }
                return void cb(e.code);
            }
            cb(void 0, size);
        });
    }

    // 'channel' refers to a file, so you need another API
    blobStore.size(channel, function (e, size) {
        if (typeof(size) === 'undefined') { return void cb(e); }
        cb(void 0, size);
    });
};

const getFileSize = function (data, cb) {
    _getFileSize(data.channel, cb);
};

const _iterateFiles = function (channels, handler, cb) {
    if (!Array.isArray(channels)) { return cb('INVALID_LIST'); }
    var L = channels.length;
    var sem = Saferphore.create(10);

    // (channel, next) => { ??? }
    var job = function (channel, wait) {
        return function (give) {
            handler(channel, wait(give()));
        };
    };

    nThen(function (w) {
        for (var i = 0; i < L; i++) {
            sem.take(job(channels[i], w));
        }
    }).nThen(function () {
        cb();
    });
};

const getTotalSize = function (data, cb) {
    var bytes = 0;
    _iterateFiles(data.channels, function (channel, next) {
        _getFileSize(channel, function (err, size) {
            if (!err) { bytes += size; }
            next();
        });
    }, function (err) {
        if (err) { return cb(err); }
        cb(void 0, bytes);
    });
};

const getDeletedPads = function (data, cb) {
    var absentees = [];
    _iterateFiles(data.channels, function (channel, next) {
        _getFileSize(channel, function (err, size) {
            if (err) { return next(); }
            if (size === 0) { absentees.push(channel); }
            next();
        });
    }, function (err) {
        if (err) { return void cb(err); }
        cb(void 0, absentees);
    });
};

const getMultipleFileSize = function (data, cb) {
    const counts = {};
    _iterateFiles(data.channels, function (channel, next) {
        _getFileSize(channel, function (err, size) {
            counts[channel] = err? 0: size;
            next();
        });
    }, function (err) {
        if (err) {
            return void cb(err);
        }
        cb(void 0, counts);
    });
};

const getHashOffset = function (data, cb) {
    const channelName = data.channel;
    const lastKnownHash = data.hash;
    if (typeof(lastKnownHash) !== 'string') { return void cb("INVALID_HASH"); }

    var offset = -1;
    store.readMessagesBin(channelName, 0, (msgObj, readMore, abort) => {
        // tryParse return a parsed message or undefined
        const msg = HK.tryParse(Env, msgObj.buff.toString('utf8'));
        // if it was undefined then go onto the next message
        if (typeof msg === "undefined") { return readMore(); }
        if (typeof(msg[4]) !== 'string' || lastKnownHash !== HK.getHash(msg[4])) {
            return void readMore();
        }
        offset = msgObj.offset;
        abort();
    }, function (err, reason) {
        if (err) {
            return void cb({
                error: err,
                reason: reason
            });
        }
        cb(void 0, offset);
    });
};

const removeOwnedBlob = function (data, cb) {
    if (typeof(data.safeKey) !== 'string') { return void cb("INVALID_KEY"); }
    const blobId = data.blobId;
    const safeKey = Util.escapeKeyCharacters(data.safeKey);

    const reason = data.reason || 'ARCHIVE_OWNED';

    nThen(function (w) {
        // check if you have permissions
        blobStore.isOwnedBy(safeKey, blobId, w(function (err, owned) {
            if (err || !owned) {
                w.abort();
                return void cb("INSUFFICIENT_PERMISSIONS");
            }
        }));
    }).nThen(function (w) {
        // remove the blob
        blobStore.archive.blob(blobId, reason, w(function (err) {
            Env.Log.info('ARCHIVAL_OWNED_FILE_BY_OWNER_RPC', {
                safeKey: safeKey,
                blobId: blobId,
                status: err? String(err): 'SUCCESS',
            });
            if (err) {
                w.abort();
                return void cb(err);
            }
        }));
    }).nThen(function () {
        // archive the proof
        blobStore.archive.proof(safeKey, blobId, function (err) {
            Env.Log.info("ARCHIVAL_PROOF_REMOVAL_BY_OWNER_RPC", {
                safeKey: safeKey,
                blobId: blobId,
                status: err? String(err): 'SUCCESS',
            });
            if (err) {
                return void cb("E_PROOF_REMOVAL");
            }
            cb(void 0, 'OK');
        });
    });
};

const runTasks = function (data, cb) {
    Env.tasks.runAll(cb);
};

const writeTask = function (data, cb) {
    Env.tasks.write(data.time, data.task_command, data.args, cb);
};

const evictInactive = function (data, cb) {
    Eviction(Env, cb);
};

var reportStatus = function (Env, label, safeKey, err, id, size) {
    var data = {
        safeKey: safeKey,
        err: err && err.message || err,
        id: id,
        size: size,
        sizeMB: round((size || 0) / 1024 / 1024),
    };
    var method = err? 'error': 'info';
    Env.Log[method](label, data);
};

const completeUpload = function (data, cb) {
    if (!data) { return void cb('INVALID_ARGS'); }
    if (typeof(data.safeKey) !== 'string') { return void cb("INVALID_KEY"); }
    var owned = data.owned;
    var safeKey = Util.escapeKeyCharacters(data.safeKey);
    var arg = data.arg;
    var size = data.size;

    var method;
    var label;
    if (owned) {
        method = 'completeOwned';
        label = 'UPLOAD_COMPLETE_OWNED';
    } else {
        method = 'complete';
        label = 'UPLOAD_COMPLETE';
    }

    Env.blobStore[method](safeKey, arg, function (err, id) {
        reportStatus(Env, label, safeKey, err, id, size);
        cb(err, id);
    });
};

const getPinActivity = function (data, cb) {
    if (!data) { return void cb("INVALID_ARGS"); }
    if (typeof(data.key) !== 'string') { return void cb("INVALID_KEY"); }
    var safeKey = Util.escapeKeyCharacters(data.key);
    var first;
    var latest;
    pinStore.readMessagesBin(safeKey, 0, (msgObj, readMore) => {
        var line = msgObj.buff.toString('utf8');
        if (!line || !line.trim()) { return readMore(); }
        try {
            var parsed = JSON.parse(line);
            var temp = parsed[parsed.length - 1];
            if (!temp || typeof(temp) !== 'number') { return readMore(); }
            latest = temp;
            if (first) { return readMore(); }
            first = latest;
            readMore();
        } catch (err) { readMore(); }
    }, function (err) {
        if (err) { return void cb(err); }
        cb(void 0, {
            first: first,
            latest: latest,
        });
    });
};

const getLastChannelTime = function (data, cb) {
    if (!data) { return void cb("INVALID_ARGS"); }
    var latest;
    store.getMessages(data.channel, function (line) {
        try {
            var parsed = JSON.parse(line);
            var temp = parsed[parsed.length - 1];
            if (!temp || typeof(temp) !== 'number') { return; }
            latest = temp;
        } catch (err) { }
    }, function (err) {
        if (err) { return void cb(err); }
        cb(void 0, latest);
    });
};

const COMMANDS = {
    COMPUTE_INDEX: computeIndex,
    COMPUTE_METADATA: computeMetadata,
    GET_OLDER_HISTORY: getOlderHistory,
    GET_PIN_STATE: getPinState,
    GET_FILE_SIZE: getFileSize,
    GET_TOTAL_SIZE: getTotalSize,
    GET_DELETED_PADS: getDeletedPads,
    GET_MULTIPLE_FILE_SIZE: getMultipleFileSize,
    GET_HASH_OFFSET: getHashOffset,
    REMOVE_OWNED_BLOB: removeOwnedBlob,
    RUN_TASKS: runTasks,
    WRITE_TASK: writeTask,
    EVICT_INACTIVE: evictInactive,
    COMPLETE_UPLOAD: completeUpload,
    GET_PIN_ACTIVITY: getPinActivity,
    GET_LAST_CHANNEL_TIME: getLastChannelTime,
};

COMMANDS.INLINE = function (data, cb) {
    var signedMsg;
    try {
        signedMsg = Nacl.util.decodeBase64(data.msg);
    } catch (e) {
        return void cb('E_BAD_MESSAGE');
    }

    var validateKey;
    try {
        validateKey = Nacl.util.decodeBase64(data.key);
    } catch (e) {
        return void cb("E_BADKEY");
    }
    // validate the message
    const validated = Nacl.sign.open(signedMsg, validateKey);
    if (!validated) {
        return void cb("FAILED");
    }
    cb();
};

const checkDetachedSignature = function (signedMsg, signature, publicKey) {
    if (!(signedMsg && publicKey)) { return false; }

    var signedBuffer;
    var pubBuffer;
    var signatureBuffer;

    try {
        signedBuffer = Nacl.util.decodeUTF8(signedMsg);
    } catch (e) {
        throw new Error("INVALID_SIGNED_BUFFER");
    }

    try {
        pubBuffer = Nacl.util.decodeBase64(publicKey);
    } catch (e) {
        throw new Error("INVALID_PUBLIC_KEY");
    }

    try {
        signatureBuffer = Nacl.util.decodeBase64(signature);
    } catch (e) {
        throw new Error("INVALID_SIGNATURE");
    }

    if (pubBuffer.length !== 32) {
        throw new Error("INVALID_PUBLIC_KEY_LENGTH");
    }

    if (signatureBuffer.length !== 64) {
        throw new Error("INVALID_SIGNATURE_LENGTH");
    }

    if (Nacl.sign.detached.verify(signedBuffer, signatureBuffer, pubBuffer) !== true) {
        throw new Error("FAILED");
    }
};

COMMANDS.DETACHED = function (data, cb) {
    try {
        checkDetachedSignature(data.msg, data.sig, data.key);
    } catch (err) {
        return void cb(err && err.message);
    }
    cb();
};

COMMANDS.HASH_CHANNEL_LIST = function (data, cb) {
    var channels = data.channels;
    if (!Array.isArray(channels)) { return void cb('INVALID_CHANNEL_LIST'); }
    var uniques = [];

    channels.forEach(function (a) {
        if (uniques.indexOf(a) === -1) { uniques.push(a); }
    });
    uniques.sort();

    var hash = Nacl.util.encodeBase64(Nacl.hash(Nacl
        .util.decodeUTF8(JSON.stringify(uniques))));

    cb(void 0, hash);
};

COMMANDS.VALIDATE_ANCESTOR_PROOF = function (data, cb) {
    Block.validateAncestorProof(Env, data && data.proof, cb);
};

COMMANDS.VALIDATE_LOGIN_BLOCK = function (data, cb) {
    Block.validateLoginBlock(Env, data.publicKey, data.signature, data.block, cb);
};

process.on('message', function (data) {
    if (!data || !data.txid || !data.pid) {
        return void process.send({
            error:'E_INVAL',
            data: data,
        });
    }

    const cb = function (err, value) {
        process.send({
            error: Util.serializeError(err),
            txid: data.txid,
            pid: data.pid,
            value: value,
        });
    };

    if (!ready) {
        return void init(data.config, function (err) {
            if (err) { return void cb(Util.serializeError(err)); }
            ready = true;
            cb();
        });
    }

    const command = COMMANDS[data.command];
    if (typeof(command) !== 'function') {
        return void cb("E_BAD_COMMAND");
    }
    command(data, cb);
});

process.on('uncaughtException', function (err) {
    console.error('[%s] UNCAUGHT EXCEPTION IN DB WORKER', new Date());
    console.error(err);
    console.error("TERMINATING");
    process.exit(1);
});
