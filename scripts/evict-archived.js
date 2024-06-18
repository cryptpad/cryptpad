// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

var Eviction = require("../lib/eviction");
var nThen = require("nthen");
var Store = require("../lib/storage/file");
var BlobStore = require("../lib/storage/blob");

var Quota = require("../lib/commands/quota");
var Environment = require("../lib/env");
var Decrees = require("../lib/decrees");

var config = require("../lib/load-config");

var Env = Environment.create(config);

// Set DRY_RUN to true to run the script without deleting anything. A log file
// will be created.
Env.DRY_RUN = false;

var loadPremiumAccounts = function (Env, cb) {
    nThen(function (w) {
        // load premium accounts
        Quota.updateCachedLimits(Env, w(function (err) {
            if (err) {
                Env.Log.error('EVICT_LOAD_PREMIUM_ACCOUNTS', {
                    error: err,
                });
            }
        }));
    }).nThen(function (w) {
        // load and apply decrees
        Decrees.load(Env, w(function (err) {
            if (err) {
                Env.Log.error('EVICT_LOAD_DECREES', {
                    error: err.code || err,
                    message: err.message,
                });
            }
        }));
    }).nThen(function () {
        //console.log(Env.limits);
        cb();
    });
};

var prepareEnv = function (Env, cb) {
    //Quota.applyCustomLimits(Env);

    nThen(function (w) {
        /*  Database adaptors
         */

        // load the store which will be used for iterating over channels
        // and performing operations like archival and deletion
        Store.create(config, w(function (err, _) {
            if (err) {
                w.abort();
                throw err;
            }
            Env.store = _;
        }));

        Store.create({
            filePath: config.pinPath,
            // archive pin logs to their own subpath
            volumeId: 'pins',
        }, w(function (err, _) {
            if (err) {
                w.abort();
                throw err;
            }
            Env.pinStore = _;
        }));

        // load the logging module so that you have a record of which
        // files were archived or deleted at what time
        var Logger = require("../lib/log");
        Logger.create(config, w(function (_) {
            Env.Log = _;
        }));

        config.getSession = function () {};
        BlobStore.create(config, w(function (err, _) {
            if (err) {
                w.abort();
                return console.error(err);
            }
            Env.blobStore = _;
        }));
    }).nThen(function (w) {
        loadPremiumAccounts(Env, w(function (/* err */) {
            //if (err) { }
        }));
    }).nThen(function () {
        cb();
    });
};

//console.log("starting");
nThen(function (w) {
    // load database adaptors and configuration values into the environment
    prepareEnv(Env, w(function () {
        //console.log("env prepared");

    }));
}).nThen(function (w) {
    Eviction.archived(Env, w(function (err, report) {
        if (!report) { return; }
        Env.Log.info('EVICT_ARCHIVED_FINAL_REPORT', report);
    }));
});
