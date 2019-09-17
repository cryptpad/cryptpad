define([
    'jquery',
    '/common/toolbar3.js',
    '/common/drive-ui.js',
    '/common/common-util.js',
    '/common/common-interface.js',
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
    var createLeftSide = APP.createLeftSide = function (common, team) {
        APP.$leftside.empty();
        var $categories = $('<div>', {'class': 'cp-sidebarlayout-categories'})
                            .appendTo(APP.$leftside);

        var categories = team ? teamCategories : mainCategories;
        var active = team ? 'drive' : 'list';

        Object.keys(categories).forEach(function (key) {
            var $category = $('<div>', {'class': 'cp-sidebarlayout-category cp-team-cat-'+key}).appendTo($categories);
            if (key === 'general') { $category.append($('<span>', {'class': 'fa fa-info-circle'})); }
            if (key === 'list') { $category.append($('<span>', {'class': 'fa fa-list cp-team-cat-list'})); }
            if (key === 'create') { $category.append($('<span>', {'class': 'fa fa-plus-circle'})); }
            if (key === 'back') { $category.append($('<span>', {'class': 'fa fa-arrow-left'})); }
            if (key === 'members') { $category.append($('<span>', {'class': 'fa fa-users'})); }
            if (key === 'chat') { $category.append($('<span>', {'class': 'fa fa-comments'})); }
            if (key === 'drive') { $category.append($('<span>', {'class': 'fa fa-hdd-o'})); }

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

    var buildUI = APP.buildUI = function (common, team) {
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

        createLeftSide(common, team);
    };

    // Team APP

    var loadTeam = function (common, id, firstLoad) {
        var sframeChan = common.getSframeChannel();
        var proxy = {};
        var folders = {};
        if (firstLoad) {
            buildUI(common, true);
        }
        nThen(function (waitFor) {
            updateObject(sframeChan, proxy, waitFor(function () {
                updateSharedFolders(sframeChan, null, proxy.drive, folders, waitFor());
            }));
        }).nThen(function () {
            if (!proxy.drive || typeof(proxy.drive) !== 'object') {
                throw new Error("Corrupted drive");
            }
            driveAPP.team = id;
            var drive = DriveUI.create(common, {
                proxy: proxy,
                folders: folders,
                updateObject: updateObject,
                updateSharedFolders: updateSharedFolders,
                APP: driveAPP
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

    var makeBlock = function (key, getter) {
        create[key] = function (common) {
            var $div = $('<div>', {'class': 'cp-team-' + key + ' cp-sidebarlayout-element'});
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
                lis.push(h('li', h('ul', [
                    h('li', 'Name: ' + team.name), // XXX
                    h('li', 'ID: ' + id), // XXX
                    h('li', a) // XXX
                ])));
                $(a).click(function () {
                    APP.module.execCommand('SUBSCRIBE', id, function () {
                        sframeChan.query('Q_SET_TEAM', id, function (err) {
                            if (err) { return void console.error(err); }
                            APP.team = id;
                            buildUI(common, true);
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

    makeBlock('chat', function (common, cb) {
        var container = h('div#cp-app-contacts-container.cp-app-contacts-inapp');
        var content = [container];
        APP.module.execCommand('OPEN_TEAM_CHAT', {
            teamId: APP.team
        }, function (obj) {
            console.warn(obj);
            common.setTeamChat(obj.channel);
            MessengerUI.create($(container), common, true);
            cb(content);
        });
    });

    var onEvent = function (obj) {
        var ev = obj.ev;
        var data = obj.data;
        if (ev === 'PEWPEW') {
            data = data;
            // Do something
            return;
        }
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
            readOnly = driveAPP.readOnly = metadataMgr.getPrivateData().readOnly;

            driveAPP.loggedIn = common.isLoggedIn();
            if (!driveAPP.loggedIn) { throw new Error('NOT_LOGGED_IN'); }

            common.setTabTitle('TEAMS'); // XXX

            // Drive data
            if (privateData.newSharedFolder) {
                driveAPP.newSharedFolder = privateData.newSharedFolder;
            }
            driveAPP.disableSF = !privateData.enableSF && AppConfig.disableSharedFolders;

            // Toolbar
            var $bar = $('#cp-toolbar');
            var configTb = {
                displayed: ['useradmin', 'pageTitle', 'newpad', 'limit', 'notifications'],
                pageTitle: 'TEAMS', // XXX
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

            /* add the usage */
            // XXX Teams
            if (false) {
                // Synchronous callback...
                common.createUsageBar(function (err, $limitContainer) {
                    if (err) { return void DriveUI.logError(err); }
                    driveAPP.$limit = $limitContainer;
                }, true);
            }

            // Load the Team module
            APP.module = common.makeUniversal('team', {
                onEvent: onEvent
            });

            $('body').css('display', '');
            if (privateData.teamId) {
                loadTeam(common, privateData.teamId, true);
            } else {
                loadMain(common);
            }


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
