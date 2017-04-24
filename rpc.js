/*  Use Nacl for checking signatures of messages */
var Nacl = require("tweetnacl");

var RPC = module.exports;

var Store = require("./storage/file");

var isValidChannel = function (chan) {
    return /^[a-fA-F0-9]/.test(chan);
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
        process.pid, // jshint ignore:line
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

var beginSession = function (Sessions, key) {
    if (Sessions[key]) {
        Sessions[key].atime = +new Date();
        return Sessions[key];
    }
    var user = Sessions[key] = {};
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
        if (isTooOld(Sessions[key].atime, now)) {
            delete Sessions[key];
        }
    });
};

var addTokenForKey = function (Sessions, publicKey, token) {
    if (!Sessions[publicKey]) { throw new Error('undefined user'); }

    var user = Sessions[publicKey];
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
    if (process.pid !== parsed.pid) { // jshint ignore:line
        return false;
    }

    var user = Sessions[publicKey];
    if (!user) { return false; }

    var idx = user.tokens.indexOf(parsed.seq);
    if (idx === -1) { return false; }

    var next;
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

var getFileSize = function (store, channel, cb) {
    if (!isValidChannel(channel)) { return void cb('INVALID_CHAN'); }
    if (typeof(store.getChannelSize) !== 'function') {
        return cb('GET_CHANNEL_SIZE_UNSUPPORTED');
    }

    return void store.getChannelSize(channel, function (e, size) {
        if (e) { return void cb(e.code); }
        cb(void 0, size);
    });
};

var getMultipleFileSize = function (store, channels, cb) {

    if (!Array.isArray(channels)) { return cb('INVALID_LIST'); }
    if (typeof(store.getChannelSize) !== 'function') {
        return cb('GET_CHANNEL_SIZE_UNSUPPORTED');
    }

    var i = channels.length;
    var counts = {};

    var done = function () {
        i--;
        if (i === 0) { return cb(void 0, counts); }
    };

    channels.forEach(function (channel) {
        if (!isValidChannel(channel)) {
            counts[channel] = -1;
            return done();
        }
        store.getChannelSize(channel, function (e, size) {
            if (e) {
                counts[channel] = -1;
                return done();
            }

            counts[channel] = size;
            done();
        });
    });
};

var getTotalSize = function (pinStore, messageStore, Sessions, publicKey, cb) {
    var bytes = 0;

    return void getChannelList(pinStore, Sessions, publicKey, function (channels) {
        if (!channels) { cb('NO_ARRAY'); } // unexpected

        var count = channels.length;
        if (!count) { cb(void 0, 0); }

        channels.forEach(function (channel) {
            return messageStore.getChannelSize(channel, function (e, size) {
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

var storeMessage = function (store, publicKey, msg, cb) {
    store.message(publicKey, JSON.stringify(msg), cb);
};

var pinChannel = function (store, Sessions, publicKey, channels, cb) {
    if (!channels && channels.filter) {
        // expected array
        return void cb('[TYPE_ERROR] pin expects channel list argument');
    }

    getChannelList(store, Sessions, publicKey, function (pinned) {
        var session = beginSession(Sessions, publicKey);

        // only pin channels which are not already pinned
        var toStore = channels.filter(function (channel) {
            return pinned.indexOf(channel) === -1;
        });

        if (toStore.length === 0) {
            return void getHash(store, Sessions, publicKey, cb);
        }

        store.message(publicKey, JSON.stringify(['PIN', toStore]),
            function (e) {
            if (e) { return void cb(e); }
            toStore.forEach(function (channel) {
                session.channels[channel] = true;
            });
            getHash(store, Sessions, publicKey, cb);
        });
    });
};

var unpinChannel = function (store, Sessions, publicKey, channels, cb) {
    if (!channels && channels.filter) {
        // expected array
        return void cb('[TYPE_ERROR] unpin expects channel list argument');
    }

    getChannelList(store, Sessions, publicKey, function (pinned) {
        var session = beginSession(Sessions, publicKey);

        // only unpin channels which are pinned
        var toStore = channels.filter(function (channel) {
            return pinned.indexOf(channel) !== -1;
        });

        if (toStore.length === 0) {
            return void getHash(store, Sessions, publicKey, cb);
        }

        store.message(publicKey, JSON.stringify(['UNPIN', toStore]),
            function (e) {
            if (e) { return void cb(e); }
            toStore.forEach(function (channel) {
                // TODO actually delete
                session.channels[channel] = false;
            });

            getHash(store, Sessions, publicKey, cb);
        });
    });
};

var resetUserPins = function (store, Sessions, publicKey, channelList, cb) {
    var session = beginSession(Sessions, publicKey);

    var pins = session.channels = {};

    store.message(publicKey, JSON.stringify(['RESET', channelList]),
        function (e) {
        if (e) { return void cb(e); }
        channelList.forEach(function (channel) {
            pins[channel] = true;
        });

        getHash(store, Sessions, publicKey, function (e, hash) {
            cb(e, hash);
        });
    });
};

RPC.create = function (config, cb) {
    // load pin-store...

    console.log('loading rpc module...');

    var Sessions = {};

    var store;

    var rpc = function (ctx, data, respond) {
        if (!data.length) {
            return void respond("INSUFFICIENT_ARGS");
        } else if (data.length !== 1) {
            console.log(data.length);
        }

        var msg = data[0].slice(0);

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

        var safeKey = publicKey.replace(/\//g, '-');
        /*  If you have gotten this far, you have signed the message with the
            public key which you provided.

            We can safely modify the state for that key
        */

        // discard validated cookie from message
        msg.shift();

        var Respond = function (e, msg) {
            var token = Sessions[publicKey].tokens.slice(-1)[0];
            var cookie = makeCookie(token).join('|');
            respond(e, [cookie].concat(msg||[]));
        };

        if (typeof(msg) !== 'object' || !msg.length) {
            return void Respond('INVALID_MSG');
        }

        switch (msg[0]) {
            case 'COOKIE': return void Respond(void 0);
            case 'RESET':
                return resetUserPins(store, Sessions, safeKey, msg[1], function (e, hash) {
                    return void Respond(e, hash);
                });
            case 'PIN':
                return pinChannel(store, Sessions, safeKey, msg[1], function (e, hash) {
                    Respond(e, hash);
                });
            case 'UNPIN':
                return unpinChannel(store, Sessions, safeKey, msg[1], function (e, hash) {
                    Respond(e, hash);
                });
            case 'GET_HASH':
                return void getHash(store, Sessions, safeKey, function (e, hash) {
                    Respond(e, hash);
                });
            case 'GET_TOTAL_SIZE':
                return getTotalSize(store, ctx.store, Sessions, safeKey, function (e, size) {
                    if (e) { return void Respond(e); }
                    Respond(e, size);
                });
            case 'GET_FILE_SIZE':
                return void getFileSize(ctx.store, msg[1], Respond);
            case 'GET_MULTIPLE_FILE_SIZE':
                return void getMultipleFileSize(ctx.store, msg[1], function (e, dict) {
                    if (e) { return void Respond(e); }
                    Respond(void 0, dict);
                });
            default:
                return void Respond('UNSUPPORTED_RPC_CALL', msg);
        }
    };

    Store.create({
        filePath: './pins'
    }, function (s) {
        store = s;
        cb(void 0, rpc);

        // expire old sessions once per minute
        setInterval(function () {
            expireSessions(Sessions);
        }, 60000);
    });
};

