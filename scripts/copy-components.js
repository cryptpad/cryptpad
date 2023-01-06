const Fs = require("fs");
const Fse = require("fs-extra");
const Path = require("path");

const componentsPath = Path.join("www", "components");
Fse.mkdirpSync(componentsPath);

[
    "jquery",
    "tweetnacl",
].forEach(l => {
    const source = Path.join("node_modules", l);
    const destination = Path.join(componentsPath, l);
    Fs.cpSync(source, destination, { recursive: true });
});
