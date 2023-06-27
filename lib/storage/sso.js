const Basic = require("./basic");
const Path = require("node:path");
const Util = require("../common-util");

const SSO = module.exports;
/*  This module manages storage related to Single Sign-On (SSO) settings.

A first part (sso-requests) contains temporary files for sso authentication with a remote service
A second part (sso-users) is a database of accounts registered via SSO (SSO id ==> block seed)
A third part (sso-blocks) is a databse of blocks that are sso-protected (block id ==> SSO id...)

The path for requests is based on the "authentication request" token depending on the type of SSO.
The path for the user database is based on their persistent identifier (id) from the SSO.
*/

var pathFromId = function (Env, id, subPath) {
    if (!id || typeof(id) !== 'string') { return; }
    id = Util.escapeKeyCharacters(id);
    return Path.join(Env.paths.base, subPath, id.slice(0, 2), `${id}.json`);
};
var reqPathFromId = function (Env, id) {
    return pathFromId(Env, id, 'sso_request');
};
var userPathFromId = function (Env, id) {
    return pathFromId(Env, id, 'sso_user');
};
var blockPathFromId = function (Env, id) {
    return pathFromId(Env, id, 'sso_block');
};

const Req = SSO.request = {};

Req.read = function (Env, id, cb) {
    var path = reqPathFromId(Env, id);
    Basic.read(Env, path, cb);
};
Req.write = function (Env, id, data, cb) {
    var path = reqPathFromId(Env, id);
    console.log(path);
    Basic.write(Env, path, data, cb);
};
Req.delete = function (Env, id, cb) {
    var path = reqPathFromId(Env, id);
    Basic.delete(Env, path, cb);
};


const User = SSO.user = {};

User.read = function (Env, id, cb) {
    var path = userPathFromId(Env, id);
    Basic.read(Env, path, cb);
};
User.write = function (Env, id, data, cb) {
    var path = userPathFromId(Env, id);
    Basic.write(Env, path, data, cb);
};
User.delete = function (Env, id, cb) {
    var path = userPathFromId(Env, id);
    Basic.delete(Env, path, cb);
};

const Block = SSO.block = {};

Block.read = function (Env, id, cb) {
    var path = blockPathFromId(Env, id);
    Basic.read(Env, path, cb);
};
Block.write = function (Env, id, data, cb) {
    var path = blockPathFromId(Env, id);
    Basic.write(Env, path, data, cb);
};
Block.delete = function (Env, id, cb) {
    var path = blockPathFromId(Env, id);
    Basic.delete(Env, path, cb);
};
