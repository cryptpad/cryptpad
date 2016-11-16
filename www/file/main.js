require.config({ paths: { 'json.sortify': '/bower_components/json.sortify/dist/JSON.sortify' } });
define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/textpatcher/TextPatcher.amd.js',
    '/customize/messages.js?app=file',
    'json.sortify',
    '/common/cryptpad-common.js',
    '/file/fileObject.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/bower_components/bootstrap/dist/js/bootstrap.min.js',
    '/customize/pad.js'
], function (Config, Listmap, Crypto, TextPatcher, Messages, JSONSortify, Cryptpad, FO) {
    var module = window.MODULE = {};

    var $ = window.jQuery;
    var saveAs = window.saveAs;
    var $iframe = $('#pad-iframe').contents();
    var ifrw = $('#pad-iframe')[0].contentWindow;

    //var hash = Cryptpad.getAttribute('FS_hash', cb);
    var hash = localStorage.FS_hash;
    if (hash) {
        window.location.hash = hash;
    }

    var secret = Cryptpad.getSecrets();

    var ROOT = "root";
    var ROOT_NAME = Messages.fm_rootName;
    var UNSORTED = "unsorted";
    var UNSORTED_NAME = Messages.fm_unsortedName;
    var FILES_DATA = "filesData";
    var FILES_DATA_NAME = Messages.fm_filesDataName;
    var TRASH = "trash";
    var TRASH_NAME = Messages.fm_trashName;
    var TIME_BEFORE_RENAME = 1000;
    var LOCALSTORAGE_LAST = "cryptpad-file-lastOpened";
    var LOCALSTORAGE_OPENED = "cryptpad-file-openedFolders";
    var LOCALSTORAGE_VIEWMODE = "cryptpad-file-viewMode";
    var FOLDER_CONTENT_ID = "folderContent";

    var NEW_FOLDER_NAME = Messages.fm_newFolder;

    var config = {};
    var DEBUG = config.DEBUG = true;
    var debug = config.debug = DEBUG ? console.log : function() {return;};
    var logError = config.logError = console.error;
    var log = config.log = Cryptpad.log;
    var DEBUG_LS = module.DEBUG_LS = {
        resetLocalStorage : function () {
            delete localStorage[LOCALSTORAGE_OPENED];
            delete localStorage[LOCALSTORAGE_LAST];
        }
    };

    var filesObject = module.files = {
        root: {
            "Directory 1": {
                "Dir A": {
                    "Dir D": {
                        "Dir E": {},
                    },
                    "File a": "https://cryptpad.fr/slide/#hash_a",
                    "File b": "https://cryptpad.fr/pad/#hash_b",
                    "File c": "https://cryptpad.fr/pad/#hash_c",
                    "File d": "https://cryptpad.fr/pad/#hash_d",
                    "File e": "https://cryptpad.fr/pad/#hash_e",
                    "File f": "https://cryptpad.fr/pad/#hash_f",
                    "File g": "https://cryptpad.fr/pad/#hash_g",
                    "File h": "https://cryptpad.fr/pad/#hash_h",
                    "File i": "https://cryptpad.fr/pad/#hash_i",
                    "File j": "https://cryptpad.fr/pad/#hash_j",
                    "File k": "https://cryptpad.fr/pad/#hash_k"
                },
                "Dir C": {},
                "Dir B": {},
                "File A": "https://cryptpad.fr/pad/#hash_A"
            },
            "Directory 2": {
                "File B": "https://cryptpad.fr/pad/#hash_B",
                "File C": "https://cryptpad.fr/pad/#hash_C"
            }
        },
        unsorted: ["https://cryptpad.fr/pad/#href1", "https://cryptpad.fr/pad/#href2", "https://cryptpad.fr/pad/#href3"],
        filesData: {
            "https://cryptpad.fr/slide/#hash_a": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Pad A"
            },
            "https://cryptpad.fr/pad/#hash_b": {
                ctime: "Mon Nov 07 2016 16:38:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:38:21 GMT+0100 (CET)",
                title: "Pad B"
            },
            "https://cryptpad.fr/pad/#hash_c": {
                ctime: "Tue Nov 08 2016 16:34:21 GMT+0100 (CET)",
                atime: "Sun Nov 06 2016 12:34:21 GMT+0100 (CET)",
                title: "Pad C With A Very Very Very Long Title"
            },
            "https://cryptpad.fr/pad/#hash_e": {
                ctime: "Tue Nov 08 2016 16:26:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:26:21 GMT+0100 (CET)",
                title: "Pad E"
            },
            "https://cryptpad.fr/pad/#hash_f": {
                ctime: "Tue Nov 08 2016 16:22:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:22:21 GMT+0100 (CET)",
                title: "Pad F"
            },
            "https://cryptpad.fr/pad/#hash_g": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Pad A"
            },
            "https://cryptpad.fr/pad/#hash_h": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Pad A"
            },
            "https://cryptpad.fr/pad/#hash_i": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Pad A"
            },
            "https://cryptpad.fr/pad/#hash_j": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Pad A"
            },
            "https://cryptpad.fr/pad/#hash_k": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Pad A"
            },
            "https://cryptpad.fr/pad/#hash_Z": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Code Z"
            },
            "https://cryptpad.fr/pad/#hash_A": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Code A"
            },
            "https://cryptpad.fr/pad/#hash_B": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Code B"
            },
            "https://cryptpad.fr/pad/#hash_C": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Code C"
            },
            "https://cryptpad.fr/pad/#hash_1": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Code C"
            },
            "https://cryptpad.fr/pad/#hash_2": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Code C"
            },
            "https://cryptpad.fr/pad/#hash_3": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Code C"
            },
            "https://cryptpad.fr/pad/#hash_4": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Code C"
            },
            "https://cryptpad.fr/pad/#href1": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Pad unsorted 1"
            },
            "https://cryptpad.fr/pad/#href2": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Pad unsorted 2"
            },
            "https://cryptpad.fr/pad/#href3": {
                ctime: "Tue Nov 08 2016 16:42:21 GMT+0100 (CET)",
                atime: "Tue Nov 08 2016 12:42:21 GMT+0100 (CET)",
                title: "Pad unsorted 3"
            }
        },
        trash: {
            "File Z": [{
                element: "https://cryptpad.fr/pad/#hash_Z",
                path: [ROOT]
            }]
        }
    };
    module.defaultFiles = JSON.parse(JSON.stringify(filesObject));

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
            logError("Incorrect view mode: ", mode);
            return;
        }
        localStorage[LOCALSTORAGE_VIEWMODE] = mode;
    };

    var now = function () {
        return new Date().getTime();
    };

    var keyPressed = [];
    var pressKey = function (key, state) {
        if (state) {
            if (keyPressed.indexOf(key) === -1) {
                keyPressed.push(key);
            }
            return;
        }
        var idx = keyPressed.indexOf(key);
        if (idx !== -1) {
            keyPressed.splice(idx, 1);
        }
    };

    var init = function (files) {
        var filesOp = FO.init(files, config);
        filesOp.fixFiles();

        var error = filesOp.error;

        var currentPath = module.currentPath = getLastOpenedFolder();
        var lastSelectTime;
        var selectedElement;

        var $tree = $iframe.find("#tree");
        var $content = $iframe.find("#content");
        var $contextMenu = $iframe.find("#contextMenu");
        var $contentContextMenu = $iframe.find("#contentContextMenu");
        var $trashTreeContextMenu = $iframe.find("#trashTreeContextMenu");
        var $trashContextMenu = $iframe.find("#trashContextMenu");
        var $folderIcon = $('<span>', {"class": "fa fa-folder folder", style:"color:#FEDE8B;text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;"});
        //var $folderEmptyIcon = $('<span>', {"class": "fa fa-folder folder", style:"color:pink"});
        var $folderEmptyIcon = $folderIcon.clone();
        var $folderOpenedIcon = $('<span>', {"class": "fa fa-folder-open folder", style:"color:#FEDE8B;text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;"});
        //var $folderOpenedEmptyIcon = $('<span>', {"class": "fa fa-folder-open-o folder"});
        var $folderOpenedEmptyIcon = $folderOpenedIcon.clone();
        var $fileIcon = $('<span>', {"class": "fa fa-file-text-o file"});
        var $upIcon = $('<span>', {"class": "fa fa-arrow-circle-up"});
        var $unsortedIcon = $('<span>', {"class": "fa fa-files-o"});
        var $trashIcon = $('<span>', {"class": "fa fa-trash"});
        var $trashEmptyIcon = $('<span>', {"class": "fa fa-trash-o"});
        var $collapseIcon = $('<span>', {"class": "fa fa-minus-square-o expcol"});
        var $expandIcon = $('<span>', {"class": "fa fa-plus-square-o expcol"});
        var $listIcon = $('<span>', {"class": "fa fa-list"});
        var $gridIcon = $('<span>', {"class": "fa fa-th"});

        var appStatus = {
            isReady: true,
            _onReady: [],
            onReady: function (handler) {
                if (isReady) {
                    handler();
                    return;
                }
                appStatus._onReady.push(handler);
            },
            ready: function (state) {
                appStatus.isReady = state;
                if (state) {
                    appStatus._onReady.forEach(function (h) {
                        h();
                    });
                }
            }
        };

        var isReady = false;


        var removeSelected =  function () {
            $iframe.find('.selected').removeClass("selected");
        };
        var removeInput =  function () {
            $iframe.find('li > span:hidden').show();
            $iframe.find('li > input').remove();
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

        var openFile = function (fileEl) {
            window.location.hash = fileEl;
        };

        var refresh = function () {
            module.displayDirectory(currentPath);
        };

        // Replace a file/folder name by an input to change its value
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
                    filesOp.renameElement(path, $input.val(), function () {
                        refresh();
                    });
                    removeInput();
                }
            });
            $element.parent().append($input);
            //$input.insertAfter($element);
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

        // Add the "selected" class to the "li" corresponding to the clicked element
        var onElementClick = function ($element, path) {
            // If "Ctrl" is pressed, do not remove the current selection
            if (keyPressed.indexOf(17) === -1) {
                removeSelected();
            }
            if (!$element.is('li')) {
                $element = $element.closest('li');
            }
            if (!$element.length) {
                log(Messages.fm_selectError);
                return;
            }
            if (!$element.hasClass("selected")) {
                $element.addClass("selected");
                lastSelectTime = now();
            } else {
                $element.removeClass("selected");
            }
        };

        // Open the selected context menu on the closest "li" element
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
                logError("Unable to locate the .element tag", e.target);
                $menu.hide();
                log(Messages.fm_contextMenuError);
                return;
            }
            $menu.find('a').data('path', path);
            $menu.find('a').data('element', $element);
            return false;
        };

        var openDirectoryContextMenu = function (e) {
            var $element = $(e.target).closest('li');
            $contextMenu.find('li').show();
            if ($element.hasClass('file-element')) {
                $contextMenu.find('a.newfolder').parent('li').hide();
            }
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

        var openContentContextMenu = function (e) {
            module.hideMenu();
            e.stopPropagation();
            var path = $(e.target).closest('#' + FOLDER_CONTENT_ID).data('path');
            if (!path) { return; }
            var $menu = $contentContextMenu;
            removeSelected();
            $menu.css({
                display: "block",
                left: e.pageX,
                top: e.pageY
            });
            $menu.find('a').data('path', path);
            return false;
        };

        // filesOp.moveElements is able to move several paths to a new location, including
        // the Trash or the "Unsorted files" folder
        var moveElements = function (paths, newPath, force, cb) {
            var andThen = function () {
                filesOp.moveElements(paths, newPath, cb);
            };
            if (newPath[0] !== TRASH || force) {
                andThen();
                return;
            }
            var msg = Messages._getKey('fm_removeSeveralDialog', [paths.length]);
            if (paths.length === 1) {
                var path = paths[0];
                var name = path[0] === UNSORTED ? filesOp.getTitle(filesOp.findElement(files, path)) : path[path.length - 1];
                msg = Messages._getKey('fm_removeDialog', [name]);
            }
            Cryptpad.confirm(msg, function () {
                andThen();
            });
        };
        // Drag & drop:
        // The data transferred is a stringified JSON containing the path of the dragged element
        var onDrag = function (ev, path) {
            var paths = [];
            var $element = $(ev.target).closest('li');
            if ($element.hasClass('selected')) {
                var $selected = $iframe.find('.selected');
                $selected.each(function (idx, elmt) {
                    if ($(elmt).data('path')) {
                        paths.push($(elmt).data('path'));
                    }
                });
            } else {
                removeSelected();
                $element.addClass('selected');
                paths = [path];
            }
            var data = {
                'path': paths
            };
            ev.dataTransfer.setData("text", JSON.stringify(data));
        };

        var onDrop = function (ev) {
            ev.preventDefault();
            $iframe.find('.droppable').removeClass('droppable');
            var data = ev.dataTransfer.getData("text");
            var oldPaths = JSON.parse(data).path;
            var newPath = $(ev.target).data('path') || $(ev.target).parent('li').data('path');
            if (!oldPaths || !oldPaths.length || !newPath) { return; }
            moveElements(oldPaths, newPath, null, refresh);
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

        // In list mode, display metadata from the filesData object
        var addFileData = function (element, key, $span, displayTitle) {
            if (!filesOp.isFile(element)) { return; }

            // The element with the class '.name' is underlined when the 'li' is hovered
            var $name = $('<span>', {'class': 'name', title: key}).text(key);
            $span.html('');
            $span.append($name);

            if (typeof(files[FILES_DATA][element]) === "undefined") {
                return;
            }
            var hrefData = Cryptpad.parsePadUrl(element);
            var data = files[FILES_DATA][element];
            var type = Messages.type[hrefData.type] || hrefData.type;
            var $title = $('<span>', {'class': 'title listElement', title: data.title}).text(data.title);
            var $type = $('<span>', {'class': 'date listElement', title: type}).text(type);
            var $adate = $('<span>', {'class': 'date listElement', title: getDate(data.atime)}).text(getDate(data.atime));
            var $cdate = $('<span>', {'class': 'date listElement', title: getDate(data.ctime)}).text(getDate(data.ctime));
            if (displayTitle) {
                $span.append($title);
            }
            $span.append($type).append($adate).append($cdate);
        };

        var addFolderData = function (element, key, $span) {
            if (!element || !filesOp.isFolder(element)) { return; }
            $span.html('');
            // The element with the class '.name' is underlined when the 'li' is hovered
            var sf = filesOp.hasSubfolder(element);
            var files = filesOp.hasFile(element);
            var $name = $('<span>', {'class': 'name', title: key}).text(key);
            var $subfolders = $('<span>', {'class': 'folders listElement', title: sf}).text(sf);
            var $files = $('<span>', {'class': 'files listElement', title: files}).text(files);
            $span.append($name).append($subfolders).append($files);
        };

        // Create the "li" element corresponding to the file/folder located in "path"
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

            var element = filesOp.findElement(files, newPath);
            var $icon = $fileIcon.clone();
            var spanClass = 'file-element element';
            var liClass = 'file-item';
            if (isFolder) {
                spanClass = 'folder-element element';
                liClass = 'folder-item';
                $icon = filesOp.isFolderEmpty(root[key]) ? $folderEmptyIcon.clone() : $folderIcon.clone();
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
            $element.addClass(liClass);
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
            var isNewFolder = module.newFolder && filesOp.comparePath(newPath, module.newFolder);
            if (isNewFolder) {
                appStatus.onReady(function () {
                    window.setTimeout(function () { displayRenameInput($name, newPath); }, 0);
                });
                delete module.newFolder;
            }
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

        // Create the title block with the "parent folder" button
        var createTitle = function (path) {
            var isTrash = path[0] === TRASH;
            // Create title and "Up" icon
            var name = path[path.length - 1];
            if (name === ROOT && path.length === 1) { name = ROOT_NAME; }
            else if (name === TRASH && path.length === 1) { name = TRASH_NAME; }
            else if (name === UNSORTED && path.length === 1) { name = UNSORTED_NAME; }
            else if (name === FILES_DATA && path.length === 1) { name = FILES_DATA_NAME; }
            else if (filesOp.isPathInTrash(path)) { name = getTrashTitle(path); }
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

        // Create the button allowing the user to switch from list to icons modes
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
            }).text(Messages.fm_newFolderButton);

            $listButton.click(function () {
                var onCreated = function (info) {
                    module.newFolder = info.newPath;
                    refresh();
                };
                filesOp.createNewFolder(currentPath, null, onCreated);
            });

            $block.append($listButton);
            return $block;
        };

        var getFolderListHeader = function () {
            var $folderHeader = $('<li>', {'class': 'header listElement'});
            var $fohElement = $('<span>', {'class': 'element'}).appendTo($folderHeader);
            var $name = $('<span>', {'class': 'name'}).text(Messages.fm_folderName);
            var $subfolders = $('<span>', {'class': 'folders listElement'}).text(Messages.fm_numberOfFolders);
            var $files = $('<span>', {'class': 'files listElement'}).text(Messages.fm_numberOfFiles);
            $fohElement.append($name).append($subfolders).append($files);
            return $folderHeader;
        };
        var getFileListHeader = function (displayTitle) {
            var $fileHeader = $('<li>', {'class': 'file-header header listElement'});
            var $fihElement = $('<span>', {'class': 'element'}).appendTo($fileHeader);
            var $fhName = $('<span>', {'class': 'name'}).text(Messages.fm_fileName);
            var $fhTitle = displayTitle ? $('<span>', {'class': 'title '}).text(Messages.fm_title) : '';
            var $fhType = $('<span>', {'class': 'date'}).text(Messages.table_type);
            var $fhAdate = $('<span>', {'class': 'date'}).text(Messages.fm_lastAccess);
            var $fhCdate = $('<span>', {'class': 'date'}).text(Messages.fm_creation);
            $fihElement.append($fhName).append($fhTitle).append($fhType).append($fhAdate).append($fhCdate);
            return $fileHeader;
        };

        var allFilesSorted = function () {
            return filesOp.getUnsortedFiles().length === 0;
        };

        // Unsorted element are represented by "href" in an array: they don't have a filename
        // and they don't hav a hierarchical structure (folder/subfolders)
        var displayUnsorted = function ($container, $fileHeader) {
            var unsorted = files[UNSORTED];
            if (allFilesSorted()) { return; }
            $container.append($fileHeader);
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
                $container.append($element);
            });
        };

        var displayTrashRoot = function ($list, $folderHeader, $fileHeader) {
            // Elements in the trash are JS arrays (several elements can have the same name)
            [true,false].forEach(function (folder) {
                var testElement = filesOp.isFile;
                if (!folder) {
                    testElement = filesOp.isFolder;
                }
                var root = files[TRASH];
                if (folder) {
                    if (filesOp.hasSubfolder(root, true)) { $list.append($folderHeader); }
                    else { return; }
                } else {
                    if (filesOp.hasFile(root, true)) { $list.append($fileHeader); }
                    else { return; }
                }
                Object.keys(root).forEach(function (key) {
                    if (!$.isArray(root[key])) {
                        logError("Trash element has a wrong type", root[key]);
                        return;
                    }
                    root[key].forEach(function (el, idx) {
                        if (testElement(el.element)) { return; }
                        var spath = [key, idx, 'element'];
                        var $element = createElement([TRASH], spath, root, folder);
                        $list.append($element);
                    });
                });
            });

        };

        // Display the selected directory into the content part (rightside)
        // NOTE: Elements in the trash are not using the same storage structure as the others
        var displayDirectory = module.displayDirectory = function (path) {
            appStatus.ready(false);
            currentPath = path;
            $content.html("");
            if (!path || path.length === 0) {
                path = [ROOT];
            }
            var isTrashRoot = filesOp.comparePath(path, [TRASH]);
            var isUnsorted = filesOp.comparePath(path, [UNSORTED]);

            var root = filesOp.findElement(files, path);
            if (typeof(root) === "undefined") {
                log(Messages.fm_unknownFolderError);
                debug("Unable to locate the selected directory: ", path);
                var parentPath = path.slice();
                parentPath.pop();
                displayDirectory(parentPath);
                return;
            }

            module.resetTree();

            setLastOpenedFolder(path);

            var $title = createTitle(path);

            var $dirContent = $('<div>', {id: FOLDER_CONTENT_ID});
            $dirContent.data('path', path);
            $dirContent.contextmenu(openContentContextMenu);
            var mode = getViewMode();
            if (mode) {
                $dirContent.addClass(getViewModeClass());
            }
            var $list = $('<ul>').appendTo($dirContent);

            /*if (isUnsorted) {
                displayUnsorted($list);
                $content.append($title).append($dirContent);
                return;
            }*/

            var $modeButton = createViewModeButton().appendTo($title);

            var $folderHeader = getFolderListHeader();
            var $fileHeader = getFileListHeader(true);

            if (isUnsorted) {
                displayUnsorted($list, $fileHeader);
            } else if (isTrashRoot) {
                displayTrashRoot($list, $folderHeader, $fileHeader);
            } else {
                var $newFolderButton = createNewFolderButton().appendTo($title);
                if (filesOp.hasSubfolder(root)) { $list.append($folderHeader); }
                // display sub directories
                Object.keys(root).forEach(function (key) {
                    if (filesOp.isFile(root[key])) { return; }
                    var $element = createElement(path, key, root, true);
                    $element.appendTo($list);
                });
                if (filesOp.hasFile(root)) { $list.append($fileHeader); }
                // display files
                Object.keys(root).forEach(function (key) {
                    if (filesOp.isFolder(root[key])) { return; }
                    var $element = createElement(path, key, root, false);
                    $element.appendTo($list);
                });
            }
            $content.append($title).append($dirContent);
            appStatus.ready(true);
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
                        if (filesOp.isSubpath(currentPath, path)) {
                            displayDirectory(path);
                        }
                    }
                });
                if (wasFolderOpened(path) ||
                        (filesOp.isSubpath(currentPath, path) && path.length < currentPath.length)) {
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
            var root = filesOp.findElement(files, path);

            // Display the root element in the tree
            var displayingRoot = filesOp.comparePath([ROOT], path);
            if (displayingRoot) {
                var isRootOpened = filesOp.comparePath([ROOT], currentPath);
                var $rootIcon = filesOp.isFolderEmpty(files[ROOT]) ?
                    (isRootOpened ? $folderOpenedEmptyIcon : $folderEmptyIcon) :
                    (isRootOpened ? $folderOpenedIcon : $folderIcon);
                var $rootElement = createTreeElement(ROOT_NAME, $rootIcon.clone(), [ROOT], false, false, isRootOpened);
                $rootElement.addClass('root');
                var $root = $('<ul>').append($rootElement).appendTo($container);
                $container = $rootElement;
            } else if (filesOp.isFolderEmpty(root)) { return; }

            // Display root content
            var $list = $('<ul>').appendTo($container);
            Object.keys(root).forEach(function (key) {
                // Do not display files in the menu
                if (filesOp.isFile(root[key])) { return; }
                var newPath = path.slice();
                newPath.push(key);
                var isCurrentFolder = filesOp.comparePath(newPath, currentPath);
                var isEmpty = filesOp.isFolderEmpty(root[key]);
                var subfolder = filesOp.hasSubfolder(root[key]);
                var $icon = isEmpty ?
                    (isCurrentFolder ? $folderOpenedEmptyIcon : $folderEmptyIcon) :
                    (isCurrentFolder ? $folderOpenedIcon : $folderIcon);
                var $element = createTreeElement(key, $icon.clone(), newPath, true, subfolder, isCurrentFolder);
                $element.appendTo($list);
                $element.contextmenu(openDirectoryContextMenu);
                createTree($element, newPath);
            });
        };

        var createUnsorted = function ($container, path) {
            var $icon = $unsortedIcon.clone();
            var isOpened = filesOp.comparePath(path, currentPath);
            var $unsortedElement = createTreeElement(UNSORTED_NAME, $icon, [UNSORTED], false, false, isOpened);
            $unsortedElement.addClass('root');
            var $unsortedList = $('<ul>', { id: 'unsortedTree' }).append($unsortedElement);
            $container.append($unsortedList);
        };

        var createTrash = function ($container, path) {
            var $icon = filesOp.isFolderEmpty(files[TRASH]) ? $trashEmptyIcon.clone() : $trashIcon.clone();
            var isOpened = filesOp.comparePath(path, currentPath);
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
            $contentContextMenu.hide();
        };

        $contextMenu.on("click", "a", function(e) {
            e.stopPropagation();
            var path = $(this).data('path');
            var $element = $(this).data('element');
            if (!$element || !path || path.length < 2) {
                log(Messages.fm_forbidden);
                debug("Directory context menu on a forbidden or unexisting element. ", $element, path);
                return;
            }
            if ($(this).hasClass("rename")) {
                displayRenameInput($element, path);
            }
            else if($(this).hasClass("delete")) {
                moveElements([path], [TRASH], false, refresh);
            }
            else if ($(this).hasClass('open')) {
                $element.dblclick();
            }
            else if ($(this).hasClass('newfolder')) {
                var onCreated = function (info) {
                    module.newFolder = info.newPath;
                    module.displayDirectory(path);;
                };
                filesOp.createNewFolder(path, null, onCreated);
            }
            module.hideMenu();
        });

        $contentContextMenu.on('click', 'a', function (e) {
            e.stopPropagation();
            var path = $(this).data('path');
            if ($(this).hasClass("newfolder")) {
                var onCreated = function (info) {
                    module.newFolder = info.newPath;
                    refresh();
                };
                filesOp.createNewFolder(path, null, onCreated);
            }
            module.hideMenu();
        });

        $trashTreeContextMenu.on('click', 'a', function (e) {
            e.stopPropagation();
            var path = $(this).data('path');
            var $element = $(this).data('element');
            if (!$element || !filesOp.comparePath(path, [TRASH])) {
                log(Messages.fm_forbidden);
                debug("Trash tree context menu on a forbidden or unexisting element. ", $element, path);
                return;
            }
            if ($(this).hasClass("empty")) {
                Cryptpad.confirm(Messages.fm_emptyTrashDialog, function(res) {
                    if (!res) { return; }
                    filesOp.emptyTrash(refresh);
                });
            }
            module.hideMenu();
        });

        $trashContextMenu.on('click', 'a', function (e) {
            e.stopPropagation();
            var path = $(this).data('path');
            var $element = $(this).data('element');
            if (!$element || !path || path.length < 2) {
                log(Messages.fm_forbidden);
                debug("Trash context menu on a forbidden or unexisting element. ", $element, path);
                return;
            }
            var name = path[path.length - 1];
            if ($(this).hasClass("remove")) {
                if (path.length === 4) { name = path[1]; }
                Cryptpad.confirm(Messages._getKey("fm_removePermanentlyDialog", [name]), function(res) {
                    if (!res) { return; }
                    filesOp.removeFromTrash(path, refresh);
                });
            }
            else if ($(this).hasClass("restore")) {
                if (path.length === 4) { name = path[1]; }
                Cryptpad.confirm(Messages._getKey("fm_restoreDialog", [name]), function(res) {
                    if (!res) { return; }
                    filesOp.restoreTrash(path, refresh);
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
        $(ifrw).on('keydown', function (e) {
            pressKey(e.which, true);
        });
        $(ifrw).on('keyup', function (e) {
            pressKey(e.which, false);
        });
        $(ifrw).on('keydown', function (e) {
            if (e.which === 46) {
                var $selected = $iframe.find('.selected');
                if (!$selected.length) { return; }
                var paths = [];
                $selected.each(function (idx, elmt) {
                    if (!$(elmt).data('path')) { return; }
                    paths.push($(elmt).data('path'));
                });
                // If we are in the trash or if we are holding the "shift" key, delete permanently,
                // else move to trash
                if (filesOp.isPathInTrash(currentPath) || e.shiftKey) {
                    var todo = filesOp.removeFromTrash;
                    if (!filesOp.isPathInTrash(currentPath)) {
                        // If we are not in the trash, we just have to remove the key from root/unsorted
                        todo = filesOp.deletePathPermanently;
                    }
                    // If we are already in the trash, delete the elements permanently
                    var msg = Messages._getKey("fm_removeSeveralPermanentlyDialog", [paths.length]);
                    if (paths.length === 1) {
                        var path = paths[0];
                        var name = filesOp.isInTrashRoot(path) ? path[1] : path[path.length - 1];
                        msg = Messages._getKey("fm_removePermanentlyDialog", [name]);
                    }
                    Cryptpad.confirm(msg, function(res) {
                        paths.forEach(function(p) {
                            todo(p);
                        });
                        refresh();
                    });
                    return;
                }
                moveElements(paths, [TRASH], false, refresh);
            }
        });
    };

    /*
    initLSOpened();
    init(filesObject);
    */



    var listmapConfig = module.config = {
        data: {},
        websocketURL: Cryptpad.getWebsocketURL(),
        channel: secret.channel,
        readOnly: false,
        validateKey: secret.keys.validateKey || undefined,
        crypto: Crypto.createEncryptor(secret.keys),
    };

    // don't initialize until the store is ready.
    Cryptpad.ready(function () {
        var rt = window.rt = module.rt = Listmap.create(listmapConfig);
        rt.proxy.on('create', function (info) {
            var realtime = module.realtime = info.realtime;

            var editHash = Cryptpad.getEditHashFromKeys(info.channel, secret.keys);
            window.location.hash = editHash;
            //Cryptpad.setAttribute("FS_hash", editHash, cb, store);
            localStorage.FS_hash = editHash;

            module.patchText = TextPatcher.create({
                realtime: realtime,
                logging: true,
            });
            /*Cryptpad.getPadTitle(function (err, title) {
                title = document.title = title || info.channel.slice(0, 8);

                Cryptpad.setPadTitle(title, function (err, data) {
                    if (err) {
                        console.log("unable to remember pad");
                        console.log(err);
                        return;
                    }
                });
            });*/
        }).on('ready', function () {
            if (JSON.stringify(rt.proxy) === '{}') {
                var store = Cryptpad.getStore();
                store.get(Cryptpad.storageKey, function (err, s) {
                    rt.proxy.filesData = s;
                    initLSOpened();
                    init(rt.proxy);
                });
                return;
            }
            initLSOpened();
            init(rt.proxy);
        })
        .on('disconnect', function () {
            //setEditable(false);
            Cryptpad.alert(Messages.common_connectionLost);
        });
    });


});
