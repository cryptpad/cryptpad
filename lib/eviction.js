// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

var nThen = require("nthen");
var Bloom = require("@mcrowe/minibloom");
var Util = require("../lib/common-util");
var Pins = require("../lib/pins");
var Keys = require("./keys");
var Path = require('node:path');
var config = require("./load-config");
var Fs = require("node:fs");
var Fse = require("fs-extra");

var getNewestTime = function (stats) {
    return stats[['atime', 'ctime', 'mtime'].reduce(function (a, b) {
        return stats[b] > stats[a]? b: a;
    })];
};

/*

Env = {
    limits: {
        <unsafeKey>: <limit>,
    },
    archiveRetentionTime: <number of days>,
    accountRetentionTime: <number of days>,
    inactiveTime: <number of days>,
    paths: {
        pin: <path to pin storage>
    },
    store,
    pinStore,
    Log,
    blobStore,
};

*/

// the number of ms artificially introduced between CPU-intensive operations
var THROTTLE_FACTOR = 10;
var PROGRESS_FACTOR = 1000;

var evictArchived = function (Env, cb) {
    var Log;
    var store;
    var blobs;
    var retentionTime = +new Date() - (Env.archiveRetentionTime * 24 * 3600 * 1000);

    var report = {
        // archivedChannelsRemoved,
        // archivedAccountsRemoved,
        // archivedBlobProofsRemoved,
        // archivedBlobsRemoved,

        // totalChannels,
        // activeChannels,

        // totalBlobs,
        // activeBlobs,

        // totalAccounts,
        // activeAccounts,

        // channelsArchived,

        launchTime: +new Date(),
        // runningTime,
    };



    var loadStorage = function () {
        store = Env.store;
        Log = Env.Log;
        blobs = Env.blobStore;
    };

    var migrateBlobRoot = function (from, to) {
        // only migrate subpaths, leave everything else alone
        if (!Path.dirname(from).startsWith(Path.dirname(to))) { return; }

        // expects a directory
        var recurse = function (relativePath) {
            var src = Path.join(from, relativePath);
            var children;
            try {
                children = Fs.readdirSync(src);
            } catch (err) {
                if (err.code === 'ENOENT') { return; }
                // if you can't read a directory's contents
                // then nothing else will work, so just abort
                Log.verbose("EVICT_ARCHIVED_NOT_DIRECTORY", {
                    error: err,
                });
                return;
            }

            var dest;
            if (children.length === 0) {
                try {
                    Fse.removeSync(src);
                } catch (err2) {
                    Log.error('EVICT_ARCHIVED_EMPTY_DIR_REMOVAL', {
                        error: err2,
                    });
                    // removal is non-essential, so we can continue
                }
            } else {
                // make an equivalent path in the target directory
                dest = Path.join(to, relativePath);

                try {
                    Fse.mkdirpSync(dest);
                } catch (err3) {
                    Log.error("EVICT_ARCHIVED_BLOB_MIGRATION", {
                        error: err3,
                    });

                    // failure to create the host directory
                    // will cause problems when we try to move
                    // so bail out here
                    return;
                }
            }

            children.forEach(function (child) {
                var childSrcPath = Path.join(src, child);
                var stat = Fs.statSync(childSrcPath);
                if (stat.isDirectory()) {
                    return void recurse(Path.join(relativePath, child));
                }

                var childDestPath = Path.join(dest, child);

                try {
                    Log.verbose("EVICT_ARCHIVED_MOVE_FROM_DEPRECATED_PATH", {
                        from: childSrcPath,
                        to: childDestPath,
                    });
                    Fse.moveSync(childSrcPath, childDestPath, {
                        overwrite: false,
                    });
                } catch (err4) {
                    Log.error('EVICT_ARCHIVED_MOVE_FAILURE', {
                        error: err4,
                    });
                }
            });
        };
        recurse('');
    };

/*  In CryptPad 5.2.0 we merged a patch which converted
    all of CryptPad's root filepaths to their absolute form,
    rather than the relative paths we'd been using until then.
    Unfortunately, we overlooked a case where two absolute
    paths were concatenated together, resulting in blobs being
    archived to an incorrect path.

    This migration detects evidence of incorrect archivals
    and moves such archived files to their intended location
    before continuing with the normal eviction procedure.
*/
    var migrateIncorrectBlobs = function () {
        var incorrectPaths = [
            Path.join(Env.paths.archive, config.blobPath),
            Path.join(Env.paths.archive, Path.resolve(config.blobPath))
        ];
        var correctPath = Path.join(Env.paths.archive, 'blob');
        incorrectPaths.forEach(root => {
            migrateBlobRoot(root, correctPath);
        });
    };

    var removeArchivedChannels = function (w) {
        // this block will iterate over archived channels and removes them
        // if they've been in cold storage for longer than your configured archive time

        // if the admin has not set an 'archiveRetentionTime', this block makes no sense
        // so just skip it
        if (typeof(Env.archiveRetentionTime) !== "number") { return; }

        // count the number of files which have been removed in this run
        var removed = 0;
        var accounts = 0;

        var handler = function (err, item, cb) {
            if (err) {
                return Log.error('EVICT_ARCHIVED_CHANNEL_ITERATION', err, cb);
            }
            // don't mess with files that are freshly stored in cold storage
            // based on ctime because that's changed when the file is moved...
            if (+new Date(item.ctime) > retentionTime) {
                return void cb();
            }

            // but if it's been stored for the configured time...
            // expire it
            if (Env.DRY_RUN) {
                if (item.channel.length === 32) { removed++; }
                else if (item.channel.length === 44) { accounts++; }
                return void Log.info("EVICT_ARCHIVED_CHANNEL_DRY_RUN", item.channel, cb);
            }
            store.removeArchivedChannel(item.channel, w(function (err) {
                if (err) {
                    return Log.error('EVICT_ARCHIVED_CHANNEL_REMOVAL_ERROR', {
                        error: err,
                        channel: item.channel,
                    }, cb);
                }

                if (item.channel.length === 32) {
                    removed++;
                } else if (item.channel.length === 44) {
                    accounts++;
                }

                Log.info('EVICT_ARCHIVED_CHANNEL_REMOVAL', item.channel, cb);
            }));
        };

        // if you hit an error, log it
        // otherwise, when there are no more channels to process
        // log some stats about how many were removed
        var done = function (err) {
            if (err) {
                return Log.error('EVICT_ARCHIVED_FINAL_ERROR', err);
            }
            report.archivedChannelsRemoved = removed;
            report.archivedAccountsRemoved = accounts;
            Log.info('EVICT_ARCHIVED_CHANNELS_REMOVED', removed);
            Log.info('EVICT_ARCHIVED_ACCOUNTS_REMOVED', accounts);
        };

        store.listArchivedChannels(handler, w(done));
    };

    var removeArchivedBlobProofs = function (w) {
        if (typeof(Env.archiveRetentionTime) !== "number") { return; }
    // Iterate over archive blob ownership proofs and remove them
    // if they are older than the specified retention time
        var removed = 0;
        blobs.list.archived.proofs(function (err, item, next) {
            next = Util.mkAsync(next, THROTTLE_FACTOR);
            if (err) {
                Log.error("EVICT_BLOB_LIST_ARCHIVED_PROOF_ERROR", err);
                return void next();
            }
            if (item && item.ctime > retentionTime) { return void next(); }
            if (Env.DRY_RUN) {
                removed++;
                return void Log.info("EVICT_ARCHIVED_BLOB_PROOF_DRY_RUN", item, next);
            }
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
            report.archivedBlobProofsRemoved = removed;
            Log.info('EVICT_ARCHIVED_BLOB_PROOFS_REMOVED', removed);
        }));
    };

    var removeArchivedBlobs = function (w) {
        if (typeof(Env.archiveRetentionTime) !== "number") { return; }
    // Iterate over archived blobs and remove them
    // if they are older than the specified retention time
        var removed = 0;
        blobs.list.archived.blobs(function (err, item, next) {
            next = Util.mkAsync(next, THROTTLE_FACTOR);
            if (err) {
                Log.error("EVICT_BLOB_LIST_ARCHIVED_BLOBS_ERROR", err);
                return void next();
            }
            if (item && item.ctime > retentionTime) { return void next(); }
            if (Env.DRY_RUN) {
                removed++;
                return void Log.info("EVICT_ARCHIVED_BLOB_DRY_RUN", item, next);
            }
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
            report.archivedBlobsRemoved = removed;
            Log.info('EVICT_ARCHIVED_BLOBS_REMOVED', removed);
        }));
    };

    if (Env.DRY_RUN) { Env.Log.info('DRY RUN'); }
    nThen(loadStorage)
    .nThen(migrateIncorrectBlobs)
    .nThen(removeArchivedChannels)
    .nThen(removeArchivedBlobProofs)
    .nThen(removeArchivedBlobs)
    .nThen(function () {
        cb(void 0, report);
    });
};

module.exports = function (Env, cb) {
    var complete = Util.once(Util.mkAsync(cb));
    var report = {
        // archivedChannelsRemoved,
        // archivedAccountsRemoved,
        // archivedBlobProofsRemoved,
        // archivedBlobsRemoved,

        // totalChannels,
        // activeChannels,

        // totalBlobs,
        // activeBlobs,

        // totalAccounts,
        // activeAccounts,

        // channelsArchived,

        launchTime: +new Date(),
        // runningTime,
    };

    // the administrator should have set an 'inactiveTime' in their config
    // if they didn't, just exit.
    if (!Env.inactiveTime || typeof(Env.inactiveTime) !== "number") {
        return void complete("NO_INACTIVE_TIME");
    }

    // get a list of premium accounts on this instance
    // pre-converted to the 'safeKey' format so we can easily compare
    // them against ids we see on the filesystem
    var premiumSafeKeys = Object.keys(Env.limits || {})
        .map(function (id) {
            return Keys.canonicalize(id);
        })
        .filter(Boolean)
        .map(Util.escapeKeyCharacters);

    // files which have not been changed since before this date can be considered inactive
    var inactiveTime = +new Date() - (Env.inactiveTime * 24 * 3600 * 1000);

    // files which were archived before this date can be considered safe to remove
    var retentionTime = +new Date() - (Env.archiveRetentionTime * 24 * 3600 * 1000);

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

        TODO make this configurable ?
    */
    var BLOOM_CAPACITY = (1 << 24) - 1; // over two million items
    var BLOOM_ERROR = 1 / 10000;  // an error rate of one in ten thousand

    // we'll use one filter for the set of active documents
    var activeDocs = Bloom.optimalFilter(BLOOM_CAPACITY, BLOOM_ERROR);
    // and another one for the set of pinned documents
    var pinnedDocs = Bloom.  optimalFilter(BLOOM_CAPACITY, BLOOM_ERROR);

    var startTime = +new Date();
    var msSinceStart = function ()  {
        return (+new Date()) - startTime;
    };

    var loadStorage = function () {
        store = Env.store;
        pinStore = Env.pinStore;
        Log = Env.Log;
        blobs = Env.blobStore;
    };

    var categorizeChannelsByActivity = function (w) {
        var channels = 0;
        var active = 0;
        var handler = function (err, item, cb) {
            channels++;
            if (channels % PROGRESS_FACTOR === 0) {
                Log.info('EVICT_CHANNEL_CATEGORIZATION_PROGRESS', {
                    channels: channels,
                });
            }

            if (err) {
                return Log.error('EVICT_CHANNEL_CATEGORIZATION', err, cb);
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
            report.activeChannels = active;
            report.totalChannels = channels;
            Log.info('EVICT_CHANNELS_CATEGORIZED', {
                active: active,
                channels: channels,
            }, w());
        };

        Log.info('EVICT_CHANNEL_ACTIVITY_START', 'Assessing channel activity');
        store.listChannels(handler, w(done));
    };

    var categorizeBlobsByActivity = function (w) {
        var n_blobs = 0;
        var active = 0;

        Log.info('EVICT_BLOBS_ACTIVITY_START', 'Assessing blob activity');
        blobs.list.blobs(function (err, item, next) {
            next = Util.mkAsync(next, THROTTLE_FACTOR);
            n_blobs++;
            if (n_blobs % PROGRESS_FACTOR === 0) {
                Log.info('EVICT_BLOB_CATEGORIZATION_PROGRESS', {
                    blobs: n_blobs,
                });
            }

            if (err) {
                return Log.error("EVICT_BLOB_CATEGORIZATION", err, next);
            }
            if (!item) {
                return void Log.error("EVICT_BLOB_CATEGORIZATION_INVALID", item, next);
            }
            if (item.mtime > inactiveTime) {
                activeDocs.add(item.blobId);
                active++;
                return void next();
            }
            next();
        }, w(function () {
            report.totalBlobs = n_blobs;
            report.activeBlobs = active;
            Log.info('EVICT_BLOBS_CATEGORIZED', {
                active: active,
                blobs: n_blobs,
            }, w());
        }));
    };

    var categorizeAccountsByActivity = function (w) {
    // iterate over all accounts
        var accounts = 0;
        var inactive = 0;

        var accountRetentionTime;
        if (typeof(Env.accountRetentionTime) === 'number' && Env.accountRetentionTime > 0) {
            accountRetentionTime = +new Date() - (24 * 3600 * 1000 * Env.accountRetentionTime);
        } else {
            accountRetentionTime = -1;
        }

        var pinAll = function (pinList) {
            pinList.forEach(function (docId) {
                pinnedDocs.add(docId);
            });
        };

        var docIsActive = function (docId) {
            return activeDocs.test(docId);
        };

        var accountIsActive = function (mtime, pinList) {
            // console.log("id [%s] in premiumSafeKeys", id, premiumSafeKeys.indexOf(id) !== -1);
            // if their pin log has changed recently then consider them active
            if (mtime && mtime > accountRetentionTime) {
                return true;
            }

            // iterate over their pinned documents until you find one that has been active
            return pinList.some(docIsActive);
        };

        var isPremiumAccount = function (id) {
            return premiumSafeKeys.indexOf(id) !== -1;
        };

        var PRESERVE_INACTIVE_ACCOUNTS = accountRetentionTime <= 0;

        // otherwise, we'll only retain data from active accounts
        // so we need more heuristics
        var handler = function (content, id, next) {
            next = Util.mkAsync(next, THROTTLE_FACTOR);
            accounts++;
            if (accounts % PROGRESS_FACTOR === 0) {
                Log.info('EVICT_ACCOUNT_CATEGORIZATION_PROGRESS', {
                    accounts: accounts,
                });
            }

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
                return Log.info('EVICT_INACTIVE_ACCOUNT_PRESERVED', {
                    id: id,
                    mtime: mtime,
                }, next);
            }

            if (isPremiumAccount(id)) {
                pinAll(pinList);
                return Log.info("EVICT_INACTIVE_PREMIUM_ACCOUNT", {
                    id: id,
                    mtime: mtime,
                }, next);
            }

            // remove the pin logs of inactive accounts if inactive account removal is configured
            if (Env.DRY_RUN) {
                return void Log.info("EVICT_INACTIVE_ACCOUNT_DRY_RUN", id, next);
            }
            pinStore.archiveChannel(id, undefined, function (err) {
                if (err) {
                    return Log.error('EVICT_INACTIVE_ACCOUNT_PIN_LOG', err, next);
                }
                Log.info('EVICT_INACTIVE_ACCOUNT_LOG', id, next);
            });
        };

        var done = function () {
            var label = PRESERVE_INACTIVE_ACCOUNTS?
                "EVICT_COUNT_ACCOUNTS":
                "EVICT_INACTIVE_ACCOUNTS";

            report.totalAccounts = accounts;
            report.activeAccounts = accounts - inactive;
            Log.info(label, {
                accounts: accounts,
                inactive: inactive,
            });
        };

        Log.info('EVICT_ACCOUNTS_ACTIVITY_START', 'Assessing account activity');
        Pins.load(w(done), {
            pinPath: Env.paths.pin,
            handler: handler,
        });
    };

    var archiveInactiveBlobs = function (w) {
    // iterate over blobs and remove them
    // if they have not been accessed within the specified retention time
        var removed = 0;
        var total = 0;

        Log.info('EVICT_BLOB_START', {});
        blobs.list.blobs(function (err, item, next) {
            next = Util.mkAsync(next, THROTTLE_FACTOR);
            if (err) {
                return Log.error("EVICT_BLOB_LIST_BLOBS_ERROR", err, next);
            }
            if (!item) {
                return void Log.error('EVICT_BLOB_LIST_BLOBS_NO_ITEM', item, next);
            }
            total++;
            if (total % PROGRESS_FACTOR === 0) {
                Log.info("EVICT_BLOB_PROGRESS", {
                    blobs: total,
                });
            }

            if (pinnedDocs.test(item.blobId)) { return void next(); }
            if (activeDocs.test(item.blobId)) { return void next(); }

            // This seems redundant because we're already checking the bloom filter
            // but we can't implement a 'fast mode' for the iterator
            // unless we address this race condition with this last-minute double-check
            if (item.mtime > inactiveTime) { return void next(); }

            if (Env.DRY_RUN) {
                removed++;
                return void Log.info("EVICT_ARCHIVE_BLOB_DRY_RUN", {
                    item: item,
                }, next);
            }
            blobs.archive.blob(item.blobId, 'INACTIVE', function (err) {
                if (err) {
                    return Log.error("EVICT_ARCHIVE_BLOB_ERROR", {
                        error: err,
                        item: item,
                    }, next);
                }
                removed++;
                Log.info("EVICT_ARCHIVE_BLOB", {
                    item: item,
                }, next);
            });
        }, w(function () {
            report.totalBlobs = total;
            report.activeBlobs = total - removed;
            Log.info('EVICT_BLOBS_REMOVED', removed, w());
        }));
    };

    var archiveInactiveBlobProofs = function (w) {
    // iterate over blob proofs and remove them
    // if they don't correspond to a pinned or active file
        var removed = 0;
        var total = 0;

        Log.info("EVICT_ARCHIVE_INACTIVE_BLOB_PROOFS_START", {});
        blobs.list.proofs(function (err, item, next) {
            next = Util.mkAsync(next, THROTTLE_FACTOR);
            if (err) {
                return void Log.error("EVICT_BLOB_LIST_PROOFS_ERROR", err, next);
            }
            if (!item) {
                return void Log.error('EVICT_BLOB_LIST_PROOFS_NO_ITEM', item, next);
            }
            total++;

            if (total % PROGRESS_FACTOR === 0) {
                Log.info('EVICT_BLOB_PROOF_PROGRESS', {
                    proofs: total,
                });
            }

            if (pinnedDocs.test(item.blobId)) { return void next(); }
            if (item.mtime > inactiveTime) { return void next(); }
            nThen(function (w) {
                blobs.size(item.blobId, w(function (err, size) {
                    if (err) {
                        w.abort();
                        return void Log.error("EVICT_BLOB_LIST_PROOFS_ERROR", err, next);
                    }
                    if (size !== 0) {
                        w.abort();
                        next();
                    }
                }));
            }).nThen(function () {
                if (Env.DRY_RUN) {
                    removed++;
                    return void Log.info("EVICT_BLOB_PROOF_LONELY_DRY_RUN", item, next);
                }
                blobs.remove.proof(item.safeKey, item.blobId, function (err) {
                    if (err) {
                        return Log.error("EVICT_BLOB_PROOF_LONELY_ERROR", item, next);
                    }
                    removed++;
                    return Log.info("EVICT_BLOB_PROOF_LONELY", item, next);
                });
            });
        }, w(function () {
            Log.info("EVICT_BLOB_PROOFS_REMOVED", {
                removed,
                total,
            }, w());
        }));
    };

    var archiveInactiveChannels = function (w) {
        var channels = 0;
        var archived = 0;

        var handler = function (err, item, cb) {
            cb = Util.mkAsync(cb, THROTTLE_FACTOR);
            channels++;
            if (channels % PROGRESS_FACTOR === 0) {
                Log.info('EVICT_INACTIVE_CHANNELS_PROGRESS', {
                    channels,
                    archived,
                });
            }

            if (err) {
                return Log.error('EVICT_CHANNEL_ITERATION', err, cb);
            }

            // ignore the special admin broadcast channel
            if (item.channel.length === 33) { return void cb(); }

            // check if the database has any ephemeral channels
            // if it does it's because of a bug, and they should be removed
            if (item.channel.length === 34) {
                if (Env.DRY_RUN) {
                    return void Log.info("EVICT_EPHEMERAL_DRY_RUN", item.channel, cb);
                }
                return void store.removeChannel(item.channel, w(function (err) {
                    if (err) {
                        return Log.error('EVICT_EPHEMERAL_CHANNEL_REMOVAL_ERROR', {
                            error: err,
                            channel: item.channel,
                        }, cb);
                    }
                    Log.info('EVICT_EPHEMERAL_CHANNEL_REMOVAL', item.channel, cb);
                }));
            }

            // bail out if the channel is in the set of activeDocs
            if (activeDocs.test(item.channel)) { return void cb(); }

            // ignore the channel if it's pinned
            if (pinnedDocs.test(item.channel)) { return void cb(); }

            nThen(function (w) {
                // double check that the channel really is inactive before archiving it
                // because it might have been created after the initial activity scan
                store.getChannelStats(item.channel, w(function (err, newerItem) {
                    if (err) { return; }
                    if (newerItem && getNewestTime(newerItem) > retentionTime) {
                        // it's actually active, so don't archive it.
                        w.abort();
                        cb();
                    }
                    // else fall through to the archival
                }));
            }).nThen(function (w) {
                if (Env.DRY_RUN) {
                    archived++;
                    w.abort();
                    return void Log.info("EVICT_CHANNEL_ARCHIVAL_DRY_RUN", item.channel, cb);
                }
                return void store.archiveChannel(item.channel, 'INACTIVE', w(function (err) {
                    if (err) {
                        Log.error('EVICT_CHANNEL_ARCHIVAL_ERROR', {
                            error: err,
                            channel: item.channel,
                        }, w());
                        return;
                    }
                    archived++;
                    Log.info('EVICT_CHANNEL_ARCHIVAL', item.channel, w());
                }));
            }).nThen(cb);
        };

        var done = function () {
            report.channelsArchived = archived;
            return void Log.info('EVICT_CHANNELS_ARCHIVED', {
                channels,
                archived,
            });
        };

        Log.info('EVICT_INACTIVE_CHANNELS_START', {});
        store.listChannels(handler, w(done), true); // using a hacky "fast mode" since we only need the channel id
    };

    if (Env.DRY_RUN) { Env.Log.info('DRY RUN'); }
    nThen(loadStorage)

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
        var runningTime = report.runningTime = msSinceStart();
        Log.info("EVICT_TIME_TO_RUN_SCRIPT", runningTime);
    }).nThen(function () {
        complete(void 0, report);
    });
};

module.exports.archived = evictArchived;
