define([
    'jquery',
    '/customize/application_config.js',
    '/api/config',
], function ($, Config, ApiConfig) {
    var Messages = {};
    var Cryptpad;
    var Common;

    var Bar = {
        constants: {},
    };

    var SPINNER_DISAPPEAR_TIME = 1000;

    // Toolbar parts
    var TOOLBAR_CLS = Bar.constants.toolbar = 'cp-toolbar';
    var TOP_CLS = Bar.constants.top = 'cp-toolbar-top';
    var LEFTSIDE_CLS = Bar.constants.leftside = 'cp-toolbar-leftside';
    var RIGHTSIDE_CLS = Bar.constants.rightside = 'cp-toolbar-rightside';
    var DRAWER_CLS = Bar.constants.drawer = 'cp-toolbar-drawer-content';
    var HISTORY_CLS = Bar.constants.history = 'cp-toolbar-history';

    // Userlist
    var USERLIST_CLS = Bar.constants.userlist = "cp-toolbar-users";
    var EDITSHARE_CLS = Bar.constants.editShare = "cp-toolbar-share-edit";
    var VIEWSHARE_CLS = Bar.constants.viewShare = "cp-toolbar-share-view";
    var SHARE_CLS = Bar.constants.viewShare = "cp-toolbar-share";

    // Top parts
    var USER_CLS = Bar.constants.userAdmin = "cp-toolbar-user";
    var SPINNER_CLS = Bar.constants.spinner = 'cp-toolbar-spinner';
    var LIMIT_CLS = Bar.constants.limit = 'cp-toolbar-limit';
    var TITLE_CLS = Bar.constants.title = "cp-toolbar-title";
    var NEWPAD_CLS = Bar.constants.newpad = "cp-toolbar-new";
    var LINK_CLS = Bar.constants.link = "cp-toolbar-link";

    // User admin menu
    var USERADMIN_CLS = Bar.constants.user = 'cp-toolbar-user-dropdown';
    var USERNAME_CLS = Bar.constants.username = 'cp-toolbar-user-name';
    /*var READONLY_CLS = */Bar.constants.readonly = 'cp-toolbar-readonly';
    var USERBUTTON_CLS = Bar.constants.changeUsername = "cp-toolbar-user-rename";

    // Create the toolbar element

    var uid = function () {
        return 'cp-toolbar-uid-' + String(Math.random()).substring(2);
    };

    var createRealtimeToolbar = function (config) {
        if (!config.$container) { return; }
        var $container = config.$container;
        var $toolbar = $('<div>', {
            'class': TOOLBAR_CLS,
            id: uid(),
        });

        var $topContainer = $('<div>', {'class': TOP_CLS});
        $('<span>', {'class': 'cp-toolbar-top-filler'}).appendTo($topContainer);
        var $userContainer = $('<span>', {
            'class': USER_CLS
        }).appendTo($topContainer);
        $('<span>', {'class': LIMIT_CLS}).hide().appendTo($userContainer);
        $('<span>', {'class': NEWPAD_CLS + ' cp-dropdown-container'}).hide().appendTo($userContainer);
        $('<span>', {'class': USERADMIN_CLS + ' cp-dropdown-container'}).hide().appendTo($userContainer);

        $toolbar.append($topContainer)
        .append($('<div>', {'class': LEFTSIDE_CLS}))
        .append($('<div>', {'class': RIGHTSIDE_CLS}))
        .append($('<div>', {'class': HISTORY_CLS}));

        var $rightside = $toolbar.find('.'+RIGHTSIDE_CLS);
        if (!config.hideDrawer) {
            var $drawerContent = $('<div>', {
                'class': DRAWER_CLS,
                'tabindex': 1
            }).appendTo($rightside).hide();
            var $drawer = Common.createButton('more', true).appendTo($rightside);
            $drawer.click(function () {
                $drawerContent.toggle();
                $drawer.removeClass('cp-toolbar-button-active');
                if ($drawerContent.is(':visible')) {
                    $drawer.addClass('cp-toolbar-button-active');
                    $drawerContent.focus();
                }
            });
            var onBlur = function (e) {
                if (e.relatedTarget) {
                    if ($(e.relatedTarget).is('.cp-toolbar-drawer-button')) { return; }
                    if ($(e.relatedTarget).parents('.'+DRAWER_CLS).length) {
                        $(e.relatedTarget).blur(onBlur);
                        return;
                    }
                }
                $drawer.removeClass('cp-toolbar-button-active');
                $drawerContent.hide();
            };
            $drawerContent.blur(onBlur);
        }

        // The 'notitle' class removes the line added for the title with a small screen
        if (!config.title || typeof config.title !== "object") {
            $toolbar.addClass('cp-toolbar-notitle');
        }

        $container.prepend($toolbar);

        $container.on('drop dragover', function (e) {
            e.preventDefault();
            e.stopPropagation();
        });
        return $toolbar;
    };

    // Userlist elements

    var getOtherUsers = function(config) {
        //var userList = config.userList.getUserlist();
        var userData = config.metadataMgr.getMetadata().users;

        var i = 0; // duplicates counter
        var list = [];

        // Display only one time each user (if he is connected in multiple tabs)
        var uids = [];
        Object.keys(userData).forEach(function(user) {
            //if (user !== userNetfluxId) {
                var data = userData[user] || {};
                var userId = data.uid;
                if (!userId) { return; }
                //data.netfluxId = user;
                if (uids.indexOf(userId) === -1) {// && (!myUid || userId !== myUid)) {
                    uids.push(userId);
                    list.push(data);
                } else { i++; }
            //}
        });
        return {
            list: list,
            duplicates: i
        };
    };

    var avatars = {};
    var updateUserList = function (toolbar, config) {
        // Make sure the elements are displayed
        var $userButtons = toolbar.userlist;
        var $userlistContent = toolbar.userlistContent;

        var metadataMgr = config.metadataMgr;
        var userData = metadataMgr.getMetadata().users;
        var viewers = metadataMgr.getViewers();
        var priv = metadataMgr.getPrivateData();
        var origin = priv.origin;
        var friends = priv.friends;
        var user = metadataMgr.getUserData();

        // If we are using old pads (readonly unavailable), only editing users are in userList.
        // With new pads, we also have readonly users in userList, so we have to intersect with
        // the userData to have only the editing users. We can't use userData directly since it
        // may contain data about users that have already left the channel.
        //userList = config.readOnly === -1 ? userList : arrayIntersect(userList, Object.keys(userData));

        // Names of editing users
        var others = getOtherUsers(config);
        var editUsersNames = others.list;
        var duplicates = others.duplicates; // Number of duplicates

        editUsersNames.sort(function (a, b) {
            var na = a.name || Messages.anonymous;
            var nb = b.name || Messages.anonymous;
            return na.toLowerCase() > nb.toLowerCase();
        });

        var numberOfEditUsers = Object.keys(userData).length - duplicates;
        var numberOfViewUsers = viewers;

        // Update the userlist
        var $editUsers = $userlistContent.find('.' + USERLIST_CLS).html('');
        Cryptpad.clearTooltips();

        var $editUsersList = $('<div>', {'class': 'cp-toolbar-userlist-others'});

        // Editors
        var pendingFriends = Common.getPendingFriends();
        editUsersNames.forEach(function (data) {
            var name = data.name || Messages.anonymous;
            var $span = $('<span>', {'class': 'cp-avatar'});
            var $rightCol = $('<span>', {'class': 'cp-toolbar-userlist-rightcol'});
            var $nameSpan = $('<span>', {'class': 'cp-toolbar-userlist-name'}).text(name).appendTo($rightCol);
            var isMe = data.curvePublic === user.curvePublic;
            if (Common.isLoggedIn() && data.curvePublic) {
                if (isMe) {
                    $span.attr('title', Messages._getKey('userlist_thisIsYou', [
                        name
                    ]));
                    $nameSpan.text(name);
                } else if (!friends[data.curvePublic]) {
                    if (pendingFriends.indexOf(data.netfluxId) !== -1) {
                        $('<span>', {'class': 'cp-toolbar-userlist-friend'}).text(Messages.userlist_pending)
                            .appendTo($rightCol);
                    } else {
                        $('<span>', {
                            'class': 'fa fa-user-plus cp-toolbar-userlist-friend',
                            'title': Messages._getKey('userlist_addAsFriendTitle', [
                                name
                            ])
                        }).appendTo($rightCol).click(function (e) {
                            e.stopPropagation();
                            Common.sendFriendRequest(data.netfluxId);
                        });
                    }
                }
            }
            if (data.profile) {
                $span.addClass('cp-userlist-clickable');
                $span.click(function () {
                    window.open(origin+'/profile/#' + data.profile);
                });
            }
            if (data.avatar && avatars[data.avatar]) {
                $span.append(avatars[data.avatar]);
                $span.append($rightCol);
            } else {
                Common.displayAvatar(Common, $span, data.avatar, name, function ($img) {
                    if (data.avatar && $img) {
                        avatars[data.avatar] = $img[0].outerHTML;
                    }
                    $span.append($rightCol);
                });
            }
            $span.data('uid', data.uid);
            $editUsersList.append($span);
        });
        $editUsers.append($editUsersList);

        // Viewers
        if (numberOfViewUsers > 0) {
            var viewText = '<div class="cp-toolbar-userlist-viewer">';
            var viewerText = numberOfViewUsers !== 1 ? Messages.viewers : Messages.viewer;
            viewText += numberOfViewUsers + ' ' + viewerText + '</div>';
            $editUsers.append(viewText);
        }

        // Update the buttons
        var fa_editusers = '<span class="fa fa-users"></span>';
        var fa_viewusers = '<span class="fa fa-eye"></span>';
        var $spansmall = $('<span>').html(fa_editusers + ' ' + numberOfEditUsers + '&nbsp;&nbsp; ' + fa_viewusers + ' ' + numberOfViewUsers);
        $userButtons.find('.cp-dropdown-button-title').html('').append($spansmall);
    };

    var initUserList = function (toolbar, config) {
        // TODO clean comments
        if (config.metadataMgr) { /* && config.userList.list && config.userList.userNetfluxId) {*/
            //var userList = config.userList.list;
            //userList.change.push
            var metadataMgr = config.metadataMgr;
            metadataMgr.onChange(function () {
                if (metadataMgr.isConnected()) {toolbar.connected = true;}
                if (!toolbar.connected) { return; }
                //if (config.userList.data) {
                    updateUserList(toolbar, config);
                //}
            });
        }
    };


    // Create sub-elements

    var createUserList = function (toolbar, config) {
        if (!config.metadataMgr) {
            throw new Error("You must provide a `metadataMgr` to display the userlist");
        }
        var $content = $('<div>', {'class': 'cp-toolbar-userlist-drawer'});
        $content.on('drop dragover', function (e) {
            e.preventDefault();
            e.stopPropagation();
        });
        var $closeIcon = $('<span>', {"class": "fa fa-window-close cp-toolbar-userlist-drawer-close"}).appendTo($content);
        $('<h2>').text(Messages.users).appendTo($content);
        $('<p>', {'class': USERLIST_CLS}).appendTo($content);

        toolbar.userlistContent = $content;

        var $container = $('<span>', {id: 'cp-toolbar-userlist-drawer-open', title: Messages.userListButton});

        var $button = $('<button>').appendTo($container);
        $('<span>',{'class': 'cp-dropdown-button-title'}).appendTo($button);

        toolbar.$leftside.prepend($container);

        if (config.$contentContainer) {
            config.$contentContainer.prepend($content);
        }

        var $ck = config.$container.find('.cke_toolbox_main');
        var mobile = $('body').width() <= 600;
        var hide = function () {
            $content.hide();
            $button.removeClass('cp-toolbar-button-active');
            $ck.css({
                'padding-left': '',
            });
        };
        var show = function () {
            $content.show();
            if (mobile) {
                $ck.hide();
            }
            $button.addClass('cp-toolbar-button-active');
            $ck.css({
                'padding-left': '175px',
            });
            var h = $ck.is(':visible') ? -$ck.height() : 0;
            $content.css('margin-top', h+'px');
        };
        $(window).on('cryptpad-ck-toolbar', function () {
            if (mobile && $ck.is(':visible')) { return void hide(); }
            if ($content.is(':visible')) { return void show(); }
            hide();
        });
        $(window).on('resize', function () {
            mobile = $('body').width() <= 600;
            var h = $ck.is(':visible') ? -$ck.height() : 0;
            $content.css('margin-top', h+'px');
        });
        $closeIcon.click(function () {
            //Cryptpad.setAttribute('userlist-drawer', false); TODO iframe
            hide();
        });
        $button.click(function () {
            var visible = $content.is(':visible');
            if (visible) { hide(); }
            else { show(); }
            visible = !visible;
            // TODO iframe
            //Cryptpad.setAttribute('userlist-drawer', visible);
            Common.feedback(visible?'USERLIST_SHOW': 'USERLIST_HIDE');
        });
        show();
        // TODO iframe
        /*Cryptpad.getAttribute('userlist-drawer', function (err, val) {
            if (val === false || mobile) { return void hide(); }
            show();
        });*/

        return $container;
    };

    var createShare = function (toolbar, config) {
        if (!config.metadataMgr) {
            throw new Error("You must provide a `metadataMgr` to display the userlist");
        }
        var metadataMgr = config.metadataMgr;
        var origin = config.metadataMgr.getPrivateData().origin;
        var pathname = config.metadataMgr.getPrivateData().pathname;
        var hashes = metadataMgr.getPrivateData().availableHashes;
        var readOnly = metadataMgr.getPrivateData().readOnly;

        var $shareIcon = $('<span>', {'class': 'fa fa-share-alt'});
        var options = [];

        if (hashes.editHash) {
            options.push({
                tag: 'a',
                attributes: {title: Messages.editShareTitle, 'class': 'cp-toolbar-share-edit-copy'},
                content: '<span class="fa fa-users"></span> ' + Messages.editShare
            });
            if (readOnly) {
                // We're in view mode, display the "open editing link" button
                options.push({
                    tag: 'a',
                    attributes: {
                        title: Messages.editOpenTitle,
                        'class': 'cp-toolbar-share-edit-open',
                        href: origin + pathname + '#' + hashes.editHash,
                        target: '_blank'
                    },
                    content: '<span class="fa fa-users"></span> ' + Messages.editOpen
                });
            }
            options.push({tag: 'hr'});
        }
        if (hashes.viewHash) {
            options.push({
                tag: 'a',
                attributes: {title: Messages.viewShareTitle, 'class': 'cp-toolbar-share-view-copy'},
                content: '<span class="fa fa-eye"></span> ' + Messages.viewShare
            });
            if (!readOnly) {
                // We're in edit mode, display the "open readonly" button
                options.push({
                    tag: 'a',
                    attributes: {
                        title: Messages.viewOpenTitle,
                        'class': 'cp-toolbar-share-view-open',
                        href: origin + pathname + '#' + hashes.viewHash,
                        target: '_blank'
                    },
                    content: '<span class="fa fa-eye"></span> ' + Messages.viewOpen
                });
            }
        }
        var dropdownConfigShare = {
            text: $('<div>').append($shareIcon).html(),
            options: options,
            feedback: 'SHARE_MENU',
        };
        var $shareBlock = Cryptpad.createDropdown(dropdownConfigShare);
        $shareBlock.find('.cp-dropdown-content').addClass(SHARE_CLS).addClass(EDITSHARE_CLS).addClass(VIEWSHARE_CLS);
        $shareBlock.addClass('cp-toolbar-share-button');
        $shareBlock.find('button').attr('title', Messages.shareButton);

        if (hashes.editHash) {
            $shareBlock.find('a.cp-toolbar-share-edit-copy').click(function () {
                /*Common.storeLinkToClipboard(false, function (err) {
                    if (!err) { Cryptpad.log(Messages.shareSuccess); }
                });*/
                var url = origin + pathname + '#' + hashes.editHash;
                var success = Cryptpad.Clipboard.copy(url);
                if (success) { Cryptpad.log(Messages.shareSuccess); }
            });
        }
        if (hashes.viewHash) {
            $shareBlock.find('a.cp-toolbar-share-view-copy').click(function () {
                /*Common.storeLinkToClipboard(true, function (err) {
                    if (!err) { Cryptpad.log(Messages.shareSuccess); }
                });*/
                var url = origin + pathname + '#' + hashes.viewHash;
                var success = Cryptpad.Clipboard.copy(url);
                if (success) { Cryptpad.log(Messages.shareSuccess); }
            });
        }

        toolbar.$leftside.append($shareBlock);
        toolbar.share = $shareBlock;

        return "Loading share button";
    };

    var createFileShare = function (toolbar) {
        if (!window.location.hash) {
            throw new Error("Unable to display the share button: hash required in the URL");
        }
        var $shareIcon = $('<span>', {'class': 'fa fa-share-alt'});
        var $button = $('<button>', {'title': Messages.shareButton}).append($shareIcon);
        $button.addClass('cp-toolbar-share-button');
        $button.click(function () {
            var url = window.location.href;
            var success = Cryptpad.Clipboard.copy(url);
            if (success) { Cryptpad.log(Messages.shareSuccess); }
        });

        toolbar.$leftside.append($button);
        return $button;
    };

    var createTitle = function (toolbar, config) {
        var $titleContainer = $('<span>', {
            'class': TITLE_CLS
        }).appendTo(toolbar.$top);

        var $hoverable = $('<span>', {'class': 'cp-toolbar-title-hoverable'}).appendTo($titleContainer);

        if (typeof config.title !== "object") {
            console.error("config.title", config);
            throw new Error("config.title is not an object");
        }
        var updateTitle = config.title.updateTitle;
        var placeholder = config.title.defaultName;
        var suggestName = config.title.suggestName;

        // Buttons
        var $text = $('<span>', {
            'class': 'cp-toolbar-title-value'
        }).appendTo($hoverable);
        var $pencilIcon = $('<span>', {
            'class': 'cp-toolbar-title-edit',
            'title': Messages.clickToEdit
        });
        var $saveIcon = $('<span>', {
            'class': 'cp-toolbar-title-save',
            'title': Messages.saveTitle
        }).hide();
        if (config.readOnly === 1) {
            $titleContainer.append($('<span>', {'class': 'cp-toolbar-title-readonly'})
                .text('('+Messages.readonly+')'));
        }
        if (config.readOnly === 1 || typeof(Cryptpad) === "undefined") { return $titleContainer; }
        var $input = $('<input>', {
            type: 'text',
            placeholder: placeholder
        }).appendTo($hoverable).hide();
        if (config.readOnly !== 1) {
            $text.attr("title", Messages.clickToEdit);
            $text.addClass("cp-toolbar-title-editable");
            var $icon = $('<span>', {
                'class': 'fa fa-pencil cp-toolbar-title-icon-readonly',
                style: 'font-family: FontAwesome;'
            });
            $pencilIcon.append($icon).appendTo($hoverable);
            var $icon2 = $('<span>', {
                'class': 'fa fa-check cp-toolbar-title-icon-readonly',
                style: 'font-family: FontAwesome;'
            });
            $saveIcon.append($icon2).appendTo($hoverable);
        }

        // Events
        $input.on('mousedown', function (e) {
            if (!$input.is(":focus")) {
                $input.focus();
            }
            e.stopPropagation();
            return true;
        });
        var save = function () {
            var name = $input.val().trim();
            if (name === "") {
                name = $input.attr('placeholder');
            }
            updateTitle(name, function (err/*, newtitle*/) {
                if (err) { return console.error(err); }
                //$text.text(newtitle);
                $input.hide();
                $text.show();
                $pencilIcon.show();
                $saveIcon.hide();
            });
        };
        $input.on('keyup', function (e) {
            if (e.which === 13 && toolbar.connected === true) {
                save();
            } else if (e.which === 27) {
                $input.hide();
                $text.show();
                $pencilIcon.show();
                $saveIcon.hide();
                //$pencilIcon.css('display', '');
            } else if (e.which === 32) {
                e.stopPropagation();
            }
        });
        $saveIcon.click(save);

        var displayInput = function () {
            if (toolbar.connected === false) { return; }
            $input.width(Math.max($text.width(), 300)+'px');
            $text.hide();
            //$pencilIcon.css('display', 'none');
            var inputVal = suggestName() || "";
            $input.val(inputVal);
            $input.show();
            $input.focus();
            $pencilIcon.hide();
            $saveIcon.show();
        };
        $text.on('click', displayInput);
        $pencilIcon.on('click', displayInput);
        return $titleContainer;
    };

    var createPageTitle = function (toolbar, config) {
        if (config.title || !config.pageTitle) { return; }
        var $titleContainer = $('<span>', {
            'class': TITLE_CLS
        }).appendTo(toolbar.$top);

        toolbar.$top.find('.filler').hide();

        var $hoverable = $('<span>', {'class': 'cp-toolbar-title-hoverable'}).appendTo($titleContainer);

        // Buttons
        $('<span>', {
            'class': 'cp-toolbar-title-value cp-toolbar-title-value-page'
        }).appendTo($hoverable).text(config.pageTitle);
    };

    var createLinkToMain = function (toolbar, config) {
        var $linkContainer = $('<span>', {
            'class': LINK_CLS
        }).appendTo(toolbar.$top);

        // We need to override the "a" tag action here because it is inside the iframe!
        var inDrive = /^\/drive/;

        var origin = config.metadataMgr.getPrivateData().origin;

        var href = inDrive.test(origin) ? origin+'/index.html' : origin+'/drive/';
        var buttonTitle = inDrive ? Messages.header_homeTitle : Messages.header_logoTitle;

        var $aTag = $('<a>', {
            href: href,
            title: buttonTitle,
            'class': "cp-toolbar-link-logo"
        }).append($('<img>', {
            src: '/customize/images/logo_white.png?' + ApiConfig.requireConf.urlArgs
        }));
        var onClick = function (e) {
            e.preventDefault();
            if (e.ctrlKey) {
                window.open(href);
                return;
            }
            window.top.location = href;
        };

        var onContext = function (e) { e.stopPropagation(); };

        $aTag.click(onClick).contextmenu(onContext);

        $linkContainer.append($aTag);

        return $linkContainer;
    };

    var typing = -1;
    var kickSpinner = function (toolbar, config, local) {
        if (!toolbar.spinner) { return; }
        var $spin = toolbar.spinner;

        if (typing === -1) {
            typing = 1;
            $spin.text(Messages.typing);
            $spin.interval = window.setInterval(function () {
                var dots = Array(typing+1).join('.');
                $spin.text(Messages.typing + dots);
                typing++;
                if (typing > 3) { typing = 0; }
            }, 500);
        }
        var onSynced = function () {
            if ($spin.timeout) { clearTimeout($spin.timeout); }
            $spin.timeout = setTimeout(function () {
                window.clearInterval($spin.interval);
                typing = -1;
                $spin.text(Messages.saved);
            }, local ? 0 : SPINNER_DISAPPEAR_TIME);
        };
        if (Cryptpad) {
            Cryptpad.whenRealtimeSyncs(config.realtime, onSynced);
            return;
        }
        onSynced();
    };
    var ks = function (toolbar, config, local) {
        return function () {
            if (toolbar.connected) { kickSpinner(toolbar, config, local); }
        };
    };
    var createSpinner = function (toolbar, config) {
        var $spin = $('<span>', {'class': SPINNER_CLS}).appendTo(toolbar.$leftside);
        $spin.text(Messages.synchronizing);

        if (config.realtime) {
            config.realtime.onPatch(ks(toolbar, config));
            config.realtime.onMessage(ks(toolbar, config, true));
        }
        // without this, users in read-only mode say 'synchronizing' until they
        // receive a patch.
        if (Cryptpad) {
            typing = 0;
            Cryptpad.whenRealtimeSyncs(config.realtime, function () {
                kickSpinner(toolbar, config);
            });
        }
        return $spin;
    };

    var createLimit = function (toolbar) {
        if (!Config.enablePinning) { return; }
        var $limitIcon = $('<span>', {'class': 'fa fa-exclamation-triangle'});
        var $limit = toolbar.$userAdmin.find('.'+LIMIT_CLS).attr({
            'title': Messages.pinLimitReached
        }).append($limitIcon).hide();
        var todo = function (e, overLimit) {
            if (e) { return void console.error("Unable to get the pinned usage"); }
            if (overLimit) {
                var key = 'pinLimitReachedAlert';
                if (ApiConfig.noSubscriptionButton === true) {
                    key = 'pinLimitReachedAlertNoAccounts';
                }
                $limit.show().click(function () {
                    Cryptpad.alert(Messages._getKey(key, [encodeURIComponent(window.location.hostname)]), null, true);
                });
            }
        };
        Common.isOverPinLimit(todo);

        return $limit;
    };

    var createNewPad = function (toolbar, config) {
        var $newPad = toolbar.$top.find('.'+NEWPAD_CLS).show();

        var origin = config.metadataMgr.getPrivateData().origin;

        var pads_options = [];
        Config.availablePadTypes.forEach(function (p) {
            if (p === 'drive') { return; }
            if (!Cryptpad.isLoggedIn() && Config.registeredOnlyTypes &&
                Config.registeredOnlyTypes.indexOf(p) !== -1) { return; }
            pads_options.push({
                tag: 'a',
                attributes: {
                    'target': '_blank',
                    'href': origin + '/' + p + '/',
                },
                content: $('<div>').append(Cryptpad.getIcon(p)).html() + Messages.type[p]
            });
        });
        var dropdownConfig = {
            text: '', // Button initial text
            options: pads_options, // Entries displayed in the menu
            container: $newPad,
            left: true,
            feedback: /drive/.test(window.location.pathname)?
                'DRIVE_NEWPAD': 'NEWPAD',
        };
        var $newPadBlock = Cryptpad.createDropdown(dropdownConfig);
        $newPadBlock.find('button').attr('title', Messages.newButtonTitle);
        $newPadBlock.find('button').addClass('fa fa-th');
        return $newPadBlock;
    };

    var createUserAdmin = function (toolbar, config) {
        if (!config.metadataMgr) {
            throw new Error("You must provide a `metadataMgr` to display the user menu");
        }
        var metadataMgr = config.metadataMgr;
        var $userAdmin = toolbar.$userAdmin.find('.'+USERADMIN_CLS).show();
        var userMenuCfg = {
            $initBlock: $userAdmin,
            metadataMgr: metadataMgr,
            Common: Common
        };
        if (!config.hideDisplayName) {
            $.extend(true, userMenuCfg, {
                displayNameCls: USERNAME_CLS,
                changeNameButtonCls: USERBUTTON_CLS,
            });
        }
        if (config.readOnly !== 1) {
            userMenuCfg.displayName = 1;
            userMenuCfg.displayChangeName = 1;
        }
        Common.createUserAdminMenu(userMenuCfg);
        $userAdmin.find('button').attr('title', Messages.userAccountButton);

        var $userButton = toolbar.$userNameButton = $userAdmin.find('a.' + USERBUTTON_CLS);
        $userButton.click(function (e) {
            e.preventDefault();
            e.stopPropagation();
            var myData = metadataMgr.getMetadata().users[metadataMgr.getNetfluxId()];
            var lastName = myData.name;
            Cryptpad.prompt(Messages.changeNamePrompt, lastName || '', function (newName) {
                if (newName === null && typeof(lastName) === "string") { return; }
                if (newName === null) { newName = ''; }
                else { Common.feedback('NAME_CHANGED'); }
                Common.setDisplayName(newName, function (err) {
                    if (err) {
                        console.log("Couldn't set username");
                        console.error(err);
                        return;
                    }
                    //Cryptpad.changeDisplayName(newName, true); Already done?
                });
            });
        });

        return $userAdmin;
    };

    // Events
    var initClickEvents = function (toolbar, config) {
        var removeDropdowns =  function () {
            window.setTimeout(function () {
                toolbar.$toolbar.find('.cp-dropdown-content').hide();
            });
        };
        var cancelEditTitle = function (e) {
            // Now we want to apply the title even if we click somewhere else
            if ($(e.target).parents('.' + TITLE_CLS).length || !toolbar.title) {
                return;
            }
            var $title = toolbar.title;
            if (!$title.find('input').is(':visible')) { return; }

            // Press enter
            var ev = $.Event("keyup");
            ev.which = 13;
            $title.find('input').trigger(ev);
        };
        // Click in the main window
        var w = config.ifrw || window;
        $(w).on('click', removeDropdowns);
        $(w).on('click', cancelEditTitle);
        // Click in iframes
        try {
            if (w.$ && w.$('iframe').length) {
                config.ifrw.$('iframe').each(function (i, el) {
                    $(el.contentWindow).on('click', removeDropdowns);
                    $(el.contentWindow).on('click', cancelEditTitle);
                });
            }
        } catch (e) {
            // empty try catch in case this iframe is problematic
        }
    };

    // Notifications
    var initNotifications = function (toolbar, config) {
        // Display notifications when users are joining/leaving the session
        var oldUserData;
        if (!config.metadataMgr) { return; }
        var metadataMgr = config.metadataMgr;
        var userNetfluxId = metadataMgr.getNetfluxId();
        if (typeof Cryptpad !== "undefined") {
            var notify = function(type, name, oldname) {
                // type : 1 (+1 user), 0 (rename existing user), -1 (-1 user)
                if (typeof name === "undefined") { return; }
                name = name || Messages.anonymous;
                switch(type) {
                    case 1:
                        Cryptpad.log(Messages._getKey("notifyJoined", [name]));
                        break;
                    case 0:
                        oldname = (!oldname) ? Messages.anonymous : oldname;
                        Cryptpad.log(Messages._getKey("notifyRenamed", [oldname, name]));
                        break;
                    case -1:
                        Cryptpad.log(Messages._getKey("notifyLeft", [name]));
                        break;
                    default:
                        console.log("Invalid type of notification");
                        break;
                }
            };

            var userPresent = function (id, user, data) {
                if (!(user && user.uid)) {
                    console.log('no uid');
                    return 0;
                }
                if (!data) {
                    console.log('no data');
                    return 0;
                }

                var count = 0;
                Object.keys(data).forEach(function (k) {
                    if (data[k] && data[k].uid === user.uid) { count++; }
                });
                return count;
            };

            metadataMgr.onChange(function () {
                var newdata = metadataMgr.getMetadata().users;
                var netfluxIds = Object.keys(newdata);
                // Notify for disconnected users
                if (typeof oldUserData !== "undefined") {
                    for (var u in oldUserData) {
                        // if a user's uid is still present after having left, don't notify
                        if (netfluxIds.indexOf(u) === -1) {
                            var temp = JSON.parse(JSON.stringify(oldUserData[u]));
                            delete oldUserData[u];
                            if (temp && newdata[userNetfluxId] && temp.uid === newdata[userNetfluxId].uid) { return; }
                            if (userPresent(u, temp, newdata || oldUserData) < 1) {
                                notify(-1, temp.name);
                            }
                        }
                    }
                }
                // Update the "oldUserData" object and notify for new users and names changed
                if (typeof newdata === "undefined") { return; }
                if (typeof oldUserData === "undefined") {
                    oldUserData = JSON.parse(JSON.stringify(newdata));
                    return;
                }
                if (config.readOnly === 0 && !oldUserData[userNetfluxId]) {
                    oldUserData = JSON.parse(JSON.stringify(newdata));
                    return;
                }
                for (var k in newdata) {
                    if (k !== userNetfluxId && netfluxIds.indexOf(k) !== -1) {
                        if (typeof oldUserData[k] === "undefined") {
                            // if the same uid is already present in the userdata, don't notify
                            if (!userPresent(k, newdata[k], oldUserData)) {
                                notify(1, newdata[k].name);
                            }
                        } else if (oldUserData[k].name !== newdata[k].name) {
                            notify(0, newdata[k].name, oldUserData[k].name);
                        }
                    }
                }
                oldUserData = JSON.parse(JSON.stringify(newdata));
            });
        }
    };



    // Main

    Bar.create = function (cfg) {
        var config = cfg || {};
        Cryptpad = config.common;
        Common = config.sfCommon;
        Messages = Cryptpad.Messages;
        config.readOnly = (typeof config.readOnly !== "undefined") ? (config.readOnly ? 1 : 0) : -1;
        config.displayed = config.displayed || [];

        var toolbar = {};

        toolbar.connected = false;
        toolbar.firstConnection = true;

        var $toolbar = toolbar.$toolbar = createRealtimeToolbar(config);
        toolbar.$leftside = $toolbar.find('.'+Bar.constants.leftside);
        toolbar.$rightside = $toolbar.find('.'+Bar.constants.rightside);
        toolbar.$drawer = $toolbar.find('.'+Bar.constants.drawer);
        toolbar.$top = $toolbar.find('.'+Bar.constants.top);
        toolbar.$history = $toolbar.find('.'+Bar.constants.history);

        toolbar.$userAdmin = $toolbar.find('.'+Bar.constants.userAdmin);

        // Create the subelements
        var tb = {};
        tb['userlist'] = createUserList;
        tb['share'] = createShare;
        tb['fileshare'] = createFileShare;//TODO
        tb['title'] = createTitle;
        tb['pageTitle'] = createPageTitle;//TODO
        tb['lag'] = $.noop;
        tb['spinner'] = createSpinner;
        tb['state'] = $.noop;
        tb['limit'] = createLimit; // TODO
        tb['upgrade'] = $.noop;
        tb['newpad'] = createNewPad;
        tb['useradmin'] = createUserAdmin;

        var addElement = toolbar.addElement = function (arr, additionnalCfg, init) {
            if (typeof additionnalCfg === "object") { $.extend(true, config, additionnalCfg); }
            arr.forEach(function (el) {
                if (typeof el !== "string" || !el.trim()) { return; }
                if (typeof tb[el] === "function") {
                    if (!init && config.displayed.indexOf(el) !== -1) { return; } // Already done
                    toolbar[el] = tb[el](toolbar, config);
                    if (!init) { config.displayed.push(el); }
                }
            });
        };

        addElement(config.displayed, {}, true);
        initUserList(toolbar, config);

        toolbar['linkToMain'] = createLinkToMain(toolbar, config);

        if (!config.realtime) { toolbar.connected = true; }

        initClickEvents(toolbar, config);
        initNotifications(toolbar, config);

        var failed = toolbar.failed = function () {
            toolbar.connected = false;

            if (toolbar.spinner) {
                toolbar.spinner.text(Messages.disconnected);
            }
            //checkLag(toolbar, config);
        };
        toolbar.reconnecting = function (/*userId*/) {
            //if (config.metadataMgr) { config.userList.userNetfluxId = userId; } TODO
            toolbar.connected = false;
            if (toolbar.spinner) {
                toolbar.spinner.text(Messages.reconnecting);
            }
            //checkLag(toolbar, config);
        };

        // On log out, remove permanently the realtime elements of the toolbar
        Cryptpad.onLogout(function () {
            failed();
            if (toolbar.useradmin) { toolbar.useradmin.hide(); }
            if (toolbar.userlist) { toolbar.userlist.hide(); }
        });

        return toolbar;
    };

    return Bar;
});
