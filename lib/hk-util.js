/* jshint esversion: 6 */
/* global Buffer */
var HK = module.exports;

const nThen = require('nthen');
const Util = require("./common-util");
const MetaRPC = require("./commands/metadata");
const Nacl = require('tweetnacl/nacl-fast');
const now = function () { return (new Date()).getTime(); };
const ONE_DAY = 1000 * 60 * 60 * 24; // one day in milliseconds

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
const getHash = HK.getHash = function (msg, Log) {
    if (typeof(msg) !== 'string') {
        if (Log) {
            Log.warn('HK_GET_HASH', 'getHash() called on ' + typeof(msg) + ': ' + msg);
        }
        return '';
    }
    return msg.slice(0,64);
};

// historyKeeper should explicitly store any channel
// with a 32 character id
const STANDARD_CHANNEL_LENGTH = HK.STANDARD_CHANNEL_LENGTH = 32;

// historyKeeper should not store messages sent to any channel
// with a 34 character id
const EPHEMERAL_CHANNEL_LENGTH = HK.EPHEMERAL_CHANNEL_LENGTH = 34;

const tryParse = HK.tryParse = function (Env, str) {
    try {
        return JSON.parse(str);
    } catch (err) {
        Env.Log.error('HK_PARSE_ERROR', {
            message: err && err.name,
            input: str,
        });
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
const sliceCpIndex = HK.sliceCpIndex = function (cpIndex, line) {
    // Remove "old" checkpoints (cp sent before 100 messages ago)
    const minLine = Math.max(0, (line - 100));
    let start = cpIndex.slice(0, -2);
    const end = cpIndex.slice(-2);
    start = start.filter(function (obj) {
        return obj.line > minLine;
    });
    return start.concat(end);
};

const isMetadataMessage = HK.isMetadataMessage = function (parsed) {
    return Boolean(parsed && parsed.channel);
};

HK.listAllowedUsers = function (metadata) {
    return (metadata.owners || []).concat((metadata.allowed || []));
};

HK.getNetfluxSession = function (Env, netfluxId) {
    return Env.netfluxUsers[netfluxId];
};

HK.isUserSessionAllowed = function (allowed, session) {
    if (!session) { return false; }
    for (var unsafeKey in session) {
        if (allowed.indexOf(unsafeKey) !== -1) {
            return true;
        }
    }
    return false;
};

HK.authenticateNetfluxSession = function (Env, netfluxId, unsafeKey) {
    var user = Env.netfluxUsers[netfluxId] = Env.netfluxUsers[netfluxId] || {};
    user[unsafeKey] = +new Date();
};

HK.closeNetfluxSession = function (Env, netfluxId) {
    delete Env.netfluxUsers[netfluxId];
};

// validateKeyStrings supplied by clients must decode to 32-byte Uint8Arrays
const isValidValidateKeyString = function (key) {
    try {
        return typeof(key) === 'string' &&
            Nacl.util.decodeBase64(key).length === Nacl.sign.publicKeyLength;
    } catch (e) {
        return false;
    }
};

var CHECKPOINT_PATTERN = /^cp\|(([A-Za-z0-9+\/=]+)\|)?/;

/*  expireChannel is here to clean up channels that should have been removed
    but for some reason are still present
*/
const expireChannel = function (Env, channel) {
    return void Env.store.archiveChannel(channel, function (err) {
        Env.Log.info("ARCHIVAL_CHANNEL_BY_HISTORY_KEEPER_EXPIRATION", {
            channelId: channel,
            status: err? String(err): "SUCCESS",
        });
    });
};

/*  dropChannel
    * cleans up memory structures which are managed entirely by the historyKeeper
*/
const dropChannel = HK.dropChannel = function (Env, chanName) {
    delete Env.metadata_cache[chanName];
    delete Env.channel_cache[chanName];
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
const checkExpired = function (Env, Server, channel) {
    const store = Env.store;
    const metadata_cache = Env.metadata_cache;

    if (!(channel && channel.length === STANDARD_CHANNEL_LENGTH)) { return false; }
    let metadata = metadata_cache[channel];
    if (!(metadata && typeof(metadata.expire) === 'number')) { return false; }

    // the number of milliseconds ago the channel should have expired
    let pastDue = (+new Date()) - metadata.expire;

    // less than zero means that it hasn't expired yet
    if (pastDue < 0) { return false; }

    // if it should have expired more than a day ago...
    // there may have been a problem with scheduling tasks
    // or the scheduled tasks may not be running
    // so trigger a removal from here
    if (pastDue >= ONE_DAY) { expireChannel(Env, channel); }

    // close the channel
    store.closeChannel(channel, function () {
        Server.channelBroadcast(channel, {
            error: 'EEXPIRED',
            channel: channel
        }, Env.id);
        dropChannel(Env, channel);
    });

    // return true to indicate that it has expired
    return true;
};

const getMetadata = HK.getMetadata = function (Env, channelName, _cb) {
    var cb = Util.once(Util.mkAsync(_cb));

    var metadata = Env.metadata_cache[channelName];
    if (metadata && typeof(metadata) === 'object') {
        return void cb(undefined, metadata);
    }

    MetaRPC.getMetadataRaw(Env, channelName, function (err, metadata) {
        if (err) {
            console.error(err);
            return void cb(err);
        }
        if (!(metadata && typeof(metadata.channel) === 'string' && metadata.channel.length === STANDARD_CHANNEL_LENGTH)) {
            return cb();
        }

        // cache it
        Env.metadata_cache[channelName] = metadata;
        cb(undefined, metadata);
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
const getIndex = (Env, channelName, cb) => {
    const channel_cache = Env.channel_cache;

    const chan = channel_cache[channelName];

    // if there is a channel in memory and it has an index cached, return it
    if (chan && chan.index) {
        // enforce async behaviour
        return void Util.mkAsync(cb)(undefined, chan.index);
    }

    Env.batchIndexReads(channelName, cb, function (done) {
        Env.computeIndex(Env, channelName, (err, ret) => {
            // this is most likely an unrecoverable filesystem error
            if (err) { return void done(err); }
            // cache the computed result if possible
            if (chan) { chan.index = ret; }
            // return
            done(void 0, ret);
        });
    });
};

/*  checkOffsetMap

Sorry for the weird function --ansuz

This should be almost equivalent to `Object.keys(map).length` except
that is will use less memory by not allocating space for the temporary array.
Beyond that, it returns length * -1 if any of the members of the map
are not in ascending order. The function for removing older members of the map
loops over elements in order and deletes them, so ordering is important!

*/
var checkOffsetMap = function (map) {
    var prev = 0;
    var cur;
    var ooo = 0; // out of order
    var count = 0;
    for (let k in map) {
        count++;
        cur = map[k];
        if (!ooo && prev > cur) { ooo = true; }
        prev = cur;
    }
    return ooo ? count * -1: count;
};

/* Pass the map and the number of elements it contains */
var trimOffsetByOrder = function (map, n) {
    var toRemove = Math.max(n - 50, 0);
    var i = 0;
    for (let k in map) {
        if (i >= toRemove) { return; }
        i++;
        delete map[k];
    }
};

/*  Remove from the map any byte offsets which are below
    the lowest offset you'd like to preserve
    (probably the oldest checkpoint */
var trimMapByOffset = function (map, offset) {
    if (!offset) { return; }
    for (let k in map) {
        if (map[k] < offset) {
            delete map[k];
        }
    }
};

/*  storeMessage
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
*/
const storeMessage = function (Env, channel, msg, isCp, optionalMessageHash) {
    const id = channel.id;
    const Log = Env.Log;

    Env.queueStorage(id, function (next) {
        const msgBin = Buffer.from(msg + '\n', 'utf8');
        // Store the message first, and update the index only once it's stored.
        // store.messageBin can be async so updating the index first may
        // result in a wrong cpIndex
        nThen((waitFor) => {
            Env.store.messageBin(id, msgBin, waitFor(function (err) {
                if (err) {
                    waitFor.abort();
                    Log.error("HK_STORE_MESSAGE_ERROR", err.message);

                    // this error is critical, but there's not much we can do at the moment
                    // proceed with more messages, but they'll probably fail too
                    // at least you won't have a memory leak

                    // TODO make it possible to respond to clients with errors so they know
                    // their message wasn't stored
                    return void next();
                }
            }));
        }).nThen((waitFor) => {
/*  TODO we can skip updating the index if there's nobody in the channel.
    Populating it might actually be the cause of a memory leak.
*/
            getIndex(Env, id, waitFor((err, index) => {
                if (err) {
                    Log.warn("HK_STORE_MESSAGE_INDEX", err.stack);
                    // non-critical, we'll be able to get the channel index later
                    return void next();
                }
                if (typeof (index.line) === "number") { index.line++; }
                if (isCp) {
                    index.cpIndex = sliceCpIndex(index.cpIndex, index.line || 0);
                    trimMapByOffset(index.offsetByHash, index.cpIndex[0]);
                    index.cpIndex.push({
                        offset: index.size,
                        line: ((index.line || 0) + 1)
                    });
                }
/*  This 'getIndex' call will construct a new index if one does not already exist.
    If that is the case then our message will already be present and updating our offset map
    can actually cause it to become incorrect, leading to incorrect behaviour when clients connect
    with a lastKnownHash. We avoid this by only assigning new offsets to the map.
*/
                if (optionalMessageHash && typeof(index.offsetByHash[optionalMessageHash]) === 'undefined') {
                    index.offsetByHash[optionalMessageHash] = index.size;
                    index.offsets++;
                }
                if (index.offsets >= 100 && !index.cpIndex.length) {
                    let offsetCount = checkOffsetMap(index.offsetByHash);
                    if (offsetCount < 0) {
                        Log.warn('OFFSET_TRIM_OOO', {
                            channel: id,
                            map: index.OffsetByHash
                        });
                    } else if (offsetCount > 0) {
                        trimOffsetByOrder(index.offsetByHash, index.offsets);
                        index.offsets = checkOffsetMap(index.offsetByHash);
                    }
                }
                index.size += msgBin.length;

                // handle the next element in the queue
                next();
            }));
        });
    });
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
      * call back with EUNKNOWN
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
const getHistoryOffset = (Env, channelName, lastKnownHash, _cb) => {
    const cb = Util.once(Util.mkAsync(_cb));

    // lastKnownhash === -1 means we want the complete history
    if (lastKnownHash === -1) { return void cb(null, 0); }
    let offset = -1;
    nThen((waitFor) => {
        getIndex(Env, channelName, waitFor((err, index) => {
            if (err) { waitFor.abort(); return void cb(err); }

            // check if the "hash" the client is requesting exists in the index
            const lkh = index.offsetByHash[lastKnownHash];

            // fall through to the next block if the offset of the hash in question is not in memory
            if (lastKnownHash && typeof(lkh) !== "number") { return; }

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
    }).nThen((w) => {
        // skip past this block if the offset is anything other than -1
        // this basically makes these first two nThen blocks behave like if-else
        if (offset !== -1) { return; }

        // either the message exists in history but is not in the cached index
        // or it does not exist at all. In either case 'getHashOffset' is expected
        // to return a number: -1 if not present, positive interger otherwise
        Env.getHashOffset(channelName, lastKnownHash, w(function (err, _offset) {
            if (err) {
                w.abort();
                return void cb(err);
            }
            offset = _offset;
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
const getHistoryAsync = (Env, channelName, lastKnownHash, beforeHash, handler, cb) => {
    const store = Env.store;

    let offset = -1;
    nThen((waitFor) => {
        getHistoryOffset(Env, channelName, lastKnownHash, waitFor((err, os) => {
            if (err) {
                waitFor.abort();
                return void cb(err);
            }
            offset = os;
        }));
    }).nThen((waitFor) => {
        if (offset === -1) {
            return void cb(new Error('EUNKNOWN'));
        }
        const start = (beforeHash) ? 0 : offset;
        store.readMessagesBin(channelName, start, (msgObj, readMore, abort) => {
            if (beforeHash && msgObj.offset >= offset) { return void abort(); }
            var parsed = tryParse(Env, msgObj.buff.toString('utf8'));
            if (!parsed) { return void readMore(); }
            handler(parsed, readMore);
        }, waitFor(function (err) {
            return void cb(err);
        }));
    });
};

const handleRPC = function (Env, Server, seq, userId, parsed) {
    const HISTORY_KEEPER_ID = Env.id;

    /* RPC Calls...  */
    var rpc_call = parsed.slice(1);

    Server.send(userId, [seq, 'ACK']);
    try {
        // slice off the sequence number and pass in the rest of the message
        Env.rpc(Server, userId, rpc_call, function (err, output) {
            if (err) {
                Server.send(userId, [0, HISTORY_KEEPER_ID, 'MSG', userId, JSON.stringify([parsed[0], 'ERROR', err])]); 
                return;
            }
            Server.send(userId, [0, HISTORY_KEEPER_ID, 'MSG', userId, JSON.stringify([parsed[0]].concat(output))]);
        });
    } catch (e) {
        // if anything throws in the middle, send an error
        Server.send(userId, [0, HISTORY_KEEPER_ID, 'MSG', userId, JSON.stringify([parsed[0], 'ERROR', 'SERVER_ERROR'])]);
    }
};

/*
    This is called when a user tries to connect to a channel that doesn't exist.
    we initialize that channel by writing the metadata supplied by the user to its log.
    if the provided metadata has an expire time then we also create a task to expire it.
*/
const handleFirstMessage = function (Env, channelName, metadata) {
    Env.store.writeMetadata(channelName, JSON.stringify(metadata), function (err) {
        if (err) {
            // FIXME tell the user that there was a channel error?
            return void Env.Log.error('HK_WRITE_METADATA', {
                channel: channelName,
                error: err,
            });
        }
    });

    // write tasks
    if(metadata.expire && typeof(metadata.expire) === 'number') {
        // the fun part...
        // the user has said they want this pad to expire at some point
        Env.writeTask(metadata.expire, "EXPIRE", [ channelName ], function (err) {
            if (err) {
                // if there is an error, we don't want to crash the whole server...
                // just log it, and if there's a problem you'll be able to fix it
                // at a later date with the provided information
                Env.Log.error('HK_CREATE_EXPIRE_TASK', err);
                Env.Log.info('HK_INVALID_EXPIRE_TASK', JSON.stringify([metadata.expire, 'EXPIRE', channelName]));
            }
        });
    }
};

const handleGetHistory = function (Env, Server, seq, userId, parsed) {
    const metadata_cache = Env.metadata_cache;
    const HISTORY_KEEPER_ID = Env.id;
    const Log = Env.Log;

    // parsed[1] is the channel id
    // parsed[2] is a validation key or an object containing metadata (optionnal)
    // parsed[3] is the last known hash (optionnal)

    Server.send(userId, [seq, 'ACK']);
    var channelName = parsed[1];
    var config = parsed[2];
    var metadata = {};
    var lastKnownHash;
    var txid;

    // clients can optionally pass a map of attributes
    // if the channel already exists this map will be ignored
    // otherwise it will be stored as the initial metadata state for the channel
    if (config && typeof config === "object" && !Array.isArray(parsed[2])) {
        lastKnownHash = config.lastKnownHash;
        metadata = config.metadata || {};
        txid = config.txid;
        if (metadata.expire) {
            metadata.expire = +metadata.expire * 1000 + (+new Date());
        }
    }
    metadata.channel = channelName;
    metadata.created = +new Date();

    // if the user sends us an invalid key, we won't be able to validate their messages
    // so they'll never get written to the log anyway. Let's just drop their message
    // on the floor instead of doing a bunch of extra work
    // TODO send them an error message so they know something is wrong
    if (metadata.validateKey && !isValidValidateKeyString(metadata.validateKey)) {
        return void Log.error('HK_INVALID_KEY', metadata.validateKey);
    }

    nThen(function (waitFor) {
        var w = waitFor();
        /*  fetch the channel's metadata.
            use it to check if the channel has expired.
            send it to the client if it exists.
        */
        getMetadata(Env, channelName, waitFor(function (err, metadata) {
            if (err) {
                Env.Log.error('HK_GET_HISTORY_METADATA', {
                    channel: channelName,
                    error: err,
                });
                return void w();
            }
            if (!metadata || !metadata.channel) { return w(); }
            // if there is already a metadata log then use it instead
            // of whatever the user supplied

            // it's possible that the channel doesn't have metadata
            // but in that case there's no point in checking if the channel expired
            // or in trying to send metadata, so just skip this block
            if (!metadata) { return void w(); }

            // And then check if the channel is expired. If it is, send the error and abort
            // FIXME this is hard to read because 'checkExpired' has side effects
            if (checkExpired(Env, Server, channelName)) { return void waitFor.abort(); }

            // always send metadata with GET_HISTORY requests
            Server.send(userId, [0, HISTORY_KEEPER_ID, 'MSG', userId, JSON.stringify(metadata)], w);
        }));
    }).nThen(() => {
        let msgCount = 0;

        // TODO compute lastKnownHash in a manner such that it will always skip past the metadata line?
        getHistoryAsync(Env, channelName, lastKnownHash, false, (msg, readMore) => {
            msgCount++;
            // avoid sending the metadata message a second time
            if (isMetadataMessage(msg) && metadata_cache[channelName]) { return readMore(); }
            if (txid) { msg[0] = txid; }
            Server.send(userId, [0, HISTORY_KEEPER_ID, 'MSG', userId, JSON.stringify(msg)], readMore);
        }, (err) => {
            if (err && err.code !== 'ENOENT') {
                if (err.message !== 'EINVAL') { Log.error("HK_GET_HISTORY", {
                    channel: channelName,
                    err: err && err.message || err,
                    stack: err && err.stack,
                }); }
                const parsedMsg = {error:err.message, channel: channelName, txid: txid};
                Server.send(userId, [0, HISTORY_KEEPER_ID, 'MSG', userId, JSON.stringify(parsedMsg)]);
                return;
            }

            if (msgCount === 0 && !metadata_cache[channelName] && Server.channelContainsUser(channelName, userId)) {
                handleFirstMessage(Env, channelName, metadata);
                Server.send(userId, [0, HISTORY_KEEPER_ID, 'MSG', userId, JSON.stringify(metadata)]);
            }

            // End of history message:
            let parsedMsg = {state: 1, channel: channelName, txid: txid};

            Server.send(userId, [0, HISTORY_KEEPER_ID, 'MSG', userId, JSON.stringify(parsedMsg)]);
        });
    });
};

const handleGetHistoryRange = function (Env, Server, seq, userId, parsed) {
    var channelName = parsed[1];
    var map = parsed[2];
    const HISTORY_KEEPER_ID = Env.id;

    if (!(map && typeof(map) === 'object')) {
        return void Server.send(userId, [seq, 'ERROR', 'INVALID_ARGS', HISTORY_KEEPER_ID]);
    }

    var oldestKnownHash = map.from;
    var untilHash = map.to;
    var desiredMessages = map.count;
    var desiredCheckpoint = map.cpCount;
    var txid = map.txid;
    if (typeof(desiredMessages) !== 'number' && typeof(desiredCheckpoint) !== 'number' && !untilHash) {
        return void Server.send(userId, [seq, 'ERROR', 'UNSPECIFIED_COUNT', HISTORY_KEEPER_ID]);
    }

    if (!txid) {
        return void Server.send(userId, [seq, 'ERROR', 'NO_TXID', HISTORY_KEEPER_ID]);
    }

    Server.send(userId, [seq, 'ACK']);
    Env.getOlderHistory(channelName, oldestKnownHash, untilHash, desiredMessages, desiredCheckpoint, function (err, toSend) {
        if (err && err.code !== 'ENOENT') {
            Env.Log.error("HK_GET_OLDER_HISTORY", err);
        }

        if (Array.isArray(toSend)) {
            toSend.forEach(function (msg) {
                Server.send(userId, [0, HISTORY_KEEPER_ID, 'MSG', userId,
                    JSON.stringify(['HISTORY_RANGE', txid, msg])]);
            });
        }

        Server.send(userId, [0, HISTORY_KEEPER_ID, 'MSG', userId,
            JSON.stringify(['HISTORY_RANGE_END', txid, channelName])
        ]);
    });
};

const handleGetFullHistory = function (Env, Server, seq, userId, parsed) {
    const HISTORY_KEEPER_ID = Env.id;
    const Log = Env.Log;

    // parsed[1] is the channel id
    // parsed[2] is a validation key (optionnal)
    // parsed[3] is the last known hash (optionnal)

    Server.send(userId, [seq, 'ACK']);

    // FIXME should we send metadata here too?
    // none of the clientside code which uses this API needs metadata, but it won't hurt to send it (2019-08-22)
    return void getHistoryAsync(Env, parsed[1], -1, false, (msg, readMore) => {
        Server.send(userId, [0, HISTORY_KEEPER_ID, 'MSG', userId, JSON.stringify(['FULL_HISTORY', msg])], readMore);
    }, (err) => {
        let parsedMsg = ['FULL_HISTORY_END', parsed[1]];
        if (err) {
            Log.error('HK_GET_FULL_HISTORY', err.stack);
            parsedMsg = ['ERROR', parsed[1], err.message];
        }
        Server.send(userId, [0, HISTORY_KEEPER_ID, 'MSG', userId, JSON.stringify(parsedMsg)]);
    });
};

const directMessageCommands = {
    GET_HISTORY: handleGetHistory,
    GET_HISTORY_RANGE: handleGetHistoryRange,
    GET_FULL_HISTORY: handleGetFullHistory,
};

/*  onDirectMessage
    * exported for use by the netflux-server
    * parses and handles all direct messages directed to the history keeper
      * check if it's expired and execute all the associated side-effects
      * routes queries to the appropriate handlers
*/
HK.onDirectMessage = function (Env, Server, seq, userId, json) {
    const Log = Env.Log;
    const HISTORY_KEEPER_ID = Env.id;
    Log.silly('HK_MESSAGE', json);

    let parsed;
    try {
        parsed = JSON.parse(json[2]);
    } catch (err) {
        Log.error("HK_PARSE_CLIENT_MESSAGE", json);
        return;
    }

    var first = parsed[0];

    if (typeof(directMessageCommands[first]) !== 'function') {
        // it's either an unsupported command or an RPC call
        // either way, RPC has it covered
        return void handleRPC(Env, Server, seq, userId, parsed);
    }

    // otherwise it's some kind of history retrieval command...
    // go grab its metadata, because unfortunately people can ask for history
    // whether or not they have joined the channel, so we can't rely on JOIN restriction
    // to stop people from loading history they shouldn't see.
    var channelName = parsed[1];
    nThen(function (w) {
        getMetadata(Env, channelName, w(function (err, metadata) {
            if (err) {
                // stream errors?
                // we should log these, but if we can't load metadata
                // then it's probably not restricted or expired
                // it's not like anything else will recover from this anyway
                return;
            }


            // likewise, we can't do anything more here if there's no metadata
            // jump to the next block
            if (!metadata) { return; }

            // If the requested history is for an expired channel, abort
            // checkExpired has side effects and will disconnect users for you...
            if (checkExpired(Env, Server, parsed[1])) {
                // if the channel is expired just abort.
                w.abort();
                return;
            }

            // jump to handling the command if there's no restriction...
            if (!metadata.restricted) { return; }

            // check if the user is in the allow list...
            const allowed = HK.listAllowedUsers(metadata);
            const session = HK.getNetfluxSession(Env, userId);

            if (HK.isUserSessionAllowed(allowed, session)) {
                return;
            }

/*  Anyone in the userlist that isn't in the allow list should have already
    been kicked out of the channel. Likewise, disallowed users should not
    be able to add themselves to the userlist because JOIN commands respect
    access control settings. The error that is sent below protects against
    the remaining case, in which users try to get history without having
    joined the channel. Normally we'd send the allow list to tell them the
    key with which they should authenticate, but since we don't use this
    behaviour, I'm doing the easy thing and just telling them to GO AWAY.

    We can implement the more advanced behaviour later if it turns out that
    we need it. This command validates guards against all kinds of history
    access: GET_HISTORY, GET_HISTORY_RANGE, GET_FULL_HISTORY.
*/

            w.abort();
            return void Server.send(userId, [
                seq,
                'ERROR',
                'ERESTRICTED',
                HISTORY_KEEPER_ID
            ]);
        }));
    }).nThen(function () {
        // run the appropriate command from the map
        directMessageCommands[first](Env, Server, seq, userId, parsed);
    });
};

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
HK.onChannelMessage = function (Env, Server, channel, msgStruct) {
    //console.log(+new Date(), "onChannelMessage");
    const Log = Env.Log;

    // TODO our usage of 'channel' here looks prone to errors
    // we only use it for its 'id', but it can contain other stuff
    // also, we're using this RPC from both the RPC and Netflux-server
    // we should probably just change this to expect a channel id directly

    // don't store messages if the channel id indicates that it's an ephemeral message
    if (!channel.id || channel.id.length === EPHEMERAL_CHANNEL_LENGTH) { return; }

    const isCp = /^cp\|/.test(msgStruct[4]);
    let id;
    if (isCp) {
        // id becomes either null or an array or results...
        id = CHECKPOINT_PATTERN.exec(msgStruct[4]);
        // FIXME relying on this data to be stored on an in-memory structure
        // managed by a dependency is fragile. We should put this somewhere
        // more straightforward and reliable.
        if (Array.isArray(id) && id[2] && id[2] === channel.lastSavedCp) {
            // Reject duplicate checkpoints
            return;
        }
    }

    let metadata;
    nThen(function (w) {
        getMetadata(Env, channel.id, w(function (err, _metadata) {
            // if there's no channel metadata then it can't be an expiring channel
            // nor can we possibly validate it
            if (!_metadata) { return; }
            metadata = _metadata;

            // don't write messages to expired channels
            if (checkExpired(Env, Server, channel)) { return void w.abort(); }
        }));
    }).nThen(function (w) {
        // if there's no validateKey present skip to the next block
        if (!(metadata && metadata.validateKey)) { return; }

        // trim the checkpoint indicator off the message if it's present
        let signedMsg = (isCp) ? msgStruct[4].replace(CHECKPOINT_PATTERN, '') : msgStruct[4];

        // Listen for messages
        /*  queueing this helps avoid race conditions in which workers
            validate and write messages in a different order than they were received.
            For best effect the validate and store should actually be queued atomically,
            but this is a step in the right direction.
        */
        var proceed = w();
        Env.queueValidation(channel.id, function (next) {
            Env.validateMessage(signedMsg, metadata.validateKey, function (err) {
                // always go on to the next item in the queue regardless of the outcome
                next();

                // no errors means success
                if (!err) { return proceed(); }
                // validation can fail in multiple ways
                if (err === 'FAILED') {
                    // we log this case, but not others for some reason
                    Log.info("HK_SIGNED_MESSAGE_REJECTED", 'Channel '+channel.id);
                }
                // always abort if there was an error...
                return void w.abort();
            });
        });
    }).nThen(function () {
        // do checkpoint stuff...

        // 1. get the checkpoint id
        // 2. reject duplicate checkpoints

        if (isCp) {
            // if the message is a checkpoint we will have already validated
            // that it isn't a duplicate. remember its id so that we can
            // repeat this process for the next incoming checkpoint

            // WARNING: the fact that we only check the most recent checkpoints
            // is a potential source of bugs if one editor has high latency and
            // pushes a duplicate of an earlier checkpoint than the latest which
            // has been pushed by editors with low latency
            // FIXME
            if (Array.isArray(id) && id[2]) {
                // Store new checkpoint hash
                // there's a FIXME above which concerns a reference to `lastSavedCp`
                // this is a hacky place to store important data.
                channel.lastSavedCp = id[2];
            }
        }

        // add the time to the message
        msgStruct.push(now());

        // storeMessage
        //console.log(+new Date(), "Storing message");
        storeMessage(Env, channel, JSON.stringify(msgStruct), isCp, getHash(msgStruct[4], Log));
        //console.log(+new Date(), "Message stored");
    });
};


