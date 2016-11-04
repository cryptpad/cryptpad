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
    var module = {};

    var $ = window.jQuery;
    var saveAs = window.saveAs;
    var $iframe = $('#pad-iframe').contents();
    var ifrw = $('#pad-iframe')[0].contentWindow;
    var files = module.files = {
        root: {
            "Directory 1": {
                "Dir A": {
                    "File a": "#hash_a",
                    "File b": "#hash_b"
                },
                "Dir B": {},
                "File A": "#hash_A"
            },
            "Directory 2": {
                "File B": "#hash_B",
                "File C": "#hash_C"
            }
        },
        trash: {
            "File Z": "#hash_Z"
        }
    };
    var currentPath = module.currentPath = ['root'];
    var lastSelectTime;
    var selectedElement;

    // TODO translate
    // TODO translate contextmenu in inner.html
    var ROOT_NAME = "My files";
    var TRASH_NAME = "Trash";
    var TIME_BEFORE_RENAME = 1000;

    var $tree = $iframe.find("#tree");
    var $content = $iframe.find("#content");
    var $contextMenu = $iframe.find("#contextMenu");
    var $folderIcon = $('<span>', {
        "class": "fa fa-folder folder",
        style: "font-family: FontAwesome"
    });
    var $folderEmptyIcon = $('<span>', {
        "class": "fa fa-folder-o folder",
        style: "font-family: FontAwesome"
    });
    var $folderOpenedIcon = $('<span>', {
        "class": "fa fa-folder-open folder",
        style: "font-family: FontAwesome"
    });
    var $folderOpenedEmptyIcon = $('<span>', {
        "class": "fa fa-folder-open-o folder",
        style: "font-family: FontAwesome"
    });
    var $fileIcon = $('<span>', {
        "class": "fa fa-file file",
        style: "font-family: FontAwesome"
    });
    var $upIcon = $('<span>', {
        "class": "fa fa-arrow-circle-up",
        style: "font-family: FontAwesome"
    });
    var $trashIcon = $('<span>', {
        "class": "fa fa-trash",
        style: "font-family: FontAwesome"
    });

    var removeSelected =  function () {
        $content.find('.selected').removeClass("selected");
    };
    var removeInput =  function () {
        $content.find('li > span:hidden').show();
        $content.find('li > input').remove();
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

    var now = function () {
        return new Date().getTime();
    };

    // Find an element in a object following a path, resursively
    var findElement = function (root, pathInput) {
        if (!pathInput) {
            console.error("Invalid path:\n", pathInput, "\nin root\n", root);
            //TODO
            return;
        }
        if (pathInput.length === 0) { return root; }
        var path = pathInput.slice();
        var key = path.shift();
        if (typeof root[key] === "undefined") {
            console.error("Unable to find the key '" + key + "' in the root object provided:\n", root);
            //TODO
            return;
        }
        return findElement(root[key], path);
    };

    var moveElement = function (elementPath, newParentPath) {
        if (comparePath(elementPath, newParentPath)) { return; } // Nothing to do...
        var element = findElement(files, elementPath);
        var parentPath = elementPath.slice();
        var name = parentPath.pop();
        var parentEl = findElement(files, parentPath);
        var newParent = findElement(files, newParentPath);
        if (typeof(newParent[name]) !== "undefined") {
            console.error("A file with the same name already exist at the new location");
            //TODO
            return;
        }
        newParent[name] = element;
        delete parentEl[name];
        displayDirectory(newParentPath);
    };

    var removeElement = function (path) {
        moveElement(path, ['trash']);
    };

    var onDrag = function (ev, path) {
        console.log("dragging", path);
        var data = {
            'path': path
        };
        ev.dataTransfer.setData("data", JSON.stringify(data));
    };

    var onDrop = function (ev) {
        ev.preventDefault();
        var data = ev.dataTransfer.getData("data");
        var oldPath = JSON.parse(data).path;
        var newPath = $(ev.target).data('path') || $(ev.target).parent('li').data('path');
        console.log("dropping ", oldPath, " to ", newPath);
        if (!oldPath || !newPath) { return; }
        moveElement(oldPath, newPath);
    };

    var renameElement = function (path, newName) {
        if (path.length <= 1) {
            console.error('Renaming "root" is forbidden');
            //TODO
            return;
        }
        if (!newName || newName.trim() === "") { return; }
        var isCurrentDirectory = comparePath(path, currentPath);
        // Copy the element path and remove the last value to have the parent path and the old name
        var element = findElement(files, path);
        var parentPath = path.slice();
        var oldName = parentPath.pop();
        if (oldName === newName) {
            // Nothing to do...
            // TODO ?
            return;
        }
        var parentEl = findElement(files, parentPath);
        if (typeof(parentEl[newName]) !== "undefined") {
            console.error('Name already used.');
            //TODO
            return;
        }
        parentEl[newName] = element;
        delete parentEl[oldName];
        resetTree();
        displayDirectory(currentPath);
    };

    var displayRenameInput = function ($element, path) {
        if (!path || path.length < 2) { return; } // TODO error
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
        $input.click(function (e) {
            removeSelected();
            e.stopPropagation();
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
        if ($element.not('li')) {
            $element = $element.parent('li');
        }
        if (!$element.length) { return ; } //TODO error
        if (!$element.hasClass("selected")) {
            $element.addClass("selected");
            lastSelectTime = now();
        }
    };

    var openContextMenu = function (e) {
        onElementClick($(e.target));
        e.stopPropagation();
        var path = $(e.target).data('path') || $(e.target).parent('li').data('path');
        if (!path) { return; }
        $contextMenu.css({
            display: "block",
            left: e.pageX,
            top: e.pageY
        });
        $contextMenu.find('a').data('path', path);
        $contextMenu.find('a').data('element', $(e.target));
        return false;
    };

    var displayDirectory = function (path) {
        currentPath = path;
        module.resetTree();
        $content.html("");
        if (!path || path.length === 0) {
            path = ['root'];
        }
        var root = findElement(files, path);
        if (typeof(root) === "undefined") {
            // TODO translate
            // TODO error
            $content.html("Unable to locate the selected directory...");
            return;
        }

        // Forbid drag&drop inside the trash
        var droppable = root[0] !== "trash";

        // Display title and "Up" icon
        var name = path[path.length - 1];
        if (name === "root" && path.length === 1) { name = ROOT_NAME; }
        else if (name === "trash" && path.length === 1) { name = TRASH_NAME; }
        var $title = $('<h1>').text(name);
        if (path.length > 1) {
            var $parentFolder = $upIcon.clone().addClass("parentFolder")
                .click(function() {
                    var newPath = path.slice();
                    newPath.pop();
                    var name = newPath[newPath.length -1];
                    if (name === "root" && newPath.length === 1) { name = ROOT_NAME; }
                    displayDirectory(newPath);
                });
            $title.append($parentFolder);
        }
        var $dirContent = $('<div>', {id: "folderContent"});
        var $list = $('<ul>').appendTo($dirContent);

        // display sub directories
        Object.keys(root).forEach(function (key) {
            if (typeof(root[key]) === "string") { return; }
            var newPath = path.slice();
            newPath.push(key);
            var $icon = Object.keys(root[key]).length === 0 ? $folderEmptyIcon.clone() : $folderIcon.clone();
            var $name = $('<span>', { 'class': 'folder-element element' }).text(key);
            var $element = $('<li>', {
                draggable: true
            }).append($icon).append($name).dblclick(function () {
                displayDirectory(newPath);
            });
            $element.data('path', newPath);
            $element.on('dragstart', function (e) {
                onDrag(e.originalEvent, newPath);
            });
            if (droppable) {
                $element.on('dragover', function (e) {
                    e.preventDefault();
                });
                $element.on('drop', function (e) {
                    onDrop(e.originalEvent);
                });
            }
            $element.click(function(e) {
                e.stopPropagation();
                onElementClick($element, newPath);
            });
            $element.contextmenu(openContextMenu);
            $element.appendTo($list);
        });
        // display files
        Object.keys(root).forEach(function (key) {
            if (typeof(root[key]) !== "string") { return; }
            var newPath = path.slice();
            newPath.push(key);
            var $name = $('<span>', { 'class': 'file-element element' }).text(key);
            var $element = $('<li>', {
                draggable: true
            }).append($fileIcon.clone()).append($name).dblclick(function () {
                window.location.hash = root[key];
            });
            $element.data('path', newPath);
            $element.on('dragstart', function (e) {
                console.log(e.target);
                onDrag(e.originalEvent, newPath);
            });
            $element.click(function(e) {
                e.stopPropagation();
                onElementClick($element, newPath);
            });
            $element.contextmenu(openContextMenu);
            $element.appendTo($list);
        });
        $content.append($title).append($dirContent);
    };

    // TODO: add + and - in the tree (collapse), and link elements with lines
    // Cf: https://codepen.io/khoama/pen/hpljA
    var createTreeElement = function (name, $icon, path, draggable) {
        var $name = $('<span>', { 'class': 'folder-element' }).text(name).prepend($icon)
            .click(function () {
                displayDirectory(path);
            });
        var $element = $('<li>', {
            draggable: draggable
        }).append($name);
        $element.data('path', path);
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
        return $element;
    };
    var createTree = function ($container, path) {
        var root = findElement(files, path);
        if (Object.keys(root).length === 0) { return; }

        // Display the root elemnt in the tree
        var displayingRoot = comparePath(['root'], path);
        if (displayingRoot) {
            var isRootOpened = comparePath(['root'], currentPath);
            var $rootIcon = Object.keys(files['root']).length === 0 ?
                (isRootOpened ? $folderOpenedEmptyIcon : $folderEmptyIcon) :
                (isRootOpened ? $folderOpenedIcon : $folderIcon);
            var $rootElement = createTreeElement(ROOT_NAME, $rootIcon.clone(), ['root'], false);
            var $root = $('<ul>').append($rootElement).appendTo($container);
            $container = $rootElement;
        }

        // Display root content
        var $list = $('<ul>').appendTo($container);
        Object.keys(root).forEach(function (key) {
            // Do not display files in the menu
            if (typeof(root[key]) === "string") { return; }
            var newPath = path.slice();
            newPath.push(key);
            var isCurrentFolder = comparePath(newPath, currentPath);
            var $icon = Object.keys(root[key]).length === 0 ?
                (isCurrentFolder ? $folderOpenedEmptyIcon : $folderEmptyIcon) :
                (isCurrentFolder ? $folderOpenedIcon : $folderIcon);
            var $element = createTreeElement(key, $icon.clone(), newPath, true);
            $element.appendTo($list);
            createTree($element, newPath);
        });
    };

    var createTrash = function ($container, path) {
        var $trash = $('<span>', {
                'class': 'tree-trash'
            }).text(TRASH_NAME).prepend($trashIcon.clone())
            .click(function () {
                displayDirectory(path);
            });
        $trash.data('path', ['trash']);
        var $trashElement = $('<li>').append($trash);
        $trashElement.on('dragover', function (e) {
            e.preventDefault();
        });
        $trashElement.on('drop', function (e) {
            onDrop(e.originalEvent);
        });
        var $trashList = $('<ul>').append($trashElement);
        $container.append($trashList);
    };

    var resetTree = module.resetTree = function () {
        $tree.html('');
        createTree($tree, ['root']);
        createTrash($tree, ['trash']);
    };
    displayDirectory(currentPath);
    //resetTree(); //already called by displayDirectory

    var hideMenu = function () {
        $contextMenu.hide();
    };
    $contextMenu.on("click", "a", function(e) {
        e.stopPropagation();
        var path = $(this).data('path');
        var $element = $(this).data('element');
        if (!$element || !path || path.length < 2) { return; } // TODO: error
        if ($(this).hasClass("rename")) {
            displayRenameInput($element, path);
        }
        else if($(this).hasClass("delete")) {
            var name = path[path.length - 1];
            // TODO translate
            Cryptpad.confirm("Are you sure you want to move " + name + " to the trash?", function(res) {
                if (!res) { return; }
                console.log("Removing ", path);
                removeElement(path);
            });
        }
        else if ($(this).hasClass('open')) {
            $element.dblclick();
        }
        hideMenu();
    });

    $(ifrw).on('click', function (e) {
        if (e.which !== 1) { return ; }
        removeSelected(e);
        removeInput(e);
        hideMenu(e);
    });

    /*    var displayDirectory = function (name, root, path) {
        $content.html("");
        var $title = $('<h1>').text(name);
        var $dirContent = $('<div>', {id: "folderContent"});
        var $list = $('<ul>').appendTo($dirContent);
        // display sub directories
        Object.keys(root).forEach(function (key) {
            if (typeof(root[key]) === "string") { return; }
            var $name = $('<span>', { 'class': 'folder-element' }).text(key).prepend($folderIcon.clone());
            var $element = $('<li>').append($name).dblclick(function () {
                displayDirectory(key, root[key]);
            });
            $element.appendTo($list);
        });
        // display files
        Object.keys(root).forEach(function (key) {
            if (typeof(root[key]) !== "string") { return; }
            var $name = $('<span>', { 'class': 'file-element' }).text(key).prepend($fileIcon.clone());
            var $element = $('<li>').append($name).dblclick(function () {
                window.location.hash = root[key];
            });
            $element.appendTo($list);
        });
        $content.append($title).append($dirContent);
    };

    var createTree = function ($container, root, path) {
        if (Object.keys(root).length === 0) { return; }
        var $list = $('<ul>').appendTo($container);
        Object.keys(root).forEach(function (key) {
            // Do not display files in the menu
            if (typeof(root[key]) === "string") { return; }
            var $icon = Object.keys(root[key]).length === 0 ? $folderEmptyIcon.clone() : $folderIcon.clone();
            var $name = $('<span>', { 'class': 'folder-element' }).text(key).prepend($icon)
                .click(function () {
                    displayDirectory(key, root[key]);
                });
            var $element = $('<li>').append($name);
            $element.appendTo($list);
            createTree(root[key], $element[0]);
        });
    };*/
});
