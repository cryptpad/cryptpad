define([
    '/bower_components/nthen/index.js',
    '/customize/messages.js',
    '/common/sframe-chainpad-netflux-inner.js',
    '/common/sframe-channel.js',
    '/common/sframe-common-title.js',
    '/common/sframe-common-interface.js',
    '/common/metadata-manager.js',

    '/common/cryptpad-common.js'
], function (nThen, Messages, CpNfInner, SFrameChannel, Title, UI, MetadataMgr, Cryptpad) {

    // Chainpad Netflux Inner
    var funcs = {};
    var ctx = {};

    funcs.startRealtime = function (options) {
        if (ctx.cpNfInner) { return ctx.cpNfInner; }
        options.sframeChan = ctx.sframeChan;
        options.metadataMgr = ctx.metadataMgr;
        ctx.cpNfInner = CpNfInner.start(options);
        ctx.cpNfInner.metadataMgr.onChangeLazy(options.onLocal);
        return ctx.cpNfInner;
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

    // TODO

    funcs.feedback = function () {};
    var prepareFeedback = function () {};

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
                    .click(UI.importContent('text/plain', function (content, file) {
                        callback(content, file);
                    }, {accept: data ? data.accept : undefined}));
                }
                break;
            case 'template':
                if (!AppConfig.enableTemplates) { return; }
                button = $('<button>', {
                    title: Messages.saveTemplateButton,
                }).append($('<span>', {'class':'fa fa-bookmark', style: 'font:'+size+' FontAwesome'}));
                if (data.rt && data.Crypt) {
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
                            var p = parsePadUrl(window.location.href);
                            if (!p.type) { return; }
                            var hash = createRandomHash();
                            var href = '/' + p.type + '/#' + hash;
                            data.Crypt.put(hash, toSave, function (e) {
                                if (e) { throw new Error(e); }
                                common.addTemplate(makePad(href, title));
                                whenRealtimeSyncs(getStore().getProxy().info.realtime, function () {
                                    common.alert(Messages.templateSaved);
                                    common.feedback('TEMPLATE_CREATED');
                                });
                            });
                        };
                        common.prompt(Messages.saveTemplatePrompt, title || document.title, todo);
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
                        common.getHistory(data.histConfig);
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
            cb(funcs);
        });
    } };
});
