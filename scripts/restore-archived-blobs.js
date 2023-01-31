/* globals process */
var filePath = process.env.FILE;

if (!filePath) {
    console.log("Provide a path to a log file of files that should be restored");
    console.log("Like: `FILE=/home/user/cryptpad/logs/23/file.ndjson node ./scripts/restore-blobs-from-log.js`");
    process.exit(1);
}

const Fs = require("node:fs");

(function () {
    try {
        var stat = Fs.statSync(filePath);
        if (stat.isDirectory()) { throw new Error("NOT_A_FILE"); }
    } catch (err) {
        console.error(err);
        console.log("specified file was not valid");
        process.exit(1);
    }
}());

const Readline = require("node:readline");

const nThen = require("nthen");

const BlobStorage = require("../lib/storage/blob");
const Logger = require("../lib/log");

const Environment = require("../lib/env");
const config = require("../lib/load-config");

var Env = Environment.create(config);

var blobStore;
var msgStore;
var Log;

var parse = s => { try { return JSON.parse(s); } catch (err) {}};

nThen(function (w) {
    // load the logger
    Logger.create(config, w(function (_) {
        Log = _;
    }));
}).nThen(function (w) {
    // load the blob store
    BlobStorage.create({
        blobPath: Env.paths.blob,
        blobStagingPath: Env.paths.staging,
        archivePath: Env.paths.archive,
        getSession: () => { return {}; },
    }, w(function (err, _)  {
        if (err) {
            w.abort();
            console.error(err);
            return void process.exit(1);
        }
        blobStore = _;
    }));
}).nThen(function (w) {
    var done = w();

    var ACTIONS = {};
    ACTIONS.EVICT_ARCHIVE_BLOB = (line, cb) => {
        var id;
        try {
            id = line[3].item.blobId;
        } catch (err) {
            Log.error('RESTORE_BLOBS_INVALID_ID', {
                line,
            });
            return void cb();
        }

        blobStore.restore.blob(id, function (err) {
            cb();
            if (err) {
                return void Log.error('RESTORE_BLOB_FAILURE', { error: err, id: id });
            }
            Log.info("RESTORE_BLOBS_SUCCESS",  {
                id,
            });
        });
    };
    ACTIONS.EVICT_BLOB_PROOF_LONELY = (line, cb) => {
        var item = line[3];
        if (!item) { return void cb(); }

        blobStore.restore.proof(item.safeKey, item.blobId, function (err) {
            cb();
            if (err) {
                return void Log.error('RESTORE_BLOB_PROOF_FAILURE', {
                    error: err,
                    blobId: item.blobId,
                });
            }
            Log.info('RESTORE_BLOB_PROOF_SUCCESS', {
                safeKey: item.safeKey,
                blobId: item.blobId,
            });
        });
    };

    // start reading

    // database methods are all async, so we can't rely on stream backpressure
    // to prevent memory usage from getting out of control
    // use .pause() and .resume() as necessary ?

    var input = Fs.createReadStream(filePath);
    var lineReader = Readline.createInterface({ input });

    var pending = 0;
    var limit = 10;
    var start = function () {
        //console.log("start", pending);
        pending++;
        if (pending >= limit) {
            lineReader.pause();
        }
    };

    var end = function () {
        setTimeout(function () {
            //console.log("end", pending);
            pending--;
            if (pending < limit) {
                lineReader.resume();
            }
        }, 10); // force a little asynchrony to make the script a bit less intrusive on the CPU
    };

    lineReader.on('line', line => {
        line = parse(line);
        if (!line) { return; }
        var label = line[2];
        if (typeof(ACTIONS[label]) !== 'function') { return; }
        try {
            start();
            ACTIONS[label](line, end);
        } catch (err) {
            end();
        }
    });

    lineReader.on('close', done);
}).nThen(function () {
    // done
    msgStore.shutdown();
    Log.shutdown();
});

