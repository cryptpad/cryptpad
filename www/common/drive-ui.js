// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/api/config',
    '/common/toolbar.js',
    'json.sortify',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-ui-elements.js',
    '/common/common-interface.js',
    '/common/common-constants.js',
    '/common/common-feedback.js',

    '/common/inner/share.js',
    '/common/inner/access.js',
    '/common/inner/properties.js',

    '/components/nthen/index.js',
    '/common/hyperscript.js',
    '/common/proxy-manager.js',
    '/customize/application_config.js',
    '/customize/messages.js',
    '/customize/pages.js',
    '/common/pad-types.js',
], function (
    $,
    ApiConfig,
    Toolbar,
    JSONSortify,
    Util,
    Hash,
    UIElements,
    UI,
    Constants,
    Feedback,
    Share,
    Access,
    Properties,
    nThen,
    h,
    ProxyManager,
    AppConfig,
    Messages,
    Pages,
    PadTypes)
{

    var APP = window.APP = {
        editable: false,
        online: false,
        mobile: function () {
            if (window.matchMedia) { return !window.matchMedia('(any-pointer:fine)').matches; }
            else { return $('body').width() <= 600; }
        },
        isMac: navigator.platform === "MacIntel",
        allowFolderUpload: File.prototype.hasOwnProperty("webkitRelativePath"),
    };
    var onConnectEvt = Util.mkEvent(true);

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
    var FILTER = "filter";

    // Icons
    var faFolder = 'cptools-folder';
    var faFolderOpen = 'cptools-folder-open';
    var faSharedFolder = 'cptools-shared-folder';
    var faSharedFolderOpen = 'cptools-shared-folder-open';
    var faExpandAll = 'fa-plus-square-o';
    var faCollapseAll = 'fa-minus-square-o';
    var faShared = 'fa-shhare-alt';
    var faReadOnly = 'fa-eye';
    var faPreview = 'fa-eye';
    var faRename = 'fa-pencil';
    var faColor = 'cptools-palette';
    var faTrash = 'fa-trash';
    var faCopy = 'fa-files-o';
    var faDelete = 'cptools-destroy';
    var faAccess = 'fa-unlock-alt';
    var faProperties = 'fa-info-circle';
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
    var $fileMenuIcon = $('<span>', {"class": "fa fa-ellipsis-h"});
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
    var $expandIcon = $('<span>', {"class": "fa fa-caret-down cp-app-drive-icon-expcol"});
    //var $listIcon = $('<button>', {"class": "fa fa-list"});
    //var $gridIcon = $('<button>', {"class": "fa fa-th-large"});
    var $sortAscIcon = $('<span>', {"class": "fa fa-angle-up sortasc"});
    var $sortDescIcon = $('<span>', {"class": "fa fa-angle-down sortdesc"});
    var $closeIcon = $('<span>', {"class": "fa fa-times"});
    //var $backupIcon = $('<span>', {"class": "fa fa-life-ring"});
    var $searchIcon = $('<span>', {"class": "fa fa-search cp-app-drive-tree-search-icon"});
    var $addIcon = $('<span>', {"class": "fa fa-plus"});
    var $renamedIcon = $('<span>', {"class": "fa fa-flag"});
    var $readonlyIcon = $('<span>', {"class": "fa " + faReadOnly});
    var $ownedIcon = $('<span>', {"class": "fa fa-id-badge"});
    var $sharedIcon = $('<span>', {"class": "fa " + faShared});
    //var $ownerIcon = $('<span>', {"class": "fa fa-id-card"});
    var $tagsIcon = $('<span>', {"class": "fa " + faTags});
    var $passwordIcon = $('<span>', {"class": "fa fa-lock"});
    var $restrictedIcon = $('<span>', {"class": "fa fa-ban"});
    var $expirableIcon = $('<span>', {"class": "fa fa-clock-o"});
    var $separator = $('<div>', {"class": "dropdown-divider"});

    var LS_VIEWMODE = "app-drive-viewMode";
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

    $(window).keydown(function (e) {
        if (e.which === 70 && e.ctrlKey) {
            e.preventDefault();
            e.stopPropagation();
            if (APP.displayDirectory) {
                APP.displayDirectory([SEARCH]);
            }
            return;
        }
    });

    var makeLS = function (teamId) {
        var suffix = teamId ? ('-' + teamId) :  '';
        var LS_LAST = "app-drive-lastOpened" + suffix;
        var LS_OPENED = "app-drive-openedFolders" + suffix;

        var LS = {};

        LS.getLastOpenedFolder = function () {
            var path;
            try {
                path = APP.store[LS_LAST] ? JSON.parse(APP.store[LS_LAST]) : [ROOT];
            } catch (e) {
                path = [ROOT];
            }
            return path;
        };
        LS.setLastOpenedFolder = function (path) {
            if (path[0] === SEARCH) { return; }
            APP.store[LS_LAST] = JSON.stringify(path);
            localStore.put(LS_LAST, JSON.stringify(path));
        };

        LS.wasFolderOpened = function (path) {
            var stored = JSON.parse(APP.store[LS_OPENED] || '[]');
            return stored.indexOf(JSON.stringify(path)) !== -1;
        };
        LS.setFolderOpened = function (path, opened) {
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
        LS.removeFoldersOpened = function (parentPath) {
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
        LS.renameFoldersOpened = function (parentPath, newName) {
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
        LS.moveFoldersOpened = function (previousPath, newPath) {
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

        return LS;
    };

    var getViewModeClass = function (forceList) {
        var mode = APP.store[LS_VIEWMODE];
        if (mode === 'list' || forceList) { return 'cp-app-drive-content-list'; }
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

    // Handle disconnect/reconnect
    // If isHistory and isSf are both false, update the "APP.online" flag
    // If isHistory is true, update the "APP.history" flag
    // isSf is used to detect offline shared folders: setEditable is called on displayDirectory
    var setEditable = function (state, isHistory, isSf) {
        if (APP.closed || !APP.$content || !$.contains(document.documentElement, APP.$content[0])) { return; }
        if (isHistory) {
            APP.history = !state;
        } else if (!isSf) {
            APP.online = state;
        }
        state = APP.online && !APP.history && state;
        APP.editable = !APP.readOnly && state;
        if (APP.editable) { onConnectEvt.fire(); }

        if (!state) {
            APP.$content.addClass('cp-app-drive-readonly');
            if (!APP.history || !APP.online) {
                $('#cp-app-drive-connection-state').show();
            } else {
                $('#cp-app-drive-connection-state').hide();
            }
            $('[draggable="true"]').attr('draggable', false);
        }
        else {
            APP.$content.removeClass('cp-app-drive-readonly');
            $('#cp-app-drive-connection-state').hide();
            $('[draggable="false"]').attr('draggable', true);
        }
    };

    var copyObjectValue = function (objRef, objToCopy) {
        for (var k in objRef) { delete objRef[k]; }
        $.extend(true, objRef, objToCopy);
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

        var getNewPadTypes = function () {
            var arr = [];
            PadTypes.availableTypes.forEach(function (type) {
                if (AppConfig.hiddenTypes.indexOf(type) !== -1) { return; }
                if (!APP.loggedIn && AppConfig.registeredOnlyTypes &&
                    AppConfig.registeredOnlyTypes.indexOf(type) !== -1) {
                    return;
                }
                arr.push(type);
            });
            return arr;
        };

    var createContextMenu = function (common) {
        var metadataMgr = common.getMetadataMgr();
        var priv = metadataMgr.getPrivateData();

        APP.premiumPlan = priv.plan;
        var getOpenIn = function (app) {
            var icon = AppConfig.applicationsIcon[app];
            var cls = icon.indexOf('cptools') === 0 ? 'cptools '+icon : 'fa '+icon;
            var html = '<i class="'+cls+'"></i>' + Messages.type[app];
            return Messages._getKey('fc_openIn', [html]);
        };
        var restricted = {};
        var enabled = [];
        var isAppEnabled = function (app) {
            return enabled.includes(app);
        };
        getNewPadTypes().forEach(function (app) {
            if (!Array.isArray(AppConfig.availablePadTypes)) { return void enabled.push(app); }
            var registered = common.isLoggedIn() || !(AppConfig.registeredOnlyTypes || []).includes(app);
            restricted[app] = common.checkRestrictedApp(app);
            var e = PadTypes.isAvailable(app) && registered && restricted[app] >= 0;
            if (e) { enabled.push(app); }
        });
        var menu = h('div.cp-contextmenu.dropdown.cp-unselectable', [
            h('ul.dropdown-menu', {
                'role': 'menu',
                'aria-labelledby': 'dropdownMenu',
                'style': 'display:block;position:static;margin-bottom:5px;'
            }, [
                h('span.cp-app-drive-context-noAction.dropdown-item.disabled', Messages.fc_noAction || "No action possible"),
                h('li', h('a.cp-app-drive-context-preview.dropdown-item', {
                    'tabindex': '-1',
                    'data-icon': faPreview,
                }, Messages.pad_mediatagPreview)),
                h('li', h('a.cp-app-drive-context-open.dropdown-item', {
                    'tabindex': '-1',
                    'data-icon': faFolderOpen,
                }, Messages.fc_open)),
                h('li', h('a.cp-app-drive-context-openfolder.dropdown-item', {
                    'tabindex': '-1',
                    'data-icon': faFolderOpen,
                }, Messages.fc_open)),
                h('li', h('a.cp-app-drive-context-openro.dropdown-item', {
                    'tabindex': '-1',
                    'data-icon': faReadOnly,
                }, h('span.cp-text', Messages.fc_open_ro))),
                isAppEnabled('code') ? h('li', UI.setHTML(h('a.cp-app-drive-context-openincode.dropdown-item', {
                    'tabindex': '-1',
                    'data-icon': 'fa-arrows',
                }), getOpenIn('code'))) : undefined,
                isAppEnabled('sheet') ? h('li', UI.setHTML(h('a.cp-app-drive-context-openinsheet.dropdown-item', {
                    'tabindex': '-1',
                    'data-icon': 'fa-arrows',
                }), getOpenIn('sheet'))) : undefined,
                isAppEnabled('doc') ? h('li', UI.setHTML(h('a.cp-app-drive-context-openindoc.dropdown-item' + (restricted.doc === 0 ? '.cp-app-disabled' : ''), {
                    'tabindex': '-1',
                    'data-icon': 'fa-arrows',
                }), getOpenIn('doc'))) : undefined,
                isAppEnabled('presentation') ?  h('li', UI.setHTML(h('a.cp-app-drive-context-openinpresentation.dropdown-item' + (restricted.presentation === 0 ? '.cp-app-disabled' : ''), {
                    'tabindex': '-1',
                    'data-icon': 'fa-arrows',
                }), getOpenIn('presentation'))) : undefined,
                h('li', h('a.cp-app-drive-context-savelocal.dropdown-item', {
                    'tabindex': '-1',
                    'data-icon': 'fa-cloud-upload',
                }, Messages.pad_mediatagImport)), // Save in your CryptDrive
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
                h('li', h('a.cp-app-drive-context-access.dropdown-item', {
                    'tabindex': '-1',
                    'data-icon': faAccess,
                }, Messages.accessButton)),
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
                    'data-icon': AppConfig.applicationsIcon.link,
                    'data-type': 'link'
                }, Messages.fm_link_new)),
                h('li.dropdown-submenu', [
                    h('a.cp-app-drive-context-newdocmenu.dropdown-item', {
                        'tabindex': '-1',
                        'data-icon': "fa-plus",
                    }, Messages.fm_newFile),
                    h("ul.dropdown-menu", getNewPadTypes().map(function (app) {
                        return isAppEnabled(app) ? h('li', h('a.cp-app-drive-context-newdoc.dropdown-item.cp-app-drive-context-editable' + (restricted[app] === 0 ? '.cp-app-disabled' : ''), {
                            'tabindex': '-1',
                            'data-icon': AppConfig.applicationsIcon[app],
                            'data-type': app
                        }, Messages.type[app])) : undefined;
                    })),
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
                h('li', h('a.cp-app-drive-context-makeacopy.dropdown-item.cp-app-drive-context-editable', {
                    'tabindex': '-1',
                    'data-icon': faCopy,
                }, Messages.makeACopy)),
                h('li', h('a.cp-app-drive-context-download.dropdown-item', {
                    'tabindex': '-1',
                    'data-icon': faDownload,
                }, Messages.download_mt_button)),
                h('li', h('a.cp-app-drive-context-delete.dropdown-item.cp-app-drive-context-editable', {
                    'tabindex': '-1',
                    'data-icon': faTrash,
                }, Messages.fc_delete)), // "Move to trash"
                h('li', h('a.cp-app-drive-context-deleteowned.dropdown-item.cp-app-drive-context-editable', {
                    'tabindex': '-1',
                    'data-icon': faDelete,
                }, Messages.fc_delete_owned)),
                h('li', h('a.cp-app-drive-context-remove.dropdown-item.cp-app-drive-context-editable', {
                    'tabindex': '-1',
                    'data-icon': faTrash,
                }, Messages.fc_remove)),
                h('li', h('a.cp-app-drive-context-removesf.dropdown-item.cp-app-drive-context-editable', {
                    'tabindex': '-1',
                    'data-icon': faTrash,
                }, Messages.fc_remove_sharedfolder)),
                $separator.clone()[0],
                h('li', h('a.cp-app-drive-context-properties.dropdown-item', {
                    'tabindex': '-1',
                    'data-icon': faProperties,
                }, Messages.fc_prop))
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

    var create = function (common, driveConfig) { //proxy, folders) {
        var metadataMgr = common.getMetadataMgr();
        var sframeChan = common.getSframeChannel();
        var priv = metadataMgr.getPrivateData();

        // Initialization
        Util.extend(APP, driveConfig.APP);
        APP.$limit = driveConfig.$limit;
        var proxy = driveConfig.proxy;
        var folders = driveConfig.folders;
        var files = proxy.drive;
        var history = driveConfig.history || {};
        var edPublic = driveConfig.edPublic || priv.edPublic;
        config.editKey = driveConfig.editKey;
        APP.origin = priv.origin;
        APP.hideDuplicateOwned = Util.find(priv, ['settings', 'drive', 'hideDuplicate']);
        APP.closed = false;
        APP.toolbar = driveConfig.toolbar;

        var $readOnly = $(h('div.cp-banner.cp-banner-info.cp-app-drive-content-info-box', Messages.readonly));

        var updateObject = driveConfig.updateObject;
        var updateSharedFolders = driveConfig.updateSharedFolders;

        // manager
        config.loggedIn = APP.loggedIn;
        config.sframeChan = sframeChan;
        var manager = ProxyManager.createInner(files, sframeChan, edPublic, config);

        var LS = makeLS(APP.team);

        Object.keys(folders).forEach(function (id) {
            var f = folders[id];
            var sfData = files.sharedFolders[id] || {};
            var href = manager.user.userObject.getHref(sfData);
            var parsed = Hash.parsePadUrl(href);
            var secret = Hash.getSecrets('drive', parsed.hash, sfData.password);
            manager.addProxy(id, {proxy: f}, null, secret.keys.secondaryKey);
        });

        // UI containers
        var $tree = APP.$tree = $("#cp-app-drive-tree");
        var $content = APP.$content = $("#cp-app-drive-content");
        var $contentContainer = $("#cp-app-drive-content-container");
        var $appContainer = $(".cp-app-drive-container");
        var $driveToolbar = APP.toolbar.$bottom;
        var $contextMenu = createContextMenu(common).appendTo($appContainer);

        var $contentContextMenu = $("#cp-app-drive-context-content");
        var $defaultContextMenu = $("#cp-app-drive-context-default");
        var $trashTreeContextMenu = $("#cp-app-drive-context-trashtree");
        var $trashContextMenu = $("#cp-app-drive-context-trash");

        $content.attr("tabindex", "0");
        var splitter = h('div.cp-splitter', [
            h('i.fa.fa-ellipsis-v')
        ]);
        $contentContainer.append(splitter);
        APP.$splitter = $(splitter).on('mousedown', function (e) {
            e.preventDefault();
            var x = e.pageX;
            var w = $tree.width();
            var handler = function (evt) {
                if (evt.type === 'mouseup') {
                    $(window).off('mouseup mousemove', handler);
                    return;
                }
                $tree.css('width', (w - x + evt.pageX) + 'px');
            };
            $(window).off('mouseup mousemove', handler);
            $(window).on('mouseup mousemove', handler);
        });

        // TOOLBAR

        // DRIVE
        var currentPath = APP.currentPath = LS.getLastOpenedFolder();
        if (APP.newSharedFolder) {
            var newSFPaths = manager.findFile(Number(APP.newSharedFolder));
            if (newSFPaths.length) {
                currentPath = newSFPaths[0];
            }
        }

        // Categories dislayed in the menu
        var displayedCategories = [ROOT, TRASH, SEARCH, RECENT];

        // PCS enabled: display owned pads
        //if (AppConfig.displayCreationScreen) { displayedCategories.push(OWNED); }
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
            }
        } else if (priv.isEmbed && APP.newSharedFolder) {
            displayedCategories = [ROOT, TRASH];
        }

        APP.editable = !APP.readOnly;
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

        var onWindowMouseUp = function (e) {
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

        var removeInput =  function (cancel) {
            if (!cancel && $('.cp-app-drive-element-row > input').length === 1) {
                var $input = $('.cp-app-drive-element-row > input');
                manager.rename($input.data('path'), $input.val(), APP.refresh);
            }
            $('.cp-app-drive-element-row > input').remove();
            $('.cp-app-drive-element-row > span:hidden').removeAttr('style');
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
                                    LS.renameFoldersOpened(path, newName);
                                    path[path.length - 1] = newName;
                                }
                                APP.displayDirectory(path);
                            });
                        }
                        else {
                            manager.rename(path, $input.val(), function () {
                                if (isFolder) {
                                    LS.renameFoldersOpened(path, newName);
                                    unselectElement($element);
                                    $element.data("path", $element.data("path").slice(0, -1).concat(newName));
                                    selectElement($element);
                                }
                                APP.refresh();
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


        // Arrow keys to modify the selection
        var onWindowKeydown = function (e) {
            if (!$content.is(':visible')) { return; }
            var $searchBar = $tree.find('#cp-app-drive-tree-search-input');
            if (document.activeElement && document.activeElement.nodeName === 'INPUT') { return; }
            if ($searchBar.is(':focus') && $searchBar.val()) { return; }

            var $elements = $content.find('.cp-app-drive-element:not(.cp-app-drive-element-header)');

            var ev = {};
            if (e.ctrlKey) { ev.ctrlKey = true; }
            if (e.shiftKey) { ev.shiftKey = true; }

            // ESC
            if (e.which === 27) {
                 return void APP.hideMenu();
            }

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
                e.preventDefault();
                $content.find('.cp-app-drive-element:not(.cp-app-drive-element-selected)')
                    .each(function (idx, element) {
                        selectElement($(element));
                });
                return;
            }

            // F2: rename selected element
            if (e.which === 113) {
                var paths = getSelectedPaths(findSelectedElements().first());
                if (paths.length !== 1) { return; }
                displayRenameInput(paths[0].element, paths[0].path);
            }

            // [Left, Up, Right, Down]
            if ([37, 38, 39, 40].indexOf(e.which) === -1) { return; }
            e.preventDefault();

            // If the arrow keys aren't caught by another listener before, it means we can
            // use them to select content in the drive. If that's the case, we'll also
            // focus the drive container to avoid conflicts with other focused elements
            $content.focus();

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

        var previewMediaTag = function (data) {
            var mts = [];
            $content.find('.cp-app-drive-element.cp-border-color-file').each(function (i, el) {
                var path = $(el).data('path');
                var id = manager.find(path);
                if (!id) { return; }
                var _data = manager.getFileData(id);
                if (!_data || _data.channel < 48) { return; }
                mts.push({
                    channel: _data.channel,
                    href: _data.href,
                    password: _data.password
                });
            });

            // Find initial position
            var idx = -1;
            mts.some(function (obj, i) {
                if (obj.channel === data.channel) {
                    idx = i;
                    return true;
                }
            });
            if (idx === -1) {
                mts.unshift({
                    href: data.href,
                    password: data.password
                });
                idx = 0;
            }

            common.getMediaTagPreview(mts, idx);
        };

        var FILTER_BY = "filterBy";

        var refreshDeprecated = function () {
            if (!APP.passwordModal) { return; }
            var deprecated = files.sharedFoldersTemp;
            if (JSONSortify(deprecated) === APP.deprecatedSF) { return; }
            APP.deprecatedSF = JSONSortify(deprecated);
            if (typeof (deprecated) === "object" && Object.keys(deprecated).length) {
                var nt = nThen;
                Object.keys(deprecated).forEach(function (fId) {
                    var data = deprecated[fId];
                    var sfId = manager.user.userObject.getSFIdFromHref(data.href);
                    if (folders[fId] || sfId) { // This shared folder is already stored in the drive...
                        return void manager.delete([['sharedFoldersTemp', fId]], function () { });
                    }
                    nt = nt(function (waitFor) {
                        UI.openCustomModal(APP.passwordModal(fId, data, waitFor()));
                    }).nThen;
                });
                nt(function () {
                    APP.refresh();
                });
            }

        };
        var refresh = APP.refresh = function (cb) {
            var type = APP.store[FILTER_BY];
            var path = type ? [FILTER, type, currentPath] : currentPath;
            APP.displayDirectory(path, undefined, () => {
                refreshDeprecated();
                if (typeof(cb) === "function") { cb(); }
            });
        };

        // `app`: true (force open with the app), false (force open in preview),
        //        falsy (open in preview if default is not using the app)
        var defaultInApp = ['application/pdf'];
        var openFile = function (el, isRo, app) {
            // In anonymous drives, `el` already contains file data
            var data = el.channel ? el : manager.getFileData(el);

            if (data.static) {
                if (data.href) {
                    common.openUnsafeURL(data.href);
                    manager.updateStaticAccess(el, refresh);
                }
                return;
            }

            if (!data || (!data.href && !data.roHref)) {
                return void logError("Missing data for the file", el, data);
            }

            var href = isRo ? data.roHref : (data.href || data.roHref);
            var parsed = Hash.parsePadUrl(href);

            if (parsed.hashData && parsed.hashData.type === 'file' && !app
                    && (defaultInApp.indexOf(data.fileType) === -1 || app === false)) {
                return void previewMediaTag(data);
            }

            var obj = { t: APP.team };

            var priv = metadataMgr.getPrivateData();
            var useUnsafe = Util.find(priv, ['settings', 'security', 'unsafeLinks']);
            if (useUnsafe === true || APP.newSharedFolder) {
                return void common.openURL(Hash.getNewPadURL(href, obj));
            }

            // Get hidden hash
            var secret = Hash.getSecrets(parsed.type, parsed.hash, data.password);
            var opts = {};
            if (isRo) { opts.view = true; }
            var hash = Hash.getHiddenHashFromKeys(parsed.type, secret, opts);
            var hiddenHref = Hash.hashToHref(hash, parsed.type);
            common.openURL(Hash.getNewPadURL(hiddenHref, obj));
        };
        var openIn = function (type, path, team, fData) {
            var obj = {
                p: path,
                t: team,
                d: fData
            };
            var href = Hash.hashToHref('', type);
            common.openURL(Hash.getNewPadURL(href, obj));
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
            var editable = true;

            if (type === "content") {
                if (APP.$content.data('readOnlyFolder')) { editable = false; }
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
                        return;
                    }
                };
            } else {
                // In case of multiple selection, we must hide the option if at least one element
                // is not compatible
                var containsFolder = false;
                var hide = [];
                if (!APP.team) {
                    hide.push('savelocal');
                }
                paths.forEach(function (p) {
                    var path = p.path;
                    var $element = p.element;

                    if (APP.$content.data('readOnlyFolder') &&
                            manager.isSubpath(path, currentPath)) { editable = false; }

                    if (!$element.closest("#cp-app-drive-tree").length) {
                        hide.push('expandall');
                        hide.push('collapseall');
                    }
                    if (path.length === 1) {
                        // Can't rename, share, delete, or change the color of categories
                        hide.push('delete');
                        hide.push('rename');
                        hide.push('share');
                        hide.push('savelocal');
                        hide.push('color');
                    }
                    if ($element.is('.cp-app-drive-element-folder')) {
                        hide.push('open');
                    }
                    if (!$element.is('.cp-app-drive-element-owned')) {
                        hide.push('deleteowned');
                    }
                    if ($element.is('.cp-app-drive-element-restricted')) {
                        hide.push('rename', 'download', 'share', 'access', 'color');
                    }
                    if ($element.is('.cp-app-drive-element-notrash')) {
                        // We can't delete elements in virtual categories
                        hide.push('delete');
                    }
                    if (!$element.is('.cp-border-color-file')) {
                        //hide.push('download');
                        hide.push('openincode');
                        hide.push('preview');
                    }
                    if ($element.is('.cp-app-drive-static')) {
                        hide.push('access', 'hashtag', 'properties', 'download');
                    }
                    if ($element.is('.cp-app-drive-element-file')) {
                        // No folder in files
                        hide.push('openfolder');
                        hide.push('color');
                        hide.push('newfolder');
                        if ($element.is('.cp-app-drive-element-readonly')) {
                            hide.push('open'); // Remove open 'edit' mode
                        } else if ($element.is('.cp-app-drive-element-noreadonly')) {
                            hide.push('openro'); // Remove open 'view' mode
                        }
                        var metadata = manager.getFileData(manager.find(path));
                        if (!metadata || !Util.isPlainTextFile(metadata.fileType, metadata.title)) {
                            hide.push('openincode');
                        }

                        if (metadata && /\/(doc|presentation|sheet)\//.test(metadata.href)) {
                            hide.push('openinsheet');
                            hide.push('openindoc');
                            hide.push('openinpresentation');
                        }

                        if (!metadata || !Util.isSpreadsheet(metadata.fileType, metadata.title)
                            || !priv.supportsWasm) {
                            hide.push('openinsheet');
                        }
                        if (!metadata || !Util.isOfficeDoc(metadata.fileType, metadata.title)
                            || !priv.supportsWasm) {
                            hide.push('openindoc');
                        }
                        if (!metadata || !Util.isPresentation(metadata.fileType, metadata.title)
                            || !priv.supportsWasm) {
                            hide.push('openinpresentation');
                        }
                        if (metadata.channel && metadata.channel.length < 48) {
                            hide.push('preview');
                        }
                        if (!metadata.channel || metadata.channel.length > 32) {
                            hide.push('makeacopy'); // Not for blobs
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
                        hide.push('openinsheet');
                        hide.push('openindoc');
                        hide.push('openinpresentation');
                        hide.push('hashtag');
                        //hide.push('delete');
                        hide.push('makeacopy');
                        //hide.push('deleteowned');
                    } else { // it's a folder
                        if (containsFolder) {
                            // More than 1 folder selected: cannot create a new subfolder
                            hide.push('newfolder');
                            hide.push('expandall');
                            hide.push('collapseall');
                        }
                        containsFolder = true;
                        hide.push('savelocal');
                        hide.push('openro');
                        hide.push('openincode');
                        hide.push('openinsheet');
                        hide.push('openindoc');
                        hide.push('openinpresentation');
                        hide.push('properties', 'access');
                        hide.push('hashtag');
                        hide.push('makeacopy');
                    }
                    // If we're in the trash, hide restore and properties for non-root elements
                    if (type === "trash" && path && path.length > 4) {
                        hide.push('restore');
                        hide.push('properties');
                    }
                    // If we're not in the trash nor in a shared folder, hide "remove"
                    if (!manager.isInSharedFolder(path)
                            && !$element.is('.cp-app-drive-element-sharedf')) {
                        // This isn't a shared folder: can't delete shared folder
                        hide.push('removesf');
                    } else if (type === "tree") {
                        // This is a shared folder or an element inside a shsared folder
                        // ==> can't move to trash
                        hide.push('delete');
                    }
                    if ($element.closest('[data-ro]').length) {
                        editable = false;
                    }
                });
                if (paths.length > 1) {
                    hide.push('restore');
                    hide.push('properties', 'access');
                    hide.push('rename');
                    hide.push('openparent');
                    hide.push('download');
                    hide.push('share');
                    hide.push('savelocal');
                    //hide.push('openincode'); // can't because of race condition
                    //hide.push('openinsheet'); // can't because of race condition
                    hide.push('makeacopy');
                    hide.push('preview');
                }
                if (containsFolder && paths.length > 1) {
                    // Cannot open multiple folders
                    hide.push('open');
                }

                if (!APP.loggedIn) {
                    hide.push('openparent');
                    hide.push('rename');
                    hide.push('openinsheet');
                    hide.push('openindoc');
                    hide.push('openinpresentation');
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
                    show = ['open', 'openfolder', 'openro', 'preview', 'openincode', 'expandall', 'collapseall',
                            'color', 'download', 'share', 'savelocal', 'rename', 'delete',
                            'makeacopy', 'openinsheet', 'openindoc', 'openinpresentation',
                            'deleteowned', 'removesf', 'access', 'properties', 'hashtag'];
                    break;
                case 'default':
                    show = ['open', 'openro', 'preview', 'openincode', 'openinsheet', 'openindoc', 'openinpresentation', 'share', 'download', 'openparent', 'delete', 'deleteowned', 'properties', 'access', 'hashtag', 'makeacopy', 'savelocal', 'rename'];
                    break;
                case 'trashtree': {
                    show = ['empty'];
                    break;
                }
                case 'trash': {
                    show = ['remove', 'deleteowned', 'restore', 'properties'];
                }
            }

            var filtered = [];
            show.forEach(function (className) {
                var $el = $contextMenu.find('.cp-app-drive-context-' + className);
                if ((!APP.editable || !editable) && $el.is('.cp-app-drive-context-editable')) { return; }
                if ((!APP.editable || !editable) && $el.is('.cp-app-drive-context-editable')) { return; }
                if (filter($el, className)) { return; }
                $el.parent('li').show();
                filtered.push('.cp-app-drive-context-' + className);
            });
            return filtered;
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
                let menuPositionTop;
                let menuPositionLeft;
                if (($(e.target).offset().top + $(e.target).height()) > ($(window).height()-$menu.height())) {
                    if ( $(e.target).offset().top < $menu.height()) {
                        menuPositionTop = 0;

                    } else {
                        menuPositionTop = ($(e.target).offset().top - $menu.height());
                    }
                } else {
                    menuPositionTop = $(e.target).offset().top + $(e.target).outerHeight();
                }
                if (($(e.target).offset().left + $(e.target).width()) < $menu.width()) {
                    menuPositionLeft = $(e.target).offset().left;
                } else {
                    menuPositionLeft = $(e.target).offset().left - ($menu.width() - $(e.target).width()) + 10;
                }

                $menu.css({
                    top: menuPositionTop + 'px',
                    left: menuPositionLeft + 'px',
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

                    $('.cp-app-drive-context-openro .cp-text').text(Messages.fc_open_ro);
                    if (paths.length === 1) {
                        var metadata = manager.getFileData(manager.find(paths[0].path));
                        if (metadata.roHref) {
                            var parsed = Hash.parsePadUrl(metadata.roHref);
                            // Forms: change "Open (read-only)" to "Open (as participant)"
                            if (parsed.type === "form") {
                                $('.cp-app-drive-context-openro .cp-text').text(Messages.fc_open_formro);
                            }
                        }
                    }

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
                    LS.moveFoldersOpened(path, newPath);
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
            var msg = Messages._getKey("fm_removeSeveralPermanentlyDialog", [pathsList.length]);
            if (pathsList.length === 1) {
                msg = Messages.fm_removePermanentlyDialog;
            }
            UI.confirm(msg, function(res) {
                $(window).focus();
                if (!res) { return; }
                manager.delete(pathsList, function () {
                    pathsList.forEach(LS.removeFoldersOpened);
                    removeSelected();
                    refresh();
                });
            });
        };


        // Drag & drop

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

            // Make sure we can only upload files in the Documents tree
            var p = ev.path;
            if (!Array.isArray(p) || !p.length || p[0] !== ROOT) {
                return void UI.warn(Messages.fm_cantUploadHere);
            }

            APP.FM.onFileDrop(file, ev);
        };

        var traverseFileTree = function (item, path, w, files) {
            path = path || "";
            if (item.isFile) {
                // Get file
                item.file(w(function(file) {
                    file.fix_path = path + file.name;
                    files.push(file);
                }));
            } else if (item.isDirectory) {
                // Get folder contents
                var dirReader = item.createReader();
                // this API is not supported in Opera or IE
                // https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem/webkitGetAsEntry
                // all other browsers will recurse over subfolders and upload everything
                dirReader.readEntries(w(function(entries) {
                    for (var i=0; i<entries.length; i++) {
                        traverseFileTree(entries[i], path + item.name + "/", w, files);
                    }
                }));
                // FIXME readEntries takes a function (error handler) as an optional second argument
                // what kind of errors can be thrown? what will happen?
            }
        };

        // create the folder structure before to upload files from folder
        var uploadFolder = function (fileList, name) {
            var currentFolder = currentPath;
            // create an array of all the files relative path
            var files = Array.prototype.map.call(fileList, function (file) {
                return {
                    file: file,
                    path: (file.webkitRelativePath || file.fix_path).split("/"),
                };
            });
            // if folder name already exist in drive, rename it
            var uploadedFolderName = files.length ? files[0].path[0] : (name || '');
            var availableName = manager.user.userObject.getAvailableName(manager.find(currentFolder), uploadedFolderName);

            // ask for folder name and files options, then upload all the files!
            APP.FM.showFolderUploadModal(availableName, function (folderUploadOptions) {
                if (!folderUploadOptions) { return; }

                // verfify folder name is possible, and update files path
                availableName = manager.user.userObject.getAvailableName(manager.find(currentFolder), folderUploadOptions.folderName);
                if (!files.length) {
                    return manager.addFolder(currentFolder, availableName, refresh);
                }

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

        var onDrop = function (ev) {
            ev.preventDefault();
            $('.cp-app-drive-element-droppable').removeClass('cp-app-drive-element-droppable');
            var data = ev.dataTransfer.getData("text");

            var newPath = findDropPath(ev.target);
            if (!newPath) { return; }
            var sfId = manager.isInSharedFolder(newPath);
            if (sfId && folders[sfId] && folders[sfId].readOnly) {
                return void UI.warn(Messages.fm_forbidden);
            }

            var fileDrop = ev.dataTransfer.items;
            if (fileDrop.length) {
                // Filter out all the folders and use the correct function to upload them
                fileDrop = Array.prototype.slice.call(fileDrop).map(function (file) {
                    if (file.kind !== "file") { return; }
                    var f = file.getAsFile();
                    if (file.webkitGetAsEntry) {
                        let entry = file.webkitGetAsEntry();
                        if (entry.isFile) { return f; }
                        // It's a folder
                        var files = [];
                        nThen(function (w) {
                            traverseFileTree(entry, "", w, files);
                        }).nThen(function () {
                            uploadFolder(files, f.name);
                        });
                        return;
                    } else {
                        // Old browsers: unreliable hack to detect folders
                        if (!file.type && file.size%4096 === 0) {
                            return; // Folder upload not supported
                        }
                    }
                    return f;
                }).filter(Boolean);
                // Continue only with the files
                // if there are no files, fall through to other handlers
                if (fileDrop.length) {
                    return void onFileDrop(fileDrop, ev);
                }
            }

            var oldPaths = data && JSON.parse(data).path;
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

            if (sharedF && manager.isPathIn(newPath, [TRASH])) {
                // TODO create a key here?
                // You can't move to YOUR trash documents stored in a shared folder
                // TODO or keep deletePaths: trigger the "Remove from cryptdrive" modal
                return void UI.warn(Messages.error);
                //return void deletePaths(null, movedPaths);
            }

            var copy = false;
            if (ev.ctrlKey || (ev.metaKey && APP.isMac)) {
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

        $tree.on('drop dragover', function (e) {
            e.preventDefault();
            e.stopPropagation();
        });
        $driveToolbar.on('drop dragover', function (e) {
            e.preventDefault();
            e.stopPropagation();
        });


        // In list mode, display metadata from the filesData object
        var addStaticData = function (element, $element, data) {
            $element.addClass('cp-border-color-drive');
            var name = data.name;
            var $name = $('<span>', {'class': 'cp-app-drive-element-name'}).text(name);
            $element.append($name);
            if (getViewMode() === 'grid') {
                //console.error(name, Util.fixHTML(name));
                // this is only safe because our build of tippy sets titles as
                // 'textContent' instead of innerHTML, otherwise
                // we would need to use Util.fixHTML
                $element.attr('title', name);
            }

            var type = Messages.fm_link_type;
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
        var _addOwnership = function ($span, $state, data) {
            if (data && Array.isArray(data.owners) && data.owners.indexOf(edPublic) !== -1) {
                var $owned = $ownedIcon.clone().appendTo($state);
                $owned.attr('title', Messages.fm_padIsOwned);
                $span.addClass('cp-app-drive-element-owned');
            } /* else if (data.owners && data.owners.length) {
                var $owner = $ownerIcon.clone().appendTo($state);
                $owner.attr('title', Messages.fm_padIsOwnedOther);
            } */
        };
        var thumbsUrls = {};

        // This is duplicated in cryptpad-common, it should be unified
        var getFileIcon = function (id) {
            var data = manager.getFileData(id);
            return UI.getFileIcon(data);
        };
        var getIcon = UI.getIcon;

        var addTitleIcon = function (element, $name) {
            var icon = getFileIcon(element);

            $(icon).addClass('cp-app-drive-element-icon');
            $name.addClass('cp-app-drive-element-name-icon');
            $name.prepend($(icon));
        };

        var addFileData = function (element, $element) {
            if (!manager.isFile(element)) { return; }

            var data = manager.getFileData(element);
            if (data.static) {
                return addStaticData(element, $element, data);
            }

            if (!Object.keys(data).length) {
                return true;
            }

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
                $renamed.attr('data-cptippy-html', 'true');
                $renamed.attr('title', Messages._getKey('fm_renamedPad', [Util.fixHTML(data.title)]));
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

            var $menu = $('<span>', {'class': 'cp-app-drive-element-menu'});
            $menu.click(function (e) {
                e.preventDefault();
                e.stopPropagation();
                $element.contextmenu();
            });
            $fileMenuIcon.clone().appendTo($menu);

            var name = manager.getTitle(element);

            // The element with the class '.name' is underlined when the 'li' is hovered
            var $name = $(h('span.cp-app-drive-element-name', [
                h('span.cp-app-drive-element-name-text', name)
            ]));
            $element.append($name);
            $element.append($state);
            if (APP.mobile()) {
                $element.append($menu);
            }

            if (getViewMode() === 'grid') {
                $element.attr('title', name);
            }

            // display the thumbnail
            // if the thumbnail has already been displayed once, do not reload it, keep the same url
            if (thumbsUrls[element]) {
                var img = new Image();
                img.src = thumbsUrls[element];
                $element.prepend(img);
                $(img).addClass('cp-app-drive-element-grid cp-app-drive-element-thumbnail');
                $(img).attr("draggable", false);
                $(img).attr("role", "presentation");
                addTitleIcon(element, $name);
            } else {
                common.displayThumbnail(href || data.roHref, data.channel, data.password, $element, function ($thumb) {
                    // Called only if the thumbnail exists
                    // Remove the .hide() added by displayThumnail() because it hides the icon in list mode too
                    $element.find('.cp-icon').removeAttr('style');
                    $thumb.addClass('cp-app-drive-element-grid cp-app-drive-element-thumbnail');
                    $thumb.attr("draggable", false);
                    thumbsUrls[element] = $thumb[0].src;
                    addTitleIcon(element, $name);
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
            var $ro;
            var $menu = $('<span>', {'class': 'cp-app-drive-element-menu'});
            $menu.click(function (e) {
                e.preventDefault();
                e.stopPropagation();
                $span.contextmenu();
            });
            $fileMenuIcon.clone().appendTo($menu);
            if (manager.isSharedFolder(element)) {
                var data = manager.getSharedFolderData(element);
                var fId = element;
                key = data.title || data.lastTitle || Messages.fm_deletedFolder;
                element = Util.find(manager, ['folders', element, 'proxy', manager.user.userObject.ROOT]) || {};
                $span.addClass('cp-app-drive-element-sharedf');
                _addOwnership($span, $state, data);

                var hrefData = Hash.parsePadUrl(data.href || data.roHref);
                if (hrefData.hashData && hrefData.hashData.password) {
                    var $password = $passwordIcon.clone().appendTo($state);
                    $password.attr('title', Messages.fm_passwordProtected || '');
                }
                if (hrefData.hashData && hrefData.hashData.mode === 'view') {
                    $ro = $readonlyIcon.clone().appendTo($state);
                    $ro.attr('title', Messages.readonly);
                }

                if (files.restrictedFolders[fId]) {
                    var $restricted = $restrictedIcon.clone().appendTo($state);
                    $restricted.attr('title', Messages.fm_restricted);
                }

                var $shared = $sharedIcon.clone().appendTo($state);
                $shared.attr('title', Messages.fm_canBeShared);
            } else if ($content.data('readOnlyFolder') || APP.readOnly) {
                $ro = $readonlyIcon.clone().appendTo($state);
                $ro.attr('title', Messages.readonly);
            }

            var sf = manager.hasSubfolder(element);
            var hasFiles = manager.hasFile(element);
            var $name = $(h('span.cp-app-drive-element-name', [
                h('span.cp-app-drive-element-name-text', key)
            ]));
            var $subfolders = $('<span>', {
                'class': 'cp-app-drive-element-folders cp-app-drive-element-list'
            }).text(sf);
            var $files = $('<span>', {
                'class': 'cp-app-drive-element-files cp-app-drive-element-list'
            }).text(hasFiles);
            var $filler = $('<span>', {
                'class': 'cp-app-drive-element-filler cp-app-drive-element-list'
            });
            if (getViewMode() === 'grid') {
                $span.attr('title', key);
            }
            $span.append($name).append($state).append($subfolders).append($files).append($filler);
            if (APP.mobile()) {
                $span.append($menu);
            }
        };

        var createShareButton = function (id, $container) {
            var $shareBlock = $('<button>', {
                'class': 'cp-toolbar-share-button',
                title: Messages.shareButton
            });
            $sharedIcon.clone().appendTo($shareBlock);
            $('<span>').text(Messages.shareButton).appendTo($shareBlock);
            var data = manager.getSharedFolderData(id);
            var parsed = (data.href && data.href.indexOf('#') !== -1) ? Hash.parsePadUrl(data.href) : {};
            var roParsed = Hash.parsePadUrl(data.roHref) || {};
            if (!parsed.hash && !roParsed.hash) { return void console.error("Invalid href: "+(data.href || data.roHref)); }
            var friends = common.getFriends();
            var ro = folders[id] && folders[id].version >= 2;
            // If we're a viewer and this is an old shared folder (no read-only mode), we
            // can't share the read-only URL and we don't have access to the edit one.
            // We should hide the share button.
            if (!data.href && !ro) { return; }

            $shareBlock.click(function () {
                Share.getShareModal(common, {
                    teamId: APP.team,
                    origin: APP.origin,
                    pathname: "/drive/",
                    friends: friends,
                    title: data.title,
                    password: data.password,
                    sharedFolder: true,
                    common: common,
                    hashes: {
                        editHash: parsed.hash,
                        viewHash: ro && roParsed.hash,
                    }
                });
            });
            $container.append($shareBlock);
            return $shareBlock;
        };

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

            var restricted = files.restrictedFolders[element];
            var isSharedFolder = manager.isSharedFolder(element);

            var $icon = !isFolder ? getFileIcon(element) : undefined;
            var ro = manager.isReadOnlyFile(element);
            // ro undefined means it's an old hash which doesn't support read-only
            var roClass = typeof(ro) === 'undefined' ? '.cp-app-drive-element-noreadonly' :
                            ro ? '.cp-app-drive-element-readonly' : '';
            var liClass = '.cp-app-drive-element-file';
            var restrictedClass = restricted ? '.cp-app-drive-element-restricted' : '';
            if (isSharedFolder) {
                liClass = '.cp-app-drive-element-folder';
                $icon = $sharedFolderIcon.clone();
                $icon.css("color", getFolderColor(path.concat(elPath)));
            } else if (isFolder) {
                liClass = '.cp-app-drive-element-folder';
                $icon = manager.isFolderEmpty(root[key]) ? $folderEmptyIcon.clone() : $folderIcon.clone();
                $icon.css("color", getFolderColor(path.concat(elPath)));
            }

            var staticClass = manager.isStaticFile(element) ? '.cp-app-drive-static' : '';
            var classes = restrictedClass + roClass + liClass + staticClass;
            var $element = $(h('li.cp-app-drive-element.cp-app-drive-element-row' + classes, {
                draggable: true
            }));
            $element.data('path', newPath);
            if (isElementSelected($element)) {
                selectElement($element);
            }
            $element.prepend($icon).dblclick(function () {
                if (restricted) {
                    UI.warn(Messages.fm_restricted);
                    return;
                }
                if (isSharedFolder && !manager.folders[element]) {
                    UI.warn(Messages.fm_deletedFolder);
                    return;
                }
                if (isFolder) {
                    APP.displayDirectory(newPath);
                    return;
                }
                if (isTrash) { return; }
                openFile(root[key]);
            });
            var invalid;
            if (isFolder) {
                invalid = addFolderData(element, key, $element);
            } else {
                invalid = addFileData(element, $element);
            }
            if (invalid) {
                return;
            }

            $element.find('.fa').on('mouseenter', function (e) {
                if ($element[0] && $element[0]._tippy) {
                    $element[0]._tippy.destroy();
                }
                e.stopPropagation();
            });
            var droppable = !isTrash && !APP.$content.data('readOnlyFolder') && !restricted;
            addDragAndDropHandlers($element, newPath, isFolder, droppable);
            $element.click(function(e) {
                e.stopPropagation();
                onElementClick(e, $element);
            });
            if (!isTrash) {
                $element.on('contextmenu', openContextMenu('tree'));
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

            if (isSharedFolder && APP.convertedFolder === element) {
                setTimeout(function () {
                    var $fakeButton = createShareButton(element, $('<div>'));
                    if (!$fakeButton) { return; }
                    $fakeButton.click();
                }, 100);
            }

            if ($element.is('.cp-app-drive-static') && APP.mobile()) {
                var $menu = $('<span>', {'class': 'cp-app-drive-element-menu'});
                $menu.click(function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    $element.contextmenu();
                });
                $fileMenuIcon.clone().appendTo($menu);
                $element.append($menu);
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
                    APP.displayDirectory(LS.getLastOpenedFolder().slice(0, collapseLevel));
                };
            }
        };

        window.addEventListener("resize", collapseDrivePath);
        var treeResizeObserver = new MutationObserver(collapseDrivePath);
        treeResizeObserver.observe($("#cp-app-drive-tree")[0], {"attributes": true});

        // Create the title block with the "parent folder" button
        var createTitle = function ($container, path, noStyle) {
            if (!path || path.length === 0) { return; }
            var isTrash = manager.isPathIn(path, [TRASH]);
            // we assume that users viewing shared folders may want to see the "bread-crumb"
            if (!APP.newSharedFolder && APP.mobile() && !noStyle) { // noStyle means title in search result
                return $container;
            }
            var isVirtual = virtualCategories.indexOf(path[0]) !== -1;
            var el = isVirtual ? undefined : manager.find(path);
            path = path[0] === SEARCH ? path.slice(0,1) : path;
            var isInTrashRoot = manager.isInTrashRoot(path);

            var $outer = $('<div>', {'class': 'cp-app-drive-path'});
            var $inner = $('<div>', {'class': 'cp-app-drive-path-inner'});
            $outer.append($inner);
            $container.prepend($outer);

            var skipNext = false; // When encountering a shared folder, skip a key in the path
            path.forEach(function (p, idx) {
                if (isTrash && [2,3].indexOf(idx) !== -1) { return; }
                if (skipNext) { skipNext = false; return; }
                if (APP.newSharedFolder && priv.isEmbed && p === ROOT && !idx) { return; }
                var name = p;

                if (manager.isFile(el) && isInTrashRoot && idx === 1) {
                    idx = 3;
                }

                // Check if the current element is a shared folder. If it is, get its
                // name and skip the next itme in the path (it will be "root")
                var currentEl = isVirtual ? undefined : manager.find(path.slice(0, idx+1));

                // If we're in trash root, check if the "element" is a shared folder
                if (isTrash && idx === 1) {
                    currentEl = manager.find(path.slice(0, idx+3));
                }

                // Name and skip next...
                // "p === SHARED_FOLDER" for anonymous shared folders
                if (p === SHARED_FOLDER || (currentEl && manager.isSharedFolder(currentEl))) {
                    name = manager.getSharedFolderData(currentEl || APP.newSharedFolder).title;
                    skipNext = true;
                }

                var $span = $('<span>', {'class': 'cp-app-drive-path-element'});
                if (idx < path.length - 1) {
                    if (!noStyle) {
                        $span.addClass('cp-app-drive-path-clickable');
                        $span.click(function (e) {
                            e.stopPropagation();
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
                else if (!(APP.newSharedFolder && priv.isEmbed && idx === 1)) {
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
            if (APP.readOnly || $content.data('readOnlyFolder')) { return; }
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
                msg = APP.newSharedFolder ? Messages.fm_info_sharedFolder : Messages._getKey('fm_info_anonymous', [ApiConfig.inactiveTime || 90]);
                var docsLink = 'https://docs.cryptpad.org/en/user_guide/user_account.html#account-types';
                $box.html(msg).find('a[href="#docs"]').each(function () {
                    $(this).attr({
                        href: Pages.localizeDocsLink(docsLink),
                        target: '_blank',
                    });
                });
                return $(common.fixLinks($box));
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

        var getOppositeViewMode = function (viewMode) {
            viewMode = viewMode || getViewMode();
            var newViewMode = viewMode === 'grid'? 'list': 'grid';
            return newViewMode;
        };

        // Create the button allowing the user to switch from list to icons modes
        var createViewModeButton = function ($container) {
            var viewMode = getViewMode();
            var gridIcon = h('i.fa.fa-th-large', { title: Messages.fm_viewGridButton });
            var listIcon = h('i.fa.fa-list', { title: Messages.fm_viewListButton });

            var $button = $(h('button.cp-app-drive-viewmode-button', [
                gridIcon,
                listIcon
            ]));
            $button.attr('aria-label', Messages.label_viewMode);
            var $gridIcon = $(gridIcon);
            var $listIcon = $(listIcon);
            var showMode = function (mode) {
                if (mode === 'grid') {
                    $gridIcon.hide();
                    $listIcon.show();
                } else {
                    $listIcon.hide();
                    $gridIcon.show();
                }
            };
            setViewMode(viewMode || 'grid');
            showMode(viewMode);

            $button.click(function () {
                var viewMode = getViewMode();
                var newViewMode = getOppositeViewMode(viewMode);
                setViewMode(newViewMode);
                showMode(newViewMode);
                var $folder = $('#' + FOLDER_CONTENT_ID);
                if (newViewMode === 'list') {
                    $folder.removeClass('cp-app-drive-content-grid').addClass('cp-app-drive-content-list');
                    Feedback.send('DRIVE_LIST_MODE');
                } else {
                    $folder.addClass('cp-app-drive-content-grid').removeClass('cp-app-drive-content-list');
                    Feedback.send('DRIVE_GRID_MODE');
                }
            });
            $container.append($button);
        };
        var emptyTrashModal = function () {
            var ownedInTrash = manager.ownedInTrash();
            var hasOwned = Array.isArray(ownedInTrash) && ownedInTrash.length;
            var content = h('p', [
                Messages.fm_emptyTrashDialog,
                hasOwned ? h('br') : undefined,
                hasOwned ? UI.setHTML(h('span'), Messages.fm_emptyTrashOwned) : undefined
            ]);
            var buttons = [{
                className: 'cancel',
                name: Messages.cancelButton,
                onClick: function () {},
                keys: [27]
            }];
            if (hasOwned) {
                buttons.push({
                    className: 'danger',
                    iconClass: '.cptools.cptools-destroy',
                    name: Messages.fc_delete_owned,
                    onClick: function () {
                        manager.emptyTrash(true, refresh);
                    },
                    keys: []
                });
            }
            buttons.push({
                className: 'primary',
                // We may want to use a new key here
                iconClass: '.fa.fa-trash',
                name: hasOwned ? Messages.fc_remove : Messages.okButton,
                onClick: function () {
                    manager.emptyTrash(false, refresh);
                },
                keys: [13]
            });
            var m = UI.dialog.customModal(content, {
                buttons: buttons
            });
            UI.openCustomModal(m);
        };
        var createEmptyTrashButton = function () {
            var button = h('button.btn.btn-danger', [
                h('i.fa.'+faTrash),
                h('span', Messages.fc_empty)
            ]);
            $(button).click(function () {
                emptyTrashModal();
            });
            return $(h('div.cp-app-drive-button', button));
        };

        // Get the upload options
        var addSharedFolderModal = function (cb) {

            var docsHref = common.getBounceURL(Pages.localizeDocsLink("https://docs.cryptpad.org/en/user_guide/share_and_access.html#owners"));

            // Ask for name, password and owner
            var content = h('div', [
                h('h4', Messages.sharedFolders_create),
                h('label', {for: 'cp-app-drive-sf-name'}, Messages.sharedFolders_create_name),
                h('input#cp-app-drive-sf-name', {type: 'text', placeholder: Messages.fm_newFolder,tabindex:'1'}),
                h('label', {for: 'cp-app-drive-sf-password'}, Messages.fm_shareFolderPassword),
                UI.passwordInput({id: 'cp-app-drive-sf-password'}),
                h('span', {
                    style: 'display:flex;align-items:center;justify-content:space-between'
                }, [
                    UI.createCheckbox('cp-app-drive-sf-owned', Messages.sharedFolders_create_owned, true),
                    UI.createHelper(docsHref, Messages.creation_owned1)
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
        var showLinkModal = function () {
            var name, url;
            var warning = h('div.alert.alert-warning', [
                h('i.fa.fa-exclamation-triangle'),
                h('span', Messages.fm_link_warning)
            ]);
            var content = h('p', [
                h('label', {for: 'cp-app-drive-link-name'}, Messages.fm_link_name),
                name = h('input#cp-app-drive-link-name', { autocomplete: 'off', placeholder: Messages.fm_link_name_placeholder, tabindex:'1'}),
                h('label', {for: 'cp-app-drive-link-url'}, Messages.fm_link_url),
                url = h('input#cp-app-drive-link-url', { type: 'url', autocomplete: 'off', placeholder: Messages.form_input_ph_url,tabindex:'1'}),
                warning,
            ]);

            var protocolPattern = /https*:\/\//;
            var fragmentPattern = /#.*$/;
            var setNamePlaceholder = function (val) {
                var temp = val.replace(protocolPattern, '').replace(fragmentPattern, '').trim().slice(0, 48);
                if (!protocolPattern.test(val) || !temp) {
                    temp = Messages.fm_link_name_placeholder;
                }
                name.setAttribute('placeholder', temp);
            };

            var $warning = $(warning).hide();
            var $url = $(url).on('change keypress keyup keydown', function () {
                var v = $url.val().trim();
                $url.toggleClass('cp-input-invalid', !Util.isValidURL(v));
                if (v.length > 200) {
                    $warning.show();
                    return;
                }
                setNamePlaceholder(v);
                $warning.hide();
            });
            var buttons = [{
                className: 'cancel',
                name: Messages.cancelButton,
                onClick: function () {},
                keys: [27]
            }];
            buttons.push({
                className: 'primary',
                // We may want to use a new key here
                iconClass: '.fa.fa-plus',
                name: Messages.tag_add,
                onClick: function () {
                    var $name = $(name);
                    var n = $name.val().trim() || $name.attr('placeholder');
                    var u = $url.val().trim();
                    if (!n || !u) { return true; }
                    if (!Util.isValidURL(u)) {
                        UI.warn(Messages.fm_link_invalid);
                        return true;
                    }
                    manager.addLink(currentPath, {
                        name: n,
                        url: u
                    }, refresh);
                    Feedback.send("LINK_CREATED");
                },
                keys: [13]
            });
            var m = UI.dialog.customModal(content, {
                buttons: buttons
            });
            UI.openCustomModal(m);
        };
        var addNewPadHandlers = function ($block, isInRoot) {
            // Handlers
            if (isInRoot) {
                var onCreated = function (err, info) {
                    if (err) {
                        if (err === E_OVER_LIMIT) {
                            var content = h('span', UIElements.fixInlineBRs(Messages.pinLimitDrive));
                            return void UI.alert(content);
                        }
                        return void UI.alert(Messages.fm_error_cantPin);
                    }
                    APP.newFolder = info.newPath;
                    refresh();
                };
                $block.find('a.cp-app-drive-new-folder, li.cp-app-drive-new-folder')
                    .on('click keypress', function (event) {
                        if (event.type === 'click' || (event.type === 'keypress' && event.which === 13)) {
                            event.preventDefault();
                            manager.addFolder(currentPath, null, onCreated);
                        }
                    });
                if (!APP.disableSF && !manager.isInSharedFolder(currentPath)) {
                    $block.find('a.cp-app-drive-new-shared-folder, li.cp-app-drive-new-shared-folder')
                        .on('click keypress', function (event) {
                            if (event.type === 'click' || (event.type === 'keypress' && event.which === 13)) {
                                event.preventDefault();
                                addSharedFolderModal(function (obj) {
                                    if (!obj) { return; }
                                    manager.addSharedFolder(currentPath, obj, refresh);
                                });
                            }
                        });
                }
                $block.find('a.cp-app-drive-new-fileupload, li.cp-app-drive-new-fileupload')
                    .on('click keypress', function (event) {
                        if (event.type === 'click' || (event.type === 'keypress' && event.which === 13)) {
                            event.preventDefault();
                            showUploadFilesModal();
                        }
                    });
                $block.find('a.cp-app-drive-new-folderupload, li.cp-app-drive-new-folderupload')
                    .on('click keypress', function (event) {
                        if (event.type === 'click' || (event.type === 'keypress' && event.which === 13)) {
                            event.preventDefault();
                            showUploadFolderModal();
                        }
                    });
                $block.find('a.cp-app-drive-new-link, li.cp-app-drive-new-link')
                    .on('click keypress', function (event) {
                        if (event.type === 'click' || (event.type === 'keypress' && event.which === 13)) {
                            event.preventDefault();
                            showLinkModal();
                        }
                    });
            }
            $block.find('a.cp-app-drive-new-doc, li.cp-app-drive-new-doc')
                .on('click auxclick keypress', function (event) {
                    if (event.type === 'click' || event.type === 'auxclick' || (event.type === 'keypress' && event.which === 13))
                    {
                        event.preventDefault();
                        var type = $(this).attr('data-type') || 'pad';
                        var path = manager.isPathIn(currentPath, [TRASH]) ? '' : currentPath;
                        openIn(type, path, APP.team);
                    }
                });
        };
        var getNewPadOptions = function (isInRoot) {
            var options = [];
            if (isInRoot) {
                options.push({
                    class: 'cp-app-drive-new-folder',
                    icon: $folderIcon.clone()[0],
                    name: Messages.fm_folder,
                });
                if (!APP.disableSF && !manager.isInSharedFolder(currentPath)) {
                    options.push({
                        class: 'cp-app-drive-new-shared-folder',
                        icon: $sharedFolderIcon.clone()[0],
                        name: Messages.fm_sharedFolder,
                    });
                }
                options.push({ separator: true });
                options.push({
                    class: 'cp-app-drive-new-fileupload',
                    icon: getIcon('fileupload')[0],
                    name: Messages.uploadButton,
                });
                if (APP.allowFolderUpload) {
                    options.push({
                        class: 'cp-app-drive-new-folderupload',
                        icon: getIcon('folderupload')[0],
                        name: Messages.uploadFolderButton,
                    });
                }
                options.push({ separator: true });
                options.push({
                    class: 'cp-app-drive-new-link',
                    icon: getIcon('link')[0],
                    name: Messages.fm_link_new,
                });
                options.push({ separator: true });
            }
            getNewPadTypes().forEach(function (type) {
                var typeClass = 'cp-app-drive-new-doc';

                var premium = common.checkRestrictedApp(type);
                if (premium < 0) {
                    typeClass += ' cp-app-hidden cp-app-disabled';
                } else if (premium === 0) {
                    typeClass += ' cp-app-disabled';
                }

                options.push({
                    class: typeClass,
                    type: type,
                    icon: getIcon(type)[0],
                    name: Messages.type[type],
                });
            });

            if (APP.store[FILTER_BY]) {
                var typeFilter = APP.store[FILTER_BY];
                options = options.filter((obj) => {
                    if (obj.separator) { return false; }

                    if (typeFilter === 'link') {
                        return obj.class.includes('cp-app-drive-new-link');
                    }
                    if (typeFilter === 'file') {
                        return obj.class.includes('cp-app-drive-new-fileupload');
                    }
                    if (getNewPadTypes().indexOf(typeFilter) !== -1) {
                        return typeFilter === obj.type;
                    }
                });
            }

            return options;
        };
        var createNewButton = function (isInRoot, $container) {
            if (!APP.editable) { return; }
            if (!APP.loggedIn) { return; } // Anonymous users can use the + menu in the toolbar

            if (!manager.isPathIn(currentPath, [ROOT, 'hrefArray'])) { return; }

            // Create dropdown
            var options = getNewPadOptions(isInRoot).map(function (obj) {
                if (obj.separator) {
                    return { tag: 'hr', };
                }

                var newObj = {
                    tag: 'a',
                    attributes: { 'class': obj.class, href: '#' },
                    content: [obj.icon, obj.name]
                };

                if (obj.type) {
                    newObj.attributes['data-type'] = obj.type;
                    newObj.attributes['href'] = APP.origin + Hash.hashToHref('', obj.type);
                }

                return newObj;
            });

            var dropdownConfig = {
                buttonContent: [
                    h('i.fa.fa-plus'),
                    h('span.cp-button-name', Messages.fm_newButton),
                ],
                buttonCls: 'cp-toolbar-dropdown-nowrap',
                options: options,
                feedback: 'DRIVE_NEWPAD_LOCALFOLDER',
                common: common
            };
            var $block = UIElements.createDropdown(dropdownConfig);

            // Custom style:
            // actions for +New menu button
            var menuButton = $block.find('button');
            menuButton.addClass('cp-app-drive-toolbar-new');
            addNewPadHandlers($block, isInRoot);

            $container.append($block);
        };
        var createFilterButton = function (isTemplate, $container) {
            if (!APP.loggedIn) { return; }

            // Create dropdown
            var options = [];
            if (APP.store[FILTER_BY]) {
                options.push({
                    tag: 'a',
                    attributes: {
                        'class': 'cp-app-drive-rm-filter',
                        'href': '#'
                    },
                    content: [
                        h('i.fa.fa-times'),
                        Messages.fm_rmFilter,
                    ],
                });
                options.push({tag: 'hr'});
            }
            getNewPadTypes().forEach(function (type) {
                var attributes = {
                    'class': 'cp-app-drive-filter-doc',
                    'data-type': type,
                    'href': '#'
                };

                var premium = common.checkRestrictedApp(type);
                if (premium < 0) {
                    attributes.class += ' cp-app-hidden cp-app-disabled';
                } else if (premium === 0) {
                    attributes.class += ' cp-app-disabled';
                }

                options.push({
                    tag: 'a',
                    attributes: attributes,
                    content: [
                        getIcon(type)[0],
                        Messages.type[type]
                    ],
                });
            });
            if (!isTemplate) {
                options.push({tag: 'hr'});
                options.push({
                    tag: 'a',
                    attributes: {
                        'class': 'cp-app-drive-filter-doc',
                        'data-type': 'link',
                        'href': '#'
                    },
                    content: [
                        getIcon('link')[0],
                        Messages.fm_link_type
                    ],
                });
                options.push({
                    tag: 'a',
                    attributes: {
                        'class': 'cp-app-drive-filter-doc',
                        'data-type': 'file',
                        'href': '#'
                    },
                    content: [
                        getIcon('file')[0],
                        Messages.type['file']
                    ],
                });
            }
            var dropdownConfig = {
                buttonContent: [
                    h('i.fa.fa-filter'),
                    h('span.cp-button-name', Messages.fm_filterBy),
                ],
                buttonCls: 'cp-toolbar-dropdown-nowrap',
                options: options,
                feedback: 'DRIVE_FILTERBY',
                common: common
            };
            if (APP.store[FILTER_BY]) {
                var type = APP.store[FILTER_BY];
                var message = type === 'link' ? Messages.fm_link_type : Messages.type[type];
                dropdownConfig.buttonContent.push(
                    h('span.cp-button-name', ':'),
                    getIcon(type)[0],
                    h('span.cp-button-name', message)
                );
            }
            var $block = UIElements.createDropdown(dropdownConfig);

            // Add style
            if (APP.store[FILTER_BY]) {
                $block.find('button').addClass('cp-toolbar-button-active');
            }

            // Add handlers
            if (APP.store[FILTER_BY]) {
                $block.find('a.cp-app-drive-rm-filter')
                .click(function () {
                    APP.store[FILTER_BY] = undefined;
                    APP.displayDirectory(currentPath);
                });
            }
            $block.find('a.cp-app-drive-filter-doc')
            .click(function () {
                var type = $(this).attr('data-type') || 'invalid-filter';
                APP.store[FILTER_BY] = type;
                APP.displayDirectory([FILTER, type, currentPath]);
            });

            $container.append($block);
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
                ['cp-app-drive-element-type',
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
                $list.find('.cp-app-drive-sort-foldername').addClass('cp-app-drive-sort-active').append($icon);
            }
        };
        var getSortDropdown = function () {
            var $fhSort = $(h('span.cp-dropdown-container.cp-app-drive-element-sort.cp-app-drive-sort-clickable'));
            var options = [{
                tag: 'a',
                attributes: {'class': 'cp-app-drive-element-type'},
                content: [
                    h('i.fa.fa-minus'),
                    Messages.fm_type,
                ],
                action: function (e) { onSortByClick.call($(e.target).find('a')[0]); }
            },{
                tag: 'a',
                attributes: {'class': 'cp-app-drive-element-atime'},
                content: [
                    h('i.fa.fa-minus'),
                    Messages.fm_lastAccess,
                ],
                action: function (e) { onSortByClick.call($(e.target).find('a')[0]); }
            },{
                tag: 'a',
                attributes: {'class': 'cp-app-drive-element-ctime'},
                content: [
                    h('i.fa.fa-minus'),
                    Messages.fm_creation,
                ],
                action: function (e) { onSortByClick.call($(e.target).find('a')[0]); }
            }];
            var dropdownConfig = {
                text: '', // Button initial text
                options: options, // Entries displayed in the menu
                container: $fhSort,
                left: true,
                noscroll: true,
                common: common
            };
            var $sortBlock = UIElements.createDropdown(dropdownConfig);
            $sortBlock.find('button').append(h('span.fa.fa-sort-amount-desc')).append(h('span', Messages.fm_sort));
            return $fhSort;
        };
        var getFolderListHeader = function (clickable, small) {
            var $fohElement = $('<li>', {
                'class': 'cp-app-drive-element-header cp-app-drive-element-list'
            });
            var clickCls = clickable ? 'cp-app-drive-sort-clickable ' : '';
            var onClick = clickable ? onSortByClick : function () {};
            //var $fohElement = $('<span>', {'class': 'element'}).appendTo($folderHeader);
            var $name = $('<span>', {
                'class': 'cp-app-drive-element-name cp-app-drive-sort-foldername ' + clickCls
            }).text(Messages.fm_folderName).click(onClick);

            var $state = $('<span>', {'class': 'cp-app-drive-element-state'});
            var $subfolders, $files;
            if (!small) {
                $subfolders = $('<span>', {
                    'class': 'cp-app-drive-element-folders cp-app-drive-element-list'
                }).text(Messages.fm_numberOfFolders);
                $files = $('<span>', {
                    'class': 'cp-app-drive-element-files cp-app-drive-element-list'
                }).text(Messages.fm_numberOfFiles);
            }
            var $filler = $('<span>', {
                'class': 'cp-app-drive-element-filler cp-app-drive-element-list'
            });
            $fohElement.append($name).append($state)
                        .append($subfolders).append($files).append($filler);
            if (clickable) { addFolderSortIcon($fohElement); }
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
                $list.find('.' + classSorted).addClass('cp-app-drive-sort-active').append($icon).find('i').hide();
            }
        };
        var getFileListHeader = function (clickable) {
            var $fihElement = $('<li>', {
                'class': 'cp-app-drive-element-header cp-app-drive-element-list'
            });
            var clickCls = clickable ? 'cp-app-drive-sort-clickable ' : '';
            var onClick = clickable ? onSortByClick : function () {};
            //var $fihElement = $('<span>', {'class': 'element'}).appendTo($fileHeader);
            var $fhIcon = $('<span>', {'class': 'cp-app-drive-content-icon'});
            var $fhName = $('<span>', {
                'class': 'cp-app-drive-element-name cp-app-drive-sort-filename ' + clickCls
            }).text(Messages.fm_fileName).click(onClick);
            var $fhSort = clickable ? getSortDropdown() : undefined;

            var $fhState = $('<span>', {'class': 'cp-app-drive-element-state'});
            var $fhType = $('<span>', {
                'class': 'cp-app-drive-element-type cp-app-drive-element-list ' + clickCls
            }).text(Messages.fm_type).click(onClick);
            var $fhAdate = $('<span>', {
                'class': 'cp-app-drive-element-atime cp-app-drive-element-list ' + clickCls
            }).text(Messages.fm_lastAccess).click(onClick);
            var $fhCdate = $('<span>', {
                'class': 'cp-app-drive-element-ctime cp-app-drive-element-list ' + clickCls
            }).text(Messages.fm_creation).click(onClick);
            // If displayTitle is false, it means the "name" is the title, so do not display the "name" header
            $fihElement.append($fhIcon).append($fhName).append($fhSort).append($fhState).append($fhType);
            $fihElement.append($fhAdate).append($fhCdate);
            if (clickable) { addFileSortIcon($fihElement); }
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
            var getProp = function (_el) {
                var el = useId ? _el : root[_el];
                var sfId = (el && el.root && el.key) ? el.root[el.key] : el;
                if (folder && el && manager.isSharedFolder(sfId)) {
                    var sfData = manager.getSharedFolderData(sfId);
                    var title = sfData.title || sfData.lastTitle || el;
                    return String(title).toLowerCase();
                } else if (folder) {
                    return String((el && el.key) || _el).toLowerCase();
                }
                var data = manager.getFileData(el);
                if (!data) { return ''; }
                if (prop === 'type') {
                    var hrefData = Hash.parsePadUrl(data.href || data.roHref);
                    return hrefData.type;
                }
                if (prop === 'atime' || prop === 'ctime') {
                    return typeof(data[prop]) === "number" ? data[prop] : new Date(data[prop]);
                }
                return (manager.getTitle(el) || "").toLowerCase();
            };
            var props = {};
            keys.forEach(function (k) {
                var uid = k;
                if (typeof(k) === "object") {
                    uid = k.uid = Util.uid();
                }
                props[uid] = getProp(k);
            });
            keys.sort(function(a, b) {
                var _a = props[(a && a.uid) || a];
                var _b = props[(b && b.uid) || b];
                if (_a < _b) { return mult * -1; }
                if (_b < _a) { return mult; }
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

        var filterPads = function (files, type, path, useId) {
            var root = path && manager.find(path);

            return files
                .filter(function (e) {
                    return useId ? manager.isFile(e) : (path && manager.isFile(root[e]));
                })
                .filter(function (e) {
                    var id = useId ? e : root[e];
                    var data = manager.getFileData(id);
                    if (type === 'link') { return data.static; }
                    var href = data.href || data.roHref;
                    return href ? (href.split('/')[1] === type) : true;
                    // if types are unreachable, display files to avoid misleading the user
                });
        };

        // Create the ghost icon to add pads/folders
        var createNewPadIcons = function ($block, isInRoot) {
            var $container = $('<ul>');
            getNewPadOptions(isInRoot).forEach(function (obj) {
                if (obj.separator) { return; }

                var $element = $('<li>', {
                    'class': obj.class + ' cp-app-drive-element-row ' +
                        'cp-app-drive-element-grid',
                        'tabindex': 1
                }).prepend(obj.icon).appendTo($container);
                $element.append($('<span>', { 'class': 'cp-app-drive-new-name' }).text(obj.name));

                if (obj.type) {
                    $element.attr('data-type', obj.type);
                }
            });

            $container.find('.cp-app-drive-element-row').click(function () {
                $block.hide();
            });
            return $container;
        };
        var createGhostIcon = function ($list) {
            if (APP.$content.data('readOnlyFolder') || !APP.editable) { return; }
            var isInRoot = currentPath[0] === ROOT;
            var $element = $('<li>', {
                'class': 'cp-app-drive-element-row cp-app-drive-new-ghost'
            }).prepend($addIcon.clone()).appendTo($list);
            $element.append($('<span>', {'class': 'cp-app-drive-element-name'})
                .text(Messages.fm_newButton));
            $element.click(function () {
                var modal = UI.createModal({
                    id: 'cp-app-drive-new-ghost-dialog',
                    $body: $('body')
                });
                var $modal = modal.$modal;
                var $title = $(h('h3', [ h('i.fa.fa-plus'), ' ', Messages.fm_newButton ]));
                var $description = $('<p>').text(Messages.fm_newButtonTitle);
                $modal.find('.cp-modal').append($title);
                $modal.find('.cp-modal').append($description);
                var $content = createNewPadIcons($modal, isInRoot);
                $modal.find('.cp-modal').append($content);
                window.setTimeout(function () { modal.show(); });
                addNewPadHandlers($modal, isInRoot);
            });
        };

        // Drive content toolbar
        var checkCollapseButton = function () {
            APP.$collapseButton.removeClass('cp-toolbar-button-active');
            if (APP.$tree.is(':visible')) {
                APP.$collapseButton.addClass('cp-toolbar-button-active');
            }
        };
        var collapseTreeButton = function () {
            APP.$collapseButton = APP.$collapseButton || common.createButton('', true, {
                text: Messages.drive_treeButton,
                name: 'files',
                icon: 'fa-hdd-o',
                drawer: false,
            });
            checkCollapseButton();
            APP.toolbar.$bottomL.append(APP.$collapseButton);
            APP.$collapseButton.off('click').on('click', function () {
                APP.$tree.toggle();
                APP.$splitter.toggle(APP.$tree.is(':visible'));
                checkCollapseButton();
            });
        };
        var createToolbar = function () {
            var $toolbar = APP.toolbar.$bottom;
            APP.toolbar.$bottomL.html('');
            APP.toolbar.$bottomR.html('');
            if (APP.histConfig && (APP.loggedIn || !APP.newSharedFolder)) {
                // ANON_SHARED_FOLDER
                var $hist = common.createButton('history', true, {histConfig: APP.histConfig});
                APP.toolbar.$bottomR.append($hist);
            }
            if (APP.$burnThisDrive) {
                APP.toolbar.$bottomR.append(APP.$burnThisDrive);
            }
            // this button is not useful for unregistered users who do not have a tree worth looking at
            if (APP.loggedIn) { collapseTreeButton(); }
            return $toolbar;
        };

        // Unsorted element are represented by "href" in an array: they don't have a filename
        // and they don't hav a hierarchical structure (folder/subfolders)
        var displayHrefArray = function ($container, rootName, draggable, typeFilter) {
            var unsorted = files[rootName];
            if (unsorted.length) {
                var $fileHeader = getFileListHeader(true);
                $container.append($fileHeader);
            }
            var keys = unsorted;
            var sortBy = APP.store[SORT_FILE_BY];
            sortBy = sortBy === "" ? sortBy = 'name' : sortBy;
            var sortedFiles = sortElements(false, [rootName], keys, sortBy, !getSortFileDesc(), true);
            sortedFiles = typeFilter ? filterPads(sortedFiles, typeFilter, false, true) : sortedFiles;
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
            if (Object.keys(allfiles || {}).length === 0) {
                createGhostIcon($container);
                return;
            }
            var $fileHeader = getFileListHeader(true);
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
                var $fileMenu = $('<li>').append($fileMenuIcon);
                $element.append($fileMenu);
                $container.append($element);
            });
            createGhostIcon($container);
        };

        var displayTrashRoot = function ($list, $folderHeader, $fileHeader, typeFilter) {
            var filesList = [];
            var root = files[TRASH];
            var isEmpty = true;

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
                isEmpty = false;
            });

            var sortedFolders = typeFilter ? [] : sortTrashElements(true, filesList, null, !getSortFolderDesc());
            var sortedFiles = sortTrashElements(false, filesList, APP.store[SORT_FILE_BY], !getSortFileDesc);

            if (typeFilter) {
                var ids = sortedFiles.map(function (obj) { return obj.element; });
                var idsFilter = filterPads(ids, typeFilter, false, true);
                sortedFiles = sortedFiles.filter(function (obj) {
                    return (idsFilter.indexOf(obj.element) !== -1);
                });
                // prevent trash emptying while filter is active
                isEmpty = true;
            }

            if (!isEmpty) {
                var $empty = createEmptyTrashButton();
                $content.append($empty);
            }

            if (!typeFilter && manager.hasSubfolder(root, true)) { $list.append($folderHeader); }
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

        APP.Search = {};
        var displaySearch = function ($list, value) {
            var search = APP.Search;
            var $div = $('<div>', {'id': 'cp-app-drive-search', 'class': 'cp-unselectable'});

            $searchIcon.clone().appendTo($div);

            var $spinnerContainer = $(h('div.cp-app-drive-search-spinner'));
            var spinner = UI.makeSpinner($spinnerContainer);
            var searching = true;
            var $input = APP.Search.$input = $('<input>', {
                id: 'cp-app-drive-search-input',
                placeholder: Messages.fm_searchName,
                type: 'text',
                draggable: false,
                tabindex: 1,
            }).keyup(function (e) {
                if (searching) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                var currentValue = $input.val().trim();
                if (search.to) { window.clearTimeout(search.to); }
                if (e.which === 13) {
                    spinner.spin();
                    var newLocation = [SEARCH, $input.val()];
                    search.cursor = $input[0].selectionStart;
                    if (!manager.comparePath(newLocation, currentPath.slice())) {
                        searching = true;
                        APP.displayDirectory(newLocation);
                    }
                    return;
                }
                if (e.which === 27) {
                    $input.val('');
                    search.cursor = 0;
                    searching = true;
                    APP.displayDirectory([SEARCH]);
                    return;
                }

                if (currentValue === "") {
                    search.cursor = 0;
                    APP.displayDirectory([SEARCH]);
                    return;
                }

                if (currentValue.length < 2) { return; } // Don't autosearch 1 character
                search.to = window.setTimeout(function () {
                    var newLocation = [SEARCH, $input.val()];
                    search.cursor = $input[0].selectionStart;
                    if (currentValue === search.value) { return; }
                    if (!manager.comparePath(newLocation, currentPath.slice())) {
                        searching = true;
                        APP.displayDirectory(newLocation);
                    }
                }, 500);
            }).on('click mousedown mouseup', function (e) {
                e.stopPropagation();
            }).val(value || '').appendTo($div);
            $input[0].selectionStart = search.cursor || 0;
            $input[0].selectionEnd = search.cursor || 0;

            var cancel = h('span.fa.fa-times.cp-app-drive-search-cancel', {title:Messages.cancel});
            cancel.addEventListener('click', function () {
                $input.val('');
                search.cursor = 0;
                APP.displayDirectory([SEARCH]);
            });
            $div.append(cancel);

            $list.append($div);
            $spinnerContainer.appendTo($list);
            setTimeout(function () {
                $input.focus();
            });

            if (typeof(value) === "string" && value.trim()) {
                spinner.spin();
            } else {
                searching = false;
                return;
            }

            setTimeout(function () {
                //$list.closest('#cp-app-drive-content-folder').addClass('cp-app-drive-content-list');
                var filesList = manager.search(value);
                if (!filesList.length) {
                    $list.append(h('div.cp-app-drive-search-noresult', Messages.fm_noResult));
                    spinner.hide();
                    searching = false;
                    return;
                }
                var sortable = {};
                var sortableFolders = [];
                filesList.forEach(function (r) {
                    // if r.id === null, then it's a folder, not a file
                    r.paths.forEach(function (path) {
                        if (!r.inSharedFolder &&
                            APP.hideDuplicateOwned && manager.isDuplicateOwned(path)) { return; }
                        var _path = path.slice();
                        var key = path.pop();
                        var root = manager.find(path);
                        var obj = {
                            path: path,
                            _path: _path,
                            key: key,
                            root: root,
                            data: r.data
                        };
                        if (manager.isFolder(root[key])) {
                            sortableFolders.push(obj);
                            return;
                        }
                        sortable[root[key]] = obj;
                    });
                });
                var _folders = sortElements(true, [ROOT], sortableFolders, null, !getSortFolderDesc(), true);
                var sortableKeys = Object.keys(sortable).map(Number);
                var _files = sortElements(false, [ROOT], sortableKeys, APP.store[SORT_FILE_BY], !getSortFileDesc(), true);

                var addEl = function (obj, folder) {
                    var $element = createElement(obj.path, obj.key, obj.root, folder);
                    $element.addClass('cp-app-drive-element-notrash cp-app-drive-search-result');
                    $element.off('contextmenu');
                    $element.contextmenu(openContextMenu('default'));
                    $element.data('context', 'default');
                    if (folder) {
                        $element.find('.cp-app-drive-element-list').css({
                            visibility: 'hidden'
                        }).text('');
                    }
                    if (manager.isPathIn(obj._path, ['hrefArray'])) {
                        obj._path.pop();
                        obj._path.push(obj.data.title);
                    }
                    var $path = $('<span>', {
                        'class': 'cp-app-drive-search-path'
                    }).appendTo($element.find('.cp-app-drive-element-name'));
                    createTitle($path, obj._path);

                    $list.append($element);
                };
                if (_folders.length) { getFolderListHeader(true, true).appendTo($list); }
                _folders.forEach(function (el) {
                    var obj = el;
                    addEl(obj, true);
                });
                if (_files.length) { getFileListHeader(true).appendTo($list); }
                _files.forEach(function (el) {
                    var obj = sortable[el];
                    addEl(obj, false);
                });
                setTimeout(collapseDrivePath);
                spinner.hide();
                searching = false;
            });
        };

        var displayRecent = function ($list, typeFilter) {
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

            if (typeFilter) {
                var ids = filesList.map(function (arr) { return arr[0]; });
                var idsFilter = filterPads(ids, typeFilter, false, true);
                filesList = filesList.filter(function (arr) {
                    return (idsFilter.indexOf(arr[0]) !== -1);
                });
            }

            var $fileHeader = getFileListHeader(false);
            $list.append($fileHeader);
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

                if (!file.channel) { file.channel = id; }
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
                /*
                var $icon = getFileIcon(id);
                var ro = manager.isReadOnlyFile(id);
                // ro undefined means it's an old hash which doesn't support read-only
                var roClass = typeof(ro) === 'undefined' ? ' cp-app-drive-element-noreadonly' :
                                ro ? ' cp-app-drive-element-readonly' : '';
                var $element = $('<li>', {
                    'class': 'cp-app-drive-element cp-app-drive-element-notrash cp-app-drive-element-file cp-app-drive-element-row' + roClass,
                });*/
                var parentPath = path.slice();
                var key = parentPath.pop();
                var root = manager.find(parentPath);
                var $element = createElement(parentPath, key, root);
                $element.off('contextmenu').contextmenu(openContextMenu('default'));
                $element.data('context', 'default');
                $list.append($element);
                i++;
            });
        };

        // Owned pads category
        var displayOwned = function ($container) {
            var list = manager.getOwnedPads();
            if (list.length === 0) { return; }
            var $fileHeader = getFileListHeader(true);
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
                        APP.displayDirectory([SEARCH, '#' + tag]);
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
            var $folderHeader = getFolderListHeader(true);
            var $fileHeader = getFileListHeader(true);
            var path = currentPath.slice(1);
            var root = Util.find(data, path);

            var realPath = [ROOT, SHARED_FOLDER].concat(path);

            if (manager.hasSubfolder(root)) { $list.append($folderHeader); }
            // display sub directories
            var keys = Object.keys(root);
            var sortedFolders = sortElements(true, realPath, keys, null, !getSortFolderDesc());
            var sortedFiles = sortElements(false, realPath, keys, APP.store[SORT_FILE_BY], !getSortFileDesc());
            sortedFolders.forEach(function (key) {
                if (manager.isFile(root[key])) { return; }
                var $element = createElement(realPath, key, root, true);
                $element.appendTo($list);
            });
            if (manager.hasFile(root)) { $list.append($fileHeader); }
            // display files
            sortedFiles.forEach(function (key) {
                if (manager.isFolder(root[key])) { return; }
                var $element = createElement(realPath, key, root, false);
                if (!$element) { return; }
                $element.appendTo($list);
            });
        };

        // Display the selected directory into the content part (rightside)
        // NOTE: Elements in the trash are not using the same storage structure as the others
        var _displayDirectory = function (path, force) {
            if (APP.closed || (APP.$content && !$.contains(document.documentElement, APP.$content[0]))) { return; }

            APP.hideMenu();

            if (!APP.editable) { debug("Read-only mode"); }
            if (!appStatus.isReady && !force) { return; }

            // Fix path obvious issues
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

            if (APP.loggedIn && path[0] === FILES_DATA) {
                path = [ROOT];
            }

            // Get path data
            appStatus.ready(false);
            currentPath = path;
            var s = $content.scrollTop() || 0;
            $content.html("");
            sel.$selectBox = $('<div>', {'class': 'cp-app-drive-content-select-box'})
                .appendTo($content);

            var typeFilter;
            var isFilter = path[0] === FILTER;
            if (isFilter) {
                if (path.length < 3) { return; }
                typeFilter = path[1];
                path = path[2];
                currentPath = path;
            } else {
                APP.store[FILTER_BY] = undefined;
            }
            var isInRoot = manager.isPathIn(path, [ROOT]);
            var inTrash = manager.isPathIn(path, [TRASH]);
            var isTrashRoot = manager.comparePath(path, [TRASH]);
            var isTemplate = manager.comparePath(path, [TEMPLATE]);
            var isAllFiles = manager.comparePath(path, [FILES_DATA]);
            var isVirtual = virtualCategories.indexOf(path[0]) !== -1;
            var isSearch = path[0] === SEARCH;
            var isRecent = path[0] === RECENT;
            var isOwned = path[0] === OWNED;
            var isTags = path[0] === TAGS;
            // ANON_SHARED_FOLDER
            var isSharedFolder = path[0] === SHARED_FOLDER && APP.newSharedFolder;
            if (isSharedFolder && path.length < 2) {
                path = [SHARED_FOLDER, 'root'];
                currentPath = path;
            }

            // Make sure the path is valid
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
                if (path.length === 1 && path[0] === ROOT) {
                    // Somehow we can't display ROOT. We should abort now because we'll
                    // end up in an infinite loop
                    return void UI.warn(Messages.fm_error_cantPin); // Internal server error, please reload...
                }
                var parentPath = path.slice();
                parentPath.pop();
                _displayDirectory(parentPath, true);
                return;
            }
            if (!isSearch) { delete APP.Search.oldLocation; }

            // Display the tree and build the content
            APP.resetTree();

            LS.setLastOpenedFolder(path);

            createToolbar(path);

            if (!isSearch) { createTitle($content, path); }
            var $info = createInfoBox(path);

            var $dirContent = $('<div>', {id: FOLDER_CONTENT_ID});
            $dirContent.data('path', path);
            if (!isTags) {
                $dirContent.addClass(getViewModeClass(isSearch));
                if (!isSearch) {
                    createViewModeButton(APP.toolbar.$bottomR);
                }
            }

            var $list = $('<ul>').appendTo($dirContent);

            var sfId = manager.isInSharedFolder(currentPath);

            // Restricted folder? display ROOT instead
            if (sfId && files.restrictedFolders[sfId]) {
                _displayDirectory([ROOT], true);
                return;
            }

            var readOnlyFolder = false;

            // If the shared folder is offline, add the "DISCONNECTED" banner, otherwise
            // use the normal "editable" behavior (based on drive offline or history mode)
            if (sfId && manager.folders[sfId].offline) {
                setEditable(false, false, true);
            } else {
                setEditable(true, false, true);
            }

            if (APP.readOnly && !APP.loggedIn) {
                (function () {
                    // show 'READ-ONLY' when a guest only has view rights
                    if (/\/view\//.test(APP.anonSFHref)) {
            // !common.getMetadataMgr().getPrivateData().canEdit
            // would accomplish the same thing if this breaks
                        $content.prepend($readOnly.clone());
                        return;
                    }
                    // otherwise prompt them to log in or register to take advantage of their edit rights
                    var $banner = $(Pages.setHTML(h('div.cp-app-drive-content-info-box'), Messages.fm_info_sharedFolder));
                    $banner.find('[href="/login/"], [href="/register/"]').click(function (ev) {
                        ev.preventDefault();
                        var page = this.getAttribute('href').replace(/\//g, '');
                        common.setLoginRedirect(page);
                    });
                    $content.prepend($banner);
                }());
            } else if (APP.readOnly) {
                // Read-only drive (team?)
                $content.prepend($readOnly.clone());
            } else if (sfId && folders[sfId] && folders[sfId].readOnly) {
                // If readonly shared folder...
                $content.prepend($readOnly.clone());
                readOnlyFolder = true;
            }
            $content.data('readOnlyFolder', readOnlyFolder);

            if (!readOnlyFolder) {
                createNewButton(isInRoot, APP.toolbar.$bottomL);
            }
            if (!isTags && !isSearch) {
                createFilterButton(isTemplate, APP.toolbar.$bottomL);
            }

            var $folderHeader = getFolderListHeader(true);
            var $fileHeader = getFileListHeader(true);

            if (isTemplate) {
                displayHrefArray($list, path[0], true, typeFilter);
            } else if (isAllFiles) {
                displayAllFiles($list);
            } else if (isTrashRoot) {
                displayTrashRoot($list, $folderHeader, $fileHeader, typeFilter);
            } else if (isSearch) {
                displaySearch($list, path[1]);
            } else if (isRecent) {
                displayRecent($list, typeFilter);
            } else if (isOwned) {
                displayOwned($list);
            } else if (isTags) {
                displayTags($list);
            } else if (isSharedFolder) {
                // ANON_SHARED_FOLDER
                displaySharedFolder($list);
            } else {
                if (!inTrash) { $dirContent.contextmenu(openContextMenu('content')); }
                if (!isFilter && manager.hasSubfolder(root)) { $list.append($folderHeader); }
                // display sub directories
                var keys = Object.keys(root);
                var sortedFolders = isFilter ? [] : sortElements(true, path, keys, null, !getSortFolderDesc());
                var sortedFiles = sortElements(false, path, keys, APP.store[SORT_FILE_BY], !getSortFileDesc());
                sortedFiles = isFilter ? filterPads(sortedFiles, typeFilter, path) : sortedFiles;
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

            // If the selected element is not visible, scroll to make it visible, otherwise scroll to
            // the previous scroll position
            var $sel = findSelectedElements();
            if ($sel.length) {
                var _top = $sel[0].getBoundingClientRect().top;
                var _topContent = $content[0].getBoundingClientRect().top;
                if ((_topContent + s + $content.height() - 20) < _top) {
                    $sel[0].scrollIntoView();
                } else {
                    $content.scrollTop(s);
                }
            } else {
                $content.scrollTop(s);
            }

            delete APP.convertedFolder;

            appStatus.ready(true);
        };
        var displayDirectory = APP.displayDirectory = function (path, force, cb) {
            cb = cb || function () {};
            if (APP.closed || (APP.$content && !$.contains(document.documentElement, APP.$content[0]))) { return; }
            if (history.isHistoryMode) {
                _displayDirectory(path, force);
                return void cb();
            }
            if (!manager.comparePath(currentPath, path)) {
                removeSelected();
            }
            updateObject(sframeChan, proxy, function () {
                copyObjectValue(files, proxy.drive);
                updateSharedFolders(sframeChan, manager, files, folders, function () {
                    _displayDirectory(path, force);
                    cb();
                });
            });
        };

        var createTreeElement = function (name, $icon, path, draggable, droppable, collapsable, active, isSharedFolder) {
            var $name = $('<span>', { 'class': 'cp-app-drive-element' }).text(name);
            $icon.css("color", isSharedFolder ? getFolderColor(path.slice(0, -1)) : getFolderColor(path));
            var $collapse;
            if (collapsable) {
                $collapse = $expandIcon.clone().attr('tabindex', 0);
            }
            var $elementRow = $('<span>', {
                'class': 'cp-app-drive-element-row cp-app-drive-element-folder',
                'tabindex': 0
            }).append($icon).append($name).on('click keypress', function (e) {
                if (e.type === 'keypress' && e.which !== 13) {
                    return;
                }
                e.stopPropagation();
                if (isSharedFolder && !manager.folders[isSharedFolder]) {
                    UI.warn(Messages.fm_deletedFolder);
                    return;
                }
                if (files.restrictedFolders[isSharedFolder]) {
                    UI.warn(Messages.fm_restricted);
                    return;
                }
                APP.displayDirectory(path);
            });
            if (files.restrictedFolders[isSharedFolder]) {
                $elementRow.addClass('cp-app-drive-element-restricted');
            }
            if (isSharedFolder) {
                var sfData = manager.getSharedFolderData(isSharedFolder);
                _addOwnership($elementRow, $(), sfData);
            }
            var $element = $('<li>').append($elementRow);
            if (draggable) { $elementRow.attr('draggable', true); }
            if (collapsable) {
                $element.addClass('cp-app-drive-element-collapsed');
                $collapse.on('click keypress', function(e) {
                    if (e.type === 'keypress' && e.which !== 13) {
                        return;
                    }
                    e.stopPropagation();
                    if ($element.hasClass('cp-app-drive-element-collapsed')) {
                        // It is closed, open it
                        $element.removeClass('cp-app-drive-element-collapsed');
                        LS.setFolderOpened(path, true);
                        $collapse.removeClass('fa-plus-square-o');
                        $collapse.addClass('fa-minus-square-o');
                    } else {
                        // Collapse the folder
                        $element.addClass('cp-app-drive-element-collapsed');
                        LS.setFolderOpened(path, false);
                        $collapse.removeClass('fa-minus-square-o');
                        $collapse.addClass('fa-plus-square-o');
                        // Change the current opened folder if it was collapsed
                        if (manager.isSubpath(currentPath, path)) {
                            displayDirectory(path);
                        }
                    }
                });
                if (LS.wasFolderOpened(path) ||
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

            var isRoot = manager.comparePath([ROOT], path);
            var rootName = ROOT_NAME;
            if (APP.newSharedFolder && priv.isEmbed && isRoot) {
                var newSFPaths = manager.findFile(Number(APP.newSharedFolder));
                if (newSFPaths.length) {
                    path = newSFPaths[0];
                    path.push(ROOT);
                    root = manager.find(path);
                    rootName = manager.getSharedFolderData(APP.newSharedFolder).title;
                }
            }

            // don't try to display what doesn't exist
            if (!root) { return; }

            // Display the root element in the tree
            if (isRoot) {
                var isRootOpened = manager.comparePath(path.slice(), currentPath);
                var $rootIcon = manager.isFolderEmpty(files[ROOT]) ?
                    (isRootOpened ? $folderOpenedEmptyIcon : $folderEmptyIcon) :
                    (isRootOpened ? $folderOpenedIcon : $folderIcon);
                var $rootElement = createTreeElement(rootName, $rootIcon.clone(), path.slice(), false, true, true, isRootOpened);
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
                var isSharedFolder = manager.isSharedFolder(root[key]) && root[key];
                var sfId = manager.isInSharedFolder(newPath) || (isSharedFolder && root[key]);
                var $icon, isCurrentFolder, subfolder;
                if (isSharedFolder) {
                    // Fix path
                    newPath.push(manager.user.userObject.ROOT);
                    isCurrentFolder = manager.comparePath(newPath, currentPath);
                    // Subfolders?
                    var newRoot = Util.find(manager, ['folders', sfId, 'proxy', manager.user.userObject.ROOT]) || {};
                    subfolder = manager.hasSubfolder(newRoot);
                    // Fix name
                    var sfData = manager.getSharedFolderData(sfId);
                    key = sfData.title || sfData.lastTitle || Messages.fm_deletedFolder;
                    // Fix icon
                    $icon = isCurrentFolder ? $sharedFolderOpenedIcon : $sharedFolderIcon;
                    isSharedFolder = sfId;
                } else {
                    var isEmpty = manager.isFolderEmpty(root[key]);
                    subfolder = manager.hasSubfolder(root[key]);
                    isCurrentFolder = manager.comparePath(newPath, currentPath);
                    $icon = isEmpty ?
                        (isCurrentFolder ? $folderOpenedEmptyIcon : $folderEmptyIcon) :
                        (isCurrentFolder ? $folderOpenedIcon : $folderIcon);
                }
                var f = folders[sfId];
                var editable = !(f && f.readOnly);
                var $element = createTreeElement(key, $icon.clone(), newPath, true, editable,
                                                subfolder, isCurrentFolder, isSharedFolder);
                $element.appendTo($list);
                $element.find('>.cp-app-drive-element-row').contextmenu(openContextMenu('tree'));
                if (isSharedFolder) {
                    $element.find('>.cp-app-drive-element-row')
                        .addClass('cp-app-drive-element-sharedf');
                }
                if (sfId && !editable) {
                    $element.attr('data-ro', true);
                }
                if (!subfolder) { return; }
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
        categories[SEARCH] = {
            name: Messages.fm_searchPlaceholder,
            $icon: $searchIcon
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

            var $div = $('<div>', {'class': 'cp-app-drive-tree-categories-container'})
                .appendTo($tree);
            if (displayedCategories.indexOf(SEARCH) !== -1) { createCategory($div, SEARCH); }
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
            var div = h('div');
            var space = 10;
            path.forEach(function (s, i) {
                if (i === 0) { s = getPrettyName(s); }
                div.appendChild(h('span', { style: 'margin: 0 0 0 ' + i * space + 'px', }, s));
                div.appendChild(h(('br')));
            });
            return div;
        };

        // Disable middle click in the context menu to avoid opening /drive/inner.html# in new tabs
        var onWindowClick = function (e) {
            if (!e.target || !$(e.target).parents('.cp-dropdown-content').length) { return; }
            if (e.which !== 1) {
                e.stopPropagation();
                return false;
            }
        };

        APP.getProperties = function (el, cb) {
            if (!manager.isFile(el) && !manager.isSharedFolder(el)) {
                return void cb('NOT_FILE');
            }
            //var ro = manager.isReadOnlyFile(el);
            var data;
            if (manager.isSharedFolder(el)) {
                data = JSON.parse(JSON.stringify(manager.getSharedFolderData(el)));
            } else {
                data = JSON.parse(JSON.stringify(manager.getFileData(el)));
            }
            if (!data || !(data.href || data.roHref)) { return void cb('INVALID_FILE'); }

            var opts = {};
            opts.href = Hash.getRelativeHref(data.href || data.roHref);
            opts.channel = data.channel;

            if (manager.isSharedFolder(el)) {
                var ro = folders[el] && folders[el].version >= 2;
                if (!ro) { opts.noReadOnly = true; }
            }
            Properties.getPropertiesModal(common, opts, cb);
        };
        APP.getAccess = function (el, cb) {
            if (!manager.isFile(el) && !manager.isSharedFolder(el)) {
                return void cb('NOT_FILE');
            }
            var data;
            if (manager.isSharedFolder(el)) {
                data = JSON.parse(JSON.stringify(manager.getSharedFolderData(el)));
            } else {
                data = JSON.parse(JSON.stringify(manager.getFileData(el)));
            }
            if (!data || !(data.href || data.roHref)) { return void cb('INVALID_FILE'); }

            var opts = {};
            opts.href = Hash.getRelativeHref(data.href || data.roHref);
            opts.channel = data.channel;

            // Transfer ownership: templates are stored as templates for other users/teams
            if (currentPath[0] === TEMPLATE) {
                opts.isTemplate = true;
            }

            // Shared folders: no expiration date
            if (manager.isSharedFolder(el)) {
                opts.noExpiration = true;
            }

            Access.getAccessModal(common, opts, cb);
        };

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
                manager.deleteOwned(pathsList, function () {
                    pathsList.forEach(LS.removeFoldersOpened);
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

                var uo = manager.user.userObject;
                if (sfId && manager.folders[sfId]) {
                    uo = manager.folders[sfId].userObject;
                }
                if (uo.getFilesRecursively) {
                    data.list = uo.getFilesRecursively(folderElement).map(function (el) {
                        var d = uo.getFileData(el);
                        return d.channel;
                    });
                }

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

        var openInApp = function (paths, app) {
            var p = paths[0];
            var el = manager.find(p.path);
            var path = currentPath;
            if (path[0] !== ROOT) { path = [ROOT]; }
            var _metadata = manager.getFileData(el);
            var _simpleData = {
                title: _metadata.filename || _metadata.title,
                href: _metadata.href || _metadata.roHref,
                fileType: _metadata.fileType,
                password: _metadata.password,
                channel: _metadata.channel,
            };
            openIn(app, path, APP.team, _simpleData);
        };

        var addContextEvent = function () { $contextMenu.on("click", "a", function(e) {
            e.stopPropagation();
            var paths = $contextMenu.data('paths');
            var pathsList = [];
            var type = $contextMenu.attr('data-menu-type');
            var $this = $(this);

            var prefix = /cp\-app\-drive\-context\-/;
            var command = Util.slice(this.classList)
                .map(c => {
                    if (!prefix.test(c)) { return; }
                    return c.replace(prefix, '');
                }).filter(Boolean);
            console.log(command);

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
            else if ($this.hasClass('cp-app-drive-context-openfolder')) {
                APP.displayDirectory(paths[0].path);
                return;
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
            else if ($this.hasClass('cp-app-drive-context-preview')) {
                if (paths.length !== 1) { return; }
                el = manager.find(paths[0].path);
                openFile(el, null, false);
            }
            else if ($this.hasClass('cp-app-drive-context-open')) {
                paths.forEach(function (p) {
                    var el = manager.find(p.path);
                    if (files.restrictedFolders[el]) {
                        UI.warn(Messages.fm_restricted);
                        return;
                    }
                    openFile(el, false, true);
                });
            }
            else if ($this.hasClass('cp-app-drive-context-openro')) {
                paths.forEach(function (p) {
                    var el = manager.find(p.path);
                    if (paths[0].path[0] === SHARED_FOLDER && APP.newSharedFolder) {
                        // ANON_SHARED_FOLDER
                        el = manager.find(paths[0].path.slice(1), APP.newSharedFolder);
                    }
                    if (manager.isPathIn(p.path, [FILES_DATA])) {
                        el = p.path[1];
                    } else {
                        if (!el || manager.isFolder(el)) { return; }
                    }
                    openFile(el, true, true);
                });
            }
            else if ($this.hasClass('cp-app-drive-context-makeacopy')) {
                if (paths.length !== 1) { return; }
                el = manager.find(paths[0].path);
                (function () {
                    var path = currentPath;
                    if (path[0] !== ROOT) { path = [ROOT]; }
                    var _metadata = manager.getFileData(el);
                    var _simpleData = {
                        title: _metadata.filename || _metadata.title,
                        href: _metadata.href || _metadata.roHref,
                        password: _metadata.password,
                        channel: _metadata.channel,
                    };
                    var parsed = Hash.parsePadUrl(_metadata.href || _metadata.roHref);
                    openIn(parsed.type, path, APP.team, _simpleData);
                })();
            }
            else if ($this.hasClass('cp-app-drive-context-openincode')) {
                if (paths.length !== 1) { return; }
                openInApp(paths, 'code');
            }
            else if ($this.hasClass('cp-app-drive-context-openinsheet')) {
                if (paths.length !== 1) { return; }
                openInApp(paths, 'sheet');
            }
            else if ($this.hasClass('cp-app-drive-context-openindoc')) {
                if (paths.length !== 1) { return; }
                openInApp(paths, 'doc');
            }
            else if ($this.hasClass('cp-app-drive-context-openinpresentation')) {
                if (paths.length !== 1) { return; }
                openInApp(paths, 'presentation');
            }
            else if ($this.hasClass('cp-app-drive-context-expandall') ||
                     $this.hasClass('cp-app-drive-context-collapseall')) {
                if (paths.length !== 1) { return; }
                var opened = $this.hasClass('cp-app-drive-context-expandall');
                var openRecursive = function (path) {
                    LS.setFolderOpened(path, opened);
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
                        var sfId = manager.isInSharedFolder(path.path);
                        downloadFolder(folderEl, name, sfId);
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
                var parsed;
                var friends = common.getFriends();
                var anonDrive = manager.isPathIn(currentPath, [FILES_DATA]) && !APP.loggedIn;

                if (manager.isFolder(el) && !manager.isSharedFolder(el) && !anonDrive) { // Folder
                    // disconnected
                    if (!APP.editable) {
                        return void UI.warn(Messages.error);
                    }
                    // if folder is inside SF
                    else if (manager.isInSharedFolder(paths[0].path)) {
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
                            h('label', {for: 'cp-upload-password'}, Messages.fm_shareFolderPassword),
                            UI.passwordInput({
                                id: 'cp-upload-password',
                                placeholder: Messages.creation_passwordValue
                            }),
                            h('span', {
                                style: 'display:flex;align-items:center;justify-content:space-between'
                            }, [
                                UI.createCheckbox('cp-upload-owned', Messages.sharedFolders_create_owned, true),
                                UI.createHelper(Pages.localizeDocsLink('https://docs.cryptpad.org/en/user_guide/share_and_access.html#owners'), Messages.creation_owned1)
                            ]),
                        ]);
                        return void UI.confirm(convertContent, function(res) {
                            if (!res) { return; }
                            var password = $(convertContent).find('#cp-upload-password').val() || undefined;
                            var owned = Util.isChecked($(convertContent).find('#cp-upload-owned'));
                            manager.convertFolderToSharedFolder(paths[0].path, owned, password, function (err, obj) {
                                if (err || obj && obj.error) { return void console.error(err || obj.error); }
                                if (obj && obj.fId) { APP.convertedFolder = obj.fId; }
                                refresh();
                            });
                        });
                    }
                } else { // File or shared folder
                    var sf = !anonDrive && manager.isSharedFolder(el);
                    if (anonDrive) {
                        data = el;
                    } else {
                        data = sf ? manager.getSharedFolderData(el) : manager.getFileData(el);
                    }
                    parsed = (data.href && data.href.indexOf('#') !== -1) ? Hash.parsePadUrl(data.href) : {};

                    // Form: get auditor hash
                    var auditorHash;
                    if (parsed.hash && parsed.type === "form") {
                        var formData = Hash.getFormData(null, parsed.hash, data.password);
                        console.log(formData);
                        if (formData) {
                            auditorHash = formData.form_auditorHash;
                        }
                    }

                    var roParsed = Hash.parsePadUrl(data.roHref);
                    var padType = parsed.type || roParsed.type;
                    var ro = !sf || (folders[el] && folders[el].version >= 2);
                    var padData = {
                        teamId: APP.team,
                        origin: APP.origin,
                        pathname: "/" + padType + "/",
                        friends: friends,
                        password: data.password,
                        hashes: {
                            editHash: parsed.hash,
                            viewHash: ro && roParsed.hash,
                            fileHash: parsed.hash
                        },
                        auditorHash: auditorHash,
                        fileData: {
                            hash: parsed.hash,
                            password: data.password
                        },
                        isTemplate: paths[0].path[0] === 'template',
                        title: data.title || data.name,
                        sharedFolder: sf,
                        static: data.static ? data.href : undefined,
                        common: common
                    };
                    if (padType === 'file') {
                        return void Share.getFileShareModal(common, padData, function (err) {
                            if (err) { UI.warn(Messages.error); }
                        });
                    }
                    Share.getShareModal(common, padData, function (err) {
                        if (err) { UI.warn(Messages.error); }
                    });
                }
            }
            else if ($this.hasClass('cp-app-drive-context-savelocal')) {
                if (paths.length !== 1) { return; }
                el = manager.find(paths[0].path);
                if (manager.isFile(el)) {
                    data = manager.getFileData(el);
                } else if (manager.isSharedFolder(el)) {
                    data = manager.getSharedFolderData(el);
                }
                if (!data) { return; }
                if (data.static) {
                    sframeChan.query("Q_DRIVE_USEROBJECT", {
                        cmd: "addLink",
                        teamId: -1,
                        data: {
                            name: data.name,
                            href: data.href,
                            path: ['root']
                        }
                    }, function () {
                        UI.log(Messages.saved);
                    });
                    return;
                }
                sframeChan.query('Q_STORE_IN_TEAM', {
                    href: data.href || data.rohref,
                    password: data.password,
                    path: paths[0].path[0] === 'template' ? ['template'] : undefined,
                    title: data.title || '',
                    teamId: -1
                }, function (err) {
                    if (err) { return void console.error(err); }
                });
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
                if (ntype === 'link') {
                    return void showLinkModal();
                }
                var path2 = manager.isPathIn(currentPath, [TRASH]) ? '' : currentPath;
                openIn(ntype, path2, APP.team);
            }
            else if ($this.hasClass("cp-app-drive-context-properties")) {
                if (type === 'trash') {
                    var pPath = paths[0].path;
                    if (paths.length !== 1 || pPath.length !== 4) { return; }
                    var element = manager.find(pPath.slice(0,3)); // element containing the oldpath
                    var sPath = stringifyPath(element.path);
                    return void UI.alert(h('span', [
                        h('strong', Messages.fm_originalPath),
                        h('br'),
                        sPath,
                    ]));
                }
                if (paths.length !== 1) { return; }
                el = manager.find(paths[0].path);
                if (paths[0].path[0] === SHARED_FOLDER && APP.newSharedFolder) {
                    // ANON_SHARED_FOLDER
                    el = manager.find(paths[0].path.slice(1), APP.newSharedFolder);
                }
                APP.getProperties(el, function (e) {
                    if (e) {
                        UI.warn(Messages.error);
                        return void logError(e, el);
                    }
                });
            }
            else if ($this.hasClass("cp-app-drive-context-access")) {
                if (paths.length !== 1) { return; }
                el = manager.find(paths[0].path);
                if (paths[0].path[0] === SHARED_FOLDER && APP.newSharedFolder) {
                    // ANON_SHARED_FOLDER
                    el = manager.find(paths[0].path.slice(1), APP.newSharedFolder);
                }
                APP.getAccess(el, function (e) {
                    if (e) {
                        UI.warn(Messages.error);
                        return void logError(e);
                    }
                });
            }
            else if ($this.hasClass("cp-app-drive-context-hashtag")) {
                var hrefs = paths.map(function (p) {
                    var el = manager.find(p.path);
                    var data =  manager.getFileData(el);
                    return data.href || data.roHref;
                }).filter(Boolean);
                common.updateTags(hrefs);
            }
            else if ($this.hasClass("cp-app-drive-context-empty")) {
                if (paths.length !== 1 || !paths[0].element
                    || !manager.comparePath(paths[0].path, [TRASH])) {
                    log(Messages.fm_forbidden);
                    return;
                }
                emptyTrashModal();
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
                    } else if (manager.isSharedFolder(rEl)) {
                        var sfData = manager.getSharedFolderData(rEl);
                        restoreName = sfData.title || sfData.lastTitle || Messages.fm_deletedFolder;
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
        }); };

        addContextEvent();
        metadataMgr.onChange(function () {
            var priv = metadataMgr.getPrivateData();
            if (priv.plan !== APP.premiumPlan) {
                $contextMenu.remove();
                $contextMenu = createContextMenu(common).appendTo($appContainer);
                if (!APP.loggedIn) {
                    $contextMenu.find('.cp-app-drive-context-delete').attr('data-icon', faDelete)
                        .html($contextMenu.find('.cp-app-drive-context-remove').html());
                }
                addContextEvent();
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

                // If we are in the trash or anon USER or if we are holding the "shift" key,
                // delete permanently
                // Or if we are in a shared folder
                // Or if the selection is only shared folders
                if (!APP.loggedIn || isTrash || manager.isInSharedFolder(currentPath)
                        || e.shiftKey) {
                    deletePaths(null, paths);
                    return;
                }
                // else move to trash
                moveElements(paths, [TRASH], false, refresh);
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

        var onEvDriveChange = sframeChan.on('EV_DRIVE_CHANGE', function (data) {
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
        var onEvDriveRemove = sframeChan.on('EV_DRIVE_REMOVE', function (data) {
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

        $(window).on('mouseup', onWindowMouseUp);
        $(window).on('keydown', onWindowKeydown);
        $(window).on('click', onWindowClick);

        var removeWindowListeners = function () {
            $(window).off('mouseup', onWindowMouseUp);
            $(window).off('keydown', onWindowKeydown);
            $(window).off('click', onWindowClick);
            try {
                onEvDriveChange.stop();
                onEvDriveRemove.stop();
            } catch (e) {}
        };


        if (APP.histConfig) {
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
                    if (!obj || typeof(obj) !== "object" || Object.keys(obj).length === 0) {
                        return;
                    }
                    manager.setHistoryMode(true);
                    copyObjectValue(folders[history.sfId], obj);
                    refresh();
                    return;
                }

                history.sfId = false;

                var ok = manager.isValidDrive(obj.drive);
                if (!ok) { return; }
                manager.setHistoryMode(true);

                var restricted  = files.restrictedFolders;
                copyObjectValue(files, obj.drive);
                files.restrictedFolders = restricted;

                appStatus.isReady = true;
                refresh();
            };
            history.onLeaveHistory = function () {
                manager.setHistoryMode(false);
                copyObjectValue(files, proxy.drive);
                refresh();
            };
        }

        var fmConfig = {
            teamId: APP.team,
            noHandlers: true,
            onUploaded: function () {
                refresh();
            },
            body: $('body')
        };
        APP.FM = common.createFileManager(fmConfig);

        refresh(function () {
            UI.removeLoadingScreen();
        });

        /*
        if (!APP.team) {
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
        }
        */
        APP.passwordModal = function (fId, data, cb) {
            var content = [];

            var legacy = data.legacy; // Legacy mode: we don't know if the sf has been destroyed or its password has changed
            var folderName = '<b>'+ (Util.fixHTML(data.lastTitle) || Messages.fm_newFolder) +'</b>';
            var pwMsg = legacy ? Messages._getKey('drive_sfPassword', [folderName]) : Messages._getKey('dph_sf_pw', [folderName]);
            content.push(UI.setHTML(h('p'), pwMsg));
            var newPassword = UI.passwordInput({
                id: 'cp-app-prop-change-password',
                placeholder: Messages.settings_changePasswordNew,
                style: 'flex: 1;'
            });
            var passwordOk = h('button.btn.btn-secondary', Messages.properties_changePasswordButton);
            var changePass = h('span.cp-password-container', [
                newPassword,
                passwordOk
            ]);
            content.push(changePass);
            var div = h('div', content);

            var locked = false;
            $(passwordOk).click(function () {
                if (locked) { return; }
                var pw = $(newPassword).find('.cp-password-input').val();
                locked = true;
                $(div).find('.alert').remove();
                $(passwordOk).html('').append(h('span.fa.fa-spinner.fa-spin', {style: 'margin-left: 0'}));
                manager.restoreSharedFolder(fId, pw, function (err, obj) {
                    if (obj && obj.error) {
                        var wrong = h('div.alert.alert-danger', Messages.drive_sfPasswordError);
                        $(div).prepend(wrong);
                        $(passwordOk).text(Messages.properties_changePasswordButton);
                        locked = false;
                        return;
                    }
                    UI.findCancelButton($(div).closest('.alertify')).click();
                    cb();
                });
            });
            var buttons = [{
                className: 'primary',
                name: Messages.forgetButton,
                onClick: function () {
                    manager.delete([['sharedFoldersTemp', fId]], function () { });
                },
                keys: []
            }, {
                className: 'cancel',
                name: Messages.later,
                onClick: function () {},
                keys: [27]
            }];
            return UI.dialog.customModal(div, {
                buttons: buttons,
                onClose: cb
            });
        };
        onConnectEvt.reg(refreshDeprecated);

        return {
            refresh: refresh,
            close: function () {
                APP.closed = true;
                removeWindowListeners();
            }
        };
    };

    return {
        create: create,
        setEditable: setEditable,
        logError: logError
    };
});

