/*jshint esversion: 6 */
const Data = module.exports;

const Meta = require("../metadata");
const WriteQueue = require("../write-queue");
const Core = require("./core");
const Util = require("../common-util");
const HK = require("../hk-util");

Data.getMetadataRaw = function (Env, channel /* channelName */, _cb) {
    const cb = Util.once(Util.mkAsync(_cb));
    if (!Core.isValidId(channel)) { return void cb('INVALID_CHAN'); }
    if (channel.length !== HK.STANDARD_CHANNEL_LENGTH) { return cb("INVALID_CHAN_LENGTH"); }

    var cached = Env.metadata_cache[channel];
    if (HK.isMetadataMessage(cached)) {
        return void cb(void 0, cached);
    }

    Env.batchMetadata(channel, cb, function (done) {
        Env.computeMetadata(channel, done);
    });
};

Data.getMetadata = function (Env, channel, cb, Server, netfluxId) {
    Data.getMetadataRaw(Env, channel, function (err, metadata) {
        if (err) { return void cb(err); }

        if (!(metadata && metadata.restricted)) {
            // if it's not restricted then just call back
            return void cb(void 0, metadata);
        }

        const session = HK.getNetfluxSession(Env, netfluxId);
        const allowed = HK.listAllowedUsers(metadata);

        if (!HK.isUserSessionAllowed(allowed, session)) {
            return void cb(void 0, {
                restricted: metadata.restricted,
                allowed: allowed,
                rejected: true,
            });
        }
        cb(void 0, metadata);
    });
};

/* setMetadata
    - write a new line to the metadata log if a valid command is provided
    - data is an object: {
        channel: channelId,
        command: metadataCommand (string),
        value: value
    }
*/
var queueMetadata = WriteQueue();
Data.setMetadata = function (Env, safeKey, data, cb, Server) {
    var unsafeKey = Util.unescapeKeyCharacters(safeKey);

    var channel = data.channel;
    var command = data.command;
    if (!channel || !Core.isValidId(channel)) { return void cb ('INVALID_CHAN'); }
    if (!command || typeof (command) !== 'string') { return void cb('INVALID_COMMAND'); }
    if (Meta.commands.indexOf(command) === -1) { return void cb('UNSUPPORTED_COMMAND'); }

    queueMetadata(channel, function (next) {
        Data.getMetadataRaw(Env, channel, function (err, metadata) {
            if (err) {
                cb(err);
                return void next();
            }
            if (!Core.hasOwners(metadata)) {
                cb('E_NO_OWNERS');
                return void next();
            }

            // if you are a pending owner and not an owner
                // you can either ADD_OWNERS, or RM_PENDING_OWNERS
                    // and you should only be able to add yourself as an owner
                // everything else should be rejected
            // else if you are not an owner
                // you should be rejected
            // else write the command

            // Confirm that the channel is owned by the user in question
            // or the user is accepting a pending ownership offer
            if (Core.hasPendingOwners(metadata) &&
                Core.isPendingOwner(metadata, unsafeKey) &&
                        !Core.isOwner(metadata, unsafeKey)) {

                // If you are a pending owner, make sure you can only add yourelf as an owner
                if ((command !== 'ADD_OWNERS' && command !== 'RM_PENDING_OWNERS')
                        || !Array.isArray(data.value)
                        || data.value.length !== 1
                        || data.value[0] !== unsafeKey) {
                    cb('INSUFFICIENT_PERMISSIONS');
                    return void next();
                }
                // FIXME wacky fallthrough is hard to read
                // we could pass this off to a writeMetadataCommand function
                // and make the flow easier to follow
            } else if (!Core.isOwner(metadata, unsafeKey)) {
                cb('INSUFFICIENT_PERMISSIONS');
                return void next();
            }

            // Add the new metadata line
            var line = [command, data.value, +new Date()];
            var changed = false;
            try {
                changed = Meta.handleCommand(metadata, line);
            } catch (e) {
                cb(e);
                return void next();
            }

            // if your command is valid but it didn't result in any change to the metadata,
            // call back now and don't write any "useless" line to the log
            if (!changed) {
                cb(void 0, metadata);
                return void next();
            }
            Env.msgStore.writeMetadata(channel, JSON.stringify(line), function (e) {
                if (e) {
                    cb(e);
                    return void next();
                }

                // send the message back to the person who changed it
                // since we know they're allowed to see it
                cb(void 0, metadata);
                next();

                const metadata_cache = Env.metadata_cache;

                // update the cached metadata
                metadata_cache[channel] = metadata;

                // it's easy to check if the channel is restricted
                const isRestricted = metadata.restricted;
                // and these values will be used in any case
                const s_metadata = JSON.stringify(metadata);
                const hk_id = Env.historyKeeper.id;

                if (!isRestricted) {
                    // pre-allow-list behaviour
                    // if it's not restricted, broadcast the new metadata to everyone
                    return void Server.channelBroadcast(channel, s_metadata, hk_id);
                }

                // otherwise derive the list of users (unsafeKeys) that are allowed to stay
                const allowed = HK.listAllowedUsers(metadata);
                // anyone who is not allowed will get the same error message
                const s_error = JSON.stringify({
                    error: 'ERESTRICTED',
                    channel: channel,
                });

                // iterate over the channel's userlist
                const toRemove = [];
                Server.getChannelUserList(channel).forEach(function (userId) {
                    const session = HK.getNetfluxSession(Env, userId);

                    // if the user is allowed to remain, send them the metadata
                    if (HK.isUserSessionAllowed(allowed, session)) {
                        return void Server.send(userId, [
                            0,
                            hk_id,
                            'MSG',
                            userId,
                            s_metadata
                        ], function () {});
                    }
                    // otherwise they are not in the list.
                    // send them an error and kick them out!
                    Server.send(userId, [
                        0,
                        hk_id,
                        'MSG',
                        userId,
                        s_error
                    ], function () {});
                });

                Server.removeFromChannel(channel, toRemove);
            });
        });
    });
};
