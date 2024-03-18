// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const nThen = require('nthen');
const Pins = require('./pins');
const Util = require("./common-util");
const Store = require('./storage/file.js');
const BlobStore = require("./storage/blob");
const BlockStore = require("./storage/block");
const Core = require("./commands/core");
const Metadata = require("./commands/metadata");
const Meta = require("./metadata");
const Logger = require("./log");
const plugins = require("./plugin-manager");

let SSOUtils = plugins.SSO && plugins.SSO.utils;

const Path = require("path");
const Fse = require("fs-extra");

const { parentPort } = require('node:worker_threads');

const COMMANDS = {};
let Log;

const mkReportPath = function (Env, safeKey) {
    return Path.join(Env.paths.archive, 'accounts', safeKey);
};
const storeReport = (Env, report, cb) => {
    let path = mkReportPath(Env, report.key);
    let s_data;
    try {
        s_data = JSON.stringify(report);
        Fse.outputFile(path, s_data, cb);
    } catch (err) {
        return void cb(err);
    }
};
const readReport = (Env, key, cb) => {
    let path = mkReportPath(Env, key);
    Fse.readJson(path, cb);
};
const deleteReport = (Env, key, cb) => {
    let path = mkReportPath(Env, key);
    Fse.remove(path, cb);
};

const init = (cb) => {
    const Environment = require("./env");
    const config = require('./load-config');
    const Env = Environment.create(config);
    Env.computeMetadata = function (channel, cb) {
        const ref = {};
        const lineHandler = Meta.createLineHandler(ref, (err) => { console.log(err); });
        return void Env.store.readChannelMetadata(channel, lineHandler, function (err) {
            if (err) {
                // stream errors?
                return void cb(err);
            }
            cb(void 0, ref.meta);
        });
    };

    nThen((waitFor) => {
        Logger.create(config, waitFor(function (_) {
            Log = Env.Log = _;
        }));
        Store.create(config, waitFor(function (err, _store) {
            if (err) {
                waitFor.abort();
                return void cb(err);
            }
            Env.store = _store;
        }));
        Store.create({
            filePath: config.pinPath,
            archivePath: config.archivePath,
            // archive pin logs to their own subpath
            volumeId: 'pins',
        }, waitFor(function (err, _) {
            if (err) {
                waitFor.abort();
                throw err;
            }
            Env.pinStore = _;
        }));
        BlobStore.create({
            blobPath: config.blobPath,
            blobStagingPath: config.blobStagingPath,
            archivePath: config.archivePath,
            getSession: function () {},
        }, waitFor(function (err, blob) {
            if (err) {
                waitFor.abort();
                return void cb(err);
            }
            Env.blobStore = blob;
        }));
    }).nThen(() => {
        cb(Env);
    });
};

COMMANDS.start = (edPublic, blockId, reason) => {
    const safeKey = Util.escapeKeyCharacters(edPublic);
    const archiveReason = {
        code: 'MODERATION_ACCOUNT',
        txt: reason
    };

    let ref = {};
    let blobsToArchive = [];
    let channelsToArchive = [];
    let deletedChannels = [];
    let deletedBlobs = [];
    let Env;
    nThen((waitFor) => {
        init(waitFor((_Env) => {
            Env = _Env;
        }));
    }).nThen((waitFor) => {
        let lineHandler = Pins.createLineHandler(ref, (err) => { console.log(err); });
        Env.pinStore.readMessagesBin(safeKey, 0, (msgObj, readMore) => {
            lineHandler(msgObj.buff.toString('utf8'));
            readMore();
        }, waitFor());
    }).nThen((waitFor) => {
        Log.info('MODERATION_ACCOUNT_ARCHIVAL_START', edPublic, waitFor());
        var n = nThen;
        Object.keys(ref.pins || {}).forEach((chanId) => {
            n = n((w) => {
                // Blobs
                if (Env.blobStore.isFileId(chanId)) {
                    return void Env.blobStore.isOwnedBy(safeKey, chanId, w((err, owned) => {
                        if (err || !owned) { return; }
                        blobsToArchive.push(chanId);
                    }));
                }
                // Pads
                Metadata.getMetadata(Env, chanId, w((err, metadata) => {
                    if (err) { return; } // Can't read metadata? Don't archive
                    if (!Core.hasOwners(metadata)) { return; } // No owner, don't archive
                    if (Core.isOwner(metadata, edPublic) && metadata.owners.length === 1) {
                        channelsToArchive.push(chanId); // Only owner: archive
                    }
                }));
            }).nThen;
        });
        n(waitFor());
    }).nThen((waitFor) => {
        Log.info('MODERATION_ACCOUNT_ARCHIVAL_LISTED', JSON.stringify({
            pads: channelsToArchive.length,
            blobs: blobsToArchive.length
        }), waitFor());

        var n = nThen;
        // Archive the pads
        channelsToArchive.forEach((chanId) => {
            n = n((w) => {
                Env.store.archiveChannel(chanId, archiveReason, w(function (err) {
                    if (err) {
                        return Log.error('MODERATION_CHANNEL_ARCHIVAL_ERROR', {
                            error: err,
                            channel: chanId,
                        }, w());
                    }
                    deletedChannels.push(chanId);
                    Log.info('MODERATION_CHANNEL_ARCHIVAL', chanId, w());
                }));
            }).nThen;
        });
        // Archive the blobs
        blobsToArchive.forEach((blobId) => {
            n = n((w) => {
                Env.blobStore.archive.blob(blobId, archiveReason, w(function (err) {
                    if (err) {
                        return Log.error('MODERATION_BLOB_ARCHIVAL_ERROR', {
                            error: err,
                            item: blobId,
                        }, w());
                    }
                    deletedBlobs.push(blobId);
                    Log.info('MODERATION_BLOB_ARCHIVAL', blobId, w());
                }));
            }).nThen;
        });
        n(waitFor(() => {
            // Archive the pin log
            Env.pinStore.archiveChannel(safeKey, undefined, waitFor(function (err) {
                if (err) {
                    return Log.error('MODERATION_ACCOUNT_PIN_LOG', err, waitFor());
                }
                Log.info('MODERATION_ACCOUNT_LOG', safeKey, waitFor());
            }));
            blockId = blockId || ref.block;
            if (!blockId) { return; }
            BlockStore.archive(Env, blockId, archiveReason, waitFor(function (err) {
                if (err) {
                    blockId = undefined;
                    return Log.error('MODERATION_ACCOUNT_BLOCK', err, waitFor());
                }
                Log.info('MODERATION_ACCOUNT_BLOCK', safeKey, waitFor());
            }));
            if (!SSOUtils) { return; }
            SSOUtils.deleteAccount(Env, blockId, waitFor((err) => {
                if (err) {
                    return Log.error('MODERATION_ACCOUNT_BLOCK_SSO', err, waitFor());
                }
            }));
        }));
    }).nThen((waitFor) => {
        var report = {
            key: safeKey,
            channels: deletedChannels,
            blobs: deletedBlobs,
            blockId: blockId,
            reason: reason
        };
        storeReport(Env, report, waitFor((err) => {
            if (err) {
                return Log.error('MODERATION_ACCOUNT_REPORT', report, waitFor());
            }
        }));
    }).nThen(() => {
        parentPort.postMessage(JSON.stringify(deletedChannels));
        process.exit(0);
    });
};


COMMANDS.restore = (edPublic) => {
    const safeKey = Util.escapeKeyCharacters(edPublic);
    let pads, blobs;
    let blockId;
    let errors = [];
    let Env;
    nThen((waitFor) => {
        init(waitFor((_Env) => {
            Env = _Env;
        }));
    }).nThen((waitFor) => {
        Log.info('MODERATION_ACCOUNT_RESTORE_START', edPublic, waitFor());
        readReport(Env, safeKey, waitFor((err, report) => {
            if (err) { throw new Error(err); }
            pads = report.channels;
            blobs = report.blobs;
            blockId = report.blockId;
        }));
    }).nThen((waitFor) => {
        Log.info('MODERATION_ACCOUNT_RESTORE_LISTED', JSON.stringify({
            pads: pads.length,
            blobs: blobs.length
        }), waitFor());
        var n = nThen;
        pads.forEach((chanId) => {
            n = n((w) => {
                Env.store.restoreArchivedChannel(chanId, w(function (err) {
                    if (err) {
                        errors.push(chanId);
                        return Log.error('MODERATION_CHANNEL_RESTORE_ERROR', {
                            error: err,
                            channel: chanId,
                        }, w());
                    }
                    Log.info('MODERATION_CHANNEL_RESTORE', chanId, w());
                }));
            }).nThen;
        });
        blobs.forEach((blobId) => {
            n = n((w) => {
                Env.blobStore.restore.blob(blobId, w(function (err) {
                    if (err) {
                        errors.push(blobId);
                        return Log.error('MODERATION_BLOB_RESTORE_ERROR', {
                            error: err,
                            item: blobId,
                        }, w());
                    }
                    Log.info('MODERATION_BLOB_RESTORE', blobId, w());
                }));
            }).nThen;
        });
        n(waitFor(() => {
            // remove the pin logs of inactive accounts if inactive account removal is configured
            Env.pinStore.restoreArchivedChannel(safeKey, waitFor(function (err) {
                if (err) {
                    return Log.error('MODERATION_ACCOUNT_PIN_LOG_RESTORE', err, waitFor());
                }
                Log.info('MODERATION_ACCOUNT_LOG_RESTORE', safeKey, waitFor());
            }));
            if (!blockId) { return; }
            BlockStore.restore(Env, blockId, waitFor(function (err) {
                if (err) {
                    blockId = undefined;
                    return Log.error('MODERATION_ACCOUNT_BLOCK_RESTORE', err, waitFor());
                }
                Log.info('MODERATION_ACCOUNT_BLOCK_RESTORE', safeKey, waitFor());
            }));
            if (!SSOUtils) { return; }
            SSOUtils.restoreAccount(Env, blockId, waitFor(function (err) {
                if (err) {
                    return Log.error('MODERATION_ACCOUNT_BLOCK_RESTORE_SSO', err, waitFor());
                }
            }));
        }));
    }).nThen((waitFor) => {
        deleteReport(Env, safeKey, waitFor((err) => {
            if (err) {
                return Log.error('MODERATION_ACCOUNT_REPORT_DELETE', safeKey, waitFor());
            }
        }));
    }).nThen(() => {
        parentPort.postMessage(JSON.stringify(errors));
        process.exit(0);
    });

};

const getStatus = (Env, edPublic, cb) => {
    const safeKey = Util.escapeKeyCharacters(edPublic);
    readReport(Env, safeKey, (err, report) => {
        if (err) { return void cb(err); }
        cb(void 0, report);
    });
};

if (parentPort) {
    parentPort.on('message', (message) => {
        let parsed = message; //JSON.parse(message);
        let command = parsed.command;
        let content = parsed.content;
        let block = parsed.block;
        let reason = parsed.reason;
        COMMANDS[command](content, block, reason);
    });

    parentPort.postMessage('READY');
} else {

    module.exports = {
        getStatus: getStatus
    };
}
