// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const Invitation = module.exports;

const Invite = require('../storage/invite');
const Util = require("../common-util");
const Users = require("./users");

const getUid = () => {
    return Util.uid() + Util.uid() + Util.uid();
};

Invitation.getAll = (Env, cb) => {
    Invite.getAll(Env, (err, data) => {
        if (err) { return void cb(err); }
        cb(null, data);
    });
};

Invitation.create = (Env, alias, email, _cb, unsafeKey) => {
    const cb = Util.once(Util.mkAsync(_cb));
    const id = getUid();
    const invitation = {
        alias,
        email,
        createdBy: unsafeKey,
        time: +new Date()
    };
    Invite.write(Env, id, invitation, (err) => {
        if (err) { return void cb(err); }
        cb(null, id);
    });
};

Invitation.delete = (Env, id, _cb) => {
    const cb = Util.once(Util.mkAsync(_cb));
    Invite.delete(Env, id, (err) => {
        if (err && err !== 'ENOENT') { return void cb(err); }
        cb(void 0, true);
    });
};

Invitation.check = (Env, id, _cb) => {
    const cb = Util.once(Util.mkAsync(_cb));
    Invite.read(Env, id, (err) => {
        if (err) { return void cb(err); }
        cb(void 0, true);
    });
};

Invitation.use = (Env, id, blockId, userData, _cb) => {
    const cb = Util.once(Util.mkAsync(_cb));
    Invite.read(Env, id, (err, _data) => {
        if (err) { return void cb(err); }

        let data = Util.clone(_data);
        if (!Array.isArray(userData)) { userData = []; }
        let name = userData[0];
        let edPublic = userData[1];
        data.block = blockId;
        data.name = name;
        data.edPublic = edPublic;
        data.type = 'invite:' + id;
        let adminKey = data.createdBy;
        if (!Env.dontStoreInvitedUsers) {
            Users.add(Env, edPublic, data, adminKey, (err) => {
                if (err) {
                    Env.Log.error('INVITATION_ADD_USER', {
                        error: err,
                        data: data
                    });
                }
            });
        }

        Invite.delete(Env, id, (err) => {
            if (err) {
                Env.Log.error('INVITATION_DELETE_USE', {
                    error: err,
                    id: id
                });
            }
        });
    });
};

