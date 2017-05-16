/*@flow*/
/*  Use Nacl for checking signatures of messages */
var Nacl = require("tweetnacl");

/* globals Buffer*/
/* globals process */

var Fs = require("fs");
var Path = require("path");
var Https = require("https");

var RPC = module.exports;

var Store = require("./storage/file");

var DEFAULT_LIMIT = 50 * 1024 * 1024;

var isValidId = function (chan) {
    return /^[a-fA-F0-9]/.test(chan) ||
        [32, 48].indexOf(chan.length) !== -1;
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
    return key.replace(/\//g, '-');
};

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

var expireSessions = function (Sessions) {
    var now = +new Date();
    Object.keys(Sessions).forEach(function (key) {
        var session = Sessions[key];
        if (isTooOld(Sessions[key].atime, now)) {
            if (session.blobstage) {
                session.blobstage.close();
            }
            delete Sessions[key];
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

var loadUserPins = function (store, Sessions, publicKey, cb) {
    var session = beginSession(Sessions, publicKey);

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

    store.getMessages(publicKey, function (msg) {
        // handle messages...
        var parsed;
        try {
            parsed = JSON.parse(msg);

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
                    console.error('invalid message read from store');
            }
        } catch (e) {
            console.log('invalid message read from store');
            console.error(e);
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

var getChannelList = function (store, Sessions, publicKey, cb) {
    loadUserPins(store, Sessions, publicKey, function (pins) {
        cb(truthyKeys(pins));
    });
};

var makeFilePath = function (root, id) {
    if (typeof(id) !== 'string' || id.length <= 2) { return null; }
    return Path.join(root, id.slice(0, 2), id);
};

var getUploadSize = function (paths, channel, cb) {
    var path = makeFilePath(paths.blob, channel);
    if (!path) {
        return cb('INVALID_UPLOAD_ID');
    }

    Fs.stat(path, function (err, stats) {
        if (err) { return void cb(err); }
        cb(void 0, stats.size);
    });
};

var getFileSize = function (paths, msgStore, channel, cb) {
    if (!isValidId(channel)) { return void cb('INVALID_CHAN'); }

    if (channel.length === 32) {
        if (typeof(msgStore.getChannelSize) !== 'function') {
            return cb('GET_CHANNEL_SIZE_UNSUPPORTED');
        }

        return void msgStore.getChannelSize(channel, function (e, size) {
            if (e) { return void cb(e.code); }
            cb(void 0, size);
        });
    }

    // 'channel' refers to a file, so you need anoter API
    getUploadSize(paths, channel, function (e, size) {
        if (e) { return void cb(e); }
        cb(void 0, size);
    });
};

var getMultipleFileSize = function (paths, msgStore, channels, cb) {
    if (!Array.isArray(channels)) { return cb('INVALID_LIST'); }
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
        getFileSize(paths, msgStore, channel, function (e, size) {
            if (e) {
                console.error(e);
                counts[channel] = -1;
                return done();
            }
            counts[channel] = size;
            done();
        });
    });
};

var getTotalSize = function (paths, pinStore, msgStore, Sessions, publicKey, cb) {
    var bytes = 0;

    return void getChannelList(pinStore, Sessions, publicKey, function (channels) {
        if (!channels) { cb('NO_ARRAY'); } // unexpected

        var count = channels.length;
        if (!count) { cb(void 0, 0); }

        channels.forEach(function (channel) {
            getFileSize(paths, msgStore, channel, function (e, size) {
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

var getHash = function (store, Sessions, publicKey, cb) {
    getChannelList(store, Sessions, publicKey, function (channels) {
        cb(void 0, hashChannelList(channels));
    });
};

// TODO check if new pinned size exceeds user quota
var pinChannel = function (pinStore, Sessions, publicKey, channels, cb) {
    if (!channels && channels.filter) {
        // expected array
        return void cb('[TYPE_ERROR] pin expects channel list argument');
    }

    getChannelList(pinStore, Sessions, publicKey, function (pinned) {
        var session = beginSession(Sessions, publicKey);

        // only pin channels which are not already pinned
        var toStore = channels.filter(function (channel) {
            return pinned.indexOf(channel) === -1;
        });

        if (toStore.length === 0) {
            return void getHash(pinStore, Sessions, publicKey, cb);
        }

        pinStore.message(publicKey, JSON.stringify(['PIN', toStore]),
            function (e) {
            if (e) { return void cb(e); }
            toStore.forEach(function (channel) {
                session.channels[channel] = true;
            });
            getHash(pinStore, Sessions, publicKey, cb);
        });
    });
};

var unpinChannel = function (pinStore, Sessions, publicKey, channels, cb) {
    if (!channels && channels.filter) {
        // expected array
        return void cb('[TYPE_ERROR] unpin expects channel list argument');
    }

    getChannelList(pinStore, Sessions, publicKey, function (pinned) {
        var session = beginSession(Sessions, publicKey);

        // only unpin channels which are pinned
        var toStore = channels.filter(function (channel) {
            return pinned.indexOf(channel) !== -1;
        });

        if (toStore.length === 0) {
            return void getHash(pinStore, Sessions, publicKey, cb);
        }

        pinStore.message(publicKey, JSON.stringify(['UNPIN', toStore]),
            function (e) {
            if (e) { return void cb(e); }
            toStore.forEach(function (channel) {
                delete session.channels[channel];
            });

            getHash(pinStore, Sessions, publicKey, cb);
        });
    });
};

// TODO check if new pinned size exceeds user quota
var resetUserPins = function (pinStore, Sessions, publicKey, channelList, cb) {
    var session = beginSession(Sessions, publicKey);

    var pins = session.channels = {};

    pinStore.message(publicKey, JSON.stringify(['RESET', channelList]),
        function (e) {
        if (e) { return void cb(e); }
        channelList.forEach(function (channel) {
            pins[channel] = true;
        });

        getHash(pinStore, Sessions, publicKey, function (e, hash) {
            cb(e, hash);
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

// The limits object contains storage limits for all the publicKey that have paid
// To each key is associated an object containing the 'limit' value and a 'note' explaining that limit
var limits = {};
var updateLimits = function (config, publicKey, cb) {
    if (typeof cb !== "function") { cb = function () {}; }

    var body = JSON.stringify({
        domain: config.domain,
        subdomain: config.subdomain
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
                if (publicKey) {
                    var limit = limits[publicKey];
                    l = limit && typeof limit.limit === "number" ?
                            [limit.limit, limit.plan] : [DEFAULT_LIMIT, ''];
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

var getLimit = function (publicKey, cb) {
    var unescapedKey = escapeKeyCharacters(publicKey);
    var limit = limits[unescapedKey];

    var toSend = limit && typeof(limit.limit) === "number"?
        [limit.limit, limit.plan] : [DEFAULT_LIMIT, ''];

    cb(void 0, toSend);
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
            });
            stream.on('open', function () {
                cb(void 0, stream);
            });
        } catch (err) {
            cb('BAD_STREAM');
        }
    });
};

var upload = function (paths, Sessions, publicKey, content, cb) {
    var dec = new Buffer(Nacl.util.decodeBase64(content)); // jshint ignore:line
    var len = dec.length;

    var session = beginSession(Sessions, publicKey);

    if (typeof(session.currentUploadSize) !== 'number') {
        // improperly initialized... maybe they didn't check before uploading?
        // reject it, just in case
        return cb('NOT_READY');
    }

    if (session.currentUploadSize > session.pendingUploadSize) {
        return cb('TOO_LARGE');
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

var upload_cancel = function (paths, Sessions, publicKey, cb) {
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

var upload_complete = function (paths, Sessions, publicKey, cb) {
    var session = beginSession(Sessions, publicKey);

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
                console.error(e);
                return void cb('RENAME_ERR');
            }
            isFile(newPath, function (e, yes) {
                if (e) {
                    console.error(e);
                    return void cb(e);
                }
                if (yes) {
                    return void tryRandomLocation(cb);
                }

                cb(void 0, newPath, id);
            });
        });
    };

    tryRandomLocation(function (e, newPath, id) {
        Fs.rename(oldPath, newPath, function (e) {
            if (e) {
                console.error(e);
                return cb(e);
            }
            cb(void 0, id);
        });
    });
};

var upload_status = function (paths, pinStore, msgStore, Sessions, publicKey, filesize, cb) {
    // validate that the provided size is actually a positive number
    if (typeof(filesize) !== 'number' &&
        filesize >= 0) { return void cb('E_INVALID_SIZE'); }

    // validate that the provided path is not junk
    var filePath = makeFilePath(paths.staging, publicKey);
    if (!filePath) { return void cb('E_INVALID_PATH'); }

    getLimit(publicKey, function (e, limit) {
        if (e) { return void cb(e); }
        getTotalSize(paths, pinStore, msgStore, Sessions, publicKey, function (e, size) {
            if ((filesize + size) >= limit) { return cb('TOO_LARGE'); }
            isFile(filePath, function (e, yes) {
                if (e) {
                    console.error("uploadError: [%s]", e);
                    return cb('UNNOWN_ERROR');
                }
                cb(e, yes);
            });
        });
    });
};

/*::const ConfigType = require('./config.example.js');*/
RPC.create = function (config /*:typeof(ConfigType)*/, cb /*:(?Error, ?Function)=>void*/) {
    // load pin-store...
    console.log('loading rpc module...');

    var Sessions = {};

    var keyOrDefaultString = function (key, def) {
        return typeof(config[key]) === 'string'? config[key]: def;
    };

    var paths = {};
    var pinPath = paths.pin = keyOrDefaultString('pinPath', './pins');
    var blobPath = paths.blob = keyOrDefaultString('blobPath', './blob');
    var blobStagingPath = paths.staging = keyOrDefaultString('blobStagingPath', './blobstage');

    var pinStore;

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

        var signature = msg.shift();
        var publicKey = msg.shift();

        // make sure a user object is initialized in the cookie jar
        beginSession(Sessions, publicKey);

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

        if (checkSignature(serialized, signature, publicKey) !== true) {
            return void respond("INVALID_SIGNATURE_OR_PUBLIC_KEY");
        }

        var safeKey = escapeKeyCharacters(publicKey);
        /*  If you have gotten this far, you have signed the message with the
            public key which you provided.

            We can safely modify the state for that key
        */

        // discard validated cookie from message
        msg.shift();

        var Respond = function (e, msg) {
            var token = Sessions[safeKey].tokens.slice(-1)[0];
            var cookie = makeCookie(token).join('|');
            respond(e, [cookie].concat(typeof(msg) !== 'undefined' ?msg: []));
        };

        if (typeof(msg) !== 'object' || !msg.length) {
            return void Respond('INVALID_MSG');
        }

        var deny = function () {
            Respond('E_ACCESS_DENIED');
        };

        var msgStore = ctx.store;

        var handleMessage = function (privileged) {
        switch (msg[0]) {
            case 'COOKIE': return void Respond(void 0);
            case 'RESET':
                return resetUserPins(pinStore, Sessions, safeKey, msg[1], function (e, hash) {
                    return void Respond(e, hash);
                });
            case 'PIN': // TODO don't pin if over the limit
                // if over, send error E_OVER_LIMIT
                return pinChannel(pinStore, Sessions, safeKey, msg[1], function (e, hash) {
                    Respond(e, hash);
                });
            case 'UNPIN':
                return unpinChannel(pinStore, Sessions, safeKey, msg[1], function (e, hash) {
                    Respond(e, hash);
                });
            case 'GET_HASH':
                return void getHash(pinStore, Sessions, safeKey, function (e, hash) {
                    Respond(e, hash);
                });
            case 'GET_TOTAL_SIZE': // TODO cache this, since it will get called quite a bit
                return getTotalSize(paths, pinStore, msgStore, Sessions, safeKey, function (e, size) {
                    if (e) { return void Respond(e); }
                    Respond(e, size);
                });
            case 'GET_FILE_SIZE':
                return void getFileSize(paths, msgStore, msg[1], Respond);
            case 'UPDATE_LIMITS':
                return void updateLimits(config, safeKey, function (e, limit) {
                    if (e) { return void Respond(e); }
                    Respond(void 0, limit);
                });
            case 'GET_LIMIT':
                return void getLimit(safeKey, function (e, limit) {
                    if (e) { return void Respond(e); }
                    Respond(void 0, limit);
                });
            case 'GET_MULTIPLE_FILE_SIZE':
                return void getMultipleFileSize(paths, msgStore, msg[1], function (e, dict) {
                    if (e) { return void Respond(e); }
                    Respond(void 0, dict);
                });

            // restricted to privileged users...
            case 'UPLOAD':
                if (!privileged) { return deny(); }
                return void upload(paths, Sessions, safeKey, msg[1], function (e, len) {
                    Respond(e, len);
                });
            case 'UPLOAD_STATUS':
                if (!privileged) { return deny(); }
                var filesize = msg[1];
                return void upload_status(paths, pinStore, msgStore, Sessions, safeKey, msg[1], function (e, yes) {
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
                return void upload_complete(paths, Sessions, safeKey, function (e, hash) {
                    Respond(e, hash);
                });
            case 'UPLOAD_CANCEL':
                if (!privileged) { return deny(); }
                return void upload_cancel(paths, Sessions, safeKey, function (e) {
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

        // restrict upload capability unless explicitly disabled
        if (config.restrictUploads === false) {
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
            if (e) { console.error('Error updating the storage limits', e); }
        });
    };
    updateLimitDaily();
    setInterval(updateLimitDaily, 24*3600*1000);

    Store.create({
        filePath: pinPath,
    }, function (s) {
        pinStore = s;

        safeMkdir(blobPath, function (e) {
            if (e) { throw e; }
            safeMkdir(blobStagingPath, function (e) {
                if (e) { throw e; }
                cb(void 0, rpc);
                // expire old sessions once per minute
                setInterval(function () {
                    expireSessions(Sessions);
                }, 60000);
            });
        });
    });
};
