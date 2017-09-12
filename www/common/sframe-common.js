define([
    'jquery',
    '/bower_components/nthen/index.js',
    '/customize/messages.js',
    '/common/sframe-chainpad-netflux-inner.js',
    '/common/sframe-channel.js',
    '/common/sframe-common-title.js',
    '/common/sframe-common-interface.js',
    '/common/sframe-common-history.js',
    '/common/sframe-common-file.js',
    '/common/sframe-common-codemirror.js',
    '/common/metadata-manager.js',

    '/customize/application_config.js',
    '/common/cryptpad-common.js',
    '/common/common-realtime.js',
    '/common/common-util.js'
], function (
    $,
    nThen,
    Messages,
    CpNfInner,
    SFrameChannel,
    Title,
    UI,
    History,
    File,
    CodeMirror,
    MetadataMgr,
    AppConfig,
    Cryptpad,
    CommonRealtime,
    Util
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
    funcs.getCryptpadCommon = function () { return Cryptpad; };
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
    funcs.createUserAdminMenu = callWithCommon(UI.createUserAdminMenu);
    funcs.initFilePicker = callWithCommon(UI.initFilePicker);
    funcs.openFilePicker = callWithCommon(UI.openFilePicker);
    funcs.openTemplatePicker = callWithCommon(UI.openTemplatePicker);
    funcs.displayAvatar = callWithCommon(UI.displayAvatar);
    funcs.createButton = callWithCommon(UI.createButton);
    funcs.getFileSize = callWithCommon(UI.getFileSize);

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
        var parsed = Cryptpad.parsePadUrl(href);
        var secret = Cryptpad.getSecrets('file', parsed.hash);
        var data = ctx.metadataMgr.getPrivateData();
        if (secret.keys && secret.channel) {
            var cryptKey = secret.keys && secret.keys.fileKeyStr;
            var hexFileName = Cryptpad.base64ToHex(secret.channel);
            var origin = data.fileHost || data.origin;
            var src = origin + Cryptpad.getBlobPathFromHex(hexFileName);
            return '<media-tag src="' + src + '" data-crypto-key="cryptpad:' + cryptKey + '">' +
                   '</media-tag>';
        }
        return;
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
    funcs.sendAnonRpcMsg = function (msg, content, cb) {
        ctx.sframeChan.query('Q_ANON_RPC_MESSAGE', {
            msg: msg,
            content: content
        }, function (err, data) {
            if (cb) { cb(data); }
        });
    };

    funcs.isOverPinLimit = function (cb) {
        ctx.sframeChan.query('Q_GET_PIN_LIMIT_STATUS', null, function (err, data) {
            cb(data.error, data.overLimit, data.limits);
        });
    };

    funcs.getFullHistory = function (realtime, cb) {
        ctx.sframeChan.on('EV_RT_HIST_MESSAGE', function (content) {
            realtime.message(content);
        });
        ctx.sframeChan.query('Q_GET_FULL_HISTORY', null, cb);
    };

    funcs.getPadAttribute = function (key, cb) {
        ctx.sframeChan.query('Q_GET_PAD_ATTRIBUTE', {
            key: key
        }, function (err, res) {
            cb (err || res.error, res.data);
        });
    };
    funcs.setPadAttribute = function (key, value, cb) {
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

    funcs.isStrongestStored = function () {
        var data = ctx.metadataMgr.getPrivateData();
        if (data.availableHashes.fileHash) { return true; }
        return !data.readOnly || !data.availableHashes.editHash;
    };

    funcs.setDisplayName = function (name, cb) {
        cb = cb || $.noop;
        ctx.sframeChan.query('Q_SETTINGS_SET_DISPLAY_NAME', name, cb);
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
    funcs.feedback = function (action, force) {
        if (force !== true) {
            if (!action) { return; }
            try {
                if (!ctx.metadataMgr.getPrivateData().feedbackAllowed) { return; }
            } catch (e) { return void console.error(e); }
        }
        var randomToken = Math.random().toString(16).replace(/0./, '');
        //var origin = ctx.metadataMgr.getPrivateData().origin;
        var href = /*origin +*/ '/common/feedback.html?' + action + '=' + randomToken;
        $.ajax({
            type: "HEAD",
            url: href,
        });
    };
    funcs.prepareFeedback = function (key) {
        if (typeof(key) !== 'string') { return $.noop; }

        var type = ctx.metadataMgr.getMetadata().type;
        return function () {
            funcs.feedback((key + (type? '_' + type: '')).toUpperCase());
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

    funcs.whenRealtimeSyncs = evRealtimeSynced.reg;

    Object.freeze(funcs);
    return { create: function (cb) {
        nThen(function (waitFor) {
            SFrameChannel.create(window.parent, waitFor(function (sfc) { ctx.sframeChan = sfc; }), true);
            // CpNfInner.start() should be here....
        }).nThen(function () {
            ctx.metadataMgr = MetadataMgr.create(ctx.sframeChan);

            ctx.sframeChan.on('EV_RT_CONNECT', function () { CommonRealtime.setConnectionState(true); });
            ctx.sframeChan.on('EV_RT_DISCONNECT', function () { CommonRealtime.setConnectionState(false); });


            ctx.sframeChan.on('Q_INCOMING_FRIEND_REQUEST', function (confirmMsg, cb) {
                Cryptpad.confirm(confirmMsg, cb, null, true);
            });
            ctx.sframeChan.on('EV_FRIEND_REQUEST', function (data) {
                var i = pendingFriends.indexOf(data.sender);
                if (i !== -1) { pendingFriends.splice(i, 1); }
                Cryptpad.log(data.logText);
            });

            ctx.sframeChan.ready();
            cb(funcs);
        });
    } };
});
