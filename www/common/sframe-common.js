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
    '/common/metadata-manager.js',

    '/customize/application_config.js',
    '/common/cryptpad-common.js',
    '/common/common-realtime.js'
], function ($, nThen, Messages, CpNfInner, SFrameChannel, Title, UI, History, File, MetadataMgr,
    AppConfig, Cryptpad, CommonRealtime) {

    // Chainpad Netflux Inner
    var funcs = {};
    var ctx = {};

    funcs.Messages = Messages;

    funcs.startRealtime = function (options) {
        if (ctx.cpNfInner) { return ctx.cpNfInner; }
        options.sframeChan = ctx.sframeChan;
        options.metadataMgr = ctx.metadataMgr;
        ctx.cpNfInner = CpNfInner.start(options);
        ctx.cpNfInner.metadataMgr.onChangeLazy(options.onLocal);
        return ctx.cpNfInner;
    };

    funcs.getMetadataMgr = function () {
        return ctx.metadataMgr;
    };
    funcs.getCryptpadCommon = function () {
        return Cryptpad;
    };
    funcs.getSframeChannel = function () {
        return ctx.sframeChan;
    };

    var isLoggedIn = funcs.isLoggedIn = function () {
        if (!ctx.cpNfInner) { throw new Error("cpNfInner is not ready!"); }
        return ctx.cpNfInner.metadataMgr.getPrivateData().accountName;
    };

    var titleUpdated;
    funcs.updateTitle = function (title, cb) {
        ctx.metadataMgr.updateTitle(title);
        titleUpdated = cb;
    };

    // UI
    funcs.createUserAdminMenu = UI.createUserAdminMenu;
    funcs.displayAvatar = UI.displayAvatar;
    funcs.createFileDialog = UI.createFileDialog;

    // History
    funcs.getHistory = function (config) { return History.create(funcs, config); };

    // Title module
    funcs.createTitle = Title.create;

    funcs.getDefaultTitle = function () {
        if (!ctx.cpNfInner) { throw new Error("cpNfInner is not ready!"); }
        return ctx.cpNfInner.metadataMgr.getMetadata().defaultTitle;
    };

    funcs.setDisplayName = function (name, cb) {
        ctx.sframeChan.query('Q_SETTINGS_SET_DISPLAY_NAME', name, function (err) {
            if (cb) { cb(err); }
        });
    };

    funcs.logout = function (cb) {
        ctx.sframeChan.query('Q_LOGOUT', null, function (err) {
            if (cb) { cb(err); }
        });
    };

    funcs.notify = function () {
        ctx.sframeChan.event('EV_NOTIFY');
    };

    funcs.setLoginRedirect = function (cb) {
        ctx.sframeChan.query('Q_SET_LOGIN_REDIRECT', null, function (err) {
            if (cb) { cb(err); }
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

    // Files
    funcs.uploadFile = function (data, cb) {
        ctx.sframeChan.query('Q_UPLOAD_FILE', data, cb);
    };
    funcs.createFileManager = function (config) { return File.create(funcs, config); };

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
    var prepareFeedback = funcs.prepareFeedback = function (key) {
        if (typeof(key) !== 'string') { return $.noop; }

        var type = ctx.metadataMgr.getMetadata().type;
        return function () {
            funcs.feedback((key + (type? '_' + type: '')).toUpperCase());
        };
    };

    // BUTTONS
    var isStrongestStored = function () {
        var data = ctx.metadataMgr.getPrivateData();
        return !data.readOnly || !data.availableHashes.editHash;
    };
    funcs.createButton = function (type, rightside, data, callback) {
        var button;
        var size = "17px";
        switch (type) {
            case 'export':
                button = $('<button>', {
                    'class': 'fa fa-download',
                    title: Messages.exportButtonTitle,
                }).append($('<span>', {'class': 'drawer'}).text(Messages.exportButton));

                button.click(prepareFeedback(type));
                if (callback) {
                    button.click(callback);
                }
                break;
            case 'import':
                button = $('<button>', {
                    'class': 'fa fa-upload',
                    title: Messages.importButtonTitle,
                }).append($('<span>', {'class': 'drawer'}).text(Messages.importButton));
                if (callback) {
                    button
                    .click(prepareFeedback(type))
                    .click(Cryptpad.importContent('text/plain', function (content, file) {
                        callback(content, file);
                    }, {accept: data ? data.accept : undefined}));
                }
                break;
            case 'template':
                if (!AppConfig.enableTemplates) { return; }
                button = $('<button>', {
                    title: Messages.saveTemplateButton,
                }).append($('<span>', {'class':'fa fa-bookmark', style: 'font:'+size+' FontAwesome'}));
                if (data.rt) {
                    button
                    .click(function () {
                        var title = data.getTitle() || document.title;
                        var todo = function (val) {
                            if (typeof(val) !== "string") { return; }
                            var toSave = data.rt.getUserDoc();
                            if (val.trim()) {
                                val = val.trim();
                                title = val;
                                try {
                                    var parsed = JSON.parse(toSave);
                                    var meta;
                                    if (Array.isArray(parsed) && typeof(parsed[3]) === "object") {
                                        meta = parsed[3].metadata; // pad
                                    } else if (parsed.info) {
                                        meta = parsed.info; // poll
                                    } else {
                                        meta = parsed.metadata;
                                    }
                                    if (typeof(meta) === "object") {
                                        meta.title = val;
                                        meta.defaultTitle = val;
                                        delete meta.users;
                                    }
                                    toSave = JSON.stringify(parsed);
                                } catch(e) {
                                    console.error("Parse error while setting the title", e);
                                }
                            }
                            ctx.sframeChan.query('Q_SAVE_AS_TEMPLATE', {
                                title: title,
                                toSave: toSave
                            }, function () {
                                Cryptpad.alert(Messages.templateSaved);
                                funcs.feedback('TEMPLATE_CREATED');
                            });
                        };
                        Cryptpad.prompt(Messages.saveTemplatePrompt, title, todo);
                    });
                }
                break;
            case 'forget':
                button = $('<button>', {
                    id: 'cryptpad-forget',
                    title: Messages.forgetButtonTitle,
                    'class': "fa fa-trash cryptpad-forget",
                    style: 'font:'+size+' FontAwesome'
                });
                if (!isStrongestStored()) {
                    button.addClass('hidden');
                }
                if (callback) {
                    button
                    .click(prepareFeedback(type))
                    .click(function() {
                        var msg = isLoggedIn() ? Messages.forgetPrompt : Messages.fm_removePermanentlyDialog;
                        Cryptpad.confirm(msg, function (yes) {
                            if (!yes) { return; }
                            ctx.sframeChan.query('Q_MOVE_TO_TRASH', null, function (err) {
                                if (err) { return void callback(err); }
                                var cMsg = isLoggedIn() ? Messages.movedToTrash : Messages.deleted;
                                Cryptpad.alert(cMsg, undefined, true);
                                callback();
                                return;
                            });
                        });

                    });
                }
                break;
            case 'history':
                if (!AppConfig.enableHistory) {
                    button = $('<span>');
                    break;
                }
                button = $('<button>', {
                    title: Messages.historyButton,
                    'class': "fa fa-history history",
                }).append($('<span>', {'class': 'drawer'}).text(Messages.historyText));
                if (data.histConfig) {
                    button
                    .click(prepareFeedback(type))
                    .on('click', function () {
                        funcs.getHistory(data.histConfig);
                    });
                }
                break;
            case 'more':
                button = $('<button>', {
                    title: Messages.moreActions || 'TODO',
                    'class': "drawer-button fa fa-ellipsis-h",
                    style: 'font:'+size+' FontAwesome'
                });
                break;
            default:
                button = $('<button>', {
                    'class': "fa fa-question",
                    style: 'font:'+size+' FontAwesome'
                })
                .click(prepareFeedback(type));
        }
        if (rightside) {
            button.addClass('rightside-button');
        }
        return button;
    };


    // Can, only be called by the filepicker app
    funcs.getFilesList = function (cb) {
        ctx.sframeChan.query('Q_GET_FILES_LIST', null, function (err, data) {
            cb(err || data.error, data.data);
        });
    };

/*    funcs.storeLinkToClipboard = function (readOnly, cb) {
        ctx.sframeChan.query('Q_STORE_LINK_TO_CLIPBOARD', readOnly, function (err) {
            if (cb) { cb(err); }
        });
    };
*/

    Object.freeze(funcs);
    return { create: function (cb) {
        nThen(function (waitFor) {
            SFrameChannel.create(window.top, waitFor(function (sfc) { ctx.sframeChan = sfc; }));
            // CpNfInner.start() should be here....
        }).nThen(function () {
            ctx.metadataMgr = MetadataMgr.create(ctx.sframeChan);
            ctx.metadataMgr.onTitleChange(function (title) {
                ctx.sframeChan.query('Q_SET_PAD_TITLE_IN_DRIVE', title, function (err) {
                    if (err) { return; }
                    if (titleUpdated) { titleUpdated(undefined, title); }
                });
            });

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

            cb(funcs);
        });
    } };
});
