// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const nThen = require("nthen");
const Fs = require("fs");
const Path = require("path");
const Decrees = require("../lib/decrees");

var config = require("../lib/load-config");
var Hash = require('../www/common/common-hash');
var Env = require("../lib/env").create(config);

Env.Log = { error: console.log };

var path = Path.join(Env.paths.decree, 'decree.ndjson');
var token;
nThen(function (w) {
    Decrees.load(Env, w(function (err) {
        if (err) {
            console.error(err);
            w.abort();
            return;
        }
        if (Env.installToken) {
            console.log('Existing token');
            token = Env.installToken;
        }
    }));
}).nThen(function (w) {
    if (Env.installToken) { return; }
    console.log(Env.paths.decree);
    token = Hash.createChannelId() + Hash.createChannelId();
    var decree = ["ADD_INSTALL_TOKEN",[token],"",+new Date()];
    Fs.appendFile(path, JSON.stringify(decree) + '\n', w(function (err) {
        if (err) { console.log(err); return; }
    }));
}).nThen(function () {
    console.log('Install token:');
    console.log(token);
    var url = config.httpUnsafeOrigin + '/install/';
    console.log(`Please visit ${url} to create your first admin user`);

});
