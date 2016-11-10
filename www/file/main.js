require.config({ paths: { 'json.sortify': '/bower_components/json.sortify/dist/JSON.sortify' } });
define([
    '/customize/messages.js?app=pad',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/bower_components/hyperjson/hyperjson.js',
    '/common/toolbar.js',
    '/common/cursor.js',
    '/bower_components/chainpad-json-validator/json-ot.js',
    '/common/TypingTests.js',
    'json.sortify',
    '/bower_components/textpatcher/TextPatcher.amd.js',
    '/common/cryptpad-common.js',
    '/common/visible.js',
    '/common/notify.js',
    '/bower_components/file-saver/FileSaver.min.js',
    '/bower_components/diff-dom/diffDOM.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/bower_components/bootstrap/dist/js/bootstrap.min.js',
    '/customize/pad.js'
], function (Messages, Crypto, realtimeInput, Hyperjson,
    Toolbar, Cursor, JsonOT, TypingTest, JSONSortify, TextPatcher, Cryptpad,
    Visible, Notify) {
    var module = window.MODULE = {};

    var $ = window.jQuery;
    var saveAs = window.saveAs;
    var $iframe = $('#pad-iframe').contents();
    var ifrw = $('#pad-iframe')[0].contentWindow;

    var ROOT = "root";
    var ROOT_NAME = "My files";
    var UNSORTED = "unsorted";
    var UNSORTED_NAME = "Unsorted files";
    var FILES_DATA = "filesData";
    var FILES_DATA_NAME = "All files";
    var TRASH = "trash";
    var TRASH_NAME = "Trash";
    var TIME_BEFORE_RENAME = 1000;
    var LOCALSTORAGE_LAST = "cryptpad-file-lastOpened";
    var LOCALSTORAGE_OPENED = "cryptpad-file-openedFolders";
    var LOCALSTORAGE_VIEWMODE = "cryptpad-file-viewMode";
    var FOLDER_CONTENT_ID = "folderContent";

    var NEW_FOLDER_NAME = "New folder"; //TODO translate
    var DEBUG = true;

    var debug = DEBUG ? console.log : function() {return;};
    var fixFiles = function () {
        // debug("Fixing file system...");
        // Not implemented yet
        // Explore the tree and check that everything is correct:
        //  * 'root', 'trash' and 'filesData' exist and are objects
        //  * Folders are objects
        //  * Files are href
        //  * Trash root contains only arrays, each element of the array is an object {element:.., path:..}
        //  * Data (title, cdate, adte) are stored in filesData. filesData contains only href keys linking to object with title, cdate, adate.
        //  * Dates (adate, cdate) can be parsed/formatted
        // debug("File system fixed");
    };
    var error = function() {
        fixFiles();
        console.error.apply(arguments);
    };
    var logError = console.error;
    var log = Cryptpad.log;

    var files = module.files = {
        root: {
            "Directory 1": {
                "Dir A": {
                    "Dir D": {
                        "Dir E": {},
                    },
                    "File a": "#hash_a",
                    "File b": "#hash_b",
                    "File c": "#hash_c",
                    "File d": "#hash_d",
                    "File e": "#hash_e",
                    "File f": "#hash_f",
                    "File g": "#hash_g",
                    "File h": "#hash_h",
                    "File i": "#hash_i",
                    "File j": "#hash_j",
                    "File k": "#hash_k"
                },
                "Dir C": {},
                "Dir B": {},
                "File A": "#hash_A"
            },
            "Directory 2": {
                "File B": "#hash_B",
                "File C": "#hash_C"
            }
        },
        unsorted: ["#href1", "#href2", "#href3"],
        filesData: {
            "#hash_a": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Pad A"
            },
            "#hash_b": {
                ctime: "Mon Nov 07 2016 16:38:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:38:21 GMT+0100 (CET)",
                title: "Pad B"
            },
            "#hash_c": {
                ctime: "Tue Nov 08 2016 16:34:21 GMT+0100 (CET)",
                atime: "Sun Nov 06 2016 12:34:21 GMT+0100 (CET)",
                title: "Pad C With A Very Very Very Long Title"
            },
            "#hash_e": {
                ctime: "Tue Nov 08 2016 16:26:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:26:21 GMT+0100 (CET)",
                title: "Pad E"
            },
            "#hash_f": {
                ctime: "Tue Nov 08 2016 16:22:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:22:21 GMT+0100 (CET)",
                title: "Pad F"
            },
            "#hash_g": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Pad A"
            },
            "#hash_h": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Pad A"
            },
            "#hash_i": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Pad A"
            },
            "#hash_j": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Pad A"
            },
            "#hash_k": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Pad A"
            },
            "#hash_Z": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Code Z"
            },
            "#hash_A": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Code A"
            },
            "#hash_B": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Code B"
            },
            "#hash_C": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Code C"
            },
            "#hash_1": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Code C"
            },
            "#hash_2": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Code C"
            },
            "#hash_3": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Code C"
            },
            "#hash_4": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Code C"
            },
            "#href1": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Pad unsorted 1"
            },
            "#href2": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Pad unsorted 2"
            },
            "#href3": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Pad unsorted 3"
            }
        },
        trash: {
            "File Z": [{
                element: "#hash_Z",
                path: [ROOT]
            }]
        }
    };
    module.defaultFiles = JSON.parse(JSON.stringify(files));
    // TODO translate
    // TODO translate contextmenu in inner.html
    var getLastOpenedFolder = function () {
        var path;
        try {
            path = localStorage[LOCALSTORAGE_LAST] ? JSON.parse(localStorage[LOCALSTORAGE_LAST]) : [ROOT];
        } catch (e) {
            path = [ROOT];
        }
        return path;
    };
    var setLastOpenedFolder = function (path) {
        localStorage[LOCALSTORAGE_LAST] = JSON.stringify(path);
    };

    var initLSOpened = function () {
        try {
            var store = JSON.parse(localStorage[LOCALSTORAGE_OPENED]);
            if (!$.isArray(store)) {
                localStorage[LOCALSTORAGE_OPENED] = '[]';
            }
        } catch (e) {
            localStorage[LOCALSTORAGE_OPENED] = '[]';
        }
    };
    initLSOpened();

    var wasFolderOpened = function (path) {
        var store = JSON.parse(localStorage[LOCALSTORAGE_OPENED]);
        return store.indexOf(JSON.stringify(path)) !== -1;
    };
    var setFolderOpened = function (path, opened) {
        var s = JSON.stringify(path);
        var store = JSON.parse(localStorage[LOCALSTORAGE_OPENED]);
        if (opened && store.indexOf(s) === -1) {
            store.push(s);
        }
        if (!opened) {
            var idx = store.indexOf(s);
            if (idx !== -1) {
                store.splice(idx, 1);
            }
        }
        localStorage[LOCALSTORAGE_OPENED] = JSON.stringify(store);
    };

    var getViewModeClass = function () {
        var mode = localStorage[LOCALSTORAGE_VIEWMODE];
        if (mode === 'list') { return 'list'; }
        return 'grid';
    };
    var getViewMode = function () {
        return localStorage[LOCALSTORAGE_VIEWMODE] || 'grid';
    };
    var setViewMode = function (mode) {
        if (typeof(mode) !== "string") {
            console.error("Incorrect view mode: ", mode);
            return;
        }
        localStorage[LOCALSTORAGE_VIEWMODE] = mode;
    };


    var DEBUG = window.DEBUG = {
        resetLocalStorage : function () {
            delete localStorage[LOCALSTORAGE_OPENED];
            delete localStorage[LOCALSTORAGE_LAST];
        }
    };

    var currentPath = module.currentPath = getLastOpenedFolder();
    var lastSelectTime;
    var selectedElement;

    var $tree = $iframe.find("#tree");
    var $content = $iframe.find("#content");
    var $contextMenu = $iframe.find("#contextMenu");
    var $trashTreeContextMenu = $iframe.find("#trashTreeContextMenu");
    var $trashContextMenu = $iframe.find("#trashContextMenu");
    var $folderIcon = $('<span>', {"class": "fa fa-folder folder"});
    var $folderEmptyIcon = $('<span>', {"class": "fa fa-folder-o folder"});
    var $folderOpenedIcon = $('<span>', {"class": "fa fa-folder-open folder"});
    var $folderOpenedEmptyIcon = $('<span>', {"class": "fa fa-folder-open-o folder"});
    var $fileIcon = $('<span>', {"class": "fa fa-file file"});
    var $upIcon = $('<span>', {"class": "fa fa-arrow-circle-up"});
    var $unsortedIcon = $('<span>', {"class": "fa fa-files-o"});
    var $trashIcon = $('<span>', {"class": "fa fa-trash"});
    var $trashEmptyIcon = $('<span>', {"class": "fa fa-trash-o"});
    var $collapseIcon = $('<span>', {"class": "fa fa-minus-square-o expcol"});
    var $expandIcon = $('<span>', {"class": "fa fa-plus-square-o expcol"});
    var $listIcon = $('<span>', {"class": "fa fa-list"});
    var $gridIcon = $('<span>', {"class": "fa fa-th"});

    var removeSelected =  function () {
        $iframe.find('.selected').removeClass("selected");
    };
    var removeInput =  function () {
        $iframe.find('li > span:hidden').show();
        $iframe.find('li > input').remove();
    };

    var comparePath = function (a, b) {
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

    var deleteFromObject = function (path) {
        var parentPath = path.slice();
        var key = parentPath.pop();
        var parentEl = findElement(files, parentPath);
        if (path.length === 4 && path[0] === TRASH) {
            files[TRASH][path[1]].splice(path[2], 1);
        } else if (path[0] === UNSORTED) {
            parentEl.splice(key, 1);
        } else {
            delete parentEl[key];
        }
    };

    var now = function () {
        return new Date().getTime();
    };

    var isFile = function (element) {
        return typeof(element) === "string";
    };

    var isFolder = function (element) {
        return typeof(element) !== "string";
    };

    var isFolderEmpty = function (element) {
        if (typeof(element) !== "object") { return false; }
        return Object.keys(element).length === 0;
    };

    var hasSubfolder = function (element, trashRoot) {
        if (typeof(element) !== "object") { return false; }
        var subfolder = 0;
        for (var f in element) {
            if (trashRoot) {
                if ($.isArray(element[f])) {
                    element[f].forEach(function (el, idx) {
                        subfolder += isFolder(el.element) ? 1 : 0;
                    });
                }
            } else {
                subfolder += isFolder(element[f]) ? 1 : 0;
            }
        }
        return subfolder;
    };

    var hasFile = function (element, trashRoot) {
        if (typeof(element) !== "object") { return false; }
        var file = 0;
        for (var f in element) {
            if (trashRoot) {
                if ($.isArray(element[f])) {
                    element[f].forEach(function (el, idx) {
                        file += isFile(el.element) ? 1 : 0;
                    });
                }
            } else {
                file += isFile(element[f]) ? 1 : 0;
            }
        }
        return file;
    };

    var isSubpath = function (path, parentPath) {
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
        return fileA === fileB;
    };
    var isInTree = function (file, root) {
        if (isFile(root)) {
            return compareFiles(file, root);
        }
        var inTree = false;
        for (var e in root) {
            inTree = isInTree(file, root[e]);
            if (inTree) { break; }
        };
        return inTree;
    };
    var isInTrash = function (file) {
        var inTrash = false;
        var root = files[TRASH];
        for (var e in root) {
            if (!$.isArray(root[e])) {
                error("Trash contains a non-array element");
                return;
            }
            root[e].some(function (trashEl, idx) {
                inTrash = isInTree(file, trashEl.element);
                return inTrash;
            });
            if (inTrash) { break; }
        }
        return inTrash;
    };

    var isInTrashRoot = function (path) {
        return path[0] === TRASH && path.length === 4;
    };
    var getTrashElementData = function (trashPath) {
        if (!isInTrashRoot) {
            debug("Called getTrashElementData on a element not in trash root: ", trashpath);
            return;
        }
        var parentPath = trashPath.slice();
        parentPath.pop();
        return findElement(files, parentPath);
    };

    var getUnsortedFiles = function () {
        return files[UNSORTED];
        /*var filesData = Object.keys(files[FILES_DATA]);
        var unsorted = [];
        filesData.forEach(function (file) {
            if (!isInTree(file, files[ROOT]) && !isInTrash(file)) {
                unsorted.push(file);
            }
        });
        return unsorted;*/
        //TODO
    };
    var getSortedFiles = function () {
        // TODO
        console.log('get sorted files, not implemented yet');
    };

    var compareDays = function (date1, date2) {
        var day1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
        var day2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
        var ms = Math.abs(day1-day2);
        return Math.floor(ms/1000/60/60/24);
    };

    var getDate = function (sDate) {
        var ret = sDate.toString();
        try {
            var date = new Date(sDate);
            var today = new Date();
            var diff = compareDays(date, today);
            if (diff === 0) {
                ret = date.toLocaleTimeString();
            } else {
                ret = date.toLocaleDateString();
            }
        } catch (e) {
            error("Unable to format that string to a date with .toLocaleString", sDate, e);
        }
        return ret;
    };


    // Data from filesData
    var getTitle = function (href) {
        if (!files[FILES_DATA][href]) {
            error("getTitle called with a non-existing href: ", href);
            return;
        }
        return files[FILES_DATA][href].title;
    };


    // Find an element in a object following a path, resursively
    var findElement = function (root, pathInput) {
        if (!pathInput) {
            error("Invalid path:\n", pathInput, "\nin root\n", root);
            return;
        }
        if (pathInput.length === 0) { return root; }
        var path = pathInput.slice();
        var key = path.shift();
        if (typeof root[key] === "undefined") {
            debug("Unable to find the key '" + key + "' in the root object provided:\n", root);
            return;
        }
        return findElement(root[key], path);
    };

    var moveElement = function (elementPath, newParentPath) {
        if (comparePath(elementPath, newParentPath)) { return; } // Nothing to do...
        if (newParentPath[0] && newParentPath[0] === TRASH) {
            debug("Moving to trash is forbidden. You have to use the removeElement function");
            return;
        }
        var element = findElement(files, elementPath);

        var newParent = findElement(files, newParentPath);

        if (newParentPath[0] && newParentPath[0] === UNSORTED) {
            if (isFolder(element)) {
                //TODO translate
                log("You can't move a folder to the list of unsorted pads");
                return;
            } else {
                if (files[UNSORTED].indexOf(element) === -1) {
                    files[UNSORTED].push(element);
                }
                deleteFromObject(elementPath);
                module.displayDirectory(currentPath);
                return;
            }
        }

        var name;

        if (elementPath[0] === UNSORTED) {
            name = getTitle(element);
        } else if (elementPath.length === 4 && elementPath[0] === TRASH) {
            // Element from the trash root: elementPath = [TRASH, "{dirName}", 0, 'element']
            name = elementPath[1];
        } else {
            name = elementPath[elementPath.length-1];
        }
        var newName = elementPath[0] !== ROOT ? getAvailableName(newParent, name) : name;

        if (typeof(newParent[newName]) !== "undefined") {
            log("A file with the same name already exist at the new location. Rename the file and try again.");
            return;
        }

        newParent[newName] = element;
        deleteFromObject(elementPath);
        module.displayDirectory(currentPath);
    };

    var createNewFolder = function (folderPath, name) {
        var parentEl = findElement(files, folderPath);
        var folderName = getAvailableName(parentEl, name || NEW_FOLDER_NAME);
        parentEl[folderName] = {};
        var newPath = folderPath.slice();
        newPath.push(folderName);
        module.newFolder = newPath;
        displayDirectory(currentPath);
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
    var removeElement = function (path, displayTrash, force) {
        if (!path || path.length < 2 || path[0] === TRASH) {
            debug("Calling removeElement from a wrong path: ", path);
            return;
        }
        var element = findElement(files, path);
        var key = path[path.length - 1];
        var name = path[0] === UNSORTED ? getTitle(element) : key;
        var andThen = function () {
            var parentPath = path.slice();
            parentPath.pop();
            pushToTrash(name, element, parentPath);
            deleteFromObject(path);
            if (displayTrash) {
                module.displayDirectory([TRASH]);
            } else {
                module.displayDirectory(currentPath);
            }
        };
        if (force) {
            andThen();
            return;
        }
        Cryptpad.confirm("Are you sure you want to move " + name + " to the trash?", function(res) {
            if (!res) { return; }
            andThen();
        });
    };

    var removeFromTrashArray = function (element, name) {
        var array = files[TRASH][name];
        if (!array || !$.isArray(array)) { return; }
        // Remove the element from the trash array
        var index = array.indexOf(element);
        if (index > -1) {
            array.splice(index, 1);
        }
        // Remove the array is empty to have a cleaner object in chainpad
        if (array.length === 0) {
            delete files[TRASH][name];
        }
    };

    var restoreTrash = function (path) {
        if (!path || path.length !== 4 || path[0] !== TRASH) {
            debug("restoreTrash was called from an element not in the trash root: ", path);
            return;
        }
        var element = findElement(files, path);
        var parentEl = getTrashElementData(path);
        var newPath = parentEl.path;
        if (newPath[0] === UNSORTED) {
            if (files[UNSORTED].indexOf(element) === -1) {
                files[UNSORTED].push(element);
                removeFromTrashArray(parentEl, path[1]);
                module.displayDirectory(currentPath);
            }
            return;
        }
        // Find the new parent element
        var newParentEl = findElement(files, newPath);
        var name = getAvailableName(newParentEl, path[1]);
        // Move the element
        newParentEl[name] = element;
        removeFromTrashArray(parentEl, path[1]);
        module.displayDirectory(currentPath);
    };

    // Delete permanently
    var removeFromTrash = function (path) {
        if (!path || path.length < 4 || path[0] !== TRASH) { return; }
        // Remove the last element from the path to get the parent path and the element name
        var parentPath = path.slice();
        var name;
        if (path.length === 4) { // Trash root
            name = path[1];
            parentPath.pop();
            var parentElement = findElement(files, parentPath);
            removeFromTrashArray(parentElement, name);
            module.displayDirectory(currentPath);
            return;
        }
        name = parentPath.pop();
        var parentEl = findElement(files, parentPath);
        if (typeof(parentEl[name]) === "undefined") {
            console.error("Unable to locate the element to remove from trash: ", path);
            return;
        }
        delete parentEl[name];
        module.displayDirectory(currentPath);
    };

    var emptyTrash = function () {
        files[TRASH] = {};
        module.displayDirectory(currentPath);
    };

    var openFile = function (fileEl) {
        window.location.hash = fileEl;
    };

    var renameElement = function (path, newName) {
        if (path.length <= 1) {
            logError('Renaming `root` is forbidden');
            return;
        }
        if (!newName || newName.trim() === "") { return; }
        var isCurrentDirectory = comparePath(path, currentPath);
        // Copy the element path and remove the last value to have the parent path and the old name
        var element = findElement(files, path);
        var parentPath = path.slice();
        var oldName = parentPath.pop();
        if (oldName === newName) {
            return;
        }
        var parentEl = findElement(files, parentPath);
        if (typeof(parentEl[newName]) !== "undefined") {
            log('Name already used in that directory. Please choose another one.');
            //TODO translate
            return;
        }
        parentEl[newName] = element;
        delete parentEl[oldName];
        module.resetTree();
        module.displayDirectory(currentPath);
    };

    var displayRenameInput = function ($element, path) {
        if (!path || path.length < 2) {
            logError("Renaming a top level element (root, trash or filesData) is forbidden.");
            return;
        }
        $element.hide();
        removeSelected();
        var name = path[path.length - 1];
        var $input = $('<input>', {
            placeholder: name,
            value: name
        });
        $input.on('keyup', function (e) {
            if (e.which === 13) {
                renameElement(path, $input.val());
                removeInput();
            }
        });
        $input.insertAfter($element);
        $input.focus();
        $input.select();
        // We don't want to open the file/folder when clicking on the input
        $input.on('click dblclick', function (e) {
            removeSelected();
            e.stopPropagation();
        });
        // Remove the browser ability to drag text from the input to avoid
        // triggering our drag/drop event handlers
        $input.on('dragstart dragleave drag drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
        });
        // Make the parent element non-draggable when selecting text in the field
        // since it would remove the input
        $input.on('mousedown', function () {
            $input.parents('li').attr("draggable", false);
        });
        $input.on('mouseup', function () {
            $input.parents('li').attr("draggable", true);
        });
    };

    var onElementClick = function ($element, path) {
        // If the element was already selected, check if the rename action is available
        /*if ($element.hasClass("selected")) {
            if($content.find('.selected').length === 1 &&
                lastSelectTime &&
                (now() - lastSelectTime) > TIME_BEFORE_RENAME) {
                //$element.
                renameElement(path, "File renamed");
            }
            return;
        }*/
        removeSelected();
        if (!$element.is('li')) {
            $element = $element.closest('li');
        }
        if (!$element.length) {
            // TODO translate
            log("Unable to select the targetted element. If the problem persist, try to reload the page");
            return;
        }
        if (!$element.hasClass("selected")) {
            $element.addClass("selected");
            lastSelectTime = now();
        }
    };

    var openContextMenu = function (e, $menu) {
        module.hideMenu();
        e.stopPropagation();
        var path = $(e.target).closest('li').data('path');
        if (!path) { return; }
        $menu.css({
            display: "block",
            left: e.pageX,
            top: e.pageY
        });
        // $element should be the <span class="element">, find it if it's not the case
        var $element = $(e.target).closest('li').children('span.element');
        onElementClick($element);
        if (!$element.length) {
            console.error("Unable to locate the .element tag", e.target);
            $menu.hide();
            log("Unable to open the context menu for that element. If the problem persist, try to reload the page");
            return;
        }
        $menu.find('a').data('path', path);
        $menu.find('a').data('element', $element);
        return false;
    };

    var openDirectoryContextMenu = function (e) {
        openContextMenu(e, $contextMenu);
        return false;
    };

    var openTrashTreeContextMenu = function (e) {
        openContextMenu(e, $trashTreeContextMenu);
        return false;
    };

    var openTrashContextMenu = function (e) {
        var path = $(e.target).closest('li').data('path');
        if (!path) { return; }
        $trashContextMenu.find('li').show();
        if (path.length > 4) {
            $trashContextMenu.find('a.restore').parent('li').hide();
        }
        openContextMenu(e, $trashContextMenu);
        return false;
    };

    var onDrag = function (ev, path) {
        var data = {
            'path': path
        };
        ev.dataTransfer.setData("text", JSON.stringify(data));
    };

    var onDrop = function (ev) {
        ev.preventDefault();
        $iframe.find('.droppable').removeClass('droppable');
        var data = ev.dataTransfer.getData("text");
        var oldPath = JSON.parse(data).path;
        var newPath = $(ev.target).data('path') || $(ev.target).parent('li').data('path');
        if (!oldPath || !newPath) { return; }
        // Call removeElement when trying to move something into the trash
        if (newPath[0] === TRASH) {
            removeElement(oldPath, true);
            return;
        }
        moveElement(oldPath, newPath);
    };

    var addDragAndDropHandlers = function ($element, path, isFolder, droppable) {
        // "dragenter" is fired for an element and all its children
        // "dragleave" may be fired when entering a child
        // --> We store the number of enter/leave and the element entered and we remove the
        // highlighting only when we have left everything
        var counter = 0;
        var dragenterList = [];
        $element.on('dragstart', function (e) {
            e.stopPropagation();
            counter = 0;
            dragenterList = [];
            onDrag(e.originalEvent, path);
        });

        // Add drop handlers if we are not in the trash and if the element is a folder
        if (!droppable || !isFolder) { return; }

        $element.on('dragover', function (e) {
            e.preventDefault();
        });
        $element.on('drop', function (e) {
            onDrop(e.originalEvent);
        });
        $element.on('dragenter', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (dragenterList.indexOf(e.target) !== -1) { return; }
            dragenterList.push(e.target);
            counter++;
            $element.addClass('droppable');
        });
        $element.on('dragleave', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var idx = dragenterList.indexOf(e.target);
            dragenterList.splice(idx, 1);
            counter--;
            if (counter <= 0) {
                $element.removeClass('droppable');
            }
        });
    };

    var addFileData = function (element, key, $span, displayTitle) {
        if (!isFile(element)) { return; }

        // The element with the class '.name' is underlined when the 'li' is hovered
        var $name = $('<span>', {'class': 'name', title: key}).text(key);
        $span.html('');
        $span.append($name);

        if (typeof(files[FILES_DATA][element]) === "undefined") {
            return;
        }
        var data = files[FILES_DATA][element];
        var $title = $('<span>', {'class': 'title listElement', title: data.title}).text(data.title);
        var $adate = $('<span>', {'class': 'date listElement', title: getDate(data.atime)}).text(getDate(data.atime));
        var $cdate = $('<span>', {'class': 'date listElement', title: getDate(data.ctime)}).text(getDate(data.ctime));
        if (displayTitle) {
            $span.append($title);
        }
        $span.append($adate).append($cdate);
    };

    var addFolderData = function (element, key, $span) {
        if (!element || !isFolder(element)) { return; }
        $span.html('');
        // The element with the class '.name' is underlined when the 'li' is hovered
        var sf = hasSubfolder(element);
        var files = hasFile(element);
        var $name = $('<span>', {'class': 'name', title: key}).text(key);
        var $subfolders = $('<span>', {'class': 'folders listElement', title: sf}).text(sf);
        var $files = $('<span>', {'class': 'files listElement', title: files}).text(files);
        $span.append($name).append($subfolders).append($files);
    };

    var createElement = function (path, elPath, root, isFolder) {
        // Forbid drag&drop inside the trash
        var isTrash = path[0] === TRASH;
        var newPath = path.slice();
        var key;
        if (isTrash && $.isArray(elPath)) {
            key = elPath[0];
            elPath.forEach(function (k) { newPath.push(k); });
        } else {
            key = elPath;
            newPath.push(key);
        }

        var element = findElement(files, newPath);
        var $icon = $fileIcon.clone();
        var spanClass = 'file-element element';
        if (isFolder) {
            spanClass = 'folder-element element';
            $icon = isFolderEmpty(root[key]) ? $folderEmptyIcon.clone() : $folderIcon.clone();
        }
        var $name = $('<span>', { 'class': spanClass }).text(key);
        if (isFolder) {
            addFolderData(element, key, $name);
        } else {
            addFileData(element, key, $name, true);
        }
        var $element = $('<li>', {
            draggable: true
        }).append($icon).append($name).dblclick(function () {
            if (isFolder) {
                module.displayDirectory(newPath);
                return;
            }
            if (isTrash) { return; }
            openFile(root[key]);
        });
        $element.data('path', newPath);
        addDragAndDropHandlers($element, newPath, isFolder, !isTrash);
        $element.click(function(e) {
            e.stopPropagation();
            onElementClick($element, newPath);
        });
        if (!isTrash) {
            $element.contextmenu(openDirectoryContextMenu);
        } else {
            $element.contextmenu(openTrashContextMenu);
        }
        var isNewFolder = module.newFolder && comparePath(newPath, module.newFolder);
        if (isNewFolder) {
            window.setTimeout(function() {
                displayRenameInput($name, newPath);
            }, 500);
            delete module.newFolder;
        };
        return $element;
    };

    // Display the full path in the title when displaying a directory from the trash
    var getTrashTitle = function (path) {
        if (!path[0] || path[0] !== TRASH) { return; }
        var title = TRASH_NAME;
        for (var i=1; i<path.length; i++) {
            if (i === 3 && path[i] === 'element') {}
            else if (i === 2 && parseInt(path[i]) === path[i]) {
                if (path[i] !== 0) {
                    title += " [" + path[i] + "]";
                }
            } else {
                title += " / " + path[i];
            }
        }
        return title;
    };

    var createTitle = function (path) {
        var isTrash = path[0] === TRASH;
        // Create title and "Up" icon
        var name = path[path.length - 1];
        if (name === ROOT && path.length === 1) { name = ROOT_NAME; }
        else if (name === TRASH && path.length === 1) { name = TRASH_NAME; }
        else if (name === UNSORTED && path.length === 1) { name = UNSORTED_NAME; }
        else if (name === FILES_DATA && path.length === 1) { name = FILES_DATA_NAME; }
        else if (path.length > 1 && path[0] === TRASH) { name = getTrashTitle(path); }
        var $title = $('<h1>').text(name);
        if (path.length > 1) {
            var $parentFolder = $upIcon.clone().addClass("parentFolder")
                .click(function() {
                    var newPath = path.slice();
                    newPath.pop();
                    if (isTrash && path.length === 4) {
                        // path = [TRASH, "{DirName}", 0, 'element']
                        // --> parent is TRASH
                        newPath = [TRASH];
                    }
                    module.displayDirectory(newPath);
                });
            $title.append($parentFolder);
        }
        return $title;
    };

    var createViewModeButton = function () {
        var $block = $('<div>', {
            'class': 'btn-group topButtonContainer changeViewModeContainer'
        });

        var $listButton = $('<button>', {
            'class': 'btn'
        }).append($listIcon.clone());
        var $gridButton = $('<button>', {
            'class': 'btn'
        }).append($gridIcon.clone());

        $listButton.click(function () {
            $gridButton.removeClass('active');
            $listButton.addClass('active');
            setViewMode('list');
            $iframe.find('#' + FOLDER_CONTENT_ID).removeClass('grid');
            $iframe.find('#' + FOLDER_CONTENT_ID).addClass('list');
        });
        $gridButton.click(function () {
            $listButton.removeClass('active');
            $gridButton.addClass('active');
            setViewMode('grid');
            $iframe.find('#' + FOLDER_CONTENT_ID).addClass('grid');
            $iframe.find('#' + FOLDER_CONTENT_ID).removeClass('list');
        });

        if (getViewMode() === 'list') {
            $listButton.addClass('active');
        } else {
            $gridButton.addClass('active');
        }
        $block.append($listButton).append($gridButton);
        return $block;
    };

    var createNewFolderButton = function () {
        var $block = $('<div>', {
            'class': 'btn-group topButtonContainer newFolderButtonContainer'
        });

        var $listButton = $('<button>', {
            'class': 'btn'
        }).text("NEW FOLDER"); //TODO translate

        $listButton.click(function () {
            createNewFolder(currentPath);
        });

        $block.append($listButton);
        return $block;
    };

    // TODO translate
    var getFolderListHeader = function () {
        var $folderHeader = $('<li>', {'class': 'header listElement'});
        var $fohElement = $('<span>', {'class': 'element'}).appendTo($folderHeader);
        var $name = $('<span>', {'class': 'name'}).text("Folder name");
        var $subfolders = $('<span>', {'class': 'folders listElement'}).text("# of folders");
        var $files = $('<span>', {'class': 'files listElement'}).text("# of files");
        $fohElement.append($name).append($subfolders).append($files);
        return $folderHeader;
    };
    var getFileListHeader = function (displayTitle) {
        var $fileHeader = $('<li>', {'class': 'file-header header listElement'});
        var $fihElement = $('<span>', {'class': 'element'}).appendTo($fileHeader);
        var $fhName = $('<span>', {'class': 'name'}).text("File name");
        var $fhTitle = displayTitle ? $('<span>', {'class': 'title '}).text("Title") : '';
        var $fhAdate = $('<span>', {'class': 'date'}).text("Last access");
        var $fhCdate = $('<span>', {'class': 'date'}).text("Creation");
        $fihElement.append($fhName).append($fhTitle).append($fhAdate).append($fhCdate);
        return $fileHeader;
    };

    var displayUnsorted = function ($container) {
        var unsorted = files[UNSORTED];
        if (allFilesSorted()) { return; }
        $container.append(getFileListHeader(false));
        unsorted.forEach(function (href, idx) {
            var file = files[FILES_DATA][href];
            if (!file) {
                debug("getUnsortedFiles returns an element not present in filesData: ", href);
                return;
            }
            var $icon = $fileIcon.clone();
            var $name = $('<span>', { 'class': 'file-element element' });
            addFileData(href, file.title, $name, false);
            var $element = $('<li>', {
                draggable: true
            }).append($icon).append($name).dblclick(function () {
                openFile(href);
            });
            var path = [UNSORTED, idx];
            $element.data('path', path);
            $element.click(function(e) {
                e.stopPropagation();
                onElementClick($element, path);
            });
            addDragAndDropHandlers($element, path, false, false);
            //$element.contextmenu(openTrashContextMenu);
            $container.append($element);
        });
    };

    // Display the selected directory into the content part (rightside)
    // NOTE: Elements in the trash are not using the same storage structure as the others
    var displayDirectory = module.displayDirectory = function (path) {
        currentPath = path;
        module.resetTree();
        $content.html("");
        if (!path || path.length === 0) {
            path = [ROOT];
        }
        var isTrashRoot = comparePath(path, [TRASH]);
        var isUnsorted = comparePath(path, [UNSORTED]);

        var root = findElement(files, path);
        if (typeof(root) === "undefined") {
            // TODO translate
            log("The selected or last visited directory no longer exis.t Opening the parent folder...");
            debug("Unable to locate the selected directory: ", path);
            var parentPath = path.slice();
            parentPath.pop();
            displayDirectory(parentPath);
            return;
        }

        setLastOpenedFolder(path);

        var $title = createTitle(path);

        var $dirContent = $('<div>', {id: FOLDER_CONTENT_ID});
        var mode = getViewMode();
        if (mode) {
            $dirContent.addClass(getViewModeClass());
        }
        var $list = $('<ul>').appendTo($dirContent);

        if (isUnsorted) {
            displayUnsorted($list);
            $content.append($title).append($dirContent);
            return;
        }

        var $modeButton = createViewModeButton().appendTo($title);
        var $newFolderButton = createNewFolderButton().appendTo($title);

        var $folderHeader = getFolderListHeader();
        var $fileHeader = getFileListHeader(true);

        if (isTrashRoot) {
            // Elements in the trash are JS arrays (several elements can have the same name)
            [true,false].forEach(function (folder) {
                var testElement = isFile;
                if (!folder) {
                    testElement = isFolder;
                }
                if (folder) {
                    if (hasSubfolder(root, true)) { $list.append($folderHeader); }
                    else { return; }
                } else {
                    if (hasFile(root, true)) { $list.append($fileHeader); }
                    else { return; }
                }
                Object.keys(root).forEach(function (key) {
                    if (!$.isArray(root[key])) {
                        console.error("Trash element has a wrong type", root[key]);
                        return;
                    }
                    root[key].forEach(function (el, idx) {
                        if (testElement(el.element)) { return; }
                        var spath = [key, idx, 'element'];
                        var $element = createElement(path, spath, root, folder);
                        $list.append($element);
                    });
                });
            });
        } else {
            if (hasSubfolder(root)) { $list.append($folderHeader); }
            // display sub directories
            Object.keys(root).forEach(function (key) {
                if (isFile(root[key])) { return; }
                var $element = createElement(path, key, root, true);
                $element.appendTo($list);
            });
            if (hasFile(root)) { $list.append($fileHeader); }
            // display files
            Object.keys(root).forEach(function (key) {
                if (isFolder(root[key])) { return; }
                var $element = createElement(path, key, root, false);
                $element.appendTo($list);
            });
        }
        $content.append($title).append($dirContent);
    };

    var createTreeElement = function (name, $icon, path, draggable, collapsable, active) {
        var $name = $('<span>', { 'class': 'folder-element element' }).text(name)
            .click(function () {
                module.displayDirectory(path);
            });
        var $collapse;
        if (collapsable) {
            $collapse = $expandIcon.clone();
        }
        var $element = $('<li>', {
            draggable: draggable
        }).append($collapse).append($icon).append($name);
        if (collapsable) {
            $element.addClass('collapsed');
            $collapse.click(function() {
                if ($element.hasClass('collapsed')) {
                    // It is closed, open it
                    $element.removeClass('collapsed');
                    setFolderOpened(path, true);
                    $collapse.removeClass('fa-plus-square-o');
                    $collapse.addClass('fa-minus-square-o');
                } else {
                    // Collapse the folder
                    $element.addClass('collapsed');
                    setFolderOpened(path, false);
                    $collapse.removeClass('fa-minus-square-o');
                    $collapse.addClass('fa-plus-square-o');
                    // Change the current opened folder if it was collapsed
                    if (isSubpath(currentPath, path)) {
                        displayDirectory(path);
                    }
                }
            });
            if (wasFolderOpened(path)) {
                $collapse.click();
            }
        }
        $element.data('path', path);
        addDragAndDropHandlers($element, path, true, true);
        $element.on('dragstart', function (e) {
            e.stopPropagation();
            onDrag(e.originalEvent, path);
        });
        $element.on('dragover', function (e) {
            e.preventDefault();
        });
        $element.on('drop', function (e) {
            onDrop(e.originalEvent);
        });
        var counter = 0;
        $element.on('dragenter', function (e) {
            e.preventDefault();
            e.stopPropagation();
            counter++;
            $element.addClass('droppable');
        });
        $element.on('dragleave', function (e) {
            e.preventDefault();
            e.stopPropagation();
            counter--;
            if (counter === 0) {
                $element.removeClass('droppable');
            }
        });
        if (active) { $name.addClass('active'); }
        return $element;
    };

    var createTree = function ($container, path) {
        var root = findElement(files, path);
        if (isFolderEmpty(root)) { return; }

        // Display the root element in the tree
        var displayingRoot = comparePath([ROOT], path);
        if (displayingRoot) {
            var isRootOpened = comparePath([ROOT], currentPath);
            var $rootIcon = isFolderEmpty(files[ROOT]) ?
                (isRootOpened ? $folderOpenedEmptyIcon : $folderEmptyIcon) :
                (isRootOpened ? $folderOpenedIcon : $folderIcon);
            var $rootElement = createTreeElement(ROOT_NAME, $rootIcon.clone(), [ROOT], false, false, isRootOpened);
            $rootElement.addClass('root');
            var $root = $('<ul>').append($rootElement).appendTo($container);
            $container = $rootElement;
        }

        // Display root content
        var $list = $('<ul>').appendTo($container);
        Object.keys(root).forEach(function (key) {
            // Do not display files in the menu
            if (isFile(root[key])) { return; }
            var newPath = path.slice();
            newPath.push(key);
            var isCurrentFolder = comparePath(newPath, currentPath);
            var isEmpty = isFolderEmpty(root[key]);
            var subfolder = hasSubfolder(root[key]);
            var $icon = isEmpty ?
                (isCurrentFolder ? $folderOpenedEmptyIcon : $folderEmptyIcon) :
                (isCurrentFolder ? $folderOpenedIcon : $folderIcon);
            var $element = createTreeElement(key, $icon.clone(), newPath, true, subfolder, isCurrentFolder);
            $element.appendTo($list);
            $element.contextmenu(openDirectoryContextMenu);
            createTree($element, newPath);
        });
    };

    var allFilesSorted = function () {
        return getUnsortedFiles().length === 0;
    };

    var createUnsorted = function ($container, path) {
        if (allFilesSorted()) { return; }
        var $icon = $unsortedIcon.clone();
        var isOpened = comparePath(path, currentPath);
        /*var $unsorted = $('<span>', {
                'class': 'tree-unsorted element'
            }).text(UNSORTED_NAME).prepend($icon)
            .click(function () {
                module.displayDirectory(path);
            });
        var $unsortedElement = $('<li>').append($unsorted);
        $unsortedElement.addClass('root');
        $unsortedElement.data('path', [UNSORTED]);
        if (isOpened) { $unsorted.addClass('active'); }*/
        var $unsortedElement = createTreeElement(UNSORTED_NAME, $icon, [UNSORTED], false, false, isOpened);

        var $unsortedList = $('<ul>', { id: 'unsortedTree' }).append($unsortedElement);
        $container.append($unsortedList);
    };

    var createTrash = function ($container, path) {
        var $icon = isFolderEmpty(files[TRASH]) ? $trashEmptyIcon.clone() : $trashIcon.clone();
        var isOpened = comparePath(path, currentPath);
        var $trash = $('<span>', {
                'class': 'tree-trash element'
            }).text(TRASH_NAME).prepend($icon)
            .click(function () {
                module.displayDirectory(path);
            });
        var $trashElement = $('<li>').append($trash);
        $trashElement.addClass('root');
        $trashElement.data('path', [TRASH]);
        addDragAndDropHandlers($trashElement, path, true, true);
        $trashElement.contextmenu(openTrashTreeContextMenu);
        if (isOpened) { $trash.addClass('active'); }

        var $trashList = $('<ul>', { id: 'trashTree' }).append($trashElement);
        $container.append($trashList);
    };

    var resetTree = module.resetTree = function () {
        $tree.html('');
        createTree($tree, [ROOT]);
        createUnsorted($tree, [UNSORTED]);
        createTrash($tree, [TRASH]);
    };
    module.displayDirectory(currentPath);
    //resetTree(); //already called by displayDirectory

    var hideMenu = module.hideMenu = function () {
        $contextMenu.hide();
        $trashTreeContextMenu.hide();
        $trashContextMenu.hide();
    };

    $contextMenu.on("click", "a", function(e) {
        e.stopPropagation();
        var path = $(this).data('path');
        var $element = $(this).data('element');
        if (!$element || !path || path.length < 2) {
            //TODO translate
            log("Forbidden action");
            debug("Directory context menu on a forbidden or unexisting element. ", $element, path);
            return;
        }
        if ($(this).hasClass("rename")) {
            displayRenameInput($element, path);
        }
        else if($(this).hasClass("delete")) {
            removeElement(path, false);
        }
        else if ($(this).hasClass('open')) {
            $element.dblclick();
        }
        module.hideMenu();
    });

    $trashTreeContextMenu.on('click', 'a', function (e) {
        e.stopPropagation();
        var path = $(this).data('path');
        var $element = $(this).data('element');
        if (!$element || !comparePath(path, [TRASH])) {
            //TODO translate
            log("Forbidden action");
            debug("Trash tree context menu on a forbidden or unexisting element. ", $element, path);
            return;
        }
        if ($(this).hasClass("empty")) {
            // TODO translate
            Cryptpad.confirm("Are you sure you want to empty the trash?", function(res) {
                if (!res) { return; }
                emptyTrash();
            });
        }
        module.hideMenu();
    });

    $trashContextMenu.on('click', 'a', function (e) {
        e.stopPropagation();
        var path = $(this).data('path');
        var $element = $(this).data('element');
        if (!$element || !path || path.length < 2) {
            //TODO translate
            log("Forbidden action");
            debug("Trash context menu on a forbidden or unexisting element. ", $element, path);
            return;
        }
        var name = path[path.length - 1];
        if ($(this).hasClass("remove")) {
            if (path.length === 4) { name = path[1]; }
            // TODO translate
            Cryptpad.confirm("Are you sure you want to remove " + name + " from the trash permanently?", function(res) {
                if (!res) { return; }
                removeFromTrash(path);
            });
        }
        else if ($(this).hasClass("restore")) {
            if (path.length === 4) { name = path[1]; }
            // TODO translate
            Cryptpad.confirm("Are you sure you want to restore " + name + " to its previous location?", function(res) {
                if (!res) { return; }
                restoreTrash(path);
            });
        }
        module.hideMenu();
    });

    $(ifrw).on('click', function (e) {
        if (e.which !== 1) { return ; }
        removeSelected(e);
        removeInput(e);
        module.hideMenu(e);
    });
    $(ifrw).on('drag drop', function (e) {
        removeInput(e);
        module.hideMenu(e);
    });
    $(ifrw).on('mouseup drop', function (e) {
        $iframe.find('.droppable').removeClass('droppable');
    });
});
