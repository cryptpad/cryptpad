/* global process */

var nThen = require("nthen");

var Store = require("../lib/storage/file");
var BlobStore = require("../lib/storage/blob");
var Pins = require("../lib/pins");
var Bloom = require("@mcrowe/minibloom");
var config = require("../lib/load-config");

// the administrator should have set an 'inactiveTime' in their config
// if they didn't, just exit.
if (!config.inactiveTime || typeof(config.inactiveTime) !== "number") { return; }

// files which have not been changed since before this date can be considered inactive
var inactiveTime = +new Date() - (config.inactiveTime * 24 * 3600 * 1000);

// files which were archived before this date can be considered safe to remove
var retentionTime = +new Date() - (config.archiveRetentionTime * 24 * 3600 * 1000);

var getNewestTime = function (stats) {
    return stats[['atime', 'ctime', 'mtime'].reduce(function (a, b) {
        return stats[b] > stats[a]? b: a;
    })];
};

var store;
var pinStore;
var Log;
var blobs;

/*  It's fairly easy to know if a channel or blob is active
    but knowing whether it is pinned requires that we
    keep the set of pinned documents in memory.

    Some users will share the same set of documents in their pin lists,
    so the representation of pinned documents should scale sub-linearly
    with the number of users and pinned documents.

    That said, sub-linear isn't great...
    A Bloom filter is "a space-efficient probabilistic data structure"
    which lets us check whether an item is _probably_ or _definitely not_
    in a set. This is good enough for our purposes since we just want to
    know whether something can safely be removed and false negatives
    (not safe to remove when it actually is) are acceptable.

    We set our capacity to some large number, and the error rate to whatever
    we think is acceptable.
*/
var BLOOM_CAPACITY = (1 << 20) - 1; // over a million items
var BLOOM_ERROR = 1 / 1000;  // an error rate of one in a thousand

// we'll use one filter for the set of active documents
var activeDocs = Bloom.optimalFilter(BLOOM_CAPACITY, BLOOM_ERROR);
// and another one for the set of pinned documents
var pinnedDocs = Bloom.  optimalFilter(BLOOM_CAPACITY, BLOOM_ERROR);

var startTime = +new Date();
var msSinceStart = function ()  {
    return (+new Date()) - startTime;
};

var loadStorage = function (w) {
    // load the store which will be used for iterating over channels
    // and performing operations like archival and deletion
    Store.create(config, w(function (err, _) {
        if (err) {
            w.abort();
            throw err;
        }
        store = _;
    }));

    Store.create({
        filePath: config.pinPath,
    }, w(function (err, _) {
        if (err) {
            w.abort();
            throw err;
        }
        pinStore = _;
    }));

    // load the logging module so that you have a record of which
    // files were archived or deleted at what time
    var Logger = require("../lib/log");
    Logger.create(config, w(function (_) {
        Log = _;
    }));

    config.getSession = function () {};
    BlobStore.create(config, w(function (err, _) {
        if (err) {
            w.abort();
            return console.error(err);
        }
        blobs = _;
    }));
};

var removeArchivedChannels = function (w) {
    // this block will iterate over archived channels and removes them
    // if they've been in cold storage for longer than your configured archive time

    // if the admin has not set an 'archiveRetentionTime', this block makes no sense
    // so just skip it
    if (typeof(config.archiveRetentionTime) !== "number") { return; }

    // count the number of files which have been removed in this run
    var removed = 0;
    var accounts = 0;

    var handler = function (err, item, cb) {
        if (err) {
            Log.error('EVICT_ARCHIVED_CHANNEL_ITERATION', err);
            return void cb();
        }
        // don't mess with files that are freshly stored in cold storage
        // based on ctime because that's changed when the file is moved...
        if (+new Date(item.ctime) > retentionTime) {
            return void cb();
        }

        // but if it's been stored for the configured time...
        // expire it
        store.removeArchivedChannel(item.channel, w(function (err) {
            if (err) {
                Log.error('EVICT_ARCHIVED_CHANNEL_REMOVAL_ERROR', {
                    error: err,
                    channel: item.channel,
                });
                return void cb();
            }
            Log.info('EVICT_ARCHIVED_CHANNEL_REMOVAL', item.channel);

            if (item.channel.length === 32) {
                removed++;
            } else if (item.channel.length === 44) {
                accounts++;
            }

            cb();
        }));
    };

    // if you hit an error, log it
    // otherwise, when there are no more channels to process
    // log some stats about how many were removed
    var done = function (err) {
        if (err) {
            return Log.error('EVICT_ARCHIVED_FINAL_ERROR', err);
        }
        Log.info('EVICT_ARCHIVED_CHANNELS_REMOVED', removed);
        Log.info('EVICT_ARCHIVED_ACCOUNTS_REMOVED', accounts);
    };

    store.listArchivedChannels(handler, w(done));
};

var removeArchivedBlobProofs = function (w) {
    if (typeof(config.archiveRetentionTime) !== "number") { return; }
// Iterate over archive blob ownership proofs and remove them
// if they are older than the specified retention time
    var removed = 0;
    blobs.list.archived.proofs(function (err, item, next) {
        if (err) {
            Log.error("EVICT_BLOB_LIST_ARCHIVED_PROOF_ERROR", err);
            return void next();
        }
        if (item && getNewestTime(item) > retentionTime) { return void next(); }
        blobs.remove.archived.proof(item.safeKey, item.blobId, (function (err) {
            if (err) {
                Log.error("EVICT_ARCHIVED_BLOB_PROOF_ERROR", item);
                return void next();
            }
            Log.info("EVICT_ARCHIVED_BLOB_PROOF", item);
            removed++;
            next();
        }));
    }, w(function () {
        Log.info('EVICT_ARCHIVED_BLOB_PROOFS_REMOVED', removed);
    }));
};

var removeArchivedBlobs = function (w) {
    if (typeof(config.archiveRetentionTime) !== "number") { return; }
// Iterate over archived blobs and remove them
// if they are older than the specified retention time
    var removed = 0;
    blobs.list.archived.blobs(function (err, item, next) {
        if (err) {
            Log.error("EVICT_BLOB_LIST_ARCHIVED_BLOBS_ERROR", err);
            return void next();
        }
        if (item && getNewestTime(item) > retentionTime) { return void next(); }
        blobs.remove.archived.blob(item.blobId, function (err) {
            if (err) {
                Log.error("EVICT_ARCHIVED_BLOB_ERROR", item);
                return void next();
            }
            Log.info("EVICT_ARCHIVED_BLOB", item);
            removed++;
            next();
        });
    }, w(function () {
        Log.info('EVICT_ARCHIVED_BLOBS_REMOVED', removed);
    }));
};

var categorizeChannelsByActivity = function (w) {
    var channels = 0;
    var active = 0;
    var handler = function (err, item, cb) {
        channels++;
        if (err) {
            Log.error('EVICT_CHANNEL_CATEGORIZATION', err);
            return void cb();
        }

        // if the channel has been modified recently
        // we don't use mtime because we don't want to count access to the file, just modifications
        if (+new Date(item.mtime) > inactiveTime) {
            // add it to the set of activeDocs
            activeDocs.add(item.channel);
            active++;
            return void cb();
        }

        return void cb();
    };

    var done = function () {
        Log.info('EVICT_CHANNELS_CATEGORIZED', {
            active: active,
            channels: channels,
        });
    };

    store.listChannels(handler, w(done));
};

var categorizeBlobsByActivity = function (w) {
    var n_blobs = 0;
    var active = 0;

    blobs.list.blobs(function (err, item, next) {
        n_blobs++;
        if (err) {
            Log.error("EVICT_BLOB_CATEGORIZATION", err);
            return void next();
        }
        if (!item) {
            next();
            return void Log.error("EVICT_BLOB_CATEGORIZATION_INVALID", item);
        }
        if (getNewestTime(item) > inactiveTime) {
            activeDocs.add(item.blobId);
            active++;
            return void next();
        }
        next();
    }, w(function () {
        Log.info('EVICT_BLOBS_CATEGORIZED', {
            active: active,
            blobs: n_blobs,
        });
    }));
};

var categorizeAccountsByActivity = function (w) {
// iterate over all accounts
    var accounts = 0;
    var inactive = 0;

    var accountRetentionTime;
    if (typeof(config.accountRetentionTime) === 'number' && config.accountRetentionTime > 0) {
        accountRetentionTime = +new Date() - (24 * 3600 * 1000 * config.accountRetentionTime);
    } else {
        accountRetentionTime = -1;
    }

    var pinAll = function (pinList) {
        pinList.forEach(function (docId) {
            pinnedDocs.add(docId);
        });
    };

    var accountIsActive = function (mtime, pinList) {
        // if their pin log has changed recently then consider them active
        if (mtime && mtime > accountRetentionTime) {
            return true;
        }
        // otherwise iterate over their pinned documents until you find one that has been active
        return pinList.some(function (docId) {
            return activeDocs.test(docId);
        });
    };

    var PRESERVE_INACTIVE_ACCOUNTS = accountRetentionTime <= 0;

    // otherwise, we'll only retain data from active accounts
    // so we need more heuristics
    var handler = function (content, id, next) {
        accounts++;

        var mtime = content.latest;
        var pinList = Object.keys(content.pins);

        if (accountIsActive(mtime, pinList)) {
        // add active accounts' pinned documents to a second bloom filter
            pinAll(pinList);
            return void next();
        }

        // Otherwise they are inactive.
        // We keep track of how many accounts are inactive whether or not
        // we plan to delete them, because it may be interesting information
        inactive++;
        if (PRESERVE_INACTIVE_ACCOUNTS) {
            pinAll(pinList);
            return void next();
        }

        // remove the pin logs of inactive accounts if inactive account removal is configured
        pinStore.archiveChannel(id, function (err) {
            if (err) {
                Log.error('EVICT_INACTIVE_ACCOUNT_PIN_LOG', err);
                return void next();
            }
            Log.info('EVICT_INACTIVE_ACCOUNT_LOG', id);
            next();
        });
    };

    var done = function () {
        var label = PRESERVE_INACTIVE_ACCOUNTS?
            "EVICT_COUNT_ACCOUNTS":
            "EVICT_INACTIVE_ACCOUNTS";

        Log.info(label, {
            accounts: accounts,
            inactive: inactive,
        });
    };

    Pins.load(w(done), {
        pinPath: config.pinPath,
        handler: handler,
    });
};

var archiveInactiveBlobs = function (w) {
// iterate over blobs and remove them
// if they have not been accessed within the specified retention time
    var removed = 0;
    blobs.list.blobs(function (err, item, next) {
        if (err) {
            Log.error("EVICT_BLOB_LIST_BLOBS_ERROR", err);
            return void next();
        }
        if (!item) {
            next();
            return void Log.error('EVICT_BLOB_LIST_BLOBS_NO_ITEM', item);
        }
        if (pinnedDocs.test(item.blobId)) { return void next(); }
        if (activeDocs.test(item.blobId)) { return void next(); }

        blobs.archive.blob(item.blobId, function (err) {
            if (err) {
                Log.error("EVICT_ARCHIVE_BLOB_ERROR", {
                    error: err,
                    item: item,
                });
                return void next();
            }
            Log.info("EVICT_ARCHIVE_BLOB", {
                item: item,
            });
            removed++;
            next();
        });
    }, w(function () {
        Log.info('EVICT_BLOBS_REMOVED', removed);
    }));
};

var archiveInactiveBlobProofs = function (w) {
// iterate over blob proofs and remove them
// if they don't correspond to a pinned or active file
    var removed = 0;
    blobs.list.proofs(function (err, item, next) {
        if (err) {
            next();
            return void Log.error("EVICT_BLOB_LIST_PROOFS_ERROR", err);
        }
        if (!item) {
            next();
            return void Log.error('EVICT_BLOB_LIST_PROOFS_NO_ITEM', item);
        }
        if (pinnedDocs.test(item.blobId)) { return void next(); }
        if (getNewestTime(item) > inactiveTime) { return void next(); }
        nThen(function (w) {
            blobs.size(item.blobId, w(function (err, size) {
                if (err) {
                    w.abort();
                    next();
                    return void Log.error("EVICT_BLOB_LIST_PROOFS_ERROR", err);
                }
                if (size !== 0) {
                    w.abort();
                    next();
                }
            }));
        }).nThen(function () {
            blobs.remove.proof(item.safeKey, item.blobId, function (err) {
                next();
                if (err) {
                    return Log.error("EVICT_BLOB_PROOF_LONELY_ERROR", item);
                }
                removed++;
                return Log.info("EVICT_BLOB_PROOF_LONELY", item);
            });
        });
    }, w(function () {
        Log.info("EVICT_BLOB_PROOFS_REMOVED", removed);
    }));
};

var archiveInactiveChannels = function (w) {
    var channels = 0;
    var archived = 0;

    var handler = function (err, item, cb) {
        channels++;
        if (err) {
            Log.error('EVICT_CHANNEL_ITERATION', err);
            return void cb();
        }
        // check if the database has any ephemeral channels
        // if it does it's because of a bug, and they should be removed
        if (item.channel.length === 34) {
            return void store.removeChannel(item.channel, w(function (err) {
                if (err) {
                    Log.error('EVICT_EPHEMERAL_CHANNEL_REMOVAL_ERROR', {
                        error: err,
                        channel: item.channel,
                    });
                    return void cb();
                }
                Log.info('EVICT_EPHEMERAL_CHANNEL_REMOVAL', item.channel);
                cb();
            }));
        }

        // bail out if the channel is in the set of activeDocs
        if (activeDocs.test(item.channel)) { return void cb(); }

        // ignore the channel if it's pinned
        if (pinnedDocs.test(item.channel)) { return void cb(); }

        return void store.archiveChannel(item.channel, w(function (err) {
            if (err) {
                Log.error('EVICT_CHANNEL_ARCHIVAL_ERROR', {
                    error: err,
                    channel: item.channel,
                });
                return void cb();
            }
            Log.info('EVICT_CHANNEL_ARCHIVAL', item.channel);
            archived++;
            cb();
        }));
    };

    var done = function () {
        return void Log.info('EVICT_CHANNELS_ARCHIVED', archived);
    };

    store.listChannels(handler, w(done), true); // using a hacky "fast mode" since we only need the channel id
};

nThen(loadStorage)
.nThen(function () {
    Log.info("EVICT_TIME_TO_LOAD_PINS", msSinceStart());
})
.nThen(removeArchivedChannels)
.nThen(removeArchivedBlobProofs)
.nThen(removeArchivedBlobs)

// iterate over all documents and add them to a bloom filter if they have been active
.nThen(categorizeChannelsByActivity)
.nThen(categorizeBlobsByActivity)

// iterate over all accounts and add them to a bloom filter if they are active
.nThen(categorizeAccountsByActivity)

// iterate again and archive inactive unpinned documents
    // (documents which are not in either bloom filter)

.nThen(archiveInactiveBlobs)
.nThen(archiveInactiveBlobProofs)
.nThen(archiveInactiveChannels)
.nThen(function () {
    Log.info("EVICT_TIME_TO_RUN_SCRIPT", msSinceStart());
}).nThen(function () {
    // the store will keep this script running if you don't shut it down
    store.shutdown();
    Log.shutdown();
    pinStore.shutdown();
    process.exit();

});

