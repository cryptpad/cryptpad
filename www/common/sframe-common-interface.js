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

    UI.createUserAdminMenu = function (config) {
        var Common = config.Common;
        var metadataMgr = config.metadataMgr;

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
        var oldUrl;
        var updateButton = function () {
            var myData = metadataMgr.getUserData();
            if (!myData) { return; }
            var newName = myData.name;
            var url = myData.avatar;
            $displayName.text(newName || Messages.anonymous);
            if (accountName && oldUrl !== url) {
                $avatar.html('');
                UI.displayAvatar(Common, $avatar, url, newName, function ($img) {
                    oldUrl = url;
                    if ($img) {
                        $userAdmin.find('button').addClass('cp-avatar');
                    }
                });
            }
        };
        metadataMgr.onChange(updateButton);
        updateButton();

        $userAdmin.find('a.logout').click(function () {
            Common.logout(function () {
                window.top.location = origin+'/';
            });
        });
        $userAdmin.find('a.settings').click(function () {
            if (padType) {
                window.open(origin+'/settings/');
            } else {
                window.top.location = origin+'/settings/';
            }
        });
        $userAdmin.find('a.profile').click(function () {
            if (padType) {
                window.open(origin+'/profile/');
            } else {
                window.top.location = origin+'/profile/';
            }
        });
        $userAdmin.find('a.login').click(function () {
            Common.setLoginRedirect(function () {
                window.top.location = origin+'/login/';
            });
        });
        $userAdmin.find('a.register').click(function () {
            Common.setLoginRedirect(function () {
                window.top.location = origin+'/register/';
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
        var first = true; // We can only pick a template once (for a new document)
        var fileDialogCfg = {
            onSelect: function (data) {
                if (data.type === type && first) {
                    Cryptpad.addLoadingScreen({hideTips: true});
                    var sframeChan = common.getSframeChannel();
                    sframeChan.query('Q_TEMPLATE_USE', data.href, function () {
                        first = false;
                        Cryptpad.removeLoadingScreen();
                        common.feedback('TEMPLATE_USED');
                    });
                    return;
                }
            }
        };
        common.initFilePicker(common, fileDialogCfg);
        var pickerCfg = {
            types: [type],
            where: ['template']
        };
        common.openFilePicker(common, pickerCfg);
    };

    return UI;
});
