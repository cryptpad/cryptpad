define([
    '/bower_components/jquery/dist/jquery.min.js',
], function () {
    var $ = window.jQuery;
    var module = {};

    var Messages = {};

    var ROOT = "root";
    var UNSORTED = "unsorted";
    var TRASH = "trash";
    var TEMPLATE = "template";

    var init = module.init = function (files, config) {
        var Cryptpad = config.Cryptpad;
        Messages = Cryptpad.Messages;

        var FILES_DATA = Cryptpad.storageKey;
        var NEW_FOLDER_NAME = Messages.fm_newFolder;

        var DEBUG = config.DEBUG || false;
        var logging = function () {
            console.log.apply(console, arguments);
        };
        var log = config.log || logging;
        var logError = config.logError || logging;
        var debug = config.debug || logging;
        var workgroup = config.workgroup;

        var exp = {};

        var error = exp.error = function() {
            exp.fixFiles();
            console.error.apply(console, arguments);
        };

        var getStructure = exp.getStructure = function () {
            var a = {};
            a[ROOT] = {};
            a[UNSORTED] = [];
            a[TRASH] = {};
            a[FILES_DATA] = [];
            a[TEMPLATE] = [];
            return a;
        };

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

        var isPathInRoot = exp.isPathInRoot = function (path) {
            return path[0] && path[0] === ROOT;
        };
        var isPathInUnsorted = exp.isPathInUnsorted = function (path) {
            return path[0] && path[0] === UNSORTED;
        };
        var isPathInTemplate = exp.isPathInTemplate = function (path) {
            return path[0] && path[0] === TEMPLATE;
        };
        var isPathInHrefArray = exp.isPathInHrefArray = function (path) {
            return isPathInUnsorted(path) || isPathInTemplate(path);
        };
        var isPathInTrash = exp.isPathInTrash = function (path) {
            return path[0] && path[0] === TRASH;
        };

        var isPathInFilesData = exp.isPathInFilesData = function (path) {
            return path[0] && path[0] === FILES_DATA;
        };

        var isFile =  exp.isFile = function (element) {
            return typeof(element) === "string";
        };

        var isFolder = exp.isFolder = function (element) {
            return typeof(element) !== "string";
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

        var isSubpath = exp.isSubpath = function (path, parentPath) {
            var pathA = parentPath.slice();
            var pathB = path.slice(0, pathA.length);
            return comparePath(pathA, pathB);
        };

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

        var compareFiles = function (fileA, fileB) {
            // Compare string, might change in the future
            return fileA === fileB;
        };

        var isFileInTree = function (file, root) {
            if (isFile(root)) {
                return compareFiles(file, root);
            }
            var inTree = false;
            for (var e in root) {
                inTree = isFileInTree(file, root[e]);
                if (inTree) { break; }
            }
            return inTree;
        };

        var isFileInTrash = function (file) {
            var inTrash = false;
            var root = files[TRASH];
            var filter = function (trashEl, idx) {
                inTrash = isFileInTree(file, trashEl.element);
                return inTrash;
            };
            for (var e in root) {
                if (!$.isArray(root[e])) {
                    error("Trash contains a non-array element");
                    return;
                }
                root[e].some(filter);
                if (inTrash) { break; }
            }
            return inTrash;
        };

        var isFileInUnsorted = function (file) {
            return files[UNSORTED].indexOf(file) !== -1;
        };

        var getUnsortedFiles = exp.getUnsortedFiles = function () {
            if (!files[UNSORTED]) {
                files[UNSORTED] = [];
            }
            return files[UNSORTED].slice();
        };

        var getTemplateFiles = exp.getTemplateFiles = function () {
            if (!files[TEMPLATE]) {
                files[TEMPLATE] = [];
            }
            return files[TEMPLATE].slice();
        };

        var getFilesRecursively = function (root, arr) {
            for (var e in root) {
                if (isFile(root[e])) {
                    if(arr.indexOf(root[e]) === -1) { arr.push(root[e]); }
                } else {
                    getFilesRecursively(root[e], arr);
                }
            }
        };

        var getRootFiles = function () {
            var ret = [];
            getFilesRecursively(files[ROOT], ret);
            return ret;
        };

        var getTrashFiles = exp.getTrashFiles = function () {
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

        var getFilesDataFiles = function () {
            var ret = [];
            for (var el in files[FILES_DATA]) {
                if (el.href && ret.indexOf(el.href) === -1) {
                    ret.push(el.href);
                }
            }
            return ret;
        };

        var removeFileFromRoot = function (root, href) {
            if (isFile(root)) { return; }
            for (var e in root) {
                if (isFile(root[e])) {
                    if (compareFiles(href, root[e])) {
                        root[e] = undefined;
                        delete root[e];
                    }
                } else {
                    removeFileFromRoot(root[e], href);
                }
            }
        };

        var isInTrashRoot = exp.isInTrashRoot = function (path) {
            return path[0] === TRASH && path.length === 4;
        };

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

            var rootFiles = getRootFiles();
            var unsortedFiles = getUnsortedFiles();
            var templateFiles = getTemplateFiles();
            var trashFiles = getTrashFiles();
            var toRemove = [];
            files[FILES_DATA].forEach(function (arr) {
                var f = arr.href;
                if (rootFiles.indexOf(f) === -1
                    && unsortedFiles.indexOf(f) === -1
                    && trashFiles.indexOf(f) === -1
                    && templateFiles.indexOf(f) === -1) {
                    toRemove.push(arr);
                }
            });
            toRemove.forEach(function (f) {
                var idx = files[FILES_DATA].indexOf(f);
                if (idx !== -1) {
                    debug("Removing", f, "from filesData");
                    files[FILES_DATA].splice(idx, 1);
                    removePadAttribute(f.href);
                }
            });
        };

        var deleteFromObject = exp.deletePathPermanently = function (path) {
            var parentPath = path.slice();
            var key = parentPath.pop();
            var parentEl = exp.findElement(files, parentPath);
            if (path.length === 4 && path[0] === TRASH) {
                files[TRASH][path[1]].splice(path[2], 1);
            } else if (path[0] === UNSORTED || path[0] === TEMPLATE) {
                parentEl.splice(key, 1);
            } else {
                parentEl[key] = undefined;
                delete parentEl[key];
            }
            checkDeletedFiles();
        };

        // Permanently delete multiple files at once using a list of paths
        // NOTE: We have to be careful when removing elements from arrays (trash root, unsorted or template)
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
        var deleteMultiplePermanently = exp.deletePathsPermanently = function (paths) {
            var hrefPaths = paths.filter(isPathInHrefArray);
            var rootPaths = paths.filter(isPathInRoot);
            var trashPaths = paths.filter(isPathInTrash);

            var hrefs = [];
            hrefPaths.forEach(function (path) {
                var href = exp.findElement(files, path);
                hrefs.push({
                    root: path[0],
                    href: href
                });
            });
            deleteHrefs(hrefs);

            rootPaths.forEach(function (path) {
                var parentPath = path.slice();
                var key = parentPath.pop();
                var parentEl = exp.findElement(files, parentPath);
                parentEl[key] = undefined;
                delete parentEl[key];
            });

            var trashRoot = [];
            trashPaths.forEach(function (path) {
                var parentPath = path.slice();
                var key = parentPath.pop();
                var parentEl = exp.findElement(files, parentPath);
                // Trash root: we have array here, we can't just splice with the path otherwise we might break the path
                // of another element in the loop
                console.log(path);
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

            checkDeletedFiles();
        };

        // Find an element in a object following a path, resursively
        // NOTE: it is always used with an absolute path and root === files in our code
        var findElement = exp.findElement = function (root, pathInput) {
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

        // Get the object {element: element, path: [path]} from a trash root path
        var getTrashElementData = exp.getTrashElementData = function (trashPath) {
            if (!isInTrashRoot) {
                debug("Called getTrashElementData on a element not in trash root: ", trashPath);
                return;
            }
            var parentPath = trashPath.slice();
            parentPath.pop();
            return findElement(files, parentPath);
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

        var pushToTrash = function (name, element, path) {
            var trash = findElement(files, [TRASH]);

            if (typeof(trash[name]) === "undefined") {
                trash[name] = [];
            }
            var trashArray = trash[name];
            var trashElement = {
                element: element,
                path: path
            };
            trashArray.push(trashElement);
        };

        // Move to trash
        var removeElement = exp.removeElement = function (path, cb, keepOld) {
            if (!path || path.length < 2 || path[0] === TRASH) {
                debug("Calling removeElement from a wrong path: ", path);
                return;
            }
            var element = findElement(files, path);
            var key = path[path.length - 1];
            var name = isPathInHrefArray(path) ? getTitle(element) : key;
            var parentPath = path.slice();
            parentPath.pop();
            pushToTrash(name, element, parentPath);
            if (!keepOld) { deleteFromObject(path); }
            if (cb) { cb(); }
        };

        var moveElement = exp.moveElement = function (elementPath, newParentPath, cb, keepOld) {
            if (comparePath(elementPath, newParentPath)) { return; } // Nothing to do...
            if (isPathInTrash(newParentPath)) {
                removeElement(elementPath, cb, keepOld);
                return;
            }
            var element = findElement(files, elementPath);

            var newParent = findElement(files, newParentPath);

            // Never move a folder in one of its children
            if (isFolder(element) && isSubpath(newParentPath, elementPath)) {
                log(Messages.fo_moveFolderToChildError);
                return;
            }

            if (isPathInHrefArray(newParentPath)) {
                if (isFolder(element)) {
                    log(Messages.fo_moveUnsortedError);
                    return;
                } else {
                    if (elementPath[0] === newParentPath[0]) { return; }
                    var fileRoot = newParentPath[0];
                    if (files[fileRoot].indexOf(element) === -1) {
                        files[fileRoot].push(element);
                    }
                    if (!keepOld) { deleteFromObject(elementPath); }
                    if(cb) { cb(); }
                    return;
                }
            }

            var name;

            if (isPathInHrefArray(elementPath)) {
                name = getTitle(element);
            } else if (isInTrashRoot(elementPath)) {
                // Element from the trash root: elementPath = [TRASH, "{dirName}", 0, 'element']
                name = elementPath[1];
            } else {
                name = elementPath[elementPath.length-1];
            }
            var newName = !isPathInRoot(elementPath) ? getAvailableName(newParent, name) : name;

            if (typeof(newParent[newName]) !== "undefined") {
                log(Messages.fo_unavailableName);
                return;
            }
            newParent[newName] = element;
            if (!keepOld) { deleteFromObject(elementPath); }
            if(cb) { cb(); }
        };

        // "Unsorted" is an array of href: we can't move several of them using "moveElement" in a
        // loop because moveElement removes the href from the array and it changes the path for all
        // the other elements. We have to move them all and then remove them from unsorted
        var moveHrefArrayElements = exp.moveHrefArrayElements = function (paths, newParentPath, cb) {
            if (!paths || paths.length === 0) { return; }
            //if (isPathInHrefArray(newParentPath)) { return; }
            var elements = {};
            // Get the elements
            paths.forEach(function (p) {
                // Here we move only files from array categories (unsorted, template...)
                if (!isPathInHrefArray(p)) { return; }
                // And we check that we don't want to move to the same location
                if (p[0] === newParentPath[0]) { return; }
                var el = findElement(files, p);
                if (el) { elements[el] = p; }
            });
            // Copy the elements to their new location
            Object.keys(elements).forEach(function (el) {
                moveElement(elements[el], newParentPath, null, true);
            });
            // Remove the elements from their old location
            Object.keys(elements).forEach(function (el) {
                var fileRoot = elements[el][0];
                var idx = files[fileRoot].indexOf(el);
                if (idx !== -1) {
                    files[fileRoot].splice(idx, 1);
                }
            });
            if (cb) { cb(); }
        };

        var moveElements = exp.moveElements = function (paths, newParentPath, cb) {
            var unsortedPaths = paths.filter(isPathInHrefArray);
            moveHrefArrayElements(unsortedPaths, newParentPath);
            // Copy the elements to their new location
            paths.forEach(function (p) {
                if (isPathInHrefArray(p)) { return; }
                moveElement(p, newParentPath, null);
            });
            if(cb) { cb(); }
        };

        // Import elements in the file manager
        var importElements = exp.importElements = function (elements, path, cb) {
            if (!elements || elements.length === 0) { return; }
            console.log(elements);
            var newParent = findElement(files, path);
            if (!newParent) { debug("Trying to import elements into a non-existing folder"); return; }
            elements.forEach(function (e) {
                var el = e.el;
                var key = e.name;
                if (!key) { key = "???"; } // Should not happen...
                newParent[key] = el;
            });
            if(cb) { cb(); }
        };

        var createNewFolder = exp.createNewFolder = function (folderPath, name, cb) {
            var parentEl = findElement(files, folderPath);
            var folderName = getAvailableName(parentEl, name || NEW_FOLDER_NAME);
            parentEl[folderName] = {};
            var newPath = folderPath.slice();
            newPath.push(folderName);
            cb({
                newPath: newPath
            });
        };


        // Remove an element from the trash root
        var removeFromTrashArray = function (element, name) {
            var array = files[TRASH][name];
            if (!array || !$.isArray(array)) { return; }
            // Remove the element from the trash array
            var index = array.indexOf(element);
            if (index > -1) {
                array.splice(index, 1);
            }
            // Remove the array if empty to have a cleaner object in chainpad
            if (array.length === 0) {
                files[TRASH][name] = undefined;
                delete files[TRASH][name];
            }
        };

        // Restore an element (copy it elsewhere and remove from the trash root)
        var restoreTrash = exp.restoreTrash = function (path, cb) {
            if (!path || path.length !== 4 || path[0] !== TRASH) {
                debug("restoreTrash was called from an element not in the trash root: ", path);
                return;
            }
            var element = findElement(files, path);
            var parentEl = getTrashElementData(path);
            var newPath = parentEl.path;
            if (isPathInHrefArray(newPath)) {
                var fileRoot = newPath[0];
                if (files[fileRoot].indexOf(element) === -1) {
                    files[fileRoot].push(element);
                }
                removeFromTrashArray(parentEl, path[1]);
                cb();
                return;
            }
            // Find the new parent element
            var newParentEl = findElement(files, newPath);
            while (newPath.length > 1 && !newParentEl) {
                newPath.pop();
                newParentEl = findElement(files, newPath);
            }
            if (!newParentEl) {
                log(Messages.fo_unableToRestore);
            }
            var name = getAvailableName(newParentEl, path[1]);
            // Move the element
            newParentEl[name] = element;
            removeFromTrashArray(parentEl, path[1]);
            cb();
        };

        // Delete permanently (remove from the trash root and from filesData)
        var removeFromTrash = exp.removeFromTrash = function (path, cb) {
            if (!path || path.length < 4 || path[0] !== TRASH) { return; }
            // Remove the last element from the path to get the parent path and the element name
            var parentPath = path.slice();
            var name;
            var element = findElement(files, path);
            if (path.length === 4) { // Trash root
                name = path[1];
                parentPath.pop();
                var parentElement = findElement(files, parentPath);
                removeFromTrashArray(parentElement, name);
            } else {
                name = parentPath.pop();
                var parentEl = findElement(files, parentPath);
                if (typeof(parentEl[name]) === "undefined") {
                    logError("Unable to locate the element to remove from trash: ", path);
                    return;
                }
                parentEl[name] = undefined;
                delete parentEl[name];
            }
            checkDeletedFiles();
            if(cb) { cb(); }
        };

        var emptyTrash = exp.emptyTrash = function (cb) {
            files[TRASH] = {};
            checkDeletedFiles();
            if(cb) { cb(); }
        };

        var deleteFileData = exp.deleteFileData = function (href, cb) {
            if (workgroup) { return; }

            var toRemove = [];
            files[FILES_DATA].forEach(function (arr) {
                var f = arr.href;
                if (f === href) {
                    toRemove.push(arr);
                }
            });
            toRemove.forEach(function (f) {
                var idx = files[FILES_DATA].indexOf(f);
                if (idx !== -1) {
                    debug("Removing", f, "from filesData");
                    files[FILES_DATA].splice(idx, 1);
                    // Remove the "padAttributes" stored in the realtime object for that pad
                    removePadAttribute(f.href);
                }
            });

            if(cb) { cb(); }
        };

        var renameElement = exp.renameElement = function (path, newName, cb) {
            if (path.length <= 1) {
                logError('Renaming `root` is forbidden');
                return;
            }
            if (!newName || newName.trim() === "") { return; }
            // Copy the element path and remove the last value to have the parent path and the old name
            var element = findElement(files, path);
            var parentPath = path.slice();
            var oldName = parentPath.pop();
            if (oldName === newName) {
                return;
            }
            var parentEl = findElement(files, parentPath);
            if (typeof(parentEl[newName]) !== "undefined") {
                log(Messages.fo_existingNameError);
                return;
            }
            parentEl[newName] = element;
            parentEl[oldName] = undefined;
            delete parentEl[oldName];
            cb();
        };


        var forgetPad = exp.forgetPad = function (href) {
            if (workgroup) { return; }
            if (!href) { return; }
            var rootFiles = getRootFiles().slice();
            if (rootFiles.indexOf(href) !== -1) {
                removeFileFromRoot(files[ROOT], href);
            }
            var unsortedIdx = getUnsortedFiles().indexOf(href);
            if (unsortedIdx !== -1) {
                files[UNSORTED].splice(unsortedIdx, 1);
            }
            var key = getTitle(href);
            pushToTrash(key, href, [UNSORTED]);
        };

        var addUnsortedPad = exp.addPad = function (href, path, name) {
            if (workgroup) { return; }
            if (!href) { return; }
            var unsortedFiles = getUnsortedFiles();
            var rootFiles = getRootFiles();
            var trashFiles = getTrashFiles();
            var templateFiles = getTemplateFiles();
            var newPath, parentEl;
            if (path) {
                newPath = decodeURIComponent(path).split(',');
            }
            if (path && isPathInHrefArray(newPath)) {
                parentEl = findElement(files, newPath);
                parentEl.push(href);
                return;
            }
            if (path && isPathInRoot(newPath) && name) {
                parentEl = findElement(files, newPath);
                if (parentEl) {
                    var newName = getAvailableName(parentEl, name);
                    parentEl[newName] = href;
                    return;
                }
            }
            if (unsortedFiles.indexOf(href) === -1 && rootFiles.indexOf(href) === -1 && templateFiles.indexOf(href) === -1 && trashFiles.indexOf(href) === -1) {
                files[UNSORTED].push(href);
            }
        };

        // addTemplate is called when we want to add a new pad, never visited, to the templates list
        // first, we must add it to FILES_DATA, so the input has to be an fileDAta object
        var addTemplate = exp.addTemplate = function (fileData) {
            if (workgroup) { return; }
            if (typeof fileData !== "object" || !fileData.href || !fileData.title) { return; }

            var href = fileData.href;
            var test = files[FILES_DATA].some(function (o) {
                return o.href === href;
            });
            if (!test) {
                files[FILES_DATA].push(fileData);
            }
            if (files[TEMPLATE].indexOf(href) === -1) {
                files[TEMPLATE].push(href);
            }
        };

        var listTemplates = exp.listTemplates = function (type) {
            if (workgroup) { return; }
            var templateFiles = getTemplateFiles();
            var res = [];
            templateFiles.forEach(function (f) {
                var data = getFileData(f);
                res.push(JSON.parse(JSON.stringify(data)));
            });
            return res;
        };

        var uniq = function (a) {
            var seen = {};
            return a.filter(function(item) {
                return seen.hasOwnProperty(item) ? false : (seen[item] = true);
            });
        };

        var fixFiles = exp.fixFiles = function () {
            // Explore the tree and check that everything is correct:
            //  * 'root', 'trash', 'unsorted' and 'filesData' exist and are objects
            //  * ROOT: Folders are objects, files are href
            //  * TRASH: Trash root contains only arrays, each element of the array is an object {element:.., path:..}
            //  * FILES_DATA: - Data (title, cdate, adte) are stored in filesData. filesData contains only href keys linking to object with title, cdate, adate.
            //                - Dates (adate, cdate) can be parsed/formatted
            //                - All files in filesData should be either in 'root', 'trash' or 'unsorted'. If that's not the case, copy the fily to 'unsorted'
            //  * UNSORTED: Contains only files (href), and does not contains files that are in ROOT
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
            var fixUnsorted = function () {
                if (!$.isArray(files[UNSORTED])) { debug("UNSORTED was not an array"); files[UNSORTED] = []; }
                files[UNSORTED] = uniq(files[UNSORTED]);
                var us = files[UNSORTED];
                var rootFiles = getRootFiles().slice();
                var templateFiles = getTemplateFiles();
                var toClean = [];
                us.forEach(function (el, idx) {
                    if (!isFile(el) || rootFiles.indexOf(el) !== -1 || templateFiles.indexOf(el) !== -1) {
                        toClean.push(idx);
                    }
                });
                toClean.forEach(function (idx) {
                    us.splice(idx, 1);
                });
            };
            var fixTemplate = function () {
                if (!$.isArray(files[TEMPLATE])) { debug("TEMPLATE was not an array"); files[TEMPLATE] = []; }
                files[TEMPLATE] = uniq(files[TEMPLATE]);
                var us = files[TEMPLATE];
                var rootFiles = getRootFiles().slice();
                var unsortedFiles = getUnsortedFiles();
                var toClean = [];
                us.forEach(function (el, idx) {
                    if (!isFile(el) || rootFiles.indexOf(el) !== -1 || unsortedFiles.indexOf(el) !== -1) {
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
                var rootFiles = getRootFiles();
                var unsortedFiles = getUnsortedFiles();
                var templateFiles = getTemplateFiles();
                var trashFiles = getTrashFiles();
                var toClean = [];
                fd.forEach(function (el, idx) {
                    if (!el || typeof(el) !== "object") {
                        debug("An element in filesData was not an object.", el);
                        toClean.push(el);
                        return;
                    }
                    if (rootFiles.indexOf(el.href) === -1
                        && unsortedFiles.indexOf(el.href) === -1
                        && templateFiles.indexOf(el.href) === -1
                        && trashFiles.indexOf(el.href) === -1) {
                        debug("An element in filesData was not in ROOT, UNSORTED or TRASH.", el);
                        files[UNSORTED].push(el.href);
                        return;
                    }
                });
                toClean.forEach(function (el) {
                    var idx = fd.indexOf(el);
                    if (idx !== -1) {
                        fd.splice(idx, 1);
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
