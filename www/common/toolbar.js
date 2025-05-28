// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/customize/application_config.js',
    '/api/config',
    '/api/broadcast',
    '/common/common-ui-elements.js',
    '/common/common-interface.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/common/common-feedback.js',
    '/common/inner/common-mediatag.js',
    '/common/inner/badges.js',
    '/common/hyperscript.js',
    '/common/messenger-ui.js',
    '/customize/messages.js',
    '/customize/pages.js',
    '/common/pad-types.js',
], function ($, Config, ApiConfig, Broadcast, UIElements, UI, Hash, Util, Feedback, MT, Badges, h,
MessengerUI, Messages, Pages, PadTypes) {
    var Common;

    var Bar = {
        constants: {},
    };

    var SPINNER_DISAPPEAR_TIME = 1000;

    // Toolbar parts
    var TOOLBAR_CLS = Bar.constants.toolbar = 'cp-toolbar';
    var TOP_CLS = Bar.constants.top = 'cp-toolbar-top';
    var BOTTOM_CLS = Bar.constants.bottom = 'cp-toolbar-bottom';
    var BOTTOM_LEFT_CLS = Bar.constants.bottomL = 'cp-toolbar-bottom-left';
    var BOTTOM_MID_CLS = Bar.constants.bottomM = 'cp-toolbar-bottom-mid';
    var BOTTOM_RIGHT_CLS = Bar.constants.bottomR = 'cp-toolbar-bottom-right';
    var FILE_CLS = Bar.constants.file = 'cp-toolbar-file';
    var DRAWER_CLS = Bar.constants.drawer = 'cp-toolbar-drawer-content';
    var HISTORY_CLS = Bar.constants.history = 'cp-toolbar-history';
    var SNAPSHOTS_CLS = Bar.constants.history = 'cp-toolbar-snapshots';

    // Userlist
    var USERLIST_CLS = Bar.constants.userlist = "cp-toolbar-users";

    // Top parts
    var USER_CLS = Bar.constants.userAdmin = "cp-toolbar-user";
    var SPINNER_CLS = Bar.constants.spinner = 'cp-toolbar-spinner';
    var LIMIT_CLS = Bar.constants.limit = 'cp-toolbar-limit';
    var TITLE_CLS = Bar.constants.title = "cp-toolbar-title";
    var LINK_CLS = Bar.constants.link = "cp-toolbar-link";
    var NOTIFICATIONS_CLS = Bar.constants.user = 'cp-toolbar-notifications';
    var MAINTENANCE_CLS = Bar.constants.user = 'cp-toolbar-maintenance';

    // User admin menu
    var USERADMIN_CLS = Bar.constants.user = 'cp-toolbar-user-dropdown';
    var USERNAME_CLS = Bar.constants.username = 'cp-toolbar-user-name';
    /*var READONLY_CLS = */Bar.constants.readonly = 'cp-toolbar-readonly';
    var USERBUTTON_CLS = Bar.constants.changeUsername = "cp-toolbar-user-rename";

    // Create the toolbar element

    var uid = function () {
        return 'cp-toolbar-uid-' + String(Math.random()).substring(2);
    };

    var observeChildren = function ($content, isDrawer) {
        var reorderDOM = Util.throttle(function ($content, observer) {
            if (!$content.length) { return; }

            // List all children based on their "order" property
            var map = {};
            $content[0].childNodes.forEach((node) => {
                try {
                    if (!node.attributes) { return; }
                    let nodeWithOrder;
                    if (isDrawer) { // HACK: the order is set on their inner "a" tag
                        let $n = $(node);
                        if (!$n.attr('class') &&
                            ($n.find('.fa').length || $n.find('.cptools').length)) {
                            nodeWithOrder = $n.find('.fa')[0] || $n.find('.cptools')[0];
                        }
                    }
                    var order = getComputedStyle(nodeWithOrder || node).getPropertyValue("order");
                    var a = map[order] = map[order] || [];
                    a.push(node);
                } catch (e) { console.error(e, node); }
            });

            // Disconnect the observer while we're reordering to avoid infinite loop
            observer.disconnect();
            Object.keys(map).sort(function (a, b) {
                return Number(a) - Number(b);
            }).forEach(function (k) {
                var arr = map[k];
                if (!Number(k)) { return; } // No need to "append" if order is 0
                // Reorder
                arr.forEach(function (node) {
                    $content.append(node);
                });
            });
            observer.start();
        }, 100);

        let observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    reorderDOM($content, observer);
                }
            });
        });
        observer.start = function () {
            if (!$content.length) { return; }
            observer.observe($content[0], {
                childList: true
            });
        };
        observer.start();
    };

    var createRealtimeToolbar = function (config) {
        if (!config.$container) { return; }
        var $container = config.$container;

        var priv = config.metadataMgr.getPrivateData();
        var isEmbed = Bar.isEmbed = priv.isEmbed ||
                (priv.app === 'form' && priv.readOnly && !priv.form_auditorHash);
        if (isEmbed) {
            $container.hide();
        }

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
        $('<span>', {'class': MAINTENANCE_CLS + ' cp-dropdown-container'}).hide().appendTo($userContainer);
        $('<span>', {'class': NOTIFICATIONS_CLS + ' cp-dropdown-container'}).hide().appendTo($userContainer);
        $('<span>', {'class': USERADMIN_CLS + ' cp-dropdown-container'}).hide().appendTo($userContainer);

        $toolbar.append($topContainer);
        $(h('div.'+BOTTOM_CLS, [
            h('div.'+BOTTOM_LEFT_CLS),
            h('div.'+BOTTOM_MID_CLS),
            h('div.'+BOTTOM_RIGHT_CLS)
        ])).appendTo($toolbar);
        $toolbar.append(h('div.'+HISTORY_CLS));
        $toolbar.append(h('div.'+SNAPSHOTS_CLS));

        var $file = $toolbar.find('.'+BOTTOM_LEFT_CLS);

        if (config.addFileMenu) {
            var $drawer = UIElements.createDropdown({
                text: Messages.toolbar_file,
                options: [],
                common: Common,
                iconCls: 'fa fa-file-o'
            }).hide();
            $drawer.addClass(FILE_CLS).appendTo($file);
            $drawer.find('.cp-dropdown-content').addClass(DRAWER_CLS);
            $drawer.find('span').addClass('cp-button-name');
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
                var data = userData[user] || {};
                var userId = data.uid;
                if (!userId) { return; }
                if (user !== data.netfluxId) { return; }
                if (uids.indexOf(userId) === -1) {
                    uids.push(userId);
                    list.push(data);
                } else { i++; }
        });
        return {
            list: list,
            duplicates: i
        };
    };

    var editingUserName = {
        state: false
    };
    var setDisplayName = function (newName) {
        Common.setDisplayName(newName, function (err) {
            if (err) {
                console.log("Couldn't set username");
                console.error(err);
                return;
            }
        });
    };
    var showColors = false;
    const validatedBadges = {};
    var updateUserList = function (toolbar, config, forceOffline) {
        if (!config.displayed || config.displayed.indexOf('userlist') === -1) { return; }
        if (toolbar.isAlone) { return; }
        // Make sure the elements are displayed
        var $userButtons = toolbar.userlist;
        var $userlistContent = toolbar.userlistContent;

        var metadataMgr = config.metadataMgr;

        var online = !forceOffline && metadataMgr.isConnected();
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

        // If the user was changing his username, do not reste the input, store the current value
        // and cursor
        if (editingUserName.state) {
            var $input = $userlistContent.find('.cp-toolbar-userlist-name-input');
            editingUserName.value = $input.val();
            editingUserName.select = [$input[0].selectionStart, $input[0].selectionEnd];
        }



        // Update the userlist
        var $editUsers = $userlistContent.find('.' + USERLIST_CLS).html('');

        var $editUsersList = $('<div>', {'class': 'cp-toolbar-userlist-others'})
                                .appendTo($editUsers);

        var degradedLimit = Config.degradedLimit || 8;
        if (toolbar.isDeleted) {
            $('<em>').text(Messages.deletedFromServer).appendTo($editUsersList);
            numberOfEditUsers = '?';
            numberOfViewUsers = '?';
        } else if (!online) {
            $('<em>').text(Messages.userlist_offline).appendTo($editUsersList);
            numberOfEditUsers = '?';
            numberOfViewUsers = '?';
        } else if (metadataMgr.isDegraded() === true) {
            numberOfEditUsers = Math.max(metadataMgr.getChannelMembers().length - 1, 0);
            numberOfViewUsers = '';
            $('<em>').text(Messages._getKey('toolbar_degraded', [degradedLimit])).appendTo($editUsersList);
        }

        // Update the buttons
        var fa_editusers = '<span class="fa fa-users"></span>';
        var fa_viewusers = numberOfViewUsers === '' ? '' : '<span class="fa fa-eye"></span>';
        var $spansmall = $('<span>').html(fa_editusers + ' ' + numberOfEditUsers + '&nbsp;&nbsp; ' + fa_viewusers + ' ' + numberOfViewUsers);
        $userButtons.find('.cp-toolbar-userlist-button').html('').append($spansmall);

        if (!online || toolbar.isDeleted) { return; }

        if (metadataMgr.isDegraded() === true) { return; }

        // Display the userlist

        // Editors
        var pendingFriends = Common.getPendingFriends(); // Friend requests sent
        var friendRequests = Common.getFriendRequests(); // Friend requests received
        editUsersNames.forEach(function (data) {
            var name = data.name || Messages.anonymous;
            var safeName = Util.fixHTML(name);
            var $span = $('<span>', {'class': 'cp-avatar'});
            if (data.color && showColors) {
                $span.css('border-color', data.color);
            }
            var $rightCol = $('<span>', {'class': 'cp-toolbar-userlist-rightcol'});
            var $nameSpan = $('<span>', {'class': 'cp-toolbar-userlist-name'}).appendTo($rightCol);
            var $nameValue = $('<span>', {
                'class': 'cp-toolbar-userlist-name-value'
            }).text(name).appendTo($nameSpan);
            var isMe = data.uid === user.uid;
            if (isMe && !priv.readOnly) {
                if (!Config.disableProfile) {
                    var $button = $('<button>', {
                        'class': 'fa fa-pencil cp-toolbar-userlist-button',
                        title: Messages.user_rename
                    }).appendTo($nameSpan);
                    $button.hover(function (e) { e.preventDefault(); e.stopPropagation(); });
                    $button.mouseenter(function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        window.setTimeout(function () {
                            $button.parents().mouseleave();
                        });
                    });
                    var $nameInput = $('<input>', {
                        'class': 'cp-toolbar-userlist-name-input'
                    }).val(name).appendTo($rightCol);
                    $button.click(function (e) {
                        e.stopPropagation();
                        $nameSpan.hide();
                        $nameInput.show().focus().select();
                        editingUserName.state = true;
                        editingUserName.oldName = $nameInput.val();
                    });
                    $nameInput.click(function (e) {
                        e.stopPropagation();
                    });
                    $nameInput.on('keydown', function (e) {
                        if (e.which === 13 || e.which === 27) {
                            $nameInput.hide();
                            $nameSpan.show();
                            $button.show();
                            editingUserName.state = false;
                        }
                        if (e.which === 13) {
                            var newName = $nameInput.val(); // TODO clean
                            $nameValue.text(newName);
                            setDisplayName(newName);
                            return;
                        }
                        if (e.which === 27) {
                            $nameValue.text(editingUserName.oldName);
                            return;
                        }
                    });
                    if (editingUserName.state) {
                        $button.click();
                        $nameInput.val(editingUserName.value);
                        $nameInput[0].setSelectionRange(editingUserName.select[0],
                                                     editingUserName.select[1]);
                        setTimeout(function () { $nameInput.focus(); });
                    }
                }
            } else if (Common.isLoggedIn() && data.curvePublic && !friends[data.curvePublic]
                && !priv.readOnly) {
                if (pendingFriends[data.curvePublic]) {
                    $('<button>', {
                        'class': 'fa fa-hourglass-half cp-toolbar-userlist-button',
                        'title': Messages.profile_friendRequestSent
                    }).appendTo($nameSpan);
                } else if (friendRequests[data.curvePublic]) {
                    $('<button>', {
                        'class': 'fa fa-bell cp-toolbar-userlist-button',
                        'data-cptippy-html': true,
                        'title': Messages._getKey('friendRequest_received', [safeName]),
                    }).appendTo($nameSpan).click(function (e) {
                        e.stopPropagation();
                        UIElements.displayFriendRequestModal(Common, friendRequests[data.curvePublic]);
                    });

                } else {
                    $('<button>', {
                        'class': 'fa fa-user-plus cp-toolbar-userlist-button',
                        'data-cptippy-html': true,
                        'title': Messages._getKey('userlist_addAsFriendTitle', [
                            safeName,
                        ])
                    }).appendTo($nameSpan).click(function (e) {
                        e.stopPropagation();
                        Common.sendFriendRequest(data, function (err, obj) {
                            if (err || (obj && obj.error)) {
                                UI.warn(Messages.error);
                                return void console.error(err || obj.error);
                            }
                        });
                    });
                }
            } else if (Common.isLoggedIn() && data.curvePublic && friends[data.curvePublic]) {
                $('<button>', {
                    'class': 'fa fa-comments-o cp-toolbar-userlist-button',
                    'title': Messages.contact_chat
                }).appendTo($nameSpan).click(function (e) {
                    e.stopPropagation();
                    Common.openURL('/contacts/');
                });
            }
            if (data.profile) {
                // Messages.contacts_info3 "Double-click their icon to view their profile",
                $span.addClass('cp-userlist-clickable');
                $span.attr('title', Messages._getKey('userlist_visitProfile', [name]));
                $span.click(function () {
                    Common.openURL(origin+'/profile/#' + data.profile);
                });
            }
            Common.displayAvatar($span, data.avatar, name, function () {
                $span.append($rightCol);
            }, data.uid);
            $span.data('uid', data.uid);
            if (false && data.badge && data.edPublic) { // XXX 2025.6
                const addBadge = (badge) => {
                    let i = Badges.render(badge);
                    if (!i) { return; }
                    $rightCol.append(h('div.cp-userlist-badge', i));
                };
                const key = data.signature + '-' + data.badge;
                const v = validatedBadges[key];
                if (typeof (v) === "string") {
                    addBadge(v);
                } else if (v === false) {
                    addBadge('error');
                } else {
                    let ev = validatedBadges[key] ||= Util.mkEvent(true);
                    ev.reg(badge => { addBadge(badge); });
                    toolbar.badges.execCommand('CHECK_BADGE', {
                        badge: data.badge,
                        channel: priv.channel,
                        ed: data.edPublic,
                        sig: data.signature,
                        nid: data.netfluxId
                    }, res => {
                        if (!res?.verified) {
                            validatedBadges[key] = false;
                            return void addBadge('error');
                        }
                        validatedBadges[key] = res.badge;
                        ev.fire(res.badge);
                    });
                }

            }
            $editUsersList.append($span);
        });

        // Viewers
        if (numberOfViewUsers > 0) {
            var viewText = '<div class="cp-toolbar-userlist-viewer">';
            var viewerText = numberOfViewUsers !== 1 ? Messages.viewers : Messages.viewer;
            viewText += numberOfViewUsers + ' ' + viewerText + '</div>';
            $editUsers.append(viewText);
        }
    };

    var initUserList = function (toolbar, config) {
        if (config.metadataMgr) {
            var metadataMgr = config.metadataMgr;
            metadataMgr.onChange(function () {
                if (metadataMgr.isConnected()) {toolbar.connected = true;}
                if (!toolbar.connected) { return; }
                updateUserList(toolbar, config);
            });
            setTimeout(function () {
                updateUserList(toolbar, config, true);
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
        //var $closeIcon = $('<span>', {"class": "fa fa-times cp-toolbar-userlist-drawer-close"}).appendTo($content);
        $('<h2>').text(Messages.users).appendTo($content);
        $('<p>', {'class': USERLIST_CLS}).appendTo($content);

        toolbar.userlistContent = $content;

        var $container = $('<span>', {id: 'cp-toolbar-userlist-drawer-open', title: Messages.userListButton});

        var $button = $('<button>').appendTo($container);
        $('<span>',{'class': 'cp-toolbar-userlist-button'}).appendTo($button);

        toolbar.$bottomR.prepend($container);

        if (config.$contentContainer) {
            config.$contentContainer.prepend($content);
        }

        var hide = function () {
            $content.hide();
            $button.removeClass('cp-toolbar-button-active');
        };
        var show = function () {
            if (Bar.isEmbed) { $content.hide(); return; }
            $content.show();
            $button.addClass('cp-toolbar-button-active');
        };
        /*
        $closeIcon.click(function () {
            Common.setAttribute(['toolbar', 'userlist-drawer'], false);
            hide();
        });
        */
        $button.click(function () {
            var visible = $content.is(':visible');
            if (visible) { hide(); }
            else { show(); }
            visible = !visible;
            Common.setAttribute(['toolbar', 'userlist-drawer'], visible);
            Feedback.send(visible?'USERLIST_SHOW': 'USERLIST_HIDE');
        });
        show();
        Common.getAttribute(['toolbar', 'userlist-drawer'], function (err, val) {
            if (val === false || window.innerWidth < 800)  {
                return void hide();
            }
            show();
        });

        initUserList(toolbar, config);
        return $container;
    };

    var createCollapse = function (toolbar) {
        var up = h('i.fa.fa-chevron-up', {title: Messages.toolbar_collapse});
        var down = h('i.fa.fa-chevron-down', {title: Messages.toolbar_expand});
        var notif = h('span.cp-collapsed-notif');

        var $button = $(h('button.cp-toolbar-collapse',[
            up,
            down,
            notif
        ]));
        var $up = $(up);
        var $down = $(down);
        toolbar.$bottomR.prepend($button);
        $down.hide();
        $(notif).hide();
        $button.click(function () {
            toolbar.$top.toggleClass('toolbar-hidden');
            var hidden = toolbar.$top.hasClass('toolbar-hidden');
            $button.toggleClass('cp-toolbar-button-active');
            if (hidden) {
                $up.hide();
                $down.show();
            } else {
                $up.show();
                $down.hide();
                $(notif).hide();
            }
        });
    };

    var initChat = function (toolbar) {
        var $container = $('<div>', {
            id: 'cp-app-contacts-container',
            'class': 'cp-app-contacts-inapp'
        }).prependTo(toolbar.chatContent);
        MessengerUI.create($container, Common, toolbar);
    };
    var createChat = function (toolbar, config) {
        if (!config.metadataMgr) {
            throw new Error("You must provide a `metadataMgr` to display the chat");
        }
        if (!PadTypes.isAvailable('contacts')) { return; }
        var $content = $('<div>', {'class': 'cp-toolbar-chat-drawer'});
        $content.on('drop dragover', function (e) {
            e.preventDefault();
            e.stopPropagation();
        });
        //var $closeIcon = $('<span>', {"class": "fa fa-times cp-toolbar-chat-drawer-close"}).appendTo($content);
        //$('<h2>').text(Messages.users).appendTo($content);
        //$('<p>', {'class': USERLIST_CLS}).appendTo($content);

        toolbar.chatContent = $content;

        var $container = $('<span>', {id: 'cp-toolbar-chat-drawer-open'});

        var $button = $(h('button', [
            h('i.fa.fa-comments'),
            h('span.cp-button-name', Messages.chatButton)
        ])).appendTo($container);

        toolbar.$bottomR.prepend($container);

        if (config.$contentContainer) {
            config.$contentContainer.prepend($content);
        }

        var hide = function (closed) {
            if (!closed) {
                // It means it's the initial state so we're going to make the icon blink
                $button.addClass('cp-toolbar-notification');
            }
            $content.hide();
            $button.removeClass('cp-toolbar-button-active');
            config.$contentContainer.removeClass('cp-chat-visible');
        };
        var show = function () {
            if (Bar.isEmbed) { $content.hide(); return; }
            $content.show();
            // scroll down chat
            var $messagebox = $content.find('.cp-app-contacts-messages');
            if ($messagebox.length) {
                $messagebox.scrollTop($messagebox[0].scrollHeight);
            }

            $button.addClass('cp-toolbar-button-active');
            config.$contentContainer.addClass('cp-chat-visible');
            $button.removeClass('cp-toolbar-notification');
        };
        /*
        $closeIcon.click(function () {
            Common.setAttribute(['toolbar', 'chat-drawer'], false);
            hide(true);
        });
        */
        $button.click(function () {
            var visible = $content.is(':visible');
            if (visible) { hide(true); }
            else { show(); }
            visible = !visible;
            Common.setAttribute(['toolbar', 'chat-drawer'], visible);
        });
        show();
        Common.getAttribute(['toolbar', 'chat-drawer'], function (err, val) {
            if (!val || Util.isSmallScreen()) {
                return void hide(val === false);
            }
            show();
        });

        initChat(toolbar);
        return $container;
    };

    var createShare = function (toolbar, config) {
        if (!config.metadataMgr) {
            throw new Error("You must provide a `metadataMgr` to display the share button");
        }

        var $shareBlock = $(h('button.cp-toolar-share-button.cp-toolbar-button-primary', [
            h('i.fa.fa-shhare-alt'),
            h('span.cp-button-name', Messages.shareButton)
        ]));
        Common.getSframeChannel().event('EV_SHARE_OPEN', {
            hidden: true
        });
        $shareBlock.click(function () {
            if (!config.metadataMgr.getPrivateData().isTop) {
                return void UIElements.openDirectlyConfirmation(Common);
            }
            if (toolbar.isDeleted) {
                return void UI.warn(Messages.deletedFromServer);
            }
            var privateData = config.metadataMgr.getPrivateData();
            var title = (config.title && config.title.getTitle && config.title.getTitle())
                        || (config.title && config.title.defaultName)
                        || "";
            Common.getSframeChannel().event('EV_SHARE_OPEN', {
                title: title,
                auditorHash: privateData.form_auditorHash
            });
        });

        toolbar.$bottomM.append($shareBlock);
        toolbar.share = $shareBlock;

        return "Loading share button";
    };
    var createAccess = function (toolbar, config) {
        if (!config.metadataMgr) {
            throw new Error("You must provide a `metadataMgr` to display the access button");
        }

        var $accessBlock = $(h('button.cp-toolar-access-button.cp-toolbar-button-primary', [
            h('i.fa.fa-unlock-alt'),
            h('span.cp-button-name', Messages.accessButton)
        ]));
        $accessBlock.click(function () {
            if (!config.metadataMgr.getPrivateData().isTop) {
                return void UIElements.openDirectlyConfirmation(Common);
            }
            if (toolbar.isDeleted) {
                return void UI.warn(Messages.deletedFromServer);
            }
            var title = (config.title && config.title.getTitle && config.title.getTitle())
                        || (config.title && config.title.defaultName)
                        || "";
            Common.getSframeChannel().event('EV_ACCESS_OPEN', {
                title: title
            });
        });

        toolbar.$bottomM.append($accessBlock);
        toolbar.access = $accessBlock;

        return "Loading access button";
    };

    var createFileShare = function (toolbar, config) {
        if (!config.metadataMgr) {
            throw new Error("You must provide a `metadataMgr` to display the userlist");
        }

        var $shareBlock = $(h('button.cp-toolar-share-button.cp-toolbar-button-primary', [
            h('i.fa.fa-shhare-alt'),
            h('span.cp-button-name', Messages.shareButton)
        ]));
        Common.getSframeChannel().event('EV_SHARE_OPEN', {
            hidden: true,
            file: true
        });
        $shareBlock.click(function () {
            var title = (config.title && config.title.getTitle && config.title.getTitle())
                        || "";
            Common.getSframeChannel().event('EV_SHARE_OPEN', {
                title: title,
                file: true
            });
        });

        toolbar.$bottomM.append($shareBlock);
        return $shareBlock;
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
            'class': 'cp-toolbar-title-value',
            tabindex: 0
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
            $hoverable.append($('<span>', {'class': 'cp-toolbar-title-readonly'})
                .text('('+Messages.readonly+')'));
            return $titleContainer;
        }
        $hoverable.append($('<span>', {'class': 'cp-toolbar-title-readonly cp-toolbar-title-unsync'})
            .text('('+Messages.readonly+')'));
        var $input = $('<input>', {
            type: 'text',
            placeholder: placeholder,
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
            if (toolbar.history) { return; }
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
            if (toolbar.history) { return; }
            $input.width(Math.max(($text.width() + 10), 300)+'px');
            $text.hide();
            //$pencilIcon.css('display', 'none');
            var inputVal = suggestName() || "";
            $input.val(inputVal);
            $input.show();
            $input.focus();
            if (inputVal === $input.attr('placeholder')) {
                // Placeholder is the default name, select text to make editing easier
                $input.select();
            }
            $pencilIcon.hide();
            $saveIcon.show();
        };
        $text.on('click keypress', function (event) {
            if (event.type === 'click' || (event.type === 'keypress' && event.which === 13)) {
                displayInput();
            }
        });
        $pencilIcon.on('click keypress', function (event) {
            if (event.type === 'click' || (event.type === 'keypress' && event.which === 13)) {
                displayInput();
            }
        });
        return $titleContainer;
    };


    var createPageTitle = function (toolbar, config) {
        if (!config.pageTitle) { return; }
        var $titleContainer = $('<span>', {
            'class': TITLE_CLS
        }).appendTo(toolbar.$top);

        toolbar.$top.find('.filler').hide();

        var $hoverable = $('<span>', {'class': 'cp-toolbar-title-hoverable'}).appendTo($titleContainer);

        // Buttons
        var $b = $('<span>', {
            'class': 'cp-toolbar-title-value cp-toolbar-title-value-page'
        }).appendTo($hoverable).text(config.pageTitle);

        toolbar.updatePageTitle = function (title) {
            $b.text(title);
        };
    };

    Bar.createSkipLink = function (toolbar, config) {
        if (config.readOnly === 1) {return;}
        const targetId = config.skipLink;
        const $skipLink = $('<a>', {
            'class': 'cp-toolbar-skip-link',
            'href': targetId,
            'tabindex': 0,
            'text': Messages.skipLink
        });
        toolbar.$top.append($skipLink);
        $skipLink.on('click', function (event) {
            event.preventDefault();

            let split = targetId.split('|'); // split for iframes
            let $container = $('body');
            split.some(selector => {
                let $targetElement = $container.find(selector);
                if ($targetElement.is('iframe')) {
                    $container = $targetElement.contents();
                    return;
                }
                const $firstFocusable = $targetElement.find('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]').first();
                if ($firstFocusable.length) {
                    $firstFocusable.trigger('focus');
                } else {
                    $skipLink.hide();
                }
                return true;
            });
        });
        return $skipLink;
    };
    var createLinkToMain = function (toolbar, config) {
        var $linkContainer = $('<span>', {
            'class': LINK_CLS
        }).appendTo(toolbar.$top);

        // We need to override the "a" tag action here because it is inside the iframe!
        var inDrive = /^\/drive/;

        var privateData = config.metadataMgr.getPrivateData();
        var origin = privateData.origin;
        var pathname = privateData.pathname;

        var isAnonSF = privateData.newSharedFolder && !privateData.accountName;
        var toMain = inDrive.test(pathname) && !isAnonSF;

        var href = toMain ? origin+'/index.html' : origin+'/drive/';
        var buttonTitle = toMain ? Messages.header_homeTitle : Messages.header_logoTitle;
        var $aTag = $('<a>', {
            href: href,
            title: buttonTitle,
            'class': "cp-toolbar-link-logo",
            'role': 'button',
            'aria-label': buttonTitle
        }).append(UI.getIcon(privateData.app));

        var onClick = function (e) {
            e.preventDefault();
            if (e.ctrlKey) {
                Common.openURL(href);
                return;
            }
            Common.gotoURL(href);
        };

        var onContext = function (e) { e.stopPropagation(); };

        $aTag.click(onClick).contextmenu(onContext);

        $linkContainer.append($aTag);

        return $linkContainer;
    };

    var typing = -1;
    var kickSpinner = function (toolbar, config/*, local*/) {
        if (!toolbar.spinner) { return; }
        if (toolbar.isErrorState) { return; }
        var $spin = toolbar.spinner;

        if (typing === -1) {
            typing = 1;
            $spin.text(Messages.typing);
            $spin.interval = window.setInterval(function () {
                if (toolbar.isErrorState) { return; }
                var dots = Array(typing+1).join('.');
                $spin.text(Messages.typing + dots);
                typing++;
                if (typing > 3) { typing = 0; }
            }, 500);
        }
        var onSynced = function () {
            if ($spin.timeout) { clearTimeout($spin.timeout); }
            $spin.timeout = setTimeout(function () {
                if (toolbar.isErrorState) { return; }
                window.clearInterval($spin.interval);
                typing = -1;
                $spin.text(Messages.saved);
            }, /*local ? 0 :*/ SPINNER_DISAPPEAR_TIME);
        };
        if (config.spinner) {
            var h = function () {
                onSynced();
                try { config.spinner.onSync.unreg(h); } catch (e) { console.error(e); }
            };
            config.spinner.onSync.reg(h);
            return;
        }
        config.sfCommon.whenRealtimeSyncs(onSynced);
    };
    var ks = function (toolbar, config, local) {
        return function () {
            if (toolbar.connected) { kickSpinner(toolbar, config, local); }
        };
    };
    var createSpinner = function (toolbar, config) {
        if (config.readOnly === 1) { return; }
        var $spin = $('<span>', {'class': SPINNER_CLS}).appendTo(toolbar.title);
        $spin.text(Messages.synchronizing);

        if (config.spinner) {
            config.spinner.onPatch.reg(ks(toolbar, config));
            typing = 0;
            setTimeout(function () {
                kickSpinner(toolbar, config);
            });
            return $spin;
        }

        if (config.realtime) {
            config.realtime.onPatch(ks(toolbar, config));
            config.realtime.onMessage(ks(toolbar, config, true));
        }
        // without this, users in read-only mode say 'synchronizing' until they
        // receive a patch.
        typing = 0;
        config.sfCommon.whenRealtimeSyncs(function () {
            kickSpinner(toolbar, config);
        });
        return $spin;
    };

    var createLimit = function (toolbar, config) {
        var $limitIcon = $('<span>', {'class': 'fa fa-exclamation-triangle'});
        var $limit = toolbar.$userAdmin.find('.'+LIMIT_CLS).attr({
            'title': Messages.pinLimitReached
        }).append($limitIcon).hide();

        var priv = config.metadataMgr.getPrivateData();
        var origin = priv.origin;
        var l = document.createElement("a");
        l.href = origin;

        var todo = function (e, overLimit) {
            if (e) { return void console.error("Unable to get the pinned usage", e); }
            if (overLimit) {
                $limit.show().click(function () {
                    if (ApiConfig.allowSubscriptions && Config.upgradeURL) {
                        var msg = Pages.setHTML(h('span'), Messages.pinLimitReachedAlert);
                        $(msg).find('a').attr({
                            target: '_blank',
                            href: Config.upgradeURL,
                        });

                        UI.alert(msg);
                    } else {
                        UI.alert(Messages.pinLimitReachedAlertNoAccounts);
                    }
                });
            }
        };
        Common.isOverPinLimit(todo);

        return $limit;
    };

    var createNewPad = function (toolbar) {
        var $button = Common.createButton('newpad', true);
        var $newPad = UIElements.getEntryFromButton($button);
        toolbar.$drawer.append($newPad);
        return $newPad;
    };

    var createUserAdmin = function (toolbar, config) {
        if (!config.metadataMgr) {
            throw new Error("You must provide a `metadataMgr` to display the user menu");
        }
        var $userAdmin = toolbar.$userAdmin.find('.'+USERADMIN_CLS).show();
        var userMenuCfg = {
            $initBlock: $userAdmin,
            buttonTitle: Messages.userAccountButton,
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
        return $userAdmin;
    };

    var createMaintenance = function (toolbar) {
        var $notif = toolbar.$top.find('.'+MAINTENANCE_CLS);
        var button = h('button.cp-maintenance-wrench.fa.fa-wrench');
        $notif.append(button);


        var m = Broadcast.maintenance;
        $(button).click(function () {
            if (!m || !m.start || !m.end) { return; }
            UI.alert(Messages._getKey('broadcast_maintenance', [
                new Date(m.start).toLocaleString(),
                new Date(m.end).toLocaleString(),
            ]), null, true);
        });

        var to;
        Common.makeUniversal('broadcast', {
            onEvent: function (obj) {
                var cmd = obj.ev;
                if (cmd !== "MAINTENANCE") { return; }
                var data = obj.data;
                if (!data) {
                    return void $notif.hide();
                }
                if ((+new Date()) > data.end) {
                    return void $notif.hide();
                }
                m = data;
                clearTimeout(to);
                to = setTimeout(function () {
                    m = undefined;
                    $notif.hide();
                }, m.end-(+new Date()));
                $notif.css('display', '');
            }
        });

        if (m && m.start && m.end) {
            $notif.css('display', '');
            to = setTimeout(function () {
                m = undefined;
                $notif.hide();
            }, m.end-(+new Date()));
        } else {
            $notif.hide();
        }
    };

    var createNotifications = function (toolbar, config) {
        var $notif = toolbar.$top.find('.'+NOTIFICATIONS_CLS).show();

        var options = [];

        if (Common.isLoggedIn()) {
            options.push({
                tag: 'a',
                attributes: { 'class':'cp-notifications-gotoapp' },
                content: h('p', Messages.openNotificationsApp),
                action: () => {
                    Common.openURL("/notifications/");
                }
            });
            options.push({ tag: 'hr' });
        }

        var metadataMgr = config.metadataMgr;
        var privateData = metadataMgr.getPrivateData();
        if (!privateData.notifications) {
            options.push({
                tag: 'a',
                attributes: { 'class':'cp-notifications-gotoapp cp-notifications-allow' },
                content: h('p', Messages.allowNotifications),
                action: function (ev) {
                    Common.getSframeChannel().query('Q_ASK_NOTIFICATION', null, function (e, allow) {
                        console.error(e, allow);
                        if (!allow) { return; }
                        $(ev.target).closest('li').remove();
                    });

                }
            });
            options.push({ tag: 'hr' });

            var onChange = function () {
                var privateData = metadataMgr.getPrivateData();
                if (!privateData.notifications) { return; }
                $('.cp-notifications-allow').closest('li').remove();
                metadataMgr.off('change', onChange);
            };
            metadataMgr.onChange(onChange);
        }

        var div = h('ul.cp-notifications-container', [
            h('li.cp-notifications-empty', Messages.notifications_empty)
        ]);
        options.push({
            tag: 'div',
            content: div
        });

        var dropdownConfig = {
            text: '', // Button initial text
            options: options, // Entries displayed in the menu
            container: $notif,
            left: true,
            common: Common
        };
        var $newPadBlock = UIElements.createDropdown(dropdownConfig);
        var $button = $newPadBlock.find('button');
        $button.attr('title', Messages.notificationsPage);
        $button.attr('aria-haspopup', 'menu');
        $button.attr("aria-expanded", "false");
        $button.click(function() {
            if ($button.attr("aria-expanded") === "true") {
                $button.attr("aria-expanded", "false");
            } else {
                $button.attr("aria-expanded", "true");
            }
        });
        $button.addClass('fa fa-bell-o cp-notifications-bell');
        $button.addClass('fa fa-bell-o cp-notifications-bell');
        $button.attr('aria-label', Messages.notificationsPage);
        var $n = $button.find('.cp-dropdown-button-title').hide();
        var $empty = $(div).find('.cp-notifications-empty');
        observeChildren($(div));

        var refresh = function () {
            updateUserList(toolbar, config);
            var n = $(div).find('.cp-notification').length;
            $button.removeClass('fa-bell-o').removeClass('fa-bell');
            $n.removeClass('cp-notifications-small');
            if (n === 0) {
                $empty.show();
                $n.hide();
                return void $button.addClass('fa-bell-o');
            }
            if (n > 99) {
                n = '99+';
                $n.addClass('cp-notifications-small');
            }
            $empty.hide();
            $n.text(n).show();
            $button.addClass('fa-bell');
        };

        Common.mailbox.subscribe(['notifications', 'team', 'broadcast', 'reminders', 'supportteam'], {
            onMessage: function (data, el) {
                if (toolbar.$top.hasClass('toolbar-hidden')) {
                    $('.cp-collapsed-notif').css('display', '');
                }
                if (el) {
                    $(div).prepend(el);
                }
                $(el).on('keydown', function (e) {
                    if (![13,32,46].includes(e.which)) { return; }
                    e.stopPropagation();
                    if (e.which === 46) {
                        $('body').find('.cp-dropdown-content li').first().focus();
                        return $(el).find('.cp-notification-dismiss').click();
                    }
                    setTimeout(function () {
                        $(el).find('.cp-notification-content').click();
                    }, 0);
                });
                refresh();
            },
            onViewed: function () {
                refresh();
            }
        });

        return $newPadBlock;
    };

    // Events
    var initClickEvents = function (toolbar) {
        var removeDropdowns =  function () {
            window.setTimeout(function () {
                $('body').find('.cp-dropdown-content').hide();
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
        var w = window;
        $(w).on('click', removeDropdowns);
        $(w).on('click', cancelEditTitle);
        // Click in iframes
        try {
            if (w.$ && w.$('iframe').length) {
                w.$('iframe').each(function (i, el) {
                    $(el.contentWindow).on('click', removeDropdowns);
                    $(el.contentWindow).on('click', cancelEditTitle);
                });
            }
        } catch (e) {
            // empty try catch in case this iframe is problematic
        }
    };

    var getFancyGuestName = function (name, uid) {
        name = UI.getDisplayName(name);
        if (name === Messages.anonymous && uid) {
            var animal = MT.getPseudorandomAnimal(uid);
            if (animal) {
                name = animal + ' ' + name;
            }
        }
        return name;
    };

    // Notifications
    var initNotifications = function (toolbar, config) {
        // Display notifications when users are joining/leaving the session
        var oldUserData;
        if (!config.metadataMgr) { return; }
        var metadataMgr = config.metadataMgr;
        var notify = function(type, name, oldname, uid) {
            if (toolbar.isAlone) { return; }
            // type : 1 (+1 user), 0 (rename existing user), -1 (-1 user)
            if (typeof name === "undefined") { return; }
            if (Config.disableUserlistNotifications) { return; }
            name = getFancyGuestName(name, uid);
            oldname = getFancyGuestName(oldname, uid);

            switch(type) {
                case 1:
                    UI.log(Messages._getKey("notifyJoined", [name]));
                    break;
                case 0:
                    oldname = (!oldname) ? Messages.anonymous : oldname;
                    UI.log(Messages._getKey("notifyRenamed", [oldname, name]));
                    break;
                case -1:
                    UI.log(Messages._getKey("notifyLeft", [name]));
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

        var joined = false;
        metadataMgr.onChange(function () {
            var newdata = metadataMgr.getMetadata().users;
            var netfluxIds = Object.keys(newdata);
            var userNetfluxId = metadataMgr.getNetfluxId();
            // Notify for disconnected users
            if (typeof oldUserData !== "undefined") {
                for (var u in oldUserData) {
                    // if a user's uid is still present after having left, don't notify
                    if (netfluxIds.indexOf(u) === -1) {
                        var temp = JSON.parse(JSON.stringify(oldUserData[u]));
                        delete oldUserData[u];
                        if (temp && newdata[userNetfluxId] && temp.uid === newdata[userNetfluxId].uid) { return; }
                        if (userPresent(u, temp, newdata || oldUserData) < 1) {
                            notify(-1, temp.name, undefined, temp.uid);
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
                if (joined && k !== userNetfluxId && netfluxIds.indexOf(k) !== -1) {
                    if (typeof oldUserData[k] === "undefined") {
                        // if the same uid is already present in the userdata, don't notify
                        if (!userPresent(k, newdata[k], oldUserData)) {
                            notify(1, newdata[k].name, undefined, newdata[k].uid);
                        }
                    } else if (oldUserData[k].name !== newdata[k].name) {
                        notify(0, newdata[k].name, oldUserData[k].name, newdata[k].uid);
                    }
                }
            }
            joined = true;
            oldUserData = JSON.parse(JSON.stringify(newdata));
        });
    };



    // Main

    Bar.create = function (cfg) {
        var config = cfg || {};
        Common = config.sfCommon;
        config.readOnly = (typeof config.readOnly !== "undefined") ? (config.readOnly ? 1 : 0) : -1;
        config.displayed = config.displayed || [];

        var toolbar = {};

        toolbar.connected = false;
        toolbar.firstConnection = true;

        toolbar.badges = Common.makeUniversal('badge');

        if (Array.isArray(cfg.displayed) && cfg.displayed.includes('pad')) {
            cfg.addFileMenu = true;
        }

        var $toolbar = toolbar.$toolbar = createRealtimeToolbar(config);
        toolbar.$bottom = $toolbar.find('.'+Bar.constants.bottom);
        toolbar.$bottomL = $toolbar.find('.'+Bar.constants.bottomL);
        toolbar.$bottomM = $toolbar.find('.'+Bar.constants.bottomM);
        toolbar.$bottomR = $toolbar.find('.'+Bar.constants.bottomR);
        toolbar.$leftside = $toolbar.find('.'+Bar.constants.leftside);
        toolbar.$rightside = $toolbar.find('.'+Bar.constants.rightside);
        toolbar.$file = $toolbar.find('.'+Bar.constants.file);
        toolbar.$drawer = $toolbar.find('.'+Bar.constants.drawer);
        toolbar.$top = $toolbar.find('.'+Bar.constants.top);
        toolbar.$history = $toolbar.find('.'+Bar.constants.history);
        toolbar.$user = $toolbar.find('.'+Bar.constants.userAdmin);

        observeChildren(toolbar.$drawer, true);
        observeChildren(toolbar.$bottomL);
        observeChildren(toolbar.$bottomM);
        observeChildren(toolbar.$bottomR);
        observeChildren(toolbar.$top);
        observeChildren(toolbar.$user);
        if (config.$contentContainer) {
            observeChildren(config.$contentContainer);
        }

        toolbar.$userAdmin = $toolbar.find('.'+Bar.constants.userAdmin);

        // Create the subelements
        var tb = {};
        tb['userlist'] = createUserList;
        tb['collapse'] = createCollapse;
        tb['chat'] = createChat;
        tb['share'] = createShare;
        tb['access'] = createAccess;
        tb['fileshare'] = createFileShare;
        tb['title'] = createTitle;
        tb['pageTitle'] = createPageTitle;
        //tb['request'] = createRequest;
        tb['spinner'] = createSpinner;
        tb['limit'] = createLimit; // TODO
        tb['newpad'] = createNewPad;
        tb['useradmin'] = createUserAdmin;
        tb['notifications'] = createNotifications;
        tb['maintenance'] = createMaintenance;

        tb['pad'] = function () {
            toolbar.$file.show();
            toolbar.addElement([
                'chat',
                'collapse',
                'userlist', 'title', 'useradmin', 'spinner',
                'newpad', 'share', 'access', 'limit',
                'notifications'
            ], {});
        };

        var checkSize = function () {
            toolbar.$bottom.removeClass('cp-toolbar-small');
            var w = $(window).width();
            var size = toolbar.$bottomL.width() + toolbar.$bottomM.width() +
                       toolbar.$bottomR.width();
            if (size > w) {
                toolbar.$bottom.addClass('cp-toolbar-small');
            }
        };

        $(window).on('resize', checkSize);

        var addElement = toolbar.addElement = function (arr, additionalCfg, init) {
            if (typeof additionalCfg === "object") { $.extend(true, config, additionalCfg); }
            arr.forEach(function (el) {
                if (typeof el !== "string" || !el.trim()) { return; }
                if (typeof tb[el] === "function") {
                    if (!init && config.displayed.indexOf(el) !== -1) { return; } // Already done
                    if (!init) { config.displayed.push(el); }
                    toolbar[el] = tb[el](toolbar, config);
                }
            });
            checkSize();
        };

        addElement(config.displayed, {}, true);
        addElement(['maintenance'], {}, true);


        toolbar['linkToMain'] = createLinkToMain(toolbar, config);
        toolbar['skipLink'] = Bar.createSkipLink(toolbar, config);

        if (!config.realtime) { toolbar.connected = true; }

        initClickEvents(toolbar, config);
        initNotifications(toolbar, config);

        var failed = toolbar.failed = function (hideUserList) {
            toolbar.connected = false;

            if (toolbar.spinner) {
                toolbar.spinner.text(Messages.disconnected);
            }
            if (hideUserList) {
                updateUserList(toolbar, config, true);
            }
            //checkLag(toolbar, config);
        };
        toolbar.initializing = function (/*userId*/) {
            if (toolbar.history) { return; }
            toolbar.connected = false;
            if (toolbar.spinner) {
                toolbar.spinner.text(Messages.initializing);
            }
        };
        toolbar.reconnecting = function (/*userId*/) {
            if (toolbar.history) { return; }
            toolbar.connected = false;
            if (toolbar.spinner) {
                var state = -1;
                var interval = window.setInterval(function () {
                    if (toolbar.connected) { clearInterval(interval); }
                    var dots = Array(state+1).join('.');
                    toolbar.spinner.text(Messages.reconnecting + dots);
                    if (++state > 3) { state = 0; }
                }, 500);
                toolbar.spinner.text(Messages.reconnecting);
            }
        };
        toolbar.ready = function () {
            toolbar.connected = true;
            kickSpinner(toolbar, config);
        };

        toolbar.errorState = function (state, error) {
            toolbar.isErrorState = state;
            if (state) { toolbar.connected = false; }
            if (toolbar.spinner) {
                if (!state) {
                    return void kickSpinner(toolbar, config);
                }
                var txt = Messages._getKey('errorState', [error]);
                toolbar.spinner.text(txt);
            }
        };

        // When the pad is moved to the trash (forget button)
        toolbar.forgotten = function (/*userId*/) {
            toolbar.connected = false;
            if (toolbar.spinner) {
                toolbar.spinner.text(Messages.forgotten);
            }
        };

        // When the pad is deleted from the server
        toolbar.deleted = function (/*userId*/) {
            toolbar.isErrorState = true;
            toolbar.connected = false;
            toolbar.isDeleted = true;
            updateUserList(toolbar, config, true);
            toolbar.title.toggleClass('cp-toolbar-unsync', true); // "read only" next to the title
            if (toolbar.spinner) {
                toolbar.spinner.text(Messages.deletedFromServer);
            }
        };

        // Show user colors in the userlist only if the app is compatible and if the user
        // wants to see the cursors
        toolbar.showColors = function () {
            if (!config.metadataMgr) { return; }
            var privateData = config.metadataMgr.getPrivateData();
            var show = Util.find(privateData, ['settings', 'general', 'cursor', 'show']);
            if (show === false) { return; }
            showColors = true;
        };

        // If we had to create a new chainpad instance, reset the one used in the toolbar
        toolbar.resetChainpad = function (chainpad) {
            if (config.readOnly === 1) { return; }
            if (config.realtime !== chainpad) {
                config.realtime = chainpad;
                config.realtime.onPatch(ks(toolbar, config));
                config.realtime.onMessage(ks(toolbar, config, true));
            }
        };

        toolbar.setSnapshot = function (bool) {
            toolbar.history = bool;
            toolbar.title.toggleClass('cp-toolbar-unsync', bool);
            if (bool && toolbar.spinner) {
                toolbar.spinner.text(Messages.snaphot_title);
            } else {
                kickSpinner(toolbar, config);
            }
        };
        toolbar.setHistory = function (bool) {
            toolbar.history = bool;
            toolbar.title.toggleClass('cp-toolbar-unsync', bool);
            if (bool && toolbar.spinner) {
                toolbar.spinner.text(Messages.historyText);
            } else {
                kickSpinner(toolbar, config);
            }
        };

        toolbar.offline = function (bool) {
            toolbar.connected = !bool; // Can't edit title
            toolbar.history = bool; // Stop "Initializing" state
            toolbar.isErrorState = bool; // Stop kickSpinner
            toolbar.title.toggleClass('cp-toolbar-unsync', bool); // "read only" next to the title
            if (bool && toolbar.spinner) {
                toolbar.spinner.text(Messages.Offline);
            } else {
                kickSpinner(toolbar, config);
            }
        };

        // disable notification, userlist and chat
        toolbar.alone = function () {
            toolbar.userlist.hide();
            toolbar.chat.hide();
            $('.cp-toolbar-userlist-drawer').remove();
            $('.cp-toolbar-chat-drawer').remove();
            toolbar.isAlone = true;
        };

        // On log out, remove permanently the realtime elements of the toolbar
        Common.onLogout(function () {
            failed();
            if (toolbar.useradmin) { toolbar.useradmin.hide(); }
            if (toolbar.userlist) { toolbar.userlist.hide(); }
        });

        return toolbar;
    };

    return Bar;
});
