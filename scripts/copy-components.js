const Fs = require("fs");
const Fse = require("fs-extra");
const Path = require("path");

const componentsPath = Path.join("www", "components");
Fse.mkdirpSync(componentsPath);

[
    "jquery",
    "tweetnacl",
    "ckeditor",
    "codemirror",
    "marked",
    "rangy",
    "components-font-awesome",
    "requirejs",
    "requirejs-plugins",
    "json.sortify",
    "hyper-json",
    "chainpad",
    "chainpad-crypto",
    "chainpad-listmap",
    "chainpad-netflux",
    "file-saver",
    "alertify.js",
    "scrypt-async",
    "require-css",
    "bootstrap",
    "nthen",
    "open-sans-fontface",
    "bootstrap-tokenfield",
    "localforage",
    "html2canvas",
].forEach(l => {
    const source = Path.join("node_modules", l);
    const destination = Path.join(componentsPath, l);
    Fs.cpSync(source, destination, { recursive: true });
});
