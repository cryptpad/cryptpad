// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later
const Store = require("./storage/file");
const Util = require("../src/common/common-util");
const Path = require("node:path");

// various degrees of logging
const logLevels = ['silly', 'verbose', 'debug', 'feedback', 'info', 'warn', 'error'];
const handlers = {};

const messageTemplate = (type, time, tag, info, nodeId) => {
    return JSON.stringify([type.toUpperCase(), time, nodeId, tag, info]);
};

const getDateString = () => {
    const now = new Date();
    return now.toLocaleDateString(void 0, { month: "2-digit" }) + now.toLocaleDateString('en-CA');
};

const noop = function() {
    const args = Array.prototype.slice.call(arguments);
    if (!args.length) { return; }
    let cb = args.pop();
    if (typeof(cb) !== 'function') { return; }
    if (cb) { setTimeout(cb); }
};

const write = function (ctx, content, cb) {
    if (!ctx.store) { return setTimeout(cb); }
    ctx.store.log(`${getDateString()}-${ctx.logId}`, content, cb);
};

['silly', 'debug', 'verbose', 'feedback', 'info'].forEach((level) => {
    handlers[level] =  console.log;
});
handlers['warn'] = console.warn;
handlers['error'] = console.error;

const createLogType = function (ctx, type) {
    if (logLevels.indexOf(type) < logLevels.indexOf(ctx.logLevel)) {
        return noop;
    }
    // arguments: tag, info1, info2, ..., cb
    return function () {
        const args = Array.prototype.slice.call(arguments);
        const tag = args.shift();
        let cb = args.pop();
        if (typeof (cb) !== 'function') {
            args.push(cb);
            cb = () => {};
        }
        if (ctx.shutdown) { return; }
        const time = new Date().toISOString();
        const info = args.length === 1 ? args[0] : args;
        let content;
        try {
            content = messageTemplate(type, time, tag, info, ctx.myId);
        } catch (e) {
            return;
        }
        if (ctx.logToStdout && typeof(handlers[type]) === 'function') {
            handlers[type](content);
        }
        ctx.onReady?.reg(() => {
            write(ctx, content, cb);
        });
    };
};

const createMethods = function (ctx) {
    const log = {};
    logLevels.forEach(function (type) {
        log[type] = createLogType(ctx, type);
    });

    return log;
};


const Logger = (loggerConfig, myId) => {
    loggerConfig ||= {};
    const logId = myId ? myId.split(':')?.[0] : 'unknown';
    if (typeof(loggerConfig?.logLevel) !== 'string') {
        loggerConfig.logLevel = 'info';
    }

    const ctx = {
        logFeedback: Boolean(loggerConfig.logFeedback),
        logLevel: loggerConfig.logLevel,
        logToStdout: loggerConfig.logToStdout,
        logPath: loggerConfig.logPath,
        logId,
        myId,
    };

    if (!loggerConfig.logPath) {
        console.log(`${myId}: No logPath configured. Logging to file disabled`);
        const logger = createMethods(ctx);
        logger.shutdown = () => {};
        return logger;
    }

    ctx.onReady = Util.mkEvent(true);
    // XXX: there can be a bit of an overlap during year changes before
    // restarting the service
    const year = (new Date()).getFullYear().toString();

    Store.create({
        filePath: Path.join(loggerConfig.logPath, year),
        archivePath: loggerConfig.archivePath,
    }, function (err, store) {
        if (err) {
            throw err;
        }
        ctx.store = store;
        ctx.onReady.fire();
    });

    const logger = createMethods(ctx);
    logger.shutdown = () => {
        delete ctx.store;
        ctx.shutdown = true;
        ctx.store.shutdown();
    };
    return Object.freeze(logger);
};

module.exports = Logger;
