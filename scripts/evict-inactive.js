var nThen = require("nthen");

var Store = require("../storage/file");
var Pinned = require("./pinned");
var config = require("../lib/load-config");

// the administrator should have set an 'inactiveTime' in their config
// if they didn't, just exit.
if (!config.inactiveTime || typeof(config.inactiveTime) !== "number") { return; }

// files which have not been changed since before this date can be considered inactive
var inactiveTime = +new Date() - (config.inactiveTime * 24 * 3600 * 1000);

// files which were archived before this date can be considered safe to remove
var retentionTime = +new Date() - (config.archiveRetentionTime * 24 * 3600 * 1000);

var store;
var pins;
var Log;
nThen(function (w) {
    // load the store which will be used for iterating over channels
    // and performing operations like archival and deletion
    Store.create(config, w(function (_) {
        store = _;
    })); // load the list of pinned files so you know which files
    // should not be archived or deleted
    Pinned.load(function (err, _) {
        if (err) {
            w.abort();
            return void console.error(err);
        }
        pins = _;
    }, {
        pinPath: config.pinPath,
    });

    // load the logging module so that you have a record of which
    // files were archived or deleted at what time
    var Logger = require("../lib/log");
    Logger.create(config, w(function (_) {
        Log = _;
    }));
}).nThen(function (w) {
    // this block will iterate over archived channels and remove them
    // if they've been in cold storage for longer than your configured archive time

    // if the admin has not set an 'archiveRetentionTime', this block makes no sense
    // so just skip it
    if (typeof(config.archiveRetentionTime) !== "number") { return; }

    // count the number of files which have been removed in this run
    var removed = 0;

    var handler = function (err, item) {
        if (err) { return void Log.error('EVICT_ARCHIVED_CHANNEL_ITERATION', err); }
        // don't mess with files that are freshly stored in cold storage
        // based on ctime because that's changed when the file is moved...
        if (+new Date(item.ctime) > retentionTime) { return; }

        // but if it's been stored for the configured time...
        // expire it
        store.removeArchivedChannel(item.channel, w(function (err) {
            if (err) {
                return void Log.error('EVICT_ARCHIVED_CHANNEL_REMOVAL_ERROR', {
                    error: err,
                    channel: item.channel,
                });
            }
            console.log("removed %s from cold storage", item.channel);
            Log.info('EVICT_ARCHIVED_CHANNEL_REMOVAL', item.channel);
            removed++;
        }));
    };

    // if you hit an error, log it
    // otherwise, when there are no more channels to process
    // log some stats about how many were removed
    var cb = function (err) {
        if (err) {
            return Log.error('EVICT_ARCHIVED_FINAL_ERROR', err);
        }
        Log.info('EVICT_ARCHIVED_CHANNELS_REMOVED', removed);
    };

    store.listArchivedChannels(handler, w(cb));
}).nThen(function (w) {
    var removed = 0;
    var channels = 0;
    var archived = 0;

    var handler = function (err, item) {
        channels++;
        if (err) { return void Log.error('EVICT_CHANNEL_ITERATION', err); }
        // check if the database has any ephemeral channels
        // if it does it's because of a bug, and they should be removed
        if (item.channel.length === 34) {
            return void store.removeChannel(item.channel, w(function (err) {
                if (err) {
                    return void Log.error('EVICT_EPHEMERAL_CHANNEL_REMOVAL_ERROR', {
                        error: err,
                        channel: item.channel,
                    });
                }
                Log.info('EVICT_EPHEMERAL_CHANNEL_REMOVAL', item.channel);
            }));
        }

        // bail out if the channel was modified recently
        if (+new Date(item.mtime) > inactiveTime) { return; }

        // ignore the channel if it's pinned
        if (pins[item.channel]) { return; }

        // if the server is configured to retain data, archive the channel
        if (config.retainData) {
            store.archiveChannel(item.channel, w(function (err) {
                if (err) { return void Log.error('EVICT_CHANNEL_ARCHIVAL_ERROR', {
                    error: err,
                    channel: item.channel,
                }); }
                Log.info('EVICT_CHANNEL_ARCHIVAL', item.channel);
                archived++;
            }));
            return;
        }

        // otherwise remove it
        store.removeChannel(item.channel, w(function (err) {
            if (err) { return void Log.error('EVICT_CHANNEL_REMOVAL_ERROR', {
                error: err,
                channel: item.channel,
            }); }
            Log.info('EVICT_CHANNEL_REMOVAL', item.channel);
            removed++;
        }));
    };

    var cb = function () {
        if (config.retainData) {
            return void Log.info('EVICT_CHANNELS_ARCHIVED', archived);
        }
        return void Log.info('EVICT_CHANNELS_REMOVED', removed);
    };

    store.listChannels(handler, w(cb));
}).nThen(function () {
    // the store will keep this script running if you don't shut it down
    store.shutdown();
});

