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
    '/common/hyperscript.js',
    '/common/proxy-manager.js',
    '/customize/application_config.js',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/customize/messages.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/drive/app-drive.less',
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
    h,
    ProxyManager,
    AppConfig,
    Listmap,
    Messages)
{
    var APP = window.APP = {
        editable: false,
        mobile: function () {
            if (window.matchMedia) { return !window.matchMedia('(any-pointer:fine)').matches; }
            else { return $('body').width() <= 600; }
        },
        isMac: navigator.platform === "MacIntel",
        allowFolderUpload: File.prototype.hasOwnProperty("webkitRelativePath"),
    };

    var stringify = function (obj) {
        return JSONSortify(obj);
    };

    var E_OVER_LIMIT = 'E_OVER_LIMIT';

    var ROOT = "root";
    var ROOT_NAME = Messages.fm_rootName;
    var SEARCH = "search";
    var SEARCH_NAME = Messages.fm_searchName;
    var TRASH = "trash";
    var TRASH_NAME = Messages.fm_trashName;
    var FILES_DATA = Constants.storageKey;
    var FILES_DATA_NAME = Messages.fm_filesDataName;
    var TEMPLATE = "template";
    var TEMPLATE_NAME = Messages.fm_templateName;
    var RECENT = "recent";
    var RECENT_NAME = Messages.fm_recentPadsName;
    var OWNED = "owned";
    var OWNED_NAME = Messages.fm_ownedPadsName;
    var TAGS = "tags";
    var TAGS_NAME = Messages.fm_tagsName;
    var SHARED_FOLDER = 'sf';
    var SHARED_FOLDER_NAME = Messages.fm_sharedFolderName;

    // Icons
    var faFolder = 'cptools-folder';
    var faFolderOpen = 'cptools-folder-open';
    var faSharedFolder = 'cptools-shared-folder';
    var faSharedFolderOpen = 'cptools-shared-folder-open';
    var faExpandAll = 'fa-plus-square-o';
    var faCollapseAll = 'fa-minus-square-o';
    var faShared = 'fa-shhare-alt';
    var faReadOnly = 'fa-eye';
    var faOpenInCode = 'cptools-code';
    var faRename = 'fa-pencil';
    var faColor = 'cptools-palette';
    var faTrash = 'fa-trash';
    var faDelete = 'fa-eraser';
    var faProperties = 'fa-database';
    var faTags = 'fa-hashtag';
    var faUploadFiles = 'cptools-file-upload';
    var faUploadFolder = 'cptools-folder-upload';
    var faEmpty = 'fa-trash-o';
    var faRestore = 'fa-repeat';
    var faShowParent = 'fa-location-arrow';
    var faDownload = 'fa-download';
    var $folderIcon = $('<span>', {
        "class": faFolder + " cptools cp-app-drive-icon-folder cp-app-drive-content-icon"
    });
    //var $folderIcon = $('<img>', {src: "/customize/images/icons/folder.svg", "class": "folder icon"});
    var $folderEmptyIcon = $folderIcon.clone();
    var $folderOpenedIcon = $('<span>', {"class": faFolderOpen + " cptools cp-app-drive-icon-folder"});
    //var $folderOpenedIcon = $('<img>', {src: "/customize/images/icons/folderOpen.svg", "class": "folder icon"});
    var $folderOpenedEmptyIcon = $folderOpenedIcon.clone();
    var $sharedFolderIcon = $('<span>', {"class": faSharedFolder + " cptools cp-app-drive-icon-folder"});
    var $sharedFolderOpenedIcon = $('<span>', {"class": faSharedFolderOpen + " cptools cp-app-drive-icon-folder"});
    //var $upIcon = $('<span>', {"class": "fa fa-arrow-circle-up"});
    var $unsortedIcon = $('<span>', {"class": "fa fa-files-o"});
    var $templateIcon = $('<span>', {"class": "cptools cptools-template"});
    var $recentIcon = $('<span>', {"class": "fa fa-clock-o"});
    var $trashIcon = $('<span>', {"class": "fa " + faTrash});
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
    var $searchIcon = $('<span>', {"class": "fa fa-search cp-app-drive-tree-search-icon"});
    var $addIcon = $('<span>', {"class": "fa fa-plus"});
    var $renamedIcon = $('<span>', {"class": "fa fa-flag"});
    var $readonlyIcon = $('<span>', {"class": "fa " + faReadOnly});
    var $ownedIcon = $('<span>', {"class": "fa fa-id-card-o"});
    var $sharedIcon = $('<span>', {"class": "fa " + faShared});
    var $ownerIcon = $('<span>', {"class": "fa fa-id-card"});
    var $tagsIcon = $('<span>', {"class": "fa " + faTags});
    var $passwordIcon = $('<span>', {"class": "fa fa-lock"});
    var $expirableIcon = $('<span>', {"class": "fa fa-clock-o"});
    var $separator = $('<div>', {"class": "dropdown-divider"});

    var LS_LAST = "app-drive-lastOpened";
    var LS_OPENED = "app-drive-openedFolders";
    var LS_VIEWMODE = "app-drive-viewMode";
    var LS_SEARCHCURSOR = "app-drive-searchCursor";
    var FOLDER_CONTENT_ID = "cp-app-drive-content-folder";

    var config = {};
    var DEBUG = config.DEBUG = false;
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
    var removeFoldersOpened = function (parentPath) {
        var stored = JSON.parse(APP.store[LS_OPENED] || '[]');
        var s = JSON.stringify(parentPath).slice(0, -1);
        for (var i = stored.length - 1 ; i >= 0 ; i--) {
            if (stored[i].indexOf(s) === 0) {
                stored.splice(i, 1);
            }
        }
        APP.store[LS_OPENED] = JSON.stringify(stored);
        localStore.put(LS_OPENED, JSON.stringify(stored));
    };
    var renameFoldersOpened = function (parentPath, newName) {
        var stored = JSON.parse(APP.store[LS_OPENED] || '[]');
        var s = JSON.stringify(parentPath).slice(0, -1);
        var newParentPath = parentPath.slice();
        newParentPath[newParentPath.length - 1] = newName;
        var sNew = JSON.stringify(newParentPath).slice(0, -1);
        for (var i = 0 ; i < stored.length ; i++) {
            if (stored[i].indexOf(s) === 0) {
                stored[i] = stored[i].replace(s, sNew);
            }
        }
        APP.store[LS_OPENED] = JSON.stringify(stored);
        localStore.put(LS_OPENED, JSON.stringify(stored));
    };
    var moveFoldersOpened = function (previousPath, newPath) {
        var stored = JSON.parse(APP.store[LS_OPENED] || '[]');
        var s = JSON.stringify(previousPath).slice(0, -1);
        var sNew = JSON.stringify(newPath).slice(0, -1);
        if (s === sNew ) { return; } // move to itself
        if (sNew.indexOf(s) === 0) { return; } // move to subfolder
        sNew = JSON.stringify(newPath.concat(previousPath[previousPath.length - 1])).slice(0, -1);
        for (var i = 0 ; i < stored.length ; i++) {
            if (stored[i].indexOf(s) === 0) {
                stored[i] = stored[i].replace(s, sNew);
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

    var history = {
        isHistoryMode: false,
    };

    var copyObjectValue = function (objRef, objToCopy) {
        for (var k in objRef) { delete objRef[k]; }
        $.extend(true, objRef, objToCopy);
    };
    var updateSharedFolders = function (sframeChan, manager, drive, folders, cb) {
        if (!drive || !drive.sharedFolders) {
            return void cb();
        }
        var oldIds = Object.keys(folders);
        nThen(function (waitFor) {
            Object.keys(drive.sharedFolders).forEach(function (fId) {
                sframeChan.query('Q_DRIVE_GETOBJECT', {
                    sharedFolder: fId
                }, waitFor(function (err, newObj) {
                    folders[fId] = folders[fId] || {};
                    copyObjectValue(folders[fId], newObj);
                    if (manager && oldIds.indexOf(fId) === -1) {
                        manager.addProxy(fId, folders[fId]);
                    }
                }));
            });
        }).nThen(function () {
            cb();
        });
    };
    var updateObject = function (sframeChan, obj, cb) {
        sframeChan.query('Q_DRIVE_GETOBJECT', null, function (err, newObj) {
            copyObjectValue(obj, newObj);
            if (!APP.loggedIn && APP.newSharedFolder) {
                obj.drive.sharedFolders = obj.drive.sharedFolders || {};
                obj.drive.sharedFolders[APP.newSharedFolder] = {};
            }
            cb();
        });
    };


    APP.selectedFiles = [];

    var isElementSelected = function ($element) {
        var elementId = $element.data("path").slice(-1)[0];
        return APP.selectedFiles.indexOf(elementId) !== -1;
    };
    var selectElement = function ($element) {
        var elementId = $element.data("path").slice(-1)[0];
        if (APP.selectedFiles.indexOf(elementId) === -1) {
            APP.selectedFiles.push(elementId);
        }
        $element.addClass("cp-app-drive-element-selected");
    };
    var unselectElement = function ($element) {
        var elementId = $element.data("path").slice(-1)[0];
        var index = APP.selectedFiles.indexOf(elementId);
        if (index !== -1) {
            APP.selectedFiles.splice(index, 1);
        }
        $element.removeClass("cp-app-drive-element-selected");
    };
    var findSelectedElements = function () {
        return $(".cp-app-drive-element-selected");
    };


    var createContextMenu = function () {
        var menu = h('div.cp-contextmenu.dropdown.cp-unselectable', [
            h('ul.dropdown-menu', {
                'role': 'menu',
                'aria-labelledby': 'dropdownMenu',
                'style': 'display:block;position:static;margin-bottom:5px;'
            }, [
                h('span.cp-app-drive-context-noAction.dropdown-item.disabled', Messages.fc_noAction || "No action possible"),
                h('li', h('a.cp-app-drive-context-open.dropdown-item', {
                    'tabindex': '-1',
                    'data-icon': faFolderOpen,
                }, Messages.fc_open)),
                h('li', h('a.cp-app-drive-context-openro.dropdown-item', {
                    'tabindex': '-1',
                    'data-icon': faReadOnly,
                }, Messages.fc_open_ro)),
                h('li', h('a.cp-app-drive-context-openincode.dropdown-item', {
                    'tabindex': '-1',
                    'data-icon': faOpenInCode,
                }, Messages.fc_openInCode)),
                $separator.clone()[0],
                h('li', h('a.cp-app-drive-context-expandall.dropdown-item', {
                    'tabindex': '-1',
                    'data-icon': faExpandAll,
                }, Messages.fc_expandAll)),
                h('li', h('a.cp-app-drive-context-collapseall.dropdown-item', {
                    'tabindex': '-1',
                    'data-icon': faCollapseAll,
                }, Messages.fc_collapseAll)),
                $separator.clone()[0],
                h('li', h('a.cp-app-drive-context-openparent.dropdown-item', {
                    'tabindex': '-1',
                    'data-icon': faShowParent,
                }, Messages.fm_openParent)),
                $separator.clone()[0],
                h('li', h('a.cp-app-drive-context-share.dropdown-item', {
                    'tabindex': '-1',
                    'data-icon': 'fa-shhare-alt',
                }, Messages.shareButton)),
                h('li', h('a.cp-app-drive-context-download.dropdown-item', {
                    'tabindex': '-1',
                    'data-icon': faDownload,
                }, Messages.download_mt_button)),
                $separator.clone()[0],
                h('li', h('a.cp-app-drive-context-newfolder.dropdown-item.cp-app-drive-context-editable', {
                    'tabindex': '-1',
                    'data-icon': faFolder,
                }, Messages.fc_newfolder)),
                h('li', h('a.cp-app-drive-context-newsharedfolder.dropdown-item.cp-app-drive-context-editable', {
                    'tabindex': '-1',
                    'data-icon': faSharedFolder,
                }, Messages.fc_newsharedfolder)),
                $separator.clone()[0],
                h('li', h('a.cp-app-drive-context-uploadfiles.dropdown-item.cp-app-drive-context-editable', {
                    'tabindex': '-1',
                    'data-icon': faUploadFiles,
                }, Messages.uploadButton)),
                h('li', h('a.cp-app-drive-context-uploadfolder.dropdown-item.cp-app-drive-context-editable', {
                    'tabindex': '-1',
                    'data-icon': faUploadFolder,
                }, Messages.uploadFolderButton)),
                $separator.clone()[0],
                h('li', h('a.cp-app-drive-context-newdoc.dropdown-item.cp-app-drive-context-editable', {
                    'tabindex': '-1',
                    'data-icon': AppConfig.applicationsIcon.pad,
                    'data-type': 'pad'
                }, Messages.button_newpad)),
                h('li', h('a.cp-app-drive-context-newdoc.dropdown-item.cp-app-drive-context-editable', {
                    'tabindex': '-1',
                    'data-icon': AppConfig.applicationsIcon.code,
                    'data-type': 'code'
                }, Messages.button_newcode)),
                h('li', h('a.cp-app-drive-context-newdoc.dropdown-item.cp-app-drive-context-editable', {
                    'tabindex': '-1',
                    'data-icon': AppConfig.applicationsIcon.slide,
                    'data-type': 'slide'
                }, Messages.button_newslide)),
                h('li.dropdown-submenu', [
                    h('a.cp-app-drive-context-newdocmenu.dropdown-item', {
                        'tabindex': '-1',
                        'data-icon': "fa-plus",
                    }, Messages.fm_morePads),
                    h("ul.dropdown-menu", [
                        h('li', h('a.cp-app-drive-context-newdoc.dropdown-item.cp-app-drive-context-editable', {
                            'tabindex': '-1',
                            'data-icon': AppConfig.applicationsIcon.sheet,
                            'data-type': 'sheet'
                        }, Messages.button_newsheet)),
                        h('li', h('a.cp-app-drive-context-newdoc.dropdown-item.cp-app-drive-context-editable', {
                            'tabindex': '-1',
                            'data-icon': AppConfig.applicationsIcon.whiteboard,
                            'data-type': 'whiteboard'
                        }, Messages.button_newwhiteboard)),
                        h('li', h('a.cp-app-drive-context-newdoc.dropdown-item.cp-app-drive-context-editable', {
                            'tabindex': '-1',
                            'data-icon': AppConfig.applicationsIcon.kanban,
                            'data-type': 'kanban'
                        }, Messages.button_newkanban)),
                        h('li', h('a.cp-app-drive-context-newdoc.dropdown-item.cp-app-drive-context-editable', {
                            'tabindex': '-1',
                            'data-icon': AppConfig.applicationsIcon.poll,
                            'data-type': 'poll'
                        }, Messages.button_newpoll)),
                    ]),
                ]),
                $separator.clone()[0],
                h('li', h('a.cp-app-drive-context-empty.dropdown-item.cp-app-drive-context-editable', {
                    'tabindex': '-1',
                    'data-icon': faEmpty,
                }, Messages.fc_empty)),
                h('li', h('a.cp-app-drive-context-restore.dropdown-item.cp-app-drive-context-editable', {
                    'tabindex': '-1',
                    'data-icon': faRestore,
                }, Messages.fc_restore)),
                $separator.clone()[0],
                h('li', h('a.cp-app-drive-context-rename.dropdown-item.cp-app-drive-context-editable', {
                    'tabindex': '-1',
                    'data-icon': faRename,
                }, Messages.fc_rename)),
                h('li', h('a.cp-app-drive-context-color.dropdown-item.cp-app-drive-context-editable', {
                    'tabindex': '-1',
                    'data-icon': faColor,
                }, Messages.fc_color)),
                h('li', h('a.cp-app-drive-context-hashtag.dropdown-item.cp-app-drive-context-editable', {
                    'tabindex': '-1',
                    'data-icon': faTags,
                }, Messages.fc_hashtag)),
                $separator.clone()[0],
                h('li', h('a.cp-app-drive-context-delete.dropdown-item.cp-app-drive-context-editable', {
                    'tabindex': '-1',
                    'data-icon': faTrash,
                }, Messages.fc_delete)),
                h('li', h('a.cp-app-drive-context-deleteowned.dropdown-item.cp-app-drive-context-editable', {
                    'tabindex': '-1',
                    'data-icon': faDelete,
                }, Messages.fc_delete_owned)),
                h('li', h('a.cp-app-drive-context-remove.dropdown-item.cp-app-drive-context-editable', {
                    'tabindex': '-1',
                    'data-icon': faDelete,
                }, Messages.fc_remove)),
                h('li', h('a.cp-app-drive-context-removesf.dropdown-item.cp-app-drive-context-editable', {
                    'tabindex': '-1',
                    'data-icon': faDelete,
                }, Messages.fc_remove_sharedfolder)),
                $separator.clone()[0],
                h('li', h('a.cp-app-drive-context-properties.dropdown-item', {
                    'tabindex': '-1',
                    'data-icon': faProperties,
                }, Messages.fc_prop)),
            ])
        ]);
        // add icons to the contextmenu options
        $(menu).find("li a.dropdown-item").each(function (i, el) {
            var $icon = $("<span>");
            if ($(el).attr('data-icon')) {
                var font = $(el).attr('data-icon').indexOf('cptools') === 0 ? 'cptools' : 'fa';
                $icon.addClass(font).addClass($(el).attr('data-icon'));
            } else {
                $icon.text($(el).text());
            }
            $(el).prepend($icon);
        });
        // add events handlers for the contextmenu submenus
        $(menu).find(".dropdown-submenu").each(function (i, el) {
            var $el = $(el);
            var $a = $el.children().filter("a");
            var $sub = $el.find(".dropdown-menu").first();
            var left, bottomOffset;
            var timeoutId;
            var showSubmenu = function () {
                clearTimeout(timeoutId);
                left = $el.offset().left + $el.outerWidth() + $sub.outerWidth() > $(window).width();
                bottomOffset = $el.offset().top + $el.outerHeight() + $sub.outerHeight() - $(window).height();
                $sub.css("left", left ? "0%": "100%");
                $sub.css("transform", "translate("
                         + (left ? "-100%" : "0")
                         + "," + (bottomOffset > 0 ? -(bottomOffset - $el.outerHeight()) : 0) + "px)");
                $el.siblings().find(".dropdown-menu").hide();
                $sub.show();
            };
            var hideSubmenu = function () {
                $sub.hide();
                $sub.removeClass("left");
            };
            var mouseOutSubmenu = function () {
                // don't hide immediately the submenu
                timeoutId = setTimeout(hideSubmenu, 100);
            };
            // Add submenu expand icon
            $a.append(h("span.dropdown-toggle"));
            // Show / hide submenu
            $el.hover(function () {
                showSubmenu();
            }, function () {
                mouseOutSubmenu();
            });
            // handle click event
            $el.click(function (e) {
                var targetItem = $(e.target).closest(".dropdown-item")[0]; // don't close contextmenu if open submenu
                var elTarget = $el.children(".dropdown-item")[0];
                if (targetItem === elTarget) { e.stopPropagation(); }
                if ($el.children().filter(".dropdown-menu:visible").length !== 0) {
                    $el.find(".dropdown-menu").hide();
                    hideSubmenu();
                }
                else {
                    showSubmenu();
                }
            });
        });
        return $(menu);
    };

    var andThen = function (common, proxy, folders) {
        var files = proxy.drive;
        var metadataMgr = common.getMetadataMgr();
        var sframeChan = common.getSframeChannel();
        var priv = metadataMgr.getPrivateData();
        var user = metadataMgr.getUserData();
        var edPublic = priv.edPublic;

        APP.origin = priv.origin;
        config.loggedIn = APP.loggedIn;
        config.sframeChan = sframeChan;
        APP.hideDuplicateOwned = Util.find(priv, ['settings', 'drive', 'hideDuplicate']);

        var manager = ProxyManager.createInner(files, sframeChan, edPublic, config);

        Object.keys(folders).forEach(function (id) {
            var f = folders[id];
            manager.addProxy(id, f);
        });

        var $tree = APP.$tree = $("#cp-app-drive-tree");
        var $content = APP.$content = $("#cp-app-drive-content");
        var $appContainer = $(".cp-app-drive-container");
        var $driveToolbar = $("#cp-app-drive-toolbar");
        var $contextMenu = createContextMenu().appendTo($appContainer);

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
        }

        // FILE MANAGER
        var currentPath = APP.currentPath = getLastOpenedFolder();
        if (APP.newSharedFolder) {
            var newSFPaths = manager.findFile(APP.newSharedFolder);
            if (newSFPaths.length) {
                currentPath = newSFPaths[0];
            }
        }


        // Categories dislayed in the menu
        var displayedCategories = [ROOT, TRASH, SEARCH, RECENT];

        // PCS enabled: display owned pads
        if (AppConfig.displayCreationScreen) { displayedCategories.push(OWNED); }
        // Templates enabled: display template category
        if (AppConfig.enableTemplates) { displayedCategories.push(TEMPLATE); }
        // Tags used: display Tags category
        if (Object.keys(manager.getTagsList()).length) { displayedCategories.push(TAGS); }

        var virtualCategories = [SEARCH, RECENT, OWNED, TAGS];

        if (!APP.loggedIn) {
            $tree.hide();
            if (APP.newSharedFolder) {
                // ANON_SHARED_FOLDER
                displayedCategories = [SHARED_FOLDER];
                virtualCategories.push(SHARED_FOLDER);
                currentPath = [SHARED_FOLDER, ROOT];
            } else {
                displayedCategories = [FILES_DATA];
                currentPath = [FILES_DATA];
                if (Object.keys(files.root).length && !proxy.anonymousAlert) {
                    var msg = common.fixLinks($('<div>').html(Messages.fm_alert_anonymous));
                    UI.alert(msg);
                    proxy.anonymousAlert = true;
                }
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
            APP.selectedFiles = [];
            findSelectedElements().removeClass("cp-app-drive-element-selected");
            var $container = $driveToolbar.find('#cp-app-drive-toolbar-contextbuttons');
            if (!$container.length) { return; }
            $container.html('');
            if (!keepObj) {
                delete sel.startSelected;
                delete sel.endSelected;
                delete sel.oldSelection;
            }
        };

        sel.refresh = 50;
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
                .each(function (idx, element) {
                    selectElement($(element));
            });
            e.stopPropagation();
        });

        // Arrow keys to modify the selection
        $(window).keydown(function (e) {
            var $searchBar = $tree.find('#cp-app-drive-tree-search-input');
            if (document.activeElement && document.activeElement.nodeName === 'INPUT') { return; }
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

            // Ctrl+A select all
            if (e.which === 65 && (e.ctrlKey || (e.metaKey && APP.isMac))) {
                $content.find('.cp-app-drive-element:not(.cp-app-drive-element-selected)')
                    .each(function (idx, element) {
                        selectElement($(element));
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

            var $selection = findSelectedElements();
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
                manager.rename($input.data('path'), $input.val(), APP.refresh);
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
                console.error("Unable to format that string to a date with .toLocaleString", sDate, e);
            }
            return ret;
        };

        var openFile = function (el, href) {
            if (!href) {
                var data = manager.getFileData(el);
                if (!data || (!data.href && !data.roHref)) {
                    return void logError("Missing data for the file", el, data);
                }
                href = data.href || data.roHref;
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
                var $name = $element.find('.cp-app-drive-element-name');
                if (!$name.length) {
                    $name = $element.find('> .cp-app-drive-element');
                }
                $name.hide();
                var isFolder = $element.is(".cp-app-drive-element-folder:not(.cp-app-drive-element-sharedf)");
                var el = manager.find(path);
                var name = manager.isFile(el) ? manager.getTitle(el)  : path[path.length - 1];
                if (manager.isSharedFolder(el)) {
                    name = manager.getSharedFolderData(el).title;
                }
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
                        var newName = $input.val();
                        if (JSON.stringify(path) === JSON.stringify(currentPath)) {
                            manager.rename(path, $input.val(), function () {
                                if (isFolder) {
                                    renameFoldersOpened(path, newName);
                                    path[path.length - 1] = newName;
                                }
                                APP.displayDirectory(path);
                            });
                        }
                        else {
                            manager.rename(path, $input.val(), function () {
                                if (isFolder) {
                                    renameFoldersOpened(path, newName);
                                    unselectElement($element);
                                    $element.data("path", $element.data("path").slice(0, -1).concat(newName));
                                    selectElement($element);
                                }
                                refresh();
                            });
                        }
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


        var pickFolderColor = function ($element, currentColor, cb) {
            var colors = ["", "#f23c38", "#ff0073", "#da0eba", "#9d00ac", "#6c19b3", "#4a42b1", "#3d8af0", "#30a0f1", "#1fb9d1", "#009686", "#45b354", "#84c750", "#c6e144", "#faf147", "#fbc423", "#fc9819", "#fd5227", "#775549", "#9c9c9c", "#607a89"];
            var colorsElements = [];
            var currentElement = null;
            colors.forEach(function (color, i) {
                var element = h("span.cp-app-drive-color-picker-color", [
                    h("span.cptools.cp-app-drive-icon-folder.cp-app-drive-content-icon" + (i === 0 ? ".cptools-folder-no-color" : ".cptools-folder")),
                    h("span.fa.fa-check")
                ]);
                $(element).css("color", colors[i]);
                if (colors[i] === currentColor) {
                    currentElement = element;
                    $(element).addClass("cp-app-drive-current-color");
                }
                $(element).on("click", function () {
                    $(currentElement).removeClass("cp-app-drive-current-color");
                    currentElement = element;
                    $(element).addClass("cp-app-drive-current-color");
                    cb(color);
                });
                colorsElements.push(element);
            });
            var content = h("div.cp-app-drive-color-picker", colorsElements);
            UI.alert(content);
        };

        var getFolderColor = function (path) {
            if (path.length === 0) { return; }
            return manager.getFolderData(path).color || "";
        };

        var setFolderColor = function ($element, path, color) {
            if ($element.length === 0) { return; }
            $element.find(".cp-app-drive-icon-folder").css("color", color);
            manager.setFolderData({
                path: path,
                key: "color",
                value: color
            }, function () {});
        };


        var filterContextMenu = function (type, paths) {
            if (!paths || paths.length === 0) { logError('no paths'); }

            $contextMenu.find('li').hide();

            var show = [];
            var filter;

            if (type === "content") {
                // Return true in filter to hide
                filter = function ($el, className) {
                    if (className === 'newfolder') { return; }
                    if (className === 'newsharedfolder') {
                        // Hide the new shared folder menu if we're already in a shared folder
                        return manager.isInSharedFolder(currentPath) || APP.disableSF;
                    }
                    if (className === 'uploadfiles') { return; }
                    if (className === 'uploadfolder') { return !APP.allowFolderUpload; }
                    if (className === 'newdoc') {
                        return AppConfig.availablePadTypes.indexOf($el.attr('data-type')) === -1;
                    }
                };
            } else {
                // In case of multiple selection, we must hide the option if at least one element
                // is not compatible
                var containsFolder = false;
                var hide = [];
                paths.forEach(function (p) {
                    var path = p.path;
                    var $element = p.element;
                    if (!$element.closest("#cp-app-drive-tree").length) {
                        hide.push('expandall');
                        hide.push('collapseall');
                    }
                    if (path.length === 1) {
                        // Can't rename, share, delete, or change the color of root elements
                        hide.push('delete');
                        hide.push('rename');
                        hide.push('share');
                        hide.push('color');
                    }
                    if (!$element.is('.cp-app-drive-element-owned')) {
                        hide.push('deleteowned');
                    }
                    if ($element.is('.cp-app-drive-element-notrash')) {
                        // We can't delete elements in virtual categories
                        hide.push('delete');
                    } else {
                        // We can only open parent in virtual categories
                        hide.push('openparent');
                    }
                    if (!$element.is('.cp-border-color-file')) {
                        //hide.push('download');
                        hide.push('openincode');
                    }
                    if ($element.is('.cp-app-drive-element-file')) {
                        // No folder in files
                        hide.push('color');
                        hide.push('newfolder');
                        if ($element.is('.cp-app-drive-element-readonly')) {
                            hide.push('open'); // Remove open 'edit' mode
                        } else if ($element.is('.cp-app-drive-element-noreadonly')) {
                            hide.push('openro'); // Remove open 'view' mode
                        }
                        // if it's not a plain text file
                        var metadata = manager.getFileData(manager.find(path));
                        if (!metadata || !Util.isPlainTextFile(metadata.fileType, metadata.title)) {
                            hide.push('openincode');
                        }
                    } else if ($element.is('.cp-app-drive-element-sharedf')) {
                        if (containsFolder) {
                            // More than 1 folder selected: cannot create a new subfolder
                            hide.push('newfolder');
                            hide.push('expandall');
                            hide.push('collapseall');
                        }
                        containsFolder = true;
                        hide.push('openro');
                        hide.push('openincode');
                        hide.push('hashtag');
                        hide.push('delete');
                        //hide.push('deleteowned');
                    } else { // it's a folder
                        if (containsFolder) {
                            // More than 1 folder selected: cannot create a new subfolder
                            hide.push('newfolder');
                            hide.push('expandall');
                            hide.push('collapseall');
                        }
                        containsFolder = true;
                        hide.push('share'); // XXX CONVERT
                        hide.push('openro');
                        hide.push('openincode');
                        hide.push('properties');
                        hide.push('hashtag');
                    }
                    // If we're in the trash, hide restore and properties for non-root elements
                    if (type === "trash" && path && path.length > 4) {
                        hide.push('restore');
                        hide.push('properties');
                    }
                    // If we're not in the trash nor in a shared folder, hide "remove"
                    if (!manager.isInSharedFolder(path)
                            && !$element.is('.cp-app-drive-element-sharedf')) {
                        hide.push('removesf');
                    } else if (type === "tree") {
                        hide.push('delete');
                        // Don't hide the deleteowned link if the element is a shared folder and
                        // it is owned
                        if (manager.isInSharedFolder(path) ||
                                !$element.is('.cp-app-drive-element-owned')) {
                            hide.push('deleteowned');
                        } else {
                            // This is a shared folder and it is owned
                            hide.push('removesf');
                        }
                    }
                });
                if (paths.length > 1) {
                    hide.push('restore');
                    hide.push('properties');
                    hide.push('rename');
                    hide.push('openparent');
                    hide.push('hashtag');
                    hide.push('download');
                    hide.push('share');
                    hide.push('openincode'); // can't because of race condition
                }
                if (containsFolder && paths.length > 1) {
                    // Cannot open multiple folders
                    hide.push('open');
                }

                filter = function ($el, className) {
                    if (hide.indexOf(className) !== -1) { return true; }
                };
            }

            switch(type) {
                case 'content':
                    show = ['newfolder', 'newsharedfolder', 'uploadfiles', 'uploadfolder', 'newdoc'];
                    break;
                case 'tree':
                    show = ['open', 'openro', 'openincode', 'expandall', 'collapseall', 'color', 'download', 'share', 'rename', 'delete', 'deleteowned', 'removesf', 'properties', 'hashtag'];
                    break;
                case 'default':
                    show = ['open', 'openro', 'share', 'openparent', 'delete', 'deleteowned', 'properties', 'hashtag'];
                    break;
                case 'trashtree': {
                    show = ['empty'];
                    break;
                }
                case 'trash': {
                    show = ['remove', 'restore', 'properties'];
                }
            }

            var filtered = [];
            show.forEach(function (className) {
                var $el = $contextMenu.find('.cp-app-drive-context-' + className);
                if (!APP.editable && $el.is('.cp-app-drive-context-editable')) { return; }
                if (filter($el, className)) { return; }
                $el.parent('li').show();
                filtered.push('.cp-app-drive-context-' + className);
            });
            return filtered;
        };

        var getSelectedPaths = function ($element) {
            var paths = [];
            if (!$element || $element.length === 0) { return paths; }
            if (findSelectedElements().length > 1) {
                var $selected = findSelectedElements();
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
            if (manager.isPathIn(currentPath, [TRASH])) {
                $driveToolbar.find('cp-app-drive-toolbar-emptytrash').show();
            } else {
                $driveToolbar.find('cp-app-drive-toolbar-emptytrash').hide();
            }
            var $li = findSelectedElements();
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
            var menuType = $element.data('context');
            if (!menuType) { return; }
            //var actions = [];
            var toShow = filterContextMenu(menuType, paths);
            var $actions = $contextMenu.find('a');
            $contextMenu.data('paths', paths);
            $actions = $actions.filter(function (i, el) {
                return toShow.some(function (className) { return $(el).is(className); });
            });
            $actions.each(function (i, el) {
                var $a = $('<button>', {'class': 'cp-app-drive-element'});
                if ($(el).attr('data-icon')) {
                    var font = $(el).attr('data-icon').indexOf('cptools') === 0 ? 'cptools' : 'fa';
                    $a.addClass(font).addClass($(el).attr('data-icon'));
                    $a.attr('title', $(el).text());
                } else {
                    $a.text($(el).text());
                }
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
                    if (!isElementSelected($(el))) {
                        selectElement($(el));
                    }
                });
                for (var i = Math.min(sel.startSelected, sel.endSelected);
                     i <= Math.max(sel.startSelected, sel.endSelected);
                     i++) {
                    $el = $($elements.get(i));
                    if (!isElementSelected($el)) {
                        selectElement($el);
                    }
                }
            } else {
                if (!isElementSelected($element)) {
                    selectElement($element);
                } else {
                    unselectElement($element);
                }
            }
            updateContextButton();
        };

        // show / hide dropdown separators
        var hideSeparators = function ($menu) {
            var showSep = false;
            var $lastVisibleSep = null;
            $menu.children().each(function (i, el) {
                var $el = $(el);
                if ($el.is(".dropdown-divider")) {
                    $el.css("display", showSep ? "list-item" : "none");
                    if (showSep) { $lastVisibleSep = $el; }
                    showSep = false;
                }
                else if ($el.is("li") && $el.css("display") !== "none") {
                    showSep = true;
                }
            });
            if (!showSep && $lastVisibleSep) { $lastVisibleSep.css("display", "none"); } // remove last divider if no options after
        };

        // prepare and display contextmenu
        var displayMenu = function (e) {
            var $menu = $contextMenu;
            // show / hide submenus
            $menu.find(".dropdown-submenu").each(function (i, el) {
                var $el = $(el);
                $el.children(".dropdown-menu").css("display", "none");
                $el.find("li").each(function (i, li) {
                    if ($(li).css("display") !== "none") {
                        $el.css("display", "block");
                        return;
                    }
                });
            });
            // show / hide separators
            $menu.find(".dropdown-menu").each(function (i, menu) {
                hideSeparators($(menu));
            });
            // show contextmenu at cursor position
            $menu.css({ display: "block" });
            if (APP.mobile()) {
                $menu.css({
                    top: ($("#cp-app-drive-toolbar-context-mobile").offset().top + 32) + 'px',
                    right: '0px',
                    left: ''
                });
                return;
            }
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
        var openContextMenu = function (type) {
            return function (e) {
                APP.hideMenu();
                e.stopPropagation();

                var paths;
                if (type === 'content') {
                    paths = [{path: $(e.target).closest('#' + FOLDER_CONTENT_ID).data('path')}];
                    if (!paths) { return; }
                    removeSelected();
                } else {
                    var $element = findDataHolder($(e.target));

                    // if clicked from tree
                    var fromTree = $element.closest("#cp-app-drive-tree").length;
                    if (fromTree) {
                        removeSelected();
                    }

                    // if clicked on non selected element
                    if (!isElementSelected($element)) {
                        removeSelected();
                    }

                    if (type === 'trash' && !$element.data('path')) { return; }

                    if (!$element.length) {
                        logError("Unable to locate the .element tag", e.target);
                        log(Messages.fm_contextMenuError);
                        return false;
                    }

                    if (!isElementSelected($element)) {
                        selectElement($element);
                    }

                    paths = getSelectedPaths($element);
                }

                $contextMenu.attr('data-menu-type', type);

                filterContextMenu(type, paths);

                displayMenu(e);

                $(".cp-app-drive-context-noAction").toggle($contextMenu.find('li:visible').length === 0);

                $contextMenu.data('paths', paths);
                return false;
            };
        };

        var getElementName = function (path) {
            var file = manager.find(path);
            if (!file) { return; }
            if (manager.isSharedFolder(file)) {
                return manager.getSharedFolderData(file).title;
            }
            return manager.getTitle(file);
        };
        // moveElements is able to move several paths to a new location
        var moveElements = function (paths, newPath, copy, cb) {
            if (!APP.editable) { return; }
            // Cancel drag&drop from TRASH to TRASH
            if (manager.isPathIn(newPath, [TRASH]) && paths.length && paths[0][0] === TRASH) {
                return;
            }
            var newCb = function () {
                paths.forEach(function (path) {
                    moveFoldersOpened(path, newPath);
                });
                cb();
            };
            if (paths.some(function (p) { return manager.comparePath(newPath, p); })) { return void cb(); }
            manager.move(paths, newPath, newCb, copy);
        };
        // Delete paths from the drive and/or shared folders (without moving them to the trash)
        var deletePaths = function (paths, pathsList) {
            pathsList = pathsList || [];
            if (paths) {
                paths.forEach(function (p) { pathsList.push(p.path); });
            }
            var hasOwned = pathsList.some(function (p) {
                // NOTE: Owned pads in shared folders won't be removed from the server
                // so we don't have to check, we can use the default message
                if (manager.isInSharedFolder(p)) { return false; }

                var el = manager.find(p);
                var data = manager.isSharedFolder(el) ? manager.getSharedFolderData(el)
                                        : manager.getFileData(el);
                return data.owners && data.owners.indexOf(edPublic) !== -1;
            });
            var msg = Messages._getKey("fm_removeSeveralPermanentlyDialog", [pathsList.length]);
            if (pathsList.length === 1) {
                msg = hasOwned ? Messages.fm_deleteOwnedPad : Messages.fm_removePermanentlyDialog;
            } else if (hasOwned) {
                msg = msg + '<br><em>' + Messages.fm_removePermanentlyNote + '</em>';
            }
            UI.confirm(msg, function(res) {
                $(window).focus();
                if (!res) { return; }
                manager.delete(pathsList, function () {
                    pathsList.forEach(removeFoldersOpened);
                    removeSelected();
                    refresh();
                });
            }, null, true);
        };
        // Drag & drop:
        // The data transferred is a stringified JSON containing the path of the dragged element
        var onDrag = function (ev, path) {
            var paths = [];
            var $element = findDataHolder($(ev.target));
            if ($element.hasClass('cp-app-drive-element-selected')) {
                var $selected = findSelectedElements();
                $selected.each(function (idx, elmt) {
                    var ePath = $(elmt).data('path');
                    if (ePath) {
                        var val = manager.find(ePath);
                        if (!val) { return; } // Error? A ".selected" element is not in the object
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
                selectElement($element);
                var val = manager.find(path);
                if (!val) { return; } // The element is not in the object
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
            var $el;
            if ($target.is(".cp-app-drive-path-element")) {
                $el = $target;
            }
            else {
                $el = findDataHolder($target);
            }
            var newPath = $el.data('path');
            var dropEl = newPath && manager.find(newPath);
            if (newPath && manager.isSharedFolder(dropEl)) {
                newPath.push(manager.user.userObject.ROOT);
            } else if ((!newPath || manager.isFile(dropEl))
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

            // Don't use the normal drop handler for file upload
            var fileDrop = ev.dataTransfer.files;
            if (fileDrop.length) { return void onFileDrop(fileDrop, ev); }

            var oldPaths = JSON.parse(data).path;
            if (!oldPaths) { return; }
            // A moved element should be removed from its previous location
            var movedPaths = [];

            var sharedF = false;
            oldPaths.forEach(function (p) {
                movedPaths.push(p.path);
                if (!sharedF && manager.isInSharedFolder(p.path)) {
                    sharedF = true;
                }
            });

            var newPath = findDropPath(ev.target);
            if (!newPath) { return; }
            if (sharedF && manager.isPathIn(newPath, [TRASH])) {
                return void deletePaths(null, movedPaths);
            }

            var copy = false;
            if (manager.isPathIn(newPath, [TRASH])) {
                // Filter the selection to remove shared folders.
                // Shared folders can't be moved to the trash!
                var filteredPaths = movedPaths.filter(function (p) {
                    var el = manager.find(p);
                    return !manager.isSharedFolder(el);
                });

                if (!filteredPaths.length) {
                    // We only have shared folder, delete them
                    return void deletePaths(null, movedPaths);
                }

                movedPaths = filteredPaths;
            } else if (ev.ctrlKey || (ev.metaKey && APP.isMac)) {
                copy = true;
            }

            if (movedPaths && movedPaths.length) {
                moveElements(movedPaths, newPath, copy, refresh);
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
        var _addOwnership = function ($span, $state, data) {
            if (data.owners && data.owners.indexOf(edPublic) !== -1) {
                var $owned = $ownedIcon.clone().appendTo($state);
                $owned.attr('title', Messages.fm_padIsOwned);
                $span.addClass('cp-app-drive-element-owned');
            } else if (data.owners && data.owners.length) {
                var $owner = $ownerIcon.clone().appendTo($state);
                $owner.attr('title', Messages.fm_padIsOwnedOther);
            }
        };
        var thumbsUrls = {};
        var addFileData = function (element, $element) {
            if (!manager.isFile(element)) { return; }

            var data = manager.getFileData(element);
            var href = data.href || data.roHref;
            if (!data) { return void logError("No data for the file", element); }

            var hrefData = Hash.parsePadUrl(href);
            if (hrefData.type) {
                $element.addClass('cp-border-color-'+hrefData.type);
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
            if (hrefData.hashData && hrefData.hashData.password) {
                var $password = $passwordIcon.clone().appendTo($state);
                $password.attr('title', Messages.fm_passwordProtected || '');
            }
            if (data.expire) {
                var $expire = $expirableIcon.clone().appendTo($state);
                $expire.attr('title', Messages._getKey('fm_expirablePad', [new Date(data.expire).toLocaleString()]));
            }
            _addOwnership($element, $state, data);

            var name = manager.getTitle(element);

            // The element with the class '.name' is underlined when the 'li' is hovered
            var $name = $('<span>', {'class': 'cp-app-drive-element-name'}).text(name);
            $element.append($name);
            $element.append($state);
            $element.attr('title', name);

            // display the thumbnail
            // if the thumbnail has already been displayed once, do not reload it, keep the same url
            if (thumbsUrls[element]) {
                var img = new Image();
                img.src = thumbsUrls[element];
                $element.find('.cp-icon').addClass('cp-app-drive-element-list');
                $element.prepend(img);
                $(img).addClass('cp-app-drive-element-grid cp-app-drive-element-thumbnail');
                $(img).attr("draggable", false);
            }
            else {
                common.displayThumbnail(href || data.roHref, data.channel, data.password, $element, function ($thumb) {
                    // Called only if the thumbnail exists
                    // Remove the .hide() added by displayThumnail() because it hides the icon in list mode too
                    $element.find('.cp-icon').removeAttr('style').addClass('cp-app-drive-element-list');
                    $thumb.addClass('cp-app-drive-element-grid cp-app-drive-element-thumbnail');
                    $thumb.attr("draggable", false);
                    thumbsUrls[element] = $thumb[0].src;
                });
            }

            var type = Messages.type[hrefData.type] || hrefData.type;
            var $type = $('<span>', {
                'class': 'cp-app-drive-element-type cp-app-drive-element-list'
            }).text(type);
            var $adate = $('<span>', {
                'class': 'cp-app-drive-element-atime cp-app-drive-element-list'
            }).text(getDate(data.atime));
            var $cdate = $('<span>', {
                'class': 'cp-app-drive-element-ctime cp-app-drive-element-list'
            }).text(getDate(data.ctime));
            $element.append($type).append($adate).append($cdate);
        };

        var addFolderData = function (element, key, $span) {
            if (!element || !manager.isFolder(element)) { return; }
            // The element with the class '.name' is underlined when the 'li' is hovered
            var $state = $('<span>', {'class': 'cp-app-drive-element-state'});
            if (manager.isSharedFolder(element)) {
                var data = manager.getSharedFolderData(element);
                key = data && data.title ? data.title : key;
                element = manager.folders[element].proxy[manager.user.userObject.ROOT];
                $span.addClass('cp-app-drive-element-sharedf');
                _addOwnership($span, $state, data);

                var $shared = $sharedIcon.clone().appendTo($state);
                $shared.attr('title', Messages.fm_canBeShared);
            }

            var sf = manager.hasSubfolder(element);
            var files = manager.hasFile(element);
            var $name = $('<span>', {'class': 'cp-app-drive-element-name'}).text(key);
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
            var data = manager.getFileData(id);
            return UI.getFileIcon(data);
        };
        var getIcon = UI.getIcon;

        // Create the "li" element corresponding to the file/folder located in "path"
        var createElement = function (path, elPath, root, isFolder) {
            // Forbid drag&drop inside the trash
            var isTrash = path[0] === TRASH;
            var newPath = path.slice();
            var key;
            var element;
            if (isTrash && Array.isArray(elPath)) {
                key = elPath[0];
                elPath.forEach(function (k) { newPath.push(k); });
                element = manager.find(newPath);
            } else {
                key = elPath;
                newPath.push(key);
                element = root[key];
            }

            var isSharedFolder = manager.isSharedFolder(element);

            var $icon = !isFolder ? getFileIcon(element) : undefined;
            var ro = manager.isReadOnlyFile(element);
            // ro undefined means it's an old hash which doesn't support read-only
            var roClass = typeof(ro) === 'undefined' ?' cp-app-drive-element-noreadonly' :
                            ro ? ' cp-app-drive-element-readonly' : '';
            var liClass = 'cp-app-drive-element-file cp-app-drive-element' + roClass;
            if (isSharedFolder) {
                liClass = 'cp-app-drive-element-folder cp-app-drive-element';
                $icon = $sharedFolderIcon.clone();
                $icon.css("color", getFolderColor(path.concat(elPath)));
            } else if (isFolder) {
                liClass = 'cp-app-drive-element-folder cp-app-drive-element';
                $icon = manager.isFolderEmpty(root[key]) ? $folderEmptyIcon.clone() : $folderIcon.clone();
                $icon.css("color", getFolderColor(path.concat(elPath)));
            }
            var $element = $('<li>', {
                draggable: true,
                'class': 'cp-app-drive-element-row'
            });
            $element.data('path', newPath);
            if (isElementSelected($element)) {
                selectElement($element);
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
            addDragAndDropHandlers($element, newPath, isFolder, !isTrash);
            $element.click(function(e) {
                e.stopPropagation();
                onElementClick(e, $element);
            });
            if (!isTrash) {
                $element.contextmenu(openContextMenu('tree'));
                $element.data('context', 'tree');
            } else {
                $element.contextmenu(openContextMenu('trash'));
                $element.data('context', 'trash');
            }
            var isNewFolder = APP.newFolder && manager.comparePath(newPath, APP.newFolder);
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
                case OWNED: pName = OWNED_NAME; break;
                case TAGS: pName = TAGS_NAME; break;
                case SHARED_FOLDER: pName = SHARED_FOLDER_NAME; break;
                default: pName = name;
            }
            return pName;
        };

        var drivePathOverflowing = function () {
            var $container = $(".cp-app-drive-path");
            if ($container.length) {
                $container.css("overflow", "hidden");
                var overflown = $container[0].scrollWidth > $container[0].clientWidth;
                $container.css("overflow", "");
                return overflown;
            }
        };

        var collapseDrivePath = function () {
            var $container = $(".cp-app-drive-path-inner");
            var $spanCollapse = $(".cp-app-drive-path-collapse");
            $spanCollapse.css("display", "none");

            var $pathElements = $container.find(".cp-app-drive-path-element");
            $pathElements.not($spanCollapse).css("display", "");

            var oneFolder = currentPath.length > 1 + (currentPath[0] === SHARED_FOLDER);
            if (oneFolder && drivePathOverflowing()) {
                var collapseLevel = 0;
                var removeOverflowElement = function () {
                    if (drivePathOverflowing()) {
                        if ($pathElements.length <= 3) {
                            return false;
                        }
                        collapseLevel++;
                        if ($($pathElements.get(-2)).is(".cp-app-drive-path-separator")) {
                            $($pathElements.get(-2)).css("display", "none");
                            $pathElements = $pathElements.not($pathElements.get(-2));
                        }
                        $($pathElements.get(-2)).css("display", "none");
                        $pathElements = $pathElements.not($pathElements.get(-2));
                        return true;
                    }
                };

                currentPath.every(removeOverflowElement);
                $spanCollapse.css("display", "");
                removeOverflowElement();

                var tipPath = currentPath.slice(0, collapseLevel);
                tipPath[0] = getPrettyName(tipPath[0]);
                $spanCollapse.attr("title", tipPath.join(" / "));
                $spanCollapse[0].onclick = function () {
                    APP.displayDirectory(getLastOpenedFolder().slice(0, collapseLevel));
                };
            }
        };

        window.addEventListener("resize", collapseDrivePath);
        var treeResizeObserver = new MutationObserver(collapseDrivePath);
        treeResizeObserver.observe($("#cp-app-drive-tree")[0], {"attributes": true});
        var toolbarButtonAdditionObserver = new MutationObserver(collapseDrivePath);
        $(function () { toolbarButtonAdditionObserver.observe($("#cp-app-drive-toolbar")[0], {"childList": true, "subtree": true}); });


        // Create the title block with the "parent folder" button
        var createTitle = function ($container, path, noStyle) {
            if (!path || path.length === 0) { return; }
            var isTrash = manager.isPathIn(path, [TRASH]);
            if (APP.mobile() && !noStyle) { // noStyle means title in search result
                return $container;
            }
            var isVirtual = virtualCategories.indexOf(path[0]) !== -1;
            var el = isVirtual ? undefined : manager.find(path);
            path = path[0] === SEARCH ? path.slice(0,1) : path;

            var $inner = $('<div>', {'class': 'cp-app-drive-path-inner'});
            $container.prepend($inner);

            var skipNext = false; // When encountering a shared folder, skip a key in the path
            path.forEach(function (p, idx) {
                if (skipNext) { skipNext = false; return; }
                if (isTrash && [2,3].indexOf(idx) !== -1) { return; }

                var name = p;

                var currentEl = isVirtual ? undefined : manager.find(path.slice(0, idx+1));
                if (p === SHARED_FOLDER || (currentEl && manager.isSharedFolder(currentEl))) {
                    name = manager.getSharedFolderData(currentEl || APP.newSharedFolder).title;
                    skipNext = true;
                }

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
                } else if (idx > 0 && manager.isFile(el)) {
                    name = getElementName(path);
                }
                $span.data("path", path.slice(0, idx + 1));
                addDragAndDropHandlers($span, path.slice(0, idx), true, true);

                if (idx === 0) { name = p === SHARED_FOLDER ? name : getPrettyName(p); }
                else {
                    var $span2 = $('<span>', {
                        'class': 'cp-app-drive-path-element cp-app-drive-path-separator'
                    }).text(' / ');
                    $inner.prepend($span2);
                }
                $span.text(name).prependTo($inner);
            });

            var $spanCollapse = $('<span>', {
                'class': 'cp-app-drive-path-element cp-app-drive-path-collapse'
            }).text(' ... ');
            $inner.append($spanCollapse);

            collapseDrivePath();
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
                case TAGS:
                    break;
                default:
                    msg = undefined;
            }
            if (history.isHistoryMode && history.sfId) {
                // Shared folder history: always display the warning
                var sfName = (manager.getSharedFolderData(history.sfId) || {}).title || Messages.fm_sharedFolderName;
                msg = Messages._getKey('fm_info_sharedFolderHistory', [sfName]);
                return $(common.fixLinks($box.html(msg)));
            }
            if (!APP.loggedIn) {
                msg = APP.newSharedFolder ? Messages.fm_info_sharedFolder : Messages.fm_info_anonymous;
                return $(common.fixLinks($box.html(msg)));
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
                    manager.emptyTrash(refresh);
                });
            });
            $container.append($button);
        };

        // Get the upload options
        var addSharedFolderModal = function (cb) {
            var createHelper = function (href, text) {
                var q = h('a.fa.fa-question-circle', {
                    style: 'text-decoration: none !important;',
                    title: text,
                    href: APP.origin + href,
                    target: "_blank",
                    'data-tippy-placement': "right"
                });
                return q;
            };

            // Ask for name, password and owner
            var content = h('div', [
                h('h4', Messages.sharedFolders_create),
                h('label', {for: 'cp-app-drive-sf-name'}, Messages.sharedFolders_create_name),
                h('input#cp-app-drive-sf-name', {type: 'text', placeholder: Messages.fm_newFolder}),
                h('label', {for: 'cp-app-drive-sf-password'}, Messages.sharedFolders_create_password),
                UI.passwordInput({id: 'cp-app-drive-sf-password'}),
                h('span', {
                    style: 'display:flex;align-items:center;justify-content:space-between'
                }, [
                    UI.createCheckbox('cp-app-drive-sf-owned', Messages.sharedFolders_create_owned, true),
                    createHelper('/faq.html#keywords-owned', Messages.creation_owned1) // TODO
                ]),
            ]);

            $(content).find('#cp-app-drive-sf-name').keydown(function (e) {
                if (e.which === 13) {
                    UI.findOKButton().click();
                }
            });

            UI.confirm(content, function (yes) {
                if (!yes) { return void cb(); }

                // Get the values
                var newName = $(content).find('#cp-app-drive-sf-name').val();
                var password = $(content).find('#cp-app-drive-sf-password').val() || undefined;
                var owned = $(content).find('#cp-app-drive-sf-owned').is(':checked');

                cb({
                    name: newName,
                    password: password,
                    owned: owned
                });
            });
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
        var showUploadFilesModal = function () {
            var $input = $('<input>', {
                'type': 'file',
                'style': 'display: none;',
                'multiple': 'multiple'
            }).on('change', function (e) {
                var files = Util.slice(e.target.files);
                files.forEach(function (file) {
                    var ev = {
                        target: $content[0],
                        path: findDropPath($content[0])
                    };
                    APP.FM.handleFile(file, ev);
                });
            });
            $input.click();
        };

        // create the folder structure before to upload files from folder
        var uploadFolder = function (fileList) {
            var currentFolder = currentPath;
            // create an array of all the files relative path
            var files = Array.prototype.map.call(fileList, function (file) {
                return {
                    file: file,
                    path: file.webkitRelativePath.split("/"),
                };
            });
            // if folder name already exist in drive, rename it
            var uploadedFolderName = files[0].path[0];
            var availableName = manager.user.userObject.getAvailableName(manager.find(currentFolder), uploadedFolderName);

            // ask for folder name and files options, then upload all the files!
            APP.FM.showFolderUploadModal(availableName, function (folderUploadOptions) {
                if (!folderUploadOptions) { return; }

                // verfify folder name is possible, and update files path
                availableName = manager.user.userObject.getAvailableName(manager.find(currentFolder), folderUploadOptions.folderName);
                if (uploadedFolderName !== availableName) {
                    files.forEach(function (file) {
                        file.path[0] = availableName;
                    });
                }

                // uploadSteps is an array of objects {folders: [], files: []}, containing all the folders and files to create safely
                // at the index i + 1, the files and folders are children of the folders at the index i
                var maxSteps = files.reduce(function (max, file) { return Math.max(max, file.path.length); }, 0);
                var uploadSteps = [];
                for (var i = 0 ; i < maxSteps ; i++) {
                    uploadSteps[i] = {
                        folders: [],
                        files: [],
                    };
                }
                files.forEach(function (file) {
                    // add steps to create subfolders containing file
                    for (var depth = 0 ; depth < file.path.length - 1 ; depth++) {
                        var subfolderStr = file.path.slice(0, depth + 1).join("/");
                        if (uploadSteps[depth].folders.indexOf(subfolderStr) === -1) {
                            uploadSteps[depth].folders.push(subfolderStr);
                        }
                    }
                    // add step to upload file (one step later than the step of its direct parent folder)
                    uploadSteps[file.path.length - 1].files.push(file);
                });

                // add folders, then add files when theirs folders have been created
                // wait for the folders to be created to go to the next step (don't wait for the files)
                var stepByStep = function (uploadSteps, i) {
                    if (i >= uploadSteps.length) { return; }
                    nThen(function (waitFor) {
                        // add folders
                        uploadSteps[i].folders.forEach(function (folder) {
                            var folderPath = folder.split("/");
                            var parentFolder = currentFolder.concat(folderPath.slice(0, -1));
                            var folderName = folderPath.slice(-1);
                            manager.addFolder(parentFolder, folderName, waitFor(refresh));
                        });
                        // upload files
                        uploadSteps[i].files.forEach(function (file) {
                            var ev = {
                                target: $content[0],
                                path: currentFolder.concat(file.path.slice(0, -1)),
                            };
                            APP.FM.handleFile(file.file, ev, folderUploadOptions);
                        });
                    }).nThen(function () {
                        stepByStep(uploadSteps, i + 1);
                    });
                };

                stepByStep(uploadSteps, 0);
            });
        };
        var showUploadFolderModal = function () {
            var $input = $('<input>', {
                'type': 'file',
                'style': 'display: none;',
                'multiple': 'multiple',
                'webkitdirectory': true,
            }).on('change', function (e) {
                uploadFolder(e.target.files);
            });
            $input.click();
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
                    manager.addFolder(currentPath, null, onCreated);
                });
                if (!APP.disableSF && !manager.isInSharedFolder(currentPath)) {
                    $block.find('a.cp-app-drive-new-shared-folder, li.cp-app-drive-new-shared-folder')
                        .click(function () {
                        addSharedFolderModal(function (obj) {
                            if (!obj) { return; }
                            manager.addSharedFolder(currentPath, obj, refresh);
                        });
                    });
                }
                $block.find('a.cp-app-drive-new-fileupload, li.cp-app-drive-new-fileupload').click(showUploadFilesModal);
                $block.find('a.cp-app-drive-new-folderupload, li.cp-app-drive-new-folderupload').click(showUploadFolderModal);
            }
            $block.find('a.cp-app-drive-new-doc, li.cp-app-drive-new-doc')
                .click(function () {
                var type = $(this).attr('data-type') || 'pad';
                var path = manager.isPathIn(currentPath, [TRASH]) ? '' : currentPath;
                common.sessionStorage.put(Constants.newPadPathKey, path, function () {
                    common.openURL('/' + type + '/');
                });
            });
        };
        var createNewButton = function (isInRoot, $container) {
            if (!APP.editable) { return; }
            if (!APP.loggedIn) { return; } // Anonymous users can use the + menu in the toolbar

            if (!manager.isPathIn(currentPath, [ROOT, 'hrefArray'])) { return; }

            // Create dropdown
            var options = [];
            if (isInRoot) {
                options.push({
                    tag: 'a',
                    attributes: {'class': 'cp-app-drive-new-folder'},
                    content: $('<div>').append($folderIcon.clone()).html() + Messages.fm_folder
                });
                if (!APP.disableSF && !manager.isInSharedFolder(currentPath)) {
                    options.push({
                        tag: 'a',
                        attributes: {'class': 'cp-app-drive-new-shared-folder'},
                        content: $('<div>').append($sharedFolderIcon.clone()).html() + Messages.fm_sharedFolder
                    });
                }
                options.push({tag: 'hr'});
                options.push({
                    tag: 'a',
                    attributes: {'class': 'cp-app-drive-new-fileupload'},
                    content: $('<div>').append(getIcon('fileupload')).html() + Messages.uploadButton
                });
                if (APP.allowFolderUpload) {
                    options.push({
                        tag: 'a',
                        attributes: {'class': 'cp-app-drive-new-folderupload'},
                        content: $('<div>').append(getIcon('folderupload')).html() + Messages.uploadFolderButton
                    });
                }
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

        var createShareButton = function (id, $container) {
            var $shareBlock = $('<button>', {
                'class': 'cp-toolbar-share-button',
                title: Messages.shareButton
            });
            $sharedIcon.clone().appendTo($shareBlock);
            $('<span>').text(Messages.shareButton).appendTo($shareBlock);
            var data = manager.getSharedFolderData(id);
            var parsed = Hash.parsePadUrl(data.href);
            if (!parsed || !parsed.hash) { return void console.error("Invalid href: "+data.href); }
            var friends = common.getFriends();
            var modal = UIElements.createSFShareModal({
                origin: APP.origin,
                pathname: "/drive/",
                friends: friends,
                title: data.title,
                password: data.password,
                common: common,
                hashes: {
                    editHash: parsed.hash
                }
            });
            $shareBlock.click(function () {
                UI.openCustomModal(modal, {
                    wide: Object.keys(friends).length !== 0
                });
            });
            $container.append($shareBlock);
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
            $fihElement.append($fhAdate).append($fhCdate);
            addFileSortIcon($fihElement);
            return $fihElement;
        };

        var sortElements = function (folder, path, oldkeys, prop, asc, useId) {
            var root = path && manager.find(path);
            if (path[0] === SHARED_FOLDER) {
                path = path.slice(1);
                root = Util.find(folders[APP.newSharedFolder], path);
            }
            var test = folder ? manager.isFolder : manager.isFile;
            var keys = oldkeys.filter(function (e) {
                return useId ? test(e) : (path && test(root[e]));
            });
            if (keys.length < 2) { return keys; }
            var mult = asc ? 1 : -1;
            var getProp = function (el, prop) {
                if (folder && root[el] && manager.isSharedFolder(root[el])) {
                    var title = manager.getSharedFolderData(root[el]).title || el;
                    return title.toLowerCase();
                } else if (folder) {
                    return el.toLowerCase();
                }
                var id = useId ? el : root[el];
                var data = manager.getFileData(id);
                if (!data) { return ''; }
                if (prop === 'type') {
                    var hrefData = Hash.parsePadUrl(data.href || data.roHref);
                    return hrefData.type;
                }
                if (prop === 'atime' || prop === 'ctime') {
                    return new Date(data[prop]);
                }
                return (manager.getTitle(id) || "").toLowerCase();
            };
            keys.sort(function(a, b) {
                if (getProp(a, prop) < getProp(b, prop)) { return mult * -1; }
                if (getProp(a, prop) > getProp(b, prop)) { return mult * 1; }
                return 0;
            });
            return keys;
        };
        var sortTrashElements = function (folder, oldkeys, prop, asc) {
            var test = folder ? manager.isFolder : manager.isFile;
            var keys = oldkeys.filter(function (e) {
                return test(e.element);
            });
            if (keys.length < 2) { return keys; }
            var mult = asc ? 1 : -1;
            var getProp = function (el, prop) {
                if (prop && !folder) {
                    var element = el.element;
                    var e = manager.getFileData(element);
                    if (!e) {
                        e = {
                            href : el,
                            title : Messages.fm_noname,
                            atime : 0,
                            ctime : 0
                        };
                    }
                    if (prop === 'type') {
                        var hrefData = Hash.parsePadUrl(e.href || e.roHref);
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
                // Shared Folder
                if (!APP.disableSF && !manager.isInSharedFolder(currentPath)) {
                    var $element3 = $('<li>', {
                        'class': 'cp-app-drive-new-shared-folder cp-app-drive-element-row ' +
                                 'cp-app-drive-element-grid'
                    }).prepend($sharedFolderIcon.clone()).appendTo($container);
                    $element3.append($('<span>', { 'class': 'cp-app-drive-new-name' })
                        .text(Messages.fm_sharedFolder));
                }
                // Upload file
                var $elementFileUpload = $('<li>', {
                    'class': 'cp-app-drive-new-fileupload cp-app-drive-element-row ' +
                        'cp-app-drive-element-grid'
                }).prepend(getIcon('fileupload')).appendTo($container);
                $elementFileUpload.append($('<span>', {'class': 'cp-app-drive-new-name'})
                    .text(Messages.uploadButton));
                // Upload folder
                if (APP.allowFolderUpload) {
                    var $elementFolderUpload = $('<li>', {
                        'class': 'cp-app-drive-new-folderupload cp-app-drive-element-row ' +
                        'cp-app-drive-element-grid'
                    }).prepend(getIcon('folderupload')).appendTo($container);
                    $elementFolderUpload.append($('<span>', {'class': 'cp-app-drive-new-name'})
                        .text(Messages.uploadFolderButton));
                }
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
            $('<div>', {'class': 'cp-app-drive-toolbar-filler'}).appendTo($toolbar);
            var $rightside = $('<div>', {'class': 'cp-app-drive-toolbar-rightside'})
                .appendTo($toolbar);
            if (APP.loggedIn || !APP.newSharedFolder) {
                // ANON_SHARED_FOLDER
                var $hist = common.createButton('history', true, {histConfig: APP.histConfig});
                $rightside.append($hist);
            }
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
                var file = manager.getFileData(id);
                if (!file) {
                    //debug("Unsorted or template returns an element not present in filesData: ", href);
                    file = { title: Messages.fm_noname };
                    //return;
                }
                var idx = files[rootName].indexOf(id);
                var $icon = getFileIcon(id);
                var ro = manager.isReadOnlyFile(id);
                // ro undefined mens it's an old hash which doesn't support read-only
                var roClass = typeof(ro) === 'undefined' ? ' cp-app-drive-element-noreadonly' :
                                ro ? ' cp-app-drive-element-readonly' : '';
                var $element = $('<li>', {
                    'class': 'cp-app-drive-element cp-app-drive-element-file cp-app-drive-element-row' + roClass,
                    draggable: draggable
                });

                var path = [rootName, idx];
                $element.data('path', path);
                if (isElementSelected($element)) {
                    selectElement($element);
                }
                $element.prepend($icon).dblclick(function () {
                    openFile(id);
                });
                addFileData(id, $element);
                $element.click(function(e) {
                    e.stopPropagation();
                    onElementClick(e, $element);
                });
                $element.contextmenu(openContextMenu('default'));
                $element.data('context', 'default');
                if (draggable) {
                    addDragAndDropHandlers($element, path, false, false);
                }
                $container.append($element);
            });
            createGhostIcon($container);
        };

        var displayAllFiles = function ($container) {
            if (AppConfig.disableAnonymousStore && !APP.loggedIn) {
                $container.append(Messages.anonymousStoreDisabled);
                return;
            }
            var allfiles = files[FILES_DATA];
            if (allfiles.length === 0) { return; }
            var $fileHeader = getFileListHeader(false);
            $container.append($fileHeader);
            var keys = manager.getFiles([FILES_DATA]);
            var sortedFiles = sortElements(false, [FILES_DATA], keys, APP.store[SORT_FILE_BY], !getSortFileDesc(), true);
            sortedFiles.forEach(function (id) {
                var $icon = getFileIcon(id);
                var ro = manager.isReadOnlyFile(id);
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
                $element.contextmenu(openContextMenu('default'));
                $element.data('context', 'default');
                $container.append($element);
            });
            createGhostIcon($container);
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
                    if (!manager.isFile(el.element) && !manager.isFolder(el.element)) { return; }
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
            if (manager.hasSubfolder(root, true)) { $list.append($folderHeader); }
            sortedFolders.forEach(function (f) {
                var $element = createElement([TRASH], f.spath, root, true);
                $list.append($element);
            });
            if (manager.hasFile(root, true)) { $list.append($fileHeader); }
            sortedFiles.forEach(function (f) {
                var $element = createElement([TRASH], f.spath, root, false);
                $list.append($element);
            });
        };

        var displaySearch = function ($list, value) {
            var filesList = manager.search(value);
            filesList.forEach(function (r) {
                // if r.id === null, then it's a folder, not a file
                r.paths.forEach(function (path) {
                    if (!r.inSharedFolder &&
                        APP.hideDuplicateOwned && manager.isDuplicateOwned(path)) { return; }
                    var href = r.data.href;
                    var parsed = Hash.parsePadUrl(href);
                    var $table = $('<table>');
                    var $icon = $('<td>', {'rowspan': '3', 'class': 'cp-app-drive-search-icon'});
                    var $title = $('<td>', {
                        'class': 'cp-app-drive-search-col1 cp-app-drive-search-title'
                    }).text(r.data.title);
                    if (manager.isPathIn(path, ['hrefArray'])) {
                        path.pop();
                        path.push(r.data.title);
                    }
                    var $path = $('<td>', {
                        'class': 'cp-app-drive-search-col1 cp-app-drive-search-path'
                    });
                    createTitle($path, path, true);
                    var $typeName = $('<td>', {'class': 'cp-app-drive-search-label2'}).text(Messages.fm_type);
                    var $type = $('<td>', {'class': 'cp-app-drive-search-col2'});
                    var $atimeName = $('<td>', {'class': 'cp-app-drive-search-label2'});
                    var $atime = $('<td>', {'class': 'cp-app-drive-search-col2'});
                    var $ctimeName = $('<td>', {'class': 'cp-app-drive-search-label2'});
                    var $ctime = $('<td>', {'class': 'cp-app-drive-search-col2'});
                    var $openDir = $('<td>', {'class': 'cp-app-drive-search-opendir'});
                    if (r.id) {
                        $icon.append(getFileIcon(r.id));
                        $type.text(Messages.type[parsed.type] || parsed.type);
                        $title.click(function () {
                            openFile(null, r.data.href);
                        });
                        $atimeName.text(Messages.fm_lastAccess);
                        $atime.text(new Date(r.data.atime).toLocaleString());
                        $ctimeName.text(Messages.fm_creation);
                        $ctime.text(new Date(r.data.ctime).toLocaleString());
                        var parentPath = path.slice();
                        if (parentPath) {
                            $('<a>').text(Messages.fm_openParent).click(function (e) {
                                e.preventDefault();
                                if (manager.isInTrashRoot(parentPath)) { parentPath = [TRASH]; }
                                else { parentPath.pop(); }
                                APP.displayDirectory(parentPath);
                                APP.selectedFiles = path.slice(-1);
                            }).appendTo($openDir);
                        }
                        $('<a>').text(Messages.fc_prop).click(function () {
                            APP.getProperties(r.id, function (e, $prop) {
                                if (e) { return void logError(e); }
                                UI.alert($prop[0], undefined, true);
                            });
                        }).appendTo($openDir);
                    }
                    else {
                        $icon.append($folderIcon.clone());
                        $type.text(Messages.fm_folder);
                        $('<a>').text(Messages.fc_open).click(function (e) {
                            e.preventDefault();
                            APP.displayDirectory(path);
                        }).appendTo($openDir);
                    }

                    // rows 1-3
                    $('<tr>').append($icon).append($title).append($typeName).append($type).appendTo($table);
                    $('<tr>').append($path).append($atimeName).append($atime).appendTo($table);
                    $('<tr>').append($openDir).append($ctimeName).append($ctime).appendTo($table);
                    $('<li>', {'class':'cp-app-drive-search-result'}).append($table).appendTo($list);
                });
            });
        };

        var displayRecent = function ($list) {
            var filesList = manager.getRecentPads();
            var limit = 20;

            var now = new Date();
            var last1 = new Date(now);
            last1.setDate(last1.getDate()-1);
            var last7 = new Date(now);
            last7.setDate(last7.getDate()-7);
            var last28 = new Date(now);
            last28.setDate(last28.getDate()-28);

            var header7, header28, headerOld;
            var i = 0;
            var channels = [];

            $list.append(h('li.cp-app-drive-element-separator', h('span', Messages.drive_active1Day)));
            filesList.some(function (arr) {
                var id = arr[0];
                var file = arr[1];
                if (!file || !file.atime) { return; }

                if (file.atime <= last28 && i >= limit) {
                    return true;
                }

                var paths = manager.findFile(id);
                if (!paths.length) { return; }
                var path = paths[0];
                if (manager.isPathIn(path, [TRASH])) { return; }

                if (channels.indexOf(file.channel) !== -1) { return; }
                channels.push(file.channel);

                if (!header7 && file.atime < last1) {
                    $list.append(h('li.cp-app-drive-element-separator', h('span', Messages.drive_active7Days)));
                    header7 = true;
                }
                if (!header28 && file.atime < last7) {
                    $list.append(h('li.cp-app-drive-element-separator', h('span', Messages.drive_active28Days)));
                    header28 = true;
                }
                if (!headerOld && file.atime < last28) {
                    $list.append(h('li.cp-app-drive-element-separator', h('span', Messages.drive_activeOld)));
                    headerOld = true;
                }

                // Display the pad
                var $icon = getFileIcon(id);
                var ro = manager.isReadOnlyFile(id);
                // ro undefined means it's an old hash which doesn't support read-only
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
                    onElementClick(e, $element);
                });
                $element.contextmenu(openContextMenu('default'));
                $element.data('context', 'default');
                /*if (draggable) {
                    addDragAndDropHandlers($element, path, false, false);
                }*/
                $list.append($element);
                i++;
            });
        };

        // Owned pads category
        var displayOwned = function ($container) {
            var list = manager.getOwnedPads();
            if (list.length === 0) { return; }
            var $fileHeader = getFileListHeader(false);
            $container.append($fileHeader);
            var sortedFiles = sortElements(false, false, list, APP.store[SORT_FILE_BY], !getSortFileDesc(), true);
            sortedFiles.forEach(function (id) {
                var paths = manager.findFile(id);
                if (!paths.length) { return; }
                var path = paths[0];
                var $icon = getFileIcon(id);
                var ro = manager.isReadOnlyFile(id);
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
                $element.contextmenu(openContextMenu('default'));
                $element.data('context', 'default');
                $container.append($element);
            });
        };

        // Tags category
        var displayTags = function ($container) {
            var list = manager.getTagsList();
            if (Object.keys(list).length === 0) { return; }
            var sortedTags = Object.keys(list);
            sortedTags.sort(function (a, b) {
                return list[b] - list[a];
            });
            var lines = [
                h('tr', [
                    h('th', Messages.fm_tags_name),
                    h('th', Messages.fm_tags_used)
                ])
            ];
            sortedTags.forEach(function (tag) {
                var tagLink = h('a', { href: '#' }, '#' + tag);
                $(tagLink).click(function () {
                    if (displayedCategories.indexOf(SEARCH) !== -1) {
                        APP.Search.$input.val('#' + tag).keyup();
                    }
                });
                lines.push(h('tr', [
                    h('td', tagLink),
                    h('td.cp-app-drive-tags-used', list[tag])
                ]));
            });
            $(h('li.cp-app-drive-tags-list', h('table', lines))).appendTo($container);
        };

        // ANON_SHARED_FOLDER
        // Display a shared folder for anon users (read-only)
        var displaySharedFolder = function ($list) {
            if (currentPath.length === 1) {
                currentPath.push(ROOT);
            }
            var fId = APP.newSharedFolder;
            var data = folders[fId];
            var $folderHeader = getFolderListHeader();
            var $fileHeader = getFileListHeader(true);
            var path = currentPath.slice(1);
            var root = Util.find(data, path);

            if (manager.hasSubfolder(root)) { $list.append($folderHeader); }
            // display sub directories
            var keys = Object.keys(root);
            var sortedFolders = sortElements(true, currentPath, keys, null, !getSortFolderDesc());
            var sortedFiles = sortElements(false, currentPath, keys, APP.store[SORT_FILE_BY], !getSortFileDesc());
            sortedFolders.forEach(function (key) {
                if (manager.isFile(root[key])) { return; }
                var $element = createElement(currentPath, key, root, true);
                $element.appendTo($list);
            });
            if (manager.hasFile(root)) { $list.append($fileHeader); }
            // display files
            sortedFiles.forEach(function (key) {
                if (manager.isFolder(root[key])) { return; }
                var $element = createElement(currentPath, key, root, false);
                if (!$element) { return; }
                $element.appendTo($list);
            });
        };

        // Display the selected directory into the content part (rightside)
        // NOTE: Elements in the trash are not using the same storage structure as the others
        var _displayDirectory = function (path, force) {
            APP.hideMenu();

            if (!APP.editable) { debug("Read-only mode"); }
            if (!appStatus.isReady && !force) { return; }

            if (!path || path.length === 0) {
                // Only Trash and Root are available in not-owned files manager
                if (!path || displayedCategories.indexOf(path[0]) === -1) {
                    log(Messages.fm_categoryError);
                }
                if (!APP.loggedIn && APP.newSharedFolder) {
                    // ANON_SHARED_FOLDER
                    path = [SHARED_FOLDER, ROOT];
                } else {
                    path = [ROOT];
                }
            }

            appStatus.ready(false);
            currentPath = path;
            var s = $content.scrollTop() || 0;
            $content.html("");
            sel.$selectBox = $('<div>', {'class': 'cp-app-drive-content-select-box'})
                .appendTo($content);
            var isInRoot = manager.isPathIn(path, [ROOT]);
            var inTrash = manager.isPathIn(path, [TRASH]);
            var isTrashRoot = manager.comparePath(path, [TRASH]);
            var isTemplate = manager.comparePath(path, [TEMPLATE]);
            var isAllFiles = manager.comparePath(path, [FILES_DATA]);
            var isVirtual = virtualCategories.indexOf(path[0]) !== -1;
            var isSearch = path[0] === SEARCH;
            var isTags = path[0] === TAGS;
            // ANON_SHARED_FOLDER
            var isSharedFolder = path[0] === SHARED_FOLDER && APP.newSharedFolder;
            if (isSharedFolder && path.length < 2) {
                path = [SHARED_FOLDER, 'root'];
                currentPath = path;
            }

            var root = isVirtual ? undefined : manager.find(path);
            if (manager.isSharedFolder(root)) {
                // ANON_SHARED_FOLDER
                path.push(manager.user.userObject.ROOT);
                root = manager.find(path);
                if (!root) { return; }
            }
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

            setLastOpenedFolder(path);

            var $toolbar = createToolbar(path);
            var $info = createInfoBox(path);

            var $dirContent = $('<div>', {id: FOLDER_CONTENT_ID});
            $dirContent.data('path', path);
            if (!isSearch && !isTags) {
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
            var sfId = manager.isInSharedFolder(currentPath);
            if (sfId) {
                var sfData = manager.getSharedFolderData(sfId);
                var parsed = Hash.parsePadUrl(sfData.href);
                sframeChan.event('EV_DRIVE_SET_HASH', parsed.hash || '');
                createShareButton(sfId, $toolbar.find('.cp-app-drive-toolbar-leftside'));
            } else {
                sframeChan.event('EV_DRIVE_SET_HASH', '');
            }

            createTitle($toolbar.find('.cp-app-drive-path'), path);

            if (APP.mobile()) {
                var $context = $('<button>', {
                    id: 'cp-app-drive-toolbar-context-mobile'
                });
                $context.append($('<span>', {'class': 'fa fa-caret-down'}));
                $context.appendTo($toolbar.find('.cp-app-drive-toolbar-rightside'));
                $context.click(function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var $li = findSelectedElements();
                    if ($li.length !== 1) {
                        $li = findDataHolder($tree.find('.cp-app-drive-element-active'));
                    }
                    // Close if already opened
                    if ($('.cp-contextmenu:visible').length) {
                        APP.hideMenu();
                        return;
                    }
                    // Open the menu
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
            } else if (path[0] === RECENT) {
                displayRecent($list);
            } else if (path[0] === OWNED) {
                displayOwned($list);
            } else if (isTags) {
                displayTags($list);
            } else if (isSharedFolder) {
                // ANON_SHARED_FOLDER
                displaySharedFolder($list);
            } else {
                $dirContent.contextmenu(openContextMenu('content'));
                if (manager.hasSubfolder(root)) { $list.append($folderHeader); }
                // display sub directories
                var keys = Object.keys(root);
                var sortedFolders = sortElements(true, path, keys, null, !getSortFolderDesc());
                var sortedFiles = sortElements(false, path, keys, APP.store[SORT_FILE_BY], !getSortFileDesc());
                sortedFolders.forEach(function (key) {
                    if (manager.isFile(root[key])) { return; }
                    var $element = createElement(path, key, root, true);
                    $element.appendTo($list);
                });
                if (manager.hasFile(root)) { $list.append($fileHeader); }
                // display files
                sortedFiles.forEach(function (key) {
                    if (manager.isFolder(root[key])) { return; }
                    var p = path.slice();
                    p.push(key);
                    if (APP.hideDuplicateOwned && manager.isDuplicateOwned(p)) { return; }
                    var $element = createElement(path, key, root, false);
                    if (!$element) { return; }
                    $element.appendTo($list);
                });

                if (!inTrash) { createGhostIcon($list); }
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

            var $sel = findSelectedElements();
            if ($sel.length) {
                $sel[0].scrollIntoView();
            } else {
                $content.scrollTop(s);
            }
            appStatus.ready(true);
        };
        var displayDirectory = APP.displayDirectory = function (path, force) {
            if (history.isHistoryMode) {
                return void _displayDirectory(path, force);
            }
            if (!manager.comparePath(currentPath, path)) {
                removeSelected();
            }
            updateObject(sframeChan, proxy, function () {
                copyObjectValue(files, proxy.drive);
                updateSharedFolders(sframeChan, manager, files, folders, function () {
                    _displayDirectory(path, force);
                });
            });
        };

        var createTreeElement = function (name, $icon, path, draggable, droppable, collapsable, active, isSharedFolder) {
            var $name = $('<span>', { 'class': 'cp-app-drive-element' }).text(name);
            $icon.css("color", isSharedFolder ? getFolderColor(path.slice(0, -1)) : getFolderColor(path));
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
                        if (manager.isSubpath(currentPath, path)) {
                            displayDirectory(path);
                        }
                    }
                });
                if (wasFolderOpened(path) ||
                        (manager.isSubpath(currentPath, path) && path.length < currentPath.length)) {
                    $collapse.click();
                }
            }
            var dataPath = isSharedFolder ? path.slice(0, -1) : path;
            $elementRow.data('path', dataPath);
            addDragAndDropHandlers($elementRow, dataPath, true, droppable);
            if (active) {
                $elementRow.addClass('cp-app-drive-element-active cp-leftside-active');
            }
            return $element;
        };

        var createTree = function ($container, path) {
            var root = manager.find(path);

            // don't try to display what doesn't exist
            if (!root) { return; }

            // Display the root element in the tree
            var displayingRoot = manager.comparePath([ROOT], path);
            if (displayingRoot) {
                var isRootOpened = manager.comparePath([ROOT], currentPath);
                var $rootIcon = manager.isFolderEmpty(files[ROOT]) ?
                    (isRootOpened ? $folderOpenedEmptyIcon : $folderEmptyIcon) :
                    (isRootOpened ? $folderOpenedIcon : $folderIcon);
                var $rootElement = createTreeElement(ROOT_NAME, $rootIcon.clone(), [ROOT], false, true, true, isRootOpened);
                if (!manager.hasSubfolder(root)) {
                    $rootElement.find('.cp-app-drive-icon-expcol').css('visibility', 'hidden');
                }
                $rootElement.addClass('cp-app-drive-tree-root');
                $rootElement.find('>.cp-app-drive-element-row')
                    .contextmenu(openContextMenu('tree'));
                $('<ul>', {'class': 'cp-app-drive-tree-docs'})
                    .append($rootElement).appendTo($container);
                $container = $rootElement;
            } else if (manager.isFolderEmpty(root)) { return; }

            // Display root content
            var $list = $('<ul>').appendTo($container);
            var keys = Object.keys(root).sort(function (a, b) {
                var newA = manager.isSharedFolder(root[a]) ?
                            manager.getSharedFolderData(root[a]).title : a;
                var newB = manager.isSharedFolder(root[b]) ?
                            manager.getSharedFolderData(root[b]).title : b;
                return newA < newB ? -1 :
                        (newA === newB ? 0 : 1);
            });
            keys.forEach(function (key) {
                // Do not display files in the menu
                if (!manager.isFolder(root[key])) { return; }
                var newPath = path.slice();
                newPath.push(key);
                var isSharedFolder = manager.isSharedFolder(root[key]);
                var $icon, isCurrentFolder, subfolder;
                if (isSharedFolder) {
                    var fId = root[key];
                    // Fix path
                    newPath.push(manager.user.userObject.ROOT);
                    isCurrentFolder = manager.comparePath(newPath, currentPath);
                    // Subfolders?
                    var newRoot = manager.folders[fId].proxy[manager.user.userObject.ROOT];
                    subfolder = manager.hasSubfolder(newRoot);
                    // Fix name
                    key = manager.getSharedFolderData(fId).title;
                    // Fix icon
                    $icon = isCurrentFolder ? $sharedFolderOpenedIcon : $sharedFolderIcon;
                } else {
                    var isEmpty = manager.isFolderEmpty(root[key]);
                    subfolder = manager.hasSubfolder(root[key]);
                    isCurrentFolder = manager.comparePath(newPath, currentPath);
                    $icon = isEmpty ?
                        (isCurrentFolder ? $folderOpenedEmptyIcon : $folderEmptyIcon) :
                        (isCurrentFolder ? $folderOpenedIcon : $folderIcon);
                }
                var $element = createTreeElement(key, $icon.clone(), newPath, true, true, subfolder, isCurrentFolder, isSharedFolder);
                $element.appendTo($list);
                $element.find('>.cp-app-drive-element-row').contextmenu(openContextMenu('tree'));
                if (isSharedFolder) {
                    $element.find('>.cp-app-drive-element-row')
                        .addClass('cp-app-drive-element-sharedf');
                }
                createTree($element, newPath);
            });
        };

        var createTrash = function ($container, path) {
            var $icon = manager.isFolderEmpty(files[TRASH]) ? $trashEmptyIcon.clone() : $trashIcon.clone();
            var isOpened = manager.comparePath(path, currentPath);
            var $trashElement = createTreeElement(TRASH_NAME, $icon, [TRASH], false, true, false, isOpened);
            $trashElement.addClass('cp-app-drive-tree-root');
            $trashElement.find('>.cp-app-drive-element-row')
                         .contextmenu(openContextMenu('trashtree'));
            var $trashList = $('<ul>', { 'class': 'cp-app-drive-tree-category' })
                .append($trashElement);
            $container.append($trashList);
        };

        var search = APP.Search = {};
        var createSearch = function ($container) {
            var isInSearch = currentPath[0] === SEARCH;
            var $div = $('<div>', {'id': 'cp-app-drive-tree-search', 'class': 'cp-unselectable'});
            var $input = APP.Search.$input = $('<input>', {
                id: 'cp-app-drive-tree-search-input',
                type: 'text',
                draggable: false,
                tabindex: 1,
                placeholder: Messages.fm_searchPlaceholder
            }).keyup(function (e) {
                if (search.to) { window.clearTimeout(search.to); }
                if ([37, 38, 39, 40].indexOf(e.which) !== -1) {
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
                    if (!manager.comparePath(newLocation, currentPath.slice())) { displayDirectory(newLocation); }
                    return;
                }
                if (e.which === 27) {
                    $input.val('');
                    setSearchCursor(0);
                    if (search.oldLocation && search.oldLocation.length) { displayDirectory(search.oldLocation); }
                    else { displayDirectory([ROOT]); }
                    return;
                }
                if ($input.val()) {
                    if (!$input.hasClass('cp-app-drive-search-active')) {
                        $input.addClass('cp-app-drive-search-active');
                    }
                } else {
                    $input.removeClass('cp-app-drive-search-active');
                }
                if (APP.mobile()) { return; }
                search.to = window.setTimeout(function () {
                    if (!isInSearchTmp) { search.oldLocation = currentPath.slice(); }
                    var newLocation = [SEARCH, $input.val()];
                    setSearchCursor();
                    if (!manager.comparePath(newLocation, currentPath.slice())) { displayDirectory(newLocation); }
                }, 500);
            }).appendTo($div);
            var cancel = h('span.fa.fa-times.cp-app-drive-search-cancel', {title:Messages.cancel});
            cancel.addEventListener('click', function () {
                $input.val('');
                setSearchCursor(0);
                if (search.oldLocation && search.oldLocation.length) { displayDirectory(search.oldLocation); }
            });
            $div.append(cancel);
            $searchIcon.clone().appendTo($div);
            if (isInSearch) {
                $input.val(currentPath[1] || '');
                if ($input.val()) { $input.addClass('cp-app-drive-search-active'); }
            }
            $container.append($div);
        };

        var categories = {};
        categories[FILES_DATA] = {
            name: FILES_DATA_NAME,
            $icon: $unsortedIcon
        };
        categories[TEMPLATE] = {
            name: TEMPLATE_NAME,
            droppable: true,
            $icon: $templateIcon
        };
        categories[RECENT] = {
            name: RECENT_NAME,
            $icon: $recentIcon
        };
        categories[OWNED] = {
            name: OWNED_NAME,
            $icon: $ownedIcon
        };
        categories[TAGS] = {
            name: TAGS_NAME,
            $icon: $tagsIcon
        };
        var createCategory = function ($container, cat) {
            var options = categories[cat];
            var $icon = options.$icon.clone();
            var isOpened = manager.comparePath([cat], currentPath);
            var $element = createTreeElement(options.name, $icon, [cat], options.draggable, options.droppable, false, isOpened);
            $element.addClass('cp-app-drive-tree-root');
            var $list = $('<ul>', { 'class': 'cp-app-drive-tree-category' }).append($element);
            $container.append($list);
        };

        APP.resetTree = function () {
            var $categories = $tree.find('.cp-app-drive-tree-categories-container');
            var s = $categories.scrollTop() || 0;

            $tree.html('');
            if (displayedCategories.indexOf(SEARCH) !== -1) { createSearch($tree); }
            var $div = $('<div>', {'class': 'cp-app-drive-tree-categories-container'})
                .appendTo($tree);
            if (displayedCategories.indexOf(TAGS) !== -1) { createCategory($div, TAGS); }
            if (displayedCategories.indexOf(RECENT) !== -1) { createCategory($div, RECENT); }
            if (displayedCategories.indexOf(OWNED) !== -1) { createCategory($div, OWNED); }
            if (displayedCategories.indexOf(ROOT) !== -1) { createTree($div, [ROOT]); }
            if (displayedCategories.indexOf(TEMPLATE) !== -1) { createCategory($div, TEMPLATE); }
            if (displayedCategories.indexOf(FILES_DATA) !== -1) { createCategory($div, FILES_DATA); }
            if (displayedCategories.indexOf(TRASH) !== -1) { createTrash($div, [TRASH]); }

            $tree.append(APP.$limit);
            $categories = $tree.find('.cp-app-drive-tree-categories-container');
            $categories.scrollTop(s);
        };

        APP.hideMenu = function (e) {
            $contextMenu.hide();
            $trashTreeContextMenu.hide();
            $trashContextMenu.hide();
            $contentContextMenu.hide();
            $defaultContextMenu.hide();
            if (!e || !$(e.target).parents('.cp-dropdown')) {
                $('.cp-dropdown-content').hide();
            }
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

        // Disable middle click in the context menu to avoid opening /drive/inner.html# in new tabs
        $(window).click(function (e) {
            if (!e.target || !$(e.target).parents('.cp-dropdown-content').length) { return; }
            if (e.which !== 1) {
                e.stopPropagation();
                return false;
            }
        });

        var getProperties = APP.getProperties = function (el, cb) {
            if (!manager.isFile(el) && !manager.isSharedFolder(el)) {
                return void cb('NOT_FILE');
            }
            //var ro = manager.isReadOnlyFile(el);
            var base = APP.origin;
            var data;
            if (manager.isSharedFolder(el)) {
                data = JSON.parse(JSON.stringify(manager.getSharedFolderData(el)));
            } else {
                data = JSON.parse(JSON.stringify(manager.getFileData(el)));
            }
            if (!data || !(data.href || data.roHref)) { return void cb('INVALID_FILE'); }

            if (data.href) {
                data.href = base + data.href;
            }
            if (data.roHref) {
                data.roHref = base + data.roHref;
            }

            if (manager.isSharedFolder(el)) {
                delete data.roHref;
                //data.noPassword = true;
                data.noEditPassword = true;
                data.noExpiration = true;
                // this is here to allow users to check the channel id of a shared folder
                // we should remove it at some point
                data.sharedFolder = true;
            }

            if (manager.isFile(el) && data.roHref) { // Only for pads!
                sframeChan.query('Q_GET_PAD_METADATA', {
                    channel: data.channel
                }, function (err, val) {
                    if (!err && !(val && val.error)) {
                        data.owners = val.owners;
                        data.expire = val.expire;
                        data.pending_owners = val.pending_owners;
                    }
                    UIElements.getProperties(common, data, cb);
                });
                return;
            }
            UIElements.getProperties(common, data, cb);
        };

        if (!APP.loggedIn) {
            $contextMenu.find('.cp-app-drive-context-delete').text(Messages.fc_remove)
                .attr('data-icon', 'fa-eraser');
        }
        var deleteOwnedPaths = function (paths, pathsList) {
            pathsList = pathsList || [];
            if (paths) {
                paths.forEach(function (p) { pathsList.push(p.path); });
            }
            var msgD = pathsList.length === 1 ? Messages.fm_deleteOwnedPad :
                                                Messages.fm_deleteOwnedPads;
            UI.confirm(msgD, function(res) {
                $(window).focus();
                if (!res) { return; }
                manager.delete(pathsList, function () {
                    pathsList.forEach(removeFoldersOpened);
                    removeSelected();
                    refresh();
                });
            });
        };


        var downloadFolder = function (folderElement, folderName, sfId) {
            var todo = function (data) {
                data.folder = folderElement;
                data.sharedFolderId = sfId;
                data.name = Util.fixFileName(folderName);
                data.folderName = Util.fixFileName(folderName) + '.zip';

                APP.FM.downloadFolder(data, function (err, obj) {
                    console.log(err, obj);
                    console.log('DONE');
                });
            };
            todo({
                uo: proxy,
                sf: folders,
            });
        };


        $contextMenu.on("click", "a", function(e) {
            e.stopPropagation();
            var paths = $contextMenu.data('paths');
            var pathsList = [];
            var type = $contextMenu.attr('data-menu-type');
            var $this = $(this);

            var el, data;
            if (paths.length === 0) {
                log(Messages.fm_forbidden);
                debug("Context menu on a forbidden or unexisting element. ", paths);
                return;
            }

            if ($this.hasClass("cp-app-drive-context-rename")) {
                if (paths.length !== 1) { return; }
                displayRenameInput(paths[0].element, paths[0].path);
            }
            else if ($this.hasClass("cp-app-drive-context-color")) {
                var currentColor = getFolderColor(paths[0].path);
                pickFolderColor(paths[0].element, currentColor, function (color) {
                    paths.forEach(function (p) {
                        setFolderColor(p.element, p.path, color);
                    });
                    refresh();
                });
            }
            else if($this.hasClass("cp-app-drive-context-delete")) {
                if (!APP.loggedIn) {
                    return void deletePaths(paths);
                }
                paths.forEach(function (p) { pathsList.push(p.path); });
                moveElements(pathsList, [TRASH], false, refresh);
            }
            else if ($this.hasClass('cp-app-drive-context-deleteowned')) {
                deleteOwnedPaths(paths);
            }
            else if ($this.hasClass('cp-app-drive-context-open')) {
                paths.forEach(function (p) {
                    var $element = p.element;
                    $element.click();
                    $element.dblclick();
                });
            }
            else if ($this.hasClass('cp-app-drive-context-openro')) {
                paths.forEach(function (p) {
                    var el = manager.find(p.path);
                    if (paths[0].path[0] === SHARED_FOLDER && APP.newSharedFolder) {
                        // ANON_SHARED_FOLDER
                        el = manager.find(paths[0].path.slice(1), APP.newSharedFolder);
                    }
                    var href;
                    if (manager.isPathIn(p.path, [FILES_DATA])) {
                        href = el.roHref;
                    } else {
                        if (!el || manager.isFolder(el)) { return; }
                        var data = manager.getFileData(el);
                        href = data.roHref;
                    }
                    openFile(null, href);
                });
            }
            else if ($this.hasClass('cp-app-drive-context-openincode')) {
                if (paths.length !== 1) { return; }
                var p = paths[0];
                el = manager.find(p.path);
                var metadata = manager.getFileData(el);
                var simpleData = {
                    title: metadata.filename || metadata.title,
                    href: metadata.href,
                    password: metadata.password,
                    channel: metadata.channel,
                };
                nThen(function (waitFor) {
                    common.sessionStorage.put(Constants.newPadFileData, JSON.stringify(simpleData), waitFor());
                    common.sessionStorage.put(Constants.newPadPathKey, currentPath, waitFor());
                }).nThen(function () {
                    common.openURL('/code/');
                });
            }

            else if ($this.hasClass('cp-app-drive-context-expandall') ||
                     $this.hasClass('cp-app-drive-context-collapseall')) {
                if (paths.length !== 1) { return; }
                var opened = $this.hasClass('cp-app-drive-context-expandall');
                var openRecursive = function (path) {
                    setFolderOpened(path, opened);
                    var folderContent = manager.find(path);
                    var subfolders = [];
                    for (var k in folderContent) {
                        if (manager.isFolder(folderContent[k])) {
                            if (manager.isSharedFolder(folderContent[k])) {
                                subfolders.push([k].concat(manager.user.userObject.ROOT));
                            }
                            else {
                                subfolders.push(k);
                            }
                        }
                    }
                    subfolders.forEach(function (p) {
                        var subPath = path.concat(p);
                        openRecursive(subPath);
                    });
                };
                openRecursive(paths[0].path);
                refresh();
            }

            else if ($this.hasClass('cp-app-drive-context-download')) {
                if (paths.length !== 1) { return; }
                var path = paths[0];
                el = manager.find(path.path);
                // folder
                if (manager.isFolder(el)) {
                    // folder
                    var name, folderEl;
                    if (!manager.isSharedFolder(el)) {
                        name = path.path[path.path.length - 1];
                        folderEl = el;
                        downloadFolder(folderEl, name);
                    }
                    // shared folder
                    else {
                        data = manager.getSharedFolderData(el);
                        name = data.title;
                        folderEl = manager.find(path.path.concat("root"));
                        downloadFolder(folderEl, name, el);
                    }
                }
                // file
                else if (manager.isFile(el)) {
                    // imported file
                    if (path.element.is(".cp-border-color-file")) {
                        data = manager.getFileData(el);
                        APP.FM.downloadFile(data, function (err, obj) {
                            console.log(err, obj);
                            console.log('DONE');
                        });
                    }
                    // pad
                    else {
                        data = manager.getFileData(el);
                        APP.FM.downloadPad(data, function (err, obj) {
                            console.log(err, obj);
                            console.log('DONE');
                        });
                    }
                }
            }
            else if ($this.hasClass('cp-app-drive-context-share')) {
                if (paths.length !== 1) { return; }
                el = manager.find(paths[0].path);
                var parsed, modal;
                var friends = common.getFriends();

                if (manager.isSharedFolder(el)) {
                    data = manager.getSharedFolderData(el);
                    parsed = Hash.parsePadUrl(data.href);
                    modal = UIElements.createSFShareModal({
                        origin: APP.origin,
                        pathname: "/drive/",
                        friends: friends,
                        title: data.title,
                        common: common,
                        password: data.password,
                        hashes: {
                            editHash: parsed.hash
                        }
                    });
                    return void UI.openCustomModal(modal, {
                        wide: Object.keys(friends).length !== 0
                    });
                } else if (manager.isFolder(el)) { // Folder
                    // if folder is inside SF
                    return UI.warn('ERROR: Temporarily disabled'); // XXX CONVERT
                    /*if (manager.isInSharedFolder(paths[0].path)) {
                        return void UI.alert(Messages.convertFolderToSF_SFParent);
                    }
                    // if folder already contains SF
                    else if (manager.hasSubSharedFolder(el)) {
                        return void UI.alert(Messages.convertFolderToSF_SFChildren);
                    }
                    // if root
                    else if (paths[0].path.length <= 1) {
                        return void UI.warn(Messages.error);
                    }
                    // if folder does not contains SF
                    else {
                        var convertContent = h('div', [
                            h('p', Messages.convertFolderToSF_confirm),
                            h('label', {for: 'cp-upload-password'}, Messages.creation_passwordValue),
                            UI.passwordInput({id: 'cp-upload-password'}),
                            h('span', {
                                style: 'display:flex;align-items:center;justify-content:space-between'
                            }, [
                                UI.createCheckbox('cp-upload-owned', Messages.sharedFolders_create_owned, true),
                                UI.createHelper(APP.origin + '/faq.html#keywords-owned', Messages.creation_owned1)
                            ]),
                        ]);
                        return void UI.confirm(convertContent, function(res) {
                            if (!res) { return; }
                            var password = $(convertContent).find('#cp-upload-password').val() || undefined;
                            var owned = Util.isChecked($(convertContent).find('#cp-upload-owned'));
                            manager.convertFolderToSharedFolder(paths[0].path, owned, password, refresh);
                        });
                    }*/
                } else { // File
                    data = manager.getFileData(el);
                    parsed = Hash.parsePadUrl(data.href);
                    var roParsed = Hash.parsePadUrl(data.roHref);
                    var padType = parsed.type || roParsed.type;
                    var padData = {
                        origin: APP.origin,
                        pathname: "/" + padType + "/",
                        friends: friends,
                        password: data.password,
                        hashes: {
                            editHash: parsed.hash,
                            viewHash: roParsed.hash,
                            fileHash: parsed.hash
                        },
                        fileData: {
                            hash: parsed.hash,
                            password: data.password
                        },
                        isTemplate: paths[0].path[0] === 'template',
                        title: data.title,
                        common: common
                    };
                    modal = padType === 'file' ? UIElements.createFileShareModal(padData)
                                            : UIElements.createShareModal(padData);
                    modal = UI.dialog.tabs(modal);
                    UI.openCustomModal(modal, {
                        wide: Object.keys(friends).length !== 0
                    });
                }
            }
            else if ($this.hasClass('cp-app-drive-context-newfolder')) {
                if (paths.length !== 1) { return; }
                var onFolderCreated = function (err, info) {
                    if (err) { return void logError(err); }
                    APP.newFolder = info.newPath;
                    APP.displayDirectory(paths[0].path);
                };
                el = manager.find(paths[0].path);
                if (manager.isSharedFolder(el)) {
                    paths[0].path.push(ROOT);
                }
                manager.addFolder(paths[0].path, null, onFolderCreated);
            }
            else if ($this.hasClass('cp-app-drive-context-newsharedfolder')) {
                if (paths.length !== 1) { return; }
                addSharedFolderModal(function (obj) {
                    if (!obj) { return; }
                    manager.addSharedFolder(paths[0].path, obj, refresh);
                });
            }
            else if ($this.hasClass("cp-app-drive-context-uploadfiles")) {
                showUploadFilesModal();
            }
            else if ($this.hasClass("cp-app-drive-context-uploadfolder")) {
                showUploadFolderModal();
            }
            else if ($this.hasClass("cp-app-drive-context-newdoc")) {
                var ntype = $this.data('type') || 'pad';
                var path2 = manager.isPathIn(currentPath, [TRASH]) ? '' : currentPath;
                common.sessionStorage.put(Constants.newPadPathKey, path2, function () {
                    common.openURL('/' + ntype + '/');
                });
            }
            else if ($this.hasClass("cp-app-drive-context-properties")) {
                if (type === 'trash') {
                    var pPath = paths[0].path;
                    if (paths.length !== 1 || pPath.length !== 4) { return; }
                    var element = manager.find(pPath.slice(0,3)); // element containing the oldpath
                    var sPath = stringifyPath(element.path);
                    UI.alert('<strong>' + Messages.fm_originalPath + "</strong>:<br>" + sPath, undefined, true);
                    return;
                }
                if (paths.length !== 1) { return; }
                el = manager.find(paths[0].path);
                if (paths[0].path[0] === SHARED_FOLDER && APP.newSharedFolder) {
                    // ANON_SHARED_FOLDER
                    el = manager.find(paths[0].path.slice(1), APP.newSharedFolder);
                }
                getProperties(el, function (e, $prop) {
                    if (e) { return void logError(e); }
                    UI.alert($prop[0], undefined, true);
                });
            }
            else if ($this.hasClass("cp-app-drive-context-hashtag")) {
                if (paths.length !== 1) { return; }
                el = manager.find(paths[0].path);
                data = manager.getFileData(el);
                if (!data) { return void console.error("Expected to find a file"); }
                var href = data.href || data.roHref;
                common.updateTags(href);
            }
            else if ($this.hasClass("cp-app-drive-context-empty")) {
                if (paths.length !== 1 || !paths[0].element
                    || !manager.comparePath(paths[0].path, [TRASH])) {
                    log(Messages.fm_forbidden);
                    return;
                }
                UI.confirm(Messages.fm_emptyTrashDialog, function(res) {
                    if (!res) { return; }
                    manager.emptyTrash(refresh);
                });
            }
            else if ($this.hasClass("cp-app-drive-context-remove")) {
                return void deletePaths(paths);
            }
            else if ($this.hasClass("cp-app-drive-context-removesf")) {
                return void deletePaths(paths);
            }
            else if ($this.hasClass("cp-app-drive-context-restore")) {
                if (paths.length !== 1) { return; }
                var restorePath = paths[0].path;
                var restoreName = paths[0].path[paths[0].path.length - 1];
                if (restorePath.length === 4) {
                    var rEl = manager.find(restorePath);
                    if (manager.isFile(rEl)) {
                        restoreName = manager.getTitle(rEl);
                    } else {
                        restoreName = restorePath[1];
                    }
                }
                UI.confirm(Messages._getKey("fm_restoreDialog", [restoreName]), function(res) {
                    if (!res) { return; }
                    manager.restore(restorePath, refresh);
                });
            }
            else if ($this.hasClass("cp-app-drive-context-openparent")) {
                if (paths.length !== 1) { return; }
                var parentPath = paths[0].path.slice();
                if (manager.isInTrashRoot(parentPath)) { parentPath = [TRASH]; }
                else { parentPath.pop(); }
                APP.displayDirectory(parentPath);
                APP.selectedFiles = paths[0].path.slice(-1);
            }
            APP.hideMenu();
        });

        $(window).on("keydown", function (e) {
            if (e.which === 113) { // if F2 key pressed
                var paths = getSelectedPaths(findSelectedElements().first());
                if (paths.length !== 1) { return; }
                displayRenameInput(paths[0].element, paths[0].path);
            }
        });

        // Chrome considers the double-click means "select all" in the window
        $content.on('mousedown', function (e) {
            $content.focus();
            e.preventDefault();
        });
        $appContainer.on('mouseup', function (e) {
            if (e.which !== 1) { return ; }
            if ($(e.target).is(".dropdown-submenu a, .dropdown-submenu a span")) { return; } // if we click on dropdown-submenu, don't close menu
            APP.hideMenu(e);
        });
        $appContainer.on('click', function (e) {
            if (e.which !== 1) { return ; }
            removeInput();
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
                if (manager.isPathIn(currentPath, [FILES_DATA]) && APP.loggedIn) {
                    return; // We can't remove elements directly from filesData
                }
                var $selected = findSelectedElements();
                if (!$selected.length) { return; }
                var paths = [];
                var isTrash = manager.isPathIn(currentPath, [TRASH]);
                $selected.each(function (idx, elmt) {
                    if (!$(elmt).data('path')) { return; }
                    paths.push($(elmt).data('path'));
                });
                if (!paths.length) { return; }
                // Remove shared folders from the selection (they can't be moved to the trash)
                // unless the selection is only shared folders
                var paths2 = paths.filter(function (p) {
                    var el = manager.find(p);
                    return !manager.isSharedFolder(el);
                });
                // If we are in the trash or anon pad or if we are holding the "shift" key,
                // delete permanently
                // Or if we are in a shared folder
                // Or if the selection is only shared folders
                if (!APP.loggedIn || isTrash || manager.isInSharedFolder(currentPath)
                        || e.shiftKey || !paths2.length) {
                    deletePaths(null, paths);
                    return;
                }
                // else move to trash
                moveElements(paths2, [TRASH], false, refresh);
                return;
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

            var path = data.path.slice();
            var originalPath = data.path.slice();

            if (!APP.loggedIn && APP.newSharedFolder && data.id === APP.newSharedFolder) {
                // ANON_SHARED_FOLDER
                return void onRefresh.refresh();
            }

            // Fix the path if this is about a shared folder
            if (data.id && manager.folders[data.id]) {
                var uoPath = manager.getUserObjectPath(manager.folders[data.id].userObject);
                if (uoPath) {
                    Array.prototype.unshift.apply(path, uoPath);
                    path.unshift('drive');
                }
            }

            if (path[0] !== 'drive') { return false; }
            path = path.slice(1);
            if (originalPath[0] === 'drive') { originalPath = originalPath.slice(1); }

            var cPath = currentPath.slice();
            if (originalPath.length && originalPath[0] === FILES_DATA) {
                onRefresh.refresh();
            } else if ((manager.isPathIn(cPath, ['hrefArray', TRASH]) && cPath[0] === path[0]) ||
                    (path.length >= cPath.length && manager.isSubpath(path, cPath))) {
                // Reload after a few ms to make sure all the change events have been received
                onRefresh.refresh();
            } else {
                APP.resetTree();
            }
            return false;
        });
        sframeChan.on('EV_DRIVE_REMOVE', function (data) {
            if (history.isHistoryMode) { return; }

            var path = data.path.slice();

            if (!APP.loggedIn && APP.newSharedFolder && data.id === APP.newSharedFolder) {
                // ANON_SHARED_FOLDER
                return void onRefresh.refresh();
            }

            // Fix the path if this is about a shared folder
            if (data.id && manager.folders[data.id]) {
                var uoPath = manager.getUserObjectPath(manager.folders[data.id].userObject);
                if (uoPath) {
                    Array.prototype.unshift.apply(path, uoPath);
                    path.unshift('drive');
                }
            }

            if (path[0] !== 'drive') { return false; }
            path = path.slice(1);

            var cPath = currentPath.slice();
            if ((manager.isPathIn(cPath, ['hrefArray', TRASH]) && cPath[0] === path[0]) ||
                    (path.length >= cPath.length && manager.isSubpath(path, cPath))) {
                // Reload after a few to make sure all the change events have been received
                onRefresh.refresh();
            } else {
                APP.resetTree();
            }
            return false;
        });

        APP.histConfig.onOpen = function () {
            // If we're in a shared folder history, store its id in memory
            // so that we remember that this isn't the drive history if
            // we browse through the drive
            var sfId = manager.isInSharedFolder(currentPath);
            if (!sfId) {
                delete history.sfId;
                delete APP.histConfig.sharedFolder;
                return;
            }
            history.sfId = sfId;
            var data = manager.getSharedFolderData(sfId);
            var parsed = Hash.parsePadUrl(data.href || data.roHref);
            APP.histConfig.sharedFolder = {
                hash: parsed.hash,
                password: data.password
            };
        };
        history.onEnterHistory = function (obj) {
            if (history.sfId) {
                if (!obj || typeof(obj) !== "object" || Object.keys(obj).length === 0) { return; }
                copyObjectValue(folders[history.sfId], obj);
                refresh();
                return;
            }
            history.sfId = false;

            var ok = manager.isValidDrive(obj.drive);
            if (!ok) { return; }

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

        sframeChan.query('Q_DRIVE_GETDELETED', null, function (err, data) {
            var ids = manager.findChannels(data);
            var titles = [];
            ids.forEach(function (id) {
                var title = manager.getTitle(id);
                titles.push(title);
                var paths = manager.findFile(id);
                manager.delete(paths, refresh);
            });
            if (!titles.length) { return; }
            UI.log(Messages._getKey('fm_deletedPads', [titles.join(', ')]));
        });
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
        var folders = {};
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
            var metadataMgr = common.getMetadataMgr();
            var privateData = metadataMgr.getPrivateData();
            if (privateData.newSharedFolder) {
                APP.newSharedFolder = privateData.newSharedFolder;
            }

            var sframeChan = common.getSframeChannel();
            updateObject(sframeChan, proxy, waitFor(function () {
                updateSharedFolders(sframeChan, null, proxy.drive, folders, waitFor());
            }));
        }).nThen(function () {
            var sframeChan = common.getSframeChannel();
            var metadataMgr = common.getMetadataMgr();
            var privateData = metadataMgr.getPrivateData();

            APP.disableSF = !privateData.enableSF && AppConfig.disableSharedFolders;
            if (APP.newSharedFolder && !APP.loggedIn) {
                readOnly = APP.readOnly = true;
                var data = folders[APP.newSharedFolder];
                if (data) {
                    sframeChan.query('Q_SET_PAD_TITLE_IN_DRIVE', {
                        title: data.metadata && data.metadata.title,
                    }, function () {});
                }
            }

            // ANON_SHARED_FOLDER
            var pageTitle = (!APP.loggedIn && APP.newSharedFolder) ? SHARED_FOLDER_NAME : Messages.type.drive;

            var configTb = {
                displayed: ['useradmin', 'pageTitle', 'newpad', 'limit', 'notifications'],
                pageTitle: pageTitle,
                metadataMgr: metadataMgr,
                readOnly: privateData.readOnly,
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
                    UI.addLoadingScreen({ loadingText: Messages.fm_restoreDrive });
                    var data = {};
                    if (history.sfId) {
                        copyObjectValue(folders[history.sfId], history.currentObj);
                        data.sfId = history.sfId;
                        data.drive = history.currentObj;
                    } else {
                        proxy.drive = history.currentObj.drive;
                        data.drive = history.currentObj.drive;
                    }
                    sframeChan.query("Q_DRIVE_RESTORE", data, function () {
                        UI.removeLoadingScreen();
                    }, {
                        timeout: 5 * 60 * 1000
                    });
                },
                onOpen: function () {},
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
            andThen(common, proxy, folders);

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
