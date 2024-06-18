// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const Basic = require("./basic.js");
const Path = require("node:path");
const nThen = require('nthen');
const Util = require('../common-util');

const Invite = module.exports;
/*  This module manages storage used to implement instance invitations when registration
    is closed. This "database" will store individual invitation and their state.

    An invitation is created with a random uid and an alias (username, email, etc.)
    Once it is used by the user, their newly created blockId is added which will mark
    it as completed.
*/

const pathFromId = function (Env, id) {
    if (!id || typeof(id) !== 'string') { return void console.error('INVITE_BAD_ID', id); }
    return Path.join(Env.paths.base, "invitations", id.slice(0, 2), id);
};

Invite.read = function (Env, id, cb) {
    var path = pathFromId(Env, id);
    Basic.read(Env, path, (err, data) => {
        if (err) { return void cb(err.code); }
        cb(void 0, Util.tryParse(data));
    });
};

Invite.getAll = function (Env, cb) {
    let invitations = {};


    nThen((waitFor) => {
        let dirPath = Path.join(Env.paths.base, "invitations");
        Basic.readDir(Env, dirPath, waitFor((err, prefixes) => {
            if (err && err.code === 'ENOENT') { return void cb(void 0, {}); }
            if (err) { waitFor.abort(); return void cb(err.code); }
            prefixes.forEach((prefix) => {
                var dirPath2 = Path.join(Env.paths.base, "invitations", prefix);
                Basic.readDir(Env, dirPath2, waitFor((err, files) => {
                    if (err) { waitFor.abort(); return void cb(err.code); }
                    files.forEach((id) => {
                        Invite.read(Env, id, waitFor((err, data) => {
                            invitations[id] = data || { error: err };
                        }));
                    });
                }));
            });
        }));
    }).nThen(() => {
        cb(null, invitations);
    });

};

Invite.write = function (Env, id, data, cb) {
    var path = pathFromId(Env, id);
    Basic.write(Env, path, JSON.stringify(data), (err) => {
        if (err) { return void cb(err.code); }
        cb();
    });
};

Invite.delete = function (Env, id, cb) {
    var path = pathFromId(Env, id);
    Basic.delete(Env, path, (err) => {
        if (err) { return void cb(err.code); }
        cb();
    });
};

Invite.update = function (Env, id, data, cb) {
    Invite.delete(Env, id, (err) => {
        if (err) { return void cb(err); }
        Invite.write(Env, id, data, cb);
    });
};


