/*jshint esversion: 6 */
/*  Use Nacl for checking signatures of messages */
var Nacl = require("tweetnacl/nacl-fast");

/* globals Buffer*/

var Fs = require("fs");

var Fse = require("fs-extra");
var Path = require("path");
const nThen = require("nthen");
const Meta = require("./metadata");
const WriteQueue = require("./write-queue");
const BatchRead = require("./batch-read");

const Util = require("./common-util");
const escapeKeyCharacters = Util.escapeKeyCharacters;
const mkEvent = Util.mkEvent;

const Core = require("./commands/core");
const Admin = require("./commands/admin-rpc");
const Pinning = require("./commands/pin-rpc");
const Quota = require("./commands/quota");

var RPC = module.exports;

var Store = require("../storage/file");
var BlobStore = require("../storage/blob");

var Log;

var WARN = function (e, output) {
    if (e && output) {
        Log.warn(e, {
            output: output,
            message: String(e),
            stack: new Error(e).stack,
        });
    }
};

const batchMetadata = BatchRead("GET_METADATA");
var getMetadata = function (Env, channel, cb) {
    if (!Core.isValidId(channel)) { return void cb('INVALID_CHAN'); }
    if (channel.length !== 32) { return cb("INVALID_CHAN_LENGTH"); }

    batchMetadata(channel, cb, function (done) {
        var ref = {};
        var lineHandler = Meta.createLineHandler(ref, Log.error);

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
var setMetadata = function (Env, data, unsafeKey, cb) {
    var channel = data.channel;
    var command = data.command;
    if (!channel || !Core.isValidId(channel)) { return void cb ('INVALID_CHAN'); }
    if (!command || typeof (command) !== 'string') { return void cb ('INVALID_COMMAND'); }
    if (Meta.commands.indexOf(command) === -1) { return void('UNSUPPORTED_COMMAND'); }

    queueMetadata(channel, function (next) {
        getMetadata(Env, channel, function (err, metadata) {
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

var clearOwnedChannel = function (Env, channelId, unsafeKey, cb) {
    if (typeof(channelId) !== 'string' || channelId.length !== 32) {
        return cb('INVALID_ARGUMENTS');
    }

    getMetadata(Env, channelId, function (err, metadata) {
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

var removeOwnedChannel = function (Env, channelId, unsafeKey, cb) {
    if (typeof(channelId) !== 'string' || !Core.isValidId(channelId)) {
        return cb('INVALID_ARGUMENTS');
    }

    if (Env.blobStore.isFileId(channelId)) {
        var safeKey = escapeKeyCharacters(unsafeKey);
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
                Log.info('ARCHIVAL_OWNED_FILE_BY_OWNER_RPC', {
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
                Log.info("ARCHIVAL_PROOF_REMOVAL_BY_OWNER_RPC", {
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

    getMetadata(Env, channelId, function (err, metadata) {
        if (err) { return void cb(err); }
        if (!Core.hasOwners(metadata)) { return void cb('E_NO_OWNERS'); }
        if (!Core.isOwner(metadata, unsafeKey)) {
            return void cb('INSUFFICIENT_PERMISSIONS');
        }
        // temporarily archive the file
        return void Env.msgStore.archiveChannel(channelId, function (e) {
            Log.info('ARCHIVAL_CHANNEL_BY_OWNER_RPC', {
                unsafeKey: unsafeKey,
                channelId: channelId,
                status: e? String(e): 'SUCCESS',
            });
            cb(e);
        });
    });
};

var removeOwnedChannelHistory = function (Env, channelId, unsafeKey, hash, cb) {
    nThen(function (w) {
        getMetadata(Env, channelId, w(function (err, metadata) {
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


/*
    We assume that the server is secured against MitM attacks
    via HTTPS, and that malicious actors do not have code execution
    capabilities. If they do, we have much more serious problems.

    The capability to replay a block write or remove results in either
    a denial of service for the user whose block was removed, or in the
    case of a write, a rollback to an earlier password.

    Since block modification is destructive, this can result in loss
    of access to the user's drive.

    So long as the detached signature is never observed by a malicious
    party, and the server discards it after proof of knowledge, replays
    are not possible. However, this precludes verification of the signature
    at a later time.

    Despite this, an integrity check is still possible by the original
    author of the block, since we assume that the block will have been
    encrypted with xsalsa20-poly1305 which is authenticated.
*/
var validateLoginBlock = function (Env, publicKey, signature, block, cb) { // FIXME BLOCKS
    // convert the public key to a Uint8Array and validate it
    if (typeof(publicKey) !== 'string') { return void cb('E_INVALID_KEY'); }

    var u8_public_key;
    try {
        u8_public_key = Nacl.util.decodeBase64(publicKey);
    } catch (e) {
        return void cb('E_INVALID_KEY');
    }

    var u8_signature;
    try {
        u8_signature = Nacl.util.decodeBase64(signature);
    } catch (e) {
        Log.error('INVALID_BLOCK_SIGNATURE', e);
        return void cb('E_INVALID_SIGNATURE');
    }

    // convert the block to a Uint8Array
    var u8_block;
    try {
        u8_block = Nacl.util.decodeBase64(block);
    } catch (e) {
        return void cb('E_INVALID_BLOCK');
    }

    // take its hash
    var hash = Nacl.hash(u8_block);

    // validate the signature against the hash of the content
    var verified = Nacl.sign.detached.verify(hash, u8_signature, u8_public_key);

    // existing authentication ensures that users cannot replay old blocks

    // call back with (err) if unsuccessful
    if (!verified) { return void cb("E_COULD_NOT_VERIFY"); }

    return void cb(null, u8_block);
};

var createLoginBlockPath = function (Env, publicKey) { // FIXME BLOCKS
    // prepare publicKey to be used as a file name
    var safeKey = escapeKeyCharacters(publicKey);

    // validate safeKey
    if (typeof(safeKey) !== 'string') {
        return;
    }

    // derive the full path
    // /home/cryptpad/cryptpad/block/fg/fg32kefksjdgjkewrjksdfksjdfsdfskdjfsfd
    return Path.join(Env.paths.block, safeKey.slice(0, 2), safeKey);
};

var writeLoginBlock = function (Env, msg, cb) { // FIXME BLOCKS
    //console.log(msg);
    var publicKey = msg[0];
    var signature = msg[1];
    var block = msg[2];

    validateLoginBlock(Env, publicKey, signature, block, function (e, validatedBlock) {
        if (e) { return void cb(e); }
        if (!(validatedBlock instanceof Uint8Array)) { return void cb('E_INVALID_BLOCK'); }

        // derive the filepath
        var path = createLoginBlockPath(Env, publicKey);

        // make sure the path is valid
        if (typeof(path) !== 'string') {
            return void cb('E_INVALID_BLOCK_PATH');
        }

        var parsed = Path.parse(path);
        if (!parsed || typeof(parsed.dir) !== 'string') {
            return void cb("E_INVALID_BLOCK_PATH_2");
        }

        nThen(function (w) {
            // make sure the path to the file exists
            Fse.mkdirp(parsed.dir, w(function (e) {
                if (e) {
                    w.abort();
                    cb(e);
                }
            }));
        }).nThen(function () {
            // actually write the block

            // flow is dumb and I need to guard against this which will never happen
            /*:: if (typeof(validatedBlock) === 'undefined') { throw new Error('should never happen'); } */
            /*:: if (typeof(path) === 'undefined') { throw new Error('should never happen'); } */
            Fs.writeFile(path, Buffer.from(validatedBlock), { encoding: "binary", }, function (err) {
                if (err) { return void cb(err); }
                cb();
            });
        });
    });
};

/*
    When users write a block, they upload the block, and provide
    a signature proving that they deserve to be able to write to
    the location determined by the public key.

    When removing a block, there is nothing to upload, but we need
    to sign something. Since the signature is considered sensitive
    information, we can just sign some constant and use that as proof.

*/
var removeLoginBlock = function (Env, msg, cb) { // FIXME BLOCKS
    var publicKey = msg[0];
    var signature = msg[1];
    var block = Nacl.util.decodeUTF8('DELETE_BLOCK'); // clients and the server will have to agree on this constant

    validateLoginBlock(Env, publicKey, signature, block, function (e /*::, validatedBlock */) {
        if (e) { return void cb(e); }
        // derive the filepath
        var path = createLoginBlockPath(Env, publicKey);

        // make sure the path is valid
        if (typeof(path) !== 'string') {
            return void cb('E_INVALID_BLOCK_PATH');
        }

        // FIXME COLDSTORAGE
        Fs.unlink(path, function (err) {
            Log.info('DELETION_BLOCK_BY_OWNER_RPC', {
                publicKey: publicKey,
                path: path,
                status: err? String(err): 'SUCCESS',
            });

            if (err) { return void cb(err); }
            cb();
        });
    });
};

var ARRAY_LINE = /^\[/;

/*  Files can contain metadata but not content
    call back with true if the channel log has no content other than metadata
    otherwise false
*/
var isNewChannel = function (Env, channel, cb) {
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
            WARN('invalid message read from store', e);
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
var writePrivateMessage = function (Env, args, nfwssCtx, cb) {
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

var isUnauthenticatedCall = function (call) {
    return [
        'GET_FILE_SIZE',
        'GET_METADATA',
        'GET_MULTIPLE_FILE_SIZE',
        'IS_CHANNEL_PINNED',
        'IS_NEW_CHANNEL',
        'GET_HISTORY_OFFSET',
        'GET_DELETED_PADS',
        'WRITE_PRIVATE_MESSAGE',
    ].indexOf(call) !== -1;
};

var isAuthenticatedCall = function (call) {
    return [
        'COOKIE',
        'RESET',
        'PIN',
        'UNPIN',
        'GET_HASH',
        'GET_TOTAL_SIZE',
        'UPDATE_LIMITS',
        'GET_LIMIT',
        'UPLOAD_STATUS',
        'UPLOAD_COMPLETE',
        'OWNED_UPLOAD_COMPLETE',
        'UPLOAD_CANCEL',
        'EXPIRE_SESSION',
        'TRIM_OWNED_CHANNEL_HISTORY',
        'CLEAR_OWNED_CHANNEL',
        'REMOVE_OWNED_CHANNEL',
        'REMOVE_PINS',
        'TRIM_PINS',
        'WRITE_LOGIN_BLOCK',
        'REMOVE_LOGIN_BLOCK',
        'ADMIN',
        'SET_METADATA'
    ].indexOf(call) !== -1;
};

// upload_status
var upload_status = function (Env, safeKey, filesize, _cb) { // FIXME FILES
    var cb = Util.once(Util.mkAsync(_cb));

    // validate that the provided size is actually a positive number
    if (typeof(filesize) !== 'number' &&
        filesize >= 0) { return void cb('E_INVALID_SIZE'); }

    if (filesize >= Env.maxUploadSize) { return cb('TOO_LARGE'); }

    nThen(function (w) {
        var abortAndCB = Util.both(w.abort, cb);
        Env.blobStore.status(safeKey, w(function (err, inProgress) {
            // if there's an error something is weird
            if (err) { return void abortAndCB(err); }

            // we cannot upload two things at once
            if (inProgress) { return void abortAndCB(void 0, true); }
        }));
    }).nThen(function () {
        // if yuo're here then there are no pending uploads
        // check if you have space in your quota to upload something of this size
        Pinning.getFreeSpace(Env, safeKey, function (e, free) {
            if (e) { return void cb(e); }
            if (filesize >= free) { return cb('NOT_ENOUGH_SPACE'); }
            cb(void 0, false);
        });
    });
};

RPC.create = function (config, cb) {
    Log = config.log;

    // load pin-store...
    Log.silly('LOADING RPC MODULE');

    var keyOrDefaultString = function (key, def) {
        return typeof(config[key]) === 'string'? config[key]: def;
    };

    var Env = {
        defaultStorageLimit: config.defaultStorageLimit,
        maxUploadSize: config.maxUploadSize || (20 * 1024 * 1024),
        Sessions: {},
        paths: {},
        msgStore: config.store,
        pinStore: undefined,
        pinnedPads: {},
        evPinnedPadsReady: mkEvent(true),
        limits: {},
        admins: [],
        sessionExpirationInterval: undefined,
        Log: Log,
        WARN: WARN,
    };

    try {
        Env.admins = (config.adminKeys || []).map(function (k) {
            k = k.replace(/\/+$/, '');
            var s = k.split('/');
            return s[s.length-1];
        });
    } catch (e) {
        console.error("Can't parse admin keys. Please update or fix your config.js file!");
    }

    var Sessions = Env.Sessions;
    var paths = Env.paths;
    var pinPath = paths.pin = keyOrDefaultString('pinPath', './pins');
    paths.block = keyOrDefaultString('blockPath', './block');
    paths.data = keyOrDefaultString('filePath', './datastore');
    paths.staging = keyOrDefaultString('blobStagingPath', './blobstage');
    paths.blob = keyOrDefaultString('blobPath', './blob');

    var isUnauthenticateMessage = function (msg) {
        return msg && msg.length === 2 && isUnauthenticatedCall(msg[0]);
    };

    var handleUnauthenticatedMessage = function (msg, respond, nfwssCtx) {
        Log.silly('LOG_RPC', msg[0]);
        switch (msg[0]) {
            case 'GET_HISTORY_OFFSET': {
                if (typeof(msg[1]) !== 'object' || typeof(msg[1].channelName) !== 'string') {
                    return respond('INVALID_ARG_FORMAT', msg);
                }
                const msgHash = typeof(msg[1].msgHash) === 'string' ? msg[1].msgHash : undefined;
                nfwssCtx.getHistoryOffset(nfwssCtx, msg[1].channelName, msgHash, (e, ret) => {
                    if (e) {
                        if (e.code !== 'ENOENT') {
                            WARN(e.stack, msg);
                        }
                        return respond(e.message);
                    }
                    respond(e, [null, ret, null]);
                });
                break;
            }
            case 'GET_FILE_SIZE':
                return void Pinning.getFileSize(Env, msg[1], function (e, size) {
                    WARN(e, msg[1]);
                    respond(e, [null, size, null]);
                });
            case 'GET_METADATA':
                return void getMetadata(Env, msg[1], function (e, data) {
                    WARN(e, msg[1]);
                    respond(e, [null, data, null]);
                });
            case 'GET_MULTIPLE_FILE_SIZE':
                return void Pinning.getMultipleFileSize(Env, msg[1], function (e, dict) {
                    if (e) {
                        WARN(e, dict);
                        return respond(e);
                    }
                    respond(e, [null, dict, null]);
                });
            case 'GET_DELETED_PADS':
                return void Pinning.getDeletedPads(Env, msg[1], function (e, list) {
                    if (e) {
                        WARN(e, msg[1]);
                        return respond(e);
                    }
                    respond(e, [null, list, null]);
                });
            case 'IS_CHANNEL_PINNED':
                return void Pinning.isChannelPinned(Env, msg[1], function (isPinned) {
                    respond(null, [null, isPinned, null]);
                });
            case 'IS_NEW_CHANNEL':
                return void isNewChannel(Env, msg[1], function (e, isNew) {
                    respond(e, [null, isNew, null]);
                });
            case 'WRITE_PRIVATE_MESSAGE':
                return void writePrivateMessage(Env, msg[1], nfwssCtx, function (e, output) {
                    respond(e, output);
                });
            default:
                Log.warn("UNSUPPORTED_RPC_CALL", msg);
                return respond('UNSUPPORTED_RPC_CALL', msg);
        }
    };

    var rpc0 = function (ctx, data, respond) {
        if (!Array.isArray(data)) {
            Log.debug('INVALID_ARG_FORMET', data);
            return void respond('INVALID_ARG_FORMAT');
        }

        if (!data.length) {
            return void respond("INSUFFICIENT_ARGS");
        } else if (data.length !== 1) {
            Log.debug('UNEXPECTED_ARGUMENTS_LENGTH', data);
        }

        var msg = data[0].slice(0);

        if (!Array.isArray(msg)) {
            return void respond('INVALID_ARG_FORMAT');
        }

        if (isUnauthenticateMessage(msg)) {
            return handleUnauthenticatedMessage(msg, respond, ctx);
        }

        var signature = msg.shift();
        var publicKey = msg.shift();

        // make sure a user object is initialized in the cookie jar
        if (publicKey) {
            Core.getSession(Sessions, publicKey);
        } else {
            Log.debug("NO_PUBLIC_KEY_PROVIDED", publicKey);
        }

        var cookie = msg[0];
        if (!Core.isValidCookie(Sessions, publicKey, cookie)) {
            // no cookie is fine if the RPC is to get a cookie
            if (msg[1] !== 'COOKIE') {
                return void respond('NO_COOKIE');
            }
        }

        var serialized = JSON.stringify(msg);

        if (!(serialized && typeof(publicKey) === 'string')) {
            return void respond('INVALID_MESSAGE_OR_PUBLIC_KEY');
        }

        if (isAuthenticatedCall(msg[1])) {
            if (Core.checkSignature(Env, serialized, signature, publicKey) !== true) {
                return void respond("INVALID_SIGNATURE_OR_PUBLIC_KEY");
            }
        } else if (msg[1] !== 'UPLOAD') {
            Log.warn('INVALID_RPC_CALL', msg[1]);
            return void respond("INVALID_RPC_CALL");
        }

        var safeKey = escapeKeyCharacters(publicKey);
        /*  If you have gotten this far, you have signed the message with the
            public key which you provided.

            We can safely modify the state for that key

            OR it's an unauthenticated call, which must not modify the state
            for that key in a meaningful way.
        */

        // discard validated cookie from message
        msg.shift();

        var Respond = function (e, msg) {
            var session = Sessions[safeKey];
            var token = session? session.tokens.slice(-1)[0]: '';
            var cookie = Core.makeCookie(token).join('|');
            respond(e ? String(e): e, [cookie].concat(typeof(msg) !== 'undefined' ?msg: []));
        };

        if (typeof(msg) !== 'object' || !msg.length) {
            return void Respond('INVALID_MSG');
        }

        var handleMessage = function () {
            Log.silly('LOG_RPC', msg[0]);
        switch (msg[0]) {
            case 'COOKIE': return void Respond(void 0);
            case 'RESET':
                return Pinning.resetUserPins(Env, safeKey, msg[1], function (e, hash) {
                    //WARN(e, hash);
                    return void Respond(e, hash);
                });
            case 'PIN':
                return Pinning.pinChannel(Env, safeKey, msg[1], function (e, hash) {
                    WARN(e, hash);
                    Respond(e, hash);
                });
            case 'UNPIN':
                return Pinning.unpinChannel(Env, safeKey, msg[1], function (e, hash) {
                    WARN(e, hash);
                    Respond(e, hash);
                });
            case 'GET_HASH':
                return void Pinning.getHash(Env, safeKey, function (e, hash) {
                    WARN(e, hash);
                    Respond(e, hash);
                });
            case 'GET_TOTAL_SIZE': // TODO cache this, since it will get called quite a bit
                return Pinning.getTotalSize(Env, safeKey, function (e, size) {
                    if (e) {
                        WARN(e, safeKey);
                        return void Respond(e);
                    }
                    Respond(e, size);
                });
            case 'UPDATE_LIMITS':
                return void Quota.updateLimits(Env, config, safeKey, function (e, limit) {
                    if (e) {
                        WARN(e, limit);
                        return void Respond(e);
                    }
                    Respond(void 0, limit);
                });
            case 'GET_LIMIT':
                return void Pinning.getLimit(Env, safeKey, function (e, limit) {
                    if (e) {
                        WARN(e, limit);
                        return void Respond(e);
                    }
                    Respond(void 0, limit);
                });
            case 'EXPIRE_SESSION':
                return void setTimeout(function () {
                    Core.expireSession(Sessions, safeKey);
                    Respond(void 0, "OK");
                });
            case 'CLEAR_OWNED_CHANNEL':
                return void clearOwnedChannel(Env, msg[1], publicKey, function (e, response) {
                    if (e) { return void Respond(e); }
                    Respond(void 0, response);
                });

            case 'REMOVE_OWNED_CHANNEL':
                return void removeOwnedChannel(Env, msg[1], publicKey, function (e) {
                    if (e) { return void Respond(e); }
                    Respond(void 0, "OK");
                });
            case 'TRIM_OWNED_CHANNEL_HISTORY':
                return void removeOwnedChannelHistory(Env, msg[1], publicKey, msg[2], function (e) {
                    if (e) { return void Respond(e); }
                    Respond(void 0, 'OK');
                });
            case 'REMOVE_PINS':
                return void Pinning.removePins(Env, safeKey, function (e) {
                    if (e) { return void Respond(e); }
                    Respond(void 0, "OK");
                });
            case 'TRIM_PINS':
                return void Pinning.trimPins(Env, safeKey, function (e) {
                    if (e) { return void Respond(e); }
                    Respond(void 0, "OK");
                });
            case 'UPLOAD':
                return void Env.blobStore.upload(safeKey, msg[1], function (e, len) {
                    WARN(e, len);
                    Respond(e, len);
                });
            case 'UPLOAD_STATUS':
                var filesize = msg[1];
                return void upload_status(Env, safeKey, filesize, function (e, yes) {
                    if (!e && !yes) {
                        // no pending uploads, set the new size
                        var user = Core.getSession(Sessions, safeKey);
                        user.pendingUploadSize = filesize;
                        user.currentUploadSize = 0;
                    }
                    Respond(e, yes);
                });
            case 'UPLOAD_COMPLETE':
                return void Env.blobStore.complete(safeKey, msg[1], function (e, hash) {
                    WARN(e, hash);
                    Respond(e, hash);
                });
            case 'OWNED_UPLOAD_COMPLETE':
                return void Env.blobStore.completeOwned(safeKey, msg[1], function (e, blobId) {
                    WARN(e, blobId);
                    Respond(e, blobId);
                });
            case 'UPLOAD_CANCEL':
                // msg[1] is fileSize
                // if we pass it here, we can start an upload right away without calling
                // UPLOAD_STATUS again
                return void Env.blobStore.cancel(safeKey, msg[1], function (e) {
                    WARN(e, 'UPLOAD_CANCEL');
                    Respond(e);
                });
            case 'WRITE_LOGIN_BLOCK':
                return void writeLoginBlock(Env, msg[1], function (e) {
                    if (e) {
                        WARN(e, 'WRITE_LOGIN_BLOCK');
                        return void Respond(e);
                    }
                    Respond(e);
                });
            case 'REMOVE_LOGIN_BLOCK':
                return void removeLoginBlock(Env, msg[1], function (e) {
                    if (e) {
                        WARN(e, 'REMOVE_LOGIN_BLOCK');
                        return void Respond(e);
                    }
                    Respond(e);
                });
            case 'ADMIN':
                return void Admin.command(Env, ctx, safeKey, config, msg[1], function (e, result) {
                    if (e) {
                        WARN(e, result);
                        return void Respond(e);
                    }
                    Respond(void 0, result);
                });
            case 'SET_METADATA':
                return void setMetadata(Env, msg[1], publicKey, function (e, data) {
                    if (e) {
                        WARN(e, data);
                        return void Respond(e);
                    }
                    Respond(void 0, data);
                });
            default:
                return void Respond('UNSUPPORTED_RPC_CALL', msg);
        }
        };

        handleMessage(true);
    };

    var rpc = function (ctx, data, respond) {
        try {
            return rpc0(ctx, data, respond);
        } catch (e) {
            console.log("Error from RPC with data " + JSON.stringify(data));
            console.log(e.stack);
        }
    };

    var updateLimitDaily = function () {
        Quota.updateLimits(Env, config, undefined, function (e) {
            if (e) {
                WARN('limitUpdate', e);
            }
        });
    };
    Quota.applyCustomLimits(Env, config);
    updateLimitDaily();
    setInterval(updateLimitDaily, 24*3600*1000);

    Pinning.loadChannelPins(Env);

    nThen(function (w) {
        Store.create({
            filePath: pinPath,
        }, w(function (s) {
            Env.pinStore = s;
        }));
        BlobStore.create({
            blobPath: config.blobPath,
            blobStagingPath: config.blobStagingPath,
            archivePath: config.archivePath,
            getSession: function (safeKey) {
                return Core.getSession(Sessions, safeKey);
            },
        }, w(function (err, blob) {
            if (err) { throw new Error(err); }
            Env.blobStore = blob;
        }));
    }).nThen(function () {
        cb(void 0, rpc);
        // expire old sessions once per minute
        // XXX allow for graceful shutdown
        Env.sessionExpirationInterval = setInterval(function () {
            Core.expireSessions(Sessions);
        }, Core.SESSION_EXPIRATION_TIME);
    });
};
