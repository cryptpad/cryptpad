// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const Basic = require("./basic");
const Path = require("node:path");
const Util  = require("../common-util");
const Sessions = require("./sessions");
const nThen = require("nthen");

const MFA = module.exports;

/*
This module manages storage related to accounts' multi-factor authentication settings.

These settings are checked every time a block is accessed, so we do as little as possible
so that it can be accessed quickly.

*/

/*  The path for a given account's settings is based on the public signing key
    which identifies its "login block". We expect that any action to create or access
    a block will be authenticated with a challenge-response protocol, so we
    don't bother checking the validity of an identifier in here aside from
    ensuring that it won't throw when using string methods.

*/
var pathFromId = function (Env, id) {
    if (!id || typeof(id) !== 'string') { return; }
    id = Util.escapeKeyCharacters(id);
    return Path.join(Env.paths.base, "mfa", id.slice(0, 2), `${id}.json`);
};

MFA.read = function (Env, id, cb) {
    var path = pathFromId(Env, id);
    Basic.read(Env, path, cb);
};

// data should be a string
MFA.write = function (Env, id, data, cb) {
    var path = pathFromId(Env, id);
    Basic.write(Env, path, data, cb);
};

MFA.delete = function (Env, id, cb) {
    var path = pathFromId(Env, id);
    Basic.delete(Env, path, cb);
};

MFA.revoke = function (Env, publicKey, cb) {
    nThen(function (w) {
        MFA.delete(Env, publicKey, w(function (err) {
            if (!err) { return; }
            w.abort();
            Env.Log.error('TOTP_REVOKE_MFA_DELETE', {
                error: err,
                publicKey: publicKey,
            });
            cb('MFA_ERROR');
        }));
    }).nThen(function () {
        Sessions.deleteUser(Env, publicKey, function (err) {
            if (!err) { return; }
            // If we can't delete the sessions, don't send an error, just log to the server.
            // The MFA will still be correctly disabled as long as the first step is done.
            Env.Log.error('TOTP_REVOKE_SESSIONS__DELETE', {
                error: err,
                publicKey: publicKey,
            });
        });
    }).nThen(function () {
        cb(void 0, {
            success: true
        });
    });
};

MFA.copy = function (Env, oldKey, newKey, cb) {
    let content;
    nThen(function (w) {
        MFA.read(Env, oldKey, w(function (err, c) {
            if (err) {
                // No MFA configured, nothing to copy
                w.abort();
                return void cb();
            }
            content = c;
        }));
    }).nThen(function () {
        MFA.write(Env, newKey, content, cb);
    });
};
