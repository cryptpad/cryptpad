define([
    'jquery',
    '/common/toolbar.js',
    '/common/drive-ui.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/common-feedback.js',
    '/common/common-constants.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/proxy-manager.js',
    '/common/userObject.js',
    '/common/inner/common-mediatag.js',
    '/common/hyperscript.js',
    '/customize/application_config.js',
    '/common/messenger-ui.js',
    '/common/inner/invitation.js',
    '/customize/messages.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/teams/app-team.less',
], function (
    $,
    Toolbar,
    DriveUI,
    Util,
    Hash,
    UI,
    UIElements,
    Feedback,
    Constants,
    nThen,
    SFCommon,
    ProxyManager,
    UserObject,
    MT,
    h,
    AppConfig,
    MessengerUI,
    InviteInner,
    Messages)
{
    var APP = {};
    var driveAPP = {};
    //var SHARED_FOLDER_NAME = Messages.fm_sharedFolderName;

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
                var sfData = drive.sharedFolders[fId] || {};
                var href = UserObject.getHref(sfData, APP.cryptor);
                var parsed = Hash.parsePadUrl(href);
                var secret = Hash.getSecrets('drive', parsed.hash, sfData.password);
                sframeChan.query('Q_DRIVE_GETOBJECT', {
                    sharedFolder: fId
                }, waitFor(function (err, newObj) {
                    if (newObj && newObj.deprecated) {
                        delete folders[fId];
                        delete drive.sharedFolders[fId];
                        if (manager && manager.folders) {
                            delete manager.folders[fId];
                        }
                        return;
                    }
                    folders[fId] = folders[fId] || {};
                    copyObjectValue(folders[fId], newObj);
                    folders[fId].readOnly = !secret.keys.secondaryKey;
                    if (manager && oldIds.indexOf(fId) === -1) {
                        manager.addProxy(fId, { proxy: folders[fId] }, null, secret.keys.secondaryKey);
                    }
                    var readOnly = !secret.keys.editKeyStr;
                    if (!manager || !manager.folders[fId]) { return; }
                    manager.folders[fId].userObject.setReadOnly(readOnly, secret.keys.secondaryKey);
                }));
            });
            // Remove from memory folders that have been deleted from the drive remotely
            oldIds.forEach(function (fId) {
                if (!drive.sharedFolders[fId]) {
                    delete folders[fId];
                    delete drive.sharedFolders[fId];
                    if (manager && manager.folders) {
                        delete manager.folders[fId];
                    }
                }
            });
        }).nThen(function () {
            cb();
        });
    };
    var updateObject = function (sframeChan, obj, cb) {
        sframeChan.query('Q_DRIVE_GETOBJECT', null, function (err, newObj) {
            copyObjectValue(obj, newObj);
            cb();
        });
    };

    var setEditable = DriveUI.setEditable;

    var closeTeam = function (common, cb) {
        var sframeChan = common.getSframeChannel();
        APP.module.execCommand('SUBSCRIBE', null, function () {
            sframeChan.query('Q_SET_TEAM', null, function (err) {
                if (err) { return void console.error(err); }
                if (APP.drive && APP.drive.close) { APP.drive.close(); }
                $('.cp-toolbar-title-value').text(Messages.type.teams);
                sframeChan.event('EV_SET_TAB_TITLE', Messages.type.teams);
                APP.team = null;
                APP.teamEdPublic = null;
                APP.drive = null;
                APP.cryptor = null;
                APP.buildUI(common);
                if (APP.usageBar) {
                    APP.usageBar.stop();
                    APP.usageBar = null;
                }
                if (cb) {
                    cb(common);
                }
            });
        });
    };

    var mainCategories = {
        'list': [
            'cp-team-list',
        ],
        'create': [
            'cp-team-create',
        ],
        'general': [
            'cp-team-info',
        ],
        'link': [
            'cp-team-link',
        ],
    };
    var teamCategories = {
        'back': {
            onClick: function (common) {
                closeTeam(common);
            }
        },
        'drive': [
            'cp-team-drive'
        ],
        'members': [
            'cp-team-roster'
        ],
        'chat': [
            'cp-team-chat'
        ],
        'admin': [
            'cp-team-edpublic',
            'cp-team-name',
            'cp-team-avatar',
            'cp-team-delete',
        ],
    };

    var create = {};

    // Sidebar layout

    var hideCategories = function () {
        APP.$rightside.find('> div').hide();
    };
    var showCategories = function (cat) {
        hideCategories();
        cat.forEach(function (c) {
            APP.$rightside.find('.'+c).show();
        });
    };
    var createLeftSide = APP.createLeftSide = function (common, team, teamAdmin) {
        APP.$leftside.empty();
        var $categories = $('<div>', {'class': 'cp-sidebarlayout-categories'})
                            .appendTo(APP.$leftside);

        var hash = common.getMetadataMgr().getPrivateData().teamInviteHash && mainCategories.link;

        var categories = team ? teamCategories : mainCategories;
        var active = team ? 'drive' : (hash ? 'link' : 'list');

        if (team && APP.team) {
            var $category = $('<div>', {'class': 'cp-sidebarlayout-category cp-team-cat-header'}).appendTo($categories);
            var avatar = h('div.cp-avatar');
            var $avatar = $(avatar);
            APP.module.execCommand('GET_TEAM_METADATA', {
                teamId: APP.team
            }, function (obj) {
                if (obj && obj.error) {
                    return void UI.warn(Messages.error);
                }
                common.displayAvatar($avatar, obj.avatar, obj.name);
                $category.append($avatar);
                $avatar.append(h('span.cp-sidebarlayout-category-name', obj.name));
            });
        }

        Object.keys(categories).forEach(function (key) {
            if (key === 'admin' && !teamAdmin) { return; }

            var $category = $('<div>', {'class': 'cp-sidebarlayout-category cp-team-cat-'+key}).appendTo($categories);
            if (key === 'general') { $category.append($('<span>', {'class': 'fa fa-info-circle'})); }
            if (key === 'list') { $category.append($('<span>', {'class': 'fa fa-list cp-team-cat-list'})); }
            if (key === 'create') { $category.append($('<span>', {'class': 'fa fa-plus-circle'})); }
            if (key === 'back') { $category.append($('<span>', {'class': 'fa fa-arrow-left'})); }
            if (key === 'members') { $category.append($('<span>', {'class': 'fa fa-users'})); }
            if (key === 'chat') { $category.append($('<span>', {'class': 'fa fa-comments'})); }
            if (key === 'drive') { $category.append($('<span>', {'class': 'fa fa-hdd-o'})); }
            if (key === 'admin') { $category.append($('<span>', {'class': 'fa fa-cogs'})); }
            if (key === 'link') { $category.append($('<span>', {'class': 'fa fa-envelope'})); }

            if (key === active) {
                $category.addClass('cp-leftside-active');
            }

            $category.click(function () {
                if (!Array.isArray(categories[key]) && categories[key].onClick) {
                    categories[key].onClick(common);
                    return;
                }
                if (active === key) { return; }
                active = key;
                if (key === 'drive' || key === 'chat') {
                    APP.$rightside.addClass('cp-rightside-drive');
                    APP.$leftside.addClass('cp-leftside-narrow');
                } else {
                    APP.$rightside.removeClass('cp-rightside-drive');
                    APP.$leftside.removeClass('cp-leftside-narrow');
                }
                if (key === 'chat') {
                    $category.find('.cp-team-chat-notification').removeClass('cp-team-chat-notification');
                }

                $categories.find('.cp-leftside-active').removeClass('cp-leftside-active');
                $category.addClass('cp-leftside-active');
                showCategories(categories[key]);
            });

            $category.append(h('span.cp-sidebarlayout-category-name', Messages['team_cat_'+key] || key));
        });
        if (active === 'drive') {
            APP.$rightside.addClass('cp-rightside-drive');
            APP.$leftside.on('mouseover', function() {
                APP.$leftside.addClass('cp-leftside-narrow');
                APP.$leftside.off('mouseover');
            });
        } else {
            APP.$rightside.removeClass('cp-rightside-drive');
            APP.$leftside.removeClass('cp-leftside-narrow');
        }
        showCategories(categories[active]);
    };

    var buildUI = APP.buildUI = function (common, team, teamAdmin) {
        var $rightside = APP.$rightside;
        $rightside.empty();
        var addItem = function (cssClass) {
            var item = cssClass.slice(8);
            if (typeof (create[item]) === "function") {
                $rightside.append(create[item](common));
            }
        };
        var categories = team ? teamCategories : mainCategories;
        for (var cat in categories) {
            if (!Array.isArray(categories[cat])) { continue; }
            categories[cat].forEach(addItem);
        }

        createLeftSide(common, team, teamAdmin);
    };

    // Team APP

    var loadTeam = function (common, id) {
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        var sframeChan = common.getSframeChannel();
        var proxy = {};
        var folders = {};
        nThen(function (waitFor) {
            updateObject(sframeChan, proxy, waitFor(function () {
                updateSharedFolders(sframeChan, null, proxy.drive, folders, waitFor());
            }));
        }).nThen(function () {
            if (!proxy.drive || typeof(proxy.drive) !== 'object') {
                throw new Error("Corrupted drive");
            }
            driveAPP.team = id;

            // Provide secondaryKey
            var teamData = (privateData.teams || {})[id] || {};
            driveAPP.readOnly = !teamData.hasSecondaryKey;

            if (APP.usageBar) { APP.usageBar.stop(); }
            APP.usageBar = undefined;
            if (!driveAPP.readOnly) {
                APP.usageBar = common.createUsageBar(APP.team, function (err, $limitContainer) {
                    if (err) { return void DriveUI.logError(err); }
                    $limitContainer.attr('title', Messages.team_quota);
                }, true);
            }

            var drive = DriveUI.create(common, {
                proxy: proxy,
                folders: folders,
                updateObject: updateObject,
                updateSharedFolders: updateSharedFolders,

                $limit: APP.usageBar && APP.usageBar.$container,
                toolbar: APP.toolbar,
                APP: driveAPP,
                edPublic: APP.teamEdPublic,
                editKey: teamData.secondaryKey
            });
            APP.drive = drive;
            driveAPP.refresh = drive.refresh;
        });
    };

    var loadMain = function (common) {
        buildUI(common);
        UI.removeLoadingScreen();
    };


    // Rightside elements

    var makeBlock = function (key, getter, full) {
        var safeKey = key.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });

        create[key] = function (common) {
            var $div = $('<div>', {'class': 'cp-team-' + key + ' cp-sidebarlayout-element'});
            if (full) {
                $('<label>').text(Messages['team_'+safeKey+'Title'] || key).appendTo($div);
                $('<span>', {'class': 'cp-sidebarlayout-description'})
                    .text(Messages['team_'+safeKey+'Hint'] || 'Coming soon...').appendTo($div);
            }
            getter(common, function (content) {
                $div.append(content);
            }, $div);
            return $div;
        };
    };

    makeBlock('info', function (common, cb) {
        cb([
            h('h3', Messages.team_infoLabel),
            h('p', Messages.team_infoContent)
        ]);
    });

    var MAX_TEAMS_SLOTS = Constants.MAX_TEAMS_SLOTS;
    var openTeam = function (common, id, team) {
        var sframeChan = common.getSframeChannel();
        APP.module.execCommand('SUBSCRIBE', id, function () {
            var t = Messages._getKey('team_title', [Util.fixHTML(team.metadata.name)]);
            sframeChan.query('Q_SET_TEAM', id, function (err) {
                if (err) { return void console.error(err); }
                // Change title
                $('.cp-toolbar-title-value').text(t);
                sframeChan.event('EV_SET_TAB_TITLE', t);
                // Get secondary key
                var secret = Hash.getSecrets('team', team.hash || team.roHash, team.password);
                APP.cryptor = UserObject.createCryptor(secret.keys.secondaryKey);
                // Load data
                APP.team = id;
                APP.teamEdPublic = Util.find(team, ['keys', 'drive', 'edPublic']);
                buildUI(common, true, team.owner);
            });
        });
    };
    var refreshList = function (common, cb) {
        var content = [];
        APP.module.execCommand('LIST_TEAMS', null, function (obj) {
            if (!obj) { return; }
            if (obj.error === "OFFLINE") { return UI.alert(Messages.driveOfflineError); }
            if (obj.error) { return void console.error(obj.error); }
            var list = [];
            var keys = Object.keys(obj).slice(0,3);
            var slots = '('+Math.min(keys.length, MAX_TEAMS_SLOTS)+'/'+MAX_TEAMS_SLOTS+')';
            for (var i = keys.length; i < MAX_TEAMS_SLOTS; i++) {
                obj[i] = {
                    empty: true
                };
                keys.push(i);
            }

            content.push(h('h3', Messages.team_listTitle + ' ' + slots));

            keys.forEach(function (id) {
                var team = obj[id];
                if (team.empty) {
                    list.push(h('div.cp-team-list-team.empty', [
                        h('span.cp-team-list-name.empty', Messages.team_listSlot)
                    ]));
                    return;
                }
                var btn;
                var avatar = h('span.cp-avatar');
                list.push(h('div.cp-team-list-team', [
                    h('span.cp-team-list-avatar', avatar),
                    h('span.cp-team-list-name', {
                        title: team.metadata.name
                    }, team.metadata.name),
                    btn = h('button.cp-team-list-open.btn.btn-primary', Messages.team_listLoad)
                ]));
                common.displayAvatar($(avatar), team.metadata.avatar, team.metadata.name);
                $(btn).click(function () {
                    openTeam(common, id, team);
                });
            });
            content.push(h('div.cp-team-list-container', list));
            cb(content);
        });
        return content;
    };
    makeBlock('list', function (common, cb) {
        refreshList(common, cb);
    });

    var refreshLink = function () {}; // placeholder
    var refreshCreate = function (common, cb) {
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        var content = [];

        var isOwner = Object.keys(privateData.teams || {}).filter(function (id) {
            return privateData.teams[id].owner;
        }).length >= Constants.MAX_TEAMS_OWNED && !privateData.devMode;

        var getWarningBox = function () {
            return h('div.alert.alert-warning', {
                role:'alert'
            }, isOwner ? Messages.team_maxOwner : Messages._getKey('team_maxTeams', [MAX_TEAMS_SLOTS]));
        };

        if (Object.keys(privateData.teams || {}).length >= Constants.MAX_TEAMS_SLOTS || isOwner) {
            content.push(getWarningBox());
            return void cb(content);
        }

        content.push(h('h3', Messages.team_createLabel));
        content.push(h('label', Messages.team_createName));
        var input = h('input', {type:'text'});
        content.push(input);
        var button = h('button.btn.btn-success', Messages.creation_create);
        content.push(h('br'));
        content.push(h('br'));
        content.push(button);
        var $spinner = $('<span>', {'class': 'fa fa-spinner fa-pulse'}).hide();
        content.push($spinner[0]);
        var state = false;
        $(button).click(function () {
            if (state) { return; }
            var name = $(input).val();
            if (!name.trim()) { return; }
            state = true;
            $spinner.show();
            APP.module.execCommand('CREATE_TEAM', {
                name: name
            }, function (obj) {
                if (obj && obj.error) {
                    if (obj.error === "OFFLINE") { return UI.alert(Messages.driveOfflineError); }
                    console.error(obj.error);
                    $spinner.hide();
                    return void UI.warn(Messages.error);
                }
                // Redraw the create block
                var $createDiv = $('div.cp-team-create').empty();
                isOwner = true;
                $createDiv.append(getWarningBox());
                // Redraw the teams list
                var $div = $('div.cp-team-list').empty();
                refreshList(common, function (content) {
                    state = false;
                    $div.append(content);
                    $spinner.hide();
                    $('div.cp-team-cat-list').click();
                });
                var $divLink = $('div.cp-team-link').empty();
                if ($divLink.length) {
                    refreshLink(common, function (content) {
                        $divLink.append(content);
                    });
                }
            });
        });
        cb(content);
    };
    makeBlock('create', function (common, cb) {
        refreshCreate(common, cb);
    });

    makeBlock('drive', function (common, cb, $div) {
        $('div.cp-team-drive').empty();
        $div.removeClass('cp-sidebarlayout-element'); // Don't apply buttons and input styles from sidebarlayout
        var content = [
            h('div.cp-app-drive-container', {tabindex:0}, [
                h('div#cp-app-drive-tree'),
                h('div#cp-app-drive-content-container', [
                    h('div#cp-app-drive-connection-state', {style: "display: none;"}, Messages.disconnected),
                    h('div#cp-app-drive-content', {tabindex:2})
                ])
            ])
        ];
        UI.addLoadingScreen();
        cb(content);
        loadTeam(common, APP.team, false);
    });

    var redrawRoster = function (common, _$roster) {
        var $roster = _$roster || $('#cp-team-roster-container');
        if (!$roster.length) { return; }
        APP.module.execCommand('GET_TEAM_ROSTER', {
            teamId: APP.team
        }, function (obj) {
            if (obj && obj.error) {
                return void UI.warn(Messages.error);
            }
            var roster = APP.refreshRoster(common, obj);
            $roster.empty().append(roster);
        });
    };

    var makePermissions = function () {
        var modal= UI.createModal({
            id: 'cp-teams-roster-dialog',
        });
        modal.show();
        var $blockContainer = modal.$modal;

        var makeRow = function (arr, first) {
            return arr.map(function (val) {
                return h(first ? 'th' : 'td', val);
            });
        };
        // Global rights
        var rows = [];
        var firstRow = [Messages.teams_table_role, Messages.share_linkView, Messages.share_linkEdit,
                            Messages.teams_table_admins, Messages.teams_table_owners];
        rows.push(h('tr', makeRow(firstRow, true)));
        rows.push(h('tr', makeRow([
            Messages.team_viewers, h('span.fa.fa-check'), h('span.fa.fa-times'), h('span.fa.fa-times'), h('span.fa.fa-times')
        ])));
        rows.push(h('tr', makeRow([
            Messages.team_members, h('span.fa.fa-check'), h('span.fa.fa-check'), h('span.fa.fa-times'), h('span.fa.fa-times')
        ])));
        rows.push(h('tr', makeRow([
            Messages.team_admins, h('span.fa.fa-check'), h('span.fa.fa-check'), h('span.fa.fa-check'), h('span.fa.fa-times')
        ])));
        rows.push(h('tr', makeRow([
            Messages.team_owner, h('span.fa.fa-check'), h('span.fa.fa-check'), h('span.fa.fa-check'), h('span.fa.fa-check')
        ])));
        var t = h('table.cp-teams-generic', rows);

        var content = [
            h('h4', Messages.teams_table_generic),
            h('p', [
                Messages.teams_table_generic_view,
                h('br'),
                Messages.teams_table_generic_edit,
                h('br'),
                Messages.teams_table_generic_admin,
                h('br'),
                Messages.teams_table_generic_own,
                h('br')
            ]),
            t
        ];

        APP.module.execCommand('GET_EDITABLE_FOLDERS', {
            teamId: APP.team
        }, function (arr) {
            if (!Array.isArray(arr) || !arr.length) {
                return void $blockContainer.find('.cp-modal').append(content);
            }
            content.push(h('h5', Messages.teams_table_specific));
            content.push(h('p', Messages.teams_table_specificHint));
            var paths = arr.map(function (obj) {
                obj.path.push(obj.name);
                return h('li', obj.path.join('/'));
            });
            content.push(h('ul', paths));
            /*
            var rows = [];
            rows.push(h('tr', makeRow(firstRow, true)));
            rows.push(h('tr', makeRow([Messages.team_viewers, , , '', ''])));
            content.push(h('table', rows));
            */
            $blockContainer.find('.cp-modal').append(content);
        });
    };

    var ROLES = ['VIEWER', 'MEMBER', 'ADMIN', 'OWNER'];
    var describeUser = function (common, curvePublic, data, icon) {
        APP.module.execCommand('DESCRIBE_USER', {
            teamId: APP.team,
            curvePublic: curvePublic,
            data: data
        }, function (obj) {
            if (obj && obj.error) {
                $(icon).show();
                return void UI.alert(Messages.error);
            }
            redrawRoster(common);
        });
    };
    var makeMember = function (common, data, me, roster) {
        if (!data.curvePublic) { return; }

        var otherOwners = Object.keys(roster || {}).some(function (key) {
            var user = roster[key];
            return user.role === "OWNER" && user.curvePublic !== me.curvePublic && !user.pendingOwner;
        });

        // Avatar
        var avatar = h('span.cp-avatar.cp-team-member-avatar');
        common.displayAvatar($(avatar), data.avatar, data.displayName);
        // Name
        var name = h('span.cp-team-member-name', data.displayName);
        if (data.pendingOwner) {
            $(name).append(h('em', {
                title: Messages.team_pendingOwnerTitle
            }, ' ' + Messages.team_pendingOwner));
        }
        // Status
        var status = h('span.cp-team-member-status'+(data.online ? '.online' : ''));
        // Actions
        var actions = h('span.cp-team-member-actions');
        var $actions = $(actions);
        var isMe = me && me.curvePublic === data.curvePublic;
        var myRole = me ? (ROLES.indexOf(me.role) || 1) : -1;
        var theirRole = ROLES.indexOf(data.role);
        var ADMIN = ROLES.indexOf('ADMIN');
        // If they're an admin and I am an owner, I can promote them to owner
        if (!isMe && myRole > theirRole && theirRole === ADMIN && !data.pending) {
            var promoteOwner = h('span.fa.fa-angle-double-up', {
                title: Messages.team_rosterPromoteOwner
            });
            $(promoteOwner).click(function () {
                UI.confirm(Messages.team_ownerConfirm, function (yes) {
                    if (!yes) { return; }
                    $(promoteOwner).hide();
                    APP.module.execCommand('OFFER_OWNERSHIP', {
                        teamId: APP.team,
                        curvePublic: data.curvePublic
                    }, function (obj) {
                        if (obj && obj.error) {
                            console.error(obj.error);
                            return void UI.warn(Messages.error);
                        }
                        UI.log(Messages.sent);
                    });
                });
            });
            $actions.append(promoteOwner);
        }
        // If they're a viewer/member and I have a higher role than them, I can promote them to admin
        if (!isMe && myRole >= ADMIN && theirRole < ADMIN && !data.pending) {
            var promote = h('span.fa.fa-angle-double-up', {
                title: Messages.team_rosterPromote
            });
            $(promote).click(function () {
                $(promote).hide();
                describeUser(common, data.curvePublic, {
                    role: ROLES[theirRole + 1]
                }, promote);
            });
            $actions.append(promote);
        }
        // If I'm not a member and I have an equal or higher role than them, I can demote them
        // (if they're not already a MEMBER)
        if (myRole >= theirRole && myRole >= ADMIN && theirRole > 0 && !data.pending) {
            var demote = h('span.fa.fa-angle-double-down', {
                title: Messages.team_rosterDemote
            });
            $(demote).click(function () {
                var todo = function () {
                    var role = ROLES[theirRole - 1] || 'VIEWER';
                    $(demote).hide();
                    describeUser(common, data.curvePublic, {
                        role: role
                    }, promote);
                };
                if (isMe) {
                    return void UI.confirm(Messages.team_demoteMeConfirm, function (yes) {
                        if (!yes) { return; }
                        todo();
                    });
                }
                todo();
            });
            if (!(isMe && myRole === 3 && !otherOwners)) {
                $actions.append(demote);
            }
        }
        // If I'm at least an admin and I have an equal or higher role than them, I can remove them
        // Note: we can't remove owners, we have to demote them first
        if (!isMe && myRole >= ADMIN && myRole >= theirRole && theirRole !== ROLES.indexOf('OWNER')) {
            var remove = h('span.fa.fa-times', {
                title: Messages.team_rosterKick
            });
            $(remove).click(function () {
                $(remove).hide();
                UI.confirm(Messages._getKey('team_kickConfirm', [Util.fixHTML(data.displayName)]), function (yes) {
                    if (!yes) { return; }
                    APP.module.execCommand('REMOVE_USER', {
                        pending: data.pending,
                        teamId: APP.team,
                        curvePublic: data.curvePublic,
                    }, function (obj) {
                        if (obj && obj.error) {
                            $(remove).show();
                            return void UI.alert(Messages.error);
                        }
                        redrawRoster(common);
                    });
                });
            });
            $actions.append(remove);
        }

        // User
        var content = [
            avatar,
            name,
            actions,
            status,
        ];
        var div = h('div.cp-team-roster-member', content);
        if (data.profile) {
            $(div).dblclick(function (e) {
                e.preventDefault();
                e.stopPropagation();
                common.openURL('/profile/#' + data.profile);
            });
        }
        return div;
    };
    APP.refreshRoster = function (common, roster) {
        if (!roster || typeof(roster) !== "object" || Object.keys(roster) === 0) { return; }
        var metadataMgr = common.getMetadataMgr();
        var userData = metadataMgr.getUserData();
        var me = roster[userData.curvePublic] || {};
        var owner = Object.keys(roster).filter(function (k) {
            if (roster[k].pending) { return; }
            roster[k].curvePublic = k;
            return roster[k].role === "OWNER" || roster[k].pendingOwner;
        }).map(function (k) {
            return makeMember(common, roster[k], me, roster);
        });
        var admins = Object.keys(roster).filter(function (k) {
            if (roster[k].pending) { return; }
            roster[k].curvePublic = k;
            return roster[k].role === "ADMIN";
        }).map(function (k) {
            return makeMember(common, roster[k], me);
        });
        var members = Object.keys(roster).filter(function (k) {
            if (roster[k].pending) { return; }
            roster[k].curvePublic = k;
            return roster[k].role === "MEMBER" || !roster[k].role;
        }).map(function (k) {
            return makeMember(common, roster[k], me);
        });
        var viewers = Object.keys(roster).filter(function (k) {
            if (roster[k].pending) { return; }
            roster[k].curvePublic = k;
            return roster[k].role === "VIEWER";
        }).map(function (k) {
            return makeMember(common, roster[k], me);
        });
        var pending = Object.keys(roster).filter(function (k) {
            if (!roster[k].pending) { return; }
            if (roster[k].inviteChannel) { return; }
            roster[k].curvePublic = k;
            return roster[k].role === "MEMBER" || roster[k].role === "VIEWER" || !roster[k].role;
        }).map(function (k) {
            return makeMember(common, roster[k], me);
        });
        var links = Object.keys(roster).filter(function (k) {
            if (!roster[k].pending) { return; }
            if (!roster[k].inviteChannel) { return; }
            roster[k].curvePublic = k;
            return roster[k].role === "VIEWER" || !roster[k].role;
        }).map(function (k) {
            return makeMember(common, roster[k], me);
        });

        var header = h('div.cp-app-team-roster-header');
        var $header = $(header);

        // If you're an admin or an owner, you can invite your friends to the team
        // TODO and acquaintances later?
        if (me && (me.role === 'ADMIN' || me.role === 'OWNER')) {
            var invite = h('button.btn.btn-primary', Messages.team_inviteButton);
            var inviteFriends = common.getFriends();
            Object.keys(inviteFriends).forEach(function (curve) {
                // Keep only friends that are not already in the team and that you can contact
                // via their mailbox
                if (roster[curve] && !roster[curve].pending) {
                    delete inviteFriends[curve];
                }
            });
            var inviteCfg = {
                teamId: APP.team,
                common: common,
                friends: inviteFriends,
                module: APP.module
            };
            $(invite).click(function () {
                UIElements.createInviteTeamModal(inviteCfg);
            });
            $header.append(invite);
        }

        if (me && (me.role !== 'OWNER')) {
            var leave = h('button.btn.btn-danger', Messages.team_leaveButton);
            $(leave).click(function () {
                UI.confirm(Messages.team_leaveConfirm, function (yes) {
                    if (!yes) { return; }
                    APP.module.execCommand('LEAVE_TEAM', {
                        teamId: APP.team
                    }, function (obj) {
                        if (obj && obj.error) {
                            return void UI.warn(Messages.error);
                        }
                    });
                });
            });
            $header.append(leave);
        }

        var table = h('button.btn.btn-primary', Messages.teams_table);
        $(table).click(function (e) {
            e.stopPropagation();
            makePermissions();
        });
        $header.append(table);

        var noPending = pending.length ? '' : '.cp-hidden';
        var noLinks = links.length ? '' : '.cp-hidden';

        return [
            header,
            h('h3', Messages.team_owner),
            h('div', owner),
            h('h3', Messages.team_admins),
            h('div', admins),
            h('h3', Messages.team_members),
            h('div', members),
            h('h3', Messages.team_viewers || 'VIEWERS'),
            h('div', viewers),
            h('h3'+noPending, Messages.team_pending),
            h('div'+noPending, pending),
            h('h3'+noLinks, Messages.team_links),
            h('div'+noLinks, links)
        ];
    };
    makeBlock('roster', function (common, cb) {
        var container = h('div#cp-team-roster-container');
        var content = [container];
        redrawRoster(common, $(container));
        cb(content);
    });

    makeBlock('chat', function (common, cb) {
        var container = h('div#cp-app-contacts-container.cp-app-contacts-inapp');
        var content = [container];
        APP.module.execCommand('OPEN_TEAM_CHAT', {
            teamId: APP.team
        }, function (obj) {
            if (obj && obj.error) {
                return void UI.alert(Messages.error);
            }
            common.setTeamChat(obj.channel);
            MessengerUI.create($(container), common, {
                chat: $('.cp-team-cat-chat'),
                team: true,
                readOnly: obj.readOnly
            });
            cb(content);
        });
    });

    makeBlock('edpublic', function (common, cb) {
        var container = h('div');
        var $div = $(container);
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        var team = privateData.teams[APP.team];
        if (!team) { return void cb(); }
        var publicKey = team.edPublic;
        var name = team.name;
        if (publicKey) {
            var $key = $('<div>', {'class': 'cp-sidebarlayout-element'}).appendTo($div);
            var userHref = Hash.getUserHrefFromKeys(privateData.origin, name, publicKey);
            var $pubLabel = $('<span>', {'class': 'label'})
                .text(Messages.settings_publicSigningKey);
            $key.append($pubLabel).append(UI.dialog.selectable(userHref));
        }
        var content = [container];
        cb(content);
    });

    makeBlock('name', function (common, cb) {
        var $inputBlock = $('<div>', {'class': 'cp-sidebarlayout-input-block'});
        var $input = $('<input>', {
            'type': 'text',
            'id': 'cp-settings-displayname',
            'placeholder': Messages.anonymous}).appendTo($inputBlock);
        var $save = $('<button>', {'class': 'btn btn-primary'}).text(Messages.settings_save).appendTo($inputBlock);

        var $ok = $('<span>', {'class': 'fa fa-check', title: Messages.saved}).hide();
        var $spinner = $('<span>', {'class': 'fa fa-spinner fa-pulse'}).hide();

        var todo = function () {
            var newName = $input.val();
            if (!newName.trim()) { return; }
            $spinner.show();
            APP.module.execCommand('GET_TEAM_METADATA', {
                teamId: APP.team
            }, function (obj) {
                if (obj && obj.error) { return void UI.warn(Messages.error); }
                obj.name = newName;
                APP.module.execCommand('SET_TEAM_METADATA', {
                    teamId: APP.team,
                    metadata: obj
                }, function () {
                    $spinner.hide();
                    $ok.show();
                });
            });
        };

        APP.module.execCommand('GET_TEAM_METADATA', {
            teamId: APP.team
        }, function (obj) {
            if (obj && obj.error) {
                return void UI.warn(Messages.error);
            }
            $input.val(obj.name);
            $input.on('keyup', function (e) {
                if ($input.val() !== obj.name) { $ok.hide(); }
                if (e.which === 13) { todo(); }
            });
            $save.click(todo);
            var content = [
                $inputBlock[0],
                $ok[0],
                $spinner[0]
            ];
            cb(content);
        });
    }, true);

    makeBlock('avatar', function (common, cb) {
        // Upload
        var avatar = h('div.cp-team-avatar.cp-avatar');
        var $avatar = $(avatar);
        var data = MT.addAvatar(common, function (ev, data) {
            if (!data.url) { return void UI.warn(Messages.error); }
            APP.module.execCommand('GET_TEAM_METADATA', {
                teamId: APP.team
            }, function (obj) {
                if (obj && obj.error) { return void UI.warn(Messages.error); }
                obj.avatar = data.url;
                APP.module.execCommand('SET_TEAM_METADATA', {
                    teamId: APP.team,
                    metadata: obj
                }, function () {
                    $avatar.empty();
                    common.displayAvatar($avatar, data.url);
                });
            });
        });
        var $upButton = common.createButton('upload', false, data);
        $upButton.text(Messages.profile_upload);
        $upButton.prepend($('<span>', {'class': 'fa fa-upload'}));

        APP.module.execCommand('GET_TEAM_METADATA', {
            teamId: APP.team
        }, function (obj) {
            if (obj && obj.error) {
                return void UI.warn(Messages.error);
            }
            var val = obj.avatar;
            if (!val) {
                var $img = $('<img>', {
                    src: '/customize/images/avatar.png',
                    title: Messages.profile_avatar,
                    alt: 'Avatar'
                });
                var mt = h('media-tag', $img[0]);
                $avatar.append(mt);
            } else {
                common.displayAvatar($avatar, val);
            }

            // Display existing + button
            var content = [
                avatar,
                h('br'),
                $upButton[0]
            ];
            cb(content);
        });
    }, true);

    makeBlock('delete', function (common, cb) {
        var deleteTeam = h('button.btn.btn-danger', Messages.team_deleteButton);
        var $ok = $('<span>', {'class': 'fa fa-check', title: Messages.saved}).hide();
        var $spinner = $('<span>', {'class': 'fa fa-spinner fa-pulse'}).hide();

        var deleting = false;
        $(deleteTeam).click(function () {
            if (deleting) { return; }
            UI.confirm(Messages.team_deleteConfirm, function (yes) {
                if (!yes) { return; }
                if (deleting) { return; }
                deleting = true;
                $spinner.show();
                APP.module.execCommand("DELETE_TEAM", {
                    teamId: APP.team
                }, function (obj) {
                    $spinner.hide();
                    deleting = false;
                    if (obj && obj.error) {
                        return void UI.warn(obj.error);
                    }
                    $ok.show();
                    UI.log(Messages.deleted);
                });
            });
        });

        cb([
            deleteTeam,
            $ok[0],
            $spinner[0]
        ]);
    }, true);

    var displayUser = function (common, data) {
        var avatar = h('span.cp-teams-invite-from-avatar.cp-avatar');
        common.displayAvatar($(avatar), data.avatar, data.displayName);
        return h('div.cp-teams-invite-from-author', [
            avatar,
            h('span.cp-teams-invite-from-name', data.displayName)
        ]);
    };

    refreshLink = function (common, cb, wrongPassword) {
        if (!mainCategories.link) { return; }
        var privateData = common.getMetadataMgr().getPrivateData();
        var hash = privateData.teamInviteHash;
        var hashData = Hash.parseTypeHash('invite', hash);
        var password = hashData.password;
        var seeds = InviteInner.deriveSeeds(hashData.key);
        var sframeChan = common.getSframeChannel();

        if (Object.keys(privateData.teams || {}).length >= Constants.MAX_TEAMS_SLOTS) {
            return void cb([
                h('div.alert.alert-danger', {
                    role: 'alert'
                }, Messages._getKey('team_maxTeams', [Constants.MAX_TEAMS_SLOTS]))
            ]);
        }

        var div = h('div', [
            h('i.fa.fa-spin.fa-spinner')
        ]);
        var $div = $(div);
        var errorBlock;
        var c = [
            h('h2', Messages.team_inviteTitle),
            errorBlock = h('div.alert.alert-danger',
                                wrongPassword ? undefined : {style: 'display: none;'},
                                wrongPassword ? Messages.drive_sfPasswordError : undefined),
            div
        ];
        // "cb" will put the content into the UI.
        // We're displaying a spinner while we're cryptgetting the preview content
        cb(c);

        var declineButton = h('button.btn.btn-danger', {
            style: 'display: none;'
        }, Messages.friendRequest_decline);
        var acceptButton = h('button.btn.btn-primary', Messages.team_inviteJoin);
        var inviteDiv = h('div', [
            h('nav', [
                declineButton,
                acceptButton
            ])
        ]);
        var $inviteDiv = $(inviteDiv);

        $(declineButton).click(function() {
            
        });

        var process = function (pw) {
            $inviteDiv.empty();
            var bytes64;


            var spinnerText;
            var $spinner;
            nThen(function (waitFor) {
                $inviteDiv.append(h('div', [
                    h('i.fa.fa-spin.fa-spinner'),
                    spinnerText = h('span', Messages.team_invitePasswordLoading || 'Scrypt...')
                ]));
                $spinner = $(spinnerText);
                setTimeout(waitFor(), 150);
            }).nThen(function (waitFor) {
                var salt = InviteInner.deriveSalt(pw, AppConfig.loginSalt);
                InviteInner.deriveBytes(seeds.scrypt, salt, waitFor(function (bytes) {
                    bytes64 = bytes;
                }));
            }).nThen(function (waitFor) {
                $spinner.text(Messages.team_inviteGetData);
                APP.module.execCommand('ACCEPT_LINK_INVITATION', {
                    bytes64: bytes64,
                    hash: hash,
                    password: pw,
                }, waitFor(function (obj) {
                    if (obj && obj.error) {
                        console.error(obj.error);
                        // Wrong password or other error...
                        waitFor.abort();
                        if (obj.error === 'INVALID_INVITE_CONTENT') {
                            // Wrong password...
                            var $divLink = $('div.cp-team-link').empty();
                            if ($divLink.length) {
                                refreshLink(common, function (content) {
                                    $divLink.append(content);
                                }, true);
                            }
                            return;
                        }
                        $(errorBlock).text(Messages.team_inviteInvalidLinkError).show();
                        $(div).empty();
                        $inviteDiv.empty();
                        return;
                    }
                    // No error: join successful!
                    sframeChan.event('EV_SET_HASH', '');
                    var $div = $('div.cp-team-list').empty();
                    refreshList(common, function (content) {
                        $div.append(content);
                        $('div.cp-team-cat-list').click();
                        var $divLink = $('div.cp-team-link').empty();
                        if ($divLink.length) {
                            $divLink.remove();
                            $('div.cp-team-cat-link').remove();
                            delete mainCategories.link;
                        }
                    });
                    var $divCreate = $('div.cp-team-create');
                    if ($divCreate.length) {
                        refreshCreate(common, function (content) {
                            $divCreate.empty().append(content);
                        });
                    }

                }));
            });
        };

        nThen(function (waitFor) {
            // Get preview content.
            sframeChan.query('Q_ANON_GET_PREVIEW_CONTENT', { seeds: seeds }, waitFor(function (err, json) {
                if (json && (json.error || !Object.keys(json).length)) {
                    $(errorBlock).text(Messages.team_inviteInvalidLinkError).show();
                    waitFor.abort();
                    $div.empty();
                    return;
                }
                $div.empty();
                $div.append(h('div.cp-teams-invite-from', [
                    Messages.team_inviteFrom || 'From:',
                    displayUser(common, json.author)
                ]));
                $div.append(UI.setHTML(h('p.cp-teams-invite-to'),
                    Messages._getKey('team_inviteFromMsg',
                    [Util.fixHTML(json.author.displayName),
                    Util.fixHTML(json.teamName)])));
                if (json.message) {
                    $div.append(h('div.cp-teams-invite-message', json.message));
                }
            }));
        }).nThen(function (waitFor) {
            // If you're logged in, move on to the next nThen
            if (driveAPP.loggedIn) { return; }

            // If you're not logged in, display the login buttons
            var anonLogin, anonRegister;
            $div.append(h('p', Messages.team_invitePleaseLogin));
            $div.append(h('div', [
                anonLogin = h('button.btn.btn-primary', Messages.login_login),
                anonRegister = h('button.btn.btn-secondary', Messages.login_register),
            ]));
            $(anonLogin).click(function () {
                common.setLoginRedirect(function () {
                    common.gotoURL('/login/');
                });
            });
            $(anonRegister).click(function () {
                common.setLoginRedirect(function () {
                    common.gotoURL('/register/');
                });
            });
            waitFor.abort();
        }).nThen(function () {
            $div.append($inviteDiv);
        }).nThen(function (waitFor) {
            // If there is no password, move on to the next block
            if (!password) { return; }

            // If there is a password, display the password prompt
            var pwInput = UI.passwordInput();
            $(acceptButton).click(function () {
                var val = $(pwInput).find('input').val();
                if (!val) { return; }
                process(val);
            });
            $inviteDiv.prepend(h('div.cp-teams-invite-password', [
                h('p', Messages.team_inviteEnterPassword),
                pwInput
            ])); 
            waitFor.abort();
        }).nThen(function () {
            // No password, display the invitation proposal
            $(acceptButton).click(function () {
                process('');
            });
        });
        return c;
    };
    makeBlock('link', function (common, cb) {
        refreshLink(common, cb);
    });

    var redrawTeam = function (common) {
        if (!APP.team) { return; }
        var teamId = APP.team;
        APP.module.execCommand('LIST_TEAMS', null, function (obj) {
            if (!obj) { return; }
            if (obj.error) { return void console.error(obj.error); }
            var team = obj[teamId];
            if (!team) { return; }
            closeTeam(common, function () {
                openTeam(common, teamId, team);
            });
        });
    };


    var main = function () {
        var common;
        var readOnly;

        nThen(function (waitFor) {
            $(waitFor(function () {
                UI.addLoadingScreen();
            }));
            window.cryptpadStore.getAll(waitFor(function (val) {
                driveAPP.store = JSON.parse(JSON.stringify(val));
            }));
            SFCommon.create(waitFor(function (c) { common = c; }));
        }).nThen(function (waitFor) {
            APP.$container = $('#cp-sidebarlayout-container');
            APP.$leftside = $('<div>', {id: 'cp-sidebarlayout-leftside'}).appendTo(APP.$container);
            APP.$rightside = $('<div>', {id: 'cp-sidebarlayout-rightside'}).appendTo(APP.$container);
            var sFrameChan = common.getSframeChannel();
            sFrameChan.onReady(waitFor());
        }).nThen(function () {
            var sframeChan = common.getSframeChannel();
            var metadataMgr = common.getMetadataMgr();
            var privateData = metadataMgr.getPrivateData();
            var user = metadataMgr.getUserData();

            readOnly = driveAPP.readOnly = metadataMgr.getPrivateData().readOnly;

            driveAPP.loggedIn = common.isLoggedIn();
            //if (!driveAPP.loggedIn) { throw new Error('NOT_LOGGED_IN'); }

            common.setTabTitle(Messages.type.teams);

            // Drive data
            driveAPP.disableSF = !privateData.enableSF && AppConfig.disableSharedFolders;

            // Toolbar
            var $bar = $('#cp-toolbar');
            var configTb = {
                displayed: ['useradmin', 'pageTitle', 'newpad', 'limit', 'notifications'],
                pageTitle: Messages.type.teams,
                metadataMgr: metadataMgr,
                readOnly: privateData.readOnly,
                sfCommon: common,
                $container: $bar
            };
            var toolbar = APP.toolbar = Toolbar.create(configTb);
            // Update the name in the user menu
            var $displayName = $bar.find('.' + Toolbar.constants.username);
            metadataMgr.onChange(function () {
                var name = metadataMgr.getUserData().name || Messages.anonymous;
                $displayName.text(name);
            });
            $displayName.text(user.name || Messages.anonymous);

            // Load the Team module
            var onEvent = function (obj) {
                var ev = obj.ev;
                var data = obj.data;
                if (ev === 'LEAVE_TEAM') {
                    $('div.cp-team-cat-back').click();
                    return;
                }
                if (ev === 'ROSTER_CHANGE') {
                    if (Number(APP.team) === Number(data)) {
                        redrawRoster(common);
                    }
                    return;
                }
                if (ev === 'ROSTER_CHANGE_RIGHTS') {
                    redrawTeam(common);
                    return;
                }
            };

            APP.module = common.makeUniversal('team', {
                onEvent: onEvent
            });

            var hash = privateData.teamInviteHash;
            if (!hash && !driveAPP.loggedIn) {
                UI.alert(Messages.mustLogin, function () {
                    common.setLoginRedirect(function () {
                        common.gotoURL('/login/');
                    });
                }, {forefront: true});
                return;
            }
            if (!hash) {
                delete mainCategories.link;
            } else if (!driveAPP.loggedIn) {
                delete mainCategories.list;
                delete mainCategories.create;
            }

            $('body').css('display', '');
            loadMain(common);

            metadataMgr.onChange(function () {
                var $div = $('div.cp-team-list');
                if ($div.length) {
                    refreshList(common, function (content) {
                        $div.empty().append(content);
                    });
                }
                var $divLink = $('div.cp-team-link').empty();
                if ($divLink.length) {
                    refreshLink(common, function (content) {
                        $divLink.append(content);
                    });
                }
                var $divCreate = $('div.cp-team-create');
                if ($divCreate.length) {
                    refreshCreate(common, function (content) {
                        $divCreate.empty().append(content);
                    });
                }
            });

            var onDisconnect = function (noAlert) {
                setEditable(false);
                if (APP.team && driveAPP.refresh) { driveAPP.refresh(); }
                toolbar.failed();
                if (!noAlert) { UIElements.disconnectAlert(); }
            };
            var onReconnect = function () {
                setEditable(true);
                if (APP.team && driveAPP.refresh) { driveAPP.refresh(); }
                toolbar.reconnecting();
                UIElements.reconnectAlert();
            };

            sframeChan.on('EV_DRIVE_LOG', function (msg) {
                UI.log(msg);
            });
            sframeChan.on('EV_NETWORK_DISCONNECT', function () {
                onDisconnect();
            });
            sframeChan.on('EV_NETWORK_RECONNECT', function () {
                onReconnect();
            });
            common.onLogout(function () { setEditable(false); });
        });
    };
    main();
});
