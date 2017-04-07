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

var addTokenForKey = function (Cookies, publicKey, token) {
    if (!Cookies[publicKey]) { throw new Error('undefined user'); }

    var user = Cookies[publicKey];
    user.tokens.push(token);
    user.atime = +new Date();
    if (user.tokens.length > 2) { user.tokens.shift(); }
};

var isTooOld = function (time, now) {
    return (now - time) > 300000;
};

var isValidCookie = function (Cookies, publicKey, cookie) {
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

    var user = Cookies[publicKey];
    if (!user) { return false; }

    var idx = user.tokens.indexOf(parsed.seq);
    if (idx === -1) { return false; }

    var next;
    if (idx > 0) {
        // make a new token
        addTokenForKey(Cookies, publicKey, makeToken());
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

var getChannelList = function (store, publicKey, cb) {
    // to accumulate pinned channels
    var pins = {};

    store.getMessages(publicKey, function (msg) {
        // handle messages...
        var parsed;
        try {
            parsed = JSON.parse(msg);

            switch (parsed[0]) {
                case 'PIN':
                    pins[parsed[1]] = true;
                    break;
                case 'UNPIN':
                    pins[parsed[1]] = false;
                    break;
                case 'RESET':
                    Object.keys(pins).forEach(function (pin) {
                        pins[pin] = false;
                    });
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
        var pinned = Object.keys(pins).filter(function (pin) {
            return pins[pin];
        });

        cb(pinned);
    });
};

var getFileSize = function (store, channel, cb) {
    if (!isValidChannel(channel)) { return void cb('INVALID_CHAN'); }

    return void store.getChannelSize(channel, function (e, size) {
        if (e) { return void cb(e.code); }
        cb(void 0, size);
    });
};

var getTotalSize = function (pinStore, messageStore, publicKey, cb) {
    var bytes = 0;

    return void getChannelList(pinStore, publicKey, function (channels) {
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

var getHash = function (store, publicKey, cb) {
    getChannelList(store, publicKey, function (channels) {
        cb(void 0, hashChannelList(channels));
    });
};

var storeMessage = function (store, publicKey, msg, cb) {
    store.message(publicKey, JSON.stringify(msg), cb);
};

var pinChannel = function (store, publicKey, channel, cb) {
    store.message(publicKey, JSON.stringify(['PIN', channel]),
        function (e) {
        if (e) { return void cb(e); }

        getHash(store, publicKey, function (e, hash) {
            cb(e, hash);
        });
    });
};

var unpinChannel = function (store, publicKey, channel, cb) {
    store.message(publicKey, JSON.stringify(['UNPIN', channel]),
        function (e) {
        if (e) { return void cb(e); }

        getHash(store, publicKey, function (e, hash) {
            cb(e, hash);
        });
    });
};

var resetUserPins = function (store, publicKey, channelList, cb) {
    // TODO make this atomic
    store.message(publicKey, JSON.stringify(['RESET']), cb);
};

var expireSessions = function (Cookies) {
    var now = +new Date();
    Object.keys(Cookies).forEach(function (key) {
        if (isTooOld(Cookies[key].atime, now)) {
            delete Cookies[key];
        }
    });
};

RPC.create = function (config, cb) {
    // load pin-store...

    console.log('loading rpc module...');

    var Cookies = {};

    var store;

    var addUser = function (key) {
        if (Cookies[key]) { return; }
        var user = Cookies[key] = {};
        user.atime = +new Date();
        user.tokens = [
            makeToken()
        ];
    };

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
        addUser(publicKey);

        var cookie = msg[0];

        if (!isValidCookie(Cookies, publicKey, cookie)) {
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
            var token = Cookies[publicKey].tokens.slice(-1)[0];
            var cookie = makeCookie(token).join('|');
            respond(e, [cookie].concat(msg||[]));
        };

        if (typeof(msg) !== 'object' || !msg.length) {
            return void Respond('INVALID_MSG');
        }

        switch (msg[0]) {
            case 'COOKIE':
                return void Respond(void 0);
            case 'ECHO':
                return void Respond(void 0, msg);

            /*  TODO
                reset should be atomic in case the operation is aborted */
            case 'RESET':
                return resetUserPins(store, safeKey, [], function (e) {
                    return void Respond(e);
                });

            case 'PIN':
                return pinChannel(store, safeKey, msg[1], function (e, hash) {
                    Respond(e, hash);
                });
            case 'UNPIN':
                return unpinChannel(store, safeKey, msg[1], function (e, hash) {
                    Respond(e, hash);
                });
            case 'GET_HASH':
                return void getHash(store, safeKey, function (e, hash) {
                    Respond(e, hash);
                });
            case 'GET_TOTAL_SIZE':
                return getTotalSize(store, ctx.store, safeKey, function (e, size) {
                    if (e) { return void Respond(e); }
                    Respond(e, size);
                });
            case 'GET_FILE_SIZE':
                return void getFileSize(ctx.store, msg[1], Respond);
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
            expireSessions(Cookies);
        }, 60000);
    });
};

