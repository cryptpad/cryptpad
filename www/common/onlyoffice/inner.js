// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/common/toolbar.js',
    'json.sortify',
    '/components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-interface.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/common/common-ui-elements.js',
    '/common/common-feedback.js',
    '/common/hyperscript.js',
    '/api/config',
    '/customize/messages.js',
    '/customize/application_config.js',
    '/components/chainpad/chainpad.dist.js',
    '/file/file-crypto.js',
    '/common/onlyoffice/history.js',
    '/common/onlyoffice/oocell_base.js',
    '/common/onlyoffice/oodoc_base.js',
    '/common/onlyoffice/ooslide_base.js',
    '/common/outer/worker-channel.js',
    '/common/outer/x2t.js',

    '/components/file-saver/FileSaver.min.js',

    'css!/components/bootstrap/dist/css/bootstrap.min.css',
    'less!/components/components-font-awesome/css/font-awesome.min.css',
    'less!/common/onlyoffice/app-oo.less',
], function (
    $,
    Toolbar,
    JSONSortify,
    nThen,
    SFCommon,
    UI,
    Hash,
    Util,
    UIElements,
    Feedback,
    h,
    ApiConfig,
    Messages,
    AppConfig,
    ChainPad,
    FileCrypto,
    History,
    EmptyCell,
    EmptyDoc,
    EmptySlide,
    Channel,
    X2T)
{
    var saveAs = window.saveAs;
    var Nacl = window.nacl;
    var APP = window.APP = {
        $: $,
        urlArgs: Util.find(ApiConfig, ['requireConf', 'urlArgs'])
    };

    var CHECKPOINT_INTERVAL = 100;
    var FORCE_CHECKPOINT_INTERVAL = 10000;
    var DISPLAY_RESTORE_BUTTON = false;
    var NEW_VERSION = 7; // version of the .bin, patches and ChainPad formats
    var PENDING_TIMEOUT = 30000;
    var CURRENT_VERSION = X2T.CURRENT_VERSION;

    //var READONLY_REFRESH_TO = 15000;

    var debug = function (x, type) {
        if (!window.CP_DEV_MODE) { return; }
        console.debug(x, type);
    };

    var stringify = function (obj) {
        return JSONSortify(obj);
    };

    var toolbar;
    var cursor;


    var andThen = function (common) {
        var Title;
        var sframeChan = common.getSframeChannel();
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        var readOnly = false;
        var offline = false;
        var ooLoaded = false;
        var pendingChanges = {};
        var config = {};
        var content = {
            hashes: {},
            ids: {},
            mediasSources: {},
            version: privateData.ooForceVersion ? Number(privateData.ooForceVersion) : NEW_VERSION
        };
        var oldHashes = {};
        var oldIds = {};
        var oldLocks = {};
        var myUniqueOOId;
        var myOOId;
        var sessionId = Hash.createChannelId();
        var cpNfInner;
        let integrationChannel;

        var evOnPatch = Util.mkEvent();
        var evOnSync = Util.mkEvent();
        var evIntegrationSave = Util.mkEvent();

        // This structure is used for caching media data and blob urls for each media cryptpad url
        var mediasData = {};

        let startOO = function () {};

        var supportsXLSX = function () {
            return privateData.supportsWasm;
        };

        var getMediasSources = APP.getMediasSources =  function() {
            content.mediasSources = content.mediasSources || {};
            return content.mediasSources;
        };

        var getId = function () {
            return metadataMgr.getNetfluxId() + '-' + privateData.clientId;
        };

        var getWindow = function () {
            return window.frames && window.frames[0];
        };
        var getEditor = function () {
            var w = getWindow();
            if (!w) { return; }
            return w.editor || w.editorCell;
        };

        var setEditable = function (state, force) {
            $('#cp-app-oo-editor').find('#cp-app-oo-offline').remove();
            /*
            try {
                getEditor().asc_setViewMode(!state);
                //window.frames[0].editor.setViewModeDisconnect(true);
            } catch (e) {}
            */
            if (!state && (!readOnly || force)) {
                $('#cp-app-oo-editor').append(h('div#cp-app-oo-offline'));
            }
        };

        var deleteOffline = function () {
            var ids = content.ids;
            var users = Object.keys(metadataMgr.getMetadata().users);
            Object.keys(ids).forEach(function (id) {
                var nId = id.slice(0,32);
                if (users.indexOf(nId) === -1) {
                    delete ids[id];
                }
            });
            APP.onLocal();
        };

        var isRegisteredUserOnline = function () {
            var users = metadataMgr.getMetadata().users || {};
            return Object.keys(users).some(function (id) {
                return users[id] && users[id].curvePublic;
            });
        };
        var isUserOnline = function (ooid) {
            // Remove ids for users that have left the channel
            deleteOffline();
            var ids = content.ids;
            // Check if the provided id is in the ID list
            return Object.keys(ids).some(function (id) {
                return ooid === ids[id].ooid;
            });
        };

        const getNewUserIndex = function () {
            const ids = content.ids || {};
            const indexes = Object.values(ids).map((user) => user.index);
            const maxIndex = Math.max(...indexes);
            return maxIndex === -Infinity ? 1 : maxIndex+1;
        };

        var setMyId = function () {
            // Remove ids for users that have left the channel
            deleteOffline();
            var ids = content.ids;
            if (!myOOId) {
                myOOId = Util.createRandomInteger();
                // f: function used in .some(f) but defined outside of the while
                var f = function (id) {
                    return ids[id].ooid === myOOId;
                };
                while (Object.keys(ids).some(f)) {
                    myOOId = Util.createRandomInteger();
                }
            }
            var myId = getId();
            ids[myId] = {
                ooid: myOOId,
                index: getNewUserIndex(),
                netflux: metadataMgr.getNetfluxId()
            };
            oldIds = JSON.parse(JSON.stringify(ids));
            APP.onLocal();
        };

        // Another tab from our worker has left: remove its id from the list
        var removeClient = function (obj) {
            var tabId = metadataMgr.getNetfluxId() + '-' + obj.id;
            if (content.ids[tabId]) {
                delete content.ids[tabId];
                if (content.locks) { delete content.locks[tabId]; }
                APP.onLocal();
            }
        };

        // Make sure a former tab on the same worker doesn't have remaining locks
        var checkClients = function (clients) {
            if (!clients) { return; }
            Object.keys(content.ids).forEach(function (id) {
                var tabId = Number(id.slice(33)); // remove the netflux ID and the "-"
                if (clients.indexOf(tabId) === -1) {
                    removeClient({
                        id: tabId
                    });
                }
            });
        };


        var getFileType = function () {
            var priv = common.getMetadataMgr().getPrivateData();
            var type = priv.ooType;
            var title = common.getMetadataMgr().getMetadataLazy().title;
            if (APP.downloadType) {
                type = APP.downloadType;
                title = "download";
            }
            if(title === "" && APP.startWithTemplate && priv.fromFileData) {
                var metadata = APP.startWithTemplate.content.metadata;
                var copyTitle = Messages._getKey('copy_title', [metadata.title || metadata.defaultTitle]);
                common.getMetadataMgr().updateTitle(copyTitle);
                title = copyTitle;
            }
            var file = {};
            switch(type) {
                case 'doc':
                    file.type = 'docx';
                    file.title = title + '.docx' || 'document.docx';
                    file.doc = 'text';
                    break;
                case 'sheet':
                    file.type = 'xlsx';
                    file.title = title + '.xlsx' || 'spreadsheet.xlsx';
                    file.doc = 'spreadsheet';
                    break;
                case 'presentation':
                    file.type = 'pptx';
                    file.title = title + '.pptx' || 'presentation.pptx';
                    file.doc = 'presentation';
                    break;
            }
            return file;
        };

        var now = function () { return +new Date(); };

        var sortCpIndex = function (hashes) {
            return Object.keys(hashes).map(Number).sort(function (a, b) {
                return a-b;
            });
        };
        var getLastCp = function (old, i) {
            var hashes = old ? oldHashes : content.hashes;
            if (!hashes || !Object.keys(hashes).length) { return {}; }
            i = i || 0;
            var idx = sortCpIndex(hashes);
            var lastIndex = idx[idx.length - 1 - i];
            if (typeof(lastIndex) === "undefined" || !hashes[lastIndex]) {
                return {};
            }
            var last = JSON.parse(JSON.stringify(hashes[lastIndex]));
            return last;
        };

        var rtChannel = {
            ready: false,
            readyCb: undefined,
            sendCmd: function (data, cb) {
                if (APP.history) { return; }
                sframeChan.query('Q_OO_COMMAND', data, cb);
            },
            getHistory: function (cb) {
                rtChannel.sendCmd({
                    cmd: 'GET_HISTORY',
                    data: {}
                }, function () {
                    APP.onHistorySynced = cb;
                });
            },
            sendMsg: function (msg, cp, cb) {
                evOnPatch.fire();
                rtChannel.sendCmd({
                    cmd: 'SEND_MESSAGE',
                    data: {
                        msg: msg,
                        isCp: cp
                    }
                }, function (err, h) {
                    if (!err) {
                        evOnSync.fire();
                        evIntegrationSave.fire();
                    }
                    cb(err, h);
                });
            },
        };

        var ooChannel = {
            ready: false,
            queue: [],
            send: function () {},
            cpIndex: 0
        };

        var getContent = function () {
            try {
                return getEditor().asc_nativeGetFile();
            } catch (e) {
                console.error(e);
                return;
            }
        };

        /*
        var checkDrawings = function () {
            var editor = getEditor();
            if (!editor || !editor.GetSheets) { return false; }
            var s = editor.GetSheets();
            return s.some(function (obj) {
                return obj.worksheet.Drawings.length;
            });
        };
        */

        // DEPRECATED from version 3
        // Loading a checkpoint reorder the sheet starting from ID "5".
        // We have to reorder it manually when a checkpoint is created
        // so that the messages we send to the realtime channel are
        // loadable by users joining after the checkpoint
        var fixSheets = function () {
            // Starting from version 3, we don't need to fix the sheet IDs anymore
            // because we reload onlyoffice whenever we receive a checkpoint
            if (!APP.migrate || (content && content.version > 2)) { return; }

            try {
                var editor = getEditor();
                // if we are not in the sheet app
                // we should not call this code
                if (typeof editor.GetSheets === 'undefined') { return; }
                var s = editor.GetSheets();
                if (s.length === 0) { return; }
                var wb = s[0].worksheet.workbook;
                s.forEach(function (obj, i) {
                    var id = String(i + 5);
                    obj.worksheet.Id = id;
                    wb.aWorksheetsById[id] = obj.worksheet;
                });
            } catch (e) {
                console.error(e);
            }
        };

        // Add a lock
        var isLockedModal = {
            content: UI.dialog.customModal(h('div.cp-oo-x2tXls', [
                h('span.fa.fa-spin.fa-spinner'),
                h('span', Messages.oo_isLocked)
            ]))
        };

        var onUploaded = function (ev, data, err) {
            if (ev.newTemplate) {
                if (err) {
                    console.error(err);
                    return void UI.warn(Messages.error);
                }
                var _content = ev.newTemplate;
                _content.hashes = {};
                _content.hashes[1] = {
                    file: data.url,
                    index: 0,
                    version: NEW_VERSION
                };
                _content.version = NEW_VERSION;
                _content.channel = Hash.createChannelId();
                _content.ids = {};
                sframeChan.query('Q_SAVE_AS_TEMPLATE', {
                    toSave: JSON.stringify({
                        content: _content,
                        metadata: {
                            title: '',
                            defaultTitle: ev.title
                        }
                    }),
                    title: ev.title
                }, function () {
                    UI.alert(Messages.templateSaved);
                    Feedback.send('OO_TEMPLATE_CREATED');
                });
                return;
            }

            content.saveLock = undefined;
            if (err) {
                console.error(err);
                if (content.saveLock === myOOId) { delete content.saveLock; } // Unlock checkpoints
                if (APP.migrateModal) {
                    try { getEditor().asc_setRestriction(true); } catch (e) {}
                    setEditable(true);
                    delete content.migration;
                    APP.migrateModal.closeModal();
                    APP.onLocal();
                }
                if (isLockedModal.modal && err === "TOO_LARGE") {
                    if (APP.migrate) {
                        UI.warn(Messages.oo_cantMigrate);
                    }
                    APP.cantCheckpoint = true;
                    isLockedModal.modal.closeModal();
                    delete isLockedModal.modal;
                    if (content.saveLock === myOOId) {
                        delete content.saveLock;
                    }
                    APP.onLocal();
                    return;
                }
                return void UI.alert(Messages.oo_saveError);
            }
            // Get the last cp idx
            var all = sortCpIndex(content.hashes || {});
            var current = all[all.length - 1] || 0;

            var i = current + 1;
            content.hashes[i] = {
                file: data.url,
                hash: ev.hash,
                index: ev.index,
                version: NEW_VERSION
            };
            oldHashes = JSON.parse(JSON.stringify(content.hashes));
            content.locks = {};
            content.ids = {};
            // If this is a migration, set the new version
            if (APP.migrate) {
                delete content.migration;
                content.version = NEW_VERSION;
            }
            APP.onLocal();
            APP.realtime.onSettle(function () {
                UI.log(Messages.saved);
                APP.realtime.onSettle(function () {
                    if (APP.migrate) {
                        UI.removeModals();
                        UI.alert(Messages.oo_sheetMigration_complete, function () {
                            common.gotoURL();
                        });
                        return;
                    }
                    if (ev.callback) {
                        return void ev.callback();
                    }
                });
            });
            sframeChan.query('Q_OO_COMMAND', {
                cmd: 'UPDATE_HASH',
                data: ev.hash
            }, function (err, obj) {
                if (err || (obj && obj.error)) { console.error(err || obj.error); }
            });
        };

        var fmConfig = {
            noHandlers: true,
            noStore: true,
            body: $('body'),
            onUploaded: function (ev, data) {
                if (!data || !data.url) { return; }
                data.hash = ev.hash;
                sframeChan.query('Q_OO_SAVE', data, function (err) {
                    onUploaded(ev, data, err);
                });
            },
            onError: function (err) {
                onUploaded(null, null, err);
            }
        };
        APP.FM = common.createFileManager(fmConfig);

        var resetData = function (blob, type) {
            // If a read-only refresh popup was planned, abort it
            delete APP.refreshPopup;
            clearTimeout(APP.refreshRoTo);

            // Don't create the initial checkpoint indefinitely in a loop
            delete APP.initCheckpoint;

            if (!isLockedModal.modal) {
                isLockedModal.modal = UI.openCustomModal(isLockedModal.content);
            }
            myUniqueOOId = undefined;
            setMyId();
            var editor = getEditor();
            if (editor) {
                var app = common.getMetadataMgr().getPrivateData().ooType;
                var d;
                if (app === 'doc') {
                    d = editor.GetDocument().Document;
                } else if (app === 'presentation') {
                    d = editor.GetPresentation().Presentation;
                }
                if (d) {
                    APP.oldCursor = d.GetSelectionState();
                }
            }
            if (APP.docEditor) { APP.docEditor.destroyEditor(); } // Kill the old editor
            $('iframe[name="frameEditor"]').after(h('div#cp-app-oo-placeholder-a')).remove();
            ooLoaded = false;
            oldLocks = {};
            Object.keys(pendingChanges).forEach(function (key) {
                clearTimeout(pendingChanges[key]);
                delete pendingChanges[key];
            });
            if (APP.stopHistory || APP.template) { APP.history = false; }
            startOO(blob, type, true);
        };

        var saveToServer = function (blob, title) {
            if (APP.cantCheckpoint) { return; } // TOO_LARGE
            var text = getContent();
            if (!text && !blob) {
                setEditable(false, true);
                sframeChan.query('Q_CLEAR_CACHE_CHANNELS', [
                    'chainpad',
                    content.channel,
                ], function () {});
                UI.alert(Messages.realtime_unrecoverableError, function () {
                    common.gotoURL();
                });
                return;
            }
            blob = blob || new Blob([text], {type: 'plain/text'});
            var file = getFileType();
            blob.name = title || (metadataMgr.getMetadataLazy().title || file.doc) + '.' + file.type;
            var data = {
                hash: (APP.history || APP.template) ? ooChannel.historyLastHash : ooChannel.lastHash,
                index: (APP.history || APP.template) ? ooChannel.currentIndex : ooChannel.cpIndex
            };
            fixSheets();

            if (!isLockedModal.modal) {
                isLockedModal.modal = UI.openCustomModal(isLockedModal.content);
            }
            ooChannel.ready = false;
            ooChannel.queue = [];
            data.callback = function () {
                if (APP.template) { APP.template = false; }
                resetData(blob, file);
            };

            APP.FM.handleFile(blob, data);
        };

        var noLogin = false;

        var makeCheckpoint = function (force) {
            if (APP.cantCheckpoint) { return; } // TOO_LARGE

            var locked = content.saveLock;
            var lastCp = getLastCp();

            var currentIdx = ooChannel.cpIndex;
            var needCp = force || (currentIdx - (lastCp.index || 0)) > FORCE_CHECKPOINT_INTERVAL;

            if (!needCp) { return; }

            if (!locked || !isUserOnline(locked) || force) {
                if (!common.isLoggedIn() && !isRegisteredUserOnline() && !noLogin) {
                    var login = h('button.cp-corner-primary', Messages.login_login);
                    var register = h('button.cp-corner-primary', Messages.login_register);
                    var cancel = h('button.cp-corner-cancel', Messages.cancel);
                    var actions = h('div', [cancel, register, login]);
                    var modal = UI.cornerPopup(Messages.oo_login, actions, '', {alt: true});
                    $(register).click(function () {
                        common.setLoginRedirect('register');
                        modal.delete();
                    });
                    $(login).click(function () {
                        common.setLoginRedirect('login');
                        modal.delete();
                    });
                    $(cancel).click(function () {
                        modal.delete();
                        noLogin = true;
                    });
                    return;
                }
                if (!common.isLoggedIn()) { return; }
                content.saveLock = myOOId;
                APP.onLocal();
                APP.realtime.onSettle(function () {
                    saveToServer();
                });
            }
        };
        var deleteLastCp = function () {
            var hashes = content.hashes;
            if (!hashes || !Object.keys(hashes).length) { return; }
            var i = 0;
            var idx = Object.keys(hashes).map(Number).sort(function (a, b) {
                return a-b;
            });
            var lastIndex = idx[idx.length - 1 - i];
            delete content.hashes[lastIndex];
            APP.onLocal();
            APP.realtime.onSettle(function () {
                UI.log(Messages.saved);
            });
        };
        var restoreLastCp = function () {
            content.saveLock = myOOId;
            APP.onLocal();
            APP.realtime.onSettle(function () {
                onUploaded({
                    hash: ooChannel.lastHash,
                    index: ooChannel.cpIndex
                }, {
                    url: getLastCp().file,
                });
            });
        };
        // Add a timeout to check if a checkpoint was correctly saved by the locking user
        // and "unlock the sheet" or "make a checkpoint" if needed
        var cpTo;
        var checkCheckpoint = function () {
            clearTimeout(cpTo);
            var saved = stringify(content.hashes);
            var locked = content.saveLock;
            var to = 20000 + (Math.random() * 20000);
            cpTo = setTimeout(function () {
                // If no checkpoint was added and the same user still has the lock
                // then make a checkpoint if needed (cp interval)
                if (stringify(content.hashes) === saved && locked === content.saveLock) {
                    content.saveLock = undefined;
                    makeCheckpoint();
                }
            }, to);
        };

        var loadInitDocument = function (type, useNewDefault) {
            var newText;
            switch (type) {
                case 'sheet' :
                    newText = EmptyCell(useNewDefault);
                    break;
                case 'doc':
                    newText = EmptyDoc();
                    break;
                case 'presentation':
                    newText = EmptySlide();
                    break;
                default:
                    newText = '';
            }
            return new Blob([newText], {type: 'text/plain'});
        };

        const loadLastDocument = function (lastCp) {
            return new Promise((resolve, reject) => {
                if (!lastCp || !lastCp.file) {
                    return void reject('EEMPTY');
                }
                ooChannel.cpIndex = lastCp.index || 0;
                ooChannel.lastHash = lastCp.hash;
                var parsed = Hash.parsePadUrl(lastCp.file);
                var secret = Hash.getSecrets('file', parsed.hash);
                if (!secret || !secret.channel) { return; }
                var hexFileName = secret.channel;
                var fileHost = privateData.fileHost || privateData.origin;
                var src = fileHost + Hash.getBlobPathFromHex(hexFileName);
                var key = secret.keys && secret.keys.cryptKey;
                var xhr = new XMLHttpRequest();
                xhr.open('GET', src, true);
                if (window.sendCredentials) { xhr.withCredentials = true; }
                xhr.responseType = 'arraybuffer';
                xhr.onload = function () {
                    if (/^4/.test('' + this.status)) {
                        reject(this.status);
                        return void console.error('XHR error', this.status);
                    }
                    var arrayBuffer = xhr.response;
                    if (arrayBuffer) {
                        var u8 = new Uint8Array(arrayBuffer);
                        FileCrypto.decrypt(u8, key, function (err, decrypted) {
                            if (err) {
                                if (err === "DECRYPTION_ERROR") {
                                    console.warn(err);
                                    return void reject(err);
                                }
                                return void console.error(err);
                            }
                            var blob = new Blob([decrypted.content], {type: 'plain/text'});
                            resolve({blob, fileType: getFileType()});
                        });
                    }
                };
                xhr.onerror = function (err) {
                    reject(err);
                };
                xhr.send(null);
            });
        };

        /*
        var refreshReadOnly = function () {
            var cancel = h('button.cp-corner-cancel', Messages.cancel);
            var reload = h('button.cp-corner-primary', [
                h('i.fa.fa-refresh'),
                Messages.oo_refresh
            ]);

            var actions = h('div', [cancel, reload]);
            var m = UI.cornerPopup(Messages.oo_refreshText, actions, '');
            $(reload).click(function () {
                ooChannel.ready = false;
                var lastCp = getLastCp();
                loadLastDocument(lastCp, function () {
                    var file = getFileType();
                    var type = common.getMetadataMgr().getPrivateData().ooType;
                    var blob = loadInitDocument(type, true);
                    resetData(blob, file);
                }, function (blob, file) {
                    resetData(blob, file);
                });
                delete APP.refreshPopup;
                m.delete();
            });
            $(cancel).click(function () {
                delete APP.refreshPopup;
                m.delete();
            });
        };
        */

        var openVersionHash = function (version) {
            readOnly = true;
            var hashes = content.hashes || {};
            var sortedCp = Object.keys(hashes).map(Number).sort(function (a, b) {
                return hashes[a].index - hashes[b].index;
            });
            var s = version.split('.');
            if (s.length !== 2) { return UI.errorLoadingScreen(Messages.error); }

            var major = Number(s[0]);
            var cpId = sortedCp[major - 1];
            var nextCpId = sortedCp[major];
            var cp = hashes[cpId] || {};

            var minor = Number(s[1]) + 1;
            if (APP.isDownload) { minor = undefined; }

            var toHash = cp.hash || 'NONE';
            var fromHash = nextCpId ? hashes[nextCpId].hash : 'NONE';

            sframeChan.query('Q_GET_HISTORY_RANGE', {
                channel: content.channel,
                lastKnownHash: fromHash,
                toHash: toHash,
                isDownload: APP.isDownload
            }, function (err, data) {
                if (err) { console.error(err); return void UI.errorLoadingScreen(Messages.error); }
                if (!Array.isArray(data.messages)) {
                    console.error('Not an array');
                    return void UI.errorLoadingScreen(Messages.error);
                }

                // The first "cp" in history is the empty doc. It doesn't include the first patch
                // of the history
                var initialCp = major === 0 || !cp.hash;
                var messages = (data.messages || []).slice(initialCp ? 0 : 1, minor);

                messages.forEach(function (obj) {
                    try { obj.msg = JSON.parse(obj.msg); } catch (e) { console.error(e); }
                });

                // The version exists if we have results in the "messages" array
                // or if we requested a x.0 version
                var exists = !Number(s[1]) || messages.length;
                var vHashEl;

                if (!privateData.embed) {
                    var vTime = (messages[messages.length - 1] || {}).time;
                    var vTimeStr = vTime ? new Date(vTime).toLocaleString()
                                         : 'v' + privateData.ooVersionHash;
                    var vTxt = Messages._getKey('infobar_versionHash',  [vTimeStr]);

                    // If we expected patched and we don't have any, it means this part
                    // of the history has been deleted
                    var vType = "warning";
                    if (!exists) {
                        vTxt = Messages.oo_deletedVersion;
                        vType = "danger";
                    }

                    vHashEl = h('div.alert.alert-'+vType+'.cp-burn-after-reading', vTxt);
                    $('#cp-app-oo-editor').prepend(vHashEl);
                }

                if (!exists) { return void UI.removeLoadingScreen(); }

                loadLastDocument(cp)
                    .then(({blob, fileType}) => {
                        ooChannel.queue = messages;
                        resetData(blob, fileType);
                        UI.removeLoadingScreen();
                    })
                    .catch(() => {
                        if (cp.hash && vHashEl) {
                            // We requested a checkpoint but we can't find it...
                            UI.removeLoadingScreen();
                            vHashEl.innerText = Messages.oo_deletedVersion;
                            $(vHashEl).removeClass('alert-warning').addClass('alert-danger');
                            return;
                        }
                        var file = getFileType();
                        var type = common.getMetadataMgr().getPrivateData().ooType;
                        if (APP.downloadType) { type = APP.downloadType; }
                        var blob = loadInitDocument(type, true);
                        ooChannel.queue = messages;
                        resetData(blob, file);
                        UI.removeLoadingScreen();
                    });
            });
        };

        var openRtChannel = function (cb) {
            if (rtChannel.ready) { return void cb(); }
            var chan = content.channel || Hash.createChannelId();
            if (!content.channel) {
                content.channel = chan;
                APP.onLocal();
            }
            sframeChan.query('Q_OO_OPENCHANNEL', {
                channel: content.channel,
                lastCpHash: getLastCp().hash
            }, function (err, obj) {
                if (err || (obj && obj.error)) { console.error(err || (obj && obj.error)); }
                // XXX an error loading a checkpoint was ignored, causing a sheet
                // to load incorrectly. There's a risk of a new checkpoint being created
                // with the resulting (incorrect) state. Errors like this should be reported
                // to the user so they realize something is wrong.
            });
            sframeChan.on('EV_OO_EVENT', function (obj) {
                switch (obj.ev) {
                    case 'READY':
                        checkClients(obj.data);
                        cb();
                        break;
                    case 'LEAVE':
                        removeClient(obj.data);
                        break;
                    case 'MESSAGE':
                        if (APP.history) {
                            ooChannel.historyLastHash = obj.data.hash;
                            ooChannel.currentIndex++;
                            return;
                        }
                        if (ooChannel.ready) {
                            // In read-only mode, push the message to the queue and prompt
                            // the user to refresh OO (without reloading the page)
                            /*if (readOnly) {
                                ooChannel.queue.push(obj.data);
                                if (APP.refreshPopup) { return; }
                                APP.refreshPopup = true;

                                // Don't "spam" the user instantly and no more than
                                // 1 popup every 15s
                                APP.refreshRoTo = setTimeout(refreshReadOnly, READONLY_REFRESH_TO);
                                return;
                            }*/
                            ooChannel.send(obj.data.msg);
                            ooChannel.lastHash = obj.data.hash;
                            ooChannel.cpIndex++;
                        } else {
                            ooChannel.queue.push(obj.data);
                        }
                        break;
                    case 'HISTORY_SYNCED':
                        if (typeof(APP.onHistorySynced) !== "function") { return; }
                        APP.onHistorySynced();
                        delete APP.onHistorySynced;
                        break;

                }
            });
        };

        const findUserByOOId = function(ooId) {
            return Object.values(content.ids)
                  .find((user) => user.ooid === ooId);
        };

        const getMyOOIndex = function() {
            const user = findUserByOOId(myOOId);
            return user
                ? user.index
                : content.ids.length; // Assign an unused id to read-only users
        };

        var getParticipants = function () {
            var users = metadataMgr.getMetadata().users;
            var i = 1;
            var p = Object.keys(content.ids || {}).map(function (id) {
                var nId = id.slice(0,32);
                if (!users[nId]) { return; }
                var ooId = content.ids[id].ooid;
                var idx = content.ids[id].index;
                if (!ooId || ooId === myOOId) { return; }
                if (idx >= i) { i = idx + 1; }
                return {
                    id: String(ooId) + idx,
                    idOriginal: String(ooId),
                    username: (users[nId] || {}).name || Messages.anonymous,
                    indexUser: idx,
                    connectionId: content.ids[id].netflux || Hash.createChannelId(),
                    isCloseCoAuthoring:false,
                    view: false
                };
            });
            // Add an history keeper user to show that we're never alone
            var hkId = Util.createRandomInteger();
            p.push({
                id: hkId,
                idOriginal: String(hkId),
                username: "History",
                indexUser: i,
                connectionId: Hash.createChannelId(),
                isCloseCoAuthoring:false,
                view: false
            });
            const myOOIndex = getMyOOIndex();
            if (!myUniqueOOId) { myUniqueOOId = String(myOOId) + myOOIndex; }
            p.push({
                id: String(myOOId),
                idOriginal: String(myOOId),
                username: metadataMgr.getUserData().name || Messages.anonymous,
                indexUser: myOOIndex,
                connectionId: metadataMgr.getNetfluxId() || Hash.createChannelId(),
                isCloseCoAuthoring:false,
                view: false
            });
            return {
                index: myOOIndex,
                list: p.filter(Boolean)
            };
        };

        // Get all existing locks
        var getUserLock = function (id, forceArray) {
            var type = common.getMetadataMgr().getPrivateData().ooType;
            content.locks = content.locks || {};
            var l = content.locks[id] || {};
            if (type === "sheet" || forceArray) {
                return Object.keys(l).map(function (uid) { return l[uid]; });
            }
            var res = {};
            Object.keys(l).forEach(function (uid) {
                res[uid] = l[uid];
            });
            return res;
        };
        var getLock = function () {
            var type = common.getMetadataMgr().getPrivateData().ooType;
            var locks = [];
            if (type === "sheet") {
                Object.keys(content.locks || {}).forEach(function (id) {
                    Array.prototype.push.apply(locks, getUserLock(id));
                });
                return locks;
            }
            locks = {};
            Object.keys(content.locks || {}).forEach(function (id) {
                Util.extend(locks, getUserLock(id));
            });
            return locks;
        };

        // Update the userlist in onlyoffice
        var handleNewIds = function (o, n) {
            if (stringify(o) === stringify(n)) { return; }
            var p = getParticipants();
            ooChannel.send({
                type: "connectState",
                participantsTimestamp: +new Date(),
                participants: p.list,
                waitAuth: false
            });
        };
        // Update the locks status in onlyoffice
        var handleNewLocks = function (o, n) {
            var hasNew = false;
            // Check if we have at least one new lock
            Object.keys(n || {}).some(function (id) {
                if (typeof(n[id]) !== "object") { return; } // Ignore old format
                // n[id] = { uid: lock, uid2: lock2 };
                return Object.keys(n[id]).some(function (uid) {
                    // New lock
                    if (!o[id] || !o[id][uid]) {
                        hasNew = true;
                        return true;
                    }
                });
            });
            // Remove old locks
            Object.keys(o || {}).forEach(function (id) {
                if (typeof(o[id]) !== "object") { return; } // Ignore old format
                Object.keys(o[id]).forEach(function (uid) {
                    // Removed lock
                    if (!n[id] || !n[id][uid]) {
                        ooChannel.send({
                            type: "releaseLock",
                            locks: [o[id][uid]]
                        });
                    }
                });
            });
            if (hasNew) {
                ooChannel.send({
                    type: "getLock",
                    locks: getLock()
                });
            }
        };

        // Remove locks from offline users
        var deleteOfflineLocks = function () {
            var locks = content.locks || {};
            var users = Object.keys(metadataMgr.getMetadata().users);
            Object.keys(locks).forEach(function (id) {
                var nId = id.slice(0,32);
                if (users.indexOf(nId) === -1) {
                    // Offline locks: support old format
                    var l = (locks[id] && !locks[id].block) ? getUserLock(id) : [locks[id]];
                    ooChannel.send({
                        type: "releaseLock",
                        locks: l
                    });
                    delete content.locks[id];
                }
            });
            if (content.saveLock && !isUserOnline(content.saveLock)) {
                delete content.saveLock;
            }
        };

        var handleAuth = function (obj, send) {
            //setEditable(false);

            var changes = [];
            if (content.version > 2) {
                ooChannel.queue.forEach(function (data) {
                    Array.prototype.push.apply(changes, data.msg.changes);
                });
                ooChannel.ready = true;

                ooChannel.cpIndex += ooChannel.queue.length;
                var last = ooChannel.queue.pop();
                if (last) { ooChannel.lastHash = last.hash; }
            } else {
                setEditable(false, true);
            }
            send({
                type: "authChanges",
                changes: changes
            });

            // Answer to the auth command
            var p = getParticipants();
            send({
                type: "auth",
                result: 1,
                sessionId: sessionId,
                participants: p.list,
                locks: [],
                changes: [],
                changesIndex: 0,
                indexUser: p.index,
                buildVersion: "5.2.6",
                buildNumber: 2,
                licenseType: 3,
                //"g_cAscSpellCheckUrl": "/spellchecker",
                //"settings":{"spellcheckerUrl":"/spellchecker","reconnection":{"attempts":50,"delay":2000}}
            });
            // Open the document
            send({
                type: "documentOpen",
                data: {"type":"open","status":"ok","data":{"Editor.bin":obj.openCmd.url}}
            });

            /*
            // TODO: make sure we don't have new popups that can break our integration
            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === "childList") {
                        for (var i = 0; i < mutation.addedNodes.length; i++) {
                            if (mutation.addedNodes[i].classList.contains('asc-window') &&
                                mutation.addedNodes[i].classList.contains('alert')) {
                                $(mutation.addedNodes[i]).find('button').not('.custom').click();
                            }
                        }
                    }
                });
            });
            observer.observe(window.frames[0].document.body, {
                childList: true,
            });
            */
        };

        var handleLock = function (obj, send) {
            if (APP.history) { return; }

            if (content.saveLock) {
                if (!isLockedModal.modal) {
                    isLockedModal.modal = UI.openCustomModal(isLockedModal.content);
                }
                setTimeout(function () {
                    handleLock(obj, send);
                }, 50);
                return;
            }
            var type = common.getMetadataMgr().getPrivateData().ooType;
            var b = obj.block && obj.block[0];
            var msg = {
                time: now(),
                user: myUniqueOOId,
                block: b
            };

            var editor = getEditor();
            if (type === "presentation" && (APP.themeChanged || APP.themeRemote) && b &&
                b.guid === editor.GetPresentation().Presentation.themeLock.Id) {
                APP.themeLocked = APP.themeChanged;
                APP.themeChanged = undefined;
                var fakeLocks = getLock();
                fakeLocks[Util.uid()] = msg;
                send({
                    type: "getLock",
                    locks: fakeLocks
                });
                return;
            }

            content.locks = content.locks || {};
            // Send the lock to other users
            var myId = getId();
            content.locks[myId] = content.locks[myId] || {};
            if (type === "sheet" || typeof(b) !== "string") {
                var uid = Util.uid();
                content.locks[myId][uid] = msg;
            } else {
                if (typeof(b) === "string") { content.locks[myId][b] = msg; }
            }
            oldLocks = JSON.parse(JSON.stringify(content.locks));
            // Remove old locks
            deleteOfflineLocks();

            // Prepare callback
            if (cpNfInner) {
                var waitLock = APP.waitLock = Util.mkEvent(true);
                setTimeout(function () {
                    // Make sure the waitLock is never stuck
                    waitLock.fire();
                    if (waitLock === APP.waitLock) { delete APP.waitLock; }
                }, 5000);
                var onPatchSent = function (again) {
                    if (!again) { cpNfInner.offPatchSent(onPatchSent); }
                    // Answer to our onlyoffice
                    if (!content.saveLock) {
                        if (isLockedModal.modal) {
                            isLockedModal.modal.closeModal();
                            delete isLockedModal.modal;
                            if (!APP.history) {
                                $('#cp-app-oo-editor > iframe')[0].contentWindow.focus();
                            }
                        }
                        send({
                            type: "getLock",
                            locks: getLock()
                        });
                        waitLock.fire();
                        if (waitLock === APP.waitLock) { delete APP.waitLock; }
                    } else {
                        if (!isLockedModal.modal) {
                            isLockedModal.modal = UI.openCustomModal(isLockedModal.content);
                        }
                        setTimeout(function () {
                            onPatchSent(true);
                        }, 50);
                    }
                };
                cpNfInner.onPatchSent(onPatchSent);
            }
            // Commit
            APP.onLocal();
            APP.realtime.sync();
        };

        var parseChanges = function (changes, isObj) {
            try {
                changes = JSON.parse(changes);
            } catch (e) {
                return [];
            }
            return changes.map(function (change) {
                return {
                    docid: "fresh",
                    change: isObj ? change : '"' + change + '"',
                    time: now(),
                    user: myUniqueOOId,
                    useridoriginal: String(myOOId)
                };
            });
        };

        var handleChanges = function (obj, send) {
            if (APP.history) {
                send({
                    type: "unSaveLock",
                    index: ooChannel.cpIndex,
                    time: +new Date()
                });
                return;
            }
            // Add a new entry to the pendingChanges object.
            // If we can't send the patch within 30s, force a page reload
            var uid = Util.uid();
            pendingChanges[uid] = setTimeout(function () {
                // If we're offline, force a reload on reconnect
                if (offline) {
                    pendingChanges.force = true;
                    return;
                }

                // We're online: force a reload now
                setEditable(false);
                UI.alert(Messages.realtime_unrecoverableError, function () {
                    common.gotoURL();
                });

            }, PENDING_TIMEOUT);
            if (offline) {
                pendingChanges.force = true;
                return;
            }

            var changes = obj.changes;
            if (obj.type === "cp_theme") {
                changes = JSON.stringify([JSON.stringify(obj)]);
            }

            // Send the changes
            content.locks = content.locks || {};
            rtChannel.sendMsg({
                type: "saveChanges",
                changes: parseChanges(changes, obj.type === "cp_theme"),
                changesIndex: ooChannel.cpIndex || 0,
                locks: getUserLock(getId(), true),
                excelAdditionalInfo: obj.excelAdditionalInfo,
                startSaveChanges: obj.startSaveChanges,
                endSaveChanges: obj.endSaveChanges
            }, null, function (err, hash) {
                if (err) {
                    return void console.error(err);
                }

                if (pendingChanges[uid]) {
                    clearTimeout(pendingChanges[uid]);
                    delete pendingChanges[uid];
                }

                // If endSaveChanges is false, it means the patch is split into
                // several set of changes and this is only a part of it. The last
                // part will have this value to "true"
                if (!obj.endSaveChanges) {
                    send({
                        type: "savePartChanges",
                        changesIndex: -1,
                        time: +new Date()
                    });
                } else {
                    // Call unSaveLock to tell onlyoffice that the patch was sent.
                    // It will allow you to make changes to another cell.
                    // If there is an error and unSaveLock is not called, onlyoffice
                    // will try to send the patch again
                    send({
                        type: "unSaveLock",
                        index: ooChannel.cpIndex,
                        time: +new Date()
                    });
                }
                // Increment index and update latest hash
                ooChannel.cpIndex++;
                ooChannel.lastHash = hash;
                // Check if a checkpoint is needed
                makeCheckpoint();
                // Remove my locks
                delete content.locks[getId()];
                oldLocks = JSON.parse(JSON.stringify(content.locks));
                APP.onLocal();
            });
        };

        APP.testArr = [
            ['a','b',1,'d'],
            ['e',undefined,'g','h']
        ];
        var makePatch = APP.makePatch = function (arr) {
            var w = getWindow();
            if (!w) { return; }
            // Define OO classes
            var AscCommonExcel = w.AscCommonExcel;
            var CellValueData = AscCommonExcel.UndoRedoData_CellValueData;
            var CCellValue = AscCommonExcel.CCellValue;
            //var History = w.AscCommon.History;
            var AscCH = w.AscCH;
            var Asc = w.Asc;
            var UndoRedoData_CellSimpleData = AscCommonExcel.UndoRedoData_CellSimpleData;
            var editor = getEditor();

            var Id = editor.GetSheet(0).worksheet.Id;
            //History.Create_NewPoint();
            var patches = [];
            arr.forEach(function (arr2, i) {
                arr2.forEach(function (v, j) {
                    var obj = {};
                    if (typeof(v) === "string") { obj.text = v; obj.type = 1; }
                    else if (typeof(v) === "number") { obj.number = v; obj.type = 0; }
                    else { return; }
                    var newValue = new CellValueData(undefined, new CCellValue(obj));
                    var nCol = j;
                    var nRow = i;
                    var patch = new AscCommonExcel.UndoRedoItemSerializable(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_ChangeValue, Id,
                        new Asc.Range(nCol, nRow, nCol, nRow),
                        new UndoRedoData_CellSimpleData(nRow, nCol, undefined, newValue), undefined);
                    patches.push(patch);
                    /*
                    History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_ChangeValue, Id,
                        new Asc.Range(nCol, nRow, nCol, nRow),
                        new UndoRedoData_CellSimpleData(nRow, nCol, undefined, newValue), undefined, true);
                    */
                });
            });
            var oMemory = new w.AscCommon.CMemory();
            var aRes = [];
            patches.forEach(function (item) {
                editor.GetSheet(0).worksheet.workbook._SerializeHistory(oMemory, item, aRes);
            });

            // Make the patch
            var msg = {
                type: "saveChanges",
                changes: parseChanges(JSON.stringify(aRes)),
                changesIndex: ooChannel.cpIndex || 0,
                startSaveChanges: true,
                endSaveChanges: true,
                isExcel: true,
                deleteIndex: null,
                unlock: false,
                releaseLocks: true,
                reSave: true,
                isCoAuthoring: true,
                locks: getUserLock(getId(), true),
                excelAdditionalInfo: null
            };

            // Send the patch
            rtChannel.sendMsg(msg, null, function (err, hash) {
                if (err) {
                    return void console.error(err);
                }
                // Apply it on our side
                ooChannel.send(msg);
                ooChannel.lastHash = hash;
                ooChannel.cpIndex++;
            });
        };


        var makeChannel = function () {
            var msgEv = Util.mkEvent();
            var iframe = $('#cp-app-oo-editor > iframe')[0].contentWindow;
            var type = common.getMetadataMgr().getPrivateData().ooType;
            window.addEventListener('message', function (msg) {
                if (msg.source !== iframe) { return; }
                msgEv.fire(msg);
            });
            var postMsg = function (data) {
                iframe.postMessage(data, ApiConfig.httpSafeOrigin);
            };
            Channel.create(msgEv, postMsg, function (chan) {
                APP.chan = chan;

                var send = ooChannel.send = function (obj, force) {
                    // can't push to OO before reloading cp
                    if (APP.onStrictSaveChanges && !force) { return; }
                    // We only need to release locks for sheets
                    if (type !== "sheet" && obj.type === "releaseLock") { return; }
                    if (type === "presentation" && obj.type === "cp_theme") {
                        console.error(obj);
                        return;
                    }

                    debug(obj, 'toOO');
                    chan.event('CMD', obj);
                    if (obj && obj.type === "saveChanges") {
                        evIntegrationSave.fire();
                    }
                };

                chan.on('CMD', function (obj) {
                    debug(obj, 'fromOO');
                    switch (obj.type) {
                        case "auth":
                            handleAuth(obj, send);
                            break;
                        case "isSaveLock":
                            // TODO ping the server to check if we're online first?
                            if (!offline) {
                                if (APP.waitLock) {
                                    APP.waitLock.reg(function () {
                                        send({
                                            type: "saveLock",
                                            saveLock: false
                                        }, true);
                                    });
                                } else {
                                    send({
                                        type: "saveLock",
                                        saveLock: false
                                    }, true);
                                }
                            }
                            break;
                        case "cursor":
                            if (cursor && cursor.updateCursor) {
                                cursor.updateCursor({
                                    type: "cursor",
                                    messages: [{
                                        cursor: obj.cursor,
                                        time: +new Date(),
                                        user: myUniqueOOId,
                                        useridoriginal: myOOId
                                    }]
                                });
                            }
                            break;
                        case "getLock":
                            handleLock(obj, send);
                            break;
                        case "getMessages":
                            // OO chat messages?
                            send({ type: "message" });
                            break;
                        case "saveChanges":
                            if (readOnly) {
                                return;
                            }

                            // If we have unsaved data before reloading for a checkpoint...
                            if (APP.onStrictSaveChanges) {
                                delete APP.unsavedLocks;
                                APP.unsavedChanges = {
                                    type: "saveChanges",
                                    changes: parseChanges(obj.changes),
                                    changesIndex: ooChannel.cpIndex || 0,
                                    locks: type === "sheet" ? [] : APP.unsavedLocks,
                                    excelAdditionalInfo: null,
                                    recover: true
                                };
                                APP.onStrictSaveChanges();
                                return;
                            }
                            var AscCommon = window.frames[0] && window.frames[0].AscCommon;
                            if (Util.find(AscCommon, ['CollaborativeEditing','m_bFast'])
                                        && APP.themeLocked) {
                                obj = APP.themeLocked;
                                APP.themeLocked = undefined;
                                obj.type = "cp_theme";
                                console.error(obj);
                            }
                            if (APP.themeRemote) {
                                delete APP.themeRemote;
                                send({
                                    type: "unSaveLock",
                                    index: ooChannel.cpIndex,
                                    time: +new Date()
                                });
                                return;
                            }

                            // We're sending our changes to netflux
                            handleChanges(obj, send);
                            // If we're alone, clean up the medias
                            var m = metadataMgr.getChannelMembers().slice().filter(function (nId) {
                                return nId.length === 32;
                            });
                            if (m.length === 1 && APP.loadingImage <= 0) {
                                try {
                                    // "docs" contains the correct images that we've just uploaded
                                    // "docs2" contains the correct images from the .bin checkpoint
                                    // both of them are not reliable in the other case
                                    var docs = getWindow().AscCommon.g_oDocumentUrls.urls;
                                    var docs2 = getEditor().ImageLoader.map_image_index;
                                    var mediasSources = getMediasSources();
                                    Object.keys(mediasSources).forEach(function (name) {
                                        if (!docs && !docs2) { return; }
                                        if (!docs['media/'+name] && !docs2[name]) {
                                            delete mediasSources[name];
                                        }
                                    });
                                    APP.onLocal();
                                } catch (e) {}
                            }
                            break;
                        case "unLockDocument":
                            if (obj.releaseLocks && content.locks && content.locks[getId()]) {
                                send({
                                    type: "releaseLock",
                                    locks: getUserLock(getId())
                                });
                                delete content.locks[getId()];
                                APP.onLocal();
                            }
                            if (obj.isSave) {
                                send({
                                    type: "unSaveLock",
                                    time: -1,
                                    index: -1
                                });
                            }
                            if (APP.onDocumentUnlock) {
                                APP.onDocumentUnlock();
                                APP.onDocumentUnlock = undefined;
                            }
                            break;
                        case 'openDocument':
                            // When duplicating a slide, OO may ask the URLs of the images
                            // in that slide
                            var _obj = obj.message;
                            if (_obj.c === "imgurls") {
                                var _mediasSources = getMediasSources();
                                var images = _obj.data || [];
                                if (!Array.isArray(images)) { return; }
                                var urls = [];
                                nThen(function (waitFor) {
                                    images.forEach(function (name) {
                                        if (/^data\:image/.test(name)) {
                                            Util.fetch(name, waitFor(function (err, u8) {
                                                if (err) { return; }
                                                var b = new Blob([u8]);
                                                urls.push(URL.createObjectURL(b));
                                            }));
                                            return;
                                        }
                                        var data = _mediasSources[name];
                                        if (!data) { return; }
                                        var media = mediasData[data.src];
                                        if (!media) { return; }
                                        urls.push({
                                            path: name,
                                            url: media.blobUrl,
                                        });
                                    });
                                }).nThen(function () {
                                    send({
                                        type: "documentOpen",
                                        data: {
                                            type: "imgurls",
                                            status: "ok",
                                            data: {
                                                urls: urls,
                                                error: 0
                                            }
                                        }
                                    });
                                });
                            }
                            break;
                    }
                });
            });
        };

        var x2tConvertData = function (data, fileName, format, cb) {
            var sframeChan = common.getSframeChannel();
            var editor = getEditor();
            var fonts = editor && editor.FontLoader.fontInfos;
            var files = editor && editor.FontLoader.fontFiles.map(function (f) {
                return { 'Id': f.Id, };
            });
            var type = common.getMetadataMgr().getPrivateData().ooType;
            const images = editor
                ? structuredClone(window.frames[0].AscCommon.g_oDocumentUrls.getUrls())
                : {};

            // Fix race condition which could drop images sometimes
            // ==> make sure each image has a 'media/image_name.ext' entry as well
            Object.keys(images).forEach(function (img) {
                if (/^media\//.test(img)) { return; }
                if (images['media/'+img]) { return; }
                images['media/'+img] = images[img];
            });

            // Add theme images
            var theme = editor && window.frames[0].AscCommon.g_image_loader.map_image_index;
            if (theme) {
                Object.keys(theme).forEach(function (url) {
                    if (!/^(\/|blob:|data:)/.test(url)) {
                        images[url] = url;
                    }
                });
            }

            sframeChan.query('Q_OO_CONVERT', {
                data: data,
                type: type,
                fileName: fileName,
                outputFormat: format,
                images: (editor && window.frames[0].AscCommon.g_oDocumentUrls.urls) || {},
                fonts: fonts,
                fonts_files: files,
                mediasSources: getMediasSources(),
                mediasData: mediasData
            }, function (err, obj) {
                if (err || !obj || !obj.data) {
                    UI.warn(Messages.error);
                    return void cb();
                }
                cb(obj.data, obj.images);
            }, {
                raw: true
            });
        };

        // When download a sheet from the drive, we must wait for all the images
        // to be downloaded and decrypted before converting to xlsx
        var downloadImages = {};

        var firstOO = true;
        startOO = function (blob, file, force) {
            if (APP.ooconfig && !force) { return void console.error('already started'); }
            var url = URL.createObjectURL(blob);
            var lock = !APP.history && (APP.migrate);

            var fromContent = metadataMgr.getPrivateData().fromContent;
            if (!firstOO) { fromContent = undefined; }
            firstOO = false;

            // Starting from version 3, we can use the view mode again
            // defined but never used
            //var mode = (content && content.version > 2 && lock) ? "view" : "edit";

            var lang = (window.cryptpadLanguage || navigator.language || navigator.userLanguage || '').slice(0,2);

            // Config
            APP.ooconfig = {
                "document": {
                    "fileType": file.type,
                    "key": "fresh",
                    "title": file.title,
                    "url": url,
                    "permissions": {
                        "download": false,
                        "print": true,
                    }
                },
                "documentType": file.doc,
                "editorConfig": {
                    customization: {
                        chat: false,
                        logo: {
                            url: "/bounce/#" + encodeURIComponent('https://www.onlyoffice.com')
                        },
                        comments: !lock && !readOnly
                    },
                    "user": {
                        "id": String(myOOId), //"c0c3bf82-20d7-4663-bf6d-7fa39c598b1d",
                        "firstname": metadataMgr.getUserData().name || Messages.anonymous,
                        "name": metadataMgr.getUserData().name || Messages.anonymous,
                    },
                    "mode": "edit",
                    "lang": lang
                },
                "events": {
                    "onAppReady": function(/*evt*/) {
                        var $iframe = $('iframe[name="frameEditor"]').contents();
                        $iframe.prop('tabindex', '-1');
                        var $tb = $iframe.find('head');
                        var css = // Old OO
                                  //'#id-toolbar-full .toolbar-group:nth-child(2), #id-toolbar-full .separator:nth-child(3) { display: none; }' +
                                  //'#fm-btn-save { display: none !important; }' +
                                  //'#panel-settings-general tr.autosave { display: none !important; }' +
                                  //'#panel-settings-general tr.coauth { display: none !important; }' +
                                  //'#header { display: none !important; }' +
                                  '#title-doc-name { display: none !important; }' +
                                  '#title-user-name { display: none !important; }' +
           (supportsXLSX() ? '' : '#slot-btn-dt-print { display: none !important; }') +
                                  // New OO:
                                  'section[data-tab="ins"] .separator:nth-last-child(2) { display: none !important; }' + // separator
                                  '#slot-btn-insequation { display: none !important; }' + // Insert equation
                                  //'#asc-gen125 { display: none !important; }' + // Disable presenter mode
                                  //'.toolbar .tabs .ribtab:not(.canedit) { display: none !important; }' + // Switch collaborative mode
                                  '#fm-btn-info { display: none !important; }' + // Author name, doc title, etc. in "File" (menu entry)
                                  '#panel-info { display: none !important; }' + // Same but content
                                  '#image-button-from-url { display: none !important; }' + // Inline image settings: replace with url
                                  '.cp-from-url, #textart-button-from-url { display: none !important; }' + // Spellcheck language
                                  '.statusbar .cnt-lang { display: none !important; }' + // Spellcheck language
                                  '.statusbar #btn-doc-spell { display: none !important; }' + // Spellcheck button
                                  '#file-menu-panel .devider { display: none !important; }' + // separator in the "File" menu
                                  '#left-btn-spellcheck, #left-btn-about { display: none !important; }'+
                                  'div.btn-users.dropdown-toggle { display: none; !important }';
                        if (readOnly) {
                            css += '#toolbar { display: none !important; }';
                            //css += '#app-title { display: none !important; }'; // OnlyOffice logo + doc title
                            //css += '#file-menu-panel { top: 28px !important; }'; // Position of the "File" menu
                        }
                        $('<style>').text(css).appendTo($tb);
                        setTimeout(function () {
                            $(window).trigger('resize');
                        });
                        if (UI.findOKButton().length) {
                            UI.findOKButton().on('focusout', function () {
                                window.setTimeout(function () { UI.findOKButton().focus(); });
                            });
                        }
                    },
                    "onError": function () {
                        console.error(arguments);
                        if (APP.isDownload) {
                            var sframeChan = common.getSframeChannel();
                            sframeChan.event('EV_OOIFRAME_DONE', '');
                        }
                    },
                    "onDocumentReady": function () {
                        evOnSync.fire();
                        var onMigrateRdy = Util.mkEvent();
                        onMigrateRdy.reg(function () {
                            var div = h('div.cp-oo-x2tXls', [
                                h('span.fa.fa-spin.fa-spinner'),
                                h('span', Messages.oo_sheetMigration_loading)
                            ]);
                            APP.migrateModal = UI.openCustomModal(UI.dialog.customModal(div, {buttons: []}));
                            makeCheckpoint(true);
                        });
                        // DEPRECATED: from version 3, the queue is sent again during init
                        if (APP.migrate && ((content.version || 1) <= 2)) {
                            // The doc is ready, fix the worksheets IDs and push the queue
                            fixSheets();
                            // Push changes since last cp
                            ooChannel.ready = true;
                            var changes = [];
                            var changesIndex;
                            ooChannel.queue.forEach(function (data) {
                                Array.prototype.push.apply(changes, data.msg.changes);
                                changesIndex = data.msg.changesIndex;
                                //ooChannel.send(data.msg);
                            });
                            ooChannel.cpIndex += ooChannel.queue.length;
                            var last = ooChannel.queue.pop();
                            if (last) { ooChannel.lastHash = last.hash; }

                            var onDocUnlock = function () {
                                // Migration required but read-only: continue...
                                if (readOnly) {
                                    setEditable(true);
                                    try { getEditor().asc_setRestriction(true); } catch (e) {}
                                } else {
                                    // No changes after the cp: migrate now
                                    onMigrateRdy.fire();
                                }
                            };


                            // Send the changes all at once
                            if (changes.length) {
                                setTimeout(function () {
                                    ooChannel.send({
                                        type: 'saveChanges',
                                        changesIndex: changesIndex,
                                        changes: changes,
                                        locks: []
                                    });
                                    APP.onDocumentUnlock = onDocUnlock;
                                }, 5000);
                                return;
                            }
                            onDocUnlock();
                            return;
                        }

                        if (lock || readOnly) {
                            try { getEditor().asc_setRestriction(true); } catch (e) {}
                            //getEditor().setViewModeDisconnect(); // can't be used anymore, display an OO error popup
                        } else {
                            setEditable(true);
                            deleteOfflineLocks();
                            handleNewLocks({}, content.locks);
                            if (APP.unsavedChanges) {
                                var unsaved = APP.unsavedChanges;
                                delete APP.unsavedChanges;
                                rtChannel.sendMsg(unsaved, null, function (err, hash) {
                                    if (err) { return void UI.alert(Messages.oo_lostEdits); }
                                    // This is supposed to be a "send" function to tell our OO
                                    // to unlock the cell. We use this to know that the patch was
                                    // correctly sent so that we can apply it to our OO too.
                                    ooChannel.send(unsaved);
                                    ooChannel.cpIndex++;
                                    ooChannel.lastHash = hash;
                                });
                            }

                            if (APP.startNew) {
                                var w = getWindow();
                                if (lang === "fr") { lang = 'fr-fr'; }
                                var l = w.Common.util.LanguageInfo.getLocalLanguageCode(lang);
                                getEditor().asc_setDefaultLanguage(l);
                            }

                            if (APP.oldCursor) {
                                var app = common.getMetadataMgr().getPrivateData().ooType;
                                var d;
                                if (app === 'doc') {
                                    d = getEditor().GetDocument().Document;
                                } else if (app === 'presentation') {
                                    d = getEditor().GetPresentation().Presentation;
                                }
                                if (d) {
                                    d.SetSelectionState(APP.oldCursor);
                                    d.UpdateSelection();
                                }
                                delete APP.oldCursor;
                            }
                            if (integrationChannel) {
                                APP.onDocumentUnlock = () => {
                                    integrationChannel.event('EV_INTEGRATION_READY');
                                };
                            }
                        }
                        delete APP.startNew;

                        if (fromContent && !lock && Array.isArray(fromContent.content)) {
                            makePatch(fromContent.content);
                        }

                        if (APP.isDownload) {
                            delete APP.isDownload;
                            var bin = getContent();
                            if (!supportsXLSX()) {
                                return void sframeChan.event('EV_OOIFRAME_DONE', bin, {raw: true});
                            }
                            nThen(function (waitFor) {
                                // wait for all the images to be loaded before converting
                                Object.keys(downloadImages).forEach(function (name) {
                                    downloadImages[name].reg(waitFor());
                                });
                            }).nThen(function () {
                                x2tConvertData(bin, 'filename.bin', file.type, function (xlsData) {
                                    sframeChan.event('EV_OOIFRAME_DONE', xlsData, {raw: true});
                                });
                            });
                            return;
                        }


                        if (isLockedModal.modal && force) {
                            isLockedModal.modal.closeModal();
                            delete isLockedModal.modal;
                            if (!APP.history) {
                                $('#cp-app-oo-editor > iframe')[0].contentWindow.focus();
                            }
                        }

                        if (APP.template) {
                            try { getEditor().asc_setRestriction(true); } catch (e) {}
                            //getEditor().setViewModeDisconnect();
                            UI.removeLoadingScreen();
                            makeCheckpoint(true);
                            return;
                        }

                        APP.onLocal(); // Add our data to the userlist

                        if (APP.history) {
                            try {
                                getEditor().asc_setRestriction(true);
                            } catch (e) {}
                        }

                        if (lock && !readOnly) { // Lock = !history && migrate
                            onMigrateRdy.fire();
                        }

                        if (APP.initCheckpoint) {
                            getEditor().asc_setRestriction(true);
                            makeCheckpoint(true);
                        }

                        // Check if history can/should be trimmed
                        var cp = getLastCp();
                        if (cp && cp.file && cp.hash) {
                            var channels = [{
                                channel: content.channel,
                                lastKnownHash: cp.hash
                            }];
                            common.checkTrimHistory(channels);
                        }
                    }
                }
            };
            /*
            // NOTE: Make sure it won't break anaything new (Firefox setTimeout bug)
            window.onbeforeunload = function () {
                var ifr = document.getElementsByTagName('iframe')[0];
                if (ifr) { ifr.remove(); }
            };
            */

            APP.getUserColor = function (userId) {
                var hex;
                Object.keys(content.ids || {}).some(function (k) {
                    var u = content.ids[k];
                    if (Number(u.ooid) === Number(userId)) {
                        var md = common.getMetadataMgr().getMetadataLazy();
                        if (md && md.users && md.users[u.netflux]) {
                            hex = md.users[u.netflux].color;
                        }
                        return true;
                    }
                });
                if (hex) {
                    var rgb = Util.hexToRGB(hex);
                    return {
                        r: rgb[0],
                        g: rgb[1],
                        b: rgb[2],
                        a: 255
                    };
                }
            };

            APP.UploadImageFiles = function (files, type, id, jwt, cb) {
                return void cb();
            };
            APP.AddImage = function(cb1, cb2) {
                APP.AddImageSuccessCallback = cb1;
                APP.AddImageErrorCallback = cb2;
                common.openFilePicker({
                    types: ['file'],
                    where: ['root'],
                    filter: {
                        fileType: ['image/']
                    }
                }, function (data) {
                    if (data.type !== 'file') {
                        debug("Unexpected data type picked " + data.type);
                        return;
                    }
                    var name = data.name;

                    // Add image to the list
                    var mediasSources = getMediasSources();

                    // Check if name already exists
                    var getUniqueName = function (name, mediasSources) {
                        var get = function () {
                            var s = name.split('.');
                            if (s.length > 1) {
                                s[s.length - 2] = s[s.length - 2] + '-' + Util.uid();
                                name = s.join('.');
                            } else {
                                name += '-'+ Util.uid();
                            }
                        };
                        while (mediasSources[name]) { get(); }
                        return name;
                    };
                    if (mediasSources[name]) {
                        name = getUniqueName(name, mediasSources);
                        data.name = name;
                    }
                    mediasSources[name] = data;
                    APP.onLocal();

                    APP.realtime.onSettle(function () {
                        APP.getImageURL(name, function(url) {
                            debug("CRYPTPAD success add " + name);
                            common.setPadAttribute('atime', +new Date(), null, data.href);
                            APP.AddImageSuccessCallback({
                                name: name,
                                url: url
                            });
                        });
                    });
                });
            };

            APP.remoteTheme = function () {
                /*
                    APP.themeRemote = true;
                */
            };
            APP.changeTheme = function (/*id*/) {
                /*
                // disabled:
Uncaught TypeError: Cannot read property 'calculatedType' of null
    at CPresentation.changeTheme (sdk-all.js?ver=4.11.0-1633612942653-1633619288217:15927)
                */

                /*
                APP.themeChanged = {
                    id: id
                };
                */
            };
            APP.openURL = function (url) {
                common.openUnsafeURL(url);
            };

            APP.loadingImage = 0;
            APP.getImageURL = function(name, callback) {
                if (name && /^data:image/.test(name)) {
                    return void callback('');
                }

                var mediasSources = getMediasSources();
                var data = mediasSources[name];
                downloadImages[name] = Util.mkEvent(true);

                if (typeof data === 'undefined') {
                    if (/^http/.test(name) && /slide\/themes\/theme/.test(name)) {
                        Util.fetch(name, function (err, u8) {
                            if (err) { return; }
                            mediasData[name] = {
                                blobUrl: name,
                                content: u8,
                                name: name
                            };
                            var b = new Blob([u8], {type: "image/jpeg"});
                            var blobUrl = URL.createObjectURL(b);
                            return void callback(blobUrl);
                        });
                        return;
                    }
                    debug("CryptPad - could not find matching media for " + name);
                    return void callback("");
                }

                var blobUrl = (typeof mediasData[data.src] === 'undefined') ? "" : mediasData[data.src].blobUrl;
                if (blobUrl) {
                    delete downloadImages[name];
                    debug("CryptPad Image already loaded " + blobUrl);

                    // Fix: https://github.com/cryptpad/cryptpad/issues/1500
                    // Maybe OO was reloaded, but the CryptPad cache is still intact?
                    // -> Add the image to OnlyOffice again.
                    const documentUrls = window.frames[0].AscCommon.g_oDocumentUrls;
                    if (!(data.name in documentUrls.getUrls())) {
                        documentUrls.addImageUrl(data.name, blobUrl);
                    }

                    return void callback(blobUrl);
                }

                APP.loadingImage++;
                Util.fetch(data.src, function (err, u8) {
                    if (err) {
                        APP.loadingImage--;
                        console.error(err);
                        return void callback("");
                    }
                    try {
                        debug("Decrypt with key " + data.key);
                        FileCrypto.decrypt(u8, Nacl.util.decodeBase64(data.key), function (err, res) {
                            APP.loadingImage--;
                            if (err || !res.content) {
                                debug("Decrypting failed");
                                return void callback("");
                            }

                            try {
                                var blobUrl = URL.createObjectURL(res.content);
                                // store media blobUrl and content for cache and export
                                var mediaData = {
                                    blobUrl : blobUrl,
                                    content : "",
                                    name: name
                                };
                                mediasData[data.src] = mediaData;
                                var reader = new FileReader();
                                reader.onloadend = function () {
                                    debug("MediaData set");
                                    mediaData.content = reader.result;
                                    downloadImages[name].fire();
                                };
                                reader.readAsArrayBuffer(res.content);
                                debug("Adding CryptPad Image " + data.name + ": " +  blobUrl);
                                window.frames[0].AscCommon.g_oDocumentUrls.addImageUrl(data.name, blobUrl);
                                callback(blobUrl);
                            } catch (e) {}
                        });
                    } catch (e) {
                        APP.loadingImage--;
                        debug("Exception decrypting image " + data.name);
                        console.error(e);
                        callback("");
                    }
                }, void 0, common.getCache());
            };

            APP.docEditor = new window.DocsAPI.DocEditor("cp-app-oo-placeholder-a", APP.ooconfig);
            ooLoaded = true;
            makeChannel();
        };

        APP.printPdf = function (obj, cb) {
            var bin = getContent();
            x2tConvertData({
                buffer: obj.data,
                bin: bin
            }, 'output.bin', 'pdf', function (xlsData) {
                if (!xlsData) { return; }
                var md = common.getMetadataMgr().getMetadataLazy();
                var type = common.getMetadataMgr().getPrivateData().ooType;
                var title = md.title || md.defaultTitle || type;
                var blob = new Blob([xlsData], {type: "application/pdf"});
                UI.removeModals();
                cb();
                saveAs(blob, APP.exportPdfName || title+'.pdf');
                delete APP.exportPdfName;
            });
        };

        var x2tSaveAndConvertData = function(data, filename, extension, finalFilename) {
            var type = common.getMetadataMgr().getPrivateData().ooType;
            var e = getEditor();

            // PDF
            if (type === "sheet" && extension === "pdf") {
                var d = e.asc_nativePrint(undefined, undefined, 0x101).ImData;
                x2tConvertData({
                    buffer: d.data,
                    bin: data
                }, filename, extension, function (res) {
                    if (res) {
                        var _blob = new Blob([res], {type: "application/pdf;charset=utf-8"});
                        UI.removeModals();
                        saveAs(_blob, finalFilename);
                    }
                });
                return;
            }
            if (extension === "pdf") {
                APP.exportPdfName = finalFilename;
                return void e.asc_Print({});
            }
            x2tConvertData(data, filename, extension, function (xlsData) {
                UI.removeModals();
                if (xlsData) {
                    var blob = new Blob([xlsData], {type: "application/bin;charset=utf-8"});
                    saveAs(blob, finalFilename);
                    return;
                }
                UI.warn(Messages.error);
            });
        };

        var exportXLSXFile = function() {
            var text = getContent();
            var suggestion = Title.suggestTitle(Title.defaultTitle);
            var ext = ['.xlsx', '.ods', '.bin', '.pdf'];
            var type = common.getMetadataMgr().getPrivateData().ooType;
            var warning = '';
            if (type==="presentation") {
                ext = ['.pptx', '.odp', '.bin', '.pdf'];
            } else if (type==="doc") {
                ext = ['.docx', '.odt', '.bin', '.pdf'];
            }

            if (!supportsXLSX()) {
                ext = ['.bin'];
                warning = h('div.alert.alert-info.cp-alert-top', Messages.oo_conversionSupport);
            }

            var types = ext.map(function (val) {
                return {
                    tag: 'a',
                    attributes: {
                        'data-value': val,
                        href: '#'
                    },
                    content: val
                };
            });
            var dropdownConfig = {
                text: ext[0], // Button initial text
                caretDown: true,
                options: types, // Entries displayed in the menu
                isSelect: true,
                initialValue: ext[0],
                common: common
            };
            var $select = UIElements.createDropdown(dropdownConfig);

            var promptMessage = h('span', [
                Messages.exportPrompt,
                warning
            ]);

            UI.prompt(promptMessage, Util.fixFileName(suggestion), function (filename) {
                // $select.getValue()
                if (!(typeof(filename) === 'string' && filename)) { return; }
                var ext = ($select.getValue() || '').slice(1);
                if (ext === 'bin') {
                    var blob = new Blob([text], {type: "application/bin;charset=utf-8"});
                    saveAs(blob, filename+'.bin');
                    return;
                }

                var content = h('div.cp-oo-x2tXls', [
                    h('span.fa.fa-spin.fa-spinner'),
                    h('span', Messages.oo_exportInProgress)
                ]);
                UI.openCustomModal(UI.dialog.customModal(content, {buttons: []}));

                setTimeout(function () {
                    x2tSaveAndConvertData(text, "filename.bin", ext, filename+'.'+ext);
                }, 100);
            }, {
                typeInput: $select[0]
            }, true);
            $select.find('button').addClass('btn');
        };

        var x2tImportImagesInternal = function(images, i, callback) {
            if (i >= images.length) {
                callback();
            } else {
                debug("Import image " + i);
                var handleFileData = {
                    name: images[i].name,
                    mediasSources: getMediasSources(),
                    callback: function() {
                        debug("next image");
                        x2tImportImagesInternal(images, i+1, callback);
                    },
                };
                var fileData = images[i].data;
                debug("Buffer");
                debug(fileData.buffer);
                var blob = new Blob([fileData.buffer], {type: 'image/png'});
                blob.name = images[i].name;
                APP.FMImages.handleFile(blob, handleFileData);
            }
        };

        var x2tImportImages = function (images, callback) {
            if (!APP.FMImages) {
                var fmConfigImages = {
                    noHandlers: true,
                    noStore: true,
                    body: $('body'),
                    onUploaded: function (ev, data) {
                        if (!ev.callback) { return; }
                        debug("Image uploaded at " + data.url);
                        var parsed = Hash.parsePadUrl(data.url);
                        if (parsed.type === 'file') {
                            var secret = Hash.getSecrets('file', parsed.hash, data.password);
                            var fileHost = privateData.fileHost || privateData.origin;
                            var src = fileHost + Hash.getBlobPathFromHex(secret.channel);
                            var key = Hash.encodeBase64(secret.keys.cryptKey);
                            debug("Final src: " + src);
                            ev.mediasSources[ev.name] = { name : ev.name, src : src, key : key };
                        }
                        ev.callback();
                    }
                };
                APP.FMImages = common.createFileManager(fmConfigImages);
            }

            // Import Images
            debug("Import Images");
            debug(images);
            x2tImportImagesInternal(images, 0, function() {
                debug("Sync media sources elements");
                debug(getMediasSources());
                APP.onLocal();
                debug("Import Images finalized");
                callback();
            });
        };


        var x2tImportData = function (data, filename, extension, callback) {
            x2tConvertData(new Uint8Array(data), filename, extension, function (binData, images) {
                if (!binData) { return void callback(); }
                x2tImportImages(images, function() {
                    callback(binData);
                });
            });
        };

        var importFile = function(content) {
            // Abort if there is another real user in the channel (history keeper excluded)
            var m = metadataMgr.getChannelMembers().slice().filter(function (nId) {
                return nId.length === 32;
            });
            if (m.length > 1) {
                UI.removeModals();
                return void UI.alert(Messages.oo_cantUpload);
            }
            if (!content) {
                UI.removeModals();
                return void UI.alert(Messages.oo_invalidFormat);
            }
            var blob = new Blob([content], {type: 'plain/text'});
            var file = getFileType();
            blob.name = (metadataMgr.getMetadataLazy().title || file.doc) + '.' + file.type;
            var uploadedCallback = function() {
                UI.removeModals();
                UI.confirm(Messages.oo_uploaded, function (yes) {
                    try {
                        getEditor().asc_setRestriction(true);
                    } catch (e) {}
                    if (!yes) { return; }
                    common.gotoURL();
                });
            };
            var data = {
                hash: ooChannel.lastHash,
                index: ooChannel.cpIndex,
                callback: uploadedCallback
            };
            APP.FM.handleFile(blob, data);
        };

        var importXLSXFile = function(content, filename, ext) {
            // Perform the x2t conversion
            debug("Filename");
            debug(filename);
            if (ext === "bin") {
                return void importFile(content);
            }
            if (!supportsXLSX()) {
                return void UI.alert(Messages.oo_invalidFormat);
            }
            var div = h('div.cp-oo-x2tXls', [
                h('span.fa.fa-spin.fa-spinner'),
                h('span', Messages.oo_importInProgress)
            ]);
            UI.openCustomModal(UI.dialog.customModal(div, {buttons: []}));
            setTimeout(function () {
                x2tImportData(new Uint8Array(content), filename.name, "bin", function(c) {
                    if (!c) {
                        UI.removeModals();
                        return void UI.warn(Messages.error);
                    }
                    importFile(c);
                });
            }, 100);
        };

        var loadDocument = function (noCp, useNewDefault, i) {
            if (ooLoaded) { return; }
            var type = common.getMetadataMgr().getPrivateData().ooType;
            var file = getFileType();
            if (!noCp) {
                var lastCp = getLastCp(false, i);
                // If the last checkpoint is empty, load the "initial" doc instead
                if (!lastCp || !lastCp.file) { return void loadDocument(true, useNewDefault); }
                // Load latest checkpoint
                return void loadLastDocument(lastCp)
                    .then(({blob, fileType}) => {
                        startOO(blob, fileType);
                    })
                    .catch(() => {
                        // Checkpoint error: load the previous one
                        i = i || 0;
                        loadDocument(noCp, useNewDefault, ++i);
                    });
            }
            var blob = loadInitDocument(type, useNewDefault);
            startOO(blob, file);
        };

        var initializing = true;
        var $bar = $('#cp-toolbar');

        config = {
            patchTransformer: ChainPad.SmartJSONTransformer,
            // cryptpad debug logging (default is 1)
            // logLevel: 0,
            validateContent: function (content) {
                try {
                    JSON.parse(content);
                    return true;
                } catch (e) {
                    debug("Failed to parse, rejecting patch");
                    return false;
                }
            }
        };

        var stringifyInner = function () {
            var obj = {
                content: content,
                metadata: metadataMgr.getMetadataLazy()
            };
            // stringify the json and send it into chainpad
            return stringify(obj);
        };

        var pinImages = function () {
            if (content.mediasSources) {
                var toPin = Object.keys(content.mediasSources || {}).map(function (id) {
                    var data = content.mediasSources[id] || {};
                    var src = data.src;
                    if (!src) { return; }
                    // Remove trailing slash
                    if (src.slice(-1) === '/') {
                        src = src.slice(0, -1);
                    }
                    // Extract the channel id from the source href
                    return src.slice(src.lastIndexOf('/') + 1);
                }).filter(Boolean);
                sframeChan.query('EV_OO_PIN_IMAGES', toPin);
            }
        };

        var setStrictEditing = function () {
            if (APP.isFast) { return; }
            var editor = getEditor();
            var editing = editor.asc_isDocumentModified ? editor.asc_isDocumentModified() : editor.isDocumentModified();
            if (editing) {
                evOnPatch.fire();
            } else {
                evOnSync.fire();
            }
        };
        APP.onFastChange = function (isFast) {
            APP.isFast = isFast;
            if (isFast) {
                if (APP.hasChangedInterval) {
                    window.clearInterval(APP.hasChangedInterval);
                }
                return;
            }
            setStrictEditing();
            APP.hasChangedInterval = window.setInterval(setStrictEditing, 500);
        };

        APP.getContent = function () { return content; };

        APP.onLocal = config.onLocal = function () {
            if (initializing) { return; }
            if (readOnly) { return; }

            // Update metadata
            var content = stringifyInner();
            APP.realtime.contentUpdate(content);
            pinImages();
        };

        const loadCp = async function (cp, keepQueue) {
            if (!isLockedModal.modal) {
                isLockedModal.modal = UI.openCustomModal(isLockedModal.content);
            }
            try {
                const {blob, fileType} = await loadLastDocument(cp);
                if (!keepQueue) { ooChannel.queue = []; }
                resetData(blob, fileType);
            } catch (e) {
                var file = getFileType();
                var type = common.getMetadataMgr().getPrivateData().ooType;
                var blob = loadInitDocument(type, true);
                if (!keepQueue) { ooChannel.queue = []; }
                resetData(blob, file);
            }
        };

        var loadTemplate = function (href, pw, parsed) {
            APP.history = true;
            APP.template = true;
            var editor = getEditor();
            if (editor) {
                try { getEditor().asc_setRestriction(true); } catch (e) {}
            }
            var _content = parsed.content;

            // Get checkpoint
            var hashes = _content.hashes || {};
            var medias = _content.mediasSources;
            var idx = sortCpIndex(hashes);
            var lastIndex = idx[idx.length - 1];
            var lastCp = hashes[lastIndex] || {};

            // Current cp or initial hash (invalid hash ==> initial hash)
            var toHash = lastCp.hash || 'NONE';
            // Last hash
            var fromHash = 'NONE';

            content.mediasSources = medias;

            sframeChan.query('Q_GET_HISTORY_RANGE', {
                href: href,
                password: pw,
                channel: _content.channel,
                lastKnownHash: fromHash,
                toHash: toHash,
            }, function (err, data) {
                if (err) { return void console.error(err); }
                if (!Array.isArray(data.messages)) { return void console.error('Not an array!'); }

                // The first "cp" in history is the empty doc. It doesn't include the first patch
                // of the history
                var initialCp = !lastCp.hash;

                var messages = (data.messages || []).slice(initialCp ? 0 : 1);

                ooChannel.queue = messages.map(function (obj) {
                    return {
                        hash: obj.serverHash,
                        msg: JSON.parse(obj.msg)
                    };
                });
                ooChannel.historyLastHash = ooChannel.lastHash;
                ooChannel.currentIndex = ooChannel.cpIndex;
                loadCp(lastCp, true);
            });
        };

        var openTemplatePicker = function () {
            var metadataMgr = common.getMetadataMgr();
            var type = metadataMgr.getPrivateData().app;
            var sframeChan = common.getSframeChannel();
            var pickerCfgInit = {
                types: [type],
                where: ['template'],
                hidden: true
            };
            var pickerCfg = {
                types: [type],
                where: ['template'],
            };
            var onConfirm = function () {
                common.openFilePicker(pickerCfg, function (data) {
                    if (data.type !== type) { return; }
                    UI.addLoadingScreen({hideTips: true});
                    sframeChan.query('Q_OO_TEMPLATE_USE', {
                        href: data.href,
                    }, function (err, val) {
                        var parsed;
                        try {
                            parsed = JSON.parse(val);
                        } catch (e) {
                            console.error(e, val);
                            UI.removeLoadingScreen();
                            return void UI.warn(Messages.error);
                        }
                        console.error(data);
                        loadTemplate(data.href, data.password, parsed);
                    });
                });
            };
            sframeChan.query("Q_TEMPLATE_EXIST", type, function (err, data) {
                if (data) {
                    common.openFilePicker(pickerCfgInit);
                    onConfirm();
                } else {
                    UI.alert(Messages.template_empty);
                }
            });
        };

        sframeChan.on('EV_INTEGRATION_DOWNLOADAS', function (format) {
            console.error('DOWNLOAD AS RECEIVED');
            var data = getContent();
            x2tConvertData(data, "document.bin", format, function (xlsData) {
                UI.removeModals();
                if (xlsData) {
                    var blob = new Blob([xlsData], {type: "application/bin;charset=utf-8"});
                    if (integrationChannel) {
                        integrationChannel.event('EV_INTEGRATION_ON_DOWNLOADAS',
                                                blob, { raw: true });
                    }
                    return;
                }
                UI.warn(Messages.error);
            });
        });
        sframeChan.on('EV_OOIFRAME_REFRESH', function (data) {
            // We want to get the "bin" content of a sheet from its json in order to download
            // something useful from a non-onlyoffice app (download from drive or settings).
            // We don't want to initialize a full pad in async-store because we only need a
            // static version, so we can use "openVersionHash" which is based on GET_HISTORY_RANGE
            APP.isDownload = data.downloadId;
            APP.downloadType = data.type;
            downloadImages = {};
            var json = data && data.json;
            if (!json || !json.content) {
                return void sframeChan.event('EV_OOIFRAME_DONE', '');
            }
            content = json.content;
            readOnly = true;
            var version = (!content.version || content.version === 1) ? 'v1/' :
                          (content.version <= 3 ? 'v2b/' : CURRENT_VERSION+'/');
            var s = h('script', {
                type:'text/javascript',
                src: '/common/onlyoffice/dist/'+version+'web-apps/apps/api/documents/api.js'
            });
            $('#cp-app-oo-editor').empty().append(h('div#cp-app-oo-placeholder-a')).append(s);

            var hashes = content.hashes || {};
            var idx = sortCpIndex(hashes);
            var lastIndex = idx[idx.length - 1];

            // We're going to open using "openVersionHash" to avoid reimplementing existing code.
            // To do so, we're using a version corresponding to the latest checkpoint with a
            // minor version of 0. "openVersionHash" knows that it needs to give us the latest
            // version when "APP.isDownload" is true.
            var sheetVersion = lastIndex + '.0';
            openVersionHash(sheetVersion);
        });

        config.onInit = function (info) {
            var privateData = metadataMgr.getPrivateData();
            metadataMgr.setDegraded(false); // FIXME degraded moded unsupported (no cursor channel)

            readOnly = privateData.readOnly;

            Title = common.createTitle({});

            var configTb = {
                displayed: ['pad'],
                title: Title.getTitleConfig(),
                metadataMgr: metadataMgr,
                readOnly: readOnly,
                realtime: info.realtime,
                spinner: {
                    onPatch: evOnPatch,
                    onSync: evOnSync
                },
                sfCommon: common,
                $container: $bar,
                $contentContainer: $('#cp-app-oo-container')
            };
            toolbar = APP.toolbar = Toolbar.create(configTb);
            toolbar.showColors();
            Title.setToolbar(toolbar);

            if (window.CP_DEV_MODE) {

                var $save = common.createButton('save', true, {}, function () {
                    makeCheckpoint(true);
                });
                $save.appendTo(toolbar.$bottomM);

                var $dlMedias = common.createButton('', true, {
                    name: 'dlmedias',
                    icon: 'fa-download',
                }, function () {
                    require(['/components/jszip/dist/jszip.min.js'], function (JsZip) {
                        var zip = new JsZip();
                        Object.keys(mediasData || {}).forEach(function (url) {
                            var obj = mediasData[url];
                            var b = new Blob([obj.content]);
                            zip.file(obj.name, b, {binary: true});
                        });
                        setTimeout(function () {
                            zip.generateAsync({type: 'blob'}).then(function (content) {
                                saveAs(content, 'media.zip');
                            });
                        }, 100);
                    });
                }).attr('title', "Download medias");
                $dlMedias.appendTo(toolbar.$bottomM);
            }

            if (!privateData.ooVersionHash) {
            (function () {
                /* add a history button */
                var commit = function () {
                    // Wait for the checkpoint to be uploaded before leaving history mode
                    // (race condition). We use "stopHistory" to remove the history
                    // flag only when the checkpoint is ready.
                    APP.stopHistory = true;
                    makeCheckpoint(true);
                };
                var onPatch = function (patch) {
                    // Patch on the current cp
                    ooChannel.send(JSON.parse(patch.msg));
                };
                var onCheckpoint = function (cp) {
                    // We want to load a checkpoint:
                    loadCp(cp);
                };
                var setHistoryMode = function (bool) {
                    if (bool) {
                        APP.history = true;
                        try { getEditor().asc_setRestriction(true); } catch (e) {}
                        return;
                    }
                    // Cancel button: redraw from lastCp
                    APP.history = false;
                    ooChannel.queue = [];
                    ooChannel.ready = false;
                    // Fill the queue and then load the last CP
                    rtChannel.getHistory(function () {
                        var lastCp = getLastCp();
                        loadCp(lastCp, true);
                    });
                };

                var deleteSnapshot = function (hash) {
                    var md = Util.clone(cpNfInner.metadataMgr.getMetadata());
                    var snapshots = md.snapshots = md.snapshots || {};
                    delete snapshots[hash];
                    metadataMgr.updateMetadata(md);
                    APP.onLocal();
                };
                var makeSnapshot = function (title, cb, obj) {
                    var hash, time;
                    if (obj && obj.hash && obj.time) {
                        hash = obj.hash;
                        time = obj.time;
                    } else {
                        var major = Object.keys(content.hashes).length;
                        var cpIndex = getLastCp().index || 0;
                        var minor = ooChannel.cpIndex - cpIndex;
                        hash = major+'.'+minor;
                        time = +new Date();
                    }
                    var md = Util.clone(metadataMgr.getMetadata());
                    var snapshots = md.snapshots = md.snapshots || {};
                    if (snapshots[hash]) { cb('EEXISTS'); return void UI.warn(Messages.snapshot_error_exists); }
                    snapshots[hash] = {
                        title: title,
                        time: time
                    };
                    metadataMgr.updateMetadata(md);
                    APP.onLocal();
                    APP.realtime.onSettle(cb);
                };
                var loadSnapshot = function (hash) {
                    sframeChan.event('EV_OO_OPENVERSION', {
                        hash: hash
                    });
                };

                var $historyButton = common.createButton('', true, {
                    name: 'history',
                    icon: 'fa-history',
                    text: Messages.historyText,
                    tippy: Messages.historyButton
                });

                $historyButton.click(function () {
                    ooChannel.historyLastHash = ooChannel.lastHash;
                    ooChannel.currentIndex = ooChannel.cpIndex;
                    Feedback.send('OO_HISTORY');
                    var histConfig = {
                        onPatch: onPatch,
                        onCheckpoint: onCheckpoint,
                        onRevert: commit,
                        setHistory: setHistoryMode,
                        makeSnapshot: makeSnapshot,
                        onlyoffice: {
                            hashes: content.hashes || {},
                            channel: content.channel,
                            lastHash: ooChannel.lastHash
                        },
                        $toolbar: $('.cp-toolbar-container')
                    };
                    History.create(common, histConfig);
                });

                var $historyDropdown = UIElements.getEntryFromButton($historyButton);
                $historyDropdown.appendTo(toolbar.$drawer);

                // Snapshots
                var $snapshotButton = common.createButton('snapshots', true, {
                    remove: deleteSnapshot,
                    make: makeSnapshot,
                    load: loadSnapshot
                });
                var $snapshot = UIElements.getEntryFromButton($snapshotButton);
                toolbar.$drawer.append($snapshot);

                // Import template
                var $importTemplateButton = common.createButton('importtemplate', true, {}, openTemplatePicker);
                if ($importTemplateButton && $importTemplateButton.length) {
                    let $template = UIElements.getEntryFromButton($importTemplateButton);
                    $template.appendTo(toolbar.$drawer);
                }

                // Save as template
                if (!metadataMgr.getPrivateData().isTemplate) {
                    var templateObj = {
                        //rt: cpNfInner.chainpad,
                        getTitle: function () { return cpNfInner.metadataMgr.getMetadata().title; },
                        callback: function (title) {
                            var newContent = {};
                            newContent.mediasSources = content.mediasSources;
                            var text = getContent();
                            var blob = new Blob([text], {type: 'plain/text'});
                            var file = getFileType();
                            blob.name = title || (metadataMgr.getMetadataLazy().title || file.doc) + '.' + file.type;
                            var data = {
                                newTemplate: newContent,
                                title: title
                            };
                            APP.FM.handleFile(blob, data);
                        }
                    };
                    let $templateButton = common.createButton('template', true, templateObj);
                    let $template = UIElements.getEntryFromButton($templateButton);
                    toolbar.$drawer.append($template);
                }
            })();
            }

            if (window.CP_DEV_MODE || DISPLAY_RESTORE_BUTTON) {
                common.createButton('', true, {
                    name: 'delete',
                    icon: 'fa-trash',
                    hiddenReadOnly: true
                }).click(function () {
                    if (initializing) { return void console.error('initializing'); }
                    deleteLastCp();
                }).attr('title', 'Delete last checkpoint').appendTo(toolbar.$bottomM);
                common.createButton('', true, {
                    name: 'restore',
                    icon: 'fa-history',
                    hiddenReadOnly: true
                }).click(function () {
                    if (initializing) { return void console.error('initializing'); }
                    restoreLastCp();
                }).attr('title', 'Restore last checkpoint').appendTo(toolbar.$bottomM);
            }

            var $exportXLSXButton = common.createButton('export', true, {}, exportXLSXFile);
            var $exportXLSX = UIElements.getEntryFromButton($exportXLSXButton);
            $exportXLSX.appendTo(toolbar.$drawer);

            var type = privateData.ooType;
            var accept = [".bin", ".ods", ".xlsx"];
            if (type === "presentation") {
                accept = ['.bin', '.odp', '.pptx'];
            } else if (type === "doc") {
                accept = ['.bin', '.odt', '.docx'];
            }
            var first;
            if (!supportsXLSX()) {
                accept = ['.bin'];
                first = function (cb) {
                    var msg = h('span', [
                        Messages.oo_conversionSupport,
                        ' ', h('span', Messages.oo_importBin),
                    ]);
                    UI.confirm(msg, function (yes) {
                        if (yes) {
                            cb();
                        }
                    });
                };
            }

            if (common.isLoggedIn()) {
                window.CryptPad_deleteLastCp = deleteLastCp;
                var $importXLSXButton = common.createButton('import', true, {
                    accept: accept,
                    binary: ["ods", "xlsx", "odt", "docx", "odp", "pptx"],
                    first: first,
                }, importXLSXFile);
                var $importXLSX = UIElements.getEntryFromButton($importXLSXButton);
                // tag button
                var $hashtagButton = common.createButton('hashtag', true);
                var $hashtag = UIElements.getEntryFromButton($hashtagButton);
                $importXLSX.appendTo(toolbar.$drawer);
                $hashtag.appendTo(toolbar.$drawer);
            }

            var $storeButton = common.createButton('storeindrive', true);
            var $store = UIElements.getEntryFromButton($storeButton);
            toolbar.$drawer.append($store);

            // Move to trash button
            var $forgetButton = common.createButton('forget', true, {}, function (err) {
                if (err) { return; }
                setEditable(false);
            });
            var $forget = UIElements.getEntryFromButton($forgetButton);
            toolbar.$drawer.append($forget);

            if (!privateData.isEmbed) {
                var helpMenu = APP.helpMenu = common.createHelpMenu(['beta', 'oo']);
                $('#cp-app-oo-editor').prepend(common.getBurnAfterReadingWarning());
                $('#cp-app-oo-editor').prepend(helpMenu.menu);
                var $helpMenuButton = UIElements.getEntryFromButton(helpMenu.button);
                toolbar.$drawer.append($helpMenuButton);
            }

            var $propertiesButton = common.createButton('properties', true);
            var $properties = UIElements.getEntryFromButton($propertiesButton);
            toolbar.$drawer.append($properties);

            var $copyButton = common.createButton('copy', true);
            var $copy = UIElements.getEntryFromButton($copyButton);
            toolbar.$drawer.append($copy);
        };

        var noCache = false; // Prevent reload loops
        var onCorruptedCache = function () {
            if (noCache) {
                UI.errorLoadingScreen(Messages.unableToDisplay, false, function () {
                    common.gotoURL('');
                });
            }
            noCache = true;
            var sframeChan = common.getSframeChannel();
            sframeChan.event("EV_CORRUPTED_CACHE");
        };

        var firstReady = true;
        config.onReady = function (info) {
            if (APP.realtime !== info.realtime) {
                APP.realtime = info.realtime;
            }

            var userDoc = APP.realtime.getUserDoc();
            var isNew = false;
            var newDoc = true;
            if (userDoc === "" || userDoc === "{}") { isNew = true; }

            if (userDoc !== "") {
                var hjson = JSON.parse(userDoc);

                if (hjson && hjson.metadata) {
                    metadataMgr.updateMetadata(hjson.metadata);
                }
                if (typeof (hjson) !== 'object' || Array.isArray(hjson) ||
                    (hjson.metadata && typeof(hjson.metadata.type) !== 'undefined' &&
                     hjson.metadata.type !== 'oo')) {
                    var errorText = Messages.typeError;
                    UI.errorLoadingScreen(errorText);
                    throw new Error(errorText);
                }
                content = hjson.content || content;
                var newLatest = getLastCp();
                sframeChan.query('Q_OO_SAVE', {
                    hash: newLatest.hash,
                    url: newLatest.file
                }, function () { });
                newDoc = !content.hashes || Object.keys(content.hashes).length === 0;
            } else if (!privateData.isNewFile) {
                // This is an empty doc but not a new file: error
                onCorruptedCache();
                return void console.error("Empty chainpad for a non-empty doc");
            } else {
                Title.updateTitle(Title.defaultTitle);
            }

            APP.startNew = isNew;

            var version = CURRENT_VERSION + '/';
            var msg;
            // Old version detected: use the old OO and start the migration if we can
            if (privateData.ooForceVersion) {
                if (privateData.ooForceVersion === "1") {
                    version = "v1/";
                }
            } else if (content && (!content.version || content.version === 1)) {
                version = 'v1/';
                APP.migrate = true;
                // Registedred ~~users~~ editors can start the migration
                if (common.isLoggedIn() && !readOnly) {
                    content.migration = true;
                    APP.onLocal();
                } else {
                    msg = h('div.alert.alert-warning.cp-burn-after-reading', Messages.oo_sheetMigration_anonymousEditor);
                    if (APP.helpMenu) {
                        $(APP.helpMenu.menu).after(msg);
                    } else {
                        $('#cp-app-oo-editor').prepend(msg);
                    }
                    readOnly = true;
                }
            } else if (content && content.version <= 4) { // V2 or V3
                version = content.version <= 3 ? 'v2b/' : 'v4/';
                APP.migrate = true;
                // Registedred ~~users~~ editors can start the migration
                if (common.isLoggedIn() && !readOnly) {
                    content.migration = true;
                    APP.onLocal();
                } else {
                    msg = h('div.alert.alert-warning.cp-burn-after-reading', Messages.oo_sheetMigration_anonymousEditor);
                    if (APP.helpMenu) {
                        $(APP.helpMenu.menu).after(msg);
                    } else {
                        $('#cp-app-oo-editor').prepend(msg);
                    }
                    readOnly = true;
                }
            } else if (content && content.version <= 5) {
                version = 'v5/';
                APP.migrate = true;
                // Registedred ~~users~~ editors can start the migration
                if (common.isLoggedIn() && !readOnly) {
                    content.migration = true;
                    APP.onLocal();
                } else {
                    msg = h('div.alert.alert-warning.cp-burn-after-reading', Messages.oo_sheetMigration_anonymousEditor);
                    if (APP.helpMenu) {
                        $(APP.helpMenu.menu).after(msg);
                    } else {
                        $('#cp-app-oo-editor').prepend(msg);
                    }
                    readOnly = true;
                }
            } else if (content && content.version <= 6) {
                version = 'v6/';
                APP.migrate = true;
                // Registedred ~~users~~ editors can start the migration
                if (common.isLoggedIn() && !readOnly) {
                    content.migration = true;
                    APP.onLocal();
                } else {
                    msg = h('div.alert.alert-warning.cp-burn-after-reading', Messages.oo_sheetMigration_anonymousEditor);
                    if (APP.helpMenu) {
                        $(APP.helpMenu.menu).after(msg);
                    } else {
                        $('#cp-app-oo-editor').prepend(msg);
                    }
                    readOnly = true;
                }
            }
            // NOTE: don't forget to also update the version in 'EV_OOIFRAME_REFRESH'

            // If the sheet is locked by an offline user, remove it
            if (content && content.saveLock && !isUserOnline(content.saveLock)) {
                content.saveLock = undefined;
                APP.onLocal();
            } else if (content && content.saveLock) {
                // If someone is currently creating a checkpoint (and locking the sheet),
                // make sure it will end (maybe you'll have to make the checkpoint yourself)
                checkCheckpoint();
            }

            var s = h('script', {
                type:'text/javascript',
                src: '/common/onlyoffice/dist/'+version+'web-apps/apps/api/documents/api.js'
            });
            $('#cp-app-oo-editor').append(s);

            if (metadataMgr.getPrivateData().burnAfterReading && content && content.channel) {
                sframeChan.event('EV_BURN_PAD', content.channel);
            }

            if (privateData.ooVersionHash) {
                return void openVersionHash(privateData.ooVersionHash);
            }


            // Only execute the following code the first time we call onReady
            if (!firstReady) {
                setMyId();
                oldHashes = JSON.parse(JSON.stringify(content.hashes));
                initializing = false;
                return void setEditable(!readOnly);
            }
            firstReady = false;


            var useNewDefault = content.version && content.version >= 2;
            openRtChannel(Util.once(function () {
                setMyId();
                oldHashes = JSON.parse(JSON.stringify(content.hashes));
                initializing = false;

                // If we have more than CHECKPOINT_INTERVAL patches in the initial history
                // and we're the only editor in the pad, make a checkpoint
                var v = metadataMgr.getViewers();
                var m = metadataMgr.getChannelMembers().filter(function (str) {
                    return str.length === 32;
                }).length;
                if ((m - v) === 1 && !readOnly && common.isLoggedIn()) {
                    var needCp = ooChannel.queue.length > CHECKPOINT_INTERVAL;
                    APP.initCheckpoint = needCp;
                }


                common.openPadChat(APP.onLocal);

                if (!readOnly) {
                    var cursors = {};
                    common.openCursorChannel(APP.onLocal);
                    cursor = common.createCursor(APP.onLocal);
                    cursor.onCursorUpdate(function (data) {
                        // Leaving user
                        if (data && data.leave && data.id) {
                            // When a netflux user leaves, remove all their cursors
                            Object.keys(cursors).forEach(function (ooid) {
                                var d = cursors[ooid];
                                if (d !== data.id) { return; } // Only continue for the leaving user
                                // Remove from OO UI
                                ooChannel.send({
                                    type: "cursor",
                                    messages: [{
                                        cursor: "10;AgAAADIAAAAAAA==",
                                        time: +new Date(),
                                        user: ooid,
                                        useridoriginal: String(ooid).slice(0,-1),
                                    }]
                                });
                                // Remove from memory
                                delete cursors[ooid];
                            });
                            handleNewIds({}, content.ids);
                        }

                        // Cursor update
                        if (!data || !data.cursor) { return; }
                        // Store the new cursor in memory for this user, with their netflux ID
                        var ooid = Util.find(data.cursor, ['messages', 0, 'user']);
                        if (ooid) { cursors[ooid] = data.id.slice(0,32); }
                        // Update cursor in the UI
                        ooChannel.send(data.cursor);
                    });
                }

                if (APP.startWithTemplate) {
                    var template = APP.startWithTemplate;
                    loadTemplate(template.href, template.password, template.content);
                    return;
                }

                var next = function () {
                    loadDocument(newDoc, useNewDefault);
                    setEditable(!readOnly);
                    UI.removeLoadingScreen();
                };

                let convertImportBlob = (blob, title) => {
                    new Response(blob).arrayBuffer().then(function (buffer) {
                        var u8Xlsx = new Uint8Array(buffer);
                        x2tImportData(u8Xlsx, title, 'bin', function (bin) {
                            if (!bin) {
                                return void UI.errorLoadingScreen(Messages.error);
                            }
                            var blob = new Blob([bin], {type: 'text/plain'});
                            var file = getFileType();
                            resetData(blob, file);
                            //saveToServer(blob, title);
                            Title.updateTitle(title);
                            UI.removeLoadingScreen();
                        });
                    });
                };

                if (privateData.integration) {
                    let cfg = privateData.integrationConfig || {};
                    common.openIntegrationChannel(APP.onLocal);
                    integrationChannel = common.getSframeChannel();
                    var integrationSave = function (cb) {
                        var ext = cfg.fileType;

                        var upload = Util.once(function (_blob) {
                            integrationChannel.query('Q_INTEGRATION_SAVE', {
                                blob: _blob
                            }, cb, {
                                raw: true
                            });
                        });

                        var data = getContent();
                        x2tConvertData(data, "document.bin", ext, function (xlsData) {
                            UI.removeModals();
                            if (xlsData) {
                                var blob = new Blob([xlsData], {type: "application/bin;charset=utf-8"});
                                upload(blob);
                                return;
                            }
                            UI.warn(Messages.error);
                        });
                    };
                    const integrationHasUnsavedChanges = function(unsavedChanges, cb) {
                        integrationChannel.query('Q_INTEGRATION_HAS_UNSAVED_CHANGES', unsavedChanges, cb);
                    };
                    var inte = common.createIntegration(integrationSave,
                                                integrationHasUnsavedChanges);
                    if (inte) {
                        evIntegrationSave.reg(function () {
                            inte.changed();
                        });
                    }
                    integrationChannel.on('Q_INTEGRATION_NEEDSAVE', function (data, cb) {
                        integrationSave(function (obj) {
                            if (obj && obj.error) { console.error(obj.error); }
                            cb();
                        });
                    });
                    if (privateData.initialState) {
                        var blob = privateData.initialState;
                        let title = `document.${cfg.fileType}`;
                        console.error(blob, title);
                        return convertImportBlob(blob, title);
                    }
                }

                if (privateData.isNewFile && privateData.fromFileData) {
                    try {
                    (function () {
                        var data = privateData.fromFileData;

                        var type = data.fileType;
                        var title = data.title;
                        // Fix extension if the file was renamed
                        if (Util.isSpreadsheet(type) && !Util.isSpreadsheet(data.title)) {
                            if (type === 'application/vnd.oasis.opendocument.spreadsheet') {
                                data.title += '.ods';
                            }
                            if (type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                                data.title += '.xlsx';
                            }
                        }
                        if (Util.isOfficeDoc(type) && !Util.isOfficeDoc(data.title)) {
                            if (type === 'application/vnd.oasis.opendocument.text') {
                                data.title += '.odt';
                            }
                            if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                                data.title += '.docx';
                            }
                        }
                        if (Util.isPresentation(type) && !Util.isPresentation(data.title)) {
                            if (type === 'application/vnd.oasis.opendocument.presentation') {
                                data.title += '.odp';
                            }
                            if (type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
                                data.title += '.pptx';
                            }
                        }

                        var href = data.href;
                        var password = data.password;
                        var parsed = Hash.parsePadUrl(href);
                        var secret = Hash.getSecrets('file', parsed.hash, password);
                        var hexFileName = secret.channel;
                        var fileHost = privateData.fileHost || privateData.origin;
                        var src = fileHost + Hash.getBlobPathFromHex(hexFileName);
                        var key = secret.keys && secret.keys.cryptKey;
                        var xhr = new XMLHttpRequest();
                        xhr.open('GET', src, true);
                        xhr.responseType = 'arraybuffer';
                        xhr.onload = function () {
                            if (/^4/.test('' + this.status)) {
                                // fallback to empty sheet
                                console.error(this.status);
                                return void next();
                            }
                            var arrayBuffer = xhr.response;
                            if (arrayBuffer) {
                                var u8 = new Uint8Array(arrayBuffer);
                                FileCrypto.decrypt(u8, key, function (err, decrypted) {
                                    if (err) {
                                        // fallback to empty sheet
                                        console.error(err);
                                        return void next();
                                    }
                                    var blobXlsx = decrypted.content;
                                    new Response(blobXlsx).arrayBuffer().then(function (buffer) {
                                        var u8Xlsx = new Uint8Array(buffer);
                                        x2tImportData(u8Xlsx, data.title, 'bin', function (bin) {
                                            if (!bin) {
                                                return void UI.errorLoadingScreen(Messages.error);
                                            }
                                            var blob = new Blob([bin], {type: 'text/plain'});
                                            saveToServer(blob, data.title);
                                            Title.updateTitle(title);
                                            UI.removeLoadingScreen();
                                        });
                                    });
                                });
                            }
                        };
                        xhr.onerror = function (err) {
                            // fallback to empty sheet
                            console.error(err);
                            next();
                        };
                        xhr.send(null);
                    })();
                    } catch (e) {
                        console.error(e);
                        next();
                    }
                    return;
                }

                next();
            }));
        };

        config.onError = function (err) {
            common.onServerError(err, toolbar, function () {
                setEditable(false);
            });
        };

        var reloadPopup = false;

        var checkNewCheckpoint = function () {
            if (!isLockedModal.modal) {
                isLockedModal.modal = UI.openCustomModal(isLockedModal.content);
            }
            var lastCp = getLastCp();
            loadLastDocument(lastCp)
                .then(({blob, fileType}) => {
                    resetData(blob, fileType);
                })
                .catch((err) => {
                    console.error(err);
                    // On error, do nothing
                    // FIXME lock the document or ask for a page reload?
                });
        };

        config.onRemote = function () {
            if (initializing) { return; }
            var userDoc = APP.realtime.getUserDoc();
            var json = JSON.parse(userDoc);
            if (json.metadata) {
                metadataMgr.updateMetadata(json.metadata);
            }

            var wasLocked = content.saveLock;

            var wasMigrating = content.migration;

            var myLocks = getUserLock(getId(), true);

            content = json.content;

            if (content.saveLock && wasLocked !== content.saveLock) {
                // Someone new is creating a checkpoint: fix the sheets ids
                fixSheets();
                // If the checkpoint is not saved in 20s to 40s, do it ourselves
                checkCheckpoint();
            }

            var editor = getEditor();
            if (content.hashes) {
                var latest = getLastCp(true);
                var newLatest = getLastCp();
                if (newLatest.index > latest.index || (newLatest.index && !latest.index)) {
                    ooChannel.queue = [];
                    ooChannel.ready = false;
                    var reload = function () {
                        // New checkpoint
                        sframeChan.query('Q_OO_SAVE', {
                            hash: newLatest.hash,
                            url: newLatest.file
                        }, function () {
                            checkNewCheckpoint();
                        });
                    };
                    var editing = editor.asc_isDocumentModified ? editor.asc_isDocumentModified() : editor.isDocumentModify;
                    if (editing) {
                        setEditable(false);
                        APP.unsavedLocks = myLocks;
                        APP.onStrictSaveChanges = function () {
                            reload();
                            delete APP.onStrictSaveChanges;
                        };
                        editor.asc_Save();
                    } else {
                        reload();
                    }
                }
                oldHashes = JSON.parse(JSON.stringify(content.hashes));
            }

            if (content.ids) {
                handleNewIds(oldIds, content.ids);
                oldIds = JSON.parse(JSON.stringify(content.ids));
            }
            if (content.locks) {
                handleNewLocks(oldLocks, content.locks);
                oldLocks = JSON.parse(JSON.stringify(content.locks));
            }
            if (content.migration) {
                setEditable(false);
            }
            if (wasMigrating && !content.migration && !reloadPopup) {
                reloadPopup = true;
                UI.alert(Messages.oo_sheetMigration_complete, function () {
                    common.gotoURL();
                });
            }
            pinImages();
        };

        config.onConnectionChange = function (info) {
            if (info.state) {
                // If we tried to send changes while we were offline, force a page reload
                UIElements.reconnectAlert();
                if (Object.keys(pendingChanges).length) {
                    return void UI.confirm(Messages.oo_reconnect, function (yes) {
                        if (!yes) { return; }
                        common.gotoURL();
                    });
                }
                //setEditable(true);
                try { getEditor().asc_setViewMode(false); } catch (e) {}
                offline = false;
            } else {
                try { getEditor().asc_setViewMode(true); } catch (e) {}
                //setEditable(false);
                offline = true;
                UI.findOKButton().click();
                UIElements.disconnectAlert();
            }
        };

        cpNfInner = common.startRealtime(config);

        cpNfInner.onInfiniteSpinner(function () {
            if (offline) { return; }
            setEditable(false);
            UI.confirm(Messages.realtime_unrecoverableError, function (yes) {
                if (!yes) { return; }
                common.gotoURL();
            });
        });

        common.onLogout(function () { setEditable(false); });
    };

    var main = function () {
        var common;

        nThen(function (waitFor) {
            $(waitFor(function () {
                UI.addLoadingScreen();
            }));
            SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
        }).nThen(function (waitFor) {
            common.getSframeChannel().on('EV_OO_TEMPLATE', function (data) {
                APP.startWithTemplate = data;
            });
            common.handleNewFile(waitFor, {
                //noTemplates: true
            });
        }).nThen(function (/*waitFor*/) {
            andThen(common);
        });
    };
    main();
});
