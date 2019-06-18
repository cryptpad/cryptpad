var nThen = require("nthen");

var Store = require("../storage/file");
var config = require("../lib/load-config");

var store;
var Log;
nThen(function (w) {
    // load the store which will be used for iterating over channels
    // and performing operations like archival and deletion
    Store.create(config, w(function (_) {
        store = _;
    }));

    // load the logging module so that you have a record of which
    // files were archived or deleted at what time
    var Logger = require("../lib/log");
    Logger.create(config, w(function (_) {
        Log = _;
    }));
}).nThen(function (w) {
    // count the number of files which have been restored in this run
    var conflicts = 0;

    var handler = function (err, item, cb) {
        if (err) {
            Log.error('DIAGNOSE_ARCHIVE_CONFLICTS_ITERATION', err);
            return void cb();
        }

        // check if such a file exists on the server
        store.isChannelAvailable(item.channel, function (err, available) {
            // weird edge case?
            if (err) { return void cb(); }

            // the channel doesn't exist in the database
            if (!available) { return void cb(); }

            // the channel is available
            // that means it's a duplicate of something in the archive
            conflicts++;
            Log.info('DIAGNOSE_ARCHIVE_CONFLICT_DETECTED', item.channel);
            cb();
        });
    };

    // if you hit an error, log it
    // otherwise, when there are no more channels to process
    // log some stats about how many were removed
    var done = function (err) {
        if (err) {
            return Log.error('DIAGNOSE_ARCHIVE_CONFLICTS_FINAL_ERROR', err);
        }
        Log.info('DIAGNOSE_ARCHIVE_CONFLICTS_COUNT', conflicts);
    };

    store.listArchivedChannels(handler, w(done));
}).nThen(function () {
    // the store will keep this script running if you don't shut it down
    store.shutdown();
    Log.shutdown();
});

