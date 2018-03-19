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
const Pinned = require('./pinned');
const Saferphore = require("saferphore");
const nThen = require("nthen");
const Mkdirp = require("mkdirp");

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
    return chan && chan.length && /^[a-zA-Z0-9=+-]*$/.test(chan) &&
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

var getSession = function (Sessions, key) {
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

    var user = getSession(Sessions, publicKey);
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

    var user = getSession(Sessions, publicKey);
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
    var session = getSession(Env.Sessions, publicKey);

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

    Env.pinStore.getMessages(publicKey, function (msg) {
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
        return cb('INVALID_UPLOAD_ID');
    }

    Fs.stat(path, function (err, stats) {
        if (err) {
            // if a file was deleted, its size is 0 bytes
            if (err.code === 'ENOENT') { return cb(void 0, 0); }
            return void cb(err.code);
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

        return void Env.msgStore.getChannelSize(channel, function (e, size /*:number*/) {
            if (e) {
                if (e.code === 'ENOENT') { return void cb(void 0, 0); }
                return void cb(e.code);
            }
            cb(void 0, size);
        });
    }

    // 'channel' refers to a file, so you need another API
    getUploadSize(Env, channel, function (e, size) {
        if (typeof(size) === 'undefined') { return void cb(e); }
        cb(void 0, size);
    });
};

var getMultipleFileSize = function (Env, channels, cb) {
    if (!Array.isArray(channels)) { return cb('INVALID_PIN_LIST'); }
    if (typeof(Env.msgStore.getChannelSize) !== 'function') {
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

/*  accepts a list, and returns a sublist of channel or file ids which seem
    to have been deleted from the server (file size 0)

    we might consider that we should only say a file is gone if fs.stat returns
    ENOENT, but for now it's simplest to just rely on getFileSize...
*/
var getDeletedPads = function (Env, channels, cb) {
    if (!Array.isArray(channels)) { return cb('INVALID_LIST'); }
    var L = channels.length;

    var sem = Saferphore.create(10);
    var absentees = [];

    var job = function (channel, wait) {
        return function (give) {
            getFileSize(Env, channel, wait(give(function (e, size) {
                if (e) { return; }
                if (size === 0) { absentees.push(channel); }
            })));
        };
    };

    nThen(function (w) {
        for (var i = 0; i < L; i++) {
            sem.take(job(channels[i], w));
        }
    }).nThen(function () {
        cb(void 0, absentees);
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
var updateLimits = function (Env, config, publicKey, cb /*:(?string, ?any[])=>void*/) {
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
        subdomain: config.mySubdomain || null,
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

    // read custom limits from the config
    var customLimits = (function (custom) {
        var limits = {};
        Object.keys(custom).forEach(function (k) {
            k.replace(/\/([^\/]+)$/, function (all, safeKey) {
                var id = unescapeKeyCharacters(safeKey || '');
                limits[id] = custom[k];
                return '';
            });
        });
        return limits;
    }(config.customLimits || {}));

    var isLimit = function (o) {
        var valid = o && typeof(o) === 'object' &&
            typeof(o.limit) === 'number' &&
            typeof(o.plan) === 'string' &&
            typeof(o.note) === 'string';
        return valid;
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
                Env.limits = json;
                Object.keys(customLimits).forEach(function (k) {
                    if (!isLimit(customLimits[k])) { return; }
                    Env.limits[k] = customLimits[k];
                });

                var l;
                if (userId) {
                    var limit = Env.limits[userId];
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
    var limit = Env.limits[unescapedKey];
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
            if (typeof(size) === 'undefined') { return void cb(e); }

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

// inform that the
var loadChannelPins = function (Env) {
    Pinned.load(function (data) {
        Env.pinnedPads = data;
        Env.evPinnedPadsReady.fire();
    });
};
var addPinned = function (
    Env,
    publicKey /*:string*/,
    channelList /*Array<string>*/,
    cb /*:()=>void*/)
{
    Env.evPinnedPadsReady.reg(() => {
        channelList.forEach((c) => {
            const x = Env.pinnedPads[c] = Env.pinnedPads[c] || {};
            x[publicKey] = 1;
        });
        cb();
    });
};
var removePinned = function (
    Env,
    publicKey /*:string*/,
    channelList /*Array<string>*/,
    cb /*:()=>void*/)
{
    Env.evPinnedPadsReady.reg(() => {
        channelList.forEach((c) => {
            const x = Env.pinnedPads[c];
            if (!x) { return; }
            delete x[publicKey];
        });
        cb();
    });
};
var isChannelPinned = function (Env, channel, cb) {
    Env.evPinnedPadsReady.reg(() => {
        if (Env.pinnedPads[channel] && Object.keys(Env.pinnedPads[channel]).length) {
            cb(true);
        } else {
            delete Env.pinnedPads[channel];
            cb(false);
        }
    });
};

var pinChannel = function (Env, publicKey, channels, cb) {
    if (!channels && channels.filter) {
        return void cb('INVALID_PIN_LIST');
    }

    // get channel list ensures your session has a cached channel list
    getChannelList(Env, publicKey, function (pinned) {
        var session = getSession(Env.Sessions, publicKey);

        // only pin channels which are not already pinned
        var toStore = channels.filter(function (channel) {
            return pinned.indexOf(channel) === -1;
        });

        if (toStore.length === 0) {
            return void getHash(Env, publicKey, cb);
        }

        getMultipleFileSize(Env, toStore, function (e, sizes) {
            if (typeof(sizes) === 'undefined') { return void cb(e); }
            var pinSize = sumChannelSizes(sizes);

            getFreeSpace(Env, publicKey, function (e, free) {
                if (typeof(free) === 'undefined') {
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
                    addPinned(Env, publicKey, toStore, () => {});
                    getHash(Env, publicKey, cb);
                });
            });
        });
    });
};

var unpinChannel = function (Env, publicKey, channels, cb) {
    if (!channels && channels.filter) {
        // expected array
        return void cb('INVALID_PIN_LIST');
    }

    getChannelList(Env, publicKey, function (pinned) {
        var session = getSession(Env.Sessions, publicKey);

        // only unpin channels which are pinned
        var toStore = channels.filter(function (channel) {
            return pinned.indexOf(channel) !== -1;
        });

        if (toStore.length === 0) {
            return void getHash(Env, publicKey, cb);
        }

        Env.pinStore.message(publicKey, JSON.stringify(['UNPIN', toStore]),
            function (e) {
            if (e) { return void cb(e); }
            toStore.forEach(function (channel) {
                delete session.channels[channel];
            });
            removePinned(Env, publicKey, toStore, () => {});
            getHash(Env, publicKey, cb);
        });
    });
};

var resetUserPins = function (Env, publicKey, channelList, cb) {
    if (!Array.isArray(channelList)) { return void cb('INVALID_PIN_LIST'); }
    var session = getSession(Env.Sessions, publicKey);

    if (!channelList.length) {
        return void getHash(Env, publicKey, function (e, hash) {
            if (e) { return cb(e); }
            cb(void 0, hash);
        });
    }

    var pins = {};
    getMultipleFileSize(Env, channelList, function (e, sizes) {
        if (typeof(sizes) === 'undefined') { return void cb(e); }
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
            if (pinSize > limit[0] && session.hasPinned) { return void(cb('E_OVER_LIMIT')); }
            Env.pinStore.message(publicKey, JSON.stringify(['RESET', channelList]),
                function (e) {
                if (e) { return void cb(e); }
                channelList.forEach(function (channel) {
                    pins[channel] = true;
                });

                var oldChannels = Object.keys(session.channels);
                removePinned(Env, publicKey, oldChannels, () => {
                    addPinned(Env, publicKey, channelList, ()=>{});
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
    // flow wants the mkdir call w/ 3 args, 0o777 is default for a directory.
    Fs.mkdir(path, 0o777, function (e) {
        if (!e || e.code === 'EEXIST') { return void cb(); }
        cb(e);
    });
};

var makeFileStream = function (root, id, cb) {
    var stub = id.slice(0, 2);
    var full = makeFilePath(root, id);
    if (!full) {
        WARN('makeFileStream', 'invalid id ' + id);
        return void cb('BAD_ID');
    }
    safeMkdir(Path.join(root, stub), function (e) {
        if (e || !full) { // !full for pleasing flow, it's already checked
            WARN('makeFileStream', e);
            return void cb(e ? e.message : 'INTERNAL_ERROR');
        }

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
        // Confirm that the channel is owned by the user in question
        if (metadata.owners.indexOf(unsafeKey) === -1) {
            return void cb('INSUFFICIENT_PERMISSIONS');
        }

        return void Env.msgStore.clearChannel(channelId, function (e) {
            cb(e);
        });
    });
};

var removeOwnedChannel = function (Env, channelId, unsafeKey, cb) {
    if (typeof(channelId) !== 'string' || channelId.length !== 32) {
        return cb('INVALID_ARGUMENTS');
    }

    if (!(Env.msgStore && Env.msgStore.removeChannel && Env.msgStore.getChannelMetadata)) {
        return cb("E_NOT_IMPLEMENTED");
    }

    Env.msgStore.getChannelMetadata(channelId, function (e, metadata) {
        if (e) { return cb(e); }
        if (!(metadata && Array.isArray(metadata.owners))) { return void cb('E_NO_OWNERS'); }
        if (metadata.owners.indexOf(unsafeKey) === -1) {
            return void cb('INSUFFICIENT_PERMISSIONS');
        }
        return void Env.msgStore.removeChannel(channelId, function (e) {
            cb(e);
        });
    });
};

var upload = function (Env, publicKey, content, cb) {
    var paths = Env.paths;
    var dec;
    try { dec = Buffer.from(content, 'base64'); }
    catch (e) { return void cb('DECODE_BUFFER'); }
    var len = dec.length;

    var session = getSession(Env.Sessions, publicKey);

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
            if (!stream) { return void cb(e); }

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

    var session = getSession(Env.Sessions, publicKey);
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
    var session = getSession(Env.Sessions, publicKey);

    if (session.blobstage && session.blobstage.close) {
        session.blobstage.close();
        delete session.blobstage;
    }

    var oldPath = makeFilePath(paths.staging, publicKey);
    if (!oldPath) {
        WARN('safeMkdir', "oldPath is null");
        return void cb('RENAME_ERR');
    }

    var tryRandomLocation = function (cb) {
        var id = createFileId();
        var prefix = id.slice(0, 2);
        var newPath = makeFilePath(paths.blob, id);
        if (typeof(newPath) !== 'string') {
            WARN('safeMkdir', "newPath is null");
            return void cb('RENAME_ERR');
        }

        safeMkdir(Path.join(paths.blob, prefix), function (e) {
            if (e || !newPath) {
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
        if (e || !oldPath || !newPath) {
            if (retries--) {
                setTimeout(function () {
                    return tryRandomLocation(handleMove);
                }, 750);
            } else {
                cb(e);
            }
            return;
        }

        // lol wut handle ur errors
        Fs.rename(oldPath, newPath, function (e) {
            if (e) {
                WARN('rename', e);

                if (retries--) {
                    return void setTimeout(function () {
                        tryRandomLocation(handleMove);
                    }, 750);
                }

                return void cb('RENAME_ERR');
            }
            cb(void 0, id);
        });
    };

    tryRandomLocation(handleMove);
};

var owned_upload_complete = function (Env, safeKey, cb) {
    var session = getSession(Env.Sessions, safeKey);

    // the file has already been uploaded to the staging area
    // close the pending writestream
    if (session.blobstage && session.blobstage.close) {
        session.blobstage.close();
        delete session.blobstage;
    }

    var oldPath = makeFilePath(Env.paths.staging, safeKey);
    if (typeof(oldPath) !== 'string') {
        return void cb('EINVAL_CONFIG');
    }

    // construct relevant paths
    var root = Env.paths.staging;

    //var safeKey = escapeKeyCharacters(safeKey);
    var safeKeyPrefix = safeKey.slice(0, 2);

    var blobId = createFileId();
    var blobIdPrefix = blobId.slice(0, 2);

    var plannedPath = Path.join(root, safeKeyPrefix, safeKey, blobIdPrefix);

    var tries = 0;

    var chooseSafeId = function (cb) {
        if (tries >= 3) {
            // you've already failed three times in a row
            // give up and return an error
            cb('E_REPEATED_FAILURE');
        }

        var path = Path.join(plannedPath, blobId);
        Fs.access(path, Fs.constants.R_OK | Fs.constants.W_OK, function (e) {
            if (!e) {
                // generate a new id (with the same prefix) and recurse
                blobId = blobIdPrefix + createFileId().slice(2);
                return void chooseSafeId(cb);
            } else if (e.code === 'ENOENT') {
                // no entry, so it's safe for us to proceed
                return void cb(void 0, path);
            } else {
                // it failed in an unexpected way. log it
                // try again, but no more than a fixed number of times...
                tries++;
                chooseSafeId(cb);
            }
        });
    };

    // the user wants to move it into their own space
    // /blob/safeKeyPrefix/safeKey/blobPrefix/blobID

    var finalPath;
    nThen(function (w) {
        // make the requisite directory structure using Mkdirp
        Mkdirp(plannedPath, w(function (e /*, path */) {
            if (e) { // does not throw error if the directory already existed
                w.abort();
                return void cb(e); // XXX do we export Errors or strings?
            }
        }));
    }).nThen(function (w) {
        // produce an id which confirmably does not collide with another
        chooseSafeId(w(function (e, path) {
            if (e) {
                w.abort();
                return void cb(e);
            }
            finalPath = path; // this is where you'll put the new file
        }));
    }).nThen(function (w) {
        // move the existing file to its new path

        // flow is dumb and I need to guard against this which will never happen
        /*:: if (typeof(oldPath) === 'object') { throw new Error('should never happen'); } */
        Fs.rename(oldPath /* XXX */, finalPath, w(function (e) {
            if (e) {
                w.abort();
                return void cb(e.code);
            }
            // otherwise it worked...
        }));
    }).nThen(function () {
        // clean up their session when you're done
        // call back with the blob id...
        cb(void 0, blobId);
    });
};

var upload_status = function (Env, publicKey, filesize, cb) {
    var paths = Env.paths;

    // validate that the provided size is actually a positive number
    if (typeof(filesize) !== 'number' &&
        filesize >= 0) { return void cb('E_INVALID_SIZE'); }

    if (filesize >= Env.maxUploadSize) { return cb('TOO_LARGE'); }
    // validate that the provided path is not junk
    var filePath = makeFilePath(paths.staging, publicKey);
    if (!filePath) { return void cb('E_INVALID_PATH'); }

    getFreeSpace(Env, publicKey, function (e, free) {
        if (e || !filePath) { return void cb(e); } // !filePath for pleasing flow
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

var isNewChannel = function (Env, channel, cb) {
    if (!isValidId(channel)) { return void cb('INVALID_CHAN'); }
    if (channel.length !== 32) { return void cb('INVALID_CHAN'); }

    var count = 0;
    var done = false;
    Env.msgStore.getMessages(channel, function (msg) {
        if (done) { return; }
        var parsed;
        try {
            parsed = JSON.parse(msg);
            if (parsed && typeof(parsed) === 'object') { count++; }
            if (count >= 2) {
                done = true;
                cb(void 0, false); // it is not a new file
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

var isUnauthenticatedCall = function (call) {
    return [
        'GET_FILE_SIZE',
        'GET_MULTIPLE_FILE_SIZE',
        'IS_CHANNEL_PINNED',
        'IS_NEW_CHANNEL',
        'GET_HISTORY_OFFSET',
        'GET_DELETED_PADS',
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
        'CLEAR_OWNED_CHANNEL',
        'REMOVE_OWNED_CHANNEL',
    ].indexOf(call) !== -1;
};

const mkEvent = function (once) {
    var handlers = [];
    var fired = false;
    return {
        reg: function (cb) {
            if (once && fired) { return void setTimeout(cb); }
            handlers.push(cb);
        },
        unreg: function (cb) {
            if (handlers.indexOf(cb) === -1) { throw new Error("Not registered"); }
            handlers.splice(handlers.indexOf(cb), 1);
        },
        fire: function () {
            if (once && fired) { return; }
            fired = true;
            var args = Array.prototype.slice.call(arguments);
            handlers.forEach(function (h) { h.apply(null, args); });
        }
    };
};

/*::
const flow_Config = require('./config.example.js');
type Config_t = typeof(flow_Config);
import type { ChainPadServer_Storage_t } from './storage/file.js'
type NetfluxWebsocketSrvContext_t = {
    store: ChainPadServer_Storage_t,
    getHistoryOffset: (
        ctx: NetfluxWebsocketSrvContext_t,
        channelName: string,
        lastKnownHash: ?string,
        cb: (err: ?Error, offset: ?number)=>void
    )=>void
};
*/
RPC.create = function (
    config /*:Config_t*/,
    debuggable /*:<T>(string, T)=>T*/,
    cb /*:(?Error, ?Function)=>void*/
) {
    // load pin-store...
    console.log('loading rpc module...');

    if (config.suppressRPCErrors) { SUPPRESS_RPC_ERRORS = true; }

    var keyOrDefaultString = function (key, def) {
        return typeof(config[key]) === 'string'? config[key]: def;
    };

    var Env = {
        defaultStorageLimit: config.defaultStorageLimit,
        maxUploadSize: config.maxUploadSize || (20 * 1024 * 1024),
        Sessions: {},
        paths: {},
        msgStore: (undefined /*:any*/),
        pinStore: (undefined /*:any*/),
        pinnedPads: {},
        evPinnedPadsReady: mkEvent(true),
        limits: {}
    };
    debuggable('rpc_env', Env);

    var Sessions = Env.Sessions;
    var paths = Env.paths;
    var pinPath = paths.pin = keyOrDefaultString('pinPath', './pins');
    var blobPath = paths.blob = keyOrDefaultString('blobPath', './blob');
    var blobStagingPath = paths.staging = keyOrDefaultString('blobStagingPath', './blobstage');

    var isUnauthenticateMessage = function (msg) {
        return msg && msg.length === 2 && isUnauthenticatedCall(msg[0]);
    };

    var handleUnauthenticatedMessage = function (msg, respond, nfwssCtx) {
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
            case 'GET_DELETED_PADS':
                return void getDeletedPads(Env, msg[1], function (e, list) {
                    if (e) {
                        WARN(e, msg[1]);
                        return respond(e);
                    }
                    respond(e, [null, list, null]);
                });
            case 'IS_CHANNEL_PINNED':
                return void isChannelPinned(Env, msg[1], function (isPinned) {
                    respond(null, [null, isPinned, null]);
                });
            case 'IS_NEW_CHANNEL':
                return void isNewChannel(Env, msg[1], function (e, isNew) {
                    respond(e, [null, isNew, null]);
                });
            default:
                console.error("unsupported!");
                return respond('UNSUPPORTED_RPC_CALL', msg);
        }
    };

    var rpc0 = function (ctx, data, respond) {
        if (!Env.msgStore) { Env.msgStore = ctx.store; }

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
            return handleUnauthenticatedMessage(msg, respond, ctx);
        }

        var signature = msg.shift();
        var publicKey = msg.shift();

        // make sure a user object is initialized in the cookie jar
        if (publicKey) {
            getSession(Sessions, publicKey);
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
        } else if (msg[1] !== 'UPLOAD') {
            console.error("INVALID_RPC CALL:", msg[1]);
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
            var cookie = makeCookie(token).join('|');
            respond(e, [cookie].concat(typeof(msg) !== 'undefined' ?msg: []));
        };

        if (typeof(msg) !== 'object' || !msg.length) {
            return void Respond('INVALID_MSG');
        }

        var deny = function () {
            Respond('E_ACCESS_DENIED');
        };

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
                return void updateLimits(Env, config, safeKey, function (e, limit) {
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

            case 'REMOVE_OWNED_CHANNEL':
                return void removeOwnedChannel(Env, msg[1], publicKey, function (e) {
                    if (e) { return void Respond(e); }
                    Respond(void 0, "OK");
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
                        var user = getSession(Sessions, safeKey);
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
            case 'OWNED_UPLOAD_COMPLETE':
                if (!privileged) { return deny(); }
                return void owned_upload_complete(Env, safeKey, function (e, blobId) {
                    WARN(e, blobId);
                    Respond(e, blobId);
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
        var session = getSession(Sessions, safeKey);
        if (typeof(session.privilege) !== 'boolean') {
            return void isPrivilegedUser(publicKey, function (yes) {
                session.privilege = yes;
                handleMessage(yes);
            });
        }

        // if authenticated, proceed
        handleMessage(session.privilege);
    };

    var rpc = function (
        ctx /*:NetfluxWebsocketSrvContext_t*/,
        data /*:Array<Array<any>>*/,
        respond /*:(?string, ?Array<any>)=>void*/)
    {
        try {
            return rpc0(ctx, data, respond);
        } catch (e) {
            console.log("Error from RPC with data " + JSON.stringify(data));
            console.log(e.stack);
        }
    };

    var updateLimitDaily = function () {
        updateLimits(Env, config, undefined, function (e) {
            if (e) {
                WARN('limitUpdate', e);
            }
        });
    };
    updateLimitDaily();
    setInterval(updateLimitDaily, 24*3600*1000);

    loadChannelPins(Env);

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
