// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const Basic = require("./basic.js");
const Path = require("node:path");
const nThen = require('nthen');
const Util = require('../common-util');

const User = module.exports;
/*  This module manages storage used to implement user management. "Known users" can
    be added here in order to store their public key, their block ID and an alias
    used to recognize them.
*/

const pathFromId = function (Env, id) {
    if (!id || typeof(id) !== 'string') { return void console.error('KNWONUSER_BAD_ID', id); }
    return Path.join(Env.paths.base, "users", id.slice(0, 2), id);
};

User.read = function (Env, id, cb) {
    var path = pathFromId(Env, id);
    Basic.read(Env, path, (err, data) => {
        if (err) { return void cb(err.code); }
        cb(void 0, Util.tryParse(data));
    });
};

User.getAll = function (Env, cb) {
    let users = {};


    nThen((waitFor) => {
        let dirPath = Path.join(Env.paths.base, "users");
        Basic.readDir(Env, dirPath, waitFor((err, prefixes) => {
            if (err && err.code === 'ENOENT') { return void cb(void 0, {}); }
            if (err) { waitFor.abort(); return void cb(err.code); }
            prefixes.forEach((prefix) => {
                var dirPath2 = Path.join(Env.paths.base, "users", prefix);
                Basic.readDir(Env, dirPath2, waitFor((err, files) => {
                    if (err) { waitFor.abort(); return void cb(err.code); }
                    files.forEach((id) => {
                        User.read(Env, id, waitFor((err, data) => {
                            users[id] = data || { error: err };
                        }));
                    });
                }));
            });
        }));
    }).nThen(() => {
        cb(null, users);
    });

};

User.write = function (Env, id, data, cb) {
    var path = pathFromId(Env, id);
    Basic.write(Env, path, JSON.stringify(data), (err) => {
        if (err) { return void cb(err.code); }
        cb();
    });
};

User.delete = function (Env, id, cb) {
    var path = pathFromId(Env, id);
    Basic.delete(Env, path, (err) => {
        if (err) { return void cb(err.code); }
        cb();
    });
};

User.update = function (Env, id, data, cb) {
    User.delete(Env, id, (err) => {
        if (err) { return void cb(err); }
        User.write(Env, id, data, cb);
    });
};


