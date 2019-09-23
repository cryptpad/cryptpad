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
    '/customize/application_config.js',
    '/customize/messages.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/drive/app-drive.less',
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
    AppConfig,
    Messages)
{
    var APP = {};
    var SHARED_FOLDER_NAME = Messages.fm_sharedFolderName;

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

    var history = {
        isHistoryMode: false,
    };

    var setEditable = DriveUI.setEditable;

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
            SFCommon.create(waitFor(function (c) { common = c; }));
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
            if (!APP.loggedIn) { Feedback.send('ANONYMOUS_DRIVE'); }
            APP.$body = $('body');
            APP.$bar = $('#cp-toolbar');

            common.setTabTitle(Messages.type.drive);

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
                common.createUsageBar(null, function (err, $limitContainer) {
                    if (err) { return void DriveUI.logError(err); }
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
            if (!proxy.drive || typeof(proxy.drive) !== 'object') {
                throw new Error("Corrupted drive");
            }
            var drive = DriveUI.create(common, {
                proxy: proxy,
                folders: folders,
                updateObject: updateObject,
                updateSharedFolders: updateSharedFolders,
                history: history,
                APP: APP
            });

            var onDisconnect = function (noAlert) {
                setEditable(false);
                if (drive.refresh) { drive.refresh(); }
                APP.toolbar.failed();
                if (!noAlert) { UI.alert(Messages.common_connectionLost, undefined, true); }
            };
            var onReconnect = function (info) {
                setEditable(true);
                if (drive.refresh) { drive.refresh(); }
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
