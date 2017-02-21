require.config({ paths: { 'json.sortify': '/bower_components/json.sortify/dist/JSON.sortify' } });
define([
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/textpatcher/TextPatcher.amd.js',
    'json.sortify',
    '/common/cryptpad-common.js',
    '/common/fileObject.js',
    '/common/toolbar.js',
    '/customize/application_config.js',
    '/common/cryptget.js'
], function (Listmap, Crypto, TextPatcher, JSONSortify, Cryptpad, FO, Toolbar, AppConfig, Get) {
    var module = window.MODULE = {};

    var Messages = Cryptpad.Messages;
    var $ = window.jQuery;
    var saveAs = window.saveAs;

    // Use `$(function () {});` to make sure the html is loaded before doing anything else
    $(function () {

    var $iframe = $('#pad-iframe').contents();
    var ifrw = $('#pad-iframe')[0].contentWindow;

    Cryptpad.addLoadingScreen();
    var onConnectError = function (info) {
        Cryptpad.errorLoadingScreen(Messages.websocketError);
    };

    var APP = window.APP = {
        editable: false,
        Cryptpad: Cryptpad,
        loggedIn: Cryptpad.isLoggedIn(),
        mobile: function () { return $('body').width() <= 600; } // Menu and content area are not inline-block anymore for mobiles
    };

    var stringify = APP.stringify = function (obj) {
        return JSONSortify(obj);
    };

    var ROOT = "root";
    var ROOT_NAME = Messages.fm_rootName;
    var UNSORTED = "unsorted";
    var UNSORTED_NAME = Messages.fm_unsortedName;
    var FILES_DATA = Cryptpad.storageKey;
    var FILES_DATA_NAME = Messages.fm_filesDataName;
    var TEMPLATE = "template";
    var TEMPLATE_NAME = Messages.fm_templateName;
    var TRASH = "trash";
    var TRASH_NAME = Messages.fm_trashName;

    var LOCALSTORAGE_LAST = "cryptpad-file-lastOpened";
    var LOCALSTORAGE_OPENED = "cryptpad-file-openedFolders";
    var LOCALSTORAGE_VIEWMODE = "cryptpad-file-viewMode";
    var FOLDER_CONTENT_ID = "folderContent";

    var config = {};
    var DEBUG = config.DEBUG = true;
    var debug = config.debug = DEBUG ? function () {
        console.log.apply(console, arguments);
    } : function () { return; };
    var logError = config.logError = function () {
        console.error.apply(console, arguments);
    };
    var log = config.log = Cryptpad.log;

    var getLastOpenedFolder = function () {
        var path;
        try {
            path = localStorage[LOCALSTORAGE_LAST] ? JSON.parse(localStorage[LOCALSTORAGE_LAST]) : [UNSORTED];
        } catch (e) {
            path = [UNSORTED];
        }
        return path;
    };
    var setLastOpenedFolder = function (path) {
        localStorage[LOCALSTORAGE_LAST] = JSON.stringify(path);
    };

    var initLocalStorage = function () {
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

    var setEditable = function (state) {
        APP.editable = state;
        if (!state) {
            $iframe.find('#content').addClass('readonly');
            $iframe.find('[draggable="true"]').attr('draggable', false);
        }
        else {
            $iframe.find('#content').removeClass('readonly');
            $iframe.find('[draggable="false"]').attr('draggable', true);
        }
    };

    // Icons
    var $folderIcon = $('<span>', {"class": "fa fa-folder folder icon"});
    var $folderEmptyIcon = $folderIcon.clone();
    var $folderOpenedIcon = $('<span>', {"class": "fa fa-folder-open folder"});
    var $folderOpenedEmptyIcon = $folderOpenedIcon.clone();
    var $fileIcon = $('<span>', {"class": "fa fa-file-text-o file icon"});
    var $padIcon = $('<span>', {"class": "fa fa-file-word-o file icon"});
    var $codeIcon = $('<span>', {"class": "fa fa-file-code-o file icon"});
    var $slideIcon = $('<span>', {"class": "fa fa-file-powerpoint-o file icon"});
    var $pollIcon = $('<span>', {"class": "fa fa-calendar file icon"});
    var $upIcon = $('<span>', {"class": "fa fa-arrow-circle-up"});
    var $unsortedIcon = $('<span>', {"class": "fa fa-files-o"});
    var $templateIcon = $('<span>', {"class": "fa fa-cubes"});
    var $trashIcon = $('<span>', {"class": "fa fa-trash"});
    var $trashEmptyIcon = $('<span>', {"class": "fa fa-trash-o"});
    var $collapseIcon = $('<span>', {"class": "fa fa-minus-square-o expcol"});
    var $expandIcon = $('<span>', {"class": "fa fa-plus-square-o expcol"});
    var $listIcon = $('<span>', {"class": "fa fa-list"});
    var $gridIcon = $('<span>', {"class": "fa fa-th"});
    var $sortAscIcon = $('<span>', {"class": "fa fa-angle-up sortasc"});
    var $sortDescIcon = $('<span>', {"class": "fa fa-angle-down sortdesc"});
    var $closeIcon = $('<span>', {"class": "fa fa-window-close"});
    var $backupIcon = $('<span>', {"class": "fa fa-life-ring"});

    var init = function (proxy) {
        var files = proxy.drive;
        var isOwnDrive = function () {
            return Cryptpad.getUserHash() === APP.hash || localStorage.FS_hash === APP.hash;
        };
        var isWorkgroup = function () {
            return files.workgroup === 1;
        };
        config.workgroup = isWorkgroup();
        config.Cryptpad = Cryptpad;

        var filesOp = FO.init(files, config);
        filesOp.fixFiles();

        var error = filesOp.error;

        var $tree = $iframe.find("#tree");
        var $content = $iframe.find("#content");
        var $driveToolbar = $iframe.find("#driveToolbar");
        var $contextMenu = $iframe.find("#treeContextMenu");
        var $contentContextMenu = $iframe.find("#contentContextMenu");
        var $defaultContextMenu = $iframe.find("#defaultContextMenu");
        var $trashTreeContextMenu = $iframe.find("#trashTreeContextMenu");
        var $trashContextMenu = $iframe.find("#trashContextMenu");

        // TOOLBAR

        /* add a "change username" button */
        if (!APP.readOnly) {
            Cryptpad.getLastName(function (err, lastName) {
                APP.$displayName.text(lastName || Messages.anonymous);
            });
        } else {
            APP.$displayName.html('<span class="' + Toolbar.constants.readonly + '">' + Messages.readonly + '</span>');
        }

        // FILE MANAGER
        // _WORKGROUP_ and other people drive : display Documents as main page
        var currentPath = module.currentPath = isOwnDrive() ? getLastOpenedFolder() : [ROOT];
        var lastSelectTime;
        var selectedElement;

        if (!APP.readOnly) {
            setEditable(true);
        }

        var appStatus = {
            isReady: true,
            _onReady: [],
            onReady: function (handler) {
                if (appStatus.isReady) {
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
                    appStatus._onReady = [];
                }
            }
        };

        var removeSelected =  function () {
            $iframe.find('.selected').removeClass("selected");
        };
        var removeInput =  function () {
            $iframe.find('li > span:hidden').removeAttr('style');
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
            window.open(fileEl);
        };

        var refresh = APP.refresh = function () {
            module.displayDirectory(currentPath);
        };

        // Replace a file/folder name by an input to change its value
        var displayRenameInput = function ($element, path) {
            if (!APP.editable) { return; }
            if (!path || path.length < 2) {
                logError("Renaming a top level element (root, trash or filesData) is forbidden.");
                return;
            }
            removeInput();
            removeSelected();
            var $name = $element.find('.name');
            if (!$name.length) {
                $name = $element.find('.element');
            }
            $name.hide();
            var name = path[path.length - 1];
            var $input = $('<input>', {
                placeholder: name,
                value: name
            });
            $input.on('keyup', function (e) {
                if (e.which === 13) {
                    removeInput();
                    filesOp.renameElement(path, $input.val(), function () {
                        refresh();
                    });
                }
            });
            //$element.parent().append($input);
            $name.after($input);
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
            $input.on('mousedown', function (e) {
                e.stopPropagation();
                $input.parents('li').attr("draggable", false);
            });
            $input.on('mouseup', function (e) {
                e.stopPropagation();
                $input.parents('li').attr("draggable", true);
            });
        };

        var updateContextButton = function () {
            var $li = $content.find('.selected');
            if ($li.length !== 1) {
                $li = $tree.find('.element.active').closest('li');
            }
            var $button = $driveToolbar.find('#contextButton');
            if ($li.length !== 1
                || !$._data($li[0], 'events').contextmenu
                || $._data($li[0], 'events').contextmenu.length === 0) {
                $button.hide();
                return;
            }
            $button.show();
            $button.css({
                background: '#000'
            });
            window.setTimeout(function () {
                $button.css({
                    background: ''
                });
            }, 500);
        };

        // Add the "selected" class to the "li" corresponding to the clicked element
        var onElementClick = function (e, $element, path) {
            // If "Ctrl" is pressed, do not remove the current selection
            removeInput();
            if (!e || !e.ctrlKey) {
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
            updateContextButton();
        };

        // Open the selected context menu on the closest "li" element
        var openContextMenu = function (e, $menu) {
            module.hideMenu();
            e.stopPropagation();

            var path = $(e.target).closest('li').data('path');
            if (!path) { return false; }

            if (!APP.editable) {
                $menu.find('a.editable').parent('li').hide();
            }
            if (!isOwnDrive()) {
                $menu.find('a.own').parent('li').hide();
            }

            $menu.css({
                display: "block",
                left: e.pageX,
                top: e.pageY
            });

            if ($menu.find('li:visible').length === 0) {
                debug("No visible element in the context menu. Abort.");
                $menu.hide();
                return true;
            }

            // $element should be the <li class="element">
            var $element = $(e.target).closest('li');
            onElementClick(undefined, $element);
            if (!$element.length) {
                logError("Unable to locate the .element tag", e.target);
                $menu.hide();
                log(Messages.fm_contextMenuError);
                return false;
            }
            $menu.find('a').data('path', path);
            $menu.find('a').data('element', $element);
            return false;
        };

        var openDirectoryContextMenu = function (e) {
            var $element = $(e.target).closest('li');
            $contextMenu.find('li').show();
            if ($element.is('.file-element')) {
                $contextMenu.find('a.newfolder').parent('li').hide();
            } else {
                $contextMenu.find('a.open_ro').parent('li').hide();
            }
            openContextMenu(e, $contextMenu);
            return false;
        };

        var openDefaultContextMenu = function (e) {
            var $element = $(e.target).closest('li');
            $defaultContextMenu.find('li').show();
            if ($element.is('.file-element')) {
                $defaultContextMenu.find('a.newfolder').parent('li').hide();
            } else {
                $defaultContextMenu.find('a.open_ro').parent('li').hide();
            }
            openContextMenu(e, $defaultContextMenu);
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
                $trashContextMenu.find('a.properties').parent('li').hide();
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

            if (!APP.editable) {
                $menu.find('a.editable').parent('li').hide();
            }
            if (!isOwnDrive()) {
                $menu.find('a.own').parent('li').hide();
            }

            $menu.find('[data-type]').each(function (idx, el) {
                if (AppConfig.availablePadTypes.indexOf($(el).attr('data-type')) === -1) {
                    $(el).hide();
                }
            });

            $menu.css({
                display: "block",
                left: e.pageX,
                top: e.pageY
            });

            if ($menu.find('li:visible').length === 0) {
                debug("No visible element in the context menu. Abort.");
                $menu.hide();
                return true;
            }

            $menu.find('a').data('path', path);
            return false;
        };

        var getElementName = function (path) {
            // Trash root
            if (filesOp.isInTrashRoot(path)) {
                return path[0];
            }
            // Root or trash
            if (filesOp.isPathInRoot(path) || filesOp.isPathInTrash(path)) {
                return path[path.length - 1];
            }
            // Unsorted or template
            if (filesOp.isPathInUnsorted(path) || filesOp.isPathInTemplate(path)) {
                var file = filesOp.findElement(files, path);
                if (filesOp.isFile(file) && filesOp.getTitle(file)) {
                    return filesOp.getTitle(file);
                }
            }
            // default
            return "???";
        };
        // filesOp.moveElements is able to move several paths to a new location, including
        // the Trash or the "Unsorted files" folder
        var moveElements = function (paths, newPath, force, cb) {
            if (!APP.editable) { return; }
            var andThen = function () {
                filesOp.moveElements(paths, newPath, cb);
            };
            // "force" is currently unused but may be configurable by user
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
            Cryptpad.confirm(msg, function (res) {
                if (!res) { return; }
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
                    var ePath = $(elmt).data('path');
                    if (ePath) {
                        var val = filesOp.findElement(files, ePath);
                        if (!val) { return; } // Error? A ".selected" element in not in the object
                        paths.push({
                            path: ePath,
                            value: {
                                name: getElementName(ePath),
                                el: val
                            }
                        });
                    }
                });
            } else {
                removeSelected();
                $element.addClass('selected');
                var val = filesOp.findElement(files, path);
                if (!val) { return; } // The element in not in the object
                paths = [{
                    path: path,
                    value: {
                        name: getElementName(path),
                        el: val
                    }
                }];
            }
            var data = {
                'path': paths
            };
            ev.dataTransfer.setData("text", stringify(data));
        };

        var onDrop = function (ev) {
            ev.preventDefault();
            $iframe.find('.droppable').removeClass('droppable');
            var data = ev.dataTransfer.getData("text");
            var oldPaths = JSON.parse(data).path;
            if (!oldPaths) { return; }

            // Dropped elements can be moved from the same file manager or imported from another one.
            // A moved element should be removed from its previous location
            var movedPaths = [];
            var importedElements = [];
            oldPaths.forEach(function (p) {
                var el = filesOp.findElement(files, p.path);
                if (el && (stringify(el) === stringify(p.value.el) || !p.value || !p.value.el)) {
                    movedPaths.push(p.path);
                } else {
                    importedElements.push(p.value);
                }
            });

            var newPath = $(ev.target).data('path') || $(ev.target).parent('li').data('path');
            if (!newPath) { return; }
            if (movedPaths && movedPaths.length) {
                moveElements(movedPaths, newPath, null, refresh);
            }
            if (importedElements && importedElements.length) {
                filesOp.importElements(importedElements, newPath, refresh);
            }
        };

        var addDragAndDropHandlers = function ($element, path, isFolder, droppable) {
            if (!APP.editable) { return; }
            // "dragenter" is fired for an element and all its children
            // "dragleave" may be fired when entering a child
            // --> we use pointer-events: none in CSS, but we still need a counter to avoid some issues
            // --> We store the number of enter/leave and the element entered and we remove the
            // highlighting only when we have left everything
            var counter = 0;
            $element.on('dragstart', function (e) {
                e.stopPropagation();
                counter = 0;
                onDrag(e.originalEvent, path);
            });

            $element.on('mousedown', function (e) {
                e.stopPropagation();
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
                counter++;
                $element.addClass('droppable');
            });
            $element.on('dragleave', function (e) {
                e.preventDefault();
                e.stopPropagation();
                counter--;
                if (counter <= 0) {
                    counter = 0;
                    $element.removeClass('droppable');
                }
            });
        };

        // In list mode, display metadata from the filesData object
        // _WORKGROUP_ : Do not display title, atime and ctime columns since we don't have files data
        var addFileData = function (element, key, $span, displayTitle) {
            if (!filesOp.isFile(element)) { return; }

            // The element with the class '.name' is underlined when the 'li' is hovered
            var $name = $('<span>', {'class': 'name', title: key}).text(key);
            $span.html('');
            $span.append($name);

            if (!filesOp.getFileData(element)) {
                return;
            }
            var hrefData = Cryptpad.parsePadUrl(element);
            var data = filesOp.getFileData(element);
            var type = Messages.type[hrefData.type] || hrefData.type;
            var $title = $('<span>', {'class': 'title listElement', title: data.title}).text(data.title);
            var $type = $('<span>', {'class': 'type listElement', title: type}).text(type);
            var $adate = $('<span>', {'class': 'atime listElement', title: getDate(data.atime)}).text(getDate(data.atime));
            var $cdate = $('<span>', {'class': 'ctime listElement', title: getDate(data.ctime)}).text(getDate(data.ctime));
            if (displayTitle && !isWorkgroup()) {
                $span.append($title);
            }
            $span.append($type);
            if (!isWorkgroup()) {
                $span.append($adate).append($cdate);
            }
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

        var getFileIcon = function (href) {
            var $icon = $fileIcon.clone();

            if (href.indexOf('/pad/') !== -1) { $icon = $padIcon.clone(); }
            else if (href.indexOf('/code/') !== -1) { $icon = $codeIcon.clone(); }
            else if (href.indexOf('/slide/') !== -1) { $icon = $slideIcon.clone(); }
            else if (href.indexOf('/poll/') !== -1) { $icon = $pollIcon.clone(); }

            return $icon;
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
            var $icon = !isFolder ? getFileIcon(element) : undefined;
            var liClass = 'file-item file-element element';
            if (isFolder) {
                liClass = 'folder-item folder-element element';
                $icon = filesOp.isFolderEmpty(root[key]) ? $folderEmptyIcon.clone() : $folderIcon.clone();
            }
            var $element = $('<li>', {
                draggable: true
            });
            if (isFolder) {
                addFolderData(element, key, $element);
            } else {
                addFileData(element, key, $element, true);
            }
            $element.prepend($icon).dblclick(function () {
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
                onElementClick(e, $element, newPath);
            });
            if (!isTrash) {
                $element.contextmenu(openDirectoryContextMenu);
            } else {
                $element.contextmenu(openTrashContextMenu);
            }
            var isNewFolder = module.newFolder && filesOp.comparePath(newPath, module.newFolder);
            if (isNewFolder) {
                appStatus.onReady(function () {
                    window.setTimeout(function () { displayRenameInput($element, newPath); }, 0);
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

        var getPrettyName = function (name) {
            var pName;
            switch (name) {
                case ROOT: pName = ROOT_NAME; break;
                case TRASH: pName = TRASH_NAME; break;
                case UNSORTED: pName = UNSORTED_NAME; break;
                case TEMPLATE: pName = TEMPLATE_NAME; break;
                case FILES_DATA: pName = FILES_DATA_NAME; break;
                default: pName = name;
            }
            return pName;
        };

        // Create the title block with the "parent folder" button
        var createTitle = function (path) {
            if (!path || path.length === 0) { return; }
            var isTrash = filesOp.isPathInTrash(path);
            var $title = $('<span>', {'class': 'path unselectable'});
            if (APP.mobile()) {
                return $title;
            }
            path.forEach(function (p, idx) {
                if (isTrash && [1,2].indexOf(idx) !== -1) { return; }

                var $span = $('<span>', {'class': 'element'});
                if (idx < path.length - 1) {
                    $span.addClass('clickable');
                    $span.click(function (e) {
                        module.displayDirectory(path.slice(0, idx + 1));
                    });
                }

                var name = p;
                if (idx === 0) { name = getPrettyName(p); }
                else { $title.append(' > '); }

                $span.text(name).appendTo($title);
            });
            return $title;
        };

        var createInfoBox = function (path) {
            var $box = $('<div>', {'class': 'info-box'});
            var msg;
            switch (path[0]) {
                case ROOT:
                    msg = Messages.fm_info_root;
                    break;
                case UNSORTED:
                    msg = Messages.fm_info_unsorted;
                    break;
                case TEMPLATE:
                    msg = Messages.fm_info_template;
                    break;
                case TRASH:
                    msg = Messages.fm_info_trash;
                    break;
                case FILES_DATA:
                    msg = Messages.fm_info_allFiles;
                    break;
                default:
                    msg = undefined;
            }
            if (!msg || Cryptpad.getLSAttribute('hide-info-' + path[0]) === '1') {
                $box.hide();
            } else {
                $box.text(msg);
                var $close = $closeIcon.clone().css({
                    'cursor': 'pointer',
                    'margin-left': '10px',
                    title: Messages.fm_closeInfoBox
                }).on('click', function () {
                    $box.hide();
                    Cryptpad.setLSAttribute('hide-info-' + path[0], '1');
                });
                $box.prepend($close);
            }
            return $box;
        };

        // Create the button allowing the user to switch from list to icons modes
        var createViewModeButton = function () {
            var $block = $('<div>', {
                'class': 'dropdown-bar right changeViewModeContainer'
            });

            var $listButton = $('<button>', {
                'class': 'element'
            }).append($listIcon.clone());
            var $gridButton = $('<button>', {
                'class': 'element'
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

        var createPadFromRootHandler = function (e) {
            var type = $(this).data('type');
            if (!type) {
                throw new Error("Unable to get the pad type...");
            }
            var onNamed = function (name) {
                if (!name) { return; }
                // TODO
                var path = '/#?name=' + encodeURIComponent(name) + '&path=' + encodeURIComponent(currentPath);
                sessionStorage[Cryptpad.newPadNameKey] = name;
                sessionStorage[Cryptpad.newPadPathKey] = currentPath;
                window.open('/' + type + '/');
            };
            Cryptpad.prompt(Messages.fm_nameFile, Cryptpad.getDefaultName({type: type}), onNamed);
        };
        var createNewButton = function (isInRoot) {
            if (!APP.editable) { return; }


            // Create dropdown
            var options = [];
            if (isInRoot) {
                options.push({
                    tag: 'a',
                    attributes: {'class': 'newFolder'},
                    content: Messages.fm_folder
                });
                options.push({tag: 'hr'});
            }
            AppConfig.availablePadTypes.forEach(function (type) {
                if (type === 'drive') { return; }
                var path = filesOp.isPathInTrash(currentPath) ? '' : '/#?path=' + encodeURIComponent(currentPath);
                var attributes = {
                    'class': 'newdoc',
                    'data-type': type
                };
                // In root, do not redirect instantly, but ask for a name first. Cf handlers below
                if (!isInRoot) {
                    attributes.href = '/' + type + path;
                    attributes.target = '_blank';
                }
                options.push({
                    tag: 'a',
                    attributes: attributes,
                    content: Messages.type[type]
                });
            });
            var dropdownConfig = {
                text: Messages.fm_newButton,
                options: options
            };
            var $block = Cryptpad.createDropdown(dropdownConfig);

            // Custom style:
            $block.find('button').addClass('btn').addClass('btn-primary').addClass('new');

            // Handlers
            if (isInRoot) {
                $block.find('a.newFolder').click(function () {
                    var onCreated = function (info) {
                        module.newFolder = info.newPath;
                        refresh();
                    };
                    filesOp.createNewFolder(currentPath, null, onCreated);
                });
                $block.find('a.newdoc').click(createPadFromRootHandler);
            }

            return $block;
        };

        var hideNewButton = function () {
            $iframe.find('.dropdown-bar-content').hide();
        };

        var SORT_FOLDER_DESC = 'sortFoldersDesc';
        var SORT_FILE_BY = 'sortFilesBy';
        var SORT_FILE_DESC = 'sortFilesDesc';

        var getSortFileDesc = function () {
            return Cryptpad.getLSAttribute(SORT_FILE_DESC) === "true";
        };
        var getSortFolderDesc = function () {
            return Cryptpad.getLSAttribute(SORT_FOLDER_DESC) === "true";
        };

        var onSortByClick = function (e) {
            var $span = $(this);
            var value;
            if ($span.hasClass('foldername')) {
                value = getSortFolderDesc();
                Cryptpad.setLSAttribute(SORT_FOLDER_DESC, value ? false : true);
                refresh();
                return;
            }
            value = Cryptpad.getLSAttribute(SORT_FILE_BY);
            var descValue = getSortFileDesc();
            if ($span.hasClass('filename')) {
                if (value === '') {
                    descValue = descValue ? false : true;
                } else {
                    descValue = false;
                    value = '';
                }
            } else {
                var found = false;
                ['title', 'type', 'atime', 'ctime'].forEach(function (c) {
                    if (!found && $span.hasClass(c)) {
                        found = true;
                        if (value === c) { descValue = descValue ? false : true; }
                        else {
                            // atime and ctime should be ordered in a desc order at the first click
                            descValue = c !== 'title';
                            value = c;
                        }
                    }
                });
            }
            Cryptpad.setLSAttribute(SORT_FILE_BY, value);
            Cryptpad.setLSAttribute(SORT_FILE_DESC, descValue);
            refresh();
        };

        var addFolderSortIcon = function ($list) {
            var $icon = $sortAscIcon.clone();
            if (getSortFolderDesc()) {
                $icon = $sortDescIcon.clone();
            }
            if (typeof(Cryptpad.getLSAttribute(SORT_FOLDER_DESC)) !== "undefined") {
                $list.find('.foldername').addClass('active').prepend($icon);
            }
        };
        var getFolderListHeader = function () {
            var $fohElement = $('<li>', {'class': 'header listElement'});
            //var $fohElement = $('<span>', {'class': 'element'}).appendTo($folderHeader);
            var $fhIcon = $('<span>', {'class': 'icon'});
            var $name = $('<span>', {'class': 'name foldername clickable'}).text(Messages.fm_folderName).click(onSortByClick);
            var $subfolders = $('<span>', {'class': 'folders listElement'}).text(Messages.fm_numberOfFolders);
            var $files = $('<span>', {'class': 'files listElement'}).text(Messages.fm_numberOfFiles);
            $fohElement.append($fhIcon).append($name).append($subfolders).append($files);
            addFolderSortIcon($fohElement);
            return $fohElement;
        };
        var addFileSortIcon = function ($list) {
            var $icon = $sortAscIcon.clone();
            if (getSortFileDesc()) {
                $icon = $sortDescIcon.clone();
            }
            var classSorted;
            if (Cryptpad.getLSAttribute(SORT_FILE_BY) === '') { classSorted = 'filename'; }
            else if (Cryptpad.getLSAttribute(SORT_FILE_BY)) { classSorted = Cryptpad.getLSAttribute(SORT_FILE_BY); }
            if (classSorted) {
                $list.find('.' + classSorted).addClass('active').prepend($icon);
            }
        };
        // _WORKGROUP_ : do not display title, atime and ctime in workgroups since we don't have files data
        var getFileListHeader = function (displayTitle) {
            var $fihElement = $('<li>', {'class': 'file-header header listElement element'});
            //var $fihElement = $('<span>', {'class': 'element'}).appendTo($fileHeader);
            var $fhIcon = $('<span>', {'class': 'icon'});
            var $fhName = $('<span>', {'class': 'name filename clickable'}).text(Messages.fm_fileName).click(onSortByClick);
            var $fhTitle = $('<span>', {'class': 'title clickable'}).text(Messages.fm_title).click(onSortByClick);
            var $fhType = $('<span>', {'class': 'type clickable'}).text(Messages.table_type).click(onSortByClick);
            var $fhAdate = $('<span>', {'class': 'atime clickable'}).text(Messages.fm_lastAccess).click(onSortByClick);
            var $fhCdate = $('<span>', {'class': 'ctime clickable'}).text(Messages.fm_creation).click(onSortByClick);
            // If displayTitle is false, it means the "name" is the title, so do not display the "name" header
            $fihElement.append($fhIcon);
            if (displayTitle || isWorkgroup()) {
                $fihElement.append($fhName);
            } else {
                $fhTitle.width('auto');
            }
            if (!isWorkgroup()) {
                $fihElement.append($fhTitle);
            }
            $fihElement.append($fhType);
            if (!isWorkgroup()) {
                $fihElement.append($fhAdate).append($fhCdate);
            }
            addFileSortIcon($fihElement);
            return $fihElement;
            //return $fileHeader;
        };

        var allFilesSorted = function () {
            return filesOp.getUnsortedFiles().length === 0;
        };

        var sortElements = function (folder, path, oldkeys, prop, asc, useHref, useData) {
            var root = filesOp.findElement(files, path);
            var test = folder ? filesOp.isFolder : filesOp.isFile;
            var keys;
            if (!useData) {
                keys = oldkeys.filter(function (e) {
                    return useHref ? test(e) : test(root[e]);
                });
            } else { keys = oldkeys.slice(); }
            if (keys.length < 2) { return keys; }
            var mult = asc ? 1 : -1;
            var getProp = function (el, prop) {
                if (prop) {
                    var element = useHref || useData ? el : root[el];
                    var e = useData ? element : filesOp.getFileData(element);
                    if (!e) {
                        e = {
                            href : el,
                            title : Messages.fm_noname,
                            atime : 0,
                            ctime : 0
                        };
                    }
                    if (prop === 'type') {
                        var hrefData = Cryptpad.parsePadUrl(e.href);
                        return hrefData.type;
                    }
                    if (prop === 'atime' || prop === 'ctime') {
                        return new Date(e[prop]);
                    }
                    return e && e.title ? e.title.toLowerCase() : '';
                }
                return useData ? el.title.toLowerCase() : el.toLowerCase();
            };
            keys.sort(function(a, b) {
                if (getProp(a, prop) < getProp(b, prop)) { return mult * -1; }
                if (getProp(a, prop) > getProp(b, prop)) { return mult * 1; }
                return 0;
            });
            return keys;
        };
        var sortTrashElements = function (folder, oldkeys, prop, asc) {
            var root = files[TRASH];
            var test = folder ? filesOp.isFolder : filesOp.isFile;
            var keys = oldkeys.filter(function (e) {
                return test(e.element);
            });
            if (keys.length < 2) { return keys; }
            var mult = asc ? 1 : -1;
            var getProp = function (el, prop) {
                if (prop && !folder) {
                    var element = el.element;
                    var e = filesOp.getFileData(element);
                    if (!e) {
                        e = {
                            href : el,
                            title : Messages.fm_noname,
                            atime : 0,
                            ctime : 0
                        };
                    }
                    if (prop === 'type') {
                        var hrefData = Cryptpad.parsePadUrl(e.href);
                        return hrefData.type;
                    }
                    if (prop === 'atime' || prop === 'ctime') {
                        return new Date(e[prop]);
                    }
                    return e.title.toLowerCase();
                }
                return el.name.toLowerCase();
            };
            keys.sort(function(a, b) {
                if (getProp(a, prop) < getProp(b, prop)) { return mult * -1; }
                if (getProp(a, prop) > getProp(b, prop)) { return mult * 1; }
                return 0;
            });
            return keys;
        };

        // Drive content toolbar
        var createToolbar = function (path) {
            var $toolbar = $driveToolbar;
            $toolbar.html('');
            var $leftside = $('<div>', {'class': 'leftside'}).appendTo($toolbar);
            if (!APP.mobile()) {
                $leftside.width($tree.width());
            }
            var $rightside = $('<div>', {'class': 'rightside'}).appendTo($toolbar);
            return $toolbar;
        };

        // Unsorted element are represented by "href" in an array: they don't have a filename
        // and they don't hav a hierarchical structure (folder/subfolders)
        var displayHrefArray = function ($container, rootName, draggable) {
            var unsorted = files[rootName];
            if (rootName === UNSORTED && allFilesSorted()) { return; }
            var $fileHeader = getFileListHeader(false);
            $container.append($fileHeader);
            var keys = unsorted;
            var sortBy = Cryptpad.getLSAttribute(SORT_FILE_BY);
            sortBy = sortBy === "" ? sortBy = 'title' : sortBy;
            var sortedFiles = sortElements(false, [rootName], keys, sortBy, !getSortFileDesc(), true);
            sortedFiles.forEach(function (href) {
                var file = filesOp.getFileData(href);
                if (!file) {
                    //debug("Unsorted or template returns an element not present in filesData: ", href);
                    file = { title: Messages.fm_noname };
                    //return;
                }
                var idx = files[rootName].indexOf(href);
                var $icon = getFileIcon(href);
                var $element = $('<li>', {
                    'class': 'file-element element',
                    draggable: draggable
                });
                addFileData(href, file.title, $element, false);
                $element.prepend($icon).dblclick(function () {
                    openFile(href);
                });
                var path = [rootName, idx];
                $element.data('path', path);
                $element.click(function(e) {
                    e.stopPropagation();
                    onElementClick(e, $element, path);
                });
                $element.contextmenu(openDefaultContextMenu);
                if (draggable) {
                    addDragAndDropHandlers($element, path, false, false);
                }
                $container.append($element);
            });
        };

        var displayAllFiles = function ($container) {
            var allfiles = files[FILES_DATA];
            if (allfiles.length === 0) { return; }
            var $fileHeader = getFileListHeader(false);
            $container.append($fileHeader);
            var keys = allfiles;

            var sortedFiles = sortElements(false, [FILES_DATA], keys, Cryptpad.getLSAttribute(SORT_FILE_BY), !getSortFileDesc(), false, true);
            sortedFiles.forEach(function (file) {
                var $icon = getFileIcon(file.href);
                var $element = $('<li>', { 'class': 'file-element element' });
                addFileData(file.href, file.title, $element, false);
                $element.data('path', [FILES_DATA, allfiles.indexOf(file)]);
                $element.data('element', file.href);
                $element.prepend($icon).dblclick(function () {
                    openFile(file.href);
                });
                $element.click(function(e) {
                    e.stopPropagation();
                    onElementClick(e, $element);
                });
                $element.contextmenu(openDefaultContextMenu);
                $container.append($element);
            });
        };

        var displayTrashRoot = function ($list, $folderHeader, $fileHeader) {
            var filesList = [];
            var root = files[TRASH];
            // Elements in the trash are JS arrays (several elements can have the same name)
            [true,false].forEach(function (folder) {
                var testElement = filesOp.isFile;
                if (!folder) {
                    testElement = filesOp.isFolder;
                }
                Object.keys(root).forEach(function (key) {
                    if (!$.isArray(root[key])) {
                        logError("Trash element has a wrong type", root[key]);
                        return;
                    }
                    root[key].forEach(function (el, idx) {
                        if (testElement(el.element)) { return; }
                        var spath = [key, idx, 'element'];
                        filesList.push({
                            element: el.element,
                            spath: spath,
                            name: key
                        });
                    });
                });
            });
            var sortedFolders = sortTrashElements(true, filesList, null, !getSortFolderDesc());
            var sortedFiles = sortTrashElements(false, filesList, Cryptpad.getLSAttribute(SORT_FILE_BY), !getSortFileDesc());
            if (filesOp.hasSubfolder(root, true)) { $list.append($folderHeader); }
            sortedFolders.forEach(function (f) {
                var $element = createElement([TRASH], f.spath, root, true);
                $list.append($element);
            });
            if (filesOp.hasFile(root, true)) { $list.append($fileHeader); }
            sortedFiles.forEach(function (f) {
                var $element = createElement([TRASH], f.spath, root, false);
                $list.append($element);
            });
        };

        // Display the selected directory into the content part (rightside)
        // NOTE: Elements in the trash are not using the same storage structure as the others
        // _WORKGROUP_ : do not change the lastOpenedFolder value in localStorage
        var displayDirectory = module.displayDirectory = function (path, force) {
            if (!APP.editable) { debug("Read-only mode"); }
            if (!appStatus.isReady && !force) { return; }
            // Only Trash and Root are available in not-owned files manager
            if (isWorkgroup() && !filesOp.isPathInTrash(path) && !filesOp.isPathInRoot(path)) {
                log("Unable to open the selected category, displaying root"); //TODO translate
                currentPath = [ROOT];
                displayDirectory(currentPath);
                return;
            }
            appStatus.ready(false);
            currentPath = path;
            $content.html("");
            if (!path || path.length === 0) {
                path = [ROOT];
            }
            var isInRoot = filesOp.isPathInRoot(path);
            var isTrashRoot = filesOp.comparePath(path, [TRASH]);
            var isUnsorted = filesOp.comparePath(path, [UNSORTED]);
            var isTemplate = filesOp.comparePath(path, [TEMPLATE]);
            var isAllFiles = filesOp.comparePath(path, [FILES_DATA]);

            var root = filesOp.findElement(files, path);
            if (typeof(root) === "undefined") {
                log(Messages.fm_unknownFolderError);
                debug("Unable to locate the selected directory: ", path);
                var parentPath = path.slice();
                parentPath.pop();
                displayDirectory(parentPath, true);
                return;
            }

            module.resetTree();

            if (!isWorkgroup()) {
                setLastOpenedFolder(path);
            }

            var $toolbar = createToolbar(path);
            var $info = createInfoBox(path);

            var $dirContent = $('<div>', {id: FOLDER_CONTENT_ID});
            $dirContent.data('path', path);
            var mode = getViewMode();
            if (mode) {
                $dirContent.addClass(getViewModeClass());
            }
            var $list = $('<ul>').appendTo($dirContent);

            var $modeButton = createViewModeButton().appendTo($toolbar.find('.rightside'));
            var $title = createTitle(path).appendTo($toolbar.find('.rightside'));

            if (APP.mobile()) {
                var $context = $('<button>', {'class': 'element right dropdown-bar', id: 'contextButton'});
                $context.append($('<span>', {'class': 'fa fa-caret-down'}));
                $context.appendTo($toolbar.find('.rightside'));
                $context.click(function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var $li = $content.find('.selected');
                    if ($li.length !== 1) {
                        $li = $tree.find('.element.active').closest('li');
                    }
                    // Close if already opened
                    if ($iframe.find('.contextMenu:visible').length) {
                        module.hideMenu();
                        return;
                    }
                    // Open the menu
                    $iframe.find('.contextMenu').css({
                        top: ($context.offset().top + 32) + 'px',
                        right: '0px'
                    });
                    $li.contextmenu();
                });
            }
            updateContextButton();

            // NewButton can be undefined if we're in read only mode
            $toolbar.find('.leftside').append(createNewButton(isInRoot));


            var $folderHeader = getFolderListHeader();
            var $fileHeader = getFileListHeader(true);

            if (isUnsorted || isTemplate) {
                displayHrefArray($list, path[0], true);
            } else if (isAllFiles) {
                displayAllFiles($list);
            } else if (isTrashRoot) {
                displayTrashRoot($list, $folderHeader, $fileHeader);
            } else {
                $dirContent.contextmenu(openContentContextMenu);
                if (filesOp.hasSubfolder(root)) { $list.append($folderHeader); }
                // display sub directories
                var keys = Object.keys(root);
                var sortedFolders = sortElements(true, path, keys, null, !getSortFolderDesc());
                var sortedFiles = sortElements(false, path, keys, Cryptpad.getLSAttribute(SORT_FILE_BY), !getSortFileDesc());
                sortedFolders.forEach(function (key) {
                    if (filesOp.isFile(root[key])) { return; }
                    var $element = createElement(path, key, root, true);
                    $element.appendTo($list);
                });
                if (filesOp.hasFile(root)) { $list.append($fileHeader); }
                // display files
                sortedFiles.forEach(function (key) {
                    if (filesOp.isFolder(root[key])) { return; }
                    var $element = createElement(path, key, root, false);
                    $element.appendTo($list);
                });
            }
            //$content.append($toolbar).append($title).append($info).append($dirContent);
            $content.append($info).append($dirContent);
            appStatus.ready(true);
        };

        var refreshFilesData = function () {
            $content.find('li').each(function (i, e) {
                var $el = $(e);
                if ($el.data('path')) {
                    var path = $el.data('path');
                    var element = filesOp.findElement(files, path);
                    if (!filesOp.isFile(element)) { return; }
                    var data = filesOp.getFileData(element);
                    $el.find('.title').attr('title', data.title).text(data.title);
                    $el.find('.atime').attr('title', getDate(data.atime)).text(getDate(data.atime));
                    $el.find('.ctime').attr('title', getDate(data.ctime)).text(getDate(data.ctime));
                }
            });
        };

        var createTreeElement = function (name, $icon, path, draggable, droppable, collapsable, active) {
            var $name = $('<span>', { 'class': 'folder-element element' }).text(name);
            var $collapse;
            if (collapsable) {
                $collapse = $expandIcon.clone();
            }
            var $element = $('<li>').append($collapse).append($icon).append($name).click(function (e) {
                module.displayDirectory(path);
            });
            if (draggable) { $element.attr('draggable', true); }
            if (collapsable) {
                $element.addClass('collapsed');
                $collapse.click(function(e) {
                    e.stopPropagation();
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
            addDragAndDropHandlers($element, path, true, droppable);
            if (active) { $name.addClass('active'); }
            return $element;
        };

        var createTree = function ($container, path) {
            var root = filesOp.findElement(files, path);

            // don't try to display what doesn't exist
            if (!root) { return; }

            // Display the root element in the tree
            var displayingRoot = filesOp.comparePath([ROOT], path);
            if (displayingRoot) {
                var isRootOpened = filesOp.comparePath([ROOT], currentPath);
                var $rootIcon = filesOp.isFolderEmpty(files[ROOT]) ?
                    (isRootOpened ? $folderOpenedEmptyIcon : $folderEmptyIcon) :
                    (isRootOpened ? $folderOpenedIcon : $folderIcon);
                var $rootElement = createTreeElement(ROOT_NAME, $rootIcon.clone(), [ROOT], false, true, false, isRootOpened);
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
                var $element = createTreeElement(key, $icon.clone(), newPath, true, true, subfolder, isCurrentFolder);
                $element.appendTo($list);
                $element.contextmenu(openDirectoryContextMenu);
                createTree($element, newPath);
            });
        };

        var createUnsorted = function ($container, path) {
            var $icon = $unsortedIcon.clone();
            var isOpened = filesOp.comparePath(path, currentPath);
            var $unsortedElement = createTreeElement(UNSORTED_NAME, $icon, [UNSORTED], false, true, false, isOpened);
            $unsortedElement.addClass('root');
            var $unsortedList = $('<ul>', { id: 'unsortedTree', 'class': 'category2' }).append($unsortedElement);
            $container.append($unsortedList);
        };

        var createTemplate = function ($container, path) {
            var $icon = $templateIcon.clone();
            var isOpened = filesOp.comparePath(path, currentPath);
            var $element = createTreeElement(TEMPLATE_NAME, $icon, [TEMPLATE], false, true, false, isOpened);
            $element.addClass('root');
            var $list = $('<ul>', { id: 'templateTree', 'class': 'category2' }).append($element);
            $container.append($list);
        };

        var createAllFiles = function ($container, path) {
            var $icon = $unsortedIcon.clone();
            var isOpened = filesOp.comparePath(path, currentPath);
            var $allfilesElement = createTreeElement(FILES_DATA_NAME, $icon, [FILES_DATA], false, false, false, isOpened);
            $allfilesElement.addClass('root');
            var $allfilesList = $('<ul>', { id: 'allfilesTree', 'class': 'category2' }).append($allfilesElement);
            $container.append($allfilesList);
        };

        var createTrash = function ($container, path) {
            var $icon = filesOp.isFolderEmpty(files[TRASH]) ? $trashEmptyIcon.clone() : $trashIcon.clone();
            var isOpened = filesOp.comparePath(path, currentPath);
            var $trashElement = createTreeElement(TRASH_NAME, $icon, [TRASH], false, true, false, isOpened);
            $trashElement.addClass('root');
            $trashElement.contextmenu(openTrashTreeContextMenu);
            var $trashList = $('<ul>', { id: 'trashTree', 'class': 'category2' }).append($trashElement);
            $container.append($trashList);
        };

        var resetTree = module.resetTree = function () {
            $tree.html('');
            createTree($tree, [ROOT]);
            if (!isWorkgroup()) {
                createUnsorted($tree, [UNSORTED]);
                //createTemplate($tree, [TEMPLATE]);
                createAllFiles($tree, [FILES_DATA]);
            }
            createTrash($tree, [TRASH]);
        };

        var hideMenu = module.hideMenu = function () {
            $contextMenu.hide();
            $trashTreeContextMenu.hide();
            $trashContextMenu.hide();
            $contentContextMenu.hide();
            $defaultContextMenu.hide();
        };

        var stringifyPath = function (path) {
            if (!$.isArray(path)) { return; }
            var rootName = function (s) {
                var prettyName;
                switch (s) {
                    case ROOT:
                        prettyName = ROOT_NAME;
                        break;
                    case UNSORTED:
                        prettyName = UNSORTED_NAME;
                        break;
                    case FILES_DATA:
                        prettyName = FILES_DATA_NAME;
                        break;
                    case TRASH:
                        prettyName = TRASH_NAME;
                        break;
                    default:
                        prettyName = s;
                }
                return prettyName;
            };
            var $div = $('<div>');
            var i = 0;
            var space = 10;
            path.forEach(function (s) {
                if (i === 0) { s = rootName(s); }
                $div.append($('<span>', {'style': 'margin: 0 0 0 ' + i * space + 'px;'}).text(s));
                $div.append($('<br>'));
                i++;
            });
            return $div.html();
        };

        var getReadOnlyUrl = APP.getRO = function (href) {
            if (!filesOp.isFile(href)) { return; }
            var i = href.indexOf('#') + 1;
            var hash = href.slice(i);
            var base = href.slice(0, i);
            var hrefsecret = Cryptpad.getSecrets(hash);
            var viewHash = Cryptpad.getViewHashFromKeys(hrefsecret.channel, hrefsecret.keys);
            return base + viewHash;
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
            else if ($(this).hasClass('open_ro')) {
                var el = filesOp.findElement(files, path);
                if (filesOp.isFolder(el)) { return; }
                var roUrl = getReadOnlyUrl(el);
                openFile(roUrl);
            }
            else if ($(this).hasClass('newfolder')) {
                var onCreated = function (info) {
                    module.newFolder = info.newPath;
                    module.displayDirectory(path);
                };
                filesOp.createNewFolder(path, null, onCreated);
            }
            module.hideMenu();
        });

        $defaultContextMenu.on("click", "a", function(e) {
            e.stopPropagation();
            var path = $(this).data('path');
            var $element = $(this).data('element');
            if (!$element || !path || path.length < 2) {
                log(Messages.fm_forbidden);
                debug("Directory context menu on a forbidden or unexisting element. ", $element, path);
                return;
            }
            if ($(this).hasClass('open')) {
                $element.dblclick();
            }
            else if ($(this).hasClass('open_ro')) {
                var el = filesOp.findElement(files, path);
                if (filesOp.isPathInFilesData(path)) {
                    el = el.href;
                }
                if (!el || filesOp.isFolder(el)) { return; }
                var roUrl = getReadOnlyUrl(el);
                openFile(roUrl);
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
            else if ($(this).hasClass("newdoc")) {
                var type = $(this).data('type') || 'pad';
                createPadFromRootHandler.apply(this);
                e.preventDefault();
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
            else if ($(this).hasClass("properties")) {
                if (path.length !== 4) { return; }
                var element = filesOp.getTrashElementData(path);
                var sPath = stringifyPath(element.path);
                Cryptpad.alert('<strong>' + Messages.fm_originalPath + "</strong>:<br>" + sPath);
            }
            module.hideMenu();
        });

        $(ifrw).on('click', function (e) {
            if (e.which !== 1) { return ; }
            removeSelected(e);
            removeInput(e);
            module.hideMenu(e);
            hideNewButton();
        });
        $(ifrw).on('drag drop', function (e) {
            removeInput(e);
            module.hideMenu(e);
        });
        $(ifrw).on('mouseup drop', function (e) {
            $iframe.find('.droppable').removeClass('droppable');
        });
        $(ifrw).on('keydown', function (e) {
            // "Del"
            if (e.which === 46) {
                if (filesOp.isPathInFilesData(currentPath)) { return; } // We can't remove elements directly from filesData
                var $selected = $iframe.find('.selected');
                if (!$selected.length) { return; }
                var paths = [];
                var isTrash = filesOp.isPathInTrash(currentPath);
                $selected.each(function (idx, elmt) {
                    if (!$(elmt).data('path')) { return; }
                    paths.push($(elmt).data('path'));
                });
                // If we are in the trash or anon pad or if we are holding the "shift" key, delete permanently,
                if (isTrash || e.shiftKey) {
                    //var cb = filesOp.removeFromTrash; // We're in the trash
                    //if (!isTrash) { cb = filesOp.deletePathPermanently; } // We're in root

                    var msg = Messages._getKey("fm_removeSeveralPermanentlyDialog", [paths.length]);
                    if (paths.length === 1) {
                        msg = Messages.fm_removePermanentlyDialog;
                    }

                    Cryptpad.confirm(msg, function(res) {
                        if (!res) { return; }
                        filesOp.deletePathsPermanently(paths);
                        refresh();
                    });
                    return;
                }
                // else move to trash
                moveElements(paths, [TRASH], false, refresh);
            }
        });
        $(ifrw).contextmenu(function () {
            module.hideMenu();
            return false;
        });

        var onRefresh = {
            refresh: function() {
                if (onRefresh.to) {
                    window.clearTimeout(onRefresh.to);
                }
                onRefresh.to = window.setTimeout(refresh, 500);
            }
        };
        proxy.on('change', [], function (o, n, p) {
            var path = arguments[2];
            if (path[0] !== 'drive') { return false; }
            path = path.slice(1);
            var cPath = currentPath.slice();
            if ((filesOp.isPathInUnsorted(cPath) && filesOp.isPathInUnsorted(path)) ||
                    (filesOp.isPathInTemplate(cPath) && filesOp.isPathInTemplate(path)) ||
                    (path.length >= cPath.length && filesOp.isSubpath(path, cPath)) ||
                    (filesOp.isPathInTrash(cPath) && filesOp.isPathInTrash(path))) {
                // Reload after a few ms to make sure all the change events have been received
                onRefresh.refresh();
            } else if (path.length && path[0] === FILES_DATA) {
                if (filesOp.isPathInHrefArray(cPath)) {
                    onRefresh.refresh();
                } else {
                    refreshFilesData();
                }
            }
            module.resetTree();
            return false;
        }).on('remove', [], function (o, p) {
            var path = arguments[1];
            if (path[0] !== 'drive') { return false; }
            path = path.slice(1);
            var cPath = currentPath.slice();
            if ((filesOp.isPathInUnsorted(cPath) && filesOp.isPathInUnsorted(path)) ||
                    (filesOp.isPathInTemplate(cPath) && filesOp.isPathInTemplate(path)) ||
                    (path.length >= cPath.length && filesOp.isSubpath(path, cPath)) ||
                    (filesOp.isPathInTrash(cPath) && filesOp.isPathInTrash(path))) {
                // Reload after a few to make sure all the change events have been received
                onRefresh.to = window.setTimeout(refresh, 500);
            }
            module.resetTree();
            return false;
        });

        $iframe.find('#tree').mousedown(function (e) {
            if (APP.mobile()) { return; }
            if (APP.resizeTree) { return; }
            APP.resizeTree = window.setInterval(function () {
                $driveToolbar.find('.leftside').width($tree.width());
            }, 100);
        });
        $(ifrw).mouseup(function (e) {
            window.clearInterval(APP.resizeTree);
            APP.resizeTree = undefined;
        });


        refresh();
    };

    var setName = APP.setName = function (newName) {
        if (typeof(newName) !== 'string') { return; }
        var myUserNameTemp = Cryptpad.fixHTML(newName.trim());
        if(myUserNameTemp.length > 32) {
            myUserNameTemp = myUserNameTemp.substr(0, 32);
        }
        var myUserName = myUserNameTemp;
        Cryptpad.setAttribute('username', myUserName, function (err, data) {
            if (err) {
                logError("Couldn't set username", err);
                return;
            }
            APP.$displayName.text(myUserName);
        });
    };

    // TODO: move that function and use a more generic API?
    var migrateAnonDrive = function (proxy, cb) {
        if (sessionStorage.migrateAnonDrive) {
            // Make sure we have an FS_hash and we don't use it, otherwise just stop the migration and cb
            if (!localStorage.FS_hash || !APP.loggedIn) {
                delete sessionStorage.migrateAnonDrive;
                if (typeof(cb) === "function") { cb(); }
            }
            // Get the content of FS_hash and then merge the objects, remove the migration key and cb
            var todo = function (err, doc) {
                if (err) { logError("Cannot migrate recent pads", err); return; }
                var parsed;
                try { parsed = JSON.parse(doc); } catch (e) { logError("Cannot parsed recent pads", e); }
                if (parsed) {
                    $.extend(true, proxy, parsed);
                }
                delete sessionStorage.migrateAnonDrive;
                if (typeof(cb) === "function") { cb(); }
            };
            Get.get(localStorage.FS_hash, todo);
        } else {
            if (typeof(cb) === "function") { cb(); }
        }
    };
    var createReadme = function (proxy, cb) {
        if (proxy.initializing) {
            var hash = Cryptpad.createRandomHash();
            Get.put(hash, Messages.driveReadme, function (e) {
                if (e) { console.error(e); }
                var href = '/pad/#' + hash;
                proxy.drive[UNSORTED].push(href);
                proxy.drive[FILES_DATA].push({
                    href: href,
                    title: Messages.driveReadmeTitle,
                    atime: new Date().toISOString(),
                    ctime: new Date().toISOString()
                });
                if (typeof(cb) === "function") { cb(); }
            });
            delete proxy.initializing;
            return;
        }
        if (typeof(cb) === "function") { cb(); }
    };

    // don't initialize until the store is ready.
    Cryptpad.ready(function () {
        APP.$bar = $iframe.find('#toolbar');

        var storeObj = Cryptpad.getStore().getProxy && Cryptpad.getStore().getProxy().proxy ? Cryptpad.getStore().getProxy() : undefined;

        Cryptpad.styleAlerts();

        if (window.location.hash && window.location.hash === "#iframe") {
            $iframe.find('body').addClass('iframe');
            window.location.hash = "";
            APP.homePageIframe = true;
        }

        var hash = window.location.hash.slice(1) || Cryptpad.getUserHash() || localStorage.FS_hash;
        var secret = Cryptpad.getSecrets(hash);
        var readOnly = APP.readOnly = secret.keys && !secret.keys.editKeyStr;

        var listmapConfig = module.config = {
            data: {},
            websocketURL: Cryptpad.getWebsocketURL(),
            channel: secret.channel,
            readOnly: readOnly,
            validateKey: secret.keys.validateKey || undefined,
            crypto: Crypto.createEncryptor(secret.keys),
            logging: false
        };

        var proxy;
        if (storeObj && !window.location.hash.slice(1)) { proxy = storeObj.proxy; }
        else {
            var rt = window.rt = module.rt = Listmap.create(listmapConfig);
            proxy = rt.proxy;
        }
        var onCreate = function (info) {
            var realtime = module.realtime = info.realtime;

            var editHash = APP.editHash = !readOnly ? Cryptpad.getEditHashFromKeys(info.channel, secret.keys) : undefined;
            var viewHash = APP.viewHash = Cryptpad.getViewHashFromKeys(info.channel, secret.keys);

            APP.hash = readOnly ? viewHash : editHash;
            if (!readOnly && !localStorage.FS_hash && !Cryptpad.getUserHash() && !window.location.hash) {
                localStorage.FS_hash = editHash;
            }

            module.patchText = TextPatcher.create({
                realtime: realtime,
                logging: true,
            });

            var userList = APP.userList = info.userList;
            var config = {
                displayed: ['useradmin', 'language', 'spinner', 'lag', 'state'],
                readOnly: readOnly,
                ifrw: window,
                common: Cryptpad,
                hideShare: true
            };
            var toolbar = APP.toolbar = info.realtime.toolbar = Toolbar.create(APP.$bar, info.myID, info.realtime, info.getLag, userList, config);

            var $bar = APP.$bar;
            var $rightside = $bar.find('.' + Toolbar.constants.rightside);
            var $userBlock = $bar.find('.' + Toolbar.constants.userAdmin);
            APP.$displayName = $bar.find('.' + Toolbar.constants.username);

            if (APP.homePageIframe) {
                var $linkToMain = $bar.find('.cryptpad-link a');
                $linkToMain.attr('href', '#');
                $linkToMain.attr('title', '');
                $linkToMain.css('cursor', 'default');
                $linkToMain.off('click');
            }

            if (!readOnly && !APP.loggedIn) {
                var $backupButton = Cryptpad.createButton('', true).removeClass('fa').removeClass('fa-question');
                $backupButton.append($backupIcon.clone().css('marginRight', '0px'));
                $backupButton.attr('title', Messages.fm_backup_title);
                $backupButton.on('click', function() {
                    var url = window.location.origin + window.location.pathname + '#' + editHash;
                    Cryptpad.alert(Messages._getKey('fm_alert_backupUrl', [url]));
                    $('#fm_backupUrl').val(url);
                    $('#fm_backupUrl').click(function () {
                        $(this).select();
                    });
                });
                $userBlock.append($backupButton);
            }

            Cryptpad.onDisplayNameChanged(setName);
        };
        var onReady = function () {
            module.files = proxy;
            if (!proxy.drive || typeof(proxy.drive) !== 'object') { proxy.drive = {}; }
            migrateAnonDrive(proxy, function () {
                createReadme(proxy, function () {
                    initLocalStorage();
                    init(proxy);
                    APP.userList.onChange();
                    Cryptpad.removeLoadingScreen();
                });
            });
        };
        var onDisconnect = function (info) {
            setEditable(false);
            if (APP.refresh) { APP.refresh(); }
            APP.toolbar.failed();
            Cryptpad.alert(Messages.common_connectionLost);
        };
        var onReconnect = function (info) {
            setEditable(true);
            if (APP.refresh) { APP.refresh(); }
            APP.toolbar.reconnecting(info.myId);
            Cryptpad.findOKButton().click();
        };

        if (storeObj && !window.location.hash) {
            onCreate(storeObj.info);
            onReady();
        } else {
            proxy.on('create', function (info) {
                onCreate(info);
            }).on('ready', function () {
                onReady();
            });
        }
        proxy.on('disconnect', function () {
            onDisconnect();
        });
        proxy.on('reconnect', function (info) {
            onReconnect(info);
        });

        Cryptpad.onLogout(function () { setEditable(false); });
    });
    Cryptpad.onError(function (info) {
        if (info) {
            onConnectError();
        }
    });

    });
});
