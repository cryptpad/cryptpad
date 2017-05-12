define([
    'jquery',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/textpatcher/TextPatcher.amd.js',
    'json.sortify',
    '/common/cryptpad-common.js',
    '/common/userObject.js',
    '/common/toolbar2.js',
    '/customize/application_config.js',
    '/common/cryptget.js',
    '/common/mergeDrive.js'
], function ($, Listmap, Crypto, TextPatcher, JSONSortify, Cryptpad, FO, Toolbar, AppConfig, Get, Merge) {
    var module = window.MODULE = {};

    var Messages = Cryptpad.Messages;
    //var saveAs = window.saveAs;

    // Use `$(function () {});` to make sure the html is loaded before doing anything else
    $(function () {
    var $iframe = $('#pad-iframe').contents();
    var ifrw = $('#pad-iframe')[0].contentWindow;

    Cryptpad.addLoadingScreen();
    var onConnectError = function () {
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

    var LIMIT_REFRESH_RATE = 30000; // milliseconds
    var E_OVER_LIMIT = 'E_OVER_LIMIT';

    var SEARCH = "search";
    var SEARCH_NAME = Messages.fm_searchName;
    var ROOT = "root";
    var ROOT_NAME = Messages.fm_rootName;
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
            path = localStorage[LOCALSTORAGE_LAST] ? JSON.parse(localStorage[LOCALSTORAGE_LAST]) : [ROOT];
        } catch (e) {
            path = [ROOT];
        }
        return path;
    };
    var setLastOpenedFolder = function (path) {
        if (path[0] === SEARCH) { return; }
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

    var setSearchCursor = function () {
        var $input = $iframe.find('#searchInput');
        localStorage.searchCursor = $input[0].selectionStart;
    };
    var getSearchCursor = function () {
        return localStorage.searchCursor || 0;
    };

/*  var now = function () {
        return new Date().getTime();
    }; */

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
    var $whiteboardIcon = $('<span>', {"class": "fa fa-paint-brush"});
    //var $upIcon = $('<span>', {"class": "fa fa-arrow-circle-up"});
    var $unsortedIcon = $('<span>', {"class": "fa fa-files-o"});
    var $templateIcon = $('<span>', {"class": "fa fa-cubes"});
    var $trashIcon = $('<span>', {"class": "fa fa-trash"});
    var $trashEmptyIcon = $('<span>', {"class": "fa fa-trash-o"});
    //var $collapseIcon = $('<span>', {"class": "fa fa-minus-square-o expcol"});
    var $expandIcon = $('<span>', {"class": "fa fa-plus-square-o expcol"});
    var $listIcon = $('<span>', {"class": "fa fa-list"});
    var $gridIcon = $('<span>', {"class": "fa fa-th"});
    var $sortAscIcon = $('<span>', {"class": "fa fa-angle-up sortasc"});
    var $sortDescIcon = $('<span>', {"class": "fa fa-angle-down sortdesc"});
    var $closeIcon = $('<span>', {"class": "fa fa-window-close"});
    var $backupIcon = $('<span>', {"class": "fa fa-life-ring"});

    var history = {
        isHistoryMode: false,
    };

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
        var $appContainer = $iframe.find(".app-container");
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

        // Categories dislayed in the menu
        // _WORKGROUP_ : do not display unsorted
        var displayedCategories = [ROOT, TRASH, SEARCH];
        if (AppConfig.enableTemplates) { displayedCategories.push(TEMPLATE); }
        if (isWorkgroup()) { displayedCategories = [ROOT, TRASH, SEARCH]; }

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

        var findDataHolder = function ($el) {
            return $el.is('.element-row') ? $el : $el.closest('.element-row');
        };


        // Selection
        var sel = {};

        var removeSelected =  function (keepObj) {
            $iframe.find('.selected').removeClass("selected");
            var $container = $driveToolbar.find('#contextButtonsContainer');
            if (!$container.length) { return; }
            $container.html('');
            if (!keepObj) {
                delete sel.startSelected;
                delete sel.endSelected;
                delete sel.oldSelection;
            }
        };

        sel.refresh = 200;
        sel.$selectBox = $('<div>', {'class': 'selectBox'}).appendTo($content);
        var checkSelected = function () {
            if (!sel.down) { return; }
            var pos = sel.pos;
            var l = $content[0].querySelectorAll('.element:not(.selected):not(.header)');
            var p, el;
            var offset = getViewMode() === "grid" ? 10 : 0;
            for (var i = 0; i < l.length; i++) {
                el = l[i];
                p = $(el).position();
                p.top += offset + $content.scrollTop();
                p.left += offset;
                p.bottom = p.top + $(el).outerHeight();
                p.right = p.left + $(el).outerWidth();
                if (p.right < pos.left || p.left > pos.right
                    || p.top > pos.bottom || p.bottom < pos.top) {
                    $(el).removeClass('selectedTmp');
                } else {
                    $(el).addClass('selectedTmp');
                }
            }
        };
        $content.on('mousedown', function (e) {
            if (e.which !== 1) { return; }
            $content.focus();
            sel.down = true;
            if (!e.ctrlKey) { removeSelected(); }
            var rect = e.currentTarget.getBoundingClientRect();
            sel.startX = e.clientX - rect.left;
            sel.startY = e.clientY - rect.top + $content.scrollTop();
            sel.$selectBox.show().css({
                left: sel.startX + 'px',
                top: sel.startY + 'px',
                width: '0px',
                height: '0px'
            });
            if (sel.move) { return; }
            sel.move = function (ev) {
                var rectMove = ev.currentTarget.getBoundingClientRect(),
                    offX = ev.clientX - rectMove.left,
                    offY = ev.clientY - rectMove.top + $content.scrollTop();


                var left = sel.startX,
                    top = sel.startY;
                var width = offX - sel.startX;
                if (width < 0) {
                    left = Math.max(0, offX);
                    var diffX = left-offX;
                    width = Math.abs(width) - diffX;
                }
                var height = offY - sel.startY;
                if (height < 0) {
                    top = Math.max(0, offY);
                    var diffY = top-offY;
                    height = Math.abs(height) - diffY;
                }
                sel.$selectBox.css({
                    width: width + 'px',
                    left: left + 'px',
                    height: height + 'px',
                    top: top + 'px'
                });


                sel.pos = {
                    top: top,
                    left: left,
                    bottom: top + height,
                    right: left + width
                };
                var diffT = sel.update ? +new Date() - sel.update : sel.refresh;
                if (diffT < sel.refresh) {
                    if (!sel.to) {
                        sel.to = window.setTimeout(function () {
                            sel.update = +new Date();
                            checkSelected();
                            sel.to = undefined;
                        }, (sel.refresh - diffT));
                    }
                    return;
                }
                sel.update = +new Date();
                checkSelected();
            };
            $content.mousemove(sel.move);
        });
        $(ifrw).on('mouseup', function (e) {
            if (!sel.down) { return; }
            if (e.which !== 1) { return; }
            sel.down = false;
            sel.$selectBox.hide();
            $content.off('mousemove', sel.move);
            delete sel.move;
            $content.find('.selectedTmp').removeClass('selectedTmp').addClass('selected');
            e.stopPropagation();
        });

        // Arrow keys to modify the selection
        $(ifrw).keydown(function (e) {
            var $searchBar = $tree.find('#searchInput');
            if ($searchBar.is(':focus') && $searchBar.val()) { return; }

            var $elements = $content.find('.element:not(.header)');

            var ev = {};
            if (e.ctrlKey) { ev.ctrlKey = true; }
            if (e.shiftKey) { ev.shiftKey = true; }
            var click = function (el) {
                if (!el) { return; }
                module.onElementClick(ev, $(el));
            };

            // Enter
            if (e.which === 13) {
                var $allSelected = $content.find('.element.selected');
                if ($allSelected.length === 1) {
                    // Open the folder or the file
                    $allSelected.dblclick();
                    return;
                }
                // If more than one, open only the files
                var $select = $content.find('.file-element.selected');
                $select.each(function (idx, el) {
                    $(el).dblclick();
                });
                return;
            }

            // [Left, Up, Right, Down]
            if ([37, 38, 39, 40].indexOf(e.which) === -1) { return; }
            e.preventDefault();

            var $selection = $content.find('.element.selected');
            if ($selection.length === 0) { return void click($elements.first()[0]); }

            var lastIndex = typeof sel.endSelected === "number" ? sel.endSelected :
                            typeof sel.startSelected === "number" ? sel.startSelected :
                            $elements.index($selection.last()[0]);
            var length = $elements.length;
            if (length === 0) { return; }
            // List mode
            if (getViewMode() === "list") {
                if (e.which === 40) { click($elements.get(Math.min(lastIndex+1, length -1))); }
                if (e.which === 38) { click($elements.get(Math.max(lastIndex-1, 0))); }
                return;
            }

            // Icon mode
            // Get the vertical and horizontal position of lastIndex
            // Filter all the elements to get those in the same line/column
            var pos = $($elements.get(0)).position();
            var $line = $elements.filter(function (idx, el) {
                return $(el).position().top === pos.top;
            });
            var cols = $line.length;
            var lines = Math.ceil(length/cols);

            var lastPos = {
                l : Math.floor(lastIndex/cols),
                c : lastIndex - Math.floor(lastIndex/cols)*cols
            };

            if (e.which === 37) {
                if (lastPos.c === 0) { return; }
                click($elements.get(Math.max(lastIndex-1, 0)));
                return;
            }
            if (e.which === 38) {
                if (lastPos.l === 0) { return; }
                click($elements.get(Math.max(lastIndex-cols, 0)));
                return;
            }
            if (e.which === 39) {
                if (lastPos.c === cols-1) { return; }
                click($elements.get(Math.min(lastIndex+1, length-1)));
                return;
            }
            if (e.which === 40) {
                if (lastPos.l === lines-1) { return; }
                click($elements.get(Math.min(lastIndex+cols, length-1)));
                return;
            }

        });


        var removeInput =  function (cancel) {
            if (!cancel && $iframe.find('.element-row > input').length === 1) {
                var $input = $iframe.find('.element-row > input');
                filesOp.rename($input.data('path'), $input.val(), APP.refresh);
            }
            $iframe.find('.element-row > input').remove();
            $iframe.find('.element-row > span:hidden').removeAttr('style');
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

        var openFile = function (fileEl, name) {
            if (name) {
                sessionStorage[Cryptpad.newPadNameKey] = name;
            }
            window.open(fileEl);
            delete sessionStorage[Cryptpad.newPadNameKey];
        };

        var refresh = APP.refresh = function () {
            module.displayDirectory(currentPath);
        };

        // Replace a file/folder name by an input to change its value
        var displayRenameInput = function ($element, path) {
            // NOTE: setTimeout(f, 0) otherwise the "rename" button in the toolbar is not working
            window.setTimeout(function () {
                if (!APP.editable) { return; }
                if (!path || path.length < 2) {
                    logError("Renaming a top level element (root, trash or filesData) is forbidden.");
                    return;
                }
                removeInput();
                removeSelected();
                var $name = $element.find('.name');
                if (!$name.length) {
                    $name = $element.find('> .element');
                }
                $name.hide();
                var name = path[path.length - 1];
                var $input = $('<input>', {
                    placeholder: name,
                    value: name
                }).data('path', path);

                // Stop propagation on keydown to avoid issues with arrow keys
                $input.on('keydown', function (e) { e.stopPropagation(); });

                $input.on('keyup', function (e) {
                    if (e.which === 13) {
                        removeInput(true);
                        filesOp.rename(path, $input.val(), refresh);
                        return;
                    }
                    if (e.which === 27) {
                        removeInput(true);
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
                    $input.parents('.element-row').attr("draggable", false);
                });
                $input.on('mouseup', function (e) {
                    e.stopPropagation();
                    $input.parents('.element-row').attr("draggable", true);
                });
            },0);
        };

        var filterContextMenu = function ($menu, paths) {
            //var path = $element.data('path');
            if (!paths || paths.length === 0) { logError('no paths'); }

            var hide = [];
            var hasFolder = false;
            paths.forEach(function (p) {
                var path = p.path;
                var $element = p.element;
                if (path.length === 1) {
                    hide.push($menu.find('a.rename'));
                    hide.push($menu.find('a.delete'));
                }
                if (!APP.editable) {
                    hide.push($menu.find('a.editable'));
                }
                if (!isOwnDrive()) {
                    hide.push($menu.find('a.own'));
                }
                if ($element.is('.file-element')) {
                    // No folder in files
                    hide.push($menu.find('a.newfolder'));
                    if ($element.is('.readonly')) {
                        // Keep only open readonly
                        hide.push($menu.find('a.open'));
                    } else if ($element.is('.noreadonly')) {
                        // Keep only open readonly
                        hide.push($menu.find('a.open_ro'));
                    }
                } else {
                    if (hasFolder) {
                        // More than 1 folder selected: cannot create a new subfolder
                        hide.push($menu.find('a.newfolder'));
                    }
                    hasFolder = true;
                    hide.push($menu.find('a.open_ro'));
                    // TODO: folder properties in the future?
                    hide.push($menu.find('a.properties'));
                }
                // If we're in the trash, hide restore and properties for non-root elements
                if ($menu.find('a.restore').length && path && path.length > 4) {
                    hide.push($menu.find('a.restore'));
                    hide.push($menu.find('a.properties'));
                }
            });
            if (paths.length > 1) {
                hide.push($menu.find('a.restore'));
                hide.push($menu.find('a.properties'));
                hide.push($menu.find('a.rename'));
            }
            if (hasFolder && paths.length > 1) {
                // Cannot open multiple folders
                hide.push($menu.find('a.open'));
            }
            return hide;
        };

        var updatePathSize = function () {
            var $context = $iframe.find('#contextButtonsContainer');
            var l = 50;
            if ($context.length) {
                l += $context.width() || 0;
            }
            $driveToolbar.find('.path').css('max-width', 'calc(100vw - '+$tree.width()+'px - '+l+'px)');
        };

        var getSelectedPaths = function ($element) {
            var paths = [];
            if ($iframe.find('.selected').length > 1) {
                var $selected = $iframe.find('.selected');
                $selected.each(function (idx, elmt) {
                    var ePath = $(elmt).data('path');
                    if (ePath) {
                        paths.push({
                            path: ePath,
                            element: $(elmt)
                        });
                    }
                });
            }

            if (!paths.length) {
                var path = $element.data('path');
                if (!path) { return false; }
                paths.push({
                    path: path,
                    element: $element
                });
            }
            return paths;
        };

        var updateContextButton = function () {
            var $li = $content.find('.selected');
            if ($li.length === 0) {
                $li = findDataHolder($tree.find('.active'));
            }
            var $button = $driveToolbar.find('#contextButton');
            if ($button.length) { // mobile
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
                return;
            }
            // Non mobile
            var $container = $driveToolbar.find('#contextButtonsContainer');
            if (!$container.length) { return; }
            $container.html('');
            var $element = $li.length === 1 ? $li : $($li[0]);
            var paths = getSelectedPaths($element);
            var $menu = $element.data('context');
            if (!$menu) { return; }
            //var actions = [];
            var $actions = $menu.find('a');
            var toHide = filterContextMenu($menu, paths);
            $actions = $actions.filter(function (i, el) {
                for (var j = 0; j < toHide.length; j++) {
                    if ($(el).is(toHide[j])) { return false; }
                }
                return true;
            });
            $actions.each(function (i, el) {
                var $a = $('<button>', {'class': 'element'});
                if ($(el).attr('data-icon')) {
                    $a.addClass('fa').addClass($(el).attr('data-icon'));
                    $a.attr('title', $(el).text());
                } else {
                    $a.text($(el).text());
                }
                $(el).data('paths', paths);
                //$(el).data('path', path);
                //:$(el).data('element', $element);
                $container.append($a);
                $a.click(function() { $(el).click(); });
            });
            updatePathSize();
        };

        var scrollTo = function ($element) {
            // Current scroll position
            var st = $content.scrollTop();
            // Block height
            var h = $content.height();
            // Current top position of the element relative to the scroll position
            var pos = Math.round($element.offset().top - $content.position().top);
            // Element height
            var eh = $element.outerHeight();
            // New scroll value
            var v = st + pos + eh - h;
            // If the element is completely visile, don't change the scroll position
            if (pos+eh <= h && pos >= 0) { return; }
            $content.scrollTop(v);
        };
        // Add the "selected" class to the "li" corresponding to the clicked element
        var onElementClick = module.onElementClick = function (e, $element) {
            // If "Ctrl" is pressed, do not remove the current selection
            removeInput();
            $element = findDataHolder($element);
            // If we're selecting a new element with the left click, hide the menu
            if (e) { module.hideMenu(); }
            // Remove the selection if we don't hold ctrl key or if we are right-clicking
            if (!e || !e.ctrlKey) {
                removeSelected(e && e.shiftKey);
            }
            if (!$element.length) {
                log(Messages.fm_selectError);
                return;
            }
            scrollTo($element);
            // Add the selected class to the clicked / right-clicked element
            // Remove the class if it already has it
            // If ctrlKey, add to the selection
            // If shiftKey, select a range of elements
            var $elements = $content.find('.element:not(.header)');
            var $selection = $elements.filter('.selected');
            if (typeof sel.startSelected !== "number" || !e || (e.ctrlKey && !e.shiftKey)) {
                sel.startSelected = $elements.index($element[0]);
                sel.oldSelection = [];
                $selection.each(function (idx, el) {
                    sel.oldSelection.push(el);
                });
                delete sel.endSelected;
            }
            if (e && e.shiftKey) {
                var end = $elements.index($element[0]);
                sel.endSelected = end;
                var $el;
                removeSelected(true);
                sel.oldSelection.forEach(function (el) {
                    if (!$(el).hasClass("selected")) { $(el).addClass("selected"); }
                });
                for (var i = Math.min(sel.startSelected, sel.endSelected);
                     i <= Math.max(sel.startSelected, sel.endSelected);
                     i++) {
                    $el = $($elements.get(i));
                    if (!$el.hasClass("selected")) { $el.addClass("selected"); }
                }
            } else {
                if (!$element.hasClass("selected")) {
                    $element.addClass("selected");
                } else {
                    $element.removeClass("selected");
                }
            }
            updateContextButton();
        };

        var displayMenu = function (e, $menu) {
            $menu.css({ display: "block" });
            if (APP.mobile()) { return; }
            var h = $menu.outerHeight();
            var w = $menu.outerWidth();
            var wH = window.innerHeight;
            var wW = window.innerWidth;
            if (h > wH) {
                $menu.css({
                    top: '0px',
                    bottom: ''
                });
            } else if (e.pageY + h <= wH) {
                $menu.css({
                    top: e.pageY+'px',
                    bottom: ''
                });
            } else {
                $menu.css({
                    bottom: '0px',
                    top: ''
                });
            }
            if(w > wW) {
                $menu.css({
                    left: '0px',
                    right: ''
                });
            } else if (e.pageX + w <= wW) {
                $menu.css({
                    left: e.pageX+'px',
                    right: ''
                });
            } else {
                $menu.css({
                    left: '',
                    right: '0px',
                });
            }
        };

        // Open the selected context menu on the closest "li" element
        var openContextMenu = function (e, $menu) {
            module.hideMenu();
            e.stopPropagation();

            var $element = findDataHolder($(e.target));
            if (!$element.length) {
                logError("Unable to locate the .element tag", e.target);
                $menu.hide();
                log(Messages.fm_contextMenuError);
                return false;
            }

            if (!$element.hasClass('selected')) { //paths.length === 1) {
                onElementClick(undefined, $element);
            }

            var paths = getSelectedPaths($element);

            var toHide = filterContextMenu($menu, paths);
            toHide.forEach(function ($a) {
                $a.parent('li').hide();
            });

            displayMenu(e, $menu);

            if ($menu.find('li:visible').length === 0) {
                debug("No visible element in the context menu. Abort.");
                $menu.hide();
                return true;
            }

            $menu.find('a').data('paths', paths);
            //$menu.find('a').data('path', path);
            //$menu.find('a').data('element', $element);
            return false;
        };

        var openDirectoryContextMenu = function (e) {
            $contextMenu.find('li').show();
            openContextMenu(e, $contextMenu);
            return false;
        };

        var openDefaultContextMenu = function (e) {
            $defaultContextMenu.find('li').show();
            openContextMenu(e, $defaultContextMenu);
            return false;
        };

        var openTrashTreeContextMenu = function (e) {
            removeSelected();
            $trashTreeContextMenu.find('li').show();
            openContextMenu(e, $trashTreeContextMenu);
            return false;
        };

        var openTrashContextMenu = function (e) {
            var path = findDataHolder($(e.target)).data('path');
            if (!path) { return; }
            $trashContextMenu.find('li').show();
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

            displayMenu(e, $menu);

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
            if (filesOp.isInTrashRoot(path)) { return path[0]; }
            // Root or trash
            if (filesOp.isPathIn(path, [ROOT, TRASH])) { return path[path.length - 1]; }
            // Unsorted or template
            if (filesOp.isPathIn(path, ['hrefArray'])) {
                var file = filesOp.find(path);
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
                filesOp.move(paths, newPath, cb);
            };
            // Cancel drag&drop from TRASH to TRASH
            if (filesOp.isPathIn(newPath, [TRASH]) && paths.length && paths[0][0] === TRASH) {
                return;
            }
            // "force" is currently unused but may be configurable by user
            if (newPath[0] !== TRASH || force) {
                andThen();
                return;
            }
            var msg = Messages._getKey('fm_removeSeveralDialog', [paths.length]);
            if (paths.length === 1) {
                var path = paths[0];
                var name = path[0] === TEMPLATE ? filesOp.getTitle(filesOp.find(path)) : path[path.length - 1];
                msg = Messages._getKey('fm_removeDialog', [name]);
            }
            Cryptpad.confirm(msg, function (res) {
                $(ifrw).focus();
                if (!res) { return; }
                andThen();
            });
        };
        // Drag & drop:
        // The data transferred is a stringified JSON containing the path of the dragged element
        var onDrag = function (ev, path) {
            var paths = [];
            var $element = findDataHolder($(ev.target));
            if ($element.hasClass('selected')) {
                var $selected = $iframe.find('.selected');
                $selected.each(function (idx, elmt) {
                    var ePath = $(elmt).data('path');
                    if (ePath) {
                        var val = filesOp.find(ePath);
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
                var val = filesOp.find(path);
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
                var el = filesOp.find(p.path);
                if (el && (stringify(el) === stringify(p.value.el) || !p.value || !p.value.el)) {
                    movedPaths.push(p.path);
                } else {
                    importedElements.push(p.value);
                }
            });

            var $el = findDataHolder($(ev.target));
            var newPath = $el.data('path');
            if (!newPath) { return; }
            if (movedPaths && movedPaths.length) {
                moveElements(movedPaths, newPath, null, refresh);
            }
            if (importedElements && importedElements.length) {
                // TODO workgroup
                //filesOp.importElements(importedElements, newPath, refresh);
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
            if (hrefData.hashData && hrefData.hashData.mode === 'view') {
                $type.append(' (' + Messages.readonly+ ')');
            }
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
            else if (href.indexOf('/whiteboard/') !== -1) { $icon = $whiteboardIcon.clone(); }

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

            var element = filesOp.find(newPath);
            var $icon = !isFolder ? getFileIcon(element) : undefined;
            var ro = filesOp.isReadOnlyFile(element);
            // ro undefined mens it's an old hash which doesn't support read-only
            var roClass = typeof(ro) === 'undefined' ? ' noreadonly' : ro ? ' readonly' : '';
            var liClass = 'file-item file-element element' + roClass;
            if (isFolder) {
                liClass = 'folder-item folder-element element';
                $icon = filesOp.isFolderEmpty(root[key]) ? $folderEmptyIcon.clone() : $folderIcon.clone();
            }
            var $element = $('<li>', {
                draggable: true,
                'class': 'element-row'
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
                openFile(root[key], key);
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
                $element.data('context', $contextMenu);
            } else {
                $element.contextmenu(openTrashContextMenu);
                $element.data('context', $trashContextMenu);
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
        /*
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
        }; */

        var getPrettyName = function (name) {
            var pName;
            switch (name) {
                case ROOT: pName = ROOT_NAME; break;
                case TRASH: pName = TRASH_NAME; break;
                case TEMPLATE: pName = TEMPLATE_NAME; break;
                case FILES_DATA: pName = FILES_DATA_NAME; break;
                case SEARCH: pName = SEARCH_NAME; break;
                default: pName = name;
            }
            return pName;
        };

        // Create the title block with the "parent folder" button
        var createTitle = function (path, noStyle) {
            if (!path || path.length === 0) { return; }
            var isTrash = filesOp.isPathIn(path, [TRASH]);
            var $title = $('<span>', {'class': 'path unselectable'});
            if (APP.mobile()) {
                return $title;
            }
            path = path[0] === SEARCH ? path.slice(0,1) : path;
            path.forEach(function (p, idx) {
                if (isTrash && [2,3].indexOf(idx) !== -1) { return; }

                var $span = $('<span>', {'class': 'element'});
                if (idx < path.length - 1) {
                    if (!noStyle) {
                        $span.addClass('clickable');
                        $span.click(function () {
                            var sliceEnd = idx + 1;
                            if (isTrash && idx === 1) { sliceEnd = 4; } // Make sure we don't show the index or 'element' and 'path'
                            module.displayDirectory(path.slice(0, sliceEnd));
                        });
                    }
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
                var attributes = {
                    'class': 'newdoc',
                    'data-type': type,
                    'href': '#'
                };
                options.push({
                    tag: 'a',
                    attributes: attributes,
                    content: Messages.type[type]
                });
            });
            var $plusIcon = $('<div>').append($('<span>', {'class': 'fa fa-plus'}));


            var dropdownConfig = {
                text: $plusIcon.html() + Messages.fm_newButton,
                options: options
            };
            var $block = Cryptpad.createDropdown(dropdownConfig);

            // Custom style:
            $block.find('button').addClass('btn').addClass('btn-primary').addClass('new');
            $block.find('button').attr('title', Messages.fm_newButtonTitle);

            // Handlers
            if (isInRoot) {
                var onCreated = function (err, info) {
                    if (err && err === E_OVER_LIMIT) {
                        return void Cryptpad.alert(Messages.pinLimitDrive, null, true);
                    }
                    module.newFolder = info.newPath;
                    refresh();
                };
                $block.find('a.newFolder').click(function () {
                    filesOp.addFolder(currentPath, null, onCreated);
                });
                $block.find('a.newdoc').click(function () {
                    var type = $(this).attr('data-type') || 'pad';
                    var name = Cryptpad.getDefaultName({type: type});
                    filesOp.addFile(currentPath, name, type, onCreated);
                });
            } else {
                $block.find('a.newdoc').click(function () {
                    var type = $(this).attr('data-type') || 'pad';
                    sessionStorage[Cryptpad.newPadPathKey] = filesOp.isPathIn(currentPath, [TRASH]) ? '' : currentPath;
                    window.open('/' + type + '/');
                });
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

        var onSortByClick = function () {
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
            var $fhType = $('<span>', {'class': 'type clickable'}).text(Messages.fm_type).click(onSortByClick);
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

        var sortElements = function (folder, path, oldkeys, prop, asc, useHref, useData) {
            var root = filesOp.find(path);
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
                            href : element,
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
            //var root = files[TRASH];
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
        var createToolbar = function () {
            var $toolbar = $driveToolbar;
            $toolbar.html('');
            var $leftside = $('<div>', {'class': 'leftside'}).appendTo($toolbar);
            if (!APP.mobile()) {
                $leftside.width($tree.width());
            }
            $('<div>', {'class': 'rightside'}).appendTo($toolbar);
            return $toolbar;
        };

        // Unsorted element are represented by "href" in an array: they don't have a filename
        // and they don't hav a hierarchical structure (folder/subfolders)
        var displayHrefArray = function ($container, rootName, draggable) {
            var unsorted = files[rootName];
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
                var ro = filesOp.isReadOnlyFile(href);
                // ro undefined mens it's an old hash which doesn't support read-only
                var roClass = typeof(ro) === 'undefined' ? ' noreadonly' : ro ? ' readonly' : '';
                var $element = $('<li>', {
                    'class': 'file-element element element-row' + roClass,
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
                $element.data('context', $defaultContextMenu);
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
                var ro = filesOp.isReadOnlyFile(file.href);
                // ro undefined mens it's an old hash which doesn't support read-only
                var roClass = typeof(ro) === 'undefined' ? ' noreadonly' : ro ? ' readonly' : '';
                var $element = $('<li>', { 'class': 'file-element element element-row' + roClass });
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
                $element.data('context', $defaultContextMenu);
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

        var displaySearch = function ($list, value) {
            var filesList = filesOp.search(value);
            filesList.forEach(function (r) {
                r.paths.forEach(function (path) {
                    var href = r.data.href;
                    var parsed = Cryptpad.parsePadUrl(href);
                    var $table = $('<table>');
                    var $icon = $('<td>', {'rowspan': '3', 'class': 'icon'}).append(getFileIcon(href));
                    var $title = $('<td>', {'class': 'col1 title'}).text(r.data.title).click(function () {
                        openFile(r.data.href);
                    });
                    var $typeName = $('<td>', {'class': 'label2'}).text(Messages.fm_type);
                    var $type = $('<td>', {'class': 'col2'}).text(Messages.type[parsed.type] || parsed.type);
                    var $atimeName = $('<td>', {'class': 'label2'}).text(Messages.fm_lastAccess);
                    var $atime = $('<td>', {'class': 'col2'}).text(new Date(r.data.atime).toLocaleString());
                    var $ctimeName = $('<td>', {'class': 'label2'}).text(Messages.fm_creation);
                    var $ctime = $('<td>', {'class': 'col2'}).text(new Date(r.data.ctime).toLocaleString());
                    if (filesOp.isPathIn(path, ['hrefArray'])) {
                        path.pop();
                        path.push(r.data.title);
                    }
                    var $path = $('<td>', {'class': 'col1 path'}).html(createTitle(path, true).html());
                    var parentPath = path.slice();
                    var $a;
                    if (parentPath) {
                        $a = $('<a>').text(Messages.fm_openParent).click(function (e) {
                            e.preventDefault();
                            parentPath.pop();
                            module.displayDirectory(parentPath);
                        });
                    }
                    var $openDir = $('<td>', {'class': 'openDir'}).append($a);

                    // rows 1-3
                    $('<tr>').append($icon).append($title).append($typeName).append($type).appendTo($table);
                    $('<tr>').append($path).append($atimeName).append($atime).appendTo($table);
                    $('<tr>').append($openDir).append($ctimeName).append($ctime).appendTo($table);
                    $('<li>', {'class':'searchResult'}).append($table).appendTo($list);
                });
            });
        };

        // Display the selected directory into the content part (rightside)
        // NOTE: Elements in the trash are not using the same storage structure as the others
        // _WORKGROUP_ : do not change the lastOpenedFolder value in localStorage
        var displayDirectory = module.displayDirectory = function (path, force) {
            module.hideMenu();
            if (!APP.editable) { debug("Read-only mode"); }
            if (!appStatus.isReady && !force) { return; }
            // Only Trash and Root are available in not-owned files manager
            if (displayedCategories.indexOf(path[0]) === -1) {
                log(Messages.categoryError);
                currentPath = [ROOT];
                displayDirectory(currentPath);
                return;
            }
            appStatus.ready(false);
            currentPath = path;
            var s = $content.scrollTop() || 0;
            $content.html("");
            sel.$selectBox = $('<div>', {'class': 'selectBox'}).appendTo($content);
            if (!path || path.length === 0) {
                path = [ROOT];
            }
            var isInRoot = filesOp.isPathIn(path, [ROOT]);
            var isTrashRoot = filesOp.comparePath(path, [TRASH]);
            var isTemplate = filesOp.comparePath(path, [TEMPLATE]);
            var isAllFiles = filesOp.comparePath(path, [FILES_DATA]);
            var isSearch = path[0] === SEARCH;

            var root = isSearch ? undefined : filesOp.find(path);
            if (!isSearch && typeof(root) === "undefined") {
                log(Messages.fm_unknownFolderError);
                debug("Unable to locate the selected directory: ", path);
                var parentPath = path.slice();
                parentPath.pop();
                displayDirectory(parentPath, true);
                return;
            }

            module.resetTree();

            // in history mode we want to focus the version number input
            if (!history.isHistoryMode && !APP.mobile()) {
                var st = $tree.scrollTop() || 0;
                $tree.find('#searchInput').focus();
                $tree.scrollTop(st);
            }
            $tree.find('#searchInput')[0].selectionStart = getSearchCursor();
            $tree.find('#searchInput')[0].selectionEnd = getSearchCursor();

            if (!isWorkgroup()) {
                setLastOpenedFolder(path);
            }

            var $toolbar = createToolbar(path);
            var $info = createInfoBox(path);

            var $dirContent = $('<div>', {id: FOLDER_CONTENT_ID});
            $dirContent.data('path', path);
            if (!isSearch) {
                var mode = getViewMode();
                if (mode) {
                    $dirContent.addClass(getViewModeClass());
                }
                createViewModeButton().appendTo($toolbar.find('.rightside'));
            }
            var $list = $('<ul>').appendTo($dirContent);

            createTitle(path).appendTo($toolbar.find('.rightside'));
            updatePathSize();

            if (APP.mobile()) {
                var $context = $('<button>', {'class': 'element right dropdown-bar', id: 'contextButton'});
                $context.append($('<span>', {'class': 'fa fa-caret-down'}));
                $context.appendTo($toolbar.find('.rightside'));
                $context.click(function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var $li = $content.find('.selected');
                    if ($li.length !== 1) {
                        $li = findDataHolder($tree.find('.active'));
                    }
                    // Close if already opened
                    if ($iframe.find('.contextMenu:visible').length) {
                        module.hideMenu();
                        return;
                    }
                    // Open the menu
                    $iframe.find('.contextMenu').css({
                        top: ($context.offset().top + 32) + 'px',
                        right: '0px',
                        left: ''
                    });
                    $li.contextmenu();
                });
            } else {
                var $contextButtons = $('<span>', {'id' : 'contextButtonsContainer'});
                $contextButtons.appendTo($toolbar.find('.rightside'));
            }
            updateContextButton();

            // NewButton can be undefined if we're in read only mode
            $toolbar.find('.leftside').append(createNewButton(isInRoot));


            var $folderHeader = getFolderListHeader();
            var $fileHeader = getFileListHeader(true);

            if (isTemplate) {
                displayHrefArray($list, path[0], true);
            } else if (isAllFiles) {
                displayAllFiles($list);
            } else if (isTrashRoot) {
                displayTrashRoot($list, $folderHeader, $fileHeader);
            } else if (isSearch) {
                displaySearch($list, path[1]);
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

            var $truncated = $('<span>', {'class': 'truncated'}).text('...');
            $content.find('.element').each(function (idx, el) {
                var $name = $(el).find('.name');
                if ($name.length === 0) { return; }
                if ($name[0].scrollHeight > $name[0].clientHeight) {
                    var $tr = $truncated.clone();
                    $tr.attr('title', $name.attr('title'));
                    $(el).append($tr);
                }
            });

            $content.scrollTop(s);
            appStatus.ready(true);
        };

/*      var refreshFilesData = function () {
            $content.find('.element-row').each(function (i, e) {
                var $el = $(e);
                if ($el.data('path')) {
                    var path = $el.data('path');
                    var element = filesOp.find(path);
                    if (!filesOp.isFile(element)) { return; }
                    var data = filesOp.getFileData(element);
                    if (!data) { return; }
                    if (filesOp.isPathIn(path, ['hrefArray'])) { $el.find('.name').attr('title', data.title).text(data.title); }
                    $el.find('.title').attr('title', data.title).text(data.title);
                    $el.find('.atime').attr('title', getDate(data.atime)).text(getDate(data.atime));
                    $el.find('.ctime').attr('title', getDate(data.ctime)).text(getDate(data.ctime));
                }
            });
        }; */


        var createTreeElement = function (name, $icon, path, draggable, droppable, collapsable, active) {
            var $name = $('<span>', { 'class': 'folder-element element' }).text(name);
            var $collapse;
            if (collapsable) {
                $collapse = $expandIcon.clone();
            }
            var $elementRow = $('<span>', {'class': 'element-row'}).append($collapse).append($icon).append($name).click(function (e) {
                e.stopPropagation();
                module.displayDirectory(path);
            });
            var $element = $('<li>').append($elementRow);
            if (draggable) { $elementRow.attr('draggable', true); }
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
            $elementRow.data('path', path);
            addDragAndDropHandlers($elementRow, path, true, droppable);
            if (active) { $elementRow.addClass('active'); }
            return $element;
        };

        var createTree = function ($container, path) {
            var root = filesOp.find(path);

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
                $rootElement.find('>.element-row').contextmenu(openDirectoryContextMenu);
                $('<ul>').append($rootElement).appendTo($container);
                $container = $rootElement;
            } else if (filesOp.isFolderEmpty(root)) { return; }

            // Display root content
            var $list = $('<ul>').appendTo($container);
            var keys = Object.keys(root).sort();
            keys.forEach(function (key) {
                // Do not display files in the menu
                if (!filesOp.isFolder(root[key])) { return; }
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
                $element.find('>.element-row').contextmenu(openDirectoryContextMenu);
                createTree($element, newPath);
            });
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

        var search = APP.Search = {};
        var createSearch = function ($container) {
            var isInSearch = currentPath[0] === SEARCH;
            var $div = $('<div>', {'id': 'searchContainer', 'class': 'unselectable'});
            var $input = $('<input>', {
                id: 'searchInput',
                type: 'text',
                draggable: false,
                tabindex: 1,
                placeholder: Messages.fm_searchPlaceholder
            }).keyup(function (e) {
                if (search.to) { window.clearTimeout(search.to); }
                if ([38, 39, 40, 41].indexOf(e.which) !== -1) {
                    if (!$input.val()) {
                        $input.blur();
                        $content.focus();
                        return;
                    } else {
                        e.stopPropagation();
                    }
                }
                var isInSearchTmp = currentPath[0] === SEARCH;
                if ($input.val().trim() === "") {
                    setSearchCursor(0);
                    if (search.oldLocation && search.oldLocation.length) { displayDirectory(search.oldLocation); }
                    return;
                }
                if (e.which === 13) {
                    if (!isInSearchTmp) { search.oldLocation = currentPath.slice(); }
                    var newLocation = [SEARCH, $input.val()];
                    setSearchCursor();
                    if (!filesOp.comparePath(newLocation, currentPath.slice())) { displayDirectory(newLocation); }
                    return;
                }
                if (APP.mobile()) { return; }
                search.to = window.setTimeout(function () {
                    if (!isInSearchTmp) { search.oldLocation = currentPath.slice(); }
                    var newLocation = [SEARCH, $input.val()];
                    setSearchCursor();
                    if (!filesOp.comparePath(newLocation, currentPath.slice())) { displayDirectory(newLocation); }
                }, 500);
            }).appendTo($div);
            if (isInSearch) { $input.val(currentPath[1] || ''); }
            $container.append($div);
        };

        module.resetTree = function () {
            var s = $tree.scrollTop() || 0;
            $tree.html('');
            if (displayedCategories.indexOf(SEARCH) !== -1) { createSearch($tree); }
            if (displayedCategories.indexOf(ROOT) !== -1) { createTree($tree, [ROOT]); }
            if (displayedCategories.indexOf(TEMPLATE) !== -1) { createTemplate($tree, [TEMPLATE]); }
            if (displayedCategories.indexOf(FILES_DATA) !== -1) { createAllFiles($tree, [FILES_DATA]); }
            if (displayedCategories.indexOf(TRASH) !== -1) { createTrash($tree, [TRASH]); }
            $tree.scrollTop(s);
        };

        module.hideMenu = function () {
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
            var parsed = Cryptpad.parsePadUrl(href);
            var base = href.slice(0, i);
            var hrefsecret = Cryptpad.getSecrets(parsed.type, parsed.hash);
            if (!hrefsecret.keys) { return; }
            var viewHash = Cryptpad.getViewHashFromKeys(hrefsecret.channel, hrefsecret.keys);
            return base + viewHash;
        };

        // Disable middle click in the context menu to avoid opening /drive/inner.html# in new tabs
        $(ifrw).click(function (e) {
            if (!e.target || !$(e.target).parents('.cryptpad-dropdown').length) { return; }
            if (e.which !== 1) {
                e.stopPropagation();
                return false;
            }
        });

        var getProperties = function (el, cb) {
            if (!filesOp.isFile(el)) {
                return void cb('NOT_FILE');
            }
            var ro = filesOp.isReadOnlyFile(el);
            var base = window.location.origin;
            var $d = $('<div>');
            $('<strong>').text(Messages.fc_prop).appendTo($d);
            $('<br>').appendTo($d);
            if (!ro) {
                $('<label>', {'for': 'propLink'}).text(Messages.editShare).appendTo($d);
                $('<input>', {'id': 'propLink', 'readonly': 'readonly', 'value': base + el})
                .click(function () { $(this).select(); })
                .appendTo($d);
            }
            var roLink = ro ? base + el : getReadOnlyUrl(base + el);
            if (roLink) {
                $('<label>', {'for': 'propROLink'}).text(Messages.viewShare).appendTo($d);
                $('<input>', {'id': 'propROLink', 'readonly': 'readonly', 'value': roLink})
                .click(function () { $(this).select(); })
                .appendTo($d);
            }

            if (Cryptpad.isLoggedIn() && AppConfig.enablePinning) {
                // check the size of this file...
                Cryptpad.getFileSize(el, function (e, bytes) {
                    if (e) {
                        // there was a problem with the RPC
                        logError(e);

                        // but we don't want to break the interface.
                        // continue as if there was no RPC

                        return void cb(void 0, $d);
                    }
                    var KB = Cryptpad.bytesToKilobytes(bytes);
                    $('<br>').appendTo($d);

                    $('<label>', {
                        'for': 'size'
                    }).text(Messages.fc_sizeInKilobytes).appendTo($d);

                    $('<input>', {
                        id: 'size',
                        readonly: 'readonly',
                        value: KB + 'KB',
                    })
                    .click(function () { $(this).select(); })
                    .appendTo($d);

                    cb(void 0, $d);
                });
            } else {
                cb(void 0, $d);
            }
        };

        $contextMenu.on("click", "a", function(e) {
            e.stopPropagation();
            var paths = $(this).data('paths');
            //var path = $(this).data('path');
            //var $element = $(this).data('element');
            if (paths.length === 0) {
                log(Messages.fm_forbidden);
                debug("Directory context menu on a forbidden or unexisting element. ", paths);
                return;
            }
            if ($(this).hasClass("rename")) {
                if (paths.length !== 1) { return; }
                displayRenameInput(paths[0].element, paths[0].path);
            }
            else if($(this).hasClass("delete")) {
                var pathsList = [];
                paths.forEach(function (p) { pathsList.push(p.path); });
                moveElements(pathsList, [TRASH], false, refresh);
            }
            else if ($(this).hasClass('open')) {
                paths.forEach(function (p) {
                    var $element = p.element;
                    $element.click();
                    $element.dblclick();
                });
            }
            else if ($(this).hasClass('open_ro')) {
                paths.forEach(function (p) {
                    var el = filesOp.find(p.path);
                    if (filesOp.isFolder(el)) { return; }
                    var roUrl = getReadOnlyUrl(el);
                    openFile(roUrl, false);
                });
            }
            else if ($(this).hasClass('newfolder')) {
                if (paths.length !== 1) { return; }
                var onCreated = function (err, info) {
                    if (err) { return void logError(err); }
                    module.newFolder = info.newPath;
                    module.displayDirectory(paths[0].path);
                };
                filesOp.addFolder(paths[0].path, null, onCreated);
            }
            else if ($(this).hasClass("properties")) {
                if (paths.length !== 1) { return; }
                var el = filesOp.find(paths[0].path);
                getProperties(el, function (e, $prop) {
                    if (e) { return void logError(e); }
                    Cryptpad.alert('', undefined, true);
                    $('.alertify .msg').html("").append($prop);
                });
            }
            module.hideMenu();
        });

        $defaultContextMenu.on("click", "a", function(e) {
            e.stopPropagation();
            var paths = $(this).data('paths');
            if (paths.length === 0) {
                log(Messages.fm_forbidden);
                debug("Context menu on a forbidden or unexisting element. ", paths);
                return;
            }
            if ($(this).hasClass('open')) {
                paths.forEach(function (p) {
                    var $element = p.element;
                    $element.dblclick();
                });
            }
            else if ($(this).hasClass('open_ro')) {
                paths.forEach(function (p) {
                    var el = filesOp.find(p.path);
                    if (filesOp.isPathIn(p.path, [FILES_DATA])) { el = el.href; }
                    if (!el || filesOp.isFolder(el)) { return; }
                    var roUrl = getReadOnlyUrl(el);
                    openFile(roUrl, false);
                });
            }
            else if ($(this).hasClass('delete')) {
                var pathsList = [];
                paths.forEach(function (p) { pathsList.push(p.path); });
                moveElements(pathsList, [TRASH], false, refresh);
            }
            else if ($(this).hasClass("properties")) {
                if (paths.length !== 1) { return; }
                var el = filesOp.find(paths[0].path);
                getProperties(el, function (e, $prop) {
                    if (e) { return void logError(e); }
                    Cryptpad.alert('', undefined, true);
                    $('.alertify .msg').html("").append($prop);
                });
            }
            module.hideMenu();
        });

        $contentContextMenu.on('click', 'a', function (e) {
            e.stopPropagation();
            var path = $(this).data('path');
            var onCreated = function (err, info) {
                if (err && err === E_OVER_LIMIT) {
                    return void Cryptpad.alert(Messages.pinLimitDrive, null, true);
                }
                module.newFolder = info.newPath;
                refresh();
            };
            if ($(this).hasClass("newfolder")) {
                filesOp.addFolder(path, null, onCreated);
            }
            else if ($(this).hasClass("newdoc")) {
                var type = $(this).data('type') || 'pad';
                var name = Cryptpad.getDefaultName({type: type});
                filesOp.addFile(path, name, type, onCreated);
            }
            module.hideMenu();
        });

        $trashTreeContextMenu.on('click', 'a', function (e) {
            e.stopPropagation();
            var paths = $(this).data('paths');
            if (paths.length !== 1 || !paths[0].element || !filesOp.comparePath(paths[0].path, [TRASH])) {
                log(Messages.fm_forbidden);
                debug("Trash tree context menu on a forbidden or unexisting element. ", paths);
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
            var paths = $(this).data('paths');
            if (paths.length === 0) {
                log(Messages.fm_forbidden);
                debug("Trash context menu on a forbidden or unexisting element. ", paths);
                return;
            }
            var path = paths[0].path;
            var name = paths[0].path[paths[0].path.length - 1];
            if ($(this).hasClass("remove")) {
                if (paths.length === 1) {
                    if (path.length === 4) { name = path[1]; }
                    Cryptpad.confirm(Messages._getKey("fm_removePermanentlyDialog", [name]), function(res) {
                        if (!res) { return; }
                        filesOp.delete([path], refresh);
                    });
                    return;
                }
                var pathsList = [];
                paths.forEach(function (p) { pathsList.push(p.path); });
                var msg = Messages._getKey("fm_removeSeveralPermanentlyDialog", [paths.length]);
                Cryptpad.confirm(msg, function(res) {
                    if (!res) { return; }
                    filesOp.delete(pathsList, refresh);
                });
            }
            else if ($(this).hasClass("restore")) {
                if (paths.length !== 1) { return; }
                if (path.length === 4) { name = path[1]; }
                Cryptpad.confirm(Messages._getKey("fm_restoreDialog", [name]), function(res) {
                    if (!res) { return; }
                    filesOp.restore(path, refresh);
                });
            }
            else if ($(this).hasClass("properties")) {
                if (paths.length !== 1 || path.length !== 4) { return; }
                var element = filesOp.find(path.slice(0,3)); // element containing the oldpath
                var sPath = stringifyPath(element.path);
                Cryptpad.alert('<strong>' + Messages.fm_originalPath + "</strong>:<br>" + sPath, undefined, true);
            }
            module.hideMenu();
        });

        // Chrome considers the double-click means "select all" in the window
        $content.on('mousedown', function (e) {
            $content.focus();
            e.preventDefault();
        });
        $appContainer.on('mouseup', function (e) {
            if (sel.down) { return; }
            if (e.which !== 1) { return ; }
            removeSelected(e);
        });
        $appContainer.on('click', function (e) {
            if (e.which !== 1) { return ; }
            removeInput();
            module.hideMenu(e);
            hideNewButton();
        });
        $appContainer.on('drag drop', function (e) {
            removeInput();
            module.hideMenu(e);
        });
        $appContainer.on('mouseup drop', function () {
            $iframe.find('.droppable').removeClass('droppable');
        });
        $appContainer.on('keydown', function (e) {
            // "Del"
            if (e.which === 46) {
                if (filesOp.isPathIn(currentPath, [FILES_DATA])) { return; } // We can't remove elements directly from filesData
                var $selected = $iframe.find('.selected');
                if (!$selected.length) { return; }
                var paths = [];
                var isTrash = filesOp.isPathIn(currentPath, [TRASH]);
                $selected.each(function (idx, elmt) {
                    if (!$(elmt).data('path')) { return; }
                    paths.push($(elmt).data('path'));
                });
                // If we are in the trash or anon pad or if we are holding the "shift" key, delete permanently,
                if (isTrash || e.shiftKey) {
                    var msg = Messages._getKey("fm_removeSeveralPermanentlyDialog", [paths.length]);
                    if (paths.length === 1) {
                        msg = Messages.fm_removePermanentlyDialog;
                    }

                    Cryptpad.confirm(msg, function(res) {
                        $(ifrw).focus();
                        if (!res) { return; }
                        filesOp.delete(paths, refresh);
                    });
                    return;
                }
                // else move to trash
                moveElements(paths, [TRASH], false, refresh);
            }
        });
        $appContainer.contextmenu(function () {
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
        proxy.on('change', [], function () {
            if (history.isHistoryMode) { return; }
            var path = arguments[2];
            if (path[0] !== 'drive') { return false; }
            path = path.slice(1);
            var cPath = currentPath.slice();
            if ((filesOp.isPathIn(cPath, ['hrefArray', TRASH]) && cPath[0] === path[0]) ||
                    (path.length >= cPath.length && filesOp.isSubpath(path, cPath))) {
                // Reload after a few ms to make sure all the change events have been received
                onRefresh.refresh();
            } else if (path.length && path[0] === FILES_DATA) {
                onRefresh.refresh();
            }
            module.resetTree();
            return false;
        }).on('remove', [], function () {
            if (history.isHistoryMode) { return; }
            var path = arguments[1];
            if (path[0] !== 'drive') { return false; }
            path = path.slice(1);
            var cPath = currentPath.slice();
            if ((filesOp.isPathIn(cPath, ['hrefArray', TRASH]) && cPath[0] === path[0]) ||
                    (path.length >= cPath.length && filesOp.isSubpath(path, cPath))) {
                // Reload after a few to make sure all the change events have been received
                onRefresh.to = window.setTimeout(refresh, 500);
            }
            module.resetTree();
            return false;
        });

        $iframe.find('#tree').mousedown(function () {
            if (APP.mobile()) { return; }
            if (APP.resizeTree) { return; }
            APP.resizeTree = window.setInterval(function () {
                $driveToolbar.find('.leftside').width($tree.width());
                updatePathSize();
            }, 100);
        });
        $appContainer.mouseup(function () {
            window.clearInterval(APP.resizeTree);
            APP.resizeTree = undefined;
        });

        history.onEnterHistory = function (obj) {
            var files = obj.drive;
            filesOp = FO.init(files, config);
            refresh();
        };
        history.onLeaveHistory = function () {
            var files = proxy.drive;
            filesOp = FO.init(files, config);
            refresh();
        };

        var createReadme = function (proxy, cb) {
            if (sessionStorage.createReadme) {
                var hash = Cryptpad.createRandomHash();
                Get.put(hash, Messages.driveReadme, function (e) {
                    if (e) { logError(e); }
                    var href = '/pad/#' + hash;
                    var data = {
                        href: href,
                        title: Messages.driveReadmeTitle,
                        atime: new Date().toISOString(),
                        ctime: new Date().toISOString()
                    };
                    filesOp.pushData(data);
                    filesOp.add(data);
                    if (typeof(cb) === "function") { cb(); }
                });
                delete sessionStorage.createReadme;
                return;
            }
            if (typeof(cb) === "function") { cb(); }
        };

        createReadme(proxy, function () {
            refresh();
            APP.userList.onChange();
            Cryptpad.removeLoadingScreen();
        });
    };

    var setHistory = function (bool, update) {
        history.isHistoryMode = bool;
        setEditable(!bool);
        if (!bool && update) {
            history.onLeaveHistory();
        }
    };

    var setName = APP.setName = function (newName) {
        if (typeof(newName) !== 'string') { return; }
        var myUserNameTemp = newName.trim();
        if(myUserNameTemp.length > 32) {
            myUserNameTemp = myUserNameTemp.substr(0, 32);
        }
        var myUserName = myUserNameTemp;
        Cryptpad.setAttribute('username', myUserName, function (err) {
            if (err) {
                logError("Couldn't set username", err);
                return;
            }
            if (myUserName === "") {
                myUserName = Messages.anonymous;
            }
            APP.$displayName.text(myUserName);
        });
    };

    var migrateAnonDrive = function (proxy, cb) {
        if (sessionStorage.migrateAnonDrive) {
            Merge.anonDriveIntoUser(proxy, function () {
                delete sessionStorage.migrateAnonDrive;
                if (typeof(cb) === "function") { cb(); }
            });
        } else {
            if (typeof(cb) === "function") { cb(); }
        }
    };

    // don't initialize until the store is ready.
    Cryptpad.ready(function () {
        Cryptpad.reportAppUsage();
        if (!Cryptpad.isLoggedIn()) { Cryptpad.feedback('ANONYMOUS_DRIVE'); }
        APP.$bar = $iframe.find('#toolbar');

        var storeObj = Cryptpad.getStore().getProxy && Cryptpad.getStore().getProxy().proxy ? Cryptpad.getStore().getProxy() : undefined;

        if (window.location.hash && window.location.hash === "#iframe") {
            $iframe.find('body').addClass('iframe');
            window.location.hash = "";
            APP.homePageIframe = true;
        }

        var hash = window.location.hash.slice(1) || Cryptpad.getUserHash() || localStorage.FS_hash;
        var secret = Cryptpad.getSecrets('drive', hash);
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
                displayed: ['useradmin', 'spinner', 'lag', 'state', 'limit'],
                userList: {
                    list: userList,
                    userNetfluxId: info.myID
                },
                common: Cryptpad,
                readOnly: readOnly,
                ifrw: window,
                realtime: info.realtime,
                network: info.network,
                $container: APP.$bar
            };
            var toolbar = APP.toolbar = Toolbar.create(config);

            var $rightside = toolbar.$rightside;
            var $leftside = toolbar.$leftside;
            var $userBlock = toolbar.$userAdmin;
            APP.$displayName = APP.$bar.find('.' + Toolbar.constants.username);

            if (APP.homePageIframe) {
                var $linkToMain = toolbar.linkToMain;
                $linkToMain.attr('href', '#');
                $linkToMain.attr('title', '');
                $linkToMain.css('cursor', 'default');
                $linkToMain.off('click');
            }

            /* add the usage */
            if (AppConfig.enablePinLimit) {
                var todo = function (err, state, data) {
                    $leftside.html('');
                    if (!data) {
                        return void window.setTimeout(function () {
                            Cryptpad.isOverPinLimit(todo);
                        }, LIMIT_REFRESH_RATE);
                    }
                    var usage = data.usage;
                    var limit = data.limit;
                    var unit = Messages.MB;
                    var $limit = $('<span>', {'class': 'cryptpad-drive-limit'}).appendTo($leftside);
                    var quota = usage/limit;
                    var width = Math.floor(Math.min(quota, 1)*$limit.width());
                    var $usage = $('<span>', {'class': 'usage'}).css('width', width+'px');

                    if (quota >= 0.8) {
                        var origin = encodeURIComponent(window.location.origin);
                        var $upgradeLink = $('<a>', {
                            href: "https://account.cryptpad.fr/#!on=" + origin,
                            rel: "noreferrer noopener",
                            target: "_blank",
                        }).appendTo($leftside);
                        $('<button>', {
                            'class': 'upgrade buttonSuccess',
                            title: Messages.upgradeTitle
                        }).text(Messages.upgrade).appendTo($upgradeLink);
                    }

                    if (quota < 0.8) { $usage.addClass('normal'); }
                    else if (quota < 1) { $usage.addClass('warning'); }
                    else { $usage.addClass('above'); }
                    var $text = $('<span>', {'class': 'usageText'});
                    $text.text(usage + ' / ' + limit + ' ' + unit);
                    $limit.append($usage).append($text);
                    window.setTimeout(function () {
                        Cryptpad.isOverPinLimit(todo);
                    }, LIMIT_REFRESH_RATE);
                };
                Cryptpad.isOverPinLimit(todo);
            }

            /* add a history button */
            var histConfig = {
                onLocal: function () {
                    proxy.drive = history.currentObj.drive;
                },
                onRemote: function () {},
                setHistory: setHistory,
                applyVal: function (val) {
                    var obj = JSON.parse(val || '{}');
                    history.currentObj = obj;
                    history.onEnterHistory(obj);
                },
                $toolbar: APP.$bar,
                href: window.location.origin + window.location.pathname + APP.hash
            };
            var $hist = Cryptpad.createButton('history', true, {histConfig: histConfig});
            $rightside.append($hist);

            if (!readOnly && !APP.loggedIn) {
                var $backupButton = Cryptpad.createButton('', true).removeClass('fa').removeClass('fa-question');
                $backupButton.append($backupIcon.clone().css('marginRight', '0px'));
                $backupButton.attr('title', Messages.fm_backup_title);
                $backupButton.on('click', function() {
                    var url = window.location.origin + window.location.pathname + '#' + editHash;
                    var msg = Messages.fm_alert_backupUrl + '<input type="text" readonly="readonly" id="fm_backupUrl" value="'+url+'">';
                    Cryptpad.alert(msg, undefined, true);
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
                initLocalStorage();
                init(proxy);
                APP.userList.onChange();
                Cryptpad.removeLoadingScreen();
            });
        };
        var onDisconnect = function () {
            setEditable(false);
            if (APP.refresh) { APP.refresh(); }
            APP.toolbar.failed();
            Cryptpad.alert(Messages.common_connectionLost, undefined, true);
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
