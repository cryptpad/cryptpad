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

    if (filesize >= Env.maxUploadSize) { return cb('TOO_LARGE'); }

    nThen(function (w) {
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

Upload.complete = function (Env, safeKey, arg, cb) {
    Env.blobStore.complete(safeKey, arg, cb);
};

Upload.cancel = function (Env, safeKey, arg, cb) {
    Env.blobStore.cancel(safeKey, arg, cb);
};

Upload.complete_owned = function (Env, safeKey, arg, cb) {
    Env.blobStore.completeOwned(safeKey, arg, cb);
};

