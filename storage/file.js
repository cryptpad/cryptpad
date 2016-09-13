var Fs = require("fs");
var Path = require("path");
var nThen = require("nthen");

var mkPath = function (env, channelId) {
    return Path.join(env.root, channelId.slice(0, 2), channelId) + '.ndjson';
};

var readMessages = function (path, msgHandler, cb) {
    var remainder = '';
    var stream = Fs.createReadStream(path, 'utf8');
    var complete = function (err) {
        var _cb = cb;
        cb = undefined;
        if (_cb) { _cb(err); }
    };
    stream.on('data', function (chunk) {
        var lines = chunk.split('\n');
        lines[0] = remainder + lines[0];
        remainder = lines.pop();
        lines.forEach(msgHandler);
    });
    stream.on('end', function () {
        msgHandler(remainder);
        complete();
    });
    stream.on('error', function (e) { complete(e); });
};

var checkPath = function (path, callback) {
    Fs.stat(path, function (err, stats) {
        if (!err) {
            callback(undefined, true);
            return;
        }
        if (err.code !== 'ENOENT') {
            callback(err);
            return;
        }
        var dirPath = path.replace(/\/[^\/]*$/, '/');
        Fs.mkdir(dirPath, function (err) {
            if (err && err !== 'EEXIST') {
                callback(err);
                return;
            }
            callback(undefined, false);
        });
    });
};

var getChannel = function (env, id, callback) {
    if (env.channels[id]) {
        var chan = env.channels[id];
        if (chan.whenLoaded) {
            chan.whenLoaded.push(callback);
        } else {
            callback(undefined, chan);
        }
        return;
    }
    var channel = env.channels[id] = {
        atime: +new Date(),
        messages: [],
        writeStream: undefined,
        whenLoaded: [ callback ],
        onError: [ ]
    };
    var complete = function (err) {
        var whenLoaded = channel.whenLoaded;
        // no guarantee stream.on('error') will not cause this to be called multiple times
        if (!whenLoaded) { return; }
        channel.whenLoaded = undefined;
        if (err) {
            delete env.channels[id];
        }
        whenLoaded.forEach(function (wl) { wl(err, (err) ? undefined : channel); });
    }
    var path = mkPath(env, id);
    var fileExists;
    nThen(function (waitFor) {
        checkPath(path, waitFor(function (err, exists) {
            if (err) {
                waitFor.abort();
                complete(err);
                return;
            }
            fileExists = exists;
        }));
    }).nThen(function (waitFor) {
        if (!fileExists) { return; }
        readMessages(path, function (msg) {
            channel.messages.push(msg);
        }, waitFor(function (err) {
            if (err) {
                waitFor.abort();
                complete(err);
            }
        }));
    }).nThen(function (waitFor) {
        var stream = channel.writeStream = Fs.createWriteStream(path, { flags: 'a' });
        stream.on('open', waitFor());
        stream.on('error', function (err) {
            // this might be called after this nThen block closes.
            if (channel.whenLoaded) {
                complete(err);
            } else {
                channel.onError.forEach(function (handler) {
                    handler(err);
                });
            }
        });
    }).nThen(function (waitFor) {
        complete();
    });
};

var message = function (env, chanName, msg, cb) {
    getChannel(env, chanName, function (err, chan) {
        if (err) {
            cb(err);
            return;
        }
        var complete = function (err) {
            var _cb = cb;
            cb = undefined;
            if (_cb) { _cb(err); }
        };
        chan.onError.push(complete);
        chan.writeStream.write(msg + '\n', function () {
            chan.onError.splice(chan.onError.indexOf(complete) - 1, 1);
            if (!cb) { return; }
            chan.messages.push(msg);
            chan.atime = +new Date();
            complete();
        });
    });
};

var getMessages = function (env, chanName, handler, cb) {
    getChannel(env, chanName, function (err, chan) {
        if (err) {
            cb(err);
            return;
        }
        chan.messages.forEach(handler);
        chan.atime = +new Date();
        cb();
    });
};

module.exports.create = function (conf, cb) {
    var env = {
        root: conf.filePath || './datastore',
        channels: { },
    };
    console.log('storing data in ' + env.root);
    Fs.mkdir(env.root, function (err) {
        if (err && err.code !== 'EEXIST') {
            // TODO: somehow return a nice error
            throw err;
        }
        cb({
            message: function (channelName, content, cb) {
                message(env, channelName, content, cb);
            },
            getMessages: function (channelName, msgHandler, cb) {
                getMessages(env, channelName, msgHandler, cb);
            },
            removeChannel: function (channelName, cb) {
                console.log("[storage/file.removeChannel()] Not implemented");
                cb();
            },
        });
    });
};
