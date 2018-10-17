define([
    '/common/cryptget.js',
    '/common/common-hash.js',
    '/bower_components/nthen/index.js',
    '/bower_components/saferphore/index.js',
    '/bower_components/jszip/dist/jszip.min.js',
], function (Crypt, Hash, nThen, Saferphore, JsZip) {

    var sanitize = function (str) {
        return str.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    };

    var getUnique = function (name, ext, existing) {
        var n = name;
        var i = 1;
        while (existing.indexOf(n) !== -1) {
            n = name + ' ('+ i++ + ')';
        }
        return n;
    };

    var addFile = function (ctx, zip, fData, existingNames) {
        if (!fData.href && !fData.roHref) {
            return void ctx.errors.push({
                error: 'EINVAL',
                data: fData
            });
        }

        var parsed = Hash.parsePadUrl(fData.href || fData.roHref);
        // TODO deal with files here
        if (parsed.hashData.type !== 'pad') { return; }

        var w = ctx.waitFor();
        ctx.sem.take(function (give) {
            var opts = {
                password: fData.password
            };
            var rawName = fData.fileName || fData.title || 'File';
            console.log(rawName);
            ctx.get({
                hash: parsed.hash,
                opts: opts
            }, give(function (err, val) {
                w();
                if (err) {
                    return void ctx.errors.push({
                        error: err,
                        data: fData
                    });
                }
                // TODO transform file here
                // var blob = transform(val, type);
                var opts = {};
                var fileName = getUnique(sanitize(rawName), '.txt', existingNames);
                existingNames.push(fileName);
                zip.file(fileName, val, opts);
                console.log('DONE ---- ' + rawName);
            }));
        });
        // cb(err, blob);
        // wiht blob.name not undefined
    };

    var makeFolder = function (ctx, root, zip) {
        if (typeof (root) !== "object") { return; }
        var existingNames = [];
        Object.keys(root).forEach(function (k) {
            var el = root[k];
            if (typeof el === "object") {
                var fName = getUnique(sanitize(k), '', existingNames);
                existingNames.push(fName);
                return void makeFolder(ctx, el, zip.folder(fName));
            }
            if (ctx.data.sharedFolders[el]) {
                // TODO later...
                return;
            }
            var fData = ctx.data.filesData[el];
            if (fData) {
                addFile(ctx, zip, fData, existingNames);
                return;
            }
            // What is this element?
            console.error(el);
        });
    };

    var create = function (data, getPad, cb) {
        if (!data || !data.drive) { return void cb('EEMPTY'); }
        var sem = Saferphore.create(10);
        var ctx = {
            get: getPad,
            data: data.drive,
            zip: new JsZip(),
            errors: [],
            sem: sem,
        };
        nThen(function (waitFor) {
            ctx.waitFor = waitFor;
            var zipRoot = ctx.zip.folder('Root');
            makeFolder(ctx, data.drive.root, zipRoot);
        }).nThen(function () {
            // TODO call cb with ctx.zip here
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
