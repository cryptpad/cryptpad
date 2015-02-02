define([
    '/common/messages.js'
], function (Messages) {

    /** Id of the element for getting debug info. */
    var DEBUG_LINK_CLS = 'rtwysiwyg-debug-link';

    /** Id of the div containing the user list. */
    var USER_LIST_CLS = 'rtwysiwyg-user-list';

    /** Id of the div containing the lag info. */
    var LAG_ELEM_CLS = 'rtwysiwyg-lag';

    /** The toolbar class which contains the user list, debug link and lag. */
    var TOOLBAR_CLS = 'rtwysiwyg-toolbar';

    /** Key in the localStore which indicates realtime activity should be disallowed. */
    var LOCALSTORAGE_DISALLOW = 'rtwysiwyg-disallow';

    var SPINNER_DISAPPEAR_TIME = 3000;
    var SPINNER = [ '-', '\\', '|', '/' ];

    var uid = function () {
        return 'rtwysiwyg-uid-' + String(Math.random()).substring(2);
    };

    var createRealtimeToolbar = function ($container) {
        var id = uid();
        $container.prepend(
            '<div class="' + TOOLBAR_CLS + '" id="' + id + '">' +
                '<div class="rtwysiwyg-toolbar-leftside"></div>' +
                '<div class="rtwysiwyg-toolbar-rightside"></div>' +
            '</div>'
        );
        var toolbar = $container.find('#'+id);
        toolbar.append([
            '<style>',
            '.' + TOOLBAR_CLS + ' {',
            '    color: #666;',
            '    font-weight: bold;',
//            '    background-color: #f0f0ee;',
//            '    border-bottom: 1px solid #DDD;',
//            '    border-top: 3px solid #CCC;',
//            '    border-right: 2px solid #CCC;',
//            '    border-left: 2px solid #CCC;',
            '    height: 26px;',
            '    margin-bottom: -3px;',
            '    display: inline-block;',
            '    width: 100%;',
            '}',
            '.' + TOOLBAR_CLS + ' a {',
            '    float: right;',
            '}',
            '.' + TOOLBAR_CLS + ' div {',
            '    padding: 0 10px;',
            '    height: 1.5em;',
//            '    background: #f0f0ee;',
            '    line-height: 25px;',
            '    height: 22px;',
            '}',
            '.' + TOOLBAR_CLS + ' div.rtwysiwyg-back {',
            '    padding: 0;',
            '    font-weight: bold;',
            '    cursor: pointer;',
            '    color: #000;',
            '}',
            '.rtwysiwyg-toolbar-leftside div {',
            '    float: left;',
            '}',
            '.rtwysiwyg-toolbar-leftside {',
            '    float: left;',
            '}',
            '.rtwysiwyg-toolbar-rightside {',
            '    float: right;',
            '}',
            '.rtwysiwyg-lag {',
            '    float: right;',
            '}',
            '.rtwysiwyg-spinner {',
            '    float: left;',
            '}',
            '.gwt-TabBar {',
            '    display:none;',
            '}',
            '.' + DEBUG_LINK_CLS + ':link { color:transparent; }',
            '.' + DEBUG_LINK_CLS + ':link:hover { color:blue; }',
            '.gwt-TabPanelBottom { border-top: 0 none; }',

            '</style>'
         ].join('\n'));
        return toolbar;
    };

    var createEscape = function ($container) {
        var id = uid();
        $container.append('<div class="rtwysiwyg-back" id="' + id + '">&#8656; Back</div>');
        var $ret = $container.find('#'+id);
        $ret.on('click', function () {
            window.location.href = '/';
        });
        return $ret[0];
    };

    var createSpinner = function ($container) {
        var id = uid();
        $container.append('<div class="rtwysiwyg-spinner" id="'+id+'"></div>');
        return $container.find('#'+id)[0];
    };

    var kickSpinner = function (spinnerElement, reversed) {
        var txt = spinnerElement.textContent || '-';
        var inc = (reversed) ? -1 : 1;
        spinnerElement.textContent = SPINNER[(SPINNER.indexOf(txt) + inc) % SPINNER.length];
        spinnerElement.timeout && clearTimeout(spinnerElement.timeout);
        spinnerElement.timeout = setTimeout(function () {
            spinnerElement.textContent = '';
        }, SPINNER_DISAPPEAR_TIME);
    };

    var createUserList = function ($container) {
        var id = uid();
        $container.append('<div class="' + USER_LIST_CLS + '" id="'+id+'"></div>');
        return $container.find('#'+id)[0];
    };

    var updateUserList = function (myUserName, listElement, userList) {
        var meIdx = userList.indexOf(myUserName);
        if (meIdx === -1) {
            listElement.textContent = Messages.synchronizing;
            return;
        }
        if (userList.length === 1) {
            listElement.textContent = Messages.editingAlone;
        } else if (userList.length === 2) {
            listElement.textContent = Messages.editingWithOneOtherPerson;
        } else {
            listElement.textContent = Messages.editingWith + ' ' + (userList.length - 1) + ' '
                Messages.otherPeople;
        }
    };

    var createLagElement = function ($container) {
        var id = uid();
        $container.append('<div class="' + LAG_ELEM_CLS + '" id="'+id+'"></div>');
        return $container.find('#'+id)[0];
    };

    var checkLag = function (realtime, lagElement) {
        var lag = realtime.getLag();
        var lagSec = lag.lag/1000;
        var lagMsg = Messages.lag + ' ';
        if (lag.waiting && lagSec > 1) {
            lagMsg += "?? " + Math.floor(lagSec);
        } else {
            lagMsg += lagSec;
        }
        lagElement.textContent = lagMsg;
    };

    var create = function ($container, myUserName, realtime) {
        var toolbar = createRealtimeToolbar($container);
        createEscape(toolbar.find('.rtwysiwyg-toolbar-leftside'));
        var userListElement = createUserList(toolbar.find('.rtwysiwyg-toolbar-leftside'));
        var spinner = createSpinner(toolbar.find('.rtwysiwyg-toolbar-rightside'));
        var lagElement = createLagElement(toolbar.find('.rtwysiwyg-toolbar-rightside'));

        var connected = false;

        realtime.onUserListChange(function (userList) {
            if (userList.indexOf(myUserName) !== -1) { connected = true; }
            if (!connected) { return; }
            updateUserList(myUserName, userListElement, userList);
        });

        var ks = function () {
            if (connected) { kickSpinner(spinner, false); }
        };

        realtime.onPatch(ks);
        // Try to filter out non-patch messages, doesn't have to be perfect this is just the spinner
        realtime.onMessage(function (msg) { if (msg.indexOf(':[2,') > -1) { ks(); } });

        setInterval(function () {
            if (!connected) { return; }
            checkLag(realtime, lagElement);
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

    return { create: create };
});
