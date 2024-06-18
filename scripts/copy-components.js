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
    "components-font-awesome",
    "croppie",
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
    "tweetnacl",
    "require-css",
    "requirejs",
    "requirejs-plugins",
    "scrypt-async",
    "sortablejs",
    // both client and server:
    "chainpad-crypto",
    "saferphore",
    "nthen",
    "netflux-websocket",
    "drawio",
    "pako",
    "x2js"
].forEach(l => {
    const source = Path.join("node_modules", l);
    const destination = Path.join(componentsPath, l);
    Fs.rmSync(destination, { recursive: true, force: true });
    Fs.cpSync(source, destination, { recursive: true });
});
