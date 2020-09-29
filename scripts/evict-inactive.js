var Eviction = require("../lib/eviction");
var nThen = require("nthen");
var Store = require("../lib/storage/file");
var BlobStore = require("../lib/storage/blob");

var Env = {
    config: require("../lib/load-config"),
};

var prepareEnv = function (Env, cb) {
    var config = Env.config;
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
    }).nThen(function () {
        cb();
    });
};

var shutdown = function (Env) {
    // the store will keep this script running if you don't shut it down
    Env.store.shutdown();
    Env.Log.shutdown();
    Env.pinStore.shutdown();
};

nThen(function (w) {
    // load database adaptors and configuration values into the environment
    prepareEnv(Env, w(function () {


    }));
}).nThen(function (w) {
    Eviction(Env, w(function () {

    }));
}).nThen(function () {
    // shut down database adaptors
    shutdown(Env);
});
