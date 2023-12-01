/*jshint esversion: 6 */
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
