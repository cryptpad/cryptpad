// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/*jshint esversion: 6 */
const Moderators = module.exports;

const Moderator = require('../storage/moderator');
const Util = require("../common-util");

Moderators.getAll = (Env, cb) => {
    Moderator.getAll(Env, (err, data) => {
        if (err) { return void cb(err); }
        let res = {};
        Object.keys(data).forEach(safeKey => {
            const unsafeKey = Util.unescapeKeyCharacters(safeKey);
            res[unsafeKey] = data[safeKey];
        });
        cb(null, res);
    });
};
Moderators.getKeysSync = (Env) => {
    return Moderator.getAllKeys(Env);
};

Moderators.add = (Env, edPublic, data, adminKey, _cb) => {
    const cb = Util.once(Util.mkAsync(_cb));
    data.createdBy = adminKey;
    data.time = +new Date();
    const safeKey = Util.escapeKeyCharacters(edPublic);
    Moderator.write(Env, safeKey, data, (err) => {
        if (err) { return void cb(err); }
        if (!Env.moderators.includes(edPublic)) {
            Env.moderators.push(edPublic);
        }
        Env.envUpdated.fire();
        cb();
    });
};

Moderators.delete = (Env, id, _cb) => {
    const cb = Util.once(Util.mkAsync(_cb));
    const safeKey = Util.escapeKeyCharacters(id);
    Moderator.delete(Env, safeKey, (err) => {
        if (err && err !== 'ENOENT') { return void cb(err); }
        let idx = Env.moderators.indexOf(id);
        if (idx !== -1) {
            Env.moderators.splice(idx, 1);
            Env.envUpdated.fire();
        }
        cb(void 0, true);
    });
};

