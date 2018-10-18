define([
    '/common/cryptget.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/file/file-crypto.js',
    '/bower_components/nthen/index.js',
    '/bower_components/saferphore/index.js',
    '/bower_components/jszip/dist/jszip.min.js',
], function (Crypt, Hash, Util, FileCrypto, nThen, Saferphore, JsZip) {

    var sanitize = function (str) {
        return str.replace(/[\\/?%*:|"<>]/gi, '_')/*.toLowerCase()*/;
    };

    var getUnique = function (name, ext, existing) {
        var n = name + ext;
        var i = 1;
        while (existing.indexOf(n.toLowerCase()) !== -1) {
            n = name + ' ('+ i++ + ')' + ext;
        }
        return n;
    };

    var transform = function (ctx, type, sjson, cb) {
        var result = {
            data: sjson,
            ext: '.json',
        };
        var json;
        try {
            json = JSON.parse(sjson);
        } catch (e) {
            return void cb(result);
        }
        var path = '/' + type + '/export.js';
        require([path], function (Exporter) {
            Exporter.main(json, function (data) {
                result.ext = '.' + Exporter.type;
                result.data = data;
                cb(result);
            });
        }, function () {
            cb(result);
        });
    };

    // Add a file to the zip. We have to cryptget&transform it if it's a pad
    // or fetch&decrypt it if it's a file.
    var addFile = function (ctx, zip, fData, existingNames) {
        if (!fData.href && !fData.roHref) {
            return void ctx.errors.push({
                error: 'EINVAL',
                data: fData
            });
        }

        var parsed = Hash.parsePadUrl(fData.href || fData.roHref);
        if (['pad', 'file'].indexOf(parsed.hashData.type) === -1) { return; }

        // waitFor is used to make sure all the pads and files are process before downloading the zip.
        var w = ctx.waitFor();

        // Work with only 10 pad/files at a time
        ctx.sem.take(function (give) {
            var opts = {
                password: fData.password
            };
            var rawName = fData.filename || fData.title || 'File';
            console.log(rawName);
            var g = give();

            var done = function () {
                //setTimeout(g, 2000);
                g();
                w();
            };
            var error = function (err) {
                done();
                return void ctx.errors.push({
                    error: err,
                    data: fData
                });
            };

            // Pads (pad,code,slide,kanban,poll,...)
            var todoPad = function () {
                ctx.get({
                    hash: parsed.hash,
                    opts: opts
                }, function (err, val) {
                    if (err) { return void error(err); }
                    if (!val) { return void error('EEMPTY'); }

                    var opts = {
                        binary: true,
                    };
                    transform(ctx, parsed.type, val, function (res) {
                        if (!res.data) { return void error('EEMPTY'); }
                        var fileName = getUnique(sanitize(rawName), res.ext, existingNames);
                        existingNames.push(fileName.toLowerCase());
                        zip.file(fileName, res.data, opts);
                        console.log('DONE ---- ' + fileName);
                        setTimeout(done, 1000);
                    });
                });
            };

            // Files (mediatags...)
            var todoFile = function () {
                var secret = Hash.getSecrets('file', parsed.hash, fData.password);
                var hexFileName = secret.channel;
                var src = Hash.getBlobPathFromHex(hexFileName);
                var key = secret.keys && secret.keys.cryptKey;
                Util.fetch(src, function (err, u8) {
                    if (err) { return void error('E404'); }
                    FileCrypto.decrypt(u8, key, function (err, res) {
                        if (err) { return void error(err); }
                        var opts = {
                            binary: true,
                        };
                        var extIdx = rawName.lastIndexOf('.');
                        var name = extIdx !== -1 ? rawName.slice(0,extIdx) : rawName;
                        var ext = extIdx !== -1 ? rawName.slice(extIdx) : "";
                        var fileName = getUnique(sanitize(name), ext, existingNames);
                        existingNames.push(fileName.toLowerCase());
                        zip.file(fileName, res.content, opts);
                        console.log('DONE ---- ' + fileName);
                        setTimeout(done, 1000);
                    });
                });
            };
            if (parsed.hashData.type === 'file') {
                return void todoFile();
            }
            todoPad();
        });
        // cb(err, blob);
    };

    // Add folders and their content recursively in the zip
    var makeFolder = function (ctx, root, zip, fd) {
        if (typeof (root) !== "object") { return; }
        var existingNames = [];
        Object.keys(root).forEach(function (k) {
            var el = root[k];
            if (typeof el === "object") {
                var fName = getUnique(sanitize(k), '', existingNames);
                existingNames.push(fName.toLowerCase());
                return void makeFolder(ctx, el, zip.folder(fName), fd);
            }
            if (ctx.data.sharedFolders[el]) {
                var sfData = ctx.sf[el].metadata;
                var sfName = getUnique(sanitize(sfData.title || 'Folder'), '', existingNames);
                existingNames.push(sfName.toLowerCase());
                return void makeFolder(ctx, ctx.sf[el].root, zip.folder(sfName), ctx.sf[el].filesData);
            }
            var fData = fd[el];
            if (fData) {
                addFile(ctx, zip, fData, existingNames);
                return;
            }
        });
    };

    // Main function. Create the empty zip and fill it starting from drive.root
    var create = function (data, getPad, cb) {
        if (!data || !data.uo || !data.uo.drive) { return void cb('EEMPTY'); }
        var sem = Saferphore.create(5);
        var ctx = {
            get: getPad,
            data: data.uo.drive,
            sf: data.sf,
            zip: new JsZip(),
            errors: [],
            sem: sem,
        };
        nThen(function (waitFor) {
            ctx.waitFor = waitFor;
            var zipRoot = ctx.zip.folder('Root');
            makeFolder(ctx, ctx.data.root, zipRoot, ctx.data.filesData);
        }).nThen(function () {
            console.log(ctx.zip);
            console.log(ctx.errors);
            ctx.zip.generateAsync({type: 'blob'}).then(function (content) {
                cb(content);
            });
        });
    };

    return {
        create: create
    };
});
