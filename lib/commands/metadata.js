/*jshint esversion: 6 */
const Data = module.exports;

const Meta = require("../metadata");
const BatchRead = require("../batch-read");
const WriteQueue = require("../write-queue");
const Core = require("./core");
const Util = require("../common-util");

const batchMetadata = BatchRead("GET_METADATA");
Data.getMetadata = function (Env, channel, cb/* , Server */) {
    if (!Core.isValidId(channel)) { return void cb('INVALID_CHAN'); }
    if (channel.length !== 32) { return cb("INVALID_CHAN_LENGTH"); }

    // XXX get metadata from the server cache if it is available
    // Server isn't always passed, though...
    batchMetadata(channel, cb, function (done) {
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

/* setMetadata
    - write a new line to the metadata log if a valid command is provided
    - data is an object: {
        channel: channelId,
        command: metadataCommand (string),
        value: value
    }
*/
var queueMetadata = WriteQueue();
Data.setMetadata = function (Env, safeKey, data, cb) {
    var unsafeKey = Util.unescapeKeyCharacters(safeKey);

    var channel = data.channel;
    var command = data.command;
    if (!channel || !Core.isValidId(channel)) { return void cb ('INVALID_CHAN'); }
    if (!command || typeof (command) !== 'string') { return void cb ('INVALID_COMMAND'); }
    if (Meta.commands.indexOf(command) === -1) { return void('UNSUPPORTED_COMMAND'); }

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
                cb(void 0, metadata);
                next();
            });
        });
    });
};


