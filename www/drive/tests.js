define([
    '/common/cryptpad-common.js',
    '/common/userObject.js',
    'json.sortify',
],function (Cryptpad, FO, sortify) {
    var module = {};

    var href1 = "/pad/#/1/edit/a798u+miu2tg5b-QaP9SvA/UIPoGUPewZscBUFhNIi+eBBM/";
    var href2 = "/poll/#/1/edit/uFJTXjQUEwV2bl-y3cKVpP/LJ-4qPnpR5iY0HVdwLcnjLsx/";
    var href3 = "/code/#/1/edit/R1kZC1mY9khSsrLCyJT+CA/jtQrCxbTiqQJ4HyUxbFBnmG8/";
    var href4 = "/slide/#/1/edit/R2bZC1mY9khSsrLCyJT+CA/mlQrCxbTiqQJ4HyUxbFBnmG8/";

    module.test = function (assert) {
        var config = {Cryptpad: Cryptpad, workgroup: false};
        assert(function (cb) {
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
                    && !files.filesData[files.template[0]].filename
            return cb(res);
        }, "DRIVE1: migration and fixFiles without unsorted");

        assert(function (cb) {
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
                return typeof files.root[x] === "number"
            })[0];
            if (!fileKey || !fileKey2) { return cb(); }
            var fileId = files.root.Folder2[fileKey];
            var fileId2 = files.root[fileKey2];
            var res = typeof fileId === "number"
                    && typeof files.filesData[fileId] === "object"
                    && files.filesData[fileId].filename === "FileName"
                    && typeof fileId2 === "number"
                    && typeof files.filesData[fileId2] === "object"
                    && !files.filesData[fileId2].filename
            return cb(res);
        }, "DRIVE2: migration and fixFiles with unsorted");

        assert(function (cb) {
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
                    && files.filesData[files.template[0]].href === href3
                    && typeof fileId2 === "number"
                    && typeof files.filesData[fileId2] === "object"
                    && files.filesData[fileId2].filename === "Trash"
                    && files.filesData[fileId2].href === href4;
            return cb(res);
        }, "DRIVE4: migration and fixFiles with a pad in trash not root");

    };

    //TODO test with a file not in RECENTPADS 

    return module;
});
