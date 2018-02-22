var Fs = require("fs");
var Path = require("path");

var nThen = require("nthen");

var config;
try {
    config = require('./config');
} catch (e) {
    console.log("You can customize the configuration by copying config.example.js to config.js");
    config = require('./config.example');
}

var FileStorage = require(config.storage || './storage/file');
var root = Path.resolve(config.taskPath || './tasks');

var dirs;
var nt;
var store;

var queue = function (f) {
    nt = nt.nThen(f);
};

var tryParse = function (s) {
    try { return JSON.parse(s); }
    catch (e) { return null; }
};

var CURRENT = +new Date();

var handleTask = function (str, path, cb) {
    var task = tryParse(str);
    if (!Array.isArray(task)) {
        console.error('invalid task: not array');
        return cb();
    }
    if (task.length < 2) {
        console.error('invalid task: too small');
        return cb();
    }

    var time = task[0];
    var command = task[1];
    var args = task.slice(2);

    if (time > CURRENT) {
        // not time for this task yet
        console.log('not yet time');
        return cb();
    }

    nThen(function (waitFor) {
        switch (command) {
            case 'EXPIRE':
                console.log("expiring: %s", args[0]);
                store.removeChannel(args[0], waitFor());
                break;
            default:
                console.log("unknown command", command);
        }
    }).nThen(function () {
        // remove the task file...
        Fs.unlink(path, function (err) {
            if (err) { console.error(err); }
            cb();
        });
    });
};

nt = nThen(function (w) {
    Fs.readdir(root, w(function (e, list) {
        if (e) { throw e; }
        dirs = list;
        if (dirs.length === 0) {
            w.abort();
            return;
        }
    }));
}).nThen(function (waitFor) {
    FileStorage.create(config, waitFor(function (_store) {
        store = _store;
    }));
}).nThen(function () {
    dirs.forEach(function (dir, dIdx) {
        queue(function (w) {
            console.log('recursing into %s', dir);
            Fs.readdir(Path.join(root, dir), w(function (e, list) {
                list.forEach(function (fn) {
                    queue(function (w) {
                        var filePath = Path.join(root, dir, fn);
                        var cb = w();

                        console.log("processing file at %s", filePath);
                        Fs.readFile(filePath, 'utf8', function (e, str) {
                            if (e) {
                                console.error(e);
                                return void cb();
                            }

                            handleTask(str, filePath, cb);
                        });
                    });
                });
                if (dIdx === (dirs.length - 1)) {
                    queue(function () {
                        store.shutdown();
                    });
                }
            }));
        });
    });
});


