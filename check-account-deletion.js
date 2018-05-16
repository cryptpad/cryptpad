/* jshint esversion: 6, node: true */
const Fs = require('fs');
const nThen = require('nthen');
const Pinned = require('./pinned');
const Nacl = require('tweetnacl');

const hashesFromPinFile = (pinFile, fileName) => {
    var pins = {};
    pinFile.split('\n').filter((x)=>(x)).map((l) => JSON.parse(l)).forEach((l) => {
        switch (l[0]) {
            case 'RESET': {
                pins = {};
                if (l[1] && l[1].length) { l[1].forEach((x) => { pins[x] = 1; }); }
                //jshint -W086
                // fallthrough
            }
            case 'PIN': {
                l[1].forEach((x) => { pins[x] = 1; });
                break;
            }
            case 'UNPIN': {
                l[1].forEach((x) => { delete pins[x]; });
                break;
            }
            default: throw new Error(JSON.stringify(l) + '  ' + fileName);
        }
    });
    return Object.keys(pins);
};

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
    const ed = Nacl.util.decodeBase64(deleteData.toSign.edPublic);
    const signed = Nacl.util.decodeUTF8(JSON.stringify(deleteData.toSign));
    const proof = Nacl.util.decodeBase64(deleteData.proof);
    if (!Nacl.sign.detached.verify(signed, proof, ed)) { return void console.error("Invalid signature"); }
    edPublic = escapeKeyCharacters(deleteData.toSign.edPublic);
}

let data = [];
let pinned = [];

nThen((waitFor) => {
    let f = './pins/' + edPublic.slice(0, 2) + '/' + edPublic + '.ndjson';
    Fs.readFile(f, waitFor((err, content) => {
        if (err) { throw err; }
        pinned = hashesFromPinFile(content.toString('utf8'), f);
    }));
}).nThen((waitFor) => {
    Pinned.load(waitFor((d) => {
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

