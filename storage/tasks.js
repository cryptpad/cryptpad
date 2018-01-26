var Fs = require("fs");
var Path = require("path");
var nacl = require("tweetnacl");
var nThen = require("nthen");

var Tasks = module.exports;

var encode = function (time, command, args) {
    if (typeof(time) !== 'number') { return null; }
    if (typeof(command) !== 'string') { return null; }
    if (!Array.isArray(args)) { return [time, command]; }
    return [time, command].concat(args);
};

var randomId = function () {
    var bytes = Array.prototype.slice.call(nacl.randomBytes(16));
    return bytes.map(function (b) {
        var n = Number(b & 0xff).toString(16);
        return n.length === 1? '0' + n: n;
    }).join('');
};

var mkPath = function (env, id) {
    return Path.join(env.root, id.slice(0, 2), id) + '.ndjson';
};

var getFreeId = function (env, cb, tries) {
    if (tries > 5) { return void cb('ETOOMANYTRIES'); }

    // generate a unique id
    var id = randomId();

    // derive a path from that id
    var path = mkPath(env, id);

    Fs.stat(path, function (err) {
        if (err && err.code === "ENOENT") {
            cb(void 0, id);
        } else {
            getFreeId(env, cb);
        }
    });
};

var write = function (env, task, cb) {
    var str = JSON.stringify(task) + '\n';
    var id = nacl.util.encodeBase64(nacl.hash(nacl.util.decodeUTF8(str))).replace(/\//g, '-');

    var path = mkPath(env, id);
    nThen(function (w) {
        // check if the file already exists...
        Fs.stat(path, w(function (err) {
            if (err && err.code === 'ENOENT') { return; }
            w.abort(); cb();
        }));
    }).nThen(function (w) {
        // create the parent directory if it does not exist
        var dir = id.slice(0, 2);
        var dirpath = Path.join(env.root, dir);

        Fs.mkdir(dirpath, 0x1ff, w(function (err) {
            if (err && err.code !== 'EEXIST') {
                return void cb(err);
            }
        }));
    }).nThen(function (w) {
        // write the file to the path
        Fs.writeFile(mkPath(env, id), str, function (e) {
            if (e) { return void cb(e); }
            cb();
        });
    });
};

Tasks.create = function (config, cb) {
    var env = {
        root: config.taskPath || './tasks',
    };

    // make sure the path exists...
    Fs.mkdir(env.root, 0x1ff, function (err) {
        if (err && err.code !== 'EEXIST') {
            throw err;
        }
        cb(void 0, {
            write: function (time, command, args, cb) {
                var task = encode(time, command, args);
                write(env, task, cb);
            },
        });
    });
};


