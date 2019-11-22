define([
    'jquery',
    '/customize/application_config.js',
    '/api/config',
    '/common/common-ui-elements.js',
    '/common/common-interface.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/common/common-feedback.js',
    '/common/hyperscript.js',
    '/common/messenger-ui.js',
    '/customize/messages.js',
], function ($, Config, ApiConfig, UIElements, UI, Hash, Util, Feedback, h,
MessengerUI, Messages) {
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

    // Top parts
    var USER_CLS = Bar.constants.userAdmin = "cp-toolbar-user";
    var SPINNER_CLS = Bar.constants.spinner = 'cp-toolbar-spinner';
    var LIMIT_CLS = Bar.constants.limit = 'cp-toolbar-limit';
    var TITLE_CLS = Bar.constants.title = "cp-toolbar-title";
    var NEWPAD_CLS = Bar.constants.newpad = "cp-toolbar-new";
    var LINK_CLS = Bar.constants.link = "cp-toolbar-link";
    var NOTIFICATIONS_CLS = Bar.constants.user = 'cp-toolbar-notifications';

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

        var isEmbed = Bar.isEmbed = config.metadataMgr.getPrivateData().isEmbed;
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
        $('<span>', {'class': NOTIFICATIONS_CLS + ' cp-dropdown-container'}).hide().appendTo($userContainer);
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
    var updateUserList = function (toolbar, config) {
        if (!config.displayed || config.displayed.indexOf('userlist') === -1) { return; }
        // Make sure the elements are displayed
        var $userButtons = toolbar.userlist;
        var $userlistContent = toolbar.userlistContent;

        var metadataMgr = config.metadataMgr;
        var online = metadataMgr.isConnected();
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

        if (!online) {
            $('<em>').text(Messages.userlist_offline).appendTo($editUsersList);
            numberOfEditUsers = '?';
            numberOfViewUsers = '?';
        }

        // Update the buttons
        var fa_editusers = '<span class="fa fa-users"></span>';
        var fa_viewusers = '<span class="fa fa-eye"></span>';
        var $spansmall = $('<span>').html(fa_editusers + ' ' + numberOfEditUsers + '&nbsp;&nbsp; ' + fa_viewusers + ' ' + numberOfViewUsers);
        $userButtons.find('.cp-dropdown-button-title').html('').append($spansmall);

        if (!online) { return; }
        // Display the userlist

        // Editors
        var pendingFriends = Common.getPendingFriends(); // Friend requests sent
        var friendRequests = Common.getFriendRequests(); // Friend requests received
        var friendTo = +new Date() - (2 * 24 * 3600 * 1000);
        editUsersNames.forEach(function (data) {
            var name = data.name || Messages.anonymous;
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
                if (pendingFriends[data.curvePublic] && pendingFriends[data.curvePublic] > friendTo) {
                    $('<button>', {
                        'class': 'fa fa-hourglass-half cp-toolbar-userlist-button',
                        'title': Messages.profile_friendRequestSent
                    }).appendTo($nameSpan);
                } else if (friendRequests[data.curvePublic]) {
                    $('<button>', {
                        'class': 'fa fa-bell cp-toolbar-userlist-button',
                        'title': Messages._getKey('friendRequest_received', [name]),
                    }).appendTo($nameSpan).click(function (e) {
                        e.stopPropagation();
                        UIElements.displayFriendRequestModal(Common, friendRequests[data.curvePublic]);
                    });

                } else {
                    $('<button>', {
                        'class': 'fa fa-user-plus cp-toolbar-userlist-button',
                        'title': Messages._getKey('userlist_addAsFriendTitle', [
                            name
                        ])
                    }).appendTo($nameSpan).click(function (e) {
                        e.stopPropagation();
                        Common.sendFriendRequest(data, function (err, obj) {
                            if (err || (obj && obj.error)) { return void console.error(err || obj.error); }
                        });
                    });
                }
            } else if (Common.isLoggedIn() && data.curvePublic && friends[data.curvePublic]) {
                $('<button>', {
                    'class': 'fa fa-comments-o cp-toolbar-userlist-button',
                    'title': Messages.userlist_chat
                }).appendTo($nameSpan).click(function (e) {
                    e.stopPropagation();
                    Common.openURL('/contacts/');
                });
            }
            if (data.profile) {
                $span.addClass('cp-userlist-clickable');
                $span.click(function () {
                    window.open(origin+'/profile/#' + data.profile);
                });
            }
            if (data.avatar && UIElements.getAvatar(data.avatar)) {
                $span.append(UIElements.getAvatar(data.avatar));
                $span.append($rightCol);
            } else {
                Common.displayAvatar($span, data.avatar, name, function ($img) {
                    if (data.avatar && $img && $img.length) {
                        UIElements.setAvatar(data.avatar, $img[0].outerHTML);
                    }
                    $span.append($rightCol);
                });
            }
            $span.data('uid', data.uid);
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

        var hide = function () {
            $content.hide();
            $button.removeClass('cp-toolbar-button-active');
        };
        var show = function () {
            if (Bar.isEmbed) { $content.hide(); return; }
            $content.show();
            $button.addClass('cp-toolbar-button-active');
        };
        $closeIcon.click(function () {
            Common.setAttribute(['toolbar', 'userlist-drawer'], false);
            hide();
        });
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
        if (Config.availablePadTypes.indexOf('contacts') === -1) { return; }
        var $content = $('<div>', {'class': 'cp-toolbar-chat-drawer'});
        $content.on('drop dragover', function (e) {
            e.preventDefault();
            e.stopPropagation();
        });
        var $closeIcon = $('<span>', {"class": "fa fa-window-close cp-toolbar-chat-drawer-close"}).appendTo($content);
        //$('<h2>').text(Messages.users).appendTo($content);
        //$('<p>', {'class': USERLIST_CLS}).appendTo($content);

        toolbar.chatContent = $content;

        var $container = $('<span>', {id: 'cp-toolbar-chat-drawer-open', title: Messages.chatButton});

        var $button = $('<button>', {'class': 'fa fa-comments'}).appendTo($container);
        $('<span>',{'class': 'cp-dropdown-button-title'}).appendTo($button);

        toolbar.$leftside.prepend($container);

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
        $closeIcon.click(function () {
            Common.setAttribute(['toolbar', 'chat-drawer'], false);
            hide(true);
        });
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
            throw new Error("You must provide a `metadataMgr` to display the userlist");
        }

        var $shareBlock = $('<button>', {
            'class': 'fa fa-shhare-alt cp-toolbar-share-button',
            title: Messages.shareButton
        });
        Common.getSframeChannel().event('EV_SHARE_OPEN', {
            hidden: true
        });
        $shareBlock.click(function () {
            var title = (config.title && config.title.getTitle && config.title.getTitle())
                        || (config.title && config.title.defaultName)
                        || "";
            Common.getSframeChannel().event('EV_SHARE_OPEN', {
                title: title
            });
        });

        toolbar.$leftside.append($shareBlock);
        toolbar.share = $shareBlock;

        return "Loading share button";
    };

    var createFileShare = function (toolbar, config) {
        if (!config.metadataMgr) {
            throw new Error("You must provide a `metadataMgr` to display the userlist");
        }

        var $shareBlock = $('<button>', {
            'class': 'fa fa-shhare-alt cp-toolbar-share-button',
            title: Messages.shareButton
        });
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

        toolbar.$leftside.append($shareBlock);
        return $shareBlock;
    };

    var createRequest = function (toolbar, config) {
        if (!config.metadataMgr) {
            throw new Error("You must provide a `metadataMgr` to display the request access button");
        }

        // We can only requets more access if we're in read-only mode
        if (config.readOnly !== 1) { return; }

        var $requestBlock = $('<button>', {
            'class': 'fa fa-lock cp-toolbar-share-button',
            title: Messages.requestEdit_button
        }).hide();

        // If we have access to the owner's mailbox, display the button and enable it
        // false => check if we can contact the owner
        // true ==> send the request
        Common.getSframeChannel().query('Q_REQUEST_ACCESS', false, function (err, obj) {
            if (obj && obj.state) {
                var locked = false;
                $requestBlock.show().click(function () {
                    if (locked) { return; }
                    locked = true;
                    Common.getSframeChannel().query('Q_REQUEST_ACCESS', true, function (err, obj) {
                        if (obj && obj.state) {
                            UI.log(Messages.requestEdit_sent);
                            $requestBlock.hide();
                        } else {
                            locked = false;
                        }
                    });
                });
            }
        });


        toolbar.$leftside.append($requestBlock);
        toolbar.request = $requestBlock;

        return $requestBlock;
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
            return $titleContainer;
        }
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

    var createUnpinnedWarning0 = function (toolbar, config) {
        //if (true) { return; } // stub this call since it won't make it into the next release
        if (Common.isLoggedIn()) { return; }
        var pd = config.metadataMgr.getPrivateData();
        var o = pd.origin;
        var cid = pd.channel;
        Common.sendAnonRpcMsg('IS_CHANNEL_PINNED', cid, function (x) {
            if (x.error || !Array.isArray(x.response)) { return void console.log(x); }
            if (x.response[0] === true) {
                $('.cp-pad-not-pinned').remove();
                return;
            }

            if (typeof(ApiConfig.inactiveTime) !== 'number') {
                $('.cp-pad-not-pinned').remove();
                return;
            }

            if ($('.cp-pad-not-pinned').length) { return; }
            var pnpTitle = Messages._getKey('padNotPinnedVariable', ['','','','', ApiConfig.inactiveTime]);
            var pnpMsg = Messages._getKey('padNotPinnedVariable', [
                '<a href="' + o + '/login" class="cp-pnp-login" target="blank" title>',
                '</a>',
                '<a href="' + o + '/register" class="cp-pnp-register" target="blank" title>',
                '</a>',
                ApiConfig.inactiveTime
            ]);
            var $msg = $('<span>', {
                'class': 'cp-pad-not-pinned'
            }).append([
                $('<span>', {'class': 'fa fa-exclamation-triangle', 'title': pnpTitle}),
                $('<span>', {'class': 'cp-pnp-msg'}).append(pnpMsg)
            ]);
            $msg.find('a.cp-pnp-login').click(function (ev) {
                ev.preventDefault();
                Common.setLoginRedirect(function () {
                    window.parent.location = o + '/login/';
                });
            });
            $msg.find('a.cp-pnp-register').click(function (ev) {
                ev.preventDefault();
                Common.setLoginRedirect(function () {
                    window.parent.location = o + '/register/';
                });
            });
            $('.cp-toolbar-top').append($msg);
            //UI.addTooltips();
        });
    };

    var createUnpinnedWarning = function (toolbar, config) {
        config.metadataMgr.onChange(function () {
            createUnpinnedWarning0(toolbar, config);
        });
        createUnpinnedWarning0(toolbar, config);
    };

    var createPageTitle = function (toolbar, config) {
        if (!config.pageTitle) { return; }
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
            window.parent.location = href;
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
        config.sfCommon.whenRealtimeSyncs(onSynced);
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
                var key = 'pinLimitReachedAlert';
                if (!ApiConfig.allowSubscriptions) {
                    key = 'pinLimitReachedAlertNoAccounts';
                }
                $limit.show().click(function () {
                    UI.alert(Messages._getKey(key, [encodeURIComponent(l.hostname)]), null, true);
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
            if (!Common.isLoggedIn() && Config.registeredOnlyTypes &&
                Config.registeredOnlyTypes.indexOf(p) !== -1) { return; }
            pads_options.push({
                tag: 'a',
                attributes: {
                    'target': '_blank',
                    'href': origin + '/' + p + '/',
                },
                content: $('<div>').append(UI.getIcon(p)).html() + Messages.type[p]
            });
        });
        pads_options.push({
            tag: 'a',
            attributes: {
                id: 'cp-app-toolbar-creation-advanced',
                href: origin
            },
            content: '<span class="fa fa-plus-circle"></span> ' + Messages.creation_appMenuName
        });
        var dropdownConfig = {
            text: '', // Button initial text
            options: pads_options, // Entries displayed in the menu
            container: $newPad,
            left: true,
            feedback: /drive/.test(window.location.pathname)?
                'DRIVE_NEWPAD': 'NEWPAD',
            common: Common
        };
        var $newPadBlock = UIElements.createDropdown(dropdownConfig);
        $newPadBlock.find('button').attr('title', Messages.newButtonTitle);
        $newPadBlock.find('button').addClass('fa fa-th');
        $newPadBlock.find('#cp-app-toolbar-creation-advanced').click(function (e) {
            e.preventDefault();
            Common.createNewPadModal();
        });
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
        /*if (config.displayed.indexOf('userlist') !== -1) {
            userMenuCfg.displayChangeName = 0;
        }*/
        Common.createUserAdminMenu(userMenuCfg);
        $userAdmin.find('> button').attr('title', Messages.userAccountButton);

        var $userButton = toolbar.$userNameButton = $userAdmin.find('a.' + USERBUTTON_CLS);
        $userButton.click(function (e) {
            e.preventDefault();
            e.stopPropagation();
            var myData = metadataMgr.getUserData();
            var lastName = myData.name;
            UI.prompt(Messages.changeNamePrompt, lastName || '', function (newName) {
                if (newName === null && typeof(lastName) === "string") { return; }
                if (newName === null) { newName = ''; }
                else { Feedback.send('NAME_CHANGED'); }
                setDisplayName(newName);
            });
        });

        return $userAdmin;
    };

    var createNotifications = function (toolbar, config) {
        var $notif = toolbar.$top.find('.'+NOTIFICATIONS_CLS).show();
        var openNotifsApp = h('div.cp-notifications-gotoapp', h('p', Messages.openNotificationsApp || "Open notifications App"));
        $(openNotifsApp).click(function () {
            Common.openURL("/notifications/");
        });
        var div = h('div.cp-notifications-container', [
            h('div.cp-notifications-empty', Messages.notifications_empty)
        ]);
        var pads_options = [div];
        if (Common.isLoggedIn()) {
            pads_options.unshift(h("hr"));
            pads_options.unshift(openNotifsApp);
        }
        var dropdownConfig = {
            text: '', // Button initial text
            options: pads_options, // Entries displayed in the menu
            container: $notif,
            left: true,
            common: Common
        };
        var $newPadBlock = UIElements.createDropdown(dropdownConfig);
        var $button = $newPadBlock.find('button');
        $button.attr('title', Messages.notifications_empty);
        $button.addClass('fa fa-bell-o');
        var $n = $button.find('.cp-dropdown-button-title').hide();
        var $empty = $(div).find('.cp-notifications-empty');

        var refresh = function () {
            updateUserList(toolbar, config);
            var n = $(div).find('.cp-notification').length;
            $button.removeClass('fa-bell-o').removeClass('fa-bell');
            $n.removeClass('cp-notifications-small');
            if (n === 0) {
                $button.attr('title', Messages.notifications_empty);
                $empty.show();
                $n.hide();
                return void $button.addClass('fa-bell-o');
            }
            if (n > 99) {
                n = '99+';
                $n.addClass('cp-notifications-small');
            }
            $button.attr('title', Messages.notifications_title);
            $empty.hide();
            $n.text(n).show();
            $button.addClass('fa-bell');
        };

        Common.mailbox.subscribe(['notifications'], {
            onMessage: function (data, el) {
                if (el) {
                    $(div).prepend(el);
                }
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

    // Notifications
    var initNotifications = function (toolbar, config) {
        // Display notifications when users are joining/leaving the session
        var oldUserData;
        if (!config.metadataMgr) { return; }
        var metadataMgr = config.metadataMgr;
        var notify = function(type, name, oldname) {
            // type : 1 (+1 user), 0 (rename existing user), -1 (-1 user)
            if (typeof name === "undefined") { return; }
            name = name || Messages.anonymous;
            if (Config.disableUserlistNotifications) { return; }
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
                if (joined && k !== userNetfluxId && netfluxIds.indexOf(k) !== -1) {
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
        tb['chat'] = createChat;
        tb['share'] = createShare;
        tb['fileshare'] = createFileShare;
        tb['title'] = createTitle;
        tb['pageTitle'] = createPageTitle;
        tb['request'] = createRequest;
        tb['lag'] = $.noop;
        tb['spinner'] = createSpinner;
        tb['state'] = $.noop;
        tb['limit'] = createLimit; // TODO
        tb['upgrade'] = $.noop;
        tb['newpad'] = createNewPad;
        tb['useradmin'] = createUserAdmin;
        tb['unpinnedWarning'] = createUnpinnedWarning;
        tb['notifications'] = createNotifications;

        var addElement = toolbar.addElement = function (arr, additionalCfg, init) {
            if (typeof additionalCfg === "object") { $.extend(true, config, additionalCfg); }
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
        toolbar.initializing = function (/*userId*/) {
            toolbar.connected = false;
            if (toolbar.spinner) {
                toolbar.spinner.text(Messages.initializing);
            }
        };
        toolbar.reconnecting = function (/*userId*/) {
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
            updateUserList(toolbar, config);
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
