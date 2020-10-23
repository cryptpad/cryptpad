define([
    'jquery',
    '/common/toolbar.js',
    'json.sortify',
    '/bower_components/nthen/index.js',
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
    '/bower_components/chainpad/chainpad.dist.js',
    '/file/file-crypto.js',
    '/common/onlyoffice/history.js',
    '/common/onlyoffice/oocell_base.js',
    '/common/onlyoffice/oodoc_base.js',
    '/common/onlyoffice/ooslide_base.js',
    '/common/outer/worker-channel.js',

    '/bower_components/file-saver/FileSaver.min.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'less!/bower_components/components-font-awesome/css/font-awesome.min.css',
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
    Channel)
{
    var saveAs = window.saveAs;
    var Nacl = window.nacl;

    var APP = window.APP = {
        $: $,
        urlArgs: Util.find(ApiConfig, ['requireConf', 'urlArgs'])
    };

    var CHECKPOINT_INTERVAL = 100;
    var DISPLAY_RESTORE_BUTTON = false;
    var NEW_VERSION = 3;
    var PENDING_TIMEOUT = 30000;
    //var READONLY_REFRESH_TO = 15000;

    var debug = function (x) {
        if (!window.CP_DEV_MODE) { return; }
        console.debug(x);
    };

    var stringify = function (obj) {
        return JSONSortify(obj);
    };

    var toolbar;


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

        // This structure is used for caching media data and blob urls for each media cryptpad url
        var mediasData = {};

        var startOO = function () {};

        var getMediasSources = APP.getMediasSources =  function() {
            content.mediasSources = content.mediasSources || {};
            return content.mediasSources;
        };

        var getId = function () {
            return metadataMgr.getNetfluxId() + '-' + privateData.clientId;
        };

        var getEditor = function () {
            return window.frames[0].editor || window.frames[0].editorCell;
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

        var getUserIndex = function () {
            var i = 1;
            var ids = content.ids || {};
            Object.keys(ids).forEach(function (k) {
                if (ids[k] && ids[k].index && ids[k].index >= i) {
                    i = ids[k].index + 1;
                }
            });
            return i;
        };

        var setMyId = function () {
            // Remove ids for users that have left the channel
            deleteOffline();
            var ids = content.ids;
            if (!myOOId) {
                myOOId = Util.createRandomInteger();
                // f: function used in .some(f) but defined outside of the while
                var f = function (id) {
                    return ids[id] === myOOId;
                };
                while (Object.keys(ids).some(f)) {
                    myOOId = Util.createRandomInteger();
                }
            }
            var myId = getId();
            ids[myId] = {
                ooid: myOOId,
                index: getUserIndex(),
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
                delete content.locks[tabId];
                APP.onLocal();
            }
        };

        var getFileType = function () {
            var type = common.getMetadataMgr().getPrivateData().ooType;
            var title = common.getMetadataMgr().getMetadataLazy().title;
            var file = {};
            switch(type) {
                case 'oodoc':
                    file.type = 'docx';
                    file.title = title + '.docx' || 'document.docx';
                    file.doc = 'text';
                    break;
                case 'sheet':
                    file.type = 'xlsx';
                    file.title = title + '.xlsx' || 'spreadsheet.xlsx';
                    file.doc = 'spreadsheet';
                    break;
                case 'ooslide':
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
                rtChannel.sendCmd({
                    cmd: 'SEND_MESSAGE',
                    data: {
                        msg: msg,
                        isCp: cp
                    }
                }, cb);
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

        var onUploaded = function (ev, data, err) {
            content.saveLock = undefined;
            if (err) {
                console.error(err);
                return void UI.alert(Messages.oo_saveError);
            }
            // Get the last cp idx
            var all = sortCpIndex(content.hashes || {});
            var current = all[all.length - 1] || 0;

            var i = current + 1;
            content.hashes[i] = {
                file: data.url,
                hash: ev.hash,
                index: ev.index
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

        // Add a lock
        var isLockedModal = {
            content: UI.dialog.customModal(h('div.cp-oo-x2tXls', [
                h('span.fa.fa-spin.fa-spinner'),
                h('span', Messages.oo_isLocked)
            ]))
        };

        var resetData = function (blob, type) {
            // If a read-only refresh popup was planned, abort it
            delete APP.refreshPopup;
            clearTimeout(APP.refreshRoTo);

            if (!isLockedModal.modal) {
                isLockedModal.modal = UI.openCustomModal(isLockedModal.content);
            }
            myUniqueOOId = undefined;
            setMyId();
            if (APP.docEditor) { APP.docEditor.destroyEditor(); } // Kill the old editor
            $('iframe[name="frameEditor"]').after(h('div#cp-app-oo-placeholder-a')).remove();
            ooLoaded = false;
            oldLocks = {};
            Object.keys(pendingChanges).forEach(function (key) {
                clearTimeout(pendingChanges[key]);
                delete pendingChanges[key];
            });
            if (APP.stopHistory) { APP.history = false; }
            startOO(blob, type, true);
        };

        var saveToServer = function () {
            var text = getContent();
            var blob = new Blob([text], {type: 'plain/text'});
            var file = getFileType();
            blob.name = (metadataMgr.getMetadataLazy().title || file.doc) + '.' + file.type;
            var data = {
                hash: APP.history ? ooChannel.historyLastHash : ooChannel.lastHash,
                index: APP.history ? ooChannel.currentIndex : ooChannel.cpIndex
            };
            fixSheets();

            ooChannel.ready = false;
            ooChannel.queue = [];
            data.callback = function () {
                resetData(blob, file);
            };

            APP.FM.handleFile(blob, data);
        };

        var noLogin = false;

        var makeCheckpoint = function (force) {
            var locked = content.saveLock;
            var lastCp = getLastCp();

            var needCp = force || ooChannel.cpIndex % CHECKPOINT_INTERVAL === 0 ||
                        (ooChannel.cpIndex - (lastCp.index || 0)) > CHECKPOINT_INTERVAL;
            if (!needCp) { return; }

            if (!locked || !isUserOnline(locked) || force) {
                if (!common.isLoggedIn() && !isRegisteredUserOnline() && !noLogin) {
                    var login = h('button.cp-corner-primary', Messages.login_login);
                    var register = h('button.cp-corner-primary', Messages.login_register);
                    var cancel = h('button.cp-corner-cancel', Messages.cancel);
                    var actions = h('div', [cancel, register, login]);
                    var modal = UI.cornerPopup(Messages.oo_login, actions, '', {alt: true});
                    $(register).click(function () {
                        common.setLoginRedirect(function () {
                            common.gotoURL('/register/');
                        });
                        modal.delete();
                    });
                    $(login).click(function () {
                        common.setLoginRedirect(function () {
                            common.gotoURL('/login/');
                        });
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
                case 'oodoc':
                    newText = EmptyDoc();
                    break;
                case 'ooslide':
                    newText = EmptySlide();
                    break;
                default:
                    newText = '';
            }
            return new Blob([newText], {type: 'text/plain'});
        };
        var loadLastDocument = function (lastCp, onCpError, cb) {
            if (!lastCp || !lastCp.file) {
                return void onCpError('EEMPTY');
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
            xhr.responseType = 'arraybuffer';
            xhr.onload = function () {
                if (/^4/.test('' + this.status)) {
                    onCpError(this.status);
                    return void console.error('XHR error', this.status);
                }
                var arrayBuffer = xhr.response;
                if (arrayBuffer) {
                    var u8 = new Uint8Array(arrayBuffer);
                    FileCrypto.decrypt(u8, key, function (err, decrypted) {
                        if (err) { return void console.error(err); }
                        var blob = new Blob([decrypted.content], {type: 'plain/text'});
                        if (cb) {
                            return cb(blob, getFileType());
                        }
                        startOO(blob, getFileType());
                    });
                }
            };
            xhr.onerror = function (err) {
                onCpError(err);
            };
            xhr.send(null);
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

            var toHash = cp.hash || 'NONE';
            var fromHash = nextCpId ? hashes[nextCpId].hash : 'NONE';

            sframeChan.query('Q_GET_HISTORY_RANGE', {
                channel: content.channel,
                lastKnownHash: fromHash,
                toHash: toHash,
            }, function (err, data) {
                if (err) { console.error(err); return void UI.errorLoadingScreen(Messages.error); }
                if (!Array.isArray(data.messages)) {
                    console.error('Not an array');
                    return void UI.errorLoadingScreen(Messages.error);
                }

                // The first "cp" in history is the empty doc. It doesn't include the first patch
                // of the history
                var initialCp = major === 0;
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

                loadLastDocument(cp, function () {
                    if (cp.hash && vHashEl) {
                        // We requested a checkpoint but we can't find it...
                        UI.removeLoadingScreen();
                        vHashEl.innerText = Messages.oo_deletedVersion;
                        $(vHashEl).removeClass('alert-warning').addClass('alert-danger');
                        return;
                    }
                    var file = getFileType();
                    var type = common.getMetadataMgr().getPrivateData().ooType;
                    var blob = loadInitDocument(type, true);
                    ooChannel.queue = messages;
                    resetData(blob, file);
                    UI.removeLoadingScreen();
                }, function (blob, file) {
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
            });
            sframeChan.on('EV_OO_EVENT', function (obj) {
                switch (obj.ev) {
                    case 'READY':
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

        var getParticipants = function () {
            var users = metadataMgr.getMetadata().users;
            var i = 1;
            var p = Object.keys(content.ids || {}).map(function (id) {
                var nId = id.slice(0,32);
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
            if (!myUniqueOOId) { myUniqueOOId = String(myOOId) + i; }
            p.push({
                id: myUniqueOOId,
                idOriginal: String(myOOId),
                username: metadataMgr.getUserData().name || Messages.anonymous,
                indexUser: i,
                connectionId: metadataMgr.getNetfluxId() || Hash.createChannelId(),
                isCloseCoAuthoring:false,
                view: false
            });
            return {
                index: i,
                list: p.filter(Boolean)
            };
        };

        // Get all existing locks
        var getLock = function () {
            return Object.keys(content.locks).map(function (id) {
                return content.locks[id];
            });
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
            Object.keys(n).forEach(function (id) {
                // New lock
                if (!o[id]) {
                    ooChannel.send({
                        type: "getLock",
                        locks: getLock()
                    });
                    return;
                }
                // Updated lock
                if (stringify(n[id]) !== stringify(o[id])) {
                    ooChannel.send({
                        type: "releaseLock",
                        locks: [o[id]]
                    });
                    ooChannel.send({
                        type: "getLock",
                        locks: getLock()
                    });
                }
            });
            Object.keys(o).forEach(function (id) {
                // Removed lock
                if (!n[id]) {
                    ooChannel.send({
                        type: "releaseLock",
                        locks: [o[id]]
                    });
                    return;
                }
            });
        };

        // Remove locks from offline users
        var deleteOfflineLocks = function () {
            var locks = content.locks || {};
            var users = Object.keys(metadataMgr.getMetadata().users);
            Object.keys(locks).forEach(function (id) {
                var nId = id.slice(0,32);
                if (users.indexOf(nId) === -1) {
                    ooChannel.send({
                        type: "releaseLock",
                        locks: [locks[id]]
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
            content.locks = content.locks || {};
            // Send the lock to other users
            var msg = {
                time: now(),
                user: myUniqueOOId,
                block: obj.block && obj.block[0],
            };
            var myId = getId();
            content.locks[myId] = msg;
            oldLocks = JSON.parse(JSON.stringify(content.locks));
            // Remove old locks
            deleteOfflineLocks();
            // Prepare callback
            if (cpNfInner) {
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

        var parseChanges = function (changes) {
            try {
                changes = JSON.parse(changes);
            } catch (e) {
                return [];
            }
            return changes.map(function (change) {
                return {
                    docid: "fresh",
                    change: '"' + change + '"',
                    time: now(),
                    user: myUniqueOOId,
                    useridoriginal: String(myOOId)
                };
            });
        };

        var handleChanges = function (obj, send) {
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

            // Send the changes
            content.locks = content.locks || {};
            rtChannel.sendMsg({
                type: "saveChanges",
                changes: parseChanges(obj.changes),
                changesIndex: ooChannel.cpIndex || 0,
                locks: [content.locks[getId()]],
                excelAdditionalInfo: null
            }, null, function (err, hash) {
                if (err) {
                    return void console.error(err);
                }

                if (pendingChanges[uid]) {
                    clearTimeout(pendingChanges[uid]);
                    delete pendingChanges[uid];
                }
                // Call unSaveLock to tell onlyoffice that the patch was sent.
                // It will allow you to make changes to another cell.
                // If there is an error and unSaveLock is not called, onlyoffice
                // will try to send the patch again
                send({
                    type: "unSaveLock",
                    index: ooChannel.cpIndex,
                    time: +new Date()
                });
                // Increment index and update latest hash
                ooChannel.cpIndex++;
                ooChannel.lastHash = hash;
                // Check if a checkpoint is needed
                makeCheckpoint();
                // Remove my lock
                delete content.locks[getId()];
                oldLocks = JSON.parse(JSON.stringify(content.locks));
                APP.onLocal();
            });
        };


        var makeChannel = function () {
            var msgEv = Util.mkEvent();
            var iframe = $('#cp-app-oo-editor > iframe')[0].contentWindow;
            window.addEventListener('message', function (msg) {
                if (msg.source !== iframe) { return; }
                msgEv.fire(msg);
            });
            var postMsg = function (data) {
                iframe.postMessage(data, '*');
            };
            Channel.create(msgEv, postMsg, function (chan) {
                APP.chan = chan;

                var send = ooChannel.send = function (obj) {
                    debug(obj);
                    chan.event('CMD', obj);
                };

                chan.on('CMD', function (obj) {
                    debug(obj);
                    switch (obj.type) {
                        case "auth":
                            handleAuth(obj, send);
                            break;
                        case "isSaveLock":
                            // TODO ping the server to check if we're online first?
                            if (!offline) {
                                send({
                                    type: "saveLock",
                                    saveLock: false
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
                            // We're sending our changes to netflux
                            handleChanges(obj, send);
                            // If we're alone, clean up the medias
                            var m = metadataMgr.getChannelMembers().slice().filter(function (nId) {
                                return nId.length === 32;
                            });
                            if (m.length === 1 && APP.loadingImage <= 0) {
                                try {
                                    var docs = window.frames[0].AscCommon.g_oDocumentUrls.urls || {};
                                    var mediasSources = getMediasSources();
                                    Object.keys(mediasSources).forEach(function (name) {
                                        if (!docs['media/'+name]) {
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
                                    locks: [content.locks[getId()]]
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
                    }
                });
            });
        };

        startOO = function (blob, file, force) {
            if (APP.ooconfig && !force) { return void console.error('already started'); }
            var url = URL.createObjectURL(blob);
            var lock = !APP.history && (APP.migrate);

            // Starting from version 3, we can use the view mode again
            // defined but never used
            //var mode = (content && content.version > 2 && lock) ? "view" : "edit";

            // Config
            APP.ooconfig = {
                "document": {
                    "fileType": file.type,
                    "key": "fresh",
                    "title": file.title,
                    "url": url,
                    "permissions": {
                        "download": false,
                        "print": false,
                    }
                },
                "documentType": file.doc,
                "editorConfig": {
                    customization: {
                        chat: false,
                        logo: {
                            url: "/bounce/#" + encodeURIComponent('https://www.onlyoffice.com')
                        }
                    },
                    "user": {
                        "id": String(myOOId), //"c0c3bf82-20d7-4663-bf6d-7fa39c598b1d",
                        "firstname": metadataMgr.getUserData().name || Messages.anonymous,
                    },
                    "mode": "edit",
                    "lang": (navigator.language || navigator.userLanguage || '').slice(0,2)
                },
                "events": {
                    "onAppReady": function(/*evt*/) {
                        var $iframe = $('iframe[name="frameEditor"]').contents();
                        $iframe.prop('tabindex', '-1');
                        var $tb = $iframe.find('head');
                        var css = // Old OO
                                  '#id-toolbar-full .toolbar-group:nth-child(2), #id-toolbar-full .separator:nth-child(3) { display: none; }' +
                                  '#fm-btn-save { display: none !important; }' +
                                  '#panel-settings-general tr.autosave { display: none !important; }' +
                                  '#panel-settings-general tr.coauth { display: none !important; }' +
                                  '#header { display: none !important; }' +
                                  '#title-doc-name { display: none !important; }' +
                                  // New OO:
                                  '#asc-gen566 { display: none !important; }' + // Insert image from url
                                  'section[data-tab="ins"] .separator:nth-last-child(2) { display: none !important; }' + // separator
                                  '#slot-btn-insequation { display: none !important; }' + // Insert equation
                                  '.toolbar .tabs .ribtab:not(.canedit) { display: none !important; }' + // Switch collaborative mode
                                  '#app-title { display: none !important; }' + // OnlyOffice logo + doc title
                                  '#fm-btn-info { display: none !important; }' + // Author name, doc title, etc. in "File" (menu entry)
                                  '#panel-info { display: none !important; }' + // Same but content
                                  '#image-button-from-url { display: none !important; }' + // Inline image settings: replace with url
                                  '#file-menu-panel .devider { display: none !important; }' + // separator in the "File" menu
                                  '#file-menu-panel { top: 28px !important; }' + // Position of the "File" menu
                                  '#left-btn-spellcheck, #left-btn-about { display: none !important; }'+
                                  'div.btn-users.dropdown-toggle { display: none; !important }';
                        if (readOnly) {
                            css += '#toolbar { display: none !important; }';
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
                    "onDocumentReady": function () {
                        var onMigrateRdy = Util.mkEvent();
                        onMigrateRdy.reg(function () {
                            var div = h('div.cp-oo-x2tXls', [
                                h('span.fa.fa-spin.fa-spinner'),
                                h('span', Messages.oo_sheetMigration_loading)
                            ]);
                            UI.openCustomModal(UI.dialog.customModal(div, {buttons: []}));
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
                                    getEditor().setViewModeDisconnect();
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

                        if (lock) {
                            getEditor().setViewModeDisconnect();
                        } else if (readOnly) {
                            try {
                                getEditor().asc_setRestriction(true);
                            } catch (e) {}
                        } else {
                            setEditable(true);
                        }

                        if (isLockedModal.modal && force) {
                            isLockedModal.modal.closeModal();
                            delete isLockedModal.modal;
                            if (!APP.history) {
                                $('#cp-app-oo-editor > iframe')[0].contentWindow.focus();
                            }
                        }

                        if (APP.history) {
                            try {
                                getEditor().asc_setRestriction(true);
                            } catch (e) {}
                        }

                        if (APP.migrate && !readOnly) {
                            onMigrateRdy.fire();
                        }
                    }
                }
            };
            window.onbeforeunload = function () {
                var ifr = document.getElementsByTagName('iframe')[0];
                if (ifr) { ifr.remove(); }
            };

            APP.UploadImageFiles = function (files, type, id, jwt, cb) {
                cb('NO');
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

            APP.loadingImage = 0;
            APP.getImageURL = function(name, callback) {
                var mediasSources = getMediasSources();
                var data = mediasSources[name];

                if (typeof data === 'undefined') {
                    debug("CryptPad - could not find matching media for " + name);
                    return void callback("");
                }

                var blobUrl = (typeof mediasData[data.src] === 'undefined') ? "" : mediasData[data.src].src;
                if (blobUrl) {
                    debug("CryptPad Image already loaded " + blobUrl);
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
                                var mediaData = { blobUrl : blobUrl, content : "" };
                                mediasData[data.src] = mediaData;
                                var reader = new FileReader();
                                reader.onloadend = function () {
                                    debug("MediaData set");
                                    mediaData.content = reader.result;
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
                });
            };

            APP.docEditor = new window.DocsAPI.DocEditor("cp-app-oo-placeholder-a", APP.ooconfig);
            ooLoaded = true;
            makeChannel();
        };

        var x2tInitialized = false;
        var x2tInit = function(x2t) {
            debug("x2t mount");
            // x2t.FS.mount(x2t.MEMFS, {} , '/');
            x2t.FS.mkdir('/working');
            x2t.FS.mkdir('/working/media');
            x2tInitialized = true;
            debug("x2t mount done");
        };

        /*
            Converting Data

            This function converts a data in a specific format to the outputformat
            The filename extension needs to represent the input format
            Example: fileName=cryptpad.bin outputFormat=xlsx
        */
        var x2tConvertDataInternal = function(x2t, data, fileName, outputFormat) {
            debug("Converting Data for " + fileName + " to " + outputFormat);
            // writing file to mounted working disk (in memory)
            x2t.FS.writeFile('/working/' + fileName, data);

            // Adding images
            Object.keys(window.frames[0].AscCommon.g_oDocumentUrls.urls || {}).forEach(function (_mediaFileName) {
                var mediaFileName = _mediaFileName.substring(6);
                var mediasSources = getMediasSources();
                var mediaSource = mediasSources[mediaFileName];
                var mediaData = mediaSource ? mediasData[mediaSource.src] : undefined;
                if (mediaData) {
                    debug("Writing media data " + mediaFileName);
                    debug("Data");
                    var fileData = mediaData.content;
                    x2t.FS.writeFile('/working/media/' + mediaFileName, new Uint8Array(fileData));
                } else {
                    debug("Could not find media content for " + mediaFileName);
                }
            });

            var params =  "<?xml version=\"1.0\" encoding=\"utf-8\"?>"
                        + "<TaskQueueDataConvert xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\">"
                        + "<m_sFileFrom>/working/" + fileName + "</m_sFileFrom>"
                        + "<m_sFileTo>/working/" + fileName + "." + outputFormat + "</m_sFileTo>"
                        + "<m_bIsNoBase64>false</m_bIsNoBase64>"
                        + "</TaskQueueDataConvert>";
            // writing params file to mounted working disk (in memory)
            x2t.FS.writeFile('/working/params.xml', params);
            // running conversion
            x2t.ccall("runX2T", ["number"], ["string"], ["/working/params.xml"]);
            // reading output file from working disk (in memory)
            var result;
            try {
                result = x2t.FS.readFile('/working/' + fileName + "." + outputFormat);
            } catch (e) {
                debug("Failed reading converted file");
                UI.removeModals();
                UI.warn(Messages.error);
                return "";
            }
            return result;
        };

        var x2tSaveAndConvertDataInternal = function(x2t, data, filename, extension, finalFilename) {
            var type = common.getMetadataMgr().getPrivateData().ooType;
            var xlsData;
            if (type === "sheet" && extension !== 'xlsx') {
                xlsData = x2tConvertDataInternal(x2t, data, filename, 'xlsx');
                filename += '.xlsx';
            } else if (type === "ooslide" && extension !== "pptx") {
                xlsData = x2tConvertDataInternal(x2t, data, filename, 'pptx');
                filename += '.pptx';
            } else if (type === "oodoc" && extension !== "docx") {
                xlsData = x2tConvertDataInternal(x2t, data, filename, 'docx');
                filename += '.docx';
            }
            xlsData = x2tConvertDataInternal(x2t, data, filename, extension);
            if (xlsData) {
                var blob = new Blob([xlsData], {type: "application/bin;charset=utf-8"});
                UI.removeModals();
                saveAs(blob, finalFilename);
            }
        };

        var x2tSaveAndConvertData = function(data, filename, extension, finalFilename) {
            // Perform the x2t conversion
            require(['/common/onlyoffice/x2t/x2t.js'], function() { // FIXME why does this fail without an access-control-allow-origin header?
                var x2t = window.Module;
                x2t.run();
                if (x2tInitialized) {
                    debug("x2t runtime already initialized");
                    return void x2tSaveAndConvertDataInternal(x2t, data, filename, extension, finalFilename);
                }

                x2t.onRuntimeInitialized = function() {
                    debug("x2t in runtime initialized");
                    // Init x2t js module
                    x2tInit(x2t);
                    x2tSaveAndConvertDataInternal(x2t, data, filename, extension, finalFilename);
                };
            });
        };

        var supportsXLSX = function () {
            return !(typeof(Atomics) === "undefined" || typeof (SharedArrayBuffer) === "undefined");
        };

        var exportXLSXFile = function() {
            var text = getContent();
            var suggestion = Title.suggestTitle(Title.defaultTitle);
            var ext = ['.xlsx', /*'.ods',*/ '.bin'];
            var type = common.getMetadataMgr().getPrivateData().ooType;
            var warning = '';
            if (type==="ooslide") {
                ext = ['.pptx', /*'.odp',*/ '.bin'];
            } else if (type==="oodoc") {
                ext = ['.docx', /*'.odt',*/ '.bin'];
            }

            if (!supportsXLSX()) {
                ext = ['.bin'];
                warning = '<div class="alert alert-info cp-alert-top">'+Messages.oo_exportChrome+'</div>';
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

            UI.prompt(Messages.exportPrompt+warning, Util.fixFileName(suggestion), function (filename) {
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

        var x2tImportImagesInternal = function(x2t, images, i, callback) {
            if (i >= images.length) {
                callback();
            } else {
                debug("Import image " + i);
                var handleFileData = {
                    name: images[i],
                    mediasSources: getMediasSources(),
                    callback: function() {
                        debug("next image");
                        x2tImportImagesInternal(x2t, images, i+1, callback);
                    },
                };
                var filePath = "/working/media/" + images[i];
                debug("Import filename " + filePath);
                var fileData = x2t.FS.readFile("/working/media/" + images[i], { encoding : "binary" });
                debug("Importing data");
                debug("Buffer");
                debug(fileData.buffer);
                var blob = new Blob([fileData.buffer], {type: 'image/png'});
                blob.name = images[i];
                APP.FMImages.handleFile(blob, handleFileData);
            }
        };

        var x2tImportImages = function (x2t, callback) {
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
            var files = x2t.FS.readdir("/working/media/");
            var images = [];
            files.forEach(function (file) {
                if (file !== "." && file !== "..") {
                    images.push(file);
                }
            });
            x2tImportImagesInternal(x2t, images, 0, function() {
                debug("Sync media sources elements");
                debug(getMediasSources());
                APP.onLocal();
                debug("Import Images finalized");
                callback();
            });
        };


        var x2tConvertData = function (x2t, data, filename, extension, callback) {
            var convertedContent;
            // Convert from ODF format:
            // first convert to Office format then to the selected extension
            if (filename.endsWith(".ods")) {
                convertedContent = x2tConvertDataInternal(x2t, new Uint8Array(data), filename, "xlsx");
                convertedContent = x2tConvertDataInternal(x2t, convertedContent, filename + ".xlsx", extension);
            } else if (filename.endsWith(".odt")) {
                convertedContent = x2tConvertDataInternal(x2t, new Uint8Array(data), filename, "docx");
                convertedContent = x2tConvertDataInternal(x2t, convertedContent, filename + ".docx", extension);
            } else if (filename.endsWith(".odp")) {
                convertedContent = x2tConvertDataInternal(x2t, new Uint8Array(data), filename, "pptx");
                convertedContent = x2tConvertDataInternal(x2t, convertedContent, filename + ".pptx", extension);
            } else {
                convertedContent = x2tConvertDataInternal(x2t, new Uint8Array(data), filename, extension);
            }
            x2tImportImages(x2t, function() {
                callback(convertedContent);
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
                        getEditor().setViewModeDisconnect();
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
                require(['/common/onlyoffice/x2t/x2t.js'], function() {
                    var x2t = window.Module;
                    x2t.run();
                    if (x2tInitialized) {
                        debug("x2t runtime already initialized");
                        x2tConvertData(x2t, new Uint8Array(content), filename.name, "bin", function(convertedContent) {
                            importFile(convertedContent);
                        });
                    }

                    x2t.onRuntimeInitialized = function() {
                        debug("x2t in runtime initialized");
                        // Init x2t js module
                        x2tInit(x2t);
                        x2tConvertData(x2t, new Uint8Array(content), filename.name, "bin", function(convertedContent) {
                            importFile(convertedContent);
                        });
                    };
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
                return void loadLastDocument(lastCp, function () {
                    // Checkpoint error: load the previous one
                    i = i || 0;
                    loadDocument(noCp, useNewDefault, ++i);
                });
            }
            var newText;
            switch (type) {
                case 'sheet' :
                    newText = EmptyCell(useNewDefault);
                    break;
                case 'oodoc':
                    newText = EmptyDoc();
                    break;
                case 'ooslide':
                    newText = EmptySlide();
                    break;
                default:
                    newText = '';
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

        APP.getContent = function () { return content; };

        APP.onLocal = config.onLocal = function () {
            if (initializing) { return; }
            if (readOnly) { return; }

            // Update metadata
            var content = stringifyInner();
            APP.realtime.contentUpdate(content);
            pinImages();
        };

        config.onInit = function (info) {
            var privateData = metadataMgr.getPrivateData();

            readOnly = privateData.readOnly;

            Title = common.createTitle({});

            var configTb = {
                displayed: ['pad'],
                title: Title.getTitleConfig(),
                metadataMgr: metadataMgr,
                readOnly: readOnly,
                realtime: info.realtime,
                sfCommon: common,
                $container: $bar,
                $contentContainer: $('#cp-app-oo-container')
            };
            toolbar = APP.toolbar = Toolbar.create(configTb);
            Title.setToolbar(toolbar);

            if (window.CP_DEV_MODE) {
                var $save = common.createButton('save', true, {}, function () {
                    makeCheckpoint(true);
                });
                $save.appendTo(toolbar.$bottomM);
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
                var loadCp = function (cp, keepQueue) {
                    loadLastDocument(cp, function () {
                        var file = getFileType();
                        var type = common.getMetadataMgr().getPrivateData().ooType;
                        var blob = loadInitDocument(type, true);
                        if (!keepQueue) { ooChannel.queue = []; }
                        resetData(blob, file);
                    }, function (blob, file) {
                        if (!keepQueue) { ooChannel.queue = []; }
                        resetData(blob, file);
                    });
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
                        getEditor().setViewModeDisconnect();
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

                common.createButton('', true, {
                    name: 'history',
                    icon: 'fa-history',
                    text: Messages.historyText,
                    tippy: Messages.historyButton
                }).click(function () {
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
                }).appendTo(toolbar.$drawer);

                // Snapshots
                var $snapshot = common.createButton('snapshots', true, {
                    remove: deleteSnapshot,
                    make: makeSnapshot,
                    load: loadSnapshot
                });
                toolbar.$drawer.append($snapshot);
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

            var $exportXLSX = common.createButton('export', true, {}, exportXLSXFile);
            $exportXLSX.appendTo(toolbar.$drawer);

            var type = privateData.ooType;
            var accept = [".bin", ".ods", ".xlsx"];
            if (type === "ooslide") {
                accept = ['.bin', '.odp', '.pptx'];
            } else if (type === "oodoc") {
                accept = ['.bin', '.odt', '.docx'];
            }
            if (!supportsXLSX()) {
                accept = ['.bin'];
            }

            if (common.isLoggedIn()) {
                window.CryptPad_deleteLastCp = deleteLastCp;
                var $importXLSX = common.createButton('import', true, {
                    accept: accept,
                    binary : ["ods", "xlsx", "odt", "docx", "odp", "pptx"]
                }, importXLSXFile);
                $importXLSX.appendTo(toolbar.$drawer);
                common.createButton('hashtag', true).appendTo(toolbar.$drawer);
            }

            var $forget = common.createButton('forget', true, {}, function (err) {
                if (err) { return; }
                setEditable(false);
            });
            toolbar.$drawer.append($forget);

            if (!privateData.isEmbed) {
                var helpMenu = APP.helpMenu = common.createHelpMenu(['beta', 'oo']);
                $('#cp-app-oo-editor').prepend(common.getBurnAfterReadingWarning());
                $('#cp-app-oo-editor').prepend(helpMenu.menu);
                toolbar.$drawer.append(helpMenu.button);
            }

            var $properties = common.createButton('properties', true);
            toolbar.$drawer.append($properties);
        };

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
            } else {
                Title.updateTitle(Title.defaultTitle);
            }

            var version = 'v2b/';
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
                    $(APP.helpMenu.menu).after(msg);
                    readOnly = true;
                }
            } else if (content && content.version === 2) {
                APP.migrate = true;
                // Registedred ~~users~~ editors can start the migration
                if (common.isLoggedIn() && !readOnly) {
                    content.migration = true;
                    APP.onLocal();
                } else {
                    msg = h('div.alert.alert-warning.cp-burn-after-reading', Messages.oo_sheetMigration_anonymousEditor);
                    $(APP.helpMenu.menu).after(msg);
                    readOnly = true;
                }
            }

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
                src: '/common/onlyoffice/'+version+'web-apps/apps/api/documents/api.js'
            });
            $('#cp-app-oo-editor').append(s);

            if (metadataMgr.getPrivateData().burnAfterReading && content && content.channel) {
                sframeChan.event('EV_BURN_PAD', content.channel);
            }

            if (privateData.ooVersionHash) {
                return void openVersionHash(privateData.ooVersionHash);
            }


            var useNewDefault = content.version && content.version >= 2;
            openRtChannel(function () {
                setMyId();
                oldHashes = JSON.parse(JSON.stringify(content.hashes));
                loadDocument(newDoc, useNewDefault);
                initializing = false;
                setEditable(!readOnly);
                UI.removeLoadingScreen();
                common.openPadChat(APP.onLocal);
            });
        };

        config.onError = function (err) {
            common.onServerError(err, toolbar, function () {
                setEditable(false);
            });
        };

        var reloadPopup = false;

        var checkNewCheckpoint = function () {
            var lastCp = getLastCp();
            loadLastDocument(lastCp, function (err) {
                console.error(err);
                // On error, do nothing
                // FIXME lock the document or ask for a page reload?
            }, function (blob, type) {
                resetData(blob, type);
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

            content = json.content;

            if (content.saveLock && wasLocked !== content.saveLock) {
                // Someone new is creating a checkpoint: fix the sheets ids
                fixSheets();
                // If the checkpoint is not saved in 20s to 40s, do it ourselves
                checkCheckpoint();
            }

            if (content.hashes) {
                var latest = getLastCp(true);
                var newLatest = getLastCp();
                if (newLatest.index > latest.index) {
                    ooChannel.queue = [];
                    ooChannel.ready = false;
                    // New checkpoint
                    sframeChan.query('Q_OO_SAVE', {
                        hash: newLatest.hash,
                        url: newLatest.file
                    }, function () {
                        checkNewCheckpoint();
                    });
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
                setEditable(true);
                offline = false;
            } else {
                setEditable(false);
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
            common.handleNewFile(waitFor, {
                noTemplates: true
            });
        }).nThen(function (/*waitFor*/) {
            andThen(common);
        });
    };
    main();
});
