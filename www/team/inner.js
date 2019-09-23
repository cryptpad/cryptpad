define([
    'jquery',
    '/common/toolbar3.js',
    '/common/drive-ui.js',
    '/common/common-util.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/common-feedback.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/proxy-manager.js',
    '/common/hyperscript.js',
    '/customize/application_config.js',
    '/common/messenger-ui.js',
    '/customize/messages.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/team/app-team.less',
], function (
    $,
    Toolbar,
    DriveUI,
    Util,
    UI,
    UIElements,
    Feedback,
    nThen,
    SFCommon,
    ProxyManager,
    h,
    AppConfig,
    MessengerUI,
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
            if (!driveAPP.loggedIn && driveAPP.newSharedFolder) {
                obj.drive.sharedFolders = obj.drive.sharedFolders || {};
                obj.drive.sharedFolders[driveAPP.newSharedFolder] = {};
            }
            cb();
        });
    };

    var setEditable = DriveUI.setEditable;

    var mainCategories = {
        'general': [
            'cp-team-info',
        ],
        'list': [
            'cp-team-list',
        ],
        'create': [
            'cp-team-create',
        ],
    };
    var teamCategories = {
        'back': {
            onClick: function (common) {
                var sframeChan = common.getSframeChannel();
                APP.module.execCommand('SUBSCRIBE', null, function () {
                    sframeChan.query('Q_SET_TEAM', null, function (err) {
                        if (err) { return void console.error(err); }
                        if (APP.drive && APP.drive.close) { APP.drive.close(); }
                        APP.team = null;
                        APP.teamEdPublic = null;
                        APP.drive = null;
                        APP.buildUI(common);
                    });
                });
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
            'cp-team-name',
            'cp-team-avatar'
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

        var categories = team ? teamCategories : mainCategories;
        var active = team ? 'drive' : 'list';

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
                } else {
                    APP.$rightside.removeClass('cp-rightside-drive');
                }

                $categories.find('.cp-leftside-active').removeClass('cp-leftside-active');
                $category.addClass('cp-leftside-active');
                showCategories(categories[key]);
            });

            $category.append(Messages['team_cat_'+key] || key); // XXX
        });
        if (active === 'drive') {
            APP.$rightside.addClass('cp-rightside-drive');
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
            if (APP.usageBar) { APP.usageBar.stop(); }
            APP.usageBar = common.createUsageBar(APP.team, function (err, $limitContainer) {
                if (err) { return void DriveUI.logError(err); }
                driveAPP.$limit = $limitContainer;
            }, true);
            driveAPP.team = id;
            var drive = DriveUI.create(common, {
                proxy: proxy,
                folders: folders,
                updateObject: updateObject,
                updateSharedFolders: updateSharedFolders,
                APP: driveAPP,
                edPublic: APP.teamEdPublic
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
            h('h3', 'Team application'), // XXX
            h('p', 'From here you can ...') // XXX
        ]);
    });

    var refreshList = function (common, cb) {
        var sframeChan = common.getSframeChannel();
        var content = [];
        content.push(h('h3', 'Your teams'));
        APP.module.execCommand('LIST_TEAMS', null, function (obj) {
            if (!obj) { return; }
            if (obj.error) { return void console.error(obj.error); }
            var lis = [];
            Object.keys(obj).forEach(function (id) {
                var team = obj[id];
                var a = h('a', 'Open');
                var avatar = h('span.cp-avatar.cp-team-list-avatar');
                lis.push(h('li', h('ul', [
                    h('li', avatar), // XXX
                    h('li', 'Name: ' + team.metadata.name), // XXX
                    h('li', 'ID: ' + id), // XXX
                    h('li', a) // XXX
                ])));
                common.displayAvatar($(avatar), team.metadata.avatar, team.metadata.name);
                $(a).click(function () {
                    APP.module.execCommand('SUBSCRIBE', id, function () {
                        sframeChan.query('Q_SET_TEAM', id, function (err) {
                            if (err) { return void console.error(err); }
                            APP.team = id;
                            APP.teamEdPublic = Util.find(team, ['keys', 'drive', 'edPublic']);
                            buildUI(common, true, team.owner);
                        });
                    });
                });
            });
            content.push(h('ul', lis));
            cb(content);
        });
        return content;
    };
    makeBlock('list', function (common, cb) {
        refreshList(common, cb);
    });

    makeBlock('create', function (common, cb) {
        var content = [];
        content.push(h('h3', 'Create a team')); // XXX
        content.push(h('label', 'Team name')); // XXX
        var input = h('input', {type:'text'});
        content.push(input);
        var button = h('button.btn.btn-success', 'Create'); // XXX
        content.push(h('br'));
        content.push(h('br'));
        content.push(button);
        var state = false;
        $(button).click(function () {
            if (state) { return; }
            var name = $(input).val();
            if (!name.trim()) { return; }
            state = true;
            UI.confirm('Are you sure?', function (yes) {
                if (!yes) {
                    state = false;
                    return;
                }
                APP.module.execCommand('CREATE_TEAM', {
                    name: name
                }, function () {
                    var $div = $('div.cp-team-list').empty();
                    refreshList(common, function (content) {
                        state = false;
                        $div.append(content);
                        $('div.cp-team-cat-list').click();
                    });
                });
            });
        });
        cb(content);
    });

    makeBlock('back', function (common, cb) {
        refreshList(common, cb);
    });

    makeBlock('drive', function (common, cb) {
        $('div.cp-team-drive').empty();
        var content = [
            h('div.cp-app-drive-container', {tabindex:0}, [
                h('div#cp-app-drive-tree'),
                h('div#cp-app-drive-content-container', [
                    h('div#cp-app-drive-toolbar'),
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

    var ROLES = ['MEMBER', 'ADMIN', 'OWNER'];
    var describeUser = function (common, data, icon) {
        APP.module.execCommand('DESCRIBE_USER', {
            teamId: APP.team,
            curvePublic: data.curvePublic,
            data: data
        }, function (obj) {
            if (obj && obj.error) {
                $(icon).show();
                return void UI.alert(Messages.error);
            }
            redrawRoster(common);
        });
    };
    var makeMember = function (common, data, me) {
        if (!data.curvePublic) { return; }
        // Avatar
        var avatar = h('span.cp-avatar.cp-team-member-avatar');
        common.displayAvatar($(avatar), data.avatar, data.displayName);
        // Name
        var name = h('span.cp-team-member-name', data.displayName);
        // Actions
        var actions = h('span.cp-team-member-actions');
        var $actions = $(actions);
        var isMe = me && me.curvePublic === data.curvePublic;
        var myRole = me ? (ROLES.indexOf(me.role) || 0) : -1;
        var theirRole = ROLES.indexOf(data.role) || 0;
        // If they're a member and I have a higher role than them, I can promote them to admin
        if (!isMe && myRole > theirRole && theirRole === 0) {
            var promote = h('span.fa.fa-angle-double-up', {
                title: 'Promote' // XXX
            });
            $(promote).click(function () {
                data.role = 'ADMIN';
                $(promote).hide();
                describeUser(common, data, promote);
            });
            $actions.append(promote);
        }
        // If I'm not a member and I have an equal or higher role than them, I can demote them
        // (if they're not already a MEMBER)
        if (!isMe && myRole >= theirRole && theirRole > 0) {
            var demote = h('span.fa.fa-angle-double-down', {
                title: 'Demote' // XXX
            });
            $(demote).click(function () {
                data.role = ROLES[theirRole - 1] || 'MEMBER';
                $(demote).hide();
                describeUser(common, data, demote);
            });
            $actions.append(demote);
        }
        // If I'm not a member and I have an equal or higher role than them, I can remove them
        if (!isMe && myRole > 0 && myRole >= theirRole) {
            var remove = h('span.fa.fa-times', {
                title: 'Remove' // XXX
            });
            $(remove).click(function () {
                $(remove).hide();
                APP.module.execCommand('REMOVE_USER', {
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
            $actions.append(remove);
        }

        // User
        var content = [
            avatar,
            name,
            actions
        ];
        var div = h('div.cp-team-roster-member', {
            title: data.displayName
        }, content);
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
            return roster[k].role === "OWNER";
        }).map(function (k) {
            return makeMember(common, roster[k], me);
        });
        var admins = Object.keys(roster).filter(function (k) {
            if (roster[k].pending) { return; }
            return roster[k].role === "ADMIN";
        }).map(function (k) {
            return makeMember(common, roster[k], me);
        });
        var members = Object.keys(roster).filter(function (k) {
            if (roster[k].pending) { return; }
            return roster[k].role === "MEMBER" || !roster[k].role;
        }).map(function (k) {
            return makeMember(common, roster[k], me);
        });
        // XXX LEAVE the team button
        // XXX INVITE to the team button
        var header = h('div.cp-app-team-roster-header');
        var $header = $(header);

        // If you're an admin or an owner, you can invite your friends to the team
        // TODO and acquaintances later?
        if (me && (me.role === 'ADMIN' || me.role === 'OWNER')) {
            var invite = h('button.btn.btn-primary', 'INVITE A FRIEND');
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

        if (me && (me.role === 'ADMIN' || me.role === 'MEMBER')) {
            var leave = h('button.btn.btn-danger', 'LEAVE THE TEAM');
            $(leave).click(function () {
                UI.confirm("Your're going to leave this team and lose access to its entire drive. Are you sure?", function (yes) {
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

        return [
            header,
            h('h3', 'OWNER'), // XXX
            h('div', owner),
            h('h3', 'ADMINS'), // XXX
            h('div', admins),
            h('h3', 'MEMBERS'), // XXX
            h('div', members)
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
                return void UI.alert(Messages.error); // XXX
            }
            common.setTeamChat(obj.channel);
            MessengerUI.create($(container), common, true);
            cb(content);
        });
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
        var data = UIElements.addAvatar(common, function (ev, data) {
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

            if (!privateData.enableTeams) {
                return void UI.errorLoadingScreen(Messages.comingSoon);
            }

            readOnly = driveAPP.readOnly = metadataMgr.getPrivateData().readOnly;

            driveAPP.loggedIn = common.isLoggedIn();
            if (!driveAPP.loggedIn) { throw new Error('NOT_LOGGED_IN'); }

            common.setTabTitle('TEAMS (ALPHA)'); // XXX

            // Drive data
            if (privateData.newSharedFolder) {
                driveAPP.newSharedFolder = privateData.newSharedFolder;
            }
            driveAPP.disableSF = !privateData.enableSF && AppConfig.disableSharedFolders;

            // Toolbar
            var $bar = $('#cp-toolbar');
            var configTb = {
                displayed: ['useradmin', 'pageTitle', 'newpad', 'limit', 'notifications'],
                pageTitle: 'TEAMS (ALPHA)', // XXX
                metadataMgr: metadataMgr,
                readOnly: privateData.readOnly,
                sfCommon: common,
                $container: $bar
            };
            var toolbar = Toolbar.create(configTb);
            toolbar.$rightside.hide(); // hide the bottom part of the toolbar
            // Update the name in the user menu
            driveAPP.$displayName = $bar.find('.' + Toolbar.constants.username);
            metadataMgr.onChange(function () {
                var name = metadataMgr.getUserData().name || Messages.anonymous;
                driveAPP.$displayName.text(name);
            });

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
            };

            APP.module = common.makeUniversal('team', {
                onEvent: onEvent
            });

            $('body').css('display', '');
            loadMain(common);

            metadataMgr.onChange(function () {
                var $div = $('div.cp-team-list');
                if (!$div.length) { return; }
                refreshList(common, function (content) {
                    $div.empty().append(content);
                });
            });

            var onDisconnect = function (noAlert) {
                setEditable(false);
                if (APP.team && driveAPP.refresh) { driveAPP.refresh(); }
                toolbar.failed();
                if (!noAlert) { UI.alert(Messages.common_connectionLost, undefined, true); }
            };
            var onReconnect = function (info) {
                setEditable(true);
                if (APP.team && driveAPP.refresh) { driveAPP.refresh(); }
                toolbar.reconnecting(info.myId);
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
