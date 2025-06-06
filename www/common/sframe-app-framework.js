// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/components/hyper-json/hyperjson.js',
    '/common/toolbar.js',
    'json.sortify',
    '/components/nthen/index.js',
    '/common/sframe-common.js',
    '/customize/messages.js',
    '/common/hyperscript.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/common-thumbnail.js',
    '/common/common-feedback.js',
    '/common/inner/snapshots.js',
    '/customize/application_config.js',
    '/components/chainpad/chainpad.dist.js',
    '/common/test.js',

    '/components/file-saver/FileSaver.min.js',
    'css!/components/bootstrap/dist/css/bootstrap.min.css',
    'css!/components/components-font-awesome/css/font-awesome.min.css',
], function (
    $,
    Hyperjson,
    Toolbar,
    JSONSortify,
    nThen,
    SFCommon,
    Messages,
    h,
    Util,
    Hash,
    UI,
    UIElements,
    Thumb,
    Feedback,
    Snapshots,
    AppConfig,
    ChainPad /*,
    /* Test */)
{
    var SaveAs = window.saveAs;

    var UNINITIALIZED = 'UNINITIALIZED';

    // History and snapshots mode shouldn't receive realtime data or push to chainpad
    var unsyncMode = false;

    var STATE = Object.freeze({
        DISCONNECTED: 'DISCONNECTED',
        FORGOTTEN: 'FORGOTTEN',
        DELETED: 'DELETED',
        INFINITE_SPINNER: 'INFINITE_SPINNER',
        ERROR: 'ERROR',
        INITIALIZING: 'INITIALIZING',
        READY: 'READY'
    });

    var badStateTimeout = typeof(AppConfig.badStateTimeout) === 'number' ?
        AppConfig.badStateTimeout : 30000;

    var create = function (options, cb) {
        var evContentUpdate = Util.mkEvent();
        var evIntegrationSave = Util.mkEvent();
        var evCursorUpdate = Util.mkEvent();
        var evEditableStateChange = Util.mkEvent();
        var evOnReady = Util.mkEvent(true);
        var evOnDefaultContentNeeded = Util.mkEvent();

        var evStart = Util.mkEvent(true);

        var mediaTagEmbedder;
        var fileImporter, fileExporter;
        var $embedButton;

        var common;
        var cpNfInner;
        var readOnly;
        var title;
        var cursor;
        var toolbar;
        var state = STATE.DISCONNECTED;
        var firstConnection = true;
        var integration;
        let integrationChannel;

        var toolbarContainer = options.toolbarContainer ||
            (function () { throw new Error("toolbarContainer must be specified"); }());
        var contentContainer = options.contentContainer ||
            (function () { throw new Error("contentContainer must be specified"); }());

/*
        Test(function (t) {
            console.log("Here is the test");
            evOnReady.reg(function () {
                cpNfInner.chainpad.onSettle(function () {
                    console.log("The test has passed");
                    t.pass();
                });
            });
        });
*/

        var onLocal;
        var textContentGetter;
        var titleRecommender = function () { return false; };
        var contentGetter = function () { return UNINITIALIZED; };
        var cursorGetter;
        var normalize0 = function (x) { return x; };
        var EMPTY = {};

        var normalize = function (x) {
            x = normalize0(x);
            if (Array.isArray(x)) {
                var outa = Array.prototype.slice.call(x);
                EMPTY = [];
                if (typeof(outa[outa.length-1].metadata) === 'object') { outa.pop(); }
                return outa;
            } else if (typeof(x) === 'object') {
                var outo = $.extend({}, x);
                delete outo.metadata;
                return outo;
            }
        };

        var extractMetadata = function (content) {
            if (Array.isArray(content)) {
                var m = content[content.length - 1];
                if (typeof(m.metadata) === 'object') {
                    // pad
                    return m.metadata;
                }
            } else if (typeof(content.metadata) === 'object') {
                return content.metadata;
            }
            return;
        };

        var deleteSnapshot = function (hash) {
            var md = Util.clone(cpNfInner.metadataMgr.getMetadata());
            var snapshots = md.snapshots = md.snapshots || {};
            delete snapshots[hash];
            cpNfInner.metadataMgr.updateMetadata(md);
            onLocal();
        };
        var makeSnapshot = function (title, cb) {
            if (state !== STATE.READY) {
                return void cb('NOT_READY');
            }
            var sframeChan = common.getSframeChannel();
            sframeChan.query("Q_GET_LAST_HASH", null, function (err, obj) {
                if (err || (obj && obj.error)) { return void UI.warn(Messages.error); }
                var hash = obj.hash;
                if (!hash) { cb('NO_HASH'); return void UI.warn(Messages.error); }
                var md = Util.clone(cpNfInner.metadataMgr.getMetadata());
                var snapshots = md.snapshots = md.snapshots || {};
                if (snapshots[hash]) { cb('EEXISTS'); return void UI.warn(Messages.snapshot_error_exists); }
                snapshots[hash] = {
                    title: title,
                    time: +new Date()
                };
                cpNfInner.metadataMgr.updateMetadata(md);
                onLocal();
                cpNfInner.chainpad.onSettle(cb);
            });
        };

        var stateChange = function (newState, text) {
            var wasEditable = (state === STATE.READY && !unsyncMode);
            if (newState !== state) {
                if (state === STATE.DELETED || state === STATE.ERROR) { return; }
                if (state === STATE.INFINITE_SPINNER && newState !== STATE.READY) { return; }
                if (newState === STATE.INFINITE_SPINNER || newState === STATE.DELETED) {
                    state = newState;
                } else if (newState === STATE.ERROR) {
                    state = newState;
                } else if (state === STATE.DISCONNECTED && newState !== STATE.INITIALIZING) {
                    throw new Error("Cannot transition from DISCONNECTED to " + newState); // FIXME we are getting "DISCONNECTED to READY" on prod
                } else {
                    state = newState;
                }
            } else if (state === STATE.READY) {
                // Refreshing ready state
            }
            switch (state) {
                case STATE.DISCONNECTED:
                case STATE.INITIALIZING: {
                    evStart.reg(function () {
                        if (firstConnection) {
                            toolbar.initializing();
                            return;
                        }
                        if (text) {
                            // text is a boolean here. It means we won't try to reconnect
                            toolbar.failed();
                            return;
                        }
                        toolbar.reconnecting();
                    });
                    break;
                }
                case STATE.INFINITE_SPINNER: {
                    evStart.reg(function () { toolbar.failed(); });
                    break;
                }
                case STATE.ERROR: {
                    evStart.reg(function () {
                        if (text === 'ERESTRICTED') {
                            toolbar.failed(true);
                            return;
                        }
                        toolbar.errorState(true, text);
                        var msg = Messages.chainpadError;
                        UI.errorLoadingScreen(msg, true, true);
                    });
                    break;
                }
                case STATE.FORGOTTEN: {
                    evStart.reg(function () { toolbar.forgotten(); });
                    break;
                }
                case STATE.DELETED: {
                    evStart.reg(function () { toolbar.deleted(); });
                    break;
                }
                case STATE.READY: {
                    evStart.reg(function () { toolbar.ready(); });
                    break;
                }
                default:
            }
            var isEditable = (state === STATE.READY && !unsyncMode);
            if (wasEditable !== isEditable) {
                evEditableStateChange.fire(isEditable);
            }
        };

        var oldContent;
        var contentUpdate = function (newContent, waitFor) {
            var sNew = JSONSortify(newContent);
            if (sNew === JSONSortify(oldContent)) { return; }
            try {
                if (integration && sNew !== JSONSortify(normalize(oldContent || EMPTY))) {
                    evIntegrationSave.fire();
                }
                evContentUpdate.fire(newContent, waitFor);
                oldContent = newContent;
            } catch (e) {
                console.error(e);
                console.log(e.stack);
                UI.errorLoadingScreen(e.message);
            }
        };

        var onRemote = function () {
            if (unsyncMode) { return; }
            if (state !== STATE.READY) { return; }

            var oldContent = normalize(contentGetter());
            var newContentStr = cpNfInner.chainpad.getUserDoc();

            var newContent = JSON.parse(newContentStr);
            var meta = extractMetadata(newContent);
            cpNfInner.metadataMgr.updateMetadata(meta);
            newContent = normalize(newContent);

            nThen(function (waitFor) {
                contentUpdate(newContent, waitFor);
            }).nThen(function () {
                if (!readOnly) {
                    var newContent2NoMeta = normalize(contentGetter());
                    var newContent2StrNoMeta = JSONSortify(newContent2NoMeta);
                    var newContentStrNoMeta = JSONSortify(newContent);

                    if (newContent2StrNoMeta !== newContentStrNoMeta) {
                        console.error("shjson2 !== shjson");
                        onLocal();

                        /*  pushing back over the wire is necessary, but it can
                            result in a feedback loop, which we call a browser
                            fight */
                        // what changed?
                        var ops = ChainPad.Diff.diff(newContentStrNoMeta, newContent2StrNoMeta);
                        // log the changes
                        console.log(newContentStrNoMeta);
                        console.log(ops);
                        var sop = JSON.stringify([ newContentStrNoMeta, ops ]);

                        var fights = window.CryptPad_fights = window.CryptPad_fights || [];
                        var index = fights.indexOf(sop);
                        if (index === -1) {
                            fights.push(sop);
                            console.log("Found a new type of browser disagreement");
                            console.log("You can inspect the list in your " +
                                "console at `REALTIME_MODULE.fights`");
                            console.log(fights);
                        } else {
                            console.log("Encountered a known browser disagreement: " +
                                "available at `REALTIME_MODULE.fights[%s]`", index);
                        }
                    }
                }

                // Notify only when the content has changed, not when someone has joined/left
                if (JSONSortify(newContent) !== JSONSortify(oldContent)) {
                    common.notify();
                }
            });
        };

        var setUnsyncMode = function (bool) {
            if (unsyncMode === bool) { return; }
            unsyncMode = bool;
            evEditableStateChange.fire(state === STATE.READY && !unsyncMode);
            stateChange(state);
        };

        // History mode:
        // When "bool" is true, we're entering in history mode
        // When "bool" is false and "update" is true, it means we're closing the history
        // and should update the content
        // When "bool" is false and "update" is false, it means we're restoring an old version,
        // no need to refresh
        var setHistoryMode = function (bool, update) {
            if (!bool && !update && state !== STATE.READY) { return false; }
            cpNfInner.metadataMgr.setHistory(bool);
            toolbar.setHistory(bool);
            setUnsyncMode(bool);
            if (!bool && update) { onRemote(); }
            else {
                setTimeout(cpNfInner.metadataMgr.refresh);
            }
            return true;
        };
        var closeSnapshot = function (restore) {
            if (restore && state !== STATE.READY) { return false; }
            toolbar.setSnapshot(false);
            setUnsyncMode(false); // Unlock onLocal and onRemote
            if (restore) { onLocal(); } // Restore? commit the content
            onRemote(); // Make sure we're back to the realtime content
            return true;
        };
        var loadSnapshot = function (hash, data) {
            setUnsyncMode(true);
            toolbar.setSnapshot(true);
            Snapshots.create(common, {
                readOnly: readOnly,
                $toolbar: $(toolbarContainer),
                hash: hash,
                data: data,
                close: closeSnapshot,
                applyVal: function (val) {
                    var newContent = JSON.parse(val);
                    var meta = extractMetadata(newContent);
                    cpNfInner.metadataMgr.updateMetadata(meta);
                    contentUpdate(normalize(newContent) || ["BODY",{},[]], function (h) {
                        return h;
                    });
                },
            });
        };

        // Get the realtime metadata when in history mode
        var getLastMetadata = function () {
            if (!unsyncMode) { return; }
            var newContentStr = cpNfInner.chainpad.getUserDoc();
            var newContent = JSON.parse(newContentStr);
            var meta = extractMetadata(newContent);
            return meta;
        };
        var setLastMetadata = function (md) {
            if (!unsyncMode) { return; }
            if (state !== STATE.READY) { return; }
            var newContentStr = cpNfInner.chainpad.getAuthDoc();
            var newContent = JSON.parse(newContentStr);
            if (Array.isArray(newContent)) {
                newContent[3] = {
                    metadata: md
                };
            } else {
                newContent.metadata = md;
            }
            try {
                cpNfInner.chainpad.contentUpdate(JSONSortify(newContent));
                return true;
            } catch (e) {
                console.error(e);
                return false;
            }
        };

        /*
        var hasChanged = function (content) {
            try {
                var oldValue = JSON.parse(cpNfInner.chainpad.getUserDoc());
                if (Array.isArray(content)) {
                    return JSONSortify(content) !== JSONSortify(normalize(oldValue));
                } else if (content.content) {
                    return content.content !== oldValue.content;
                }
            } catch (e) {}
            return false;
        };
        */

        var integrationOnPatch = function () {
            cpNfInner.offPatchSent(integrationOnPatch);
            evIntegrationSave.fire();
        };
        onLocal = function (/*padChange*/) {
            if (unsyncMode) { return; }
            if (state !== STATE.READY) { return; }
            if (readOnly) { return; }

            // stringify the json and send it into chainpad
            var content = normalize(contentGetter());

            if (typeof(content) !== 'object') {
                if (content === UNINITIALIZED) { return; }
                throw new Error("Content must be an object or array, type is " + typeof(content));
            }

            /*
            if (padChange && hasChanged(content)) {
                //cpNfInner.metadataMgr.addAuthor();
            }
            */
            if (integration && oldContent && JSONSortify(content) !== JSONSortify(normalize(oldContent || {}))) {
                cpNfInner.offPatchSent(integrationOnPatch);
                cpNfInner.onPatchSent(integrationOnPatch);
            }

            oldContent = content;


            if (Array.isArray(content)) {
                // Pad
                content.push({ metadata: cpNfInner.metadataMgr.getMetadataLazy() });
            } else {
                content.metadata = cpNfInner.metadataMgr.getMetadataLazy();
            }

            var contentStr = JSONSortify(content);
            try {
                cpNfInner.chainpad.contentUpdate(contentStr);
            } catch (e) {
                stateChange(STATE.ERROR, e.message);
                console.error(e);
            }
            if (cpNfInner.chainpad.getUserDoc() !== contentStr) {
                console.error("realtime.getUserDoc() !== shjson");
            }
        };

        var emitResize = function () {
            var evt = window.document.createEvent('UIEvents');
            evt.initUIEvent('resize', true, false, window, 0);
            window.dispatchEvent(evt);
        };

        var versionHashEl;
        var onInit = function () {
            UI.updateLoadingProgress({
                type: 'pad',
                progress: 0.1
            });
            stateChange(STATE.INITIALIZING);
            if ($('.cp-help-container').length) {
                var privateDat = cpNfInner.metadataMgr.getPrivateData();
                // Burn after reading warning
                $('.cp-help-container').before(common.getBurnAfterReadingWarning());
                // Versioned link warning
                if (privateDat.isHistoryVersion) {
                    versionHashEl = h('div.alert.alert-warning.cp-burn-after-reading');
                    $('.cp-help-container').before(versionHashEl);
                }
            }

            var sframeChan = common.getSframeChannel();
            sframeChan.on('EV_VERSION_TIME', function (time) {
                if (!versionHashEl) { return; }
                var vTime = time;
                var vTimeStr = vTime ? new Date(vTime).toLocaleString()
                                     : 'v' + privateDat.isHistoryVersion;
                var vTxt = Messages._getKey('infobar_versionHash',  [vTimeStr]);
                versionHashEl.innerText = vTxt;
                versionHashEl = undefined;
            });
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
        var onCacheReady = function () {
            stateChange(STATE.INITIALIZING);
            toolbar.offline(true);
            var newContentStr = cpNfInner.chainpad.getUserDoc();
            if (toolbar) {
                // Check if we have a new chainpad instance
                toolbar.resetChainpad(cpNfInner.chainpad);
            }

            // Invalid cache
            if (newContentStr === '') { return void onCorruptedCache(); }

            var privateDat = cpNfInner.metadataMgr.getPrivateData();
            var type = privateDat.app;

            var newContent = JSON.parse(newContentStr);
            var metadata = extractMetadata(newContent);

            // Make sure we're using the correct app for this cache
            if (metadata && typeof(metadata.type) !== 'undefined' && metadata.type !== type) {
                return void onCorruptedCache();
            }

            cpNfInner.metadataMgr.updateMetadata(metadata);
            newContent = normalize(newContent);
            if (!unsyncMode) {
                contentUpdate(newContent, function () { return function () {}; });
            }

            UI.removeLoadingScreen(emitResize);
        };
        var onReady = function () {
            toolbar.offline(false);

            var newContentStr = cpNfInner.chainpad.getUserDoc();
            if (state === STATE.DELETED) { return; }

            if (toolbar) {
                // Check if we have a new chainpad instance
                toolbar.resetChainpad(cpNfInner.chainpad);
            }

            var newPad = false;
            if (newContentStr === '') { newPad = true; }

            var privateDat = cpNfInner.metadataMgr.getPrivateData();
            var type = privateDat.app;

            // contentUpdate may be async so we need an nthen here
            nThen(function (waitFor) {
                if (!newPad) {
                    var newContent = JSON.parse(newContentStr);
                    var metadata = extractMetadata(newContent);
                    if (metadata && typeof(metadata.type) !== 'undefined' && metadata.type !== type) {
                        var errorText = Messages.typeError;
                        UI.errorLoadingScreen(errorText);
                        waitFor.abort();
                        return;
                    }
                    cpNfInner.metadataMgr.updateMetadata(metadata);
                    newContent = normalize(newContent);
                    if (!unsyncMode) {
                        contentUpdate(newContent, waitFor);
                    }
                } else {
                    var priv = cpNfInner.metadataMgr.getPrivateData();
                    if (!priv.isNewFile) {
                        // We're getting 'new pad' but there is an existing file
                        // We don't know exactly why this can happen but under no circumstances
                        // should we overwrite the content, so lets just try again.
                        console.log("userDoc is '' but this is not a new pad.");
                        console.log("Either this is an empty document which has not been touched");
                        console.log("Or else something is terribly wrong, reloading.");
                        Feedback.send("NON_EMPTY_NEWDOC");
                        // The cache may be wrong, empty it and reload after.
                        waitFor.abort();
                        onCorruptedCache();
                        return;
                    }
                    if (priv.initialState) {
                        var blob = priv.initialState;
                        var file = new File([blob], 'document.'+priv.integrationConfig.fileType);
                        stateChange(STATE.READY); // Required for fileImporter
                        UIElements.importContent('text/plain', waitFor(fileImporter), {})(file);
                        title.updateTitle(file.name);
                    } else {
                        title.updateTitle(title.defaultTitle);
                        evOnDefaultContentNeeded.fire();
                    }
                }
            }).nThen(function () {
                // We have a valid chainpad, reenable cache fix in case we reconnect with
                // a corrupted cache
                noCache = false;

                stateChange(STATE.READY);

                oldContent = undefined;

                if (!readOnly) { onLocal(); }
                evOnReady.fire(newPad);

                // In forms, only editors can see the chat
                if (!readOnly || type !== 'form') { common.openPadChat(onLocal); }

                if (!readOnly && cursorGetter) {
                    common.openCursorChannel(onLocal);
                    cursor = common.createCursor(onLocal);
                    cursor.onCursorUpdate(function (data) {
                        var newContentStr = cpNfInner.chainpad.getUserDoc();
                        var hjson = normalize(JSON.parse(newContentStr));
                        evCursorUpdate.fire(data, hjson);
                    });
                } else {
                    common.getMetadataMgr().setDegraded(false);
                }

                if (privateDat.integration) {
                    common.openIntegrationChannel(onLocal);
                    integrationChannel = common.getSframeChannel();
                    var integrationSave = function (cb) {
                        var ext = privateDat.integrationConfig.fileType;

                        var upload = Util.once(function (_blob) {
                            integrationChannel.query('Q_INTEGRATION_SAVE', {
                                blob: _blob
                            }, cb, {
                                raw: true
                            });
                        });

                        // "fe" (fileExpoter) can be sync or async depending on the app
                        // we need to handle both cases
                        var syncBlob = fileExporter(function (asyncBlob) {
                            upload(asyncBlob);
                        }, ext);
                        if (syncBlob) {
                            upload(syncBlob);
                        }
                    };
                    const integrationHasUnsavedChanges = function(unsavedChanges, cb) {
                        integrationChannel.query('Q_INTEGRATION_HAS_UNSAVED_CHANGES', unsavedChanges, cb);
                    };
                    var inte = common.createIntegration(integrationSave,
                                            integrationHasUnsavedChanges);
                    if (inte) {
                        integration = true;
                        evIntegrationSave.reg(function () {
                            inte.changed();
                        });
                    }
                    if (firstConnection) {
                        integrationChannel.on('Q_INTEGRATION_NEEDSAVE', function (data, cb) {
                            integrationSave(function (obj) {
                                if (obj && obj.error) { console.error(obj.error); }
                                cb();
                            });
                        });
                    }
                }

                firstConnection = false;

                UI.removeLoadingScreen(emitResize);

                if (AppConfig.textAnalyzer && textContentGetter) {
                    AppConfig.textAnalyzer(textContentGetter, privateDat.channel);
                }

                if (options.thumbnail && privateDat.thumbnails) {
                    if (type) {
                        options.thumbnail.type = type;
                        options.thumbnail.getContent = function () {
                            if (!cpNfInner.chainpad) { return; }
                            return cpNfInner.chainpad.getUserDoc();
                        };
                        Thumb.initPadThumbnails(common, options.thumbnail);
                    }
                }

                common.checkTrimHistory();
            });
        };
        var onConnectionChange = function (info) {
            if (state === STATE.DELETED) { return; }
            stateChange(info.state ? STATE.INITIALIZING : STATE.DISCONNECTED, info.permanent);
            /*if (info.state) {
                UIElements.reconnectAlert();
            } else {
                UIElements.disconnectAlert();
            }*/
        };

        var onError = function (err) {
            common.onServerError(err, null, function () {
                if (err.type === 'ERESTRICTED') {
                    stateChange(STATE.ERROR, err.type);
                    return;
                }
                stateChange(STATE.DELETED);
            });
        };

        var setFileExporter = function (extension, fe, async) {
            fileExporter = fe;
            var $exportButton = common.createButton('export', true, {}, function () {
                var ext = (typeof(extension) === 'function') ? extension() : extension;
                var suggestion = title.suggestTitle('cryptpad-document');
                ext = ext || '.txt';
                var types = [];
                if (Array.isArray(ext) && ext.length) {
                    ext.forEach(function (_ext) {
                        types.push({
                            tag: 'a',
                            attributes: {
                                'data-value': _ext,
                            },
                            content: _ext
                        });
                    });
                    ext = ext[0];
                } else {
                    types.push({
                        tag: 'a',
                        attributes: {
                            'data-value': ext,
                        },
                        content: ext
                    });
                }
                types.push({
                    tag: 'a',
                    attributes: {
                        'data-value': '',
                    },
                    content: ' ',
                });
                var dropdownConfig = {
                    text: ext, // Button initial text
                    caretDown: true,
                    options: types, // Entries displayed in the menu
                    isSelect: true,
                    initialValue: ext,
                    common: common
                };
                var $select = UIElements.createDropdown(dropdownConfig);
                UI.prompt(Messages.exportPrompt,
                    Util.fixFileName(suggestion), function (filename)
                {
                    if (!(typeof(filename) === 'string' && filename)) { return; }
                    console.error(filename);
                    var ext = $select.getValue();
                    filename = filename + ext;
                    if (async) {
                        fe(function (blob) {
                            SaveAs(blob, filename);
                        }, ext);
                        return;
                    }
                    var blob = fe(null, ext);
                    SaveAs(blob, filename);
                }, {
                    typeInput: $select[0]
                });
                $select.find('button').addClass('btn');
            });
            var $export = UIElements.getEntryFromButton($exportButton);
            toolbar.$drawer.append($export);
        };

        var setFileImporter = function (options, fi, async) {
            const priv = cpNfInner.metadataMgr.getPrivateData();
            const isReadOnlyIntegration = priv.isNewFile &&
                Boolean(priv.integrationConfig) &&
                priv.initialState;
            if (readOnly && !isReadOnlyIntegration) { return; }
            fileImporter = function (c, f) {
                console.error(state, STATE.READY, unsyncMode);
                if (state !== STATE.READY || unsyncMode) {
                    return void UI.warn(Messages.disconnected);
                }
                if (async) {
                    fi(c, f, function (content) {
                        nThen(function (waitFor) {
                            contentUpdate(normalize(content), waitFor);
                        }).nThen(function () {
                            onLocal();
                        });
                    });
                    return;
                }
                nThen(function (waitFor) {
                    var content = fi(c, f);
                    if (typeof(content) === "undefined") {
                        return void UI.warn(Messages.importError);
                    }
                    contentUpdate(normalize(content), waitFor);
                }).nThen(function () {
                    onLocal();
                });
            };
            var $importButton = common.createButton('import', true, options, fileImporter);
            var $import = UIElements.getEntryFromButton($importButton);
            toolbar.$drawer.append($import);
        };

        var feedback = function (action, force) {
            if (state === STATE.DISCONNECTED || state === STATE.INITIALIZING) { return; }
            Feedback.send(action, force);
        };

        var createFilePicker = function () {
            if (!common.isLoggedIn()) { return; }
            $embedButton = common.createButton('mediatag', true).click(function () {
                if (!cpNfInner.metadataMgr.getPrivateData().isTop) {
                    return void UIElements.openDirectlyConfirmation(common);
                }

                var cfg = {
                    types: ['file', 'link'],
                    where: ['root']
                };
                if ($embedButton.data('filter')) { cfg.filter = $embedButton.data('filter'); }
                common.openFilePicker(cfg, function (data) {
                    // Embed links
                    if (data.static) {
                        var a = h('a', {
                            href: data.href
                        }, data.name);
                        mediaTagEmbedder($(a), data);
                        return;
                    }
                    // Embed files
                    if (data.type !== 'file') {
                        console.log("Unexpected data type picked " + data.type);
                        return;
                    }
                    if (!mediaTagEmbedder) { console.log('mediaTagEmbedder missing'); return; }
                    if (data.type !== 'file') { console.log('unhandled embed type ' + data.type); return; }
                    common.setPadAttribute('atime', +new Date(), null, data.href);
                    var privateDat = cpNfInner.metadataMgr.getPrivateData();
                    var origin = privateDat.fileHost || privateDat.origin;
                    var src = data.src = data.src.slice(0,1) === '/' ? origin + data.src : data.src;
                    var mt = UI.mediaTag(src, data.key);
                    mediaTagEmbedder($(mt), data);
                });
            }).appendTo(toolbar.$bottomL).hide();
        };
        var setMediaTagEmbedder = function (mte, filter) {
            if (!common.isLoggedIn()) { return; }
            if (!mte || readOnly) {
                $embedButton.hide();
                return;
            }
            if (filter) { $embedButton.data('filter', filter); }
            $embedButton.show();
            mediaTagEmbedder = mte;
        };

        nThen(function (waitFor) {
            UI.addLoadingScreen();
            SFCommon.create(waitFor(function (c) { common = c; }));
        }).nThen(function (waitFor) {
            common.getSframeChannel().onReady(waitFor());
        }).nThen(function (waitFor) {
            //Test.registerInner(common.getSframeChannel());
            common.handleNewFile(waitFor);
        }).nThen(function (waitFor) {
            cpNfInner = common.startRealtime({
                // really basic operational transform
                patchTransformer: options.patchTransformer || ChainPad.SmartJSONTransformer,

                // cryptpad debug logging (default is 1)
                logLevel: 1,
                validateContent: options.validateContent || function (content) {
                    try {
                        JSON.parse(content);
                        return true;
                    } catch (e) {
                        console.log("Failed to parse, rejecting patch");
                        console.log(e.stack);
                        console.log(content);
                        return false;
                    }
                },
                onRemote: onRemote,
                onLocal: onLocal,
                onInit: onInit,
                onCacheReady: function () { evStart.reg(onCacheReady); },
                onReady: function () { evStart.reg(onReady); },
                onConnectionChange: onConnectionChange,
                onError: onError,
                updateLoadingProgress: UI.updateLoadingProgress
            });

            var privReady = Util.once(waitFor());
            var checkReady = function () {
                if (typeof(cpNfInner.metadataMgr.getPrivateData().readOnly) === 'boolean') {
                    readOnly = cpNfInner.metadataMgr.getPrivateData().readOnly;
                    privReady();
                }
            };
            cpNfInner.metadataMgr.onChange(checkReady);
            cpNfInner.metadataMgr.onRequestSync(function () {
                var newContentStr = cpNfInner.chainpad.getUserDoc();
                var newContent = JSON.parse(newContentStr);
                var meta = extractMetadata(newContent);
                cpNfInner.metadataMgr.updateMetadata(meta);
            });
            checkReady();

            var infiniteSpinnerModal = false;
            window.setInterval(function () {
                if (state === STATE.DISCONNECTED) { return; }
                if (state === STATE.DELETED) { return; }
                if (state === STATE.ERROR) { return; }
                var l;
                try {
                    l = cpNfInner.chainpad.getLag();
                } catch (e) {
                    throw new Error("ChainPad.getLag() does not exist, please `npm install && npm run install:components`");
                }
                if (l.lag < badStateTimeout) { return; }

                if (infiniteSpinnerModal) { return; }
                infiniteSpinnerModal = true;
                stateChange(STATE.INFINITE_SPINNER);
                UI.confirm(Messages.realtime_unrecoverableError, function (yes) {
                    if (!yes) { return; }
                    common.gotoURL();
                });
                cpNfInner.chainpad.onSettle(function () {
                    infiniteSpinnerModal = false;
                    UI.findCancelButton().click();
                    stateChange(STATE.READY);
                    onRemote();
                });
            }, 2000);

            //common.onLogout(function () { ... });
        }).nThen(function (waitFor) {

            if (readOnly) { $('body').addClass('cp-readonly'); }

            var done = waitFor();
            var intr;
            var check = function () {
                if (!$(toolbarContainer).length) { return; }
                if (!$(contentContainer).length) { return; }
                if ($(toolbarContainer).length !== 1) { throw new Error("multiple toolbarContainers"); }
                if ($(contentContainer).length !== 1) { throw new Error("multiple contentContainers"); }
                clearInterval(intr);
                done();
            };
            intr = setInterval(function () {
                console.log('waited 50ms for toolbar and content containers');
                check();
            }, 50);
            check();

        }).nThen(function () {

            title = common.createTitle({
                getHeadingText: function () { return titleRecommender(); }
            }, onLocal);
            var configTb = {
                displayed: ['pad'],
                title: title.getTitleConfig(),
                metadataMgr: cpNfInner.metadataMgr,
                readOnly: readOnly,
                realtime: cpNfInner.chainpad,
                sfCommon: common,
                $container: $(toolbarContainer),
                $contentContainer: $(contentContainer),
                skipLink: options.skipLink,
            };
            toolbar = Toolbar.create(configTb);
            title.setToolbar(toolbar);

            /* add a history button */
            var histConfig = {
                onLocal: onLocal,
                onRemote: onRemote,
                setHistory: setHistoryMode,
                extractMetadata: extractMetadata, // extract from current version
                getLastMetadata: getLastMetadata, // get from authdoc
                setLastMetadata: setLastMetadata, // set to userdoc/authdoc
                applyVal: function (val) {
                    var newContent = JSON.parse(val);
                    var meta = extractMetadata(newContent);
                    cpNfInner.metadataMgr.updateMetadata(meta);
                    contentUpdate(normalize(newContent) || ["BODY",{},[]], function (h) {
                        return h;
                    });
                },
                $toolbar: $(toolbarContainer)
            };
            var $histButton = common.createButton('history', true, {histConfig: histConfig});
            var $hist = UIElements.getEntryFromButton($histButton);
            toolbar.$drawer.append($hist);

            var $snapshotButton = common.createButton('snapshots', true, {
                remove: deleteSnapshot,
                make: makeSnapshot,
                load: loadSnapshot
            });
            var $snapshot = UIElements.getEntryFromButton($snapshotButton);
            toolbar.$drawer.append($snapshot);


            var $copyButton = common.createButton('copy', true);
            var $copy = UIElements.getEntryFromButton($copyButton);
            toolbar.$drawer.append($copy);

            var $store = common.createButton('storeindrive', true);
            var $storeButton = UIElements.getEntryFromButton($store);
            toolbar.$drawer.append($storeButton);

            if (!cpNfInner.metadataMgr.getPrivateData().isTemplate) {
                var templateObj = {
                    rt: cpNfInner.chainpad,
                    getTitle: function () { return cpNfInner.metadataMgr.getMetadata().title; }
                };
                var $templateButton = common.createButton('template', true, templateObj);
                var $template = UIElements.getEntryFromButton($templateButton);
                toolbar.$drawer.append($template);

            }

            var $importTemplateButton = common.createButton('importtemplate', true);
            if (!readOnly) {
                var $importTemplate = UIElements.getEntryFromButton($importTemplateButton);
                toolbar.$drawer.append($importTemplate);
            }

            /* add a forget button = trash button */
            var $forgetButton = common.createButton('forget', true, {}, function (err) {
                if (err) { return; }
                stateChange(STATE.FORGOTTEN);
            });
            var $forget = UIElements.getEntryFromButton($forgetButton);
            toolbar.$drawer.append($forget);


            if (common.isLoggedIn()) {
                var $tagsButton = common.createButton('hashtag', true);
                var $tags = UIElements.getEntryFromButton($tagsButton);
                toolbar.$drawer.append($tags);
            }

            var $propertiesButton = common.createButton('properties', true);
            var $properties = UIElements.getEntryFromButton($propertiesButton);
            toolbar.$drawer.append($properties);

            createFilePicker();

            cb(Object.freeze({
                // Register an event to be informed of a content update coming from remote
                // This event will pass you the object.
                onContentUpdate: evContentUpdate.reg,

                // Set the content supplier, this is the function which will supply the content
                // in the pad when requested by the framework.
                setContentGetter: function (cg) { contentGetter = cg; },

                // Set the function providing the cursor position when request by the framework.
                setCursorGetter: function (cg) {
                    toolbar.showColors();
                    cursorGetter = cg;
                },
                onCursorUpdate: evCursorUpdate.reg,
                updateCursor: function () {
                    if (cursor && cursorGetter) {
                        var newContentStr = cpNfInner.chainpad.getUserDoc();
                        var data = normalize(JSON.parse(newContentStr));
                        cursor.updateCursor(cursorGetter(data));
                    }
                },

                // Set a text content supplier, this is a function which will give a text
                // representation of the pad content if a text analyzer is configured
                setTextContentGetter: function (tcg) { textContentGetter = tcg; },

                // Inform the framework that the content of the pad has been changed locally.
                localChange: function () { onLocal(true); },

                // Register to be informed if the state (whether the document is editable) changes.
                onEditableChange: evEditableStateChange.reg,

                // Determine whether the UI should be locked for editing.
                isLocked: function () { return state !== STATE.READY || unsyncMode; },

                // Determine whether the pad is a "read only" pad and cannot be changed.
                isReadOnly: function () { return readOnly; },

                // Call this to supply a function which can recommend a good title for the pad,
                // if possible.
                setTitleRecommender: function (ush) { titleRecommender = ush; },

                // Register to be called when the pad has completely loaded
                // (just before the loading screen is removed).
                // This is only called ONCE.
                onReady: evOnReady.reg,

                // Register to be called when a new pad is being setup and default content is
                // needed. When you are called back you must put the content in the UI and then
                // return and then the content getter (setContentGetter()) will be called.
                onDefaultContentNeeded: evOnDefaultContentNeeded.reg,

                // Set a file exporter, this takes 2 arguments.
                // 1. <string> A file extension which will be proposed when saving the file.
                // 2. <function> A function which when called, will return a Blob containing the
                //               file to be saved.
                setFileExporter: setFileExporter,

                // Set a file importer, this takes 2 arguments.
                // 1. <string> The MIME Type of the types of file to allow importing.
                // 2. <function> A function which takes a single string argument and puts the
                //               content into the UI.
                setFileImporter: setFileImporter,

                // Set a function which will normalize the content returned by the content getter
                // such as removing extra fields.
                setNormalizer: function (n) { normalize0 = n; },

                // Set a function which should take a jquery element which is a media tag and place
                // it in the document. If this is not called then there will be no embed button,
                // if this is called a second time with a null function, it will remove the embed
                // button from the toolbar.
                setMediaTagEmbedder: setMediaTagEmbedder,

                // Call the CryptPad feedback API.
                feedback: feedback,

                // Call this after all of the handlers are setup.
                start: evStart.fire,

                // Call this, when the user wants to add an image from drive.
                insertImage: function(data, cb) {
                    require(['/common/inner/image-dialog.js'], function(imageDialog) {
                        imageDialog.openImageDialog(common, integrationChannel, data, cb);
                    });
                },

                // Determine the internal state of the framework.
                getState: function () { return state; },

                isIntegrated: function() { return cpNfInner.metadataMgr.getPrivateData().integration; },

                // Internals
                _: {
                    sfCommon: common,
                    toolbar: toolbar,
                    cpNfInner: cpNfInner,
                    title: title
                }
            }));
        });
    };
    return { create: create };
});
