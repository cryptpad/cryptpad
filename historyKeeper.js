/* jshint esversion: 6 */
/* global Buffer, process */
;(function () { 'use strict';

const nThen = require('nthen');
const Nacl = require('tweetnacl');
const Crypto = require('crypto');
const Once = require("./lib/once");
const Meta = require("./lib/metadata");

let Log;
const now = function () { return (new Date()).getTime(); };

/*  getHash
    * this function slices off the leading portion of a message which is
      most likely unique
    * these "hashes" are used to identify particular messages in a channel's history
    * clients store "hashes" either in memory or in their drive to query for new messages:
      * when reconnecting to a pad
      * when connecting to chat or a mailbox
    * thus, we can't change this function without invalidating client data which:
      * is encrypted clientside
      * can't be easily migrated
    * don't break it!
*/
const getHash = function (msg) {
    if (typeof(msg) !== 'string') {
        Log.warn('HK_GET_HASH', 'getHash() called on ' + typeof(msg) + ': ' + msg);
        return '';
    }
    return msg.slice(0,64);
};

const tryParse = function (str) {
    try {
        return JSON.parse(str);
    } catch (err) {
        Log.error('HK_PARSE_ERROR', err);
    }
};

/*  sliceCpIndex
    returns a list of all checkpoints which might be relevant for a client connecting to a session

    * if there are two or fewer checkpoints, return everything you have
    * if there are more than two
      * return at least two
      * plus any more which were received within the last 100 messages

    This is important because the additional history is what prevents
    clients from forking on checkpoints and dropping forked history.

*/
const sliceCpIndex = function (cpIndex, line) {
    // Remove "old" checkpoints (cp sent before 100 messages ago)
    const minLine = Math.max(0, (line - 100));
    let start = cpIndex.slice(0, -2);
    const end = cpIndex.slice(-2);
    start = start.filter(function (obj) {
        return obj.line > minLine;
    });
    return start.concat(end);
};

const isMetadataMessage = function (parsed) {
    return Boolean(parsed && parsed.channel);
};

module.exports.create = function (cfg) {
    const rpc = cfg.rpc;
    const tasks = cfg.tasks;
    const store = cfg.store;
    Log = cfg.log;

    Log.silly('HK_LOADING', 'LOADING HISTORY_KEEPER MODULE');

    const metadata_cache = {};
    const HISTORY_KEEPER_ID = Crypto.randomBytes(8).toString('hex');

    Log.verbose('HK_ID', 'History keeper ID: ' + HISTORY_KEEPER_ID);

    let sendMsg = function () {};
    let STANDARD_CHANNEL_LENGTH, EPHEMERAL_CHANNEL_LENGTH;
    const setConfig = function (config) {
        STANDARD_CHANNEL_LENGTH = config.STANDARD_CHANNEL_LENGTH;
        EPHEMERAL_CHANNEL_LENGTH = config.EPHEMERAL_CHANNEl_LENGTH;
        sendMsg = config.sendMsg;
    };

    /*  computeIndex
        can call back with an error or a computed index which includes:
            * cpIndex:
                * array including any checkpoints pushed within the last 100 messages
                * processed by 'sliceCpIndex(cpIndex, line)'
            * offsetByHash:
                * a map containing message offsets by their hash
                * this is for every message in history, so it could be very large...
                    * XXX OFFSET
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
    const computeIndex = function (channelName, cb) {
        const cpIndex = [];
        let messageBuf = [];
        let metadata;
        let i = 0;

        const ref = {};

        const CB = Once(cb);

        const offsetByHash = {};
        let size = 0;
        nThen(function (w) {
            // iterate over all messages in the channel log
            // old channels can contain metadata as the first message of the log
            // remember metadata the first time you encounter it
            // otherwise index important messages in the log
            store.readMessagesBin(channelName, 0, (msgObj, readMore) => {
                let msg;
                // keep an eye out for the metadata line if you haven't already seen it
                // but only check for metadata on the first line
                if (!i && !metadata && msgObj.buff.indexOf('{') === 0) {
                    i++; // always increment the message counter
                    msg = tryParse(msgObj.buff.toString('utf8'));
                    if (typeof msg === "undefined") { return readMore(); }

                    // validate that the current line really is metadata before storing it as such
                    if (isMetadataMessage(msg)) {
                        metadata = msg;
                        return readMore();
                    }
                }
                i++;
                if (msgObj.buff.indexOf('cp|') > -1) {
                    msg = msg || tryParse(msgObj.buff.toString('utf8'));
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
                    const msg = tryParse(msgObj.buff.toString('utf8'));
                    if (typeof msg === "undefined") { return; }
                    if (msg[0] === 0 && msg[2] === 'MSG' && typeof(msg[4]) === 'string') {
                        // msgObj.offset is API guaranteed by our storage module
                        // it should always be a valid positive integer
                        offsetByHash[getHash(msg[4])] = msgObj.offset;
                    }
                    // There is a trailing \n at the end of the file
                    size = msgObj.offset + msgObj.buff.length + 1;
                });
            }));
        }).nThen(function (w) {
            // create a function which will iterate over amendments to the metadata
            const handler = Meta.createLineHandler(ref, Log.error);

            // initialize the accumulator in case there was a foundational metadata line in the log content
            if (metadata) { handler(void 0, metadata); }

            // iterate over the dedicated metadata log (if it exists)
            // proceed even in the event of a stream error on the metadata log
            store.readDedicatedMetadata(channelName, handler, w(function (err) {
                if (err) {
                    return void Log.error("DEDICATED_METADATA_ERROR", err);
                }
            }));
        }).nThen(function () {
            // when all is done, cache the metadata in memory
            if (ref.index) { // but don't bother if no metadata was found...
                metadata = metadata_cache[channelName] = ref.meta;
            }
            // and return the computed index
            CB(null, {
                // Only keep the checkpoints included in the last 100 messages
                cpIndex: sliceCpIndex(cpIndex, i),
                offsetByHash: offsetByHash,
                size: size,
                metadata: metadata,
                line: i
            });
        });
    };

    /*  getIndex
        calls back with an error if anything goes wrong
        or with a cached index for a channel if it exists
            (along with metadata)
        otherwise it calls back with the index computed by 'computeIndex'

        as an added bonus:
        if the channel exists but its index does not then it caches the index
    */
    const getIndex = (ctx, channelName, cb) => {
        const chan = ctx.channels[channelName];
        if (chan && chan.index) {
            // enforce async behaviour
            return void setTimeout(function () {
                cb(undefined, chan.index);
            });
        }
        computeIndex(channelName, (err, ret) => {
            if (err) { return void cb(err); }
            if (chan) { chan.index = ret; }
            cb(undefined, ret);
        });
    };

    /*::
    type cp_index_item = {
        offset: number,
        line: number
    }
    */

    /*  storeMessage
        * ctx
        * channel id
        * the message to store
        * whether the message is a checkpoint
        * optionally the hash of the message
            * it's not always used, but we guard against it


        * async but doesn't have a callback
        * source of a race condition whereby:
          * two messaages can be inserted
          * two offsets can be computed using the total size of all the messages
          * but the offsets don't correspond to the actual location of the newlines
            * because the two actions were performed like ABba...
        * the fix is to use callbacks and implement queueing for writes
          * to guarantee that offset computation is always atomic with writes

        TODO rename maybeMsgHash to optionalMsgHash
    */
    const storeMessage = function (ctx, channel, msg, isCp, maybeMsgHash) {
        const msgBin = new Buffer(msg + '\n', 'utf8');
        // Store the message first, and update the index only once it's stored.
        // store.messageBin can be async so updating the index first may
        // result in a wrong cpIndex
        nThen((waitFor) => {
            store.messageBin(channel.id, msgBin, waitFor(function (err) {
                if (err) {
                    waitFor.abort();
                    return void Log.error("HK_STORE_MESSAGE_ERROR", err.message);
                }
            }));
        }).nThen((waitFor) => {
            getIndex(ctx, channel.id, waitFor((err, index) => {
                if (err) {
                    Log.warn("HK_STORE_MESSAGE_INDEX", err.stack);
                    // non-critical, we'll be able to get the channel index later
                    return;
                }
                if (typeof (index.line) === "number") { index.line++; }
                if (isCp) {
                    index.cpIndex = sliceCpIndex(index.cpIndex, index.line || 0);
                    for (let k in index.offsetByHash) {
                        // XXX OFFSET
                        if (index.offsetByHash[k] < index.cpIndex[0]) {
                            delete index.offsetByHash[k];
                        }
                    }
                    index.cpIndex.push(({
                        offset: index.size,
                        line: ((index.line || 0) + 1)
                    } /*:cp_index_item*/));
                }
                if (maybeMsgHash) { index.offsetByHash[maybeMsgHash] = index.size; }
                index.size += msgBin.length;
            }));
        });
    };

    var CHECKPOINT_PATTERN = /^cp\|(([A-Za-z0-9+\/=]+)\|)?/;

    /*  onChannelMessage
        Determine what we should store when a message a broadcasted to a channel"

        * ignores ephemeral channels
        * ignores messages sent to expired channels
        * rejects duplicated checkpoints
        * validates messages to channels that have validation keys
        * caches the id of the last saved checkpoint
        * adds timestamps to incoming messages
        * writes messages to the store


    */
    const onChannelMessage = function (ctx, channel, msgStruct) {
        // don't store messages if the channel id indicates that it's an ephemeral message
        if (!channel.id || channel.id.length === EPHEMERAL_CHANNEL_LENGTH) { return; }

        const isCp = /^cp\|/.test(msgStruct[4]);
        if (metadata_cache[channel.id] && metadata_cache[channel.id].expire &&
                metadata_cache[channel.id].expire < +new Date()) {
            return; // Don't store messages on expired channel
            // TODO if a channel expired a long time ago but it's still here, remove it
        }
        let id;
        if (isCp) {
            /*::if (typeof(msgStruct[4]) !== 'string') { throw new Error(); }*/
            id = CHECKPOINT_PATTERN.exec(msgStruct[4]);
            if (Array.isArray(id) && id[2] && id[2] === channel.lastSavedCp) {
                // Reject duplicate checkpoints
                return;
            }
        }
        var metadata = metadata_cache[channel.id];
        if (metadata && metadata.validateKey) {
            /*::if (typeof(msgStruct[4]) !== 'string') { throw new Error(); }*/
            let signedMsg = (isCp) ? msgStruct[4].replace(CHECKPOINT_PATTERN, '') : msgStruct[4];
            signedMsg = Nacl.util.decodeBase64(signedMsg);
            // FIXME PERFORMANCE: cache the decoded key instead of decoding it every time
            // CPU/Memory tradeoff
            const validateKey = Nacl.util.decodeBase64(metadata.validateKey);
            const validated = Nacl.sign.open(signedMsg, validateKey);
            if (!validated) {
                Log.info("HK_SIGNED_MESSAGE_REJECTED", 'Channel '+channel.id);
                return;
            }
        }
        if (isCp) {
            // WARNING: the fact that we only check the most recent checkpoints
            // is a potential source of bugs if one editor has high latency and
            // pushes a duplicate of an earlier checkpoint than the latest which
            // has been pushed by editors with low latency
            // FIXME
            if (Array.isArray(id) && id[2]) {
                // Store new checkpoint hash
                channel.lastSavedCp = id[2];
            }
        }
        msgStruct.push(now());
        storeMessage(ctx, channel, JSON.stringify(msgStruct), isCp, getHash(msgStruct[4]));
    };

    /*  dropChannel
        * exported as API
          * used by chainpad-server/NetfluxWebsocketSrv.js
        * cleans up memory structures which are managed entirely by the historyKeeper
          * the netflux server manages other memory in ctx.channels
    */
    const dropChannel = function (chanName) {
        delete metadata_cache[chanName];
    };

    /*  getHistoryOffset
        returns a number representing the byte offset from the start of the log
        for whatever history you're seeking.

        query by providing a 'lastKnownHash',
            which is really just a string of the first 64 characters of an encrypted message.
        OR by -1 which indicates that we want the full history (byte offset 0)
        OR nothing, which indicates that you want whatever messages the historyKeeper deems relevant
            (typically the last few checkpoints)

        this function embeds a lot of the history keeper's logic:

        0. if you passed -1 as the lastKnownHash it means you want the complete history
          * I'm not sure why you'd need to call this function if you know it will return 0 in this case...
          * it has a side-effect of filling the index cache if it's empty
        1. if you provided a lastKnownHash and that message does not exist in the history:
          * either the client has made a mistake or the history they knew about no longer exists
          * call back with EINVAL
        2. if you did not provide a lastKnownHash
          * and there are fewer than two checkpoints:
            * return 0 (read from the start of the file)
          * and there are two or more checkpoints:
            * return the offset of the earliest checkpoint which 'sliceCpIndex' considers relevant
        3. if you did provide a lastKnownHash
          * read through the log until you find the hash that you're looking for
          * call back with either the byte offset of the message that you found OR
          * -1 if you didn't find it

    */
    const getHistoryOffset = (ctx, channelName, lastKnownHash, cb /*:(e:?Error, os:?number)=>void*/) => {
        // lastKnownhash === -1 means we want the complete history
        if (lastKnownHash === -1) { return void cb(null, 0); }
        let offset = -1;
        nThen((waitFor) => {
            getIndex(ctx, channelName, waitFor((err, index) => {
                if (err) { waitFor.abort(); return void cb(err); }

                // check if the "hash" the client is requesting exists in the index
                const lkh = index.offsetByHash[lastKnownHash];
                // we evict old hashes from the index as new checkpoints are discovered.
                // if someone connects and asks for a hash that is no longer relevant,
                // we tell them it's an invalid request. This is because of the semantics of "GET_HISTORY"
                // which is only ever used when connecting or reconnecting in typical uses of history...
                // this assumption should hold for uses by chainpad, but perhaps not for other uses cases.
                // EXCEPT: other cases don't use checkpoints!
                // clients that are told that their request is invalid should just make another request
                // without specifying the hash, and just trust the server to give them the relevant data.
                // QUESTION: does this mean mailboxes are causing the server to store too much stuff in memory?
                if (lastKnownHash && typeof(lkh) !== "number") {
                    waitFor.abort();
                    // XXX this smells bad
                    return void cb(new Error('EINVAL'));
                }

                // Since last 2 checkpoints
                if (!lastKnownHash) {
                    waitFor.abort();
                    // Less than 2 checkpoints in the history: return everything
                    if (index.cpIndex.length < 2) { return void cb(null, 0); }
                    // Otherwise return the second last checkpoint's index
                    return void cb(null, index.cpIndex[0].offset);
                    /* LATER...
                        in practice, two checkpoints can be very close together
                        we have measures to avoid duplicate checkpoints, but editors
                        can produce nearby checkpoints which are slightly different,
                        and slip past these protections. To be really careful, we can
                        seek past nearby checkpoints by some number of patches so as
                        to ensure that all editors have sufficient knowledge of history
                        to reconcile their differences. */
                }

                offset = lkh;
            }));
        }).nThen((waitFor) => {
            // if offset is less than zero then presumably the channel has no messages
            // returning falls through to the next block and therefore returns -1
            if (offset !== -1) { return; }

            // do a lookup from the index
            // XXX maybe we don't need this anymore?
            // otherwise we have a non-negative offset and we can start to read from there
            store.readMessagesBin(channelName, 0, (msgObj, readMore, abort) => {
                // tryParse return a parsed message or undefined
                const msg = tryParse(msgObj.buff.toString('utf8'));
                // if it was undefined then go onto the next message
                if (typeof msg === "undefined") { return readMore(); }
                if (typeof(msg[4]) !== 'string' || lastKnownHash !== getHash(msg[4])) {
                    return void readMore();
                }
                offset = msgObj.offset;
                abort();
            }, waitFor(function (err) {
                if (err) { waitFor.abort(); return void cb(err); }
            }));
        }).nThen(() => {
            cb(null, offset);
        });
    };

    /*  getHistoryAsync
        * finds the appropriate byte offset from which to begin reading using 'getHistoryOffset'
        * streams through the rest of the messages, safely parsing them and returning the parsed content to the handler
        * calls back when it has reached the end of the log

        Used by:
        * GET_HISTORY

    */
    const getHistoryAsync = (ctx, channelName, lastKnownHash, beforeHash, handler, cb) => {
        let offset = -1;
        nThen((waitFor) => {
            getHistoryOffset(ctx, channelName, lastKnownHash, waitFor((err, os) => {
                if (err) {
                    waitFor.abort();
                    return void cb(err);
                }
                offset = os;
            }));
        }).nThen((waitFor) => {
            if (offset === -1) { return void cb(new Error("could not find offset")); }
            const start = (beforeHash) ? 0 : offset;
            store.readMessagesBin(channelName, start, (msgObj, readMore, abort) => {
                if (beforeHash && msgObj.offset >= offset) { return void abort(); }
                handler(tryParse(msgObj.buff.toString('utf8')), readMore);
            }, waitFor(function (err) {
                return void cb(err);
            }));
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
    const getOlderHistory = function (channelName, oldestKnownHash, cb) {
        var messageBuffer = [];
        var found = false;
        store.getMessages(channelName, function (msgStr) {
            if (found) { return; }

            let parsed = tryParse(msgStr);
            if (typeof parsed === "undefined") { return; }

            // identify classic metadata messages by their inclusion of a channel.
            // and don't send metadata, since:
            // 1. the user won't be interested in it
            // 2. this metadata is potentially incomplete/incorrect
            if (isMetadataMessage(parsed)) { return; }

            var content = parsed[4];
            if (typeof(content) !== 'string') { return; }

            var hash = getHash(content);
            if (hash === oldestKnownHash) {
                found = true;
            }
            messageBuffer.push(parsed);
        }, function (err) {
            if (err) {
                Log.error("HK_GET_OLDER_HISTORY", err);
            }
            cb(messageBuffer);
        });
    };

    /*::
    type Chan_t = {
        indexOf: (any)=>number,
        id: string,
        lastSavedCp: string,
        forEach: ((any)=>void)=>void,
        push: (any)=>void,
    };
    */

    /*  historyKeeperBroadcast
        * uses API from the netflux server to send messages to every member of a channel
        * sendMsg runs in a try-catch and drops users if sending a message fails
    */
    const historyKeeperBroadcast = function (ctx, channel, msg) {
        let chan = ctx.channels[channel] || (([] /*:any*/) /*:Chan_t*/);
        chan.forEach(function (user) {
            sendMsg(ctx, user, [0, HISTORY_KEEPER_ID, 'MSG', user.id, JSON.stringify(msg)]);
        });
    };

    /*  onChannelCleared
        * broadcasts to all clients in a channel if that channel is deleted
    */
    const onChannelCleared = function (ctx, channel) {
        historyKeeperBroadcast(ctx, channel, {
            error: 'ECLEARED',
            channel: channel
        });
    };
    // When a channel is removed from datastore, broadcast a message to all its connected users
    const onChannelDeleted = function (ctx, channel) {
        store.closeChannel(channel, function () {
            historyKeeperBroadcast(ctx, channel, {
                error: 'EDELETED',
                channel: channel
            });
        });
        delete ctx.channels[channel];
        delete metadata_cache[channel];
    };
    // Check if the selected channel is expired
    // If it is, remove it from memory and broadcast a message to its members

    const onChannelMetadataChanged = function (ctx, channel) {
        // XXX lint compliance
        channel = channel;
    };

    /*  checkExpired
        * synchronously returns true or undefined to indicate whether the channel is expired
          * according to its metadata
        * has some side effects:
          * closes the channel via the store.closeChannel API
            * and then broadcasts to all channel members that the channel has expired
          * removes the channel from the netflux-server's in-memory cache
          * removes the channel metadata from history keeper's in-memory cache

        FIXME the boolean nature of this API should be separated from its side effects
    */
    const checkExpired = function (ctx, channel) {
        if (channel && channel.length === STANDARD_CHANNEL_LENGTH && metadata_cache[channel] &&
                metadata_cache[channel].expire && metadata_cache[channel].expire < +new Date()) {
            store.closeChannel(channel, function () {
                historyKeeperBroadcast(ctx, channel, {
                    error: 'EEXPIRED',
                    channel: channel
                });
            });
            delete ctx.channels[channel];
            delete metadata_cache[channel];
            return true;
        }
        return;
    };

    /*  onDirectMessage
        * exported for use by the netflux-server
        * parses and handles all direct messages directed to the history keeper
          * check if it's expired and execute all the associated side-effects
          * routes queries to the appropriate handlers
            * GET_HISTORY
            * GET_HISTORY_RANGE
            * GET_FULL_HISTORY
            * RPC
              * if the rpc has special hooks that the history keeper needs to be aware of...
                * execute them here...

    */
    const onDirectMessage = function (ctx, seq, user, json) {
        let parsed;
        let channelName;
        let obj = HISTORY_KEEPER_ID;

        Log.silly('HK_MESSAGE', json);

        try {
            parsed = JSON.parse(json[2]);
        } catch (err) {
            Log.error("HK_PARSE_CLIENT_MESSAGE", json);
            return;
        }

        // If the requested history is for an expired channel, abort
        // Note the if we don't have the keys for that channel in metadata_cache, we'll
        // have to abort later (once we know the expiration time)
        if (checkExpired(ctx, parsed[1])) { return; }

        if (parsed[0] === 'GET_HISTORY') {
            // parsed[1] is the channel id
            // parsed[2] is a validation key or an object containing metadata (optionnal)
            // parsed[3] is the last known hash (optionnal)
            sendMsg(ctx, user, [seq, 'ACK']);
            channelName = parsed[1];
            var config = parsed[2];
            var metadata = {};
            var lastKnownHash;

            // clients can optionally pass a map of attributes
            // if the channel already exists this map will be ignored
            // otherwise it will be stored as the initial metadata state for the channel
            if (config && typeof config === "object" && !Array.isArray(parsed[2])) {
                lastKnownHash = config.lastKnownHash;
                metadata = config.metadata || {};
                if (metadata.expire) {
                    metadata.expire = +metadata.expire * 1000 + (+new Date());
                }
            }
            metadata.channel = channelName;

            nThen(function (waitFor) {
                var w = waitFor();

                /*  unless this is a young channel, we will serve all messages from an offset
                    this will not include the channel metadata, so we need to explicitly fetch that.
                    unfortunately, we can't just serve it blindly, since then young channels will
                    send the metadata twice, so let's do a quick check of what we're going to serve...
                */
                getIndex(ctx, channelName, waitFor((err, index) => {
                    /*  if there's an error here, it should be encountered
                        and handled by the next nThen block.
                        so, let's just fall through...
                    */
                    if (err) { return w(); }


                    // it's possible that the channel doesn't have metadata
                    // but in that case there's no point in checking if the channel expired
                    // or in trying to send metadata, so just skip this block
                    if (!index || !index.metadata) { return void w(); }
                    // And then check if the channel is expired. If it is, send the error and abort
                    // FIXME this is hard to read because 'checkExpired' has side effects
                    if (checkExpired(ctx, channelName)) { return void waitFor.abort(); }
                    // always send metadata with GET_HISTORY requests
                    sendMsg(ctx, user, [0, HISTORY_KEEPER_ID, 'MSG', user.id, JSON.stringify(index.metadata)], w);
                }));
            }).nThen(() => {
                let msgCount = 0;

                // TODO compute lastKnownHash in a manner such that it will always skip past the metadata line?
                getHistoryAsync(ctx, channelName, lastKnownHash, false, (msg, readMore) => {
                    if (!msg) { return; }
                    msgCount++;
                    // avoid sending the metadata message a second time
                    if (isMetadataMessage(msg) && metadata_cache[channelName]) { return readMore(); }
                    sendMsg(ctx, user, [0, HISTORY_KEEPER_ID, 'MSG', user.id, JSON.stringify(msg)], readMore);
                }, (err) => {
                    if (err && err.code !== 'ENOENT') {
                        if (err.message !== 'EINVAL') { Log.error("HK_GET_HISTORY", err); }
                        const parsedMsg = {error:err.message, channel: channelName};
                        sendMsg(ctx, user, [0, HISTORY_KEEPER_ID, 'MSG', user.id, JSON.stringify(parsedMsg)]);
                        return;
                    }

                    const chan = ctx.channels[channelName];

                    if (msgCount === 0 && !metadata_cache[channelName] && chan && chan.indexOf(user) > -1) {
                        metadata_cache[channelName] = metadata;

                        // the index will have already been constructed and cached at this point
                        // but it will not have detected any metadata because it hasn't been written yet
                        // this means that the cache starts off as invalid, so we have to correct it
                        if (chan && chan.index) { chan.index.metadata = metadata; }

                        // new channels will always have their metadata written to a dedicated metadata log
                        // but any lines after the first which are not amendments in a particular format will be ignored.
                        // Thus we should be safe from race conditions here if just write metadata to the log as below...
                        // TODO validate this logic
                        // otherwise maybe we need to check that the metadata log is empty as well
                        store.writeMetadata(channelName, JSON.stringify(metadata), function (err) {
                            if (err) {
                                // XXX tell the user that there was a channel error?
                                return void Log.error('HK_WRITE_METADATA');
                            }
                        });

                        // write tasks
                        if(tasks && metadata.expire && typeof(metadata.expire) === 'number') {
                            // the fun part...
                            // the user has said they want this pad to expire at some point
                            tasks.write(metadata.expire, "EXPIRE", [ channelName ], function (err) {
                                if (err) {
                                    // if there is an error, we don't want to crash the whole server...
                                    // just log it, and if there's a problem you'll be able to fix it
                                    // at a later date with the provided information
                                    Log.error('HK_CREATE_EXPIRE_TASK', err);
                                    Log.info('HK_INVALID_EXPIRE_TASK', JSON.stringify([metadata.expire, 'EXPIRE', channelName]));
                                }
                            });
                        }
                        sendMsg(ctx, user, [0, HISTORY_KEEPER_ID, 'MSG', user.id, JSON.stringify(metadata)]);
                    }

                    // End of history message:
                    let parsedMsg = {state: 1, channel: channelName};
                    sendMsg(ctx, user, [0, HISTORY_KEEPER_ID, 'MSG', user.id, JSON.stringify(parsedMsg)]);
                });
            });
        } else if (parsed[0] === 'GET_HISTORY_RANGE') {
            channelName = parsed[1];
            var map = parsed[2];
            if (!(map && typeof(map) === 'object')) {
                return void sendMsg(ctx, user, [seq, 'ERROR', 'INVALID_ARGS', obj]);
            }

            var oldestKnownHash = map.from;
            var desiredMessages = map.count;
            var desiredCheckpoint = map.cpCount;
            var txid = map.txid;
            if (typeof(desiredMessages) !== 'number' && typeof(desiredCheckpoint) !== 'number') {
                return void sendMsg(ctx, user, [seq, 'ERROR', 'UNSPECIFIED_COUNT', obj]);
            }

            if (!txid) {
                return void sendMsg(ctx, user, [seq, 'ERROR', 'NO_TXID', obj]);
            }

            sendMsg(ctx, user, [seq, 'ACK']);
            return void getOlderHistory(channelName, oldestKnownHash, function (messages) {
                var toSend = [];
                if (typeof (desiredMessages) === "number") {
                    toSend = messages.slice(-desiredMessages);
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
                toSend.forEach(function (msg) {
                    sendMsg(ctx, user, [0, HISTORY_KEEPER_ID, 'MSG', user.id,
                        JSON.stringify(['HISTORY_RANGE', txid, msg])]);
                });

                sendMsg(ctx, user, [0, HISTORY_KEEPER_ID, 'MSG', user.id,
                    JSON.stringify(['HISTORY_RANGE_END', txid, channelName])
                ]);
            });
        } else if (parsed[0] === 'GET_FULL_HISTORY') {
            // parsed[1] is the channel id
            // parsed[2] is a validation key (optionnal)
            // parsed[3] is the last known hash (optionnal)
            sendMsg(ctx, user, [seq, 'ACK']);

            // XXX should we send metadata here too?
            // my gut says yes
            getHistoryAsync(ctx, parsed[1], -1, false, (msg, readMore) => {
                if (!msg) { return; }
                sendMsg(ctx, user, [0, HISTORY_KEEPER_ID, 'MSG', user.id, JSON.stringify(['FULL_HISTORY', msg])], readMore);
            }, (err) => {
                let parsedMsg = ['FULL_HISTORY_END', parsed[1]];
                if (err) {
                    Log.error('HK_GET_FULL_HISTORY', err.stack);
                    parsedMsg = ['ERROR', parsed[1], err.message];
                }
                sendMsg(ctx, user, [0, HISTORY_KEEPER_ID, 'MSG', user.id, JSON.stringify(parsedMsg)]);
            });
        } else if (rpc) {
            /* RPC Calls...  */
            var rpc_call = parsed.slice(1);

            sendMsg(ctx, user, [seq, 'ACK']);
            try {
            // slice off the sequence number and pass in the rest of the message
            rpc(ctx, rpc_call, function (err, output) {
                if (err) {
                    sendMsg(ctx, user, [0, HISTORY_KEEPER_ID, 'MSG', user.id, JSON.stringify([parsed[0], 'ERROR', err])]);
                    return;
                }
                var msg = rpc_call[0].slice();
                if (msg[3] === 'REMOVE_OWNED_CHANNEL') {
                    onChannelDeleted(ctx, msg[4]);
                }
                if (msg[3] === 'CLEAR_OWNED_CHANNEL') {
                    onChannelCleared(ctx, msg[4]);
                }

                // FIXME METADATA CHANGE
                if (msg[3] === 'SET_METADATA') { // or whatever we call the RPC????
                    // make sure we update our cache of metadata
                    // or at least invalidate it and force other mechanisms to recompute its state
                    // 'output' could be the new state as computed by rpc
                    onChannelMetadataChanged(ctx, msg[4]);
                }

                sendMsg(ctx, user, [0, HISTORY_KEEPER_ID, 'MSG', user.id, JSON.stringify([parsed[0]].concat(output))]);
            });
            } catch (e) {
                sendMsg(ctx, user, [0, HISTORY_KEEPER_ID, 'MSG', user.id, JSON.stringify([parsed[0], 'ERROR', 'SERVER_ERROR'])]);
            }
        }
    };

    var cciLock = false;
    const checkChannelIntegrity = function (ctx) {
        if (process.env['CRYPTPAD_DEBUG'] && !cciLock) {
            let nt = nThen;
            cciLock = true;
            Object.keys(ctx.channels).forEach(function (channelName) {
                const chan = ctx.channels[channelName];
                if (!chan.index) { return; }
                nt = nt((waitFor) => {
                    store.getChannelSize(channelName, waitFor((err, size) => {
                        if (err) {
                            return void Log.debug("HK_CHECK_CHANNEL_INTEGRITY",
                                "Couldn't get size of channel " + channelName);
                        }
                        if (size !== chan.index.size) {
                            return void Log.debug("HK_CHECK_CHANNEL_SIZE",
                                "channel size mismatch for " + channelName +
                                " --- cached: " + chan.index.size +
                                " --- fileSize: " + size);
                        }
                    }));
                }).nThen;
            });
            nt(() => { cciLock = false; });
        }
    };

    return {
        id: HISTORY_KEEPER_ID,
        setConfig: setConfig,
        onChannelMessage: onChannelMessage,
        dropChannel: dropChannel,
        checkExpired: checkExpired,
        onDirectMessage: onDirectMessage,
        checkChannelIntegrity: checkChannelIntegrity
    };
};

}());
