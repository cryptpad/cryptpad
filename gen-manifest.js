/* jshint esversion: 6 */
/* global Buffer */
const Fs = require('fs');
const nThen = require('nthen');
const Crypto = require('crypto');
const Nacl = require('tweetnacl');
const Sortify = require('json.sortify');
//const SigKey = require('~/.cryptpad_signing_key.json');

const KEY_FILE = process.env.HOME + '/.cryptpad_signing_key.json';
const MANIFEST_FILE = './customize.dist/manifest.js';
const VERSION_FILE = './customize.dist/version.txt';

const nameMapper = (name) => {
    if (name.startsWith('./www/')) {
        return name.replace(/^\.\/www\//, '');
    }
    if (name.startsWith('./customize.dist/')) {
        return name.replace(/^\.\/customize.dist\//, 'customize/');
    }
    throw new Error();
};

const PUBLIC_KEY = "MYaWgwAcOHIp3sZFGXeWsQX3u7U8PZrqIDaM2jNhXWY=";

const validate = (cb) => {
    const key = Nacl.util.decodeBase64(PUBLIC_KEY);
    Fs.readFile(VERSION_FILE, 'utf8', (err, ret) => {
        if (err) { throw err; }
        const buf = Nacl.util.decodeBase64(ret);
        const data = Nacl.sign.open(buf, key);
        cb(new Buffer(data).toString('utf8'));
    });
};

const release = () => {
    const key = Nacl.sign.keyPair.fromSeed(new Buffer(require(KEY_FILE).seed, 'hex'));
    const files = [];
    const fileHashes = {};
    let manifestHash;
    let lastVersion = 0;
    nThen((w) => {
        const recurse = (dir) => {
            Fs.readdir(dir, w((err, ret) => {
                if (err) { throw err; }
                ret.forEach((_f) => {
                    const f = dir + '/' + _f;
                    Fs.stat(f, w((err, stat) => {
                        if (err) { throw err; }
                        if (stat.isDirectory()) {
                            //console.log('DIR ', f);
                            recurse(f);
                        } else if (/\.js$/.test(f)) {
                            //console.log('FILE', f);
                            files.push(f);
                        }
                    }));
                });
            }));
        };
        recurse('./www');
        recurse('./customize.dist');
    }).nThen((w) => {
        let nt = nThen;
        files.forEach((f) => {
            nt = nt((w) => {
                Fs.readFile(f, w((err, ret) => {
                    if (err) { throw err; }
                    fileHashes[f] = Crypto.createHash('sha256').update(ret).digest('base64');
                }));
            }).nThen;
        });
        nt(w());
    }).nThen((w) => {
        const manifest = { files: {} };
        Object.keys(fileHashes).forEach((k) => {
            let obj = manifest.files;
            const elems = nameMapper(k).split('/');
            const jsf = elems.pop();
            elems.forEach((ke) => { obj = obj[ke] = obj[ke] || {}; });
            obj[jsf] = fileHashes[k];
        });
        Fs.writeFile(MANIFEST_FILE, 'defineManifest(' + Sortify(manifest, null, '  ') + ');', w((err) => {
            if (err) { throw err; }
        }));
    }).nThen((w) => {
        Fs.readFile(MANIFEST_FILE, w((err, ret) => {
            if (err) { throw err; }
            manifestHash = Crypto.createHash('sha256').update(ret).digest('base64');
        }));
    }).nThen((w) => {
        validate(w((ver) => { lastVersion = JSON.parse(ver)[0]; }));
    }).nThen((w) => {
        const data = [ lastVersion + 1, manifestHash ];
        const sig = Nacl.sign(new Buffer(JSON.stringify(data), 'utf8'), key.secretKey);
        data.push(sig);
        Fs.writeFile(VERSION_FILE, new Buffer(sig).toString('base64'), w((err) => {
            if (err) { throw err; }
            console.log('Saved!');
        }));
    });
};

const keypair = () => {
    if (Fs.exists(KEY_FILE)) { throw new Error(); }
    const data = JSON.stringify({ seed: Crypto.randomBytes(32).toString('hex') });
    Fs.writeFile(KEY_FILE, data, (err) => {
        if (err) { throw err; }
        console.log('Generated');
    });
    //console.log(Nacl.sign.keyPair());
};

//keypair();
release();
//validate();
