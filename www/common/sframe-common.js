define([
    'jquery',
    '/bower_components/nthen/index.js',
    '/customize/messages.js',
    '/common/sframe-chainpad-netflux-inner.js',
    '/common/sframe-channel.js',
    '/common/sframe-common-title.js',
    '/common/common-ui-elements.js',
    '/common/sframe-common-history.js',
    '/common/sframe-common-file.js',
    '/common/sframe-common-codemirror.js',
    '/common/metadata-manager.js',

    '/customize/application_config.js',
    '/common/common-realtime.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-thumbnail.js',
    '/common/common-interface.js',
    '/common/common-feedback.js',
    '/common/common-language.js',
    '/bower_components/localforage/dist/localforage.min.js'
], function (
    $,
    nThen,
    Messages,
    CpNfInner,
    SFrameChannel,
    Title,
    UIElements,
    History,
    File,
    CodeMirror,
    MetadataMgr,
    AppConfig,
    CommonRealtime,
    Util,
    Hash,
    Thumb,
    UI,
    Feedback,
    Language,
    localForage
) {
    // Chainpad Netflux Inner
    var funcs = {};
    var ctx = {};

    funcs.Messages = Messages;

    var evRealtimeSynced = Util.mkEvent(true);

    funcs.startRealtime = function (options) {
        if (ctx.cpNfInner) { return ctx.cpNfInner; }
        options.sframeChan = ctx.sframeChan;
        options.metadataMgr = ctx.metadataMgr;
        ctx.cpNfInner = CpNfInner.start(options);
        ctx.cpNfInner.metadataMgr.onChangeLazy(options.onLocal);
        ctx.cpNfInner.whenRealtimeSyncs(function () { evRealtimeSynced.fire(); });
        return ctx.cpNfInner;
    };

    funcs.getMetadataMgr = function () { return ctx.metadataMgr; };
    funcs.getSframeChannel = function () { return ctx.sframeChan; };
    funcs.getAppConfig = function () { return AppConfig; };

    funcs.isLoggedIn = function () {
        return ctx.metadataMgr.getPrivateData().accountName;
    };

    // MISC

    // Call the selected function with 'funcs' as a (new) first parameter
    var callWithCommon = function (f) {
        return function () {
            [].unshift.call(arguments, funcs);
            return f.apply(null, arguments);
        };
    };

    // UI
    funcs.createUserAdminMenu = callWithCommon(UIElements.createUserAdminMenu);
    funcs.initFilePicker = callWithCommon(UIElements.initFilePicker);
    funcs.openFilePicker = callWithCommon(UIElements.openFilePicker);
    funcs.openTemplatePicker = callWithCommon(UIElements.openTemplatePicker);
    funcs.displayMediatagImage = callWithCommon(UIElements.displayMediatagImage);
    funcs.displayAvatar = callWithCommon(UIElements.displayAvatar);
    funcs.createButton = callWithCommon(UIElements.createButton);
    funcs.createUsageBar = callWithCommon(UIElements.createUsageBar);
    funcs.updateTags = callWithCommon(UIElements.updateTags);
    funcs.createLanguageSelector = callWithCommon(UIElements.createLanguageSelector);
    funcs.createMarkdownToolbar = callWithCommon(UIElements.createMarkdownToolbar);
    funcs.createHelpMenu = callWithCommon(UIElements.createHelpMenu);
    funcs.getPadCreationScreen = callWithCommon(UIElements.getPadCreationScreen);
    funcs.createNewPadModal = callWithCommon(UIElements.createNewPadModal);
    funcs.onServerError = callWithCommon(UIElements.onServerError);

    // Thumb
    funcs.displayThumbnail = callWithCommon(Thumb.displayThumbnail);
    funcs.addThumbnail = Thumb.addThumbnail;

    // History
    funcs.getHistory = callWithCommon(History.create);

    // Title module
    funcs.createTitle = callWithCommon(Title.create);

    // Files
    funcs.uploadFile = callWithCommon(File.uploadFile);
    funcs.createFileManager = callWithCommon(File.create);
    funcs.getMediatagScript = function () {
        var origin = ctx.metadataMgr.getPrivateData().origin;
        return '<script src="' + origin + '/common/media-tag-nacl.min.js"></script>';
    };
    funcs.getMediatagFromHref = function (href) {
        var parsed = Hash.parsePadUrl(href);
        // FILE_HASHES2
        var secret = Hash.getSecrets('file', parsed.hash);
        var data = ctx.metadataMgr.getPrivateData();
        if (secret.keys && secret.channel) {
            var cryptKey = secret.keys && secret.keys.fileKeyStr;
            var hexFileName = Util.base64ToHex(secret.channel);
            var origin = data.fileHost || data.origin;
            var src = origin + Hash.getBlobPathFromHex(hexFileName);
            return '<media-tag src="' + src + '" data-crypto-key="cryptpad:' + cryptKey + '">' +
                   '</media-tag>';
        }
        return;
    };
    funcs.getFileSize = function (href, cb) {
        var channelId = Hash.hrefToHexChannelId(href);
        funcs.sendAnonRpcMsg("GET_FILE_SIZE", channelId, function (data) {
            if (!data) { return void cb("No response"); }
            if (data.error) { return void cb(data.error); }
            if (data.response && data.response.length && typeof(data.response[0]) === 'number') {
                return void cb(void 0, data.response[0]);
            } else {
                cb('INVALID_RESPONSE');
            }
        });
    };


    // CodeMirror
    funcs.initCodeMirrorApp = callWithCommon(CodeMirror.create);

    // Window
    funcs.logout = function (cb) {
        cb = cb || $.noop;
        ctx.sframeChan.query('Q_LOGOUT', null, cb);
    };

    funcs.notify = function () {
        ctx.sframeChan.event('EV_NOTIFY');
    };
    funcs.setTabTitle = function (newTitle) {
        ctx.sframeChan.event('EV_SET_TAB_TITLE', newTitle);
    };

    funcs.setLoginRedirect = function (cb) {
        cb = cb || $.noop;
        ctx.sframeChan.query('Q_SET_LOGIN_REDIRECT', null, cb);
    };

    funcs.isPresentUrl = function (cb) {
        ctx.sframeChan.query('Q_PRESENT_URL_GET_VALUE', null, cb);
    };
    funcs.setPresentUrl = function (value) {
        ctx.sframeChan.event('EV_PRESENT_URL_SET_VALUE', value);
    };

    // Store
    funcs.handleNewFile = function (waitFor) {
        if (window.__CRYPTPAD_TEST__) { return; }
        var priv = ctx.metadataMgr.getPrivateData();
        if (priv.isNewFile) {
            var c = (priv.settings.general && priv.settings.general.creation) || {};
            var skip = !AppConfig.displayCreationScreen || (c.skip && !priv.forceCreationScreen);
            // If this is a new file but we have a hash in the URL and pad creation screen is
            // not displayed, then display an error...
            if (priv.isDeleted && (!funcs.isLoggedIn() || skip)) {
                UI.errorLoadingScreen(Messages.inactiveError, false, function () {
                    UI.addLoadingScreen();
                    return void funcs.createPad({}, waitFor());
                });
                return;
            }
            // Otherwise, if we don't display the screen, it means it is not a deleted pad
            // so we can continue and start realtime...
            if (!funcs.isLoggedIn() || skip) {
                return void funcs.createPad(c, waitFor());
            }
            // If we display the pad creation screen, it will handle deleted pads directly
            funcs.getPadCreationScreen(c, waitFor());
        }
    };
    funcs.createPad = function (cfg, cb) {
        ctx.sframeChan.query("Q_CREATE_PAD", {
            owned: cfg.owned,
            expire: cfg.expire,
            password: cfg.password,
            template: cfg.template,
            templateId: cfg.templateId
        }, cb);
    };

    funcs.sendAnonRpcMsg = function (msg, content, cb) {
        ctx.sframeChan.query('Q_ANON_RPC_MESSAGE', {
            msg: msg,
            content: content
        }, function (err, data) {
            if (cb) { cb(data); }
        });
    };
    funcs.getPinUsage = function (cb) {
        cb = cb || $.noop;
        ctx.sframeChan.query('Q_PIN_GET_USAGE', null, function (err, data) {
            cb(err || data.error, data.data);
        });
    };

    funcs.isOverPinLimit = function (cb) {
        ctx.sframeChan.query('Q_GET_PIN_LIMIT_STATUS', null, function (err, data) {
            cb(data.error, data.overLimit, data.limits);
        });
    };

    funcs.getFullHistory = function (realtime, cb) {
        ctx.sframeChan.query('Q_GET_FULL_HISTORY', null, function (err, messages) {
            if (err) { return void console.error(err); }
            if (!Array.isArray(messages)) { return; }
            messages.forEach(function (m) {
                realtime.message(m);
            });
            cb();
        });
    };

    funcs.getPadAttribute = function (key, cb) {
        ctx.sframeChan.query('Q_GET_PAD_ATTRIBUTE', {
            key: key
        }, function (err, res) {
            cb (err || res.error, res.data);
        });
    };
    funcs.setPadAttribute = function (key, value, cb) {
        cb = cb || $.noop;
        ctx.sframeChan.query('Q_SET_PAD_ATTRIBUTE', {
            key: key,
            value: value
        }, cb);
    };

    funcs.getAttribute = function (key, cb) {
        ctx.sframeChan.query('Q_GET_ATTRIBUTE', {
            key: key
        }, function (err, res) {
            cb (err || res.error, res.data);
        });
    };
    funcs.setAttribute = function (key, value, cb) {
        cb = cb || $.noop;
        ctx.sframeChan.query('Q_SET_ATTRIBUTE', {
            key: key,
            value: value
        }, cb);
    };

    // Thumbnails
    funcs.setThumbnail = function (key, value, cb) {
        cb = cb || $.noop;
        ctx.sframeChan.query('Q_THUMBNAIL_SET', {
            key: key,
            value: value
        }, cb);
    };
    funcs.getThumbnail = function (key, cb) {
        ctx.sframeChan.query('Q_THUMBNAIL_GET', {
            key: key
        }, function (err, res) {
            cb (err || res.error, res.data);
        });
    };

    funcs.sessionStorage = {
        put: function (key, value, cb) {
            ctx.sframeChan.query('Q_SESSIONSTORAGE_PUT', {
                key: key,
                value: value
            }, cb);
        }
    };

    funcs.isStrongestStored = function () {
        var data = ctx.metadataMgr.getPrivateData();
        if (data.availableHashes.fileHash) { return true; }
        return !data.readOnly || !data.availableHashes.editHash;
    };

    funcs.setDisplayName = function (name, cb) {
        cb = cb || $.noop;
        ctx.sframeChan.query('Q_SETTINGS_SET_DISPLAY_NAME', name, cb);
    };

    funcs.mergeAnonDrive = function (cb) {
        ctx.sframeChan.query('Q_MERGE_ANON_DRIVE', null, cb);
    };
    // Friends
    var pendingFriends = [];
    funcs.getPendingFriends = function () {
        return pendingFriends.slice();
    };
    funcs.sendFriendRequest = function (netfluxId) {
        ctx.sframeChan.query('Q_SEND_FRIEND_REQUEST', netfluxId, $.noop);
        pendingFriends.push(netfluxId);
    };

    // Feedback
    funcs.prepareFeedback = function (key) {
        if (typeof(key) !== 'string') { return $.noop; }

        var type = ctx.metadataMgr.getMetadata().type;
        return function () {
            Feedback.send((key + (type? '_' + type: '')).toUpperCase());
        };
    };

    // RESTRICTED
    // Filepicker app
    funcs.getFilesList = function (types, cb) {
        ctx.sframeChan.query('Q_GET_FILES_LIST', types, function (err, data) {
            cb(err || data.error, data.data);
        });
    };

/*    funcs.storeLinkToClipboard = function (readOnly, cb) {
        ctx.sframeChan.query('Q_STORE_LINK_TO_CLIPBOARD', readOnly, function (err) {
            if (cb) { cb(err); }
        });
    }; */

    funcs.gotoURL = function (url) { ctx.sframeChan.event('EV_GOTO_URL', url); };
    funcs.openURL = function (url) { ctx.sframeChan.event('EV_OPEN_URL', url); };
    funcs.openUnsafeURL = function (url) {
        var bounceHref = window.location.origin + '/bounce/#' + encodeURIComponent(url);
        window.open(bounceHref);
    };

    funcs.fixLinks = function (domElement) {
        var origin = ctx.metadataMgr.getPrivateData().origin;
        $(domElement).find('a[target="_blank"]').click(function (e) {
            e.preventDefault();
            e.stopPropagation();
            var href = $(this).attr('href');
            var absolute = /^https?:\/\//i;
            if (!absolute.test(href)) {
                if (href.slice(0,1) !== '/') { href = '/' + href; }
                href = origin + href;
            }
            funcs.openUnsafeURL(href);
        });
        $(domElement).find('a[target!="_blank"]').click(function (e) {
            e.preventDefault();
            e.stopPropagation();
            funcs.gotoURL($(this).attr('href'));
        });
        return $(domElement)[0];
    };

    funcs.whenRealtimeSyncs = evRealtimeSynced.reg;

    var logoutHandlers = [];
    funcs.onLogout = function (h) {
        if (typeof (h) !== "function") { return; }
        if (logoutHandlers.indexOf(h) !== -1) { return; }
        logoutHandlers.push(h);
    };


    Object.freeze(funcs);
    return { create: function (cb) {

        console.log('create');
        if (window.CryptPad_sframe_common) {
            throw new Error("Sframe-common should only be created once");
        }
        window.CryptPad_sframe_common = true;

        nThen(function (waitFor) {
            SFrameChannel.create(window.parent, waitFor(function (sfc) { ctx.sframeChan = sfc; }), true);
            // CpNfInner.start() should be here....
        }).nThen(function (waitFor) {
            localForage.clear();
            Language.applyTranslation();

            ctx.metadataMgr = MetadataMgr.create(ctx.sframeChan);

            ctx.sframeChan.whenReg('EV_CACHE_PUT', function () {
                if (Object.keys(window.cryptpadCache.updated).length) {
                    ctx.sframeChan.event('EV_CACHE_PUT', window.cryptpadCache.updated);
                }
                window.cryptpadCache._put = window.cryptpadCache.put;
                window.cryptpadCache.put = function (k, v, cb) {
                    window.cryptpadCache._put(k, v, cb);
                    var x = {};
                    x[k] = v;
                    ctx.sframeChan.event('EV_CACHE_PUT', x);
                };
            });
            ctx.sframeChan.whenReg('EV_LOCALSTORE_PUT', function () {
                if (Object.keys(window.cryptpadStore.updated).length) {
                    ctx.sframeChan.event('EV_LOCALSTORE_PUT', window.cryptpadStore.updated);
                }
                window.cryptpadStore._put = window.cryptpadStore.put;
                window.cryptpadStore.put = function (k, v, cb) {
                    window.cryptpadStore._put(k, v, cb);
                    var x = {};
                    x[k] = v;
                    ctx.sframeChan.event('EV_LOCALSTORE_PUT', x);
                };
            });

            UI.addTooltips();

            ctx.sframeChan.on('Q_INCOMING_FRIEND_REQUEST', function (confirmMsg, cb) {
                UI.confirm(confirmMsg, cb, null, true);
            });
            ctx.sframeChan.on('EV_FRIEND_REQUEST', function (data) {
                var i = pendingFriends.indexOf(data.netfluxId);
                if (i !== -1) { pendingFriends.splice(i, 1); }
                UI.log(data.logText);
            });

            ctx.sframeChan.on("EV_PAD_PASSWORD", function (data) {
                UIElements.displayPasswordPrompt(funcs);
                /*UI.prompt("Password?", "", function (val) {
                    ctx.sframeChan.event("EV_PAD_PASSWORD_VALUE", val);
                });
                $('div.alertify').last().css("z-index", Number.MAX_SAFE_INTEGER);*/
            });

            ctx.metadataMgr.onReady(waitFor());
        }).nThen(function () {
            try {
                var feedback = ctx.metadataMgr.getPrivateData().feedbackAllowed;
                Feedback.init(feedback);
            } catch (e) { Feedback.init(false); }

            ctx.sframeChan.on('EV_LOADING_ERROR', function (err) {
                if (err === 'DELETED') {
                    var msg = Messages.deletedError + '<br>' + Messages.errorRedirectToHome;
                    UI.errorLoadingScreen(msg, false, function () {
                        funcs.gotoURL('/drive/');
                    });
                }
            });

            ctx.sframeChan.on('EV_LOGOUT', function () {
                $(window).on('keyup', function (e) {
                    if (e.keyCode === 27) {
                        UI.removeLoadingScreen();
                    }
                });
                UI.addLoadingScreen({hideTips: true});
                var origin = ctx.metadataMgr.getPrivateData().origin;
                var href = origin + "/login/";
                var onLogoutMsg = Messages._getKey('onLogout', ['<a href="' + href + '" target="_blank">', '</a>']);
                UI.errorLoadingScreen(onLogoutMsg, true);
                logoutHandlers.forEach(function (h) {
                    if (typeof (h) === "function") { h(); }
                });
            });

            ctx.sframeChan.ready();
            cb(funcs);
        });
    } };
});
