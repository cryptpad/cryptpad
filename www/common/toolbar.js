define([
    '/customize/messages.js',
    '/bower_components/jquery/dist/jquery.min.js'
], function (Messages) {
    var $ = window.jQuery;

    var Bar = {
        constants: {},
    };

    /** Id of the div containing the user list. */
    var USER_LIST_CLS = Bar.constants.userlist = 'cryptpad-user-list';

    /** Id of the div containing the lag info. */
    var LAG_ELEM_CLS = Bar.constants.lag = 'cryptpad-lag';

    /** The toolbar class which contains the user list, debug link and lag. */
    var TOOLBAR_CLS = Bar.constants.toolbar = 'cryptpad-toolbar';

    var TOP_CLS = Bar.constants.top = 'cryptpad-toolbar-top';
    var LEFTSIDE_CLS = Bar.constants.leftside = 'cryptpad-toolbar-leftside';
    var RIGHTSIDE_CLS = Bar.constants.rightside = 'cryptpad-toolbar-rightside';

    var SPINNER_CLS = Bar.constants.spinner = 'cryptpad-spinner';

    var STATE_CLS = Bar.constants.state = 'cryptpad-state';

    var USERNAME_CLS = Bar.constants.username = 'cryptpad-toolbar-username';

    var READONLY_CLS = Bar.constants.readonly = 'cryptpad-readonly';

    var USERBUTTONS_CONTAINER_CLS = Bar.constants.userButtonsContainer = "cryptpad-userbuttons-container";
    var USERLIST_CLS = Bar.constants.userlist = "cryptpad-dropdown-users";
    var EDITSHARE_CLS = Bar.constants.editShare = "cryptpad-dropdown-editShare";
    var VIEWSHARE_CLS = Bar.constants.viewShare = "cryptpad-dropdown-viewShare";
    var SHARE_CLS = Bar.constants.viewShare = "cryptpad-dropdown-share";
    var DROPDOWN_CONTAINER_CLS = Bar.constants.dropdownContainer = "cryptpad-dropdown-container";
    var DROPDOWN_CLS = Bar.constants.dropdown = "cryptpad-dropdown";
    var TITLE_CLS = Bar.constants.title = "cryptpad-title";
    var USER_CLS = Bar.constants.userAdmin = "cryptpad-user";
    var USERBUTTON_CLS = Bar.constants.changeUsername = "cryptpad-change-username";

    var SPINNER_DISAPPEAR_TIME = 3000;

    var uid = function () {
        return 'cryptpad-uid-' + String(Math.random()).substring(2);
    };

    var $style;

    var firstConnection = true;
    var lagErrors = 0;

    var styleToolbar = function ($container, href) {
        href = href || '/customize/toolbar.css';
        $.ajax({
            url: href,
            dataType: 'text',
            success: function (data) {
                $container.append($('<style>').text(data));
            },
        });
    };

    var createRealtimeToolbar = function ($container) {
        var $toolbar = $('<div>', {
            'class': TOOLBAR_CLS,
            id: uid(),
        })
        .append($('<div>', {'class': TOP_CLS}))
        .append($('<div>', {'class': LEFTSIDE_CLS}))
        .append($('<div>', {'class': RIGHTSIDE_CLS}));

        $container.prepend($toolbar);
        styleToolbar($container);
        return $toolbar;
    };

    var createSpinner = function ($container, config) {
        if (config.displayed.indexOf('spinner') !== -1) {
            var $spinner = $('<span>', {
                id: uid(),
                'class': SPINNER_CLS + ' fa fa fa-spinner fa-pulse',
            }).hide();
            $container.prepend($spinner);
            return $spinner[0];
        }
    };

    var kickSpinner = function (spinnerElement) {
        if (!spinnerElement) { return; }
        $(spinnerElement).show();
        if (spinnerElement.timeout) { clearTimeout(spinnerElement.timeout); }
        spinnerElement.timeout = setTimeout(function () {
            $(spinnerElement).hide();
        }, SPINNER_DISAPPEAR_TIME);
    };

    var createUserButtons = function ($userlistElement, config, readOnly, Cryptpad) {
        // User list button
        if (config.displayed.indexOf('userlist') !== -1) {
            if (!config.userData) {
                throw new Error("You must provide a `userData` object to display the userlist");
            }
            var dropdownConfig = {
                options: [{
                    tag: 'p',
                    attributes: {'class': USERLIST_CLS},
                }] // Entries displayed in the menu
            };
            var $block = Cryptpad.createDropdown(dropdownConfig);
            $block.attr('id', 'userButtons');
            $userlistElement.append($block);
        }

        // Share button
        if (config.displayed.indexOf('share') !== -1) {
            var $shareIcon = $('<span>', {'class': 'fa fa-share-alt'});
            var $span = $('<span>', {'class': 'large'}).append($shareIcon.clone()).append(' ' +Messages.shareButton);
            var $spanSmall = $('<span>', {'class': 'small'}).append($shareIcon.clone());
            var dropdownConfigShare = {
                text: $('<div>').append($span).append($spanSmall).html(),
                options: []
            };
            var $shareBlock = Cryptpad.createDropdown(dropdownConfigShare);
            $shareBlock.find('.dropdown-bar-content').addClass(SHARE_CLS).addClass(EDITSHARE_CLS).addClass(VIEWSHARE_CLS);
            $userlistElement.append($shareBlock);
        }
    };

    var createUserList = function ($container, config, readOnly, Cryptpad) {
        if (config.displayed.indexOf('userlist') === -1 && config.displayed.indexOf('share') === -1) { return; }
        var $userlist = $('<div>', {
            'class': USER_LIST_CLS,
            id: uid(),
        });
        createUserButtons($userlist, config, readOnly, Cryptpad);
        $container.append($userlist);
        return $userlist[0];
    };

    var getOtherUsers = function(myUserName, userList, userData) {
      var i = 0;
      var list = [];
      userList.forEach(function(user) {
        if(user !== myUserName) {
          var data = (userData) ? (userData[user] || null) : null;
          var userName = (data) ? data.name : null;
          if(userName) {
            list.push(userName);
          }
        }
      });
      return list;
    };

    var arrayIntersect = function(a, b) {
        return $.grep(a, function(i) {
            return $.inArray(i, b) > -1;
        });
    };

    var getViewers = function (n) {
        if (!n || !parseInt(n) || n === 0) { return ''; }
        if (n === 1) { return '; + ' + Messages.oneViewer; }
        return '; + ' + Messages._getKey('viewers', [n]);
    };

    var checkSynchronizing = function (userList, myUserName, $stateElement) {
        var meIdx = userList.indexOf(myUserName);
        if (meIdx === -1) {
            $stateElement.text(Messages.synchronizing);
            return;
        }
        $stateElement.text('');
    };

    var updateUserList = function (config, myUserName, userlistElement, userList, userData, readOnly, $userAdminElement) {
        // Make sure the elements are displayed
        var $userButtons = $(userlistElement).find("#userButtons");
        $userButtons.attr('display', 'inline');

        if (config.displayed.indexOf('userlist') !== -1) {
            var numberOfUsers = userList.length;

            // If we are using old pads (readonly unavailable), only editing users are in userList.
            // With new pads, we also have readonly users in userList, so we have to intersect with
            // the userData to have only the editing users. We can't use userData directly since it
            // may contain data about users that have already left the channel.
            userList = readOnly === -1 ? userList : arrayIntersect(userList, Object.keys(userData));

            var numberOfEditUsers = userList.length;
            var numberOfViewUsers = numberOfUsers - numberOfEditUsers;

            // Names of editing users
            var editUsersNames = getOtherUsers(myUserName, userList, userData);

            // Number of anonymous editing users
            var anonymous = numberOfEditUsers - editUsersNames.length;

            // Update the userlist
            var editUsersList = '';
            if (readOnly !== 1) {
                editUsersNames.unshift('<span class="yourself">' + Messages.yourself + '</span>');
                anonymous--;
            }
            if (anonymous > 0) {
                var text = anonymous === 1 ? Messages.anonymousUser : Messages.anonymousUsers;
                editUsersNames.push('<span class="anonymous">' + anonymous + ' ' + text + '</span>');
            }
            if (numberOfViewUsers > 0) {
                var viewText = '<span class="viewer">';
                if (numberOfEditUsers > 0) {
                    editUsersNames.push('');
                    viewText += Messages.and + ' ';
                }
                var viewerText = numberOfViewUsers > 1 ? Messages.viewers : Messages.viewer;
                viewText += numberOfViewUsers + ' ' + viewerText + '</span>';
                editUsersNames.push(viewText);
            }
            if (editUsersNames.length > 0) {
                editUsersList += editUsersNames.join('<br>');
            }

            var $usersTitle = $('<h2>').text(Messages.users);
            var $editUsers = $userButtons.find('.' + USERLIST_CLS);
            $editUsers.html('').append($usersTitle).append(editUsersList);

            // Update the buttons
            var fa_editusers = '<span class="fa fa-users"></span>';
            var fa_viewusers = '<span class="fa fa-eye"></span>';
            var viewersText = numberOfViewUsers > 1 ? Messages.viewers : Messages.viewer;
            var editorsText = numberOfEditUsers > 1 ? Messages.editors : Messages.editor;
            var $span = $('<span>', {'class': 'large'}).html(fa_editusers + ' ' + numberOfEditUsers + ' ' + editorsText + '&nbsp;&nbsp; ' + fa_viewusers + ' ' + numberOfViewUsers + ' ' + viewersText);
            var $spansmall = $('<span>', {'class': 'small'}).html(fa_editusers + ' ' + numberOfEditUsers + '&nbsp;&nbsp; ' + fa_viewusers + ' ' + numberOfViewUsers);
            $userButtons.find('.buttonTitle').html('').append($span).append($spansmall);
        }

        if (config.displayed.indexOf('useradmin') !== -1) {
            // Change username in useradmin dropdown
            var $userElement = $userAdminElement.find('.' + USERNAME_CLS);
            $userElement.show();
            if (readOnly === 1) {
                $userElement.addClass(READONLY_CLS).text(Messages.readonly);
            }
            else {
                var name = userData[myUserName] && userData[myUserName].name;
                if (!name) {
                    name = Messages.anonymous;
                }
                $userElement.removeClass(READONLY_CLS).text(name);
            }
        }
    };

    var createLagElement = function () {
        var $lag = $('<span>', {
            'class': LAG_ELEM_CLS,
            id: uid(),
        });
        return $lag[0];
    };

    var checkLag = function (getLag, lagElement) {
        var lag;
        if(typeof getLag === "function") {
            lag = getLag();
        }
        var lagLight = $('<div>', {
            'class': 'lag'
        });
        var title;
        if (typeof lag !== "undefined") {
            lagErrors = 0;
            firstConnection = false;
            title = Messages.lag + ' : ' + lag + ' ms\n';
            if (lag.waiting || lag > 1000) {
                lagLight.addClass('lag-orange');
                title += Messages.orangeLight;
            } else {
                lagLight.addClass('lag-green');
                title += Messages.greenLight;
            }
        }
        else if (!firstConnection) {
            // Display the red light at the 2nd failed attemp to get the lag
            //if (lagErrors > 1) {
                lagLight.addClass('lag-red');
                title = Messages.redLight;
            //}
        }
        if (title) {
            lagLight.attr('title', title);
            $(lagElement).html('');
            $(lagElement).append(lagLight);
        }
    };

    var createLinkToMain = function ($topContainer) {
        var $linkContainer = $('<span>', {
            'class': "cryptpad-link"
        }).appendTo($topContainer);
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
        var $aTagBig = $aTagSmall.clone().addClass('big').append($span);
        $aTagSmall.addClass('small');
        var onClick = function (e) {
            e.preventDefault();
            window.location = "/";
        };

        $aTagBig.click(onClick);
        $aTagSmall.click(onClick);

        $linkContainer.append($aTagSmall).append($aTagBig);
    };

    var createUserAdmin = function ($topContainer, config, readOnly, lagElement, Cryptpad) {
        var $lag = $(lagElement);

        var $userContainer = $('<span>', {
            'class': USER_CLS
        }).appendTo($topContainer);

        if (config.displayed.indexOf('state') !== -1) {
            var $state = $('<span>', {
                'class': STATE_CLS
            }).text(Messages.synchronizing).appendTo($userContainer);
        }

        if (config.displayed.indexOf('lag') !== -1) {
            $userContainer.append($lag);
        }

        if (config.displayed.indexOf('language') !== -1) {
            // Dropdown language selector
            Cryptpad.createLanguageSelector($userContainer);
        }

        if (config.displayed.indexOf('newpad') !== -1) {
            var pads_options = [];
            ['pad', 'code', 'slide', 'poll'].forEach(function (p) {
                pads_options.push({
                    tag: 'a',
                    attributes: {
                        'target': '_blank', // TODO: open in the same window?
                        'href': '/' + p,
                    },
                    content: Messages.type[p] // Pretty name of the language value
                });
            });
            var $newButton = $('<div>').append($('<span>', {'class': 'fa fa-plus'})).append(Messages.newPadButton);
            var dropdownConfig = {
                text: $newButton.html(), // Button initial text
                options: pads_options, // Entries displayed in the menu
                left: true, // Open to the left of the button
            };
            var $newPadBlock = Cryptpad.createDropdown(dropdownConfig);
            $newPadBlock.find('button').attr('title', Messages.newPadButtonTitle);
            $newPadBlock.appendTo($userContainer);
        }

        // User dropdown
        if (config.displayed.indexOf('useradmin') !== -1) {
            if (!config.userName || !config.userName.setName || !config.userName.lastName) {
                throw new Error("You must provide a `userName` object containing `setName` (function) " +
                                "and `lastName` (object) if you want to display the user admin menu.")
            }
            var $displayedName = $('<span>', {'class': USERNAME_CLS});
            var accountName = Cryptpad.getStore().getLoginName ? Cryptpad.getStore().getLoginName() : null;
            var account = typeof accountName === "string";
            var $userAdminContent = $('<p>');
            if (account) {
                var $userAccount = $('<span>', {'class': 'userAccount'}).append(Messages.user_accountName + ': ' + accountName);
                $userAdminContent.append($userAccount);
                $userAdminContent.append($('<br>'));
            }
            var $userName = $('<span>', {'class': 'userDisplayName'});
            if (readOnly !== 1) {
                // Hide "Display name:" in read only mode
                $userName.append(Messages.user_displayName + ': ')
            }
            $userName.append($displayedName.clone());
            $userAdminContent.append($userName);
            var options = [{
                tag: 'p',
                attributes: {'class': 'accountData'},
                content: $userAdminContent.html()
            }];
            // Add the change display name button if not in read only mode
            if (readOnly !== 1) {
                options.push({
                    tag: 'a',
                    attributes: {'class': USERBUTTON_CLS},
                    content: Messages.user_rename
                });
            }
            // Add login or logout button depending on the current status
            if (account) {
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
            var $icon = $('<span>', {'class': 'fa fa-user'});
            var $button = $('<div>').append($icon).append($displayedName.clone());
            if (account) {
                $button.append($('<span>', {'class': 'account-name'}).text('(' + accountName + ')'));
            }
            var dropdownConfig = {
                text: $button.html(), // Button initial text
                options: options, // Entries displayed in the menu
                left: true, // Open to the left of the button
            };
            var $userAdmin = Cryptpad.createDropdown(dropdownConfig);
            $userContainer.append($userAdmin);

            $userAdmin.find('a.logout').click(function (e) {
                Cryptpad.logout();
                window.location.reload();
            });
            $userAdmin.find('a.login').click(function (e) {
                window.open('/user');
            });
            $userAdmin.find('a.register').click(function (e) {
                window.open('/user#register');
            });

            if (config.userName && config.userName.setName && config.userName.lastName) {
                $userAdmin.find('a.' + USERBUTTON_CLS).click(function (e) {
                    Cryptpad.prompt(Messages.changeNamePrompt, config.userName.lastName.lastName || '', function (newName) {
                        config.userName.setName(newName);
                    });
                });
            }
        }

        return $userContainer;
    };

    var createTitle = function ($container, readOnly, config, Cryptpad) {
        var $titleContainer = $('<span>', {
            id: 'toolbarTitle',
            'class': TITLE_CLS
        }).appendTo($container);

        if (!config || typeof config !== "object") { return; }

        var callback = config.onRename;
        var placeholder = config.defaultName;
        var suggestName = config.suggestName;

        // Buttons
        var $text = $('<span>', {
            'class': 'title'
        }).appendTo($titleContainer);
        var $pencilIcon = $('<span>', {
            'class': 'pencilIcon',
            'title': Messages.clickToEdit
        });
        if (readOnly === 1 || typeof(Cryptpad) === "undefined") { return $titleContainer; }
        var $input = $('<input>', {
            type: 'text',
            placeholder: placeholder
        }).appendTo($titleContainer).hide();
        if (readOnly !== 1) {
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
            if (e.which === 13) {
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
            }
            else if (e.which === 27) {
                $input.hide();
                $text.show();
                //$pencilIcon.css('display', '');
            }
        });

        var displayInput = function () {
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

    var create = Bar.create = function ($container, myUserName, realtime, getLag, userList, config) {
        config = config || {};
        var readOnly = (typeof config.readOnly !== "undefined") ? (config.readOnly ? 1 : 0) : -1;
        var Cryptpad = config.common;
        config.displayed = config.displayed || [];

        var toolbar = createRealtimeToolbar($container);
        var userListElement = createUserList(toolbar.find('.' + LEFTSIDE_CLS), config, readOnly, Cryptpad);
        var $titleElement = createTitle(toolbar.find('.' + TOP_CLS), readOnly, config.title, Cryptpad);
        var $linkElement = createLinkToMain(toolbar.find('.' + TOP_CLS));
        var lagElement = createLagElement();
        var $userAdminElement = createUserAdmin(toolbar.find('.' + TOP_CLS), config, readOnly, lagElement, Cryptpad);
        var spinner = createSpinner($userAdminElement, config);
        var userData = config.userData;
        // readOnly = 1 (readOnly enabled), 0 (disabled), -1 (old pad without readOnly mode)
        var saveElement;
        var loadElement;
        var $stateElement = toolbar.find('.' + STATE_CLS);

        var connected = false;

        if (config.ifrw) {
            var removeDropdowns =  function (e) {
                $container.find('.cryptpad-dropdown').hide();
            };
            var cancelEditTitle = function (e) {
                // Now we want to apply the title even if we click somewhere else
                if ($(e.target).parents('.' + TITLE_CLS).length || !$titleElement) {
                    return;
                }

                var e = jQuery.Event("keyup");
                e.which = 13;
                $titleElement.find('input').trigger(e);

                /*
                $titleElement.find('input').hide();
                $titleElement.find('span.title').show();
                $titleElement.find('span.pencilIcon').css('display', '');
                */
            };
            $(config.ifrw).on('click', removeDropdowns);
            $(config.ifrw).on('click', cancelEditTitle);

            try {
                if (config.ifrw.$('iframe').length) {
                    var innerIfrw = config.ifrw.$('iframe').each(function (i, el) {
                        $(el.contentWindow).on('click', removeDropdowns);
                        $(el.contentWindow).on('click', cancelEditTitle);
                    });
                }
            } catch (e) {
                // empty try catch in case this iframe is problematic
            }
        }

        // Update user list
        if (userData) {
            userList.change.push(function (newUserData) {
                var users = userList.users;
                if (users.indexOf(myUserName) !== -1) { connected = true; }
                if (!connected) { return; }
                checkSynchronizing(users, myUserName, $stateElement);
                updateUserList(config, myUserName, userListElement, users, userData, readOnly, $userAdminElement);
            });
        } else {
            userList.change.push(function () {
                var users = userList.users;
                if (users.indexOf(myUserName) !== -1) { connected = true; }
                if (!connected) { return; }
                checkSynchronizing(users, myUserName, $stateElement);
            });
        }
        // Display notifications when users are joining/leaving the session
        var oldUserData;
        if (typeof Cryptpad !== "undefined") {
            var notify = function(type, name, oldname) {
                // type : 1 (+1 user), 0 (rename existing user), -1 (-1 user)
                if (typeof name === "undefined") { return; }
                name = (name === "") ? Messages.anonymous : name;
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
            userList.change.push(function (newdata) {
                // Notify for disconnected users
                if (typeof oldUserData !== "undefined") {
                    for (var u in oldUserData) {
                        if (userList.users.indexOf(u) === -1) {
                            notify(-1, oldUserData[u].name);
                            delete oldUserData[u];
                        }
                    }
                }
                // Update the "oldUserData" object and notify for new users and names changed
                if (typeof newdata === "undefined") { return; }
                if (typeof oldUserData === "undefined") {
                    oldUserData = JSON.parse(JSON.stringify(newdata));
                    return;
                }
                if (readOnly === 0 && !oldUserData[myUserName]) {
                    oldUserData = JSON.parse(JSON.stringify(newdata));
                    return;
                }
                for (var k in newdata) {
                    if (k !== myUserName && userList.users.indexOf(k) !== -1) {
                        if (typeof oldUserData[k] === "undefined") {
                            notify(1, newdata[k].name);
                        } else if (oldUserData[k].name !== newdata[k].name) {
                            notify(0, newdata[k].name, oldUserData[k].name);
                        }
                    }
                }
                oldUserData = JSON.parse(JSON.stringify(newdata));
            });
        }

        var ks = function () {
            if (connected) { kickSpinner(spinner); }
        };

        realtime.onPatch(ks);
        // Try to filter out non-patch messages, doesn't have to be perfect this is just the spinner
        realtime.onMessage(function (msg) { if (msg.indexOf(':[2,') > -1) { ks(); } });

        checkLag(getLag, lagElement);
        setInterval(function () {
            if (!connected) { return; }
            checkLag(getLag, lagElement);
        }, 3000);

        return {
            failed: function () {
                connected = false;
                $stateElement.text(Messages.disconnected);
                checkLag(undefined, lagElement);
            },
            reconnecting: function (userId) {
                myUserName = userId;
                connected = false;
                $stateElement.text(Messages.reconnecting);
                checkLag(getLag, lagElement);
            },
            connected: function () {
                connected = true;
            }
        };
    };

    return Bar;
});
