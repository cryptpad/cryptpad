// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * This module is used on realtime applications using non-ChainPad patches
 * (Office, Notes, etc.). These apps use static checkpoints (blobs) paired
 * with a separate channel to store patches.
 * With a JSON "content, the checkpoints (blob + channel) are stored in
 * the value "content.hashes" listing all this document's checkpoints.
 */

define([
    'jquery',
    '/components/nthen/index.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/common/common-ui-elements.js',
    '/common/common-interface.js',
    '/common/hyperscript.js',
    '/api/config',
    '/customize/application_config.js',
    '/common/common-feedback.js',
    '/customize/messages.js',
    '/common/onlyoffice/history.js',

    '/components/file-saver/FileSaver.min.js',
], function (
    $,
    nThen,
    Hash,
    Util,
    UIElements,
    UI,
    h,
    ApiConfig,
    AppConfig,
    Feedback,
    Messages,
    History)
{

    const stringify =  Util.sortify;

    // Call init once sframe-common is initialized
    const init = (APP, common) => {
        const tools = {};

        let content;
        let myLockId;

        const onRTCEvent = Util.mkEvent();
        const sframeChan = common.getSframeChannel();
        const metadataMgr = common.getMetadataMgr();

        const linkedModule = common.makeUniversal('linked-doc');
        const rtcModule = common.makeUniversal('rtchannel', {
            onEvent: obj => {
                onRTCEvent.fire(obj);
            }
        });

        const sortCpIndex = History.sortCpIndex;

        const getId = () => {
            const privateData = metadataMgr.getPrivateData();
            return metadataMgr.getNetfluxId() + '-' + privateData.clientId;
        };

        // LINKED DOCUMENTS
        const addLinkedCheckpoint = (cpData, cb) => {
            let parsed = Hash.parsePadUrl(cpData.file);
            let secret = Hash.getSecrets('file', parsed.hash);
            linkedModule.execCommand('ADD_LINKED_DATA', {
                content: {
                    type: 'checkpoints',
                    data: {
                        rtChannel: cpData.rtChannel,
                        blob: secret.channel
                    }
                }
            }, (obj) => {
                if (obj?.error) { console.error(obj.error); }
                const last = obj?.[0]?.checkpoints?.pop();
                if (last?.blob === secret.channel && last?.time) {
                    cpData.time = last.time;
                    APP.onLocal();
                }
                cb();
            });
        };
        const checkLinkedDocs = () => {
            const value = {
                checkpoints: []
            };
            // Get last 10 cps
            let hashes = content.hashes || {}; // checkpoints
            let sortedCp = sortCpIndex(hashes).slice(-10);
            sortedCp.forEach(cpIdx => {
                const cpData = hashes[cpIdx];
                let parsed = Hash.parsePadUrl(cpData.file);
                let secret = Hash.getSecrets('file', parsed.hash);
                if (!secret.channel) { return; }
                value.checkpoints.push({
                    blob: secret.channel,
                    rtChannel: cpData.rtChannel || content.channel
                });
            });
            // If < 10, add initial channel
            if (sortedCp.length < 10 && content.channel) {
                value.checkpoints.unshift({
                    blob: 0,
                    rtChannel: content.channel
                });
            }
            linkedModule.execCommand('CHECK_CURRENT_DOC', {
                // channel & signKey added in outer
                expectedJSON: value
            }, (obj) => {
                if (obj?.error) { console.error(obj.error); }
            });
        };

        // CHECKPOINTS
        const getLastCpId = (oldHashes) => {
            const hashes = oldHashes || content.hashes;
            if (!hashes || !Object.keys(hashes).length) { return 0; }
            const allIdx = sortCpIndex(hashes);
            return allIdx[allIdx.length - 1];
        };
        const getLastCp = () => {
            const hashes = content.hashes;
            if (!hashes || !Object.keys(hashes).length) { return {}; }
            const idx = sortCpIndex(hashes);
            const lastIndex = idx[idx.length - 1];
            if (typeof(lastIndex) === "undefined" || !hashes[lastIndex]) {
                return {};
            }
            return JSON.parse(JSON.stringify(hashes[lastIndex]));
        };
        const deleteLastCp = (i) => {
            const hashes = content.hashes;
            if (!hashes || !Object.keys(hashes).length) { return {}; }
            i = i || 0;
            const idx = sortCpIndex(hashes);
            const lastIndex = idx[idx.length - 1 - i];
            if (typeof(lastIndex) === "undefined" || !hashes[lastIndex]) {
                return;
            }
            delete hashes[lastIndex];
            APP.onLocal();
            APP.realtime.onSettle(function () {
                UI.log(Messages.saved);
            });
        };

        // CLIENTS

        const onClientRemoved = Util.mkEvent();
        const removeClient = (obj) => {
            let tabId = metadataMgr.getNetfluxId() + '-' + obj.id;
            if (content.ids[tabId]) {
                delete content.ids[tabId];
                onClientRemoved.fire(tabId);
                if (content.locks) { delete content.locks[tabId]; }
                APP.onLocal();
            }
        };
        // Make sure former tabs on the same worker don't have locks
        const checkClients = (clients) => {
            if (!clients) { return; }
            Object.keys(content.ids).forEach(function (id) {
                let tabId = Number(id.slice(33)); // netflux ID and "-"
                if (clients.indexOf(tabId) === -1) {
                    removeClient({
                        id: tabId
                    });
                }
            });
        };


        // RT_CHANNEL

        const onRTCMessage = Util.mkEvent();
        const onRTCHistorySynced = Util.mkEvent();
        const openRtChannel = (cpData, cb) => {
            const channel = cpData?.rtChannel || content.channel;
            const lastCpHash = cpData?.hash;
            sframeChan.query('Q_RTC_OPENCHANNEL', {
                channel, lastCpHash
            }, function (err, obj) {
                if (obj?.error) {
                    // XXX handle error
                    console.error(obj.error);
                } else {
                    checkClients(obj?.clients);
                }
                cb();
            });
            onRTCEvent.reg(obj => {
                switch (obj.ev) {
                    case 'LEAVE':
                        removeClient(obj.data);
                        break;
                    case 'MESSAGE':
                        onRTCMessage.fire(obj.data);
                        break;
                    case 'HISTORY_SYNCED':
                        onRTCHistorySynced.fire()
                        break;

                }
            });
        };

        const sendCmd = (data, cb) => {
            if (APP.history) { return; }
            sframeChan.query('Q_RTC_COMMAND', data, cb);
        };
        const rtChannel = {
            getHistory: function (cb) {
                sendCmd({
                    cmd: 'GET_HISTORY',
                    data: {}
                }, cb);
            },
            sendMsg: function (msg, cp, cb) {
                sendCmd({
                    cmd: 'SEND_MESSAGE',
                    data: {
                        msg: msg,
                        isCp: cp
                    }
                }, cb);
            },
        };

        const onCpUploaded = Util.mkEvent();
        const onCpUploadError = Util.mkEvent();
        const onUploaded = (ev, data, err) => {
            // Save as template: make a new chainpad with a single CP
            if (ev.newTemplate) {
                var _content = ev.newTemplate;
                _content.hashes = {};
                _content.hashes[1] = {
                    file: data.url,
                    rtChannel: Hash.createChannelId(),
                    version: APP.currentVersion
                };
                _content.initTemplate = true;
                _content.version = APP.currentVersion;
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
                    Feedback.send('RTC_TEMPLATE_CREATED');
                });
                return;
            }

            // Upload checkpoint
            content.saveLock = undefined;
            // Get the last cp idx
            var all = sortCpIndex(content.hashes || {});
            var current = all[all.length - 1] || 0;

            var i = current + 1;
            var cpData = content.hashes[i] = {
                file: data.url,
                rtChannel: Hash.createChannelId(),
                version: APP.currentVersion
            };
            content.locks = {};
            content.ids = {};
            onCpUploaded.fire();
            APP.onLocal();
            APP.realtime.onSettle(function () {
                UI.log(Messages.saved);
                // Add the checkpoint data to the linked documents
                addLinkedCheckpoint(cpData, function () {
                    APP.realtime.onSettle(function () {
                        if (ev.callback) {
                            return void ev.callback(cpData);
                        }
                    });
                });
            });
        };

        const onChainpadReady = () => {
            // Mark blob as "linked" on new template created
            const priv = metadataMgr.getPrivateData();
            const url = content.hashes?.[1]?.file;
            if (!(priv?.isTemplate && content.initTemplate && url)) {
                // Abort if not a template with linked docs
                return;
            }

            // Get blob id
            const id = Hash.hrefToHexChannelId(url);

            // Check ownership of first blob
            common.getPadMetadata({channel: id}, (md) => {
                const owners = md.owners;
                const owned = common.isOwned(owners);
                // Not owned? nothing to do
                if (owned === false) { return; }

                // Owned? set linked data
                sframeChan.query('Q_SET_PAD_METADATA', {
                    channel: id,
                    command: 'SET_LINKED',
                    value: priv.channel,
                    teamId: owned !== true && Number(owned)
                }, function (err, res) {
                    if (err ||= res?.error) { console.error(err); }
                    delete content.initTemplate;
                    APP.onLocal();
                });
            });
        };

        const fmConfig = {
            noHandlers: true,
            noStore: true,
            body: $('body'),
            onUploaded: function (ev, data) {
                if (!data?.url) { return; }
                onUploaded(ev, data);
            },
            onError: function (err) {
                onCpUploadError.fire(err);
            }
        };
        const FM = common.createFileManager(fmConfig);

        const uploadCheckpoint = (blob, data, link) => {
            if (link) {
                const privateData = metadataMgr.getPrivateData();
                blob.linked = privateData.channel;
            }
            FM.handleFile(blob, data);
        };
        const restoreLastCp = () => {
            content.saveLock = myLockId;
            APP.onLocal();
            // XXX make sure APP.realtime is defined onReady
            APP.realtime.onSettle(function () {
                onUploaded({}, {
                    url: getLastCp().file,
                });
            });
        };

        // XXX XXX XXX XXX XXX
        const makeCheckpoint = (force) => {
            let lock = content.saveLock && isUserOnline(content.saveLock);
            if (lock && !force) { return; }
            // XXX !loggedIn ==> allow temp rpc?
            content.saveLock = myLockId;
            APP.onLocal();
            APP.realtime.onSettle(function () {
                saveToServer(); // XXX managed by the app because we need to get the content, filetype, special cases, ooChannel, migrate, etc.
            });
        };

        let cpTo;
        // If a saveLock (checkpoint upload) hasn't completed in 20 to 40
        // seconds, cancel it and do it yourselves.
        const checkCheckpoint = () => {
            clearTimeout(cpTo);
            const oldCp = stringify(content.hashes);
            const oldLock = content.saveLock;
            const to = 20000 + (Math.random() * 20000);
            cpTo = setTimeout(function () {
                // If no checkpoint was added and the same user still
                // has the lock then make a checkpoint if needed
                const newCp = stringify(content.hashes);
                const newLock = content.saveLock;
                if (newCp === oldCp && newLock === oldLock) {
                    content.saveLock = undefined;
                    makeCheckpoint();
                }
            }, to);
        };

        const deleteOffline = () => {
            const ids = content.ids;
            const users = Object.keys(metadataMgr.getMetadata().users);
            Object.keys(ids).forEach(function (id) {
                let nId = id.slice(0,32);
                if (users.indexOf(nId) === -1) {
                    delete ids[id];
                }
            });
            APP.onLocal();
        };
        const isUserOnline = (lockId) => {
            // Remove ids for users that have left the channel
            deleteOffline();
            const ids = content.ids;
            // Check if the provided id is in the ID list
            return Object.keys(ids).some(function (id) {
                return lockId === ids[id].lockId;
            });
        };
        const setIds = (data = {}) => {
            deleteOffline(); // Remove offline users' ids

            const myId = getId();

            // Generate own lockId
            if (!myLockId) {
                myLockId = Util.createRandomInteger();
                let f = (id) => {
                    return ids[id].lockId === myLockId;
                };
                while (Object.keys(content.ids).some(f)) {
                    myLockId = Util.createRandomInteger();
                }
            }

            data.lockId = myLockId;
            content.ids[myId] = data;
            APP.onLocal();

            return myLockId;
        };

        // TODO: Maybe later?
        // loadLastDocument ? (download static file + decrypt)
        // loadDocument?
        // $historyButton, $snapshotButton
        // Some part of makeCheckpoint/saveToServer?

        // Now or later?
        // openVersionHash 
        // loadTemplate / openTemplatePicker

        // XXX ???
        // EV_OO_DOC_READY
        // Integration channel?


        // Call setContent each time the content variable is overriden
        const setContent = _content => {
            content = _content;
        };

        tools.rtcModule = rtcModule;
        tools.getId = getId;

        // Linked docs
        tools.addLinkedCheckpoint = addLinkedCheckpoint;
        tools.checkLinkedDocs = checkLinkedDocs;

        // Checkpoint
        tools.getLastCpId = getLastCpId;
        tools.getLastCp = getLastCp;
        tools.deleteLastCp = deleteLastCp;

        tools.onUploaded = onUploaded;
        tools.onCpUploaded = onCpUploaded;
        tools.onCpUploadError = onCpUploadError;
        tools.uploadCheckpoint = uploadCheckpoint;
        tools.restoreLastCp = restoreLastCp;
        tools.checkCheckpoint = checkCheckpoint;

        // RtChannel
        tools.openRtChannel = openRtChannel;
        tools.onRTCMessage = onRTCMessage;
        tools.onRTCHistorySynced = onRTCHistorySynced;
        tools.rtChannel = rtChannel;

        // User id
        tools.deleteOffline = deleteOffline;
        tools.setIds = setIds;
        tools.removeClient = removeClient;
        tools.onClientRemoved = onClientRemoved;

        tools.onChainpadReady = onChainpadReady;
        tools.setContent = setContent;

/* USAGE
  * Initialize rtcTools as soon as "common" is ready
  * Call "setContent" everytime the "content" variable changes
    * init, onReady, onRemote
  * Call "setMyId" to provide a unique user ID (for saveLock)
    * init
  * Call "onChainpadReady"
    * onReady
  * Call "checkCheckpoint" when a saveLock is detected
    * onReady, onRemote
*/


        return tools;
    };

    return { init };
});
