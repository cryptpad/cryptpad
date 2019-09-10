define([
    'jquery',
    '/common/toolbar3.js',
    'json.sortify',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-interface.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/api/config',
    '/customize/messages.js',
    '/customize/application_config.js',
    '/bower_components/chainpad/chainpad.dist.js',
    '/file/file-crypto.js',
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
    ApiConfig,
    Messages,
    AppConfig,
    ChainPad,
    FileCrypto,
    EmptyCell,
    EmptyDoc,
    EmptySlide,
    Channel)
{
    var saveAs = window.saveAs;

    var APP = window.APP = {
        $: $
    };

    var CHECKPOINT_INTERVAL = 50;
    var DISPLAY_RESTORE_BUTTON = false;

    var debug = function (x) {
        if (!window.CP_DEV_MODE) { return; }
        console.log(x);
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
        var config = {};
        var content = {
            hashes: {},
            ids: {}
        };
        var oldHashes = {};
        var oldIds = {};
        var oldLocks = {};
        var myUniqueOOId;
        var myOOId;
        var sessionId = Hash.createChannelId();

        var getId = function () {
            return metadataMgr.getNetfluxId() + '-' + privateData.clientId;
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

        var getLastCp = function (old) {
            var hashes = old ? oldHashes : content.hashes;
            if (!hashes || !Object.keys(hashes).length) { return {}; }
            var lastIndex = Math.max.apply(null, Object.keys(hashes).map(Number));
            var last = JSON.parse(JSON.stringify(hashes[lastIndex]));
            return last;
        };

        var rtChannel = {
            ready: false,
            readyCb: undefined,
            sendCmd: function (data, cb) {
                sframeChan.query('Q_OO_COMMAND', data, cb);
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
                return window.frames[0].editor.asc_nativeGetFile();
            } catch (e) {
                console.error(e);
                return;
            }
        };

        // Loading a checkpoint reorder the sheet starting from ID "5".
        // We have to reorder it manually when a checkpoint is created
        // so that the messages we send to the realtime channel are
        // loadable by users joining after the checkpoint
        var fixSheets = function () {
            try {
                var editor = window.frames[0].editor;
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
            if (err) {
                console.error(err);
                return void UI.alert(Messages.oo_saveError);
            }
            var i = Math.floor(ev.index / CHECKPOINT_INTERVAL);
            content.hashes[i] = {
                file: data.url,
                hash: ev.hash,
                index: ev.index
            };
            oldHashes = JSON.parse(JSON.stringify(content.hashes));
            content.saveLock = undefined;
            APP.onLocal();
            APP.realtime.onSettle(function () {
                fixSheets();
                UI.log(Messages.saved);
                if (ev.callback) {
                    return void ev.callback();
                }
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
                sframeChan.query('Q_OO_SAVE', data, function (err) {
                    onUploaded(ev, data, err);
                });
            }
        };
        APP.FM = common.createFileManager(fmConfig);

        var saveToServer = function () {
            var text = getContent();
            var blob = new Blob([text], {type: 'plain/text'});
            var file = getFileType();
            blob.name = (metadataMgr.getMetadataLazy().title || file.doc) + '.' + file.type;
            var data = {
                hash: ooChannel.lastHash,
                index: ooChannel.cpIndex
            };
            APP.FM.handleFile(blob, data);
        };
        var makeCheckpoint = function (force) {
            var locked = content.saveLock;
            if (!locked || !isUserOnline(locked) || force) {
                content.saveLock = myOOId;
                APP.onLocal();
                APP.realtime.onSettle(function () {
                    saveToServer();
                });
                return;
            }
            // The save is locked by someone else. If no new checkpoint is created
            // in the next 20 to 40 secondes and the lock is kept by the same user,
            // force the lock and make a checkpoint.
            var saved = stringify(content.hashes);
            var to = 20000 + (Math.random() * 20000);
            setTimeout(function () {
                if (stringify(content.hashes) === saved && locked === content.saveLock) {
                    makeCheckpoint(force);
                }
            }, to);
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
                        rtChannel.ready = true;
                        break;
                    case 'LEAVE':
                        removeClient(obj.data);
                        break;
                    case 'MESSAGE':
                        if (ooChannel.ready) {
                            ooChannel.send(obj.data.msg);
                            ooChannel.lastHash = obj.data.hash;
                            ooChannel.cpIndex++;
                        } else {
                            ooChannel.queue.push(obj.data);
                        }
                        break;
                }
            });
            cb();
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
        };

        var handleAuth = function (obj, send) {
            // OO is ready
            ooChannel.ready = true;
            // Get the content pushed after the latest checkpoint
            var changes = [];
            ooChannel.queue.forEach(function (data) {
                Array.prototype.push.apply(changes, data.msg.changes);
            });
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
                "g_cAscSpellCheckUrl": "/spellchecker",
                "settings":{"spellcheckerUrl":"/spellchecker","reconnection":{"attempts":50,"delay":2000}}
            });
            // Open the document
            send({
                type: "documentOpen",
                data: {"type":"open","status":"ok","data":{"Editor.bin":obj.openCmd.url}}
            });
            // Update current index
            var last = ooChannel.queue.pop();
            if (last) { ooChannel.lastHash = last.hash; }
            ooChannel.cpIndex += ooChannel.queue.length;
            // Apply existing locks
            deleteOfflineLocks();
            APP.onLocal();
            handleNewLocks(oldLocks, content.locks || {});

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

        // Add a lock
        var handleLock = function (obj, send) {
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
            // Answer to our onlyoffice
            send({
                type: "getLock",
                locks: getLock()
            });
            // Remove old locks
            deleteOfflineLocks();
            // Commit
            APP.onLocal();
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
            // Allow the changes
            send({
                type: "unSaveLock",
                index: ooChannel.cpIndex,
                time: +new Date()
            });
            // Send the changes
            rtChannel.sendMsg({
                type: "saveChanges",
                changes: parseChanges(obj.changes),
                changesIndex: ooChannel.cpIndex || 0,
                locks: [content.locks[getId()]],
                excelAdditionalInfo: null
            }, null, function (err, hash) {
                if (err) { return void console.error(err); }
                // Increment index and update latest hash
                ooChannel.cpIndex++;
                ooChannel.lastHash = hash;
                // Check if a checkpoint is needed
                if (ooChannel.cpIndex % CHECKPOINT_INTERVAL === 0) {
                    makeCheckpoint();
                }
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
                            send({
                                type: "saveLock",
                                saveLock: false
                            });
                            break;
                        case "getLock":
                            handleLock(obj, send);
                            break;
                        case "getMessages":
                            // OO chat messages?
                            send({ type: "message" });
                            break;
                        case "saveChanges":
                            handleChanges(obj, send);
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
                            break;
                    }
                });
            });
        };

        var ooLoaded = false;
        var startOO = function (blob, file) {
            if (APP.ooconfig) { return void console.error('already started'); }
            var url = URL.createObjectURL(blob);
            var lock = readOnly || !common.isLoggedIn();

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
                    "mode": readOnly || lock ? "view" : "edit"
                },
                "events": {
                    "onAppReady": function(/*evt*/) {
                        var $tb = $('iframe[name="frameEditor"]').contents().find('head');
                        var css = '#id-toolbar-full .toolbar-group:nth-child(2), #id-toolbar-full .separator:nth-child(3) { display: none; }' +
                                  '#fm-btn-save { display: none !important; }' +
                                  '#panel-settings-general tr.autosave { display: none !important; }' +
                                  '#panel-settings-general tr.coauth { display: none !important; }' +
                                  '#header { display: none !important; }' +
                                  '#id-toolbar-full-placeholder-btn-insertimage { display: none; }' +
                                  '#id-toolbar-full-placeholder-btn-insertequation { display: none; }';
                        $('<style>').text(css).appendTo($tb);
                        if (UI.findOKButton().length) {
                            UI.findOKButton().on('focusout', function () {
                                window.setTimeout(function () { UI.findOKButton().focus(); });
                            });
                        }
                    },
                }
            };
            window.onbeforeunload = function () {
                var ifr = document.getElementsByTagName('iframe')[0];
                if (ifr) { ifr.remove(); }
            };
            APP.docEditor = new window.DocsAPI.DocEditor("cp-app-oo-placeholder", APP.ooconfig);
            ooLoaded = true;
            makeChannel();
        };


        var exportFile = function() {
            var text = getContent();
            var suggestion = Title.suggestTitle(Title.defaultTitle);
            UI.prompt(Messages.exportPrompt,
                Util.fixFileName(suggestion) + '.bin', function (filename) {
                if (!(typeof(filename) === 'string' && filename)) { return; }
                var blob = new Blob([text], {type: "application/bin;charset=utf-8"});
                saveAs(blob, filename);
            });
        };

        var importFile = function(content) {
            // Abort if there is another real user in the channel (history keeper excluded)
            var m = metadataMgr.getChannelMembers().slice().filter(function (nId) {
                return nId.length === 32;
            });
            if (m.length > 1) {
                return void UI.alert(Messages.oo_cantUpload);
            }
            var blob = new Blob([content], {type: 'plain/text'});
            var file = getFileType();
            blob.name = (metadataMgr.getMetadataLazy().title || file.doc) + '.' + file.type;
            var uploadedCallback = function() {
                UI.confirm(Messages.oo_uploaded, function (yes) {
                    try {
                         window.frames[0].editor.setViewModeDisconnect();
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

        var loadLastDocument = function () {
            var lastCp = getLastCp();
            if (!lastCp) { return; }
            ooChannel.cpIndex = lastCp.index || 0;
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
                    return void console.error('XHR error', this.status);
                }
                var arrayBuffer = xhr.response;
                if (arrayBuffer) {
                    var u8 = new Uint8Array(arrayBuffer);
                    FileCrypto.decrypt(u8, key, function (err, decrypted) {
                        if (err) { return void console.error(err); }
                        var blob = new Blob([decrypted.content], {type: 'plain/text'});
                        startOO(blob, getFileType());
                    });
                }
            };
            xhr.send(null);
        };
        var loadDocument = function (newPad) {
            if (ooLoaded) { return; }
            var type = common.getMetadataMgr().getPrivateData().ooType;
            var file = getFileType();
            if (!newPad) {
                return void loadLastDocument();
            }
            var newText;
            switch (type) {
                case 'sheet' :
                    newText = EmptyCell();
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
            var blob = new Blob([newText], {type: 'text/plain'});
            startOO(blob, file);
        };

        var initializing = true;
        var $bar = $('#cp-toolbar');
        var cpNfInner;

        config = {
            patchTransformer: ChainPad.SmartJSONTransformer,
            // cryptpad debug logging (default is 1)
            // logLevel: 0,
            validateContent: function (content) {
                try {
                    JSON.parse(content);
                    return true;
                } catch (e) {
                    console.log("Failed to parse, rejecting patch");
                    return false;
                }
            }
        };

        var setEditable = function (state) {
            if (!state) {
                try {
                    window.frames[0].editor.setViewModeDisconnect(true);
                } catch (e) {}
            }
            console.log(state);
        };

        var stringifyInner = function () {
            var obj = {
                content: content,
                metadata: metadataMgr.getMetadataLazy()
            };
            // stringify the json and send it into chainpad
            return stringify(obj);
        };

        APP.getContent = function () { return content; };

        APP.onLocal = config.onLocal = function () {
            if (initializing) { return; }
            if (readOnly) { return; }

            // Update metadata
            var content = stringifyInner();
            APP.realtime.contentUpdate(content);
        };

        config.onInit = function (info) {
            readOnly = metadataMgr.getPrivateData().readOnly;

            Title = common.createTitle({});

            var configTb = {
                displayed: [
                    'chat',
                    'userlist',
                    'title',
                    'useradmin',
                    'spinner',
                    'newpad',
                    'share',
                    'limit',
                    'unpinnedWarning',
                    'notifications'
                ],
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

            var $rightside = toolbar.$rightside;

            if (window.CP_DEV_MODE) {
                var $save = common.createButton('save', true, {}, function () {
                    saveToServer();
                });
                $save.appendTo($rightside);
            }
            if (window.CP_DEV_MODE || DISPLAY_RESTORE_BUTTON) {
                common.createButton('', true, {
                    name: 'restore',
                    icon: 'fa-history',
                    hiddenReadOnly: true
                }).click(function () {
                    if (initializing) { return void console.error('initializing'); }
                    restoreLastCp();
                }).attr('title', 'Restore last checkpoint').appendTo($rightside);
            }

            var $export = common.createButton('export', true, {}, exportFile);
            $export.appendTo($rightside);

            var $import = common.createButton('import', true, {}, importFile);
            $import.appendTo($rightside);

            if (common.isLoggedIn()) {
                common.createButton('hashtag', true).appendTo($rightside);
            }

            var $forget = common.createButton('forget', true, {}, function (err) {
                if (err) { return; }
                setEditable(false);
            });
            $rightside.append($forget);

            var helpMenu = common.createHelpMenu(['beta', 'oo']);
            $('#cp-app-oo-editor').prepend(helpMenu.menu);
            toolbar.$drawer.append(helpMenu.button);

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
                    url: newLatest.file
                }, function () { });
                newDoc = !content.hashes || Object.keys(content.hashes).length === 0;
            } else {
                Title.updateTitle(Title.defaultTitle);
            }

            openRtChannel(function () {
                setMyId();
                oldHashes = JSON.parse(JSON.stringify(content.hashes));
                loadDocument(newDoc);
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

        config.onRemote = function () {
            if (initializing) { return; }
            var userDoc = APP.realtime.getUserDoc();
            var json = JSON.parse(userDoc);
            if (json.metadata) {
                metadataMgr.updateMetadata(json.metadata);
            }
            content = json.content;
            if (content.hashes) {
                var latest = getLastCp(true);
                var newLatest = getLastCp();
                if (newLatest.index > latest.index) {
                    fixSheets();
                    sframeChan.query('Q_OO_SAVE', {
                        url: newLatest.file
                    }, function () { });
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
        };

        config.onAbort = function () {
            // inform of network disconnect
            setEditable(false);
            toolbar.failed();
            UI.alert(Messages.common_connectionLost, undefined, true);
        };

        config.onConnectionChange = function (info) {
            setEditable(info.state);
            if (info.state) {
                UI.findOKButton().click();
                UI.confirm(Messages.oo_reconnect, function (yes) {
                    if (!yes) { return; }
                    common.gotoURL();
                });
            } else {
                offline = true;
                UI.findOKButton().click();
                UI.alert(Messages.common_connectionLost, undefined, true);
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
