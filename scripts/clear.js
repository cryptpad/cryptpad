// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const Fs = require("fs");
const readline = require("node:readline");
const inter = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var config = require("../lib/load-config");
var Env = require("../lib/env").create(config);
Env.Log = { error: console.log };

var paths = Env.paths;

const q = 'This will permanently delete all existing data on your instance. Are you sure (y/n)? ';
inter.question(q, response => {
    let msg = response.toLowerCase().trim();
    if (!['y', 'yes'].includes(msg)) {
        console.log('Abort');
        inter.close();
        process.exit();
        return;
    }
    console.log('Deleting all data...');

    Object.values(paths).forEach(function (path) {
        console.log(`Deleting ${path}`);
        Fs.rmSync(path, { recursive: true, force: true });
        console.log('Deleted');
    });
    console.log('Success');

    inter.close();
    process.exit();
});
