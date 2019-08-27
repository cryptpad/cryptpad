define([
    'jquery',
    '/bower_components/hyperjson/hyperjson.js',
    '/common/toolbar3.js',
    'json.sortify',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/customize/messages.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/common/common-thumbnail.js',
    '/common/common-feedback.js',
    '/customize/application_config.js',
    '/bower_components/chainpad/chainpad.dist.js',
    '/common/test.js',

    '/bower_components/file-saver/FileSaver.min.js',
    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
], function (
    $,
    Hyperjson,
    Toolbar,
    JSONSortify,
    nThen,
    SFCommon,
    Messages,
    Util,
    Hash,
    UI,
    Thumb,
    Feedback,
    AppConfig,
    ChainPad,
    Test)
{
    var SaveAs = window.saveAs;

    var UNINITIALIZED = 'UNINITIALIZED';

    var STATE = Object.freeze({
        DISCONNECTED: 'DISCONNECTED',
        FORGOTTEN: 'FORGOTTEN',
        DELETED: 'DELETED',
        INFINITE_SPINNER: 'INFINITE_SPINNER',
        ERROR: 'ERROR',
        INITIALIZING: 'INITIALIZING',
        HISTORY_MODE: 'HISTORY_MODE',
        READY: 'READY'
    });

    var badStateTimeout = typeof(AppConfig.badStateTimeout) === 'number' ?
        AppConfig.badStateTimeout : 30000;

    var create = function (options, cb) {
        var evContentUpdate = Util.mkEvent();
        var evCursorUpdate = Util.mkEvent();
        var evEditableStateChange = Util.mkEvent();
        var evOnReady = Util.mkEvent(true);
        var evOnDefaultContentNeeded = Util.mkEvent();

        var evStart = Util.mkEvent(true);

        var mediaTagEmbedder;
        var $embedButton;

        var common;
        var cpNfInner;
        var readOnly;
        var title;
        var cursor;
        var toolbar;
        var state = STATE.DISCONNECTED;
        var firstConnection = true;

        var toolbarContainer = options.toolbarContainer ||
            (function () { throw new Error("toolbarContainer must be specified"); }());
        var contentContainer = options.contentContainer ||
            (function () { throw new Error("contentContainer must be specified"); }());

        Test(function (t) {
            console.log("Here is the test");
            evOnReady.reg(function () {
                cpNfInner.chainpad.onSettle(function () {
                    console.log("The test has passed");
                    t.pass();
                });
            });
        });

        var textContentGetter;
        var titleRecommender = function () { return false; };
        var contentGetter = function () { return UNINITIALIZED; };
        var cursorGetter;
        var normalize0 = function (x) { return x; };

        var normalize = function (x) {
            x = normalize0(x);
            if (Array.isArray(x)) {
                var outa = Array.prototype.slice.call(x);
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

        var stateChange = function (newState, text) {
            var wasEditable = (state === STATE.READY);
            if (state === STATE.DELETED || state === STATE.ERROR) { return; }
            if (state === STATE.INFINITE_SPINNER && newState !== STATE.READY) { return; }
            if (newState === STATE.INFINITE_SPINNER || newState === STATE.DELETED) {
                state = newState;
            } else if (state === STATE.DISCONNECTED && newState !== STATE.INITIALIZING) {
                throw new Error("Cannot transition from DISCONNECTED to " + newState); // FIXME we are getting "DISCONNECTED to READY" on prod
            } else if (state !== STATE.READY && newState === STATE.HISTORY_MODE) {
                throw new Error("Cannot transition from " + state + " to " + newState);
            } else {
                state = newState;
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
                default:
            }
            if (wasEditable !== (state === STATE.READY)) {
                evEditableStateChange.fire(state === STATE.READY);
            }
        };

        var oldContent;
        var contentUpdate = function (newContent, waitFor) {
            if (JSONSortify(newContent) === JSONSortify(oldContent)) { return; }
            try {
                evContentUpdate.fire(newContent, waitFor);
                oldContent = newContent;
            } catch (e) {
                console.log(e.stack);
                UI.errorLoadingScreen(e.message);
            }
        };

        var onLocal;
        var onRemote = function () {
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

        var setHistoryMode = function (bool, update) {
            stateChange((bool) ? STATE.HISTORY_MODE : STATE.READY);
            if (!bool && update) { onRemote(); }
        };

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

        onLocal = function (padChange) {
            if (state !== STATE.READY) { return; }
            if (readOnly) { return; }

            // stringify the json and send it into chainpad
            var content = normalize(contentGetter());

            if (typeof(content) !== 'object') {
                if (content === UNINITIALIZED) { return; }
                throw new Error("Content must be an object or array, type is " + typeof(content));
            }

            if (padChange && hasChanged(content)) {
                cpNfInner.metadataMgr.addAuthor();
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

        var onReady = function () {
            var newContentStr = cpNfInner.chainpad.getUserDoc();
            if (state === STATE.DELETED) { return; }

            UI.updateLoadingProgress({ state: -1 }, false);

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
                    contentUpdate(newContent, waitFor);
                } else {
                    if (!cpNfInner.metadataMgr.getPrivateData().isNewFile) {
                        // We're getting 'new pad' but there is an existing file
                        // We don't know exactly why this can happen but under no circumstances
                        // should we overwrite the content, so lets just try again.
                        console.log("userDoc is '' but this is not a new pad.");
                        console.log("Either this is an empty document which has not been touched");
                        console.log("Or else something is terribly wrong, reloading.");
                        Feedback.send("NON_EMPTY_NEWDOC");
                        setTimeout(function () { common.gotoURL(); }, 1000);
                        return;
                    }
                    console.log('updating title');
                    title.updateTitle(title.defaultTitle);
                    evOnDefaultContentNeeded.fire();
                }
            }).nThen(function () {
                stateChange(STATE.READY);
                firstConnection = false;
                if (!readOnly) { onLocal(); }
                evOnReady.fire(newPad);

                common.openPadChat(onLocal);
                if (!readOnly && cursorGetter) {
                    common.openCursorChannel(onLocal);
                    cursor = common.createCursor();
                    cursor.onCursorUpdate(function (data) {
                        var newContentStr = cpNfInner.chainpad.getUserDoc();
                        var hjson = normalize(JSON.parse(newContentStr));
                        evCursorUpdate.fire(data, hjson);
                    });
                }

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

                var skipTemp = Util.find(privateDat, ['settings', 'general', 'creation', 'noTemplate']);
                var skipCreation = Util.find(privateDat, ['settings', 'general', 'creation', 'skip']);
                if (newPad && (!AppConfig.displayCreationScreen || (!skipTemp && skipCreation))) {
                    common.openTemplatePicker();
                }
            });
        };
        var onConnectionChange = function (info) {
            if (state === STATE.DELETED) { return; }
            stateChange(info.state ? STATE.INITIALIZING : STATE.DISCONNECTED, info.permanent);
            /*if (info.state) {
                UI.findOKButton().click();
            } else {
                UI.alert(Messages.common_connectionLost, undefined, true);
            }*/
        };

        var onError = function (err) {
            common.onServerError(err, toolbar, function () {
                stateChange(STATE.DELETED);
            });
        };

        var setFileExporter = function (extension, fe, async) {
            var $export = common.createButton('export', true, {}, function () {
                var ext = (typeof(extension) === 'function') ? extension() : extension;
                var suggestion = title.suggestTitle('cryptpad-document');
                UI.prompt(Messages.exportPrompt,
                    Util.fixFileName(suggestion) + ext, function (filename)
                {
                    if (!(typeof(filename) === 'string' && filename)) { return; }
                    if (async) {
                        fe(function (blob) {
                            SaveAs(blob, filename);
                        });
                        return;
                    }
                    var blob = fe();
                    SaveAs(blob, filename);
                });
            });
            toolbar.$drawer.append($export);
        };

        var setFileImporter = function (options, fi, async) {
            if (readOnly) { return; }
            toolbar.$drawer.append(
                common.createButton('import', true, options, function (c, f) {
                    if (async) {
                        fi(c, f, function (content) {
                            nThen(function (waitFor) {
                                contentUpdate(content, waitFor);
                            }).nThen(function () {
                                onLocal();
                            });
                        });
                        return;
                    }
                    nThen(function (waitFor) {
                        contentUpdate(fi(c, f), waitFor);
                    }).nThen(function () {
                        onLocal();
                    });
                })
            );
        };

        var feedback = function (action, force) {
            if (state === STATE.DISCONNECTED || state === STATE.INITIALIZING) { return; }
            Feedback.send(action, force);
        };

        var createFilePicker = function () {
            if (!common.isLoggedIn()) { return; }
            common.initFilePicker({
                onSelect: function (data) {
                    if (data.type !== 'file') {
                        console.log("Unexpected data type picked " + data.type);
                        return;
                    }
                    if (!mediaTagEmbedder) { console.log('mediaTagEmbedder missing'); return; }
                    if (data.type !== 'file') { console.log('unhandled embed type ' + data.type); return; }
                    var privateDat = cpNfInner.metadataMgr.getPrivateData();
                    var origin = privateDat.fileHost || privateDat.origin;
                    var src = data.src = data.src.slice(0,1) === '/' ? origin + data.src : data.src;
                    mediaTagEmbedder($('<media-tag src="' + src +
                        '" data-crypto-key="cryptpad:' + data.key + '"></media-tag>'), data);
                }
            });
            $embedButton = common.createButton('mediatag', true).click(function () {
                common.openFilePicker({
                    types: ['file'],
                    where: ['root']
                });
            }).appendTo(toolbar.$rightside).hide();
        };
        var setMediaTagEmbedder = function (mte) {
            if (!common.isLoggedIn()) { return; }
            if (!mte || readOnly) {
                $embedButton.hide();
                return;
            }
            $embedButton.show();
            mediaTagEmbedder = mte;
        };

        nThen(function (waitFor) {
            UI.addLoadingScreen();
            SFCommon.create(waitFor(function (c) { common = c; }));
            UI.updateLoadingProgress({
                state: 1
            }, false);
        }).nThen(function (waitFor) {
            common.getSframeChannel().onReady(waitFor());
        }).nThen(function (waitFor) {
            Test.registerInner(common.getSframeChannel());
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
                onInit: function () {
                    UI.updateLoadingProgress({
                        state: 2,
                        progress: 0.1
                    }, false);
                    stateChange(STATE.INITIALIZING);
                },
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
                    throw new Error("ChainPad.getLag() does not exist, please `bower update`");
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
                displayed: [
                    'chat',
                    'userlist',
                    'title',
                    'useradmin',
                    'spinner',
                    'newpad',
                    'share',
                    'limit',
                    'request',
                    'unpinnedWarning',
                    'notifications'
                ],
                title: title.getTitleConfig(),
                metadataMgr: cpNfInner.metadataMgr,
                readOnly: readOnly,
                realtime: cpNfInner.chainpad,
                sfCommon: common,
                $container: $(toolbarContainer),
                $contentContainer: $(contentContainer)
            };
            toolbar = Toolbar.create(configTb);
            title.setToolbar(toolbar);

            /* add a history button */
            var histConfig = {
                onLocal: onLocal,
                onRemote: onRemote,
                setHistory: setHistoryMode,
                applyVal: function (val) {
                    contentUpdate(JSON.parse(val) || ["BODY",{},[]], function (h) {
                        return h;
                    });
                },
                $toolbar: $(toolbarContainer)
            };
            var $hist = common.createButton('history', true, {histConfig: histConfig});
            $hist.addClass('cp-hidden-if-readonly');
            toolbar.$drawer.append($hist);

            if (!cpNfInner.metadataMgr.getPrivateData().isTemplate) {
                var templateObj = {
                    rt: cpNfInner.chainpad,
                    getTitle: function () { return cpNfInner.metadataMgr.getMetadata().title; }
                };
                var $templateButton = common.createButton('template', true, templateObj);
                toolbar.$rightside.append($templateButton);
            }

            var $importTemplateButton = common.createButton('importtemplate', true);
            toolbar.$drawer.append($importTemplateButton);

            /* add a forget button */
            toolbar.$rightside.append(common.createButton('forget', true, {}, function (err) {
                if (err) { return; }
                stateChange(STATE.FORGOTTEN);
            }));

            if (common.isLoggedIn()) {
                var $tags = common.createButton('hashtag', true);
                toolbar.$rightside.append($tags);
            }

            var $properties = common.createButton('properties', true);
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
                isLocked: function () { return state !== STATE.READY; },

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

                // Determine the internal state of the framework.
                getState: function () { return state; },

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
