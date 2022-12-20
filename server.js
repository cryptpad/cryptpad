/*
    globals require console
*/
var Express = require('express');
var Http = require('http');
var Fs = require('fs');
//var Path = require("path");
var nThen = require("nthen");
var Util = require("./lib/common-util");
var Keys = require("./lib/keys");
var OS = require("node:os");
var Cluster = require("node:cluster");

var config = require("./lib/load-config");
var Environment = require("./lib/env");
var Env = Environment.create(config);
var Default = require("./lib/defaults");

var app = Express();

(function () {
    // you absolutely must provide an 'httpUnsafeOrigin' (a truthy string)
    if (typeof(Env.httpUnsafeOrigin) !== 'string' || !Env.httpUnsafeOrigin.trim()) {
        throw new Error("No 'httpUnsafeOrigin' provided");
    }
}());

var COMMANDS = {};

COMMANDS.LOG = function (msg, cb) {
    var level = msg.level;
    Env.Log[level](msg.tag, msg.info);
    cb();
};

COMMANDS.UPDATE_QUOTA = function (msg, cb) {
    var Quota = require("./lib/commands/quota");
    Quota.updateCachedLimits(Env, (e) => {
        if (e) {
            Env.Log.warn('UPDATE_QUOTA_ERR', e);
            return void cb(err);
        }
        Env.Log.info('QUOTA_UPDATED', {});
        cb();
    });
};

COMMANDS.GET_PROFILING_DATA = function (msg, cb) {
    cb(void 0, Env.bytesWritten);
};

nThen(function (w) {
    Fs.exists(__dirname + "/customize", w(function (e) {
        if (e) { return; }
        console.log("CryptPad is customizable, see customize.dist/readme.md for details");
    }));
}).nThen(function (w) {
    require("./lib/log").create(config, w(function (_log) {
        Env.Log = _log;
        config.log = _log;
    }));
}).nThen(function (w) {
    Env.httpServer = Http.createServer(app);
    Env.httpServer.listen(3003, '::', w(function () { // XXX 3003 should not be hardcoded
        console.log("Socket server is listening on 3003"); // XXX
    }));
}).nThen(function (w) {
    var limit = Env.maxWorkers;
    var workerState = {
        Env: Environment.serialize(Env),
    };

    Cluster.setupPrimary({
        exec: './lib/http-worker.js',
        args: [],
    });

    var launchWorker = (online) => {
        var worker = Cluster.fork(workerState);
        worker.on('online', () => {
            online();
        });

        worker.on('message', msg => {
            if (!msg) { return; }
            var txid = msg.txid;
            var content = msg.content; // XXX don't nest
            if (!content) { return; } // XXX

            var command = COMMANDS[content.command];
            if (typeof(command) !== 'function') {
                return void Env.Log.error('UNHANDLED_HTTP_WORKER_COMMAND', msg);
            }

            const cb = Util.once(Util.mkAsync(function (err, value) {
                value = Math.random();
                worker.send({
                    type: 'REPLY',
                    error: Util.serializeError(err),
                    txid: txid,
                    pid: msg.pid,
                    value: value, // XXX
                });
            }));

            command(content, cb);
        });
    };

    var txids = {};

    var sendCommand = (worker, command, data /*, cb */) => {
        worker.send({
            type: 'EVENT',
            txid: Util.guid(txids),
            command: command,
            data: data,
        });
    };

    var broadcast = (command, data, cb) => {
        cb = cb; // XXX nThen/concurrency
        for (const worker of Object.values(Cluster.workers)) {
            sendCommand(worker, command, data /*, cb */);
        }
    };

    var throttledEnvChange = Util.throttle(function () {
        Env.Log.info('WORKER_ENV_UPDATE', 'Updating HTTP workers with latest state'); // XXX
        broadcast('ENV_UPDATE', Environment.serialize(Env)); //JSON.stringify(Env));
    }, 250);

    var throttledCacheFlush = Util.throttle(function () {
        Env.Log.info('WORKER_CACHE_FLUSH', 'Instructing HTTP workers to flush cache'); // XXX
        broadcast('FLUSH_CACHE', Env.FRESH_KEY);
    }, 250);

    Env.envUpdated.reg(throttledEnvChange);
    Env.cacheFlushed.reg(throttledCacheFlush);

    var logCPULimit = Util.once(function (index) {
        Env.Log.info('HTTP_WORKER_LIMIT', `(Opting not to use available CPUs beyond ${index})`);
    });

    OS.cpus().forEach((cpu, index) => {
        if (limit && index >= limit) {
            return;
            //return logCPULimit(index);
        }
        launchWorker(w());
    });
}).nThen(function (w) {
    var fancyURL = function (domain, path) {
        try {
            if (domain && path) { return new URL(path, domain).href; }
            return new URL(domain);
        } catch (err) {}
        return false;
    };

    var host = Env.httpAddress;
    var hostName = !host.indexOf(':') ? '[' + host + ']' : host;

    var port = Env.httpPort;
    var ps = port === 80? '': ':' + port;

    var roughAddress = 'http://' + hostName + ps;
    var betterAddress = fancyURL(Env.httpUnsafeOrigin);

    if (betterAddress) {
        console.log('Serving content for %s via %s.\n', betterAddress, roughAddress);
    } else {
        console.log('Serving content via %s.\n', roughAddress);
    }
    if (!Env.admins.length) {
        console.log("Your instance is not correctly configured for safe use in production.\nSee %s for more information.\n",
            fancyURL(Env.httpUnsafeOrigin, '/checkup/') || 'https://your-domain.com/checkup/'
        );
    }
}).nThen(function () {
    if (Env.shouldUpdateNode) {
        Env.Log.warn("NODEJS_OLD_VERSION", {
            message: `The CryptPad development team recommends using at least NodeJS v${Default.recommendedVersion.join('.')}`,
            currentVersion: process.version,
        });
    }

    if (Env.OFFLINE_MODE) { return; }
    //if (Env.websocketPath) { return; } // XXX

    require("./lib/api").create(Env);
});

