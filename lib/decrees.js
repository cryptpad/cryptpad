var Decrees = module.exports;

/*  Admin decrees which modify global server state

IMPLEMENTED:

RESTRICT_REGISTRATION(<boolean>)
UPDATE_DEFAULT_STORAGE(<number>)

// QUOTA MANAGEMENT
SET_QUOTA(<string:signkey>, limit)
RM_QUOTA(<string:signkey>)

NOT IMPLEMENTED:

// RESTRICTED REGISTRATION
ADD_INVITE
REVOKE_INVITE
REDEEM_INVITE

// 2.0
UPDATE_INACTIVE_TIME
UPDATE_ACCOUNT_RETENTION_TIME
UPDATE_ARCHIVE_RETENTION_TIME

// 3.0
UPDATE_MAX_UPLOAD_SIZE
UPDATE_PREMIUM_UPLOAD_SIZE

// 4.0
Env.adminEmail
Env.supportMailbox
Env.DEV_MODE || Env.FRESH_MODE,
Env.maxUploadSize
Env.premiumUploadSize
Env.disableIntegratedTasks
Env.disableIntegratedEviction

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

// Toggles a simple boolean
// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['RESTRICT_REGISTRATION', [true]]], console.log)
commands.RESTRICT_REGISTRATION = function (Env, args) {
    if (!Array.isArray(args) || typeof(args[0]) !== 'boolean') {
        throw new Error('INVALID_ARGS');
    }
    var bool = args[0];
    if (bool === Env.restrictRegistration) { return false; }
    Env.restrictRegistration = bool;
    return true;
};

var isNonNegativeNumber = function (n) {
    return !(typeof(n) !== 'number' || isNaN(n) || n < 0);
};

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['UPDATE_DEFAULT_STORAGE', [100 * 1024 * 1024]]], console.log)
commands.UPDATE_DEFAULT_STORAGE = function (Env, args) {
    if (!Array.isArray(args) || !isNonNegativeNumber(args[0])) {
        throw new Error('INVALID_ARGS');
    }
    var limit = args[0];
    if (limit === Env.defaultStorageLimit) { return false; }
    Env.defaultStorageLimit = limit;
    return true;
};

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

Decrees.load = function (Env, cb) {
    Env.scheduleDecree = Env.scheduleDecree || Schedule();

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
