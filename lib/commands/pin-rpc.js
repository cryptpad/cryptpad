// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const Core = require("./core");

const Pinning = module.exports;
const Util = require("../common-util");
const nThen = require("nthen");

const escapeKeyCharacters = Util.escapeKeyCharacters;
const unescapeKeyCharacters = Util.unescapeKeyCharacters;

var sumChannelSizes = function (sizes) { // FIXME this synchronous code could be done by a worker
    return Object.keys(sizes).map(function (id) { return sizes[id]; })
        .filter(function (x) {
            // only allow positive numbers
            return !(typeof(x) !== 'number' || x <= 0);
        })
        .reduce(function (a, b) { return a + b; }, 0);
};

// FIXME it's possible for this to respond before the server has had a chance
// to fetch the limits. Maybe we should respond with an error...
// or wait until we actually know the limits before responding
var getLimit = Pinning.getLimit = function (Env, safeKey, cb) {
    var unsafeKey = unescapeKeyCharacters(safeKey);
    var limit = Env.limits[unsafeKey];
    var defaultLimit = typeof(Env.defaultStorageLimit) === 'number'?
        Env.defaultStorageLimit: Core.DEFAULT_LIMIT;

    var toSend = limit && typeof(limit.limit) === "number"?
        [limit.limit, limit.plan, limit.note] : [defaultLimit, '', ''];

    cb(void 0, toSend);
};

var getMultipleFileSize = function (Env, channels, cb) {
    Env.getMultipleFileSize(channels, cb);
};

var loadUserPins = function (Env, safeKey, cb) {
    var session = Core.getSession(Env.Sessions, safeKey);

    if (session.channels) {
        return cb(session.channels);
    }

    Env.batchUserPins(safeKey, cb, function (done) {
        Env.getPinState(safeKey, function (err, value) {
            if (!err) {
                // only put this into the cache if it completes
                session.channels = value;
            }
            done(value);
        });
    });
};

var truthyKeys = function (O) {
    try {
        return Object.keys(O).filter(function (k) {
            return O[k];
        });
    } catch (err) {
        return [];
    }
};

var getChannelList = Pinning.getChannelList = function (Env, safeKey, _cb) {
    var cb = Util.once(Util.mkAsync(_cb));
    loadUserPins(Env, safeKey, function (pins) {
        cb(truthyKeys(pins));
    });
};

Pinning.getTotalSize = function (Env, safeKey, cb) {
    var unsafeKey = unescapeKeyCharacters(safeKey);
    var limit = Env.limits[unsafeKey];

    // Get a common key if multiple users share the same quota, otherwise take the public key
    var batchKey = (limit && Array.isArray(limit.users)) ? limit.users.join('') : safeKey;

    Env.batchTotalSize(batchKey, cb, function (done) {
        var channels = [];

        var addUnique = function (channel) {
            if (channels.indexOf(channel) !== -1) { return; }
            channels.push(channel);
        };

        nThen(function (waitFor) {
            // Get the channels list for our user account
            getChannelList(Env, safeKey, waitFor(function (_channels) {
                if (!_channels) {
                    waitFor.abort();
                    return done('INVALID_PIN_LIST');
                }
                _channels.forEach(addUnique);
            }));
            // Get the channels list for users sharing our quota
            if (limit && Array.isArray(limit.users) && limit.users.length > 1) {
                limit.users.forEach(function (key) {
                    if (key === unsafeKey) { return; } // Don't count ourselves twice
                    getChannelList(Env, key, waitFor(function (_channels) {
                        if (!_channels) { return; } // Broken user, don't count their quota
                        _channels.forEach(addUnique);
                    }));
                });
            }
        }).nThen(function () {
            Env.getTotalSize(channels, done);
        });
    });
};

/*  Users should be able to clear their own pin log with an authenticated RPC
*/
Pinning.removePins = function (Env, safeKey, cb) {
    // FIXME respect the queue
    Env.pinStore.archiveChannel(safeKey, undefined, function (err) {
        Core.expireSession(Env.Sessions, safeKey);
        Env.Log.info('ARCHIVAL_PIN_BY_OWNER_RPC', {
            safeKey: safeKey,
            status: err? String(err): 'SUCCESS',
        });

        if (err) { return void cb(err); }
        cb(void 0, 'OK');
    });
};

Pinning.trimPins = function (Env, safeKey, cb) {
    cb("NOT_IMPLEMENTED");
};

var getFreeSpace = Pinning.getFreeSpace = function (Env, safeKey, cb) {
    getLimit(Env, safeKey, function (e, limit) {
        if (e) { return void cb(e); }
        Pinning.getTotalSize(Env, safeKey, function (e, size) {
            if (typeof(size) === 'undefined') { return void cb(e); }

            var rem = limit[0] - size;
            if (typeof(rem) !== 'number') {
                return void cb('invalid_response');
            }
            cb(void 0, rem);
        });
    });
};

Pinning.getHash = function (Env, safeKey, cb) {
    getChannelList(Env, safeKey, function (channels) {
        Env.hashChannelList(channels, cb);
    });
};

Pinning.pinChannel = function (Env, safeKey, channels, cb) {
    if (!channels && channels.filter) {
        return void cb('INVALID_PIN_LIST');
    }

    // get channel list ensures your session has a cached channel list
    getChannelList(Env, safeKey, function (pinned) {
        var session = Core.getSession(Env.Sessions, safeKey);

        // only pin channels which are not already pinned
        var toStore = channels.filter(function (channel) {
            return channel && pinned.indexOf(channel) === -1;
        });

        if (toStore.length === 0) {
            return void cb();
        }

        let pin = function () {
            Env.pinStore.message(safeKey, JSON.stringify(['PIN', toStore, +new Date()]),
                function (e) {
                if (e) { return void cb(e); }
                if (!session || !session.channels) { return void cb(); }
                toStore.forEach(function (channel) {
                    session.channels[channel] = true;
                });
                cb();
            });
        };

        // Support tickets are always pinned, no need to check the limit
        if (safeKey === escapeKeyCharacters(Env.supportPinKey)) {
            return void pin();
        }

        getMultipleFileSize(Env, toStore, function (e, sizes) {
            if (typeof(sizes) === 'undefined') { return void cb(e); }
            var pinSize = sumChannelSizes(sizes); // FIXME don't do this in the main thread...

            getFreeSpace(Env, safeKey, function (e, free) {
                if (typeof(free) === 'undefined') {
                    Env.WARN('getFreeSpace', e);
                    return void cb(e);
                }
                if (pinSize > free) { return void cb('E_OVER_LIMIT'); }

                pin();
            });
        });
    });
};

Pinning.unpinChannel = function (Env, safeKey, channels, cb) {
    if (!channels && channels.filter) {
        // expected array
        return void cb('INVALID_PIN_LIST');
    }

    getChannelList(Env, safeKey, function (pinned) {
        var session = Core.getSession(Env.Sessions, safeKey);

        // only unpin channels which are pinned
        var toStore = channels.filter(function (channel) {
            return channel && pinned.indexOf(channel) !== -1;
        });

        if (toStore.length === 0) {
            return void cb();
        }

        Env.pinStore.message(safeKey, JSON.stringify(['UNPIN', toStore, +new Date()]),
            function (e) {
            if (e) { return void cb(e); }
            toStore.forEach(function (channel) {
                delete session.channels[channel];
            });
            cb();
        });
    });
};

Pinning.resetUserPins = function (Env, safeKey, channelList, _cb) {
    var cb = Util.once(Util.mkAsync(_cb));
    if (!Array.isArray(channelList)) { return void cb('INVALID_PIN_LIST'); }
    var session = Core.getSession(Env.Sessions, safeKey);


    if (!channelList.length) {
        return void cb();
    }

    let reset = function () {
        var pins = {};
        Env.pinStore.message(safeKey, JSON.stringify(['RESET', channelList, +new Date()]),
            function (e) {
            if (e) { return void cb(e); }
            channelList.forEach(function (channel) {
                pins[channel] = true;
            });

            // update in-memory cache IFF the reset was allowed.
            if (session) { session.channels = pins; }
            cb();
        });
    };

    // Support tickets are always pinned, no need to check the limit
    if (safeKey === escapeKeyCharacters(Env.supportPinKey)) {
        return void reset();
    }

    getMultipleFileSize(Env, channelList, function (e, sizes) {
        if (typeof(sizes) === 'undefined') { return void cb(e); }
        var pinSize = sumChannelSizes(sizes);


        getLimit(Env, safeKey, function (e, limit) {
            if (e) {
                Env.WARN('[RESET_ERR]', e);
                return void cb(e);
            }

            /*  we want to let people pin, even if they are over their limit,
                but they should only be able to do this once.

                This prevents data loss in the case that someone registers, but
                does not have enough free space to pin their migrated data.

                They will not be able to pin additional pads until they upgrade
                or delete enough files to go back under their limit. */
            if (pinSize > limit[0] && session.hasPinned) { return void(cb('E_OVER_LIMIT')); }
            reset();
        });
    });
};

Pinning.getFileSize = function (Env, channel, cb) {
    Env.getFileSize(channel, cb);
};

/*  accepts a list, and returns a sublist of channel or file ids which seem
    to have been deleted from the server (file size 0)

    we might consider that we should only say a file is gone if fs.stat returns
    ENOENT, but for now it's simplest to just rely on getFileSize...
*/
Pinning.getDeletedPads = function (Env, channels, cb) {
    Env.getDeletedPads(channels, cb);
};

// FIXME this will be removed from the client
Pinning.isChannelPinned = function (Env, channel, cb) {
    return void cb(void 0, true);
};
