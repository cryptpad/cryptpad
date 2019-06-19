var Fs = require("fs");
var Fse = require("fs-extra");
var Path = require("path");
var nacl = require("tweetnacl");
var nThen = require("nthen");

var Tasks = module.exports;

var tryParse = function (s) {
    try { return JSON.parse(s); }
    catch (e) { return null; }
};

var encode = function (time, command, args) {
    if (typeof(time) !== 'number') { return null; }
    if (typeof(command) !== 'string') { return null; }
    if (!Array.isArray(args)) { return [time, command]; }
    return [time, command].concat(args);
};

/*
var randomId = function () {
    var bytes = Array.prototype.slice.call(nacl.randomBytes(16));
    return bytes.map(function (b) {
        var n = Number(b & 0xff).toString(16);
        return n.length === 1? '0' + n: n;
    }).join('');
};


var mkPath = function (env, id) {
    return Path.join(env.root, id.slice(0, 2), id) + '.ndjson';
};
*/

// make a new folder every MODULUS ms
var MODULUS = 1000 * 60 * 60 * 24; // one day
var moduloTime = function (d) {
    return d - (d % MODULUS);
};

var makeDirectoryId = function (d) {
    return '' + moduloTime(d);
};

var write = function (env, task, cb) {
    var str = JSON.stringify(task) + '\n';
    var id = nacl.util.encodeBase64(nacl.hash(nacl.util.decodeUTF8(str))).replace(/\//g, '-');

    var dir = makeDirectoryId(task[0]);
    var path = Path.join(env.root, dir);

    nThen(function (w) {
        // create the parent directory if it does not exist
        Fse.mkdirp(path, 0x1ff, w(function (err) {
            if (err) {
                w.abort();
                return void cb(err);
            }
        }));
    }).nThen(function () {
        // write the file to the path
        var fullPath = Path.join(path, id + '.ndjson');

        // the file ids are based on the hash of the file contents to be written
        // as such, writing an exact task a second time will overwrite the first with the same contents
        // this shouldn't be a problem

        Fs.writeFile(fullPath, str, function (e) {
            if (e) {
                env.log.error("TASK_WRITE_FAILURE", {
                    error: e,
                    path: fullPath,
                });
                return void cb(e);
            }
            env.log.info("SUCCESSFUL_WRITE", {
                path: fullPath,
            });
            cb();
        });
    });
};

var remove = function (env, path, cb) {
    // FIXME COLDSTORAGE?
    Fs.unlink(path, cb);
};

var removeDirectory = function (env, path, cb) {
    Fs.rmdir(path, cb);
};

var list = Tasks.list = function (env, cb, migration) {
    var rootDirs;

    nThen(function (w) {
        // read the root directory
        Fs.readdir(env.root, w(function (e, list) {
            if (e) {
                env.log.error("TASK_ROOT_DIR", {
                    root: env.root,
                    error: e,
                });
                return void cb(e);
            }
            if (list.length === 0) {
                w.abort();
                return void cb(void 0, []);
            }
            rootDirs = list;
        }));
    }).nThen(function () {
        // schedule the nested directories for exploration
        // return a list of paths to tasks
        var queue = nThen(function () {});

        var allPaths = [];

        var currentWindow = moduloTime(+new Date() + MODULUS);

        // We prioritize a small footprint over speed, so we
        // iterate over directories in serial rather than parallel
        rootDirs.forEach(function (dir) {
        // if a directory is two characters, it's the old format
        // otherwise, it indicates when the file is set to expire
        // so we can ignore directories which are clearly in the future

            var dirTime;
            if (migration) {
                // this block handles migrations. ignore new formats
                if (dir.length !== 2) {
                    return;
                }
            } else {
                // not in migration mode, check if it's a new format
                if (dir.length >= 2) {
                    // might be the new format.
                    // check its time to see if it should be skipped
                    dirTime = parseInt(dir);
                    if (!isNaN(dirTime) && dirTime >= currentWindow) {
                        return;
                    }
                }
            }

            queue.nThen(function (w) {
                var subPath = Path.join(env.root, dir);
                Fs.readdir(subPath, w(function (e, paths) {
                    if (e) {
                        env.log.error("TASKS_INVALID_SUBDIR", {
                            path: subPath,
                            error: e,
                        });
                        return;
                    }

                    if (paths.length === 0) {
                        removeDirectory(env, subPath, function (err) {
                            if (err) {
                                env.log.error('TASKS_REMOVE_EMPTY_DIRECTORY', {
                                    error: err,
                                    path: subPath,
                                });
                            }
                        });
                    }

                    // concat in place
                    Array.prototype.push.apply(allPaths, paths.map(function (p) {
                        return Path.join(subPath, p);
                    }));
                }));
            });
        });

        queue.nThen(function () {
            cb(void 0, allPaths);
        });
    });
};

var read = function (env, filePath, cb) {
    Fs.readFile(filePath, 'utf8', function (e, str) {
        if (e) { return void cb(e); }

        var task = tryParse(str);
        if (!Array.isArray(task) || task.length < 2) {
            env.log("INVALID_TASK", {
                path: filePath,
                task: task,
            });
            return cb(new Error('INVALID_TASK'));
        }
        cb(void 0, task);
    });
};

var expire = function (env, task, cb) {
    // TODO magic numbers, maybe turn task parsing into a function
    // and also maybe just encode tasks in a better format to start...
    var Log = env.log;
    var args = task.slice(2);

    if (!env.retainData) {
        Log.info('DELETION_SCHEDULED_EXPIRATION', {
            task: task,
        });
        env.store.removeChannel(args[0], function (err) {
            if (err) {
                Log.error('DELETION_SCHEDULED_EXPIRATION_ERROR', {
                    task: task,
                    error: err,
                });
            }
            cb();
        });
        return;
    }

    Log.info('ARCHIVAL_SCHEDULED_EXPIRATION', {
        task: task,
    });
    env.store.archiveChannel(args[0], function (err) {
        if (err) {
            Log.error('ARCHIVE_SCHEDULED_EXPIRATION_ERROR', {
                task: task,
                error: err,
            });
        }
        cb();
    });
};

var run = Tasks.run = function (env, path, cb) {
    var CURRENT = +new Date();

    var Log = env.log;
    var task, time, command, args;

    nThen(function (w) {
        read(env, path, w(function (err, _task) {
            if (err) {
                w.abort();
                // there was a file but it wasn't valid?
                return void cb(err);
            }
            task = _task;
            time = task[0];

            if (time > CURRENT) {
                w.abort();
                return cb();
            }

            command = task[1];
            args = task.slice(2);
        }));
    }).nThen(function (w) {
        switch (command) {
            case 'EXPIRE':
                return void expire(env, task, w());
            default:
                Log.warn("TASKS_UNKNOWN_COMMAND", task);
        }
    }).nThen(function () {
        // remove the task file...
        remove(env, path, function (err) {
            if (err) {
                Log.error('TASKS_RECORD_REMOVAL', {
                    path: path,
                    err: err,
                });
            }
            cb();
        });
    });
};

var runAll = function (env, cb) {
    // check if already running and bail out if so
    if (env.running) {
        return void cb("TASK_CONCURRENCY");
    }

    // if not, set a flag to block concurrency and proceed
    env.running = true;

    var paths;
    nThen(function (w) {
        list(env, w(function (err, _paths) {
            if (err) {
                w.abort();
                env.running = false;
                return void cb(err);
            }
            paths = _paths;
        }));
    }).nThen(function (w) {
        var done = w();
        var nt = nThen(function () {});
        paths.forEach(function (path) {
            nt = nt.nThen(function (w) {
                run(env, path, w(function (err) {
                    if (err) {
                        // Any errors are already logged in 'run'
                        // the admin will need to review the logs and clean up
                    }
                }));
            });
        });
        nt = nt.nThen(function () {
            done();
        });
    }).nThen(function (/*w*/) {
        env.running = false;
        cb();
    });
};

var migrate = function (env, cb) {
    // list every task
    list(env, function (err, paths) {
        if (err) {
            return void cb(err);
        }
        var nt = nThen(function () {});
        paths.forEach(function (path) {
            var bypass;
            var task;

            nt = nt.nThen(function (w) {
                // read
                read(env, path, w(function (err, _task) {
                    if (err) {
                        bypass = true;
                        env.log.error("TASK_MIGRATION_READ", {
                            error: err,
                            path: path,
                        });
                        return;
                    }
                    task = _task;
                }));
            }).nThen(function (w) {
                if (bypass) { return; }
                // rewrite in new format
                write(env, task, w(function (err) {
                    if (err) {
                        bypass = true;
                        env.log.error("TASK_MIGRATION_WRITE", {
                            error: err,
                            task: task,
                        });
                    }
                }));
            }).nThen(function (w) {
                if (bypass) { return; }
                // remove
                remove(env, path, w(function (err) {
                    if (err) {
                        env.log.error("TASK_MIGRATION_REMOVE", {
                            error: err,
                            path: path,
                        });
                    }
                }));
            });
        });
        nt = nt.nThen(function () {
            cb();
        });
    }, true);
};

Tasks.create = function (config, cb) {
    if (!config.store) { throw new Error("E_STORE_REQUIRED"); }
    if (!config.log) { throw new Error("E_LOG_REQUIRED"); }

    var env = {
        root: config.taskPath || './tasks',
        log: config.log,
        store: config.store,
        retainData: Boolean(config.retainData),
    };

    // make sure the path exists...
    Fse.mkdirp(env.root, 0x1ff, function (err) {
        if (err) { return void cb(err); }
        cb(void 0, {
            write: function (time, command, args, cb) {
                var task = encode(time, command, args);
                write(env, task, cb);
            },
            list: function (olderThan, cb) {
                list(env, olderThan, cb);
            },
            remove: function (id, cb) {
                remove(env, id, cb);
            },
            run: function (id, cb) {
                run(env, id, cb);
            },
            runAll: function (cb) {
                runAll(env, cb);
            },
            migrate: function (cb) {
                migrate(env, cb);
            },
        });
    });
};

