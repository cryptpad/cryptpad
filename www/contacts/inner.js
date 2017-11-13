define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/toolbar3.js',
    '/bower_components/chainpad-json-validator/json-ot.js',
    '/common/cryptpad-common.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/hyperscript.js',
    '/contacts/messenger-ui.js',
    '/common/sframe-messenger-inner.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'less!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less2/main.less',
], function (
    $,
    Crypto,
    Toolbar,
    JsonOT,
    Cryptpad,
    nThen,
    SFCommon,
    h,
    UI,
    Messenger
    )
{
    var Messages = Cryptpad.Messages;
    var APP = {};
    var onConnectError = function () {
        UI.errorLoadingScreen(Messages.websocketError);
    };

    var common;
    var sFrameChan;
    nThen(function (waitFor) {
        $(waitFor(UI.addLoadingScreen));
        SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
    }).nThen(function (waitFor) {
        sFrameChan = common.getSframeChannel();
        sFrameChan.onReady(waitFor());
    }).nThen(function (/*waitFor*/) {
        Cryptpad.onError(function (info) {
            if (info && info.type === "store") {
                onConnectError();
            }
        });

        var toolbarElement = h('div#cp-toolbar.cp-toolbar-container');

        document.body.appendChild(toolbarElement);

        var messaging = h('div#cp-app-contacts-messaging', [
            h('div.cp-app-contacts-info', [
                h('h2', Messages.contacts_info1),
                h('ul', [
                    h('li', Messages.contacts_info2),
                    h('li', Messages.contacts_info3),
                ])
            ])
        ]);

        var friendList = h('div#cp-app-contacts-friendlist');

        var appElement = h('div#cp-app-contacts-container', [
            friendList,
            messaging,
        ]);

        document.body.appendChild(appElement);

        var displayed = ['useradmin', 'newpad', 'limit', 'pageTitle'];
        var configTb = {
            displayed: displayed,
            common: Cryptpad,
            sfCommon: common,
            $container: $(toolbarElement),
            network: Cryptpad.getNetwork(),
            pageTitle: Messages.contacts_title,
            metadataMgr: common.getMetadataMgr(),
        };
        APP.toolbar = Toolbar.create(configTb);
        APP.toolbar.$rightside.hide();

        var messenger = Messenger.create(sFrameChan);

        UI.create(messenger, $(friendList), $(messaging), common);

        UI.removeLoadingScreen();

/*
        sFrameChan.query('Q_HEY_BUDDY', null, function (err, data) {
            if (!data) { return; }
            if (data.error) {
                UI.warn(data.error);
            } else {
                UI.log(data.response);
            }
        });*/
    });
});
