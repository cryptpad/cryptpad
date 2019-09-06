define([
    '/customize/application_config.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-realtime.js',
    '/common/common-constants.js',
    '/common/outer/userObject.js',
    '/customize/messages.js'
], function (AppConfig, Util, Hash, Realtime, Constants, OuterFO, Messages) {
    var module = {};

    var ROOT = module.ROOT = "root";
    var UNSORTED = module.UNSORTED = "unsorted";
    var TRASH = module.TRASH = "trash";
    var TEMPLATE = module.TEMPLATE = "template";
    var SHARED_FOLDERS = module.SHARED_FOLDERS = "sharedFolders";

    // Create untitled documents when no name is given
    var getLocaleDate = function () {
        if (window.Intl && window.Intl.DateTimeFormat) {
            var options = {weekday: "short", year: "numeric", month: "long", day: "numeric"};
            return new window.Intl.DateTimeFormat(undefined, options).format(new Date());
        }
        return new Date().toString().split(' ').slice(0,4).join(' ');
    };
    module.getDefaultName = function (parsed) {
        var type = parsed.type;
        var name = (Messages.type)[type] + ' - ' + getLocaleDate();
        return name;
    };

    module.init = function (files, config) {
        var exp = {};
        exp.getDefaultName = module.getDefaultName;

        var sframeChan = config.sframeChan;

        var FILES_DATA = module.FILES_DATA = exp.FILES_DATA = Constants.storageKey;
        var OLD_FILES_DATA = module.OLD_FILES_DATA = exp.OLD_FILES_DATA = Constants.oldStorageKey;
        var NEW_FOLDER_NAME = Messages.fm_newFolder || 'New folder';
        var NEW_FILE_NAME = Messages.fm_newFile || 'New file';

        exp.ROOT = ROOT;
        exp.UNSORTED = UNSORTED;
        exp.TRASH = TRASH;
        exp.TEMPLATE = TEMPLATE;
        exp.SHARED_FOLDERS = SHARED_FOLDERS;

        var sharedFolder = exp.sharedFolder = config.sharedFolder;
        exp.id = config.id;

        // Logging
        var logging = function () {
            console.log.apply(console, arguments);
        };
        var log = exp.log = config.log || logging;
        var logError = config.logError || logging;
        var debug = exp.debug = config.debug || logging;

        exp.fixFiles = function () {}; // Overriden by OuterFO

        var error = exp.error = function() {
            if (sframeChan) {
                return void sframeChan.query("Q_DRIVE_USEROBJECT", {
                    cmd: "fixFiles",
                    data: {}
                }, function () {});
            } else if (typeof (exp.fixFiles) === "function") {
                exp.fixFiles();
            }
            console.error.apply(console, arguments);
            exp.fixFiles();
        };

        if (config.outer) {
            // Extend "exp" with methods used only outside of the iframe (requires access to store)
            OuterFO.init(config, exp, files);
        }


        /*
         * UTILS
         */

        exp.getStructure = function () {
            var a = {};
            a[ROOT] = {};
            a[TRASH] = {};
            a[FILES_DATA] = {};
            a[TEMPLATE] = [];
            a[SHARED_FOLDERS] = {};
            return a;
        };

        var type = function (dat) {
            return dat === null?  'null': Array.isArray(dat)?'array': typeof(dat);
        };
        exp.isValidDrive = function (obj) {
            var base = exp.getStructure();
            return typeof (obj) === "object" &&
                    Object.keys(base).every(function (key) {
                        console.log(key, obj[key], type(obj[key]));
                        return obj[key] && type(base[key]) === type(obj[key]);
                    });
        };

        var getHrefArray = function () {
            return [TEMPLATE];
        };


        var compareFiles = function (fileA, fileB) { return fileA === fileB; };

        var isSharedFolder = exp.isSharedFolder = function (element) {
            if (sharedFolder) { return false; } // No recursive shared folders
            return Boolean(files[SHARED_FOLDERS] && files[SHARED_FOLDERS][element]);
        };
        var isFile = exp.isFile = function (element, allowStr) {
            if (isSharedFolder(element)) { return false; }
            return typeof(element) === "number" ||
                    ((typeof(files[OLD_FILES_DATA]) !== "undefined" || allowStr)
                        &&  typeof(element) === "string");
        };
        var isFolderData = exp.isFolderData = function (element) {
            return typeof(element) === "object" && element.metadata === true;
        };

        exp.isReadOnlyFile = function (element) {
            if (!isFile(element)) { return false; }
            var data = exp.getFileData(element);
            // undefined means this pad doesn't support read-only
            if (!data.roHref) { return; }
            return Boolean(data.roHref && !data.href);
        };

        var isFolder = exp.isFolder = function (element) {
            if (isFolderData(element)) { return false; }
            return typeof(element) === "object" || isSharedFolder(element);
        };
        exp.isFolderEmpty = function (element) {
            if (!isFolder(element)) { return false; }
            // if the folder contains nothing, it's empty
            if (Object.keys(element).length === 0) { return true; }
            // or if it contains one thing and that thing is metadata
            if (Object.keys(element).length === 1 && isFolderData(element[Object.keys(element)[0]])) { return true; }
            return false;
        };

        exp.hasSubfolder = function (element, trashRoot) {
            if (!isFolder(element)) { return false; }
            var subfolder = 0;
            var addSubfolder = function (el) {
                subfolder += isFolder(el.element) ? 1 : 0;
            };
            for (var f in element) {
                if (trashRoot) {
                    if (Array.isArray(element[f])) {
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
                    if (Array.isArray(element[f])) {
                        element[f].forEach(addFile);
                    }
                } else {
                    file += isFile(element[f]) ? 1 : 0;
                }
            }
            return file;
        };

        exp.hasFolderData = function (folder) {
            for (var el in folder) {
                if(isFolderData(folder[el])) {
                    return true;
                }
            }
        };

        var hasSubSharedFolder = exp.hasSubSharedFolder = function (folder) {
            for (var el in folder) {
                if (isSharedFolder(folder[el])) {
                    return true;
                }
                else if (isFolder(folder[el])) {
                    if (hasSubSharedFolder(folder[el])) {
                        return true;
                    }
                }
            }
            return false;
        };

        // Get data from AllFiles (Cryptpad_RECENTPADS)
        var getFileData = exp.getFileData = function (file) {
            if (!file) { return; }
            return files[FILES_DATA][file] || {};
        };

        exp.getFolderData = function (folder) {
            for (var el in folder) {
                if(isFolderData(folder[el])) {
                    return folder[el];
                }
            }
            return {};
        };

        // Data from filesData
        var getTitle = exp.getTitle = function (file, type) {
            if (isSharedFolder(file)) {
                return '??';
            }
            var data = getFileData(file);
            if (!file || !data || !(data.href || data.roHref)) {
                error("getTitle called with a non-existing file id: ", file, data);
                return;
            }
            if (type === 'title') { return data.title; }
            if (type === 'name') { return data.filename; }
            return data.filename || data.title || NEW_FILE_NAME;
        };

        // PATHS

        var comparePath = exp.comparePath = function (a, b) {
            if (!a || !b || !Array.isArray(a) || !Array.isArray(b)) { return false; }
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

        var getFilesRecursively = exp.getFilesRecursively = function (root, arr) {
            arr = arr || [];
            for (var e in root) {
                if (isFile(root[e]) || isSharedFolder(root[e])) {
                    if(arr.indexOf(root[e]) === -1) { arr.push(root[e]); }
                } else if (!isFolderData(root[e])) {
                    getFilesRecursively(root[e], arr);
                }
            }
            return arr;
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
            if (sharedFolder) { return ret; }
            getHrefArray().forEach(function (c) {
                ret = ret.concat(_getFiles[c]());
            });
            return Util.deduplicateString(ret);
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
                if (isFile(el.element) || isSharedFolder(el.element)) {
                    if(ret.indexOf(el.element) === -1) { ret.push(el.element); }
                } else {
                    getFilesRecursively(el.element, ret);
                }
            };
            for (var e in root) {
                if (!Array.isArray(root[e])) {
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
            return Object.keys(files[FILES_DATA]).map(Number).filter(Boolean);
        };
        _getFiles[SHARED_FOLDERS] = function () {
            var ret = [];
            if (!files[SHARED_FOLDERS]) { return ret; }
            return Object.keys(files[SHARED_FOLDERS]).map(Number).filter(Boolean);
        };
        var getFiles = exp.getFiles = function (categories) {
            var ret = [];
            if (!categories || !categories.length) {
                categories = [ROOT, 'hrefArray', TRASH, OLD_FILES_DATA, FILES_DATA, SHARED_FOLDERS];
            }
            categories.forEach(function (c) {
                if (typeof _getFiles[c] === "function") {
                    ret = ret.concat(_getFiles[c]());
                }
            });
            return Util.deduplicateString(ret);
        };

        var getIdFromHref = exp.getIdFromHref = function (href) {
            var result;
            getFiles([FILES_DATA]).some(function (id) {
                if (files[FILES_DATA][id].href === href ||
                    files[FILES_DATA][id].roHref === href) {
                    result = id;
                    return true;
                }
            });
            return result;
        };

        exp.getSFIdFromHref = function (href) {
            var result;
            getFiles([SHARED_FOLDERS]).some(function (id) {
                if (files[SHARED_FOLDERS][id].href === href ||
                    files[SHARED_FOLDERS][id].roHref === href) {
                    result = id;
                    return true;
                }
            });
            return result;
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

            if (isFile(root) || isSharedFolder(root)) {
                if (compareFiles(file, root)) {
                    if (paths.indexOf(path) === -1) {
                        paths.push(path);
                    }
                }
                return paths;
            }
            if (isFolder(root)) {
                for (var e in root) {
                    var nPath = path.slice();
                    nPath.push(e);
                    _findFileInRoot(nPath, file).forEach(addPaths);
                }
            }

            return paths;
        };
        exp.findFileInRoot = function (file) {
            return _findFileInRoot([ROOT], file);
        };
        var _findFileInHrefArray = function (rootName, file) {
            if (sharedFolder) { return []; }
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
            if (sharedFolder) { return []; }
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

        // Get drive ids of files from their channel ids
        exp.findChannels = function (channels) {
            var allFilesList = files[FILES_DATA];
            return getFiles([FILES_DATA]).filter(function (k) {
                var data = allFilesList[k];
                return channels.indexOf(data.channel) !== -1;
            });
        };

        exp.search = function (value) {
            if (typeof(value) !== "string") { return []; }
            value = value.trim();
            var res = [];
            // Search title
            var allFilesList = files[FILES_DATA];
            var lValue = value.toLowerCase();

            // parse the search string into tags
            var tags;
            lValue.replace(/^#(.*)/, function (all, t) {
                tags = t.split(/\s+/)
                .map(function (tag) {
                    return tag.replace(/^#/, '');
                }).filter(function (x) {
                    return x;
                });
            });

            /* returns true if an entry's tags are at least a partial match for
                one of the specified tags */
            var containsSearchedTag = function (T) {
                if (!tags) { return false; }
                if (!T.length) { return false; }
                T = T.map(function (t) { return t.toLowerCase(); });
                return tags.some(function (tag) {
                    return T.some(function (t) {
                        return t.indexOf(tag) !== -1;
                    });
                });
            };

            getFiles([FILES_DATA]).forEach(function (id) {
                var data = allFilesList[id];
                if (!data) { return; }
                if (Array.isArray(data.tags) && containsSearchedTag(data.tags)) {
                    res.push(id);
                } else
                if ((data.title && data.title.toLowerCase().indexOf(lValue) !== -1) ||
                    (data.filename && data.filename.toLowerCase().indexOf(lValue) !== -1)) {
                    res.push(id);
                }
            });

            // Search Href
            var href = Hash.getRelativeHref(value);
            if (href) {
                var id = getIdFromHref(href);
                if (id) { res.push(id); }
            }

            res = Util.deduplicateString(res);

            var ret = [];
            res.forEach(function (l) {
                //var paths = findFile(l);
                ret.push({
                    id: l,
                    paths: findFile(l),
                    data: exp.getFileData(l)
                });
            });

            // find folders
            var resFolders = [];
            var findFoldersRec = function (folder, path) {
                for (var key in folder) {
                    if (isFolder(folder[key]) && !isSharedFolder(folder[key])) {
                        if (key.toLowerCase().indexOf(lValue) !== -1) {
                            resFolders.push({
                                id: null,
                                paths: [path.concat(key)],
                                data: {
                                    title: key
                                }
                            });
                        }
                        findFoldersRec(folder[key], path.concat(key));
                    }
                }
            };
            findFoldersRec(files[ROOT], [ROOT]);
            resFolders = resFolders.sort(function (a, b) {
                return a.data.title.toLowerCase() > b.data.title.toLowerCase();
            });
            ret = resFolders.concat(ret);

            return ret;
        };
        exp.getRecentPads = function () {
            var allFiles = files[FILES_DATA];
            var sorted = Object.keys(allFiles).filter(function (a) { return allFiles[a]; })
                .sort(function (a,b) {
                    return allFiles[b].atime - allFiles[a].atime;
                })
                .map(function (str) { return Number(str); });
            return sorted;
        };
        exp.getOwnedPads = function (edPub) {
            var allFiles = files[FILES_DATA];
            return Object.keys(allFiles).filter(function (id) {
                return allFiles[id].owners && allFiles[id].owners.indexOf(edPub) !== -1;
            }).map(function (k) { return Number(k); });
        };

        /**
         * OPERATIONS
         */

        var getAvailableName = exp.getAvailableName = function (parentEl, name) {
            if (typeof(parentEl[name]) === "undefined") { return name; }
            var newName = name;
            var i = 1;
            while (typeof(parentEl[newName]) !== "undefined") {
                newName = name + "_" + i;
                i++;
            }
            return newName;
        };

        // MOVE
        var move = exp.move = function (paths, newPath, cb) {
            if (sframeChan) {
                return void sframeChan.query("Q_DRIVE_USEROBJECT", {
                    cmd: "move",
                    data: {
                        paths: paths,
                        newPath: newPath
                    }
                }, cb);
            }
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
                if (exp.copyElement(p.slice(), newPath)) {
                    toRemove.push(p);
                }
            });
            exp.delete(toRemove, cb);
        };
        exp.restore = function (path, cb) {
            if (sframeChan) {
                return void sframeChan.query("Q_DRIVE_USEROBJECT", {
                    cmd: "restore",
                    data: {
                        path: path
                    }
                }, cb);
            }
            if (!isInTrashRoot(path)) { return; }
            var parentPath = path.slice();
            parentPath.pop();
            var oldPath = find(parentPath).path;
            move([path], oldPath, cb);
        };


        // ADD
        exp.addFolder = function (folderPath, name, cb) {
            if (sframeChan) {
                return void sframeChan.query("Q_DRIVE_USEROBJECT", {
                    cmd: "addFolder",
                    data: {
                        path: folderPath,
                        name: name
                    }
                }, cb);
            }
            var parentEl = find(folderPath);
            var folderName = getAvailableName(parentEl, name || NEW_FOLDER_NAME);
            parentEl[folderName] = {};
            var newPath = folderPath.slice();
            newPath.push(folderName);
            cb({
                newPath: newPath
            });
        };

        // DELETE
        // Permanently delete multiple files at once using a list of paths
        // NOTE: We have to be careful when removing elements from arrays (trash root, unsorted or template)
        exp.delete = function (paths, cb, nocheck) {
            if (sframeChan) {
                return void sframeChan.query("Q_DRIVE_USEROBJECT", {
                    cmd: "delete",
                    data: {
                        paths: paths,
                        nocheck: nocheck,
                    }
                }, cb);
            }
            cb = cb || function () {};
            exp.deleteMultiplePermanently(paths, nocheck, cb);
            //if (typeof cb === "function") { cb(); }
        };
        exp.emptyTrash = function (cb) {
            cb = cb || function () {};
            if (sframeChan) {
                return void sframeChan.query("Q_DRIVE_USEROBJECT", {
                    cmd: "emptyTrash"
                }, cb);
            }
            files[TRASH] = {};
            exp.checkDeletedFiles(cb);
        };

        // RENAME
        exp.rename = function (path, newName, cb) {
            if (sframeChan) {
                return void sframeChan.query("Q_DRIVE_USEROBJECT", {
                    cmd: "rename",
                    data: {
                        path: path,
                        newName: newName
                    }
                }, cb);
            }
            if (path.length <= 1) {
                logError('Renaming `root` is forbidden');
                return;
            }
            // Copy the element path and remove the last value to have the parent path and the old name
            var element = find(path);

            // Folders
            if (isFolder(element) && !isSharedFolder(element)) {
                var parentPath = path.slice();
                var oldName = parentPath.pop();
                if (!newName || !newName.trim() || oldName === newName) { return; }
                var parentEl = find(parentPath);
                if (typeof(parentEl[newName]) !== "undefined") {
                    log(Messages.fo_existingNameError);
                    return;
                }
                parentEl[newName] = element;
                delete parentEl[oldName];
                if (typeof cb === "function") { cb(); }
                return;
            }

            // Files or Shared folder
            var data;
            if (isSharedFolder(element)) {
                data = files[SHARED_FOLDERS][element];
            } else {
                data = files[FILES_DATA][element];
            }
            if (!data) { return; }
            if (!newName || newName.trim() === "") {
                delete data.filename;
                if (typeof cb === "function") { cb(); }
                return;
            }
            if (getTitle(element, 'name') === newName) { return; }
            data.filename = newName;
            if (typeof cb === "function") { cb(); }
        };

        // Tags
        exp.getTagsList = function () {
            var tags = {};
            var data;
            var pushTag = function (tag) {
                tags[tag] = tags[tag] ? ++tags[tag] : 1;
            };
            for (var id in files[FILES_DATA]) {
                data = files[FILES_DATA][id];
                if (!data.tags || !Array.isArray(data.tags)) { continue; }
                data.tags.forEach(pushTag);
            }
            return tags;
        };

        return exp;
    };
    return module;
});
