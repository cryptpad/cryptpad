define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/toolbar2.js',
    '/common/cryptpad-common.js',

    '/common/common-messenger.js',
    '/contacts/messenger-ui.js',

    'less!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less/cryptpad.less',
], function ($, Crypto, Toolbar, Cryptpad, Messenger, UI) {
    var Messages = Cryptpad.Messages;

    var APP = window.APP = {
        Cryptpad: Cryptpad
    };

    $(function () {

    var andThen = function () {
        Cryptpad.addLoadingScreen();

        var ifrw = $('#pad-iframe')[0].contentWindow;
        var $iframe = $('#pad-iframe').contents();
        var $list = $iframe.find('#friendList');
        var $messages = $iframe.find('#messaging');
        var $bar = $iframe.find('.toolbar-container');

        var displayed = ['useradmin', 'newpad', 'limit', 'pageTitle'];

        var configTb = {
            displayed: displayed,
            ifrw: ifrw,
            common: Cryptpad,
            $container: $bar,
            network: Cryptpad.getNetwork(),
            pageTitle: Messages.contacts_title,
        };
        var toolbar = APP.toolbar = Toolbar.create(configTb);
        toolbar.$rightside.html(''); // Remove the drawer if we don't use it to hide the toolbar

        Cryptpad.getProxy().on('disconnect', function () {
            Cryptpad.alert(Messages.common_connectionLost, undefined, true);
        });
        Cryptpad.getProxy().on('reconnect', function (uid) {
            console.error('reconnecting: ', uid);
            Cryptpad.findOKButton().click();
        });

        var $infoBlock = $('<div>', {'class': 'info'}).appendTo($messages);
        $('<h2>').text(Messages.contacts_info1).appendTo($infoBlock);
        var $ul = $('<ul>').appendTo($infoBlock);
        $('<li>').text(Messages.contacts_info2).appendTo($ul);
        $('<li>').text(Messages.contacts_info3).appendTo($ul);

        var messenger = window.messenger = Messenger.messenger(Cryptpad);
        UI.create(messenger, $list, $messages);
    };

    Cryptpad.ready(function () {
        andThen();
        Cryptpad.reportAppUsage();
    });

    });
});
