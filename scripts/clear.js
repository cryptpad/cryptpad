// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

var prompt = require('prompt-confirm');
const p = new prompt('Are you sure? This will permanently delete all existing data on your instance.');

const Fs = require("fs");

var config = require("../lib/load-config");
var Env = require("../lib/env").create(config);
Env.Log = { error: console.log };

var paths = Env.paths;
p.ask(function (answer) {
    if (!answer) {
        console.log('Abort');
        return;
    }
    console.log('Deleting all data...');
    Object.values(paths).forEach(function (path) {
        console.log(`Deleting ${path}`);
        Fs.rmSync(path, { recursive: true, force: true });
        console.log('Deleted');
    });
    console.log('Success');
});
