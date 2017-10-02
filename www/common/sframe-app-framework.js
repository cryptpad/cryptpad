define([
    'jquery',
    '/bower_components/hyperjson/hyperjson.js',
    '/common/toolbar3.js',
    '/bower_components/chainpad-json-validator/json-ot.js',
    'json.sortify',
    '/bower_components/textpatcher/TextPatcher.js',
    '/common/cryptpad-common.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/customize/messages.js',
    '/common/common-util.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'less!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less2/main.less',
], function (
    $,
    Hyperjson,
    Toolbar,
    JsonOT,
    JSONSortify,
    TextPatcher,
    Cryptpad,
    nThen,
    SFCommon,
    Messages,
    Util)
{
    var SaveAs = window.saveAs;

    var UNINITIALIZED = 'UNINITIALIZED';

    var STATE = Object.freeze({
        DISCONNECTED: 'DISCONNECTED',
        FORGOTTEN: 'FORGOTTEN',
        INFINITE_SPINNER: 'INFINITE_SPINNER',
        INITIALIZING: 'INITIALIZING',
        HISTORY_MODE: 'HISTORY_MODE',
        READY: 'READY'
    });

    var onConnectError = function () {
        Cryptpad.errorLoadingScreen(Messages.websocketError);
    };

    var create = function (options, cb) {
        var evContentUpdate = Util.mkEvent();
        var evEditableStateChange = Util.mkEvent();
        var evOnReady = Util.mkEvent(true);
        var evOnDefaultContentNeeded = Util.mkEvent();

        var evStart = Util.mkEvent(true);

        var common;
        var cpNfInner;
        var textPatcher;
        var readOnly;
        var title;
        var toolbar;
        var state = STATE.DISCONNECTED;

        var toolbarContainer = options.toolbarContainer ||
            (function () { throw new Error("toolbarContainer must be specified"); }());
        var contentContainer = options.contentContainer ||
            (function () { throw new Error("contentContainer must be specified"); }());


        var titleRecommender = function () { return false; };
        var contentGetter = function () { return UNINITIALIZED; };
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

        var stateChange = function (newState) {
            var wasEditable = (state === STATE.READY);
            if (state === STATE.INFINITE_SPINNER) { return; }
            if (newState === STATE.INFINITE_SPINNER) {
                state = newState;
            } else if (state === STATE.DISCONNECTED && newState !== STATE.INITIALIZING) {
                throw new Error("Cannot transition from DISCONNECTED to " + newState);
            } else if (state !== STATE.READY && newState === STATE.HISTORY_MODE) {
                throw new Error("Cannot transition from " + state + " to " + newState);
            } else {
                state = newState;
            }
            switch (state) {
                case STATE.DISCONNECTED:
                case STATE.INITIALIZING: {
                    evStart.reg(function () { toolbar.reconnecting(); });
                    break;
                }
                case STATE.INFINITE_SPINNER: {
                    evStart.reg(function () { toolbar.failed(); });
                    break;
                }
                default:
            }
            if (wasEditable !== (state === STATE.READY)) {
                evEditableStateChange.fire(state === STATE.READY);
            }
        };

        var contentUpdate = function (newContent) {
            try {
                evContentUpdate.fire(newContent);
            } catch (e) {
                console.log(e.stack);
                Cryptpad.errorLoadingScreen(e.message);
            }
        };

        var onRemote = function () {
            if (state !== STATE.READY) { return; }

            var oldContent = normalize(contentGetter());
            var newContentStr = cpNfInner.chainpad.getUserDoc();

            var newContent = JSON.parse(newContentStr);
            var meta = extractMetadata(newContent);
            cpNfInner.metadataMgr.updateMetadata(meta);
            newContent = normalize(newContent);

            contentUpdate(newContent);

            if (!readOnly) {
                var newContent2NoMeta = normalize(contentGetter());
                var newContent2StrNoMeta = JSONSortify(newContent2NoMeta);
                var newContentStrNoMeta = JSONSortify(newContent);

                if (newContent2StrNoMeta !== newContentStrNoMeta) {
                    console.error("shjson2 !== shjson");
                    textPatcher(newContent2StrNoMeta);

                    /*  pushing back over the wire is necessary, but it can
                        result in a feedback loop, which we call a browser
                        fight */
                    if (module.logFights) {
                        // what changed?
                        var op = TextPatcher.diff(newContentStrNoMeta, newContent2StrNoMeta);
                        // log the changes
                        TextPatcher.log(newContentStrNoMeta, op);
                        var sop = JSON.stringify(TextPatcher.format(newContentStrNoMeta, op));

                        var index = module.fights.indexOf(sop);
                        if (index === -1) {
                            module.fights.push(sop);
                            console.log("Found a new type of browser disagreement");
                            console.log("You can inspect the list in your " +
                                "console at `REALTIME_MODULE.fights`");
                            console.log(module.fights);
                        } else {
                            console.log("Encountered a known browser disagreement: " +
                                "available at `REALTIME_MODULE.fights[%s]`", index);
                        }
                    }
                }
            }

            // Notify only when the content has changed, not when someone has joined/left
            if (JSONSortify(newContent) !== JSONSortify(oldContent)) {
                common.notify();
            }
        };

        var setHistoryMode = function (bool, update) {
            stateChange((bool) ? STATE.HISTORY_MODE : STATE.READY);
            if (!bool && update) { onRemote(); }
        };

        var onLocal = function () {
            if (state !== STATE.READY) { return; }
            if (readOnly) { return; }

            // stringify the json and send it into chainpad
            var content = normalize(contentGetter());

            if (typeof(content) !== 'object') {
                if (content === UNINITIALIZED) { return; }
                throw new Error("Content must be an object or array, type is " + typeof(content));
            }
            if (Array.isArray(content)) {
                // Pad
                content.push({ metadata: cpNfInner.metadataMgr.getMetadataLazy() });
            } else {
                content.metadata = cpNfInner.metadataMgr.getMetadataLazy();
            }

            var contentStr = JSONSortify(content);
            textPatcher(contentStr);
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

            var newPad = false;
            if (newContentStr === '') { newPad = true; }

            if (!newPad) {
                var newContent = JSON.parse(newContentStr);
                cpNfInner.metadataMgr.updateMetadata(extractMetadata(newContent));
                newContent = normalize(newContent);
                contentUpdate(newContent);

                if (!readOnly) {
                    var newContent2NoMeta = normalize(contentGetter());
                    var newContent2StrNoMeta = JSONSortify(newContent2NoMeta);
                    var newContentStrNoMeta = JSONSortify(newContent);

                    if (newContent2StrNoMeta !== newContentStrNoMeta) {
                        console.log('err');
                        console.error("shjson2 !== shjson");
                        console.log(newContent2StrNoMeta);
                        console.log(newContentStrNoMeta);
                        Cryptpad.errorLoadingScreen(Messages.wrongApp);
                        throw new Error();
                    }
                }
            } else {
                title.updateTitle(Cryptpad.initialName || title.defaultTitle);
                evOnDefaultContentNeeded.fire();
            }
            stateChange(STATE.READY);
            if (!readOnly) { onLocal(); }
            evOnReady.fire(newPad);

            Cryptpad.removeLoadingScreen(emitResize);

            if (newPad) {
                common.openTemplatePicker();
            }
        };
        var onConnectionChange = function (info) {
            stateChange(info.state ? STATE.INITIALIZING : STATE.DISCONNECTED);
            if (info.state) {
                Cryptpad.findOKButton().click();
            } else {
                Cryptpad.alert(Messages.common_connectionLost, undefined, true);
            }
        };

        var setFileExporter = function (extension, fe) {
            var $export = common.createButton('export', true, {}, function () {
                var ext = (typeof(extension) === 'function') ? extension() : extension;
                var suggestion = title.suggestTitle('cryptpad-document');
                Cryptpad.prompt(Messages.exportPrompt,
                    Cryptpad.fixFileName(suggestion) + '.' + ext, function (filename)
                {
                    if (!(typeof(filename) === 'string' && filename)) { return; }
                    var blob = fe();
                    SaveAs(blob, filename);
                });
            });
            toolbar.$drawer.append($export);
        };

        var setFileImporter = function (options, fi) {
            if (readOnly) { return; }
            toolbar.$drawer.append(
                common.createButton('import', true, options, function (c, f) {
                    contentUpdate(fi(c, f));
                    onLocal();
                })
            );
        };

        var feedback = function (action, force) {
            if (state === STATE.DISCONNECTED || state === STATE.INITIALIZING) { return; }
            common.feedback(action, force);
        };

        nThen(function (waitFor) {
            Cryptpad.addLoadingScreen();
            SFCommon.create(waitFor(function (c) { common = c; }));
        }).nThen(function (waitFor) {
            cpNfInner = common.startRealtime({
                // really basic operational transform
                transformFunction: options.transformFunction || JsonOT.validate,
                // cryptpad debug logging (default is 1)
                // logLevel: 0,
                validateContent: options.validateContent || function (content) {
                    try {
                        JSON.parse(content);
                        return true;
                    } catch (e) {
                        console.log("Failed to parse, rejecting patch");
                        return false;
                    }
                },
                onRemote: onRemote,
                onLocal: onLocal,
                onInit: function () { stateChange(STATE.INITIALIZING); },
                onReady: function () { evStart.reg(onReady); },
                onConnectionChange: onConnectionChange
            });

            var privReady = Util.once(waitFor());
            var checkReady = function () {
                if (typeof(cpNfInner.metadataMgr.getPrivateData().readOnly) === 'boolean') {
                    readOnly = cpNfInner.metadataMgr.getPrivateData().readOnly;
                    privReady();
                }
            };
            cpNfInner.metadataMgr.onChange(checkReady);
            checkReady();

            textPatcher = TextPatcher.create({ realtime: cpNfInner.chainpad });

            cpNfInner.onInfiniteSpinner(function () {
                toolbar.failed();
                cpNfInner.chainpad.abort();
                stateChange(STATE.INFINITE_SPINNER);
                Cryptpad.confirm(Messages.realtime_unrecoverableError, function (yes) {
                    if (!yes) { return; }
                    common.gotoURL();
                });
            });

            //Cryptpad.onLogout(function () { ... });

            Cryptpad.onError(function (info) {
                if (info && info.type === "store") {
                    onConnectError();
                }
            });
        }).nThen(function (waitFor) {

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

            title = common.createTitle({ getHeadingText: titleRecommender }, onLocal);
            var configTb = {
                displayed: ['userlist', 'title', 'useradmin', 'spinner', 'newpad', 'share', 'limit'],
                title: title.getTitleConfig(),
                metadataMgr: cpNfInner.metadataMgr,
                readOnly: readOnly,
                realtime: cpNfInner.chainpad,
                common: Cryptpad,
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
                    contentUpdate(JSON.parse(val) || ["BODY",{},[]]);
                },
                $toolbar: $(toolbarContainer)
            };
            var $hist = common.createButton('history', true, {histConfig: histConfig});
            toolbar.$drawer.append($hist);

            if (!cpNfInner.metadataMgr.getPrivateData().isTemplate) {
                var templateObj = {
                    rt: cpNfInner.chainpad,
                    getTitle: function () { return cpNfInner.metadataMgr.getMetadata().title; }
                };
                var $templateButton = common.createButton('template', true, templateObj);
                toolbar.$rightside.append($templateButton);
            }

            /* add a forget button */
            toolbar.$rightside.append(common.createButton('forget', true, {}, function (err) {
                if (err) { return; }
                stateChange(STATE.HISTORY_MODE);
            }));

            var $tags = common.createButton('hashtag', true);
            toolbar.$rightside.append($tags);

            cb(Object.freeze({
                // Register an event to be informed of a content update coming from remote
                // This event will pass you the object.
                onContentUpdate: evContentUpdate.reg,

                // Set the content supplier, this is the function which will supply the content
                // in the pad when requested by the framework.
                setContentGetter: function (cg) { contentGetter = cg; },

                // Inform the framework that the content of the pad has been changed locally.
                localChange: onLocal,

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