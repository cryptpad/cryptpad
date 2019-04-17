/* jshint esversion: 6 */
/* global Buffer, process */
;(function () { 'use strict';

const nThen = require('nthen');
const Nacl = require('tweetnacl');
const Crypto = require('crypto');

let Log;
const now = function () { return (new Date()).getTime(); };

const getHash = function (msg) {
    if (typeof(msg) !== 'string') {
        Log.warn('', 'getHash() called on ' + typeof(msg) + ': ' + msg);
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

module.exports.create = function (cfg) {
    const rpc = cfg.rpc;
    const tasks = cfg.tasks;
    const store = cfg.store;
    Log = cfg.log;

    Log.silly('LOADING HISTORY_KEEPER MODULE');

    const historyKeeperKeys = {};
    const HISTORY_KEEPER_ID = Crypto.randomBytes(8).toString('hex');

    Log.verbose('History keeper ID: ' + HISTORY_KEEPER_ID);

    let sendMsg = function () {};
    let STANDARD_CHANNEL_LENGTH, EPHEMERAL_CHANNEL_LENGTH;
    const setConfig = function (config) {
        STANDARD_CHANNEL_LENGTH = config.STANDARD_CHANNEL_LENGTH;
        EPHEMERAL_CHANNEL_LENGTH = config.EPHEMERAL_CHANNEl_LENGTH;
        sendMsg = config.sendMsg;
    };

    const computeIndex = function (channelName, cb) {
        const cpIndex = [];
        let messageBuf = [];
        let validateKey;
        let metadata;
        let i = 0;
        store.readMessagesBin(channelName, 0, (msgObj, rmcb) => {
            let msg;
            i++;
            if (!validateKey && msgObj.buff.indexOf('validateKey') > -1) {
                metadata = msg = tryParse(msgObj.buff.toString('utf8'));
                if (typeof msg === "undefined") { return rmcb(); }
                if (msg.validateKey) {
                    validateKey = historyKeeperKeys[channelName] = msg;
                    return rmcb();
                }
            }
            if (msgObj.buff.indexOf('cp|') > -1) {
                msg = msg || tryParse(msgObj.buff.toString('utf8'));
                if (typeof msg === "undefined") { return rmcb(); }
                if (msg[2] === 'MSG' && msg[4].indexOf('cp|') === 0) {
                    cpIndex.push({
                        offset: msgObj.offset,
                        line: i
                    });
                    messageBuf = [];
                }
            }
            messageBuf.push(msgObj);
            return rmcb();
        }, (err) => {
            if (err && err.code !== 'ENOENT') { return void cb(err); }
            const offsetByHash = {};
            let size = 0;
            messageBuf.forEach((msgObj) => {
                const msg = tryParse(msgObj.buff.toString('utf8'));
                if (typeof msg === "undefined") { return; }
                if (msg[0] === 0 && msg[2] === 'MSG' && typeof(msg[4]) === 'string') {
                    offsetByHash[getHash(msg[4])] = msgObj.offset;
                }
                // There is a trailing \n at the end of the file
                size = msgObj.offset + msgObj.buff.length + 1;
            });
            cb(null, {
                // Only keep the checkpoints included in the last 100 messages
                cpIndex: sliceCpIndex(cpIndex, i),
                offsetByHash: offsetByHash,
                size: size,
                metadata: metadata,
                line: i
            });
        });
    };

    const getIndex = (ctx, channelName, cb) => {
        const chan = ctx.channels[channelName];
        if (chan && chan.index) { return void cb(undefined, chan.index); }
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

    // Determine what we should store when a message a broadcasted to a channel
    const onChannelMessage = function (ctx, channel, msgStruct) {
        // don't store messages if the channel id indicates that it's an ephemeral message
        if (!channel.id || channel.id.length === EPHEMERAL_CHANNEL_LENGTH) { return; }

        const isCp = /^cp\|/.test(msgStruct[4]);
        if (historyKeeperKeys[channel.id] && historyKeeperKeys[channel.id].expire &&
                historyKeeperKeys[channel.id].expire < +new Date()) {
            return; // Don't store messages on expired channel
        }
        let id;
        if (isCp) {
            /*::if (typeof(msgStruct[4]) !== 'string') { throw new Error(); }*/
            id = /cp\|(([A-Za-z0-9+\/=]+)\|)?/.exec(msgStruct[4]);
            if (Array.isArray(id) && id[2] && id[2] === channel.lastSavedCp) {
                // Reject duplicate checkpoints
                return;
            }
        }
        if (historyKeeperKeys[channel.id] && historyKeeperKeys[channel.id].validateKey) {
            /*::if (typeof(msgStruct[4]) !== 'string') { throw new Error(); }*/
            let signedMsg = (isCp) ? msgStruct[4].replace(/^cp\|(([A-Za-z0-9+\/=]+)\|)?/, '') : msgStruct[4];
            signedMsg = Nacl.util.decodeBase64(signedMsg);
            const validateKey = Nacl.util.decodeBase64(historyKeeperKeys[channel.id].validateKey);
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
            if (Array.isArray(id) && id[2]) {
                // Store new checkpoint hash
                channel.lastSavedCp = id[2];
            }
        }
        msgStruct.push(now());
        storeMessage(ctx, channel, JSON.stringify(msgStruct), isCp, getHash(msgStruct[4]));
    };

    const dropChannel = function (chanName) {
        delete historyKeeperKeys[chanName];
    };

    const getHistoryOffset = (ctx, channelName, lastKnownHash, cb /*:(e:?Error, os:?number)=>void*/) => {
        // lastKnownhash === -1 means we want the complete history
        if (lastKnownHash === -1) { return void cb(null, 0); }
        let offset = -1;
        nThen((waitFor) => {
            getIndex(ctx, channelName, waitFor((err, index) => {
                if (err) { waitFor.abort(); return void cb(err); }

                // Check last known hash
                const lkh = index.offsetByHash[lastKnownHash];
                if (lastKnownHash && typeof(lkh) !== "number") {
                    waitFor.abort();
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
            if (offset !== -1) { return; }
            store.readMessagesBin(channelName, 0, (msgObj, rmcb, abort) => {
                const msg = tryParse(msgObj.buff.toString('utf8'));
                if (typeof msg === "undefined") { return rmcb(); }
                if (typeof(msg[4]) !== 'string' || lastKnownHash !== getHash(msg[4])) {
                    return void rmcb();
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
            store.readMessagesBin(channelName, start, (msgObj, rmcb, abort) => {
                if (beforeHash && msgObj.offset >= offset) { return void abort(); }
                handler(tryParse(msgObj.buff.toString('utf8')), rmcb);
            }, waitFor(function (err) {
                return void cb(err);
            }));
        });
    };

    const getOlderHistory = function (channelName, oldestKnownHash, cb) {
        var messageBuffer = [];
        var found = false;
        store.getMessages(channelName, function (msgStr) {
            if (found) { return; }

            let parsed = tryParse(msgStr);
            if (typeof parsed === "undefined") { return; }

            if (parsed.validateKey) {
                historyKeeperKeys[channelName] = parsed;
                return;
            }

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


    const historyKeeperBroadcast = function (ctx, channel, msg) {
        let chan = ctx.channels[channel] || (([] /*:any*/) /*:Chan_t*/);
        chan.forEach(function (user) {
            sendMsg(ctx, user, [0, HISTORY_KEEPER_ID, 'MSG', user.id, JSON.stringify(msg)]);
        });
    };
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
        delete historyKeeperKeys[channel];
    };
    // Check if the selected channel is expired
    // If it is, remove it from memory and broadcast a message to its members
    const checkExpired = function (ctx, channel) {
        if (channel && channel.length === STANDARD_CHANNEL_LENGTH && historyKeeperKeys[channel] &&
                historyKeeperKeys[channel].expire && historyKeeperKeys[channel].expire < +new Date()) {
            store.closeChannel(channel, function () {
                historyKeeperBroadcast(ctx, channel, {
                    error: 'EEXPIRED',
                    channel: channel
                });
            });
            delete ctx.channels[channel];
            delete historyKeeperKeys[channel];
            return true;
        }
        return;
    };

    const onDirectMessage = function (ctx, seq, user, json) {
        let parsed;
        let channelName;
        let obj = HISTORY_KEEPER_ID;

        Log.silly(json);

        try {
            parsed = JSON.parse(json[2]);
        } catch (err) {
            Log.error("HK_PARSE_CLIENT_MESSAGE", json);
            return;
        }

        // If the requested history is for an expired channel, abort
        // Note the if we don't have the keys for that channel in historyKeeperKeys, we'll
        // have to abort later (once we know the expiration time)
        if (checkExpired(ctx, parsed[1])) { return; }

        if (parsed[0] === 'GET_HISTORY') {
            // parsed[1] is the channel id
            // parsed[2] is a validation key or an object containing metadata (optionnal)
            // parsed[3] is the last known hash (optionnal)
            sendMsg(ctx, user, [seq, 'ACK']);
            channelName = parsed[1];
            var validateKey = parsed[2];
            var lastKnownHash = parsed[3];
            var owners;
            var expire;
            if (parsed[2] && typeof parsed[2] === "object") {
                validateKey = parsed[2].validateKey;
                lastKnownHash = parsed[2].lastKnownHash;
                owners = parsed[2].owners;
                if (parsed[2].expire) {
                    expire = +parsed[2].expire * 1000 + (+new Date());
                }
            }

            nThen(function (waitFor) {
                if (!tasks) { return; } // tasks are not supported
                if (typeof(expire) !== 'number' || !expire) { return; }

                // the fun part...
                // the user has said they want this pad to expire at some point
                tasks.write(expire, "EXPIRE", [ channelName ], waitFor(function (err) {
                    if (err) {
                        // if there is an error, we don't want to crash the whole server...
                        // just log it, and if there's a problem you'll be able to fix it
                        // at a later date with the provided information
                        Log.error('HK_CREATE_EXPIRE_TASK', err);
                        Log.info('HK_INVALID_EXPIRE_TASK', JSON.stringify([expire, 'EXPIRE', channelName]));
                    }
                }));
            }).nThen(function (waitFor) {
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
                    if (!index || !index.metadata) { return void w(); }
                    // Store the metadata if we don't have it in memory
                    if (!historyKeeperKeys[channelName]) {
                        historyKeeperKeys[channelName] = index.metadata;
                    }
                    // And then check if the channel is expired. If it is, send the error and abort
                    if (checkExpired(ctx, channelName)) { return void waitFor.abort(); }
                    // Send the metadata to the user
                    if (!lastKnownHash && index.cpIndex.length > 1) {
                        sendMsg(ctx, user, [0, HISTORY_KEEPER_ID, 'MSG', user.id, JSON.stringify(index.metadata)], w);
                        return;
                    }
                    w();
                }));
            }).nThen(() => {
                let msgCount = 0;
                let expired = false;
                getHistoryAsync(ctx, channelName, lastKnownHash, false, (msg, cb) => {
                    if (!msg) { return; }
                    if (msg.validateKey) {
                        // If it is a young channel, this is the part where we get the metadata
                        // Check if the channel is expired and abort if it is.
                        if (!historyKeeperKeys[channelName]) { historyKeeperKeys[channelName] = msg; }
                        expired = checkExpired(ctx, channelName);
                    }
                    if (expired) { return void cb(); }
                    msgCount++;

                    sendMsg(ctx, user, [0, HISTORY_KEEPER_ID, 'MSG', user.id, JSON.stringify(msg)], cb);
                }, (err) => {
                    // If the pad is expired, stop here, we've already sent the error message
                    if (expired) { return; }

                    if (err && err.code !== 'ENOENT') {
                        if (err.message !== 'EINVAL') { Log.error("HK_GET_HISTORY", err); }
                        const parsedMsg = {error:err.message, channel: channelName};
                        sendMsg(ctx, user, [0, HISTORY_KEEPER_ID, 'MSG', user.id, JSON.stringify(parsedMsg)]);
                        return;
                    }

                    // If this is a new channel, we need to store the metadata as
                    // the first message in the file
                    const chan = ctx.channels[channelName];
                    if (msgCount === 0 && !historyKeeperKeys[channelName] && chan && chan.indexOf(user) > -1) {
                        var key = {};
                        key.channel = channelName;
                        if (validateKey) {
                            key.validateKey = validateKey;
                        }
                        if (owners) {
                            key.owners = owners;
                        }
                        if (expire) {
                            key.expire = expire;
                        }
                        historyKeeperKeys[channelName] = key;
                        storeMessage(ctx, chan, JSON.stringify(key), false, undefined);
                        sendMsg(ctx, user, [0, HISTORY_KEEPER_ID, 'MSG', user.id, JSON.stringify(key)]);
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
            getHistoryAsync(ctx, parsed[1], -1, false, (msg, cb) => {
                if (!msg) { return; }
                sendMsg(ctx, user, [0, HISTORY_KEEPER_ID, 'MSG', user.id, JSON.stringify(['FULL_HISTORY', msg])], cb);
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
