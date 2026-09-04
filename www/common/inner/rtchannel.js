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
    '/common/hyperscript.js',
    '/api/config',
    '/customize/application_config.js',
    '/customize/messages.js',
    '/common/onlyoffice/history.js',

    '/components/file-saver/FileSaver.min.js',
], function (
    $,
    nThen,
    Hash,
    Util,
    UIElements,
    h,
    ApiConfig,
    AppConfig,
    Messages,
    History)
{

    let content;
    // Call init once sframe-common is initialized
    const init = (APP, common) => {
        const tools = {};

        const onRTCEvent = Util.mkEvent();
        const sframeChan = common.getSframeChannel();

        const linkedModule = common.makeUniversal('linked-doc');
        const rtcModule = common.makeUniversal('rtchannel', {
            onEvent: obj => {
                onRTCEvent.fire(obj);
            }
        });

        const sortCpIndex = History.sortCpIndex;

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

        // RT_CHANNEL

        const onRTCLeave = Util.mkEvent();
        const onRTCMessage = Util.mkEvent();
        const onRTCHistorySynced = Util.mkEvent();
        const openRtChannel = (cpData, cb) => {
            const channel = cpData?.rtChannel || content.channel;
            const lastCpHash = cpData?.hash;
            sframeChan.query('Q_RTC_OPENCHANNEL', {
                channel, lastCpHash
            }, function (err, obj) {
                if (obj?.error) {
                    console.error(obj.error);
                    return void cb(obj.error);
                }
                cb(void 0, obj?.clients);
            });
            onRTCEvent.reg(obj => {
                switch (obj.ev) {
                    case 'LEAVE':
                        onRTCLeave.fire(obj.data);
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

        // XXX to add
        // onUploaded
        // fmConfig / APP.FM
        // new function "uploadCheckpoint" which calls APP.FM.handleFile
          // TODO/NOTE/MAYBE manage content.saveLock?
        // restoreLastCp
        // checkCheckpoint
        // loadLastDocument ? (download static file + decrypt)
        // loadDocument?
        // $historyButton, $snapshotButton

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

        // Linked docs
        tools.addLinkedCheckpoint = addLinkedCheckpoint;
        tools.checkLinkedDocs = checkLinkedDocs;

        // Checkpoint
        tools.getLastCpId = getLastCpId;
        tools.getLastCp = getLastCp;
        tools.deleteLastCp = deleteLastCp;

        // RtChannel
        tools.openRtChannel = openRtChannel;
        tools.onRTCLeave = onRTCLeave;
        tools.onRTCMessage = onRTCMessage;
        tools.onRTCHistorySynced = onRTCHistorySynced;
        tools.rtChannel = rtChannel;


        tools.setContent = setContent;

        return tools;
    };

    return { init };
});
