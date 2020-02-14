/*jshint esversion: 6 */

var Pins = module.exports;

const Fs = require("fs");
const Path = require("path");
const Util = require("./common-util");
const Plan = require("./plan");

/*  Accepts a reference to an object, and...
    either a string describing which log is being processed (backwards compatibility),
    or a function which will log the error with all relevant data
*/
var createLineHandler = Pins.createLineHandler = function (ref, errorHandler) {
    var fileName;
    if (typeof(errorHandler) === 'string') {
        fileName = errorHandler;
        errorHandler = function (label, data) {
            console.error(label, {
                log: fileName,
                data: data,
            });
        };
    }

    // passing the reference to an object allows us to overwrite accumulated pins
    // make sure to get ref.pins as the result
    // it's a weird API but it's faster than unpinning manually
    var pins = ref.pins = {};
    ref.index = 0;
    ref.latest = 0; // the latest message (timestamp in ms)
    ref.surplus = 0; // how many lines exist behind a reset
    return function (line) {
        ref.index++;
        if (!Boolean(line)) { return; }

        var l;
        try {
            l = JSON.parse(line);
        } catch (e) {
            return void errorHandler('PIN_LINE_PARSE_ERROR', line);
        }

        if (!Array.isArray(l)) {
            return void errorHandler('PIN_LINE_NOT_FORMAT_ERROR', l);
        }

        if (typeof(l[2]) === 'number') {
            ref.latest = l[2]; // date
        }

        switch (l[0]) {
            case 'RESET': {
                pins = ref.pins = {};
                if (l[1] && l[1].length) { l[1].forEach((x) => { ref.pins[x] = 1; }); }
                ref.surplus = ref.index;
                //jshint -W086
                // fallthrough
            }
            case 'PIN': {
                l[1].forEach((x) => { pins[x] = 1; });
                break;
            }
            case 'UNPIN': {
                l[1].forEach((x) => { delete pins[x]; });
                break;
            }
            default:
                errorHandler("PIN_LINE_UNSUPPORTED_COMMAND", l);
        }
    };
};

/*
    takes contents of a pinFile (UTF8 string)
    and the pin file's name
    returns an array of of channel ids which are pinned

    throw errors on pin logs with invalid pin data
*/
Pins.calculateFromLog = function (pinFile, fileName) {
    var ref = {};
    var handler = createLineHandler(ref, fileName);

    pinFile.split('\n').forEach(handler);
    return Object.keys(ref.pins);
};

/*
    pins/
    pins/A+/
    pins/A+/A+hyhrQLrgYixOomZYxpuEhwfiVzKk1bBp+arH-zbgo=.ndjson
*/

const getSafeKeyFromPath = function (path) {
    return path.replace(/^.*\//, '').replace(/\.ndjson/, '');
}

Pins.list = function (_done, config) {
    const pinPath = config.pinPath || './data/pins';
    const plan = Plan(config.workers || 5);
    const handler = config.handler || function () {};

    var isDone = false;
    // ensure that 'done' is only called once
    // that it calls back asynchronously
    // and that it sets 'isDone' to true, so that pending processes
    // know to abort
    const done = Util.once(Util.both(Util.mkAsync(_done), function () {
        isDone = true;
    }));

    // TODO externalize this via optional handlers?
    const stats = {
        logs: 0,
        dirs: 0,
        pinned: 0,
        lines: 0,
    };

    const errorHandler = function (label, info) {
        console.log(label, info);
    };

    const pinned = {};

    // TODO replace this with lib-readline?
    const streamFile = function (path, cb) {
        const id = getSafeKeyFromPath(path);

        return void Fs.readFile(path, 'utf8', function (err, body) {
            if (err) { return void cb(err); }
            const ref = {};
            const pinHandler = createLineHandler(ref, errorHandler);
            var lines = body.split('\n');
            stats.lines += lines.length;
            lines.forEach(pinHandler);
            handler(ref, id, pinned);
            cb(void 0, ref);
        });
    };

    const scanDirectory = function (path, cb) {
        Fs.readdir(path, function (err, list) {
            if (err) {
                return void cb(err);
            }
            cb(void 0, list.map(function (item) {
                return {
                    path: Path.join(path, item),
                    id: item.replace(/\.ndjson$/, ''),
                };
            }));
        });
    };

    scanDirectory(pinPath, function (err, dirs) {
        if (err) {
            if (err.code === 'ENOENT') { return void cb(void 0, {}); }
            return void done(err);
        }
        dirs.forEach(function (dir) {
            plan.job(1, function (next) {
                if (isDone) { return void next(); }
                scanDirectory(dir.path, function (nested_err, logs) {
                    if (nested_err) {
                        return void done(err);
                    }
                    stats.dirs++;
                    logs.forEach(function (log) {
                        if (!/\.ndjson$/.test(log.path)) { return; }
                        plan.job(0, function (next)  {
                            if (isDone) { return void next(); }
                            streamFile(log.path, function (err, ref) {
                                if (err) { return void done(err); }
                                stats.logs++;

                                var set = ref.pins;
                                for (var item in set) {
                                    (pinned[item] = pinned[item] || {})[log.id] = 1;
                                    if (!pinned.hasOwnProperty(item)) {
                                        stats.pinned++;
                                    }
                                }
                                next();
                            });
                        });
                    });
                    next();
                });
            });
        });

        plan.done(function () {
            // err ?
            done(void 0, pinned);
        }).start();
    });
};
