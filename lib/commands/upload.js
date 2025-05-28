// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

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
    Env.blobStore.uploadWs(safeKey, chunk, cb);
};

Upload.cancel = function (Env, safeKey, arg, cb) {
    Env.blobStore.cancel(safeKey, arg, cb);
};

var completeUpload = function (owned) {
    return function (Env, safeKey, arg, cb) {
        Env.blobStore.closeBlobstage(safeKey);
        var user = Core.getSession(Env.Sessions, safeKey);
        var size = user.pendingUploadSize;
        Env.completeUpload(safeKey, arg, Boolean(owned), size, cb);
    };
};

Upload.complete = completeUpload(false);
Upload.complete_owned = completeUpload(true);
