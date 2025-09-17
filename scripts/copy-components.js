// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const Fs = require("fs");
const Fse = require("fs-extra");
const Path = require("path");

const componentsPath = Path.join("www", "components");
const oldComponentsPath = Path.join("www", "bower_components");
Fse.mkdirpSync(componentsPath);
Fse.rmSync(oldComponentsPath, { recursive: true, force: true });

[
    "alertify.js",
    "bootstrap",
    "bootstrap-tokenfield",
    "chainpad",
    "chainpad-listmap",
    "chainpad-netflux",
    "ckeditor",
    "codemirror",
    "croppie",
    "drawio",
    "file-saver",
    "hyper-json",
    "jquery",
    "json.sortify",
    "jszip",
    "dragula",
    "html2canvas",
    "localforage",
    "marked",
    "mathjax",
    "open-sans-fontface",
    "require-css",
    "requirejs",
    "requirejs-plugins",
    "scrypt-async",
    "sortablejs",
    "tweetnacl",
    "tweetnacl-util",
    "pako",
    "x2js",
    // both client and server:
    "saferphore",
    "chainpad-crypto",
    "nthen",
    "netflux-websocket",
].forEach(l => {
    let s = l;
    if (s === 'tweetnacl') {
        //s += '-old';
    }
    const source = Path.join("node_modules", s);
    const destination = Path.join(componentsPath, l);
    Fs.rmSync(destination, { recursive: true, force: true });
    Fs.cpSync(source, destination, { recursive: true });
});
