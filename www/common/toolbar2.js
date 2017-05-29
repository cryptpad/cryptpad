define([
    'jquery',
    '/customize/application_config.js',
    '/api/config'
], function ($, Config, ApiConfig) {
    var Messages = {};
    var Cryptpad;

    var Bar = {
        constants: {},
    };

    var SPINNER_DISAPPEAR_TIME = 3000;

    // Toolbar parts
    var TOOLBAR_CLS = Bar.constants.toolbar = 'cryptpad-toolbar';
    var TOP_CLS = Bar.constants.top = 'cryptpad-toolbar-top';
    var LEFTSIDE_CLS = Bar.constants.leftside = 'cryptpad-toolbar-leftside';
    var RIGHTSIDE_CLS = Bar.constants.rightside = 'cryptpad-toolbar-rightside';
    var HISTORY_CLS = Bar.constants.history = 'cryptpad-toolbar-history';

    // Userlist
    var USERLIST_CLS = Bar.constants.userlist = "cryptpad-dropdown-users";
    var EDITSHARE_CLS = Bar.constants.editShare = "cryptpad-dropdown-editShare";
    var VIEWSHARE_CLS = Bar.constants.viewShare = "cryptpad-dropdown-viewShare";
    var SHARE_CLS = Bar.constants.viewShare = "cryptpad-dropdown-share";

    // Top parts
    var USER_CLS = Bar.constants.userAdmin = "cryptpad-user";
    var SPINNER_CLS = Bar.constants.spinner = 'cryptpad-spinner';
    var STATE_CLS = Bar.constants.state = 'cryptpad-state';
    var LAG_CLS = Bar.constants.lag = 'cryptpad-lag';
    var LIMIT_CLS = Bar.constants.lag = 'cryptpad-limit';
    var TITLE_CLS = Bar.constants.title = "cryptpad-title";
    var NEWPAD_CLS = Bar.constants.newpad = "cryptpad-newpad";

    // User admin menu
    var USERADMIN_CLS = Bar.constants.user = 'cryptpad-user-dropdown';
    var USERNAME_CLS = Bar.constants.username = 'cryptpad-toolbar-username';
    var READONLY_CLS = Bar.constants.readonly = 'cryptpad-readonly';
    var USERBUTTON_CLS = Bar.constants.changeUsername = "cryptpad-change-username";

    // Create the toolbar element

    var uid = function () {
        return 'cryptpad-uid-' + String(Math.random()).substring(2);
    };

    var styleToolbar = function ($container, href, version) {
        href = href || '/customize/toolbar.css' + (version?('?' + version): '');

        $.ajax({
            url: href,
            dataType: 'text',
            success: function (data) {
                $container.append($('<style>').text(data));
            },
        });
    };

    var createRealtimeToolbar = function (config) {
        if (!config.$container) { return; }
        var $container = config.$container;
        var $toolbar = $('<div>', {
            'class': TOOLBAR_CLS,
            id: uid(),
        });

        var $topContainer = $('<div>', {'class': TOP_CLS});
        var $userContainer = $('<span>', {
            'class': USER_CLS
        }).appendTo($topContainer);
        $('<span>', {'class': SPINNER_CLS}).hide().appendTo($userContainer);
        $('<span>', {'class': STATE_CLS}).hide().appendTo($userContainer);
        $('<span>', {'class': LAG_CLS}).hide().appendTo($userContainer);
        $('<span>', {'class': LIMIT_CLS}).hide().appendTo($userContainer);
        $('<span>', {'class': NEWPAD_CLS + ' dropdown-bar'}).hide().appendTo($userContainer);
        $('<span>', {'class': USERADMIN_CLS + ' dropdown-bar'}).hide().appendTo($userContainer);

        $toolbar.append($topContainer)
        .append($('<div>', {'class': LEFTSIDE_CLS}))
        .append($('<div>', {'class': RIGHTSIDE_CLS}))
        .append($('<div>', {'class': HISTORY_CLS}));

        // The 'notitle' class removes the line added for the title with a small screen
        if (!config.title || typeof config.title !== "object") {
            $toolbar.addClass('notitle');
        }

        $container.prepend($toolbar);

        if (ApiConfig && ApiConfig.requireConf && ApiConfig.requireConf.urlArgs) {
            styleToolbar($container, undefined, ApiConfig.requireConf.urlArgs);
        } else {
            styleToolbar($container);
        }
        return $toolbar;
    };

    // Userlist elements

    var checkSynchronizing = function (toolbar, config) {
        if (!toolbar.state) { return; }
        var userList = config.userList.list.users;
        var userNetfluxId = config.userList.userNetfluxId;
        var meIdx = userList.indexOf(userNetfluxId);
        if (meIdx === -1) {
            toolbar.state.text(Messages.synchronizing);
            return;
        }
        toolbar.state.text('');
    };
    var getOtherUsers = function(config) {
        var userList = config.userList.list.users;
        var userData = config.userList.data;
        var userNetfluxId = config.userList.userNetfluxId;

        var i = 0; // duplicates counter
        var list = [];

        // Display only one time each user (if he is connected in multiple tabs)
        var myUid = userData[userNetfluxId] ? userData[userNetfluxId].uid : undefined;
        var uids = [];
        userList.forEach(function(user) {
            if (user !== userNetfluxId) {
                var data = userData[user] || {};
                var userName = data.name;
                var userId = data.uid;
                if (userName && uids.indexOf(userId) === -1 && (!myUid || userId !== myUid)) {
                    uids.push(userId);
                    list.push(userName);
                } else if (userName) { i++; }
            }
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
    var updateUserList = function (toolbar, config) {
        // Make sure the elements are displayed
        var $userButtons = toolbar.userlist;

        var userList = config.userList.list.users;
        var userData = config.userList.data;
        var userNetfluxId = config.userList.userNetfluxId;

        var numberOfUsers = userList.length;

        // If we are using old pads (readonly unavailable), only editing users are in userList.
        // With new pads, we also have readonly users in userList, so we have to intersect with
        // the userData to have only the editing users. We can't use userData directly since it
        // may contain data about users that have already left the channel.
        userList = config.readOnly === -1 ? userList : arrayIntersect(userList, Object.keys(userData));

        // Names of editing users
        var others = getOtherUsers(config);
        var editUsersNames = others.list;
        var duplicates = others.duplicates; // Number of duplicates

        var numberOfEditUsers = userList.length - duplicates;
        var numberOfViewUsers = numberOfUsers - userList.length;

        // Number of anonymous editing users
        var anonymous = numberOfEditUsers - editUsersNames.length;

        // Update the userlist
        var $usersTitle = $('<h2>').text(Messages.users);
        var $editUsers = $userButtons.find('.' + USERLIST_CLS);
        $editUsers.html('').append($usersTitle);

        var $editUsersList = $('<pre>');
        // Yourself (edit only)
        if (config.readOnly !== 1) {
            $editUsers.append('<span class="yourself">' + Messages.yourself + '</span>');
            anonymous--;
        }
        // Editors
        $editUsersList.text(editUsersNames.join('\n')); // .text() to avoid XSS
        $editUsers.append($editUsersList);
        // Anonymous editors
        if (anonymous > 0) {
            var text = anonymous === 1 ? Messages.anonymousUser : Messages.anonymousUsers;
            $editUsers.append('<span class="anonymous">' + anonymous + ' ' + text + '</span>');
        }
        // Viewers
        if (numberOfViewUsers > 0) {
            var viewText = '<span class="viewer">';
            if (numberOfEditUsers > 0) {
                $editUsers.append('<br>');
                viewText += Messages.and + ' ';
            }
            var viewerText = numberOfViewUsers !== 1 ? Messages.viewers : Messages.viewer;
            viewText += numberOfViewUsers + ' ' + viewerText + '</span>';
            $editUsers.append(viewText);
        }

        // Update the buttons
        var fa_editusers = '<span class="fa fa-users"></span>';
        var fa_viewusers = '<span class="fa fa-eye"></span>';
        var viewersText = numberOfViewUsers !== 1 ? Messages.viewers : Messages.viewer;
        var editorsText = numberOfEditUsers !== 1 ? Messages.editors : Messages.editor;
        var $span = $('<span>', {'class': 'large'}).html(fa_editusers + ' ' + numberOfEditUsers + ' ' + editorsText + '&nbsp;&nbsp; ' + fa_viewusers + ' ' + numberOfViewUsers + ' ' + viewersText);
        var $spansmall = $('<span>', {'class': 'narrow'}).html(fa_editusers + ' ' + numberOfEditUsers + '&nbsp;&nbsp; ' + fa_viewusers + ' ' + numberOfViewUsers);
        $userButtons.find('.buttonTitle').html('').append($span).append($spansmall);

        // Change username in useradmin dropdown
        if (config.displayed.indexOf('useradmin') !== -1) {
            var $userAdminElement = toolbar.$userAdmin;
            var $userElement = $userAdminElement.find('.' + USERNAME_CLS);
            $userElement.show();
            if (config.readOnly === 1) {
                $userElement.addClass(READONLY_CLS).text(Messages.readonly);
            }
            else {
                var name = userData[userNetfluxId] && userData[userNetfluxId].name;
                if (!name) {
                    name = Messages.anonymous;
                }
                $userElement.removeClass(READONLY_CLS).text(name);
            }
        }
    };

    var initUserList = function (toolbar, config) {
        if (config.userList && config.userList.list && config.userList.userNetfluxId) {
            var userList = config.userList.list;
            userList.change.push(function () {
                var users = userList.users;
                if (users.indexOf(config.userList.userNetfluxId) !== -1) {toolbar.connected = true;}
                if (!toolbar.connected) { return; }
                checkSynchronizing(toolbar, config);
                if (config.userList.data) {
                    updateUserList(toolbar, config);
                }
            });
        }
    };


    // Create sub-elements

    var createUserList = function (toolbar, config) {
        if (!config.userList || !config.userList.list ||
            !config.userList.data || !config.userList.userNetfluxId) {
            throw new Error("You must provide a `userList` object to display the userlist");
        }
        var dropdownConfig = {
            options: [{
                tag: 'p',
                attributes: {'class': USERLIST_CLS},
            }]
        };
        var $block = Cryptpad.createDropdown(dropdownConfig);
        $block.attr('id', 'userButtons');
        toolbar.$leftside.prepend($block);

        return $block;
    };

    var createShare = function (toolbar, config) {
        var secret = Cryptpad.find(config, ['share', 'secret']);
        var channel = Cryptpad.find(config, ['share', 'channel']);
        if (!secret || !channel) {
            throw new Error("Unable to display the share button: share.secret and share.channel required");
        }
        Cryptpad.getRecentPads(function (err, recent) {
            var $shareIcon = $('<span>', {'class': 'fa fa-share-alt'});
            var $span = $('<span>', {'class': 'large'}).append(' ' +Messages.shareButton);
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
                text: $('<div>').append($shareIcon).append($span).html(),
                options: options
            };
            var $shareBlock = Cryptpad.createDropdown(dropdownConfigShare);
            $shareBlock.find('button').attr('id', 'shareButton');
            $shareBlock.find('.dropdown-bar-content').addClass(SHARE_CLS).addClass(EDITSHARE_CLS).addClass(VIEWSHARE_CLS);

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
        var $span = $('<span>', {'class': 'large'}).append(' ' +Messages.shareButton);
        var $button = $('<button>', {'id': 'shareButton'}).append($shareIcon).append($span);
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

        // TODO: move these functions to toolbar or common?
        if (typeof config.title !== "object") {
            console.error("config.title", config);
            throw new Error("config.title is not an object");
        }
        var callback = config.title.onRename;
        var placeholder = config.title.defaultName;
        var suggestName = config.title.suggestName;

        // Buttons
        var $text = $('<span>', {
            'class': 'title'
        }).appendTo($titleContainer);
        var $pencilIcon = $('<span>', {
            'class': 'pencilIcon',
            'title': Messages.clickToEdit
        });
        if (config.readOnly === 1 || typeof(Cryptpad) === "undefined") { return $titleContainer; }
        var $input = $('<input>', {
            type: 'text',
            placeholder: placeholder
        }).appendTo($titleContainer).hide();
        if (config.readOnly !== 1) {
            $text.attr("title", Messages.clickToEdit);
            $text.addClass("editable");
            var $icon = $('<span>', {
                'class': 'fa fa-pencil readonly',
                style: 'font-family: FontAwesome;'
            });
            $pencilIcon.append($icon).appendTo($titleContainer);
        }

        // Events
        $input.on('mousedown', function (e) {
            if (!$input.is(":focus")) {
                $input.focus();
            }
            e.stopPropagation();
            return true;
        });
        $input.on('keyup', function (e) {
            if (e.which === 13 && toolbar.connected === true) {
                var name = $input.val().trim();
                if (name === "") {
                    name = $input.attr('placeholder');
                }
                Cryptpad.renamePad(name, function (err, newtitle) {
                    if (err) { return; }
                    $text.text(newtitle);
                    callback(null, newtitle);
                    $input.hide();
                    $text.show();
                    //$pencilIcon.css('display', '');
                });
            } else if (e.which === 27) {
                $input.hide();
                $text.show();
                //$pencilIcon.css('display', '');
            }
        });

        var displayInput = function () {
            if (toolbar.connected === false) { return; }
            $text.hide();
            //$pencilIcon.css('display', 'none');
            var inputVal = suggestName() || "";
            $input.val(inputVal);
            $input.show();
            $input.focus();
        };
        $text.on('click', displayInput);
        $pencilIcon.on('click', displayInput);
        return $titleContainer;
    };

    var createLinkToMain = function (toolbar) {
        var $linkContainer = $('<span>', {
            'class': "cryptpad-link"
        }).appendTo(toolbar.$top);
        var $imgTag = $('<img>', {
            src: "/customize/cryptofist_mini.png",
            alt: "Cryptpad"
        });

        // We need to override the "a" tag action here because it is inside the iframe!
        var $aTagSmall = $('<a>', {
            href: "/",
            title: Messages.header_logoTitle,
            'class': "cryptpad-logo"
        }).append($imgTag);
        var $span = $('<span>').text('CryptPad');
        var $aTagBig = $aTagSmall.clone().addClass('large').append($span);
        $aTagSmall.addClass('narrow');
        var onClick = function (e) {
            e.preventDefault();
            if (e.ctrlKey) {
                window.open('/');
                return;
            }
            window.location = "/";
        };

        var onContext = function (e) { e.stopPropagation(); };

        $aTagBig.click(onClick).contextmenu(onContext);
        $aTagSmall.click(onClick).contextmenu(onContext);

        $linkContainer.append($aTagSmall).append($aTagBig);

        return $linkContainer;
    };

    var checkLag = function (toolbar, config, $lagEl) {
        var lag;
        var $lag = $lagEl || toolbar.lag;
        if (!$lag) { return; }
        var getLag = config.network.getLag;
        if(typeof getLag === "function") {
            lag = getLag();
        }
        var lagLight = $('<div>', {
            'class': 'lag'
        });
        var title;
        if (lag && toolbar.connected) {
            $lag.attr('class', LAG_CLS);
            toolbar.firstConnection = false;
            title = Messages.lag + ' : ' + lag + ' ms\n';
            if (lag > 30000) {
                $lag.addClass('lag0');
                title = Messages.redLight;
            } else if (lag > 5000) {
                $lag.addClass('lag1');
                title += Messages.orangeLight;
            } else if (lag > 1000) {
                $lag.addClass('lag2');
                title += Messages.orangeLight;
            } else if (lag > 300) {
                $lag.addClass('lag3');
                title += Messages.greenLight;
            } else {
                $lag.addClass('lag4');
                title += Messages.greenLight;
            }
        }
        else if (!toolbar.firstConnection) {
            $lag.attr('class', LAG_CLS);
            // Display the red light at the 2nd failed attemp to get the lag
            lagLight.addClass('lag-red');
            title = Messages.redLight;
        }
        if (title) {
            $lag.attr('title', title);
        }
    };
    var createLag = function (toolbar, config) {
        var $a = toolbar.$userAdmin.find('.'+LAG_CLS).show();
        $('<span>', {'class': 'bar1'}).appendTo($a);
        $('<span>', {'class': 'bar2'}).appendTo($a);
        $('<span>', {'class': 'bar3'}).appendTo($a);
        $('<span>', {'class': 'bar4'}).appendTo($a);
        if (config.realtime) {
            checkLag(toolbar, config, $a);
            setInterval(function () {
                if (!toolbar.connected) { return; }
                checkLag(toolbar, config);
            }, 3000);
        }
        return $a;
    };

    var kickSpinner = function (toolbar, config, local) {
        if (!toolbar.spinner) { return; }
        var $spin = toolbar.spinner;
        $spin.find('.spin').show();
        $spin.find('.synced').hide();
        var onSynced = function () {
            if ($spin.timeout) { clearTimeout($spin.timeout); }
            $spin.timeout = setTimeout(function () {
                $spin.find('.spin').hide();
                $spin.find('.synced').show();
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
        var $spin = toolbar.$userAdmin.find('.'+SPINNER_CLS).show();
        $('<span>', {
            id: uid(),
            'class': 'spin fa fa-spinner fa-pulse',
        }).appendTo($spin).hide();
        $('<span>', {
            id: uid(),
            'class': 'synced fa fa-check',
            title: Messages.synced
        }).appendTo($spin);
        toolbar.$userAdmin.prepend($spin);
        if (config.realtime) {
            config.realtime.onPatch(ks(toolbar, config));
            config.realtime.onMessage(ks(toolbar, config, true));
        }
        return $spin;
    };

    var createState = function (toolbar) {
        return toolbar.$userAdmin.find('.'+STATE_CLS).text(Messages.synchronizing).show();
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
        var $newPad = toolbar.$userAdmin.find('.'+NEWPAD_CLS).show();

        var pads_options = [];
        Config.availablePadTypes.forEach(function (p) {
            if (p === 'drive') { return; }
            pads_options.push({
                tag: 'a',
                attributes: {
                    'target': '_blank',
                    'href': '/' + p + '/',
                },
                content: Messages.type[p]
            });
        });
        var $plusIcon = $('<span>', {'class': 'fa fa-plus'});
        var $newbig = $('<span>', {'class': 'big'}).append(' ' +Messages.newButton);
        var $newButton = $('<div>').append($plusIcon).append($newbig);
        var dropdownConfig = {
            text: $newButton.html(), // Button initial text
            options: pads_options, // Entries displayed in the menu
            left: true, // Open to the left of the button,
            container: $newPad
        };
        var $newPadBlock = Cryptpad.createDropdown(dropdownConfig);
        $newPadBlock.find('button').attr('title', Messages.newButtonTitle);
        $newPadBlock.find('button').attr('id', 'newdoc');
        return $newPadBlock;
    };

    var createUserAdmin = function (toolbar, config) {
        var $userAdmin = toolbar.$userAdmin.find('.'+USERADMIN_CLS).show();
        var userMenuCfg = {
            $initBlock: $userAdmin
        };
        if (!config.hideDisplayName) { // TODO: config.userAdmin.hideDisplayName?
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

        var $userButton = toolbar.$userNameButton = $userAdmin.find('a.' + USERBUTTON_CLS);
        $userButton.click(function (e) {
            e.preventDefault();
            e.stopPropagation();
            Cryptpad.getLastName(function (err, lastName) {
                if (err) { return void console.error("Cannot get last name", err); }
                Cryptpad.prompt(Messages.changeNamePrompt, lastName || '', function (newName) {
                    if (newName === null && typeof(lastName) === "string") { return; }
                    if (newName === null) { newName = ''; }
                    Cryptpad.changeDisplayName(newName);
                });
            });
        });
        Cryptpad.onDisplayNameChanged(function () {
            Cryptpad.findCancelButton().click();
        });

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
        Messages = Cryptpad.Messages;
        config.readOnly = (typeof config.readOnly !== "undefined") ? (config.readOnly ? 1 : 0) : -1;
        config.displayed = config.displayed || [];
        config.network = cfg.network || Cryptpad.getNetwork();

        var toolbar = {};

        toolbar.connected = false;
        toolbar.firstConnection = true;

        var $toolbar = toolbar.$toolbar = createRealtimeToolbar(config);
        toolbar.$leftside = $toolbar.find('.'+Bar.constants.leftside);
        toolbar.$rightside = $toolbar.find('.'+Bar.constants.rightside);
        toolbar.$top = $toolbar.find('.'+Bar.constants.top);
        toolbar.$history = $toolbar.find('.'+Bar.constants.history);

        toolbar.$userAdmin = $toolbar.find('.'+Bar.constants.userAdmin);

        // Create the subelements
        var tb = {};
        tb['userlist'] = createUserList;
        tb['share'] = createShare;
        tb['fileshare'] = createFileShare;
        tb['title'] = createTitle;
        tb['lag'] = createLag;
        tb['spinner'] = createSpinner;
        tb['state'] = createState;
        tb['limit'] = createLimit;
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
            if (toolbar.state) {
                toolbar.state.text(Messages.disconnected);
            }
            checkLag(toolbar, config);
        };
        toolbar.reconnecting = function (userId) {
            if (config.userList) { config.userList.userNetfluxId = userId; }
            toolbar.connected = false;
            if (toolbar.state) {
                toolbar.state.text(Messages.reconnecting);
            }
            checkLag(toolbar, config);
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
