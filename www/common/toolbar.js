define([
    '/common/messages.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Messages) {
    var $ = window.jQuery;

    var Bar = {
        constants: {},
    };

    /** Id of the div containing the user list. */
    var USER_LIST_CLS = Bar.constants.userlist = 'cryptpad-user-list';

    /** Id of the button to change my username. */
    var USERNAME_BUTTON_GROUP = Bar.constants.changeName = 'cryptpad-changeName';

    /** Id of the div containing the lag info. */
    var LAG_ELEM_CLS = Bar.constants.lag = 'cryptpad-lag';

    /** The toolbar class which contains the user list, debug link and lag. */
    var TOOLBAR_CLS = Bar.constants.toolbar = 'cryptpad-toolbar';

    var LEFTSIDE_CLS = Bar.constants.leftside = 'cryptpad-toolbar-leftside';
    var RIGHTSIDE_CLS = Bar.constants.rightside = 'cryptpad-toolbar-rightside';

    var BACK_CLS = Bar.constants.back = 'cryptpad-back';

    var SPINNER_CLS = Bar.constants.spinner = 'cryptpad-spinner';

    /** Key in the localStore which indicates realtime activity should be disallowed. */
    // TODO remove? will never be used in cryptpad
    var LOCALSTORAGE_DISALLOW = Bar.constants.localstorageDisallow = 'cryptpad-disallow';

    var SPINNER_DISAPPEAR_TIME = 3000;
    var SPINNER = [ '-', '\\', '|', '/' ];

    var uid = function () {
        return 'cryptpad-uid-' + String(Math.random()).substring(2);
    };

    var $style;

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

    var createEscape = function ($container) {
        var $back = $('<div>', {
            'class': BACK_CLS,
            id: uid(),
        }).html('&#8656; Back').click(function () {
            window.location.href = '/';
        });
        $container.append($back);
        return $back[0];
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

    var createChangeName = function($container, userList, buttonID) {
        var $span = $('<span>', {
            id: uid(),
        });
        var $button = $('<button>', {
            id: buttonID,
            'class': USERNAME_BUTTON_GROUP,
        }).text('Change name');

        $(userList).append($button);
        $button.after($span);
        return $span[0];
    };

    var updateUserList = function (myUserName, listElement, userList, userData) {
        var meIdx = userList.indexOf(myUserName);
        if (meIdx === -1) {
            listElement.textContent = Messages.synchronizing;
            return;
        }
        if (userList.length === 1) {
            listElement.innerHTML = Messages.editingAlone;
        } else if (userList.length === 2) {
            listElement.innerHTML = Messages.editingWithOneOtherPerson + getOtherUsers(myUserName, userList, userData);
        } else {
            listElement.innerHTML = Messages.editingWith + ' ' + (userList.length - 1) + ' ' + Messages.otherPeople + getOtherUsers(myUserName, userList, userData);
        }
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
        if(typeof getLag !== "function") { return; }
        var lag = getLag();
        var lagMsg = Messages.lag + ' ';
        if(lag) {
          var lagSec = lag/1000;
          if (lag.waiting && lagSec > 1) {
              lagMsg += "?? " + Math.floor(lagSec);
          } else {
              lagMsg += lagSec;
          }
        }
        else {
          lagMsg += "??";
        }
        lagElement.textContent = lagMsg;
    };

    var create = Bar.create = function ($container, myUserName, realtime, getLag, userList, config) {
        var toolbar = createRealtimeToolbar($container);
        createEscape(toolbar.find('.' + LEFTSIDE_CLS));
        var userListElement = createUserList(toolbar.find('.' + LEFTSIDE_CLS));
        var spinner = createSpinner(toolbar.find('.' + RIGHTSIDE_CLS));
        var lagElement = createLagElement(toolbar.find('.' + RIGHTSIDE_CLS));
        var userData = config.userData;
        var changeNameID = config.changeNameID;
        var saveContentID = config.saveContentID || config.exportContentID;
        var loadContentID = config.loadContentID || config.importContentID;
        var saveElement;
        var loadElement;

        // Check if the user is allowed to change his name
        if(changeNameID) {
            // Create the button and update the element containing the user list
            userListElement = createChangeName($container, userListElement, changeNameID);
        }

        var connected = false;

        userList.onChange = function(newUserData) {
          var users = userList.users;
          if (users.indexOf(myUserName) !== -1) { connected = true; }
          if (!connected) { return; }
          if(newUserData) { // Someone has changed his name/color
            userData = newUserData;
          }
          updateUserList(myUserName, userListElement, users, userData);
        };

        var ks = function () {
            if (connected) { kickSpinner(spinner, false); }
        };

        realtime.onPatch(ks);
        // Try to filter out non-patch messages, doesn't have to be perfect this is just the spinner
        realtime.onMessage(function (msg) { if (msg.indexOf(':[2,') > -1) { ks(); } });

        setInterval(function () {
            if (!connected) { return; }
            checkLag(getLag, lagElement);
        }, 3000);

        return {
            failed: function () {
                connected = false;
                userListElement.textContent = '';
                lagElement.textContent = '';
            },
            reconnecting: function () {
                connected = false;
                userListElement.textContent = Messages.reconnecting;
                lagElement.textContent = '';
            },
            connected: function () {
                connected = true;
            }
        };
    };

    return Bar;
});
