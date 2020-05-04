/*jshint esversion: 6 */
var Store = require("./storage/file");

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

var noop = function () {};

var write = function (ctx, content) {
    if (!ctx.store) { return; }
    ctx.store.log(ctx.channelName, content, noop);
};

// various degrees of logging
const logLevels = Logger.levels = ['silly', 'verbose', 'debug', 'feedback', 'info', 'warn', 'error'];

var handlers = {};
['silly', 'debug', 'verbose', 'feedback', 'info'].forEach(function (level) {
    handlers[level] = function (ctx, content) { console.log(content); };
});
['warn', 'error'].forEach(function (level) {
    handlers[level] = function (ctx, content) { console.error(content); };
});

var noop = function () {};

var createLogType = function (ctx, type) {
    if (logLevels.indexOf(type) < logLevels.indexOf(ctx.logLevel)) {
        return noop;
    }
    return function (tag, info) {
        if (ctx.shutdown) {
            throw new Error("Logger has been shut down!");
        }
        var time = new Date().toISOString();
        var content;
        try {
            content = messageTemplate(type, time, tag, info);
        } catch (e) {
            return;
        }
        if (ctx.logToStdout && typeof(handlers[type]) === 'function') {
            handlers[type](ctx, content);
        }
        write(ctx, content);
    };
};

var createMethods = function (ctx) {
    var log = {};
    logLevels.forEach(function (type) {
        log[type] = createLogType(ctx, type);
    });
    return log;
};

Logger.create = function (config, cb) {
    if (typeof(config.logLevel) !== 'string') {
        config.logLevel = 'info';
    }

    var date = new Date();
    var launchTime = ('' + date.getUTCFullYear()).slice(-2) + date.toISOString();

    var ctx = {
        channelName: launchTime,
        logFeedback: Boolean(config.logFeedback),
        logLevel: config.logLevel,
        logToStdout: config.logToStdout,
    };

    if (!config.logPath) {
        console.log("No logPath configured. Logging to file disabled");
        var logger = createMethods(ctx);
        logger.shutdown = noop;
        return void cb(Object.freeze(logger));
    }

    Store.create({
        filePath: config.logPath,
    }, function (err, store) {
        if (err) {
            throw err;
        }
        ctx.store = store;
        var logger = createMethods(ctx);
        logger.shutdown = function () {
            delete ctx.store;
            ctx.shutdown = true;
            store.shutdown();
        };
        cb(Object.freeze(logger));
    });
};


