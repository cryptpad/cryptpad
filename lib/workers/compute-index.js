/* jshint esversion: 6 */
/* global process */

const HK = require("../hk-util");
const Store = require("../storage/file");
const BlobStore = require("../storage/blob");
const Util = require("../common-util");
const nThen = require("nthen");
const Meta = require("../metadata");
const Pins = require("../pins");
const Core = require("../commands/core");
const Saferphore = require("saferphore");

const Env = {};

var ready = false;
var store;
var pinStore;
var blobStore;
const init = function (config, _cb) {
    const cb = Util.once(Util.mkAsync(_cb));
    if (!config) {
        return void cb('E_INVALID_CONFIG');
    }

    nThen(function (w) {
        Store.create(config, w(function (err, _store) {
            if (err) {
                w.abort();
                return void cb(err);
            }
            store = _store;
        }));
        Store.create({
            filePath: config.pinPath,
        }, w(function (err, _pinStore) {
            if (err) {
                w.abort();
                return void cb(err);
            }
            pinStore = _pinStore;
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
            blobStore = blob;
        }));
    }).nThen(function () {
        cb();
    });
};

const tryParse = function (Env, str) {
    try { return JSON.parse(str); } catch (err) { }
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
const computeIndex = function (data, cb) {
    if (!data || !data.channel) {
        return void cb('E_NO_CHANNEL');
    }

    const channelName = data.channel;

    const cpIndex = [];
    let messageBuf = [];
    let i = 0;

    const CB = Util.once(cb);

    const offsetByHash = {};
    let size = 0;
    nThen(function (w) {
        // iterate over all messages in the channel log
        // old channels can contain metadata as the first message of the log
        // skip over metadata as that is handled elsewhere
        // otherwise index important messages in the log
        store.readMessagesBin(channelName, 0, (msgObj, readMore) => {
            let msg;
            // keep an eye out for the metadata line if you haven't already seen it
            // but only check for metadata on the first line
            if (!i && msgObj.buff.indexOf('{') === 0) {
                i++; // always increment the message counter
                msg = tryParse(Env, msgObj.buff.toString('utf8'));
                if (typeof msg === "undefined") { return readMore(); }

                // validate that the current line really is metadata before storing it as such
                // skip this, as you already have metadata...
                if (HK.isMetadataMessage(msg)) { return readMore(); }
            }
            i++;
            if (msgObj.buff.indexOf('cp|') > -1) {
                msg = msg || tryParse(Env, msgObj.buff.toString('utf8'));
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
            // map the 'hash' of each message to its byte offset in the log, to be used for reconnecting clients
            messageBuf.forEach((msgObj) => {
                const msg = tryParse(Env, msgObj.buff.toString('utf8'));
                if (typeof msg === "undefined") { return; }
                if (msg[0] === 0 && msg[2] === 'MSG' && typeof(msg[4]) === 'string') {
                    // msgObj.offset is API guaranteed by our storage module
                    // it should always be a valid positive integer
                    offsetByHash[HK.getHash(msg[4])] = msgObj.offset;
                }
                // There is a trailing \n at the end of the file
                size = msgObj.offset + msgObj.buff.length + 1;
            });
        }));
    }).nThen(function () {
        // return the computed index
        CB(null, {
            // Only keep the checkpoints included in the last 100 messages
            cpIndex: HK.sliceCpIndex(cpIndex, i),
            offsetByHash: offsetByHash,
            size: size,
            //metadata: metadata,
            line: i
        });
    });
};

const computeMetadata = function (data, cb, errorHandler) {
    const ref = {};
    const lineHandler = Meta.createLineHandler(ref, errorHandler);
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
    const channelName = data.channel;

    //const store = Env.store;
    //const Log = Env.Log;
    var messageBuffer = [];
    var found = false;
    store.getMessages(channelName, function (msgStr) {
        if (found) { return; }

        let parsed = tryParse(Env, msgStr);
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
        messageBuffer.push(parsed);
    }, function (err) {
        cb(err, messageBuffer);
    });
};

const getPinState = function (data, cb, errorHandler) {
    const safeKey = data.key;

    var ref = {};
    var lineHandler = Pins.createLineHandler(ref, errorHandler);

    // if channels aren't in memory. load them from disk
    // TODO replace with readMessagesBin
    pinStore.getMessages(safeKey, lineHandler, function () {
        cb(void 0, ref.pins); // FIXME no error handling?
    });
};

const _getFileSize = function (channel, _cb) {
    var cb = Util.once(Util.mkAsync(_cb));
    if (!Core.isValidId(channel)) { return void cb('INVALID_CHAN'); }
    if (channel.length === 32) {
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
    const lastKnownHash = data.lastKnownHash;

    var offset = -1;
    store.readMessagesBin(channelName, 0, (msgObj, readMore, abort) => {
        // tryParse return a parsed message or undefined
        const msg = tryParse(Env, msgObj.buff.toString('utf8'));
        // if it was undefined then go onto the next message
        if (typeof msg === "undefined") { return readMore(); }
        if (typeof(msg[4]) !== 'string' || lastKnownHash !== HK.getHash(msg[4])) {
            return void readMore();
        }
        offset = msgObj.offset;
        abort();
    }, function (err) {
        if (err) { return void cb(err); }
        cb(void 0, offset);
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
};

process.on('message', function (data) {
    if (!data || !data.txid) {
        return void process.send({
            error:'E_INVAL'
        });
    }

    const cb = function (err, value) {
        process.send({
            error: err,
            txid: data.txid,
            value: value,
        });
    };

    if (!ready) {
        return void init(data.config, function (err) {
            if (err) { return void cb(err); }
            ready = true;
            cb();
        });
    }

    const command = COMMANDS[data.command];
    if (typeof(command) !== 'function') {
        return void cb("E_BAD_COMMAND");
    }
    command(data, cb, function (label, info) {
        // for streaming errors
        process.send({
            error: label,
            value: info,
        });
    });
});

