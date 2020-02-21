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
        var ref = {};
        var lineHandler = Meta.createLineHandler(ref, Env.Log.error);
        return void Env.msgStore.readChannelMetadata(channel, lineHandler, function (err) {
            if (err) {
                // stream errors?
                return void done(err);
            }
            done(void 0, ref.meta);
        });
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
        Data.getMetadata(Env, channel, function (err, metadata) {
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


            // chainpad-server@4.0.3 supports a removeFromChannel method
            // Server.removeFromChannel(channelName, userId);
            // this lets us kick users from restricted channels

            // XXX RESTRICT
            // if the metadata changes and includes an allowed list
            // kick any current users from the channel
            // if they aren't on it.

            // review Server.channelBroadcast as used for EEXPIRED
            // send them to the user in question, from historyKeeper

                cb(void 0, metadata);
                next();

                const metadata_cache = Env.metadata_cache;
                const channel_cache = Env.channel_cache;

                metadata_cache[channel] = metadata;

                var index = Util.find(channel_cache, [channel, 'index']);
                if (index && typeof(index) === 'object') { index.metadata = metadata; }

                Server.channelBroadcast(channel, JSON.stringify(metadata), Env.historyKeeper.id);
            });
        });
    });
};


