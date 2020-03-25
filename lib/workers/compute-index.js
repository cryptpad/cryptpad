/* jshint esversion: 6 */
/* global process */

const HK = require("../hk-util");
const Store = require("../storage/file");
const Util = require("../common-util");
const nThen = require("nthen");
const Meta = require("../metadata");
const Pins = require("../pins");

const Env = {};

var ready = false;
var store;
var pinStore;
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

const COMMANDS = {
    COMPUTE_INDEX: computeIndex,
    COMPUTE_METADATA: computeMetadata,
    GET_OLDER_HISTORY: getOlderHistory,
    GET_PIN_STATE: getPinState,
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

