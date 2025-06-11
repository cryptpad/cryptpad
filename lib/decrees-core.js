// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

var Decrees = module.exports;
var Util = require("./common-util");
var Fs = require("fs");
var Path = require("path");
var readFileBin = require("./stream-file").readFileBin;
var Schedule = require("./schedule");
var Fse = require("fs-extra");
var nThen = require("nthen");


const Utils = Decrees.Utils = {};
var isString = (str) => {
    return typeof(str) === "string";
};
var isInteger = function (n) {
    return !(typeof(n) !== 'number' || isNaN(n) || (n % 1) !== 0);
};
Utils.args_isBoolean = function (args) {
    return !(!Array.isArray(args) || typeof(args[0]) !== 'boolean');
};
Utils.args_isString = function (args) {
    return !(!Array.isArray(args) || !isString(args[0]));
};
Utils.args_isInteger = function (args) {
    return !(!Array.isArray(args) || !isInteger(args[0]));
};
Utils.args_isPositiveInteger = function (args) {
    return Array.isArray(args) && isInteger(args[0]) && args[0] > 0;
};


Decrees.create = (name, commands) => {
    // [<command>, <args>, <author>, <time>]
    const handleCommand = function (Env, line) {
        var command = line[0];
        var args = line[1];

        if (typeof(commands[command]) !== 'function') {
            throw new Error("DECREE_UNSUPPORTED_COMMAND");
        }

        var outcome = commands[command](Env, args);
        if (outcome) {
            // trigger Env change event...
            Env.envUpdated.fire();
        }
        return outcome;
    };

    const createLineHandler = function (Env) {
        var Log = Env.Log;

        var index = -1;

        return function (err, line) {
            index++;
            if (err) {
                // Log the error and bail out
                return void Log.error("DECREE_LINE_ERR", {
                    error: err.message,
                    index: index,
                    line: line,
                });
            }

            if (Array.isArray(line)) {
                try {
                    return void handleCommand(Env, line);
                } catch (err2) {
                    return void Log.error("DECREE_COMMAND_ERR", {
                        error: err2.message,
                        index: index,
                        line: line,
                    });
                }
            }

            Log.error("DECREE_HANDLER_WEIRD_LINE", {
                line: line,
                index: index,
            });
        };
    };

    const load = function (Env, _cb) {
        Env.scheduleDecree = Env.scheduleDecree || Schedule();

        var cb = Util.once(Util.mkAsync(function (err) {
            if (err && err.code !== 'ENOENT') {
                return void _cb(err);
            }
            _cb();
        }));

        Env.scheduleDecree.blocking('', function (unblock) {
            var done = Util.once(Util.both(cb, unblock));
            nThen(function (w) {
                // ensure that the path to the decree log exists
                Fse.mkdirp(Env.paths.decree, w(function (err) {
                    if (!err) { return; }
                    w.abort();
                    done(err);
                }));
            }).nThen(function () {
                var decreeName = Path.join(Env.paths.decree, name);
                var stream = Fs.createReadStream(decreeName, {start: 0});
                var handler = createLineHandler(Env);
                readFileBin(stream, function (msgObj, next) {
                    var text = msgObj.buff.toString('utf8');
                    try {
                        handler(void 0, JSON.parse(text));
                    } catch (err) {
                        handler(err, text);
                    }
                    next();
                }, function (err) {
                    done(err);
                });
            });
        });
    };

    const write = function (Env, decree, _cb) {
        var path = Path.join(Env.paths.decree, name);
        Env.scheduleDecree.ordered('', function (next) {
            var cb = Util.both(Util.mkAsync(_cb), next);
            Fs.appendFile(path, JSON.stringify(decree) + '\n', cb);
        });
    };

    return {
        handleCommand,
        load,
        write
    };
};
