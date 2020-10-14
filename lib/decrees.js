var Decrees = module.exports;

/*  Admin decrees which modify global server state

IMPLEMENTED:

RESTRICT_REGISTRATION(<boolean>)
UPDATE_DEFAULT_STORAGE(<number>)

// QUOTA MANAGEMENT
SET_QUOTA(<string:signkey>, limit)
RM_QUOTA(<string:signkey>)

// INACTIVITY
SET_INACTIVE_TIME
SET_ACCOUNT_RETENTION_TIME
SET_ARCHIVE_RETENTION_TIME

// UPLOADS
SET_MAX_UPLOAD_SIZE
SET_PREMIUM_UPLOAD_SIZE

// BACKGROUND PROCESSES
DISABLE_INTEGRATED_TASKS
DISABLE_INTEGRATED_EVICTION

NOT IMPLEMENTED:

// RESTRICTED REGISTRATION
ADD_INVITE
REVOKE_INVITE
REDEEM_INVITE

// 2.0
Env.adminEmail
Env.supportMailbox
Env.DEV_MODE || Env.FRESH_MODE,
*/

var commands = {};
/*  commands have a simple API:

* they receive the global Env and the arguments to be applied
* if the arguments are invalid the operation will not be applied
  * the command throws
* if the arguments are valid but do not result in a change, the operation is redundant.
  * return false
* if the arguments are valid and will result in a change, the operation should be applied
  * apply it
  * return true to indicate that it was applied

*/

var args_isBoolean = function (args) {
    return !(!Array.isArray(args) || typeof(args[0]) !== 'boolean');
};

// Toggles a simple boolean
var makeBooleanSetter = function (attr) {
    return function (Env, args) {
        if (!args_isBoolean(args)) {
            throw new Error('INVALID_ARGS');
        }
        var bool = args[0];
        if (bool === Env[attr]) { return false; }
        Env[attr] = bool;
        return true;
    };
};

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['RESTRICT_REGISTRATION', [true]]], console.log)
commands.RESTRICT_REGISTRATION = makeBooleanSetter('restrictRegistration');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['DISABLE_INTEGRATED_EVICTION', [true]]], console.log)
commands.DISABLE_INTEGRATED_EVICTION = makeBooleanSetter('disableIntegratedEviction');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['DISABLE_INTEGRATED_TASKS', [true]]], console.log)
commands.DISABLE_INTEGRATED_TASKS = makeBooleanSetter('disableIntegratedTasks');

/*
var isNonNegativeNumber = function (n) {
    return !(typeof(n) !== 'number' || isNaN(n) || n < 0);
};
*/

var isInteger = function (n) {
    return !(typeof(n) !== 'number' || isNaN(n) || (n % 1) !== 0);
};

var args_isInteger = function (args) {
    return !(!Array.isArray(args) || !isInteger(args[0]));
};

var makeIntegerSetter = function (attr) {
    return function (Env, args) {
        if (!args_isInteger(args)) {
            throw new Error('INVALID_ARGS');
        }
        var integer = args[0];
        if (integer === Env[attr]) { return false; }
        Env[attr] = integer;
        return true;
    };
};

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_MAX_UPLOAD_SIZE', [50 * 1024 * 1024]]], console.log)
commands.SET_MAX_UPLOAD_SIZE = makeIntegerSetter('maxUploadSize');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_PREMIUM_UPLOAD_SIZE', [150 * 1024 * 1024]]], console.log)
commands.SET_PREMIUM_UPLOAD_SIZE = makeIntegerSetter('premiumUploadSize');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['UPDATE_DEFAULT_STORAGE', [100 * 1024 * 1024]]], console.log)
commands.UPDATE_DEFAULT_STORAGE = makeIntegerSetter('defaultStorageLimit');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_LAST_EVICTION', [0]]], console.log)
commands.SET_LAST_EVICTION = makeIntegerSetter('lastEviction');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_INACTIVE_TIME', [90]]], console.log)
commands.SET_INACTIVE_TIME = makeIntegerSetter('inactiveTime');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_ARCHIVE_RETENTION_TIME', [30]]], console.log)
commands.SET_ARCHIVE_RETENTION_TIME = makeIntegerSetter('archiveRetentionTime');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_ACCOUNT_RETENTION_TIME', [365]]], console.log)
commands.SET_ACCOUNT_RETENTION_TIME = makeIntegerSetter('accountRetentionTime');

var Quota = require("./commands/quota");
var Keys = require("./keys");
var Util = require("./common-util");

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_QUOTA', ['[user@box:3000/VzeS4vP1DF+tXGuq1i50DKYuBL+09Yqy8kGxoUKRzhA=]', { limit: 2 * 1024 * 1024 * 1024, plan: 'buddy', note: "you're welcome" } ] ] ], console.log)
commands.SET_QUOTA = function (Env, args) {
    if (!Array.isArray(args) || args.length !== 2) {
        throw new Error("INVALID_ARGS");
    }

    var unsafeKey = Keys.canonicalize(args[0]);
    if (!unsafeKey) {
        throw new Error("INVALID_ARGS");
    }

    // make sure you're not overwriting an existing limit
    //if (Env.customLimits[unsafeKey]) { throw new Error("EEXISTS"); }

    var limit = args[1];
    if (!Quota.isValidLimit(limit)) { // do we really want this?
        throw new Error("INVALID_ARGS");
    }

    limit.origin = 'decree';
    // map the new limit to the user's unsafeKey
    Env.customLimits[unsafeKey] = limit;
    Env.limits[unsafeKey] = limit;

    return true;
};

commands.RM_QUOTA = function (Env, args) {
    if (!Array.isArray(args) || args.length !== 1) {
        throw new Error("INVALID_ARGS");
    }

    var unsafeKey = Keys.canonicalize(args[0]);
    if (!unsafeKey) {
        throw new Error("INVALID_ARGS");
    }
    if (!Env.customLimits[unsafeKey]) {
        throw new Error("ENOENT");
    }

    delete Env.customLimits[unsafeKey];
    delete Env.limits[unsafeKey];
    return true;
};

// [<command>, <args>, <author>, <time>]
var handleCommand = Decrees.handleCommand = function (Env, line) {
    var command = line[0];
    var args = line[1];

    if (typeof(commands[command]) !== 'function') {
        throw new Error("DECREE_UNSUPPORTED_COMMAND");
    }

    return commands[command](Env, args);
};

Decrees.createLineHandler = function (Env) {
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

var Fs = require("fs");
var Path = require("path");
var readFileBin = require("./stream-file").readFileBin;
var Schedule = require("./schedule");
var Fse = require("fs-extra");
var nThen = require("nthen");

Decrees.load = function (Env, _cb) {
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
            var decreeName = Path.join(Env.paths.decree, 'decree.ndjson');
            var stream = Fs.createReadStream(decreeName, {start: 0});
            var handler = Decrees.createLineHandler(Env);
            readFileBin(stream, function (msgObj, next) {
                var text = msgObj.buff.toString('utf8');
                try {
                    handler(void 0, JSON.parse(text));
                } catch (err) {
                    handler(err);
                }
                next();
            }, function (err) {
                done(err);
            });
        });
    });
};

Decrees.write = function (Env, decree, _cb) {
    var path = Path.join(Env.paths.decree, 'decree.ndjson');
    Env.scheduleDecree.ordered('', function (next) {
        var cb = Util.both(_cb, next);
        Fs.appendFile(path, JSON.stringify(decree) + '\n', cb);
    });
};
