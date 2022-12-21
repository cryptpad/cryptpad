var prompt = require('prompt-confirm');
const p = new prompt('Are you sure? This will permanently delete all existing data on your instance.');

const nThen = require("nthen");
const Fs = require("fs");
const Path = require("path");

var config = require("../lib/load-config");
var Hash = require('../www/common/common-hash');
var Env = require("../lib/env").create(config);
Env.Log = { error: console.log };

var keyOrDefaultString = function (key, def) {
    return Path.resolve(typeof(config[key]) === 'string'? config[key]: def);
};
var paths = Env.paths;
p.ask(function (answer) {
    if (!answer) {
        console.log('Abort');
        return;
    }
    console.log('Deleting all data...');
    var n = nThen;
    Object.values(paths).forEach(function (path) {
        console.log(`Deleting ${path}`);
        fs.rmSync(path, { recursive: true, force: true });
        console.log('Deleted');
    });
    console.log('Success');
});
