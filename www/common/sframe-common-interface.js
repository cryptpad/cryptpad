define([
    'jquery',
    '/api/config',
    '/common/cryptpad-common.js',
    '/common/common-util.js',
    '/common/media-tag.js',
    '/common/tippy.min.js',
    '/customize/application_config.js',

    'css!/common/tippy.css',
], function ($, Config, Cryptpad, Util, MediaTag, Tippy, AppConfig) {
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
                    title: Messages.moreActions,
                    'class': "cp-toolbar-drawer-button fa fa-ellipsis-h",
                    style: 'font:'+size+' FontAwesome'
                });
                break;
            case 'savetodrive':
                button = $('<button>', {
                    'class': 'fa fa-cloud-upload',
                    title: Messages.canvas_saveToDrive,
                })
                .click(common.prepareFeedback(type));
                break;
            case 'hashtag':
                button = $('<button>', {
                    'class': 'fa fa-hashtag',
                    title: Messages.tags_title,
                })
                .click(common.prepareFeedback(type))
                .click(function () {
                    sframeChan.query('Q_TAGS_GET', null, function (err, res) {
                        if (err || res.error) { return void console.error(err || res.error); }
                        Cryptpad.dialog.tagPrompt(res.data, function (tags) {
                            if (!Array.isArray(tags)) { return; }
                            console.error(tags);
                            sframeChan.event('EV_TAGS_SET', tags);
                        });
                    });
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

    // Avatars
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
            Common.getFileSize(href, function (e, data) {
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

    /*  Create a usage bar which keeps track of how much storage space is used
        by your CryptDrive. The getPinnedUsage RPC is one of the heavier calls,
        so we throttle its usage. Clients will not update more than once per
        LIMIT_REFRESH_RATE. It will be update at least once every three such intervals
        If changes are made to your drive in the interim, they will trigger an
        update.
    */
    var LIMIT_REFRESH_RATE = 30000; // milliseconds
    UI.createUsageBar = function (common, cb) {
        if (!common.isLoggedIn()) { return cb("NOT_LOGGED_IN"); }
        // getPinnedUsage updates common.account.usage, and other values
        // so we can just use those and only check for errors
        var $container = $('<span>', {'class':'cp-limit-container'});
        var todo;
        var updateUsage = Cryptpad.notAgainForAnother(function () {
            common.getPinUsage(todo);
        }, LIMIT_REFRESH_RATE);

        todo = function (err, data) {
            if (err) { return void console.error(err); }

            var usage = data.usage;
            var limit = data.limit;
            var plan = data.plan;
            $container.html('');
            var unit = Util.magnitudeOfBytes(limit);

            var usage = unit === 'GB'? Util.bytesToGigabytes(usage):
                Util.bytesToMegabytes(usage);
            var limit = unit === 'GB'? Util.bytesToGigabytes(limit):
                Util.bytesToMegabytes(limit);

            var $limit = $('<span>', {'class': 'cp-limit-bar'}).appendTo($container);
            var quota = usage/limit;
            var $usage = $('<span>', {'class': 'cp-limit-usage'}).css('width', quota*100+'%');

            var makeDonateButton = function () {
                $('<a>', {
                    'class': 'cp-limit-upgrade btn btn-success',
                    href: Cryptpad.donateURL,
                    rel: "noreferrer noopener",
                    target: "_blank",
                }).text(Messages.supportCryptpad).appendTo($container);
            };

            var makeUpgradeButton = function () {
                $('<a>', {
                    'class': 'cp-limit-upgrade btn btn-success',
                    href: Cryptpad.upgradeURL,
                    rel: "noreferrer noopener",
                    target: "_blank",
                }).text(Messages.upgradeAccount).appendTo($container);
            };

            if (!Config.removeDonateButton) {
                if (!common.isLoggedIn() || !Config.allowSubscriptions) {
                    // user is not logged in, or subscriptions are disallowed
                    makeDonateButton();
                } else if (!plan) {
                    // user is logged in and subscriptions are allowed
                    // and they don't have one. show upgrades
                    makeUpgradeButton();
                } else {
                    // they have a plan. show nothing
                }
            }

            var prettyUsage;
            var prettyLimit;

            if (unit === 'GB') {
                prettyUsage = Messages._getKey('formattedGB', [usage]);
                prettyLimit = Messages._getKey('formattedGB', [limit]);
            } else {
                prettyUsage = Messages._getKey('formattedMB', [usage]);
                prettyLimit = Messages._getKey('formattedMB', [limit]);
            }

            if (quota < 0.8) { $usage.addClass('cp-limit-usage-normal'); }
            else if (quota < 1) { $usage.addClass('cp-limit-usage-warning'); }
            else { $usage.addClass('cp-limit-usage-above'); }
            var $text = $('<span>', {'class': 'cp-limit-usage-text'});
            $text.text(usage + ' / ' + prettyLimit);
            $limit.append($usage).append($text);
        };

        setInterval(function () {
            updateUsage();
        }, LIMIT_REFRESH_RATE * 3);

        updateUsage();
        /*getProxy().on('change', ['drive'], function () {
            updateUsage();
        }); TODO*/
        cb(null, $container);
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
                attributes: {'class': 'cp-toolbar-account'},
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
        var focus;

        var onConfirm = function (yes) {
            if (!yes) {
                if (focus) { focus.focus(); }
                return;
            }
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
                        if (focus) { focus.focus(); }
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
                focus = document.activeElement;
                Cryptpad.confirm(Messages.useTemplate, onConfirm, {
                    ok: Messages.useTemplateOK,
                    cancel: Messages.useTemplateCancel,
                });
            }
        });
    };

    UI.addTooltips = function () {
        var MutationObserver = window.MutationObserver;
        var delay = typeof(AppConfig.tooltipDelay) === "number" ? AppConfig.tooltipDelay : 500;
        var addTippy = function (i, el) {
            if (el.nodeName === 'IFRAME') { return; }
            Tippy(el, {
                position: 'bottom',
                distance: 0,
                performance: true,
                dynamicTitle: true,
                delay: [delay, 0]
            });
        };
        var clearTooltips = function () {
            $('.tippy-popper').each(function (i, el) {
                if ($('[aria-describedby=' + el.getAttribute('id') + ']').length === 0) {
                    el.remove();
                }
            });
        };
        // This is the robust solution to remove dangling tooltips
        // The mutation observer does not always find removed nodes.
        setInterval(clearTooltips, delay);
        var checkRemoved = function (x) {
            var out = false;
            $(x).find('[aria-describedby]').each(function (i, el) {
                var id = el.getAttribute('aria-describedby');
                if (id.indexOf('tippy-tooltip-') !== 0) { return; }
                out = true;
            });
            return out;
        };
        $('[title]').each(addTippy);
        var observer = new MutationObserver(function(mutations) {
            var removed = false;
            mutations.forEach(function(mutation) {
                for (var i = 0; i < mutation.addedNodes.length; i++) {
                    $(mutation.addedNodes[i]).find('[title]').each(addTippy);
                }
                for (var j = 0; j < mutation.removedNodes.length; j++) {
                    removed |= checkRemoved(mutation.removedNodes[j]);
                }
            });
            if (removed) { clearTooltips(); }
        });
        observer.observe($('body')[0], {
            attributes: false,
            childList: true,
            characterData: false,
            subtree: true
        });
    };

    return UI;
});
