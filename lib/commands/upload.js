/*jshint esversion: 6 */
const Upload = module.exports;
const Util = require("../common-util");
const Pinning = require("./pin-rpc");
const nThen = require("nthen");
const Core = require("./core");

Upload.status = function (Env, safeKey, filesize, _cb) { // FIXME FILES
    var cb = Util.once(Util.mkAsync(_cb));

    // validate that the provided size is actually a positive number
    if (typeof(filesize) !== 'number' &&
        filesize >= 0) { return void cb('E_INVALID_SIZE'); }

    nThen(function (w) {
        // if the proposed upload size is within the regular limit
        // jump ahead to the next block
        if (filesize <= Env.maxUploadSize) { return; }

        // if larger uploads aren't explicitly enabled then reject them
        if (typeof(Env.premiumUploadSize) !== 'number') {
            w.abort();
            return void cb('TOO_LARGE');
        }

        // otherwise go and retrieve info about the user's quota
        Pinning.getLimit(Env, safeKey, w(function (err, limit) {
            if (err) {
                w.abort();
                return void cb("E_BAD_LIMIT");
            }

            var plan = limit[1];

            // see if they have a special plan, reject them if not
            if (plan === '') {
                w.abort();
                return void cb('TOO_LARGE');
            }

            // and that they're not over the greater limit
            if (filesize >= Env.premiumUploadSize) {
                w.abort();
                return void cb("TOO_LARGE");
            }

            // fallthrough will proceed to the next block
        }));
    }).nThen(function (w) {
        var abortAndCB = Util.both(w.abort, cb);
        Env.blobStore.status(safeKey, w(function (err, inProgress) {
            // if there's an error something is weird
            if (err) { return void abortAndCB(err); }

            // we cannot upload two things at once
            if (inProgress) { return void abortAndCB(void 0, true); }
        }));
    }).nThen(function () {
        // if yuo're here then there are no pending uploads
        // check if you have space in your quota to upload something of this size
        Pinning.getFreeSpace(Env, safeKey, function (e, free) {
            if (e) { return void cb(e); }
            if (filesize >= free) { return cb('NOT_ENOUGH_SPACE'); }

            var user = Core.getSession(Env.Sessions, safeKey);
            user.pendingUploadSize = filesize;
            user.currentUploadSize = 0;

            cb(void 0, false);
        });
    });
};

Upload.upload = function (Env, safeKey, chunk, cb) {
    Env.blobStore.upload(safeKey, chunk, cb);
};

var reportStatus = function (Env, label, safeKey, err, id) {
    var data = {
        safeKey: safeKey,
        err: err && err.message || err,
        id: id,
    };
    var method = err? 'error': 'info';
    Env.Log[method](label, data);
};

Upload.complete = function (Env, safeKey, arg, cb) {
    Env.blobStore.complete(safeKey, arg, function (err, id) {
        reportStatus(Env, 'UPLOAD_COMPLETE', safeKey, err, id);
        cb(err, id);
    });
};

Upload.cancel = function (Env, safeKey, arg, cb) {
    Env.blobStore.cancel(safeKey, arg, cb);
};

Upload.complete_owned = function (Env, safeKey, arg, cb) {
    Env.blobStore.completeOwned(safeKey, arg, function (err, id) {
        reportStatus(Env, 'UPLOAD_COMPLETE_OWNED', safeKey, err, id);
        cb(err, id);
    });
};

