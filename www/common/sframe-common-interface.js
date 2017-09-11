define([
    'jquery',
    '/common/cryptpad-common.js',
    '/common/media-tag.js',
], function ($, Cryptpad, MediaTag) {
    var UI = {};
    var Messages = Cryptpad.Messages;

    /**
     * Requirements from cryptpad-common.js
     * getFileSize
     *  - hrefToHexChannelId
     * displayAvatar
     *  - getFirstEmojiOrCharacter
     *  - parsePadUrl
     *  - getSecrets
     *  - base64ToHex
     *  - getBlobPathFromHex
     *  - bytesToMegabytes
     * createUserAdminMenu
     *  - fixHTML
     *  - createDropdown
    */

    UI.createButton = function (common, type, rightside, data, callback) {
        var AppConfig = common.getAppConfig();
        var button;
        var size = "17px";
        var sframeChan = common.getSframeChannel();
        switch (type) {
            case 'export':
                button = $('<button>', {
                    'class': 'fa fa-download',
                    title: Messages.exportButtonTitle,
                }).append($('<span>', {'class': 'cp-toolbar-drawer-element'}).text(Messages.exportButton));

                button.click(common.prepareFeedback(type));
                if (callback) {
                    button.click(callback);
                }
                break;
            case 'import':
                button = $('<button>', {
                    'class': 'fa fa-upload',
                    title: Messages.importButtonTitle,
                }).append($('<span>', {'class': 'cp-toolbar-drawer-element'}).text(Messages.importButton));
                if (callback) {
                    button
                    .click(common.prepareFeedback(type))
                    .click(Cryptpad.importContent('text/plain', function (content, file) {
                        callback(content, file);
                    }, {accept: data ? data.accept : undefined}));
                }
                break;
            case 'upload':
                button = $('<button>', {
                    'class': 'btn btn-primary new',
                    title: Messages.uploadButtonTitle,
                }).append($('<span>', {'class':'fa fa-upload'})).append(' '+Messages.uploadButton);
                if (!data.FM) { return; }
                var $input = $('<input>', {
                    'type': 'file',
                    'style': 'display: none;'
                }).on('change', function (e) {
                    var file = e.target.files[0];
                    var ev = {
                        target: data.target
                    };
                    if (data.filter && !data.filter(file)) {
                        Cryptpad.log('TODO: invalid avatar (type or size)');
                        return;
                    }
                    data.FM.handleFile(file, ev);
                    if (callback) { callback(); }
                });
                if (data.accept) { $input.attr('accept', data.accept); }
                button.click(function () { $input.click(); });
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
                            sframeChan.query('Q_SAVE_AS_TEMPLATE', {
                                title: title,
                                toSave: toSave
                            }, function () {
                                Cryptpad.alert(Messages.templateSaved);
                                common.feedback('TEMPLATE_CREATED');
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
                if (!common.isStrongestStored()) {
                    button.addClass('cp-toolbar-hidden');
                }
                if (callback) {
                    button
                    .click(common.prepareFeedback(type))
                    .click(function() {
                        var msg = common.isLoggedIn() ? Messages.forgetPrompt : Messages.fm_removePermanentlyDialog;
                        Cryptpad.confirm(msg, function (yes) {
                            if (!yes) { return; }
                            sframeChan.query('Q_MOVE_TO_TRASH', null, function (err) {
                                if (err) { return void callback(err); }
                                var cMsg = common.isLoggedIn() ? Messages.movedToTrash : Messages.deleted;
                                Cryptpad.alert(cMsg, undefined, true);
                                callback();
                                return;
                            });
                        });

                    });
                }
                break;
            case 'present':
                button = $('<button>', {
                    title: Messages.presentButtonTitle,
                    'class': "fa fa-play-circle cp-app-slide-present-button", // used in slide.js
                    style: 'font:'+size+' FontAwesome'
                });
                break;
            case 'history':
                if (!AppConfig.enableHistory) {
                    button = $('<span>');
                    break;
                }
                button = $('<button>', {
                    title: Messages.historyButton,
                    'class': "fa fa-history history",
                }).append($('<span>', {'class': 'cp-toolbar-drawer-element'}).text(Messages.historyText));
                if (data.histConfig) {
                    button
                    .click(common.prepareFeedback(type))
                    .on('click', function () {
                        common.getHistory(data.histConfig);
                    });
                }
                break;
            case 'more':
                button = $('<button>', {
                    title: Messages.moreActions || 'TODO',
                    'class': "cp-toolbar-drawer-button fa fa-ellipsis-h",
                    style: 'font:'+size+' FontAwesome'
                });
                break;
            default:
                button = $('<button>', {
                    'class': "fa fa-question",
                    style: 'font:'+size+' FontAwesome'
                })
                .click(common.prepareFeedback(type));
        }
        if (rightside) {
            button.addClass('cp-toolbar-rightside-button');
        }
        return button;
    };


    UI.getFileSize = function (Common, href, cb) {
        var channelId = Cryptpad.hrefToHexChannelId(href);
        Common.sendAnonRpcMsg("GET_FILE_SIZE", channelId, function (data) {
            if (!data) { return void cb("No response"); }
            if (data.error) { return void cb(data.error); }
            if (data.response && data.response.length && typeof(data.response[0]) === 'number') {
                return void cb(void 0, data.response[0]);
            } else {
                cb('INVALID_RESPONSE');
            }
        });
    };

    UI.displayAvatar = function (Common, $container, href, name, cb) {
        var MutationObserver = window.MutationObserver;
        var displayDefault = function () {
            var text = Cryptpad.getFirstEmojiOrCharacter(name);
            var $avatar = $('<span>', {'class': 'cp-avatar-default'}).text(text);
            $container.append($avatar);
            if (cb) { cb(); }
        };
        if (!href) { return void displayDefault(); }
        var parsed = Cryptpad.parsePadUrl(href);
        var secret = Cryptpad.getSecrets('file', parsed.hash);
        if (secret.keys && secret.channel) {
            var cryptKey = secret.keys && secret.keys.fileKeyStr;
            var hexFileName = Cryptpad.base64ToHex(secret.channel);
            var src = Cryptpad.getBlobPathFromHex(hexFileName);
            UI.getFileSize(Common, href, function (e, data) {
                if (e) {
                    displayDefault();
                    return void console.error(e);
                }
                if (typeof data !== "number") { return void displayDefault(); }
                if (Cryptpad.bytesToMegabytes(data) > 0.5) { return void displayDefault(); }
                var $img = $('<media-tag>').appendTo($container);
                $img.attr('src', src);
                $img.attr('data-crypto-key', 'cryptpad:' + cryptKey);
                var observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.type === 'childList' && mutation.addedNodes.length) {
                            if (mutation.addedNodes.length > 1 ||
                                mutation.addedNodes[0].nodeName !== 'IMG') {
                                $img.remove();
                                return void displayDefault();
                            }
                            var $image = $img.find('img');
                            var onLoad = function () {
                                var img = new Image();
                                img.onload = function () {
                                    var w = img.width;
                                    var h = img.height;
                                    if (w>h) {
                                        $image.css('max-height', '100%');
                                        $img.css('flex-direction', 'column');
                                        if (cb) { cb($img); }
                                        return;
                                    }
                                    $image.css('max-width', '100%');
                                    $img.css('flex-direction', 'row');
                                    if (cb) { cb($img); }
                                };
                                img.src = $image.attr('src');
                            };
                            if ($image[0].complete) { onLoad(); }
                            $image.on('load', onLoad);
                        }
                    });
                });
                observer.observe($img[0], {
                    attributes: false,
                    childList: true,
                    characterData: false
                });
                MediaTag($img[0]);
            });
        }
    };

    UI.createUserAdminMenu = function (Common, config) {
        var metadataMgr = Common.getMetadataMgr();

        var displayNameCls = config.displayNameCls || 'displayName';
        var $displayedName = $('<span>', {'class': displayNameCls});

        var accountName = metadataMgr.getPrivateData().accountName;
        var origin = metadataMgr.getPrivateData().origin;
        var padType = metadataMgr.getMetadata().type;

        var $userName = $('<span>', {'class': 'userDisplayName'});
        var options = [];
        if (config.displayNameCls) {
            var $userAdminContent = $('<p>');
            if (accountName) {
                var $userAccount = $('<span>', {'class': 'userAccount'}).append(Messages.user_accountName + ': ' + Cryptpad.fixHTML(accountName));
                $userAdminContent.append($userAccount);
                $userAdminContent.append($('<br>'));
            }
            if (config.displayName) {
                // Hide "Display name:" in read only mode
                $userName.append(Messages.user_displayName + ': ');
                $userName.append($displayedName);
            }
            $userAdminContent.append($userName);
            options.push({
                tag: 'p',
                attributes: {'class': 'accountData'},
                content: $userAdminContent.html()
            });
        }
        if (padType !== 'drive') {
            options.push({
                tag: 'a',
                attributes: {
                    'target': '_blank',
                    'href': origin+'/drive/'
                },
                content: Messages.login_accessDrive
            });
        }
        // Add the change display name button if not in read only mode
        if (config.changeNameButtonCls && config.displayChangeName) {
            options.push({
                tag: 'a',
                attributes: {'class': config.changeNameButtonCls},
                content: Messages.user_rename
            });
        }
        if (accountName) {
            options.push({
                tag: 'a',
                attributes: {'class': 'profile'},
                content: Messages.profileButton
            });
        }
        if (padType !== 'settings') {
            options.push({
                tag: 'a',
                attributes: {'class': 'settings'},
                content: Messages.settingsButton
            });
        }
        // Add login or logout button depending on the current status
        if (accountName) {
            options.push({
                tag: 'a',
                attributes: {'class': 'logout'},
                content: Messages.logoutButton
            });
        } else {
            options.push({
                tag: 'a',
                attributes: {'class': 'login'},
                content: Messages.login_login
            });
            options.push({
                tag: 'a',
                attributes: {'class': 'register'},
                content: Messages.login_register
            });
        }
        var $icon = $('<span>', {'class': 'fa fa-user-secret'});
        //var $userbig = $('<span>', {'class': 'big'}).append($displayedName.clone());
        var $userButton = $('<div>').append($icon);//.append($userbig);
        if (accountName) {
            $userButton = $('<div>').append(accountName);
        }
        /*if (account && config.displayNameCls) {
            $userbig.append($('<span>', {'class': 'account-name'}).text('(' + accountName + ')'));
        } else if (account) {
            // If no display name, do not display the parentheses
            $userbig.append($('<span>', {'class': 'account-name'}).text(accountName));
        }*/
        var dropdownConfigUser = {
            text: $userButton.html(), // Button initial text
            options: options, // Entries displayed in the menu
            left: true, // Open to the left of the button
            container: config.$initBlock, // optional
            feedback: "USER_ADMIN",
        };
        var $userAdmin = Cryptpad.createDropdown(dropdownConfigUser);

        var $displayName = $userAdmin.find('.'+displayNameCls);

        var $avatar = $userAdmin.find('.cp-dropdown-button-title');
        var loadingAvatar;
        var to;
        var oldUrl = '';
        var updateButton = function () {
            var myData = metadataMgr.getUserData();
            if (!myData) { return; }
            if (loadingAvatar) {
                // Try again in 200ms
                window.clearTimeout(to);
                to = window.setTimeout(updateButton, 200);
                return;
            }
            loadingAvatar = true;
            var newName = myData.name;
            var url = myData.avatar;
            $displayName.text(newName || Messages.anonymous);
            if (accountName && oldUrl !== url) {
                $avatar.html('');
                UI.displayAvatar(Common, $avatar, url, newName || Messages.anonymous, function ($img) {
                    oldUrl = url;
                    if ($img) {
                        $userAdmin.find('button').addClass('cp-avatar');
                    }
                    loadingAvatar = false;
                });
                return;
            }
            loadingAvatar = false;
        };
        metadataMgr.onChange(updateButton);
        updateButton();

        $userAdmin.find('a.logout').click(function () {
            Common.logout(function () {
                window.parent.location = origin+'/';
            });
        });
        $userAdmin.find('a.settings').click(function () {
            if (padType) {
                window.open(origin+'/settings/');
            } else {
                window.parent.location = origin+'/settings/';
            }
        });
        $userAdmin.find('a.profile').click(function () {
            if (padType) {
                window.open(origin+'/profile/');
            } else {
                window.parent.location = origin+'/profile/';
            }
        });
        $userAdmin.find('a.login').click(function () {
            Common.setLoginRedirect(function () {
                window.parent.location = origin+'/login/';
            });
        });
        $userAdmin.find('a.register').click(function () {
            Common.setLoginRedirect(function () {
                window.parent.location = origin+'/register/';
            });
        });

        return $userAdmin;
    };

    UI.initFilePicker = function (common, cfg) {
        var onSelect = cfg.onSelect || $.noop;
        var sframeChan = common.getSframeChannel();
        sframeChan.on("EV_FILE_PICKED", function (data) {
            onSelect(data);
        });
    };
    UI.openFilePicker = function (common, types) {
        var sframeChan = common.getSframeChannel();
        sframeChan.event("EV_FILE_PICKER_OPEN", types);
    };

    UI.openTemplatePicker = function (common) {
        var metadataMgr = common.getMetadataMgr();
        var type = metadataMgr.getMetadataLazy().type;
        var sframeChan = common.getSframeChannel();

        var onConfirm = function (yes) {
            if (!yes) { return; }
            var first = true; // We can only pick a template once (for a new document)
            var fileDialogCfg = {
                onSelect: function (data) {
                    if (data.type === type && first) {
                        Cryptpad.addLoadingScreen({hideTips: true});
                        sframeChan.query('Q_TEMPLATE_USE', data.href, function () {
                            first = false;
                            Cryptpad.removeLoadingScreen();
                            common.feedback('TEMPLATE_USED');
                        });
                        return;
                    }
                }
            };
            common.initFilePicker(fileDialogCfg);
            var pickerCfg = {
                types: [type],
                where: ['template']
            };
            common.openFilePicker(pickerCfg);
        };

        sframeChan.query("Q_TEMPLATE_EXIST", type, function (err, data) {
            if (data) {
                Cryptpad.confirm(Messages.useTemplate, onConfirm);
            }
        });
    };

    return UI;
});
