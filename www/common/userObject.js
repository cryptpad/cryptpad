define([
    'jquery',
    '/customize/application_config.js'
], function ($, AppConfig) {
    var module = {};

    var ROOT = module.ROOT = "root";
    var UNSORTED = module.UNSORTED = "unsorted";
    var TRASH = module.TRASH = "trash";
    var TEMPLATE = module.TEMPLATE = "template";

    var init = module.init = function (files, config) {
        var exp = {};
        var Cryptpad = config.Cryptpad;
        var Messages = Cryptpad.Messages;

        var FILES_DATA = module.FILES_DATA = exp.FILES_DATA = Cryptpad.storageKey;
        var NEW_FOLDER_NAME = Messages.fm_newFolder;
        var NEW_FILE_NAME = Messages.fm_newFile;

        // Logging
        var DEBUG = config.DEBUG || false;
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

        var getStructure = exp.getStructure = function () {
            var a = {};
            a[ROOT] = {};
            a[TRASH] = {};
            a[FILES_DATA] = [];
            a[TEMPLATE] = [];
            return a;
        };
        var getHrefArray = function () {
            return [TEMPLATE];
        };


        var compareFiles = function (fileA, fileB) { return fileA === fileB; };

        var isFile = exp.isFile = function (element) {
            return typeof(element) === "string";
        };

        var isReadOnlyFile = exp.isReadOnlyFile = function (element) {
            if (!isFile(element)) { return false; }
            var parsed = Cryptpad.parsePadUrl(element);
            if (!parsed) { return false; }
            var hash = parsed.hash;
            var pHash = Cryptpad.parseHash(hash);
            if (pHash && !pHash.mode) { return; }
            return pHash && pHash.mode === 'view';
        };

        var isFolder = exp.isFolder = function (element) {
            return typeof(element) === "object";
        };
        var isFolderEmpty = exp.isFolderEmpty = function (element) {
            if (typeof(element) !== "object") { return false; }
            return Object.keys(element).length === 0;
        };

        var hasSubfolder = exp.hasSubfolder = function (element, trashRoot) {
            if (typeof(element) !== "object") { return false; }
            var subfolder = 0;
            var addSubfolder = function (el, idx) {
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

        var hasFile = exp.hasFile = function (element, trashRoot) {
            if (typeof(element) !== "object") { return false; }
            var file = 0;
            var addFile = function (el, idx) {
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
            var res;
            files[FILES_DATA].some(function(arr) {
                var href = arr.href;
                if (href === file) {
                    res = arr;
                    return true;
                }
                return false;
            });
            return res;
        };

        // Data from filesData
        var getTitle = exp.getTitle = function (href) {
            if (workgroup) { debug("No titles in workgroups"); return; }
            var data = getFileData(href);
            if (!href || !data) {
                error("getTitle called with a non-existing href: ", href);
                return;
            }
            return data.title;
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
            var addFiles = function (el, idx) {
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
        _getFiles[FILES_DATA] = function () {
            var ret = [];
            files[FILES_DATA].forEach(function (el) {
                if (el.href && ret.indexOf(el.href) === -1) {
                    ret.push(el.href);
                }
            });
            return ret;
        };
        var getFiles = exp.getFiles = function (categories) {
            var ret = [];
            if (!categories || !categories.length) {
                categories = [ROOT, 'hrefArray', TRASH, FILES_DATA];
            }
            categories.forEach(function (c) {
                if (typeof _getFiles[c] === "function") {
                    ret = ret.concat(_getFiles[c]());
                }
            });
            return Cryptpad.deduplicateString(ret);
        };

        // SEARCH
        var _findFileInRoot = function (path, href) {
            if (!isPathIn(path, [ROOT, TRASH])) { return []; }
            var paths = [];
            var root = find(path);
            var addPaths = function (p) {
                if (paths.indexOf(p) === -1) {
                    paths.push(p);
                }
            };

            if (isFile(root)) {
                if (compareFiles(href, root)) {
                    if (paths.indexOf(path) === -1) {
                        paths.push(path);
                    }
                }
                return paths;
            }
            for (var e in root) {
                var nPath = path.slice();
                nPath.push(e);
                _findFileInRoot(nPath, href).forEach(addPaths);
            }

            return paths;
        };
        var findFileInRoot = exp.findFileInRoot = function (href) {
            return _findFileInRoot([ROOT], href);
        };
        var _findFileInHrefArray = function (rootName, href) {
            var unsorted = files[rootName].slice();
            var ret = [];
            var i = -1;
            while ((i = unsorted.indexOf(href, i+1)) !== -1){
                ret.push([rootName, i]);
            }
            return ret;
        };
        var _findFileInTrash = function (path, href) {
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
                    _findFileInTrash(nPath, href).forEach(addPaths);
                });
            }
            if (path.length === 2) {
                if (!Array.isArray(root)) { return []; }
                root.forEach(function (el, i) {
                    var nPath = path.slice();
                    nPath.push(i);
                    nPath.push('element');
                    if (isFile(el.element)) {
                        if (compareFiles(href, el.element)) {
                            addPaths(nPath);
                        }
                        return;
                    }
                    _findFileInTrash(nPath, href).forEach(addPaths);
                });
            }
            if (path.length >= 4) {
                _findFileInRoot(path, href).forEach(addPaths);
            }
            return paths;
        };
        var findFile = exp.findFile = function (href) {
            var rootpaths = _findFileInRoot([ROOT], href);
            var templatepaths = _findFileInHrefArray(TEMPLATE, href);
            var trashpaths = _findFileInTrash([TRASH], href);
            return rootpaths.concat(templatepaths, trashpaths);
        };
        var search = exp.search = function (value) {
            if (typeof(value) !== "string") { return []; }
            var res = [];
            // Search in ROOT
            var findIn = function (root) {
                Object.keys(root).forEach(function (k) {
                    if (isFile(root[k])) {
                        if (k.toLowerCase().indexOf(value.toLowerCase()) !== -1) {
                            res.push(root[k]);
                        }
                        return;
                    }
                    findIn(root[k]);
                });
            };
            findIn(files[ROOT]);
            // Search in TRASH
            var trash = files[TRASH];
            Object.keys(trash).forEach(function (k) {
                if (k.toLowerCase().indexOf(value.toLowerCase()) !== -1) {
                    trash[k].forEach(function (el) {
                        if (isFile(el.element)) {
                            res.push(el.element);
                        }
                    });
                }
                trash[k].forEach(function (el) {
                    if (isFolder(el.element)) {
                        findIn(el.element);
                    }
                });
            });

            // Search title
            var allFilesList = files[FILES_DATA].slice();
            allFilesList.forEach(function (t) {
                if (t.title && t.title.toLowerCase().indexOf(value.toLowerCase()) !== -1) {
                    res.push(t.href);
                }
            });

            // Search Href
            var href = Cryptpad.getRelativeHref(value);
            if (href) {
                res.push(href);
            }

            res = Cryptpad.deduplicateString(res);

            var ret = [];
            res.forEach(function (l) {
                var paths = findFile(l);
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
                files[FILES_DATA].push(data);
                cb();
            };
            if (!Cryptpad.isLoggedIn() || !AppConfig.enablePinning) { return void todo(); }
            Cryptpad.pinPads([Cryptpad.hrefToHexChannelId(data.href)], function (e, hash) {
                if (e) { return void cb(e); }
                todo();
            });
        };
        var spliceFileData = exp.removeData = function (idx) {
            var data = files[FILES_DATA][idx];
            if (typeof data === "object" && Cryptpad.isLoggedIn() && AppConfig.enablePinning) {
                Cryptpad.unpinPads([Cryptpad.hrefToHexChannelId(data.href)], function (e, hash) {
                    if (e) { return void logError(e); }
                    debug('UNPIN', hash);
                });
            }
            files[FILES_DATA].splice(idx, 1);
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
            var name;
            if (isPathIn(elementPath, ['hrefArray'])) {
                name = getTitle(element);
            } else if (isInTrashRoot(elementPath)) {
                // Element from the trash root: elementPath = [TRASH, "{dirName}", 0, 'element']
                name = elementPath[1];
            } else {
                name = elementPath[elementPath.length-1];
            }
            var newName = !isPathIn(elementPath, [ROOT]) ? getAvailableName(newParent, name) : name;

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
                if (copyElement(p, newPath)) {
                    toRemove.push(p);
                }
            });
            exp.delete(toRemove, cb);
        };
        var restore = exp.restore = function (path, cb) {
            if (!isInTrashRoot(path)) { return; }
            var parentPath = path.slice();
            parentPath.pop();
            var oldPath = find(parentPath).path;
            move([path], oldPath, cb);
        };


        // ADD
        var add = exp.add = function (data, path) {
            if (!data || typeof(data) !== "object") { return; }
            var href = data.href;
            var name = data.title;
            var newPath = path, parentEl;
            if (path && !Array.isArray(path)) {
                newPath = decodeURIComponent(path).split(',');
            }
            // Add to href array
            if (path && isPathIn(newPath, ['hrefArray'])) {
                parentEl = find(newPath);
                parentEl.push(href);
                return;
            }
            // Add to root if path is ROOT or if no path
            var filesList = getFiles([ROOT, TRASH, 'hrefArray']);
            if ((path && isPathIn(newPath, [ROOT]) || filesList.indexOf(href) === -1) && name) {
                parentEl = find(newPath || [ROOT]);
                if (parentEl) {
                    var newName = getAvailableName(parentEl, name);
                    parentEl[newName] = href;
                    return;
                }
            }
        };
        var addFile = exp.addFile = function (filePath, name, type, cb) {
            var parentEl = findElement(files, filePath);
            var fileName = getAvailableName(parentEl, name || NEW_FILE_NAME);
            var href = '/' + type + '/#' + Cryptpad.createRandomHash();
            parentEl[fileName] = href;

            pushFileData({
                href: href,
                title: fileName,
                atime: +new Date(),
                ctime: +new Date()
            });

            var newPath = filePath.slice();
            newPath.push(fileName);
            cb({
                newPath: newPath
            });
        };
        var addFolder = exp.addFolder = function (folderPath, name, cb) {
            var parentEl = find(folderPath);
            var folderName = getAvailableName(parentEl, name || NEW_FOLDER_NAME);
            parentEl[folderName] = {};
            var newPath = folderPath.slice();
            newPath.push(folderName);
            cb({
                newPath: newPath
            });
        };

        // FORGET (move with href not path)
        var forget = exp.forget = function (href) {
            var paths = findFile(href);
            move(paths, [TRASH]);
        };

        // DELETE
        // Permanently delete multiple files at once using a list of paths
        // NOTE: We have to be careful when removing elements from arrays (trash root, unsorted or template)
        var removePadAttribute = function (f) {
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
            // Nothing in FILES_DATA for workgroups
            if (workgroup) { return; }

            var filesList = getFiles([ROOT, 'hrefArray', TRASH]);
            var toRemove = [];
            files[FILES_DATA].forEach(function (arr) {
                var f = arr.href;
                if (filesList.indexOf(f) === -1) {
                    toRemove.push(arr);
                }
            });
            toRemove.forEach(function (f) {
                var idx = files[FILES_DATA].indexOf(f);
                if (idx !== -1) {
                    debug("Removing", f, "from filesData");
                    spliceFileData(idx);
                    removePadAttribute(f.href);
                }
            });
        };
        var deleteHrefs = function (hrefs) {
            hrefs.forEach(function (obj) {
                var idx = files[obj.root].indexOf(obj.href);
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

            var hrefs = [];
            hrefPaths.forEach(function (path) {
                var href = find(path);
                hrefs.push({
                    root: path[0],
                    href: href
                });
            });
            deleteHrefs(hrefs);

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
            // FILES_DATA (replaceHref)
            if (!nocheck) { checkDeletedFiles(); }
        };
        var deletePath = exp.delete = function (paths, cb, nocheck) {
            deleteMultiplePermanently(paths, nocheck);
            if (typeof cb === "function") { cb(); }
        };
        var emptyTrash = exp.emptyTrash = function (cb) {
            files[TRASH] = {};
            checkDeletedFiles();
            if(cb) { cb(); }
        };

        // RENAME
        var rename = exp.rename = function (path, newName, cb) {
            if (path.length <= 1) {
                logError('Renaming `root` is forbidden');
                return;
            }
            if (!newName || newName.trim() === "") { return; }
            // Copy the element path and remove the last value to have the parent path and the old name
            var element = find(path);
            var parentPath = path.slice();
            var oldName = parentPath.pop();
            if (oldName === newName) {
                return;
            }
            var parentEl = find(parentPath);
            if (typeof(parentEl[newName]) !== "undefined") {
                log(Messages.fo_existingNameError);
                return;
            }
            parentEl[newName] = element;
            parentEl[oldName] = undefined;
            delete parentEl[oldName];
            if (typeof cb === "function") { cb(); }
        };

        // REPLACE
        var replaceFile = function (path, o, n) {
            var root = find(path);

            if (isFile(root)) { return; }
            for (var e in root) {
                if (isFile(root[e])) {
                    if (compareFiles(o, root[e])) {
                        root[e] = n;
                    }
                } else {
                    var nPath = path.slice();
                    nPath.push(e);
                    replaceFile(nPath, o, n);
                }
            }
        };
        // Replace a href by a stronger one everywhere in the drive (except FILES_DATA)
        var replaceHref = exp.replace = function (o, n) {
            if (!isFile(o) || !isFile(n)) { return; }
            var paths = findFile(o);

            // Remove all the occurences in the trash
            // Replace all the occurences not in the trash
            // If all the occurences are in the trash or no occurence, add the pad to unsorted
            var allInTrash = true;
            paths.forEach(function (p) {
                if (p[0] === TRASH) {
                    exp.delete(p, null, true); // 3rd parameter means skip "checkDeletedFiles"
                    return;
                } else {
                    allInTrash = false;
                    var parentPath = p.slice();
                    var key = parentPath.pop();
                    var parentEl = find(parentPath);
                    parentEl[key] = n;
                }
            });
            if (allInTrash) {
                add(n);
            }
        };

        /**
         * INTEGRITY CHECK
         */

        var fixFiles = exp.fixFiles = function () {
            // Explore the tree and check that everything is correct:
            //  * 'root', 'trash', 'unsorted' and 'filesData' exist and are objects
            //  * ROOT: Folders are objects, files are href
            //  * TRASH: Trash root contains only arrays, each element of the array is an object {element:.., path:..}
            //  * FILES_DATA: - Data (title, cdate, adte) are stored in filesData. filesData contains only href keys linking to object with title, cdate, adate.
            //                - Dates (adate, cdate) can be parsed/formatted
            //                - All files in filesData should be either in 'root', 'trash' or 'unsorted'. If that's not the case, copy the fily to 'unsorted'
            //  * TEMPLATE: Contains only files (href), and does not contains files that are in ROOT
            debug("Cleaning file system...");

            var before = JSON.stringify(files);

            var fixRoot = function (elem) {
                if (typeof(files[ROOT]) !== "object") { debug("ROOT was not an object"); files[ROOT] = {}; }
                var element = elem || files[ROOT];
                for (var el in element) {
                    if (!isFile(element[el]) && !isFolder(element[el])) {
                        debug("An element in ROOT was not a folder nor a file. ", element[el]);
                        element[el] = undefined;
                        delete element[el];
                    } else if (isFolder(element[el])) {
                        fixRoot(element[el]);
                    }
                }
            };
            var fixTrashRoot = function () {
                if (typeof(files[TRASH]) !== "object") { debug("TRASH was not an object"); files[TRASH] = {}; }
                var tr = files[TRASH];
                var toClean;
                var addToClean = function (obj, idx) {
                    if (typeof(obj) !== "object") { toClean.push(idx); return; }
                    if (!isFile(obj.element) && !isFolder(obj.element)) { toClean.push(idx); return; }
                    if (!$.isArray(obj.path)) { toClean.push(idx); return; }
                };
                for (var el in tr) {
                    if (!$.isArray(tr[el])) {
                        debug("An element in TRASH root is not an array. ", tr[el]);
                        tr[el] = undefined;
                        delete tr[el];
                    } else {
                        toClean = [];
                        tr[el].forEach(addToClean);
                        for (var i = toClean.length-1; i>=0; i--) {
                            tr[el].splice(toClean[i], 1);
                        }
                    }
                }
            };
            // Make sure unsorted doesn't exist anymore
            var fixUnsorted = function () {
                if (!files[UNSORTED]) { return; }
                debug("UNSORTED still exists in the object, removing it...");
                var us = files[UNSORTED];
                if (us.length === 0) {
                    delete files[UNSORTED];
                    return;
                }
                var rootFiles = getFiles([ROOT, TEMPLATE]).slice();
                var toClean = [];
                var root = find([ROOT]);
                us.forEach(function (el, idx) {
                    if (!isFile(el) || rootFiles.indexOf(el) !== -1) {
                        return;
                        //toClean.push(idx);
                    }
                    var name = getFileData(el).title || NEW_FILE_NAME;
                    var newName = getAvailableName(root, name);
                    root[newName] = el;
                });
                delete files[UNSORTED];
                /*toClean.forEach(function (idx) {
                    us.splice(idx, 1);
                });*/
            };
            var fixTemplate = function () {
                if (!Array.isArray(files[TEMPLATE])) { debug("TEMPLATE was not an array"); files[TEMPLATE] = []; }
                files[TEMPLATE] = Cryptpad.deduplicateString(files[TEMPLATE].slice());
                var us = files[TEMPLATE];
                var rootFiles = getFiles([ROOT]).slice();
                var toClean = [];
                us.forEach(function (el, idx) {
                    if (!isFile(el) || rootFiles.indexOf(el) !== -1) {
                        toClean.push(idx);
                    }
                });
                toClean.forEach(function (idx) {
                    us.splice(idx, 1);
                });
            };
            var fixFilesData = function () {
                if (!$.isArray(files[FILES_DATA])) { debug("FILES_DATA was not an array"); files[FILES_DATA] = []; }
                var fd = files[FILES_DATA];
                var rootFiles = getFiles([ROOT, TRASH, 'hrefArray']);
                var root = find([ROOT]);
                var toClean = [];
                fd.forEach(function (el, idx) {
                    if (!el || typeof(el) !== "object") {
                        debug("An element in filesData was not an object.", el);
                        toClean.push(el);
                        return;
                    }
                    if (rootFiles.indexOf(el.href) === -1) {
                        debug("An element in filesData was not in ROOT, TEMPLATE or TRASH.", el);
                        var name = el.title || NEW_FILE_NAME;
                        var newName = getAvailableName(root, name);
                        root[newName] = el.href;
                        return;
                    }
                });
                toClean.forEach(function (el) {
                    var idx = fd.indexOf(el);
                    if (idx !== -1) {
                        spliceFileData(idx);
                    }
                });
            };

            fixRoot();
            fixTrashRoot();
            if (!workgroup) {
                fixUnsorted();
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
