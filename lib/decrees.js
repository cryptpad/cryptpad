var Decrees = module.exports;

/*  Admin decrees which modify global server state

IMPLEMENTED:

RESTRICT_REGISTRATION(<boolean>)
UPDATE_DEFAULT_STORAGE(<number>)

NOT IMPLEMENTED:

// QUOTA MANAGEMENT
ADD_QUOTA
RM_QUOTA(<string: unsafekey>)
UPDATE_QUOTA

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
    if (!Array.isArray(args) || isNonNegativeNumber(args[0])) {
        throw new Error('INVALID_ARGS');
    }
    var limit = args[0];
    if (limit === Env.defaultStorageLimit) { return false; }
    Env.defaultStorageLimit = limit;
    return true;
};

//var Quota = require("./commands/quota");

commands.ADD_QUOTA = function (Env, args) {
    args = args;
    throw new Error("NOT_IMPLEMENTED");
};

commands.RM_QUOTA = function (Env, args) {
    args = args;
    throw new Error("NOT_IMPLEMENTED");
};

commands.UPDATE_QUOTA = function (Env, args) {
    args = args;
    throw new Error("NOT_IMPLEMENTED");
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
var Util = require("./common-util");
var Schedule = require("./schedule");

Decrees.load = function (Env, cb) {
    Env.scheduleDecree = Env.scheduleDecree || Schedule();

    var decreeName = Path.join(Env.paths.decree, 'decree.ndjson'); // XXX mkdirp

    var stream = Fs.createReadStream(decreeName, {start: 0});

    var handler = Decrees.createLineHandler(Env);

    Env.scheduleDecree.blocking('', function (unblock) {
        var done = Util.once(Util.both(cb, unblock));
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
};

Decrees.write = function (Env, decree, _cb) {
    var path = Path.join(Env.paths.decree, 'decree.ndjson');
    Env.scheduleDecree.ordered('', function (next) {
        var cb = Util.both(_cb, next);
        Fs.appendFile(path, JSON.stringify(decree) + '\n', cb);
    });
};
