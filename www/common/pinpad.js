(function () {
var factory = function (Util, Rpc) {
    var create = function (network, proxy, _cb) {
        if (typeof(_cb) !== 'function') { throw new Error("Expected callback"); }
        var cb = Util.once(Util.mkAsync(_cb));

        if (!network) { return void cb('INVALID_NETWORK'); }
        if (!proxy) { return void cb('INVALID_PROXY'); }

        var edPrivate = proxy.edPrivate;
        var edPublic = proxy.edPublic;

        if (!(edPrivate && edPublic)) { return void cb('INVALID_KEYS'); }

        Rpc.create(network, edPrivate, edPublic, function (e, rpc) {
            if (e) { return void cb(e); }

            var exp = {};

            exp.destroy = rpc.destroy;

            // expose the supplied publicKey as an identifier
            exp.publicKey = edPublic;

            // expose the RPC module's raw 'send' command
            exp.send = rpc.send;

            // you can ask the server to pin a particular channel for you
            exp.pin = function (channels, cb) {
                if (!Array.isArray(channels)) {
                    setTimeout(function () {
                        cb('[TypeError] pin expects an array');
                    });
                    return;
                }
                rpc.send('PIN', channels, cb);
            };

            // you can also ask to unpin a particular channel
            exp.unpin = function (channels, cb) {
                if (!Array.isArray(channels)) {
                    setTimeout(function () {
                        cb('[TypeError] pin expects an array');
                    });
                    return;
                }
                rpc.send('UNPIN', channels, cb);
            };

            // Get data for the admin panel
            exp.adminRpc = function (obj, cb) {
                if (!obj.cmd) {
                    setTimeout(function () {
                        cb('[TypeError] admin rpc expects a command');
                    });
                    return;
                }
                var params = [obj.cmd, obj.data];
                rpc.send('ADMIN', params, cb);
            };

            // ask the server what it thinks your hash is
            exp.getServerHash = function (cb) {
                rpc.send('GET_HASH', edPublic, function (e, hash) {
                    if (!(hash && hash[0])) {
                        return void cb('NO_HASH_RETURNED');
                    }
                    cb(e, Array.isArray(hash) && hash[0] || undefined);
                });
            };

            // if local and remote hashes don't match, send a reset
            exp.reset = function (channels, cb) {
                if (!Array.isArray(channels)) {
                    setTimeout(function () {
                        cb('[TypeError] pin expects an array');
                    });
                    return;
                }
                rpc.send('RESET', channels, function (e, response) {
                    if (e) {
                        return void cb(e);
                    }
                    if (!response.length) {
                        console.log(response);
                        return void cb('INVALID_RESPONSE');
                    }
                    cb(e, response[0]);
                });
            };

            // get the combined size of all channels (in bytes) for all the
            // channels which the server has pinned for your publicKey
            exp.getFileListSize = function (cb) {
                rpc.send('GET_TOTAL_SIZE', undefined, function (e, response) {
                    if (e) { return void cb(e); }
                    if (response && response.length && typeof(response[0]) === 'number') {
                        cb(void 0, response[0]);
                    } else {
                        cb('INVALID_RESPONSE');
                    }
                });
            };

            // Update the limit value for all the users and return the limit for your publicKey
            exp.updatePinLimits = function (cb) {
                rpc.send('UPDATE_LIMITS', undefined, function (e, response) {
                    if (e) { return void cb(e); }
                    if (response && response.length && typeof(response[0]) === "number") {
                        cb (void 0, response[0], response[1], response[2]);
                    } else {
                        cb('INVALID_RESPONSE');
                    }
                });
            };
            // Get the storage limit associated with your publicKey
            exp.getLimit = function (cb) {
                rpc.send('GET_LIMIT', undefined, function (e, response) {
                    if (e) { return void cb(e); }
                    if (response && response.length && typeof(response[0]) === "number") {
                        cb (void 0, response[0], response[1], response[2]);
                    } else {
                        cb('INVALID_RESPONSE');
                    }
                });
            };

            exp.trimHistory = function (data, _cb) {
                var cb = Util.once(Util.mkAsync(_cb));
                if (typeof(data) !== 'object' || !data.channel || !data.hash) {
                    return void cb('INVALID_ARGUMENTS');
                }
                rpc.send('TRIM_HISTORY', data, function (e) {
                    if (e) { return cb(e); }
                    cb();
                });
            };

            exp.clearOwnedChannel = function (channel, cb) {
                if (typeof(channel) !== 'string' || channel.length !== 32) {
                    return void cb('INVALID_ARGUMENTS');
                }
                rpc.send('CLEAR_OWNED_CHANNEL', channel, function (e) {
                    if (e) { return cb(e); }
                    cb();
                });
            };

            exp.removeOwnedChannel = function (channel, cb) {
                if (typeof(channel) !== 'string' || [32,48].indexOf(channel.length) === -1) {
                    // can't use this on files because files can't be owned...
                    return void cb('INVALID_ARGUMENTS');
                }
                rpc.send('REMOVE_OWNED_CHANNEL', channel, function (e, response) {
                    if (e) { return void cb(e); }
                    if (response && response.length && response[0] === "OK") {
                        cb();
                    } else {
                        cb('INVALID_RESPONSE');
                    }
                });
            };

            exp.removePins = function (cb) {
                rpc.send('REMOVE_PINS', undefined, function (e, response) {
                    if (e) { return void cb(e); }
                    if (response && response.length && response[0] === "OK") {
                        cb();
                    } else {
                        cb('INVALID_RESPONSE');
                    }
                });
            };

            exp.uploadComplete = function (id, cb) {
                rpc.send('UPLOAD_COMPLETE', id, function (e, res) {
                    if (e) { return void cb(e); }
                    var id = res[0];
                    if (typeof(id) !== 'string') {
                        return void cb('INVALID_ID');
                    }
                    cb(void 0, id);
                });
            };

            exp.ownedUploadComplete = function (id, cb) {
                rpc.send('OWNED_UPLOAD_COMPLETE', id, function (e, res) {
                    if (e) { return void cb(e); }
                    var id = res[0];
                    if (typeof(id) !== 'string') {
                        return void cb('INVALID_ID');
                    }
                    cb(void 0, id);
                });
            };

            exp.uploadStatus = function (size, cb) {
                if (typeof(size) !== 'number') {
                    return void setTimeout(function () {
                        cb('INVALID_SIZE');
                    });
                }
                rpc.send('UPLOAD_STATUS', size, function (e, res) {
                    if (e) { return void cb(e); }
                    var pending = res[0];
                    if (typeof(pending) !== 'boolean') {
                        return void cb('INVALID_RESPONSE');
                    }
                    cb(void 0, pending);
                });
            };

            exp.uploadCancel = function (size, cb) {
                rpc.send('UPLOAD_CANCEL', size, function (e) {
                    if (e) { return void cb(e); }
                    cb();
                });
            };

            exp.writeLoginBlock = function (data, cb) {
                if (!data) { return void cb('NO_DATA'); }
                if (!data.publicKey || !data.signature || !data.ciphertext) {
                    console.log(data);
                    return void cb("MISSING_PARAMETERS");
                }

                rpc.send('WRITE_LOGIN_BLOCK', [
                    data.publicKey,
                    data.signature,
                    data.ciphertext
                ], function (e) {
                    cb(e);
                });
            };

            exp.removeLoginBlock = function (data, cb) {
                if (!data) { return void cb('NO_DATA'); }
                if (!data.publicKey || !data.signature) {
                    console.log(data);
                    return void cb("MISSING_PARAMETERS");
                }

                rpc.send('REMOVE_LOGIN_BLOCK', [
                    data.publicKey, // publicKey
                    data.signature, // signature
                ], function (e) {
                    cb(e);
                });
            };

            // Get data for the admin panel
            exp.setMetadata = function (obj, cb) {
                rpc.send('SET_METADATA', {
                    channel: obj.channel,
                    command: obj.command,
                    value: obj.value
                }, cb);
            };


            cb(e, exp);
        });
    };

    return { create: create };
};
    if (typeof(module) !== 'undefined' && module.exports) {
        module.exports = factory(require('./common-util'), require("./rpc"));
    } else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
        define([ '/common/common-util.js', '/common/rpc.js', ], function (Util, Rpc) { return factory(Util, Rpc); });
    }
}());
