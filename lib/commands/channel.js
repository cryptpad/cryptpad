/*jshint esversion: 6 */
const Channel = module.exports;

const Util = require("../common-util");
const nThen = require("nthen");
const Core = require("./core");
const Metadata = require("./metadata");

Channel.clearOwnedChannel = function (Env, channelId, unsafeKey, cb) {
    if (typeof(channelId) !== 'string' || channelId.length !== 32) {
        return cb('INVALID_ARGUMENTS');
    }

    Metadata.getMetadata(Env, channelId, function (err, metadata) {
        if (err) { return void cb(err); }
        if (!Core.hasOwners(metadata)) { return void cb('E_NO_OWNERS'); }
        // Confirm that the channel is owned by the user in question
        if (!Core.isOwner(metadata, unsafeKey)) {
            return void cb('INSUFFICIENT_PERMISSIONS');
        }
        return void Env.msgStore.clearChannel(channelId, function (e) {
            cb(e);
        });
    });
};

Channel.removeOwnedChannel = function (Env, channelId, unsafeKey, cb) {
    if (typeof(channelId) !== 'string' || !Core.isValidId(channelId)) {
        return cb('INVALID_ARGUMENTS');
    }

    if (Env.blobStore.isFileId(channelId)) {
        var safeKey = Util.escapeKeyCharacters(unsafeKey);
        var blobId = channelId;

        return void nThen(function (w) {
            // check if you have permissions
            Env.blobStore.isOwnedBy(safeKey, blobId, w(function (err, owned) {
                if (err || !owned) {
                    w.abort();
                    return void cb("INSUFFICIENT_PERMISSIONS");
                }
            }));
        }).nThen(function (w) {
            // remove the blob
            return void Env.blobStore.archive.blob(blobId, w(function (err) {
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
            return void Env.blobStore.archive.proof(safeKey, blobId, function (err) {
                Env.Log.info("ARCHIVAL_PROOF_REMOVAL_BY_OWNER_RPC", {
                    safeKey: safeKey,
                    blobId: blobId,
                    status: err? String(err): 'SUCCESS',
                });
                if (err) {
                    return void cb("E_PROOF_REMOVAL");
                }
                cb();
            });
        });
    }

    Metadata.getMetadata(Env, channelId, function (err, metadata) {
        if (err) { return void cb(err); }
        if (!Core.hasOwners(metadata)) { return void cb('E_NO_OWNERS'); }
        if (!Core.isOwner(metadata, unsafeKey)) {
            return void cb('INSUFFICIENT_PERMISSIONS');
        }
        // temporarily archive the file
        return void Env.msgStore.archiveChannel(channelId, function (e) {
            Env.Log.info('ARCHIVAL_CHANNEL_BY_OWNER_RPC', {
                unsafeKey: unsafeKey,
                channelId: channelId,
                status: e? String(e): 'SUCCESS',
            });
            cb(e);
        });
    });
};

Channel.removeOwnedChannelHistory = function (Env, channelId, unsafeKey, hash, cb) {
    nThen(function (w) {
        Metadata.getMetadata(Env, channelId, w(function (err, metadata) {
            if (err) { return void cb(err); }
            if (!Core.hasOwners(metadata)) {
                w.abort();
                return void cb('E_NO_OWNERS');
            }
            if (!Core.isOwner(metadata, unsafeKey)) {
                w.abort();
                return void cb("INSUFFICIENT_PERMISSIONS");
            }
            // else fall through to the next block
        }));
    }).nThen(function () {
        Env.msgStore.trimChannel(channelId, hash, function (err) {
            if (err) { return void cb(err); }


            // XXX you must also clear the channel's index from historyKeeper cache
        });
    });
};

var ARRAY_LINE = /^\[/;

/*  Files can contain metadata but not content
    call back with true if the channel log has no content other than metadata
    otherwise false
*/
Channel.isNewChannel = function (Env, channel, cb) {
    if (!Core.isValidId(channel)) { return void cb('INVALID_CHAN'); }
    if (channel.length !== 32) { return void cb('INVALID_CHAN'); }

    var done = false;
    Env.msgStore.getMessages(channel, function (msg) {
        if (done) { return; }
        try {
            if (typeof(msg) === 'string' && ARRAY_LINE.test(msg)) {
                done = true;
                return void cb(void 0, false);
            }
        } catch (e) {
            Env.WARN('invalid message read from store', e);
        }
    }, function () {
        if (done) { return; }
        // no more messages...
        cb(void 0, true);
    });
};

/*  writePrivateMessage
    allows users to anonymously send a message to the channel
    prevents their netflux-id from being stored in history
    and from being broadcast to anyone that might currently be in the channel

    Otherwise behaves the same as sending to a channel
*/
Channel.writePrivateMessage = function (Env, args, nfwssCtx, cb) {
    var channelId = args[0];
    var msg = args[1];

    // don't bother handling empty messages
    if (!msg) { return void cb("INVALID_MESSAGE"); }

    // don't support anything except regular channels
    if (!Core.isValidId(channelId) || channelId.length !== 32) {
        return void cb("INVALID_CHAN");
    }

    // We expect a modern netflux-websocket-server instance
    // if this API isn't here everything will fall apart anyway
    if (!(nfwssCtx && nfwssCtx.historyKeeper && typeof(nfwssCtx.historyKeeper.onChannelMessage) === 'function')) {
        return void cb("NOT_IMPLEMENTED");
    }

    // historyKeeper expects something with an 'id' attribute
    // it will fail unless you provide it, but it doesn't need anything else
    var channelStruct = {
        id: channelId,
    };

    // construct a message to store and broadcast
    var fullMessage = [
        0, // idk
        null, // normally the netflux id, null isn't rejected, and it distinguishes messages written in this way
        "MSG", // indicate that this is a MSG
        channelId, // channel id
        msg // the actual message content. Generally a string
    ];

    // store the message and do everything else that is typically done when going through historyKeeper
    nfwssCtx.historyKeeper.onChannelMessage(nfwssCtx, channelStruct, fullMessage);

    // call back with the message and the target channel.
    // historyKeeper will take care of broadcasting it if anyone is in the channel
    cb(void 0, {
        channel: channelId,
        message: fullMessage
    });
};

