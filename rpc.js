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

var storeMessage = function (store, publicKey, msg, cb) {
    store.message(publicKey, JSON.stringify(msg), cb);
};

var pinChannel = function (store, publicKey, channel, cb) {
    store.message(store, publicKey, ['PIN', channel], cb);
};

var unpinChannel = function (store, publicKey, channel, cb) {
    store.message(store, publicKey, ['UNPIN', channel], cb);
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
        cb(hashChannelList(channels));
    });
};

var resetUserPins = function (store, publicKey, channelList, cb) {
    // TODO
    cb('NOT_IMPLEMENTED');
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

        if (!(serialized && publicKey)) {
            return void respond('INVALID_MESSAGE_OR_PUBLIC_KEY');
        }

        if (checkSignature(serialized, signature, publicKey) !== true) {
            return void respond("INVALID_SIGNATURE_OR_PUBLIC_KEY");
        }

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
            case 'RESET':
                return resetUserPins(store, publicKey, [], function (e) {
                    return void Respond('NOT_IMPLEMENTED', msg);
                });
            case 'PIN':
                return pinChannel(store, publicKey, msg[1], function (e) {
                    Respond(e);
                });
            case 'UNPIN':
                return unpinChannel(store, publicKey, msg[1], function (e) {
                    Respond(e);
                });
            case 'GET_HASH':
                return void getHash(store, publicKey, function (hash) {
                    Respond(void 0, hash);
                });
            case 'GET_TOTAL_SIZE':
                return void Respond('NOT_IMPLEMENTED', msg);
            case 'GET_FILE_SIZE':
                if (!isValidChannel(msg[1])) {
                    return void Respond('INVALID_CHAN');
                }

                return void ctx.store.getChannelSize(msg[1], function (e, size) {
                    if (e) { return void Respond(e.code); }
                    Respond(void 0, size);
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
            expireSessions(Cookies);
        }, 60000);
    });
};

