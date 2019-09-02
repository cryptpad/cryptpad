define([
    'jquery',
    '/bower_components/nthen/index.js',
    '/customize/messages.js',
    '/common/sframe-chainpad-netflux-inner.js',
    '/common/outer/worker-channel.js',
    '/common/sframe-common-title.js',
    '/common/common-ui-elements.js',
    '/common/sframe-common-history.js',
    '/common/sframe-common-file.js',
    '/common/sframe-common-codemirror.js',
    '/common/sframe-common-cursor.js',
    '/common/sframe-common-mailbox.js',
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
    Cursor,
    Mailbox,
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
    funcs.importMediaTagMenu = callWithCommon(UIElements.importMediaTagMenu);

    // Thumb
    funcs.displayThumbnail = callWithCommon(Thumb.displayThumbnail);
    funcs.addThumbnail = Thumb.addThumbnail;

    // History
    funcs.getHistory = callWithCommon(History.create);

    // Title module
    funcs.createTitle = callWithCommon(Title.create);

    // Cursor
    funcs.createCursor = callWithCommon(Cursor.create);

    // Files
    funcs.uploadFile = callWithCommon(File.uploadFile);
    funcs.createFileManager = callWithCommon(File.create);
    funcs.getMediatagScript = function () {
        var origin = ctx.metadataMgr.getPrivateData().origin;
        return '<script src="' + origin + '/common/media-tag-nacl.min.js"></script>';
    };
    funcs.getMediatagFromHref = function (obj) {
        if (!obj || !obj.hash) { return; }
        var data = ctx.metadataMgr.getPrivateData();
        var secret = Hash.getSecrets('file', obj.hash, obj.password);
        if (secret.keys && secret.channel) {
            var key = Hash.encodeBase64(secret.keys && secret.keys.cryptKey);
            var hexFileName = secret.channel;
            var origin = data.fileHost || data.origin;
            var src = origin + Hash.getBlobPathFromHex(hexFileName);
            return '<media-tag src="' + src + '" data-crypto-key="cryptpad:' + key + '">' +
                   '</media-tag>';
        }
        return;
    };
    funcs.importMediaTag = function ($mt) {
        if (!$mt || !$mt.is('media-tag')) { return; }
        var chanStr = $mt.attr('src');
        var keyStr = $mt.attr('data-crypto-key');
        var channel = chanStr.replace(/\/blob\/[0-9a-f]{2}\//i, '');
        var key = keyStr.replace(/cryptpad:/i, '');
        var metadata = $mt[0]._mediaObject._blob.metadata;
        ctx.sframeChan.query('Q_IMPORT_MEDIATAG', {
            channel: channel,
            key: key,
            name: metadata.name,
            type: metadata.type,
            owners: metadata.owners
        }, function () {
            UI.log(Messages.saved);
        });
    };

    funcs.getFileSize = function (channelId, cb) {
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

    // Universal direct channel
    var modules = {};
    funcs.makeUniversal = function (type, cfg) {
        if (modules[type]) { return; }
        var sframeChan = funcs.getSframeChannel();
        modules[type] = {
            onEvent: cfg.onEvent || function () {}
        };
        return {
            execCommand: function (cmd, data, cb) {
                sframeChan.query("Q_UNIVERSAL_COMMAND", {
                    type: type,
                    data: {
                        cmd: cmd,
                        data: data
                    }
                }, function (err, obj) {
                    if (err) { return void cb({error: err}); }
                    cb(obj);
                });
            }
        };
    };


    // Chat
    var padChatChannel;
    // common-ui-elements needs to be able to get the chat channel to put it in metadata when
    // importing a template
    funcs.getPadChat = function () {
        return padChatChannel;
    };
    funcs.openPadChat = function (saveChanges) {
        var md = JSON.parse(JSON.stringify(ctx.metadataMgr.getMetadata()));
        //if (md.chat) { delete md.chat; } // Old channel without signing key
        // NOTE: "chat2" is also used in cryptpad-common's "useTemplate"
        var channel = md.chat2 || Hash.createChannelId();
        if (!md.chat2) {
            md.chat2 = channel;
            ctx.metadataMgr.updateMetadata(md);
            setTimeout(saveChanges);
        }
        padChatChannel = channel;
        ctx.sframeChan.query('Q_CHAT_OPENPADCHAT', channel, function (err, obj) {
            if (err || (obj && obj.error)) { console.error(err || (obj && obj.error)); }
        });
    };

    var cursorChannel;
    // common-ui-elements needs to be able to get the cursor channel to put it in metadata when
    // importing a template
    funcs.getCursorChannel = function () {
        return cursorChannel;
    };
    funcs.openCursorChannel = function (saveChanges) {
        var md = JSON.parse(JSON.stringify(ctx.metadataMgr.getMetadata()));
        var channel = md.cursor;
        if (typeof(channel) !== 'string' || channel.length !== Hash.ephemeralChannelLength) {
            channel = Hash.createChannelId(true); // true indicates that it's an ephemeral channel
        }
        if (md.cursor !== channel) {
            md.cursor = channel;
            ctx.metadataMgr.updateMetadata(md);
            setTimeout(saveChanges);
        }
        cursorChannel = channel;
        ctx.sframeChan.query('Q_CURSOR_OPENCHANNEL', channel, function (err, obj) {
            if (err || (obj && obj.error)) { console.error(err || (obj && obj.error)); }
        });
    };

    // CodeMirror
    funcs.initCodeMirrorApp = callWithCommon(CodeMirror.create);

    // Window
    funcs.logout = function (cb) {
        cb = cb || $.noop;
        ctx.sframeChan.query('Q_LOGOUT', null, cb);
    };

    funcs.notify = function (data) {
        ctx.sframeChan.event('EV_NOTIFY', data);
    };
    funcs.setTabTitle = function (newTitle) {
        ctx.sframeChan.event('EV_SET_TAB_TITLE', newTitle);
    };

    funcs.setHash = function (hash) {
        ctx.sframeChan.event('EV_SET_HASH', hash);
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
    funcs.handleNewFile = function (waitFor, config) {
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
            funcs.getPadCreationScreen(c, config, waitFor());
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

    funcs.isPadStored = function (cb) {
        ctx.sframeChan.query("Q_IS_PAD_STORED", null, function (err, obj) {
            cb (err || (obj && obj.error), obj);
        });
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

    // href is optional here: if not provided, we use the href of the current tab
    funcs.getPadAttribute = function (key, cb, href) {
        ctx.sframeChan.query('Q_GET_PAD_ATTRIBUTE', {
            key: key,
            href: href
        }, function (err, res) {
            cb (err || res.error, res.data);
        });
    };
    funcs.setPadAttribute = function (key, value, cb, href) {
        cb = cb || $.noop;
        ctx.sframeChan.query('Q_SET_PAD_ATTRIBUTE', {
            key: key,
            href: href,
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

    funcs.setDisplayName = function (name, cb) {
        cb = cb || $.noop;
        ctx.sframeChan.query('Q_SETTINGS_SET_DISPLAY_NAME', name, cb);
    };

    funcs.mergeAnonDrive = function (cb) {
        ctx.sframeChan.query('Q_MERGE_ANON_DRIVE', null, cb);
    };

    // Create friend request
    funcs.getPendingFriends = function () {
        return ctx.metadataMgr.getPrivateData().pendingFriends;
    };
    funcs.sendFriendRequest = function (data, cb) {
        ctx.sframeChan.query('Q_SEND_FRIEND_REQUEST', data, cb);
    };
    // Friend requests received
    var friendRequests = {};
    funcs.addFriendRequest = function (data) {
        var curve = Util.find(data, ['content', 'msg', 'author']);
        friendRequests[curve] = data;
    };
    funcs.removeFriendRequest = function (hash) {
        Object.keys(friendRequests).some(function (curve) {
            var h = Util.find(friendRequests[curve], ['content', 'hash']);
            if (h === hash) {
                delete friendRequests[curve];
                return true;
            }
        });
    };
    funcs.getFriendRequests = function () {
        return JSON.parse(JSON.stringify(friendRequests));
    };

    funcs.getFriends = function (meIncluded) {
        var priv = ctx.metadataMgr.getPrivateData();
        var friends = priv.friends;
        var goodFriends = {};
        Object.keys(friends).forEach(function (curve) {
            if (curve.length !== 44 && !meIncluded) { return; }
            var data = friends[curve];
            if (!data.notifications) { return; }
            goodFriends[curve] = friends[curve];
        });
        return goodFriends;
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

    funcs.getPad = function (data, cb) {
        ctx.sframeChan.query("Q_CRYPTGET", data, function (err, obj) {
            if (err) { return void cb(err); }
            if (obj.error) { return void cb(obj.error); }
            cb(null, obj.data);
        }, { timeout: 60000 });
    };

    funcs.getPadMetadata = function (data, cb) {
        ctx.sframeChan.query('Q_GET_PAD_METADATA', data, function (err, val) {
            if (err || (val && val.error)) { return void cb({error: err || val.error}); }
            cb(val);
        });
    };

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

    var shortcuts = [];
    funcs.addShortcuts = function (w, isApp) {
        w = w || window;
        if (shortcuts.indexOf(w) !== -1) { return; }
        shortcuts.push(w);
        $(w).keydown(function (e) {
            // Ctrl || Meta (mac)
            if (e.ctrlKey || (navigator.platform === "MacIntel" && e.metaKey)) {
                // Ctrl+E: New pad modal
                if (e.which === 69 && isApp) {
                    e.preventDefault();
                    return void funcs.createNewPadModal();
                }
                // Ctrl+S: prevent default (save)
                if (e.which === 83) { return void e.preventDefault(); }
            }
        });
    };

    funcs.mailbox = {};

    Object.freeze(funcs);
    return { create: function (cb) {

        if (window.CryptPad_sframe_common) {
            throw new Error("Sframe-common should only be created once");
        }
        window.CryptPad_sframe_common = true;

        nThen(function (waitFor) {
            var msgEv = Util.mkEvent();
            var iframe = window.parent;
            window.addEventListener('message', function (msg) {
                if (msg.source !== iframe) { return; }
                msgEv.fire(msg);
            });
            var postMsg = function (data) {
                iframe.postMessage(data, '*');
            };
            SFrameChannel.create(msgEv, postMsg, waitFor(function (sfc) { ctx.sframeChan = sfc; }));
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

            ctx.sframeChan.on("EV_PAD_PASSWORD", function () {
                UIElements.displayPasswordPrompt(funcs);
            });

            ctx.sframeChan.on('EV_LOADING_INFO', function (data) {
                UI.updateLoadingProgress(data, 'drive');
            });

            ctx.sframeChan.on('EV_NEW_VERSION', function () {
                var $err = $('<div>').append(Messages.newVersionError);
                $err.find('a').click(function () {
                    funcs.gotoURL();
                });
                UI.findOKButton().click();
                UI.errorLoadingScreen($err, true, true);
            });

            ctx.sframeChan.on('EV_AUTOSTORE_DISPLAY_POPUP', function (data) {
                UIElements.displayStorePadPopup(funcs, data);
            });

            ctx.sframeChan.on('EV_LOADING_ERROR', function (err) {
                var msg = err;
                if (err === 'DELETED') {
                    msg = Messages.deletedError + '<br>' + Messages.errorRedirectToHome;
                }
                if (err === "INVALID_HASH") {
                    msg = Messages.invalidHashError;
                }
                UI.errorLoadingScreen(msg, false, function () {
                    funcs.gotoURL('/drive/');
                });
            });

            ctx.sframeChan.on('EV_UNIVERSAL_EVENT', function (obj) {
                var type = obj.type;
                if (!type || !modules[type]) { return; }
                modules[type].onEvent(obj.data);
            });

            ctx.metadataMgr.onReady(waitFor());

        }).nThen(function () {
            var privateData = ctx.metadataMgr.getPrivateData();
            funcs.addShortcuts(window, Boolean(privateData.app));

            try {
                var feedback = privateData.feedbackAllowed;
                Feedback.init(feedback);
            } catch (e) { Feedback.init(false); }

            try {
                var forbidden = privateData.disabledApp;
                if (forbidden) {
                    UI.alert(Messages.disabledApp, function () {
                        funcs.gotoURL('/drive/');
                    }, {forefront: true});
                    return;
                }
                var mustLogin = privateData.registeredOnly;
                if (mustLogin) {
                    UI.alert(Messages.mustLogin, function () {
                        funcs.setLoginRedirect(function () {
                            funcs.gotoURL('/login/');
                        });
                    }, {forefront: true});
                    return;
                }
            } catch (e) {
                console.error("Can't check permissions for the app");
            }

            try {
                window.CP_DEV_MODE = privateData.devMode;
            } catch (e) {}

            ctx.sframeChan.on('EV_LOGOUT', function () {
                $(window).on('keyup', function (e) {
                    if (e.keyCode === 27) {
                        UI.removeLoadingScreen();
                    }
                });
                UI.addLoadingScreen({hideTips: true});
                var origin = privateData.origin;
                var href = origin + "/login/";
                var onLogoutMsg = Messages._getKey('onLogout', ['<a href="' + href + '" target="_blank">', '</a>']);
                UI.errorLoadingScreen(onLogoutMsg, true);
                logoutHandlers.forEach(function (h) {
                    if (typeof (h) === "function") { h(); }
                });
            });

            ctx.sframeChan.on('EV_WORKER_TIMEOUT', function () {
                UI.errorLoadingScreen(Messages.timeoutError, false, function () {
                    funcs.gotoURL('');
                });
            });

            ctx.sframeChan.on('EV_CHROME_68', function () {
                UI.alert(Messages.chrome68);
            });

            funcs.isPadStored(function (err, val) {
                if (err || !val) { return; }
                UIElements.displayCrowdfunding(funcs);
            });

            ctx.sframeChan.ready();
            cb(funcs);

            Mailbox.create(funcs);
        });
    } };
});
