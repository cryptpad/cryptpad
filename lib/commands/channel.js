/*jshint esversion: 6 */
const Channel = module.exports;

const Util = require("../common-util");
const nThen = require("nthen");
const Core = require("./core");
const Metadata = require("./metadata");
const HK = require("../hk-util");

Channel.clearOwnedChannel = function (Env, safeKey, channelId, cb, Server) {
    if (typeof(channelId) !== 'string' || channelId.length !== 32) {
        return cb('INVALID_ARGUMENTS');
    }
    var unsafeKey = Util.unescapeKeyCharacters(safeKey);

    Metadata.getMetadata(Env, channelId, function (err, metadata) {
        if (err) { return void cb(err); }
        if (!Core.hasOwners(metadata)) { return void cb('E_NO_OWNERS'); }
        // Confirm that the channel is owned by the user in question
        if (!Core.isOwner(metadata, unsafeKey)) {
            return void cb('INSUFFICIENT_PERMISSIONS');
        }
        return void Env.msgStore.clearChannel(channelId, function (e) {
            if (e) { return void cb(e); }
            cb();

            const channel_cache = Env.channel_cache;

            const clear = function () {
                // delete the channel cache because it will have been invalidated
                delete channel_cache[channelId];
            };

            nThen(function (w) {
                Server.getChannelUserList(channelId).forEach(function (userId) {
                    Server.send(userId, [
                        0,
                        Env.historyKeeper.id,
                        'MSG',
                        userId,
                        JSON.stringify({
                            error: 'ECLEARED',
                            channel: channelId
                        })
                    ], w());
                });
            }).nThen(function () {
                clear();
            }).orTimeout(function () {
                Env.Log.warn("ON_CHANNEL_CLEARED_TIMEOUT", channelId);
                clear();
            }, 30000);
        });
    });
};

var archiveOwnedChannel = function (Env, safeKey, channelId, _cb, Server) {
    var unsafeKey = Util.unescapeKeyCharacters(safeKey);
    nThen(function (w) {
        // confirm that the channel exists before worrying about whether
        // we have permission to delete it.
        var cb = _cb;
        Env.msgStore.getChannelSize(channelId, w(function (err, bytes) {
            if (!bytes) {
                w.abort();
                return cb(err || "ENOENT");
            }
        }));
    }).nThen(function (w) {
        var cb = Util.both(w.abort, _cb);
        Metadata.getMetadata(Env, channelId, function (err, metadata) {
            if (err) { return void cb(err); }
            if (!Core.hasOwners(metadata)) { return void cb('E_NO_OWNERS'); }
            if (!Core.isOwner(metadata, unsafeKey)) {
                return void cb('INSUFFICIENT_PERMISSIONS');
            }
        });
    }).nThen(function () {
        var cb = _cb;
        // temporarily archive the file
        return void Env.msgStore.archiveChannel(channelId, function (e) {
            Env.Log.info('ARCHIVAL_CHANNEL_BY_OWNER_RPC', {
                unsafeKey: unsafeKey,
                channelId: channelId,
                status: e? String(e): 'SUCCESS',
            });
            if (e) {
                return void cb(e);
            }
            cb(void 0, 'OK');

            const channel_cache = Env.channel_cache;
            const metadata_cache = Env.metadata_cache;

            const clear = function () {
                delete channel_cache[channelId];
                Server.clearChannel(channelId);
                delete metadata_cache[channelId];
            };

            // an owner of a channel deleted it
            nThen(function (w) {
                // close the channel in the store
                Env.msgStore.closeChannel(channelId, w());
            }).nThen(function (w) {
                // Server.channelBroadcast would be better
                // but we can't trust it to track even one callback,
                // let alone many in parallel.
                // so we simulate it on this side to avoid race conditions
                Server.getChannelUserList(channelId).forEach(function (userId) {
                    Server.send(userId, [
                        0,
                        Env.historyKeeper.id,
                        "MSG",
                        userId,
                        JSON.stringify({
                            error: 'EDELETED',
                            channel: channelId,
                        })
                    ], w());
                });
            }).nThen(function () {
                // clear the channel's data from memory
                // once you've sent everyone a notice that the channel has been deleted
                clear();
            }).orTimeout(function () {
                Env.Log.warn('ON_CHANNEL_DELETED_TIMEOUT', channelId);
                clear();
            }, 30000);
        });
    });
};

Channel.removeOwnedChannel = function (Env, safeKey, channelId, __cb, Server) {
    var _cb = Util.once(Util.mkAsync(__cb));

    if (typeof(channelId) !== 'string' || !Core.isValidId(channelId)) {
        return _cb('INVALID_ARGUMENTS');
    }

    // archiving large channels or files can be expensive, so do it one at a time
    // for any given user to ensure that nobody can use too much of the server's resources
    Env.queueDeletes(safeKey, function (next) {
        var cb = Util.both(_cb, next);
        if (Env.blobStore.isFileId(channelId)) {
            return void Env.removeOwnedBlob(channelId, safeKey, cb);
        }
        archiveOwnedChannel(Env, safeKey, channelId, cb, Server);
    });
};

Channel.trimHistory = function (Env, safeKey, data, cb) {
    if (!(data && typeof(data.channel) === 'string' && typeof(data.hash) === 'string' && data.hash.length === 64)) {
        return void cb('INVALID_ARGS');
    }

    var channelId = data.channel;
    var unsafeKey = Util.unescapeKeyCharacters(safeKey);
    var hash = data.hash;

    nThen(function (w) {
        Metadata.getMetadataRaw(Env, channelId, w(function (err, metadata) {
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
            // clear historyKeeper's cache for this channel
            Env.historyKeeper.channelClose(channelId);
            cb(void 0, 'OK');
            delete Env.channel_cache[channelId];
            delete Env.metadata_cache[channelId];
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

    // TODO replace with readMessagesBin
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
Channel.writePrivateMessage = function (Env, args, _cb, Server, netfluxId) {
    var cb = Util.once(Util.mkAsync(_cb));

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
    if (!(Server && typeof(Server.send) === 'function')) {
        return void cb("NOT_IMPLEMENTED");
    }

    nThen(function (w) {
        Metadata.getMetadataRaw(Env, channelId, w(function (err, metadata) {
            if (err) {
                w.abort();
                Env.Log.error('HK_WRITE_PRIVATE_MESSAGE', err);
                return void cb('METADATA_ERR');
            }

            if (!metadata || !metadata.restricted) {
                return;
            }

            var session = HK.getNetfluxSession(Env, netfluxId);
            var allowed = HK.listAllowedUsers(metadata);

            if (HK.isUserSessionAllowed(allowed, session)) { return; }

            w.abort();
            cb('INSUFFICIENT_PERMISSIONS');
        }));
    }).nThen(function () {
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


        // historyKeeper already knows how to handle metadata and message validation, so we just pass it off here
        // if the message isn't valid it won't be stored.
        Env.historyKeeper.channelMessage(Server, channelStruct, fullMessage);

        Server.getChannelUserList(channelId).forEach(function (userId) {
            Server.send(userId, fullMessage);
        });

        cb();
    });
};

