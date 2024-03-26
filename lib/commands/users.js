// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const Users = module.exports;

const User = require('../storage/user');
const Util = require("../common-util");

Users.getAll = (Env, cb) => {
    User.getAll(Env, (err, data) => {
        if (err) { return void cb(err); }
        cb(null, data);
    });
};

Users.add = (Env, edPublic, data, adminKey, _cb) => {
    const cb = Util.once(Util.mkAsync(_cb));
    data.createdBy = adminKey;
    data.time = +new Date();
    const safeKey = Util.escapeKeyCharacters(edPublic);
    User.write(Env, safeKey, data, (err) => {
        if (err) { return void cb(err); }
        cb();
    });
};

Users.delete = (Env, id, _cb) => {
    const cb = Util.once(Util.mkAsync(_cb));
    User.delete(Env, id, (err) => {
        if (err && err !== 'ENOENT') { return void cb(err); }
        cb(void 0, true);
    });
};

Users.read = (Env, edPublic, _cb) => {
    const cb = Util.once(Util.mkAsync(_cb));
    User.read(Env, edPublic, (err, data) => {
        if (err) { return void cb(err); }
        cb(void 0, data);
    });
};

Users.update = (Env, edPublic, changes, _cb) => {
    const cb = Util.once(Util.mkAsync(_cb));
    Users.read(Env, edPublic, (err, data) => {
        if (err === 'ENOENT') { return void cb(); }
        if (err) { return void cb(err); }
        if (typeof(changes) !== "object") { return void cb('EINVAL'); }
        // User exists, update their data
        var aborted = Object.keys(changes || {}).some((key) => {
            if (changes[key] === false) {
                delete data[key];
                return;
            }
            if (String(changes[key]).length > 300) {
                cb('E_TOO_LONG');
                return true;
            }
            data[key] = changes[key];
        });
        if (aborted) { return; }
        User.update(Env, edPublic, data, cb);
    });
};

// On password change, update the block
Users.checkUpdate = (Env, userData, newBlock, cb) => {
    if (!Array.isArray(userData)) { userData = []; }
    let edPublic = userData[1];
    if (!edPublic) { return void cb('INVALID_PUBLIC_KEY'); }
    Users.read(Env, edPublic, (err, data) => {
        if (err === 'ENOENT') { return void cb(); }
        if (err) { return void cb(err); }
        // User exists, update their block
        data.block = newBlock;
        User.update(Env, edPublic, data, cb);
    });
};
