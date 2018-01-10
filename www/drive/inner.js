define([
    'jquery',
    '/common/toolbar3.js',
    'json.sortify',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-ui-elements.js',
    '/common/common-interface.js',
    '/common/common-constants.js',
    '/common/common-feedback.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-realtime.js',
    '/common/userObject.js',
    '/customize/application_config.js',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/customize/messages.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'less!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less2/main.less',
], function (
    $,
    Toolbar,
    JSONSortify,
    Util,
    Hash,
    UIElements,
    UI,
    Constants,
    Feedback,
    nThen,
    SFCommon,
    CommonRealtime,
    FO,
    AppConfig,
    Listmap,
    Messages)
{
    var APP = window.APP = {
        editable: false,
        mobile: function () { return $('body').width() <= 600; } // Menu and content area are not inline-block anymore for mobiles
    };

    var stringify = function (obj) {
        return JSONSortify(obj);
    };

    var E_OVER_LIMIT = 'E_OVER_LIMIT';

    var SEARCH = "search";
    var SEARCH_NAME = Messages.fm_searchName;
    var ROOT = "root";
    var ROOT_NAME = Messages.fm_rootName;
    var FILES_DATA = Constants.storageKey;
    var FILES_DATA_NAME = Messages.fm_filesDataName;
    var TEMPLATE = "template";
    var TEMPLATE_NAME = Messages.fm_templateName;
    var TRASH = "trash";
    var TRASH_NAME = Messages.fm_trashName;
    var RECENT = "recent";
    var RECENT_NAME = Messages.fm_recentPadsName;
    var OWNED = "owned";
    var OWNED_NAME = Messages.fm_ownedPadsName;

    var LS_LAST = "app-drive-lastOpened";
    var LS_OPENED = "app-drive-openedFolders";
    var LS_VIEWMODE = "app-drive-viewMode";
    var LS_SEARCHCURSOR = "app-drive-searchCursor";
    var FOLDER_CONTENT_ID = "cp-app-drive-content-folder";

    var config = {};
    var DEBUG = config.DEBUG = true;
    var debug = config.debug = DEBUG ? function () {
        console.log.apply(console, arguments);
    } : function () { return; };
    var logError = config.logError = function () {
        console.error.apply(console, arguments);
    };
    var log = config.log = UI.log;

    var localStore = window.cryptpadStore;
    APP.store = {};
    var getLastOpenedFolder = function () {
        var path;
        try {
            path = APP.store[LS_LAST] ? JSON.parse(APP.store[LS_LAST]) : [ROOT];
        } catch (e) {
            path = [ROOT];
        }
        return path;
    };
    var setLastOpenedFolder = function (path) {
        if (path[0] === SEARCH) { return; }
        APP.store[LS_LAST] = JSON.stringify(path);
        localStore.put(LS_LAST, JSON.stringify(path));
    };

    var wasFolderOpened = function (path) {
        var stored = JSON.parse(APP.store[LS_OPENED] || '[]');
        return stored.indexOf(JSON.stringify(path)) !== -1;
    };
    var setFolderOpened = function (path, opened) {
        var s = JSON.stringify(path);
        var stored = JSON.parse(APP.store[LS_OPENED] || '[]');
        if (opened && stored.indexOf(s) === -1) {
            stored.push(s);
        }
        if (!opened) {
            var idx = stored.indexOf(s);
            if (idx !== -1) {
                stored.splice(idx, 1);
            }
        }
        APP.store[LS_OPENED] = JSON.stringify(stored);
        localStore.put(LS_OPENED, JSON.stringify(stored));
    };

    var getViewModeClass = function () {
        var mode = APP.store[LS_VIEWMODE];
        if (mode === 'list') { return 'cp-app-drive-content-list'; }
        return 'cp-app-drive-content-grid';
    };
    var getViewMode = function () {
        return APP.store[LS_VIEWMODE] || 'grid';
    };
    var setViewMode = function (mode) {
        if (typeof(mode) !== "string") {
            logError("Incorrect view mode: ", mode);
            return;
        }
        APP.store[LS_VIEWMODE] = mode;
        localStore.put(LS_VIEWMODE, mode);
    };

    var setSearchCursor = function () {
        var $input = $('#cp-app-drive-tree-search-input');
        APP.store[LS_SEARCHCURSOR] = $input[0].selectionStart;
        localStore.put(LS_SEARCHCURSOR, $input[0].selectionStart);
    };
    var getSearchCursor = function () {
        return APP.store[LS_SEARCHCURSOR] || 0;
    };

    var setEditable = function (state) {
        APP.editable = state;
        if (!state) {
            APP.$content.addClass('cp-app-drive-readonly');
            $('[draggable="true"]').attr('draggable', false);
        }
        else {
            APP.$content.removeClass('cp-app-drive-readonly');
            $('[draggable="false"]').attr('draggable', true);
        }
    };

    // Icons
    var $folderIcon = $('<span>', {
        "class": "fa fa-folder cp-app-drive-icon-folder cp-app-drive-content-icon"
    });
    //var $folderIcon = $('<img>', {src: "/customize/images/icons/folder.svg", "class": "folder icon"});
    var $folderEmptyIcon = $folderIcon.clone();
    var $folderOpenedIcon = $('<span>', {"class": "fa fa-folder-open cp-app-drive-icon-folder"});
    //var $folderOpenedIcon = $('<img>', {src: "/customize/images/icons/folderOpen.svg", "class": "folder icon"});
    var $folderOpenedEmptyIcon = $folderOpenedIcon.clone();
    //var $upIcon = $('<span>', {"class": "fa fa-arrow-circle-up"});
    var $unsortedIcon = $('<span>', {"class": "fa fa-files-o"});
    var $templateIcon = $('<span>', {"class": "fa fa-cubes"});
    var $recentIcon = $('<span>', {"class": "fa fa-clock-o"});
    var $trashIcon = $('<span>', {"class": "fa fa-trash"});
    var $trashEmptyIcon = $('<span>', {"class": "fa fa-trash-o"});
    //var $collapseIcon = $('<span>', {"class": "fa fa-minus-square-o cp-app-drive-icon-expcol"});
    var $expandIcon = $('<span>', {"class": "fa fa-plus-square-o cp-app-drive-icon-expcol"});
    var $emptyTrashIcon = $('<button>', {"class": "fa fa-ban"});
    var $listIcon = $('<button>', {"class": "fa fa-list"});
    var $gridIcon = $('<button>', {"class": "fa fa-th-large"});
    var $sortAscIcon = $('<span>', {"class": "fa fa-angle-up sortasc"});
    var $sortDescIcon = $('<span>', {"class": "fa fa-angle-down sortdesc"});
    var $closeIcon = $('<span>', {"class": "fa fa-window-close"});
    //var $backupIcon = $('<span>', {"class": "fa fa-life-ring"});
    var $searchIcon = $('<span>', {"class": "fa fa-search cp-app-drive-tree-search-con"});
    var $addIcon = $('<span>', {"class": "fa fa-plus"});
    var $renamedIcon = $('<span>', {"class": "fa fa-flag"});
    var $readonlyIcon = $('<span>', {"class": "fa fa-eye"});
    var $ownedIcon = $('<span>', {"class": "fa fa-id-card-o"});
    var $ownerIcon = $('<span>', {"class": "fa fa-id-card"});

    var history = {
        isHistoryMode: false,
    };

    var copyObjectValue = function (objRef, objToCopy) {
        for (var k in objRef) { delete objRef[k]; }
        $.extend(true, objRef, objToCopy);
    };
    var updateObject = function (sframeChan, obj, cb) {
        sframeChan.query('Q_DRIVE_GETOBJECT', null, function (err, newObj) {
            copyObjectValue(obj, newObj);
            cb();
        });
    };

    var andThen = function (common, proxy) {
        var files = proxy.drive;
        var metadataMgr = common.getMetadataMgr();
        var sframeChan = common.getSframeChannel();
        var priv = metadataMgr.getPrivateData();
        var user = metadataMgr.getUserData();
        var edPublic = priv.edPublic;

        APP.origin = priv.origin;
        var isOwnDrive = function () {
            return true; // TODO
        };
        var isWorkgroup = function () {
            return files.workgroup === 1;
        };
        config.workgroup = isWorkgroup();
        config.loggedIn = APP.loggedIn;
        config.sframeChan = sframeChan;


        var filesOp = FO.init(files, config);
        var error = filesOp.error;

        var $tree = APP.$tree = $("#cp-app-drive-tree");
        var $content = APP.$content = $("#cp-app-drive-content");
        var $appContainer = $(".cp-app-drive-container");
        var $driveToolbar = $("#cp-app-drive-toolbar");
        var $contextMenu = $("#cp-app-drive-context-tree");
        var $contentContextMenu = $("#cp-app-drive-context-content");
        var $defaultContextMenu = $("#cp-app-drive-context-default");
        var $trashTreeContextMenu = $("#cp-app-drive-context-trashtree");
        var $trashContextMenu = $("#cp-app-drive-context-trash");

        $tree.on('drop dragover', function (e) {
            e.preventDefault();
            e.stopPropagation();
        });
        $driveToolbar.on('drop dragover', function (e) {
            e.preventDefault();
            e.stopPropagation();
        });



        // TOOLBAR

        /* add a "change username" button */
        if (!APP.readOnly) {
            APP.$displayName.text(user.name || Messages.anonymous);
        } else {
            APP.$displayName.html('<span class="' + Toolbar.constants.readonly + '">' + Messages.readonly + '</span>');
        }

        // FILE MANAGER
        // _WORKGROUP_ and other people drive : display Documents as main page
        var currentPath = APP.currentPath = isOwnDrive() ? getLastOpenedFolder() : [ROOT];

        // Categories dislayed in the menu
        // _WORKGROUP_ : do not display unsorted
        var displayedCategories = [ROOT, TRASH, SEARCH, RECENT];
        if (AppConfig.displayCreationScreen) { displayedCategories.push(OWNED); }
        if (AppConfig.enableTemplates) { displayedCategories.push(TEMPLATE); }
        if (isWorkgroup()) { displayedCategories = [ROOT, TRASH, SEARCH]; }
        var virtualCategories = [SEARCH, RECENT, OWNED];

        if (!APP.loggedIn) {
            displayedCategories = [FILES_DATA];
            currentPath = [FILES_DATA];
            $tree.hide();
            if (Object.keys(files.root).length && !proxy.anonymousAlert) {
                UI.alert(Messages.fm_alert_anonymous, null, true);
                proxy.anonymousAlert = true;
            }
        }

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
            return $el.is('.cp-app-drive-element-row') ? $el : $el.closest('.cp-app-drive-element-row');
        };


        // Selection
        var sel = {};

        var removeSelected =  function (keepObj) {
            $('.cp-app-drive-element-selected').removeClass("cp-app-drive-element-selected");
            var $container = $driveToolbar.find('#cp-app-drive-toolbar-contextbuttons');
            if (!$container.length) { return; }
            $container.html('');
            if (!keepObj) {
                delete sel.startSelected;
                delete sel.endSelected;
                delete sel.oldSelection;
            }
        };

        sel.refresh = 200;
        sel.$selectBox = $('<div>', {'class': 'cp-app-drive-content-select-box'}).appendTo($content);
        var checkSelected = function () {
            if (!sel.down) { return; }
            var pos = sel.pos;
            var l = $content[0].querySelectorAll('.cp-app-drive-element:not(.cp-app-drive-element-selected):not(.cp-app-drive-element-header)');
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
                    $(el).removeClass('cp-app-drive-element-selected-tmp');
                } else {
                    $(el).addClass('cp-app-drive-element-selected-tmp');
                }
            }
        };
        $content.on('mousedown', function (e) {
            if (currentPath[0] === SEARCH) { return; }
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
            APP.hideMenu(e);
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
        $(window).on('mouseup', function (e) {
            if (!sel.down) { return; }
            if (e.which !== 1) { return; }
            sel.down = false;
            sel.$selectBox.hide();
            $content.off('mousemove', sel.move);
            delete sel.move;
            $content.find('.cp-app-drive-element-selected-tmp')
                .removeClass('cp-app-drive-element-selected-tmp')
                .addClass('cp-app-drive-element-selected');
            e.stopPropagation();
        });

        // Arrow keys to modify the selection
        $(window).keydown(function (e) {
            var $searchBar = $tree.find('#cp-app-drive-tree-search-input');
            if ($searchBar.is(':focus') && $searchBar.val()) { return; }

            var $elements = $content.find('.cp-app-drive-element:not(.cp-app-drive-element-header)');

            var ev = {};
            if (e.ctrlKey) { ev.ctrlKey = true; }
            if (e.shiftKey) { ev.shiftKey = true; }

            // Enter
            if (e.which === 13) {
                var $allSelected = $content.find('.cp-app-drive-element.cp-app-drive-element-selected');
                if ($allSelected.length === 1) {
                    // Open the folder or the file
                    $allSelected.dblclick();
                    return;
                }
                // If more than one, open only the files
                var $select = $content.find('.cp-app-drive-element-file.cp-app-drive-element-selected');
                $select.each(function (idx, el) {
                    $(el).dblclick();
                });
                return;
            }

            // [Left, Up, Right, Down]
            if ([37, 38, 39, 40].indexOf(e.which) === -1) { return; }
            e.preventDefault();

            var click = function (el) {
                if (!el) { return; }
                APP.onElementClick(ev, $(el));
            };

            var $selection = $content.find('.cp-app-drive-element.cp-app-drive-element-selected');
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
            if (!cancel && $('.cp-app-drive-element-row > input').length === 1) {
                var $input = $('.cp-app-drive-element-row > input');
                filesOp.rename($input.data('path'), $input.val(), APP.refresh);
            }
            $('.cp-app-drive-element-row > input').remove();
            $('.cp-app-drive-element-row > span:hidden').removeAttr('style');
        };

        var compareDays = function (date1, date2) {
            var day1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
            var day2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
            var ms = Math.abs(day1-day2);
            return Math.floor(ms/1000/60/60/24);
        };

        var getDate = function (sDate) {
            if (!sDate) { return ''; }
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

        var openFile = function (el, href) {
            if (!href) {
                var data = filesOp.getFileData(el);
                if (!data || !data.href) {
                    return void logError("Missing data for the file", el, data);
                }
                href = data.href;
            }
            window.open(APP.origin + href);
        };

        var refresh = APP.refresh = function () {
            APP.displayDirectory(currentPath);
        };

        var getFileNameExtension = function (name) {
            var matched = /\.[^\. ]+$/.exec(name);
            if (matched && matched.length) { return matched[matched.length -1]; }
            return '';
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
                var $name = $element.find('.cp-app-drive-element-name');
                if (!$name.length) {
                    $name = $element.find('> .cp-app-drive-element');
                }
                $name.hide();
                var el = filesOp.find(path);
                var name = filesOp.isFile(el) ? filesOp.getTitle(el)  : path[path.length - 1];
                var $input = $('<input>', {
                    placeholder: name,
                    value: name
                }).data('path', path);


                // Stop propagation on keydown to avoid issues with arrow keys
                $input.on('keydown', function (e) { e.stopPropagation(); });

                $input.on('keyup', function (e) {
                    e.stopPropagation();
                    if (e.which === 13) {
                        removeInput(true);
                        filesOp.rename(path, $input.val(), refresh);
                        return;
                    }
                    if (e.which === 27) {
                        removeInput(true);
                    }
                }).on('keypress', function (e) { e.stopPropagation(); });
                //$element.parent().append($input);
                $name.after($input);
                $input.focus();

                var extension = getFileNameExtension(name);
                var input = $input[0];
                input.selectionStart = 0;
                input.selectionEnd = name.length - extension.length;

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
                    $input.parents('.cp-app-drive-element-row').attr("draggable", false);
                });
                $input.on('mouseup', function (e) {
                    e.stopPropagation();
                    $input.parents('.cp-app-drive-element-row').attr("draggable", true);
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
                    // Can't rename or delete root elements
                    hide.push($menu.find('a.cp-app-drive-context-rename'));
                    hide.push($menu.find('a.cp-app-drive-context-delete'));
                }
                if (!APP.editable) {
                    hide.push($menu.find('a.cp-app-drive-context-editable'));
                }
                if (!isOwnDrive()) {
                    hide.push($menu.find('a.cp-app-drive-context-own'));
                }
                if (!$element.is('.cp-app-drive-element-owned')) {
                    hide.push($menu.find('a.cp-app-drive-context-deleteowned'));
                }
                if ($element.is('.cp-app-drive-element-notrash')) {
                    hide.push($menu.find('a.cp-app-drive-context-delete'));
                }
                if ($element.is('.cp-app-drive-element-file')) {
                    // No folder in files
                    hide.push($menu.find('a.cp-app-drive-context-newfolder'));
                    if ($element.is('.cp-app-drive-element-readonly')) {
                        // Keep only open readonly
                        hide.push($menu.find('a.cp-app-drive-context-open'));
                    } else if ($element.is('.cp-app-drive-element-noreadonly')) {
                        // Keep only open readonly
                        hide.push($menu.find('a.cp-app-drive-context-openro'));
                    }
                } else {
                    if (hasFolder) {
                        // More than 1 folder selected: cannot create a new subfolder
                        hide.push($menu.find('a.cp-app-drive-context-newfolder'));
                    }
                    hasFolder = true;
                    hide.push($menu.find('a.cp-app-drive-context-openro'));
                    hide.push($menu.find('a.cp-app-drive-context-properties'));
                    hide.push($menu.find('a.cp-app-drive-context-hashtag'));
                }
                // If we're in the trash, hide restore and properties for non-root elements
                if ($menu.find('a.cp-app-drive-context-restore').length && path && path.length > 4) {
                    hide.push($menu.find('a.cp-app-drive-context-restore'));
                    hide.push($menu.find('a.cp-app-drive-context-properties'));
                }
            });
            if (paths.length > 1) {
                hide.push($menu.find('a.cp-app-drive-context-restore'));
                hide.push($menu.find('a.cp-app-drive-context-properties'));
                hide.push($menu.find('a.cp-app-drive-context-rename'));
            }
            if (hasFolder && paths.length > 1) {
                // Cannot open multiple folders
                hide.push($menu.find('a.cp-app-drive-context-open'));
            }
            return hide;
        };

        var getSelectedPaths = function ($element) {
            var paths = [];
            if ($('.cp-app-drive-element-selected').length > 1) {
                var $selected = $('.cp-app-drive-element-selected');
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
            if (filesOp.isPathIn(currentPath, [TRASH])) {
                $driveToolbar.find('cp-app-drive-toolbar-emptytrash').show();
            } else {
                $driveToolbar.find('cp-app-drive-toolbar-emptytrash').hide();
            }
            var $li = $content.find('.cp-app-drive-element-selected');
            if ($li.length === 0) {
                $li = findDataHolder($tree.find('.cp-app-drive-element-active'));
            }
            var $button = $driveToolbar.find('#cp-app-drive-toolbar-context-mobile');
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
            var $container = $driveToolbar.find('#cp-app-drive-toolbar-contextbuttons');
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
                var $a = $('<button>', {'class': 'cp-app-drive-element'});
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
        var onElementClick = APP.onElementClick = function (e, $element) {
            // If "Ctrl" is pressed, do not remove the current selection
            removeInput();
            $element = findDataHolder($element);
            // If we're selecting a new element with the left click, hide the menu
            if (e) { APP.hideMenu(); }
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
            var $elements = $content.find('.cp-app-drive-element:not(.cp-app-drive-element-header)');
            var $selection = $elements.filter('.cp-app-drive-element-selected');
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
                    if (!$(el).hasClass("cp-app-drive-element-selected")) {
                        $(el).addClass("cp-app-drive-element-selected");
                    }
                });
                for (var i = Math.min(sel.startSelected, sel.endSelected);
                     i <= Math.max(sel.startSelected, sel.endSelected);
                     i++) {
                    $el = $($elements.get(i));
                    if (!$el.hasClass("cp-app-drive-element-selected")) {
                        $el.addClass("cp-app-drive-element-selected");
                    }
                }
            } else {
                if (!$element.hasClass("cp-app-drive-element-selected")) {
                    $element.addClass("cp-app-drive-element-selected");
                } else {
                    $element.removeClass("cp-app-drive-element-selected");
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
            APP.hideMenu();
            e.stopPropagation();

            var $element = findDataHolder($(e.target));
            if (!$element.length) {
                logError("Unable to locate the .element tag", e.target);
                $menu.hide();
                log(Messages.fm_contextMenuError);
                return false;
            }

            if (!$element.hasClass('cp-app-drive-element-selected')) { //paths.length === 1) {
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
            APP.hideMenu();
            e.stopPropagation();
            var path = $(e.target).closest('#' + FOLDER_CONTENT_ID).data('path');
            if (!path) { return; }
            var $menu = $contentContextMenu;
            removeSelected();

            if (!APP.editable) {
                $menu.find('a.cp-app-drive-context-editable').parent('li').hide();
            }
            if (!isOwnDrive()) {
                $menu.find('a.cp-app-drive-context-own').parent('li').hide();
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
            var file = filesOp.find(path);
            if (!file || !filesOp.isFile(file)) { return '???'; }
            return filesOp.getTitle(file);
        };
        // filesOp.moveElements is able to move several paths to a new location, including
        // the Trash or the "Unsorted files" folder
        var moveElements = function (paths, newPath, force, cb) {
            if (!APP.editable) { return; }
            var andThenMove = function () {
                filesOp.move(paths, newPath, cb);
            };
            // Cancel drag&drop from TRASH to TRASH
            if (filesOp.isPathIn(newPath, [TRASH]) && paths.length && paths[0][0] === TRASH) {
                return;
            }
            andThenMove();
        };
        // Drag & drop:
        // The data transferred is a stringified JSON containing the path of the dragged element
        var onDrag = function (ev, path) {
            var paths = [];
            var $element = findDataHolder($(ev.target));
            if ($element.hasClass('cp-app-drive-element-selected')) {
                var $selected = $('.cp-app-drive-element-selected');
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
                $element.addClass('cp-app-drive-element-selected');
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

        var findDropPath = function (target) {
            var $target = $(target);
            var $el = findDataHolder($target);
            var newPath = $el.data('path');
            if ((!newPath || filesOp.isFile(filesOp.find(newPath)))
                    && $target.parents('#cp-app-drive-content')) {
                newPath = currentPath;
            }
            return newPath;
        };
        var onFileDrop = APP.onFileDrop = function (file, e) {
            var ev = {
                target: e.target,
                path: findDropPath(e.target)
            };
            APP.FM.onFileDrop(file, ev);
        };
        var onDrop = function (ev) {
            ev.preventDefault();
            $('.cp-app-drive-element-droppable').removeClass('cp-app-drive-element-droppable');
            var data = ev.dataTransfer.getData("text");

            // Don't the the normal drop handler for file upload
            var fileDrop = ev.dataTransfer.files;
            if (fileDrop.length) { return void onFileDrop(fileDrop, ev); }

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

            var newPath = findDropPath(ev.target);
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
                e.preventDefault();
                e.stopPropagation();
                onDrop(e.originalEvent);
            });
            $element.on('dragenter', function (e) {
                e.preventDefault();
                e.stopPropagation();
                counter++;
                $element.addClass('cp-app-drive-element-droppable');
            });
            $element.on('dragleave', function (e) {
                e.preventDefault();
                e.stopPropagation();
                counter--;
                if (counter <= 0) {
                    counter = 0;
                    $element.removeClass('cp-app-drive-element-droppable');
                }
            });
        };
        addDragAndDropHandlers($content, null, true, true);

        // In list mode, display metadata from the filesData object
        // _WORKGROUP_ : Do not display title, atime and ctime columns since we don't have files data
        var addFileData = function (element, $span) {
            if (!filesOp.isFile(element)) { return; }

            var data = filesOp.getFileData(element);
            if (!data) { return void logError("No data for the file", element); }

            var hrefData = Hash.parsePadUrl(data.href);
            if (hrefData.type) {
                $span.addClass('cp-border-color-'+hrefData.type);
            }

            var $state = $('<span>', {'class': 'cp-app-drive-element-state'});
            if (hrefData.hashData && hrefData.hashData.mode === 'view') {
                var $ro = $readonlyIcon.clone().appendTo($state);
                $ro.attr('title', Messages.readonly);
            }
            if (data.filename && data.filename !== data.title) {
                var $renamed = $renamedIcon.clone().appendTo($state);
                $renamed.attr('title', Messages._getKey('fm_renamedPad', [data.title]));
            }
            if (data.owners && data.owners.indexOf(edPublic) !== -1) {
                var $owned = $ownedIcon.clone().appendTo($state);
                $owned.attr('title', Messages.fm_padIsOwned);
                $span.addClass('cp-app-drive-element-owned');
            } else if (data.owners && data.owners.length) {
                var $owner = $ownerIcon.clone().appendTo($state);
                $owner.attr('title', Messages.fm_padIsOwnedOther);
            }

            var name = filesOp.getTitle(element);

            // The element with the class '.name' is underlined when the 'li' is hovered
            var $name = $('<span>', {'class': 'cp-app-drive-element-name'}).text(name);
            $span.append($name);
            $span.append($state);
            $span.attr('title', name);

            var type = Messages.type[hrefData.type] || hrefData.type;
            common.displayThumbnail(data.href, $span, function ($thumb) {
                // Called only if the thumbnail exists
                // Remove the .hide() added by displayThumnail() because it hides the icon in
                // list mode too
                $span.find('.cp-icon').removeAttr('style').addClass('cp-app-drive-element-list');
                $thumb.addClass('cp-app-drive-element-grid')
                    .addClass('cp-app-drive-element-thumbnail');
            });
            var $type = $('<span>', {
                'class': 'cp-app-drive-element-type cp-app-drive-element-list'
            }).text(type);
            var $adate = $('<span>', {
                'class': 'cp-app-drive-element-atime cp-app-drive-element-list'
            }).text(getDate(data.atime));
            var $cdate = $('<span>', {
                'class': 'cp-app-drive-element-ctime cp-app-drive-element-list'
            }).text(getDate(data.ctime));
            $span.append($type);
            if (!isWorkgroup()) {
                $span.append($adate).append($cdate);
            }
        };

        var addFolderData = function (element, key, $span) {
            if (!element || !filesOp.isFolder(element)) { return; }
            // The element with the class '.name' is underlined when the 'li' is hovered
            var sf = filesOp.hasSubfolder(element);
            var files = filesOp.hasFile(element);
            var $name = $('<span>', {'class': 'cp-app-drive-element-name'}).text(key);
            var $state = $('<span>', {'class': 'cp-app-drive-element-state'});
            var $subfolders = $('<span>', {
                'class': 'cp-app-drive-element-folders cp-app-drive-element-list'
            }).text(sf);
            var $files = $('<span>', {
                'class': 'cp-app-drive-element-files cp-app-drive-element-list'
            }).text(files);
            $span.attr('title', key);
            $span.append($name).append($state).append($subfolders).append($files);
        };

        // This is duplicated in cryptpad-common, it should be unified
        var getFileIcon = function (id) {
            var data = filesOp.getFileData(id);
            return UI.getFileIcon(data);
        };
        var getIcon = UI.getIcon;

        // Create the "li" element corresponding to the file/folder located in "path"
        var createElement = function (path, elPath, root, isFolder) {
            // Forbid drag&drop inside the trash
            var isTrash = path[0] === TRASH;
            var newPath = path.slice();
            var key;
            if (isTrash && Array.isArray(elPath)) {
                key = elPath[0];
                elPath.forEach(function (k) { newPath.push(k); });
            } else {
                key = elPath;
                newPath.push(key);
            }

            var element = filesOp.find(newPath);
            var $icon = !isFolder ? getFileIcon(element) : undefined;
            var ro = filesOp.isReadOnlyFile(element);
            // ro undefined means it's an old hash which doesn't support read-only
            var roClass = typeof(ro) === 'undefined' ?' cp-app-drive-element-noreadonly' :
                            ro ? ' cp-app-drive-element-readonly' : '';
            var liClass = 'cp-app-drive-element-file cp-app-drive-element' + roClass;
            if (isFolder) {
                liClass = 'cp-app-drive-element-folder cp-app-drive-element';
                $icon = filesOp.isFolderEmpty(root[key]) ? $folderEmptyIcon.clone() : $folderIcon.clone();
            }
            var $element = $('<li>', {
                draggable: true,
                'class': 'cp-app-drive-element-row'
            });
            if (!isFolder && Array.isArray(APP.selectedFiles)) {
                var idx = APP.selectedFiles.indexOf(element);
                if (idx !== -1) {
                    $element.addClass('cp-app-drive-element-selected');
                    APP.selectedFiles.splice(idx, 1);
                }
            }
            $element.prepend($icon).dblclick(function () {
                if (isFolder) {
                    APP.displayDirectory(newPath);
                    return;
                }
                if (isTrash) { return; }
                openFile(root[key]);
            });
            if (isFolder) {
                addFolderData(element, key, $element);
            } else {
                addFileData(element, $element);
            }
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
            var isNewFolder = APP.newFolder && filesOp.comparePath(newPath, APP.newFolder);
            if (isNewFolder) {
                appStatus.onReady(function () {
                    window.setTimeout(function () { displayRenameInput($element, newPath); }, 0);
                });
                delete APP.newFolder;
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
                case RECENT: pName = RECENT_NAME; break;
                default: pName = name;
            }
            return pName;
        };

        // Create the title block with the "parent folder" button
        var createTitle = function ($container, path, noStyle) {
            if (!path || path.length === 0) { return; }
            var isTrash = filesOp.isPathIn(path, [TRASH]);
            if (APP.mobile() && !noStyle) { // noStyle means title in search result
                return $container;
            }
            var isVirtual = virtualCategories.indexOf(path[0]) !== -1;
            var el = isVirtual ? undefined : filesOp.find(path);
            path = path[0] === SEARCH ? path.slice(0,1) : path;
            path.forEach(function (p, idx) {
                if (isTrash && [2,3].indexOf(idx) !== -1) { return; }

                var name = p;

                var $span = $('<span>', {'class': 'cp-app-drive-path-element'});
                if (idx < path.length - 1) {
                    if (!noStyle) {
                        $span.addClass('cp-app-drive-path-clickable');
                        $span.click(function () {
                            var sliceEnd = idx + 1;
                            if (isTrash && idx === 1) { sliceEnd = 4; } // Make sure we don't show the index or 'element' and 'path'
                            APP.displayDirectory(path.slice(0, sliceEnd));
                        });
                    }
                } else if (idx > 0 && filesOp.isFile(el)) {
                    name = getElementName(path);
                }

                if (idx === 0) { name = getPrettyName(p); }
                else {
                    var $span2 = $('<span>', {
                        'class': 'cp-app-drive-path-element cp-app-drive-path-separator'
                    }).text(' / ');
                    $container.prepend($span2);
                }

                $span.text(name).prependTo($container);
            });
        };

        var createInfoBox = function (path) {
            var $box = $('<div>', {'class': 'cp-app-drive-content-info-box'});
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
                case RECENT:
                    msg = Messages.fm_info_recent;
                    break;
                case OWNED:
                    msg = Messages.fm_info_owned;
                    break;
                default:
                    msg = undefined;
            }
            if (!APP.loggedIn) {
                msg = Messages.fm_info_anonymous;
                $box.html(msg);
                return $box;
            }
            if (!msg || APP.store['hide-info-' + path[0]] === '1') {
                $box.hide();
            } else {
                $box.text(msg);
                var $close = $closeIcon.clone().css({
                    'cursor': 'pointer',
                    'margin-left': '10px',
                    title: Messages.fm_closeInfoBox
                }).on('click', function () {
                    $box.hide();
                    APP.store['hide-info-' + path[0]] = '1';
                    localStore.put('hide-info-' + path[0], '1');
                });
                $box.prepend($close);
            }
            return $box;
        };

        // Create the button allowing the user to switch from list to icons modes
        var createViewModeButton = function ($container) {
            var $listButton = $listIcon.clone();
            var $gridButton = $gridIcon.clone();

            $listButton.click(function () {
                $gridButton.removeClass('cp-app-drive-toolbar-active');
                $listButton.addClass('cp-app-drive-toolbar-active');
                setViewMode('list');
                $('#' + FOLDER_CONTENT_ID).removeClass('cp-app-drive-content-grid');
                $('#' + FOLDER_CONTENT_ID).addClass('cp-app-drive-content-list');
                Feedback.send('DRIVE_LIST_MODE');
            });
            $gridButton.click(function () {
                $listButton.removeClass('cp-app-drive-toolbar-active');
                $gridButton.addClass('cp-app-drive-toolbar-active');
                setViewMode('grid');
                $('#' + FOLDER_CONTENT_ID).addClass('cp-app-drive-content-grid');
                $('#' + FOLDER_CONTENT_ID).removeClass('cp-app-drive-content-list');
                Feedback.send('DRIVE_GRID_MODE');
            });

            if (getViewMode() === 'list') {
                $listButton.addClass('cp-app-drive-toolbar-active');
            } else {
                $gridButton.addClass('cp-app-drive-toolbar-active');
            }
            $listButton.attr('title', Messages.fm_viewListButton);
            $gridButton.attr('title', Messages.fm_viewGridButton);
            $container.append($listButton).append($gridButton);
        };
        var createEmptyTrashButton = function ($container) {
            var $button = $emptyTrashIcon.clone();
            $button.addClass('cp-app-drive-toolbar-emptytrash');
            $button.attr('title', Messages.fc_empty);
            $button.click(function () {
                UI.confirm(Messages.fm_emptyTrashDialog, function(res) {
                    if (!res) { return; }
                    filesOp.emptyTrash(refresh);
                });
            });
            $container.append($button);
        };

        var getNewPadTypes = function () {
            var arr = [];
            AppConfig.availablePadTypes.forEach(function (type) {
                if (type === 'drive') { return; }
                if (type === 'contacts') { return; }
                if (type === 'todo') { return; }
                if (type === 'file') { return; }
                if (!APP.loggedIn && AppConfig.registeredOnlyTypes &&
                    AppConfig.registeredOnlyTypes.indexOf(type) !== -1) {
                    return;
                }
                arr.push(type);
            });
            return arr;
        };
        var addNewPadHandlers = function ($block, isInRoot) {
            // Handlers
            if (isInRoot) {
                var onCreated = function (err, info) {
                    if (err) {
                        if (err === E_OVER_LIMIT) {
                            return void UI.alert(Messages.pinLimitDrive, null, true);
                        }
                        return void UI.alert(Messages.fm_error_cantPin);
                    }
                    APP.newFolder = info.newPath;
                    refresh();
                };
                $block.find('a.cp-app-drive-new-folder, li.cp-app-drive-new-folder')
                    .click(function () {
                    filesOp.addFolder(currentPath, null, onCreated);
                });
                $block.find('a.cp-app-drive-new-upload, li.cp-app-drive-new-upload')
                    .click(function () {
                    var $input = $('<input>', {
                        'type': 'file',
                        'style': 'display: none;'
                    }).on('change', function (e) {
                        var file = e.target.files[0];
                        var ev = {
                            target: $content[0],
                            path: findDropPath($content[0])
                        };
                        APP.FM.handleFile(file, ev);
                    });
                    $input.click();
                });
            }
            $block.find('a.cp-app-drive-new-doc, li.cp-app-drive-new-doc')
                .click(function () {
                var type = $(this).attr('data-type') || 'pad';
                var path = filesOp.isPathIn(currentPath, [TRASH]) ? '' : currentPath;
                common.sessionStorage.put(Constants.newPadPathKey, path, function () {
                    common.openURL('/' + type + '/');
                });
            });
        };
        var createNewButton = function (isInRoot, $container) {
            if (!APP.editable) { return; }
            if (!APP.loggedIn) { return; } // Anonymous users can use the + menu in the toolbar

            if (!filesOp.isPathIn(currentPath, [ROOT, 'hrefArray'])) { return; }

            // Create dropdown
            var options = [];
            if (isInRoot) {
                options.push({
                    tag: 'a',
                    attributes: {'class': 'cp-app-drive-new-folder'},
                    content: $('<div>').append($folderIcon.clone()).html() + Messages.fm_folder
                });
                options.push({tag: 'hr'});
                options.push({
                    tag: 'a',
                    attributes: {'class': 'cp-app-drive-new-upload'},
                    content: $('<div>').append(getIcon('file')).html() + Messages.uploadButton
                });
                options.push({tag: 'hr'});
            }
            getNewPadTypes().forEach(function (type) {
                var attributes = {
                    'class': 'cp-app-drive-new-doc',
                    'data-type': type,
                    'href': '#'
                };
                options.push({
                    tag: 'a',
                    attributes: attributes,
                    content: $('<div>').append(getIcon(type)).html() + Messages.type[type]
                });
            });
            var $plusIcon = $('<div>').append($('<span>', {'class': 'fa fa-plus'}));


            var dropdownConfig = {
                text: $plusIcon.html() + '<span>'+Messages.fm_newButton+'</span>',
                options: options,
                feedback: 'DRIVE_NEWPAD_LOCALFOLDER',
                common: common
            };
            var $block = UIElements.createDropdown(dropdownConfig);

            // Custom style:
            $block.find('button').addClass('cp-app-drive-toolbar-new');
            $block.find('button').attr('title', Messages.fm_newButtonTitle);

            addNewPadHandlers($block, isInRoot);

            $container.append($block);
        };

        var hideNewButton = function () {
            $('.cp-dropdown-content').hide();
        };

        var SORT_FOLDER_DESC = 'sortFoldersDesc';
        var SORT_FILE_BY = 'sortFilesBy';
        var SORT_FILE_DESC = 'sortFilesDesc';

        var getSortFileDesc = function () {
            return APP.store[SORT_FILE_DESC]+"" === "true";
        };
        var getSortFolderDesc = function () {
            return APP.store[SORT_FOLDER_DESC]+"" === "true";
        };

        var onSortByClick = function () {
            var $span = $(this);
            var value;
            if ($span.hasClass('cp-app-drive-sort-foldername')) {
                value = getSortFolderDesc();
                APP.store[SORT_FOLDER_DESC] = value ? false : true;
                localStore.put(SORT_FOLDER_DESC, value ? false : true);
                refresh();
                return;
            }
            value = APP.store[SORT_FILE_BY];
            var descValue = getSortFileDesc();
            if ($span.hasClass('cp-app-drive-sort-filename')) {
                if (value === '') {
                    descValue = descValue ? false : true;
                } else {
                    descValue = false;
                    value = '';
                }
            } else {
                ['cp-app-drive-element-title', 'cp-app-drive-element-type',
                 'cp-app-drive-element-atime', 'cp-app-drive-element-ctime'].some(function (c) {
                    if ($span.hasClass(c)) {
                        var nValue = c.replace(/cp-app-drive-element-/, '');
                        if (value === nValue) { descValue = descValue ? false : true; }
                        else {
                            // atime and ctime should be ordered in a desc order at the first click
                            value = nValue;
                            descValue = value !== 'title';
                        }
                        return true;
                    }
                });
            }
            APP.store[SORT_FILE_BY] = value;
            APP.store[SORT_FILE_DESC] = descValue;
            localStore.put(SORT_FILE_BY, value);
            localStore.put(SORT_FILE_DESC, descValue);
            refresh();
        };

        var addFolderSortIcon = function ($list) {
            var $icon = $sortAscIcon.clone();
            if (getSortFolderDesc()) {
                $icon = $sortDescIcon.clone();
            }
            if (typeof(APP.store[SORT_FOLDER_DESC]) !== "undefined") {
                $list.find('.cp-app-drive-sort-foldername').addClass('cp-app-drive-sort-active').prepend($icon);
            }
        };
        var getFolderListHeader = function () {
            var $fohElement = $('<li>', {
                'class': 'cp-app-drive-element-header cp-app-drive-element-list'
            });
            //var $fohElement = $('<span>', {'class': 'element'}).appendTo($folderHeader);
            var $fhIcon = $('<span>', {'class': 'cp-app-drive-content-icon'});
            var $name = $('<span>', {
                'class': 'cp-app-drive-element-name cp-app-drive-sort-foldername ' +
                         'cp-app-drive-sort-clickable'
            }).text(Messages.fm_folderName).click(onSortByClick);
            var $state = $('<span>', {'class': 'cp-app-drive-element-state'});
            var $subfolders = $('<span>', {
                'class': 'cp-app-drive-element-folders cp-app-drive-element-list'
            }).text(Messages.fm_numberOfFolders);
            var $files = $('<span>', {
                'class': 'cp-app-drive-element-files cp-app-drive-element-list'
            }).text(Messages.fm_numberOfFiles);
            $fohElement.append($fhIcon).append($name).append($state)
                        .append($subfolders).append($files);
            addFolderSortIcon($fohElement);
            return $fohElement;
        };
        var addFileSortIcon = function ($list) {
            var $icon = $sortAscIcon.clone();
            if (getSortFileDesc()) {
                $icon = $sortDescIcon.clone();
            }
            var classSorted;
            if (APP.store[SORT_FILE_BY] === '') { classSorted = 'cp-app-drive-sort-filename'; }
            else if (APP.store[SORT_FILE_BY]) { classSorted = 'cp-app-drive-element-' + APP.store[SORT_FILE_BY]; }
            if (classSorted) {
                $list.find('.' + classSorted).addClass('cp-app-drive-sort-active').prepend($icon);
            }
        };
        // _WORKGROUP_ : do not display title, atime and ctime in workgroups since we don't have files data
        var getFileListHeader = function () {
            var $fihElement = $('<li>', {
                'class': 'cp-app-drive-element-header cp-app-drive-element-list'
            });
            //var $fihElement = $('<span>', {'class': 'element'}).appendTo($fileHeader);
            var $fhIcon = $('<span>', {'class': 'cp-app-drive-content-icon'});
            var $fhName = $('<span>', {
                'class': 'cp-app-drive-element-name cp-app-drive-sort-filename ' +
                         'cp-app-drive-sort-clickable'
            }).text(Messages.fm_fileName).click(onSortByClick);
            var $fhState = $('<span>', {'class': 'cp-app-drive-element-state'});
            var $fhType = $('<span>', {
                'class': 'cp-app-drive-element-type cp-app-drive-sort-clickable'
            }).text(Messages.fm_type).click(onSortByClick);
            var $fhAdate = $('<span>', {
                'class': 'cp-app-drive-element-atime cp-app-drive-sort-clickable'
            }).text(Messages.fm_lastAccess).click(onSortByClick);
            var $fhCdate = $('<span>', {
                'class': 'cp-app-drive-element-ctime cp-app-drive-sort-clickable'
            }).text(Messages.fm_creation).click(onSortByClick);
            // If displayTitle is false, it means the "name" is the title, so do not display the "name" header
            $fihElement.append($fhIcon).append($fhName).append($fhState).append($fhType);
            if (!isWorkgroup()) {
                $fihElement.append($fhAdate).append($fhCdate);
            }
            addFileSortIcon($fihElement);
            return $fihElement;
        };

        var sortElements = function (folder, path, oldkeys, prop, asc, useId) {
            var root = path && filesOp.find(path);
            var test = folder ? filesOp.isFolder : filesOp.isFile;
            var keys = oldkeys.filter(function (e) {
                return useId ? test(e) : (path && test(root[e]));
            });
            if (keys.length < 2) { return keys; }
            var mult = asc ? 1 : -1;
            var getProp = function (el, prop) {
                if (folder) { return el.toLowerCase(); }
                var id = useId ? el : root[el];
                var data = filesOp.getFileData(id);
                if (!data) { return ''; }
                if (prop === 'type') {
                    var hrefData = Hash.parsePadUrl(data.href);
                    return hrefData.type;
                }
                if (prop === 'atime' || prop === 'ctime') {
                    return new Date(data[prop]);
                }
                return (filesOp.getTitle(id) || "").toLowerCase();
            };
            keys.sort(function(a, b) {
                if (getProp(a, prop) < getProp(b, prop)) { return mult * -1; }
                if (getProp(a, prop) > getProp(b, prop)) { return mult * 1; }
                return 0;
            });
            return keys;
        };
        var sortTrashElements = function (folder, oldkeys, prop, asc) {
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
                        var hrefData = Hash.parsePadUrl(e.href);
                        return hrefData.type;
                    }
                    if (prop === 'atime' || prop === 'ctime') {
                        return new Date(e[prop]);
                    }
                }
                return (el.name || "").toLowerCase();
            };
            keys.sort(function(a, b) {
                if (getProp(a, prop) < getProp(b, prop)) { return mult * -1; }
                if (getProp(a, prop) > getProp(b, prop)) { return mult * 1; }
                return 0;
            });
            return keys;
        };

        // Create the ghost icon to add pads/folders
        var createNewPadIcons = function ($block, isInRoot) {
            var $container = $('<div>');
            if (isInRoot) {
                // Folder
                var $element1 = $('<li>', {
                    'class': 'cp-app-drive-new-folder cp-app-drive-element-row ' +
                             'cp-app-drive-element-grid'
                }).prepend($folderIcon.clone()).appendTo($container);
                $element1.append($('<span>', { 'class': 'cp-app-drive-new-name' })
                    .text(Messages.fm_folder));
                // File
                var $element2 = $('<li>', {
                    'class': 'cp-app-drive-new-upload cp-app-drive-element-row ' +
                             'cp-app-drive-element-grid'
                }).prepend(getIcon('file')).appendTo($container);
                $element2.append($('<span>', {'class': 'cp-app-drive-new-name'})
                    .text(Messages.uploadButton));
            }
            // Pads
            getNewPadTypes().forEach(function (type) {
                var $element = $('<li>', {
                    'class': 'cp-app-drive-new-doc cp-app-drive-element-row ' +
                             'cp-app-drive-element-grid'
                }).prepend(getIcon(type)).appendTo($container);
                $element.append($('<span>', {'class': 'cp-app-drive-new-name'})
                    .text(Messages.type[type]));
                $element.attr('data-type', type);
            });

            $container.find('.cp-app-drive-element-row').click(function () {
                $block.hide();
            });
            return $container;
        };
        var createGhostIcon = function ($list) {
            var isInRoot = currentPath[0] === ROOT;
            var $element = $('<li>', {
                'class': 'cp-app-drive-element-row cp-app-drive-element-grid cp-app-drive-new-ghost'
            }).prepend($addIcon.clone()).appendTo($list);
            $element.append($('<span>', {'class': 'cp-app-drive-element-name'})
                .text(Messages.fm_newFile));
            $element.attr('title', Messages.fm_newFile);
            $element.click(function () {
                var $modal = UIElements.createModal({
                    id: 'cp-app-drive-new-ghost-dialog',
                    $body: $('body')
                });
                var $title = $('<h3>').text(Messages.fm_newFile);
                var $description = $('<p>').text(Messages.fm_newButtonTitle);
                $modal.find('.cp-modal').append($title);
                $modal.find('.cp-modal').append($description);
                var $content = createNewPadIcons($modal, isInRoot);
                $modal.find('.cp-modal').append($content);
                window.setTimeout(function () { $modal.show(); });
                addNewPadHandlers($modal, isInRoot);
            });
        };

        // Drive content toolbar
        var createToolbar = function () {
            var $toolbar = $driveToolbar;
            $toolbar.html('');
            $('<div>', {'class': 'cp-app-drive-toolbar-leftside'}).appendTo($toolbar);
            $('<div>', {'class': 'cp-app-drive-path cp-unselectable'}).appendTo($toolbar);
            var $rightside = $('<div>', {'class': 'cp-app-drive-toolbar-rightside'})
                .appendTo($toolbar);
            var $hist = common.createButton('history', true, {histConfig: APP.histConfig});
            $rightside.append($hist);
            if (APP.$burnThisDrive) {
                $rightside.append(APP.$burnThisDrive);
            }
            return $toolbar;
        };

        // Unsorted element are represented by "href" in an array: they don't have a filename
        // and they don't hav a hierarchical structure (folder/subfolders)
        var displayHrefArray = function ($container, rootName, draggable) {
            var unsorted = files[rootName];
            if (unsorted.length) {
                var $fileHeader = getFileListHeader(false);
                $container.append($fileHeader);
            }
            var keys = unsorted;
            var sortBy = APP.store[SORT_FILE_BY];
            sortBy = sortBy === "" ? sortBy = 'name' : sortBy;
            var sortedFiles = sortElements(false, [rootName], keys, sortBy, !getSortFileDesc(), true);
            sortedFiles.forEach(function (id) {
                var file = filesOp.getFileData(id);
                if (!file) {
                    //debug("Unsorted or template returns an element not present in filesData: ", href);
                    file = { title: Messages.fm_noname };
                    //return;
                }
                var idx = files[rootName].indexOf(id);
                var $icon = getFileIcon(id);
                var ro = filesOp.isReadOnlyFile(id);
                // ro undefined mens it's an old hash which doesn't support read-only
                var roClass = typeof(ro) === 'undefined' ? ' cp-app-drive-element-noreadonly' :
                                ro ? ' cp-app-drive-element-readonly' : '';
                var $element = $('<li>', {
                    'class': 'cp-app-drive-element cp-app-drive-element-file cp-app-drive-element-row' + roClass,
                    draggable: draggable
                });
                if (Array.isArray(APP.selectedFiles)) {
                    var sidx = APP.selectedFiles.indexOf(id);
                    if (sidx !== -1) {
                        $element.addClass('cp-app-drive-element-selected');
                        APP.selectedFiles.splice(sidx, 1);
                    }
                }
                $element.prepend($icon).dblclick(function () {
                    openFile(id);
                });
                addFileData(id, $element);
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
            createGhostIcon($container);
        };

        var displayAllFiles = function ($container) {
            var allfiles = files[FILES_DATA];
            if (allfiles.length === 0) { return; }
            var $fileHeader = getFileListHeader(false);
            $container.append($fileHeader);
            var keys = filesOp.getFiles([FILES_DATA]);
            var sortedFiles = sortElements(false, [FILES_DATA], keys, APP.store[SORT_FILE_BY], !getSortFileDesc(), true);
            sortedFiles.forEach(function (id) {
                var $icon = getFileIcon(id);
                var ro = filesOp.isReadOnlyFile(id);
                // ro undefined maens it's an old hash which doesn't support read-only
                var roClass = typeof(ro) === 'undefined' ? ' cp-app-drive-element-noreadonly' :
                    ro ? ' cp-app-drive-element-readonly' : '';
                var $element = $('<li>', {
                    'class': 'cp-app-drive-element cp-app-drive-element-row' + roClass 
                });
                $element.prepend($icon).dblclick(function () {
                    openFile(id);
                });
                addFileData(id, $element);
                $element.data('path', [FILES_DATA, id]);
                $element.data('element', id);
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
            Object.keys(root).forEach(function (key) {
                if (!Array.isArray(root[key])) {
                    logError("Trash element has a wrong type", root[key]);
                    return;
                }
                root[key].forEach(function (el, idx) {
                    if (!filesOp.isFile(el.element) && !filesOp.isFolder(el.element)) { return; }
                    var spath = [key, idx, 'element'];
                    filesList.push({
                        element: el.element,
                        spath: spath,
                        name: key
                    });
                });
            });
            var sortedFolders = sortTrashElements(true, filesList, null, !getSortFolderDesc());
            var sortedFiles = sortTrashElements(false, filesList, APP.store[SORT_FILE_BY], !getSortFileDesc());
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
                    var parsed = Hash.parsePadUrl(href);
                    var $table = $('<table>');
                    var $icon = $('<td>', {'rowspan': '3', 'class': 'cp-app-drive-search-icon'})
                        .append(getFileIcon(href));
                    var $title = $('<td>', {
                        'class': 'cp-app-drive-search-col1 cp-app-drive-search-title'
                    }).text(r.data.title)
                        .click(function () {
                        openFile(null, r.data.href);
                    });
                    var $typeName = $('<td>', {'class': 'cp-app-drive-search-label2'})
                        .text(Messages.fm_type);
                    var $type = $('<td>', {'class': 'cp-app-drive-search-col2'})
                        .text(Messages.type[parsed.type] || parsed.type);
                    var $atimeName = $('<td>', {'class': 'cp-app-drive-search-label2'})
                        .text(Messages.fm_lastAccess);
                    var $atime = $('<td>', {'class': 'cp-app-drive-search-col2'})
                        .text(new Date(r.data.atime).toLocaleString());
                    var $ctimeName = $('<td>', {'class': 'cp-app-drive-search-label2'})
                        .text(Messages.fm_creation);
                    var $ctime = $('<td>', {'class': 'cp-app-drive-search-col2'})
                        .text(new Date(r.data.ctime).toLocaleString());
                    if (filesOp.isPathIn(path, ['hrefArray'])) {
                        path.pop();
                        path.push(r.data.title);
                    }
                    var $path = $('<td>', {
                        'class': 'cp-app-drive-search-col1 cp-app-drive-search-path'
                    });
                    createTitle($path, path, true);
                    var parentPath = path.slice();
                    var $a;
                    if (parentPath) {
                        $a = $('<a>').text(Messages.fm_openParent).click(function (e) {
                            e.preventDefault();
                            if (filesOp.isInTrashRoot(parentPath)) { parentPath = [TRASH]; }
                            else { parentPath.pop(); }
                            APP.selectedFiles = [r.id];
                            APP.displayDirectory(parentPath);
                        });
                    }
                    var $openDir = $('<td>', {'class': 'cp-app-drive-search-opendir'}).append($a);

                    // rows 1-3
                    $('<tr>').append($icon).append($title).append($typeName).append($type).appendTo($table);
                    $('<tr>').append($path).append($atimeName).append($atime).appendTo($table);
                    $('<tr>').append($openDir).append($ctimeName).append($ctime).appendTo($table);
                    $('<li>', {'class':'cp-app-drive-search-result'}).append($table).appendTo($list);
                });
            });
        };

        var displayRecent = function ($list) {
            var filesList = filesOp.getRecentPads();
            var limit = 20;
            var i = 0;
            filesList.forEach(function (id) {
                if (i >= limit) { return; }
                // Check path (pad exists and not in trash)
                var paths = filesOp.findFile(id);
                if (!paths.length) { return; }
                var path = paths[0];
                if (filesOp.isPathIn(path, [TRASH])) { return; }
                // Display the pad
                var file = filesOp.getFileData(id);
                if (!file) {
                    //debug("Unsorted or template returns an element not present in filesData: ", href);
                    file = { title: Messages.fm_noname };
                    //return;
                }
                var $icon = getFileIcon(id);
                var ro = filesOp.isReadOnlyFile(id);
                // ro undefined mens it's an old hash which doesn't support read-only
                var roClass = typeof(ro) === 'undefined' ? ' cp-app-drive-element-noreadonly' :
                                ro ? ' cp-app-drive-element-readonly' : '';
                var $element = $('<li>', {
                    'class': 'cp-app-drive-element cp-app-drive-element-notrash cp-app-drive-element-file cp-app-drive-element-row' + roClass,
                });
                $element.prepend($icon).dblclick(function () {
                    openFile(id);
                });
                addFileData(id, $element);
                $element.data('path', path);
                $element.click(function(e) {
                    e.stopPropagation();
                    onElementClick(e, $element, path);
                });
                $element.contextmenu(openDefaultContextMenu);
                $element.data('context', $defaultContextMenu);
                /*if (draggable) {
                    addDragAndDropHandlers($element, path, false, false);
                }*/
                $list.append($element);
                i++;
            });
        };

        // Owned pads category
        var displayOwned = function ($container) {
            var list = filesOp.getOwnedPads(edPublic);
            if (list.length === 0) { return; }
            var $fileHeader = getFileListHeader(false);
            $container.append($fileHeader);
            var sortedFiles = sortElements(false, false, list, APP.store[SORT_FILE_BY], !getSortFileDesc(), true);
            sortedFiles.forEach(function (id) {
                var paths = filesOp.findFile(id);
                if (!paths.length) { return; }
                var path = paths[0];
                var $icon = getFileIcon(id);
                var ro = filesOp.isReadOnlyFile(id);
                // ro undefined maens it's an old hash which doesn't support read-only
                var roClass = typeof(ro) === 'undefined' ? ' cp-app-drive-element-noreadonly' :
                    ro ? ' cp-app-drive-element-readonly' : '';
                var $element = $('<li>', {
                    'class': 'cp-app-drive-element cp-app-drive-element-notrash ' +
                             'cp-app-drive-element-file cp-app-drive-element-row' + roClass
                });
                $element.prepend($icon).dblclick(function () {
                    openFile(id);
                });
                addFileData(id, $element);
                $element.data('path', path);
                $element.data('element', id);
                $element.click(function(e) {
                    e.stopPropagation();
                    onElementClick(e, $element);
                });
                $element.contextmenu(openDefaultContextMenu);
                $element.data('context', $defaultContextMenu);
                $container.append($element);
            });
        };

        // Display the selected directory into the content part (rightside)
        // NOTE: Elements in the trash are not using the same storage structure as the others
        // _WORKGROUP_ : do not change the lastOpenedFolder value in localStorage
        var _displayDirectory = function (path, force) {
            APP.hideMenu();
            if (!APP.editable) { debug("Read-only mode"); }
            if (!appStatus.isReady && !force) { return; }

            // Only Trash and Root are available in not-owned files manager
            if (!path || displayedCategories.indexOf(path[0]) === -1) {
                log(Messages.categoryError);
                currentPath = [ROOT];
                _displayDirectory(currentPath);
                return;
            }
            appStatus.ready(false);
            currentPath = path;
            var s = $content.scrollTop() || 0;
            $content.html("");
            sel.$selectBox = $('<div>', {'class': 'cp-app-drive-content-select-box'})
                .appendTo($content);
            if (!path || path.length === 0) {
                path = [ROOT];
            }
            var isInRoot = filesOp.isPathIn(path, [ROOT]);
            var inTrash = filesOp.isPathIn(path, [TRASH]);
            var isTrashRoot = filesOp.comparePath(path, [TRASH]);
            var isTemplate = filesOp.comparePath(path, [TEMPLATE]);
            var isAllFiles = filesOp.comparePath(path, [FILES_DATA]);
            var isSearch = path[0] === SEARCH;
            var isRecent = path[0] === RECENT;
            var isOwned = path[0] === OWNED;
            var isVirtual = virtualCategories.indexOf(path[0]) !== -1;

            var root = isVirtual ? undefined : filesOp.find(path);
            if (!isVirtual && typeof(root) === "undefined") {
                log(Messages.fm_unknownFolderError);
                debug("Unable to locate the selected directory: ", path);
                var parentPath = path.slice();
                parentPath.pop();
                _displayDirectory(parentPath, true);
                return;
            }
            if (!isSearch) { delete APP.Search.oldLocation; }

            APP.resetTree();
            if (displayedCategories.indexOf(SEARCH) !== -1 && $tree.find('#cp-app-drive-tree-search-input').length) {
                // in history mode we want to focus the version number input
                if (!history.isHistoryMode && !APP.mobile()) {
                    var st = $tree.scrollTop() || 0;
                    $tree.find('#cp-app-drive-tree-search-input').focus();
                    $tree.scrollTop(st);
                }
                $tree.find('#cp-app-drive-tree-search-input')[0].selectionStart = getSearchCursor();
                $tree.find('#cp-app-drive-tree-search-input')[0].selectionEnd = getSearchCursor();
            }

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
                createViewModeButton($toolbar.find('.cp-app-drive-toolbar-rightside'));
            }
            if (inTrash) {
                createEmptyTrashButton($toolbar.find('.cp-app-drive-toolbar-rightside'));
            }

            var $list = $('<ul>').appendTo($dirContent);

            // NewButton can be undefined if we're in read only mode
            createNewButton(isInRoot, $toolbar.find('.cp-app-drive-toolbar-leftside'));

            createTitle($toolbar.find('.cp-app-drive-path'), path);

            if (APP.mobile()) {
                var $context = $('<button>', {
                    'class': 'cp-dropdown-container',
                    id: 'cp-app-drive-toolbar-context-mobile'
                });
                $context.append($('<span>', {'class': 'fa fa-caret-down'}));
                $context.appendTo($toolbar.find('.cp-app-drive-toolbar-rightside'));
                $context.click(function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var $li = $content.find('.cp-app-drive-element-selected');
                    if ($li.length !== 1) {
                        $li = findDataHolder($tree.find('.cp-app-drive-element-active'));
                    }
                    // Close if already opened
                    if ($('.cp-app-drive-context:visible').length) {
                        APP.hideMenu();
                        return;
                    }
                    // Open the menu
                    $('.cp-app-drive-context').css({
                        top: ($context.offset().top + 32) + 'px',
                        right: '0px',
                        left: ''
                    });
                    $li.contextmenu();
                });
            } else {
                var $contextButtons = $('<span>', {'id' : 'cp-app-drive-toolbar-contextbuttons'});
                $contextButtons.appendTo($toolbar.find('.cp-app-drive-toolbar-rightside'));
            }
            updateContextButton();

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
            } else if (isRecent) {
                displayRecent($list);
            } else if (isOwned) {
                displayOwned($list);
            } else {
                $dirContent.contextmenu(openContentContextMenu);
                if (filesOp.hasSubfolder(root)) { $list.append($folderHeader); }
                // display sub directories
                var keys = Object.keys(root);
                var sortedFolders = sortElements(true, path, keys, null, !getSortFolderDesc());
                var sortedFiles = sortElements(false, path, keys, APP.store[SORT_FILE_BY], !getSortFileDesc());
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

                createGhostIcon($list);
            }
            $content.append($info).append($dirContent);

            /*var $truncated = $('<span>', {'class': 'cp-app-drive-element-truncated'}).text('...');
            $content.find('.cp-app-drive-element').each(function (idx, el) {
                var $name = $(el).find('.cp-app-drive-element-name');
                if ($name.length === 0) { return; }
                if ($name[0].scrollHeight > $name[0].clientHeight) {
                    var $tr = $truncated.clone();
                    $tr.attr('title', $name.text());
                    $(el).append($tr);
                }
            });*/

            $content.scrollTop(s);
            appStatus.ready(true);
        };
        var displayDirectory = APP.displayDirectory = function (path, force) {
            if (history.isHistoryMode) {
                return void _displayDirectory(path, force);
            }
            updateObject(sframeChan, proxy, function () {
                copyObjectValue(files, proxy.drive);
                _displayDirectory(path, force);
            });
        };

        var createTreeElement = function (name, $icon, path, draggable, droppable, collapsable, active) {
            var $name = $('<span>', { 'class': 'cp-app-drive-element' }).text(name);
            var $collapse;
            if (collapsable) {
                $collapse = $expandIcon.clone();
            }
            var $elementRow = $('<span>', {'class': 'cp-app-drive-element-row'}).append($collapse).append($icon).append($name).click(function (e) {
                e.stopPropagation();
                APP.displayDirectory(path);
            });
            var $element = $('<li>').append($elementRow);
            if (draggable) { $elementRow.attr('draggable', true); }
            if (collapsable) {
                $element.addClass('cp-app-drive-element-collapsed');
                $collapse.click(function(e) {
                    e.stopPropagation();
                    if ($element.hasClass('cp-app-drive-element-collapsed')) {
                        // It is closed, open it
                        $element.removeClass('cp-app-drive-element-collapsed');
                        setFolderOpened(path, true);
                        $collapse.removeClass('fa-plus-square-o');
                        $collapse.addClass('fa-minus-square-o');
                    } else {
                        // Collapse the folder
                        $element.addClass('cp-app-drive-element-collapsed');
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
            if (active) {
                $elementRow.addClass('cp-app-drive-element-active cp-leftside-active');
            }
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
                var $rootElement = createTreeElement(ROOT_NAME, $rootIcon.clone(), [ROOT], false, true, true, isRootOpened);
                if (!filesOp.hasSubfolder(root)) {
                    $rootElement.find('.cp-app-drive-icon-expcol').css('visibility', 'hidden');
                }
                $rootElement.addClass('cp-app-drive-tree-root');
                $rootElement.find('>.cp-app-drive-element-row')
                    .contextmenu(openDirectoryContextMenu);
                $('<ul>', {'class': 'cp-app-drive-tree-docs'})
                    .append($rootElement).appendTo($container);
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
                $element.find('>.cp-app-drive-element-row').contextmenu(openDirectoryContextMenu);
                createTree($element, newPath);
            });
        };

        var createTemplate = function ($container, path) {
            var $icon = $templateIcon.clone();
            var isOpened = filesOp.comparePath(path, currentPath);
            var $element = createTreeElement(TEMPLATE_NAME, $icon, [TEMPLATE], false, true, false, isOpened);
            $element.addClass('cp-app-drive-tree-root');
            var $list = $('<ul>', { 'class': 'cp-app-drive-tree-category' }).append($element);
            $container.append($list);
        };

        var createAllFiles = function ($container, path) {
            var $icon = $unsortedIcon.clone();
            var isOpened = filesOp.comparePath(path, currentPath);
            var $allfilesElement = createTreeElement(FILES_DATA_NAME, $icon, [FILES_DATA], false, false, false, isOpened);
            $allfilesElement.addClass('root');
            var $allfilesList = $('<ul>', { 'class': 'cp-app-drive-tree-category' })
                .append($allfilesElement);
            $container.append($allfilesList);
        };

        var createTrash = function ($container, path) {
            var $icon = filesOp.isFolderEmpty(files[TRASH]) ? $trashEmptyIcon.clone() : $trashIcon.clone();
            var isOpened = filesOp.comparePath(path, currentPath);
            var $trashElement = createTreeElement(TRASH_NAME, $icon, [TRASH], false, true, false, isOpened);
            $trashElement.addClass('root');
            $trashElement.find('>.cp-app-drive-element-row').contextmenu(openTrashTreeContextMenu);
            var $trashList = $('<ul>', { 'class': 'cp-app-drive-tree-category' })
                .append($trashElement);
            $container.append($trashList);
        };

        var createRecent = function ($container, path) {
            var $icon = $recentIcon.clone();
            var isOpened = filesOp.comparePath(path, currentPath);
            var $element = createTreeElement(RECENT_NAME, $icon, [RECENT], false, false, false, isOpened);
            $element.addClass('root');
            var $list = $('<ul>', { 'class': 'cp-app-drive-tree-category' }).append($element);
            $container.append($list);
        };

        var createOwned = function ($container, path) {
            var $icon = $ownedIcon.clone(); // TODO
            var isOpened = filesOp.comparePath(path, currentPath);
            var $element = createTreeElement(OWNED_NAME, $icon, [OWNED], false, false, false, isOpened);
            $element.addClass('root');
            var $list = $('<ul>', { 'class': 'cp-app-drive-tree-category' }).append($element);
            $container.append($list);
        };

        var search = APP.Search = {};
        var createSearch = function ($container) {
            var isInSearch = currentPath[0] === SEARCH;
            var $div = $('<div>', {'id': 'cp-app-drive-tree-search', 'class': 'cp-unselectable'});
            var $input = $('<input>', {
                id: 'cp-app-drive-tree-search-input',
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
                if (e.which === 27) {
                    $input.val('');
                    setSearchCursor(0);
                    if (search.oldLocation && search.oldLocation.length) { displayDirectory(search.oldLocation); }
                    else { displayDirectory([ROOT]); }
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
            $searchIcon.clone().appendTo($div);
            if (isInSearch) { $input.val(currentPath[1] || ''); }
            $container.append($div);
        };

        APP.resetTree = function () {
            var $categories = $tree.find('.cp-app-drive-tree-categories-container');
            var s = $categories.scrollTop() || 0;

            $tree.html('');
            if (displayedCategories.indexOf(SEARCH) !== -1) { createSearch($tree); }
            var $div = $('<div>', {'class': 'cp-app-drive-tree-categories-container'})
                .appendTo($tree);
            if (displayedCategories.indexOf(RECENT) !== -1) { createRecent($div, [RECENT]); }
            if (displayedCategories.indexOf(OWNED) !== -1) { createOwned($div, [OWNED]); }
            if (displayedCategories.indexOf(ROOT) !== -1) { createTree($div, [ROOT]); }
            if (displayedCategories.indexOf(TEMPLATE) !== -1) { createTemplate($div, [TEMPLATE]); }
            if (displayedCategories.indexOf(FILES_DATA) !== -1) { createAllFiles($div, [FILES_DATA]); }
            if (displayedCategories.indexOf(TRASH) !== -1) { createTrash($div, [TRASH]); }

            $tree.append(APP.$limit);
            $categories = $tree.find('.cp-app-drive-tree-categories-container');
            $categories.scrollTop(s);
        };

        APP.hideMenu = function () {
            $contextMenu.hide();
            $trashTreeContextMenu.hide();
            $trashContextMenu.hide();
            $contentContextMenu.hide();
            $defaultContextMenu.hide();
            $('.cp-dropdown-content').hide();
        };

        var stringifyPath = function (path) {
            if (!Array.isArray(path)) { return; }
            var $div = $('<div>');
            var i = 0;
            var space = 10;
            path.forEach(function (s) {
                if (i === 0) { s = getPrettyName(s); }
                $div.append($('<span>', {'style': 'margin: 0 0 0 ' + i * space + 'px;'}).text(s));
                $div.append($('<br>'));
                i++;
            });
            return $div.html();
        };

        var getReadOnlyUrl = APP.getRO = function (id) {
            if (!filesOp.isFile(id)) { return; }
            var data = filesOp.getFileData(id);
            if (!data) { return; }
            var parsed = Hash.parsePadUrl(data.href);
            if (parsed.hashData.type !== "pad") { return; }
            var i = data.href.indexOf('#') + 1;
            var base = data.href.slice(0, i);
            var hrefsecret = Hash.getSecrets(parsed.type, parsed.hash);
            if (!hrefsecret.keys) { return; }
            var viewHash = Hash.getViewHashFromKeys(hrefsecret.channel, hrefsecret.keys);
            return base + viewHash;
        };

        // Disable middle click in the context menu to avoid opening /drive/inner.html# in new tabs
        $(window).click(function (e) {
            if (!e.target || !$(e.target).parents('.cp-dropdown-content').length) { return; }
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
            var base = APP.origin;
            var data = JSON.parse(JSON.stringify(filesOp.getFileData(el)));
            if (!data || !data.href) { return void cb('INVALID_FILE'); }
            data.href = base + data.href;
            if (ro) {
                data.roHref = data.href;
                delete data.href;
            } else {
                data.roHref = base + getReadOnlyUrl(el);
            }

            UIElements.getProperties(common, data, cb);
        };

        $contextMenu.on("click", "a", function(e) {
            e.stopPropagation();
            var paths = $(this).data('paths');

            var el;
            if (paths.length === 0) {
                log(Messages.fm_forbidden);
                debug("Directory context menu on a forbidden or unexisting element. ", paths);
                return;
            }
            if ($(this).hasClass("cp-app-drive-context-rename")) {
                if (paths.length !== 1) { return; }
                displayRenameInput(paths[0].element, paths[0].path);
            }
            else if($(this).hasClass("cp-app-drive-context-delete")) {
                var pathsList = [];
                paths.forEach(function (p) { pathsList.push(p.path); });
                moveElements(pathsList, [TRASH], false, refresh);
            }
            else if ($(this).hasClass('cp-app-drive-context-deleteowned')) {
                var pathsListD = [];
                var msgD = Messages.fm_deleteOwnedPads;
                UI.confirm(msgD, function(res) {
                    $(window).focus();
                    if (!res) { return; }
                    // Try to delete each selected pad from server, and delete from drive if no error
                    var n = nThen(function () {});
                    paths.forEach(function (p) {
                        var el = filesOp.find(p.path);
                        var data = filesOp.getFileData(el);
                        var parsed = Hash.parsePadUrl(data.href);
                        var channel = Util.base64ToHex(parsed.hashData.channel);
                        n = n.nThen(function (waitFor) {
                            sframeChan.query('Q_CONTACTS_CLEAR_OWNED_CHANNEL', channel,
                                             waitFor(function (e) {
                                if (e) { return void console.error(e); }
                                filesOp.delete([p.path], refresh);
                            }));
                        });
                    });
                });
                return;
            }
            else if ($(this).hasClass('cp-app-drive-context-open')) {
                paths.forEach(function (p) {
                    var $element = p.element;
                    $element.click();
                    $element.dblclick();
                });
            }
            else if ($(this).hasClass('cp-app-drive-context-openro')) {
                paths.forEach(function (p) {
                    var el = filesOp.find(p.path);
                    if (filesOp.isFolder(el)) { return; }
                    var roUrl = getReadOnlyUrl(el);
                    openFile(null, roUrl);
                });
            }
            else if ($(this).hasClass('cp-app-drive-context-newfolder')) {
                if (paths.length !== 1) { return; }
                var onCreated = function (err, info) {
                    if (err) { return void logError(err); }
                    APP.newFolder = info.newPath;
                    APP.displayDirectory(paths[0].path);
                };
                filesOp.addFolder(paths[0].path, null, onCreated);
            }
            else if ($(this).hasClass("cp-app-drive-context-properties")) {
                if (paths.length !== 1) { return; }
                el = filesOp.find(paths[0].path);
                getProperties(el, function (e, $prop) {
                    if (e) { return void logError(e); }
                    UI.alert($prop[0], undefined, true);
                });
            }
            else if ($(this).hasClass("cp-app-drive-context-hashtag")) {
                if (paths.length !== 1) { return; }
                el = filesOp.find(paths[0].path);
                var data = filesOp.getFileData(el);
                if (!data) { return void console.error("Expected to find a file"); }
                var href = data.href;
                common.updateTags(href);
            }
            APP.hideMenu();
        });

        if (!APP.loggedIn) {
            $defaultContextMenu.find('.cp-app-drive-context-delete').text(Messages.fc_remove)
                .attr('data-icon', 'fa-eraser');
        }
        $defaultContextMenu.on("click", "a", function(e) {
            e.stopPropagation();
            var paths = $(this).data('paths');
            var el;
            if (paths.length === 0) {
                log(Messages.fm_forbidden);
                debug("Context menu on a forbidden or unexisting element. ", paths);
                return;
            }
            if ($(this).hasClass('cp-app-drive-context-open')) {
                paths.forEach(function (p) {
                    var $element = p.element;
                    $element.dblclick();
                });
            }
            else if ($(this).hasClass('cp-app-drive-context-openro')) {
                paths.forEach(function (p) {
                    var el = filesOp.find(p.path);
                    if (filesOp.isPathIn(p.path, [FILES_DATA])) { el = el.href; }
                    if (!el || filesOp.isFolder(el)) { return; }
                    var roUrl = getReadOnlyUrl(el);
                    openFile(null, roUrl);
                });
            }
            else if ($(this).hasClass('cp-app-drive-context-delete')) {
                var pathsList = [];
                paths.forEach(function (p) { pathsList.push(p.path); });
                if (!APP.loggedIn) {
                    var msg = Messages._getKey("fm_removeSeveralPermanentlyDialog", [paths.length]);
                    if (paths.length === 1) {
                        msg = Messages.fm_removePermanentlyDialog;
                    }
                    UI.confirm(msg, function(res) {
                        $(window).focus();
                        if (!res) { return; }
                        filesOp.delete(pathsList, refresh);
                    });
                    return;
                }
                moveElements(pathsList, [TRASH], false, refresh);
            }
            else if ($(this).hasClass('cp-app-drive-context-deleteowned')) {
                var pathsListD = [];
                var msgD = Messages.fm_deleteOwnedPads;
                UI.confirm(msgD, function(res) {
                    $(window).focus();
                    if (!res) { return; }
                    // Try to delete each selected pad from server, and delete from drive if no error
                    var n = nThen(function () {});
                    paths.forEach(function (p) {
                        var el = filesOp.find(p.path);
                        var data = filesOp.getFileData(el);
                        var parsed = Hash.parsePadUrl(data.href);
                        var channel = Util.base64ToHex(parsed.hashData.channel);
                        n = n.nThen(function (waitFor) {
                            sframeChan.query('Q_CONTACTS_CLEAR_OWNED_CHANNEL', channel,
                                             waitFor(function (e) {
                                if (e) { return void console.error(e); }
                                filesOp.delete([p.path], refresh);
                            }));
                        });
                    });
                });
                return;
            }
            else if ($(this).hasClass("cp-app-drive-context-properties")) {
                if (paths.length !== 1) { return; }
                el = filesOp.find(paths[0].path);
                getProperties(el, function (e, $prop) {
                    if (e) { return void logError(e); }
                    UI.alert($prop[0], undefined, true);
                });
            }
            else if ($(this).hasClass("cp-app-drive-context-hashtag")) {
                if (paths.length !== 1) { return; }
                el = filesOp.find(paths[0].path);
                var data = filesOp.getFileData(el);
                if (!data) { return void console.error("Expected to find a file"); }
                var href = data.href;
                common.updateTags(href);
            }
            APP.hideMenu();
        });

        $contentContextMenu.on('click', 'a', function (e) {
            e.stopPropagation();
            var path = $(this).data('path');
            var onCreated = function (err, info) {
                if (err === E_OVER_LIMIT) {
                    return void UI.alert(Messages.pinLimitDrive, null, true);
                }
                if (err) {
                    return void UI.alert(Messages.fm_error_cantPin);
                }
                APP.newFolder = info.newPath;
                refresh();
            };
            if ($(this).hasClass("cp-app-drive-context-newfolder")) {
                filesOp.addFolder(path, null, onCreated);
            }
            else if ($(this).hasClass("cp-app-drive-context-newdoc")) {
                var type = $(this).data('type') || 'pad';
                var path2 = filesOp.isPathIn(currentPath, [TRASH]) ? '' : currentPath;
                common.sessionStorage.put(Constants.newPadPathKey, path2, function () {
                    common.openURL('/' + type + '/');
                });
            }
            APP.hideMenu();
        });

        $trashTreeContextMenu.on('click', 'a', function (e) {
            e.stopPropagation();
            var paths = $(this).data('paths');
            if (paths.length !== 1 || !paths[0].element || !filesOp.comparePath(paths[0].path, [TRASH])) {
                log(Messages.fm_forbidden);
                debug("Trash tree context menu on a forbidden or unexisting element. ", paths);
                return;
            }
            if ($(this).hasClass("cp-app-drive-context-empty")) {
                UI.confirm(Messages.fm_emptyTrashDialog, function(res) {
                    if (!res) { return; }
                    filesOp.emptyTrash(refresh);
                });
            }
            APP.hideMenu();
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
            if ($(this).hasClass("cp-app-drive-context-remove")) {
                if (paths.length === 1) {
                    UI.confirm(Messages.fm_removePermanentlyDialog, function(res) {
                        if (!res) { return; }
                        filesOp.delete([path], refresh);
                    });
                    return;
                }
                var pathsList = [];
                paths.forEach(function (p) { pathsList.push(p.path); });
                var msg = Messages._getKey("fm_removeSeveralPermanentlyDialog", [paths.length]);
                UI.confirm(msg, function(res) {
                    if (!res) { return; }
                    filesOp.delete(pathsList, refresh);
                });
            }
            else if ($(this).hasClass("cp-app-drive-context-restore")) {
                if (paths.length !== 1) { return; }
                if (path.length === 4) {
                    var el = filesOp.find(path);
                    if (filesOp.isFile(el)) {
                        name = filesOp.getTitle(el);
                    } else {
                        name = path[1];
                    }
                }
                UI.confirm(Messages._getKey("fm_restoreDialog", [name]), function(res) {
                    if (!res) { return; }
                    filesOp.restore(path, refresh);
                });
            }
            else if ($(this).hasClass("cp-app-drive-context-properties")) {
                if (paths.length !== 1 || path.length !== 4) { return; }
                var element = filesOp.find(path.slice(0,3)); // element containing the oldpath
                var sPath = stringifyPath(element.path);
                UI.alert('<strong>' + Messages.fm_originalPath + "</strong>:<br>" + sPath, undefined, true);
            }
            APP.hideMenu();
        });

        // Chrome considers the double-click means "select all" in the window
        $content.on('mousedown', function (e) {
            $content.focus();
            e.preventDefault();
        });
        $appContainer.on('mouseup', function (e) {
            //if (sel.down) { return; }
            if (e.which !== 1) { return ; }
            APP.hideMenu(e);
            //removeSelected(e);
        });
        $appContainer.on('click', function (e) {
            if (e.which !== 1) { return ; }
            removeInput();
            hideNewButton();
        });
        $appContainer.on('drag drop', function (e) {
            removeInput();
            APP.hideMenu(e);
        });
        $appContainer.on('mouseup drop', function () {
            $('.cp-app-drive-element-droppable').removeClass('cp-app-drive-element-droppable');
        });
        $appContainer.on('keydown', function (e) {
            // "Del"
            if (e.which === 46) {
                if (filesOp.isPathIn(currentPath, [FILES_DATA]) && APP.loggedIn) {
                    return; // We can't remove elements directly from filesData
                }
                var $selected = $('.cp-app-drive-element-selected');
                if (!$selected.length) { return; }
                var paths = [];
                var isTrash = filesOp.isPathIn(currentPath, [TRASH]);
                $selected.each(function (idx, elmt) {
                    if (!$(elmt).data('path')) { return; }
                    paths.push($(elmt).data('path'));
                });
                // If we are in the trash or anon pad or if we are holding the "shift" key, delete permanently,
                if (!APP.loggedIn || isTrash || e.shiftKey) {
                    var msg = Messages._getKey("fm_removeSeveralPermanentlyDialog", [paths.length]);
                    if (paths.length === 1) {
                        msg = Messages.fm_removePermanentlyDialog;
                    }

                    UI.confirm(msg, function(res) {
                        $(window).focus();
                        if (!res) { return; }
                        filesOp.delete(paths, refresh);
                    });
                    return;
                }
                // else move to trash
                moveElements(paths, [TRASH], false, refresh);
            }
        });
        var isCharacterKey = function (e) {
            return e.which === "undefined" /* IE */ ||
                    (e.which > 0 && e.which !== 13 && e.which !== 27 && !e.ctrlKey && !e.altKey);
        };
        $appContainer.on('keypress', function (e) {
            var $searchBar = $tree.find('#cp-app-drive-tree-search-input');
            if ($searchBar.is(':focus')) { return; }
            if (isCharacterKey(e)) {
                $searchBar.focus();
                e.preventDefault();
                return;
            }
        });
        $appContainer.contextmenu(function () {
            APP.hideMenu();
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

        sframeChan.on('EV_DRIVE_CHANGE', function (data) {
            if (history.isHistoryMode) { return; }
            var path = data.path;
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
            APP.resetTree();
            return false;
        });
        sframeChan.on('EV_DRIVE_REMOVE', function (data) {
            if (history.isHistoryMode) { return; }
            var path = data.path;
            if (path[0] !== 'drive') { return false; }
            path = path.slice(1);
            var cPath = currentPath.slice();
            if ((filesOp.isPathIn(cPath, ['hrefArray', TRASH]) && cPath[0] === path[0]) ||
                    (path.length >= cPath.length && filesOp.isSubpath(path, cPath))) {
                // Reload after a few to make sure all the change events have been received
                onRefresh.refresh();
            }
            APP.resetTree();
            return false;
        });

        history.onEnterHistory = function (obj) {
            copyObjectValue(files, obj.drive);
            appStatus.isReady = true;
            refresh();
        };
        history.onLeaveHistory = function () {
            copyObjectValue(files, proxy.drive);
            refresh();
        };

        var fmConfig = {
            noHandlers: true,
            onUploaded: function () {
                refresh();
            },
            body: $('body')
        };
        APP.FM = common.createFileManager(fmConfig);

        refresh();
        UI.removeLoadingScreen();
    };

    var setHistory = function (bool, update) {
        history.isHistoryMode = bool;
        setEditable(!bool);
        if (!bool && update) {
            history.onLeaveHistory();
        }
    };

    var main = function () {
        var common;
        var proxy = {};
        var readOnly;

        nThen(function (waitFor) {
            $(waitFor(function () {
                UI.addLoadingScreen();
            }));
            window.cryptpadStore.getAll(waitFor(function (val) {
                APP.store = JSON.parse(JSON.stringify(val));
            }));
            SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
        }).nThen(function (waitFor) {
            var privReady = Util.once(waitFor());
            var metadataMgr = common.getMetadataMgr();
            if (JSON.stringify(metadataMgr.getPrivateData()) !== '{}') {
                privReady();
                return;
            }
            metadataMgr.onChange(function () {
                if (typeof(metadataMgr.getPrivateData().readOnly) === 'boolean') {
                    readOnly = APP.readOnly = metadataMgr.getPrivateData().readOnly;
                    privReady();
                }
            });
        }).nThen(function (waitFor) {
            APP.loggedIn = common.isLoggedIn();
            APP.SFCommon = common;
            if (!APP.loggedIn) { Feedback.send('ANONYMOUS_DRIVE'); }
            APP.$body = $('body');
            APP.$bar = $('#cp-toolbar');

            common.setTabTitle(Messages.type.drive);

            /*var listmapConfig = {
                data: {},
                common: common,
                logging: false
            };*/

            var sframeChan = common.getSframeChannel();
            updateObject(sframeChan, proxy, waitFor());
        }).nThen(function () {
            var sframeChan = common.getSframeChannel();
            var metadataMgr = common.getMetadataMgr();
            var configTb = {
                displayed: ['useradmin', 'pageTitle', 'newpad', 'limit'],
                pageTitle: Messages.type.drive,
                metadataMgr: metadataMgr,
                readOnly: readOnly,
                sfCommon: common,
                $container: APP.$bar
            };
            var toolbar = APP.toolbar = Toolbar.create(configTb);

            var $rightside = toolbar.$rightside;
            $rightside.html(''); // Remove the drawer if we don't use it to hide the toolbar
            APP.$displayName = APP.$bar.find('.' + Toolbar.constants.username);

            /* add the usage */
            if (APP.loggedIn) {
                common.createUsageBar(function (err, $limitContainer) {
                    if (err) { return void logError(err); }
                    APP.$limit = $limitContainer;
                }, true);
            }

            /* add a history button */
            APP.histConfig = {
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
            };

            // Add a "Burn this drive" button
            if (!APP.loggedIn) {
                APP.$burnThisDrive = common.createButton(null, true).click(function () {
                    UI.confirm(Messages.fm_burnThisDrive, function (yes) {
                        if (!yes) { return; }
                        common.getSframeChannel().event('EV_BURN_ANON_DRIVE');
                    }, null, true);
                }).attr('title', Messages.fm_burnThisDriveButton)
                  .removeClass('fa-question')
                  .addClass('fa-ban');
            }

            metadataMgr.onChange(function () {
                var name = metadataMgr.getUserData().name || Messages.anonymous;
                APP.$displayName.text(name);
            });

            $('body').css('display', '');
            APP.files = proxy;
            if (!proxy.drive || typeof(proxy.drive) !== 'object') {
                throw new Error("Corrupted drive");
            }
            andThen(common, proxy);
            UI.removeLoadingScreen();

            var onDisconnect = APP.onDisconnect = function (noAlert) {
                setEditable(false);
                if (APP.refresh) { APP.refresh(); }
                APP.toolbar.failed();
                if (!noAlert) { UI.alert(Messages.common_connectionLost, undefined, true); }
            };
            var onReconnect = function (info) {
                setEditable(true);
                if (APP.refresh) { APP.refresh(); }
                APP.toolbar.reconnecting(info.myId);
                UI.findOKButton().click();
            };

            sframeChan.on('EV_DRIVE_LOG', function (msg) {
                UI.log(msg);
            });
            sframeChan.on('EV_NETWORK_DISCONNECT', function () {
                onDisconnect();
            });
            sframeChan.on('EV_NETWORK_RECONNECT', function (data) {
                // data.myId;
                onReconnect(data);
            });
            common.onLogout(function () { setEditable(false); });
        });
    };
    main();
});
