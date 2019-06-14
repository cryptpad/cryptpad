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
    var restored = 0;

    var handler = function (err, item, cb) {
        if (err) {
            Log.error('RESTORE_ARCHIVED_CHANNEL_ITERATION', err);
            return void cb();
        }

        store.restoreArchivedChannel(item.channel, w(function (err) {
            if (err) {
                Log.error('RESTORE_ARCHIVED_CHANNEL_RESTORATION_ERROR', {
                    error: err,
                    channel: item.channel,
                });
                return void cb();
            }
            Log.info('RESTORE_ARCHIVED_CHANNEL_RESTORATION', item.channel);
            restored++;
            cb();
        }));
    };

    // if you hit an error, log it
    // otherwise, when there are no more channels to process
    // log some stats about how many were removed
    var done = function (err) {
        if (err) {
            return Log.error('RESTORE_ARCHIVED_FINAL_ERROR', err);
        }
        Log.info('RESTORE_ARCHIVED_CHANNELS_RESTORED', restored);
    };

    store.listArchivedChannels(handler, w(done));
}).nThen(function () {
    // the store will keep this script running if you don't shut it down
    store.shutdown();
    Log.shutdown();
});

