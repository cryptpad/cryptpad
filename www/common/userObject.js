define([
    'jquery',
    '/customize/application_config.js'
], function ($, AppConfig) {
    var module = {};

    var ROOT = module.ROOT = "root";
    var UNSORTED = module.UNSORTED = "unsorted";
    var TRASH = module.TRASH = "trash";
    var TEMPLATE = module.TEMPLATE = "template";

    module.init = function (files, config) {
        var exp = {};
        var Cryptpad = config.Cryptpad;
        var Messages = Cryptpad.Messages;

        var FILES_DATA = module.FILES_DATA = exp.FILES_DATA = Cryptpad.storageKey;
        var OLD_FILES_DATA = module.OLD_FILES_DATA = exp.OLD_FILES_DATA = Cryptpad.oldStorageKey;
        var NEW_FOLDER_NAME = Messages.fm_newFolder;
        var NEW_FILE_NAME = Messages.fm_newFile;

        // Logging
        var logging = function () {
            console.log.apply(console, arguments);
        };
        var log = config.log || logging;
        var logError = config.logError || logging;
        var debug = config.debug || logging;
        var error = exp.error = function() {
            exp.fixFiles();
            console.error.apply(console, arguments);
        };

        // TODO: workgroup
        var workgroup = config.workgroup;


        /*
         * UTILS
         */

        exp.getStructure = function () {
            var a = {};
            a[ROOT] = {};
            a[TRASH] = {};
            a[FILES_DATA] = {};
            a[TEMPLATE] = [];
            return a;
        };
        var getHrefArray = function () {
            return [TEMPLATE];
        };


        var compareFiles = function (fileA, fileB) { return fileA === fileB; };

        var isFile = exp.isFile = function (element, allowStr) {
            return typeof(element) === "number" ||
                    ((typeof(files[OLD_FILES_DATA]) !== "undefined" || allowStr)
                        &&  typeof(element) === "string");
        };

        exp.isReadOnlyFile = function (element) {
            if (!isFile(element)) { return false; }
            var data = exp.getFileData(element);
            var parsed = Cryptpad.parsePadUrl(data.href);
            if (!parsed) { return false; }
            var pHash = parsed.hashData;
            if (!pHash || pHash.type !== "pad") { return; }
            return pHash && pHash.mode === 'view';
        };

        var isFolder = exp.isFolder = function (element) {
            return typeof(element) === "object";
        };
        exp.isFolderEmpty = function (element) {
            if (!isFolder(element)) { return false; }
            return Object.keys(element).length === 0;
        };

        exp.hasSubfolder = function (element, trashRoot) {
            if (!isFolder(element)) { return false; }
            var subfolder = 0;
            var addSubfolder = function (el) {
                subfolder += isFolder(el.element) ? 1 : 0;
            };
            for (var f in element) {
                if (trashRoot) {
                    if ($.isArray(element[f])) {
                        element[f].forEach(addSubfolder);
                    }
                } else {
                    subfolder += isFolder(element[f]) ? 1 : 0;
                }
            }
            return subfolder;
        };

        exp.hasFile = function (element, trashRoot) {
            if (!isFolder(element)) { return false; }
            var file = 0;
            var addFile = function (el) {
                file += isFile(el.element) ? 1 : 0;
            };
            for (var f in element) {
                if (trashRoot) {
                    if ($.isArray(element[f])) {
                        element[f].forEach(addFile);
                    }
                } else {
                    file += isFile(element[f]) ? 1 : 0;
                }
            }
            return file;
        };

        // Get data from AllFiles (Cryptpad_RECENTPADS)
        var getFileData = exp.getFileData = function (file) {
            if (!file) { return; }
            return files[FILES_DATA][file] || {};
        };

        // Data from filesData
        var getTitle = exp.getTitle = function (file, type) {
            if (workgroup) { debug("No titles in workgroups"); return; }
            var data = getFileData(file);
            if (!file || !data || !data.href) {
                error("getTitle called with a non-existing file id: ", file, data);
                return;
            }
            if (type === 'title') { return data.title; }
            if (type === 'name') { return data.filename; }
            return data.filename || data.title || NEW_FILE_NAME;
        };

        var getIdFromHref = exp.getIdFromHref = function (href) {
            var result;
            getFiles([FILES_DATA]).some(function (id) {
                if (files[FILES_DATA][id].href === href) {
                    result = id;
                    return true;
                }
                return;
            });
            return result;
        };

        // PATHS

        var comparePath  = exp.comparePath = function (a, b) {
            if (!a || !b || !$.isArray(a) || !$.isArray(b)) { return false; }
            if (a.length !== b.length) { return false; }
            var result = true;
            var i = a.length - 1;
            while (result && i >= 0) {
                result = a[i] === b[i];
                i--;
            }
            return result;
        };

        var isSubpath = exp.isSubpath = function (path, parentPath) {
            var pathA = parentPath.slice();
            var pathB = path.slice(0, pathA.length);
            return comparePath(pathA, pathB);
        };

        var isPathIn = exp.isPathIn = function (path, categories) {
            if (!categories) { return; }
            var idx = categories.indexOf('hrefArray');
            if (idx !== -1) {
                categories.splice(idx, 1);
                categories = categories.concat(getHrefArray());
            }
            return categories.some(function (c) {
                return Array.isArray(path) && path[0] === c;
            });
        };

        var isInTrashRoot = exp.isInTrashRoot = function (path) {
            return path[0] === TRASH && path.length === 4;
        };


        // FIND

        var findElement = function (root, pathInput) {
            if (!pathInput) {
                error("Invalid path:\n", pathInput, "\nin root\n", root);
                return;
            }
            if (pathInput.length === 0) { return root; }
            var path = pathInput.slice();
            var key = path.shift();
            if (typeof root[key] === "undefined") {
                debug("Unable to find the key '" + key + "' in the root object provided:", root);
                return;
            }
            return findElement(root[key], path);
        };

        var find = exp.find = function (path) {
            return findElement(files, path);
        };


        // GET FILES

        var getFilesRecursively = function (root, arr) {
            for (var e in root) {
                if (isFile(root[e])) {
                    if(arr.indexOf(root[e]) === -1) { arr.push(root[e]); }
                } else {
                    getFilesRecursively(root[e], arr);
                }
            }
        };
        var _getFiles = {};
        _getFiles['array'] = function (cat) {
            if (!files[cat]) { files[cat] = []; }
            return files[cat].slice();
        };
        getHrefArray().forEach(function (c) {
            _getFiles[c] = function () { return _getFiles['array'](c); };
        });
        _getFiles['hrefArray'] = function () {
            var ret = [];
            getHrefArray().forEach(function (c) {
                ret = ret.concat(_getFiles[c]());
            });
            return Cryptpad.deduplicateString(ret);
        };
        _getFiles[ROOT] = function () {
            var ret = [];
            getFilesRecursively(files[ROOT], ret);
            return ret;
        };
        _getFiles[TRASH] = function () {
            var root = files[TRASH];
            var ret = [];
            var addFiles = function (el) {
                if (isFile(el.element)) {
                    if(ret.indexOf(el.element) === -1) { ret.push(el.element); }
                } else {
                    getFilesRecursively(el.element, ret);
                }
            };
            for (var e in root) {
                if (!$.isArray(root[e])) {
                    error("Trash contains a non-array element");
                    return;
                }
                root[e].forEach(addFiles);
            }
            return ret;
        };
        _getFiles[OLD_FILES_DATA] = function () {
            var ret = [];
            if (!files[OLD_FILES_DATA]) { return ret; }
            files[OLD_FILES_DATA].forEach(function (el) {
                if (el.href && ret.indexOf(el.href) === -1) {
                    ret.push(el.href);
                }
            });
            return ret;
        };
        _getFiles[FILES_DATA] = function () {
            var ret = [];
            if (!files[FILES_DATA]) { return ret; }
            return Object.keys(files[FILES_DATA]).map(Number);
        };
        var getFiles = exp.getFiles = function (categories) {
            var ret = [];
            if (!categories || !categories.length) {
                categories = [ROOT, 'hrefArray', TRASH, OLD_FILES_DATA, FILES_DATA];
            }
            categories.forEach(function (c) {
                if (typeof _getFiles[c] === "function") {
                    ret = ret.concat(_getFiles[c]());
                }
            });
            return Cryptpad.deduplicateString(ret);
        };

        // SEARCH
        var _findFileInRoot = function (path, file) {
            if (!isPathIn(path, [ROOT, TRASH])) { return []; }
            var paths = [];
            var root = find(path);
            var addPaths = function (p) {
                if (paths.indexOf(p) === -1) {
                    paths.push(p);
                }
            };

            if (isFile(root)) {
                if (compareFiles(file, root)) {
                    if (paths.indexOf(path) === -1) {
                        paths.push(path);
                    }
                }
                return paths;
            }
            for (var e in root) {
                var nPath = path.slice();
                nPath.push(e);
                _findFileInRoot(nPath, file).forEach(addPaths);
            }

            return paths;
        };
        exp.findFileInRoot = function (file) {
            return _findFileInRoot([ROOT], file);
        };
        var _findFileInHrefArray = function (rootName, file) {
            if (!files[rootName]) { return []; }
            var unsorted = files[rootName].slice();
            var ret = [];
            var i = -1;
            while ((i = unsorted.indexOf(file, i+1)) !== -1){
                ret.push([rootName, i]);
            }
            return ret;
        };
        var _findFileInTrash = function (path, file) {
            var root = find(path);
            var paths = [];
            var addPaths = function (p) {
                if (paths.indexOf(p) === -1) {
                    paths.push(p);
                }
            };
            if (path.length === 1 && typeof(root) === 'object') {
                Object.keys(root).forEach(function (key) {
                    var arr = root[key];
                    if (!Array.isArray(arr)) { return; }
                    var nPath = path.slice();
                    nPath.push(key);
                    _findFileInTrash(nPath, file).forEach(addPaths);
                });
            }
            if (path.length === 2) {
                if (!Array.isArray(root)) { return []; }
                root.forEach(function (el, i) {
                    var nPath = path.slice();
                    nPath.push(i);
                    nPath.push('element');
                    if (isFile(el.element)) {
                        if (compareFiles(file, el.element)) {
                            addPaths(nPath);
                        }
                        return;
                    }
                    _findFileInTrash(nPath, file).forEach(addPaths);
                });
            }
            if (path.length >= 4) {
                _findFileInRoot(path, file).forEach(addPaths);
            }
            return paths;
        };
        var findFile = exp.findFile = function (file) {
            var rootpaths = _findFileInRoot([ROOT], file);
            var templatepaths = _findFileInHrefArray(TEMPLATE, file);
            var trashpaths = _findFileInTrash([TRASH], file);
            return rootpaths.concat(templatepaths, trashpaths);
        };
        exp.search = function (value) {
            if (typeof(value) !== "string") { return []; }
            var res = [];
            // Search title
            var allFilesList = files[FILES_DATA];
            var lValue = value.toLowerCase();
            getFiles([FILES_DATA]).forEach(function (id) {
                var data = allFilesList[id];
                if ((data.title && data.title.toLowerCase().indexOf(lValue) !== -1) ||
                    (data.filename && data.filename.toLowerCase().indexOf(lValue) !== -1)) {
                    res.push(id);
                }
            });

            // Search Href
            var href = Cryptpad.getRelativeHref(value);
            if (href) {
                var id = getIdFromHref(href);
                if (id) { res.push(id); }
            }

            res = Cryptpad.deduplicateString(res);

            var ret = [];
            res.forEach(function (l) {
                //var paths = findFile(l);
                ret.push({
                    paths: findFile(l),
                    data: exp.getFileData(l)
                });
            });
            return ret;
        };

        /**
         * OPERATIONS
         */

        var getAvailableName = function (parentEl, name) {
            if (typeof(parentEl[name]) === "undefined") { return name; }
            var newName = name;
            var i = 1;
            while (typeof(parentEl[newName]) !== "undefined") {
                newName = name + "_" + i;
                i++;
            }
            return newName;
        };

        // FILES DATA
        var pushFileData = exp.pushData = function (data, cb) {
            if (typeof cb !== "function") { cb = function () {}; }
            var todo = function () {
                var id = Cryptpad.createRandomInteger();
                files[FILES_DATA][id] = data;
                cb(null, id);
            };
            if (!Cryptpad.isLoggedIn() || !AppConfig.enablePinning || config.testMode) {
                return void todo();
            }
            Cryptpad.pinPads([Cryptpad.hrefToHexChannelId(data.href)], function (e) {
                if (e) { return void cb(e); }
                todo();
            });
        };
        var spliceFileData = exp.removeData = function (id) {
            files[FILES_DATA][id] = undefined;
            delete files[FILES_DATA][id];
        };

        // MOVE
        var pushToTrash = function (name, element, path) {
            var trash = files[TRASH];
            if (typeof(trash[name]) === "undefined") { trash[name] = []; }
            var trashArray = trash[name];
            var trashElement = {
                element: element,
                path: path
            };
            trashArray.push(trashElement);
        };
        var copyElement = function (elementPath, newParentPath) {
            if (comparePath(elementPath, newParentPath)) { return; } // Nothing to do...
            var element = find(elementPath);
            var newParent = find(newParentPath);

            // Move to Trash
            if (isPathIn(newParentPath, [TRASH])) {
                if (!elementPath || elementPath.length < 2 || elementPath[0] === TRASH) {
                    debug("Can't move an element from the trash to the trash: ", elementPath);
                    return;
                }
                var key = elementPath[elementPath.length - 1];
                var elName = isPathIn(elementPath, ['hrefArray']) ? getTitle(element) : key;
                var parentPath = elementPath.slice();
                parentPath.pop();
                pushToTrash(elName, element, parentPath);
                return true;
            }
            // Move to hrefArray
            if (isPathIn(newParentPath, ['hrefArray'])) {
                if (isFolder(element)) {
                    log(Messages.fo_moveUnsortedError);
                    return;
                } else {
                    if (elementPath[0] === newParentPath[0]) { return; }
                    var fileRoot = newParentPath[0];
                    if (files[fileRoot].indexOf(element) === -1) {
                        files[fileRoot].push(element);
                    }
                    return true;
                }
            }
            // Move to root
            var newName = isFile(element) ?
                            getAvailableName(newParent, Cryptpad.createChannelId()) :
                            isInTrashRoot(elementPath) ?
                              elementPath[1] : elementPath.pop();

            if (typeof(newParent[newName]) !== "undefined") {
                log(Messages.fo_unavailableName);
                return;
            }
            newParent[newName] = element;
            return true;
        };
        var move = exp.move = function (paths, newPath, cb) {
            // Copy the elements to their new location
            var toRemove = [];
            paths.forEach(function (p) {
                var parentPath = p.slice();
                parentPath.pop();
                if (comparePath(parentPath, newPath)) { return; }
                if (isSubpath(newPath, p)) {
                    log(Messages.fo_moveFolderToChildError);
                    return;
                }
                // Try to copy, and if success, remove the element from the old location
                if (copyElement(p.slice(), newPath)) {
                    toRemove.push(p);
                }
            });
            exp.delete(toRemove, cb);
        };
        exp.restore = function (path, cb) {
            if (!isInTrashRoot(path)) { return; }
            var parentPath = path.slice();
            parentPath.pop();
            var oldPath = find(parentPath).path;
            move([path], oldPath, cb);
        };


        // ADD
        var add = exp.add = function (id, path) {
            if (!Cryptpad.isLoggedIn()) { return; }
            var data = files[FILES_DATA][id];
            if (!data || typeof(data) !== "object") { return; }
            var newPath = path, parentEl;
            if (path && !Array.isArray(path)) {
                newPath = decodeURIComponent(path).split(',');
            }
            // Add to href array
            if (path && isPathIn(newPath, ['hrefArray'])) {
                parentEl = find(newPath);
                parentEl.push(id);
                return;
            }
            // Add to root if path is ROOT or if no path
            var filesList = getFiles([ROOT, TRASH, 'hrefArray']);
            if (path && isPathIn(newPath, [ROOT]) || filesList.indexOf(href) === -1) {
                parentEl = find(newPath || [ROOT]);
                if (parentEl) {
                    var newName = getAvailableName(parentEl, Cryptpad.createChannelId());
                    parentEl[newName] = id;
                    return;
                }
            }
        };
        exp.addFolder = function (folderPath, name, cb) {
            var parentEl = find(folderPath);
            var folderName = getAvailableName(parentEl, name || NEW_FOLDER_NAME);
            parentEl[folderName] = {};
            var newPath = folderPath.slice();
            newPath.push(folderName);
            cb(void 0, {
                newPath: newPath
            });
        };

        // FORGET (move with href not path)
        exp.forget = function (href) {
            var id = getIdFromHref(href);
            if (!id) { return; }
            if (!Cryptpad.isLoggedIn()) {
                // delete permanently
                exp.removePadAttribute(href);
                spliceFileData(id);
                return;
            }
            var paths = findFile(id);
            move(paths, [TRASH]);
        };

        // DELETE
        // Permanently delete multiple files at once using a list of paths
        // NOTE: We have to be careful when removing elements from arrays (trash root, unsorted or template)
        var removePadAttribute = exp.removePadAttribute = function (f) {
            if (typeof(f) !== 'string') {
                console.error("Can't find pad attribute for an undefined pad");
                return;
            }
            Object.keys(files).forEach(function (key) {
                var hash = f.indexOf('#') !== -1 ? f.slice(f.indexOf('#') + 1) : null;
                if (hash && key.indexOf(hash) === 0) {
                    debug("Deleting pad attribute in the realtime object");
                    files[key] = undefined;
                    delete files[key];
                }
            });
        };
        var checkDeletedFiles = function () {
            // Nothing in OLD_FILES_DATA for workgroups
            if (workgroup || !Cryptpad.isLoggedIn()) { return; }

            var filesList = getFiles([ROOT, 'hrefArray', TRASH]);
            var fData = files[FILES_DATA];
            getFiles([FILES_DATA]).forEach(function (id) {
                if (filesList.indexOf(id) === -1) {
                    removePadAttribute(fData[id].href);
                    spliceFileData(id);
                }
            });
        };
        var deleteHrefs = function (ids) {
            ids.forEach(function (obj) {
                var idx = files[obj.root].indexOf(obj.id);
                files[obj.root].splice(idx, 1);
            });
        };
        var deleteMultipleTrashRoot = function (roots) {
            roots.forEach(function (obj) {
                var idx = files[TRASH][obj.name].indexOf(obj.el);
                files[TRASH][obj.name].splice(idx, 1);
            });
        };
        var deleteMultiplePermanently = function (paths, nocheck) {
            var hrefPaths = paths.filter(function(x) { return isPathIn(x, ['hrefArray']); });
            var rootPaths = paths.filter(function(x) { return isPathIn(x, [ROOT]); });
            var trashPaths = paths.filter(function(x) { return isPathIn(x, [TRASH]); });
            var allFilesPaths = paths.filter(function(x) { return isPathIn(x, [FILES_DATA]); });

            if (!Cryptpad.isLoggedIn()) {
                var toSplice = [];
                allFilesPaths.forEach(function (path) {
                    var el = find(path);
                    if (!el) { return; }
                    var id = getIdFromHref(el.href);
                    if (!id) { return; }
                    spliceFileData(id);
                    removePadAttribute(el.href);
                });
                return;
            }

            var ids = [];
            hrefPaths.forEach(function (path) {
                var id = find(path);
                ids.push({
                    root: path[0],
                    id: id
                });
            });
            deleteHrefs(ids);

            rootPaths.forEach(function (path) {
                var parentPath = path.slice();
                var key = parentPath.pop();
                var parentEl = find(parentPath);
                parentEl[key] = undefined;
                delete parentEl[key];
            });

            var trashRoot = [];
            trashPaths.forEach(function (path) {
                var parentPath = path.slice();
                var key = parentPath.pop();
                var parentEl = find(parentPath);
                // Trash root: we have array here, we can't just splice with the path otherwise we might break the path
                // of another element in the loop
                if (path.length === 4) {
                    trashRoot.push({
                        name: path[1],
                        el: parentEl
                    });
                    return;
                }
                // Trash but not root: it's just a tree so remove the key
                parentEl[key] = undefined;
                delete parentEl[key];
            });
            deleteMultipleTrashRoot(trashRoot);

            // In some cases, we want to remove pads from a location without removing them from
            // OLD_FILES_DATA (replaceHref)
            if (!nocheck) { checkDeletedFiles(); }
        };
        exp.delete = function (paths, cb, nocheck) {
            deleteMultiplePermanently(paths, nocheck);
            if (typeof cb === "function") { cb(); }
        };
        exp.emptyTrash = function (cb) {
            files[TRASH] = {};
            checkDeletedFiles();
            if(cb) { cb(); }
        };

        // RENAME
        exp.rename = function (path, newName, cb) {
            if (path.length <= 1) {
                logError('Renaming `root` is forbidden');
                return;
            }
            // Copy the element path and remove the last value to have the parent path and the old name
            var element = find(path);

            // Folders
            if (isFolder(element)) {
                var parentPath = path.slice();
                var oldName = parentPath.pop();
                if (!newName || !newName.trim() || oldName === newName) { return; }
                var parentEl = find(parentPath);
                if (typeof(parentEl[newName]) !== "undefined") {
                    log(Messages.fo_existingNameError);
                    return;
                }
                parentEl[newName] = element;
                parentEl[oldName] = undefined;
                delete parentEl[oldName];
                if (typeof cb === "function") { cb(); }
                return;
            }

            // Files
            var data = files[FILES_DATA][element];
            if (!data) { return; }
            if (!newName || newName.trim() === "") {
                data.filename = undefined;
                delete data.filename;
                if (typeof cb === "function") { cb(); }
                return;
            }
            var oldName = getTitle(element, 'name');
            if (oldName === newName) { return; }
            data.filename = newName;
            if (typeof cb === "function") { cb(); }
        };

        // REPLACE
        exp.replace = function (o, n) {
            var idO = getIdFromHref(o);
            if (!idO || !isFile(idO)) { return; }
            var data = getFileData(idO);
            if (!data) { return; }
            data.href = n;
        };
        // If all the occurences of an href are in the trash, remvoe them and add the file in root.
        // This is use with setPadTitle when we open a stronger version of a deleted pad
        exp.restoreHref = function (href) {
            var idO = getIdFromHref(href);

            if (!idO || !isFile(idO)) { return; }

            var paths = findFile(idO);

            // Remove all the occurences in the trash
            // If all the occurences are in the trash or no occurence, add the pad to root
            var allInTrash = true;
            paths.forEach(function (p) {
                if (p[0] === TRASH) {
                    exp.delete(p, null, true); // 3rd parameter means skip "checkDeletedFiles"
                    return;
                }
                allInTrash = false;
            });
            if (allInTrash) {
                add(idO);
            }
        };

        /**
         * INTEGRITY CHECK
         */

        exp.migrate = function (cb) {
            // Make sure unsorted doesn't exist anymore
            // Note: Unsorted only works with the old structure where pads are href
            // It should be called before the migration code
            var fixUnsorted = function () {
                if (!files[UNSORTED] || !files[OLD_FILES_DATA]) { return; }
                debug("UNSORTED still exists in the object, removing it...");
                var us = files[UNSORTED];
                if (us.length === 0) {
                    delete files[UNSORTED];
                    return;
                }
                var root = find([ROOT]);
                us.forEach(function (el) {
                    if (typeof el !== "string") {
                        return;
                    }
                    var data = files[OLD_FILES_DATA].filter(function (x) {
                        return x.href === el;
                    });
                    if (data.length === 0) {
                        files[OLD_FILES_DATA].push({
                            href: el
                        });
                    }
                    return;
                });
                delete files[UNSORTED];
            };
            // mergeDrive...
            var migrateToNewFormat = function (todo) {
                if (!files[OLD_FILES_DATA]) {
                    return void todo();
                }
                try {
                    debug("Migrating file system...");
                    files.migrate = 1;
                    if (exp.rt) { exp.rt.sync(); }
                    window.setTimeout(function () {
                        var oldData = files[OLD_FILES_DATA].slice();
                        if (!files[FILES_DATA]) {
                            files[FILES_DATA] = {};
                        }
                        var newData = files[FILES_DATA];
                        //var oldFiles = oldData.map(function (o) { return o.href; });
                        oldData.forEach(function (obj) {
                            if (!obj || !obj.href) { return; }
                            var href = obj.href;
                            var id = Cryptpad.createRandomInteger();
                            var paths = findFile(href);
                            var data = obj;
                            var key = Cryptpad.createChannelId();
                            if (data) {
                                newData[id] = data;
                            } else {
                                newData[id] = {href: href};
                            }
                            paths.forEach(function (p) {
                                var parentPath = p.slice();
                                var okey = parentPath.pop(); // get the parent
                                var parent = find(parentPath);
                                if (isInTrashRoot(p)) {
                                    parent.element = id;
                                    newData[id].filename = p[1];
                                    return;
                                }
                                if (isPathIn(p, ['hrefArray'])) {
                                    parent[okey] = id;
                                    return;
                                }
                                // else root or trash (not trashroot)
                                parent[key] = id;
                                newData[id].filename = okey;
                                delete parent[okey];
                            });
                        });
                        files[OLD_FILES_DATA] = undefined;
                        delete files[OLD_FILES_DATA];
                        files.migrate = undefined;
                        delete files.migrate;
                        console.log('done');
                        todo();
                    }, 300);
                } catch(e) {
                    console.error(e);
                    todo();
                }
            };

            fixUnsorted();
            migrateToNewFormat(cb);
        };

        exp.fixFiles = function () {
            console.error('.');
            // Explore the tree and check that everything is correct:
            //  * 'root', 'trash', 'unsorted' and 'filesData' exist and are objects
            //  * ROOT: Folders are objects, files are href
            //  * TRASH: Trash root contains only arrays, each element of the array is an object {element:.., path:..}
            //  * OLD_FILES_DATA: - Data (title, cdate, adte) are stored in filesData. filesData contains only href keys linking to object with title, cdate, adate.
            //                - Dates (adate, cdate) can be parsed/formatted
            //                - All files in filesData should be either in 'root', 'trash' or 'unsorted'. If that's not the case, copy the fily to 'unsorted'
            //  * TEMPLATE: Contains only files (href), and does not contains files that are in ROOT
            debug("Cleaning file system...");

            var before = JSON.stringify(files);

            var fixRoot = function (elem) {
                if (typeof(files[ROOT]) !== "object") { debug("ROOT was not an object"); files[ROOT] = {}; }
                var element = elem || files[ROOT];
                for (var el in element) {
                    if (!isFile(element[el], true) && !isFolder(element[el])) {
                        debug("An element in ROOT was not a folder nor a file. ", element[el]);
                        element[el] = undefined;
                        delete element[el];
                        continue;
                    }
                    if (isFolder(element[el])) {
                        fixRoot(element[el]);
                        continue;
                    }
                    if (typeof element[el] === "string") {
                        // We have an old file (href) which is not in filesData: add it
                        var id = Cryptpad.createRandomInteger();
                        var key = Cryptpad.createChannelId();
                        files[FILES_DATA][id] = {href: element[el], filename: el};
                        element[key] = id;
                        delete element[el];
                    }
                }
            };
            var fixTrashRoot = function () {
                if (typeof(files[TRASH]) !== "object") { debug("TRASH was not an object"); files[TRASH] = {}; }
                var tr = files[TRASH];
                var toClean;
                var addToClean = function (obj, idx, el) {
                    if (typeof(obj) !== "object") { toClean.push(idx); return; }
                    if (!isFile(obj.element, true) && !isFolder(obj.element)) { toClean.push(idx); return; }
                    if (!$.isArray(obj.path)) { toClean.push(idx); return; }
                    if (typeof obj.element === "string") {
                        // We have an old file (href) which is not in filesData: add it
                        var id = Cryptpad.createRandomInteger();
                        files[FILES_DATA][id] = {href: obj.element, filename: el};
                        obj.element = id;
                    }
                    if (isFolder(obj.element)) { fixRoot(obj.element); }
                };
                for (var el in tr) {
                    if (!Array.isArray(tr[el])) {
                        debug("An element in TRASH root is not an array. ", tr[el]);
                        tr[el] = undefined;
                        delete tr[el];
                    } else if (tr[el].length === 0) {
                        debug("Empty array in TRASH root. ", tr[el]);
                        tr[el] = undefined;
                        delete tr[el];
                    } else {
                        toClean = [];
                        tr[el].forEach(function (obj, idx) { addToClean(obj, idx, el); });
                        for (var i = toClean.length-1; i>=0; i--) {
                            tr[el].splice(toClean[i], 1);
                        }
                    }
                }
            };
            var fixTemplate = function () {
                if (!Array.isArray(files[TEMPLATE])) { debug("TEMPLATE was not an array"); files[TEMPLATE] = []; }
                files[TEMPLATE] = Cryptpad.deduplicateString(files[TEMPLATE].slice());
                var us = files[TEMPLATE];
                var rootFiles = getFiles([ROOT]).slice();
                var toClean = [];
                us.forEach(function (el, idx) {
                    if (!isFile(el, true) || rootFiles.indexOf(el) !== -1) {
                        toClean.push(idx);
                    }
                    if (typeof el === "string") {
                        // We have an old file (href) which is not in filesData: add it
                        var id = Cryptpad.createRandomInteger();
                        files[FILES_DATA][id] = {href: el};
                        us[idx] = id;
                    }
                });
                toClean.forEach(function (idx) {
                    us.splice(idx, 1);
                });
            };
            var fixFilesData = function () {
                if (typeof files[FILES_DATA] !== "object") { debug("OLD_FILES_DATA was not an object"); files[FILES_DATA] = {}; }
                var fd = files[FILES_DATA];
                var rootFiles = getFiles([ROOT, TRASH, 'hrefArray']);
                var root = find([ROOT]);
                var toClean = [];
                for (var id in fd) {
                    id = Number(id);
                    var el = fd[id];
                    if (!el || typeof(el) !== "object") {
                        debug("An element in filesData was not an object.", el);
                        toClean.push(id);
                        continue;
                    }
                    if (!el.href) {
                        debug("Removing an element in filesData with a missing href.", el);
                        toClean.push(id);
                        continue;
                    }
                    if (Cryptpad.isLoggedIn() && rootFiles.indexOf(id) === -1) {
                        debug("An element in filesData was not in ROOT, TEMPLATE or TRASH.", id, el);
                        var newName = Cryptpad.createChannelId();
                        root[newName] = id;
                        continue;
                    }
                };
                toClean.forEach(function (id) {
                    spliceFileData(id);
                });
            };

            fixRoot();
            fixTrashRoot();
            if (!workgroup) {
                fixTemplate();
                fixFilesData();
            }

            if (JSON.stringify(files) !== before) {
                debug("Your file system was corrupted. It has been cleaned so that the pads you visit can be stored safely");
                return;
            }
            debug("File system was clean");
        };

        return exp;
    };
    return module;
});
