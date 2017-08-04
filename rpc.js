/*@flow*/
/*jshint esversion: 6 */
/*  Use Nacl for checking signatures of messages */
var Nacl = require("tweetnacl");

/* globals Buffer*/
/* globals process */

var Fs = require("fs");
var Path = require("path");
var Https = require("https");
const Package = require('./package.json');

var RPC = module.exports;

var Store = require("./storage/file");

var DEFAULT_LIMIT = 50 * 1024 * 1024;
var SESSION_EXPIRATION_TIME = 60 * 1000;
var SUPPRESS_RPC_ERRORS = false;

var WARN = function (e, output) {
    if (!SUPPRESS_RPC_ERRORS && e && output) {
        console.error(new Date().toISOString() + ' [' + e + ']', output);
        console.error(new Error(e).stack);
        console.error();
    }
};

var isValidId = function (chan) {
    return chan && chan.length && /^[a-fA-F0-9]/.test(chan) &&
        [32, 48].indexOf(chan.length) > -1;
};

var uint8ArrayToHex = function (a) {
    // call slice so Uint8Arrays work as expected
    return Array.prototype.slice.call(a).map(function (e) {
        var n = Number(e & 0xff).toString(16);
        if (n === 'NaN') {
            throw new Error('invalid input resulted in NaN');
        }

        switch (n.length) {
            case 0: return '00'; // just being careful, shouldn't happen
            case 1: return '0' + n;
            case 2: return n;
            default: throw new Error('unexpected value');
        }
    }).join('');
};

var createFileId = function () {
    var id = uint8ArrayToHex(Nacl.randomBytes(24));
    if (id.length !== 48 || /[^a-f0-9]/.test(id)) {
        throw new Error('file ids must consist of 48 hex characters');
    }
    return id;
};

var makeToken = function () {
    return Number(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))
        .toString(16);
};

var makeCookie = function (token) {
    var time = (+new Date());
    time -= time % 5000;

    return [
        time,
        process.pid,
        token
    ];
};

var parseCookie = function (cookie) {
    if (!(cookie && cookie.split)) { return null; }

    var parts = cookie.split('|');
    if (parts.length !== 3) { return null; }

    var c = {};
    c.time = new Date(parts[0]);
    c.pid = Number(parts[1]);
    c.seq = parts[2];
    return c;
};

var escapeKeyCharacters = function (key) {
    return key && key.replace && key.replace(/\//g, '-');
};

var unescapeKeyCharacters = function (key) {
    return key.replace(/\-/g, '/');
};

//  TODO Rename to getSession ?
var beginSession = function (Sessions, key) {
    var safeKey = escapeKeyCharacters(key);
    if (Sessions[safeKey]) {
        Sessions[safeKey].atime = +new Date();
        return Sessions[safeKey];
    }
    var user = Sessions[safeKey] = {};
    user.atime = +new Date();
    user.tokens = [
        makeToken()
    ];
    return user;
};

var isTooOld = function (time, now) {
    return (now - time) > 300000;
};

var expireSession = function (Sessions, key) {
    var session = Sessions[key];
    if (!session) { return; }
    if (session.blobstage) {
        session.blobstage.close();
    }
    delete Sessions[key];
};

var expireSessions = function (Sessions) {
    var now = +new Date();
    Object.keys(Sessions).forEach(function (key) {
        var session = Sessions[key];
        if (session && isTooOld(session.atime, now)) {
            expireSession(Sessions, key);
        }
    });
};

var addTokenForKey = function (Sessions, publicKey, token) {
    if (!Sessions[publicKey]) { throw new Error('undefined user'); }

    var user = beginSession(Sessions, publicKey);
    user.tokens.push(token);
    user.atime = +new Date();
    if (user.tokens.length > 2) { user.tokens.shift(); }
};

var isValidCookie = function (Sessions, publicKey, cookie) {
    var parsed = parseCookie(cookie);
    if (!parsed) { return false; }

    var now = +new Date();

    if (!parsed.time) { return false; }
    if (isTooOld(parsed.time, now)) {
        return false;
    }

    // different process. try harder
    if (process.pid !== parsed.pid) {
        return false;
    }

    var user = beginSession(Sessions, publicKey);
    if (!user) { return false; }

    var idx = user.tokens.indexOf(parsed.seq);
    if (idx === -1) { return false; }

    if (idx > 0) {
        // make a new token
        addTokenForKey(Sessions, publicKey, makeToken());
    }

    return true;
};

var checkSignature = function (signedMsg, signature, publicKey) {
    if (!(signedMsg && publicKey)) { return false; }

    var signedBuffer;
    var pubBuffer;
    var signatureBuffer;

    try {
        signedBuffer = Nacl.util.decodeUTF8(signedMsg);
    } catch (e) {
        console.log('invalid signedBuffer');
        console.log(signedMsg);
        return null;
    }

    try {
        pubBuffer = Nacl.util.decodeBase64(publicKey);
    } catch (e) {
        return false;
    }

    try {
        signatureBuffer = Nacl.util.decodeBase64(signature);
    } catch (e) {
        return false;
    }

    if (pubBuffer.length !== 32) {
        console.log('public key length: ' + pubBuffer.length);
        console.log(publicKey);
        return false;
    }

    if (signatureBuffer.length !== 64) {
        return false;
    }

    return Nacl.sign.detached.verify(signedBuffer, signatureBuffer, pubBuffer);
};

var loadUserPins = function (Env, publicKey, cb) {
    var pinStore = Env.pinStore;
    var session = beginSession(Env.Sessions, publicKey);

    if (session.channels) {
        return cb(session.channels);
    }

    // if channels aren't in memory. load them from disk
    var pins = {};

    var pin = function (channel) {
        pins[channel] = true;
    };

    var unpin = function (channel) {
        pins[channel] = false;
    };

    pinStore.getMessages(publicKey, function (msg) {
        // handle messages...
        var parsed;
        try {
            parsed = JSON.parse(msg);
            session.hasPinned = true;

            switch (parsed[0]) {
                case 'PIN':
                    parsed[1].forEach(pin);
                    break;
                case 'UNPIN':
                    parsed[1].forEach(unpin);
                    break;
                case 'RESET':
                    Object.keys(pins).forEach(unpin);

                    if (parsed[1] && parsed[1].length) {
                        parsed[1].forEach(pin);
                    }
                    break;
                default:
                    WARN('invalid message read from store', msg);
            }
        } catch (e) {
            WARN('invalid message read from store', e);
        }
    }, function () {
        // no more messages

        // only put this into the cache if it completes
        session.channels = pins;
        cb(pins);
    });
};

var truthyKeys = function (O) {
    return Object.keys(O).filter(function (k) {
        return O[k];
    });
};

var getChannelList = function (Env, publicKey, cb) {
    loadUserPins(Env, publicKey, function (pins) {
        cb(truthyKeys(pins));
    });
};

var makeFilePath = function (root, id) {
    if (typeof(id) !== 'string' || id.length <= 2) { return null; }
    return Path.join(root, id.slice(0, 2), id);
};

var getUploadSize = function (Env, channel, cb) {
    var paths = Env.paths;
    var path = makeFilePath(paths.blob, channel);
    if (!path) {
        return cb('INVALID_UPLOAD_ID', path);
    }

    Fs.stat(path, function (err, stats) {
        if (err) {
            // if a file was deleted, its size is 0 bytes
            if (err.code === 'ENOENT') { return cb(void 0, 0); }
            return void cb(err);
        }
        cb(void 0, stats.size);
    });
};

var getFileSize = function (Env, channel, cb) {
    if (!isValidId(channel)) { return void cb('INVALID_CHAN'); }

    if (channel.length === 32) {
        if (typeof(Env.msgStore.getChannelSize) !== 'function') {
            return cb('GET_CHANNEL_SIZE_UNSUPPORTED');
        }

        return void Env.msgStore.getChannelSize(channel, function (e, size) {
            if (e) {
                if (e === 'ENOENT') { return void cb(void 0, 0); }
                return void cb(e.code);
            }
            cb(void 0, size);
        });
    }

    // 'channel' refers to a file, so you need anoter API
    getUploadSize(Env, channel, function (e, size) {
        if (e) { return void cb(e); }
        cb(void 0, size);
    });
};

var getMultipleFileSize = function (Env, channels, cb) {
    var msgStore = Env.msgStore;
    if (!Array.isArray(channels)) { return cb('INVALID_PIN_LIST'); }
    if (typeof(msgStore.getChannelSize) !== 'function') {
        return cb('GET_CHANNEL_SIZE_UNSUPPORTED');
    }

    var i = channels.length;
    var counts = {};

    var done = function () {
        i--;
        if (i === 0) { return cb(void 0, counts); }
    };

    channels.forEach(function (channel) {
        getFileSize(Env, channel, function (e, size) {
            if (e) {
                // most likely error here is that a file no longer exists
                // but a user still has it in their drive, and wants to know
                // its size. We should find a way to inform them of this in
                // the future. For now we can just tell them it has no size.

                //WARN('getFileSize', e);
                counts[channel] = 0;
                return done();
            }
            counts[channel] = size;
            done();
        });
    });
};

var getTotalSize = function (Env, publicKey, cb) {
    var bytes = 0;
    return void getChannelList(Env, publicKey, function (channels) {
        if (!channels) { return cb('INVALID_PIN_LIST'); } // unexpected

        var count = channels.length;
        if (!count) { cb(void 0, 0); }

        channels.forEach(function (channel) {
            getFileSize(Env, channel, function (e, size) {
                count--;
                if (!e) { bytes += size; }
                if (count === 0) { return cb(void 0, bytes); }
            });
        });
    });
};

var hashChannelList = function (A) {
    var uniques = [];

    A.forEach(function (a) {
        if (uniques.indexOf(a) === -1) { uniques.push(a); }
    });
    uniques.sort();

    var hash = Nacl.util.encodeBase64(Nacl.hash(Nacl
        .util.decodeUTF8(JSON.stringify(uniques))));

    return hash;
};

var getHash = function (Env, publicKey, cb) {
    getChannelList(Env, publicKey, function (channels) {
        cb(void 0, hashChannelList(channels));
    });
};

// The limits object contains storage limits for all the publicKey that have paid
// To each key is associated an object containing the 'limit' value and a 'note' explaining that limit
var limits = {};
var updateLimits = function (config, publicKey, cb) {
    if (config.adminEmail === false) {
        if (config.allowSubscriptions === false) { return; }
        throw new Error("allowSubscriptions must be false if adminEmail is false");
    }
    if (typeof cb !== "function") { cb = function () {}; }

    var defaultLimit = typeof(config.defaultStorageLimit) === 'number'?
        config.defaultStorageLimit: DEFAULT_LIMIT;

    var userId;
    if (publicKey) {
        userId = unescapeKeyCharacters(publicKey);
    }

    var body = JSON.stringify({
        domain: config.myDomain,
        subdomain: config.mySubdomain,
        adminEmail: config.adminEmail,
        version: Package.version
    });
    var options = {
        host: 'accounts.cryptpad.fr',
        path: '/api/getauthorized',
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body)
        }
    };
    var req = Https.request(options, function (response) {
        if (!('' + response.statusCode).match(/^2\d\d$/)) {
            return void cb('SERVER ERROR ' + response.statusCode);
        }
        var str = '';

        response.on('data', function (chunk) {
            str += chunk;
        });

        response.on('end', function () {
            try {
                var json = JSON.parse(str);
                limits = json;
                var l;
                if (userId) {
                    var limit = limits[userId];
                    l = limit && typeof limit.limit === "number" ?
                            [limit.limit, limit.plan, limit.note] : [defaultLimit, '', ''];
                }
                cb(void 0, l);
            } catch (e) {
                cb(e);
            }
        });
    });

    req.on('error', function (e) {
        if (!config.domain) { return cb(); }
        cb(e);
    });

    req.end(body);
};

var getLimit = function (Env, publicKey, cb) {
    var unescapedKey = unescapeKeyCharacters(publicKey);
    var limit = limits[unescapedKey];
    var defaultLimit = typeof(Env.defaultStorageLimit) === 'number'?
        Env.defaultStorageLimit: DEFAULT_LIMIT;

    var toSend = limit && typeof(limit.limit) === "number"?
        [limit.limit, limit.plan, limit.note] : [defaultLimit, '', ''];

    cb(void 0, toSend);
};

var getFreeSpace = function (Env, publicKey, cb) {
    getLimit(Env, publicKey, function (e, limit) {
        if (e) { return void cb(e); }
        getTotalSize(Env, publicKey, function (e, size) {
            if (e) { return void cb(e); }

            var rem = limit[0] - size;
            if (typeof(rem) !== 'number') {
                return void cb('invalid_response');
            }
            cb(void 0, rem);
        });
    });
};

var sumChannelSizes = function (sizes) {
    return Object.keys(sizes).map(function (id) { return sizes[id]; })
        .filter(function (x) {
            // only allow positive numbers
            return !(typeof(x) !== 'number' || x <= 0);
        })
        .reduce(function (a, b) { return a + b; }, 0);
};

var pinChannel = function (Env, publicKey, channels, cb) {
    if (!channels && channels.filter) {
        return void cb('INVALID_PIN_LIST');
    }

    // get channel list ensures your session has a cached channel list
    getChannelList(Env, publicKey, function (pinned) {
        var session = beginSession(Env.Sessions, publicKey);

        // only pin channels which are not already pinned
        var toStore = channels.filter(function (channel) {
            return pinned.indexOf(channel) === -1;
        });

        if (toStore.length === 0) {
            return void getHash(Env, publicKey, cb);
        }

        getMultipleFileSize(Env, toStore, function (e, sizes) {
            if (e) { return void cb(e); }
            var pinSize = sumChannelSizes(sizes);

            getFreeSpace(Env, publicKey, function (e, free) {
                if (e) {
                    WARN('getFreeSpace', e);
                    return void cb(e);
                }
                if (pinSize > free) { return void cb('E_OVER_LIMIT'); }

                Env.pinStore.message(publicKey, JSON.stringify(['PIN', toStore]),
                    function (e) {
                    if (e) { return void cb(e); }
                    toStore.forEach(function (channel) {
                        session.channels[channel] = true;
                    });
                    getHash(Env, publicKey, cb);
                });
            });
        });
    });
};

var unpinChannel = function (Env, publicKey, channels, cb) {
    var pinStore = Env.pinStore;
    if (!channels && channels.filter) {
        // expected array
        return void cb('INVALID_PIN_LIST');
    }

    getChannelList(Env, publicKey, function (pinned) {
        var session = beginSession(Env.Sessions, publicKey);

        // only unpin channels which are pinned
        var toStore = channels.filter(function (channel) {
            return pinned.indexOf(channel) !== -1;
        });

        if (toStore.length === 0) {
            return void getHash(Env, publicKey, cb);
        }

        pinStore.message(publicKey, JSON.stringify(['UNPIN', toStore]),
            function (e) {
            if (e) { return void cb(e); }
            toStore.forEach(function (channel) {
                delete session.channels[channel];
            });

            getHash(Env, publicKey, cb);
        });
    });
};

var resetUserPins = function (Env, publicKey, channelList, cb) {
    if (!Array.isArray(channelList)) { return void cb('INVALID_PIN_LIST'); }
    var pinStore = Env.pinStore;
    var session = beginSession(Env.Sessions, publicKey);

    if (!channelList.length) {
        return void getHash(Env, publicKey, function (e, hash) {
            if (e) { return cb(e); }
            cb(void 0, hash);
        });
    }

    var pins = {};
    getMultipleFileSize(Env, channelList, function (e, sizes) {
        if (e) { return void cb(e); }
        var pinSize = sumChannelSizes(sizes);


        getLimit(Env, publicKey, function (e, limit) {
            if (e) {
                WARN('[RESET_ERR]', e);
                return void cb(e);
            }

            /*  we want to let people pin, even if they are over their limit,
                but they should only be able to do this once.

                This prevents data loss in the case that someone registers, but
                does not have enough free space to pin their migrated data.

                They will not be able to pin additional pads until they upgrade
                or delete enough files to go back under their limit. */
            if (pinSize > limit && session.hasPinned) { return void(cb('E_OVER_LIMIT')); }
            pinStore.message(publicKey, JSON.stringify(['RESET', channelList]),
                function (e) {
                if (e) { return void cb(e); }
                channelList.forEach(function (channel) {
                    pins[channel] = true;
                });

                // update in-memory cache IFF the reset was allowed.
                session.channels = pins;
                getHash(Env, publicKey, function (e, hash) {
                    cb(e, hash);
                });
            });
        });
    });
};

var getPrivilegedUserList = function (cb) {
    Fs.readFile('./privileged.conf', 'utf8', function (e, body) {
        if (e) {
            if (e.code === 'ENOENT') {
                return void cb(void 0, []);
            }
            return void (e.code);
        }
        var list = body.split(/\n/)
            .map(function (line) {
                return line.replace(/#.*$/, '').trim();
            })
            .filter(function (x) { return x; });
        cb(void 0, list);
    });
};

var isPrivilegedUser = function (publicKey, cb) {
    getPrivilegedUserList(function (e, list) {
        if (e) { return void cb(false); }
        cb(list.indexOf(publicKey) !== -1);
    });
};
var safeMkdir = function (path, cb) {
    Fs.mkdir(path, function (e) {
        if (!e || e.code === 'EEXIST') { return void cb(); }
        cb(e);
    });
};

var makeFileStream = function (root, id, cb) {
    var stub = id.slice(0, 2);
    var full = makeFilePath(root, id);
    safeMkdir(Path.join(root, stub), function (e) {
        if (e) { return void cb(e); }

        try {
            var stream = Fs.createWriteStream(full, {
                flags: 'a',
                encoding: 'binary',
                highWaterMark: Math.pow(2, 16),
            });
            stream.on('open', function () {
                cb(void 0, stream);
            });
            stream.on('error', function (e) {
                WARN('stream error', e);
            });
        } catch (err) {
            cb('BAD_STREAM');
        }
    });
};

var clearOwnedChannel = function (Env, channelId, unsafeKey, cb) {
    if (typeof(channelId) !== 'string' || channelId.length !== 32) {
        return cb('INVALID_ARGUMENTS');
    }

    if (!(Env.msgStore && Env.msgStore.getChannelMetadata)) {
        return cb('E_NOT_IMPLEMENTED');
    }

    Env.msgStore.getChannelMetadata(channelId, function (e, metadata) {
        if (e) { return cb(e); }
        if (!(metadata && Array.isArray(metadata.owners))) { return void cb('E_NO_OWNERS'); }
        // Confirm that the channel is owned by the user is question
        if (metadata.owners.indexOf(unsafeKey) === -1) {
            return void cb('INSUFFICIENT_PERMISSIONS');
        }

        return void Env.msgStore.clearChannel(channelId, function (e) {
            cb(e);
        });
    });
};

var upload = function (Env, publicKey, content, cb) {
    var paths = Env.paths;
    var dec;
    try { dec = Buffer.from(content, 'base64'); }
    catch (e) { return void cb(e); }
    var len = dec.length;

    var session = beginSession(Env.Sessions, publicKey);

    if (typeof(session.currentUploadSize) !== 'number' ||
        typeof(session.currentUploadSize) !== 'number') {
        // improperly initialized... maybe they didn't check before uploading?
        // reject it, just in case
        return cb('NOT_READY');
    }

    if (session.currentUploadSize > session.pendingUploadSize) {
        return cb('E_OVER_LIMIT');
    }

    if (!session.blobstage) {
        makeFileStream(paths.staging, publicKey, function (e, stream) {
            if (e) { return void cb(e); }

            var blobstage = session.blobstage = stream;
            blobstage.write(dec);
            session.currentUploadSize += len;
            cb(void 0, dec.length);
        });
    } else {
        session.blobstage.write(dec);
        session.currentUploadSize += len;
        cb(void 0, dec.length);
    }
};

var upload_cancel = function (Env, publicKey, cb) {
    var paths = Env.paths;

    var session = beginSession(Env.Sessions, publicKey);
    delete session.currentUploadSize;
    delete session.pendingUploadSize;
    if (session.blobstage) { session.blobstage.close(); }

    var path = makeFilePath(paths.staging, publicKey);
    if (!path) {
        console.log(paths.staging, publicKey);
        console.log(path);
        return void cb('NO_FILE');
    }

    Fs.unlink(path, function (e) {
        if (e) { return void cb('E_UNLINK'); }
        cb(void 0);
    });
};

var isFile = function (filePath, cb) {
    Fs.stat(filePath, function (e, stats) {
        if (e) {
            if (e.code === 'ENOENT') { return void cb(void 0, false); }
            return void cb(e.message);
        }
        return void cb(void 0, stats.isFile());
    });
};

var upload_complete = function (Env, publicKey, cb) {
    var paths = Env.paths;
    var session = beginSession(Env.Sessions, publicKey);

    if (session.blobstage && session.blobstage.close) {
        session.blobstage.close();
        delete session.blobstage;
    }

    var oldPath = makeFilePath(paths.staging, publicKey);

    var tryRandomLocation = function (cb) {
        var id = createFileId();
        var prefix = id.slice(0, 2);
        var newPath = makeFilePath(paths.blob, id);

        safeMkdir(Path.join(paths.blob, prefix), function (e) {
            if (e) {
                WARN('safeMkdir', e);
                return void cb('RENAME_ERR');
            }
            isFile(newPath, function (e, yes) {
                if (e) {
                    WARN('isFile', e);
                    return void cb(e);
                }
                if (yes) {
                    return void tryRandomLocation(cb);
                }

                cb(void 0, newPath, id);
            });
        });
    };

    var retries = 3;

    var handleMove = function (e, newPath, id) {
        if (e) {
            if (retries--) {
                setTimeout(function () {
                    return tryRandomLocation(handleMove);
                }, 750);
            }
        }

        // lol wut handle ur errors
        Fs.rename(oldPath, newPath, function (e) {
            if (e) {
                WARN('rename', e);

                if (retries--) {
                    return setTimeout(function () {
                        tryRandomLocation(handleMove);
                    }, 750);
                }

                return cb(e);
            }
            cb(void 0, id);
        });
    };

    tryRandomLocation(handleMove);
};

var upload_status = function (Env, publicKey, filesize, cb) {
    var paths = Env.paths;

    // validate that the provided size is actually a positive number
    if (typeof(filesize) !== 'number' &&
        filesize >= 0) { return void cb('E_INVALID_SIZE'); }

    // validate that the provided path is not junk
    var filePath = makeFilePath(paths.staging, publicKey);
    if (!filePath) { return void cb('E_INVALID_PATH'); }

    getFreeSpace(Env, publicKey, function (e, free) {
        if (e) { return void cb(e); }
        if (filesize >= free) { return cb('NOT_ENOUGH_SPACE'); }
        isFile(filePath, function (e, yes) {
            if (e) {
                WARN('upload', e);
                return cb('UNNOWN_ERROR');
            }
            cb(e, yes);
        });
    });
};

var isUnauthenticatedCall = function (call) {
    return [
        'GET_FILE_SIZE',
        'GET_MULTIPLE_FILE_SIZE',
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
        'UPLOAD_COMPLETE',
        'UPLOAD_CANCEL',
        'EXPIRE_SESSION',
    ].indexOf(call) !== -1;
};

/*::const ConfigType = require('./config.example.js');*/
RPC.create = function (config /*:typeof(ConfigType)*/, cb /*:(?Error, ?Function)=>void*/) {
    // load pin-store...
    console.log('loading rpc module...');

    if (config.suppressRPCErrors) { SUPPRESS_RPC_ERRORS = true; }

    var keyOrDefaultString = function (key, def) {
        return typeof(config[key]) === 'string'? config[key]: def;
    };

    var Env = {};
    Env.defaultStorageLimit = config.defaultStorageLimit;

    Env.maxUploadSize = config.maxUploadSize || (20 * 1024 * 1024);

    var Sessions = Env.Sessions = {};

    var paths = Env.paths = {};
    var pinPath = paths.pin = keyOrDefaultString('pinPath', './pins');
    var blobPath = paths.blob = keyOrDefaultString('blobPath', './blob');
    var blobStagingPath = paths.staging = keyOrDefaultString('blobStagingPath', './blobstage');

    var isUnauthenticateMessage = function (msg) {
        return msg && msg.length === 2 && isUnauthenticatedCall(msg[0]);
    };

    var handleUnauthenticatedMessage = function (msg, respond) {
        switch (msg[0]) {
            case 'GET_FILE_SIZE':
                return void getFileSize(Env, msg[1], function (e, size) {
                    if (e) {
                        console.error(e);
                    }
                    WARN(e, msg[1]);
                    respond(e, [null, size, null]);
                });
            case 'GET_MULTIPLE_FILE_SIZE':
                return void getMultipleFileSize(Env, msg[1], function (e, dict) {
                    if (e) {
                        WARN(e, dict);
                        return respond(e);
                    }
                    respond(e, [null, dict, null]);
                });
            default:
                console.error("unsupported!");
                return respond('UNSUPPORTED_RPC_CALL', msg);
        }
    };

    var rpc = function (
        ctx /*:{ store: Object }*/,
        data /*:Array<Array<any>>*/,
        respond /*:(?string, ?Array<any>)=>void*/)
    {
        if (!Array.isArray(data)) {
            return void respond('INVALID_ARG_FORMAT');
        }

        if (!data.length) {
            return void respond("INSUFFICIENT_ARGS");
        } else if (data.length !== 1) {
            console.log('[UNEXPECTED_ARGUMENTS_LENGTH] %s', data.length);
        }

        var msg = data[0].slice(0);

        if (!Array.isArray(msg)) {
            return void respond('INVALID_ARG_FORMAT');
        }

        if (isUnauthenticateMessage(msg)) {
            return handleUnauthenticatedMessage(msg, respond);
        }

        var signature = msg.shift();
        var publicKey = msg.shift();

        // make sure a user object is initialized in the cookie jar
        if (publicKey) {
            beginSession(Sessions, publicKey);
        } else {
            console.log("No public key");
        }

        var cookie = msg[0];
        if (!isValidCookie(Sessions, publicKey, cookie)) {
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
            if (checkSignature(serialized, signature, publicKey) !== true) {
                return void respond("INVALID_SIGNATURE_OR_PUBLIC_KEY");
            }
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
            var cookie = makeCookie(token).join('|');
            respond(e, [cookie].concat(typeof(msg) !== 'undefined' ?msg: []));
        };

        if (typeof(msg) !== 'object' || !msg.length) {
            return void Respond('INVALID_MSG');
        }

        var deny = function () {
            Respond('E_ACCESS_DENIED');
        };

        if (!Env.msgStore) { Env.msgStore = ctx.store; }

        var handleMessage = function (privileged) {
            if (config.logRPC) { console.log(msg[0]); }
        switch (msg[0]) {
            case 'COOKIE': return void Respond(void 0);
            case 'RESET':
                return resetUserPins(Env, safeKey, msg[1], function (e, hash) {
                    //WARN(e, hash);
                    return void Respond(e, hash);
                });
            case 'PIN':
                return pinChannel(Env, safeKey, msg[1], function (e, hash) {
                    WARN(e, hash);
                    Respond(e, hash);
                });
            case 'UNPIN':
                return unpinChannel(Env, safeKey, msg[1], function (e, hash) {
                    WARN(e, hash);
                    Respond(e, hash);
                });
            case 'GET_HASH':
                return void getHash(Env, safeKey, function (e, hash) {
                    WARN(e, hash);
                    Respond(e, hash);
                });
            case 'GET_TOTAL_SIZE': // TODO cache this, since it will get called quite a bit
                return getTotalSize(Env, safeKey, function (e, size) {
                    if (e) {
                        WARN(e, safeKey);
                        return void Respond(e);
                    }
                    Respond(e, size);
                });
            case 'GET_FILE_SIZE':
                return void getFileSize(Env, msg[1], function (e, size) {
                    WARN(e, msg[1]);
                    Respond(e, size);
                });
            case 'UPDATE_LIMITS':
                return void updateLimits(config, safeKey, function (e, limit) {
                    if (e) {
                        WARN(e, limit);
                        return void Respond(e);
                    }
                    Respond(void 0, limit);
                });
            case 'GET_LIMIT':
                return void getLimit(Env, safeKey, function (e, limit) {
                    if (e) {
                        WARN(e, limit);
                        return void Respond(e);
                    }
                    Respond(void 0, limit);
                });
            case 'GET_MULTIPLE_FILE_SIZE':
                return void getMultipleFileSize(Env, msg[1], function (e, dict) {
                    if (e) {
                        WARN(e, dict);
                        return void Respond(e);
                    }
                    Respond(void 0, dict);
                });
            case 'EXPIRE_SESSION':
                return void setTimeout(function () {
                    expireSession(Sessions, safeKey);
                    Respond(void 0, "OK");
                });
            case 'CLEAR_OWNED_CHANNEL':
                return void clearOwnedChannel(Env, msg[1], publicKey, function (e, response) {
                    if (e) { return void Respond(e); }
                    Respond(void 0, response);
                });
            // restricted to privileged users...
            case 'UPLOAD':
                if (!privileged) { return deny(); }
                return void upload(Env, safeKey, msg[1], function (e, len) {
                    WARN(e, len);
                    Respond(e, len);
                });
            case 'UPLOAD_STATUS':
                if (!privileged) { return deny(); }
                var filesize = msg[1];
                return void upload_status(Env, safeKey, msg[1], function (e, yes) {
                    if (!e && !yes) {
                        // no pending uploads, set the new size
                        var user = beginSession(Sessions, safeKey);
                        user.pendingUploadSize = filesize;
                        user.currentUploadSize = 0;
                    }
                    Respond(e, yes);
                });
            case 'UPLOAD_COMPLETE':
                if (!privileged) { return deny(); }
                return void upload_complete(Env, safeKey, function (e, hash) {
                    WARN(e, hash);
                    Respond(e, hash);
                });
            case 'UPLOAD_CANCEL':
                if (!privileged) { return deny(); }
                return void upload_cancel(Env, safeKey, function (e) {
                    WARN(e);
                    Respond(e);
                });
            default:
                return void Respond('UNSUPPORTED_RPC_CALL', msg);
        }
        };

        // reject uploads unless explicitly enabled
        if (config.enableUploads !== true) {
            return void handleMessage(false);
        }

        // allow unrestricted uploads unless restrictUploads is true
        if (config.restrictUploads !== true) {
            return void handleMessage(true);
        }

        // if session has not been authenticated, do so
        var session = beginSession(Sessions, safeKey);
        if (typeof(session.privilege) !== 'boolean') {
            return void isPrivilegedUser(publicKey, function (yes) {
                session.privilege = yes;
                handleMessage(yes);
            });
        }

        // if authenticated, proceed
        handleMessage(session.privilege);
    };

    var updateLimitDaily = function () {
        updateLimits(config, undefined, function (e) {
            if (e) {
                WARN('limitUpdate', e);
            }
        });
    };
    updateLimitDaily();
    setInterval(updateLimitDaily, 24*3600*1000);

    Store.create({
        filePath: pinPath,
    }, function (s) {
        Env.pinStore = s;

        safeMkdir(blobPath, function (e) {
            if (e) { throw e; }
            safeMkdir(blobStagingPath, function (e) {
                if (e) { throw e; }
                cb(void 0, rpc);
                // expire old sessions once per minute
                setInterval(function () {
                    expireSessions(Sessions);
                }, SESSION_EXPIRATION_TIME);
            });
        });
    });
};
