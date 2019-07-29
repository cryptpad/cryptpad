define([
    '/common/cryptget.js',
    '/common/common-hash.js',
    '/common/sframe-common-file.js',
    '/bower_components/nthen/index.js',
    '/bower_components/saferphore/index.js',
    '/bower_components/jszip/dist/jszip.min.js',
], function (Crypt, Hash, SFCFile, nThen, Saferphore, JsZip) {

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
                result.ext = Exporter.ext || '';
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

        ctx.max++;
        // Work with only 10 pad/files at a time
        ctx.sem.take(function (give) {
            var g = give();
            if (ctx.stop) { return; }

            var to;

            var done = function () {
                if (ctx.stop) { return; }
                if (to) { clearTimeout(to); }
                //setTimeout(g, 2000);
                g();
                w();
                ctx.done++;
                ctx.updateProgress('download', {max: ctx.max, current: ctx.done});
            };

            var error = function (err) {
                if (ctx.stop) { return; }
                done();
                return void ctx.errors.push({
                    error: err,
                    data: fData
                });
            };

            to = setTimeout(function () {
                error('TIMEOUT');
            }, 60000);

            setTimeout(function () {
                if (ctx.stop) { return; }
                var opts = {
                    password: fData.password
                };
                var rawName = fData.filename || fData.title || 'File';
                console.log(rawName);

                // Pads (pad,code,slide,kanban,poll,...)
                var todoPad = function () {
                    ctx.get({
                        hash: parsed.hash,
                        opts: opts
                    }, function (err, val) {
                        if (ctx.stop) { return; }
                        if (err) { return void error(err); }
                        if (!val) { return void error('EEMPTY'); }

                        var opts = {
                            binary: true,
                        };
                        transform(ctx, parsed.type, val, function (res) {
                            if (ctx.stop) { return; }
                            if (!res.data) { return void error('EEMPTY'); }
                            var fileName = getUnique(sanitize(rawName), res.ext, existingNames);
                            existingNames.push(fileName.toLowerCase());
                            zip.file(fileName, res.data, opts);
                            console.log('DONE ---- ' + fileName);
                            setTimeout(done, 500);
                        });
                    });
                };

                // Files (mediatags...)
                var todoFile = function () {
                    var it;
                    var dl = SFCFile.downloadFile(fData, function (err, res) {
                        if (it) { clearInterval(it); }
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
                    it = setInterval(function () {
                        if (ctx.stop) {
                            clearInterval(it);
                            dl.cancel();
                        }
                    }, 50);
                };
                if (parsed.hashData.type === 'file') {
                    return void todoFile();
                }
                todoPad();
            });
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
    var create = function (data, getPad, cb, progress) {
        if (!data || !data.uo || !data.uo.drive) { return void cb('EEMPTY'); }
        var sem = Saferphore.create(5);
        var ctx = {
            get: getPad,
            data: data.uo.drive,
            sf: data.sf,
            zip: new JsZip(),
            errors: [],
            sem: sem,
            updateProgress: progress,
            max: 0,
            done: 0
        };
        progress('reading', -1);
        nThen(function (waitFor) {
            ctx.waitFor = waitFor;
            var zipRoot = ctx.zip.folder('Root');
            makeFolder(ctx, ctx.data.root, zipRoot, ctx.data.filesData);
            progress('download', {});
        }).nThen(function () {
            console.log(ctx.zip);
            console.log(ctx.errors);
            progress('compressing', -1);
            ctx.zip.generateAsync({type: 'blob'}).then(function (content) {
                progress('done', -1);
                cb(content, ctx.errors);
            });
        });

        var stop = function () {
            ctx.stop = true;
            delete ctx.zip;
        };
        return {
            stop: stop
        };
    };

    return {
        create: create
    };
});
