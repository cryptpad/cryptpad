// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const Basic = require("./basic.js");
const Path = require("node:path");

const Challenge = module.exports;
/*  This module manages storage used to implement a public-key authenticated
    challenge-response protocol.

    Each 'challenge' is only intended to be valid for a short period of time.
    1. A client makes a request of the server
    2. The server stores their request with a nonce and challenges them to sign for this request
    3. If the client successfully signs for the request within a short window then the request is executed
    4. Whether the signature is valid or not, the challenge is removed

    Thus, we only expect challenges to remain in storage if the request was aborted or interrupted
    for some unexpected reason.

    Some form of garbage collection should be implemented in the future.
*/

const pathFromId = function (Env, id) {
    if (!id || typeof(id) !== 'string') { return void console.error('CHALLENGE_BAD_ID', id); }
    return Path.join(Env.paths.base, "challenges", id.slice(0, 2), id);
};

Challenge.read = function (Env, id, cb) {
    var path = pathFromId(Env, id);
    Basic.read(Env, path, cb);
};

Challenge.write = function (Env, id, data, cb) {
    var path = pathFromId(Env, id);
    Basic.write(Env, path, data, cb);
};

Challenge.delete = function (Env, id, cb) {
    var path = pathFromId(Env, id);
    Basic.delete(Env, path, cb);
};

