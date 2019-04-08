/*jshint esversion: 6 */
var Store = require("../storage/file");

var Logger = module.exports;

/* Every line in the log should contain:
    * timestamp
    * public key of initiator
    * the action
    * the event's tag
*/
var messageTemplate = function (type, time, tag, info) {
    return JSON.stringify([type.toUpperCase(), time, tag, info]);
};

var write = function (ctx, content) {
    ctx.store.log(ctx.channelName, content);
};

// various degrees of logging
const logLevels = ['silly', 'debug', 'verbose', 'feedback', 'info', 'warn', 'error'];

var handlers = {
    silly: function (ctx, time, tag, info) {
        console.log('[SILLY]', time, tag, info);
    },
    debug: function (ctx, time, tag, info) {
        console.log('[DEBUG]', time, tag, info);
    },
    verbose: function (ctx, time, tag, info) {
        console.log('[VERBOSE]', time, tag, info);
    },
    feedback: function (ctx, time, tag, info) {
        console.log('[FEEDBACK]', time, tag, info);
    },
    info: function (ctx, time, tag, info) {
        console.info('[INFO]', time, tag, info);
    },
    warn: function (ctx, time, tag, info) {
        console.warn('[WARN]', time, tag, info);
    },
    error: function (ctx, time, tag, info) {
        console.error('[ERROR]', time, tag, info);
    }
};

var createLogType = function (ctx, type) {
    return function (tag, info) {
        var time = new Date().toISOString();
        var content;
        try {
            content = messageTemplate(type, time, tag, info);
        } catch (e) {
            return;
        }

        if (ctx.logToStdout && typeof(handlers[type]) === 'function') {
            handlers[type](ctx, time, tag, info);
        }
        write(ctx, content);
    };
};

// Log.verbose('THING', x);
Logger.create = function (config, cb) {
    if (!config.logPath) {
        // XXX don't crash, print that you won't log to file
        throw new Error("Logger: Expected filePath");
    }

    /* config: {
        filePath: '???',
        logLevel: 'silly',
    } */

    var date = new Date();
    var launchTime = ('' + date.getUTCFullYear()).slice(-2) + date.toISOString();

    Store.create({
        filePath: config.logPath,
    }, function (store) {
        var ctx = {
            store: store,
            channelName: launchTime,
            logFeedback: Boolean(config.logFeedback),
    // TODO respect configured log settings
            logLevel: logLevels.indexOf(config.logLevel), // 0 for silly, 1 for debug
        };

        var log = {};
        logLevels.forEach(function (type) {
            log[type] = createLogType(ctx, type);
        });

        cb(Object.freeze(log));
    });
};


