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
    var TOOLBAR_CLS = Bar.constants.toolbar = 'cryptpad-toolbar';
    var TOP_CLS = Bar.constants.top = 'cryptpad-toolbar-top';
    var LEFTSIDE_CLS = Bar.constants.leftside = 'cryptpad-toolbar-leftside';
    var RIGHTSIDE_CLS = Bar.constants.rightside = 'cryptpad-toolbar-rightside';
    var DRAWER_CLS = Bar.constants.drawer = 'drawer-content';
    var HISTORY_CLS = Bar.constants.history = 'cryptpad-toolbar-history';

    // Userlist
    var USERLIST_CLS = Bar.constants.userlist = "cryptpad-dropdown-users";
    var EDITSHARE_CLS = Bar.constants.editShare = "cryptpad-dropdown-editShare";
    var VIEWSHARE_CLS = Bar.constants.viewShare = "cryptpad-dropdown-viewShare";
    var SHARE_CLS = Bar.constants.viewShare = "cryptpad-dropdown-share";

    // Top parts
    var USER_CLS = Bar.constants.userAdmin = "cryptpad-user";
    var SPINNER_CLS = Bar.constants.spinner = 'cryptpad-spinner';
    var LIMIT_CLS = Bar.constants.lag = 'cryptpad-limit';
    var TITLE_CLS = Bar.constants.title = "cryptpad-title";
    var NEWPAD_CLS = Bar.constants.newpad = "cryptpad-new";

    // User admin menu
    var USERADMIN_CLS = Bar.constants.user = 'cryptpad-user-dropdown';
    var USERNAME_CLS = Bar.constants.username = 'cryptpad-toolbar-username';
    var READONLY_CLS = Bar.constants.readonly = 'cryptpad-readonly';
    var USERBUTTON_CLS = Bar.constants.changeUsername = "cryptpad-change-username";

    // Create the toolbar element

    var uid = function () {
        return 'cryptpad-uid-' + String(Math.random()).substring(2);
    };

    var createRealtimeToolbar = function (config) {
        if (!config.$container) { return; }
        var $container = config.$container;
        var $toolbar = $('<div>', {
            'class': TOOLBAR_CLS,
            id: uid(),
        });

        // TODO iframe
        // var parsed = Cryptpad.parsePadUrl(window.location.href);
        var parsed = { type:'pad' };
        if (typeof parsed.type === "string") {
            config.$container.parents('body').addClass('app-' + parsed.type);
        }

        var $topContainer = $('<div>', {'class': TOP_CLS});
        $('<span>', {'class': 'filler'}).appendTo($topContainer);
        var $userContainer = $('<span>', {
            'class': USER_CLS
        }).appendTo($topContainer);
        $('<span>', {'class': LIMIT_CLS}).hide().appendTo($userContainer);
        $('<span>', {'class': NEWPAD_CLS + ' dropdown-bar'}).hide().appendTo($userContainer);
        $('<span>', {'class': USERADMIN_CLS + ' dropdown-bar'}).hide().appendTo($userContainer);

        $toolbar.append($topContainer)
        .append($('<div>', {'class': LEFTSIDE_CLS}))
        .append($('<div>', {'class': RIGHTSIDE_CLS}))
        .append($('<div>', {'class': HISTORY_CLS}));

        // TODO
        /*
        var $rightside = $toolbar.find('.'+RIGHTSIDE_CLS);
        if (!config.hideDrawer) {
            var $drawerContent = $('<div>', {
                'class': DRAWER_CLS,// + ' dropdown-bar-content cryptpad-dropdown'
                'tabindex': 1
            }).appendTo($rightside).hide();
            var $drawer = Cryptpad.createButton('more', true).appendTo($rightside);
            $drawer.click(function () {
                $drawerContent.toggle();
                $drawer.removeClass('active');
                if ($drawerContent.is(':visible')) {
                    $drawer.addClass('active');
                    $drawerContent.focus();
                }
            });
            var onBlur = function (e) {
                if (e.relatedTarget) {
                    if ($(e.relatedTarget).is('.drawer-button')) { return; }
                    if ($(e.relatedTarget).parents('.'+DRAWER_CLS).length) {
                        $(e.relatedTarget).blur(onBlur);
                        return;
                    }
                }
                $drawer.removeClass('active');
                $drawerContent.hide();
            };
            $drawerContent.blur(onBlur);
        }*/

        // The 'notitle' class removes the line added for the title with a small screen
        if (!config.title || typeof config.title !== "object") {
            $toolbar.addClass('notitle');
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
        var userData = config.userList.getMetadata().users;

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
    var arrayIntersect = function(a, b) {
        return $.grep(a, function(i) {
            return $.inArray(i, b) > -1;
        });
    };
    var updateDisplayName = function (toolbar, config) {
        // Change username in useradmin dropdown
        var name = Cryptpad.getDisplayName();
        if (config.displayed.indexOf('useradmin') !== -1) {
            var $userAdminElement = toolbar.$userAdmin;
            var $userElement = $userAdminElement.find('.' + USERNAME_CLS);
            $userElement.show();
            if (config.readOnly === 1) {
                $userElement.addClass(READONLY_CLS).text(Messages.readonly);
            }
            else {
                if (!name) {
                    name = Messages.anonymous;
                }
                $userElement.removeClass(READONLY_CLS).text(name);
            }
        }
    };
    var avatars = {};
    var updateUserList = function (toolbar, config) {
        // Make sure the elements are displayed
        var $userButtons = toolbar.userlist;
        var $userlistContent = toolbar.userlistContent;

        var metadataMgr = config.userList;
        var userData = metadataMgr.getMetadata().users;
        var viewers = metadataMgr.getViewers();

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

        var $editUsersList = $('<div>', {'class': 'userlist-others'});

        // Editors
        // TODO iframe enable friends
        //var pendingFriends = Cryptpad.getPendingInvites();
        editUsersNames.forEach(function (data) {
            var name = data.name || Messages.anonymous;
            var $span = $('<span>', {'class': 'avatar'});
            var $rightCol = $('<span>', {'class': 'right-col'});
            var $nameSpan = $('<span>', {'class': 'name'}).text(name).appendTo($rightCol);
            //var proxy = Cryptpad.getProxy();
            //var isMe = data.curvePublic === proxy.curvePublic;

            /*if (Cryptpad.isLoggedIn() && data.curvePublic) {
                if (isMe) {
                    $span.attr('title', Messages._getKey('userlist_thisIsYou', [
                        name
                    ]));
                    $nameSpan.text(name);
                } else if (!proxy.friends || !proxy.friends[data.curvePublic]) {
                    if (pendingFriends.indexOf(data.netfluxId) !== -1) {
                        $('<span>', {'class': 'friend'}).text(Messages.userlist_pending)
                            .appendTo($rightCol);
                    } else {
                        $('<span>', {
                            'class': 'fa fa-user-plus friend',
                            'title': Messages._getKey('userlist_addAsFriendTitle', [
                                name
                            ])
                        }).appendTo($rightCol).click(function (e) {
                            e.stopPropagation();
                            Cryptpad.inviteFromUserlist(Cryptpad, data.netfluxId);
                        });
                    }
                }
            }*/
            if (data.profile) {
                $span.addClass('clickable');
                $span.click(function () {
                    window.open('/profile/#' + data.profile);
                });
            }
            if (data.avatar && avatars[data.avatar]) {
                $span.append(avatars[data.avatar]);
                $span.append($rightCol);
            } else {
                Cryptpad.displayAvatar($span, data.avatar, name, function ($img) {
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
            var viewText = '<div class="viewer">';
            var viewerText = numberOfViewUsers !== 1 ? Messages.viewers : Messages.viewer;
            viewText += numberOfViewUsers + ' ' + viewerText + '</div>';
            $editUsers.append(viewText);
        }

        // Update the buttons
        var fa_editusers = '<span class="fa fa-users"></span>';
        var fa_viewusers = '<span class="fa fa-eye"></span>';
        var $spansmall = $('<span>').html(fa_editusers + ' ' + numberOfEditUsers + '&nbsp;&nbsp; ' + fa_viewusers + ' ' + numberOfViewUsers);
        $userButtons.find('.buttonTitle').html('').append($spansmall);

        updateDisplayName(toolbar, config);
    };

    var initUserList = function (toolbar, config) {
        // TODO clean comments
        if (config.userList) { /* && config.userList.list && config.userList.userNetfluxId) {*/
            //var userList = config.userList.list;
            //userList.change.push
            var metadataMgr = config.userList;
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
        if (!config.userList) { /* || !config.userList.list ||
            !config.userList.data || !config.userList.userNetfluxId) {*/
            throw new Error("You must provide a `userList` object to display the userlist");
        }
        var $content = $('<div>', {'class': 'userlist-drawer'});
        $content.on('drop dragover', function (e) {
            e.preventDefault();
            e.stopPropagation();
        });
        var $closeIcon = $('<span>', {"class": "fa fa-window-close close"}).appendTo($content);
        $('<h2>').text(Messages.users).appendTo($content);
        $('<p>', {'class': USERLIST_CLS}).appendTo($content);

        toolbar.userlistContent = $content;

        var $container = $('<span>', {id: 'userButtons', title: Messages.userListButton});

        var $button = $('<button>').appendTo($container);
        $('<span>',{'class': 'buttonTitle'}).appendTo($button);

        toolbar.$leftside.prepend($container);

        if (config.$contentContainer) {
            config.$contentContainer.prepend($content);
        }

        var $ck = config.$container.find('.cke_toolbox_main');
        var mobile = $('body').width() <= 600;
        var hide = function () {
            $content.hide();
            $button.removeClass('active');
            $ck.css({
                'padding-left': '',
            });
        };
        var show = function () {
            $content.show();
            if (mobile) {
                $ck.hide();
            }
            $button.addClass('active');
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
            Cryptpad.setAttribute('userlist-drawer', false);
            hide();
        });
        $button.click(function () {
            var visible = $content.is(':visible');
            if (visible) { hide(); }
            else { show(); }
            visible = !visible;
            // TODO iframe
            //Cryptpad.setAttribute('userlist-drawer', visible);
            //Cryptpad.feedback(visible?'USERLIST_SHOW': 'USERLIST_HIDE');
        });

        // TODO iframe
        /*Cryptpad.getAttribute('userlist-drawer', function (err, val) {
            if (val === false || mobile) { return void hide(); }
            show();
        });*/

        return $container;
    };

    var createShare = function (toolbar, config) {
        var secret = Cryptpad.find(config, ['share', 'secret']);
        var channel = Cryptpad.find(config, ['share', 'channel']);
        if (!secret || !channel) {
            throw new Error("Unable to display the share button: share.secret and share.channel required");
        }
        Cryptpad.getRecentPads(function (err, recent) {
            var $shareIcon = $('<span>', {'class': 'fa fa-share-alt'});
            var hashes = Cryptpad.getHashes(channel, secret);
            var options = [];

            // If we have a stronger version in drive, add it and add a redirect button
            var stronger = recent && Cryptpad.findStronger(null, recent);
            if (stronger) {
                var parsed = Cryptpad.parsePadUrl(stronger);
                hashes.editHash = parsed.hash;
            }

            if (hashes.editHash) {
                options.push({
                    tag: 'a',
                    attributes: {title: Messages.editShareTitle, 'class': 'editShare'},
                    content: '<span class="fa fa-users"></span> ' + Messages.editShare
                });
                if (stronger) {
                    // We're in view mode, display the "open editing link" button
                    options.push({
                        tag: 'a',
                        attributes: {
                            title: Messages.editOpenTitle,
                            'class': 'editOpen',
                            href: window.location.pathname + '#' + hashes.editHash,
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
                    attributes: {title: Messages.viewShareTitle, 'class': 'viewShare'},
                    content: '<span class="fa fa-eye"></span> ' + Messages.viewShare
                });
                if (hashes.editHash && !stronger) {
                    // We're in edit mode, display the "open readonly" button
                    options.push({
                        tag: 'a',
                        attributes: {
                            title: Messages.viewOpenTitle,
                            'class': 'viewOpen',
                            href: window.location.pathname + '#' + hashes.viewHash,
                            target: '_blank'
                        },
                        content: '<span class="fa fa-eye"></span> ' + Messages.viewOpen
                    });
                }
            }
            if (hashes.fileHash) {
                options.push({
                    tag: 'a',
                    attributes: {title: Messages.viewShareTitle, 'class': 'fileShare'},
                    content: '<span class="fa fa-eye"></span> ' + Messages.viewShare
                });
            }
            var dropdownConfigShare = {
                text: $('<div>').append($shareIcon).html(),
                options: options,
                feedback: 'SHARE_MENU',
            };
            var $shareBlock = Cryptpad.createDropdown(dropdownConfigShare);
            //$shareBlock.find('button').attr('id', 'shareButton');
            $shareBlock.find('.dropdown-bar-content').addClass(SHARE_CLS).addClass(EDITSHARE_CLS).addClass(VIEWSHARE_CLS);
            $shareBlock.addClass('shareButton');
            $shareBlock.find('button').attr('title', Messages.shareButton);

            if (hashes.editHash) {
                $shareBlock.find('a.editShare').click(function () {
                    var url = window.location.origin + window.location.pathname + '#' + hashes.editHash;
                    var success = Cryptpad.Clipboard.copy(url);
                    if (success) { Cryptpad.log(Messages.shareSuccess); }
                });
            }
            if (hashes.viewHash) {
                $shareBlock.find('a.viewShare').click(function () {
                    var url = window.location.origin + window.location.pathname + '#' + hashes.viewHash ;
                    var success = Cryptpad.Clipboard.copy(url);
                    if (success) { Cryptpad.log(Messages.shareSuccess); }
                });
            }
            if (hashes.fileHash) {
                $shareBlock.find('a.fileShare').click(function () {
                    var url = window.location.origin + window.location.pathname + '#' + hashes.fileHash ;
                    var success = Cryptpad.Clipboard.copy(url);
                    if (success) { Cryptpad.log(Messages.shareSuccess); }
                });
            }

            toolbar.$leftside.append($shareBlock);
            toolbar.share = $shareBlock;
        });

        return "Loading share button";
    };

    var createFileShare = function (toolbar) {
        if (!window.location.hash) {
            throw new Error("Unable to display the share button: hash required in the URL");
        }
        var $shareIcon = $('<span>', {'class': 'fa fa-share-alt'});
        var $button = $('<button>', {'title': Messages.shareButton}).append($shareIcon);
        $button.addClass('shareButton');
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
            id: 'toolbarTitle',
            'class': TITLE_CLS
        }).appendTo(toolbar.$top);

        var $hoverable = $('<span>', {'class': 'hoverable'}).appendTo($titleContainer);

        if (typeof config.title !== "object") {
            console.error("config.title", config);
            throw new Error("config.title is not an object");
        }
        var updateTitle = config.title.updateTitle;
        var placeholder = config.title.defaultName;
        var suggestName = config.title.suggestName;

        // Buttons
        var $text = $('<span>', {
            'class': 'title'
        }).appendTo($hoverable);
        var $pencilIcon = $('<span>', {
            'class': 'pencilIcon',
            'title': Messages.clickToEdit
        });
        var $saveIcon = $('<span>', {
            'class': 'saveIcon',
            'title': Messages.saveTitle
        }).hide();
        if (config.readOnly === 1) {
            $titleContainer.append($('<span>', {'class': 'readOnly'})
                .text('('+Messages.readonly+')'));
        }
        if (config.readOnly === 1 || typeof(Cryptpad) === "undefined") { return $titleContainer; }
        var $input = $('<input>', {
            type: 'text',
            placeholder: placeholder
        }).appendTo($hoverable).hide();
        if (config.readOnly !== 1) {
            $text.attr("title", Messages.clickToEdit);
            $text.addClass("editable");
            var $icon = $('<span>', {
                'class': 'fa fa-pencil readonly',
                style: 'font-family: FontAwesome;'
            });
            $pencilIcon.append($icon).appendTo($hoverable);
            var $icon2 = $('<span>', {
                'class': 'fa fa-check readonly',
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
            updateTitle(name, function (err, newtitle) {
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
            id: 'toolbarTitle',
            'class': TITLE_CLS
        }).appendTo(toolbar.$top);

        toolbar.$top.find('.filler').hide();

        var $hoverable = $('<span>', {'class': 'hoverable'}).appendTo($titleContainer);

        // Buttons
        $('<span>', {
            'class': 'title pageTitle'
        }).appendTo($hoverable).text(config.pageTitle);
    };

    var createLinkToMain = function (toolbar) {
        var $linkContainer = $('<span>', {
            'class': "cryptpad-link"
        }).appendTo(toolbar.$top);

        // We need to override the "a" tag action here because it is inside the iframe!
        var inDrive = /^\/drive/;

        var href = inDrive ? '/index.html' : '/drive/';
        var buttonTitle = inDrive ? Messages.header_homeTitle : Messages.header_logoTitle;

        var $aTag = $('<a>', {
            href: href,
            title: buttonTitle,
            'class': "cryptpad-logo"
        }).append($('<img>', {
            src: '/customize/images/logo_white.png'
        }));
        var onClick = function (e) {
            e.preventDefault();
            if (e.ctrlKey) {
                window.open(href);
                return;
            }
            window.location = href;
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
        Cryptpad.isOverPinLimit(todo);

        return $limit;
    };

    var createNewPad = function (toolbar) {
        /*var $newPad = $('<span>', {
            'class': NEWPAD_CLS + " dropdown-bar"
        }).appendTo(toolbar.$top);*/
        var $newPad = toolbar.$top.find('.'+NEWPAD_CLS).show();

        var pads_options = [];
        Config.availablePadTypes.forEach(function (p) {
            if (p === 'drive') { return; }
            if (!Cryptpad.isLoggedIn() && Config.registeredOnlyTypes &&
                Config.registeredOnlyTypes.indexOf(p) !== -1) { return; }
            pads_options.push({
                tag: 'a',
                attributes: {
                    'target': '_blank',
                    'href': '/' + p + '/',
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
        var $userAdmin = toolbar.$userAdmin.find('.'+USERADMIN_CLS).show();
        var userMenuCfg = {
            $initBlock: $userAdmin
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
        Cryptpad.createUserAdminMenu(userMenuCfg);
        $userAdmin.find('button').attr('title', Messages.userAccountButton);

        // TODO iframe
        /*var $userButton = toolbar.$userNameButton = $userAdmin.find('a.' + USERBUTTON_CLS);
        $userButton.click(function (e) {
            e.preventDefault();
            e.stopPropagation();
            Cryptpad.getLastName(function (err, lastName) {
                if (err) { return void console.error("Cannot get last name", err); }
                Cryptpad.prompt(Messages.changeNamePrompt, lastName || '', function (newName) {
                    if (newName === null && typeof(lastName) === "string") { return; }
                    if (newName === null) { newName = ''; }
                    else { Cryptpad.feedback('NAME_CHANGED'); }
                    Cryptpad.setAttribute('username', newName, function (err) {
                        if (err) {
                            console.log("Couldn't set username");
                            console.error(err);
                            return;
                        }
                        Cryptpad.changeDisplayName(newName, true);
                    });
                });
            });
        });
        Cryptpad.onDisplayNameChanged(function () {
            window.setTimeout(function () {
                Cryptpad.findCancelButton().click();
                if (config.userList) {
                    updateUserList(toolbar, config);
                    return;
                }
                updateDisplayName(toolbar, config);
            }, 0);
        });*/

        updateDisplayName(toolbar, config);

        return $userAdmin;
    };

    // Events
    var initClickEvents = function (toolbar, config) {
        var removeDropdowns =  function () {
            toolbar.$toolbar.find('.cryptpad-dropdown').hide();
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
        if (!config.userList || !config.userList.list || !config.userList.userNetfluxId) { return; }
        var userList = config.userList.list;
        var userNetfluxId = config.userList.userNetfluxId;
        if (typeof Cryptpad !== "undefined" && userList) {
            var notify = function(type, name, oldname) {
                // type : 1 (+1 user), 0 (rename existing user), -1 (-1 user)
                if (typeof name === "undefined") { return; }
                name = name || Messages.anonymous;
                switch(type) {
                    case 1:
                        Cryptpad.log(Messages._getKey("notifyJoined", [name]));
                        break;
                    case 0:
                        oldname = (oldname === "") ? Messages.anonymous : oldname;
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

            userList.change.push(function (newdata) {
                // Notify for disconnected users
                if (typeof oldUserData !== "undefined") {
                    for (var u in oldUserData) {
                        // if a user's uid is still present after having left, don't notify
                        if (userList.users.indexOf(u) === -1) {
                            var temp = JSON.parse(JSON.stringify(oldUserData[u]));
                            delete oldUserData[u];
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
                    if (k !== userNetfluxId && userList.users.indexOf(k) !== -1) {
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
        tb['fileshare'] = createFileShare;
        tb['title'] = createTitle;
        tb['pageTitle'] = createPageTitle;
        tb['lag'] = $.noop;
        tb['spinner'] = createSpinner;
        tb['state'] = $.noop;
        tb['limit'] = createLimit;
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
        toolbar.reconnecting = function (userId) {
            if (config.userList) { config.userList.userNetfluxId = userId; }
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
