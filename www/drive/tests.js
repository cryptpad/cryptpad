define([
    '/common/cryptpad-common.js',
    '/common/userObject.js',
],function (Cryptpad, FO) {
    var module = {};

    var href1 = "/pad/#/1/edit/a798u+miu2tg5b-QaP9SvA/UIPoGUPewZscBUFhNIi+eBBM/";
    var href2 = "/poll/#/1/edit/uFJTXjQUEwV2bl-y3cKVpP/LJ-4qPnpR5iY0HVdwLcnjLsx/";
    var href3 = "/code/#/1/view/eRS+YPTTASNqjRbgrznAdQ/2OyNsvfYw7ZwLg6wkJuCaGBzOZvxNLra9n7GN848Zic/";
    var href4 = "/slide/#/1/edit/R2bZC1mY9khSsrLCyJT+CA/mlQrCxbTiqQJ4HyUxbFBnmG8/";
    var href5 = "/whiteboard/#/1/edit/k8bZC1mY9khSsrLCyJT+CA/moQrCxbTiqQJ4HyUxbFBnmG8/";

    var id1 = 1000000000001;
    var id2 = 1000000000002;
    var id3 = 1000000000003;
    var id4 = 1000000000004;
    var example = {
        "root": {
            "Folder": {
                "Sub": {}
            },
            "Folder2": {
                "rdmStrFile1": id1
            }
        },
        "template": [id2],
        "trash": {
            "DeletedF": [{
                "path": ["root"],
                "element": {}
            },{
                "path": ["root"],
                "element": {
                    "rdmStrFile3": id3
                }
            }],
            "Title4": [{
                "path": ["root", "Folder"],
                "element": id4
            }]
        },
        "filesData": {
            "1000000000004": {
                "atime": 23456783489,
                "ctime": 12345678999,
                "href": href4,
                "title": "Title4"
            },
            "1000000000003": {
                "atime": 23456783456,
                "ctime": 12345678901,
                "href": href3,
                "title": "Title3"
            },
            "1000000000002": {
                "atime": 23456789012,
                "ctime": 12345789235,
                "href": href2,
                "title": "Title2"
            },
            "1000000000001": {
                "atime": 23456789012,
                "ctime": 12345789235,
                "href": href1,
                "title": "Title1",
                "filename": "FileName1"
            }
        }
    };

    module.test = function (assert) {
        var config = {
            outer: true,
            workgroup: false,
            testMode: true,
            loggedIn: false
        };

        // MIGRATION FROM HREF TO ID
        assert(function (cb) {
            console.log('START DRIVE1');
            var files = {
              "root": {
                "Folder": {},
                "Folder2": {
                  "FileName": href1
                }
              },
              "template": [href3],
              "trash": {
                "DeletedF": [{
                  "path": ["root"],
                  "element": {}
                }, {
                  "path": ["root", "Folder"],
                  "element": href2
                }]
              },
              "CryptPad_RECENTPADS": [{
                "atime": 23456783456,
                "ctime": 12345678901,
                "href": href3,
                "title": "pewcode"
              }, {
                "atime": 23456789012,
                "ctime": 12345789235,
                "href": href2,
                "title": "pewpoll"
              }, {
                "atime": 23456789012,
                "ctime": 12345789235,
                "href": href1,
                "title": "pewpad"
              }]
            };
            var fo = FO.init(files, config);
            var todo = function () {
                fo.fixFiles();
                if (files['CryptPad_RECENTPADS'] || !files.filesData) {
                    console.log("DRIVE1: migration from RECENTPADS to filesData failed");
                    return cb();
                }
                var fileKey = Object.keys(files.root.Folder2)[0];
                if (!fileKey) { return cb(); }
                var fileId = files.root.Folder2[fileKey];
                var res = typeof fileId === "number"
                        && typeof files.filesData[fileId] === "object"
                        && files.filesData[fileId].filename === "FileName"
                        && typeof files.trash.DeletedF[1].element === "number"
                        && typeof files.filesData[files.trash.DeletedF[1].element] === "object"
                        && files.filesData[files.trash.DeletedF[1].element].filename === "DeletedF"
                        && typeof files.template[0] === "number"
                        && typeof files.filesData[files.template[0]] === "object"
                        && !files.filesData[files.template[0]].filename;
                return cb(res);
            };
            fo.migrate(todo);
        }, "DRIVE1: migration and fixFiles without unsorted");

        assert(function (cb) {
            console.log('START DRIVE2');
            var files = {
              "root": {
                "Folder": {},
                "Folder2": {
                  "FileName": "/pad/#/1/edit/a798u+miu2tg5b-QaP9SvA/UIPoGUPewZscBUFhNIi+eBBM/"
                }
              },
              "unsorted": ["/code/#/1/edit/R1kZC1mY9khSsrLCyJT+CA/jtQrCxbTiqQJ4HyUxbFBnmG8/"],
              "trash": {},
              "CryptPad_RECENTPADS": [{
                "atime": 23456783456,
                "ctime": 12345678901,
                "href": "/code/#/1/edit/R1kZC1mY9khSsrLCyJT+CA/jtQrCxbTiqQJ4HyUxbFBnmG8/",
                "title": "pewcode"
              }, {
                "atime": 23456789012,
                "ctime": 12345789235,
                "href": "/pad/#/1/edit/a798u+miu2tg5b-QaP9SvA/UIPoGUPewZscBUFhNIi+eBBM/",
                "title": "pewpad"
              }]
            };
            var fo = FO.init(files, config);
            var todo = function () {
                fo.fixFiles();
                if (files['CryptPad_RECENTPADS'] || !files.filesData) {
                    console.log("DRIVE2: migration from RECENTPADS to filesData failed");
                    return cb();
                }
                if (!files.template) {
                    console.log("DRIVE2: template is missing");
                    return cb();
                }
                if (files.unsorted) {
                    console.log("DRIVE2: unsorted not removed");
                    return cb();
                }
                var fileKey = Object.keys(files.root.Folder2)[0];
                var fileKey2 = Object.keys(files.root).filter(function (x) {
                    return typeof files.root[x] === "number";
                })[0];
                if (!fileKey || !fileKey2) { return cb(); }
                var fileId = files.root.Folder2[fileKey];
                var fileId2 = files.root[fileKey2];
                var res = typeof fileId === "number"
                        && typeof files.filesData[fileId] === "object"
                        && files.filesData[fileId].filename === "FileName"
                        && typeof fileId2 === "number"
                        && typeof files.filesData[fileId2] === "object"
                        && !files.filesData[fileId2].filename;
                return cb(res);
            };
            fo.migrate(todo);
        }, "DRIVE2: migration and fixFiles with unsorted");

        assert(function (cb) {
            console.log('START DRIVE3');
            var files = {
              "root": {
                "Folder": {},
                "Folder2": {
                  "FileName": href1
                }
              },
              "template": [href3],
              "trash": {
                "DeletedF": [{
                  "path": ["root"],
                  "element": { "Trash": href4 }
                }, {
                  "path": ["root", "Folder"],
                  "element": href2
                }]
              },
              "CryptPad_RECENTPADS": []
            };
            var fo = FO.init(files, config);
            var todo = function () {
                fo.fixFiles();
                if (files['CryptPad_RECENTPADS'] || !files.filesData) {
                    console.log("DRIVE2: migration from RECENTPADS to filesData failed");
                    return cb();
                }
                var fileKey = Object.keys(files.root.Folder2)[0];
                var fileKey2 = Object.keys(files.trash.DeletedF[0].element)[0];
                if (!fileKey || !fileKey2) { return cb(); }
                var fileId = files.root.Folder2[fileKey];
                var fileId2 = files.trash.DeletedF[0].element[fileKey2];
                var res = typeof fileId === "number"
                        && typeof files.filesData[fileId] === "object"
                        && files.filesData[fileId].filename === "FileName"
                        && files.filesData[fileId].href === href1
                        && typeof files.trash.DeletedF[1].element === "number"
                        && typeof files.filesData[files.trash.DeletedF[1].element] === "object"
                        && files.filesData[files.trash.DeletedF[1].element].filename === "DeletedF"
                        && files.filesData[files.trash.DeletedF[1].element].href === href2
                        && typeof files.template[0] === "number"
                        && typeof files.filesData[files.template[0]] === "object"
                        && !files.filesData[files.template[0]].filename
                        && !files.filesData[files.template[0]].href
                        && files.filesData[files.template[0]].roHref === href3
                        && typeof fileId2 === "number"
                        && typeof files.filesData[fileId2] === "object"
                        && files.filesData[fileId2].filename === "Trash"
                        && files.filesData[fileId2].href === href4;
                return cb(res);
            };
            fo.migrate(todo);
        }, "DRIVE4: migration and fixFiles with a pad in trash not root");

        // Pad attributes migration
/*
        assert(function (cb) {
            console.log('START PAD ATTRIBUTES');
            var files = JSON.parse(JSON.stringify(example));
            files[href1.slice(6) + '.userid'] = 'value';
            files[href1.slice(6) + '.previewMode'] = true;
            var fo = FO.init(files, config);
            fo.fixFiles();
            return cb(files.filesData[id1].userid === 'value'
                        && files.filesData[id1].previewMode);
        }, "PAD ATTRIBUTES");
*/

        // userObject Tests

        // UTILS
        assert(function (cb) {
            console.log('START DRIVE utils');
            var files = JSON.parse(JSON.stringify(example));

            var href6 = "/pad/#67a9385b07352be53e40746d2be6ccd7XAYSuJYYqa9NfmInyGbj7LNy/";
            var id6 = 1000000000006;
            var data = {
                href: href6,
                title: 'Title6',
                atime: +new Date(),
                ctime: +new Date()
            };
            files.filesData[id6] = data;

            var fo = FO.init(files, config);
            fo.fixFiles();


            if (fo.isFile({}) || fo.isFile(href1) || !fo.isFile(href1, true) || !fo.isFile(id1)) {
                console.log("DRIVE utils: isFile returns an incorrect value");
                return cb();
            }
            if (fo.isReadOnlyFile(id1)) {
                console.log("DRIVE utils: isReadOnlyFile returns true for an 'edit' file");
                return cb();
            }
            if (!fo.isReadOnlyFile(id3)) {
                console.log("DRIVE utils: isReadOnlyFile returns false for a 'view' file");
                return cb();
            }
            if (typeof fo.isReadOnlyFile(id6) !== "undefined") {
                console.log("DRIVE utils: isReadOnlyFile should return undefined for a v0 hash");
                return cb();
            }
            if (!fo.hasSubfolder(files.root.Folder) || fo.hasSubfolder(files.root.Folder2)) {
                console.log("DRIVE utils: hasSubfolder returns an incorrect value");
                return cb();
            }
            if (fo.hasFile(files.root.Folder) || !fo.hasFile(files.root.Folder2)) {
                console.log("DRIVE utils: hasFile returns an incorrect value");
                return cb();
            }
            if (JSON.stringify(fo.getFileData(id1)) !== JSON.stringify(files.filesData[id1])) {
                console.log("DRIVE utils: getFileData returns an incorrect value");
                return cb();
            }
            if (fo.getTitle(id4) !== "Title4" || fo.getTitle(id1) !== "FileName1") {
                console.log("DRIVE utils: getTitle returns an incorrect value");
                return cb();
            }
            if (fo.find(["root", "Folder2", "rdmStrFile1"]) !== id1) {
                console.log("DRIVE utils: 'find' returns an incorrect value");
                return cb();
            }
            if (fo.getFiles().length !== 5 || fo.getFiles(['trash']).length !== 2) {
                console.log("DRIVE utils: getFiles returns an incorrect value");
                return cb();
            }
            if (fo.findFile(id4).length !== 1 || fo.findFile(id4)[0].length !== 4) {
                console.log("DRIVE utils: findFile returns an incorrect value");
                return cb();
            }
            if (fo.search('tle2').length !== 1 || fo.search('tle2')[0].data.href !== href2 || fo.search('tle2')[0].paths[0][0] !== 'template') {
                console.log("DRIVE utils: search returns an incorrect value");
                return cb();
            }

            return cb(true);
        }, "DRIVE utils");

        // OPERATIONS
        assert(function (cb) {
            console.log('START DRIVE operations');
            var files = JSON.parse(JSON.stringify(example));
            var fo = FO.init(files, config);
            fo.fixFiles();

            var data = {
                href: href5,
                title: 'Title5',
                atime: +new Date(),
                ctime: +new Date()
            };
            var res;
            var id5;
            // pushData is synchronous in test mode (no pinning)
            fo.pushData(data, function (e, id) {
                fo.add(id, ["root", "Folder"]);
                id5 = id;
                res = JSON.stringify(data) === JSON.stringify(fo.getFileData(id)) &&
                        fo.getFiles(["root"]).indexOf(id) !== -1;
            });
            if (!res) {
                console.log("DRIVE operations: pushData");
                return cb();
            }
            fo.move([["root", "Folder"], ["template", 0]], ["trash"]);
            if (fo.getFiles(["template"]).indexOf(id2) !== -1 ||
                fo.getFiles(["trash"]).indexOf(id5) === -1) {
                console.log("DRIVE operations: move");
                return cb();
            }
            fo.restore(["trash", "Title2", 0, "element"]);
            if (files["template"][0] !== id2 || fo.getFiles(['trash']).indexOf(id2) !== -1) {
                console.log("DRIVE operations: restore");
                return cb();
            }
            files["template"] = [];
            fo.add(id2, ["template"]);
            if (fo.getFiles(['template']).indexOf(id2) === -1) {
                console.log("DRIVE operations");
                return cb();
            }
            var path;
            fo.addFolder(["root", "Folder2"], "subsub", function (o) { path = o.newPath; });
            if (!files.root.Folder2.subsub || path.length !== 3) {
                console.log("DRIVE operations: add folder");
                return cb();
            }
            fo.forget(href2);
            if (files["template"].length !== 0 || fo.getFiles(['trash']).indexOf(id2) === -1) {
                console.log("DRIVE operations: forget");
                return cb();
            }
            fo.restore(["trash", "Title2", 0, "element"]);
            fo.delete([["root", "Folder2", "subsub"],["template",0]]);
            if (files.root.Folder2.subsub || fo.getFiles().indexOf(id2) !== -1) {
                console.log("DRIVE operations: delete");
                return cb();
            }
            fo.emptyTrash();
            if (JSON.stringify(files.trash) !== "{}" || fo.getFiles().indexOf(id5) !== -1 ||
                files.filesData[id5]) {
                console.log("DRIVE operations: emptyTrash");
                return cb();
            }
            fo.rename(["root", "Folder2"], "FolderNew");
            fo.rename(["root", "FolderNew", "rdmStrFile1"], "NewFileName1");
            if (files.root.Folder2 || !files.root.FolderNew ||
                fo.getFileData(id1).filename !== "NewFileName1" ||
                fo.getTitle(id1) !== "NewFileName1") {
                console.log("DRIVE operations: rename");
                return cb();
            }

            cb(true);
        }, "DRIVE operations");
    };

    return module;
});
