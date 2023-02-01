const Fs = require("fs");
const Fse = require("fs-extra");
const Path = require("path");

const componentsPath = Path.join("www", "components");
Fse.mkdirpSync(componentsPath);

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
    "rangy",
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
].forEach(l => {
    const source = Path.join("node_modules", l);
    const destination = Path.join(componentsPath, l);
    Fs.cpSync(source, destination, { recursive: true });
});
