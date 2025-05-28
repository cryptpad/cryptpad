// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const Fs = require('fs');
const nThen = require('nthen');
const Nacl = require('tweetnacl/nacl-fast');
const Path = require('path');
const Pins = require('../lib/pins');
const Util = require('../lib/common-util');
const Config = require('../lib/load-config');

var escapeKeyCharacters = function (key) {
    return key && key.replace && key.replace(/\//g, '-');
};


const dataIdx = process.argv.indexOf('--data');
let edPublic;
if (dataIdx === -1) {
    const hasEdPublic = process.argv.indexOf('--ed');
    if (hasEdPublic === -1) { return void console.error("Missing ed argument"); }
    edPublic = escapeKeyCharacters(process.argv[hasEdPublic+1]);
} else {
    const deleteData = JSON.parse(process.argv[dataIdx+1]);
    if (!deleteData.toSign || !deleteData.proof) { return void console.error("Invalid arguments"); }
    // Check sig
    const ed = Util.decodeBase64(deleteData.toSign.edPublic);
    const signed = Util.decodeUTF8(JSON.stringify(deleteData.toSign));
    const proof = Util.decodeBase64(deleteData.proof);
    if (!Nacl.sign.detached.verify(signed, proof, ed)) { return void console.error("Invalid signature"); }
    edPublic = escapeKeyCharacters(deleteData.toSign.edPublic);
}

let data = [];
let pinned = [];

nThen((waitFor) => {
    var pinPath = Config.pinPath || './pins';

    let f = Path.join(pinPath, edPublic.slice(0, 2), edPublic + '.ndjson');
    Fs.readFile(f, waitFor((err, content) => {
        if (err) { throw err; }
        pinned = Pins.calculateFromLog(content.toString('utf8'), f);
    }));
}).nThen((waitFor) => {
    Pins.load(waitFor((err, d) => {
        data = Object.keys(d);
    }), {
        exclude: [edPublic + '.ndjson']
    });
}).nThen(() => {
    console.log('Pads pinned by this user and not pinned by anybody else:');
    pinned.forEach((p) => {
        if (data.indexOf(p) === -1) {
            console.log(p);
        }
    });
});

