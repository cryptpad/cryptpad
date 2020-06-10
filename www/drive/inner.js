define([
    'jquery',
    '/common/toolbar.js',
    '/common/drive-ui.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
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
    Hash,
    UI,
    UIElements,
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
                var sfData = drive.sharedFolders[fId] || {};
                var href = (sfData.href && sfData.href.indexOf('#') !== -1) ? sfData.href : sfData.roHref;
                var parsed = Hash.parsePadUrl(href);
                var secret = Hash.getSecrets('drive', parsed.hash, sfData.password);
                sframeChan.query('Q_DRIVE_GETOBJECT', {
                    sharedFolder: fId
                }, waitFor(function (err, newObj) {
                    if (!APP.loggedIn && APP.newSharedFolder) {
                        if (!newObj || !Object.keys(newObj).length) {
                            // Empty anon drive: deleted
                            var msg = Messages.deletedError + '<br>' + Messages.errorRedirectToHome;
                            setTimeout(function () { UI.errorLoadingScreen(msg, false, function () {}); });
                            APP.newSharedFolder = null;
                        }
                    }
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
            // If anon shared folder, make a virtual drive containing this folder
            if (!APP.loggedIn && APP.newSharedFolder) {
                obj.drive.root = {
                    sf: APP.newSharedFolder
                };
                obj.drive.sharedFolders = obj.drive.sharedFolders || {};
                obj.drive.sharedFolders[APP.newSharedFolder] = {
                    href: APP.anonSFHref,
                    password: APP.anonSFPassword
                };
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
        setEditable(!bool, true);
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
            $('#cp-app-drive-connection-state').text(Messages.disconnected);
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
                APP.anonSFHref = privateData.anonSFHref;
                APP.anonSFPassword = privateData.password;
            }

            var sframeChan = common.getSframeChannel();
            updateObject(sframeChan, proxy, waitFor(function () {
                updateSharedFolders(sframeChan, null, proxy.drive, folders, waitFor());
            }));
        }).nThen(function () {
            var sframeChan = common.getSframeChannel();
            var metadataMgr = common.getMetadataMgr();
            var privateData = metadataMgr.getPrivateData();
            var user = metadataMgr.getUserData();

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
            var toolbar = Toolbar.create(configTb);

            var $displayName = APP.$bar.find('.' + Toolbar.constants.username);
            metadataMgr.onChange(function () {
                var name = metadataMgr.getUserData().name || Messages.anonymous;
                $displayName.text(name);
            });
            $displayName.text(user.name || Messages.anonymous);


            /* add the usage */
            var usageBar;
            if (APP.loggedIn) {
                usageBar = common.createUsageBar(null, function (err) {
                    if (err) { return void DriveUI.logError(err); }
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
            if (!APP.loggedIn && !APP.readOnly) {
                APP.$burnThisDrive = common.createButton(null, true, {
                    text: '',
                    name: 'burn-anon-drive',
                    icon: 'fa-ban',
                    tippy: Messages.fm_burnThisDriveButton,
                    drawer: false
                }, function () {
                    UI.confirm(Messages.fm_burnThisDrive, function (yes) {
                        if (!yes) { return; }
                        common.getSframeChannel().event('EV_BURN_ANON_DRIVE');
                    }, null, true);
                });
            }

            $('body').css('display', '');
            if (!proxy.drive || typeof(proxy.drive) !== 'object') {
                throw new Error("Corrupted drive");
            }
            var drive = DriveUI.create(common, {
                $limit: usageBar && usageBar.$container,
                proxy: proxy,
                folders: folders,
                updateObject: updateObject,
                updateSharedFolders: updateSharedFolders,
                history: history,
                toolbar: toolbar,
                APP: APP
            });

            var onDisconnect = function (noAlert) {
                setEditable(false);
                if (drive.refresh) { drive.refresh(); }
                toolbar.failed();
                if (!noAlert) { UIElements.disconnectAlert(); }
            };
            var onReconnect = function () {
                setEditable(true);
                if (drive.refresh) { drive.refresh(); }
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
