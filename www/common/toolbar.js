define([
    '/customize/messages.js',
    '/bower_components/jquery/dist/jquery.min.js',
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

    var LEFTSIDE_CLS = Bar.constants.leftside = 'cryptpad-toolbar-leftside';
    var RIGHTSIDE_CLS = Bar.constants.rightside = 'cryptpad-toolbar-rightside';

    var SPINNER_CLS = Bar.constants.spinner = 'cryptpad-spinner';

    var USERNAME_CLS = Bar.constants.username = 'cryptpad-toolbar-username';

    var READONLY_CLS = Bar.constants.readonly = 'cryptpad-readonly';
    /** Key in the localStore which indicates realtime activity should be disallowed. */
    // TODO remove? will never be used in cryptpad
    var LOCALSTORAGE_DISALLOW = Bar.constants.localstorageDisallow = 'cryptpad-disallow';

    var SPINNER_DISAPPEAR_TIME = 3000;
    var SPINNER = [ '-', '\\', '|', '/' ];

    var uid = function () {
        return 'cryptpad-uid-' + String(Math.random()).substring(2);
    };

    var $style;

    var firstConnection = true;

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
        .append($('<div>', {'class': LEFTSIDE_CLS}))
        .append($('<div>', {'class': RIGHTSIDE_CLS}));

        $container.prepend($toolbar);
        styleToolbar($container);
        return $toolbar;
    };

    var createSpinner = function ($container) {
        var $spinner = $('<div>', {
            id: uid(),
            'class': SPINNER_CLS,
        });
        $container.append($spinner);
        return $spinner[0];
    };

    var kickSpinner = function (spinnerElement, reversed) {
        var txt = spinnerElement.textContent || '-';
        var inc = (reversed) ? -1 : 1;
        spinnerElement.textContent = SPINNER[(SPINNER.indexOf(txt) + inc) % SPINNER.length];
        if (spinnerElement.timeout) { clearTimeout(spinnerElement.timeout); }
        spinnerElement.timeout = setTimeout(function () {
            spinnerElement.textContent = '';
        }, SPINNER_DISAPPEAR_TIME);
    };

    var createUserList = function ($container) {
        var $userlist = $('<div>', {
            'class': USER_LIST_CLS,
            id: uid(),
        });
        $container.append($userlist);
        return $userlist[0];
    };

    var getOtherUsers = function(myUserName, userList, userData) {
      var i = 0;
      var list = '';
      userList.forEach(function(user) {
        if(user !== myUserName) {
          var data = (userData) ? (userData[user] || null) : null;
          var userName = (data) ? data.name : null;
          if(userName) {
            if(i === 0) { list = ' : '; }
            list += userName + ', ';
            i++;
          }
        }
      });
      return (i > 0) ? list.slice(0, -2) : list;
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
    var updateUserList = function (myUserName, listElement, userList, userData, readOnly) {
        var meIdx = userList.indexOf(myUserName);
        if (meIdx === -1) {
            listElement.textContent = Messages.synchronizing;
            return;
        }
        var numberOfUsers = userList.length;
        userList = readOnly === -1 ? userList : arrayIntersect(userList, Object.keys(userData));
        var innerHTML;
        var numberOfViewUsers = numberOfUsers - userList.length;
        if (readOnly === 1) {
            innerHTML = '<span class="' + READONLY_CLS + '">' + Messages.readonly + '</span>';
            if (userList.length === 0) {
                innerHTML += Messages.nobodyIsEditing;
            } else if (userList.length === 1) {
                innerHTML += Messages.onePersonIsEditing + getOtherUsers(myUserName, userList, userData);
            } else {
                innerHTML += Messages._getKey('peopleAreEditing', [userList.length]) + getOtherUsers(myUserName, userList, userData);
            }
            // Remove the current user
            numberOfViewUsers--;
        }
        else {
            if (userList.length === 1) {
                innerHTML = Messages.editingAlone;
            } else if (userList.length === 2) {
                innerHTML = Messages.editingWithOneOtherPerson + getOtherUsers(myUserName, userList, userData);
            } else {
                innerHTML = Messages.editingWith + ' ' + (userList.length - 1) + ' ' + Messages.otherPeople + getOtherUsers(myUserName, userList, userData);
            }
        }
        innerHTML += getViewers(numberOfViewUsers);
        if (userData[myUserName]) {
            var name = userData[myUserName].name;
            if (!name) {
                name = '<span title="' + Messages.anonymous + '" class="fa fa-user-secret" style="font-family:FontAwesome"></span>';
            }
            innerHTML = '<span class="' + USERNAME_CLS + '">' + name + '</span> | ' + innerHTML;
        }
        listElement.innerHTML = innerHTML;
    };

    var createLagElement = function ($container) {
        var $lag = $('<div>', {
            'class': LAG_ELEM_CLS,
            id: uid(),
        });
        $container.append($lag);
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
        if(lag) {
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
        else if (!firstConnection){
          lagLight.addClass('lag-red');
          title = Messages.redLight;
        }
        lagLight.attr('title', title);
        $(lagElement).html('');
        $(lagElement).append(lagLight);
    };

    var create = Bar.create = function ($container, myUserName, realtime, getLag, userList, config) {
        var toolbar = createRealtimeToolbar($container);
        var userListElement = createUserList(toolbar.find('.' + LEFTSIDE_CLS));
        var spinner = createSpinner(toolbar.find('.' + RIGHTSIDE_CLS));
        var lagElement = createLagElement(toolbar.find('.' + RIGHTSIDE_CLS));
        var userData = config.userData;
        // readOnly = 1 (readOnly enabled), 0 (disabled), -1 (old pad without readOnly mode)
        var readOnly = (typeof config.readOnly !== "undefined") ? (config.readOnly ? 1 : 0) : -1;
        var saveElement;
        var loadElement;

        var connected = false;

        userList.onChange = function(newUserData) {
          var users = userList.users;
          if (users.indexOf(myUserName) !== -1) { connected = true; }
          if (!connected) { return; }
          if(newUserData) { // Someone has changed his name/color
            userData = newUserData;
          }
          updateUserList(myUserName, userListElement, users, userData, readOnly);
        };

        var ks = function () {
            if (connected) { kickSpinner(spinner, false); }
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
                userListElement.textContent = Messages.disconnected;
                checkLag(undefined, lagElement);
            },
            reconnecting: function (userId) {
                myUserName = userId;
                connected = false;
                userListElement.textContent = Messages.reconnecting;
                checkLag(getLag, lagElement);
            },
            connected: function () {
                connected = true;
            }
        };
    };

    return Bar;
});
