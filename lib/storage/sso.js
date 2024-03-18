// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const Basic = require("./basic");
const Path = require("node:path");
const Util = require("../common-util");

const SSO = module.exports;
/*  This module manages storage related to Single Sign-On (SSO) settings.

A first part (sso-requests) contains temporary files for sso authentication with a remote service
A second part (sso-users) is a database of accounts registered via SSO (SSO id ==> block seed)
A third part (sso-blocks) is a database of blocks that are sso-protected (block id ==> SSO id...)

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
var blockPathFromId = function (Env, id) {
    return pathFromId(Env, id, 'sso_block');
};

var userPathFromId = function (Env, id, provider) {
    if (!id || typeof(id) !== 'string') { return; }
    if (!provider || typeof(provider) !== 'string') { return; }
    id = Util.escapeKeyCharacters(id);
    return Path.join(Env.paths.base, 'sso_user', provider, id.slice(0, 2), `${id}.json`);
};

var blockArchivePath = function (Env, id) {
    return Path.join(Env.paths.archive, 'sso_block', id.slice(0, 2), `${id}.json`);
};
var userArchivePath = function (Env, id, provider) {
    return Path.join(Env.paths.archive, 'sso_user', provider, id.slice(0, 2), `${id}.json`);
};

const Req = SSO.request = {};

Req.read = function (Env, id, cb) {
    var path = reqPathFromId(Env, id);
    Basic.read(Env, path, cb);
};
Req.write = function (Env, id, data, cb) {
    var path = reqPathFromId(Env, id);
    Basic.write(Env, path, data, cb);
};
Req.delete = function (Env, id, cb) {
    var path = reqPathFromId(Env, id);
    Basic.delete(Env, path, cb);
};


const User = SSO.user = {};

User.read = function (Env, provider, id, cb) {
    var path = userPathFromId(Env, id, provider);
    Basic.read(Env, path, cb);
};
User.write = function (Env, provider, id, data, cb) {
    var path = userPathFromId(Env, id, provider);
    Basic.write(Env, path, data, cb);
};
User.delete = function (Env, provider, id, cb) {
    var path = userPathFromId(Env, id, provider);
    Basic.delete(Env, path, cb);
};
User.archive = function (Env, provider, id, cb) {
    var path = userPathFromId(Env, id, provider);
    var archivePath = userArchivePath(Env, id, provider);
    Basic.archive(Env, path, archivePath, cb);
};
User.restore = function (Env, provider, id, cb) {
    var path = userPathFromId(Env, id, provider);
    var archivePath = userArchivePath(Env, id, provider);
    Basic.restore(Env, archivePath, path, cb);
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
Block.archive = function (Env, id, cb) {
    var path = blockPathFromId(Env, id);
    var archivePath = blockArchivePath(Env, id);
    Basic.archive(Env, path, archivePath, cb);
};
Block.restore = function (Env, id, cb) {
    var path = blockPathFromId(Env, id);
    var archivePath = blockArchivePath(Env, id);
    Basic.restore(Env, archivePath, path, cb);
};
