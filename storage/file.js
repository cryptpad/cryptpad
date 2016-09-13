var Fs = require("fs");
var Path = require("path");

//function will check if a directory exists, and create it if it doesn't
var checkDir = function (dir, cb) {
    Fs.stat(dir, function(err, stats) {
        //Check if error defined and the error code is "not exists"
        if (err) {
            //Create the directory, call the callback.
            Fs.mkdir(dir, cb);
        } else {
            //just in case there was a different error:
            cb(err);
        }
    });
};

var checkFile = function (path, cb) {
    Fs.stat(path, function (err, stats) {
        if (err) {
            if (err.code === 'ENOENT') {
                return cb(null, false);
            } else {
                return cb(err);
            }
        }
        return cb(null, stats.isFile());
    });
};

var separate = function (channel) {
    return {
        first: channel.slice(0, 2),
        rest: channel.slice(2),
    };
};

var Channel = function (env, id, filepath, cb) {
    if (!env.channels[id]) {
        return (env.channels[id] = {
            atime: +new Date(),
            queue: [],
            stream: Fs.createWriteStream(filepath, {
                flags: 'a'
            }).on('open', function () {
                cb(null, env.channels[id]);
            }).on('error', function (err) {
                cb(err);
            })
        });
    }
    cb(null, env.channels[id]);
};

var insert = function (env, channelName, content, cb) {
    var parts = separate(channelName);

    var dirpath = Path.join(env.root, parts.first);
    checkDir(dirpath, function (e) {
        if (e) { throw new Error(e); }

        var filepath = Path.join(env.root, parts.first, parts.rest);
        checkFile(filepath, function (err, isFile) {
            Channel(env, channelName, filepath, function (err, channel) {
                if (err) {
                    console.error(err);
                    return cb();
                }

                var doIt = function () {
                    channel.locked = true;
                    channel.atime = +new Date();
                    channel.stream.write(JSON.stringify(content) + '\n');

                    if (!channel.queue.length) {
                        channel.locked = false;
                        cb();
                        return;
                    }

                    channel.queue.shift()();
                    cb();
                };

                if (channel.locked) {
                    channel.queue.push(doIt);
                } else {
                    doIt();
                }
            });
        });
    });
};

var getMessages = function (env, channelName, msgHandler, cb) {
    var parts = separate(channelName);

    var filepath = Path.join(env.root, parts.first, parts.rest);

    var remainder = '';
    var newlines = /[\n\r]+/;

    var stream = Fs.createReadStream(filepath, 'utf-8')
        .on('data', function (chunk) {
            var lines = chunk.split(newlines);
            lines[0] = remainder + lines[0];
            remainder = lines.pop();
            lines.forEach(function (line) {
                msgHandler(JSON.parse(line));
            });
        })
        .on('end', function () { cb(); })
        .on('error', function (e) { cb(); });
};

module.exports.create = function (conf, cb) {
    var env = {
        root: conf.filePath,
        channels: { },
    };

    checkDir(env.root, function (e, data) {
        cb({
            message: function (channelName, content, cb) {
                insert(env, channelName, content, cb);
            },
            getMessages: function (channelName, msgHandler, cb) {
                getMessages(env, channelName, msgHandler, cb);
            },
            removeChannel: function (channelName, cb) {
                console.log("[storage/file.removeChannel()] Not implemented");
                cb();
            },
        });

        setInterval(function () {
            var now = +new Date();
            Object.keys(env.channels).forEach(function (id) {
                var channel = env.channels[id];
                if (now - channel.atime > (1000 * 60)) {
                    //console.log("Cleaning up idle channel [%s]", id);
                    channel.stream.close();
                    delete env.channels[id];
                }
            });
        }, 60 * 1000);
    });
};
