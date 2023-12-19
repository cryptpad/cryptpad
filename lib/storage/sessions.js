// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const Basic = require("./basic");
const Path = require("node:path");
const Nacl  = require("tweetnacl/nacl-fast");
const Util = require("../common-util");

const Sessions = module.exports;
/*  This module manages storage for per-acccount session tokens - currently assumed to be
    JSON Web Tokens (JWTs).

    Decisions about what goes into each of those JWTs happens upstream, so the storage
    itself is relatively unopinionated.

    The key things to understand are:

* valid sessions allow the holder of a given JWT to access a given "login block"
* JWTs are signed with a key held in the server's memory. If that key leaks then it should be rotated (with the SET_BEARER_SECRET decree) to invalidate all existing JWTs. Under these conditions then all tokens signed with the old key can be removed. Garbage collection of these older tokens is not implemented.
* it is expected that any given login-block can have multiple active sessions (for different devices, or if their browser clears its cache automatically). All sessions for a given block are stored in a per-user directory which is intended to make listing or iterating over them simple.
* It could be desirable to expose the list of sessions to the relevant user and allow them to revoke sessions individually or en-masse, though this is not currently implemented.

*/

var pathFromId = function (Env, id, ref) {
    if (!id || typeof(id) !== 'string') { return; }
    id = Util.escapeKeyCharacters(id);
    return Path.join(Env.paths.base, "sessions", id.slice(0, 2), id, ref);
};

Sessions.randomId = () => Nacl.util.encodeBase64(Nacl.randomBytes(24)).replace(/\//g, '-');

Sessions.read = function (Env, id, ref, cb) {
    var path = pathFromId(Env, id, ref);
    Basic.read(Env, path, cb);
};

Sessions.write = function (Env, id, ref, data, cb) {
    var path = pathFromId(Env, id, ref);
    Basic.write(Env, path, data, cb);
};

Sessions.delete = function (Env, id, ref, cb) {
    var path = pathFromId(Env, id, ref);
    Basic.delete(Env, path, cb);
};

Sessions.update = function (Env, id, oldId, ref, dataStr, cb) {
    var data = Util.tryParse(dataStr);
    Sessions.read(Env, oldId, ref, (err, oldData) => {
        let content = Util.tryParse(oldData) || {};
        Object.keys(data || {}).forEach((type) => {
            content[type] = data[type];
        });
        Sessions.delete(Env, oldId, ref, () => {
            Sessions.write(Env, id, ref, JSON.stringify(content), cb);
        });
    });
};

Sessions.deleteUser = function (Env, id,  cb) {
    if (!id || typeof(id) !== 'string') { return; }
    id = Util.escapeKeyCharacters(id);
    var dirPath = Path.join(Env.paths.base, "sessions", id.slice(0, 2), id);

    Basic.readDir(Env, dirPath, (err, files) => {
        var checkContent = !files || (Array.isArray(files) && files.every((file) => {
            return file && file.length === 32;
        }));
        if (!checkContent) { return void cb('INVALID_SESSIONS_DIR'); }
        Basic.deleteDir(Env, dirPath, cb);
    });
};

